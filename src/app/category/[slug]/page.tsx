import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLiveCategoryProducts } from "@/actions/marketplace";
import { getMajorCategoryBySlug, normalizeCategorySlug } from "@/lib/categories";
import CategoryClient from "./CategoryClient";

// Cache category catalogs on CDN edge for 60 seconds
export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const majorCat = getMajorCategoryBySlug(slug);
  const title = majorCat
    ? `${majorCat.name} — Lightson Marketplace`
    : `${slug.charAt(0).toUpperCase() + slug.slice(1)} — Lightson Marketplace`;
  const desc = majorCat
    ? majorCat.description
    : `Browse ${slug} products and stores on Lightson Campus Marketplace. Fast delivery.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const normalized = (slug || "").toLowerCase().trim();

  // Medical and Laundry are consolidated under Services
  if (normalized === "medical" || normalized === "medicals" || normalized === "laundry") {
    redirect("/category/services");
  }

  const canonical = normalizeCategorySlug(normalized);
  if (canonical && canonical !== normalized && normalized !== "fashion") {
    redirect(`/category/${canonical}`);
  }

  const res = await getLiveCategoryProducts(canonical || slug);

  return (
    <CategoryClient
      initialProducts={res.success ? res.products : []}
      initialServiceStores={res.success ? (res as any).serviceStores || [] : []}
      slug={canonical || slug}
    />
  );
}
