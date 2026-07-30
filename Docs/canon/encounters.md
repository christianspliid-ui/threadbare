---
domain: encounters
last_reviewed: 2026-07-27
reviewer: claude-code
ul_shards: [Encounters, Prose, Traits]
status: live
---

# Canon — Encounters

> The encounter is the authored chapter in Threadbearer's reading: a moment where one threaded mortal's situation crystallises and the player decides what kind of god to be toward it.

## The nudge model is the current authoring spec (THR-772/774)

> **The god acts in the physics of the scene, never in the dramaturgy of the story.**

Every encounter authored from 2026-07-27 ships **nudge-native**. The player is dealt a
hand of authored, essence-priced **nudges** that shift the named odds; **fate rolls the
outcome** on the five-band ladder; prose pays the nudge off at *every* band, misfires
included. Choosing between authored futures for a mortal is the **rejected** model this
replaced (see Rejected approaches).

**The format was locked 2026-07-30 (THR-883, the communication pivot): prose does the
scene, cards do the rules.** Scene prose (per-class openings + setting-neutral spine +
outcome prose) is fully written under the 14-question scene-writer's checklist; a card
face is **library-generic** — 2–4 word title, one plain mechanical `effectLine`, one
flavor quote, cut from the 21-type card library — with zero scene-bespoke prose.
Templates declare **setting envelopes** (THR-884: `settings` from the 8-class
vocabulary + one opening per class); cards may charge **cost channels** and carry
**grants** (THR-885: doom/detection deltas, world changes in the existing aftermath
effect vocabulary, grant-liveness gated). Odds render as pips (display-side; raw numbers
in data).

- **Authoring contract (load first, both pipelines):** [`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`](../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) — the communication pivot, the 14-question checklist, setting envelopes, the 21-type library hand rules, register table, prose rubric, verbatim detector spec.
- **Golden exemplar:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` — The Swollen Ford, authored end-to-end in the locked format, every rule visible once. In no shipped pool. (Supersedes the pre-pivot Darkhollow Vault, deleted 2026-07-30.)
- **Card library + pip vocabulary:** `public/nudge-cards-reference.html` (wiki page — the surface the repertoire is iterated on) · Repertoire progression: [2026-07-30-nudge-card-repertoire.md](../plans/2026-07-30-nudge-card-repertoire.md).
- **Tunable authoring guardrails:** `src/data/content-eval/nudgeAuthoringConstants.ts` (authoring/lint-side; **not** the client bundle). Runtime numbers stay in `src/data/nudge-constants.ts`.
- **Executable half:** `src/engine/__tests__/nudgeModel.test.ts` § *golden exemplar* — the checklist as assertions (envelope validity, cost channels, grant liveness included), so spec and exemplar cannot drift apart silently.
- **Schema:** `StepNudge` (incl. `costs`, `grants`, `fictionBySetting`, `requiresGroup`/`requiresFavor`) / `ActionStep.nudges` / `TraitVariant` / template-level `settings` + `openings` (`src/types/unifiedAction.ts`); hand resolution in `src/engine/encounters/nudges.ts`, dispatch in `src/engine/encounters/nudgeDispatch.ts`, envelopes in `src/data/settingClasses.ts`.
- **Program plan:** [2026-07-26-nudge-model-encounter-system.md](../plans/2026-07-26-nudge-model-encounter-system.md) (THR-772) · WS0 substrate [2026-07-26-nudge-model-ws0-engine-substrate.md](../plans/2026-07-26-nudge-model-ws0-engine-substrate.md) · WS1/WS2 [2026-07-27-nudge-encounter-experience-ws1-ws2.md](../plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md) · frameworks [2026-07-30-encounter-authoring-frameworks.md](../plans/2026-07-30-encounter-authoring-frameworks.md) (THR-884/THR-885, both shipped 2026-07-30).

**Migration state.** `authoredChoices` still *renders* — the stage branches on data
presence, so the rollout is per-template and reversible, with no flag day. But no new
encounter authors it. Conversion of the existing 28 branching encounters is WS5.

**Terminology.** A **rider** (`no_crit_fail`, `floor_at_cost`) is a mechanical remap of
the resolved band. A **band fragment** (`bandProse[outcome]`) is prose appended when a
nudge was active for that band. A rider changes what happened; a fragment says the god
was there when it did. Both are UL entries (Encounters shard).

**Meet The First is nudge-native (WS6, THR-868).** The game's first interactive surface
used to *be* the rejected model — two authored formative moments, player picks which one
is true. It now runs three fate rolls: two **formative tests** and a **bond test** as the
climax. A meeting nudge additionally carries a **pole lean** (`MeetingStepNudge`), because
a nudge shifts odds and never picks the ending, so the *direction* a success writes cannot
come from a choice: the played hand's net lean picks which pole of the value pair a success
writes, and fate picks how cleanly it resolves. That is what makes "you nudged toward
mercy, fate landed ruthlessness" a real outcome rather than a slogan.

- **Types + resolvers:** `src/types/meetingEncounter.ts`, `src/engine/meetingEncounter.ts`
  (`resolveFormativeTest` / `resolveBondTest` / `applyMeetingOutcomes`). No parallel
  resolver — the shared attended ladder does the rolling.
- **Constants:** `src/data/meeting-nudge-constants.ts`. Note `MEETING_TEST_CAPABILITY` is
  **0.8, not 0.5**: measured through the live resolver, 0.5 against authored difficulty
  0.5 forecasts `doomed` (p=0.09), because the attended sigmoid is not centred at equal
  capability/difficulty. Retuning is free; the tests pin the *shape* (an unled
  mid-difficulty moment must not read `doomed`), not the number.
- **Bands are `StepOutcome`, not `ForecastTier`.** `fated / favorable / uncertain /
  perilous / doomed` are the **pre-roll** forecast words. A nudge resolves onto the
  six-value `StepOutcome` ladder. Substituting one for the other type-checks and is wrong.
- **Register + image doctrine are enforced, not advisory:**
  `src/data/__tests__/meetingProseRegister.test.ts` (zero vagueness-lexicon words across
  the sensing vignettes and god-voice tables, with negative controls) and
  `src/data/__tests__/meetingSceneDoctrine.test.ts` (`QUARANTINED_SCENE_ASSETS`).

## Current spec

- **Format:** `UnifiedActionTemplate` — the single format for all encounter types since THR-108 (2026-04-XX). `EncounterTemplate` is removed; it no longer exists anywhere in the codebase.
- **Two encounter subtypes (same format, different pipeline):**
  - *Branching encounters* — structural branches (`ActionStepBranch`), full aftermath suite. Pipeline: `.claude/skills/encounter-pipeline/SKILL.md`.
  - *Linear template encounters* — guild, social, tavern, combat, borderland. Pipeline: `.claude/skills/template-encounter-rewrite/SKILL.md`.
  - Both are nudge-native: the player-facing surface in each is the nudge hand.
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
| Star | Beacon ↔ Wrecker |

Source: `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §2.2 and `Brainstorms/brainstorm-cosmological-symmetry.md`.

## Rejected approaches

- ❌ `EncounterTemplate` format — replaced by `UnifiedActionTemplate` (THR-108, 2026-04-XX). Do not author, import, or reference EncounterTemplate. It is removed.
- ❌ AgentWheel / fixed action-count slots — replaced by `ActionDrawer` with context-filtered cards via Generalized Action Targeting (see CLAUDE.md Rejected Approaches)
- ❌ Pure LLM-generated encounter prose — replaced by hybrid layered engine with enrichment placeholders
- ❌ Player-as-character framing ("choose how the character responds") — the player is a god who intervenes indirectly. All player-facing options must be *god actions*. Any choice that makes the mortal the agent must be reframed.
- ❌ **Choosing between authored futures** ("Forge the truth" / "Temper the narrative") — rejected 2026-07-26 (THR-772, Christian, chat). The player must never pick an ending. The god plays concrete, sphere-flavoured **nudges** that shift the odds; fate rolls the outcome. Superseded the `authoredChoices` layer at design level; code retirement is staged (WS5 conversion, THR-778). Do not author `authoredChoices` on a new encounter.
- ❌ **A percentage anywhere on the mortal-facing surface** — rejected 2026-07-26 (THR-772 ruling 1). Odds are legible in words only: the five forecast tier words and the four difficulty words (`severe / steep / fair / gentle`). Numbers exist behind the words; the designer/debug view is the sole exception. An `effectLine` carrying a digit is an editorial reject, not a nit.
- ❌ **A nudge with no failure-band payoff** — the god's hand must be traceable in failure at any size (THR-772 program ruling: payoff at every band). A card that vanishes on a loss makes failure read as punishment, which inverts the design.
- ❌ **Scene art that depicts the interaction, or a second human likeness** — rejected 2026-07-30 (THR-868 audit). Image doctrine ruling 10: a scene omits or silhouettes the agent, because the portrait chosen at Sensing is the only likeness across the flow. The audit of all 32 meeting scene files found five violations, and the reachable one was rendering: `plague-ward.jpg` (an individuated child's face) won any dilemma tagged `sacrifice` or `compassion`. `prison-cell.jpg` had the retired choice mechanic painted in as two UI buttons — "GRANT MERCY" / "IMPOSE JUDGMENT" — so the art taught the rejected model even after the code stopped. Two more carried baked-in caption text. Quarantine list + enforcement: `QUARANTINED_SCENE_ASSETS` in `src/data/meeting-art-library.ts`, pinned by `src/data/__tests__/meetingSceneDoctrine.test.ts`. **A wrong picture type-checks** — this class is invisible to every test that does not look at the pool.
- ❌ **The lyrical register, game-wide** — rejected 2026-07-30 (Christian, chat; THR-868 WS6 mandate). "Something inside them settles into place like a stone dropped into still water" is the register being retired. Player-facing prose is plain and descriptive of **events, people, and motivations**: every sentence carries a picturable anchor, abstractions are cashed in-sentence, and the vagueness lexicon (`someone` and `very` included — see `AUDIT_VAGUENESS_TERMS`, which is wider than the spec doc's list) targets zero. Do not close a paragraph on an abstraction.
- ❌ Spirit as a Reach — Spirit is a **Sphere** (one of the 12 Creation Spheres), not a Reach. Using "Spirit reach" in encounter authoring is a drift error. Use the correct Reach (Iron, Gold, etc.) for the action domain.
- ❌ Voice as a Reach — Voice does not exist. The persuasion/communication domain maps to **Gold** (influence, patronage, social capital) depending on the action type.
- ❌ Intelligence/visibility gating of encounter candidates — rejected 2026-05-07 (project-level direction from Christian, THR-138 closed). All encounter content is fully visible to the player at all times; intel never *hides* candidates. Intel may still *enrich* an encounter when present (prose recognition per THR-139, mechanical bonus per THR-140, cross-agent sharing per THR-142) — additive, never subtractive. Do not propose `requiresIntelligence` template fields, hidden-candidate filters, or "fog of intel" mechanics; the design space is closed.
- ❌ Step-level `ActionStepBranch` in linear-template encounters — rejected 2026-05-15 (THR-191). `ActionStepBranch` is exclusive to *branching encounters* (`src/data/encounters/`). Linear-template encounters (guild, social, tavern, combat, borderland) use aftermath reactions + optional `BranchAwareAftermathConfig.variants` as their choice surface. A linear template that wants a mid-quest fork should be promoted to a branching encounter via `encounter-pipeline`, not retrofitted with step branching. Supersedes the "use ActionStepBranch on ≥3 templates" instruction in `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md`.
- ✅ **Populated `BranchAwareAftermathConfig.variants` on linear templates — opt-in, signal-gated** (THR-447, 2026-05-16). The `fallback`-only default stays correct for the majority of linear templates. A family becomes a candidate for populated `variants` only when ≥3 of 5 signals fire (recurring thematic tension, distinct downstream graph consequences, saga-scale weight, multi-actor reaction surface, player-legible cue). Per-template authoring is budget-capped (2 choices × ~45 min); editorial gates G1–G4 are mandatory. See `Docs/plans/2026-05-16-thr-447-aftermath-variants-format-decision.md` for the full framework and the family scoring matrix.

## Open questions

- **Branch count enforcement:** 3-branch ceiling is the editorial target; some branching encounters currently have more. The editorial agent applies discipline on a per-encounter basis; no hard engine enforcement yet.
- **Phase 2a wiring (THR-306):** When THR-306 lands, the `encounter-pipeline` skill will load this Canon page as its explicit Step 0. Until then, authoring agents must load this page manually before running the pipeline.

## Last-reviewed

2026-07-30 (second edit) by Claude Fable (THR-883: format lock recorded — the communication pivot, setting envelopes, cost channels/grants, the new Swollen Ford golden exemplar replacing the Darkhollow Vault, and pointers to the frameworks + repertoire plans). Review trigger: monthly, or when any listed plan moves to `superseded`. Previous edits: 2026-07-30 by Claude Code (THR-868 / WS6: Meet The First recorded as nudge-native — pole lean, the retuned `MEETING_TEST_CAPABILITY`, the `StepOutcome`-not-`ForecastTier` trap, and two new rejected approaches covering scene-art doctrine and the retired lyrical register); 2026-07-27 by Claude Code (THR-774 / WS1: nudge model recorded as the current authoring spec).
