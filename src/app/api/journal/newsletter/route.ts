import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/journal/automation/newsletter";

/**
 * POST /api/journal/newsletter
 *
 * Subscribe an email to the Daily Briefing newsletter.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const success = await addSubscriber(email);

    if (success) {
      return NextResponse.json({ message: "Subscribed successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
