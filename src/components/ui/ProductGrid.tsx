"use client";

import { ProductCard, ProductCardProps } from "./ProductCard";

interface ProductGridProps {
  products: Omit<ProductCardProps, "onAdd" | "onClick">[];
  onAddProduct?: (id: string) => void;
  onClickProduct?: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  onAddProduct,
  onClickProduct,
  isLoading = false,
  emptyMessage = "No dishes or items currently found in this category.",
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#312E81] dark:bg-indigo-400 animate-bounce" />
        </div>
        <p className="text-xs font-heading font-extrabold text-[#312E81] dark:text-indigo-300 tracking-wider">
          Loading...
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  const uniqueProducts = Array.from(
    new Map(products.map((p, idx) => [p.id || `prod-${idx}`, p])).values()
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6">
      {uniqueProducts.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onAdd={onAddProduct}
          onClick={onClickProduct}
        />
      ))}
    </div>
  );
}
