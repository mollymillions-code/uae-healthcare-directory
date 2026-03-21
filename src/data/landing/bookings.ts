export const coordinatorSteps = [
  { step: "1", text: "Filter live EMR slots by doctor, department, service, and branch." },
  { step: "2", text: "Select patient from Contact 360 with full history and preferences." },
  { step: "3", text: "Confirm booking with MRN and visit ID linked, conflict-protected." },
  { step: "4", text: "Appointment created in EMR with two-way writeback automatically." },
  { step: "5", text: "WhatsApp confirmation plus automated reminders sent instantly." },
];

export const aiSteps = [
  { step: "1", text: "AI offers best slots based on intent, doctor preference, and availability." },
  { step: "2", text: "Patient taps to confirm directly in the conversation." },
  { step: "3", text: "Appointment created in EMR with full writeback automatically." },
  { step: "4", text: "Confirmation and 24h/12h reminders sent on WhatsApp." },
];

export const coordinatorViewFeatures = [
  "Filters for branch, doctor, department, service, and date",
  "One-click create, reschedule, or move with conflict protection",
  "Reason codes track leakage and reveal utilization patterns",
  "Patient profile with history and preferences in context",
  "WhatsApp confirmations from the same conversation thread",
  "Full audit trail with who booked, when, and from which channel",
];

export const bookingFlowSteps = [
  { title: "Patient Sees and Taps the Ad", desc: "Immediate WhatsApp entry point with full ad attribution." },
  { title: "Conversation Starts in WhatsApp", desc: "AI responds instantly, qualifies intent, and keeps leads engaged." },
  { title: "Lead Auto-Created in Zavis", desc: "Contact created with source attribution, no manual entry." },
  { title: "AI Books the Appointment", desc: "Live EMR slots offered, patient confirms in one tap." },
  { title: "Zavis Syncs to Your EMR", desc: "Two-way writeback in real time, one source of truth." },
];
