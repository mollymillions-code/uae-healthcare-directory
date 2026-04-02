import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  let gitSha = "unknown";
  let gitDate = "unknown";

  try {
    gitSha = execSync("git rev-parse --short HEAD", { cwd: process.cwd() }).toString().trim();
    gitDate = execSync("git log -1 --pretty=%ci", { cwd: process.cwd() }).toString().trim();
  } catch {
    // git not available
  }

  return NextResponse.json({
    status: "ok",
    version: { sha: gitSha, date: gitDate },
    server: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
