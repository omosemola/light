"use client";

import { useState, use, useEffect } from "react";
import { ArrowLeft, Star, Clock, Heart, Plus, Store, CheckCircle2, MessageSquare, ThumbsUp, Send, ChevronLeft, ChevronRight, Quote, Info, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { getLiveProductById } from "@/actions/marketplace";
import { useReviewsStore, ProductReview } from "@/lib/reviewsStore";
import { useUserStore, DEFAULT_VISITOR_CARTOON_AVATAR } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { submitStudentReview } from "@/actions/reviews";

interface Review {
  id: string;
  author: string;
  avatar: string;
  hostel: string;
  rating: number;
  date: string;
  comment: string;
  likes: number;
  isLiked?: boolean;
}



// MOCK PRODUCTS DATABASE (MAMA CASS ONLY)
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
    vendorId: "cmst41xau0002tb705xlithpk",
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
  p1_2: {
    id: "p1_2",
    name: "Fried Rice Combo with Grilled Turkey",
    price: 4200,
    vendorId: "cmst41xau0002tb705xlithpk",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Seasoned vegetable fried rice served with succulent grilled turkey wing, mixed vegetables, and fresh coleslaw.",
    details: ["Includes 1x Fried Turkey Wing", "Mixed Veggies", "Coleslaw Portion"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.8,
    reviewsCount: 76,
  },
};

// Aliases for IDs
ALL_PRODUCTS.f1 = ALL_PRODUCTS.p1;
ALL_PRODUCTS.f3 = ALL_PRODUCTS.p1_2;

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile } = useUserStore();
  const { reviewsByProduct, addProductReview, toggleLikeReview } = useReviewsStore();
  const { isProductFavorite, toggleProductFavorite } = useFavoritesStore();

  const defaultProduct = ALL_PRODUCTS[id] || ALL_PRODUCTS.p1;
  const [product, setProduct] = useState(defaultProduct);
  const [quantity, setQuantity] = useState(1);
  const isLiked = isProductFavorite(product.id) || isProductFavorite(id);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // SYNCHRONIZED PER-PRODUCT REVIEWS
  const reviewsList = reviewsByProduct[product.id] || reviewsByProduct[id] || [];
  const averageRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length).toFixed(1)
    : "0.0";

  useEffect(() => {
    let active = true;
    async function loadLiveProduct() {
      try {
        const res = await getLiveProductById(id);
        if (active && res.success && res.product) {
          const p = res.product;
          setProduct({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image || defaultProduct.image,
            description: p.description || defaultProduct.description,
            vendorId: p.storeId,
            vendorName: p.store?.name || defaultProduct.vendorName,
            vendorRating: p.store?.rating || 4.9,
            details: defaultProduct.details || ["Freshly prepared on campus", "Fast delivery to all student hostels"],
            prepTime: p.store?.estimatedDelivery || "15-20 mins",
            isAvailable: p.isAvailable,
            category: p.category?.name?.toLowerCase() || "food",
            rating: p.store?.rating || 4.9,
            reviewsCount: p.store?.reviews?.length || 0,
          });
        }
      } catch (err) {
        console.error("Error loading live product:", err);
      }
    }

    loadLiveProduct();
    return () => {
      active = false;
    };
  }, [id]);

  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

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

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorName = profile.name && profile.name !== "Visitor" ? profile.name : "Alex John";
    const isVisitor = profile.isVisitor || profile.name === "Visitor" || profile.email === "visitor@light.app" || !profile.email;
    const authorAvatar = isVisitor
      ? DEFAULT_VISITOR_CARTOON_AVATAR
      : (profile.avatar && profile.avatar !== "/visitor-avatar.png" ? profile.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
    const authorHostel = profile.hostel && profile.hostel.trim() && profile.hostel !== "Campus Guest" ? profile.hostel : "Campus Student";

    addProductReview(product.id, {
      author: authorName,
      avatar: authorAvatar,
      hostel: authorHostel,
      rating: newRating,
      comment: newComment.trim(),
    });

    if (product.vendorId) {
      submitStudentReview({
        storeId: product.vendorId,
        userEmail: profile.email || "student@campuslightson.com",
        userName: authorName,
        rating: newRating,
        comment: newComment.trim(),
      }).catch((err) => console.error("Database review submission error:", err));
    }

    setActiveReviewIndex(0); // Jump to newly added review
    setNewComment("");
    setReviewSuccessMsg(true);
    setTimeout(() => {
      setReviewSuccessMsg(false);
      setIsWriteReviewOpen(false);
    }, 1400);
  };

  const handleLikeReview = (reviewId: string) => {
    toggleLikeReview(product.id, reviewId);
  };

  const currentReview = reviewsList[activeReviewIndex] || reviewsList[0];

  const handleNextReview = () => {
    setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length);
  };

  const handlePrevReview = () => {
    setActiveReviewIndex((prev) => (prev - 1 + reviewsList.length) % reviewsList.length);
  };

  const rawRelated = Object.values(ALL_PRODUCTS).filter(
    (p) => p.vendorId === product.vendorId && p.id !== product.id
  );
  const relatedProducts = Array.from(
    new Map(rawRelated.map((p) => [p.id, p])).values()
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* HERO PRODUCT IMAGE WITH FULL HEIGHT & ANIMATION */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-square md:aspect-[21/9] max-h-[460px] bg-slate-900 overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/80 via-transparent to-[#18181B]/40" />

        {/* Floating Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-[#18181B] dark:text-zinc-100 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => {
              toggleProductFavorite(
                {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  vendorName: product.vendorName,
                  rating: typeof product.rating === "number" ? product.rating : 4.8,
                  category: product.category,
                },
                profile?.email
              );
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
              isLiked ? "bg-red-500 text-white" : "bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-[#18181B] dark:text-zinc-100"
            }`}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            title={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={20} className={isLiked ? "fill-white" : ""} />
          </button>
        </div>

        {/* Stock status overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-[#18181B]/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white font-heading font-extrabold text-sm px-4 py-2 rounded-full shadow-lg border border-red-400 uppercase tracking-wider">
              Currently Sold Out
            </span>
          </div>
        )}
      </motion.div>

      {/* MAIN CONTAINER (COMPACT SPACING & HEIGHTS) */}
      <div className="px-4 md:px-8 max-w-4xl mx-auto w-full -mt-6 relative z-20 space-y-4">
        
        {/* MAIN PRODUCT HEADER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-lg shadow-slate-200/40 dark:shadow-none border border-white dark:border-zinc-800 space-y-3"
        >
          {/* VENDOR LINK */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Link 
                href={`/vendor/${product.vendorId}`}
                className="group/vendor inline-flex items-center gap-1.5 text-xs font-body font-semibold text-[#312E81] dark:text-indigo-300 hover:text-[#1E1B4B] dark:hover:text-white transition-colors"
                title={`Visit ${product.vendorName} Store`}
              >
                <Store size={13} className="text-[#312E81] dark:text-indigo-400 group-hover/vendor:scale-110 transition-transform shrink-0" />
                <span className="underline underline-offset-2 decoration-indigo-300 dark:decoration-indigo-600 group-hover/vendor:decoration-[#312E81]">
                  {product.vendorName}
                </span>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 font-normal group-hover/vendor:translate-x-0.5 transition-transform">
                  (Store ↗)
                </span>
              </Link>
            </div>

            {reviewsList.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-body text-[#18181B] dark:text-zinc-100">
                <Star size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
                <span className="font-extrabold font-heading">{averageRating}</span>
                <span className="text-[#71717A] dark:text-zinc-400 font-medium">({reviewsList.length})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-heading font-extrabold text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-95 shadow-2xs group cursor-pointer"
                title="Leave a review for this product"
              >
                <Star size={12} className="text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform" />
                <span>Leave a Review</span>
              </button>
            )}
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-[#18181B] dark:text-zinc-100 tracking-tight leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-2xl md:text-3xl font-body font-extrabold text-[#312E81] dark:text-indigo-400">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                In Stock & Ready
              </span>
            </div>
          </div>

          {/* Prep Time Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#312E81] dark:text-indigo-400" />
              <span>Prep Time: {product.prepTime}</span>
            </div>
          </div>
        </motion.div>

        {/* ELEGANT COMPACT "ABOUT THIS ITEM" DIV */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-zinc-800 relative overflow-hidden space-y-3"
        >
          {/* Section Title */}
          <div className="relative z-10">
            <h3 className="font-heading font-extrabold text-lg md:text-xl text-[#18181B] dark:text-zinc-100 tracking-tight">
              About this Item
            </h3>
          </div>

          {/* Description Body (Sitting directly in parent card) */}
          <p className="text-[#18181B] dark:text-zinc-200 text-xs md:text-sm leading-relaxed font-body font-normal relative z-10">
            {product.description}
          </p>

          {/* ADD TO CART BUTTON WITH STANDALONE CIRCULAR "+" BUTTON BESIDE IT */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2.5 relative z-10">
            
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 group flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all">
                <CustomCartIcon size={17} strokeWidth={2.2} />
              </div>
              
              <span className="font-heading font-extrabold tracking-wider text-sm md:text-base text-white">
                Add to Cart
              </span>

              {quantity > 1 && (
                <span className="bg-[#FBBF24] text-[#1E1B4B] font-heading font-extrabold text-xs px-2 py-0.5 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                  ×{quantity}
                </span>
              )}
            </button>

            {/* STANDALONE "+" BUTTON */}
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-14 h-14 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white border border-indigo-100/90 dark:border-zinc-700 flex items-center justify-center shadow-xs active:scale-90 transition-all shrink-0 group"
              title="Increase Quantity"
              aria-label="Increase Quantity"
            >
              <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

          </div>
        </motion.div>

        {/* REVIEWS SECTION */}
        {reviewsList.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/80 dark:border-zinc-800 space-y-3.5 relative overflow-hidden"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#312E81] dark:text-indigo-400" />
                <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                  Student Reviews ({reviewsList.length})
                </h3>
              </div>

              {/* WRITE REVIEW BUTTON */}
              <button
                onClick={() => setIsWriteReviewOpen(true)}
                className="px-3 py-1.5 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-[11px] md:text-xs whitespace-nowrap rounded-full shadow-sm hover:shadow-indigo-900/30 active:scale-95 transition-all flex items-center gap-1.5 border border-indigo-700/50 group cursor-pointer"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#FBBF24] text-[#312E81] flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <Edit3 size={10} className="text-[#312E81]" />
                </div>
                <span>Write Review</span>
              </button>
            </div>

            {/* Testimonial Display */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {currentReview && (
                  <motion.div
                    key={currentReview.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative space-y-3 pt-1"
                  >
                    <Quote size={80} className="absolute -bottom-4 -right-4 text-[#312E81]/5 dark:text-white/5 pointer-events-none rotate-180" />

                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full relative overflow-hidden border-2 border-white dark:border-zinc-700 shadow-md shrink-0">
                          <Image src={currentReview.avatar} alt={currentReview.author} fill unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 truncate">
                            {currentReview.author}
                          </h4>
                          <span className="text-xs font-body font-medium text-[#71717A] dark:text-zinc-400 truncate block">
                            {currentReview.hostel} • {currentReview.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= currentReview.rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-slate-200 dark:text-zinc-600"}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-extrabold text-[#18181B] dark:text-zinc-100 font-body ml-0.5">
                          {currentReview.rating}.0
                        </span>
                      </div>
                    </div>

                    <p className="text-sm md:text-base text-[#18181B] dark:text-zinc-200 font-body font-medium leading-relaxed italic relative z-10 pt-1">
                      &ldquo;{currentReview.comment}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 relative z-10">
                      <span className="text-[11px] font-body font-semibold text-[#71717A] dark:text-zinc-400">
                        Review {activeReviewIndex + 1} of {reviewsList.length}
                      </span>

                      <button
                        onClick={() => handleLikeReview(currentReview.id)}
                        className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                          currentReview.isLiked
                            ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                            : "bg-white dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:text-[#18181B] dark:hover:text-zinc-100"
                        }`}
                      >
                        <ThumbsUp size={13} className={currentReview.isLiked ? "fill-white" : ""} />
                        <span>Helpful ({currentReview.likes})</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {reviewsList.length > 1 && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  {reviewsList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReviewIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeReviewIndex ? "w-6 bg-[#312E81] dark:bg-indigo-500" : "w-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600"
                      }`}
                      aria-label={`Go to review ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevReview}
                    className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextReview}
                    className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                    aria-label="Next review"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200/80 dark:border-zinc-800 text-center space-y-3.5"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
              <Star size={22} className="fill-amber-400 text-amber-400" />
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100">
                No reviews yet for this product
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 font-body leading-relaxed">
                Have you tried this item? Be the first campus student to rate and review it!
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(true)}
                className="px-5 py-2.5 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-extrabold text-xs rounded-full shadow-md hover:shadow-indigo-900/30 active:scale-95 transition-all inline-flex items-center gap-2 border border-indigo-700/50 group cursor-pointer"
              >
                <Star size={14} className="text-[#FBBF24] fill-[#FBBF24] group-hover:rotate-12 transition-transform" />
                <span>Leave a Review</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 pt-4"
          >
            <h3 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100">
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
          </motion.div>
        )}

      </div>

      {/* WRITE A REVIEW MODAL */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        title="Leave a Student Review"
      >
        {reviewSuccessMsg ? (
          <div className="text-center py-8 space-y-3 font-body">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#18181B]">
              Thank You!
            </h3>
            <p className="text-xs text-[#71717A]">Your review has been posted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleAddReview} className="space-y-5 font-body text-[#18181B]">
            {/* Interactive Star Rating */}
            <div className="space-y-2 text-center bg-[#FAFAF7] p-4 rounded-2xl border border-slate-100">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Tap to Rate {product.name}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 active:scale-125 transition-transform"
                  >
                    <Star
                      size={28}
                      className={`${
                        star <= (hoverRating || newRating)
                          ? "fill-[#FBBF24] text-[#FBBF24]"
                          : "text-slate-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1.5">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Your Feedback & Comments
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience regarding portion size, taste, packaging, or delivery speed..."
                rows={4}
                required
                className="w-full p-3.5 rounded-2xl bg-[#FAFAF7] border border-slate-200 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#312E81] placeholder-[#71717A]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-body font-semibold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform text-sm"
            >
              <Send size={16} />
              Submit Review
            </button>
          </form>
        )}
      </Modal>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and start a new order from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] text-[#FFFFFF] font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
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
