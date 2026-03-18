import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem { label: string; href?: string; }
interface BreadcrumbProps { items: BreadcrumbItem[]; }

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
        <li>
          <Link href="/" className="flex items-center gap-1 hover:text-accent transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-light-300" />
            {item.href ? (
              <Link href={item.href} className="hover:text-accent transition-colors">{item.label}</Link>
            ) : (
              <span className="text-dark font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
