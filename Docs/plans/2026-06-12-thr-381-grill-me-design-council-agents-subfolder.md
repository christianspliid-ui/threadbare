> **title:** Move grill-me and design-council role-prompts into `agents/` subfolders — THR-381
> **linear_issue:** THR-381
> **author:** Cowork
> **created:** 2026-06-12
> **three_pillars:** Engine `N/A — skill-infrastructure refactor, no engine code touched` · Content `N/A — no content tables touched` · UI `N/A — no UI surfaces touched`

# Move grill-me and design-council role-prompts into `agents/` subfolders — THR-381

*Bring two design-loop skills up to the encounter-pipeline pattern: move inline role-prompts onto disk so the orchestrator references file paths instead of reconstructing prompts from prose every time.*

## Why this is load-bearing

`encounter-pipeline` already proves the pattern: heavy fork-prompts live in `agents/*.md` (`draft-prompt.md`, `editorial-prompt.md`, `implementation-prompt.md`, `systems-prompt.md`), and the orchestrator SKILL.md stays thin. Both `grill-me` and `design-council` carry their role-prompts inline in SKILL.md today, which has three concrete costs:

1. **Context burn at orchestration time.** Every Cowork session that loads `design-council` pulls 13.8 KB of role prompts into its working context whether or not those roles fire. With the `agents/` pattern, the orchestrator loads a thin SKILL.md and only forked subagents pay the prompt cost — and each pays only for the role it plays.
2. **No on-disk reuse from other skills.** `game-design-direction` § pre-design debate names the same four perspectives (content / engine / coordination / state-of-product) but cannot reference them via file path. Once role-prompts are on disk under stable names, other skills (incl. THR-378 `design-audit-pipeline`) can read them directly.
3. **The orchestrator and the prompt diverge.** Inline prompts get edited as prose — paragraphs get added, intent shifts, no test holds the prompt to its original shape. Once on disk and named, edits are explicit and reviewable.

THR-376 (QW bundle) already shipped the parallel move for *templates* (`reference/` subfolder for `game-design-direction` and the `design-council` page-template). THR-381 is the role-prompt half of that same pattern split. Together they bring both skills to the encounter-pipeline structure: `agents/` for fork-prompts, `reference/` for static templates / structures.

This is also the prerequisite the audit (`Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md`) calls out for MT-2 (THR-378 — fork plan-finalization audit into NFP / three-pillar / Vision subagents). The auditor subagents need stable file-path references to read; otherwise the orchestrator hand-rolls prompts again.

## Engine pillar

Engine: N/A — skill-infrastructure refactor. No `src/engine/`, `src/types/`, or tick-loop file is touched. No graph nodes / edges / phases / PRNG involvement.

## Content pillar

Content: N/A — no encounter templates, prose tables, attachment content, or world-model.json data touched.

## UI pillar

UI: N/A — no `src/components/`, `src/views/`, `src/hooks/`, or HexMapV2 surface touched. No player-facing display, notification, debug surface, or hex-map signifier introduced.

## Wiring

Wiring: N/A — no runtime modules. The only "wiring" is **SKILL.md ↔ role-prompt file** — each SKILL.md replaces an inline section with a one-line `See: agents/<file>.md` pointer, matching how `encounter-pipeline/SKILL.md` already points at its `agents/*.md` files.

Skill-tree mirror discipline applies (CLAUDE.md § Skill Tree Layout):

| Skill | Canonical | Mirror | Notes |
|-------|-----------|--------|-------|
| `grill-me` | `.claude/skills/grill-me/` | `.agents/skills/grill-me/` | Shared skill — pre-commit hook will block on drift; mirror via `npm run check:skill-sync:sync` |
| `design-council` | `.agents/skills/design-council/` | none | `.agents/`-only by design (see CLAUDE.md and THR-382/MT-6 for the still-open mirror decision). No `.claude/` copy. |

## Constants table

N/A — no tunable game values introduced. The grill-me question budget constants (`GRILL_ME_MIN_QUESTIONS = 8`, `GRILL_ME_DEFAULT_QUESTIONS = 27`, `GRILL_ME_MAX_QUESTIONS = 50`) already exist in SKILL.md and stay there — they are orchestrator-level configuration, not role-prompt content.

## Tracing

N/A — no runtime traces. Skill-files are read by Claude itself, not emitted as engine traces.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `agents/<role>.md` missing or unreadable when an orchestrator session tries to load it | Orchestrator logs the missing path inline in chat and falls back to the on-disk historical version in git (`git log --follow` recovery). No silent fallback to a stale prompt. Skill is fine for the rest of the session because skill files are read on demand, not on session start. |
| Mirror drift between `.claude/skills/grill-me/agents/` and `.agents/skills/grill-me/agents/` | Pre-commit hook (`npm run check:skill-sync`) blocks the commit. Sync via `npm run check:skill-sync:sync`. |
| SKILL.md line-count not reduced after refactor (regression check) | The "Done when" criterion below pins minimum line reductions per file. CC reads the file after the edit; if SKILL.md still contains inlined content the diff did not move, restart the edit. |

## Blast Radius

N/A — no `src/` files touched. CLAUDE.md § Blast Radius rule applies only when files with ≥100 importers are modified. This change touches `.claude/skills/`, `.agents/skills/`, and `Docs/` only.

## Three-pillar check

- [x] Engine pillar present — declared `N/A — skill-infrastructure refactor, no engine code touched`
- [x] Content pillar present — declared `N/A — no content tables touched`
- [x] UI pillar present — declared `N/A — no UI surfaces touched`
- [x] Wiring section connects them — covered by the mirror-discipline table

## Vision audit

- [x] This plan does not contradict any Vision premise. Vision/ pages describe game-experience direction; this is internal tooling.

## Rulebook impact

- [x] This plan does not change a rule of play. Rulebook is unaffected.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | No tunable game values introduced. Existing grill-me constants stay where they are. |
| 2. Inspectability | PASS with note | Improves inspectability: forking a role-prompt is observable as a file read in the orchestrator's tool log, where today it is invisible. |
| 3. Determinism | PASS | No PRNG. No runtime randomness affected. |
| 4. Fail-soft | PASS | Missing role-prompt files surface as explicit errors in the orchestrator, not silent failures. See fail-soft table above. |
| 5. Narrative over mechanical perfection | N/A | No narrative or mechanical surface touched. |
| 6. Additive over destructive | PASS with note | Move (cut + paste with one-line redirect), not delete. Original content remains in git history; SKILL.md retains a `See: agents/<file>.md` pointer. |
| 7. Performance budget | N/A | No profiling needed — file moves and orchestrator-level changes only. |

## Done when

*Closing commit must include `Fixes THR-381` and verification evidence per CLAUDE.md § Definition of Done.*

- [ ] `.claude/skills/grill-me/agents/grill-question-patterns.md` exists, contains the "Question Design Rules" + "I Don't Know Handling" sections currently inline in SKILL.md (lines 73-97)
- [ ] `.claude/skills/grill-me/agents/synthesis-prompt.md` exists, contains the "Synthesis Artifact" section currently inline in SKILL.md (lines 99-115)
- [ ] `.agents/skills/grill-me/agents/grill-question-patterns.md` mirrors the canonical
- [ ] `.agents/skills/grill-me/agents/synthesis-prompt.md` mirrors the canonical
- [ ] `.claude/skills/grill-me/SKILL.md` replaces the moved sections with one-line `See: agents/<file>.md` pointers; line count drops by ≥ 30
- [ ] `.agents/skills/grill-me/SKILL.md` mirrors the canonical
- [ ] `.agents/skills/design-council/agents/role-prompts/content-iteration.md` exists, contains the "Content iteration perspective" framing + context files (currently lines 143-147)
- [ ] `.agents/skills/design-council/agents/role-prompts/engine-architecture.md` exists, contains the "Engine / architecture perspective" framing + context files (currently lines 149-153)
- [ ] `.agents/skills/design-council/agents/role-prompts/coordination-process.md` exists, contains the "Coordination / process perspective" framing + context files (currently lines 155-159)
- [ ] `.agents/skills/design-council/agents/role-prompts/state-of-product.md` exists, contains the "State-of-the-product perspective" framing + context files (currently lines 161-165)
- [ ] `.agents/skills/design-council/agents/consent-round-prompt.md` exists, contains the "Phase 3 — Consent round" 6-step sequence currently inline in SKILL.md (lines 94-105)
- [ ] `.agents/skills/design-council/SKILL.md` replaces moved sections with one-line `See: agents/<path>.md` pointers; line count drops by ≥ 80
- [ ] `last_validated_against` bumped to 2026-06-12 in both `grill-me/SKILL.md` files and the `design-council/SKILL.md` (skills carry an explicit correctness-affirmation date per CLAUDE.md)
- [ ] `npm run check:skill-sync` passes (no shared-skill drift)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass
- [ ] Dry-run: read each new `agents/*.md` file directly via the Read tool to confirm no content was lost. Diff against git history of the original SKILL.md sections to verify byte-for-byte equivalence of the moved prose (modulo the leading H1/file-frontmatter).
- [ ] Closing commit body includes `Fixes THR-381`
- [ ] `Browser-verify exempt: skill-infrastructure refactor, no UI surface touched` stated in commit body

## Coordination block

*This is a Codex handoff — mechanical, pattern-following work. No `Suggested model` line (Codex's model is configured at the automation level).*

**Parallel-safe with:** any non-design-loop work. Specifically safe with anything in `src/`, `Docs/canon/`, `Docs/audits/`, encounter content, attachment content, vault work.

**Mutex with:**
- Any concurrent edit to `.claude/skills/grill-me/SKILL.md`, `.agents/skills/grill-me/SKILL.md`, or `.agents/skills/design-council/SKILL.md`.
- THR-378 (MT-2 — fork plan-finalization audit) — that ticket will read these role-prompt files; ship THR-381 first so MT-2's auditor subagents can reference stable paths from day one.

**Codex review:** yes — mechanical pattern-following work, ideal for the executor lane. The structural review Action on PR will run the standard advisory pass.

**Files to touch:**
- Create: `.claude/skills/grill-me/agents/grill-question-patterns.md`
- Create: `.claude/skills/grill-me/agents/synthesis-prompt.md`
- Create: `.agents/skills/grill-me/agents/grill-question-patterns.md` (mirror)
- Create: `.agents/skills/grill-me/agents/synthesis-prompt.md` (mirror)
- Create: `.agents/skills/design-council/agents/role-prompts/content-iteration.md`
- Create: `.agents/skills/design-council/agents/role-prompts/engine-architecture.md`
- Create: `.agents/skills/design-council/agents/role-prompts/coordination-process.md`
- Create: `.agents/skills/design-council/agents/role-prompts/state-of-product.md`
- Create: `.agents/skills/design-council/agents/consent-round-prompt.md`
- Edit: `.claude/skills/grill-me/SKILL.md` (replace moved sections with `See: agents/<file>.md` pointers; bump `last_validated_against`)
- Edit: `.agents/skills/grill-me/SKILL.md` (mirror the SKILL.md edits)
- Edit: `.agents/skills/design-council/SKILL.md` (replace moved sections with `See: agents/<path>.md` pointers; bump `last_validated_against`)

## Notes for the executor

- **Move, don't paraphrase.** The role-prompts already have field-tested wording. Cut whole sections from SKILL.md and paste into `agents/*.md` with only a minimal H1 added at the top of each new file. Do not rephrase, "improve," or restructure during the move — that's a separate ticket.
- **Mirror discipline.** `grill-me` is a shared skill (both `.claude/` and `.agents/`); the pre-commit hook will block the commit if the two copies drift. Use `npm run check:skill-sync:sync` after editing the canonical (`.claude/`).
- **`design-council` is `.agents/`-only.** Do NOT create a `.claude/skills/design-council/` directory or copy. The mirror decision (THR-382 / MT-6) is still open; don't pre-empt it.
- **Pointer-format consistency.** Use the same pointer style as `encounter-pipeline/SKILL.md` already uses. The orchestrator-side change is just "the role lives in `agents/<file>.md`" — keep the prose neighbouring the pointer minimal.
- **Frontmatter on new files.** Each new `agents/*.md` should start with a single H1 naming the role; no full skill frontmatter is needed — these are *fork-prompts*, not skills.
- **No additional refactor.** Do not also tackle the open audience decision for `design-council` (THR-382 / MT-6). Do not move `grill-me` content into `reference/` (that's part of QW-3 territory). Stay within the role-prompt scope above.
- **Byte-equivalence check.** The dry-run step in "Done when" exists because subtle whitespace edits during a move can change behavior in spawned subagents that read these files. Diff against `git show HEAD:<old-path>` to confirm the moved bytes match.
