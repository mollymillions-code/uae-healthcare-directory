// PM2 ecosystem config for the zavis-landing blue-green deployment.
//
// Steady state: each slot runs 2 cluster workers with a 6G max_memory_restart.
// Workers bloat from ~150MB to 2-3GB over 24h due to ISR cache accumulation.
// 6G gives workers comfortable headroom for bot-traffic spikes (Applebot,
// ChatGPT-User, Bingbot) and ISR cache growth without restart-induced
// cold-cache thrash. Box has 30 GB RAM total, 4 workers × 6G = 24 GB peak,
// well under host capacity.
//
// History:
// - The original 6G ceiling caused OOM crashes on the smaller 8 GB box.
// - 2G ceiling (2026-04-11 → 2026-05-05) was too tight under crawler load,
//   causing premature restarts → cold ISR cache → cascading 30-50s TTFB.
//   Briefly bumped to 4G during the 2026-05-05 incident.
// - Returned to 6G after migration to 30 GB box; verified stable at <1.2s.
//
// Deploy-time override: during the bounded-overlap transition documented in
// docs/ops/blue-green-deploy-oom-runbook.md section 9.1, the deploy script
// sets ZAVIS_PM2_INSTANCES=1 before the initial target-slot start so the
// peak overlap is `2 old + 1 new = 3 workers` instead of `2 + 2 = 4`. After
// the old slot is stopped and the new slot is verified healthy, deploy.sh
// calls `pm2 scale <new-slot> 2` to reach the final steady state.
//
// File extension is .cjs deliberately: any parent-directory package.json
// with "type": "module" would otherwise flip this file into ESM mode and
// break `module.exports`. Documented in runbook section 9.1 hardening.
//
// This file lives in git at scripts/ec2-deploy-infra/ and is synced
// to EC2 by the GHA deploy workflow's drift-prevention step.

module.exports = {
  apps: [
    {
      name: "zavis-blue",
      cwd: "/home/ubuntu/zavis-landing-blue",
      script: "node_modules/.bin/next",
      args: "start -p 3200",
      exec_mode: "cluster",
      instances: Number.parseInt(process.env.ZAVIS_PM2_INSTANCES ?? "2", 10),
      max_memory_restart: "6G",
      env: {
        NODE_ENV: "production",
        PORT: 3200,
        NEXTAUTH_URL: "https://www.zavis.ai",
        ZAVIS_VERIFIED_PROVIDER_IDS: process.env.ZAVIS_VERIFIED_PROVIDER_IDS || "",
      },
      error_file: "/home/ubuntu/zavis-landing-blue/logs/error.log",
      out_file: "/home/ubuntu/zavis-landing-blue/logs/out.log",
    },
    {
      name: "zavis-green",
      cwd: "/home/ubuntu/zavis-landing-green",
      script: "node_modules/.bin/next",
      args: "start -p 3201",
      exec_mode: "cluster",
      instances: Number.parseInt(process.env.ZAVIS_PM2_INSTANCES ?? "2", 10),
      max_memory_restart: "6G",
      env: {
        NODE_ENV: "production",
        PORT: 3201,
        NEXTAUTH_URL: "https://www.zavis.ai",
        ZAVIS_VERIFIED_PROVIDER_IDS: process.env.ZAVIS_VERIFIED_PROVIDER_IDS || "",
      },
      error_file: "/home/ubuntu/zavis-landing-green/logs/error.log",
      out_file: "/home/ubuntu/zavis-landing-green/logs/out.log",
    },
  ],
};
