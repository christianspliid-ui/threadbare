---
status: current
issue: THR-772
supersedes: the authored-choices layer of branching encounters (design-level; code retirement staged via THR-778)
---

# The Nudge Model — Encounter System Rebuild (program plan)

**User verdicts (Christian, chat, 2026-07-25/26 — settled):** The encounter player-interface is rebuilt around one principle: **the god acts in the physics of the scene, never in the dramaturgy of the story.** Choosing between authored futures for an agent ("Forge the truth" vs "Temper the narrative") is rejected — the player must never pick an ending. Instead the god plays **concrete, sphere-flavored nudges** (a stumble at the right moment, an unnaturally good mood, a spark of light in a dark dungeon, a surge of strength on a climb) that shift the odds; **fate rolls the outcome** on the existing five-band ladder; prose and a fate image pay the nudge off at every band — including the misfire bands, which are prime story.

This program is the delivery staging for that pivot. Origin chain: Malazan-tone dialogue → THR-609 register model → card-game research (Eldritch Horror's fused fiction;mechanics format is the preferred model) → abstraction assessment → prose pilot → substance pivot (blessed 2026-07-26). Playable proof artifact: `Design/mockups/2026-07-26-nudge-model-encounters.html` (v3) + `Design/mockups/assets/`.

## Settled rulings (all Christian, chat)

1. **Odds legible, words only.** The player sees the test (Reaches + agent tiers), a difficulty word, for/against factors, and the forecast in the five tier words. Percentages exist behind the words and are never shown (designer/debug view excepted).
2. **Stacking allowed** — multiple nudges per step, essence-limited.
3. **Nudge options are per-encounter authored content.** Quite-a-few options per encounter; mostly not reused across encounters; only generics (blessing, steady-breath class) are shared. Sphere tags + unlock gates + trait gates filter what a given god-and-agent pair can play.
4. **Unavailable options are hidden entirely** (not dimmed). Many options per encounter × different gods × different agents × different traits = the replayability engine.
5. **Quintessence is the stake.** Failure erodes it; heavy loss breaks the agent (out of the story for a while); death rare. Recovery: slow rebuild encounters (a few per Reach — tavern drunk, absolution, retire home, old friends, hard labor) plus one expensive unlock-gated god restore action.
6. **Every game object is a clickable link** opening a modal (image/glyph, description, basic stats, consequence). Tolls and meters read as words/phrases ("a heavy toll", "tremendous exertion"), never numbers.
7. **The agent portrait is visible in the encounter**; the motive line (why the agent is here: BY CHOICE / A MISSION / CHANCE / THE GOD'S HAND) heads every encounter.
8. **Trait-reactive variants**: agent traits (e.g. #trustworthy) shift base odds, unlock trait-only options, or swap in very-hard/very-easy/very-valuable variant encounters.
9. **Fate images per outcome band, with per-Reach metaphor sets** — a failed Iron encounter must not look like a failed Gold one. The five generic thread-weave images are the universal fallback set.
10. **Image doctrine**: agents change (any sex/size/clothing) — images mostly omit the agent; when present, generic or silhouetted (the plain hooded traveler is the approved baseline).

## Substrate inventory (verified in code, 2026-07-26)

| Prototype element | Game reality | Status |
|---|---|---|
| Forecast in 5 words + named factors | `src/engine/encounters/outcomeForecast.ts` — doomed/perilous/uncertain/favorable/fated, `ForecastModifier{source,delta}`, factor pool | **EXISTS** |
| Step difficulty + reach | `steps[].difficulty` (0–1), `steps[].reach` | **EXISTS** (difficulty→word mapping is a trivial add) |
| Agent capability tiers | `domainCapabilities` | **EXISTS** |
| Quintessence value, words, states | `src/types/quintessence.ts` — `quintessenceToWord()`, 10-word `QUINTESSENCE_LEXICON`, `QUINTESSENCE_THRESHOLDS` (healthy/strained/weakened/critical/broken), erosion sources incl. `encounter_failure`, passive regen | **EXISTS** (words-not-numbers is already the game's rule) |
| Broken → out-of-the-story behavior | thresholds exist; no behavioral consequence wired | **GAP (WS0)** |
| Rebuild encounters + god restore action | — | **GAP (WS5 content + WS0 action)** |
| Per-sphere essence pools | `EssencePool` (`src/types/influence.ts`) | **EXISTS** |
| Hand filtering (cost/sphere/bond/place; hidden vs dimmed) | `src/engine/encounters/handFilter.ts` | **EXISTS** |
| Nudge schema on templates | — | **GAP (WS0, additive `nudges[]`)** |
| Quintessence push/resist hooks | `src/engine/quintessenceActions.ts` | **EXISTS** (agent-side; god-side spend is WS0 wiring) |
| Band riders (e.g. no-crit-fail) | — | **GAP (WS0, resolution ladder)** |
| Mid-encounter pause/interaction | encounter stage + THR-668 interrupt registry | **EXISTS** (repurpose) |
| Motive line | THR-631 motive receipts | **EXISTS**; 4-way source classification = small **GAP (WS0)** |
| Trait gates on templates | `requiredTraits` + `has_trait` edges in `encounterFilterPipeline` | **EXISTS**; variant selection = **GAP (WS0)** |
| Personality | `axiologicalProfile` baseline | **EXISTS** (builder must be able to reference; WS1) |
| Attachments/items/conditions for modals | 171 attachments (8+5 starter, 111+35+12 reward) with flavorText; EntityVisual resolver (THR-637) | **EXISTS** (modal UI = WS2) |
| Prizes / seeds / reputation / bonds | rewardPool, encounter_seed, reputation, bond_change | **EXIST** |
| Outcome ladder (5 bands) | sigmoid→d100, unified | **EXISTS** |
| Encounter hero art field | `illustrationUrl` on branching (19 images in `public/assets/encounters`) | **EXISTS** for branching; linear templates = **GAP** (library tag field, WS0/WS4) |
| Reach/sphere icons | `public/assets/reaches/<reach>-<tier>.png`, `public/icons/spheres/*.png` | **EXIST** |
| Agent portraits | none (EntityVisual falls back to glyph+gradient) | **GAP (WS4 generic set)** |
| Fate images | 5 generic thread-weave images (mockup assets) | **PARTIAL — per-Reach sets are WS4** |

**Nothing in the prototype invents a data type the game lacks a home for.** The gaps are: nudge schema + riders + broken-state behavior + motive classification + trait variants (WS0), the interface (WS2), the image library (WS4), and content (WS5). Data types confirmed integrable into encounters: traits, personality, attachments (items/conditions/powers), bonds, reputation, seeds, quintessence, essence, motive receipts, companies (band encounters resolve per-step by best companion — nudge hands apply unchanged), economy context (THR-725 signals can drive factors), intelligence/marks.

## Content census (migration scope, counted 2026-07-26)

671 `UNIFIED_ACTION_TEMPLATES` (1231 steps), of which **531 mortal-drawable** (the encounter surface): encounter.* 183, ten guild families ~150, borderland 20, ag 18, mc 16, reputation 15, social 14, tavern 10, npc_* 16, monster 5, army 5, faction/fa 14, regional/liminal/enc/route ~15, misc rest. Plus **28 branching encounters** (`authoredChoices` — all convert) and **30 social scenes**. 171 attachments feed aftermath modals. Existing art: 83 action cards, 19 encounter heroes, 15 locations, 7 items.

## Image library strategy (WS4)

**How many:** initial target **≈156**: 40 per-Reach fate images (8 Reaches × 5 bands) + ~60 scene generics (place×situation archetypes covering the 531 linear-drawable templates — art attaches per archetype, never per template) + ~40 nudge-card images (12 spheres × 2 effect variants + ~16 concept generics) + ~16 generic portraits. Already made: 12 (3 heroes, 6 nudge, 5 fallback fate, 1 portrait — but heroes/portrait count toward their categories). Full-polish stretch (~250) adds branching-flagship specifics and top-30 attachment art.

**What types:** (1) encounter hero/scene (16:9, agent absent or silhouetted), (2) nudge cards (16:9, effect- or object-centered, agent absent/silhouetted), (3) fate images (16:9, per-Reach metaphor language, never any agent), (4) portraits (3:4, generic archetypes), (5) object/modal art (items/conditions; EntityVisual gradient+glyph is the standing fallback).

**How generics are identified and used:** a manifest (`encounter-image-library`) gives every image id, path, concept tags, sphere/reach/place tags, and a genericity note. The authoring rule: **an image is generic iff it reads correctly in ≥3 unrelated encounters and contains no named entity and no agent-identifying detail.** Builders pick by tag query (concept first, sphere/place refinement); the resolve chain is specific art → tag match → category generic → EntityVisual gradient+glyph, so missing art never blocks content.

## Workstreams

| WS | Issue | Scope | State | Depends on |
|---|---|---|---|---|
| epic | THR-772 | staging container | Todo | — |
| WS0 | THR-773 | engine substrate: `nudges[]` schema, forecast riders, broken-state behavior, motive classification, trait variants | Todo (needs design finalization) | — |
| WS1 | THR-774 | encounter builder skills + pipeline to nudge spec (incl. prose rubric, sphere-coverage rule, image tag step) | Todo | WS0 |
| WS2 | THR-775 | new encounter interface (test panel, hand, fate reveal, aftermath modals, hidden options, designer view) | Todo | WS0 |
| WS3 | THR-776 | migration audit: keep/rewrite/kill over the mortal-drawable predicate + branching + scenes | **Ready for Dev** | — |
| WS4 | THR-777 | image library: manifest + per-Reach fate sets + scene/nudge/portrait generics | Todo | manifest schema agreed with WS1 |
| WS5 | THR-778 | content migration batches + kill list + rebuild encounters per Reach + god restore action | Todo | WS0, WS1, WS3 (WS4 may lag) |

Each non-audit workstream runs its own design finalization (intent-judge + forked audits, per-system required sections incl. constants/tracing/fail-soft/interface-impact) before its Ready for Dev handoff. WS0's design pass owes a **Blast Radius** section (`src/types/unifiedAction.ts`, 278 importers) and the Step 0.7 interface-impact table (encounters subsystem is mapped).

## Three pillars & governance notes

**Engine** = WS0 (all additive; the census above is the Step 0.6 substrate evidence — this program activates `outcomeForecast`/`handFilter`/`quintessenceActions` rather than green-fielding). **UI** = WS2 (mockup v3 is the reference; DoD browser-verify applies). **Content** = WS1+WS3+WS5 (predicates, not counts — WS3's membership predicate is authoritative; the 531/28/30 figures are audit-time snapshots). **Rulebook impact:** yes — encounter interaction is a rule of play; the rulebook update lands with WS0+WS2, not as a follow-up. **Vision audit:** the model strengthens player-as-god framing (gods act diegetically); the authored-choices retirement contradicts no Vision premise but the encounters canon page and UL (nudge, fate forecast wording, broken) need updates — carried inside WS0/WS1 scope. This document is a **program staging plan**: it is the map, not any single feature's finished design, and no implementation should proceed from it directly except THR-776.

## NFP compliance (program level)

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — nudge costs/deltas/thresholds/erosion all named constants (most already exist in `quintessence.ts`, `registerRubric`, forecast constants) |
| 2 Inspectability | PASS — forecast factors are named; nudges are named modifiers; designer view exposes hidden options + numbers; audit + scorers produce evidence |
| 3 Determinism | PASS — nudges are inputs to the existing seeded resolution; no new randomness sources |
| 4 Fail-soft | PASS — image resolve chain ends in EntityVisual fallback; absent nudges[] = encounter runs as today; missing motive → CHANCE |
| 5 Narrative over mechanical | PASS — the entire program exists to serve story texture; misfire bands mandated |
| 6 Additive | PASS with note — schema additive; the authored-choices retirement is the one destructive step, staged behind the WS3 audit and per-encounter conversion |
| 7 Performance budget | PASS — static data + images; no tick-loop additions beyond broken-state checks |
