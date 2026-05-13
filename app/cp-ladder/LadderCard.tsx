"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Zap, Play } from "lucide-react";
import type { LadderMeta } from "./ladder-utils";

// ── Color palettes for cards — cycles through 6 distinct accent colors ─────
export const CARD_ACCENTS = [
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

// ── Progress bar ──────────────────────────────────────────────────────────
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

// ── Section Card ──────────────────────────────────────────────────────────
export default function LadderCard({
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
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div />
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

        <div className="flex-1" />

        {/* Bottom section */}
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
