import Link from "next/link";
import { ProviderPortalActivateForm } from "@/components/provider-portal/ProviderPortalActivateForm";

export default function ProviderPortalActivatePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/directory" className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-semibold tracking-tight text-[#1c1c1c]">
          zavis<span className="text-[#006828]">.</span>
        </Link>
        <p className="mt-8 font-['Geist',sans-serif] text-xs font-semibold uppercase tracking-[0.14em] text-[#006828]">
          Activate access
        </p>
        <h1 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[30px] font-medium tracking-tight text-[#1c1c1c]">
          Set up your listing manager
        </h1>
        <p className="mt-2 font-['Geist',sans-serif] text-sm leading-relaxed text-black/50">
          This account is scoped to approved clinic listings only. Edits you submit are reviewed by Zavis before they go live.
        </p>
        <div className="mt-6">
          <ProviderPortalActivateForm />
        </div>
      </div>
    </main>
  );
}
