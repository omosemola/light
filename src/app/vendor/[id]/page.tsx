"use client";

import { use, useState } from "react";
import { 
  ArrowLeft, 
  Star, 
  Store, 
  Clock, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  Share2, 
  Award,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { Modal } from "@/components/ui/Modal";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";

// MOCK VENDORS DATABASE
const VENDORS_DATA: Record<string, {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  location: string;
  prepTime: string;
  isOpen: boolean;
  avatar: string;
  coverImage: string;
  description: string;
  phone: string;
  ordersCount: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    isAvailable: boolean;
    rating: number;
    category: string;
  }>;
  reviews: Array<{
    id: string;
    author: string;
    avatar: string;
    rating: number;
    date: string;
    comment: string;
  }>;
}> = {
  v1: {
    id: "v1",
    name: "Mama Cass",
    category: "Nigerian Food & Grills",
    rating: 4.9,
    reviewsCount: 128,
    location: "Kafanchan Lodge, Mellanby Gate",
    prepTime: "15-20 mins",
    isOpen: true,
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Serving piping hot Nigerian party Jollof, fried plantains, crispy peppered chicken, and swallows prepared fresh daily.",
    phone: "+234 812 345 9900",
    ordersCount: 1420,
    products: [
      {
        id: "p1",
        name: "Jollof Rice with Chicken & Plantain",
        price: 3500,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
        description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
        isAvailable: true,
        rating: 4.9,
        category: "Meals",
      },
      {
        id: "p1_2",
        name: "Fried Rice Combo with Grilled Turkey",
        price: 4200,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
        description: "Seasoned vegetable fried rice served with succulent grilled turkey wing and coleslaw.",
        isAvailable: true,
        rating: 4.8,
        category: "Meals",
      },
      {
        id: "p1_3",
        name: "Peppered Chicken Drumsticks (3 pcs)",
        price: 2800,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
        description: "Tender chicken drumsticks tossed in hot spicy ATA din din sauce.",
        isAvailable: true,
        rating: 5.0,
        category: "Sides & Grills",
      },
    ],
    reviews: [
      {
        id: "vr1",
        author: "David O.",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        date: "2 hours ago",
        comment: "Portion size was huge! The chicken leg was properly grilled and peppered.",
      },
      {
        id: "vr2",
        author: "Blessing A.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        date: "Yesterday",
        comment: "Hot Jollof rice right after GST lecture is pure bliss. Packaging was super clean!",
      },
    ],
  },
  v2: {
    id: "v2",
    name: "Fresh Squeeze",
    category: "Fresh Juices & Smoothies",
    rating: 4.8,
    reviewsCount: 94,
    location: "SUB Arcade, Shop 14",
    prepTime: "5 mins",
    isOpen: true,
    avatar: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=1200&q=80",
    description: "100% pure cold-pressed fruit juices and energizing smoothie blends with no added sugar or preservatives.",
    phone: "+234 803 111 2233",
    ordersCount: 980,
    products: [
      {
        id: "p2",
        name: "Cold Pressed Orange Juice 50cl",
        price: 1200,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
        description: "100% natural, freshly squeezed orange juice with no added sugar.",
        isAvailable: true,
        rating: 4.8,
        category: "Juices",
      },
      {
        id: "p2_2",
        name: "Tropical Pineapple Mango Smoothie",
        price: 1800,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
        description: "Creamy blend of ripe mango, fresh pineapple, banana, and Greek yogurt.",
        isAvailable: true,
        rating: 4.9,
        category: "Smoothies",
      },
    ],
    reviews: [
      {
        id: "vr3",
        author: "Chidimma N.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        date: "Yesterday",
        comment: "Extremely refreshing juice! No sugar added, pure orange pulp.",
      },
    ],
  },
  v3: {
    id: "v3",
    name: "Campus Books",
    category: "Stationery & Academics",
    rating: 4.7,
    reviewsCount: 42,
    location: "KDL Library Annex, Shop 3",
    prepTime: "10 mins",
    isOpen: false,
    avatar: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    description: "Official campus notebooks, highlighters, GST textbooks, printing paper, and exam revision essentials.",
    phone: "+234 818 444 5566",
    ordersCount: 410,
    products: [
      {
        id: "p3",
        name: "A4 Note Book 60 Leaves (Pack of 5)",
        price: 2500,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        description: "High quality 60-leaf ruled exercise notebooks for campus lectures.",
        isAvailable: false,
        rating: 4.7,
        category: "Notebooks",
      },
    ],
    reviews: [],
  },
  v4: {
    id: "v4",
    name: "Pizza Hub",
    category: "Fast Food & Pizzas",
    rating: 4.9,
    reviewsCount: 215,
    location: "Tedder Hall Square",
    prepTime: "25-30 mins",
    isOpen: true,
    avatar: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
    description: "Freshly hand-tossed pizzas topped with beef suya, double mozzarella cheese, and signature fiery spices.",
    phone: "+234 809 777 8899",
    ordersCount: 2100,
    products: [
      {
        id: "p4",
        name: "Spicy Beef Suya Pizza - Medium",
        price: 6500,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
        isAvailable: true,
        rating: 4.9,
        category: "Pizza",
      },
    ],
    reviews: [],
  },
};

export default function VendorStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const { profile, updateProfile } = useUserStore();

  const vendor = VENDORS_DATA[id] || {
    id: id,
    name: "Campus Vendor",
    category: "Campus Marketplace Merchant",
    rating: 4.8,
    reviewsCount: 50,
    location: "Main Campus Center",
    prepTime: "15 mins",
    isOpen: true,
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Quality goods and fast delivery to all student hostels.",
    phone: "+234 800 000 0000",
    ordersCount: 500,
    products: VENDORS_DATA.v1.products,
    reviews: VENDORS_DATA.v1.reviews,
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [isFavorite, setIsFavorite] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    updateProfile({
      savedStoresCount: Math.max(0, profile.savedStoresCount + (next ? 1 : -1)),
    });
  };

  const categories = ["All", ...Array.from(new Set(vendor.products.map((p) => p.category)))];

  const filteredProducts = vendor.products.filter((p) => {
    const matchesCat = selectedCat === "All" || p.category === selectedCat;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAddProduct = (productId: string) => {
    const product = vendor.products.find((p) => p.id === productId);
    if (!product) return;

    const result = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendorId: vendor.id,
      vendorName: vendor.name,
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
        vendorId: vendor.id,
        vendorName: vendor.name,
      });
      setPendingProduct(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* COVER IMAGE & TOP NAV */}
      <div className="relative w-full h-56 md:h-72 bg-slate-900 overflow-hidden">
        <Image
          src={vendor.coverImage}
          alt={vendor.name}
          fill
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-transparent to-[#18181B]/40" />

        {/* Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-900/90 text-[#18181B] dark:text-zinc-100 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
                isFavorite ? "bg-red-500 text-white" : "bg-white/90 dark:bg-zinc-900/90 text-[#18181B] dark:text-zinc-100"
              }`}
            >
              <Heart size={20} className={isFavorite ? "fill-white" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* VENDOR HEADER PROFILE CARD */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full -mt-16 relative z-20 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-indigo-100 dark:border-zinc-700 overflow-hidden shrink-0 shadow-md">
                <Image src={vendor.avatar} alt={vendor.name} fill className="object-cover" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#18181B] dark:text-zinc-100 tracking-tight">
                    {vendor.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck size={13} /> Verified Merchant
                  </span>
                </div>

                <p className="text-xs md:text-sm font-medium text-[#71717A] dark:text-zinc-400">
                  {vendor.category}
                </p>

                <div className="flex items-center gap-3 text-xs font-semibold text-[#71717A] dark:text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={14} className="fill-amber-400" /> {vendor.rating} ({vendor.reviewsCount} reviews)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-[#312E81] dark:text-indigo-400" /> {vendor.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
              <a
                href={`tel:${vendor.phone}`}
                className="flex-1 md:flex-none px-4 py-2.5 bg-[#F4F3FF] dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-2xl border border-indigo-100 dark:border-indigo-800 transition-all flex items-center justify-center gap-2"
              >
                <Phone size={15} /> Call Shop
              </a>
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={15} /> Chat Merchant
              </button>
            </div>

          </div>

          <p className="text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-zinc-800">
            {vendor.description}
          </p>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Prep Time</span>
              <span className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 flex items-center justify-center gap-1 mt-0.5">
                <Clock size={14} className="text-[#312E81] dark:text-indigo-400" /> {vendor.prepTime}
              </span>
            </div>

            <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Status</span>
              <span className={`font-heading font-extrabold text-sm flex items-center justify-center gap-1 mt-0.5 ${vendor.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                <CheckCircle2 size={14} /> {vendor.isOpen ? "Open Now" : "Closed"}
              </span>
            </div>

            <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
              <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Orders Fulfilled</span>
              <span className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100 flex items-center justify-center gap-1 mt-0.5">
                <Award size={14} className="text-amber-500" /> {vendor.ordersCount}+
              </span>
            </div>
          </div>
        </motion.div>

        {/* IN-STORE SEARCH & CATEGORY FILTER */}
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search items in ${vendor.name}...`}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#312E81] dark:focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                  selectedCat === cat
                    ? "bg-[#312E81] dark:bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-[#71717A] dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="space-y-4">
          <h2 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={18} className="text-[#312E81] dark:text-indigo-400" /> Available Products ({filteredProducts.length})
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6">
              <p className="font-heading font-bold text-sm text-[#71717A] dark:text-zinc-400">No items match your search.</p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts.map((p) => ({ ...p, vendorId: vendor.id, vendorName: vendor.name }))}
              onAddProduct={handleAddProduct}
            />
          )}
        </div>

      </div>

      {/* CART CONFLICT CONFIRMATION MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Start new order?"
      >
        <div className="space-y-4 font-body text-[#18181B] dark:text-zinc-100">
          <p className="text-xs text-[#71717A] dark:text-zinc-300 leading-relaxed">
            Your cart contains items from a different vendor. Would you like to clear your cart and add items from <strong>{vendor.name}</strong> instead?
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setPendingProduct(null)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 font-heading font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceCart}
              className="flex-1 py-2.5 bg-[#312E81] dark:bg-indigo-600 text-white font-heading font-bold text-xs rounded-xl shadow-md"
            >
              Yes, Replace Cart
            </button>
          </div>
        </div>
      </Modal>

      {/* MERCHANT CHAT MODAL DRAWER */}
      <MerchantChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        vendor={{
          id: vendor.id,
          name: vendor.name,
          avatar: vendor.avatar,
          phone: vendor.phone,
          category: vendor.category,
        }}
      />

    </div>
  );
}
