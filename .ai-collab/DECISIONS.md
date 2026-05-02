# Zavis Decisions

## 2026-04-24 — Keep Postgres local for now, harden backups first

**Context:** The app and Postgres both run on the same Lightsail host. Moving Postgres to RDS would reduce single-host risk but is a separate migration with its own cutover risk.

**Decision:** Do not move the DB as part of this recovery pass. Keep Postgres local and implement step-two hardening: checksummed local dumps, encrypted remote backup upload, scheduled restore smoke tests, health checks, and deploy-lock coordination.

**Why:**

- The user explicitly asked not to act on a DB migration first.
- The immediate gap was backup/restore confidence, not query latency.
- Local DB keeps the current app path stable while reducing disaster-recovery risk.
- Restore verification gives a real signal that dumps are usable.

**Pending:** Managed Postgres/RDS with PITR and failover remains the medium-term architecture if the business wants higher availability.

## 2026-04-24 — Production deploy gate over Jenkins-on-production

**Context:** GitHub Actions billing blocked deploys, and concurrent human/GHA deploys previously left the active-slot pointer and PM2 runtime out of sync. The user asked for a long-term foundation and questioned whether Jenkins would be more stable.

**Decision:** Use a small signed deploy gate on the production EC2/Lightsail host and keep the existing blue-green `deploy.sh` as the only production cutover path. Do not install Jenkins on the production app host. Include a `Jenkinsfile` for a later separate CI host if stronger pre-deploy CI orchestration is needed.

**Why:**

- The current outage class was deploy coordination and runtime health, not missing pipeline syntax.
- Production needs fewer resident services, not a JVM CI controller with plugins, credentials, and a public admin UI on the same box.
- The deploy gate is narrow: HMAC verification, branch/repo filtering, queue/coalescing, and one call into the existing bounded blue-green script.
- Jenkins remains compatible later because it can call the same HMAC-protected deploy gate after lint/typecheck/build from a separate host.

**Pending:** GitHub repository webhook creation requires a token with `admin:repo_hook`; current `gh` auth lacks that scope.
