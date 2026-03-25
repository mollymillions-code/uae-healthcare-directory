/**
 * Render a LinkedIn video from report slide screenshots.
 *
 * AUDIO-DRIVEN: When voiceover audio exists, each slide's duration is set
 * to match its narration length. The video adapts to the audio, not vice versa.
 *
 * Usage:
 *   node scripts/render-slide-video.mjs <report-slug> [slide-numbers]
 *
 * Examples:
 *   node scripts/render-slide-video.mjs ai-healthcare-uae
 *   node scripts/render-slide-video.mjs ai-healthcare-uae 1,3,5,8,12
 *
 * Prerequisites:
 *   1. Run screenshot-slides.mjs first to generate slide PNGs
 *   2. Remotion packages installed (npm install)
 *
 * Output:
 *   references/linkedin-video-<slug>/video.mp4
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const reportSlug = process.argv[2];
const slideSelection = process.argv[3]; // e.g. "1,3,5,8,12"

if (!reportSlug) {
  console.error(
    "Usage: node scripts/render-slide-video.mjs <report-slug> [slide-numbers]"
  );
  console.error("");
  console.error("Examples:");
  console.error("  node scripts/render-slide-video.mjs ai-healthcare-uae");
  console.error(
    "  node scripts/render-slide-video.mjs ai-healthcare-uae 1,3,5,8,12"
  );
  process.exit(1);
}

// ── Locate slide screenshots ────────────────────────────────────────

const carouselDir = join(
  process.cwd(),
  `references/linkedin-carousel-${reportSlug}`
);

if (!existsSync(carouselDir)) {
  console.error(`\nNo carousel images found at:\n  ${carouselDir}`);
  console.error(
    `\nRun the screenshot script first:\n  node scripts/screenshot-slides.mjs ${reportSlug}`
  );
  process.exit(1);
}

let slideFiles = readdirSync(carouselDir)
  .filter((f) => /^slide-\d+\.png$/.test(f))
  .sort();

if (slideFiles.length === 0) {
  console.error("No slide-*.png files found in", carouselDir);
  process.exit(1);
}

// Apply optional slide selection
if (slideSelection) {
  const selected = slideSelection.split(",").map((n) => parseInt(n.trim(), 10));
  slideFiles = slideFiles.filter((_, i) => selected.includes(i + 1));
  console.log(`Selected slides: ${selected.join(", ")}`);
}

console.log(`Found ${slideFiles.length} slides: ${slideFiles.join(", ")}`);

// ── Read report metadata ────────────────────────────────────────────

const metaPath = join(
  process.cwd(),
  `data/reports/${reportSlug}/meta.json`
);
let reportTitle = reportSlug
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");

if (existsSync(metaPath)) {
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  reportTitle = meta.title || reportTitle;
}

// ── Prepare output ──────────────────────────────────────────────────

const outputDir = join(
  process.cwd(),
  `references/linkedin-video-${reportSlug}`
);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const outputPath = join(outputDir, "video.mp4");

console.log(`\n  Report:  ${reportTitle}`);
console.log(`  Slides:  ${slideFiles.length}`);
console.log(`  Output:  ${outputPath}`);

// ── Check for voiceover audio ────────────────────────────────────────

const voiceoverPath = join(outputDir, "voiceover.mp3");
const hasVoiceover = existsSync(voiceoverPath);

if (hasVoiceover) {
  console.log(`  Voiceover: ${voiceoverPath}`);
} else {
  console.log(`  Voiceover: none (silent video)`);
  console.log(`  Tip: Run 'node scripts/generate-voiceover.mjs ${reportSlug}' to add narration`);
}

// ── Load captions from voiceover script ──────────────────────────────

let captions = undefined;
const scriptPath = join(outputDir, "voiceover_script.yaml");

if (existsSync(scriptPath)) {
  const raw = readFileSync(scriptPath, "utf8");
  const textMatches = [...raw.matchAll(/text:\s*"([^"]+)"/g)];
  if (textMatches.length > 0) {
    captions = textMatches.map((m) => m[1]);
    console.log(`  Captions: ${captions.length} segments`);
  }
}

// ── Measure per-segment audio durations (AUDIO-DRIVEN TIMING) ────────

let sectionDurations = undefined;

/**
 * Get MP3 duration in seconds using ffmpeg.
 */
function getAudioDuration(filePath) {
  try {
    const output = execSync(
      `ffmpeg -i "${filePath}" -f null - 2>&1`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const match = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
    }
  } catch (e) {
    // ffmpeg writes to stderr even on success, execSync throws
    const output = e.stderr || e.stdout || "";
    const match = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
    }
  }
  return null;
}

const audioDir = join(outputDir, "audio");
if (hasVoiceover && existsSync(audioDir)) {
  console.log("\n  Measuring audio durations (audio-driven mode):");
  sectionDurations = [];

  // Intro audio
  const introAudio = join(audioDir, "slide-intro.mp3");
  if (existsSync(introAudio)) {
    const dur = getAudioDuration(introAudio);
    sectionDurations.push(dur || 1.5);
    console.log(`    intro:   ${(dur || 1.5).toFixed(2)}s`);
  } else {
    sectionDurations.push(1.5);
    console.log(`    intro:   1.50s (default)`);
  }

  // Per-slide audio — match against the selected slide files
  for (const slideFile of slideFiles) {
    const slideNum = slideFile.match(/slide-(\d+)\.png/)[1];
    // Try both zero-padded and unpadded names
    let audioFile = join(audioDir, `slide-${slideNum}.mp3`);
    if (!existsSync(audioFile)) {
      audioFile = join(audioDir, `slide-${parseInt(slideNum)}.mp3`);
    }

    if (existsSync(audioFile)) {
      const dur = getAudioDuration(audioFile);
      sectionDurations.push(dur || 5);
      console.log(`    slide ${slideNum}: ${(dur || 5).toFixed(2)}s`);
    } else {
      sectionDurations.push(5);
      console.log(`    slide ${slideNum}: 5.00s (no audio, default)`);
    }
  }

  // Outro audio
  const outroAudio = join(audioDir, "slide-outro.mp3");
  if (existsSync(outroAudio)) {
    const dur = getAudioDuration(outroAudio);
    sectionDurations.push(dur || 3);
    console.log(`    outro:   ${(dur || 3).toFixed(2)}s`);
  } else {
    sectionDurations.push(3);
    console.log(`    outro:   3.00s (default)`);
  }

  const totalAudio = sectionDurations.reduce((a, b) => a + b, 0);
  console.log(`    TOTAL:   ${totalAudio.toFixed(1)}s across ${sectionDurations.length} sections`);
}

// ── Bundle Remotion project ─────────────────────────────────────────

// Copy voiceover into carousel dir so staticFile() can resolve it alongside slides
if (hasVoiceover) {
  copyFileSync(voiceoverPath, join(carouselDir, "voiceover.mp3"));
}

console.log("\nBundling Remotion project...");

const bundled = await bundle({
  entryPoint: resolve(process.cwd(), "remotion/index.ts"),
  publicDir: resolve(carouselDir),
});

// ── Prepare input props ─────────────────────────────────────────────

// ── Check for intro background image ─────────────────────────────────

let introBgSrc = undefined;
const introBgPath = join(carouselDir, "intro-bg.png");
if (existsSync(introBgPath)) {
  introBgSrc = "intro-bg.png";
  console.log(`  Intro BG: ${introBgPath}`);
}

const inputProps = {
  slides: slideFiles,
  reportTitle,
  reportUrl: `research.zavis.ai/reports/${reportSlug}`,
  voiceoverSrc: hasVoiceover ? "voiceover.mp3" : undefined,
  captions,
  sectionDurations,
  introBgSrc,
};

// ── Select composition (calculates duration from props) ─────────────

console.log("Calculating composition...");

const composition = await selectComposition({
  serveUrl: bundled,
  id: "SlideVideo",
  inputProps,
});

const durationSec = (composition.durationInFrames / composition.fps).toFixed(1);
console.log(
  `Duration: ${composition.durationInFrames} frames (${durationSec}s at ${composition.fps}fps)`
);

// ── Render MP4 ──────────────────────────────────────────────────────

console.log("\nRendering video...");
const startTime = Date.now();

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outputPath,
  inputProps,
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nDone in ${elapsed}s`);
console.log(`Video saved to: ${outputPath}`);
