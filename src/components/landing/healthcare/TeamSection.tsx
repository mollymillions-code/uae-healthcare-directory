export default function TeamSection() {
  const content = {
    title: "The fastest growing businesses use Zavis",
    subtitle: "Companies use Zavis to stay ahead of the competition.",
    testimonials: [
      {
        id: 1,
        role: "FOUNDER",
        quote:
          "Zavis didn't just help us scale conversations\u2014it made customer interactions feel like magic. From day one, it's been the quiet growth engine behind our support stack",
        name: "Hid.eth",
        title: "Founder",
        handle: "@W3Layouts",
        company: "LOGO HERE",
        avatar: "/placeholder.svg?height=224&width=224",
      },
      {
        id: 2,
        role: "FOUNDER",
        quote:
          "With Zavis, we've turned automation into an experience. It integrated effortlessly with our tech and scaled better than any system we've ever tried.",
        name: "Hid.eth",
        title: "Founder",
        handle: "@WebHash",
        company: "WEBHASH",
        avatar: "/placeholder.svg?height=224&width=224",
      },
    ],
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto container">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-normal text-primary mb-6 leading-tight">
            {content.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="relative flex flex-col lg:flex-row gap-4 lg:gap-16">
          {/* First Testimonial */}
          <div className="lg:w-1/4  mb-16 lg:mb-0">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-6">
              {content.testimonials[0].role}
            </div>

            <div className="w-64 h-56 bg-gray-300 rounded-lg mb-8">
              <img
                src={content.testimonials[0].avatar || "/placeholder.svg"}
                alt={`${content.testimonials[0].name} avatar`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="space-y-1 mb-8">
              <h4 className="text-xl font-bold text-primary">
                {content.testimonials[0].name}
              </h4>
              <p className="text-gray-500">{content.testimonials[0].title}</p>
              <p className="text-gray-500">{content.testimonials[0].handle}</p>
            </div>

            <div className="text-2xl font-bold text-primary">
              {content.testimonials[0].company}
            </div>
          </div>

          <div className="lg:w-1/2 rounded-br-xl border-b lg:border-r border-primary pr-6">
            <p className="  text-xl text-primary mb-8 font-degular">
              {content.testimonials[0].quote}
            </p>
          </div>

          {/* Second Testimonial */}
          <div className="lg:w-1/4 ">
            <div className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-6">
              {content.testimonials[1].role}
            </div>

            <div className="w-64 h-56 bg-gray-300 rounded-lg mb-8">
              <img
                src={content.testimonials[1].avatar || "/placeholder.svg"}
                alt={`${content.testimonials[1].name} avatar`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="space-y-1 mb-8">
              <h4 className="text-xl font-bold text-primary">
                {content.testimonials[1].name}
              </h4>
              <p className="text-gray-500">{content.testimonials[1].title}</p>
              <p className="text-gray-500">{content.testimonials[1].handle}</p>
            </div>

            <div className="text-2xl font-bold text-primary">
              {content.testimonials[1].company}
            </div>
          </div>
          <div className="lg:w-1/2 font-degular">
            <p className=" text-xl text-primary mb-8">
              {content.testimonials[0].quote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
