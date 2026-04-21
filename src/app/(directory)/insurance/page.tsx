import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles, Shield } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanBrowser } from "@/components/insurance/PlanBrowser";
import { InsuranceQuiz } from "@/components/insurance/InsuranceQuiz";
import {
  INSURER_PROFILES,
  getAllInsurerNetworkStats,
} from "@/lib/insurance";
import { getCities, getProviderCountByCity } from "@/lib/data";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  medicalWebPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { safe } from "@/lib/safeData";

export const revalidate = 43200;
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title:
      "UAE Health Insurance Navigator — Compare Plans, Coverage & Provider Networks | UAE Open Healthcare Directory",
    description:
      "Compare health insurance plans in the UAE side-by-side. Coverage details, premiums, co-pay, dental, maternity, and provider network sizes for Daman, Thiqa, AXA, Cigna, Bupa, and 8 more insurers. Find the right plan for your budget and needs.",
    alternates: { canonical: `${base}/insurance` },
    openGraph: {
      title: "UAE Health Insurance Navigator — Compare Plans & Networks",
      description:
        "Compare 80+ health insurance plans across 38 UAE insurers. Coverage, premiums, network sizes, and a personalised plan finder.",
      url: `${base}/insurance`,
      type: "website",
    },
  };
}

export default async function InsuranceNavigatorPage() {
  const base = getBaseUrl();

  const allStats = await safe(
    getAllInsurerNetworkStats(),
    [] as Awaited<ReturnType<typeof getAllInsurerNetworkStats>>,
    "insurance:allStats",
  );
  const totalPlans = INSURER_PROFILES.reduce((sum, p) => sum + p.plans.length, 0);
  const totalProviders = allStats.reduce((sum, s) => sum + s.totalProviders, 0);

  // City insurance data — top 3 insurers by network size per city
  const cities = getCities();
  const cityInsuranceData = await Promise.all(
    cities.map(async (city) => {
      const providerCount = await safe(
        getProviderCountByCity(city.slug),
        0,
        `insurance:providerCount:${city.slug}`,
      );
      const topInsurers = allStats
        .map((s) => {
          const cityBreakdown = s.byCity.find((b) => b.citySlug === city.slug);
          return {
            name: s.name,
            slug: s.slug,
            count: cityBreakdown?.providerCount ?? 0,
          };
        })
        .filter((i) => i.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      return { city, providerCount, topInsurers };
    }),
  );
  const filteredCityInsuranceData = cityInsuranceData.filter(
    (d) => d.providerCount > 0 && d.topInsurers.length > 0,
  );

  const faqs = [
    {
      question: "Is health insurance mandatory in the UAE?",
      answer:
        "Yes. Health insurance is mandatory for all residents in Abu Dhabi (since 2006) and Dubai (since 2014). Other emirates are progressively implementing mandatory schemes under MOHAP regulations. Employers are required to provide health insurance for their employees, and in many cases, for dependants as well.",
    },
    {
      question: "What is the cheapest health insurance in the UAE?",
      answer:
        "The most affordable plans start from around AED 600–750/year for Daman Basic (Abu Dhabi mandatory scheme) and AED 2,200–2,800/year for basic DHA-compliant plans in Dubai. These cover inpatient, outpatient, and emergency care but typically exclude dental, optical, and maternity.",
    },
    {
      question: "What does health insurance typically cover in the UAE?",
      answer:
        "All DHA/HAAD-compliant plans must cover inpatient hospitalisation, outpatient consultations, emergency treatment, prescribed medications, maternity (with waiting periods), and preventive care. Enhanced and premium plans add dental, optical, mental health, alternative medicine, and international coverage.",
    },
    {
      question: "How do I choose between insurance providers in the UAE?",
      answer:
        "Consider: (1) Network size — how many hospitals and clinics accept the plan in your city, (2) Coverage — dental, maternity, optical, mental health, (3) Co-pay — what percentage you pay at each visit, (4) Annual limit — maximum the insurer will pay per year, and (5) Premium — what it costs annually. Use our plan comparison tool above to evaluate side-by-side.",
    },
    {
      question: "Can I use my health insurance across different emirates?",
      answer:
        "It depends on the plan. Basic plans from DHA or HAAD may only cover providers in their respective emirate. Enhanced and premium plans from national insurers like AXA, Cigna, Bupa, and Oman Insurance typically provide multi-emirate coverage across all UAE cities.",
    },
    {
      question: "What happens if my insurance doesn't cover a treatment?",
      answer:
        "If a treatment is excluded from your plan, you have several options: (1) pay out-of-pocket at the provider, (2) request a pre-authorisation exception from your insurer with a supporting letter from your doctor, (3) appeal the rejection in writing within 30 days — DHA and DOH mandate formal grievance processes for insurers, (4) escalate to the DHA Complaints Centre (Dubai) or DOH (Abu Dhabi) if the insurer's response is unsatisfactory. Some plans offer supplemental riders (add-ons) that can be purchased to cover excluded treatments such as oncology, physiotherapy, or bariatric surgery.",
    },
    {
      question: "Can I switch health insurance providers in the UAE?",
      answer:
        "Yes, but the timing and process depend on your situation. Employees can request to change plans at renewal with employer approval. Self-sponsored residents can switch at any time by purchasing a new policy and cancelling the old one, though pre-existing conditions may face waiting periods under the new plan. In Dubai, the DHA requires continuous coverage — there must be no gap between cancellation and new policy activation. When switching, confirm the new plan's network includes your preferred hospitals and check if any ongoing treatments require continuity of cover.",
    },
    {
      question: "What is the difference between an insurer and a TPA?",
      answer:
        "A health insurer underwrites the risk and is financially responsible for paying claims. A Third-Party Administrator (TPA) is a specialised company that handles the operational side — processing claims, managing pre-authorisations, maintaining provider networks, and handling member services — on behalf of the insurer. In the UAE, major TPAs include NAS, Nextcare, and Mednet. When you visit a clinic, you may be dealing with the TPA's card and network even though the underlying insurer is, say, Oman Insurance or Al Sagr. Knowing your TPA is useful because they are the first point of contact for claim disputes and pre-approvals.",
    },
  ];

  const breadcrumbs = [
    { label: "UAE", href: "/" },
    { label: "Health Insurance Navigator" },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Health Insurance Navigator" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={medicalWebPageSchema(
          "UAE Health Insurance Navigator",
          `Compare ${totalPlans} health insurance plans across ${INSURER_PROFILES.length} UAE insurers, mapped to ${totalProviders.toLocaleString()} healthcare providers.`,
          "2026-03-25",
        )}
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Insurance navigator
              </p>
              <h1 className="font-display font-semibold text-ink text-display-lg lg:text-[56px] leading-[1.02] tracking-[-0.028em] flex items-center gap-3">
                <Shield className="h-9 w-9 text-accent-dark shrink-0" />
                UAE Health Insurance Navigator
              </h1>
              <p className="font-sans text-z-body sm:text-[17px] text-ink-soft mt-4 max-w-2xl leading-relaxed">
                Compare {totalPlans} health insurance plans across{" "}
                {INSURER_PROFILES.length} UAE insurers — mapped to{" "}
                {totalProviders.toLocaleString()} healthcare providers in our directory.
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {[
                { n: INSURER_PROFILES.length.toString(), l: "Insurers" },
                { n: totalPlans.toString(), l: "Plans compared" },
                { n: totalProviders.toLocaleString(), l: "Providers mapped" },
                { n: "8", l: "UAE cities" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-z-md bg-white border border-ink-line px-4 py-3"
                >
                  <p className="font-display font-semibold text-ink text-z-h1 leading-none">
                    {s.n}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-8 answer-block rounded-z-md bg-white border border-ink-line p-5 sm:p-6 max-w-4xl"
            data-answer-block="true"
          >
            <p className="font-sans text-z-body-sm text-ink-soft leading-[1.75]">
              Filter by coverage, premium, co-pay, and network size. Find which
              insurers cover your preferred hospitals and clinics, and compare
              plans side-by-side. All data is cross-referenced with the UAE Open
              Healthcare Directory.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* How UAE Health Insurance Works */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Fundamentals
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              How UAE health insurance works.
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Mandatory coverage",
                body:
                  "Health insurance is compulsory for all UAE residents. Abu Dhabi mandated employer-sponsored coverage in 2006 under HAAD (now DOH). Dubai followed in 2014 under the DHA's mandatory health insurance law. The Northern Emirates are progressively implementing schemes under MOHAP federal supervision.",
                tags: ["Abu Dhabi: 2006", "Dubai: 2014", "Others: phased"],
              },
              {
                title: "How plans work",
                body:
                  "Most UAE residents receive employer-sponsored insurance. You present your card at a provider, pay a co-pay (typically 10–20%), and the insurer covers the rest up to the annual limit — AED 150,000 for basic plans to AED 1,000,000+ for premium. Inpatient admissions usually need pre-authorisation.",
                tags: ["Employer pays premium", "10–20% co-pay", "Annual limits"],
              },
              {
                title: "Choosing a plan",
                body:
                  "Start with network size — how many hospitals and clinics in your city accept the plan. Then compare co-pay (10% vs 20% adds up fast), dental and optical add-ons, maternity waiting periods (6–12 months), and international coverage if you travel often.",
                tags: ["1. Network size", "2. Co-pay %", "3. Dental / optical"],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-z-md bg-white border border-ink-line p-5"
              >
                <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">
                  {card.title}
                </h3>
                <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed mb-3">
                  {card.body}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insurer Quick Links */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Browse by insurer
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Insurers in the UAE.
            </h2>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {INSURER_PROFILES.map((insurer) => {
              const stats = allStats.find((s) => s.slug === insurer.slug);
              return (
                <Link
                  key={insurer.slug}
                  href={`/insurance/${insurer.slug}`}
                  className="group flex flex-col rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                >
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {insurer.name}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-1">
                    {insurer.plans.length} plan
                    {insurer.plans.length !== 1 ? "s" : ""}
                    {stats
                      ? ` · ${stats.totalProviders.toLocaleString()} providers`
                      : ""}
                  </p>
                  <span className="mt-3 inline-flex w-fit items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark">
                    {insurer.type}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Insurance by City */}
        {filteredCityInsuranceData.length > 0 && (
          <section>
            <header className="mb-6">
              <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
                By emirate
              </p>
              <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
                Insurance by city.
              </h2>
              <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-2xl">
                Network coverage varies by emirate. Browse providers and
                top-performing insurers in each UAE city.
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCityInsuranceData.map(({ city, providerCount, topInsurers }) => (
                <Link
                  key={city.slug}
                  href={`/directory/${city.slug}/insurance`}
                  className="group rounded-z-md bg-white border border-ink-line p-5 hover:border-ink hover:shadow-z-card transition-all duration-z-base"
                >
                  <p className="font-sans font-semibold text-ink text-z-body leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {city.name}
                  </p>
                  <p className="font-sans text-z-caption text-ink-muted mt-0.5 mb-3">
                    {providerCount.toLocaleString()} providers
                  </p>
                  <ul className="space-y-1">
                    {topInsurers.map((ins, idx) => (
                      <li
                        key={ins.slug}
                        className="flex items-center gap-2 font-sans text-z-caption"
                      >
                        <span className="text-ink-muted w-4 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-ink truncate flex-1">{ins.name}</span>
                        <span className="text-ink-muted">
                          {ins.count.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Plan Finder Quiz */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Personalised
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Find your plan.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-2xl">
              Answer a few questions and we&rsquo;ll recommend plans that match
              your budget, coverage needs, and preferred city.
            </p>
          </header>
          <div className="rounded-z-md bg-white border border-ink-line p-6">
            <InsuranceQuiz />
          </div>
        </section>

        {/* All Plans Browser */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Side-by-side
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              Compare all plans.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-2xl">
              Browse all {totalPlans} plans. Select up to 4 for side-by-side
              comparison.
            </p>
          </header>
          <PlanBrowser />
        </section>

        {/* Regulators */}
        <section>
          <header className="mb-6">
            <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
              Who regulates what
            </p>
            <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
              UAE health insurance regulators.
            </h2>
            <p className="font-sans text-z-body-sm text-ink-muted mt-2 max-w-2xl">
              Health insurance in the UAE is regulated at both the emirate and
              federal level. Three bodies govern the majority of the insured
              population.
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                scope: "Dubai",
                name: "Dubai Health Authority (DHA)",
                body:
                  "The DHA regulates all health insurance activity in the Emirate of Dubai, including licensing insurers and TPAs, setting mandatory benefit structures, and managing the Saada basic benefits plan for low-income workers. All health insurance sold in Dubai must comply with DHA's Essential Benefits Plan (EBP).",
              },
              {
                scope: "Abu Dhabi",
                name: "Department of Health — Abu Dhabi (DOH)",
                body:
                  "Formerly HAAD, the DOH oversees healthcare regulation and mandatory insurance in Abu Dhabi and Al Ain. Daman administers the Thiqa scheme for Emirati nationals and the Basic plan for expatriate dependants. The DOH sets minimum benefit standards and conducts annual audits.",
              },
              {
                scope: "Federal",
                name: "Ministry of Health & Prevention (MOHAP)",
                body:
                  "MOHAP is the federal health authority covering the Northern Emirates — Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain — and sets national policy. It coordinates cross-emirate standards, supervises rollout in non-DHA/DOH emirates, and maintains the federal Malaffi record exchange.",
              },
            ].map((card) => (
              <div key={card.name} className="rounded-z-md bg-white border border-ink-line p-5">
                <span className="inline-flex w-fit items-center rounded-z-pill bg-accent-muted px-2.5 py-0.5 font-sans text-z-micro font-medium text-accent-dark mb-3">
                  {card.scope}
                </span>
                <h3 className="font-display font-semibold text-ink text-z-h3 mb-2">
                  {card.name}
                </h3>
                <p className="font-sans text-z-body-sm text-ink-soft leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
          <p className="font-sans text-z-caption text-ink-muted mt-4">
            Source: DHA circular No. 16/2013 (mandatory insurance Dubai), DOH
            Resolution No. 1/2014 (Abu Dhabi updates), MOHAP federal mandate
            2023.
          </p>
        </section>
      </div>

      {/* FAQ */}
      <section className="max-w-z-container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-24">
        <header className="mb-6">
          <p className="font-sans text-z-micro text-accent-dark uppercase tracking-[0.04em] mb-2">
            Questions
          </p>
          <h2 className="font-display font-semibold text-ink text-display-md tracking-[-0.018em]">
            About UAE health insurance.
          </h2>
        </header>
        <div className="max-w-3xl">
          <FaqSection faqs={faqs} title="Health Insurance in the UAE — FAQ" />
        </div>

        <div className="mt-12 rounded-z-md bg-white border border-ink-line p-6 max-w-3xl">
          <p className="font-sans text-z-caption text-ink-muted leading-relaxed">
            <strong className="text-ink-soft">Disclaimer.</strong> Premium
            ranges and coverage details shown are indicative, based on publicly
            available UAE insurance market data. Actual premiums vary by age,
            nationality, visa type, employer group size, and medical history.
            Always obtain a personalised quote from the insurer or an
            authorised broker before purchasing. Data cross-referenced with
            the UAE Open Healthcare Directory, last verified March 2026.
          </p>
        </div>
      </section>
    </>
  );
}
