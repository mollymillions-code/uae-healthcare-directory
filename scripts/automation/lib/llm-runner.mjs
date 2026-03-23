/**
 * LLM Runner — unified interface for pipeline AI tasks.
 *
 * Uses Gemini API (works in CI without Claude CLI auth).
 * Falls back to Claude CLI locally if available.
 *
 * Environment: GEMINI_API_KEY required.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from './config.mjs';

// ── Load env ────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const content = readFileSync(join(PROJECT_ROOT, '.env.local'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env.local not found — rely on env vars */ }
}

loadEnv();

// ── Gemini API call ─────────────────────────────────────────────────

async function callGemini(prompt, options = {}) {
  const { timeout = 5 * 60 * 1000, model = 'gemini-2.5-flash' } = options;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    clearTimeout(timer);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, output: text, error: '' };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { success: false, output: '', error: `Timeout after ${timeout / 1000}s` };
    }
    return { success: false, output: '', error: err.message };
  }
}

// ── Claude CLI call (local fallback) ────────────────────────────────

async function callClaude(prompt, options = {}) {
  const { timeout = 5 * 60 * 1000 } = options;
  const { spawn } = await import('child_process');
  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let resolved = false;

    const proc = spawn('claude', ['--print', '-p', prompt], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        resolve({ success: false, output: stdout, error: `Timeout after ${timeout / 1000}s` });
      }
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve({
          success: code === 0,
          output: stdout,
          error: code !== 0 ? (stderr || `Exit code ${code}`) : '',
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve({ success: false, output: '', error: `Failed to spawn claude: ${err.message}` });
      }
    });
  });
}

// ── Unified runner ──────────────────────────────────────────────────

/**
 * Run an LLM prompt. Uses Gemini in CI, Claude CLI locally if available.
 */
export async function runLLM(prompt, options = {}) {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (isCI || !hasClaude()) {
    console.log('  [LLM] Using Gemini API');
    return callGemini(prompt, options);
  }

  console.log('  [LLM] Using Claude CLI (local)');
  return callClaude(prompt, options);
}

function hasClaude() {
  try {
    const { execSync } = require('child_process');
    execSync('which claude', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Re-export extractJson (unchanged) ───────────────────────────────

export function extractJson(output) {
  const codeBlockMatch = output.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch { /* fall through */ }
  }

  const jsonMatch = output.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
  }

  return null;
}

// ── Backward compatibility ──────────────────────────────────────────
// The weekly-pipeline.mjs imports runClaude — alias it
export const runClaude = runLLM;
