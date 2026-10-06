> **Research audit for THR-1759** (wayfinder map THR-1758, project Dominion — Player Power Progression). Produced by a background research subagent on 2026-10-06; findings only, no design. Raw CLI captures referenced below (`run-hooked.txt`, `run-control.txt`) live in the session scratchpad, not the repo; the inline captures are complete enough to reproduce.

# THR-1759 — Who writes sphere scores, how fast, and what the Dominion formula reads today

Research only. Nothing under `src/`, `Docs/`, `scripts/` was touched. Measured on `main` @ `1a9e5385`, seed 42, map medium, headless CLI (`npm run cli`), 2026-10-06. Raw outputs: `scratchpad/run-hooked.txt`, `run-control.txt`, and the inline captures below.

Formula under study: `dominion(obj) = Σ_s points_god[s] × power_god[s] × (score_obj[s] − score_obj[opposite(s)])`, opposites from `src/engine/cosmology.ts:62-77` (chaos↔order, light↔darkness, force↔mind, matter↔time, energy↔spirit, life↔entropy).

## Headline facts (the ones that change the formula conversation)

1. **`power_god` is an undefined read today.** The ascendant node has **no `sphereAffinity`** at tick 0 or tick 240, in the CLI and in the browser path. `createAscendant` runs at `gameInit.ts:304`, *after* the actor seeding loop at `gameInit.ts:216-233`; and even if it ran first, the ascendant's `sphereAlignment` is `{primary:'chaos', secondary:'energy'}` (strings, `ascendant.ts:131`), which `seedAgentSphereAffinity`'s `weight > 0` filter rejects (`sphereAffinity.ts:69-71`). The identity (remembrance) path adds only `originFragmentId` (`gameInit.ts:533`). `debug-bridge.ts:1030/1087` already read `ascendant.sphereAffinity.scores` and get `undefined`. The only writer that will ever create it is `phaseMandate` (fail-soft default, all zeros) on the first milestone. **"Expect primary 2 / secondary 1" is false.** With the real god, the formula is 0 for every object.
2. **Every seeded mortal is all-zero.** 509/509 individuals have `sphereAlignment: undefined` (no engine writer sets it on individual nodes), so `seedAgentSphereAffinity` returns zeros; `ARCHETYPE_SPHERE_BONUS_PRIMARY/SECONDARY` (2/1) never land. At tick 240, 11 of 497 individuals have any non-zero score (all from notable/mortal-action pressure). NPCs minted mid-run carry `sphereAffinity: null` (`npcSeeding.ts:254`, `binding/mintInhabitant.ts:323`, `debugWorldSpawnTools.ts:535`): 255 of 752 individuals at t240 have none.
3. **Hexes have no scores.** Hex tiles are not graph nodes; `seedHexSphereAffinity` output lives in a local `Map` in `gameInit.ts:186-197` used only to seed locations, then discarded. The "hex" object kind in this ticket's read is empty by construction.
4. **Faction/culture scores are never derived.** `phaseSphereAggregation` computes only the global World-Soul aggregate (weights location 1.0 / agent 0.2 / faction 0.1 / culture 0.1 / artifact 0.3) into `worldSoul.aggregate` + `fundament.sphereWeights`; it writes no node. The `gameInit.ts:228` comment promising "derived aggregation computed later" has no implementation. All 52 seeded factions are all-zero at t240. Only monster factions are born non-zero (`monsterFactionSeed.ts:65-85`, dominant sphere = 2; 28 of them by t240).
5. **99.8 % of all headless pressure magnitude is lairs pressing themselves** (`lairEscalation.ts:418-430`, 8 per lair every 25 ticks, in the lair's own dominant sphere). Lairs reach score 9 after six emissions; every object in the extreme buckets of the read is a lair.
6. **Scores leave the integer scale.** Erosion subtracts `absPressure − threshold` unrounded (`phaseSpherePressure.ts:258-259`); with notable pressure of 0.6/1.2 the t0→t240 diff shows `mind −0.2`, `darkness +2.6`. The "permanent integers" contract in `types/sphereAffinity.ts:20` is not enforced.
7. **`sphere_pressure` traces are built and dropped.** `phaseSpherePressure.ts:406,432` fills `allTraces` and never emits or returns it, so no trace category exists to count writers by source; counting below used a throwaway `Array.prototype.push` hook inside `eval`.

## Writers

Consumer: `phaseSpherePressure` (orchestrator Phase 6.639, `orchestrator.ts:3742-3750`) groups `pendingSpherePressures` by target, nets per sphere, cancels opposition pairs, then constructive = progress toward `triangleCost(n+1) = n+1`; destructive (entity holds the opposite sphere) erodes only the excess over `score + floor(ally/2) + Σ present-agent score` and resets progress. Cap 10 (`MAX_SPHERE_SCORE`). Unknown target ids are skipped; missing/`null` affinity is replaced by a zero default.

| # | Writer (file:line) | Trigger | Magnitude (constant = value) | Sphere | Target kind | Headless, 240 ticks |
|---|---|---|---|---|---|---|
| 1 | `unifiedActionResolution.ts:3867-3883` (contested), `:4126-4137` (uncontested) | per resolved unified action whose template has `sphereAffinity` (83 templates) and a `targetId` | `ACTION_PRESSURE_SUCCESS`=3 / `ACTION_PRESSURE_FAILURE`=1 | template's sphere | action target (location, actor, …) — labelled `divine_action` **even when a mortal acts** | 4 events, 10 mag (2 places, 1 lair, 1 individual), all mortal-driven |
| 2 | `phaseControlEffects.ts:414-427` | per tick per channeled sphere of a sustained effect | `CONTROL_PRESSURE_PER_TICK`=1 | each `perTickCost` sphere | `effect.targetNodeId` | 0 (player-only) |
| 2b | `phaseControlEffects.ts:356-371`, `:453-461` | per tick (rift influence, capped) / per leak roll | `inf.magnitude`; `leak.entropyPressure` | rift sphere / entropy | `effect.targetNodeId` | 0 |
| 3 | `orchestrator.ts:595-613` (`phaseEncounterProgressionV2`) | per resolved legacy encounter step | `ENCOUNTER_PRESSURE_PER_STEP`=1 | legacy `Encounter.sphereAffinity` | actor's `located_at` target | 0 — `state.encounterProgress` stayed empty; nudge-model encounters emit no pressure |
| 4 | `phaseDoom.ts:396-405` | per doom stage crossing | `DOOM_PRESSURE_PER_TIER`=4 | entropy | **every** location node (both tiers) | 0 — clock asleep until the First is bonded (no thread edges headless) |
| 4b | `phaseDoom.ts:168-195` (doom cards) | per stage crossing, per card | `DOOM_CARD_PRESSURE_MAGNITUDE`=3 (+1 late) × severity | force / chaos / mind / spirit by archetype (`doomClock.ts:154-586`) | all locations (`location_pressure`) or 2–3 threaded agents (`agent_pressure`) | 0 |
| 5 | `phaseProsperity.ts:885-892` | per tick per location with `deathCount>0`, reckoning identity only | `RECKONING_DEATH_SITE_SPIRIT_PRESSURE`=2 | spirit | location (labelled `doom`) | 0 |
| 6 | `orchestrator.ts:2005-2013` (rival probe) | per rival action | `RIVAL_PRESSURE_MAGNITUDE`=2 | rival primary | `rival.id` — **not a graph node, so the consumer drops it** | 0 (grace hold) |
| 6b | `orchestrator.ts:2140-2160`, `:2274-2282` (schemes) | per activated scheme phase | `RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE`=0.04 (crack ×2.5) | rival primary | scheme target node | 0 |
| 7 | `notableAgendas.ts:820-847` | per activated agenda phase | `NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE`=0.6 (crack ×2 = 1.2) | `family.sphereLean[0]` | agenda target (place/sub/lair/individual) or the notable | **190 events, 150 mag** |
| 8 | `phaseMandate.ts:321-357`, `:441-458` | milestone / completion | `MANDATE_PRESSURE_MILESTONE`=2 / `MANDATE_PRESSURE_COMPLETION`=5 | mandate primary | **the ascendant** | 0 (stage stayed `setup`) |
| 9 | `phaseOmenAgenda.ts:724-748` | per tick while a sphere-surge omen is active | min(template, `OMEN_SPHERE_PRESSURE_CAP`=0.05)/5 | omen sphere | up to 5 settlements | 0 (no omen active) |
| 10 | `phases/economicPower.ts:206-228` | every `ECON_POWER_SCAN_INTERVAL_TICKS`=12, per `trades_with` route per good per endpoint | `ECON_SPHERE_DRIFT_PER_TICK`=0.002×12 / goods | good's primary sphere | both route endpoints (places) | 160 events, **2.88 mag** |
| 11 | `lairEscalation.ts:418-430` | every `LAIR_ESCALATION_INTERVAL`=25 ticks per active lair | `LAIR_SPHERE_PRESSURE_EMISSION`=8 | lair `dominantSphere` | the lair node itself | **197 events, 1576 mag** |
| 12 | `battleAftermath.ts:218-260` | settlement battle aftermath | `AFTERMATH_BASE_SPHERE_PRESSURE`=3 × 1/2/3 | victor faction's dominant score (all-zero factions → `reduce` picks `chaos`) | the settlement | 0 (no armies/battles) |
| 13 | `magicPower.ts:103-121` `resolveOverchannel` | — | overchannel cost | opposite of cast sphere | caster | **dead: no runtime caller** |

Only #8 targets the ascendant node. `encounterAftermath.ts:1724` and `revelationEmitter.ts` `source: 'divine_action'` hits are unrelated types (appointment seeds, revelation traces), not pressure.

## Seeding

- **Hex tiles**: `seedHexSphereAffinity(terrain)` = `TERRAIN_SPHERE_TABLE` bucket (`types/sphereAffinity.ts:128-149`, e.g. forest life 3/spirit 1/darkness 1, mountains matter 3/force 1/order 1, plains energy 2/life 1/light 1). Never stored on a node.
- **Locations** (`gameInit.ts:199-214`): hex terrain scores + `LOCATION_SPHERE_TABLE[locationType]` (1–2 points, `types:156-218`), capped 10. `LOCATION_TYPE_BONUS`=2 is imported (`engine/sphereAffinity.ts:20`) and **never used**. Only nodes present at that moment are seeded: lairs (`:238`), elder ruins (`:242`), the past, wilderness waypoints, camps, cleared lairs get nothing. Seed 42: 117/235 place-tier nodes unseeded at t0 (13 lair, 103 elder_ruin, 1 shrine); 162/315 at t240 (102 elder_ruin, 55 wilderness_waypoint, 2 cleared_lair, 1 lair, 1 ruins, 1 shrine). All 770 sublocations seeded (677 non-zero).
- **Actors** (`gameInit.ts:216-233`): `seedAgentSphereAffinity(sphereAlignment)` — zeros for everyone (fact 2); factions/cultures/groups default zeros; the ascendant is created afterwards (fact 1).
- **Triangle levelling**: `triangleCost(n)=n`, cumulative `n(n+1)/2` (level 3 = 6, 10 = 55). A lair at 8 per emission: level 9 after 6 emissions (45 ≤ 48), 10 after the 7th.
- Terrain tables load the opposite side of both presets: place means at t0 are force 0.43 / matter 1.31 / energy 0.49 / order 0.60 vs mind 0.17 / spirit 0.32 / chaos 0.03. That is why most objects read negative below.

## Measured on seed 42 (commands + outputs)

Command shape (repo root, Git Bash): `cat <cmds.txt> | npm run cli -- --seed 42 --map medium`. Each `eval` is one line; `tick N` advances. World: 509 agents, 1005 locations (235 place-tier + 770 sublocations) at t0; 752 actors, 315 + 828 at t240. Control run without the hook reproduced identical t240 counts (`run-control.txt`).

Hook (tick 0): wraps `Array.prototype.push`, counts each `{targetEntityId, sphere, magnitude, source}` object once (WeakSet), keyed `source|sourceId-family|target-kind`. Cadence slices (delta per window):

```
t1-12   divine_action|ua|place 1/3 · environmental|trades|place 8/0.144
t13-24  trades 8/0.144 · notable|npc|individual 4/2.4 · notable|npc|place 4/2.4 · notable|agent|place 1/0.6 · notable|agent|individual 1/0.6
t25     environmental|lair|lair 10/80 · environmental|lair|place 3/24
t26-48  ua|place 1/3 · trades 16/0.288 · notable npc→individual 8/7.2, npc→place 8/7.2, agent→place 2/1.8, agent→individual 2/1.8
t49-50  lair 14/112
t51-75  trades 16/0.288 · notable npc→place 18/14.4, npc→individual 3/2.4, agent→place 6/4.8, npc→sub 3/2.4 · lair 14/112
t76-100 trades 16/0.288 · notable 8 events/6.0 · lair 19/152
t101-125 trades 16/0.288 · notable 18/16.2 · lair 22/176 · ua→lair 1/3 · ua→individual 1/1
t126-150 trades 16/0.288 · notable 30/24 · lair 26/208
t151-200 trades 32/0.576 · notable 30/24 · lair 57/456
t201-240 trades 32/0.576 · notable 40/30 · lair 31/248 + lair→place 1/8
TOTAL   divine_action 4 ev / 10 · environmental|trades 160 / 2.88 · environmental|lair 197 / 1576 · notable 190 / 150
        (notable targets: place 97, individual 43, sub 27, lair 23; spheres order 66, light 54, force 27, time 24, darkness 19)
t240 state: encounterProgress 0 · unifiedActions 119 · armies 0 · battles 0 · trades_with 6 · omens [null,null] · thread edges 0 · doomStage 1 (progress 0) · mandate 'setup' · controlEffects 0 · lairs 32 · rivals spirit/spirit/mind
```

t0→t240 affinity diff (hooked run, `run-hooked.txt` line 36): changed = 18 places, 12 individuals, 3 subs; new affinities = 31 lairs, 4 places, 1 individual, 28 monster factions; level-ups +42 (order +13, light +12, time +9, darkness +2.6, force +2, matter +1, mind −0.2); erosion 2.6; lair scores at t240: `entropy=9, life=9, energy=9 (+order 1, force 1), matter=9 ×4, energy=9 ×2, energy=8, matter=8 ×2, entropy=8, matter=6 ×2, energy=6 ×3, … energy=1`.

Rates: notables ≈ 0.8 events/tick, ≈ 0.63 magnitude/tick world-wide → a settlement averages 0.44 magnitude per 240 ticks (67.8 over 153 places); trade drift 0.012 magnitude/tick world-wide; lairs 6.6 magnitude/tick world-wide, all self-directed.

## The read at tick 0 / tick 240

`points_god`: showcase `{mind:3, spirit:2}` and CLI-god `{chaos:3, energy:2}` (its `sphereAlignment` primary/secondary). `power_god`: the real ascendant → `{}` (fact 1) → **every value 0 for every object under both presets at both ticks**. The tables therefore use a hypothetical power of 2 on the primary / 1 on the secondary ("pow 2/1") and power 1 everywhere ("pow 1/1"). Buckets: ≤−12 · −11..−6 · −5..−1 · 0 · 1..5 · 6..11 · ≥12. Hexes: skipped (not nodes). Actors: n=499 (t0) / 497 (t240), **all 0 in every cell** — no actor holds a preset sphere or its opposite at either tick.

**Place tier** (n=118 at t0, 153 at t240 — only nodes with an affinity):

| preset × power | tick | min | max | mean | >0 | =0 | <0 | histogram (≤−12 / −11..−6 / −5..−1 / 0 / 1..5 / 6..11 / ≥12) |
|---|---|---|---|---|---|---|---|---|
| mind/spirit × pow 2/1 | 0 | −12 | 8 | −1.92 | 33 (28.0 %) | 23 | 62 (52.5 %) | 5 / 26 / 31 / 23 / 27 / 6 / 0 |
| mind/spirit × pow 2/1 | 240 | −30 | 8 | −2.78 | 33 (21.6 %) | 43 | 77 (50.3 %) | 15 / 27 / 35 / 43 / 27 / 6 / 0 |
| mind/spirit × pow 1/1 | 0 | −6 | 5 | −1.13 | 27 (22.9 %) | 23 | 68 | 0 / 6 / 62 / 23 / 27 / 0 / 0 |
| mind/spirit × pow 1/1 | 240 | −24 | 5 | −2.01 | 27 (17.6 %) | 43 | 83 | 8 / 10 / 65 / 43 / 27 / 0 / 0 |
| chaos/energy × pow 2/1 | 0 | −12 | 6 | −3.12 | 24 (20.3 %) | 14 | 80 (67.8 %) | 10 / 38 / 32 / 14 / 21 / 3 / 0 |
| chaos/energy × pow 2/1 | 240 | −20 | 18 | −1.74 | 37 (24.2 %) | 36 | 80 (52.3 %) | 12 / 38 / 30 / 36 / 24 / 6 / 7 |
| chaos/energy × pow 1/1 | 0 | −6 | 6 | −1.39 | 33 (28.0 %) | 14 | 71 | 0 / 10 / 61 / 14 / 32 / 1 / 0 |
| chaos/energy × pow 1/1 | 240 | −11 | 18 | −0.25 | 45 (29.4 %) | 36 | 72 | 0 / 12 / 60 / 36 / 34 / 4 / 7 |

**Sublocation tier** (n=770, unchanged between ticks except 3 nodes):

| preset × power | tick | min | max | mean | >0 | =0 | <0 | histogram |
|---|---|---|---|---|---|---|---|---|
| mind/spirit × pow 2/1 | 0 & 240 | −6 | 2 | −2.51 | 127 (16.5 %) | 235 | 408 (53.0 %) | 0 / 277 / 131 / 235 / 127 / 0 / 0 |
| mind/spirit × pow 1/1 | 0 & 240 | −4 | 2 | −1.43 | 127 | 235 | 408 | 0 / 0 / 408 / 235 / 127 / 0 / 0 |
| chaos/energy × pow 2/1 | 0 | −6 | 6 | −1.73 | 141 (18.3 %) | 225 | 404 | 0 / 277 / 127 / 225 / 131 / 10 / 0 |
| chaos/energy × pow 2/1 | 240 | −18 | 6 | −1.78 | 140 | 224 | 406 | 3 / 276 / 127 / 224 / 130 / 10 / 0 |
| chaos/energy × pow 1/1 | 0 | −3 | 4 | −0.69 | 141 | 225 | 404 | 0 / 0 / 404 / 225 / 141 / 0 / 0 |

Raw JSON for every cell: `run-hooked.txt` lines 25 and 35 (mind/spirit; keys `msPow2`, `msOne`; `cliPow`/`msPow` are the real-power all-zero rows) and the diag capture above (chaos/energy; keys `cePow`, `ceOne`).

## What the numbers mean for the formula ticket (facts only)

- Evaluated literally on today's state, dominion is 0 for 100 % of objects, both ticks, both presets, because `power_god` does not exist on the ascendant node.
- With a hypothetical power (2/1): 28 % of seeded places and 16.5 % of sublocations are above zero at t0 under mind/spirit; 20 % and 18 % under chaos/energy. Roughly half of every tier is negative, 12–30 % exactly zero.
- The actor kind contributes nothing: 0 % of individuals are non-zero at t0 and 2.2 % at t240, none in a preset sphere. Any "mortals as world objects" reading of Dominion has no data behind it until mortals get seeded or pressured scores.
- The power factor is not sign-neutral across the sum: per-sphere power changes the relative weight of the two bought terms, so objects whose terms disagree flip sign — 6 of 118 places flip between pow 2/1 and pow 1/1 under mind/spirit, 9 of 118 under chaos/energy. It is a pure scale only when both bought spheres carry equal power.
- Movement over 240 headless ticks: 18 of 153 places (12 %) changed at all; the only objects that move more than one level are lairs (to 8–9). Every ≥12 / ≤−12 bucket entry at t240 is a lair. The place distribution's mean fell (−1.92 → −2.78 mind/spirit) because lairs seeded energy/matter/force.
- Sublocations outnumber places 5:1, carry hex-derived scores, and are frozen (3 of 770 changed) — an "every world object" read is dominated by a tier nothing writes to.
- Today's writers press mostly in order/light/time/matter/energy (notables + lairs); the showcase god's mind and spirit are pressed by no headless writer at all (0 mind events, 0 spirit events in 240 ticks).
- Scores are non-integer after erosion, so any band thresholds on the triangle scale meet values like 0.8.
- The `source` labels do not partition by author: `divine_action` is emitted for mortal unified actions; `doom` is also used by death-site haunting; `environmental` covers lairs, trade, omens and battles.

## Open facts not obtainable headless

- **Doom writer in a bonded world** (`?view=game&seeded`): 4 entropy on every location (both tiers) per stage crossing + card pressure 3–4 × severity on all locations in the archetype's sphere; number of stage crossings within 240 ticks not measured (clock asleep headless; `totalTicks` not read). Needs `window.__DEBUG.tick(240)` in a browser tab.
- **Mandate → ascendant pressure** (the only writer that creates the ascendant's affinity): needs a bonded First and mandate progress; never fired headless.
- **Control-effect rates under play** (1/tick per channeled sphere per sustained effect, plus rift influence): player-only.
- **Rival scheme pressure** (0.04/phase): grace-held headless; magnitude is below one triangle step over any plausible run regardless.
- **Battle aftermath** (3/6/9 in the victor faction's dominant sphere, which is `chaos` for every seeded faction because all are zero): no armies formed in 240 headless ticks.
- **Whether any browser-only path writes the ascendant's `sphereAffinity`**: no hit in `src/hooks`, `src/contexts`, `src/App.tsx`, `src/debug-bridge.ts` (the bridge only reads it), but not browser-verified.
- **Browser vs CLI world** differ (`?seeded` ≠ `--seed 42`): the t0 distributions above are for the CLI cosmology/map only.
