import Image from "next/image";
import Link from "next/link";
import { Store, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useFavoritesStore } from "@/lib/favoritesStore";
import { useUserStore } from "@/lib/userStore";

import { parseProductImages } from "@/lib/productOptions";

export interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string;
  vendorName: string;
  isAvailable?: boolean;
  rating?: number;
  onAdd?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  image,
  vendorName,
  isAvailable = true,
  rating = 4.8,
  onClick,
}: ProductCardProps) {
  const { isProductFavorite, toggleProductFavorite } = useFavoritesStore();
  const { profile } = useUserStore();
  const isFavorite = isProductFavorite(id);
  const mainImage = parseProductImages(image)[0] || image;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-30px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#121215] rounded-[16px] p-1.5 md:p-2 shadow-xs hover:shadow-xl hover:shadow-indigo-950/10 dark:hover:shadow-indigo-900/20 border border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full overflow-hidden"
    >
      <div>
        {/* ULTRA-COMPACT ASPECT RATIO (4/3) & REDUCED MARGIN */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800/60 mb-1.5">
          <Image
            src={mainImage}
            alt={`${name} by ${vendorName} — Lightson Marketplace`}
            fill
            unoptimized={mainImage.startsWith("data:")}
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Ambient Contrast Tint */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />

          {/* SMALLER VENDOR BADGE */}
          <div className="absolute top-1 left-1 bg-black/40 dark:bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20 shadow-xs max-w-[85%] z-10">
            <Store size={8} className="text-[#FBBF24] shrink-0" />
            <span className="text-[8px] font-body font-normal text-white truncate tracking-normal">
              {vendorName}
            </span>
          </div>

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="text-white font-body font-normal text-[9px] bg-red-600/90 px-2 py-0.5 rounded-full border border-red-400/50 shadow-md uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="px-0.5 space-y-0.5">
          <h3 className="font-body font-bold text-[#18181B] dark:text-zinc-100 text-xs leading-tight line-clamp-2 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* FOOTER PRICE & HEART FAVORITE BUTTON */}
      <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800/80 px-0.5">
        <div className="flex flex-col">
          <span className="text-[7px] font-body font-normal text-[#71717A] dark:text-zinc-400 uppercase tracking-widest leading-none">Price</span>
          <span className="font-body font-normal text-xs text-[#312E81] dark:text-indigo-400 tracking-tight leading-snug">
            ₦{price.toLocaleString()}
          </span>
        </div>

        {/* COMPACT HEART FAVORITE BUTTON */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleProductFavorite(
              { id, name, price, image, vendorName, rating },
              profile?.email
            );
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs border ${
            isFavorite
              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-500"
              : "bg-[#F4F3FF] dark:bg-zinc-800 border-indigo-100/50 dark:border-zinc-700/50 text-[#71717A] dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          }`}
          aria-label="Add to favorites"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={12} fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );

  if (onClick) {
    return <div onClick={() => onClick(id)}>{cardContent}</div>;
  }

  return <Link href={`/product/${slug || id}`} className="block h-full">{cardContent}</Link>;
}
