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
 * Extracts an array of image URLs/data URIs from a product's image field.
 * Supports both JSON stringified arrays, data URIs, and single URL strings.
 */
export function parseProductImages(imageField?: string | null | any): string[] {
  if (!imageField) return [DEFAULT_FALLBACK_IMAGE];
  if (typeof imageField !== "string") {
    if (Array.isArray(imageField) && imageField.length > 0) {
      const valid = imageField.map((img) => String(img || "").trim()).filter(Boolean);
      return valid.length > 0 ? valid : [DEFAULT_FALLBACK_IMAGE];
    }
    return [DEFAULT_FALLBACK_IMAGE];
  }
  const trimmed = imageField.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
        if (valid.length > 0) return valid;
      }
    } catch {
      // Fallback
    }
  }
  if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") {
    return [DEFAULT_FALLBACK_IMAGE];
  }
  return [trimmed];
}

/**
 * Returns a single safe URL or data URI from any image field (JSON array string, data URI, or URL).
 */
export function getSafeImageUrl(imageField?: string | null | any): string {
  const images = parseProductImages(imageField);
  return images[0] || DEFAULT_FALLBACK_IMAGE;
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
