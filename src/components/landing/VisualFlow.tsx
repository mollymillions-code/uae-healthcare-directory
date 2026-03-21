import { type FC } from "react";

interface FlowStep {
  icon: FC<{ className?: string }>;
  label: string;
}

interface VisualFlowProps {
  steps: FlowStep[];
  className?: string;
  dark?: boolean;
}

function ArrowConnector({ dark = false }: { dark?: boolean }) {
  const color = dark ? "text-white/30" : "text-[#006828]/30";
  return (
    <div className="hidden md:flex items-center justify-center flex-shrink-0 px-4">
      <svg
        width="56"
        height="16"
        viewBox="0 0 56 16"
        fill="none"
        className={color}
      >
        <path
          d="M0 8h52M48 3l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MobileArrow({ dark = false }: { dark?: boolean }) {
  const color = dark ? "text-white/30" : "text-[#006828]/30";
  return (
    <div className="flex md:hidden items-center justify-center flex-shrink-0 py-2">
      <svg
        width="16"
        height="32"
        viewBox="0 0 16 32"
        fill="none"
        className={color}
      >
        <path
          d="M8 0v28M3 24l5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function VisualFlow({ steps, className = "", dark = false }: VisualFlowProps) {
  const nodeBg = dark ? "bg-white/10 ring-white/10" : "bg-[#006828]/10 ring-[#006828]/10";
  const iconColor = dark ? "text-white" : "text-[#006828]";
  const labelColor = dark ? "text-white/80" : "text-[#1c1c1c]/70";

  return (
    <div className={className}>
      {/* Desktop layout: circles row with arrows aligned to circle centers */}
      <div className="hidden md:flex items-start justify-center">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <div key={i} className="flex items-start">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div className={`w-16 h-16 rounded-full ${nodeBg} flex items-center justify-center flex-shrink-0 ring-1`}>
                  <StepIcon className={`w-7 h-7 ${iconColor}`} />
                </div>
                {/* Label below circle */}
                <span className={`font-['Geist',sans-serif] text-sm font-semibold ${labelColor} text-center whitespace-nowrap mt-3 max-w-[120px]`}>
                  {step.label}
                </span>
              </div>
              {/* Arrow — vertically centered to the circle (h-16 = 4rem, so mt-[calc(2rem-8px)] centers the 16px arrow) */}
              {i < steps.length - 1 && (
                <div className="mt-[24px]">
                  <ArrowConnector dark={dark} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile layout: vertical */}
      <div className="flex md:hidden flex-col items-center gap-0">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full ${nodeBg} flex items-center justify-center flex-shrink-0 ring-1`}>
                <StepIcon className={`w-7 h-7 ${iconColor}`} />
              </div>
              <span className={`font-['Geist',sans-serif] text-sm font-semibold ${labelColor} text-center whitespace-nowrap mt-2 max-w-[120px]`}>
                {step.label}
              </span>
              {i < steps.length - 1 && <MobileArrow dark={dark} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
