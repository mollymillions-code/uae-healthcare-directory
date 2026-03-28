import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  TrendingDown,
  Award,
  Home,
  Zap,
  ArrowRight,
  Package,
  CheckCircle,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import {
  getAllLabLists,
  getLabListBySlug,
  getLabListItems,
  type LabList,
  type LabListItem,
} from "@/lib/labs-lists";
import { getLabTest, formatPrice } from "@/lib/labs";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, faqPageSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

// ─── Static Params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllLabLists().map((list) => ({ slug: list.slug }));
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const list = getLabListBySlug(params.slug);
  if (!list) return { title: "Not Found" };

  const base = getBaseUrl();
  return {
    title: `${list.title} | UAE Open Healthcare Directory`,
    description: list.metaDescription,
    alternates: { canonical: `${base}/labs/lists/${list.slug}` },
    openGraph: {
      title: list.title,
      description: list.metaDescription,
      url: `${base}/labs/lists/${list.slug}`,
      type: "website",
    },
  };
}

// ─── Icon selector by list type ───────────────────────────────────────────────

function ListTypeIcon({ listType }: { listType: LabList["listType"] }) {
  const cls = "w-8 h-8 text-[#006828]";
  switch (listType) {
    case "cheapest-labs":
    case "cheapest-test":
      return <TrendingDown className={cls} />;
    case "packages":
      return <Package className={cls} />;
    case "lab-type":
      return <Award className={cls} />;
    case "feature":
      return <Zap className={cls} />;
    default:
      return <Trophy className={cls} />;
  }
}

// ─── Answer block ──────────────────────────────────────────────────────────────

function buildAnswerBlock(list: LabList, items: LabListItem[]): string {
  if (items.length === 0) return "";

  const top = items[0];
  const cityName = list.citySlug
    ? CITIES.find((c) => c.slug === list.citySlug)?.name ?? list.citySlug
    : "the UAE";
  const testName = list.testSlug
    ? getLabTest(list.testSlug)?.shortName ?? list.testSlug
    : null;

  switch (list.listType) {
    case "cheapest-labs": {
      const topPrice = top.price != null ? formatPrice(top.price) : null;
      const prices = items.filter((i) => i.price != null).map((i) => i.price as number);
      const maxPrice = prices.length > 1 ? Math.max(...prices) : null;
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const savingsPct =
        maxPrice && minPrice && maxPrice > minPrice
          ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
          : null;

      let answer = `According to the UAE Open Healthcare Directory, the cheapest diagnostic lab in ${cityName} is ${top.name}`;
      if (topPrice) answer += ` with tests starting from ${topPrice}`;
      answer += `. Among ${items.length} labs compared, `;
      if (savingsPct) {
        answer += `prices vary by up to ${savingsPct}% — choosing the right lab can save you hundreds of dirhams per year on routine tests. `;
      } else {
        answer += `there are meaningful price differences across labs. `;
      }
      answer += `All labs listed are licensed by DHA, DOH, or MOHAP. Prices verified March 2026.`;
      return answer;
    }

    case "cheapest-test": {
      if (!testName) break;
      const topPrice = top.price != null ? formatPrice(top.price) : null;
      const prices = items.filter((i) => i.price != null).map((i) => i.price as number);
      const maxPrice = prices.length > 1 ? Math.max(...prices) : null;
      const expensiveLab = maxPrice
        ? items.find((i) => i.price === maxPrice)?.name
        : null;
      const savings = maxPrice && top.price != null ? maxPrice - top.price : null;

      let answer = `The cheapest ${testName} in ${cityName}`;
      if (topPrice) answer += ` costs ${topPrice} at ${top.name}`;
      if (expensiveLab && maxPrice) {
        answer += `, compared to ${formatPrice(maxPrice)} at ${expensiveLab}`;
      }
      answer += `. By comparing ${items.length} labs`;
      if (savings && savings > 0) {
        answer += `, you can save up to AED ${savings}`;
      }
      answer += ` on a single test. Prices verified March 2026 — always confirm with the lab directly before booking.`;
      return answer;
    }

    case "feature": {
      const feature = list.feature ?? "this service";
      let answer = `There are ${items.length} diagnostic labs in ${cityName} offering ${feature}. `;
      answer += `${top.name} leads this list`;
      if (top.subtitle) answer += ` — ${top.subtitle}`;
      answer += `. All listings are licensed UAE diagnostic facilities. Data sourced from official registers, last verified March 2026.`;
      return answer;
    }

    case "packages": {
      const topPrice = top.price != null ? formatPrice(top.price) : null;
      let answer = `Health check packages in ${cityName} start from ${topPrice ?? "AED 99"} at ${top.name}. `;
      answer += `Bundling multiple tests into a package typically saves 30–50% versus ordering tests individually. `;
      answer += `${items.length} packages are listed below, ranked by value. Prices verified March 2026.`;
      return answer;
    }

    case "lab-type": {
      let answer = `${top.name} ranks as the top lab chain in ${cityName} by network size, accreditation, and test range. `;
      answer += `The ${items.length} chains listed below collectively cover all major cities across the UAE, with combined branch counts in the hundreds. `;
      answer += `All hold DHA, DOH, and/or MOHAP licences. Rankings updated March 2026.`;
      return answer;
    }

    default:
      break;
  }

  // Fallback generic answer
  return `The UAE Open Healthcare Directory has compiled this ranking of ${items.length} options based on publicly available data. ${top.name} ranks #1. All listings are UAE-licensed facilities. Data verified March 2026.`;
}

// ─── "Why This Matters" section ────────────────────────────────────────────────

function WhyItMattersSection({ list }: { list: LabList }) {
  const cityName = list.citySlug
    ? CITIES.find((c) => c.slug === list.citySlug)?.name ?? list.citySlug
    : "the UAE";

  const content: { heading: string; body: string } = (() => {
    switch (list.listType) {
      case "cheapest-labs":
        return {
          heading: "Why Lab Price Comparison Matters",
          body: `A routine blood test in ${cityName} can cost anywhere from AED 50 at a neighbourhood lab to AED 250 at a hospital-based facility — for the identical test. Over the course of a year, a family tracking cholesterol, diabetes markers, and vitamin D levels could easily overpay by AED 1,000–2,000 without comparing prices first. All major UAE labs — standalone chains, boutique diagnostics, and home-service providers — are licensed under DHA, DOH, or MOHAP and must meet the same quality and accuracy standards. The price difference is driven by location, brand premium, and overhead, not by better results.`,
        };
      case "cheapest-test": {
        const testName = list.testSlug
          ? getLabTest(list.testSlug)?.shortName ?? "this test"
          : "this test";
        const testObj = list.testSlug ? getLabTest(list.testSlug) : null;
        return {
          heading: `Why It Pays to Compare ${testName} Prices`,
          body: `${testName} prices vary significantly across UAE labs even though the methodology and equipment are largely standardised. ${testObj?.fastingRequired ? `Note: fasting for 9–12 hours is required before this test. ` : ""}The price gap between the cheapest and most expensive lab for the same test regularly exceeds AED 100. All accredited UAE labs use automated analysers calibrated to international standards, so accuracy is consistent regardless of price. The difference is lab overhead, location, and brand — not quality.`,
        };
      }
      case "feature":
        switch (list.feature) {
          case "home-collection":
          case "free-home-collection":
            return {
              heading: "Why Home Blood Collection Matters",
              body: `Home blood collection saves 1–2 hours versus visiting a lab, eliminates fasting-while-driving risks, and is ideal for elderly patients, young children, and people with mobility limitations. In ${cityName}, DHA-licensed phlebotomists can reach most locations within 30–60 minutes. Many services now offer same-day results. The fee varies from free to AED 100 depending on the lab — with no compromise on accuracy, since the sample is processed at the same CLIA/CAP-accredited lab used for walk-in patients.`,
            };
          case "cap-accredited":
            return {
              heading: "Why CAP Accreditation Matters",
              body: `CAP (College of American Pathologists) accreditation is the gold standard in lab quality — stricter than DHA/DOH licensing alone. CAP-accredited labs undergo unannounced inspections, use external proficiency testing programmes, and must document every step of the test process. In practical terms, CAP accreditation means results are reproducible, calibration is verified by an independent body, and the lab meets the same standards as top US hospital labs. For critical tests like HbA1c, cardiac markers, or hormone panels, accreditation quality matters.`,
            };
          default:
            return {
              heading: "Why This Feature Matters",
              body: `Not all diagnostic labs in the UAE offer the same range of services. The labs in this list are specifically selected because they offer ${list.feature ?? "this capability"} — which many patients require but not all labs provide. Verifying this feature before booking saves time and ensures your test is processed correctly.`,
            };
        }
      case "packages":
        return {
          heading: "Package vs Individual Tests — Is It Worth It?",
          body: `Ordering the same tests as part of a health package typically costs 30–50% less than booking them individually. A basic panel (CBC + lipid profile + glucose + liver + kidney function) ordered individually across most UAE labs costs AED 350–500. The same tests bundled into a package run AED 99–199. For annual health monitoring, packages offer superior value. The caveat: packages include specific tests you may not need, and some tests you do need may not be included — compare package contents carefully before choosing.`,
        };
      case "lab-type":
        return {
          heading: "Why Lab Chain Choice Matters",
          body: `Lab chains in ${cityName} vary significantly in coverage, test menus, accreditation, and turnaround times. Chains with more branches offer convenience — you can collect results from any branch. Chains affiliated with international networks (Quest Diagnostics, Sonic Healthcare) run additional external QA programmes. For routine testing, any licensed chain is suitable. For complex or specialised tests, CAP-accredited chains with direct international affiliations are preferable. Home collection availability and fees also vary considerably between chains.`,
        };
      default:
        return {
          heading: "Why This Ranking Matters",
          body: `Choosing the right diagnostic lab in the UAE can significantly affect your healthcare costs, convenience, and even result turnaround time. This ranking is based on publicly available pricing, accreditation status, and service features — giving you the information to make an informed choice. All labs listed hold valid UAE healthcare authority licences.`,
        };
    }
  })();

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{content.heading}</h2>
      </div>
      <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
        <p className="font-['Geist',sans-serif] text-sm text-black/40 leading-relaxed">{content.body}</p>
      </div>
    </section>
  );
}

// ─── Related lists ─────────────────────────────────────────────────────────────

function getRelatedLists(currentList: LabList): LabList[] {
  const all = getAllLabLists();

  return all
    .filter((l) => l.slug !== currentList.slug)
    .map((l) => {
      let score = 0;
      // Same list type different city → high relevance
      if (l.listType === currentList.listType && l.citySlug !== currentList.citySlug) score += 3;
      // Same city different list type → medium relevance
      if (l.citySlug === currentList.citySlug && l.listType !== currentList.listType) score += 2;
      // Same test slug different city → high relevance for cheapest-test
      if (
        currentList.listType === "cheapest-test" &&
        l.testSlug === currentList.testSlug &&
        l.citySlug !== currentList.citySlug
      )
        score += 4;
      // Same city same test different type → medium relevance
      if (
        l.citySlug === currentList.citySlug &&
        l.testSlug &&
        currentList.testSlug &&
        l.testSlug !== currentList.testSlug
      )
        score += 2;
      // Same category → medium relevance
      if (
        l.categorySlug &&
        currentList.categorySlug &&
        l.categorySlug === currentList.categorySlug
      )
        score += 2;
      return { list: l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.list);
}

// ─── FAQ builder ──────────────────────────────────────────────────────────────

function buildFaqs(
  list: LabList,
  items: LabListItem[]
): { question: string; answer: string }[] {
  const top = items[0];
  const second = items[1];
  const cityName = list.citySlug
    ? CITIES.find((c) => c.slug === list.citySlug)?.name ?? list.citySlug
    : "the UAE";
  const testObj = list.testSlug ? getLabTest(list.testSlug) : null;
  const testName = testObj?.shortName ?? list.testSlug ?? "this test";

  switch (list.listType) {
    case "cheapest-labs":
      return [
        {
          question: `Which is the cheapest diagnostic lab in ${cityName}?`,
          answer: top
            ? `According to the UAE Open Healthcare Directory, ${top.name} is the cheapest diagnostic lab in ${cityName}${top.price != null ? ` with tests starting from ${formatPrice(top.price)}` : ""}. ${top.subtitle ? top.subtitle + "." : ""} Always confirm current pricing directly with the lab before booking.`
            : `Compare labs using the ranking above to find the cheapest option in ${cityName}.`,
        },
        {
          question: `How much does a blood test cost at ${top?.name ?? "the cheapest lab"}?`,
          answer: top
            ? `${top.name} offers tests starting from ${top.price != null ? formatPrice(top.price) : "competitive prices"}. ${top.description ?? ""} Prices may vary by test type and branch location. Contact the lab directly for current pricing.`
            : `Pricing varies by test. Use the comparison table above for current rates.`,
        },
        {
          question: `Is ${top?.name ?? "the cheapest lab"} accredited?`,
          answer: `All labs listed in the UAE Open Healthcare Directory hold valid licences issued by UAE health authorities (DHA, DOH, or MOHAP). Many labs in this ranking also hold international accreditations such as CAP (College of American Pathologists) or ISO 15189. Check the individual lab profile for specific accreditation details.`,
        },
        {
          question: `Does ${top?.name ?? "the cheapest lab"} offer home collection?`,
          answer: top
            ? `${top.name}'s home collection availability is shown in the ranking card above. In ${cityName}, many diagnostic labs offer home blood collection — ${second ? `including ${second.name}` : "check individual lab listings for details"}. Home collection fees typically range from free to AED 100.`
            : `Check individual lab listings for home collection availability and fees.`,
        },
      ];

    case "cheapest-test":
      return [
        {
          question: `How much does ${testName} cost in ${cityName}?`,
          answer: top
            ? `${testName} costs between ${top.price != null ? formatPrice(top.price) : "competitive prices"} (at ${top.name}) and ${items.filter((i) => i.price != null).length > 1 ? formatPrice(Math.max(...items.filter((i) => i.price != null).map((i) => i.price as number))) : "higher prices"} at other labs in ${cityName}. Compare all ${items.length} labs using the ranking above.`
            : `Compare ${testName} prices across ${items.length} labs using the ranking above.`,
        },
        {
          question: `Which lab has the cheapest ${testName} in ${cityName}?`,
          answer: top
            ? `${top.name} offers the cheapest ${testName} in ${cityName}${top.price != null ? ` at ${formatPrice(top.price)}` : ""}. ${top.subtitle ? top.subtitle + "." : ""} Prices are based on publicly available data from lab websites and price lists. Confirm with the lab before booking.`
            : `See the ranking above for the cheapest ${testName} in ${cityName}.`,
        },
        {
          question: testObj?.fastingRequired
            ? `Do I need to fast for ${testName}?`
            : `How should I prepare for ${testName}?`,
          answer: testObj?.fastingRequired
            ? `Yes, fasting for 9–12 hours is required before a ${testName} test. Drink only water during the fasting period. Schedule your appointment for early morning to minimise discomfort. If you are diabetic or on medication, consult your doctor before fasting.`
            : `${testName} ${testObj ? (testObj.fastingRequired ? "requires fasting." : "does not require fasting.") : "preparation requirements vary."} ${testObj?.sampleType === "blood" ? "A simple blood draw is required." : testObj?.sampleType === "urine" ? "A urine sample is required." : ""} Contact the lab directly for specific preparation instructions.`,
        },
        {
          question: `How long do ${testName} results take?`,
          answer: testObj?.turnaroundHours
            ? `${testName} results are typically ready within ${testObj.turnaroundHours} hours at most UAE labs. Walk-in patients often receive results the same day or next morning. Home collection services generally deliver digital results within 24–48 hours.`
            : `${testName} results are typically ready within 24 hours at most UAE labs. Walk-in patients may receive results the same day. Home collection services deliver results digitally within 24–48 hours. Contact your chosen lab for their specific turnaround time.`,
        },
      ];

    case "feature":
      switch (list.feature) {
        case "home-collection":
        case "free-home-collection":
          return [
            {
              question: `Which labs offer home blood collection in ${cityName}?`,
              answer: `${items.map((i) => i.name).slice(0, 3).join(", ")}${items.length > 3 ? `, and ${items.length - 3} more labs` : ""} offer home blood collection in ${cityName}. All are licensed by UAE health authorities and use qualified phlebotomists.`,
            },
            {
              question: "How does home blood collection work in the UAE?",
              answer:
                "Book online or by phone. A DHA/DOH-licensed nurse or phlebotomist visits your home or office, typically within 30–60 minutes. They collect blood, urine, or other samples and transport them to the lab in approved containers. Results are sent digitally within 24–48 hours. Most services operate 7 days a week, 7 AM to 10 PM.",
            },
            {
              question: "Is home blood collection as accurate as lab visits?",
              answer:
                "Yes. Home-collected samples are processed in the same accredited labs as walk-in samples. The collection equipment and transport conditions are regulated under the same UAE health authority standards. Accuracy depends on the lab's instrumentation, not the collection location.",
            },
            {
              question: "How much does home blood collection cost in the UAE?",
              answer: `Home collection fees in ${cityName} vary from free (${items.filter((i) => i.priceLabel?.includes("free") || i.badges?.includes("Free")).map((i) => i.name).slice(0, 2).join(", ") || "some labs"}) to AED 50–100 for others. The home collection fee is separate from the test price. Some labs waive the fee for orders above a minimum amount.`,
            },
          ];
        default:
          return [
            {
              question: `Which labs in ${cityName} offer ${list.feature ?? "this service"}?`,
              answer: `${items.map((i) => i.name).slice(0, 4).join(", ")}${items.length > 4 ? `, and ${items.length - 4} others` : ""} offer ${list.feature ?? "this service"} in ${cityName}. All are licensed UAE diagnostic facilities.`,
            },
            {
              question: `Is ${list.feature ?? "this service"} available UAE-wide?`,
              answer: `Availability varies by emirate. Dubai typically has the widest coverage, followed by Abu Dhabi and Sharjah. Check individual lab listings for service area details.`,
            },
            {
              question: "How do I book?",
              answer: `Click 'View Lab' on any listing above to visit the lab's profile page, which includes contact details, website, and booking links. Most labs accept walk-ins, phone bookings, and online appointments.`,
            },
            {
              question: "Are these labs accredited?",
              answer: `All labs in the UAE Open Healthcare Directory hold valid licences from UAE health authorities. Many also hold international accreditations such as CAP or ISO 15189. Accreditation details are shown on individual lab profiles.`,
            },
          ];
      }

    case "packages":
      return [
        {
          question: `What is included in a health check package in ${cityName}?`,
          answer: `Basic health packages typically include CBC, lipid profile, fasting glucose, liver function, and kidney function tests — covering 20–40 biomarkers. Comprehensive packages add thyroid, Vitamin D, B12, HbA1c, and urine analysis. Premium executive packages include cardiac markers, tumour markers, and imaging. Compare package contents in the cards above.`,
        },
        {
          question: `How much does a health check package cost in ${cityName}?`,
          answer: top
            ? `Health check packages in ${cityName} start from ${top.price != null ? formatPrice(top.price) : "AED 99"} at ${top.name}. Comprehensive packages covering 50+ biomarkers range from AED 200 to AED 500. Executive packages with cardiac and cancer markers start from AED 700.`
            : `Health check packages in ${cityName} range from AED 99 (basic) to AED 999 (executive). Compare packages in the ranking above.`,
        },
        {
          question: "Is a health package better value than individual tests?",
          answer:
            "Yes, in most cases. Bundling tests into a package saves 30–50% versus ordering the same tests individually. A basic 5-test panel ordered individually costs AED 300–400 at most labs. The same tests bundled into a package run AED 99–180. However, ensure the package includes exactly the tests your doctor recommends — don't pay for tests you don't need.",
        },
        {
          question: "Do I need a doctor's referral for a health package?",
          answer:
            "No. Most standalone diagnostic labs in the UAE offer health check packages without a prescription or referral. You can book directly, walk in, and receive results digitally. For specific medical conditions, always consult your doctor to determine which tests are appropriate.",
        },
      ];

    case "lab-type":
      return [
        {
          question: `Which is the best lab chain in ${cityName}?`,
          answer: top
            ? `${top.name} ranks as the top lab chain in ${cityName} by overall network size, accreditation, and test range. ${top.subtitle ? top.subtitle + "." : ""} The best chain for your needs depends on your location, required tests, and whether you need home collection.`
            : `Compare the top lab chains in ${cityName} using the ranking above.`,
        },
        {
          question: "How many branches does each lab chain have?",
          answer: `Branch counts for each chain are shown in their profile cards above. Al Borg Diagnostics leads with 17 UAE branches, followed by Thumbay Labs with 8. Coverage varies significantly — chains like NRL focus on Abu Dhabi while others like STAR Metropolis cover the full UAE.`,
        },
        {
          question: "Are lab chain results the same quality across all branches?",
          answer:
            "For CAP-accredited chains, yes. CAP accreditation requires all branches within a network to follow the same standardised protocols and pass the same external proficiency testing. For non-accredited labs, quality can vary slightly between branches. Chains with centralised processing labs (samples from all branches tested in one hub) tend to have the most consistent results.",
        },
        {
          question: "Can I collect results from any branch?",
          answer: `Policy varies by chain. Most large chains allow result collection from any branch within ${cityName}. Some offer digital results only. Check the specific chain's profile page for branch and result-collection policies.`,
        },
      ];

    default:
      return [
        {
          question: `What is this ranking based on?`,
          answer: `This ranking is compiled from publicly available pricing data, accreditation records, and service features across UAE diagnostic labs. All labs hold valid UAE health authority licences. Data verified March 2026.`,
        },
        {
          question: "Are these labs licensed?",
          answer:
            "Yes. All labs in the UAE Open Healthcare Directory are licensed by UAE health authorities — DHA (Dubai), DOH (Abu Dhabi), or MOHAP (Northern Emirates). Many also hold international CAP or ISO 15189 accreditation.",
        },
        {
          question: "How do I book a test?",
          answer: `Click 'View Lab' or 'Compare Prices' on any listing to visit the lab's profile page with contact details, booking links, and full test menus.`,
        },
        {
          question: "How often is this data updated?",
          answer:
            "Pricing and feature data is reviewed periodically. The most recent verification is March 2026. Always confirm prices directly with the lab before booking, as promotional pricing and branch-level variations may apply.",
        },
      ];
  }
}

// ─── Rank badge styles ────────────────────────────────────────────────────────

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-[#006828] text-white";
  if (rank <= 3) return "bg-[#1c1c1c] text-white";
  return "bg-[#f8f8f6] text-[#1c1c1c]";
}

function cardBorderClass(rank: number): string {
  if (rank === 1) return "border-[#006828] bg-[#006828]/[0.04]/10";
  return "border-black/[0.06]";
}

// ─── Item card ────────────────────────────────────────────────────────────────

function RankingItemCard({ item, listType }: { item: LabListItem; listType: LabList["listType"] }) {
  const isTest = listType === "cheapest-test";

  return (
    <div className={`border ${cardBorderClass(item.rank)} p-4 hover:border-[#006828]/15 transition-colors`}>
      <div className="flex items-start gap-4">
        {/* Rank number */}
        <div
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-base font-bold ${rankBadgeClass(item.rank)}`}
          aria-label={`Rank ${item.rank}`}
        >
          <span className="text-3xl font-bold leading-none"
            style={{ fontSize: "1.1rem" }}>
            {item.rank}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row + price */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#1c1c1c] leading-snug">
                {item.name}
                {item.rank === 1 && (
                  <span className="ml-2 text-[9px] bg-[#006828] text-white px-1.5 py-0.5 font-bold uppercase align-middle">
                    Top Pick
                  </span>
                )}
              </h3>
              {item.subtitle && (
                <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-0.5">{item.subtitle}</p>
              )}
            </div>
            {item.price != null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-base font-bold text-[#006828] whitespace-nowrap">
                  {formatPrice(item.price)}
                </p>
                {item.priceLabel && (
                  <p className="text-[10px] text-black/40">{item.priceLabel}</p>
                )}
              </div>
            )}
            {item.priceLabel && item.price == null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-[#006828]">{item.priceLabel}</p>
              </div>
            )}
          </div>

          {/* Badges */}
          {item.badges && item.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 mt-1.5">
              {item.badges.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] bg-[#006828]/[0.04] text-[#006828]-dark px-1.5 py-0.5 font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="font-['Geist',sans-serif] text-xs text-black/40 leading-relaxed mb-3">
              {item.description}
            </p>
          )}

          {/* CTA links */}
          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              href={item.linkHref}
              className="flex items-center gap-1 text-[11px] font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
            >
              {isTest ? "Compare Prices" : "View Lab"}
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LabListPage({ params }: { params: { slug: string } }) {
  const list = getLabListBySlug(params.slug);
  if (!list) notFound();

  const items = getLabListItems(list);
  const base = getBaseUrl();
  const relatedLists = getRelatedLists(list);
  const faqs = buildFaqs(list, items);
  const answerBlock = buildAnswerBlock(list, items);

  const cityName = list.citySlug
    ? CITIES.find((c) => c.slug === list.citySlug)?.name ?? list.citySlug
    : "UAE";

  // JSON-LD: ItemList
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.metaDescription,
    url: `${base}/labs/lists/${list.slug}`,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.rank,
      name: item.name,
      url: `${base}${item.linkHref}`,
      ...(item.price != null
        ? {
            item: {
              "@type":
                list.listType === "cheapest-test" ? "MedicalTest" : "MedicalBusiness",
              name: item.name,
              url: `${base}${item.linkHref}`,
              ...(item.price != null
                ? {
                    offers: {
                      "@type": "Offer",
                      price: item.price.toString(),
                      priceCurrency: "AED",
                    },
                  }
                : {}),
            },
          }
        : {}),
    })),
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD structured data */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Lab Tests", url: `${base}/labs` },
          { name: "Lists", url: `${base}/labs/lists` },
          { name: list.title },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block", "h1"])} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={itemListSchema} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Lab Tests", href: "/labs" },
          { label: "Lists", href: "/labs/lists" },
          { label: list.title },
        ]}
      />

      {/* Hero / H1 block */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ListTypeIcon listType={list.listType} />
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight">{list.h1}</h1>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="bg-[#f8f8f6] px-3 py-2 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-[#006828]" />
            <span className="text-xs font-bold text-[#1c1c1c]">{items.length} ranked</span>
          </div>
          {list.citySlug && (
            <div className="bg-[#f8f8f6] px-3 py-2 flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-[#006828]" />
              <span className="text-xs font-bold text-[#1c1c1c]">{cityName}</span>
            </div>
          )}
          {items[0]?.price != null && (
            <div className="bg-[#f8f8f6] px-3 py-2 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-[#006828]" />
              <span className="text-xs font-bold text-[#1c1c1c]">
                From {formatPrice(items[0].price)}
              </span>
            </div>
          )}
          <div className="bg-[#f8f8f6] px-3 py-2 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#006828]" />
            <span className="font-['Geist',sans-serif] text-xs text-black/40">Verified March 2026</span>
          </div>
        </div>

        {/* Answer block — AEO target */}
        {answerBlock && (
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">{answerBlock}</p>
          </div>
        )}
      </div>

      {/* ─── The Ranking ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">{list.h1}</h2>
      </div>
      <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-5">
        {items.length} options ranked by{" "}
        {list.listType === "cheapest-labs" || list.listType === "cheapest-test"
          ? "price (lowest first)"
          : list.listType === "packages"
          ? "value and price"
          : list.listType === "lab-type"
          ? "network size and accreditation"
          : "relevance and quality"}
        . Prices in AED. Data verified March 2026.
      </p>

      <div className="space-y-4 mb-12">
        {items.length === 0 ? (
          <div className="border border-black/[0.06] p-8 text-center">
            <p className="text-black/40 text-sm">
              No results found for this list. Data may be loading.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <RankingItemCard key={`${item.rank}-${item.slug}`} item={item} listType={list.listType} />
          ))
        )}
      </div>

      {/* ─── Why This Ranking Matters ────────────────────────────────────── */}
      <WhyItMattersSection list={list} />

      {/* ─── Related Lists ───────────────────────────────────────────────── */}
      {relatedLists.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">Related Rankings</h2>
          </div>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mb-4">
            More curated lists to help you compare UAE diagnostic labs and test prices.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedLists.map((related) => (
              <Link
                key={related.slug}
                href={`/labs/lists/${related.slug}`}
                className="border border-black/[0.06] rounded-2xl p-5 hover:border-[#006828]/15 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight group-hover:text-[#006828] transition-colors leading-snug mb-1">
                      {related.title}
                    </h3>
                    <p className="text-[11px] text-black/40 line-clamp-2">
                      {related.metaDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/40 group-hover:text-[#006828] flex-shrink-0 mt-0.5 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Browse all lists link ──────────────────────────────────────── */}
      <div className="mt-8 flex">
        <Link
          href="/labs/lists"
          className="flex items-center gap-2 text-sm font-bold text-[#006828] hover:text-[#006828]-dark transition-colors"
        >
          <Trophy className="w-4 h-4" />
          View all UAE Lab Rankings &amp; Lists
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── FAQ ────────────────────────────────────────────────────────── */}
      <FaqSection
        faqs={faqs}
        title={`${list.h1} — Frequently Asked Questions`}
      />

      {/* ─── Disclaimer ────────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Disclaimer:</strong> Prices shown are indicative and based on publicly
          available pricing from lab websites, aggregator platforms, and walk-in price lists
          (2024–2026). Actual prices may vary by branch location, insurance coverage,
          promotions, and test methodology. Always confirm pricing directly with the
          laboratory before booking. This ranking is for informational purposes only and
          does not constitute medical advice or an endorsement of any particular lab.
          Consult a physician before ordering lab tests. All labs listed hold valid UAE
          health authority licences. Data sourced from DHA, DOH, and MOHAP licensed
          facility registers. Last verified March 2026.
        </p>
      </div>
    </div>
  );
}
