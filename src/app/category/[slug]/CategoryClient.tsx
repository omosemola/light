"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  ArrowUpDown, 
  Utensils, 
  Cookie, 
  Coffee, 
  ShoppingCart, 
  Cake, 
  BookOpen, 
  HeartPulse, 
  Stethoscope, 
  Waves, 
  Dumbbell, 
  Shirt, 
  Gem, 
  Smartphone, 
  Watch, 
  Zap,
  Briefcase,
  MessageSquare,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";
import { parseProductImages } from "@/lib/productOptions";
import { MerchantChatModal, MerchantChatVendor } from "@/components/ui/MerchantChatModal";
import { getServicePersonnel } from "@/actions/marketplace";

// CATEGORY METADATA WITH VECTOR ICONS & UNSPLASH HERO IMAGES
const CATEGORY_DATA: Record<string, { name: string; Icon: any; bg: string; heroImage: string; description: string; subcategories: string[] }> = {
  food: {
    name: "Food & Meals",
    Icon: Utensils,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Delicious freshly prepared meals from top campus kitchens and restaurants.",
    subcategories: ["All", "Rice & Meals", "Fast Food", "Pizza & Suya", "Pastries"],
  },
  snacks: {
    name: "Snacks & Treats",
    Icon: Cookie,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=1200&q=80",
    description: "Quick bites, popcorn, chips, nuts, and sweet treats for lectures and study sessions.",
    subcategories: ["All", "Chips & Popcorn", "Chocolates", "Biscuits", "Traditional Snacks"],
  },
  drinks: {
    name: "Drinks & Beverages",
    Icon: Coffee,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    description: "Chilled juices, sodas, energy drinks, water, and smoothies.",
    subcategories: ["All", "Fresh Juices", "Soft Drinks", "Energy Drinks", "Smoothies", "Water"],
  },
  groceries: {
    name: "Groceries & Provisions",
    Icon: ShoppingCart,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    description: "Dorm essentials, noodles, canned goods, milk, sugar, and daily cooking items.",
    subcategories: ["All", "Noodles & Pasta", "Dairy & Breakfast", "Canned Goods", "Toiletries"],
  },
  pastries: {
    name: "Pastries & Bakery",
    Icon: Cake,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    description: "Freshly baked meat pies, cakes, donuts, and bread.",
    subcategories: ["All", "Pies & Rolls", "Cakes & Donuts", "Fresh Bread"],
  },
  stationery: {
    name: "Stationery & Books",
    Icon: BookOpen,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1200&q=80",
    description: "Lecture exercise books, pens, sticky notes, scientific calculators, and exam materials.",
    subcategories: ["All", "Note Books", "Pens & Pencils", "Files & Accessories"],
  },
  care: {
    name: "Personal Care",
    Icon: HeartPulse,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    description: "Skincare, soaps, hair care, and personal hygiene essentials.",
    subcategories: ["All", "Skincare", "Soaps & Wash", "Hair Care"],
  },
  sports: {
    name: "Sports & Fitness",
    Icon: Dumbbell,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    description: "Football boots, gym resistance bands, sports jerseys, and athletic gear.",
    subcategories: ["All", "Football & Boots", "Gym Gear", "Jerseys"],
  },
  wears: {
    name: "Fashion & Wears",
    Icon: Shirt,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
    description: "Trendy hoodies, oversized tees, sneakers, and casual campus wear.",
    subcategories: ["All", "Hoodies & Jackets", "T-Shirts", "Sneakers"],
  },
  jewelries: {
    name: "Jewelries & Ice",
    Icon: Gem,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    description: "Cuban chains, iced rings, bracelets, and stylish pendants.",
    subcategories: ["All", "Chains & Necklaces", "Rings", "Bracelets"],
  },
  gadgets: {
    name: "Tech & Gadgets",
    Icon: Smartphone,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    description: "Power banks, wireless earbuds, charging cables, and phone stands.",
    subcategories: ["All", "Power Banks", "Earbuds", "Cables"],
  },
  accessories: {
    name: "Fashion Accessories",
    Icon: Watch,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    description: "Smartwatches, sunglasses, tote bags, caps, and leather belts.",
    subcategories: ["All", "Watches", "Sunglasses", "Bags & Caps"],
  },
  services: {
    name: "Services",
    Icon: Briefcase,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    description: "Reliable campus services — Medicals & pharmacy, laundry & dry cleaning, tech repair, printing & design, and student personal assistance.",
    subcategories: [
      "All",
      "Medicals & Pharmacy",
      "Laundry & Dry Cleaning",
      "Printing, Binding & Design",
      "Tech, Laptop & Phone Repair",
      "Hair Styling, Barbing & Grooming",
      "Room Cleaning, Fumigation & Errands",
      "Tailoring & Alterations",
      "Tutorials & Academic Coaching",
      "Photography & Video Media",
      "Other Campus Services",
    ],
  },
  medicals: {
    name: "Medical & Health",
    Icon: Stethoscope,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
    description: "First aid kits, OTC pain relief, vitamins, bandages, and campus pharmacy essentials.",
    subcategories: ["All", "First Aid", "Pain Relief", "Vitamins & Supplements", "Personal Hygiene"],
  },
  medical: {
    name: "Medical & Health",
    Icon: Stethoscope,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
    description: "First aid kits, OTC pain relief, vitamins, bandages, and campus pharmacy essentials.",
    subcategories: ["All", "First Aid", "Pain Relief", "Vitamins & Supplements", "Personal Hygiene"],
  },
  laundry: {
    name: "Laundry & Dry Cleaning",
    Icon: Waves,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80",
    description: "Hostel wash & fold, dry cleaning, ironing, beddings, and laundry detergents.",
    subcategories: ["All", "Wash & Fold", "Ironing & Press", "Dry Cleaning", "Beddings & Duvets"],
  },
  electronics: {
    name: "Electronics & Appliances",
    Icon: Zap,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    description: "Rechargeable study lamps, electric kettles, room fans, and Bluetooth speakers.",
    subcategories: ["All", "Study Lamps", "Kettles & Cooking", "Speakers & Audio"],
  },
};

export interface ServicePersonnelStore {
  id: string;
  name: string;
  description: string;
  logo: string;
  rating: number;
  phone: string | null;
  isOpen: boolean;
  estimatedDelivery: string;
  categoryType: string;
  availabilityStatus?: string;
  startingPrice?: number | null;
  openingTime?: string;
  closingTime?: string;
  serviceOfferings?: string[];
}

interface CategoryClientProps {
  initialProducts: any[];
  initialServiceStores?: ServicePersonnelStore[];
  slug: string;
}

function formatProducts(list: any[]) {
  return list.map((p: any) => {
    const parsed = parseProductImages(p.image);
    return {
      id: p.id,
      slug: p.slug || p.id,
      name: p.name,
      price: p.price,
      image: parsed[0] || p.image,
      rawImage: p.image,
      description: p.description || "",
      isAvailable: p.isAvailable !== false,
      rating: 4.8,
      vendorId: p.storeId || p.vendorId || p.store?.id || "",
      vendorName: p.store?.name || p.vendorName || "Campus Vendor",
      categoryName: p.category?.name || p.category || "",
      subcategory: "All",
    };
  });
}

export default function CategoryClient({ initialProducts = [], initialServiceStores = [], slug }: CategoryClientProps) {
  const router = useRouter();

  const category = CATEGORY_DATA[slug] || {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    Icon: Utensils,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Explore all products in this category on campus.",
    subcategories: ["All"],
  };

  const CategoryIcon = category.Icon;
  const [rawProducts, setRawProducts] = useState(() => formatProducts(initialProducts));
  const [servicePersonnel, setServicePersonnel] = useState<ServicePersonnelStore[]>(initialServiceStores || []);

  const [selectedChatVendor, setSelectedChatVendor] = useState<MerchantChatVendor | null>(null);
  const [chatProductContext, setChatProductContext] = useState<string>("");
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setRawProducts(formatProducts(initialProducts));
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialServiceStores && initialServiceStores.length > 0) {
      setServicePersonnel(initialServiceStores);
    } else if (slug === "services") {
      getServicePersonnel().then((res) => {
        if (res.success && res.stores && res.stores.length > 0) {
          setServicePersonnel(res.stores);
        }
      }).catch(() => {});
    }
  }, [initialServiceStores, slug]);

  const handleOpenChat = (vendor: { id: string; name: string; logo?: string; avatar?: string; phone?: string | null; categoryType?: string; category?: string }, contextText?: string) => {
    setSelectedChatVendor({
      id: vendor.id,
      name: vendor.name,
      avatar: vendor.logo || vendor.avatar || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
      phone: vendor.phone || undefined,
      category: vendor.categoryType || vendor.category || "Services",
    });
    setChatProductContext(contextText || "");
    setIsChatModalOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "name">("popular");
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  const { confirmAndReplaceCart } = useCartStore();

  const filteredProducts = useMemo(() => {
    const list = rawProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesSubcat = selectedSubcategory === "All";
      if (!matchesSubcat) {
        if (slug === "services") {
          const t = `${product.name} ${product.description || ""} ${product.categoryName || ""}`.toLowerCase();
          if (selectedSubcategory === "Medicals & Health") {
            matchesSubcat = t.includes("medic") || t.includes("health") || t.includes("pharm") || t.includes("first aid") || t.includes("vitamin") || t.includes("drug");
          } else if (selectedSubcategory === "Laundry & Dry Cleaning") {
            matchesSubcat = t.includes("laundr") || t.includes("wash") || t.includes("dry clean") || t.includes("iron") || t.includes("duvet") || t.includes("fold") || t.includes("detergent");
          } else if (selectedSubcategory === "Errands & Tasks") {
            matchesSubcat = !t.includes("medic") && !t.includes("laundr") && !t.includes("wash");
          }
        } else {
          matchesSubcat = product.subcategory === selectedSubcategory;
        }
      }

      return matchesSearch && matchesSubcat;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [rawProducts, searchQuery, selectedSubcategory, sortBy, slug]);

  const filteredServicePersonnel = useMemo(() => {
    if (slug !== "services") return [];
    return servicePersonnel.filter((person) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          person.name.toLowerCase().includes(q) ||
          person.description.toLowerCase().includes(q) ||
          person.categoryType.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedSubcategory === "All") return true;

      const subLower = selectedSubcategory.toLowerCase();
      const pCat = (person.categoryType || "").toLowerCase();
      const pName = (person.name || "").toLowerCase();
      const pDesc = (person.description || "").toLowerCase();
      const combined = `${pCat} ${pName} ${pDesc}`;

      if (subLower.includes("laundry")) {
        return combined.includes("laundr") || combined.includes("wash") || combined.includes("iron") || combined.includes("dry clean") || combined.includes("duvet");
      }
      if (subLower.includes("medic") || subLower.includes("pharm")) {
        return combined.includes("medic") || combined.includes("pharm") || combined.includes("health") || combined.includes("first aid") || combined.includes("drug");
      }
      if (subLower.includes("print") || subLower.includes("bind") || subLower.includes("design")) {
        return combined.includes("print") || combined.includes("bind") || combined.includes("graphic") || combined.includes("design") || combined.includes("copy");
      }
      if (subLower.includes("tech") || subLower.includes("laptop") || subLower.includes("phone") || subLower.includes("repair")) {
        return combined.includes("tech") || combined.includes("phone") || combined.includes("laptop") || combined.includes("repair") || combined.includes("gadget");
      }
      if (subLower.includes("hair") || subLower.includes("barb") || subLower.includes("grooming") || subLower.includes("beauty")) {
        return combined.includes("hair") || combined.includes("barb") || combined.includes("braid") || combined.includes("wig") || combined.includes("beauty");
      }
      if (subLower.includes("cleaning") || subLower.includes("errand") || subLower.includes("fumigation")) {
        return combined.includes("clean") || combined.includes("errand") || combined.includes("fumigat");
      }
      if (subLower.includes("tailor") || subLower.includes("alteration")) {
        return combined.includes("tailor") || combined.includes("alter") || combined.includes("sew") || combined.includes("cloth");
      }
      if (subLower.includes("tutor") || subLower.includes("academic")) {
        return combined.includes("tutor") || combined.includes("coach") || combined.includes("acad") || combined.includes("lesson");
      }
      if (subLower.includes("photo") || subLower.includes("media") || subLower.includes("video")) {
        return combined.includes("photo") || combined.includes("video") || combined.includes("camera") || combined.includes("media");
      }

      return pCat.includes(subLower) || combined.includes(subLower);
    });
  }, [servicePersonnel, selectedSubcategory, searchQuery, slug]);

  const handleOpenCustomizer = (productId: string) => {
    const product = rawProducts.find((p) => p.id === productId);
    if (!product) return;

    setCustomizerProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      storeId: product.vendorId,
      storeName: product.vendorName,
      isAvailable: product.isAvailable !== false,
    });
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart(pendingProduct.item, pendingProduct.quantity || 1);
      setPendingProduct(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      {/* CATEGORY HEADER BANNER WITH SCROLL ANIMATION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] dark:bg-[#121215] text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md overflow-hidden border-b dark:border-zinc-800/80"
      >
        <Image
          src={category.heroImage}
          alt={category.name}
          fill
          priority
          className="object-cover opacity-30 pointer-events-none"
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 dark:bg-zinc-800/80 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm cursor-pointer shadow-xs"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24] text-[#312E81] flex items-center justify-center shadow-md">
                <CategoryIcon size={22} strokeWidth={2.4} />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-sm">
                {category.name}
              </h1>
            </div>
          </div>
          <p className="text-slate-200 dark:text-zinc-300 text-xs md:text-sm font-normal max-w-xl">
            {category.description}
          </p>

          {/* Search bar inside header */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/95 dark:bg-zinc-800/95 text-slate-800 dark:text-zinc-100 text-sm font-medium border border-white/40 dark:border-zinc-700/60 shadow-md focus:outline-none focus:ring-2 focus:ring-[#312E81] dark:focus:ring-indigo-500 backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-6">
        
        {/* SERVICES CATEGORY SUB-HUB: MEDICALS & LAUNDRY QUICK ACCESS CARDS */}
        {slug === "services" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div 
              onClick={() => setSelectedSubcategory(selectedSubcategory === "Medicals & Pharmacy" ? "All" : "Medicals & Pharmacy")}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                selectedSubcategory === "Medicals & Pharmacy"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-emerald-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    Medicals & Pharmacy
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    First aid, OTC relief, vitamins & health essentials
                  </p>
                </div>
              </div>
              <span className="text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {selectedSubcategory === "Medicals & Pharmacy" ? "Filtered ✓" : "Explore →"}
              </span>
            </div>

            <div 
              onClick={() => setSelectedSubcategory(selectedSubcategory === "Laundry & Dry Cleaning" ? "All" : "Laundry & Dry Cleaning")}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                selectedSubcategory === "Laundry & Dry Cleaning"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-indigo-400 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Waves size={24} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    Laundry & Dry Cleaning
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    Wash & fold, ironing, duvets & hostel wash
                  </p>
                </div>
              </div>
              <span className="text-xs font-heading font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {selectedSubcategory === "Laundry & Dry Cleaning" ? "Filtered ✓" : "Explore →"}
              </span>
            </div>
          </div>
        )}

        {/* SUBCATEGORY PILLS */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {category.subcategories.map((subcat) => (
            <button
              key={subcat}
              onClick={() => setSelectedSubcategory(subcat)}
              className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                selectedSubcategory === subcat
                  ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-[#71717A] dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              {subcat}
            </button>
          ))}
        </motion.div>

        {/* SERVICES CATEGORY DIRECT PERSONNEL DIRECTORY & CHAT HUB */}
        {slug === "services" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-5 md:p-6 rounded-[28px] overflow-hidden text-white shadow-xl space-y-4 border border-indigo-900/50 group"
          >
            {/* BACKGROUND BANNER IMAGE (HOME BANNER PICTURE) */}
            <Image
              src="/support-banner.jpg"
              alt="Services Personnel Banner"
              fill
              priority
              className="object-cover object-center scale-105"
            />

            {/* SOLID HIGH CONTRAST OVERLAY (MATCHING HOMEPAGE HERO) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B]/95 via-[#1E1B4B]/90 to-[#312E81]/85 dark:from-[#09090B]/95 dark:to-[#121215]/95" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-extrabold text-base md:text-lg">
                        Campus Service Personnel Directory
                      </h2>
                      <span className="text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 uppercase tracking-wider shadow-xs">
                        Verified Services
                      </span>
                    </div>
                    <p className="text-xs text-indigo-100 font-medium">
                      Consult directly with verified campus specialists for live bookings, inquiries & instant support
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-emerald-300 border border-emerald-400/30 self-start sm:self-auto shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{filteredServicePersonnel.length} Available</span>
                </div>
              </div>

              {/* PERSONNEL TILES GRID */}
              {filteredServicePersonnel.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {filteredServicePersonnel.map((person) => {
                    const isLaundry = person.name.toLowerCase().includes("laundry") || (person.categoryType && person.categoryType.toLowerCase().includes("laundry"));
                    const isMed = person.name.toLowerCase().includes("pharm") || person.name.toLowerCase().includes("health") || (person.categoryType && person.categoryType.toLowerCase().includes("pharm"));
                    const isBusy = person.availabilityStatus === "BUSY";
                    const isOffline = person.availabilityStatus === "AWAY" || !person.isOpen;

                    return (
                      <div
                        key={person.id}
                        className="p-4 rounded-2xl bg-[#1E1B4B]/75 hover:bg-[#1E1B4B]/90 dark:bg-zinc-900/80 dark:hover:bg-zinc-900/95 backdrop-blur-md border border-white/20 transition-all flex flex-col justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white/20 shrink-0 border border-white/30">
                            <Image
                              src={person.logo || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                              alt={person.name}
                              fill
                              className="object-cover"
                            />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-indigo-900 ${
                              isBusy ? "bg-amber-400" : isOffline ? "bg-zinc-400" : "bg-emerald-400"
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-heading font-extrabold text-sm text-white truncate">
                                {person.name}
                              </h3>
                              <ShieldCheck size={14} className="text-amber-300 shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-indigo-200">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLaundry
                                  ? "bg-indigo-400/30 text-indigo-100"
                                  : isMed
                                  ? "bg-emerald-400/30 text-emerald-100"
                                  : "bg-amber-400/30 text-amber-100"
                              }`}>
                                {person.categoryType}
                              </span>

                              {/* REAL-TIME AVAILABILITY BADGE */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                isBusy
                                  ? "bg-amber-400 text-amber-950"
                                  : isOffline
                                  ? "bg-zinc-600 text-zinc-100"
                                  : "bg-emerald-400 text-emerald-950"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isBusy ? "bg-amber-950" : isOffline ? "bg-zinc-300" : "bg-emerald-950 animate-pulse"
                                }`} />
                                <span>{isBusy ? "Busy" : isOffline ? "Offline" : "Available Now"}</span>
                              </span>

                              {person.startingPrice && person.startingPrice > 0 ? (
                                <span className="font-heading font-black text-amber-300 text-[10px]">
                                  From ₦{person.startingPrice.toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-indigo-100 line-clamp-2 mt-1.5 font-normal opacity-90 leading-relaxed">
                              {person.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                            <Star size={12} className="fill-amber-300 text-amber-300" />
                            <span>{person.rating ? person.rating.toFixed(1) : "5.0"}</span>
                            <span className="text-indigo-200 font-normal ml-1">
                              • {person.estimatedDelivery || "Campus Coverage"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {person.phone && (
                              <a
                                href={`tel:${person.phone}`}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Call Provider"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenChat(person)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <MessageSquare size={13} />
                              <span>Chat Now</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <Briefcase size={36} className="text-amber-300 mx-auto mb-2 opacity-80" />
                  <h4 className="font-heading font-extrabold text-sm text-white">
                    No specialists listed under &ldquo;{selectedSubcategory}&rdquo; yet
                  </h4>
                  <p className="text-xs text-indigo-100 max-w-md mx-auto mt-1 mb-4 font-normal leading-relaxed">
                    Do you render this campus service? Publish your availability profile on Lightson to receive student inquiries and direct chat bookings.
                  </p>
                  <Link
                    href="/vendor/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <span>Register Service Profile</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* RETAIL PRODUCTS SECTION (FOR ALL OTHER CATEGORIES) */}
        {slug !== "services" && (
          <>

            {/* PRODUCTS COUNT & SORT BAR */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs md:text-sm font-body font-semibold text-[#71717A] dark:text-zinc-400">
                Showing <span className="text-[#18181B] dark:text-zinc-100 font-extrabold">{filteredProducts.length}</span> items
              </p>
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 shadow-xs">
                <ArrowUpDown size={13} className="text-[#71717A] dark:text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-body font-bold text-[#18181B] dark:text-zinc-200 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="popular">Sort: Popular 🔥</option>
                  <option value="price-asc">Price: Low to High ₦</option>
                  <option value="price-desc">Price: High to Low ₦</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* PRODUCTS GRID WITH SCROLL ANIMATION */}
            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={filteredProducts}
                onAddProduct={handleOpenCustomizer}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8"
              >
                <CategoryIcon size={40} className="mx-auto mb-3 text-[#312E81] dark:text-indigo-400" />
                <h3 className="font-heading font-bold text-lg text-[#18181B] dark:text-zinc-100">No items found</h3>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-body">Try switching subcategories or adjusting your search query.</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* PRODUCT CUSTOMIZATION MODAL (PORTIONS, EXTRAS, SPECIAL NOTES) */}
      <ProductCustomizerModal
        isOpen={!!customizerProduct}
        product={customizerProduct}
        onClose={() => setCustomizerProduct(null)}
        onVendorConflict={(item, quantity) => setPendingProduct({ item, quantity })}
        onChatWithVendor={slug === "services" ? (prod) => handleOpenChat({ id: prod.storeId, name: prod.storeName }, prod.name) : undefined}
      />

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from <strong>{pendingProduct?.item?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] dark:bg-indigo-600 text-white font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm cursor-pointer"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold rounded-full active:scale-[0.98] transition-transform text-sm cursor-pointer"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>

      {/* FLOATING ACTION PILL FOR SERVICES CHAT */}
      {slug === "services" && servicePersonnel.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-20 md:bottom-8 right-5 z-40"
        >
          <button
            onClick={() => handleOpenChat(servicePersonnel[0])}
            className="px-4 py-3 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] text-white shadow-2xl flex items-center gap-2.5 font-heading font-extrabold text-xs transition-all active:scale-95 border border-indigo-400/30 cursor-pointer"
          >
            <div className="relative">
              <MessageSquare size={17} className="text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#312E81] rounded-full" />
            </div>
            <span>Chat with Service Provider</span>
          </button>
        </motion.div>
      )}

      {/* EXCLUSIVE SERVICE PERSONNEL CHAT MODAL */}
      {selectedChatVendor && (
        <MerchantChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedChatVendor(null);
            setChatProductContext("");
          }}
          vendor={selectedChatVendor}
          initialProductContext={chatProductContext}
        />
      )}
    </div>
  );
}
