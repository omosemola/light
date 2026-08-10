"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getVendorDashboardData(vendorUserId?: string) {
  try {
    // If vendorUserId isn't provided, get the first vendor store or demo store
    let store = await prisma.store.findFirst({
      where: vendorUserId ? { userId: vendorUserId } : {},
      include: {
        products: {
          include: {
            category: true,
          },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          include: {
            user: true,
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

    if (!store) {
      // Fallback: search for any store
      store = await prisma.store.findFirst({
        include: {
          products: {
            include: { category: true },
            orderBy: { createdAt: "desc" },
          },
          orders: {
            include: {
              user: true,
              items: { include: { product: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    if (!store) {
      return { success: false, error: "No vendor store found" };
    }

    // Calculate metrics
    const totalRevenue = store.orders.reduce((acc, order) => {
      return order.status !== OrderStatus.CANCELLED ? acc + order.totalAmount : acc;
    }, 0);

    const pendingOrdersCount = store.orders.filter(
      (o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
    ).length;

    const completedOrdersCount = store.orders.filter((o) => o.status === OrderStatus.DELIVERED).length;

    return {
      success: true,
      store,
      metrics: {
        totalRevenue,
        pendingOrdersCount,
        completedOrdersCount,
        rating: store.rating,
        totalProducts: store.products.length,
      },
    };
  } catch (error: any) {
    console.error("Error fetching vendor dashboard data:", error);
    return { success: false, error: error.message || "Failed to load dashboard" };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath(`/orders/${orderId}`);
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
  }
}

export async function toggleStoreOpenStatus(storeId: string, isOpen: boolean) {
  try {
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isOpen },
    });

    revalidatePath("/vendor/dashboard");
    return { success: true, isOpen: updatedStore.isOpen };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle store status" };
  }
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, isAvailable: updatedProduct.isAvailable };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle product availability" };
  }
}

export async function createVendorProduct(data: {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  categoryId?: string;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        storeId: data.storeId,
        categoryId: data.categoryId || null,
        isAvailable: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create product" };
  }
}
