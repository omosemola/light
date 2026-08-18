"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function updateUserProfileDb(email: string, data: { name?: string; phone?: string; image?: string }) {
  try {
    if (!email) return { success: false, error: "User email is required" };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name: data.name !== undefined ? data.name : user.name,
        phone: data.phone !== undefined ? data.phone : user.phone,
        image: data.image !== undefined ? data.image : user.image,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/settings");

    return { success: true, user: updatedUser };
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
