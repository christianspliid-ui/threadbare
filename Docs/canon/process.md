---
domain: process
last_reviewed: 2026-05-06
reviewer: cowork
ul_shards: [Process, Coordination]
status: live
---

# Canon — Process

> The process canon is the meta-canon every Cowork session benefits from. It is the navigation layer over CLAUDE.md, the Process and Coordination UL shards, and the coordination protocol — answering "what governs how we ship?" without forcing every session to re-read 600 lines of CLAUDE.md.

## How to use this page

Load this page once at session start instead of re-reading the corresponding CLAUDE.md sections. Every section below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled issue.

## Current spec — pointers

- **NFPs (in priority order):** [CLAUDE.md → Non-Functional Priorities](../../CLAUDE.md) and [`UL/Process` → Non-Functional Priority](../ubiquitous-language/Process.md). Authoritative ordering: Tunability → Inspectability → Determinism → Fail-soft → Narrative > mechanical → Additive > destructive → Performance budget. Higher-numbered NFPs yield to lower-numbered ones in tension.
- **Three-Pillar Rule:** [CLAUDE.md → Three-Pillar Rule](../../CLAUDE.md) and [`UL/Process` → Three-Pillar Rule](../ubiquitous-language/Process.md). Every feature touches Engine, Content, and UI — or marks each N/A with rationale. One- or two-pillar designs are not forwarded to executors.
- **Definition of Done:** [CLAUDE.md → Definition of Done](../../CLAUDE.md) and [`UL/Process` → Definition of Done](../ubiquitous-language/Process.md). Non-negotiable closeout: commit with `Fixes THR-XX`, push, merge, deploy, update `project-status.md`, `project-history.md`, `changelog.md`, `wiring-checklist.md` (if new surfaces), systemic wiring guide (if new engine capabilities), every deferral becomes a Linear issue, every impediment goes to `Docs/impediments.md`.
- **Pre-commit gate:** [CLAUDE.md → Testing](../../CLAUDE.md). Always: `npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process`. Verification evidence (raw output) is mandatory in the closing commit body or completion comment.
- **Design Governance:** [CLAUDE.md → Design Governance](../../CLAUDE.md) and [`UL/Process` → Design Governance](../ubiquitous-language/Process.md). 8-step checklist (Step 0 grill-me through Step 8 present finished design). Steps 1–4 happen in a single internal pass — never present a non-compliant design.
- **Per-system required sections:** [CLAUDE.md → Per-system required sections](../../CLAUDE.md). Engine pillar, Content pillar, UI pillar, Wiring section, Constants table, Tracing, Fail-soft table.
- **Vision audit:** [`UL/Process` → Vision Audit](../ubiquitous-language/Process.md). Step 7 of Design Governance — if a Vision premise is contradicted, the `Vision/` edit is in the current ticket's scope, not a follow-up.
- **Wiring Checklist:** [`Docs/plans/wiring-checklist.md`](../plans/wiring-checklist.md). Updated as part of Definition of Done whenever new orchestrator phases, modals, GameState fields, trace categories, or player controls are added.
- **Systemic wiring guide:** [`Docs/plans/2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md). The 7 engine capabilities content authors must use. Read before any prose, encounter, or attachment authoring.

## Current spec — coordination

- **Coordination protocol (canonical):** [`Docs/plans/2026-04-13-linear-coordination-protocol.md`](../plans/2026-04-13-linear-coordination-protocol.md). The "Coordination Failure Modes — Hard Rules" section (Rules 1–9) explains why each constraint below is non-negotiable.
- **Three agents, two executor queues:** [CLAUDE.md → Cowork vs Claude Code](../../CLAUDE.md). Cowork designs and plans (no code, no git). CC and Codex are executors; both implement, both commit with `Fixes THR-XX`, both rely on the merge-to-main auto-close.
- **Queue separation (hard rule):** CC pulls **only** from Ready for Dev; Codex pulls **only** from Ready for Codex. Never query the other queue. Cowork chooses which queue an issue lands in based on fit (mechanical → Codex; judgment-heavy → CC). UL: [`Coordination` → Ready for Dev](../ubiquitous-language/Coordination.md), [`Coordination` → Ready for Codex](../ubiquitous-language/Coordination.md).
- **Claim-before-read:** [`UL/Coordination` → Claim-before-read](../ubiquitous-language/Coordination.md). First mutating call after selecting an issue is `save_issue(state: "In Dev", assignee: "me")`, then `get_issue(id)` to verify the write stuck (impediment #48 — silent state drops).
- **WIP limit = 1:** [`UL/Coordination` → WIP Limit](../ubiquitous-language/Coordination.md). Maximum 1 In Dev issue per executor across all sessions and worktrees. Parallel work happens on different issues.
- **Read latest comment first:** Reopened issues require reading all comments back to the original handoff before acting. The `Reopened` label is the explicit signal.
- **Cross-executor parallel:** before claiming, verify your candidate is in the other executor's `Parallel-safe with` list and not in their `Mutex with` list. UL: [`Coordination` → Parallel-safe](../ubiquitous-language/Coordination.md), [`Coordination` → Mutex](../ubiquitous-language/Coordination.md).
- **Merge-gated Done:** [`UL/Coordination` → Fixes THR-XX](../ubiquitous-language/Coordination.md), [`UL/Coordination` → In Dev](../ubiquitous-language/Coordination.md). Never call `save_issue(state: "Done")` manually. The commit body keyword `Fixes THR-XX` (or `Closes`/`Resolves`) on the merge to main is the only valid Done transition. Manual Done has caused premature closes of reopened issues.
- **Coordination Block (in every handoff):** [`UL/Coordination` → Coordination Block](../ubiquitous-language/Coordination.md). CC handoffs need `Suggested model` (with matching `model:*` label), `Parallel-safe with`, `Mutex with`. Codex handoffs additionally need `Files to touch` and `Done when`. Missing block = don't claim; bounce.
- **Pickup entrypoint (CC and Codex):** [`.claude/skills/pull-work/SKILL.md`](../../.claude/skills/pull-work/SKILL.md). Run `/pull-work` for the canonical safe-claim flow with verify-after-write, dirty-worktree fallback, and mutex check.

## Continuous improvement loop

- **Drift Scan:** [`UL/Process` → Drift Scan](../ubiquitous-language/Process.md). Weekly GitHub Action (`.github/workflows/drift-scan.yml`) runs four signals against `main` (coupling creep, broken-windows tally, test suite health, UL drift) and posts per-signal Linear issues with the `drift-scan` label in Continuous Improvement. Runs Fridays ~14:00 UTC.
- **Retrospective:** [`UL/Process` → Retrospective](../ubiquitous-language/Process.md). Weekly synthesis of `Docs/impediments.md` + `drift-scan`-labeled issues into `Docs/retrospectives/YYYY-MM-DD-retro.md`. Runs Fridays ~15:00 UTC, ~1 hour after drift scan, via the `weekly-retro` scheduled task or `/retrospective`. Implements quick wins inline; opens Linear issues for larger improvements.
- **Impediment log:** [`Docs/impediments.md`](../impediments.md). Mandatory for every session, every agent. Load `impediment-reporter` skill for format. Unlogged friction is invisible.
- **Sandbox limitations reference:** [CLAUDE.md → Known Sandbox Limitations](../../CLAUDE.md). Read before debugging environment failures — `rg` blocked in Codex, PowerShell scope leaks, `npm test` timeouts, Linear `save_issue` silent drops, Obsidian MCP unreachable, etc.
- **UL-proposal flow:** [`UL/Process` → UL-proposal](../ubiquitous-language/Process.md). When you encounter an undeclared concept or a UL-vs-source disagreement, open a Linear issue in Continuous Improvement labeled `UL-proposal` containing: proposed term + definition, where/why it was encountered (with quote), relationship to existing terms, content-adjacency assessment. Approval is always human — no auto-merge. UL wins on terminology disagreements.

## Plan-doc lifecycle

- **Plan authoring (Cowork):** plan docs land in `Docs/plans/YYYY-MM-DD-<topic>.md` with frontmatter `status: proposal | current | implementation-log | superseded | historical`. Cowork applies `plan-pending-commit` label to the corresponding Linear issue immediately after writing the file. The hourly `flush-plan-docs` scheduled task commits the file and removes the label — typically within 1 hour.
- **Cowork does not commit plan docs directly.** Move the issue to Ready for Dev / Ready for Codex as soon as the plan doc is written and the label is applied. Do not delay the handoff waiting for the commit.
- **Strategy plan:** [`Docs/plans/2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — the three-layer canonicality model (UL → Canon → Plans) this page is part of.
- **Domain Canon Page convention:** [`Docs/canon/README.md`](README.md). Schema, ownership, when to update.

## Authoring entrypoint

This Canon page has no domain-specific authoring skill — process is everyone's concern, not one role's. Load order at session start:

1. `Docs/ubiquitous-language/README.md` (always-load index, ~3k tokens)
2. This page — `Docs/canon/process.md` (process Step 0)
3. CLAUDE.md sections only when this page's pointer is not enough

The `pull-work` skill (CC, Codex) is the canonical pickup entrypoint and links back to this page.

## Active design plans

- [`2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — three-layer model (UL → Canon → Plans), Phase 2b in progress (THR-312/313/314/316).
- [`2026-04-13-linear-coordination-protocol.md`](../plans/2026-04-13-linear-coordination-protocol.md) — multi-executor coordination contract; the source-of-truth for the rules summarized above.
- [`2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md) — engine capabilities every content author must know about; cited from Design Governance.

## Rejected approaches (do not reintroduce)

- ❌ Manual `save_issue(state: "Done")` from an executor — replaced by merge-to-main auto-close on `Fixes THR-XX`. Manual Done caused premature closes of reopened issues and bypassed the merge-gated invariant.
- ❌ Cross-queue pickup — CC pulling Ready for Codex or Codex pulling Ready for Dev. Defeats the queue separation that exists to prevent collisions.
- ❌ Reading the plan doc before claiming — replaced by claim-before-read. Reading first lets two executors claim the same issue when both have it open in different windows.
- ❌ Cowork running `git add` / `git push` — Cowork is design and Linear only. Plan-doc commits go through the `plan-pending-commit` label and the hourly `flush-plan-docs` task.
- ❌ Triangulating canonical content across 6–12 files — replaced by Canon pages (this directory). The audit cost was the bottleneck; Canon pages collapse it to a single Step-0 read.
- ❌ Ad-hoc / out-of-band handoffs — replaced by Linear state transitions plus a Coordination Block in the handoff comment. The state transition is the handoff.
- ❌ Direct `git push origin main` — replaced by branch → PR → CI → merge since 2026-05-01. Branch protection rejects direct pushes.
- ❌ `--no-verify` / `--no-gpg-sign` to bypass hooks unless the user explicitly requests it. Investigate and fix the failing hook instead.

## Open questions

- **Plan archive sweep (Phase 3 of the canonical documentation strategy):** `Docs/plans/` holds 396+ files; Phase 3 introduces frontmatter-driven archival to keep the directory scannable. Pending pickup.
- **Drift signal coverage (Phase 4):** the strategy plan adds `lint-ul-vs-systems`, `lint-rejected-approaches`, and `lint-untagged-plans` to the existing weekly drift scan. Pending pickup.
- **`check:process` lint stabilization:** the workflow lint runs as advisory in pre-commit while it stabilizes. Threshold to flip to blocking is undecided.

## Last-reviewed

2026-05-06 by Cowork. Review trigger: monthly, or when CLAUDE.md's Process / Coordination / Documentation Strategy / Definition of Done sections change shape, or when any linked plan moves to `superseded`.
