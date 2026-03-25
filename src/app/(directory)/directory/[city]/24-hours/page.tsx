import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCityBySlug, getCities, getCategories, getProviders,
  LocalProvider,
} from "@/lib/data";
import {
  breadcrumbSchema, faqPageSchema, itemListSchema, speakableSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

interface Props {
  params: { city: string };
}

// ─── 24-hour detection ──────────────────────────────────────────────────────

function is24Hour(p: LocalProvider): boolean {
  if (!p.operatingHours) return false;
  const hours = Object.values(p.operatingHours);
  return hours.some(
    (h) => h.open === "00:00" && (h.close === "23:59" || h.close === "00:00")
  );
}

// ─── Regulator helpers ──────────────────────────────────────────────────────

function getRegulatorName(citySlug: string): string {
  if (citySlug === "dubai") return "the Dubai Health Authority (DHA)";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain")
    return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getRegulatorShort(citySlug: string): string {
  if (citySlug === "dubai") return "DHA";
  if (citySlug === "abu-dhabi" || citySlug === "al-ain") return "DOH";
  return "MOHAP";
}

// ─── generateStaticParams ───────────────────────────────────────────────────

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

// ─── generateMetadata ───────────────────────────────────────────────────────

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const base = getBaseUrl();

  const { providers: allCity } = getProviders({ citySlug: city.slug, limit: 99999 });
  const providers24 = allCity.filter(is24Hour);
  const count = providers24.length;

  const title = `24 Hour Clinics, Hospitals & Pharmacies in ${city.name} | Open Now`;
  const description = `Find ${count} healthcare facilities open 24 hours in ${city.name}, UAE. Includes hospitals, pharmacies, clinics, and emergency care. Verified listings with ratings, reviews, and contact details. Last verified March 2026.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/directory/${city.slug}/24-hours` },
    openGraph: {
      title: `24 Hour Healthcare in ${city.name}, UAE`,
      description,
      url: `${base}/directory/${city.slug}/24-hours`,
      type: "website",
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TwentyFourHoursPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  const base = getBaseUrl();
  const categories = getCategories();

  // Get all providers in this city and filter for 24-hour
  const { providers: allCity } = getProviders({ citySlug: city.slug, limit: 99999 });
  const providers24 = allCity.filter(is24Hour);
  const total = providers24.length;

  // Sort by rating
  const sorted = [...providers24].sort((a, b) => {
    const ratingDiff = Number(b.googleRating) - Number(a.googleRating);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.googleReviewCount || 0) - (a.googleReviewCount || 0);
  });

  // Category breakdown
  const catBreakdown = categories
    .map((cat) => ({
      ...cat,
      count24: providers24.filter((p) => p.categorySlug === cat.slug).length,
    }))
    .filter((c) => c.count24 > 0)
    .sort((a, b) => b.count24 - a.count24);

  const hospitalCount = catBreakdown.find((c) => c.slug === "hospitals")?.count24 || 0;
  const pharmacyCount = catBreakdown.find((c) => c.slug === "pharmacy")?.count24 || 0;
  const clinicCount = catBreakdown.find((c) => c.slug === "clinics")?.count24 || 0;

  const regulator = getRegulatorName(city.slug);
  const regulatorShort = getRegulatorShort(city.slug);

  // Cap provider display at 50
  const displayProviders = sorted.slice(0, 50);

  // ─── FAQs ─────────────────────────────────────────────────────────────────

  const faqs = [
    {
      question: `Which hospitals in ${city.name} are open 24 hours?`,
      answer: `According to the UAE Open Healthcare Directory, ${hospitalCount} hospital${hospitalCount !== 1 ? "s" : ""} in ${city.name} operate 24 hours a day, 7 days a week. These include major private and government hospitals with emergency departments, inpatient wards, and round-the-clock nursing care. All 24-hour hospitals are licensed by ${regulator} and must accept emergency patients regardless of insurance status.`,
    },
    {
      question: `Are there 24-hour pharmacies in ${city.name}?`,
      answer: `Yes. The UAE Open Healthcare Directory lists ${pharmacyCount} 24-hour ${pharmacyCount === 1 ? "pharmacy" : "pharmacies"} in ${city.name}. These pharmacies dispense prescription and over-the-counter medications around the clock. ${regulatorShort}-licensed pharmacies must have a registered pharmacist present at all times during operating hours.`,
    },
    {
      question: `Can I visit a clinic at night in ${city.name}?`,
      answer: `Yes. ${clinicCount} ${clinicCount === 1 ? "clinic" : "clinics"} in ${city.name} ${clinicCount === 1 ? "operates" : "operate"} 24 hours and ${clinicCount === 1 ? "accepts" : "accept"} patients at night. These include walk-in clinics, urgent care centers, and polyclinics with extended hours. Wait times at night are generally shorter than during peak daytime hours. For true medical emergencies, always go to the nearest hospital emergency department.`,
    },
    {
      question: `Do I need insurance for emergency care in ${city.name}?`,
      answer: `No. In the UAE, all ${regulatorShort}-licensed hospital emergency departments must accept and treat emergency patients regardless of insurance status. You may be billed afterward if uninsured, but treatment cannot be denied. ${city.slug === "dubai" ? "Dubai mandates health insurance for all residents under the DHA Essential Benefits Plan." : city.slug === "abu-dhabi" || city.slug === "al-ain" ? "Abu Dhabi requires mandatory health insurance for all residents under DOH regulations." : `Health insurance in ${city.name} follows MOHAP federal guidelines.`} If you have insurance, bring your insurance card for direct billing.`,
    },
    {
      question: "What is the emergency number in UAE?",
      answer: "The emergency ambulance number in the UAE is 998. For police, call 999. For fire, call 997. You can also call 112, which is the universal emergency number and works across all UAE emirates. In a medical emergency, call 998 for an ambulance or go directly to the nearest hospital emergency department — they cannot refuse treatment.",
    },
  ];

  // ─── JSON-LD ──────────────────────────────────────────────────────────────

  const breadcrumbs = breadcrumbSchema([
    { name: "UAE", url: base },
    { name: city.name, url: `${base}/directory/${city.slug}` },
    { name: "24 Hour Healthcare" },
  ]);

  const itemList = sorted.length > 0
    ? itemListSchema(
        `24 Hour Healthcare Providers in ${city.name}`,
        sorted.slice(0, 20),
        city.name,
        base
      )
    : null;

  return (
    <div className="container-tc py-8">
      {/* JSON-LD */}
      <JsonLd data={breadcrumbs} />
      {itemList && <JsonLd data={itemList} />}
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />

      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: "UAE", href: "/" },
        { label: city.name, href: `/directory/${city.slug}` },
        { label: "24 Hour Healthcare" },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark mb-2">
          24 Hour Clinics, Hospitals &amp; Pharmacies in {city.name}
        </h1>
        <p className="text-sm text-muted">
          {total} verified 24-hour {total === 1 ? "provider" : "providers"} &middot; {regulatorShort} licensed &middot; Last updated March 2026
        </p>
      </div>

      {/* Answer Block */}
      <div className="answer-block mb-8" data-answer-block="true">
        <p className="text-muted leading-relaxed">
          According to the UAE Open Healthcare Directory, {city.name} has{" "}
          <strong>{total} healthcare {total === 1 ? "facility" : "facilities"}</strong>{" "}
          that {total === 1 ? "operates" : "operate"} 24 hours a day, 7 days a week.
          {hospitalCount > 0 || pharmacyCount > 0 || clinicCount > 0
            ? ` These include ${[
                hospitalCount > 0 ? `${hospitalCount} ${hospitalCount === 1 ? "hospital" : "hospitals"}` : "",
                pharmacyCount > 0 ? `${pharmacyCount} ${pharmacyCount === 1 ? "pharmacy" : "pharmacies"}` : "",
                clinicCount > 0 ? `${clinicCount} ${clinicCount === 1 ? "clinic" : "clinics"}` : "",
              ].filter(Boolean).join(", ")}.`
            : ""}
          {" "}In {city.name}, emergency care is regulated by {regulator} — all licensed
          emergency departments must accept patients regardless of insurance status.
          Data sourced from official government registers, last verified March 2026.
        </p>
      </div>

      {/* Category Breakdown */}
      {catBreakdown.length > 0 && (
        <section className="mb-10">
          <div className="section-header">
            <h2>24-Hour Providers by Category</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {catBreakdown.map((cat) => (
              <Link
                key={cat.slug}
                href={`/directory/${city.slug}/${cat.slug}`}
                className="flex items-center gap-2 border border-light-200 px-3 py-2 hover:border-accent group transition-colors"
              >
                <span className="text-xs font-bold text-dark group-hover:text-accent transition-colors">
                  {cat.name}
                </span>
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0">
                  {cat.count24}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted mt-3">
            Showing {catBreakdown.length} {catBreakdown.length === 1 ? "category" : "categories"} with
            24-hour providers in {city.name}. Click a category to browse all providers in that specialty.
          </p>
        </section>
      )}

      {/* Provider List */}
      <section className="mb-10">
        <div className="section-header">
          <h2>All 24-Hour Healthcare Providers in {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>

        {displayProviders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProviders.map((p) => (
                <ProviderCard
                  key={p.id}
                  name={p.name}
                  slug={p.slug}
                  citySlug={p.citySlug}
                  categorySlug={p.categorySlug}
                  address={p.address}
                  phone={p.phone}
                  website={p.website}
                  shortDescription={p.shortDescription}
                  googleRating={p.googleRating}
                  googleReviewCount={p.googleReviewCount}
                  isClaimed={p.isClaimed}
                  isVerified={p.isVerified}
                />
              ))}
            </div>
            {total > 50 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted">
                  Showing 50 of {total.toLocaleString()} 24-hour providers. Use the{" "}
                  <Link
                    href={`/search?city=${city.slug}&q=24+hours`}
                    className="text-accent font-bold"
                  >
                    search tool
                  </Link>{" "}
                  to browse all 24-hour providers in {city.name}.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 border border-light-200">
            <p className="text-muted mb-2">
              No confirmed 24-hour providers found in {city.name} yet.
            </p>
            <Link
              href={`/directory/${city.slug}`}
              className="text-accent text-sm font-bold"
            >
              View all healthcare providers in {city.name} &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Emergency Info Section */}
      <section className="mb-10">
        <div className="section-header">
          <h2>Emergency Information — {city.name}</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="answer-block" data-answer-block="true">
          <div className="space-y-3 text-muted leading-relaxed">
            <p>
              <strong>UAE Emergency Numbers:</strong>
            </p>
            <ul className="list-none space-y-1.5 text-sm">
              <li>
                <strong>998</strong> — Ambulance
              </li>
              <li>
                <strong>999</strong> — Police
              </li>
              <li>
                <strong>997</strong> — Fire
              </li>
              <li>
                <strong>112</strong> — Universal emergency (works across all
                emirates)
              </li>
            </ul>
            <p className="text-sm">
              In a medical emergency, go to the nearest hospital emergency
              department — they cannot refuse treatment regardless of your
              insurance status. All {regulatorShort}-licensed emergency
              departments in {city.name} operate 24/7 with immediate triage.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={faqs}
        title={`24 Hour Healthcare in ${city.name} — FAQ`}
      />

      {/* Cross-links */}
      <section className="mt-10 mb-10">
        <div className="section-header">
          <h2>Related Pages</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/directory/${city.slug}`}
            className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            All healthcare in {city.name}
          </Link>
          <Link
            href={`/directory/${city.slug}/emergency-care`}
            className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            Emergency care in {city.name}
          </Link>
          <Link
            href={`/directory/${city.slug}/hospitals`}
            className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            Hospitals in {city.name}
          </Link>
          <Link
            href={`/directory/${city.slug}/pharmacy`}
            className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            Pharmacies in {city.name}
          </Link>
          <Link
            href={`/directory/${city.slug}/insurance`}
            className="border border-light-300 px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            Insurance in {city.name}
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Operating hours are sourced from official{" "}
          {regulatorShort} registers and provider-submitted data, last verified
          March 2026. Hours may vary on public holidays. Always confirm directly
          with the provider before visiting, especially during Ramadan or UAE
          national holidays. For medical emergencies, call 998 (ambulance) or go
          to the nearest hospital emergency department.
        </p>
      </div>
    </div>
  );
}
