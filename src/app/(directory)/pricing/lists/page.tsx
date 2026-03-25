import { Metadata } from "next";
import Link from "next/link";
import { List, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRICING_LISTS } from "@/lib/constants/pricing-lists";
import { CITIES } from "@/lib/constants/cities";
import { breadcrumbSchema, speakableSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: "UAE Medical Pricing Lists — Cheapest, Most Expensive, Insured & More | UAE Open Healthcare Directory",
    description: "Browse curated lists of medical procedure costs in the UAE. Find the cheapest procedures, most expensive surgeries, insurance-covered treatments, and more — by city and category.",
    alternates: { canonical: `${base}/pricing/lists` },
    openGraph: {
      title: "UAE Medical Pricing Lists — Curated Cost Rankings",
      description: `${PRICING_LISTS.length} curated pricing lists across 8 UAE cities.`,
      url: `${base}/pricing/lists`,
      type: "website",
    },
  };
}

export default function PricingListsHubPage() {
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Medical Procedure Costs", url: `${base}/pricing` },
          { name: "Pricing Lists" },
        ])}
      />
      <JsonLd data={speakableSchema([".answer-block"])} />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Procedure Costs", href: "/pricing" },
          { label: "Pricing Lists" },
        ]}
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <List className="w-8 h-8 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-dark">
            UAE Medical Pricing Lists
          </h1>
        </div>
        <div className="answer-block" data-answer-block="true">
          <p className="text-muted leading-relaxed">
            Browse {PRICING_LISTS.length} curated rankings of medical procedure costs
            across 8 UAE cities. Find the cheapest procedures, most expensive surgeries,
            what insurance covers, and quick outpatient options.
          </p>
        </div>
      </div>

      {/* List cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {PRICING_LISTS.map((list) => (
          <div key={list.slug} className="border border-light-200 p-4">
            <h2 className="text-sm font-bold text-dark mb-2">{list.title}</h2>
            <p className="text-xs text-muted mb-3">{list.description}</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.slice(0, 4).map((city) => {
                const items = list.getItems(city.slug);
                if (items.length === 0) return null;
                return (
                  <Link
                    key={city.slug}
                    href={`/pricing/lists/${list.slug}/${city.slug}`}
                    className="text-[11px] text-accent hover:underline"
                  >
                    {city.name} →
                  </Link>
                );
              })}
              {CITIES.length > 4 && (
                <span className="text-[11px] text-muted">
                  +{CITIES.length - 4} more cities
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* All cities quick links */}
      <div className="section-header">
        <h2>Browse by City</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {CITIES.map((city) => (
          <div key={city.slug} className="border border-light-200 p-3">
            <h3 className="text-sm font-bold text-dark mb-2">{city.name}</h3>
            <div className="space-y-1">
              {PRICING_LISTS.slice(0, 4).map((list) => {
                const items = list.getItems(city.slug);
                if (items.length === 0) return null;
                return (
                  <Link
                    key={list.slug}
                    href={`/pricing/lists/${list.slug}/${city.slug}`}
                    className="flex items-center justify-between text-[11px] text-muted hover:text-accent"
                  >
                    <span className="truncate">{list.titleTemplate.replace("{city}", "")}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
