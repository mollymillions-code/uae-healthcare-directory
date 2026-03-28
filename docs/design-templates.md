# Design Templates — Zavis Directory & Intelligence Pages

> This document catalogs the 20 page templates used across the site.
> All templates follow the Zavis Design System: Bricolage Grotesque for headings,
> Geist for body/UI, `#006828` green accent, `#1c1c1c` off-black, `#f8f8f6` off-white,
> opacity-based text hierarchy, `rounded-2xl` cards, `border-black/[0.06]` borders.

---

## Design Tokens (Quick Reference)

| Token | Value | Tailwind |
|-------|-------|----------|
| **Heading font** | Bricolage Grotesque | `font-['Bricolage_Grotesque',sans-serif]` |
| **Body font** | Geist | `font-['Geist',sans-serif]` |
| **Brand green** | `#006828` | `text-[#006828]` / `bg-[#006828]` |
| **Off-black** | `#1c1c1c` | `text-[#1c1c1c]` |
| **Off-white bg** | `#f8f8f6` | `bg-[#f8f8f6]` |
| **Primary text** | black/70 | `text-black/70` |
| **Secondary text** | black/50 | `text-black/50` |
| **Muted text** | black/40 | `text-black/40` |
| **Faint text** | black/30 | `text-black/30` |
| **Card border** | black/6% | `border-black/[0.06]` |
| **Card radius** | 16px | `rounded-2xl` |
| **Pill radius** | 12px | `rounded-xl` |
| **Section divider** | 2px `#1c1c1c` | `border-b-2 border-[#1c1c1c]` |
| **Answer block** | Green left border | `border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6` |
| **Badge** | Green pill | `bg-[#006828]/[0.08] text-[#006828] text-[10px] rounded-full px-2.5 py-0.5` |
| **CTA primary** | Black pill | `bg-black text-white rounded-full px-10 py-3.5` |
| **CTA green** | Green pill | `bg-[#006828] text-white rounded-full py-3` |
| **Container** | 1280px | `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8` |

---

## Heading Scale

| Level | Classes |
|-------|---------|
| **H1 (page)** | `font-['Bricolage_Grotesque',sans-serif] font-semibold text-[28px] sm:text-[34px] text-[#1c1c1c] tracking-tight` |
| **H1 (hero white)** | `font-['Bricolage_Grotesque',sans-serif] font-semibold text-2xl sm:text-3xl text-white tracking-tight` |
| **H2 (section)** | `font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight` |
| **H3 (card)** | `font-['Bricolage_Grotesque',sans-serif] font-medium text-[15px] text-[#1c1c1c] tracking-tight` |
| **Label** | `font-['Geist',sans-serif] uppercase text-xs tracking-widest font-semibold` |

---

## Section Header Pattern

```tsx
<div className="flex items-center gap-3 mb-6 border-b-2 border-[#1c1c1c] pb-3">
  <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight">
    Section Title
  </h2>
</div>
```

---

## Templates

### 1. Directory Hub (`/directory`)
- **File:** `src/app/(directory)/directory/page.tsx`
- **Layout:** Hero grid (dark, city images) + search bar + answer block + how-it-works cards + specialties list + dark CTA + featured providers + FAQ
- **Sections alternate:** white / `#f8f8f6`
- **Pages:** 1

### 2. City Hub (`/directory/[city]`)
- **File:** `src/app/(directory)/directory/[city]/page.tsx`
- **Layout:** Breadcrumb + H1 + editorial blurb + answer block + search + category cards grid + neighborhoods list + filter shortcuts + featured providers + news links + FAQ
- **Pages:** 8

### 3. Category Listing (`/directory/[city]/[...segments]` — city-category branch)
- **File:** `src/app/(directory)/directory/[city]/[...segments]/page.tsx`
- **Layout:** Breadcrumb + hero banner (rounded-2xl, category image) + answer block + area pills + paginated provider cards (rounded-2xl, shadow-card hover) + FAQ
- **Shared component:** `ProviderCard`, `ProviderListPaginated`
- **Pages:** ~1,000+

### 4. Area Listing (`/directory/[city]/[...segments]` — city-area branch)
- **Same file as #3**, different code branch
- **Layout:** Breadcrumb + H1 + answer block + specialties grid + provider cards
- **Pages:** 62

### 5. Provider Detail (`/directory/[city]/[...segments]` — listing branch)
- **Same file as #3**, different code branch
- **Layout:** Breadcrumb + hero banner (rounded-2xl) + 2-col grid (content + sidebar) + answer block + about/services/hours/insurance/reviews/languages/map cards (all rounded-2xl) + FAQ + sticky mobile CTA
- **Sidebar:** Contact card + claim CTA + nearby providers
- **Pages:** ~12,500

### 6. Filter Index (insurance/language/condition/walk-in/24hr/emergency/government)
- **Files:** `src/app/(directory)/directory/[city]/insurance/page.tsx`, `language/page.tsx`, `condition/page.tsx`, `walk-in/page.tsx`, `24-hour/page.tsx`, `emergency/page.tsx`, `government/page.tsx`
- **Layout:** Breadcrumb + H1 + answer block + section-header + filter cards/links (rounded-xl) + provider list + FAQ
- **Pages:** ~50

### 7. Filter + Detail (insurer/language/condition per city)
- **Files:** `src/app/(directory)/directory/[city]/insurance/[insurer]/page.tsx`, `language/[lang]/page.tsx`, `condition/[condition]/page.tsx`
- **Layout:** Same as #6 but drilled into specific filter value
- **Pages:** ~2,000+

### 8. Top/Best Ranking
- **Files:** `src/app/(directory)/best/page.tsx`, `best/[city]/page.tsx`, `best/[city]/[category]/page.tsx`, `directory/top/page.tsx`, `directory/top/[category]/page.tsx`, `directory/[city]/top/page.tsx`
- **Layout:** Breadcrumb + H1 + answer block + ranked provider list (numbered) + cross-links + FAQ
- **Pages:** ~400+

### 9. Comparison
- **Files:** `src/app/(directory)/directory/compare/page.tsx`, `compare/[slug]/page.tsx`
- **Layout:** Breadcrumb + H1 + side-by-side stat tables + provider highlights + FAQ
- **Pages:** ~200+

### 10. Guide Article
- **Files:** `src/app/(directory)/directory/guide/[slug]/page.tsx`, `insurance/guide/[slug]/page.tsx`, `labs/guides/[guide]/page.tsx`, `pricing/guide/[guide]/page.tsx`
- **Layout:** Breadcrumb + H1 + long-form content sections (rounded-2xl cards) + FAQ
- **Pages:** ~40+

### 11. Guide Index
- **Files:** `src/app/(directory)/directory/guide/page.tsx`, `insurance/guide/page.tsx`, `pricing/guide/page.tsx`
- **Layout:** Breadcrumb + H1 + guide card grid + FAQ
- **Pages:** 4

### 12. Intelligence Hub (`/intelligence`)
- **File:** `src/app/(directory)/intelligence/page.tsx`
- **Layout:** Breaking ticker + masthead (Bricolage semibold) + category nav tabs + hero+secondary grid + main feed + sidebar (sections, events, social, tags) + answer block
- **Font weight:** Semibold throughout (heavier than directory pages)
- **Pages:** 1

### 13. Intelligence Article (`/intelligence/[slug]`)
- **File:** `src/app/(directory)/intelligence/[slug]/page.tsx`
- **Layout:** Back link + category label + hero image (rounded-2xl) + headline + excerpt + byline bar + article body + author bio (rounded-2xl) + tags (rounded-full pills) + related articles + sidebar (topics, more in category, directory cross-link) + FAQ
- **Font weight:** Semibold throughout
- **Pages:** ~100+

### 14. Intelligence Category/Tag
- **Files:** `src/app/(directory)/intelligence/category/[category]/page.tsx`, `intelligence/tag/[tag]/page.tsx`
- **Layout:** Same as intelligence hub but filtered
- **Pages:** ~20

### 15. Insurance Hub (`/insurance`)
- **File:** `src/app/(directory)/insurance/page.tsx`
- **Layout:** H1 + plan browser + insurance quiz + insurer cards + FAQ
- **Pages:** 1

### 16. Insurance Profile (`/insurance/[insurer]`)
- **File:** `src/app/(directory)/insurance/[insurer]/page.tsx`
- **Layout:** H1 + key facts + plan cards + network stats + coverage table + FAQ
- **Pages:** 38

### 17. Labs Hub (`/labs`)
- **File:** `src/app/(directory)/labs/page.tsx`
- **Layout:** H1 + test browser + lab cards grid + package cards + FAQ
- **Pages:** 1

### 18. Lab/Test Detail
- **Files:** `src/app/(directory)/labs/[lab]/page.tsx`, `labs/test/[test]/page.tsx`, `labs/test/[test]/[city]/page.tsx`, `labs/conditions/*/page.tsx`, `labs/results/[test]/page.tsx`
- **Layout:** Breadcrumb + H1 + stat cards (rounded-xl, p-4) + price comparison table + medical content + FAQ
- **Pages:** ~600+

### 19. Pricing Hub + Detail
- **Files:** `src/app/(directory)/pricing/page.tsx`, `pricing/[procedure]/page.tsx`, `pricing/[procedure]/[city]/page.tsx`, `pricing/journey/*/page.tsx`, `pricing/vs/*/page.tsx`
- **Layout:** Breadcrumb + H1 + cost estimator + procedure cards + city comparison + FAQ
- **Pages:** ~500+

### 20. Static/Utility
- **Files:** `src/app/(directory)/terms/page.tsx`, `editorial-policy/page.tsx`, `claim/page.tsx`, `login/page.tsx`
- **Layout:** Simple centered content, minimal structure
- **Pages:** 6

---

## Shared Components

| Component | Used By Templates | File |
|-----------|-------------------|------|
| `Header` (2-row Bloomberg-style) | All | `src/components/layout/Header.tsx` |
| `Footer` | All | `src/components/layout/Footer.tsx` |
| `Breadcrumb` | 1-19 | `src/components/layout/Breadcrumb.tsx` |
| `FaqSection` | 1-19 | `src/components/seo/FaqSection.tsx` |
| `ProviderCard` | 3, 4, 6, 7, 8 | `src/components/provider/ProviderCard.tsx` |
| `CategoryCard` | 2 | `src/components/directory/CategoryCard.tsx` |
| `SearchBar` | 1, 2 | `src/components/search/SearchBar.tsx` |
| `Pagination` | 3 | `src/components/shared/Pagination.tsx` |
| `ArticleCard` | 12, 13, 14 | `src/components/intelligence/ArticleCard.tsx` |
| `FeaturedArticle` | 12 | `src/components/intelligence/FeaturedArticle.tsx` |
| `CategoryNav` | 12, 14 | `src/components/intelligence/CategoryNav.tsx` |
| `TestPriceTable` | 18 | `src/components/labs/TestPriceTable.tsx` |
| `PlanCard` | 15, 16 | `src/components/insurance/PlanCard.tsx` |

---

## How to Use This Document

When adding new pages:
1. Identify which template archetype your page matches
2. Follow the exact same token/class patterns from that template
3. Use the shared components listed above
4. Alternate section backgrounds: white and `#f8f8f6`
5. All cards: `rounded-2xl border-black/[0.06]`
6. All headings: Bricolage Grotesque
7. All body: Geist
8. All greens: `#006828` only
9. All text grays: `black/opacity` — never named grays

When updating design:
1. Update tokens in this document first
2. Apply to shared components (affects all pages using them)
3. Then update individual page files if needed
