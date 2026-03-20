export default function BusinessCards() {
  const cards = [
    {
      title: "Hospitals",
      description: [
        "Department routing and queue updates",
        "Discharge follow up and recalls"
      ],
      imageSrc: "/images/landing/hc-business-card-1.png",
      alt: "Capture Attention - Woman with headset",
      color: "#FCFDBF"
    },
    {
      title: "Fertility and maternity",
      description: [
        "Cycle based reminders",
        "Antenatal class and scan scheduling"
      ],
      imageSrc: "/images/landing/hc-business-card-2.png",
      alt: "Handle Conversations - Man with headset",
      color: "#D7D1FF"
    },
    {
      title: "Pharmacy",
      description: [
        "Prescription on file and refills",
        "Delivery tracking"
      ],
      imageSrc: "/images/landing/hc-business-card-3.png",
      alt: "Win Deals - Woman with headset",
      color: "#B5D1FF"
    },
  ];

  return (
    <div className="bg-white mt-16 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-semibold text-center text-gray-900 mb-8 md:mb-16">
          Built for Business of all Sizes
        </h1>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div key={index} className={`bg-white overflow-hidden`}>
              <div className="w-full">
                <img
                  src={card.imageSrc}
                  alt={card.alt}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4 rounded-b-xl"
                style={{ backgroundColor: card.color }}>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <div>
                  {card.description.map((item, i) => (
                    <span key={i} className="text-gray-600 leading-relaxed">
                      <ul className="list-disc list-inside">
                        <li>{item}</li>
                      </ul>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
