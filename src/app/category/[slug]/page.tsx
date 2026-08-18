"use client";

import { useState, use, useMemo, useEffect } from "react";
import { ArrowLeft, Search, ArrowUpDown, Utensils, Cookie, Coffee, ShoppingCart, Cake, BookOpen, HeartPulse, Dumbbell, Shirt, Gem, Smartphone, Watch, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { getLiveCategoryProducts } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";

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
  electronics: {
    name: "Electronics & Appliances",
    Icon: Zap,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    description: "Rechargeable study lamps, electric kettles, room fans, and Bluetooth speakers.",
    subcategories: ["All", "Study Lamps", "Kettles & Cooking", "Speakers & Audio"],
  },
};

const CATEGORY_PRODUCTS: Record<string, Array<{
  id: string;
  name: string;
  price: number;
  vendorId: string;
  vendorName: string;
  image: string;
  description: string;
  subcategory: string;
  isAvailable: boolean;
}>> = {
  food: [
    {
      id: "f1",
      name: "Jollof Rice with Chicken & Plantain",
      price: 3500,
      vendorId: "cmst41xau0002tb705xlithpk",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f3",
      name: "Fried Rice Combo with Grilled Turkey",
      price: 4200,
      vendorId: "cmst41xau0002tb705xlithpk",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      description: "Seasoned vegetable fried rice served with succulent grilled turkey wing, mixed vegetables, and fresh coleslaw.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
  ],
  snacks: [],
  drinks: [],
  groceries: [],
  pastries: [],
  stationery: [],
  care: [],
  sports: [],
  wears: [],
  jewelries: [],
  gadgets: [],
  accessories: [],
  electronics: [],
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
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
  const defaultProducts = CATEGORY_PRODUCTS[slug] || CATEGORY_PRODUCTS.food;
  const [rawProducts, setRawProducts] = useState(defaultProducts);

  useEffect(() => {
    let active = true;
    async function loadCategoryProducts() {
      try {
        const res = await getLiveCategoryProducts(slug);
        if (active && res.success && res.products.length > 0) {
          const formatted = res.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            description: p.description || "",
            isAvailable: p.isAvailable,
            rating: 4.8,
            vendorId: p.storeId,
            vendorName: p.store?.name || "Campus Vendor",
            subcategory: "All",
          }));
          setRawProducts(formatted);
        }
      } catch (err) {
        console.error("Error loading category products:", err);
      }
    }

    loadCategoryProducts();
    return () => {
      active = false;
    };
  }, [slug]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "name">("popular");
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const filteredProducts = useMemo(() => {
    const list = rawProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubcat = selectedSubcategory === "All" || product.subcategory === selectedSubcategory;
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
  }, [rawProducts, searchQuery, selectedSubcategory, sortBy]);

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
          className="object-cover opacity-30"
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 dark:bg-zinc-800/80 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm"
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
              className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all border ${
                selectedSubcategory === subcat
                  ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-[#71717A] dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              {subcat}
            </button>
          ))}
        </motion.div>

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
      </div>

      {/* PRODUCT CUSTOMIZATION MODAL (PORTIONS, EXTRAS, SPECIAL NOTES) */}
      <ProductCustomizerModal
        isOpen={!!customizerProduct}
        product={customizerProduct}
        onClose={() => setCustomizerProduct(null)}
        onVendorConflict={(item, quantity) => setPendingProduct({ item, quantity })}
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
    </div>
  );
}
