"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const AuthModal = dynamic(
  () => import("./AuthModal").then((mod) => mod.AuthModal),
  { ssr: false, loading: () => null }
);

export function DeferredAuthModal() {
  const searchParams = useSearchParams();
  const auth = searchParams.get("auth");

  if (auth !== "login" && auth !== "signup") return null;

  return <AuthModal />;
}
