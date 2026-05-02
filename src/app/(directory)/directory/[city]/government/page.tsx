import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingsTemplate, ListingsCrossLink } from "@/components/directory-v2/templates/ListingsTemplate";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCities, getCityBySlug, getCategories, getProviders,
  LocalProvider,
} from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
interface Props { params: { city: string } }

const GOV_NAME_TERMS = ["- dubai health","- dha","ministry of health","government","public health protection","primary health","health center -","health centre -","tawam hospital","al ain hospital","al qassimi hospital","saqr hospital","fujairah hospital","dibba hospital","kalba hospital","khorfakkan hospital","masafi hospital","sheikh khalifa medical city","sheikh shakhbout","mafraq hospital","corniche hospital","kanad hospital","al dhafra hospital","al wagan hospital"];
const GOV_FT = ["primary healthcare"];

function isGov(name: string, ft: string): boolean {
  const n = name.toLowerCase();
  const f = ft.toLowerCase();
  return GOV_NAME_TERMS.some((t) => n.includes(t)) || GOV_FT.some((t) => f.includes(t));
}
async function getGovProviders(citySlug: string) {
  const { providers } = await safe(
    getProviders({ citySlug, limit: 99999 }),
    { providers: [] as LocalProvider[], total: 0, page: 1, totalPages: 0 },
    "gov:city",
  );
  return providers.filter((p) => isGov(p.name, p.facilityType || ""));
}

export async function generateStaticParams() {
  if (process.env.PREBUILD_STATIC_ROUTES !== "1") return [];
  const cities = getCities();
  const results: { city: string }[] = [];
  for (const c of cities) {
    const govs = await getGovProviders(c.slug);
    if (govs.length > 0) results.push({ city: c.slug });
  }
  return results;
}

function getRegulatorName(s: string): string {
  if (s === "dubai") return "the Dubai Health Authority (DHA)";
  if (s === "abu-dhabi" || s === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}
function getRegulatorShort(s: string): string {
  if (s === "dubai") return "DHA";
  if (s === "abu-dhabi" || s === "al-ain") return "DOH";
  return "MOHAP";
}
function getGovOperator(s: string): string {
  if (s === "dubai") return "Dubai Health (formerly DHA)";
  if (s === "abu-dhabi" || s === "al-ain") return "SEHA (Abu Dhabi Health Services Company) under the DOH";
  return "the Ministry of Health and Prevention (MOHAP)";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const govProvidersMeta = await getGovProviders(city.slug);
  const count = govProvidersMeta.length;
  const base = getBaseUrl();
  const url = `${base}/directory/${city.slug}/government`;
  return {
    title: `Government Healthcare Facilities in ${city.name}, UAE | ${count} Public Facilities`,
    description: `Find ${count} government and public healthcare facilities in ${city.name}, UAE. Browse government hospitals, primary health centers, and public clinics operated by ${getRegulatorShort(city.slug)}. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Government Healthcare Facilities in ${city.name}, UAE`, description: `${count} government hospitals and public health centers in ${city.name}.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default async function GovernmentPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();
  const govProviders = await getGovProviders(city.slug);
  if (govProviders.length === 0) notFound();
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const regulatorShort = getRegulatorShort(city.slug);
  const govOperator = getGovOperator(city.slug);
  const count = govProviders.length;
  const categories = getCategories();

  const hospitals = govProviders.filter((p) => (p.facilityType || "").toLowerCase().includes("hospital"));
  const primaryCare = govProviders.filter((p) => {
    const ft = (p.facilityType || "").toLowerCase();
    const n = p.name.toLowerCase();
    return ft.includes("primary healthcare") || n.includes("primary health") || n.includes("health center") || n.includes("health centre");
  });
  const sorted = [...govProviders].sort((a, b) => {
    const r = Number(b.googleRating) - Number(a.googleRating);
    return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });
  const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);

  const faqs = [
    { question: `How many government healthcare facilities are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count} government and public healthcare facilities in ${city.name}, UAE. These include government hospitals, primary healthcare centers, and specialized public health facilities operated by ${govOperator}. Data sourced from official government registers, last verified March 2026.` },
    { question: `Are government hospitals in ${city.name} free?`, answer: `Government healthcare in the UAE is subsidized but not entirely free. UAE nationals receive free or heavily subsidized treatment. Expatriates with valid health insurance pay reduced co-payments. Uninsured patients pay out-of-pocket at government-set rates, typically 30-50% lower than private hospital fees.` },
    { question: `What services do government hospitals in ${city.name} offer?`, answer: `Government hospitals in ${city.name} offer comprehensive services including emergency care (24/7), inpatient and outpatient care, surgical services, maternity and obstetrics, pediatrics, radiology and imaging, laboratory diagnostics, pharmacy services, and specialist consultations.` },
    { question: `How do I get an appointment at a government hospital in ${city.name}?`, answer: `Appointments at government hospitals in ${city.name} can be booked through ${city.slug === "dubai" ? "the DHA app or by calling the hospital directly" : city.slug === "abu-dhabi" || city.slug === "al-ain" ? "the SEHA app or by calling the hospital directly" : "the MOHAP app or by calling the facility directly"}. Emergency departments accept walk-ins 24/7.` },
    { question: `What insurance is accepted at government facilities in ${city.name}?`, answer: `Government facilities in ${city.name} typically accept ${city.slug === "dubai" ? "DHA Essential Benefits Plan, Daman, and most major insurance plans" : city.slug === "abu-dhabi" || city.slug === "al-ain" ? "Thiqa (for UAE nationals), Daman, and most DOH-recognized insurance plans" : "MOHAP-recognized insurance plans, Daman, and major providers"}.` },
    { question: `What are the wait times at government hospitals in ${city.name}?`, answer: `Emergency departments provide immediate triage for critical cases. Non-critical emergencies: 30-120 minutes. Outpatient specialist appointments: 1-4 weeks. Primary healthcare centers: 15-45 minutes for walk-ins.` },
  ];

  const breadcrumbSchemaItems = [
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "Government Facilities", url: `${base}/directory/${city.slug}/government` },
  ];

  const topRated = ratedProviders[0];

  return (
    <ListingsTemplate
      breadcrumbs={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "Government Facilities" },
      ]}
      eyebrow={`Government · ${city.name}`}
      title={`Government healthcare facilities in ${city.name}.`}
      subtitle={
        <span>
          {count} government and public healthcare facilities in {city.name}, operated by {govOperator}. Regulated by {regulator}.
        </span>
      }
      aeoAnswer={
        <>
          According to the UAE Open Healthcare Directory, there are {count} government healthcare facilities in {city.name}.
          {hospitals.length > 0 && ` This includes ${hospitals.length} government hospital${hospitals.length === 1 ? "" : "s"}`}
          {primaryCare.length > 0 && ` and ${primaryCare.length} primary healthcare center${primaryCare.length === 1 ? "" : "s"}`}.
          {" "}Government facilities in {city.name} are operated by {govOperator}. UAE nationals receive subsidized or free treatment; expatriates are covered through employer-provided insurance or pay government-set rates.
          {topRated && (
            <>
              {" "}The highest-rated government facility is <strong>{topRated.name}</strong>{Number(topRated.googleRating) > 0 ? ` with a ${topRated.googleRating}-star Google rating` : ""}.
            </>
          )}{" "}
          All listings are sourced from official {regulatorShort} registers, last verified March 2026.
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
          {ratedProviders.length >= 3 && (
            <JsonLd data={itemListSchema(`Government Healthcare Facilities in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />
          )}
        </>
      }
      belowGrid={
        <>
          <div>
            <h2 className="font-display font-semibold text-ink text-z-h1 mb-4">
              Related in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ListingsCrossLink
                label={`All healthcare in ${city.name}`}
                href={`/directory/${city.slug}`}
              />
              <ListingsCrossLink
                label={`Walk-in clinics in ${city.name}`}
                href={`/directory/${city.slug}/walk-in`}
                sub="No appointment needed"
              />
              <ListingsCrossLink
                label={`Insurance in ${city.name}`}
                href={`/directory/${city.slug}/insurance`}
                sub="Daman, Thiqa, AXA..."
              />
            </div>
          </div>

          {faqs.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink text-z-h1 mb-5">
                Government healthcare in {city.name} — FAQ
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
