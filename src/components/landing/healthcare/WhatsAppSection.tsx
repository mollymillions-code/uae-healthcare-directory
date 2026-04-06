"use client";

import { useState } from "react";

const sectionData = {
  label: "WHATSAPP",
  title: "Do everything in the channel patients open first",
  services: [
    "Patient Administration",
    "Booking Management",
    "Billing and Payments",
    "Broadcast & Campaigns",
    "Integration and Data",
  ],
    serviceContent: {
    "Patient Administration": {
      heading: "Register, verify, and capture consent in chat.",
      paragraphs: [
        "Zavis handles pre-registration, identity capture, consent, and basic demographics directly in WhatsApp so patients arrive ready. Short forms and document photos keep the intake fast while one thread holds everything.",
        "Staff work from a clean summary with the fields you choose. Duplicate checks and prompts keep records tidy across locations without extra portals.",
      ],
      chatMessage:
        "Hi Jane, you have an appointment coming up at 6PM tomorrow morning!",
      imageSrc: "/images/landing/patient-administration.webp",
    },
    "Booking Management": {
      heading:
        "Show real time slots. Patients book, change, or cancel without calling.",
      paragraphs: [
        "Patients see live availability for OPD, teleconsult, procedures, and tests. One tap confirms a slot and reminders keep attendance high.",
        "On the day, a digital token and queue updates reduce anxiety. Changes or cancellations are self-serve with clear rules you define.",
      ],
      chatMessage:
        "Your appointment is confirmed for tomorrow at 2PM with Dr. Smith. Reply CANCEL to reschedule.",
      imageSrc: "/images/landing/booking-management.webp",
    },
    // "Diagnostics and Results": {
    //   heading:
    //     "Prep before the test. Reports and images delivered in the same thread.",
    //   paragraphs: [
    //     "For labs and imaging, Zavis sends prep instructions patients actually read: fasting windows, contrast notes, what to bring, and sample pickup timing.",
    //     "When results are ready, PDFs or images are shared with read status. Critical findings escalate to the on-duty clinician while the patient gets a clear next step.",
    //   ],
    //   chatMessage:
    //     "Your blood test results are ready! Tap here to view your report securely.",
    //   imageSrc: "/images/landing/patient-administration-2.webp",
    // },
    "Billing and Payments": {
      heading: "Estimates, pay links, and receipts in chat.",
      paragraphs: [
        "Share simple estimates and let patients pay advances or co-pays with a secure link. Receipts land back in the thread next to visit details.",
        "Outstanding balances get timed reminders that respect consent and quiet hours. Finance teams see status without chasing.",
      ],
      chatMessage:
        "Your copay of $25 is due. Pay now with this secure link: pay.clinic.com/jane123",
      imageSrc: "/images/landing/billing-and-payments.webp",
    },
    "Broadcast & Campaigns": {
      heading:
        "Cohort based recalls and wellness nudges that are safe and compliant.",
      paragraphs: [
        "Use cohorts to reach patients when it matters: recalls, vaccines, health days, seasonal clinics, and care package offers that fit their history.",
        "Every send uses approved templates, throttling, and suppression lists so deliverability stays healthy. Replies open two-way conversations your team can own.",
      ],
      chatMessage:
        "It's time for your annual checkup! Book your appointment to stay on top of your health.",
      imageSrc: "/images/landing/broadcast-and-campaigns.webp",
    },
    // "Care Program and Adherence": {
    //   heading:
    //     "Chronic, maternity, and pediatrics journeys with measurable follow-through.",
    //   paragraphs: [
    //     "Turn care plans into simple WhatsApp journeys. Think medication reminders, refill prompts, rehab check-ins, diet tips, and symptom trackers.",
    //     "Patients respond with quick replies or photos. Missed check-ins or concerning answers create tasks for the right clinician.",
    //   ],
    //   chatMessage:
    //     "Don't forget to take your morning medication! Reply TAKEN when complete.",
    //   imageSrc: "/images/landing/patient-administration-2.webp",
    // },
    "Integration and Data": {
      heading:
        "Connect your systems. Keep one conversation per patient with governance built in.",
      paragraphs: [
        "Zavis connects to your scheduling, billing, diagnostics, and telehealth systems so the WhatsApp thread stays the front door while your records remain the source of truth. No duplicate entry.",
        "Data moves with consent, roles, and audit. Teams see what they need and nothing more. Exports and webhooks keep your lake or BI tools updated.",
      ],
      chatMessage:
        "Your patient data has been updated across all systems. View changes in your dashboard.",
      imageSrc: "/images/landing/integration-and-data.webp",
    },
  },
};

const ServiceTag = ({
  service,
  isActive,
  onClick,
}: {
  service: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      isActive
        ? "bg-[#F6FFDB] text-black"
        : "bg-white text-gray-700 hover:bg-gray-200"
    } border border-gray-300`}
  >
    {service}
  </button>
);

const NavigationArrows = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}) => (
  <div className="flex justify-center gap-4 mt-8 lg:hidden">
    <button
      onClick={onPrevious}
      disabled={!canGoPrevious}
      className={`p-3 rounded-full border-2 transition-all ${
        canGoPrevious
          ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          : "border-gray-200 opacity-40 cursor-not-allowed"
      }`}
      aria-label="Previous service"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
    <button
      onClick={onNext}
      disabled={!canGoNext}
      className={`p-3 rounded-full border-2 transition-all ${
        canGoNext
          ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          : "border-gray-200 opacity-40 cursor-not-allowed"
      }`}
      aria-label="Next service"
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>
);

export default function WhatsAppSection() {
  const [activeService, setActiveService] = useState("Patient Administration");

  const currentContent =
    sectionData.serviceContent[
      activeService as keyof typeof sectionData.serviceContent
    ];

  const currentIndex = sectionData.services.indexOf(activeService);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sectionData.services.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setActiveService(sectionData.services[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setActiveService(sectionData.services[currentIndex + 1]);
    }
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
            {sectionData.label}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {sectionData.title}
          </h2>
        </div>

        {/* Service Tags */}
        <div className="flex  justify-start lg:justify-center overflow-x-auto gap-3 mb-16 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {sectionData.services.map((service, index) => (
            <ServiceTag
              key={index}
              service={service}
              isActive={activeService === service}
              onClick={() => setActiveService(service)}
            />
          ))}
        </div>

        {/* Content Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {currentContent.heading}
            </h3>
            <div className="space-y-4">
              {currentContent.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Right Image */}
           <div className="relative">
            <img
              src={
                currentContent.imageSrc || "/images/landing/patient-administration.webp"
              }
              alt="Woman using WhatsApp for healthcare appointment"
              className="w-full h-auto rounded-lg"
            />
            {/* <ChatBubble message={currentContent.chatMessage} /> */}
          </div>
        </div>

        {/* Navigation Arrows - Mobile Only */}
        <NavigationArrows
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
        />
      </div>
    </section>
  );
}
