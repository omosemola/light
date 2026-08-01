"use client";

import { useState } from "react";
import { Search, Flame, Sparkles, Clock, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

// SOLID COLORS CATEGORIES DATA
const CATEGORIES = [
  { name: "Food", slug: "food", icon: "🍔", bg: "bg-orange-500 text-white" },
  { name: "Snacks", slug: "snacks", icon: "🍿", bg: "bg-pink-500 text-white" },
  { name: "Drinks", slug: "drinks", icon: "🥤", bg: "bg-blue-500 text-white" },
  { name: "Groceries", slug: "groceries", icon: "🛒", bg: "bg-emerald-500 text-white" },
  { name: "Pastries", slug: "pastries", icon: "🥐", bg: "bg-amber-600 text-white" },
  { name: "Stationery", slug: "stationery", icon: "✏️", bg: "bg-purple-500 text-white" },
  { name: "Care", slug: "care", icon: "🧴", bg: "bg-indigo-600 text-white" },
];

const POPULAR_PRODUCTS = [
  {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "Authentic Nigerian party Jollof rice served with crispy fried plantain and a piece of grilled chicken leg.",
    isAvailable: true,
  },
  {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "100% natural, freshly squeezed orange juice with no added sugar or preservatives.",
    isAvailable: true,
  },
  {
    id: "p3",
    name: "A4 Note Book 60 Leaves (Pack of 5)",
    price: 2500,
    vendorId: "v3",
    vendorName: "Campus Books",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "High quality 60-leaf ruled exercise notebooks for campus lectures.",
    isAvailable: false,
  },
  {
    id: "p4",
    name: "Spicy Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
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
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* SOLID HERO HEADER */}
      <section className="bg-slate-900 text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-400 text-slate-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> Campus Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight">
                Hey Alex! 👋
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium mt-0.5">
                What are we ordering today?
              </p>
            </div>
            
            <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-md">
              <Image
                src="https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
                alt="Profile"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
          </div>

          {/* Search Bar */}
          <Link href="/search" className="block relative w-full group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={22} />
            </div>
            <div className="w-full h-14 pl-12 pr-4 flex items-center rounded-2xl bg-white text-slate-500 font-medium text-sm md:text-base border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
              Search meals, snacks, stationery...
            </div>
          </Link>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full -mt-4 z-20 space-y-8 pb-12">
        
        {/* SOLID BENTO PROMOTIONAL GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main Card */}
          <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-md min-h-[190px]">
            <div>
              <span className="bg-amber-400 text-slate-900 px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                <Flame size={14} className="fill-slate-900" /> Hot Deal
              </span>
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight mt-3">
                20% OFF All Pastries & Bakery 🥐
              </h2>
              <p className="text-indigo-100 text-xs md:text-sm font-medium mt-1">Use code CAMPUS20 at checkout</p>
            </div>
            
            <div className="mt-4">
              <Link href="/category/pastries" className="inline-flex items-center gap-2 bg-white text-indigo-900 font-bold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-sm hover:bg-slate-100 active:scale-95 transition-all">
                Order Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Side Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            
            <div className="bg-amber-500 rounded-3xl p-4 text-slate-900 flex flex-col justify-between shadow-sm">
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit uppercase">
                New Vendor
              </span>
              <div className="mt-2">
                <h3 className="font-heading font-extrabold text-base leading-tight">Tasty Treats</h3>
                <p className="text-xs text-slate-800 font-medium">Fresh Smoothies & Shakes</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                  <Clock size={14} className="text-indigo-600" /> Avg. Time
                </div>
                <p className="font-heading font-extrabold text-lg text-slate-900 mt-0.5">15-20 Mins</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Fast Campus Riders
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* SOLID CATEGORIES */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900">
              Explore Categories
            </h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center justify-center min-w-[85px] min-h-[95px] bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 active:scale-95 hover:border-indigo-500 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-2xl shadow-sm mb-1.5`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-slate-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* POPULAR NEAR YOU */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900">
                Popular Near You
              </h2>
              <p className="text-xs text-slate-500 font-medium">Click on any product to view details</p>
            </div>
            <Link 
              href="/search" 
              className="text-xs md:text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
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
          <div className="space-y-4">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100">
              <Image 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                fill 
                className="object-cover" 
              />
            </div>

            <div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                {selectedProduct.name}
              </h3>
              <p className="font-body font-extrabold text-lg text-indigo-600 mt-1">
                ₦{selectedProduct.price.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {selectedProduct.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-700">Quantity</span>
              <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-sm font-bold active:scale-95"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-sm font-bold active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  handleAddProduct(selectedProduct.id);
                }
                setSelectedProduct(null);
              }}
              disabled={!selectedProduct.isAvailable}
              className="w-full h-13 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-colors disabled:opacity-50"
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
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and start a new order from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleReplaceCart}
            className="w-full h-12 bg-slate-900 text-white font-bold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button 
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-slate-100 text-slate-700 font-bold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>
    </div>
  );
}
