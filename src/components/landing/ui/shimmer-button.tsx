"use client";

import React, { type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Shared shimmer internals ─────────────────────────────────── */

interface ShimmerSharedProps {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

const shimmerDefaults: Required<ShimmerSharedProps> = {
  shimmerColor: "#4ade80",
  shimmerSize: "3px",
  borderRadius: "100px",
  shimmerDuration: "2.5s",
  background: "rgba(0, 0, 0, 1)",
};

function shimmerVars(props: ShimmerSharedProps): CSSProperties {
  const d = shimmerDefaults;
  return {
    "--spread": "90deg",
    "--shimmer-color": props.shimmerColor ?? d.shimmerColor,
    "--radius": props.borderRadius ?? d.borderRadius,
    "--speed": props.shimmerDuration ?? d.shimmerDuration,
    "--cut": props.shimmerSize ?? d.shimmerSize,
    "--bg": props.background ?? d.background,
  } as CSSProperties;
}

function ShimmerInternals() {
  return (
    <>
      {/* spark container — the visible shimmer beam */}
      <div
        className="absolute inset-0 overflow-visible [container-type:size]"
        style={{ zIndex: -30 }}
      >
        <div
          className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
          style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
        >
          <div
            className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
            style={{
              background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
              animation: "spin-around calc(var(--speed) * 2) infinite linear",
            }}
          />
        </div>
      </div>

      {/* glow layer — blurred duplicate for the soft outer glow */}
      <div
        className="pointer-events-none absolute overflow-visible [container-type:size]"
        style={{ inset: "-8px", zIndex: -31, filter: "blur(12px)", opacity: 0.6 }}
      >
        <div
          className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]"
          style={{ animation: "shimmer-slide var(--speed) ease-in-out infinite alternate" }}
        >
          <div
            className="absolute -inset-full w-auto rotate-0 [translate:0_0]"
            style={{
              background: "conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))",
              animation: "spin-around calc(var(--speed) * 2) infinite linear",
            }}
          />
        </div>
      </div>

      {/* Highlight — inset bottom glow for depth */}
      <div
        className={cn(
          "absolute inset-0 size-full pointer-events-none",
          "rounded-[var(--radius)] shadow-[inset_0_-8px_10px_#ffffff1f]",
          "transform-gpu transition-all duration-300 ease-in-out",
          "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
          "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
        )}
      />

      {/* backdrop — solid background inset by shimmerSize to reveal the spark */}
      <div
        className="absolute [background:var(--bg)] [border-radius:var(--radius)]"
        style={{ inset: "var(--cut)", zIndex: -20 }}
      />
    </>
  );
}

const shimmerClass =
  "group relative z-0 inline-flex w-fit cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap [background:var(--bg)] [border-radius:var(--radius)] transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px";

/* ── ShimmerButton (for <button>) ────────────────────────────── */

export interface ShimmerButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    ShimmerSharedProps {}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ shimmerColor, shimmerSize, borderRadius, shimmerDuration, background, className, children, ...props }, ref) => (
    <button
      style={shimmerVars({ shimmerColor, shimmerSize, borderRadius, shimmerDuration, background })}
      className={cn(shimmerClass, "text-white px-6 py-3", className)}
      ref={ref}
      {...props}
    >
      <ShimmerInternals />
      {children}
    </button>
  )
);
ShimmerButton.displayName = "ShimmerButton";

/* ── ShimmerLink (for <Link href="…">) ─────────────────────────── */

export type ShimmerLinkProps = ShimmerSharedProps & {
  href: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export const ShimmerLink = React.forwardRef<HTMLAnchorElement, ShimmerLinkProps>(
  ({ shimmerColor, shimmerSize, borderRadius, shimmerDuration, background, className, children, ...props }, ref) => (
    <Link
      style={shimmerVars({ shimmerColor, shimmerSize, borderRadius, shimmerDuration, background })}
      className={cn(shimmerClass, "text-white px-6 py-3", className)}
      ref={ref}
      {...props}
    >
      <ShimmerInternals />
      {children}
    </Link>
  )
);
ShimmerLink.displayName = "ShimmerLink";
