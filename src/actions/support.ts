"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

    return { success: true, ticket };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return { success: false, error: error.message || "Failed to submit support ticket" };
  }
}
