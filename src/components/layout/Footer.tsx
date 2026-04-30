"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CITIES } from "@/lib/constants/cities";
import { COUNTRIES } from "@/lib/constants/countries";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";

function useFooterCountry(pathname: string) {
  return useMemo(() => {
    const match = pathname.match(/^\/(qa|sa|bh|kw)(\/|$)/);
    if (!match) return null;
    const code = match[1];
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return null;
    const cities = CITIES.filter((c) => c.country === code);
    return { code, name: country.name, cities, regulators: country.regulators };
  }, [pathname]);
}

export function Footer() {
  const pathname = usePathname();
  const countryCtx = useFooterCountry(pathname);

  const directoryTitle = countryCtx
    ? `${countryCtx.name} Open Healthcare Directory`
    : "UAE Open Healthcare Directory";
  const footerCities = countryCtx
    ? countryCtx.cities
    : CITIES.filter((c) => c.country === "ae");
  const cityLinkPrefix = countryCtx ? `/${countryCtx.code}/directory` : "/directory";
  const copyrightName = countryCtx
    ? `${countryCtx.name} Open Healthcare Directory`
    : "UAE Open Healthcare Directory";
  const residentsLabel = countryCtx
    ? `Free for all ${countryCtx.name} residents.`
    : "Free for all UAE residents.";
  const dataSources = countryCtx
    ? [...countryCtx.regulators, "Google Places"]
    : ["DHA — Dubai", "DOH — Abu Dhabi", "MOHAP — Northern Emirates", "Google Places"];

  return (
    <footer role="contentinfo" aria-label="Site footer" className="bg-dark text-white mt-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        {/* Top — logo + tagline */}
        <div className="flex items-center gap-3 mb-8">
          <span aria-hidden="true" className="bg-[#006828] w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
            Z
          </span>
          <span className="font-bold text-lg">{directoryTitle}</span>
        </div>

        {/* Columns — 5 columns: Cities, Services, Directory, Data Sources, Insights */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 border-t border-white/10 pt-8 mb-8">
          <nav aria-labelledby="footer-cities-heading">
            <h3 id="footer-cities-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Cities</h3>
            <ul className="space-y-2">
              {footerCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`${cityLinkPrefix}/${city.slug}`} className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-services-heading">
            <h3 id="footer-services-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/professionals" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Healthcare Professionals</Link></li>
              <li><Link href="/find-a-doctor" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Find a Doctor</Link></li>
              <li><Link href="/best/doctors" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Best Doctors</Link></li>
              <li><Link href="/workforce" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Workforce Intelligence</Link></li>
              <li><Link href="/labs" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Labs &amp; Diagnostics</Link></li>
              <li><Link href="/insurance" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Insurance Navigator</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Medical Pricing</Link></li>
              <li><Link href="/ar" hrefLang="ar" lang="ar" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">النسخة العربية</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-directory-heading">
            <h3 id="footer-directory-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Directory</h3>
            <ul className="space-y-2">
              <li><Link href="/find-a-doctor" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Find a Doctor</Link></li>
              <li><Link href="/directory/dubai/top/hospitals" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Top Rated</Link></li>
              <li>
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="directory_footer_owner_cta"
                  label="Get listed or edit"
                  variant="link"
                  className="text-white/60 hover:text-white"
                />
              </li>
              <li><Link href="/verified-reviews" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Verified Reviews</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">About</Link></li>
              <li><Link href="/accessibility" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Accessibility</Link></li>
              <li><Link href="/api/search" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">API</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </nav>
          <section aria-labelledby="footer-sources-heading">
            <h3 id="footer-sources-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Data Sources</h3>
            <ul className="space-y-2">
              {dataSources.map((source) => (
                <li key={source}><span className="text-sm text-white/60">{source}</span></li>
              ))}
            </ul>
          </section>
          <nav aria-labelledby="footer-insights-heading">
            <h3 id="footer-insights-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Insights</h3>
            <ul className="space-y-2">
              <li><Link href="/intelligence" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Industry Insights</Link></li>
              <li><Link href="/intelligence/reports" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Intelligence Reports</Link></li>
              <li><Link href="/intelligence/press" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Press Room</Link></li>
              <li><Link href="/intelligence/author" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Masthead</Link></li>
              <li><Link href="/research" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">Research Reports</Link></li>
              <li><span className="text-sm text-white/60">Newsletter</span></li>
              <li><Link href="/intelligence/feed.xml" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">RSS Feed</Link></li>
            </ul>
          </nav>
        </div>

        {/* Editorial trust + transparency rail (Item 5 — E-E-A-T leapfrog) */}
        <nav aria-labelledby="footer-trust-heading" className="border-t border-white/10 pt-6 pb-4">
          <h3 id="footer-trust-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-3">
            Editorial Trust &amp; Transparency
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/editorial-policy" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Editorial Policy
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/methodology" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Methodology
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/data-sources" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Data Sources
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/about/corrections" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Corrections Policy
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/intelligence/author" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Masthead
            </Link>
          </div>
        </nav>

        {/* Cross-country GCC directories — helps Google discover all country directories */}
        <nav aria-labelledby="footer-gcc-heading" className="border-t border-white/10 pt-6 pb-4">
          <h3 id="footer-gcc-heading" className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-3">
            Healthcare Directories Across the GCC
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/directory" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              UAE Healthcare Directory
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/sa/directory" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Saudi Arabia Healthcare Directory
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/qa/directory" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Qatar Healthcare Directory
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/bh/directory" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Bahrain Healthcare Directory
            </Link>
            <span aria-hidden="true" className="text-white/20">·</span>
            <Link href="/kw/directory" className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark rounded-sm transition-colors">
              Kuwait Healthcare Directory
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {copyrightName}. {residentsLabel}
          </span>
          <span className="text-xs text-white/40">
            by{" "}
            <a href="https://zavis.ai" className="text-[#006828] hover:text-[#008a35] transition-colors" target="_blank" rel="noopener noreferrer">
              Zavis
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
