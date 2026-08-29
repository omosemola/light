"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { computeIsStoreOpen } from "@/lib/storeSchedule";
import { parseProductImages } from "@/lib/productOptions";
import { slugify } from "@/lib/slugify";

// Fast server in-memory caches (15-30 second TTL) for instant 1-click page transitions
let cachedHomepageData: { timestamp: number; data: any } | null = null;
const cachedProductsMap = new Map<string, { timestamp: number; data: any }>();
const cachedStoresMap = new Map<string, { timestamp: number; data: any }>();
const cachedCategoriesMap = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 20000;

export async function clearMarketplaceCache() {
  cachedHomepageData = null;
  cachedProductsMap.clear();
  cachedStoresMap.clear();
  cachedCategoriesMap.clear();
}

export async function getLiveHomepageData() {
  try {
    const now = Date.now();
    if (cachedHomepageData && now - cachedHomepageData.timestamp < CACHE_TTL_MS) {
      return cachedHomepageData.data;
    }

    const [products, stores, categories] = await Promise.all([
      prisma.product.findMany({
        include: {
          store: true,
          category: true,
        },
        take: 60,
        orderBy: { createdAt: "desc" },
      }),
      prisma.store.findMany({
        include: {
          products: {
            include: { category: true },
            take: 12,
          },
          _count: {
            select: { products: true, orders: true },
          },
        },
        take: 25,
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

    const formattedProducts = products.map((p) => {
      const parsed = parseProductImages(p.image);
      const mainImage = parsed[0] || p.image;
      return {
        id: p.id,
        slug: p.slug || p.id,
        name: p.name,
        price: p.price,
        image: mainImage,
        rawImage: p.image,
        description: p.description || "",
        isAvailable: p.isAvailable,
        rating: 4.8,
        vendorId: p.storeId,
        vendorName: p.store.name,
        vendorIsOpen: computeIsStoreOpen(p.store),
        vendorPrepTime: p.estimatedDelivery || p.store.estimatedDelivery || "15-25 mins",
        vendorDeliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : (p.store.deliveryFee ?? 500),
        estimatedDelivery: p.estimatedDelivery || null,
        deliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : null,
        category: p.category?.name || "Pastries",
      };
    });

    const formattedStores = stores.map((s) => ({
      ...s,
      isCurrentlyOpen: computeIsStoreOpen(s),
    }));

    const result = {
      success: true,
      products: formattedProducts,
      stores: formattedStores,
      categories,
    };

    cachedHomepageData = {
      timestamp: Date.now(),
      data: result,
    };

    return result;
  } catch (error: any) {
    console.error("Error fetching live homepage data:", error);
    return { success: false, products: [], stores: [], categories: [] };
  }
}

export async function getLiveStoreById(storeId: string) {
  try {
    const now = Date.now();
    const cached = cachedStoresMap.get(storeId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          include: { category: true },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          where: {
            AND: [
              { comment: { not: null } },
              { comment: { not: "" } },
              { comment: { not: "null" } },
              { comment: { not: "undefined" } },
            ],
          },
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

    const result = { success: true, store };
    cachedStoresMap.set(storeId, { timestamp: now, data: result });
    return result;
  } catch (error: any) {
    console.error("Error fetching store by ID:", error);
    return { success: false, error: error.message };
  }
}

export async function getLiveProductBySlugOrId(slugOrId: string) {
  try {
    if (!slugOrId) {
      return { success: false, error: "Missing product identifier" };
    }

    let raw = "";
    try {
      raw = decodeURIComponent(slugOrId).trim();
    } catch {
      raw = slugOrId.trim();
    }

    const cleanSlug = slugify(raw);
    const now = Date.now();
    const cached = cachedProductsMap.get(raw) || cachedProductsMap.get(cleanSlug);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const productInclude = {
      store: {
        include: {
          user: { select: { name: true, phone: true } },
          reviews: {
            where: {
              AND: [
                { comment: { not: null } },
                { comment: { not: "" } },
                { comment: { not: "null" } },
                { comment: { not: "undefined" } },
              ],
            },
            include: {
              user: { select: { name: true, image: true } },
            },
            orderBy: { createdAt: "desc" as const },
            take: 20,
          },
          products: {
            where: { isAvailable: true },
            take: 8,
          },
        },
      },
      category: true,
    };

    // Strategy 1: Find by exact or case-insensitive slug
    let product: any = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: raw },
          { slug: { equals: raw, mode: "insensitive" } },
          { slug: cleanSlug },
          { slug: { equals: cleanSlug, mode: "insensitive" } },
        ],
      },
      include: productInclude,
    });

    // Strategy 2: Find by database ID (e.g. cuid)
    if (!product) {
      product = await prisma.product.findUnique({
        where: { id: raw },
        include: productInclude,
      });
    }

    // Strategy 3: Find by exact or case-insensitive product name
    if (!product) {
      const spaceName = raw.replace(/-/g, " ").trim();
      const cleanSpaceName = cleanSlug.replace(/-/g, " ").trim();
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { equals: raw, mode: "insensitive" } },
            { name: { equals: spaceName, mode: "insensitive" } },
            { name: { equals: cleanSpaceName, mode: "insensitive" } },
          ],
        },
        include: productInclude,
      });
    }

    // Strategy 4: Find by substring or word fragment match
    if (!product) {
      const words = raw.replace(/[-_]/g, " ").trim();
      if (words.length > 2) {
        product = await prisma.product.findFirst({
          where: {
            name: { contains: words, mode: "insensitive" },
          },
          include: productInclude,
        });
      }
    }

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Auto-heal missing slug in database so all future lookups & SEO canonical URLs are instant
    if (!product.slug && product.name) {
      try {
        const autoSlug = slugify(product.name);
        await prisma.product.update({
          where: { id: product.id },
          data: { slug: autoSlug },
        });
        product.slug = autoSlug;
      } catch (err) {
        // Ignore duplicate slug collision on auto-heal
      }
    }

    if (product.store) {
      product.store.isOpen = computeIsStoreOpen(product.store);
    }

    const result = { success: true, product };
    cachedProductsMap.set(raw, { timestamp: now, data: result });
    if (product.slug) {
      cachedProductsMap.set(product.slug, { timestamp: now, data: result });
    }
    if (product.id) {
      cachedProductsMap.set(product.id, { timestamp: now, data: result });
    }

    return result;
  } catch (error: any) {
    console.error("Error fetching product by slug or ID:", error);
    return { success: false, error: error.message };
  }
}

export async function getLiveProductById(productId: string) {
  return getLiveProductBySlugOrId(productId);
}

export async function getLiveCategoryProducts(categorySlug: string) {
  try {
    const normalized = categorySlug.toLowerCase().trim();
    const now = Date.now();
    const cached = cachedCategoriesMap.get(normalized);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    
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

      const fallbackResult = { success: true, products };
      cachedCategoriesMap.set(normalized, { timestamp: now, data: fallbackResult });
      return fallbackResult;
    }

    const result = { success: true, products: category.products };
    cachedCategoriesMap.set(normalized, { timestamp: now, data: result });
    return result;
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

    const cleanQuery = query.trim().toLowerCase();
    const tokens = cleanQuery.split(/\s+/).filter((w) => w.length > 0);

    // Build flexible multi-term OR conditions
    const productOrConditions: any[] = [
      { name: { contains: cleanQuery, mode: "insensitive" } },
      { description: { contains: cleanQuery, mode: "insensitive" } },
      { category: { name: { contains: cleanQuery, mode: "insensitive" } } },
      { category: { id: { contains: cleanQuery, mode: "insensitive" } } },
      { store: { name: { contains: cleanQuery, mode: "insensitive" } } },
    ];

    for (const token of tokens) {
      if (token !== cleanQuery) {
        productOrConditions.push(
          { name: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } },
          { category: { name: { contains: token, mode: "insensitive" } } },
          { category: { id: { contains: token, mode: "insensitive" } } },
          { store: { name: { contains: token, mode: "insensitive" } } }
        );
      }
    }

    // Synonym mapping: e.g. "food" -> include food, pastries, snacks, meals
    if (cleanQuery.includes("food") || cleanQuery.includes("meal") || cleanQuery.includes("eat") || cleanQuery.includes("chop")) {
      productOrConditions.push(
        { categoryId: "food" },
        { categoryId: "pastries" },
        { categoryId: "snacks" }
      );
    }
    if (cleanQuery.includes("drink") || cleanQuery.includes("beverage") || cleanQuery.includes("juice") || cleanQuery.includes("water") || cleanQuery.includes("zobo")) {
      productOrConditions.push({ categoryId: "drinks" });
    }
    if (cleanQuery.includes("cloth") || cleanQuery.includes("wear") || cleanQuery.includes("fashion") || cleanQuery.includes("hoodie") || cleanQuery.includes("shirt")) {
      productOrConditions.push({ categoryId: "wears" }, { categoryId: "accessories" });
    }

    const storeOrConditions: any[] = [
      { name: { contains: cleanQuery, mode: "insensitive" } },
      { description: { contains: cleanQuery, mode: "insensitive" } },
    ];
    for (const token of tokens) {
      if (token !== cleanQuery) {
        storeOrConditions.push(
          { name: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } }
        );
      }
    }

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: productOrConditions,
        },
        include: {
          store: true,
          category: true,
        },
        take: 60,
        orderBy: { createdAt: "desc" },
      }),
      prisma.store.findMany({
        where: {
          OR: storeOrConditions,
        },
        include: {
          _count: { select: { products: true, orders: true } },
        },
        take: 20,
      }),
    ]);

    const formattedProducts = products.map((p) => {
      const parsed = parseProductImages(p.image);
      return {
        id: p.id,
        slug: p.slug || p.id,
        name: p.name,
        price: p.price,
        image: parsed[0] || p.image,
        rawImage: p.image,
        description: p.description || "",
        isAvailable: p.isAvailable,
        rating: 4.9,
        vendorId: p.storeId,
        vendorName: p.store?.name || "Campus Vendor",
        vendorIsOpen: computeIsStoreOpen(p.store),
        vendorPrepTime: p.estimatedDelivery || p.store?.estimatedDelivery || "15-25 mins",
        vendorDeliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : (p.store?.deliveryFee ?? 500),
        estimatedDelivery: p.estimatedDelivery || null,
        deliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : null,
        category: p.category?.name || "Pastries",
      };
    });

    const formattedStores = stores.map((s) => ({
      ...s,
      isCurrentlyOpen: computeIsStoreOpen(s),
    }));

    return { success: true, products: formattedProducts, stores: formattedStores };
  } catch (error: any) {
    console.error("Error searching live catalog:", error);
    return { success: false, products: [], stores: [] };
  }
}
