import { parseProductImages, encodeProductImages } from "@/lib/productOptions";

/**
 * Uploaded images may be stored in the database as base64 `data:` URIs (when Cloudinary is
 * not configured). Shipping those inline inside list/page payloads makes server responses
 * several MB large, which is what intermittently breaks pages on serverless hosts.
 *
 * These helpers swap every `data:` URI for a small, versioned, immutable URL served by
 * `/api/img/...` (which the browser and `next/image` can cache aggressively).
 */

export type ImageKind = "product" | "logo" | "cover" | "avatar";

type DateLike = Date | string | number | null | undefined;

function isDataUri(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

function version(updatedAt: DateLike): number {
  if (!updatedAt) return 0;
  const t = new Date(updatedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function buildImageUrl(kind: ImageKind, id: string, index: number, updatedAt: DateLike): string {
  return `/api/img/${kind}/${encodeURIComponent(id)}/${index}/${version(updatedAt)}`;
}

/** Replaces the `data:` URIs inside a product `image` field (single value or JSON array). */
export function optimizeProductImageField(
  raw: string | null | undefined,
  productId: string,
  updatedAt: DateLike,
  options: { firstOnly?: boolean } = {}
): string {
  const images = parseProductImages(raw);
  const mapped = images.map((img, idx) => (isDataUri(img) ? buildImageUrl("product", productId, idx, updatedAt) : img));
  return encodeProductImages(options.firstOnly ? mapped.slice(0, 1) : mapped);
}

/** Replaces a single image value (store logo / cover / user avatar) when it is a `data:` URI. */
export function optimizeSingleImage<T extends string | null | undefined>(
  value: T,
  kind: Exclude<ImageKind, "product">,
  id: string,
  updatedAt: DateLike
): T | string {
  if (isDataUri(value)) return buildImageUrl(kind, id, 0, updatedAt);
  return value;
}

export function shapeStoreImages<S extends { id: string; logo?: string | null; coverImage?: string | null; updatedAt?: DateLike }>(
  store: S
): S {
  return {
    ...store,
    logo: optimizeSingleImage(store.logo, "logo", store.id, store.updatedAt) as S["logo"],
    coverImage: optimizeSingleImage(store.coverImage, "cover", store.id, store.updatedAt) as S["coverImage"],
  };
}

export function shapeProductImages<P extends { id: string; image: string; updatedAt?: DateLike }>(
  product: P,
  options: { firstOnly?: boolean } = {}
): P {
  return {
    ...product,
    image: optimizeProductImageField(product.image, product.id, product.updatedAt, options),
  };
}

export function shapeUserImage<U extends { id?: string; image?: string | null; updatedAt?: DateLike }>(user: U | null | undefined): U | null | undefined {
  if (!user) return user;
  if (!user.id) {
    // Cannot build a stable URL without an id; never leak a multi-hundred-KB data URI.
    return isDataUri(user.image) ? { ...user, image: null } : user;
  }
  return { ...user, image: optimizeSingleImage(user.image, "avatar", user.id, user.updatedAt) as U["image"] };
}
