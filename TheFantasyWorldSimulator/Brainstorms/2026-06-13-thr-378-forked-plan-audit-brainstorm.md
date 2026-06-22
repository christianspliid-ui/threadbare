---
status: companion
plan_doc: Docs/plans/2026-06-13-thr-378-forked-plan-audit.md
linear_issue: THR-378
created: 2026-06-13
author: Cowork
---

# Brainstorm companion — THR-378 Forked plan-finalization audit

## Why a brainstorm companion here

This is a process / skill ticket, not a player-facing design. The dialogue isn't about game experience — it's about whether the forked-audit pattern is the right shape, given that intent-judge already covers part of the audit surface and `Docs/plans/_template.md` already covers part of the structural lint surface. The risk of over-engineering is real. Capture the considered alternatives so a future reviewer can see why this shape was chosen.

## Considered alternatives

### A — Embed in `game-design-direction` instead of new skill (the simpler path)

`game-design-direction/SKILL.md` already runs the Vision audit inline at finalization. Add two more inline audit sections (NFP, three-pillar) plus a "spawn three subagents" note and call it done. No new skill, no slash command, no mirror.

**Why rejected:** The audit's value comes from forking, not just from having three checks. Embedding leaves the orchestrator doing the audit work itself; the win is parallelization plus context isolation per auditor. Embedding also bloats `game-design-direction/SKILL.md` further, the opposite of QW-3's direction. And it leaves no manual entry point — Christian (or a CC review session) can't invoke it on a historical plan doc.

### B — Single combined auditor with three-section verdict (the cheaper fork)

One subagent that does all three audits, returns a ≤900-word verdict. Half the wall time of three subagents, one third the spawn cost, one prompt to maintain.

**Why rejected:** This is the inline-audit anti-pattern wearing one less hat. The audit benefit is context isolation per dimension. A single auditor reading the plan doc + brief + Vision + wiring-checklist + `_template.md` is loading the same 40-50 KB the orchestrator loads — defeats the point. Three lean prompts, each loading only its own brief slice, is what makes the fork pay off.

### C — Wait for MT-3 (`lint:plan-doc`) and MT-4 (`vision-audit`) scripts before forking

If the underlying mechanical scripts existed, the auditors would be cheaper (read script output instead of doc + brief). Wait until MT-3 / MT-4 are done; then build the forked auditors on top of cleaner foundations.

**Why rejected:** Sequencing this behind two unwritten scripts means months of "manual self-audit" continuing. MT-3 / MT-4 are quality-of-life for the auditors — the auditors work without them via fallback (read source files directly). Ship the fork now; layer the scripts when they exist. No rework required to compose them later — the SKILL.md already names the fallback path.

### D — Use specialized agent types per auditor (NFP-auditor, Pillar-auditor, Vision-auditor)

Define three new agent types in the agent-definition surface, each with its own tool restrictions and model. More precise control over what each auditor can do.

**Why rejected for v1:** No agent-type infrastructure exists for design-loop auditors today. Adding three new agent types is a separate change and slows shipping. `general-purpose` with a role prompt is the established pattern (encounter-pipeline uses it). Revisit when v1 usage tells us which auditor needs constrained tools.

### E — Run all three audits before intent-judge (parallel from the start)

Spawn all four (intent-judge + NFP + pillar + vision) in one message. Theoretical max parallelism. ~90s wall time total instead of ~150s.

**Why rejected:** intent-judge is the gate. If the plan misreads intent, the structural audits are wasted work. The 60s spent on structural audits while intent-judge says BLOCK is also user-confusion: four conflicting verdicts in one message read as noise, not signal. Sequence intent-judge first; spend the structural audits only when the plan has cleared intent.

## Tensions surfaced

**Tension 1 — adding skill vs adding to existing skill.** The pattern is two-edged: more focused, smaller skills are easier for agents to load; more skills mean more files to track and a thicker skill tree to navigate. The audit pattern is at the boundary — it's a finalization step that conceptually belongs to `game-design-direction` (which runs the inline audit today), but mechanically it's the encounter-pipeline shape. Decision was to follow the shape (separate skill) because (a) encounter-pipeline proved it works at production scale, (b) it gives a discoverable slash command, and (c) it isolates the "audit" mental model from the "drafting" mental model. Brand-new agents loading `game-design-direction` for drafting don't also need to absorb three audit prompts.

**Tension 2 — sonnet vs opus for auditors.** intent-judge picks opus deliberately because intent reasoning is harder. Structural compliance against a compiled brief is a different shape — closer to LinkedIn-style "did the candidate's resume mention each required skill" than to "is this strategy actually addressing the user's problem". Sonnet is sufficient at much lower cost. If audit-quality regressions appear in usage, drop to per-dim model selection (vision → opus, NFP/pillar → sonnet).

**Tension 3 — REVISE auto-retry on day 1?** encounter-pipeline auto-retries on REVISE because authoring an encounter is a creative loop where the editorial agent's feedback is actionable. Plan-doc REVISE is structurally different — the fix is often "add a missing section" or "stop deferring this to a follow-up" which the author can do in seconds. Auto-retry adds wall time and obscures whether the original draft was actually weak. v1 surfaces REVISE to the user; v1.1 evaluates after we have data.

## Vision premises invoked

None. This ticket does not touch Vision. The Vision-auditor it builds will, on every future design pass.

## Open questions (carry to v1.1)

1. **Should the audit verdicts persist in Linear comments or only in the plan-doc tail?** Plan-doc tail is the canonical artifact. Linear handoff comment includes a one-line summary per dim. If the audit dimension fails post-handoff (CC catches it in `claude-review.yml`), is the original verdict still visible? Today: yes, in git history.
2. **Should the Vision-auditor have access to `Docs/canon/rulebook.md` as required reading?** Vision premises and rulebook decisions overlap. The rulebook synthesizes "current rules of play" while Vision states "what the player should feel". A plan that contradicts a `[DESIGN]` rulebook entry might pass Vision but should fail audit. Defer to v1.1 — start with Vision-only scope, broaden if drift appears.
3. **`design-audit-pipeline` for non-plan artifacts (audits, brainstorms)?** This skill audits plan docs specifically. Audit docs (`Docs/audits/`) and brainstorm companions could use the same shape but with different success criteria. Out of scope for v1.

## What this leaves un-changed

- `intent-judge` is untouched. It runs first, as designed.
- `encounter-pipeline` and `attachment-pipeline` are untouched. They have their own finalization.
- `design-council` is untouched. Council Round 1's parallel-perspective fork is a different pattern from this audit fork — council generates perspectives, audit checks compliance.
- `Docs/authoring-brief.md` is untouched. Content authors continue to read it; design auditors read `Docs/design-brief.md` instead.
- The Cowork drafting loop (state-of-game-design router → game-design-direction → write plan + brainstorm) is unchanged. Forked audit is appended at the end, after intent-judge.
