"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Store,
  Clock,
  Star,
  RotateCcw,
  Check,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Compass,
  Utensils,
  Cake,
  Cookie,
  Coffee,
  ShoppingBag,
  Shirt,
  SprayCan,
  Car,
  Palette,
  Smartphone,
  Flame,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Tag,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { getLiveSearchCatalog, searchLiveCatalog } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";
import { getSafeImageUrl, isUnoptimizedImage } from "@/lib/productOptions";
import { useSwipeScroll } from "@/hooks/useSwipeScroll";
import {
  parseSearchQuery,
  scoreProduct,
  scoreStore,
  matchesCategoryPill,
} from "@/lib/searchEngine";
import { MAJOR_CATEGORIES, normalizeCategorySlug } from "@/lib/categories";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string;
  vendorId: string;
  vendorName: string;
  description: string;
  rawImage?: string;
  vendorRating?: number;
  vendorIsOpen?: boolean;
  vendorPrepTime?: string;
  prepTime?: string;
  isAvailable?: boolean;
  category?: string;
  categoryId?: string | null;
  storeCategory?: string;
  rating?: number;
  reviewsCount?: number;
}

const CATEGORY_CONFIG = [
  { name: "All", slug: "all", icon: Compass },
  ...MAJOR_CATEGORIES.map((c) => ({
    name: c.shortName,
    slug: c.slug,
    icon: c.icon,
  })),
];

const CATEGORY_OPTIONS = CATEGORY_CONFIG.map((c) => c.name);

const POPULAR_SUGGESTIONS = [
  "Food",
  "Pastries",
  "Snacks",
  "Drinks",
  "Fashion",
  "Jewelries",
  "Perfumes",
  "Beauty",
  "Gadgets",
  "Services",
];

interface SearchClientProps {
  initialCatalog?: any[];
  initialStores?: any[];
  initialQuery?: string;
  initialCategory?: string;
}

export default function SearchClient({
  initialCatalog = [],
  initialStores = [],
  initialQuery = "",
  initialCategory = "All",
}: SearchClientProps) {
  const router = useRouter();
  const storesSwipe = useSwipeScroll<HTMLDivElement>();
  const categoryPillsSwipe = useSwipeScroll<HTMLDivElement>();
  const quickFiltersSwipe = useSwipeScroll<HTMLDivElement>();

  const [isMounted, setIsMounted] = useState(false);
  const [randomSeed, setRandomSeed] = useState<number>(0);
  const [shuffleSpinCount, setShuffleSpinCount] = useState<number>(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [masterCatalog, setMasterCatalog] = useState<Product[]>(() =>
    initialCatalog.map(mapProduct)
  );
  const [serverSearchResults, setServerSearchResults] = useState<Product[] | null>(null);
  const [stores, setStores] = useState<any[]>(initialStores);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (!initialCategory || initialCategory.toLowerCase() === "all") return "All";
    const canonical = normalizeCategorySlug(initialCategory);
    const found = CATEGORY_CONFIG.find(
      (c) => c.slug === canonical || c.name.toLowerCase() === initialCategory.toLowerCase()
    );
    return found ? found.name : initialCategory;
  });
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Keep browser URL search params in sync (shallow update via replaceState)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");

    if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
    else params.delete("category");

    const qs = params.toString();
    const nextUrl = qs ? `/search?${qs}` : "/search";
    window.history.replaceState(null, "", nextUrl);
  }, [query, selectedCategory]);

  // Reset pagination when search/filter criteria change
  useEffect(() => {
    setVisibleCount(24);
  }, [query, selectedCategory, selectedVendor, maxPrice, inStockOnly, maxPrepTime, sortBy]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  const { confirmAndReplaceCart } = useCartStore();

  function mapProduct(p: any): Product {
    return {
      id: p.id,
      slug: p.slug || p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      rawImage: p.rawImage || p.image,
      vendorId: p.vendorId || p.storeId || "",
      vendorName: p.vendorName || p.store?.name || "Campus Vendor",
      description: p.description || "",
      rating: p.rating || 4.9,
      vendorRating: p.vendorRating || p.store?.rating || 4.9,
      vendorIsOpen: p.vendorIsOpen,
      vendorPrepTime: p.vendorPrepTime || p.store?.estimatedDelivery || "15-25 mins",
      prepTime: p.prepTime || p.vendorPrepTime || "15-20 mins",
      isAvailable: p.isAvailable !== false,
      category: typeof p.category === "string" ? p.category : p.category?.name || "Pastries",
      categoryId: p.categoryId || p.category?.id || null,
      storeCategory: p.storeCategory || p.store?.category || "",
      reviewsCount: p.reviewsCount || 0,
    };
  }

  // Hydration-safe client-side mount effect for randomizing Explore Catalog
  useEffect(() => {
    setIsMounted(true);
    setRandomSeed(Math.random());
  }, []);

  // Sync with initial props
  useEffect(() => {
    if (initialCatalog && initialCatalog.length > 0) {
      setMasterCatalog((prev) => {
        const incoming = initialCatalog.map(mapProduct);
        return incoming.length >= prev.length ? incoming : prev;
      });
    }
    if (initialStores && initialStores.length > 0) {
      setStores(initialStores);
    }
  }, [initialCatalog, initialStores]);

  // Fetch full live catalog on mount ONLY if initial catalog was empty
  useEffect(() => {
    if (initialCatalog && initialCatalog.length > 0) return;
    let active = true;
    async function loadFreshMaster() {
      try {
        const data = await getLiveSearchCatalog();
        if (active && data.success) {
          if (data.products && data.products.length > 0) {
            setMasterCatalog(data.products.map(mapProduct));
          }
          if (data.stores && data.stores.length > 0) {
            setStores(data.stores);
          }
        }
      } catch (e) {
        console.error("Error loading master catalog for search:", e);
      }
    }
    loadFreshMaster();
    return () => {
      active = false;
    };
  }, [initialCatalog]);

  const vendorOptions = useMemo(() => {
    const storeNames = stores.map((s) => s.name).filter(Boolean);
    return ["All Vendors", ...Array.from(new Set(storeNames))];
  }, [stores]);

  // Debounced server search to complement client-side filtering
  useEffect(() => {
    if (!query.trim()) {
      setServerSearchResults(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchLiveCatalog(query);
        if (active && res.success) {
          if (res.products && res.products.length > 0) {
            setServerSearchResults(res.products.map(mapProduct));
          } else {
            setServerSearchResults([]);
          }
          if (res.stores && res.stores.length > 0) {
            setStores(res.stores);
          }
        }
      } catch (err) {
        console.error("Error during live search:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Parsed tokens + synonyms for real-time relevance scoring
  const parsedQuery = useMemo(() => {
    return parseSearchQuery(query);
  }, [query]);

  // Combine client-side instant search on masterCatalog with server results
  const baseProducts = useMemo(() => {
    if (!query.trim()) {
      return masterCatalog;
    }
    const merged = [...masterCatalog];
    if (serverSearchResults && serverSearchResults.length > 0) {
      for (const item of serverSearchResults) {
        if (!merged.some((m) => m.id === item.id)) {
          merged.push(item);
        }
      }
    }
    return merged;
  }, [masterCatalog, serverSearchResults, query]);

  // Comprehensive Filter & Relevance Ranking Logic
  const filteredProducts = useMemo(() => {
    const hasQuery = parsedQuery.tokens.length > 0;

    // 1. Filter products by category, vendor, price, stock, prep time and query score
    const scoredList: { product: Product; score: number }[] = [];

    for (const product of baseProducts) {
      // Category filter (uses robust pill matching with aliases & excludes)
      const matchesCategory = matchesCategoryPill(
        selectedCategory,
        product.categoryId || product.category,
        product.storeCategory
      );
      if (!matchesCategory) continue;

      // Vendor filter
      if (selectedVendor !== "All Vendors" && (product.vendorName || "") !== selectedVendor) {
        continue;
      }

      // Max price filter (only applied when user sets a price constraint)
      if (maxPrice !== null && (product.price || 0) > maxPrice) continue;

      // Stock filter
      if (inStockOnly && product.isAvailable === false) continue;

      // Prep time filter
      if (maxPrepTime === "15") {
        const prepStr = product.prepTime || product.vendorPrepTime || "";
        const matchesPrep = prepStr.includes("5") || prepStr.includes("10") || prepStr.includes("15");
        if (!matchesPrep) continue;
      }

      // Query scoring
      if (hasQuery) {
        const score = scoreProduct(product, parsedQuery);
        if (score <= 0) continue;
        scoredList.push({ product, score });
      } else {
        scoredList.push({ product, score: 0 });
      }
    }

    // 2. Sort results
    if (sortBy === "price_low") {
      return [...scoredList].sort((a, b) => (a.product.price || 0) - (b.product.price || 0)).map((x) => x.product);
    }
    if (sortBy === "price_high") {
      return [...scoredList].sort((a, b) => (b.product.price || 0) - (a.product.price || 0)).map((x) => x.product);
    }
    if (sortBy === "rating") {
      return [...scoredList].sort((a, b) => (b.product.rating || 4.9) - (a.product.rating || 4.9)).map((x) => x.product);
    }

    // Default: "relevance"
    if (hasQuery) {
      // High score first! Exact title match > title word > vendor > description
      return [...scoredList]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.product.rating || 4.9) - (a.product.rating || 4.9);
        })
        .map((x) => x.product);
    }

    // If no query and user picked a category, keep deterministic order
    if (selectedCategory !== "All") {
      return scoredList.map((x) => x.product);
    }

    // Explore Catalog (no query, "All" category): randomize on mount or manual shuffle
    if (!isMounted || randomSeed === 0) {
      return scoredList.map((x) => x.product);
    }

    const shuffled = scoredList.map((x) => x.product);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [
    baseProducts,
    parsedQuery,
    selectedCategory,
    selectedVendor,
    maxPrice,
    inStockOnly,
    maxPrepTime,
    sortBy,
    isMounted,
    randomSeed,
  ]);

  // Progressive pagination for silky-smooth rendering
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Filter stores when user types a search query using relevance scoring
  const displayedStores = useMemo(() => {
    if (!query.trim()) return stores;
    const parsed = parseSearchQuery(query);
    if (parsed.tokens.length === 0) return stores;

    const scored = stores
      .map((s) => ({ store: s, score: scoreStore(s, parsed) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.store);

    return scored; // Returns ONLY matching stores (if 0 match, returns empty array, NOT all stores!)
  }, [stores, query]);

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedVendor !== "All Vendors" ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (maxPrepTime !== "All" ? 1 : 0) +
    (sortBy !== "relevance" ? 1 : 0);

  const handleCategoryClick = (cat: string) => {
    if (cat.toLowerCase() === "services") {
      router.push("/category/services");
      return;
    }
    setSelectedCategory(cat);
  };

  const handleShuffle = () => {
    setRandomSeed(Math.random());
    setShuffleSpinCount((c) => c + 1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedVendor("All Vendors");
    setMaxPrice(null);
    setInStockOnly(false);
    setMaxPrepTime("All");
    setSortBy("relevance");
  };

  const handleOpenCustomizer = (productId: string) => {
    const product = baseProducts.find((p: Product) => p.id === productId);
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
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-300 pb-32">
      {/* STICKY GLASSMORPHIC SEARCH & DISCOVERY HEADER */}
      <div className="px-4 sm:px-6 pt-4 pb-3.5 bg-white/80 dark:bg-[#0E0E12]/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/70 dark:border-zinc-800/80 sticky top-0 md:top-20 z-40 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 space-y-3">
        <div className="flex items-center gap-2.5 sm:gap-3 max-w-5xl mx-auto">
          <Link
            href="/"
            className="w-11 h-11 rounded-2xl bg-slate-100/90 dark:bg-zinc-800/90 text-[#1E1B4B] dark:text-indigo-300 flex items-center justify-center hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white active:scale-95 transition-all duration-200 shrink-0 border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs"
            aria-label="Back to home"
          >
            <ArrowLeft size={19} />
          </Link>

          {/* Animated Search Input Field */}
          <motion.div
            animate={{
              scale: isSearchFocused ? 1.005 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`relative flex-1 rounded-2xl transition-all duration-300 ${
              isSearchFocused || query
                ? "bg-white dark:bg-zinc-900 ring-2 ring-[#312E81] dark:ring-indigo-500 shadow-[0_8px_28px_rgba(49,46,129,0.10)] dark:shadow-[0_8px_28px_rgba(99,102,241,0.15)] border-transparent"
                : "bg-slate-100/85 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/70 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div
              className={`absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
                isSearchFocused || query
                  ? "text-[#312E81] dark:text-indigo-400"
                  : "text-slate-400 dark:text-zinc-400"
              }`}
            >
              <SearchIcon size={18} strokeWidth={2.3} />
            </div>

            <input
              type="text"
              value={query}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meals, pastries, perfumes, gadgets, stores..."
              className="w-full h-11 sm:h-12 pl-10 pr-20 rounded-2xl bg-transparent text-[#18181B] dark:text-zinc-100 font-body font-medium text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              autoFocus
            />

            <div className="absolute inset-y-0 right-2.5 flex items-center gap-1.5">
              <AnimatePresence>
                {isLoading && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="w-4 h-4 rounded-full border-2 border-[#312E81]/30 dark:border-indigo-400/30 border-t-[#312E81] dark:border-t-indigo-400 animate-spin"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    type="button"
                    onClick={() => setQuery("")}
                    className="w-7 h-7 rounded-xl bg-slate-200/80 dark:bg-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Filter & Sort Trigger Button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsFilterModalOpen(true)}
            className={`relative h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl font-heading font-bold text-xs flex items-center gap-2 transition-all duration-200 shrink-0 cursor-pointer border ${
              activeFiltersCount > 0
                ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-500 shadow-md shadow-indigo-950/20"
                : "bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-100 border-slate-800 dark:border-zinc-700 hover:bg-[#312E81] dark:hover:bg-indigo-600 shadow-xs"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            <AnimatePresence>
              {activeFiltersCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-5 h-5 rounded-full bg-[#FBBF24] text-[#1E1B4B] font-heading font-black text-[10px] flex items-center justify-center shadow-xs"
                >
                  {activeFiltersCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Interactive Category Pills with Icons & Animated Active Indicator */}
        <div className="relative group/pills max-w-5xl mx-auto">
          <AnimatePresence>
            {categoryPillsSwipe.canScrollLeft && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={categoryPillsSwipe.scrollLeft}
                aria-label="Scroll categories left"
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-[#312E81] dark:text-zinc-100 shadow-lg border border-slate-200/80 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {categoryPillsSwipe.canScrollRight && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={categoryPillsSwipe.scrollRight}
                aria-label="Scroll categories right"
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-[#312E81] dark:text-zinc-100 shadow-lg border border-slate-200/80 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          <div
            ref={categoryPillsSwipe.containerRef}
            {...categoryPillsSwipe.handlers}
            className={`flex gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-1 px-0.5 select-none ${
              categoryPillsSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
            }`}
          >
            {CATEGORY_CONFIG.map(({ name: cat, icon: CatIcon }) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  draggable={false}
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer select-none flex items-center gap-1.5 ${
                    isSelected
                      ? "text-white"
                      : "bg-slate-100/80 dark:bg-zinc-800/70 text-slate-600 dark:text-zinc-300 hover:text-[#312E81] dark:hover:text-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="search-active-category-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#312E81] to-[#4338CA] dark:from-indigo-600 dark:to-indigo-500 shadow-sm shadow-indigo-950/20"
                    />
                  )}
                  <CatIcon
                    size={13}
                    className={`relative z-10 transition-transform duration-200 ${
                      isSelected ? "text-[#FBBF24] scale-110" : "text-slate-400 dark:text-zinc-400"
                    }`}
                  />
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full mt-5 space-y-6">
        {/* TRENDING CAMPUS DISCOVERY & QUICK SORT BAR */}
        <AnimatePresence mode="popLayout">
          {!query && activeFiltersCount === 0 && (
            <motion.div
              key="trending-discovery-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden bg-white dark:bg-[#121215] rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-zinc-800/80 space-y-3.5"
            >
              {/* Subtle Ambient Glow */}
              <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-2xl" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-heading font-extrabold text-[#1E1B4B] dark:text-indigo-300 uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-lg bg-amber-400/20 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Flame size={13} className="fill-amber-500 text-amber-500" />
                  </span>
                  <span>Trending on Campus</span>
                </div>
                <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <TrendingUp size={11} /> Live Searches
                </span>
              </div>

              <div className="relative flex flex-wrap gap-2">
                {POPULAR_SUGGESTIONS.map((sug, idx) => (
                  <motion.button
                    key={sug}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03, duration: 0.22 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (sug.toLowerCase() === "services") {
                        router.push("/category/services");
                      } else {
                        setQuery(sug);
                      }
                    }}
                    className="group px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 text-[#18181B] dark:text-zinc-200 font-body font-semibold text-xs hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white transition-all duration-200 border border-slate-200/70 dark:border-zinc-700/70 hover:border-[#312E81] dark:hover:border-indigo-500 flex items-center cursor-pointer shadow-2xs"
                  >
                    <span>{sug}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CAMPUS STORES & MERCHANTS CAROUSEL */}
        {displayedStores.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F4F3FF] dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-[#312E81] dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                  <Store size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#18181B] dark:text-zinc-100 leading-tight">
                    Campus Stores & Merchants
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-body">
                    Verified campus vendors with direct fulfillment
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-heading font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/70 dark:border-zinc-700/70">
                {displayedStores.length} {displayedStores.length === 1 ? "Store" : "Stores"}
              </span>
            </div>

            <div className="relative group/stores">
              {/* Desktop Navigation Chevrons */}
              <AnimatePresence>
                {storesSwipe.canScrollLeft && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={storesSwipe.scrollLeft}
                    aria-label="Scroll stores left"
                    className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-[#312E81] dark:text-zinc-100 shadow-lg border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={17} />
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {storesSwipe.canScrollRight && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    type="button"
                    onClick={storesSwipe.scrollRight}
                    aria-label="Scroll stores right"
                    className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-[#312E81] dark:text-zinc-100 shadow-lg border border-slate-200 dark:border-zinc-700 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight size={17} />
                  </motion.button>
                )}
              </AnimatePresence>

              <div
                ref={storesSwipe.containerRef}
                {...storesSwipe.handlers}
                className={`flex gap-3.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 select-none ${
                  storesSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
                }`}
              >
                {displayedStores.map((st, idx) => {
                  const open = st.isCurrentlyOpen !== undefined ? st.isCurrentlyOpen : st.isOpen;
                  const safeLogo = getSafeImageUrl(st.logo);

                  return (
                    <motion.div
                      key={st.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.25) }}
                      whileHover={{ y: -3 }}
                      className="flex-shrink-0 w-64 sm:w-68"
                    >
                      <Link
                        href={`/vendor/${st.id}`}
                        draggable={false}
                        className="h-full p-3.5 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-zinc-800/90 shadow-xs hover:shadow-lg hover:shadow-indigo-950/5 hover:border-[#312E81]/60 dark:hover:border-indigo-500/60 transition-all duration-200 group flex flex-col justify-between select-none relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3 pointer-events-none">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200/70 dark:border-zinc-700 pointer-events-none shadow-2xs">
                            <Image
                              src={safeLogo}
                              alt={st.name}
                              fill
                              unoptimized={isUnoptimizedImage(safeLogo)}
                              className="object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                              draggable={false}
                            />
                          </div>

                          <div className="min-w-0 flex-1 pointer-events-none">
                            <div className="flex items-center justify-between gap-1.5 pointer-events-none">
                              <h4 className="font-heading font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white truncate flex items-center gap-1 pointer-events-none group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors">
                                <span className="truncate">{st.name}</span>
                                <ShieldCheck
                                  size={12}
                                  className="text-[#312E81] dark:text-indigo-400 shrink-0"
                                />
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 text-[8.5px] font-heading font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 pointer-events-none ${
                                  open
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80"
                                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    open ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                  }`}
                                />
                                {open ? "Open" : "Closed"}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 pointer-events-none">
                              {st.description || "Fresh food & campus supplies"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-[10.5px] text-slate-600 dark:text-zinc-400 pointer-events-none">
                          <div className="flex items-center gap-2.5 pointer-events-none">
                            <span className="flex items-center gap-1 font-semibold pointer-events-none">
                              <Clock size={11} className="text-amber-500 pointer-events-none" />
                              {st.estimatedDelivery || "15-25m"}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 pointer-events-none">
                              <Star
                                size={11}
                                className="fill-amber-400 text-amber-400 pointer-events-none"
                              />
                              {st.rating ? st.rating.toFixed(1) : "4.9"}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-0.5 text-[10px] font-heading font-bold text-[#312E81] dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform pointer-events-none">
                            Visit <ArrowUpRight size={11} />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* ONE-TAP QUICK SORT & FILTER STRIP */}
        <div
          ref={quickFiltersSwipe.containerRef}
          {...quickFiltersSwipe.handlers}
          className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none ${
            quickFiltersSwipe.isDragging ? "cursor-grabbing" : "md:cursor-grab"
          }`}
        >
          {[
            {
              id: "relevance",
              label: "Recommended",
              active: sortBy === "relevance",
              onClick: () => setSortBy("relevance"),
              icon: CheckCircle2,
            },
            {
              id: "price_low",
              label: "Lowest Price",
              active: sortBy === "price_low",
              onClick: () => setSortBy(sortBy === "price_low" ? "relevance" : "price_low"),
              icon: Tag,
            },
            {
              id: "rating",
              label: "Top Rated ★",
              active: sortBy === "rating",
              onClick: () => setSortBy(sortBy === "rating" ? "relevance" : "rating"),
              icon: Star,
            },
            {
              id: "fast_prep",
              label: "Fast Prep < 15m",
              active: maxPrepTime === "15",
              onClick: () => setMaxPrepTime(maxPrepTime === "15" ? "All" : "15"),
              icon: Zap,
            },
            {
              id: "in_stock",
              label: "In Stock Only",
              active: inStockOnly,
              onClick: () => setInStockOnly(!inStockOnly),
              icon: ShieldCheck,
            },
          ].map((chip) => {
            const ChipIcon = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                draggable={false}
                onClick={chip.onClick}
                className={`px-3 py-1.5 rounded-full text-[11px] font-heading font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 border transition-all duration-200 cursor-pointer select-none ${
                  chip.active
                    ? "bg-[#EEF2FF] dark:bg-indigo-950/90 text-[#312E81] dark:text-indigo-300 border-[#312E81]/30 dark:border-indigo-500/50 shadow-2xs"
                    : "bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                <ChipIcon
                  size={12}
                  className={
                    chip.active
                      ? "text-[#312E81] dark:text-indigo-400"
                      : "text-slate-400 dark:text-zinc-500"
                  }
                />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE FILTER CHIPS BAR */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-indigo-100 dark:border-zinc-800 shadow-xs text-xs font-body">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                    Active:
                  </span>

                  {selectedCategory !== "All" && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      {selectedCategory}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setSelectedCategory("All")}
                      />
                    </motion.span>
                  )}

                  {selectedVendor !== "All Vendors" && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      {selectedVendor}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setSelectedVendor("All Vendors")}
                      />
                    </motion.span>
                  )}

                  {maxPrice !== null && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      Under ₦{maxPrice.toLocaleString()}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setMaxPrice(null)}
                      />
                    </motion.span>
                  )}

                  {inStockOnly && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      In Stock Only
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setInStockOnly(false)}
                      />
                    </motion.span>
                  )}

                  {maxPrepTime !== "All" && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      Prep &lt; {maxPrepTime}m
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setMaxPrepTime("All")}
                      />
                    </motion.span>
                  )}

                  {sortBy !== "relevance" && (
                    <motion.span
                      layout
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700"
                    >
                      Sort: {sortBy === "price_low" ? "Low to High" : sortBy === "price_high" ? "High to Low" : "Top Rated"}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={() => setSortBy("relevance")}
                      />
                    </motion.span>
                  )}
                </div>

                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw size={12} /> Reset All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULTS HEADER & ANIMATED SHUFFLE */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#18181B] dark:text-zinc-100 tracking-tight">
              {query
                ? `Results for "${query}"`
                : selectedCategory !== "All"
                ? `${selectedCategory} Catalog`
                : "Explore Catalog"}
            </h2>
            {!query && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleShuffle}
                title="Shuffle products"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 hover:bg-[#312E81] hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-100 dark:border-zinc-700 transition-colors cursor-pointer text-[11px] font-heading font-bold shadow-2xs"
                aria-label="Shuffle products"
              >
                <motion.span
                  animate={{ rotate: shuffleSpinCount * 180 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="inline-flex"
                >
                  <Shuffle size={12} />
                </motion.span>
                <span className="hidden sm:inline">Shuffle</span>
              </motion.button>
            )}
          </div>
          <span className="text-xs font-heading font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/90 text-slate-600 dark:text-zinc-400">
            {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* PRODUCT GRID RESULTS WITH SMOOTH TRANSITIONS */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#121215] rounded-2xl p-2 border border-slate-200/70 dark:border-zinc-800/80 space-y-2.5 animate-pulse"
                >
                  <div className="w-full aspect-[4/3] rounded-xl bg-slate-100 dark:bg-zinc-800/80" />
                  <div className="h-3.5 bg-slate-200/80 dark:bg-zinc-800 rounded-md w-3/4" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-4 bg-slate-200/80 dark:bg-zinc-800 rounded-md w-16" />
                    <div className="h-6 w-6 bg-slate-100 dark:bg-zinc-800 rounded-full" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredProducts.length > 0 ? (
            <motion.div
              key={`grid-${selectedCategory}-${sortBy}-${shuffleSpinCount}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductGrid
                products={paginatedProducts}
                onAddProduct={handleOpenCustomizer}
              />

              {filteredProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="px-6 py-3 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Load More Products</span>
                    <span className="text-[11px] font-normal opacity-85">
                      ({paginatedProducts.length} of {filteredProducts.length})
                    </span>
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Showing {paginatedProducts.length} of {filteredProducts.length} products
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="text-center py-14 px-6 bg-white dark:bg-[#121215] rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4 max-w-lg mx-auto my-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-zinc-700 shadow-xs">
                <SearchIcon size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">
                  No matching items found
                </h3>
                <p className="text-xs font-body text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  We couldn&apos;t find anything matching your current search or filter criteria. Try exploring another category or resetting filters.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    setQuery("");
                    handleResetFilters();
                  }}
                  className="px-5 py-2.5 bg-[#312E81] dark:bg-indigo-600 text-white rounded-full font-heading font-bold text-xs shadow-md hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Reset Search & Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RICH FILTER MODAL DRAWER */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter & Sort Products"
        isBottomSheet
      >
        <div className="space-y-6 font-body text-[#18181B] dark:text-zinc-100 text-sm">
          {/* SORT BY */}
          <div className="space-y-2">
            <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Recommended", value: "relevance" },
                { label: "Price: Low to High", value: "price_low" },
                { label: "Price: High to Low", value: "price_high" },
                { label: "Highest Rated", value: "rating" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center justify-between border transition-all cursor-pointer ${
                    sortBy === opt.value
                      ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                      : "bg-[#F4F3FF]/50 dark:bg-zinc-800/50 text-[#18181B] dark:text-zinc-200 border-indigo-100 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY SELECTOR */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
              Product Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    if (cat.toLowerCase() === "services") {
                      setIsFilterModalOpen(false);
                      router.push("/category/services");
                      return;
                    }
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-xs"
                      : "bg-[#F4F3FF]/50 dark:bg-zinc-800/50 text-[#71717A] dark:text-zinc-300 border-indigo-100 dark:border-zinc-700 hover:text-[#312E81] dark:hover:text-indigo-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* PRICE RANGE SLIDER */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">
                Max Price
              </label>
              <span className="font-body font-extrabold text-[#312E81] dark:text-indigo-400">
                {maxPrice === null ? "Any Price (No Limit)" : `Under ₦${maxPrice.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="2000000"
              step="5000"
              value={maxPrice === null ? 2000000 : maxPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(val >= 2000000 ? null : val);
              }}
              className="w-full accent-[#312E81] dark:accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#71717A] dark:text-zinc-400 font-semibold">
              <span>₦1,000</span>
              <span>₦2,000,000+ (Any)</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: "Any Price", val: null },
                { label: "< ₦10k", val: 10000 },
                { label: "< ₦25k", val: 25000 },
                { label: "< ₦50k", val: 50000 },
                { label: "< ₦100k", val: 100000 },
                { label: "< ₦500k", val: 500000 },
                { label: "< ₦1M", val: 1000000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMaxPrice(preset.val)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-extrabold transition cursor-pointer border ${
                    maxPrice === preset.val
                      ? "bg-[#312E81] text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-400"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* VENDOR SELECTOR */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
              Campus Vendor
            </label>
            <div className="flex flex-wrap gap-2">
              {vendorOptions.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedVendor === vendor
                      ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600"
                      : "bg-[#F4F3FF]/50 dark:bg-zinc-800/50 text-[#71717A] dark:text-zinc-300 border-indigo-100 dark:border-zinc-700 hover:text-[#312E81] dark:hover:text-indigo-300"
                  }`}
                >
                  {vendor}
                </button>
              ))}
            </div>
          </div>

          {/* PREP TIME FILTER */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
              Max Preparation Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Any Time", value: "All" },
                { label: "< 15 Mins", value: "15" },
                { label: "< 30 Mins", value: "30" },
              ].map((timeOpt) => (
                <button
                  key={timeOpt.value}
                  onClick={() => setMaxPrepTime(timeOpt.value)}
                  className={`p-2 rounded-2xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                    maxPrepTime === timeOpt.value
                      ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600"
                      : "bg-[#F4F3FF]/50 dark:bg-zinc-800/50 text-[#71717A] dark:text-zinc-300 border-indigo-100 dark:border-zinc-700 hover:text-[#312E81] dark:hover:text-indigo-300"
                  }`}
                >
                  {timeOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* IN STOCK ONLY TOGGLE */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div>
              <span className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100 block">
                In Stock Items Only
              </span>
              <span className="text-xs text-[#71717A] dark:text-zinc-400">
                Hide items currently sold out
              </span>
            </div>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-5 h-5 accent-[#312E81] dark:accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={handleResetFilters}
              className="w-1/3 h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold rounded-full text-xs active:scale-95 transition-transform cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="w-2/3 h-12 bg-[#312E81] dark:bg-indigo-600 text-white font-semibold rounded-full text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              Apply Filters ({filteredProducts.length})
            </button>
          </div>
        </div>
      </Modal>

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
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from{" "}
          <strong>{pendingProduct?.item?.vendorName}</strong>?
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
