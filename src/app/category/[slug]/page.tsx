"use client";

import { useState, use, useMemo, useEffect } from "react";
import { ArrowLeft, Search, ArrowUpDown, Utensils, Cookie, Coffee, ShoppingCart, Cake, BookOpen, HeartPulse, Dumbbell, Shirt, Gem, Smartphone, Watch, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { getLiveCategoryProducts } from "@/actions/marketplace";

// CATEGORY METADATA WITH VECTOR ICONS & UNSPLASH HERO IMAGES
const CATEGORY_DATA: Record<string, { name: string; Icon: any; bg: string; heroImage: string; description: string; subcategories: string[] }> = {
  food: {
    name: "Food & Meals",
    Icon: Utensils,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Delicious freshly prepared meals from top campus kitchens and restaurants.",
    subcategories: ["All", "Rice & Meals", "Fast Food", "Pizza & Suya", "Pastries"],
  },
  snacks: {
    name: "Snacks & Treats",
    Icon: Cookie,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=1200&q=80",
    description: "Quick bites, popcorn, chips, nuts, and sweet treats for lectures and study sessions.",
    subcategories: ["All", "Chips & Popcorn", "Chocolates", "Biscuits", "Traditional Snacks"],
  },
  drinks: {
    name: "Drinks & Beverages",
    Icon: Coffee,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    description: "Chilled juices, sodas, energy drinks, water, and smoothies.",
    subcategories: ["All", "Fresh Juices", "Soft Drinks", "Energy Drinks", "Smoothies", "Water"],
  },
  groceries: {
    name: "Groceries & Provisions",
    Icon: ShoppingCart,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    description: "Dorm essentials, noodles, canned goods, milk, sugar, and daily cooking items.",
    subcategories: ["All", "Noodles & Pasta", "Dairy & Breakfast", "Canned Goods", "Toiletries"],
  },
  pastries: {
    name: "Pastries & Bakery",
    Icon: Cake,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    description: "Freshly baked meat pies, cakes, donuts, and bread.",
    subcategories: ["All", "Pies & Rolls", "Cakes & Donuts", "Fresh Bread"],
  },
  stationery: {
    name: "Stationery & Books",
    Icon: BookOpen,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    description: "Lecture exercise books, pens, sticky notes, files, and exam materials.",
    subcategories: ["All", "Note Books", "Pens & Pencils", "Files & Accessories"],
  },
  care: {
    name: "Personal Care",
    Icon: HeartPulse,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    description: "Skincare, soaps, hair care, and personal hygiene essentials.",
    subcategories: ["All", "Skincare", "Soaps & Wash", "Hair Care"],
  },
  sports: {
    name: "Sports & Fitness",
    Icon: Dumbbell,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    description: "Football boots, gym resistance bands, sports jerseys, and athletic gear.",
    subcategories: ["All", "Football & Boots", "Gym Gear", "Jerseys"],
  },
  wears: {
    name: "Fashion & Wears",
    Icon: Shirt,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
    description: "Trendy hoodies, oversized tees, sneakers, and casual campus wear.",
    subcategories: ["All", "Hoodies & Jackets", "T-Shirts", "Sneakers"],
  },
  jewelries: {
    name: "Jewelries & Ice",
    Icon: Gem,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    description: "Cuban chains, iced rings, bracelets, and stylish pendants.",
    subcategories: ["All", "Chains & Necklaces", "Rings", "Bracelets"],
  },
  gadgets: {
    name: "Tech & Gadgets",
    Icon: Smartphone,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    description: "Power banks, wireless earbuds, charging cables, and phone stands.",
    subcategories: ["All", "Power Banks", "Earbuds", "Cables"],
  },
  accessories: {
    name: "Fashion Accessories",
    Icon: Watch,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    description: "Smartwatches, sunglasses, tote bags, caps, and leather belts.",
    subcategories: ["All", "Watches", "Sunglasses", "Bags & Caps"],
  },
  electronics: {
    name: "Electronics & Appliances",
    Icon: Zap,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    description: "Rechargeable study lamps, electric kettles, room fans, and Bluetooth speakers.",
    subcategories: ["All", "Study Lamps", "Kettles & Cooking", "Speakers & Audio"],
  },
};

const CATEGORY_PRODUCTS: Record<string, Array<{
  id: string;
  name: string;
  price: number;
  vendorId: string;
  vendorName: string;
  image: string;
  description: string;
  subcategory: string;
  isAvailable: boolean;
}>> = {
  food: [
    {
      id: "f1",
      name: "Jollof Rice with Chicken & Plantain",
      price: 3500,
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
    {
      id: "f2",
      name: "Spicy Beef Suya Pizza - Medium",
      price: 6500,
      vendorId: "v4",
      vendorName: "Pizza Hub",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
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
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
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
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
      subcategory: "Fast Food",
      isAvailable: true,
    },
    {
      id: "f5",
      name: "Egusi Soup with Pounded Yam & Beef",
      price: 3800,
      vendorId: "v1",
      vendorName: "Mama Cass",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      description: "Rich melon seed egusi soup garnished with pumpkin leaves and served with smooth pounded yam.",
      subcategory: "Rice & Meals",
      isAvailable: true,
    },
  ],
  snacks: [
    {
      id: "s1",
      name: "Golden Plantain Chips 150g",
      price: 800,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
      description: "Crispy, naturally sweet fried plantain chips sliced thin.",
      subcategory: "Chips & Popcorn",
      isAvailable: true,
    },
    {
      id: "s2",
      name: "Gourmet Sweet & Butter Popcorn",
      price: 1200,
      vendorId: "v2",
      vendorName: "Fresh Squeeze",
      image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80",
      description: "Freshly popped cinema-style sweet and butter coated popcorn.",
      subcategory: "Chips & Popcorn",
      isAvailable: true,
    },
    {
      id: "s3",
      name: "Crunchy Roasted Groundnuts 250g",
      price: 1000,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      description: "Locally roasted salted groundnuts, perfect pairing for snacks and drinking garri.",
      subcategory: "Traditional Snacks",
      isAvailable: true,
    },
    {
      id: "s4",
      name: "Cadbury Dairy Milk & Snickers Duo",
      price: 1500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
      description: "Creamy milk chocolate bar paired with caramel peanut Snickers.",
      subcategory: "Chocolates",
      isAvailable: true,
    },
    {
      id: "s5",
      name: "Spicy Crunchy Chin Chin Jar 500g",
      price: 1800,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      description: "Traditional crunchy golden fried chin chin in a sealed storage tub.",
      subcategory: "Traditional Snacks",
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
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
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
      image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80",
      description: "Blended fresh mango, pineapple, and Greek yogurt.",
      subcategory: "Smoothies",
      isAvailable: true,
    },
    {
      id: "d3",
      name: "Monster Energy Drink 500ml Can",
      price: 1500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=800&q=80",
      description: "Ice cold carbonated energy boost for late-night study and exams.",
      subcategory: "Energy Drinks",
      isAvailable: true,
    },
    {
      id: "d4",
      name: "Chilled Coca-Cola & Sprite 50cl (Pack of 2)",
      price: 900,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80",
      description: "Chilled classic soft drinks in convenient plastic bottles.",
      subcategory: "Soft Drinks",
      isAvailable: true,
    },
    {
      id: "d5",
      name: "Eva Natural Spring Water 75cl (Pack of 6)",
      price: 1500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
      description: "Pure bottled hydration delivered directly to your hostel room.",
      subcategory: "Water",
      isAvailable: true,
    },
  ],
  groceries: [
    {
      id: "gr1",
      name: "Indomie Super Pack (Carton of 40)",
      price: 14500,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
      description: "Carton of Indomie Instant Noodles Super Pack 120g.",
      subcategory: "Noodles & Pasta",
      isAvailable: true,
    },
    {
      id: "gr2",
      name: "Peak Evaporated Milk Tins (Pack of 6)",
      price: 4200,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
      description: "Rich creamy full cream milk tins for morning tea and breakfast cereals.",
      subcategory: "Dairy & Breakfast",
      isAvailable: true,
    },
    {
      id: "gr3",
      name: "Milo Energy Food Drink 500g Refill",
      price: 3800,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
      description: "Nourishing chocolate malt energy drink with vitamins and minerals.",
      subcategory: "Dairy & Breakfast",
      isAvailable: true,
    },
    {
      id: "gr4",
      name: "Golden Penny Semovita 2kg Bag",
      price: 3600,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      description: "Fortified premium wheat semovita for wholesome campus swallow meals.",
      subcategory: "Noodles & Pasta",
      isAvailable: true,
    },
    {
      id: "gr5",
      name: "Morning Fresh Antibacterial Dish Soap 1L",
      price: 2200,
      vendorId: "v7",
      vendorName: "Campus Mart",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      description: "Super degreasing dishwashing liquid for quick hostel kitchen cleanup.",
      subcategory: "Toiletries",
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
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      description: "Flaky golden crust filled with seasoned minced beef, potatoes, and carrots.",
      subcategory: "Pies & Rolls",
      isAvailable: true,
    },
    {
      id: "pas2",
      name: "Glazed Ring Donuts (Box of 4)",
      price: 2800,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80",
      description: "Fluffy yeast donuts topped with vanilla glaze and chocolate drizzle.",
      subcategory: "Cakes & Donuts",
      isAvailable: true,
    },
    {
      id: "pas3",
      name: "Freshly Baked Gourmet Butter Bread",
      price: 1400,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80",
      description: "Soft, sweet, and aromatic loaf of sliced butter bread baked fresh daily.",
      subcategory: "Fresh Bread",
      isAvailable: true,
    },
    {
      id: "pas4",
      name: "Spicy Chicken Sausage Roll (Pack of 3)",
      price: 1800,
      vendorId: "v8",
      vendorName: "Tasty Bakes",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      description: "Crispy pastry rolls stuffed with spiced chicken sausage filling.",
      subcategory: "Pies & Rolls",
      isAvailable: true,
    },
  ],
  stationery: [
    {
      id: "st1",
      name: "A4 Ruled Note Books 60 Leaves (Pack of 5)",
      price: 2500,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      description: "High quality 60-leaf ruled exercise notebooks for university lectures and revision.",
      subcategory: "Note Books",
      isAvailable: true,
    },
    {
      id: "st2",
      name: "Schneider & Pilot Black Gel Pens (Pack of 10)",
      price: 1800,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
      description: "Smooth flowing 0.7mm quick-dry black ink pens for exams and fast note taking.",
      subcategory: "Pens & Pencils",
      isAvailable: true,
    },
    {
      id: "st3",
      name: "Casio FX-991ES Plus Scientific Calculator",
      price: 12500,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=800&q=80",
      description: "Original natural textbook display calculator for Engineering, Sciences, and Math courses.",
      subcategory: "Files & Accessories",
      isAvailable: true,
    },
    {
      id: "st4",
      name: "Fluorescent Highlighter Markers (Set of 6)",
      price: 1600,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=800&q=80",
      description: "Assorted neon colors for highlighting lecture textbooks and notes without bleed-through.",
      subcategory: "Pens & Pencils",
      isAvailable: true,
    },
    {
      id: "st5",
      name: "Clear Document Holder & Exam Clipboard",
      price: 1200,
      vendorId: "v3",
      vendorName: "Campus Books",
      image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
      description: "Rigid plastic transparent clipboard with metal grip clamp for exams and coursework.",
      subcategory: "Files & Accessories",
      isAvailable: true,
    },
  ],
  care: [
    {
      id: "c1",
      name: "Moisturizing Cocoa Butter Body Lotion 400ml",
      price: 3200,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      description: "Deep nourishing body lotion for all skin types, restores dry campus skin.",
      subcategory: "Skincare",
      isAvailable: true,
    },
    {
      id: "c2",
      name: "Dettol Cool Antibacterial Body Wash 500ml",
      price: 3400,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://images.unsplash.com/photo-1608248597359-2144d03e5c94?auto=format&fit=crop&w=800&q=80",
      description: "Refreshing menthol scented shower gel with 100% germ protection.",
      subcategory: "Soaps & Wash",
      isAvailable: true,
    },
    {
      id: "c3",
      name: "Oral-B Complete Clean Toothpaste + Brush Set",
      price: 1800,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://images.unsplash.com/photo-1559591937-e1032b492025?auto=format&fit=crop&w=800&q=80",
      description: "Pro-Expert oral care protection with medium-bristle ergonomic toothbrush.",
      subcategory: "Soaps & Wash",
      isAvailable: true,
    },
    {
      id: "c4",
      name: "Nivea Men / Women Roll-On Deodorant 50ml",
      price: 2400,
      vendorId: "v9",
      vendorName: "PharmaCare",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80",
      description: "48-hour anti-perspirant protection with zero white marks on clothing.",
      subcategory: "Skincare",
      isAvailable: true,
    },
  ],
  sports: [
    {
      id: "sp1",
      name: "Nike Pro Turf Football Boots (Size 40-45)",
      price: 18500,
      vendorId: "v10",
      vendorName: "Campus Sports",
      image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
      description: "Durable artificial turf rubber cleats designed for hostel match fixtures.",
      subcategory: "Football & Boots",
      isAvailable: true,
    },
    {
      id: "sp2",
      name: "Heavy Duty Latex Resistance Bands (Set of 5)",
      price: 5500,
      vendorId: "v10",
      vendorName: "Campus Sports",
      image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80",
      description: "Color-coded workout resistance loops for dorm fitness, stretching, and strength.",
      subcategory: "Gym Gear",
      isAvailable: true,
    },
    {
      id: "sp3",
      name: "Club Fan Jersey - Breathable Polyester",
      price: 7500,
      vendorId: "v10",
      vendorName: "Campus Sports",
      image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
      description: "Premium moisture-wicking football jersey with embroidered club badge.",
      subcategory: "Jerseys",
      isAvailable: true,
    },
    {
      id: "sp4",
      name: "Non-Slip Yoga & Floor Exercise Mat (6mm)",
      price: 6800,
      vendorId: "v10",
      vendorName: "Campus Sports",
      image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80",
      description: "High-density cushioned mat with carrying strap for room workouts.",
      subcategory: "Gym Gear",
      isAvailable: true,
    },
  ],
  wears: [
    {
      id: "w1",
      name: "Oversized Vintage Graphic Streetwear Hoodie",
      price: 12500,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      description: "Heavyweight fleece lined hoodie designed for cozy lectures and cool evenings.",
      subcategory: "Hoodies & Jackets",
      isAvailable: true,
    },
    {
      id: "w2",
      name: "240GSM Heavy Cotton Boxy Tee",
      price: 6500,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      description: "Thick drop-shoulder unisex cotton t-shirt with ribbed collar.",
      subcategory: "T-Shirts",
      isAvailable: true,
    },
    {
      id: "w3",
      name: "Classic Campus Slip-On Slides",
      price: 5200,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
      description: "Cushioned EVA foam slides for walking around the hostel and campus.",
      subcategory: "Sneakers",
      isAvailable: true,
    },
    {
      id: "w4",
      name: "High-Top Canvas Street Sneakers",
      price: 14000,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
      description: "Durable vulcanized rubber sole skate sneakers with contrast stitching.",
      subcategory: "Sneakers",
      isAvailable: true,
    },
  ],
  jewelries: [
    {
      id: "j1",
      name: "Iced Out Cuban Link Chain 12mm",
      price: 8500,
      vendorId: "v12",
      vendorName: "Ice Drip Jewelry",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      description: "Stainless steel triple plated Cuban link chain with prong-set CZ stones.",
      subcategory: "Chains & Necklaces",
      isAvailable: true,
    },
    {
      id: "j2",
      name: "Titanium Steel Minimalist Ring Set (Pack of 3)",
      price: 3800,
      vendorId: "v12",
      vendorName: "Ice Drip Jewelry",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      description: "Waterproof non-tarnish band rings in matte black, silver, and gold finish.",
      subcategory: "Rings",
      isAvailable: true,
    },
    {
      id: "j3",
      name: "Layered Pearl & Stainless Steel Choker",
      price: 4500,
      vendorId: "v12",
      vendorName: "Ice Drip Jewelry",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      description: "Modern freshwater-style pearl necklace with magnetic clasp.",
      subcategory: "Chains & Necklaces",
      isAvailable: true,
    },
    {
      id: "j4",
      name: "Braided Leather Magnetic Bracelet",
      price: 3200,
      vendorId: "v12",
      vendorName: "Ice Drip Jewelry",
      image: "https://images.unsplash.com/photo-1611591475152-4c09a15cfa69?auto=format&fit=crop&w=800&q=80",
      description: "Genuine woven leather wristband with brushed stainless steel clasp.",
      subcategory: "Bracelets",
      isAvailable: true,
    },
  ],
  gadgets: [
    {
      id: "gd1",
      name: "Fast Charging 20,000mAh Power Bank with LED",
      price: 13500,
      vendorId: "v13",
      vendorName: "Tech Hub Campus",
      image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
      description: "22.5W Fast charge power bank with dual USB-C, QuickCharge 3.0, and digital battery indicator.",
      subcategory: "Power Banks",
      isAvailable: true,
    },
    {
      id: "gd2",
      name: "Wireless ANC Bluetooth Earbuds (30h Playtime)",
      price: 9800,
      vendorId: "v13",
      vendorName: "Tech Hub Campus",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      description: "Noise cancelling earbuds with deep bass and instant Bluetooth 5.3 pairing.",
      subcategory: "Earbuds",
      isAvailable: true,
    },
    {
      id: "gd3",
      name: "Braided 65W 3-in-1 Fast Charging Cable (Type-C / Lightning / Micro)",
      price: 2500,
      vendorId: "v13",
      vendorName: "Tech Hub Campus",
      image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
      description: "Reinforced nylon braided multi-connector charging cable.",
      subcategory: "Cables",
      isAvailable: true,
    },
    {
      id: "gd4",
      name: "Adjustable Aluminum Phone & Tablet Desk Stand",
      price: 3200,
      vendorId: "v13",
      vendorName: "Tech Hub Campus",
      image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80",
      description: "Foldable metal desktop cradle for hands-free online lectures and video calls.",
      subcategory: "Cables",
      isAvailable: true,
    },
  ],
  accessories: [
    {
      id: "ac1",
      name: "Smart Watch Series 8 (Full Touch Display)",
      price: 16000,
      vendorId: "v13",
      vendorName: "Tech Hub Campus",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      description: "Bluetooth call smartwatch with heart rate, sleep monitor, and notification sync.",
      subcategory: "Watches",
      isAvailable: true,
    },
    {
      id: "ac2",
      name: "Polarized UV400 Vintage Aviator Sunglasses",
      price: 4200,
      vendorId: "v12",
      vendorName: "Ice Drip Jewelry",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
      description: "UV-blocking tinted sunglasses with lightweight metallic frame and protective case.",
      subcategory: "Sunglasses",
      isAvailable: true,
    },
    {
      id: "ac3",
      name: "Heavy Duty Canvas Campus Tote Bag with Zipper",
      price: 4500,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      description: "Spacious aesthetic tote bag that easily fits laptops, notebooks, and provisions.",
      subcategory: "Bags & Caps",
      isAvailable: true,
    },
    {
      id: "ac4",
      name: "Embroidered 100% Cotton Baseball Cap",
      price: 3500,
      vendorId: "v11",
      vendorName: "Urban Campus Wears",
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
      description: "Structured 6-panel unisex dad hat with adjustable brass buckle strap.",
      subcategory: "Bags & Caps",
      isAvailable: true,
    },
  ],
  electronics: [
    {
      id: "el1",
      name: "Rechargeable LED Desk Study Lamp (12h Battery)",
      price: 5500,
      vendorId: "v14",
      vendorName: "Hostel Electronics",
      image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80",
      description: "Multi-level touch brightness eye-protection desk lamp with long battery life during blackouts.",
      subcategory: "Study Lamps",
      isAvailable: true,
    },
    {
      id: "el2",
      name: "2.0L Stainless Steel Fast Boiling Electric Kettle",
      price: 8500,
      vendorId: "v14",
      vendorName: "Hostel Electronics",
      image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
      description: "Automatic shut-off rapid boil water kettle for morning tea, coffee, and noodles.",
      subcategory: "Kettles & Cooking",
      isAvailable: true,
    },
    {
      id: "el3",
      name: "Portable Bluetooth 5.0 Room Speaker with Heavy Bass",
      price: 8500,
      vendorId: "v14",
      vendorName: "Hostel Electronics",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
      description: "Compact wireless stereo sound speaker with FM radio and TF card slot.",
      subcategory: "Speakers & Audio",
      isAvailable: true,
    },
    {
      id: "el4",
      name: "6-Way Surge Protector Power Extension Strip (3M Cord)",
      price: 4800,
      vendorId: "v14",
      vendorName: "Hostel Electronics",
      image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80",
      description: "Individual switch power extension board with surge protection for laptops and phones.",
      subcategory: "Kettles & Cooking",
      isAvailable: true,
    },
  ],
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const category = CATEGORY_DATA[slug] || {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    Icon: Utensils,
    bg: "bg-[#1E1B4B]",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "Explore all products in this category on campus.",
    subcategories: ["All"],
  };

  const CategoryIcon = category.Icon;
  const defaultProducts = CATEGORY_PRODUCTS[slug] || CATEGORY_PRODUCTS.food;
  const [rawProducts, setRawProducts] = useState(defaultProducts);

  useEffect(() => {
    let active = true;
    async function loadCategoryProducts() {
      try {
        const res = await getLiveCategoryProducts(slug);
        if (active && res.success && res.products.length > 0) {
          const formatted = res.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            description: p.description || "",
            isAvailable: p.isAvailable,
            rating: 4.8,
            vendorId: p.storeId,
            vendorName: p.store?.name || "Campus Vendor",
            subcategory: "All",
          }));
          setRawProducts(formatted);
        }
      } catch (err) {
        console.error("Error loading category products:", err);
      }
    }

    loadCategoryProducts();
    return () => {
      active = false;
    };
  }, [slug]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "name">("popular");
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const filteredProducts = useMemo(() => {
    const list = rawProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubcat = selectedSubcategory === "All" || product.subcategory === selectedSubcategory;
      return matchesSearch && matchesSubcat;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [rawProducts, searchQuery, selectedSubcategory, sortBy]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      {/* CATEGORY HEADER BANNER WITH SCROLL ANIMATION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] dark:bg-[#121215] text-white px-5 pt-8 pb-10 rounded-b-[32px] shadow-md overflow-hidden border-b dark:border-zinc-800/80"
      >
        <Image
          src={category.heroImage}
          alt={category.name}
          fill
          priority
          className="object-cover opacity-30"
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 dark:bg-zinc-800/80 hover:bg-white/30 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24] text-[#312E81] flex items-center justify-center shadow-md">
                <CategoryIcon size={22} strokeWidth={2.4} />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white drop-shadow-sm">
                {category.name}
              </h1>
            </div>
          </div>
          <p className="text-slate-200 dark:text-zinc-300 text-xs md:text-sm font-normal max-w-xl">
            {category.description}
          </p>

          {/* Search bar inside header */}
          <div className="relative mt-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/95 dark:bg-zinc-800/95 text-slate-800 dark:text-zinc-100 text-sm font-medium border border-white/40 dark:border-zinc-700/60 shadow-md focus:outline-none focus:ring-2 focus:ring-[#312E81] dark:focus:ring-indigo-500 backdrop-blur-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="px-5 md:px-8 max-w-5xl mx-auto w-full mt-6 space-y-6">
        
        {/* SUBCATEGORY PILLS */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {category.subcategories.map((subcat) => (
            <button
              key={subcat}
              onClick={() => setSelectedSubcategory(subcat)}
              className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all border ${
                selectedSubcategory === subcat
                  ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-[#71717A] dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              {subcat}
            </button>
          ))}
        </motion.div>

        {/* PRODUCTS COUNT & SORT BAR */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs md:text-sm font-body font-semibold text-[#71717A] dark:text-zinc-400">
            Showing <span className="text-[#18181B] dark:text-zinc-100 font-extrabold">{filteredProducts.length}</span> items
          </p>
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 shadow-xs">
            <ArrowUpDown size={13} className="text-[#71717A] dark:text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-body font-bold text-[#18181B] dark:text-zinc-200 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="popular">Sort: Popular 🔥</option>
              <option value="price-asc">Price: Low to High ₦</option>
              <option value="price-desc">Price: High to Low ₦</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* PRODUCTS GRID WITH SCROLL ANIMATION - LINKS DIRECTLY TO /product/[id] */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
            onAddProduct={handleAddProduct}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8"
          >
            <CategoryIcon size={40} className="mx-auto mb-3 text-[#312E81] dark:text-indigo-400" />
            <h3 className="font-heading font-bold text-lg text-[#18181B] dark:text-zinc-100">No items found</h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-body">Try switching subcategories or adjusting your search query.</p>
          </motion.div>
        )}
      </div>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] dark:text-zinc-300 text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and add this item from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] dark:bg-indigo-600 text-white font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 font-semibold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>
    </div>
  );
}
