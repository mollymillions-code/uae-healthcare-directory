import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { candidateProfiles, candidateUsers } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth/nextauth";
import { getDiscipline, ROLE_LABELS, type Role } from "@/lib/jobs/disciplines";
import { cityName } from "@/lib/jobs/format";
import { Briefcase, MapPin, Bell, Pencil } from "lucide-react";
import { CvUpload } from "@/components/jobs/CvUpload";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.userType !== "candidate") {
    redirect(`/jobs/login?redirect=${encodeURIComponent("/jobs/profile")}`);
  }

  const userId = session.user.id;

  const [user, profile] = await Promise.all([
    db
      .select({
        id: candidateUsers.id,
        email: candidateUsers.email,
        name: candidateUsers.name,
      })
      .from(candidateUsers)
      .where(eq(candidateUsers.id, userId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  const discipline = profile?.disciplineSlug ? getDiscipline(profile.disciplineSlug) : null;
  const roleLabel = profile?.role ? ROLE_LABELS[profile.role as Role] : "—";

  return (
    <div className="mx-auto max-w-[920px] px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
        Your candidate profile
      </p>
      <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[32px] font-medium tracking-tight text-[#1c1c1c] sm:text-[40px]">
        Welcome, {user?.name || (user?.email ?? "").split("@")[0]}.
      </h1>
      <p className="mt-2 max-w-2xl font-['Geist',sans-serif] text-[14px] text-black/55">
        Your profile sits in the Zavis verified-candidate pool. Hiring clinics in our network search by discipline, city, licence status and experience — keep your profile current so the right opportunities surface.
      </p>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium tracking-tight text-[#1c1c1c]">
              Profile details
            </h2>
            <span className="rounded-full bg-[#006828]/[0.08] px-3 py-1 font-['Geist_Mono',monospace] text-[11px] font-medium text-[#006828]">
              {profile?.profileCompleteness ?? 0}% complete
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-y-4 text-[14px] sm:grid-cols-2">
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Role</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {discipline?.name ?? roleLabel}
              </dd>
            </div>
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Licence</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {profile?.licenseStatus ? formatLicenseStatus(profile.licenseStatus) : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Experience</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {profile?.experienceYears != null ? `${profile.experienceYears} years` : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Currently in</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {profile?.currentCitySlug ? cityName(profile.currentCitySlug) : "Outside the UAE"}
              </dd>
            </div>
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Open to</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {profile?.preferredCitySlugs && profile.preferredCitySlugs.length > 0
                  ? profile.preferredCitySlugs.map((s) => cityName(s)).join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-[0.16em] text-black/40">Salary expectation</dt>
              <dd className="mt-1 font-['Geist',sans-serif] text-[#1c1c1c]">
                {profile?.salaryExpectationMinAed
                  ? `AED ${profile.salaryExpectationMinAed.toLocaleString()}${
                      profile.salaryExpectationMaxAed
                        ? `–${profile.salaryExpectationMaxAed.toLocaleString()}`
                        : "+"
                    }`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
              Visibility
            </p>
            <p className="mt-1 font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium capitalize text-[#1c1c1c]">
              {profile?.visibility ?? "limited"}
            </p>
            <p className="mt-2 font-['Geist',sans-serif] text-[12px] text-black/55">
              {profile?.consentRecruiterVisibilityAt
                ? "Recruiter contact: enabled"
                : "Recruiter contact: off (default)"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
              Notifications
            </p>
            <ul className="mt-2 space-y-1.5 font-['Geist',sans-serif] text-[13px] text-[#1c1c1c]">
              <li className="flex items-center gap-2">
                <Bell className={`h-3.5 w-3.5 ${profile?.notifyEmail ? "text-[#006828]" : "text-black/30"}`} strokeWidth={2.25} />
                Email · {profile?.notifyEmail ? "on" : "off"}
              </li>
              <li className="flex items-center gap-2">
                <Bell className={`h-3.5 w-3.5 ${profile?.notifyWhatsapp ? "text-[#006828]" : "text-black/30"}`} strokeWidth={2.25} />
                WhatsApp · {profile?.notifyWhatsapp ? "on" : "off"}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] p-5">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
              PDPL
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-[13px] leading-relaxed text-[#1c1c1c]">
              Your profile data is processed under your consent. You can export, restrict or delete it at any time — write to <a href="mailto:privacy@zavis.ai" className="font-medium text-[#006828] underline-offset-2 hover:underline">privacy@zavis.ai</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <CvUpload
          initialCvUrl={profile?.cvUrl ?? null}
          initialUploadedAt={profile?.cvUploadedAt ?? null}
        />
      </section>

      <section className="mt-10">
        <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
          Quick actions
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/jobs"
            className="group rounded-2xl border border-black/[0.06] bg-white p-5 transition-all hover:border-[#006828]/40"
          >
            <Briefcase className="h-5 w-5 text-[#006828]" strokeWidth={2} />
            <p className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
              Browse careers
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-[13px] text-black/55">
              See discipline-specific career landing pages.
            </p>
          </Link>
          <Link
            href="/jobs/signup"
            className="group rounded-2xl border border-black/[0.06] bg-white p-5 transition-all hover:border-[#006828]/40"
          >
            <Pencil className="h-5 w-5 text-[#006828]" strokeWidth={2} />
            <p className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
              Update preferences
            </p>
            <p className="mt-1 font-['Geist',sans-serif] text-[13px] text-black/55">
              Re-run the wizard to refresh role, city, salary and licence preferences. Inline edit ships in Phase 2.
            </p>
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-black/[0.06] bg-white p-6">
        <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
          What happens next
        </p>
        <ol className="mt-3 space-y-3 font-['Geist',sans-serif] text-[14px] text-black/65">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#006828]/[0.08] text-[11px] font-semibold text-[#006828]">
              1
            </span>
            <span>
              <strong className="text-[#1c1c1c]">Zavis matches.</strong> Hiring clinics tell us what they&apos;re looking for; we surface candidates whose profile matches discipline, city, licence and experience.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#006828]" strokeWidth={2.25} />
            <span>
              <strong className="text-[#1c1c1c]">Clinic reaches out via Zavis.</strong> If a clinic wants to talk, you&apos;ll get a notification by email (and WhatsApp if you&apos;ve opted in). Your contact details are never shared without your consent.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Briefcase className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#006828]" strokeWidth={2.25} />
            <span>
              <strong className="text-[#1c1c1c]">Interview, offer, hire.</strong> Once you&apos;ve agreed to talk, the rest of the process — interview scheduling, offer negotiation, contract — happens directly between you and the clinic. Off-platform.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

function formatLicenseStatus(status: string): string {
  switch (status) {
    case "dha":
      return "Licensed in Dubai";
    case "doh":
      return "Licensed in Abu Dhabi";
    case "mohap":
      return "Licensed in Northern Emirates";
    case "dataflow_pending":
      return "Dataflow / Prometric in process";
    case "outside_uae":
      return "Licensed outside the UAE";
    case "none":
      return "No clinical licence";
    default:
      return status;
  }
}
