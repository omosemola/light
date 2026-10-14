"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendEmail, generateStudentWelcomeEmail } from "@/lib/email";

export async function sendStudentWelcomeNotification(data: { email: string; name?: string }) {
  try {
    if (!data.email) return { success: false };

    const emailHtml = generateStudentWelcomeEmail({
      studentName: data.name || "Student",
    });

    await sendEmail({
      to: data.email,
      subject: "Welcome to Lightson Marketplace! 🎓",
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending student welcome email:", error);
    return { success: false, error: error.message };
  }
}

export async function createLiveSupportTicket(data: {
  userEmail?: string;
  userName?: string;
  subject: string;
  category: string;
  message: string;
  orderId?: string;
}) {
  try {
    let userId: string | undefined;
    const cleanEmail = data.userEmail?.trim().toLowerCase();

    if (cleanEmail) {
      let user = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: data.userName || cleanEmail.split("@")[0] || "Campus Student",
            role: "STUDENT",
          },
        });
      }
      userId = user.id;
    }

    if (!userId) {
      const guestEmail = "guest.support@campuslightson.com";
      let guestUser = await prisma.user.findFirst({
        where: { email: { equals: guestEmail, mode: "insensitive" } },
      });
      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            name: data.userName || "Campus Guest",
            role: "STUDENT",
          },
        });
      }
      userId = guestUser.id;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        category: data.category,
        message: data.message,
        orderId: data.orderId || null,
        status: TicketStatus.OPEN,
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/support");

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL || "lightmarketplace01@gmail.com";
    sendEmail({
      to: adminEmail,
      subject: `[LIGHTSON SUPPORT] New Ticket: ${data.subject} (${data.category})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>⚠️ New Support Ticket</h2>
          <p><strong>From:</strong> ${data.userName || "User"} (${cleanEmail || "No email"})</p>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          ${data.orderId ? `<p><strong>Order ID:</strong> #${data.orderId}</p>` : ""}
          <div style="background: #f4f4f5; padding: 12px; border-radius: 8px; margin: 12px 0;">
            ${data.message}
          </div>
          <a href="https://campuslightson.com/admin/dashboard" style="display: inline-block; background: #1E1B4B; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none;">View in Admin Panel</a>
        </div>
      `,
    }).catch((e) => console.error("Failed to notify admin of support ticket:", e));

    return { success: true, ticket };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return { success: false, error: error.message || "Failed to submit support ticket" };
  }
}

export async function getLiveUserSupportTickets(userEmail?: string) {
  try {
    const cleanEmail = userEmail?.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: true, tickets: [] };
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return { success: true, tickets: [] };
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        category: t.category,
        message: t.message,
        status: t.status,
        adminReply: t.adminReply || null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        orderId: t.orderId,
        order: t.order
          ? {
              id: t.order.id,
              totalAmount: t.order.totalAmount,
              status: t.order.status,
              createdAt: t.order.createdAt.toISOString(),
            }
          : null,
      })),
    };
  } catch (error: any) {
    console.error("Error fetching user support tickets:", error);
    return { success: false, error: error.message, tickets: [] };
  }
}

export async function getLiveUserOrdersForSupport(userEmail?: string) {
  try {
    const cleanEmail = userEmail?.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: true, orders: [] };
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return { success: true, orders: [] };
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        totalAmount: o.totalAmount,
        status: o.status,
        storeName: o.store?.name || "Campus Store",
        createdAt: o.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching user orders for support:", error);
    return { success: false, error: error.message, orders: [] };
  }
}
