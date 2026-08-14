"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/lib/userStore";
import { syncSupabaseOAuthUser } from "@/actions/auth";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { updateProfile, setHasSeenOnboarding } = useUserStore();
  const [status, setStatus] = useState("Connecting your Google account...");

  useEffect(() => {
    async function handleAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase auth error:", error);
          setStatus("Authentication error. Redirecting...");
          setTimeout(() => router.push("/login"), 1500);
          return;
        }

        if (session?.user) {
          const user = session.user;
          const userEmail = user.email || "";
          const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split("@")[0];
          const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

          setStatus(`Welcome, ${userName.split(" ")[0]}! Finalizing your setup...`);

          // Sync into database
          if (userEmail) {
            await syncSupabaseOAuthUser({
              email: userEmail,
              name: userName,
              avatar: userAvatar,
            });
          }

          // Update local client store
          setHasSeenOnboarding(true);
          updateProfile({
            name: userName,
            email: userEmail,
            avatar: userAvatar,
            isVisitor: false,
          });

          setTimeout(() => {
            window.location.href = "/";
          }, 800);
        } else {
          // Listen for auth state changes if session is in process of exchanging
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession?.user) {
              const u = currentSession.user;
              const uEmail = u.email || "";
              const uName = u.user_metadata?.full_name || u.user_metadata?.name || uEmail.split("@")[0];
              const uAvatar = u.user_metadata?.avatar_url || u.user_metadata?.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

              if (uEmail) {
                await syncSupabaseOAuthUser({
                  email: uEmail,
                  name: uName,
                  avatar: uAvatar,
                });
              }

              setHasSeenOnboarding(true);
              updateProfile({
                name: uName,
                email: uEmail,
                avatar: uAvatar,
                isVisitor: false,
              });

              subscription.unsubscribe();
              window.location.href = "/";
            }
          });
        }
      } catch (err) {
        console.error("Callback error:", err);
        router.push("/");
      }
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
        <div className="w-16 h-16 rounded-2xl bg-[#312E81]/10 text-[#312E81] dark:text-indigo-400 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
          Signing in with Google
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {status}
        </p>
      </motion.div>
    </div>
  );
}
