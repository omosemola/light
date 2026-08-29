"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Star, 
  Store, 
  Clock, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Phone, 
  Search, 
  CheckCircle2, 
  Award,
  Share2,
  Bike
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { useUserStore } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { Modal } from "@/components/ui/Modal";
import { getLiveStoreById } from "@/actions/marketplace";
import { ProductCustomizerModal, CustomizerProduct } from "@/components/ui/ProductCustomizerModal";
import { parseProductImages, getSafeImageUrl } from "@/lib/productOptions";
import { formatReviewDate } from "@/lib/formatDate";
import { getStoreScheduleStatus, computeIsStoreOpen } from "@/lib/storeSchedule";

interface VendorStoreClientProps {
  initialStore?: any;
  id: string;
}

export default function VendorStoreClient({ initialStore, id }: VendorStoreClientProps) {
  const router = useRouter();
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const { profile } = useUserStore();

  const formatStoreData = (dbStore: any) => {
    if (!dbStore) return null;
    const avatarImg = dbStore.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80";
    const coverImg = dbStore.coverImage || avatarImg;
    const hasCustomCover = Boolean(dbStore.coverImage && dbStore.coverImage !== dbStore.logo);

    return {
      id: dbStore.id,
      name: dbStore.name,
      category: "Campus Verified Store",
      rating: dbStore.rating || 5.0,
      reviewsCount: dbStore._count?.reviews || dbStore.reviews?.length || 0,
      location: "University Campus",
      prepTime: dbStore.estimatedDelivery || "15-25 mins",
      deliveryFee: dbStore.deliveryFee !== undefined ? dbStore.deliveryFee : 500,
      isOpen: dbStore.isOpen !== false,
      openingTime: dbStore.openingTime || "08:00",
      closingTime: dbStore.closingTime || "22:00",
      isVerified: dbStore.isVerified !== false,
      avatar: avatarImg,
      coverImage: coverImg,
      hasCustomCover,
      description: dbStore.description || `Welcome to ${dbStore.name} on campus. Order fresh food & campus items delivered fast.`,
      phone: dbStore.phone || dbStore.user?.phone || "",
      ordersCount: dbStore._count?.orders || 12,
      products: dbStore.products && dbStore.products.length > 0
        ? dbStore.products.map((p: any) => {
            const parsed = parseProductImages(p.image);
            return {
              id: p.id,
              slug: p.slug || p.id,
              name: p.name,
              price: p.price,
              image: parsed[0] || p.image,
              rawImage: p.image,
              description: p.description || "",
              isAvailable: p.isAvailable !== false,
              rating: 4.9,
              vendorId: dbStore.id,
              vendorName: dbStore.name,
              vendorDeliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined ? p.deliveryFee : (dbStore.deliveryFee !== undefined ? dbStore.deliveryFee : 500),
              vendorEstimatedDelivery: p.estimatedDelivery || dbStore.estimatedDelivery || "15-25 mins",
              itemDeliveryFee: p.deliveryFee,
              itemEstimatedDelivery: p.estimatedDelivery,
              category: p.category?.name || "Items",
            };
          })
        : [],
      reviews: dbStore.reviews && dbStore.reviews.length > 0
        ? dbStore.reviews.map((r: any) => ({
            id: r.id,
            author: r.user?.name || "Campus Student",
            avatar: r.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            hostel: r.user?.hostel || "Student Hostel",
            rating: r.rating || 5,
            date: formatReviewDate(r.createdAt),
            comment: r.comment || "",
          }))
        : [],
    };
  };

  const [vendor, setVendor] = useState<any>(() => formatStoreData(initialStore));
  const [loading, setLoading] = useState(!initialStore);

  useEffect(() => {
    if (initialStore) {
      setVendor(formatStoreData(initialStore));
      setLoading(false);
    }
  }, [initialStore]);

  useEffect(() => {
    let active = true;
    async function refreshStore() {
      try {
        const res = await getLiveStoreById(id);
        if (active && res.success && res.store) {
          setVendor(formatStoreData(res.store));
        }
      } catch (err) {
        console.error("Error refreshing live store:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!initialStore) {
      refreshStore();
    }
    return () => {
      active = false;
    };
  }, [id, initialStore]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const { isStoreFavorite, toggleStoreFavorite } = useFavoritesStore();
  const isFavorite = vendor ? isStoreFavorite(vendor.id) : false;
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [customizerProduct, setCustomizerProduct] = useState<CustomizerProduct | null>(null);

  const toggleFavorite = () => {
    if (!vendor) return;
    toggleStoreFavorite(
      {
        id: vendor.id,
        name: vendor.name,
        logo: vendor.avatar,
        coverImage: vendor.avatar,
        rating: vendor.rating,
        estimatedDelivery: vendor.prepTime,
        isOpen: vendor.isOpen,
      },
      profile?.email
    );
  };

  const categories: string[] = vendor 
    ? ["All", ...Array.from(new Set<string>((vendor.products || []).map((p: any) => String(p.category || "Items"))))]
    : ["All"];

  const filteredProducts = (vendor?.products || []).filter((p: any) => {
    const matchesCat = selectedCat === "All" || p.category === selectedCat;
    const matchesQuery = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleOpenCustomizer = (productId: string) => {
    const product = (vendor?.products || []).find((p: any) => p.id === productId);
    if (!product) return;

    setCustomizerProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      storeId: vendor.id,
      storeName: vendor.name,
      isAvailable: product.isAvailable,
    });
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart(pendingProduct.item, pendingProduct.quantity);
      setPendingProduct(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] items-center justify-center p-6 text-center">
        <div className="flex items-center gap-1.5 py-12">
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <Store size={32} />
        </div>
        <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
          Store Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
          This merchant store may be deactivated or still pending verification.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-xl bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

    const safeAvatar = getSafeImageUrl(vendor.avatar);
    const safeBanner = getSafeImageUrl(vendor.coverImage || vendor.avatar);

    return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* VENDOR HERO BANNER (LIVE EDITED COVER BANNER OR AMBIENT BLUR) */}
      <div className="relative w-full h-56 md:h-72 bg-[#1E1B4B] overflow-hidden">
        <Image
          src={safeBanner}
          alt={`${vendor.name} Banner`}
          fill
          priority
          unoptimized={safeBanner.startsWith("data:")}
          className={`object-cover transition-all duration-500 ${
            vendor.hasCustomCover
              ? "object-center opacity-90 dark:opacity-80"
              : "scale-125 blur-2xl opacity-60 dark:opacity-40"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF7] dark:from-[#09090B] via-black/40 to-black/30" />

        {/* Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-900/90 text-[#18181B] dark:text-zinc-100 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
                isFavorite ? "bg-red-500 text-white" : "bg-white/90 dark:bg-zinc-900/90 text-[#18181B] dark:text-zinc-100"
              }`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
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
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              {/* CRISP SHARP MERCHANT DISPLAY PICTURE AVATAR */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-white dark:border-zinc-700 overflow-hidden shrink-0 shadow-lg bg-white dark:bg-zinc-800">
                <Image 
                  src={safeAvatar} 
                  alt={vendor.name} 
                  fill 
                  priority
                  unoptimized={safeAvatar.startsWith("data:")} 
                  className="object-cover" 
                />
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

            {vendor.phone && (
              <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-[#F4F3FF] dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[#312E81] dark:text-indigo-300 font-heading font-bold text-xs rounded-2xl border border-indigo-100 dark:border-indigo-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone size={15} /> Call Shop
                </a>
              </div>
            )}

          </div>

          <p className="text-xs md:text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-zinc-800">
            {vendor.description}
          </p>

          {/* Quick Stats Badges with Auto Hours */}
          {(() => {
            const sched = getStoreScheduleStatus(vendor);
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Delivery Timeline</span>
                    <span className="font-heading font-extrabold text-xs md:text-sm text-[#18181B] dark:text-zinc-100 flex items-center justify-center gap-1 mt-0.5">
                      <Clock size={14} className="text-[#312E81] dark:text-indigo-400" /> {vendor.prepTime}
                    </span>
                  </div>

                  <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Store Delivery Fee</span>
                    <span className="font-heading font-extrabold text-xs md:text-sm text-[#18181B] dark:text-zinc-100 flex items-center justify-center gap-1 mt-0.5">
                      <Bike size={14} className="text-amber-500" /> {Number(vendor.deliveryFee) === 0 ? "Free Delivery" : `₦${Number(vendor.deliveryFee).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Operating Hours</span>
                    <span className="font-heading font-extrabold text-[11px] md:text-xs text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1 mt-0.5">
                      {sched.scheduleText}
                    </span>
                  </div>

                  <div className="bg-[#FAFAF7] dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold block">Status</span>
                    <span className={`font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-1 mt-0.5 ${sched.isOpenNow ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      <CheckCircle2 size={14} /> {sched.isOpenNow ? "Open Now" : "Closed"}
                    </span>
                  </div>
                </div>

                {!sched.isOpenNow && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <Clock size={18} className="shrink-0 text-amber-600" />
                    <div>
                      <strong className="font-bold block">Store Currently Closed</strong>
                      <span>Daily operating hours are <strong>{sched.scheduleText}</strong>. Orders placed will be queued for preparation once the store opens.</span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
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
                className={`px-4 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all cursor-pointer ${
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
            <Store size={18} className="text-[#312E81] dark:text-indigo-400" /> Available Products ({filteredProducts.length})
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6">
              <p className="font-heading font-bold text-sm text-[#71717A] dark:text-zinc-400">No items match your search.</p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts.map((p: any) => ({ ...p, vendorId: vendor.id, vendorName: vendor.name }))}
              onAddProduct={handleOpenCustomizer}
            />
          )}
        </div>

        {/* STUDENT REVIEWS & RATINGS SECTION WITH ACCURATE TIMESTAMPS */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Student Reviews & Ratings ({vendor.rating} ★)
            </h3>
            <span className="text-xs font-semibold text-[#71717A] dark:text-zinc-400">Verified Campus Orders</span>
          </div>

          <div className="space-y-3">
            {vendor.reviews && vendor.reviews.length > 0 ? (
              vendor.reviews.map((rev: any) => {
                const authorInitial = (rev.author || "S").charAt(0).toUpperCase();
                const authorName = rev.author || "Verified Student";
                const reviewDate = rev.date || "Recently";

                return (
                  <div key={rev.id} className="p-3.5 bg-[#FAFAF7] dark:bg-zinc-800/60 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#312E81] dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                          {authorInitial}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#18181B] dark:text-zinc-100 block">{authorName}</span>
                          <span className="text-[10px] text-[#71717A] dark:text-zinc-400">{rev.hostel || "Student Hostel"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: Math.min(5, Math.max(1, rev.rating || 5)) }).map((_, i) => (
                          <Star key={i} size={12} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-[#71717A] dark:text-zinc-300 font-medium pl-9">&ldquo;{rev.comment}&rdquo;</p>
                    )}
                    <span className="text-[10px] text-[#A1A1AA] dark:text-zinc-500 block pl-9 font-medium">{reviewDate}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-[#71717A] dark:text-zinc-400">
                No reviews yet for this vendor. Be the first to leave a review!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PRODUCT CUSTOMIZATION MODAL (PORTIONS, EXTRAS, SPECIAL NOTES) */}
      <ProductCustomizerModal
        isOpen={!!customizerProduct}
        product={customizerProduct}
        onClose={() => setCustomizerProduct(null)}
        onVendorConflict={(item, quantity) => setPendingProduct({ item, quantity })}
      />

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
              className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 font-heading font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceCart}
              className="flex-1 py-2.5 bg-[#312E81] dark:bg-indigo-600 text-white font-heading font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Yes, Replace Cart
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
