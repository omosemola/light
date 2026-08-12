"use server";

import { prisma } from "@/lib/prisma";
import { TicketStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getAdminDashboardData() {
  try {
    const [
      totalUsers,
      totalStores,
      totalOrders,
      totalProducts,
      orders,
      stores,
      recentOrders,
      tickets,
      users,
      categories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.findMany({ select: { totalAmount: true, status: true } }),
      prisma.store.findMany({
        include: {
          user: { select: { email: true, name: true } },
          _count: { select: { products: true, orders: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          store: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.findMany({
        include: {
          user: { select: { name: true, email: true } },
          order: { select: { id: true, totalAmount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        include: {
          store: { select: { id: true, name: true } },
          _count: { select: { orders: true, tickets: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { products: true } },
        },
      }),
    ]);

    const totalGMV = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    return {
      success: true,
      metrics: {
        totalUsers,
        totalStores,
        totalOrders,
        totalProducts,
        totalGMV,
        openTicketsCount: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
      },
      stores,
      users,
      recentOrders,
      tickets,
      categories,
    };
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    return { success: false, error: error.message || "Failed to load admin dashboard" };
  }
}

export async function updateSupportTicketStatus(ticketId: string, status: TicketStatus) {
  try {
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

export async function updateUserRole(userId: string, role: Role) {
  try {
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
