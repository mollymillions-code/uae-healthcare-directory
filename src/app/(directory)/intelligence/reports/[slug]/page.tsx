import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { getReportBySlug, getRelatedReports } from "@/lib/reports/data";
import { reportSchema, type ReportRow, type ReportAuthorRef } from "@/lib/seo-reports";
import { getBaseUrl } from "@/lib/helpers";
import { ArrowLeft, Download, LinkIcon, FileText } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

const AUTHOR_JOB_TITLES: Record<string, string> = {
  "zavis-intelligence-team": "Zavis Intelligence Team",
  "zavis-data-science": "Zavis Data Science",
};

function normalizeAuthors(authors: ReportAuthorRef[]): ReportAuthorRef[] {
  if (!authors || authors.length === 0) {
    return [
      {
        slug: "zavis-intelligence-team",
        name: "Zavis Intelligence Team",
        role: "author",
        jobTitle: AUTHOR_JOB_TITLES["zavis-intelligence-team"],
      },
    ];
  }
  return authors.map((a) => ({
    ...a,
    jobTitle: a.jobTitle || AUTHOR_JOB_TITLES[a.slug],
  }));
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const report = await getReportBySlug(params.slug);
  if (!report) return {};
  const base = getBaseUrl();
  const metaDescription =
    report.headlineStat.length > 155
      ? `${report.headlineStat.slice(0, 152).replace(/\s+\S*$/, "")}...`
      : report.headlineStat;
  return {
    title: report.title,
    description: metaDescription,
    openGraph: {
      type: "article",
      title: report.title,
      description: metaDescription,
      publishedTime: report.releaseDate,
      modifiedTime: report.updatedAt || report.releaseDate,
      url: `${base}/intelligence/reports/${report.slug}`,
      images: report.coverImageUrl
        ? [{ url: report.coverImageUrl, width: 1200, height: 630, alt: report.title }]
        : [{ url: `${base}/images/og-default.png`, width: 1200, height: 630, alt: report.title }],
    },
    alternates: {
      canonical: `${base}/intelligence/reports/${report.slug}`,
      languages: {
        en: `${base}/intelligence/reports/${report.slug}`,
        ar: `${base}/ar/intelligence/reports/${report.slug}`,
      },
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const report = await getReportBySlug(params.slug);
  if (!report) notFound();

  const baseUrl = getBaseUrl();
  const authors = normalizeAuthors(report.authors);
  const related = await getRelatedReports(report.slug, 3);

  const schemaRow: ReportRow = {
    slug: report.slug,
    title: report.title,
    titleAr: report.titleAr,
    subtitle: report.subtitle,
    subtitleAr: report.subtitleAr,
    headlineStat: report.headlineStat,
    headlineStatAr: report.headlineStatAr,
    coverImageUrl: report.coverImageUrl,
    pdfUrl: report.pdfUrl,
    releaseDate: report.releaseDate,
    methodology: report.methodology,
    methodologyAr: report.methodologyAr,
    dataSource: report.dataSource,
    sampleSize: report.sampleSize,
    pressReleaseUrl: report.pressReleaseUrl,
    authors,
    updatedAt: report.updatedAt,
    createdAt: report.createdAt,
  };
  const schemaNodes = reportSchema(schemaRow, baseUrl);

  // Methodology FAQs — mirrors the ones embedded in the JSON-LD so the
  // visible page content matches the structured data exactly. (Google's
  // FAQ rich-result policy requires the rendered answer text to match
  // the schema text.)
  const faqs = [
    {
      question: `What methodology did Zavis use for "${report.title}"?`,
      answer: report.methodology,
    },
    {
      question: `What data sources back "${report.title}"?`,
      answer: report.dataSource,
    },
    ...(report.sampleSize
      ? [
          {
            question: `What is the sample size for "${report.title}"?`,
            answer: `${report.sampleSize}. Zavis Intelligence Reports publish sample size disclosures alongside every release for full methodological transparency.`,
          },
        ]
      : []),
    {
      question: `Is "${report.title}" free to download?`,
      answer:
        "Yes. Zavis Intelligence Reports are published open-access without a paywall, email gate, or registration. Journalists, researchers and healthcare operators can download the full PDF directly from the report page.",
    },
    {
      question: `How can journalists cite "${report.title}"?`,
      answer: `Cite as: Zavis Intelligence Reports, "${report.title}", published ${formatReleaseDate(report.releaseDate)}. Press queries go to press@zavis.ai — the Zavis press team provides interview access, embedded analysts and embargo copies.`,
    },
  ];

  const shareUrl = `${baseUrl}/intelligence/reports/${report.slug}`;
  const shareText = `${report.title} — ${report.headlineStat}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <>
      {schemaNodes.map((node, i) => (
        <JsonLd key={`report-schema-${i}`} data={node} />
      ))}

      {/* Back link */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/intelligence/reports"
          className="inline-flex items-center gap-1.5 font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-black/40 hover:text-[#006828] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          All reports
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="border-b-2 border-[#1c1c1c]" />
        <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mt-8 mb-3">
          Zavis Intelligence Report · {formatReleaseDate(report.releaseDate)}
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.05] text-[#1c1c1c] tracking-[-0.035em] max-w-4xl">
          {report.title}
        </h1>
        {report.subtitle && (
          <p className="font-['Geist',sans-serif] text-lg text-black/55 mt-5 max-w-3xl leading-relaxed">
            {report.subtitle}
          </p>
        )}

        {/* Headline stat block */}
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.05] rounded-r-xl px-6 py-5 mt-8 max-w-3xl">
          <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
            Headline finding
          </p>
          <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl sm:text-2xl text-[#1c1c1c] tracking-tight leading-snug">
            {report.headlineStat}
          </p>
        </div>

        {/* Author + metadata strip */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 pt-5 border-t border-black/[0.08]">
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40">
              By
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {authors.map((a) => (
                <Link
                  key={a.slug}
                  href={`/intelligence/author/${a.slug}`}
                  className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c] hover:text-[#006828] transition-colors"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
          {report.sampleSize && (
            <div>
              <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40">
                Sample
              </p>
              <p className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
                {report.sampleSize}
              </p>
            </div>
          )}
          <div>
            <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40">
              Read time
            </p>
            <p className="font-['Geist',sans-serif] text-sm font-semibold text-[#1c1c1c]">
              {report.readTimeMinutes} minutes
            </p>
          </div>
        </div>

        {/* PDF + share bar */}
        <div className="flex flex-wrap gap-3 mt-8">
          {report.pdfUrl ? (
            <a
              href={report.pdfUrl}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#006828] text-white font-['Geist',sans-serif] text-sm font-semibold rounded-full hover:bg-[#004d1c] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              data-analytics="report_pdf_download"
              data-report-slug={report.slug}
            >
              <Download className="h-4 w-4" />
              Download full PDF
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-3 bg-[#f8f8f6] text-black/40 font-['Geist',sans-serif] text-sm font-semibold rounded-full">
              <FileText className="h-4 w-4" />
              PDF releasing {formatReleaseDate(report.releaseDate)}
            </span>
          )}
          <a
            href={linkedInShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 border border-black/[0.1] text-[#1c1c1c] font-['Geist',sans-serif] text-sm font-medium rounded-full hover:border-[#006828] hover:text-[#006828] transition-colors"
          >
            Share on LinkedIn
          </a>
          <a
            href={twitterShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 border border-black/[0.1] text-[#1c1c1c] font-['Geist',sans-serif] text-sm font-medium rounded-full hover:border-[#006828] hover:text-[#006828] transition-colors"
          >
            Share on X
          </a>
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 border border-black/[0.1] text-[#1c1c1c] font-['Geist',sans-serif] text-sm font-medium rounded-full hover:border-[#006828] hover:text-[#006828] transition-colors"
          >
            Share on WhatsApp
          </a>
          <Link
            href={`/intelligence/reports/${report.slug}`}
            className="inline-flex items-center gap-2 px-4 py-3 border border-black/[0.1] text-[#1c1c1c] font-['Geist',sans-serif] text-sm font-medium rounded-full hover:border-[#006828] hover:text-[#006828] transition-colors"
          >
            <LinkIcon className="h-4 w-4" />
            Copy link
          </Link>
        </div>
      </section>

      {/* Hero image */}
      {report.coverImageUrl && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="relative w-full aspect-[16/8] overflow-hidden rounded-2xl bg-[#f8f8f6]">
            <Image
              src={report.coverImageUrl}
              alt={report.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          </div>
        </div>
      )}

      {/* Body + TOC */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* TOC */}
          <aside className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <div className="border-b-2 border-[#1c1c1c] mb-4" />
              <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                Table of contents
              </p>
              <ol className="space-y-2">
                {report.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.anchor}`}
                      className="block font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors leading-snug"
                    >
                      <span className="text-black/30 font-mono text-[11px] mr-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>

              {/* Chart reservation placeholder */}
              {report.chartData.length > 0 && (
                <div className="mt-8">
                  <div className="border-b-2 border-[#1c1c1c] mb-4" />
                  <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                    Charts in this report
                  </p>
                  <ul className="space-y-2">
                    {report.chartData.map((c) => (
                      <li
                        key={c.id}
                        className="font-['Geist',sans-serif] text-sm text-black/60 leading-snug"
                      >
                        {c.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          {/* Body */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {/* Section nav */}
            {report.sections.length > 0 && (
              <div className="border-l-2 border-[#006828] pl-5 mb-10">
                <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
                  What this report covers
                </p>
                <ul className="space-y-1">
                  {report.sections.map((s) => (
                    <li
                      key={s.id}
                      className="font-['Geist',sans-serif] text-sm text-black/60 leading-snug"
                    >
                      {s.title}
                      {s.summary ? (
                        <span className="text-black/40"> — {s.summary}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chart placeholders inline */}
            {report.chartData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {report.chartData.map((c) => (
                  <div
                    key={c.id}
                    className="border border-dashed border-black/[0.15] rounded-xl p-6 bg-[#f8f8f6]"
                  >
                    <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-semibold text-[#006828] mb-2">
                      Chart · {c.type}
                    </p>
                    <p className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight">
                      {c.title}
                    </p>
                    {c.caption && (
                      <p className="font-['Geist',sans-serif] text-xs text-black/50 mt-1">
                        {c.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Body markdown */}
            <div className="prose prose-lg max-w-none font-['Geist',sans-serif] text-[15px] text-black/70 leading-relaxed">
              {report.bodyMd.split(/\n\n+/).map((block, i) => {
                const trimmed = block.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("# ")) {
                  return null;
                }
                if (trimmed.startsWith("## ")) {
                  const match = /^## (?:\d+\.\s*)?(.+)/.exec(trimmed);
                  const label = match?.[1] || trimmed.replace(/^## /, "");
                  const anchor = label
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h2
                      key={`h2-${i}`}
                      id={anchor}
                      className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl text-[#1c1c1c] tracking-tight mt-10 mb-4 scroll-mt-24"
                    >
                      {label}
                    </h2>
                  );
                }
                if (trimmed.startsWith("> ")) {
                  return (
                    <blockquote
                      key={`bq-${i}`}
                      className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-r px-5 py-3 my-5 font-['Geist',sans-serif] text-[15px] text-[#1c1c1c]"
                    >
                      {trimmed.replace(/^> /, "")}
                    </blockquote>
                  );
                }
                if (trimmed.startsWith("- ")) {
                  const items = trimmed.split(/\n/).map((l) => l.replace(/^- /, ""));
                  return (
                    <ul
                      key={`ul-${i}`}
                      className="list-disc pl-5 space-y-1 my-5 text-black/70"
                    >
                      {items.map((li, j) => (
                        <li key={j}>{li}</li>
                      ))}
                    </ul>
                  );
                }
                if (trimmed === "---") {
                  return <hr key={`hr-${i}`} className="my-10 border-black/[0.08]" />;
                }
                return (
                  <p key={`p-${i}`} className="my-4">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Methodology disclosure */}
            <div className="border-t-2 border-[#1c1c1c] mt-12 pt-8">
              <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                Methodology disclosure
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-1">
                    Methodology
                  </dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                    {report.methodology}
                  </dd>
                </div>
                <div>
                  <dt className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-1">
                    Data source
                  </dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                    {report.dataSource}
                  </dd>
                </div>
                {report.sampleSize && (
                  <div>
                    <dt className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-1">
                      Sample size
                    </dt>
                    <dd className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                      {report.sampleSize}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-1">
                    Last revised
                  </dt>
                  <dd className="font-['Geist',sans-serif] text-sm text-black/70 leading-relaxed">
                    {formatReleaseDate(report.updatedAt || report.releaseDate)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Authors block */}
            <div className="border-t border-black/[0.08] mt-10 pt-8">
              <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] mb-4">
                Authors & contributors
              </p>
              <div className="space-y-3">
                {authors.map((a) => (
                  <div
                    key={a.slug}
                    className="flex items-start gap-4 border border-black/[0.06] rounded-xl p-4"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#006828] flex items-center justify-center text-white font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm">
                      {a.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/intelligence/author/${a.slug}`}
                        className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-sm text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                      >
                        {a.name}
                      </Link>
                      <p className="font-['Geist',sans-serif] text-xs text-black/40 uppercase tracking-widest">
                        {a.role || "author"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <FaqSection faqs={faqs} title="Methodology FAQ" />

            {/* Related reports */}
            {related.length > 0 && (
              <div className="mt-12">
                <div className="border-b-2 border-[#1c1c1c]" />
                <h2 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-xl text-[#1c1c1c] tracking-tight pt-4 mb-6">
                  More reports like this
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/intelligence/reports/${r.slug}`}
                      className="group block border border-black/[0.06] rounded-xl p-5 hover:border-[#006828]/40 transition-colors"
                    >
                      <p className="font-['Geist',sans-serif] uppercase text-[10px] tracking-widest font-medium text-black/40 mb-2">
                        {formatReleaseDate(r.releaseDate)}
                      </p>
                      <h3 className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-base text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors mb-2">
                        {r.title}
                      </h3>
                      <p className="font-['Geist',sans-serif] text-xs text-black/50 leading-relaxed line-clamp-2">
                        {r.headlineStat}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related intelligence articles — static link-out for now. Item 4
                will replace this with a live topic-matched query. */}
            <div className="mt-10">
              <div className="border-b border-black/[0.08]" />
              <p className="font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold text-[#006828] pt-4 mb-3">
                Related coverage
              </p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/intelligence"
                    className="font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors"
                  >
                    UAE healthcare news & analysis on Zavis Intelligence &rarr;
                  </Link>
                </li>
                <li>
                  <Link
                    href="/intelligence/press"
                    className="font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors"
                  >
                    Press kit, embargo list and analyst access &rarr;
                  </Link>
                </li>
                <li>
                  <Link
                    href="/directory"
                    className="font-['Geist',sans-serif] text-sm text-black/60 hover:text-[#006828] transition-colors"
                  >
                    Find a UAE healthcare provider in the Zavis directory &rarr;
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
