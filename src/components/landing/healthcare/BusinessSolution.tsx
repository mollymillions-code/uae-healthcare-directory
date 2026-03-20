export default function BusinessSolution() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* <div className="text-sm text-gray-500 uppercase tracking-wide mb-4">
            ENTERPRISE TRUST
          </div> */}
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
          Key features

          </h1>
          {/* <p className="text-base md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From local gyms to scaling SaaS startups - Zavis adapts to your
            flow, not the other way around.
          </p> */}
          {/* <Link
            href="https://wa.me/971555312595?text=I%20checked%20the%20website%2C%20and%20I%20have%20a%20few%20questions%20to%20ask"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg transition-colors">
              Book A Call & Get Started With Zavis →
            </Button>
          </Link> */}
        </div>

        {/* Feature Cards Grid */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* AI Phone Agents Card */}
          <div className="bg-[#FCFFA8] rounded-2xl flex flex-3 flex-col items-center gap-2">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
               Turn Every Ad Click Into a Patient Conversation on WhatsApp
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
              Click-to-WhatsApp ads and site buttons open a compliant thread you own. Consent and templates are handled so intent turns into a live conversation immediately.
              </p>
            </div>
            <div className="flex-1 flex items-end">
              <img
                src="/images/landing/hc-business-sol-1.png"
                alt="AI phone agents with audio visualization"
                className="w-full h-auto max-h-[400px]"
              />
            </div>
          </div>

          {/* Multi-Language Support Card */}
          <div className="bg-[#FFB669] rounded-2xl flex-2 flex flex-col items-center gap-2">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                An AI Receptionist Agent That Sounds Like Your Front Desk and Works 24/7
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
               The Zavis agent greets, answers questions, collects demographics and ID photos, and creates the contact. It sets expectations and keeps the tone on brand without making people wait.
              </p>
            </div>
            <div className="flex-1 flex items-end">
              <img
                src="/images/landing/hc-business-sol-2.png"
                alt="Multi-language chat interface"
                className="w-full h-auto max-h-[400px]"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-col">
            {/* Broadcast & Payments Card - Double Height */}
            <div className="space-y-6">
              {/* Broadcast Section */}
              <div className="bg-[#F1F0EC] rounded-2xl  flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   Structured quick replies capture complaint, age, location, and insurance in seconds.
                  </h3>
                  {/* <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    Instantly reply to Instagram DMs, comments, and "Price
                    Please" queries 24/7, offer rewards for follows
                  </p> */}
                </div>
                <div className="flex-1">
                  <img
                    src="/images/landing/hc-business-sol-3.png"
                    alt="Broadcast messaging interface"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Payments Section */}
              <div className="bg-[#FFF1E3] rounded-2xl flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   Diagnostics and results delivery. Orders in, prep rules, reports out
                  </h3>
                  {/* <p className="text-gray-700 text-sm leading-relaxed">
                    Manage WhatsApp and Instagram queries with an Omnichannel
                    Inbox for zero missed messages and smooth team collaboration
                  </p> */}
                </div>
                <div className="flex-1 space-y-4">
                  <img
                    src="/images/landing/hc-business-sol-4.png"
                    alt="WhatsApp Pay interface"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Maximize Leads Card */}
          <div className="bg-[#C6E0DD] rounded-2xl flex flex-col items-center gap-2">
            <div className="flex-1 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
       Booking That Feels Native to Chat With Live Slots and Instant Confirmation
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Show live slots by doctor, department, and modality. Collect reason for visit, referral code, and insurance ID. Patients can reschedule or cancel without calling.

              </p>
            </div>
            <div className="flex-1">
              <img
                src="/images/landing/hc-business-sol-5.png"
                alt="WhatsApp mobile interface"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Maximize Leads Card */}
          <div className="bg-[#B9AFFC] rounded-2xl  flex flex-col items-center gap-2">
            <div className="flex-1 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Keep Care Going With Recalls, Broadcasts, and Journeys That Rebook
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
              Send itemized estimates and secure pay links for advance, co-pay, or full bill. Receipts live beside the conversation and reconcile to your system with gentle balance reminders.
              </p>
            </div>
            <div className="flex-1 flex items-end">
              <img
                src="/images/landing/hc-business-sol-6.png"
                alt="WhatsApp mobile interface"
                className="w-full h-auto max-h-[350px]"
              />
            </div>
          </div>
          <div className="flex flex-col">
            {/* Broadcast & Payments Card - Double Height */}
            <div className="space-y-6">
              {/* Broadcast Section */}
              <div className="bg-[#FFF5DA] rounded-2xl flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Visit Day Made Simple With Reminders, Directions, and Queue Clarity
                  </h3>
                  {/* <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    Sync your catalog via Shopify, WooCommerce, or Excel,
                    letting customers browse and buy on the go via WhatsApp Pay
                  </p> */}
                </div>
                <div className="flex-1">
                  <img
                    src="/images/landing/hc-business-sol-7.png"
                    alt="Broadcast messaging interface"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {/* Payments Section */}
              <div className="bg-[#FCFFA8] rounded-2xl flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   Payments Handled in the Thread From Estimate to Receipt
                  </h3>
                  {/* <p className="text-gray-700 text-sm leading-relaxed">
                    Track team performance, measure impact, and optimize your
                    WhatsApp campaigns with real-time insights.
                  </p> */}
                </div>
                <div className="flex-1 space-y-4">
                  <img
                    src="/images/landing/hc-business-sol-8.png"
                    alt="WhatsApp Pay interface"
                    className="w-full h-auto"
                  />
                </div>
              </div>


            </div>
          </div>
        </div>
        <div>
           <div className="bg-[#8DFFB9] rounded-2xl flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   Track, measure, and optimize every WhatsApp interaction in one place
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Conversation heatmaps, first response and resolution times, AI agent close rate and handoffs, CSAT, SLA, campaign ROI, and rebook conversions. Filter by location, doctor, or channel, then export or schedule reports to your inbox.
                  </p>
                </div>
                <div className="flex-1 space-y-4">
                  <img
                    src="/images/landing/hc-business-sol-9.png"
                    alt="WhatsApp Pay interface"
                    className="w-full h-auto"
                  />
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}
