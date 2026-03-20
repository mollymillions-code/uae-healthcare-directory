import { CheckCircle2, BadgeCheck } from "lucide-react"

export function DemoHero() {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div aria-hidden className="mt-1 h-6 w-6 rotate-12 rounded-sm bg-emerald-500" />
        <h1 className="text-pretty text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Book your free demo
        </h1>
      </div>

      <p className="max-w-4xl text-balance text-base text-slate-600">
        We really encourage you to see how Zavis lets you use WhatsApp as a communication channel to sell, market and
        support more efficiently.
      </p>

      <ul className="grid list-none grid-cols-1 gap-3 pt-1 text-sm md:grid-cols-2">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
          </span>
          <span className="text-slate-900">Enjoy a personalized guided tour, not a group webinar</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50">
            <BadgeCheck className="h-4 w-4 text-amber-500" aria-hidden />
          </span>
          <span className="text-slate-900">Demos are given by experts on using Zavis with WhatsApp</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
          </span>
          <span className="text-slate-900">See how Zavis simplifies communicating using WhatsApp</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50">
            <BadgeCheck className="h-4 w-4 text-amber-500" aria-hidden />
          </span>
          <span className="text-slate-900">We&apos;ll show you how Zavis helps you to grow your business</span>
        </li>
      </ul>
    </header>
  )
}
