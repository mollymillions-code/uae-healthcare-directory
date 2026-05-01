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
  // 2026-05-02: editorial copy is draft-quality. EDITORIAL TEAM should
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
      "AXA Gulf — now operating as GIG Gulf following the 2023 acquisition by Gulf Insurance Group — is one of the longest-tenured international medical carriers in the UAE, with a dense direct-billing network across Dubai, Abu Dhabi, Sharjah and the Northern Emirates. AXA Enhanced plans typically carry a 10–20% outpatient co-pay (capped at AED 500–1,000 annually for white-collar group schemes), 0% inpatient, and an AED 1M–2M annual benefit limit. Network access spans Mediclinic, NMC, Aster, Burjeel, Saudi German, and most DHA/DOH-licensed multi-specialty centres; the highest tier (AXA International) opens worldwide direct billing at most major hospital chains. Maternity carries a 10-month waiting period; dental is sub-limited to AED 2,000–5,000 annually depending on tier. Pre-authorisation is required for elective inpatient procedures, MRI/CT scans, and high-cost specialty drugs. Because AXA's group penetration is strong across all emirates, every Phase 2 (city × specialty × AXA) tuple in `TRI_FACET_INSURER_ALLOW` reliably clears the min-provider threshold.",
    editorialCopyAr:
      "أكسا الخليج — التي تعمل الآن باسم جي آي جي الخليج بعد استحواذ مجموعة الخليج للتأمين عام 2023 — هي إحدى أقدم شركات التأمين الطبي الدولية في الإمارات، وتمتلك شبكة فوترة مباشرة كثيفة في دبي وأبوظبي والشارقة والإمارات الشمالية. تتضمن خطط أكسا المعززة النموذجية تحملاً خارجياً بنسبة 10–20% (بحد أقصى سنوي بين 500 و1000 درهم لمعظم خطط الموظفين)، و0% للإقامة الداخلية، وحداً سنوياً يتراوح بين مليون ومليوني درهم. تشمل الشبكة ميديكلينك وإن إم سي وأستر وبرجيل وسعودي ألماني ومعظم المراكز متعددة التخصصات المرخصة من هيئة الصحة بدبي ودائرة الصحة. يُغطى الأمومة بفترة انتظار عشرة أشهر، وتُحدد خدمات الأسنان بحد فرعي يتراوح بين 2000 و5000 درهم سنوياً. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية للإقامة الداخلية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة عالية التكلفة. ولأن انتشار أكسا قوي في جميع الإمارات، فإن كل تقاطع (مدينة × تخصص × أكسا) في القائمة المسموحة يتجاوز حد المحتوى الضعيف بثقة.",
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
      "Cigna is one of the strongest international carriers in the UAE expat segment, particularly for executive-tier and globally-mobile group plans. Cigna's UAE network is built around a curated tier of premium hospital groups — Cleveland Clinic Abu Dhabi, Mediclinic, Saudi German, NMC Royal, Burjeel, Aster, Medeor, HealthPlus, and most JCI-accredited specialty centres — with direct billing at the majority of DHA, DOH and MOHAP-licensed multi-specialty clinics. Cigna Global / Close Care plans carry 10–20% outpatient co-pay (capped at AED 1,000 annually for most variants), 0% inpatient, AED 2M–unlimited annual benefit limit, and a 10-month maternity waiting period. Dental is included at AED 3,000–5,000 sub-limit; vision at AED 1,000–2,000. Pre-authorisation is required for elective surgery, MRI/CT, and high-cost specialty drugs. Cigna ranks in the top tier of expat-employer choice and clears the Phase 2 thin-content gate in every UAE emirate.",
    editorialCopyAr:
      "سيجنا هي إحدى أقوى شركات التأمين الدولية في قطاع المغتربين في الإمارات، خاصة لخطط المستوى التنفيذي والخطط الجماعية للموظفين المتنقلين دولياً. تُبنى شبكة سيجنا في الإمارات حول مستوى مختار من مجموعات المستشفيات المتميزة — كليفلاند كلينك أبوظبي وميديكلينك وسعودي ألماني وإن إم سي رويال وبرجيل وأستر وميديور وهيلث بلس ومعظم مراكز التخصصات المعتمدة من JCI — مع فوترة مباشرة في غالبية العيادات متعددة التخصصات المرخصة من الجهات الصحية. تتضمن خطط سيجنا العالمية تحملاً خارجياً بنسبة 10–20% (بحد أقصى سنوي 1000 درهم لمعظم البدائل)، و0% للإقامة الداخلية، وحداً سنوياً يتراوح من مليوني درهم إلى غير محدود، وفترة انتظار للأمومة مدتها عشرة أشهر. تُشمل خدمات الأسنان بحد فرعي بين 3000 و5000 درهم، والبصريات بحد بين 1000 و2000 درهم. يُشترط الحصول على موافقة مسبقة للجراحات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة عالية التكلفة. تحتل سيجنا الترتيب الأعلى في خيارات أصحاب العمل للمغتربين وتتجاوز عتبة المحتوى الضعيف في كل إمارات الدولة.",
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
      "MetLife operates one of the broadest direct-billing networks among international carriers in the UAE, anchored by partnerships with NEXtCARE (its in-house TPA) and a Gold/Silver tier structure that scales from white-collar SME group plans to executive-tier individual policies. MetLife Enhanced plans carry 10–20% outpatient co-pay (capped at AED 500–1,500 annually), 0% inpatient, AED 1M–3M annual benefit limit, and direct billing at Mediclinic, NMC, Aster, Burjeel, Saudi German and most DHA/DOH-licensed multi-specialty centres. Maternity has a 10-month waiting period; dental is sub-limited at AED 2,000–4,000. Pre-authorisation required for inpatient electives, MRI, CT and specialty drugs. MetLife has strong UAE-wide adoption — every emirate clears the Phase 2 thin-content gate.",
    editorialCopyAr:
      "تدير ميتلايف واحدة من أوسع شبكات الفوترة المباشرة بين شركات التأمين الدولية في الإمارات، مدعومة بشراكات مع نيكست كير (مدير المطالبات الداخلي لها) وهيكل فئات ذهبية وفضية يمتد من خطط الشركات الصغيرة والمتوسطة إلى البوالص التنفيذية الفردية. تتضمن خطط ميتلايف المعززة تحملاً خارجياً بنسبة 10–20% (بحد أقصى سنوي بين 500 و1500 درهم)، و0% للإقامة الداخلية، وحداً سنوياً بين مليون وثلاثة ملايين درهم، وفوترة مباشرة في ميديكلينك وإن إم سي وأستر وبرجيل وسعودي ألماني ومعظم المراكز متعددة التخصصات. تطبق فترة انتظار عشرة أشهر للأمومة، وتُحدد الأسنان بسقف فرعي بين 2000 و4000 درهم. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة. تتمتع ميتلايف بانتشار قوي في جميع إمارات الدولة وتتجاوز عتبة المحتوى الضعيف.",
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
      "Allianz Care is the international expat-focused medical line of Allianz Partners, with strong UAE penetration in mid-to-high-tier expat employer schemes and globally-mobile individual plans. Network access in the UAE spans Cleveland Clinic Abu Dhabi, Mediclinic, NMC, Aster, Burjeel, HealthPoint and most DHA/DOH-licensed multi-specialty centres. Allianz Premium plans typically carry 0–20% outpatient co-pay (waived on Premier and Premier Plus tiers for in-network), 0% inpatient, AED 2M–unlimited annual limit, and direct billing across the entire UAE network. Maternity is included after a 10-month waiting period; dental at AED 3,000–6,000 sub-limit on enhanced tiers. Pre-authorisation required for elective inpatient, MRI, CT, and high-cost drugs. Allianz Care is one of the most-listed insurers in `provider.insurance` arrays across the directory, clearing Phase 2 thin-content gates in every emirate.",
    editorialCopyAr:
      "أليانز كير هي خط التأمين الطبي الدولي للمغتربين التابع لأليانز بارتنرز، ولها انتشار قوي في الإمارات في خطط أصحاب العمل من الفئة المتوسطة إلى العليا والبوالص الفردية للموظفين المتنقلين دولياً. تشمل الشبكة في الإمارات كليفلاند كلينك أبوظبي وميديكلينك وإن إم سي وأستر وبرجيل وهيلث بوينت ومعظم المراكز متعددة التخصصات المرخصة. تتضمن خطط أليانز بريميوم تحملاً خارجياً بنسبة 0–20% (يُلغى في فئتي بريمير وبريمير بلس داخل الشبكة)، و0% للإقامة الداخلية، وحداً سنوياً من مليوني درهم إلى غير محدود، وفوترة مباشرة في كامل شبكة الإمارات. تُشمل الأمومة بعد فترة انتظار عشرة أشهر، وتُحدد خدمات الأسنان بحد فرعي بين 3000 و6000 درهم في الفئات المعززة. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية عالية التكلفة. تُعد أليانز كير من أكثر شركات التأمين ظهوراً في بيانات قبول التأمين في الدليل، وتتجاوز عتبة المحتوى الضعيف في جميع الإمارات.",
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
      "Bupa Global is the premium international tier of Bupa Insurance, dominant in the UAE executive-expat segment and globally-mobile family plans. Network access spans Cleveland Clinic Abu Dhabi, Mediclinic, NMC Royal, Burjeel, Saudi German, HealthPlus, Aster, Medeor and most JCI-accredited specialty centres in the UAE. Bupa Worldwide and Lifeline plans carry 0–10% outpatient co-pay (waived in-network on top tiers), 0% inpatient, AED 5M–unlimited annual limit, and direct billing at the majority of premium UAE providers. Maternity included with a 10-month waiting period; dental at AED 5,000–10,000 sub-limit on Lifeline tiers; vision included. Pre-authorisation required for elective inpatient and high-cost diagnostics. Bupa Global is the second-most premium insurer behind Cigna Global Diamond — Phase 2 sitemap surface is fully covered across all UAE emirates.",
    editorialCopyAr:
      "بوبا جلوبال هي الفئة الدولية المتميزة من تأمين بوبا، ومهيمنة في قطاع المغتربين التنفيذيين في الإمارات وخطط الأسرة الدولية. تشمل الشبكة كليفلاند كلينك أبوظبي وميديكلينك وإن إم سي رويال وبرجيل وسعودي ألماني وهيلث بلس وأستر وميديور ومعظم مراكز التخصصات المعتمدة من JCI في الإمارات. تتضمن خطط بوبا الدولية وبوبا لايف لاين تحملاً خارجياً بنسبة 0–10% (يُلغى داخل الشبكة في الفئات العليا)، و0% للإقامة الداخلية، وحداً سنوياً من خمسة ملايين درهم إلى غير محدود، وفوترة مباشرة في غالبية المنشآت المميزة في الإمارات. تُشمل الأمومة بفترة انتظار عشرة أشهر، وتُحدد خدمات الأسنان بحد فرعي بين 5000 و10000 درهم في فئات لايف لاين، وتُشمل البصريات. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية والتشخيصات عالية التكلفة. تحتل بوبا جلوبال المركز الثاني بعد سيجنا جلوبال دايموند في فئة التأمين المتميز، وسطحها على خريطة الموقع في المرحلة الثانية مغطى بالكامل في جميع إمارات الدولة.",
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
      "Aetna International is the global expat-medical line of CVS Health-owned Aetna, with strong UAE adoption in mid-to-large multinational employer schemes. Network access spans Mediclinic, NMC, Aster, Burjeel, Saudi German, Cleveland Clinic Abu Dhabi (limited), and most DHA/DOH-licensed multi-specialty centres. Aetna Pioneer and Summit plans carry 0–20% outpatient co-pay (waived on Summit Pinnacle in-network), 0% inpatient, AED 2M–unlimited annual benefit limit, and direct billing across the entire UAE network. Maternity has a 10-month waiting period; dental at AED 3,000–8,000 sub-limit on enhanced tiers; mental health and chronic disease management included on most variants. Pre-authorisation required for elective inpatient, MRI, CT and specialty drugs. Aetna ranks among the top 5 most-listed international carriers in `provider.insurance` data — Phase 2 sitemap clears thin-content gates in every emirate.",
    editorialCopyAr:
      "آيتنا الدولية هي خط التأمين الطبي العالمي للمغتربين التابع لشركة آيتنا المملوكة لـ سي في إس هيلث، ولها انتشار قوي في الإمارات في خطط أصحاب العمل متعددي الجنسيات من الفئة المتوسطة إلى الكبيرة. تشمل الشبكة ميديكلينك وإن إم سي وأستر وبرجيل وسعودي ألماني وكليفلاند كلينك أبوظبي (محدوداً) ومعظم المراكز متعددة التخصصات المرخصة. تتضمن خطط آيتنا بايونير وسوميت تحملاً خارجياً بنسبة 0–20% (يُلغى في سوميت بيناكل داخل الشبكة)، و0% للإقامة الداخلية، وحداً سنوياً من مليوني درهم إلى غير محدود، وفوترة مباشرة في كامل شبكة الإمارات. تطبق فترة انتظار عشرة أشهر للأمومة، وتُحدد خدمات الأسنان بحد فرعي بين 3000 و8000 درهم في الفئات المعززة، وتُشمل الصحة النفسية وإدارة الأمراض المزمنة في معظم البدائل. يُشترط الحصول على موافقة مسبقة للإجراءات الاختيارية والرنين المغناطيسي والأشعة المقطعية والأدوية المتخصصة. تحتل آيتنا المراتب الخمس الأولى بين شركات التأمين الدولية الأكثر إدراجاً في بيانات قبول التأمين، وسطحها في المرحلة الثانية يتجاوز عتبة المحتوى الضعيف في جميع الإمارات.",
  },
];

export const INSURANCE_EDITORIAL_BY_SLUG: Record<string, InsuranceEditorialEntry> =
  Object.fromEntries(INSURANCE_EDITORIAL.map((e) => [e.slug, e]));
