import Link from "next/link";
import { redirect } from "next/navigation";
import { ProviderPortalLoginForm } from "@/components/provider-portal/ProviderPortalLoginForm";
import { getCurrentProviderPortalContext } from "@/lib/provider-portal/current-user";

export default async function ProviderPortalLoginPage() {
  const context = await getCurrentProviderPortalContext();
  if (context) redirect("/provider-portal");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/directory" className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]">
          zavis<span className="text-[#006828]">.</span>
        </Link>
        <p className="mt-8 font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-[0.14em] text-[#006828]">
          Clinic listing portal
        </p>
        <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[30px] font-medium tracking-tight text-[#1c1c1c]">
          Manage your Zavis listing
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          Update listing information, submit profile edits, and keep your public clinic details accurate after your claim is approved.
        </p>
        <div className="mt-6">
          <ProviderPortalLoginForm />
        </div>
      </div>
    </main>
  );
}
