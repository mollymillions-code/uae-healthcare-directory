import ProviderPortalAdminPage from "./ClientPage";
import { redirect } from "next/navigation";
import { getCurrentProviderPortalContext } from "@/lib/provider-portal/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await getCurrentProviderPortalContext();
  if (!context?.staff?.isZavisStaff) {
    redirect(
      `/provider-portal/login?redirect=${encodeURIComponent("/admin/provider-portal")}`
    );
  }

  return <ProviderPortalAdminPage />;
}
