import { NextRequest, NextResponse } from "next/server";

export async function readJsonObject(
  request: NextRequest
): Promise<
  | { data: Record<string, unknown>; error?: never }
  | { data?: never; error: NextResponse }
> {
  try {
    const data = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        error: NextResponse.json({ error: "JSON object body is required." }, { status: 400 }),
      };
    }
    return { data: data as Record<string, unknown> };
  } catch {
    return {
      error: NextResponse.json({ error: "Malformed JSON body." }, { status: 400 }),
    };
  }
}
