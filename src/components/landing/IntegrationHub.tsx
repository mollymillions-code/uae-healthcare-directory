/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type FC, useState, useEffect, useRef } from "react";

interface HubPartner {
  icon: FC<{ className?: string }>;
  label?: string;
  name?: string;
  color: string;
}

interface IntegrationHubProps {
  partners: HubPartner[];
  className?: string;
}

export function IntegrationHub({ partners, className = "" }: IntegrationHubProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(400);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setSize(Math.min(width, 480));
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GSAP animations: dash flow + scroll-triggered entrance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      // Wait one frame for SVG to render with correct size
      rafId = requestAnimationFrame(() => {
        const lines = container.querySelectorAll<SVGLineElement>("[data-hub-line]");
        const centerCircle = container.querySelector<SVGCircleElement>("[data-hub-center]");
        const centerText = container.querySelector<SVGTextElement>("[data-hub-center-text]");
        const partnerGroups = container.querySelectorAll<SVGGElement>("[data-hub-partner]");

        const tweens: gsap.core.Tween[] = [];
        let tl: gsap.core.Timeline | null = null;

        // Animate dashed line strokeDashoffset continuously
        if (lines.length) {
          lines.forEach((line) => {
            const tween = gsap.to(line, {
              strokeDashoffset: -20,
              repeat: -1,
              ease: "none",
              duration: 1.5,
            });
            tweens.push(tween);
          });
        }

        // Scroll-triggered entrance timeline
        if (centerCircle && partnerGroups.length) {
          // Set initial states
          gsap.set(centerCircle, { transformOrigin: "center center", scale: 0 });
          if (centerText) {
            gsap.set(centerText, { opacity: 0 });
          }
          gsap.set(partnerGroups, { transformOrigin: "center center", opacity: 0, scale: 0 });
          gsap.set(lines, { opacity: 0 });

          tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });

          // Step 1: Scale in center circle
          tl.to(centerCircle, {
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.4)",
          });

          // Step 2: Fade in center text
          if (centerText) {
            tl.to(centerText, {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
            }, "-=0.2");
          }

          // Step 3: Fade in connection lines
          tl.to(lines, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.04,
            ease: "power2.out",
          }, "-=0.1");

          // Step 4: Stagger partner nodes in
          tl.to(partnerGroups, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(1.2)",
          }, "-=0.15");
        }

        // Store cleanup refs on the container element
        (container as any).__gsapCleanup = { tweens, tl };
      });
    })();

    return () => {
      cancelAnimationFrame(rafId);
      const cleanup = (container as any).__gsapCleanup;
      if (cleanup) {
        cleanup.tweens?.forEach((t: gsap.core.Tween) => t.kill());
        if (cleanup.tl) {
          cleanup.tl.scrollTrigger?.kill();
          cleanup.tl.kill();
        }
        delete (container as any).__gsapCleanup;
      }
    };
  }, [size, partners]);

  const center = size / 2;
  const radius = size < 360 ? size * 0.32 : size * 0.35;
  const partnerCircleRadius = size < 360 ? 22 : 28;
  const centerCircleRadius = size < 360 ? 28 : 36;
  const angleStep = (2 * Math.PI) / partners.length;
  const startAngle = -Math.PI / 2; // Start from top

  return (
    <div ref={containerRef} className={`relative w-full max-w-[480px] mx-auto ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="w-full h-auto"
      >
        {/* Connection lines */}
        {partners.map((partner, i) => {
          const angle = startAngle + i * angleStep;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={`line-${i}`}
              data-hub-line
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={partner.color}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeDashoffset="0"
              strokeOpacity="0.35"
            />
          );
        })}

        {/* Center circle */}
        <circle
          data-hub-center
          cx={center}
          cy={center}
          r={centerCircleRadius}
          fill="#006828"
        />
        <text
          data-hub-center-text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={centerCircleRadius * 0.65}
          fontWeight="600"
          fontFamily="'Bricolage Grotesque', sans-serif"
        >
          Z
        </text>

        {/* Partner nodes */}
        {partners.map((partner, i) => {
          const angle = startAngle + i * angleStep;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const PartnerIcon = partner.icon;

          return (
            <g key={`partner-${i}`} data-hub-partner>
              {/* Outer ring */}
              <circle
                cx={x}
                cy={y}
                r={partnerCircleRadius + 2}
                fill="none"
                stroke={partner.color}
                strokeWidth="1"
                strokeOpacity="0.15"
              />
              {/* Background circle */}
              <circle cx={x} cy={y} r={partnerCircleRadius} fill="#fff" />
              {/* Icon -- rendered via foreignObject for React component support */}
              <foreignObject
                x={x - partnerCircleRadius * 0.5}
                y={y - partnerCircleRadius * 0.5}
                width={partnerCircleRadius}
                height={partnerCircleRadius}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PartnerIcon
                    className={`w-full h-full`}
                  />
                </div>
              </foreignObject>
              {/* Label */}
              <text
                x={x}
                y={y + partnerCircleRadius + 14}
                textAnchor="middle"
                fill="#1c1c1c"
                fontSize={size < 360 ? 9 : 11}
                fontWeight="500"
                fontFamily="'Geist', sans-serif"
                opacity="0.7"
              >
                {partner.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
