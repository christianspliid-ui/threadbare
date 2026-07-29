> **title:** `SKIPPED required check — recorded verdict on gate topology — THR-842`
> **linear_issue:** THR-842
> **author:** Claude Code
> **created:** 2026-07-29
> **three_pillars:** Engine `N/A — CI/CD topology, no tick-loop surface` · Content `N/A — no authored content` · UI `N/A — no player-facing or debug surface`

# SKIPPED required check — recorded verdict on gate topology — THR-842

The required merge gate can resolve `SKIPPED` for two structurally different reasons, only one of which is safe, and GitHub treats both as satisfying branch protection — this records which reason we accept and what closes the other.

## Why this is load-bearing

`Test · Typecheck · Build` is the only control standing between a feature branch and `main`; `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § H6 keeps the PR gate specifically because it once caught a phantom 3,379-line reversal. A required check that resolves `SKIPPED` **satisfies branch protection** — GitHub offers no setting to change that — so any path that produces a skip is a path that waves a change through. This repo has evidenced the dangerous variant twice (PR #853 on 2026-07-25, PR #1022 on 2026-07-28 carrying engine + content changes), and the benign variant runs many times a day. Without a recorded verdict, every future session re-derives the distinction from scratch and at least one of them gets it wrong — the 2026-07-29 `daily-backlog-grooming` verdict on THR-842 had to spend a full section warning readers not to misread the benign skips on `main` as the incident recurring.

### The two skips

| Cause | `Detect code changes` reads | `Test · Typecheck · Build` reads | Verdict |
|---|---|---|---|
| Path filter decided the diff is docs-only | `success` | `skipped` | **Benign — load-bearing.** Docs-only PRs must stay fast. |
| `detect` never produced an answer (Actions outage, paths-filter API error, runner fault, bad token) | `failure` / did not start | `skipped` under the pre-THR-768 condition | **Dangerous.** The check vouches for a change it never inspected. |

The discriminator is **the gating job's own result**, not the required check's conclusion. Anyone auditing a skip must read `detect`, not `check`.

## Verdict

**Accepted, conditional on the guard.** We do not abolish the skip — it is load-bearing, and a naive "fail closed on any skip" rule would break every docs-only PR, which is the majority of merges in this repo. Instead the rule is: **a skip must only ever be produced by a decision, never by an absence.** Three layers hold that:

1. **`Guard — change detection health` (shipped in THR-768, `.github/workflows/ci.yml`).** The `check` job's condition became three-way — it now also runs when `needs.detect.result != 'success'`, and its first step fails loudly in that case. The old two-way condition conflated "nothing to check" with "could not tell"; that conflation *is* the vulnerability. This closes every cause except a full Actions outage.
2. **Full Actions outage is self-blocking under the new condition.** When jobs cannot start, they record `failure`, not `skipped` — which is exactly what PR #1022 showed for `detect` and for `linear-autoclose`. Since THR-768 the `check` job is *scheduled* on that path rather than skipped, so it records `failure` too and branch protection blocks. An outage severe enough that the workflow is never queued leaves the required check pending, which also blocks. Neither residue reaches `main`.
3. **Operational backstops, for the window before a fix lands.** `npm run check:actions` returns `standDown: true` on a billing block, and `pull-work` Step 0.6 refuses to claim implementation work while it does. The mandatory post-arming rollup read (`pull-work` § "Closeout — ship with auto-merge") refuses to merge on a `SKIPPED` required check unless the diff is confirmed docs-only.

**Accepted residual risk:** nothing mechanically asserts "a code-carrying diff can never produce a `SKIPPED` required check". The guarantee rests on one YAML `if` expression that no test exercises. Mitigation is the rollup read in layer 3, which is a per-ship human/agent judgement rather than an automated invariant. Revisit if the condition is edited again, or if a third skip incident is evidenced.

## Retro-verification (THR-842 Done-when item 2)

Every `ci.yml` run on `main` between the block clearing and 2026-07-29 16:00Z was path-filtered to a skip — all fifteen were docs-only orchestrator sweeps and briefing refreshes — so no full gate run on a `main` commit existed to retro-verify `ae5990ab` / `c963671a` / `6534a3d8`. Two things fix that:

- **This PR carries `.github/workflows/ci.yml`**, a non-doc path, so the filter reports `code: true`: the PR runs the full suite, and the push-to-`main` run after merge runs it again on a `main` commit whose history contains all three unverified merges. That is the literal Done-when.
- **`workflow_dispatch` is added to `ci.yml`** so this never again requires inventing a code change. `detect`'s filter step is skipped on that event (a dispatch payload carries no diff base for paths-filter to read) and the `check` job runs unconditionally.

## Engine pillar

Engine: N/A — CI/CD workflow topology and documentation; no tick-loop, graph, or resolution surface.

## Content pillar

Content: N/A — no encounter templates, prose tables, attachments, or data tables.

## UI pillar

UI: N/A — no player-facing display, notification, DebugPanel, or HexMapV2 surface. `Browser-verify exempt: CI workflow + docs only, no runtime UI.`

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `.github/workflows/ci.yml` | N/A — CI, not the tick loop | N/A | N/A | GitHub Actions run log | `gh run view <id> --json jobs` |

No new runtime module, so `wiring-checklist.md` needs no row.

## Constants table

*No tunable numbers introduced. The workflow's existing knobs are unchanged.*

| Constant | Default | Purpose |
|----------|---------|---------|
| `timeout-minutes` (check job) | `20` | Unchanged — ceiling on a full gate run. |

## Tracing

```ts
// No runtime trace type. The CI-side equivalent is the per-job conclusion,
// read via `gh run view <id> --json jobs`. The load-bearing pair is:
interface CiGateConclusions {
  detect: 'success' | 'failure' | 'cancelled';   // the discriminator
  check: 'success' | 'failure' | 'skipped';      // skipped is only safe when detect === 'success'
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `workflow_dispatch` fired on a branch where paths-filter has no base | Filter step is skipped by `if`; `check` runs unconditionally via its `workflow_dispatch` clause. |
| `detect` job fails for any reason | `check` runs and the guard step exits 1 — fail closed, never a silent pass. |
| Actions cannot start jobs at all | Jobs record `failure` (or the check stays pending); branch protection blocks either way. |
| `check:actions` probe unreachable | Degrades to `verdict: "unknown"`, which `pull-work` Step 0.6 treats as "continue" — an unreadable probe is not a reason to refuse work. |

## Interface impact

No cross-system contract in [`Docs/canon/interface-map.md`](../canon/interface-map.md) is added, retired, or rerouted — nothing under `src/` is touched. The subsystem aliases the plan-doc lint matches here (`mark`, `item`, encounter vocabulary) appear only as prose in the incident narrative, not as surfaces this change reads or writes.

| Contract | Direction | Status | Note |
|---|---|---|---|
| — | — | N/A | CI workflow + documentation only; no runtime boundary crossed. |

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise
- [x] If it does, the Vision edit is part of this ticket's scope — no Vision surface touched

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR — N/A

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | `PASS` | No new magic numbers; the workflow's one threshold (`timeout-minutes: 20`) is unchanged and named. |
| 2. Inspectability | `PASS` | The verdict's whole point is making a skip's *cause* readable — the discriminator table names the exact job to read. |
| 3. Determinism | `PASS` | No random code. The dispatch path is unconditional by construction, not sampled. |
| 4. Fail-soft | `PASS with note` | CI deliberately fails **closed**, which is the opposite of tick-loop fail-soft — correct here: NFP #4 protects the simulation from crashing, not a merge gate from blocking. |
| 5. Narrative over mechanical perfection | `N/A` | No story surface. |
| 6. Additive over destructive | `PASS` | `workflow_dispatch` is a new trigger; the existing push/PR behaviour is byte-identical on those events. |
| 7. Performance budget | `PASS` | Zero added cost on push/PR runs — the new `if` short-circuits on a non-dispatch event. |

## Done when

- [x] The verdict on `SKIPPED` vs branch protection is recorded in a durable location and pointed at from `Docs/canon/process.md` (THR-842 item 3)
- [x] A full gate run on a `main` commit becomes reachable on demand (`workflow_dispatch`) and is produced by this PR's merge (THR-842 item 2)
- [x] `npm test` and `npx vite build` pass; types verified via `npm run check:typecheck` ratchet
- [x] Closing commit body includes `Fixes THR-842`
- [x] `Browser-verify exempt: CI workflow + docs only, no runtime UI` stated in commit body

## Coordination block

**Suggested model:** `opus` — the substance is a design call on gate topology, not a mechanical edit; advisory only, the CC automation runs Opus regardless.

**Parallel-safe with:** everything — this removes no capability and touches no `src/` file.

**Mutex with:** any issue that edits `.github/workflows/ci.yml` (single-file collision). None open at authoring time.

**Files to touch:**
- Create: `Docs/plans/2026-07-29-thr-842-skipped-required-check-verdict.md` (this doc)
- Edit: `.github/workflows/ci.yml` (add `workflow_dispatch`; bypass the path filter on that event)
- Edit: `Docs/canon/process.md` (pointer to this verdict under the coordination spec)

## Notes for the executor

- **Do not "fix" the benign skip.** Path-filtered skips on docs-only diffs are correct and load-bearing; a guard that fails closed on every skip would block the majority of this repo's merges.
- **Do not make Vercel a required check** as a second gate. That trade is already rejected in CLAUDE.md § Definition of Done — the fix for a silent stoppage is a notification path, not a new merge gate.
- The discriminator when auditing any future skip is `Detect code changes`, not the required check's own conclusion.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->

Not run. This is a recorded verdict on an already-scoped infrastructure ticket, authored in the execution lane rather than a design session, so there is no design-finalization gate for the pipeline to sit in front of.
