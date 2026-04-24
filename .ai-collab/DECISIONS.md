# Zavis Decisions

## 2026-04-24 — Production deploy gate over Jenkins-on-production

**Context:** GitHub Actions billing blocked deploys, and concurrent human/GHA deploys previously left the active-slot pointer and PM2 runtime out of sync. The user asked for a long-term foundation and questioned whether Jenkins would be more stable.

**Decision:** Use a small signed deploy gate on the production EC2/Lightsail host and keep the existing blue-green `deploy.sh` as the only production cutover path. Do not install Jenkins on the production app host. Include a `Jenkinsfile` for a later separate CI host if stronger pre-deploy CI orchestration is needed.

**Why:**

- The current outage class was deploy coordination and runtime health, not missing pipeline syntax.
- Production needs fewer resident services, not a JVM CI controller with plugins, credentials, and a public admin UI on the same box.
- The deploy gate is narrow: HMAC verification, branch/repo filtering, queue/coalescing, and one call into the existing bounded blue-green script.
- Jenkins remains compatible later because it can call the same HMAC-protected deploy gate after lint/typecheck/build from a separate host.

**Pending:** GitHub repository webhook creation requires a token with `admin:repo_hook`; current `gh` auth lacks that scope.
