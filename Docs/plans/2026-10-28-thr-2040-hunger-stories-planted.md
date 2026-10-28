> **title:** Hunger's stories are planted — a town's famine or glut seeds one of its scenes for a resident — THR-2040 (re-plan)
> **linear_issue:** THR-2040
> **author:** Claude Code (design lane, run 2026-10-27e, unattended)
> **created:** 2026-10-28
> **supersedes:** `Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws.md` (its engine pillar; its reading of famine and glut and its rows stand)
> **three_pillars:** Engine done · Content done (seed rows from the first plan's table) · UI N/A (no component changes; debug seed label and trace only)

# Hunger's stories are planted — THR-2040 re-plan

*When a town goes hungry, one of its people is handed a hunger story; when its granaries overflow, a plenty story.*

## Why this is load-bearing

The [first plan](2026-10-25-thr-2040-famine-and-glut-draws.md) leaned the encounter score. The pickup built it, and the census failed at both weights ([pickup record, 2026-10-26](https://linear.app/threadbare/issue/THR-2040)). This run measured where the scenes are lost, then tried the strongest lean the game already uses. Both are on [`proto/thr-2040-pool-presence`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2040-pool-presence), never merged, on `main` @ 1dd9143f, seeds 42/99/7/1/2/3 × 360 ticks, medium.

**1. Where the famine scenes drop out** (`_scratch-2040-stages.ts`). These are decisions by mortals standing in a settlement. Each cell is the share where any of the 8 famine rows is present:

| decisions in | n | every filter but the cap | after the 40-slot cap | drawable | top-5 shortlist | board winner |
|---|---|---|---|---|---|---|
| hungry towns | 233 | 100 % | 79.4 % | 75.1 % | **24.9 %** | **8.2 %** |
| fed towns | 6,342 | 100 % | 81.8 % | 78.3 % | 20.3 % | 4.8 % |

The scenes are in the pool. They lose at the shortlist (the best famine row ranks 8th, median) and at the board.

**2. A lean strong enough to matter does not move it** (`_scratch-2040-scene.ts`). The prototype used a multiplicative pull in the THR-2068 `applyFirstPathPull` shape: it scaled `finalScore`, re-ranked the shortlist, and multiplied again on the board, at weight 0.75 (up to ×1.75), with the first plan's 18 rows. Classified by the scene's own settlement:

| | pull off | pull on |
|---|---|---|
| famine rows' share of shortlisted scenes in hungry towns | 5.0 % (61 / 1,226) | 5.3 % (125 / 2,345) |
| famine rows' share of winners in hungry towns | 8.9 % (20 / 225) | 5.4 % (22 / 404) |
| plenty rows' share of winners in glutted towns | 5.0 % (198 / 3,958) | 6.0 % (212 / 3,525) |
| famine-row candidates in hungry towns carrying the pull | 0 % | 99.7 % |

The pull reached nearly every famine row and barely moved anything. Encounter scores here spread over orders of magnitude (the 5th-to-famine ratio has a p75 of ×3.8), so a lean of ×1.4 reorders almost nothing. Any lean large enough to work would swamp every other reason a mortal has for a choice.

**3. Planting the scene does move it** (`_scratch-2040-seed.ts`, the same plumbing the granary riot uses). The census is the first plan's: firings by mortals standing in the town.

The prototype plants on a town's 2nd hungry day and on a glut run's first day, with a 10-day cooldown, picking from the first plan's positive rows. Off and on arms ran on the same six seeds:

| | seeds off | seeds on |
|---|---|---|
| **hungry spells (≥ 2 days) in which someone in the town plays a famine scene** | **22.2 % (10 / 45)** | **66.0 % (35 / 53)** |
| **glut runs in which someone in the town plays a plenty scene** | **43.0 % (43 / 100)** | **73.7 % (73 / 99)** |
| famine rows' share of firings in hungry towns | 7.0 % (21 / 302) | 8.3 % (64 / 769) |
| plenty rows' share of firings in glutted towns | 4.5 % (201 / 4,419) | 5.5 % (200 / 3,616) |
| famine / plenty share in fed towns | 4.8 % / 3.2 % | 4.5 % / 3.2 % |
| seeds planted / taken up by their target | — | 132 / 90 (68 %); 7 famine triggers found no resident |

The player-facing question is whether a hungry town tells a hunger story while it is hungry. Seeding triples that, and leaves fed towns alone. Its effect on the overall share is small by design: it adds one story per spell rather than tilting every choice.

## Decisions this plan builds on

**Decided by delegation in this re-plan (design lane, 2026-10-28; veto in chat):**

1. **Famine and glut plant a story; they do not lean the score.** On a town's second hungry day, one resident is handed a famine scene that suits the town. On the day a glut sets in, one resident is handed a plenty scene. Each town plants at most one every 10 days. This is the granary riot's mechanism (THR-1934, `unrestPressure.ts` § Lawless), not a new one. *Why:* measured above. A lean is either invisible or overwhelming. A seed is one scene, in the right town, at the right time. *Veto:* "famine should only make hunger stories likelier, not hand one out", or "once per famine is too often / too rare" (a number).
2. **The first plan's score term and board pull are dropped**, and so is the prototype's pull. Nothing in scoring or on the board changes. This removes the larder from [the board reads the place](https://linear.app/threadbare/issue/THR-2071)'s concerns entirely, so that plan needs no edit.
3. **"Fairs and festivals grow rarer in a famine" is dropped.** The 2026-10-25 record had this half too, and only a score lean could carry it. A seed only adds a story; it cannot subtract one. *Veto:* "a starving town should also hold fewer festivals" (that would need its own lean, which this plan measured as flat).

**Carried unchanged** from the 2026-10-25 decision record on [THR-2040](https://linear.app/threadbare/issue/THR-2040) (outside its veto window, no veto recorded):
- famine is the town's existing hunger (`isHungryToday` + `hungerDays`);
- glut is three surplus days at a food balance of at least 0.75;
- the granary riot keeps its own seed (on a day both would plant, the riot plants and the larder waits).

Rejected, one line each ([brainstorm](2026-10-28-thr-2040-hunger-stories-planted-brainstorm.md)):
- a louder score term (it never reaches the board);
- a multiplicative pull (measured, flat);
- a reserved shortlist slot (a bespoke case, Law 42);
- bypassing the forecast window (Law 20).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Unrest daily pass — `unrestPressure.ts` `dailyPass`, Lawless riot seed (THR-1934) | 🟢 ACTIVE | **extends** — calls one new planter beside the riot, with the same `pickTargetAgent`, `pendingSeedIds` and cooldown-prop pattern |
| Scarcity-arc seeds — `phases/economicPower.ts:256-271` (`sourceEncounterId: 'scarcity_arc'`) | 🟢 ACTIVE | **coexists, reads its constants** — the arc seeds an intervention when a staple's arc turns, on a different trigger (stock tier, not daily hunger) and a different phase, so the larder does not extend it. A town whose `scarcityArc.phaseSinceTick` is within `LARDER_SEED_COOLDOWN_DAYS` (the arc moved, and seeds on each move) skips its larder seed (`skipped: 'scarcity_arc'`), so one shortage never plants two stories |
| Encounter seeds — `encounterSeeding.ts` `evaluateEncounterSeeds` | 🟢 ACTIVE | **reads** — a `templateId` seed spawns its template for the target (no new seed kind) |
| Hunger reading — `isHungryToday`, `hungerDays` (THR-1934) | 🟢 ACTIVE | **reads** |
| Settlement food meters — `foodSurplusDays`, `foodBalance` (THR-1923) | 🟢 ACTIVE | **reads** |
| Branch `claude/thr-2040-larder-draws` | unmerged, far behind main | **not used**; its score term is the dropped design |

## Engine pillar

### Systems design

New module `src/engine/larderSeeds.ts`, pure apart from writing its own cooldown props:

1. **`readLarder(settlement)` → `{ state: 'famine' | 'glut' | null }`.** Famine: `isHungryToday(settlement).hungry`. Glut: not hungry, `foodSurplusDays ≥ PLENTY_MIN_SURPLUS_DAYS` and `foodBalance ≥ PLENTY_BALANCE_FLOOR`. Neutral on any non-numeric field.
2. **Triggers**, judged once a day inside the unrest daily pass, where `hungerDays` has just been written:
   - **famine** fires on the day `hungerDays === FAMINE_SEED_DAY`;
   - **glut** fires on the first day of a glut run (yesterday's reading was not glut, today's is).
   Both are blocked while `tick − larderLastSeedTick < LARDER_SEED_COOLDOWN_DAYS × TICKS_PER_DAY` (one prop per town, `larderLastSeedTick`, shared by both), and on a day the riot planted.
3. **`pickLarderRow(rows, town, tick)`.** It keeps the rows whose template's `locationSubtypes` include the town's subtype, or the subtype of one of its sublocations for `sublocation-type.*` entries, and drops any with `requiresHold`. Then it picks by weight with a stable hash of `town.id + tick`: no PRNG draw, so no other stream shifts (NFP #3). No row fits → no seed, and a trace says so.
4. **Plant** a `PendingEncounterSeed` for `pickTargetAgent(state, [town.id])`, in the riot's shape: `templateId`, `eligibleAfterTick = tick + SCARCITY_ARC_SEED_DELAY_TICKS`, `priority = SCARCITY_ARC_SEED_PRIORITY`, `sourceEncounterId: 'larder'`, `sourceReactionId: 'famine' | 'glut'`, and `seedLabel` from § UI. No resident → no seed, and a trace.
5. `runUnrestPressure` already returns `seeds`; the larder seeds join the same array. No new orchestrator wiring.

### Graph nodes / edges · Tick phases · PRNG

None new. It runs in the existing unrest phase. Two settlement properties are written (`larderLastSeedTick`, `larderWasGlut`). There is no PRNG draw (a stable hash is used).

### Resolution logic

Unchanged. A seeded scene resolves like any other. Its odds are the mortal's own (Law 18). It is a consequence of the town's state, so it skips the eligibility filter as every `templateId` seed does. The location and hold checks in § Engine 3 stand in for the gates that matter.

## Content pillar

Two data lists in a new `src/data/larder-seed-config.ts`, drawn from the first plan's table (positive weights only; a seed has no negative):

- **Famine:** aid_refugees 1.0 · gold.famine.merchant_granaries 1.0 · barter_survival 0.9 · mend_fishing_nets 0.6 · town.bell_at_the_exchange 0.6 · forage_provisions 0.6 · black_market_deal 0.5 · pickpocket 0.4.
- **Plenty:** harvest_bounty 1.0 · market_day_festival 0.8 · town.mill_lease_auction 0.6 · town.tithe_barn_raid 0.6 · festival_of_spheres 0.5 · tavern.drinking_contest 0.5 · grand_tournament 0.4 · caravan_deal 0.4 · foreign_trader 0.4.
- **Left out:** realm.crowns_reckoning (`requiresHold`), and the granary riot (its own seed).

All ids are full template ids (`encounter.` prefix where the template has one; verified on main, each resolves to exactly one template). No template, step or prose line changes.

## UI pillar

**No component changes; no new player surface.** The player meets the change as the scene itself, in the town whose Fortunes and Livelihood lines already say it is hungry or glutted. Measured: a seed's `seedLabel` reaches the player only for appointment seeds (`appointmentBadgeModel.ts:56`). For every other seed it shows in the debug **Encounter Seeds** tab (`EncounterSeedsTab.tsx`), which is where these will appear. It is written like the riot's (`"{town} turns lawless on an empty belly"`):

| Surface | Exact text |
|---|---|
| debug seed label, famine | `{town} has gone hungry` |
| debug seed label, glut | `{town}'s granaries are full` |

UI Laws engaged: none by a new surface. **Browser-verify exempt:** no file under `src/components/`, `src/hooks/` or `src/contexts/` changes; the label is debug data read by an existing tab.

**Playtest signal:** a tester following a mortal in a hungry town meets a hunger scene there before the town is fed again.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `larderSeeds.ts` | unrest (daily pass) | none (debug Encounter Seeds tab shows the label) | `pendingEncounterSeeds` (existing) | `larder.seed` | trace viewer, Encounter Seeds tab |
| `larder-seed-config.ts` | — | — | — | — | contract test |
| `scripts/larder-census.ts` → `npm run census:larder` | — | — | — | — | the Done-when |

Wiki: `public/settlements-economy-reference.html` (sources `unrestPressure.ts`) gains one sentence beside the riot seed.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Economy → encounter seeding: `hungerDays`, `foodSurplusDays`, `foodBalance` | **add** (read) | read site `larderSeeds.ts`, called from `unrestPressure.ts`. Record in `Docs/canon/interface-map.md` beside `unrest-pressure-inputs`, and in `scripts/interface-contracts.ts` |
| Unrest → `pendingEncounterSeeds` | extend | a second planter on the riot's existing write |
| THR-725 prosperity term · THR-2071 context pull | preserve | untouched |

## Constants table

`src/data/larder-seed-config.ts`:

| Constant | Default | Purpose |
|---|---|---|
| `LARDER_SEEDS_ENABLED` | `true` | kill switch; `false` is today exactly |
| `FAMINE_SEED_DAY` | 2 | hungry day on which the famine story is planted (the median hungry run is 4 days) |
| `LARDER_SEED_COOLDOWN_DAYS` | 10 | at most one larder story per town this often (the riot's cadence) |
| `PLENTY_MIN_SURPLUS_DAYS` · `PLENTY_BALANCE_FLOOR` | 3 · 0.75 | the glut test, unchanged |
| `FAMINE_SEED_ROWS` · `PLENTY_SEED_ROWS` | § Content | id → weight |

## Tracing

```ts
// category 'larder.seed'
interface LarderSeedTrace {
  tick: number; locationId: string; state: 'famine' | 'glut';
  templateId: string | null;          // null when no row fits or no resident
  targetAgentId: string | null;
  skipped?: 'cooldown' | 'riot' | 'scarcity_arc' | 'no_row' | 'no_resident';
  summary: string;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| non-numeric food fields | not glut; famine only through `isHungryToday` |
| no row fits the town's subtypes | no seed; trace `no_row` |
| no living resident | no seed; trace `no_resident` |
| a row id resolves to no template | contract test fails the build; at runtime the row is skipped |
| the target dies or leaves before the seed ripens | `evaluateEncounterSeeds`' existing handling |
| the planter throws | caught in `dailyPass`; the riot and the day's unrest stand |

## Blast Radius

N/A. The plan touches no file with 100 or more importers: `unrestPressure.ts` gains one call, and the module and config are new.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (17 seed rows)
- [x] UI pillar: N/A with rationale (no component changes; debug label only)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. "Watch what the world does next": a starving town's people live its hunger. Law 42: the riot's seed seam, a second user. Law 45: the label names a state the world really has.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes. Bless the Harvest / Blight the Fields now also plant stories in the towns they tip, as a consequence that is not promised to the player.
- [x] No `Docs/canon/rulebook.md` edit is owed.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | five named constants, two weighted row lists |
| 2. Inspectability | PASS | `larder.seed` trace on every plant and every skip |
| 3. Determinism | PASS | stable hash, no PRNG draw |
| 4. Fail-soft | PASS | table above; `LARDER_SEEDS_ENABLED = false` is today exactly |
| 5. Narrative over mechanics | PASS | a story because of the town, not a number |
| 6. Additive | PASS | a new module, a new config, one call |
| 7. Performance | PASS | one check per settlement per day, already iterated by the unrest pass |

## Done when

- [ ] `larderSeeds` unit tests: famine plants on `hungerDays === FAMINE_SEED_DAY` and not on day 1 or 3; glut plants on a glut run's first day only; the cooldown blocks a second plant within 10 days; a riot on the same day, or a scarcity-arc move within the cooldown, blocks it; a town with no fitting row or no resident plants nothing and traces why; the pick is the same for the same town and tick.
- [ ] A contract test: every row id resolves to exactly one live template, and none has `requiresHold`.
- [ ] `npm run census:larder -- --seeds 42,99,7,1,2,3 --ticks 360` runs both arms (`LARDER_SEEDS_ENABLED` false / true), pooled. With seeds on vs off:
  - hungry spells (≥ `FAMINE_SEED_DAY` days) in which someone standing in the town plays a famine scene: at least 50 %, and at least 25 points above the off arm (prototype: 22 % → 66 %);
  - glut runs with a plenty scene: at least 15 points above the off arm (prototype: 43 % → 74 %);
  - in fed towns, the famine and plenty shares of firings each move by no more than 1 point;
  - at least half the planted seeds are taken up by their target (prototype: 68 %).
  Record both arms in the closeout.
- [ ] `npm run gate` green. Interface map, contracts and `public/settlements-economy-reference.html` updated (one sentence beside the riot seed).

## Kill criteria

- The hungry-spell predicate fails: lower `FAMINE_SEED_DAY` to 1 once and re-run. If it still fails, ship nothing, record both arms, and return the ticket to Todo.
- The fed-town guard fails: the seeds are leaking. Ship nothing.
- A tick-cost regression traced to the planter: set `LARDER_SEEDS_ENABLED = false` and file it.

## Coordination block

**Suggested model:** sonnet. It is one small planter in an existing seam, a data file and a census, with no open design.
**Parallel-safe with:** [the board reads the place](https://linear.app/threadbare/issue/THR-2071), [the mill-guild build](https://linear.app/threadbare/issue/THR-2077) and [Attention's price](https://linear.app/threadbare/issue/THR-2062). None of them touches the unrest pass or seeding.
**Mutex with:** anything editing `src/engine/unrestPressure.ts`'s `dailyPass`, the riot's home.

**Files to touch:**
- Create `src/engine/larderSeeds.ts`, `src/data/larder-seed-config.ts`
- Edit `src/engine/unrestPressure.ts` (one call in `dailyPass`)
- Create `scripts/larder-census.ts` and add `census:larder` to `package.json`, built from the proto's `_scratch-2040-seed.ts`
- Edit `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, and the wiki page sourcing `unrestPressure.ts`
- Tests: `src/engine/__tests__/larderSeeds.test.ts`, `src/data/__tests__/larderSeedConfig.contract.test.ts`

## Notes for the executor

- Do not add anything to `encounterScoring.ts` or `decisionBoard.ts`. Both the score lean and the pull were measured flat.
- The proto's seeding loop runs outside the tick and plants on day boundaries (`t % 12 === 0`). The real planter belongs inside `dailyPass`, so its census numbers will differ a little. The predicates are relative to the off arm for that reason.

## Intent-judge verdicts

**Run 1 (2026-10-28, opus, cold): Allow** (Reversible, confirmed). Dimensions 1–10 PASS; 12 N/A (debug-only label). One GAP on dimension 11 and one advisory on dimension 1, both fixed in this revision:
- **D11:** the scarcity-arc seeder (`economicPower.ts`) was missing from the inventory. It is now listed, with a guard so one shortage never plants two stories (`skipped: 'scarcity_arc'`).
- **D1 (advisory):** the 2026-10-25 record's "fairs and festivals grow rarer" half was dropped without saying so. It is now Decision 3, with its own veto line.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-28*

### NFP audit

**NFP AUDIT: PASS-with-notes.**
- NFPs 1, 4, 5 and 6 pass.
- **2 (note):** register `larder.seed` in `TRACE_CATEGORIES`. Add a `disabled` skip reason.
- **3 (note):** name the stable hash. Reuse an existing string hash in `src/engine`; do not write a new one. The glut trigger reads the persisted `larderWasGlut` prop.
- **7 (note):** `pickTargetAgent` runs only on a trigger day, at most once per town per 10 days. Its cost is covered by the census's tick-cost check.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.**
- Engine and Content are present and substantive. UI is N/A with a rationale.
- No required section is missing. The Wiring table connects the planter, the seeds, the trace and the debug tab.
- The substrate inventory covers the unrest pass, the riot seed, the scarcity-arc seeds, seeding, hunger and the food meters, with no duplication.
- Note: `larderWasGlut` is a written prop. It is named in the Engine section, beside `larderLastSeedTick`.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions.
- It confirms the north star (witnessed interior life) and non-negotiables 1–3: there is no direct control, odds are the mortal's own, and the label is debug-only.
- The core loop is preserved.
- It extends design tension 2, with a mild lean toward authored-from-system.
- Note: a fixed 17-row list on a 10-day cooldown could repeat across a long run. The weights and the cooldown mitigate this, and the executor's census should report the per-template spread of seeded scenes.
