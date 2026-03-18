import { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";

export const metadata: Metadata = {
  title: "Healthcare Guide | UAE Healthcare Directory",
  description:
    "Understand the UAE healthcare system. Guides on DHA, DOH, MOHAP, health insurance, choosing a doctor, free zones, and emergency services.",
};

const GUIDE_LINKS = [
  {
    title: "How UAE Healthcare Works",
    slug: "how-uae-healthcare-works",
    description:
      "An overview of the three-authority system, mandatory insurance, and how public and private sectors operate.",
  },
  {
    title: "Understanding Health Insurance in the UAE",
    slug: "health-insurance-uae",
    description:
      "Mandatory insurance rules, major providers like Daman and Thiqa, and how to check your coverage.",
  },
  {
    title: "What is DHA? Dubai Health Authority Explained",
    slug: "what-is-dha",
    description:
      "The regulator behind Dubai's healthcare sector, its licensing role, and DHCC.",
  },
  {
    title: "What is DOH? Abu Dhabi Department of Health",
    slug: "what-is-doh",
    description:
      "Abu Dhabi's health regulator, the HAAD legacy, and Thiqa insurance for nationals.",
  },
  {
    title: "What is MOHAP?",
    slug: "what-is-mohap",
    description:
      "The federal Ministry of Health and Prevention governing healthcare in the Northern Emirates.",
  },
  {
    title: "How to Choose a Doctor in the UAE",
    slug: "choosing-a-doctor-uae",
    description:
      "Practical advice on checking credentials, insurance networks, and finding the right specialist.",
  },
  {
    title: "Healthcare Free Zones in Dubai",
    slug: "healthcare-free-zones-dubai",
    description:
      "What Dubai Healthcare City and other free zones mean for patients and international providers.",
  },
  {
    title: "Emergency Services in the UAE",
    slug: "emergency-services-uae",
    description:
      "Key numbers to call, where to go in a medical emergency, and when to choose urgent care.",
  },
];

export default function GuideHubPage() {
  const base = getBaseUrl();

  return (
    <div className="container-tc py-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: base },
          { name: "Healthcare Guide", url: `${base}/directory/guide` },
        ])}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Healthcare Guide" },
        ]}
      />

      <h1 className="text-3xl font-bold text-dark mb-6">
        UAE Healthcare Guide
      </h1>

      <div className="answer-block mb-10" data-answer-block="true">
        <p className="text-muted leading-relaxed text-lg">
          A comprehensive guide to navigating healthcare in the United Arab
          Emirates. Learn how the regulatory system works, understand your
          insurance options, find the right doctor, and know what to do in an
          emergency. Each article is written for UAE residents and visitors
          looking for clear, authoritative information.
        </p>
      </div>

      <div className="section-header">
        <h2>All Guides</h2>
        <span className="arrows">&gt;&gt;&gt;</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {GUIDE_LINKS.map((guide) => (
          <Link
            key={guide.slug}
            href={`/directory/guide/${guide.slug}`}
            className="border border-light-200 p-5 hover:border-accent transition-colors group"
          >
            <h3 className="text-lg font-bold text-dark group-hover:text-accent transition-colors mb-2">
              {guide.title}
            </h3>
            <p className="text-sm text-muted">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
