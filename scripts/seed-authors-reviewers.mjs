#!/usr/bin/env node
/**
 * seed-authors-reviewers.mjs
 *
 * Seed the canonical Zavis editorial masthead (5 authors) and the 3 placeholder
 * external reviewer slots (`is_active = false` until the editorial team flips
 * them on a real assignment).
 *
 * Run this AFTER applying:
 *   scripts/db/migrations/2026-04-11-authors-reviewers.sql
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/seed-authors-reviewers.mjs
 *
 * Safe to re-run — every upsert is idempotent via ON CONFLICT (slug).
 *
 * IMPORTANT
 * - Uses `pg` (node-postgres) directly. Do NOT switch to
 *   @neondatabase/serverless — see CLAUDE.md § Database Driver.
 * - All reviewer placeholders are seeded with `is_active = FALSE` and a
 *   "Dr. TBD" name. The editorial team must replace the placeholder with
 *   real reviewer data and flip `is_active = TRUE` before any byline
 *   referencing them goes live. The route handler also filters
 *   `is_active = TRUE` so a hidden row is impossible to surface.
 */

import { Pool } from "pg";

// ─── Authors (5) ─────────────────────────────────────────────────────────────
//
// These are institutional / role-based bylines. Real human bylines (e.g.
// "Hidayat Patel, Founder") get inserted by hand from the admin tooling
// once a person has consented to a public profile. The seed only ships
// scaffolding the editorial team can fill in safely.

const AUTHORS = [
  {
    slug: "zavis-intelligence-team",
    name: "Zavis Intelligence Team",
    nameAr: "فريق ذكاء زافيس",
    role: "Editorial Desk",
    roleAr: "مكتب التحرير",
    bio:
      "The Zavis Intelligence Team is the institutional byline used for collaborative coverage produced by the full Zavis editorial desk — reporters, analysts, data scientists and policy researchers working together. Articles attributed to this byline have been written, edited and fact-checked by at least two members of the Zavis editorial team and reviewed against the Zavis editorial policy.",
    bioAr:
      "فريق ذكاء زافيس هو التوقيع المؤسسي المستخدم للتغطية التعاونية التي ينتجها مكتب التحرير الكامل في زافيس — مراسلون ومحللون وعلماء بيانات وباحثون في السياسات يعملون معاً. تخضع المقالات المنشورة تحت هذا التوقيع للكتابة والتحرير والتحقق من الحقائق من قِبل عضوين على الأقل من فريق التحرير ومراجعتها وفق السياسة التحريرية لزافيس.",
    photoUrl: null,
    photoConsent: false,
    email: "intelligence@zavis.ai",
    linkedinUrl: "https://www.linkedin.com/company/zavis-ai",
    twitterUrl: null,
    websiteUrl: "https://zavis.ai/intelligence",
    orcidId: null,
    credentials: [],
    expertise: [
      "uae-healthcare",
      "regulatory",
      "market-intelligence",
      "policy",
    ],
    isActive: true,
    joinedAt: "2025-01-01",
  },
  {
    slug: "zavis-data-science",
    name: "Zavis Data Science Desk",
    nameAr: "مكتب علوم البيانات في زافيس",
    role: "Data & Analytics",
    roleAr: "البيانات والتحليلات",
    bio:
      "The Zavis Data Science Desk authors data-led coverage that leans on the public Zavis directory dataset — 12,500+ UAE healthcare facilities, the DHA Sheryan professional registry, Dubai Pulse open data, and regulator filings. All data-driven articles published under this byline disclose their methodology, sample size and source dataset version.",
    bioAr:
      "يكتب مكتب علوم البيانات في زافيس التغطيات المعتمدة على البيانات التي تستند إلى مجموعة بيانات دليل زافيس العام — أكثر من 12,500 منشأة صحية في الإمارات، وسجل المهنيين شريان التابع لهيئة الصحة بدبي، وبيانات دبي بالس المفتوحة، والإيداعات التنظيمية. تكشف جميع المقالات المنشورة تحت هذا التوقيع عن منهجيتها وحجم العينة وإصدار مجموعة البيانات المصدرية.",
    photoUrl: null,
    photoConsent: false,
    email: "data@zavis.ai",
    linkedinUrl: "https://www.linkedin.com/company/zavis-ai",
    twitterUrl: null,
    websiteUrl: "https://zavis.ai/intelligence/reports",
    orcidId: null,
    credentials: [],
    expertise: [
      "data-science",
      "health-economics",
      "directory-analysis",
      "uae-healthcare",
    ],
    isActive: true,
    joinedAt: "2025-01-01",
  },
  {
    slug: "senior-healthcare-editor",
    name: "Senior Healthcare Editor",
    nameAr: "كبير محرري الرعاية الصحية",
    role: "Senior Editor — Healthcare",
    roleAr: "كبير المحررين — الرعاية الصحية",
    bio:
      "The Senior Healthcare Editor leads weekly Intelligence coverage of UAE healthcare delivery — hospital openings, network expansions, M&A activity and operating-model shifts. This is a role-based byline used until the named editorial hire has consented to a public profile. Editorial decisions made under this byline still pass the standard two-editor review.",
    bioAr:
      "يقود كبير محرري الرعاية الصحية التغطية الأسبوعية في قسم الذكاء حول تقديم الرعاية الصحية في الإمارات — افتتاح المستشفيات، توسعات الشبكات، نشاط الاندماج والاستحواذ، وتحولات نماذج التشغيل. هذا توقيع قائم على الدور يُستخدم إلى أن يوافق المحرر المعين بالاسم على نشر ملف عام، وتمر القرارات التحريرية تحت هذا التوقيع بالمراجعة المعيارية من قِبل محررَين.",
    photoUrl: null,
    photoConsent: false,
    email: "editor@zavis.ai",
    linkedinUrl: null,
    twitterUrl: null,
    websiteUrl: null,
    orcidId: null,
    credentials: [],
    expertise: [
      "uae-healthcare",
      "hospital-operations",
      "healthcare-delivery",
    ],
    isActive: true,
    joinedAt: "2025-01-01",
  },
  {
    slug: "policy-regulatory-editor",
    name: "Policy & Regulatory Editor",
    nameAr: "محرر السياسات والشؤون التنظيمية",
    role: "Policy & Regulatory Editor",
    roleAr: "محرر السياسات والشؤون التنظيمية",
    bio:
      "The Policy & Regulatory Editor covers DHA, DOH, MOHAP, the UAE Ministry of Health and Prevention, and federal-level healthcare legislation. Coverage prioritises licensed-source primary documents — DHA circulars, DOH dashboards, federal cabinet decisions — over secondary press summaries. Role-based byline pending a named editorial hire.",
    bioAr:
      "يغطي محرر السياسات والشؤون التنظيمية هيئة الصحة بدبي ودائرة الصحة في أبوظبي ووزارة الصحة ووقاية المجتمع، والتشريعات الصحية على المستوى الاتحادي في الإمارات. تعطي التغطية الأولوية للوثائق المصدرية الرسمية — تعاميم هيئة الصحة بدبي، ولوحات معلومات دائرة الصحة، وقرارات مجلس الوزراء الاتحادي — على الملخصات الصحفية الثانوية. توقيع قائم على الدور إلى حين تعيين محرر بالاسم.",
    photoUrl: null,
    photoConsent: false,
    email: "policy@zavis.ai",
    linkedinUrl: null,
    twitterUrl: null,
    websiteUrl: null,
    orcidId: null,
    credentials: [],
    expertise: [
      "regulatory",
      "health-policy",
      "dha",
      "doh",
      "mohap",
      "uae-federal-policy",
    ],
    isActive: true,
    joinedAt: "2025-01-01",
  },
  {
    slug: "market-intelligence-editor",
    name: "Market Intelligence Editor",
    nameAr: "محرر ذكاء السوق",
    role: "Market Intelligence Editor",
    roleAr: "محرر ذكاء السوق",
    bio:
      "The Market Intelligence Editor leads coverage of healthcare insurance, payer networks, employer benefits, and the economics of UAE healthcare delivery. Reports filed under this byline disclose any commercial relationships between Zavis and the entities covered. Role-based byline pending a named editorial hire.",
    bioAr:
      "يقود محرر ذكاء السوق التغطية المتعلقة بالتأمين الصحي وشبكات شركات التأمين ومزايا أصحاب العمل واقتصاديات تقديم الرعاية الصحية في الإمارات. تكشف التقارير المنشورة تحت هذا التوقيع عن أي علاقات تجارية بين زافيس والجهات المغطاة. توقيع قائم على الدور إلى حين تعيين محرر بالاسم.",
    photoUrl: null,
    photoConsent: false,
    email: "markets@zavis.ai",
    linkedinUrl: null,
    twitterUrl: null,
    websiteUrl: null,
    orcidId: null,
    credentials: [],
    expertise: [
      "insurance",
      "health-economics",
      "payer-networks",
      "market-intelligence",
    ],
    isActive: true,
    joinedAt: "2025-01-01",
  },
];

// ─── Reviewers (3) ───────────────────────────────────────────────────────────
//
// EVERY reviewer below is seeded with `is_active = FALSE` and a "Dr. TBD"
// placeholder name. They WILL NOT appear on any public page until the
// editorial team replaces the placeholder with a real reviewer + flips
// is_active = TRUE. This is a hard rule — never ship a fake reviewer
// byline (see CLAUDE.md § Common Mistakes).

const REVIEWERS = [
  {
    slug: "reviewer-endocrinology-tbd",
    name: "Dr. TBD",
    nameAr: "د. (يُحدد لاحقاً)",
    title: "Consultant Endocrinologist (placeholder slot)",
    titleAr: "استشاري الغدد الصماء (موقع مؤقت)",
    institution: null,
    bio:
      "Placeholder reviewer slot for endocrinology coverage. Reviews all Zavis clinical content touching diabetes, thyroid, obesity and metabolic conditions. The named consultant will be assigned by the Zavis editorial team and DHA / DOH licence verification will be completed before this reviewer profile is activated. Until then this slot is hidden from all public pages.",
    bioAr:
      "موقع مراجِع مؤقت لتغطية الغدد الصماء. سيراجع جميع محتوى زافيس السريري المتعلق بداء السكري والغدة الدرقية والسمنة والحالات الاستقلابية. سيحدد فريق التحرير في زافيس الاستشاري المعين، وسيتم التحقق من رخصة هيئة الصحة بدبي / دائرة الصحة في أبوظبي قبل تفعيل هذا الملف. حتى ذلك الحين يُخفى هذا الموقع من جميع الصفحات العامة.",
    photoUrl: null,
    photoConsent: false,
    linkedinUrl: null,
    orcidId: null,
    dhaLicenseNumber: null,
    dohLicenseNumber: null,
    mohapLicenseNumber: null,
    specialty: "Endocrinology",
    specialtyAr: "الغدد الصماء",
    reviewerType: "medical",
    expertise: ["endocrinology", "diabetes", "thyroid", "obesity"],
    isActive: false,
    joinedAt: null,
  },
  {
    slug: "reviewer-health-economics-tbd",
    name: "Dr. TBD",
    nameAr: "د. (يُحدد لاحقاً)",
    title: "Health Economist (placeholder slot)",
    titleAr: "خبير اقتصاد صحي (موقع مؤقت)",
    institution: null,
    bio:
      "Placeholder reviewer slot for health-economics review on Zavis Intelligence reports — payer dynamics, claims data, insurance pricing, benefit-design analyses, and macroeconomic write-ups of the UAE healthcare sector. Slot remains hidden until a named expert is assigned and credential review is complete.",
    bioAr:
      "موقع مراجِع مؤقت لمراجعة الاقتصاد الصحي على تقارير زافيس للذكاء — ديناميكيات شركات التأمين، بيانات المطالبات، تسعير التأمين، تحليلات تصميم المزايا، والملخصات الاقتصادية الكلية لقطاع الرعاية الصحية في الإمارات. يبقى هذا الموقع مخفياً إلى حين تعيين خبير بالاسم وإكمال مراجعة المؤهلات.",
    photoUrl: null,
    photoConsent: false,
    linkedinUrl: null,
    orcidId: null,
    dhaLicenseNumber: null,
    dohLicenseNumber: null,
    mohapLicenseNumber: null,
    specialty: "Health Economics",
    specialtyAr: "اقتصاديات الصحة",
    reviewerType: "economic",
    expertise: ["health-economics", "insurance", "payer-data", "claims"],
    isActive: false,
    joinedAt: null,
  },
  {
    slug: "reviewer-regulatory-policy-tbd",
    name: "Dr. TBD",
    nameAr: "د. (يُحدد لاحقاً)",
    title: "Regulatory & Policy Advisor (placeholder slot)",
    titleAr: "مستشار تنظيمي وسياسات (موقع مؤقت)",
    institution: null,
    bio:
      "Placeholder reviewer slot for UAE regulatory and policy coverage. Reviews articles touching DHA, DOH, MOHAP, federal health legislation, PDPL implementation, and licence-class transitions. Slot remains hidden from all public pages until a named expert is assigned. Verification of professional standing and any conflict-of-interest disclosure is required before activation.",
    bioAr:
      "موقع مراجِع مؤقت للتغطية التنظيمية والسياسات في الإمارات. سيراجع المقالات المتعلقة بهيئة الصحة بدبي ودائرة الصحة في أبوظبي ووزارة الصحة، والتشريعات الصحية الاتحادية، وتطبيق قانون حماية البيانات الشخصية، وتحولات فئات التراخيص. يبقى هذا الموقع مخفياً عن جميع الصفحات العامة إلى حين تعيين خبير بالاسم. يُشترط التحقق من المكانة المهنية والإفصاح عن أي تضارب مصالح قبل التفعيل.",
    photoUrl: null,
    photoConsent: false,
    linkedinUrl: null,
    orcidId: null,
    dhaLicenseNumber: null,
    dohLicenseNumber: null,
    mohapLicenseNumber: null,
    specialty: "Regulatory & Policy",
    specialtyAr: "التنظيم والسياسات",
    reviewerType: "policy",
    expertise: ["regulatory", "policy", "dha", "doh", "mohap", "pdpl"],
    isActive: false,
    joinedAt: null,
  },
];

// ─── Upserts ─────────────────────────────────────────────────────────────────

async function upsertAuthor(client, a) {
  await client.query(
    `
    INSERT INTO authors (
      slug, name, name_ar, role, role_ar, bio, bio_ar,
      photo_url, photo_consent, email, linkedin_url, twitter_url,
      website_url, orcid_id, credentials, expertise,
      is_active, joined_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15::jsonb, $16::jsonb,
      $17, $18
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      name_ar = EXCLUDED.name_ar,
      role = EXCLUDED.role,
      role_ar = EXCLUDED.role_ar,
      bio = EXCLUDED.bio,
      bio_ar = EXCLUDED.bio_ar,
      photo_url = EXCLUDED.photo_url,
      photo_consent = EXCLUDED.photo_consent,
      email = EXCLUDED.email,
      linkedin_url = EXCLUDED.linkedin_url,
      twitter_url = EXCLUDED.twitter_url,
      website_url = EXCLUDED.website_url,
      orcid_id = EXCLUDED.orcid_id,
      credentials = EXCLUDED.credentials,
      expertise = EXCLUDED.expertise,
      is_active = EXCLUDED.is_active,
      joined_at = EXCLUDED.joined_at,
      updated_at = NOW();
    `,
    [
      a.slug,
      a.name,
      a.nameAr,
      a.role,
      a.roleAr,
      a.bio,
      a.bioAr,
      a.photoUrl,
      a.photoConsent,
      a.email,
      a.linkedinUrl,
      a.twitterUrl,
      a.websiteUrl,
      a.orcidId,
      JSON.stringify(a.credentials || []),
      JSON.stringify(a.expertise || []),
      a.isActive,
      a.joinedAt,
    ]
  );
}

async function upsertReviewer(client, r) {
  await client.query(
    `
    INSERT INTO reviewers (
      slug, name, name_ar, title, title_ar, institution,
      bio, bio_ar, photo_url, photo_consent,
      linkedin_url, orcid_id,
      dha_license_number, doh_license_number, mohap_license_number,
      specialty, specialty_ar, reviewer_type, expertise,
      is_active, joined_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19::jsonb,
      $20, $21
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      name_ar = EXCLUDED.name_ar,
      title = EXCLUDED.title,
      title_ar = EXCLUDED.title_ar,
      institution = EXCLUDED.institution,
      bio = EXCLUDED.bio,
      bio_ar = EXCLUDED.bio_ar,
      photo_url = EXCLUDED.photo_url,
      photo_consent = EXCLUDED.photo_consent,
      linkedin_url = EXCLUDED.linkedin_url,
      orcid_id = EXCLUDED.orcid_id,
      dha_license_number = EXCLUDED.dha_license_number,
      doh_license_number = EXCLUDED.doh_license_number,
      mohap_license_number = EXCLUDED.mohap_license_number,
      specialty = EXCLUDED.specialty,
      specialty_ar = EXCLUDED.specialty_ar,
      reviewer_type = EXCLUDED.reviewer_type,
      expertise = EXCLUDED.expertise,
      -- DO NOT overwrite is_active on re-runs once an editor has flipped it.
      -- We only set is_active on first insert.
      joined_at = EXCLUDED.joined_at,
      updated_at = NOW();
    `,
    [
      r.slug,
      r.name,
      r.nameAr,
      r.title,
      r.titleAr,
      r.institution,
      r.bio,
      r.bioAr,
      r.photoUrl,
      r.photoConsent,
      r.linkedinUrl,
      r.orcidId,
      r.dhaLicenseNumber,
      r.dohLicenseNumber,
      r.mohapLicenseNumber,
      r.specialty,
      r.specialtyAr,
      r.reviewerType,
      JSON.stringify(r.expertise || []),
      r.isActive,
      r.joinedAt,
    ]
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set. Aborting.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const a of AUTHORS) {
      await upsertAuthor(client, a);
      console.log(`  upsert author ${a.slug}${a.isActive ? "" : " (hidden)"}`);
    }
    for (const r of REVIEWERS) {
      await upsertReviewer(client, r);
      console.log(
        `  upsert reviewer ${r.slug}${r.isActive ? "" : " (hidden — placeholder)"}`
      );
    }

    await client.query("COMMIT");
    console.log(
      `\n✔ Seeded ${AUTHORS.length} authors + ${REVIEWERS.length} reviewers ` +
        `(reviewers are hidden until editorial flips is_active=true).`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
