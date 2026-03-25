export interface InsuranceProvider {
  slug: string;
  name: string;
  description: string;
  type: "mandatory" | "private" | "premium" | "tpa";
}

export const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  // ─── Government / Mandatory ─────────────────────────────────────────────────
  {
    slug: "daman",
    name: "Daman",
    description: "National Health Insurance Company — the UAE's largest health insurer, covering over 3 million lives. Part of PureHealth, Abu Dhabi's integrated healthcare platform. Administers Abu Dhabi's mandatory basic health insurance scheme.",
    type: "mandatory",
  },
  {
    slug: "thiqa",
    name: "Thiqa",
    description: "Premium health insurance programme exclusively for UAE nationals in Abu Dhabi. Provides unlimited coverage at government and private facilities. Fully government-funded, administered by Daman.",
    type: "premium",
  },

  // ─── Major International Insurers ───────────────────────────────────────────
  {
    slug: "axa",
    name: "AXA",
    description: "Global insurance provider offering SmartHealth plans across the Gulf region. Popular with multinational employers in the UAE. One of the world's largest insurers.",
    type: "private",
  },
  {
    slug: "cigna",
    name: "Cigna",
    description: "Part of The Cigna Group (Fortune 500). Provides individual and group health plans with extensive global and UAE provider networks. Strong telehealth services.",
    type: "private",
  },
  {
    slug: "metlife",
    name: "MetLife",
    description: "One of the world's largest life and health insurers (est. 1868). Strong group/corporate health insurance focus in UAE with digital claims via MetLife app.",
    type: "private",
  },
  {
    slug: "allianz",
    name: "Allianz Care",
    description: "Part of Allianz Group — the world's largest insurer by assets (est. 1890). Specialist in international/expat health insurance with medical evacuation services.",
    type: "private",
  },
  {
    slug: "bupa",
    name: "Bupa Global",
    description: "International health insurer with 43 million customers worldwide (est. 1947). Premium individual and corporate health plans with access to 1.5M+ global providers.",
    type: "private",
  },
  {
    slug: "aetna",
    name: "Aetna International",
    description: "Part of CVS Health. Provides expat and corporate health plans across the UAE with strong international network ties. Originally established as GoodHealth in 1982.",
    type: "private",
  },
  {
    slug: "msh",
    name: "MSH International",
    description: "Part of Diot-Siaci Group. Specialises in expat and global mobility health plans with strong Middle East presence.",
    type: "private",
  },
  {
    slug: "now-health",
    name: "Now Health International",
    description: "International private medical insurer (est. 2011) offering flexible modular health plans for expats and globally mobile individuals in the UAE.",
    type: "private",
  },
  {
    slug: "william-russell",
    name: "William Russell",
    description: "Specialist international health insurer for expats (est. 1992), offering comprehensive private medical insurance with worldwide coverage and UAE-focused plans.",
    type: "private",
  },
  {
    slug: "gig-gulf",
    name: "GIG Gulf",
    description: "Gulf Insurance Group (est. 1962 in Kuwait) — one of the largest insurance groups in MENA. Over 800 employees across 15 branches, serving 1M+ customers in the UAE and GCC.",
    type: "private",
  },

  // ─── Major UAE-Based Insurers ───────────────────────────────────────────────
  {
    slug: "dic",
    name: "Dubai Insurance Company",
    description: "The first local insurance company in the UAE (est. 1970 by decree of Sheikh Rashid Al Maktoum). Public shareholding company offering health plans for Dubai-based individuals and businesses.",
    type: "private",
  },
  {
    slug: "adnic",
    name: "ADNIC",
    description: "Abu Dhabi National Insurance Company — the first insurer licensed in Abu Dhabi (est. 1972 by Emiri Decree). Listed on ADX. Offers health plans across Abu Dhabi, Dubai, and Northern Emirates.",
    type: "private",
  },
  {
    slug: "oman-insurance",
    name: "Sukoon (Oman Insurance)",
    description: "Rebranded from Oman Insurance to Sukoon in October 2022. One of the largest publicly listed insurers in the UAE (est. 1975). Listed on DFM. Majority owned by Mashreq Bank.",
    type: "private",
  },
  {
    slug: "orient",
    name: "Orient Insurance",
    description: "Part of Al Futtaim Group (est. 1982). One of the leading insurers in the UAE and MENA region, offering wide-network corporate and individual health plans across all emirates.",
    type: "private",
  },
  {
    slug: "union-insurance",
    name: "Union Insurance",
    description: "Established 1998, listed on ADX. Corporate office in Dubai. Offers health insurance plans for corporates and individuals across the UAE.",
    type: "private",
  },
  {
    slug: "emirates-insurance",
    name: "Emirates Insurance Company",
    description: "Established by law of Sheikh Zayed in 1982. Headquartered in Abu Dhabi. Offers health plans for corporates and individuals across all emirates.",
    type: "private",
  },
  {
    slug: "ngi",
    name: "National General Insurance",
    description: "National General Insurance (NGI) — established 1980, headquartered in Dubai. Listed on DFM. Offers health plans focused on corporate groups and SMEs.",
    type: "private",
  },
  {
    slug: "al-sagr",
    name: "Al Sagr National Insurance",
    description: "Established 1979 by Emiri Decree of the Ruler of Dubai. Headquartered in Dubai with Abu Dhabi branch. Offers health insurance for corporates and individuals.",
    type: "private",
  },
  {
    slug: "arabia-insurance",
    name: "Arabia Insurance",
    description: "Regional insurer established in 1944 (HQ Beirut, Lebanon). Operations across the Middle East including offices in Abu Dhabi, Al Ain, Dubai, and Sharjah.",
    type: "private",
  },
  {
    slug: "al-wathba",
    name: "Al Wathba National Insurance",
    description: "Abu Dhabi-based national insurer (est. 1996). Listed on ADX. Offers corporate health plans across the UAE. Known for competitive group rates and government contracts.",
    type: "private",
  },
  {
    slug: "rak-insurance",
    name: "RAK Insurance",
    description: "Ras Al Khaimah National Insurance Company (est. 1974). One of the oldest insurers in the UAE. Listed on ADX. Major shareholder: RAK Bank. Focus on Northern Emirates.",
    type: "private",
  },
  {
    slug: "al-dhafra",
    name: "Al Dhafra Insurance",
    description: "Abu Dhabi-based insurer established 1979 by Emiri Decree. Fully UAE-national owned. Focus on Abu Dhabi and Western Region. Listed on ADX.",
    type: "private",
  },
  {
    slug: "fidelity-united",
    name: "Fidelity United Insurance",
    description: "Dubai-based insurer (est. 1976 as United Insurance Company). Rebranded 2018 after partnership with Fidelity Assurance. Affordable health plans for SMEs and individuals.",
    type: "private",
  },
  {
    slug: "hayah",
    name: "Hayah Insurance",
    description: "Abu Dhabi-based life and health insurer (est. 2008). Formerly AXA Green Crescent Insurance Company, rebranded to Hayah in 2022. Listed on ADX.",
    type: "private",
  },
  {
    slug: "alliance-insurance",
    name: "Alliance Insurance",
    description: "Dubai-based insurer (est. 1975). Listed on DFM. Offers health insurance for corporates and individuals with focus on SME and mid-market segments.",
    type: "private",
  },
  {
    slug: "dnir",
    name: "Dubai National Insurance",
    description: "Dubai National Insurance and Reinsurance (est. 1991, operations from 1992). One of the first insurers listed on DFM. Health plans for local businesses.",
    type: "private",
  },
  {
    slug: "al-ain-ahlia",
    name: "Al Ain Ahlia Insurance",
    description: "One of the first insurance companies in the UAE (est. 1975). Headquartered in Abu Dhabi with strong Al Ain regional presence. Branches across the region.",
    type: "private",
  },

  // ─── Takaful (Islamic Insurance) ────────────────────────────────────────────
  {
    slug: "takaful-emarat",
    name: "Takaful Emarat",
    description: "Leading Sharia-compliant (Takaful) life and health insurer (est. 2008). Headquartered on Sheikh Zayed Road, Dubai. Wide range of individual and corporate Takaful products.",
    type: "private",
  },
  {
    slug: "watania",
    name: "Watania",
    description: "Watania International Holding (formerly Dar Al Takaful, merged 2022-2023). National Takaful Company created 2011. Listed on DFM. Sharia-compliant health insurance across the UAE.",
    type: "private",
  },
  {
    slug: "noor-takaful",
    name: "Noor Takaful",
    description: "Islamic (Takaful) insurer launched January 2009 by Sheikh Ahmed bin Saeed Al Maktoum. Second largest Islamic insurance company in the UAE. Sharia-compliant health plans.",
    type: "private",
  },
  {
    slug: "salama",
    name: "Salama Islamic Insurance",
    description: "Islamic Arab Insurance Company (est. 1979). Pioneer in Takaful industry. Listed on DFM. Over 450,000 customers with coverage exceeding AED 10 billion.",
    type: "private",
  },

  // ─── Third-Party Administrators (TPAs) ──────────────────────────────────────
  {
    slug: "nas",
    name: "NAS (NextCare)",
    description: "NextCare — established 1999, part of Allianz group. One of the largest TPAs in MENA, managing health benefits across the UAE and Middle East. Real-time claims processing.",
    type: "tpa",
  },
  {
    slug: "mednet",
    name: "MedNet",
    description: "Major TPA, part of Munich Re. Manages health insurance claims and provider networks for multiple insurers across the UAE. Offices in UAE, Bahrain, Oman, Egypt, Jordan, and Iraq.",
    type: "tpa",
  },
  {
    slug: "globemed",
    name: "GlobeMed",
    description: "International TPA (est. 1991, HQ Beirut). UAE operations via GlobeMed Gulf since 2008. Manages health benefits and provider networks across the Middle East and Africa.",
    type: "tpa",
  },
  {
    slug: "neuron",
    name: "Neuron",
    description: "UAE-based TPA established 2001 in Dubai. Merged with Nas Administration Services in 2019 to form Nas Neuron Health Services (NNHS). One of the largest medical provider networks in the UAE.",
    type: "tpa",
  },
  {
    slug: "iris",
    name: "IRIS Health",
    description: "Regional TPA offering health insurance administration and managed care services across the UAE and GCC countries.",
    type: "tpa",
  },
];
