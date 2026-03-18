"use client";

import { useEffect } from "react";

/**
 * Client component that sets html lang="ar" and dir="rtl" for Arabic pages.
 * This runs after hydration and correctly sets the document root attributes.
 */
export function SetArabicLang() {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    };
  }, []);
  return null;
}
