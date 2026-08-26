import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLiveProductBySlugOrId } from "@/actions/marketplace";
import { parseProductDescription, parseProductImages } from "@/lib/productOptions";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await getLiveProductBySlugOrId(slug);

  if (!res.success || !res.product) {
    return {
      title: "Product Not Found — Lightson Marketplace",
      description: "Explore fresh meals, pastries, snacks, and student essentials on Lightson Campus Marketplace.",
    };
  }

  const product = res.product;
  const storeName = product.store?.name || "Campus Vendor";
  const parsedImages = parseProductImages(product.image);
  const mainImage = parsedImages[0] || product.image || "https://lightsonmarketplace.com/support-banner.jpg";
  const structuredData = parseProductDescription(product.description);
  const cleanDescription = structuredData.description 
    ? structuredData.description.slice(0, 160)
    : `Buy ${product.name} from ${storeName} on Lightson Marketplace. View price, availability and product details.`;

  const canonicalUrl = `https://lightsonmarketplace.com/product/${product.slug || product.id}`;
  const pageTitle = `${product.name} — Lightson Marketplace`;

  return {
    title: pageTitle,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: "Lightson Marketplace",
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: mainImage,
          width: 800,
          height: 600,
          alt: `${product.name} by ${storeName} on Lightson Marketplace`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: cleanDescription,
      images: [mainImage],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const res = await getLiveProductBySlugOrId(slug);

  if (!res.success || !res.product) {
    notFound();
  }

  const product = res.product;
  const storeName = product.store?.name || "Campus Vendor";
  const parsedImages = parseProductImages(product.image);
  const mainImage = parsedImages[0] || product.image;
  const structuredData = parseProductDescription(product.description);
  const cleanDescription = structuredData.description || `Fresh ${product.name} prepared on campus by ${storeName}.`;
  const canonicalUrl = `https://lightsonmarketplace.com/product/${product.slug || product.id}`;

  // Authentic Schema.org Product JSON-LD structured data
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanDescription,
    image: parsedImages.length > 0 ? parsedImages : [mainImage],
    url: canonicalUrl,
    sku: product.slug || product.id,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "NGN",
      price: product.price,
      priceValidUntil: "2027-12-31",
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
  };

  // Only include verified reviews from database if they exist (no fake reviews)
  const dbReviews = product.store?.reviews || [];
  if (dbReviews.length > 0) {
    const avgRating = (dbReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / dbReviews.length).toFixed(1);
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: dbReviews.length,
      bestRating: "5",
      worstRating: "1",
    };
    jsonLd.review = dbReviews.map((r: any) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: r.user?.name || "Student",
      },
      reviewBody: r.comment || "",
    }));
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} slug={slug} />
    </>
  );
}
