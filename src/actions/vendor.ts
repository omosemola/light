"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { 
  sendEmail, 
  generateStudentStatusUpdateEmail, 
  generateVendorWelcomeEmail, 
  generateAdminNewVendorEmail 
} from "@/lib/email";

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
      include: {
        user: true,
        store: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath(`/orders/${orderId}`);

    // Send transactional status update email
    if (updatedOrder.user?.email) {
      let statusTitle = `Order Update: ${newStatus}`;
      let statusDesc = `Your order status has been updated to ${newStatus}.`;

      if (newStatus === OrderStatus.ACCEPTED || newStatus === OrderStatus.PREPARING) {
        statusTitle = "Kitchen Preparing Meal 👨‍🍳";
        statusDesc = `${updatedOrder.store.name} has accepted your order and is packaging your meal.`;
      } else if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
        statusTitle = "Out for Self-Delivery 🛵";
        statusDesc = `${updatedOrder.store.name}'s self-delivery team is en route to your hostel location (${updatedOrder.deliveryLocation}).`;
      } else if (newStatus === OrderStatus.DELIVERED) {
        statusTitle = "Order Delivered 🎉";
        statusDesc = `Your meal from ${updatedOrder.store.name} has been delivered to ${updatedOrder.deliveryLocation}. Enjoy your food!`;
      }

      const emailHtml = generateStudentStatusUpdateEmail({
        customerName: updatedOrder.user.name || "Campus Student",
        orderId: updatedOrder.id.slice(-6).toUpperCase(),
        statusTitle,
        statusDesc,
        storeName: updatedOrder.store.name,
        deliveryLocation: updatedOrder.deliveryLocation,
        totalAmount: updatedOrder.totalAmount,
      });

      sendEmail({
        to: updatedOrder.user.email,
        subject: `Order Update: ${statusTitle} (#${updatedOrder.id.slice(-6).toUpperCase()}) - ${updatedOrder.store.name}`,
        html: emailHtml,
      }).catch((e) => console.error("Failed to send status update email:", e));
    }

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

export async function registerVendorStore(data: {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  password?: string;
  category: string;
  location: string;
  description?: string;
  coverImage?: string;
  logoUrl?: string;
}) {
  try {
    // 1. Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: data.ownerName || data.storeName,
          email: data.email,
          phone: data.phone,
          password: data.password || null,
          role: "VENDOR",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: "VENDOR",
          phone: data.phone || user.phone,
          password: data.password || user.password,
        },
      });
    }

    // 2. Create vendor store
    const store = await prisma.store.create({
      data: {
        name: data.storeName,
        description: data.description || `Welcome to ${data.storeName}! Finest campus vendor.`,
        logo: data.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
        coverImage: data.coverImage || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        userId: user.id,
        isOpen: true,
      },
    });

    // 3. Send Onboarding Welcome Email to Vendor
    if (data.email) {
      const vendorWelcomeHtml = generateVendorWelcomeEmail({
        ownerName: data.ownerName || data.storeName,
        storeName: data.storeName,
        category: data.category,
      });

      sendEmail({
        to: data.email,
        subject: `Welcome to Lightson Marketplace, ${data.storeName}! 🏪`,
        html: vendorWelcomeHtml,
      }).catch((e) => console.error("Failed to send vendor welcome email:", e));
    }

    // 4. Send New Vendor Application Alert to Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campuslightson.com";
    const adminNoticeHtml = generateAdminNewVendorEmail({
      storeName: data.storeName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      category: data.category,
      location: data.location,
    });

    sendEmail({
      to: adminEmail,
      subject: `[LIGHTSON ADMIN] New Vendor Registered: ${data.storeName} (${data.category})`,
      html: adminNoticeHtml,
    }).catch((e) => console.error("Failed to send admin vendor alert email:", e));

    return { success: true, store, userId: user.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register vendor store" };
  }
}
