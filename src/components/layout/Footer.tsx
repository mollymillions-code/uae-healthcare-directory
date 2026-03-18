import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";

export function Footer() {
  return (
    <footer className="bg-dark text-white mt-16">
      <div className="container-tc pt-12 pb-6">
        {/* Top — logo + tagline */}
        <div className="flex items-center gap-3 mb-8">
          <span className="bg-accent w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
            Z
          </span>
          <span className="font-bold text-lg">UAE Healthcare Directory</span>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 border-t border-white/10 pt-8 mb-8">
          <div>
            <h5 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">Cities</h5>
            <ul className="space-y-2">
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link href={`/directory/${city.slug}`} className="text-sm text-white/60 hover:text-white transition-colors">
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">Directory</h5>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-sm text-white/60 hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/claim" className="text-sm text-white/60 hover:text-white transition-colors">Claim Listing</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/api/search" className="text-sm text-white/60 hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">Data Sources</h5>
            <ul className="space-y-2">
              <li><span className="text-sm text-white/60">DHA — Dubai</span></li>
              <li><span className="text-sm text-white/60">DOH — Abu Dhabi</span></li>
              <li><span className="text-sm text-white/60">MOHAP — Northern Emirates</span></li>
              <li><span className="text-sm text-white/60">Google Places</span></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">Intelligence</h5>
            <ul className="space-y-2">
              <li><Link href="/intelligence" className="text-sm text-white/60 hover:text-white transition-colors">Intelligence Home</Link></li>
              <li><span className="text-sm text-white/60">Newsletter</span></li>
              <li><Link href="/intelligence/feed.xml" className="text-sm text-white/60 hover:text-white transition-colors">RSS Feed</Link></li>
              <li><Link href="/editorial-policy" className="text-sm text-white/60 hover:text-white transition-colors">Editorial Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold text-accent uppercase tracking-wider mb-4">For AI Agents</h5>
            <ul className="space-y-2">
              <li><Link href="/directory-skill.md" className="text-sm text-white/60 hover:text-white transition-colors">Platform Guide</Link></li>
              <li><Link href="/sitemap.xml" className="text-sm text-white/60 hover:text-white transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} UAE Healthcare Directory &amp; Intelligence. Free for all UAE residents.
          </span>
          <span className="text-xs text-white/40">
            by{" "}
            <a href="https://zavis.ae" className="text-accent hover:text-accent-light transition-colors" target="_blank" rel="noopener noreferrer">
              Zavis
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
