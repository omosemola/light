"use client";

import { useState, use } from "react";
import { ArrowLeft, Search, SlidersHorizontal, ArrowUpDown, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";

// CATEGORY METADATA
const CATEGORY_DATA: Record<string, { name: string; icon: string; bg: string; description: string; subcategories: string[] }> = {
  food: {
    name: "Food & Meals",
    icon: "🍔",
    bg: "bg-orange-500",
    description: "Delicious freshly prepared meals from top campus kitchens and restaurants.",
    subcategories: ["All", "Rice & Meals", "Fast Food", "Pizza & Suya", "Pastries"],
  },
  snacks: {
    name: "Snacks & Treats",
    icon: "🍿",
    bg: "bg-pink-500",
    description: "Quick bites, popcorn, chips, nuts, and sweet treats for lectures and study sessions.",
    subcategories: ["All", "Chips & Popcorn", "Chocolates", "Biscuits", "Traditional Snacks"],
  },
  drinks: {
    name: "Drinks & Beverages",
    icon: "🥤",
    bg: "bg-blue-500",
    description: "Chilled juices, sodas, energy drinks, water, and smoothies.",
    subcategories: ["All", "Fresh Juices", "Soft Drinks", "Energy Drinks", "Smoothies", "Water"],
  },
  groceries: {
    name: "Groceries & Provisions",
    icon: "🛒",
    bg: "bg-emerald-500",
    description: "Dorm essentials, noodles, canned goods, milk, sugar, and daily cooking items.",
    subcategories: ["All", "Noodles & Pasta", "Dairy & Breakfast", "Canned Goods", "Toiletries"],
  },
  pastries: {
    name: "Pastries & Bakery",
    icon: "🥐",
    bg: "bg-amber-600",
    description: "Freshly baked meat pies, cakes, donuts, sausage rolls, and bread.",
    subcategories: ["All", "Pies & Rolls", "Cakes & Muffins", "Bread", "Donuts"],
  },
  stationery: {
    name: "Stationery & Academics",
    icon: "✏️",
    bg: "bg-purple-500",
    description: "Note books, pens, sticky notes, files, calculators, and exam materials.",
    subcategories: ["All", "Note Books", "Pens & Pencils", "Files & Folders", "Exam Essentials"],
  },
  care: {
    name: "Personal Care",
    icon: "🧴",
    bg: "bg-indigo-600",
    description: "Skincare, soaps, hygiene products, perfume, and wellness items.",
    subcategories: ["All", "Skincare", "Bath & Body", "Haircare", "Deodorants"],
  },
};

// CATEGORY SPECIFIC PRODUCTS MOCK DATA
const CATEGORY_PRODUCTS: Record<string, Array<{ id: string; name: string; price: number; vendorId: string; vendorName: string; image: string; description: string; subcategory: string; isAvailable: boolean }>> = {
  food: [
    {
      id: "f1",
      name: "Jollof Rice with Chicken & Plantain",
      price: 3500,
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Authentic Nigerian party Jollof rice served with crispy fried plantain and grilled chicken leg.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f2",
      name: "Spicy Beef Suya Pizza - Medium",
      price: 6500,
      vendorId: "v4",
      vendorName: "Pizza Hub",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese.",
      subcategory: "Pizza & Suya",
      isAvailable: true,
    },
    {
      id: "f3",
      name: "Fried Rice Special with Turkey",
      price: 4200,
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Seasoned fried rice cooked with mixed vegetables and served with seasoned fried turkey.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f4",
      name: "Crispy Chicken Burger & Chips",
      price: 3800,
      vendorId: "v5",
      vendorName: "Campus Bites",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
      subcategory: "Fast Food",
      isAvailable: true,
    },
  ],
  snacks: [
    {
      id: "s1",
      name: "Butter Popcorn Large Bucket",
      price: 1500,
      vendorId: "v6",
      vendorName: "Cinema Crunch",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Freshly popped warm butter popcorn.",
      subcategory: "Chips & Popcorn",
      isAvailable: true,
    },
    {
      id: "s2",
      name: "Plantain Chips (Spicy) 150g",
      price: 800,
      vendorId: "v6",
      vendorName: "Cinema Crunch",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Crunchy spicy ripe plantain chips.",
      subcategory: "Chips & Popcorn",
      isAvailable: true,
    },
  ],
  drinks: [
    {
      id: "d1",
      name: "Cold Pressed Orange Juice 50cl",
      price: 1200,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "100% natural, freshly squeezed orange juice with no added sugar.",
      subcategory: "Fresh Juices",
      isAvailable: true,
    },
    {
      id: "d2",
      name: "Tropical Mango Pineapple Smoothie",
      price: 1800,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Blended fresh mango, pineapple, and Greek yogurt.",
      subcategory: "Smoothies",
      isAvailable: true,
    },
  ],
  groceries: [
    {
      id: "g1",
      name: "Indomie Super Pack (Carton of 40)",
      price: 14500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Carton of Indomie Instant Noodles Super Pack 120g.",
      subcategory: "Noodles & Pasta",
      isAvailable: true,
    },
  ],
  pastries: [
    {
      id: "pas1",
      name: "Jumbo Beef Meat Pie",
      price: 1200,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Flaky golden crust filled with seasoned minced beef, potatoes, and carrots.",
      subcategory: "Pies & Rolls",
      isAvailable: true,
    },
  ],
  stationery: [
    {
      id: "st1",
      name: "A4 Note Book 60 Leaves (Pack of 5)",
      price: 2500,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "High quality 60-leaf ruled exercise notebooks for campus lectures.",
      subcategory: "Note Books",
      isAvailable: true,
    },
  ],
  care: [
    {
      id: "c1",
      name: "Moisturizing Cocoa Butter Lotion 400ml",
      price: 3200,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      description: "Deep nourishing body lotion for all skin types.",
      subcategory: "Skincare",
      isAvailable: true,
    },
  ],
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const category = CATEGORY_DATA[slug] || {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    icon: "📦",
    bg: "bg-slate-900",
    description: "Explore all products in this category on campus.",
    subcategories: ["All"],
  };

  const rawProducts = CATEGORY_PRODUCTS[slug] || CATEGORY_PRODUCTS.food;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const filteredProducts = rawProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcat = selectedSubcategory === "All" || product.subcategory === selectedSubcategory;
    return matchesSearch && matchesSubcat;
  });

  const handleAddProduct = (productId: string) => {
    const product = rawProducts.find((p) => p.id === productId);
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
    const product = rawProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      {/* CATEGORY HEADER BANNER */}
      <div className={`${category.bg} text-white px-5 pt-8 pb-8 rounded-b-[32px] shadow-md`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{category.icon}</span>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight">
                {category.name}
              </h1>
            </div>
          </div>
          <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl">
            {category.description}
          </p>

          {/* Search bar inside header */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-slate-800 text-sm font-medium border border-white/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-6">
        
        {/* SUBCATEGORY PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {category.subcategories.map((subcat) => (
            <button
              key={subcat}
              onClick={() => setSelectedSubcategory(subcat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                selectedSubcategory === subcat
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {subcat}
            </button>
          ))}
        </div>

        {/* PRODUCTS COUNT & SORT BAR */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs md:text-sm font-bold text-slate-500">
            Showing <span className="text-slate-900 font-extrabold">{filteredProducts.length}</span> items
          </p>
          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <ArrowUpDown size={14} />
            <span>Sort by: Popular</span>
          </button>
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            onAddProduct={handleAddProduct}
            onClickProduct={handleOpenDetail}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <span className="text-4xl block mb-3">{category.icon}</span>
            <h3 className="font-heading font-bold text-lg text-slate-800">No items found</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching subcategories or adjusting your search query.</p>
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
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                {selectedProduct.vendorName}
              </span>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                {selectedProduct.name}
              </h3>
              <p className="font-body font-extrabold text-lg text-slate-900 mt-1">
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

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and start a new order from <strong>{pendingProduct?.vendorName}</strong>?
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
