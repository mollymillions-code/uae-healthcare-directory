import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import {
  getTopEmployersByCategory,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_STATS,
} from "@/lib/workforce";

export const revalidate = 43200;

interface Props {
  params: { category: string };
}

const CATEGORY_SLUGS = ["physicians", "dentists", "nurses", "allied-health"];

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

function getCategoryMeta(slug: string) {
  return PROFESSIONAL_CATEGORIES.find((c) => c.slug === slug);
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = getCategoryMeta(params.category);
  if (!cat) {
    return {
      title: "Top Employers by Category",
      description: "Top healthcare employers in Dubai by professional category.",
    };
  }
  const base = getBaseUrl();
  return {
    title: `Top ${cat.name} Employers in Dubai — ${cat.count.toLocaleString()} Licensed Professionals`,
    description: `Dubai facilities ranked by number of licensed ${cat.name.toLowerCase()}. ${cat.count.toLocaleString()} professionals across ${PROFESSIONAL_STATS.uniqueFacilities.toLocaleString()} facilities. See which hospitals and clinics employ the most ${cat.name.toLowerCase()}.`,
    alternates: {
      canonical: `${base}/workforce/rankings/top-employers/${cat.slug}`,
    },
    openGraph: {
      title: `Top ${cat.name} Employers in Dubai — ${cat.count.toLocaleString()} Licensed Professionals`,
      description: `Which Dubai facilities employ the most ${cat.name.toLowerCase()}? Ranked by DHA-licensed staff count.`,
      url: `${base}/workforce/rankings/top-employers/${cat.slug}`,
      type: "website",
      siteName: "UAE Open Healthcare Directory",
    },
  };
}

export default function TopEmployersByCategoryPage({ params }: Props) {
  const cat = getCategoryMeta(params.category);
  if (!cat) notFound();

  const base = getBaseUrl();
  const employers = getTopEmployersByCategory(cat.slug, 50);

  if (employers.length === 0) notFound();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Top ${cat.name} Employers in Dubai`,
          description: `Dubai facilities ranked by licensed ${cat.name.toLowerCase()} count.`,
          url: `${base}/workforce/rankings/top-employers/${cat.slug}`,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: `${base}/` },
          { name: "Workforce Intelligence", url: `${base}/workforce` },
          { name: "Rankings", url: `${base}/workforce/rankings` },
          {
            name: "Top Employers",
            url: `${base}/workforce/rankings/top-employers`,
          },
          { name: cat.name },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "UAE", href: "/" },
          { label: "Workforce Intelligence", href: "/workforce" },
          { label: "Rankings", href: "/workforce/rankings" },
          { label: "Top Employers", href: "/workforce/rankings/top-employers" },
          { label: cat.name },
        ]}
      />

      {/* Hero */}
      <div className="mb-10">
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-2">
          Employer Rankings by Category
        </p>
        <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-2">
          Top {cat.name} Employers in Dubai
        </h1>
        <p className="font-['Geist_Mono',monospace] text-xs text-[#006828] font-medium tracking-wider uppercase mb-4">
          {cat.count.toLocaleString()} Licensed {cat.name} &middot; Data as of{" "}
          {PROFESSIONAL_STATS.scraped}
        </p>
        <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] py-5 px-6 mb-6">
          <p className="font-['Geist',sans-serif] text-sm text-black/60 leading-relaxed">
            Dubai healthcare facilities ranked by the number of DHA-licensed{" "}
            {cat.name.toLowerCase()} on staff. {cat.description}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {cat.count.toLocaleString()}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Total {cat.name}
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {Math.round((cat.count / PROFESSIONAL_STATS.total) * 100)}%
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Share of Workforce
          </p>
        </div>
        <div className="bg-[#f8f8f6] p-4 text-center">
          <p className="font-['Geist_Mono',monospace] text-2xl font-bold text-[#006828]">
            {employers.length}
          </p>
          <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1">
            Facilities Ranked
          </p>
        </div>
      </div>

      {/* Other Categories */}
      <div className="flex flex-wrap gap-3 mb-8">
        {PROFESSIONAL_CATEGORIES.filter((c) => c.slug !== cat.slug).map(
          (c) => (
            <Link
              key={c.slug}
              href={`/workforce/rankings/top-employers/${c.slug}`}
              className="border border-black/[0.06] px-4 py-2 hover:border-[#006828]/15 transition-colors group"
            >
              <span className="font-['Geist',sans-serif] text-xs text-black/60 group-hover:text-[#006828] transition-colors">
                Top {c.name}
              </span>
            </Link>
          )
        )}
      </div>

      {/* Table */}
      <div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
        <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
          Facilities Ranked by {cat.name} Count
        </h2>
      </div>
      <div className="mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1c1c1c]">
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 w-10">
                #
              </th>
              <th className="text-left font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                Facility
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4">
                {cat.name}
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 pr-4 hidden sm:table-cell">
                Total Staff
              </th>
              <th className="text-right font-['Geist',sans-serif] text-xs text-black/40 font-medium py-2 hidden md:table-cell">
                % of Staff
              </th>
            </tr>
          </thead>
          <tbody>
            {employers.map((emp, i) => {
              const pct =
                emp.totalStaff > 0
                  ? ((emp.count / emp.totalStaff) * 100).toFixed(1)
                  : "0.0";
              return (
                <tr key={emp.slug} className="border-b border-black/[0.06]">
                  <td className="py-2.5 pr-4 font-['Geist_Mono',monospace] text-xs text-black/30">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/workforce/employer/${emp.slug}`}
                      className="font-['Bricolage_Grotesque',sans-serif] text-sm font-semibold text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-['Geist_Mono',monospace] text-sm font-bold text-[#006828]">
                      {emp.count.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right hidden sm:table-cell">
                    <span className="font-['Geist_Mono',monospace] text-sm text-[#1c1c1c]">
                      {emp.totalStaff.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 text-right hidden md:table-cell">
                    <span className="font-['Geist_Mono',monospace] text-xs text-black/40">
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[11px] text-black/40 leading-relaxed">
          <strong>Source:</strong> Dubai Health Authority (DHA) Sheryan Medical
          Professional Registry. Data scraped {PROFESSIONAL_STATS.scraped}. Staff
          counts reflect DHA-licensed professionals only. Verify credentials
          directly with DHA.
        </p>
      </div>
    </div>
  );
}
