import Link from "next/link";
import { CITIES } from "@/lib/constants/cities";
import { CATEGORIES } from "@/lib/constants/categories";

export function Footer() {
  const topCategories = CATEGORIES.slice(0, 10);

  return (
    <footer className="bg-dark text-white mt-16">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">UAE</span>
              </div>
              <span className="font-bold text-white">UAE Health Directory</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The most comprehensive free healthcare directory for the UAE.
              Find hospitals, clinics, dentists, and specialists across all Emirates.
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="font-semibold text-white mb-4">Cities</h3>
            <ul className="space-y-2">
              {CITIES.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/uae/${city.slug}`}
                    className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-4">Categories</h3>
            <ul className="space-y-2">
              {topCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/uae/dubai/${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Directory</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                  Search Providers
                </Link>
              </li>
              <li>
                <Link href="/claim" className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                  Claim Your Listing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-brand-400 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} UAE Healthcare Directory. Free and open for all UAE residents.
          </p>
          <p className="text-sm text-gray-500">
            Powered by <a href="https://zavis.ae" className="text-brand-400 hover:text-brand-300" target="_blank" rel="noopener noreferrer">Zavis</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
