# Zavis Architecture Notes

## Production Deployment Topology

**Updated:** 2026-04-24T19:45:00+05:30 by Codex

- Public origin: AWS Lightsail Mumbai, `13.234.162.47`, Ubuntu 24.04.
- App runtime: Next.js 14 production server under PM2 blue/green slots.
- Active slot after recovery: green, port `3201`, PM2 app `zavis-green`.
- Idle slot after recovery: blue, port `3200`, PM2 app `zavis-blue`, stopped.
- Nginx upstream file: `/etc/nginx/conf.d/zavis-upstream.conf`.
- Active-slot pointer: `/home/ubuntu/zavis-deploy/active-slot`.
- Shared runtime state: `/home/ubuntu/zavis-shared`.
- Canonical deploy script: `/home/ubuntu/zavis-deploy/deploy.sh`, mirrored in repo at `scripts/ec2-deploy-infra/deploy.sh`.

## Self-hosted Deploy Gate

- Systemd service: `zavis-webhook-deploy.service`.
- Service script: `/home/ubuntu/zavis-deploy/github-webhook-deploy.mjs`.
- Bind address: `127.0.0.1:8787`.
- Public route: `https://www.zavis.ai/hooks/github/live-deploy`.
- Nginx proxies only the webhook route to the localhost service.
- Webhook auth: `X-Hub-Signature-256` HMAC-SHA256 over the raw body using `WEBHOOK_SECRET`.
- Deploy filter: `push` events only, `DEPLOY_REPO=zavis-support/zavis-landing`, `DEPLOY_BRANCH=live`.
- Serialization: webhook process queues/coalesces, then `deploy.sh` also enforces `/tmp/zavis-deploy.lock`.
- Build memory hardening: `NEXT_PRIVATE_BUILD_WORKER_COUNT=1` by default for EC2 deploys.

## CI Direction

- GitHub Actions automatic deploy/schedule triggers are disabled; workflows remain manual fallback only.
- Jenkins is not installed on production. If added later, run Jenkins on a separate CI host and have it call the signed deploy gate after lint, type check, and build pass.
- `Jenkinsfile` is present as the future separate-host CI contract.
