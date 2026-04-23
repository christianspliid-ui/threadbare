# Linear Workflow Hardening — Structural Enforcement of Coordination Rules

**Issue:** THR-164 (Agent Coordination Protocol project)
**Siblings:** THR-182 (CC review replacement — shipped 2026-04-19), THR-246 (Linear MCP rate-limit relief — Ready for Codex)
**Date:** 2026-04-23
**Author:** Cowork
**State target:** Ready for Dev (plan-doc commit handoff)

---

## Problem Statement

The seven-rule hardening in `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Coordination Failure Modes closes two concrete failure modes via agent discipline:

1. **Duplicate work** — two agents started the same ticket because neither claimed first.
2. **Premature close of a reopened issue** — CC saw a reopened Ready-for-Dev issue, inferred it was a mistake, and manually moved it to Done without investigating.

The rules as written rely on agents following them. This plan investigates five candidate Linear / tooling changes that could make the same guarantees **structurally**, so an agent that forgets a rule cannot produce the failure mode. Each candidate gets a ship / skip / deeper-research verdict, and follow-up issues are filed for each "ship."

**Scope of this doc.** Research and recommendation only. Each "ship" produces a separate implementation ticket. No code lands from this doc — the deliverable is this markdown file + the follow-up issues it creates.

## Summary Verdict Table

| # | Investigation | Verdict | Follow-up | Rule(s) retired or softened |
|---|---------------|---------|-----------|----------------------------|
| 1 | In Review state between In Dev and Done | **SHIP (partial)** — state exists; wire the auto-close target | New follow-up issue | Rule 3 becomes *structurally harder* to violate |
| 2 | Default team filter: Ready for Dev excludes claimed | **SKIP** | — | Rule 2 stays agent-side; MCP already honors explicit filters |
| 3 | Automation for `Reopened` label on backward transitions | **SHIP** — native Linear Automations | New follow-up issue | Rule 5 application becomes automatic |
| 4 | Stale-claim auto-release | **SHIP** — external cron (not native) | New follow-up issue | Adds safety net for Rule 1 / Rule 6 session-death edge |
| 5 | Claim-before-read wrapper (`pull-work` skill enhancement) | **SHIP** — thin skill wrapper | New follow-up issue | Rule 1 + Rule 7 bundle into one atomic skill call |

**Recommended implementation order:** 5 → 3 → 1 → 4. Rationale at the bottom of the doc.

---

## Investigation 1 — "In Review" state between In Dev and Done

### Current situation

The `In Review` state **already exists** in the Threadbare team workflow as state #8, added 2026-04-19 alongside the PR-gated CC review Action (`Docs/plans/2026-04-19-cc-review-replacement.md`). The protocol doc lists nine workflow states with In Review between In Dev and Done.

But the auto-close wiring is unchanged: `Fixes THR-XX` in a commit body that lands on `main` moves the issue directly from In Dev → Done. In Review is used for PRs under structural review via `.github/workflows/claude-review.yml` — but the terminal state transition on merge still bypasses it. Rule 3 is still enforced by doctrine, not structure.

### Analysis

**What Linear's auto-close actually targets.** The GitHub ↔ Linear integration's `Fixes` keyword moves the issue to the team's *configured completion state*, which defaults to Done. Linear's team settings expose this as a per-team dropdown ("Auto-close state") with any state in category `Completed` or `Started` as selectable. Setting it to In Review would make `Fixes THR-XX` on merge transition to In Review, not Done, leaving the final In Review → Done transition explicit.

**Who then moves In Review → Done?** Options:
- (a) The claude-review Action: on successful review pass + merge, it calls Linear's API to transition In Review → Done. This keeps the merge-gated invariant ("Done means shipped AND reviewed") structural.
- (b) A human: Cowork or user transitions manually after spot-checking.
- (c) A second GitHub Action (deploy-succeeded): on the next Vercel deploy, transition any In Review issues whose `Fixes` commit shipped to Done.

### Recommendation

**SHIP (partial).** The state already exists; repoint the auto-close target from Done → In Review in team settings (user action, Linear UI), and add an Action step that transitions In Review → Done when the review check passes on a merged PR (option a). This makes Rule 3 *structurally* harder to violate: CC can still call `save_issue(state: "Done")` but doing so would skip In Review entirely, which becomes an anomaly visible in list view and easy to alert on.

**What Rule 3 becomes.** Rule 3 keeps its current wording but is reinforced: any issue with `state: Done` whose history shows In Dev → Done without passing through In Review is a hard violation that can be detected by a scheduled audit query. Cowork's weekly hygiene sweep can run that query.

**Known grey zones.**
- If Cowork transitions plan-doc-only issues (like THR-164 itself) directly, they also skip In Review. That's intentional — Cowork's plan-doc issues aren't subject to code review. The audit query filters by issue kind: `assignee != cowork` at close time, or `labels` don't include a `docs-only` marker. Needs disambiguation during implementation.
- The auto-close target change affects *every* merge on the repo immediately. Back-out path: revert the team setting if it creates unexpected friction.

### Follow-up ticket

`Linear auto-close repoint + In Review → Done merge wiring` — file under Agent Coordination Protocol, priority Medium, suggested model sonnet. See "Follow-up issues" section at bottom.

---

## Investigation 2 — Default team filter: Ready for Dev excludes claimed

### Analysis

**Linear's team default view.** Linear Settings → Team → Views supports saved views with filters. These work in the Linear UI. The MCP does **not** respect team default views — each `list_issues` call is evaluated against its own `filter` parameter, so a team default that says `state:"Ready for Dev" AND assignee:null` is invisible to MCP callers. Agents already pass `assignee:null` explicitly per Rule 2, and they must continue to.

**The human side.** A default team view *does* help humans browsing the Linear UI avoid accidentally claiming work that another agent already owns. But agents are the failure mode Rule 2 was designed to prevent, and Rule 2 already lives in each agent's pull query.

### Recommendation

**SKIP.** The MCP is the enforcement surface that matters, and the MCP already honors explicit filter params. Rule 2 stays as-is. Optional nice-to-have: the user can set a Ready-for-Dev team view in the UI for their own browsing, but that's orthogonal to coordination and doesn't need an issue.

---

## Investigation 3 — Automation for `Reopened` label on backward transitions

### Analysis

**Linear Automations (Linear Standard tier+).** Linear exposes an Automations builder that supports:
- **Triggers:** state changes, label changes, assignment changes, comment creation, SLA breaches.
- **Conditions:** field equals/not-equals, label contains, priority greater-than, etc.
- **Actions:** add label, remove label, set priority, post comment, notify user, create sub-issue.

Rule 5 wants: "when an issue moves from a completion-category state (Done) back to a started-category state (Ready for Dev), apply the `Reopened` label."

This is directly expressible as a native Automation:
```
TRIGGER: Issue state changed
CONDITION: previous state category = "Completed" AND new state category = "Started"
ACTION 1: Add label "Reopened"
ACTION 2: Post comment "This issue was reopened on {now} by {actor}. Read the latest comment for the cleanup brief."
```

**Edge case — backward transitions that aren't reopens.** An issue that moves Ready for Dev → In Design (CC bouncing back to Cowork) is technically backward but not a "reopen." The automation's condition should only match when the *previous* state is in the Completed category, not any backward move. Linear Automations support `previous state category` as a condition field.

**Edge case — human vs agent reopens.** If a human moves Done → Ready for Dev intentionally, they want the label applied. If CC does it erroneously (Rule 3 violation), the label still applies and makes the violation more visible, not less. Both cases want the label.

### Recommendation

**SHIP.** Native Linear Automation. User action: configure the automation in Linear Settings → Automations → New Rule. No code, no external service needed. Rule 5 becomes automatic — agents no longer need to remember to label, only to read the label.

**Fallback if Linear tier is below Standard.** GitHub Action scheduled cron polling Linear API for state transitions; heavier, only do this if native automations are unavailable.

### Follow-up ticket

`Linear Automation — apply Reopened label on Done → Started transitions` — file under Agent Coordination Protocol, priority Medium, suggested model haiku (config-only, no code). See "Follow-up issues" section at bottom.

---

## Investigation 4 — Stale-claim detection

### Analysis

**What "stale claim" means here.** An issue in `state: In Dev` with an assignee where the session that made the claim is no longer running. The symptom: `updatedAt` hasn't moved in N hours and no commits reference the issue.

**Why this isn't native.** Linear Automations don't support "time since last update > N" as a trigger. The closest native feature is SLAs (breach at T+N), but SLAs are about outcome timing, not activity detection — an SLA fires on a configured absolute deadline, not on "nothing has changed."

**External cron pattern.** A scheduled GitHub Action (daily or twice-daily) that:
1. Queries Linear for all issues in `state: In Dev` with `updatedAt < now - 48h`.
2. For each match: post a comment ("Claim appears stale — last activity <date>. Auto-releasing in 24h unless an activity comment arrives.") and set a 24h grace timer by storing the issue ID in a workflow artifact.
3. On next run 24h later: check whether a comment, commit reference, or state change arrived in the grace window. If yes, skip. If no, transition to `Ready for Dev` and clear `assignee`.
4. Re-trigger Investigation 3's automation by the state transition → `Reopened` label gets applied.

**48-hour timeout rationale.** CC sessions are typically minutes to hours. A 48h gap is almost always a dead session or a blocked-on-external work item that should be escalated, not silently held. The grace window (24h) provides a safety margin for long-running but legitimate work (e.g., a user who stepped away for a day).

**Edge case — intentional WIP parking.** Sometimes a human parks an In Dev issue on purpose (blocked on discussion, awaiting approval). Solution: introduce a `Parked` label that exempts the issue from stale-claim sweep. Simple carve-out.

### Recommendation

**SHIP.** External GitHub Action scheduled cron. Not high-urgency (we haven't had a dead-session incident yet), but it's a known-unknown that the protocol today doesn't address, and the implementation is straightforward once Investigations 1 and 3 are in place.

### Follow-up ticket

`Stale-claim auto-release scheduled Action (48h + 24h grace)` — file under Agent Coordination Protocol, priority Low (no incident yet), suggested model sonnet. See "Follow-up issues" section at bottom.

---

## Investigation 5 — Claim-before-read wrapper in `pull-work` skill

### Current situation

The `pull-work` skill at `.claude/skills/pull-work/SKILL.md` is CC's canonical session-start entrypoint. Rules 1 and 7 are encoded in its step-by-step prose: "claim first → verify the claim → read comment → read plan doc." Execution is prose-directed, not tool-enforced.

### Analysis

**What a wrapper would do.** Replace the current prose ("first tool call is `save_issue`") with a single skill-provided tool that performs the whole claim-then-verify sequence atomically:

```
pullNextReadyForDev(
  queue: "Ready for Dev" | "Ready for Codex",
  assignee: "me"
) → { issueId, claimedState, verifiedAssignee, latestComment }
```

The wrapper:
1. `list_issues(state: queue, assignee: null, limit: 50)` → sort by priority in memory → pick top.
2. `save_issue(id, assignee: "me", state: "In Dev")`.
3. `get_issue(id)` — verify `assignee` and `state` match.
4. `list_comments(id, sort: -createdAt, limit: 5)` — return the latest comment.
5. Return the bundle to CC, which then reads the plan doc and starts work.

If step 3 shows a mismatch (MCP silent drop, impediment #48), the wrapper automatically releases the claim (`assignee: null`) and retries with the next top candidate. After 3 retries it surfaces failure to CC.

**Trade-off.** The wrapper bundles claim + verify + comment-read. This removes the Rule-1 race window entirely: two wrappers invoked in the same second will have only one succeed on the `save_issue + get_issue` verify step because Linear's save-then-get sequence is effectively atomic (the second wrapper will see an assignee and release).

**What this doesn't do.** The wrapper doesn't prevent CC from *not using* the wrapper. A CC session that forgets `pull-work` and hand-rolls `list_issues` + `save_issue` can still violate Rules 1 and 7. The wrapper makes the *right path* easier than the wrong path, which is the realistic goal.

**Rate-limit alignment.** THR-246 (Ready for Codex) lands a single-scan board query. The wrapper should use the same board-scan helper once that issue ships, not its own `list_issues` call. Coordinate implementation order: THR-246 lands the helper; this follow-up consumes it.

### Recommendation

**SHIP.** Small skill enhancement, low risk, high reward. Makes Rule 1 + Rule 7 *convenient to follow* rather than "a discipline to remember."

### Follow-up ticket

`Atomic pull-next wrapper in pull-work skill` — file under Agent Coordination Protocol, priority High (closes the load-bearing rule's race window), suggested model sonnet. **Blocked by:** THR-246 (board-scan helper must land first). See "Follow-up issues" section at bottom.

---

## Rules Retirement / Softening Map

| Rule | Current enforcement | After this plan lands |
|------|--------------------|-----------------------|
| Rule 1 — Claim before read | Doctrine | **Softened** — `pullNextReadyForDev` wrapper bundles claim into a single atomic call; doctrine stays as a fallback for agents that hand-roll. |
| Rule 2 — `assignee:null` filter | Doctrine | **Unchanged** — MCP doesn't honor team defaults (Investigation 2 skip). |
| Rule 3 — CC never transitions to Done | Doctrine | **Structurally harder** — auto-close targets In Review, not Done; In Dev → Done skipping In Review becomes a detectable anomaly. |
| Rule 4 — Read latest comment first | Doctrine | **Softened** — `pullNextReadyForDev` returns latest comment in its output, removing the "I forgot" path. |
| Rule 5 — Reopens get `Reopened` label | Doctrine | **Automated** — Linear Automation applies label on Done → Started transitions (Investigation 3). |
| Rule 6 — WIP=1 across all sessions | Doctrine | **Unchanged** — structural enforcement would require Linear to refuse a second `save_issue(state: "In Dev")` from the same assignee, which it doesn't. Discipline remains. |
| Rule 7 — Verify state changes stuck | Doctrine | **Softened** — `pullNextReadyForDev` bundles verify into the wrapper; direct `save_issue` callers still own the verify responsibility. |
| Rule 8 — Codex reviewer is read-only | Action YAML (`.github/workflows/claude-review.yml`) | **Unchanged** — already structural via scope-restricted `GITHUB_TOKEN` per THR-182. |
| Rule 9 — Verification evidence required | Doctrine | **Unchanged** — waits on branch protection (THR-183 prerequisite). |

**Net effect.** Five rules move from "pure doctrine" to "doctrine with structural reinforcement." Two rules (6, 9) remain purely disciplinary pending external prerequisites. Two (2, 8) stay in current enforcement mode for good reasons.

---

## Recommended Implementation Order

1. **Investigation 5 — `pullNextReadyForDev` wrapper.** Depends on THR-246 landing first. Ships the biggest ergonomic win (Rules 1, 4, 7 bundled).
2. **Investigation 3 — Reopened label Automation.** Config-only, no code, immediate effect. Can run in parallel with Investigation 5.
3. **Investigation 1 — In Review auto-close wiring.** Requires Linear team-setting change (user) + Action step addition. Best scheduled after Investigation 3 so the Reopened-label automation is in place when we start bouncing work through In Review.
4. **Investigation 4 — Stale-claim cron.** Lowest urgency (no incident yet); file as deferral-grade work so it doesn't crowd out higher-value encounter/content pipelines.

**Total estimated work:** Investigation 5 is ~3h skill work + 1h verification. Investigation 3 is ~30m user config. Investigation 1 is ~1h user config + 2h Action step. Investigation 4 is ~3-4h Action scaffolding. All under one working day of total executor time across a week.

---

## Three-Pillar Compliance

**Engine: N/A — process/coordination plan, no tick-loop / graph / resolution changes.**
**Content: N/A — no prose, templates, attachments, or world-model data.**
**UI: N/A in the game sense. Linear UI changes are config only (user performs in Settings).** The `pullNextReadyForDev` wrapper's "UI" is the CC session's tool output format — documented in the follow-up ticket's content section.

The scheduled-task prompt requires explicit N/A rationale per pillar when the work is infrastructure: given above.

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| #1 Tunability | PASS | Timeout constants (48h stale, 24h grace, 60s heartbeat echo from THR-182) named in follow-up tickets. |
| #2 Inspectability | PASS | All transitions logged via Linear's built-in audit trail + new Reopened automation comments. |
| #3 Determinism | N/A | Coordination layer; determinism concerns are per-session, not global. |
| #4 Fail-soft | PASS | Investigation 5 retries on MCP silent drops; Investigation 4 has 24h grace; Investigation 3 Automation failure surfaces as no-label (detectable via sweep). |
| #5 Narrative over mechanical | N/A | No narrative surface. |
| #6 Additive over destructive | PASS | All five investigations add mechanisms; none remove existing rules until sibling tickets prove the structural path. |
| #7 Performance budget | PASS | Investigation 5 consumes THR-246's rate-aware board scan; Investigation 4 runs once per 12h; others are event-driven. |

## Fail-soft Table

| Failure | Fallback |
|---------|----------|
| Linear Automation (Inv. 3) doesn't fire on reopen | Weekly hygiene sweep query surfaces issues in Started states with previous Completed state history and no Reopened label; Cowork applies retroactively. |
| `pullNextReadyForDev` wrapper (Inv. 5) fails 3 retries | Surfaces error to CC; CC logs impediment and hand-rolls the claim (Rule 1 doctrine path). |
| Stale-claim cron (Inv. 4) triggers on a legitimately long-running issue | 24h grace window + `Parked` label opt-out; if still triggered erroneously, human can reclaim within seconds. |
| Auto-close target change (Inv. 1) fires unexpectedly on Cowork docs-only merges | Cowork's close commits can use `Closes THR-XX` (still supported) and manually transition In Review → Done; or an audit query carves out plan-doc issues. |

## Grey Zones / Open Questions for CC

- **Investigation 1, Cowork plan-doc carve-out.** When THR-164 itself merges, should its auto-close target In Review or Done? For plan-doc issues with no code reviewed, In Review is an empty hop. Recommend: accept the empty hop as a consistency tax, don't build a special case. Final call at implementation time.
- **Investigation 5 API shape.** Should `pullNextReadyForDev` return plan-doc contents too, or just the issue metadata + latest comment? Argument for: one more bundled read, saves a CC round-trip. Argument against: plan doc is on disk (repo), not Linear; adding file reads to a Linear-only wrapper crosses concerns. Recommend: keep the wrapper Linear-scoped; CC reads the plan doc itself.
- **Investigation 3, human-triggered reopens.** If a human reopens an issue, should the auto-posted comment mention "by {human name}" or just "by {actor}"? Linear Automation's `{actor}` field resolves both human and API callers. Fine as-is; implementation should test both paths.

---

## Follow-up Issues to File

Each ship recommendation gets its own Linear issue. Cowork files these as part of this session; CC/Codex pick them up from their respective queues.

### A. THR-XXX — Atomic `pullNextReadyForDev` wrapper in pull-work skill

- **Project:** Agent Coordination Protocol
- **Priority:** High
- **Suggested model:** sonnet
- **Labels:** Infrastructure, Improvement, model:sonnet
- **Blocked by:** THR-246 (board-scan helper)
- **Target state:** Ready for Dev (CC — skill change with doctrine implications)
- **Scope:** Implement `pullNextReadyForDev` in `.claude/skills/pull-work/SKILL.md`. See Investigation 5 above.

### B. THR-XXX — Linear Automation: apply `Reopened` label on Done → Started transitions

- **Project:** Agent Coordination Protocol
- **Priority:** Medium
- **Suggested model:** haiku
- **Labels:** Infrastructure, Improvement, model:haiku
- **Target state:** Ready for Codex (config-only, low blast radius)
- **Scope:** User-driven Linear Settings → Automations config, documented in `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Known Linear MCP Limitations. See Investigation 3 above.

### C. THR-XXX — Linear auto-close repoint to In Review + merge-gated Done

- **Project:** Agent Coordination Protocol
- **Priority:** Medium
- **Suggested model:** sonnet
- **Labels:** Infrastructure, model:sonnet
- **Blocked by:** None (In Review state exists)
- **Target state:** Ready for Dev (needs judgment on Cowork docs-only carve-out during implementation)
- **Scope:** User changes team auto-close target; CC adds In Review → Done transition step to `.github/workflows/claude-review.yml`. See Investigation 1 above.

### D. THR-XXX — Stale-claim auto-release scheduled Action

- **Project:** Agent Coordination Protocol
- **Priority:** Low
- **Suggested model:** sonnet
- **Labels:** Infrastructure, Improvement, model:sonnet
- **Target state:** Ready for Dev (new GitHub Action YAML + Linear API integration)
- **Scope:** 48h stale detection + 24h grace + `Parked` label opt-out. See Investigation 4 above.

---

## Out of Scope

- **Webhook-based event architecture.** If rate limits persist beyond THR-246's fixes and Automations are insufficient, a webhook-first architecture becomes the next research item. Not now.
- **Linear Projects state lifecycle automation.** Separate concern from issue-level workflow.
- **Cross-team coordination.** This plan is Threadbare-team only.
- **Retiring Rules 6 and 9.** Wait for their structural prerequisites (cross-session state awareness, branch protection).

---

## Definition of Done for THR-164

1. This plan doc exists at `Docs/plans/2026-04-23-linear-workflow-hardening.md`.
2. Four follow-up issues (A–D above) are filed in Linear with correct project, priority, labels, and target queue.
3. THR-164 itself moves to Ready for Dev with a commit-the-doc handoff comment pointing at this file.
4. CC picks up THR-164 and commits the plan doc with `Fixes THR-164` — that merge fires the auto-close.

**Why the doc is the deliverable, not an implementation.** THR-164 explicitly scopes itself as "research/design for Cowork, not CC." The four follow-up issues carry the actual implementation work. CC's role on THR-164 is a one-line commit landing this doc on `main`.

---

## References

- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — Rules 1–9, workflow states, pickup protocols.
- `Docs/plans/2026-04-19-cc-review-replacement.md` — sibling design for THR-182 (heartbeat + PR-gated Action), landed.
- `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` — sibling design for THR-246 (board-scan dedupe, poller stagger), Ready for Codex.
- `Docs/impediments.md` #48 (silent state writes), #49 (`orderBy:priority` rejection), #79 (rate limits).
- Incidents: THR-159 premature close (2026-04-18); unnamed duplicate-claim incident (2026-04-18).
