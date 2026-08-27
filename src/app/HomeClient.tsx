"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Flame, 
  ArrowRight, 
  Clock, 
  Utensils, 
  Cookie, 
  Coffee, 
  ShoppingCart, 
  ShoppingBag,
  Cake, 
  BookOpen, 
  HeartPulse, 
  Stethoscope,
  Waves,
  Dumbbell,
  Shirt,
  Gem,
  Smartphone,
  Headphones,
  Tv,
  Sun, 
  Moon,
  Store, 
  Star, 
  Sparkles, 
  Filter, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Gift,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useUserStore, DEFAULT_VISITOR_CARTOON_AVATAR } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import WelcomePage from "@/app/welcome/page";
import { getLiveHomepageData } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";
import { useSession } from "next-auth/react";

const PROMO_SLIDES = [
  {
    id: "promo-1",
    tag: "🔥 FRESH CAMPUS BAKERY • PastryHomebyLayo",
    title: "Crispy Gourmet Small Chops Platter 🥟",
    subtitle: "Freshly prepared spring rolls, samosas, peppered puff puff & succulent wings delivered hot to your hostel.",
    link: "/category/pastries",
    buttonText: "Order Small Chops",
    bgColor: "bg-[#1E1B4B]",
    badgeBg: "bg-amber-400 text-slate-950 font-black shadow-md border border-amber-300/90",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    highlight: "⭐ 5.0 Top Rated • Campus Kitchen"
  },
  {
    id: "promo-2",
    tag: "⚡ FAST HOSTEL DELIVERY • Campus Express",
    title: "Fresh Campus Meals & Quick Bites 🍱",
    subtitle: "Delicious meals, snacks, groceries, and essentials delivered right to your hostel porter's lodge in 15–25 minutes.",
    link: "/category/food",
    buttonText: "Explore Marketplace",
    bgColor: "bg-[#1E1B4B]",
    badgeBg: "bg-amber-400 text-slate-950 font-black",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    highlight: "⚡ 15-20 Min Fast Delivery"
  }
];

const CATEGORIES = [
  { 
    name: "Food", 
    slug: "food", 
    icon: Utensils,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Hot Meals"
  },
  { 
    name: "Snacks", 
    slug: "snacks", 
    icon: Cookie,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Quick Bites"
  },
  { 
    name: "Groceries", 
    slug: "groceries", 
    icon: ShoppingBag,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Daily Dorm"
  },
  { 
    name: "Pastries", 
    slug: "pastries", 
    icon: Cake,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Fresh Bakery"
  },
  { 
    name: "Medical", 
    slug: "medical", 
    icon: Stethoscope,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Health & Meds"
  },
  { 
    name: "Laundry", 
    slug: "laundry", 
    icon: Waves,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Wash & Fold"
  },
  { 
    name: "Stationery", 
    slug: "stationery", 
    icon: BookOpen,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Study & Exam"
  },
  { 
    name: "Care", 
    slug: "care", 
    icon: HeartPulse,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Personal Care"
  },
  { 
    name: "Sports", 
    slug: "sports", 
    icon: Dumbbell,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Fitness"
  },
  { 
    name: "Wears", 
    slug: "wears", 
    icon: Shirt,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Campus Style"
  },
  { 
    name: "Jewelries", 
    slug: "jewelries", 
    icon: Gem,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Ice & Bling"
  },
  { 
    name: "Gadgets", 
    slug: "gadgets", 
    icon: Smartphone,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Tech Gadgets"
  },
  { 
    name: "Accessories", 
    slug: "accessories", 
    icon: Headphones,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Audio & More"
  },
  { 
    name: "Electronics", 
    slug: "electronics", 
    icon: Tv,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Appliances"
  },
];

interface HomeClientProps {
  initialProducts?: any[];
  initialStores?: any[];
}

export default function HomeClient({ initialProducts = [], initialStores = [] }: HomeClientProps) {
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const { isDark, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const { profile, hasSeenOnboarding } = useUserStore();
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [stores, setStores] = useState<any[]>(initialStores);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "open" | "fast" | "top">("all");
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  // PROMOTIONAL CAROUSEL STATE
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered]);

  useEffect(() => {
    setIsMounted(true);
    let isCurrent = true;

    async function loadLiveProducts() {
      try {
        const res = await getLiveHomepageData();
        if (isCurrent && res.success) {
          if (res.products && res.products.length > 0) {
            setProducts(res.products);
          }
          if (res.stores && res.stores.length > 0) {
            setStores(res.stores);
          }
        }
      } catch (e) {
        console.error("Error loading live homepage products:", e);
      }
    }

    loadLiveProducts();
    if (profile.email && profile.email !== "admin@campuslightson.com") {
      useFavoritesStore.getState().syncWithUserAccount(profile.email);
    }

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
    if (initialStores && initialStores.length > 0) {
      setStores(initialStores);
    }
  }, [initialProducts, initialStores]);

  // Featured Homepage Products: Strictly at most 4 random/top items (if only 1 exists, only 1 shows)
  const featuredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (selectedFilter === "open") {
        return p.vendorIsOpen !== false;
      }
      if (selectedFilter === "fast") {
        const timeStr = p.vendorPrepTime || "";
        return timeStr.includes("10") || timeStr.includes("15") || timeStr.includes("20");
      }
      if (selectedFilter === "top") {
        return (p.rating || 4.8) >= 4.8;
      }
      return true;
    });

    return list.slice(0, 4);
  }, [products, selectedFilter]);

  const handleOpenCustomizer = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCustomizerProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      storeId: product.vendorId || (product as any).storeId || "",
      storeName: product.vendorName || "Campus Merchant",
      isAvailable: product.isAvailable !== false,
    });
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart(pendingProduct.item, pendingProduct.quantity || 1);
      setPendingProduct(null);
    }
  };

  const DEFAULT_HUMAN_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80";

  // Seamless Identity Resolution: check active session or store email first to prevent any visitor flash
  const isAuthenticated = status === "authenticated" || (Boolean(profile.email) && !profile.isVisitor && profile.email !== "visitor@light.app");

  const rawName = session?.user?.name || (profile.name && profile.name !== "Visitor" && profile.name !== "Platform Super Admin" 
    ? profile.name 
    : (isAuthenticated ? (session?.user?.email?.split("@")[0] || profile.email?.split("@")[0] || "Student") : "Explorer"));

  const firstName = rawName.split(" ")[0];

  const userAvatar = session?.user?.image || (profile.avatar && profile.avatar !== "/visitor-avatar.png" 
    ? profile.avatar 
    : (isAuthenticated ? DEFAULT_HUMAN_AVATAR : DEFAULT_VISITOR_CARTOON_AVATAR));

  if (!isMounted) {
    return <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B]" />;
  }

  if (!hasSeenOnboarding && status !== "authenticated") {
    return <WelcomePage />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-200">
      
      {/* HERO HEADER: Midnight Indigo (#1E1B4B) WITH BRAND BANNER */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] dark:bg-zinc-950 text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-lg overflow-hidden border-b border-indigo-950 dark:border-zinc-800"
      >
        {/* BACKGROUND BANNER IMAGE */}
        <Image
          src="/support-banner.jpg"
          alt="Homepage Hero Banner"
          fill
          priority
          className="object-cover object-center"
        />

        {/* SOLID HIGH CONTRAST OVERLAY */}
        <div className="absolute inset-0 bg-[#1E1B4B]/90 dark:bg-[#09090B]/95" />

        <div className="relative z-10 max-w-5xl mx-auto">
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
                className="w-10 h-10 rounded-full bg-white/10 dark:bg-zinc-800/80 backdrop-blur-md border border-white/20 dark:border-zinc-700/80 flex items-center justify-center text-white dark:text-amber-400 hover:bg-white/20 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-90 cursor-pointer"
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
                  unoptimized
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
        
        {/* PROMOTIONAL HERO CAROUSEL */}
        <section 
          className="w-full relative overflow-hidden rounded-[28px] shadow-lg border border-slate-200/80 dark:border-zinc-800/90 flex flex-col justify-between min-h-[250px] md:min-h-[280px] group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* CAROUSEL SLIDES */}
          <AnimatePresence mode="wait">
            {PROMO_SLIDES.map((slide, idx) => {
              if (idx !== currentSlide) return null;
              return (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`absolute inset-0 ${slide.bgColor} p-6 md:p-8 text-white flex flex-col justify-between z-10`}
                >
                  {/* BACKGROUND AMBIENT IMAGE */}
                  <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-cover object-center scale-110 blur-xs"
                    />
                    <div className="absolute inset-0 bg-[#1E1B4B]/80" />
                  </div>

                  {/* TOP BADGE */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className={`${slide.badgeBg} px-3.5 py-1 text-[11px] font-heading font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm`}>
                      {slide.tag}
                    </span>
                  </div>

                  {/* MAIN HEADINGS & COPY */}
                  <div className="relative z-10 my-3 max-w-xl">
                    <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white leading-tight tracking-tight drop-shadow-xs">
                      {slide.title}
                    </h2>
                    <p className="text-slate-200 dark:text-zinc-300 text-xs sm:text-sm font-normal mt-1.5 leading-relaxed line-clamp-2">
                      {slide.subtitle}
                    </p>
                  </div>

                  {/* BOTTOM ACTIONS & PROGRESS CONTROLS */}
                  <div className="relative z-10 flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={slide.link}
                        className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all group/btn"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>

                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-200 font-semibold bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        {slide.highlight}
                      </span>
                    </div>

                    {/* Progress Indicator Dots */}
                    <div className="flex items-center gap-2">
                      {PROMO_SLIDES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            currentSlide === i 
                              ? "w-8 bg-[#FBBF24]" 
                              : "w-2 bg-white/40 hover:bg-white/70"
                          }`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {/* BROWSE BY CATEGORY */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] dark:text-zinc-100">
                Explore Categories
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body">Browse essentials across campus</p>
            </div>
            <Link
              href="/search"
              className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              All Categories <ArrowRight size={13} />
            </Link>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {CATEGORIES.map((cat, i) => {
              const IconComponent = cat.icon;
              return (
                <Link
                  key={i}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center justify-center min-w-[88px] py-3.5 px-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 shrink-0 active:scale-95 hover:border-[#312E81] dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-115">
                    <IconComponent size={28} className={`${cat.iconColor} transition-colors drop-shadow-xs`} />
                  </div>
                  <span className="text-xs font-heading font-extrabold text-[#18181B] dark:text-zinc-200 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors text-center">
                    {cat.name}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap text-center">
                    {cat.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* POPULAR NEAR YOU SECTION (MAX 4 FEATURED ITEMS) */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] dark:text-zinc-100">
                Featured Near You
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">Top trending campus picks • Click any item to view details</p>
            </div>

            {/* QUICK STOREFRONT FILTER CHIPS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === "all"
                    ? "bg-[#312E81] text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                }`}
              >
                All Items
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter("open")}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === "open"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-emerald-400"
                }`}
              >
                🟢 Open Now
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter("fast")}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === "fast"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-amber-400"
                }`}
              >
                ⚡ Fast (&lt;20m)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter("top")}
                className={`px-3 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  selectedFilter === "top"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400"
                }`}
              >
                ⭐ Top (4.8+)
              </button>
            </div>
          </div>

          <ProductGrid 
            products={featuredProducts} 
            onAddProduct={handleOpenCustomizer}
            isLoading={isLoading}
            emptyMessage="No available products found right now."
          />

          {products.length > 4 && (
            <div className="flex justify-center pt-3">
              <Link
                href="/search"
                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[#312E81] dark:text-indigo-300 hover:text-white hover:bg-[#312E81] dark:hover:bg-indigo-600 font-heading font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 group"
              >
                <span>Explore All Marketplace Products ({products.length} Items)</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </motion.section>

      </div>

      {/* PRODUCT CUSTOMIZATION MODAL */}
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
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body font-normal">
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
