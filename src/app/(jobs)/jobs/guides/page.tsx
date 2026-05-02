import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { JOBS_GUIDES } from "@/lib/jobs/guides-data";

export const revalidate = 86400;

const TITLE = "UAE healthcare careers guides — DHA / DOH / MOHAP licensing, salary & moving | Zavis";
const DESCRIPTION =
  "Long-form, no-fluff guides for healthcare workers moving to or working in the UAE — licensing, salary benchmarks, employer landscape and the realities of the relocation timeline.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/jobs/guides` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const CATEGORY_LABEL: Record<string, string> = {
  licensing: "Licensing",
  salary: "Salary",
  career: "Career path",
  process: "Hiring process",
  city: "By city",
  compliance: "Compliance",
};

export default function JobsGuidesIndexPage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Healthcare Jobs", url: `${base}/jobs` },
          { name: "Guides" },
        ])}
      />

      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: "Guides" },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            Editorial · Open Healthcare Jobs by Zavis
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[34px] font-medium leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[44px]">
            UAE healthcare careers guides.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            Specific, current, and written for the question you actually had. Licensing realities, 2026 salary benchmarks, and the moves that shorten relocation timelines for doctors, nurses, allied-health and operations roles.
          </p>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          {JOBS_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/jobs/guides/${g.slug}`}
              className="group block rounded-2xl border border-black/[0.06] bg-white p-6 transition-all hover:border-[#006828]/40"
            >
              <p className="font-['Geist_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.16em] text-[#006828]">
                {CATEGORY_LABEL[g.category] ?? g.category}
              </p>
              <h2 className="mt-2 font-['Bricolage_Grotesque',sans-serif] text-[20px] font-medium leading-snug tracking-tight text-[#1c1c1c] group-hover:text-[#006828]">
                {g.title}
              </h2>
              <p className="mt-2 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/55">
                {g.description}
              </p>
              <p className="mt-4 font-['Geist_Mono',monospace] text-[11px] tracking-[0.12em] text-black/40">
                {new Date(g.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                <span className="px-2">·</span>
                {g.author.name}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
