# THR-249 — Linear auto-close repoint to In Review + merge-gated Done

**Status:** Ready-for-Dev implementation plan
**Date:** 2026-05-16
**Author:** Cowork (keep-work-flowing scheduled task)
**Parent design:** `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 1 (canonical design rationale — read first)
**Linear issue:** THR-249
**Project:** Agent Coordination Protocol
**Suggested model:** sonnet
**Suggested executor:** Claude Code (judgment on grey zones; GitHub Action edit + Linear API integration)

---

## Why this issue exists

Rule 3 of the coordination protocol says "CC never manually transitions to Done." Today, the only enforcement is doctrine — the GitHub ↔ Linear auto-close on `Fixes THR-XX` moves the issue **In Dev → Done directly**, bypassing the `In Review` state (added 2026-04-19 for the PR-gated claude-review Action). That means a premature Done transition from CC is structurally indistinguishable from a legitimate merge-gated close.

This issue makes Rule 3 *structurally* enforceable: any `state: Done` whose history shows `In Dev → Done` without passing through `In Review` becomes a detectable anomaly.

The parent investigation doc covers the full analysis. This implementation plan is the executor handoff.

---

## Scope summary

Two changes, both required for the structural reinforcement to land:

1. **User action** — change the Threadbare team auto-close target from `Done` to `In Review` in Linear Settings → Team → Workflow.
2. **CC action** — add an `In Review → Done` transition step to `.github/workflows/claude-review.yml`. On a merged PR whose claude-review verdict is passing, the workflow calls the Linear API to transition the linked issue(s) to Done.

After both changes land, `Done` means *merged and reviewed*; the In Review hop becomes the merge-gate.

---

## Three-pillar coverage

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | Coordination-protocol infrastructure. No game-state, tick-loop, graph, or PRNG touch points. |
| Content | N/A | No encounter, prose, attachment, or data-table change. |
| UI | N/A *(in the game sense)* | No game UI surface. Linear's web UI displays the new state transitions to humans, but Threadbare's UI pillar is the in-game player-facing surface, which is untouched. |
| Wiring | YES | GitHub Action step → Linear API state-transition mutation, fired on PR-merged event with a passing review verdict. See § Implementation below. |

The Cowork docs-only merges grey zone (parent doc § Grey zones) collapses to "accept the empty In Review hop as a consistency tax" per Investigation 1's recommendation. No special case in the workflow.

---

## Blast Radius

Not applicable. The change touches `.github/workflows/claude-review.yml` and a Linear team setting. No file in `src/` is touched. Codesight pre-flight skipped per CLAUDE.md § Design workflow checklist Step 0.5 ("Skip this step entirely for process / doc-only / skill-only changes that don't touch `src/`").

---

## Implementation

### Step 1 — User action (one-time, Linear Settings)

**Performed by:** Christian (the human), in the Linear web UI. Not something CC can do via MCP.

1. Open Linear → Settings → Threadbare team → Workflow.
2. Locate the "Auto-close issues" setting (the state that GitHub `Fixes`/`Closes`/`Resolves` keywords transition issues to on merge).
3. Change the value from `Done` to `In Review`.
4. Save.

**Verification:** Open any test issue; reference it in a throwaway PR body as `Fixes THR-XXX`; merge that PR; confirm the issue lands in `In Review`, not `Done`. (Use a known-throwaway issue — do NOT exercise this on real in-flight work.)

CC's role here is documentation only — CC cannot toggle Linear team settings. Christian must perform this step. **Sequence note:** the user step must land *before* CC merges Step 2, or the Step 2 PR's own `Fixes THR-249` will skip In Review and close THR-249 directly — exactly the failure mode we are trying to eliminate. Communicate this in the PR description.

### Step 2 — CC action (workflow change)

**File:** `.github/workflows/claude-review.yml`

Add a job step that fires after the existing review job, conditional on:
- The triggering event is a `pull_request` `closed` event with `merged == true`.
- The review verdict from the upstream step is `pass`.

The step:
1. Parses the merge commit body for `Fixes THR-NNN` / `Closes THR-NNN` / `Resolves THR-NNN` references (case-insensitive, all three keywords, matching Linear's accepted set).
2. For each referenced issue ID, calls the Linear GraphQL API with an `issueUpdate` mutation setting `stateId` to the In Review → Done target.
3. Idempotent on partial failures: if the API call fails for one issue ID, log and continue with the rest; do not block the merge or mark the workflow red. The In Review state is the safe fallback — a human or Cowork can transition manually.

**Linear API auth:** Use the existing `LINEAR_API_KEY` secret already configured for the claude-review workflow (verify presence; if absent, this issue blocks on a secret-provisioning step Christian must do).

**State ID lookup:** Two options:
- (a) Hard-code the Threadbare `Done` state ID (UUID `1e6c3226-2ced-4ad0-86b9-86a00f38da64` per `list_issue_statuses`) as a workflow constant. Simple, brittle if team workflow changes.
- (b) Resolve the state ID at runtime via a `team` query → `states` field lookup by name `Done` filtered to the Threadbare team. Slightly more API calls, robust to renames.

**Recommendation:** Option (b). One extra query per merge is negligible; it eliminates a class of breakage that would silently leave issues stuck In Review forever.

### Step 3 — Audit query

Add a documented Linear query in `Docs/plans/2026-04-13-linear-coordination-protocol.md` for detecting Rule 3 violations: any issue in `state: Done` whose history transitioned directly `In Dev → Done` without passing through `In Review`.

This is run by Cowork's weekly hygiene sweep (`weekly-retro`) as a Rule 3 audit signal. Cowork docs-only issues from plan-doc-only commits are expected to skip In Review (per § Three-pillar grey zone above) — the audit query filters those out by checking that the resolving commit's diff includes at least one file under `src/`.

The audit query itself is text + a runnable snippet for the retro skill; no new infrastructure beyond updating the protocol doc.

### Step 4 — Update Rule 3 doctrine

In `Docs/plans/2026-04-13-linear-coordination-protocol.md`, append to the Rule 3 section a structural-reinforcement note: "Rule 3 is now structurally reinforced. The auto-close target is `In Review`; merges to `main` no longer reach `Done` directly. The `In Review → Done` transition is fired by the claude-review Action on a passing review of the merged commit. Any `state: Done` whose history skipped `In Review` is a Rule 3 violation, surfaced by the weekly hygiene audit."

---

## Constants table

| Name | Value | Purpose | NFP #1 |
|---|---|---|---|
| `LINEAR_API_KEY` | (existing repo secret) | Auth for Linear GraphQL mutation | PASS — existing secret, no new value to tune |
| `THREADBARE_DONE_STATE_ID` | resolved at runtime via API | Linear state UUID for terminal state | PASS — Option (b) avoids hard-coding |
| `LINEAR_KEYWORDS` | `["fixes", "closes", "resolves"]` | Recognized auto-close keywords matching Linear's accepted set | PASS — named constant |

---

## Tracing

| Trace | When emitted | Payload |
|---|---|---|
| `review-action.linear-transition.attempt` | Per issue ID detected in merge body | `{ issueId, fromState, toState }` |
| `review-action.linear-transition.success` | API call returns 200 | `{ issueId }` |
| `review-action.linear-transition.error` | API call fails | `{ issueId, errorMessage }` (non-fatal — logged, not raised) |

Traces emit to the GitHub Actions log. No new tracing infrastructure needed.

---

## Fail-soft

| Failure | Behavior | Recovery |
|---|---|---|
| Linear API rate limit hit during transition | Log error, leave issue in In Review | Human or Cowork transitions manually; weekly hygiene sweep surfaces stuck In Review issues |
| `LINEAR_API_KEY` missing or expired | Workflow step fails non-fatally; merge still lands | Human re-provisions secret; manual catch-up transitions |
| Merge body references a non-existent issue ID | API returns 404; logged and skipped | No action needed — pre-existing garbage references are already silently ignored by Linear's auto-close today |
| Linear team workflow renamed `Done` to something else | Runtime state-ID lookup returns null | Workflow step logs "Done state not found"; manual transitions until name normalized |
| Cowork docs-only merge with `Fixes` keyword | Issue lands in In Review and stays there | Accept as consistency tax per Investigation 1 grey-zone resolution; Cowork transitions to Done at next session |

---

## Acceptance criteria

- [ ] Christian has changed the Threadbare auto-close target from `Done` to `In Review` in Linear Settings → Team → Workflow.
- [ ] `.github/workflows/claude-review.yml` contains a new step that transitions referenced issues from `In Review` to `Done` on a passing review of a merged PR.
- [ ] The new step resolves the Linear `Done` state ID at runtime (Option b).
- [ ] The new step is idempotent on partial failures — one bad issue ID doesn't block the rest.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` Rule 3 section has a structural-reinforcement note appended.
- [ ] An audit query for Rule 3 violations is documented in the protocol doc.
- [ ] Verification evidence in the closing commit: link to a test merge that lands In Review then transitions to Done, plus the Linear issue history screenshot showing both transitions in order.

---

## Coordination block (for the Linear handoff comment)

- **Suggested model:** sonnet (matches `model:sonnet` label already on the issue)
- **Parallel-safe with:** THR-248, THR-406 — independent infrastructure
- **Mutex with:** THR-191 — none (different files)
- **Codex review:** no (single-file workflow edit + doc update; below review threshold)

---

## References

- Parent investigation: `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 1
- Coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Rule 3
- claude-review workflow (canonical replacement): `Docs/plans/2026-04-19-cc-review-replacement.md`
- Sibling follow-ups: THR-248 (Reopened label automation), THR-250 (stale-claim auto-release)
