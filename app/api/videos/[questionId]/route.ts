import { NextResponse } from "next/server";
// Use the '@/lib/database' and '@/lib/db' path aliases
import { getVideoSolutions } from "@/lib/database";
import { VideoSolution } from "@/lib/db"; // 'db.ts' exports the types from 'schema.ts'

/**
 * API route handler for GET /api/videos/[questionId]
 * This route fetches video solutions for a specific question ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } } // <-- This is the correct, complete signature
) {
  try {
    // We get the questionId from the 'params' object,
    // which comes from the dynamic folder name [questionId]
    const questionId = parseInt(params.questionId, 10);

    if (isNaN(questionId)) {
      // Handle cases where the ID is not a number
      return NextResponse.json(
        { error: "Invalid question ID. Must be a number." },
        { status: 400 }
      );
    }

    // Call our server-side database function
    const videos: VideoSolution[] = await getVideoSolutions(questionId);

    if (videos.length === 0) {
      // It's not an error if no videos are found,
      // just return an empty array. The frontend will handle this.
      return NextResponse.json([]);
    }

    // Success: return the array of video objects
    return NextResponse.json(videos);

  } catch (error) {
    console.error("API error fetching videos:", error);
    // Handle any unexpected server errors
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}