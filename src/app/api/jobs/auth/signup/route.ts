import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateUsers, candidateProfiles } from "@/lib/db/schema";
import { createId } from "@/lib/id";
import { hashPassword, isStrongEnoughPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/tokens";
import { getDiscipline, ROLE_ORDER } from "@/lib/jobs/disciplines";
import { UAE_CITIES } from "@/lib/jobs/format";

const PDPL_TERMS_VERSION = "2026-05-02";

const ALLOWED_ROLES = new Set<string>(ROLE_ORDER);
const ALLOWED_LICENSE_STATUSES = new Set([
  "dha",
  "doh",
  "mohap",
  "dataflow_pending",
  "outside_uae",
  "none",
]);
const ALLOWED_VISA_STATUSES = new Set(["citizen", "residence", "needs_sponsorship"]);
const ALLOWED_EMPLOYMENT_TYPES = new Set(["full_time", "part_time", "locum", "visiting"]);
const ALLOWED_VISIBILITY = new Set(["public", "limited", "private"]);
const UAE_CITY_SLUGS = new Set<string>(UAE_CITIES.map((c) => c.slug));

const SALARY_MAX = 1_000_000; // AED/month — anything above is malformed input
const EXPERIENCE_MAX = 80; // years
const WHATSAPP_REGEX = /^[+]?[\d\s\-()]{6,20}$/;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clampInt(n: unknown, lo: number, hi: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, Math.floor(n)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;

    // Profile fields — every enum-valued field is allowlisted server-side so
    // bad input returns a clean 400 instead of a Postgres CHECK-violation 500.
    const role = String(body.role ?? "").trim();
    const disciplineSlug = String(body.disciplineSlug ?? "").trim() || null;
    const specialtySlug = String(body.specialtySlug ?? "").trim() || null;
    const experienceYears = clampInt(body.experienceYears, 0, EXPERIENCE_MAX);
    const licenseStatusRaw = String(body.licenseStatus ?? "").trim();
    const licenseStatus = licenseStatusRaw || null;
    const currentCitySlugRaw = String(body.currentCitySlug ?? "").trim();
    const currentCitySlug = currentCitySlugRaw || null;
    const preferredCitySlugs = (Array.isArray(body.preferredCitySlugs)
      ? body.preferredCitySlugs.map((s: unknown) => String(s)).filter(Boolean)
      : ([] as string[])
    )
      .filter((s: string) => UAE_CITY_SLUGS.has(s))
      .slice(0, 8);
    const willingToRelocate = Boolean(body.willingToRelocate);
    const visaStatusRaw = String(body.visaStatus ?? "").trim();
    const visaStatus = visaStatusRaw || null;
    const salaryExpectationMinAed = clampInt(body.salaryExpectationMinAed, 0, SALARY_MAX);
    const salaryExpectationMaxAed = clampInt(body.salaryExpectationMaxAed, 0, SALARY_MAX);
    const employmentTypePref = (Array.isArray(body.employmentTypePref)
      ? body.employmentTypePref.map((s: unknown) => String(s)).filter(Boolean)
      : ([] as string[])
    )
      .filter((s: string) => ALLOWED_EMPLOYMENT_TYPES.has(s))
      .slice(0, 4);
    const visibilityRaw = String(body.visibility ?? "").trim();
    const visibility = ALLOWED_VISIBILITY.has(visibilityRaw) ? visibilityRaw : "limited";
    const notifyEmail = body.notifyEmail !== false;
    const notifyWhatsapp = Boolean(body.notifyWhatsapp);
    const whatsappNumberRaw = String(body.whatsappNumber ?? "").trim();
    const whatsappNumber = whatsappNumberRaw || null;
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
    if (!role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Pick the role family that best describes you." }, { status: 400 });
    }
    if (!consentTerms || !consentDataProcessing) {
      return NextResponse.json(
        { error: "Please accept the Terms and PDPL data-processing notice to continue." },
        { status: 400 }
      );
    }

    // Allowlist validation for enum-valued fields with CHECK constraints in SQL
    if (disciplineSlug && !getDiscipline(disciplineSlug)) {
      return NextResponse.json({ error: "Unknown discipline." }, { status: 400 });
    }
    if (licenseStatus && !ALLOWED_LICENSE_STATUSES.has(licenseStatus)) {
      return NextResponse.json({ error: "Invalid licence status." }, { status: 400 });
    }
    if (visaStatus && !ALLOWED_VISA_STATUSES.has(visaStatus)) {
      return NextResponse.json({ error: "Invalid visa status." }, { status: 400 });
    }
    if (currentCitySlug && !UAE_CITY_SLUGS.has(currentCitySlug)) {
      return NextResponse.json({ error: "Invalid city." }, { status: 400 });
    }
    if (whatsappNumber && !WHATSAPP_REGEX.test(whatsappNumber)) {
      return NextResponse.json({ error: "Invalid WhatsApp number." }, { status: 400 });
    }
    if (
      salaryExpectationMinAed != null &&
      salaryExpectationMaxAed != null &&
      salaryExpectationMinAed > salaryExpectationMaxAed
    ) {
      return NextResponse.json(
        { error: "Salary minimum cannot be higher than maximum." },
        { status: 400 }
      );
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
