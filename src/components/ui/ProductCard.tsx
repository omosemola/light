"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Store, ArrowUpRight } from "lucide-react";
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
  rating = 4.8,
  onClick,
}: ProductCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-30px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-3xl p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-zinc-800 overflow-hidden hover:-translate-y-1.5 cursor-pointer h-full"
    >
      <div>
        {/* IMAGE CONTAINER WITH OVERLAYS */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FAFAF7] dark:bg-zinc-800 mb-3.5">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Vendor Badge Top-Left Overlay */}
          <div className="absolute top-2.5 left-2.5 bg-[#18181B]/75 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm max-w-[70%]">
            <Store size={11} className="text-[#FBBF24] shrink-0" />
            <span className="text-[10px] font-heading font-extrabold text-white truncate tracking-wide">
              {vendorName}
            </span>
          </div>

          {/* Rating Badge Top-Right Overlay */}
          <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100/80 dark:border-zinc-800">
            <Star size={11} className="fill-[#FBBF24] text-[#FBBF24]" />
            <span className="text-[11px] font-bold text-[#18181B] dark:text-zinc-100 font-body">{rating}</span>
          </div>

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-[#18181B]/75 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-heading font-extrabold text-xs bg-red-600 px-3 py-1.5 rounded-full border border-red-400 shadow-md uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="flex flex-col gap-1 px-1">
          {/* Title: Plus Jakarta Sans */}
          <h3 className="font-heading font-bold text-[#18181B] dark:text-zinc-100 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* PRICE & EXPLORE FOOTER */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Price</span>
          <span className="font-body font-extrabold text-lg md:text-xl text-[#312E81] dark:text-indigo-400">
            ₦{price.toLocaleString()}
          </span>
        </div>

        {/* Sleek Arrow Indicator replacing old plus button */}
        <div className="w-8 h-8 rounded-full bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-300 group-hover:bg-[#312E81] dark:group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 shadow-xs border border-indigo-100/50 dark:border-indigo-800/50">
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
