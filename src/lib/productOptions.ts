export interface VariationOption {
  name: string;
  price: number;
}

export interface AddOnOption {
  name: string;
  price: number;
}

export interface ProductStructuredData {
  description: string;
  ingredients: string[];
  sizes: VariationOption[];
  addons: AddOnOption[];
}

export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

/**
 * Ensures a Cloudinary image URL includes f_auto,q_auto transformations
 * so that browsers receive modern, compressed WebP/AVIF images directly from Cloudinary edge CDN.
 */
export function formatCloudinaryUrl(
  url?: string | null,
  transformations: string = "f_auto,q_auto"
): string {
  if (!url || typeof url !== "string") return DEFAULT_FALLBACK_IMAGE;
  const trimmed = url.trim();
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes("/upload/")) {
    return trimmed;
  }
  if (
    trimmed.includes("/upload/f_auto") ||
    trimmed.includes("/upload/q_auto") ||
    trimmed.includes("f_auto,q_auto")
  ) {
    return trimmed;
  }
  return trimmed.replace("/upload/", `/upload/${transformations}/`);
}

/**
 * Extracts an array of image URLs/data URIs from a product's image field.
 * Supports both JSON stringified arrays, data URIs, and single URL strings.
 * Automatically injects Cloudinary f_auto,q_auto edge delivery transformations.
 */
export function parseProductImages(imageField?: string | null | any): string[] {
  if (!imageField) return [DEFAULT_FALLBACK_IMAGE];
  if (typeof imageField !== "string") {
    if (Array.isArray(imageField) && imageField.length > 0) {
      const valid = imageField.map((img) => String(img || "").trim()).filter(Boolean);
      return valid.length > 0 ? valid.map((u) => formatCloudinaryUrl(u)) : [DEFAULT_FALLBACK_IMAGE];
    }
    return [DEFAULT_FALLBACK_IMAGE];
  }
  const trimmed = imageField.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
        if (valid.length > 0) return valid.map((u) => formatCloudinaryUrl(u));
      }
    } catch {
      // Fallback
    }
  }
  if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") {
    return [DEFAULT_FALLBACK_IMAGE];
  }
  return [formatCloudinaryUrl(trimmed)];
}

/**
 * Returns a single safe URL or data URI from any image field (JSON array string, data URI, or URL).
 */
export function getSafeImageUrl(imageField?: string | null | any): string {
  const images = parseProductImages(imageField);
  return images[0] || DEFAULT_FALLBACK_IMAGE;
}

/**
 * Checks if an image should bypass Next.js image optimization (data URIs or local DB image route)
 */
export function isUnoptimizedImage(url?: string | null | any): boolean {
  if (typeof url !== "string") return false;
  return url.startsWith("data:") || url.startsWith("/api/img/");
}

/**
 * Formats a Cloudinary URL to request optimized, transformed images directly from the CDN edge.
 * Injects automatic format negotiation (AVIF/WebP) and quality adjustments.
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:good" | "auto:eco" | "auto:best" | number;
    crop?: "fill" | "limit" | "fit" | "scale" | "thumb";
    format?: "auto" | "webp" | "avif" | "jpg";
  }
): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  const transformations: string[] = [];
  const format = options?.format || "auto";
  const quality = options?.quality || "auto";
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  else if (options?.width || options?.height) transformations.push("c_limit");

  const transformString = transformations.join(",");
  let afterUpload = parts[1];

  // Strip existing f_auto,q_auto transformations segment if already present
  if (afterUpload.startsWith("f_auto,q_auto/")) {
    afterUpload = afterUpload.slice("f_auto,q_auto/".length);
  } else if (afterUpload.startsWith("f_auto/") || afterUpload.startsWith("q_auto/")) {
    const slashIdx = afterUpload.indexOf("/");
    if (slashIdx !== -1) {
      afterUpload = afterUpload.slice(slashIdx + 1);
    }
  }

  return `${parts[0]}/upload/${transformString}/${afterUpload}`;
}

/**
 * Encodes an array of images into a single string for storage.
 */
export function encodeProductImages(images: string[]): string {
  const cleanImages = images.filter((img) => img && img.trim().length > 0);
  if (cleanImages.length === 0) return DEFAULT_FALLBACK_IMAGE;
  if (cleanImages.length === 1) return cleanImages[0];
  return JSON.stringify(cleanImages);
}

/**
 * Encodes description, ingredients, portion sizes, and custom add-ons into a single string.
 */
export function encodeProductDescription(data: ProductStructuredData): string {
  const cleanDesc = (data.description || "").trim();
  const cleanIngredients = (data.ingredients || []).map((i) => i.trim()).filter(Boolean);
  const cleanSizes = (data.sizes || []).filter((s) => s.name && s.name.trim());
  const cleanAddons = (data.addons || []).filter((a) => a.name && a.name.trim());

  const metadata: any = {};
  if (cleanIngredients.length > 0) metadata.ingredients = cleanIngredients;
  if (cleanSizes.length > 0) metadata.sizes = cleanSizes;
  if (cleanAddons.length > 0) metadata.addons = cleanAddons;

  if (Object.keys(metadata).length === 0) {
    return cleanDesc;
  }

  return `${cleanDesc}\n\n[OPTIONS: ${JSON.stringify(metadata)}]`.trim();
}

/**
 * Decodes a product description string into structured description, ingredients, sizes, and add-ons.
 * Maintains complete backward compatibility with older [OPTIONS: {...}] and plain text descriptions.
 */
export function parseProductDescription(rawDescription?: string | null): ProductStructuredData {
  if (!rawDescription) {
    return {
      description: "",
      ingredients: [],
      sizes: [],
      addons: [],
    };
  }

  const raw = rawDescription.trim();
  const match = raw.match(/\[OPTIONS:\s*(\{[\s\S]*?\})\]/);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanDesc = raw.replace(/\[OPTIONS:\s*\{[\s\S]*?\}\]/, "").trim();

      const ingredients = Array.isArray(parsed.ingredients)
        ? parsed.ingredients.map((i: any) => String(i).trim()).filter(Boolean)
        : [];

      const sizes: VariationOption[] = Array.isArray(parsed.sizes)
        ? parsed.sizes.map((s: any) => ({
            name: String(s.name || "").trim(),
            price: Number(s.price) || 0,
          })).filter((s: VariationOption) => s.name.length > 0)
        : [];

      const addons: AddOnOption[] = Array.isArray(parsed.addons)
        ? parsed.addons.map((a: any) => ({
            name: String(a.name || "").trim(),
            price: Number(a.price) || 0,
          })).filter((a: AddOnOption) => a.name.length > 0)
        : [];

      return {
        description: cleanDesc,
        ingredients,
        sizes,
        addons,
      };
    } catch {
      // Fall through to plain text
    }
  }

  return {
    description: raw,
    ingredients: [],
    sizes: [],
    addons: [],
  };
}
