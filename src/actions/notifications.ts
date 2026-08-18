"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function getUserDbNotifications(userEmail: string) {
  try {
    if (!userEmail) {
      return { success: true, notifications: [] };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    if (!user) {
      return { success: true, notifications: [] };
    }

    return {
      success: true,
      notifications: user.notifications.map((n) => ({
        id: n.id,
        userEmail: userEmail,
        title: n.title,
        desc: n.desc,
        type: n.type.toLowerCase() as "order" | "promo" | "account" | "system",
        time: formatNotificationTime(n.createdAt),
        createdAt: n.createdAt.getTime(),
        read: n.read,
        link: n.link || undefined,
      })),
    };
  } catch (err) {
    console.error("Error fetching user notifications from db:", err);
    return { success: false, error: "Failed to fetch notifications", notifications: [] };
  }
}

export async function createDbNotification(input: {
  userEmail: string;
  title: string;
  desc: string;
  type?: "order" | "promo" | "account" | "system";
  link?: string;
}) {
  try {
    if (!input.userEmail) return { success: false, error: "Missing email" };

    const user = await prisma.user.findUnique({
      where: { email: input.userEmail },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    let typeEnum: NotificationType = NotificationType.SYSTEM;
    if (input.type === "order") typeEnum = NotificationType.ORDER;
    else if (input.type === "promo") typeEnum = NotificationType.PROMO;
    else if (input.type === "account") typeEnum = NotificationType.ACCOUNT;

    const notif = await prisma.notification.create({
      data: {
        userId: user.id,
        title: input.title,
        desc: input.desc,
        type: typeEnum,
        link: input.link,
      },
    });

    return { success: true, notification: notif };
  } catch (err) {
    console.error("Error creating database notification:", err);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function markDbNotificationRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true };
  } catch (err) {
    console.error("Error marking notification read in db:", err);
    return { success: false };
  }
}

export async function markAllDbNotificationsRead(userEmail: string) {
  try {
    if (!userEmail) return { success: false };

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) return { success: false };

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return { success: true };
  } catch (err) {
    console.error("Error marking all notifications read in db:", err);
    return { success: false };
  }
}

export async function deleteDbNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return { success: true };
  } catch (err) {
    console.error("Error deleting notification from db:", err);
    return { success: false };
  }
}

export async function clearAllDbNotifications(userEmail: string) {
  try {
    if (!userEmail) return { success: false };

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) return { success: false };

    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    return { success: true };
  } catch (err) {
    console.error("Error clearing all notifications from db:", err);
    return { success: false };
  }
}

function formatNotificationTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 2) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
