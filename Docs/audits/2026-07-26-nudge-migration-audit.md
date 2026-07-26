---
status: current
issue: THR-776
---

# Nudge Model WS3 — encounter migration audit (keep / rewrite / kill)

**Plan doc:** `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (§ WS3). This is the migration worklist WS5 (THR-778) executes against. Read-only audit — no template, engine, or UI code was changed.

## Verdict at a glance

| | Templates | Share |
|---|---:|---:|
| **KEEP** — vignette-shaped, clears the rubric; needs only nudge-hand authoring | 282 | 50% |
| **REWRITE** — sound premise, prose or structure fails | 214 | 38% |
| **KILL** — orphaned, redundant, or too thin to carry a hand | 65 → **48** | 12% → 9% |
| **Total** | **561** | |

> **Kill-list revision, 2026-07-26 (THR-779).** 17 of the 65 KILL entries were orphaned *only* by rule 1 ("no draw path") and carried the WIRE verdict. They are now registered in the encounter-cache path and marked **WIRED** in the per-template tables below, leaving **48 KILL** for WS5 (THR-778) — of which 44 are the `action.*` regional verbs. The 17 have a draw path but have **not** been re-scored against rules 2–11; WS5 classifies them with the rest of the corpus. Per-family KILL counts below are pre-revision.

## Six findings that change WS5's shape

**1. The corpus is 561, not 589 — the branching set was double-counted.** The ticket's scope reads "531 mortal-drawable + 28 branching + 30 scenes". All 28 `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` entries also live in `UNIFIED_ACTION_TEMPLATES`, so they are inside the 531. Applying the membership predicate and then subtracting the branching overlap gives **503 + 28 + 30 = 561 distinct templates**. The 531 figure reproduces exactly, which confirms the predicate below matches the one the design session ran.

**2. The "affinities absent" half of the predicate is dead.** The predicate is "`actorAffinities` absent, or includes `individual`/`group`". Measured: **zero** shipped templates have absent or empty `actorAffinities` (THR-736 locked this with a test). Every member of the corpus qualifies by *naming* a mortal affinity. The predicate is still correct as written, but WS5 should not expect an opt-out tail to exist.

**3. 61 templates have no draw path at all — and they are almost entirely the top of the guild ladder.** A `regional`-scale template is skipped by `generateUnifiedCandidates` (the array-scored path agents actually use). Three paths were checked before calling anything orphaned: the array-scored path, the encounter-cache path (`ENCOUNTER_TEMPLATES` + `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, scale-agnostic), and the seeded-family path (`encounterSeeding.matchFamily`, also scale-agnostic). 61 templates fail all three. 44 are `action.*` verbs carrying `['individual','faction']` — note these are *not* player cards either (player-castable requires `'ascendant'`, THR-659) and the faction phase dispatches from its own `FACTION_ACTION_TEMPLATES` map, not this array. The remaining 17 are `*.senior.*` / `*.elite.*` guild-tier content plus `fa.*` and `monster.encounter.*`. **The reward tier of guild progression is unreachable.**

   *Orphan-KILL means "do not spend nudge-authoring effort here", not "delete on sight".* Several of these read like content whose draw path was never wired rather than content that should not exist. Deleting them blind would destroy authored guild-progression content. **THR-779** carries the wire-or-delete decision and must land before WS5 executes the kill list.

   > **RESOLVED 2026-07-26 (THR-779).** The wire-or-delete verdict has executed the WIRE half. **17 wired, 44 remain KILL.** The 17 are registered in `CACHE_REGISTERED_REGIONAL_TEMPLATES` (`src/data/unified-action-templates.ts`) and consumed by `encounterCache.buildEntriesForLocationAndSublocations`, matched on `locationSubtypes` exactly as `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` is. Their authored `scale` is unchanged — `SCALE_PRIORITY` still orders them as regional. Verified against a live seed-42 medium world: **17/17 attach** (1–38 locations each). The three `fa.*` templates additionally needed `locationSubtypes` authored, having shipped with none — without it, cache registration matches no location and is a silent no-op. Guard: `src/engine/__tests__/regionalCacheRegistration.test.ts`.
   >
   > **The rank gate named in the plan was deliberately not applied — see THR-803.** The plan's route was to gate the guild tier behind `encounterChains`, but `recordChainStageCompletion` has **no production caller**: `chainProgress` is read by four modules and written by none, so it is permanently `{}` and any template at chain stage ≥ 1 is undrawable. Applying the gate before that write path exists would have re-orphaned the same 12 guild templates this change rescues. The 44 KILL entries below are unaffected and remain WS5's (THR-778) batch.

**4. Player exposure is concentrated ~10:1 into one family.** Headless seed-42 medium runs (`tick 120` and `tick 360`, the latter stopping at tick 166 on the twilight phase change) produced 93 resolved actions across **85 `encounter.*`**, 4 `reputation.*`, and 1 each of `stone.*` / `eye.*` / `star.*` / `veil.*` — **91% `encounter.*`**. The guild families (106 templates), `npc_*` (16), `social` (14), `tavern` (10) and `borderland` (20) drew **zero** observed actions across 166 ticks with 368 agents. One seed over 166 ticks is weak evidence of *never* but strong evidence of *low share*: it sets the batch order regardless.

**5. All 28 branching encounters convert, as expected, and take the whole `authoredChoices` layer with them.** 32 templates carry `authoredChoices` (the 28 branching plus 4 in other families). Every one is REWRITE by rule — the Nudge Model retires choose-between-futures. These are also the only templates carrying `illustrationUrl` hero art (19 images), so WS4 inherits their art as scene-generic candidates rather than losing it.

**6. 40 mortal-drawn templates are written in the god's voice.** They address the reader as `you`/`your` — correct for a divine action card, wrong for a scene an *agent* walks into. `npc_ask_information` reads "You lean on their thoughts, parting the curtain of suspicion" while carrying `actorAffinities: ['individual']` and `scale: 'personal'`, so it is drawn by mortals and narrated to a god. Concentrated in `npc` ×16, `ag` ×12, `encounter` ×2, `rb` ×2, `fa` ×2. This is a speaker bug, not a style preference: under the Nudge Model the god acts *through* the nudge hand and the scene prose stays with the mortal, so every one of these needs its narrator swapped during the WS5 rewrite. Detector: ≥2 second-person pronouns on a template with no `ascendant` affinity.

## Recommended WS5 batch order

Ordered by player exposure first, then by cost-to-value. Batch 1 alone covers ~91% of what a player actually sees.

| Batch | Scope | Templates | Rationale |
|---|---|---:|---|
| **1** | `encounter.*` REWRITE set | 48 | 91% of observed draws land here. Fixing this family alone flips the felt quality of a run. |
| **2** | `encounter.*` KEEP set — nudge hands only | 133 | No prose work; pure hand authoring. Cheapest exposure-per-hour in the corpus. |
| **3** | Branching encounters | 28 | All convert. Highest per-template cost (L difficulty, authored-choice teardown) but they are the flagship surfaces and already carry hero art. |
| **4** | Social scenes | 30 | Self-contained 5-step arc; the arc maps onto nudge steps almost 1:1. |
| **5** | Guild families (reachable subset) | 152 → **164** | Large but low observed exposure. The finding-3 reachability decision has landed (THR-779): the 12 wired `*.senior.*` / `*.elite.*` templates join this batch. |
| **6** | Long tail (`borderland`, `social`, `tavern`, `npc_*`, `ag`, `army`, `monster`, misc) | 105 | Low exposure, mostly small hands. |
| — | Kill list | 65 → **48** | Not authored against. The reachability verdict has landed (THR-779): 17 wired, 44 `action.*` verbs remain KILL alongside the 4 non-orphan KILLs. |

## Per-family summary

| Family | Total | KEEP | REWRITE | KILL | Nudge-hand S/M/L |
|---|---:|---:|---:|---:|---|
| encounter.* (core exploration) | 183 | 133 | 48 | 2 | 7 / 157 / 19 |
| branching encounters | 28 | 0 | 28 | 0 | 1 / 0 / 27 |
| social scenes | 30 | 15 | 15 | 0 | 1 / 8 / 21 |
| guild families | 166 | 90 | 62 | 14 | 97 / 64 / 5 |
| borderland | 20 | 19 | 1 | 0 | 0 / 20 / 0 |
| social | 14 | 5 | 9 | 0 | 0 / 10 / 4 |
| tavern | 10 | 9 | 1 | 0 | 3 / 5 / 2 |
| npc_* | 16 | 0 | 16 | 0 | 16 / 0 / 0 |
| ag (arcane/guild aux) | 18 | 0 | 18 | 0 | 1 / 13 / 4 |
| faction / fa | 14 | 0 | 11 | 3 | 10 / 4 / 0 |
| army | 5 | 5 | 0 | 0 | 1 / 4 / 0 |
| monster | 5 | 3 | 0 | 2 | 0 / 5 / 0 |
| misc (action) | 46 | 0 | 2 | 44 | 46 / 0 / 0 |
| misc (encounter) | 3 | 3 | 0 | 0 | 1 / 2 / 0 |
| misc (mentorship) | 3 | 0 | 3 | 0 | 3 / 0 / 0 |
| **Total** | **561** | **282** | **214** | **65** | |

## Method

### Membership predicate (authoritative — not a count)

- Every `UnifiedActionTemplate` in `UNIFIED_ACTION_TEMPLATES` whose `actorAffinities` is absent/empty **or** includes `individual` or `group`, **minus** the branching overlap;
- plus every `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` entry;
- plus every `SOCIAL_SCENE_TEMPLATES` entry.

### Classification rules (first match wins)

| # | Rule | Verdict |
|---|---|---|
| 1 | No draw path (see reachability model) | KILL |
| 2 | Same normalised name+description premise as an earlier template in the same family | KILL |
| 3 | Fewer than 45 authored words across all prose fields and steps | KILL |
| 4 | Carries `authoredChoices` | REWRITE |
| 5 | ≥2 second-person pronouns and no `ascendant` affinity (god's voice on mortal-drawn prose) | REWRITE |
| 6 | Prose-quality band `fail` or `error` (`scoreProseEntry`, shipped scorer) | REWRITE |
| 7 | Register-compliance band `fail` (`scoreRegisterCompliance`, THR-609) | REWRITE |
| 8 | not-X-but-Y construction ≥ 2× | REWRITE |
| 9 | Abstract-noun density ≥ 4.5 per 100 words | REWRITE |
| 10 | Vagueness density ≥ 2.0 per 100 words | REWRITE |
| 11 | Prose or register band `warn` | REWRITE (light pass) |
| — | otherwise | KEEP |

### Reachability model

A template is orphaned only when **all three** agent-facing draw paths reject it:

1. **Array-scored path** — `generateUnifiedCandidates` (`src/engine/unifiedCandidates.ts`), reached from `unifiedActionPhases.ts`. Gates on reach-block, **scale (`cosmic`/`regional` skipped)**, actor affinity, location subtype, opposing band.
2. **Encounter-cache path** — `ENCOUNTER_TEMPLATES` + `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` via `encounterCache.ts`. Scale-agnostic.
3. **Seeded-family path** — `encounterSeeding.matchFamily`. Scale-agnostic; requires `individual` affinity and an id under one of the 47 planted `encounterFamily` prefixes.

A template is also orphaned when it declares `locationSubtypes` and **none** of them resolves against the merged place universe: the `LocationSubtype` union, the `TerrainType` union, and the 130 minted `sublocation-type.*` ids. The sublocation set is merged across all five minting sources (`sublocation.ts`, `settlementGenome/*`, `guildSeeding.ts`, `factionSeeding.ts`, `phaseSublocations.ts`) — checking `SUBTYPE_SUBLOCATION_MAP` alone makes the test vacuous.

### Prose rubric inputs

- **Shipped scorers, unmodified:** `scoreProseEntry` (`src/engine/content-eval/proseQualityScore.ts`) and the register scorer it calls (`registerCompliance.ts`). Fields extracted exactly as `collectAuthoredProse.collectEncounters` does, so bands are comparable to the Prose QA tab / `__DEBUG.proseQualityReport()`.
- **Scratch abstraction detectors** (this audit only; spec in the appendix) run over the **full** authored text *including step narratives and afterimages*, which the shipped collector does not sweep. That is deliberate: step prose is the bulk of what a player reads and it is where the abstraction problem lives.

### Exposure sampling

`npm run cli -- --seed 42 --map medium`, `tick 120` and `tick 360`. Selection share read off `state.unifiedActions` grouped by `templateId`. Single seed, single map size — treat as a share signal, not a coverage census.

## Per-family worklists

`Tag` is the suggested scene-image tag query for WS4 (`place · reach · situation`). `H` is the nudge-hand difficulty estimate: **S** ≤2 steps single reach, **M** 3–4 steps or 2 reaches, **L** ≥5 steps, branching, or ≥3 reaches.

### encounter.* (core exploration) — 183 (KEEP 133 · REWRITE 48 · KILL 2)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `encounter.anomaly.dreaming_light` | REWRITE | Borderline (prose warn / register pass) | place:glowcap_hollow · reach:eye · situation:encounter | M |
| `encounter.anomaly.fallen_star` | REWRITE | Borderline (prose warn / register pass) | place:iron_seep · reach:eye · situation:encounter | M |
| `encounter.anomaly.wild_apothecary` | REWRITE | Borderline (prose warn / register pass) | place:herb_garden · reach:eye · situation:encounter | S |
| `encounter.apotheosis.ascension` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:star · situation:encounter | L |
| `encounter.arcane_resonance_study` | REWRITE | Abstraction 5.68/100w | place:hamlet · reach:veil · situation:encounter | M |
| `encounter.assess_holdings` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.barter_supplies` | REWRITE | Vagueness 2.6/100w | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.barter_survival` | REWRITE | Abstraction 4.65/100w | place:wilderness · reach:gold · situation:encounter | M |
| `encounter.black_market_deal` | REWRITE | Borderline (prose pass / register warn) | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.caravan_deal` | REWRITE | Abstraction 5.81/100w | place:oasis · reach:gold · situation:encounter | M |
| `encounter.confront_the_unknown` | REWRITE | Vagueness 2.54/100w | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.council_mediation` | REWRITE | Abstraction 6.41/100w | place:capital · reach:heart · situation:encounter | M |
| `encounter.court_noble` | REWRITE | Abstraction 5.06/100w | place:capital · reach:heart · situation:encounter | M |
| `encounter.debt_collection` | REWRITE | Abstraction 6.84/100w | place:town · reach:gold · situation:encounter | M |
| `encounter.decipher_ancient_inscriptions` | REWRITE | Abstraction 5.1/100w | place:ruins · reach:eye · situation:encounter | M |
| `encounter.expedition_leadership` | REWRITE | Abstraction 7.93/100w | place:wilderness · reach:heart · situation:encounter | M |
| `encounter.faction_unification` | REWRITE | Abstraction 5/100w | place:capital · reach:heart · situation:encounter | L |
| `encounter.fortification_engineering` | REWRITE | Abstraction 4.91/100w | place:fort · reach:stone · situation:encounter | M |
| `encounter.frontier_settlement` | REWRITE | Abstraction 10.56/100w | place:farmland · reach:stone · situation:encounter | L |
| `encounter.guild_initiation_trial` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.investigate_anomaly` | REWRITE | Vagueness 3.92/100w | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.library_expansion` | REWRITE | Borderline (prose pass / register warn) | place:tower · reach:eye · situation:encounter | L |
| `encounter.market_day_festival` | REWRITE | Vagueness 2.43/100w | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.master_local_craft` | REWRITE | Abstraction 5.76/100w | place:hamlet · reach:stone · situation:encounter | M |
| `encounter.minor_cantrip` | REWRITE | Borderline (prose pass / register warn) | place:shrine · reach:veil · situation:encounter | M |
| `encounter.offer_small_prayer` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:star · situation:encounter | M |
| `encounter.pilgrimage_trial` | REWRITE | not-X-but-Y ×2 | place:shrine · reach:veil · situation:encounter | M |
| `encounter.plague_outbreak` | REWRITE | Abstraction 5.43/100w | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.raise_monument` | REWRITE | Abstraction 10.86/100w | place:capital · reach:stone · situation:encounter | M |
| `encounter.rally_the_locals` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:star · situation:encounter | M |
| `encounter.read_the_stars` | REWRITE | Borderline (prose pass / register warn) | place:wilderness · reach:star · situation:encounter | M |
| `encounter.read_the_wards` | REWRITE | Borderline (prose pass / register warn) | place:castle · reach:veil · situation:encounter | M |
| `encounter.rest_and_reflect` | REWRITE | Abstraction 5.26/100w | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.scout_the_perimeter` | REWRITE | Abstraction 6.76/100w | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.seal_the_breach` | REWRITE | Borderline (prose pass / register warn) | place:ruins · reach:veil · situation:encounter | L |
| `encounter.sharpen_blades` | REWRITE | Borderline (prose pass / register warn) | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.shell_proof.fate_card_trial` | REWRITE | Prose `fail` (50) | place:wild · reach:resolve · situation:encounter | S |
| `encounter.shrine_offering` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:shrine · reach:star · situation:encounter | M |
| `encounter.smuggler_pact` | REWRITE | Borderline (prose pass / register warn) | place:camp · reach:gold · situation:encounter | M |
| `encounter.spirit_walk` | REWRITE | Borderline (prose pass / register warn) | place:shrine · reach:veil · situation:encounter | M |
| `encounter.temple_expansion` | REWRITE | Abstraction 7.19/100w | place:shrine · reach:stone · situation:encounter | L |
| `encounter.tend_the_dead` | REWRITE | Vagueness 2.1/100w | place:battleground · reach:star · situation:encounter | M |
| `encounter.tend_to_wounds` | REWRITE | Abstraction 5.66/100w | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.the_loan` | REWRITE | Abstraction 6.07/100w | place:town · reach:gold · situation:encounter | M |
| `encounter.tower_restoration` | REWRITE | Abstraction 4.97/100w | place:ruins · reach:stone · situation:encounter | M |
| `encounter.trap.sprung` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:shadow · situation:encounter | S |
| `encounter.ward_the_camp` | REWRITE | Vagueness 2.41/100w | place:hamlet · reach:veil · situation:encounter | M |
| `encounter.weave_political_alliance` | REWRITE | Abstraction 6.44/100w | place:hamlet · reach:star · situation:encounter | L |
| `encounter.aid_refugees` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | L |
| `encounter.anomaly.bones_old_world` | KEEP | Clears the rubric — nudge-hand authoring only | place:fossil_bed · reach:eye · situation:encounter | M |
| `encounter.anomaly.drowned_hoard` | KEEP | Clears the rubric — nudge-hand authoring only | place:sunken_treasury · reach:eye · situation:encounter | M |
| `encounter.anomaly.gleaming_vein` | KEEP | Clears the rubric — nudge-hand authoring only | place:gem_deposit · reach:eye · situation:encounter | M |
| `encounter.anomaly.moons_tears` | KEEP | Clears the rubric — nudge-hand authoring only | place:pearl_shoal · reach:eye · situation:encounter | M |
| `encounter.anomaly.sap_of_ages` | KEEP | Clears the rubric — nudge-hand authoring only | place:golden_grove · reach:eye · situation:encounter | M |
| `encounter.anomaly.sealed_chamber` | KEEP | Clears the rubric — nudge-hand authoring only | place:ancient_vault · reach:eye · situation:encounter | L |
| `encounter.anomaly.singing_dark` | KEEP | Clears the rubric — nudge-hand authoring only | place:crystal_cavern · reach:eye · situation:encounter | M |
| `encounter.arcane_cataclysm` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:veil · situation:encounter | M |
| `encounter.arcane_duel` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:veil · situation:encounter | M |
| `encounter.arena_combat` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:encounter | M |
| `encounter.band_defend` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.band_raid` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:shadow · situation:encounter | M |
| `encounter.bandit_ambush` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:encounter | M |
| `encounter.barter_with_travelers` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.beast_hunt` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:encounter | M |
| `encounter.bind_spirit` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:veil · situation:encounter | M |
| `encounter.blessing_of_passage` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:star · situation:encounter | M |
| `encounter.brew_potion` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.bridge_engineering` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:stone · situation:encounter | L |
| `encounter.broken_span` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:stone · situation:encounter | M |
| `encounter.caravan_guard` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.case_the_joint` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:encounter | M |
| `encounter.catalogue_the_tower` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:eye · situation:encounter | M |
| `encounter.clear_the_rubble` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:stone · situation:encounter | M |
| `encounter.commune_with_stars` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:star · situation:encounter | M |
| `encounter.compose_saga` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:heart · situation:encounter | M |
| `encounter.confront_ambush` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:eye · situation:encounter | L |
| `encounter.confront_den_assault` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:encounter | L |
| `encounter.confront_guild_falls` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | L |
| `encounter.confront_standoff` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.craft_talisman` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:veil · situation:encounter | M |
| `encounter.dead_drop` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:shadow · situation:encounter | M |
| `encounter.decipher_old_markings` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.deep_descent` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:encounter | M |
| `encounter.defend_against_predators` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.delve_into_depths` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:encounter | M |
| `encounter.dig_a_well` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:stone · situation:encounter | M |
| `encounter.diplomats_maze` | KEEP | Clears the rubric — nudge-hand authoring only | place:capital · reach:heart · situation:encounter | M |
| `encounter.dragons_challenge` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:encounter | M |
| `encounter.drill_the_watch` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:iron · situation:encounter | M |
| `encounter.festival_of_spheres` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:veil · situation:encounter | M |
| `encounter.forage_provisions` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.forage_the_land` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:stone · situation:encounter | M |
| `encounter.forbidden_tome` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:eye · situation:encounter | M |
| `encounter.foreign_trader` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:encounter | M |
| `encounter.forge_construction` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:encounter | L |
| `encounter.garrison_gossip` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:heart · situation:encounter | M |
| `encounter.gather_firewood` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:encounter | M |
| `encounter.grand_tournament` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:encounter | M |
| `encounter.grave_robbery` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:shadow · situation:encounter | M |
| `encounter.guild_aid` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:encounter | M |
| `encounter.guild_negotiation` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:encounter | M |
| `encounter.harbor_construction` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:stone · situation:encounter | L |
| `encounter.harvest_bounty` | KEEP | Clears the rubric — nudge-hand authoring only | place:farmland · reach:gold · situation:encounter | M |
| `encounter.healer_aid` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:gold · situation:encounter | L |
| `encounter.healers_oath` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:gold · situation:encounter | M |
| `encounter.hedge_remedy` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:veil · situation:encounter | M |
| `encounter.hermits_wisdom` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:heart · situation:encounter | M |
| `encounter.hire_guide` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:star · situation:encounter | M |
| `encounter.hollow_watch` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:encounter | M |
| `encounter.honor_duel` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:iron · situation:encounter | M |
| `encounter.inscribe_ward` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:veil · situation:encounter | M |
| `encounter.inspect_the_armoury` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:iron · situation:encounter | M |
| `encounter.knowledge_test` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:eye · situation:encounter | M |
| `encounter.labor_dispute` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:gold · situation:encounter | M |
| `encounter.listen_for_rumors` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:shadow · situation:encounter | M |
| `encounter.local_gossip` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.local_tales` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.map_the_passages` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:encounter | M |
| `encounter.market_haggle` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:encounter | M |
| `encounter.master_craftsman_challenge` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:encounter | M |
| `encounter.mend_equipment` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:stone · situation:encounter | M |
| `encounter.mend_fishing_nets` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.merchant_caravan` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:encounter | M |
| `encounter.merchants_gambit` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:encounter | M |
| `encounter.militia_aid` | KEEP | Clears the rubric — nudge-hand authoring only | place:fort · reach:iron · situation:encounter | M |
| `encounter.mineral_vein_discovery` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:stone · situation:encounter | M |
| `encounter.mystic_trade` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:gold · situation:encounter | M |
| `encounter.mystical_vision_quest` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:veil · situation:encounter | M |
| `encounter.negotiate_dispute` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.negotiate_passage` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:heart · situation:encounter | M |
| `encounter.night_watch` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:shadow · situation:encounter | M |
| `encounter.patch_the_walls` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:stone · situation:encounter | M |
| `encounter.patrol_perimeter` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | M |
| `encounter.pickpocket` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:shadow · situation:encounter | M |
| `encounter.pirate_raid` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:encounter | M |
| `encounter.political_intrigue` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:heart · situation:encounter | L |
| `encounter.prisoner_interrogation` | KEEP | Clears the rubric — nudge-hand authoring only | place:fort · reach:shadow · situation:encounter | M |
| `encounter.prospect_the_seam` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:gold · situation:encounter | M |
| `encounter.prospecting_expedition` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:encounter | M |
| `encounter.rally_faithful` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:veil · situation:encounter | M |
| `encounter.rare_material` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:stone · situation:encounter | M |
| `encounter.recruit_militia` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.relic_hunt` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:encounter | M |
| `encounter.rest_and_recover` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.restless_spirits` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:veil · situation:encounter | M |
| `encounter.sacred_offering` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:veil · situation:encounter | M |
| `encounter.sacred_text_study` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:eye · situation:encounter | M |
| `encounter.salvage_operation` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:stone · situation:encounter | M |
| `encounter.sanctuary_construction` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:stone · situation:encounter | L |
| `encounter.scholar_aid` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:encounter | M |
| `encounter.shadow_ambush` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:shadow · situation:encounter | M |
| `encounter.shadow_hunt` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:shadow · situation:encounter | M |
| `encounter.shadow_in_the_night` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:shadow · situation:encounter | M |
| `encounter.shore_up_shelter` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:stone · situation:encounter | M |
| `encounter.shore_up_the_mine` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:stone · situation:encounter | M |
| `encounter.siege_defense_planning` | KEEP | Clears the rubric — nudge-hand authoring only | place:fort · reach:iron · situation:encounter | M |
| `encounter.smuggle_goods` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:shadow · situation:encounter | M |
| `encounter.spar_with_a_stranger` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:encounter | M |
| `encounter.spell_bargain` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:veil · situation:encounter | M |
| `encounter.starborn_vigil` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:star · situation:encounter | M |
| `encounter.steal_secrets` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:shadow · situation:encounter | M |
| `encounter.study_surroundings` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:eye · situation:encounter | M |
| `encounter.sunken_vault` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:encounter | L |
| `encounter.sway_mercenary` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:gold · situation:encounter | M |
| `encounter.tavern_brawl` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:encounter | M |
| `encounter.tend_the_weary` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:encounter | M |
| `encounter.test_the_seal` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:veil · situation:encounter | M |
| `encounter.the_fence` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:shadow · situation:encounter | S |
| `encounter.the_haggle` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.the_rich_vein` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:gold · situation:encounter | M |
| `encounter.toll_bridge` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:encounter | M |
| `encounter.trace_ley_lines` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:veil · situation:encounter | M |
| `encounter.trade_caravan_escort` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:encounter | S |
| `encounter.trial_by_combat` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:iron · situation:encounter | M |
| `encounter.trial_of_flame` | KEEP | Clears the rubric — nudge-hand authoring only | place:mining · reach:iron · situation:encounter | M |
| `encounter.tribute_exchange` | KEEP | Clears the rubric — nudge-hand authoring only | place:capital · reach:gold · situation:encounter | M |
| `encounter.vault_heist` | KEEP | Clears the rubric — nudge-hand authoring only | place:castle · reach:shadow · situation:encounter | M |
| `encounter.war_trophy` | KEEP | Clears the rubric — nudge-hand authoring only | place:battleground · reach:iron · situation:encounter | M |
| `encounter.warband_training` | KEEP | Clears the rubric — nudge-hand authoring only | place:fort · reach:iron · situation:encounter | M |
| `encounter.warlords_crucible` | KEEP | Clears the rubric — nudge-hand authoring only | place:fort · reach:iron · situation:encounter | M |
| `encounter.wildcraft_shelter` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:stone · situation:encounter | M |
| `encounter.shell_proof.reckless_wager` | KILL | Thin premise — 34w authored | place:wild · reach:resolve · situation:encounter | S |
| `encounter.shell_proof.tiered_proving` | KILL | Thin premise — 31w authored | place:wild · reach:combat · situation:encounter | S |

### branching encounters — 28 (KEEP 0 · REWRITE 28 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `broker.quest.rival_shrine_betrayal` | REWRITE | Wrong speaker — divine `you/your` ×6 on mortal-drawn prose | place:wild · reach:shadow · situation:misc | L |
| `crafting.quest.flawed_steel` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:heart · situation:misc | L |
| `enc.brink_rescue` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:star · situation:regional | L |
| `enc.courtyard_duel` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:iron · situation:regional | L |
| `enc.letters_of_introduction` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:gold · situation:regional | L |
| `eye.reckoning.verdict_that_burns` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:city · reach:eye · situation:misc | L |
| `gold.famine.merchant_granaries` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:city · reach:gold · situation:misc | L |
| `healer.quest.wandering_healer_shrine_access` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:heart · situation:misc | S |
| `liminal.quest.road_ambush` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:iron · situation:regional | L |
| `liminal.quest.soul_ferryman` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:heart · situation:regional | L |
| `reputation.eye.the_blinded_oracle` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wilderness · reach:eye · situation:reputation | L |
| `reputation.eye.the_oracle_consulted` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:eye · situation:reputation | L |
| `reputation.gold.the_merchants_favor` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:gold · situation:reputation | L |
| `reputation.gold.the_unmarked_crossing` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:gold · situation:reputation | L |
| `reputation.heart.pilgrims_offering` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:heart · situation:reputation | L |
| `reputation.iron.the_executioners_commission` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:iron · situation:reputation | L |
| `reputation.iron.warlords_tribute` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:iron · situation:reputation | L |
| `reputation.power.the_renowned_duel` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:iron · situation:reputation | L |
| `reputation.shadow.shadow_court_audience` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:shadow · situation:reputation | L |
| `reputation.shadow.the_infiltrators_approach` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:shadow · situation:reputation | L |
| `reputation.star.the_star_pilgrim` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:star · situation:reputation | L |
| `reputation.stone.the_jury_of_the_ruined` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:ruin · reach:stone · situation:reputation | L |
| `reputation.stone.the_stones_judgement` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:stone · situation:reputation | L |
| `reputation.veil.the_silent_chamber` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:ruin · reach:veil · situation:reputation | L |
| `reputation.veil.the_veiled_consultation` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:veil · situation:reputation | L |
| `star.turning.comet_omen` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:star · situation:misc | L |
| `stone.permanence.mason_lord_wall` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:settlement · reach:stone · situation:misc | L |
| `veil.truth.page_beneath_saint` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:temple · reach:veil · situation:misc | L |

### social scenes — 30 (KEEP 15 · REWRITE 15 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `social_scene.contract_dispute` | REWRITE | Abstraction 5.5/100w | place:town · reach:gold · situation:social | L |
| `social_scene.eulogy_memorial` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:heart · situation:social | M |
| `social_scene.extortion` | REWRITE | Abstraction 4.95/100w | place:hamlet · reach:shadow · situation:social | L |
| `social_scene.festival_gathering` | REWRITE | Vagueness 2.5/100w | place:hamlet · reach:heart · situation:social | M |
| `social_scene.mentorship_offer` | REWRITE | Vagueness 2.54/100w | place:hamlet · reach:eye · situation:social | L |
| `social_scene.oath_swearing` | REWRITE | Borderline (prose pass / register warn) | place:hamlet · reach:star · situation:social | M |
| `social_scene.political_audience` | REWRITE | Abstraction 5.36/100w | place:town · reach:heart · situation:social | L |
| `social_scene.religious_conversion` | REWRITE | Abstraction 4.51/100w | place:hamlet · reach:star · situation:social | L |
| `social_scene.reputation_assessment` | REWRITE | Abstraction 10.61/100w | place:hamlet · reach:eye · situation:social | S |
| `social_scene.spy_debrief` | REWRITE | Abstraction 5.15/100w | place:hamlet · reach:shadow · situation:social | L |
| `social_scene.tavern_confession` | REWRITE | Abstraction 10.13/100w | place:hamlet · reach:heart · situation:social | M |
| `social_scene.the_accusation` | REWRITE | Abstraction 10.84/100w | place:hamlet · reach:eye · situation:social | M |
| `social_scene.the_interrogation` | REWRITE | Abstraction 5.83/100w | place:town · reach:eye · situation:social | L |
| `social_scene.trial_judgment` | REWRITE | Abstraction 7.23/100w | place:town · reach:eye · situation:social | L |
| `social_scene.warlords_demand` | REWRITE | Abstraction 5.77/100w | place:city · reach:iron · situation:social | L |
| `social_scene.betrayal_reveal` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:shadow · situation:social | L |
| `social_scene.confrontation` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:social | L |
| `social_scene.coronation_speech` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:star · situation:social | L |
| `social_scene.court_whispers` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:social | L |
| `social_scene.double_agent` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:shadow · situation:social | L |
| `social_scene.peace_negotiation` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:social | L |
| `social_scene.protection_racket` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:social | L |
| `social_scene.recruitment_pitch` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:social | L |
| `social_scene.romantic_pursuit` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:social | L |
| `social_scene.tavern_negotiation` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:social | L |
| `social_scene.territorial_accord` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:social | L |
| `social_scene.the_challenge` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:social | M |
| `social_scene.town_assembly` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:heart · situation:social | M |
| `social_scene.trade_fair` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:social | L |
| `social_scene.war_council` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:social | M |

### guild families — 166 (KEEP 90 · REWRITE 62 · KILL 14)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `ac.elite.arcane_thesis` | REWRITE | Borderline (prose warn / register pass) | place:capital · reach:veil · situation:guild | M |
| `ac.elite.seal_the_breach` | REWRITE | Borderline (prose warn / register pass) | place:city · reach:veil · situation:guild | M |
| `ac.join` | REWRITE | Abstraction 5.7/100w | place:city · reach:veil · situation:guild | S |
| `ac.promotion` | REWRITE | Abstraction 5.82/100w | place:city · reach:veil · situation:guild | S |
| `ac.quest.anomaly_report` | REWRITE | Abstraction 5.9/100w | place:city · reach:eye · situation:guild | S |
| `ac.quest.ley_survey` | REWRITE | Abstraction 5.02/100w | place:city · reach:veil · situation:guild | M |
| `ac.quest.translate_tome` | REWRITE | Abstraction 4.61/100w | place:city · reach:eye · situation:guild | M |
| `ac.quest.ward_inspection` | REWRITE | Abstraction 5.41/100w | place:city · reach:veil · situation:guild | S |
| `ac.senior.enchant_artifact` | REWRITE | Abstraction 5.47/100w | place:city · reach:veil · situation:guild | S |
| `ac.senior.planar_probe` | REWRITE | Borderline (prose warn / register pass) | place:capital · reach:veil · situation:guild | S |
| `ac.senior.ruin_expedition` | REWRITE | Borderline (prose warn / register pass) | place:city · reach:eye · situation:guild | M |
| `bf.join` | REWRITE | Abstraction 6.34/100w | place:town · reach:stone · situation:guild | S |
| `bf.promotion` | REWRITE | Abstraction 6.05/100w | place:town · reach:stone · situation:guild | S |
| `bf.quest.craft_commission` | REWRITE | Abstraction 4.78/100w | place:town · reach:stone · situation:guild | M |
| `bf.senior.master_craft` | REWRITE | Abstraction 5.35/100w | place:town · reach:stone · situation:guild | S |
| `bf.senior.raise_bridge` | REWRITE | Abstraction 4.61/100w | place:town · reach:stone · situation:guild | S |
| `bf.social.guild_feast` | REWRITE | Abstraction 6.28/100w | place:town · reach:heart · situation:guild | S |
| `cg.elite.purge_corruption` | REWRITE | Abstraction 4.62/100w | place:city · reach:iron · situation:guild | L |
| `cg.promotion` | REWRITE | Abstraction 4.96/100w | place:town · reach:iron · situation:guild | S |
| `cg.quest.escort_prisoner` | REWRITE | Vagueness 3.29/100w | place:town · reach:iron · situation:guild | S |
| `cg.social.barracks_meal` | REWRITE | Borderline (prose warn / register pass) | place:town · reach:heart · situation:guild | S |
| `cg.social.training_yard` | REWRITE | Abstraction 5.83/100w | place:town · reach:iron · situation:guild | S |
| `hod.promotion` | REWRITE | Abstraction 4.52/100w | place:temple · reach:star · situation:guild | S |
| `hod.quest.deliver_judgment` | REWRITE | Borderline (prose pass / register warn) | place:temple · reach:star · situation:guild | M |
| `hod.senior.cleanse_corruption` | REWRITE | Borderline (prose pass / register warn) | place:temple · reach:star · situation:guild | M |
| `hod.senior.lead_crusade` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:city · reach:iron · situation:guild | M |
| `lk.elite.cosmic_revelation` | REWRITE | Abstraction 4.68/100w | place:ruins · reach:eye · situation:guild | S |
| `lk.quest.map_ley_lines` | REWRITE | Abstraction 5.43/100w | place:wilderness · reach:eye · situation:guild | S |
| `lk.quest.recover_tome` | REWRITE | Borderline (prose pass / register warn) | place:ruins · reach:eye · situation:guild | S |
| `lk.quest.translate_text` | REWRITE | Abstraction 6.19/100w | place:tower · reach:eye · situation:guild | S |
| `lk.senior.excavate_archive` | REWRITE | Abstraction 5.48/100w | place:ruins · reach:eye · situation:guild | S |
| `mc.quest.collect_bounty` | REWRITE | Abstraction 6.67/100w | place:town · reach:undefined · situation:guild | S |
| `mc.senior.extraction_op` | REWRITE | Abstraction 6.9/100w | place:city · reach:undefined · situation:guild | S |
| `mc.senior.hostile_negotiation` | REWRITE | Abstraction 6.25/100w | place:city · reach:undefined · situation:guild | S |
| `mct.join` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:town · reach:gold · situation:guild | S |
| `mct.senior.acquire_warehouse` | REWRITE | Borderline (prose pass / register warn) | place:city · reach:gold · situation:guild | M |
| `mct.social.ledger_review` | REWRITE | Abstraction 4.74/100w | place:town · reach:gold · situation:guild | S |
| `rb.join` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:town · reach:eye · situation:guild | S |
| `rb.promotion` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:town · reach:iron · situation:guild | S |
| `rb.quest.clear_threat` | REWRITE | Abstraction 4.99/100w | place:town · reach:iron · situation:guild | M |
| `rb.social.equipment_trade` | REWRITE | Abstraction 5.14/100w | place:town · reach:eye · situation:guild | S |
| `tg.elite.shadow_war` | REWRITE | Abstraction 4.92/100w | place:city · reach:shadow · situation:guild | L |
| `tg.elite.vault_break` | REWRITE | Borderline (prose warn / register pass) | place:capital · reach:shadow · situation:guild | L |
| `tg.join` | REWRITE | Abstraction 4.96/100w | place:town · reach:shadow · situation:guild | S |
| `tg.promotion` | REWRITE | Abstraction 6.67/100w | place:town · reach:shadow · situation:guild | S |
| `tg.quest.case_the_mark` | REWRITE | Borderline (prose pass / register warn) | place:town · reach:shadow · situation:guild | M |
| `tg.quest.pocket_run` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:town · reach:shadow · situation:guild | M |
| `tg.senior.noble_con` | REWRITE | Borderline (prose warn / register pass) | place:city · reach:shadow · situation:guild | M |
| `tg.senior.smuggler_route` | REWRITE | Abstraction 6.12/100w | place:town · reach:shadow · situation:guild | M |
| `tg.social.fence_deal` | REWRITE | Abstraction 4.64/100w | place:town · reach:gold · situation:guild | S |
| `tg.social.rumor_trade` | REWRITE | Abstraction 6.17/100w | place:town · reach:shadow · situation:guild | S |
| `ts.join` | REWRITE | Borderline (prose warn / register pass) | place:shrine · reach:heart · situation:guild | S |
| `ts.promotion` | REWRITE | Borderline (prose pass / register warn) | place:shrine · reach:star · situation:guild | S |
| `ts.quest.consecrate_ground` | REWRITE | Abstraction 5.41/100w | place:wilderness · reach:heart · situation:guild | S |
| `ts.quest.heal_the_sick` | REWRITE | Abstraction 4.81/100w | place:town · reach:heart · situation:guild | S |
| `ts.quest.meditate_on_spheres` | REWRITE | Abstraction 4.71/100w | place:shrine · reach:star · situation:guild | S |
| `ts.quest.tend_shrine` | REWRITE | Borderline (prose pass / register warn) | place:shrine · reach:heart · situation:guild | S |
| `ts.senior.banish_corruption` | REWRITE | Abstraction 5.03/100w | place:ruins · reach:star · situation:guild | S |
| `ts.social.alms_giving` | REWRITE | Abstraction 4.85/100w | place:town · reach:heart · situation:guild | S |
| `ts.social.evening_prayer` | REWRITE | Abstraction 5.15/100w | place:shrine · reach:heart · situation:guild | S |
| `ts.social.theological_debate` | REWRITE | Abstraction 7.92/100w | place:city · reach:star · situation:guild | S |
| `uk.join` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:city · reach:shadow · situation:guild | S |
| `ac.quest.reagent_gather` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:veil · situation:guild | M |
| `ac.social.lecture_hall` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `ac.social.library_browse` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `ac.social.spell_exchange` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:veil · situation:guild | S |
| `bf.quest.forge_tools` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:guild | S |
| `bf.quest.lay_foundation` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:guild | S |
| `bf.quest.repair_wall` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:guild | S |
| `bf.quest.survey_site` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:guild | M |
| `bf.senior.design_fortification` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:stone · situation:guild | M |
| `bf.social.material_trade` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | S |
| `bf.social.workshop_tour` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:stone · situation:guild | S |
| `cg.elite.siege_defense` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:guild | L |
| `cg.join` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:guild | S |
| `cg.quest.break_up_brawl` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:guild | M |
| `cg.quest.gate_duty` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | L |
| `cg.quest.investigate_disturbance` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | M |
| `cg.quest.wall_patrol` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:guild | S |
| `cg.senior.command_watch` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:guild | M |
| `cg.senior.defend_gate` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:guild | S |
| `cg.senior.raid_hideout` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:iron · situation:guild | M |
| `cg.social.citizen_petition` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:heart · situation:guild | S |
| `hod.elite.divine_trial` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | M |
| `hod.elite.holy_war` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:iron · situation:guild | M |
| `hod.join` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | S |
| `hod.quest.escort_pilgrims` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:iron · situation:guild | M |
| `hod.quest.purify_shrine` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | S |
| `hod.quest.slay_abomination` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:iron · situation:guild | M |
| `hod.quest.temple_vigil` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | M |
| `hod.senior.inquisition` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | M |
| `hod.social.blessing_ceremony` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | S |
| `hod.social.dawn_prayer` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | S |
| `hod.social.tend_wounded` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:heart · situation:guild | S |
| `lk.elite.forbidden_library` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:guild | M |
| `lk.join` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `lk.promotion` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `lk.quest.catalogue_ruins` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:guild | S |
| `lk.quest.interview_elder` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | S |
| `lk.senior.compose_treatise` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:eye · situation:guild | S |
| `lk.senior.decipher_prophecy` | KEEP | Clears the rubric — nudge-hand authoring only | place:tower · reach:eye · situation:guild | M |
| `lk.social.debate_forum` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `lk.social.lecture_hall` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `lk.social.manuscript_exchange` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:eye · situation:guild | S |
| `mc.army.raise` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:iron · situation:guild | M |
| `mc.elite.siege_contract` | KEEP | Clears the rubric — nudge-hand authoring only | place:fortress · reach:undefined · situation:guild | M |
| `mc.elite.war_council` | KEEP | Clears the rubric — nudge-hand authoring only | place:capital · reach:undefined · situation:guild | M |
| `mc.join` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.promotion` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:undefined · situation:guild | S |
| `mc.quest.guard_caravan` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.quest.patrol` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.quest.siege_work` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.senior.field_command` | KEEP | Clears the rubric — nudge-hand authoring only | place:fortress · reach:undefined · situation:guild | M |
| `mc.social.contract_negotiation` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.social.sparring_ring` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mc.social.war_stories` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:undefined · situation:guild | S |
| `mct.promotion` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | S |
| `mct.quest.appraise_goods` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | M |
| `mct.quest.caravan_escort` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | M |
| `mct.quest.market_survey` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | M |
| `mct.quest.negotiate_contract` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | M |
| `mct.quest.settle_dispute` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:heart · situation:guild | M |
| `mct.senior.trade_monopoly` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:guild | M |
| `mct.social.guild_feast` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:heart · situation:guild | S |
| `mct.social.wine_tasting` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:heart · situation:guild | S |
| `rb.quest.survey_border` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:eye · situation:guild | S |
| `rb.quest.track_beast` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | M |
| `rb.quest.trail_patrol` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | M |
| `rb.quest.wilderness_rescue` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | M |
| `rb.social.campfire_tales` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:heart · situation:guild | S |
| `rb.social.tracking_lesson` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:eye · situation:guild | S |
| `tg.quest.blackmail_ledger` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `tg.quest.fence_goods` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:gold · situation:guild | S |
| `tg.quest.warehouse_raid` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | S |
| `tg.senior.jewel_heist` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `tg.social.dice_game` | KEEP | Clears the rubric — nudge-hand authoring only | place:town · reach:shadow · situation:guild | S |
| `ts.quest.copy_scriptures` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:star · situation:guild | S |
| `ts.senior.craft_relic` | KEEP | Clears the rubric — nudge-hand authoring only | place:temple · reach:star · situation:guild | S |
| `ts.senior.sphere_communion` | KEEP | Clears the rubric — nudge-hand authoring only | place:shrine · reach:star · situation:guild | M |
| `uk.elite.seize_territory` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `uk.elite.shadow_coup` | KEEP | Clears the rubric — nudge-hand authoring only | place:capital · reach:shadow · situation:guild | M |
| `uk.promotion` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | S |
| `uk.quest.blackmail_mark` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `uk.quest.pickpocket_run` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `uk.quest.protection_racket` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:guild | M |
| `uk.quest.smuggle_cargo` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | S |
| `uk.senior.corrupt_official` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:guild | M |
| `uk.senior.eliminate_rival` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | S |
| `uk.senior.heist_planning` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | M |
| `uk.social.black_market` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:guild | S |
| `uk.social.gambling_den` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:gold · situation:guild | S |
| `uk.social.whisper_network` | KEEP | Clears the rubric — nudge-hand authoring only | place:city · reach:shadow · situation:guild | S |
| `bf.elite.engineer_wonder` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:capital · reach:stone · situation:guild | M |
| `bf.elite.grand_monument` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:city · reach:stone · situation:guild | M |
| `mc.quest.escort_prisoner` | KILL | Redundant — same premise as `cg.quest.escort_prisoner` in the same family | place:town · reach:undefined · situation:guild | S |
| `mct.elite.market_domination` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:city · reach:gold · situation:guild | M |
| `mct.elite.trade_summit` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:capital · reach:gold · situation:guild | M |
| `mct.senior.foreign_deal` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:city · reach:gold · situation:guild | M |
| `rb.elite.frontier_defense` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:fort · reach:iron · situation:guild | M |
| `rb.elite.monster_hunt` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:camp · reach:eye · situation:guild | M |
| `rb.senior.ambush_raiders` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:camp · reach:iron · situation:guild | M |
| `rb.senior.deep_scout` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:camp · reach:eye · situation:guild | M |
| `rb.senior.map_unknown` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:camp · reach:eye · situation:guild | S |
| `ts.elite.found_cathedral` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:city · reach:heart · situation:guild | M |
| `ts.elite.sphere_convergence` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:shrine · reach:star · situation:guild | M |
| `uk.quest.fence_goods` | KILL | Redundant — same premise as `tg.quest.fence_goods` in the same family | place:city · reach:gold · situation:guild | S |

### borderland — 20 (KEEP 19 · REWRITE 1 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `borderland.caravan_thieves` | REWRITE | Borderline (prose pass / register warn) | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.bandit_scouts` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:borderland | M |
| `borderland.camp_raiders` | KEEP | Clears the rubric — nudge-hand authoring only | place:camp · reach:shadow · situation:borderland | M |
| `borderland.carrion_birds` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.desperate_deserter` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:heart · situation:borderland | M |
| `borderland.feral_dogs` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.goblin_foragers` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.outlaw_camp` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:shadow · situation:borderland | M |
| `borderland.plague_rats` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:borderland | M |
| `borderland.restless_bones` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:borderland | M |
| `borderland.roadside_shakedown` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.ruins_scavengers` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:iron · situation:borderland | M |
| `borderland.smugglers_stash` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:shadow · situation:borderland | M |
| `borderland.spider_nest` | KEEP | Clears the rubric — nudge-hand authoring only | place:ruins · reach:eye · situation:borderland | M |
| `borderland.swamp_lurker` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:borderland | M |
| `borderland.territorial_boar` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |
| `borderland.toll_bridge_bully` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:heart · situation:borderland | M |
| `borderland.venomous_serpent` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:borderland | M |
| `borderland.wisp_trail` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:eye · situation:borderland | M |
| `borderland.wolves_at_dusk` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:borderland | M |

### social — 14 (KEEP 5 · REWRITE 9 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `social.deceive` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:hamlet · reach:shadow · situation:social | M |
| `social.found_group` | REWRITE | Borderline (prose pass / register warn) | place:hamlet · reach:heart · situation:social | M |
| `social.intimidate` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:iron · situation:social | L |
| `social.persuade` | REWRITE | Abstraction 6.9/100w | place:hamlet · reach:heart · situation:social | L |
| `social.political_leverage` | REWRITE | not-X-but-Y ×2 | place:hamlet · reach:shadow · situation:social | L |
| `social.recruit_faction` | REWRITE | Abstraction 5.58/100w | place:hamlet · reach:heart · situation:social | M |
| `social.rob` | REWRITE | Vagueness 2.07/100w | place:hamlet · reach:iron · situation:social | M |
| `social.sabotage` | REWRITE | Abstraction 6.06/100w | place:hamlet · reach:shadow · situation:social | M |
| `social.spy_on` | REWRITE | Abstraction 6.68/100w | place:hamlet · reach:shadow · situation:social | M |
| `social.challenge_duel` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:iron · situation:social | M |
| `social.establish_patronage` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:social | M |
| `social.forge_alliance` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:heart · situation:social | M |
| `social.investigate_reputation` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:eye · situation:social | M |
| `social.negotiate_deal` | KEEP | Clears the rubric — nudge-hand authoring only | place:hamlet · reach:gold · situation:social | L |

### tavern — 10 (KEEP 9 · REWRITE 1 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `tavern.the_warning` | REWRITE | Vagueness 2.38/100w | place:tavern · reach:eye · situation:tavern | M |
| `tavern.bardic_performance` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:heart · situation:tavern | M |
| `tavern.brawl` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:iron · situation:tavern | S |
| `tavern.confession_over_drinks` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:heart · situation:tavern | M |
| `tavern.drinking_contest` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:iron · situation:tavern | S |
| `tavern.merchants_pitch` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:gold · situation:tavern | M |
| `tavern.overheard_rumor` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:eye · situation:tavern | S |
| `tavern.recruiting_drive` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:heart · situation:tavern | M |
| `tavern.shady_deal` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:shadow · situation:tavern | L |
| `tavern.the_challenge` | KEEP | Clears the rubric — nudge-hand authoring only | place:tavern · reach:iron · situation:tavern | L |

### npc_* — 16 (KEEP 0 · REWRITE 16 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `npc_ask_information` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:eye · situation:npc | S |
| `npc_befriend` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:heart · situation:npc | S |
| `npc_bless` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:star · situation:npc | S |
| `npc_bribe` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:gold · situation:npc | S |
| `npc_charm` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:wild · reach:heart · situation:npc | S |
| `npc_commission_craft` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:gold · situation:npc | S |
| `npc_curse` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:star · situation:npc | S |
| `npc_eavesdrop` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:eye · situation:npc | S |
| `npc_hire_guide` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:wild · reach:eye · situation:npc | S |
| `npc_intimidate` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:iron · situation:npc | S |
| `npc_promote_to_agent` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:wild · reach:star · situation:npc | S |
| `npc_read_intentions` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:eye · situation:npc | S |
| `npc_recruit` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:heart · situation:npc | S |
| `npc_request_shelter` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:wild · reach:heart · situation:npc | S |
| `npc_seek_healing` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:veil · situation:npc | S |
| `npc_trade_goods` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:wild · reach:gold · situation:npc | S |

### ag (arcane/guild aux) — 18 (KEEP 0 · REWRITE 18 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `ag.elite.dragon_lair` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:iron · situation:ag | L |
| `ag.elite.lost_city` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:town · reach:eye · situation:ag | L |
| `ag.join` | REWRITE | Wrong speaker — divine `you/your` ×12 on mortal-drawn prose | place:town · reach:heart · situation:ag | M |
| `ag.promotion` | REWRITE | Wrong speaker — divine `you/your` ×12 on mortal-drawn prose | place:town · reach:iron · situation:ag | M |
| `ag.quest.escort_caravan` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:town · reach:iron · situation:ag | M |
| `ag.quest.monster_hunt` | REWRITE | Borderline (prose warn / register pass) | place:town · reach:iron · situation:ag | M |
| `ag.quest.recover_artifact` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:town · reach:eye · situation:ag | L |
| `ag.quest.ruin_delve` | REWRITE | Wrong speaker — divine `you/your` ×8 on mortal-drawn prose | place:town · reach:eye · situation:ag | M |
| `ag.quest.wilderness_survey` | REWRITE | Wrong speaker — divine `you/your` ×7 on mortal-drawn prose | place:town · reach:eye · situation:ag | S |
| `ag.senior.bounty_hunt` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:town · reach:shadow · situation:ag | M |
| `ag.senior.deep_expedition` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:town · reach:eye · situation:ag | L |
| `ag.senior.map_uncharted` | REWRITE | Wrong speaker — divine `you/your` ×5 on mortal-drawn prose | place:town · reach:eye · situation:ag | M |
| `ag.social.bounty_plan` | REWRITE | Borderline (prose warn / register pass) | place:town · reach:shadow · situation:ag | M |
| `ag.social.mentor` | REWRITE | Abstraction 6.96/100w | place:town · reach:eye · situation:ag | M |
| `ag.social.rivalry` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:town · reach:iron · situation:ag | M |
| `ag.social.share_maps` | REWRITE | Borderline (prose warn / register pass) | place:town · reach:eye · situation:ag | M |
| `ag.social.sparring` | REWRITE | Wrong speaker — divine `you/your` ×4 on mortal-drawn prose | place:town · reach:iron · situation:ag | M |
| `ag.social.tavern_tales` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:town · reach:heart · situation:ag | M |

### faction / fa — 14 (KEEP 0 · REWRITE 11 · KILL 3)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `fa.defection_pitch` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:heart · situation:faction | S |
| `fa.loyalty_test` | REWRITE | Wrong speaker — divine `you/your` ×3 on mortal-drawn prose | place:wild · reach:heart · situation:faction | S |
| `fa.quest_board` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:iron · situation:faction | M |
| `fa.rivalry_confrontation` | REWRITE | Wrong speaker — divine `you/your` ×2 on mortal-drawn prose | place:wild · reach:iron · situation:faction | M |
| `fa.rivalry_subterfuge` | REWRITE | Abstraction 5.52/100w | place:wild · reach:shadow · situation:faction | S |
| `faction.encounter.calling_named` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:heart · situation:faction | S |
| `faction.encounter.dissent_surfaces` | REWRITE | Abstraction 4.57/100w | place:wild · reach:shadow · situation:faction | S |
| `faction.encounter.doctrine_surfaces` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:star · situation:faction | S |
| `faction.encounter.doubter_chooses` | REWRITE | Vagueness 2.5/100w | place:wild · reach:eye · situation:faction | S |
| `faction.encounter.inheritance` | REWRITE | Borderline (prose warn / register warn) | place:wild · reach:iron · situation:faction | S |
| `faction.encounter.leader_at_a_crossroads` | REWRITE | Borderline (prose warn / register pass) | place:wild · reach:heart · situation:faction | S |
| `fa.alliance_ceremony` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:wild · reach:heart · situation:faction | S |
| `fa.bounty_hunt` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:wild · reach:shadow · situation:faction | M |
| `fa.conclave_debate` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:wild · reach:heart · situation:faction | M |

### army — 5 (KEEP 5 · REWRITE 0 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `army.aftermath.refugees` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:heart · situation:army | M |
| `army.threshold.desertion` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:iron · situation:army | M |
| `army.threshold.disbandment` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:iron · situation:army | S |
| `army.threshold.mutiny` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:iron · situation:army | M |
| `army.threshold.supply_crisis` | KEEP | Clears the rubric — nudge-hand authoring only | place:wild · reach:gold · situation:army | M |

### monster — 5 (KEEP 3 · REWRITE 0 · KILL 2)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `monster.encounter.ambush` | KEEP | Clears the rubric — nudge-hand authoring only | place:wilderness · reach:iron · situation:monster | M |
| `monster.hunt.minor` | KEEP | Clears the rubric — nudge-hand authoring only | place:lair · reach:iron · situation:monster | M |
| `monster.hunt.named_elite` | KEEP | Clears the rubric — nudge-hand authoring only | place:lair · reach:iron · situation:monster | M |
| `monster.encounter.horde_raid` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:hamlet · reach:iron · situation:monster | M |
| `monster.encounter.lair_defense` | WIRED | Wired THR-779 — registered in the encounter-cache path; WS5 re-classifies | place:lair · reach:iron · situation:monster | M |

### misc (action) — 46 (KEEP 0 · REWRITE 2 · KILL 44)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `action.mentorship.inspire` | REWRITE | Prose `fail` (50) | place:wild · reach:heart · situation:misc | S |
| `action.mentorship.sever` | REWRITE | Prose `fail` (50) | place:wild · reach:shadow · situation:misc | S |
| `action.eye.investigate` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:eye · situation:misc | S |
| `action.eye.refine-knowledge` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:eye · situation:misc | S |
| `action.eye.research` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:eye · situation:misc | S |
| `action.eye.suppress-knowledge` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:eye · situation:misc | S |
| `action.flesh.cultivate` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.flesh.diagnose` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:eye · situation:misc | S |
| `action.flesh.heal` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.flesh.plague` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:shadow · situation:misc | S |
| `action.gold.break-agreement` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.buy-influence` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.commission-assassination` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.disrupt-trade` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.establish-monopoly` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.establish-trade` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.fund-construction` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.hire-mercenaries` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.negotiate-agreement` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.survey-resources` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.tax-trade-route` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.gold.trade` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:gold · situation:misc | S |
| `action.heart.assess-loyalty` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:heart · situation:misc | S |
| `action.heart.betray` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:heart · situation:misc | S |
| `action.heart.forge-alliance` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:heart · situation:misc | S |
| `action.heart.inspire` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:heart · situation:misc | S |
| `action.iron.assess-threat` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:iron · situation:misc | S |
| `action.iron.conquer` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:iron · situation:misc | S |
| `action.iron.fortify` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:iron · situation:misc | S |
| `action.iron.raise-force` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:iron · situation:misc | S |
| `action.shadow.assassinate` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:shadow · situation:misc | S |
| `action.shadow.establish-network` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:shadow · situation:misc | S |
| `action.shadow.recruit-agent` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:shadow · situation:misc | S |
| `action.shadow.spy` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:shadow · situation:misc | S |
| `action.star.consecrate` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:star · situation:misc | S |
| `action.star.deepen-faith` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:star · situation:misc | S |
| `action.star.desecrate` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:star · situation:misc | S |
| `action.star.divine` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:star · situation:misc | S |
| `action.stone.assess-structure` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:stone · situation:misc | S |
| `action.stone.build` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:stone · situation:misc | S |
| `action.stone.demolish` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:stone · situation:misc | S |
| `action.stone.repair` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:stone · situation:misc | S |
| `action.veil.cast-spell` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:veil · situation:misc | S |
| `action.veil.detect-magic` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:veil · situation:misc | S |
| `action.veil.dispel` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:veil · situation:misc | S |
| `action.veil.modify-enchantment` | KILL | Orphaned — no draw path (regional scale, no cache/seed route) | place:wild · reach:veil · situation:misc | S |

### misc (encounter) — 3 (KEEP 3 · REWRITE 0 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `encounter_route_ambush` | KEEP | Clears the rubric — nudge-hand authoring only | place:village · reach:iron · situation:misc | M |
| `encounter_route_embargo` | KEEP | Clears the rubric — nudge-hand authoring only | place:village · reach:gold · situation:misc | M |
| `encounter_toll_dispute` | KEEP | Clears the rubric — nudge-hand authoring only | place:village · reach:gold · situation:misc | S |

### misc (mentorship) — 3 (KEEP 0 · REWRITE 3 · KILL 0)

| id | Verdict | Reason | Tag | H |
|---|---|---|---|---|
| `mentorship.graduation` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:heart · situation:misc | S |
| `mentorship.the-falling-out` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:heart · situation:misc | S |
| `mentorship.the-offer` | REWRITE | Authored futures — `authoredChoices` retires under the Nudge Model | place:wild · reach:heart · situation:misc | S |

## Appendix — scratch detector spec (reproducible)

Both detectors are pure functions over the concatenated authored text of a template. Thresholds are named constants; every one is tunable without touching logic (NFP #1).

| Constant | Value | Meaning |
|---|---:|---|
| `ABSTRACT_DENSITY_FAIL` | 4.5 | abstract nouns per 100 words |
| `VAGUENESS_DENSITY_FAIL` | 2.0 | hedges/stand-ins per 100 words |
| `NOT_X_BUT_Y_FAIL` | 2 | occurrences per template |
| `THIN_PREMISE_WORDS` | 45 | total authored words below which no hand can hang |
| `SECOND_PERSON_FAIL` | 2 | second-person pronouns tolerated on a mortal-drawn template |

**Abstract-noun proxy** — `/\b[a-z]{4,}(?:ness|ity|tion|sion|ment|ance|ence|ism|hood|ship)\b/gi`. A standard concreteness measure: nominalised abstractions displace the concrete nouns a nudge needs to act on.

**Vagueness lexicon** — hedges (`somehow`, `somewhat`, `seems to`, `appears to`, `a kind of`, `a sort of`, `something like`, `in some way`), abstract stand-ins (`something`, `someone`, `somewhere`, `things`, `stuff`), nominalised placeholders (`the situation`, `the matter`, `the moment`, `the atmosphere`, `the tension`, `the dynamic`, `the connection`, `the understanding`, `the balance`, `the energy`, `the presence`, `the experience`, `the process`), and vague intensifiers (`very`, `really`, `quite`, `rather`, `truly`, `deeply`, `profoundly`, `utterly`).

**Second-person voice** — `/\b(?:you|your|yours|yourself)\b/gi` over the full authored text, applied only to templates whose `actorAffinities` omits `ascendant`. Divine action cards are *supposed* to say "you"; a mortal-drawn scene is not.

**not-X-but-Y patterns** — matched per sentence, one hit maximum per sentence:

```
/\bnot\s+(?:just|only|merely|simply)\b[^.!?]{0,90}?\bbut\b/i
/\b(?:is|was|are|were)n'?t\s+[^.!?]{0,70}?[.;—–-]\s*(?:it|they|he|she)\s+(?:is|was|are|were)\b/i
/\bnot\s+(?:a|an|the)\s+[a-z]+[^.!?]{0,50}?\bbut\s+(?:a|an|the)\b/i
/\bless\s+[a-z]+\s+than\s+[a-z]+/i
/\bnot\s+because\b[^.!?]{0,70}?\bbut\s+because\b/i
```

### Known limits

- The abstract-noun proxy is suffix-based, so domain vocabulary (`devotion`, `judgement`, `settlement`) counts against a template. It is a **ranking** signal, not a verdict on any single line; every REWRITE it produces is a light pass, not a rebuild.
- Exposure is one seed on one map size. A template with zero observed draws is low-share, not provably dead — the reachability model, not the exposure sample, is what justifies a KILL.
- Redundancy detection compares normalised name+description within a family only. Cross-family duplicates and same-premise/different-wording pairs are not caught; WS5 should expect to find more by hand.

