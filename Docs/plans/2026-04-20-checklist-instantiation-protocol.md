# Checklist Instantiation Protocol

> **Date:** 2026-04-20
> **Type:** Process amendment (trial)
> **Status:** Proposed — pending user approval, then 5-issue trial
> **Relates to:** `Docs/plans/2026-04-13-linear-coordination-protocol.md`

---

## Problem

`CLAUDE.md` contains several load-bearing checklists: the Definition of Done, the Design Workflow Checklist, the Three-Pillar Rule exit criteria, and the Session Workflow. These are injected into every session via the codebase instructions block, so every agent technically reads them at the top of every conversation. In practice, items still get skipped. The most frequently missed ones are the last-mile DoD steps — updating the systemic wiring guide, logging deferrals as Linear issues, logging impediments, updating `project-status.md` / `project-history.md` / `changelog.md`, verifying wiring against `Docs/plans/wiring-checklist.md`.

The diagnosis is not that the checklists are absent, unclear, or too long. It is that they sit in the prompt as ambient reading rather than being **instantiated** as a live, tickable artifact against the specific issue in flight. An ambient checklist is easy to glance past. An instantiated one has visible boxes the agent has to close — closing the boxes becomes part of the work, not a thing the agent has to remember to go back and audit against.

This is consistent with the behaviour pattern surfaced publicly in agent research ("make it write a todo file with checkable boxes and check them off as it goes"). The finding is real; our adaptation of it is to reuse the infrastructure we already have (TodoWrite, Linear comments, the Codex `Done when` block) rather than invent a fourth checklist surface.

## Proposal

Two required trigger points. Both use tools every agent already has. No new files, no new fields in Linear, no schema changes.

### Trigger 1 — Cowork enters In Design or Implementation Planning

**When:** The moment an issue transitions into `In Design` or `Implementation Planning` under Cowork's ownership (or Cowork resumes one already in that state at session start).

**Required action before any research or drafting:** Call `TaskCreate` once per checklist item, copying the **Design Workflow Checklist** from `CLAUDE.md` verbatim, expanded against this specific issue (THR-XX). Every box becomes a task. Tasks stay open until verified, closed as work progresses.

The structural gate and design quality gate from the coordination protocol's exit criteria are part of this instantiation — they are checkboxes in the same TodoWrite.

### Trigger 2 — CC (and Codex) complete claim-verification

**When:** Immediately after `save_issue(assignee: "me", state: "In Dev")` followed by `get_issue(id)` confirming the claim stuck (Rules 1 + 7 of the coordination protocol). This is the *second* tool call after verification — the first is reading the latest comment per Rule 4.

**Required actions:**
1. `TaskCreate` one task per **Definition of Done** item from `CLAUDE.md`, verbatim, expanded against THR-XX. Plus a task per action item from the handoff comment's Engine / Content / UI / Wiring sections.
2. Post a Linear comment on the issue containing the same checklist in Markdown `- [ ]` form. This is the **persistence layer**.

The Linear comment exists because TodoWrite state is in-session: if CC's session resumes in a different worktree or after a crash, the boxes are gone. The Linear comment survives that. CC updates the comment (editing it, not re-posting) as items close. The comment is authoritative for cross-session resumption — if the TodoWrite and the comment disagree, the comment wins and the TodoWrite is rebuilt from it.

### Codex coverage

Codex does not need a separate instantiation step. The Codex handoff template already contains a `Done when` block with `- [ ]` checkboxes (`Docs/plans/2026-04-13-linear-coordination-protocol.md`, Codex Handoff section). That block **is** the instantiated DoD for Codex-routed work, pre-built by Cowork at handoff time. Codex's job on pickup is to update the boxes in-place in that handoff comment as work progresses, rather than rebuilding it.

This means the trial change for Codex is narrow: **Codex must update the `Done when` boxes in the handoff comment as it goes**, rather than reading them once and moving on. No new artifact — just using the one Cowork already writes.

### Threshold — when instantiation is required

Required when **either** of the following is true:

- A plan doc exists for the issue in `Docs/plans/`, OR
- The full Definition of Done applies (anything that ships code, content, or docs to `main`).

Not required for:

- Trivial single-surface fixes (one-line CSS correction, typo in a doc, a string change in content).
- Pure exploration / research issues that close with a comment and ship no diff.
- Issues the agent releases back to the queue after claim (e.g., incomplete handoff detected — Rule of Pickup Protocol step 4 applies, not this protocol).

When in doubt, instantiate. A TodoWrite call is cheap; a forgotten DoD step is not.

### Copy verbatim, don't paraphrase

When instantiating, copy checklist items **word-for-word from `CLAUDE.md`**. Do not paraphrase, re-order, or omit. If the checklist is long, the answer is to close boxes methodically, not to shrink the list. Paraphrasing drifts the bar across agents and issues — the whole point is that the standard is identical every time.

If `CLAUDE.md` is edited mid-issue and the relevant checklist changes, refresh the TodoWrite (and the Linear comment, for CC) to match. This is cheap and keeps the instantiated list aligned with the source of truth.

### What NOT to add

The following were considered and rejected:

- **Per-issue `.md` scratchpad files in the repo.** `CHECKLIST-THR-XX.md` committed alongside the branch would technically survive session rotation, but it adds a cleanup burden and a fourth checklist surface. The Linear comment gives us the same persistence without touching the working tree.
- **A new Linear field for "DoD progress."** Linear's existing comment markdown renders `- [ ]` checkboxes natively. A custom field would be extra schema for no added capability.
- **A pre-commit hook that parses the TodoWrite.** The hook layer already covers mechanical DoD enforcement (tests, types, build, orphan deferrals). Duplicating that in TodoWrite-land would just be redundant.
- **Instantiating on every issue regardless of threshold.** Checklist theatre. If we instantiate on a one-line CSS fix, agents learn to treat the boxes as noise and the whole signal degrades.

## Trial plan

### Scope

Apply the protocol to the **next five Linear issues** that cross the threshold, whichever executor handles them. All five must meet the threshold — trivial fixes don't count against the five.

### Success signals (what we want to see more of)

1. **DoD close-out is cleaner.** Fewer follow-up commits like "actually we also need to update project-status" or "forgot to log the impediment." The merge commit includes the full DoD sweep, not just the code change.
2. **Design plans land complete.** Cowork's plan docs come out with all three pillars addressed and all NFP sections inline, not added as post-hoc revisions during CC review.
3. **Retro impediments shift.** Impediments logged during the trial are about *content* (the work itself), not about *process slippage* (forgot to do X that was already in the checklist).

### Anti-signals (what would tell us the protocol is failing)

1. **Checklist theatre.** Agent creates the TodoWrite and never updates it, or closes all boxes in one batch at the end without incremental progress. If this happens, the fix is not removing instantiation — it's tightening the "update as you go" norm and adding a review prompt that checks whether boxes were closed incrementally.
2. **Threshold mis-application.** Agents instantiate on work that doesn't warrant it and waste cycles. If this surfaces, tighten the threshold language rather than abandoning the protocol.
3. **Linear comment drift.** CC updates the TodoWrite but not the Linear comment (or vice versa). If this is common, simplify: pick whichever surface is actually being maintained and drop the other.

### Duration and decision

Five issues is the minimum. If signal is mixed after five, run another five before deciding. Possible outcomes after trial:

- **Adopt as permanent amendment.** Fold the trigger-point rules into `Docs/plans/2026-04-13-linear-coordination-protocol.md` as new sub-sections under the existing Cowork Session Start / CC Pickup Protocol / Codex Pickup Protocol blocks. Add a short note to `CLAUDE.md` session workflow referencing it.
- **Revise and re-trial.** Adjust based on which anti-signals fired. Run another 5-issue trial.
- **Abandon.** If the protocol produces zero measurable improvement and real overhead, drop it. Do not fold it in "just because we already wrote it."

## Integration with existing protocol

This is a pure addition to `Docs/plans/2026-04-13-linear-coordination-protocol.md`. Nothing existing changes. Specifically:

- **Rules 1–8 are unchanged.** Claim-before-read, pull-query filtering, no-manual-Done, read-latest-comment-first, reopened-label, WIP=1, verify-after-write, reviewer-read-only — all untouched. The new trigger sits between Rule 4 (read latest comment) and the normal read-handoff-and-work flow, not inside or around any Rule.
- **Handoff templates are unchanged.** Cowork's CC handoff and Codex handoff comment shapes stay as they are. The Codex `Done when` block is already the instantiated checklist for Codex work; CC's instantiation happens in the Linear comment CC *writes*, not in the handoff Cowork writes.
- **Role boundaries are unchanged.** Cowork still cannot transition past Ready for Dev / Ready for Codex; executors still cannot transition to anything except In Dev (from their queue) and Done (only via merge keyword).
- **Exit criteria are unchanged.** The structural + design-quality gates in the exit-criteria section are the source the instantiated TodoWrite copies from — no re-definition.

## Risks and mitigations

**Risk 1: Checklist theatre.** Agent creates the TodoWrite and ignores it, then self-reports "done" without closing boxes. *Mitigation:* The trial surfaces this directly — anti-signal #1 is explicitly monitored. Also, for CC: the Linear comment is reviewable. If the DoD comment shows most boxes still unchecked at the moment the merge commit fires, that's a visible failure that human review (or the review Action) can flag. For Cowork: at plan presentation, the user sees whether the TodoWrite was updated along the way or only at the end.

**Risk 2: Threshold mis-application.** Agents instantiate on trivial work and create friction. *Mitigation:* Explicit threshold language above. If ambiguous cases accumulate during the trial, refine the threshold before deciding on adoption.

**Risk 3: Drift between CLAUDE.md and instantiated lists.** CLAUDE.md is edited; instantiated TodoWrites and Linear comments stay stale. *Mitigation:* Rule is to copy verbatim each time, and to refresh if `CLAUDE.md` changes mid-issue. Cheap to do, and the source of truth stays unambiguous — `CLAUDE.md` is canonical, the instantiation is an expansion of it.

**Risk 4: Codex already has Done when; adding another layer confuses.** *Mitigation:* For Codex, the trial change is literally just "update the Done when boxes as you go" — no new artifact. If Codex already does this, the trial is a no-op for Codex work, which is fine.

**Risk 5: Session rotation loses state.** CC's TodoWrite evaporates across worktree / session boundaries. *Mitigation:* That's exactly why the Linear comment exists for CC. On session resume, CC reads the Linear comment's box state and rebuilds the TodoWrite from it.

**Risk 6: User-facing friction.** If the user watches Cowork spend 10 seconds creating a TodoWrite before doing any actual work, it may feel like overhead. *Mitigation:* TodoWrite rendering is fast and the widget is useful for the user too (they see progress). The alternative — forgotten DoD steps that produce rework — is worse for the user.

## What this does NOT fix

- **Agents skipping items they actively decide aren't relevant.** Instantiation surfaces the item but doesn't force compliance. If an agent marks an item "skip — infrastructure-only, no player-facing UI," that's a judgment call the protocol respects. The visibility of the skip is the improvement; the judgment isn't mechanised.
- **Long-form judgment calls embedded in checklist items.** "Run a Vision audit" is one checkbox but hides significant work. Instantiation doesn't shrink that work. If specific checklist items are consistently rushed, the fix is splitting them or expanding them, not more instantiation.
- **Non-checklist CLAUDE.md guidance.** "Narrative over mechanical perfection," "additive over destructive changes," and other ambient priorities aren't checkboxes and don't get instantiated. Those need their own reinforcement mechanism — this protocol doesn't address them.
- **Taste and quality judgments.** Whether the prose is good, whether the UI reads correctly, whether the encounter feels alive — none of that is checklist compliance. The design-quality gate already exists for that at the In Design → Implementation Planning transition, but it's orthogonal to instantiation.

## NFP compliance

Not applicable in the usual sense — this plan modifies process, not game systems. The NFP table format is for designs that touch engine, content, or UI. This doc modifies how agents coordinate, which has no runtime representation. Called out explicitly so a future reader doesn't wonder whether the NFP section was forgotten.

## Decision requested

Approve the 5-issue trial. No code changes, no Linear schema changes, no doc changes beyond this plan. At trial exit, bring the results back for the adopt / revise / abandon call.
