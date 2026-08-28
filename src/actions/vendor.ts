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
import { generateUniqueProductSlug } from "@/lib/slugify";

export async function getVendorDashboardData(vendorUserId?: string) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("lightson_vendor_session")?.value;
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;

    const targetUserId = vendorUserId || sessionUserId;

    const storeInclude = {
      user: { select: { email: true, phone: true, name: true } },
      products: {
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" as const },
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
        orderBy: { createdAt: "desc" as const },
      },
      chatMessages: {
        include: {
          user: { select: { name: true, email: true, image: true } },
          order: { select: { id: true, totalAmount: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
      reviews: {
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
    };

    let store = null;

    if (targetUserId) {
      store = await prisma.store.findFirst({
        where: {
          OR: [
            { userId: targetUserId },
            { id: targetUserId },
            { user: { email: { equals: targetUserId, mode: "insensitive" } } },
          ],
        },
        include: storeInclude,
      });
    }

    if (!store && sessionStoreId) {
      store = await prisma.store.findUnique({
        where: { id: sessionStoreId },
        include: storeInclude,
      });
    }

    if (!store) {
      // Auto-fallback to first registered store if single store environment
      store = await prisma.store.findFirst({
        include: storeInclude,
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
      return order.status !== OrderStatus.CANCELLED ? acc + (Number(order.totalAmount) || 0) : acc;
    }, 0);

    const pendingOrdersCount = (store.orders || []).filter(
      (o: any) => o.status === OrderStatus.PENDING || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.OUT_FOR_DELIVERY
    ).length;

    const completedOrdersCount = (store.orders || []).filter((o: any) => o.status === OrderStatus.DELIVERED).length;

    return {
      success: true,
      store,
      metrics: {
        totalRevenue,
        totalGMV: totalRevenue,
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

    // Send transactional status update email to student
    const recipientEmail = updatedOrder.user?.email;
    if (recipientEmail) {
      let statusTitle = `Order Update: ${newStatus}`;
      let statusDesc = `Your order status has been updated to ${newStatus}.`;

      if (newStatus === OrderStatus.ACCEPTED || newStatus === OrderStatus.PREPARING) {
        statusTitle = "Order Accepted 📦";
        statusDesc = `${updatedOrder.store.name} has accepted your order and is processing your items for delivery.`;
      } else if (newStatus === OrderStatus.OUT_FOR_DELIVERY || newStatus === OrderStatus.READY_FOR_DELIVERY) {
        statusTitle = "Out for Delivery 🛵";
        statusDesc = `${updatedOrder.store.name}'s delivery team is en route to your hostel location (${updatedOrder.deliveryLocation}).`;
      } else if (newStatus === OrderStatus.DELIVERED) {
        statusTitle = "Order Delivered 🎉";
        statusDesc = `Your order from ${updatedOrder.store.name} has been delivered to ${updatedOrder.deliveryLocation}. Thank you for shopping on Lightson!`;
      } else if (newStatus === OrderStatus.CANCELLED) {
        statusTitle = "Order Cancelled ✕";
        statusDesc = `Your order #${updatedOrder.id.slice(-6).toUpperCase()} has been cancelled.`;
      }

      const emailHtml = generateStudentStatusUpdateEmail({
        customerName: updatedOrder.user?.name || "Campus Student",
        orderId: updatedOrder.id.slice(-6).toUpperCase(),
        statusTitle,
        statusDesc,
        storeName: updatedOrder.store.name,
        deliveryLocation: updatedOrder.deliveryLocation,
        totalAmount: updatedOrder.totalAmount,
      });

      console.log(`[STATUS EMAIL] Sending status update to student: ${recipientEmail} for order #${updatedOrder.id.slice(-6)} (${newStatus})`);
      const emailRes = await sendEmail({
        to: recipientEmail,
        subject: `Order Update: ${statusTitle} (#${updatedOrder.id.slice(-6).toUpperCase()}) - ${updatedOrder.store.name}`,
        html: emailHtml,
      });
      console.log(`[STATUS EMAIL RESULT] Email sending result for student ${recipientEmail}:`, emailRes);
    } else {
      console.warn(`[STATUS EMAIL] No student email found on order #${orderId} to send status update.`);
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
  estimatedDelivery?: string | null;
  deliveryFee?: number | null;
}) {
  try {
    const numericPrice = typeof data.price === "number" && !isNaN(data.price) 
      ? data.price 
      : parseFloat(String(data.price)) || 0;

    const parsedDeliveryFee = data.deliveryFee !== undefined && data.deliveryFee !== null && !isNaN(Number(data.deliveryFee))
      ? Number(data.deliveryFee)
      : null;

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

    const productSlug = await generateUniqueProductSlug(prisma, data.name.trim());

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug: productSlug,
        description: data.description,
        price: numericPrice,
        image: data.image,
        storeId: data.storeId,
        categoryId: validCategoryId,
        estimatedDelivery: data.estimatedDelivery ? data.estimatedDelivery.trim() : null,
        deliveryFee: parsedDeliveryFee,
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/product/${product.slug || product.id}`);
    revalidatePath("/sitemap.xml");
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
  estimatedDelivery?: string | null;
  deliveryFee?: number | null;
}) {
  try {
    if (!data.productId) {
      return { success: false, error: "Missing product ID" };
    }

    const numericPrice = typeof data.price === "number" && !isNaN(data.price) 
      ? data.price 
      : parseFloat(String(data.price)) || 0;

    const parsedDeliveryFee = data.deliveryFee !== undefined && data.deliveryFee !== null && !isNaN(Number(data.deliveryFee))
      ? Number(data.deliveryFee)
      : null;

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
        const productSlug = await generateUniqueProductSlug(prisma, data.name.trim());
        const created = await prisma.product.create({
          data: {
            name: data.name.trim(),
            slug: productSlug,
            description: data.description,
            price: numericPrice,
            image: data.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            storeId: storeId,
            categoryId: categoryIdToSet || null,
            estimatedDelivery: data.estimatedDelivery !== undefined ? (data.estimatedDelivery ? data.estimatedDelivery.trim() : null) : null,
            deliveryFee: parsedDeliveryFee,
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          },
          include: {
            category: true,
          },
        });
        revalidatePath("/vendor/dashboard");
        revalidatePath("/");
        revalidatePath("/search");
        revalidatePath(`/product/${created.slug || created.id}`);
        revalidatePath("/sitemap.xml");
        return { success: true, product: created };
      }
      return { success: false, error: "Product record not found in database" };
    }

    const updatedSlug = existing.name !== data.name.trim() || !existing.slug
      ? await generateUniqueProductSlug(prisma, data.name.trim(), existing.id)
      : existing.slug;

    const product = await prisma.product.update({
      where: { id: data.productId },
      data: {
        name: data.name.trim(),
        slug: updatedSlug,
        description: data.description,
        price: numericPrice,
        ...(data.image ? { image: data.image } : {}),
        ...(categoryIdToSet !== undefined ? { categoryId: categoryIdToSet } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        estimatedDelivery: data.estimatedDelivery !== undefined ? (data.estimatedDelivery ? data.estimatedDelivery.trim() : null) : undefined,
        deliveryFee: data.deliveryFee !== undefined ? parsedDeliveryFee : undefined,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/product/${product.slug || product.id}`);
    revalidatePath("/sitemap.xml");
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
    revalidatePath("/search");
    revalidatePath("/sitemap.xml");
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
      return { success: false, error: "Please enter your vendor email address or store name." };
    }

    const cleanInput = email.trim();
    const cleanEmail = cleanInput.toLowerCase();

    // 1. Try finding user by email, phone, or matching store
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: "insensitive" } },
          { phone: { equals: cleanInput } },
        ],
      },
      include: {
        store: true,
      },
    });

    // 2. Fallback: Check if store exists with matching name
    if (!user) {
      const storeWithUser = await prisma.store.findFirst({
        where: {
          OR: [
            { name: { equals: cleanInput, mode: "insensitive" } },
            { user: { email: { equals: cleanEmail, mode: "insensitive" } } },
          ],
        },
        include: {
          user: true,
        },
      });

      if (storeWithUser && storeWithUser.user) {
        user = { ...storeWithUser.user, store: storeWithUser } as any;
      }
    }

    if (!user) {
      return { 
        success: false, 
        error: "No merchant store registered with this email or name. Please register your store first." 
      };
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

    if (!targetStore) {
      targetStore = await prisma.store.findUnique({
        where: { userId: user.id },
      });
    }

    // If user has no store yet, initialize their merchant store
    if (!targetStore) {
      targetStore = await prisma.store.create({
        data: {
          name: `${user.name || "Campus"}'s Store`,
          description: "Fresh campus meals, student combos, and quick hostel deliveries.",
          userId: user.id,
          rating: 5.0,
          estimatedDelivery: "20-30 mins",
          isOpen: true,
          isVerified: true,
          logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
          coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        },
      });
    }

    // Ensure user role is VENDOR
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "VENDOR" },
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
    return { success: false, error: error.message || "Failed to authenticate vendor. Please try again." };
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
  deliveryFee?: number;
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
        ...(data.deliveryFee !== undefined ? { deliveryFee: Number(data.deliveryFee) } : {}),
        ...(typeof data.isOpen === "boolean" ? { isOpen: data.isOpen } : {}),
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/vendor/${data.storeId}`);
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
  deliveryFee?: number;
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
        deliveryFee: data.deliveryFee !== undefined ? Number(data.deliveryFee) : undefined,
        ...(data.logo !== undefined ? { logo: data.logo } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
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
    revalidatePath("/search");
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
