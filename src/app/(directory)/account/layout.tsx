import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentConsumerUser } from "@/lib/auth/current-user";
import { LogoutButton } from "@/components/account/LogoutButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const accountLinks = [
  { href: "/account", label: "Overview" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/activity", label: "Activity" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentConsumerUser();
  if (!user) redirect("/login?redirect=/account");

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-[0.14em] text-[#006828]">
              Zavis account
            </p>
            <h1 className="mt-1 font-['Bricolage_Grotesque',sans-serif] text-[28px] font-medium tracking-tight text-[#1c1c1c]">
              {user.name || user.email}
            </h1>
            <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">{user.email}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-black/[0.06] bg-white p-3 lg:self-start">
            <nav className="flex gap-2 overflow-x-auto lg:flex-col">
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-4 py-2 font-['Geist',sans-serif] text-sm font-medium text-black/55 transition-colors hover:bg-[#006828]/[0.06] hover:text-[#006828]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}
