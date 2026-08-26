"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { 
  sendEmail, 
  generateStudentStatusUpdateEmail, 
  generateVendorWelcomeEmail, 
  generateAdminNewVendorEmail 
} from "@/lib/email";
import { sendOrderDeliverySMS } from "@/lib/sms";

export async function getVendorDashboardData(vendorUserId?: string) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("lightson_vendor_session")?.value;
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;

    const targetUserId = vendorUserId || sessionUserId;

    let store = null;

    if (targetUserId) {
      store = await prisma.store.findFirst({
        where: { userId: targetUserId },
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
    } else if (sessionStoreId) {
      store = await prisma.store.findUnique({
        where: { id: sessionStoreId },
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
    }

    if (!store) {
      return { 
        success: false, 
        error: "No active merchant session found. Please log in to your vendor account." 
      };
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
        rating: store.rating || 5.0,
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
    const numericPrice = typeof data.price === "number" && !isNaN(data.price) 
      ? data.price 
      : parseFloat(String(data.price)) || 0;

    let validCategoryId: string | null = null;
    if (data.categoryId && data.categoryId.trim().length > 0) {
      const cleanCatId = data.categoryId.trim();
      const categoryExists = await prisma.category.findFirst({
        where: {
          OR: [
            { id: cleanCatId },
            { name: { equals: cleanCatId, mode: "insensitive" } },
          ],
        },
      });
      if (categoryExists) {
        validCategoryId = categoryExists.id;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        description: data.description,
        price: numericPrice,
        image: data.image,
        storeId: data.storeId,
        categoryId: validCategoryId,
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating vendor product:", error);
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
  storeId?: string;
}) {
  try {
    if (!data.productId) {
      return { success: false, error: "Missing product ID" };
    }

    const numericPrice = typeof data.price === "number" && !isNaN(data.price) 
      ? data.price 
      : parseFloat(String(data.price)) || 0;

    let categoryIdToSet: string | null | undefined = undefined;
    if (data.categoryId && data.categoryId.trim().length > 0) {
      const cleanCatId = data.categoryId.trim();
      const categoryExists = await prisma.category.findFirst({
        where: {
          OR: [
            { id: cleanCatId },
            { name: { equals: cleanCatId, mode: "insensitive" } },
          ],
        },
      });
      if (categoryExists) {
        categoryIdToSet = categoryExists.id;
      }
    }

    // Check if product exists in database
    const existing = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!existing) {
      // If product record wasn't in DB yet, find current vendor store and insert it
      const cookieStore = await cookies();
      const storeId = data.storeId || cookieStore.get("lightson_vendor_store_id")?.value;
      if (storeId) {
        const created = await prisma.product.create({
          data: {
            name: data.name.trim(),
            description: data.description,
            price: numericPrice,
            image: data.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            storeId: storeId,
            categoryId: categoryIdToSet || null,
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          },
          include: {
            category: true,
          },
        });
        revalidatePath("/vendor/dashboard");
        revalidatePath("/");
        return { success: true, product: created };
      }
      return { success: false, error: "Product record not found in database" };
    }

    const product = await prisma.product.update({
      where: { id: data.productId },
      data: {
        name: data.name.trim(),
        description: data.description,
        price: numericPrice,
        ...(data.image ? { image: data.image } : {}),
        ...(categoryIdToSet !== undefined ? { categoryId: categoryIdToSet } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error updating vendor product:", error);
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

    // 5. Establish secure merchant session cookies
    const cookieStore = await cookies();
    cookieStore.set("lightson_vendor_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
    cookieStore.set("lightson_vendor_store_id", store.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    return { 
      success: true, 
      store, 
      userId: user.id,
      storeId: store.id,
      storeName: store.name,
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

    if (!user) {
      return { success: false, error: "No merchant store registered with this email. Please register your store first." };
    }

    // If user has a password and password was submitted, verify it
    if (user.password && password) {
      const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
      if (isBcrypt) {
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return { success: false, error: "Incorrect password. Please verify your vendor credentials." };
        }
      } else if (user.password !== password) {
        return { success: false, error: "Incorrect password. Please verify your vendor credentials." };
      }
    }

    let targetStore = user.store;

    // If user has no store yet, initialize their merchant store
    if (!targetStore) {
      targetStore = await prisma.store.create({
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
    }

    // Set secure merchant session cookies
    const cookieStore = await cookies();
    cookieStore.set("lightson_vendor_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
    cookieStore.set("lightson_vendor_store_id", targetStore.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    return { 
      success: true, 
      storeId: targetStore.id, 
      storeName: targetStore.name, 
      userEmail: user.email,
      userId: user.id,
      isVerified: targetStore.isVerified,
      isOpen: targetStore.isOpen
    };
  } catch (error: any) {
    console.error("Error authenticating vendor:", error);
    return { success: false, error: error.message || "Failed to authenticate vendor" };
  }
}

export async function logoutVendor() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("lightson_vendor_session");
    cookieStore.delete("lightson_vendor_store_id");
    return { success: true };
  } catch {
    return { success: true };
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

export async function updateVendorProfile(data: {
  storeId: string;
  storeName: string;
  ownerName?: string;
  phone?: string;
  description?: string;
  openingTime?: string;
  closingTime?: string;
  estimatedDelivery?: string;
  logo?: string;
  coverImage?: string;
}) {
  try {
    // 1. Update the Store record
    const updatedStore = await prisma.store.update({
      where: { id: data.storeId },
      data: {
        name: data.storeName.trim(),
        description: data.description !== undefined ? data.description.trim() : undefined,
        phone: data.phone !== undefined ? data.phone.trim() : undefined,
        openingTime: data.openingTime || undefined,
        closingTime: data.closingTime || undefined,
        estimatedDelivery: data.estimatedDelivery || undefined,
        ...(data.logo ? { logo: data.logo } : {}),
        ...(data.coverImage ? { coverImage: data.coverImage } : {}),
      },
      include: {
        user: true,
      },
    });

    // 2. Also update the associated User's owner name, phone, and image
    if (updatedStore.userId) {
      await prisma.user.update({
        where: { id: updatedStore.userId },
        data: {
          ...(data.ownerName ? { name: data.ownerName.trim() } : {}),
          ...(data.phone ? { phone: data.phone.trim() } : {}),
          ...(data.logo ? { image: data.logo } : {}),
        },
      });
    }

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath(`/vendor/${data.storeId}`);

    return { 
      success: true, 
      store: updatedStore,
      message: "Store profile updated successfully!" 
    };
  } catch (error: any) {
    console.error("Error updating vendor profile:", error);
    return { success: false, error: error.message || "Failed to update vendor profile" };
  }
}
