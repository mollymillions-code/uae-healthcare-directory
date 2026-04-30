import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic Listing Portal | Zavis",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ProviderPortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f8f8f6] text-[#1c1c1c]">{children}</div>;
}
