"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, Clock, Utensils, Cookie, Coffee, ShoppingCart, Cake, BookOpen, HeartPulse, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUserStore } from "@/lib/userStore";
import WelcomePage from "@/app/welcome/page";
import { getLiveHomepageData } from "@/actions/marketplace";

// POPULAR PRODUCTS MOCK DATA WITH UNSPLASH IMAGERY
const POPULAR_PRODUCTS = [
  {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
    isAvailable: true,
    rating: 4.9,
  },
  {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    description: "100% natural, freshly squeezed orange juice with no added sugar.",
    isAvailable: true,
    rating: 4.8,
  },
  {
    id: "p3",
    name: "A4 Note Book 60 Leaves (Pack of 5)",
    price: 2500,
    vendorId: "v3",
    vendorName: "Campus Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description: "High quality 60-leaf ruled exercise notebooks for campus lectures.",
    isAvailable: false,
    rating: 4.7,
  },
  {
    id: "p4",
    name: "Spicy Beef Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
    isAvailable: true,
    rating: 4.9,
  },
];

// CATEGORIES METADATA WITH REALISTIC PICTURE THUMBNAILS
const CATEGORIES = [
  { 
    name: "Food", 
    slug: "food", 
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Snacks", 
    slug: "snacks", 
    image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Drinks", 
    slug: "drinks", 
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Groceries", 
    slug: "groceries", 
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Pastries", 
    slug: "pastries", 
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Stationery", 
    slug: "stationery", 
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Care", 
    slug: "care", 
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Sports", 
    slug: "sports", 
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Wears", 
    slug: "wears", 
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Jewelries", 
    slug: "jewelries", 
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Gadgets", 
    slug: "gadgets", 
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Accessories", 
    slug: "accessories", 
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" 
  },
  { 
    name: "Electronics", 
    slug: "electronics", 
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80" 
  },
];

export default function Home() {
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const { isDark, toggleTheme } = useTheme();
  const { profile, hasSeenOnboarding } = useUserStore();
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<any[]>(POPULAR_PRODUCTS);

  useEffect(() => {
    setIsMounted(true);
    let isCurrent = true;

    async function loadLiveProducts() {
      try {
        const res = await getLiveHomepageData();
        if (isCurrent && res.success && res.products.length > 0) {
          setProducts(res.products);
        }
      } catch (e) {
        console.error("Error loading live homepage products:", e);
      }
    }

    loadLiveProducts();
    return () => {
      isCurrent = false;
    };
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B]" />;
  }

  if (!hasSeenOnboarding) {
    return <WelcomePage />;
  }

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId) || POPULAR_PRODUCTS.find((p) => p.id === productId);
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

  const firstName = profile.name ? profile.name.split(" ")[0] : "Alex";
  const DEFAULT_HUMAN_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";
  const isVisitor = profile.isVisitor || profile.name === "Visitor" || profile.email === "visitor@light.app";
  const userAvatar = profile.avatar && profile.avatar !== "/visitor-avatar.png"
    ? profile.avatar
    : DEFAULT_HUMAN_AVATAR;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-200">
      
      {/* HERO HEADER: Midnight Indigo (#1E1B4B) WITH ANIMATIONS */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="bg-[#1E1B4B] dark:bg-[#121215] text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md border-b dark:border-zinc-800/80"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-2">
                Hey {firstName}!{" "}
                <motion.span
                  className="inline-block origin-[70%_70%]"
                  animate={{ rotate: [0, 16, -8, 16, -4, 10, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: "easeInOut",
                  }}
                  whileInView={{ rotate: [0, 20, -10, 20, -5, 12, 0] }}
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-white text-xs md:text-sm font-normal mt-0.5 font-body">
                What are we ordering today?
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Light/Dark Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-white/10 dark:bg-zinc-800/80 backdrop-blur-md border border-white/20 dark:border-zinc-700/80 flex items-center justify-center text-white dark:text-amber-400 hover:bg-white/20 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-90"
                aria-label="Toggle light or dark theme"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} className="text-amber-400 fill-amber-400/20" /> : <Moon size={18} className="text-amber-300 fill-amber-300/20" />}
              </button>

              <Link href="/profile" className="w-12 h-12 rounded-full border-2 border-[#FBBF24] p-0.5 overflow-hidden shadow-md relative group hover:scale-105 transition-all bg-white shrink-0">
                <Image
                  src={userAvatar}
                  alt={profile.name || "Profile"}
                  fill
                  priority
                  className="object-cover group-hover:scale-110 transition-transform"
                />
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <Link href="/search" className="block relative w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A] dark:text-zinc-400">
              <CustomSearchIcon size={22} />
            </div>
            <div className="w-full h-14 pl-12 pr-4 flex items-center rounded-2xl bg-white dark:bg-zinc-800/90 text-[#71717A] dark:text-zinc-300 font-body font-medium text-sm md:text-base border border-slate-200 dark:border-zinc-700/80 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
              Search meals, snacks, stationery...
            </div>
          </Link>
        </div>
      </motion.section>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full -mt-4 z-20 space-y-8 pb-12">
        
        {/* PROMOTIONAL BENTO GRID WITH SCROLL ANIMATIONS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main Hero Bento Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, margin: "-30px" }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 bg-[#312E81] dark:bg-indigo-950/90 rounded-3xl p-6 text-white flex flex-col justify-between shadow-md min-h-[190px] border border-transparent dark:border-indigo-800/50"
          >
            <div>
              <span className="bg-[#FBBF24] text-[#312E81] px-3 py-1 text-xs font-heading font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                <Flame size={14} className="fill-[#312E81]" /> Hot Deal
              </span>
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight mt-3 text-white">
                20% OFF All Pastries & Bakery 🥐
              </h2>
              <p className="text-[#F4F3FF] dark:text-indigo-200 text-xs md:text-sm font-normal mt-1 font-body">Use code CAMPUS20 at checkout</p>
            </div>
            
            <div className="mt-4">
              <Link href="/category/pastries" className="inline-flex items-center gap-2 bg-white dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-body font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-95 transition-all">
                Order Now <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Side Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#FBBF24] dark:bg-amber-500/90 rounded-3xl p-4 text-[#1E1B4B] dark:text-zinc-950 flex flex-col justify-between shadow-sm"
            >
              <span className="bg-[#1E1B4B] dark:bg-zinc-950 text-white text-[10px] font-body font-bold px-2.5 py-0.5 rounded-full w-fit uppercase">
                New Vendor
              </span>
              <div className="mt-2">
                <h3 className="font-heading font-extrabold text-base leading-tight text-[#1E1B4B] dark:text-zinc-950">Tasty Treats</h3>
                <p className="text-xs text-[#312E81] dark:text-indigo-950 font-body font-semibold">Fresh Smoothies & Shakes</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#71717A] dark:text-zinc-400 text-xs font-body font-medium">
                  <Clock size={14} className="text-[#312E81] dark:text-indigo-400" /> Avg. Time
                </div>
                <p className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100 mt-0.5">15-20 Mins</p>
                <span className="text-[10px] font-body font-bold text-[#16A34A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/60">
                  Fast Campus Riders
                </span>
              </div>
            </motion.div>

          </div>

        </section>

        {/* CATEGORIES SECTION WITH PICTURE THUMBNAILS & SCROLL ANIMATIONS */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-30px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] dark:text-zinc-100">
              Explore Categories
            </h2>
          </div>
          
          <div className="flex gap-3.5 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {CATEGORIES.map((cat, i) => {
              return (
                <Link
                  key={i}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center justify-center min-w-[92px] p-2.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 shrink-0 active:scale-95 hover:border-[#312E81] dark:hover:border-indigo-500 transition-all group"
                >
                  <div className="w-13 h-13 rounded-2xl overflow-hidden relative shadow-sm mb-2 border border-slate-100 dark:border-zinc-700/80 group-hover:scale-108 transition-transform duration-300">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover"
                      sizes="60px"
                    />
                  </div>
                  <span className="text-xs font-heading font-bold text-[#18181B] dark:text-zinc-200">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* POPULAR NEAR YOU SECTION WITH ANIMATIONS - LINKS DIRECTLY TO /product/[id] */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] dark:text-zinc-100">
                Popular Near You
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">Click any item to order</p>
            </div>
            <Link 
              href="/search" 
              className="text-xs md:text-sm font-body font-semibold text-[#312E81] dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>

          <ProductGrid 
            products={products} 
            onAddProduct={handleAddProduct}
          />
        </motion.section>

      </div>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal 
        isOpen={!!pendingProduct} 
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body font-normal">
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
