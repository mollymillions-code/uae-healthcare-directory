import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  interpolate,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { Intro } from "../components/Intro";
import { Slide } from "../components/Slide";
import { Outro } from "../components/Outro";
import { Caption } from "../components/Caption";

const TRANSITION_FRAMES = 15;
const DEFAULT_INTRO_FRAMES = 45;
const DEFAULT_SLIDE_FRAMES = 150;
const DEFAULT_OUTRO_FRAMES = 90;

export interface SlideVideoProps {
  slides: string[];
  reportTitle: string;
  reportUrl: string;
  /** Path to the full voiceover MP3 (optional — video works without it) */
  voiceoverSrc?: string;
  /** Caption text per section: ["intro caption", "slide 1 caption", ..., "outro caption"] */
  captions?: string[];
  /** Duration in seconds for each section: [intro, slide1, slide2, ..., outro]. Drives timing from audio. */
  sectionDurations?: number[];
  /** Background image for the intro slide */
  introBgSrc?: string;
}

/**
 * Crossfade wrapper — fades a section in/out over TRANSITION_FRAMES
 * so overlapping Sequences create smooth crossfades.
 */
const CrossfadeWrap: React.FC<{
  children: React.ReactNode;
  duration: number;
  fadeIn: boolean;
  fadeOut: boolean;
}> = ({ children, duration, fadeIn, fadeOut }) => {
  const frame = useCurrentFrame();
  let opacity = 1;

  if (fadeIn) {
    opacity = Math.min(
      opacity,
      interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }
  if (fadeOut) {
    opacity = Math.min(
      opacity,
      interpolate(
        frame,
        [duration - TRANSITION_FRAMES, duration],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    );
  }

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const SlideVideo: React.FC<SlideVideoProps> = ({
  slides,
  reportTitle,
  reportUrl,
  voiceoverSrc,
  captions,
  sectionDurations,
  introBgSrc,
}) => {
  // Load Google Fonts
  const [fontHandle] = useState(() => delayRender("Loading fonts"));

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap";
    link.rel = "stylesheet";
    link.onload = () => continueRender(fontHandle);
    link.onerror = () => continueRender(fontHandle);
    document.head.appendChild(link);
  }, [fontHandle]);

  // Compute frames per section — driven by audio duration if available
  const fps = 30;
  const totalSections = 1 + slides.length + 1; // intro + slides + outro

  const getFrames = (sectionIndex: number, fallback: number, isOutro?: boolean): number => {
    if (sectionDurations && sectionDurations[sectionIndex] !== undefined) {
      // Convert seconds → frames, add buffer so speech never gets clipped
      const buffer = isOutro ? fps * 1.5 : fps * 0.5; // 1.5s extra for outro, 0.5s for slides
      return Math.ceil(sectionDurations[sectionIndex] * fps) + Math.ceil(buffer);
    }
    return fallback;
  };

  // Build timeline — each section overlaps the next by TRANSITION_FRAMES
  const sections: Array<{
    type: "intro" | "slide" | "outro";
    startFrame: number;
    durationFrames: number;
    slideIndex?: number;
    slideSrc?: string;
    caption?: string;
  }> = [];

  let cursor = 0;

  // Intro
  const introFrames = getFrames(0, DEFAULT_INTRO_FRAMES);
  sections.push({
    type: "intro",
    startFrame: 0,
    durationFrames: introFrames,
    caption: captions?.[0],
  });
  cursor = introFrames - TRANSITION_FRAMES;

  // Slides
  slides.forEach((src, i) => {
    const slideFrames = getFrames(i + 1, DEFAULT_SLIDE_FRAMES);
    sections.push({
      type: "slide",
      startFrame: cursor,
      durationFrames: slideFrames,
      slideIndex: i,
      slideSrc: src,
      caption: captions?.[i + 1],
    });
    cursor += slideFrames - TRANSITION_FRAMES;
  });

  // Outro — extra buffer so speech never clips
  const outroFrames = getFrames(slides.length + 1, DEFAULT_OUTRO_FRAMES, true);
  sections.push({
    type: "outro",
    startFrame: cursor,
    durationFrames: outroFrames,
    caption: captions?.[slides.length + 1],
  });

  // Resolve voiceover audio source
  const audioSrc = voiceoverSrc
    ? voiceoverSrc.startsWith("/") || voiceoverSrc.startsWith("http") || voiceoverSrc.startsWith("file:")
      ? voiceoverSrc
      : staticFile(voiceoverSrc)
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {sections.map((section, i) => (
        <Sequence
          key={i}
          from={section.startFrame}
          durationInFrames={section.durationFrames}
        >
          <CrossfadeWrap
            duration={section.durationFrames}
            fadeIn={i > 0}
            fadeOut={i < sections.length - 1}
          >
            {section.type === "intro" && <Intro title={reportTitle} bgSrc={introBgSrc} />}
            {section.type === "slide" && (
              <Slide src={section.slideSrc!} index={section.slideIndex!} />
            )}
            {section.type === "outro" && <Outro reportUrl={reportUrl} />}

            {/* Caption overlay */}
            {section.caption && <Caption text={section.caption} />}
          </CrossfadeWrap>
        </Sequence>
      ))}

      {/* Voiceover audio track — plays from the start, spans entire video */}
      {audioSrc && (
        <Audio src={audioSrc} volume={1} />
      )}
    </AbsoluteFill>
  );
};
