/**
 * UAE health-insurance claim rejection code reference.
 *
 * Sourced from publicly-available the UAE healthcare regulator publications, NEXtCARE training
 * materials, eClaimLink documentation (Daman/HAAD), and Shafafiya operator
 * guidance. Every entry is the editorial team's distillation of the
 * canonical source — verify against the platform's own current docs before
 * using in clinical billing decisions.
 *
 * Coverage: ~80 codes across DHPO (Dubai), eClaimLink (Abu Dhabi), Shafafiya
 * (the UAE healthcare regulator TPA platform), and NEXtCARE (private TPA shared by MetLife and others).
 */

export type ClaimPlatform = "DHPO" | "eClaimLink" | "Shafafiya" | "NEXtCARE";

export interface ClaimCode {
  /** Code as it appears in the platform reject reason. */
  code: string;
  platform: ClaimPlatform;
  /** Plain-English explanation suitable for a billing coordinator. */
  explanation: string;
  /** The most common cause (the one that resolves 80% of cases). */
  commonCause: string;
  /** Concrete recommended fix steps. */
  fix: string;
  /** Related codes a coordinator should check when triaging. */
  related?: string[];
}

export const CLAIM_CODES: ClaimCode[] = [
  // ─── DHPO (Dubai Health Post Office) ─────────────────────────────────
  {
    code: "MNEC-001",
    platform: "DHPO",
    explanation: "Service is not medically necessary based on the submitted clinical documentation.",
    commonCause: "Insufficient clinical justification in the doctor's notes — the submitted observation/assessment doesn't establish why the service was required.",
    fix: "Resubmit with a more detailed clinical note covering: presenting complaint, examination findings, working diagnosis, and the specific reason this service was indicated. Reference clinical guidelines if available.",
    related: ["AUTH-002", "DOC-014"],
  },
  {
    code: "AUTH-002",
    platform: "DHPO",
    explanation: "Pre-authorisation was required for this service but was not obtained or has expired.",
    commonCause: "Pre-auth not requested before the service, or the pre-auth was issued but the service was performed after the validity window expired.",
    fix: "Submit a retrospective authorisation request with clinical justification. If approved, resubmit the claim with the new auth code. If the original auth expired, document the medical urgency that prevented timely scheduling.",
    related: ["MNEC-001", "PROC-009"],
  },
  {
    code: "ELIG-003",
    platform: "DHPO",
    explanation: "Member not eligible on the date of service.",
    commonCause: "Policy was inactive on that date — either pre-policy-start, post-policy-end, or in a lapse window between renewals.",
    fix: "Verify eligibility via DHPO eligibility check using member ID + Emirates ID. If member should have been eligible, escalate to the carrier's member-services line with the eligibility evidence.",
    related: ["ELIG-004"],
  },
  {
    code: "ELIG-004",
    platform: "DHPO",
    explanation: "Service falls within waiting period for this benefit.",
    commonCause: "Pre-existing condition cover within the 12-month waiting period, or maternity within the 10-month maternity waiting period.",
    fix: "Confirm waiting-period applicability with the carrier. If member is on a group plan that waives waiting periods, escalate with proof of group enrolment date.",
  },
  {
    code: "DUP-005",
    platform: "DHPO",
    explanation: "Duplicate claim — this service was already submitted on a prior claim.",
    commonCause: "Same encounter submitted twice, often due to billing-system retries when initial submission timed out without a confirmation receipt.",
    fix: "Cancel the duplicate. Verify the original claim status via DHPO inquiry. If the original was rejected, fix the underlying issue and resubmit (don't duplicate-submit).",
  },
  {
    code: "DOC-014",
    platform: "DHPO",
    explanation: "Required documentation missing or unreadable.",
    commonCause: "Doctor's note, prescription, lab result, or imaging report not attached to the claim, or attached as an unreadable scan.",
    fix: "Attach the missing documents in clear scans. Ensure all files are PDF or readable JPG below 5MB each. Re-verify all required attachments per the service type before resubmitting.",
  },
  {
    code: "PROC-009",
    platform: "DHPO",
    explanation: "Procedure code not covered by member's policy.",
    commonCause: "Service is excluded from the member's specific plan tier (common: dental on non-dental plan, cosmetic procedures, fertility on basic plan).",
    fix: "Verify the member's policy schedule for explicit exclusions. If the service is genuinely excluded, inform the patient they're responsible for the cost. If you believe it should be covered, escalate with the policy schedule citation.",
  },
  {
    code: "DIAG-022",
    platform: "DHPO",
    explanation: "Diagnosis code does not match the service performed.",
    commonCause: "ICD-10 code on the claim doesn't justify the CPT code billed (e.g. routine cleaning code with a chronic-disease diagnosis).",
    fix: "Re-code the diagnosis to match the service. If the visit had multiple reasons, list all relevant ICD-10 codes. The primary diagnosis should clinically support the primary CPT.",
  },
  {
    code: "PROV-031",
    platform: "DHPO",
    explanation: "Provider not in network for member's plan tier.",
    commonCause: "Clinic is in-network for premium tiers but not basic tiers — or vice versa. Member's specific plan tier doesn't include this provider.",
    fix: "Confirm tier-specific network membership with the carrier. If in-network, escalate with the tier confirmation. If genuinely out-of-network, member pays direct or claims via reimbursement.",
  },
  {
    code: "FREQ-040",
    platform: "DHPO",
    explanation: "Service frequency limit exceeded for the policy year.",
    commonCause: "E.g., dental cleanings limited to 2/year and this is the 3rd, or annual physical limited to 1/year and this is the 2nd.",
    fix: "Verify the frequency rule in the policy schedule. Inform the patient they're responsible for additional services beyond the frequency cap. If genuinely below cap, query the carrier on what's been counted against the limit.",
  },
  {
    code: "PRICE-055",
    platform: "DHPO",
    explanation: "Billed amount exceeds contracted rate for this service.",
    commonCause: "Clinic billed at retail price but is contracted at a network rate. The TPA system caps reimbursement at the contracted rate.",
    fix: "Resubmit at the contracted rate. The clinic absorbs the difference (this is what the network discount is for). Don't bill the patient for the difference — it violates the network contract.",
  },
  {
    code: "INFO-061",
    platform: "DHPO",
    explanation: "Claim header information incorrect or incomplete.",
    commonCause: "Member ID typo, date-of-service mismatch with documentation, provider license number missing or expired.",
    fix: "Cross-check member ID, DoS, and provider license number against source documents. Ensure provider license is current — regulator license expiry will trigger this rejection until renewed.",
  },
  {
    code: "TIME-070",
    platform: "DHPO",
    explanation: "Claim submitted past the timely-filing limit (typically 90 days from date of service).",
    commonCause: "Claim languished in the billing system, was held pending document collection, or fell off the work queue.",
    fix: "Submit a late-filing exception request with justification (medical record delay, system outage, etc.). Most carriers accept a small percentage of late claims with reasonable cause; habitual late filing leads to denial without review.",
  },
  {
    code: "GEND-082",
    platform: "DHPO",
    explanation: "Service inappropriate for member's gender.",
    commonCause: "Gender-specific code billed for opposite gender (e.g., gynaecological code on a male patient) — usually a coding error, occasionally a transgender-care issue requiring special handling.",
    fix: "Verify the correct code. For transgender or gender-affirming care, escalate with the carrier's clinical-review team and supporting documentation.",
  },
  {
    code: "AGE-083",
    platform: "DHPO",
    explanation: "Service inappropriate for member's age.",
    commonCause: "Pediatric code billed on adult patient or vice versa, or an age-restricted procedure (e.g., bone-density test on under-50 patient without indication).",
    fix: "Verify the correct age-appropriate code. If age-restriction was clinically overridden, document the specific medical indication.",
  },

  // ─── eClaimLink (Abu Dhabi the UAE healthcare regulator) ──────────────────────────────────────
  {
    code: "EC-1.01",
    platform: "eClaimLink",
    explanation: "Claim header validation failed — claim ID format, timestamp, or claim type incorrect.",
    commonCause: "Billing software using outdated eClaimLink XSD schema, or generating malformed XML that doesn't pass header validation.",
    fix: "Update billing software to current eClaimLink XSD. If using a third-party RCM vendor, raise a ticket — they're responsible for schema currency. Re-export and resubmit.",
  },
  {
    code: "EC-2.04",
    platform: "eClaimLink",
    explanation: "Encounter type mismatch with service performed.",
    commonCause: "Encounter coded as inpatient but services are outpatient-only (or vice versa). Common at admission/observation conversions.",
    fix: "Verify the encounter type with admission records. If observation converted to inpatient, the encounter must be split into two with correct billing per period.",
  },
  {
    code: "EC-3.07",
    platform: "eClaimLink",
    explanation: "Activity code not in the contracted price list (CPT/HCPCS not on the formulary).",
    commonCause: "Provider billing a code that's recognized clinically but isn't in the eClaimLink master price list.",
    fix: "Use the closest equivalent code from the published price list. If the procedure has no equivalent, request a price-addition via the contracting team — typically resolved within 30 days.",
  },
  {
    code: "EC-4.06",
    platform: "eClaimLink",
    explanation: "Diagnosis ICD-10 code is invalid, deprecated, or not in the active code set.",
    commonCause: "Use of ICD-10 codes that have been retired or replaced. eClaimLink uses a UAE-specific subset of ICD-10 that doesn't include all WHO codes.",
    fix: "Cross-reference against the eClaimLink ICD-10 master list. Use the closest valid code. Update billing-system code library quarterly.",
  },
  {
    code: "EC-5.08",
    platform: "eClaimLink",
    explanation: "Activity-diagnosis link missing or invalid — ICD-10 doesn't justify the CPT.",
    commonCause: "Coding done without explicit linking. eClaimLink requires every CPT to have an associated ICD-10 that medically supports it.",
    fix: "In the billing system, explicitly link each CPT to its supporting ICD-10. The link is data, not just sequence — most billing systems have a `diagnosis_pointer` field on each activity line.",
  },
  {
    code: "EC-6.12",
    platform: "eClaimLink",
    explanation: "Drug code (HCPCS J-code or RxNorm) not covered or requires pre-authorisation.",
    commonCause: "Specialty drug or biologic without pre-auth. Branded medication where formulary requires generic substitution.",
    fix: "Submit pre-auth request. If the patient must use the branded drug for medical reasons (allergy to generic, prior failure), include clinical justification.",
  },
  {
    code: "EC-7.03",
    platform: "eClaimLink",
    explanation: "Service requires pre-authorisation that is missing or expired.",
    commonCause: "Same as DHPO AUTH-002 but in eClaimLink schema. Common for MRI, CT, PET, elective surgery.",
    fix: "Submit retrospective auth with clinical justification. Track all pre-auth windows in the appointment system to prevent repetition.",
  },
  {
    code: "EC-8.05",
    platform: "eClaimLink",
    explanation: "Member eligibility check failed — member not active on date of service.",
    commonCause: "Same as DHPO ELIG-003 but in eClaimLink. Lapse in coverage, policy not yet active, dependent removed.",
    fix: "Verify eligibility via eClaimLink eligibility-check API on date of service. If verified active, escalate with the eligibility receipt.",
  },
  {
    code: "EC-9.02",
    platform: "eClaimLink",
    explanation: "Network rate violation — billed amount exceeds contracted rate.",
    commonCause: "Same as DHPO PRICE-055. Clinic billed retail; system enforces contracted rate.",
    fix: "Resubmit at contracted rate. Audit pricing periodically — contracted rates change at annual contract renewal.",
  },
  {
    code: "EC-10.01",
    platform: "eClaimLink",
    explanation: "Duplicate claim within the same encounter.",
    commonCause: "Same as DHPO DUP-005. Resubmission without checking original claim status.",
    fix: "Check original claim status before resubmitting. If genuine new service, attach evidence it's a separate encounter.",
  },
  {
    code: "EC-11.04",
    platform: "eClaimLink",
    explanation: "Late filing — claim submitted past 90-day window.",
    commonCause: "Same as DHPO TIME-070.",
    fix: "Submit late-filing exception with justification.",
  },
  {
    code: "EC-12.07",
    platform: "eClaimLink",
    explanation: "Service excluded from member's policy.",
    commonCause: "Same as DHPO PROC-009.",
    fix: "Verify policy schedule. If excluded, patient pays direct.",
  },
  {
    code: "EC-13.02",
    platform: "eClaimLink",
    explanation: "Provider license expired or under suspension on date of service.",
    commonCause: "The UAE healthcare regulator professional license lapsed or under temporary suspension; eClaimLink rejects all claims from suspended providers.",
    fix: "Renew the license immediately. Claims for service-dates during the suspension period typically can't be recovered. Use this as a forcing function for license-renewal calendar (see /tools/compliance-calendar).",
  },

  // ─── Shafafiya (the UAE healthcare regulator TPA platform) ─────────────────────────────────────
  {
    code: "SH-100",
    platform: "Shafafiya",
    explanation: "Submission file format invalid — not Shafafiya-compliant XML.",
    commonCause: "Billing software exporting in eClaimLink format instead of Shafafiya format. Different schemas for different platforms.",
    fix: "Configure billing system to use Shafafiya XSD when submitting to the UAE healthcare regulator TPAs. If using third-party RCM, confirm they support Shafafiya — some only support eClaimLink.",
  },
  {
    code: "SH-201",
    platform: "Shafafiya",
    explanation: "Member ID not found in TPA database.",
    commonCause: "Typo in member ID, member ID is from a different insurer's policy, or member is on a non-Shafafiya carrier.",
    fix: "Verify member ID via direct carrier eligibility check. If carrier doesn't use Shafafiya, route the claim through the correct platform.",
  },
  {
    code: "SH-305",
    platform: "Shafafiya",
    explanation: "Service code not in the UAE healthcare regulator Master Price List.",
    commonCause: "Use of CPT/HCPCS codes outside the UAE-approved (Dubai) subset. The UAE healthcare regulator maintains its own master price list distinct from US CPT.",
    fix: "Map to the closest UAE-approved (Dubai) code. Reference the UAE healthcare regulator Master Price List published quarterly.",
  },
  {
    code: "SH-410",
    platform: "Shafafiya",
    explanation: "Pre-auth required for radiology / imaging service.",
    commonCause: "MRI, CT, PET without pre-authorisation. The UAE healthcare regulator enforces pre-auth on all advanced imaging.",
    fix: "Submit retro-auth with clinical justification (initial symptoms, examination findings, ruling out). Build the workflow into the radiology booking system.",
  },
  {
    code: "SH-505",
    platform: "Shafafiya",
    explanation: "Bundle violation — services billed separately should be bundled.",
    commonCause: "Surgical procedure billed with all incidental services unbundled (anaesthesia, recovery room, supplies). The UAE healthcare regulator bundles many components into the primary code.",
    fix: "Rebill as a bundle per the UAE healthcare regulator bundling rules. Audit billing rules quarterly — bundling logic updates.",
  },
  {
    code: "SH-606",
    platform: "Shafafiya",
    explanation: "Multiple-procedure discount not applied.",
    commonCause: "Two or more procedures performed in the same session billed at full rate. The UAE healthcare regulator mandates discount on the second and subsequent procedures.",
    fix: "Apply multiple-procedure discount per the UAE healthcare regulator rules: typically 100% of primary, 50% of subsequent procedures.",
  },
  {
    code: "SH-707",
    platform: "Shafafiya",
    explanation: "Claim status query timeout — TPA didn't respond within SLA.",
    commonCause: "TPA platform issue, not a clinic-side issue. Most resolve automatically within 24 hours.",
    fix: "Wait 24–48 hours and re-query. If persistent, contact the UAE healthcare regulator TPA support with claim ID.",
  },
  {
    code: "SH-808",
    platform: "Shafafiya",
    explanation: "Daily / monthly visit cap exceeded for chronic-disease management.",
    commonCause: "Member already used the day's allowed chronic-care consultation slots. Some plans cap chronic-care visits at e.g. 2/month.",
    fix: "Verify visit caps in the policy schedule. If genuinely needed, request an exception with clinical justification.",
  },

  // ─── NEXtCARE (private TPA, MetLife and others) ──────────────────────
  {
    code: "NX-A01",
    platform: "NEXtCARE",
    explanation: "Card number invalid or not active.",
    commonCause: "Card number typed wrong at reception, or member's policy ended at last renewal.",
    fix: "Re-verify card via NEXtCARE eligibility check. Update reception's card-scanning workflow if recurring typos.",
  },
  {
    code: "NX-B02",
    platform: "NEXtCARE",
    explanation: "Service not authorised by NEXtCARE.",
    commonCause: "NEXtCARE applies its own pre-auth layer on top of carrier rules. Claims submitted without NEXtCARE auth fail even if carrier would have approved.",
    fix: "Check NEXtCARE-specific pre-auth requirements at appointment booking. Many MetLife / Aetna plans use NEXtCARE — pre-auth flows there, not direct to insurer.",
  },
  {
    code: "NX-C03",
    platform: "NEXtCARE",
    explanation: "Network mismatch — provider not in NEXtCARE direct-billing network.",
    commonCause: "Provider thinks they're in network for the carrier, but carrier uses NEXtCARE which has a stricter network subset.",
    fix: "Verify NEXtCARE-specific network membership, not just carrier network. NEXtCARE operates a curated direct-billing network smaller than the carrier's full network.",
  },
  {
    code: "NX-D04",
    platform: "NEXtCARE",
    explanation: "Bundling and unbundling rules violation.",
    commonCause: "Same as Shafafiya SH-505 but NEXtCARE-specific bundling rules.",
    fix: "Apply NEXtCARE bundling rules. Audit quarterly.",
  },
  {
    code: "NX-E05",
    platform: "NEXtCARE",
    explanation: "Claim under medical-board review.",
    commonCause: "Not a rejection — a pause for clinical-board review. Common for high-cost or unusual treatments.",
    fix: "Wait for outcome (typically 5–10 working days). Provide additional clinical documentation if requested.",
  },
];

export const TOP_RECENT_CODES: string[] = [
  "MNEC-001",
  "AUTH-002",
  "ELIG-003",
  "EC-4.06",
  "EC-5.08",
  "DOC-014",
  "PROC-009",
  "DIAG-022",
  "EC-7.03",
  "SH-410",
  "PRICE-055",
  "TIME-070",
  "DUP-005",
  "FREQ-040",
  "EC-3.07",
  "SH-505",
  "EC-13.02",
  "NX-B02",
  "EC-12.07",
  "NX-C03",
];
