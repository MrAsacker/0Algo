import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { endpoint, body, headers } = await req.json();

    // 1. Forward request to AI Provider (Server-side, bypassing CORS)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers, // Passes Authorization: Bearer SK-... key
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Provider Error (${response.status})` },
        { status: response.status }
      );
    }

    // 2. Return the raw stream response to the client component
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/json", // We return JSON chunks
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Proxy Error" },
      { status: 500 }
    );
  }
}