"use client";

import { useState, use } from "react";
import { ArrowLeft, Star, Clock, Heart, Minus, Plus, ShoppingBag, Store, ShieldCheck, CheckCircle2, MessageSquare, ThumbsUp, Send, UserCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductGrid } from "@/components/ui/ProductGrid";

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
      comment: "Portion size was huge! The chicken leg was properly grilled and the pepper sauce was spicy and authentic. Delivery took under 15 mins.",
      likes: 14,
    },
    {
      id: "r2",
      author: "Blessing A.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      hostel: "Queen Elizabeth Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Mama Cass never disappoints. Hot Jollof rice right after a 3-hour GST lecture is pure bliss. Will order again!",
      likes: 8,
    },
    {
      id: "r3",
      author: "Emmanuel K.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      hostel: "Tedder Hall",
      rating: 4,
      date: "3 days ago",
      comment: "Food came piping hot and well packaged. Plantains were sweet and perfectly fried.",
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

        {/* DESCRIPTION & IN-PAGE PURCHASING CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5"
        >
          <div className="space-y-3">
            <h3 className="font-heading font-extrabold text-lg text-[#18181B]">
              About this item
            </h3>
            <p className="text-[#71717A] text-sm md:text-base leading-relaxed font-body font-normal">
              {product.description}
            </p>

            {/* Key Details List */}
            {product.details && product.details.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-body font-extrabold text-[#71717A] uppercase tracking-wider mb-2">
                  What&apos;s Included / Features
                </h4>
                <ul className="space-y-2">
                  {product.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs md:text-sm font-body font-semibold text-[#18181B]">
                      <CheckCircle2 size={16} className="text-[#312E81] shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* QUANTITY & ADD TO CART CONTROLS */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 bg-[#F4F3FF] rounded-full p-1.5 border border-indigo-100">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-[#18181B] shadow-sm font-bold active:scale-95 transition-transform"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="font-heading font-extrabold text-base w-8 text-center text-[#18181B]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-[#312E81] text-white rounded-full shadow-sm font-bold active:scale-95 transition-transform"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="w-full sm:flex-1 h-14 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-body font-semibold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 text-base"
            >
              <ShoppingBag size={20} />
              <span>Add {quantity} to Cart • ₦{(product.price * quantity).toLocaleString()}</span>
            </button>
          </div>
        </motion.div>

        {/* STUDENT REVIEWS & RATINGS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6"
        >
          {/* Header & Rating Breakdown Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={20} className="text-[#312E81]" />
                <h3 className="font-heading font-extrabold text-xl text-[#18181B]">
                  Student Reviews & Feedback
                </h3>
              </div>
              <p className="text-xs text-[#71717A] font-body font-normal">
                Real feedback from verified students across campus halls
              </p>
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-4 bg-[#F4F3FF] p-4 rounded-2xl border border-indigo-100">
              <div className="text-center">
                <span className="font-heading font-extrabold text-3xl text-[#312E81] block leading-none">
                  {product.rating}
                </span>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
                  ))}
                </div>
                <span className="text-[10px] font-body font-semibold text-[#71717A] mt-0.5 block">
                  {reviewsList.length} Ratings
                </span>
              </div>

              <button
                onClick={() => setIsWriteReviewOpen(true)}
                className="px-4 py-2.5 bg-[#312E81] text-white font-body font-semibold text-xs rounded-full shadow-md hover:bg-[#1E1B4B] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
                <span>Write a Review</span>
              </button>
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div className="space-y-4">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="p-4 bg-[#FAFAF7] rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full relative overflow-hidden border border-slate-200 shadow-sm shrink-0">
                      <Image src={rev.avatar} alt={rev.author} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-[#18181B]">{rev.author}</h4>
                        <span className="text-[10px] font-body font-semibold bg-emerald-50 text-[#16A34A] px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <UserCheck size={10} /> Verified
                        </span>
                      </div>
                      <span className="text-xs font-body font-medium text-[#71717A] block">
                        {rev.hostel} • {rev.date}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Star size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
                    <span className="text-xs font-bold text-[#18181B]">{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-[#18181B] font-body font-normal leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={() => handleLikeReview(rev.id)}
                    className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1 rounded-full border transition-all active:scale-95 ${
                      rev.isLiked
                        ? "bg-[#F4F3FF] text-[#312E81] border-indigo-200"
                        : "bg-white text-[#71717A] border-slate-200 hover:text-[#18181B]"
                    }`}
                  >
                    <ThumbsUp size={12} className={rev.isLiked ? "fill-[#312E81]" : ""} />
                    <span>Helpful ({rev.likes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

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
