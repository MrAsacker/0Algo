import { NextResponse } from "next/server";
import { getVideoSolutions } from "@/lib/database";
import { VideoSolution } from "@/lib/db";

export async function GET(req: Request, context: any) {
  try {
    const { params } = context;
    const { questionId } = params;
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
