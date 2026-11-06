"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { notifyAdminNewStudent, sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

    notifyAdminNewStudent({
      name: newUser.name || "Student",
      email: newUser.email,
      source: "Supabase OAuth Login",
    }).catch((e) => console.error("Admin student alert failed:", e));

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Error syncing Supabase user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Initiate password reset: validates user, creates a secure token & OTP in DB, and sends email
 */
export async function requestPasswordReset(rawEmail: string) {
  try {
    if (!rawEmail || !rawEmail.trim()) {
      return { success: false, error: "Please enter your registered email address." };
    }

    const cleanEmail = rawEmail.trim().toLowerCase();

    // Check rate limit: 4 requests per 15 mins per email
    const rateLimit = await checkRateLimit(`pwd_reset_${cleanEmail}`, 4, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return { success: false, error: rateLimit.error || "Too many password reset requests. Please wait a few minutes." };
    }

    // Check if user exists in the database
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
      include: {
        store: { select: { name: true } },
      },
    });

    if (!user || !user.email) {
      // Don't reveal account non-existence for high security, but provide friendly guidance
      return {
        success: true,
        message: "If an account is associated with this email, we have sent instructions to reset your password.",
      };
    }

    // Generate secure random token and 6-digit code
    const token = crypto.randomBytes(32).toString("hex");
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Invalidate any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Store new token in database
    await prisma.passwordResetToken.create({
      data: {
        email: cleanEmail,
        token,
        code: otpCode,
        expiresAt,
      },
    });

    // Determine absolute site URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://lightsonmarketplace.com");
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const resetUrl = `${cleanBaseUrl}/reset-password?token=${token}`;

    console.log(`[PASSWORD RESET] Generated reset token for ${cleanEmail}: ${resetUrl} (Code: ${otpCode})`);

    // Send reset instructions via email
    const recipientDisplayName = user.name || (user.store ? user.store.name : "Student");
    await sendPasswordResetEmail({
      to: user.email,
      recipientName: recipientDisplayName,
      resetUrl,
      code: otpCode,
    });

    return {
      success: true,
      message: "Password reset instructions have been sent to your email. Please check your inbox and spam folder.",
      // In development or if helpful for testing:
      devResetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    };
  } catch (error: any) {
    console.error("Error in requestPasswordReset:", error);
    return {
      success: false,
      error: error.message || "Failed to process password reset request. Please try again later.",
    };
  }
}

/**
 * Verify whether a reset token is valid and not expired
 */
export async function verifyResetToken(token: string) {
  try {
    if (!token || !token.trim()) {
      return { valid: false, error: "Missing password reset token." };
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
    });

    if (!record) {
      return { valid: false, error: "This password reset link is invalid or has already been used." };
    }

    if (new Date() > record.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
      return { valid: false, error: "This password reset link has expired. Please request a new one." };
    }

    // Find user to get role/name
    const user = await prisma.user.findFirst({
      where: { email: { equals: record.email, mode: "insensitive" } },
      select: { email: true, name: true, role: true },
    });

    return {
      valid: true,
      email: record.email,
      role: user?.role || "STUDENT",
      userName: user?.name || "Student",
    };
  } catch (error: any) {
    console.error("Error verifying reset token:", error);
    return { valid: false, error: "Failed to verify reset token. Please try again." };
  }
}

/**
 * Complete the password reset with a valid token
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: "Password reset token is required." };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    // Verify token record in database
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
    });

    if (!tokenRecord) {
      return { success: false, error: "This password reset token is invalid or has already been used." };
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      return { success: false, error: "This password reset link has expired. Please request a new link." };
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: { equals: tokenRecord.email, mode: "insensitive" } },
    });

    if (!user) {
      return { success: false, error: "Associated user account was not found." };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate token so it can never be used again
    await prisma.passwordResetToken.deleteMany({
      where: { email: tokenRecord.email },
    });

    // Create in-app notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Password Reset Successful 🔐",
        desc: "Your account password was successfully reset. You can now log in with your new credentials.",
        type: "ACCOUNT",
      },
    }).catch(() => {});

    // Send confirmation email
    if (user.email) {
      sendPasswordResetSuccessEmail({
        to: user.email,
        recipientName: user.name || "Student",
      }).catch((err) => console.error("Failed to send password changed confirmation email:", err));
    }

    return {
      success: true,
      message: "Your password has been reset successfully! You can now sign in with your new password.",
      role: user.role,
    };
  } catch (error: any) {
    console.error("Error resetting password with token:", error);
    return { success: false, error: error.message || "Failed to reset password. Please try again." };
  }
}

/**
 * Complete password reset using the 6-digit verification code
 */
export async function resetPasswordWithCode(rawEmail: string, code: string, newPassword: string) {
  try {
    if (!rawEmail || !rawEmail.trim()) {
      return { success: false, error: "Please enter your email address." };
    }
    if (!code || !code.trim()) {
      return { success: false, error: "Please enter the 6-digit verification code." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanCode = code.trim();

    // Check token with matching code and email in DB
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        code: cleanCode,
      },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid verification code or email. Please double-check and try again." };
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
      return { success: false, error: "The verification code has expired. Please request a new code." };
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (!user) {
      return { success: false, error: "Associated user account was not found." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    });

    // In-app notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Password Reset Successful 🔐",
        desc: "Your account password was successfully reset using your verification code.",
        type: "ACCOUNT",
      },
    }).catch(() => {});

    // Confirmation email
    if (user.email) {
      sendPasswordResetSuccessEmail({
        to: user.email,
        recipientName: user.name || "Student",
      }).catch((err) => console.error("Failed to send password changed confirmation email:", err));
    }

    return {
      success: true,
      message: "Your password has been reset successfully! You can now sign in with your new password.",
      role: user.role,
    };
  } catch (error: any) {
    console.error("Error resetting password with code:", error);
    return { success: false, error: error.message || "Failed to reset password. Please try again." };
  }
}

