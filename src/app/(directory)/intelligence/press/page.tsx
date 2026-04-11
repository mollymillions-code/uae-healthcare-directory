import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllActiveReports } from "@/lib/reports/data";
import { pressHubSchema } from "@/lib/seo-reports";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft, Mail, FileText } from "lucide-react";

export const revalidate = 3600;

const PRESS_TITLE = "Zavis Press Room";
const PRESS_DESCRIPTION =
  "Press contact, embargo schedule and analyst access for journalists covering UAE and GCC healthcare. Zavis Intelligence Reports are open-access, methodologically disclosed and released on a rolling quarterly + annual calendar.";

export const metadata: Metadata = {
  title: "Zavis Press Room — UAE Healthcare Reports, Embargoes & Analyst Access",
  description: PRESS_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Zavis Intelligence Reports",
    url: `${getBaseUrl()}/intelligence/press`,
    title: PRESS_TITLE,
    description: PRESS_DESCRIPTION,
  },
  alternates: {
    canonical: `${getBaseUrl()}/intelligence/press`,
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PressPage() {
  const baseUrl = getBaseUrl();
  const reports = await getAllActiveReports();
  const published = reports.filter((r) => r.status === "published");
  const upcoming = reports.filter(
    (r) => r.status === "draft" || r.status === "scheduled"
  );

  const schemaNodes = pressHubSchema(
    reports.map((r) => ({
      slug: r.slug,
      title: r.title,
      headlineStat: r.headlineStat,
      releaseDate: r.releaseDate,
      methodology: "",
      dataSource: "",
      authors: [],
    })),
    baseUrl
  );

  const pressContactEmail = "press@zavis.ai";
  const dataRequestMailto = `mailto:${pressContactEmail}?subject=${encodeURIComponent("Zavis Intelligence — data request")}&body=${encodeURIComponent(
    "Hi Zavis press team,\n\nI'm requesting data access for the following report(s):\n\n[List the reports]\n\nMy outlet: \nStory angle:\nEmbargo needs:\n\nThanks,\n"
  )}`;
  const embargoRequestMailto = `mailto:${pressContactEmail}?subject=${encodeURIComponent("Zavis Intelligence — embargo access")}&body=${encodeURIComponent(
    "Hi Zavis press team,\n\nI'd like embargoed access to the following upcoming report(s):\n\n[List the reports]\n\nMy outlet: \nPlanned publication date:\n\nThanks,\n"
  )}`;

  return (
    <>
      {schemaNodes.map((node, i) => (
        <JsonLd key={`press-schema-${i}`} data={node} />
      ))}

      {/* Back link */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/intelligence"
          className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-black/40 hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Intelligence
        </Link>
      </div>

      {/* Masthead */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10">
        <div className="border-b-2 border-[#1c1c1c]" />
        <div className="pt-8">
          <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
            Press Room
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] text-[#1c1c1c] tracking-[-0.03em] max-w-3xl">
            Open-access UAE healthcare data — available on request.
          </h1>
          <p className="font-['Geist',sans-serif] text-base text-black/55 mt-5 max-w-2xl leading-relaxed">
            Zavis Intelligence Reports are released on a rolling calendar with embargo access for verified journalists and analyst interviews on request. Email{" "}
            <a href={`mailto:${pressContactEmail}`} className="text-[#006828] hover:underline">
              {pressContactEmail}
            </a>{" "}
            with your outlet and deadline — typical turnaround is under 24 hours.
          </p>
        </div>
      </div>

      {/* Contact strip */}
      <section className="bg-[#1c1c1c] text-white py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
              Press contact
            </p>
            <a
              href={`mailto:${pressContactEmail}`}
              className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-white tracking-tight inline-flex items-center gap-2 hover:text-[#00a942] transition-colors"
            >
              <Mail className="h-4 w-4" />
              {pressContactEmail}
            </a>
            <p className="font-['Geist',sans-serif] text-sm text-white/60 mt-2 leading-relaxed">
              For report PDFs, embargoed access, analyst interviews and data licensing.
            </p>
          </div>
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
              Embargo access
            </p>
            <a
              href={embargoRequestMailto}
              className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-white tracking-tight inline-flex items-center gap-2 hover:text-[#00a942] transition-colors"
            >
              Request embargo copy
            </a>
            <p className="font-['Geist',sans-serif] text-sm text-white/60 mt-2 leading-relaxed">
              Verified journalists get 72-hour pre-release access to upcoming reports.
            </p>
          </div>
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
              Data request
            </p>
            <a
              href={dataRequestMailto}
              className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-white tracking-tight inline-flex items-center gap-2 hover:text-[#00a942] transition-colors"
            >
              Request raw data
            </a>
            <p className="font-['Geist',sans-serif] text-sm text-white/60 mt-2 leading-relaxed">
              Raw CSV, chart SVGs and provider-level data available under the Zavis Data Use Agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Published reports */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="border-b-2 border-[#1c1c1c] mb-6" />
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl text-[#1c1c1c] tracking-tight mb-6">
          Published reports
        </h2>
        {published.length === 0 ? (
          <p className="font-['Geist',sans-serif] text-sm text-black/50">
            First tentpole report releasing soon. Contact{" "}
            <a href={`mailto:${pressContactEmail}`} className="text-[#006828] hover:underline">
              {pressContactEmail}
            </a>{" "}
            for the full 2026 editorial calendar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {published.map((r) => (
              <Link
                key={r.id}
                href={`/intelligence/reports/${r.slug}`}
                className="group block border border-black/[0.06] rounded-xl p-5 hover:border-[#006828]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded bg-[#006828]/[0.08] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#006828]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-1">
                      Published {formatDate(r.releaseDate)}
                    </p>
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-base text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors">
                      {r.title}
                    </h3>
                    <p className="font-['Geist',sans-serif] text-xs text-black/50 mt-2 leading-relaxed line-clamp-2">
                      {r.headlineStat}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming / embargo list */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="border-b-2 border-[#1c1c1c] mb-6" />
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl text-[#1c1c1c] tracking-tight mb-2">
          Upcoming under embargo
        </h2>
        <p className="font-['Geist',sans-serif] text-sm text-black/50 mb-6 max-w-2xl">
          Verified journalists get advance embargoed PDFs + chart packs. Reports listed below are in the editorial pipeline — final titles and release dates may shift.
        </p>
        {upcoming.length === 0 ? (
          <p className="font-['Geist',sans-serif] text-sm text-black/50">
            No active embargoes right now — check back next quarter.
          </p>
        ) : (
          <ul className="border-t border-black/[0.08]">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="border-b border-black/[0.08] py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-base text-[#1c1c1c] tracking-tight">
                    {r.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-sm text-black/50 mt-1 leading-snug line-clamp-2">
                    {r.headlineStat}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:items-end gap-1">
                  <span className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828]">
                    Release {formatDate(r.releaseDate)}
                  </span>
                  {r.embargoDate && (
                    <span className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40">
                      Embargo until {formatDate(r.embargoDate)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Editorial standards */}
      <section className="bg-[#f8f8f6] py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
              Editorial standards
            </p>
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl text-[#1c1c1c] tracking-tight">
              How Zavis Intelligence Reports are produced.
            </h2>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              Every report goes through a four-stage workflow: analyst brief → data pull from the Zavis corpus + regulator registers → draft + chart pack review → methodological audit. Findings are traceable back to specific providers, specialties and emirates, and every report publishes its full methodology, sample size and analyst list.
            </p>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              Zavis does not pay for or bundle reports with advertising placements. Reports are never commissioned by or reviewed in advance by covered providers, insurers or regulators. Corrections are published openly on the report page and timestamped.
            </p>
            <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
              For methodology questions or to audit a specific finding, email{" "}
              <a href={`mailto:${pressContactEmail}`} className="text-[#006828] hover:underline">
                {pressContactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
