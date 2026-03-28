import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCities, getCityBySlug, getCategories, getProviders, getProviderCountByCategoryAndCity } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
interface Props { params: { city: string } }

async function getWalkInProviders(citySlug: string) {
  const { providers } = await getProviders({ citySlug, categorySlug: "clinics", limit: 99999 });
  return providers;
}

export function generateStaticParams() {
  return getCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return {};
  const count = (await getWalkInProviders(city.slug)).length;
  const base = getBaseUrl();
  const url = `${base}/directory/${city.slug}/walk-in`;
  return {
    title: `Walk-In Clinics in ${city.name}, UAE | ${count}+ No-Appointment Clinics`,
    description: `Find ${count}+ walk-in clinics in ${city.name}, UAE that accept patients without appointments. Browse polyclinics, general clinics, and medical centers with ratings, hours, and insurance details. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Walk-In Clinics in ${city.name}, UAE`, description: `${count}+ walk-in clinics in ${city.name} that accept patients without appointments.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

function getRegulatorName(s: string): string {
  if (s === "dubai") return "the Dubai Health Authority (DHA)";
  if (s === "abu-dhabi" || s === "al-ain") return "the Department of Health (DOH)";
  return "the Ministry of Health and Prevention (MOHAP)";
}

function getGPFeeRange(s: string): string {
  if (s === "dubai") return "AED 150-300";
  if (s === "abu-dhabi" || s === "al-ain") return "AED 100-250";
  if (s === "sharjah") return "AED 100-200";
  return "AED 80-200";
}

export default async function WalkInClinicsPage({ params }: Props) {
  const city = getCityBySlug(params.city);
  if (!city) notFound();
  const allWalkIns = await getWalkInProviders(city.slug);
  if (allWalkIns.length === 0) notFound();
  const base = getBaseUrl();
  const regulator = getRegulatorName(city.slug);
  const gpFee = getGPFeeRange(city.slug);
  const count = allWalkIns.length;
  const sorted = [...allWalkIns].sort((a, b) => { const r = Number(b.googleRating) - Number(a.googleRating); return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0); });
  const top20 = sorted.slice(0, 20);
  const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);
  const walkInCategorySlugs = ["clinics","dental","dermatology","ophthalmology","pediatrics","ent","pharmacy","labs-diagnostics","emergency-care"];
  const catCounts = await Promise.all(walkInCategorySlugs.map((slug) => getProviderCountByCategoryAndCity(slug, city.slug)));
  const walkInCategories = getCategories().filter((cat) => {
    const idx = walkInCategorySlugs.indexOf(cat.slug);
    return idx >= 0 && catCounts[idx] > 0;
  });
  const faqs = [
    { question: `How many walk-in clinics are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count}+ walk-in friendly clinics and polyclinics in ${city.name}, UAE. These include general practice clinics, multi-specialty polyclinics, and family medicine centers that accept patients without prior appointments. Data sourced from official ${regulator} registers, last verified March 2026.` },
    { question: `What is the typical wait time at walk-in clinics in ${city.name}?`, answer: `Walk-in wait times at clinics in ${city.name} typically range from 15 to 45 minutes for GP consultations. Wait times may be longer during morning rush (8-10 AM) and evening hours (5-8 PM). Multi-specialty polyclinics generally have shorter wait times due to multiple practitioners on staff.` },
    { question: `How much does a walk-in GP consultation cost in ${city.name}?`, answer: `A standard walk-in GP consultation in ${city.name} typically costs ${gpFee}, depending on the clinic tier and whether you pay out-of-pocket or through insurance. Specialist walk-in consultations may cost AED 300-800. Always confirm fees directly with the provider.` },
    { question: `Do walk-in clinics in ${city.name} accept insurance?`, answer: `Yes, most walk-in clinics in ${city.name} accept major UAE insurance plans including Daman, AXA, Cigna, MetLife, Bupa, and Oman Insurance. Check individual provider listings for specific plan acceptance.` },
    { question: `Are walk-in clinics in ${city.name} open on weekends?`, answer: `Many walk-in clinics in ${city.name} operate on weekends, particularly those in shopping malls, residential areas, and 24-hour polyclinics. Saturday hours are common; Friday hours may be limited to afternoon/evening.` },
    { question: `What services do walk-in clinics in ${city.name} offer?`, answer: `Walk-in clinics in ${city.name} typically offer general practice consultations, basic health screenings, minor injury treatment, vaccinations, prescription renewals, sick notes, blood tests, and referrals to specialists.` },
  ];

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: "Walk-In Clinics", url: `${base}/directory/${city.slug}/walk-in` }])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        {ratedProviders.length >= 5 && <JsonLd data={itemListSchema(`Walk-In Clinics in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />}
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: "Walk-In Clinics" }]} />
        <div className="mb-8">
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight mb-3">Walk-In Clinics in {city.name}, UAE</h1>
          <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed mb-4">{city.name} has {count}+ clinics and polyclinics that accept walk-in patients without appointments. Most general clinics in the UAE operate on a walk-in basis, with typical wait times of 15-45 minutes for GPs. Healthcare in {city.name} is regulated by {regulator}.</p>
          <div className="border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-6" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/40 leading-relaxed">
              According to the UAE Open Healthcare Directory, there are {count}+ walk-in clinics in {city.name}. Most UAE clinics accept walk-in patients without appointments, though wait times vary from 15-45 minutes for GPs.
              {ratedProviders.length > 0 && ratedProviders[0] && (<> The highest-rated walk-in clinic is <strong>{ratedProviders[0].name}</strong> with a {ratedProviders[0].googleRating}-star Google rating{ratedProviders[0].googleReviewCount > 0 ? ` based on ${ratedProviders[0].googleReviewCount.toLocaleString()} patient reviews` : ""}.</>)}{" "}
              A standard GP walk-in consultation costs {gpFee}. All listings are sourced from official government registers, last verified March 2026.
            </p>
          </div>
        </div>
        {walkInCategories.length > 1 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {walkInCategories.map((cat) => { const cc = catCounts[walkInCategorySlugs.indexOf(cat.slug)] ?? 0; return (
                <Link key={cat.slug} href={`/directory/${city.slug}/walk-in/${cat.slug}`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors">
                  <span className="font-['Geist',sans-serif] font-medium">Walk-In {cat.name}</span><span className="font-['Geist',sans-serif] text-xs text-black/40">{cc} {cc === 1 ? "provider" : "providers"}</span>
                </Link>); })}
            </div>
          </section>
        )}
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
          {count > 20 && <p className="font-['Geist',sans-serif] text-sm text-black/40 mt-4">Showing top 20 of {count}+ walk-in clinics.{" "}<Link href={`/directory/${city.slug}/clinics`} className="text-[#006828] hover:underline font-medium">Browse all clinics in {city.name} &rarr;</Link></p>}
        </section>
        <section className="mb-10"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/directory/${city.slug}`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">All Providers</span><span className="font-['Geist',sans-serif] text-xs text-black/40">{city.name}</span></Link>
          <Link href={`/directory/${city.slug}/insurance`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">By Insurance</span><span className="font-['Geist',sans-serif] text-xs text-black/40">Daman, AXA, Cigna...</span></Link>
          <Link href={`/directory/${city.slug}/top`} className="flex items-center justify-between bg-[#f8f8f6] border border-black/[0.06] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] hover:border-[#006828]/15 hover:bg-[#006828]/[0.04] transition-colors"><span className="font-['Geist',sans-serif] font-medium">Top Rated</span><span className="font-['Geist',sans-serif] text-xs text-black/40">By patient reviews</span></Link>
        </div></section>
        <FaqSection faqs={faqs} title={`Walk-In Clinics in ${city.name} — FAQ`} />
      </div>
    </>
  );
}
