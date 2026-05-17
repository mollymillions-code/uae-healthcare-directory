// PM2 ecosystem config for the zavis-landing blue-green deployment.
//
// Steady state: each slot runs 4 cluster workers with a 6G max_memory_restart.
// The autoscaler (ratchet-up only) scales the active slot up to 6 workers under
// load and never scales down. Standby slot is always kept at a minimum of 2
// warm workers for instant failover.
// Workers bloat from ~150MB to 2-3GB over 24h due to ISR cache accumulation.
// 6G gives workers comfortable headroom for bot-traffic spikes (Applebot,
// ChatGPT-User, Bingbot) and ISR cache growth without restart-induced
// cold-cache thrash. Box has 30 GB RAM total; 6 active + 2 standby workers
// × 6G ceiling = 48 GB theoretical max, but real usage is 1-2 GB per worker
// under normal load (8-16 GB total), well within the 30 GB host.
//
// History:
// - The original 6G ceiling caused OOM crashes on the smaller 8 GB box.
// - 2G ceiling (2026-04-11 → 2026-05-05) was too tight under crawler load,
//   causing premature restarts → cold ISR cache → cascading 30-50s TTFB.
//   Briefly bumped to 4G during the 2026-05-05 incident.
// - Returned to 6G after migration to 30 GB box; verified stable at <1.2s.
// - Baseline raised from 2 → 4 workers (2026-05-15): ratchet-up-only autoscaler.
//
// Deploy-time override: during the bounded-overlap transition documented in
// docs/ops/blue-green-deploy-oom-runbook.md section 9.1, the deploy script
// sets ZAVIS_PM2_INSTANCES=1 before the initial target-slot start. After the
// new slot is verified healthy and promoted, deploy.sh/promote-staged.sh
// leaves the previous slot hot at 2 workers and scales the new active slot to
// 4 workers, returning to the 8-worker steady state.
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
      instances: Number.parseInt(process.env.ZAVIS_PM2_INSTANCES ?? "4", 10),
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
      instances: Number.parseInt(process.env.ZAVIS_PM2_INSTANCES ?? "4", 10),
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
