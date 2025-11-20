import { NextResponse } from "next/server";
import { getVideoSolutions } from "@/lib/database";
import { VideoSolution } from "@/lib/db";

interface Context {
  params: { questionId: string };
}

export async function GET(context: Context) {
  try {
    const { questionId } = context.params;
    const qId = parseInt(questionId, 10);

    if (isNaN(qId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const videos: VideoSolution[] = await getVideoSolutions(qId);

    return NextResponse.json(videos);
  } catch (error) {
    console.error("API error fetching videos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
