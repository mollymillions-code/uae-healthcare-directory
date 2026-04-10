"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CITIES } from "@/lib/constants/cities";
import { COUNTRIES } from "@/lib/constants/countries";

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
    <footer className="bg-dark text-white mt-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        {/* Top — logo + tagline */}
        <div className="flex items-center gap-3 mb-8">
          <span className="bg-[#006828] w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
            Z
          </span>
          <span className="font-bold text-lg">{directoryTitle}</span>
        </div>

        {/* Columns — 5 columns: Cities, Services, Directory, Data Sources, Insights */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 border-t border-white/10 pt-8 mb-8">
          <div>
            <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Cities</h5>
            <ul className="space-y-2">
              {footerCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`${cityLinkPrefix}/${city.slug}`} className="text-sm text-white/60 hover:text-white transition-colors">
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Services</h5>
            <ul className="space-y-2">
              <li><Link href="/professionals" className="text-sm text-white/60 hover:text-white transition-colors">Healthcare Professionals</Link></li>
              <li><Link href="/find-a-doctor" className="text-sm text-white/60 hover:text-white transition-colors">Find a Doctor</Link></li>
              <li><Link href="/best/doctors" className="text-sm text-white/60 hover:text-white transition-colors">Best Doctors</Link></li>
              <li><Link href="/workforce" className="text-sm text-white/60 hover:text-white transition-colors">Workforce Intelligence</Link></li>
              <li><Link href="/labs" className="text-sm text-white/60 hover:text-white transition-colors">Labs &amp; Diagnostics</Link></li>
              <li><Link href="/insurance" className="text-sm text-white/60 hover:text-white transition-colors">Insurance Navigator</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Medical Pricing</Link></li>
              <li><Link href="/ar" className="text-sm text-white/60 hover:text-white transition-colors">النسخة العربية</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Directory</h5>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-sm text-white/60 hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/directory/dubai/top/hospitals" className="text-sm text-white/60 hover:text-white transition-colors">Top Rated</Link></li>
              <li><Link href="/claim" className="text-sm text-white/60 hover:text-white transition-colors">Claim Listing</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/api/search" className="text-sm text-white/60 hover:text-white transition-colors">API</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/directory-skill.md" className="text-sm text-white/60 hover:text-white transition-colors">Developers</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Data Sources</h5>
            <ul className="space-y-2">
              {dataSources.map((source) => (
                <li key={source}><span className="text-sm text-white/60">{source}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-4">Insights</h5>
            <ul className="space-y-2">
              <li><Link href="/intelligence" className="text-sm text-white/60 hover:text-white transition-colors">Industry Insights</Link></li>
              <li><Link href="/research" className="text-sm text-white/60 hover:text-white transition-colors">Research Reports</Link></li>
              <li><span className="text-sm text-white/60">Newsletter</span></li>
              <li><Link href="/intelligence/feed.xml" className="text-sm text-white/60 hover:text-white transition-colors">RSS Feed</Link></li>
              <li><Link href="/editorial-policy" className="text-sm text-white/60 hover:text-white transition-colors">Editorial Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Cross-country GCC directories — helps Google discover all country directories */}
        <div className="border-t border-white/10 pt-6 pb-4">
          <h5 className="text-xs font-bold text-[#006828] uppercase tracking-wider mb-3">
            Healthcare Directories Across the GCC
          </h5>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/directory" className="text-white/60 hover:text-white transition-colors">
              UAE Healthcare Directory
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/sa/directory" className="text-white/60 hover:text-white transition-colors">
              Saudi Arabia Healthcare Directory
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/qa/directory" className="text-white/60 hover:text-white transition-colors">
              Qatar Healthcare Directory
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/bh/directory" className="text-white/60 hover:text-white transition-colors">
              Bahrain Healthcare Directory
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/kw/directory" className="text-white/60 hover:text-white transition-colors">
              Kuwait Healthcare Directory
            </Link>
          </div>
        </div>

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
