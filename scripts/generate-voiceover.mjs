/**
 * Generate voiceover audio from a YAML script using ElevenLabs TTS.
 *
 * Usage:
 *   node scripts/generate-voiceover.mjs <report-slug> [narrator-profile]
 *
 * Examples:
 *   node scripts/generate-voiceover.mjs ai-healthcare-uae
 *   node scripts/generate-voiceover.mjs ai-healthcare-uae storyteller
 *
 * Prerequisites:
 *   1. ELEVENLABS_API_KEY in .env.local
 *   2. voiceover_script.yaml in references/linkedin-video-<slug>/
 *
 * Output:
 *   references/linkedin-video-<slug>/voiceover.mp3       (full narration)
 *   references/linkedin-video-<slug>/audio/slide-{n}.mp3  (per-slide segments)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ── Load env from .env.local ────────────────────────────────────────────

const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Narrator profiles (mirrors src/lib/elevenlabs.ts) ────────────────────

const NARRATOR_PROFILES = {
  authority: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    settings: { stability: 0.75, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
  },
  storyteller: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    settings: { stability: 0.65, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
  },
  analyst: {
    voiceId: "VR6AewLTigWG4xSOukaG",
    settings: { stability: 0.85, similarity_boost: 0.7, style: 0.05, use_speaker_boost: false },
  },
  presenter: {
    voiceId: "ErXwobaYiN019PkySvjV",
    settings: { stability: 0.55, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true },
  },
  executive: {
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    settings: { stability: 0.8, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true },
  },
};

// ── Parse args ──────────────────────────────────────────────────────────

const reportSlug = process.argv[2];
const narratorKey = process.argv[3] || "authority";

if (!reportSlug) {
  console.error("Usage: node scripts/generate-voiceover.mjs <report-slug> [narrator-profile]");
  console.error("");
  console.error("Narrator profiles: authority, storyteller, analyst, presenter, executive");
  process.exit(1);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY not found in environment or .env.local");
  process.exit(1);
}

const profile = NARRATOR_PROFILES[narratorKey];
if (!profile) {
  console.error(`Unknown narrator profile: ${narratorKey}`);
  console.error(`Available: ${Object.keys(NARRATOR_PROFILES).join(", ")}`);
  process.exit(1);
}

// ── Load voiceover script ───────────────────────────────────────────────

const videoDir = join(process.cwd(), `references/linkedin-video-${reportSlug}`);
const scriptPath = join(videoDir, "voiceover_script.yaml");

if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });

let segments = [];

if (existsSync(scriptPath)) {
  // Simple YAML parser for our specific format — avoids adding a yaml dependency
  const raw = readFileSync(scriptPath, "utf8");
  const textMatches = [...raw.matchAll(/text:\s*"([^"]+)"/g)];
  const slideMatches = [...raw.matchAll(/slide:\s*(.+)/g)];

  for (let i = 0; i < textMatches.length; i++) {
    segments.push({
      slide: slideMatches[i] ? slideMatches[i][1].trim().replace(/"/g, "") : `${i}`,
      text: textMatches[i][1],
    });
  }

  if (segments.length === 0) {
    console.error("No segments found in voiceover_script.yaml");
    console.error("Expected format: segments with 'text: \"...\"' entries");
    process.exit(1);
  }
} else {
  console.error(`No voiceover script found at: ${scriptPath}`);
  console.error("");
  console.error("Create a voiceover_script.yaml first using the voiceover-script-writer skill,");
  console.error("or provide a --text flag for a single narration.");
  console.error("");
  console.error("Alternatively, you can pass text directly:");
  console.error("  node scripts/generate-voiceover.mjs ai-healthcare-uae authority --text \"Your narration here\"");

  // Check for --text inline mode
  const textFlagIdx = process.argv.indexOf("--text");
  if (textFlagIdx !== -1 && process.argv[textFlagIdx + 1]) {
    segments = [{ slide: "full", text: process.argv[textFlagIdx + 1] }];
  } else {
    process.exit(1);
  }
}

console.log(`\n  Report:   ${reportSlug}`);
console.log(`  Narrator: ${narratorKey}`);
console.log(`  Segments: ${segments.length}`);
console.log(`  Voice ID: ${profile.voiceId}`);

// ── ElevenLabs TTS function ─────────────────────────────────────────────

async function generateTTS(text, voiceId, settings) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: settings,
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Generate per-segment audio ──────────────────────────────────────────

const audioDir = join(videoDir, "audio");
if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true });

const segmentBuffers = [];

for (let i = 0; i < segments.length; i++) {
  const seg = segments[i];
  const label = `slide-${seg.slide}`;
  console.log(`\n  [${i + 1}/${segments.length}] Generating: ${label}`);
  console.log(`    "${seg.text.substring(0, 80)}${seg.text.length > 80 ? "..." : ""}"`);

  const buffer = await generateTTS(seg.text, profile.voiceId, profile.settings);
  segmentBuffers.push(buffer);

  // Save individual segment
  const segPath = join(audioDir, `${label}.mp3`);
  writeFileSync(segPath, buffer);
  console.log(`    Saved: ${segPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// ── Concatenate into full voiceover ─────────────────────────────────────
// Simple concatenation of MP3 buffers — works because all segments use
// the same codec settings. For production, use FFmpeg for gapless joins.

const fullBuffer = Buffer.concat(segmentBuffers);
const fullPath = join(videoDir, "voiceover.mp3");
writeFileSync(fullPath, fullBuffer);

console.log(`\n  Full voiceover: ${fullPath} (${(fullBuffer.length / 1024).toFixed(1)} KB)`);
console.log(`\nDone. ${segments.length} segments generated with "${narratorKey}" narrator.`);
