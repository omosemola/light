"use client";

import { ProductCard, ProductCardProps } from "./ProductCard";

interface ProductGridProps {
  products: Omit<ProductCardProps, "onAdd" | "onClick">[ ];
  onAddProduct?: (id: string) => void;
  onClickProduct?: (id: string) => void;
}

export function ProductGrid({ products, onAddProduct, onClickProduct }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-500 font-medium">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-6">
      {products.map((product) => (
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
