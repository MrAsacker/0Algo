"use server";

import { auth } from "@clerk/nextjs/server";
import { db, userProgress } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleQuestionProgress(questionId: string, completed: boolean) {
  // FIX: Add 'await' here
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // ... rest of your code remains the same
    if (completed) {
      const existing = await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.questionSlug, questionId)));

      if (existing.length === 0) {
        await db.insert(userProgress).values({
          userId: userId,
          questionSlug: questionId,
          completed: true,
          completedAt: new Date(),
        });
      }
    } else {
      await db
        .delete(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.questionSlug, questionId)));
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle progress:", error);
    return { success: false, error: "Database error" };
  }
}
