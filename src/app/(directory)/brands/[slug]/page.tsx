import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles, Pill, Building2, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getBrandBySlug,
  getMedicationBySlug,
  getBrandsByGeneric,
  getAllBrandSlugs,
} from "@/lib/medications";
import { gateBrandPage } from "@/lib/medication-gating";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const slugs = await safe(getAllBrandSlugs(), [] as string[], "brand:generateStaticParams");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await safe(
    getBrandBySlug(params.slug),
    null as Awaited<ReturnType<typeof getBrandBySlug>> | null,
    `brand:metadata:${params.slug}`,
  );
  if (!brand) return {};

  const base = getBaseUrl();
  const gate = gateBrandPage(brand, base);

  return {
    title: `${brand.brandName} — ${brand.manufacturer || "Brand"} | UAE Medication Guide`,
    description:
      brand.shortDescription ||
      `${brand.brandName} brand information, generic equivalent, and UAE pharmacy availability.`,
    ...(!gate.index ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: gate.canonicalOverride || `${base}/brands/${brand.slug}`,
    },
    openGraph: {
      title: `${brand.brandName} — UAE Medication Guide`,
      description:
        brand.shortDescription || `${brand.brandName} medication brand information.`,
      type: "website",
      url: `${base}/brands/${brand.slug}`,
    },
  };
}

export default async function BrandPage({ params }: Props) {
  const brand = await safe(
    getBrandBySlug(params.slug),
    null as Awaited<ReturnType<typeof getBrandBySlug>> | null,
    `brand:page:${params.slug}`,
  );
  if (!brand) notFound();

  const base = getBaseUrl();
  const [generic, siblingBrands] = await Promise.all([
    safe(
      getMedicationBySlug(brand.genericSlug),
      null as Awaited<ReturnType<typeof getMedicationBySlug>> | null,
      `brand:generic:${brand.genericSlug}`,
    ),
    safe(
      getBrandsByGeneric(brand.genericSlug),
      [] as Awaited<ReturnType<typeof getBrandsByGeneric>>,
      `brand:siblings:${brand.genericSlug}`,
    ),
  ]);

  const siblings = siblingBrands.filter((b) => b.slug !== brand.slug);

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "UAE", href: "/" },
    { label: "Medications", href: "/medications" },
    ...(generic
      ? [{ label: generic.genericName, href: `/medications/${generic.slug}` }]
      : []),
    { label: brand.brandName },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medications", url: `${base}/medications` },
          ...(generic
            ? [{ name: generic.genericName, url: `${base}/medications/${generic.slug}` }]
            : []),
          { name: brand.brandName },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Drug",
          name: brand.brandName,
          description: brand.shortDescription || undefined,
          isProprietary: true,
          nonProprietaryName: generic?.genericName || brand.genericSlug,
          manufacturer: brand.manufacturer
            ? { "@type": "Organization", name: brand.manufacturer }
            : undefined,
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
          <div className="absolute -top-20 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,120,0.22),transparent_70%)]" />
        </div>

        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {b.href && !isLast ? (
                    <Link href={b.href} className="hover:text-ink transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-ink font-medium" : undefined}>
                      {b.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              );
            })}
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            UAE brand-name medication
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] flex items-center gap-3">
            <Pill className="h-9 w-9 text-accent-dark shrink-0" />
            {brand.brandName}
          </h1>
          {brand.manufacturer && (
            <p className="font-sans text-z-body text-ink-soft mt-3 inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {brand.manufacturer}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-z-pill bg-accent-muted px-3 py-1 font-sans text-z-caption font-medium text-accent-dark">
              <ShieldCheck className="h-3.5 w-3.5" /> Brand name
            </span>
            {generic && (
              <Link
                href={`/medications/${generic.slug}`}
                className="inline-flex items-center gap-1 rounded-z-pill border border-ink-hairline px-3 py-1 font-sans text-z-caption font-medium text-ink hover:border-ink transition-colors"
              >
                Generic: {generic.genericName}
              </Link>
            )}
          </div>

          <div
            className="mt-6 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              {brand.shortDescription ||
                `${brand.brandName} is a brand-name medication available in UAE pharmacies.`}
              {generic && ` The generic equivalent is ${generic.genericName}.`}
              {brand.manufacturer && ` Manufactured by ${brand.manufacturer}.`}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Generic Equivalent */}
            {generic && (
              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Generic alternative
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    Generic equivalent.
                  </h2>
                </header>
                <Link
                  href={`/medications/${generic.slug}`}
                  className="group flex items-center justify-between rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                >
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                      {generic.genericName}
                    </p>
                    {generic.shortDescription && (
                      <p className="font-sans text-z-caption text-ink-muted mt-0.5 line-clamp-2">
                        {generic.shortDescription}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-ink-muted group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
                <p className="font-sans text-z-caption text-ink-muted mt-3">
                  Ask your pharmacist about generic alternatives — they contain
                  the same active ingredient at a lower cost.
                </p>
              </section>
            )}

            {/* Common Uses from Generic */}
            {generic && generic.commonConditions.length > 0 && (
              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    What it treats
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    Common uses.
                  </h2>
                </header>
                <ul className="flex flex-wrap gap-2">
                  {generic.commonConditions.map((condition) => (
                    <li key={condition}>
                      <span className="inline-flex items-center rounded-z-pill bg-white border border-ink-hairline px-3.5 py-1.5 font-sans text-z-body-sm text-ink">
                        {condition
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Other Brands of Same Generic */}
            {siblings.length > 0 && (
              <section>
                <header className="mb-6">
                  <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                    Same active ingredient
                  </p>
                  <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                    Other brands of {generic?.genericName || "this medication"}.
                  </h2>
                </header>
                <ul className="space-y-2">
                  {siblings.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/brands/${s.slug}`}
                        className="group flex items-center justify-between rounded-z-md bg-white border border-ink-line p-4 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                      >
                        <span className="font-sans text-z-body text-ink group-hover:underline decoration-1 underline-offset-2">
                          {s.brandName}
                          {s.manufacturer ? (
                            <span className="text-ink-muted"> · {s.manufacturer}</span>
                          ) : null}
                        </span>
                        <ArrowRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-z-md bg-white border border-ink-line p-6">
              <h3 className="font-display font-semibold text-ink text-z-h3 mb-4">
                Quick facts
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em]">
                    Brand name
                  </dt>
                  <dd className="font-sans text-z-body-sm text-ink mt-0.5">
                    {brand.brandName}
                  </dd>
                </div>
                {generic && (
                  <div>
                    <dt className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em]">
                      Generic name
                    </dt>
                    <dd className="font-sans text-z-body-sm text-ink mt-0.5">
                      {generic.genericName}
                    </dd>
                  </div>
                )}
                {brand.manufacturer && (
                  <div>
                    <dt className="font-sans text-z-micro text-ink-muted uppercase tracking-[0.04em]">
                      Manufacturer
                    </dt>
                    <dd className="font-sans text-z-body-sm text-ink mt-0.5">
                      {brand.manufacturer}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="rounded-z-md bg-surface-cream border border-ink-line p-6">
              <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">
                Find {brand.brandName}
              </h3>
              <p className="font-sans text-z-caption text-ink-muted mb-4 leading-relaxed">
                Ask your local pharmacy about {brand.brandName} availability.
              </p>
              <Link
                href="/pharmacy"
                className="inline-flex items-center gap-2 rounded-z-pill bg-ink px-4 py-2 font-sans text-z-body-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Building2 className="h-4 w-4" /> Browse pharmacies
              </Link>
            </section>
          </aside>
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> This page
            provides general information about {brand.brandName}. It is not
            medical advice. Consult a licensed healthcare provider for
            prescribing guidance. Data from publicly available pharmaceutical
            references.
          </p>
        </div>
      </div>
    </>
  );
}
