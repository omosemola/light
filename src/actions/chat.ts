"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail, generateChatMessageEmailForVendor, generateChatMessageEmailForStudent } from "@/lib/email";

export interface ChatMessageRecord {
  id: string;
  text: string;
  image: string | null;
  senderType: "STUDENT" | "VENDOR";
  senderName: string;
  senderEmail: string | null;
  isRead: boolean;
  createdAt: string;
  orderId?: string | null;
}

export interface ChatThreadItem {
  studentEmail: string;
  studentName: string;
  studentAvatar?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  orderId?: string | null;
  orderSummary?: string | null;
}

export async function saveChatMessage(input: {
  storeId: string;
  senderType: "STUDENT" | "VENDOR";
  senderName: string;
  senderEmail?: string;
  text: string;
  image?: string;
  orderId?: string;
}) {
  try {
    const cleanEmail = input.senderEmail ? input.senderEmail.trim().toLowerCase() : null;
    let userId: string | null = null;

    if (cleanEmail) {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (user) {
        userId = user.id;
      } else if (input.senderType === "STUDENT") {
        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: input.senderName || "Campus Student",
          },
        });
        userId = newUser.id;
      }
    }

    // Save message to PostgreSQL Database
    const message = await prisma.chatMessage.create({
      data: {
        storeId: input.storeId,
        senderType: input.senderType,
        senderName: input.senderName,
        senderEmail: cleanEmail,
        text: input.text.trim(),
        image: input.image || null,
        userId: userId,
        orderId: input.orderId || null,
        isRead: false,
      },
    });

    // Send email notification in the background
    try {
      if (input.senderType === "STUDENT") {
        const store = await prisma.store.findUnique({
          where: { id: input.storeId },
          include: { user: true },
        });

        const vendorEmail = store?.user?.email || "vendor@campuslightson.com";
        const emailHtml = generateChatMessageEmailForVendor({
          studentName: input.senderName || "Campus Student",
          studentEmail: cleanEmail || undefined,
          storeName: store?.name || "Campus Vendor",
          messageText: input.text,
          storeId: input.storeId,
        });

        await sendEmail({
          to: vendorEmail,
          subject: `💬 New message from ${input.senderName} - ${store?.name || "Store"}`,
          html: emailHtml,
        });
      } else if (cleanEmail) {
        // Vendor replying to student
        const store = await prisma.store.findUnique({
          where: { id: input.storeId },
        });

        const emailHtml = generateChatMessageEmailForStudent({
          storeName: store?.name || "Campus Vendor",
          studentName: input.senderName || "Student",
          messageText: input.text,
          storeId: input.storeId,
        });

        await sendEmail({
          to: cleanEmail,
          subject: `💬 New reply from ${store?.name || "Store"} on Lightson Marketplace`,
          html: emailHtml,
        });
      }
    } catch (mailErr) {
      console.warn("Email alert could not be sent:", mailErr);
    }

    revalidatePath(`/vendor/dashboard`);
    return {
      success: true,
      message: {
        id: message.id,
        text: message.text,
        image: message.image,
        senderType: message.senderType as "STUDENT" | "VENDOR",
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        orderId: message.orderId,
      },
    };
  } catch (error: any) {
    console.error("Error saving chat message to database:", error);
    return { success: false, error: error.message || "Failed to save message" };
  }
}

export async function getConversationMessages(storeId: string, studentEmail?: string) {
  try {
    const cleanEmail = studentEmail ? studentEmail.trim().toLowerCase() : null;

    let whereClause: any = { storeId };

    if (cleanEmail) {
      whereClause = {
        storeId,
        OR: [
          { senderEmail: cleanEmail },
          { user: { email: cleanEmail } },
        ],
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const formatted: ChatMessageRecord[] = messages.map((m) => ({
      id: m.id,
      text: m.text,
      image: m.image,
      senderType: m.senderType as "STUDENT" | "VENDOR",
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
      orderId: m.orderId,
    }));

    return { success: true, messages: formatted };
  } catch (error: any) {
    console.error("Error fetching conversation messages:", error);
    return { success: false, error: error.message || "Failed to load messages", messages: [] };
  }
}

export async function getStoreChatThreads(storeId: string) {
  try {
    const allMessages = await prisma.chatMessage.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const threadMap = new Map<string, ChatThreadItem>();

    for (const msg of allMessages) {
      const emailKey = (msg.senderEmail || msg.user?.email || `anon-${msg.userId || msg.id}`).trim().toLowerCase();
      if (!threadMap.has(emailKey)) {
        const orderSummary = msg.order?.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ") || null;
        threadMap.set(emailKey, {
          studentEmail: emailKey,
          studentName: msg.senderType === "STUDENT" ? msg.senderName : msg.user?.name || "Campus Student",
          studentAvatar: msg.user?.image || null,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt.toISOString(),
          unreadCount: msg.senderType === "STUDENT" && !msg.isRead ? 1 : 0,
          orderId: msg.orderId,
          orderSummary: orderSummary,
        });
      } else {
        const existing = threadMap.get(emailKey)!;
        if (msg.senderType === "STUDENT" && !msg.isRead) {
          existing.unreadCount += 1;
        }
      }
    }

    return { success: true, threads: Array.from(threadMap.values()) };
  } catch (error: any) {
    console.error("Error fetching store chat threads:", error);
    return { success: false, error: error.message || "Failed to load chat threads", threads: [] };
  }
}

export async function markThreadAsRead(storeId: string, studentEmail: string) {
  try {
    const cleanEmail = studentEmail.trim().toLowerCase();
    await prisma.chatMessage.updateMany({
      where: {
        storeId,
        senderType: "STUDENT",
        senderEmail: cleanEmail,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface StudentChatThreadItem {
  storeId: string;
  storeName: string;
  storeLogo: string | null;
  storeCoverImage: string | null;
  storePhone: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  lastSenderType: "STUDENT" | "VENDOR";
}

export async function getStudentChatThreads(studentEmail?: string) {
  try {
    const cleanEmail = studentEmail ? studentEmail.trim().toLowerCase() : null;
    if (!cleanEmail) {
      return { success: true, threads: [] };
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderEmail: cleanEmail },
          { user: { email: cleanEmail } },
        ],
      },
      select: {
        id: true,
        storeId: true,
        text: true,
        senderType: true,
        isRead: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            coverImage: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    const threadMap = new Map<string, StudentChatThreadItem>();

    for (const msg of messages) {
      const storeId = msg.storeId;
      if (!threadMap.has(storeId) && msg.store) {
        threadMap.set(storeId, {
          storeId: msg.store.id,
          storeName: msg.store.name,
          storeLogo: msg.store.logo,
          storeCoverImage: msg.store.coverImage,
          storePhone: msg.store.phone,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt.toISOString(),
          unreadCount: msg.senderType === "VENDOR" && !msg.isRead ? 1 : 0,
          lastSenderType: msg.senderType as "STUDENT" | "VENDOR",
        });
      } else if (threadMap.has(storeId)) {
        const existing = threadMap.get(storeId)!;
        if (msg.senderType === "VENDOR" && !msg.isRead) {
          existing.unreadCount += 1;
        }
      }
    }

    return { success: true, threads: Array.from(threadMap.values()) };
  } catch (error: any) {
    console.error("Error fetching student chat threads:", error);
    return { success: false, error: error.message || "Failed to load student chats", threads: [] };
  }
}

export async function markStudentThreadAsRead(storeId: string, studentEmail: string) {
  try {
    const cleanEmail = studentEmail.trim().toLowerCase();
    await prisma.chatMessage.updateMany({
      where: {
        storeId,
        senderType: "VENDOR",
        OR: [
          { senderEmail: cleanEmail },
          { user: { email: cleanEmail } },
        ],
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
