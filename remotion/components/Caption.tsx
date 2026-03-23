import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

export interface CaptionProps {
  text: string;
}

const MAX_WORDS_PER_CHUNK = 8;

/**
 * Single-line subtitle caption that cycles through chunks of text,
 * synced to the section's audio duration. Only one chunk visible at a time.
 */
export const Caption: React.FC<CaptionProps> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = text.split(" ");

  // Split into chunks of MAX_WORDS_PER_CHUNK
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += MAX_WORDS_PER_CHUNK) {
    chunks.push(words.slice(i, i + MAX_WORDS_PER_CHUNK).join(" "));
  }

  // Each chunk gets an equal share of the section duration
  const framesPerChunk = Math.floor(durationInFrames / chunks.length);

  // Determine which chunk is active
  const activeChunkIndex = Math.min(
    Math.floor(frame / framesPerChunk),
    chunks.length - 1
  );
  const activeChunk = chunks[activeChunkIndex];
  const chunkLocalFrame = frame - activeChunkIndex * framesPerChunk;

  // Fade in/out per chunk
  const fadeIn = interpolate(chunkLocalFrame, [0, fps * 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    chunkLocalFrame,
    [framesPerChunk - fps * 0.2, framesPerChunk],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Word-by-word highlight within the active chunk
  const chunkWords = activeChunk.split(" ");
  const highlightDuration = framesPerChunk * 0.8;
  const highlightStart = fps * 0.15;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: fadeIn * fadeOut,
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: "rgba(8, 11, 18, 0.85)",
          backdropFilter: "blur(12px)",
          borderRadius: 10,
          padding: "14px 32px",
          display: "flex",
          flexWrap: "nowrap",
          justifyContent: "center",
          gap: "0 8px",
        }}
      >
        {chunkWords.map((word, i) => {
          const wordTime =
            highlightStart + (i / chunkWords.length) * highlightDuration;

          const wordOpacity = interpolate(
            chunkLocalFrame,
            [wordTime, wordTime + 6],
            [0.35, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <span
              key={i}
              style={{
                fontFamily:
                  "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: 30,
                fontWeight: 500,
                color: "#F0ECE4",
                opacity: wordOpacity,
                display: "inline-block",
                lineHeight: 1.4,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
