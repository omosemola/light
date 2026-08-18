"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserFavorites(userEmail?: string) {
  try {
    if (!userEmail || !userEmail.trim()) {
      return {
        success: true,
        favoriteProducts: [],
        favoriteStores: [],
        favoriteProductIds: [],
        favoriteStoreIds: [],
      };
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return {
        success: true,
        favoriteProducts: [],
        favoriteStores: [],
        favoriteProductIds: [],
        favoriteStoreIds: [],
      };
    }

    const [favoriteProducts, favoriteStores] = await Promise.all([
      user.favoriteProductIds.length > 0
        ? prisma.product.findMany({
            where: {
              id: { in: user.favoriteProductIds },
              isAvailable: true,
            },
            include: {
              store: true,
              category: true,
            },
          })
        : [],
      user.favoriteStoreIds.length > 0
        ? prisma.store.findMany({
            where: {
              id: { in: user.favoriteStoreIds },
            },
            include: {
              products: {
                where: { isAvailable: true },
                take: 3,
              },
              _count: {
                select: { products: true, reviews: true },
              },
            },
          })
        : [],
    ]);

    return {
      success: true,
      favoriteProducts,
      favoriteStores,
      favoriteProductIds: user.favoriteProductIds,
      favoriteStoreIds: user.favoriteStoreIds,
    };
  } catch (error: any) {
    console.error("Error fetching user favorites:", error);
    return {
      success: false,
      error: error.message || "Failed to load favorites",
      favoriteProducts: [],
      favoriteStores: [],
      favoriteProductIds: [],
      favoriteStoreIds: [],
    };
  }
}

export async function toggleUserFavoriteProduct(userEmail: string, productId: string) {
  try {
    if (!userEmail || !productId) {
      return { success: false, error: "Email and productId are required" };
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: "Campus Student",
          favoriteProductIds: [productId],
        },
      });
      return { success: true, isFavorite: true, favoriteProductIds: user.favoriteProductIds };
    }

    const currentIds = user.favoriteProductIds || [];
    const isCurrentlyFav = currentIds.includes(productId);
    const updatedIds = isCurrentlyFav
      ? currentIds.filter((id) => id !== productId)
      : [...currentIds, productId];

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        favoriteProductIds: updatedIds,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/favorites");
    return {
      success: true,
      isFavorite: !isCurrentlyFav,
      favoriteProductIds: updatedUser.favoriteProductIds,
    };
  } catch (error: any) {
    console.error("Error toggling favorite product:", error);
    return { success: false, error: error.message || "Failed to toggle product favorite" };
  }
}

export async function toggleUserFavoriteStore(userEmail: string, storeId: string) {
  try {
    if (!userEmail || !storeId) {
      return { success: false, error: "Email and storeId are required" };
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: "Campus Student",
          favoriteStoreIds: [storeId],
        },
      });
      return { success: true, isFavorite: true, favoriteStoreIds: user.favoriteStoreIds };
    }

    const currentIds = user.favoriteStoreIds || [];
    const isCurrentlyFav = currentIds.includes(storeId);
    const updatedIds = isCurrentlyFav
      ? currentIds.filter((id) => id !== storeId)
      : [...currentIds, storeId];

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        favoriteStoreIds: updatedIds,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/favorites");
    return {
      success: true,
      isFavorite: !isCurrentlyFav,
      favoriteStoreIds: updatedUser.favoriteStoreIds,
    };
  } catch (error: any) {
    console.error("Error toggling favorite store:", error);
    return { success: false, error: error.message || "Failed to toggle store favorite" };
  }
}
