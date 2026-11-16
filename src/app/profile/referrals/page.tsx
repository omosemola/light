"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Gift, 
  Copy, 
  CheckCheck, 
  Share2, 
  Award, 
  Users, 
  ShoppingBag,
  History
} from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import { getUserReferralStats } from "@/actions/referral";

export default function ReferralsPage() {
  const { profile, updateProfile } = useUserStore();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    points: number;
    referralCode: string | null;
    referralLink: string;
    totalReferredCount: number;
    referralPointsEarned: number;
    recentTransactions: Array<{
      id: string;
      amount: number;
      type: string;
      description: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (profile.email) {
      getUserReferralStats(profile.email)
        .then((res) => {
          if (active && res.success && res.stats) {
            setStats(res.stats);
            if (res.stats.points !== undefined) {
              updateProfile({
                points: res.stats.points,
                referralCode: res.stats.referralCode || undefined,
              });
            }
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      active = false;
    };
  }, [profile.email, updateProfile]);

  const activeCode = stats?.referralCode || profile.referralCode || "";
  const referralLink = stats?.referralLink || (activeCode ? `https://lightsonmarketplace.com/?ref=${activeCode}` : "https://lightsonmarketplace.com");

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Referral Link: " + referralLink);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Order meals, drinks, and campus essentials on Lightson Marketplace! Use my link to get 50 Welcome Points immediately: ${referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#09090B] font-body text-[#18181B] dark:text-zinc-100 pb-28 transition-colors duration-200">
      {/* SOLID HEADER (NO GRADIENT) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Back to Profile"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-heading font-extrabold text-base md:text-lg text-[#18181B] dark:text-zinc-100">
              Campus Rewards & Referrals
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Invite friends and accumulate points
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* POINTS BALANCE (SOLID CONTAINER) */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                Your Accumulated Balance
              </span>
              <span className="font-heading font-black text-3xl text-[#1E1B4B] dark:text-indigo-400 block mt-0.5">
                {stats?.points ?? profile.points} <span className="text-base font-bold text-slate-500 dark:text-zinc-400">Points</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
          </div>

          {/* REWARD BREAKDOWN RULES */}
          <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="font-heading font-extrabold text-indigo-700 dark:text-indigo-400 block text-sm">+100 Points</span>
              <span className="text-slate-600 dark:text-zinc-300 text-[11px]">Instantly when a friend signs up with your link</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="font-heading font-extrabold text-emerald-600 dark:text-emerald-400 block text-sm">+5 Points</span>
              <span className="text-slate-600 dark:text-zinc-300 text-[11px]">On every order placed by friends you referred</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="font-heading font-extrabold text-amber-600 dark:text-amber-400 block text-sm">+50 Points</span>
              <span className="text-slate-600 dark:text-zinc-300 text-[11px]">Welcome reward for your friend on registration</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="font-heading font-extrabold text-slate-900 dark:text-zinc-200 block text-sm">+50 Points</span>
              <span className="text-slate-600 dark:text-zinc-300 text-[11px]">On every campus order you place yourself</span>
            </div>
          </div>
        </section>

        {/* SHARE YOUR REFERRAL LINK (SOLID, SIMPLE) */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div>
            <h2 className="font-heading font-extrabold text-sm text-[#18181B] dark:text-zinc-100">
              Your Referral Link & Code
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Share with campus friends, roommates, and hostel WhatsApp groups.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl">
            <span className="flex-1 font-mono font-bold text-xs md:text-sm text-[#1E1B4B] dark:text-indigo-300 truncate select-all">
              {activeCode || (isLoading ? "Loading code..." : "LIGHT-STUDENT")}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#1E1B4B] dark:bg-indigo-600 hover:bg-[#312E81] text-white font-heading font-bold text-xs rounded-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <CheckCheck size={14} className="text-emerald-300" /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-heading font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Share2 size={16} />
            <span>Share to WhatsApp</span>
          </button>
        </section>

        {/* SUMMARY METRICS */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#312E81] dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-[#18181B] dark:text-zinc-100 block">
                {stats?.totalReferredCount ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Friends Joined</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Gift size={18} />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-emerald-600 dark:text-emerald-400 block">
                +{stats?.referralPointsEarned ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Referral Pts Earned</span>
            </div>
          </div>
        </section>

        {/* RECENT POINTS ACTIVITY LEDGER */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <h3 className="font-heading font-bold text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Points Activity Ledger
            </h3>
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {tx.description}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className="font-heading font-extrabold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                    +{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
              <p className="font-semibold">No points transactions recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Share your referral link with campus friends to get 100 points immediately when they sign up!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
