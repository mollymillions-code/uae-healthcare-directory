import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCities, getCityBySlug, getProviders } from "@/lib/data";
import { breadcrumbSchema, speakableSchema, faqPageSchema, itemListSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const revalidate = 43200;
interface Props { params: { city: string } }

const GOV_NAME_TERMS = ["- dubai health","- dha","ministry of health","government","public health protection","primary health","health center -","health centre -","tawam hospital","al ain hospital","al qassimi hospital","saqr hospital","fujairah hospital","dibba hospital","kalba hospital","khorfakkan hospital","masafi hospital","sheikh khalifa medical city","sheikh shakhbout","mafraq hospital","corniche hospital","kanad hospital","al dhafra hospital","al wagan hospital"];
const GOV_FT = ["primary healthcare"];

function isGov(name: string, ft: string): boolean { const n = name.toLowerCase(); const f = ft.toLowerCase(); return GOV_NAME_TERMS.some((t) => n.includes(t)) || GOV_FT.some((t) => f.includes(t)); }
function getGovProviders(citySlug: string) { const { providers } = getProviders({ citySlug, limit: 99999 }); return providers.filter((p) => isGov(p.name, p.facilityType || "")); }

export function generateStaticParams() { return getCities().filter((c) => getGovProviders(c.slug).length > 0).map((c) => ({ city: c.slug })); }

function getRegulatorName(s: string): string { if (s === "dubai") return "the Dubai Health Authority (DHA)"; if (s === "abu-dhabi" || s === "al-ain") return "the Department of Health (DOH)"; return "the Ministry of Health and Prevention (MOHAP)"; }
function getRegulatorShort(s: string): string { if (s === "dubai") return "DHA"; if (s === "abu-dhabi" || s === "al-ain") return "DOH"; return "MOHAP"; }
function getGovOperator(s: string): string { if (s === "dubai") return "Dubai Health (formerly DHA)"; if (s === "abu-dhabi" || s === "al-ain") return "SEHA (Abu Dhabi Health Services Company) under the DOH"; return "the Ministry of Health and Prevention (MOHAP)"; }

export function generateMetadata({ params }: Props): Metadata {
  const city = getCityBySlug(params.city); if (!city) return {};
  const count = getGovProviders(city.slug).length; const base = getBaseUrl(); const url = `${base}/directory/${city.slug}/government`;
  return {
    title: `Government Healthcare Facilities in ${city.name}, UAE | ${count} Public Facilities`,
    description: `Find ${count} government and public healthcare facilities in ${city.name}, UAE. Browse government hospitals, primary health centers, and public clinics operated by ${getRegulatorShort(city.slug)}. Updated March 2026.`,
    alternates: { canonical: url },
    openGraph: { title: `Government Healthcare Facilities in ${city.name}, UAE`, description: `${count} government hospitals and public health centers in ${city.name}.`, type: "website", locale: "en_AE", siteName: "UAE Open Healthcare Directory", url },
  };
}

export default function GovernmentPage({ params }: Props) {
  const city = getCityBySlug(params.city); if (!city) notFound();
  const govProviders = getGovProviders(city.slug); if (govProviders.length === 0) notFound();
  const base = getBaseUrl(); const regulator = getRegulatorName(city.slug); const regulatorShort = getRegulatorShort(city.slug); const govOperator = getGovOperator(city.slug); const count = govProviders.length;
  const hospitals = govProviders.filter((p) => (p.facilityType || "").toLowerCase().includes("hospital"));
  const primaryCare = govProviders.filter((p) => { const ft = (p.facilityType || "").toLowerCase(); const n = p.name.toLowerCase(); return ft.includes("primary healthcare") || n.includes("primary health") || n.includes("health center") || n.includes("health centre"); });
  const sorted = [...govProviders].sort((a, b) => { const r = Number(b.googleRating) - Number(a.googleRating); return r !== 0 ? r : (b.googleReviewCount || 0) - (a.googleReviewCount || 0); });
  const ratedProviders = sorted.filter((p) => Number(p.googleRating) > 0);
  const faqs = [
    { question: `How many government healthcare facilities are there in ${city.name}?`, answer: `According to the UAE Open Healthcare Directory, there are ${count} government and public healthcare facilities in ${city.name}, UAE. These include government hospitals, primary healthcare centers, and specialized public health facilities operated by ${govOperator}. Data sourced from official government registers, last verified March 2026.` },
    { question: `Are government hospitals in ${city.name} free?`, answer: `Government healthcare in the UAE is subsidized but not entirely free. UAE nationals receive free or heavily subsidized treatment. Expatriates with valid health insurance pay reduced co-payments. Uninsured patients pay out-of-pocket at government-set rates, typically 30-50% lower than private hospital fees.` },
    { question: `What services do government hospitals in ${city.name} offer?`, answer: `Government hospitals in ${city.name} offer comprehensive services including emergency care (24/7), inpatient and outpatient care, surgical services, maternity and obstetrics, pediatrics, radiology and imaging, laboratory diagnostics, pharmacy services, and specialist consultations.` },
    { question: `How do I get an appointment at a government hospital in ${city.name}?`, answer: `Appointments at government hospitals in ${city.name} can be booked through ${city.slug === "dubai" ? "the DHA app or by calling the hospital directly" : city.slug === "abu-dhabi" || city.slug === "al-ain" ? "the SEHA app or by calling the hospital directly" : "the MOHAP app or by calling the facility directly"}. Emergency departments accept walk-ins 24/7.` },
    { question: `What insurance is accepted at government facilities in ${city.name}?`, answer: `Government facilities in ${city.name} typically accept ${city.slug === "dubai" ? "DHA Essential Benefits Plan, Daman, and most major insurance plans" : city.slug === "abu-dhabi" || city.slug === "al-ain" ? "Thiqa (for UAE nationals), Daman, and most DOH-recognized insurance plans" : "MOHAP-recognized insurance plans, Daman, and major providers"}.` },
    { question: `What are the wait times at government hospitals in ${city.name}?`, answer: `Emergency departments provide immediate triage for critical cases. Non-critical emergencies: 30-120 minutes. Outpatient specialist appointments: 1-4 weeks. Primary healthcare centers: 15-45 minutes for walk-ins.` },
  ];

  const renderRow = (provider: typeof govProviders[0], index: number, badge: string) => (
    <li key={provider.id} className="article-row">
      <span className="text-2xl font-bold text-accent leading-none mt-0.5 w-8 shrink-0 text-center">{String(index + 1).padStart(2, "0")}</span>
      <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-4 flex-wrap"><div className="flex-1 min-w-0">
        <Link href={`/directory/${provider.citySlug}/${provider.categorySlug}/${provider.slug}`} className="font-bold text-dark hover:text-accent transition-colors">{provider.name}</Link>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {Number(provider.googleRating) > 0 && <span className="text-xs font-semibold text-accent">{provider.googleRating}/5</span>}
          {provider.googleReviewCount > 0 && <span className="text-xs text-muted">{provider.googleReviewCount.toLocaleString()} reviews</span>}
          {provider.facilityType && <span className="text-xs text-muted">{provider.facilityType}</span>}
          {provider.phone && <a href={`tel:${provider.phone.replace(/[^+\d]/g, "")}`} className="text-xs text-muted hover:text-accent transition-colors">{provider.phone}</a>}
        </div>
        {provider.address && <p className="text-xs text-muted mt-1 line-clamp-1">{provider.address}</p>}
      </div><div className="shrink-0"><span className="badge">{badge}</span></div></div></div>
    </li>
  );

  return (
    <>
      <div className="container-tc py-8">
        <JsonLd data={breadcrumbSchema([{ name: "UAE", url: base }, { name: city.name, url: `${base}/directory/${city.slug}` }, { name: "Government Facilities", url: `${base}/directory/${city.slug}/government` }])} />
        <JsonLd data={speakableSchema([".answer-block"])} />
        <JsonLd data={faqPageSchema(faqs)} />
        {ratedProviders.length >= 3 && <JsonLd data={itemListSchema(`Government Healthcare Facilities in ${city.name}`, ratedProviders.slice(0, 10), city.name, base)} />}
        <Breadcrumb items={[{ label: "UAE", href: "/" }, { label: city.name, href: `/directory/${city.slug}` }, { label: "Government Facilities" }]} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-3">Government Healthcare Facilities in {city.name}, UAE</h1>
          <p className="text-muted leading-relaxed mb-4">{city.name} has {count} government and public healthcare facilities operated by {govOperator}. These include government hospitals, primary healthcare centers, and specialized public health services. Healthcare in {city.name} is regulated by {regulator}.</p>
          <div className="answer-block mb-6" data-answer-block="true">
            <p className="text-muted leading-relaxed">
              According to the UAE Open Healthcare Directory, there are {count} government healthcare facilities in {city.name}.
              {hospitals.length > 0 && ` This includes ${hospitals.length} government hospital${hospitals.length === 1 ? "" : "s"}`}
              {primaryCare.length > 0 && ` and ${primaryCare.length} primary healthcare center${primaryCare.length === 1 ? "" : "s"}`}.
              Government facilities in {city.name} are operated by {govOperator}. UAE nationals receive subsidized or free treatment; expatriates are covered through employer-provided insurance or pay government-set rates.
              {ratedProviders.length > 0 && ratedProviders[0] && (<> The highest-rated government facility is <strong>{ratedProviders[0].name}</strong>{Number(ratedProviders[0].googleRating) > 0 ? ` with a ${ratedProviders[0].googleRating}-star Google rating` : ""}.</>)}{" "}
              All listings are sourced from official {regulatorShort} registers, last verified March 2026.
            </p>
          </div>
        </div>
        {hospitals.length > 0 && (
          <section className="mb-10">
            <div className="section-header"><h2>Government Hospitals in {city.name}</h2><span className="arrows">&gt;&gt;&gt;</span></div>
            <ol className="space-y-0">{[...hospitals].sort((a, b) => Number(b.googleRating) - Number(a.googleRating) || (b.googleReviewCount || 0) - (a.googleReviewCount || 0)).map((p, i) => renderRow(p, i, "Government"))}</ol>
          </section>
        )}
        {primaryCare.length > 0 && (
          <section className="mb-10">
            <div className="section-header"><h2>Primary Healthcare Centers in {city.name}</h2><span className="arrows">&gt;&gt;&gt;</span></div>
            <ol className="space-y-0">{[...primaryCare].sort((a, b) => a.name.localeCompare(b.name)).map((p, i) => renderRow(p, i, "Public"))}</ol>
          </section>
        )}
        {(() => { const hIds = new Set(hospitals.map((p) => p.id)); const pIds = new Set(primaryCare.map((p) => p.id)); const others = sorted.filter((p) => !hIds.has(p.id) && !pIds.has(p.id));
          return others.length > 0 ? (<section className="mb-10"><div className="section-header"><h2>Other Government Health Services in {city.name}</h2><span className="arrows">&gt;&gt;&gt;</span></div><ol className="space-y-0">{others.map((p, i) => renderRow(p, i, "Government"))}</ol></section>) : null;
        })()}
        <section className="mb-10"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href={`/directory/${city.slug}`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"><span className="font-medium">All Providers</span><span className="text-xs text-muted">{city.name}</span></Link>
          <Link href={`/directory/${city.slug}/walk-in`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"><span className="font-medium">Walk-In Clinics</span><span className="text-xs text-muted">No appointment needed</span></Link>
          <Link href={`/directory/${city.slug}/insurance`} className="flex items-center justify-between bg-light-50 border border-light-200 px-4 py-3 text-sm text-dark hover:border-accent hover:bg-accent-muted transition-colors"><span className="font-medium">By Insurance</span><span className="text-xs text-muted">Daman, Thiqa, AXA...</span></Link>
        </div></section>
        <FaqSection faqs={faqs} title={`Government Healthcare in ${city.name} — FAQ`} />
      </div>
    </>
  );
}
