"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { type QuizAnswers, type PlanRecommendation, recommendPlans } from "@/lib/insurance";
import { PlanCard } from "./PlanCard";
import { getCities } from "@/lib/data";

const STEPS = [
  { key: "budget", title: "What's your annual budget for health insurance?" },
  { key: "familySize", title: "Who needs to be covered?" },
  { key: "coverage", title: "What coverage matters most to you?" },
  { key: "city", title: "Which city do you live in?" },
] as const;

export function InsuranceQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<PlanRecommendation[] | null>(null);

  const cities = getCities();

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate results
      const fullAnswers: QuizAnswers = {
        budget: answers.budget || "mid",
        familySize: answers.familySize || "single",
        needsDental: answers.needsDental || false,
        needsMaternity: answers.needsMaternity || false,
        needsInternational: answers.needsInternational || false,
        preferredCity: answers.preferredCity || "dubai",
        prioritiseCopay: answers.prioritiseCopay || false,
      };
      setResults(recommendPlans(fullAnswers));
    }
  }

  function handleBack() {
    if (results) {
      setResults(null);
    } else if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setResults(null);
  }

  if (results) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Your Recommended Plans
            </h3>
            <p className="text-xs text-muted mt-1">{results.length} plans match your preferences</p>
          </div>
          <button onClick={handleReset} className="text-xs text-accent font-bold hover:text-accent-dark">
            Start over
          </button>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted mb-2">No plans matched your criteria closely.</p>
            <button onClick={handleReset} className="text-accent font-bold text-sm">
              Try different preferences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((rec, i) => (
              <div key={rec.plan.id} className="relative">
                {i === 0 && (
                  <div className="absolute -top-3 left-3 bg-accent text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 z-10">
                    Best match
                  </div>
                )}
                <PlanCard
                  plan={rec.plan}
                  insurerName={rec.insurer.name}
                  insurerSlug={rec.insurer.slug}
                  networkSize={rec.networkSize}
                />
                {rec.reasons.length > 0 && (
                  <div className="border border-t-0 border-light-200 px-3 py-2">
                    <p className="text-[10px] text-muted font-bold uppercase mb-1">Why this plan</p>
                    <ul className="space-y-0.5">
                      {rec.reasons.slice(0, 3).map((r) => (
                        <li key={r} className="text-[11px] text-dark flex items-start gap-1.5">
                          <span className="text-accent mt-0.5">▸</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${i <= step ? "bg-accent" : "bg-light-200"} transition-colors`}
          />
        ))}
      </div>

      <h3 className="text-lg font-bold text-dark mb-4">{STEPS[step].title}</h3>

      {/* Step: Budget */}
      {step === 0 && (
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "low", label: "Under AED 6,000/yr", desc: "Basic mandatory coverage" },
            { value: "mid", label: "AED 6,000 – 16,000/yr", desc: "Enhanced with dental & optical" },
            { value: "high", label: "AED 16,000+/yr", desc: "Premium, zero co-pay" },
          ] as const).map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setAnswers({ ...answers, budget: value })}
              className={`p-4 border text-left transition-colors ${
                answers.budget === value
                  ? "border-accent bg-accent-muted"
                  : "border-light-200 hover:border-accent"
              }`}
            >
              <p className="text-sm font-bold text-dark">{label}</p>
              <p className="text-[11px] text-muted mt-1">{desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step: Family */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "single", label: "Just me" },
            { value: "couple", label: "Me + partner" },
            { value: "family", label: "Family with kids" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAnswers({ ...answers, familySize: value })}
              className={`p-4 border text-left transition-colors ${
                answers.familySize === value
                  ? "border-accent bg-accent-muted"
                  : "border-light-200 hover:border-accent"
              }`}
            >
              <p className="text-sm font-bold text-dark">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step: Coverage priorities */}
      {step === 2 && (
        <div className="space-y-3">
          {([
            { key: "needsDental", label: "Dental coverage" },
            { key: "needsMaternity", label: "Maternity coverage" },
            { key: "needsInternational", label: "International coverage" },
            { key: "prioritiseCopay", label: "I want zero or low co-pay" },
          ] as const).map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                answers[key] ? "border-accent bg-accent-muted" : "border-light-200 hover:border-accent"
              }`}
            >
              <input
                type="checkbox"
                checked={!!answers[key]}
                onChange={(e) => setAnswers({ ...answers, [key]: e.target.checked })}
                className="w-4 h-4 accent-[#00c853]"
              />
              <span className="text-sm text-dark font-medium">{label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Step: City */}
      {step === 3 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cities.map((city) => (
            <button
              key={city.slug}
              onClick={() => setAnswers({ ...answers, preferredCity: city.slug })}
              className={`p-3 border text-center transition-colors ${
                answers.preferredCity === city.slug
                  ? "border-accent bg-accent-muted"
                  : "border-light-200 hover:border-accent"
              }`}
            >
              <p className="text-sm font-bold text-dark">{city.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm text-muted hover:text-dark disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleNext}
          className="btn-accent flex items-center gap-2"
        >
          {step === STEPS.length - 1 ? (
            <>Find plans <Sparkles className="w-4 h-4" /></>
          ) : (
            <>Next <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
