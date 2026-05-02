import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { JOBS_GUIDES, JOBS_GUIDES_BY_SLUG } from "@/lib/jobs/guides-data";

export const revalidate = 86400;

export async function generateStaticParams() {
  return JOBS_GUIDES.map((g) => ({ slug: g.slug }));
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = JOBS_GUIDES_BY_SLUG[params.slug];
  if (!guide) return {};
  return {
    title: `${guide.title} | Zavis`,
    description: guide.description,
    alternates: { canonical: `${getBaseUrl()}/jobs/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      publishedTime: guide.publishedAt,
      authors: [guide.author.name],
    },
  };
}

export default function JobsGuidePage({ params }: Props) {
  const guide = JOBS_GUIDES_BY_SLUG[params.slug];
  if (!guide) notFound();
  const base = getBaseUrl();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    author: {
      "@type": "Organization",
      name: "Zavis Editorial",
      url: `${base}/intelligence`,
    },
    publisher: {
      "@type": "Organization",
      name: "Zavis",
      url: base,
    },
    mainEntityOfPage: `${base}/jobs/guides/${guide.slug}`,
  };

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Jobs", url: `${base}/jobs` },
          { name: "Guides", url: `${base}/jobs/guides` },
          { name: guide.title },
        ])}
      />
      <JsonLd data={faqPageSchema(guide.faqs)} />
      <JsonLd data={articleSchema} />

      <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Jobs", href: "/jobs" },
            { label: "Guides", href: "/jobs/guides" },
            { label: guide.title.length > 60 ? guide.title.slice(0, 60) + "…" : guide.title },
          ]}
        />

        <article className="mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
            {guide.category} · {new Date(guide.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-[28px] font-medium leading-[1.1] tracking-tight text-[#1c1c1c] sm:text-[40px]">
            {guide.title}
          </h1>
          <p className="mt-3 font-['Geist',sans-serif] text-[15px] text-black/55">
            By {guide.author.name} · {guide.author.role}
          </p>

          <div className="mt-8 space-y-8 font-['Geist',sans-serif] text-[16px] leading-relaxed text-black/75">
            {guide.sections.map((s, i) => {
              if (s.type === "intro") {
                return (
                  <div key={i} className="space-y-4 text-[17px] leading-relaxed text-black/70">
                    {s.body.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                );
              }
              if (s.type === "h2") {
                return (
                  <div key={i} className="space-y-3">
                    <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
                      {s.title}
                    </h2>
                    {s.body.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                );
              }
              if (s.type === "list-item") {
                return (
                  <div key={i} className="space-y-2 border-l-2 border-[#006828]/30 pl-4">
                    <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828]">
                      {String(s.n).padStart(2, "0")}
                    </p>
                    <h3 className="font-['Bricolage_Grotesque',sans-serif] text-[19px] font-medium tracking-tight text-[#1c1c1c]">
                      {s.title}
                    </h3>
                    {s.body.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                );
              }
              if (s.type === "callout") {
                return (
                  <div key={i} className="rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] p-5">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                      {s.title}
                    </p>
                    <p className="mt-2 text-[15px] text-[#1c1c1c]/85">{s.body}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <section className="mt-12">
            <h2 className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-medium tracking-tight text-[#1c1c1c]">
              Frequently asked
            </h2>
            <div className="mt-4 space-y-3">
              {guide.faqs.map((f) => (
                <details
                  key={f.question}
                  className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 open:bg-[#006828]/[0.02]"
                >
                  <summary className="cursor-pointer font-['Bricolage_Grotesque',sans-serif] text-[16px] font-medium tracking-tight text-[#1c1c1c]">
                    {f.question}
                  </summary>
                  <p className="mt-3 font-['Geist',sans-serif] text-[14px] leading-relaxed text-black/65">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-[#006828]/15 bg-[#006828]/[0.04] p-6">
            <p className="font-['Bricolage_Grotesque',sans-serif] text-[18px] font-medium tracking-tight text-[#1c1c1c]">
              Browse open UAE healthcare jobs
            </p>
            <p className="mt-2 font-['Geist',sans-serif] text-[14px] text-black/65">
              Free for candidates. No fees. PDPL-compliant by default.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#006828] px-5 py-2.5 font-['Geist',sans-serif] text-[14px] font-semibold text-white"
            >
              Browse jobs
            </Link>
          </section>

          <section className="mt-12">
            <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-black/45">
              More guides
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {JOBS_GUIDES.filter((g) => g.slug !== guide.slug)
                .slice(0, 4)
                .map((g) => (
                  <Link
                    key={g.slug}
                    href={`/jobs/guides/${g.slug}`}
                    className="block rounded-2xl border border-black/[0.06] bg-white p-4 transition-colors hover:border-[#006828]/40"
                  >
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[15px] font-medium tracking-tight text-[#1c1c1c]">
                      {g.title}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
