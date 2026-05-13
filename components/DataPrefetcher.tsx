"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getUserProfile,
  getCpLadderActivity,
  getAllLaddersSolvedCounts,
} from "@/actions/cp-ladder";

/**
 * Invisible background component mounted in the root layout.
 * When the user is authenticated, it prefetches their CP Ladder stats
 * into localStorage during browser idle time — so every section feels instant.
 * Runs at most once per browser session (tracked via sessionStorage).
 */
export default function DataPrefetcher() {
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    // Only run once per session — no need to re-fetch on every page navigation
    const SESSION_KEY = "prefetch_done_v1";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const run = async () => {
      sessionStorage.setItem(SESSION_KEY, "1");

      try {
        // Run all three fetches in parallel — they're independent
        const [profile, activity, counts] = await Promise.all([
          getUserProfile(),
          getCpLadderActivity(),
          getAllLaddersSolvedCounts(),
        ]);

        // ── CF Profile ──
        if (profile?.cfHandle) {
          localStorage.setItem("cf_handle", profile.cfHandle);
          if (profile.cfRatingData) {
            const d = profile.cfRatingData as any;
            localStorage.setItem(
              "cf_rating_data",
              JSON.stringify({
                handle: profile.cfHandle,
                rating: d.rating ?? null,
                rank: d.rank ?? "",
                maxRating: d.maxRating ?? null,
                maxRank: d.maxRank ?? "",
              })
            );
          }
        }

        // ── Activity Heatmap ──
        if (activity && Object.keys(activity).length > 0) {
          localStorage.setItem("cp_ladder_activity", JSON.stringify(activity));
        }

        // ── Ladder solved counts hint (used by index page fast-path for new devices) ──
        if (counts) {
          for (const [slug, count] of Object.entries(counts)) {
            // Only write if we have no local meta yet (i.e., first visit on this device)
            const hasLocalMeta = localStorage.getItem(`cp_ladder_${slug}`);
            if (!hasLocalMeta) {
              localStorage.setItem(`cp_ladder_${slug}_db_count`, String(count));
            }
          }
        }
      } catch {
        // Silently fail — this is best-effort prefetching, not critical
        sessionStorage.removeItem(SESSION_KEY); // Allow retry on next navigation
      }
    };

    // Use requestIdleCallback so we never compete with critical rendering
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // Wait for browser idle, with a 3s max deadline
      (window as any).requestIdleCallback(run, { timeout: 3000 });
    } else {
      // Fallback: run after 2s on browsers without requestIdleCallback (Safari < 16)
      const t = setTimeout(run, 2000);
      return () => clearTimeout(t);
    }
  }, [userId]);

  return null;
}
