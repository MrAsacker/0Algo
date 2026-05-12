"use client";

import React, { useRef, useEffect, useMemo, memo } from "react";

export interface CalendarHeatmapData {
  date: Date;
  count: number;
}

interface CalendarHeatmapProps {
  data: CalendarHeatmapData[];
  activeDays?: number;
  maxStreak?: number;
  currentStreak?: number;
  totalSolved?: number;
  loading?: boolean;
}

const CELL = 13; // px per cell
const GAP = 3; // px gap between cells

/** Local-timezone YYYY-MM-DD string — no UTC conversion */
function toLocalKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get today midnight in LOCAL time — critical: never use UTC here */
function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function HeatmapSkeleton() {
  return (
    <div className="flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-4 h-full min-w-0 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-48 bg-zinc-800 rounded" />
        <div className="h-4 w-32 bg-zinc-800 rounded" />
      </div>
      <div className="flex gap-[3px] mt-3 overflow-hidden">
        {Array.from({ length: 53 }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, di) => (
              <div
                key={di}
                style={{ width: CELL, height: CELL, borderRadius: 3 }}
                className="bg-zinc-800"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-auto pt-2 border-t border-zinc-800/50">
        <div className="h-3 w-20 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

// ── Grid (memoized — won't re-render on tooltip/hover state changes in parent) ─
const HeatmapGrid = memo(function HeatmapGrid({
  weeks,
  startRaw,
  today,
  countMap,
  monthLabels,
  totalWidth,
}: {
  weeks: Date[][];
  startRaw: Date;
  today: Date;
  countMap: Map<string, number>;
  monthLabels: { label: string; weekIdx: number }[];
  totalWidth: number;
}) {
  function cellColor(date: Date): string {
    const inRange = date >= startRaw && date <= today;
    if (!inRange) return "transparent";
    const count = countMap.get(toLocalKey(date)) ?? 0;
    if (count === 0) return "#3f3f46";
    if (count === 1) return "#f6cfcfff";
    if (count === 2) return "#f68e8eff";
    if (count <= 4) return "#dc2626";
    return "#7f1d1d";
  }

  return (
    <div className="flex flex-col gap-1 w-max">
      {/* Month labels */}
      <div className="relative h-4" style={{ width: totalWidth }}>
        {monthLabels.map(({ label, weekIdx }) => (
          <span
            key={`${label}-${weekIdx}`}
            className="absolute text-[10px] text-zinc-400 font-medium"
            style={{ left: weekIdx * (CELL + GAP) }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid: 7 rows × N columns */}
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => {
              const key = toLocalKey(day);
              const count = countMap.get(key) ?? 0;
              const inRange = day >= startRaw && day <= today;
              return (
                <div
                  key={di}
                  title={inRange ? `${key}: ${count} solved` : ""}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    backgroundColor: cellColor(day),
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

const LEGEND = [
  { color: "#3f3f46" },
  { color: "#fee2e2" },
  { color: "#fca5a5" },
  { color: "#dc2626" },
  { color: "#7f1d1d" },
];

export default function CalendarHeatmap({
  data,
  activeDays = 0,
  maxStreak = 0,
  currentStreak = 0,
  totalSolved = 0,
  loading = false,
}: CalendarHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to rightmost (today) on data change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  // ── Compute grid (memoized — only recalculates when data changes) ──────────
  const { countMap, weeks, startRaw, today, monthLabels, totalWidth } = useMemo(() => {
    // Build lookup map using LOCAL date keys
    const countMap = new Map<string, number>();
    for (const { date, count } of data) {
      countMap.set(toLocalKey(date), count);
    }

    // today in LOCAL time — recalculated every mount
    const today = getLocalToday();

    // Go back exactly 364 days (52 full weeks = 364 days)
    const startRaw = new Date(today);
    startRaw.setDate(startRaw.getDate() - 364);

    // Rewind startRaw to the Sunday of its week
    const startSunday = new Date(startRaw);
    startSunday.setDate(startSunday.getDate() - startSunday.getDay());

    // Build weeks array
    const weeks: Date[][] = [];
    const cursor = new Date(startSunday);
    while (cursor <= today) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month labels
    const monthLabels: { label: string; weekIdx: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const first = week.find((d) => d >= startRaw && d <= today);
      if (!first) return;
      const m = first.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({
          label: first.toLocaleString("en-US", { month: "short" }),
          weekIdx: wi,
        });
        lastMonth = m;
      }
    });

    const totalWidth = weeks.length * (CELL + GAP) - GAP;

    return { countMap, weeks, startRaw, today, monthLabels, totalWidth };
  }, [data]); // ← only recalculate when data changes

  if (loading) return <HeatmapSkeleton />;

  return (
    <div className="flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-4 h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-zinc-300">
          <span className="text-white font-black mr-1">{activeDays}</span>Active days
          <span className="text-zinc-600 mx-2">|</span>
          <span className="text-white font-black mr-1">{maxStreak}</span>Max streak
          {currentStreak > 0 && (
            <>
              <span className="text-zinc-600 mx-2">|</span>
              <span className="text-orange-400 font-black mr-1">{currentStreak}</span>
              <span className="text-orange-400/70">🔥 streak</span>
            </>
          )}
        </span>
        <span className="text-sm text-zinc-500">{totalSolved} solved this year</span>
      </div>

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pb-2 mt-3"
      >
        <HeatmapGrid
          weeks={weeks}
          startRaw={startRaw}
          today={today}
          countMap={countMap}
          monthLabels={monthLabels}
          totalWidth={totalWidth}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-auto pt-2 border-t border-zinc-800/50">
        <span className="text-[10px] text-zinc-500">Less</span>
        {LEGEND.map(({ color }) => (
          <div
            key={color}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 3,
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        ))}
        <span className="text-[10px] text-zinc-500">More</span>
      </div>
    </div>
  );
}
