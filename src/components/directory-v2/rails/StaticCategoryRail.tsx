import Link from "next/link";
import { cn } from "../shared/cn";

export interface StaticCategoryRailItem {
  slug: string;
  name: string;
  count?: number;
  icon: React.ReactNode;
  href: string;
}

interface StaticCategoryRailProps {
  items: StaticCategoryRailItem[];
  activeSlug?: string;
  className?: string;
}

const SHORT_LABELS: Record<string, string> = {
  hospitals: "Hospitals",
  clinics: "Clinics",
  "general-clinics-polyclinics": "Clinics",
  "dental-clinics": "Dental",
  dental: "Dental",
  dentists: "Dental",
  dermatology: "Skin",
  pediatrics: "Pediatrics",
  cardiology: "Heart",
  ophthalmology: "Eye",
  ent: "ENT",
  orthopedics: "Ortho",
  "mental-health": "Mental health",
  "general-medicine": "GP",
  gynecology: "Women's",
  fertility: "Fertility",
  pharmacy: "Pharmacy",
  laboratory: "Labs",
  aesthetic: "Aesthetic",
  aesthetics: "Aesthetic",
  "alternative-medicine": "Alt. medicine",
  endocrinology: "Endocrine",
  gastroenterology: "Digestive",
  "home-healthcare": "Home care",
  "medical-equipment": "Equipment",
  nephrology: "Kidney",
  "physiotherapy-rehabilitation": "Physio",
  physiotherapy: "Physio",
};

function short(slug: string, fallback: string): string {
  return SHORT_LABELS[slug] ?? fallback.split(/[&·]/)[0].trim();
}

export function StaticCategoryRail({ items, activeSlug, className }: StaticCategoryRailProps) {
  return (
    <nav className={cn("relative", className)} aria-label="Healthcare categories">
      <div className="flex items-center gap-2 overflow-x-auto z-no-scrollbar px-3 sm:px-4 py-2.5 [scroll-snap-type:x_proximity]">
        {items.map((item) => {
          const isActive = activeSlug === item.slug;
          return (
            <Link
              key={item.slug}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 rounded-z-pill px-3 py-1.5",
                "font-sans text-z-body-sm whitespace-nowrap border transition-colors duration-z-fast [scroll-snap-align:start]",
                isActive
                  ? "bg-ink text-white border-ink shadow-z-card"
                  : "bg-white text-ink border-ink-hairline hover:border-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={cn("flex h-4 w-4 items-center justify-center", isActive ? "text-white" : "text-ink-soft")}>
                {item.icon}
              </span>
              <span className="font-medium">{short(item.slug, item.name)}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span className={cn("font-normal", isActive ? "text-white/70" : "text-ink-muted")}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
