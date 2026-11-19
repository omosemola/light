import type { ComponentType } from "react";
import {
  Utensils,
  Wheat,
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
    id: "foodstuffs",
    slug: "foodstuffs",
    name: "Foodstuffs",
    shortName: "Foodstuffs",
    badge: "Raw & Fresh",
    icon: Wheat,
    iconName: "Wheat",
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    description: "Raw cooking ingredients, crayfish, prawns, grains, pepper, oils & kitchen supplies on Lightson.",
    heroImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    dbAliases: ["foodstuffs", "foodstuff", "Foodstuffs", "Foodstuff", "Raw Foodstuffs", "Cooking Ingredients"],
    storeCategoryNames: ["Foodstuffs & Raw Cooking Ingredients", "Foodstuffs"],
    searchStems: ["foodstuff", "crayfish", "prawn", "oil", "pepper", "onion", "garri", "yam", "grain", "seasoning", "maggi", "seafood"],
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
    searchStems: ["grocer", "provision", "noodle", "indomie", "milk", "cereal", "milo", "sugar", "biscuit", "dorm essential", "canned"],
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
    dbAliases: ["wears", "fashion-wears-campus-merch", "fashion", "Wears", "Fashion & Wears", "Fashion, Wears & Campus Merch"],
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
  "Foodstuffs & Raw Cooking Ingredients",
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
  { id: "food", name: "Food & Meals (Prepared Meals)", group: "Food & Refreshments" },
  { id: "foodstuffs", name: "Foodstuffs (Crayfish, Grains, Oils, Ingredients)", group: "Food & Refreshments" },
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
  if (clean.includes("foodstuff") || clean.includes("crayfish") || clean.includes("prawn")) return getMajorCategoryBySlug("foodstuffs");
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

/* ───────────────────────────── Smart Subcategory Classification ───────────────────────────── */

/**
 * Checks if a product is a raw foodstuff (e.g. crayfish, prawns, raw meat, spices, raw oils, grains, tubers)
 * rather than a readily prepared meal.
 */
export function isFoodstuffProduct(
  name?: string | null,
  description?: string | null,
  categoryName?: string | null
): boolean {
  const catLower = (categoryName || "").toLowerCase().trim();
  if (catLower === "foodstuffs" || catLower === "foodstuff" || catLower.includes("foodstuff")) {
    return true;
  }

  if (!name && !description) return false;
  const t = `${name || ""} ${description || ""}`.toLowerCase();

  // Words that indicate readily prepared cooked dishes should not match as raw foodstuffs
  // unless explicitly specified as raw ingredients
  const hasReadyMealWords = (
    t.includes("jollof") ||
    t.includes("fried rice") ||
    t.includes("white rice & stew") ||
    t.includes("white rice and stew") ||
    t.includes("asun rice") ||
    t.includes("concoction rice") ||
    t.includes("shawarma") ||
    t.includes("burger") ||
    t.includes("pizza") ||
    t.includes("spaghetti") ||
    t.includes("pasta") ||
    t.includes("macaroni") ||
    t.includes("plate of") ||
    t.includes("cooked") ||
    t.includes("served with") ||
    t.includes("ready to eat") ||
    t.includes("chicken and chips") ||
    t.includes("turkey and chips") ||
    t.includes("chicken sauce")
  );

  // If it's a prepared meal dish, it's not a raw foodstuff
  if (hasReadyMealWords && !t.includes("crayfish") && !t.includes("prawn") && !t.includes("raw ") && !t.includes("seafood")) {
    return false;
  }

  // Keywords that identify raw foodstuffs, ingredients, seafood, and staples
  return (
    t.includes("crayfish") ||
    t.includes("cray fish") ||
    t.includes("prawn") ||
    t.includes("prawns") ||
    t.includes("shrimp") ||
    t.includes("seafood") ||
    t.includes("raw fish") ||
    t.includes("catfish") ||
    t.includes("stockfish") ||
    t.includes("stock fish") ||
    t.includes("dry fish") ||
    t.includes("dried fish") ||
    t.includes("smoked fish") ||
    (name || "").trim().toLowerCase() === "fish" ||
    t.includes("periwinkle") ||
    t.includes("snail") ||
    t.includes("snails") ||
    t.includes("raw meat") ||
    t.includes("goat meat") ||
    t.includes("beef") ||
    t.includes("cow leg") ||
    t.includes("shaki") ||
    t.includes("tripe") ||
    t.includes("raw chicken") ||
    t.includes("frozen chicken") ||
    t.includes("frozen turkey") ||
    t.includes("gizzard") ||
    t.includes("foodstuff") ||
    t.includes("food stuff") ||
    t.includes("raw ingredient") ||
    t.includes("cooking ingredient") ||
    t.includes("yam") ||
    t.includes("tuber") ||
    t.includes("garri") ||
    t.includes("cassava") ||
    t.includes("raw potato") ||
    t.includes("irish potato") ||
    t.includes("sweet potato") ||
    t.includes("bag of rice") ||
    t.includes("rice bag") ||
    t.includes("raw rice") ||
    t.includes("derica") ||
    t.includes("raw beans") ||
    t.includes("beans bag") ||
    t.includes("bag of beans") ||
    t.includes("semovita") ||
    t.includes("semo bag") ||
    t.includes("flour") ||
    t.includes("wheat flour") ||
    t.includes("poundo flour") ||
    t.includes("cassava flour") ||
    t.includes("palm oil") ||
    t.includes("red oil") ||
    t.includes("groundnut oil") ||
    t.includes("vegetable oil") ||
    t.includes("kings oil") ||
    t.includes("power oil") ||
    t.includes("maggi") ||
    t.includes("knorr") ||
    t.includes("seasoning") ||
    t.includes("curry powder") ||
    t.includes("thyme") ||
    t.includes("locust bean") ||
    t.includes("iru") ||
    t.includes("ogbono") ||
    t.includes("egusi melon") ||
    t.includes("melon seed") ||
    t.includes("raw egusi") ||
    t.includes("raw pepper") ||
    t.includes("habanero") ||
    t.includes("atarodo") ||
    t.includes("tatashe") ||
    t.includes("shombo") ||
    t.includes("fresh tomato") ||
    t.includes("basket of tomato") ||
    t.includes("raw onion") ||
    t.includes("bag of onion") ||
    t.includes("ugwu") ||
    t.includes("scent leaf")
  );
}

/**
 * Smartly evaluates whether a product belongs to a given subcategory within a category.
 */
export function matchProductToSubcategory(
  product: {
    name?: string | null;
    description?: string | null;
    categoryName?: string | null;
    vendorName?: string | null;
    subcategory?: string | null;
  },
  categorySlug: string,
  selectedSubcat: string
): boolean {
  if (!selectedSubcat || selectedSubcat === "All" || selectedSubcat === "All Products") {
    if (categorySlug === "food") {
      return !isFoodstuffProduct(product.name, product.description, product.categoryName);
    }
    return true;
  }

  if (selectedSubcat === "All Meals") {
    return !isFoodstuffProduct(product.name, product.description, product.categoryName);
  }

  if (selectedSubcat === "All Foodstuffs") {
    return true;
  }

  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.categoryName || "").toLowerCase();
  const vendor = (product.vendorName || "").toLowerCase();
  const t = `${name} ${desc} ${cat} ${vendor}`;

  // 1. FOOD CATEGORY SUBCATEGORIES (Prepared Meals Only)
  if (categorySlug === "food") {
    if (isFoodstuffProduct(product.name, product.description, product.categoryName)) {
      return false;
    }

    if (selectedSubcat === "Rice & Pasta") {
      return (
        t.includes("rice") ||
        t.includes("jollof") ||
        t.includes("spaghetti") ||
        t.includes("pasta") ||
        t.includes("macaroni") ||
        t.includes("noodle") ||
        t.includes("stir fry") ||
        t.includes("concoction")
      );
    }

    if (selectedSubcat === "Swallow & Soups") {
      return (
        t.includes("soup") ||
        t.includes("amala") ||
        t.includes("semo") ||
        t.includes("pounded yam") ||
        t.includes("poundo") ||
        t.includes("eba") ||
        t.includes("fufu") ||
        t.includes("egusi") ||
        t.includes("ewedu") ||
        t.includes("gbegiri") ||
        t.includes("okra") ||
        t.includes("ogbono") ||
        t.includes("vegetable soup") ||
        t.includes("banga") ||
        t.includes("porridge") ||
        t.includes("asaro")
      );
    }

    if (selectedSubcat === "Fast Food & Shawarma") {
      return (
        t.includes("shawarma") ||
        t.includes("burger") ||
        t.includes("pizza") ||
        t.includes("sandwich") ||
        t.includes("fries") ||
        t.includes("chips") ||
        t.includes("hot dog") ||
        t.includes("hotdog") ||
        t.includes("wrap") ||
        t.includes("suya") ||
        t.includes("wing")
      );
    }

    if (selectedSubcat === "Pastries & Grills" || selectedSubcat === "Meat, Grills & Sauces") {
      return (
        t.includes("chicken") ||
        t.includes("turkey") ||
        t.includes("asun") ||
        t.includes("sauce") ||
        t.includes("grilled") ||
        t.includes("barbecue") ||
        t.includes("bbq") ||
        t.includes("peppered") ||
        t.includes("meat") ||
        t.includes("pie") ||
        t.includes("combo")
      );
    }

    return true;
  }

  // 2. FOODSTUFFS CATEGORY SUBCATEGORIES
  if (categorySlug === "foodstuffs") {
    if (selectedSubcat === "Crayfish & Seafood" || selectedSubcat === "Crayfish, Prawns & Seafood") {
      return (
        t.includes("crayfish") ||
        t.includes("cray fish") ||
        t.includes("prawn") ||
        t.includes("shrimp") ||
        t.includes("fish") ||
        t.includes("catfish") ||
        t.includes("stockfish") ||
        t.includes("dry fish") ||
        t.includes("dried fish") ||
        t.includes("smoked fish") ||
        t.includes("periwinkle") ||
        t.includes("seafood")
      );
    }

    if (selectedSubcat === "Tubers & Grains") {
      return (
        t.includes("yam") ||
        t.includes("garri") ||
        t.includes("cassava") ||
        t.includes("potato") ||
        t.includes("rice") ||
        t.includes("bean") ||
        t.includes("grain") ||
        t.includes("corn") ||
        t.includes("maize") ||
        t.includes("millet") ||
        t.includes("semo") ||
        t.includes("flour") ||
        t.includes("wheat") ||
        t.includes("plantain")
      );
    }

    if (selectedSubcat === "Oils & Seasonings") {
      return (
        t.includes("oil") ||
        t.includes("palm oil") ||
        t.includes("groundnut oil") ||
        t.includes("vegetable oil") ||
        t.includes("maggi") ||
        t.includes("knorr") ||
        t.includes("seasoning") ||
        t.includes("curry") ||
        t.includes("thyme") ||
        t.includes("spice") ||
        t.includes("salt") ||
        t.includes("ginger") ||
        t.includes("garlic") ||
        t.includes("locust") ||
        t.includes("iru") ||
        t.includes("ogbono") ||
        t.includes("egusi")
      );
    }

    if (selectedSubcat === "Peppers & Veggies") {
      return (
        t.includes("pepper") ||
        t.includes("rodo") ||
        t.includes("atarodo") ||
        t.includes("tatashe") ||
        t.includes("shombo") ||
        t.includes("tomato") ||
        t.includes("onion") ||
        t.includes("ugwu") ||
        t.includes("spinach") ||
        t.includes("vegetable") ||
        t.includes("leaf") ||
        t.includes("cabbage") ||
        t.includes("carrot")
      );
    }

    if (selectedSubcat === "Raw Meat & Poultry") {
      return (
        t.includes("meat") ||
        t.includes("beef") ||
        t.includes("goat") ||
        t.includes("cow") ||
        t.includes("shaki") ||
        t.includes("tripe") ||
        t.includes("chicken") ||
        t.includes("turkey") ||
        t.includes("gizzard") ||
        t.includes("snail")
      );
    }

    return true;
  }

  // 3. PASTRIES & BAKERY
  if (categorySlug === "pastries") {
    if (selectedSubcat === "Meat Pies & Rolls" || selectedSubcat === "Small Chops, Pies & Rolls") {
      return (
        t.includes("pie") ||
        t.includes("meatpie") ||
        t.includes("roll") ||
        t.includes("sausage") ||
        t.includes("egg roll") ||
        t.includes("spring roll") ||
        t.includes("springroll") ||
        t.includes("samosa") ||
        t.includes("small chop") ||
        t.includes("chops")
      );
    }
    if (selectedSubcat === "Cakes & Pastries") {
      return (
        t.includes("cake") ||
        t.includes("cupcake") ||
        t.includes("pastry") ||
        t.includes("muffin") ||
        t.includes("brownie") ||
        t.includes("croissant") ||
        t.includes("tart") ||
        t.includes("foil cake")
      );
    }
    if (selectedSubcat === "Bread & Buns") {
      return t.includes("bread") || t.includes("loaf") || t.includes("bun") || t.includes("toast") || t.includes("agege") || t.includes("banana bread");
    }
    if (selectedSubcat === "Donuts & Waffles") {
      return t.includes("donut") || t.includes("doughnut") || t.includes("waffle") || t.includes("pancake") || t.includes("puff") || t.includes("chin chin");
    }
    return true;
  }

  // 4. SNACKS & TREATS
  if (categorySlug === "snacks") {
    if (selectedSubcat === "Chips & Popcorn") {
      return t.includes("chip") || t.includes("popcorn") || t.includes("popcoen") || t.includes("plantain") || t.includes("potato chip") || t.includes("pringles") || t.includes("crisp");
    }
    if (selectedSubcat === "Parfaits & Sweet Treats" || selectedSubcat === "Chocolates & Candy") {
      return t.includes("parfait") || t.includes("chocolate") || t.includes("candy") || t.includes("sweet") || t.includes("toffee") || t.includes("gum") || t.includes("gummy") || t.includes("snickers") || t.includes("fruity") || t.includes("cream");
    }
    if (selectedSubcat === "Biscuits & Cookies") {
      return t.includes("biscuit") || t.includes("cookie") || t.includes("cracker") || t.includes("wafer") || t.includes("shortbread") || t.includes("oreo");
    }
    if (selectedSubcat === "Nuts & Local Snacks") {
      return t.includes("nut") || t.includes("peanut") || t.includes("cashew") || t.includes("groundnut") || t.includes("chin chin") || t.includes("kulikuli") || t.includes("kokoro");
    }
    return true;
  }

  // 5. DRINKS & SMOOTHIES
  if (categorySlug === "drinks") {
    if (selectedSubcat === "Fresh Juices & Smoothies") {
      return t.includes("juice") || t.includes("smoothie") || t.includes("zobo") || t.includes("tiger nut") || t.includes("tigernut") || t.includes("shake") || t.includes("fresh fruit") || t.includes("parfait");
    }
    if (selectedSubcat === "Soft Drinks & Sodas") {
      return t.includes("coke") || t.includes("fanta") || t.includes("sprite") || t.includes("pepsi") || t.includes("soda") || t.includes("mirinda") || t.includes("7up") || t.includes("carbonated");
    }
    if (selectedSubcat === "Energy & Malt Drinks") {
      return t.includes("energy") || t.includes("monster") || t.includes("red bull") || t.includes("fearless") || t.includes("predator") || t.includes("malt") || t.includes("malta") || t.includes("maltina");
    }
    if (selectedSubcat === "Water & Yogurt") {
      return t.includes("water") || t.includes("eva") || t.includes("nestle") || t.includes("yogurt") || t.includes("yoghurt") || t.includes("hollandia") || t.includes("habib");
    }
    return true;
  }

  // 6. GROCERIES & PROVISIONS
  if (categorySlug === "groceries") {
    if (selectedSubcat === "Noodles & Instant Food") {
      return t.includes("noodle") || t.includes("indomie") || t.includes("minimee") || t.includes("chikki") || t.includes("spaghetti") || t.includes("pasta");
    }
    if (selectedSubcat === "Milk, Cereal & Breakfast") {
      return t.includes("milk") || t.includes("peak") || t.includes("dano") || t.includes("cereal") || t.includes("oat") || t.includes("cornflakes") || t.includes("milo") || t.includes("bournvita") || t.includes("coffee") || t.includes("sugar") || t.includes("tea") || t.includes("custard");
    }
    if (selectedSubcat === "Canned & Packaged") {
      return t.includes("can") || t.includes("sardine") || t.includes("geisha") || t.includes("corned beef") || t.includes("tuna") || t.includes("baked bean") || t.includes("tomato paste") || t.includes("sachet") || t.includes("mayonnaise");
    }
    if (selectedSubcat === "Dorm Hygiene & Soaps") {
      return t.includes("soap") || t.includes("detergent") || t.includes("bleach") || t.includes("hypo") || t.includes("dishwash") || t.includes("sponge") || t.includes("tissue") || t.includes("ariel") || t.includes("omo") || t.includes("viva");
    }
    return true;
  }

  // 7. FASHION & WEARS
  if (categorySlug === "wears" || categorySlug === "fashion") {
    if (selectedSubcat === "T-Shirts, Polos & Tops" || selectedSubcat === "T-Shirts & Tops") {
      return (
        name.includes("shirt") ||
        name.includes("t-shirt") ||
        name.includes("tee") ||
        name.includes("polo") ||
        name.includes("top") ||
        name.includes("roundneck") ||
        name.includes("round neck") ||
        name.includes("jersey") ||
        name.includes("crop") ||
        name.includes("singlet") ||
        name.includes("blouse")
      );
    }
    if (selectedSubcat === "Jeans, Shorts & Joggers" || selectedSubcat === "Pants, Jeans & Shorts") {
      return (
        name.includes("pant") ||
        name.includes("jean") ||
        name.includes("denim") ||
        name.includes("jogger") ||
        name.includes("trouser") ||
        name.includes("cargo") ||
        name.includes("short") ||
        name.includes("jort") ||
        name.includes("skirt")
      );
    }
    if (selectedSubcat === "Gowns & Two-Piece Sets" || selectedSubcat === "Hoodies & Sweatshirts") {
      return (
        name.includes("gown") ||
        name.includes("dress") ||
        name.includes("two piece") ||
        name.includes("2 pics") ||
        name.includes("2 piece") ||
        name.includes("up and down") ||
        name.includes("hoodie") ||
        name.includes("sweatshirt") ||
        name.includes("sweater") ||
        name.includes("jacket") ||
        name.includes("cardigan")
      );
    }
    if (selectedSubcat === "Nightwear & Loungewear") {
      return (
        t.includes("night wear") ||
        t.includes("nightwear") ||
        t.includes("lounge") ||
        t.includes("lingerie") ||
        t.includes("pajama") ||
        t.includes("pyjama")
      );
    }
    if (selectedSubcat === "Footwear, Bags & Caps" || selectedSubcat === "Footwear & Caps") {
      return (
        name.includes("shoe") ||
        name.includes("sneaker") ||
        name.includes("loafer") ||
        name.includes("skecher") ||
        name.includes("slip-in") ||
        name.includes("slide") ||
        name.includes("crocs") ||
        name.includes("sandal") ||
        name.includes("boot") ||
        name.includes("cap") ||
        name.includes("beanie") ||
        name.includes("hat") ||
        name.includes("bag") ||
        name.includes("clutch") ||
        name.includes("towel") ||
        name.includes("sock")
      );
    }
    return true;
  }

  // 8. JEWELRIES & ACCESSORIES
  if (categorySlug === "jewelries" || categorySlug === "accessories") {
    const isWatch =
      t.includes("watch") ||
      t.includes("wristwatch") ||
      t.includes("rolex") ||
      t.includes("g-shock") ||
      t.includes("g schock") ||
      t.includes("poedagar") ||
      t.includes("poedegar") ||
      t.includes("matturi") ||
      t.includes("tissot") ||
      t.includes("hislon") ||
      t.includes("curren") ||
      t.includes("frank muller") ||
      t.includes("richard mille") ||
      t.includes("valenzo") ||
      t.includes("rebirth") ||
      t.includes("chronograph") ||
      t.includes("rubber strap") ||
      t.includes("leather strap") ||
      vendor.includes("annoitedwatches");

    if (selectedSubcat === "Wristwatches" || selectedSubcat === "Watches & Sunglasses") {
      return isWatch || t.includes("sunglass") || t.includes("shade") || t.includes("eyewear");
    }
    if (selectedSubcat === "Chains & Necklaces") {
      return !isWatch && (t.includes("chain") || t.includes("necklace") || t.includes("cuban") || t.includes("rope") || t.includes("choker") || t.includes("pendant"));
    }
    if (selectedSubcat === "Bracelets & Bangles") {
      return !isWatch && (t.includes("bracelet") || t.includes("bangle") || t.includes("wristband") || t.includes("wrist stack") || t.includes("cuff"));
    }
    if (selectedSubcat === "Rings, Earrings & Sets" || selectedSubcat === "Rings & Bands" || selectedSubcat === "Earrings & Pendants") {
      return !isWatch && (t.includes("ring") || t.includes("band") || t.includes("earring") || t.includes("stud") || t.includes("piercing") || t.includes("hoop") || t.includes("set") || t.includes("vca"));
    }
    return true;
  }

  // 9. FRAGRANCES & SCENTS
  if (categorySlug === "fragrances") {
    const isOil = name.includes("oil") || desc.includes("oil perfume") || desc.includes("undiluted") || t.includes("attar");
    const isRollOn = t.includes("roll on") || t.includes("roll-on") || t.includes("roller") || t.includes("antiperspirant");
    const isSprayOrMist =
      name.includes("spray") ||
      name.includes("mist") ||
      name.includes("victoria") ||
      desc.includes("body spray") ||
      desc.includes("body mist") ||
      t.includes("deodorant");

    if (selectedSubcat === "Oil Perfumes" || selectedSubcat === "Oil Perfumes & Roll-Ons") {
      return isOil || isRollOn;
    }
    if (selectedSubcat === "Roll-Ons") {
      return isRollOn;
    }
    if (selectedSubcat === "Body Sprays & Mists" || selectedSubcat === "Body Sprays & Deodorants") {
      return isSprayOrMist;
    }
    if (selectedSubcat === "Perfumes" || selectedSubcat === "Luxury Perfumes" || selectedSubcat === "Perfumes & EDPs") {
      // Every fragrance that isn't solely a body mist/spray, oil perfume, or roll-on is a Perfume / EDP
      return !isOil && !isRollOn && !isSprayOrMist;
    }
    return true;
  }

  // 10. BEAUTY & PERSONAL CARE
  if (categorySlug === "care") {
    if (selectedSubcat === "Face Care, Serums & Sunscreens" || selectedSubcat === "Lip & Face Care") {
      return (
        t.includes("face") ||
        t.includes("facial") ||
        t.includes("sunscreen") ||
        t.includes("serum") ||
        t.includes("toner") ||
        t.includes("cleanser") ||
        t.includes("acne") ||
        t.includes("mask") ||
        t.includes("lip") ||
        t.includes("gloss") ||
        t.includes("balm") ||
        t.includes("althea") ||
        t.includes("zaron") ||
        t.includes("rosé") ||
        t.includes("ruby")
      );
    }
    if (selectedSubcat === "Body Lotions, Oils & Creams" || selectedSubcat === "Skincare & Lotions") {
      return (
        t.includes("lotion") ||
        t.includes("body oil") ||
        t.includes("glow oil") ||
        t.includes("corrector oil") ||
        t.includes("veet oil") ||
        t.includes("tea tree") ||
        t.includes("aleo gel") ||
        t.includes("aloe") ||
        t.includes("silk cream") ||
        t.includes("hot cream") ||
        t.includes("moisturizer") ||
        t.includes("butter") ||
        t.includes("after shave") ||
        t.includes("bumps")
      );
    }
    if (selectedSubcat === "Soaps, Scrubs & Body Wash" || selectedSubcat === "Soaps & Body Wash") {
      return (
        t.includes("soap") ||
        t.includes("scrub") ||
        t.includes("wash") ||
        t.includes("shower gel") ||
        t.includes("femfresh") ||
        t.includes("bath")
      );
    }
    if (selectedSubcat === "Wellness, Nails & Care Kits" || selectedSubcat === "Hair Care & Oils") {
      return (
        t.includes("nail") ||
        t.includes("press on") ||
        t.includes("period") ||
        t.includes("menstrual") ||
        t.includes("boric") ||
        t.includes("yoni") ||
        t.includes("detox") ||
        t.includes("flusher") ||
        t.includes("syrup") ||
        t.includes("multivitamin") ||
        t.includes("weight") ||
        t.includes("pill") ||
        t.includes("gift set") ||
        t.includes("hair") ||
        t.includes("shampoo") ||
        t.includes("wig")
      );
    }
    return true;
  }

  // 11. TECH & GADGETS
  if (categorySlug === "gadgets" || categorySlug === "electronics") {
    if (selectedSubcat === "Phones & Tablets") {
      return (
        t.includes("phone") ||
        t.includes("iphone") ||
        t.includes("esim") ||
        t.includes("17 pro") ||
        t.includes("15 pro") ||
        t.includes("samsung") ||
        t.includes("redmi") ||
        t.includes("tecno") ||
        t.includes("infinix") ||
        t.includes("ipad") ||
        t.includes("tablet")
      );
    }
    if (selectedSubcat === "Audio & Earbuds" || selectedSubcat === "Audio & Headsets") {
      return t.includes("earbud") || t.includes("airpod") || t.includes("headphone") || t.includes("headset") || t.includes("earpiece") || t.includes("speaker") || t.includes("bluetooth") || t.includes("p9");
    }
    if (selectedSubcat === "Chargers, Clippers & Gadgets" || selectedSubcat === "Chargers & Power Banks" || selectedSubcat === "Cables & Accessories") {
      return (
        t.includes("charger") ||
        t.includes("powerbank") ||
        t.includes("power bank") ||
        t.includes("clipper") ||
        t.includes("fan") ||
        t.includes("adapter") ||
        t.includes("fast") ||
        t.includes("magsafe") ||
        t.includes("cable") ||
        t.includes("usb") ||
        t.includes("type-c") ||
        t.includes("lightning") ||
        t.includes("screen guard") ||
        t.includes("case") ||
        t.includes("pouch") ||
        t.includes("stand")
      );
    }
    return true;
  }

  // 12. STATIONERY & BOOKS
  if (categorySlug === "stationery") {
    if (selectedSubcat === "Note Books & Jotters") {
      return t.includes("book") || t.includes("notebook") || t.includes("jotter") || t.includes("notepad") || t.includes("diary") || t.includes("hardcover") || t.includes("colouring");
    }
    if (selectedSubcat === "Pens & Writing") {
      return t.includes("pen") || t.includes("pencil") || t.includes("biro") || t.includes("marker") || t.includes("highlighter") || t.includes("eraser");
    }
    if (selectedSubcat === "Calculators & Math") {
      return t.includes("calculator") || t.includes("casio") || t.includes("scientific") || t.includes("math set") || t.includes("ruler");
    }
    if (selectedSubcat === "Files & Exam Essentials") {
      return t.includes("file") || t.includes("folder") || t.includes("stapler") || t.includes("paper") || t.includes("a4") || t.includes("clip") || t.includes("exam board");
    }
    return true;
  }

  // 13. SPORTS & FITNESS
  if (categorySlug === "sports") {
    if (selectedSubcat === "Jerseys & Kits") {
      return t.includes("jersey") || t.includes("kit") || t.includes("club") || t.includes("shorts");
    }
    if (selectedSubcat === "Footwear & Boots") {
      return t.includes("boot") || t.includes("football boot") || t.includes("cleat") || t.includes("sneaker");
    }
    if (selectedSubcat === "Gym & Workout Gear") {
      return t.includes("gym") || t.includes("band") || t.includes("resistance") || t.includes("dumbbell") || t.includes("glove") || t.includes("skipping");
    }
    if (selectedSubcat === "Balls & Equipment") {
      return t.includes("ball") || t.includes("football") || t.includes("basketball") || t.includes("pump") || t.includes("shin guard");
    }
    return true;
  }

  // 14. INTERIOR DECORATIONS & AESTHETICS
  if (categorySlug === "decorations" || categorySlug === "interior-decorations") {
    if (selectedSubcat === "Wall Art & Frames" || selectedSubcat === "Wall Art, Stickers & Decor") {
      return t.includes("art") || t.includes("frame") || t.includes("poster") || t.includes("canvas") || t.includes("wallpaper") || t.includes("sticker") || t.includes("decor") || t.includes("horse");
    }
    if (selectedSubcat === "Room Lights & LEDs" || selectedSubcat === "Room Lights & Humidifiers") {
      return t.includes("light") || t.includes("led") || t.includes("lamp") || t.includes("strip") || t.includes("neon") || t.includes("humidifier") || t.includes("fan");
    }
    if (selectedSubcat === "Mirrors & Clocks") {
      return t.includes("mirror") || t.includes("clock") || t.includes("arlam") || t.includes("alarm");
    }
    if (selectedSubcat === "Desk, Dorm & Room Essentials" || selectedSubcat === "Desk & Shelving" || selectedSubcat === "Cushions & Rugs" || selectedSubcat === "Aesthetic Plants & Vases") {
      return (
        t.includes("desk") ||
        t.includes("shelf") ||
        t.includes("organizer") ||
        t.includes("brush") ||
        t.includes("polish") ||
        t.includes("glove") ||
        t.includes("bottle") ||
        t.includes("cushion") ||
        t.includes("pillow") ||
        t.includes("rug") ||
        t.includes("mat") ||
        t.includes("plant") ||
        t.includes("vase") ||
        t.includes("flower")
      );
    }
    return true;
  }

  // 15. AUTOMOBILE & RIDES
  if (categorySlug === "automobile") {
    if (selectedSubcat === "Cars") return t.includes("car") || t.includes("sedan") || t.includes("toyota") || t.includes("honda") || t.includes("benz");
    if (selectedSubcat === "Bikes & Motorcycles") return t.includes("bike") || t.includes("motor") || t.includes("scooter");
    if (selectedSubcat === "Bicycles") return t.includes("bicycl") || t.includes("cycle");
    if (selectedSubcat === "Auto Accessories") return t.includes("part") || t.includes("accessor") || t.includes("tire") || t.includes("tyre") || t.includes("helmet");
    return true;
  }

  return true;
}

