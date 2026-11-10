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
  Filter, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Gift,
  ShieldCheck,
  Briefcase,
  Shuffle,
  Car,
  SprayCan,
  Palette,
  Package,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { CustomSearchIcon } from "@/components/icons/CustomSearchIcon";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getUserProfileDb } from "@/actions/account";
import { useUserStore, DEFAULT_VISITOR_CARTOON_AVATAR } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { getLiveHomepageData } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";
import { getSafeImageUrl, isUnoptimizedImage } from "@/lib/productOptions";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import { useAuthMachine } from "@/lib/machines/authMachine";

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
    highlight: "⭐ 5.0 Top Rated • Verified Merchant"
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
    name: "Services", 
    slug: "services", 
    icon: Briefcase,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Meds & Laundry"
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
    name: "Automobile", 
    slug: "automobile", 
    icon: Car,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Cars & Bikes"
  },
  { 
    name: "Fragrances", 
    slug: "fragrances", 
    icon: SprayCan,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Perfumes & Oils"
  },
  { 
    name: "Decorations", 
    slug: "decorations", 
    icon: Palette,
    iconColor: "text-[#312E81] dark:text-indigo-400 group-hover:text-[#1E1B4B] dark:group-hover:text-indigo-300",
    badge: "Room & Asthetics"
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
  const { isAuthenticated, isReady, profile, session, updateProfile } = useAuthMachine();
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [stores, setStores] = useState<any[]>(initialStores);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "open" | "fast" | "top">("all");
  const [selectedVendorTab, setSelectedVendorTab] = useState<"all" | "open" | "food" | "fashion" | "services">("all");
  const [visibleVendorCount, setVisibleVendorCount] = useState<number>(9);

  // Reset pagination when user switches vendor category tabs
  useEffect(() => {
    setVisibleVendorCount(9);
  }, [selectedVendorTab]);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  // SWIPE SCROLL HOOKS FOR BIG SCREENS
  const categoriesSwipe = useSwipeScroll<HTMLDivElement>();
  const vendorsSwipe = useSwipeScroll<HTMLDivElement>();
  const filtersSwipe = useSwipeScroll<HTMLDivElement>();

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
    setRandomSeed(Math.random());
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

    // Fetch on client if server didn't supply initial products or stores
    if (!initialProducts || initialProducts.length === 0 || !initialStores || initialStores.length === 0) {
      loadLiveProducts();
    }

    return () => {
      isCurrent = false;
    };
  }, [initialProducts]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
    if (initialStores && initialStores.length > 0) {
      setStores(initialStores);
    }
  }, [initialProducts, initialStores]);

  // Featured Homepage Products: Randomize on every refresh from available platform products (max 4)
  const featuredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (p.isAvailable === false) {
        return false;
      }
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

    // Before mounting (SSR & initial client hydration), keep deterministic slice to prevent hydration mismatch
    if (!isMounted || randomSeed === 0) {
      return list.slice(0, 4);
    }

    // After mount (client-side): randomize products on every page refresh / visit
    if (list.length <= 4) {
      const shuffledAll = [...list];
      for (let i = shuffledAll.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAll[i], shuffledAll[j]] = [shuffledAll[j], shuffledAll[i]];
      }
      return shuffledAll;
    }

    // When more than 4 items exist, pick 4 distinct random products
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Prioritize variety by avoiding duplicate product names when alternatives exist
    const selected: any[] = [];
    const seenNames = new Set<string>();

    for (const item of shuffled) {
      const cleanName = (item.name || "").trim().toLowerCase();
      if (!seenNames.has(cleanName)) {
        selected.push(item);
        seenNames.add(cleanName);
        if (selected.length === 4) return selected;
      }
    }

    // Fill remaining slots if unique names were fewer than 4
    for (const item of shuffled) {
      if (!selected.some((s) => s.id === item.id)) {
        selected.push(item);
        if (selected.length === 4) break;
      }
    }

    return selected;
  }, [products, selectedFilter, isMounted, randomSeed]);

  // Filtered Vendor Profiles for Homepage Glassmorphism Showcase
  const filteredStores = useMemo(() => {
    if (!stores || stores.length === 0) return [];

    return stores.filter((st) => {
      const open = st.isCurrentlyOpen !== undefined ? st.isCurrentlyOpen : st.isOpen;
      const cat = (st.category || "").toLowerCase();
      const desc = (st.description || "").toLowerCase();
      const name = (st.name || "").toLowerCase();

      if (selectedVendorTab === "open") {
        return Boolean(open);
      }
      if (selectedVendorTab === "food") {
        return (
          cat.includes("food") ||
          cat.includes("snack") ||
          cat.includes("cafeteria") ||
          cat.includes("pastr") ||
          desc.includes("food") ||
          desc.includes("meal") ||
          desc.includes("cake") ||
          desc.includes("chop") ||
          name.includes("kitchen") ||
          name.includes("food") ||
          name.includes("pastr")
        );
      }
      if (selectedVendorTab === "fashion") {
        return (
          cat.includes("fashion") ||
          cat.includes("wear") ||
          cat.includes("jewel") ||
          cat.includes("fragrance") ||
          desc.includes("cloth") ||
          desc.includes("wear") ||
          desc.includes("perfume") ||
          desc.includes("wig") ||
          desc.includes("skin") ||
          desc.includes("bag") ||
          name.includes("fashion") ||
          name.includes("collection")
        );
      }
      if (selectedVendorTab === "services") {
        return (
          Boolean(st.isService) ||
          cat.includes("service") ||
          desc.includes("laundry") ||
          desc.includes("barbing") ||
          desc.includes("clean") ||
          desc.includes("groom")
        );
      }
      return true;
    });
  }, [stores, selectedVendorTab]);

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

  useEffect(() => {
    if (profile.email && !profile.isVisitor && profile.email !== "visitor@light.app") {
      getUserProfileDb(profile.email).then((res) => {
        if (res.success && res.user) {
          if (res.user.image && res.user.image !== profile.avatar) {
            updateProfile({ avatar: res.user.image });
          }
          if (res.user.name && res.user.name !== profile.name) {
            updateProfile({ name: res.user.name });
          }
        }
      }).catch(() => {});
    }
  }, [profile.email, profile.isVisitor, profile.avatar, profile.name, updateProfile]);

  const rawName = (profile.name && profile.name !== "Platform Super Admin")
    ? profile.name
    : (session?.user?.name || (session?.user?.email?.split("@")[0] || profile.email?.split("@")[0] || "Student"));

  const firstName = rawName.split(" ")[0];

  const userAvatar = (profile.avatar && profile.avatar !== "/visitor-avatar.png")
    ? profile.avatar
    : (session?.user?.image || DEFAULT_HUMAN_AVATAR);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-200">
      
      {/* HERO HEADER: Midnight Indigo (#1E1B4B) WITH BRAND BANNER */}
      <motion.section 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
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
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white flex items-center gap-2" suppressHydrationWarning>
                Hey {isMounted ? firstName : "Explorer"}!{" "}
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

              <Link href="/profile" prefetch={true} className="w-12 h-12 rounded-full border-2 border-[#FBBF24] p-0.5 overflow-hidden shadow-md relative group hover:scale-105 transition-all bg-white shrink-0">
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
          <Link href="/search" prefetch={true} className="block relative w-full group">
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
                        prefetch={true}
                        className="inline-flex items-center gap-2 bg-[#FBBF24] hover:bg-amber-400 text-slate-950 font-heading font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all group/btn cursor-pointer"
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
          initial={false}
          animate={{ opacity: 1, y: 0 }}
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
              prefetch={true}
              className="text-xs font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              All Categories <ArrowRight size={13} />
            </Link>
          </div>
          
          <div className="relative group/cats">
            {/* Desktop Navigation Chevrons */}
            {categoriesSwipe.canScrollLeft && (
              <button
                type="button"
                onClick={categoriesSwipe.scrollLeft}
                aria-label="Scroll categories left"
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 text-[#312E81] dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {categoriesSwipe.canScrollRight && (
              <button
                type="button"
                onClick={categoriesSwipe.scrollRight}
                aria-label="Scroll categories right"
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 text-[#312E81] dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            )}

            <div 
              ref={categoriesSwipe.containerRef}
              {...categoriesSwipe.handlers}
              className={`flex gap-2.5 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 select-none ${
                categoriesSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
              }`}
            >
              {CATEGORIES.map((cat, i) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={i}
                    href={`/category/${cat.slug}`}
                    prefetch={true}
                    draggable={false}
                    className="flex flex-col items-center justify-center min-w-[88px] py-3.5 px-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 shrink-0 active:scale-95 hover:border-[#312E81] dark:hover:border-indigo-500 hover:shadow-md transition-all group cursor-pointer select-none"
                  >
                    <div className="w-10 h-10 flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-115 pointer-events-none">
                      <IconComponent size={28} className={`${cat.iconColor} transition-colors drop-shadow-xs`} />
                    </div>
                    <span className="text-xs font-heading font-extrabold text-[#18181B] dark:text-zinc-200 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors text-center pointer-events-none">
                      {cat.name}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap text-center pointer-events-none">
                      {cat.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* POPULAR NEAR YOU SECTION (MAX 4 FEATURED ITEMS) */}
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
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
            <div 
              ref={filtersSwipe.containerRef}
              {...filtersSwipe.handlers}
              className={`flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none ${
                filtersSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
              }`}
            >
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

              <button
                type="button"
                onClick={() => setRandomSeed(Math.random())}
                title="Shuffle featured products"
                className="px-3 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-[#312E81] dark:text-indigo-400 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-zinc-800 active:scale-95 shadow-xs"
                aria-label="Shuffle featured products"
              >
                <Shuffle size={12} className="shrink-0" />
                <span>Shuffle</span>
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

        {/* CAMPUS VENDOR PROFILES (GLASSMORPHISM UI WITH TABS) */}
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-8 backdrop-blur-2xl bg-white/70 dark:bg-zinc-900/60 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6"
        >
          {/* AMBIENT FROSTED GLOW ORBS */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* HEADER & FILTER TABS */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-extrabold bg-[#312E81]/10 dark:bg-indigo-500/15 text-[#312E81] dark:text-indigo-300 border border-[#312E81]/20 dark:border-indigo-500/30 mb-2">
                <Store size={13} className="text-[#312E81] dark:text-indigo-400" />
                <span>Verified Campus Vendors</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] dark:text-zinc-100 tracking-tight">
                Campus Vendor Profiles
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal mt-0.5">
                Connect directly with student merchants, campus kitchens & trusted service providers
              </p>
            </div>

            {/* CATEGORY FILTER TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
              <button
                type="button"
                onClick={() => setSelectedVendorTab("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  selectedVendorTab === "all"
                    ? "bg-[#312E81] text-white shadow-indigo-500/25"
                    : "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-400"
                }`}
              >
                All Vendors {stores.length > 0 && `(${stores.length})`}
              </button>

              <button
                type="button"
                onClick={() => setSelectedVendorTab("open")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
                  selectedVendorTab === "open"
                    ? "bg-emerald-600 text-white shadow-emerald-500/25"
                    : "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-emerald-400 dark:hover:border-emerald-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open Now</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVendorTab("food")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
                  selectedVendorTab === "food"
                    ? "bg-amber-500 text-slate-950 shadow-amber-500/25"
                    : "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-amber-400 dark:hover:border-amber-400"
                }`}
              >
                <span>🍱 Food & Kitchens</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVendorTab("fashion")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
                  selectedVendorTab === "fashion"
                    ? "bg-pink-600 text-white shadow-pink-500/25"
                    : "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-pink-400 dark:hover:border-pink-400"
                }`}
              >
                <span>👔 Fashion & Beauty</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVendorTab("services")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
                  selectedVendorTab === "services"
                    ? "bg-indigo-600 text-white shadow-indigo-500/25"
                    : "backdrop-blur-md bg-white/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-400"
                }`}
              >
                <span>⚡ Services</span>
              </button>
            </div>
          </div>

          {/* VENDOR PROFILE QUICK TABS BAR (DIRECT PROFILE LINKS) */}
          {filteredStores.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Quick Vendor Tabs ({filteredStores.length})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
                  Click any tab to view vendor storefront
                </span>
              </div>

              <div className="relative">
                {vendorsSwipe.canScrollLeft && (
                  <button
                    type="button"
                    onClick={vendorsSwipe.scrollLeft}
                    aria-label="Scroll vendors left"
                    className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-zinc-800 text-[#312E81] dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}

                {vendorsSwipe.canScrollRight && (
                  <button
                    type="button"
                    onClick={vendorsSwipe.scrollRight}
                    aria-label="Scroll vendors right"
                    className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-zinc-800 text-[#312E81] dark:text-zinc-200 shadow-md border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}

                <div
                  ref={vendorsSwipe.containerRef}
                  {...vendorsSwipe.handlers}
                  className={`flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar select-none ${
                    vendorsSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
                  }`}
                >
                  {filteredStores.map((st) => {
                    const isOpen = Boolean(st.isCurrentlyOpen !== undefined ? st.isCurrentlyOpen : st.isOpen);
                    return (
                      <Link
                        key={`quick-tab-${st.id}`}
                        href={`/vendor/${st.id}`}
                        prefetch={true}
                        draggable={false}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/80 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 hover:bg-white dark:hover:bg-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md transition-all text-xs font-heading font-bold text-slate-800 dark:text-zinc-200 shrink-0 shadow-xs group cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full overflow-hidden relative shrink-0 bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600">
                          {st.logo ? (
                            <Image
                              src={getSafeImageUrl(st.logo)}
                              alt={st.name || "Vendor"}
                              fill
                              sizes="20px"
                              className="object-cover"
                              unoptimized={isUnoptimizedImage(st.logo)}
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                              {(st.name || "C").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="truncate max-w-[130px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {st.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isOpen ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"
                          }`}
                        />
                        <ArrowRight
                          size={11}
                          className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VENDOR PROFILE GLASSMORPHISM CARDS GRID */}
          <div className="relative z-10">
            {stores.length === 0 ? (
              // SKELETON LOADING STATE
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl backdrop-blur-xl bg-white/40 dark:bg-zinc-900/40 border border-white/50 dark:border-white/10 p-5 shadow-sm animate-pulse space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
                      <div className="w-20 h-6 rounded-full bg-slate-200 dark:bg-zinc-800" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-36 h-5 rounded-md bg-slate-200 dark:bg-zinc-800" />
                      <div className="w-24 h-4 rounded-md bg-slate-200 dark:bg-zinc-800" />
                      <div className="w-full h-8 rounded-md bg-slate-200/60 dark:bg-zinc-800/60" />
                    </div>
                    <div className="w-full h-10 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              // EMPTY CATEGORY STATE
              <div className="text-center py-10 px-4 backdrop-blur-md bg-white/50 dark:bg-zinc-900/40 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm">
                <Store size={36} className="mx-auto text-slate-400 dark:text-zinc-500 mb-2" />
                <p className="text-sm font-heading font-extrabold text-slate-800 dark:text-zinc-200">
                  No vendors found in this category
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  Switch to "All Vendors" to explore all campus stores and services.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedVendorTab("all")}
                  className="mt-4 px-5 py-2 rounded-full bg-[#312E81] text-white text-xs font-heading font-extrabold shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Show All Vendors
                </button>
              </div>
            ) : (
              // GRID OF VENDOR PROFILE CARDS
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredStores.slice(0, visibleVendorCount).map((st) => {
                  const isOpen = Boolean(st.isCurrentlyOpen !== undefined ? st.isCurrentlyOpen : st.isOpen);
                  const storeRating = st.rating ? Number(st.rating).toFixed(1) : "4.9";
                  const storeCategory = st.category || (st.isService ? "Campus Services" : "Campus Kitchen");
                  const productCount = st._count?.products ?? 0;

                  return (
                    <Link
                      key={`vendor-card-${st.id}`}
                      href={`/vendor/${st.id}`}
                      prefetch={true}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl backdrop-blur-xl bg-white/85 dark:bg-zinc-900/75 border border-white/80 dark:border-zinc-800/80 p-5 shadow-sm hover:shadow-xl hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      {/* SUBTLE GRADIENT CARD SHEEN */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <div className="relative z-10 space-y-3.5">
                        {/* TOP ROW: STORE LOGO & OPEN STATUS */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden relative shrink-0 border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100 dark:bg-zinc-800 shadow-xs group-hover:scale-105 transition-transform duration-300">
                            {st.logo ? (
                              <Image
                                src={getSafeImageUrl(st.logo)}
                                alt={st.name || "Vendor"}
                                fill
                                sizes="56px"
                                className="object-cover"
                                unoptimized={isUnoptimizedImage(st.logo)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-[#312E81] text-white font-heading font-black text-lg">
                                {(st.name || "C").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* LIVE STATUS PILL */}
                          {isOpen ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-heading font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span>Open Now</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] font-heading font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>

                        {/* STORE TITLE & BADGES */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {st.name}
                            </h3>
                            <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md capitalize">
                              {storeCategory}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{storeRating}</span>
                            </span>
                          </div>

                          {st.description && (
                            <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body line-clamp-2 mt-2 leading-relaxed">
                              {st.description}
                            </p>
                          )}
                        </div>

                        {/* STATS ROW */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 font-body">
                          <span className="flex items-center gap-1">
                            <Zap size={12} className="text-amber-500" />
                            <span>{st.estimatedDelivery || "15-25 mins"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={12} className="text-indigo-500" />
                            <span>{productCount} items</span>
                          </span>
                        </div>
                      </div>

                      {/* CALL TO ACTION BUTTON / TAB LINK */}
                      <div className="relative z-10 mt-4 w-full py-2.5 px-4 rounded-xl backdrop-blur-md bg-[#312E81]/5 dark:bg-white/5 border border-[#312E81]/15 dark:border-white/10 text-[#312E81] dark:text-indigo-300 font-heading font-extrabold text-xs flex items-center justify-between group-hover:bg-[#312E81] group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-all shadow-xs">
                        <span>View Vendor Profile</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM PAGINATION: VIEW MORE BUTTON */}
          {filteredStores.length > visibleVendorCount ? (
            <div className="relative z-10 flex flex-col items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setVisibleVendorCount((prev) => prev + 9)}
                className="px-7 py-2.5 rounded-full backdrop-blur-md bg-white/90 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 text-[#312E81] dark:text-indigo-300 hover:text-white hover:bg-[#312E81] dark:hover:bg-indigo-600 font-heading font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer group active:scale-95"
              >
                <span>View More</span>
                <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-body">
                Showing {Math.min(visibleVendorCount, filteredStores.length)} of {filteredStores.length} vendors
              </span>
            </div>
          ) : filteredStores.length > 9 ? (
            <div className="relative z-10 flex flex-col items-center gap-2 pt-3">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-body">
                Showing all {filteredStores.length} vendors
              </span>
              <button
                type="button"
                onClick={() => setVisibleVendorCount(9)}
                className="text-[11px] font-heading font-bold text-[#312E81] dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Show Less
              </button>
            </div>
          ) : null}
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
