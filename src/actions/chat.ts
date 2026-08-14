"use server";

import { sendEmail, generateChatMessageEmailForVendor, generateChatMessageEmailForStudent } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export interface SendChatMessageNotificationInput {
  senderType: "student" | "vendor";
  senderName: string;
  senderEmail?: string;
  recipientEmail?: string;
  storeId?: string;
  storeName: string;
  messageText: string;
}

export async function sendChatMessageNotification(input: SendChatMessageNotificationInput) {
  try {
    let recipientEmail = input.recipientEmail;

    if (input.senderType === "student") {
      // Look up store owner's email if not explicitly provided
      if (!recipientEmail && input.storeId) {
        const store = await prisma.store.findUnique({
          where: { id: input.storeId },
          include: { user: true },
        });
        if (store?.user?.email) {
          recipientEmail = store.user.email;
        }
      }

      if (!recipientEmail) {
        recipientEmail = "vendor@campuslightson.com";
      }

      const emailHtml = generateChatMessageEmailForVendor({
        studentName: input.senderName || "Campus Student",
        studentEmail: input.senderEmail,
        storeName: input.storeName,
        messageText: input.messageText,
        storeId: input.storeId || "",
      });

      await sendEmail({
        to: recipientEmail,
        subject: `💬 New message from ${input.senderName || "Student"} - ${input.storeName}`,
        html: emailHtml,
      });
    } else {
      // Vendor replying to student
      if (!recipientEmail) {
        recipientEmail = "student@campuslightson.com";
      }

      const emailHtml = generateChatMessageEmailForStudent({
        storeName: input.storeName,
        studentName: input.senderName || "Student",
        messageText: input.messageText,
        storeId: input.storeId || "",
      });

      await sendEmail({
        to: recipientEmail,
        subject: `💬 Message from ${input.storeName} on Lightson Marketplace`,
        html: emailHtml,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error dispatching chat notification email:", error);
    return { success: false, error: error.message };
  }
}
