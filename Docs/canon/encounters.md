---
domain: encounters
last_reviewed: 2026-05-05
reviewer: cowork
ul_shards: [Encounters, Prose]
status: live
---

# Canon — Encounters

> The encounter is the authored chapter in Threadbearer's reading: a moment where one threaded mortal's situation crystallises and the player decides what kind of god to be toward it.

## Current spec

- **Format:** `UnifiedActionTemplate` — the single format for all encounter types since THR-108 (2026-04-XX). `EncounterTemplate` is removed; it no longer exists anywhere in the codebase.
- **Two encounter subtypes (same format, different pipeline):**
  - *Branching encounters* — authored player-choice branches (`ActionStepBranch`), full aftermath suite. Pipeline: `.claude/skills/encounter-pipeline/SKILL.md`.
  - *Linear template encounters* — guild, social, tavern, combat, borderland. Pipeline: `.claude/skills/template-encounter-rewrite/SKILL.md`.
- **Authoring entrypoint (branching):** [.claude/skills/encounter-pipeline/SKILL.md](.claude/skills/encounter-pipeline/SKILL.md)
- **Authoring entrypoint (linear):** [.claude/skills/template-encounter-rewrite/SKILL.md](.claude/skills/template-encounter-rewrite/SKILL.md)
- **Engine wiring:** [Docs/plans/2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md) — the 7 engine capabilities content authors must use
- **Compiled brief:** [Docs/authoring-brief.md](../authoring-brief.md) — regenerated from sources via `npm run build-authoring-brief`; check staleness with `npm run check:authoring-brief`
- **UL terms:** [Docs/ubiquitous-language/Encounters.md](../ubiquitous-language/Encounters.md)
- **Obsidian system page:** `TheFantasyWorldSimulator/Systems/Encounter System.md` (verify freshness — may lag code)
- **Exemplars (canonical quality bar):** `src/data/encounters/rival-shrine-betrayal.ts` (10/10), `src/data/encounters/flawed-steel.ts` (9/10) — per [Docs/exemplars.md](../exemplars.md)
- **Data directory:** `src/data/encounters/` (branching) + template files compiled from skill pipeline

## Four load-bearing rules (encounter design)

From `2026-05-04-encounter-experience-design-plan.md` §1 — the executor's contract:

- **Rule 1 — Path over adjective.** Every player choice must change the path, not the adjective.
- **Rule 2 — The moral axis is structural.** Every reach has an archetype-pair axis (per the Cosmological Pattern). Each encounter choice tilts the agent toward one pole.
- **Rule 3 — Verbs are encounter-specific, soft-power flavored.** Each encounter writes its own god-verbs ("Stir her resolve"). Never full control.
- **Rule 4 — Every primitive is clickable.** Every node type — cast tile, item, clue, place, faction, Ascendant — has a detail page.

## Active design plans

- [2026-05-04-encounter-experience-design-plan.md](../plans/2026-05-04-encounter-experience-design-plan.md) — current canonical encounter experience design (THR-300). Status: `current`. This is the executor's contract for all encounter implementation work.
- [2026-05-05-encounter-ui-implementation-phasing.md](../plans/2026-05-05-encounter-ui-implementation-phasing.md) — phased implementation plan for the encounter UI (Phases A–G). Executor's build sequence with per-phase Done-when criteria and the hybrid callback eligibility decision (§2.6).
- [2026-05-04-encounter-experience-player-journey.md](../plans/2026-05-04-encounter-experience-player-journey.md) — player journey reference (companion to above)
- [2026-05-04-encounter-experience-grill-me.md](../plans/2026-05-04-encounter-experience-grill-me.md) — pre-design synthesis; useful archaeology
- [2026-05-04-encounter-toolkit-vision-audit.md](../plans/2026-05-04-encounter-toolkit-vision-audit.md) — vision audit **with one corrected row** (see note below)

> **Note on the 2026-05-04 vision audit:** The audit row claiming "8 reach domains = drift, canonical is 9 reaches" is **inverted** — the toolkit was correct (8 Reaches), the audit was misled by `vault/Systems/Domain Word Scales.md` (a stale 2026-03-08 page predating the TB-075 Flesh→Quintessence decision). See `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md` for the full account. Read [Docs/canon/cosmology.md](cosmology.md) for the authoritative reach roster.

## Reach→archetype-pair axis reference

Each encounter's primary reach maps to an archetype-axis in the Cosmological Pattern:

| Reach | Archetype axis |
|-------|----------------|
| Iron | Protector ↔ Conqueror |
| Gold | Patron ↔ Extractor |
| Shadow | Saboteur ↔ Deceiver |
| Veil | Seer ↔ Manipulator |
| Heart | Sworn ↔ Renegade |
| Eye | Witness ↔ Judge |
| Stone | Keeper ↔ Destroyer |
| Star | Wanderer ↔ Anchor |

Source: `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §2.2 and `Brainstorms/brainstorm-cosmological-symmetry.md`.

## Rejected approaches

- ❌ `EncounterTemplate` format — replaced by `UnifiedActionTemplate` (THR-108, 2026-04-XX). Do not author, import, or reference EncounterTemplate. It is removed.
- ❌ AgentWheel / fixed action-count slots — replaced by `ActionDrawer` with context-filtered cards via Generalized Action Targeting (see CLAUDE.md Rejected Approaches)
- ❌ Pure LLM-generated encounter prose — replaced by hybrid layered engine with enrichment placeholders
- ❌ Player-as-character framing ("choose how the character responds") — the player is a god who intervenes indirectly. All choices must be *god actions* (whisper, steady, withdraw, strengthen). "Let them handle it" is always valid. Any choice that makes the mortal the agent must be reframed.
- ❌ Spirit as a Reach — Spirit is a **Sphere** (one of the 12 Creation Spheres), not a Reach. Using "Spirit reach" in encounter authoring is a drift error. Use the correct Reach (Iron, Gold, etc.) for the action domain.
- ❌ Voice as a Reach — Voice does not exist. The persuasion/communication domain maps to **Gold** (influence, patronage, social capital) depending on the action type.

## Open questions

- **Branch count enforcement:** 3-branch ceiling is the editorial target; some branching encounters currently have more. The editorial agent applies discipline on a per-encounter basis; no hard engine enforcement yet.
- **Phase 2a wiring (THR-306):** When THR-306 lands, the `encounter-pipeline` skill will load this Canon page as its explicit Step 0. Until then, authoring agents must load this page manually before running the pipeline.

## Last-reviewed

2026-05-05 by Cowork. Review trigger: monthly, or when any listed plan moves to `superseded`.
