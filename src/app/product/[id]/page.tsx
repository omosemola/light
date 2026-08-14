"use client";

import { useState, use, useEffect } from "react";
import { ArrowLeft, Star, Clock, Heart, Plus, Store, CheckCircle2, MessageSquare, ThumbsUp, Send, ChevronLeft, ChevronRight, Quote, Info, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { MerchantChatModal } from "@/components/ui/MerchantChatModal";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { CustomCartIcon } from "@/components/icons/CustomCartIcon";
import { getLiveProductById } from "@/actions/marketplace";

interface Review {
  id: string;
  author: string;
  avatar: string;
  hostel: string;
  rating: number;
  date: string;
  comment: string;
  likes: number;
  isLiked?: boolean;
}

// MOCK REVIEWS DATABASE
const INITIAL_REVIEWS: Record<string, Review[]> = {
  p1: [
    {
      id: "r1",
      author: "David O.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      hostel: "Mellanby Hall",
      rating: 5,
      date: "2 hours ago",
      comment: "Portion size was huge! The chicken leg was properly grilled and the pepper sauce was spicy and authentic. Delivery took under 15 mins to Mellanby lodge.",
      likes: 14,
    },
    {
      id: "r2",
      author: "Blessing A.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      hostel: "Queen Elizabeth Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Mama Cass never disappoints. Hot Jollof rice right after a 3-hour GST lecture is pure bliss. Packaging was clean and leak-proof!",
      likes: 8,
    },
    {
      id: "r3",
      author: "Emmanuel K.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      hostel: "Tedder Hall",
      rating: 4,
      date: "3 days ago",
      comment: "Food came piping hot and well packaged. Plantains were sweet and perfectly fried. Will definitely reorder.",
      likes: 5,
    },
  ],
  p2: [
    {
      id: "r4",
      author: "Chidimma N.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      hostel: "Idia Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Extremely refreshing juice! No sugar added, pure orange pulp. Great for hot afternoon lectures.",
      likes: 9,
    },
  ],
};

// MOCK PRODUCTS DATABASE
const ALL_PRODUCTS: Record<string, {
  id: string;
  name: string;
  price: number;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  image: string;
  description: string;
  details: string[];
  prepTime: string;
  isAvailable: boolean;
  category: string;
  rating: number;
  reviewsCount: number;
}> = {
  p1: {
    id: "p1",
    name: "Jollof Rice with Chicken & Plantain",
    price: 3500,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and a grilled chicken leg. Prepared fresh daily with premium spice blend.",
    details: ["Includes 1x Jumbo Chicken Leg", "4x Fried Plantain Slices", "Option for Extra Pepper Sauce", "Halal Certified"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 128,
  },
  p2: {
    id: "p2",
    name: "Cold Pressed Orange Juice 50cl",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    description: "100% natural, freshly squeezed orange juice with no added sugar, artificial flavors, or water dilution. Rich in Vitamin C.",
    details: ["100% Pure Fresh Fruit", "No Added Sugar", "Chilled Packaging", "Keep Refrigerated"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.8,
    reviewsCount: 94,
  },
  p3: {
    id: "p3",
    name: "A4 Note Book 60 Leaves (Pack of 5)",
    price: 2500,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description: "High quality 60-leaf ruled exercise notebooks designed for lecture notes, assignments, and exam revisions.",
    details: ["Pack of 5 Exercise Books", "70gsm Paper", "Sturdy Paperboard Covers", "Standard Ruled Margin"],
    prepTime: "10 mins",
    isAvailable: false,
    category: "stationery",
    rating: 4.7,
    reviewsCount: 42,
  },
  p4: {
    id: "p4",
    name: "Spicy Beef Suya Pizza - Medium",
    price: 6500,
    vendorId: "v4",
    vendorName: "Pizza Hub",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    description: "Freshly baked handcrafted pizza topped with fiery beef suya chunks, caramelized onions, green peppers, and melted mozzarella.",
    details: ["Medium 10-inch Diameter", "Suya Spice Crust", "100% Real Mozzarella", "Hot & Crispy"],
    prepTime: "25-30 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 215,
  },
  f3: {
    id: "f3",
    name: "Fried Rice Special with Turkey",
    price: 4200,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Seasoned fried rice cooked with mixed vegetables and served with seasoned fried turkey wing.",
    details: ["Includes 1x Fried Turkey Wing", "Mixed Veggies", "Coleslaw Portion"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.8,
    reviewsCount: 76,
  },
  f4: {
    id: "f4",
    name: "Crispy Chicken Burger & Chips",
    price: 3800,
    vendorId: "v5",
    vendorName: "Campus Bites",
    vendorRating: 4.6,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    description: "Crispy fried chicken fillet topped with mayo, lettuce, and served with golden fries.",
    details: ["Crispy Fillet Burger", "Large Salted Fries", "Garlic Mayo Dip"],
    prepTime: "15 mins",
    isAvailable: true,
    category: "food",
    rating: 4.6,
    reviewsCount: 88,
  },
  s1: {
    id: "s1",
    name: "Golden Plantain Chips 150g",
    price: 800,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
    description: "Crispy, naturally sweet fried plantain chips sliced thin.",
    details: ["150g Sealed Pouch", "Lightly Salted", "Zero Preservatives"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "snacks",
    rating: 4.8,
    reviewsCount: 52,
  },
  d2: {
    id: "d2",
    name: "Tropical Mango Pineapple Smoothie",
    price: 1800,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80",
    description: "Blended fresh mango, pineapple, and Greek yogurt served ice cold.",
    details: ["50cl Chilled Cup", "Fresh Fruit Blend", "Greek Yogurt Base"],
    prepTime: "5-10 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.9,
    reviewsCount: 110,
  },
  g1: {
    id: "g1",
    name: "Indomie Super Pack (Carton of 40)",
    price: 14500,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
    description: "Carton of Indomie Instant Noodles Super Pack 120g.",
    details: ["40 Packs x 120g", "Chicken Flavor", "Sealed Factory Box"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "groceries",
    rating: 4.7,
    reviewsCount: 34,
  },
  pas1: {
    id: "pas1",
    name: "Jumbo Beef Meat Pie",
    price: 1200,
    vendorId: "v8",
    vendorName: "Tasty Bakes",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    description: "Flaky golden crust filled with seasoned minced beef, potatoes, and carrots.",
    details: ["Freshly Baked", "Rich Beef Filling", "Hot Packaging"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "pastries",
    rating: 4.9,
    reviewsCount: 145,
  },
  c1: {
    id: "c1",
    name: "Moisturizing Cocoa Butter Lotion 400ml",
    price: 3200,
    vendorId: "v9",
    vendorName: "PharmaCare",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "Deep nourishing body lotion for all skin types.",
    details: ["400ml Bottle", "Rich Cocoa Butter Formula", "Dermatologist Tested"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "care",
    rating: 4.8,
    reviewsCount: 29,
  },
  p1_3: {
    id: "p1_3",
    name: "Peppered Chicken Drumsticks (3 pcs)",
    price: 2800,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 5.0,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    description: "Tender chicken drumsticks tossed in hot spicy ATA din din sauce.",
    details: ["3x Jumbo Drumsticks", "Spicy Pepper Glaze", "Hot Foil Wrap"],
    prepTime: "10-15 mins",
    isAvailable: true,
    category: "food",
    rating: 5.0,
    reviewsCount: 64,
  },
  sp1: {
    id: "sp1",
    name: "Nike Pro Turf Football Boots",
    price: 18500,
    vendorId: "v10",
    vendorName: "Campus Sports",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
    description: "Durable artificial turf boots designed for campus match fixtures.",
    details: ["Turf Rubber Sole", "Lightweight Upper", "Reinforced Heel"],
    prepTime: "15 mins",
    isAvailable: true,
    category: "sports",
    rating: 4.9,
    reviewsCount: 42,
  },
  w1: {
    id: "w1",
    name: "Oversized Vintage Graphic Hoodie",
    price: 12500,
    vendorId: "v11",
    vendorName: "Urban Campus Wears",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    description: "Heavyweight fleece lined hoodie designed for lecture comfort.",
    details: ["100% Heavy Cotton", "Fleece Lined Hood", "Kangaroo Pocket"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "wears",
    rating: 4.8,
    reviewsCount: 65,
  },
  j1: {
    id: "j1",
    name: "Iced Out Cuban Link Chain 12mm",
    price: 8500,
    vendorId: "v12",
    vendorName: "Ice Drip Jewelry",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    description: "Stainless steel triple plated Cuban link chain with cz stones.",
    details: ["12mm Width", "Triple Plated Gold/Silver", "Secure Box Lock"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "jewelries",
    rating: 4.9,
    reviewsCount: 98,
  },
  gd1: {
    id: "gd1",
    name: "Fast Charging 20,000mAh Power Bank",
    price: 13500,
    vendorId: "v13",
    vendorName: "Tech Hub Campus",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
    description: "22.5W Fast charge power bank with dual USB-C and LED display.",
    details: ["20,000mAh Lithium Capacity", "22.5W PD Fast Charge", "Digital LED Meter"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "gadgets",
    rating: 4.9,
    reviewsCount: 154,
  },
  ac1: {
    id: "ac1",
    name: "Smart Watch Series 8 (Full Touch)",
    price: 16000,
    vendorId: "v13",
    vendorName: "Tech Hub Campus",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    description: "Bluetooth call smartwatch with heart rate & sleep tracker.",
    details: ["1.95-inch HD Display", "IP68 Waterproof", "Wireless Charging"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "accessories",
    rating: 4.8,
    reviewsCount: 78,
  },
  el1: {
    id: "el1",
    name: "Rechargeable LED Desk Study Lamp",
    price: 5500,
    vendorId: "v14",
    vendorName: "Hostel Electronics",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80",
    description: "Multi-level brightness eye protection LED lamp with 12h battery.",
    details: ["Touch Dimmer Control", "3000mAh Battery", "3 Color Temperature Modes"],
    prepTime: "10 mins",
    isAvailable: true,
    category: "electronics",
    rating: 4.7,
    reviewsCount: 51,
  },
  f5: {
    id: "f5",
    name: "Egusi Soup with Pounded Yam & Beef",
    price: 3800,
    vendorId: "v1",
    vendorName: "Mama Cass",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Rich melon seed egusi soup garnished with pumpkin leaves and served with smooth pounded yam.",
    details: ["Fresh Melon Seed Egusi", "2x Beef Cuts", "Pounded Yam Wrap"],
    prepTime: "15-20 mins",
    isAvailable: true,
    category: "food",
    rating: 4.9,
    reviewsCount: 84,
  },
  s2: {
    id: "s2",
    name: "Gourmet Sweet & Butter Popcorn",
    price: 1200,
    vendorId: "v2",
    vendorName: "Fresh Squeeze",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80",
    description: "Freshly popped cinema-style sweet and butter coated popcorn.",
    details: ["Cinema-style Tub", "Sweet Butter Coating", "Freshly Popped"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "snacks",
    rating: 4.8,
    reviewsCount: 92,
  },
  s3: {
    id: "s3",
    name: "Crunchy Roasted Groundnuts 250g",
    price: 1000,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    description: "Locally roasted salted groundnuts, perfect pairing for snacks and drinking garri.",
    details: ["250g Sealed Bottle", "Lightly Salted", "Extra Crunchy"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "snacks",
    rating: 4.7,
    reviewsCount: 45,
  },
  s4: {
    id: "s4",
    name: "Cadbury Dairy Milk & Snickers Duo",
    price: 1500,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
    description: "Creamy milk chocolate bar paired with caramel peanut Snickers.",
    details: ["1x Dairy Milk 45g", "1x Snickers Bar 50g", "Imported Chocolate"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "snacks",
    rating: 4.9,
    reviewsCount: 110,
  },
  s5: {
    id: "s5",
    name: "Spicy Crunchy Chin Chin Jar 500g",
    price: 1800,
    vendorId: "v8",
    vendorName: "Tasty Bakes",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    description: "Traditional crunchy golden fried chin chin in a sealed storage tub.",
    details: ["500g Plastic Tub", "Nutmeg Spiced", "Stays Fresh 30 Days"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "snacks",
    rating: 4.8,
    reviewsCount: 67,
  },
  d3: {
    id: "d3",
    name: "Monster Energy Drink 500ml Can",
    price: 1500,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=800&q=80",
    description: "Ice cold carbonated energy boost for late-night study and exams.",
    details: ["500ml Can", "High Caffeine & Taurine", "Chilled on Delivery"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.9,
    reviewsCount: 135,
  },
  d4: {
    id: "d4",
    name: "Chilled Coca-Cola & Sprite 50cl (Pack of 2)",
    price: 900,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80",
    description: "Chilled classic soft drinks in convenient plastic bottles.",
    details: ["1x Coca-Cola 50cl", "1x Sprite 50cl", "Ice Cold"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.8,
    reviewsCount: 88,
  },
  d5: {
    id: "d5",
    name: "Eva Natural Spring Water 75cl (Pack of 6)",
    price: 1500,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
    description: "Pure bottled hydration delivered directly to your hostel room.",
    details: ["6x 75cl Bottles", "Pure Spring Water", "Hostel Door Delivery"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "drinks",
    rating: 4.9,
    reviewsCount: 94,
  },
  gr2: {
    id: "gr2",
    name: "Peak Evaporated Milk Tins (Pack of 6)",
    price: 4200,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
    description: "Rich creamy full cream milk tins for morning tea and breakfast cereals.",
    details: ["6x 160g Tins", "Full Cream Vitamin A", "Easy-Open Top"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "groceries",
    rating: 4.9,
    reviewsCount: 52,
  },
  gr3: {
    id: "gr3",
    name: "Milo Energy Food Drink 500g Refill",
    price: 3800,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    description: "Nourishing chocolate malt energy drink with vitamins and minerals.",
    details: ["500g Sealed Pouch", "Protomalt Formula", "Activ-Go Energy"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "groceries",
    rating: 4.8,
    reviewsCount: 63,
  },
  gr4: {
    id: "gr4",
    name: "Golden Penny Semovita 2kg Bag",
    price: 3600,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    description: "Fortified premium wheat semovita for wholesome campus swallow meals.",
    details: ["2kg Bag", "Enriched with Vitamins", "Smooth Lump-Free Texture"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "groceries",
    rating: 4.7,
    reviewsCount: 39,
  },
  gr5: {
    id: "gr5",
    name: "Morning Fresh Antibacterial Dish Soap 1L",
    price: 2200,
    vendorId: "v7",
    vendorName: "Campus Mart",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    description: "Super degreasing dishwashing liquid for quick hostel kitchen cleanup.",
    details: ["1 Litre Bottle", "Antibacterial Formula", "Lemon Scent"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "groceries",
    rating: 4.9,
    reviewsCount: 71,
  },
  st2: {
    id: "st2",
    name: "Schneider & Pilot Black Gel Pens (Pack of 10)",
    price: 1800,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
    description: "Smooth flowing 0.7mm quick-dry black ink pens for exams and fast note taking.",
    details: ["Pack of 10 Pens", "0.7mm Fine Tip", "Quick-Dry Black Ink"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "stationery",
    rating: 4.9,
    reviewsCount: 112,
  },
  st3: {
    id: "st3",
    name: "Casio FX-991ES Plus Scientific Calculator",
    price: 12500,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 5.0,
    image: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=800&q=80",
    description: "Original natural textbook display calculator for Engineering, Sciences, and Math courses.",
    details: ["417 Functions", "Natural Textbook Display", "Solar + Battery Power"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "stationery",
    rating: 5.0,
    reviewsCount: 180,
  },
  st4: {
    id: "st4",
    name: "Fluorescent Highlighter Markers (Set of 6)",
    price: 1600,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=800&q=80",
    description: "Assorted neon colors for highlighting lecture textbooks and notes without bleed-through.",
    details: ["6 Neon Colors", "Chisel Tip", "Smudge-Free"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "stationery",
    rating: 4.8,
    reviewsCount: 54,
  },
  st5: {
    id: "st5",
    name: "Clear Document Holder & Exam Clipboard",
    price: 1200,
    vendorId: "v3",
    vendorName: "Campus Books",
    vendorRating: 4.7,
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
    description: "Rigid plastic transparent clipboard with metal grip clamp for exams and coursework.",
    details: ["A4 Clear Acrylic", "Strong Metal Clamp", "Exam-Hall Approved"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "stationery",
    rating: 4.7,
    reviewsCount: 38,
  },
  el2: {
    id: "el2",
    name: "2.0L Stainless Steel Fast Boiling Electric Kettle",
    price: 8500,
    vendorId: "v14",
    vendorName: "Hostel Electronics",
    vendorRating: 4.9,
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
    description: "Automatic shut-off rapid boil water kettle for morning tea, coffee, and noodles.",
    details: ["2.0 Litre Capacity", "1500W Fast Boiling", "Auto Shut-Off Safety"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "electronics",
    rating: 4.9,
    reviewsCount: 97,
  },
  el3: {
    id: "el3",
    name: "Portable Bluetooth 5.0 Room Speaker with Heavy Bass",
    price: 8500,
    vendorId: "v14",
    vendorName: "Hostel Electronics",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    description: "Compact wireless stereo sound speaker with FM radio and TF card slot.",
    details: ["10W Bass Diaphragm", "12h Battery Life", "Bluetooth 5.0 + AUX"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "electronics",
    rating: 4.8,
    reviewsCount: 81,
  },
  el4: {
    id: "el4",
    name: "6-Way Surge Protector Power Extension Strip (3M Cord)",
    price: 4800,
    vendorId: "v14",
    vendorName: "Hostel Electronics",
    vendorRating: 4.8,
    image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80",
    description: "Individual switch power extension board with surge protection for laptops and phones.",
    details: ["6 Universal Sockets", "3-Metre Heavy Duty Cord", "Surge Indicator Light"],
    prepTime: "5 mins",
    isAvailable: true,
    category: "electronics",
    rating: 4.8,
    reviewsCount: 63,
  },
};

// Aliases for IDs used across various pages
ALL_PRODUCTS.f1 = ALL_PRODUCTS.p1;
ALL_PRODUCTS.f2 = ALL_PRODUCTS.p4;
ALL_PRODUCTS.d1 = ALL_PRODUCTS.p2;
ALL_PRODUCTS.p2_2 = ALL_PRODUCTS.d2;
ALL_PRODUCTS.p1_2 = ALL_PRODUCTS.f3;
ALL_PRODUCTS.st1 = ALL_PRODUCTS.p3;
ALL_PRODUCTS.b1 = ALL_PRODUCTS.pas1;

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const defaultProduct = ALL_PRODUCTS[id] || ALL_PRODUCTS.p1;
  const [product, setProduct] = useState(defaultProduct);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // REVIEWS STATE
  const [reviewsList, setReviewsList] = useState<Review[]>(
    INITIAL_REVIEWS[defaultProduct.id] || INITIAL_REVIEWS.p1 || []
  );

  useEffect(() => {
    let active = true;
    async function loadLiveProduct() {
      try {
        const res = await getLiveProductById(id);
        if (active && res.success && res.product) {
          const p = res.product;
          setProduct({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image || defaultProduct.image,
            description: p.description || defaultProduct.description,
            vendorId: p.storeId,
            vendorName: p.store?.name || defaultProduct.vendorName,
            vendorRating: p.store?.rating || 4.9,
            details: defaultProduct.details || ["Freshly prepared on campus", "Fast delivery to all student hostels"],
            prepTime: p.store?.estimatedDelivery || "15-20 mins",
            isAvailable: p.isAvailable,
            category: p.category?.name?.toLowerCase() || "food",
            rating: p.store?.rating || 4.9,
            reviewsCount: p.store?.reviews?.length || 20,
          });
        }
      } catch (err) {
        console.error("Error loading live product:", err);
      }
    }

    loadLiveProduct();
    return () => {
      active = false;
    };
  }, [id]);

  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [studentHostel, setStudentHostel] = useState("Mellanby Hall");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);

  const { addItem, confirmAndReplaceCart } = useCartStore();

  const handleAddToCart = () => {
    let requiresConf = false;
    for (let i = 0; i < quantity; i++) {
      const result = addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
      });

      if (result.requiresConfirmation) {
        requiresConf = true;
        break;
      }
    }

    if (requiresConf) {
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

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newReviewItem: Review = {
      id: `r-${Date.now()}`,
      author: "Alex John",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      hostel: studentHostel,
      rating: newRating,
      date: "Just now",
      comment: newComment.trim(),
      likes: 0,
    };

    setReviewsList([newReviewItem, ...reviewsList]);
    setActiveReviewIndex(0); // Jump to newly added review
    setNewComment("");
    setReviewSuccessMsg(true);
    setTimeout(() => {
      setReviewSuccessMsg(false);
      setIsWriteReviewOpen(false);
    }, 1500);
  };

  const handleLikeReview = (reviewId: string) => {
    setReviewsList(
      reviewsList.map((rev) => {
        if (rev.id === reviewId) {
          const isLiked = !rev.isLiked;
          return {
            ...rev,
            isLiked,
            likes: isLiked ? rev.likes + 1 : rev.likes - 1,
          };
        }
        return rev;
      })
    );
  };

  const currentReview = reviewsList[activeReviewIndex] || reviewsList[0];

  const handleNextReview = () => {
    setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length);
  };

  const handlePrevReview = () => {
    setActiveReviewIndex((prev) => (prev - 1 + reviewsList.length) % reviewsList.length);
  };

  const rawRelated = Object.values(ALL_PRODUCTS).filter(
    (p) => p.vendorId === product.vendorId && p.id !== product.id
  );
  const relatedProducts = Array.from(
    new Map(rawRelated.map((p) => [p.id, p])).values()
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* HERO PRODUCT IMAGE WITH FULL HEIGHT & ANIMATION */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-square md:aspect-[21/9] max-h-[460px] bg-slate-900 overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/80 via-transparent to-[#18181B]/40" />

        {/* Floating Top Controls */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between max-w-5xl mx-auto z-10">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-[#18181B] dark:text-zinc-100 flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all backdrop-blur-sm ${
              isLiked ? "bg-red-500 text-white" : "bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-[#18181B] dark:text-zinc-100"
            }`}
          >
            <Heart size={20} className={isLiked ? "fill-white" : ""} />
          </button>
        </div>

        {/* Stock status overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-[#18181B]/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white font-heading font-extrabold text-sm px-4 py-2 rounded-full shadow-lg border border-red-400 uppercase tracking-wider">
              Currently Sold Out
            </span>
          </div>
        )}
      </motion.div>

      {/* MAIN CONTAINER (COMPACT SPACING & HEIGHTS) */}
      <div className="px-4 md:px-8 max-w-4xl mx-auto w-full -mt-6 relative z-20 space-y-4">
        
        {/* MAIN PRODUCT HEADER CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-lg shadow-slate-200/40 dark:shadow-none border border-white dark:border-zinc-800 space-y-3"
        >
          {/* VENDOR LINK & CHAT MERCHANT BUTTON */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Link 
                href={`/vendor/${product.vendorId}`}
                className="group/vendor inline-flex items-center gap-1.5 text-xs font-body font-semibold text-[#312E81] dark:text-indigo-300 hover:text-[#1E1B4B] dark:hover:text-white transition-colors"
                title={`Visit ${product.vendorName} Store`}
              >
                <Store size={13} className="text-[#312E81] dark:text-indigo-400 group-hover/vendor:scale-110 transition-transform shrink-0" />
                <span className="underline underline-offset-2 decoration-indigo-300 dark:decoration-indigo-600 group-hover/vendor:decoration-[#312E81]">
                  {product.vendorName}
                </span>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 font-normal group-hover/vendor:translate-x-0.5 transition-transform">
                  (Store ↗)
                </span>
              </Link>

              <button
                onClick={() => setIsChatModalOpen(true)}
                className="px-2.5 py-1 bg-[#F4F3FF] dark:bg-indigo-950/80 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-300 hover:text-white font-heading font-extrabold text-[10px] md:text-xs rounded-full border border-indigo-100 dark:border-indigo-800 transition-all flex items-center gap-1 shadow-2xs group"
                title={`Chat directly with ${product.vendorName}`}
              >
                <MessageSquare size={11} className="group-hover:scale-110 transition-transform" />
                <span>Chat Merchant</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-body text-[#71717A] dark:text-zinc-400">
              <Star size={12} className="fill-[#FBBF24] text-[#FBBF24]" />
              <span className="font-bold text-[#18181B] dark:text-zinc-100">{product.rating}</span>
              <span>({reviewsList.length})</span>
            </div>
          </div>

          {/* Title & Price */}
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-[#18181B] dark:text-zinc-100 tracking-tight leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-2xl md:text-3xl font-body font-extrabold text-[#312E81] dark:text-indigo-400">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-[#16A34A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                In Stock & Ready
              </span>
            </div>
          </div>

          {/* Prep Time Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-[#71717A] dark:text-zinc-400 font-body font-normal">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#312E81] dark:text-indigo-400" />
              <span>Prep Time: {product.prepTime}</span>
            </div>
          </div>
        </motion.div>

        {/* ELEGANT COMPACT "ABOUT THIS ITEM" DIV */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/90 dark:border-zinc-800 relative overflow-hidden space-y-3"
        >
          {/* Section Title */}
          <div className="relative z-10">
            <h3 className="font-heading font-extrabold text-lg md:text-xl text-[#18181B] dark:text-zinc-100 tracking-tight">
              About this Item
            </h3>
          </div>

          {/* Description Body (Sitting directly in parent card) */}
          <p className="text-[#18181B] dark:text-zinc-200 text-xs md:text-sm leading-relaxed font-body font-normal relative z-10">
            {product.description}
          </p>

          {/* ADD TO CART BUTTON WITH STANDALONE CIRCULAR "+" BUTTON BESIDE IT */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2.5 relative z-10">
            
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="h-14 px-8 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 group flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all">
                <CustomCartIcon size={17} strokeWidth={2.2} />
              </div>
              
              <span className="font-heading font-extrabold tracking-wider text-sm md:text-base text-white">
                Add to Cart
              </span>

              {quantity > 1 && (
                <span className="bg-[#FBBF24] text-[#1E1B4B] font-heading font-extrabold text-xs px-2 py-0.5 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                  ×{quantity}
                </span>
              )}
            </button>

            {/* STANDALONE "+" BUTTON */}
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-14 h-14 rounded-2xl bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white border border-indigo-100/90 dark:border-zinc-700 flex items-center justify-center shadow-xs active:scale-90 transition-all shrink-0 group"
              title="Increase Quantity"
              aria-label="Increase Quantity"
            >
              <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

          </div>
        </motion.div>

        {/* SINGLE REVIEW CAROUSEL TESTIMONIAL CARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200/80 dark:border-zinc-800 space-y-3.5 relative overflow-hidden mt-[200px]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[#312E81] dark:text-indigo-400" />
              <h3 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100">
                Student Reviews ({reviewsList.length})
              </h3>
            </div>

            {/* WRITE REVIEW BUTTON */}
            <button
              onClick={() => setIsWriteReviewOpen(true)}
              className="px-3 py-1.5 bg-[#312E81] dark:bg-indigo-600 hover:bg-[#1E1B4B] dark:hover:bg-indigo-500 text-white font-heading font-bold text-[11px] md:text-xs whitespace-nowrap rounded-full shadow-sm hover:shadow-indigo-900/30 active:scale-95 transition-all flex items-center gap-1.5 border border-indigo-700/50 group"
            >
              <div className="w-4.5 h-4.5 rounded-full bg-[#FBBF24] text-[#312E81] flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                <Edit3 size={10} className="text-[#312E81]" />
              </div>
              <span>Write Review</span>
            </button>
          </div>

          {/* SINGLE TESTIMONIAL DISPLAY SITTING DIRECTLY IN PARENT DIV */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {currentReview && (
                <motion.div
                  key={currentReview.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative space-y-3 pt-1"
                >
                  {/* Decorative Background Quote Watermark */}
                  <Quote size={80} className="absolute -bottom-4 -right-4 text-[#312E81]/5 dark:text-white/5 pointer-events-none rotate-180" />

                  {/* Top Author & Rating Bar */}
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full relative overflow-hidden border-2 border-white dark:border-zinc-700 shadow-md shrink-0">
                        <Image src={currentReview.avatar} alt={currentReview.author} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-extrabold text-base text-[#18181B] dark:text-zinc-100 truncate">
                          {currentReview.author}
                        </h4>
                        <span className="text-xs font-body font-medium text-[#71717A] dark:text-zinc-400 truncate block">
                          {currentReview.hostel} • {currentReview.date}
                        </span>
                      </div>
                    </div>

                    {/* Gold Star Badge */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full shadow-xs border border-slate-100 dark:border-zinc-700 shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= currentReview.rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-slate-200 dark:text-zinc-600"}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-[#18181B] dark:text-zinc-100 font-body ml-0.5">
                        {currentReview.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-sm md:text-base text-[#18181B] dark:text-zinc-200 font-body font-medium leading-relaxed italic relative z-10 pt-1">
                    &ldquo;{currentReview.comment}&rdquo;
                  </p>

                  {/* Helpful Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 relative z-10">
                    <span className="text-[11px] font-body font-semibold text-[#71717A] dark:text-zinc-400">
                      Review {activeReviewIndex + 1} of {reviewsList.length}
                    </span>

                    <button
                      onClick={() => handleLikeReview(currentReview.id)}
                      className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                        currentReview.isLiked
                          ? "bg-[#312E81] dark:bg-indigo-600 text-white border-[#312E81] dark:border-indigo-600 shadow-sm"
                          : "bg-white dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:text-[#18181B] dark:hover:text-zinc-100"
                      }`}
                    >
                      <ThumbsUp size={13} className={currentReview.isLiked ? "fill-white" : ""} />
                      <span>Helpful ({currentReview.likes})</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CAROUSEL FOOTER NAV CONTROLS & DOT INDICATORS */}
          {reviewsList.length > 1 && (
            <div className="flex items-center justify-between pt-2">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {reviewsList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveReviewIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeReviewIndex ? "w-6 bg-[#312E81] dark:bg-indigo-500" : "w-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600"
                    }`}
                    aria-label={`Go to review ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevReview}
                  className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextReview}
                  className="w-10 h-10 rounded-full bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#312E81] dark:hover:bg-indigo-600 text-[#312E81] dark:text-indigo-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90"
                  aria-label="Next review"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

        </motion.div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 pt-4"
          >
            <h3 className="font-heading font-extrabold text-xl text-[#18181B] dark:text-zinc-100">
              More from {product.vendorName}
            </h3>
            <ProductGrid
              products={relatedProducts}
              onAddProduct={(id) => {
                const item = relatedProducts.find((p) => p.id === id);
                if (item) {
                  addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    vendorId: item.vendorId,
                    vendorName: item.vendorName,
                  });
                }
              }}
            />
          </motion.div>
        )}

      </div>

      {/* WRITE A REVIEW MODAL */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        title="Leave a Student Review"
      >
        {reviewSuccessMsg ? (
          <div className="text-center py-8 space-y-3 font-body">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#18181B]">
              Thank You!
            </h3>
            <p className="text-xs text-[#71717A]">Your review has been posted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleAddReview} className="space-y-5 font-body text-[#18181B]">
            {/* Interactive Star Rating */}
            <div className="space-y-2 text-center bg-[#FAFAF7] p-4 rounded-2xl border border-slate-100">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Tap to Rate {product.name}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 active:scale-125 transition-transform"
                  >
                    <Star
                      size={28}
                      className={`${
                        star <= (hoverRating || newRating)
                          ? "fill-[#FBBF24] text-[#FBBF24]"
                          : "text-slate-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Hostel Location Selector */}
            <div className="space-y-1.5">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Your Campus Hostel / Hall
              </label>
              <select
                value={studentHostel}
                onChange={(e) => setStudentHostel(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-[#FAFAF7] border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#312E81]"
              >
                <option value="Mellanby Hall">Mellanby Hall</option>
                <option value="Queen Elizabeth Hall">Queen Elizabeth Hall</option>
                <option value="Tedder Hall">Tedder Hall</option>
                <option value="Kuti Hall">Kuti Hall</option>
                <option value="Sultan Bello Hall">Sultan Bello Hall</option>
                <option value="Idia Hall">Idia Hall</option>
                <option value="Off-Campus Annex">Off-Campus Annex</option>
              </select>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1.5">
              <label className="font-heading font-bold text-xs text-[#71717A] uppercase tracking-wider block">
                Your Feedback & Comments
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience regarding portion size, taste, packaging, or delivery speed..."
                rows={4}
                required
                className="w-full p-3.5 rounded-2xl bg-[#FAFAF7] border border-slate-200 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#312E81] placeholder-[#71717A]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-13 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-body font-semibold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform text-sm"
            >
              <Send size={16} />
              Submit Review
            </button>
          </form>
        )}
      </Modal>

      {/* CONFIRM REPLACEMENT MODAL */}
      <Modal
        isOpen={!!pendingProduct}
        onClose={() => setPendingProduct(null)}
        title="Replace Cart?"
      >
        <p className="text-[#71717A] text-sm mb-6 leading-relaxed font-body">
          Your cart currently contains items from another vendor. Would you like to clear your current cart and start a new order from <strong>{pendingProduct?.vendorName}</strong>?
        </p>
        <div className="flex flex-col gap-3 font-body">
          <button
            onClick={handleReplaceCart}
            className="w-full h-12 bg-[#312E81] text-[#FFFFFF] font-semibold rounded-full shadow-md active:scale-[0.98] transition-transform text-sm"
          >
            Clear Cart and Add
          </button>
          <button
            onClick={() => setPendingProduct(null)}
            className="w-full h-12 bg-[#F4F3FF] text-[#312E81] font-semibold rounded-full active:scale-[0.98] transition-transform text-sm"
          >
            Keep Current Cart
          </button>
        </div>
      </Modal>

      {/* MERCHANT CHAT MODAL DRAWER */}
      <MerchantChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        vendor={{
          id: product.vendorId,
          name: product.vendorName,
          avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
          phone: "+234 812 345 9900",
        }}
        initialProductContext={product.name}
      />

    </div>
  );
}
