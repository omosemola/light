"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Star, Store } from "lucide-react";

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
  onAdd,
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/80 overflow-hidden hover:-translate-y-1">
      <Link href={`/product/${id}`} className="block flex-1">
        {/* Image Container */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FAFAF7] mb-3">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {!isAvailable && (
            <div className="absolute inset-0 bg-[#18181B]/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xs bg-[#18181B] px-3 py-1.5 rounded-full border border-slate-700">
                Sold Out
              </span>
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
            <Star size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
            <span className="text-[11px] font-bold text-[#18181B] font-body">{rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 justify-between gap-1.5 px-1">
          <div>
            {/* Vendor Name: Inter, 500, 12px, Slate Gray */}
            <div className="flex items-center gap-1 font-body font-medium text-xs text-[#71717A] mb-1">
              <Store size={13} className="text-[#312E81]" />
              <span className="truncate">{vendorName}</span>
            </div>
            {/* Product Title: Plus Jakarta Sans, 700, 14-16px, Charcoal */}
            <h3 className="font-heading font-bold text-[#18181B] text-sm md:text-base leading-snug line-clamp-2 group-hover:text-[#312E81] transition-colors">
              {name}
            </h3>
          </div>
        </div>
      </Link>

      {/* Price & Quick Add */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-[#71717A] font-body uppercase tracking-wider">Price</span>
          {/* Price: Inter, 800, 18-20px, Deep Indigo */}
          <span className="font-body font-extrabold text-lg md:text-xl text-[#312E81]">
            ₦{price.toLocaleString()}
          </span>
        </div>

        {/* Add Button: Deep Indigo background + white text */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isAvailable) onAdd?.(id);
          }}
          disabled={!isAvailable}
          className="w-10 h-10 rounded-full bg-[#312E81] text-white flex items-center justify-center shadow-sm active:scale-95 hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label={`Add ${name} to cart`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
