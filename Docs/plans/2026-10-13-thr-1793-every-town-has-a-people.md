> **title:** Every town has a people — the fringe reaches every settlement — THR-1793
> **linear_issue:** THR-1793
> **author:** Claude Code (tb-design-lane, run 2026-10-13b, under delegation)
> **created:** 2026-10-13
> **three_pillars:** Engine `done — one scenario default moves (fringe reach 4 → 24 hexes); no new code path` · Content `N/A — no new prose; existing culture lines, traits and openings reach the newly linked towns through readers that already exist` · UI `N/A — no component changes; the shipped "{culture} fringe" label (THR-1659) renders on the newly linked towns through the existing hex culture panel`

# Every town has a people — the fringe reaches every settlement — THR-1793

*Two in five mortals belong to no people because their whole town belongs to none. One number, the existing fringe reach, fixes almost all of them for a measured +5.6 % steady tick cost.*

## Why this is load-bearing

[Sphere scores land where Dominion reads them](https://linear.app/threadbare/issue/THR-1768) seeds each mortal's sphere bag from their strongest culture. On seed 42 / medium, 216 of 509 mortals have **no** culture link, so they add nothing to the Dominion read. The same 42 % look like nobody to every culture reader: culture prose, culture traits, the culture line in encounter openings ([THR-1635](https://linear.app/threadbare/issue/THR-1635)), cultural tension. By tick 240 it is 368 of 766, because a mortal born where nobody has a culture is born without one too.

The ticket asked the design lane one question: *should worldgen give every settlement NPC its home settlement's culture edge?* **Measured, NPCs already do.** The gap is one level up: the settlements themselves have no culture.

```
# seed 42 / medium, tick 0 — cultureless individuals, grouped by id prefix | home place | does the place have a culture?
npc|capital|locNoCulture 15+5   npc|city|locNoCulture 60+13   npc|hamlet|locNoCulture 47+24
npc|camp|locNoCulture 18        npc|town|locNoCulture 8+3     npc|temple / farmland / fort  3 / 4 / 3
ind 7 · agent 5 · avatar 1  (protagonists — see § Out of scope)
npc at a place that HAS a culture: 0
```

`mintNpc` already copies the place's culture onto every NPC it mints (`npcSeeding.ts:278-288`, through `resolveLocationCulture` at `:338-344`), for the roster and the genome top-up alike. What fails is that **24 settlements on seed 42 have no culture**: one capital (Ardenmor Keep), four cities, a town, twelve hamlets, six camps, plus a farmland, a fort and a temple. Every one is 5 or more hexes from the nearest heartland. The fringe pass ([faith and politics settings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md) § S1d, `worldSeed.ts:1741-1780`) stops at `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes = 4` (`world-scenario.ts:55`).

That 4 was a speed cut, not a meaning choice. THR-1632's brainstorm rejected *"leave the frontier cultureless"* outright (*"half of all mortals have no culture"*), chose 8 hexes, and the scenario comment records that 8 was then lowered to 4 because it measured +17 % against +10.3 % on seed 99 (`world-scenario.ts:48-54`). Its kill line said: *lower the reach first*. This plan re-measures on today's `main` and finds the full reach costs **+5.6 %**, inside that line.

**Agreed work.** The ticket is a bug Christian filed, in the Dominion project, with a direct question for the design lane. The direction (every settlement carries its nearest people as a fringe) was set by THR-1632. The design lane makes each call below under delegation, with a veto invited. No input is a lane decision still inside its 24 h window.

## Decisions made by delegation (veto in chat)

| # | Decision | Why | Veto line |
|---|---|---|---|
| D1 | **The fix is the town, not the NPC.** NPC minting is unchanged. | 0 NPCs at a cultured place lack the edge (census above); every cultureless NPC lives in a cultureless place | — (a measurement, not a choice) |
| D2 | **The fringe reaches every settlement:** `cultureFringeMaxHexes` 4 → 24 (`CULTURE_FRINGE_MAX_HEXES_MAX`, the setting's existing ceiling). Same half-strength, current-only, never-territory link; same subtype list. | Covers every settlement on seeds 42 and 99 except the god's starting shrine, minted after worldgen (below); 24 and unlimited give identical worlds on medium; +5.6 % steady tick cost | *"keep the far towns without a people"* |
| D3 | **No birth change.** | With D2, newborns with no culture fall from 47 to 0 (seed 42, t240) and 42 to 0 (seed 99) — they inherit from the now-cultured mortals around them | — |
| D4 | **No new word.** A far town reads *Varn fringe* exactly as a near one does. | The UL entry *Fringe* already reads "the nearest culture within reach"; a second "frontier" tier would be a second label for the same idea (brainstorm § Considered alternatives) | *"far towns should read differently from near ones"* |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Culture** — fringe pass (`worldSeed.ts:1741-1780`), `assignCultureToLocation` | 🟢 ACTIVE | **extends** — one default; no code change to the pass |
| World Generation scenario block (`world-scenario.ts`, `resolveWorldScenario`) | 🟢 ACTIVE | **extends** — `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` |
| NPC seeding (`npcSeeding.ts` `mintNpc`, `seedGenomeNpcsAtSettlements`) | 🟢 ACTIVE | **unchanged** — already reads the place's culture |
| Agent lifecycle births (`agentLifecycle.ts:453-558`) | 🟢 ACTIVE | **unchanged** — inherits from cultured mortals present |
| Sphere seeding (`sphereAffinity.ts:264-295`, THR-1768 D1) | 🟢 ACTIVE | **unchanged** — reads the new edges on its next sweep |
| World-scenario census (`worldScenarioCensus.ts`, `__DEBUG.getWorldScenario`) | 🟢 ACTIVE | **unchanged** — its `fringeSettlements` / `culturelessSettlements` are the Done-when's read |

Population consumed, measured (CLI `eval`, seed / medium, tick 0 → tick 240, reach 4 → reach 24):

| | seed 42 | seed 99 |
|---|---|---|
| Cultureless mortals, t0 | 216 / 509 → **13 / 506** | 187 / 643 → **12 / 639** |
| Cultureless mortals, t240 | 368 / 766 → **74 / 772** | 289 / 979 → **52 / 984** |
| Cultureless settlement-type places, t0 | 28 / 56 → **1 / 56** | 24 / 81 → **1 / 81** |
| Newborns with no culture, t240 | 47 → **0** | 42 → **0** |

The leftovers are all places the rules keep cultureless or places this pass never sees. The t0 shrine is *Sacred Grove* (16,12), the god's own starting shrine `loc.start`, which `gameInit.ts:283-310` mints after worldgen returns, so the fringe pass never sees it (left as is: it is the player's holy place, not a people's town). The t240 mortals on seed 42: 29 lair elites (`elite_*` at lairs), 25 encounter support actors at waypoints, unexplored sites and ruins, 9 at a mining site (not a fringe subtype), 8 at a hamlet founded during play. Plus 13 protagonists (by design, § Out of scope).

## Engine pillar

### Systems design

One change: `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` from `4` to `CULTURE_FRINGE_MAX_HEXES_MAX` (24). Reference the constant, do not copy the literal, so the default and the ceiling cannot drift. Update the comment block above it (`world-scenario.ts:48-54`) with this plan's measurement and the ticket link.

Nothing else in the fringe pass changes: the subtype set, the half strength, the `fringe: true` flag, the current-only layer, the draw-free nearest-heartland rule with its tie-breaks, and the invariant that fringe links never enter `locationCultureMap` (so promotion, Realm `controls` and protagonist culture rolls are untouched).

`WORLD_SCENARIO_TODAY` keeps `cultureFringeMaxHexes: 0`. The "today" world must still equal the pre-THR-1632 graph, and the existing test pins it.

### Graph nodes / edges

No new node or edge type. More `belongs_to` edges of the existing fringe shape (`cultureLayer: 'current'`, `culturalStrength: CULTURE_FRINGE_STRENGTH`, `fringe: true`) on settlements, and `belongs_to` edges on the NPCs `mintNpc` places there (`culturalStrength: 1.0`, as today).

### Tick phases

None. Worldgen only. Tick-time effects come from existing readers seeing more cultured mortals (cultural mismatch at fringe towns, culture traits, prose) — measured below.

### Resolution logic

Unchanged: nearest heartland location by hex distance; ties by culture id, then location id.

### PRNG callouts

None. The fringe pass is draw-free. Worldgen's later passes still see a different world (measured: seed 42 has 509 individuals at t0 at reach 4 and 506 at reach 24; seed 99 643 → 639), so **the default world changes for every seed**, exactly as THR-1632 stated for its own fringe. Same seed still gives the same world.

### Performance

Measured on today's `main` (`df51cba3`), `measure:tick-cost` seed 99 / medium / 200 ticks, three paired same-session runs, reach overridden through a throwaway environment read that was reverted:

| run | reach 4 steady ms/tick | reach 64 steady ms/tick |
|---|---|---|
| 1 | 209.7 | 222.1 |
| 2 | 211.4 | 223.5 |
| 3 | 210.6 | 221.6 |
| **mean** | **210.6** | **222.4 (+5.6 %)** |

Warm-up band +8 % (156.7 → 168.7). Agents at tick 200: 1035 → 1050. Reach 24 and reach 64 produce the same world on medium (census above), so the same cost.

## Content pillar

Content: N/A — no new prose. The readers that already turn a culture link into words (culture line in encounter openings, `culturalProse`, culture traits, culture-aware NPC names) now reach the newly linked towns. No new template, table or line is needed for that.

## UI pillar

UI: N/A — no component changes. The hex culture panel already renders a fringe link as *{culture} fringe* ([the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659); `CULTURE_FRINGE_LABEL`, `world-scenario.ts:112`). More towns show it. No new surface, so no browser evidence is owed; the Done-when reads the census through the debug bridge instead.

### Player-facing text

No new or changed text. Existing text now on more towns: the hex panel line *"Culture: Varn fringe"*. Complaint classes touched: none new.

### Playtest signal

A tester who opens a town far from any capital sees which people it belongs to.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI | GameState flow | Traces | Debug |
|---|---|---|---|---|---|
| fringe reach default (`world-scenario.ts`) | worldgen (fringe pass) | hex culture panel (existing) | graph `belongs_to` | `worldgen_scenario_applied.fringe.{linked,outOfRange}` (existing) | `__DEBUG.getWorldScenario()` → `fringeSettlements`, `culturelessSettlements` |

Run `npm run check:wiki-freshness:blocking`. If a Design Reference Wiki page lists `src/data/world-scenario.ts` in its `sources`, add one line about the reach there; otherwise `Wiki-freshness-exempt: default-value change, behaviour documented in plan + UL`.

## Interface impact

| Contract | Change |
|---|---|
| `culture-custom-reaches-encounter-opening` (`interface-map.md` ~:300-330, already names fringe links as a producer) | **preserve** — same producer, more towns; note the 24-hex reach in the row |
| THR-1768 sphere seed reads `belongs_to` | **preserve** — reads more edges, no shape change |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` | `CULTURE_FRINGE_MAX_HEXES_MAX` (24), was 4 | how far a culture reaches beyond its heartland as a fringe |
| `CULTURE_FRINGE_MAX_HEXES_MAX` | 24 (unchanged) | ceiling `resolveWorldScenario` clamps to |
| `CULTURE_FRINGE_STRENGTH` | 0.5 (unchanged) | `culturalStrength` of a fringe link |
| `CULTURE_FRINGE_SUBTYPES` | unchanged | which places can take a fringe |

## Tracing

N/A — no new trace type; the existing one below already carries the counts this change moves.

No new trace type. The existing `worldgen_scenario_applied` trace carries `fringe: { linked, outOfRange }`; after this change `outOfRange` is 0 on seeds 42 and 99 medium. A larger map that leaves towns beyond 24 hexes reports them there.

## Fail-soft table

| Failure | Fallback |
|---|---|
| No heartland location at all | No fringe links; everything else proceeds (existing) |
| A settlement beyond 24 hexes on a large map | Stays cultureless; counted in `fringe.outOfRange` (existing) |
| Tick cost rises past the kill line | Lower the reach to 8 and re-measure (§ Kill criteria) |

## Blast Radius

Not owed: `world-scenario.ts` has fewer than 100 importers and the change is a default value.

## Out of scope

- **Protagonists** (13 / 12 per seed at t0: `ind_*`, `agent_*`, the avatar). Their culture comes from `assignCulturesToActors`, which reads `locationCultureMap` (heartland only) with draws per actor, and a 10 % cultureless roll that is designed (`CULTURELESS_PROBABILITY`). Reading fringe there would shift the shared worldgen stream for a dozen actors.
- **Lairs, ruins, waypoints, unexplored sites** stay cultureless by THR-1632's rule; the encounter support actors and lair elites standing there stay cultureless with them.
- **Places founded during play** (seed 42 t240: one new hamlet, 8 people) and **mining sites** (not a fringe subtype) take no culture. Filed as [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839), blocked by this ticket.

## Three-pillar check

- [x] Engine pillar present (one default, measured census and tick cost)
- [x] Content pillar N/A with rationale (existing culture readers carry the words)
- [x] UI pillar N/A with rationale (the shipped fringe label renders)
- [x] Wiring section connects them (existing trace and debug census)

## Vision audit

- [x] This plan does not contradict any Vision premise. It leans on the non-negotiable *narrative over mechanical perfection*: a capital that belongs to no people was a hole in the story; now it has one. THR-1632 already decided the frontier carries its nearest culture; this plan finishes that decision.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play; the culture a town belongs to is world state, not a rule.
- [x] No `Docs/canon/rulebook.md` edit is owed.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | the reach is the scenario knob; default references the named ceiling |
| 2. Inspectability | PASS | existing trace counts linked and out-of-range; census read in the debug bridge |
| 3. Determinism | PASS with note | draw-free pass; the default world changes for every seed (stated), same seed = same world |
| 4. Fail-soft | PASS | existing fallbacks; nothing new can throw |
| 5. Narrative over mechanics | PASS | every town has a people |
| 6. Additive | PASS | no code path removed; one default moves |
| 7. Performance budget | PASS with note | +5.6 % steady, measured paired; inside THR-1632's +10 % line, with a stated fallback |

## Kill criteria

- **Steady tick cost rises more than 10 %** against a same-session baseline on seed 42 or 99 (medium, 200 ticks, `measure:tick-cost`, three pairs) → set the reach to 8, re-measure, post both sets of numbers on the ticket.
- **A town is promoted, annexed or bordered by a fringe link** → the `locationCultureMap` invariant broke; revert and investigate.

## Done when

- [ ] `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` references `CULTURE_FRINGE_MAX_HEXES_MAX`; `WORLD_SCENARIO_TODAY` is unchanged and the test that pins the today-world graph still passes.
- [ ] On seeds 42 and 99 (medium, tick 0), `await window.__DEBUG.getWorldScenario()` (or the census selector in a test) reports no cultureless `CULTURE_FRINGE_SUBTYPES` place other than `loc.start` that lies within 24 hexes of a heartland, and every `npc_*` actor whose home place carries a `belongs_to` has one too (a unit test over a generated world asserts the second predicate for every NPC, not a count).
- [ ] On seed 42 at tick 240, no newborn (`born_*`) lacks a culture when any mortal at its birthplace carries one.
- [ ] No fringe-linked location appears in `locationCultureMap`: the existing THR-1632 test for promotion and Realm holding still passes.
- [ ] `measure:tick-cost` before/after (three pairs, seed 99 medium) in the PR body, under the kill line.
- [ ] Snapshot tests that pin default-world counts move with the census as evidence in the PR body; the interface-map row notes the 24-hex reach; the wiki-freshness gate passes or is exempted with the reason above.

## Coordination block

**Suggested model:** sonnet — one default, test updates and a measurement; no new logic.
**Parallel-safe with:** [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811), [The god's screen fills one gift at a time](https://linear.app/threadbare/issue/THR-1837) (no shared files).
**Files to touch:**
- Edit: `src/data/world-scenario.ts` (default reach + its comment)
- Edit: tests that pin default-world counts (`src/engine/__tests__/worldScenario*.test.ts` and any snapshot the run moves)
- Add: one test asserting every `npc_*` at a culture-bearing place carries `belongs_to`
- Edit: `Docs/canon/interface-map.md` (note the 24-hex reach on the culture opening row)

**Mutex with:** anything editing `src/data/world-scenario.ts` or the fringe pass in `worldSeed.ts`; [Dominion on the map](https://linear.app/threadbare/issue/THR-1750) only in that its census numbers move with the default world (no shared file).

## Notes for the executor

- The measurement used a throwaway `process.env.FRINGE` read in `world-scenario.ts`; do not ship that. Measure through `resolveWorldScenario` overrides or by editing the default between runs.
- Default-world counts move for every seed (individuals at t0: seed 42 509 → 506, seed 99 643 → 639; the cause was not traced). Update pinned counts with the census, as THR-1632 did.

## Intent-judge verdict

**Allow** (2026-10-13, opus, cold context, ~120 s). Impact class Reversible confirmed. Dimensions 1–10 PASS, 12 N/A. One GAP on dimension 11: the leftover settlement's writer was untraced and Done-when 2 used a count. Fixed before commit: *Sacred Grove* traced to `loc.start` in `gameInit.ts:283-310` (minted after worldgen), and Done-when 2 now states a predicate.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-13*

### NFP audit

PASS-with-notes. Tunability, Inspectability, Fail-soft, Narrative and Additive PASS. Determinism PASS-with-note: the fringe pass is draw-free, but later worldgen passes see a different world (509 → 506 individuals on seed 42; cause not traced); same seed still gives the same world. Performance PASS-with-note: +5.6 % steady on three paired seed-99 runs against a +10 % kill line; warm-up +8 %; seed 42 was not timed (Done-when 5 and the kill line cover both seeds at build time).

### Three-pillar audit

PASS. Engine present and substantive (measured census, paired performance table, PRNG note, constants, tracing, fail-soft). Content N/A with rationale (existing culture readers reach the newly linked towns). UI N/A with rationale (the shipped fringe label renders). Wiring sufficient for a default-value change. Substrate inventory present; extends the 🟢 ACTIVE Culture subsystem and builds nothing new.

### Vision audit

PASS-with-notes. Touches the *narrative over mechanical perfection* non-negotiable, confirmed. No contradictions; core loop preserved (more towns feed existing culture readers); god/protagonist separation untouched. Note: the plan's Vision section is one sentence citing no Vision file, acceptable for a one-default change.
