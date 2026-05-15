import { NextRequest, NextResponse } from "next/server";
import { readJsonObject } from "@/lib/http/read-json";
import { createAuthorizedProviderPortalMagicLink } from "@/lib/provider-portal/magic";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonObject(request);
    if (parsed.error) return parsed.error;

    await createAuthorizedProviderPortalMagicLink({
      email: String(parsed.data.email || ""),
      redirect: parsed.data.redirect,
      requestUrl: request.url,
    });

    // Deliberately generic: an email address must already be granted by Zavis,
    // but this endpoint must not reveal which clinics/emails have access.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[provider-portal] magic link request failed:", err);
    return NextResponse.json({ error: "Could not send sign-in link." }, { status: 500 });
  }
}
