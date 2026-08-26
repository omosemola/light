import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://lightsonmarketplace.com";

  try {
    const [products, categories, stores] = await Promise.all([
      prisma.product.findMany({
        where: { isAvailable: true },
        select: { id: true, slug: true, updatedAt: true },
        take: 500,
      }),
      prisma.category.findMany({
        select: { id: true, updatedAt: true },
      }),
      prisma.store.findMany({
        select: { id: true, updatedAt: true },
      }),
    ]);

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug || p.id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/category/${c.id}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const storeEntries: MetadataRoute.Sitemap = stores.map((s) => ({
      url: `${baseUrl}/vendor/${s.id}`,
      lastModified: s.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/support`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      ...productEntries,
      ...categoryEntries,
      ...storeEntries,
    ];
  } catch (e) {
    console.error("Error generating sitemap:", e);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];
  }
}
