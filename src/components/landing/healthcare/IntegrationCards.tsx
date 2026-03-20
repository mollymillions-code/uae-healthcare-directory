"use client";

export default function IntegrationTicker() {
  const integrationLogos = [
    // First row
    { name: "Gmail", link: "/images/landing/media-icons/Link-1.png" },
    { name: "Squarespace", link: "/images/landing/media-icons/Link-2.png" },
    { name: "Facebook", link: "/images/landing/media-icons/Link-3.png" },
    { name: "Google Drive", link: "/images/landing/media-icons/Link-4.png" },
    { name: "Notion", link: "/images/landing/media-icons/Link-5.png" },
    { name: "Google Sheet", link: "/images/landing/media-icons/Link-6.png" },
    { name: "ActiveCampaign", link: "/images/landing/media-icons/Link-7.png" },
    { name: "Slack", link: "/images/landing/media-icons/Link-8.png" },
    { name: "Zoho Sheet", link: "/images/landing/media-icons/Link-9.png" },
    { name: "Klaviyo", link: "/images/landing/media-icons/Link-10.png" },
    // Second row
    { name: "Stripe", link: "/images/landing/media-icons/Link-11.png" },
    { name: "Zendesk", link: "/images/landing/media-icons/Link-12.png" },
    { name: "Shopify", link: "/images/landing/media-icons/Link-13.png" },
    { name: "Outlook", link: "/images/landing/media-icons/Link-14.png" },
    { name: "Salesforce", link: "/images/landing/media-icons/Link-15.png" },
    { name: "Trello", link: "/images/landing/media-icons/Link-16.png" },
    { name: "HubSpot", link: "/images/landing/media-icons/Link-17.png" },
    { name: "Excel", link: "/images/landing/media-icons/Link-18.png" },
    { name: "Dropbox", link: "/images/landing/media-icons/Link-19.png" },
    { name: "Teams", link: "/images/landing/media-icons/Link-20.png" },
  ];

  return (
    <div className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Integrate Effortlessly
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Zavis supports over 100 apps, so you can seamlessly connect and
            streamline your favorite tools.
          </p>
          <a
            href="https://wa.me/971555312595?text=I%20checked%20the%20website%2C%20and%20I%20have%20a%20few%20questions%20to%20ask"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-full text-lg transition-colors"
          >
            Book A Demo
          </a>
        </div>

        {/* Ticker Animation Container */}
        <div className="relative overflow-hidden">
          <div className="absolute w-full h-full inset-0 top-0 left-0 right-0 bottom-0 z-10">
            <img
              src="/images/landing/ticker-overlay.png"
              alt="overlay"
              className="w-full h-full object-stretch"
            />
          </div>
          {/* First Row */}
          <div className="flex animate-scroll mb-6">
            <div className="flex space-x-8 animate-scroll-infinite">
              {[
                ...integrationLogos.slice(0, 9),
                ...integrationLogos.slice(0, 9),
              ].map((logo, index) => (
                <div
                  key={`row1-${index}`}
                  className="flex-shrink-0 w-20 h-20 flex items-center justify-center text-2xl hover:shadow-lg transition-shadow"
                >
                  <img
                    src={`${logo.link}`}
                    alt={logo.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Second Row - Reverse Direction */}
          <div className="flex animate-scroll-reverse">
            <div className="flex space-x-8 animate-scroll-infinite-reverse">
              {[...integrationLogos.slice(9), ...integrationLogos.slice(9)].map(
                (logo, index) => (
                  <div
                    key={`row2-${index}`}
                    className="flex-shrink-0 w-20 h-20 flex items-center justify-center text-2xl hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={`${logo.link}`}
                      alt={logo.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )
              )}
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

        @keyframes scroll-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-infinite {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll-infinite-reverse {
          animation: scroll-reverse 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
