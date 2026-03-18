export interface InsuranceProvider {
  slug: string;
  name: string;
  description: string;
  type: "mandatory" | "private" | "premium";
}

export const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  {
    slug: "daman",
    name: "Daman",
    description: "National Health Insurance Company — the largest health insurer in the UAE, administering Abu Dhabi's mandatory basic health insurance scheme.",
    type: "mandatory",
  },
  {
    slug: "thiqa",
    name: "Thiqa",
    description: "Premium health insurance plan exclusively for UAE nationals in Abu Dhabi, providing comprehensive coverage at government and private facilities.",
    type: "premium",
  },
  {
    slug: "dic",
    name: "Dubai Insurance Company",
    description: "One of the oldest insurance companies in the UAE, offering health insurance plans tailored for Dubai-based individuals and businesses.",
    type: "private",
  },
  {
    slug: "axa",
    name: "AXA",
    description: "Global insurance provider offering comprehensive health plans across the Gulf region, popular with multinational employers in the UAE.",
    type: "private",
  },
  {
    slug: "cigna",
    name: "Cigna",
    description: "International health insurer providing individual and group health plans with extensive global and UAE provider networks.",
    type: "private",
  },
  {
    slug: "metlife",
    name: "MetLife",
    description: "Leading global insurer offering group and individual health plans in the UAE with wide hospital and clinic networks.",
    type: "private",
  },
  {
    slug: "allianz",
    name: "Allianz Care",
    description: "International health insurer providing premium expatriate and corporate health plans with global coverage and UAE-focused networks.",
    type: "private",
  },
  {
    slug: "adnic",
    name: "ADNIC",
    description: "Abu Dhabi National Insurance Company — a major UAE-based insurer offering health plans across Abu Dhabi, Dubai, and the Northern Emirates.",
    type: "private",
  },
  {
    slug: "bupa",
    name: "Bupa Global",
    description: "International health insurer offering premium individual and corporate health plans with global coverage and access to top UAE facilities.",
    type: "private",
  },
  {
    slug: "mednet",
    name: "MedNet",
    description: "Third-party health insurance administrator managing claims and provider networks for multiple insurers across the UAE.",
    type: "private",
  },
  {
    slug: "nas",
    name: "NAS",
    description: "NextCare — one of the largest third-party administrators in the region, managing health insurance networks across the UAE and Middle East.",
    type: "private",
  },
  {
    slug: "oman-insurance",
    name: "Oman Insurance",
    description: "One of the largest insurance companies in the UAE, offering comprehensive health plans for individuals and corporates across all emirates.",
    type: "private",
  },
  {
    slug: "sukoon",
    name: "Sukoon",
    description: "Formerly Enaya — a growing UAE health insurer offering affordable individual and group health plans with a strong Abu Dhabi presence.",
    type: "private",
  },
];
