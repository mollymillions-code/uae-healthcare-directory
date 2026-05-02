import { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqPageSchema, softwareApplicationSchema } from "@/lib/seo";
import { getBaseUrl } from "@/lib/helpers";
import { ComplianceCalendarClient } from "./ComplianceCalendarClient";

export const revalidate = 86400;

const TITLE = "DHA / DOH / MOHAP Compliance Calendar — License Renewals, CME, DataFlow (2026)";
const DESCRIPTION =
  "Free interactive compliance calendar for UAE clinics and healthcare professionals. Plan license renewals, CME deadlines, DataFlow verification, and inspection windows across DHA, DOH, MOHAP. Email reminders 90/60/30 days out. No login.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/tools/compliance-calendar` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

const FAQS = [
  {
    question: "Does this tool actually send email reminders?",
    answer:
      "When you submit your email at the bottom, we add you to a Plunk-driven reminder cycle: 90, 60, 30, and 7 days before each milestone you've configured. Reminders include the milestone, the authority's portal link, and a checklist of what to prepare.",
  },
  {
    question: "How accurate are the milestone dates?",
    answer:
      "License-renewal cycles are precise (DHA professional licenses = 24 months, facility licenses = 12 months, etc.). Inspection-window dates are guidance only — UAE authorities don't publish inspection schedules, but typical risk-based cycles are documented. Always check the authority's portal for your specific entity's actual due dates.",
  },
  {
    question: "What if my license type isn't listed?",
    answer:
      "We cover the 8 most common types (clinic, hospital, pharmacy, lab facilities + doctor, dentist, pharmacist, nurse professionals). Specialised licenses (radiation, chiropractic, traditional medicine) follow similar cycles but have their own portal flows. Email us with your specific license type and we'll add it.",
  },
  {
    question: "Can I export this to my calendar?",
    answer:
      "Yes. Click \"Add to calendar\" to download a .ics file containing all upcoming milestones. Import into Google Calendar, Outlook, or Apple Calendar.",
  },
];

export default function CompliancePage() {
  const base = getBaseUrl();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "UAE", url: base },
          { name: "Tools", url: `${base}/tools` },
          { name: "Compliance Calendar" },
        ])}
      />
      <JsonLd data={faqPageSchema(FAQS)} />
      <JsonLd
        data={softwareApplicationSchema({
          name: "DHA / DOH / MOHAP Compliance Calendar",
          description: DESCRIPTION,
          url: `${base}/tools/compliance-calendar`,
          applicationCategory: "BusinessApplication",
        })}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "UAE", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "Compliance Calendar" },
          ]}
        />

        <div className="max-w-3xl mt-6">
          <p className="font-['Geist_Mono',monospace] text-[11px] font-medium uppercase tracking-[0.18em] text-[#006828] mb-3">
            Free tool · No signup
          </p>
          <h1 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[28px] sm:text-[40px] text-[#1c1c1c] tracking-tight leading-[1.05]">
            UAE healthcare compliance calendar.
          </h1>
          <p className="mt-4 font-['Geist',sans-serif] text-base leading-relaxed text-black/55">
            DHA, DOH/Sheryan, MOHAP — license renewals, CME deadlines, DataFlow verification, insurance contract renewals, and inspection windows. All in one calendar. Email reminders 90/60/30 days before each milestone.
          </p>

          <div className="mt-6 border-l-4 border-[#006828] bg-[#006828]/[0.04] rounded-xl py-5 px-6 mb-8" data-answer-block="true">
            <p className="font-['Geist',sans-serif] text-black/55 leading-relaxed">
              Missing a UAE compliance deadline can trigger fines, license suspension, or insurance contract gaps. Most clinics manage compliance via spreadsheet — easy to forget when staff turn over. This tool generates a 12-month milestone view for your specific license type and sends reminders so nothing falls through.
            </p>
          </div>
        </div>

        <ComplianceCalendarClient />

        <div className="max-w-3xl mt-16">
          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mb-4">
            What this calendar covers
          </h2>
          <ul className="space-y-3 font-['Geist',sans-serif] text-black/65 leading-relaxed list-disc pl-5">
            <li><strong>Facility license renewal</strong> — annual for clinics, hospitals, pharmacies, labs.</li>
            <li><strong>Professional license renewal</strong> — every 2 years for doctors, dentists, pharmacists, nurses.</li>
            <li><strong>CME hour deadlines</strong> — 30/40 hours required during the renewal cycle.</li>
            <li><strong>DataFlow verification</strong> — every 5 years for most professionals.</li>
            <li><strong>Insurance network contract renewals</strong> — annual, typically calendar-year aligned.</li>
            <li><strong>Inspection window guidance</strong> — when to expect a routine inspection.</li>
          </ul>

          <h2 className="font-['Bricolage_Grotesque',sans-serif] font-medium text-[20px] sm:text-[24px] text-[#1c1c1c] tracking-tight mt-12 mb-4">
            Frequently asked
          </h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details key={f.question} className="border border-black/[0.06] rounded-xl px-5 py-4 bg-white open:bg-[#006828]/[0.02] transition-colors">
                <summary className="cursor-pointer font-['Bricolage_Grotesque',sans-serif] font-medium text-[16px] text-[#1c1c1c] tracking-tight">
                  {f.question}
                </summary>
                <p className="mt-3 font-['Geist',sans-serif] text-sm text-black/65 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
