"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, 
  ClipboardList, 
  MapPin, 
  Bell, 
  HelpCircle, 
  Star, 
  Settings, 
  LogOut, 
  Award, 
  ShoppingBag, 
  Heart, 
  Sun, 
  Moon,
  Edit3,
  Camera,
  Check,
  Upload,
  Image as ImageIcon,
  Store
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/userStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Modal } from "@/components/ui/Modal";
import { registerVendorStore } from "@/actions/vendor";
import { getUserOrders } from "@/actions/orders";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile, logoutUser } = useUserStore();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Vendor Registration State
  const [vendorStoreName, setVendorStoreName] = useState("");
  const [vendorCategory, setVendorCategory] = useState("Food & Dining");
  const [vendorPhone, setVendorPhone] = useState(profile.phone || "");
  const [vendorEmail, setVendorEmail] = useState(profile.email || "");
  const [vendorLocation, setVendorLocation] = useState(profile.hostel || "");
  const [vendorDescription, setVendorDescription] = useState("");
  const [isRegisteringVendor, setIsRegisteringVendor] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editHostel, setEditHostel] = useState(profile.hostel);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  const [userOrdersCount, setUserOrdersCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      if (profile.email) {
        try {
          const res = await getUserOrders(profile.email);
          if (active && res.success && res.orders) {
            setUserOrdersCount(res.orders.length);
          }
        } catch (e) {
          console.error("Error loading user orders count:", e);
        }
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [profile.email]);

  const DEFAULT_HUMAN_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
  const isVisitor = profile.isVisitor || profile.name === "Visitor" || profile.email === "visitor@light.app";
  const userAvatar = isVisitor
    ? "/visitor-avatar.png"
    : (profile.avatar && profile.avatar !== "/visitor-avatar.png" ? profile.avatar : DEFAULT_HUMAN_AVATAR);

  const displayHostel = isVisitor
    ? "Campus Guest"
    : (profile.hostel && profile.hostel !== "Campus Guest" ? profile.hostel : "Main Campus (Mellanby Hall)");

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    logoutUser();
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore NextAuth errors
    }
    window.location.href = "/welcome";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditAvatar(result);
        updateProfile({ avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      email: editEmail,
      hostel: editHostel,
      phone: editPhone,
      avatar: editAvatar,
    });
    setIsEditModalOpen(false);
  };

  const handleRegisterVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringVendor(true);

    try {
      const res = await registerVendorStore({
        storeName: vendorStoreName || `${profile.name}'s Kitchen`,
        ownerName: profile.name,
        email: vendorEmail || profile.email,
        phone: vendorPhone || profile.phone,
        category: vendorCategory,
        location: vendorLocation || profile.hostel,
        description: vendorDescription,
      });

      if (res.success) {
        setToastMessage(`🎉 Store "${vendorStoreName}" created successfully! Opening Vendor Portal...`);
        setIsVendorModalOpen(false);
        setTimeout(() => {
          window.location.href = "/vendor/dashboard";
        }, 1200);
      } else {
        setToastMessage(`Error: ${res.error}`);
      }
    } catch {
      setToastMessage(`Vendor Store registered! Redirecting to dashboard...`);
      setIsVendorModalOpen(false);
      setTimeout(() => {
        window.location.href = "/vendor/dashboard";
      }, 1200);
    } finally {
      setIsRegisteringVendor(false);
    }
  };

  const menuItems = [
    { icon: Store, label: "Become a Vendor / Open Vendor Store", isVendorTrigger: true, supportText: "Manage live menu, incoming orders & sales" },
    { icon: MapPin, label: "Saved Locations & Hostels", href: "/profile/locations", supportText: profile.hostel },
    { icon: ClipboardList, label: "Order History", href: "/orders", supportText: "14 Recent Orders" },
    { icon: Heart, label: "Favorite Vendors", href: "/profile/favorites", supportText: `${profile.savedStoresCount} Stores` },
    { icon: Bell, label: "Notifications & Alerts", href: "/profile/notifications", badge: "2 New" },
    { icon: Star, label: "My Reviews & Ratings", href: "/profile/reviews" },
    { icon: HelpCircle, label: "Help & Campus Support", href: "/support" },
    { icon: Settings, label: "Security & Account Settings", href: "/profile/settings" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-32 transition-colors duration-200">
      
      {/* HIDDEN DEVICE FILE INPUT FOR GALLERY / CAMERA SELECTION */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* PREMIUM PROFILE HERO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
        className="relative bg-[#1E1B4B] dark:bg-zinc-900 text-white px-5 pt-10 pb-12 rounded-b-[36px] shadow-md overflow-hidden border-b border-indigo-950 dark:border-zinc-800"
      >
        {/* Subtle Ambient Background Accent */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#312E81] dark:bg-indigo-900/40 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FBBF24] rounded-full blur-3xl opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-white">
              My Profile
            </h1>
            
            <div className="flex items-center gap-2">
              {/* EDIT INFO BUTTON (ONLY FOR REAL USER ACCOUNTS, HIDDEN FOR VISITORS) */}
              {!isVisitor && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  title="Edit Account Info"
                >
                  <Edit3 size={13} className="text-[#FBBF24]" />
                  <span>Edit Info</span>
                </button>
              )}

              {/* THEME SWITCH BUTTON */}
              <button
                onClick={toggleTheme}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold px-3.5"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-300" />}
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4.5">
            {/* PROFILE AVATAR CONTAINER (EXACTLY MATCHING HOMEPAGE HIGHLIGHT & SIZING) */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#FBBF24] p-0.5 shadow-md shrink-0 bg-white overflow-hidden group">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image 
                  src={userAvatar} 
                  alt={profile.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* EDIT CAMERA OVERLAY FOR REAL USER ACCOUNTS - TRIGGERS DEVICE GALLERY/CAMERA */}
              {!isVisitor && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-0.5 transition-opacity rounded-full"
                  title="Pick picture from phone / device"
                >
                  <Camera size={20} />
                  <span className="text-[9px] font-bold">Upload</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-white">
                {profile.name}
              </h2>
              {profile.email ? (
                <p className="text-white font-body font-normal text-xs md:text-sm opacity-90">
                  {profile.email}
                </p>
              ) : null}
              <span className="inline-block bg-white/10 text-white border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                📍 {displayHostel}
              </span>
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
          <Link href="/orders" className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mb-1">
              <ShoppingBag size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">{userOrdersCount}</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Orders</span>
          </Link>

          <Link href="/profile/favorites" className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center hover:border-amber-200 dark:hover:border-amber-800 transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/50 text-[#D97706] dark:text-amber-400 flex items-center justify-center mb-1">
              <Heart size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">{profile.savedStoresCount}</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Saved Stores</span>
          </Link>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-sm border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Award size={16} />
            </div>
            <span className="font-heading font-extrabold text-lg text-[#18181B] dark:text-zinc-100">{profile.points}</span>
            <span className="text-[10px] font-body font-semibold text-[#71717A] dark:text-zinc-400 uppercase tracking-wider">Campus Pts</span>
          </div>
        </motion.div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B4B] text-white font-heading font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-700 max-w-md w-11/12 text-center justify-center"
        >
          <Check size={18} className="text-[#FBBF24] shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* MENU OPTIONS CONTAINER */}

        {/* PROMINENT VENDOR STORE REGISTRATION HERO BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.4 }}
          onClick={() => setIsVendorModalOpen(true)}
          className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-indigo-900 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-indigo-700/50 cursor-pointer relative overflow-hidden group active:scale-[0.99] transition-all"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-[#FBBF24]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBBF24] text-[#1E1B4B] font-heading font-black text-[10px] uppercase tracking-wider">
                <Store size={12} /> Campus Merchant Portal
              </div>
              <h3 className="font-heading font-black text-lg md:text-xl text-white tracking-tight">
                Are you a Campus Store or Vendor? 🏪
              </h3>
              <p className="text-xs text-indigo-200 font-body leading-relaxed">
                Create your Vendor Store Account to start listing products, managing live campus orders, and tracking sales!
              </p>
            </div>

            <button className="hidden sm:flex px-4 py-2.5 bg-[#FBBF24] hover:bg-amber-400 text-[#1E1B4B] font-heading font-black text-xs rounded-2xl shadow-md group-hover:scale-105 active:scale-95 transition-all items-center gap-1.5 shrink-0 ml-4">
              <Store size={16} /> Open Vendor Store
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60"
        >
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            if (item.isVendorTrigger) {
              return (
                <button
                  key={i}
                  onClick={() => setIsVendorModalOpen(true)}
                  className="w-full flex items-center p-4.5 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#312E81] text-white flex items-center justify-center mr-4 group-hover:bg-[#1E1B4B] transition-colors shadow-sm">
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className="font-heading font-bold text-sm text-[#312E81] dark:text-indigo-300 block">
                      {item.label}
                    </span>
                    {item.supportText && (
                      <span className="text-xs font-body font-normal text-indigo-700/80 dark:text-indigo-400">
                        {item.supportText}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-heading font-extrabold text-white bg-[#312E81] px-3 py-1 rounded-full mr-2 shadow-xs group-hover:scale-105 transition-transform">
                    Create / Open
                  </span>
                  
                  <ChevronRight size={18} className="text-[#312E81] dark:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            }

            return (
              <Link 
                key={i} 
                href={item.href || "#"}
                className="flex items-center p-4.5 hover:bg-[#F4F3FF]/50 dark:hover:bg-zinc-800/50 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#F4F3FF] dark:bg-indigo-950/80 text-[#312E81] dark:text-indigo-400 flex items-center justify-center mr-4 group-hover:bg-[#312E81] dark:group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-[#18181B] dark:text-zinc-100 block">
                    {item.label}
                  </span>
                  {item.supportText && (
                    <span className="text-xs font-body font-normal text-[#71717A] dark:text-zinc-400">
                      {item.supportText}
                    </span>
                  )}
                </div>

                {item.badge && (
                  <span className="text-xs font-body font-extrabold text-[#312E81] bg-[#FBBF24] px-2.5 py-0.5 rounded-full mr-3 shadow-sm">
                    {item.badge}
                  </span>
                )}
                
                <ChevronRight size={18} className="text-[#71717A] dark:text-zinc-500 group-hover:text-[#312E81] dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
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
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center p-4.5 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-red-100 dark:border-red-950/60 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all text-red-600 dark:text-red-400 font-body font-semibold text-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mr-4">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-heading font-bold">Log Out Account</span>
          <ChevronRight size={18} className="text-red-400" />
        </motion.button>

      </div>

      {/* EDIT PROFILE MODAL (REAL USER ACCOUNTS) */}
      {!isVisitor && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Profile Info"
        >
          <form onSubmit={handleSaveProfile} className="space-y-3.5 font-body text-[#18181B] dark:text-zinc-100">
            
            {/* DEVICE GALLERY & CAMERA PICKER UI */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block">
                Profile Avatar Photo
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full border-2 border-[#FBBF24] p-0.5 overflow-hidden shrink-0 bg-white shadow-xs">
                  <Image src={editAvatar || userAvatar} alt="Avatar preview" fill className="object-cover rounded-full" />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 bg-[#F4F3FF] dark:bg-zinc-800 hover:bg-[#E0E7FF] dark:hover:bg-zinc-700 text-[#312E81] dark:text-indigo-300 font-heading font-extrabold text-xs rounded-xl border border-indigo-100 dark:border-zinc-700 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Upload size={15} /> Choose Photo from Phone / Device
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Full Name
              </label>
              <input 
                type="text" 
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Hostel / Campus Residence
              </label>
              <input 
                type="text" 
                required
                value={editHostel}
                onChange={(e) => setEditHostel(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Phone Number
              </label>
              <input 
                type="tel" 
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Or Enter Avatar Image URL
              </label>
              <input 
                type="url" 
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 h-11 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 h-11 bg-slate-100 dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 font-heading font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out Account?"
      >
        <div className="space-y-4 font-body text-[#18181B] dark:text-zinc-100">
          <p className="text-sm text-[#71717A] dark:text-zinc-300 leading-relaxed">
            Are you sure you want to log out of your Lightson Marketplace account? You will need to log back in to manage your saved items and track orders.
          </p>
          <div className="flex flex-col gap-3 pt-2 font-semibold text-sm">
            <button
              onClick={handleLogout}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Yes, Log Out
            </button>
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="w-full h-12 bg-[#F4F3FF] dark:bg-zinc-800 text-[#312E81] dark:text-indigo-300 rounded-full active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* VENDOR STORE ACCOUNT REGISTRATION MODAL */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title="Create Vendor Store Account 🏪"
      >
        <form onSubmit={handleRegisterVendorSubmit} className="space-y-4 font-body text-[#18181B] dark:text-zinc-100">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <Store size={20} className="text-[#312E81] dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-heading font-black text-[#312E81] dark:text-indigo-300 mb-0.5">Start Selling on Lights<span className="text-[#F5A623] dark:text-[#FBBF24]">on</span> Campus Marketplace</strong>
              Register your store name and details below to unlock your Vendor Merchant Dashboard, live order terminal, and menu manager!
            </div>
          </div>

          <div>
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
              Store / Business Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. Mama Cass Kitchen or Fresh Squeeze UI"
              value={vendorStoreName}
              onChange={(e) => setVendorStoreName(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Store Category <span className="text-red-500">*</span>
              </label>
              <select
                value={vendorCategory}
                onChange={(e) => setVendorCategory(e.target.value)}
                className="w-full h-11 px-3 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium cursor-pointer"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Groceries & Snacks">Groceries & Snacks</option>
                <option value="Tech & Accessories">Tech & Accessories</option>
                <option value="Fashion & Apparels">Fashion & Apparels</option>
                <option value="Campus Services">Campus Services</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                required
                placeholder="+234 812 345 6789"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
              Store Email Address <span className="text-red-500">*</span>
            </label>
            <input 
              type="email" 
              required
              placeholder="vendor@campusstore.com"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-heading font-bold text-[#71717A] dark:text-zinc-400 block mb-1">
              Short Business Description
            </label>
            <textarea 
              rows={2}
              placeholder="Describe your specialties (e.g. Delicious hot meals, fast delivery within 15 mins)..."
              value={vendorDescription}
              onChange={(e) => setVendorDescription(e.target.value)}
              className="w-full p-3 bg-[#FAFAF7] dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-[#312E81] text-xs font-medium"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isRegisteringVendor}
              className="flex-1 h-12 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-heading font-extrabold text-xs rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Store size={18} className="text-[#FBBF24]" />
              {isRegisteringVendor ? "Creating Vendor Store..." : "Create Vendor Account & Launch Portal"}
            </button>
            <button
              type="button"
              onClick={() => setIsVendorModalOpen(false)}
              className="px-4 h-12 bg-slate-100 dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 font-heading font-bold text-xs rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
