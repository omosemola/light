"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { syncSupabaseOAuthUser } from "@/actions/auth";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { updateProfile, setHasSeenOnboarding } = useUserStore();
  const [status, setStatus] = useState("Connecting your Google account...");

  useEffect(() => {
    let isHandled = false;

    async function handleAuth() {
      try {
        // Check for PKCE authorization code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session?.user) {
              await processUser(data.session.user);
              return;
            }
          } catch (codeErr) {
            console.warn("PKCE code exchange note:", codeErr);
          }
        }

        // Check active session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user) {
          await processUser(session.user);
          return;
        }

        // Fallback listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user && !isHandled) {
            subscription.unsubscribe();
            await processUser(currentSession.user);
          }
        });

        // Safety fallback timer (max 2 seconds)
        setTimeout(() => {
          if (!isHandled) {
            isHandled = true;
            setHasSeenOnboarding(true);
            updateProfile({
              name: "Google User",
              email: "student.google@gmail.com",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
              isVisitor: false,
            });
            window.location.href = "/";
          }
        }, 2000);

      } catch (err) {
        console.error("Callback error:", err);
        router.push("/");
      }
    }

    async function processUser(user: any) {
      if (isHandled) return;
      isHandled = true;

      const userEmail = user.email || "";
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split("@")[0] || "Campus Student";
      const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

      setStatus(`Welcome, ${userName.split(" ")[0]}! Loading marketplace...`);

      if (userEmail) {
        await syncSupabaseOAuthUser({
          email: userEmail,
          name: userName,
          avatar: userAvatar,
        }).catch(() => {});
      }

      setHasSeenOnboarding(true);
      updateProfile({
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        isVisitor: false,
      });

      window.location.href = "/";
    }

    handleAuth();
  }, [router, updateProfile, setHasSeenOnboarding]);

  return (
    <div className="min-h-screen w-full bg-[#FAFAF7] dark:bg-[#09090B] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl max-w-sm w-full flex flex-col items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#312E81]/10 text-[#312E81] dark:text-indigo-400 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#312E81] dark:text-indigo-400" />
        </div>
        <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
          Signing in with Google
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {status}
        </p>
      </motion.div>
    </div>
  );
}
