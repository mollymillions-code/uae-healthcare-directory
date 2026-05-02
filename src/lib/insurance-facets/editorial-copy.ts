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

  // ─── Daman (parent brand — covers Enhanced + Basic) ───────────────────────
  // Canonical slug `daman` matches both the SEO URL `/insurance/daman` and
  // the most common label "Daman" present in providers.insurance arrays.
  // Editorial copy below describes Daman Enhanced as the dominant variant;
  // Daman Basic (the DOH-mandated floor cover) is referenced inline.
  {
    slug: "daman",
    nameEn: "Daman",
    nameAr: "ضمان",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Daman — the National Health Insurance Company — is the dominant group medical scheme for white-collar employers in Abu Dhabi and across the UAE. Daman's product line spans the DOH-mandated Basic Scheme (ex-EBP) at the floor and Enhanced/Premier plans above it; Enhanced policies typically carry an annual benefit limit between AED 1M and AED 3M, 10–20% outpatient co-pay (capped at AED 500–1,000 per year for most employer-sponsored variants), and direct billing across Daman's Gold, Silver and Platinum network tiers. The Gold network includes Cleveland Clinic Abu Dhabi, Mediclinic, HealthPoint, Burjeel, NMC Royal, Aster, and the majority of DOH-licensed multi-specialty centres in Abu Dhabi, Dubai and the Northern Emirates. Dental is covered up to AED 3,000–5,000 annually on most Enhanced policies; maternity applies after a 10-month waiting period. Daman Basic is the AED 150,000-cap floor cover for low-income workers with a deliberately narrow public-sector-leaning network. Pre-authorisation is required for elective inpatient, MRI, CT and high-cost specialty drugs. Daman is accepted in every emirate, making it the strongest city-level anchor for specialty facet pages on Zavis.",
    editorialCopyAr:
      "ضمان (شركة التأمين الصحي الوطنية) هو المخطط الطبي الجماعي الأكثر شيوعاً لأصحاب العمل في القطاع الأبيض في أبوظبي وعلى مستوى الدولة. تتدرج منتجات ضمان من الخطة الأساسية التي تفرضها دائرة الصحة (المعروفة سابقاً بخطة المنافع الأساسية) إلى خطط المعزز والبريمير. تتراوح حدود خطط المعزز السنوية بين مليون وثلاثة ملايين درهم، مع نسبة تحمل خارجية بين 10 و20% وبحد أقصى سنوي بين 500 و1000 درهم لأغلب خطط أصحاب العمل، وفوترة مباشرة ضمن شبكات ضمان الذهبية والفضية والبلاتينية. تشمل الشبكة الذهبية كليفلاند كلينك أبوظبي وميديكلينك وهيلث بوينت وبرجيل وإن إم سي رويال وأستر ومعظم المراكز متعددة التخصصات المرخصة في أبوظبي ودبي والإمارات الشمالية. تُغطى طب الأسنان بحد أقصى يتراوح بين 3000 و5000 درهم سنوياً، وتطبق الأمومة بعد فترة انتظار تبلغ عشرة أشهر. أما خطة ضمان الأساسي فهي الحد الأدنى من التغطية الإلزامية بسقف سنوي 150 ألف درهم وشبكة ضيقة تركز على المستشفيات الحكومية. يُشترط الحصول على موافقة مسبقة للعمليات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة عالية التكلفة. يُقبل ضمان في جميع الإمارات مما يجعله المرساة الأقوى لصفحات التخصصات على مستوى المدن في زافيس.",
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

  // ─── Phase 2 expansion (international + private carriers) ───────────────
  // 2026-05-02: editorial copy expanded from drafts. EDITORIAL TEAM should
  // verify network tier names, copay ranges, and known plan quirks against
  // each insurer's published 2026 product sheets before next sitemap rev.

  // ─── AXA Gulf ──────────────────────────────────────────────────────────
  {
    slug: "axa",
    nameEn: "AXA Gulf",
    nameAr: "أكسا الخليج",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "AXA Gulf — now operating as GIG Gulf following the 2023 acquisition by Gulf Insurance Group (GIG) — is one of the longest-tenured international medical carriers in the UAE, with origins going back to AXA's Middle East entry in the early 2000s. Despite the rebrand, member-facing claims processes, network access and policy numbers remain unchanged through the transition: existing policy numbers continue to work at provider receptions, and direct-billing recognition under the AXA name is honoured across the network. The carrier writes both individual and group medical, with strongest penetration in mid-tier and white-collar employer schemes across Dubai, Abu Dhabi, Sharjah and the Northern Emirates.\n\nAXA's UAE network is unusually wide for an international carrier — well over 1,500 direct-billing facilities including the major hospital groups (Mediclinic, NMC, Aster, Burjeel, Saudi German, Medcare, HealthPlus), most DHA, DOH and MOHAP-licensed multi-specialty centres, and a growing pharmacy network. The plan ladder is straightforward: AXA Essential (basic compliance cover), AXA Enhanced (the dominant employer-funded tier), and AXA International (executive-grade with global direct billing at major hospital chains worldwide).\n\nFor AXA Enhanced policyholders, the typical structure is a 10–20% outpatient co-pay capped at AED 500–1,000 per year for white-collar group schemes, 0% co-pay on inpatient stays, and an annual benefit limit between AED 1M and AED 2M. Maternity is covered after a 10-month waiting period (the UAE-standard underwriting practice). Dental is sub-limited to AED 2,000–5,000 annually depending on tier, with a 6-month qualifying period on most plans. Vision sub-limit is AED 1,000–2,000. Pre-authorisation is required for elective inpatient procedures, MRI and CT scans, and high-cost specialty drugs (oncology, biologics, fertility pharmacy).\n\nAXA differentiates from Cigna and Bupa Global on price-to-network depth — Enhanced premiums sit roughly 15–25% below comparable Cigna Close Care plans while still covering the major hospital groups. The trade-off is that AXA's executive tier (International) reaches global direct billing later in the customer journey: it requires a higher tier than Cigna Global Silver. Submit claims via the My AXA app or NextCare portal (depending on plan); reimbursement-route claims typically settle within 7–14 working days.",
    editorialCopyAr:
      "أكسا الخليج — التي تعمل الآن باسم جي آي جي الخليج بعد استحواذ مجموعة الخليج للتأمين عام 2023 — هي إحدى أقدم شركات التأمين الطبي الدولية في الإمارات، وتعود جذورها إلى دخول أكسا إلى الشرق الأوسط في بدايات الألفية. ورغم تغيير الاسم التجاري تظل عمليات المطالبات وحقوق الشبكة وأرقام البوالص دون تغيير من منظور العميل: تواصل البوالص العمل في استقبالات مقدمي الخدمة، وتُقبل بطاقات أكسا في كافة الشبكة. تكتب الشركة بوالص فردية وجماعية، مع انتشار أقوى في خطط أصحاب العمل المتوسطة وللعاملين في القطاعات الإدارية في دبي وأبوظبي والشارقة والإمارات الشمالية.\n\nشبكة أكسا في الإمارات أوسع من المعتاد بين شركات التأمين الدولية — أكثر من 1500 منشأة فوترة مباشرة تشمل مجموعات المستشفيات الكبرى (ميديكلينك، إن إم سي، أستر، برجيل، سعودي ألماني، ميدكير، هيلث بلس)، ومعظم المراكز متعددة التخصصات المرخصة من هيئة الصحة بدبي ودائرة الصحة بأبوظبي ووزارة الصحة، وشبكة صيدليات متنامية. تتدرج الخطط من الأساسية (التغطية الإلزامية) إلى المعززة (الفئة المهيمنة الممولة من أصحاب العمل) إلى الدولية (تنفيذية بفوترة مباشرة عالمية في مجموعات المستشفيات الكبرى).\n\nلحاملي خطط أكسا المعززة، الهيكل النموذجي هو تحمل خارجي بنسبة 10–20% بحد أقصى سنوي بين 500 و1000 درهم لخطط العاملين في القطاعات الإدارية، و0% على الإقامة الداخلية، وحد سنوي يتراوح بين مليون ومليوني درهم. تُغطى الأمومة بعد فترة انتظار عشرة أشهر (الممارسة المعتمدة في الإمارات). تُحدد خدمات الأسنان بسقف فرعي بين 2000 و5000 درهم سنوياً مع فترة تأهيل ستة أشهر، والبصريات بسقف بين 1000 و2000 درهم. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والرنين المغناطيسي والأشعة المقطعية والأدوية عالية التكلفة (أورام، بيولوجية، أدوية الإخصاب).\n\nتتميز أكسا عن سيجنا وبوبا جلوبال في معادلة السعر مقابل عمق الشبكة — تقل أقساط الفئة المعززة بنحو 15–25% عن خطط سيجنا كلوز كير المماثلة مع تغطية مجموعات المستشفيات الكبرى نفسها. المقايضة أن فئة أكسا التنفيذية (الدولية) تصل إلى الفوترة المباشرة العالمية في مرحلة لاحقة من تدرج المنتج. تُقدم المطالبات عبر تطبيق ماي أكسا أو بوابة نيكست كير حسب الخطة، وتُسوى مطالبات الاسترداد عادة خلال 7–14 يوم عمل.",
  },

  // ─── Cigna ─────────────────────────────────────────────────────────────
  {
    slug: "cigna",
    nameEn: "Cigna",
    nameAr: "سيجنا",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Cigna is the most prestigious international carrier in the UAE expat-employer market, particularly for executive-tier hires, globally-mobile professionals, and senior staff at multinationals. The Cigna brand carries unusual cultural weight at HR negotiations — \"Cigna or equivalent\" is shorthand for premium medical cover in the GCC compensation conversation, and matching it on a downgraded carrier is one of the most common reasons candidates push back on UAE offers.\n\nCigna's UAE network is curated rather than wide. Direct billing is anchored at the premium hospital tier — Cleveland Clinic Abu Dhabi, Mediclinic Parkview / City Hospital / Welcare, Saudi German, NMC Royal, Burjeel Medical City, Aster Hospital, Medeor 24x7, HealthPlus — plus most JCI-accredited specialty centres and the majority of DHA, DOH and MOHAP-licensed multi-specialty clinics. Some independent solo-doctor practices fall outside direct billing and require reimbursement-route claims. Pharmacy direct billing covers Aster, Life, BinSina, Medicom and Boots.\n\nThe plan ladder is Cigna Close Care (UAE-only network), Cigna Global Silver, Gold, Platinum and Diamond (each opens a wider international network). Close Care is the dominant tier on UAE employer schedules. Typical Close Care structure: 10–20% outpatient co-pay capped at AED 1,000 per year for most variants, 0% inpatient, an annual benefit limit ranging from AED 2M (Silver) to unlimited (Diamond), and a 10-month maternity waiting period. Dental is included with an AED 3,000–5,000 sub-limit; vision at AED 1,000–2,000. Mental health is covered up to AED 5,000–10,000 outpatient depending on tier, which is meaningfully higher than the GCC market average.\n\nPre-authorisation is required for elective surgery, advanced imaging (MRI, CT, PET), and high-cost specialty drugs (oncology, fertility, biologics). Cigna's claims experience is regarded as the strongest in the segment — the Cigna app delivers in-app pre-authorisation, claim status tracking, and direct-billing card display, and member-services SLAs are tight (most authorisations cleared within 24 hours, complex cases within 5 working days). The trade-off versus AXA Enhanced is price: Cigna Close Care typically sits 25–40% above AXA Enhanced premiums, and Cigna Global tiers compound the gap further.",
    editorialCopyAr:
      "سيجنا هي شركة التأمين الدولية الأكثر هيبة في سوق المغتربين بالإمارات، خاصة للموظفين التنفيذيين والمهنيين المتنقلين دولياً وكبار موظفي الشركات متعددة الجنسيات. تحمل علامة سيجنا ثقلاً ثقافياً غير عادي في مفاوضات الموارد البشرية — عبارة \"سيجنا أو ما يعادلها\" اختصار للتأمين الطبي المتميز في محادثات الرواتب الخليجية.\n\nشبكة سيجنا في الإمارات منتقاة لا واسعة. تتركز الفوترة المباشرة في فئة المستشفيات المتميزة — كليفلاند كلينك أبوظبي، ميديكلينك باركفيو وسيتي ووَلكير، سعودي ألماني، إن إم سي رويال، برجيل ميديكال سيتي، أستر هوسبيتال، ميديور 24×7، هيلث بلس — إضافة إلى معظم مراكز التخصصات المعتمدة من JCI وغالبية العيادات متعددة التخصصات المرخصة من الجهات الصحية. بعض العيادات المستقلة الفردية خارج الفوترة المباشرة وتتطلب مسار استرداد. تُغطي الفوترة المباشرة للصيدليات أستر، لايف، بن سينا، ميديكوم، بوتس.\n\nيتدرج المنتج من سيجنا كلوز كير (شبكة الإمارات فقط) إلى سيجنا جلوبال فضي وذهبي وبلاتيني وألماسي (كل فئة تفتح شبكة دولية أوسع). كلوز كير هي الفئة المهيمنة في خطط أصحاب العمل في الإمارات. الهيكل النموذجي لكلوز كير: تحمل خارجي بنسبة 10–20% بحد أقصى سنوي 1000 درهم، و0% للإقامة الداخلية، وحد سنوي من مليوني درهم (الفضي) إلى غير محدود (الألماسي)، وفترة انتظار للأمومة عشرة أشهر. تُشمل خدمات الأسنان بسقف فرعي بين 3000 و5000 درهم، والبصريات بين 1000 و2000 درهم. تُغطى الصحة النفسية حتى 5000–10000 درهم خارجياً حسب الفئة، وهو سقف أعلى بكثير من متوسط السوق الخليجي.\n\nيُشترط الحصول على موافقة مسبقة للجراحات الاختيارية والأشعة المتقدمة (الرنين، الأشعة المقطعية، PET) والأدوية المتخصصة عالية التكلفة. تجربة المطالبات في سيجنا تُعد الأقوى في القطاع — يقدم تطبيق سيجنا الموافقات المسبقة وتتبع المطالبات وعرض بطاقة الفوترة المباشرة داخل التطبيق، ومستويات الخدمة محكمة (أغلب الموافقات خلال 24 ساعة، الحالات المعقدة خلال 5 أيام عمل). المقايضة مقابل أكسا المعززة هي السعر: ترتفع أقساط سيجنا كلوز كير عادة بنسبة 25–40% فوق المعززة.",
  },

  // ─── MetLife ───────────────────────────────────────────────────────────
  {
    slug: "metlife",
    nameEn: "MetLife",
    nameAr: "ميتلايف",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "MetLife — formerly Alico in the UAE — has one of the most heterogeneous policy bases in the market, spanning low-cost SME compliance schemes, mid-tier white-collar group cover, and a robust executive-tier individual line. The carrier's TPA partner is NEXtCARE (in-house since the GlobeMed acquisition), which is the most common claims platform GCC clinic receptions interact with — a structural advantage for direct-billing reliability that quietly differentiates MetLife from carriers using third-party TPAs.\n\nMetLife's UAE network is broad: ~1,800+ direct-billing providers including the major hospital groups (Mediclinic, NMC, Aster, Burjeel, Saudi German, Medcare, HealthPlus, Medeor), most DHA, DOH and MOHAP-licensed multi-specialty centres, and the standard pharmacy direct-billing network (Aster, Life, BinSina). The plan ladder is structured as Silver, Gold and Platinum (employer-funded group cover) plus a separate individual line for self-paying members.\n\nFor MetLife Gold policyholders — the dominant employer tier — the structure is a 10–20% outpatient co-pay capped at AED 500–1,500 annually, 0% inpatient, an annual benefit limit between AED 1M and AED 3M, and direct billing at the entire UAE network. Maternity has the standard 10-month waiting period (sometimes waived on employer-paid upgrades). Dental is sub-limited at AED 2,000–4,000 with a 6-month qualifying period. Vision is included at AED 1,000–1,500 sub-limit. Pre-authorisation is required for inpatient elective procedures, MRI, CT, and specialty drugs.\n\nMetLife differentiates from AXA and Cigna on the SME segment. The carrier writes more sub-50-employee schemes than most international rivals, with simpler underwriting and more flexible plan-design tweaks for smaller employers. The trade-off is that the executive-tier individual line is less competitive than Cigna Global or Bupa Global at the high end — most senior expats at multinationals will be on Cigna or Bupa rather than MetLife. Submit claims through the MetLife member portal or NEXtCARE app; reimbursement claims typically settle within 10–15 working days. SME group renewals are negotiated annually with material premium movement when claims experience worsens — clinics frequently report MetLife direct-billing accuracy at >95% on first submission.",
    editorialCopyAr:
      "ميتلايف — التي كانت تُعرف سابقاً باسم أليكو في الإمارات — تمتلك إحدى أكثر قواعد البوالص تنوعاً في السوق، وتمتد من خطط الالتزام منخفضة التكلفة للشركات الصغيرة والمتوسطة إلى التغطية الجماعية المتوسطة للموظفين الإداريين، إلى خط فردي تنفيذي قوي. شريك إدارة المطالبات هو نيكست كير (داخلي منذ استحواذ جلوب ميد)، وهو منصة المطالبات الأكثر تعاملاً مع استقبالات العيادات في الخليج — ميزة هيكلية لموثوقية الفوترة المباشرة تميز ميتلايف بهدوء عن منافسيها الذين يعتمدون على أطراف ثالثة.\n\nشبكة ميتلايف في الإمارات واسعة: أكثر من 1800 مقدم خدمة بفوترة مباشرة تشمل مجموعات المستشفيات الكبرى (ميديكلينك، إن إم سي، أستر، برجيل، سعودي ألماني، ميدكير، هيلث بلس، ميديور)، ومعظم المراكز متعددة التخصصات المرخصة، وشبكة الصيدليات المعتادة (أستر، لايف، بن سينا). تتدرج الخطط من الفضية إلى الذهبية إلى البلاتينية (خطط جماعية ممولة من أصحاب العمل) إضافة إلى خط فردي منفصل.\n\nلحاملي خطط ميتلايف الذهبية — الفئة المهيمنة لأصحاب العمل — الهيكل هو تحمل خارجي 10–20% بحد سنوي بين 500 و1500 درهم، و0% للإقامة الداخلية، وحد سنوي بين مليون وثلاثة ملايين درهم، وفوترة مباشرة في كامل شبكة الإمارات. تطبق فترة انتظار عشرة أشهر للأمومة (يُعفى منها أحياناً في الترقيات المدفوعة من صاحب العمل). تُحدد الأسنان بسقف فرعي بين 2000 و4000 درهم مع فترة تأهيل ستة أشهر. تُشمل البصريات بحد فرعي بين 1000 و1500 درهم. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة.\n\nتتميز ميتلايف عن أكسا وسيجنا في قطاع الشركات الصغيرة والمتوسطة. تكتب الشركة بوالص جماعية لمنشآت أقل من 50 موظفاً أكثر من معظم المنافسين الدوليين، مع اكتتاب أبسط ومرونة أعلى في تصميم الخطط. المقايضة هي أن خطها الفردي التنفيذي أقل تنافسية من سيجنا جلوبال أو بوبا جلوبال في الفئة العليا. تُقدم المطالبات عبر بوابة العضو أو تطبيق نيكست كير، وتُسوى مطالبات الاسترداد عادة خلال 10–15 يوم عمل. تُعيد العيادات تكراراً تأكيد دقة الفوترة المباشرة لميتلايف بأكثر من 95% من أول تقديم.",
  },

  // ─── Allianz Care ──────────────────────────────────────────────────────
  {
    slug: "allianz",
    nameEn: "Allianz Care",
    nameAr: "أليانز كير",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Allianz Care is the international expat-medical line of Allianz Partners, headquartered in Dublin and operating across 50+ markets. In the UAE, Allianz Care is most commonly seen on mid-to-high-tier expat employer schemes (oil & gas, professional services, education, multinationals) and on globally-mobile individual policies for executives who travel frequently between regions. Distinct from Allianz Group's general insurance presence in the UAE (which is a separate licensed entity), Allianz Care policies are written from Dublin and serviced through the local NEXtCARE TPA infrastructure for direct billing.\n\nNetwork access in the UAE spans Cleveland Clinic Abu Dhabi, Mediclinic, NMC, Aster, Burjeel, HealthPoint, Medcare, and most DHA, DOH and MOHAP-licensed multi-specialty centres. Pharmacy direct-billing covers the major chains (Aster, Life, BinSina). The plan ladder is Care, Care Plus, Premier, Premier Plus and Prestige (each opens a wider international hospital network). For UAE-resident members, Premier and Premier Plus are the dominant tiers on employer schedules; Prestige is reserved for executive-grade individual policies and partner-track engagements.\n\nFor Premium-tier policyholders, the structure is a 0–20% outpatient co-pay (waived on Premier Plus and Prestige in-network), 0% inpatient, an annual benefit limit ranging from AED 2M (Care) to unlimited (Prestige), and direct billing across the entire UAE network. Maternity is included after a 10-month waiting period; dental at AED 3,000–6,000 sub-limit on enhanced tiers; vision at AED 1,000–1,500. Mental health is covered up to AED 8,000 outpatient on Premier Plus, which is among the highest in the segment. Pre-authorisation required for elective inpatient, advanced imaging, oncology, and specialty drugs.\n\nAllianz Care differentiates on geographic flexibility. Members who relocate within the GCC, Europe or Asia retain continuous cover with no re-underwriting — useful for executives on rotational postings. The trade-off versus Cigna and Bupa is that Allianz Care's UAE direct-billing depth is slightly thinner at the very top of the hospital pyramid (some Cleveland Clinic Abu Dhabi specialty units fall outside direct billing on entry-tier Care plans). Claims experience is solid: the MyHealth digital portal handles pre-authorisations and claims, with most authorisations cleared within 48 hours. Reimbursement claims typically settle in 15–21 working days, slower than Cigna's 7–14 day average.",
    editorialCopyAr:
      "أليانز كير هي خط التأمين الطبي الدولي للمغتربين التابع لأليانز بارتنرز، ومقرها دبلن، وتعمل في أكثر من 50 سوقاً. في الإمارات تُرى أليانز كير غالباً في خطط أصحاب العمل من الفئة المتوسطة إلى العليا (النفط والغاز، الخدمات المهنية، التعليم، الشركات متعددة الجنسيات) وعلى البوالص الفردية للموظفين المتنقلين دولياً. تختلف عن وجود مجموعة أليانز للتأمين العام في الإمارات (كيان مرخص منفصل)، إذ تُكتب بوالص أليانز كير من دبلن وتُخدم عبر بنية تحتية محلية لإدارة المطالبات لدى نيكست كير.\n\nتشمل الشبكة في الإمارات كليفلاند كلينك أبوظبي وميديكلينك وإن إم سي وأستر وبرجيل وهيلث بوينت وميدكير ومعظم المراكز متعددة التخصصات المرخصة. تُغطي الفوترة المباشرة للصيدليات السلاسل الكبرى (أستر، لايف، بن سينا). يتدرج المنتج من Care إلى Care Plus إلى Premier إلى Premier Plus إلى Prestige (كل فئة تفتح شبكة مستشفيات دولية أوسع). للمقيمين في الإمارات Premier و Premier Plus هما الفئتان المهيمنتان في خطط أصحاب العمل، فيما يُحفظ Prestige للبوالص الفردية التنفيذية.\n\nلحاملي الفئات المتميزة، الهيكل هو تحمل خارجي 0–20% (يُلغى في Premier Plus و Prestige داخل الشبكة)، و0% للإقامة الداخلية، وحد سنوي يتراوح من مليوني درهم (Care) إلى غير محدود (Prestige)، وفوترة مباشرة في كامل شبكة الإمارات. تُشمل الأمومة بعد فترة انتظار عشرة أشهر، والأسنان بسقف بين 3000 و6000 درهم في الفئات المعززة، والبصريات بين 1000 و1500 درهم. تُغطى الصحة النفسية حتى 8000 درهم خارجياً في Premier Plus، وهو من أعلى السقوف في القطاع. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والأشعة المتقدمة والأورام والأدوية المتخصصة.\n\nتتميز أليانز كير في المرونة الجغرافية. يحتفظ الأعضاء الذين ينتقلون داخل الخليج أو أوروبا أو آسيا بتغطية متواصلة دون إعادة اكتتاب — مفيد للتنفيذيين في التعيينات الدورية. المقايضة مقابل سيجنا وبوبا هي أن عمق الفوترة المباشرة في الإمارات أقل قليلاً في قمة هرم المستشفيات. تجربة المطالبات قوية عبر بوابة MyHealth الرقمية، تُسوى مطالبات الاسترداد عادة في 15–21 يوم عمل، أبطأ من متوسط سيجنا (7–14 يوم).",
  },

  // ─── Bupa Global ───────────────────────────────────────────────────────
  {
    slug: "bupa",
    nameEn: "Bupa Global",
    nameAr: "بوبا جلوبال",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Bupa Global is the premium international tier of Bupa Insurance and the closest competitor to Cigna Global Diamond at the very top of the UAE expat-medical market. Where Cigna anchors brand prestige, Bupa Global anchors clinical pedigree — Bupa originated as a UK private healthcare provider before becoming an international insurer, and that operator-side heritage shows in its provider-relations playbook (clinical-quality scoring, network curation, and a more selective hospital list).\n\nIn the UAE, Bupa Global is dominant in two segments: executive-expat individual policies (typically AED 25,000–60,000 annual premium for a single adult on Lifeline tiers) and globally-mobile family schemes for high-net-worth households. Network access spans Cleveland Clinic Abu Dhabi, Mediclinic Parkview / City Hospital / Welcare, NMC Royal, Burjeel Medical City, Saudi German, HealthPlus, Aster Hospital, Medeor 24x7, and most JCI-accredited specialty centres. Some independent multi-specialty centres outside the JCI tier fall on reimbursement-route claims rather than direct billing.\n\nThe plan ladder is Bupa Worldwide (entry international tier), Bupa Lifeline Standard, Lifeline Comprehensive and Lifeline Ultimate (top of the line). For Lifeline policyholders, the structure is a 0–10% outpatient co-pay (waived in-network on Comprehensive and Ultimate), 0% inpatient, an annual benefit limit ranging from AED 5M (Standard) to unlimited (Ultimate), and direct billing at the majority of premium UAE providers. Maternity is included with a 10-month waiting period, with private maternity suites at major hospitals covered without sub-limit on Ultimate. Dental is sub-limited at AED 5,000–10,000 (the highest in the segment); vision included at AED 2,000–3,000. Mental health, oncology and chronic disease management are notably comprehensive — AED 15,000+ outpatient mental health and full inpatient oncology cover on Comprehensive and Ultimate.\n\nPre-authorisation is required for elective inpatient, advanced diagnostics, oncology, and specialty drugs. Bupa Global differentiates on inpatient comfort: private rooms are standard on Lifeline tiers, and concierge medical-evacuation cover is built into the policy (vs. add-on for Cigna). The trade-off is price — Lifeline Comprehensive premiums sit roughly 15–25% above comparable Cigna Global Gold, and Lifeline Ultimate premiums are the highest in the GCC market for a non-bespoke product. Claims experience is excellent through the Bupa Global mobile app and 24/7 multilingual member services. Reimbursement claims typically settle within 7–10 working days.",
    editorialCopyAr:
      "بوبا جلوبال هي الفئة الدولية المتميزة من تأمين بوبا، وأقرب منافس لسيجنا جلوبال دايموند في قمة سوق التأمين الطبي للمغتربين في الإمارات. حيث تستند سيجنا إلى الهيبة، تستند بوبا جلوبال إلى الإرث السريري — بدأت بوبا كمزود رعاية صحية خاص في المملكة المتحدة قبل أن تصبح شركة تأمين دولية، وهذا الإرث التشغيلي يظهر في علاقاتها مع مقدمي الخدمة (تقييم الجودة السريرية، انتقاء الشبكة، قائمة مستشفيات أكثر اختياراً).\n\nفي الإمارات تهيمن بوبا جلوبال في قطاعين: البوالص الفردية للمغتربين التنفيذيين (قسط سنوي 25,000–60,000 درهم لشخص بالغ في فئات Lifeline) والخطط العائلية للأسر عالية الثروة المتنقلة دولياً. تشمل الشبكة كليفلاند كلينك أبوظبي وميديكلينك (باركفيو وسيتي وَلكير) وإن إم سي رويال وبرجيل ميديكال سيتي وسعودي ألماني وهيلث بلس وأستر هوسبيتال وميديور 24×7 ومعظم مراكز التخصصات المعتمدة من JCI.\n\nيتدرج المنتج من بوبا الدولية (الفئة الدولية الأساسية) إلى Lifeline Standard و Lifeline Comprehensive و Lifeline Ultimate (قمة المنتج). لحاملي خطط Lifeline، الهيكل هو تحمل خارجي 0–10% (يُلغى داخل الشبكة في Comprehensive و Ultimate)، و0% للإقامة الداخلية، وحد سنوي يتراوح من خمسة ملايين درهم (Standard) إلى غير محدود (Ultimate). تُشمل الأمومة بفترة انتظار عشرة أشهر مع تغطية أجنحة الأمومة الخاصة في المستشفيات الكبرى دون سقف فرعي في Ultimate. تُحدد الأسنان بين 5000 و10000 درهم (الأعلى في القطاع)، والبصريات بين 2000 و3000 درهم. الصحة النفسية والأورام وإدارة الأمراض المزمنة شاملة بشكل ملحوظ — أكثر من 15,000 درهم للصحة النفسية الخارجية وتغطية كاملة للأورام داخلياً.\n\nيُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والتشخيصات المتقدمة والأورام والأدوية المتخصصة. تتميز بوبا جلوبال في رفاهية الإقامة الداخلية: الغرف الخاصة معيارية في فئات Lifeline، وتغطية الإجلاء الطبي الكونسيرج مدمجة في البوليصة (إضافة في سيجنا). المقايضة هي السعر — تعلو أقساط Lifeline Comprehensive نحو 15–25% عن سيجنا جلوبال جولد. تجربة المطالبات ممتازة عبر تطبيق بوبا جلوبال وخدمة الأعضاء متعددة اللغات على مدار الساعة. تُسوى مطالبات الاسترداد عادة خلال 7–10 أيام عمل.",
  },

  // ─── Aetna International ───────────────────────────────────────────────
  {
    slug: "aetna",
    nameEn: "Aetna International",
    nameAr: "آيتنا الدولية",
    type: "carrier",
    geoScope: "uae",
    isDental: true,
    isMedical: true,
    editorialCopyEn:
      "Aetna International is the global expat-medical line of CVS Health-owned Aetna, distinct from Aetna's domestic US operation. In the UAE, Aetna International has strong adoption in mid-to-large multinational employer schemes (US-headquartered firms, professional services, technology, and energy), where the parent-company HR relationship often anchors the choice. The carrier writes through Aetna International Bermuda (a separate underwriting entity from Aetna USA) and services UAE members via the NEXtCARE TPA infrastructure for direct billing.\n\nNetwork access in the UAE spans Mediclinic, NMC, Aster, Burjeel, Saudi German, Medcare, HealthPlus, Cleveland Clinic Abu Dhabi (limited to specific specialties on entry tiers), and most DHA, DOH and MOHAP-licensed multi-specialty centres. Pharmacy direct-billing covers the major chains. The plan ladder is Aetna Pioneer (entry international), Aetna Summit, and Aetna Summit Pinnacle (top tier). Pioneer 1750 is the most common employer-funded variant; Summit and Pinnacle are reserved for executive-grade individual policies and partner-track group cover.\n\nFor Pioneer policyholders, the structure is a 0–20% outpatient co-pay (waived on Summit Pinnacle in-network), 0% inpatient, an annual benefit limit ranging from AED 2M (Pioneer 1750) to unlimited (Pinnacle), and direct billing across the entire UAE network. Maternity is included after a 10-month waiting period (often waived to 0 months on employer-paid upgrades); dental at AED 3,000–8,000 sub-limit on enhanced tiers; vision at AED 1,500–2,500. Mental health and chronic disease management are included on most variants — distinguishing Aetna from MetLife and AXA Enhanced, which often sub-limit mental health more aggressively.\n\nPre-authorisation is required for elective inpatient, MRI, CT, and specialty drugs (oncology, biologics, fertility pharmacy). Aetna International differentiates on the US-bound use case: members who travel to the US for care benefit from Aetna's domestic-US provider relationships, which most other UAE-issued carriers cannot match without significant additional cost. The trade-off is that Aetna's premium positioning sits between AXA Enhanced and Cigna Close Care — slightly above AXA, slightly below Cigna for comparable cover. Claims experience runs through the Aetna International member portal and mobile app; most pre-authorisations clear within 48 hours, reimbursement claims settle in 10–14 working days. Network adequacy is highest in Dubai and Abu Dhabi; Northern Emirates depth is a step below the major carriers.",
    editorialCopyAr:
      "آيتنا الدولية هي خط التأمين الطبي العالمي للمغتربين التابع لشركة آيتنا المملوكة لـ سي في إس هيلث، ومستقلة عن عمليات آيتنا المحلية في الولايات المتحدة. في الإمارات لها انتشار قوي في خطط أصحاب العمل متعددي الجنسيات من الفئة المتوسطة إلى الكبيرة (شركات أمريكية، خدمات مهنية، تقنية، طاقة)، حيث ترسي علاقة الموارد البشرية مع الشركة الأم الاختيار. تكتب الشركة عبر آيتنا الدولية برمودا (كيان اكتتاب منفصل) وتخدم الأعضاء في الإمارات عبر نيكست كير.\n\nتشمل الشبكة في الإمارات ميديكلينك وإن إم سي وأستر وبرجيل وسعودي ألماني وميدكير وهيلث بلس وكليفلاند كلينك أبوظبي (محدوداً بتخصصات محددة في الفئات الأساسية) ومعظم المراكز متعددة التخصصات المرخصة. تُغطي الفوترة المباشرة للصيدليات السلاسل الكبرى. يتدرج المنتج من آيتنا بايونير (الدولية الأساسية) إلى آيتنا سوميت إلى آيتنا سوميت بيناكل (القمة). بايونير 1750 هو البديل الأكثر تمويلاً من أصحاب العمل، فيما يُحفظ سوميت وبيناكل للبوالص الفردية التنفيذية.\n\nلحاملي بايونير، الهيكل هو تحمل خارجي 0–20% (يُلغى في سوميت بيناكل داخل الشبكة)، و0% للإقامة الداخلية، وحد سنوي من مليوني درهم (بايونير 1750) إلى غير محدود (بيناكل)، وفوترة مباشرة في كامل شبكة الإمارات. تُشمل الأمومة بعد فترة انتظار عشرة أشهر (تُختصر لصفر في الترقيات المدفوعة من صاحب العمل)، والأسنان بحد بين 3000 و8000 درهم في الفئات المعززة، والبصريات بين 1500 و2500 درهم. تُشمل الصحة النفسية وإدارة الأمراض المزمنة في معظم البدائل — مما يميز آيتنا عن ميتلايف وأكسا المعززة اللتين تضعان سقوفاً فرعية أكثر صرامة على الصحة النفسية.\n\nيُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة. تتميز آيتنا الدولية في حالة استخدام السفر إلى الولايات المتحدة: يستفيد الأعضاء الذين يسافرون للعلاج هناك من علاقات آيتنا مع مقدمي الخدمة المحليين، وهي ميزة لا تستطيع معظم الشركات الأخرى المصدرة في الإمارات مضاهاتها دون تكلفة إضافية كبيرة. المقايضة أن تموضع أقساط آيتنا يقع بين أكسا المعززة وسيجنا كلوز كير. تجربة المطالبات تمر عبر بوابة العضو وتطبيق الجوال؛ معظم الموافقات المسبقة تصدر خلال 48 ساعة، ومطالبات الاسترداد تُسوى في 10–14 يوم عمل. كفاية الشبكة أعلى في دبي وأبوظبي؛ عمقها في الإمارات الشمالية أقل بدرجة من الشركات الكبرى.",
  },
];

export const INSURANCE_EDITORIAL_BY_SLUG: Record<string, InsuranceEditorialEntry> =
  Object.fromEntries(INSURANCE_EDITORIAL.map((e) => [e.slug, e]));
