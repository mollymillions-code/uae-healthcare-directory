"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CITIES } from "@/lib/constants/cities";
import { COUNTRIES } from "@/lib/constants/countries";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";
import {
  VideoFooterShell,
  videoFooterHeadingClass,
  videoFooterLinkClass,
  videoFooterMutedClass,
} from "@/components/layout/VideoFooterShell";

function useFooterCountry(pathname: string) {
  return useMemo(() => {
    const match = pathname.match(/^\/(qa|sa|bh|kw|tr)(\/|$)/);
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
  const dataSources = countryCtx
    ? [...countryCtx.regulators, "Google Places"]
    : ["Official UAE healthcare licensing data", "Google Places"];

  return (
    <VideoFooterShell
      compact
      compactDensity="dense"
      brand={
        <div>
          <Link
            href={countryCtx ? `/${countryCtx.code}/directory` : "/directory"}
            className="inline-flex rounded font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006828] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f2]"
          >
            zavis<span className="text-[#006828]">.</span>
          </Link>
          <p className="mt-2 font-['Geist',sans-serif] text-xs font-semibold uppercase text-[#006828]">
            {directoryTitle}
          </p>
        </div>
      }
      description={
        countryCtx
          ? `Open healthcare discovery for ${countryCtx.name}, built from regulator and location data.`
          : "Open healthcare discovery for the UAE, built from regulator and location data."
      }
      bottom={
        <div className="flex flex-col gap-3 font-['Geist',sans-serif] text-xs text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {copyrightName}.
          </span>
          <span>
            by{" "}
            <a href="https://www.zavis.ai" className="text-[#006828] transition-colors hover:text-[#008a35]" target="_blank" rel="noopener noreferrer">
              Zavis
            </a>
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="z-no-scrollbar grid grid-flow-col auto-cols-[calc((100%_-_1.5rem)/2)] gap-6 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          <nav aria-labelledby="footer-cities-heading">
            <h3 id="footer-cities-heading" className={videoFooterHeadingClass}>Cities</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              {footerCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`${cityLinkPrefix}/${city.slug}`} className={videoFooterLinkClass}>
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-services-heading">
            <h3 id="footer-services-heading" className={videoFooterHeadingClass}>Services</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              <li><Link href="/professionals" className={videoFooterLinkClass}>Healthcare Professionals</Link></li>
              <li><Link href="/find-a-doctor" className={videoFooterLinkClass}>Find a Doctor</Link></li>
              <li><Link href="/best/doctors" className={videoFooterLinkClass}>Best Doctors</Link></li>
              <li><Link href="/workforce" className={videoFooterLinkClass}>Workforce Intelligence</Link></li>
              <li><Link href="/labs" className={videoFooterLinkClass}>Labs &amp; Diagnostics</Link></li>
              <li><Link href="/insurance" className={videoFooterLinkClass}>Insurance Navigator</Link></li>
              <li><Link href="/pricing" className={videoFooterLinkClass}>Medical Pricing</Link></li>
              <li><Link href="/ar" hrefLang="ar" lang="ar" className={videoFooterLinkClass}>النسخة العربية</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-directory-heading">
            <h3 id="footer-directory-heading" className={videoFooterHeadingClass}>Directory</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              <li><Link href="/find-a-doctor" className={videoFooterLinkClass}>Find a Doctor</Link></li>
              <li><Link href="/directory/dubai/top/hospitals" className={videoFooterLinkClass}>Top Rated</Link></li>
              <li><Link href="/tools" className={videoFooterLinkClass}>Free Tools for Clinics</Link></li>
              <li>
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="directory_footer_owner_cta"
                  label="Get listed or edit"
                  variant="link"
                  className="!text-black/55 hover:!text-[#006828] text-sm"
                />
              </li>
              <li><Link href="/verified-reviews" className={videoFooterLinkClass}>Verified Reviews</Link></li>
              <li><Link href="/about" className={videoFooterLinkClass}>About</Link></li>
              <li><Link href="/accessibility" className={videoFooterLinkClass}>Accessibility</Link></li>
              <li><Link href="/privacy-policy" className={videoFooterLinkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={videoFooterLinkClass}>Terms of Service</Link></li>
            </ul>
          </nav>
          <section aria-labelledby="footer-sources-heading">
            <h3 id="footer-sources-heading" className={videoFooterHeadingClass}>Data Sources</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              {dataSources.map((source) => (
                <li key={source}><span className={videoFooterMutedClass}>{source}</span></li>
              ))}
            </ul>
          </section>
          <nav aria-labelledby="footer-insights-heading">
            <h3 id="footer-insights-heading" className={videoFooterHeadingClass}>Insights</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              <li><Link href="/intelligence" className={videoFooterLinkClass}>Industry Insights</Link></li>
              <li><Link href="/intelligence/reports" className={videoFooterLinkClass}>Intelligence Reports</Link></li>
              <li><Link href="/intelligence/press" className={videoFooterLinkClass}>Press Room</Link></li>
              <li><Link href="/intelligence/author" className={videoFooterLinkClass}>Masthead</Link></li>
              <li><Link href="/research" className={videoFooterLinkClass}>Research Reports</Link></li>
              <li><span className={videoFooterMutedClass}>Newsletter</span></li>
              <li><Link href="/intelligence/feed.xml" className={videoFooterLinkClass}>RSS Feed</Link></li>
            </ul>
          </nav>
        </div>

        <nav aria-labelledby="footer-trust-heading-compact" className="border-t border-black/10 pt-4">
          <h3 id="footer-trust-heading-compact" className={videoFooterHeadingClass}>
            Editorial Trust &amp; Transparency
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-['Geist',sans-serif]">
            <Link href="/editorial-policy" className={videoFooterLinkClass}>
              Editorial Policy
            </Link>
            <Link href="/methodology" className={videoFooterLinkClass}>
              Methodology
            </Link>
            <Link href="/data-sources" className={videoFooterLinkClass}>
              Data Sources
            </Link>
            <Link href="/about/corrections" className={videoFooterLinkClass}>
              Corrections Policy
            </Link>
            <Link href="/intelligence/author" className={videoFooterLinkClass}>
              Masthead
            </Link>
          </div>
        </nav>

        <nav aria-labelledby="footer-gcc-heading-compact" className="border-t border-black/10 pt-4">
          <h3 id="footer-gcc-heading-compact" className={videoFooterHeadingClass}>
            Healthcare Directories Across the GCC &amp; Turkey
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-['Geist',sans-serif]">
            <Link href="/directory" className={videoFooterLinkClass}>
              UAE Healthcare Directory
            </Link>
            <Link href="/sa/directory" className={videoFooterLinkClass}>
              Saudi Arabia Healthcare Directory
            </Link>
            <Link href="/qa/directory" className={videoFooterLinkClass}>
              Qatar Healthcare Directory
            </Link>
            <Link href="/bh/directory" className={videoFooterLinkClass}>
              Bahrain Healthcare Directory
            </Link>
            <Link href="/kw/directory" className={videoFooterLinkClass}>
              Kuwait Healthcare Directory
            </Link>
            <Link href="/tr/directory" className={videoFooterLinkClass}>
              Turkey Healthcare Directory
            </Link>
          </div>
        </nav>
      </div>
    </VideoFooterShell>
  );
}
