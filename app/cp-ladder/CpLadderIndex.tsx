"use client";

import React, { useEffect, useState, useId } from "react";
import type { LadderMeta } from "./ladder-utils";
import { useAuth } from "@clerk/nextjs";
import { getAllLaddersSolvedCounts, updateCpLadderProgress } from "@/actions/cp-ladder";
import ActivityHeatmap from "./ActivityHeatmap";
import CfWidget from "./CfWidget";
import LadderCard, { CARD_ACCENTS } from "./LadderCard";

// ── Main Index ─────────────────────────────────────────────────────────────
export default function CpLadderIndex({ ladders }: { ladders: LadderMeta[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const gradId = useId().replace(/:/g, "-");
  const { userId } = useAuth();

  useEffect(() => {
    async function loadProgress() {
      // 1. Fast path: count solved from localStorage meta (persist() keeps this current)
      const result: Record<string, number> = {};
      const localData: Record<string, Record<string, any>> = {};

      ladders.forEach(({ slug }) => {
        try {
          const raw = localStorage.getItem(`cp_ladder_${slug}`);
          if (raw) {
            const meta: Record<string, { status: string; bookmarked?: boolean; note?: string }> =
              JSON.parse(raw);
            localData[slug] = meta;
            result[slug] = Object.values(meta).filter((m) => m.status === "solved").length;
          } else {
            result[slug] = 0;
          }
        } catch {
          result[slug] = 0;
        }
      });
      setProgress(result);
      setMounted(true);

      // 2. Slow path: fetch DB counts — DB is the source of truth for cross-device sync
      if (userId) {
        const dbCounts = await getAllLaddersSolvedCounts();
        if (dbCounts && Object.keys(dbCounts).length > 0) {
          setProgress((prev) => ({ ...prev, ...dbCounts }));
        }

        // ── One-time migration: push localStorage data to DB ──
        if (Object.values(result).some((v) => v > 0)) {
          const MIGRATION_KEY = "cp_ladder_db_migrated_v1";
          if (!localStorage.getItem(MIGRATION_KEY)) {
            localStorage.setItem(MIGRATION_KEY, "1");
            for (const [slug, meta] of Object.entries(localData)) {
              for (const [idx, m] of Object.entries(meta)) {
                if (m.status && m.status !== "none") {
                  updateCpLadderProgress(slug, idx, {
                    status: m.status as "none" | "attempted" | "solved",
                    bookmarked: m.bookmarked ?? false,
                    note: m.note ?? "",
                  });
                }
              }
            }
          }
        }
      }
    }
    loadProgress();
  }, [ladders, userId]);

  const totalProblems = ladders.reduce((s, l) => s + l.totalProblems, 0);
  const totalSolved = Object.values(progress).reduce((s, v) => s + v, 0);
  const completedSecs = ladders.filter(
    (l) => (progress[l.slug] ?? 0) >= l.totalProblems && l.totalProblems > 0
  ).length;
  const overallPct = totalProblems > 0 ? (totalSolved / totalProblems) * 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">
              CP Ladder
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
              Ek hi sapna —{" "}
              <span className="font-bold text-[#ff8c00]" title="Master — Codeforces rank">
                Master
              </span>
              . Ek hi rasta — <span className="font-bold text-white">yeh ladder</span>.
            </p>
          </div>
          {mounted && (
            <div className="mt-2">
              <CfWidget />
            </div>
          )}
        </div>
      </div>

      {/* ── Heatmap + Stats ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          {/* Heatmap */}
          <div className="min-w-0 flex-1 h-full">
            <ActivityHeatmap />
          </div>

          {/* Stats panel */}
          <div
            className="flex items-center gap-6 shrink-0 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-4 h-full"
            suppressHydrationWarning
          >
            {/* Circular progress */}
            <div className="relative w-24 h-24 shrink-0" suppressHydrationWarning>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="7"
                  fill="none"
                  className="stroke-zinc-800"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    stroke: `url(#${gradId})`,
                    strokeDasharray: `${2 * Math.PI * 50}`,
                    strokeDashoffset: mounted
                      ? `${2 * Math.PI * 50 * (1 - overallPct / 100)}`
                      : `${2 * Math.PI * 50}`,
                    transition: "stroke-dashoffset 1s ease",
                  }}
                />
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span
                className="absolute inset-0 flex flex-col items-center justify-center text-lg font-black text-white leading-tight"
                suppressHydrationWarning
              >
                <span>{mounted ? overallPct.toFixed(1) : "0.0"}%</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3" suppressHydrationWarning>
              {[
                { label: "Problems", value: totalProblems, color: "text-white" },
                { label: "Solved", value: mounted ? totalSolved : 0, color: "text-green-400" },
                { label: "Sections", value: ladders.length, color: "text-white" },
                { label: "Done", value: mounted ? completedSecs : 0, color: "text-violet-400" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className={`text-2xl font-black ${color} tabular-nums`}>{value}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            All Sections — {ladders.length} total
          </h2>
        </div>

        {ladders.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            No sections found. Add JSON files to{" "}
            <code className="text-zinc-400">public/cp-ladder/</code>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {ladders.map((ladder, idx) => (
              <LadderCard
                key={ladder.slug}
                {...ladder}
                solved={progress[ladder.slug] ?? 0}
                accent={CARD_ACCENTS[idx % CARD_ACCENTS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
