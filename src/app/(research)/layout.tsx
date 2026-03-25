/**
 * Research route group layout — no header/footer chrome.
 * Research pages have their own editorial nav and footer inline.
 */
export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
