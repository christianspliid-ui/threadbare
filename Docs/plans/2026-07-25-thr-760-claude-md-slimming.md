> **title:** `CLAUDE.md slimming pass — dedupe always-loaded context — THR-760`
> **linear_issue:** THR-760
> **author:** `Claude Code (design session, Fable)`
> **created:** 2026-07-25
> **status:** proposal
> **three_pillars:** Engine `N/A — process/docs-only` · Content `N/A — process/docs-only` · UI `N/A — process/docs-only`

# CLAUDE.md slimming pass — dedupe always-loaded context — THR-760

*Cut the always-loaded project CLAUDE.md from ~21k tokens to ~13k by relocating duplicated content to its authoritative home — without losing a single rule.*

## Why this is load-bearing

Anthropic's Claude 5 context-engineering guidance (https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models, reviewed with Christian 2026-07-25) says: keep CLAUDE.md lightweight and gotcha-focused; deliver everything else via progressive disclosure. Threadbare already has the progressive-disclosure architecture (canon pages, skills, UL shards, generated docs) — but CLAUDE.md never shrank as those surfaces were built, so it now carries ~21k tokens into **every** session, including ~24 automated sessions/day. Several sections have already drifted from their canonical counterparts (the Domain Skills table vs. the harness's own skill listing; scheduled-task fire times), which is the failure mode duplication always produces.

**This is a deduplication/relocation pass, not a rule-deletion pass.** Every rule ends up with exactly one authoritative surface; CLAUDE.md keeps pointers plus the content that genuinely must be always-loaded (gotchas, freshness table, load-bearing decisions, rejected approaches).

Measured section sizes (chars/4, 2026-07-25):

| Section | ~Tokens | Disposition |
|---|---|---|
| Session Workflow | 3,190 | partial move (scheduled-task registry) |
| Running the Prototype | 2,850 | partial trim (Debug Bridge examples) |
| Domain Skills | 2,150 | cut to routing policy |
| Design Governance | 2,110 | relocate full text to canon, keep pointer |
| Definition of Done | 2,010 | **keep — out of scope** |
| Documentation Strategy | 1,540 | partial move (vault conventions/scripts) |
| Session Types | 1,260 | **keep — out of scope** |
| Load-Bearing Decisions, Sandbox Limitations, Testing, Viewport, Rejected Approaches, rest | ~4,600 | **keep — out of scope** |

Expected result: **~8k tokens removed from CLAUDE.md (21k → ~13k)** plus retirement of the 0.6k-token global `~/.claude/CLAUDE.md`. (A further pass on Definition of Done / Session Types / Testing could reach ~10k, but those sections are deliberately out of scope here — see Notes for the executor.)

## The five work items

### 1. Scheduled-task registry → `Docs/ops/scheduled-tasks-registry.md` (new file)

Move from CLAUDE.md § Session Workflow → § Scheduled Tasks:

- The four lane tables (CC automation lane, GitHub Actions, Windows Task Scheduler lane, Cowork lane) with all surrounding prose (jitter note, reaper guardrails, output-surface rule, slot-allocation rules, prompt-mirror rule).
- The "Weekly continuous-improvement cycle (Fridays)" block may move with it (it is schedule documentation; `Docs/canon/process.md` § Continuous improvement loop already covers the loop itself).

CLAUDE.md keeps (~6 lines): a pointer to the new file, plus the two rules that must stay always-loaded because they gate live behavior in any session: (a) none of the report-writing tasks touch `Design/briefing.md` / `Design/user-actions.md` — `keep-work-flowing-cc` owns those; (b) when registering a new task, record cron + observed fire time in the registry file in the same commit.

Update in the same PR: any reference to "CLAUDE.md § Scheduled Tasks" in `.claude/skills/`, `Docs/ops/scheduled-task-prompts/` mirrors, and `Docs/` (grep for `Scheduled Tasks` and `slot allocation`). If a live scheduled-task prompt at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md` references the section, update it AND its repo mirror together (mirror rule).

### 2a. Design Governance → authority flips to `Docs/canon/process.md`

Today `Docs/canon/process.md` is a pointer page whose **targets are CLAUDE.md sections** ("the linked target is authoritative", line 15). For Design Governance, flip the direction:

- Move the full text of CLAUDE.md § Design Governance — intro paragraph, Three-Pillar Rule, the design-workflow checklist (Steps 0–8.6), **Per-system required sections**, and Maintenance-and-review bullets — into `Docs/canon/process.md` as a new `## Design Governance (authoritative)` section (or a linked `Docs/canon/design-governance.md` if process.md would exceed its ~200-line canon budget — executor's call; if a new file, process.md points at it).
- CLAUDE.md § Design Governance shrinks to ~8 lines: the Three-Pillar Rule one-liner, "never present a non-compliant design", and the pointer to the canon home.
- Update `Docs/canon/process.md` in the same PR — three specific lines (intent-judge findings, 2026-07-25):
  - **Line 15** ("Every section below is a pointer; the linked target is authoritative") becomes false once Design Governance is authoritative in place. Replace with a per-row convention: rows are pointers by default; rows marked **(authoritative here)** own their content. Mark the new Design Governance section accordingly.
  - **Line 23** (Design Governance pointer → CLAUDE.md) → repoint at the in-page authoritative section (or new canon file).
  - **Line 24** ("Per-system required sections" pointer → CLAUDE.md) → repoint the same way; that content is moving.
  - Bump the "Last-reviewed" note (this PR is exactly its stated review trigger).
- Update `.claude/skills/design-session/SKILL.md` — **two** references, not one: Step 1 (~line 65, "Follow the design-governance checklist in **CLAUDE.md § Design Governance**") and Step 2 (~line 87, "per CLAUDE.md § Per-system required sections") → both point at the new canon home. Grep for other references: `grep -rn "Design Governance\|Per-system required sections" .claude/skills/ Docs/ --include=*.md`.
- The plan-doc template (`Docs/plans/_template.md`) references "CLAUDE.md § Codesight" and "CLAUDE.md § Definition of Done" — those sections are NOT moving; leave them.

### 2b. Documentation Strategy → trim to routing

- Keep in CLAUDE.md: the four-surfaces list (Obsidian / .planning / Docs / canon), the Canon Pages table (it is Step-0 routing policy, the article's endorsed pattern), and the "why Canon pages exist" paragraph.
- Move out: the "Obsidian Vault as LLM Knowledge Base" subsection detail (three layers, infrastructure files, workflows table, maintenance-scripts table, **frontmatter conventions**) → these belong to `Docs/documentation-ownership.md` (already the declared ownership authority) and/or the vault skills (`vault-ingest` etc. already document their own workflows — executor should verify per item where it exists already and only move what has no home, deleting only true duplicates).
- CLAUDE.md keeps a 2-line pointer: vault work = filesystem via `OBSIDIAN_VAULT_PATH`, conventions in `Docs/documentation-ownership.md` + vault skills.

### 3. Domain Skills table → routing policy only

The harness now injects the full skill list with descriptions into every session, and each skill's `description:` frontmatter carries its own triggers — the 2.1k-token table is a drifting duplicate.

- Keep (~10 lines): the load-order policy that is NOT in any skill description — "always load `state-of-game-design` router first"; the prose-work order (wiring guide → prose skill choice); the hex-map load order (`hexmap-core` before layer work); UL always-active + UL wins; `impediment-reporter` always active; canon Step 0 for content authoring.
- Delete the per-skill rows. Before deleting, diff each row against the skill's own `description:` frontmatter; if a row carries trigger/when-to-load guidance absent from the skill file, move that text INTO the skill's description (skills are the authoritative home for their own triggers), bumping `last_validated_against` per the skill-edit rule.
- The "Creative fiction writing" row (platform `anthropic-skills:cw-*`, not in `.claude/skills/`) has no skill file to absorb it — keep that one line in CLAUDE.md.

### 4. Debug Bridge → pointer + load-bearing warnings

`src/debug-bridge.ts` / `src/debug-bridge.d.ts` are the typed, always-current API reference (the article's "prefer code references over prose descriptions").

- Keep in CLAUDE.md (~15 lines): the pointer to both files; the `window.__DEBUG.tick(n)` block **in full** (THR-689 — it is the sanctioned way to satisfy any "run N ticks" Done-when, and the `document.hidden` throttling rationale is a gotcha, not API docs); one-line index of capability areas (actions, aftermath, fog, encounter logs, prose QA, orphaned cards, outcome distribution, entity visuals, war readout) so sessions know what exists before opening the `.d.ts`.
- Delete the per-API example blocks (openDebugPanel, tracing, health, gotoAgent, listActions/fireAction, aftermath, fog, encounter log, proseQualityReport, listUnreachableActions, getOutcomeDistribution, resolveEntityVisual, getArmies/getBattles). **Precondition per API:** verify the deleted example's non-obvious behavioral notes (e.g. fireAction partial matching, aftermath pick defaulting, `getArmies` being a ground-truth unfiltered read) exist as JSDoc on the corresponding declaration in `src/debug-bridge.ts`/`.d.ts`; where missing, add the JSDoc in the same PR. **Note:** `src/` JSDoc additions are comment-only; run the standard gates, and confirm no wiki-manifest `sources` glob matches `src/debug-bridge*` (if one does, update that page or use the exemption line honestly).

### 5. Retire the global `~/.claude/CLAUDE.md`

`C:\Users\chris\.claude\CLAUDE.md` (71 lines, ~0.6k tokens) is generic "reduce LLM coding mistakes" guidance (think-before-coding, simplicity-first, surgical-changes, goal-driven-execution) — the genre the Claude 5 guidance explicitly retires, and its "if uncertain, ask" default conflicts with Threadbare's autonomous sessions. **Human gate satisfied via chat review 2026-07-25** (Christian approved the 5-item scope including this).

- The file is **outside version control**. Do not just delete it: archive its full content into `Docs/ops/retired-global-claude-md-2026-07-25.md` (header: what it was, why retired, date), commit that, THEN delete `C:\Users\chris\.claude\CLAUDE.md`.
- Note: this file applies to ALL of Christian's projects, not only Threadbare. Its content is generic coding-behavior guidance with no project-specific facts (verified 2026-07-25 — no other project is named in it), so retirement is safe cross-project. If the executor finds project-specific content has appeared in it since, stop and surface instead of deleting.

## Engine pillar

Engine: N/A — process/docs-only change; no engine code, tick phases, or graph types are touched. (Item 4 may add JSDoc comments to `src/debug-bridge.ts`/`.d.ts` — comment-only, no behavior.)

## Content pillar

Content: N/A — no encounter/prose/attachment/data content is touched.

## UI pillar

UI: N/A — no player-facing or debug surface changes. Browser-verify exempt: docs + comment-only change (state the exemption line in the commit body).

## Wiring

N/A — no modules added. The "wiring" of this change is reference integrity: every pointer updated in the same PR (see per-item grep lists above), verified by the reference sweep in Done-when.

## Constants table

N/A — no tunable numbers. (The token targets are acceptance measurements, not runtime constants.)

## Tracing

N/A — no runtime behavior.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A moved rule loses its inbound reference (skill/doc still points at a gone CLAUDE.md section) | Same-PR grep sweep per item (commands given above); Done-when includes a zero-dangling-references check |
| Global CLAUDE.md deletion loses content | Archived to `Docs/ops/retired-global-claude-md-2026-07-25.md` BEFORE deletion |
| process.md exceeds canon ~200-line budget after absorbing Design Governance | Sanctioned split: `Docs/canon/design-governance.md` with process.md pointing at it |
| A Domain Skills table row carries guidance absent from the skill file | Row text moves into the skill's `description:` before the row is deleted (per-row diff required) |
| Scheduled-task prompt (outside repo) references a moved section | Update live prompt + repo mirror together per the prompt-mirror rule |

## Blast Radius

N/A — no `src/` file with ≥100 importers is touched (`src/debug-bridge.ts` is a dev-only bridge, not in the high-impact list; changes are comment-only).

## Three-pillar check

- [x] Engine pillar present — N/A with rationale
- [x] Content pillar present — N/A with rationale
- [x] UI pillar present — N/A with rationale
- [x] Wiring section — N/A with rationale (reference-integrity sweep specified)

## Vision audit

- [x] This plan does not contradict any Vision premise — it touches no game design surface.

## Rulebook impact

- [x] This plan does not change a rule of play. `Docs/canon/rulebook*.md` untouched.

> Brainstorm companion: `Docs/plans/2026-07-25-thr-760-claude-md-slimming-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | N/A | no tunable numbers |
| 2. Inspectability | PASS | every relocation leaves a pointer; authority direction recorded in process.md; before/after token counts in closing evidence |
| 3. Determinism | N/A | no random code |
| 4. Fail-soft | PASS | see fail-soft table — archive-before-delete, grep sweeps, split escape hatch |
| 5. Narrative over mechanical perfection | N/A | no narrative surface |
| 6. Additive over destructive | PASS with note | text is deleted from CLAUDE.md, but every rule is relocated (not lost) and the global file is archived before deletion; the one true deletion is duplicate content whose authoritative copy is verified in the same PR |
| 7. Performance budget | PASS | net effect is a per-session context reduction (~8.6k tokens across ~24 automated sessions/day) |

## Done when

- [ ] `Docs/ops/scheduled-tasks-registry.md` exists with all four lane tables; CLAUDE.md § Scheduled Tasks is ≤10 lines
- [ ] Design Governance full text lives in `Docs/canon/process.md` (or `Docs/canon/design-governance.md`); CLAUDE.md § Design Governance is ≤10 lines; `design-session` skill Step 1 (~line 65) AND Step 2 (~line 87) point at the canon home
- [ ] Domain Skills table replaced by routing policy ≤15 lines; any row-only guidance moved into the owning skill's description
- [ ] Debug Bridge section ≤25 lines (pointer + `tick(n)` block + capability index); behavioral notes verified/added as JSDoc in `src/debug-bridge.ts`/`.d.ts`
- [ ] `C:\Users\chris\.claude\CLAUDE.md` archived to `Docs/ops/retired-global-claude-md-2026-07-25.md` and deleted
- [ ] Reference sweep clean: `grep -rn "CLAUDE.md § Design Governance\|CLAUDE.md § Scheduled Tasks\|§ Domain Skills\|§Debug Bridge\|§ Debug Bridge\|Per-system required sections" .claude/ Docs/ Design/` returns only intentional pointers (canon/registry files), no stale ones — **plus backstop pass:** `grep -rn "CLAUDE.md" .claude/skills/ Docs/canon/` reviewed line-by-line; every hit either targets a kept section or has been repointed
- [ ] Project CLAUDE.md ≤ ~58,000 chars (≈14.5k tokens). Baseline measured 2026-07-25 post-pull: **87,253 chars / 652 lines** via `(Get-Content CLAUDE.md -Raw).Length` — use the same command for the after-measurement; before/after numbers pasted in closing evidence
- [ ] `npm test` and `npx vite build` pass; `npm run check:typecheck` no increase; `npm run check:generated-freshness` and `npm run check:wiki-freshness` clean (or honest exemption line)
- [ ] Closing commit body includes `Fixes THR-760` and `Browser-verify exempt: docs + comment-only change`

## Kill criteria

If, within two weeks of merge, sessions demonstrably mis-follow a relocated rule — e.g. a design session skips the governance checklist because the pointer chain broke, or a scheduled-task change lands without updating the registry — the pointer is judged too weak for that rule: restore the affected section to CLAUDE.md verbatim (git revert of that hunk) and log the failure as an impediment for the retro. Detection surfaces: the weekly drift scan and the Wednesday workflow retro.

## Coordination block

**Suggested model:** opus — mostly mechanical relocation, but the per-row/per-API "verify the authoritative copy exists before deleting" checks need judgment (advisory; the automation runs Opus regardless).

**Parallel-safe with:** none recommended — CLAUDE.md is edited by many closeout flows; run solo.

**Mutex with:** any issue editing `CLAUDE.md`, `Docs/canon/process.md`, or `.claude/skills/design-session/SKILL.md` (this ticket restructures all three).

**Files to touch:**
- Create: `Docs/ops/scheduled-tasks-registry.md`, `Docs/ops/retired-global-claude-md-2026-07-25.md`, possibly `Docs/canon/design-governance.md`
- Edit: `CLAUDE.md` (five section rewrites), `Docs/canon/process.md` (absorb Design Governance; lines 15/23/24 per item 2a; bump Last-reviewed), `.claude/skills/design-session/SKILL.md` (Step 1 ~line 65 and Step 2 ~line 87 pointers), `Docs/documentation-ownership.md` (absorb vault conventions), skill `description:` frontmatter where table rows carry unique guidance, `src/debug-bridge.ts`/`.d.ts` (JSDoc only, as needed), scheduled-task prompt mirrors under `Docs/ops/scheduled-task-prompts/` if they reference moved sections
- Delete (outside repo, after archiving): `C:\Users\chris\.claude\CLAUDE.md`

## Notes for the executor

- **Relocate, don't delete.** The test for every removed paragraph: name the file where its content now authoritatively lives. If you can't, it stays in CLAUDE.md.
- **Do NOT touch** (explicitly out of scope, keep verbatim): Definition of Done, Session Types, Testing, Known Sandbox Limitations, Viewport Contract, Load-Bearing Architectural Decisions, Rejected Approaches, Non-Functional Priorities, Debugging Protocol, Change Audit Trail, Codesight section, the freshness-signal table, Key Links. A follow-up ticket may consider DoD/Session Types — not this one.
- The ~13k landing point is the honest target for this scope; do not chase 8–10k by cutting kept sections.
- `Docs/canon/process.md` "Last-reviewed" says review is triggered "when CLAUDE.md's Process … sections change shape" — this PR is exactly that trigger; bump the date with a one-line note.
- The Claude 5 article also endorses what Threadbare already does (canon pages, skills, auto-memory, generated references) — no action needed on those; this ticket is the only follow-up from the 2026-07-25 review.

## Forked-audit verdicts

**Design-audit-pipeline skipped with rationale** (per design-session Step 3 escape hatch): all three audit axes are N/A for this change — no NFP-relevant runtime behavior (docs + comment-only), no game pillars (process surface only), no Vision surface (no player-facing or design-direction content). Intent-judge verdict below is the gate that ran.

### Intent-judge verdict

**Verdict: Allow** (round 2 of 2; round 1 = Revise) · **Impact class: High-risk** (explicit user sign-off present — Christian's verbatim "yes" to the 5-item scope, chat 2026-07-25) · Judge: cold-context Opus subagent, 2026-07-25.

Round 1 (Revise) found: the Done-when reference sweep was blind to the two live "Per-system required sections" inbound pointers (`Docs/canon/process.md:24`, `.claude/skills/design-session/SKILL.md:87`), the `process.md:15` authority-convention flip was unnamed in the plan, the size baseline was stale (84,756 vs measured 87,253 chars), kill criteria were absent from the plan doc, and impact class was under-declared. All seven required actions were applied and re-verified by the judge against repo ground truth.

Round 2 per-dimension: intent fidelity PASS (five items map 1:1 onto the approved scope; no widening during revision); three-pillar PASS (N/A with rationale); wiring/reference-integrity PASS (cured — extended grep + line-by-line backstop `grep -rn "CLAUDE.md" .claude/skills/ Docs/canon/`); NFP PASS; Vision PASS; UL PASS; rejected-approaches PASS; load-bearing decisions PASS; blast radius PASS (N/A correct); kill criteria PASS (baseline independently re-measured: 87,253 chars / 652 lines); substrate N/A. Zero GAPs, zero VIOLATIONs → Allow.

Judge advisories (resolved in this doc): Done-when and Files-to-touch now name both `design-session` references. Remaining executor note from the judge, carried verbatim: *"the plan's quality now rests on the reference sweep being run as written, including the line-by-line backstop pass. That sweep is the single control preventing a design session from following a pointer to a section that no longer exists."* Second advisory stands: if the executor takes the `Docs/canon/design-governance.md` split path, `process.md:15`'s original claim stays true and the "(authoritative here)" marker becomes unnecessary rather than wrong.

Judge instrumentation note (for a future skill edit, not this ticket): intent-judge SKILL.md Procedure step 8 (append to `Docs/judge-metrics/`) contradicts its own hard rule "Never edits any file"; the judge followed the hard rule both rounds.
