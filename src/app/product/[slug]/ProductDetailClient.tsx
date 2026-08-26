"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Heart, 
  Plus, 
  Store, 
  ThumbsUp, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Check, 
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
  VariationOption, 
  AddOnOption 
} from "@/lib/productOptions";

interface ProductDetailClientProps {
  initialProduct?: any;
  slug: string;
}

export default function ProductDetailClient({ initialProduct, slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { profile } = useUserStore();
  const { reviewsByProduct, addProductReview, toggleLikeReview } = useReviewsStore();
  const { isProductFavorite, toggleProductFavorite } = useFavoritesStore();

  const [product, setProduct] = useState(initialProduct || {
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
    isAvailable: true,
    category: "food",
    rating: 5.0,
    reviewsCount: 0,
  });

  const [quantity, setQuantity] = useState(1);
  const isLiked = isProductFavorite(product.id) || isProductFavorite(slug);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // SYNCHRONIZED PER-PRODUCT REVIEWS
  const reviewsList = reviewsByProduct[product.id] || reviewsByProduct[slug] || [];
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
          const p = res.product;
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
            prepTime: p.store?.estimatedDelivery || "15-20 mins",
            isAvailable: p.isAvailable,
            category: p.category?.name?.toLowerCase() || "pastries",
            rating: p.store?.rating || 4.9,
            reviewsCount: p.store?.reviews?.length || 0,
          });

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
      image: productImages[0] || product.image,
      vendorId: product.vendorId || "v1",
      vendorName: product.vendorName || "Campus Vendor",
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

    // 1. Submit to Live Prisma DB
    if (profile.email && !profile.isVisitor) {
      await submitStudentReview({
        userEmail: profile.email,
        storeId: product.vendorId,
        rating: newRating,
        comment: newComment.trim(),
      });
    }

    // 2. Add to Local Zustand Store
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

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
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
            <div className="absolute bottom-10 inset-x-4 z-10 flex items-center justify-center gap-2">
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

          {/* Prep Time Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#312E81] dark:text-indigo-400" />
              <span>Prep Time: {product.prepTime}</span>
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
                  <span>Choose Portion / Size</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Select 1 option</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {structuredData.sizes.map((size, idx) => {
                  const isSelected = selectedSize?.name === size.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(isSelected ? null : size)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-[#312E81] dark:border-indigo-500 shadow-xs"
                          : "bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-[#312E81] bg-[#312E81] text-white" : "border-slate-300 dark:border-zinc-600"
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">
                          {size.name}
                        </span>
                      </div>
                      <span className="text-xs font-body font-bold text-[#312E81] dark:text-indigo-300">
                        {size.price > 0 ? `+₦${size.price.toLocaleString()}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD-ONS & EXTRAS BUILDER */}
          {structuredData.addons.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-extrabold text-xs text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} className="text-[#312E81] dark:text-indigo-400" />
                  <span>Delicious Add-Ons & Drinks</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Multiple allowed</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {structuredData.addons.map((addon, idx) => {
                  const isSelected = selectedAddOns.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-xs"
                          : "bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected ? "border-amber-500 bg-amber-500 text-slate-950" : "border-slate-300 dark:border-zinc-600"
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs font-body font-bold text-amber-700 dark:text-amber-300">
                        +₦{addon.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* CUSTOMER REVIEWS SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-zinc-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100 flex items-center gap-2">
                <span>Customer Reviews</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-400 font-bold font-body">
                  {reviewsList.length}
                </span>
              </h3>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 font-body">Verified feedback from students across campus</p>
            </div>

            <button
              type="button"
              onClick={() => setIsWriteReviewOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-heading font-bold text-xs shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>Write Review</span>
            </button>
          </div>

          {reviewsList.length > 0 ? (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {reviewsList.map((rev) => (
                <div 
                  key={rev.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-100 dark:bg-zinc-700">
                        <Image src={rev.avatar} alt={rev.author} fill className="object-cover" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-[#18181B] dark:text-zinc-100">
                          {rev.author}
                        </h5>
                        <p className="text-[10px] text-slate-400">{rev.hostel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < rev.rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-slate-300 dark:text-zinc-600"}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#18181B] dark:text-zinc-200 font-body leading-relaxed">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>{rev.date}</span>
                    <button
                      type="button"
                      onClick={() => toggleLikeReview(product.id, rev.id)}
                      className={`flex items-center gap-1 hover:text-indigo-600 cursor-pointer ${
                        rev.isLiked ? "text-indigo-600 font-bold" : ""
                      }`}
                    >
                      <ThumbsUp size={11} className={rev.isLiked ? "fill-indigo-600" : ""} />
                      <span>{rev.likes} Likes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 space-y-2">
              <p className="text-xs">No reviews for this product yet. Be the first to leave one!</p>
            </div>
          )}
        </motion.section>

        {/* RELATED CAMPUS PRODUCTS */}
        {relatedProducts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-3 pt-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100">
                More from {product.vendorName}
              </h3>
              <Link 
                href={`/vendor/${product.vendorId}`}
                className="text-xs font-bold text-[#312E81] dark:text-indigo-400 hover:underline"
              >
                View Storefront ↗
              </Link>
            </div>

            <ProductGrid 
              products={relatedProducts} 
              onAddProduct={(id) => router.push(`/product/${id}`)}
            />
          </motion.section>
        )}

      </div>

      {/* FLOATING BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 p-4 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Quantity Selector */}
          <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded-full p-1 bg-slate-50 dark:bg-zinc-800 shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#18181B] dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-heading font-extrabold text-[#18181B] dark:text-zinc-100">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#18181B] dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Add to Tray Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className="flex-1 h-12 rounded-full bg-[#312E81] hover:bg-[#1E1B4B] dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <CustomCartIcon size={18} />
            <span>{product.isAvailable ? `Add to Tray • ₦${totalPrice.toLocaleString()}` : "Sold Out"}</span>
          </button>

        </div>
      </div>

      {/* WRITE REVIEW MODAL */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        title={`Review "${product.name}"`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
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
              className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-heading font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceCart}
              className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-heading font-bold shadow-sm active:scale-95 transition-transform"
            >
              Clear & Add
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
