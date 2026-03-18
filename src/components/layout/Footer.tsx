import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";

export function Footer() {
  return (
    <footer className="bg-ink text-canvas mt-20">
      <div className="container-wide pt-20 pb-8">
        {/* Brand + columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-b border-white/10 pb-16 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <h2 className="font-display text-display-xl mb-4 uppercase">UAE<br />Health</h2>
            <p className="font-kicker text-gold tracking-[0.1em] text-xs uppercase">
              The definitive healthcare directory.
            </p>
          </div>

          <div>
            <h5 className="footer-col-heading">Cities</h5>
            <ul className="space-y-2">
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link href={`/uae/${city.slug}`} className="text-sm text-canvas/70 hover:text-canvas transition-colors">
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="footer-col-heading">Directory</h5>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-sm text-canvas/70 hover:text-canvas transition-colors">Search</Link></li>
              <li><Link href="/claim" className="text-sm text-canvas/70 hover:text-canvas transition-colors">Claim Listing</Link></li>
              <li><Link href="/about" className="text-sm text-canvas/70 hover:text-canvas transition-colors">About</Link></li>
              <li><Link href="/api/search" className="text-sm text-canvas/70 hover:text-canvas transition-colors">API</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-col-heading">Data Sources</h5>
            <ul className="space-y-2">
              <li><span className="text-sm text-canvas/70">DHA &mdash; Dubai</span></li>
              <li><span className="text-sm text-canvas/70">DOH &mdash; Abu Dhabi</span></li>
              <li><span className="text-sm text-canvas/70">MOHAP &mdash; Northern Emirates</span></li>
              <li><span className="text-sm text-canvas/70">Google Places</span></li>
            </ul>

            <h5 className="footer-col-heading mt-8">For AI Agents</h5>
            <ul className="space-y-2">
              <li><Link href="/directory-skill.md" className="text-sm text-canvas/70 hover:text-canvas transition-colors">Platform Guide</Link></li>
              <li><Link href="/sitemap.xml" className="text-sm text-canvas/70 hover:text-canvas transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="font-kicker text-[0.7rem] text-canvas/40 tracking-[0.05em]">
            &copy; {new Date().getFullYear()} UAE Healthcare Directory. Free for all UAE residents.
          </span>
          <span className="font-kicker text-[0.7rem] text-canvas/40 tracking-[0.05em]">
            by{" "}
            <a href="https://zavis.ae" className="hover:text-canvas transition-colors" target="_blank" rel="noopener noreferrer">
              Zavis
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
