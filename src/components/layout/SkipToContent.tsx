/**
 * SkipToContent — WCAG 2.1 AA bypass-block.
 *
 * Visually hidden by default; becomes keyboard-visible on `:focus`. Targets
 * `#main-content`, which is set on the `<main>` element in
 * `src/app/(directory)/layout.tsx`. Rendered as the first child of the
 * directory layout (before the `<Header>`) so keyboard users land here on
 * the very first Tab press.
 *
 * Part of Item 10 (WCAG 2.1 AA pre-emption). Do NOT move this into
 * `src/app/layout.tsx` — that file has a load-bearing gtag-shim recursion
 * guard and must not be edited.
 */
export function SkipToContent({ label = "Skip to main content" }: { label?: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-dark focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      {label}
    </a>
  );
}
