"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function getUserProfileDb(email: string) {
  try {
    if (!email || !email.trim()) return { success: false, user: null };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      include: {
        store: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return { success: true, user: null };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || cleanEmail,
        phone: user.phone || "",
        image: user.image || "",
        role: user.role || "STUDENT",
        storeId: user.store?.id,
        storeName: user.store?.name,
        favoriteProductIds: user.favoriteProductIds || [],
        favoriteStoreIds: user.favoriteStoreIds || [],
      },
    };
  } catch (error: any) {
    console.error("Error retrieving user profile from DB:", error);
    return { success: false, error: error.message, user: null };
  }
}

export async function updateUserProfileDb(email: string, data: { name?: string; phone?: string; image?: string; hostel?: string; addressDetail?: string }) {
  try {
    if (!email || !email.trim()) return { success: false, error: "User email is required" };

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      // Create user if not exists yet
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: data.name || cleanEmail.split("@")[0],
          phone: data.phone || null,
          image: data.image || null,
          role: "STUDENT",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name !== undefined ? data.name : user.name,
          phone: data.phone !== undefined ? data.phone : user.phone,
          image: data.image !== undefined ? data.image : user.image,
        },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/profile/settings");

    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating user profile in DB:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}

export async function changeUserPasswordDb(email: string, currentPass: string, newPass: string) {
  try {
    if (!email) return { success: false, error: "User email is required" };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    // If user has existing password, verify current password
    if (user.password) {
      const isValid = await bcrypt.compare(currentPass, user.password);
      if (!isValid) {
        return { success: false, error: "Current password is incorrect" };
      }
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error: any) {
    console.error("Error changing password in DB:", error);
    return { success: false, error: error.message || "Failed to change password" };
  }
}

export async function deleteUserAccountSelf(email: string) {
  try {
    if (!email) return { success: false, error: "User email is required" };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    // Delete related orders and user
    await prisma.user.delete({
      where: { id: user.id },
    });

    revalidatePath("/");
    return { success: true, message: "Account successfully deleted" };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message || "Failed to delete account" };
  }
}
