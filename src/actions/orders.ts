"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { 
  sendEmail, 
  generateStudentOrderReceiptEmail, 
  generateVendorNewOrderAlertEmail, 
  generateAdminPlatformOrderAlertEmail 
} from "@/lib/email";

export interface CreateOrderInput {
  userId?: string;
  userEmail?: string;
  userName?: string;
  storeId?: string;
  totalAmount: number;
  deliveryLocation: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentReference?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

export async function createLiveOrder(input: CreateOrderInput) {
  try {
    // 1. Resolve User
    let userId = input.userId;
    if (!userId && input.userEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.userEmail },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: input.userEmail,
            name: input.userName || "Campus Student",
          },
        });
        userId = newUser.id;
      }
    }

    if (!userId) {
      // Fallback to first student user or demo user
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        const fallbackUser = await prisma.user.create({
          data: {
            email: "student@campuslightson.com",
            name: "Campus Student",
          },
        });
        userId = fallbackUser.id;
      }
    }

    // 2. Resolve Store
    let storeId = input.storeId;
    if (!storeId) {
      const firstStore = await prisma.store.findFirst();
      if (firstStore) {
        storeId = firstStore.id;
      }
    }

    if (!storeId) {
      return { success: false, error: "No store found to assign order" };
    }

    // 3. Create Order & OrderItems in Database
    const order = await prisma.order.create({
      data: {
        userId,
        storeId,
        totalAmount: input.totalAmount,
        status: OrderStatus.PENDING,
        deliveryLocation: input.deliveryLocation,
        deliveryInstructions: input.deliveryInstructions || null,
        paymentReference: input.paymentReference || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        store: {
          include: {
            user: true,
          },
        },
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Revalidate dashboards so real-time data syncs instantly
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orders");

    // Format item details for email templates
    const orderItemsForEmail = order.items.map((it) => ({
      name: it.product?.name || "Campus Item",
      quantity: it.quantity,
      price: it.price,
    }));

    const displayOrderId = order.id.slice(-6).toUpperCase();

    // 4. Send Order Confirmation Receipt to Student
    if (input.userEmail || order.user?.email) {
      const studentEmail = input.userEmail || order.user?.email;
      if (studentEmail) {
        const studentHtml = generateStudentOrderReceiptEmail({
          customerName: input.userName || order.user?.name || "Campus Student",
          orderId: displayOrderId,
          storeName: order.store.name,
          deliveryLocation: order.deliveryLocation,
          deliveryInstructions: order.deliveryInstructions,
          items: orderItemsForEmail,
          totalAmount: order.totalAmount,
        });

        sendEmail({
          to: studentEmail,
          subject: `Order Confirmed (#${displayOrderId}) - ${order.store.name}`,
          html: studentHtml,
        }).catch((e) => console.error("Failed to send student receipt email:", e));
      }
    }

    // 5. Send Urgent New Order Alert to Vendor (Store Owner)
    const vendorEmail = order.store.user?.email;
    if (vendorEmail) {
      const vendorHtml = generateVendorNewOrderAlertEmail({
        storeName: order.store.name,
        orderId: displayOrderId,
        customerName: input.userName || order.user?.name || "Campus Student",
        customerPhone: order.user?.phone || null,
        deliveryLocation: order.deliveryLocation,
        deliveryInstructions: order.deliveryInstructions,
        items: orderItemsForEmail,
        totalAmount: order.totalAmount,
      });

      sendEmail({
        to: vendorEmail,
        subject: `🚨 NEW ORDER #${displayOrderId} - ${order.store.name} Kitchen Alert!`,
        html: vendorHtml,
      }).catch((e) => console.error("Failed to send vendor alert email:", e));
    }

    // 6. Send Transaction Notification to Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campuslightson.com";
    const adminHtml = generateAdminPlatformOrderAlertEmail({
      orderId: displayOrderId,
      storeName: order.store.name,
      customerName: input.userName || order.user?.name || "Campus Student",
      totalAmount: order.totalAmount,
      deliveryLocation: order.deliveryLocation,
    });

    sendEmail({
      to: adminEmail,
      subject: `[LIGHTSON ADMIN] New Order #${displayOrderId} - ₦${order.totalAmount.toLocaleString()}`,
      html: adminHtml,
    }).catch((e) => console.error("Failed to send admin order notification:", e));

    return { success: true, order };
  } catch (error: any) {
    console.error("Error creating live order:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}

export async function getLiveOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          include: {
            user: true,
          },
        },
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch order" };
  }
}

export async function getUserOrders(userEmail?: string) {
  try {
    if (!userEmail) {
      return { success: true, orders: [] };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        orders: {
          include: {
            store: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user || !user.orders || user.orders.length === 0) {
      return { success: true, orders: [] };
    }

    const orders = user.orders.map((order) => {
      const itemsSummary = order.items
        .map((it) => `${it.quantity}x ${it.product?.name || "Campus Item"}`)
        .join(" + ");

      const isDelivered = order.status === OrderStatus.DELIVERED;

      return {
        id: order.id,
        vendorId: order.store.id,
        vendorName: order.store.name,
        vendorAvatar: order.store.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
        total: order.totalAmount,
        status: order.status,
        itemsSummary: itemsSummary || "Campus Order",
        date: new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        etaMins: isDelivered ? undefined : 15,
      };
    });

    return { success: true, orders };
  } catch (error: any) {
    console.error("Error fetching user orders:", error);
    return { success: false, error: error.message || "Failed to load orders", orders: [] };
  }
}
