"use client";

import { useState, use } from "react";
import { ArrowLeft, Search, ArrowUpDown, Utensils, Cookie, Coffee, ShoppingCart, Cake, BookOpen, HeartPulse } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

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
    heroImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    description: "Lecture exercise books, pens, sticky notes, files, and exam materials.",
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
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f2",
      name: "Spicy Beef Suya Pizza - Medium",
      price: 6500,
      vendorId: "v4",
      vendorName: "Pizza Hub",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
      description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
      subcategory: "Pizza & Suya",
      isAvailable: true,
    },
    {
      id: "f3",
      name: "Fried Rice Special with Turkey",
      price: 4200,
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
      description: "Seasoned fried rice cooked with mixed vegetables and served with seasoned fried turkey.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f4",
      name: "Crispy Chicken Burger & Chips",
      price: 3800,
      vendorId: "v5",
      vendorName: "Campus Bites",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
      subcategory: "Fast Food",
      isAvailable: true,
    },
  ],
  snacks: [
    {
      id: "s1",
      name: "Golden Plantain Chips 150g",
      price: 800,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
      description: "Crispy, naturally sweet fried plantain chips sliced thin.",
      subcategory: "Chips & Popcorn",
      isAvailable: true,
    },
  ],
  drinks: [
    {
      id: "d1",
      name: "Cold Pressed Orange Juice 50cl",
      price: 1200,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
      description: "100% natural, freshly squeezed orange juice with no added sugar.",
      subcategory: "Fresh Juices",
      isAvailable: true,
    },
    {
      id: "d2",
      name: "Tropical Mango Pineapple Smoothie",
      price: 1800,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80",
      description: "Blended fresh mango, pineapple, and Greek yogurt.",
      subcategory: "Smoothies",
      isAvailable: true,
    },
  ],
  groceries: [
    {
      id: "g1",
      name: "Indomie Super Pack (Carton of 40)",
      price: 14500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
      description: "Carton of Indomie Instant Noodles Super Pack 120g.",
      subcategory: "Noodles & Pasta",
      isAvailable: true,
    },
  ],
  pastries: [
    {
      id: "pas1",
      name: "Jumbo Beef Meat Pie",
      price: 1200,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      description: "Flaky golden crust filled with seasoned minced beef, potatoes, and carrots.",
      subcategory: "Pies & Rolls",
      isAvailable: true,
    },
  ],
  stationery: [
    {
      id: "st1",
      name: "A4 Note Book 60 Leaves (Pack of 5)",
      price: 2500,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      description: "High quality 60-leaf ruled exercise notebooks for campus lectures.",
      subcategory: "Note Books",
      isAvailable: true,
    },
  ],
  care: [
    {
      id: "c1",
      name: "Moisturizing Cocoa Butter Lotion 400ml",
      price: 3200,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      description: "Deep nourishing body lotion for all skin types.",
      subcategory: "Skincare",
      isAvailable: true,
    },
  ],
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
  const rawProducts = CATEGORY_PRODUCTS[slug] || CATEGORY_PRODUCTS.food;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const filteredProducts = rawProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcat = selectedSubcategory === "All" || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesSubcat;
  });

  const handleAddProduct = (productId: string) => {
    const product = rawProducts.find((p) => p.id === productId);
    if (!product) return;

    const result = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    });

    if (result.requiresConfirmation) {
      setPendingProduct(product);
    }
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart({
        id: pendingProduct.id,
        name: pendingProduct.name,
        price: pendingProduct.price,
        image: pendingProduct.image,
        vendorId: pendingProduct.vendorId,
        vendorName: pendingProduct.vendorName,
      });
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
          <button className="flex items-center gap-1.5 text-xs font-body font-semibold text-[#18181B] dark:text-zinc-200 bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
            <ArrowUpDown size={14} />
            <span>Sort by: Popular</span>
          </button>
        </div>

        {/* PRODUCTS GRID WITH SCROLL ANIMATION - LINKS DIRECTLY TO /product/[id] */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            onAddProduct={handleAddProduct}
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

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] dark:bg-indigo-600 text-white font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>
    </div>
  );
}
