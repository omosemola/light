"use client";

import { useState, useMemo, useEffect } from "react";
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, X, Star, Clock, Store, RotateCcw, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { searchLiveCatalog, getLiveHomepageData } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";

interface Product {
  id: string;
  name: string;
  price: number;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  image: string;
  description: string;
  prepTime: string;
  isAvailable: boolean;
  category: string;
  rating: number;
  reviewsCount: number;
}

const SEARCH_CATALOG: Product[] = [
  {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.9,
    reviewsCount: 128,
  },
  {
    id: "p1_2",
    name: "Fried Rice Combo with Grilled Turkey",
    price: 4200,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Seasoned vegetable fried rice served with succulent grilled turkey wing, mixed vegetables, and fresh coleslaw.",
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.8,
    reviewsCount: 76,
  },
  {
    id: "p1_3",
    name: "Peppered Chicken Drumsticks (3 pcs)",
    price: 2800,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 5.0,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    description: "Tender chicken drumsticks tossed in hot spicy ATA din din sauce and caramelized sweet bell peppers.",
    prepTime: "10-15 mins",
    isAvailable: true,
    category: "Food",
    rating: 5.0,
    reviewsCount: 64,
  },
  {
    id: "f5",
    name: "Egusi Soup with Pounded Yam & Beef",
    price: 3800,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Rich melon seed egusi soup garnished with pumpkin leaves and tender beef cuts, served with smooth pounded yam.",
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.9,
    reviewsCount: 45,
  },
  {
    id: "p1_4",
    name: "Smoky Party Jollof (Jumbo Platter)",
    price: 5500,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Special extra-large hostel party platter of smoky firewood party jollof with double grilled chicken portions, dodo, and boiled egg.",
    prepTime: "20 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.9,
    reviewsCount: 38,
  },
  {
    id: "p1_5",
    name: "Asun Peppered Goat Meat Portion",
    price: 3200,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    description: "Smoky, slow-grilled spicy goat meat chopped and tossed with habanero peppers and diced red onions.",
    prepTime: "10-15 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.8,
    reviewsCount: 52,
  },
  {
    id: "p1_6",
    name: "Fried Plantain (Dodo) Extra Portion",
    price: 800,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
    description: "Sweet ripe plantain slices fried golden brown in vegetable oil.",
    prepTime: "5 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.8,
    reviewsCount: 90,
  },
  {
    id: "p1_7",
    name: "Coleslaw & Cream Salad Portion",
    price: 600,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description: "Crispy shredded cabbage, carrots, sweet corn, and creamy salad dressing.",
    prepTime: "5 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.7,
    reviewsCount: 41,
  },
];

const CATEGORY_OPTIONS = ["All", "Food"];
const VENDOR_OPTIONS = ["All Vendors", "Mama Cass"];
const POPULAR_SUGGESTIONS = ["Jollof Rice", "Fried Rice Combo", "Peppered Chicken", "Egusi Soup", "Asun Goat Meat", "Plantain Dodo"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<Product[]>(SEARCH_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [maxPrice, setMaxPrice] = useState<number>(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState<string>("All"); // "15", "30", "All"
  const [sortBy, setSortBy] = useState<string>("relevance"); // "relevance", "price_low", "price_high", "rating"

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);
  const [stores, setStores] = useState<any[]>([]);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  useEffect(() => {
    let active = true;
    async function loadStores() {
      try {
        const data = await getLiveHomepageData();
        if (active && data.success && data.stores) {
          setStores(data.stores);
        }
      } catch (err) {
        console.error("Error loading stores in search:", err);
      }
    }
    loadStores();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function performLiveSearch() {
      if (!query.trim()) return;
      try {
        const res = await searchLiveCatalog(query);
        if (active && res.success && res.products.length > 0) {
          const liveResults: Product[] = res.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            vendorId: p.storeId,
            vendorName: p.store?.name || "Campus Vendor",
            vendorRating: p.store?.rating || 4.9,
            image: p.image,
            description: p.description || "",
            prepTime: "15-20 mins",
            isAvailable: p.isAvailable,
            category: p.category?.name || "Food",
            rating: 4.9,
            reviewsCount: 15,
          }));

          // Merge live results with unique IDs
          setCatalog((prev) => {
            const existingIds = new Set(liveResults.map((r) => r.id));
            return [...liveResults, ...prev.filter((p) => !existingIds.has(p.id))];
          });
        }
      } catch (err) {
        console.error("Error during live search:", err);
      }
    }

    const timer = setTimeout(performLiveSearch, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // FILTER LOGIC
  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      // Search query match (Name, Vendor, Description, Category)
      const q = query.toLowerCase().trim();
      const matchesQuery = !q || 
        product.name.toLowerCase().includes(q) ||
        product.vendorName.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);

      // Category match
      const matchesCategory = selectedCategory === "All" || 
        product.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(product.category.toLowerCase());

      // Vendor match
      const matchesVendor = selectedVendor === "All Vendors" || product.vendorName === selectedVendor;

      // Price match
      const matchesPrice = product.price <= maxPrice;

      // Availability match
      const matchesStock = !inStockOnly || product.isAvailable;

      // Prep Time match
      let matchesPrep = true;
      if (maxPrepTime === "15") {
        matchesPrep = product.prepTime.includes("5") || product.prepTime.includes("10") || product.prepTime.includes("15");
      } else if (maxPrepTime === "30") {
        matchesPrep = true;
      }

      return matchesQuery && matchesCategory && matchesVendor && matchesPrice && matchesStock && matchesPrep;
    }).sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [query, selectedCategory, selectedVendor, maxPrice, inStockOnly, maxPrepTime, sortBy]);

  const activeFiltersCount = (selectedCategory !== "All" ? 1 : 0) +
    (selectedVendor !== "All Vendors" ? 1 : 0) +
    (maxPrice < 8000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (maxPrepTime !== "All" ? 1 : 0) +
    (sortBy !== "relevance" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedVendor("All Vendors");
    setMaxPrice(8000);
    setInStockOnly(false);
    setMaxPrepTime("All");
    setSortBy("relevance");
  };

  const handleOpenCustomizer = (productId: string) => {
    const product = catalog.find((p) => p.id === productId) || SEARCH_CATALOG.find((p) => p.id === productId);
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
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 transition-colors duration-200 pb-32">
      
      {/* STICKY SEARCH & FILTER HEADER */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 sticky top-0 md:top-20 z-40 shadow-sm space-y-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link 
            href="/" 
            className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white transition-colors shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>

          {/* Search Input Field */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#71717A] dark:text-zinc-400">
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search food, drinks, stationery, vendors..."
              className="w-full h-12 pl-10 pr-10 rounded-full bg-[#F4F3FF]/70 dark:bg-zinc-800/80 text-[#18181B] dark:text-zinc-100 font-body font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#312E81] dark:focus:ring-indigo-500 border border-indigo-100 dark:border-zinc-700 placeholder-[#71717A] dark:placeholder-zinc-400"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-3 flex items-center text-[#71717A] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Trigger Button */}
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="relative h-12 px-4 bg-[#312E81] dark:bg-indigo-600 text-white rounded-full font-body font-semibold text-xs flex items-center gap-2 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FBBF24] text-[#312E81] font-heading font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Category Pills - Smooth horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-4xl mx-auto pt-1 pb-0.5 px-0.5">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-heading font-bold whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#312E81] dark:bg-indigo-600 text-white shadow-sm"
                    : "bg-[#F4F3FF] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 hover:text-[#312E81] dark:hover:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full mt-6 space-y-6">

        {/* POPULAR SUGGESTIONS (IF SEARCH IS EMPTY & NO FILTERS) */}
        {!query && activeFiltersCount === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-zinc-800 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-400 uppercase tracking-wider">
              <SearchIcon size={14} className="text-[#312E81] dark:text-indigo-400" />
              <span>Popular Campus Searches</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {POPULAR_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  onClick={() => setQuery(sug)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#18181B] dark:text-zinc-200 font-body font-medium text-xs hover:bg-[#312E81] dark:hover:bg-indigo-600 hover:text-white active:scale-95 transition-all border border-indigo-100 dark:border-zinc-700"
                >
                  {sug}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* CAMPUS KITCHENS & STORES SECTION */}
        {stores.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                  <Store size={18} className="text-[#312E81] dark:text-indigo-400" />
                  Campus Kitchens & Stores
                </h3>
                <p className="text-[11px] text-[#71717A] dark:text-zinc-400 font-body">Verified campus vendors with live store fulfillment</p>
              </div>
              <span className="text-xs font-semibold text-[#71717A] dark:text-zinc-400 font-body">
                {stores.length} Stores Available
              </span>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
              {stores.map((st) => (
                <Link
                  key={st.id}
                  href={`/vendor/${st.id}`}
                  className="flex-shrink-0 w-60 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:border-[#312E81] dark:hover:border-indigo-500 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200/60 dark:border-zinc-700">
                      <Image
                        src={st.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80"}
                        alt={st.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
                          {st.name}
                        </h4>
                        {/* LIVE OPEN / CLOSED BADGE */}
                        <span className={`text-[8px] font-heading font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          st.isOpen
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80"
                        }`}>
                          {st.isOpen ? "🟢 Open" : "🔴 Closed"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        {st.description || "Fresh food & campus supplies"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={11} className="text-amber-500" /> {st.estimatedDelivery || "15-25m"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {st.rating ? st.rating.toFixed(1) : "4.9"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ACTIVE FILTER CHIPS BAR */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm text-xs font-body">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-[#71717A] dark:text-zinc-400">Active Filters:</span>
              
              {selectedCategory !== "All" && (
                <span className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700">
                  {selectedCategory}
                  <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory("All")} />
                </span>
              )}

              {selectedVendor !== "All Vendors" && (
                <span className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700">
                  {selectedVendor}
                  <X size={12} className="cursor-pointer" onClick={() => setSelectedVendor("All Vendors")} />
                </span>
              )}

              {maxPrice < 8000 && (
                <span className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700">
                  Under ₦{maxPrice.toLocaleString()}
                  <X size={12} className="cursor-pointer" onClick={() => setMaxPrice(8000)} />
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700">
                  In Stock Only
                  <X size={12} className="cursor-pointer" onClick={() => setInStockOnly(false)} />
                </span>
              )}

              {maxPrepTime !== "All" && (
                <span className="inline-flex items-center gap-1.5 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-100 dark:border-zinc-700">
                  Prep &lt; {maxPrepTime}m
                  <X size={12} className="cursor-pointer" onClick={() => setMaxPrepTime("All")} />
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <RotateCcw size={12} /> Clear All
            </button>
          </div>
        )}

        {/* RESULTS HEADER & COUNT */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100 tracking-tight">
            {query ? `Results for "${query}"` : "Explore Catalog"}
          </h2>
          <span className="text-xs font-body font-semibold text-[#71717A] dark:text-zinc-400">
            {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} found
          </span>
        </div>

        {/* PRODUCT GRID RESULTS */}
        {filteredProducts.length > 0 ? (
          <ProductGrid 
            products={filteredProducts} 
            onAddProduct={handleOpenCustomizer}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mx-auto">
              <SearchIcon size={32} />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">
              No matching products found
            </h3>
            <p className="text-xs font-body font-normal text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
              Try adjusting your search terms, clearing filters, or browsing other categories.
            </p>
            <button
              onClick={() => {
                setQuery("");
                handleResetFilters();
              }}
              className="px-5 py-2.5 bg-[#312E81] dark:bg-indigo-600 text-white rounded-full font-body font-semibold text-xs shadow-md active:scale-95 transition-transform"
            >
              Reset Search & Filters
            </button>
          </motion.div>
        )}

      </div>

      {/* RICH 70% PAGE HEIGHT FILTER MODAL DRAWER */}
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
                  className={`p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center justify-between border transition-all ${
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
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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
                ₦{maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="8000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#312E81] dark:accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#71717A] dark:text-zinc-400 font-semibold">
              <span>₦500</span>
              <span>₦8,000+</span>
            </div>
          </div>

          {/* VENDOR SELECTOR */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <label className="font-heading font-extrabold text-xs text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
              Campus Vendor
            </label>
            <div className="flex flex-wrap gap-2">
              {VENDOR_OPTIONS.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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
                  className={`p-2 rounded-2xl text-xs font-semibold text-center border transition-all ${
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
              <span className="text-xs text-[#71717A] dark:text-zinc-400">Hide items currently sold out</span>
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
              className="w-1/3 h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold rounded-full text-xs active:scale-95 transition-transform"
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="w-2/3 h-12 bg-[#312E81] dark:bg-indigo-600 text-white font-semibold rounded-full text-xs shadow-md active:scale-95 transition-transform"
            >
              Apply Filters ({filteredProducts.length})
            </button>
          </div>

        </div>
      </Modal>

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
