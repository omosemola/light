"use client";

import { useState } from "react";
import { ChevronRight, ClipboardList, MapPin, Bell, HelpCircle, Star, Settings, LogOut, ShieldCheck, Camera, Award, ShoppingBag, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("menu");

  const menuItems = [
    { icon: MapPin, label: "Saved Locations & Hostels", href: "/profile/locations", supportText: "Main Campus" },
    { icon: ClipboardList, label: "Order History", href: "/orders", supportText: "14 Orders" },
    { icon: Heart, label: "Favorite Vendors", href: "/profile/favorites", supportText: "5 Stores" },
    { icon: Bell, label: "Notifications & Alerts", href: "/profile/notifications", badge: "2 New" },
    { icon: Star, label: "My Reviews & Ratings", href: "/profile/reviews" },
    { icon: HelpCircle, label: "Help & Campus Support", href: "/support" },
    { icon: Settings, label: "Security & Account Settings", href: "/profile/settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] font-body text-[#18181B] pb-32">
      
      {/* PREMIUM PROFILE HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] text-white px-5 pt-10 pb-12 rounded-b-[36px] shadow-md overflow-hidden"
      >
        {/* Subtle Ambient Background Accent */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#312E81] rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FBBF24] rounded-full blur-3xl opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white">
              My Profile
            </h1>
            <button className="text-xs font-body font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95">
              Edit Info
            </button>
          </div>
          
          <div className="flex items-center gap-4.5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#FBBF24] p-1 shadow-lg shrink-0 bg-white/10">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" 
                  alt="Alex John"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <button 
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#312E81] text-white rounded-full flex items-center justify-center border-2 border-white shadow-md active:scale-90 transition-transform"
                aria-label="Change profile photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-white">
                Alex John
              </h2>
              <p className="text-slate-300 font-body font-normal text-xs md:text-sm">
                alex.john@student.uni.edu
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QUICK STATS WIDGETS */}
      <div className="px-5 md:px-8 max-w-4xl mx-auto w-full -mt-6 z-20 space-y-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#F4F3FF] text-[#312E81] flex items-center justify-center mb-1">
              <ShoppingBag size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B]">14</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] uppercase tracking-wider">Orders</span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center mb-1">
              <Heart size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B]">5</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] uppercase tracking-wider">Saved Stores</span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Award size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B]">450</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] uppercase tracking-wider">Campus Pts</span>
          </div>
        </motion.div>

        {/* MENU OPTIONS CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100"
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link 
                key={i} 
                href={item.href}
                className="flex items-center p-4.5 hover:bg-[#F4F3FF]/50 active:bg-slate-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F4F3FF] text-[#312E81] flex items-center justify-center mr-4 group-hover:bg-[#312E81] group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-[#18181B] block">
                    {item.label}
                  </span>
                  {item.supportText && (
                    <span className="text-xs font-body font-normal text-[#71717A]">
                      {item.supportText}
                    </span>
                  )}
                </div>

                {item.badge && (
                  <span className="text-xs font-body font-extrabold text-[#312E81] bg-[#FBBF24] px-2.5 py-0.5 rounded-full mr-3 shadow-sm">
                    {item.badge}
                  </span>
                )}
                
                <ChevronRight size={18} className="text-[#71717A] group-hover:text-[#312E81] group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </motion.div>

        {/* LOGOUT BUTTON */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full flex items-center p-4.5 bg-white rounded-3xl shadow-sm border border-red-100 hover:bg-red-50 active:scale-[0.98] transition-all text-red-600 font-body font-semibold text-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mr-4">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-heading font-bold">Log Out Account</span>
          <ChevronRight size={18} className="text-red-400" />
        </motion.button>

      </div>
    </div>
  );
}
