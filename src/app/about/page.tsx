import { Metadata } from "next";
import Link from "next/link";
import { Database, Globe, ArrowRight, CheckCircle, Zap, Eye, Search } from "lucide-react";
import { getBaseUrl } from "@/lib/helpers";
import { getCities, getCategories, getProviders, getProviderCountByCity } from "@/lib/data";

export const metadata: Metadata = {
  title: "About the UAE Open Healthcare Directory",
  description: "The UAE Open Healthcare Directory is a free, comprehensive healthcare provider directory for all UAE residents. 12,500+ providers across 8 cities.",
  alternates: {
    canonical: `${getBaseUrl()}/about`,
    languages: { 'en-AE': `${getBaseUrl()}/about`, 'ar-AE': `${getBaseUrl()}/ar/about` },
  },
};

export default function AboutPage() {
  const cities = getCities();
  const categories = getCategories();
  const { total: totalProviders } = getProviders({ limit: 1 });
  const cityData = cities.map(c => ({ name: c.name, count: getProviderCountByCity(c.slug), slug: c.slug })).sort((a, b) => b.count - a.count);
  const maxCount = cityData[0]?.count || 1;

  return (
    <>
      {/* ─── Hero: Full-width dark section with big numbers ─── */}
      <section className="bg-dark text-white">
        <div className="container-tc py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-accent text-xs font-bold uppercase tracking-wider mb-4">About the Directory</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              The UAE&rsquo;s healthcare system is world-class.<br />
              <span className="text-accent">Finding a provider shouldn&rsquo;t be hard.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
              We scraped every official government health register — DHA, DOH, and MOHAP — and
              built the most comprehensive, free, and open healthcare directory in the United Arab Emirates.
              No login. No paywall. No booking fees. Just data.
            </p>
          </div>

          {/* Stats counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 pt-8 border-t border-white/10">
            {[
              { number: totalProviders.toLocaleString() + "+", label: "Licensed Providers", sub: "Across all 7 emirates" },
              { number: "8", label: "Cities Covered", sub: "Dubai to Umm Al Quwain" },
              { number: categories.length.toString(), label: "Medical Specialties", sub: "From hospitals to home care" },
              { number: "3", label: "Official Sources", sub: "DHA · DOH · MOHAP" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-bold text-accent">{s.number}</p>
                <p className="text-white font-bold text-sm mt-1">{s.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Problem / Why This Exists ─── */}
      <section className="container-tc py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-accent text-xs font-bold uppercase tracking-wider mb-3">The Problem</p>
            <h2 className="text-3xl font-bold text-dark mb-6">
              10 million residents.<br />Zero unified directory.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              The UAE has one of the most advanced healthcare systems in the Middle East. But finding a provider?
              That meant navigating three separate government portals with terrible UX, relying on outdated
              blog posts, or trusting whatever Google surfaced first.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Expats arriving in Dubai had no way to search by area and insurance. Parents in Sharjah
              couldn&rsquo;t find pediatricians near their home. Residents in Ras Al Khaimah were essentially
              invisible to every major healthcare directory.
            </p>
            <p className="text-muted leading-relaxed">
              When someone asked an AI assistant &ldquo;find me a dentist in Dubai Marina,&rdquo; there was no
              authoritative source to cite. We built one.
            </p>
          </div>

          {/* Data bar chart — providers by city */}
          <div className="bg-light-50 border border-light-200 p-6 sm:p-8">
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-6">Providers by Emirate</p>
            <div className="space-y-4">
              {cityData.map((city) => (
                <div key={city.slug}>
                  <div className="flex justify-between items-baseline mb-1">
                    <Link href={`/directory/${city.slug}`} className="text-sm font-bold text-dark hover:text-accent transition-colors">
                      {city.name}
                    </Link>
                    <span className="text-xs text-muted font-mono">{city.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-light-200 h-2">
                    <div
                      className="bg-accent h-2 transition-all"
                      style={{ width: `${Math.max(3, (city.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-6">
              Data as of March 2026. Updated monthly from official registers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── How We Got the Data ─── */}
      <section className="bg-dark text-white">
        <div className="container-tc py-16">
          <p className="text-accent text-xs font-bold uppercase tracking-wider mb-3">Methodology</p>
          <h2 className="text-3xl font-bold mb-12">
            Three government sources.<br />One unified directory.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                source: "DHA",
                full: "Dubai Health Authority",
                covers: "Dubai",
                count: getProviderCountByCity("dubai"),
                detail: "Scraped from the Sheryan Medical Directory REST API. 58 pages of facility data including names, categories, coordinates, and areas. Enriched with street-level addresses via the fetchfacility endpoint.",
                color: "bg-accent",
              },
              {
                source: "DOH",
                full: "Department of Health Abu Dhabi",
                covers: "Abu Dhabi & Al Ain",
                count: getProviderCountByCity("abu-dhabi") + getProviderCountByCity("al-ain"),
                detail: "Extracted from TAMM Abu Dhabi government services platform. API pagination through 402 pages. Rich data: license numbers, Arabic names, phone, email, opening hours, insurance acceptance, bed counts.",
                color: "bg-accent",
              },
              {
                source: "MOHAP",
                full: "Ministry of Health & Prevention",
                covers: "Sharjah, Ajman, RAK, Fujairah, UAQ",
                count: getProviderCountByCity("sharjah") + getProviderCountByCity("ajman") + getProviderCountByCity("ras-al-khaimah") + getProviderCountByCity("fujairah") + getProviderCountByCity("umm-al-quwain"),
                detail: "Scraped 330 pages of the MOHAP medical facilities directory via headless browser automation. Facility names, types, specialties, and emirate classification.",
                color: "bg-accent",
              },
            ].map((src, i) => (
              <div key={i} className="border border-white/10 p-6">
                <div className={`${src.color} text-white text-xs font-bold px-2 py-1 inline-block mb-4 uppercase tracking-wider`}>
                  {src.source}
                </div>
                <h3 className="text-xl font-bold mb-1">{src.full}</h3>
                <p className="text-white/50 text-sm mb-3">Covers: {src.covers}</p>
                <p className="text-3xl font-bold text-accent mb-4">{src.count.toLocaleString()}</p>
                <p className="text-white/60 text-sm leading-relaxed">{src.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What Makes This Different ─── */}
      <section className="container-tc py-16">
        <p className="text-accent text-xs font-bold uppercase tracking-wider mb-3">Why This Directory</p>
        <h2 className="text-3xl font-bold text-dark mb-12">
          Built for patients. Optimized for AI.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Database className="h-5 w-5" />, title: "Government-Sourced", desc: "Every listing comes from DHA, DOH, or MOHAP official registers. Not user-submitted. Not scraped from Google." },
            { icon: <Globe className="h-5 w-5" />, title: "All 7 Emirates", desc: "The only directory that comprehensively covers Dubai, Abu Dhabi, Sharjah, AND the Northern Emirates. Fujairah and UAQ exist too." },
            { icon: <Search className="h-5 w-5" />, title: "AEO Optimized", desc: "Every page is structured so AI assistants (ChatGPT, Perplexity, Claude, Gemini) can cite it directly. Schema.org markup on every listing." },
            { icon: <Eye className="h-5 w-5" />, title: "Free & Open", desc: "No login wall. No paywall. No booking fees. No upsells. The directory is and will remain free for all UAE residents." },
            { icon: <Zap className="h-5 w-5" />, title: "25,000+ Static Pages", desc: "Every city × area × specialty permutation has its own pre-rendered page. Fast loading, fully indexed, always available." },
            { icon: <CheckCircle className="h-5 w-5" />, title: "Claim & Correct", desc: "Healthcare providers can claim their listing and request corrections. We verify with license numbers and update within 48 hours." },
          ].map((f, i) => (
            <div key={i} className="border-t-2 border-accent pt-4">
              <div className="text-accent mb-3">{f.icon}</div>
              <h3 className="font-bold text-dark text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── By Zavis ─── */}
      <section className="bg-light-50 border-t border-b border-light-200">
        <div className="container-tc py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent text-xs font-bold uppercase tracking-wider mb-3">Built By</p>
              <h2 className="text-3xl font-bold text-dark mb-4">Zavis</h2>
              <p className="text-muted leading-relaxed mb-4">
                Zavis is an AI-powered patient success platform for UAE private healthcare.
                We help clinics, hospitals, and dental practices automate patient communication,
                reduce no-shows, and grow their practice through WhatsApp, SMS, and voice AI.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                The UAE Open Healthcare Directory is our contribution to the healthcare
                ecosystem — a free public good that makes the market more transparent for
                patients and more discoverable for providers.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://zavis.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent"
                >
                  Visit zavis.ai
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
                <Link href="/claim" className="btn-dark">
                  Claim Your Listing
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "14", label: "Healthcare Clients" },
                { stat: "5", label: "AI Agents" },
                { stat: "AED 899", label: "Starting Price/mo" },
                { stat: "UAE", label: "Headquartered" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-light-200 p-5">
                  <p className="text-2xl font-bold text-accent">{s.stat}</p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-accent">
        <div className="container-tc py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Start searching. It&rsquo;s free.
          </h2>
          <p className="text-white/80 mb-6">
            {totalProviders.toLocaleString()}+ providers. {cities.length} cities. {categories.length} specialties.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/search" className="bg-white text-accent font-bold px-6 py-3 text-sm hover:bg-light-50 transition-colors inline-flex items-center">
              Search Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link href="/directory/dubai" className="border-2 border-white text-white font-bold px-6 py-3 text-sm hover:bg-white hover:text-accent transition-colors inline-flex items-center">
              Browse Dubai
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
