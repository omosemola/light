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
import { sendOrderDeliverySMS } from "@/lib/sms";

export async function getVendorDashboardData(vendorUserId?: string) {
  try {
    // If vendorUserId isn't provided, get the first vendor store or demo store
    let store = await prisma.store.findFirst({
      where: vendorUserId ? { userId: vendorUserId } : {},
      include: {
        user: { select: { email: true, phone: true, name: true } },
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
        chatMessages: {
          include: {
            user: { select: { name: true, email: true, image: true } },
            order: { select: { id: true, totalAmount: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            user: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!store) {
      // Create fallback demo store if none exists
      let vendorUser = await prisma.user.findFirst({
        where: { role: "VENDOR" },
      });

      if (!vendorUser) {
        vendorUser = await prisma.user.create({
          data: {
            email: "vendor@mamacass.com",
            name: "Mama Cass",
            role: "VENDOR",
          },
        });
      }

      store = (await prisma.store.create({
        data: {
          name: "Mama Cass Campus Kitchen",
          description: "Fresh hot meals, student combos, jollof rice and snacks delivered directly to your hostel.",
          userId: vendorUser.id,
          rating: 4.9,
          estimatedDelivery: "15-25 mins",
          isOpen: true,
          logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
          coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        },
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
      })) as any;
    }

    if (!store) {
      return { success: false, error: "Failed to initialize vendor store" };
    }

    // Calculate metrics
    const totalRevenue = (store.orders || []).reduce((acc: number, order: any) => {
      return order.status !== OrderStatus.CANCELLED ? acc + order.totalAmount : acc;
    }, 0);

    const pendingOrdersCount = (store.orders || []).filter(
      (o: any) => o.status === OrderStatus.PENDING || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
    ).length;

    const completedOrdersCount = (store.orders || []).filter((o: any) => o.status === OrderStatus.DELIVERED).length;

    return {
      success: true,
      store,
      metrics: {
        totalRevenue,
        pendingOrdersCount,
        completedOrdersCount,
        rating: store.rating,
        totalProducts: (store.products || []).length,
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

    // Send SMS / WhatsApp Alert to Student Phone
    const studentPhone = updatedOrder.user?.phone;
    if (studentPhone && (newStatus === OrderStatus.OUT_FOR_DELIVERY || newStatus === OrderStatus.DELIVERED)) {
      const smsText = newStatus === OrderStatus.OUT_FOR_DELIVERY
        ? `[Lightson] 🛵 Your order #${updatedOrder.id.slice(-6).toUpperCase()} from ${updatedOrder.store.name} is on the way to ${updatedOrder.deliveryLocation}!`
        : `[Lightson] 🎉 Your order #${updatedOrder.id.slice(-6).toUpperCase()} has arrived at ${updatedOrder.deliveryLocation}. Enjoy your meal!`;

      sendOrderDeliverySMS({
        toPhone: studentPhone,
        message: smsText,
      }).catch((err) => console.error("Failed to send delivery SMS alert:", err));
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

export async function updateVendorProduct(data: {
  productId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) {
  try {
    const product = await prisma.product.update({
      where: { id: data.productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        ...(data.image ? { image: data.image } : {}),
        categoryId: data.categoryId || null,
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteVendorProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product" };
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

    // 2. Create vendor store (Pending Admin Approval)
    const store = await prisma.store.create({
      data: {
        name: data.storeName,
        description: data.description || `Welcome to ${data.storeName}! Finest campus vendor.`,
        logo: data.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
        coverImage: data.coverImage || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        userId: user.id,
        isOpen: false,
        isVerified: false,
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

    // 4. Send New Vendor Application Alert to Admin for Verification
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
      subject: `[LIGHTSON ADMIN - ACTION REQUIRED] New Vendor Application: ${data.storeName} (${data.category})`,
      html: adminNoticeHtml,
    }).catch((e) => console.error("Failed to send admin vendor alert email:", e));

    return { 
      success: true, 
      store, 
      userId: user.id,
      isVerified: false,
      isPendingVerification: true,
      message: "Vendor store application submitted successfully and is pending administrator verification." 
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register vendor store" };
  }
}

export async function authenticateVendor(email: string, password?: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Please enter your vendor email address." };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query database for vendor user
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      include: {
        store: true,
      },
    });

    // Auto-create demo vendor if needed
    if (!user) {
      if (cleanEmail.includes("vendor") || cleanEmail.includes("mamacass") || cleanEmail.includes("demo")) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: "Mama Cass Merchant",
            role: "VENDOR",
          },
          include: {
            store: true,
          },
        });
      } else {
        return { success: false, error: "No merchant store registered with this email. Please register your store first." };
      }
    }

    // If user has no store, create one
    if (!user.store) {
      const store = await prisma.store.create({
        data: {
          name: `${user.name || "Campus"}'s Store`,
          description: "Fresh campus meals, student combos, and quick hostel deliveries.",
          userId: user.id,
          rating: 5.0,
          estimatedDelivery: "20-30 mins",
          isOpen: false,
          isVerified: false,
          logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
          coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        },
      });
      return { 
        success: true, 
        storeId: store.id, 
        storeName: store.name, 
        userEmail: user.email,
        isVerified: false,
        isOpen: false
      };
    }

    return { 
      success: true, 
      storeId: user.store.id, 
      storeName: user.store.name, 
      userEmail: user.email,
      isVerified: user.store.isVerified,
      isOpen: user.store.isOpen
    };
  } catch (error: any) {
    console.error("Error authenticating vendor:", error);
    return { success: false, error: error.message || "Failed to authenticate vendor" };
  }
}

export async function updateStoreSchedule(data: {
  storeId: string;
  openingTime: string;
  closingTime: string;
  phone?: string;
  estimatedDelivery?: string;
  isOpen?: boolean;
}) {
  try {
    const updatedStore = await prisma.store.update({
      where: { id: data.storeId },
      data: {
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        phone: data.phone,
        estimatedDelivery: data.estimatedDelivery,
        ...(typeof data.isOpen === "boolean" ? { isOpen: data.isOpen } : {}),
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, store: updatedStore };
  } catch (error: any) {
    console.error("Error updating store schedule:", error);
    return { success: false, error: error.message || "Failed to update store schedule" };
  }
}
