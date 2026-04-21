import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { getCities, getProviderCountByCity } from "@/lib/data";
import {
  getAllCityPairSlugs,
  getAllCategoryComparisonSlugs,
} from "@/lib/compare";
import { safe } from "@/lib/safeData";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const cityPairCount = getAllCityPairSlugs().length;
  const catCompCount = getAllCategoryComparisonSlugs().length;
  const totalPages = cityPairCount + catCompCount;

  return {
    title: `Compare UAE Healthcare: ${totalPages} City & Category Comparisons | UAE Open Healthcare Directory`,
    description:
      `Side-by-side healthcare comparisons across all 8 UAE cities. Compare provider counts, average ratings, consultation costs, regulators, and top providers between Dubai, Abu Dhabi, Sharjah, and more.`,
    alternates: { canonical: `${base}/directory/compare` },
    openGraph: {
      title: `Compare UAE Healthcare Across ${totalPages} City & Category Pairings`,
      description:
        `Data-driven comparisons of healthcare systems across all UAE emirates. Provider counts, ratings, costs, and insurance coverage compared side-by-side.`,
      url: `${base}/directory/compare`,
      type: "website",
    },
  };
}

const faqs = [
  {
    question: "How does Dubai healthcare compare to Abu Dhabi?",
    answer:
      "Dubai and Abu Dhabi are the two largest healthcare markets in the UAE. Dubai is regulated by the DHA and has the highest provider density, with typical GP consultation fees of AED 150-300. Abu Dhabi is regulated by the DOH, with GP fees of AED 100-250. Both mandate employer-provided health insurance. Dubai has more private specialty clinics, while Abu Dhabi has major academic medical centers like Cleveland Clinic Abu Dhabi. Browse the individual comparison pages for exact provider counts and ratings.",
  },
  {
    question: "Which UAE city has the cheapest healthcare?",
    answer:
      "The Northern Emirates (Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain) generally have the lowest consultation fees, with GP visits costing AED 80-200 compared to AED 150-300 in Dubai. Sharjah is often a middle ground (AED 100-200). However, lower cost can mean fewer specialty options. Dubai and Abu Dhabi have the widest range of specialist providers and international hospital groups.",
  },
  {
    question: "Which UAE city has the highest-rated healthcare providers?",
    answer:
      "Dubai and Abu Dhabi typically have the highest average Google ratings due to the concentration of international hospital groups (Mediclinic, Aster, Cleveland Clinic, NMC). However, individual top-rated providers exist in every emirate. Use the city-vs-city comparison pages to see actual average ratings and top-rated providers for each city.",
  },
  {
    question: "What is the difference between hospitals and clinics in the UAE?",
    answer:
      "Hospitals in the UAE are larger facilities with inpatient beds, emergency departments, operating theaters, and multiple specialties under one roof. Consultation fees are typically AED 300-800 in Dubai. Clinics (polyclinics) are outpatient facilities focused on primary and specialty consultations, with GP fees of AED 150-300 in Dubai. Hospitals are required for surgeries, emergency admissions, and complex diagnostics (MRI, CT). Clinics handle routine check-ups, minor procedures, and specialist consultations.",
  },
];

export default async function CompareHubPage() {
  const base = getBaseUrl();
  const cities = getCities();
  const cityPairs = getAllCityPairSlugs();
  const catComps = getAllCategoryComparisonSlugs();
  const totalPages = cityPairs.length + catComps.length;
  const cityCounts = await Promise.all(
    cities.map((c) => safe(getProviderCountByCity(c.slug), 0, `cityCount:${c.slug}`))
  );
  const cityCountMap = Object.fromEntries(cities.map((c, i) => [c.slug, cityCounts[i]]));
  const totalProviders = cityCounts.reduce((sum, count) => sum + count, 0);

  const cityPairItems: HubItem[] = cityPairs
    .map((pair): HubItem | null => {
      const cityA = cities.find((c) => c.slug === pair.cityASlug);
      const cityB = cities.find((c) => c.slug === pair.cityBSlug);
      if (!cityA || !cityB) return null;
      const countA = cityCountMap[cityA.slug] ?? 0;
      const countB = cityCountMap[cityB.slug] ?? 0;
      return {
        href: `/directory/compare/${pair.slug}`,
        label: `${cityA.name} vs ${cityB.name}`,
        subLabel: `${countA + countB} providers compared`,
      };
    })
    .filter((x): x is HubItem => x !== null);

  const catCompItems: HubItem[] = catComps
    .map((comp): HubItem | null => {
      const city = cities.find((c) => c.slug === comp.citySlug);
      if (!city) return null;
      return {
        href: `/directory/compare/${comp.slug}`,
        label: `Hospitals vs Clinics in ${city.name}`,
      };
    })
    .filter((x): x is HubItem => x !== null);

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: "Directory", href: "/directory" },
        { label: "Compare Healthcare" },
      ]}
      eyebrow="UAE healthcare comparisons"
      title="Compare UAE Healthcare."
      subtitle={
        <>
          {totalPages} data-driven side-by-side comparisons across {cities.length} emirates. Provider counts,
          average ratings, consultation costs, and top-rated facilities.
        </>
      }
      stats={[
        { n: totalProviders.toLocaleString(), l: "Total providers" },
        { n: String(totalPages), l: "Comparisons" },
      ]}
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are{" "}
          {totalProviders.toLocaleString()}+ licensed healthcare providers across
          8 UAE cities. Healthcare in the UAE is regulated by three authorities:
          the Dubai Health Authority (DHA), the Department of Health Abu Dhabi
          (DOH), and the Ministry of Health and Prevention (MOHAP). Costs,
          provider availability, insurance mandates, and quality vary
          significantly by emirate. This page provides {totalPages}{" "}
          data-driven side-by-side comparisons to help patients, families, and
          employers make informed decisions about where to seek care. All data
          is sourced from official government registers and Google Maps ratings,
          last verified March 2026.
        </>
      }
      schemas={
        <>
          <JsonLd
            data={breadcrumbSchema([
              { name: "UAE", url: base },
              { name: "Directory", url: `${base}/directory` },
              { name: "Compare Healthcare", url: `${base}/directory/compare` },
            ])}
          />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
        </>
      }
      sections={[
        {
          title: `City vs City (${cityPairs.length} comparisons)`,
          eyebrow: "Compare emirates",
          items: cityPairItems,
          layout: "grid",
          gridCols: "3",
        },
        {
          title: `Hospitals vs Clinics (${catComps.length} comparisons)`,
          eyebrow: "Compare within a city",
          items: catCompItems,
          layout: "list",
        },
      ]}
      ctaBanner={
        <>
          <div className="max-w-3xl">
            <FaqSection faqs={faqs} title="Healthcare comparison FAQ" />
          </div>
          <div className="mt-8 border-t border-ink-line pt-4">
            <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
              <strong>Disclaimer:</strong> All provider counts, ratings, and cost estimates are based
              on data from official UAE health authority registers (DHA, DOH, MOHAP) and Google Maps,
              last verified March 2026. Consultation fees are indicative ranges and may vary by provider,
              insurance status, and visit complexity. This information is for comparison and educational
              purposes only and does not constitute medical advice.
            </p>
          </div>
        </>
      }
    />
  );
}
