"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ReferralTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const ref = searchParams?.get("ref");
      if (ref && typeof window !== "undefined") {
        const cleanRef = ref.trim().toUpperCase();
        if (cleanRef.length >= 3 && cleanRef.length <= 32) {
          // Save for 30 days (2,592,000 seconds)
          document.cookie = `lightson_ref=${encodeURIComponent(cleanRef)}; max-age=2592000; path=/; SameSite=Lax`;
          try {
            sessionStorage.setItem("lightson_ref", cleanRef);
          } catch {}
        }
      }
    } catch {}
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
