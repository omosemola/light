"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Heart } from "lucide-react";
import { motion } from "framer-motion";

export interface ProductCardProps {
  id: string;
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
  name,
  price,
  image,
  vendorName,
  isAvailable = true,
  onClick,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-30px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#121215] rounded-[20px] p-2 md:p-2.5 shadow-xs hover:shadow-xl hover:shadow-indigo-950/10 dark:hover:shadow-indigo-900/20 border border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full overflow-hidden"
    >
      <div>
        {/* IMAGE CONTAINER WITH REDUCED MARGIN & COMPACT ASPECT */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800/60 mb-2">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Vignette Depth Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

          {/* SMALLER VENDOR BADGE */}
          <div className="absolute top-1.5 left-1.5 bg-black/40 dark:bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/20 shadow-xs max-w-[85%] z-10">
            <Store size={9} className="text-[#FBBF24] shrink-0" />
            <span className="text-[9px] font-body font-normal text-white truncate tracking-normal">
              {vendorName}
            </span>
          </div>

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="text-white font-body font-normal text-[10px] bg-red-600/90 px-2.5 py-1 rounded-full border border-red-400/50 shadow-md uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS (NO BOLD TEXTS) */}
        <div className="px-0.5 space-y-0.5">
          <h3 className="font-body font-normal text-[#18181B] dark:text-zinc-100 text-xs md:text-sm leading-snug line-clamp-2 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* FOOTER PRICE & HEART FAVORITE BUTTON (REDUCED HEIGHT & NO BOLD TEXTS) */}
      <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 dark:border-zinc-800/80 px-0.5">
        <div className="flex flex-col">
          <span className="text-[9px] font-body font-normal text-[#71717A] dark:text-zinc-400 uppercase tracking-widest">Price</span>
          <span className="font-body font-normal text-xs text-[#312E81] dark:text-indigo-400 tracking-tight">
            ₦{price.toLocaleString()}
          </span>
        </div>

        {/* HEART FAVORITE TOGGLE BUTTON */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs border ${
            isFavorite
              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-500"
              : "bg-[#F4F3FF] dark:bg-zinc-800 border-indigo-100/50 dark:border-zinc-700/50 text-[#71717A] dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          }`}
          aria-label="Add to favorites"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={13} fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );

  if (onClick) {
    return <div onClick={() => onClick(id)}>{cardContent}</div>;
  }

  return <Link href={`/product/${id}`} className="block h-full">{cardContent}</Link>;
}
