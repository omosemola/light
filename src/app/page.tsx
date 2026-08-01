"use client";

import { useState } from "react";
import { Search, Flame, Sparkles, Clock, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

// CATEGORIES DATA
const CATEGORIES = [
  { name: "Food", slug: "food", icon: "🍔", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Snacks", slug: "snacks", icon: "🍿", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Drinks", slug: "drinks", icon: "🥤", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Groceries", slug: "groceries", icon: "🛒", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Pastries", slug: "pastries", icon: "🥐", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Stationery", slug: "stationery", icon: "✏️", bg: "bg-[#F4F3FF] text-[#312E81]" },
  { name: "Care", slug: "care", icon: "🧴", bg: "bg-[#F4F3FF] text-[#312E81]" },
];

const POPULAR_PRODUCTS = [
  {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served with crispy fried plantain and a piece of grilled chicken leg.",
    isAvailable: true,
  },
  {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    description: "100% natural, freshly squeezed orange juice with no added sugar or preservatives.",
    isAvailable: true,
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
  },
  {
    id: "p4",
    name: "Spicy Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
    isAvailable: true,
  },
];

export default function Home() {
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

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

  const handleOpenDetail = (productId: string) => {
    const product = POPULAR_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] font-body text-[#18181B]">
      
      {/* HERO HEADER: Midnight Indigo (#1E1B4B) */}
      <section className="bg-[#1E1B4B] text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Popular Badge: Warm Electric Yellow (#FBBF24) + Deep Indigo (#312E81) text */}
                <span className="bg-[#FBBF24] text-[#312E81] text-[11px] font-heading font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> Campus Active
                </span>
              </div>
              {/* Main Hero Heading: Plus Jakarta Sans 800 */}
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
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full -mt-4 z-20 space-y-8 pb-12">
        
        {/* PROMOTIONAL BENTO GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main Hero Bento Card: Deep Indigo (#312E81) */}
          <div className="md:col-span-2 bg-[#312E81] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md min-h-[190px]">
            <div>
              {/* Discount Label: Electric Yellow (#FBBF24) */}
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
          </div>

          {/* Side Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            
            <div className="bg-[#FBBF24] rounded-3xl p-4 text-[#1E1B4B] flex flex-col justify-between shadow-sm">
              <span className="bg-[#1E1B4B] text-white text-[10px] font-body font-bold px-2.5 py-0.5 rounded-full w-fit uppercase">
                New Vendor
              </span>
              <div className="mt-2">
                <h3 className="font-heading font-extrabold text-base leading-tight text-[#1E1B4B]">Tasty Treats</h3>
                <p className="text-xs text-[#312E81] font-body font-medium">Fresh Smoothies & Shakes</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-[#71717A] text-xs font-body font-medium">
                  <Clock size={14} className="text-[#312E81]" /> Avg. Time
                </div>
                <p className="font-heading font-extrabold text-lg text-[#18181B] mt-0.5">15-20 Mins</p>
                <span className="text-[10px] font-body font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                  Fast Campus Riders
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* CATEGORIES SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            {/* Section Headings: Plus Jakarta Sans 700 */}
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B]">
              Explore Categories
            </h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center justify-center min-w-[85px] min-h-[95px] bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 active:scale-95 hover:border-[#312E81] transition-all group"
              >
                {/* Active category icon box: Light Lavender Gray (#F4F3FF) */}
                <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-2xl shadow-sm mb-1.5`}>
                  {cat.icon}
                </div>
                {/* Category Names: Plus Jakarta Sans 600-700 */}
                <span className="text-xs font-heading font-bold text-[#18181B]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* POPULAR NEAR YOU SECTION */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B]">
                Popular Near You
              </h2>
              <p className="text-xs text-[#71717A] font-body font-normal">Click on any product to view details</p>
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
            onClickProduct={handleOpenDetail} 
          />
        </section>

      </div>

      {/* PRODUCT DETAILS MODAL */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.vendorName || "Product Details"}
      >
        {selectedProduct && (
          <div className="space-y-4 font-body">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#FAFAF7]">
              <Image 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                fill 
                className="object-cover" 
              />
            </div>

            <div>
              <span className="text-xs font-body font-medium text-[#71717A] block mb-0.5">
                {selectedProduct.vendorName}
              </span>
              <h3 className="font-heading font-bold text-xl text-[#18181B]">
                {selectedProduct.name}
              </h3>
              <p className="font-body font-extrabold text-xl text-[#312E81] mt-1">
                ₦{selectedProduct.price.toLocaleString()}
              </p>
              <p className="text-sm text-[#71717A] font-body font-normal mt-2 leading-relaxed">
                {selectedProduct.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm font-body font-medium text-[#18181B]">Quantity</span>
              <div className="flex items-center gap-3 bg-[#F4F3FF] rounded-full p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-[#18181B] shadow-sm font-bold active:scale-95"
                >
                  <Minus size={14} />
                </button>
                <span className="font-body font-bold text-sm w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-[#312E81] text-white rounded-full shadow-sm font-bold active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Main Add to Cart Button: Deep Indigo background + white text */}
            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  handleAddProduct(selectedProduct.id);
                }
                setSelectedProduct(null);
              }}
              disabled={!selectedProduct.isAvailable}
              className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-body font-semibold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-colors disabled:opacity-50"
            >
              <ShoppingBag size={18} />
              Add {quantity} to Cart • ₦{(selectedProduct.price * quantity).toLocaleString()}
            </button>
          </div>
        )}
      </Modal>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal 
        isOpen={!!pendingProduct} 
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] text-sm mb-6 leading-relaxed font-body font-normal">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and start a new order from <strong>{pendingProduct?.vendorName}</strong>?
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
