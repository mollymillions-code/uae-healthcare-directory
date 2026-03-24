import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  let gitSha = "unknown";
  let gitMessage = "unknown";
  let gitDate = "unknown";
  let gitAuthor = "unknown";

  try {
    gitSha = execSync("git rev-parse HEAD", { cwd: process.cwd() }).toString().trim();
    gitMessage = execSync("git log -1 --pretty=%s", { cwd: process.cwd() }).toString().trim();
    gitDate = execSync("git log -1 --pretty=%ci", { cwd: process.cwd() }).toString().trim();
    gitAuthor = execSync("git log -1 --pretty=%an", { cwd: process.cwd() }).toString().trim();
  } catch {
    // git not available
  }

  return NextResponse.json({
    status: "ok",
    version: {
      sha: gitSha,
      short: gitSha.slice(0, 7),
      message: gitMessage,
      date: gitDate,
      author: gitAuthor,
    },
    server: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
