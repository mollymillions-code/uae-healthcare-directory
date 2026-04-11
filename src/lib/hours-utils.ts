/**
 * Operating hours display helpers — kept in a separate file from directory-utils
 * so multiple agents can modify without collisions.
 *
 * Problem: provider.operating_hours JSONB in the DB comes from multiple legacy
 * scrapers and is inconsistent. Observed shapes:
 *
 *   Day keys:
 *     { "Monday": {...}, "Tuesday": {...}, ... }   (legacy full English)
 *     { "mon": {...}, "tue": {...}, ... }          (3-letter lowercase)
 *     { "monday": {...}, ... }                      (lowercase full)
 *
 *   Time values:
 *     { open: "00:00",   close: "23:59"   }        (24-hour)
 *     { open: "12:00 AM", close: "11:59 PM" }      (12-hour with space)
 *     { open: "9:00 AM – 1:00 PM", close: ... }    (broken scrape, full range in one field)
 *     { open: "",        close: ""        }        (empty strings)
 *     { open: null,      close: null      }        (null)
 *
 * The page code's DAY_NAMES lookup is a 3-letter-key map. When a provider has
 * full-English day keys, DAY_NAMES[d] returns undefined, which then stringifies
 * as the literal word "undefined" in FAQ answers that ship in JSON-LD. That is
 * a Google rich-result quality violation. QA Round 3 found this leaking on
 * /directory/dubai/clinics/al-yalayis-fitness-medical-center-dip-dubai where
 * the FAQPage block said "undefined: 12:00 AM–11:59 PM" seven times.
 *
 * These helpers normalize day keys and format time ranges so callers never emit
 * undefined or leaked template variables.
 */

/**
 * Normalize any provider-hours day key to a canonical full English day name.
 * Returns undefined if the input is not recognizable as a day.
 */
export function normalizeDayName(rawKey: string | undefined | null): string | undefined {
  if (!rawKey) return undefined;
  const k = String(rawKey).trim().toLowerCase();
  const map: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };
  return map[k];
}

/**
 * Returns true if the open/close pair represents 24-hour operation.
 * Handles both 24-hour ("00:00"/"23:59") and 12-hour ("12:00 AM"/"11:59 PM")
 * representations, which both exist in the DB.
 */
export function isTwentyFourHours(
  open: string | undefined | null,
  close: string | undefined | null
): boolean {
  if (!open || !close) return false;
  const o = String(open).trim().toLowerCase().replace(/\s+/g, " ");
  const c = String(close).trim().toLowerCase().replace(/\s+/g, " ");
  if (o === "00:00" && (c === "23:59" || c === "24:00")) return true;
  if (o === "12:00 am" && (c === "11:59 pm" || c === "12:00 am")) return true;
  if (o === "0:00" && c === "23:59") return true;
  return false;
}

/**
 * Format a day's open/close pair as a short display string.
 * "24 hours" if round-the-clock, otherwise "{open}–{close}".
 * Returns empty string if either side is missing, malformed, or a scrape artifact.
 */
export function formatHoursRange(
  open: string | undefined | null,
  close: string | undefined | null
): string {
  if (!open || !close) return "";
  const o = String(open).trim();
  const c = String(close).trim();
  if (!o || !c) return "";
  // Defensive: detect broken scrape artifacts where the entire range got
  // stuffed into the open field with an en-dash — skip those entirely.
  if (o.includes("–") && c.includes("–")) return "";
  if (isTwentyFourHours(o, c)) return "24 hours";
  return `${o}–${c}`;
}

/**
 * Build a JSON-LD-safe "day: hours" string for a single operatingHours entry.
 * Returns an empty string (caller should filter these out) if:
 *   - the day key is not recognizable
 *   - the open or close value is missing or malformed
 *
 * This is the single source of truth for FAQ schedule text. Anywhere that
 * builds FAQPage acceptedAnswer.text for operating hours should use this.
 */
export function buildFaqDayLine(
  dayKey: string,
  open: string | undefined | null,
  close: string | undefined | null
): string {
  const dayName = normalizeDayName(dayKey);
  if (!dayName) return "";
  const range = formatHoursRange(open, close);
  if (!range) return "";
  return `${dayName}: ${range}`;
}
