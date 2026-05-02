/**
 * UAE healthcare compliance calendar reference data.
 *
 * Renewal cycles, CME requirements, DataFlow verification windows, insurance
 * contract renewals, and inspection cycles for DHA (Dubai), DOH/Sheryan
 * (Abu Dhabi), and MOHAP (Northern Emirates).
 *
 * Sources: DHA license services portal, DOH Sheryan, MOHAP licensing
 * pages, DataFlow Group documentation. Verify against the authority's
 * own current documentation before formal compliance decisions.
 */

export type Authority = "DHA" | "DOH" | "MOHAP";
export type LicenseType =
  | "facility_clinic"
  | "facility_hospital"
  | "facility_pharmacy"
  | "facility_lab"
  | "professional_doctor"
  | "professional_dentist"
  | "professional_pharmacist"
  | "professional_nurse";

export interface ComplianceRule {
  authority: Authority;
  licenseType: LicenseType;
  /** Renewal cycle in months. */
  renewalMonths: number;
  /** CME hours required during the renewal cycle (0 = N/A). */
  cmeHours: number;
  /** DataFlow verification cycle in months (0 = N/A). */
  dataflowMonths: number;
  /** Inspection-window guidance — when to expect a routine inspection. */
  inspectionGuidance: string;
  /** Authority-specific notes. */
  notes: string;
}

export const RULES: ComplianceRule[] = [
  // DHA (Dubai)
  {
    authority: "DHA",
    licenseType: "facility_clinic",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual or post-incident. Risk-based scheduling — well-rated facilities inspected biennially.",
    notes: "Facility license must be displayed visibly. All staff licenses verified during inspection.",
  },
  {
    authority: "DHA",
    licenseType: "facility_hospital",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual full inspection plus targeted audits (medication, infection control). JCI-accredited hospitals have additional 3-year cycle.",
    notes: "Bed-count, specialist roster, and equipment inventory part of renewal application.",
  },
  {
    authority: "DHA",
    licenseType: "facility_pharmacy",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + spot-check on controlled-substance handling.",
    notes: "Pharmacist-in-charge must hold valid DHA pharmacist license.",
  },
  {
    authority: "DHA",
    licenseType: "facility_lab",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + ISO 15189 accreditation cycle if accredited.",
    notes: "Test menu and equipment list submitted at renewal.",
  },
  {
    authority: "DHA",
    licenseType: "professional_doctor",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "License-renewal triggers a credentials review.",
    notes: "40 CME hours over 2-year cycle. CME providers must be DHA-accredited. Mandatory categories: ethics (3h), patient safety (3h).",
  },
  {
    authority: "DHA",
    licenseType: "professional_dentist",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "License-renewal credentials review.",
    notes: "40 CME hours over 2 years. DHA-accredited providers only.",
  },
  {
    authority: "DHA",
    licenseType: "professional_pharmacist",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "License-renewal credentials review.",
    notes: "30 CME hours over 2 years. Includes mandatory pharmacy law update.",
  },
  {
    authority: "DHA",
    licenseType: "professional_nurse",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "License-renewal credentials review.",
    notes: "30 CME hours over 2 years.",
  },

  // DOH (Abu Dhabi)
  {
    authority: "DOH",
    licenseType: "facility_clinic",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + Sheryan-driven inspection notification.",
    notes: "Sheryan portal handles all renewal applications. Facility must enroll in Malaffi (AD health information network).",
  },
  {
    authority: "DOH",
    licenseType: "facility_hospital",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual full inspection. JCI-accredited hospitals on a separate 3-year cycle.",
    notes: "DOH facility classification (Hospital A/B/C) affects renewal documentation.",
  },
  {
    authority: "DOH",
    licenseType: "facility_pharmacy",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + controlled-substance audit.",
    notes: "Sheryan-registered pharmacist-in-charge required.",
  },
  {
    authority: "DOH",
    licenseType: "facility_lab",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + accreditation cycle if applicable.",
    notes: "Lab capacity report submitted at renewal.",
  },
  {
    authority: "DOH",
    licenseType: "professional_doctor",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "Sheryan-driven credentials review at renewal.",
    notes: "40 CME hours over 2 years. DOH-accredited providers required.",
  },
  {
    authority: "DOH",
    licenseType: "professional_dentist",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "Sheryan-driven credentials review.",
    notes: "40 CME hours over 2 years.",
  },
  {
    authority: "DOH",
    licenseType: "professional_pharmacist",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "Sheryan-driven credentials review.",
    notes: "30 CME hours over 2 years.",
  },
  {
    authority: "DOH",
    licenseType: "professional_nurse",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "Sheryan-driven credentials review.",
    notes: "30 CME hours over 2 years.",
  },

  // MOHAP (Northern Emirates)
  {
    authority: "MOHAP",
    licenseType: "facility_clinic",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual; emirate-specific inspection cycles vary (Sharjah strict, smaller emirates more flexible).",
    notes: "MOHAP Riayati portal handles applications. Some emirates require additional municipal approval.",
  },
  {
    authority: "MOHAP",
    licenseType: "facility_hospital",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual full inspection + emirate-specific audit cycles.",
    notes: "Bed-count and specialist roster part of renewal.",
  },
  {
    authority: "MOHAP",
    licenseType: "facility_pharmacy",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + controlled-substance audit.",
    notes: "MOHAP-registered pharmacist-in-charge required.",
  },
  {
    authority: "MOHAP",
    licenseType: "facility_lab",
    renewalMonths: 12,
    cmeHours: 0,
    dataflowMonths: 60,
    inspectionGuidance: "Annual + accreditation cycle if applicable.",
    notes: "Test menu submitted at renewal.",
  },
  {
    authority: "MOHAP",
    licenseType: "professional_doctor",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "Riayati-driven credentials review.",
    notes: "40 CME hours over 2 years. MOHAP-accredited providers.",
  },
  {
    authority: "MOHAP",
    licenseType: "professional_dentist",
    renewalMonths: 24,
    cmeHours: 40,
    dataflowMonths: 60,
    inspectionGuidance: "Riayati-driven credentials review.",
    notes: "40 CME hours over 2 years.",
  },
  {
    authority: "MOHAP",
    licenseType: "professional_pharmacist",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "Riayati-driven credentials review.",
    notes: "30 CME hours over 2 years.",
  },
  {
    authority: "MOHAP",
    licenseType: "professional_nurse",
    renewalMonths: 24,
    cmeHours: 30,
    dataflowMonths: 60,
    inspectionGuidance: "Riayati-driven credentials review.",
    notes: "30 CME hours over 2 years.",
  },
];

export const LICENSE_LABELS: Record<LicenseType, string> = {
  facility_clinic: "Clinic facility",
  facility_hospital: "Hospital facility",
  facility_pharmacy: "Pharmacy facility",
  facility_lab: "Lab facility",
  professional_doctor: "Doctor (professional)",
  professional_dentist: "Dentist (professional)",
  professional_pharmacist: "Pharmacist (professional)",
  professional_nurse: "Nurse (professional)",
};

export interface UpcomingMilestone {
  date: string; // ISO date
  daysOut: number;
  category: "license_renewal" | "cme_deadline" | "dataflow" | "insurance_renewal" | "inspection_window";
  title: string;
  description: string;
}

/**
 * Given an authority + license type + last renewal date (ISO yyyy-mm-dd),
 * compute the upcoming compliance milestones for the next 12 months.
 */
export function computeMilestones(
  authority: Authority,
  licenseType: LicenseType,
  lastRenewalIso: string
): UpcomingMilestone[] {
  const rule = RULES.find(
    (r) => r.authority === authority && r.licenseType === licenseType
  );
  if (!rule) return [];

  const lastRenewal = new Date(lastRenewalIso);
  if (isNaN(lastRenewal.getTime())) return [];

  const now = new Date();
  const horizonEnd = new Date();
  horizonEnd.setMonth(horizonEnd.getMonth() + 12);

  const result: UpcomingMilestone[] = [];

  // License renewal
  const nextRenewal = new Date(lastRenewal);
  nextRenewal.setMonth(nextRenewal.getMonth() + rule.renewalMonths);
  if (nextRenewal >= now && nextRenewal <= horizonEnd) {
    result.push({
      date: nextRenewal.toISOString().slice(0, 10),
      daysOut: Math.round((nextRenewal.getTime() - now.getTime()) / 86400000),
      category: "license_renewal",
      title: `${authority} license renewal due`,
      description: rule.notes,
    });
  }

  // CME deadline (~30 days before license renewal)
  if (rule.cmeHours > 0 && nextRenewal >= now && nextRenewal <= horizonEnd) {
    const cmeDeadline = new Date(nextRenewal);
    cmeDeadline.setDate(cmeDeadline.getDate() - 30);
    if (cmeDeadline >= now) {
      result.push({
        date: cmeDeadline.toISOString().slice(0, 10),
        daysOut: Math.round((cmeDeadline.getTime() - now.getTime()) / 86400000),
        category: "cme_deadline",
        title: `Complete ${rule.cmeHours} CME hours`,
        description: `${authority} requires ${rule.cmeHours} accredited CME hours for renewal.`,
      });
    }
  }

  // DataFlow renewal
  if (rule.dataflowMonths > 0) {
    const dfDate = new Date(lastRenewal);
    dfDate.setMonth(dfDate.getMonth() + rule.dataflowMonths);
    if (dfDate >= now && dfDate <= horizonEnd) {
      result.push({
        date: dfDate.toISOString().slice(0, 10),
        daysOut: Math.round((dfDate.getTime() - now.getTime()) / 86400000),
        category: "dataflow",
        title: "DataFlow verification renewal",
        description: "Primary-source verification cycle. Submit via DataFlow Group portal — typically 4–6 week processing.",
      });
    }
  }

  // Insurance contract renewal (annual, aligned with calendar year for most clinics).
  // Always the NEXT Jan 1 — i.e. the start of the next calendar year. The previous
  // calculation (`now.getMonth() >= 11 ? 1 : 0`) only stepped to the next year when
  // already in December, leaving e.g. May → Jan 1 of the SAME year (in the past)
  // which then failed the `>= now` filter and dropped the milestone entirely.
  const nextJan = new Date(now.getFullYear() + 1, 0, 1);
  if (nextJan <= horizonEnd) {
    result.push({
      date: nextJan.toISOString().slice(0, 10),
      daysOut: Math.round((nextJan.getTime() - now.getTime()) / 86400000),
      category: "insurance_renewal",
      title: "Insurance network contracts renew",
      description: "Most UAE carrier contracts run on a calendar-year cycle. Negotiate rates 60–90 days before this date.",
    });
  }

  // Inspection window — half-year guidance
  const nextHalf = new Date(now);
  nextHalf.setMonth(nextHalf.getMonth() + 6);
  result.push({
    date: nextHalf.toISOString().slice(0, 10),
    daysOut: 180,
    category: "inspection_window",
    title: `${authority} inspection likely window`,
    description: rule.inspectionGuidance,
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
