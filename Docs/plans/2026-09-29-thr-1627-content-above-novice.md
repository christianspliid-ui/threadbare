> **title:** Content above novice — the local offset ruling and the journeyman-to-master brief — THR-1627
> **linear_issue:** THR-1627
> **author:** Claude Code (design lane, run 2026-09-29b)
> **created:** 2026-09-29
> **three_pillars:** Engine `done — one constant, the coverage gauge, knock-on calibrations, partial re-arm of the invariant` · Content `done — a per-band, per-kind brief; seven authoring tickets filed (THR-1676…THR-1682)` · UI `N/A — no surface changes; the difficulty word already reads the authored number, which the ruling makes the rolled number`

# Content above novice — the local offset ruling and the journeyman-to-master brief — THR-1627

*Mortals now choose challenges they can win about half the time, but only novices find any. A journeyman standing in a town sees ten everyday encounters that suit them, an expert sees one, a master none. So everyone attempts the same easy things, and "what a mortal attempts grows with them" is not true yet above novice. This plan makes one rule change (a step's number means what it says), then writes the brief for the missing content, band by band and reach by reach.*

## Why this is load-bearing

The forecast-window design ([THR-1575](https://linear.app/threadbare/issue/THR-1575), plan `Docs/plans/2026-09-24-thr-1575-forecast-window.md`) shipped its dice and its choice rule on 2026-09-26 ([THR-1581](https://linear.app/threadbare/issue/THR-1581), PR #2073). The plan's tagline is *"what a mortal attempts grows with them"*. The second amendment of 2026-09-26 carved the half that needs content out into this ticket. Christian set the order on 2026-09-24: *"lets get the right long term design back on, and then we can always create more higher difficulty encounter, monster and undertaking content."*

The ticket asks for three things. First, sweep the local scale offset and rule on it. Second, brief the content per band and per kind, and file each authoring batch. Third, re-arm the demoted invariant clauses once a band has content.

**Two premises in the ticket did not survive measurement** (both measured on `origin/main` @ `4eb75754`, 2026-09-29):

1. **Local's offset is −0.10, not −0.20.** `src/engine/resolutionScaleAdjust.ts:37-42` reads `personal: -0.20, local: -0.10, regional: 0, cosmic: +0.10`. The ticket's sweep list (−0.20 · −0.10 · 0) was written against the wrong baseline. This plan sweeps −0.20 · **−0.10 (today)** · 0 · +0.10.
2. **The content gap is not only missing content: most of the harder content that exists never reaches anyone.** Of 62 encounter templates whose difficulty suits a journeyman's window, **11 fired at all** in two seeds × 120 ticks. Of 7 expert-fit templates, 2 fired. The master-fit template never fired. The unfired ones are almost all *situational*: forts, ruins and mines; guild senior and elite rungs; armies, monster lairs; rare story beats (list in the brainstorm companion). The everyday board a mortal meets in a settlement is nearly all novice:

```
$ node .cache/s1627-c3.mjs   # everyday = settlement-drawable, not guild/army/monster/fight-gated, rarity ≤ 2
everyday settlement board by window-fit band (local −0.10): {"novice":110,"journeyman":10,"expert":1,"master":0}
```

So the brief targets **everyday settlement content above novice**, not more situational content.

**Settled input — not reopened here:**

- [THR-1575](https://linear.app/threadbare/issue/THR-1575)'s dice and window. The odds are `P = ODDS_AT_PAR + ODDS_GAIN × (capability − difficulty) + …`, with `ODDS_AT_PAR = 0.40` and `ODDS_GAIN = 1.25` (`src/engine/resolutionService.ts:88,96`). The window is 0.50–0.65 (`ENGAGE_WINDOW_LOW/HIGH`, `src/data/agent-behavior-constants.ts:1319-1321`). Never a floor, never actor-scaled difficulty.
- [THR-1577](https://linear.app/threadbare/issue/THR-1577) (UL-proposal, Idea): *"Difficulty — the proficiency a step demands … A mortal whose capability equals the step's difficulty rolls at the odds-at-par."*
- Christian, 2026-09-26: success-rate bands are *"a constant we tweak as we search for a good game"*; *"follow the newer decisions."*
- The second amendment's gate table (`…forecast-window.md` § Amendment 2026-09-26 (second)): total success is gated at 0.45–0.72 on seeds 42/99/7, and the 0.50–0.65 target becomes a gate when this ticket lands. The two traps stay gated.
- The Encounter Factory is the only authoring route for new encounters (`Docs/canon/encounters.md` § factory tooling). A new batch carries Christian's 2-of-6 sample.

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4; each is open to veto): D1 the offset ruling, D2 banding content by window fit, D3 the brief's counts, D4 the staging and stop rule, D5 masters' fights left out.

## Substrate inventory

Measured 2026-09-29 against `origin/main` @ `4eb75754`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `engagement` — `engagementWindow.ts` (THR-1582): the choice rule seeks forecasts in 0.50–0.65 | 🟢 ACTIVE | **preserve**. Its constants are not touched |
| `kpi` — `kpi/engagementKpi.ts`, `kpi/kpiConstants.ts` (THR-1578): the engagement ledger, `demandedDifficultyOf`, `proficiencyBandFor` | 🟢 ACTIVE | **extends**. Adds `windowFitBandFor` and three everyday-board constants |
| Resolution scale adjust — `resolutionScaleAdjust.ts` (THR-451, THR-1581): `SCALE_DIFFICULTY_OFFSETS` read by `stepResolutionCore`, `scaledForecast`, `decisionBoard`, `playerCastReadout`, `engagementKpi` | 🟢 ACTIVE | **extends** (one value). 13 importers under `src/` |
| Coverage gauge — `scripts/measure-roll-spread.ts` `coverage()` (THR-1578) | 🟢 ACTIVE (script) | **extends**. Window-fit banding and the everyday-board table |
| Encounter Factory — `encounter-pipeline`, `draw:packet`, `compile:encounter`, `check:encounter` (THR-1043, 1245, 1246) | 🟢 ACTIVE | **consumed** by S2–S7; unchanged |
| Opponent cards — `fights/opponentCard.ts` `readOpponentCard` (monster `monsterState.dread/might`) | 🟢 ACTIVE | **consumed** by the monster-elite ticket; unchanged |

## The offset sweep (Done-when 1)

`npm run gameplay-report` and `npm run measure:roll-spread`, seeds 42/99/7/11/23 × 120 ticks, medium, with `SCALE_DIFFICULTY_OFFSETS.local` overridden per run. The override was a scratch wrapper that sets the exported constant before the report module loads. It is not committed; the executor reproduces the chosen column by editing the constant. 98% of rolls are local scale (seed 42: 1090 of 1112; personal 6, regional 10, cosmic 6).

| local offset | total success by seed (42 · 99 · 7 · 11 · 23) | novice | journeyman | expert | master | in-window | trend > 0 |
|---|---|---|---|---|---|---|---|
| −0.20 | 80 · 76 · 79 · 73 · 70 | 64% · d −0.03 · n 1220 | 70% · d −0.01 · n 608 | 68% · d −0.04 · n 329 | 76% · d −0.00 · n 251 | 40% | 4/5 |
| **−0.10 (today)** | 71 · 68 · **75** · 74 · 66 | 61% · d 0.05 · n 1151 | 65% · d 0.08 · n 656 | 70% · d 0.05 · n 327 | 70% · d 0.08 · n 233 | 39% | 4/5 |
| **0 (ruled)** | 57 · 59 · 66 · 62 · 65 | 57% · d 0.11 · n 1175 | 61% · d 0.16 · n 872 | 65% · d 0.13 · n 389 | 67% · d 0.15 · n 304 | **46%** | **5/5** |
| +0.10 | 55 · 59 · 61 · 57 · 61 | 56% · d 0.18 · n 977 | 59% · d 0.24 · n 925 | 63% · d 0.21 · n 446 | 65% · d 0.25 · n 359 | 39% | 5/5 |

*Band cells: success (free-choice engagements) · mean attempted difficulty · engagements, pooled over the five seeds. In-window is pooled over free-choice commits.*

Other gated measures, per seed, today vs ruled:

| Measure (gate) | local −0.10 (42 · 99 · 7 · 11 · 23) | local 0 |
|---|---|---|
| total success ≤ 0.72 on 42/99/7 | 0.71 · 0.68 · **0.75 ✗** · 0.74 · 0.66 | 0.57 · 0.59 · 0.66 · 0.62 · 0.65 |
| failure-streak p95 ≤ 4 (`KPI_FAILURE_STREAK_P95_MAX`) | 4 · **5 ✗** · **5 ✗** · 4 · 5 | 4 · 4 · 4 · 5 · 6 |
| crit failure ≤ 0.15 | 5.5 · 7.2 · 5.3 · 3.1 · 7.5% | 6.8 · 8.6 · 6.5 · 8.2 · 10.3% |
| failure → story ≥ 0.90 | 1.00 everywhere | 1.00 everywhere |
| retry after failure ≤ 0.10 | 0.0 everywhere | 0.0 everywhere |
| idle rate | 0.0 everywhere | 0.0 everywhere |
| floor-pinned rolls ≤ 0.05 | 0.2% | 0.8% |
| at-cost share (reported only) | 18–26% | 17–21% |

Success by the roller's raw score still spreads at 0: raw < 10 succeeds 26%, 10–20 58%, 20–30 72%, 30–40 83%, ≥ 60 93% (`measure:roll-spread`, all seeds).

### D1 — Ruling: local's offset goes to 0

**Decision.** `SCALE_DIFFICULTY_OFFSETS.local` becomes `0`. `personal` (−0.20) and `cosmic` (+0.10) stay; together they are under 1.5% of rolls, and this ticket measured only local.

**Why.**

- **It makes the definition true.** Under THR-1577 a step's difficulty *is* the proficiency it demands, and a mortal exactly that able rolls at par. With −0.10, every local step demanded 0.10 less than its author wrote. The number an author picks, and the word the player reads, were not the number the dice rolled against. `difficultyWord` reads the authored number (`buildNudgePhaseModel.ts:702-704,937`), while the roll subtracts the offset (`forecastActionAtScale`). At 0, the word and the roll agree.
- **It is the best column on the measures the window design owns.** In-window share is highest (46% vs 39–40%). The difficulty trend is positive on every seed. Every band's pooled success sits inside the level range (0.45–0.70).
- **It brings today's `main` back inside its own gates.** At −0.10, seed 7 runs 0.75 total success against the 0.72 ceiling, and the failure-streak p95 is 5 on seeds 99 and 7 against a cap of 4. At 0, all three gate seeds pass both.
- **It lands total success inside Christian's 0.50–0.65 target** on four of five seeds (seed 7 at 0.66). Today it sits at 0.66–0.75.

**What it costs, in game terms.** The world gets harder by about nine points: roughly one ordinary attempt in eight that succeeds today will fail. Weak mortals feel it most (raw < 10: 36% → 26%). Crit failures rise about two points and stay far under their 0.15 cap. Every failure still leaves a story (1.00).

**Options weighed.**
- *Keep −0.10.* It is the only column that misses gates on today's seeds, and it keeps the word/roll mismatch.
- *−0.20.* Easier still (70–80% success). It moves the wrong way.
- *+0.10.* Success is similar to 0, but in-window share falls back to 39%, and 2.3% of rolls pin on the floor.
- *Change `personal` and `cosmic` too, for the same principle.* Not measured here. They are under 1.5% of rolls, so the principle is noted for a later pass rather than ruled blind.

**Would change the call:** a playtest where ordinary life reads as grinding failure, or Christian preferring the easier world. Either way the lever is one constant.

**Why not reserved:** it is gate calibration and the *how* of an agreed design (rule 4), and it moves success *into* Christian's own target band.

### D2 — Band content by the window it fits, not by par

The coverage gauge (`measure-roll-spread.ts` `coverage()`) bands a template by `proficiencyBandFor(demanded)`, the capability that meets it **at par** (40%). Mortals do not choose at par. They choose at 50–65%, which is capability ≈ demanded + **0.14**: `((ENGAGE_WINDOW_LOW + ENGAGE_WINDOW_HIGH)/2 − ODDS_AT_PAR) / ODDS_GAIN = (0.575 − 0.40) / 1.25 = 0.14`. So the gauge undercounts the band a template actually serves by about half a band. On today's catalogue the difference is 234/41/1/1 at par vs 207/62/7/1 by window fit.

**Decision.** The gauge bands by window fit. The gap is **derived** from the three existing constants, never a new magic number. The at-par line stays printed as a second row for continuity with THR-1578's baseline. This is a measuring decision only; no engine path reads it.

**Vocabulary.** "Window fit" and "everyday board" are **KPI-internal labels**, like the proficiency band names (which THR-1577 keeps out of the UL for the same reason). They name a measurement in a script and in authoring guidance, never a thing the player sees or a node in the world. No UL-proposal is filed. If a player-facing surface ever renders either, a UL-proposal is owed then.

## Engine pillar

### Systems design

No new system. One constant, one KPI helper, one script change, and the knock-on calibrations that read the offset.

**S1 (this ticket, THR-1627) — the ruling lands:**

1. `SCALE_DIFFICULTY_OFFSETS.local`: `-0.10` → `0` (`src/engine/resolutionScaleAdjust.ts`). The header table and the doc comment say why, cite this plan, and drop the stale rationale line (*"~35% on local"*).
2. `src/engine/kpi/engagementKpi.ts`: add `windowFitGap()` (derived as above) and `windowFitBandFor(demanded)`. Leave `proficiencyBandFor` unchanged: the ledger bands *mortals* by capability, which is correct.
3. `scripts/measure-roll-spread.ts` `coverage()`:
   - band templates, cells and monster families by `windowFitBandFor`, keeping the at-par row;
   - add an **everyday settlement board** table: encounter templates that are drawable at a settlement subtype (`hamlet · village · town · city · capital`), with rarity ≤ 2, not `drawable: false`, and not in the guild, army, monster, fight or confront families;
   - print that table by window-fit band × primary reach (the most common step reach).

   This table is the brief's scoreboard. Each authoring ticket re-reads it.
4. **Knock-on calibrations.** Each reads the local offset. Re-measure, and change a value only if its own stated purpose now fails. Never tune a value to hit a KPI.

   | Constant or test | Its purpose | What to do |
   |---|---|---|
   | `MEETING_TEST_CAPABILITY` (0.42, `src/data/meeting-nudge-constants.ts:227`) | The meeting's mid-difficulty step reads *uncertain* | Re-check the tier the step reads. Re-set only if it no longer reads *uncertain* |
   | `DEV_TEST_AVATAR_REACH_RAW` (14, `src/engine/debugEncounterTools.ts:626`) | A `fair` step forecasts *uncertain* for the `?spawn=` test avatar | Re-check. Re-set only if it no longer reads *uncertain* |
   | `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) | Headroom for off-reach nudges | Re-run `npm run measure:nudge-headroom`, then record the result |
   | `stepResolutionGolden.test.ts` | Pins resolution | The `probability` column changes on local rows; the `roll` column **must not** |
   | `resolutionScaleAdjust.test.ts` | Pins the offsets | Update `'local is negative'` and `'applies -0.10 offset'` to the ruled value. Keep the personal and cosmic cases |
   | `playerCastBalance.test.ts`, `playerCastReadout.test.ts` | A cast never outright fails, and its band spread | Re-baseline. A cast is still raised to at-cost at worst |
   | `engagementKpi.test.ts` | Demanded difficulty | Re-baseline local cases; add `windowFitBandFor` cases |
   | Fight and duel calibration | Unaffected | `FIGHT_STEP_SCALE` is `regional` (offset 0). Assert that no fight row moved |

5. **Re-arm what passes** (the invariant's third Done-when, in part). In `engagementWindow.invariant.test.ts`, split the skipped test so that the **level-success clause runs live for every band that is covered and inside the range on both seeds 42 and 99**. Measured at local 0: novice 59/56, journeyman 59/64, expert 50/68 (all inside 0.45–0.70); master 74/59 (seed 42 outside). The mean-attempted-difficulty rise and the in-window share stay `it.skip` with `// TODO(THR-1676)`: at 0 the means are 0.11 / 0.15 / 0.11 / 0.13 on seed 42, which do not rise, and in-window is 48%. Content has to move those. If the executor's run puts a band outside the range, that band stays skipped; it is **not** a stop, and nothing is tuned to pass it.
6. **Total-success gate.** It stays 0.45–0.72 on 42/99/7 (measured at 0: 0.57 · 0.59 · 0.66). The 0.50–0.65 target is promoted to the gate by the **last** authoring ticket, as the second amendment says ("when THR-1627 lands"). It does not happen here, because seed 7 sits at 0.66.

**S2–S7 are content**, one Encounter Factory batch or monster-card run each; see § Content pillar.

### Graph nodes / edges

None.

### Tick phases

None change. The offset is read at the caller boundary of every step roll (`stepResolutionCore` via `applyScaleDifficultyAdjust`), by the planner's forecast (`decisionBoard.ts`, `scaledForecast.ts`) and by the KPI stamp (`demandedDifficultyOf`). All of these already read the same constant, so the change lands everywhere at once. That is the THR-1535 parity (odds shown = odds rolled), preserved.

### Resolution logic

Unchanged formula; one input constant.

### PRNG callouts

None. No new draw. The golden test's `roll` column must be byte-identical.

## Content pillar

### D3 — The brief

Scoreboard after S1 (local 0). This is the everyday settlement board, by window-fit band and primary reach:

```
$ LOCAL_OFFSET=0 node .cache/s1627-c3.mjs
everyday settlement board by window-fit band: {"novice":98,"journeyman":22,"expert":1,"master":0}
eye    {"novice":15,"journeyman":9,"expert":0,"master":0}
gold   {"novice":21,"journeyman":1,"expert":0,"master":0}
heart  {"novice":19,"journeyman":5,"expert":0,"master":0}
iron   {"novice":11,"journeyman":2,"expert":1,"master":0}
shadow {"novice":12,"journeyman":2,"expert":0,"master":0}
star   {"novice":7,"journeyman":0,"expert":0,"master":0}
stone  {"novice":7,"journeyman":1,"expert":0,"master":0}
veil   {"novice":6,"journeyman":2,"expert":0,"master":0}
```

A mortal's band is its capability **on the template's reach**, so coverage is per reach. A journeyman at Gold has one everyday choice in the whole catalogue.

**Floors per band, each on every reach:** journeyman **3**, expert **2**, master **1**. They shrink with the band's share of engagements: pooled at local 0, novice 43%, journeyman 32%, expert 14%, master 11%. They are floors for "a mortal of this band usually has something that suits them", not parity with novices (parity would be about 200 encounters). The gauge decides whether they suffice.

**Authored step difficulty per band** (mean over the template's rolled steps; local scale; window fit = difficulty + 0.14):

| Band | Capability | Author the mean step difficulty at | Difficulty word it reads |
|---|---|---|---|
| journeyman | 0.35–0.65 | **0.35–0.50** | fair / steep |
| expert | 0.65–0.85 | **0.55–0.70** | steep / severe |
| master | ≥ 0.85 | **0.72–0.85** | severe |

**The count, per kind:**

| Kind | Journeyman | Expert | Master | Why |
|---|---|---|---|---|
| **Everyday encounters** (settlement-drawable, open) | **+12**: star 3, gold 2, stone 2, iron 1, shadow 1, veil 1, plus 2 flex on the reaches the gauge shows thinnest at the time | **+16**: 2 per reach (the one existing iron expert counts toward iron's floor, so 1 flex) | **+8**: 1 per reach | Brings every reach to the floor |
| **Monster cards** | 0 — all 8 families rate fair/steep, window fit 0.565 | **+2**: elite cards rated *severe* dread and *severe* might (window fit 0.79) | 0 — see D5 | Monsters carry their own ratings in `monsterState` (`readOpponentCard`, `src/engine/fights/opponentCard.ts:122`) |
| **Undertaking cells** | 0 | 0 | 0 | Checkpoints resolve at regional (offset 0) at 0.40–0.60, window fit 0.54–0.74. The 37 cells at 0.40–0.50 serve journeymen and the 25 at 0.55–0.60 serve experts. Masters: revisit after the master batch's re-measure |

**Total: 36 encounters across six factory tickets (S2–S7), plus one monster-card ticket.**

### D4 — Staging, batches and the stop rule

| Ticket | Batch | Reaches | Blocked by |
|---|---|---|---|
| S2 — [THR-1676](https://linear.app/threadbare/issue/THR-1676) Journeyman everyday, batch 1 | 6 | star ×3, gold ×2, stone ×1 | THR-1627 |
| S3 — [THR-1677](https://linear.app/threadbare/issue/THR-1677) Journeyman everyday, batch 2 | 6 | stone, iron, shadow, veil ×1; 2 flex | THR-1676 |
| S4 — [THR-1678](https://linear.app/threadbare/issue/THR-1678) Expert everyday, batch 1 | 6 | 6 of the 8 reaches (skip the two the gauge shows best-served), ×1 | THR-1677 |
| S5 — [THR-1679](https://linear.app/threadbare/issue/THR-1679) Expert everyday, batch 2 | 6 | the other 2 reaches ×2, and 2 more toward 2 per reach | THR-1678 |
| S6 — [THR-1680](https://linear.app/threadbare/issue/THR-1680) Expert everyday, batch 3 | 4 | whatever still sits under the expert floor | THR-1679 |
| S7 — [THR-1681](https://linear.app/threadbare/issue/THR-1681) Master everyday | 8 (one batch of 6 + 2, or two of 4) | 1 per reach | THR-1680 |
| [THR-1682](https://linear.app/threadbare/issue/THR-1682) Monster elites | 2 cards | — | THR-1627 |

*All seven are filed in Todo, unassigned, with their `Blocked by` relations and a coordination block as the first comment; the orchestrator promotes each as its blocker lands.*

*S6 exists because 16 does not divide into sixes.*

- **Each ticket's first step is the gauge**: `npm run measure:roll-spread` (the everyday table) and `npm run gameplay-report -- --seeds 42,99,7`. **Stop rule:** if every reach already meets the band's floor, the band's invariant clauses pass on 42 and 99, *and* the band's mean attempted difficulty sits above the band below it, the ticket closes as not needed, with the numbers in the comment. Counts are ceilings the gauge may undercut, never quotas.
- **Each ticket's last step is the re-arm**: un-skip that band's clauses in the invariant, if they pass. S7 also un-skips the in-window clause if it reaches `KPI_IN_WINDOW_MIN`, and promotes the 0.50–0.65 total-success target to the gate if 42/99/7 pass it.
- **Batches run sequentially within a band, and bands in order**, so each re-measure sees the last batch's effect. That is Rule 1–3's finish-before-start inside the brief.
- **Every batch goes through the factory line** (`encounter-pipeline`, `draw:packet`, `compile:encounter`, `check:encounter`), with Christian's 2-of-6 sample. The brief supplies each slot's **reach, band and step-difficulty range**. That is the "game design first" mechanical fix. Everything else (verb, premise, cast, payoff) is the factory's.
- **Everyday means where mortals stand.** Author for the settlement subtypes: a journeyman's barter is a merchant house in a town, not a peddler at a hamlet. Put the higher stakes in the fiction (who is across the table, what is at risk), never in a rule gate. A rule gate would re-create the situational problem this brief exists to fix.

### D5 — Masters' fights are out of scope

The highest fight rating, *severe*, is `FIGHT_RATING_DIFFICULTY.severe = 0.65` (`src/data/fight-constants.ts`). Its window fit is 0.79, which is expert. **No monster card can reach a master's window under the four rating words.** Fixing that means re-rating *severe* or adding a word. That touches the fight block's calibration and its own kill criterion (THR-1531 rows; the second amendment's decision 3: *"masters meet their match in severe elites and in THR-1627's content, not in a re-rated steep"*). So a master's fights read *too easy* by design for now, and masters find their window in encounters. The note is kept here so a fight-calibration pass finds it.

### Canon edit (S1)

`Docs/canon/encounters.md` § "Picking a step's `difficulty`" says *"expect mortals of that level to engage it at about even odds."* That is only half right. A mortal exactly that able faces the step at par (*uncertain*, about 40%). The mortals who choose it stand about 0.14 above it. Replace the sentence with that, and add the table of per-band authored-difficulty ranges above. Point readers at the everyday-board table as the coverage scoreboard. The rulebook's `[IMPL — THR-1581; the journeyman-and-up half waits on content, THR-1627]` tag (`Docs/canon/rulebook-quick-reference.md` § Resolution) stays until S7.

### Prose tables · Attachment content · Data tables

N/A for S1. S2–S7 author through the factory package format; no new tables.

## UI pillar

UI: N/A — no component, hook, context or style changes. The ruling makes the difficulty word the player reads (`difficultyWord(effectiveDifficulty)`, `buildNudgePhaseModel.ts:937`) name the difficulty the dice actually roll against. Today the word reads the authored number and the roll subtracts 0.10. The forecast tier word is computed from `forecastActionAtScale` and moves with the odds, as designed. No new signifier.

*Screenshot tool:* none required. S1 is engine and scripts; the closing commit carries `Browser-verify exempt: no file under src/components, src/hooks, src/contexts or index.css`. Factory batches carry the factory's own live-proof, which includes its browser step.

UI Laws engaged: Law 1 (no numbers on the mortal-facing surface) is preserved; the words only get more truthful.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `resolutionScaleAdjust.ts` (constant) | every step roll (existing) | encounter stage forecast (existing, unchanged) | — | `resolution.input.scaleOffsetApplied` (existing) now reads `0` for local | `measure:roll-spread` per-scale line |
| `engagementKpi.ts` `windowFitBandFor` | none (KPI helper) | none | — | none | `measure:roll-spread` coverage tables |
| `measure-roll-spread.ts` everyday table | script | none | — | none | stdout |

Player controls: unchanged. Prose pipeline: unchanged. `Docs/plans/wiring-checklist.md` gains no row: no new module is called from the orchestrator, and the one new helper is KPI-internal.

## Interface impact

| Contract (interface map) | Impact | Detail |
|---|---|---|
| The `SCALE_DIFFICULTY_OFFSETS` row in `scripts/interface-contracts.ts` | **preserve** | Same producer (the constant) and the same consumers (resolver, planner forecast, KPI stamp, cast readout). One value changes. The executor checks the row's evidence text for a quoted `-0.10` and updates it |
| Forecast parity (THR-1535: odds shown = odds rolled) | **preserve** | Both sides read the same constant |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `SCALE_DIFFICULTY_OFFSETS.local` | **`0`** (was −0.10) | Local steps demand the proficiency their authors wrote (D1) |
| `windowFitGap()` | derived: `((ENGAGE_WINDOW_LOW + ENGAGE_WINDOW_HIGH)/2 − ODDS_AT_PAR) / ODDS_GAIN` = 0.14 | Capability above a step's difficulty at which mortals choose it (D2). Derived, so it follows any retune of the window or the odds |
| `EVERYDAY_FLOOR_BY_BAND` (`src/engine/kpi/kpiConstants.ts`) | `{ journeyman: 3, expert: 2, master: 1 }` | Per-reach floors the stop rule reads (D3/D4) |
| `EVERYDAY_SETTLEMENT_SUBTYPES` (`kpiConstants.ts`) | `['hamlet','village','town','city','capital']` | What counts as the everyday board |
| `EVERYDAY_MAX_RARITY_TIER` (`kpiConstants.ts`) | `2` | Rarer templates are story beats, not everyday |

The authored-difficulty ranges per band (D3) are **authoring guidance in canon**, not engine constants. Nothing reads them at runtime.

## Tracing

N/A — no new trace type. `ResolutionInputTrace.scaleOffsetApplied` (`src/types/trace.ts:5880`) already records the applied offset per roll, which is how the sweep's per-scale line reads it. The KPI gauge is the inspection surface.

## Fail-soft table

| Failure | Fallback |
|---|---|
| A template with no rollable step | `demandedDifficultyOf` returns NaN; `windowFitBandFor` skips it (existing behaviour) |
| A template with no step reach | Counted under `?` in the everyday table, never dropped silently |
| An ascendant or fight step at a scale other than local | Unaffected by D1: the offset is per scale |
| A knock-on calibration's purpose fails at the new offset | Re-set that one constant to its stated purpose, record old and new in its doc comment; never re-tune the offset to save it |
| The executor's invariant run puts a band outside the level range | That band stays `it.skip` with its TODO. Not a stop |

## Three-pillar check

- [x] Engine pillar present: one constant, one KPI helper, one script table, knock-on calibrations, partial re-arm (numbered in § Systems design)
- [x] Content pillar present: a 36-encounter brief over six factory tickets plus two monster cards, filed as seven tickets (THR-1676…THR-1682) with a stop rule, and a canon authoring edit
- [x] UI pillar present as N/A with rationale: the word/roll agreement is a correctness gain with no code change
- [x] Wiring section connects them: no orchestrator module added; the constant's existing consumers are listed

## Vision audit

The forecast-window plan's tagline is *"what a mortal attempts grows with them"*. Its Vision audit (second amendment) disclosed that the tagline is not delivered above novice and deferred it here. This plan is the delivery path: D1 is the cheap half and the brief is the rest.

- **`Vision/00-north-star.md`** — the outcome is partly in the player's hands and partly not. Held: the god still bends odds, and mortals still choose their own challenges. Mortals who attempt harder things as they grow make "the people I've watched choose" more legible. A harder world (about nine points less success) makes a success something the player notices, and it moves toward Christian's own target band, not away from it.
- **`Vision/02-non-negotiables.md`** — mechanics surface through prose, never numbers: held, since the difficulty word only gets more truthful. Narrative over mechanical perfection: held, with a note. D1 cites gate numbers, but the kill criterion is a playtest that reads as grinding, and nothing is tuned to hit a KPI. Stakes for higher bands live in the fiction (D4).
- **Rules of play, not Vision** (`Docs/canon/rulebook-quick-reference.md` § Resolution): *failure never costs reach* is untouched. *Every failure leaves a story artifact* is measured at 1.00. *Long odds are the god's to impose* is untouched, because the window still refuses under 0.30.

- [x] This plan does not contradict any Vision premise (north star and non-negotiables above are each held)
- [x] No Vision edit is needed; the parent's disclosed gap is what this plan delivers

## Rulebook impact

- `Docs/canon/rulebook.md` §7: if the text states or implies a local easing, align it with "a step demands what its author wrote". The executor greps for "local" in §7.
- `Docs/canon/rulebook-quick-reference.md`: no change until S7 retires the `[IMPL …, THR-1627]` half-tag.

- [x] This plan changes a rule of play only in calibration: a local step now demands what its author wrote (no new rule)
- [x] `Docs/canon/rulebook.md` §7 is checked in S1, and the quick reference's half-tag is retired by S7

## NFP-compliance table

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | One constant moves. The fit gap is derived from existing constants. The floors, subtypes and rarity cap are named |
| 2. Inspectability | PASS | The sweep is reproducible from two scripts. The everyday-board table makes coverage visible per reach. The per-roll offset is already traced |
| 3. Determinism | PASS | No new draw. The golden `roll` column is pinned byte-identical |
| 4. Fail-soft | PASS | Five-row table; NaN and missing reach handled; calibrations re-set only to their own purpose |
| 5. Narrative over mechanical | PASS | Stakes of higher-band content live in the fiction, not in rule gates (D4) |
| 6. Additive over destructive | PASS with note | One value changes (deliberate, measured). The KPI helper and script table are additive; the at-par row is kept |
| 7. Performance budget | PASS | No runtime cost: a constant and script-only code |

## Done when

**S1 (THR-1627):**
- [ ] `SCALE_DIFFICULTY_OFFSETS.local === 0`, with the doc comment citing this plan
- [ ] `npm run measure:roll-spread -- --seeds 42,99,7` prints the window-fit coverage row, the at-par row and the everyday-board table by reach. The closeout pastes the everyday table
- [ ] `npm run gameplay-report -- --seeds 42,99,7`: total success within 0.45–0.72 on each seed; failure-streak p95 ≤ 4 on each; crit failure ≤ 0.15; failure → story ≥ 0.90. The closeout pastes the numbers beside this plan's column
- [ ] Knock-on table: each row re-checked; any changed constant has its old and new values in its doc comment; golden `roll` column unchanged
- [ ] Invariant: the level-success clause runs live for every band inside the range on both 42 and 99; the rise and in-window clauses stay skipped with `// TODO(THR-1676)`
- [ ] Canon: `encounters.md` difficulty paragraph and per-band table updated; `rulebook.md` §7 checked
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` and a 30-tick CLI smoke pass; wiki pages whose `sources` match are updated (or `Wiki-freshness-exempt:` with reason)
- [ ] The closing commit body carries the close keyword for THR-1627 on its own line

**S2–S7 and the monster elites** carry their own Done-whens on their tickets: gauge first, factory line, gauge after, re-arm.

## Kill criteria

- **The ruled world reads as grinding** (cold playtest or Christian): ordinary life feels like failure → set local to −0.05 (the midpoint; unmeasured, so re-run the sweep's two commands first). The brief is unchanged: it is authored in demanded terms, and the fit gap re-derives.
- **After S3, the journeyman band's mean attempted difficulty still does not exceed the novice band's on 42 and 99**, although every reach meets the floor → the problem is the board, not the count (draw weights, subtype gating, or the too-easy fit). Stop authoring and re-plan on this ticket before S4. Do not raise the floors.
- **In-window share stays under 0.50 after S7** → the window's too-easy fit or the board size, not content. Report and re-plan.

## Coordination block

**Suggested model:** opus. The constant is one line, but the knock-on re-checks need judgement about each constant's stated purpose, and the invariant split needs care.

**Parallel-safe with:** [THR-1666](https://linear.app/threadbare/issue/THR-1666) (afterimages and hands on existing encounters: content files, not resolution constants or the KPI); [THR-1670](https://linear.app/threadbare/issue/THR-1670) (cast in the scene: its threshold reads the pre-card probability, which moves with the offset. The threshold is a constant it owns, so no file collision); [THR-1674](https://linear.app/threadbare/issue/THR-1674) (journey goal: movement code).

**Mutex with:** any ticket editing `src/engine/resolutionScaleAdjust.ts`, `src/engine/kpi/`, `src/engine/__tests__/engagementWindow.invariant.test.ts` or `stepResolutionGolden.test.ts` (the constant, the gauge, the invariant, the golden). None is open at authoring time; re-check at claim.

**Files to touch:** (S1; S2–S7 and the monster elites list theirs on their tickets)
- Edit: `src/engine/resolutionScaleAdjust.ts`; `src/engine/kpi/engagementKpi.ts`; `src/engine/kpi/kpiConstants.ts`; `scripts/measure-roll-spread.ts`
- Edit (tests): `resolutionScaleAdjust.test.ts`, `engagementKpi.test.ts`, `stepResolutionGolden.test.ts`, `engagementWindow.invariant.test.ts`, `playerCastBalance.test.ts`, `playerCastReadout.test.ts`
- Possibly edit: `src/data/meeting-nudge-constants.ts`, `src/engine/debugEncounterTools.ts`, `src/data/content-eval/nudgeAuthoringConstants.ts` (only if their purpose fails)
- Edit (docs): `Docs/canon/encounters.md`; `Docs/canon/rulebook.md` if §7 needs it; `scripts/interface-contracts.ts` evidence text if it quotes −0.10

## Notes for the executor

- **Reproduce the ruled column before trusting it.** Edit the constant and run the two commands from the Done-when. Worldgen moves weekly, and this plan's numbers are from `4eb75754`.
- **Do not re-tune `ODDS_AT_PAR`, `ODDS_GAIN` or the window to rescue a gate.** The offset is the only lever this ticket moves.
- **The ticket body says local was −0.20.** It was −0.10; this plan supersedes that line.
- **The at-par coverage row is not wrong, only not what the brief reads.** Keep it.

> Brainstorm companion: `Docs/plans/2026-09-29-thr-1627-content-above-novice-brainstorm.md`

## Intent-judge verdict

*2026-09-29, judged on fable, cold context; proposal at `Docs/plans/.intent-proposals/2026-09-29-thr-1627-content-above-novice.md`.*

**Allow.** The judge verified the −0.10 baseline at `resolutionScaleAdjust.ts:39` and the word/roll claim at `buildNudgePhaseModel.ts:702-704`. It corrected the impact class from High-risk (inherited) to **Reversible**: one constant, one-line revert, no load-bearing change. It noted that the verdict is the same under either class, because the proposal's sign-off lines are the sanctioned delegation for gate calibration. It raised two GAPs, both fixed before this PR:
- **Dimension 2:** the header claimed the authoring tickets were filed before they existed, and the S1 TODO needed a real id. Fixed: THR-1676…THR-1682 were filed with `Blocked by` relations and coordination blocks, and the D4 table and the TODO now name them.
- **Dimension 6:** "everyday board" and "window fit" were coined without a UL note. Fixed: both are recorded as KPI-internal labels, in § D2 *Vocabulary*.

The judge also flagged a one-line drift (`trace.ts:5879` → `5880`, fixed). Its advisory is that the D1 veto invitation must reach Christian through the lane report. It does, under *Decided for you*.

## Forked-audit verdicts

**NFP audit: PASS-with-notes.** All seven NFPs pass. Notes:
- *Inspectability:* the sweep's override wrapper is not committed. It is reproduced by editing the constant, and the plan says so.
- *Additive:* the one-value change is deliberate and moves knock-on tests. Each is listed in the S1 knock-on table.

**Three-pillar audit: REVISE, then PASS.** The first pass found no `## Substrate inventory`. It was added, with six rows, each marked extends, preserve or consumed. The re-run passed. It cross-checked `engagement`, `kpi` and the resolution scale adjust against the systems inventory and found no green-field duplication. Content is substantive and UI is N/A with rationale.

**Vision audit: PASS-with-notes.** No contradictions. Notes:
- D1 leans on gate numbers, against "narrative over mechanical perfection". This is answered by the playtest kill criterion and the never-tune rule.
- Two cited rules come from the rulebook, not `Vision/02-non-negotiables.md`. The Vision audit section now attributes them correctly and cites the Vision files by path.
