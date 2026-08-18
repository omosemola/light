"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface UserReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  storeId: string;
  storeName: string;
  storeLogo: string | null;
  storeCover: string | null;
  orderId?: string | null;
  orderSummary?: string | null;
}

export async function submitStudentReview(input: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  storeId: string;
  orderId?: string;
  rating: number;
  comment?: string;
}) {
  try {
    let userId = input.userId;

    // 1. Resolve user ID
    if (!userId && input.userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: input.userEmail.trim().toLowerCase() },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      const defaultEmail = (input.userEmail || "visitor@light.app").trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: defaultEmail },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: defaultEmail,
            name: input.userName || "Campus Student",
          },
        });
        userId = newUser.id;
      }
    }

    // 2. Validate store existence (or assign to first available store if storeId is missing/mock)
    let targetStoreId = input.storeId;
    let storeExists = await prisma.store.findUnique({ where: { id: targetStoreId } });
    if (!storeExists) {
      const firstStore = await prisma.store.findFirst();
      if (firstStore) {
        targetStoreId = firstStore.id;
      }
    }

    const ratingVal = Math.min(5, Math.max(1, Math.round(input.rating)));
    const commentVal = input.comment?.trim() || null;

    // 3. Upsert or create review in database
    let review;
    if (input.orderId) {
      const existingOrderReview = await prisma.review.findFirst({
        where: { orderId: input.orderId },
      });

      if (existingOrderReview) {
        review = await prisma.review.update({
          where: { id: existingOrderReview.id },
          data: {
            rating: ratingVal,
            comment: commentVal,
            storeId: targetStoreId,
          },
        });
      }
    }

    if (!review) {
      review = await prisma.review.create({
        data: {
          userId,
          storeId: targetStoreId,
          orderId: input.orderId || null,
          rating: ratingVal,
          comment: commentVal,
        },
      });
    }

    // 4. Calculate new average rating for the vendor store
    const storeReviews = await prisma.review.findMany({
      where: { storeId: targetStoreId },
      select: { rating: true },
    });

    if (storeReviews.length > 0) {
      const totalSum = storeReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAverageRating = parseFloat((totalSum / storeReviews.length).toFixed(1));

      await prisma.store.update({
        where: { id: targetStoreId },
        data: { rating: newAverageRating },
      });
    }

    // Revalidate affected routes
    revalidatePath(`/vendor/${targetStoreId}`);
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/profile/reviews");
    if (input.orderId) {
      revalidatePath(`/orders/${input.orderId}`);
    }
    revalidatePath("/");

    return { success: true, review };
  } catch (error: any) {
    console.error("Error submitting student review:", error);
    return { success: false, error: error.message || "Failed to submit review" };
  }
}

export async function getUserReviews(userEmail?: string) {
  try {
    if (!userEmail) {
      return { success: true, reviews: [] };
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: true, reviews: [] };
    }

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            coverImage: true,
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

    const formattedReviews: UserReviewItem[] = reviews.map((r) => {
      const orderItems = r.order?.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ");
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        storeId: r.store.id,
        storeName: r.store.name,
        storeLogo: r.store.logo,
        storeCover: r.store.coverImage,
        orderId: r.orderId,
        orderSummary: orderItems || null,
      };
    });

    return { success: true, reviews: formattedReviews };
  } catch (error: any) {
    console.error("Error fetching user reviews from database:", error);
    return { success: false, error: error.message || "Failed to load user reviews", reviews: [] };
  }
}

export async function deleteUserReview(reviewId: string, userEmail?: string) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: { select: { email: true } } },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    // If userEmail provided, ensure authorization
    if (userEmail && review.user.email && review.user.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      return { success: false, error: "Unauthorized to delete this review" };
    }

    const storeId = review.storeId;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate store rating
    const remainingStoreReviews = await prisma.review.findMany({
      where: { storeId },
      select: { rating: true },
    });

    const newAverageRating =
      remainingStoreReviews.length > 0
        ? parseFloat((remainingStoreReviews.reduce((sum, r) => sum + r.rating, 0) / remainingStoreReviews.length).toFixed(1))
        : 5.0;

    await prisma.store.update({
      where: { id: storeId },
      data: { rating: newAverageRating },
    });

    revalidatePath(`/vendor/${storeId}`);
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/profile/reviews");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user review:", error);
    return { success: false, error: error.message || "Failed to delete review" };
  }
}

export async function getStoreReviews(storeId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { storeId },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, reviews };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch store reviews" };
  }
}
