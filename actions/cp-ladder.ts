"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userProfiles, cpLadderTracking } from "@/lib/schema";
import { and, count, eq, sql } from "drizzle-orm";

// ── Codeforces Handle & Rating ────────────────────────────────────────────────

export async function getUserProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return profile ?? null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export async function saveCfHandle(cfHandle: string, cfRatingData: object) {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userProfiles)
        .set({ cfHandle, cfRatingData, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));
    } else {
      await db.insert(userProfiles).values({
        userId,
        cfHandle,
        cfRatingData,
      });
    }
    return true;
  } catch (error) {
    console.error("Failed to save CF handle:", error);
    return false;
  }
}

// ── CP Ladder Progress (for the Index page overview) ─────────────────────────

export async function getCpLadderProgress(listSlug: string) {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const records = await db
      .select()
      .from(cpLadderTracking)
      .where(and(eq(cpLadderTracking.userId, userId), eq(cpLadderTracking.listSlug, listSlug)));

    const metaMap: Record<string, { status: string; bookmarked: boolean; note: string | null }> =
      {};
    for (const r of records) {
      metaMap[r.questionId] = {
        status: r.status,
        bookmarked: r.bookmarked ?? false,
        note: r.note ?? "",
      };
    }
    return metaMap;
  } catch (error) {
    console.error("Failed to fetch CP Ladder progress:", error);
    return null;
  }
}

export async function updateCpLadderProgress(
  listSlug: string,
  questionId: string,
  data: { status?: "none" | "attempted" | "solved"; bookmarked?: boolean; note?: string }
) {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    // Single UPSERT: eliminates SELECT+UPDATE double round-trip
    await db
      .insert(cpLadderTracking)
      .values({
        userId,
        listSlug,
        questionId,
        status: data.status ?? "none",
        bookmarked: data.bookmarked ?? false,
        note: data.note ?? "",
        completedAt: data.status === "solved" ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [cpLadderTracking.userId, cpLadderTracking.listSlug, cpLadderTracking.questionId],
        set: {
          status: data.status !== undefined ? data.status : sql`${cpLadderTracking.status}`,
          bookmarked:
            data.bookmarked !== undefined ? data.bookmarked : sql`${cpLadderTracking.bookmarked}`,
          note: data.note !== undefined ? data.note : sql`${cpLadderTracking.note}`,
          completedAt: data.status === "solved" ? new Date() : sql`${cpLadderTracking.completedAt}`,
        },
      });
    return true;
  } catch (error) {
    console.error("Failed to update CP Ladder progress:", error);
    return false;
  }
}

// ── Activity Heatmap ──────────────────────────────────────────────────────────

export async function getCpLadderActivity() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const records = await db
      .select({ completedAt: cpLadderTracking.completedAt })
      .from(cpLadderTracking)
      .where(and(eq(cpLadderTracking.userId, userId), eq(cpLadderTracking.status, "solved")));

    const activityMap: Record<string, number> = {};
    for (const r of records) {
      if (r.completedAt) {
        const y = r.completedAt.getFullYear();
        const m = String(r.completedAt.getMonth() + 1).padStart(2, "0");
        const day = String(r.completedAt.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${day}`;
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    }
    return activityMap;
  } catch (error) {
    console.error("Failed to fetch CP Ladder activity:", error);
    return null;
  }
}

// ── All-ladders solved count (for the overview cards) ────────────────────────

export async function getAllLaddersSolvedCounts(): Promise<Record<string, number> | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // SQL COUNT+GROUP BY: DB does aggregation — returns 1 row per ladder, not N problem rows
    const records = await db
      .select({
        listSlug: cpLadderTracking.listSlug,
        solvedCount: count(cpLadderTracking.id),
      })
      .from(cpLadderTracking)
      .where(and(eq(cpLadderTracking.userId, userId), eq(cpLadderTracking.status, "solved")))
      .groupBy(cpLadderTracking.listSlug);

    return Object.fromEntries(records.map((r) => [r.listSlug, r.solvedCount]));
  } catch (error) {
    console.error("Failed to fetch ladder counts:", error);
    return null;
  }
}

// ── All-ladders full progress (used by DataPrefetcher to warm localStorage) ──

export async function getAllLaddersProgress(): Promise<Record<
  string,
  Record<string, { status: string; bookmarked: boolean; note: string }>
> | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Single DB call — fetch every tracked problem for this user across all ladders
    const records = await db
      .select({
        listSlug: cpLadderTracking.listSlug,
        questionId: cpLadderTracking.questionId,
        status: cpLadderTracking.status,
        bookmarked: cpLadderTracking.bookmarked,
        note: cpLadderTracking.note,
      })
      .from(cpLadderTracking)
      .where(eq(cpLadderTracking.userId, userId));

    // Group by ladder slug
    const result: Record<
      string,
      Record<string, { status: string; bookmarked: boolean; note: string }>
    > = {};
    for (const r of records) {
      if (!result[r.listSlug]) result[r.listSlug] = {};
      result[r.listSlug][r.questionId] = {
        status: r.status,
        bookmarked: r.bookmarked ?? false,
        note: r.note ?? "",
      };
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch all ladders progress:", error);
    return null;
  }
}
