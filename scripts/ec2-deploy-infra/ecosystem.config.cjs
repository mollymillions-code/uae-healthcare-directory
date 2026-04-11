// PM2 ecosystem config for the zavis-landing blue-green deployment.
//
// Steady state: each slot runs 2 cluster workers with a 6G max_memory_restart.
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
// IMPORTANT: This file is on EC2 only, not in git. Drift risk.

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
      env: { NODE_ENV: "production", PORT: 3200 },
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
      env: { NODE_ENV: "production", PORT: 3201 },
      error_file: "/home/ubuntu/zavis-landing-green/logs/error.log",
      out_file: "/home/ubuntu/zavis-landing-green/logs/out.log",
    },
  ],
};
