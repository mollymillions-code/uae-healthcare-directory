import type { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const shouldAnimate = direction !== "none";
  const delayStyle = delay > 0 ? { animationDelay: `${delay}s` } : undefined;
  return (
    <div className={`${shouldAnimate ? "animate-fade-up" : ""} ${className}`.trim()} style={delayStyle}>
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`z-stagger ${className}`.trim()}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-stagger-item className={className}>
      {children}
    </div>
  );
}
