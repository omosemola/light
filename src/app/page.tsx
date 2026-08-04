"use client";

import { useState } from "react";
import { Search, Flame, ArrowRight, Clock, Sparkles, Utensils, Cookie, Coffee, ShoppingCart, Cake, BookOpen, HeartPulse } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

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

// CATEGORIES METADATA WITH VECTOR ICONS & CUSTOM BG BADGES
const CATEGORIES = [
  { name: "Food", slug: "food", Icon: Utensils, bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Snacks", slug: "snacks", Icon: Cookie, bg: "bg-amber-50 text-amber-700" },
  { name: "Drinks", slug: "drinks", Icon: Coffee, bg: "bg-blue-50 text-blue-700" },
  { name: "Groceries", slug: "groceries", Icon: ShoppingCart, bg: "bg-emerald-50 text-emerald-700" },
  { name: "Pastries", slug: "pastries", Icon: Cake, bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Stationery", slug: "stationery", Icon: BookOpen, bg: "bg-purple-50 text-purple-700" },
  { name: "Care", slug: "care", Icon: HeartPulse, bg: "bg-pink-50 text-pink-700" },
];

export default function Home() {
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const handleAddProduct = (productId: string) => {
    const product = POPULAR_PRODUCTS.find((p) => p.id === productId);
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
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] font-body text-[#18181B]">
      
      {/* HERO HEADER: Midnight Indigo (#1E1B4B) WITH ANIMATIONS */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="bg-[#1E1B4B] text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#FBBF24] text-[#312E81] text-[11px] font-heading font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles size={13} /> Campus Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white">
                Hey Alex! 👋
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-normal mt-0.5 font-body">
                What are we ordering today?
              </p>
            </div>
            
            <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-md relative">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Search Bar */}
          <Link href="/search" className="block relative w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A]">
              <Search size={22} />
            </div>
            <div className="w-full h-14 pl-12 pr-4 flex items-center rounded-2xl bg-white text-[#71717A] font-body font-medium text-sm md:text-base border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
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
            className="md:col-span-2 bg-[#312E81] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md min-h-[190px]"
          >
            <div>
              <span className="bg-[#FBBF24] text-[#312E81] px-3 py-1 text-xs font-heading font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                <Flame size={14} className="fill-[#312E81]" /> Hot Deal
              </span>
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight mt-3">
                20% OFF All Pastries & Bakery 🥐
              </h2>
              <p className="text-[#F4F3FF] text-xs md:text-sm font-normal mt-1 font-body">Use code CAMPUS20 at checkout</p>
            </div>
            
            <div className="mt-4">
              <Link href="/category/pastries" className="inline-flex items-center gap-2 bg-white text-[#312E81] font-body font-semibold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-sm hover:bg-slate-100 active:scale-95 transition-all">
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
              className="bg-[#FBBF24] rounded-3xl p-4 text-[#1E1B4B] flex flex-col justify-between shadow-sm"
            >
              <span className="bg-[#1E1B4B] text-white text-[10px] font-body font-bold px-2.5 py-0.5 rounded-full w-fit uppercase">
                New Vendor
              </span>
              <div className="mt-2">
                <h3 className="font-heading font-extrabold text-base leading-tight text-[#1E1B4B]">Tasty Treats</h3>
                <p className="text-xs text-[#312E81] font-body font-medium">Fresh Smoothies & Shakes</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#71717A] text-xs font-body font-medium">
                  <Clock size={14} className="text-[#312E81]" /> Avg. Time
                </div>
                <p className="font-heading font-extrabold text-lg text-[#18181B] mt-0.5">15-20 Mins</p>
                <span className="text-[10px] font-body font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                  Fast Campus Riders
                </span>
              </div>
            </motion.div>

          </div>

        </section>

        {/* CATEGORIES SECTION WITH VECTOR ICONS & SCROLL ANIMATIONS */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-30px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B]">
              Explore Categories
            </h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {CATEGORIES.map((cat, i) => {
              const CategoryIcon = cat.Icon;
              return (
                <Link
                  key={i}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center justify-center min-w-[90px] min-h-[100px] bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 active:scale-95 hover:border-[#312E81] transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center shadow-sm mb-1.5 group-hover:scale-110 transition-transform`}>
                    <CategoryIcon size={22} strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-heading font-bold text-[#18181B]">{cat.name}</span>
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
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B]">
                Popular Near You
              </h2>
              <p className="text-xs text-[#71717A] font-body font-normal">Click any item to order</p>
            </div>
            <Link 
              href="/search" 
              className="text-xs md:text-sm font-body font-semibold text-[#312E81] hover:underline flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>

          <ProductGrid 
            products={POPULAR_PRODUCTS} 
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
        <p className="text-[#71717A] text-sm mb-6 leading-relaxed font-body font-normal">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] text-white font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-[#F4F3FF] text-[#312E81] font-semibold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>

    </div>
  );
}
