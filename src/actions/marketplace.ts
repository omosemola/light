"use server";

import { prisma } from "@/lib/prisma";
import { computeIsStoreOpen } from "@/lib/storeSchedule";

export async function getLiveHomepageData() {
  try {
    const [products, stores, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isAvailable: true },
        include: {
          store: true,
          category: true,
        },
        take: 16,
        orderBy: { createdAt: "desc" },
      }),
      prisma.store.findMany({
        include: {
          products: {
            where: { isAvailable: true },
            take: 4,
          },
          _count: {
            select: { products: true, orders: true },
          },
        },
        take: 12,
        orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      description: p.description || "",
      isAvailable: p.isAvailable,
      rating: 4.8,
      vendorId: p.storeId,
      vendorName: p.store.name,
      vendorIsOpen: computeIsStoreOpen(p.store),
      vendorPrepTime: p.store.estimatedDelivery || "15-25 mins",
      category: p.category?.name || "Campus Item",
    }));

    const formattedStores = stores.map((s) => ({
      ...s,
      isCurrentlyOpen: computeIsStoreOpen(s),
    }));

    return {
      success: true,
      products: formattedProducts,
      stores: formattedStores,
      categories,
    };
  } catch (error: any) {
    console.error("Error fetching live homepage data:", error);
    return { success: false, products: [], stores: [], categories: [] };
  }
}

export async function getLiveStoreById(storeId: string) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          where: { isAvailable: true },
        },
        reviews: {
          include: {
            user: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: { name: true, phone: true, email: true },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    return { success: true, store };
  } catch (error: any) {
    console.error("Error fetching store by ID:", error);
    return { success: false, error: error.message };
  }
}

export async function getLiveProductById(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          include: {
            user: { select: { name: true, phone: true } },
            reviews: { take: 5 },
          },
        },
        category: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product.store) {
      product.store.isOpen = computeIsStoreOpen(product.store);
    }

    return { success: true, product };
  } catch (error: any) {
    console.error("Error fetching product by ID:", error);
    return { success: false, error: error.message };
  }
}

export async function getLiveCategoryProducts(categorySlug: string) {
  try {
    const normalized = categorySlug.toLowerCase().trim();
    
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: normalized },
          { name: { equals: normalized, mode: "insensitive" } },
        ],
      },
      include: {
        products: {
          where: { isAvailable: true },
          include: {
            store: true,
          },
        },
      },
    });

    if (!category) {
      // Fallback: search products where category relation name contains slug
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          category: {
            name: { contains: normalized, mode: "insensitive" },
          },
        },
        include: { store: true },
      });

      return { success: true, products };
    }

    return { success: true, products: category.products };
  } catch (error: any) {
    console.error("Error fetching category products:", error);
    return { success: false, products: [] };
  }
}

export async function searchLiveCatalog(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, products: [], stores: [] };
    }

    const cleanQuery = query.trim();

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        include: {
          store: true,
          category: true,
        },
        take: 20,
      }),
      prisma.store.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        include: {
          _count: { select: { products: true } },
        },
        take: 10,
      }),
    ]);

    return { success: true, products, stores };
  } catch (error: any) {
    console.error("Error searching live catalog:", error);
    return { success: false, products: [], stores: [] };
  }
}
