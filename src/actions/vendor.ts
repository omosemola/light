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
  generateAdminNewVendorEmail,
  notifyAdminNewVendor,
  notifyAdminNewProduct,
} from "@/lib/email";
import { sendOrderDeliverySMS } from "@/lib/sms";
import { generateUniqueProductSlug } from "@/lib/slugify";
import { clearMarketplaceCache } from "@/actions/marketplace";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rateLimit";
import { productCreationSchema, productUpdateSchema, vendorStoreRegistrationSchema, storeScheduleSchema } from "@/lib/validations";

async function ensureCloudinaryImageUrl(
  imageStr: string | undefined,
  folder: string = "lightson_marketplace/products"
): Promise<string | undefined> {
  if (!imageStr) return imageStr;

  // 1. Check if it's a JSON array of images
  if (imageStr.startsWith("[") && imageStr.endsWith("]")) {
    try {
      const parsed = JSON.parse(imageStr);
      if (Array.isArray(parsed)) {
        const uploaded = await Promise.all(
          parsed.map(async (img) => {
            if (typeof img === "string" && img.startsWith("data:image/")) {
              const res = await uploadToCloudinary(img, folder);
              return res.success && res.url ? res.url : img;
            }
            return img;
          })
        );
        return JSON.stringify(uploaded);
      }
    } catch {
      // Fall through
    }
  }

  // 2. Single base64 image
  if (imageStr.startsWith("data:image/")) {
    const res = await uploadToCloudinary(imageStr, folder);
    if (res.success && res.url) {
      return res.url;
    }
  }

  return imageStr;
}

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
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId) return { success: false, error: "Unauthorized" };

    const orderToUpdate = await prisma.order.findUnique({ where: { id: orderId } });
    if (!orderToUpdate || orderToUpdate.storeId !== sessionStoreId) {
      return { success: false, error: "Unauthorized to update this order" };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        user: true,
        store: true,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orders");
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
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId || sessionStoreId !== storeId) return { success: false, error: "Unauthorized" };

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isOpen },
    });

    await clearMarketplaceCache({ storeId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath(`/vendor/${storeId}`);
    return { success: true, isOpen: updatedStore.isOpen };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle store status" };
  }
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  try {
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId) return { success: false, error: "Unauthorized" };

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== sessionStoreId) {
      return { success: false, error: "Unauthorized to modify this product" };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    await clearMarketplaceCache({ productId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath(`/product/${productId}`);
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
    productCreationSchema.parse(data);
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId || sessionStoreId !== data.storeId) return { success: false, error: "Unauthorized" };

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
    const finalProductImage = (await ensureCloudinaryImageUrl(data.image, "lightson_marketplace/products")) || data.image;

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug: productSlug,
        description: data.description,
        price: numericPrice,
        image: finalProductImage,
        storeId: data.storeId,
        categoryId: validCategoryId,
        estimatedDelivery: data.estimatedDelivery ? data.estimatedDelivery.trim() : null,
        deliveryFee: parsedDeliveryFee,
        isAvailable: true,
      },
      include: {
        category: true,
        store: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    // Notify Administrator via email of new product
    notifyAdminNewProduct({
      productName: product.name,
      price: product.price,
      categoryName: product.category?.name || "General",
      storeName: product.store?.name || "Merchant Store",
      ownerName: product.store?.user?.name || null,
      vendorEmail: product.store?.user?.email || null,
      vendorPhone: product.store?.user?.phone || null,
      description: product.description || null,
      imageUrl: product.image,
      estimatedDelivery: product.estimatedDelivery,
      deliveryFee: product.deliveryFee,
      productSlug: product.slug,
    }).catch((e) => console.error("Admin new product notification error:", e));

    await clearMarketplaceCache({ storeId: data.storeId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/product/${product.slug || product.id}`);
    revalidatePath(`/vendor/${data.storeId}`);
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
    productUpdateSchema.parse(data);
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId) return { success: false, error: "Unauthorized" };

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

    // Check if product exists in database and belongs to the vendor
    const existing = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (existing && existing.storeId !== sessionStoreId) {
      return { success: false, error: "Unauthorized to update this product" };
    }

    const finalProductImage = data.image !== undefined ? await ensureCloudinaryImageUrl(data.image, "lightson_marketplace/products") : undefined;

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
            image: finalProductImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            storeId: storeId,
            categoryId: categoryIdToSet || null,
            estimatedDelivery: data.estimatedDelivery !== undefined ? (data.estimatedDelivery ? data.estimatedDelivery.trim() : null) : null,
            deliveryFee: parsedDeliveryFee,
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          },
          include: {
            category: true,
            store: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
          },
        });

        notifyAdminNewProduct({
          productName: created.name,
          price: created.price,
          categoryName: created.category?.name || "General",
          storeName: created.store?.name || "Merchant Store",
          ownerName: created.store?.user?.name || null,
          vendorEmail: created.store?.user?.email || null,
          vendorPhone: created.store?.user?.phone || null,
          description: created.description || null,
          imageUrl: created.image,
          estimatedDelivery: created.estimatedDelivery,
          deliveryFee: created.deliveryFee,
          productSlug: created.slug,
        }).catch((e) => console.error("Admin new product notification error:", e));

        await clearMarketplaceCache({ productId: created.id, storeId });
        revalidatePath("/vendor/dashboard");
        revalidatePath("/");
        revalidatePath("/search");
        revalidatePath(`/product/${created.slug || created.id}`);
        revalidatePath(`/vendor/${storeId}`);
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
        ...(finalProductImage ? { image: finalProductImage } : {}),
        ...(categoryIdToSet !== undefined ? { categoryId: categoryIdToSet } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        estimatedDelivery: data.estimatedDelivery !== undefined ? (data.estimatedDelivery ? data.estimatedDelivery.trim() : null) : undefined,
        deliveryFee: data.deliveryFee !== undefined ? parsedDeliveryFee : undefined,
      },
      include: {
        category: true,
      },
    });

    await clearMarketplaceCache({ productId: data.productId, storeId: existing.storeId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/product/${product.slug || product.id}`);
    revalidatePath(`/vendor/${existing.storeId}`);
    revalidatePath("/sitemap.xml");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error updating vendor product:", error);
    return { success: false, error: error.message || "Failed to update product" };
  }
}

export async function deleteVendorProduct(productId: string) {
  try {
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId) return { success: false, error: "Unauthorized" };

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { storeId: true },
    });
    if (!existing || existing.storeId !== sessionStoreId) {
      return { success: false, error: "Unauthorized to delete this product" };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    await clearMarketplaceCache({ productId, storeId: existing?.storeId });
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    if (existing?.storeId) {
      revalidatePath(`/vendor/${existing.storeId}`);
    }
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
    const parsedData = vendorStoreRegistrationSchema.parse(data);
    const rateLimit = await checkRateLimit(`vendor_reg_${parsedData.email.trim().toLowerCase()}`, 3, 15 * 60 * 1000);
    if (!rateLimit.success) return { success: false, error: rateLimit.error };

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
          password: data.password ? await bcrypt.hash(data.password, 10) : null,
          role: "VENDOR",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: "VENDOR",
          phone: data.phone || user.phone,
          password: data.password ? await bcrypt.hash(data.password, 10) : user.password,
        },
      });
    }

    // 2. Create vendor store (Pending Admin Approval)
    const finalLogo = (await ensureCloudinaryImageUrl(data.logoUrl, "lightson_marketplace/stores")) || data.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80";
    const finalCover = (await ensureCloudinaryImageUrl(data.coverImage, "lightson_marketplace/stores")) || data.coverImage || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

    const store = await prisma.store.create({
      data: {
        name: data.storeName,
        description: data.description || `Welcome to ${data.storeName}! Finest campus vendor.`,
        logo: finalLogo,
        coverImage: finalCover,
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
    notifyAdminNewVendor({
      storeName: data.storeName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      category: data.category,
      location: data.location,
      description: data.description,
      logoUrl: finalLogo,
    }).catch((e) => console.error("Failed to send admin vendor alert email:", e));

    // 5. Establish secure merchant session cookies
    const cookieStore = await cookies();
    cookieStore.set("lightson_vendor_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "strict",
    });
    cookieStore.set("lightson_vendor_store_id", store.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "strict",
    });

    await clearMarketplaceCache();
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

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

    const rateLimitKey = `vendor_login_${email.trim().toLowerCase()}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) return { success: false, error: rateLimit.error };

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

      notifyAdminNewVendor({
        storeName: targetStore.name,
        ownerName: user.name || "Campus Vendor",
        email: user.email,
        phone: user.phone || "Not specified",
        category: "Campus Retail & Essentials",
        location: "University Campus",
        description: targetStore.description,
      }).catch((e) => console.error("Admin vendor alert error:", e));
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
      sameSite: "strict",
    });
    cookieStore.set("lightson_vendor_store_id", targetStore.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "strict",
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
    storeScheduleSchema.parse(data);
    const cookieStore = await cookies();
    const sessionStoreId = cookieStore.get("lightson_vendor_store_id")?.value;
    if (!sessionStoreId || sessionStoreId !== data.storeId) return { success: false, error: "Unauthorized" };

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

    await clearMarketplaceCache({ storeId: data.storeId });
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
  paystackSubaccountCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("lightson_vendor_session")?.value) return { success: false, error: "Unauthorized" };

    const finalLogo = data.logo !== undefined ? await ensureCloudinaryImageUrl(data.logo, "lightson_marketplace/stores") : undefined;
    const finalCover = data.coverImage !== undefined ? await ensureCloudinaryImageUrl(data.coverImage, "lightson_marketplace/stores") : undefined;

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
        ...(data.paystackSubaccountCode !== undefined
          ? { paystackSubaccountCode: data.paystackSubaccountCode ? data.paystackSubaccountCode.trim() : null }
          : {}),
        ...(data.bankName !== undefined ? { bankName: data.bankName ? data.bankName.trim() : null } : {}),
        ...(data.accountNumber !== undefined ? { accountNumber: data.accountNumber ? data.accountNumber.trim() : null } : {}),
        ...(data.accountName !== undefined ? { accountName: data.accountName ? data.accountName.trim() : null } : {}),
        ...(finalLogo !== undefined ? { logo: finalLogo } : {}),
        ...(finalCover !== undefined ? { coverImage: finalCover } : {}),
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
          ...(finalLogo ? { image: finalLogo } : {}),
        },
      });
    }

    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/vendor/${data.storeId}`);
    revalidatePath("/checkout");
    await clearMarketplaceCache();

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

export async function updateVendorBankDetails(data: {
  storeId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("lightson_vendor_session")?.value) {
      return { success: false, error: "Unauthorized vendor action" };
    }

    if (!data.storeId) {
      return { success: false, error: "Missing store identifier" };
    }

    const updatedStore = await prisma.store.update({
      where: { id: data.storeId },
      data: {
        bankName: data.bankName ? data.bankName.trim() : null,
        accountNumber: data.accountNumber ? data.accountNumber.trim() : null,
        accountName: data.accountName ? data.accountName.trim() : null,
      },
    });

    revalidatePath("/vendor/dashboard");
    revalidatePath("/checkout");
    await clearMarketplaceCache();

    return { 
      success: true, 
      store: updatedStore, 
      message: "Payout bank account details saved successfully! Students will now see your account at checkout." 
    };
  } catch (error: any) {
    console.error("Error updating vendor bank details:", error);
    return { success: false, error: error.message || "Failed to save bank details" };
  }
}

export async function getStoreBankDetails(storeId: string) {
  try {
    if (!storeId || !storeId.trim()) {
      return { success: false, bankDetails: null };
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId.trim() },
      select: {
        id: true,
        name: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
      },
    });

    if (!store || !store.accountNumber || !store.accountNumber.trim()) {
      return { success: false, bankDetails: null };
    }

    return {
      success: true,
      bankDetails: {
        storeId: store.id,
        storeName: store.name,
        bankName: store.bankName || "Commercial Bank",
        accountNumber: store.accountNumber.trim(),
        accountName: store.accountName?.trim() || store.name,
      },
    };
  } catch (err: any) {
    console.error("Error fetching store bank details:", err);
    return { success: false, bankDetails: null };
  }
}
