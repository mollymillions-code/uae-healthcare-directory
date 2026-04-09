export interface Country {
  code: string;
  name: string;
  nameAr: string;
  slug: string;
  currency: string;
  regulators: string[];
  callingCode: string;
  flagEmoji: string;
}

export const COUNTRIES: Country[] = [
  {
    code: "ae",
    name: "United Arab Emirates",
    nameAr: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629",
    slug: "ae",
    currency: "AED",
    regulators: ["DHA", "DOH", "MOHAP"],
    callingCode: "+971",
    flagEmoji: "\ud83c\udde6\ud83c\uddea",
  },
  {
    code: "qa",
    name: "Qatar",
    nameAr: "\u0642\u0637\u0631",
    slug: "qa",
    currency: "QAR",
    regulators: ["MOPH"],
    callingCode: "+974",
    flagEmoji: "\ud83c\uddf6\ud83c\udde6",
  },
  {
    code: "sa",
    name: "Saudi Arabia",
    nameAr: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629",
    slug: "sa",
    currency: "SAR",
    regulators: ["MOH", "SCFHS"],
    callingCode: "+966",
    flagEmoji: "\ud83c\uddf8\ud83c\udde6",
  },
  {
    code: "bh",
    name: "Bahrain",
    nameAr: "\u0627\u0644\u0628\u062d\u0631\u064a\u0646",
    slug: "bh",
    currency: "BHD",
    regulators: ["NHRA"],
    callingCode: "+973",
    flagEmoji: "\ud83c\udde7\ud83c\udded",
  },
  {
    code: "kw",
    name: "Kuwait",
    nameAr: "\u0627\u0644\u0643\u0648\u064a\u062a",
    slug: "kw",
    currency: "KWD",
    regulators: ["MOH"],
    callingCode: "+965",
    flagEmoji: "\ud83c\uddf0\ud83c\uddfc",
  },
];

export const DEFAULT_COUNTRY_CODE = "ae";

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCountryBySlug(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}
