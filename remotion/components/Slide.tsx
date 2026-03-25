import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { staticFile } from "remotion";

/**
 * Ken Burns directions — each slide gets a different subtle motion
 * so the video feels alive, not robotic.
 */
const DIRECTIONS = [
  { fromScale: 1.0, toScale: 1.08, fromX: 0, toX: 12, fromY: 0, toY: -8 },
  { fromScale: 1.06, toScale: 1.0, fromX: -8, toX: 8, fromY: 4, toY: -4 },
  { fromScale: 1.0, toScale: 1.06, fromX: 8, toX: -6, fromY: -4, toY: 6 },
  { fromScale: 1.05, toScale: 1.0, fromX: -4, toX: 12, fromY: 0, toY: -6 },
  { fromScale: 1.0, toScale: 1.07, fromX: 4, toX: -8, fromY: 6, toY: 0 },
  { fromScale: 1.04, toScale: 1.0, fromX: 0, toX: -10, fromY: -6, toY: 4 },
  { fromScale: 1.0, toScale: 1.05, fromX: -6, toX: 6, fromY: 0, toY: -8 },
  { fromScale: 1.06, toScale: 1.02, fromX: 10, toX: 0, fromY: 4, toY: -4 },
];

interface SlideProps {
  src: string;
  index: number;
}

export const Slide: React.FC<SlideProps> = ({ src, index }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dir = DIRECTIONS[index % DIRECTIONS.length];

  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [dir.fromScale, dir.toScale],
    { extrapolateRight: "clamp" }
  );
  const translateX = interpolate(
    frame,
    [0, durationInFrames],
    [dir.fromX, dir.toX],
    { extrapolateRight: "clamp" }
  );
  const translateY = interpolate(
    frame,
    [0, durationInFrames],
    [dir.fromY, dir.toY],
    { extrapolateRight: "clamp" }
  );

  // Resolve image source — supports both staticFile names and absolute paths
  const imgSrc = src.startsWith("/") || src.startsWith("http") || src.startsWith("file:")
    ? src
    : staticFile(src);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0a0a0a" }}>
      <Img
        src={imgSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
