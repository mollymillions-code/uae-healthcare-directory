import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedReports } from "@/lib/reports/data";
import { reportsHubSchema } from "@/lib/seo-reports";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

const HUB_TITLE = "Zavis Intelligence Reports";
const HUB_DESCRIPTION =
  "Annual and quarterly data reports on UAE healthcare access, patient experience, insurance networks and provider supply. Published open-access by Zavis.";

export const metadata: Metadata = {
  title: "Zavis Intelligence Reports — UAE Healthcare Data & Research",
  description: HUB_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Zavis Intelligence Reports",
    url: `${getBaseUrl()}/intelligence/reports`,
    title: HUB_TITLE,
    description: HUB_DESCRIPTION,
    images: [
      {
        url: `${getBaseUrl()}/images/og-default.png`,
        width: 1200,
        height: 630,
        alt: HUB_TITLE,
      },
    ],
  },
  alternates: {
    canonical: `${getBaseUrl()}/intelligence/reports`,
    languages: {
      en: `${getBaseUrl()}/intelligence/reports`,
      ar: `${getBaseUrl()}/ar/intelligence/reports`,
    },
  },
};

function formatReleaseDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReportsHubPage() {
  const baseUrl = getBaseUrl();
  const reports = await getPublishedReports();
  const featured = reports.find((r) => r.featured) || reports[0] || null;
  const rest = featured ? reports.filter((r) => r.id !== featured.id) : reports;

  const schemaNodes = reportsHubSchema(
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

  return (
    <>
      {schemaNodes.map((node, i) => (
        <JsonLd key={`report-hub-schema-${i}`} data={node} />
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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="border-b-2 border-[#1c1c1c]" />
        <div className="pt-8">
          <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-3">
            Zavis Intelligence Reports
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] text-[#1c1c1c] tracking-[-0.03em] max-w-3xl">
            What UAE patients actually experience — measured, mapped, published.
          </h1>
          <p className="font-['Geist',sans-serif] text-base text-black/50 mt-5 max-w-2xl leading-relaxed">
            Zavis publishes tentpole data reports on UAE healthcare access, affordability, patient experience and provider supply. Every report is open-access, methodologically disclosed, and built on the Zavis corpus of 12,519 DHA, DOH and MOHAP-licensed facilities plus proprietary analyst review.
          </p>
        </div>
      </div>

      {/* Methodology intro strip */}
      <section className="bg-[#f8f8f6] py-8 mt-2">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-1">
                Data source
              </p>
              <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                DHA, DOH and MOHAP public registers plus Zavis provider analysis of 12,519 UAE facilities.
              </p>
            </div>
            <div>
              <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-1">
                Disclosure
              </p>
              <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                Every report publishes its full methodology, sample size and partner list. No gated downloads.
              </p>
            </div>
            <div>
              <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-1">
                Press
              </p>
              <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
                Journalists get embargoed copies, analyst access and raw data on request via{" "}
                <Link href="/intelligence/press" className="text-[#006828] hover:underline">
                  the Zavis press room
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report grid */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {reports.length === 0 ? (
          <div className="border border-black/[0.06] rounded-2xl p-10 text-center bg-[#f8f8f6]">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight mb-2">
              Reports launching soon.
            </h2>
            <p className="font-['Geist',sans-serif] text-sm text-black/50 max-w-lg mx-auto">
              The first tentpole release is being finalised. Join the Zavis Intelligence mailing list to get the methodology pack and an advance copy on release day.
            </p>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                href={`/intelligence/reports/${featured.slug}`}
                className="group block mb-12"
              >
                <div className="border-b-2 border-[#1c1c1c] mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-[#f8f8f6]">
                    {featured.coverImageUrl ? (
                      <Image
                        src={featured.coverImageUrl}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-['Bricolage_Grotesque',sans-serif] text-6xl font-semibold text-[#006828]/20">
                          Zavis
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-3">
                      Featured Report — {formatReleaseDate(featured.releaseDate)}
                    </p>
                    <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[28px] sm:text-[34px] leading-[1.1] text-[#1c1c1c] tracking-[-0.02em] group-hover:text-[#006828] transition-colors">
                      {featured.title}
                    </h2>
                    {featured.subtitle && (
                      <p className="font-['Geist',sans-serif] text-[15px] text-black/50 mt-4 leading-relaxed">
                        {featured.subtitle}
                      </p>
                    )}
                    <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded px-4 py-3 mt-5">
                      <p className="font-['Geist',sans-serif] text-sm font-medium text-[#1c1c1c] leading-snug">
                        {featured.headlineStat}
                      </p>
                    </div>
                    <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mt-5">
                      {featured.readTimeMinutes} min read
                      {featured.sampleSize ? ` · ${featured.sampleSize}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <>
                <div className="border-b border-black/[0.08] mb-8" />
                <h2 className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-8">
                  More reports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                  {rest.map((r) => (
                    <Link
                      key={r.id}
                      href={`/intelligence/reports/${r.slug}`}
                      className="group block"
                    >
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-[#f8f8f6] mb-4">
                        {r.coverImageUrl ? (
                          <Image
                            src={r.coverImageUrl}
                            alt={r.title}
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#006828]/20">
                              Zavis
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-2">
                        {formatReleaseDate(r.releaseDate)} · {r.readTimeMinutes} min read
                      </p>
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-lg text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
                        {r.title}
                      </h3>
                      <p className="font-['Geist',sans-serif] text-sm text-black/50 leading-relaxed line-clamp-3">
                        {r.headlineStat}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* Editorial methodology note */}
      <section className="bg-[#1c1c1c] text-white py-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div>
              <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-3">
                Editorial methodology
              </p>
              <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl tracking-tight">
                Why Zavis publishes data — and how it holds up.
              </h2>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <p className="font-['Geist',sans-serif] text-sm text-white/70 leading-relaxed">
                Zavis Intelligence Reports are built on the same provider corpus that powers the UAE Open Healthcare Directory — 12,519 DHA, DOH and MOHAP-licensed facilities, verified against the public regulator registers. Every finding is traceable back to a specific provider, specialty and emirate, and every report publishes its full methodology, sample size and the analyst who produced it.
              </p>
              <p className="font-['Geist',sans-serif] text-sm text-white/70 leading-relaxed">
                Reports are never gated, paywalled or email-walled. Journalists, researchers, policy makers and healthcare operators can download the full PDF, embed charts, and request raw data. For embargo access and analyst interviews, see the{" "}
                <Link href="/intelligence/press" className="text-[#006828] hover:text-[#00a942] transition-colors underline">
                  Zavis press room
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
