/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type FC, type ReactNode, useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface OrbitalItem {
  icon: FC<{ className?: string }> | null;
  label: string;
  emoji?: string;
}

interface OrbitalDisplayProps {
  innerRing: OrbitalItem[];
  outerRing?: OrbitalItem[];
  centerIcon?: ReactNode;
  centerLabel?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function OrbitalDisplay({
  innerRing,
  outerRing,
  centerIcon,
  centerLabel = "Z",
  size = "md",
  animate = true,
  className = "",
}: OrbitalDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState(400);

  const maxW = size === "sm" ? 360 : size === "md" ? 460 : 560;

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDim(Math.min(containerRef.current.offsetWidth, maxW));
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxW]);

  // GSAP entrance + optional rotation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const rafId = requestAnimationFrame(() => {
      const center = el.querySelector<SVGElement>("[data-orbital-center]");
      const innerG = el.querySelector<SVGGElement>("[data-orbital-inner]");
      const outerG = el.querySelector<SVGGElement>("[data-orbital-outer]");
      const rings = el.querySelectorAll<SVGCircleElement>("[data-orbital-ring]");
      const nodes = el.querySelectorAll<SVGGElement>("[data-orbital-node]");

      const tweens: gsap.core.Tween[] = [];
      let tl: gsap.core.Timeline | null = null;

      // Set initial states
      if (center) gsap.set(center, { transformOrigin: "center center", scale: 0 });
      gsap.set(rings, { opacity: 0 });
      gsap.set(nodes, { transformOrigin: "center center", opacity: 0, scale: 0 });

      // Entrance timeline
      tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      if (center) {
        tl.to(center, { scale: 1, duration: 0.5, ease: "back.out(1.4)" });
      }

      tl.to(rings, { opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.2");
      tl.to(nodes, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.06, ease: "back.out(1.2)" }, "-=0.2");

      // Optional continuous rotation
      if (animate) {
        if (innerG) {
          const t = gsap.to(innerG, {
            rotation: 360,
            duration: 140,
            repeat: -1,
            ease: "none",
            transformOrigin: `${dim / 2}px ${dim / 2}px`,
          });
          tweens.push(t);
        }
        if (outerG) {
          const t = gsap.to(outerG, {
            rotation: -360,
            duration: 200,
            repeat: -1,
            ease: "none",
            transformOrigin: `${dim / 2}px ${dim / 2}px`,
          });
          tweens.push(t);
        }
      }

      (el as any).__orbitalCleanup = { tweens, tl };
    });

    return () => {
      cancelAnimationFrame(rafId);
      const cleanup = (el as any).__orbitalCleanup;
      if (cleanup) {
        cleanup.tweens?.forEach((t: gsap.core.Tween) => t.kill());
        if (cleanup.tl) {
          cleanup.tl.scrollTrigger?.kill();
          cleanup.tl.kill();
        }
        delete (el as any).__orbitalCleanup;
      }
    };
  }, [dim, innerRing, outerRing, animate]);

  const cx = dim / 2;
  const cy = dim / 2;
  const innerR = dim * 0.26;
  const outerR = dim * 0.42;
  const centerR = dim < 360 ? 28 : 34;
  const nodeR = dim < 360 ? 20 : 24;

  function placeItems(items: OrbitalItem[], radius: number) {
    const step = (2 * Math.PI) / items.length;
    const start = -Math.PI / 2;
    return items.map((item, i) => {
      const angle = start + i * step;
      return {
        ...item,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }

  const innerPlaced = placeItems(innerRing, innerR);
  const outerPlaced = outerRing ? placeItems(outerRing, outerR) : [];

  return (
    <div ref={containerRef} className={`relative w-full mx-auto ${className}`} style={{ maxWidth: maxW }}>
      <svg viewBox={`0 0 ${dim} ${dim}`} width={dim} height={dim} className="w-full h-auto">
        {/* Orbit rings */}
        <circle
          data-orbital-ring
          cx={cx}
          cy={cy}
          r={innerR}
          fill="none"
          stroke="#006828"
          strokeWidth="1"
          strokeOpacity="0.08"
          strokeDasharray="4 6"
        />
        {outerRing && (
          <circle
            data-orbital-ring
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke="#006828"
            strokeWidth="1"
            strokeOpacity="0.06"
            strokeDasharray="4 6"
          />
        )}

        {/* Center node */}
        <g data-orbital-center>
          <circle cx={cx} cy={cy} r={centerR} fill="#006828" />
          {centerIcon ? (
            <foreignObject x={cx - centerR * 0.55} y={cy - centerR * 0.55} width={centerR * 1.1} height={centerR * 1.1}>
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {centerIcon}
              </div>
            </foreignObject>
          ) : (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize={centerR * 0.6}
              fontWeight="600"
              fontFamily="'Bricolage Grotesque', sans-serif"
            >
              {centerLabel}
            </text>
          )}
        </g>

        {/* Inner ring nodes */}
        <g data-orbital-inner>
          {innerPlaced.map((item, i) => (
            <g key={`inner-${i}`} data-orbital-node>
              <circle cx={item.x} cy={item.y} r={nodeR + 2} fill="none" stroke="#006828" strokeWidth="1" strokeOpacity="0.1" />
              <circle cx={item.x} cy={item.y} r={nodeR} fill="#fff" />
              {item.emoji ? (
                <foreignObject x={item.x - nodeR * 0.6} y={item.y - nodeR * 0.6} width={nodeR * 1.2} height={nodeR * 1.2}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: nodeR * 0.8 }}>
                    {item.emoji}
                  </div>
                </foreignObject>
              ) : item.icon ? (
                <foreignObject x={item.x - nodeR * 0.5} y={item.y - nodeR * 0.5} width={nodeR} height={nodeR}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon className="w-full h-full" />
                  </div>
                </foreignObject>
              ) : null}
              {/* Counter-rotation so labels stay upright */}
              <text
                x={item.x}
                y={item.y + nodeR + 12}
                textAnchor="middle"
                fill="#1c1c1c"
                fontSize={dim < 360 ? 8 : 10}
                fontWeight="500"
                fontFamily="'Geist', sans-serif"
                opacity="0.55"
                style={animate ? { transform: `rotate(0deg)`, transformOrigin: `${item.x}px ${item.y + nodeR + 12}px` } : undefined}
              >
                {item.label}
              </text>
            </g>
          ))}
        </g>

        {/* Outer ring nodes */}
        {outerPlaced.length > 0 && (
          <g data-orbital-outer>
            {outerPlaced.map((item, i) => (
              <g key={`outer-${i}`} data-orbital-node>
                <circle cx={item.x} cy={item.y} r={nodeR + 2} fill="none" stroke="#006828" strokeWidth="1" strokeOpacity="0.08" />
                <circle cx={item.x} cy={item.y} r={nodeR} fill="#fff" />
                {item.emoji ? (
                  <foreignObject x={item.x - nodeR * 0.6} y={item.y - nodeR * 0.6} width={nodeR * 1.2} height={nodeR * 1.2}>
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: nodeR * 0.8 }}>
                      {item.emoji}
                    </div>
                  </foreignObject>
                ) : item.icon ? (
                  <foreignObject x={item.x - nodeR * 0.5} y={item.y - nodeR * 0.5} width={nodeR} height={nodeR}>
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <item.icon className="w-full h-full" />
                    </div>
                  </foreignObject>
                ) : null}
                <text
                  x={item.x}
                  y={item.y + nodeR + 12}
                  textAnchor="middle"
                  fill="#1c1c1c"
                  fontSize={dim < 360 ? 8 : 10}
                  fontWeight="500"
                  fontFamily="'Geist', sans-serif"
                  opacity="0.55"
                  style={animate ? { transform: `rotate(0deg)`, transformOrigin: `${item.x}px ${item.y + nodeR + 12}px` } : undefined}
                >
                  {item.label}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
