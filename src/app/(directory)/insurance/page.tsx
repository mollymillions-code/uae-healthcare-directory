import { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { PlanBrowser } from "@/components/insurance/PlanBrowser";
import { InsuranceQuiz } from "@/components/insurance/InsuranceQuiz";
import {
  INSURER_PROFILES,
  getAllInsurerNetworkStats,
} from "@/lib/insurance";
import { getCities, getProviderCountByCity } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, medicalWebPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "UAE Health Insurance Navigator — Compare Plans, Coverage & Provider Networks | UAE Open Healthcare Directory",
    description:
      "Compare health insurance plans in the UAE side-by-side. Coverage details, premiums, co-pay, dental, maternity, and provider network sizes for Daman, Thiqa, AXA, Cigna, Bupa, and 8 more insurers. Find the right plan for your budget and needs.",
    alternates: { canonical: `${base}/insurance` },
    openGraph: {
      title: "UAE Health Insurance Navigator — Compare Plans & Networks",
      description: "Compare 80+ health insurance plans across 38 UAE insurers. Coverage, premiums, network sizes, and a personalised plan finder.",
      url: `${base}/insurance`,
      type: "website",
    },
  };
}

export default function InsuranceNavigatorPage() {
  const base = getBaseUrl();
  const allStats = getAllInsurerNetworkStats();
  const totalPlans = INSURER_PROFILES.reduce((sum, p) => sum + p.plans.length, 0);
  const totalProviders = allStats.reduce((sum, s) => sum + s.totalProviders, 0);

  // City insurance data — top 3 insurers by network size per city
  const cities = getCities();
  const cityInsuranceData = cities
    .map((city) => {
      const providerCount = getProviderCountByCity(city.slug);
      const topInsurers = allStats
        .map((s) => {
          const cityBreakdown = s.byCity.find((b) => b.citySlug === city.slug);
          return { name: s.name, slug: s.slug, count: cityBreakdown?.providerCount ?? 0 };
        })
        .filter((i) => i.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      return { city, providerCount, topInsurers };
    })
    .filter((d) => d.providerCount > 0 && d.topInsurers.length > 0);

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

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Health Insurance Navigator" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={medicalWebPageSchema(
        "UAE Health Insurance Navigator",
        `Compare ${totalPlans} health insurance plans across ${INSURER_PROFILES.length} UAE insurers, mapped to ${totalProviders.toLocaleString()} healthcare providers.`,
        "2026-03-25"
      )} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Health Insurance Navigator" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            UAE Health Insurance Navigator
          </h1>
        </div>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            Compare {totalPlans} health insurance plans across {INSURER_PROFILES.length} UAE insurers — mapped to{" "}
            {totalProviders.toLocaleString()} healthcare providers in our directory. Filter by
            coverage, premium, co-pay, and network size. Find which insurers cover your
            preferred hospitals and clinics, and compare plans side-by-side.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: INSURER_PROFILES.length.toString(), label: "Insurers" },
            { value: totalPlans.toString(), label: "Plans compared" },
            { value: totalProviders.toLocaleString(), label: "Providers mapped" },
            { value: "8", label: "UAE cities" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How UAE Health Insurance Works */}
      <div className="section-header">
        <h2>How UAE Health Insurance Works</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-12" data-answer-block="true">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 — Mandatory Coverage */}
          <div className="border border-light-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">Mandatory Coverage</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Health insurance is compulsory for all UAE residents. Abu Dhabi mandated employer-sponsored
              coverage in <strong>2006</strong> under the HAAD (now DOH) scheme, making it the first emirate to do so.
              Dubai followed in <strong>2014</strong> under the DHA&apos;s mandatory health insurance law.
              The remaining Northern Emirates — Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain —
              are progressively implementing mandatory schemes under <strong>MOHAP</strong> federal supervision.
              Employers who fail to provide coverage face fines and visa renewal restrictions.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">Abu Dhabi: since 2006</span>
              <span className="badge">Dubai: since 2014</span>
              <span className="badge">Others: phased rollout</span>
            </div>
          </div>

          {/* Card 2 — How Plans Work */}
          <div className="border border-light-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">How Plans Work</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Most UAE residents receive employer-sponsored insurance: the employer pays the annual premium
              directly to the insurer. When you visit a provider, you present your insurance card and pay a
              <strong> co-pay</strong> (typically 10–20% of the consultation or treatment cost) up to a
              per-visit cap. The insurer covers the rest up to the plan&apos;s <strong>annual limit</strong>
              — ranging from AED 150,000 for basic plans to AED 1,000,000+ for premium plans. Inpatient
              hospital admissions often require <strong>pre-authorisation</strong> from the insurer before treatment.
              Claims are processed either directly between the provider and insurer (direct billing) or reimbursed
              to you after paying out-of-pocket.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">Employer pays premium</span>
              <span className="badge">10–20% co-pay</span>
              <span className="badge">Annual limits apply</span>
            </div>
          </div>

          {/* Card 3 — Choosing a Plan */}
          <div className="border border-light-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-6 bg-accent flex-shrink-0" />
              <h3 className="text-sm font-bold text-dark">Choosing a Plan</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">
              The single most important factor is <strong>network size</strong> — how many hospitals and clinics
              in your city accept the plan directly. A large network means fewer out-of-pocket surprises.
              Second, check the <strong>co-pay percentage</strong>: the difference between 10% and 20% adds
              up quickly on frequent outpatient visits. Third, look at optional extras: <strong>dental and optical</strong>
              coverage are excluded from most basic plans but available as add-ons or on enhanced tiers.
              For families or women planning pregnancies, confirm <strong>maternity coverage</strong> and
              the waiting period (typically 6–12 months). Finally, if you travel frequently, check whether the
              plan includes emergency or elective <strong>international coverage</strong>.
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="badge">1. Network size</span>
              <span className="badge">2. Co-pay %</span>
              <span className="badge">3. Dental / optical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insurer Quick Links */}
      <div className="section-header">
        <h2>Insurers</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
        {INSURER_PROFILES.map((insurer) => {
          const stats = allStats.find((s) => s.slug === insurer.slug);
          return (
            <Link
              key={insurer.slug}
              href={`/insurance/${insurer.slug}`}
              className="border border-light-200 p-3 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {insurer.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
              </div>
              <p className="text-[11px] text-muted">
                {insurer.plans.length} plan{insurer.plans.length !== 1 ? "s" : ""} ·{" "}
                {stats ? `${stats.totalProviders.toLocaleString()} providers` : "Network data"}
              </p>
              <span className="badge text-[9px] mt-2">{insurer.type}</span>
            </Link>
          );
        })}
      </div>

      {/* Insurance by City */}
      <div className="section-header">
        <h2>Insurance by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Insurance network coverage varies significantly by emirate. Browse providers and top-performing insurers in each UAE city.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {cityInsuranceData.map(({ city, providerCount, topInsurers }) => (
          <Link
            key={city.slug}
            href={`/directory/${city.slug}/insurance`}
            className="border border-light-200 p-4 hover:border-accent transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {city.name}
              </h3>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
            </div>
            <p className="text-xs text-muted mb-3">
              {providerCount.toLocaleString()} providers
            </p>
            <div className="space-y-1">
              {topInsurers.map((ins, idx) => (
                <div key={ins.slug} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-muted w-3 flex-shrink-0">#{idx + 1}</span>
                  <span className="text-[11px] text-dark truncate">{ins.name}</span>
                  <span className="text-[9px] text-muted ml-auto flex-shrink-0">{ins.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Plan Finder Quiz */}
      <div className="section-header">
        <h2>Find Your Plan</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="mb-12 bg-light-50 p-6 border border-light-200">
        <p className="text-xs text-muted mb-4">
          Answer a few questions and we&apos;ll recommend plans that match your budget, coverage needs, and preferred city.
        </p>
        <InsuranceQuiz />
      </div>

      {/* All Plans Browser */}
      <div className="section-header">
        <h2>Compare All Plans</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Browse all {totalPlans} plans. Use the checkboxes to select up to 4 plans for side-by-side comparison.
      </p>
      <PlanBrowser />

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection faqs={faqs} title="Health Insurance in the UAE — FAQ" />
      </div>

      {/* Regulatory Bodies */}
      <div className="mt-12">
        <div className="section-header">
          <h2>UAE Health Insurance Regulators</h2>
          <span className="arrows">&gt;&gt;&gt;</span>
        </div>
        <div className="answer-block" data-answer-block="true">
          <p className="text-xs text-muted mb-4">
            Health insurance in the UAE is regulated at both the emirate and federal level. Three bodies govern the majority of the insured population:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* DHA */}
            <div className="bg-light-50 border border-light-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">Dubai</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">Dubai Health Authority (DHA)</h3>
              <p className="text-xs text-muted leading-relaxed">
                The DHA regulates all health insurance activity in the Emirate of Dubai, including licensing
                insurers and TPAs, setting mandatory benefit structures, and managing the <strong>Saada</strong>
                basic benefits plan for low-income workers. All health insurance sold in Dubai must comply with
                DHA&apos;s Essential Benefits Plan (EBP) as the minimum standard. The DHA also operates the
                Dubai Electronic Unified Trading Platform (DEUPT) for insurance data submissions.
              </p>
            </div>
            {/* DOH */}
            <div className="bg-light-50 border border-light-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">Abu Dhabi</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">Department of Health – Abu Dhabi (DOH)</h3>
              <p className="text-xs text-muted leading-relaxed">
                Formerly the Health Authority Abu Dhabi (HAAD), the DOH oversees healthcare regulation and
                mandatory insurance in Abu Dhabi and Al Ain. The DOH&apos;s <strong>Daman</strong> (National
                Health Insurance Company) administers the <strong>Thiqa</strong> scheme for Emirati nationals and
                the <strong>Basic</strong> plan for expatriate dependants. The DOH sets minimum benefit standards
                and conducts annual audits of all insurance products operating in the emirate.
              </p>
            </div>
            {/* MOHAP */}
            <div className="bg-light-50 border border-light-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge">Federal</span>
              </div>
              <h3 className="text-sm font-bold text-dark mb-2">Ministry of Health & Prevention (MOHAP)</h3>
              <p className="text-xs text-muted leading-relaxed">
                MOHAP acts as the federal health authority covering the Northern Emirates — Sharjah, Ajman,
                Ras Al Khaimah, Fujairah, and Umm Al Quwain — as well as setting national health policy.
                While Dubai and Abu Dhabi have their own regulators, MOHAP coordinates cross-emirate standards,
                supervises health insurance rollout in non-DHA/DOH emirates, and maintains the federal
                <strong> Malaffi</strong> health record exchange. Insurers operating across multiple emirates
                must satisfy both the relevant emirate regulator and MOHAP reporting requirements.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Source: DHA circular No. 16/2013 (mandatory insurance Dubai), DOH Resolution No. 1/2014 (Abu Dhabi updates), MOHAP federal mandate 2023.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Premium ranges and coverage details shown are indicative,
          based on publicly available UAE insurance market data. Actual premiums vary by age,
          nationality, visa type, employer group size, and medical history. Always obtain a
          personalised quote from the insurer or an authorised broker before purchasing.
          This tool is for informational purposes only and does not constitute insurance advice.
          Data cross-referenced with the UAE Open Healthcare Directory, last verified March 2026.
        </p>
      </div>
    </div>
  );
}
