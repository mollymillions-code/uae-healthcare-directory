import { Users, Languages, Presentation } from "lucide-react"

const items = [
  {
    icon: Presentation,
    title: "1-on-1 or group demos",
    body: "Whether your demo is for an individual or a team spread over different locations, see how Zavis works with WhatsApp.",
    bg: "bg-rose-50",
  },
  {
    icon: Languages,
    title: "We speak your language!",
    body: "Our team is multilingual, so whatever languages you speak, we'll make sure that you'll always understand Zavis.",
    bg: "bg-sky-50",
  },
  {
    icon: Users,
    title: "Custom demos for teams",
    body: "Marketing, sales and support teams have different aims and we can customize our demo to meet your needs.",
    bg: "bg-amber-50",
  },
]

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {items.map(({ icon: Icon, title, body, bg }) => (
        <article key={title} className="relative">
          <div className={`absolute left-3 top-3 -z-10 h-[85%] w-[93%] rounded-3xl ${bg}`} aria-hidden />
          <div className="rounded-3xl border border-slate-300 p-5 shadow-[0_0_0_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <p className="mt-3 text-slate-700">{body}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
