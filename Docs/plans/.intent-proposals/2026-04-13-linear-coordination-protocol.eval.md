# Action Proposal — 2026-04-13 Linear coordination protocol (eval fixture)

> **Calibration fixture.** Reconstructed for THR-412. Ground truth not visible to the judge — see eval-run write-up for outcome comparison.

## intent_quote

> "Two agents (Cowork and Claude Code) coordinate via markdown files: BACKLOG.md for kanban state, HANDOVER.md for handoffs, project-status.md and changelog.md for audit trail. This is convention-enforced — agents are told to update files but nothing prevents them from skipping steps, and nothing prevents Cowork from writing code instead of planning."
>
> "What breaks: BACKLOG.md kanban emojis don't get updated (agents forget or skip) · HANDOVER.md entries don't get written (context lost between agents) · No audit trail for who moved what and when · No role enforcement — Cowork can write to `src/` because it's all just files · No dependency tracking beyond 'Depends on: TB-XXX' text in markdown."
>
> (Cowork-stated Problem from §Problem of the plan doc — captures the user's lived experience of the markdown-coordination breakdown that drove the migration to Linear. The user authored Linear access and asked Cowork to design the protocol; the doc is the resulting contract.)

## scope (what this plan does)

Replaces BACKLOG.md (kanban source of truth) and HANDOVER.md (handoff mechanism) with Linear as the single source of truth. Defines eight custom workflow states organized into two swimlanes (Discovery & Design owned by Cowork; Implementation owned by CC/Codex) and two handoff lanes (Ready for Dev for CC; Ready for Codex for Codex). Names exit criteria per state transition with explicit three-pillar gate (Engine / Content / UI / Wiring coverage + NFP + Fail-soft). Encodes role boundaries (which agent can transition to which state). Specifies Coordination Failure Modes — eleven Hard Rules (claim-before-read, pull queries filter claimed, never manual-Done, latest-comment-first, Reopened labels, WIP=1 cross-session, verify-after-write, codex-reviewer-is-read-only, verification-evidence-required, model-lanes-as-pull-filter, never-write-shipped-work). Defines agent session protocols per agent (Cowork session start, CC session start, CC pickup protocol, Codex session start, Codex pickup protocol, Codex closeout). Defines handoff comment template with required coordination block (Suggested model, Parallel-safe with, Mutex with). Migrates ~25 active BACKLOG.md items to Linear as THR-6 through THR-38.

## scope (what this plan does NOT do — explicit non-goals)

- Does not retire `Docs/plans/` design docs (they are content, not coordination — they stay in the repo).
- Does not retire `Docs/changelog.md`, `Docs/project-status.md`, `Docs/project-history.md` (git-tracked audit trail, referenced by DoD hooks).
- Does not retire CLAUDE.md (session instructions — updated to reference Linear).
- Does not retire `.planning/ROADMAP.md` (milestone-level roadmap; could move to Linear Projects later).
- Does not programmatically enforce role boundaries in Linear (no `assignee.canTransition[state]` checks — Linear doesn't enforce; convention + audit trail is the mechanism).
- Does not retroactively close completed historical work — `.planning/BACKLOG_HISTORY.md` stays as the pre-Linear archive.

## impact_class

External. The plan changes the coordination protocol every agent (Cowork, CC, Codex) must follow on every session. It establishes pull queries, state transitions, and the merge-keyword auto-close path that constitute the live coordination machinery. CLAUDE.md and skill files are touched; scheduled tasks reference these queues. This is the high end of External (every executor automation derives its session loop from this doc) but does not change a Vision premise or load-bearing decision — it is the codification of the coordination layer rather than a content/engine change.

## evidence cited

- **Linear issue:** none — this is the doc that established Linear itself as the source of truth, so the doc predates any issue that would track it. (See author_notes.)
- **Vision premises invoked:** none — this is process infrastructure, not a game feature.
- **UL terms touched:** none game-domain; the protocol uses agent / executor / handoff / queue / state-transition terminology defined in the doc itself.
- **Canon pages consulted:** `Docs/canon/process.md` (the meta-canon for process work, which this doc helped seed).
- **Prior plan docs this builds on:** retired BACKLOG.md / HANDOVER.md (tombstoned with headers pointing to Linear); `Docs/plans/2026-04-13-definition-of-done-hooks-design.md` (the hooks design this protocol coordinates with — Gate 1–3 mechanical DoD enforcement).
- **Rejected approaches considered and dismissed:** markdown-files-only coordination (rejected; convention-only, no audit trail, no role enforcement); single-handoff queue across both executors (rejected; queue separation is structural, not discipline-based — prevents cross-executor claims).

## load-bearing decisions touched

Establishes new load-bearing process decisions: claim-before-read (Rule 1), verify-after-write (Rule 7), WIP=1 cross-session (Rule 6), CC-never-Done (Rule 3), latest-comment-first (Rule 4), Reopened-label-as-signal (Rule 5), codex-reviewer-is-read-only (Rule 8), verification-evidence-required (Rule 9), model-lanes-as-pull-filter-boundaries (Rule 10), no-writing-shipped-work (Rule 11). Each rule maps to a specific past incident that motivated it; the eleven Hard Rules are the load-bearing surface, not just guidance. Does not change any CLAUDE.md architectural decision (graph schema, tick-loop semantics, etc.) — process scope only.

## high-impact files touched (from Codesight)

None. The plan touches CLAUDE.md and `Docs/plans/`. No `src/` files; no file with ≥100 importers is touched.

## kill criteria

Implicit but clear: if Linear MCP becomes unusable (silent state drops, rate limits, prolonged outage), the protocol degrades because every transition assumes the MCP works. The "Known Linear MCP Limitations" section names the failure modes (silent state drops → verify-after-write; rate limits → 2-min backoff; unfiltered list_issues overflow → state-scoped filters). The Hard Rules themselves are derived from real incidents; each one's "Why" line names the failure that motivated it. The kill criterion for a specific rule is: if a rule's failure mode recurs three times in a quarter, the rule needs revision (this is implicit in the retrospective skill's cadence, not explicitly stated in this doc).

## explicit user sign-off

Not required as a single user message — the protocol was co-authored by the user across multiple sessions. The user authored Linear access, asked for the migration, and reviewed each Hard Rule as it was added (rules accreted across many incidents over weeks; the doc grew with the project rather than being written once). Treat the doc itself as the audit trail of user-blessed direction.

## author notes for the judge

Three limits the judge should weigh: (1) **No Linear issue.** This is the doc that established Linear; it predates any issue that could track it. The intent_quote is therefore the Cowork-stated Problem the migration solved — captures what the user was trying to fix. (2) **Multi-session authorship.** The eleven Hard Rules grew across many incidents; each one's Why-line points at a specific failure that motivated the rule. The doc is therefore a living contract rather than a single-pass design. (3) **No three-pillar coverage.** This is process infrastructure, not a game feature. Three-pillar status: all explicitly N/A (precedent: ARC-60). The doc is the operating manual for the agent coordination system, alive in the repo because every Cowork / CC / Codex session loads it via CLAUDE.md or directly. The interesting design calls: structural queue separation (Ready for Dev vs Ready for Codex prevents cross-executor claims by filter, not by discipline); claim-before-read order on every pickup (Rule 1, derived from a specific duplicate-work incident); verify-after-write as mandatory (Rule 7, derived from impediment #48 silent-drop bug); model-label-as-pull-filter (Rule 10, derived from a Sonnet session that shipped Sonnet-quality output on Opus-labeled work). The doc is in active use — load-bearing in the strongest sense.
