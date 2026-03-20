"use client";

import { useEffect, useRef, useState } from "react";

interface BackgroundGradientProps {
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export default function BackgroundGradient({
  children,
  className = "",
  interactive = true,
}: BackgroundGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCursorPosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, #0a1f12 0%, #1a472a 50%, #0f2d1a 100%)",
      }}
    >
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary blob - follows cursor slightly */}
        <div
          className="absolute w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full opacity-60 blur-[100px] animate-blob-1"
          style={{
            background: "radial-gradient(circle, #3d9d5c 0%, transparent 70%)",
            left: interactive ? `${cursorPosition.x * 0.3}%` : "10%",
            top: interactive ? `${cursorPosition.y * 0.3}%` : "10%",
            transition: "left 0.8s ease-out, top 0.8s ease-out",
          }}
        />

        {/* Secondary blob */}
        <div
          className="absolute w-[70vw] h-[70vw] md:w-[45vw] md:h-[45vw] rounded-full opacity-50 blur-[120px] animate-blob-2"
          style={{
            background: "radial-gradient(circle, #2d7a4d 0%, transparent 70%)",
            right: "-10%",
            top: "20%",
          }}
        />

        {/* Tertiary blob */}
        <div
          className="absolute w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full opacity-40 blur-[100px] animate-blob-3"
          style={{
            background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
            left: "30%",
            bottom: "-20%",
          }}
        />

        {/* Fourth blob - accent */}
        <div
          className="absolute w-[50vw] h-[50vw] md:w-[35vw] md:h-[35vw] rounded-full opacity-30 blur-[80px] animate-blob-4"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
            right: "20%",
            bottom: "10%",
          }}
        />

        {/* Interactive cursor glow */}
        {interactive && (
          <div
            className="absolute w-[30vw] h-[30vw] md:w-[20vw] md:h-[20vw] rounded-full opacity-40 blur-[60px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #4ade80 0%, transparent 70%)",
              left: `${cursorPosition.x}%`,
              top: `${cursorPosition.y}%`,
              transform: "translate(-50%, -50%)",
              transition: "left 0.15s ease-out, top 0.15s ease-out",
            }}
          />
        )}
      </div>

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        @keyframes blob-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(10%, 15%) scale(1.1);
          }
          50% {
            transform: translate(-5%, 10%) scale(0.95);
          }
          75% {
            transform: translate(15%, -10%) scale(1.05);
          }
        }

        @keyframes blob-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-15%, 10%) scale(1.1) rotate(120deg);
          }
          66% {
            transform: translate(10%, -15%) scale(0.9) rotate(240deg);
          }
        }

        @keyframes blob-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(-10%, -10%) scale(1.15);
          }
          40% {
            transform: translate(15%, 5%) scale(0.85);
          }
          60% {
            transform: translate(-5%, 15%) scale(1.1);
          }
          80% {
            transform: translate(10%, -5%) scale(0.95);
          }
        }

        @keyframes blob-4 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(-20%, 20%) scale(1.2) rotate(180deg);
          }
        }

        .animate-blob-1 {
          animation: blob-1 25s ease-in-out infinite;
        }

        .animate-blob-2 {
          animation: blob-2 30s ease-in-out infinite;
        }

        .animate-blob-3 {
          animation: blob-3 35s ease-in-out infinite;
        }

        .animate-blob-4 {
          animation: blob-4 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
