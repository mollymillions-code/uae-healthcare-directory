import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities,
  getCityBySlug,
  getCategories,
  getEmergencyProviders,
} from "@/lib/data";
import {
  breadcrumbSchema,
  faqPageSchema,
  itemListSchema,
  speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

/** Only generate pages for cities with 3+ emergency providers */
export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const params: { city: string }[] = [];

  for (const city of cities) {
    const providers = await safe(getEmergencyProviders(city.slug), [], "emergency:params");
    if (providers.length >= 3) {
      params.push({ city: city.slug });
    }
  }

  return params;
}

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getEmergencyNumber(): string {
  // UAE unified emergency number
  return "998 (Ambulance) or 999 (Police/Fire)";
}

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};

  const base = getBaseUrl();
  const title = `Emergency Healthcare in ${city.name}, UAE | Hospitals & Urgent Care`;
  const description = `Find emergency rooms, urgent care centers, and hospitals with emergency departments in ${city.name}, UAE. Wait times, insurance info, and contact details. Call 998 for ambulance. Updated March 2026.`;
  const url = `${base}/directory/${city.slug}/emergency`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_AE",
      siteName: "UAE Open Healthcare Directory",
      url,
    },
  };
}

export default async function EmergencyCityPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const providers = await safe(getEmergencyProviders(city.slug), [], "emergency:city");
  if (providers.length < 3) notFound();

  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const emergencyNumber = getEmergencyNumber();
  const count = providers.length;
  const categories = getCategories();

  // Sort by rating descending
  const sorted = [...providers].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  const faqs = [
    {
      question: `What is the emergency number in ${city.name}, UAE?`,
      answer: `The UAE emergency numbers are 998 for ambulance services and 999 for police and fire. These numbers work across all emirates including ${city.name}. For non-life-threatening emergencies, you can visit any hospital emergency department listed in the UAE Open Healthcare Directory. Dubai also operates the DHA hotline at 800-342.`,
    },
    {
      question: `How many hospitals have emergency departments in ${city.name}?`,
      answer: `According to the UAE Open Healthcare Directory, there are ${count} healthcare facilities in ${city.name} offering emergency or urgent care services. These include hospitals with 24/7 emergency departments and dedicated urgent care centers. All facilities are licensed by ${regulator}. Data last verified March 2026.`,
    },
    {
      question: `What are the typical emergency room wait times in ${city.name}?`,
      answer: `Emergency departments in ${city.name} use a triage system. Critical and life-threatening cases receive immediate attention. Urgent but non-critical cases are typically seen within 30 to 60 minutes. Non-urgent cases may wait 60 to 120 minutes or longer depending on patient volume. Trauma centers and major hospitals generally have shorter wait times for critical cases due to dedicated trauma teams on staff 24/7.`,
    },
    {
      question: `How much does an emergency room visit cost in ${city.name}?`,
      answer: `An emergency room visit in ${city.name} typically costs AED 300 to 1,000 before treatment, depending on the facility tier. With insurance, you usually pay only the co-payment (AED 0 to 100 for genuine emergencies). Without insurance, costs can range from AED 500 to several thousand dirhams depending on treatment required. Under UAE law, hospitals cannot refuse emergency treatment regardless of insurance status.`,
    },
    {
      question: `Does insurance cover emergency visits in ${city.name}?`,
      answer: `Yes. Under UAE health insurance regulations, all basic health plans must cover emergency services. This applies to plans under both ${regulator} and MOHAP frameworks. Major insurers including Daman, Thiqa, AXA, Cigna, MetLife, Bupa, and Allianz cover emergency department visits. Co-payments for emergencies are typically lower than for scheduled visits. Always carry your insurance card and Emirates ID to the emergency department.`,
    },
    {
      question: `What should I bring to an emergency room in ${city.name}?`,
      answer: `When visiting an emergency room in ${city.name}, bring your Emirates ID (or passport for visitors), health insurance card, a list of current medications, and any relevant medical records. If you have a chronic condition such as diabetes or heart disease, bring documentation. For children, bring their vaccination records if available. Payment method (credit card or cash) is needed for co-payments or uninsured portions.`,
    },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Emergency", url: `${base}/directory/${city.slug}/emergency` },
  ];

  const topRated = sorted[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Emergency" },
      ]}
      eyebrow={`Emergency · ${city.name}`}
      title={`Emergency healthcare in ${city.name}.`}
      subtitle={
        <span>
          {count} emergency and urgent care facilities in {city.name}. Life-threatening emergency? Call {emergencyNumber}. All facilities regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} healthcare facilities in {city.name} offering emergency or urgent care services. These include hospital emergency departments and dedicated urgent care centers. For life-threatening emergencies, call {emergencyNumber}. Emergency departments provide immediate triage for critical cases. Non-critical emergency visits are typically attended to within 30 to 120 minutes.
          {topRated && Number(topRated.googleRating) > 0 && (
            <>
              {" "}The highest-rated facility is <strong>{topRated.name}</strong> with a {topRated.googleRating}-star Google rating based on {topRated.googleReviewCount.toLocaleString()} patient reviews.
            </>
          )}{" "}
          All listings are sourced from official {regulator} licensed facility registers.
        </>
      }
      total={count}
      providers={sorted.map((p) => {
        const cat = categories.find((c) => c.slug === p.categorySlug);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          citySlug: p.citySlug,
          categorySlug: p.categorySlug,
          categoryName: cat?.name ?? null,
          address: p.address,
          googleRating: p.googleRating,
          googleReviewCount: p.googleReviewCount,
          isClaimed: p.isClaimed,
          isVerified: p.isVerified,
          photos: p.photos ?? null,
          coverImageUrl: p.coverImageUrl ?? null,
        };
      })}
      schemas={
        <>
          <JsonLd data={breadcrumbSchema(breadcrumbSchemaItems)} />
          <JsonLd data={speakableSchema([".answer-block"])} />
          <JsonLd data={faqPageSchema(faqs)} />
          <JsonLd
            data={itemListSchema(
              `Emergency Healthcare in ${city.name}`,
              sorted.slice(0, 20),
              city.name,
              base
            )}
          />
        </>
      }
      belowGrid={
        <>
          <div className="rounded-z-md border border-ink-line bg-white p-5 sm:p-6">
            <p className="font-sans text-z-caption uppercase tracking-wide text-ink-muted mb-1">
              Life-threatening emergency? Call now
            </p>
            <p className="font-display font-semibold text-ink text-z-h1">
              <a href="tel:998" className="hover:underline">998</a>{" "}
              <span className="text-ink-muted font-sans font-normal text-z-body">(Ambulance)</span>
              {" · "}
              <a href="tel:999" className="hover:underline">999</a>{" "}
              <span className="text-ink-muted font-sans font-normal text-z-body">(Police/Fire)</span>
            </p>
            <p className="font-sans text-z-caption text-ink-muted mt-1">
              Dubai Health Authority hotline: <a href="tel:800342" className="underline">800-342</a>
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`24-hour healthcare in ${city.name}`}
                href={`/directory/${city.slug}/24-hour`}
                sub="Non-emergency overnight"
              />
              <ListingsCrossLink
                label={`All healthcare in ${city.name}`}
                href={`/directory/${city.slug}`}
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Emergency healthcare in {city.name} — FAQ
              </h2>
              <div className="max-w-3xl">
                <FaqSection faqs={faqs} />
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
