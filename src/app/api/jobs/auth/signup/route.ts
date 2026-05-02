import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateUsers, candidateProfiles } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/tokens";
import { getDiscipline } from "@/lib/jobs/disciplines";

const PDPL_TERMS_VERSION = "2026-05-02";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;

    // Profile fields
    const role = String(body.role ?? "").trim();
    const disciplineSlug = String(body.disciplineSlug ?? "").trim() || null;
    const specialtySlug = String(body.specialtySlug ?? "").trim() || null;
    const experienceYears = Number.isFinite(body.experienceYears) ? Math.max(0, Math.floor(body.experienceYears)) : null;
    const licenseStatus = String(body.licenseStatus ?? "").trim() || null;
    const currentCitySlug = String(body.currentCitySlug ?? "").trim() || null;
    const preferredCitySlugs = Array.isArray(body.preferredCitySlugs)
      ? body.preferredCitySlugs.map((s: unknown) => String(s)).filter(Boolean).slice(0, 8)
      : [];
    const willingToRelocate = Boolean(body.willingToRelocate);
    const visaStatus = String(body.visaStatus ?? "").trim() || null;
    const salaryExpectationMinAed = Number.isFinite(body.salaryExpectationMinAed)
      ? Math.max(0, Math.floor(body.salaryExpectationMinAed))
      : null;
    const salaryExpectationMaxAed = Number.isFinite(body.salaryExpectationMaxAed)
      ? Math.max(0, Math.floor(body.salaryExpectationMaxAed))
      : null;
    const employmentTypePref = Array.isArray(body.employmentTypePref)
      ? body.employmentTypePref.map((s: unknown) => String(s)).filter(Boolean).slice(0, 4)
      : [];
    const visibility = ["public", "limited", "private"].includes(String(body.visibility))
      ? String(body.visibility)
      : "limited";
    const notifyEmail = body.notifyEmail !== false;
    const notifyWhatsapp = Boolean(body.notifyWhatsapp);
    const whatsappNumber = String(body.whatsappNumber ?? "").trim() || null;
    const marketingOptIn = Boolean(body.marketingOptIn);

    // Consent — PDPL clickwrap
    const consentTerms = Boolean(body.consentTerms);
    const consentDataProcessing = Boolean(body.consentDataProcessing);
    const consentRecruiterVisibility = Boolean(body.consentRecruiterVisibility);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!isStrongEnoughPassword(password)) {
      return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: "Pick the role family that best describes you." }, { status: 400 });
    }
    if (!consentTerms || !consentDataProcessing) {
      return NextResponse.json(
        { error: "Please accept the Terms and PDPL data-processing notice to continue." },
        { status: 400 }
      );
    }

    // Validate discipline against taxonomy if provided
    if (disciplineSlug && !getDiscipline(disciplineSlug)) {
      return NextResponse.json({ error: "Unknown discipline." }, { status: 400 });
    }

    const existing = (
      await db
        .select({ id: candidateUsers.id })
        .from(candidateUsers)
        .where(eq(candidateUsers.email, email))
        .limit(1)
    )[0];
    if (existing) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    const userId = createId("cand");
    const profileId = createId("cprof");
    const now = new Date();

    await db.insert(candidateUsers).values({
      id: userId,
      email,
      name,
      passwordHash: await hashPassword(password),
      marketingOptIn,
    });

    await db.insert(candidateProfiles).values({
      id: profileId,
      userId,
      role,
      disciplineSlug,
      specialtySlug,
      experienceYears,
      licenseStatus,
      currentCitySlug,
      preferredCitySlugs,
      willingToRelocate,
      visaStatus,
      salaryExpectationMinAed,
      salaryExpectationMaxAed,
      employmentTypePref,
      visibility,
      profileCompleteness: computeCompleteness({
        role,
        disciplineSlug,
        currentCitySlug,
        experienceYears,
        licenseStatus,
        preferredCitySlugs,
      }),
      notifyEmail,
      notifyWhatsapp,
      whatsappNumber,
      consentTermsAt: now,
      consentTermsVersion: PDPL_TERMS_VERSION,
      consentDataProcessingAt: now,
      consentRecruiterVisibilityAt: consentRecruiterVisibility ? now : null,
    });

    return NextResponse.json({
      ok: true,
      user: { id: userId, email, name },
      profileId,
    });
  } catch (err) {
    console.error("[candidate-auth] signup failed:", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}

function computeCompleteness(input: {
  role: string;
  disciplineSlug: string | null;
  currentCitySlug: string | null;
  experienceYears: number | null;
  licenseStatus: string | null;
  preferredCitySlugs: string[];
}): number {
  let n = 0;
  if (input.role) n += 20;
  if (input.disciplineSlug) n += 15;
  if (input.currentCitySlug) n += 15;
  if (input.experienceYears !== null) n += 10;
  if (input.licenseStatus) n += 15;
  if (input.preferredCitySlugs.length > 0) n += 10;
  return Math.min(85, n); // CV upload + photo cover the remaining 15
}
