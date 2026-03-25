import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
  ArrowRight,
  MapPin,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  PRICING_GUIDES,
  getGuideBySlug,
} from "@/lib/constants/pricing-guides";
import {
  PROCEDURES,
  formatAed,
  getProcedureBySlug,
} from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import {
  breadcrumbSchema,
  speakableSchema,
  faqPageSchema,
  medicalWebPageSchema,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldOff,
  Plane,
  Globe,
  PiggyBank,
  Crown,
  Baby,
};

interface PageProps {
  params: Promise<{ guide: string }>;
}

export async function generateStaticParams() {
  return PRICING_GUIDES.map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide: slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  const base = getBaseUrl();
  return {
    title: `${guide.name} — Procedure Prices & Tips | UAE Open Healthcare Directory`,
    description: guide.description,
    alternates: { canonical: `${base}/pricing/guide/${guide.slug}` },
    openGraph: {
      title: guide.name,
      description: guide.description,
      url: `${base}/pricing/guide/${guide.slug}`,
      type: "website",
    },
  };
}

/** Generate audience-specific FAQs */
function generateGuideFaqs(
  guide: typeof PRICING_GUIDES[number],
  featuredProcs: typeof PROCEDURES
): { question: string; answer: string }[] {
  const cheapestCity = CITIES.reduce((cheapest, city) => {
    const avgTypical =
      featuredProcs.reduce((sum, p) => {
        const cp = p.cityPricing[city.slug];
        return sum + (cp?.typical ?? 0);
      }, 0) / featuredProcs.length;
    const cheapestAvg =
      featuredProcs.reduce((sum, p) => {
        const cp = p.cityPricing[cheapest.slug];
        return sum + (cp?.typical ?? 0);
      }, 0) / featuredProcs.length;
    return avgTypical < cheapestAvg ? city : cheapest;
  }, CITIES[0]);

  const baseFaqs: { question: string; answer: string }[] = [];

  if (guide.slug === "without-insurance") {
    baseFaqs.push(
      {
        question: "Can I see a doctor in the UAE without health insurance?",
        answer:
          "Yes. All UAE hospitals and clinics accept self-pay (cash) patients. You will need to pay the full consultation and treatment fee upfront. Government hospitals offer the lowest self-pay rates, typically 30-50% less than private facilities. Emergency rooms are legally required to treat all patients regardless of insurance status.",
      },
      {
        question: "How much does a GP visit cost without insurance in the UAE?",
        answer: `A GP consultation without insurance costs ${formatAed(100)} to ${formatAed(500)} depending on the city and facility type. Government primary health centres charge as low as ${formatAed(50)}-${formatAed(80)} in the northern emirates. Private clinics in Dubai typically charge ${formatAed(200)}-${formatAed(400)}.`,
      },
      {
        question: "What is the cheapest city for medical care without insurance?",
        answer: `Based on average procedure prices, ${cheapestCity.name} offers the lowest self-pay rates in the UAE. Northern emirates (Sharjah, Ajman, Umm Al Quwain) are consistently 30-40% cheaper than Dubai across all procedure types.`,
      },
      {
        question: "Are there free clinics in the UAE?",
        answer:
          "UAE nationals can access free healthcare at government facilities. For residents and visitors, there are no fully free clinics, but government hospitals and MOHAP primary health centres offer heavily subsidised rates. Some charitable organisations and community health campaigns offer free health screenings periodically.",
      },
      {
        question: "How do I pay for emergency treatment without insurance in the UAE?",
        answer:
          "UAE hospitals must provide emergency treatment regardless of insurance or payment ability. You will be treated first and billed afterwards. Payment plans are available at most hospitals. If the bill exceeds your ability to pay, hospitals have social work departments that can help arrange financial assistance.",
      }
    );
  } else if (guide.slug === "for-tourists") {
    baseFaqs.push(
      {
        question: "Do I need travel insurance for the UAE?",
        answer:
          "While not legally required for all visa types, travel insurance is strongly recommended. Medical treatment in the UAE can be expensive without insurance. A basic travel insurance policy with medical coverage of USD 50,000-100,000 typically costs USD 5-15 per day and can save you thousands in unexpected medical bills.",
      },
      {
        question: "Which hospitals in the UAE accept international insurance?",
        answer:
          "Most major hospitals in Dubai and Abu Dhabi accept international insurance. Hospitals in Dubai Healthcare City, Cleveland Clinic Abu Dhabi, American Hospital Dubai, and Mediclinic are particularly experienced with international patients. Always call ahead to confirm your specific policy is accepted.",
      },
      {
        question: "How much does an ER visit cost for tourists in the UAE?",
        answer: `An emergency room visit in the UAE costs ${formatAed(500)} to ${formatAed(1500)} for the initial assessment, plus additional fees for any tests, imaging, or treatments. Government hospital ERs are generally cheaper than private hospital ERs. All hospitals must treat emergencies regardless of insurance status.`,
      },
      {
        question: "Can tourists buy medication over the counter in the UAE?",
        answer:
          "Many medications that require prescriptions in other countries are available over the counter at UAE pharmacies, including antibiotics and some pain medications. However, controlled substances, sleeping pills, and certain medications require a UAE prescription. Pharmacists are generally helpful and can recommend appropriate medications for common conditions.",
      },
      {
        question: "What should I do if I get sick as a tourist in the UAE?",
        answer:
          "For non-emergencies, visit a walk-in clinic or polyclinic — they are cheaper and faster than hospital ERs. For emergencies, go to the nearest hospital ER or call 998 (ambulance). Keep your travel insurance details handy. Most hospitals have English-speaking staff. The DHA app (Dubai) lists nearby facilities.",
      }
    );
  } else if (guide.slug === "for-expats") {
    baseFaqs.push(
      {
        question: "Is health insurance mandatory for expats in the UAE?",
        answer:
          "Yes. As of January 2025, health insurance is mandatory for all UAE residents across all seven emirates. Employers are required to provide health insurance for their employees. Dependents (spouse and children) must also be covered — employers may or may not include them on the employee plan.",
      },
      {
        question: "What does the basic mandatory insurance plan cover?",
        answer:
          "The basic mandatory plan (Essential Benefits Plan in Dubai, Basic Health Plan in Abu Dhabi) covers GP consultations, specialist referrals, diagnostic tests (blood work, X-ray, ultrasound), emergency care, and inpatient hospitalisation. It typically excludes dental, optical, maternity (unless added), and cosmetic procedures.",
      },
      {
        question: "How much is the typical co-pay for expats in the UAE?",
        answer:
          "Co-pays on the basic mandatory plan are typically 20% for outpatient visits (capped at AED 50-100 per visit) and 0% for inpatient admissions. Enhanced plans reduce co-pays to 10-15%. Premium plans may have 0% co-pay for both outpatient and inpatient services.",
      },
      {
        question: "Can expats choose any hospital or must they go in-network?",
        answer:
          "Most UAE insurance plans have a network of approved providers. Visiting in-network providers costs less (standard co-pay applies). Out-of-network visits are either not covered or covered at a higher co-pay (30-50%). Always check your plan's network list or call your insurer before booking.",
      },
      {
        question: "How do expats get specialist care in the UAE?",
        answer:
          "On basic plans, you typically need a GP referral to see a specialist. Enhanced and premium plans often allow direct specialist access. The specialist consultation co-pay is usually the same as the outpatient co-pay (10-20%). Pre-authorisation may be required for expensive tests like MRI or CT scans.",
      }
    );
  } else if (guide.slug === "budget-healthcare") {
    baseFaqs.push(
      {
        question: "Which is the cheapest city for healthcare in the UAE?",
        answer: `${cheapestCity.name} consistently offers the lowest healthcare prices in the UAE. Northern emirates like Ajman, Umm Al Quwain, and Fujairah also offer very affordable rates. These cities are 30-40% cheaper than Dubai for most medical procedures.`,
      },
      {
        question: "Are government hospitals cheaper than private hospitals?",
        answer:
          "Yes. Government hospitals (DHA facilities in Dubai, SEHA facilities in Abu Dhabi, MOHAP facilities in northern emirates) charge at or below the base tariff rate. Private hospitals charge 1.5-3x the base tariff. For common procedures, government hospitals can be 40-60% cheaper.",
      },
      {
        question: "How can I save money on blood tests in the UAE?",
        answer:
          "Use standalone diagnostic labs (Al Borg, Unilabs, Metropolis) instead of hospital labs — they are typically 40-60% cheaper. Book package deals that bundle multiple tests. Some labs offer home collection at a small surcharge, saving you time without a large cost increase.",
      },
      {
        question: "Is dental care expensive in the UAE?",
        answer: `Dental care costs vary widely. A dental cleaning costs ${formatAed(100)}-${formatAed(400)}, a filling ${formatAed(150)}-${formatAed(600)}, and a dental implant ${formatAed(3000)}-${formatAed(10000)}. For the most affordable dental care, visit clinics in Sharjah or Ajman rather than Dubai. Basic insurance plans typically do not cover dental.`,
      },
      {
        question: "Can I negotiate medical prices in the UAE?",
        answer:
          "While prices at government facilities are fixed, many private clinics and hospitals offer flexibility for self-pay patients. Ask for the cash-pay rate (often 10-20% lower than the insurance-billed rate), inquire about package deals, and compare prices across 2-3 providers before booking procedures over AED 1,000.",
      }
    );
  } else if (guide.slug === "premium-healthcare") {
    baseFaqs.push(
      {
        question: "What makes a hospital premium in the UAE?",
        answer:
          "Premium hospitals in the UAE offer private rooms, shorter wait times (often same-day for specialists), named consultant access, concierge/VIP services, international accreditation (JCI), multilingual staff, and state-of-the-art equipment. They typically use the highest DOH tariff multiplier (2.5-3x) and are located in premium areas like DHCC, Jumeirah, and Al Maryah Island.",
      },
      {
        question: "How much more does premium healthcare cost in the UAE?",
        answer:
          "Premium facilities typically charge 2-3x more than standard private hospitals and 3-5x more than government hospitals. For example, a specialist consultation costs AED 300-500 at a government hospital, AED 500-800 at a standard private hospital, and AED 800-1,500 at a premium facility.",
      },
      {
        question: "Is premium healthcare worth the extra cost?",
        answer:
          "It depends on your priorities. Premium facilities offer comfort, convenience, and access to top specialists. For routine procedures (blood tests, X-rays, GP visits), the medical outcome is the same regardless of facility tier. For complex surgeries and specialist care, premium facilities may offer more experienced surgeons and newer equipment.",
      },
      {
        question: "Which are the top premium hospitals in the UAE?",
        answer:
          "In Dubai: American Hospital, Mediclinic City Hospital (DHCC), Clemenceau Medical Center, King's College Hospital. In Abu Dhabi: Cleveland Clinic Abu Dhabi, Burjeel Medical City, Healthpoint, NMC Royal Hospital. These facilities have international accreditation and attract top specialists.",
      },
      {
        question: "Does premium insurance cover premium hospitals?",
        answer:
          "Yes. Premium insurance plans (annual premiums AED 15,000-40,000+) include premium hospitals in their network with 0-10% co-pay. Enhanced plans may also include some premium hospitals but with higher co-pays (15-20%). Basic mandatory plans generally do not include premium facilities in their network.",
      }
    );
  } else {
    // maternity-costs
    baseFaqs.push(
      {
        question: "How much does it cost to have a baby in the UAE?",
        answer: `The total cost of pregnancy and delivery in the UAE ranges from ${formatAed(15000)} to ${formatAed(50000)} depending on the facility type, delivery method, and complications. This includes prenatal care (${formatAed(5000)}-${formatAed(12000)}), delivery (${formatAed(8000)}-${formatAed(45000)}), and postnatal care.`,
      },
      {
        question: "Does insurance cover maternity in the UAE?",
        answer:
          "Most enhanced and premium insurance plans include maternity coverage, but with a mandatory waiting period of 10-12 months from policy start date. Coverage sub-limits range from AED 10,000 (basic maternity add-on) to AED 30,000-50,000 (premium plans). Normal delivery and C-section are covered when medically indicated. IVF is rarely covered.",
      },
      {
        question: "How much does a C-section cost in the UAE?",
        answer: `A C-section (caesarean delivery) costs ${formatAed(15000)} to ${formatAed(45000)} in the UAE. Government hospitals charge ${formatAed(15000)}-${formatAed(25000)}, standard private hospitals ${formatAed(20000)}-${formatAed(35000)}, and premium private hospitals ${formatAed(30000)}-${formatAed(45000)}. This includes the surgery, hospital stay (2-3 nights), and basic postnatal care.`,
      },
      {
        question: "What is included in a maternity package in the UAE?",
        answer:
          "Most hospitals offer maternity packages that bundle prenatal visits (monthly OB-GYN consultations), routine blood tests, 3-4 ultrasounds, delivery (normal or C-section), hospital stay, anaesthesia, and basic postnatal check-up. Packages are typically 15-25% cheaper than paying per visit. Ask about what is excluded (e.g., NICU, additional tests, epidural).",
      },
      {
        question: "Which are the best maternity hospitals in the UAE?",
        answer:
          "In Dubai: Latifa Hospital (government, affordable), Mediclinic City Hospital, American Hospital, Danat Al Emarat. In Abu Dhabi: Corniche Hospital (government, affordable), Burjeel Medical City, Healthpoint, Cleveland Clinic Abu Dhabi. The best choice depends on your budget, insurance coverage, and preferred delivery experience.",
      }
    );
  }

  return baseFaqs;
}

export default async function GuidePage({ params }: PageProps) {
  const { guide: slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const base = getBaseUrl();
  const Icon = ICON_MAP[guide.icon] || ShieldOff;

  // Resolve featured procedures
  const featuredProcs = guide.featuredProcedures
    .map((s) => getProcedureBySlug(s))
    .filter(Boolean) as typeof PROCEDURES;

  // Calculate cheapest / most expensive city for featured procedures
  const cityAverages = CITIES.map((city) => {
    const typicals = featuredProcs
      .map((p) => p.cityPricing[city.slug]?.typical)
      .filter(Boolean) as number[];
    const avg =
      typicals.length > 0
        ? Math.round(typicals.reduce((a, b) => a + b, 0) / typicals.length)
        : 0;
    return { city, avg };
  })
    .filter((c) => c.avg > 0)
    .sort((a, b) => a.avg - b.avg);

  const cheapestCity = cityAverages[0];
  const mostExpensiveCity = cityAverages[cityAverages.length - 1];

  const faqs = generateGuideFaqs(guide, featuredProcs);

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Pricing Guides", url: `${base}/pricing/guide` },
          { name: guide.name },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={medicalWebPageSchema(
          guide.name,
          guide.description,
          "2026-03-25"
        )}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Medical Procedure Costs", href: "/pricing" },
          { label: "Pricing Guides", href: "/pricing/guide" },
          { label: guide.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">{guide.name}</h1>
        </div>
        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">{guide.description}</p>
          <p className="text-sm text-muted mt-2">
            <strong className="text-dark">Who this is for:</strong>{" "}
            {guide.audience}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              value: featuredProcs.length.toString(),
              label: "Procedures covered",
            },
            { value: CITIES.length.toString(), label: "Cities compared" },
            { value: guide.tips.length.toString(), label: "Expert tips" },
            {
              value: cheapestCity
                ? cheapestCity.city.name
                : "N/A",
              label: "Cheapest city",
            },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Procedures Table */}
      <div className="section-header">
        <h2>Procedure Prices</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Prices shown are UAE-wide ranges. Click any procedure for city-specific
        pricing and insurance details.
      </p>
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-12 gap-2 p-3 bg-light-50 text-[10px] font-bold text-muted uppercase tracking-wider">
          <div className="col-span-4">Procedure</div>
          <div className="col-span-2 text-right">Min</div>
          <div className="col-span-2 text-right">Typical</div>
          <div className="col-span-2 text-right">Max</div>
          <div className="col-span-2 text-right">Insurance</div>
        </div>
        {featuredProcs.map((proc) => {
          const avgTypical = Math.round(
            Object.values(proc.cityPricing).reduce(
              (sum, cp) => sum + cp.typical,
              0
            ) / Object.keys(proc.cityPricing).length
          );

          const coverageColor =
            proc.insuranceCoverage === "typically-covered"
              ? "text-green-700 bg-green-50"
              : proc.insuranceCoverage === "partially-covered"
              ? "text-yellow-700 bg-yellow-50"
              : proc.insuranceCoverage === "rarely-covered"
              ? "text-orange-700 bg-orange-50"
              : "text-red-700 bg-red-50";

          const coverageLabel =
            proc.insuranceCoverage === "typically-covered"
              ? "Covered"
              : proc.insuranceCoverage === "partially-covered"
              ? "Partial"
              : proc.insuranceCoverage === "rarely-covered"
              ? "Rare"
              : "Not covered";

          return (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}`}
              className="grid grid-cols-12 gap-2 p-3 hover:bg-light-50 transition-colors group items-center"
            >
              <div className="col-span-12 sm:col-span-4">
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {proc.name}
                </h3>
                <p className="text-[10px] text-muted sm:hidden">
                  {formatAed(proc.priceRange.min)} –{" "}
                  {formatAed(proc.priceRange.max)}
                </p>
              </div>
              <div className="hidden sm:block col-span-2 text-right text-sm text-muted">
                {formatAed(proc.priceRange.min)}
              </div>
              <div className="hidden sm:block col-span-2 text-right text-sm font-bold text-dark">
                {formatAed(avgTypical)}
              </div>
              <div className="hidden sm:block col-span-2 text-right text-sm text-muted">
                {formatAed(proc.priceRange.max)}
              </div>
              <div className="hidden sm:flex col-span-2 justify-end">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}
                >
                  {coverageLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="section-header">
        <h2>Expert Tips</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="bg-light-50 border border-light-200 p-6 mb-10">
        <div className="space-y-4">
          {guide.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent text-white flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <p className="text-sm text-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City Comparison */}
      <div className="section-header">
        <h2>City Price Comparison</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <p className="text-xs text-muted mb-4">
        Average typical prices for this guide&apos;s featured procedures by city.
        Click a city for detailed pricing.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {cityAverages.map(({ city, avg }, idx) => (
          <Link
            key={city.slug}
            href={`/pricing/guide/${guide.slug}/${city.slug}`}
            className="border border-light-200 p-4 hover:border-accent transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                  {city.name}
                </h3>
              </div>
              {idx === 0 && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 text-green-700 bg-green-50">
                  Cheapest
                </span>
              )}
              {idx === cityAverages.length - 1 && cityAverages.length > 1 && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 text-red-700 bg-red-50">
                  Most expensive
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-dark">
              {formatAed(avg)}
            </p>
            <p className="text-[10px] text-muted">
              avg. typical price
            </p>
          </Link>
        ))}
      </div>

      {/* Insurance Relevance */}
      <div className="section-header">
        <h2>Insurance Considerations</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="bg-light-50 border border-light-200 p-6 mb-10">
        <div className="answer-block space-y-3" data-answer-block="true">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              <strong className="text-dark">Mandatory since Jan 2025:</strong>{" "}
              Health insurance is mandatory for all UAE residents. Employers must
              provide coverage. If you do not have insurance, you may face fines
              and will pay full self-pay rates at all facilities.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              <strong className="text-dark">Covered procedures:</strong> Of the{" "}
              {featuredProcs.length} procedures in this guide,{" "}
              {
                featuredProcs.filter(
                  (p) => p.insuranceCoverage === "typically-covered"
                ).length
              }{" "}
              are typically covered by insurance,{" "}
              {
                featuredProcs.filter(
                  (p) => p.insuranceCoverage === "partially-covered"
                ).length
              }{" "}
              are partially covered, and{" "}
              {
                featuredProcs.filter(
                  (p) =>
                    p.insuranceCoverage === "not-covered" ||
                    p.insuranceCoverage === "rarely-covered"
                ).length
              }{" "}
              are rarely or not covered.
            </p>
          </div>
          {cheapestCity && mostExpensiveCity && (
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted">
                <strong className="text-dark">Price gap:</strong> The same set
                of procedures costs an average of{" "}
                {formatAed(cheapestCity.avg)} in {cheapestCity.city.name}{" "}
                versus {formatAed(mostExpensiveCity.avg)} in{" "}
                {mostExpensiveCity.city.name} — a difference of{" "}
                {Math.round(
                  ((mostExpensiveCity.avg - cheapestCity.avg) /
                    cheapestCity.avg) *
                    100
                )}
                %.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other guides */}
      <div className="section-header">
        <h2>Other Pricing Guides</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {PRICING_GUIDES.filter((g) => g.slug !== guide.slug).map((g) => {
          const OtherIcon = ICON_MAP[g.icon] || ShieldOff;
          return (
            <Link
              key={g.slug}
              href={`/pricing/guide/${g.slug}`}
              className="border border-light-200 p-4 hover:border-accent transition-colors group flex items-center gap-3"
            >
              <OtherIcon className="w-5 h-5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors truncate">
                  {g.name}
                </h3>
                <p className="text-[10px] text-muted truncate">
                  {g.featuredProcedures.length} procedures
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${guide.name} — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> All prices shown are indicative ranges
          based on the DOH Mandatory Tariff (Shafafiya) methodology, DHA DRG
          parameters, and market-observed data as of March 2026. Actual costs
          vary by facility, doctor, clinical complexity, and insurance plan.
          This tool is for informational purposes only and does not constitute
          medical or financial advice. Always obtain a personalised quote from
          the healthcare provider before proceeding with any procedure.
        </p>
      </div>
    </div>
  );
}
