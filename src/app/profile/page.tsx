"use client";

import { ChevronRight, ClipboardList, MapPin, Bell, HelpCircle, Star, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  const menuItems = [
    { icon: MapPin, label: "Saved Locations", href: "/profile/locations" },
    { icon: ClipboardList, label: "Order History", href: "/orders" },
    { icon: Bell, label: "Notifications", href: "/profile/notifications", supportText: "2 New" },
    { icon: HelpCircle, label: "Help & Support", href: "/support" },
    { icon: Star, label: "My Reviews", href: "/profile/reviews" },
    { icon: Settings, label: "Security & Settings", href: "/profile/settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface-soft)] pb-[100px] md:pb-20">
      <div className="bg-[var(--color-primary)] text-white px-5 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-2xl font-heading font-bold mb-6">Profile</h1>
        
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 p-1">
            <div className="w-full h-full rounded-full overflow-hidden relative">
              <Image 
                src="https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" 
                alt="Alex"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">Alex John</h2>
            <p className="text-white/80 font-medium text-sm">alex.john@student.uni.edu</p>
            <span className="inline-block mt-2 bg-[var(--color-secondary)] text-black text-xs font-bold px-2 py-0.5 rounded-full">
              Student
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        
        {/* Menu Rows */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-bento)] overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link 
                key={i} 
                href={item.href}
                className={`flex items-center p-5 active:bg-gray-50 transition-colors ${i !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[var(--color-primary)] mr-4">
                  <Icon size={20} />
                </div>
                <span className="font-medium text-[var(--color-text-primary)] flex-1">{item.label}</span>
                
                {item.supportText && (
                  <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-secondary)] px-2 py-1 rounded-full mr-3">
                    {item.supportText}
                  </span>
                )}
                
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <button className="w-full flex items-center p-5 bg-white rounded-3xl shadow-[var(--shadow-bento)] active:bg-red-50 transition-colors text-red-500 font-medium">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left">Log Out</span>
        </button>
      </div>
    </div>
  );
}
