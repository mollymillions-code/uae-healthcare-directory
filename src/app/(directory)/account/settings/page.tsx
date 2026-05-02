import { getCurrentConsumerUser } from "@/lib/auth/current-user";
import { AccountSettingsForm } from "@/components/account/AccountSettingsForm";

export default async function AccountSettingsPage() {
  const user = await getCurrentConsumerUser();
  if (!user) return null;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <h2 className="font-['Bricolage_Grotesque',sans-serif] text-2xl font-medium tracking-tight text-[#1c1c1c]">
        Account settings
      </h2>
      <p className="mt-1 font-['Geist',sans-serif] text-sm text-black/45">
        Keep useful preferences here so your provider search becomes faster.
      </p>
      <div className="mt-6 max-w-xl">
        <AccountSettingsForm user={user} />
      </div>
    </div>
  );
}
