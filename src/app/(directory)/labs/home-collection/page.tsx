import { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  MapPin,
  Award,
  CheckCircle,
  ArrowRight,
  Smartphone,
  UserCheck,
  TestTube,
  FileText,
  Shield,
  Wallet,
  XCircle,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { LabCard } from "@/components/labs/LabCard";
import {
  LAB_PROFILES,
  HEALTH_PACKAGES,
  getLabStats,
  getPricesForLab,
  getPackagesForLab,
  getPopularTests,
  formatPrice,
} from "@/lib/labs";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  const stats = getLabStats();
  const freeCount = LAB_PROFILES.filter(
    (l) => l.homeCollection && l.homeCollectionFee === 0
  ).length;
  return {
    title: `At-Home Lab Test Collection UAE — Compare ${stats.labsWithHomeCollection} Services`,
    description: `Compare at-home blood test collection services across the UAE. ${freeCount} labs offer free home collection. DHA-licensed nurses visit your location in Dubai, Abu Dhabi & Sharjah. Results within 24h. From AED 99.`,
    alternates: { canonical: `${base}/labs/home-collection` },
    openGraph: {
      title: "At-Home Lab Test Collection in the UAE — Compare Services & Prices",
      description: `${stats.labsWithHomeCollection} labs offer home blood test collection across the UAE. ${freeCount} free. Book online, nurse visits your home, digital results in 24h.`,
      url: `${base}/labs/home-collection`,
      type: "website",
    },
  };
}

// City display helpers
const CITY_LABELS: Record<string, string> = {
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  ajman: "Ajman",
  "ras-al-khaimah": "Ras Al Khaimah",
  fujairah: "Fujairah",
  "al-ain": "Al Ain",
  "umm-al-quwain": "Umm Al Quwain",
};

function cityLabel(slug: string): string {
  return CITY_LABELS[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HomeCollectionPage() {
  const base = getBaseUrl();
  const stats = getLabStats();
  const homeCollectionLabs = LAB_PROFILES.filter((l) => l.homeCollection);
  const freeHomeLabs = homeCollectionLabs.filter((l) => l.homeCollectionFee === 0);
  const allCitiesWithHome = Array.from(
    new Set(homeCollectionLabs.flatMap((l) => l.cities))
  ).sort();
  const popularTests = getPopularTests();

  // Build per-city lab lists
  const labsByCity: Record<string, typeof homeCollectionLabs> = {};
  for (const city of allCitiesWithHome) {
    labsByCity[city] = homeCollectionLabs.filter((l) => l.cities.includes(city));
  }

  const faqs = [
    {
      question: "How much does home blood test collection cost in the UAE?",
      answer:
        "Home collection fees vary by provider. Labs like Thumbay, Medsol Diagnostics, Alpha Medical, PureLab, DarDoc, Healthchecks360, and ServiceMarket offer completely free home collection — you pay only for the tests. Al Borg Diagnostics charges AED 50 per visit, STAR Metropolis charges AED 50, MenaLabs charges AED 50, NRL charges AED 75, and Unilabs charges AED 100. The individual test prices are similar to walk-in prices. A basic panel (CBC, glucose, lipid profile) collected at home starts from AED 99 at DarDoc.",
    },
    {
      question: "How long does it take to get a home blood test nurse in Dubai?",
      answer:
        "Most home collection services in Dubai aim to send a DHA-licensed nurse within 30 to 90 minutes of booking, though next-day slots are also available. DarDoc and ServiceMarket are generally the fastest, offering same-day and urgent appointments. For a guaranteed early-morning fasting draw (which many tests require), it is best to book the night before and schedule a 7-8 AM slot. Operating hours are typically 7 AM to 10 or 11 PM daily across Dubai and Abu Dhabi.",
    },
    {
      question: "Is home blood test collection safe in the UAE?",
      answer:
        "Yes. All home collection services operating in the UAE must use DHA-licensed (Dubai) or DOH-licensed (Abu Dhabi) phlebotomists and nurses. They use sterile single-use lancets and vacutainer systems, follow standard infection control protocols, and transport samples in temperature-controlled containers to partner laboratories. The labs processing the samples are the same accredited facilities used for walk-in testing. Results are delivered via secure app or email, not paper.",
    },
    {
      question: "Does insurance cover home blood test collection in the UAE?",
      answer:
        "Insurance coverage for home collection varies. Many UAE health insurance plans (Daman, Thiqa, AXA, Cigna, MSH) cover the laboratory tests themselves but treat the home collection fee as an out-of-pocket convenience charge. Some corporate insurance plans with enhanced benefits do cover home collection fees. Check your policy's home healthcare or lab benefit rider. DarDoc, Healthchecks360, and ServiceMarket work with select insurers — contact them to verify your specific plan before booking.",
    },
    {
      question: "What tests can be done with home blood collection in the UAE?",
      answer:
        "The vast majority of routine blood tests can be collected at home: CBC, lipid profile, fasting glucose, HbA1c, liver function, kidney function, thyroid panel (TSH, T3, T4), Vitamin D, Vitamin B12, iron studies, hormones (testosterone, estradiol, FSH, AMH), tumor markers (PSA, CA-125, CEA), HIV, Hepatitis B, syphilis, and urine tests. Tests that cannot be done at home include imaging (ultrasound, X-ray, MRI), biopsies, and some molecular diagnostics requiring immediate on-site processing.",
    },
    {
      question: "How should I prepare for a home blood collection visit?",
      answer:
        "Preparation depends on the tests ordered. If your tests require fasting (lipid profile, fasting glucose, HbA1c, insulin), fast for 8-12 hours beforehand — water and medications are fine unless your doctor advises otherwise. Drink plenty of water before the visit as hydration makes veins easier to access. Wear clothing with sleeves that can be rolled up easily. Have your Emirates ID or passport ready. Ensure someone is home during the appointment window. The nurse will bring all equipment — you do not need to prepare anything else.",
    },
  ];

  const breadcrumbs = [
    { name: "UAE", url: base },
    { name: "Lab Tests", url: `${base}/labs` },
    { name: "Home Collection" },
  ];

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "At-Home Lab Test Collection in the UAE",
    description: `Compare ${homeCollectionLabs.length} home blood test collection services across the UAE. DHA-licensed nurses, free collection at ${freeHomeLabs.length} labs, results within 24 hours.`,
    url: `${base}/labs/home-collection`,
    numberOfItems: homeCollectionLabs.length,
    itemListElement: homeCollectionLabs.map((lab, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalClinic",
        name: lab.name,
        url: `${base}/labs/${lab.slug}`,
        description: lab.description,
      },
    })),
  };

  return (
    <div className="container-tc py-8">
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={collectionPageSchema} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Home Collection" },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Home className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-dark">
            At-Home Lab Test Collection in the UAE — Compare Services &amp; Prices
          </h1>
        </div>

        <div className="answer-block mb-6" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            Home blood test collection is widely available across the UAE. A DHA or
            DOH-licensed phlebotomist visits your home, office, or hotel, draws the
            sample using sterile equipment, and delivers results digitally within
            24 hours. Of the {stats.totalLabs} diagnostic labs tracked by this
            directory, {homeCollectionLabs.length} offer home collection services
            — {freeHomeLabs.length} of which charge nothing for the visit itself.
            Coverage spans {allCitiesWithHome.length} cities including Dubai, Abu
            Dhabi, Sharjah, Ajman, and the Northern Emirates.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: homeCollectionLabs.length.toString(), label: "Labs with home collection" },
            { value: freeHomeLabs.length.toString(), label: "Free home collection" },
            { value: allCitiesWithHome.length.toString(), label: "Cities covered" },
            { value: "24h", label: "Typical result turnaround" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-light-50 p-4 text-center border border-light-200">
              <p className="text-2xl font-bold text-accent">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Labs with home collection */}
      <div className="section-header">
        <h2>Labs With Home Collection</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted">
          The table below compares all {homeCollectionLabs.length} diagnostic labs
          and home-service platforms that offer at-home sample collection in the UAE.
          Home-service providers like DarDoc and Healthchecks360 are 100%
          home-based and have no walk-in locations. Traditional chains like Al Borg,
          Thumbay, and Medsol offer home collection as an add-on to their branch
          network.
        </p>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-xs border border-light-200">
          <thead>
            <tr className="bg-light-50">
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Lab</th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Home Collection Fee</th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Turnaround</th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Accreditations</th>
              <th className="text-left p-3 font-bold text-dark border-b border-light-200">Cities</th>
            </tr>
          </thead>
          <tbody>
            {homeCollectionLabs
              .sort((a, b) => a.homeCollectionFee - b.homeCollectionFee)
              .map((lab, i) => (
                <tr key={lab.slug} className={i % 2 === 0 ? "bg-white" : "bg-light-50"}>
                  <td className="p-3 border-b border-light-200">
                    <Link
                      href={`/labs/${lab.slug}`}
                      className="font-bold text-dark hover:text-accent transition-colors"
                    >
                      {lab.name}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">{lab.type === "home-service" ? "Home-service platform" : "Lab chain"}</div>
                  </td>
                  <td className="p-3 border-b border-light-200">
                    {lab.homeCollectionFee === 0 ? (
                      <span className="font-bold text-accent">Free</span>
                    ) : (
                      <span className="font-medium text-dark">AED {lab.homeCollectionFee}</span>
                    )}
                  </td>
                  <td className="p-3 border-b border-light-200 text-muted">{lab.turnaroundHours}h</td>
                  <td className="p-3 border-b border-light-200 text-muted">
                    {lab.accreditations.slice(0, 3).join(", ")}
                  </td>
                  <td className="p-3 border-b border-light-200">
                    <div className="flex flex-wrap gap-1">
                      {lab.cities.slice(0, 3).map((c) => (
                        <span key={c} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5">
                          {cityLabel(c)}
                        </span>
                      ))}
                      {lab.cities.length > 3 && (
                        <span className="text-[10px] text-muted">+{lab.cities.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Lab Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {homeCollectionLabs.map((lab) => {
          const prices = getPricesForLab(lab.slug);
          const packages = getPackagesForLab(lab.slug);
          const cheapest = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
          return (
            <LabCard
              key={lab.slug}
              lab={lab}
              testCount={prices.length}
              packageCount={packages.length}
              cheapestFrom={cheapest}
            />
          );
        })}
      </div>

      {/* How home lab testing works */}
      <div className="section-header">
        <h2>How Home Lab Testing Works in the UAE</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Home blood test collection in the UAE follows a tightly regulated process.
          Under DHA and DOH rules, all phlebotomists operating in patients&apos; homes
          must hold a current UAE health authority license. Samples are collected
          using the same sterile vacutainer systems used in clinical labs, transported
          in validated cold-chain containers, and processed in the same DHA or
          DOH-accredited laboratories used for walk-in patients. The result is
          clinically equivalent to a lab visit — the only difference is where the
          needle enters your arm.
        </p>
      </div>

      {/* Step-by-step */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          {
            icon: Smartphone,
            step: "1",
            title: "Book Online or via App",
            body: "Select your tests on the lab's website or app (DarDoc, ServiceMarket, Healthchecks360) or call the lab directly. Choose a time slot — most services run 7 AM to 10 PM daily. For fasting tests, book a morning slot and stop eating 8-12 hours before.",
          },
          {
            icon: UserCheck,
            step: "2",
            title: "Licensed Nurse Arrives",
            body: "A DHA or DOH-licensed phlebotomist arrives at your home, office, or hotel at the booked time. They carry all equipment: sterile needles, vacutainers, gloves, antiseptic wipes, sample labels, and a cold-chain transport bag. ID verification may be required.",
          },
          {
            icon: TestTube,
            step: "3",
            title: "Sample Collected",
            body: "The nurse draws blood (and urine if required) using standard venepuncture technique. The visit typically takes 10-15 minutes. Samples are sealed, labelled, and placed in temperature-controlled transport containers immediately to preserve integrity.",
          },
          {
            icon: FileText,
            step: "4",
            title: "Digital Results in 24h",
            body: "Samples reach the processing lab within hours. Routine tests (CBC, glucose, liver, kidney) are typically ready within 6-24 hours. Results are delivered via secure app notification, email, or WhatsApp PDF. Most providers allow you to share results directly with your doctor.",
          },
        ].map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="border border-light-200 p-4 bg-light-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step}
              </div>
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold text-dark text-sm mb-2">{title}</h3>
            <p className="text-xs text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* Tests available for home collection */}
      <div className="section-header">
        <h2>Tests Available for Home Collection</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          Home collection covers the full range of blood tests. The prices below reflect
          what you pay at home-collection-capable labs — individual test costs are
          similar to walk-in prices, with the only addition being the home visit fee
          (free at {freeHomeLabs.length} labs). Click any test for a full price
          comparison across all labs.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {popularTests.map((test) => (
          <Link
            key={test.slug}
            href={`/labs/test/${test.slug}`}
            className="flex items-center justify-between gap-4 p-4 border border-light-200 hover:border-accent transition-colors group"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-dark group-hover:text-accent transition-colors">
                {test.shortName}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {test.fastingRequired ? "Fasting required · " : "No fasting · "}
                {test.turnaroundHours}h turnaround
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {test.priceRange && (
                <>
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(test.priceRange.min)}
                  </p>
                  {test.priceRange.min !== test.priceRange.max && (
                    <p className="text-[10px] text-muted">
                      – {formatPrice(test.priceRange.max)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted">{test.priceRange.labCount} labs</p>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Home collection packages from home-capable labs */}
      <div className="section-header">
        <h2>Home Collection Packages</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          Several labs offer bundled packages specifically designed for home
          collection, combining multiple tests at a package price with the visit
          fee included. DarDoc&apos;s at-home packages are the most popular — the
          basic panel covers 5 core tests from AED 199 with home collection
          included in the price.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {HEALTH_PACKAGES.filter((pkg) => {
          const lab = homeCollectionLabs.find((l) => l.slug === pkg.labSlug);
          return !!lab;
        })
          .slice(0, 6)
          .map((pkg) => {
            const lab = LAB_PROFILES.find((l) => l.slug === pkg.labSlug)!;
            return (
              <div key={pkg.id} className="border border-light-200 p-4 hover:border-accent transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-muted uppercase tracking-wide font-bold">
                    {lab.name}
                  </span>
                  {lab.homeCollectionFee === 0 && (
                    <span className="text-[9px] bg-accent-muted text-accent-dark px-1.5 py-0.5 font-bold">
                      Free collection
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-dark text-sm mb-1">{pkg.name}</h3>
                <p className="text-[11px] text-muted mb-3">{pkg.targetAudience}</p>
                <p className="text-xl font-bold text-dark mb-1">{formatPrice(pkg.price)}</p>
                <p className="text-[11px] text-muted mb-3">{pkg.biomarkerCount} biomarkers</p>
                <div className="space-y-1">
                  {pkg.includes.slice(0, 4).map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-dark">
                      <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-light-200">
                  <Link
                    href={`/labs/${lab.slug}`}
                    className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors"
                  >
                    Book via {lab.name} →
                  </Link>
                </div>
              </div>
            );
          })}
      </div>

      {/* Home vs walk-in comparison */}
      <div className="section-header">
        <h2>Home Collection vs Walk-In — Which Is Better?</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-6" data-answer-block="true">
        <p className="text-sm text-muted leading-relaxed mb-4">
          Both home collection and walk-in labs use the same DHA-licensed processing
          facilities and produce clinically equivalent results. The choice comes down
          to convenience, timing, and cost. Here is a direct comparison:
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {/* Home collection pros/cons */}
        <div className="border border-light-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-dark">Home Collection</h3>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Advantages</p>
            {[
              "No travel, parking, or waiting room",
              "Ideal for elderly, post-surgery, mobility-limited patients",
              "Useful for young children who find clinics distressing",
              "Fasting draw at your convenience — no rush to the lab",
              "Perfect for busy professionals (home, office, or hotel)",
              "Free at 7 UAE labs including Thumbay, Medsol, DarDoc",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-dark">
                <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Limitations</p>
            {[
              "Some labs charge AED 50-100 home visit fee",
              "Slightly higher per-test prices at home-service platforms",
              "Cannot do imaging (X-ray, ultrasound) at home",
              "Waiting for appointment window (30-90 min)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-muted">
                <XCircle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Walk-in pros/cons */}
        <div className="border border-light-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-dark">Walk-In Lab</h3>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Advantages</p>
            {[
              "Typically lowest per-test prices",
              "Immediate service — no advance booking needed",
              "Results can sometimes be same-day collected",
              "Can add tests on the spot after consultation",
              "Imaging and specialised tests available on-site",
              "No prescription needed at most standalone labs",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-dark">
                <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Limitations</p>
            {[
              "Travel, traffic, and parking in Dubai/Abu Dhabi",
              "Waiting room time, especially in busy hours",
              "Must reach the lab while still fasting for morning draws",
              "Less suitable for patients with limited mobility",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-muted">
                <XCircle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation box */}
      <div className="bg-light-50 border border-light-200 p-5 mb-12">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              When home collection is the clear winner
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Choose home collection if you need fasting tests and struggle to
              reach a lab by 9 AM without eating, if you are managing a chronic
              condition requiring frequent monitoring, if you have children who
              need routine bloods, or if mobility, age, or post-surgical recovery
              makes a lab visit difficult. With {freeHomeLabs.length} labs offering
              free home collection in the UAE, there is no financial reason to
              choose a walk-in over staying home for routine blood work.
            </p>
          </div>
        </div>
      </div>

      {/* Home collection by city */}
      <div className="section-header">
        <h2>Home Collection by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="answer-block mb-4" data-answer-block="true">
        <p className="text-xs text-muted mb-4">
          Home collection coverage varies by emirate. Dubai has the most providers
          due to its population density and regulatory maturity under DHA. Abu Dhabi
          is well-served by PureLab, NRL, MenaLabs, DarDoc, and ServiceMarket. The
          Northern Emirates (Sharjah, Ajman, Fujairah) are covered primarily by
          Thumbay, Medsol, and Healthchecks360.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {allCitiesWithHome.map((city) => {
          const cityLabs = labsByCity[city];
          const freeLabs = cityLabs.filter((l) => l.homeCollectionFee === 0);
          return (
            <Link
              key={city}
              href={`/labs/city/${city}`}
              className="border border-light-200 p-4 hover:border-accent transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-dark group-hover:text-accent transition-colors text-sm">
                  {cityLabel(city)}
                </h3>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-dark">
                  <Home className="w-3 h-3 text-accent" />
                  {cityLabs.length} labs with home collection
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark">
                  <Wallet className="w-3 h-3 text-accent" />
                  {freeLabs.length} offer free collection
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {cityLabs.slice(0, 3).map((l) => (
                  <span key={l.slug} className="text-[10px] bg-accent-muted text-accent-dark px-1.5 py-0.5">
                    {l.name.split(" ")[0]}
                  </span>
                ))}
                {cityLabs.length > 3 && (
                  <span className="text-[10px] text-muted">+{cityLabs.length - 3} more</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quality assurance note */}
      <div className="bg-light-50 border border-light-200 p-5 mb-12">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-dark mb-2">
              Regulatory framework for home collection in the UAE
            </p>
            <p className="text-xs text-muted leading-relaxed">
              The Dubai Health Authority (DHA) and Abu Dhabi&apos;s Department of Health
              (DOH) license both the healthcare professionals collecting samples and
              the laboratories processing them. Home collection nurses must hold
              a DHA/DOH nursing or phlebotomy license. Sample transport must comply
              with IATA P650 standards for biological substances. Results are
              subject to the same quality control and proficiency testing
              requirements as walk-in lab results. The Ministry of Health and
              Prevention (MOHAP) governs the Northern Emirates. All labs listed
              here operate under one or more of these regulatory frameworks.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection
        faqs={faqs}
        title="Home Blood Test Collection UAE — Frequently Asked Questions"
      />

      {/* Browse more */}
      <div className="mt-8 border border-light-200 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-dark">Compare all UAE lab test prices</p>
          <p className="text-xs text-muted mt-0.5">
            {stats.totalTests} tests · {stats.totalLabs} labs · walk-in and home collection
          </p>
        </div>
        <Link
          href="/labs"
          className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors flex-shrink-0"
        >
          View all labs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Home collection fee information is based on
          publicly available pricing from lab websites and aggregator platforms
          (2024–2025). Actual fees may vary by location, time of day, insurance
          coverage, and promotional offers. Always confirm pricing and availability
          directly with the provider before booking. This directory is for
          informational purposes only and does not constitute medical advice.
          Consult a physician before ordering diagnostic tests. All listed providers
          are licensed by DHA, DOH, or MOHAP. Data last verified March 2026.
        </p>
      </div>
    </div>
  );
}
