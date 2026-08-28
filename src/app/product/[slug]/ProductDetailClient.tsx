"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Heart, 
  Plus, 
  Store, 
  CheckCircle2, 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Quote, 
  Info, 
  Edit3,
  Sparkles,
  Layers,
  Check,
  Bike,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { getLiveProductBySlugOrId } from "@/actions/marketplace";
import { useReviewsStore } from "@/lib/reviewsStore";
import { useUserStore, DEFAULT_VISITOR_CARTOON_AVATAR } from "@/lib/userStore";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { submitStudentReview } from "@/actions/reviews";
import { 
  parseProductDescription, 
  parseProductImages, 
  getSafeImageUrl,
  VariationOption, 
  AddOnOption 
} from "@/lib/productOptions";
import { getStoreScheduleStatus } from "@/lib/storeSchedule";
import { formatReviewDate } from "@/lib/formatDate";

interface ProductDetailClientProps {
  initialProduct?: any;
  slug: string;
}

export default function ProductDetailClient({ initialProduct, slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { profile } = useUserStore();
  const { reviewsByProduct, addProductReview, toggleLikeReview } = useReviewsStore();
  const { isProductFavorite, toggleProductFavorite } = useFavoritesStore();

  const [product, setProduct] = useState(() => {
    if (initialProduct) {
      return {
        id: initialProduct.id,
        slug: initialProduct.slug || slug,
        name: initialProduct.name,
        price: initialProduct.price,
        vendorId: initialProduct.storeId || initialProduct.vendorId || initialProduct.store?.id || "",
        vendorName: initialProduct.store?.name || initialProduct.vendorName || "Campus Merchant",
        vendorRating: initialProduct.store?.rating || 4.9,
        image: initialProduct.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        description: initialProduct.description || "",
        details: ["Freshly prepared on campus", "Fast hostel delivery"],
        prepTime: initialProduct.estimatedDelivery || initialProduct.store?.estimatedDelivery || "15-20 mins",
        deliveryFee: initialProduct.deliveryFee !== null && initialProduct.deliveryFee !== undefined
          ? initialProduct.deliveryFee
          : (initialProduct.store?.deliveryFee !== undefined ? initialProduct.store.deliveryFee : 500),
        isOpen: initialProduct.store?.isOpen !== false,
        openingTime: initialProduct.store?.openingTime || "08:00",
        closingTime: initialProduct.store?.closingTime || "22:00",
        isAvailable: initialProduct.isAvailable !== false,
        category: initialProduct.category?.name?.toLowerCase() || "pastries",
        rating: initialProduct.store?.rating || 4.9,
        reviewsCount: initialProduct.store?.reviews?.length || 0,
      };
    }
    return {
      id: "item",
      slug: slug,
      name: "Campus Item",
      price: 0,
      vendorId: "",
      vendorName: "Campus Merchant",
      vendorRating: 5.0,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      description: "Freshly prepared campus delicacy.",
      details: ["Freshly prepared on campus", "Fast hostel delivery"],
      prepTime: "15-20 mins",
      deliveryFee: 500,
      isOpen: true,
      openingTime: "08:00",
      closingTime: "22:00",
      isAvailable: true,
      category: "food",
      rating: 5.0,
      reviewsCount: 0,
    };
  });

  const [quantity, setQuantity] = useState(1);
  const isLiked = isProductFavorite(product.id) || isProductFavorite(slug);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // SYNCHRONIZED REVIEWS WITH ACCURATE TIMESTAMPS
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const clientReviews = reviewsByProduct[product.id] || reviewsByProduct[slug] || [];
  
  const reviewsList = useMemo(() => {
    const clientIds = new Set(clientReviews.map((r) => r.id));
    const filteredDb = dbReviews.filter((r) => !clientIds.has(r.id));
    return [...clientReviews, ...filteredDb];
  }, [clientReviews, dbReviews]);

  const averageRating = reviewsList.length > 0
    ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length).toFixed(1)
    : "0.0";

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function loadLiveProduct() {
      try {
        const res = await getLiveProductBySlugOrId(slug);
        if (active && res.success && res.product) {
          const p: any = res.product;
          setProduct({
            id: p.id,
            slug: p.slug || p.id,
            name: p.name,
            price: p.price,
            image: p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            description: p.description || "",
            vendorId: p.storeId,
            vendorName: p.store?.name || "Campus Vendor",
            vendorRating: p.store?.rating || 4.9,
            details: ["Freshly prepared on campus", "Fast delivery to all student hostels"],
            prepTime: p.estimatedDelivery || p.store?.estimatedDelivery || "15-20 mins",
            deliveryFee: p.deliveryFee !== null && p.deliveryFee !== undefined
              ? p.deliveryFee
              : (p.store?.deliveryFee !== undefined ? p.store.deliveryFee : 500),
            isOpen: p.store?.isOpen !== false,
            openingTime: p.store?.openingTime || "08:00",
            closingTime: p.store?.closingTime || "22:00",
            isAvailable: p.isAvailable,
            category: p.category?.name?.toLowerCase() || "pastries",
            rating: p.store?.rating || 4.9,
            reviewsCount: p.store?.reviews?.length || 0,
          });

          if (p.store?.reviews && p.store.reviews.length > 0) {
            const formatted = p.store.reviews.map((r: any) => ({
              id: r.id,
              author: r.user?.name || "Campus Student",
              avatar: r.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
              hostel: "Student Hostel",
              rating: r.rating || 5,
              date: formatReviewDate(r.createdAt),
              comment: r.comment || "",
              likes: 0,
              isLiked: false,
            }));
            setDbReviews(formatted);
          }

          if (p.store?.products) {
            const formattedRelated = p.store.products
              .filter((prod: any) => prod.id !== p.id)
              .map((prod: any) => ({
                id: prod.id,
                slug: prod.slug || prod.id,
                name: prod.name,
                price: prod.price,
                image: prod.image,
                description: prod.description || "",
                vendorId: p.storeId,
                vendorName: p.store?.name || "Campus Vendor",
                rating: 4.9,
                isAvailable: prod.isAvailable,
                category: p.category?.name || "Items",
              }));
            setRelatedProducts(formattedRelated);
          }
        }
      } catch (err) {
        console.error("Error loading live product:", err);
      }
    }

    loadLiveProduct();
    return () => {
      active = false;
    };
  }, [slug]);

  // STRUCTURED OPTIONS & MULTI-IMAGE PARSING
  const productImages = useMemo(() => {
    return parseProductImages(product.image);
  }, [product.image]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const structuredData = useMemo(() => {
    return parseProductDescription(product.description);
  }, [product.description]);

  const [selectedSize, setSelectedSize] = useState<VariationOption | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);

  const toggleAddOn = (addon: AddOnOption) => {
    if (selectedAddOns.some((a) => a.name === addon.name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const basePrice = product.price || 0;
  const sizeExtra = selectedSize ? selectedSize.price : 0;
  const addOnsExtra = selectedAddOns.reduce((acc, a) => acc + a.price, 0);
  const unitPrice = basePrice + sizeExtra + addOnsExtra;
  const totalPrice = unitPrice * quantity;

  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { items: cartItems, addItem: addToCart, confirmAndReplaceCart } = useCartStore();

  const handleAddToCart = () => {
    const customizedName = [
      product.name,
      selectedSize ? `(${selectedSize.name})` : null,
      selectedAddOns.length > 0 ? `+ ${selectedAddOns.map((a) => a.name).join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    const cartItem = {
      id: product.id,
      slug: product.slug || slug,
      name: customizedName,
      price: unitPrice,
      image: getSafeImageUrl(productImages[0] || product.image),
      vendorId: product.vendorId || "vendor",
      vendorName: product.vendorName || "Campus Merchant",
      vendorDeliveryFee: product.deliveryFee !== undefined ? product.deliveryFee : 500,
      vendorEstimatedDelivery: product.prepTime || "15-20 mins",
      itemDeliveryFee: product.deliveryFee !== undefined ? product.deliveryFee : null,
      itemEstimatedDelivery: product.prepTime || null,
      selectedSize: selectedSize || undefined,
      selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
    };

    const hasConflict = cartItems.length > 0 && cartItems.some((item) => item.vendorId !== cartItem.vendorId);

    if (hasConflict) {
      setPendingProduct({ item: cartItem, quantity });
    } else {
      addToCart(cartItem, quantity);
      setToastMessage(`✓ Added ${quantity}x "${customizedName}" to your tray!`);
      setTimeout(() => setToastMessage(""), 2200);
    }
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart(pendingProduct.item, pendingProduct.quantity);
      setToastMessage(`✓ Cart refreshed with "${pendingProduct.item.name}"!`);
      setPendingProduct(null);
      setTimeout(() => setToastMessage(""), 2200);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);

    const isVisitor = profile.isVisitor || profile.name === "Visitor" || !profile.email;
    const authorName = isVisitor ? "Campus Student" : (profile.name || "Student");
    const authorAvatar = isVisitor 
      ? (profile.avatar || DEFAULT_VISITOR_CARTOON_AVATAR) 
      : (profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
    const authorHostel = profile.hostel || "Main Hostel";

    if (profile.email && !profile.isVisitor) {
      await submitStudentReview({
        userEmail: profile.email,
        storeId: product.vendorId,
        rating: newRating,
        comment: newComment.trim(),
      });
    }

    addProductReview(product.id, {
      author: authorName,
      avatar: authorAvatar,
      hostel: authorHostel,
      rating: newRating,
      comment: newComment.trim(),
    });

    setIsSubmittingReview(false);
    setIsWriteReviewOpen(false);
    setNewComment("");
    setNewRating(5);
    setToastMessage("✓ Review posted live! Thank you for supporting campus food.");
    setTimeout(() => setToastMessage(""), 2500);
  };

  const currentReview = reviewsList[activeReviewIndex] || null;

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] text-xs font-heading font-extrabold shadow-2xl flex items-center gap-2 border border-white/20"
        >
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* HERO PRODUCT IMAGE GALLERY WITH FULL HEIGHT & CONTROLS */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-square md:aspect-[21/9] max-h-[460px] bg-slate-900 overflow-hidden group"
      >
        <Image
          src={productImages[activeImageIdx] || productImages[0]}
          alt={`${product.name} by ${product.vendorName} — Lightson Marketplace`}
          fill
          priority
          unoptimized={(productImages[activeImageIdx] || productImages[0] || "").startsWith("data:")}
          className="object-cover transition-all duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* Multi-Photo Carousel Arrows */}
        {productImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveImageIdx((prev) => (prev - 1 + productImages.length) % productImages.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition active:scale-95 z-10 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setActiveImageIdx((prev) => (prev + 1) % productImages.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition active:scale-95 z-10 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>

            {/* Thumbnail Strip Overlay */}
            <div className="absolute bottom-6 inset-x-4 z-10 flex items-center justify-center gap-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-lg ${
                    activeImageIdx === idx ? "border-[#FBBF24] scale-110 ring-2 ring-amber-400/50" : "border-white/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} photo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Floating Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-[#18181B] dark:text-zinc-100 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => {
              toggleProductFavorite(
                {
                  id: product.id,
                  slug: product.slug || slug,
                  name: product.name,
                  price: product.price,
                  image: productImages[0] || product.image,
                  vendorName: product.vendorName,
                  rating: typeof product.rating === "number" ? product.rating : 4.8,
                  category: product.category,
                },
                profile?.email
              );
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
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

      {/* MAIN CONTAINER */}
      <div className="px-4 md:px-8 max-w-4xl mx-auto w-full -mt-6 relative z-20 space-y-4">
        
        {/* MAIN PRODUCT HEADER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-lg shadow-slate-200/40 dark:shadow-none border border-white dark:border-zinc-800 space-y-3"
        >
          {/* VENDOR LINK & SCHEDULE BADGE */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
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

              {(() => {
                const sched = getStoreScheduleStatus({
                  isOpen: (product as any).isOpen,
                  openingTime: (product as any).openingTime,
                  closingTime: (product as any).closingTime,
                });
                return (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    sched.isOpenNow
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}>
                    {sched.isOpenNow ? `Open • ${sched.scheduleText}` : `Closed • Opens ${sched.openTimeFormatted}`}
                  </span>
                );
              })()}
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
                ₦{unitPrice.toLocaleString()}
              </span>
              {(sizeExtra > 0 || addOnsExtra > 0) && (
                <span className="text-xs text-slate-400 line-through">
                  Base ₦{basePrice.toLocaleString()}
                </span>
              )}
              <span className="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                In Stock & Ready
              </span>
            </div>
          </div>

          {/* Prep Time & Delivery Info */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#312E81] dark:text-indigo-400" />
              <span>Est. Delivery: <strong className="text-slate-900 dark:text-zinc-100 font-bold">{product.prepTime}</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Bike size={14} className="text-amber-500" />
              <span>Delivery Fee: <strong className="text-slate-900 dark:text-zinc-100 font-bold">{Number(product.deliveryFee) === 0 ? "Free Delivery" : `₦${Number(product.deliveryFee || 500).toLocaleString()}`}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* ABOUT THIS ITEM & CUSTOMIZATIONS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-zinc-800 relative overflow-hidden space-y-4"
        >
          {/* Section Title */}
          <div>
            <h3 className="font-heading font-extrabold text-lg md:text-xl text-[#18181B] dark:text-zinc-100 tracking-tight">
              About this Item
            </h3>
            <p className="text-[#18181B] dark:text-zinc-200 text-xs md:text-sm leading-relaxed font-body font-normal mt-1">
              {structuredData.description || product.description || "Freshly prepared campus delicacy."}
            </p>
          </div>

          {/* KEY INGREDIENTS LIST */}
          {structuredData.ingredients.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Key Ingredients & Highlights
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {structuredData.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-indigo-50/70 dark:bg-indigo-950/40 text-[#312E81] dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-900/50"
                  >
                    ✓ {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PORTION SIZES BUILDER */}
          {structuredData.sizes.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-[#312E81] dark:text-indigo-400" />
                  Choose Portion Size
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => setSelectedSize(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedSize === null
                      ? "border-[#312E81] dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs"
                      : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="text-xs">Regular (Standard)</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{basePrice.toLocaleString()}
                  </span>
                </div>

                {structuredData.sizes.map((s, idx) => {
                  const isSelected = selectedSize?.name === s.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#312E81] dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs"
                          : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <span className="text-xs">{s.name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₦{s.price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CUSTOM ADD-ONS */}
          {structuredData.addons.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Extras & Add-Ons
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {structuredData.addons.map((a, idx) => {
                  const isChecked = selectedAddOns.some((item) => item.name === a.name);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAddOn(a)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-bold shadow-xs"
                          : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 dark:border-zinc-700"
                        }`}>
                          {isChecked && <Check size={10} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs">{a.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₦{a.price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT ORIGINAL ADD TO CART BUTTON WITH STANDALONE CIRCULAR "+" BUTTON BESIDE IT */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2.5 relative z-10">
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 group flex-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all">
                <CustomCartIcon size={17} strokeWidth={2.2} />
              </div>
              
              <span className="font-heading font-extrabold tracking-wider text-sm md:text-base text-white">
                Add to Cart • ₦{totalPrice.toLocaleString()}
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
              className="w-14 h-14 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white border border-indigo-100/90 dark:border-zinc-700 flex items-center justify-center shadow-xs active:scale-90 transition-all shrink-0 group cursor-pointer"
              title="Increase Quantity"
              aria-label="Increase Quantity"
            >
              <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </motion.div>

        {/* CUSTOMER REVIEWS SECTION */}
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
                          {(() => {
                            const revAvatar = getSafeImageUrl(currentReview.avatar);
                            return (
                              <Image src={revAvatar} alt={currentReview.author} fill unoptimized={revAvatar.startsWith("data:")} className="object-cover" />
                            );
                          })()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100 truncate">
                            {currentReview.author}
                          </h4>
                          <span className="text-[11px] text-[#71717A] dark:text-zinc-400 font-body font-normal block">
                            {currentReview.hostel} • {currentReview.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                        <Star size={13} className="fill-[#FBBF24] text-[#FBBF24]" />
                        <span className="font-heading font-extrabold text-xs text-[#18181B] dark:text-zinc-100">
                          {currentReview.rating}.0
                        </span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-[#18181B] dark:text-zinc-300 font-body font-normal leading-relaxed relative z-10 italic">
                      "{currentReview.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-400 relative z-10">
                      <button
                        onClick={() => toggleLikeReview(product.id, currentReview.id)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          currentReview.isLiked ? "text-indigo-600 font-bold" : "hover:text-[#312E81] dark:hover:text-indigo-400"
                        }`}
                      >
                        <ThumbsUp size={13} className={currentReview.isLiked ? "fill-indigo-600" : ""} />
                        <span>Helpful ({currentReview.likes})</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Carousel Navigation Buttons */}
            {reviewsList.length > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-body text-[#71717A] dark:text-zinc-400">
                  Review {activeReviewIndex + 1} of {reviewsList.length}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveReviewIndex((prev) => (prev - 1 + reviewsList.length) % reviewsList.length)}
                    className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length)}
                    className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
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
                  addToCart({
                    id: item.id,
                    slug: item.slug || item.id,
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

      {/* WRITE REVIEW MODAL */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        title={`Review "${product.name}"`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2 font-body">
          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase mb-2 font-heading">
              Your Star Rating
            </label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const starVal = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewRating(starVal)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125"
                  >
                    <Star
                      size={24}
                      className={
                        (hoverRating || newRating) >= starVal
                          ? "fill-[#FBBF24] text-[#FBBF24]"
                          : "text-slate-300 dark:text-zinc-600"
                      }
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 ml-2">
                {newRating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1.5 font-heading">
              Your Review & Feedback
            </label>
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell other students about taste, portion size, packaging, and delivery speed..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingReview || !newComment.trim()}
            className="w-full h-11 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Send size={14} />
            <span>{isSubmittingReview ? "Submitting..." : "Post Review Live"}</span>
          </button>
        </form>
      </Modal>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Start Fresh Order?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-body leading-relaxed">
            Your tray currently contains items from a different campus merchant. Would you like to clear your previous tray and start an order with{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">{product.vendorName}</strong>?
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPendingProduct(null)}
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-heading font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceCart}
              className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-heading font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              Clear & Add
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
