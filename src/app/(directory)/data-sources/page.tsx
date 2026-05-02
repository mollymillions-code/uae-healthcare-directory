import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  speakableSchema,
  truncateTitle,
  truncateDescription,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

const TITLE = "Data Sources — UAE Open Healthcare Directory";
const DESCRIPTION =
  "Every primary data source feeding the UAE Open Healthcare Directory and Zavis Healthcare Industry Insights — DHA Sheryan, DOH, MOHAP, Dubai Pulse, Abu Dhabi Open Data, OSM, Google Places — with URLs, last-pull dates and licence terms.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: `${getBaseUrl()}/data-sources`,
    languages: {
      en: `${getBaseUrl()}/data-sources`,
      ar: `${getBaseUrl()}/ar/data-sources`,
      "x-default": `${getBaseUrl()}/data-sources`,
    },
  },
  openGraph: {
    title: truncateTitle(TITLE),
    description: truncateDescription(DESCRIPTION),
    type: "website",
    locale: "en_AE",
    siteName: "UAE Open Healthcare Directory",
    url: `${getBaseUrl()}/data-sources`,
  },
};

interface SourceRow {
  name: string;
  authority: string;
  url: string;
  scope: string;
  lastPull: string;
  license: string;
}

const SOURCES: SourceRow[] = [
  {
    name: "DHA Sheryan — Licensed Facilities",
    authority: "Dubai Health Authority",
    url: "https://www.dha.gov.ae/en/sheryan",
    scope:
      "Every licensed healthcare facility in Dubai (hospital, clinic, dental, pharmacy, lab, imaging, allied health).",
    lastPull: "Q1 2026",
    license:
      "Public register; permitted for non-commercial directory use with attribution.",
  },
  {
    name: "DHA Sheryan — Professionals",
    authority: "Dubai Health Authority",
    url: "https://www.dha.gov.ae/en/sheryan",
    scope:
      "Every licensed medical professional practising in Dubai (physicians, dentists, nurses, allied health, pharmacists).",
    lastPull: "Q1 2026",
    license:
      "Public register; permitted for non-commercial directory use with attribution.",
  },
  {
    name: "DOH Tamm — Licensed Healthcare Providers",
    authority: "Department of Health Abu Dhabi",
    url: "https://www.doh.gov.ae/en",
    scope: "Every licensed healthcare facility in the Emirate of Abu Dhabi.",
    lastPull: "Q1 2026",
    license: "Public register; attribution required.",
  },
  {
    name: "MOHAP Licensee Register",
    authority: "Ministry of Health and Prevention",
    url: "https://mohap.gov.ae/en",
    scope:
      "Licensed healthcare facilities in the Northern Emirates (Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah).",
    lastPull: "Q1 2026",
    license: "Public register; attribution required.",
  },
  {
    name: "Dubai Pulse — dm_community-open",
    authority: "Smart Dubai / Dubai Pulse",
    url: "https://www.dubaipulse.gov.ae/data/dm-community/dm_community-open",
    scope:
      "Authoritative neighbourhood and community polygons for Dubai (EN + AR names, GeoJSON).",
    lastPull: "Q1 2026",
    license: "Open data — Creative Commons Attribution.",
  },
  {
    name: "Abu Dhabi Open Data",
    authority: "Abu Dhabi Digital Authority",
    url: "https://data.abudhabi/opendata",
    scope: "Districts, sectors and community taxonomy for Abu Dhabi.",
    lastPull: "Q1 2026",
    license: "Open data licence with attribution.",
  },
  {
    name: "OpenStreetMap",
    authority: "OSM Foundation",
    url: "https://www.openstreetmap.org",
    scope:
      "Fallback neighbourhood and area data for Northern Emirates and any geography not covered by Dubai Pulse / Abu Dhabi Open Data.",
    lastPull: "Q1 2026",
    license:
      "Open Database License (ODbL). Attribution required: \u00a9 OpenStreetMap contributors.",
  },
  {
    name: "Google Places API (New)",
    authority: "Google",
    url: "https://developers.google.com/maps/documentation/places/web-service",
    scope:
      "Optional enrichment for facility profiles — review count, rating average, gallery photos, opening hours, Google Maps URI.",
    lastPull: "Rolling — fetched once per facility, cached on Cloudflare R2.",
    license:
      "Google Maps Platform Terms of Service. Attribution surfaced on facility pages where required.",
  },
  {
    name: "ORCID",
    authority: "ORCID, Inc.",
    url: "https://orcid.org",
    scope:
      "Persistent academic identifier used on Zavis author and reviewer profiles when consented.",
    lastPull: "On profile creation.",
    license: "Public ORCID iD policy. Used for identification and linking only.",
  },
  {
    name: "DOI / Crossref",
    authority: "Crossref",
    url: "https://www.crossref.org",
    scope: "DOI metadata for Intelligence article citations.",
    lastPull: "On article publication.",
    license: "Crossref public REST API.",
  },
];

export default function DataSourcesPage() {
  const base = getBaseUrl();

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${base}/data-sources#webpage`,
    url: `${base}/data-sources`,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${base}#website`,
      url: base,
      name: "UAE Open Healthcare Directory",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${base}#organization`,
      name: "Zavis",
      url: base,
    },
  };

  return (
    <>
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Data Sources", url: `${base}/data-sources` },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-cream">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(0,200,83,0.16),transparent_70%)]" />
        </div>
        <div className="relative max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
          <nav
            className="font-sans text-z-body-sm text-ink-muted flex items-center gap-1.5 mb-5"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-ink transition-colors">
              UAE
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink font-medium">Data Sources</span>
          </nav>

          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3">
            Trust &amp; standards
          </p>
          <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] max-w-3xl">
            Data Sources
          </h1>
          <p className="font-sans text-ink-soft text-z-body sm:text-[17px] mt-4 max-w-2xl leading-relaxed">
            Every primary data source feeding the directory, the professionals
            index, the neighbourhood taxonomy and the Intelligence editorial
            layer. We list each source by name, authority, URL, scope, last
            pull date and licence terms.
          </p>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              We do not buy facility lists from third-party data brokers, and
              we do not generate facilities from unverified web scraping.
              Every provider row on Zavis traces back to one of the
              government registers listed below — DHA Sheryan for Dubai, DOH
              for Abu Dhabi, MOHAP for the Northern Emirates — with
              neighbourhood polygons sourced from Dubai Pulse, Abu Dhabi Open
              Data and OpenStreetMap.
            </p>
          </div>
        </div>
      </section>

      {/* Sources table */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-5xl">
          <div className="overflow-x-auto rounded-z-md border border-ink-line bg-white">
            <table className="w-full text-left">
              <thead className="bg-surface-cream">
                <tr>
                  <th className="px-4 py-3 font-sans uppercase text-z-micro tracking-[0.08em] font-semibold text-accent-dark">
                    Source
                  </th>
                  <th className="px-4 py-3 font-sans uppercase text-z-micro tracking-[0.08em] font-semibold text-accent-dark">
                    Authority
                  </th>
                  <th className="px-4 py-3 font-sans uppercase text-z-micro tracking-[0.08em] font-semibold text-accent-dark">
                    Scope
                  </th>
                  <th className="px-4 py-3 font-sans uppercase text-z-micro tracking-[0.08em] font-semibold text-accent-dark">
                    Last pull
                  </th>
                  <th className="px-4 py-3 font-sans uppercase text-z-micro tracking-[0.08em] font-semibold text-accent-dark">
                    Licence
                  </th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s, i) => (
                  <tr
                    key={s.name}
                    className={
                      i % 2 === 0
                        ? "bg-white border-t border-ink-line"
                        : "bg-surface-cream/40 border-t border-ink-line"
                    }
                  >
                    <td className="px-4 py-4 align-top">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-ink hover:text-accent-dark transition-colors text-z-body"
                      >
                        {s.name}
                      </a>
                    </td>
                    <td className="px-4 py-4 align-top font-sans text-z-body-sm text-ink-soft">
                      {s.authority}
                    </td>
                    <td className="px-4 py-4 align-top font-sans text-z-body-sm text-ink-soft max-w-md leading-relaxed">
                      {s.scope}
                    </td>
                    <td className="px-4 py-4 align-top font-sans text-z-body-sm text-ink-soft whitespace-nowrap">
                      {s.lastPull}
                    </td>
                    <td className="px-4 py-4 align-top font-sans text-z-body-sm text-ink-soft max-w-xs leading-relaxed">
                      {s.license}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="mt-8 rounded-z-md border border-ink-line bg-white p-6 max-w-3xl">
            <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
              Need to report a missing or incorrect data source? Email{" "}
              <a
                href="mailto:data@zavis.ai"
                className="text-accent-dark hover:underline font-medium"
              >
                data@zavis.ai
              </a>{" "}
              and we will respond within five business days.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
