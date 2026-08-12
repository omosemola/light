"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    if (!userId && input.userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: input.userEmail },
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
            email: input.userEmail || "student@campuslightson.com",
            name: input.userName || "Campus Student",
          },
        });
        userId = newUser.id;
      }
    }

    // 1. Create or update review in database
    const review = await prisma.review.create({
      data: {
        userId,
        storeId: input.storeId,
        orderId: input.orderId || null,
        rating: Math.min(5, Math.max(1, input.rating)),
        comment: input.comment || null,
      },
    });

    // 2. Calculate new average rating for the vendor store
    const storeReviews = await prisma.review.findMany({
      where: { storeId: input.storeId },
      select: { rating: true },
    });

    if (storeReviews.length > 0) {
      const totalSum = storeReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAverageRating = parseFloat((totalSum / storeReviews.length).toFixed(1));

      await prisma.store.update({
        where: { id: input.storeId },
        data: { rating: newAverageRating },
      });
    }

    // Revalidate affected pages
    revalidatePath(`/vendor/${input.storeId}`);
    revalidatePath("/vendor/dashboard");
    revalidatePath("/admin/dashboard");
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
