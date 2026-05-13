"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getUserProfile, getCpLadderActivity, getAllLaddersProgress } from "@/actions/cp-ladder";
import { getAllRoadmapsProgress } from "@/actions/roadmap";

/**
 * Invisible background component mounted in the root layout.
 * When the user is authenticated, it prefetches their CP Ladder stats
 * into localStorage during browser idle time — so every section feels instant.
 *
 * Runs once per session (sessionStorage guard), during requestIdleCallback
 * so it never competes with critical page rendering.
 */
export default function DataPrefetcher() {
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    // Only run once per session
    const SESSION_KEY = "prefetch_done_v2";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const run = async () => {
      sessionStorage.setItem(SESSION_KEY, "1");

      try {
        // Six independent fetches run in parallel
        const [profile, activity, allProgress, allRoadmapProgress, questionsRes, progressRes] =
          await Promise.all([
            getUserProfile(),
            getCpLadderActivity(),
            getAllLaddersProgress(), // single DB call for ALL ladders' full meta
            getAllRoadmapsProgress(), // single DB call for ALL DSA roadmaps' progress
            fetch("/api/questions").catch(() => null),
            fetch("/api/user-progress").catch(() => null),
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

        // ── Full per-ladder meta ──
        if (allProgress) {
          for (const [slug, meta] of Object.entries(allProgress)) {
            const key = `cp_ladder_${slug}`;
            let localMeta: Record<string, any> = {};
            try {
              const raw = localStorage.getItem(key);
              if (raw) localMeta = JSON.parse(raw);
            } catch {}

            // DB is the absolute source of truth.
            const merged = { ...localMeta, ...meta };
            localStorage.setItem(key, JSON.stringify(merged));
          }
        }

        // ── Full per-roadmap meta (DSA) ──
        if (allRoadmapProgress) {
          for (const [slug, meta] of Object.entries(allRoadmapProgress)) {
            const key = `roadmap_progress_${slug}`;
            let localMeta: Record<string, any> = {};
            try {
              const raw = localStorage.getItem(key);
              if (raw) localMeta = JSON.parse(raw);
            } catch {}

            // DB is the absolute source of truth.
            const merged = { ...localMeta, ...meta };
            localStorage.setItem(key, JSON.stringify(merged));
          }
        }

        // ── Dashboard / DSA Section ──
        if (questionsRes && questionsRes.ok) {
          const qData = await questionsRes.json();
          if (qData && qData.questions && qData.companies) {
            localStorage.setItem(
              "dashboard-cache-v2",
              JSON.stringify({
                questions: qData.questions,
                companies: qData.companies,
              })
            );
          }
        }

        if (progressRes && progressRes.ok) {
          const pData = await progressRes.json();
          if (pData && pData.slugs) {
            localStorage.setItem("dashboard-progress-v1", JSON.stringify(pData.slugs));
          }
        }
      } catch {
        // Silently fail — best-effort prefetch, not critical
        sessionStorage.removeItem(SESSION_KEY); // allow retry next navigation
      }
    };

    // Run during browser idle time — never blocks rendering
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(run, { timeout: 3000 });
    } else {
      // Safari fallback
      const t = setTimeout(run, 2000);
      return () => clearTimeout(t);
    }
  }, [userId]);

  return null;
}
