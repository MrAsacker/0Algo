"use client";

import React, { useEffect, useState, useId, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Zap, Play, Code2, RefreshCw, CheckCircle2, Edit2 } from "lucide-react";
import type { LadderMeta } from "./ladder-utils";
import CalendarHeatmap, { type CalendarHeatmapData } from "@/components/ui/calendar-heatmap";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import {
  getUserProfile,
  saveCfHandle,
  getCpLadderActivity,
  getAllLaddersSolvedCounts,
  updateCpLadderProgress,
} from "@/actions/cp-ladder";

// ── Exact Codeforces rank hex colors ──────────────────────────────────────
const CF_RANK_COLOR: Record<string, string> = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03A89E",
  expert: "#0000FF",
  "candidate master": "#AA00AA",
  master: "#FF8C00",
  "international master": "#FF8C00",
  grandmaster: "#FF0000",
  "international grandmaster": "#FF0000",
  "legendary grandmaster": "#FF0000",
};

function cfRankColor(rank?: string): string {
  if (!rank) return "#808080";
  return CF_RANK_COLOR[rank.toLowerCase()] ?? "#808080";
}

// ── Codeforces Widget ──────────────────────────────────────────────────────
function CfWidget() {
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [rank, setRank] = useState<string>("");
  const [maxRating, setMaxRating] = useState<number | null>(null);
  const [maxRank, setMaxRank] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();

  // Load CF handle from localStorage first (fast), then verify/update with DB
  useEffect(() => {
    const stored = localStorage.getItem("cf_handle");
    if (stored) {
      setSavedHandle(stored);
      const cached = localStorage.getItem("cf_rating_data");
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.handle === stored) {
            setRating(data.rating);
            setRank(data.rank);
            setMaxRating(data.maxRating);
            setMaxRank(data.maxRank);
          }
        } catch {}
      }
    }

    async function loadProfile() {
      if (userId) {
        const profile = await getUserProfile();
        if (profile?.cfHandle) {
          setSavedHandle(profile.cfHandle);
          const d = profile.cfRatingData as any;
          if (d) {
            setRating(d.rating ?? null);
            setRank(d.rank ?? "");
            setMaxRating(d.maxRating ?? null);
            setMaxRank(d.maxRank ?? "");

            // Sync to local storage for next time
            localStorage.setItem("cf_handle", profile.cfHandle);
            localStorage.setItem("cf_rating_data", JSON.stringify(d));
            return;
          }
          fetchRating(profile.cfHandle, true);
          return;
        }
      }
      // If we had a stored handle but no DB profile (or logged out), fetch fresh data
      if (stored && !rating) {
        fetchRating(stored, true);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchRating = async (h: string, silent = false): Promise<boolean> => {
    if (!h) return false;
    setLoading(true);
    try {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${h}`);
      const json = await res.json();
      if (json.status === "OK") {
        const user = json.result[0];
        setRating(user.rating ?? null);
        setRank(user.rank ?? "");
        setMaxRating(user.maxRating ?? null);
        setMaxRank(user.maxRank ?? "");

        const ratingData = {
          handle: h,
          rating: user.rating ?? null,
          rank: user.rank ?? "",
          maxRating: user.maxRating ?? null,
          maxRank: user.maxRank ?? "",
        };

        // Save to localStorage as fast cache
        localStorage.setItem("cf_rating_data", JSON.stringify(ratingData));
        // Save to DB if user is signed in (done via saveHandle flow)

        if (!silent) toast.success(`Rating refreshed: ${user.rating ?? "Unrated"}`);
        return true;
      } else {
        toast.error("Codeforces user not found", {
          description: `No user with handle "${h}" exists. Try a different handle.`,
          position: "top-center",
          duration: 5000,
        });
        return false;
      }
    } catch {
      toast.error("Could not reach Codeforces", {
        description: "Check your internet connection and try again.",
        position: "top-center",
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveHandle = async () => {
    const h = handle.trim();
    if (!h) return;
    const ok = await fetchRating(h);
    if (ok) {
      // Persist to localStorage
      localStorage.setItem("cf_handle", h);
      setSavedHandle(h);
      setEditing(false);
      setHandle("");
      // Persist to DB
      const cached = localStorage.getItem("cf_rating_data");
      if (userId && cached) {
        try {
          const ratingData = JSON.parse(cached);
          await saveCfHandle(h, ratingData);
        } catch {}
      }
    }
  };

  // Not yet set up
  if (!savedHandle && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 bg-[#1a67ff] hover:bg-[#155de0] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow"
      >
        <img src="/code-forces.svg" alt="CF" className="w-4 h-4" />
        Connect Codeforces
      </button>
    );
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveHandle();
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          autoFocus
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="CF handle..."
          className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 w-36"
        />
        <button
          type="submit"
          className="bg-[#1a67ff] hover:bg-[#155de0] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-zinc-500 hover:text-white text-xs px-2 py-1.5"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Info block */}
      <div className="flex flex-col">
        {/* Row 1: icon + handle + edit */}
        <div className="flex items-center gap-2">
          <img src="/code-forces.svg" alt="CF" className="w-5 h-5" />
          <a
            href={`https://codeforces.com/profile/${savedHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: cfRankColor(rank) }}
            className="text-base font-bold hover:underline"
          >
            {savedHandle}
          </a>
          <button
            onClick={() => setEditing(true)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Change handle"
          >
            <Edit2 size={11} />
          </button>
        </div>
        {/* Row 2: Contest rating */}
        <div className="text-sm text-zinc-400 mt-0.5 pl-0.5">
          Contest rating:{" "}
          <span style={{ color: cfRankColor(rank) }} className="text-sm font-semibold">
            {rating ?? "—"}
          </span>
          {maxRating !== null && (
            <span className="text-zinc-500">
              {" "}
              (max. <span style={{ color: cfRankColor(maxRank) }}>{maxRank}</span>
              {", "}
              {maxRating})
            </span>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={() => fetchRating(savedHandle)}
        disabled={loading}
        className="flex items-center gap-2 bg-[#1a67ff] hover:bg-[#155de0] disabled:opacity-60 text-white text-base font-bold px-5 py-2.5 rounded-xl transition-colors shadow shrink-0"
      >
        <img src="/code-forces.svg" alt="CF" className="w-5 h-5" />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

// ── Color palettes for cards — cycles through 6 distinct accent colors ─────
const CARD_ACCENTS = [
  {
    orb: "bg-blue-500",
    bar: "from-blue-600 to-violet-600",
    badge: "bg-blue-600 text-white",
    border: "hover:border-blue-800",
  },
  {
    orb: "bg-violet-500",
    bar: "from-violet-600 to-pink-600",
    badge: "bg-violet-600 text-white",
    border: "hover:border-violet-800",
  },
  {
    orb: "bg-cyan-500",
    bar: "from-cyan-500 to-blue-600",
    badge: "bg-cyan-600 text-white",
    border: "hover:border-cyan-800",
  },
  {
    orb: "bg-emerald-500",
    bar: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-600 text-white",
    border: "hover:border-emerald-800",
  },
  {
    orb: "bg-orange-500",
    bar: "from-orange-500 to-rose-600",
    badge: "bg-orange-600 text-white",
    border: "hover:border-orange-800",
  },
  {
    orb: "bg-pink-500",
    bar: "from-pink-500 to-violet-600",
    badge: "bg-pink-600 text-white",
    border: "hover:border-pink-800",
  },
];

function getStatus(solved: number, total: number) {
  if (total === 0 || solved === 0) return { label: "Start now", Icon: Play };
  if (solved >= total) return { label: "Completed", Icon: Trophy };
  return { label: "Keep going", Icon: Zap };
}

// ── Progress bar ───────────────────────────────────────────────────────────
function Bar({ pct, gradient }: { pct: number; gradient: string }) {
  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
          pct >= 100 ? "from-green-500 to-emerald-400" : gradient
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────
function LadderCard({
  slug,
  displayName,
  totalProblems,
  order,
  solved,
  accent,
}: LadderMeta & { solved: number; accent: (typeof CARD_ACCENTS)[number] }) {
  const router = useRouter();
  const pct = totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0;
  const { label, Icon } = getStatus(solved, totalProblems);
  const isCompleted = pct >= 100;

  return (
    <button
      onClick={() => router.push(`/cp-ladder/${slug}`)}
      className={`group relative w-full text-left rounded-2xl border border-zinc-800 bg-zinc-950 transition-all duration-300 overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col ${accent.border}`}
    >
      {/* Full-color Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90 transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundImage: `url('/cp-ladder-images/${slug}.jpg')` }}
      />

      {/* Clean Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />

      {/* Decorative orb — top right */}
      <div
        className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity ${isCompleted ? "bg-green-500" : accent.orb}`}
      />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative p-6 flex flex-col gap-4 z-10 w-full flex-1 min-h-[220px]">
        {/* Top row: Empty left space to push badge right */}
        <div className="flex items-start justify-between">
          <div /> {/* Spacer */}
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-black px-3 py-1.5 rounded-full ${accent.badge} shadow-lg border border-white/20`}
            >
              #{order}
            </span>
            <ArrowRight
              size={18}
              className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all"
            />
          </div>
        </div>

        {/* Middle stretch to push text to the bottom */}
        <div className="flex-1" />

        {/* Bottom section: Title, Problems count, and Progress */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-100 leading-snug drop-shadow-md">
              {displayName}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-xs text-zinc-300 font-medium">{totalProblems} problems</p>
              <div className="flex items-center gap-1.5">
                {isCompleted ? (
                  <Trophy size={13} className="text-green-400" />
                ) : pct > 0 ? (
                  <Zap size={13} className="text-blue-400" />
                ) : (
                  <Play size={13} className="text-zinc-500" />
                )}
                <span
                  className={`text-xs font-semibold ${isCompleted ? "text-green-400" : pct > 0 ? "text-blue-400" : "text-zinc-500"}`}
                >
                  {label}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Bar pct={pct} gradient={accent.bar} />
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-600 tabular-nums">
                {solved}/{totalProblems}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${isCompleted ? "text-green-400" : pct > 0 ? "text-white" : "text-zinc-500"}`}
              >
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Activity Heatmap Wrapper ─────────────────────────────────────────────────
function ActivityHeatmap() {
  const [data, setData] = useState<CalendarHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  // Fetch immediately on mount — no dependency on parent progress loading
  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      setLoading(true);
      try {
        // Optimistic load from localStorage
        if (!cancelled) {
          const raw = localStorage.getItem("cp_ladder_activity");
          const activity: Record<string, number> = raw ? JSON.parse(raw) : {};
          const heatmapData: CalendarHeatmapData[] = Object.entries(activity).map(
            ([dateStr, count]) => ({
              date: new Date(dateStr + "T12:00:00"),
              count,
            })
          );
          if (heatmapData.length > 0) {
            setData(heatmapData);
            setLoading(false);
          }
        }

        // Try DB in background
        if (userId) {
          const dbActivity = await getCpLadderActivity();
          if (!cancelled && dbActivity && Object.keys(dbActivity).length > 0) {
            const heatmapData: CalendarHeatmapData[] = Object.entries(dbActivity).map(
              ([dateStr, count]) => ({
                date: new Date(dateStr + "T12:00:00"),
                count,
              })
            );
            setData(heatmapData);
            setLoading(false);

            // Sync to local storage
            localStorage.setItem("cp_ladder_activity", JSON.stringify(dbActivity));
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }
    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ── All stats in a single useMemo pass ──────────────────────────────────
  const { totalSolved, activeDays, maxStreak, currentStreak } = useMemo(() => {
    let totalSolved = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    if (data.length === 0) return { totalSolved, activeDays, maxStreak, currentStreak };

    // Build sorted timestamp array of active days in one pass
    const activeDatesMs: number[] = [];
    for (const d of data) {
      totalSolved += d.count;
      if (d.count > 0) {
        activeDays++;
        const dt = d.date;
        activeDatesMs.push(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime());
      }
    }
    activeDatesMs.sort((a, b) => a - b);

    // Compute streaks
    if (activeDatesMs.length > 0) {
      const DAY_MS = 86400000;
      let streak = 1;
      maxStreak = 1;
      for (let i = 1; i < activeDatesMs.length; i++) {
        const diff = activeDatesMs[i] - activeDatesMs[i - 1];
        if (diff === DAY_MS) {
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        } else if (diff > DAY_MS) {
          streak = 1;
        }
      }
      // Current streak: count back from today
      const todayMs = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ).getTime();
      const last = activeDatesMs[activeDatesMs.length - 1];
      if (last === todayMs || last === todayMs - DAY_MS) {
        currentStreak = 1;
        for (let i = activeDatesMs.length - 2; i >= 0; i--) {
          if (activeDatesMs[i + 1] - activeDatesMs[i] === DAY_MS) {
            currentStreak++;
          } else break;
        }
      }
    }

    return { totalSolved, activeDays, maxStreak, currentStreak };
  }, [data]);

  return (
    <CalendarHeatmap
      data={data}
      activeDays={activeDays}
      maxStreak={maxStreak}
      currentStreak={currentStreak}
      totalSolved={totalSolved}
      loading={loading}
    />
  );
}

// ── Main Index ─────────────────────────────────────────────────────────────
export default function CpLadderIndex({ ladders }: { ladders: LadderMeta[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const gradId = useId().replace(/:/g, "-");
  const { userId } = useAuth();

  useEffect(() => {
    async function loadProgress() {
      // 1. Fast path: load from localStorage immediately
      const result: Record<string, number> = {};
      const localData: Record<string, Record<string, any>> = {};
      ladders.forEach(({ slug }) => {
        try {
          const raw = localStorage.getItem(`cp_ladder_${slug}`);
          if (raw) {
            const meta: Record<string, { status: string; bookmarked?: boolean; note?: string }> =
              JSON.parse(raw);
            localData[slug] = meta;
            // Prefer DB-synced count hint for accuracy, fall back to counting from meta
            const dbHint = localStorage.getItem(`cp_ladder_${slug}_db_count`);
            result[slug] =
              dbHint !== null
                ? parseInt(dbHint, 10)
                : Object.values(meta).filter((m) => m.status === "solved").length;
          } else {
            const dbHint = localStorage.getItem(`cp_ladder_${slug}_db_count`);
            result[slug] = dbHint !== null ? parseInt(dbHint, 10) : 0;
          }
        } catch {
          result[slug] = 0;
        }
      });
      setProgress(result);
      setMounted(true);

      // 2. Slow path: fetch from DB and merge/sync
      if (userId) {
        const dbCounts = await getAllLaddersSolvedCounts();
        // Only trust DB if it actually has solved records
        if (dbCounts && Object.keys(dbCounts).length > 0) {
          setProgress(dbCounts);
          // ── Sync DB counts back to localStorage so next visit is instant ──
          for (const [slug, count] of Object.entries(dbCounts)) {
            try {
              const raw = localStorage.getItem(`cp_ladder_${slug}`);
              const meta: Record<string, { status: string; bookmarked?: boolean; note?: string }> =
                raw ? JSON.parse(raw) : {};
              // If DB says more solved than local, mark the difference
              // We store the DB count hint so the index reads it instantly
              localStorage.setItem(`cp_ladder_${slug}_db_count`, String(count));
            } catch {}
          }
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
