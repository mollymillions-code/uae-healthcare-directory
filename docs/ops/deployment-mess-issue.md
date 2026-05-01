# Deployment Mess Issue — Branch / Production Divergence

**Created:** 2026-05-01 (by Claude Code Opus, on behalf of user)
**Owner needed:** Codex (originator of the staging branch in question)
**Severity:** Medium — production is healthy, but next deploy from `live` will roll it back
**Status:** Open

---

## TL;DR

Production zavis.ai is running code from the branch `codex/staging-green-full-20260430211038` (commit `07774b3`). The `live` branch on `zavis-support` has drifted **10 commits ahead** with different code that has **never been deployed**. If anyone runs `deploy.sh` (which uses `live` branch) instead of `promote-staged.sh`, production rolls back and loses Codex's recent fixes. This is a release-management hazard that needs to be resolved before any further `live`-branch deploys.

---

## Detailed timeline

### What happened

1. **2026-04-30 ~21:00 UTC** — Codex created branch `codex/staging-green-full-20260430211038` with 10 commits (verified provider badges, doctor route stability, search fixes, demo API fixes, staging infra, DB pool tune, account/portal experience, etc.):
   ```
   07774b3 Fix directory search navigation and doctor route stability
   e9d3c83 Add doctor fallback for empty specialty hubs
   d60a0a0 Keep zero-data category pages logical
   355180b Fix staging QA search and claim blockers
   e2d3fed Fix demo API JSON handling and privacy app section
   8334a9b Fix staging tunnel binary detection
   db0c644 Limit DB pool during staging builds
   8857a5b Harden inactive slot staging cleanup
   85bae31 Stage account and provider portal experience
   3895399 Stage verified clinic badge experience
   ```

2. **2026-04-30 ~21:08 UTC** — User (with Claude Opus assistance) ran `promote-staged.sh` on EC2, which:
   - Built the codex branch onto green slot
   - Ran the verification-badges DB migration
   - Swapped Nginx upstream to green (port 3201)
   - Set `active-slot=green`
   - Drained blue
   - Result: production now serving `07774b3` (codex branch tip)

3. **Immediately after** — `zavis-support/live` continued to receive commits from other contributors:
   ```
   560add9 fix(directory): harden provider query hot paths
   27bf99c fix(directory): paginate provider listings in database
   81b1aa5 fix(directory): use count query for insurer facet gates
   ```
   These commits were pushed to `live` AFTER the promote, meaning they have NEVER been deployed.

4. **As of 2026-05-01** — Production is running `07774b3` (codex branch). `zavis-support/live` is at `560add9` (different lineage). The two are not ancestors of each other.

### Verification (run these to confirm current state)

```bash
# What's running on production?
ssh -i ~/Downloads/Zavis-site-pem.pem ubuntu@13.234.162.47 \
  "cat /home/ubuntu/zavis-deploy/active-slot && cd /home/ubuntu/zavis-landing-green && git log --oneline -1 && git branch --show-current"
# Expected: green / 07774b3 / codex/staging-green-full-20260430211038

# What's on zavis-support/live?
git fetch zavis-support live && git log --oneline zavis-support/live -3
# Expected: 560add9 ... (or newer)

# Is 07774b3 an ancestor of zavis-support/live?
git merge-base --is-ancestor 07774b3 zavis-support/live && echo "yes" || echo "NO — divergent"
# Expected: NO — divergent
```

---

## Why this is a hazard

### Risk 1 — Accidental rollback

`deploy.sh` (the standard auto-deploy script triggered by GitHub Actions on push to `live`) does:

```bash
cd /home/ubuntu/zavis-landing-${target_slot}
git pull origin live
npm install && next build
# ... swap nginx upstream to target_slot
```

If anyone pushes to `live` and the GHA pipeline auto-deploys, the resulting build is from the **`live` branch tip** (currently `560add9` lineage). This deploy will:

- Lose `07774b3`'s search nav fix → users hit search bugs again
- Lose doctor specialty fallback → specialty hubs 500 again
- Lose demo API fix → book-a-demo form fails
- Lose staging tunnel detection → next stage attempt fails
- Lose DB pool tune → potential pool exhaustion under load
- Lose account/portal staging changes
- Lose verified-clinic-badge experience (and the migration data persists, but the UI is gone)

### Risk 2 — Inactive slot is also out of sync

The blue slot (currently inactive) has the **older** `live` branch state at `27bf99c`. It does NOT have either lineage's recent fixes. If a future emergency rollback flips active to blue, the site falls back to an even older state.

### Risk 3 — Future `promote-staged.sh` runs

`promote-staged.sh` builds the inactive slot from a named ref (currently still pointing at the codex staging branch). If someone re-runs `stage.sh` with a different ref, the staged-slot file changes — but if no one explicitly resets, future promotes may diverge further.

### Risk 4 — Phase 1 SEO commit (and future commits) are stuck

The user's just-completed Phase 1 SEO commit (`baed624`) was authored on top of the deployed `07774b3` (the right base for what's actually running). But `live` branch has diverged 10 commits sideways. Cherry-picking onto `live` would deploy SEO changes WITHOUT the codex fixes (Risk 1 territory). Pushing to the codex branch keeps the divergence alive.

---

## Root cause

`promote-staged.sh` was used to **deploy a feature branch** (`codex/staging-green-full-20260430211038`) directly to production **without first merging that branch into `live`**.

The `promote` flow assumes: "stage this branch, then make production point at it." It does NOT include "and merge the branch back into mainline."

When the team kept pushing fixes to `live` afterwards, those commits accumulated on a now-divergent branch from production.

This is a **process gap** in `promote-staged.sh`, not a bug. The script is doing what it's told. The missing step is **post-promote merge of staged ref into `live`**.

---

## Resolution options (for Codex)

### Option A — Merge codex branch into `live` (recommended)

```bash
# From a clean checkout of zavis-support/live
git fetch zavis-support live
git fetch zavis-support codex/staging-green-full-20260430211038
git checkout live
git merge --no-ff zavis-support/codex/staging-green-full-20260430211038 \
  -m "merge codex/staging-green-full-20260430211038 into live (post-promote)"
# Resolve conflicts if any (likely in DB schema, sitemap, or shared lib files)
git push zavis-support live
```

After this:
- `live` contains both lineages
- Production code matches `live` again
- Future `deploy.sh` runs are safe
- The Phase 1 SEO commit (`baed624` from user, currently local) can be rebased onto `live` and pushed normally

**Possible conflict zones:**
- `src/lib/db/schema.ts` — Codex added verification badges + provider portal columns; live may have added pagination columns
- `src/app/sitemap.ts` — both lineages may have touched gating
- `src/app/(directory)/directory/[city]/[...segments]/page.tsx` — both may have touched listing queries
- `next.config.mjs` — possible cache config drift

### Option B — Reset `live` to the codex branch tip + replay newer `live` commits

```bash
# More invasive — rewrites live history
git checkout live
git reset --hard 07774b3
git cherry-pick 81b1aa5 27bf99c 560add9   # the newer "live" commits, in order
# Resolve conflicts
git push zavis-support live --force-with-lease
```

Use only if Option A's merge proves too tangled. Force-push requires team coordination.

### Option C — Abandon the codex branch (NOT recommended)

If the 10 codex commits are deemed unwanted, deploy `live` over them. Risks: regressions in search, doctor fallback, demo API. Don't do this without explicit team agreement on what gets discarded.

---

## Process fixes to prevent recurrence

### Fix 1 — Update `promote-staged.sh` to require merge to `live`

Add a final step to the script:

```bash
# After successful promote
log "POST-PROMOTE: merging staged ref back into live"
git fetch origin live
git checkout live
git merge --no-ff "$STAGED_REF" -m "merge $STAGED_REF into live (post-promote)"
git push origin live
```

If the merge has conflicts, abort the promote-followup with a loud error and require manual resolution.

### Fix 2 — Add a divergence check at the top of `deploy.sh`

```bash
# Refuse to deploy if active slot's branch != live tip
ACTIVE_BRANCH=$(cd /home/ubuntu/zavis-landing-${active_slot} && git branch --show-current)
if [ "$ACTIVE_BRANCH" != "live" ]; then
  echo "ERROR: active slot is on branch '$ACTIVE_BRANCH', not 'live'."
  echo "       deploy.sh would replace it with 'live' tip, losing changes."
  echo "       Resolve via promote-staged.sh post-merge process first."
  exit 1
fi
```

### Fix 3 — Document the staging→promote→merge contract

Add a README at `/home/ubuntu/zavis-deploy/STAGING-CONTRACT.md` stating: "any `promote-staged.sh` run obligates a `live` merge before the next `deploy.sh` triggers."

---

## Immediate question (for whoever resolves this)

**Should the 10 codex commits stay in production, or be reverted in favor of `live`'s newer changes?**

If "stay" → Option A (merge codex into live)
If "revert" → run `deploy.sh` to roll forward (which actually rolls back from production's perspective). Confirm you understand what's being lost.

---

## What the user / Claude Opus did right now

1. Detected the divergence before pushing Phase 1 SEO commit. Did NOT push.
2. Phase 1 SEO commit (`baed624`) sits in detached HEAD locally, on top of `07774b3`.
3. Created this document to hand off to Codex.
4. Took the safest interim action (see § "Interim action" below).

---

## Interim action (taken now)

Phase 1 SEO commit (`baed624`) is being pushed to the codex branch `codex/staging-green-full-20260430211038`. This:

- Preserves the work on a remote (no risk of local loss)
- Keeps the codex branch in lockstep with what's running on production
- Does NOT touch the divergent `live` branch
- Does NOT trigger any auto-deploy
- Phase 1 SEO will ship the next time `promote-staged.sh` is run with this branch, OR after the divergence is resolved and the commit is rebased onto `live`

This is the minimum-blast-radius option until Codex resolves the divergence.

---

## Cross-references

- Implementation plan that produced the Phase 1 commit: [docs/playbooks/insurance-seo-strategy-plan.md](../playbooks/insurance-seo-strategy-plan.md)
- Promote script: `/home/ubuntu/zavis-deploy/promote-staged.sh` on EC2
- Deploy script: `/home/ubuntu/zavis-deploy/deploy.sh` on EC2
- Staged slot ref: `/home/ubuntu/zavis-deploy/staged-slot` on EC2

---

## Action items for Codex

- [ ] Decide: keep codex branch lineage, or revert to `live`'s newer changes?
- [ ] If keep: execute Option A (merge codex branch into live), resolve any conflicts
- [ ] Push merged `live` to `zavis-support/live`
- [ ] Add the process fixes (1, 2, 3) to prevent recurrence
- [ ] Mark this document `Status: Resolved` with date and commit SHA of the merge

---

## 2026-05-02 Update — Claude Opus follow-up work + revised user directive

User direction at `2026-05-02`: **"Don't push the codex branch to live. Push everything to the codex branch itself, and let the current setup exist like it is existing. I will later work with Codex to solve for that."**

→ Tier 2 (codex → live merge) is **DEFERRED**. Codex now owns the merge decision. Claude Opus shipped only the Tier 4 patches and additional QA on top of the codex branch lineage.

### Tier 4 patches landed on this branch (NOT pushed to `live`)

| # | Area | Change | Files |
|---|---|---|---|
| 4a | `/professionals/cardiology` redirect bug | Map-based `getSpecialtyBySlug` returned `undefined` at runtime in some Next bundle splits. Switched to direct `ALL_SPECIALTIES.find()`. EN + AR mirrors. | `src/app/(directory)/professionals/[category]/page.tsx`, `src/app/(directory)/ar/professionals/[category]/page.tsx` |
| 4b | `/insurance` hub 30s timeout | Removed `export const dynamic = "force-dynamic"` which was overriding `revalidate=43200` and forcing ~351 DB queries on every request. ISR was already configured correctly; the dynamic flag was the culprit. | `src/app/(directory)/insurance/page.tsx` |
| 4c | `promote-staged.sh` migration drift | Old script applied a single hardcoded migration file (`provider-verification-badges.sql`) and silently let everything else drift. Patched to iterate ALL `.sql` files in `scripts/db/migrations/` in lexical order. All migrations are idempotent (CREATE TABLE IF NOT EXISTS / ON CONFLICT / idempotent UPDATEs), so reapplying on every promote is self-healing. **This was the root cause of the consumer-accounts and provider-slug-history outages in late April.** | `scripts/ec2-deploy-infra/promote-staged.sh` |
| 4d | Provider portal email invites | Invite path was creating `clinicInvites` rows + activation URL but never sending an email — admin had to copy-paste manually. Added `sendProviderPortalInviteEmail()` to `@/lib/auth/email.ts` (mirrors password-reset pattern: tries Plunk → Resend → console.warn fallback) and called it from `createProviderPortalInvite()`. Best-effort: dispatch failures are logged but don't fail the invite itself; admin always still gets the URL in the API response. | `src/lib/auth/email.ts`, `src/lib/provider-portal/invites.ts` |

### Phase 2/3 SEO work also on this branch

- New tri-facet route: `src/app/(directory)/best/[city]/[category]/accepting/[insurer]/page.tsx` + AR mirror, with 7-question FAQ helper inline
- Sitemap emission for the new route (EN + AR alternates)
- `/insurance/[insurer]` now has a "Top clinics by city × category" section with chip links
- `TRI_FACET_INSURER_ALLOW` 6 → 12, `TRI_FACET_CATEGORY_ALLOW` 8 → 12 (also fixed silent-bug slug typos like `dentists` → `dental`)
- `INSURANCE_EDITORIAL` extended with bilingual ~200-word copy for axa, cigna, metlife, allianz-care, bupa-global, aetna-international (drafts — flagged for editorial review)
- `docs/playbooks/insurance-guide-listicle-briefs.md` — 10 detailed content briefs for Phase 3
- AR catchall listing branch now mounts `<FaqSection>` + `faqPageSchema()` with 7-question Arabic FAQ array

### URGENT QA fix landed: `/login` was the research dashboard password gate

User screenshot showed visitors clicking "Sign in" landing on a page titled "RESEARCH DASHBOARD / Welcome back / Dashboard password". Replaced `src/app/(directory)/login/page.tsx` with a proper consumer NextAuth credentials login form (email + password → `signIn("credentials", ...)` → redirects to `/account` or `?redirect=`). Links to `/forgot-password` and `/signup`. **No staff or research-dashboard references on the public consumer login.** The research dashboard gate is still reachable at `/dashboard-auth` for internal use only.

### NEW STRATEGIC CONSTRAINT FROM USER (2026-05-02) — flagged for codex

> "The sign-in is supposed to be happening via the Zavis platform for the clinics, but for the patients and users, the sign-in will happen here. For clinics, there is not going to be any sign-in here."

This conflicts with the embed-first design captured in `docs/ops/clinic-portal-intent.md`, which assumed `/provider-portal/login` continues to exist as a fallback for activated clinic accounts. Under the new directive:

- **Patient/consumer sign-in:** stays on the directory (`/login`) — already correct after this patch ✅
- **Clinic sign-in:** moves to the Zavis platform (separate SaaS, presumably `platform.zavis.ai` or `app.zavis.ai`)
- **`/provider-portal/login` route:** unclear whether to delete, redirect, or keep as embed-only

**Claude Opus has NOT deleted `/provider-portal/login`** because:
1. It's load-bearing for the existing invite/activate flow (admin invite → email → `/provider-portal/activate` sets password → `/provider-portal/login` to access dashboard)
2. The migration plan to the Zavis platform is owned by codex / user
3. Deleting unilaterally would break the half-built provider edit workflow

**Codex action item:** Decide migration strategy:
- Option A: Keep `/provider-portal/*` as embed-only (clinic websites iframe in via HMAC token); drop the standalone login form
- Option B: Build a redirect from `/provider-portal/login` → Zavis platform login URL
- Option C: Delete `/provider-portal/*` entirely; rebuild on the Zavis platform from scratch

### Files deleted

- `src/components/layout/Header.tsx` — confirmed orphan via `grep -rln "from.*['\"]@/components/layout/Header"` returned zero hits
- `src/components/layout/Footer.tsx` — removed broken `<Link href="/api/search">` (would 405)

### Branch state at 2026-05-02

- `phase-1-seo-and-handoff` (local) — has all the above work
- `codex/staging-green-full-20260430211038` (local + `origin` + `zavis-support`) — production-deployed tip, lineage intact
- `live` (`zavis-support`) — still drifted, still untouched

Per user instruction the local branch will be merged into / pushed onto the codex branch, NOT into `live`. The previously-described divergence between `codex/staging-green-full-20260430211038` and `zavis-support/live` is now codex's call to resolve.

**Status:** Open — Tier 4 patches and SEO Phase 2 are ready on the codex branch; codex owns the merge-to-live decision and the provider-portal sign-in strategy.
