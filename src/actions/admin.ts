"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus, Role, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendEmail, generateStudentStatusUpdateEmail } from "@/lib/email";
import { sendOrderDeliverySMS } from "@/lib/sms";
import { clearMarketplaceCache } from "@/actions/marketplace";
import { checkRateLimit } from "@/lib/rateLimit";

export async function getAdminDashboardData() {
  const DEFAULT_FALLBACK_PRODUCTS: any[] = [];
  const DEFAULT_FALLBACK_STORES: any[] = [];

  try {
    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), 35000)
    );

    const queryPromise = (async () => {
      // Execute all dashboard queries in parallel with lightweight projections
      const [
        users,
        stores,
        products,
        recentOrders,
        tickets,
        totalOrdersCount,
        gmvAggregate,
        categories,
      ] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            store: { select: { id: true, name: true } },
            _count: { select: { orders: true, tickets: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.store.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            coverImage: true,
            isOpen: true,
            isVerified: true,
            isService: true,
            category: true,
            serviceSubcategory: true,
            phone: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, email: true, name: true, phone: true } },
            _count: { select: { products: true, orders: true, reviews: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.findMany({
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            image: true,
            isAvailable: true,
            createdAt: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
            store: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.findMany({
          take: 100,
          select: {
            id: true,
            totalAmount: true,
            status: true,
            deliveryLocation: true,
            deliveryFee: true,
            serviceFee: true,
            deliveryInstructions: true,
            paymentReference: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
            store: { select: { id: true, name: true, phone: true } },
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                product: { select: { id: true, name: true, image: true, price: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.supportTicket.findMany({
          select: {
            id: true,
            subject: true,
            category: true,
            message: true,
            status: true,
            adminReply: true,
            createdAt: true,
            updatedAt: true,
            orderId: true,
            user: { select: { name: true, email: true } },
            order: { select: { id: true, totalAmount: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { not: OrderStatus.CANCELLED } },
        }),
        prisma.category.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);

      const totalGMV = gmvAggregate._sum.totalAmount || 0;
      const finalStores = stores.length > 0 ? stores : DEFAULT_FALLBACK_STORES;
      const finalProducts = products.length > 0 ? products : DEFAULT_FALLBACK_PRODUCTS;

      return {
        metrics: {
          totalUsers: users.length || 0,
          totalStores: finalStores.length,
          totalOrders: totalOrdersCount,
          totalProducts: finalProducts.length,
          totalGMV,
          openTicketsCount: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
        },
        stores: finalStores,
        users,
        recentOrders,
        tickets,
        products: finalProducts,
        categories,
      };
    })();

    const result = await Promise.race([queryPromise, timeoutPromise]);

    if ("isTimeout" in result) {
      console.warn("getAdminDashboardData query timed out, returning fallback metrics");
      return {
        success: true,
        metrics: {
          totalUsers: 0,
          totalStores: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalGMV: 0,
          openTicketsCount: 0,
        },
        stores: DEFAULT_FALLBACK_STORES,
        users: [],
        recentOrders: [],
        tickets: [],
        products: DEFAULT_FALLBACK_PRODUCTS,
        categories: [],
      };
    }

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    return {
      success: false,
      error: error.message || "Failed to load dashboard data",
      stores: DEFAULT_FALLBACK_STORES,
      users: [],
      recentOrders: [],
      tickets: [],
      products: DEFAULT_FALLBACK_PRODUCTS,
      categories: [],
    };
  }
}

export async function updateProductCategoryAdmin(productId: string, categoryIdOrName: string) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") {
      return { success: false, error: "Unauthorized. Admin session required." };
    }

    if (!productId || !categoryIdOrName || !categoryIdOrName.trim()) {
      return { success: false, error: "Missing product ID or category name." };
    }

    const cleanCat = categoryIdOrName.trim();

    // 1. Find or create the category in the database
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: cleanCat },
          { name: { equals: cleanCat, mode: "insensitive" } },
        ],
      },
    });

    if (!category) {
      const slug = cleanCat
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      category = await prisma.category.create({
        data: {
          id: slug || `cat-${Date.now()}`,
          name: cleanCat,
        },
      });
    }

    // 2. Update the product's categoryId
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { categoryId: category.id },
      include: {
        category: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });

    // 3. Clear cache and revalidate all relevant paths across the marketplace
    await clearMarketplaceCache({ productId, categorySlug: category.id, storeId: updatedProduct.storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/category/${category.id}`);
    revalidatePath(`/product/${updatedProduct.slug || updatedProduct.id}`);

    return {
      success: true,
      product: updatedProduct,
      category: { id: category.id, name: category.name },
    };
  } catch (error: any) {
    console.error("Error updating product category as admin:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export async function updateStoreCategoryAdmin(storeId: string, categoryName: string) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") {
      return { success: false, error: "Unauthorized. Admin session required." };
    }

    if (!storeId || !categoryName || !categoryName.trim()) {
      return { success: false, error: "Missing store ID or category name." };
    }

    const cleanCat = categoryName.trim();
    const lower = cleanCat.toLowerCase();

    const isService =
      lower === "services" ||
      lower.startsWith("service") ||
      lower.includes("service") ||
      lower.includes("laundry") ||
      lower.includes("medical") ||
      lower.includes("pharmacy") ||
      lower.includes("repair") ||
      lower.includes("cleaning") ||
      lower.includes("errand") ||
      lower.includes("styling") ||
      lower.includes("barbing") ||
      lower.includes("print") ||
      lower.includes("tailor") ||
      lower.includes("tutor") ||
      lower.includes("photo");

    const serviceSubcategory = isService
      ? cleanCat.replace(/^Services:\s*/i, "").trim() || "Campus Services"
      : null;

    // Update the store record in database
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        isService,
        category: isService ? "Services" : cleanCat,
        serviceSubcategory,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        coverImage: true,
        isOpen: true,
        isVerified: true,
        isService: true,
        category: true,
        serviceSubcategory: true,
        phone: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, name: true, phone: true } },
        _count: { select: { products: true, orders: true, reviews: true } },
      },
    });

    // Also ensure the category exists in prisma.category if non-service
    if (!isService) {
      const existingCat = await prisma.category.findFirst({
        where: {
          OR: [
            { id: cleanCat },
            { name: { equals: cleanCat, mode: "insensitive" } },
          ],
        },
      });
      if (!existingCat) {
        const slug = cleanCat
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        await prisma.category.create({
          data: {
            id: slug || `cat-${Date.now()}`,
            name: cleanCat,
          },
        }).catch(() => {});
      }
    }

    // Clear cache and revalidate all relevant paths across the platform
    await clearMarketplaceCache({ storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/vendor/dashboard");
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/category/services");
    revalidatePath(`/vendor/${storeId}`);

    return {
      success: true,
      store: updatedStore,
    };
  } catch (error: any) {
    console.error("Error updating store category as admin:", error);
    return { success: false, error: error.message || "Failed to update store category" };
  }
}

export async function updateOrderStatusAdmin(orderId: string, status: any) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const validStatus = status as OrderStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: validStatus },
      include: {
        user: { select: { email: true, id: true, name: true, phone: true } },
        store: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true } },
          },
        },
      },
    });

    await clearMarketplaceCache({ storeId: updatedOrder.storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/vendor/dashboard");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    revalidatePath("/profile");

    // Send transactional status update email to student
    const recipientEmail = updatedOrder.user?.email;
    if (recipientEmail) {
      let statusTitle = `Order Update: ${validStatus}`;
      let statusDesc = `Your order status has been updated to ${validStatus}.`;

      if (validStatus === OrderStatus.ACCEPTED || validStatus === OrderStatus.PREPARING) {
        statusTitle = "Order Accepted 📦";
        statusDesc = `${updatedOrder.store.name} has accepted your order and is processing your items for delivery.`;
      } else if (validStatus === OrderStatus.OUT_FOR_DELIVERY || validStatus === OrderStatus.READY_FOR_DELIVERY) {
        statusTitle = "Out for Delivery 🛵";
        statusDesc = `${updatedOrder.store.name}'s delivery team is en route to your hostel location (${updatedOrder.deliveryLocation}).`;
      } else if (validStatus === OrderStatus.DELIVERED) {
        statusTitle = "Order Delivered 🎉";
        statusDesc = `Your order from ${updatedOrder.store.name} has been delivered to ${updatedOrder.deliveryLocation}. Thank you for shopping on Lightson!`;
      } else if (validStatus === OrderStatus.CANCELLED) {
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

      sendEmail({
        to: recipientEmail,
        subject: `Order Update: ${statusTitle} (#${updatedOrder.id.slice(-6).toUpperCase()}) - ${updatedOrder.store.name}`,
        html: emailHtml,
      }).catch((e) => console.error("Failed to send student status update email:", e));
    }

    // Send SMS / alert to student phone
    const studentPhone = updatedOrder.user?.phone;
    if (studentPhone && (validStatus === OrderStatus.OUT_FOR_DELIVERY || validStatus === OrderStatus.DELIVERED)) {
      const smsText = validStatus === OrderStatus.OUT_FOR_DELIVERY
        ? `[Lightson] 🛵 Your order #${updatedOrder.id.slice(-6).toUpperCase()} from ${updatedOrder.store.name} is on the way to ${updatedOrder.deliveryLocation}!`
        : `[Lightson] 🎉 Your order #${updatedOrder.id.slice(-6).toUpperCase()} has arrived at ${updatedOrder.deliveryLocation}. Enjoy your meal!`;

      sendOrderDeliverySMS({
        toPhone: studentPhone,
        message: smsText,
      }).catch((err) => console.error("Failed to send delivery SMS alert:", err));
    }

    return { success: true, order: updatedOrder };
  } catch (error: any) {
    console.error("Error updating order status in admin:", error);
    return { success: false, error: error.message || "Failed to update order status" };
  }
}

export async function deleteOrderAdmin(orderId: string) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { storeId: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Detach tickets
      await tx.supportTicket.updateMany({
        where: { orderId },
        data: { orderId: null },
      });
      // 2. Detach reviews
      await tx.review.updateMany({
        where: { orderId },
        data: { orderId: null },
      });
      // 3. Detach chats
      await tx.chatMessage.updateMany({
        where: { orderId },
        data: { orderId: null },
      });
      // 4. Delete items
      await tx.orderItem.deleteMany({
        where: { orderId },
      });
      // 5. Delete order
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    await clearMarketplaceCache({ storeId: order.storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/vendor/dashboard");
    revalidatePath("/orders");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting order in admin:", error);
    return { success: false, error: error.message || "Failed to delete order" };
  }
}

export async function deleteAllOrdersAdmin() {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    await prisma.$transaction(async (tx) => {
      // 1. Detach all tickets
      await tx.supportTicket.updateMany({
        where: { orderId: { not: null } },
        data: { orderId: null },
      });
      // 2. Detach all reviews
      await tx.review.updateMany({
        where: { orderId: { not: null } },
        data: { orderId: null },
      });
      // 3. Detach all chats
      await tx.chatMessage.updateMany({
        where: { orderId: { not: null } },
        data: { orderId: null },
      });
      // 4. Delete all items
      await tx.orderItem.deleteMany({});
      // 5. Delete all orders
      await tx.order.deleteMany({});
    });

    await clearMarketplaceCache();
    revalidatePath("/admin/dashboard");
    revalidatePath("/vendor/dashboard");
    revalidatePath("/orders");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting all orders in admin:", error);
    return { success: false, error: error.message || "Failed to delete all orders" };
  }
}

export async function toggleProductAvailabilityAdmin(productId: string, isAvailable: boolean) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });

    await clearMarketplaceCache({ productId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath(`/product/${productId}`);
    return { success: true, product: updated };
  } catch (error: any) {
    console.error("Error toggling product availability in admin:", error);
    return { success: false, error: error.message || "Failed to toggle product availability" };
  }
}

export async function updateSupportTicketStatus(ticketId: string, status: TicketStatus) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/support");
    return { success: true, ticket: updatedTicket };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update ticket status" };
  }
}

export async function verifyStoreAdmin(storeId: string, isVerified: boolean) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        isVerified,
        isOpen: isVerified, // Auto-open store when approved
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    if (isVerified && updatedStore.user?.email) {
      sendEmail({
        to: updatedStore.user.email,
        subject: `🎉 Congratulations! Your store ${updatedStore.name} is now Verified on Lightson!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="background: #1E1B4B; color: #ffffff; padding: 28px 24px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Merchant Application Approved! 🏪</h1>
              <p style="margin: 6px 0 0; color: #fbbf24; font-size: 14px;">Welcome to Lightson Campus Marketplace</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello <strong>${updatedStore.name}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">Great news! Campus Administrators have officially reviewed and <strong>approved</strong> your merchant store application.</p>
            <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 700;">✓ Store Status: VERIFIED & ACTIVE</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #334155;">Your storefront is now visible to all students across campus. You can now log into your Merchant POS terminal to add products, manage prices, and fulfill live orders.</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://campuslightson.com/vendor/login" style="display: inline-block; background-color: #312E81; color: #ffffff; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">Launch Merchant Terminal</a>
            </div>
          </div>
        `,
      }).catch((e) => console.error("Failed to send vendor verification approval email:", e));
    }

    await clearMarketplaceCache({ storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath(`/vendor/${storeId}`);
    return { success: true, store: updatedStore };
  } catch (error: any) {
    console.error("Error verifying store in admin:", error);
    return { success: false, error: error.message || "Failed to verify store" };
  }
}

export async function toggleStoreStatusAdmin(storeId: string, isOpen: boolean) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isOpen },
    });

    await clearMarketplaceCache({ storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    revalidatePath(`/vendor/${storeId}`);
    return { success: true, store: updatedStore };
  } catch (error: any) {
    console.error("Error toggling store status in admin:", error);
    return { success: false, error: error.message || "Failed to toggle store status" };
  }
}

export async function deleteStoreAdmin(storeId: string) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({
        where: { storeId },
      });
      await tx.orderItem.deleteMany({
        where: { product: { storeId } },
      });
      await tx.review.deleteMany({
        where: { storeId },
      });
      await tx.product.deleteMany({
        where: { storeId },
      });
      await tx.order.deleteMany({
        where: { storeId },
      });
      await tx.store.delete({
        where: { id: storeId },
      });
    });

    await clearMarketplaceCache({ storeId });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting store in admin:", error);
    return { success: false, error: error.message || "Failed to delete store" };
  }
}

export async function updateUserRole(userId: string, role: Role) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, user: updatedUser };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update user role" };
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("lightson_admin_session")?.value !== "authenticated_admin") return { success: false, error: "Unauthorized" };

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { store: true },
      });

      if (!user) {
        return;
      }

      if (user.store) {
        await tx.chatMessage.deleteMany({
          where: { storeId: user.store.id },
        });
        await tx.orderItem.deleteMany({
          where: { product: { storeId: user.store.id } },
        });
        await tx.review.deleteMany({
          where: { storeId: user.store.id },
        });
        await tx.product.deleteMany({
          where: { storeId: user.store.id },
        });
        await tx.order.deleteMany({
          where: { storeId: user.store.id },
        });
        await tx.store.delete({
          where: { id: user.store.id },
        });
      }

      await tx.notification.deleteMany({
        where: { userId },
      });
      await tx.chatMessage.deleteMany({
        where: { userId },
      });
      await tx.orderItem.deleteMany({
        where: { order: { userId } },
      });
      await tx.order.deleteMany({
        where: { userId },
      });
      await tx.supportTicket.deleteMany({
        where: { userId },
      });
      await tx.review.deleteMany({
        where: { userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    await clearMarketplaceCache();
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message || "Failed to delete user account" };
  }
}

export async function authenticateAdmin(email: string, pass: string) {
  try {
    const rateLimitKey = `admin_login_${email.trim().toLowerCase()}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.success) return { success: false, error: rateLimit.error };

    const validEmail = (process.env.ADMIN_EMAIL || "lightmarketplace01@gmail.com").trim().toLowerCase();
    const validPassword = process.env.ADMIN_PASSWORD || "AdminMaster2026!";

    const cleanInputEmail = email?.trim().toLowerCase();
    const cleanInputPass = pass?.trim();

    if (cleanInputEmail === validEmail && cleanInputPass === validPassword) {
      let adminUser = await prisma.user.findUnique({
        where: { email: validEmail },
      });

      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: validEmail,
            name: "Platform Super Admin",
            role: Role.ADMIN,
          },
        });
      } else if (adminUser.role !== Role.ADMIN) {
        adminUser = await prisma.user.update({
          where: { email: validEmail },
          data: { role: Role.ADMIN },
        });
      }

      // SET SECURE ADMIN SESSION COOKIE
      const cookieStore = await cookies();
      cookieStore.set("lightson_admin_session", "authenticated_admin", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "strict",
      });

      return {
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name || "Platform Super Admin",
          role: "ADMIN",
        },
      };
    }

    return {
      success: false,
      error: "Invalid admin email or password. Access denied.",
    };
  } catch (error: any) {
    console.error("Admin authentication error:", error);
    return {
      success: false,
      error: error.message || "Failed to authenticate administrator.",
    };
  }
}

export async function checkAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("lightson_admin_session")?.value;
    if (token === "authenticated_admin") {
      const validEmail = (process.env.ADMIN_EMAIL || "lightmarketplace01@gmail.com").trim().toLowerCase();
      return {
        isAuthenticated: true,
        user: {
          email: validEmail,
          name: "Platform Super Admin",
          role: "ADMIN",
        },
      };
    }
    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

export async function logoutAdmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("lightson_admin_session");
    return { success: true };
  } catch {
    return { success: true };
  }
}
