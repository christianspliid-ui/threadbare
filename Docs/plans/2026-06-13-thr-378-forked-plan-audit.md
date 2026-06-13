<!--
Plan doc for THR-378 (MT-2: Fork plan-finalization audit).
Source audit: Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md § MT-2.
Companion: TheFantasyWorldSimulator/Brainstorms/2026-06-13-thr-378-forked-plan-audit-brainstorm.md
-->

> **title:** Fork plan-finalization audit into NFP / Pillar / Vision subagents — THR-378
> **linear_issue:** THR-378
> **author:** Cowork
> **created:** 2026-06-13
> **three_pillars:** Engine `N/A — process / skill change` · Content `done (three role prompts)` · UI `N/A — agent-only surface, no player UI`

# Fork plan-finalization audit into NFP / Pillar / Vision subagents — THR-378

*Spawn three audit subagents in one message at plan-doc finalization so the orchestrator stops self-auditing and Cowork's design passes get an independent, structurally separable verdict per dimension.*

## Why this is load-bearing

Today, Cowork drafts a plan doc and then the same agent runs the NFP audit, the three-pillar coverage check, and the Vision audit inline. Self-audit is structurally weaker than independent audit — the author has already burned context on the chosen direction and is biased toward declaring it complete — and it serializes work that is naturally parallel. Audit `2026-05-08-design-loop-fork-files-commands-audit.md` § MT-2 names this as the highest-WSJF reducible cost on the design loop after MT-1 (state-of-game-design split, shipped). MT-1 is in In Review (shards landed in PR #310). QW bundle (THR-376) is Done — `Docs/plans/_template.md` and `Docs/design-brief.md` already exist for the auditors to reference. The remaining gap between Threadbearer's design loop and `encounter-pipeline` is the forked audit pass. This plan closes that gap with an additive new skill and three role-prompt files.

The change composes with `intent-judge` (THR-411, shipped). intent-judge guards user intent holistically; this skill checks structural compliance per dimension. Both run at finalization; they are complementary, not redundant. See § Wiring for the ordering decision.

## Engine pillar

Engine: N/A — pure agent / process change. No tick loop, no graph nodes, no PRNG, no game-state mutation.

## Content pillar

### Three role prompts (the deliverables)

Three new role-prompt files under a new skill, mirroring `encounter-pipeline/agents/`:

- `.claude/skills/design-audit-pipeline/agents/nfp-prompt.md` — NFP-auditor persona. Inputs: plan-doc path. Reads: plan doc, `Docs/design-brief.md` § NFPs (compiled brief — not the source files), `Docs/plans/wiring-checklist.md`. Output: NFP-compliance table with PASS / PASS-with-note / FAIL per NFP and one-line evidence quote. Hard cap 300 words.
- `.claude/skills/design-audit-pipeline/agents/pillar-prompt.md` — Three-pillar auditor persona. Inputs: plan-doc path. Reads: plan doc, `Docs/plans/_template.md` (structural contract), `Docs/plans/wiring-checklist.md`. Output: per-pillar verdict (Engine / Content / UI) — present-and-substantive / present-but-thin / missing / N/A-with-rationale — plus the missing required-section list per § Per-system required sections in CLAUDE.md. Hard cap 300 words.
- `.claude/skills/design-audit-pipeline/agents/vision-prompt.md` — Vision auditor persona. Inputs: plan-doc path. Reads: plan doc, `Docs/design-brief.md` § Vision summary, output of `npm run vision-audit <plan-doc>` (MT-4 — not yet built; v1 falls back to reading the six Vision/ files directly when the script is missing). Output: Vision premises touched (file → line citation), Vision contradictions (file → line citation + plan-doc quote), and a single PASS / REVISE / BLOCK verdict. Hard cap 300 words.

Each prompt follows the encounter-pipeline structure: `# Role Persona`, `## Your Inputs`, `## Required Reading`, `## What You Must Produce`, `## Verdict Format`, `## Hard Constraints`. Templating slot is `{{PLAN_DOC_PATH}}` (orchestrator substitutes the relative path before spawning). No additional templating slots for v1 — keeps the orchestrator wiring trivially simple.

### Skill scaffolding

- `.claude/skills/design-audit-pipeline/SKILL.md` — orchestrator instructions. Describes the single-message fork pattern (three `Agent` calls in one message), specifies `subagent_type: "general-purpose"` for v1 (no specialized auditor agent types exist yet), defines the merge step (orchestrator writes the three verdicts into the plan-doc tail under `## Forked-audit verdicts` and into Linear handoff comment), and names the failure mode handling per § Fail-soft.
- `.agents/skills/design-audit-pipeline/` mirror (`npm run check:skill-sync:sync`) — Cowork is the primary caller; the skill-sync hook (THR-192) enforces parity between the two trees for any skill present in both. This skill is added to `.claude/` first; mirroring is mechanical and added in the same commit.
- Slash command `/design-audit <plan-doc-path>` — installed via `commands/design-audit.md`. Manual entry point; the auto-trigger (when Cowork finishes a plan doc) is documented in SKILL.md and invoked by the author session, not by a daemon.

### Reference brief

The brief content already exists (Docs/design-brief.md § NFPs and § Vision summary from THR-376/THR-449). No new compilation step needed for v1. The auditors read the existing brief, not the source files — same pattern encounter-pipeline uses with `Docs/authoring-brief.md`. When `npm run check:design-brief` reports the brief stale (>14 days since last source touch), auditors fall back to source files and emit a `design-brief-stale` drift note in their verdict tail.

## UI pillar

UI: N/A — this is an agent-only surface. No player-facing screen, no DebugPanel inspection point, no chronicle entry. The auditor verdicts surface in (a) the plan-doc tail under `## Forked-audit verdicts`, and (b) the Linear handoff comment. Both are agent-readable artifacts already in Cowork's workflow. The closeout § Browser-verify exempt clause applies — this is a types/process refactor with no runtime UI surface.

Browser-verify exempt: skill-only and doc-only changes, no runtime UI surface.

## Wiring

### Orchestrator integration

Cowork's design workflow gains a new finalization step **after** intent-judge and **before** the Linear state transition to Ready for Dev / Ready for Codex:

1. Plan doc written to `Docs/plans/`.
2. Brainstorm companion written to `TheFantasyWorldSimulator/Brainstorms/`.
3. **intent-judge** runs (THR-411 — already wired). Returns Allow / Revise / Block / Escalate.
4. If intent-judge returns Allow, invoke **design-audit-pipeline**. Single message with three `Agent` calls (NFP / pillar / vision). Each subagent reads its role-prompt, audits the plan doc, returns ≤300-word verdict.
5. Orchestrator merges the three verdicts into the plan-doc tail under `## Forked-audit verdicts`. If any auditor returns FAIL or REVISE, orchestrator surfaces the finding to the user before applying `plan-pending-commit` and transitioning Linear state. If all three PASS / PASS-with-note, orchestrator applies the label and transitions state without user-facing prompt.
6. `flush-plan-docs` commits the plan doc with verdicts embedded in the tail.

intent-judge runs first because it gates on the user's verbatim ask; if intent is wrong, structural compliance does not matter. The three forked auditors run only after the plan is intent-aligned. This serial ordering costs ~90s extra wall time (intent-judge target latency) but keeps the audit budget focused: structural auditors do not waste cycles on doc-level rejects.

### Files to touch

- `.claude/skills/design-audit-pipeline/SKILL.md` (new)
- `.claude/skills/design-audit-pipeline/agents/nfp-prompt.md` (new)
- `.claude/skills/design-audit-pipeline/agents/pillar-prompt.md` (new)
- `.claude/skills/design-audit-pipeline/agents/vision-prompt.md` (new)
- `.agents/skills/design-audit-pipeline/` (mirror, generated via `npm run check:skill-sync:sync`)
- `.claude/commands/design-audit.md` (new — slash command wrapper)
- `.claude/skills/game-design-direction/SKILL.md` (edit — add §finalization step pointer)
- `CLAUDE.md` (edit — § Design Governance → Step 8.5 list gains a §8.6 "Forked structural audit (design-audit-pipeline)" after intent-judge)
- `Docs/plans/_template.md` (edit — add `## Forked-audit verdicts` tail section as expected, optional, with comment `populated by design-audit-pipeline`)

No engine, content, or UI source changes.

### Wiring-checklist references

Per `Docs/plans/wiring-checklist.md` — process surfaces. This change adds a new agent-invocation step to the design workflow. Per the checklist's § "When you add a new agent / workflow step": (a) document it in CLAUDE.md § Design Governance, (b) document it in `game-design-direction/SKILL.md` § Finalization, (c) update wiring-checklist itself to list `design-audit-pipeline` under § Agent-invocation surfaces.

## Constants

| Constant | Value | Purpose |
|---|---|---|
| `DESIGN_AUDIT_NFP_MAX_WORDS` | 300 | NFP-auditor output cap. Mirrors intent-judge's structured-finding cap. |
| `DESIGN_AUDIT_PILLAR_MAX_WORDS` | 300 | Pillar-auditor output cap. |
| `DESIGN_AUDIT_VISION_MAX_WORDS` | 300 | Vision-auditor output cap. |
| `DESIGN_AUDIT_TIMEOUT_SECONDS` | 60 | Per-subagent wall-time budget. Three parallel auditors → 60s total. Trips fail-soft. |
| `DESIGN_AUDIT_MODEL` | `sonnet` | Auditor model. Structural checks against compiled brief — Sonnet is sufficient. (Compare: intent-judge uses opus because intent reasoning is harder.) |
| `DESIGN_AUDIT_RETRY_ON_REVISE` | `false` | v1: surface REVISE verdicts to the author for inline fix. Re-evaluate auto-retry after we see usage patterns. Mirrors how `encounter-pipeline` shipped v1 without auto-retry. |
| `DESIGN_BRIEF_STALENESS_DAYS` | 14 | Threshold for `design-brief-stale` drift note in auditor tails. Mirrors `authoring-brief` staleness convention. |

All constants live in SKILL.md as a `## Constants` block. They are tunable by editing SKILL.md and bumping `last_validated_against`. No runtime constant file because there is no runtime code.

## Tracing

Tracing: N/A — no tick traces. The "trace" for this system is the plan-doc tail `## Forked-audit verdicts` section plus the Linear handoff comment, both already inspectable by humans and agents. If we want telemetry later (median wall time per auditor, REVISE rate, FAIL rate), a follow-up adds a `Docs/audits/design-audit-log.jsonl` append-only log; not in v1.

## Fail-soft

| Failure case | Behavior |
|---|---|
| Subagent times out (>60s) | Orchestrator marks `audit-timeout: <dim>` in verdicts table and falls back to inline self-audit for that dimension only. Does not block handoff. Logs a `design-audit-timeout` drift note. |
| Subagent returns >300 words | Orchestrator truncates to first 300 words and emits a `design-audit-overflow` drift note. Does not block handoff. |
| Plan doc missing structural element (no NFP table, no pillar headings) | Affected auditor returns `BLOCK: plan doc lacks <X>`. Orchestrator surfaces immediately to the author; does not transition Linear state. |
| `Docs/design-brief.md` stale (`npm run check:design-brief` non-zero) | Auditors fall back to source files (`Docs/canon/architectural-decisions.md`, Vision/ files) and emit `design-brief-stale` drift note. Auto-opens a `design-brief-stale` drift-scan Linear issue if one is not already open. |
| `design-audit-pipeline` skill itself missing or corrupt | Cowork falls back to inline self-audit (today's behavior). Opens a drift-scan issue. Definition of Done is not blocked. |
| All three subagents fail | Cowork falls back to inline self-audit and surfaces "forked audit unavailable — manual audit ran" in the Linear handoff comment. Definition of Done is not blocked. |

The skill is additive — every failure mode degrades to today's behavior (inline self-audit), never worse. Per NFP #6.

## NFP-compliance

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | All thresholds named constants in SKILL.md (`DESIGN_AUDIT_*`). Edit SKILL.md to retune. |
| 2. Inspectability | PASS | Verdicts written to plan-doc tail + Linear comment — both human-readable artifacts already in workflow. Drift notes (`audit-timeout`, `overflow`, `design-brief-stale`) make failure modes legible. |
| 3. Determinism | PASS-with-note | Subagent outputs are LLM-generated, not deterministic. The orchestrator's merge / fallback logic is deterministic. Auditor variance is acceptable — they are advisory; the user reviews REVISE / FAIL verdicts. Mirrors intent-judge's variance posture. |
| 4. Fail-soft | PASS | Five fail-soft cases enumerated above; every one degrades to today's inline self-audit. Tick loop unaffected (no engine). |
| 5. Narrative over mechanical perfection | N/A | Process change, not narrative system. |
| 6. Additive over destructive | PASS | New skill, new files, new constants, new orchestrator step. Edits to CLAUDE.md, `_template.md`, and `game-design-direction/SKILL.md` are additive (new sections / pointer lines). No deletions. |
| 7. Performance budget | PASS-with-note | Three parallel subagents at ~60s each → ~60s wall time, ~180s aggregate agent time. Each Cowork design pass takes minutes today; +60s is well within budget. If aggregate cost becomes an issue, model can drop to haiku per dim with no architectural change. |

## Vision audit

This plan does not touch Vision premises — it is a process / skill change, not a player-facing feature. The Vision-auditor it creates does enforce Vision premises on *future* plan docs, but does not change the premises themselves. No Vision/ edits required for this ticket.

## Rulebook impact

No rules-of-play change. Process-only ticket. No edits to `Docs/canon/rulebook.md` or `Docs/canon/rulebook-quick-reference.md` required.

## Mutex with MT-1

MT-1 (THR-377) is In Review — shards landed in PR #310. The mutex named in the source audit (`overlapping skill-tree edits`) is resolved: the state-of-game-design split is on `main`; this ticket touches a *different* skill (`design-audit-pipeline`, new) plus a single line in `game-design-direction/SKILL.md`. Concurrent edit risk is limited to CLAUDE.md § Design Governance — if MT-1's closeout doc-update still has CLAUDE.md edits pending, sequence those first. Verify-before-claim per the protocol.

## Coordination block

- **Suggested model:** `sonnet` (matching label: `model:sonnet`)
- **Parallel-safe with:** non-design-loop work (any engine, content, UI, hex-map, repo-health ticket)
- **Mutex with:** THR-377 closeout if any CLAUDE.md § Design Governance edits are still pending (verify before claim)
- **Codex review:** no — skill / doc surface, mechanical refactor. Cowork-style work, Sonnet-grade.
- **Files to touch (executor):** see § Wiring → Files to touch above. All additive except a single-line pointer added to `game-design-direction/SKILL.md` § Finalization and a single bullet added to CLAUDE.md § Design Governance Step 8.6.

## Done when

- [ ] `.claude/skills/design-audit-pipeline/SKILL.md` exists with `## Constants`, `## Invocation`, `## Orchestrator wiring`, `## Fail-soft`, `last_validated_against: 2026-06-13`.
- [ ] Three role-prompt files exist under `.claude/skills/design-audit-pipeline/agents/` (`nfp-prompt.md`, `pillar-prompt.md`, `vision-prompt.md`) — each ≤4 KB, each follows the `# Role`, `## Inputs`, `## Required Reading`, `## What You Must Produce`, `## Verdict Format`, `## Hard Constraints` structure.
- [ ] `.agents/skills/design-audit-pipeline/` mirror generated via `npm run check:skill-sync:sync`; skill-sync hook passes pre-commit.
- [ ] `.claude/commands/design-audit.md` slash command installed.
- [ ] CLAUDE.md § Design Governance gains a §8.6 "Forked structural audit (design-audit-pipeline)" entry pointing at the skill.
- [ ] `Docs/plans/_template.md` gains an optional `## Forked-audit verdicts` tail section with a `<!-- populated by design-audit-pipeline -->` comment.
- [ ] `game-design-direction/SKILL.md` § Finalization gets a one-line pointer to `design-audit-pipeline`.
- [ ] Dry-run on a recent plan doc (suggest: `Docs/plans/2026-06-11-thr-452-branching-encounter-reachability.md`) produces three coherent verdicts in <90s wall time. Paste the three verdicts into the closeout Linear comment as evidence.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` pass.
- [ ] `npm run check:skill-sync` passes.
- [ ] Closing commit body includes `Fixes THR-378`.

## Out of scope (follow-ups)

- **Auto-retry on REVISE** (encounter-pipeline-style). Defer to v1.1 once we see false-positive rates.
- **`npm run lint:plan-doc <path>`** (MT-3). Schematic structural lint; separate ticket. Pairs with this skill but is independent.
- **`npm run vision-audit <plan-doc>`** (MT-4). Mechanical Vision-reference scanner. The Vision-auditor in this skill falls back to direct Vision/ reads until MT-4 ships.
- **Specialized auditor agent types** (`design-nfp-auditor`, etc.) vs `general-purpose`. v1 uses `general-purpose` for trivial wiring. Specialize only if model selection or tool restrictions per auditor become valuable.
- **Telemetry log** (`Docs/audits/design-audit-log.jsonl`). Add when REVISE-rate or wall-time tuning becomes important.
- **CC post-merge structural review** (running the same auditors against merged plan docs as a second-pass safety net). Out of scope; intent-judge + CC's `claude-review.yml` already cover post-merge.
