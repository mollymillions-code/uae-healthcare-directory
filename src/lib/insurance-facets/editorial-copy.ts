/**
 * Payer-specific bilingual editorial copy for insurance facet pages.
 *
 * Each entry is 150–250 words of real, insurance-literate UAE content
 * covering: network tier, typical copay, geographic scope, and known
 * plan quirks (e.g. Thiqa-AD-only, Daman EBP vs Enhanced, etc.).
 *
 * Used by `src/lib/insurance-facets/data.ts` and
 * `scripts/seed-insurance-plans.mjs` as the canonical source when
 * hydrating the `insurance_plans` table.
 *
 * NOTE: editorial copy is factual at time of drafting (April 2026).
 * Update when network tiers or payer product lines change materially.
 */

export type InsurancePlanType = "carrier" | "TPA" | "gov";
export type InsuranceGeoScope =
  | "uae"
  | "abu-dhabi"
  | "dubai"
  | "sharjah"
  | "northern-emirates";

export interface InsuranceEditorialEntry {
  slug: string;
  nameEn: string;
  nameAr: string;
  type: InsurancePlanType;
  geoScope: InsuranceGeoScope;
  isDental: boolean;
  isMedical: boolean;
  parentPlanSlug?: string;
  logoUrl?: string;
  editorialCopyEn: string;
  editorialCopyAr: string;
}

export const INSURANCE_EDITORIAL: InsuranceEditorialEntry[] = [
  // ─── Thiqa (AD-only, UAE nationals) ────────────────────────────────────────
  {
    slug: "thiqa",
    nameEn: "Thiqa",
    nameAr: "ثقة",
    type: "gov",
    geoScope: "abu-dhabi",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Thiqa is the Government of Abu Dhabi's premium health programme for Emirati nationals, administered by Daman on behalf of the Department of Health Abu Dhabi (DOH). Coverage is restricted to UAE nationals holding an Abu Dhabi family book and is not available to expatriates or to residents of other emirates. Thiqa provides near-zero co-pay at all DOH-licensed facilities in Abu Dhabi and Al Ain, and at a gated list of private facilities inside the emirate. Outside Abu Dhabi, reciprocal network access is limited to DHA/MOHAP facilities that have signed Thiqa direct-billing agreements — typically major hospital groups such as Mediclinic, NMC, Aster and Burjeel. Dental, optical and maternity are included without sub-limit for the standard programme; international referrals require DOH pre-authorisation. Because Thiqa is geographically bounded, Zavis only surfaces Thiqa pages for Abu Dhabi and Al Ain, and suppresses Thiqa facet URLs elsewhere to avoid thin content.",
    editorialCopyAr:
      "ثقة هو البرنامج الحكومي المميز للتأمين الصحي في إمارة أبوظبي، المخصص حصرياً لمواطني الدولة وتديره شركة ضمان بالنيابة عن دائرة الصحة – أبوظبي. يقتصر الانتساب على المواطنين الإماراتيين الحاملين لخلاصة قيد أبوظبي ولا يتاح للمقيمين أو لمواطني الإمارات الأخرى. يوفر ثقة تغطية شبه كاملة بدون دفع شخصي تقريباً في جميع المنشآت المرخصة من دائرة الصحة في أبوظبي والعين، وفي قائمة مختارة من المنشآت الخاصة داخل الإمارة. خارج أبوظبي تقتصر الشبكة المتبادلة على المنشآت المرخصة من هيئة الصحة بدبي ووزارة الصحة التي وقعت اتفاقيات مباشرة مع ضمان. تشمل التغطية خدمات الأسنان والعيون والأمومة بدون حدود فرعية للبرنامج الأساسي، مع اشتراط الموافقة المسبقة للعلاج خارج الدولة. ولأن ثقة مقيّد جغرافياً، تعرض زافيس صفحات ثقة في أبوظبي والعين فقط وتستبعد باقي الإمارات لتجنب المحتوى الضعيف.",
  },

  // ─── Daman Enhanced ────────────────────────────────────────────────────────
  {
    slug: "daman-enhanced",
    nameEn: "Daman Enhanced",
    nameAr: "ضمان المعزز",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    parentPlanSlug: "daman",
    editorialCopyEn:
      "Daman Enhanced is the National Health Insurance Company's mid-to-high-tier product line and the dominant group medical scheme for white-collar employers in Abu Dhabi and across the UAE. Enhanced plans sit above the DOH-mandated Basic Scheme (ex-EBP) and typically carry an annual benefit limit between AED 1M and AED 3M, 10–20% outpatient co-pay (capped at AED 500–1,000 per year for most employer-sponsored variants), and direct billing across Daman's Gold, Silver and Platinum network tiers. The Gold network includes Cleveland Clinic Abu Dhabi, Mediclinic, HealthPoint, Burjeel, NMC Royal, Aster, and the majority of DOH-licensed multi-specialty centres in Abu Dhabi, Dubai and the Northern Emirates. Dental is covered up to AED 3,000–5,000 annually on most Enhanced policies; maternity applies after a 10-month waiting period. Pre-authorisation is required for elective inpatient, MRI, CT and high-cost specialty drugs. Daman Enhanced is accepted in every emirate, making it the strongest city-level anchor for specialty facet pages on Zavis.",
    editorialCopyAr:
      "ضمان المعزز هو فئة المنتجات المتوسطة إلى العليا التي تقدمها شركة التأمين الصحي الوطنية ضمان، ويُعد المخطط الطبي الجماعي الأكثر شيوعاً لأصحاب العمل في القطاع الأبيض في أبوظبي وعلى مستوى الدولة. تقع خطط المعزز فوق الخطة الأساسية التي تفرضها دائرة الصحة، وتتراوح حدودها السنوية عادة بين مليون وثلاثة ملايين درهم، مع نسبة تحمل خارجية بين 10 و20% وبحد أقصى سنوي بين 500 و1000 درهم لأغلب خطط أصحاب العمل، وفوترة مباشرة ضمن شبكات ضمان الذهبية والفضية والبلاتينية. تشمل الشبكة الذهبية كليفلاند كلينك أبوظبي وميديكلينك وهيلث بوينت وبرجيل وإن إم سي رويال وأستر ومعظم المراكز متعددة التخصصات المرخصة في أبوظبي ودبي والإمارات الشمالية. تُغطى طب الأسنان بحد أقصى يتراوح بين 3000 و5000 درهم سنوياً، وتطبق الأمومة بعد فترة انتظار تبلغ عشرة أشهر. يُشترط الحصول على موافقة مسبقة للعمليات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة عالية التكلفة. يُقبل ضمان المعزز في جميع الإمارات مما يجعله المرساة الأقوى لصفحات التخصصات على مستوى المدن في زافيس.",
  },

  // ─── Daman Basic (ex-EBP) ──────────────────────────────────────────────────
  {
    slug: "daman-basic",
    nameEn: "Daman Basic",
    nameAr: "ضمان الأساسي",
    type: "carrier",
    geoScope: "uae",
    isDental: false,
    isMedical: true,
    parentPlanSlug: "daman",
    editorialCopyEn:
      "Daman Basic — historically known as the Essential Benefits Plan (EBP) or the Abu Dhabi Basic Scheme — is the floor of mandatory cover for low-income workers whose salary is below AED 4,000/month plus housing. Employers in Dubai and Abu Dhabi are legally required to provide at least this tier under DHA and DOH mandates. The annual cap is AED 150,000, with a 20% outpatient co-pay up to AED 500/year and AED 300 per inpatient admission. The network is deliberately narrow — Daman Basic steers members toward public-sector hospitals (SEHA in Abu Dhabi; Dubai Academic Health Corporation in Dubai) plus a curated list of mid-tier private clinics. Dental is excluded except for emergencies. Maternity is covered at public facilities only, with a 6-month waiting period. On Zavis, Daman Basic facet pages exist for every emirate but lean heavily on public hospital listings and non-premium clinics; high-end dermatology, cosmetic or IVF pages intentionally suppress this payer because the tuples are empty by design.",
    editorialCopyAr:
      "ضمان الأساسي — المعروف تاريخياً بخطة المنافع الأساسية أو الخطة الأساسية لأبوظبي — هو الحد الأدنى من التغطية الإلزامية للعمال محدودي الدخل الذين يقل راتبهم عن أربعة آلاف درهم شهرياً إضافة إلى السكن. يلزم القانون أصحاب العمل في دبي وأبوظبي بتقديم هذه الفئة كحد أدنى وفقاً للوائح هيئة الصحة بدبي ودائرة الصحة في أبوظبي. يبلغ السقف السنوي 150 ألف درهم مع تحمل خارجي بنسبة 20% وبحد أقصى 500 درهم سنوياً و300 درهم لكل دخول للمستشفى. الشبكة ضيقة بشكل متعمد إذ توجه ضمان الأساسي أعضاءه نحو المستشفيات الحكومية (صحة في أبوظبي ومؤسسة دبي الصحية الأكاديمية في دبي) إضافة إلى قائمة مختارة من العيادات الخاصة المتوسطة. تُستثنى خدمات الأسنان باستثناء الحالات الطارئة، وتُغطى الأمومة في المرافق الحكومية فقط مع فترة انتظار ستة أشهر. تعرض زافيس صفحات ضمان الأساسي لكل الإمارات لكنها تعتمد بشكل كبير على المستشفيات الحكومية والعيادات غير المميزة، وتُستبعد صفحات الأمراض الجلدية العليا والتجميل وأطفال الأنابيب لأن مجموعات النتائج فيها تكون فارغة بطبيعة التصميم.",
  },

  // ─── Hayah (formerly AXA Green Crescent) ───────────────────────────────────
  {
    slug: "hayah",
    nameEn: "Hayah Insurance",
    nameAr: "حياة للتأمين",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Hayah Insurance is an Abu Dhabi–listed composite insurer that rebranded from AXA Green Crescent in 2022 and retains the ADX ticker HAYAH. On the medical side Hayah operates as a specialist SME and retail carrier with a focused network rather than a mass-market footprint. Co-pay on typical Hayah Enhanced plans is 20% outpatient (capped at AED 500–750 per year), 0% inpatient at network facilities, and direct billing via the NAS/Neuron switch which also handles Hayah's pre-authorisation workflow. Network depth is strongest in Abu Dhabi and Dubai and thinner in Sharjah, Ajman and the Northern Emirates — Hayah facet pages for those emirates are gated on Zavis if fewer than five verified providers accept the plan. Maternity has a 12-month waiting period. Dental is bolt-on, priced 10–18% of the medical premium. The headline plan targets Emirati and GCC national policyholders in the AED 2,500–6,000 annual premium band, which makes Hayah visible primarily on city-level hubs rather than rarer specialty × city intersections.",
    editorialCopyAr:
      "حياة للتأمين شركة تأمين مركّبة مدرجة في بورصة أبوظبي أعادت تسمية نفسها من أكسا جرين كريسنت في عام 2022 وتحتفظ بالرمز التداولي HAYAH. على صعيد التأمين الصحي تعمل حياة كناقل متخصص للشركات الصغيرة والمتوسطة والأفراد بشبكة مركّزة وليست شبكة سوق شاملة. تبلغ نسبة التحمل في خطط حياة المعززة النموذجية 20% للعيادات الخارجية بحد أقصى بين 500 و750 درهماً سنوياً و0% للإقامة الداخلية في منشآت الشبكة مع فوترة مباشرة عبر ناس/نيورون الذي يتولى أيضاً إجراءات الموافقة المسبقة. الشبكة أعمق في أبوظبي ودبي وأقل كثافة في الشارقة وعجمان والإمارات الشمالية، لذا تقوم زافيس بإخفاء صفحات حياة لتلك الإمارات إذا انخفض عدد مقدمي الخدمة المعتمدين عن خمسة. فترة انتظار الأمومة اثنا عشر شهراً وخدمات الأسنان إضافة اختيارية تتراوح تكلفتها بين 10 و18% من القسط الطبي. تستهدف الخطة الرئيسية حاملي الجنسية الإماراتية ومواطني دول الخليج في شريحة الأقساط السنوية بين 2500 و6000 درهم، مما يجعل حياة ظاهرة في الغالب على روابط المدن أكثر من تقاطعات التخصصات النادرة.",
  },

  // ─── ADNIC ─────────────────────────────────────────────────────────────────
  {
    slug: "adnic",
    nameEn: "ADNIC",
    nameAr: "أدنيك",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Abu Dhabi National Insurance Company (ADNIC) is one of the UAE's oldest composite insurers, listed on ADX since 1990, and operates one of the two largest domestic medical portfolios alongside Sukoon. ADNIC's group medical book skews heavily toward Abu Dhabi federal entities, SEHA, ADNOC, EGA and large Dubai-based groups, which means the ADNIC network lists nearly every major hospital and multi-specialty centre in the UAE plus a long tail of SME clinics. Standard ADNIC Enhanced policies run at 10% outpatient co-pay (no annual cap on many corporate variants), 0% inpatient at in-network facilities, and direct billing via MedNet or NAS depending on the policy. Dental is included up to AED 2,000–4,000 annually and optical up to AED 1,500. ADNIC's ADNIC Business Flex micro-SME product has grown fast since 2024 and uses a narrower network. On Zavis, ADNIC surfaces across all seven emirates and all top specialty categories, making it a safe tri-facet anchor payer that rarely trips the thin-content gate.",
    editorialCopyAr:
      "شركة أبوظبي الوطنية للتأمين (أدنيك) واحدة من أقدم شركات التأمين المركبة في الإمارات، مدرجة في سوق أبوظبي للأوراق المالية منذ عام 1990 وتدير واحدة من أكبر محفظتين طبيتين محليتين إلى جانب سكون. تتجه محفظة أدنيك الطبية الجماعية بشكل كبير نحو الجهات الاتحادية في أبوظبي ومجموعة صحة وأدنوك والإمارات العالمية للألمنيوم والمجموعات الكبرى في دبي مما يعني أن شبكة أدنيك تضم تقريباً كل المستشفيات الكبرى والمراكز متعددة التخصصات في الدولة إضافة إلى قائمة طويلة من عيادات الشركات الصغيرة. تعمل خطط أدنيك المعززة النموذجية بنسبة تحمل 10% للعيادات الخارجية دون سقف سنوي في كثير من المتغيرات المؤسسية و0% للإقامة الداخلية في منشآت الشبكة مع فوترة مباشرة عبر ميدنت أو ناس بحسب البوليصة. تشمل التغطية طب الأسنان بحد أقصى بين ألفين وأربعة آلاف درهم سنوياً والعيون حتى 1500 درهم. حقق منتج أدنيك بزنس فليكس للشركات الصغيرة جداً نمواً سريعاً منذ 2024 ويستخدم شبكة أضيق. على زافيس تظهر أدنيك في الإمارات السبع وفي جميع التخصصات الرئيسية مما يجعلها ناقلاً آمناً لصفحات الوجوه الثلاثية نادراً ما تخالف حاجز المحتوى الضعيف.",
  },

  // ─── Sukoon (ex-Oman Insurance) ────────────────────────────────────────────
  {
    slug: "oman-insurance",
    nameEn: "Sukoon Insurance",
    nameAr: "سكون للتأمين",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Sukoon — rebranded from Oman Insurance Company in October 2022 — is the DFM-listed market leader in Dubai group medical, majority-owned by Mashreq Bank and partnered with Munich Re / MedNet on the TPA side. Sukoon writes more DHA Essential Benefits Plan (EBP) policies for low-income workers than any other private carrier in Dubai, and simultaneously runs the premium Sukoon Gold and Elite tiers that rival Bupa Global and Cigna on network depth. Typical Sukoon Enhanced plans carry 10–20% outpatient co-pay, 0% inpatient, a AED 1M annual limit, and direct billing at over 1,800 provider facilities across the UAE. Maternity is covered with a 10-month waiting period (reduced to 0 on employer-paid upgrades). Dental is included at AED 2,500–5,000 sub-limit. Because Sukoon anchors the DHA EBP market, its Dubai surface on Zavis is the deepest of any payer — every Dubai × specialty × Sukoon tuple clears the thin-content gate with room to spare. Outside Dubai the network is strong but less dense; smaller Sharjah and Ajman specialty tuples are gated.",
    editorialCopyAr:
      "سكون — التي أعادت تسمية نفسها من شركة عمان للتأمين في أكتوبر 2022 — هي الشركة الرائدة المدرجة في سوق دبي المالي في التأمين الطبي الجماعي في دبي، ويمتلك بنك المشرق حصة الأغلبية فيها وتتعاون مع ميونخ ري وميدنت على جانب إدارة المطالبات. تكتب سكون عدداً من بوالص خطة المنافع الأساسية التابعة لهيئة الصحة بدبي أكبر من أي ناقل خاص آخر، وفي الوقت نفسه تدير فئاتها الذهبية والنخبة الراقية التي تنافس بوبا جلوبال وسيجنا في عمق الشبكة. تتضمن خطط سكون المعززة النموذجية تحملاً خارجياً بنسبة 10–20% و0% للإقامة الداخلية وحداً سنوياً قدره مليون درهم وفوترة مباشرة في أكثر من 1800 منشأة في الدولة. تُغطى الأمومة بفترة انتظار عشرة أشهر تُخفّض إلى صفر في الترقيات التي يمولها صاحب العمل، وتُشمل خدمات الأسنان بحد فرعي بين 2500 و5000 درهم. ولأن سكون مرساة سوق الخطة الأساسية في دبي فإن سطحها في دبي على زافيس هو الأعمق بين كل النواقل، وكل ثلاثية (دبي × تخصص × سكون) تتجاوز حاجز المحتوى الضعيف بسهولة. خارج دبي تبقى الشبكة قوية لكن أقل كثافة، وتُقفَل تقاطعات التخصصات الأصغر في الشارقة وعجمان.",
  },
];

export const INSURANCE_EDITORIAL_BY_SLUG: Record<string, InsuranceEditorialEntry> =
  Object.fromEntries(INSURANCE_EDITORIAL.map((e) => [e.slug, e]));
