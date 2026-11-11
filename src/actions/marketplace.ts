"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeIsStoreOpen } from "@/lib/storeSchedule";
import { parseProductImages, formatCloudinaryUrl } from "@/lib/productOptions";
import { slugify } from "@/lib/slugify";
import { parseSearchQuery } from "@/lib/searchEngine";
import {
  normalizeCategorySlug,
  getCategoryAliases,
  getMajorCategoryBySlug,
} from "@/lib/categories";
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
    // Search metadata: real category (no fallback) + store category for uncategorised products.
    categoryId: p.categoryId || null,
    categoryName: p.category?.name || "",
    storeCategory: p.store?.category || "",
  };
}

// Only the store columns needed to render product lists / compute open state (never logo/cover blobs).
const LIST_STORE_SELECT = {
  id: true,
  name: true,
  category: true,
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
        where: { isAvailable: true },
        include: {
          store: { select: LIST_STORE_SELECT },
          category: { select: { id: true, name: true } },
        },
        take: 48,
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
        take: 100,
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

/* ───────────────────────────── Search Catalog (Full Platform) ───────────────────────────── */

const readSearchCatalogData = unstable_cache(
  async () => {
    const [products, stores, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isAvailable: true },
        include: {
          store: { select: LIST_STORE_SELECT },
          category: { select: { id: true, name: true } },
        },
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
  ["marketplace-search-catalog-v2"],
  { tags: [TAG_ALL, TAG_PRODUCTS, TAG_STORES, TAG_CATEGORIES], revalidate: CACHE_TTL_SECONDS }
);

export async function getLiveSearchCatalog() {
  try {
    return await readSearchCatalogData();
  } catch (error: any) {
    console.error("Error fetching live search catalog:", error);
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
  const image = optimizeProductImageField(p.image, p.id, p.updatedAt, { firstOnly: true });
  const mainImage = parseProductImages(image)[0] || image;
  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    price: p.price,
    image: formatCloudinaryUrl(mainImage),
    description: p.description,
    isAvailable: p.isAvailable,
    storeId: p.storeId,
    store: p.store ? { id: p.store.id, name: p.store.name } : undefined,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
  };
}

async function readCategoryProducts(normalizedInput: string) {
  const canonicalSlug = normalizeCategorySlug(normalizedInput);

  // SERVICES umbrella category: aggregates registered service personnel and availability
  if (canonicalSlug === "services") {
    const serviceStores = await readServiceStores();
    return { success: true as const, products: [] as any[], serviceStores };
  }

  const categoryProductInclude = {
    store: { select: { id: true, name: true } },
    category: { select: { id: true, name: true } },
  };

  const aliases = getCategoryAliases(canonicalSlug);
  const majorCat = getMajorCategoryBySlug(canonicalSlug);
  const searchStems = majorCat?.searchStems || [canonicalSlug];

  const orConditions: any[] = [
    { categoryId: { in: aliases } },
    { category: { id: { in: aliases } } },
    { category: { name: { in: aliases, mode: "insensitive" } } },
  ];

  // Include top search stems for broad recall
  for (const stem of searchStems.slice(0, 4)) {
    orConditions.push({
      category: { name: { contains: stem, mode: "insensitive" } },
    });
  }

  const products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      OR: orConditions,
    },
    include: categoryProductInclude,
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  return { success: true as const, products: products.map(formatCategoryProduct) };
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

    // Shared tokenizer + synonyms (same rules the client uses to rank results).
    const parsed = parseSearchQuery(query.slice(0, 100));
    if (parsed.tokens.length === 0) {
      return { success: true, products: [], stores: [] };
    }

    const terms = Array.from(new Set([parsed.phrase, ...parsed.tokens])).filter(Boolean);

    // Broad recall: any term in title, description, category, vendor name or vendor category.
    // Precise ranking happens on the client with `scoreProduct`.
    const productOrConditions: any[] = [];
    for (const term of terms) {
      productOrConditions.push(
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
        { store: { name: { contains: term, mode: "insensitive" } } },
        { store: { category: { contains: term, mode: "insensitive" } } }
      );
    }

    // Synonyms: e.g. "perfume" → Fragrances, "meals" → Food / Campus Food & Meals.
    if (parsed.synonymCategoryIds.length > 0) {
      productOrConditions.push({ categoryId: { in: parsed.synonymCategoryIds } });
    }

    const storeOrConditions: any[] = [];
    for (const term of terms) {
      storeOrConditions.push(
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { serviceSubcategory: { contains: term, mode: "insensitive" } }
      );
    }
    for (const keyword of parsed.synonymCategoryKeywords) {
      storeOrConditions.push({ category: { contains: keyword, mode: "insensitive" } });
    }

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: productOrConditions,
        },
        include: {
          store: { select: LIST_STORE_SELECT },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
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
        orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
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

/**
 * High-performance paginated product queries with server-side filtering, sorting, and lean projection.
 * Designed for infinite scroll and progressive loading.
 */
export async function getPaginatedProducts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  storeId?: string;
  search?: string;
  sortBy?: "newest" | "price-asc" | "price-desc" | "name";
} = {}) {
  try {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { isAvailable: true };

    if (options.storeId) {
      where.storeId = options.storeId;
    }

    if (options.categorySlug && options.categorySlug !== "all") {
      const cleanSlug = options.categorySlug.toLowerCase().trim();
      where.OR = [
        { categoryId: cleanSlug },
        { category: { name: { equals: cleanSlug, mode: "insensitive" } } },
      ];
    }

    if (options.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (options.sortBy === "price-asc") orderBy = { price: "asc" };
    else if (options.sortBy === "price-desc") orderBy = { price: "desc" };
    else if (options.sortBy === "name") orderBy = { name: "asc" };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          image: true,
          description: true,
          isAvailable: true,
          estimatedDelivery: true,
          deliveryFee: true,
          createdAt: true,
          updatedAt: true,
          storeId: true,
          store: { select: LIST_STORE_SELECT },
          category: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return {
      success: true,
      products: products.map((p) => formatListProduct(p, 4.8)),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    };
  } catch (error: any) {
    console.error("Error in getPaginatedProducts:", error);
    return {
      success: false,
      products: [],
      pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0, hasMore: false },
    };
  }
}
