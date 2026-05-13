"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { roadmapProgress } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Get all completed node IDs for a specific roadmap
export async function getRoadmapProgress(roadmapSlug: string): Promise<string[] | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const records = await db
      .select({ nodeId: roadmapProgress.nodeId })
      .from(roadmapProgress)
      .where(
        and(
          eq(roadmapProgress.userId, userId),
          eq(roadmapProgress.roadmapSlug, roadmapSlug),
          eq(roadmapProgress.completed, true)
        )
      );

    return records.map((r) => r.nodeId);
  } catch (error) {
    console.error("Failed to fetch roadmap progress:", error);
    return null;
  }
}

// Toggle a single node's completed status
export async function toggleRoadmapNode(
  roadmapSlug: string,
  nodeId: string,
  completed: boolean
): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    const existing = await db
      .select()
      .from(roadmapProgress)
      .where(
        and(
          eq(roadmapProgress.userId, userId),
          eq(roadmapProgress.roadmapSlug, roadmapSlug),
          eq(roadmapProgress.nodeId, nodeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(roadmapProgress)
        .set({ completed, completedAt: completed ? new Date() : null })
        .where(eq(roadmapProgress.id, existing[0].id));
    } else {
      await db.insert(roadmapProgress).values({
        userId,
        roadmapSlug,
        nodeId,
        completed,
        completedAt: completed ? new Date() : null,
      });
    }

    // Purge the Next.js router cache
    revalidatePath("/roadmaps", "layout");

    return true;
  } catch (error) {
    console.error("Failed to toggle roadmap node:", error);
    return false;
  }
}

// ── All-roadmaps full progress (used by DataPrefetcher to warm localStorage) ──

export async function getAllRoadmapsProgress(): Promise<Record<
  string,
  Record<string, boolean>
> | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const records = await db
      .select({ roadmapSlug: roadmapProgress.roadmapSlug, nodeId: roadmapProgress.nodeId })
      .from(roadmapProgress)
      .where(and(eq(roadmapProgress.userId, userId), eq(roadmapProgress.completed, true)));

    const result: Record<string, Record<string, boolean>> = {};
    for (const r of records) {
      if (!result[r.roadmapSlug]) result[r.roadmapSlug] = {};
      result[r.roadmapSlug][r.nodeId] = true;
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch all roadmaps progress:", error);
    return null;
  }
}
