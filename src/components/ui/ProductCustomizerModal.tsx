"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Check, Layers, Sparkles, MessageSquare, ShoppingBag, Store } from "lucide-react";
import { useCartStore } from "@/lib/store";

interface VariationOption {
  name: string;
  price: number;
}

interface AddOnOption {
  name: string;
  price: number;
}

export interface CustomizerProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image: string;
  storeId: string;
  storeName: string;
  isAvailable?: boolean;
}

interface ProductCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CustomizerProduct | null;
  onAddedToCart?: (productName: string, calculatedPrice: number) => void;
  onVendorConflict?: (newItem: any, quantity: number) => void;
}

export function parseProductOptions(description?: string | null): {
  cleanDesc: string;
  sizes: VariationOption[];
  addons: AddOnOption[];
} {
  if (!description) {
    return { cleanDesc: "", sizes: [], addons: [] };
  }

  const match = description.match(/\[OPTIONS:\s*(\{.*?\})\]/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      const clean = description.replace(/\[OPTIONS:\s*\{.*?\}\]/, "").trim();
      return {
        cleanDesc: clean,
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
        addons: Array.isArray(parsed.addons) ? parsed.addons : [],
      };
    } catch {
      // Fallback
    }
  }

  return { cleanDesc: description, sizes: [], addons: [] };
}

export function ProductCustomizerModal({
  isOpen,
  onClose,
  product,
  onAddedToCart,
  onVendorConflict,
}: ProductCustomizerModalProps) {
  const { addItem } = useCartStore();

  const { cleanDesc, sizes, addons } = useMemo(() => {
    return parseProductOptions(product?.description);
  }, [product?.description]);

  const [selectedSize, setSelectedSize] = useState<VariationOption | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Initialize first size or reset on product change
  const currentUnitBasePrice = product ? product.price : 0;
  const sizeExtraPrice = selectedSize ? selectedSize.price : 0;
  const addOnsExtraPrice = selectedAddOns.reduce((acc, a) => acc + a.price, 0);
  const singleItemFinalPrice = currentUnitBasePrice + sizeExtraPrice + addOnsExtraPrice;
  const totalCalculatedPrice = singleItemFinalPrice * quantity;

  const toggleAddOn = (addon: AddOnOption) => {
    if (selectedAddOns.some((a) => a.name === addon.name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const formattedItem = {
      id: product.id,
      name: product.name,
      price: singleItemFinalPrice,
      image: product.image,
      vendorId: product.storeId,
      vendorName: product.storeName,
      selectedSize: selectedSize || undefined,
      selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
      customNotes: customNotes.trim() || undefined,
    };

    const res = addItem(formattedItem, quantity);

    if (res.requiresConfirmation && onVendorConflict) {
      onVendorConflict(formattedItem, quantity);
      onClose();
      return;
    }

    if (onAddedToCart) {
      onAddedToCart(product.name, totalCalculatedPrice);
    }

    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col font-body"
        >
          {/* PRODUCT BANNER IMAGE & CLOSE BUTTON */}
          <div className="relative h-48 sm:h-56 w-full bg-slate-100 dark:bg-zinc-800 shrink-0">
            <Image
              src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"}
              alt={product.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer z-10"
              aria-label="Close customizer"
            >
              <X size={18} />
            </button>

            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBBF24] text-[#1E1B4B] font-heading font-black text-[10px] uppercase tracking-wider mb-1.5">
                <Store size={11} /> {product.storeName}
              </div>
              <h3 className="font-heading font-black text-xl md:text-2xl leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2">
                {cleanDesc || "Delicious campus meal cooked fresh upon your order."}
              </p>
            </div>
          </div>

          {/* SCROLLABLE CUSTOMIZATION OPTIONS */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs md:text-sm text-slate-700 dark:text-zinc-300">
            {/* PORTION SIZES */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers size={16} className="text-[#312E81] dark:text-indigo-400" />
                    Choose Portion / Size
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required</span>
                </div>

                <div className="space-y-2">
                  <label
                    onClick={() => setSelectedSize(null)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedSize === null
                        ? "border-[#312E81] dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-[#312E81] dark:text-indigo-300 font-bold shadow-xs"
                        : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedSize === null ? "border-[#312E81] dark:border-indigo-400" : "border-slate-300"
                      }`}>
                        {selectedSize === null && <div className="w-2 h-2 rounded-full bg-[#312E81] dark:bg-indigo-400" />}
                      </div>
                      <span>Regular (Standard Portion)</span>
                    </div>
                    <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </label>

                  {sizes.map((sizeOption, idx) => {
                    const isSelected = selectedSize?.name === sizeOption.name;
                    return (
                      <label
                        key={idx}
                        onClick={() => setSelectedSize(sizeOption)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#312E81] dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-[#312E81] dark:text-indigo-300 font-bold shadow-xs"
                            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#312E81] dark:border-indigo-400" : "border-slate-300"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#312E81] dark:bg-indigo-400" />}
                          </div>
                          <span>{sizeOption.name}</span>
                        </div>
                        <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          +₦{sizeOption.price.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADD-ON EXTRAS */}
            {addons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={16} className="text-amber-500" />
                    Extras & Add-ons (Protein, Sides, Drinks)
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optional</span>
                </div>

                <div className="space-y-2">
                  {addons.map((addOnOption, idx) => {
                    const isChecked = selectedAddOns.some((a) => a.name === addOnOption.name);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleAddOn(addOnOption)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 font-bold shadow-xs"
                            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            isChecked ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 dark:border-zinc-700"
                          }`}>
                            {isChecked && <Check size={12} className="stroke-[3]" />}
                          </div>
                          <span>{addOnOption.name}</span>
                        </div>
                        <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          +₦{addOnOption.price.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SPECIAL INSTRUCTIONS */}
            <div className="space-y-2">
              <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare size={16} className="text-slate-400" />
                Kitchen Preparation Notes
              </h4>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Less spicy, extra sauce, pack chicken separately..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs focus:ring-2 focus:ring-[#312E81] focus:outline-hidden"
              />
            </div>
          </div>

          {/* FOOTER QUANTITY & ADD BUTTON */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-between gap-4">
            {/* QUANTITY PICKER */}
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-200 transition-colors cursor-pointer"
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="font-heading font-black text-sm w-5 text-center text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* ADD TO CART ACTION BUTTON */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-black text-xs sm:text-sm shadow-xl hover:shadow-indigo-950/20 active:scale-95 transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={16} /> Add to Order
              </span>
              <span className="font-mono text-amber-300 font-extrabold text-sm sm:text-base">
                ₦{totalCalculatedPrice.toLocaleString()}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
