import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitors",
  description: "See how Zavis compares to other healthcare intelligence platforms in the UAE.",
};

export default function CompetitorsPage() {
  return (
    <div className="min-h-screen bg-[#FBFAF8] py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-dark mb-4 text-center">How Zavis Compares</h1>
        <p className="text-dark/60 text-center max-w-xl mx-auto mb-12">
          See how Zavis stacks up against other healthcare data and intelligence platforms in the UAE market.
        </p>
        {/* Comparison table will go here */}
        <div className="border border-light-200 bg-white p-12 text-center">
          <p className="text-muted text-sm">Comparison content coming soon.</p>
        </div>
      </div>
    </div>
  );
}
