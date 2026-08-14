"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function syncSupabaseOAuthUser(data: {
  email: string;
  name?: string;
  avatar?: string;
}) {
  try {
    if (!data.email) return { success: false, error: "No email provided" };

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: true, user: existingUser };
    }

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || data.email.split("@")[0],
        role: Role.STUDENT,
      },
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Error syncing Supabase user:", error);
    return { success: false, error: error.message };
  }
}
