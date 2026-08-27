import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLiveStoreById } from "@/actions/marketplace";
import VendorStoreClient from "./VendorStoreClient";

interface VendorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await getLiveStoreById(id);

  if (!res.success || !res.store) {
    return {
      title: "Campus Store — Lightson Marketplace",
      description: "Explore campus stores and student merchants on Lightson Marketplace.",
    };
  }

  const store = res.store;
  const title = `${store.name} — Lightson Marketplace`;
  const description = store.description || `Order fresh food, pastries, and campus items from ${store.name} on Lightson Marketplace. Fast hostel delivery.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: store.logo ? [{ url: store.logo }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: store.logo ? [store.logo] : undefined,
    },
  };
}

export default async function VendorStorefrontPage({ params }: VendorPageProps) {
  const { id } = await params;
  const res = await getLiveStoreById(id);

  return <VendorStoreClient initialStore={res.success ? res.store : null} id={id} />;
}
