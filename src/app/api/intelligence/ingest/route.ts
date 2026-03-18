import { NextResponse } from "next/server";
import { runContentPipeline } from "@/lib/intelligence/automation/pipeline";

// POST /api/intelligence/ingest
// Triggers the content ingestion pipeline.
// Protected by CRON_SECRET for Vercel Cron Jobs.
// Vercel cron: every 2 hours (see vercel.json)
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runContentPipeline();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Pipeline failed", detail: String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers during development
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Use POST" }, { status: 405 });
  }
  const result = await runContentPipeline();
  return NextResponse.json(result);
}
