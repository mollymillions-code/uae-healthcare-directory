/**
 * Claude CLI wrapper for non-interactive execution.
 * Spawns `claude --print -p "prompt"` and captures output.
 */

import { spawn } from 'child_process';
import { PROJECT_ROOT } from './config.mjs';

/**
 * Run Claude CLI with a prompt and return the output.
 *
 * @param {string} prompt - The prompt to send to Claude
 * @param {object} options
 * @param {number} options.timeout - Timeout in ms (default 5 min)
 * @param {string} options.cwd - Working directory (default PROJECT_ROOT)
 * @returns {{ success: boolean, output: string, error: string, duration: number }}
 */
export async function runClaude(prompt, options = {}) {
  const { timeout = 5 * 60 * 1000, cwd = PROJECT_ROOT } = options;
  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let resolved = false;

    const proc = spawn('claude', ['--print', '-p', prompt], {
      cwd,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        resolve({
          success: false,
          output: stdout,
          error: `Timeout after ${timeout / 1000}s. Partial output captured.`,
          duration: Date.now() - startTime,
        });
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
          duration: Date.now() - startTime,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve({
          success: false,
          output: stdout,
          error: `Failed to spawn claude: ${err.message}`,
          duration: Date.now() - startTime,
        });
      }
    });
  });
}

/**
 * Extract JSON from Claude's output.
 * Claude often wraps JSON in markdown code blocks.
 */
export function extractJson(output) {
  // Try to find JSON in code blocks first
  const codeBlockMatch = output.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch { /* fall through */ }
  }

  // Try to find raw JSON object or array
  const jsonMatch = output.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
  }

  return null;
}
