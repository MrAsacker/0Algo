"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import CalendarHeatmap, { type CalendarHeatmapData } from "@/components/ui/calendar-heatmap";
import { getCpLadderActivity } from "@/actions/cp-ladder";

/** Returns today's date key "YYYY-MM-DD" in the user's LOCAL timezone. */
function todayLocalKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readLocalActivity(): Record<string, number> {
  try {
    const raw = localStorage.getItem("cp_ladder_activity");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function activityToData(activity: Record<string, number>): CalendarHeatmapData[] {
  return Object.entries(activity)
    .filter(([, c]) => c > 0)
    .map(([dateStr, count]) => ({
      date: new Date(dateStr + "T12:00:00"),
      count,
    }));
}

/**
 * Activity Heatmap component.
 *
 * Data flow:
 *  1. Instant paint: reads merged count map from localStorage (written by CpLadderClient on every toggle).
 *  2. Background DB sync: fetches authoritative counts from the server.
 *     - Past dates → trust DB completely (unsolved problems correctly reduce their day's count).
 *     - TODAY only → Math.max(db, local) to guard against the in-flight race condition where
 *       the DB write from the previous page hasn't committed yet when we re-mount.
 *       Once the DB catches up it returns >= local, so this is self-healing.
 *  3. Listens for "activityUpdated" custom events fired by CpLadderClient when a problem
 *     is toggled, so the heatmap updates instantly without requiring a re-mount.
 */
export default function ActivityHeatmap() {
  const [data, setData] = useState<CalendarHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      setLoading(true);
      try {
        // 1. Instant paint from localStorage
        const localActivity = readLocalActivity();
        if (!cancelled) {
          setData(activityToData(localActivity));
          setLoading(false);
        }

        // 2. Merge DB data — past dates trust DB, today uses Math.max
        if (userId) {
          const dbActivity = await getCpLadderActivity();
          if (!cancelled && dbActivity) {
            const freshLocal = readLocalActivity();
            const merged: Record<string, number> = { ...dbActivity };

            // Only protect today against in-flight race conditions
            const todayKey = todayLocalKey();
            if (freshLocal[todayKey] !== undefined) {
              merged[todayKey] = Math.max(merged[todayKey] ?? 0, freshLocal[todayKey]);
            }

            // Persist merged result so next mount is instantly accurate
            localStorage.setItem("cp_ladder_activity", JSON.stringify(merged));

            if (!cancelled) {
              setData(activityToData(merged));
            }
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }

    loadActivity();

    // Re-read localStorage whenever CpLadderClient fires an optimistic toggle
    const handleActivityUpdate = () => {
      if (!cancelled) setData(activityToData(readLocalActivity()));
    };
    window.addEventListener("activityUpdated", handleActivityUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("activityUpdated", handleActivityUpdate);
    };
  }, [userId]);

  const { totalSolved, activeDays, maxStreak, currentStreak } = useMemo(() => {
    let totalSolved = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    if (data.length === 0) return { totalSolved, activeDays, maxStreak, currentStreak };

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
