import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="container-wide">
        <div className="rule-thick" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12">
          <div>
            <p className="label mb-4">Cities</p>
            <ul className="space-y-2">
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link href={`/uae/${city.slug}`} className="text-sm text-ink-300 hover:text-ink transition-colors">
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-4">Directory</p>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-sm text-ink-300 hover:text-ink transition-colors">Search</Link></li>
              <li><Link href="/claim" className="text-sm text-ink-300 hover:text-ink transition-colors">Claim listing</Link></li>
              <li><Link href="/about" className="text-sm text-ink-300 hover:text-ink transition-colors">About</Link></li>
              <li><Link href="/api/search" className="text-sm text-ink-300 hover:text-ink transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <p className="label mb-4">Data Sources</p>
            <ul className="space-y-2">
              <li><span className="text-sm text-ink-300">DHA &mdash; Dubai</span></li>
              <li><span className="text-sm text-ink-300">DOH &mdash; Abu Dhabi</span></li>
              <li><span className="text-sm text-ink-300">MOHAP &mdash; Northern Emirates</span></li>
              <li><span className="text-sm text-ink-300">Google Places</span></li>
            </ul>
          </div>
          <div>
            <p className="label mb-4">For AI Agents</p>
            <ul className="space-y-2">
              <li><Link href="/directory-skill.md" className="text-sm text-ink-300 hover:text-ink transition-colors">Platform guide</Link></li>
              <li><Link href="/sitemap.xml" className="text-sm text-ink-300 hover:text-ink transition-colors">Sitemap</Link></li>
              <li><Link href="/api/search" className="text-sm text-ink-300 hover:text-ink transition-colors">JSON API</Link></li>
            </ul>
          </div>
        </div>

        <div className="rule" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-6">
          <p className="text-xs text-ink-200">
            &copy; {new Date().getFullYear()} UAE Healthcare Directory.
            Free for all UAE residents.
          </p>
          <p className="text-xs text-ink-200">
            by <a href="https://zavis.ae" className="hover:text-ink transition-colors" target="_blank" rel="noopener noreferrer">Zavis</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
