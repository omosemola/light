import type { Metadata } from "next";
import { getLiveCategoryProducts } from "@/actions/marketplace";
import CategoryClient from "./CategoryClient";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_TITLES: Record<string, { title: string; desc: string }> = {
  food: {
    title: "Food & Meals — Lightson Marketplace",
    desc: "Order hot, freshly prepared campus meals, combos, and delicacies on Lightson.",
  },
  snacks: {
    title: "Snacks & Treats — Lightson Marketplace",
    desc: "Quick bites, popcorn, chips, nuts, and sweet snacks for campus lectures and study nights.",
  },
  drinks: {
    title: "Drinks & Smoothies — Lightson Marketplace",
    desc: "Chilled juices, sodas, energy drinks, and smoothies delivered to your hostel room.",
  },
  groceries: {
    title: "Groceries & Provisions — Lightson Marketplace",
    desc: "Daily dorm essentials, noodles, breakfast provisions, and snacks on Lightson.",
  },
  pastries: {
    title: "Pastries & Bakery — Lightson Marketplace",
    desc: "Freshly baked meat pies, cakes, donuts, and bread on Lightson Marketplace.",
  },
  medical: {
    title: "Medical & Health Care — Lightson Marketplace",
    desc: "Campus first aid kits, vitamins, and healthcare essentials on Lightson Marketplace.",
  },
  laundry: {
    title: "Laundry & Dry Cleaning — Lightson Marketplace",
    desc: "Fast hostel laundry wash, dry, and fold services on Lightson Marketplace.",
  },
  stationery: {
    title: "Stationery & Books — Lightson Marketplace",
    desc: "Exam note pads, pens, calculators, and campus study materials on Lightson.",
  },
  care: {
    title: "Personal Care & Toiletries — Lightson Marketplace",
    desc: "Skincare, soaps, hair care, and dorm hygiene items on Lightson Marketplace.",
  },
  sports: {
    title: "Sports & Fitness — Lightson Marketplace",
    desc: "Campus athletic gear, gym bands, jerseys, and football boots on Lightson.",
  },
  wears: {
    title: "Fashion & Wears — Lightson Marketplace",
    desc: "Trendy campus hoodies, tees, caps, and outfits on Lightson Marketplace.",
  },
  jewelries: {
    title: "Jewelries & Accessories — Lightson Marketplace",
    desc: "Stylish Cuban chains, rings, bracelets, and watches on Lightson Marketplace.",
  },
  gadgets: {
    title: "Tech & Gadgets — Lightson Marketplace",
    desc: "Power banks, earbuds, chargers, and tech accessories on Lightson Marketplace.",
  },
  electronics: {
    title: "Electronics & Appliances — Lightson Marketplace",
    desc: "Study lamps, electric kettles, room fans, and speakers on Lightson Marketplace.",
  },
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.toLowerCase();
  const info = CATEGORY_TITLES[normalized] || {
    title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} — Lightson Marketplace`,
    desc: `Browse ${slug} products and stores on Lightson Campus Marketplace. Fast delivery.`,
  };

  return {
    title: info.title,
    description: info.desc,
    openGraph: {
      title: info.title,
      description: info.desc,
    },
    twitter: {
      card: "summary_large_image",
      title: info.title,
      description: info.desc,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const res = await getLiveCategoryProducts(slug);

  return (
    <CategoryClient
      initialProducts={res.success ? res.products : []}
      slug={slug}
    />
  );
}
