"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

/**
 * Generate a clean, unique, memorable campus referral code
 * e.g., LIGHT-TUNDE-482 or LIGHT-STUDENT-719
 */
function generateCodeCandidate(name?: string | null): string {
  const cleanName = (name || "CAMPUS")
    .trim()
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 6)
    .toUpperCase();
  const safeName = cleanName.length >= 2 ? cleanName : "LIGHT";
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `LIGHT-${safeName}-${randomSuffix}`;
}

/**
 * Ensure a user has a referral code; if not, generates and persists a unique one.
 */
export async function getOrCreateUserReferralCode(email: string) {
  try {
    if (!email) return { success: false, error: "Missing email", referralCode: null };
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, referralCode: true, points: true },
    });

    if (!user) {
      return { success: false, error: "User not found", referralCode: null };
    }

    if (user.referralCode) {
      return {
        success: true,
        referralCode: user.referralCode,
        referralLink: `https://lightsonmarketplace.com/?ref=${user.referralCode}`,
        points: user.points,
      };
    }

    // Generate unique code with collision retry
    let assignedCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCodeCandidate(user.name);
      const existing = await prisma.user.findUnique({
        where: { referralCode: candidate },
        select: { id: true },
      });
      if (!existing) {
        assignedCode = candidate;
        break;
      }
    }

    if (!assignedCode) {
      assignedCode = `LIGHT-${Date.now().toString().slice(-6)}`;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: assignedCode },
      select: { referralCode: true, points: true },
    });

    return {
      success: true,
      referralCode: updated.referralCode,
      referralLink: `https://lightsonmarketplace.com/?ref=${updated.referralCode}`,
      points: updated.points,
    };
  } catch (error: any) {
    console.error("Error in getOrCreateUserReferralCode:", error);
    return { success: false, error: error.message, referralCode: null };
  }
}

/**
 * Fetch a student's full referral statistics, live accumulated points, and history
 */
export async function getUserReferralStats(email: string) {
  try {
    if (!email) {
      return {
        success: false,
        error: "Missing email",
        stats: null,
      };
    }
    const cleanEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        points: true,
        referralCode: true,
        _count: {
          select: {
            orders: true,
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found", stats: null };
    }

    // Ensure referral code exists
    let code = user.referralCode;
    if (!code) {
      const res = await getOrCreateUserReferralCode(cleanEmail);
      if (res.success && res.referralCode) {
        code = res.referralCode;
      }
    }

    // Historical backwards compatibility:
    // If user's accumulated points in DB is 0, but they already had completed orders,
    // preserve their pre-existing 50 pts/order!
    let livePoints = user.points;
    const ordersCount = user._count?.orders ?? 0;
    if (livePoints === 0 && ordersCount > 0) {
      livePoints = ordersCount * 50;
      await prisma.user.update({
        where: { id: user.id },
        data: { points: livePoints },
      });
    }

    // Fetch transaction ledger for earned referral points
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Sum points specifically earned from referral signups (+100) and friend orders (+5)
    let referralPointsEarned = 0;
    for (const tx of transactions) {
      if (tx.type === "REFERRAL_SIGNUP" || tx.type === "REFERRAL_ORDER_COMMISSION") {
        referralPointsEarned += tx.amount;
      }
    }

    return {
      success: true,
      stats: {
        points: livePoints,
        referralCode: code,
        referralLink: code ? `https://lightsonmarketplace.com/?ref=${code}` : "https://lightsonmarketplace.com",
        totalReferredCount: user._count.referrals,
        referralPointsEarned,
        recentTransactions: transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    console.error("Error in getUserReferralStats:", error);
    return { success: false, error: error.message, stats: null };
  }
}

/**
 * Triggered on new student sign up:
 * - Links student to referrer
 * - Awards NEW STUDENT +50 welcome points
 * - Awards REFERRER +100 points immediately
 * - Emits in-app notification to the referrer
 */
export async function applyReferralOnSignUp(
  newUserId: string,
  rawReferralCode?: string | null
) {
  try {
    if (!newUserId || !rawReferralCode) {
      return { applied: false, reason: "No referral code provided" };
    }

    const cleanCode = rawReferralCode.trim().toUpperCase();
    if (!cleanCode) return { applied: false, reason: "Empty code" };

    // Fetch the new user
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { id: true, name: true, email: true, referredById: true },
    });

    if (!newUser) return { applied: false, reason: "New user not found" };
    if (newUser.referredById) {
      return { applied: false, reason: "User has already been referred" };
    }

    // Find the referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: cleanCode },
      select: { id: true, name: true, email: true, points: true },
    });

    if (!referrer) {
      return { applied: false, reason: "Invalid referral code" };
    }

    // Anti-fraud: prevent self-referral
    if (referrer.id === newUser.id) {
      return { applied: false, reason: "Self referral not allowed" };
    }
    if (
      referrer.email &&
      newUser.email &&
      referrer.email.toLowerCase() === newUser.email.toLowerCase()
    ) {
      return { applied: false, reason: "Self referral not allowed" };
    }

    // 1. Update the new student: set referredById and grant +50 welcome points
    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        referredById: referrer.id,
        points: { increment: 50 },
      },
    });

    // 2. Log Welcome Bonus transaction for the new student
    await prisma.pointTransaction.create({
      data: {
        userId: newUser.id,
        amount: 50,
        type: "WELCOME_BONUS",
        description: `Welcome reward: 50 Campus Points for joining via referral (${cleanCode})`,
      },
    });

    // 3. Grant REFERRER +100 points immediately
    await prisma.user.update({
      where: { id: referrer.id },
      data: {
        points: { increment: 100 },
      },
    });

    // 4. Log Referral Signup transaction for the referrer
    await prisma.pointTransaction.create({
      data: {
        userId: referrer.id,
        amount: 100,
        type: "REFERRAL_SIGNUP",
        description: `Referral reward: 100 Campus Points for referring ${newUser.name || "a new student"}`,
      },
    });

    // 5. Notify the referrer in-app
    await prisma.notification.create({
      data: {
        userId: referrer.id,
        title: "🎉 100 Campus Points Earned!",
        desc: `${newUser.name || "A new student"} just joined Lightson using your referral link. 100 points added to your balance!`,
        type: NotificationType.PROMO,
        link: "/profile",
      },
    });

    return {
      applied: true,
      referrerName: referrer.name || "Campus Friend",
      pointsAwarded: 50,
    };
  } catch (error: any) {
    console.error("Error in applyReferralOnSignUp:", error);
    return { applied: false, error: error.message };
  }
}

/**
 * Triggered on every order creation:
 * - Grants the BUYER +50 points (standard order reward)
 * - If the buyer was referred, grants REFERRER +5 points (order commission)
 * - Emits in-app notification to the referrer
 */
export async function applyReferralOrderBonus(orderId: string, buyerUserId: string) {
  try {
    if (!orderId || !buyerUserId) return { success: false, error: "Missing parameters" };

    // Idempotency check: verify points for this order haven't already been awarded
    const existingTx = await prisma.pointTransaction.findFirst({
      where: {
        orderId,
        userId: buyerUserId,
        type: "ORDER_REWARD",
      },
    });

    if (existingTx) {
      return { success: true, message: "Order points already applied" };
    }

    const shortOrder = orderId.slice(-6).toUpperCase();

    // 1. Award ordering student +50 points
    await prisma.user.update({
      where: { id: buyerUserId },
      data: { points: { increment: 50 } },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: buyerUserId,
        amount: 50,
        type: "ORDER_REWARD",
        description: `Earned 50 Campus Points for Order #${shortOrder}`,
        orderId,
      },
    });

    // 2. Check if the buyer was referred by another student
    const buyer = await prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { id: true, name: true, referredById: true },
    });

    if (buyer?.referredById) {
      const referrerId = buyer.referredById;

      // Award referrer +5 points
      await prisma.user.update({
        where: { id: referrerId },
        data: { points: { increment: 5 } },
      });

      await prisma.pointTransaction.create({
        data: {
          userId: referrerId,
          amount: 5,
          type: "REFERRAL_ORDER_COMMISSION",
          description: `Earned 5 Campus Points: ${buyer.name || "A friend you referred"} placed Order #${shortOrder}`,
          orderId,
        },
      });

      // Send notification to referrer
      await prisma.notification.create({
        data: {
          userId: referrerId,
          title: "⭐ +5 Campus Points Earned!",
          desc: `${buyer.name || "Your referred friend"} just placed an order. 5 points have been added to your reward balance!`,
          type: NotificationType.PROMO,
          link: "/profile",
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in applyReferralOrderBonus:", error);
    return { success: false, error: error.message };
  }
}
