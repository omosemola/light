"use client";

import Image from "next/image";
import Link from "next/link";
import { Store, ArrowUpRight } from "lucide-react";
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
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-30px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#121215] rounded-[24px] p-3 md:p-3.5 shadow-xs hover:shadow-2xl hover:shadow-indigo-950/10 dark:hover:shadow-indigo-900/20 border border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full overflow-hidden"
    >
      <div>
        {/* IMAGE CONTAINER WITH GLASS OVERLAYS & HOVER ZOOM */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800/60 mb-3.5">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Vignette Depth Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 opacity-70 group-hover:opacity-50 transition-opacity duration-300" />

          {/* Vendor Badge Top-Left Translucent Glass */}
          <div className="absolute top-2.5 left-2.5 bg-black/40 dark:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm max-w-[85%] z-10">
            <Store size={11} className="text-[#FBBF24] shrink-0" />
            <span className="text-[10px] font-heading font-extrabold text-white truncate tracking-wide">
              {vendorName}
            </span>
          </div>

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="text-white font-heading font-extrabold text-xs bg-red-600/90 px-3.5 py-1.5 rounded-full border border-red-400/50 shadow-lg uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="px-1 space-y-1">
          <h3 className="font-heading font-extrabold text-[#18181B] dark:text-zinc-100 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* FOOTER PRICE & ARROW INDICATOR */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 px-1">
        <div className="flex flex-col">
          <span className="text-[9px] font-body font-bold text-[#71717A] dark:text-zinc-400 uppercase tracking-widest">Price</span>
          <span className="font-heading font-extrabold text-lg md:text-xl text-[#312E81] dark:text-indigo-400 tracking-tight">
            ₦{price.toLocaleString()}
          </span>
        </div>

        <div className="w-8 h-8 rounded-xl bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-300 group-hover:bg-[#312E81] dark:group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 shadow-xs border border-indigo-100/50 dark:border-indigo-800/50">
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );

  if (onClick) {
    return <div onClick={() => onClick(id)}>{cardContent}</div>;
  }

  return <Link href={`/product/${id}`} className="block h-full">{cardContent}</Link>;
}
