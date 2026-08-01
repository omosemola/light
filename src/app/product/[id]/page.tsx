"use client";

import { useState, use } from "react";
import { ArrowLeft, Star, Clock, Heart, Minus, Plus, ShoppingBag, Store, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductGrid } from "@/components/ui/ProductGrid";

// MOCK PRODUCTS DATABASE FOR DYNAMIC PRODUCT PAGES
const ALL_PRODUCTS: Record<string, {
  id: string;
  name: string;
  price: number;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  image: string;
  description: string;
  details: string[];
  prepTime: string;
  isAvailable: boolean;
  category: string;
  rating: number;
  reviewsCount: number;
}> = {
  p1: {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg. Prepared fresh daily with premium spice blend.",
    details: ["Includes 1x Jumbo Chicken Leg", "4x Fried Plantain Slices", "Option for Extra Pepper Sauce", "Halal Certified"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 128,
  },
  p2: {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    description: "100% natural, freshly squeezed orange juice with no added sugar, artificial flavors, or water dilution. Rich in Vitamin C.",
    details: ["100% Pure Fresh Fruit", "No Added Sugar", "Chilled Packaging", "Keep Refrigerated"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.8,
    reviewsCount: 94,
  },
  p3: {
    id: "p3",
    name: "A4 Note Book 60 Leaves (Pack of 5)",
    price: 2500,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description: "High quality 60-leaf ruled exercise notebooks designed for lecture notes, assignments, and exam revisions.",
    details: ["Pack of 5 Exercise Books", "70gsm Paper", "Sturdy Paperboard Covers", "Standard Ruled Margin"],
    prepTime: "10 mins",
    isAvailable: false,
    category: "stationery",
    rating: 4.7,
    reviewsCount: 42,
  },
  p4: {
    id: "p4",
    name: "Spicy Beef Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked handcrafted pizza topped with fiery beef suya chunks, caramelized onions, green peppers, and melted mozzarella.",
    details: ["Medium 10-inch Diameter", "Suya Spice Crust", "100% Real Mozzarella", "Hot & Crispy"],
    prepTime: "25-30 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 215,
  },
  f1: {
    id: "f1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
    details: ["Includes 1x Jumbo Chicken Leg", "4x Fried Plantain Slices", "Option for Extra Pepper Sauce"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 128,
  },
  f2: {
    id: "f2",
    name: "Spicy Beef Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
    details: ["Medium 10-inch", "Real Mozzarella", "Freshly Baked"],
    prepTime: "25 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 215,
  },
  f3: {
    id: "f3",
    name: "Fried Rice Special with Turkey",
    price: 4200,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Seasoned fried rice cooked with mixed vegetables and served with seasoned fried turkey.",
    details: ["Seasoned Fried Turkey", "Sweet Corn & Green Peas", "Moyin Moyin Option"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.8,
    reviewsCount: 76,
  },
  f4: {
    id: "f4",
    name: "Crispy Chicken Burger & Chips",
    price: 3800,
    vendorId: "v5",
    vendorName: "Campus Bites",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
    details: ["Double Crispy Fillet", "Golden Salted Fries", "Special Sauce"],
    prepTime: "15 mins",
    isAvailable: true,
    category: "food",
    rating: 4.7,
    reviewsCount: 88,
  },
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const product = ALL_PRODUCTS[id] || ALL_PRODUCTS.p1;
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const handleAddToCart = () => {
    let requiresConf = false;
    for (let i = 0; i < quantity; i++) {
      const result = addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
      });

      if (result.requiresConfirmation) {
        requiresConf = true;
        break;
      }
    }

    if (requiresConf) {
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

  const relatedProducts = Object.values(ALL_PRODUCTS).filter(
    (p) => p.vendorId === product.vendorId && p.id !== product.id
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-36">
      
      {/* PRODUCT HERO IMAGE WITH BACK BUTTON & FAVORITE HEART */}
      <div className="relative w-full aspect-square md:aspect-[21/9] max-h-[460px] bg-slate-900 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

        {/* Floating Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
              isLiked ? "bg-red-500 text-white" : "bg-white/90 hover:bg-white text-slate-700"
            }`}
          >
            <Heart size={20} className={isLiked ? "fill-white" : ""} />
          </button>
        </div>

        {/* Stock status overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white font-heading font-extrabold text-sm px-4 py-2 rounded-full shadow-lg border border-red-400 uppercase tracking-wider">
              Currently Sold Out
            </span>
          </div>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full -mt-8 relative z-20 space-y-6">
        
        {/* MAIN PRODUCT HEADER CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80 space-y-4">
          
          {/* Vendor Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100">
              <Store size={14} className="text-indigo-600" />
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                {product.vendorName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-extrabold text-slate-800">{product.rating}</span>
              <span className="text-[11px] font-medium text-slate-500">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-body font-extrabold text-slate-900">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                In Stock & Ready
              </span>
            </div>
          </div>

          {/* Prep Time & Delivery Info */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-bold">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-indigo-600" />
              <span>Prep Time: {product.prepTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Campus Rider Verified</span>
            </div>
          </div>

        </div>

        {/* DESCRIPTION CARD */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
          <h3 className="font-heading font-extrabold text-lg text-slate-900">
            About this item
          </h3>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            {product.description}
          </p>

          {/* Key Details List */}
          {product.details && product.details.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                What&apos;s Included / Features
              </h4>
              <ul className="space-y-2">
                {product.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RELATED PRODUCTS FROM VENDOR */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-heading font-extrabold text-xl text-slate-900">
              More from {product.vendorName}
            </h3>
            <ProductGrid
              products={relatedProducts}
              onAddProduct={(id) => {
                const item = relatedProducts.find((p) => p.id === id);
                if (item) {
                  addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    vendorId: item.vendorId,
                    vendorName: item.vendorName,
                  });
                }
              }}
            />
          </div>
        )}

      </div>

      {/* STICKY BOTTOM BAR FOR PURCHASING */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Quantity Selector */}
          <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1.5 border border-slate-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-sm font-bold active:scale-95 transition-transform"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="font-heading font-extrabold text-base w-8 text-center text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-sm font-bold active:scale-95 transition-transform"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="flex-1 h-14 bg-slate-900 hover:bg-indigo-600 text-white font-heading font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 text-base"
          >
            <ShoppingBag size={20} />
            <span>Add {quantity} to Cart • ₦{(product.price * quantity).toLocaleString()}</span>
          </button>

        </div>
      </div>

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
