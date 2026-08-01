"use client";

import Image from "next/image";
import { Plus, Star } from "lucide-react";

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
  onClick,
}: ProductCardProps) {
  return (
    <div 
      onClick={() => onClick?.(id)}
      className="group relative flex flex-col justify-between bg-white rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 cursor-pointer overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-3">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-xs bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
              Sold Out
            </span>
          </div>
        )}

        {/* Rating Pill */}
        <div className="absolute top-2.5 right-2.5 bg-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-slate-800">{rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 justify-between gap-2 px-1">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
            {vendorName}
          </span>
          <h3 className="font-heading font-bold text-slate-900 text-sm md:text-base leading-snug line-clamp-2">
            {name}
          </h3>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-400">Price</span>
            <span className="font-body font-bold text-base md:text-lg text-slate-900">
              ₦{price.toLocaleString()}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAvailable) onAdd?.(id);
            }}
            disabled={!isAvailable}
            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm active:scale-95 hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Add ${name} to cart`}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
