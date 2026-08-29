---
title: Encounter Authoring Frameworks — Setting Envelopes & the Nudge Card Library
linear_issue: THR-883
author: Claude Fable 5 (live design session with Christian)
created: 2026-07-30
three_pillars: Engine (envelope expansion, riders, cost channels, dispatch hooks) / Content (authoring format the corpus is written against; content itself deferred to THR-883) / UI (N/A this plan — test-panel redesign is a separate THR-883 design question)
---

# Encounter Authoring Frameworks — Setting Envelopes & the Nudge Card Library

> **lint_plan_doc:** exempt — live-session design record in the pre-template shape; superseded in large part and bannered, not maintained (THR-1372).

> **⚠️ SUPERSEDED IN LARGE PART (marked 2026-08-29, round-5 context-cleanup — THR-1372). Do not author against this doc.**
> The setting-envelope architecture (Decision 2) and the 21-type library concept survive; four of its rules were later retired or reversed and are stated below as if live:
> - **Decision 1's 14-question scene-writer checklist** (incl. "how does it feel? two senses beyond sight" and scene-first building) — retired 2026-08-25 by **Prose Doctrine v2 (narrator mode)**; the live checklist is the 12-question narrator's checklist.
> - **"Hands are fully authored at encounter design time / no runtime generic deck"** — superseded by the composed-hand model (THR-1247/1248): 0–2 authored specials + a declared `deal` fill; dealing is live and still takes zero PRNG.
> - **`HAND_SIZE_MIN`/`MAX` = 4/6** — the live window is `NUDGE_HAND_MIN`/`MAX` = **4/8** (`nudgeAuthoringConstants.ts`).
> - **Per-card `fiction` / `fictionBySetting` variants** — the flavor quote was retired 2026-08-25 and the fields removed (THR-1225); card faces are spell-style and carry no card prose to vary.
>
> **Live authorities:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (the authoring contract) · `Docs/canon/encounters.md` · `Docs/canon/prose.md`. This doc remains the design record of the 2026-07-30 sessions.

**Date:** 2026-07-30
**Origin:** THR-883 (Fable encounter-writing prototype) — live design session with Christian, chat, 2026-07-30. Every decision below carries his explicit chat approval (THR-608: chat approval satisfies the gate).
**Status:** Historical design record — superseded in part; see the banner above.

## Why this is load-bearing

These frameworks change what an encounter template *is* (envelope + spine + per-class openings + typed authored hand). If the corpus is written before they land, every template gets migrated twice. That is why THR-883 paused all content work behind this plan.

## Context

Reviewing the first WS5-converted template, Christian found the nudge prose too abstract *again* — content that passed every automated detector still read as euphemistic mood, not explanation. THR-883 paused all content migration and moved format-setting into a live chat prototype. Three sessions of iteration produced the decisions recorded here. They change what an encounter template *is*, so the frameworks land before the corpus is written.

## Decision 1 — The scene-writer's checklist (14 questions)

Every encounter's prose is validated against these before it ships. The authoring agent answers each **in writing, per scene**; any "no" means rewrite first.

**A. Build the scene, in this order**
1. *Where are we?* Place described concretely enough to sketch — ground, structures, light — before anything else happens.
2. *How does it feel?* At least two senses beyond sight: sound, smell, temperature, the hour.
3. *Who is here?* Everyone present or implied is shown or accounted for. If a fire is lit, we know who lit it.
4. *What must we know?* Relevant context — why the character is here, what state they're in — before it matters.
5. *Does the complication come last*, landing on a scene already built?

**B. Internal logic**
6. *Nothing referred to before it's introduced.* Every object/person/feature a sentence uses already exists in the text.
7. *Every event has a visible cause.*
8. *Nothing contradicts what's established* — time of day, weather, who's present, what's in hand.

**C. Human realism, fantasy-adjusted**
9. *Would a real person in this world do this?* Strangers' camps aren't walked into; doors are knocked on; space has owners.
10. *Do people react to each other like people?* Greetings, wariness, permission, obligation.
11. *Do actions carry their true cost* — fatigue, hunger, fear, time?

**D. The interactive layer**
12. *Can the player restate the stake in one sentence* — what's being decided, what a good and a bad outcome each concretely look like? (Stake lines are several sentences and concrete — "will the rest take?" is too thin.)
13. *Is every card grounded?* It acts on something the scene established — deleting the card's target from the prose should make the card senseless.
14. *Does every card state mechanism, not mood?* What the god does, and why that moves the odds. Take the space needed to explain the reasoning (Eldritch Horror register: "Send restful dreams — you quiet their mind while they sleep, so the rest actually counts").
15. *(once envelopes land)* Does every setting class the envelope declares have an opening written for it?

## Decision 2 — Setting envelopes (rough location control, erring flexible)

The engine already gates templates per location: `locationSubtypes` on `UnifiedActionTemplate` controls which locations' encounter pools register the template (`encounterCache.ts`). The failure was content practice — placeless prose stamped with all 20 subtypes. Scene-built prose makes that a lie: the hamlet rest scene cannot appear in a capital.

**The system:** authors never touch the 20-subtype list. They declare a **setting envelope** from a closed 8-class vocabulary; one table expands classes to subtypes; the existing cache filter enforces it unchanged.

| Class | Expands to |
|---|---|
| `rural` | hamlet, farmland, mining |
| `urban` | town, city, capital |
| `stronghold` | castle, fort |
| `sacred` | shrine, temple |
| `arcane` | tower |
| `ruin` | ruins, ruined_tower, ruined_city, ruined_village, unexplored_poi |
| `wayside` | camp, oasis, wilderness |
| `battlefield` | battleground |

**Flexibility is the default, enforced by prose, not by narrowing** (Christian's explicit direction): write toward the *widest honest envelope*. The mechanism that makes wide envelopes honest:

- **Per-class opening variants.** Checklist questions 1–4 live in the scene's opening; the complication, stakes, and hand are setting-neutral. So a template is one shared spine + one authored opening per declared class (~1 paragraph each), resolved at instantiation via the existing THR-573 fragment machinery. Cards referencing class-specific scenery carry one-line fiction variants the same way.
- **Validation:** a template that declares openings must cover every declared class — build-time test, fail loud. An exact-subtype override field remains for genuinely specific encounters (a temple rite).
- **Coverage matrix:** a generated report (systems-inventory style), settings × reaches → drawable-template counts, plus per-family card-type composition. Makes corpus gaps (a starving `urban` cell) and hand monotony visible at build time instead of in play.

Out of scope v1: hex-terrain gating for mid-journey agents (route events already cover travel); time-of-day gating.

## Decision 3 — The nudge card library (21 types) and design-time hands

**Hands are fully authored at encounter design time.** No runtime generic deck: bespoke cards can satisfy grounding (Q13); generics cannot. Runtime only *filters* the authored hand: trait cards if the mortal qualifies, sphere signatures if the god's alignment allows, group cards only in groups, favor-calls only when a favor exists. Variation comes from world state, not shuffling.

**The 21-type palette** (designer's toolbox — hand-building rule: no two cards in a hand answer the same question; no two encounters in a family repeat a type composition):

| # | Type | Mechanism | Host system | Status |
|---|---|---|---|---|
| 1 | The Push | forecastDelta | resolution | shipped |
| 2 | The Heavy Hand | big delta + detection pressure | stealth/detection | needs cost channel |
| 3 | The Safety Net | `floor_at_cost` rider | riders | shipped |
| 4 | The Mercy | `no_crit_fail` rider | riders | shipped |
| 5 | The Gambit | new `all_or_nothing` rider (widen both ends) | riders | new rider |
| 6 | The Side-Bet | small delta + aftermath extra | per-card aftermath | shipped |
| 7 | The Long Game | plants trait/hidden mark for later triggers | traits trigger layer | ready-ish |
| 8 | The Whisper | reveals hidden factor / next step | intelligence | small UI work |
| 9 | The Personal Card | `requiredTrait`, cost 0 | traits | shipped |
| 10 | The Signature | god-sphere keyed (discount now; gate when THR-870 wakes) | spheres | small work |
| 11 | The Bargain | free in essence; paid in doom/detection/obligation | doom, detection, favors | needs cost channels |
| 12 | The Undertow | strong push, shifts the mortal's value poles | pole-shift (WS6) | ready-ish |
| 13 | The Stumble | targets the scene's opposition | encounter cast | fiction pattern |
| 14 | The Kindled Ambition | plants/wakes an ambition — **the missing dispatcher** for reactive ambition templates (THR-812/THR-726) | ambitions | dispatch hook |
| 15 | The Omen | plants an omen biasing future encounter draws | omens (bias path live) | dispatch hook |
| 16 | The Cache | leaves an item to find; ships with the item built | attachments | grant + liveness |
| 17 | The Balm | lifts a condition | effects & conditions | grant hook |
| 18 | The Veil | same help, unwitnessed — no detection, invisible to rivals | stealth + rival scans | needs cost channel |
| 19 | The Favor | creates or calls a favor-owed edge | secrets & favors (DORMANT — this is a live consumer) | dispatch hook |
| 20 | The Fellowship | steadies/strains group cohesion; dealt only in groups | groups | filter + hook |
| 21 | The Compulsion | dream-sent urge shaping the mortal's next decision | premonition/compulsion | dispatch hook |

**Supporting-content rule:** any card granting an item/trait/ambition/omen/condition ships with that content built, pinned by a build-time liveness test (THR-844's lesson: names referencing unbuilt content rot silently).

**Principle worth keeping:** the nudge hand is the game's best activation surface — several systems idle because nothing dispatches them; the god's hand is a natural dispatcher for nearly all.

## Implementation split (two executor tickets, parallel-safe)

**Ticket A — setting envelopes:** `SettingClass` vocabulary + expansion table; raw-entry `settings` field expanding to `locationSubtypes` in the converter; per-class opening + card-fiction variant slots through the fragment path; validation tests (both-direction class↔subtype totals; envelope-opening completeness); coverage-matrix generator + npm script. Engine cache untouched.

**Ticket B — card system:** `all_or_nothing` rider + priority update; cost channels (`detectionDelta`, `doomDelta`, obligation creation); grant/dispatch hooks (ambition assignment, omen plant, compulsion, condition removal, item spawn) routed through the existing systems' own APIs; runtime filters (`requiresGroup`, favor-availability, god-sphere discount, floor: discount never takes an authored cost below 1 — free is an authored decision); content-liveness test over all card grants. Explicitly out of scope: card content (Fable authors it under THR-883), test-panel UI redesign (THR-883 design question), THR-870 hard sphere gating.

## Risks

- **Wide envelopes without written openings** — closed by the completeness test; the risk is only during migration, where templates without any openings pass untouched.
- **Dispatch hooks touching six systems** — each hook must reuse the host system's existing API; a hook that green-fields a parallel path is wrong by construction (systems-inventory rule).
- **Coverage matrix read as a quota** — it is a visibility tool; floors stay advisory until Christian sets them.

## Engine pillar

Ticket B in full (riders, cost channels, grant/dispatch hooks, runtime filters, liveness tests) plus Ticket A's converter expansion and fragment-slot resolution. No tick-phase changes: dispatch hooks call existing system APIs at aftermath application; envelope expansion happens at template conversion, consumed by the existing `encounterCache` filter.

## Content pillar

The authoring format itself: checklist, envelope + openings, 21-type palette, design-time hand doctrine, supporting-content rule. Actual card/scene content is explicitly deferred to THR-883 (Fable authors it) — these tickets ship format and enforcement, zero prose.

## UI pillar

N/A this plan. The Whisper card (type 8) needs a small reveal surface and the test-panel replacement is an open THR-883 design question — both deliberately excluded here so the frameworks don't wait on UI design.

## Wiring

Envelope: raw entry `settings` → converter expands to `locationSubtypes` → existing `encounterCache` registration (no cache change). Openings: template fragment slots → existing THR-573 fragment resolution at instantiation. Cards: grants/costs applied in aftermath application via host-system APIs (ambition assignment, omen emission, compulsion, condition removal, attachment spawn, favor edges, detection pressure, doom delta). Coverage matrix: new generator script registered in package.json, output committed like the systems inventory.

## Constants table

| Constant | Initial | Purpose |
|---|---|---|
| `SETTING_CLASS_MAP` | 8-class table above | Class → subtype expansion; both-direction totals pinned by test |
| `HAND_SIZE_MIN` / `HAND_SIZE_MAX` | 4 / 6 | Cards dealt per step after filtering |
| `SPHERE_DISCOUNT` | 1 | Essence discount on god-sphere-matched cards; never below authored cost 1 |
| `ALL_OR_NOTHING_MAP` | widen-both-ends remap | The Gambit rider's six-band table |
| Coverage floors | advisory, unset | Per settings × reach cell; Christian sets when ready |

## Tracing

One trace per card dispatch that touches another system (ambition planted, omen emitted, favor created, condition lifted, item spawned) — reusing each host system's existing trace categories where they exist; player-driven volume, so no aggregation needed. Envelope expansion emits nothing (build-time).

## Fail-soft table

| Failure | Behavior |
|---|---|
| Unknown setting class on a template | Template registers nowhere; build-time test fails loud first |
| Declared class missing its opening | Build-time test failure (never a runtime blank) |
| Dispatch hook target API throws | Card's other effects still apply; one warn per template; step outcome unaffected |
| Grant references unbuilt content | Liveness test fails the build; runtime never sees it |
| Filter leaves hand under `HAND_SIZE_MIN` | Hand renders with what remains; never blocks the encounter |

## Three-pillar check

Engine: both tickets. Content: format decisions here; corpus deferred to THR-883 with rationale. UI: N/A with rationale (above). All three addressed.

## Vision audit

Nudge Model canon upheld: god acts in the physics, fate picks outcomes; riders remap bands with zero extra rng (determinism, NFP #3). The hand-as-activation-surface principle deepens systemic aliveness (Vision: systemic content over hardcoded fiction). No rejected approach reintroduced — the card pool is data-driven and open-ended, not a fixed action wheel.

## Rulebook impact

Rulebook §encounters gains: setting envelopes (where encounters occur), the card-type vocabulary, and design-time hands with runtime filtering. Update `Docs/canon/rulebook.md` + quick-reference rows in Ticket B's closeout; mark `[IMPL]` as each lands.

## NFP-compliance table

| NFP | Compliance |
|---|---|
| 1 Tunability | All knobs in the constants table; rider maps are data tables |
| 2 Inspectability | Dispatch traces; coverage matrix is a generated, diffable artifact |
| 3 Determinism | Riders remap without rng; filtering is pure over world state |
| 4 Fail-soft | Table above; build-time gates convert runtime risks to CI failures |
| 5 Narrative first | The entire point — cards must state mechanism inside fiction |
| 6 Additive | New optional fields; templates without them behave byte-identically |
| 7 Performance | Build-time expansion; no per-tick cost added |

## Done when

- Ticket A: envelope vocabulary + expansion live in the converter; opening/card-fiction variant slots resolve through the fragment path; completeness + both-direction map tests green; coverage-matrix script generates and is committed.
- Ticket B: `all_or_nothing` rider + priority; cost channels; the six dispatch hooks calling host-system APIs; runtime filters incl. sphere discount; content-liveness test over all grants.
- Both: `npm test` green, typecheck ratchet unchanged, 30-tick CLI smoke, wiring guide updated (new content-facing capabilities — mandatory per DoD).

## Coordination block

Suggested model: opus for both tickets. Parallel-safe with: each other (Ticket A touches `encounter-content.ts` converter + new data/scripts; Ticket B touches `unifiedAction.ts` types + `nudges.ts` + aftermath application) and with all non-content queue work. Mutex with: THR-883's eventual content commits (sequenced after both by construction). Blocked by: nothing.

## Notes for the executor

Read Decision 3's status column before estimating — "shipped" rows need zero work. Every dispatch hook reuses the host system's API; if one seems missing (reactive-ambition assignment has no path, THR-812), the minimal API addition belongs in Ticket B with a comment linking THR-812, not a parallel system. The supporting-content liveness test should follow `validateTraitRefs`' pattern and the THR-844 alias-table lessons.

## Interface impact

New cross-system writes (card dispatch → ambitions/omens/compulsion/conditions/attachments/favors/detection/doom) each land as a row in `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` in Ticket B's PR, per the interface-map DoD gate.

## Forked-audit verdicts

Not run — this plan records decisions Christian made live in chat (THR-608 chat-approval gate satisfied per decision). The design-audit pipeline adds nothing over the principal's direct verdicts; noted here so the absence is explicit rather than silent.
