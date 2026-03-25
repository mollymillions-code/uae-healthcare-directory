import React from "react";
import { Composition } from "remotion";
import { SlideVideo } from "./compositions/SlideVideo";

const FPS = 30;
const TRANSITION_FRAMES = 15;

export const Root: React.FC = () => {
  return (
    <Composition
      id="SlideVideo"
      component={SlideVideo}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={300}
      defaultProps={{
        slides: [] as string[],
        reportTitle: "Zavis Research Report",
        reportUrl: "research.zavis.ai",
        voiceoverSrc: undefined as string | undefined,
        captions: undefined as string[] | undefined,
        sectionDurations: undefined as number[] | undefined,
        introBgSrc: undefined as string | undefined,
      }}
      calculateMetadata={({ props }) => {
        const n = Math.max(props.slides.length, 1);
        const durations = props.sectionDurations;

        if (durations && durations.length > 0) {
          let totalFrames = 0;
          for (let i = 0; i < durations.length; i++) {
            const isOutro = i === durations.length - 1;
            const buffer = isOutro ? FPS * 1.5 : FPS * 0.5;
            totalFrames += Math.ceil(durations[i] * FPS) + Math.ceil(buffer);
          }
          totalFrames -= (durations.length - 1) * TRANSITION_FRAMES;
          return { durationInFrames: Math.max(totalFrames, FPS) };
        }

        const totalFrames = 45 + n * 150 + 90 - (n + 1) * TRANSITION_FRAMES;
        return { durationInFrames: Math.max(totalFrames, FPS) };
      }}
    />
  );
};
