import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { HubPageTemplate, type HubItem } from "@/components/directory-v2/templates/HubPageTemplate";

export const metadata: Metadata = {
  title: "Healthcare Guide | UAE Open Healthcare Directory",
  description:
    "Understand the UAE healthcare system. Guides on DHA, DOH, MOHAP, health insurance, choosing a doctor, free zones, and emergency services.",
  alternates: {
    canonical: "https://www.zavis.ai/directory/guide",
  },
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

  const guideItems: HubItem[] = GUIDE_LINKS.map((guide) => ({
    href: `/directory/guide/${guide.slug}`,
    label: guide.title,
    subLabel: guide.description,
  }));

  return (
    <HubPageTemplate
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Healthcare Guide" },
      ]}
      eyebrow="UAE healthcare guide"
      title="UAE Healthcare Guide."
      subtitle={
        <>
          A comprehensive guide to navigating healthcare in the United Arab Emirates. Learn how the
          regulatory system works, understand your insurance options, find the right doctor, and know
          what to do in an emergency. Each article is written for UAE residents and visitors looking
          for clear, authoritative information.
        </>
      }
      stats={[
        { n: String(GUIDE_LINKS.length), l: "Guides" },
        { n: "UAE", l: "All emirates" },
      ]}
      aeoAnswer={
        <>
          A comprehensive guide to navigating healthcare in the United Arab Emirates. Learn how the
          regulatory system works (DHA, DOH, MOHAP), understand your insurance options, find the right
          doctor, and know what to do in an emergency. Each article is written for UAE residents and
          visitors looking for clear, authoritative information.
        </>
      }
      schemas={
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: base },
            { name: "Healthcare Guide", url: `${base}/directory/guide` },
          ])}
        />
      }
      sections={[
        {
          title: "All guides",
          eyebrow: "Browse by topic",
          items: guideItems,
          layout: "grid",
          gridCols: "2",
        },
      ]}
    />
  );
}
