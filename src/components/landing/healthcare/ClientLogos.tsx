"use client";

import Image from "next/image";

const clients = [
  // { name: "NeuroSolution", logo: "/images/landing/clients/neurosolution.png" },
  { name: "Flowspace", logo: "/images/landing/clients/flowspace.png" },
  { name: "Kent Healthcare", logo: "/images/landing/clients/kent-healthcare.png" },
  { name: "Client 4", logo: "/images/landing/clients/client-4.png" },
  { name: "Client 5", logo: "/images/landing/clients/client-5.png" },
  // { name: "Client 6", logo: "/images/landing/clients/client-6.png" },
  { name: "Client 7", logo: "/images/landing/clients/client-7.png" },
  { name: "Client 8", logo: "/images/landing/clients/client-8.png" },
  // { name: "Client 9", logo: "/images/landing/clients/client-9.png" },
];

export default function ClientLogos() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto container px-6 md:px-12 lg:px-16">
        {/* Title */}
        <p className="text-center text-sm md:text-base font-medium text-gray-500 tracking-wider uppercase mb-8">
          Our Clients
        </p>

        {/* Ticker Container */}
        <div className="relative overflow-hidden">
          {/* Left Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

          {/* Right Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Ticker */}
          <div className="flex animate-scroll">
            {/* First set of logos */}
            <div className="flex items-center gap-12 md:gap-16 shrink-0 px-6">
              {clients.map((client, index) => (
                <div
                  key={`first-${index}`}
                  className="flex items-center justify-center h-10 md:h-12 shrink-0"
                >
                  <Image
                    src={client.logo}
                    alt={client.name}
                    width={120}
                    height={48}
                    className="h-8 md:h-10 w-auto object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="flex items-center gap-12 md:gap-16 shrink-0 px-6">
              {clients.map((client, index) => (
                <div
                  key={`second-${index}`}
                  className="flex items-center justify-center h-10 md:h-12 shrink-0"
                >
                  <Image
                    src={client.logo}
                    alt={client.name}
                    width={120}
                    height={48}
                    className="h-8 md:h-10 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
