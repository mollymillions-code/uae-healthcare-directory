import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";

interface IntroProps {
  title: string;
  bgSrc?: string;
}

export const Intro: React.FC<IntroProps> = ({ title, bgSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Subtle Ken Burns on background
  const bgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  // Green accent line grows from center
  const lineWidth = spring({ frame, fps, config: { damping: 18, mass: 0.8 } });

  // "ZAVIS RESEARCH" fades in first
  const labelOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [5, 18], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Report title fades in after label
  const titleOpacity = interpolate(frame, [14, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [14, 30], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resolve background image
  const imgSrc = bgSrc
    ? bgSrc.startsWith("/") || bgSrc.startsWith("http") || bgSrc.startsWith("file:")
      ? bgSrc
      : staticFile(bgSrc)
    : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Background image with overlay */}
      {imgSrc && (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Img
            src={imgSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${bgScale})`,
            }}
          />
          {/* Dark gradient overlay for text readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(8,11,18,0.75) 0%, rgba(8,11,18,0.5) 40%, rgba(8,11,18,0.85) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 120,
          zIndex: 2,
        }}
      >
        {/* Subtitle label */}
        <div
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            fontFamily:
              "'Bricolage Grotesque', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 22,
            fontWeight: 400,
            color: "#999",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          ZAVIS RESEARCH
        </div>

        {/* Green accent line */}
        <div
          style={{
            width: lineWidth * 140,
            height: 3,
            backgroundColor: "#006828",
            marginBottom: 40,
          }}
        />

        {/* Report title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontFamily:
              "'Bricolage Grotesque', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 58,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: 1300,
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
