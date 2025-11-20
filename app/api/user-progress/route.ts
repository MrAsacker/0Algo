import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, userProgress } from "@/lib/db"; // Ensure this path is correct
import { eq } from "drizzle-orm";

export async function GET() {
  // FIX: Add 'await' here
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ slugs: [] });
  }

  try {
    const result = await db
      .select({ slug: userProgress.questionSlug })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const slugs = result.map((r) => r.slug);

    return NextResponse.json({ slugs });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ slugs: [] }, { status: 500 });
  }
}
