---
status: current
title: THR-304 Phase 2b — Wire prose-* and hexmap-* skills to Canon pages (Step 0)
date: 2026-05-07
linear: THR-304
parent_plan: 2026-05-05-canonical-documentation-strategy.md
sibling_plan: 2026-05-07-thr-304-phase-2a-encounter-pipeline-canon-wiring.md
audience: codex
---

# THR-304 Phase 2b — Canon Step-0 wiring for prose-* and hexmap-* skills (2026-05-07)

**Status:** Cowork follow-on to Phase 2a (THR-358 — encounter-pipeline ↔ encounters.md, shipped 2026-05-07). Phase 2a validated the Step-0 pattern with one domain; Phase 2b applies it mechanically to the remaining six skills that map to existing Canon pages (`Docs/canon/prose.md`, `Docs/canon/hex-map.md`) plus the one remaining encounter-authoring skill (`template-encounter-rewrite`).

**Audience:** Codex executor. Mechanical pattern-following: prepend a Step-0 block to seven `SKILL.md` files in two tree paths each (`.claude/skills/` and `.agents/skills/`), then run the skill-sync check.

---

## 1. Why this exists

Phase 2a wired `encounter-pipeline` to load `Docs/canon/encounters.md` as Step 0 before dispatching any sub-agent. The pattern proved out: agents now stop triangulating the current spec from 6–12 stale files. The CLAUDE.md Canon Pages table covers five domains (Encounters, Cosmology, Process, Prose, Hex map), and authoring agents in the prose and hex-map domains still have no Step-0 entrypoint. Phase 2b closes that gap.

**The two Canon pages are already authored and live.** `Docs/canon/prose.md` (last reviewed 2026-05-06, status: live) explicitly names which of the three prose skills owns which slice of work. `Docs/canon/hex-map.md` (last reviewed 2026-05-06, status: live) does the same for the three hexmap skills plus a footnote about `blender-to-hexmap` being a separate concern. No design decisions remain; this is a wiring task only.

**Why mechanical:** Phase 2a's wiring is a single Step-0 block placed near the top of the SKILL.md (after the YAML frontmatter and skill description). The same block, with the Canon page URL changed, lands at the top of each Phase 2b skill. No skill-specific judgment required beyond picking the correct Canon page per skill and re-rendering the existing pre-read list to start with the Canon link.

---

## 2. Three-pillar adaptation

This is a process/skills-tree ticket, not a feature ticket. Three-pillar rule does not apply directly.

- **Engine:** N/A — no engine code touched.
- **Content:** N/A — no encounter, attachment, or prose data files touched.
- **UI:** N/A — no components touched.

**Wiring pillar (substitutes):** the seven `SKILL.md` files Cowork agents and the prose / hexmap pipelines load at task entry.

---

## 3. The Step-0 block — pattern (binding)

Below is the canonical Phase 2b block to prepend after the YAML frontmatter + the existing one-line description sentence and before any other heading. The Canon page URL is the only field that varies per skill.

```markdown
## Step 0 — Canon-First Pre-Read

Before any other reference, read `Docs/canon/<DOMAIN>.md`. It is the live navigation layer for this domain — it lists the current spec pointers, rejected approaches, and active design plans. Linked targets are authoritative; this skill follows the Canon page's pointers, not parallel ones.

If the Canon page disagrees with this skill, the Canon page wins until this skill is rewritten. File a `drift-scan`-labeled Linear issue when you see disagreement.
```

**Where to place it:** immediately after the H1 title and the lead paragraph that already exists in each SKILL.md, before the next H2 heading. Phase 2a placed its Step-0 inside the `## Orchestration Protocol` section because the encounter-pipeline skill is an orchestrator. The other six skills are not orchestrators (they are authoring guides), so the Step-0 belongs at the top of the skill body, immediately after the lead paragraph. This is the only structural deviation from Phase 2a, and it follows what the Canon pages themselves recommend ("Load this page once at session start when authoring …").

**Existing pre-read lists.** Each skill already has a "read these before authoring" list. Replace that list's first bullet with `Docs/canon/<DOMAIN>.md` if the list does not already start there. Keep the rest of the bullets intact. Do **not** remove existing content; only re-order so the Canon page is bullet 1.

---

## 4. Files to touch (binding)

Seven skills × two trees = fourteen files. Map per skill:

| Skill | Canon page | `.claude/skills/<skill>/SKILL.md` | `.agents/skills/<skill>/SKILL.md` |
|---|---|---|---|
| `prose-pipeline` | `Docs/canon/prose.md` | yes | yes |
| `prose-content-systems` | `Docs/canon/prose.md` | yes | yes |
| `prose-vignettes-and-enrichment` | `Docs/canon/prose.md` | yes | yes |
| `hexmap-core` | `Docs/canon/hex-map.md` | yes | yes |
| `hexmap-layers` | `Docs/canon/hex-map.md` | yes | yes |
| `hexmap-renderer` | `Docs/canon/hex-map.md` | yes | yes |
| `template-encounter-rewrite` | `Docs/canon/encounters.md` | yes | yes |

**Verification of file existence (Cowork pre-flight 2026-05-07):**

- All seven skills exist in both `.claude/skills/` and `.agents/skills/` (per CLAUDE.md skill-tree shared-skill policy).
- All three canon target pages exist and are status `live`.

**Files NOT to touch (binding):**

- `.claude/skills/encounter-pipeline/` and `.agents/skills/encounter-pipeline/` — already wired in Phase 2a.
- `Docs/canon/*.md` — Canon pages stay authoritative; they are the *target*, not the *subject*.
- `CLAUDE.md` — the Canon Pages table already references all three target pages; no edit required.
- Any other skill not in the table above (`engine-architecture`, `attachment-pipeline`, `state-of-game-design`, `art-direction`, etc.) — those are Phase 2c candidates if and when more Canon pages are written or the table grows. **Phase 2b stays scoped to the three Canon pages currently mapped in CLAUDE.md plus encounters.**

---

## 5. Per-skill Canon-page selection rationale

- **`prose-pipeline`** → `prose.md` — implements new resolvers and the prose-generation pipeline. Canon page §"Authoring entrypoint" routes pipeline architecture work to this skill.
- **`prose-content-systems`** → `prose.md` — high-volume daily content authoring (encounter prose, narrative event prose, faction content). Canon page §"Authoring entrypoint" routes this slice to this skill.
- **`prose-vignettes-and-enrichment`** → `prose.md` — vignette authoring + `{name}/{artifact}/{ally}` enrichment placeholders. Canon page §"Authoring entrypoint" routes this slice to this skill.
- **`hexmap-core`** → `hex-map.md` — architecture, coordinates, render order, color pipeline. Canon page §"Authoring entrypoint" names this skill as load-first for any HexMapV2 code work.
- **`hexmap-layers`** → `hex-map.md` — signifiers, agents-on-map, fog, click handlers, trails. Canon page §"Authoring entrypoint" names this skill.
- **`hexmap-renderer`** → `hex-map.md` — quick reference for settled renderer decisions. Canon page §"Authoring entrypoint" names this skill.
- **`template-encounter-rewrite`** → `encounters.md` — rewriting linear template encounters to UAT format. Encounters domain owns the format authority; the encounters Canon page covers the format the rewrite skill targets. (Phase 2a covered the *branching* encounter pipeline; this fills the linear-template companion.)

---

## 6. Done when (binding checklist)

- [ ] All 14 SKILL.md files have a Step-0 block placed per §3.
- [ ] Each Step-0 block names the correct Canon page from §4's table.
- [ ] Existing pre-read lists in each skill have the Canon page as bullet 1 (re-ordering only — no content deleted).
- [ ] `.claude/skills/<skill>/SKILL.md` and `.agents/skills/<skill>/SKILL.md` for each skill are byte-identical except for any tree-specific path differences that already exist (Phase 2b should not introduce new divergence).
- [ ] `npm run check:skill-sync` passes (the THR-192 hook that gates `.claude/` ↔ `.agents/` shared-skill drift).
- [ ] `npx tsc --noEmit` passes (no code change, but run the gate).
- [ ] `npm test` passes (no test change expected, but run the gate).
- [ ] `npx vite build` passes (Vercel deploy gate).
- [ ] Closing commit body includes `Fixes THR-XXX` (this issue's ID) so the merge-to-main auto-close fires.
- [ ] Verification evidence (terminal output for the three checks) pasted in the closing commit body or completion comment.

---

## 7. Out of scope (do NOT do in this ticket)

- Adding new Canon pages or editing existing Canon pages — Cowork owns Canon page authorship.
- Wiring skills to Canon pages not in CLAUDE.md's Canon Pages table — that requires a CLAUDE.md edit and a separate ticket.
- Refactoring skill content beyond placing the Step-0 block and re-ordering the pre-read list's first bullet.
- Changing skill `description:` frontmatter or skill names — those are Linear coordination keys and must stay stable.
- Wiring the `attachment-pipeline` skill — it has no Canon page yet (`Docs/canon/attachments.md` exists but is not in the CLAUDE.md table; Cowork will add a Phase 2c ticket if the table is expanded).
- Wiring `state-of-game-design` to `process.md` — `process.md` is the always-load meta-canon for Cowork sessions, not a domain entry; that wiring is implicit in CLAUDE.md's session workflow and does not need a SKILL.md hook.
- Modifying the `encounter-pipeline` Step-0 from Phase 2a — keep its existing wording (which lives in §"Orchestration Protocol > Step 0: Canon-First Pre-Read"). Phase 2b's wording targets non-orchestrator skills.

---

## 8. Coordination block

**Parallel-safe with:** all current Encounter Experience phase tickets (THR-334, 335, 339, 340, 342, 344, 345, 353), THR-361 (TB-075 Phase 5c — file-disjoint, touches `src/engine/__tests__/*` + `src/types/traits.ts`), THR-362 (THR-318 Stream 1 Pass 2 — file-disjoint, touches `src/data/*-encounter-content.ts`).

**Mutex with:** any future ticket that edits the same seven SKILL.md files (e.g. a future skill rewrite of `prose-content-systems` or `hexmap-core`). None currently in flight.

**Codex review:** no — mechanical edit, validated by the Phase 2a pattern, gated by `npm run check:skill-sync` + the standard build/test/typecheck triple.

**Files to touch (binding):** see §4 table — fourteen `SKILL.md` files, no other files.

---

## 9. NFP audit

NFPs apply to engine and content code; this is a skills/docs ticket. The relevant non-functional concerns:

- **NFP #1 (Tunability):** N/A — no constants.
- **NFP #2 (Inspectability):** Wiring makes future skill loads easier to inspect — the Step-0 block names the Canon page explicitly.
- **NFP #3 (Determinism):** N/A — no engine code.
- **NFP #4 (Fail-soft):** The Step-0 block instructs the agent to file a `drift-scan` Linear issue if the skill disagrees with the Canon page. That is the fail-soft behavior — it surfaces disagreement rather than silently letting the skill drift.
- **NFP #5 (Narrative over mechanics):** N/A.
- **NFP #6 (Additive):** Pure addition. No content removed; only the pre-read list's bullet order is changed.
- **NFP #7 (Performance):** N/A.

---

## 10. Rollback

Per-skill: revert that skill's two SKILL.md files (`.claude/` and `.agents/` copies). Each skill's wiring is independent. If `npm run check:skill-sync` fails, fix the diverging file rather than rolling back the whole ticket.

---

## 11. Filing trigger and follow-ups

**Filing trigger (this ticket):** Phase 2a (THR-358) shipped, validating the Step-0 pattern. Phase 2b is the planned mechanical roll-out across the remaining canon-mapped skills.

**Follow-ups Cowork will file later:**

- Phase 2c (when CLAUDE.md Canon Pages table grows): wire `attachment-pipeline` → `attachments.md`, `engine-architecture` → `engine.md`, `agent-analyser` → `agents.md` once those Canon pages are added to the CLAUDE.md table by a separate Cowork session.
- A skill-creation guideline update so any new authoring skill gets Step 0 wired at creation time (not as a follow-on).
