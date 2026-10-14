"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeIsStoreOpen } from "@/lib/storeSchedule";
import { parseProductImages } from "@/lib/productOptions";
import { slugify } from "@/lib/slugify";
import {
  optimizeProductImageField,
  optimizeSingleImage,
  shapeProductImages,
  shapeStoreImages,
  shapeUserImage,
} from "@/lib/imageUrls";

/**
 * Shared server data cache (Next.js Data Cache via `unstable_cache`).
 *
 * Unlike the previous module-level `Map`s, this cache is shared across requests/instances and
 * survives serverless cold starts, and can be invalidated precisely with tags from any server
 * action (see `clearMarketplaceCache`). The short TTL is only a safety net: every write path
 * already invalidates the relevant tags.
 */
const CACHE_TTL_SECONDS = process.env.NODE_ENV === "production" ? 60 : 5;

const TAG_ALL = "marketplace";
const TAG_PRODUCTS = "products";
const TAG_STORES = "stores";
const TAG_CATEGORIES = "categories";
const storeTag = (id: string) => `store:${id}`;

const NOT_FOUND = "MARKETPLACE_NOT_FOUND";

function notFoundError(message: string) {
  const err = new Error(message);
  (err as any).code = NOT_FOUND;
  return err;
}

/** Expire cache entries immediately (read-your-writes) for the given tags. */
function expireTags(tags: string[]) {
  for (const tag of new Set(tags)) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (err) {
      // revalidateTag can only run on the server during an action/route; never let it crash a write.
      console.warn(`[marketplace] failed to revalidate tag "${tag}"`, err);
    }
  }
}

export async function clearMarketplaceCache(options?: {
  productId?: string;
  storeId?: string;
  categorySlug?: string;
}) {
  if (!options) {
    expireTags([TAG_ALL, TAG_PRODUCTS, TAG_STORES, TAG_CATEGORIES]);
    return { success: true, cleared: "all" };
  }

  const tags: string[] = [TAG_ALL];
  if (options.productId) {
    tags.push(TAG_PRODUCTS, TAG_CATEGORIES);
  }
  if (options.storeId) {
    tags.push(storeTag(options.storeId), TAG_STORES, TAG_PRODUCTS, TAG_CATEGORIES);
  }
  if (options.categorySlug) {
    tags.push(TAG_CATEGORIES);
  }

  expireTags(tags);
  return { success: true, cleared: options };
}

/** Slim, payload-safe store summary used by list views (no nested products, no base64 images). */
function slimStore(s: any) {
  const open = computeIsStoreOpen(s);
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    logo: optimizeSingleImage(s.logo, "logo", s.id, s.updatedAt),
    isOpen: open,
    isCurrentlyOpen: open,
    isService: s.isService,
    category: s.category,
    serviceSubcategory: s.serviceSubcategory,
    availabilityStatus: s.availabilityStatus,
    startingPrice: s.startingPrice,
    estimatedDelivery: s.estimatedDelivery,
    deliveryFee: s.deliveryFee,
    rating: s.rating,
    openingTime: s.openingTime,
    closingTime: s.closingTime,
    _count: s._count,
  };
}

function formatListProduct(p: any, defaultRating: number) {
  const image = optimizeProductImageField(p.image, p.id, p.updatedAt, { firstOnly: true });
  const mainImage = parseProductImages(image)[0] || image;
  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    price: p.price,
    image: mainImage,
    rawImage: mainImage,
    description: p.description || "",
    isAvailable: p.isAvailable,
    rating: defaultRating,
    vendorId: p.storeId,
    vendorName: p.store?.name || "Campus Vendor",
    vendorIsOpen: p.store ? computeIsStoreOpen(p.store) : true,
    vendorPrepTime: p.estimatedDelivery || p.store?.estimatedDelivery || "15-25 mins",
    vendorDeliveryFee:
      p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : (p.store?.deliveryFee ?? 500),
    estimatedDelivery: p.estimatedDelivery || null,
    deliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : null,
    category: p.category?.name || "Pastries",
  };
}

// Only the store columns needed to render product lists / compute open state (never logo/cover blobs).
const LIST_STORE_SELECT = {
  id: true,
  name: true,
  isOpen: true,
  openingTime: true,
  closingTime: true,
  estimatedDelivery: true,
  deliveryFee: true,
} as const;

/* ───────────────────────────── Homepage ───────────────────────────── */

const readHomepageData = unstable_cache(
  async () => {
    const [products, stores, categories] = await Promise.all([
      prisma.product.findMany({
        include: {
          store: { select: LIST_STORE_SELECT },
          category: true,
        },
        take: 60,
        orderBy: { createdAt: "desc" },
      }),
      prisma.store.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          isOpen: true,
          isService: true,
          category: true,
          serviceSubcategory: true,
          availabilityStatus: true,
          startingPrice: true,
          estimatedDelivery: true,
          deliveryFee: true,
          rating: true,
          openingTime: true,
          closingTime: true,
          updatedAt: true,
          _count: { select: { products: true, orders: true } },
        },
        take: 25,
        orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          updatedAt: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    return {
      success: true as const,
      products: products.map((p) => formatListProduct(p, 4.8)),
      stores: stores.map(slimStore),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        _count: c._count,
      })),
    };
  },
  ["marketplace-homepage-v3"],
  { tags: [TAG_ALL, TAG_PRODUCTS, TAG_STORES, TAG_CATEGORIES], revalidate: CACHE_TTL_SECONDS }
);

export async function getLiveHomepageData() {
  try {
    return await readHomepageData();
  } catch (error: any) {
    console.error("Error fetching live homepage data:", error);
    return { success: false, products: [], stores: [], categories: [] } as {
      success: boolean;
      products: any[];
      stores: any[];
      categories: any[];
    };
  }
}

/* ───────────────────────────── Store ───────────────────────────── */

async function readStoreById(storeId: string) {
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
          user: { select: { id: true, name: true, image: true, updatedAt: true } },
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

  if (!store) throw notFoundError("Store not found");

  return {
    success: true as const,
    store: {
      ...shapeStoreImages(store),
      products: store.products.map((p) => shapeProductImages(p)),
      reviews: store.reviews.map((r) => ({ ...r, user: shapeUserImage(r.user) })),
    },
  };
}

export async function getLiveStoreById(storeId: string) {
  try {
    if (!storeId) return { success: false, error: "Missing store identifier", store: null };
    const cached = unstable_cache(readStoreById, ["marketplace-store-v3", storeId], {
      tags: [TAG_ALL, TAG_STORES, storeTag(storeId)],
      revalidate: CACHE_TTL_SECONDS,
    });
    return await cached(storeId);
  } catch (error: any) {
    if (error?.code === NOT_FOUND || error?.message === "Store not found") {
      return { success: false, error: "Store not found", store: null };
    }
    console.error("Error fetching store by ID:", error);
    return { success: false, error: error.message, store: null };
  }
}

/* ───────────────────────────── Product ───────────────────────────── */

async function readProductBySlugOrId(raw: string, cleanSlug: string) {
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
            user: { select: { id: true, name: true, image: true, updatedAt: true } },
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

  // Throwing (instead of returning a failure object) guarantees "not found" is never cached.
  if (!product) throw notFoundError("Product not found");

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

  const shaped: any = shapeProductImages(product);
  if (product.store) {
    const store: any = shapeStoreImages(product.store);
    store.isOpen = computeIsStoreOpen(product.store);
    store.products = (product.store.products || []).map((p: any) => shapeProductImages(p));
    store.reviews = (product.store.reviews || []).map((r: any) => ({ ...r, user: shapeUserImage(r.user) }));
    shaped.store = store;
  }

  return { success: true as const, product: shaped };
}

export async function getLiveProductBySlugOrId(slugOrId: string) {
  try {
    if (!slugOrId) {
      return { success: false, error: "Missing product identifier", product: null };
    }

    let raw = "";
    try {
      raw = decodeURIComponent(slugOrId).trim();
    } catch {
      raw = slugOrId.trim();
    }

    const cleanSlug = slugify(raw);
    const cached = unstable_cache(readProductBySlugOrId, ["marketplace-product-v3", raw], {
      tags: [TAG_ALL, TAG_PRODUCTS],
      revalidate: CACHE_TTL_SECONDS,
    });
    return await cached(raw, cleanSlug);
  } catch (error: any) {
    if (error?.code === NOT_FOUND || error?.message === "Product not found") {
      return { success: false, error: "Product not found", product: null };
    }
    console.error("Error fetching product by slug or ID:", error);
    return { success: false, error: error.message, product: null };
  }
}

export async function getLiveProductById(productId: string) {
  return getLiveProductBySlugOrId(productId);
}

/* ───────────────────────────── Services / Category ───────────────────────────── */

const SERVICE_STORE_WHERE = {
  OR: [
    { isService: true },
    { category: { equals: "services", mode: "insensitive" as const } },
    { description: { contains: "service", mode: "insensitive" as const } },
    { description: { contains: "laundry", mode: "insensitive" as const } },
    { description: { contains: "medical", mode: "insensitive" as const } },
    { description: { contains: "pharmacy", mode: "insensitive" as const } },
    { name: { contains: "laundry", mode: "insensitive" as const } },
    { name: { contains: "pharmacy", mode: "insensitive" as const } },
  ],
};

function formatServiceStore(s: any) {
  return {
    id: s.id,
    name: s.name,
    description: s.description || "Verified campus service provider",
    logo:
      optimizeSingleImage(s.logo, "logo", s.id, s.updatedAt) ||
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
    rating: s.rating || 4.9,
    phone: s.phone || s.user?.phone || null,
    isOpen: computeIsStoreOpen(s),
    estimatedDelivery: s.estimatedDelivery || "15-30 mins",
    categoryType:
      s.serviceSubcategory ||
      (s.name.toLowerCase().includes("laundry") || (s.description && s.description.toLowerCase().includes("laundry"))
        ? "Laundry & Dry Cleaning"
        : s.name.toLowerCase().includes("health") ||
            s.name.toLowerCase().includes("pharm") ||
            (s.description && s.description.toLowerCase().includes("pharm"))
          ? "Medicals & Pharmacy"
          : "Campus Services"),
    availabilityStatus: s.availabilityStatus || (computeIsStoreOpen(s) ? "AVAILABLE" : "CLOSED"),
    startingPrice: s.startingPrice || null,
    openingTime: s.openingTime || "08:00",
    closingTime: s.closingTime || "22:00",
    serviceOfferings: [] as string[],
  };
}

async function readServiceStores() {
  const rawStores = await prisma.store.findMany({
    where: SERVICE_STORE_WHERE,
    include: {
      user: { select: { name: true, phone: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rawStores.map(formatServiceStore);
}

const readServiceStoresCached = unstable_cache(readServiceStores, ["marketplace-services-v3"], {
  tags: [TAG_ALL, TAG_STORES, TAG_CATEGORIES],
  revalidate: CACHE_TTL_SECONDS,
});

/** Slim product shape for category pages (keeps what CategoryClient reads, drops base64 + store blobs). */
function formatCategoryProduct(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: optimizeProductImageField(p.image, p.id, p.updatedAt, { firstOnly: true }),
    description: p.description,
    isAvailable: p.isAvailable,
    storeId: p.storeId,
    store: p.store ? { id: p.store.id, name: p.store.name } : undefined,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
  };
}

async function readCategoryProducts(normalized: string) {
  // SERVICES umbrella category: aggregates registered service personnel and availability
  if (normalized === "services") {
    const serviceStores = await readServiceStores();
    return { success: true as const, products: [] as any[], serviceStores };
  }

  const categoryProductInclude = {
    store: { select: { id: true, name: true } },
    category: true,
  };

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
        include: categoryProductInclude,
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
      include: categoryProductInclude,
    });
    return { success: true as const, products: products.map(formatCategoryProduct) };
  }

  return { success: true as const, products: category.products.map(formatCategoryProduct) };
}

export async function getLiveCategoryProducts(categorySlug: string) {
  try {
    const rawNormalized = (categorySlug || "").toLowerCase().trim();
    const normalized = rawNormalized === "medicals" ? "medical" : rawNormalized;
    const cached = unstable_cache(readCategoryProducts, ["marketplace-category-v3", normalized], {
      tags: [TAG_ALL, TAG_PRODUCTS, TAG_CATEGORIES],
      revalidate: CACHE_TTL_SECONDS,
    });
    return await cached(normalized);
  } catch (error: any) {
    console.error("Error fetching category products:", error);
    return { success: false, products: [] as any[] };
  }
}

/* ───────────────────────────── Search (uncached: query is free-form) ───────────────────────────── */

export async function searchLiveCatalog(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, products: [], stores: [] };
    }

    const cleanQuery = query.trim().toLowerCase().slice(0, 100);
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
          store: { select: LIST_STORE_SELECT },
          category: true,
        },
        take: 60,
        orderBy: { createdAt: "desc" },
      }),
      prisma.store.findMany({
        where: {
          OR: storeOrConditions,
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          isOpen: true,
          isService: true,
          category: true,
          serviceSubcategory: true,
          availabilityStatus: true,
          startingPrice: true,
          estimatedDelivery: true,
          deliveryFee: true,
          rating: true,
          openingTime: true,
          closingTime: true,
          updatedAt: true,
          _count: { select: { products: true, orders: true } },
        },
        take: 20,
      }),
    ]);

    return {
      success: true,
      products: products.map((p) => formatListProduct(p, 4.9)),
      stores: stores.map(slimStore),
    };
  } catch (error: any) {
    console.error("Error searching live catalog:", error);
    return { success: false, products: [], stores: [] };
  }
}

export async function getServicePersonnel() {
  try {
    const stores = await readServiceStoresCached();
    return { success: true, stores };
  } catch (error: any) {
    console.error("Error fetching service personnel:", error);
    return { success: false, stores: [] as any[] };
  }
}
