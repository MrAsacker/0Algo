"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userProfiles, cpLadderTracking } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

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
    const existing = await db
      .select()
      .from(cpLadderTracking)
      .where(
        and(
          eq(cpLadderTracking.userId, userId),
          eq(cpLadderTracking.listSlug, listSlug),
          eq(cpLadderTracking.questionId, questionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      await db
        .update(cpLadderTracking)
        .set({
          status: data.status ?? record.status,
          bookmarked: data.bookmarked ?? record.bookmarked,
          note: data.note ?? record.note,
          completedAt:
            data.status === "solved" && record.status !== "solved"
              ? new Date()
              : record.completedAt,
        })
        .where(eq(cpLadderTracking.id, record.id));
    } else {
      await db.insert(cpLadderTracking).values({
        userId,
        listSlug,
        questionId,
        status: data.status ?? "none",
        bookmarked: data.bookmarked ?? false,
        note: data.note ?? "",
        completedAt: new Date(),
      });
    }
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
        const dateStr = r.completedAt.toISOString().split("T")[0];
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
    const records = await db
      .select({
        listSlug: cpLadderTracking.listSlug,
      })
      .from(cpLadderTracking)
      .where(and(eq(cpLadderTracking.userId, userId), eq(cpLadderTracking.status, "solved")));

    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.listSlug] = (counts[r.listSlug] || 0) + 1;
    }
    return counts;
  } catch (error) {
    console.error("Failed to fetch ladder counts:", error);
    return null;
  }
}
