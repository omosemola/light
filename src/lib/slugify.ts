import { PrismaClient } from "@prisma/client";

/**
 * Standard URL slug generator
 * - Lowercase
 * - Hyphen-separated
 * - Clean, alphanumeric, human-readable
 * - Strips special characters
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // normalize accented characters
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
    .replace(/[\s_]+/g, "-") // replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

/**
 * Generates a collision-resistant unique slug for a product
 */
export async function generateUniqueProductSlug(
  prisma: PrismaClient,
  name: string,
  excludeProductId?: string
): Promise<string> {
  const baseSlug = slugify(name) || "product";
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidateSlug,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }
}
