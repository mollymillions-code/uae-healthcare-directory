"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Label"
import { RadioGroup, RadioGroupItem } from "./ui/RadioGroup"
import { Checkbox } from "./ui/Checkbox"
import { cn } from "@/lib/utils"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function DemoForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [team, setTeam] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false) // Optional: UX improvement

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const data = new FormData(form)
    const nextErrors: Record<string, string> = {}

    if (!data.get("name")) nextErrors.name = "Please complete this required field."
    if (!data.get("email")) nextErrors.email = "Please complete this required field."
    if (!data.get("company")) nextErrors.company = "Please complete this required field."
    if (!team) nextErrors.team = "Please choose one option."
    if (!phone) nextErrors.phone = "Please complete this required field."
    if (!data.get("terms")) nextErrors.terms = "Consent is required."

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setSubmitting(true)
      data.set("team", team)
      data.set("phone", phone)
      fetch("https://script.google.com/macros/s/AKfycbwTfcI2SmFOoWp__yhOfSDVHSOuIpf9mI-uAdweKXw-OehXVRaqpYK43O-WbiV_qP6w/exec", {
        method: "POST",
        body: data,
      })
        .then((res) => res.json())
        .then(() => {
          // Fire GA4 event via GTM data layer BEFORE redirect
          // (Next.js App Router soft navigation doesn't trigger GTM historyChange reliably)
          if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
              event: 'demo_requested',
              form_name: 'book-a-demo',
              user_email: data.get('email'),
              company_name: data.get('company'),
            });
          }
          router.push("/demo-requested")
        })
        .catch(() => {
          toast.error("Submission failed. Please try again.")
          setSubmitting(false)
        })
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-300 p-4 shadow-[0_0_0_3px_rgba(0,0,0,0.02)] md:p-6"
      >
        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-slate-900">
            Name
            <span aria-hidden className="text-rose-500">
              *
            </span>
          </Label>
          <Input
            id="name"
            name="name"
            className={cn("h-12 rounded-xl bg-slate-50", errors.name && "border-red-300 focus-visible:ring-red-400")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mt-5 space-y-1">
          <Label htmlFor="email" className="text-slate-900">
            Business Email
            <span aria-hidden className="text-rose-500">
              *
            </span>
          </Label>
          <p className="text-xs text-slate-500">To book a 1-on-1 demo, please use your business email.</p>
          <Input
            id="email"
            name="email"
            type="email"
            className={cn("h-12 rounded-xl bg-slate-50", errors.email && "border-red-300 focus-visible:ring-red-400")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div className="mt-5 space-y-1">
          <Label htmlFor="company" className="text-slate-900">
            Company Name
            <span aria-hidden className="text-rose-500">
              *
            </span>
          </Label>
          <Input
            id="company"
            name="company"
            className={cn("h-12 rounded-xl bg-slate-50", errors.company && "border-red-300 focus-visible:ring-red-400")}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "company-error" : undefined}
          />
          {errors.company && (
            <p id="company-error" className="text-sm text-red-500">
              {errors.company}
            </p>
          )}
        </div>

        {/* Company Website */}
        <div className="mt-5 space-y-1">
          <Label htmlFor="website" className="text-slate-900">
            Company Website
          </Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://example.com"
            className="h-12 rounded-xl bg-slate-50"
          />
        </div>

        {/* Team / Function */}
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium text-slate-900">
            Which team or function will primarily use Zavis?
            <span aria-hidden className="text-rose-500">
              *
            </span>
          </legend>
          <RadioGroup name="role" className="grid grid-cols-1 gap-2 md:grid-cols-2" value={team} onValueChange={setTeam}>
            {[
              "Marketing",
              "Sales",
              "Support",
              "Admin / Founder / Business Owner",
              "IT / Developer / Product Manager",
              "HR",
              "Others",
              "Interested in Zavis Partnership",
            ].map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 rounded-lg border border-transparent p-1 hover:border-slate-200"
              >
                <RadioGroupItem value={opt} id={opt} />
                <span className="text-sm text-slate-900">{opt}</span>
              </label>
            ))}
          </RadioGroup>
          {errors.team && <p className="mt-1 text-sm text-red-500">{errors.team}</p>}
        </fieldset>

        {/* WhatsApp number */}
        <div className="mt-6">
          <Label className="text-slate-900 block mb-1">
            Your Whatsapp Number - we&apos;ll reach out to you here
            <span aria-hidden className="text-rose-500">*</span>
          </Label>
          <div className="mt-2 flex flex-col">
            <PhoneInput
              country={"ae"}
              value={phone}
              onChange={setPhone}
              inputProps={{
                name: "phone",
                required: true,
                className: cn(
                  "h-12 rounded-xl w-full bg-slate-50 pl-12 text-base border border-slate-300 transition focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-black",
                  errors.phone && "border-red-300 focus-visible:ring-red-400"
                ),
                "aria-invalid": !!errors.phone,
                autoComplete: "tel",
                placeholder: "Enter your WhatsApp number",
              }}
              containerClass="w-full"
              inputClass="w-full"
              buttonClass="!bg-transparent !border-none !shadow-none"
              dropdownClass="z-50 text-black"
              searchClass="!rounded-lg"
              enableSearch
              disableCountryCode={false}
              disableDropdown={false}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Terms */}
        <div className="mt-5 flex items-start gap-2">
          <Checkbox id="terms" name="terms" />
          <label htmlFor="terms" className="text-sm text-slate-700">
            By signing up, you agree to the{" "}
            <Link className="underline z-100" href={"/terms-of-service"} >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link className="underline z-100" href="/privacy-policy" >
              Privacy Policy
            </Link>
            , and consent to receive marketing communications from Zavis.
            <span aria-hidden className="text-rose-500">
              {" "}
              *
            </span>
          </label>
        </div>
        {errors.terms && <p className="mt-1 text-sm text-red-500">{errors.terms}</p>}

        {/* Submit */}
        <div className="mt-6">
          <Button
            id="btn-submit-book-demo"
            type="submit"
            className="h-11 rounded-full bg-emerald-500 px-6 text-white hover:bg-emerald-600"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Schedule Demo"}
          </Button>
        </div>
      </form>
    </>
  )
}
