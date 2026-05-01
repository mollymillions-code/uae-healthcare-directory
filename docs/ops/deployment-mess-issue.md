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
