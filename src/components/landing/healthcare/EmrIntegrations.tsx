"use client";

import Image from "next/image";

const emrPartners = [
  { name: "M@DAS", logo: "/images/landing/emrs/medas.png" },
  { name: "Practo", logo: "/images/landing/emrs/practo.png" },
  { name: "Unite", logo: "/images/landing/emrs/unite.png" },
];

export default function EmrIntegrations() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto container px-6 md:px-12 lg:px-16 max-w-4xl">
        {/* Title */}
        <p className="text-center text-sm md:text-base font-medium text-gray-500 tracking-wider uppercase mb-8">
          Integrated with Leading Healthcare EMRs
        </p>

        {/* EMR Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-200 rounded-lg overflow-hidden">
          {emrPartners.map((emr, index) => (
            <div
              key={emr.name}
              className={`
                flex items-center justify-center p-6 md:p-8 bg-white
                ${index < emrPartners.length - 1 ? "border-r border-gray-200" : ""}
                ${index < 2 ? "border-b border-gray-200 md:border-b-0" : ""}
                ${index === 2 || index === 3 ? "md:border-b-0" : ""}
                hover:bg-gray-50 transition-colors duration-200
              `}
            >
              <Image
                src={emr.logo}
                alt={emr.name}
                width={140}
                height={50}
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
