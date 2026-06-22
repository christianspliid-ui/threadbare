# THR-250 — Stale-claim auto-release scheduled Action

**Date:** 2026-06-13
**Issue:** [THR-250](https://linear.app/threadbare/issue/THR-250)
**Project:** Agent Coordination Protocol
**Parent design:** `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 4

## 1. Problem

Rules 1 (claim-before-read) and 6 (WIP=1) leave a known gap: an executor session that crashes or exits without releasing leaves an issue stuck `In Dev` with a dead assignee until a human notices. No native Linear feature exists for "no activity for N hours" detection — SLAs trigger on absolute deadlines, not on "nothing has changed." A 48h gap is almost always a dead session.

## 2. Approach

Scheduled GitHub Action runs every 12h, divided into two passes that share a workflow artifact:

1. **Detection pass.** Query Linear for issues in `state: In Dev` whose `updatedAt < now - STALE_THRESHOLD_HOURS (48h)` and which lack the `Parked` label. For each match: post a warning comment naming the cutoff date and append the issue ID + first-seen timestamp to the tracked-list artifact.
2. **Grace check pass.** For each issue in the tracked-list artifact whose first-seen timestamp is older than `GRACE_PERIOD_HOURS (24h)`: re-query Linear. If a comment, commit reference, or state change arrived during the grace window, drop the entry. Otherwise transition state to `Ready for Dev`, clear `assignee`, and drop the entry. The existing Reopened-label automation (Investigation 3) then handles the label.

The two passes execute in the same workflow run; the artifact is the only persistence layer. A dry-run input flag suppresses all writes (no comments, no state changes) and emits a structured plan to logs for verification.

## 3. Three-pillar compliance

- **Engine:** N/A — purely external workflow infrastructure; no game-state or tick-loop surface.
- **Content:** N/A — no encounter, prose, attachment, or world-data changes.
- **UI:** N/A — the only visible artifact is Linear comments and state transitions, which surface through Linear's native UI (chosen instead of a custom dashboard).
- **Wiring:** GitHub Action → Linear GraphQL API. Outputs visible in Linear (comments + state history) and in the Action's workflow logs. Existing `Reopened`-label Automation chains off the state transition. No code in `src/`.

## 4. File surface

| Path | Action | Notes |
|------|--------|-------|
| `.github/workflows/stale-claim-sweep.yml` | new | Cron `0 */12 * * *` + `workflow_dispatch` with `dry_run` boolean input. Models `linear-autoclose.yml` and `drift-scan.yml`. |
| `scripts/stale-claim-sweep/index.ts` | new | TypeScript entrypoint (run via `node --experimental-strip-types`). Reuses `scripts/drift-scan/linear.ts` `linearGql` helper. |
| `scripts/stale-claim-sweep/constants.ts` | new | Named constants table (see §6). |
| `scripts/drift-scan/linear.ts` | edit (additive) | Export `linearGql` if not already (verify on read; if already exported, no edit). |
| `Docs/plans/2026-04-13-linear-coordination-protocol.md` | edit | Add a short subsection under "Workflow states" naming the sweep cadence, the `Parked` label convention, and the warning-then-release flow. |
| Linear workspace | manual step | Create `Parked` label in the Threadbare team. CC documents this in the closing comment if it isn't already present at runtime — the script auto-creates if missing, following the pattern in `scripts/drift-scan/linear.ts:ensureDriftScanLabelId`. |

## 5. Algorithm detail

```
async function sweep(opts: { dryRun: boolean }) {
  const trackedList = readArtifact() // {issueId, firstSeenAt}[]
  const now = Date.now()

  // ---- Detection pass ----
  const staleIssues = await listInDevStale(STALE_THRESHOLD_HOURS)
  for (const issue of staleIssues) {
    if (hasParkedLabel(issue)) continue
    if (trackedList.find((t) => t.issueId === issue.id)) continue // already warned
    if (!opts.dryRun) await postWarningComment(issue.id, now)
    trackedList.push({ issueId: issue.id, firstSeenAt: now })
  }

  // ---- Grace check pass ----
  const survivors: TrackedEntry[] = []
  for (const entry of trackedList) {
    const ageMs = now - entry.firstSeenAt
    if (ageMs < GRACE_PERIOD_HOURS * HOUR_MS) {
      survivors.push(entry) // not yet eligible
      continue
    }
    const fresh = await getIssue(entry.issueId)
    if (hasActivitySince(fresh, entry.firstSeenAt)) continue // drop, false alarm
    if (fresh.state.name !== "In Dev") continue // someone else handled it
    if (!opts.dryRun) await releaseClaim(fresh.id) // state:"Ready for Dev", assignee:null
  }

  writeArtifact(survivors)
}
```

`hasActivitySince` checks three signals: (a) a comment with `createdAt > firstSeenAt`, (b) any state change in the issue's `history` since `firstSeenAt`, (c) any commit message in the linked Git history that contains the issue identifier (queried via Linear's `attachments` connection, which surfaces auto-linked PRs/commits). Any one signal = drop the entry.

## 6. Constants (NFP #1)

| Constant | Default | Where | Purpose |
|----------|---------|-------|---------|
| `STALE_THRESHOLD_HOURS` | 48 | `scripts/stale-claim-sweep/constants.ts` | Age in hours before an `In Dev` issue earns a warning |
| `GRACE_PERIOD_HOURS` | 24 | `scripts/stale-claim-sweep/constants.ts` | Time between warning and auto-release |
| `SWEEP_CRON` | `0 */12 * * *` | workflow YAML | Twice-daily run cadence |
| `PARKED_LABEL_NAME` | `Parked` | `scripts/stale-claim-sweep/constants.ts` | Opt-out label for intentional WIP parking |
| `WARNING_COMMENT_TEMPLATE` | template literal | `constants.ts` | Comment body; takes `{lastActivity}` + `{releaseAt}` |
| `MAX_ISSUES_PER_RUN` | 50 | `constants.ts` | Hard cap to avoid runaway loops on Linear API surprises |
| `LINEAR_TEAM_KEY` | `THR` | `constants.ts` | Scope sweep to Threadbare team only |
| `LINEAR_API_URL` | `https://api.linear.app/graphql` | reused from `scripts/drift-scan/linear.ts` | Single point of API config |

Every threshold tunable without touching logic — change a number, redeploy, done.

## 7. Tracing (NFP #2)

The sweep emits structured JSON log lines, one per decision:

```ts
type SweepTrace =
  | { kind: "scan-start"; dryRun: boolean; now: string }
  | { kind: "candidate-found"; issueId: string; updatedAt: string; ageHours: number }
  | { kind: "warning-posted"; issueId: string; firstSeenAt: string }
  | { kind: "skip-parked"; issueId: string }
  | { kind: "skip-already-tracked"; issueId: string }
  | { kind: "grace-dropped"; issueId: string; reason: "activity" | "state-change" | "manual-release" }
  | { kind: "released"; issueId: string; previousAssignee: string | null }
  | { kind: "dry-run-would"; action: "comment" | "release"; issueId: string }
  | { kind: "scan-end"; warnedCount: number; releasedCount: number; trackedSurvivors: number }
```

The Action workflow log is the inspection surface (no separate trace storage required). Operators reconstruct any sweep by reading one workflow run's log.

## 8. Fail-soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| Linear API returns HTTP 5xx during list | Log error trace, set workflow step status to "warning" but continue; tracked-list artifact is unchanged so the next run retries. |
| Linear API returns HTTP 5xx during mutation | Log error; do **not** delete the tracked-list entry; the next run retries the release. |
| Artifact restore-keys returns nothing (first run, or expiry) | Treat tracked-list as empty; detection pass populates afresh; nobody is wrongly released because grace check requires a tracked entry to act. |
| `Parked` label doesn't exist | Auto-create via `ensureLabel(PARKED_LABEL_NAME)` following the `ensureDriftScanLabelId` pattern. Idempotent. |
| Dry-run flag missing/garbled | Default to `dryRun = true` (refuse to write on ambiguity). |
| `LINEAR_API_KEY` secret missing | Log error and exit 1 (Action surfaces the failure, no silent no-op — operator must see it). |
| Issue moved out of `In Dev` between warning and grace check | Detected during grace re-query (`fresh.state.name !== "In Dev"`); entry dropped, no action. |
| Activity arrived during grace window | Detected via `hasActivitySince`; entry dropped, no release. |

## 9. NFP compliance

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | All thresholds in `constants.ts`; cron tunable in YAML; no magic numbers in algorithm. |
| 2 | Inspectability | PASS | Structured trace lines per decision; Linear comment history shows the warning chain; release transition shows in issue history. |
| 3 | Determinism | PASS (n/a strict) | No PRNG. Behavior is deterministic given Linear's current state at run time. |
| 4 | Fail-soft | PASS | See §8 table; the sweep loop cannot crash the executor pipeline (Action runs in isolation). |
| 5 | Narrative over mechanical | N/A | Infrastructure issue; no narrative surface. |
| 6 | Additive | PASS | Adds a new workflow + new scripts directory + `Parked` label. Existing rules and workflows unchanged. |
| 7 | Performance budget | PASS | Two API queries per run baseline + one per stale issue (capped at `MAX_ISSUES_PER_RUN = 50`). Twice daily, well under any rate limit. |

## 10. Acceptance criteria (Definition of Done)

- [ ] `.github/workflows/stale-claim-sweep.yml` exists, runs on `cron: "0 */12 * * *"` and on `workflow_dispatch` with `dry_run` boolean input.
- [ ] `scripts/stale-claim-sweep/{index.ts,constants.ts}` exist; index entrypoint runs cleanly via `node --experimental-strip-types`.
- [ ] `Parked` label is created in the Threadbare team (either manually or by the script's auto-create path).
- [ ] **Dry-run verification:** trigger `workflow_dispatch` with `dry_run: true`; the workflow logs every action it *would* take without writing. Paste the run URL or last ~20 log lines in the closing commit body.
- [ ] **Wet-run smoke:** intentionally claim a throwaway issue via `save_issue` with `assignee: "me"` and `state: "In Dev"`. Manually rewind `updatedAt` is not possible; instead, temporarily lower `STALE_THRESHOLD_HOURS` to `0.1` in a feature-branch deploy, run once, then revert. Confirm the warning comment lands. Run a second time after `GRACE_PERIOD_HOURS = 0.1` and confirm the release lands. Restore defaults before commit.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` is updated with: (a) one paragraph under "Workflow states" naming the sweep cadence and behavior, (b) a `Parked` label convention note.
- [ ] Pre-commit: `npm test`, `npx tsc --noEmit`, `npx vite build` all green. Paste raw output in closing commit body (or link a green CI run).
- [ ] No engine smoke required — change touches no `src/engine/**`, no tick loop, no graph types.
- [ ] No browser-verify required — `Browser-verify exempt: infrastructure (GitHub Action + Node script), no UI surface`.

## 11. Out of scope

- A separate dashboard for sweep history (Linear comments + Action logs suffice for v1).
- Webhook-based replacement (cron is the right shape until rate limits or volume force a change).
- Cross-team coordination (Threadbare team only; `LINEAR_TEAM_KEY` is named so it can be widened later).
- The `Reopened` label automation itself — separate Investigation 3 ticket; this sweep deliberately relies on it but doesn't ship it.
- Auto-pinging the original assignee (Linear's native "you were unassigned" notification is sufficient).

## 12. Blast radius

No `src/` files touched. New scripts directory + new workflow YAML + one doc edit. Independent of game engine, content pipelines, and UI. Blast radius: zero importers. **Blast Radius section not required.**

## 13. Coordination block (for handoff comment)

- **Suggested model:** sonnet — mechanical workflow + Linear GraphQL plumbing; pattern-matches existing `linear-autoclose.yml` and `scripts/drift-scan/`.
- **Parallel-safe with:** any issue that does not touch `.github/workflows/`, `scripts/drift-scan/linear.ts`, or `Docs/plans/2026-04-13-linear-coordination-protocol.md`.
- **Mutex with:** any concurrent edit to `scripts/drift-scan/linear.ts` (shared helper, additive edit) or to the coordination protocol doc.

## 14. References

- `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 4 — original analysis and rationale.
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — Rules 1, 6, 7; workflow states.
- `.github/workflows/linear-autoclose.yml` — pattern model for inline `github-script` + Linear GraphQL.
- `.github/workflows/drift-scan.yml` — pattern model for cron + artifact persistence + Node TypeScript entrypoint.
- `scripts/drift-scan/linear.ts` — `linearGql` helper to reuse; `ensureDriftScanLabelId` as the auto-create label pattern.
- THR-164, THR-260 — upstream context.
