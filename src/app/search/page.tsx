"use client";

import { useState, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, X, Star, Clock, Store, RotateCcw, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

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
    vendorId: "v1",
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
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    description: "100% natural, freshly squeezed orange juice with no added sugar or preservatives.",
    prepTime: "5 mins",
    isAvailable: true,
    category: "Drinks",
    rating: 4.8,
    reviewsCount: 94,
  },
  {
    id: "p3",
    name: "A4 Note Book 60 Leaves (Pack of 5)",
    price: 2500,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description: "High quality 60-leaf ruled exercise notebooks designed for lecture notes.",
    prepTime: "10 mins",
    isAvailable: false,
    category: "Stationery",
    rating: 4.7,
    reviewsCount: 42,
  },
  {
    id: "p4",
    name: "Spicy Beef Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked handcrafted pizza topped with fiery beef suya chunks and melted mozzarella.",
    prepTime: "25-30 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.9,
    reviewsCount: 215,
  },
  {
    id: "f3",
    name: "Fried Rice Special with Turkey",
    price: 4200,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Seasoned fried rice cooked with mixed vegetables and served with fried turkey.",
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.8,
    reviewsCount: 76,
  },
  {
    id: "f4",
    name: "Crispy Chicken Burger & Chips",
    price: 3800,
    vendorId: "v5",
    vendorName: "Campus Bites",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
    prepTime: "15 mins",
    isAvailable: true,
    category: "Food",
    rating: 4.7,
    reviewsCount: 88,
  },
  {
    id: "s1",
    name: "Golden Plantain Chips 150g",
    price: 800,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
    description: "Crispy, naturally sweet fried plantain chips sliced thin.",
    prepTime: "5 mins",
    isAvailable: true,
    category: "Snacks",
    rating: 4.8,
    reviewsCount: 150,
  },
  {
    id: "g1",
    name: "Indomie Super Pack (Carton of 40)",
    price: 14500,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
    description: "Carton of Indomie Instant Noodles Super Pack 120g.",
    prepTime: "10 mins",
    isAvailable: true,
    category: "Groceries",
    rating: 4.7,
    reviewsCount: 34,
  },
  {
    id: "pas1",
    name: "Jumbo Beef Meat Pie",
    price: 1200,
    vendorId: "v8",
    vendorName: "Tasty Bakes",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    description: "Flaky golden crust filled with seasoned minced beef, potatoes, and carrots.",
    prepTime: "5 mins",
    isAvailable: true,
    category: "Pastries",
    rating: 4.9,
    reviewsCount: 145,
  },
  {
    id: "c1",
    name: "Moisturizing Cocoa Butter Lotion 400ml",
    price: 3200,
    vendorId: "v9",
    vendorName: "PharmaCare",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "Deep nourishing body lotion for all skin types.",
    prepTime: "10 mins",
    isAvailable: true,
    category: "Care",
    rating: 4.8,
    reviewsCount: 29,
  },
];

const CATEGORY_OPTIONS = ["All", "Food", "Snacks", "Drinks", "Groceries", "Pastries", "Stationery", "Care"];
const VENDOR_OPTIONS = ["All Vendors", "Mama Cass", "Fresh Squeeze", "Campus Books", "Pizza Hub", "Campus Bites", "Campus Mart", "Tasty Bakes", "PharmaCare"];
const POPULAR_SUGGESTIONS = ["Jollof Rice", "Suya Pizza", "Orange Juice", "Meat Pie", "Indomie Noodles", "Mama Cass", "Notebooks", "Body Lotion"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [maxPrice, setMaxPrice] = useState<number>(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState<string>("All"); // "15", "30", "All"
  const [sortBy, setSortBy] = useState<string>("relevance"); // "relevance", "price_low", "price_high", "rating"

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  // FILTER LOGIC
  const filteredProducts = useMemo(() => {
    return SEARCH_CATALOG.filter((product) => {
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

  const handleAddProduct = (productId: string) => {
    const product = SEARCH_CATALOG.find((p) => p.id === productId);
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
              <Sparkles size={14} className="text-[#FBBF24]" />
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
            onAddProduct={handleAddProduct}
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
