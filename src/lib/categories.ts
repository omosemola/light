import type { ComponentType } from "react";
import {
  Utensils,
  Cake,
  Cookie,
  Coffee,
  ShoppingBag,
  Shirt,
  Gem,
  SprayCan,
  HeartPulse,
  Smartphone,
  BookOpen,
  Dumbbell,
  Palette,
  Car,
  Briefcase,
} from "lucide-react";

export interface MajorCategory {
  id: string; // canonical slug e.g. "food"
  slug: string; // canonical slug e.g. "food"
  name: string; // Full display name e.g. "Food & Meals"
  shortName: string; // Compact pill name e.g. "Food"
  badge: string; // Campus badge e.g. "Hot Meals"
  icon: ComponentType<{ size?: number | string; className?: string }>;
  iconName: string;
  iconColor: string;
  description: string;
  heroImage: string;
  dbAliases: string[]; // Alternate database category IDs / names
  storeCategoryNames: string[]; // Vendor store category names mapped here
  searchStems: string[]; // Synonyms / search stems
}

export const MAJOR_CATEGORIES: MajorCategory[] = [
  {
    id: "food",
    slug: "food",
    name: "Food & Meals",
    shortName: "Food",
    badge: "Hot Meals",
    icon: Utensils,
    iconName: "Utensils",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Order hot, freshly prepared campus meals, combos, and delicacies on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["food", "campus-food-meals", "Food", "Food & Meals", "Campus Food & Meals"],
    storeCategoryNames: ["Campus Food & Meals"],
    searchStems: ["food", "meal", "cafeteria", "kitchen", "cook", "dish", "rice", "swallow", "shawarma", "lunch", "dinner", "breakfast"],
  },
  {
    id: "pastries",
    slug: "pastries",
    name: "Pastries & Bakery",
    shortName: "Pastries",
    badge: "Fresh Bakery",
    icon: Cake,
    iconName: "Cake",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Freshly baked meat pies, cakes, donuts, and bread on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["pastries", "Pastries", "Pastries & Bakery"],
    storeCategoryNames: ["Pastries & Bakery"],
    searchStems: ["pastr", "bakery", "bread", "cake", "confection", "meatpie", "pie", "donut", "doughnut", "puff", "roll"],
  },
  {
    id: "snacks",
    slug: "snacks",
    name: "Snacks & Treats",
    shortName: "Snacks",
    badge: "Quick Bites",
    icon: Cookie,
    iconName: "Cookie",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Quick bites, popcorn, chips, nuts, and sweet snacks for campus lectures and study nights.",
    heroImage: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["snacks", "cafeteria-snacks-combos", "Snacks", "Snacks & Treats", "Cafeteria & Snacks Combos"],
    storeCategoryNames: ["Cafeteria & Snacks Combos", "Snacks & Treats"],
    searchStems: ["snack", "chops", "chips", "popcorn", "cookie", "biscuit", "nuts", "sweet", "treat", "munch"],
  },
  {
    id: "drinks",
    slug: "drinks",
    name: "Drinks & Smoothies",
    shortName: "Drinks",
    badge: "Chilled Drinks",
    icon: Coffee,
    iconName: "Coffee",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Chilled juices, sodas, energy drinks, and smoothies delivered to your hostel room.",
    heroImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["drinks", "Drinks", "Drinks & Smoothies", "Drinks, Smoothies & Beverages"],
    storeCategoryNames: ["Drinks & Smoothies", "Drinks, Smoothies & Beverages"],
    searchStems: ["drink", "juice", "beverage", "zobo", "smoothie", "shake", "soda", "water", "yoghurt", "yogurt", "coffee", "tea", "boba", "malt"],
  },
  {
    id: "groceries",
    slug: "groceries",
    name: "Groceries & Provisions",
    shortName: "Groceries",
    badge: "Daily Dorm",
    icon: ShoppingBag,
    iconName: "ShoppingBag",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Daily dorm essentials, noodles, breakfast provisions, and snacks on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["groceries", "Groceries", "Groceries & Provisions", "Provisions & Hostel Groceries"],
    storeCategoryNames: ["Provisions & Hostel Groceries", "Groceries & Provisions"],
    searchStems: ["grocer", "provision", "foodstuff", "noodle", "indomie", "milk", "cereal", "milo", "sugar", "biscuit", "dorm essential", "canned"],
  },
  {
    id: "wears",
    slug: "wears",
    name: "Fashion & Campus Wears",
    shortName: "Fashion",
    badge: "Campus Style",
    icon: Shirt,
    iconName: "Shirt",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Trendy campus hoodies, tees, caps, and outfits on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["wears", "fashion-wears-campus-merch", "fashion", "sports-wears", "Wears", "Fashion & Wears", "Fashion, Wears & Campus Merch"],
    storeCategoryNames: ["Fashion, Wears & Campus Merch", "Fashion & Wears"],
    searchStems: ["wear", "fashion", "cloth", "merch", "apparel", "hoodie", "shirt", "pant", "jean", "t-shirt", "tee", "cap", "jacket", "dress", "thrift", "outfit"],
  },
  {
    id: "jewelries",
    slug: "jewelries",
    name: "Jewelries & Accessories",
    shortName: "Jewelries",
    badge: "Ice & Bling",
    icon: Gem,
    iconName: "Gem",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Stylish Cuban chains, rings, bracelets, and watches on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["jewelries", "accessories", "Jewelries", "Jewelries & Accessories", "Accessories"],
    storeCategoryNames: ["Jewelries & Accessories", "Jewelries"],
    searchStems: ["jewel", "jewelry", "jewellery", "chain", "ring", "bracelet", "watch", "wristwatch", "pendant", "necklace", "earring", "anklet", "bling", "ice", "sunglass"],
  },
  {
    id: "fragrances",
    slug: "fragrances",
    name: "Fragrances & Scents",
    shortName: "Fragrances",
    badge: "Perfumes & Oils",
    icon: SprayCan,
    iconName: "SprayCan",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Long-lasting perfumes, oil perfumes, roll-ons, and scented body sprays on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["fragrances", "Fragrances", "Fragrances & Scents", "Fragrances, Perfumes & Roll-ons"],
    storeCategoryNames: ["Fragrances, Perfumes & Roll-ons", "Fragrances & Scents"],
    searchStems: ["fragran", "perfum", "scent", "cologn", "oud", "spray", "mist", "rollon", "roll-on", "deodor", "attar", "oil"],
  },
  {
    id: "care",
    slug: "care",
    name: "Beauty & Personal Care",
    shortName: "Beauty & Care",
    badge: "Personal Care",
    icon: HeartPulse,
    iconName: "HeartPulse",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Skincare, soaps, hair care, and dorm hygiene items on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["care", "beauty-skincare-personal-care", "beauty", "Care", "Personal Care", "Beauty, Skincare & Personal Care"],
    storeCategoryNames: ["Beauty, Skincare & Personal Care", "Personal Care"],
    searchStems: ["care", "beauty", "skin", "skincare", "lotion", "cream", "soap", "hair", "haircare", "cosmetic", "makeup", "serum", "lip", "body wash", "hygiene"],
  },
  {
    id: "gadgets",
    slug: "gadgets",
    name: "Tech & Gadgets",
    shortName: "Tech & Gadgets",
    badge: "Tech Gadgets",
    icon: Smartphone,
    iconName: "Smartphone",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Power banks, earbuds, chargers, and tech accessories on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["gadgets", "gadgets---accessories", "electronics", "Gadgets", "Tech & Gadgets", "Tech, Gadgets & Accessories", "Electronics"],
    storeCategoryNames: ["Tech, Gadgets & Accessories", "Tech & Gadgets"],
    searchStems: ["gadget", "tech", "phone", "charger", "powerbank", "earbud", "earpiece", "headphone", "cable", "laptop", "usb", "screen guard", "case", "bluetooth", "speaker", "electronic"],
  },
  {
    id: "stationery",
    slug: "stationery",
    name: "Stationery & Books",
    shortName: "Stationery",
    badge: "Study & Exam",
    icon: BookOpen,
    iconName: "BookOpen",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Exam note pads, pens, calculators, and campus study materials on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["stationery", "Stationery", "Stationery & Books", "Stationery, Books & Study Items"],
    storeCategoryNames: ["Stationery, Books & Study Items", "Stationery & Books"],
    searchStems: ["stationery", "book", "note", "notepad", "pen", "pencil", "calculator", "exam", "ruler", "folder", "highlighter", "study", "jotter"],
  },
  {
    id: "sports",
    slug: "sports",
    name: "Sports & Fitness",
    shortName: "Sports",
    badge: "Fitness & Gym",
    icon: Dumbbell,
    iconName: "Dumbbell",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Campus athletic gear, gym bands, jerseys, and football boots on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["sports", "sports-wears", "Sports", "Sports & Fitness", "Sports, Fitness & Gym Equipment"],
    storeCategoryNames: ["Sports, Fitness & Gym Equipment", "Sports & Fitness"],
    searchStems: ["sport", "fitness", "gym", "jersey", "workout", "dumbbell", "boot", "sneaker", "ball", "skipping", "resistance", "athlet"],
  },
  {
    id: "decorations",
    slug: "decorations",
    name: "Interior Decorations & Asthetics",
    shortName: "Decorations",
    badge: "Room & Asthetics",
    icon: Palette,
    iconName: "Palette",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Campus dorm and room decor, aesthetic wall art, ambient lighting, plushies, and living space organizers.",
    heroImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["decorations", "interior-decorations", "Decorations", "Interior Decorations & Asthetics", "Interior Decorations & Aesthetics"],
    storeCategoryNames: ["Interior Decorations & Asthetics", "Interior Decorations & Aesthetics"],
    searchStems: ["decor", "interior", "asthetic", "aesthetic", "light", "fairy light", "frame", "wall", "poster", "plush", "pillow", "rug", "curtain"],
  },
  {
    id: "automobile",
    slug: "automobile",
    name: "Automobile & Rides",
    shortName: "Automobile",
    badge: "Cars & Bikes",
    icon: Car,
    iconName: "Car",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Cars, motorbikes, power bikes, bicycles, and personal mobility for sale on Lightson Marketplace.",
    heroImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["automobile", "Automobile", "Automobiles, Cars & Bikes"],
    storeCategoryNames: ["Automobiles, Cars & Bikes", "Automobile"],
    searchStems: ["automobile", "auto", "car", "bike", "bicycle", "motorbike", "power bike", "scooter", "ride", "helmet", "tyre"],
  },
  {
    id: "services",
    slug: "services",
    name: "Campus Services",
    shortName: "Services",
    badge: "Laundry & Meds",
    icon: Briefcase,
    iconName: "Briefcase",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Campus hostel laundry, dry cleaning, medicals, pharmacy, and student services on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["services", "laundry", "medical", "medicals", "Services", "Campus Services"],
    storeCategoryNames: [
      "Services: Laundry & Dry Cleaning",
      "Services: Medicals & Pharmacy",
      "Services: Printing, Binding & Graphic Design",
      "Services: Hair Styling, Barbing & Grooming",
      "Services: Tech, Laptop & Phone Repair",
      "Services: Room Cleaning, Fumigation & Errands",
      "Services: Tailoring & Fashion Alterations",
      "Services: Tutorials & Academic Coaching",
      "Services: Photography & Video Media",
      "Services: Other Campus Services",
    ],
    searchStems: ["service", "medic", "pharm", "health", "drug", "laundr", "wash", "clean", "errand", "barb", "hair", "repair", "print", "tailor", "tutor", "photo"],
  },
];

/* ───────────────────────────── Store Categories (Vendor Signup & Edit) ───────────────────────────── */

export const STORE_CATEGORY_OPTIONS: string[] = [
  // Product / Retail Store Categories
  "Campus Food & Meals",
  "Cafeteria & Snacks Combos",
  "Pastries & Bakery",
  "Drinks, Smoothies & Beverages",
  "Provisions & Hostel Groceries",
  "Fashion, Wears & Campus Merch",
  "Jewelries & Accessories",
  "Fragrances, Perfumes & Roll-ons",
  "Beauty, Skincare & Personal Care",
  "Tech, Gadgets & Accessories",
  "Stationery, Books & Study Items",
  "Sports, Fitness & Gym Equipment",
  "Interior Decorations & Asthetics",
  "Automobiles, Cars & Bikes",

  // Campus Services Categories
  "Services: Laundry & Dry Cleaning",
  "Services: Medicals & Pharmacy",
  "Services: Printing, Binding & Graphic Design",
  "Services: Hair Styling, Barbing & Grooming",
  "Services: Tech, Laptop & Phone Repair",
  "Services: Room Cleaning, Fumigation & Errands",
  "Services: Tailoring & Fashion Alterations",
  "Services: Tutorials & Academic Coaching",
  "Services: Photography & Video Media",
  "Services: Other Campus Services",
];

/* ───────────────────────────── Product Category Options (Vendor Dashboard) ───────────────────────────── */

export interface ProductCategoryOption {
  id: string;
  name: string;
  group?: string;
}

export const PRODUCT_CATEGORY_OPTIONS: ProductCategoryOption[] = [
  // Food & Refreshments
  { id: "food", name: "Food & Meals", group: "Food & Refreshments" },
  { id: "pastries", name: "Pastries & Bakery", group: "Food & Refreshments" },
  { id: "snacks", name: "Snacks & Treats", group: "Food & Refreshments" },
  { id: "drinks", name: "Drinks & Smoothies", group: "Food & Refreshments" },

  // Dorm & Hostel Essentials
  { id: "groceries", name: "Groceries & Hostel Provisions", group: "Dorm Essentials" },
  { id: "care", name: "Beauty & Personal Care", group: "Dorm Essentials" },

  // Style, Fashion & Fragrances
  { id: "wears", name: "Fashion & Campus Wears", group: "Fashion & Style" },
  { id: "jewelries", name: "Jewelries & Accessories", group: "Fashion & Style" },
  { id: "fragrances", name: "Fragrances, Perfumes & Roll-ons", group: "Fashion & Style" },

  // Tech & Study
  { id: "gadgets", name: "Tech, Phones & Gadgets", group: "Tech & Study" },
  { id: "stationery", name: "Stationery, Books & Exam Items", group: "Tech & Study" },

  // Sports & Lifestyle
  { id: "sports", name: "Sports, Gym & Fitness", group: "Lifestyle & Decor" },
  { id: "decorations", name: "Interior Decorations & Aesthetics", group: "Lifestyle & Decor" },
  { id: "automobile", name: "Automobile (Cars, Bikes, Bicycles)", group: "Lifestyle & Decor" },

  // Campus Services
  { id: "services", name: "Campus Services & Errands", group: "Campus Services" },
  { id: "medical", name: "Services: Medicals & Pharmacy", group: "Campus Services" },
  { id: "laundry", name: "Services: Laundry & Dry Cleaning", group: "Campus Services" },
];

/* ───────────────────────────── Admin Categories ───────────────────────────── */

export const ADMIN_PRODUCT_CATEGORY_OPTIONS = [
  ...MAJOR_CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
  { id: "medical", name: "Medicals & Pharmacy" },
  { id: "laundry", name: "Laundry & Dry Cleaning" },
];

export const ADMIN_STORE_CATEGORY_OPTIONS = [...STORE_CATEGORY_OPTIONS];

/* ───────────────────────────── Lookup & Normalization Utilities ───────────────────────────── */

/** Maps any input (slug, alias, name, or store category) to the canonical MajorCategory definition. */
export function getMajorCategoryBySlug(slugOrAlias?: string | null): MajorCategory | undefined {
  if (!slugOrAlias) return undefined;
  const clean = slugOrAlias.trim().toLowerCase();

  // 1. Direct match on id or slug
  const direct = MAJOR_CATEGORIES.find(
    (c) => c.id.toLowerCase() === clean || c.slug.toLowerCase() === clean
  );
  if (direct) return direct;

  // 2. Match on shortName or fullName
  const nameMatch = MAJOR_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.shortName.toLowerCase() === clean
  );
  if (nameMatch) return nameMatch;

  // 3. Match on dbAliases
  const aliasMatch = MAJOR_CATEGORIES.find((c) =>
    c.dbAliases.some((a) => a.toLowerCase() === clean)
  );
  if (aliasMatch) return aliasMatch;

  // 4. Match on storeCategoryNames
  const storeCatMatch = MAJOR_CATEGORIES.find((c) =>
    c.storeCategoryNames.some((s) => s.toLowerCase() === clean)
  );
  if (storeCatMatch) return storeCatMatch;

  // 5. Special keyword contains fallbacks
  if (clean.includes("food") || clean.includes("meal")) return getMajorCategoryBySlug("food");
  if (clean.includes("pastr") || clean.includes("bakery")) return getMajorCategoryBySlug("pastries");
  if (clean.includes("snack") || clean.includes("chop")) return getMajorCategoryBySlug("snacks");
  if (clean.includes("drink") || clean.includes("smoothie") || clean.includes("beverage")) return getMajorCategoryBySlug("drinks");
  if (clean.includes("grocer") || clean.includes("provision")) return getMajorCategoryBySlug("groceries");
  if (clean.includes("wear") || clean.includes("fashion") || clean.includes("cloth")) return getMajorCategoryBySlug("wears");
  if (clean.includes("jewel") || clean.includes("chain") || clean.includes("ring")) return getMajorCategoryBySlug("jewelries");
  if (clean.includes("fragran") || clean.includes("perfum") || clean.includes("scent")) return getMajorCategoryBySlug("fragrances");
  if (clean.includes("beauty") || clean.includes("skin") || clean.includes("care")) return getMajorCategoryBySlug("care");
  if (clean.includes("gadget") || clean.includes("phone") || clean.includes("tech") || clean.includes("electron")) return getMajorCategoryBySlug("gadgets");
  if (clean.includes("station") || clean.includes("book") || clean.includes("exam")) return getMajorCategoryBySlug("stationery");
  if (clean.includes("sport") || clean.includes("fitness") || clean.includes("gym")) return getMajorCategoryBySlug("sports");
  if (clean.includes("decor") || clean.includes("interior") || clean.includes("asthetic") || clean.includes("aesthetic")) return getMajorCategoryBySlug("decorations");
  if (clean.includes("auto") || clean.includes("car") || clean.includes("bike")) return getMajorCategoryBySlug("automobile");
  if (clean.includes("service") || clean.includes("medic") || clean.includes("laundr")) return getMajorCategoryBySlug("services");

  return undefined;
}

/** Returns the canonical slug (e.g. "care", "wears", "food") or the original string trimmed if unknown. */
export function normalizeCategorySlug(slugOrAlias?: string | null): string {
  if (!slugOrAlias) return "";
  const cat = getMajorCategoryBySlug(slugOrAlias);
  return cat ? cat.slug : slugOrAlias.trim().toLowerCase();
}

/** Returns all database alias IDs for a category (e.g. for "care": ["care", "beauty-skincare-personal-care"]). */
export function getCategoryAliases(slugOrAlias?: string | null): string[] {
  if (!slugOrAlias) return [];
  const cat = getMajorCategoryBySlug(slugOrAlias);
  if (!cat) return [slugOrAlias.trim().toLowerCase()];
  return Array.from(new Set([cat.id, cat.slug, ...cat.dbAliases]));
}

/** Maps a vendor store category string to its canonical slug (e.g. "Tech, Gadgets & Accessories" -> "gadgets"). */
export function mapStoreCategoryToSlug(storeCategory?: string | null): string {
  if (!storeCategory) return "food";
  const cat = getMajorCategoryBySlug(storeCategory);
  return cat ? cat.slug : "food";
}

/** Check if a category is a service category. */
export function isServiceCategory(category?: string | null): boolean {
  if (!category) return false;
  const clean = category.trim().toLowerCase();
  return (
    clean.startsWith("services") ||
    clean === "services" ||
    clean === "medical" ||
    clean === "medicals" ||
    clean === "laundry"
  );
}

/** Safe display name for any category slug or ID. */
export function getCategoryDisplayName(slugOrIdOrName?: string | null): string {
  if (!slugOrIdOrName) return "Uncategorized";
  const cat = getMajorCategoryBySlug(slugOrIdOrName);
  return cat ? cat.name : slugOrIdOrName.trim();
}

