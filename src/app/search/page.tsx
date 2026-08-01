"use client";

import { useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "Authentic Nigerian party Jollof rice served with crispy fried plantain and grilled chicken leg.",
    isAvailable: true,
  },
  {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "100% natural, freshly squeezed orange juice with no added sugar or preservatives.",
    isAvailable: true,
  },
  {
    id: "p4",
    name: "Spicy Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
    isAvailable: true,
  },
];

const FILTERS = ["All", "Food", "Snacks", "Drinks", "Groceries", "Stationery"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { addItem, confirmAndReplaceCart } = useCartStore();
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase()) ||
                         product.vendorName.toLowerCase().includes(query.toLowerCase());
    return matchesQuery;
  });

  const handleAddProduct = (productId: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const result = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
    });

    if (result.requiresConfirmation) {
      setPendingProduct(product);
    }
  };

  const handleReplaceCart = () => {
    if (pendingProduct) {
      confirmAndReplaceCart({
        id: pendingProduct.id,
        name: pendingProduct.name,
        price: pendingProduct.price,
        image: pendingProduct.image,
        vendorId: pendingProduct.vendorId,
        vendorName: pendingProduct.vendorName,
      });
      setPendingProduct(null);
    }
  };

  const handleOpenDetail = (productId: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      {/* Search Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-200 sticky top-0 md:top-20 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={24} />
          </Link>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <SearchIcon size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, groceries..."
              className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 border border-slate-200"
              autoFocus
            />
          </div>
          <button className="p-3 bg-slate-100 rounded-2xl text-slate-800 hover:bg-slate-200 transition-colors">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedFilter === filter
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="px-5 md:px-8 mt-6">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">
          {query ? `Results for "${query}"` : "Discover Essentials"}
        </h2>

        {filteredProducts.length > 0 ? (
          <ProductGrid 
            products={filteredProducts} 
            onAddProduct={handleAddProduct}
            onClickProduct={handleOpenDetail} 
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 font-medium">No products found matching your query.</p>
          </div>
        )}
      </div>

      {/* PRODUCT DETAILS MODAL */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.vendorName || "Product Details"}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100">
              <Image 
                src={selectedProduct.image} 
                alt={selectedProduct.name} 
                fill 
                className="object-cover" 
              />
            </div>

            <div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                {selectedProduct.name}
              </h3>
              <p className="font-body font-extrabold text-lg text-indigo-600 mt-1">
                ₦{selectedProduct.price.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {selectedProduct.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-700">Quantity</span>
              <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-900 shadow-sm font-bold active:scale-95"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-sm font-bold active:scale-95"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  handleAddProduct(selectedProduct.id);
                }
                setSelectedProduct(null);
              }}
              disabled={!selectedProduct.isAvailable}
              className="w-full h-13 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center gap-2 active:scale-95 transition-colors disabled:opacity-50"
            >
              <ShoppingBag size={18} />
              Add {quantity} to Cart • ₦{(selectedProduct.price * quantity).toLocaleString()}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-slate-900 text-white font-bold rounded-full shadow-sm active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-slate-100 text-slate-700 font-bold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>
    </div>
  );
}
