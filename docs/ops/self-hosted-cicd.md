# Self-hosted CI/CD for Zavis

## Decision

Use a small GitHub webhook deployer on the EC2 host instead of GitHub Actions,
Jenkins, or a full CI server.

The deployer receives GitHub `push` webhooks for the `live` branch, verifies the
`X-Hub-Signature-256` HMAC signature, filters the repository and branch, then
runs `/home/ubuntu/zavis-deploy/deploy.sh`. The existing deploy script remains
the source of truth for blue-green slot selection, build, health checks, Nginx
swap, PM2 scaling, and sitemap generation.

## Why this shape

- Jenkins is too heavyweight for a single production app: JVM runtime, plugin
  upkeep, exposed UI, credential administration, and a larger security surface.
- Woodpecker and similar lightweight CI tools are cleaner than Jenkins, but
  still add a server, agents, OAuth/app setup, secrets, and pipeline syntax.
- Zavis already has a production-grade blue-green deploy script. The missing
  piece is a reliable trigger, not a second orchestration layer.

## Safety properties

- GitHub webhook signature is verified with SHA-256 HMAC before parsing payloads.
- Only `push` events for `DEPLOY_BRANCH=live` are allowed to deploy.
- `DEPLOY_REPO` is checked so unrelated repositories cannot trigger production.
- Deploys are serialized twice: first by the webhook queue, then by the deploy
  script's `flock` lock.
- Multiple pushes during a running deploy are coalesced to the latest queued
  push, preventing deploy stampedes.
- The deploy script keeps bounded blue-green overlap and only writes
  `active-slot` after post-swap edge health passes.
- Next build worker count defaults to `1` for lower EC2 memory pressure.

## Files

- `scripts/ec2-deploy-infra/github-webhook-deploy.mjs`
- `scripts/ec2-deploy-infra/webhook-deploy.service`
- `scripts/ec2-deploy-infra/webhook.env.example`
- `scripts/ec2-deploy-infra/nginx-webhook-location.conf`
- `scripts/ec2-deploy-infra/deploy.sh`

## EC2 setup

Copy the deployer files to `/home/ubuntu/zavis-deploy`:

```bash
scp scripts/ec2-deploy-infra/github-webhook-deploy.mjs ubuntu@HOST:/home/ubuntu/zavis-deploy/
scp scripts/ec2-deploy-infra/webhook-deploy.service ubuntu@HOST:/home/ubuntu/zavis-deploy/
scp scripts/ec2-deploy-infra/webhook.env.example ubuntu@HOST:/home/ubuntu/zavis-deploy/
```

Create `/home/ubuntu/zavis-deploy/webhook.env` from the example and generate a
secret:

```bash
openssl rand -hex 32
chmod 600 /home/ubuntu/zavis-deploy/webhook.env
```

Install and start the service:

```bash
sudo cp /home/ubuntu/zavis-deploy/webhook-deploy.service /etc/systemd/system/zavis-webhook-deploy.service
sudo systemctl daemon-reload
sudo systemctl enable --now zavis-webhook-deploy
curl -fsS http://127.0.0.1:8787/healthz
```

Add the Nginx location from
`scripts/ec2-deploy-infra/nginx-webhook-location.conf` inside the HTTPS server
block, then validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Create a GitHub repository webhook:

- Payload URL: `https://www.zavis.ai/hooks/github/live-deploy`
- Content type: `application/json`
- Secret: the same value as `WEBHOOK_SECRET`
- Events: `push` only

## Operations

Health:

```bash
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS http://127.0.0.1:8787/status
```

Logs:

```bash
journalctl -u zavis-webhook-deploy -n 100 --no-pager
tail -f /home/ubuntu/logs/webhook-deploy.log
tail -f /home/ubuntu/logs/deploy.log
```

Rollback:

```bash
/home/ubuntu/zavis-deploy/rollback.sh
```
