"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendEmail, generateOrderEmailHTML } from "@/lib/email";

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
        store: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Revalidate dashboards so real-time data syncs instantly
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orders");

    // 4. Send Order Confirmation Email to Student
    if (input.userEmail) {
      const emailHtml = generateOrderEmailHTML({
        customerName: input.userName || "Campus Student",
        orderId: order.id.slice(-6).toUpperCase(),
        statusTitle: "Order Received 📦",
        statusDesc: `Your order from ${order.store.name} has been placed successfully and sent to the kitchen.`,
        storeName: order.store.name,
        deliveryLocation: order.deliveryLocation,
        totalAmount: order.totalAmount,
      });

      sendEmail({
        to: input.userEmail,
        subject: `Order Confirmed (#${order.id.slice(-6).toUpperCase()}) - Lightson Marketplace`,
        html: emailHtml,
      }).catch((e) => console.error("Failed to send order email:", e));
    }

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
