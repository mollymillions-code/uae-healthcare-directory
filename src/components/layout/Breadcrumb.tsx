import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem { label: string; href?: string; }
interface BreadcrumbProps { items: BreadcrumbItem[]; }

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 font-['Geist',sans-serif] text-xs text-black/40 flex-wrap">
        <li>
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center gap-1 hover:text-[#006828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm transition-colors"
          >
            <Home aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-black/20" />
            {item.href ? (
              <Link href={item.href} className="hover:text-[#006828] transition-colors">{item.label}</Link>
            ) : (
              <span className="text-[#1c1c1c] font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
