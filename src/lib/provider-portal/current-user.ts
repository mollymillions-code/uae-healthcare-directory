import { cookies } from "next/headers";
import {
  PROVIDER_PORTAL_SESSION_COOKIE,
  validateProviderPortalSessionToken,
} from "@/lib/provider-portal/auth";

export async function getCurrentProviderPortalContext() {
  return validateProviderPortalSessionToken(
    cookies().get(PROVIDER_PORTAL_SESSION_COOKIE)?.value
  );
}
