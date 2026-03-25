import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { getListBySlug, getAllListCityParams } from "@/lib/constants/pricing-lists";
import { formatAed } from "@/lib/constants/procedures";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateStaticParams() {
  return getAllListCityParams();
}

interface Props {
  params: Promise<{ listType: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listType, city: citySlug } = await params;
  const list = getListBySlug(listType);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!list || !city) return {};

  const base = getBaseUrl();
  const items = list.getItems(citySlug);
  const title = list.titleTemplate.replace("{city}", city.name);
  const description = list.descriptionTemplate.replace("{city}", city.name);

  return {
    title: `${title} | UAE Medical Pricing`,
    description: `${description} ${items.length} procedures ranked, ${list.sortLabel}.`,
    alternates: { canonical: `${base}/pricing/lists/${listType}/${citySlug}` },
    openGraph: {
      title,
      description,
      url: `${base}/pricing/lists/${listType}/${citySlug}`,
      type: "website",
    },
  };
}

export default async function PricingListPage({ params }: Props) {
  const { listType, city: citySlug } = await params;
  const list = getListBySlug(listType);
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!list || !city) notFound();

  const base = getBaseUrl();
  const items = list.getItems(citySlug);
  if (items.length === 0) notFound();

  const title = list.titleTemplate.replace("{city}", city.name);
  const description = list.descriptionTemplate.replace("{city}", city.name);

  const regulator =
    citySlug === "dubai" ? "Dubai Health Authority (DHA)"
    : (citySlug === "abu-dhabi" || citySlug === "al-ain") ? "Department of Health Abu Dhabi (DOH)"
    : "Ministry of Health and Prevention (MOHAP)";

  // Same list in other cities
  const otherCities = CITIES.filter((c) => c.slug !== citySlug && list.getItems(c.slug).length > 0);

  const faqs = [
    {
      question: title.replace(/^\d+ /, "What are the ").replace(/ in /, " available in ") + "?",
      answer: `Here are the top ${items.length} ranked by ${list.sortLabel}: ${items.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (${formatAed(p.cityPricing[citySlug]?.typical ?? 0)})`).join(", ")}${items.length > 5 ? `, and ${items.length - 5} more` : ""}.`,
    },
    {
      question: `How do medical costs in ${city.name} compare to other UAE cities?`,
      answer: `${city.name} is ${citySlug === "dubai" ? "generally the most expensive emirate" : citySlug === "abu-dhabi" ? "the second most expensive" : "more affordable than Dubai and Abu Dhabi"} for medical procedures. Prices vary by 30-50% between the cheapest and most expensive emirates for the same procedure.`,
    },
    {
      question: `Are these prices covered by insurance in ${city.name}?`,
      answer: `Coverage depends on the procedure and your plan. ${items.filter((p) => p.insuranceCoverage === "typically-covered").length} of ${items.length} procedures on this list are typically covered by UAE health insurance. Healthcare in ${city.name} is regulated by the ${regulator}.`,
    },
  ];

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Pricing Lists", url: `${base}/pricing/lists` },
          { name: title },
        ])}
      />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={speakableSchema([".answer-block"])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          description,
          numberOfItems: items.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: items.map((proc, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "MedicalProcedure",
              name: proc.name,
              url: `${base}/pricing/${proc.slug}/${citySlug}`,
              estimatedCost: {
                "@type": "MonetaryAmount",
                currency: "AED",
                value: proc.cityPricing[citySlug]?.typical ?? 0,
              },
            },
          })),
        }}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: "Lists", href: "/pricing/lists" },
          { label: title },
        ]}
      />

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted mb-4">
          <MapPin className="w-4 h-4" />
          <span>{city.name}, UAE</span>
          <span>·</span>
          <span>{items.length} procedures</span>
          <span>·</span>
          <span>Sorted: {list.sortLabel}</span>
        </div>

        <div className="answer-block bg-light-50 border border-light-200 p-4" data-answer-block="true">
          <p className="text-sm text-muted leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Ranked list */}
      <div className="border border-light-200 divide-y divide-light-200 mb-10">
        <div className="hidden sm:grid grid-cols-6 gap-4 p-3 bg-light-50 text-[11px] font-bold text-muted uppercase tracking-wider">
          <div>#</div>
          <div className="col-span-2">Procedure</div>
          <div className="text-right">Typical Cost</div>
          <div className="text-right">Range</div>
          <div className="text-right">Insurance</div>
        </div>
        {items.map((proc, i) => {
          const pricing = proc.cityPricing[citySlug];
          if (!pricing) return null;

          const coverageColor =
            proc.insuranceCoverage === "typically-covered" ? "text-green-700 bg-green-50"
            : proc.insuranceCoverage === "partially-covered" ? "text-yellow-700 bg-yellow-50"
            : proc.insuranceCoverage === "rarely-covered" ? "text-orange-700 bg-orange-50"
            : "text-red-700 bg-red-50";
          const coverageLabel =
            proc.insuranceCoverage === "typically-covered" ? "Covered"
            : proc.insuranceCoverage === "partially-covered" ? "Partial"
            : proc.insuranceCoverage === "rarely-covered" ? "Rare"
            : "Not covered";

          return (
            <Link
              key={proc.slug}
              href={`/pricing/${proc.slug}/${citySlug}`}
              className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 p-3 hover:bg-light-50 transition-colors group items-center"
            >
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-accent">#{i + 1}</span>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="sm:hidden text-sm font-bold text-accent">#{i + 1}</span>
                  <h3 className="text-sm font-bold text-dark group-hover:text-accent truncate">
                    {proc.name}
                  </h3>
                </div>
                <p className="text-[11px] text-muted">
                  {proc.duration} · {proc.setting} · {proc.recoveryTime}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-dark">{formatAed(pricing.typical)}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted">
                  {formatAed(pricing.min)}–{formatAed(pricing.max)}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-medium px-2 py-0.5 ${coverageColor}`}>
                  {coverageLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Same list in other cities */}
      {otherCities.length > 0 && (
        <>
          <div className="section-header">
            <h2>Same List in Other Cities</h2>
            <span className="arrows">&gt;&gt;&gt;</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/pricing/lists/${listType}/${c.slug}`}
                className="border border-light-200 p-3 hover:border-accent transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  <span className="text-sm font-bold text-dark group-hover:text-accent">
                    {c.name}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* FAQ */}
      <FaqSection faqs={faqs} title={`${title} — FAQ`} />

      {/* Disclaimer */}
      <div className="mt-8 border-t border-light-200 pt-4">
        <p className="text-[11px] text-muted leading-relaxed">
          <strong>Disclaimer:</strong> Rankings based on typical procedure costs in {city.name},
          UAE, from DOH/DHA tariff data and market-observed prices as of March 2026. Actual
          costs vary by facility and doctor. Healthcare regulated by the {regulator}.
        </p>
      </div>
    </div>
  );
}
