import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

export function Footer() {
  const topCategories = CATEGORIES.slice(0, 10);

  return (
    <footer className="bg-dark text-white mt-16 relative overflow-hidden">
      {/* Subtle decorative element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="container-wide py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg bg-teal-500 flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">UAE</span>
              </div>
              <span className="font-display text-lg font-semibold text-white tracking-tight">
                Health Directory
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-4">
              The most comprehensive free healthcare directory for the UAE.
              Sourced from official DHA, DOH, and MOHAP registers.
            </p>
            <p className="text-xs text-white/25 font-mono">
              Last verified: March 2026
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.2em] mb-4">
              Cities
            </h3>
            <ul className="space-y-2.5">
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/uae/${city.slug}`}
                    className="text-sm text-white/50 hover:text-teal-400 transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.2em] mb-4">
              Specialties
            </h3>
            <ul className="space-y-2.5">
              {topCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/uae/dubai/${cat.slug}`}
                    className="text-sm text-white/50 hover:text-teal-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.2em] mb-4">
              Directory
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/search" className="text-sm text-white/50 hover:text-teal-400 transition-colors">
                  Search Providers
                </Link>
              </li>
              <li>
                <Link href="/claim" className="text-sm text-white/50 hover:text-teal-400 transition-colors">
                  Claim Your Listing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-white/50 hover:text-teal-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/directory-skill.md" className="text-sm text-white/50 hover:text-teal-400 transition-colors">
                  For AI Agents
                </Link>
              </li>
              <li>
                <Link href="/api/search" className="text-sm text-white/50 hover:text-teal-400 transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} UAE Healthcare Directory. Free and
            open for all UAE residents.
          </p>
          <p className="text-xs text-white/30">
            Powered by{" "}
            <a
              href="https://zavis.ae"
              className="text-teal-400/60 hover:text-teal-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zavis
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
