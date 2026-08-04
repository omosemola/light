"use client";

import { useState, use } from "react";
import { ArrowLeft, Star, Clock, Heart, Plus, Store, ShieldCheck, CheckCircle2, MessageSquare, ThumbsUp, Send, UserCheck, ChevronLeft, ChevronRight, Quote, Sparkles, Info, Edit3 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";

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

// MOCK REVIEWS DATABASE
const INITIAL_REVIEWS: Record<string, Review[]> = {
  p1: [
    {
      id: "r1",
      author: "David O.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      hostel: "Mellanby Hall",
      rating: 5,
      date: "2 hours ago",
      comment: "Portion size was huge! The chicken leg was properly grilled and the pepper sauce was spicy and authentic. Delivery took under 15 mins to Mellanby lodge.",
      likes: 14,
    },
    {
      id: "r2",
      author: "Blessing A.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      hostel: "Queen Elizabeth Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Mama Cass never disappoints. Hot Jollof rice right after a 3-hour GST lecture is pure bliss. Packaging was clean and leak-proof!",
      likes: 8,
    },
    {
      id: "r3",
      author: "Emmanuel K.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      hostel: "Tedder Hall",
      rating: 4,
      date: "3 days ago",
      comment: "Food came piping hot and well packaged. Plantains were sweet and perfectly fried. Will definitely reorder.",
      likes: 5,
    },
  ],
  p2: [
    {
      id: "r4",
      author: "Chidimma N.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      hostel: "Idia Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Extremely refreshing juice! No sugar added, pure orange pulp. Great for hot afternoon lectures.",
      likes: 9,
    },
  ],
};

// MOCK PRODUCTS DATABASE
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
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const product = ALL_PRODUCTS[id] || ALL_PRODUCTS.p1;
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // REVIEWS STATE
  const [reviewsList, setReviewsList] = useState<Review[]>(
    INITIAL_REVIEWS[product.id] || INITIAL_REVIEWS.p1
  );
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [studentHostel, setStudentHostel] = useState("Mellanby Hall");
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

    const newReviewItem: Review = {
      id: `r-${Date.now()}`,
      author: "Alex John",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      hostel: studentHostel,
      rating: newRating,
      date: "Just now",
      comment: newComment.trim(),
      likes: 0,
    };

    setReviewsList([newReviewItem, ...reviewsList]);
    setActiveReviewIndex(0); // Jump to newly added review
    setNewComment("");
    setReviewSuccessMsg(true);
    setTimeout(() => {
      setReviewSuccessMsg(false);
      setIsWriteReviewOpen(false);
    }, 1500);
  };

  const handleLikeReview = (reviewId: string) => {
    setReviewsList(
      reviewsList.map((rev) => {
        if (rev.id === reviewId) {
          const isLiked = !rev.isLiked;
          return {
            ...rev,
            isLiked,
            likes: isLiked ? rev.likes + 1 : rev.likes - 1,
          };
        }
        return rev;
      })
    );
  };

  const currentReview = reviewsList[activeReviewIndex] || reviewsList[0];

  const handleNextReview = () => {
    setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length);
  };

  const handlePrevReview = () => {
    setActiveReviewIndex((prev) => (prev - 1 + reviewsList.length) % reviewsList.length);
  };

  const relatedProducts = Object.values(ALL_PRODUCTS).filter(
    (p) => p.vendorId === product.vendorId && p.id !== product.id
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] font-body text-[#18181B] pb-24">
      
      {/* HERO PRODUCT IMAGE WITH ANIMATION */}
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
            className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#18181B] flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
              isLiked ? "bg-red-500 text-white" : "bg-white/90 hover:bg-white text-[#18181B]"
            }`}
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

      {/* MAIN CONTAINER */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full -mt-8 relative z-20 space-y-6">
        
        {/* MAIN PRODUCT HEADER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80 space-y-4"
        >
          {/* Vendor Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 bg-[#F4F3FF] px-3.5 py-1.5 rounded-full border border-indigo-100">
              <Store size={14} className="text-[#312E81]" />
              <span className="text-xs font-heading font-extrabold text-[#312E81] uppercase tracking-wider">
                {product.vendorName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
              <span className="text-xs font-bold text-[#18181B] font-body">{product.rating}</span>
              <span className="text-[11px] font-medium text-[#71717A]">({reviewsList.length} reviews)</span>
            </div>
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-[#18181B] tracking-tight leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-body font-extrabold text-[#312E81]">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                In Stock & Ready
              </span>
            </div>
          </div>

          {/* Prep Time & Delivery Info */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-[#71717A] font-body font-semibold">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#312E81]" />
              <span>Prep Time: {product.prepTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#16A34A]" />
              <span>Campus Rider Verified</span>
            </div>
          </div>
        </motion.div>

        {/* ELEGANT & BEAUTIFUL "ABOUT THIS ITEM" DIV */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden space-y-6"
        >
          {/* Subtle Decorative Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#F4F3FF] via-transparent to-transparent rounded-bl-full pointer-events-none" />

          {/* Header Tag & Section Title */}
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-heading font-extrabold text-[#312E81] uppercase tracking-wider bg-[#F4F3FF] px-3.5 py-1 rounded-full border border-indigo-100 shadow-2xs">
              <Sparkles size={13} className="text-[#312E81]" /> Item Overview
            </div>
            <h3 className="font-heading font-extrabold text-xl md:text-2xl text-[#18181B] tracking-tight">
              About this item
            </h3>
          </div>

          {/* Rich Description Body */}
          <div className="bg-[#FAFAF7] p-5 rounded-2xl border border-slate-200/60 relative z-10">
            <p className="text-[#18181B] text-sm md:text-base leading-relaxed font-body font-normal">
              {product.description}
            </p>
          </div>

          {/* Micro-Bento Features Grid */}
          {product.details && product.details.length > 0 && (
            <div className="space-y-3 relative z-10 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-[#312E81]" />
                <h4 className="text-xs font-heading font-extrabold text-[#71717A] uppercase tracking-wider">
                  Highlights & Features
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F4F3FF]/70 hover:bg-[#F4F3FF] p-3.5 rounded-2xl border border-indigo-100/70 flex items-center gap-3 transition-colors shadow-2xs group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#312E81] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-xs md:text-sm font-body font-bold text-[#18181B]">
                      {detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADD TO CART BUTTON WITH STANDALONE CIRCULAR "+" BUTTON BESIDE IT */}
          <div className="pt-5 border-t border-slate-100 flex items-center gap-3 relative z-10">
            
            {/* ANIMATED CONIC BORDER WRAPPER FOR ADD TO CART BUTTON */}
            <div className="animated-cart-btn-wrapper flex-1">
              <div className="animated-cart-btn-effect">
                <div />
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="animated-cart-btn font-body font-bold shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm md:text-base group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <CustomCartIcon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="font-heading font-extrabold tracking-wide">
                    Add {quantity > 1 ? `${quantity} ` : ""}to Cart
                  </span>
                </div>

                <div className="bg-[#FBBF24] text-[#312E81] font-heading font-extrabold px-3.5 py-1.5 rounded-full text-xs md:text-sm shadow-sm group-hover:scale-105 transition-transform">
                  ₦{(product.price * quantity).toLocaleString()}
                </div>
              </button>
            </div>

            {/* STANDALONE "+" BUTTON IN A CIRCLE ONLY */}
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-15 h-15 rounded-full bg-[#F4F3FF] hover:bg-[#312E81] text-[#312E81] hover:text-white border border-indigo-100 flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0 group"
              title="Increase Quantity"
              aria-label="Increase Quantity"
            >
              <Plus size={24} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

          </div>
        </motion.div>

        {/* SINGLE REVIEW CAROUSEL TESTIMONIAL CARD */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6 relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-[#312E81]" />
              <h3 className="font-heading font-extrabold text-xl text-[#18181B]">
                Student Reviews ({reviewsList.length})
              </h3>
            </div>

            {/* REDESIGNED WRITE REVIEW BUTTON */}
            <button
              onClick={() => setIsWriteReviewOpen(true)}
              className="px-4 py-2.5 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs md:text-sm rounded-full shadow-md hover:shadow-indigo-900/30 active:scale-95 transition-all flex items-center gap-2 border border-indigo-700/50 group"
            >
              <div className="w-6 h-6 rounded-full bg-[#FBBF24] text-[#312E81] flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-110 transition-transform">
                <Edit3 size={13} className="text-[#312E81]" />
              </div>
              <span>Write Review</span>
            </button>
          </div>

          {/* SINGLE TESTIMONIAL CARD WITH SLIDE ANIMATION */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {currentReview && (
                <motion.div
                  key={currentReview.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="bg-gradient-to-br from-[#F4F3FF]/90 via-white to-amber-50/40 rounded-3xl p-6 border border-indigo-100/80 shadow-md relative overflow-hidden space-y-4"
                >
                  {/* Decorative Background Quote Watermark */}
                  <Quote size={80} className="absolute -bottom-4 -right-4 text-[#312E81]/5 pointer-events-none rotate-180" />

                  {/* Top Author & Rating Bar */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full relative overflow-hidden border-2 border-white shadow-md shrink-0">
                        <Image src={currentReview.avatar} alt={currentReview.author} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-extrabold text-base text-[#18181B]">
                            {currentReview.author}
                          </h4>
                          <span className="text-[10px] font-body font-extrabold bg-emerald-50 text-[#16A34A] px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <UserCheck size={11} /> Verified
                          </span>
                        </div>
                        <span className="text-xs font-body font-medium text-[#71717A]">
                          {currentReview.hostel} • {currentReview.date}
                        </span>
                      </div>
                    </div>

                    {/* Gold Star Badge */}
                    <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={star <= currentReview.rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-slate-200"}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-[#18181B] font-body ml-1">
                        {currentReview.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-sm md:text-base text-[#18181B] font-body font-medium leading-relaxed italic relative z-10 pt-1">
                    &ldquo;{currentReview.comment}&rdquo;
                  </p>

                  {/* Helpful Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 relative z-10">
                    <span className="text-[11px] font-body font-semibold text-[#71717A]">
                      Review {activeReviewIndex + 1} of {reviewsList.length}
                    </span>

                    <button
                      onClick={() => handleLikeReview(currentReview.id)}
                      className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                        currentReview.isLiked
                          ? "bg-[#312E81] text-white border-[#312E81] shadow-sm"
                          : "bg-white text-[#71717A] border-slate-200 hover:text-[#18181B]"
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

          {/* CAROUSEL FOOTER NAV CONTROLS & DOT INDICATORS */}
          {reviewsList.length > 1 && (
            <div className="flex items-center justify-between pt-2">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {reviewsList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveReviewIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeReviewIndex ? "w-6 bg-[#312E81]" : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to review ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevReview}
                  className="w-10 h-10 rounded-full bg-[#F4F3FF] hover:bg-[#312E81] text-[#312E81] hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextReview}
                  className="w-10 h-10 rounded-full bg-[#F4F3FF] hover:bg-[#312E81] text-[#312E81] hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                  aria-label="Next review"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

        </motion.div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 pt-4"
          >
            <h3 className="font-heading font-extrabold text-xl text-[#18181B]">
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

            {/* Hostel Location Selector */}
            <div className="space-y-1.5">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Your Campus Hostel / Hall
              </label>
              <select
                value={studentHostel}
                onChange={(e) => setStudentHostel(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-[#FAFAF7] border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#312E81]"
              >
                <option value="Mellanby Hall">Mellanby Hall</option>
                <option value="Queen Elizabeth Hall">Queen Elizabeth Hall</option>
                <option value="Tedder Hall">Tedder Hall</option>
                <option value="Kuti Hall">Kuti Hall</option>
                <option value="Sultan Bello Hall">Sultan Bello Hall</option>
                <option value="Idia Hall">Idia Hall</option>
                <option value="Off-Campus Annex">Off-Campus Annex</option>
              </select>
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
