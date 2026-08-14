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

    if (data.userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: data.userEmail },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: data.userEmail || "support.user@campuslightson.com",
            name: data.userName || "Campus User",
          },
        });
        userId = newUser.id;
      }
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
    const adminEmail = process.env.ADMIN_EMAIL || "admin@campuslightson.com";
    sendEmail({
      to: adminEmail,
      subject: `[LIGHTSON SUPPORT] New Ticket: ${data.subject} (${data.category})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>⚠️ New Support Ticket</h2>
          <p><strong>From:</strong> ${data.userName || "User"} (${data.userEmail || "No email"})</p>
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
