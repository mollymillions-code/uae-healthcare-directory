const stagesData = {
  title: "Acquire. Convert.\nDelight. Engage.",
  subtitle: "Four stages that map to how a health business grows and serves.",
  stages: [
    {
      id: 1,
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      title: "Turn interest into qualified leads",
      description: "Click to WhatsApp from ads and site. Smart prompts capture need and route to the right team.",
      borders: "border-r border-b border-green-700",
    },
    {
      id: 2,
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      title: "Make booking and payment simple",
      description: "Show real time slots and prices in chat. Patients book or pay advances in one tap.",
      borders: "border-b border-green-700",
    },
    {
      id: 3,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      title: "Help patients feel cared for",
      description: "Layer reminders with easy confirm or change. Share prep tips and directions. Keep queues visible.",
      borders: "border-r border-green-700",
    },
    {
      id: 4,
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      title: "Keep the relationship active",
      description:
        "Deliver reports and prescriptions in chat. Collect feedback. Run recalls and wellness nudges that matter.",
      borders: "",
    },
  ],
}

const StageIcon = ({ path }: { path: string }) => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
)

const StageCard = ({ stage }: { stage: (typeof stagesData.stages)[0] }) => (
  <div className={`bg-green-800 p-8 ${stage.borders}`}>
    <div className="mb-32">
      <StageIcon path={stage.icon} />
    </div>
    <h3 className="text-xl font-semibold text-white mb-4">{stage.title}</h3>
    <p className="text-green-100 text-sm leading-relaxed">{stage.description}</p>
  </div>
)

export default function Stages() {
  return (
    <section className="py-16 px-4 container mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance whitespace-pre-line">
          {stagesData.title}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{stagesData.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mx-auto">
        {stagesData.stages.map((stage) => (
          <StageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </section>
  )
}
