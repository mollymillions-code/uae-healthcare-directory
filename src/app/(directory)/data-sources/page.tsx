import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, truncateTitle, truncateDescription } from "@/lib/seo";
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
    scope: "Every licensed healthcare facility in Dubai (hospital, clinic, dental, pharmacy, lab, imaging, allied health).",
    lastPull: "Q1 2026",
    license: "Public register; permitted for non-commercial directory use with attribution.",
  },
  {
    name: "DHA Sheryan — Professionals",
    authority: "Dubai Health Authority",
    url: "https://www.dha.gov.ae/en/sheryan",
    scope: "Every licensed medical professional practising in Dubai (physicians, dentists, nurses, allied health, pharmacists).",
    lastPull: "Q1 2026",
    license: "Public register; permitted for non-commercial directory use with attribution.",
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
    scope: "Licensed healthcare facilities in the Northern Emirates (Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah).",
    lastPull: "Q1 2026",
    license: "Public register; attribution required.",
  },
  {
    name: "Dubai Pulse — dm_community-open",
    authority: "Smart Dubai / Dubai Pulse",
    url: "https://www.dubaipulse.gov.ae/data/dm-community/dm_community-open",
    scope: "Authoritative neighbourhood and community polygons for Dubai (EN + AR names, GeoJSON).",
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
    scope: "Fallback neighbourhood and area data for Northern Emirates and any geography not covered by Dubai Pulse / Abu Dhabi Open Data.",
    lastPull: "Q1 2026",
    license: "Open Database License (ODbL). Attribution required: \u00a9 OpenStreetMap contributors.",
  },
  {
    name: "Google Places API (New)",
    authority: "Google",
    url: "https://developers.google.com/maps/documentation/places/web-service",
    scope: "Optional enrichment for facility profiles — review count, rating average, gallery photos, opening hours, Google Maps URI.",
    lastPull: "Rolling — fetched once per facility, cached on Cloudflare R2.",
    license: "Google Maps Platform Terms of Service. Attribution surfaced on facility pages where required.",
  },
  {
    name: "ORCID",
    authority: "ORCID, Inc.",
    url: "https://orcid.org",
    scope: "Persistent academic identifier used on Zavis author and reviewer profiles when consented.",
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <JsonLd data={webPageJsonLd} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Data Sources", url: `${base}/data-sources` },
        ])}
      />

      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Data Sources" }]} />

      <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">
        Data Sources
      </h1>
      <p className="font-['Geist',sans-serif] text-sm text-black/45 mb-10 max-w-3xl">
        Every primary data source feeding the directory, the professionals
        index, the neighbourhood taxonomy and the Intelligence editorial
        layer. We list each source by name, authority, URL, scope, last
        pull date and licence terms. We do not buy facility lists from
        third-party data brokers, and we do not generate facilities from
        unverified web scraping.
      </p>

      <div className="overflow-x-auto border border-black/[0.08] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f8f6] text-left">
            <tr>
              <th className="px-4 py-3 font-['Geist',sans-serif] uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                Source
              </th>
              <th className="px-4 py-3 font-['Geist',sans-serif] uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                Authority
              </th>
              <th className="px-4 py-3 font-['Geist',sans-serif] uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                Scope
              </th>
              <th className="px-4 py-3 font-['Geist',sans-serif] uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                Last pull
              </th>
              <th className="px-4 py-3 font-['Geist',sans-serif] uppercase text-[11px] tracking-widest font-semibold text-[#006828]">
                Licence
              </th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s, i) => (
              <tr
                key={s.name}
                className={i % 2 === 0 ? "bg-white" : "bg-[#fcfcfb]"}
              >
                <td className="px-4 py-4 align-top">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Bricolage_Grotesque',sans-serif] font-semibold text-[#1c1c1c] hover:text-[#006828] transition-colors"
                  >
                    {s.name}
                  </a>
                </td>
                <td className="px-4 py-4 align-top font-['Geist',sans-serif] text-black/55">
                  {s.authority}
                </td>
                <td className="px-4 py-4 align-top font-['Geist',sans-serif] text-black/55 max-w-md">
                  {s.scope}
                </td>
                <td className="px-4 py-4 align-top font-['Geist',sans-serif] text-black/55 whitespace-nowrap">
                  {s.lastPull}
                </td>
                <td className="px-4 py-4 align-top font-['Geist',sans-serif] text-black/55 max-w-xs">
                  {s.license}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-black/40 font-['Geist',sans-serif] max-w-3xl">
        Need to report a missing or incorrect data source? Email{" "}
        <a
          href="mailto:data@zavis.ai"
          className="text-[#006828] hover:underline"
        >
          data@zavis.ai
        </a>{" "}
        and we will respond within five business days.
      </p>
    </div>
  );
}
