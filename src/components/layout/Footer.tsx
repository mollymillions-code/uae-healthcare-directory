import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";
import { OwnerWhatsappCta } from "@/components/owner/OwnerWhatsappCta";
import {
  VideoFooterShell,
  videoFooterHeadingClass,
  videoFooterLinkClass,
  videoFooterMutedClass,
} from "@/components/layout/VideoFooterShell";

const footerCities = CITIES.filter((city) => city.country === "ae");
const dataSources = [
  "Official healthcare licensing data",
  "Google Places",
  "Provider websites",
];

export function Footer() {
  return (
    <VideoFooterShell
      compact
      compactDensity="dense"
      brand={
        <div>
          <Link
            href="/directory"
            prefetch={false}
            className="inline-flex rounded font-['Bricolage_Grotesque',sans-serif] text-3xl font-semibold text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006828] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f2]"
          >
            zavis<span className="text-[#006828]">.</span>
          </Link>
          <p className="mt-2 font-['Geist',sans-serif] text-xs font-semibold uppercase text-[#006828]">
            Healthcare Directory
          </p>
        </div>
      }
      description="Open healthcare discovery across the UAE, GCC and Turkey, built from regulator and location data."
      bottom={
        <div className="flex flex-col gap-3 font-['Geist',sans-serif] text-xs text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} UAE Open Healthcare Directory.
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
                  <Link href={`/directory/${city.slug}`} prefetch={false} className={videoFooterLinkClass}>
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-services-heading">
            <h3 id="footer-services-heading" className={videoFooterHeadingClass}>Services</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              <li><Link href="/professionals" prefetch={false} className={videoFooterLinkClass}>Healthcare Professionals</Link></li>
              <li><Link href="/find-a-doctor" prefetch={false} className={videoFooterLinkClass}>Find a Doctor</Link></li>
              <li><Link href="/best/doctors" prefetch={false} className={videoFooterLinkClass}>Best Doctors</Link></li>
              <li><Link href="/workforce" prefetch={false} className={videoFooterLinkClass}>Workforce Intelligence</Link></li>
              <li><Link href="/labs" prefetch={false} className={videoFooterLinkClass}>Labs &amp; Diagnostics</Link></li>
              <li><Link href="/insurance" prefetch={false} className={videoFooterLinkClass}>Insurance Navigator</Link></li>
              <li><Link href="/pricing" prefetch={false} className={videoFooterLinkClass}>Medical Pricing</Link></li>
              <li><Link href="/ar" prefetch={false} hrefLang="ar" lang="ar" className={videoFooterLinkClass}>النسخة العربية</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-directory-heading">
            <h3 id="footer-directory-heading" className={videoFooterHeadingClass}>Directory</h3>
            <ul className="space-y-1 font-['Geist',sans-serif]">
              <li><Link href="/find-a-doctor" prefetch={false} className={videoFooterLinkClass}>Find a Doctor</Link></li>
              <li><Link href="/directory/dubai/top/hospitals" prefetch={false} className={videoFooterLinkClass}>Top Rated</Link></li>
              <li><Link href="/tools" prefetch={false} className={videoFooterLinkClass}>Free Tools for Clinics</Link></li>
              <li>
                <OwnerWhatsappCta
                  action="get_listed"
                  surface="directory_footer_owner_cta"
                  label="Get listed or edit"
                  variant="link"
                  className="!text-black/55 hover:!text-[#006828] text-sm"
                />
              </li>
              <li><Link href="/verified-reviews" prefetch={false} className={videoFooterLinkClass}>Verified Reviews</Link></li>
              <li><Link href="/about" prefetch={false} className={videoFooterLinkClass}>About</Link></li>
              <li><Link href="/accessibility" prefetch={false} className={videoFooterLinkClass}>Accessibility</Link></li>
              <li><Link href="/privacy-policy" prefetch={false} className={videoFooterLinkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" prefetch={false} className={videoFooterLinkClass}>Terms of Service</Link></li>
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
              <li><Link href="/intelligence" prefetch={false} className={videoFooterLinkClass}>Industry Insights</Link></li>
              <li><Link href="/intelligence/reports" prefetch={false} className={videoFooterLinkClass}>Intelligence Reports</Link></li>
              <li><Link href="/intelligence/press" prefetch={false} className={videoFooterLinkClass}>Press Room</Link></li>
              <li><Link href="/intelligence/author" prefetch={false} className={videoFooterLinkClass}>Masthead</Link></li>
              <li><Link href="/research" prefetch={false} className={videoFooterLinkClass}>Research Reports</Link></li>
              <li><span className={videoFooterMutedClass}>Newsletter</span></li>
              <li><Link href="/intelligence/feed.xml" prefetch={false} className={videoFooterLinkClass}>RSS Feed</Link></li>
            </ul>
          </nav>
        </div>

        <nav aria-labelledby="footer-trust-heading-compact" className="border-t border-black/10 pt-4">
          <h3 id="footer-trust-heading-compact" className={videoFooterHeadingClass}>
            Editorial Trust &amp; Transparency
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-['Geist',sans-serif]">
            <Link href="/editorial-policy" prefetch={false} className={videoFooterLinkClass}>
              Editorial Policy
            </Link>
            <Link href="/methodology" prefetch={false} className={videoFooterLinkClass}>
              Methodology
            </Link>
            <Link href="/data-sources" prefetch={false} className={videoFooterLinkClass}>
              Data Sources
            </Link>
            <Link href="/about/corrections" prefetch={false} className={videoFooterLinkClass}>
              Corrections Policy
            </Link>
            <Link href="/intelligence/author" prefetch={false} className={videoFooterLinkClass}>
              Masthead
            </Link>
          </div>
        </nav>

        <nav aria-labelledby="footer-gcc-heading-compact" className="border-t border-black/10 pt-4">
          <h3 id="footer-gcc-heading-compact" className={videoFooterHeadingClass}>
            Healthcare Directories Across the GCC &amp; Turkey
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-['Geist',sans-serif]">
            <Link href="/directory" prefetch={false} className={videoFooterLinkClass}>
              UAE Healthcare Directory
            </Link>
            <Link href="/sa/directory" prefetch={false} className={videoFooterLinkClass}>
              Saudi Arabia Healthcare Directory
            </Link>
            <Link href="/qa/directory" prefetch={false} className={videoFooterLinkClass}>
              Qatar Healthcare Directory
            </Link>
            <Link href="/bh/directory" prefetch={false} className={videoFooterLinkClass}>
              Bahrain Healthcare Directory
            </Link>
            <Link href="/kw/directory" prefetch={false} className={videoFooterLinkClass}>
              Kuwait Healthcare Directory
            </Link>
            <Link href="/tr/directory" prefetch={false} className={videoFooterLinkClass}>
              Turkey Healthcare Directory
            </Link>
          </div>
        </nav>
      </div>
    </VideoFooterShell>
  );
}
