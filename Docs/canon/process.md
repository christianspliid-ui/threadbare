---
domain: process
last_reviewed: 2026-05-06
reviewer: cowork
ul_shards: [Process, Coordination]
status: live
---

# Canon — Process

> The process canon is the meta-canon every design session benefits from. It is the navigation layer over CLAUDE.md, the Process and Coordination UL shards, and the coordination protocol — answering "what governs how we ship?" without forcing every session to re-read 600 lines of CLAUDE.md.

## How to use this page

Load this page once at session start instead of re-reading the corresponding CLAUDE.md sections. Every section below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled issue.

Most pointers still target CLAUDE.md. One target now lives in canon instead: **Design Governance** (and the Per-system required sections it owns) moved to [`design-governance.md`](design-governance.md) in THR-760 — CLAUDE.md points *there*. Don't "fix" that direction back.

## Current spec — pointers

- **NFPs (in priority order):** [CLAUDE.md → Non-Functional Priorities](../../CLAUDE.md) and [`UL/Process` → Non-Functional Priority](../ubiquitous-language/Process.md). Authoritative ordering: Tunability → Inspectability → Determinism → Fail-soft → Narrative > mechanical → Additive > destructive → Performance budget. Higher-numbered NFPs yield to lower-numbered ones in tension.
- **Three-Pillar Rule:** [CLAUDE.md → Three-Pillar Rule](../../CLAUDE.md) and [`UL/Process` → Three-Pillar Rule](../ubiquitous-language/Process.md). Every feature touches Engine, Content, and UI — or marks each N/A with rationale. One- or two-pillar designs are not forwarded to executors.
- **Definition of Done:** [CLAUDE.md → Definition of Done](../../CLAUDE.md) and [`UL/Process` → Definition of Done](../ubiquitous-language/Process.md). Non-negotiable closeout: commit with `Fixes THR-XX`, push, merge, deploy, update `project-status.md`, `project-history.md`, `changelog.md`, `wiring-checklist.md` (if new surfaces), systemic wiring guide (if new engine capabilities), every deferral becomes a Linear issue, every impediment goes to `Docs/impediments.md`.
- **Pre-commit gate:** [CLAUDE.md → Testing](../../CLAUDE.md). **Two tracks since THR-917 — classify the diff first.** `git diff --name-only origin/main...HEAD | grep -vE '(\.md$|^Docs/|^Design/|^\.planning/|^src/data/ul-dashboard\.generated\.json$|^public/system-interface-map-reference\.html$)'` (or run **`npm run classify:diff`**, THR-988): empty means docs-only, which owes only `check:generated-freshness`, `lint:plan-doc`, and `check:impediment-ids`. A **code** diff owes the full gate: `npm test`, `npx vite build`, `npm run check:process`. The predicate matches CI's own `detect` filter, which skips the whole `Test · Typecheck · Build` job on docs-only PRs — so running the suite on markdown is stricter than every gate it exists to pre-empt. The two trailing exact paths are **generated from documentation** but written outside the doc paths (THR-922), so without them a UL-shard or canon-page edit regenerates a `src/` file and a pure documentation deliverable pays the full code gate. **The doc-validating gates do run in CI (THR-909, shipped 2026-08-01, PR #1210):** `check:generated-freshness`, `check:impediment-ids`, and `check:wiki-freshness:blocking` moved out of the code-gated job into their own **`Docs gates`** job, fired on `docs == 'true' && code != 'true'` — so exactly one of the two jobs runs them and never neither. It is a **required** status check on `main` (ruleset `15479914`, enforcement `active`, THR-931), so a red one blocks the merge on its own. Run them locally anyway: they take seconds, and catching a duplicate id before the push beats catching it after. **Not** `npx tsc --noEmit` — it is a no-op here (root `tsconfig.json` has `files: []`), so citing its exit 0 is gate theater (THR-686). The type gate is **`npm run check:typecheck`**, a ratchet (THR-693): it runs `tsc -b --force` and fails only when the error count *rises* above the committed `typecheck-baseline.json`, so the ~3.5k pre-existing errors are not yours to fix. CI's `Test · Typecheck · Build` runs the identical command, so a local pass means CI passes. If you legitimately change the count, refresh with `-- --update`, commit the baseline, and **re-run the ratchet last**, immediately before `git push` — `--update` snapshots the tree at the instant it runs, so anything written afterwards (most often the change's own tests) is measured against a baseline that predates it. That makes it the third tree-diffing gate alongside `check:generated-freshness` and `check:wiki-freshness:blocking`, and all three run **after** the closeout edits rather than at their numbered positions (THR-896, THR-976). Verification evidence (raw output) is mandatory in the closing commit body or completion comment.
- **Design Governance:** [`Docs/canon/design-governance.md`](design-governance.md) — **authoritative** since THR-760 (2026-07-26); CLAUDE.md now points here, not the reverse. Also [`UL/Process` → Design Governance](../ubiquitous-language/Process.md). 8-step checklist (Step 0 grill-me through Step 8 present finished design). Steps 1–4 happen in a single internal pass — never present a non-compliant design.
- **Per-system required sections:** [`Docs/canon/design-governance.md` → Per-system required sections](design-governance.md). Engine pillar, Content pillar, UI pillar, Wiring section, Constants table, Tracing, Fail-soft table.
- **Vision audit:** [`UL/Process` → Vision Audit](../ubiquitous-language/Process.md). Step 7 of Design Governance — if a Vision premise is contradicted, the `Vision/` edit is in the current ticket's scope, not a follow-up.
- **Interface map (cross-system contracts):** [`Docs/canon/interface-map.md`](interface-map.md) (protocol) + [`Docs/canon/interface-map.generated.md`](interface-map.generated.md) (generated rows). Design-workflow **Step 0.7**: enumerate the contracts a plan touches and carry an `## Interface impact` table. Classification is downgrade-only — 🟢 LIVE requires dated human verification, never a passing grep. A 🔴 LEAKED contract without a remediation ticket fails the build.
- **Wiring Checklist:** [`Docs/plans/wiring-checklist.md`](../plans/wiring-checklist.md). Updated as part of Definition of Done whenever new orchestrator phases, modals, GameState fields, trace categories, or player controls are added.
- **Systemic wiring guide:** [`Docs/plans/2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md). The 7 engine capabilities content authors must use. Read before any prose, encounter, or attachment authoring.

## Current spec — coordination

- **Coordination protocol (canonical):** [`Docs/plans/2026-04-13-linear-coordination-protocol.md`](../plans/2026-04-13-linear-coordination-protocol.md). The "Coordination Failure Modes — Hard Rules" section (Rules 1–10) explains why each constraint below is non-negotiable.
- **Two session types, one executor queue:** [CLAUDE.md → Session Types: Design vs Execution](../../CLAUDE.md). All work runs in Claude Code; a design session authors plan docs and hands off, an execution session implements, commits with `Fixes THR-XX`, and relies on the merge-to-main auto-close. (Codex and the second `Ready for Codex` queue were retired 2026-06-23, THR-486; Cowork was retired from the Threadbare workflow 2026-07-21, THR-654.)
- **One executor queue:** CC pulls from Ready for Dev (`assignee:null`, sorted by priority in memory). UL: [`Coordination` → Ready for Dev](../ubiquitous-language/Coordination.md).
- **Claim-before-read:** [`UL/Coordination` → Claim-before-read](../ubiquitous-language/Coordination.md). First mutating call after selecting an issue is `save_issue(state: "In Dev", assignee: "me")`, then `get_issue(id)` to verify the write stuck (impediment #48 — silent state drops).
- **WIP limit = 1:** [`UL/Coordination` → WIP Limit](../ubiquitous-language/Coordination.md). Maximum 1 In Dev issue across all sessions and worktrees. Parallel work happens on different issues.
- **Read latest comment first:** Reopened issues require reading all comments back to the original handoff before acting. The `Reopened` label is the explicit signal.
- **Concurrent-session parallel:** before running a second issue alongside an active one, verify your candidate is in the other issue's `Parallel-safe with` list and not in its `Mutex with` list. UL: [`Coordination` → Parallel-safe](../ubiquitous-language/Coordination.md), [`Coordination` → Mutex](../ubiquitous-language/Coordination.md).
- **Merge-gated Done:** [`UL/Coordination` → Fixes THR-XX](../ubiquitous-language/Coordination.md), [`UL/Coordination` → In Dev](../ubiquitous-language/Coordination.md). Never call `save_issue(state: "Done")` manually. The `Fixes THR-XX` (or `Closes`/`Resolves`) keyword in the commit body **and PR body** on the merge to main transitions the issue straight to Done — the only valid Done transition (THR-487). Manual Done has caused premature closes of reopened issues.
- **Coordination Block (in every handoff):** [`UL/Coordination` → Coordination Block](../ubiquitous-language/Coordination.md). Every handoff needs `Suggested model` (advisory — the CC automation runs Opus regardless), `Parallel-safe with`, `Mutex with`. Missing block = don't claim; bounce.
- **Pickup entrypoint (CC):** [`.claude/skills/pull-work/SKILL.md`](../../.claude/skills/pull-work/SKILL.md). Run `/pull-work` for the canonical safe-claim flow with verify-after-write and dirty-worktree fallback.
- **A `SKIPPED` required check satisfies branch protection — accepted, conditional on the guard:** [`Docs/plans/2026-07-29-thr-842-skipped-required-check-verdict.md`](../plans/2026-07-29-thr-842-skipped-required-check-verdict.md) (THR-842). GitHub has no setting to change this, and the skip is *load-bearing* — docs-only PRs must stay fast. The rule is that a skip may only ever come from a **decision**, never from an **absence**. The discriminator is the gating job: `Detect code changes` reading `success` means the path filter chose to skip (benign); anything else means the required check never inspected the change, and the `Guard — change detection health` step in [`ci.yml`](../../.github/workflows/ci.yml) fails it closed (THR-768). Never audit a skip by reading the required check's own conclusion. Force a full gate run on `main` with `workflow_dispatch` on `ci.yml` rather than inventing a code change.

## User review interface (Christian)

Christian's interface to the development system is **chat only, plain language only** (settled 2026-07-04, THR-608). Full rationale: [`Docs/plans/2026-07-04-user-review-interface.md`](../plans/2026-07-04-user-review-interface.md). Five hard rules:

1. **No diff/PR review by Christian.** A Done-when like "diff-reviewed by Christian" is invalid. When human sign-off is genuinely needed, the agent presents a plain-language chat summary (what changed, why, what could be lost, a recommendation) and asks a single yes/no question. Chat approval satisfies the gate; record `human gate satisfied via chat review <date>` as a Linear comment so the executor may merge.
2. **Christian does not read Linear.** Linear is the agents' coordination surface, not a channel to the user. Anything needing his attention is surfaced in `Design/briefing.md` / `Design/user-actions.md` (refreshed hourly by `keep-work-flowing-cc`) and reviewed in an interactive chat session. A Linear comment addressed to Christian reaches no one. Both files live on the `ops` branch since THR-947 — `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`; `main` carries pointer stubs.
3. **Technical assessments are agent verdicts.** CI/CD state, git forensics, merge mechanics, not-a-defect determinations, sandbox issues: the agent decides, acts (e.g. Cancel with a closing comment), and records the reasoning on the issue. Only creative/product/design-vision decisions go to Christian, framed in game terms. Codified as coordination-protocol Rule 10.
4. **An agreed outcome delegates its consequences (Christian, 2026-08-12).** When work already agreed — a shipped design, a locked format, a quality bar with a stated purpose — forces a code or test change, the agent makes the change; the gate is verifying the agreed outcome survives, not asking permission to act on it. Two named cases from the ruling:
   - **Gate/test calibration is implementation, not creative standards.** An agent may retune or restructure a check whose verdict has drifted from its stated purpose (the motivating case: THR-1092, a documented *ranking signal* wired as a hard gate, failing prose for the very domain vocabulary its subject requires). Do it with open eyes: state in the closeout what the check exists to protect, show the before/after corpus numbers, and keep the check aligned with that purpose. Christian's words: *"it is ok for an agent to modify the test as long as it is done with open eyes and the test is still well aligned with the outcome. we can always fix it if it drifts too much."* Drift is an accepted risk the weekly retro watches — not a reason to block.
   - **Design-consequence code changes carry no chat gate.** When the fork is only *how* to honor an agreed outcome (the motivating case: THR-998, which mechanism makes the risk word truthful), the executor validates the agreed outcome is kept sacred, picks a remedy, records the pick and reasoning on the issue, and proceeds. Christian's words: *"can the agent validate the design outcome is kept sacred while doing the change, just do it."*

   The escalation test is **not** "does this set a standard?" — most fixes do — but "is this a fork in what the game should *mean*, with no agreed outcome to test against?" A ticket author writing "this needs a decision" does not make it *Christian's* decision (the THR-1071 precedent). When genuinely unsure, present the decision as **made, with an invitation to veto** — never as a blocking question.

5. **Gameplay review waits for a level system (Christian, 2026-08-13).** His words: *"i cannot evaluate gameplay before all elements of a system has been brought up to the same level. data, ui, content, logic."* A "take a look at X" addressed to Christian is valid only when **every element of the system under review — data, logic, content, and UI — has shipped to the surface he will look at**. A system with new UI rendering old content (or new content behind an unmerged engine PR) is *not reviewable* and must not be framed as if it were. Two obligations follow:
   - **Every review ask names its completeness.** The briefing, an executor closeout, or a chat summary that invites Christian to look at a surface states which elements are at level and which are not. If any element lags, the ask is not a review ask — it is at most a *labeled partial preview* ("UI only; content lands with THR-XXXX"), and it never asks him to judge gameplay.
   - **The review ask fires once, when the last element lands** — not once per pillar as pieces merge. The lane that would surface "X is ready for your eyes" checks the system's full chain (engine merged, content authored against the new shape, UI rendering it, data migrated) before saying so. The motivating case: the 2026-08-13 aftermath look, where THR-1082's new chip language was visible on a PR preview while THR-1097's content rewrite had not started — the surface invited a gameplay judgment it could not support, and diagnosing *why it looked half-done* cost a session pass that one completeness line would have saved.

## Continuous improvement loop

- **Drift Scan:** [`UL/Process` → Drift Scan](../ubiquitous-language/Process.md). Weekly GitHub Action (`.github/workflows/drift-scan.yml`) runs four signals against `main` (coupling creep, broken-windows tally, test suite health, UL drift) and posts per-signal Linear issues with the `drift-scan` label in Continuous Improvement. Runs Fridays ~14:00 UTC.
- **Retrospective:** [`UL/Process` → Retrospective](../ubiquitous-language/Process.md). Weekly synthesis of `Docs/impediments.md` + `drift-scan`-labeled issues into `Design/retros/retro-YYYY-MM-DD.md`. Runs Fridays ~15:00 UTC, ~1 hour after drift scan, via the `weekly-retro` scheduled task or `/retrospective`. Implements quick wins inline; opens Linear issues for larger improvements.
- **Impediment log:** [`Docs/impediments.md`](../impediments.md). Mandatory for every session, every agent. Load `impediment-reporter` skill for format. Unlogged friction is invisible.
- **Sandbox limitations reference:** [CLAUDE.md → Known Sandbox Limitations](../../CLAUDE.md). Read before debugging environment failures — `rg` blocked/absent in the agent sandbox, PowerShell scope leaks, `npm test` timeouts, Linear `save_issue` silent drops, Obsidian MCP unreachable, etc.
- **UL-proposal flow:** [`UL/Process` → UL-proposal](../ubiquitous-language/Process.md). When you encounter an undeclared concept or a UL-vs-source disagreement, open a Linear issue in Continuous Improvement labeled `UL-proposal` containing: proposed term + definition, where/why it was encountered (with quote), relationship to existing terms, content-adjacency assessment. Approval is always human — no auto-merge. UL wins on terminology disagreements.

## Plan-doc lifecycle

**Two stages, and which one an artifact is in determines which rules apply to it** (THR-918). Authoritative detail: [`.claude/skills/design-session/SKILL.md`](../../.claude/skills/design-session/SKILL.md) § Two lifecycle stages.

| | **Exploratory** | **Committed** |
|---|---|---|
| Where | Obsidian vault — `Brainstorms/YYYY-MM-DD-<topic>.md` | `Docs/plans/YYYY-MM-DD-<topic>.md` |
| How written | filesystem via `OBSIDIAN_VAULT_PATH` — no git, no PR, no CI | `docs/plan-*` PR, CI-gated, merged immediately |
| Governance | **none applies** — every gate binds an artifact the executor acts on | full: `lint:plan-doc`, intent-judge, design-audit, three-pillar |
| Linear line | `**Draft:** \`Brainstorms/….md\`` | `**Plan doc:** \`Docs/plans/….md\`` |
| Durability | **not git-backed** — no history, no recovery. Accepted for exploration. | versioned |

- **Telling them apart:** read the path. A `Brainstorms/` path is exploratory and owes nothing; a `Docs/plans/` path is committed and owes everything. There is no third state and no partial application of the gates.
- **The promotion trigger is exactly one event:** the issue is about to move toward Ready for Dev. Not length, not confidence, not session count. Promotion writes the plan doc *and* its Brainstorm companion from the draft, then runs the gates; the vault draft stays in place as the iteration record (`status: complete`) — canon pages cite drafts this way already (e.g. [`cosmology.md`](cosmology.md) cites `Brainstorms/brainstorm-cosmological-symmetry.md`).
- **Where the other two design artifacts sit, so a session reading only this page knows (THR-944).** The **grill-me synthesis** is *exploratory* — `Brainstorms/YYYY-MM-DD-<topic>-grill-me.md`, vault-only, never promoted as its own committed file. grill-me runs before a plan doc exists, on work that is still open, so it is exploratory by construction; at promotion its surviving conclusions ride the plan doc's argument rather than shipping as a second copy of them. The **intent-proposal** (`Docs/plans/.intent-proposals/<slug>.md`) is *committed* — it is authored at design-session Step 3, after the plan doc exists, as the input to a gate that runs on the committed artifact. That is not an exception to the rule; it is the rule applied to an artifact whose stage really is committed. Authoritative: [`design-governance.md`](design-governance.md) Step 0.
- **Committed docs did not get cheaper.** THR-918 removed ceremony from *thinking* only; everything below this line is unchanged.
- **Plan authoring (design session):** plan docs land in `Docs/plans/YYYY-MM-DD-<topic>.md` with frontmatter `status: proposal | current | implementation-log | superseded | historical`. The design session commits the file directly via its own `docs/plan-*` PR — CI-gated, merged immediately.
- **Hand off as soon as the plan doc is written.** Move the issue to Ready for Dev with the coordination block; do not delay the handoff waiting for the plan-doc PR to merge.
- **Strategy plan:** [`Docs/plans/2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — the three-layer canonicality model (UL → Canon → Plans) this page is part of.
- **Domain Canon Page convention:** [`Docs/canon/README.md`](README.md). Schema, ownership, when to update.

## Authoring entrypoint

This Canon page has no domain-specific authoring skill — process is everyone's concern, not one role's. Load order at session start:

1. `Docs/ubiquitous-language/README.md` (always-load index, ~3k tokens)
2. This page — `Docs/canon/process.md` (process Step 0)
3. CLAUDE.md sections only when this page's pointer is not enough

The `pull-work` skill (CC) is the canonical pickup entrypoint and links back to this page.

## Active design plans

- [`2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — three-layer model (UL → Canon → Plans), Phase 2b in progress (THR-312/313/314/316).
- [`2026-04-13-linear-coordination-protocol.md`](../plans/2026-04-13-linear-coordination-protocol.md) — single-executor coordination contract; the source-of-truth for the rules summarized above.
- [`2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md) — engine capabilities every content author must know about; cited from Design Governance.

## Rejected approaches (do not reintroduce)

- ❌ Manual `save_issue(state: "Done")` from an executor — replaced by merge-to-main auto-close on `Fixes THR-XX`. Manual Done caused premature closes of reopened issues and bypassed the merge-gated invariant.
- ❌ Two-executor / two-queue model (CC + Codex, Ready for Dev + Ready for Codex) — retired 2026-06-23 (THR-486). The coordination tax dominated the friction log; collapsed to a single CC executor pulling one queue.
- ❌ Reading the plan doc before claiming — replaced by claim-before-read. Reading first lets two sessions claim the same issue when both have it open in different windows.
- ❌ The `plan-pending-commit` label + hourly `flush-plan-docs` task for landing plan docs — retired 2026-07-21 (THR-654) with the Cowork lane that needed it. A design session commits its own plan doc via a `docs/plan-*` PR.
- ❌ A second skill tree at `.agents/skills/` mirrored by `check:skill-sync` — retired 2026-07-21 (THR-654). `.claude/skills/` is the only tree.
- ❌ Triangulating canonical content across 6–12 files — replaced by Canon pages (this directory). The audit cost was the bottleneck; Canon pages collapse it to a single Step-0 read.
- ❌ Ad-hoc / out-of-band handoffs — replaced by Linear state transitions plus a Coordination Block in the handoff comment. The state transition is the handoff.
- ❌ Direct `git push origin main` — replaced by branch → PR → CI → merge since 2026-05-01. Branch protection rejects direct pushes.
- ❌ `--no-verify` / `--no-gpg-sign` to bypass hooks unless the user explicitly requests it. Investigate and fix the failing hook instead.

## Open questions

- **Plan archive sweep (Phase 3 of the canonical documentation strategy):** `Docs/plans/` holds 396+ files; Phase 3 introduces frontmatter-driven archival to keep the directory scannable. Pending pickup.
- **Drift signal coverage (Phase 4):** the strategy plan adds `lint-ul-vs-systems`, `lint-rejected-approaches`, and `lint-untagged-plans` to the existing weekly drift scan. Pending pickup.
- **`check:process` lint stabilization:** the workflow lint runs as advisory in pre-commit while it stabilizes. Threshold to flip to blocking is undecided.

## Last-reviewed

2026-08-01 (THR-918 — § Plan-doc lifecycle now carries the exploratory/committed two-stage table and the promotion trigger; the vault is the exploratory home, `Docs/plans/` the committed one). Previously 2026-07-29 (THR-842 — recorded the verdict on a `SKIPPED` required check satisfying branch protection under § Current spec — coordination; the guard shipped in THR-768 and the residual risk is accepted). Previously 2026-07-26 (THR-760 CLAUDE.md slimming — Design Governance + Per-system required sections repointed to `design-governance.md`, which is now authoritative; scheduled-task registry moved to `Docs/ops/scheduled-tasks-registry.md`; vault conventions moved to `Docs/documentation-ownership.md`. Previously 2026-07-21 THR-654 demolition pass; originally 2026-05-06). Review trigger: monthly, or when CLAUDE.md's Process / Coordination / Documentation Strategy / Definition of Done sections change shape, or when any linked plan moves to `superseded`.
