"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { clearMarketplaceCache } from "@/actions/marketplace";
import { 
  sendEmail, 
  generateStudentOrderReceiptEmail, 
  generateVendorNewOrderAlertEmail, 
  generateAdminPlatformOrderAlertEmail,
  notifyAdminNewStudent,
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
    // 1. Resolve User (Strict Isolation: Never attach to random existing accounts)
    let userId: string | null = null;

    // A. If an explicit userId was supplied, verify it exists
    if (input.userId) {
      const existingById = await prisma.user.findUnique({
        where: { id: input.userId },
      });
      if (existingById) {
        userId = existingById.id;
        if (input.userPhone && !existingById.phone) {
          await prisma.user.update({
            where: { id: existingById.id },
            data: { phone: input.userPhone.trim() },
          }).catch(() => {});
        }
      }
    }

    // B. Resolve by Email if provided
    if (!userId && input.userEmail && input.userEmail.trim()) {
      const cleanEmail = input.userEmail.trim().toLowerCase();
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });

      if (existingUser) {
        userId = existingUser.id;
        if (input.userPhone && !existingUser.phone) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { phone: input.userPhone.trim() },
          }).catch(() => {});
        }
      } else {
        try {
          const newUser = await prisma.user.create({
            data: {
              email: cleanEmail,
              name: input.userName?.trim() || "Campus Student",
              phone: input.userPhone?.trim() || null,
              role: Role.STUDENT,
            },
          });
          userId = newUser.id;

          notifyAdminNewStudent({
            name: newUser.name || input.userName || "Campus Student",
            email: newUser.email,
            phone: newUser.phone || input.userPhone || null,
            hostel: input.deliveryLocation || null,
            source: "First-Time Checkout Order",
          }).catch((e) => console.error("Admin student alert failed:", e));
        } catch {
          // If race condition on email unique constraint, re-fetch
          const fallbackByEmail = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: "insensitive" } },
          });
          if (fallbackByEmail) userId = fallbackByEmail.id;
        }
      }
    }

    // C. Resolve by Phone if no email was supplied
    if (!userId && input.userPhone && input.userPhone.trim()) {
      const rawPhone = input.userPhone.trim();
      const cleanDigits = rawPhone.replace(/\D/g, "");
      const phoneCandidateEmail = `student_${cleanDigits}@campuslightson.com`;

      const existingByPhone = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: rawPhone },
            { phone: cleanDigits },
            { email: phoneCandidateEmail },
          ],
        },
      });

      if (existingByPhone) {
        userId = existingByPhone.id;
      } else {
        try {
          const newPhoneUser = await prisma.user.create({
            data: {
              email: phoneCandidateEmail,
              name: input.userName?.trim() || "Campus Student",
              phone: rawPhone,
              role: Role.STUDENT,
            },
          });
          userId = newPhoneUser.id;
        } catch {
          const fallbackPhoneUser = await prisma.user.findFirst({
            where: { email: phoneCandidateEmail },
          });
          if (fallbackPhoneUser) userId = fallbackPhoneUser.id;
        }
      }
    }

    // D. Anonymous Guest Fallback (Dedicated isolated guest record)
    if (!userId) {
      const uniqueGuestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@guest.lightsonmarketplace.com`;
      const guestUser = await prisma.user.create({
        data: {
          email: uniqueGuestEmail,
          name: input.userName?.trim() || "Campus Guest",
          phone: input.userPhone?.trim() || null,
          role: Role.STUDENT,
        },
      });
      userId = guestUser.id;
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

    // C. If still no store could be resolved, fail cleanly rather than assigning to a random vendor
    if (!resolvedStore || !storeId) {
      return { 
        success: false, 
        error: "The store for these items could not be found or is no longer active. Please refresh your cart or contact support." 
      };
    }

    // 3. Create Order & OrderItems in Database
    const finalDeliveryFee = input.deliveryFee !== undefined 
      ? input.deliveryFee 
      : (resolvedStore?.deliveryFee ?? 500);

    const finalServiceFee = input.serviceFee !== undefined
      ? input.serviceFee
      : 0.0;

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

    // Revalidate marketplace cache & dashboards so real-time data syncs instantly
    await clearMarketplaceCache({ storeId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orders");
    revalidatePath(`/orders/${order.id}`);

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

    const resolvedPaymentMethod = input.paymentMethod || (
      order.paymentReference?.startsWith("TRANSFER-")
        ? "Direct Bank Transfer"
        : order.paymentReference?.startsWith("POD-") || order.paymentReference?.startsWith("CASH-")
          ? "Pay on Delivery"
          : "Paid Online (Card/Transfer)"
    );

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
        paymentMethod: resolvedPaymentMethod,
      }).catch((e) => console.error("Failed to dispatch vendor WhatsApp alert:", e));
    }

    // 6. Send Transaction Notification to Admin
    const adminEmail = process.env.ADMIN_EMAIL || "lightmarketplace01@gmail.com";
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
      paymentMethod: resolvedPaymentMethod,
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
