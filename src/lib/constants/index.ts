/**
 * Barrel export for all constants.
 * Import from "@/lib/constants" instead of individual files.
 */
export { CITIES, AREAS } from "./cities";
export { COUNTRIES, DEFAULT_COUNTRY_CODE, getCountryByCode, getCountryBySlug } from "./countries";
export type { Country } from "./countries";
export { CATEGORIES, SUBCATEGORIES } from "./categories";
export { INSURANCE_PROVIDERS } from "./insurance";
export type { InsuranceProvider } from "./insurance";
export { LANGUAGES } from "./languages";
export type { LanguageInfo } from "./languages";
export { CONDITIONS } from "./conditions";
export type { Condition } from "./conditions";
export { PROCEDURES } from "./procedures";
export { LAB_PROFILES, LAB_TESTS, LAB_TEST_PRICES, TEST_CATEGORIES } from "./labs";
