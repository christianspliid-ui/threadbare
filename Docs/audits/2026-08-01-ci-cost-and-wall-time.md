# CI cost and wall time — the premise was wrong (THR-919)

**Date:** 2026-08-01
**Issue:** THR-919
**Verdict:** The cost framing collapses. **GitHub Actions costs this repo $0/month.** The wall-time
problem is real and worth fixing, but it is a *velocity* problem, not a *spend* problem — and the
lever the ticket ranked most confident (a larger runner) is the one that would introduce spend
where there currently is none.

---

## 1. The finding: the repository is public

```
$ gh api repos/christianspliid-ui/threadbare --jq '{private, visibility, fork}'
{"fork":false,"private":false,"visibility":"public"}

$ grep -n "runs-on" .github/workflows/*.yml
.github/workflows/ci.yml:33:    runs-on: ubuntu-latest
.github/workflows/ci.yml:121:   runs-on: ubuntu-latest
.github/workflows/ci.yml:169:   runs-on: ubuntu-latest
.github/workflows/drift-scan.yml:19:      runs-on: ubuntu-latest
.github/workflows/linear-autoclose.yml:39: runs-on: ubuntu-latest
.github/workflows/stale-claim-sweep.yml:25: runs-on: ubuntu-latest
```

Every workflow runs on `ubuntu-latest` — a **standard** GitHub-hosted runner — in a **public**
repository. Per GitHub's billing documentation: *"GitHub Actions usage is free for self-hosted
runners and for public repositories that use standard GitHub-hosted runners."*

**There is no per-minute charge for any CI in this repo.** Not for the 942-file test suite, not for
the cancelled runs, not for the hourly lanes.

### What this corrects

THR-919's own reconstruction — *"~1,150 min/month at $0.008/min for a private repo on standard
runners ≈ $9/month"* — took the repo to be private. It is not. The correct figure is **$0**, and the
$9 estimate was never the right order of magnitude to reason about either.

The billing API remains unreadable from this lane (`gh api users/.../settings/billing/actions`
returns 404 for want of the `user` scope, as the ticket noted). **That no longer matters.** The
invoice was only needed to test the hypothesis "the $50 is this suite", and repo visibility settles
that question without it: a free service cannot be $50 of anything.

### Done-when #5, answered

> *Either the $50 is confirmed as this suite, or the real source is named.*

**It is not this suite.** GitHub Actions bills this repo nothing.

Naming the real source is outside what this lane can verify — it requires reading accounts only
Christian holds. What can be said is which candidates remain, since GitHub is now excluded:
Anthropic API / Claude Code usage (by far the most likely, given the hourly agent lanes), Vercel,
Linear seats, domain registration, and any MCP-backed services. See § *Needs Christian*.

---

## 2. The lever ranking inverts

The ticket ranked four levers "roughly in order of confidence". With the repo confirmed public,
that order is wrong in its top entry.

| # | Lever | Ticket's framing | Corrected |
|---|---|---|---|
| 1 | Larger runner (`ubuntu-latest-4-core`) | *"bills 2×/min… spend is flat"* | **Inverted.** Larger runners are billed **even on public repositories**. This moves CI from $0 to a real bill — the only lever here that *creates* cost. Now a Christian-owned spend decision, not an engineering one. |
| 2 | Shard across N runners (`vitest --shard`) | *"Buys speed, not money."* | **Now the strongest free lever.** On a public repo, N standard runners cost the same as one: nothing. The wall-clock win is real and the spend argument against it disappears. Caveat below. |
| 3 | `isolate: false` | *"Genuinely risky here."* | Unchanged, and still the largest single target (~364s of import time). **Carried by THR-940.** |
| 4 | Cut wasted runs | *"36% of full-suite spend produced no green result."* | Value proposition changes: it now saves **wall-clock and queue contention**, not money. Still worth doing. **Carried by THR-939.** |

GitHub's documentation is explicit on the lever-1 point: *"Larger runners are always charged for,
even when used by public repositories or when you have quota available from your plan."*

**Sharding caveat (lever 2).** `Test · Typecheck · Build` is a **required** status check under branch
protection. Sharding it into a matrix produces N differently-named checks and would leave the
required check unsatisfiable unless an aggregating gate job keeps the exact name. Anyone taking
lever 2 must land the aggregator in the same PR, or `main` becomes unmergeable. This is also why
lever 2 should not be attempted concurrently with THR-940, which restructures how the suite runs.

---

## 3. Measurement noise defeats single-pair before/after

Five consecutive executed CI jobs from 2026-08-01, same suite, no relevant code change between them:

| Run | `Run tests` | Whole job | Started |
|---|---|---|---|
| 30691980447 | 426s | 589s | 08:33:30Z |
| 30691641830 | 427s | 586s | 08:23:09Z |
| 30690046896 | 745s | 949s | 07:36:07Z |
| 30688937175 | 948s | 1143s | 07:03:32Z |
| 30686974456 | 913s | 1112s | 06:03:08Z |

**426s to 948s — a 2.2× spread in four hours, with the suite unchanged.** Shared `ubuntu-latest`
runners vary that much in delivered throughput. The 889s figure in THR-919's description is one
sample from this distribution, not a baseline.

Two consequences:

1. **THR-919 Done-when #1 as written is not achievable.** "A before/after wall-clock measurement…
   on the same commit" is dominated by noise at this variance — a single pair can show a 2×
   "improvement" from a change that does nothing, or hide a real one.
2. **THR-940's Done-when #2 needs restating.** It requires the `Run tests` step to land "at most 60%
   of the pre-change baseline". Against a 426–948s baseline, that threshold can be met or missed by
   luck alone. It should be **median of ≥5 runs on each side**, or better, judged on vitest's own
   `import`/`tests` breakdown (which is internally consistent within a run and far less
   runner-sensitive). THR-940's Done-when #4 already asks for that breakdown — it is the more
   trustworthy of its two numeric gates.

---

## 4. Housekeeping resolved (Done-when #4)

`vitest.config.isolated.ts` is **deleted**. It was an 8-line stub:

```ts
export default defineConfig({ test: { globals: true, environment: 'node' } });
```

It was referenced by nothing executable — not `package.json` (`test` is a bare `vitest run`), not
any workflow, no `--config` flag anywhere. Worse, it was strictly *inferior* to `vitest.config.ts`:
no `setupFiles`, no `plugins`, and **no `exclude` list**, so running it would have swept
`node_modules/`, `dist/`, and every sibling worktree into the test run. Its stated purpose —
"node-only tests without jsdom overhead" — is already the default, since `vitest.config.ts` sets
`environment: 'node'`.

The two stale references in `.planning/codebase/STACK.md` and `.planning/codebase/TESTING.md` are
updated in the same commit.

**Note for THR-940:** that ticket names this file as "already exists as a seam". It was not a usable
seam — any real projects/isolation split would have replaced its contents wholesale. Deleting it
removes a trap, and costs THR-940 nothing.

---

## 5. Needs Christian

1. **Where the ~$50/month actually goes.** GitHub Actions is now excluded. The likeliest candidate
   is Anthropic API / Claude Code usage from the hourly agent lanes; Vercel, Linear, and domain
   registration are the other candidates. Only Christian can read those accounts. Until it is named,
   no CI change can be justified as a cost saving — because there is no CI cost to save.
2. **Whether to buy wall-clock with a larger runner.** `ubuntu-latest-4-core` is billed even on a
   public repo, so this is a decision to start paying for something currently free, in exchange for
   faster feedback. It is a spend call, not an engineering call. Recommendation: **don't** — lever 2
   (sharding) and lever 3 (THR-940) buy the same wall-clock for free, and should be exhausted first.

---

## 6. Disposition of THR-919

The ticket's coordination block anticipated this outcome: *"Start with the cost caveat, not the
code… it may redirect the whole ticket, or close it."* It did.

- **Done-when #1** (before/after on a chosen lever) — **N/A, and unachievable as written.** No lever
  is landed here: lever 1 is a Christian spend decision, lever 2 collides with THR-940's
  restructuring, levers 3 and 4 have their own tickets. § 3 shows why the measurement it asks for
  would not have been trustworthy anyway.
- **Done-when #2** (suite stays green, no skips) — satisfied; this change deletes an unused config
  file and edits two docs. Test count unchanged.
- **Done-when #3** (`isolate: false` order-dependence) — N/A; lever 3 not attempted here.
- **Done-when #4** (`vitest.config.isolated.ts`) — **resolved by deletion.** § 4.
- **Done-when #5** (cost caveat) — **answered.** § 1.

Levers 3 and 4 continue as THR-940 and THR-939, with their cost premise corrected by this audit.
