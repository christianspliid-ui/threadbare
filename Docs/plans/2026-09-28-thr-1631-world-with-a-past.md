> **title:** A world with a past — founding dates, old wars, the dead, and a "Before you woke" chapter — THR-1631
> **linear_issue:** THR-1631
> **author:** Claude Code (design lane, run 2026-09-28a)
> **created:** 2026-09-28
> **three_pillars:** Engine `done` · Content `done — founding, war, fall and wonder-legend line tables, four enrichment placeholders, five tooltips; no encounter prose` · UI `done — a pinned "Before you woke" section in the chronicle, one line on every settlement and ruin page, one line on a dead notable's sheet`

# A world with a past — THR-1631

*A new world today has no past. Worldgen already places two to four dead empires and about a hundred of their ruins, then tells the player nothing about them. This plan writes a thin past derived from what is already on the map: when each settlement was founded, one elder war, two or three wars in living memory, five to ten of the dead, and descent from a dead empire. The player meets it in a "Before you woke" section of the chronicle and one line on each settlement, ruin and dead person's page.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) ranked "no past" as gap 3 of 7 (audit § 1.6: "Pre-history at t0 … none", and 110 · 98 ruins "with no lore"). Its Part 3 line 3 says a past **pays twice**: it gives the chronicle and the ruins something to say, and it feeds ambitions that today have no holder at t0 (`seek_revenge`, `chase_the_wonder`, `reclaim_homeland`, gap 7). It is also where the ruin encounter content that does not yet exist (audit C5: 88–103 elder ruins per world, 0 templates) will read its facts from.

This is carve-up plan 2 of 7. It follows [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md) (plan 1), which seeded the kin ties this plan's S3 uses, and it names the hooks [write where the dice land](https://linear.app/threadbare/issue/THR-1598)'s ruin content will read (§ Hooks for ruin content).

**Settled input, not reopened here.**

- [A world with a past](https://linear.app/threadbare/issue/THR-1591) — **decided by Christian in chat, 2026-09-25: option A, "explain the map"** ("a is fine"). Every settlement gets a founding date; one elder war drawn from the battlefield ruins; 2–3 wars in living memory between neighbouring Realms, each leaving one plain ruin as a burned town and one fallen commander; 5–10 dead notables (founders, fallen commanders, the first to find a wonder) kept as `deceased` actors where they rest; some mortals on a dead empire's land get descent from it (`backstoryStrata`). The player meets it in a "Before you woke" chronicle chapter, a founding line on every settlement page and an empire/kind/fall line on every ruin page. Era names, legends and `legacyFlavor` stay flavor.
- Two sub-calls on the same ticket, **decided by the design lane under delegation on 2026-09-25, not vetoed in the 60 hours since**: (1) the outline (empires, wars, foundings) is **shown from minute one**, and the specifics (which ruin fell how, who lies where) are **found on a visit or a Perceive**; (2) **the past stays mortal**: no rival god is written into it.
- The decision's six constraints, each carried below: about 6 event nodes, not one per ruin; the past never lives in `chronicleEntries`; ambitions minted explicitly; wonder legends vary per wonder; "built on old stones" is too common to be the special part of a founding line; the pass takes its own `mulberry32(seed + 101363)` stream.
- [What liveness costs](https://linear.app/threadbare/issue/THR-1592): history is nearly free (≤ 4% steady-state) when it stays a handful of event nodes.
- The map's disposition of 2026-09-27: rumours do not become a content kind here.
- The prototype, branch `proto/thr-1591-world-with-a-past`: [sample history, seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md), [README](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/README.md).

**Decided in this plan by the design lane under delegation** (process.md rule 4: the *how* of an agreed outcome). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **The past lives on the graph, not in a new GameState field** (§ S1a). Events, dead actors, edges and two location properties hold it, and one pure selector reads it back. Saves carry it for free and `gameState.ts` is not touched.
2. **Ages are words, not numerals** (§ S1f). The decision's example "Founded 456 years ago" becomes "Founded about four centuries ago", because Law 13 bans raw magnitudes on player surfaces.
3. **Only capitals get a named founder** (§ S1c). Every settlement gets a date; named founders are capped with the rest of the dead at 10.
4. **A "visit" is the hex having been seen** (§ S2b). Specifics show once the hex is `visible` or `remembered` in fog, or its ruins layer is revealed by a Find or Perceive action. No new "visited" store.
5. **Past-fed ambitions go to heroes who already decide, never to ordinary townsfolk** (§ S3), so no one is pulled into the deciding tier by history. `reclaim_homeland` is not minted at t0: its rule needs a living culprit who seized a holding, and a dead empire has none. Descent is written now, and the mint is filed as a deferral.
6. **The chapter is a pinned section of the existing chronicle panel**, not a first volume of the Great Chronicle (§ S2a). No UI reads the Great Chronicle today.

## Re-measured on current `main` (2026-09-28, `7178b4b6`)

The prototype is three days old and the notables-and-ties slice 1 merged since, so every code claim below was re-read on `7178b4b6` and one headless world taken (seed 42, medium, `initializeGameState` as the CLI runs it):

```
t0:   {"hist":["The Shifting Strand|tide_callers","The Veiled Sands|ash_crowned","The Open Thought of the Downs|dream_weavers"],"elder":103,"plainRuins":7,"events":0,"deceased":0,"realms":3}
t150: {"tick":150,"events":1404,"by":{"encounter_outcome":1390,"battle_fought":10,"undertaking_outcome":4},"deceased":8}
```

| Fact | Where | Consequence for this plan |
|---|---|---|
| 2–4 dead empires, `hist_culture_*`, `actorType:'culture'`, `cultureEra:'historical'`, carrying `legacyFlavor`; **no era or date field** | `historicalCulture.ts:36,79-92`; `historical-culture-content.ts:17` | the elder age has no date to read; this plan writes one on the elder war |
| Empire territory is region → culture `belongs_to` with `cultureLayer:'historical'`, 85% coverage | `historicalCulture.ts:207-215` | descent reads it |
| 103 elder ruins, each with `originCultureId`, `archetype` (vault 0.40 / temple 0.35 / battlefield 0.25), `discovered:false` (no writer) | `ruins/elderRuinSeeding.ts:120,223,226-246` | the elder war and the ruin line read these; no ruin carries `legacyFlavor` |
| 7 plain ruins (`locationSubtype:'ruins'`) | `worldSeed.ts:553-570` | the burned towns come from these |
| **Ruins are seeded after `seedWorld` returns**, in `gameInit` | `gameInit.ts:227` (`seedElderRuins`), `:241` latent sources, `:245` `loc.start` | the pass **cannot** live in `seedLivingWorld`; it slots at `gameInit.ts` between 241 and 245 |
| No settlement carries a founded / founder property | `worldSeed.ts:862-876` | S1c adds `foundedYearsAgo` |
| Death is `markMortalDead`: `retain` writes `deceased:true, deceasedTick, deathCause` and keeps node and edges | `agentLifecycle.ts:231,273-284` | the seeded dead use the same shape, never `remove` |
| No burial or "rests at" edge exists | grep, only the tag `'grave'` in `archetype-content.ts:224` | the dead rest by `located_at`, as run-time dead already do |
| `backstoryStrata` has **no type and no writer**; its one reader is an inline cast; the actor-side `originCultureId` it also reads has no writer either | `ruins/clueLifecycle.ts:112-121` | S1e is the first producer and gives it a type |
| Ambition minting reads only `encounter_outcome` / `undertaking_outcome` events inside a 75-tick lookback | `ambitionTick.ts:93,341-344,419-475` | a past event never mints by itself; S3 mints explicitly |
| `assignAmbitionToActor(graph, actorId, templateId, tick, options)`, `MAX_ACTIVE_AMBITIONS = 2`, `skipSpotlightPull` | `ambitionAssignment.ts:45,108` | the S3 mint API |
| Grievances carry a `culpritAgentId` and pass through `resolveGrievanceDisposition` | `ambitionTick.ts:894-960` | `seek_revenge` needs a living culprit agent (§ S3) |
| `chronicleEntries` is emptied at every cycle end; the Great Chronicle's only writer is cycle end, and **no component reads `state.chronicle`** | `cycleEnd.ts:233-254,287`; grep `src/components` | the chapter is its own selector plus a pinned section (Lane decision 6) |
| `ChroniclePanel` lists `chronicleEntries` newest first | `ChroniclePanel.tsx:20`, mounted `GameView.tsx:5238-5241` | pinned section goes above the list |
| Two per-tick scanners walk **every** event node | `factionNetwork.ts:663,683` (per faction per tick), `phaseOmenAgenda.ts:450` | ≤ 6 events: 1404 exist by t150, so six is noise |
| A year is 360 ticks (90 × 4); `elapsedLabel` stops at weeks; `countWord` spells 0–9 | `types/temporal.ts:44`; `aftermathWords.ts:259-330` | S1f adds a years-scale sibling that stays inside `countWord` |
| Fog states `unexplored` / `visible` / `remembered`; `hexRevelation[key].ruins` is set by `hex.read_stones`, `hex.whisper_intuition` | `visibility.ts:10,220-263`; `revelationResolver.ts:31-44` | the specifics gate (§ S2b) |
| Perceive: five `divine.perceive.*` templates; `listen_for_a_name` already reveals a ruin's `originCultureId` | `unified-action-templates.ts:1289-1417`; `ruins/perceiveRelay.ts:290-301,583` | the Perceive route to specifics |
| No wars or battles at t0 (0 events); one army per Realm | CLI above; `seedLivingWorld.ts:1019-1022` | the living-memory wars are the only t0 wars |
| No Realm-neighbour helper | grep | S1d adds one |
| Offset `101363` is unused repo-wide | grep | the pass's stream, as decided |
| `HexChronicle` "The Ruins" layer already quotes the empire's `legacyFlavor` | `HexChronicle.tsx:1166-1196` | stays; the ruin line is additive |
| The settlement page header sub-line is `{locType} · in {terrain} Hex (...)` | `LocationView.tsx:1240-1247` | the founding line sits under it; ruins render through the same view |

## Substrate inventory

Grepped `Docs/canon/systems-inventory.md` for worldgen, history, ruin, culture, chronicle, death, ambition, grievance, clue and perceive. Every system this plan touches exists.

| Existing subsystem | Status | This plan |
|---|---|---|
| **Worldgen: historical cultures** `historicalCulture.ts` | 🟢 ACTIVE | **reads** empires and their territory |
| **Ruins: elder ruin seeding** `ruins/elderRuinSeeding.ts` | 🟢 ACTIVE | **reads** ruins, archetypes, origins |
| **Worldgen: seed world** `worldSeed.ts` (settlements, wonders, Realms, protagonists) | 🟢 ACTIVE | **reads**; writes one property per settlement from a later pass |
| **Agent lifecycle: death** `agentLifecycle.markMortalDead` shape | 🟢 ACTIVE | **extends**: a worldgen writer of the same `retain` shape |
| **Ruins: clue lifecycle** `ruins/clueLifecycle.ts` descent scoring | 🟠 DORMANT half (reader live, no writer) | **activates** by writing `backstoryStrata` and `originCultureId` |
| **Ambitions** `ambitionAssignment.assignAmbitionToActor`, grievance `resolveGrievanceDisposition` | 🟢 ACTIVE | **extends**: a worldgen caller |
| **Chronicle** `ChroniclePanel` | 🟢 ACTIVE | **extends**: a pinned section |
| **Fog / revelation** `visibility.ts`, `revelationResolver.ts`, `perceiveRelay.ts` | 🟢 ACTIVE | **reads** as the specifics gate |
| **Enrichment placeholders** | 🟢 ACTIVE | **extends** with four place placeholders (S2) |

No new node type and no new edge type. Event nodes, `located_at`, `participated_in`, `occurred_at`, `constructed_by`, `member_of`, `relates_to` and `pursues` all exist (`types/graph.ts:110-111` and siblings).

## Interface impact

Worldgen is ⚪ UNAUDITED in `Docs/canon/interface-map.md`; this plan writes its rows (audit-on-touch). The executor registers each `add` row in `scripts/interface-contracts.ts` in the slice that ships it.

| Contract | Action | Producer → consumer (production read site) |
|---|---|---|
| `world-past-reaches-the-chronicle` | **add** (S1 producer, S2 reader) | `worldPast.seedWorldPast` → `worldPast.readWorldPast` → `ChroniclePanel` "Before you woke", `LocationView` place line |
| `world-past-descent-feeds-clue-scoring` | **add** (S1) | `seedWorldPast` descent → `ruins/clueLifecycle.ts:112-121` descent scoring |
| `seeded-dead-stay-dead` | **add** (S1) | `seedWorldPast` dead → every living-actor sweep that reads `deceased` (`isAgentGone`, `graphConditions.ts:66`, `spotlightPull.ts:291`, the THR-1654 notable pick) |
| `world-past-mints-ambitions` | **add** (S3) | `seedWorldPast.mintPastAmbitions` → `pursues` → ambition selection and the strategic packs |
| `chronicle-entries-cycle-bound` | **preserve** | the past never enters `chronicleEntries` |

## Engine pillar

Three slices (§ Slicing). S1 is this ticket.

### S1 — The past on the graph

One new module, `src/engine/worldPast.ts`, exporting `seedWorldPast(graph, seed, constants?)` and the pure reader `readWorldPast(graph)`. Constants in `src/data/world-past-constants.ts`, types in `src/types/worldPast.ts`.

**S1a — Where it runs, and what it writes.** `seedWorldPast` is called once from `initializeGameState`, after latent sources (`gameInit.ts:241`) and before `loc.start` (`:245`), inside a try/catch that logs one warning and continues (NFP #4). By then empires, ruins, settlements, wonders, Realms and protagonists all exist. *Lane decision 1:* everything it writes is graph: at most `WORLDGEN_PAST_EVENTS_MAX` (6) event nodes, at most `WORLDGEN_PAST_DEAD_MAX` (10) deceased actor nodes, existing edge types, one location property (`foundedYearsAgo`), and descent properties on some mortals (S1e). The burned town is linked to its war by the event's `occurred_at` edge, not a property, because a relationship is an edge. Every past event carries `eventType` from the set below, `pastYearsAgo` (integer years) and `tick = -pastYearsAgo × TICKS_PER_YEAR` (`TICKS_PER_SEASON × SEASONS_PER_YEAR`, 360), so any reader that sorts by tick puts it before t0.

| `eventType` | Count | Edges |
|---|---|---|
| `past_elder_war` | 0–1 | two empires `participated_in` → event; event `occurred_at` → each of its battlefield ruins |
| `past_war` | `WORLDGEN_PAST_LIVING_WARS` (2–3) | two Realms and the fallen commander `participated_in` → event; event `occurred_at` → the burned town |

`past_elder_war` and `past_war` are new `eventType` values. `eventType` is an untyped property string on event nodes (as `battle_fought` is in `battleRecord.ts:10`), so no union is edited. Founding is not an event: 47–67 of them would break the six-event budget, so it is a property plus, for capitals, a founder.

**S1b — The elder war.** Tally battlefield ruins by `originCultureId`. The war is between the two empires with the most battlefield ruins (ties broken by id); its sites are those empires' battlefield ruins. Seed 42 gives the prototype's "The Tide-Callers × The Ash-Crowned, 21 battlefields". `pastYearsAgo` is drawn from `WORLDGEN_PAST_ELDER_AGE_YEARS` [700, 1100]. Fewer than two empires with a battlefield → no elder war, logged.

**S1c — Founding.** Every settlement (`getLocationNodes` filtered to the settlement class, plain ruins included, since each was a town once) gets `foundedYearsAgo` drawn from its class range (§ Constants), capped below the elder war. A capital is the oldest settlement of its Realm: its value is raised to that Realm's maximum if a draw came out younger. *Lane decision 3:* each capital gets a **named founder**: a deceased actor of the capital's culture (name from the existing culture name generator), `located_at` the capital, with `constructed_by` from the capital to the founder carrying `structureType:'founding'` (the edge worldgen already writes from settlements to their builders, `worldSeed.ts:1569`). The prototype's lesson holds: the founding line never leans on "built on old stones", which is true of 45 of 47 settlements.

**S1d — Wars in living memory.** A new helper `realmNeighbourPairs(graph)` returns Realm pairs whose controlled settlements come within `WORLDGEN_PAST_WAR_MAX_HEXES` (8) hex distance, sorted by id. The pass takes up to `WORLDGEN_PAST_LIVING_WARS` pairs (drawn without replacement). For each war:

- `pastYearsAgo` drawn from `WORLDGEN_PAST_LIVING_MEMORY_YEARS` [8, 45];
- the **burned town** is the unused plain ruin nearest the midpoint of the two Realms' seats, within `WORLDGEN_PAST_BURNED_TOWN_MAX_HEXES` (10); its `foundedYearsAgo` is raised above the war's age if needed; no candidate → the war has no burned town, still written, and logged;
- one side is drawn as the loser; the **fallen commander** is a deceased actor of the losing Realm's culture, `member_of` the losing Realm (`rank` 0.6, the member-of scale is 0–1), `participated_in` the war, `located_at` the burned town (or the losing Realm's seat if there is none), `deathCause:'battle'`;
- both Realms `participated_in` the war, and each edge carries `role: 'winner' | 'loser'`: who won is a fact about a Realm's part in the war, so it lives on the relation, not as ids on the event. The reader resolves `winnerId` / `loserId` from those edges.

**S1e — Descent.** For each mortal (protagonists and ambient) whose home hex lies in a region with a historical `belongs_to`, draw once against `WORLDGEN_PAST_DESCENT_SHARE` (0.25). On a hit, write `backstoryStrata: [{ cultureId, relation: 'descent' }]` and `originCultureId` (the same property ruins carry, and the same pair `clueLifecycle` already reads). The new type `WorldPastDescentStratum` in `src/types/worldPast.ts` replaces the inline cast at `clueLifecycle.ts:120`. Existing mortals are only annotated; none is created.

**S1f — The dead, and ages in words.** Fill order for the dead, stopping at `WORLDGEN_PAST_DEAD_MAX`: fallen commanders, then capital founders, then wonder finders. A **wonder finder** is a deceased actor of the culture holding the wonder's hex (or of the nearest living culture), `located_at` the wonder, carrying `pastRole:'wonder_finder'`; up to `WORLDGEN_PAST_WONDER_FINDERS_MAX` (4), preferring wonders a Realm `controls`. Every seeded dead actor carries exactly the run-time dead shape (`deceased:true`, `deceasedTick` negative, `deathCause` `'battle'` or `'lifecycle'`) plus `pastRole` (`'founder' | 'fallen_commander' | 'wonder_finder'`) and `pastOrigin:'worldgen'`, sits at the ambient tier and is never hydrated. Seed 42 gives 2 commanders + 3 founders + 4 finders = 9, inside the decided 5–10. *Lane decision 2:* a new `pastSpanLabel(years)` in `aftermathWords.ts` beside `elapsedLabel` returns words in one unit that stays inside `countWord`: under 10 → "four years", 10–94 → decades rounded ("two decades"), 95 and up → centuries rounded ("about four centuries"; "about" marks a rounded century), beyond nine centuries → "many centuries".

**S1g — The reader.** `readWorldPast(graph): WorldPastView` is pure and returns structured records (Law 2: the producer declares the concepts; S2 words them):

```ts
interface WorldPastView {
  elderAge: { empires: Array<{ cultureId: string; ruinCounts: Record<'temple'|'vault'|'battlefield', number> }>;
              war?: { eventId: string; empireIds: [string, string]; siteIds: string[]; yearsAgo: number } };
  settling: Array<{ settlementId: string; yearsAgo: number; founderId?: string }>;   // capitals first, then oldest
  livingMemory: Array<{ eventId: string; realmIds: [string, string]; winnerId: string; loserId: string;
                        burnedTownId?: string; fallenIds: string[]; yearsAgo: number }>;
  wonders: Array<{ wonderId: string; finderId?: string; holderId?: string }>;
}
function getPlacePast(graph: WorldGraph, locationId: string): PlacePast | null;   // one place's record, for the page line and ruin content
```

`window.__DEBUG.getWorldPast()` returns `readWorldPast` unfogged (S1). The fogged variant is S2's.

### S2 — The player meets the past

Filed at handoff. The selector plus fog gating plus the three surfaces in § UI pillar and the content in § Content pillar. `readWorldPastForPlayer(graph, fogState, hexRevelation)` wraps `readWorldPast` and marks each specific as `known` or not (§ S2b).

**S2b — Seen or found** (the delegated sub-call, implemented). *Lane decision 4:*

- **Outline, from minute one:** the empires and what kind of ruins they left; that an elder war happened and between whom; which Realms fought in living memory and when; each capital's founding and founder; every settlement's founding age on its own page.
- **Specifics, once found:** which ruin fell in which war, which plain ruin is the burned town, where a commander or wonder finder lies. A specific is known when its place's hex is `visible` or `remembered` in fog, or `hexRevelation[key].ruins` is true (set today by `hex.read_stones` and `hex.whisper_intuition`; `divine.perceive.listen_for_a_name` already reveals a ruin's empire). Before that, the chapter says "a town burned and was never rebuilt" without naming it, and a ruin page says only what kind of ruin it is. Nothing new is stored: `remembered` is the fog's own memory, so a specific never un-learns itself.

### S3 — The past feeds ambitions

Filed at handoff. `mintPastAmbitions(graph, view)`, called at the end of `seedWorldPast`, `skipSpotlightPull:true`. *Lane decision 5:* holders are only protagonists (already deciders), and only when `assignAmbitionToActor` finds a free slot, so no history pulls anyone into the deciding tier.

- **`seek_revenge`:** for each living-memory war, the protagonist with the most standing in the losing Realm (`member_of` reputation, ties by id) becomes **kin** of the fallen commander (`relates_to` basis `kin`, `origin:'worldgen'`, both directions, the THR-1630 shape) and receives `ambition_seek_revenge` through `resolveGrievanceDisposition`, culprit = the winning Realm's current leader (`getFactionLeaderId`, `factionNetwork.ts:598`), `sourceEventId` = the war. No leader, no member protagonist or no free slot → nothing, logged. At most `WORLDGEN_PAST_REVENGE_AMBITIONS_MAX` (2).
- **`chase_the_wonder`:** for each wonder with a finder, the nearest protagonist within `WORLDGEN_PAST_WONDER_PULL_MAX_HEXES` (12) with a free slot receives `ambition_chase_the_wonder` targeting that wonder. At most `WORLDGEN_PAST_WONDER_AMBITIONS_MAX` (2).
- **`reclaim_homeland`:** not minted at t0. Its rule is a `holding_seized` victim with a living culprit (`ambition-minting-rules.ts:209`); a dead empire leaves none. Descent (S1e) is the fact a future rule will read. Filed as a `Deferral` ticket at handoff: *a descendant can want the old homeland back*.

### Tick phases

Worldgen only: `initializeGameState` → … `seedElderRuins` (`gameInit.ts:227`) → rarity → latent sources (`:241`) → **`seedWorldPast`** (S1; S3 at its tail) → `loc.start` (`:245`). Nothing new runs per tick. The two per-tick event scanners see at most six more events. `readWorldPast` runs at render, memoised on `worldVersion` (it never changes after t0 except when fog reveals, which S2's wrapper reads separately).

### PRNG callouts

- The pass owns `mulberry32(seed + WORLDGEN_PAST_PRIME)`, `WORLDGEN_PAST_PRIME = 101363` (unused repo-wide, re-grepped). It is outside `WORLDGEN_LIVING_PRIMES` because it is not a `seedLivingWorld` pass.
- Draw order is fixed and documented in the module: elder war age → founding ages (settlements sorted by id) → war pairs → war ages → losers → names → descent draws (mortals sorted by id) → finders. Every candidate list is sorted by id before a draw.
- No existing stream is touched: the pass runs after every other worldgen draw, so no existing node moves. `Math.random()` is never used.

## Content pillar

No encounter prose. All tables live in `src/data/world-past-content.ts` (S2), written in the game's GM register (`Docs/canon/prose.md` rule zero, Law 42): plain, past tense, no second person.

1. **Founding frames** (≥ 3): e.g. "Founded {place.founded_ago} ago by {place.founder}." and "Founded {place.founded_ago} ago." for places with no founder. Chosen by a stable hash of the place id.
2. **Living-memory war lines** (≥ 3): e.g. "{realmA} and {realmB} went to war {ago} ago. {town} burned and was never rebuilt. {commander} fell there." with a fogged twin ("A town burned and was never rebuilt.").
3. **Elder war names and lines** (≥ 4 names, e.g. "the Breaking", "the Long Fall"): the name is drawn once at worldgen and stored on the event as `pastName` (data internal to the event).
4. **Ruin lines by archetype** (≥ 2 each for temple, vault, battlefield, and plain ruin): "A {empire} temple." The fall clause ("It fell in {war}.") renders **only where `getPlacePast` returns a `fellInEventId`**, meaning the battlefields of the two warring empires and the burned towns. Every other ruin gets the kind-only line, because a past claim without an engine fact behind it is exactly what THR-1591's rule forbids. The fogged twin names only the kind.
5. **Wonder legend lines, per wonder subtype** (≥ 2 for each of the 13 subtypes in `world-objects.ts:153`), picked so that no two wonders in one world share a line while any is unused. This answers the prototype's "crystal caverns are 5 of 8 wonders" lesson.
6. **Dead-notable role sentences** (one per `pastRole`): "Founded {place}. Lies there still." · "Fell leading {realm} against {enemy}." · "First to find {wonder}, and did not come back the same."
7. **Four enrichment placeholders**, registered through the existing enrichment resolver: `{place.founded_ago}` (via `pastSpanLabel`), `{place.founder}`, `{ruin.empire}`, `{ruin.fall}`. Documented in `Docs/plans/2026-04-16-systemic-wiring-guide.md` in S2's PR.
8. **Tooltips** (Law 17, ≤ 200 characters, plain register): `ui.before_you_woke` ("What the world was before you woke: the empires that fell, the wars people still remember, and who founded the towns."), `location.founding`, `location.burned_town`, `location.elder_ruin_empire`, `agent.past_dead` ("Someone who died before you woke. The living still remember them.").

`legacyFlavor` stays flavor: the chapter quotes it under each empire, exactly as `HexChronicle` already does.

### Hooks for ruin content

For [write where the dice land](https://linear.app/threadbare/issue/THR-1598)'s ruin encounters, which wait on this plan. Ruin content reads, and never re-derives:

- `getPlacePast(graph, locationId)` → `{ empireId?, archetype?, fellInEventId?, restingIds[], foundedYearsAgo?, founderId? }`;
- the four placeholders above, plus the existing `{ruin.*}` family;
- the `past_elder_war` and `past_war` events by `eventType` (for "the Breaking" callbacks), and dead actors by `pastRole`.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only; no WebGL change).*

Laws checked on every surface: 1 (subject, tooltip, link), 13/14 (no numerals, no keys: ages via `pastSpanLabel`), 16 (sentences, not key:value), 17/18 (tooltip registry, ≤ 200 characters), 21 (every name routes through `useRefRouter`), 33 (one viewport, panel scrolls internally), 36 (grouped, counted, collapsible), 42/43 (plain register, no leaked placeholder), 51 (collapsed state persists), 55 (the past is reachable at any time from the chronicle).

### Player-facing display

1. **"Before you woke", pinned in the chronicle** (`ChroniclePanel.tsx`, S2). *Lane decision 6.* A `Section` pinned above the entry list, heading "Before you woke" with the `ui.before_you_woke` tooltip, holding four collapsible groups with counts on their headers (Law 36): **The elder age** (each empire, its ruin kinds as words, its `legacyFlavor` quote, then the elder war line), **The settling** (capitals first, then the `CHRONICLE_PAST_SETTLING_ROWS` oldest settlements; every other settlement carries its own founding line on its page), **Living memory** (one line per war), **Wonders** (one legend line each). Expanded the first time the panel opens, collapsed state persisted in the one preference store (Law 51). Every Realm, place and person is a link through `useRefRouter`.
2. **The place line** (`LocationView.tsx`, under the header sub-line at `:1240-1247`, S2). Settlements: the founding frame. Plain ruins: the war line or its fogged twin. Elder ruins: the fall line or its fogged twin. One sentence, not a label strip (Law 16). A place with no past record renders nothing.
3. **The dead person's sheet** (the existing agent surface for a deceased actor, S2): the role sentence and "Died {ago} ago" under the name. A seeded dead actor is reachable from every link above; it never appears in a living-people list.

### Event notifications

None. The past is found by reading, not pushed. No toast, no interrupt (Law 49).

### Debug inspection

- `window.__DEBUG.getWorldPast()` (S1): the unfogged `WorldPastView`. `getWorldPast({ fogged: true })` (S2): the player's view with `known` flags. This is S2's state assertion.
- CLI: `eval` over `readWorldPast(state.graph)`; the seeding summary prints one line at worldgen.

### Visual presence (HexMapV2)

None new. The burned towns and ruins are already map places; the dead are not drawn.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `worldPast.seedWorldPast` | worldgen, `gameInit` after `:241` | via `readWorldPast` | graph only | `world_past_seeded` | `getWorldPast`, summary line |
| `worldPast.readWorldPast` / `getPlacePast` | read at render | `ChroniclePanel`, `LocationView`, agent sheet | — | — | `getWorldPast` |
| `worldPast.readWorldPastForPlayer` (S2) | read at render | same | `hexRevelation`, fog state (existing) | — | `getWorldPast({fogged:true})` |
| `worldPast.mintPastAmbitions` (S3) | worldgen, tail of `seedWorldPast` | existing ambition surfaces | graph (`pursues`, `relates_to`) | `world_past_seeded.ambitions` | agent detail ambitions |
| `aftermathWords.pastSpanLabel` | pure | place line, chapter, sheet | — | — | unit test |
| `world-past-content.ts` + four placeholders (S2) | enrichment at render | same | — | — | `lintProseQuality` if it covers the tables |

Verify each against `Docs/plans/wiring-checklist.md`.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `WORLDGEN_PAST_ENABLED` | `true` | the whole pass; `false` restores today's t0 exactly |
| `WORLDGEN_PAST_PRIME` | 101363 | the pass's own PRNG offset |
| `WORLDGEN_PAST_EVENTS_MAX` | 6 | hard cap on past event nodes (per-tick scanners walk every event) |
| `WORLDGEN_PAST_DEAD_MAX` | 10 | hard cap on seeded dead |
| `WORLDGEN_PAST_ELDER_AGE_YEARS` | [700, 1100] | how long ago the elder war was |
| `WORLDGEN_PAST_FOUNDING_YEARS` (per class: capital, city, town, hamlet, farmland, camp, ruins) | [350,500] · [200,380] · [80,260] · [20,160] · [20,160] · [1,20] · [60,300] | founding age ranges |
| `WORLDGEN_PAST_LIVING_WARS` | {min 2, max 3} | wars in living memory |
| `WORLDGEN_PAST_LIVING_MEMORY_YEARS` | [8, 45] | how long ago they were |
| `WORLDGEN_PAST_WAR_MAX_HEXES` | 8 | how close two Realms' settlements come to count as neighbours |
| `WORLDGEN_PAST_BURNED_TOWN_MAX_HEXES` | 10 | how far from the seats' midpoint a burned town may be |
| `WORLDGEN_PAST_COMMANDER_RANK` | 0.6 | a fallen commander's `member_of.rank` |
| `WORLDGEN_PAST_WONDER_FINDERS_MAX` | 4 | wonder finders |
| `WORLDGEN_PAST_DESCENT_SHARE` | 0.25 | share of mortals on dead-empire land given descent |
| `WORLDGEN_PAST_REVENGE_AMBITIONS_MAX` | 2 | S3 revenge mints |
| `WORLDGEN_PAST_WONDER_AMBITIONS_MAX` | 2 | S3 wonder mints |
| `WORLDGEN_PAST_WONDER_PULL_MAX_HEXES` | 12 | how far a hero may be from a wonder to want it |
| `PAST_SPAN_DECADE_FROM_YEARS` / `PAST_SPAN_CENTURY_FROM_YEARS` | 10 / 95 | where `pastSpanLabel` changes unit |
| `CHRONICLE_PAST_SETTLING_ROWS` | 10 | settlements listed in The settling beyond capitals |

All worldgen constants live in `world-past-constants.ts` as one `WorldPastConstants` override bag (the `LivingWorldConstants` pattern), so tests can dial them. The two span thresholds live beside `pastSpanLabel`; the row count in the panel's constants.

## Tracing

```ts
// One trace at worldgen, the summary the census reader checks.
interface WorldPastSeededTrace {
  category: 'world_past_seeded';
  tick: 0;
  events: { elderWar: 0 | 1; livingWars: number };
  foundedSettlements: number;
  dead: { founder: number; fallen_commander: number; wonder_finder: number };
  descent: { mortals: number; byCulture: Record<string, number> };
  misses: {                       // every skip, by id, so nothing fails silently
    elderWar?: 'fewer_than_two_empires_with_battlefields';
    warsWithoutBurnedTown: string[];     // event ids
    realmPairsAvailable: number;
  };
  ambitions?: {                   // S3
    minted: Array<{ actorId: string; templateId: string; sourceId: string }>;
    skipped: Array<{ sourceId: string; reason: 'no_member_protagonist' | 'no_leader' | 'no_free_slot' | 'none_in_range' }>;
  };
  durationMs: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The pass throws | caught in `gameInit`; one warning; the world starts with no past (today's behaviour) |
| Fewer than two empires with battlefield ruins | no elder war; `misses.elderWar` set |
| Fewer Realm neighbour pairs than wars wanted | as many wars as pairs (0 is legal) |
| No plain ruin within range for a war | the war is written without a burned town; the commander rests at the losing seat |
| A culture name generator returns nothing | the dead actor gets the culture's generic name pool; still never a raw id (Law 14) |
| Event or dead caps reached | the pass stops adding that kind; fill order decides who is kept |
| A mortal has no resolvable home hex | no descent draw for them (the draw is still consumed, keeping the stream stable) |
| S3: no leader, no member protagonist, no free slot | no mint; reason in `ambitions.skipped` |
| `readWorldPast` meets a dangling edge (a place later razed) | the record drops that clause; the line renders the rest, or nothing |
| A content table has no line for a subtype | the generic line for its class; one warning (Law 14) |
| A reader computes "ticks since death" from a negative `deceasedTick` | it gets a large age; S1 greps every `deceasedTick` reader and guards any that would misbehave |

## Blast Radius

`src/engine/graph.ts`, `src/types/gameState.ts` and `src/types/graph.ts` are **not edited** (Lane decision 1; no new edge or node type; `eventType` is an untyped property). Files edited: `gameInit.ts` (one call), `ruins/clueLifecycle.ts` (the cast becomes a type), `aftermathWords.ts` (one function), the debug bridge; S2 adds `ChroniclePanel.tsx`, `LocationView.tsx`, the agent sheet header, the enrichment resolver, the tooltip registry; S3 touches no shared file beyond calling existing APIs. The executor checks `.codesight/graph.md` at pickup.

**Seed-world shift:** the pass runs after every existing draw on its own stream, so no existing node moves. Worlds gain ≤ 6 events, ≤ 10 dead actors, a property on every settlement and on about a quarter of mortals on old land. Tests pinned to exact t0 event, actor or edge counts will need their numbers updated; a failure on anything else is a real regression.

## Slicing

| Slice | Ticket | Depends on | Scope |
|---|---|---|---|
| S1: the past on the graph | **this ticket** | nothing (runs after notables-and-ties S1, already merged) | S1a–g, `pastSpanLabel`, `getWorldPast`, descent type, census reader |
| S2: the player meets the past | filed at handoff | S1 | fog gating, chronicle section, place and sheet lines, content tables, placeholders, tooltips |
| S3: the past feeds ambitions | filed at handoff | S1 | `mintPastAmbitions`, the revenge kin tie |
| Deferral: a descendant can want the old homeland back | filed at handoff, `Deferral` | S1 | a `reclaim_homeland` rule that reads descent |

## Out of scope

- **A rival god in the past** — decided: the past stays mortal.
- **Rumours as a content kind** — the map ruled it out of this plan.
- **Ruin encounter templates** — [write where the dice land](https://linear.app/threadbare/issue/THR-1598)'s; this plan only names their hooks.
- **A deep simulated history** (option C, rejected by Christian's choice of A).
- **Minting `reclaim_homeland` at t0** — Lane decision 5; deferral filed.
- **A Great Chronicle volume UI** — no reader exists; the chapter does not need one.
- **The culture-name biome-id leak** — its own ticket, [culture names leak raw biome ids](https://linear.app/threadbare/issue/THR-1622); the chapter shows whatever names worldgen gives.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (line tables, placeholders, tooltips; no encounter prose)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] **The player is a god, not a protagonist.** No verb is added. The god wakes into a world that was already old, which is what "a world that starts alive" asked for; Perceive gains something to find.
- [x] **Narrative over mechanics.** The past exists to give the living reasons: a fallen commander a kin who wants revenge, a wonder a legend someone chases, a ruin a story. Every fact the pass writes has a reader named in § Interface impact.
- [x] **All mechanics surface through prose, never numbers.** Ages are words (`pastSpanLabel`), ruin counts are words, dates never appear.
- [x] **Everything is a graph edge.** Existing event nodes and edge types; no new node or edge type.
- [x] **Fog is honoured.** The outline is common knowledge, the specifics are found (the delegated sub-call).
- [x] **Additive over destructive.** One flag turns the pass off and restores today's t0.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, verb, prerequisite, resource, encounter, clock, win/loss). It changes what the world holds at t0.
- [x] No rulebook edit. `Docs/canon/rulebook.md:536` ("The dead stay") already describes the retained dead this plan seeds. S1's PR corrects `Docs/canon/world-objects.md` row 22 only if it adds a sentence that seeded dead are retained too; it does not touch the separate lifecycle `remove` inaccuracy the research found (a pre-existing defect, logged as an impediment-log row, not a ticket).
- [x] No new UL term. "Before you woke" is a chapter heading; "the Breaking" is a generated name.

> Brainstorm companion: `Docs/plans/2026-09-28-thr-1631-world-with-a-past-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every count, range, cap and threshold is a named constant in one override bag (§ Constants) |
| 2. Inspectability | PASS | `world_past_seeded` lists every miss and skip by id; `getWorldPast` reads the same selector the UI uses |
| 3. Determinism | PASS | own stream at 101363; fixed draw order; sorted candidates; runs after every other draw, so nothing existing moves |
| 4. Fail-soft | PASS | § Fail-soft; the pass is wrapped and `false`-flaggable |
| 5. Narrative over mechanical perfection | PASS | the past is thin and explains the map; specifics reward exploring |
| 6. Additive over destructive | PASS | new module, new properties, new events; nothing deleted |
| 7. Performance budget | PASS with note | worldgen cost measured at 9–10 ms in the prototype; ≤ 6 events against 1404 by t150; measured against the ≤ 4% budget line in S1 |

## Kill criteria

- **Steady-state tick cost rises more than 4%** on seeds 42 and 99 against a same-session baseline, or worldgen time rises more than 50 ms → the per-tick cost can only come from the six events or from a sweep that now meets the dead. Find the reader before tuning. If it is the events, drop the elder war's `occurred_at` fan-out to the ten nearest battlefields.
- **A seeded dead actor appears among the living** (a decider, a notable pick, an encounter participant, a resident count) in the 200-tick census → a reader ignores `deceased`. Fix that reader; do not remove the dead.
- **Clue scoring changes the delve rate by more than a quarter** on the two seeds → lower `WORLDGEN_PAST_DESCENT_SHARE` and post the numbers on this ticket.

## Done when

S1 (this ticket):

- [ ] on seeds 42 and 99, the census reader (committed under `Docs/audits/2026-09-25-living-world-data/readers/past.ts`, `dying.ts`'s pattern) reports: ≤ 6 past events with 1 elder war where two empires have battlefields and ≥ 2 living-memory wars where neighbour pairs allow; every settlement with `foundedYearsAgo`; 5–10 dead; descent on 15–35% of mortals on old land; before/after in the PR body;
- [ ] a test proves the pass is deterministic (same seed → identical `readWorldPast`) and that with `WORLDGEN_PAST_ENABLED=false` the t0 graph equals today's;
- [ ] a test on a **generated** world (heavy lane) runs 200 ticks and proves no seeded dead actor is ever a decider, a notable pick, an encounter participant or counted as a resident;
- [ ] a test proves `clueLifecycle`'s descent scoring reads a seeded stratum;
- [ ] a unit test pins `pastSpanLabel` at 0, 9, 10, 94, 95, 456 and 1000 years, and asserts no numeral in any output;
- [ ] the steady-state tick cost is within the kill line, with numbers in the PR body;
- [ ] the interface-map rows `world-past-reaches-the-chronicle` (producer half), `world-past-descent-feeds-clue-scoring` and `seeded-dead-stay-dead` are registered;
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI engine smoke;
- [ ] the closing commit body has a line-anchored close keyword for this ticket;
- [ ] `Browser-verify exempt: engine and data only; S1 changes no surface (the chapter and lines ship in S2)`.

## Coordination block

**Suggested model:** opus. A worldgen pass with stream discipline, a new death-shaped writer every living-actor sweep must respect, and a type for an untyped reader.

**Parallel-safe with:** [THR-1633](https://linear.app/threadbare/issue/THR-1633) slices (encounter shortlist and journeys; `encounterFilterPipeline.ts`, movement), [THR-1649](https://linear.app/threadbare/issue/THR-1649) (camera and avatar sight), [THR-1635](https://linear.app/threadbare/issue/THR-1635) (encounter opening words).

**Mutex with:** [THR-1632](https://linear.app/threadbare/issue/THR-1632) once handed off (both likely add a worldgen pass and a call in `gameInit.ts`); [THR-1654](https://linear.app/threadbare/issue/THR-1654) (the notable pick must skip the seeded dead; land in either order, but not concurrently, so one PR's census covers the other's writer).

**Files to touch:** (S1)

- Create: `src/engine/worldPast.ts`, `src/data/world-past-constants.ts`, `src/types/worldPast.ts`, `Docs/audits/2026-09-25-living-world-data/readers/past.ts`
- Edit: `src/engine/gameInit.ts` (one call), `src/engine/ruins/clueLifecycle.ts` (typed stratum), `src/engine/aftermathWords.ts` (`pastSpanLabel`), `src/debug-bridge.ts` and `src/debug-bridge.d.ts` (`getWorldPast`), `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`

## Notes for the executor

- **Seed the dead with the run-time shape, not a new one.** `deceased:true` is the spelling most sweeps read; do not also write `alive:false` or `status:'dead'`. Grep every reader of `deceasedTick` for arithmetic that a negative value would break.
- **Never write the past into `chronicleEntries`.** Cycle end empties it (`cycleEnd.ts:287`).
- **One event per war, not per ruin.** The elder war's sites are `occurred_at` edges on a single event.
- **The founder link is `constructed_by` with `structureType:'founding'`.** The Builder's Legacy mandate counts `constructed_by`; confirm its THR-1618 scope (`sinceMandateStart`) still excludes worldgen edges.
- **Draw the descent roll for every candidate even when it cannot apply**, so a later fix to home resolution does not shift the stream.
- **Re-baseline in the same session.** Tick cost swings on unchanged `main` (the briefing reports 77–106 ms/tick this week).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-28*

**Intent judge (fable), 2026-09-28: Allow.** Class confirmed Reversible. 28 code claims spot-checked, all pass (a few lines of drift). One GAP on load-bearing decisions (winner and loser stored as ids on the event rather than on the Realms' `participated_in` edges) and two notes (`eventType` is not a closed union; the ruin fall clause must render only where an engine fact backs it). All three were folded in before merge (§ S1d, § S1a and Blast Radius, Content item 4).

### NFP audit

PASS-with-notes. Tunability, Inspectability, Determinism, Fail-soft, Narrative and Additive: PASS. Performance: PASS-with-note. The 9–10 ms worldgen cost and the ≤ 4% budget come from the prototype and the liveness research, not from this implementation. The kill criteria commit S1 to re-measuring against a same-session baseline.

### Three-pillar audit

PASS. Engine, Content and UI are present and substantive; no required section is missing. The wiring table fills all six checklist columns. The substrate inventory matches `systems-inventory.md`, and each system is read, extended or (for descent scoring's missing writer) activated. No green-field duplication.

### Vision audit

PASS. Non-negotiables confirmed: the god gains no verb, the past exists to feed readers, prose not numbers, graph purity. Design tension 4 (legibility vs mystery) is held well: the outline is free and the specifics are found, which matches the taste profile's "elder magic discovered, not selected". The core loop is preserved, because S3's capped mints to protagonists already deciding cannot widen the story portfolio. No contradictions.
