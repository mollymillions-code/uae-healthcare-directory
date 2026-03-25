import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface OutroProps {
  reportUrl: string;
}

export const Outro: React.FC<OutroProps> = ({ reportUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Read the full report" fades in
  const ctaOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [0, 18], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent line
  const lineWidth = spring({
    frame: Math.max(frame - 8, 0),
    fps,
    config: { damping: 18, mass: 0.8 },
  });

  // URL fades in after CTA
  const urlOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ZAVIS" wordmark at bottom
  const wordmarkOpacity = interpolate(frame, [30, 50], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          fontFamily:
            "'Bricolage Grotesque', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 48,
          fontWeight: 600,
          color: "#ffffff",
          marginBottom: 32,
        }}
      >
        Read the full report
      </div>

      {/* Accent line */}
      <div
        style={{
          width: lineWidth * 200,
          height: 3,
          backgroundColor: "#006828",
          marginBottom: 32,
        }}
      />

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily:
            "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
          fontSize: 30,
          fontWeight: 400,
          color: "#006828",
        }}
      >
        {reportUrl}
      </div>

      {/* Wordmark at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          opacity: wordmarkOpacity,
          fontFamily:
            "'Bricolage Grotesque', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#ffffff",
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        ZAVIS
      </div>
    </AbsoluteFill>
  );
};
