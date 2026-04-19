# CC Review Replacement — Design Doc

**Issue:** THR-182 (Agent Coordination Protocol project)
**Siblings:** THR-181 (retired inline Codex review — Rule 8 ratification, Done), THR-164 (Linear workflow hardening — In Review state, default filter, Reopened automation)
**Date:** 2026-04-19
**Author:** Cowork
**State target:** Ready for Dev

---

## Problem Statement

On 2026-04-18 the inline Codex review step was retired after CC sessions stalled on `/codex:review` at roughly a 50% rate. Rule 8 of the coordination protocol now reads *"Codex is read-only — CC must never invoke codex commands that modify code."* That ratifies the doctrinal bright line, but it leaves a review-shaped hole in the pipeline: CC now commits and pushes directly to its own feature branches with no automated structural check before merge to `main`.

The hole has three distinct costs:

1. **Defect escape.** Type errors, obvious regressions, and NFP violations that a reviewer would have caught now land on `main` until someone notices. CI (typecheck + test + build) catches compilable failures but not structural or design-quality ones.
2. **No paper trail.** There is no artifact saying "this change was reviewed and found acceptable." Retrospectives cannot reconstruct *why* a change looked acceptable at the time.
3. **Invariant drift.** Rule 8 itself is a doctrinal claim. Without a structural enforcement mechanism, a well-intentioned agent can reintroduce a write-capable review path (for example, a "review plus autofix" helper) without tripping any guardrail.

THR-182 asks: what should replace the inline Codex review? The design options on the table are (a) a hardened heartbeat loop around the existing Codex client, (b) a PR-gated GitHub Action that runs review outside the CC session, or (c) both in sequence. This doc picks (c) and specifies both halves.

## Recommendation

**Both in sequence.** Ship the near-term heartbeat hardening this week as a stopgap; ship the medium-term PR-gated Action as the permanent answer once branch protection is available (GitHub Pro is the prerequisite tracked on the Known Sandbox Limitations note).

Why both, not one or the other:

- **Near-term alone is not enough.** Hardening the in-session review loop keeps review *inside* the CC agent, which is exactly the topology that failed 50% of the time. Better timeouts buy reliability, not structural safety. A single agent can still decide to bypass review on its own.
- **Medium-term alone is too slow.** Branch protection requires GitHub Pro, which is not yet in place. Waiting for that to land before any review runs means weeks of unreviewed merges to `main`. The cost of the gap is higher than the cost of a transitional mechanism.
- **Sequenced, they compose.** The near-term heartbeat gives us review-quality findings today with a known failure mode (timeout → skip with logged rationale). The medium-term Action upgrades the enforcement surface from "CC chose to run it" to "the repo refuses the merge without it," and the near-term surface can be retired the day the Action goes live.

Routing: regardless of which surface runs the review, not every PR needs the same depth. Introduce two labels — `review:required` (blocks merge until Action approves, or in the near term, blocks push until heartbeat returns) and `review:sample` (optional; agent runs review for training data but does not block). Default: `required` for engine, types, HexMapV2, orchestrator, and prose pipeline surfaces; `sample` for docs, tests, fixtures, and non-executing content.

## Three-Pillar Analysis

**Engine: N/A.** This change does not touch `src/engine/` or the tick loop. No graph nodes, no new edge types, no tick-phase changes.

**Content: N/A.** No prose tables, encounter templates, attachment content, or world-model data are affected. (The plan doc itself is content in the repo's `Docs/plans/` sense, but that's documentation, not game content.)

**UI: YES.** Three surfaces are affected and must be designed, not stubbed:

- **CC in-session heartbeat display.** While the review is running, CC must emit a visible progress signal (heartbeat every 60s with elapsed time, current sub-step, and cancel hint). The user sees this in the CC terminal output. If the signal stops for >60s past the last heartbeat, the wrapper times out and surfaces a structured failure block — not a hang.
- **PR check status on GitHub.** The medium-term Action surfaces a named check (`claude-review / structural`) with pass/fail/neutral states and a link to the full review artifact. This is the user's primary interface to the review outside the CC session.
- **Linear handoff annotation.** When a CC session finishes and the review passed, the completion comment on the Linear issue must include a one-line summary pointing at the review artifact (commit sha + check URL). This is how the user audits "was this actually reviewed?" without opening GitHub.

## Near-Term Design: Hardened Heartbeat Loop

### Prompt spec

The review invocation stays inside the CC session. CC runs a tool wrapper (not `/codex:review` directly) that:

1. Starts the Codex review subprocess with a 10-minute hard wall-clock timeout.
2. Requires the subprocess to emit a heartbeat line on stdout at least every 60 seconds (`{"heartbeat": true, "elapsed_s": N, "step": "..."}`).
3. If a heartbeat is missed by more than 60 seconds past schedule, the wrapper SIGTERMs the subprocess, waits 10 seconds, then SIGKILLs if still alive.
4. On clean exit: return the review artifact (JSON findings + markdown summary) to CC.
5. On timeout or any non-zero exit: return a structured failure object with `{ reason, last_heartbeat_at, elapsed_s, partial_output_path }` and log it to `Docs/impediments.md` via the impediment-reporter skill.

### Cancellation flow

User can cancel via the CC session's own cancellation mechanism (Ctrl-C or equivalent). The wrapper traps SIGINT, forwards SIGTERM to the subprocess, waits 5 seconds, SIGKILLs. Partial output is preserved at `.cowork/review-partial/<timestamp>.log` for post-mortem.

### Ten-minute timeout rationale

Observed 2026-04-18 stalls clustered at 90s–300s with a long tail past 8 minutes. A 10-minute cap covers the long tail without letting the agent sit indefinitely. The 60s heartbeat cadence means we detect silent death within one heartbeat interval — the timeout is a backstop, not the primary signal.

### Failure-mode catalog

| Failure | Detection | Wrapper response | CC response |
|---|---|---|---|
| Heartbeat missed | `now - last_heartbeat > 60s` | SIGTERM → SIGKILL, emit structured failure | Log impediment, skip review with `review:skipped:heartbeat` commit trailer, continue to merge if CI green |
| Hard wall-clock hit | `elapsed_s > 600` | Same as above, different reason code | Same |
| Non-zero exit with output | Subprocess exits | Return partial findings + exit code | Treat as "review ran but inconclusive" — CC decides whether to address findings or flag for human |
| User cancelled | SIGINT received | Graceful shutdown | No commit; session ends |
| Wrapper crash | Uncaught exception in wrapper | N/A — crash | CC notices missing return value, logs impediment, skips review with `review:skipped:wrapper-crash` |

### What this surface does NOT enforce

It does not prevent CC from simply not running the wrapper. It does not prevent a merge-to-main. Those are medium-term concerns.

## Medium-Term Design: PR-Gated GitHub Action

### Trigger

`pull_request` events of type `opened`, `synchronize`, `reopened`, and `ready_for_review`. Draft PRs are ignored (the Action reports neutral until the PR is marked ready).

### Scope

The Action runs a **read-only** review — Rule 8 preservation is structural, not just policy. Enforcement mechanisms:

- The Action's `GITHUB_TOKEN` has `contents: read`, `pull-requests: write` (for posting the review comment), `checks: write` (for the check run), and `issues: read`. No `contents: write`, no `packages: write`, no workflow-edit rights.
- The Action does not check out with write credentials. It uses `actions/checkout@v4` with `persist-credentials: false`.
- The review client itself is forbidden from running with a token that can push. This is asserted in the Action YAML and verified at startup — if the client detects a push-capable token in its environment, it aborts.

### Minimal Action skeleton

Location: `.github/workflows/claude-review.yml`. The Action's job does four things: check the PR's label set (`review:required` vs `review:sample` vs neither), if `required` or unset-and-risky-surface run the review, post the findings as a PR review comment + check run, and exit with status corresponding to the review verdict (blocking check fails on "major findings," neutral on "minor/none," skipped-with-rationale on `review:sample`).

The job is a thin wrapper around an `anthropics/claude-review-action` composite step (not yet built — creating it is part of the implementation work). The composite step encapsulates the token-scope check, artifact upload, and findings rendering.

### Credential scoping for structural Rule 8

The review runs against a shallow clone of the PR head. The clone is read-only. The review client's network allowlist is restricted to the Anthropic API endpoint only — no git remotes, no package registries. This prevents a prompt-injection-driven client from exfiltrating or tampering.

### Branch-protection prereqs

Before the Action becomes a hard gate:

1. GitHub Pro must be active on the org (tracked in Known Sandbox Limitations — "Branch protection (required before merge) is pending GitHub Pro").
2. `main` branch protection rule enabled with "Require status checks to pass before merging" and `claude-review / structural` in the required-checks list.
3. "Require branches to be up to date before merging" enabled to prevent stale-base bypass.
4. Admin bypass disabled, or at minimum logged.

Until all four are in place, the Action runs in advisory mode (posts findings, does not block). The label-driven routing still applies — `review:required` PRs get a visible failing check even when the check is not yet required by branch protection, so the gap is legible.

### Interaction with In Review state (THR-164)

THR-164 proposes an `In Review` Linear state between `In Dev` and `Done`. That state is orthogonal to this doc's review mechanism but aligns well:

- When CC pushes a PR with `review:required`, it moves the Linear issue from `In Dev` to `In Review`.
- The Action's check-run URL is posted as a comment on the Linear issue.
- On merge to `main` (which auto-closes via `Fixes THR-XX`), the issue moves from `In Review` directly to `Done`.
- On a failing Action, the issue stays in `In Review` — the `Done` auto-close only fires from merge, and the merge is blocked by the failing check.

If THR-164 has not landed by the time this Action ships, skip the In Review transition — the flow degrades gracefully to the existing `In Dev` → `Done` path.

## Constants Table

| Constant | Default | Purpose | Location |
|---|---|---|---|
| `REVIEW_WALL_CLOCK_TIMEOUT_SEC` | 600 | Hard cap on in-session review runtime | Heartbeat wrapper config |
| `REVIEW_HEARTBEAT_INTERVAL_SEC` | 60 | Max gap between heartbeats before timeout trip | Heartbeat wrapper config |
| `REVIEW_SIGTERM_GRACE_SEC` | 10 | Time between SIGTERM and SIGKILL | Heartbeat wrapper config |
| `REVIEW_CANCEL_GRACE_SEC` | 5 | Time between SIGINT forwarding and SIGKILL on user cancel | Heartbeat wrapper config |
| `REVIEW_ACTION_BLOCKING` | `false` → `true` on GitHub Pro | Whether the Action fails the check (vs neutral) on major findings | Action YAML env |
| `REVIEW_ACTION_LABEL_REQUIRED` | `review:required` | Label name for gated review | Action YAML env |
| `REVIEW_ACTION_LABEL_SAMPLE` | `review:sample` | Label name for advisory review | Action YAML env |
| `REVIEW_RISKY_SURFACES` | `src/engine/**,src/types/**,src/components/HexMapV2/**,src/engine/orchestrator*.ts,src/prose/**` | Paths that default to `required` when no label set | Action YAML env |

## Tracing

The review surface is a wrapper, not part of the engine tick loop, so it does not emit engine traces. Instead it writes to two structured logs:

**In-session (near-term):**

```typescript
interface ReviewWrapperTrace {
  type: 'review-wrapper';
  wrapperVersion: string;
  started_at: string; // ISO
  ended_at: string;
  outcome: 'clean' | 'heartbeat-timeout' | 'wall-clock-timeout' | 'nonzero-exit' | 'user-cancel' | 'wrapper-crash';
  exit_code: number | null;
  elapsed_s: number;
  last_heartbeat_at: string | null;
  heartbeat_count: number;
  partial_output_path: string | null;
  findings_path: string | null;
  commit_trailer: string | null; // e.g. "review:ok", "review:skipped:heartbeat"
}
```

**Action (medium-term):**

```typescript
interface ReviewActionTrace {
  type: 'review-action';
  actionVersion: string;
  pr_number: number;
  head_sha: string;
  labels: string[];
  gated: boolean; // true if required for merge
  verdict: 'none' | 'minor' | 'major' | 'skipped' | 'error';
  findings_count: number;
  check_run_url: string;
  elapsed_s: number;
}
```

Both log shapes are persisted under `.cowork/review-traces/` (in-session) and uploaded as Action artifacts (medium-term). Retention: 30 days locally, 90 days on GitHub.

## Fail-Soft Table

| Failure | Fallback | Rationale |
|---|---|---|
| Heartbeat missed (near-term) | Skip review, log impediment, commit trailer records skip reason | A flaky review is worse than a skipped review with a paper trail. Trailer makes the skip auditable. |
| Wall-clock timeout (near-term) | Same as heartbeat missed, different reason code | Same rationale; both are "review did not complete." |
| Action API unreachable (medium-term) | Neutral check result (not failing), retry up to 3x with exponential backoff, final attempt logs "review unavailable" | Do not block a PR on infrastructure. Neutral result is visible; the user or CC can decide to retry. |
| Label missing on risky surface (medium-term) | Action runs anyway with `required` semantics and posts a comment requesting the label be set | Default-secure; avoids silent review skips on surfaces that matter. |
| Branch-protection not yet enabled | Action runs in advisory mode — posts findings, check is informational only | Lets the mechanism run and produce signal before it is enforcing, so we catch bugs in the Action itself while the cost of a miss is low. |
| Rule 8 violation detected (e.g., token with push scope) | Action aborts with an explicit error, posts a comment tagging the coordination-protocol owner, does not post a review | Structural invariant. Better to be visibly broken than silently permissive. |

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All timeouts, cadences, label names, and risky-surface globs are named constants in a config surface (Action YAML env + wrapper config). Changing review aggressiveness is a config edit, not a code change. |
| 2. Inspectability | PASS | Structured traces on both surfaces; Action artifacts persisted 90d; Linear completion comment links to the check run. The user can answer "was this reviewed, by what, with what finding?" in one click. |
| 3. Determinism | PASS with note | The review client itself is not deterministic (it's an LLM). The *wrapper* around it is — given the same subprocess behavior, the wrapper always produces the same trace shape and outcome classification. That is the determinism guarantee this layer offers. |
| 4. Fail-soft | PASS | Fail-soft table above enumerates every failure and its fallback; no failure mode produces an unrecoverable state. The Action's "abort on Rule 8 violation" is deliberately loud-fail because silent fallback there would defeat the invariant. |
| 5. Narrative over mechanical | PASS (N/A) | No in-game narrative surface. The closest analogue is the commit trailer and check-run comment, which are engineered for human readability (plain English verdict + findings) over machine parsing. |
| 6. Additive over destructive | PASS | Near-term wrapper is new code alongside existing Codex client; no existing behavior removed. Medium-term Action is a new workflow file; branch protection change is additive config. The inline `/codex:review` command is already retired (THR-181) — this doc does not reintroduce it. |
| 7. Performance budget | PASS | In-session: 10-min cap is a hard ceiling, heartbeat cadence is sub-second overhead. Action: runs on GitHub's runners, not the developer's machine; PR feedback latency target is <5min for a typical diff, acceptable for a gate. |

## Wiring Checklist

Per `Docs/plans/wiring-checklist.md`:

- [ ] Near-term heartbeat wrapper module and its CLI entry point live under `scripts/review/` (new directory).
- [ ] Wrapper is callable from CC sessions via a documented slash command replacement (name TBD during implementation — suggest `/review:run` to parallel the retired `/codex:review`).
- [ ] Commit trailers (`review:ok`, `review:skipped:<reason>`) documented in `Docs/plans/2026-04-13-linear-coordination-protocol.md` alongside `Fixes THR-XX`.
- [ ] Action workflow at `.github/workflows/claude-review.yml` with the composite step (composite lives in the same repo for v1; extract to a published action only if we need it in multiple repos).
- [ ] Labels `review:required` and `review:sample` created in the Linear team label surface AND as GitHub PR labels (both are needed — Linear for issue triage, GitHub for the Action to read).
- [ ] Wiring checklist updated: add "Review wrapper trace" and "Review action trace" to the trace categories table.
- [ ] CLAUDE.md updated: the Rule 8 section gets a "See also: CC review replacement at Docs/plans/2026-04-19-cc-review-replacement.md" reference.
- [ ] Known Sandbox Limitations note updated: the "Branch protection (required before merge) is pending GitHub Pro" line gets a back-pointer to this doc.

## Open Questions for CC

1. **Wrapper implementation language.** Node/TS to match the repo? Or a standalone shell script since it's just process supervision? Preference: TypeScript for type-checked trace shapes, but a well-commented bash wrapper would also work. **CC's call.**
2. **Slash command name.** `/review:run`, `/review:structural`, `/cc:review` — naming is bikeshed but commit the choice to the coordination protocol doc.
3. **Composite action host repo.** Keep the composite step in this repo or publish to an `anthropics/` repo? Keep in-repo for v1 is the default; flag if there's a reason to split.
4. **Label defaults for existing open PRs.** Apply `review:sample` to every open PR on first deploy of the Action, or leave them unlabeled and let the risky-surface default fire? Default: leave unlabeled; risky-surface logic handles it.
5. **Action concurrency.** If multiple pushes land in quick succession, should the Action debounce (cancel-in-progress the superseded runs) or let them race? Default: `concurrency: pr-${{ github.event.pull_request.number }}` with `cancel-in-progress: true`.

None of these block implementation. CC should pick defaults, note the choice in the first commit, and open a follow-up Linear issue if any turn out to matter.

## Acceptance Criteria

A CC session can close this issue when:

1. The near-term wrapper is committed, callable, and has been exercised once end-to-end on a sample diff (heartbeat emitted, clean exit observed, trace written).
2. The near-term wrapper has been exercised once on a deliberately-stalled subprocess (sleep 700s) to verify the 600s wall-clock timeout and the structured failure path.
3. The medium-term Action workflow file is committed and visible in the Actions tab on a test PR. Advisory mode is acceptable for initial ship; blocking mode is blocked on GitHub Pro and tracked as a follow-up.
4. Labels `review:required` and `review:sample` exist in both Linear and GitHub.
5. The coordination protocol doc, CLAUDE.md, and wiring checklist are updated per the Wiring Checklist section above.
6. A Linear follow-up issue exists for "flip Action to blocking once GitHub Pro lands" and is labeled `Deferral` on the Agent Coordination Protocol project.
7. The closing commit message body contains `Fixes THR-182`.
