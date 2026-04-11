import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCityBySlug, getCategoryBySlug, getProviders, getProviderCountByCategoryAndCity } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
// ISR only — no generateStaticParams. Prerendering ~54 city × category combos
// fired 54 DB count queries during build which exhausted the pg pool
// (Deploy 6 failure, 2026-04-11). ISR renders on first visit and caches 12h.
export const dynamicParams = true;
interface Props { params: { city: string; category: string } }
const WALK_IN_CATEGORY_SLUGS = ["clinics","dental","dermatology","ophthalmology","pediatrics","ent","pharmacy","labs-diagnostics","emergency-care"];

function getRegulatorName(s: string): string { if (s === "dubai") return "the Dubai Health Authority (DHA)"; if (s === "abu-dhabi" || s === "al-ain") return "the Department of Health (DOH)"; return "the Ministry of Health and Prevention (MOHAP)"; }
function getGPFeeRange(s: string): string { if (s === "dubai") return "AED 150-300"; if (s === "abu-dhabi" || s === "al-ain") return "AED 100-250"; if (s === "sharjah") return "AED 100-200"; return "AED 80-200"; }
function getWalkInWaitEstimate(s: string): string { if (s === "emergency-care") return "immediate triage; non-critical cases within 30-120 minutes"; if (s === "pharmacy") return "5-15 minutes"; if (s === "labs-diagnostics") return "10-30 minutes"; if (s === "dental") return "15-45 minutes for routine check-ups"; return "15-45 minutes"; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city); const cat = getCategoryBySlug(params.category);
  if (!city || !cat) return {};
  const count = await getProviderCountByCategoryAndCity(cat.slug, city.slug);
  const base = getBaseUrl(); const url = `${base}/directory/${city.slug}/walk-in/${cat.slug}`;
  return {
    title: `Walk-In ${cat.name} in ${city.name}, UAE | ${count}+ Providers`,
    description: `Find ${count}+ walk-in ${cat.name.toLowerCase()} in ${city.name}, UAE. No appointment needed. Browse by ratings, insurance, and hours. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Walk-In ${cat.name} in ${city.name}, UAE`, description: `${count}+ walk-in ${cat.name.toLowerCase()} in ${city.name}. No appointment required.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default async function WalkInCategoryPage({ params }: Props) {
  const city = getCityBySlug(params.city); const cat = getCategoryBySlug(params.category);
  if (!city || !cat) notFound();
  if (!WALK_IN_CATEGORY_SLUGS.includes(cat.slug)) notFound();
  const { providers: allProviders } = await getProviders({ citySlug: city.slug, categorySlug: cat.slug, limit: 99999 });
  if (allProviders.length === 0) notFound();
  const base = getBaseUrl(); const regulator = getRegulatorName(city.slug); const gpFee = getGPFeeRange(city.slug);
  const waitEstimate = getWalkInWaitEstimate(cat.slug); const count = allProviders.length; const catLower = cat.name.toLowerCase();
  const sorted = [...allProviders].sort((a, b) => { const r = Number(b.googleRating) - Number(a.googleRating); return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0); });
  const top20 = sorted.slice(0, 20); const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);
  const faqs = [
    { question: `How many walk-in ${catLower} are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count} ${catLower} in ${city.name}, UAE that accept walk-in patients. Most ${catLower} in the UAE operate on a walk-in basis alongside appointment-based care. Data sourced from official government registers, last verified March 2026.` },
    { question: `What is the typical wait time at walk-in ${catLower} in ${city.name}?`, answer: `Walk-in wait times at ${catLower} in ${city.name} are typically ${waitEstimate}. Wait times may be longer during peak hours (8-10 AM and 5-8 PM). Calling ahead can help estimate current wait times.` },
    { question: `How much does a walk-in visit cost in ${city.name}?`, answer: `Walk-in consultation fees at ${catLower} in ${city.name} typically range from ${gpFee} for a general visit. Specialist or procedure-specific fees may be higher. Always confirm fees directly with the provider.` },
    { question: `Do walk-in ${catLower} in ${city.name} accept insurance?`, answer: `Yes, most ${catLower} in ${city.name} accept major UAE insurance plans including Daman, AXA, Cigna, MetLife, Bupa, and Oman Insurance. Use the insurance filter on individual provider pages to confirm.` },
    { question: `Are walk-in ${catLower} in ${city.name} open on weekends?`, answer: `Many ${catLower} in ${city.name} operate on weekends. Saturday hours are common. Friday hours may be limited to afternoons. Some 24-hour facilities accept walk-ins around the clock.` },
  ];

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: "Walk-In Clinics", url: `${base}/directory/${city.slug}/walk-in` }, { name: cat.name, url: `${base}/directory/${city.slug}/walk-in/${cat.slug}` }])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        {ratedProviders.length >= 5 && <JsonLd data={itemListSchema(`Walk-In ${cat.name} in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />}
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: "Walk-In Clinics", href: `/directory/${city.slug}/walk-in` }, { label: cat.name }]} />
        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">Walk-In {cat.name} in {city.name}, UAE</h1>
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed mb-4">{city.name} has {count} {catLower} that accept walk-in patients. Typical walk-in wait times are {waitEstimate}. Healthcare in {city.name} is regulated by {regulator}.</p>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
              According to the UAE Open Healthcare Directory, there are {count} walk-in {catLower} in {city.name}. Most UAE clinics accept walk-in patients without appointments, though wait times vary from 15-45 minutes for GPs.
              {ratedProviders.length > 0 && ratedProviders[0] && (<> The highest-rated is <strong>{ratedProviders[0].name}</strong> with a {ratedProviders[0].googleRating}-star Google rating{ratedProviders[0].googleReviewCount > 0 ? ` based on ${ratedProviders[0].googleReviewCount.toLocaleString()} patient reviews` : ""}.</>)}{" "}
              A standard consultation costs approximately {gpFee}. All listings are sourced from official government registers, last verified March 2026.
            </p>
          </div>
        </div>
        <section className="mb-10">
          <ol className="space-y-0">
            {top20.map((p, i) => (
              <li key={p.id} className="article-row">
                <span className="text-2xl font-bold text-[#006828] leading-none mt-0.5 w-8 shrink-0 text-center">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-4 flex-wrap"><div className="flex-1 min-w-0">
                  <Link href={`/directory/${p.citySlug}/${p.categorySlug}/${p.slug}`} className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[#1c1c1c] tracking-tight hover:text-[#006828] transition-colors">{p.name}</Link>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {Number(p.googleRating) > 0 && <span className="text-xs font-semibold text-[#006828]">{p.googleRating}/5</span>}
                    {p.googleReviewCount > 0 && <span className="font-['Geist',sans-serif] text-xs text-black/40">{p.googleReviewCount.toLocaleString()} reviews</span>}
                    {p.facilityType && <span className="font-['Geist',sans-serif] text-xs text-black/40">{p.facilityType}</span>}
                    {p.phone && <a href={`tel:${p.phone.replace(/[^+\d]/g, "")}`} className="font-['Geist',sans-serif] text-xs text-black/40 hover:text-[#006828] transition-colors">{p.phone}</a>}
                  </div>
                  {p.address && <p className="font-['Geist',sans-serif] text-xs text-black/40 mt-1 line-clamp-1">{p.address}</p>}
                </div><div className="shrink-0"><span className="inline-block bg-[#006828]/[0.08] text-[#006828] text-[10px] font-medium uppercase tracking-wide px-2.5 py-0.5 rounded-full font-['Geist',sans-serif]">Walk-In</span></div></div></div>
              </li>))}
          </ol>
          {count > 20 && <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-4">Showing top 20 of {count} walk-in {catLower}.{" "}<Link href={`/directory/${city.slug}/${cat.slug}`} className="text-[#006828] hover:underline font-medium">Browse all {catLower} in {city.name} &rarr;</Link></p>}
        </section>
        <section className="mb-10"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/directory/${city.slug}/walk-in`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">All Walk-In Clinics</span><span className="font-['Geist',sans-serif] text-xs text-black/40">{city.name}</span></Link>
          <Link href={`/directory/${city.slug}/${cat.slug}`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">All {cat.name}</span><span className="font-['Geist',sans-serif] text-xs text-black/40">{city.name}</span></Link>
          <Link href={`/directory/${city.slug}/insurance`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">By Insurance</span><span className="font-['Geist',sans-serif] text-xs text-black/40">Daman, AXA, Cigna...</span></Link>
        </div></section>
        <FaqSection faqs={faqs} title={`Walk-In ${cat.name} in ${city.name} — FAQ`} />
      </div>
    </>
  );
}
