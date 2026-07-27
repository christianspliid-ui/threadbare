# Deploy health signal — catching a silent production stoppage within the hour

**Issue:** THR-785 · **Date:** 2026-07-27 · **Pillar:** Infrastructure (Engine / Content / UI: N/A)

## Problem

`main` can advance while the deployed artifact does not, and nothing surfaces it.

The only native signal is a red `Vercel` status check on PRs — and that check is deliberately outside the required set (`{"contexts":["Test · Typecheck · Build"],"strict":true}`). Agents are correctly taught that Vercel is not the merge gate, so a red Vercel X is exactly the signal the executor lane steps past. In the originating incident, production deploys had stopped entirely and it took an unrelated ticket's closeout (THR-761, PR #892) reading an error body to notice.

CLAUDE.md's Definition of Done said *"Vercel auto-deploys from GitHub on push to `main`. Just ensure the push succeeded."* — treating a successful push as proof of deployment. During that window it was not.

The tier upgrade to Vercel Pro removed one *cause* (a quota lapse). It did not touch the class: a bad env var, a Vercel incident, a build that passes `vite build` locally but fails on their builder, or a billing lapse all produce the same silence.

## The trap in the obvious fix

The ticket proposed `gh api repos/christianspliid-ui/threadbare/commits/<sha>/status --jq .state` as the one-command confirmation. **Measured 2026-07-27, that command is not sufficient**, and would have shipped a check that reports healthy during exactly the failure it was built to catch:

```
$ gh api repos/christianspliid-ui/threadbare/commits/a9c33078/status --jq '.statuses[]'
{"context":"Vercel","state":"success","description":"Canceled by Ignored Build Step"}

$ gh api "repos/christianspliid-ui/threadbare/deployments?sha=a9c33078"
(empty)
```

A `success` status for a commit with **no deployment record at all**. `vercel.json` carries an `ignoreCommand` that exits 0 — skip the build — when a commit touches none of the build-relevant paths, and Vercel reports a skipped build as a *successful* commit status.

A green `Vercel` check means "Vercel is not unhappy". It never means "production serves this commit".

## What shipped

`scripts/check-deploy-health.ts`, exposed as `npm run check:deploy`. It reads the GitHub **deployments** API — the surface that records what actually shipped — and classifies `main` HEAD against it.

| verdict | meaning | needs a human |
|---|---|---|
| `deployed` | a Production deployment exists for HEAD and succeeded | no |
| `skipped` | HEAD has no deployment, but nothing build-relevant changed since the last successful one | no |
| `pending` | a build is plausibly still in flight (inside the grace window) | no, unless past grace |
| `failed` | the newest Production deployment errored, or every one in the lookback window did | **yes** |
| `stale` | HEAD carries build-relevant changes no successful deployment covers, past the grace window | **yes** |
| `unknown` | the probe could not determine state | no (fail-soft) |

**Anti-drift property.** The `skipped` verdict is judged using the path list **parsed out of `vercel.json`'s `ignoreCommand`**, not a copy of it. Adding a path to the ignore command teaches the probe about it in the same commit; the probe and the platform cannot drift into disagreeing about what a build-relevant change is. Parsing failure falls back to a deliberately *wide* list and warns — over-reporting a stale deploy is a recoverable annoyance, under-reporting one is the defect this ticket describes.

**Falsified both ways** rather than assumed: `1a9e4cd5..a9c33078` (docs-only) is build-irrelevant → `skipped`; `a406dc83..a9c33078` (contains the THR-812 `src/engine/` fix) is build-relevant → would classify `stale`. A predicate that only ever answered "benign" would have made the whole check vacuous.

### Constants (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `DEPLOY_STALE_GRACE_MINUTES` | 20 | How long an undeployed `main` commit is "probably still building" rather than a stoppage. Builds land in ~45s, so this is generous. |
| `DEPLOY_LOOKBACK` | 10 | Production deployments walked back looking for the newest successful one |
| `FALLBACK_BUILD_RELEVANT_PATHS` | wide list | Used only when the `ignoreCommand` cannot be parsed |

### Where the signal lands

`keep-work-flowing-cc` step 2.5 — the hourly PM brief, which already runs at the right cadence against `main` and already owns `Design/briefing.md`. `needsChristian: true` puts the probe's plain-language summary verbatim into `## Needs Christian`; everything else is at most one line under Freshness, and a `deployed` verdict says nothing at all. A healthy deploy is not news.

Summaries are written for Christian (THR-608) — "The live site is behind… publishing has stopped without reporting an error", not a status-check dump. A test asserts no API vocabulary leaks into them.

## Decisions

**Vercel stays a non-required check, permanently.** Recorded in CLAUDE.md § Definition of Done. Two reasons: it is not a correctness gate (`Test · Typecheck · Build` already proves the build compiles), and promoting it would couple every merge to a third-party service's availability. The fix for a silent stoppage is a *notification* path, not a new gate. This is written down because it is the obvious-looking wrong answer someone will propose again.

**Advisory by default.** The probe exits 0 unless `--strict`. It is not a commit gate; it is an observability surface. NFP #4 — a broken probe must never be the reason an hourly brief or a closeout fails, so every external call degrades to `unknown`.

## Deliberately out of scope

Deployment-volume attribution by lane, and scoping previews off `claude/*` / `docs/briefing-*` branches. On Pro this is cost hygiene rather than a blocker; Christian has the cost picture and the call.

## Three-pillar note

Infrastructure-only by nature — this changes no game behaviour. Engine / Content / UI are N/A with rationale: the probe reads CI metadata and git, touches no `src/` runtime path, renders nothing, and adds no content.
