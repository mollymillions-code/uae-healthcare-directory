import { Button } from "@/components/landing/ui/Button";

export default function PricingCtaSection() {
  return (
    <section className="max-h-[1100px] h-screen bg-[#006828] py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto container h-full">
        <div className="h-full grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Left Content */}
          <div className="h-full space-y-8 flex flex-col justify-between gap-8 lg:gap-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-normal">
              The most advanced AI suite to scale businesses of any size at an
              unbelievable price!
            </h2>

            <div className="space-y-8">
              <p className=" font-degular text-2xl text-white">
                Explore pricing options tailored to your needs
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-white !text-primary hover:!bg-gray-200 px-8 py-2 text-lg font-normal !font-degular rounded-md h-auto"
                >
                  Explore Pricing
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-green-800 px-8 py-2 text-lg font-normal !font-degular rounded-md transition-colors duration-200 bg-transparent h-auto"
                >
                  Book Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex">
            <div className="w-full h-auto flex item-center justify-center">
              <img
                src="/images/landing/pricing-cta.png"
                alt="Business analytics and pricing illustration"
                className="max-w-lg w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
