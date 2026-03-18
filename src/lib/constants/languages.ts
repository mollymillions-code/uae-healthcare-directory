export interface LanguageInfo {
  slug: string;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { slug: "english", name: "English", nativeName: "English" },
  { slug: "arabic", name: "Arabic", nativeName: "العربية" },
  { slug: "hindi", name: "Hindi", nativeName: "हिन्दी" },
  { slug: "urdu", name: "Urdu", nativeName: "اردو" },
  { slug: "tagalog", name: "Tagalog", nativeName: "Tagalog" },
  { slug: "malayalam", name: "Malayalam", nativeName: "മലയാളം" },
  { slug: "french", name: "French", nativeName: "Français" },
  { slug: "german", name: "German", nativeName: "Deutsch" },
  { slug: "russian", name: "Russian", nativeName: "Русский" },
  { slug: "chinese", name: "Chinese (Mandarin)", nativeName: "中文" },
  { slug: "persian", name: "Persian (Farsi)", nativeName: "فارسی" },
  { slug: "bengali", name: "Bengali", nativeName: "বাংলা" },
  { slug: "tamil", name: "Tamil", nativeName: "தமிழ்" },
  { slug: "sinhala", name: "Sinhala", nativeName: "සිංහල" },
  { slug: "korean", name: "Korean", nativeName: "한국어" },
  { slug: "japanese", name: "Japanese", nativeName: "日本語" },
  { slug: "portuguese", name: "Portuguese", nativeName: "Português" },
  { slug: "spanish", name: "Spanish", nativeName: "Español" },
  { slug: "turkish", name: "Turkish", nativeName: "Türkçe" },
  { slug: "italian", name: "Italian", nativeName: "Italiano" },
];
