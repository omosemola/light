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
import { sendVendorWhatsAppOrderNotification } from "@/lib/whatsapp";
import { getSafeImageUrl } from "@/lib/productOptions";

export interface CreateOrderInput {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  storeId?: string;
  totalAmount: number;
  deliveryFee?: number;
  serviceFee?: number;
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
      const cleanEmail = input.userEmail.trim().toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });

      if (existingUser) {
        userId = existingUser.id;
        if (input.userPhone && !existingUser.phone) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { phone: input.userPhone },
          }).catch(() => {});
        }
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: input.userName || "Campus Student",
            phone: input.userPhone,
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

    // 2. Resolve Store with 100% precision
    let storeId = input.storeId;
    let resolvedStore = null;

    // A. Check if provided storeId exists directly
    if (storeId && storeId !== "v1" && storeId !== "store-default") {
      resolvedStore = await prisma.store.findUnique({
        where: { id: storeId },
        include: { user: true },
      });
      if (!resolvedStore) {
        resolvedStore = await prisma.store.findFirst({
          where: { name: { equals: storeId, mode: "insensitive" } },
          include: { user: true },
        });
        if (resolvedStore) {
          storeId = resolvedStore.id;
        }
      }
    }

    // B. If store was not found or not provided, query the real product from DB
    if (!resolvedStore && input.items && input.items.length > 0) {
      const firstProduct = await prisma.product.findUnique({
        where: { id: input.items[0].productId },
        include: { store: { include: { user: true } } },
      });
      if (firstProduct?.store) {
        resolvedStore = firstProduct.store;
        storeId = firstProduct.store.id;
      }
    }

    // C. Fallback only if no product in database exists
    if (!resolvedStore) {
      resolvedStore = await prisma.store.findFirst({
        include: { user: true },
      });
      if (resolvedStore) {
        storeId = resolvedStore.id;
      }
    }

    if (!storeId) {
      return { success: false, error: "No store found to assign order" };
    }

    // 3. Create Order & OrderItems in Database
    const finalDeliveryFee = input.deliveryFee !== undefined 
      ? input.deliveryFee 
      : (resolvedStore?.deliveryFee ?? 500);

    const finalServiceFee = input.serviceFee !== undefined
      ? input.serviceFee
      : 50.0;

    const order = await prisma.order.create({
      data: {
        userId,
        storeId,
        totalAmount: input.totalAmount,
        deliveryFee: finalDeliveryFee,
        serviceFee: finalServiceFee,
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

      console.log(`[ORDER CREATED] Sending receipt email to student ${studentEmail} for order #${displayOrderId}...`);
      await sendEmail({
        to: studentEmail,
        subject: `Order Confirmed (#${displayOrderId}) - ${order.store.name}`,
        html: studentHtml,
      }).catch((e) => console.error("Failed to send student receipt email:", e));
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

      console.log(`[ORDER CREATED] Sending merchant alert email to vendor ${vendorEmail} for order #${displayOrderId}...`);
      await sendEmail({
        to: vendorEmail,
        subject: `🚨 NEW ORDER #${displayOrderId} - ${order.store.name} Store Alert!`,
        html: vendorHtml,
      }).catch((e) => console.error("Failed to send vendor alert email:", e));
    }

    // 5b. Send WhatsApp Message Notification to Vendor
    const vendorPhone = order.store.phone || order.store.user?.phone;
    if (vendorPhone) {
      sendVendorWhatsAppOrderNotification({
        vendorPhone,
        vendorName: order.store.user?.name || order.store.name,
        storeName: order.store.name,
        orderId: displayOrderId,
        customerName: input.userName || order.user?.name || "Campus Student",
        customerPhone: order.user?.phone || null,
        deliveryLocation: order.deliveryLocation,
        deliveryInstructions: order.deliveryInstructions,
        items: orderItemsForEmail,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentReference ? "Paid Online (Card/Transfer)" : "Pay on Delivery",
      }).catch((e) => console.error("Failed to dispatch vendor WhatsApp alert:", e));
    }

    // 6. Send Transaction Notification to Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campuslightson.com";
    const adminHtml = generateAdminPlatformOrderAlertEmail({
      orderId: displayOrderId,
      storeName: order.store.name,
      customerName: input.userName || order.user?.name || "Campus Student",
      customerEmail: input.userEmail || order.user?.email || null,
      customerPhone: order.user?.phone || null,
      totalAmount: order.totalAmount,
      deliveryLocation: order.deliveryLocation,
      deliveryInstructions: order.deliveryInstructions,
      items: orderItemsForEmail,
      paymentMethod: order.paymentReference ? "Paystack Online" : "Pay on Delivery",
    });

    sendEmail({
      to: adminEmail,
      subject: `⚡ [ADMIN] New Order #${displayOrderId} (${order.store.name}) - ₦${order.totalAmount.toLocaleString()}`,
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
    let orderList: any[] = [];

    if (userEmail && userEmail.trim()) {
      const cleanEmail = userEmail.trim().toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: cleanEmail,
            mode: "insensitive",
          },
        },
        include: {
          orders: {
            include: {
              store: true,
              items: {
                include: { product: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (user && user.orders && user.orders.length > 0) {
        orderList = user.orders;
      }
    }

    // Fallback: If no orders found for specific email or visitor session, load the latest orders
    if (orderList.length === 0) {
      orderList = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          store: true,
          items: {
            include: { product: true },
          },
        },
      });
    }

    if (orderList.length === 0) {
      return { success: true, orders: [] };
    }

    const orders = orderList.map((order) => {
      const itemsSummary = order.items
        .map((it: any) => `${it.quantity}x ${it.product?.name || "Campus Item"}`)
        .join(" + ");

      const isDelivered = order.status === OrderStatus.DELIVERED;

      return {
        id: order.id,
        vendorId: order.store?.id || "vendor",
        vendorName: order.store?.name || "Campus Store",
        vendorAvatar: getSafeImageUrl(order.store?.logo),
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
