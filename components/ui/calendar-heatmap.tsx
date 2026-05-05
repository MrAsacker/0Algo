"use client";

import React, { useRef, useEffect } from "react";

export interface CalendarHeatmapData {
  date: Date;
  count: number;
}

interface CalendarHeatmapProps {
  data: CalendarHeatmapData[];
  activeDays?: number;
  maxStreak?: number;
  totalSolved?: number;
}

const CELL = 13; // px per cell
const GAP = 3; // px gap between cells

function toKey(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function CalendarHeatmap({
  data,
  activeDays = 0,
  maxStreak = 0,
  totalSolved = 0,
}: CalendarHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  // ── Build lookup map ──────────────────────────────────────────────────────
  const countMap = new Map<string, number>();
  for (const { date, count } of data) {
    countMap.set(toKey(date), count);
  }

  // ── Build 53-week column grid ending today ────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Go back exactly 364 days to get a 52-week view
  const startRaw = new Date(today);
  startRaw.setDate(startRaw.getDate() - 363);

  // Rewind to the Sunday of that week
  const startSunday = new Date(startRaw);
  startSunday.setDate(startSunday.getDate() - startSunday.getDay());

  // Build weeks array: each week is an array of 7 dates (Sun→Sat)
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

  // ── Month label positions ─────────────────────────────────────────────────
  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    // Use the first day of the week that is actually within range
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

  // ── Color scale ───────────────────────────────────────────────────────────
  function cellColor(date: Date): string {
    const key = toKey(date);
    const inRange = date >= startRaw && date <= today;
    if (!inRange) return "transparent";
    const count = countMap.get(key) ?? 0;
    if (count === 0) return "#3f3f46"; // zinc-700 (empty)
    if (count === 1) return "#fee2e2"; // red-100 (lightest pink)
    if (count === 2) return "#fca5a5"; // red-300
    if (count <= 4) return "#dc2626"; // red-600
    return "#7f1d1d"; // red-900 (darkest)
  }

  const LEGEND = [
    { color: "#3f3f46" },
    { color: "#fee2e2" },
    { color: "#fca5a5" },
    { color: "#dc2626" },
    { color: "#7f1d1d" },
  ];

  const totalWidth = weeks.length * (CELL + GAP) - GAP;

  return (
    <div className="flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-4 h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-zinc-300">
          <span className="text-white font-black mr-1">{activeDays}</span> Active days
          <span className="text-zinc-600 mx-2">|</span>
          <span className="text-white font-black mr-1">{maxStreak}</span> Max streak
        </span>
        <span className="text-sm text-zinc-500">{totalSolved} solved this year</span>
      </div>
      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pb-2 mt-3"
      >
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
                  const key = toKey(day);
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
      </div>

      {/* Legend - pinned to bottom right */}
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
