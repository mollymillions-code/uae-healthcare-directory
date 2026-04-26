import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "بحث",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function ArabicSearchPage({ searchParams }: Props) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(query ? `/search?${query}` : "/search");
}
