import { NextResponse } from "next/server";
import { getVideoSolutions } from "@/lib/database";
import { VideoSolution } from "@/lib/db";

interface Params {
  questionId: string;
}

export async function GET(req: Request, { params }: { params: Params }) {
  try {
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
