import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, DollarSign, MapPin, Shield, Clock, ChevronRight, Star } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getGuideBySlug,
  getAllGuideSlugs,
  formatAed,
  type GuideDefinition,
} from "@/lib/guides/data";
import { getProviders } from "@/lib/data";
import type { LocalProvider } from "@/lib/data";
import { breadcrumbSchema, faqPageSchema, medicalWebPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200; // 12 hours

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return {};

  const base = getBaseUrl();

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: {
      canonical: `${base}/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.h1,
      description: guide.metaDescription,
      url: `${base}/guides/${guide.slug}`,
      type: "article",
      locale: "en_AE",
      siteName: "Zavis",
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function rankProviders(providers: LocalProvider[]): LocalProvider[] {
  return [...providers]
    .filter((p) => Number(p.googleRating) > 0 && (p.googleReviewCount || 0) >= 5)
    .sort((a, b) => {
      const rDiff = Number(b.googleRating) - Number(a.googleRating);
      if (rDiff !== 0) return rDiff;
      return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
    });
}

function guideArticleSchema(guide: GuideDefinition) {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.metaDescription,
    datePublished: guide.lastReviewed,
    dateModified: guide.lastReviewed,
    author: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
      logo: { "@type": "ImageObject", url: `${base}/favicon.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${base}/guides/${guide.slug}`,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function GuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const base = getBaseUrl();

  // Fetch related providers from DB for comparison and cost-guide templates
  let topProviders: LocalProvider[] = [];
  if (guide.relatedCategories.length > 0) {
    const citySlug = guide.relatedCities[0] || undefined;
    const categorySlug = guide.relatedCategories[0];
    const { providers } = await getProviders({
      citySlug,
      categorySlug,
      limit: 200,
    });
    topProviders = rankProviders(providers).slice(0, 10);
  }

  // Build table of contents from sections + fixed sections
  const tocItems: { id: string; label: string }[] = [];
  if (guide.priceRanges.length > 0) {
    tocItems.push({ id: "pricing", label: "Pricing" });
  }
  for (const section of guide.sections) {
    tocItems.push({
      id: slugifyId(section.heading),
      label: section.heading,
    });
  }
  if (topProviders.length > 0) {
    tocItems.push({ id: "top-providers", label: "Top Providers" });
  }
  tocItems.push({ id: "directory-links", label: "Related Directory Pages" });
  if (guide.faqs.length > 0) {
    tocItems.push({ id: "faq", label: "FAQ" });
  }

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={guideArticleSchema(guide)} />
      {guide.faqs.length > 0 && <JsonLd data={faqPageSchema(guide.faqs)} />}
      <JsonLd data={medicalWebPageSchema(guide.h1, guide.metaDescription, guide.lastReviewed)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Guides", url: `${base}/guides` },
          { name: guide.h1 },
        ])}
      />

      <div className="container-tc pt-8 pb-16">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Guides", href: "/guides" },
            { label: guide.h1 },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Template type badge */}
            <div className="mb-4">
              <span className="inline-block px-2.5 py-1 text-xs font-mono bg-canvas-200 text-muted uppercase tracking-wider">
                {guide.templateType === "cost-guide" && "Price Guide"}
                {guide.templateType === "comparison" && "Comparison Guide"}
                {guide.templateType === "system-guide" && "Healthcare Guide"}
              </span>
            </div>

            {/* H1 */}
            <h1 className="headline-serif-xl mb-5">{guide.h1}</h1>

            {/* Last reviewed */}
            <div className="flex items-center gap-3 text-xs text-muted mb-6">
              <Clock className="h-3.5 w-3.5" />
              <span>Last reviewed: {new Date(guide.lastReviewed).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="text-light-300">|</span>
              <span>By Zavis Research</span>
            </div>

            {/* Hero text */}
            <div className="border-l-4 border-[#006828] pl-4 mb-8">
              <p className="font-serif text-lg text-dark leading-relaxed">
                {guide.heroText}
              </p>
            </div>

            {/* ═══ PRICE TABLE (cost-guide only) ═══ */}
            {guide.priceRanges.length > 0 && (
              <section id="pricing" className="mb-10">
                <div className="border-b-2 border-dark mb-4" />
                <h2 className="font-sans text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#006828]" />
                  Pricing
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-canvas-200">
                        <th className="text-left px-3 py-2.5 font-bold text-dark">Procedure / Item</th>
                        <th className="text-left px-3 py-2.5 font-bold text-dark">Range</th>
                        <th className="text-left px-3 py-2.5 font-bold text-dark">Typical</th>
                        <th className="text-left px-3 py-2.5 font-bold text-dark hidden md:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guide.priceRanges.map((row, i) => (
                        <tr key={i} className="border-b border-light-200">
                          <td className="px-3 py-3 font-medium text-dark">{row.label}</td>
                          <td className="px-3 py-3 text-muted whitespace-nowrap">
                            {formatAed(row.min)}–{formatAed(row.max)}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#006828] whitespace-nowrap">
                            {formatAed(row.typical)}
                          </td>
                          <td className="px-3 py-3 text-muted text-xs hidden md:table-cell">
                            {row.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted mt-2 italic">
                  Prices are indicative ranges based on market data. Individual provider quotes may differ.
                  All prices in AED. Last updated {new Date(guide.lastReviewed).toLocaleDateString("en-AE", { year: "numeric", month: "long" })}.
                </p>
              </section>
            )}

            {/* ═══ CONTENT SECTIONS ═══ */}
            {guide.sections.map((section) => (
              <section key={section.heading} id={slugifyId(section.heading)} className="mb-10">
                <div className="border-b-2 border-dark mb-4" />
                <h2 className="font-sans text-xl font-bold text-dark mb-4">
                  {section.heading}
                </h2>
                <div className="prose prose-sm max-w-none">
                  {section.content.split("\n\n").map((para, i) => (
                    <p key={i} className="text-muted leading-relaxed mb-4">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* ═══ TOP PROVIDERS (from DB) ═══ */}
            {topProviders.length > 0 && (
              <section id="top-providers" className="mb-10">
                <div className="border-b-2 border-dark mb-4" />
                <h2 className="font-sans text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#006828]" />
                  {guide.templateType === "comparison"
                    ? `Top-Rated ${guide.relatedCategories[0] ? getCategoryLabel(guide.relatedCategories[0]) : "Providers"}`
                    : "Related Providers from the Directory"}
                </h2>
                <div className="space-y-0">
                  {topProviders.map((provider, i) => (
                    <div key={provider.slug}>
                      {i > 0 && <div className="border-b border-light-200 my-3" />}
                      <div className="flex items-start gap-3 py-2">
                        <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#006828] text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                            className="text-sm font-bold text-dark hover:text-[#006828] transition-colors"
                          >
                            {provider.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-1">
                            {Number(provider.googleRating) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {Number(provider.googleRating).toFixed(1)}
                                {provider.googleReviewCount && (
                                  <span className="text-light-300">({provider.googleReviewCount.toLocaleString()} reviews)</span>
                                )}
                              </span>
                            )}
                            {provider.areaSlug && (
                              <span className="text-xs text-muted">
                                {provider.address.split(",")[0]}
                              </span>
                            )}
                          </div>
                          {provider.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {provider.services.slice(0, 4).map((s) => (
                                <span key={s} className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-canvas-200 text-muted">
                                  {s}
                                </span>
                              ))}
                              {provider.services.length > 4 && (
                                <span className="text-[10px] text-muted">+{provider.services.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`}
                          className="flex-shrink-0 text-[#006828] hover:text-[#004d1a] transition-colors"
                          aria-label={`View ${provider.name}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {guide.relatedCities[0] && guide.relatedCategories[0] && (
                  <div className="mt-4 pt-4 border-t border-light-200">
                    <Link
                      href={`/directory/${guide.relatedCities[0]}/${guide.relatedCategories[0]}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#006828] hover:text-[#004d1a] transition-colors"
                    >
                      View all providers
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* ═══ DIRECTORY LINKS ═══ */}
            <section id="directory-links" className="mb-10">
              <div className="border-b-2 border-dark mb-4" />
              <h2 className="font-sans text-xl font-bold text-dark mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#006828]" />
                Related Directory Pages
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {guide.directoryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-3 border border-light-200 hover:border-[#006828] transition-colors group"
                  >
                    <span className="text-sm text-dark group-hover:text-[#006828] transition-colors">
                      {link.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted group-hover:text-[#006828] transition-colors" />
                  </Link>
                ))}
              </div>
            </section>

            {/* ═══ AEO ANSWER BLOCK ═══ */}
            <section className="mb-10">
              <div className="answer-block bg-light-50 border border-light-200 p-5" data-answer-block="true">
                <p className="text-sm text-muted leading-relaxed">
                  {guide.heroText} This guide is published by Zavis ({base}) and covers healthcare services in the United Arab Emirates.
                  Data is sourced from market research, official health authority pricing frameworks, and the UAE Open Healthcare Directory
                  database of {guide.relatedCategories.length > 0 ? "licensed healthcare providers" : "healthcare information"}.
                  Last reviewed {guide.lastReviewed}. For the most current pricing, contact providers directly.
                </p>
              </div>
            </section>

            {/* ═══ FAQ ═══ */}
            {guide.faqs.length > 0 && (
              <div id="faq">
                <FaqSection
                  title="Frequently Asked Questions"
                  faqs={guide.faqs}
                />
              </div>
            )}
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <aside className="space-y-8">
            {/* Table of Contents */}
            <div>
              <div className="border-b-2 border-dark mb-4" />
              <h3 className="label text-[#006828] mb-4">In this guide</h3>
              <nav>
                <ul className="space-y-0">
                  {tocItems.map((item, i) => (
                    <li key={item.id}>
                      {i > 0 && <div className="border-b border-light-200" />}
                      <a
                        href={`#${item.id}`}
                        className="block py-2 text-sm text-muted hover:text-[#006828] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Quick Price Summary (cost-guide only) */}
            {guide.priceRanges.length > 0 && (
              <div>
                <div className="border-b-2 border-dark mb-4" />
                <h3 className="label text-[#006828] mb-4">Price Summary</h3>
                <div className="space-y-3">
                  {guide.priceRanges.slice(0, 4).map((row) => (
                    <div key={row.label} className="border border-light-200 p-3">
                      <p className="text-xs text-muted mb-1">{row.label}</p>
                      <p className="text-sm font-bold text-[#006828]">{formatAed(row.typical)}</p>
                      <p className="text-[10px] text-muted">{formatAed(row.min)}–{formatAed(row.max)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browse Guides CTA */}
            <div className="border border-light-200 p-4">
              <h3 className="text-sm font-bold text-dark mb-3">More Guides</h3>
              <div className="space-y-2">
                <Link href="/guides" className="block text-sm text-muted hover:text-[#006828] transition-colors">
                  All Healthcare Guides
                </Link>
                <Link href="/intelligence" className="block text-sm text-muted hover:text-[#006828] transition-colors">
                  Healthcare Industry Insights
                </Link>
                <Link href="/directory/dubai" className="block text-sm text-muted hover:text-[#006828] transition-colors">
                  Dubai Healthcare Directory
                </Link>
              </div>
            </div>

            {/* Cross-link to directory */}
            <div className="border border-light-200 p-4">
              <h3 className="text-sm font-bold text-dark mb-3">Browse the Directory</h3>
              <div className="space-y-2">
                <Link href="/directory/dubai" className="block text-sm text-muted hover:text-[#006828] transition-colors">Dubai Healthcare Providers</Link>
                <Link href="/directory/abu-dhabi" className="block text-sm text-muted hover:text-[#006828] transition-colors">Abu Dhabi Healthcare Providers</Link>
                <Link href="/directory/sharjah" className="block text-sm text-muted hover:text-[#006828] transition-colors">Sharjah Healthcare Providers</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

// ─── Utilities ──────────────────────────────────────────────────────────────────

function slugifyId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryLabel(slug: string): string {
  const labels: Record<string, string> = {
    hospitals: "Hospitals",
    clinics: "Clinics",
    dental: "Dental Clinics",
    dermatology: "Dermatologists",
    ophthalmology: "Eye Clinics",
    "cosmetic-plastic": "Cosmetic Clinics",
    "fertility-ivf": "Fertility Clinics",
    "mental-health": "Mental Health Providers",
    pediatrics: "Pediatric Clinics",
    orthopedics: "Orthopedic Clinics",
    physiotherapy: "Physiotherapy Clinics",
    "ob-gyn": "OB/GYN Clinics",
  };
  return labels[slug] || "Providers";
}
