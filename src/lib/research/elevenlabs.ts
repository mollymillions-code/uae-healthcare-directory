/**
 * ElevenLabs Voice-Over Client
 *
 * Generates narration audio from scripts using the ElevenLabs TTS API.
 * Supports multiple narrator voices for different video types.
 *
 * Usage:
 *   import { generateVoiceover, listVoices, NARRATOR_PROFILES } from '@/lib/elevenlabs';
 *   const audio = await generateVoiceover({ text, narratorProfile: 'authority' });
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return key;
}

// ── Narrator Profiles ──────────────────────────────────────────────────
// Each profile maps to a voice + settings tuned for a specific video tone.
// Voice IDs are ElevenLabs defaults — replace with cloned/custom voices as needed.

export interface NarratorProfile {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  /** When to use this narrator */
  bestFor: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export const NARRATOR_PROFILES: Record<string, NarratorProfile> = {
  authority: {
    id: "authority",
    name: "The Authority",
    description:
      "Deep, confident, measured. Like a Bloomberg anchor delivering market analysis.",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam — deep male
    bestFor: [
      "research reports",
      "market analysis",
      "LinkedIn videos",
      "data-heavy content",
    ],
    settings: {
      stability: 0.75,
      similarity_boost: 0.8,
      style: 0.15,
      use_speaker_boost: true,
    },
  },
  storyteller: {
    id: "storyteller",
    name: "The Storyteller",
    description:
      "Warm, engaging, conversational. Draws the viewer in with narrative pacing.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella — warm female
    bestFor: [
      "case studies",
      "patient journey videos",
      "brand stories",
      "explainer content",
    ],
    settings: {
      stability: 0.65,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    },
  },
  analyst: {
    id: "analyst",
    name: "The Analyst",
    description:
      "Precise, articulate, neutral. Lets the data speak — no hype, just clarity.",
    voiceId: "VR6AewLTigWG4xSOukaG", // Arnold — clear male
    bestFor: [
      "competitive analysis",
      "financial reports",
      "technical deep-dives",
      "comparison videos",
    ],
    settings: {
      stability: 0.85,
      similarity_boost: 0.7,
      style: 0.05,
      use_speaker_boost: false,
    },
  },
  presenter: {
    id: "presenter",
    name: "The Presenter",
    description:
      "Energetic, professional, upbeat. Conference keynote energy for short-form.",
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni — energetic male
    bestFor: [
      "YouTube Shorts",
      "Instagram Reels",
      "product demos",
      "ad creatives",
      "TikTok",
    ],
    settings: {
      stability: 0.55,
      similarity_boost: 0.8,
      style: 0.45,
      use_speaker_boost: true,
    },
  },
  executive: {
    id: "executive",
    name: "The Executive",
    description:
      "Polished, authoritative female voice. C-suite briefing tone.",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel — polished female
    bestFor: [
      "executive summaries",
      "quarterly reports",
      "investor content",
      "leadership briefings",
    ],
    settings: {
      stability: 0.8,
      similarity_boost: 0.75,
      style: 0.1,
      use_speaker_boost: true,
    },
  },
};

// ── Types ───────────────────────────────────────────────────────────────

export interface VoiceoverRequest {
  /** The narration text */
  text: string;
  /** Narrator profile key from NARRATOR_PROFILES */
  narratorProfile: keyof typeof NARRATOR_PROFILES;
  /** Override voice ID (optional — uses profile default if omitted) */
  voiceId?: string;
  /** TTS model — defaults to eleven_multilingual_v2 */
  model?: string;
  /** Output format — defaults to mp3_44100_128 */
  outputFormat?: string;
}

export interface VoiceoverResult {
  /** Raw audio buffer (MP3) */
  audioBuffer: Buffer;
  /** Content type */
  contentType: string;
  /** Characters consumed */
  charactersUsed: number;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
}

// ── Core Functions ──────────────────────────────────────────────────────

/**
 * Generate voiceover audio from text using a narrator profile.
 *
 * Returns the raw MP3 buffer — caller is responsible for saving to disk.
 */
export async function generateVoiceover(
  req: VoiceoverRequest
): Promise<VoiceoverResult> {
  const profile = NARRATOR_PROFILES[req.narratorProfile];
  if (!profile) {
    throw new Error(
      `Unknown narrator profile: ${req.narratorProfile}. Available: ${Object.keys(NARRATOR_PROFILES).join(", ")}`
    );
  }

  const voiceId = req.voiceId || profile.voiceId;
  const model = req.model || "eleven_multilingual_v2";
  const outputFormat = req.outputFormat || "mp3_44100_128";

  const response = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": getApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: req.text,
        model_id: model,
        voice_settings: profile.settings,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs API error ${response.status}: ${errorBody}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  // Character count from headers (if available)
  const charactersUsed = parseInt(
    response.headers.get("character-count") || `${req.text.length}`,
    10
  );

  return {
    audioBuffer,
    contentType: response.headers.get("content-type") || "audio/mpeg",
    charactersUsed,
  };
}

/**
 * Generate voiceover for multiple scenes and return individual buffers.
 * Useful for per-slide narration where each slide gets its own audio segment.
 */
export async function generateSceneVoiceovers(
  scenes: Array<{ sceneIndex: number; text: string }>,
  narratorProfile: keyof typeof NARRATOR_PROFILES
): Promise<Array<{ sceneIndex: number; audioBuffer: Buffer; durationEstimate: number }>> {
  const results: Array<{
    sceneIndex: number;
    audioBuffer: Buffer;
    durationEstimate: number;
  }> = [];

  for (const scene of scenes) {
    const result = await generateVoiceover({
      text: scene.text,
      narratorProfile,
    });

    // Rough duration estimate: ~150 words per minute for professional narration
    const wordCount = scene.text.split(/\s+/).length;
    const durationEstimate = (wordCount / 150) * 60;

    results.push({
      sceneIndex: scene.sceneIndex,
      audioBuffer: result.audioBuffer,
      durationEstimate,
    });
  }

  return results;
}

/**
 * List available voices from the ElevenLabs account.
 * Useful for discovering custom/cloned voices.
 */
export async function listVoices(): Promise<Voice[]> {
  const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error ${response.status}`);
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Get remaining character quota for the current billing period.
 */
export async function getUsage(): Promise<{
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
}> {
  const response = await fetch(`${ELEVENLABS_BASE}/user/subscription`, {
    headers: { "xi-api-key": getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error ${response.status}`);
  }

  const data = await response.json();
  return {
    characterCount: data.character_count,
    characterLimit: data.character_limit,
    remainingCharacters: data.character_limit - data.character_count,
  };
}
