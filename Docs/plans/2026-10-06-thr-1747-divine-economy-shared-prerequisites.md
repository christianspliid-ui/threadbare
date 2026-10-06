> **title:** `Divine economy shared prerequisites — thread upkeep a god can keep, the Wellspring as a milestone, source upkeep charged, the orphaned income cards granted — THR-1747`
> **linear_issue:** THR-1747
> **author:** `Claude Code (design lane, unattended run 2026-10-06a)`
> **created:** 2026-10-06
> **three_pillars:** Engine `done — four constant/wiring changes on existing phases, no new phase, node or edge` · Content `done — two milestone presentations, two chronicle lines, two Covenants copy lines` · UI `done — sources join the existing Covenants list with their upkeep line; no new surface`

# Divine economy shared prerequisites — THR-1747

*The Dominion loop Christian ruled on 2026-10-05 cannot be built on an economy where one thread empties the god's own sphere by day 20; these are the five balance-and-wiring fixes every version of that loop needs, and the Dominion core waits on them.*

## Why this is load-bearing

Christian's ruling on [THR-1745](https://linear.app/threadbare/issue/THR-1745) (recorded in [`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`](2026-10-05-thr-1745-player-power-progression-models.md) § Director's ruling) makes **Dominion** the player's power loop: home turf is cheaper and stronger to act on, threads spread it, and spending through a sphere builds infrastructure that pays back. The same doc measured why no loop can stand on today's economy (§ Model 0 and § The holes):

- **H1** — one thread at Devoted costs 1.0 a tick against ~0.73 a tick of primary income. Live headless check, seed 42: a single tier-1 thread bound at tick 0, no casts, drains the god's primary sphere from 50 to 1.4 by tick 240 while the other eleven sit at cap (that doc § Verification).
- **H2** — the five source verbs arrive by lottery (one cadence beat of weight 4 in ~76, expected around tick 170), and held cards are re-offered forever.
- **H3** — four income-shaped cards ship with no grant path.
- **H4** — source upkeep `SOURCE_CONTROL_SUSTAIN` is declared and charged by nothing, so holding ground is free and never a choice.
- **H10** — timing comments.

None of these is a creative fork; THR-1745 marks every one "agent". The Dominion core ([THR-1748](https://linear.app/threadbare/issue/THR-1748)) is blocked on this ticket because both edit `computeEssenceGeneration` and `phaseEssenceSources`.

**Settled inputs this plan builds on.** The five items are Christian's own filing on THR-1747 (2026-10-05) under his Dominion ruling; no lane-made decision feeds them, so no veto window applies to this plan's inputs. The calls this plan makes inside the items are made by the design lane under the 2026-09-11 delegation and listed under § Decided by delegation.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Reputation & Influence (thread tiers, maintenance, promotion) | 🟢 ACTIVE | extends — `TIER_MAINTENANCE` retuned; ladder, promotion ticks and Aspect unchanged |
| Essence & Divine Economy | 🟢 ACTIVE | extends — `phaseEssenceSources` gains its first pool write (source upkeep); `computeEssenceIncome` subtracts it so the readout matches the ledger |
| Ascendant Beats & Progression | 🟢 ACTIVE | extends — the Wellspring moves from the cadence pool to a milestone; investment beats retire once their grants are held; one new holdings milestone grants the orphans |
| Strategic Projects & Control (control effects) | 🟢 ACTIVE | activates — three orphaned sustained controls (`hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`) become reachable; their existing per-tick cost/income runs unchanged |
| Ascendant bar — Covenants block | 🟢 ACTIVE | extends — controlled sources join the list as rows without a Release control |

Runtime counts that bound the work (seed 42, medium): 6 latent essence sources seeded per map (THR-1745 § Substrate inventory); the cadence pool holds 12 investment beats (`grep -c "kind: 'investment'" src/data/ascendant-beat-content.ts` → 12), all grant-only — `ascendant-pool-beat-templates.ts` declares no `aftermathConfig` on any of them (its header, lines 33–40), so retiring one loses no scene.

## Measured substrate (commands and what they returned, 2026-10-06, `origin/main` @ `546f3a47`)

| Claim | Evidence |
|---|---|
| Thread upkeep is 0 / 0.5 / 1 / 2 / 4 by tier and charged from the primary sphere after income | `src/data/influence-content.ts:60–66`; `src/engine/phaseInfluenceMaintenance.ts` header ("Runs immediately AFTER phaseEssence") |
| Two tests pin the old values | `src/data/__tests__/influence-content.test.ts:25–29` (`toBe(0.5)` … `toBe(4.0)`); every other test reads the constant by name (`influence.test.ts:346`, `phaseInfluenceMaintenance.test.ts:87,95,123`) |
| `SOURCE_CONTROL_SUSTAIN = 0.15` has no consumer | grep over `src/` returns only its declaration, `src/data/essence-sources.ts:34` |
| `phaseEssenceSources` never touches the pool | `src/engine/phaseEssenceSources.ts` returns `{}` on every path ("no GameState field changes in this slice") |
| A debit there is not counted as essence *earned* | `src/engine/essenceEarned.ts` header: accrual is the positive net pool movement per phase; a phase that only spends banks nothing |
| The Wellspring is a cadence pool beat with the `unthreaded_target` predicate | `src/data/ascendant-beat-content.ts:428–437` |
| No investment beat ever retires | `isBeatEligible` (`src/engine/ascendantBeat.ts:304–322`) switches on `unintroduced_group` / `unthreaded_target` / `unacquired_reach_signature` only; `unthreaded_target` is true while any actor or location is unthreaded |
| Milestones enqueue from `phaseAscendantProgression` only when the spine is exhausted and nothing is pending, and record themselves at enqueue | `phaseAscendantProgression.ts:141` (`canEnqueue`), `:221–235` (`milestoneBeatsFired`) |
| The bond tick is read through `resolveDoomWokeAtTick(state.doomClock)` | `src/engine/doomClock.ts:684–692`: `null` while the clock sleeps; a clock with **no** `wokeAtTick` field (old save, hand-built fixture) reads as woken at tick 0. Rival grace reads the same value plus `RIVAL_GRACE_TICKS_AFTER_BOND` (`:703–707`); `RIVAL_GRACE_TICKS_AFTER_BOND = 48` (`src/data/game-config.ts:50`) |
| `isBeatEligible` returns `true` before its `try` for a beat with no eligibility | `src/engine/ascendantBeat.ts:305–306` (`if (!e \|\| e.kind === 'always') return true;`); `beat.pool.invest.the_unveiled_eye` is an investment beat with no `eligibility` (`ascendant-beat-content.ts:451–458`) |
| The four orphans exist and no beat grants them | definitions at `unified-action-templates.ts:1748` (`loc.place_of_power`), `:4326` (`hex.claim_dominion`), `:4417` (`hex.claim_resource`), `:4512` (`hex.tap_source`); grep of `src/data/ascendant-*.ts` and `reach-signature-content.ts` finds no `grantsActionIds` naming any of them, and none has an `ASCENDANT_ACTION_BUCKETS` entry |
| A granted card must have a bucket entry | `src/engine/__tests__/ascendantBeatPool.test.ts:158` (`missing bucket for granted action`) |
| Hex-targeted cards can surface | `src/engine/targetActions.ts:325–334` accepts `targetCategories: ['hex']` for a hex target built by `buildHexTargetContext` |
| **`loc.place_of_power` does not make a place of power** | its only effect is `magicalSaturation +0.30` (`unified-action-templates.ts:1759–1764`); grep for a writer of `isPlaceOfPower` (`isPlaceOfPower\s*[:=]`) over non-test `src/` returns nothing; the legacy +0.5 term in `computeEssenceGeneration` (`influence.ts:142`) therefore has no writer |
| **1,080 ticks is three years on the player's calendar** | `TICKS_PER_SEASON = 90`, `SEASONS_PER_YEAR = 4` (`src/types/temporal.ts:30–33`) → 360 ticks a year; the season/year words the player reads come from this calendar. A second clock, `TICKS_PER_DAY = 12` (`src/data/attention-constants.ts:14`), drives the attention pool and prose day-counts |

The last two rows change two of the ticket's items; see § Decided by delegation, items 4 and 5.

## Decided by delegation (design lane, 2026-10-06 — veto in chat)

1. **Upkeep numbers as filed.** 0.1 / 0.2 / 0.35 / 0.5. The ledger below shows what they buy: base plus seat keeps one thread all the way to Aspect, or two Champions; deeper retinues need ground. That is the Dominion loop in miniature, and it is why the values are kept rather than softened.
2. **The Wellspring milestone fires at bond + 48 ticks**, the same moment the rivals wake (`RIVAL_GRACE_TICKS_AFTER_BOND`), and reuses that constant's value under its own name so the two can be tuned apart. It waits for the spine and for an empty pending slot like every other milestone; it never fires before the bond (`wokeAtTick` null).
3. **Unpaid source upkeep stalls, never lapses.** A source the primary pool cannot cover this tick is marked `upkeepCurrent: false` and gets none of the land's upward drift that tick (the essence-bridge nurture); its income, tier and control are untouched. This is the thread rule's analogue (an unpaid thread stops climbing). An income penalty was rejected because a source consecrated to the primary sphere would then starve the pool that pays for it.
4. **The orphans arrive at a new "held ground" milestone: two flowering sources.** All four cards in one beat. The existing source milestone (three sources or one flowering) already hands over six economic verbs at once; adding four more there would bury the player in one modal (the THR-1608 lesson). Two flowering sources lands mid-run under the retuned economy and leaves THR-1745 Model A's 3 / 6 ladder free for the Dominion work. **`loc.place_of_power` is granted as it is**: its effect (magical saturation) is real, but nothing turns a place into a place of power, so its income never arrives. Making it pay is filed as its own ticket (§ Deferrals) rather than widened into this one.
5. **The timing fix is smaller than the ticket says.** `DEFAULT_DOOM_TICKS`' "three in-world years" is *right* on the season calendar the player reads (1,080 ÷ 360), and `TIER_PROMOTION_THRESHOLDS`' "~1 month / ~1 season / ~2 seasons" are right on the same calendar (90 ticks a season). The one wrong phrase is "at 12 ticks a day" in the doom comment, which mixes in the attention clock. The fix rewrites that phrase to cite `TICKS_PER_SEASON` and adds one sentence naming the two clocks, so the next reader does not re-file H10. The promotion comments stay.

## Engine pillar

### Systems design

**E1 — Thread upkeep a god can keep.** `TIER_MAINTENANCE` (`src/data/influence-content.ts`) → `{0: 0, 1: 0.1, 2: 0.2, 3: 0.35, 4: 0.5}`. No logic change; `processInfluenceMaintenance`, the readout in `essenceIncome.ts` and the CMS registry all read the constant.

Ledger (primary share 0.35 of the alignment-distributed total; base 1.0 + seat 1.0 + 0.1 per thread; a consecrated source pays 0.5 dormant into its own sphere, which `consecrate_source` sets to the god's primary):

| Holding | Primary income / tick | Upkeep / tick | Net |
|---|---|---|---|
| 1 thread at tier 4 | (2.1 × 0.35) 0.735 | 0.5 | **+0.235** |
| 2 threads at tier 3 | (2.2 × 0.35) 0.77 | 0.70 | **+0.07** |
| 2 threads at tier 4 | 0.77 | 1.00 | −0.23 |
| 2 threads at tier 4 + 1 consecrated source | 0.77 + 0.5 | 1.00 + 0.15 | **+0.12** |
| 3 threads at tier 3 + 1 consecrated source | (2.3 × 0.35) 0.805 + 0.5 | 1.05 + 0.15 | **+0.105** |

Today the first row is 0.735 − 4.0 = −3.27.

**E2 — The Wellspring becomes a milestone.**
- Remove `beat.pool.invest.the_wellspring` from `ASCENDANT_BEAT_POOL` (`ascendant-beat-content.ts`). Its pool template in `ascendant-pool-beat-templates.ts` stays (old saves' `history` may name it; `findBeatDefinition` must still resolve it for display).
- Add `WELLSPRING_MILESTONE_BEAT_ID = 'beat.milestone.the_wellspring'` (`src/data/player-progression.ts`) and a milestone entry in `ASCENDANT_MILESTONE_BEATS` granting the same five ids (`loc.find_source`, `loc.claim_source`, `loc.consecrate_source`, `loc.sanctify_source`, `loc.defend_source`), `identity: { reach: 'star', sphere: 'spirit' }`, `trigger: { kind: 'turn' }`.
- In `phaseAscendantProgression`, a new Axis-B check **ahead of** the source milestone: when `canEnqueue && !pending`, the beat is not in `milestoneBeatsFired`, `woke = resolveDoomWokeAtTick(state.doomClock)` is not `null`, and `turn >= woke + WELLSPRING_MILESTONE_TICKS_AFTER_BOND` → enqueue (read the bond through the resolver, never the raw field: an old save with no `wokeAtTick` field counts as bonded at tick 0, so it is still offered the verbs it can no longer draw from the pool) exactly as the source milestone does (pending, `milestoneBeatsFired`, `ascendant.progression.milestone_enqueued` trace, chronicle line).
- **Already held**: if every one of the five ids is already in `unlockedActionIds` (an old save that drew the pool beat, or a showcase that pre-grants them), record the beat as fired **without** enqueueing it and emit the trace with `skipped: 'all_grants_held'`. THR-647's rule: never offer a card the god already holds.

**E3 — Investment beats retire once their grants are held.** A new helper `allGrantsHeld(beat, state)`: true when `beat.grantsActionIds` is non-empty and every id is in `state.unlockedActionIds`. `isBeatEligible` returns `false` for `beat.kind === 'investment' && allGrantsHeld(beat, state)`, checked **first — ahead of the `if (!e || e.kind === 'always') return true;` early return** (an investment beat with no eligibility, such as `beat.pool.invest.the_unveiled_eye`, must retire too) — in its own `try/catch` that treats an error as "not all held" so the beat stays eligible (fail-open). Scope is investment beats only (the ticket's wording); introduction, selection and delivery beats are untouched.

**E4 — Source upkeep charged.** In `phaseEssenceSources`, after `recomputeControlledSourceTiers`, a new pure helper in `src/engine/essenceSources.ts`, `chargeSourceUpkeep(graph, ascendantId, pool)`:
- iterates the ascendant's `controls` edges in graph order; for each host with an `essenceSource` bag, charges `SOURCE_CONTROL_SUSTAIN` from `pool[primary]` if the pool holds at least that much, else charges nothing for that source;
- writes `upkeepCurrent: true | false` onto the source bag (additive optional field on `EssenceSource`, `src/types/essenceSource.ts`; absent reads as `true`);
- returns `{ sources, paid, unpaid, charged, lapsedIds, restoredIds }`.

The phase returns `{ essencePool }` when `charged > 0`. **Ordering:** the essence-bridge nurture step inside `recomputeControlledSourceTiers` must read the *previous* tick's `upkeepCurrent` (the flag is written after the recompute), so an unpaid source misses exactly one tick of upward drift per unpaid tick. The executor may instead move the charge ahead of the recompute; either order is acceptable if the test in Done-when 4 holds.

`computeEssenceIncome` (`src/engine/essenceIncome.ts`, the readout the essence bar uses) subtracts `SOURCE_CONTROL_SUSTAIN × controlled sources` from the primary net, next to the thread maintenance it already subtracts, so readout and ledger agree (the THR-1652 lesson; PC-6).

**E5 — The held-ground milestone.** `MILESTONE_HELD_GROUND_BEAT_ID = 'beat.milestone.the_held_ground'`, enqueued in `phaseAscendantProgression` after the source milestone when `countControlledSources(...).flowering >= MILESTONE_HELD_GROUND_FLOWERING`. It grants `hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`, `loc.place_of_power` and applies the same all-grants-held skip as E2. Four new `ASCENDANT_ACTION_BUCKETS` entries, `{ bucket: 'unlockable-generic' }` (their `reach` is a cosmic-energy axis, not `requiresReach`, matching the source verbs' entries).

**E6 — Comments.** `DEFAULT_DOOM_TICKS` (`src/data/game-config.ts`): replace "three in-world years at 12 ticks a day" with "three in-world years on the season calendar (`TICKS_PER_SEASON` 90, four seasons a year)" and add: "The attention clock (`TICKS_PER_DAY` 12) is a separate pacing unit; do not convert between them."

### Graph nodes / edges

None new. One optional property on the existing `essenceSource` bag: `upkeepCurrent?: boolean`. Threads stay `thread` edges; sources stay `controls` edges to hosts carrying the bag.

### Tick phases

No new phase. `essence_sources` (E4) gains a pool debit; it runs before `essence`, so the debit is a spend the earned counter ignores. `ascendant_progression` (E2, E5) gains two milestone checks. `influence_maintenance` (E1) is unchanged in logic.

### Resolution logic

Unchanged. No outcome ladder, cast odds, nudge hand or card cost is touched.

### PRNG callouts

None. Every writer is deterministic (thresholds, counts, graph order). Removing a beat from the cadence pool changes the weighted draw's sequence on every seed after the spine, which is expected and is why no test should pin a specific post-spine pool beat by seed.

## Content pillar

### Encounter templates

None.

### Prose tables

Two milestone presentations in `MILESTONE_BEAT_PRESENTATION` (`ascendant-milestone-beats.ts`) and two chronicle lines in `milestoneChronicleProse`. Plain register (THR-609), second person, no counts, no placeholders (milestones are identical every run). The executor uses this text as written; wording fixes for grammar are fine, new claims are not.

**The Wellspring**
- eyebrow: `The Wellspring`
- title: `Ground That Could Feed You`
- prose: "There is ground in the world that could be made to feed you: places where the devotion of mortals pools instead of draining away. Claimed and named, such a place becomes a source of your own, and it gives you strength of its particular kind, tide after patient tide. A source left untended stays shallow, and one left unguarded can be bled by hands that are not yours. Learn the whole of it now: to find such a place, to claim it and turn it toward you, to deepen what it gives until it flowers, and to hold it fast when something comes to drain it."
- cta: `Receive`
- chronicle: "You learned where devotion pools in the world, and how to make such ground your own."

**Held Ground**
- eyebrow: `Held Ground`
- title: `The Land Has Learned Your Shape`
- prose: "Your wellsprings have flowered, and more than one of them. The land around them has learned your shape: roads bend toward them, and the earth answers when you press on it. A god this rooted can do more than tend. You can sink a claim into the land and hold it as yours, bind a vein of the world's wealth to your will, draw a steady siphon from a source, and wake the deep lines under a place until power gathers there."
- cta: `Receive`
- chronicle: "Your wellsprings flowered and the land learned your shape. You learned to hold ground outright, and to draw on it."

The word *dominion* is deliberately absent: [THR-1746](https://linear.app/threadbare/issue/THR-1746) is reconciling it in the glossary.

### Attachment content

None.

### Data tables

Constants below. `COVENANT_SOURCE_COPY` in `src/data/ascendant-bar-content.ts` (§ UI).

## UI pillar

*Screenshot tool: Playwright (the Covenants block and the beat modal are DOM).*

### Player-facing display

**Sources join the Covenants list.** `selectCovenantRows` (`src/components/Game/ascendant-bar/selectors.ts`) appends one row per controlled essence source after the control-effect rows. `CovenantRowView` gains two additive fields: `kind: 'control' | 'source'` and `releasable: boolean` (true for every control row, as today; false for source rows). `CovenantsBlock` renders the Release button only when `releasable`. A source row's `contested` is the source bag's existing contested state. The empty state is unchanged and now shows only when there are no controls **and** no sources.

The essence bar needs no change: it reads `computeEssenceIncome`, which E4 corrects.

The beat modal shows the two new milestones through the existing milestone presentation path (`getMilestoneBeatById` → `MILESTONE_BEAT_PRESENTATION`); no component change.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Covenants row title, source not yet flowering | "A wellspring you hold" | PC-1 | The row sits among the god's other holds; the target line names the place ("Thornwick Spring") |
| Covenants row title, flowering source | "A wellspring in flower" | PC-1 | Same row, the word changes when it flowers |
| Covenants row upkeep, paid | "Costs a little of your essence to keep, and gives back more." | PC-1, PC-6 | Says in words what holding it costs and returns; the essence bar's income for the primary sphere now includes the same debit, so the two never disagree |
| Covenants row upkeep, unpaid | "Unpaid. It will not grow until you can keep it." | PC-1, PC-4 | Tells the player, on the row, that the shortfall is happening and what it costs them |
| Beat modal, Wellspring | eyebrow "The Wellspring", title "Ground That Could Feed You", prose and cta as quoted in § Content | PC-7 | Arrives at a fixed moment after the bond with the five source cards; gives the player a next thing to do |
| Beat modal, Held Ground | eyebrow "Held Ground", title "The Land Has Learned Your Shape", prose and cta as quoted in § Content | none | A reward naming what the god can now do with the ground it holds |
| Chronicle | the two chronicle lines quoted in § Content | none | One line each, written when the beat is offered |

No row shows a number. The copy lines live in `COVENANT_SOURCE_COPY` (`titleDormant`, `titleFlowering`, `upkeepPaid`, `upkeepUnpaid`).

### Playtest signal

A tester who holds a source can say, from the god's list of holdings, that keeping it costs a little and pays back more; and a tester who plays past the opening is handed the source cards without waiting for luck.

### Event notifications

The two milestone beats open the existing modal and write one chronicle line each. Source upkeep emits no toast (a per-tick cost is a row state, not an event).

### Debug inspection (DebugPanel)

- `window.__DEBUG.beatSchedule()` already lists pending and history; the two new beat ids appear there.
- The Essence Sources tab gains an `upkeep` column (`paid` / `unpaid`) read from `upkeepCurrent`.
- The `source_upkeep` trace (§ Tracing) is visible in the trace viewer.

### Visual presence (HexMapV2)

None. Sources keep their existing signifier path (THR-611).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `TIER_MAINTENANCE` retune | `influence_maintenance` | essence bar (via `computeEssenceIncome`) | `essencePool` | `influence_maintenance` (existing) | CMS registry row (existing) |
| `chargeSourceUpkeep` | `essence_sources` | `CovenantsBlock` | `essencePool`; `essenceSource.upkeepCurrent` on hosts | `source_upkeep` | Essence Sources tab, trace viewer |
| `computeEssenceIncome` source term | read by the essence bar each render | essence bar | — (derived) | — | `__DEBUG.getEssenceSources()` |
| Wellspring milestone | `ascendant_progression` | beat modal | `ascendantBeats.pending`; ascendant `milestoneBeatsFired` | `ascendant.progression.milestone_enqueued` | `__DEBUG.beatSchedule()` |
| `allGrantsHeld` retirement | `ascendant_beat_director` (cadence draw) | — | — | `ascendant.beat.skipped` (`empty_pool`, existing) when the pool empties | `__DEBUG.beatSchedule()` |
| Held-ground milestone | `ascendant_progression` | beat modal | as Wellspring | as Wellspring | as Wellspring |
| Source rows | — | `CovenantsBlock` via `selectCovenantRows` | reads graph | — | `data-testid="covenant-row-source-<hostId>"` |

Prose pipeline: no `enrichProse` (milestone prose is static by design). Player controls: none new; source rows have no Release.

## Interface impact

Essence & Divine Economy and Ascendant Beats are on the interface map's **unaudited** list (`Docs/canon/interface-map.md` § Unaudited subsystems) — audit-on-touch applies.

| Contract | Disposition | Detail |
|---|---|---|
| `economy-sustains-essence-sources` (existing) | preserve | the essence bridge still nurtures/withers sanctity; an unpaid source skips one tick of upward drift (E4) |
| **new** `source-upkeep-debits-primary-pool` | add | producer `phaseEssenceSources` (Essence & Divine Economy) → consumer the essence bar via `computeEssenceIncome` and the Covenants block via `selectCovenantRows`. Production read sites named; row added to `scripts/interface-contracts.ts` and `Docs/canon/interface-map.md` in the executor PR |
| milestone grant path (`resolvePendingBeat` → `unlockedActionIds`) | extend | two new milestone beats use it unchanged |
| thread maintenance (`phaseInfluenceMaintenance` → `essencePool`) | preserve | constants only |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `TIER_MAINTENANCE` | 0 / 0.5 / 1 / 2 / 4 → **0 / 0.1 / 0.2 / 0.35 / 0.5** | thread upkeep per tick by tier, from the primary sphere |
| `WELLSPRING_MILESTONE_TICKS_AFTER_BOND` | **48** | ticks after the bond before the Wellspring is offered (new, `player-progression.ts`) |
| `WELLSPRING_MILESTONE_BEAT_ID` | `'beat.milestone.the_wellspring'` | new milestone id |
| `SOURCE_CONTROL_SUSTAIN` | 0.15 (unchanged, now charged) | upkeep per controlled source per tick, from the primary sphere |
| `MILESTONE_HELD_GROUND_FLOWERING` | **2** | flowering sources that grant the four orphaned income cards (new) |
| `MILESTONE_HELD_GROUND_BEAT_ID` | `'beat.milestone.the_held_ground'` | new milestone id |
| `COVENANT_SOURCE_COPY` | four strings (§ UI) | Covenants copy for source rows |

All new numeric constants get CMS registry rows beside `MILESTONE_SOURCES_FOR_BEAT` (`src/components/CMS/registry.ts`).

## Tracing

```ts
// SourceUpkeepTrace — emitted by phaseEssenceSources only on ticks where some
// source's paid/unpaid state flips (mirrors InfluenceMaintenanceTrace; never
// every tick, never one per source).
interface SourceUpkeepTrace {
  category: 'source_upkeep';
  tick: number;
  sources: number;        // controlled sources charged this tick
  paidCount: number;
  unpaidCount: number;
  lapsedIds: string[];    // hosts that went paid → unpaid this tick
  restoredIds: string[];  // hosts that went unpaid → paid this tick
  essenceSpent: number;   // taken from the primary sphere
  sphere: SphereName;     // the primary sphere charged
  summary: string;
}

// Existing category, two new beat ids, one new optional field.
interface MilestoneEnqueuedTrace {
  category: 'ascendant.progression.milestone_enqueued';
  tick: number; turn: number;
  beatId: string;               // now also the two new ids
  skipped?: 'all_grants_held';  // set when the beat was recorded fired without being offered
  summary: string;
}
```

`source_upkeep` is added to the trace-category union wherever `influence_maintenance` is declared.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No ascendant node, no `sphereAlignment.primary`, or no `essencePool` | `chargeSourceUpkeep` charges nothing and returns zeros; phase returns `{}` |
| Primary pool smaller than one source's upkeep | that source is marked unpaid; nothing is charged for it; control, tier and income untouched |
| A `controls` edge points at a missing host, or a host without a source bag | skipped (as `countControlledSources` does today) |
| `wokeAtTick` is `null` (bond not yet made) | Wellspring milestone does not fire; re-checked every tick |
| `wokeAtTick` field absent (old save, hand-built fixture) | `resolveDoomWokeAtTick` reads it as tick 0, so the Wellspring fires at tick 48 like any bonded run |
| Spine still running or a beat pending at bond + 48 | Wellspring waits; the check is threshold-based, so it fires on the first tick the slot is free |
| Every grant of a milestone already held | recorded fired, not offered, trace says `skipped: 'all_grants_held'` |
| `allGrantsHeld` throws (malformed beat) | caught by the check's own `try/catch` (E3), which sits ahead of the early return; the beat stays eligible (fail-open) |
| Old save whose history holds `beat.pool.invest.the_wellspring` | the pool template still resolves for display; the milestone skips because the five verbs are held |
| Every investment beat retired | cadence draw already emits `ascendant.beat.skipped` `empty_pool` and returns |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/influence.ts` (not edited; re-exports `TIER_MAINTENANCE` from `influence-content.ts`) | 128 | value change only, no type change; tests that read the constant by name follow it; the two that pin literals are updated (Done-when 6) |

All edited files have 1–19 importers (counted by import-path grep, 2026-10-06).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It makes *attention a spend* affordable instead of ruinous, and makes holding ground a choice with a cost, which is what the Dominion ruling asks the economy to support. The fixed-moment Wellspring gives the player direction (PC-7) without adding a popup: it takes a slot the cadence draw would have filled.
  - `Vision/00-north-star.md`, weight of threads ("keeping too many threads should become a problem the game surfaces, not a number the player optimizes"): the ledger's negative row (two tier-4 threads without ground) is that problem, pinned by Done-when Arm C.
  - `Vision/02-non-negotiables.md` #3 (mechanics surface through prose): new rows and beats carry no numbers.
  - `Vision/03-design-tensions.md`, tension 4 (legibility against mystery): this plan leans to legibility (a readout that matches the ledger, a row that names the cost) because cold playtests show players cannot read essence at all (PC-1, PC-6). The mystery side is kept by saying it in words, not numbers.
- [ ] If it does, the Vision edit is part of this ticket's scope

## Rulebook impact

- [ ] This plan does not change a rule of play
- [x] It does: `Docs/canon/rulebook.md` is updated **in the executor's PR** (the design PR carries no rule change because no code ships with it). §4 "How your power grows within a run", the Breadth bullet: the Wellspring is now a milestone after the bond, and a second milestone at two flowering sources grants the four holding cards. §6 resources: threads and sources both cost a little of the primary sphere each tick; an unpaid source stops growing. `Docs/canon/rulebook-quick-reference.md` follows.

> Brainstorm companion: [`2026-10-06-thr-1747-divine-economy-shared-prerequisites-brainstorm.md`](2026-10-06-thr-1747-divine-economy-shared-prerequisites-brainstorm.md)

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every number is a named constant with a CMS row; the ledger above is reproducible from them |
| 2. Inspectability | PASS | `source_upkeep` trace on state flips; `milestone_enqueued` gains `skipped`; `upkeepCurrent` visible in the Essence Sources tab |
| 3. Determinism | PASS | no PRNG added; removing a pool beat shifts the post-spine draw sequence, noted under PRNG callouts |
| 4. Fail-soft | PASS | table above; nothing lapses a hold or throws |
| 5. Narrative over mechanical perfection | PASS | unpaid ground "will not grow", an outcome the player can read on the row; milestones narrate rather than count |
| 6. Additive over destructive | PASS with note | one removal: the Wellspring entry leaves `ASCENDANT_BEAT_POOL` (the ticket's explicit ask); its template stays so old histories resolve. Every other change is a constant, an optional field or a new entry |
| 7. Performance budget | PASS | O(controlled sources) per tick, the same loop shape `countControlledSources` already runs |

## Done when

- [ ] (1) **Upkeep is keepable (ledger test, deterministic fixture, no casts, 1,080 ticks through `phaseEssenceSources` → `phaseEssence` → `phaseInfluenceMaintenance` → tier promotion each tick).**
   - Arm A: one thread bound at tick 0, no sources — the thread is never marked `maintenanceCurrent: false` and reaches tier 4.
   - Arm B: two threads bound at tick 0 plus one controlled source consecrated to the primary sphere — no thread and no source is ever unpaid, the primary pool is above zero at every 120-tick snapshot, and both threads reach tier 4.
   - Arm C: Arm B without the source — once both threads reach tier 4, at least one goes unpaid (the ledger says ground is needed; the test pins it so a later retune that makes ground pointless fails loudly).
   - Arm D (the ticket's own predicate): two threads bound at tick 0, no source, promotion capped at tier 3 for the run (the fixture holds `ticksAtCurrentTier` below the tier-4 threshold) — the primary pool is above zero at every 120-tick snapshot and no thread is ever unpaid. This is the "+0.07" ledger row.
- [ ] (2) **Live check (CLI, seed 42, medium):** repeat THR-1745 § Verification (one tier-1 thread added at tick 0, 240 ticks, no casts) and quote both numbers in the PR: primary at tick 240 on `main` before the change (THR-1745 recorded 1.4) and after (must be above 25, i.e. no longer draining).
- [ ] (3) **Wellspring milestone (unit + live):** with the spine exhausted, nothing pending and `wokeAtTick = 0`, the beat is enqueued at tick 48 and not at tick 47; with a clock that has **no** `wokeAtTick` field it is enqueued at tick 48; with `wokeAtTick = null` it is never enqueued; with all five verbs already in `unlockedActionIds` it is recorded fired, not offered, and the trace carries `skipped: 'all_grants_held'`; `ASCENDANT_BEAT_POOL` no longer contains `beat.pool.invest.the_wellspring`; resolving the milestone puts all five ids in `unlockedActionIds`. The existing `ascendantBeatPool.test.ts` "the_wellspring beat unlocks…" test is rewritten against the milestone, not deleted. **Live (the ticket's predicate):** on seeds 42, 7 and 1337 (medium), with every offered beat resolved as soon as it is offered (the headless harness's resolve call, or `await window.__DEBUG.dismissBeats()` each tick in the browser), the Wellspring is offered by tick 60 after the bond on all three seeds. ("After the bond" is the ticket's "by tick 60" made exact: the seeded showcase bonds at tick 0, so they are the same tick there.) A miss fails this item. If the cause is the spine or a pending beat holding the slot, the fix is in scope: give the Wellspring check priority over the cadence draw on the tick it comes due, or lower `WELLSPRING_MILESTONE_TICKS_AFTER_BOND`, and re-measure.
- [ ] (4) **Retirement (unit):** an investment beat whose every grant is held is not eligible; one with any grant missing is; an investment beat with **no** `eligibility` whose grants are all held (the `the_unveiled_eye` shape) is not eligible; an introduction beat with held grants is unaffected; an `allGrantsHeld` that throws leaves the beat eligible.
- [ ] (5) **Source upkeep (unit):** one controlled source with a full pool debits exactly `SOURCE_CONTROL_SUSTAIN` from the primary sphere and nothing elsewhere; with the pool below that amount nothing is charged, `upkeepCurrent` is `false`, the source is still controlled, its tier is unchanged and its sanctity receives no upward drift that tick; `computeEssenceIncome`'s primary net equals the ledger's net for the same state (readout = ledger); the essence-earned counter does not move on the debit.
- [ ] (6) **No test asserts the old upkeep literals:** `influence-content.test.ts` pins the new values.
- [ ] (7) **Orphans reachable:** with two flowering controlled sources the held-ground milestone is enqueued; on resolution each of the four ids is in `unlockedActionIds`; each has an `ASCENDANT_ACTION_BUCKETS` entry (the existing drift test passes); with all four already held it is skipped like the Wellspring.
- [ ] (8) **Browser evidence (UI pillar, Playwright, `?view=game&seeded&size=medium`):** after `window.__DEBUG.tick(n)` past the Wellspring and a source claimed through the debug bridge, the Covenants block shows a source row with "A wellspring you hold", "Costs a little of your essence to keep, and gives back more." and no Release button. Four parts: 1920×1080 screenshot; console output (no new errors); a `window.__DEBUG.*` assertion (`await window.__DEBUG.beatSchedule()` lists `beat.milestone.the_wellspring` in history, and the source's `upkeepCurrent` is `true`); a UI-Laws line covering at minimum Laws 1, 13/14, 17, 21, 33, 37 (`Docs/design-system/laws.md`). One held-ground hex card (e.g. Tap the Source) shown in the drawer for a hex target after the milestone resolves (grant it with `__DEBUG.fireBeat` if reaching two flowering sources live is slow).
- [ ] (9) **Docs:** rulebook §4 and §6 and the quick reference updated; interface-map row and `scripts/interface-contracts.ts` entry for `source-upkeep-debits-primary-pool`; the Design Reference Wiki page whose `sources` include `phaseEssenceSources.ts` or `ascendant-milestone-beats.ts` updated (blocking gate).
- [ ] (10) Gates: `npm run gate` (code track: `npm test`, `npm run check:typecheck`, `npx vite build`, both freshness gates) and, since engine files change, the 30-tick CLI smoke and `npm run test:heavy`; `npm run gate -- --final` last before push. Closing commit body and PR body carry the line-anchored closer for this ticket.

## Coordination block

**Suggested model:** `opus` — four engine seams plus a UI row and a measured balance verdict.

**Parallel-safe with:** [THR-1746](https://linear.app/threadbare/issue/THR-1746) (glossary only); [THR-1702](https://linear.app/threadbare/issue/THR-1702) (leads and delves, disjoint files); [THR-1740](https://linear.app/threadbare/issue/THR-1740) (mortal forecast window, disjoint files); [THR-1744](https://linear.app/threadbare/issue/THR-1744) (playtest infrastructure).

**Mutex with:** [THR-1748](https://linear.app/threadbare/issue/THR-1748) — same `computeEssenceGeneration` / `phaseEssenceSources` surface; this lands first. [THR-1749](https://linear.app/threadbare/issue/THR-1749) — both edit `src/engine/essenceIncome.ts` (this adds the source-upkeep term; that re-keys the split). [THR-1713](https://linear.app/threadbare/issue/THR-1713) — both touch the ascendant bar's readouts (`src/components/Game/ascendant-bar/`); land one, rebase the other. Anything editing `src/engine/ascendantBeat.ts`, `src/engine/phaseAscendantProgression.ts` or `src/data/ascendant-beat-content.ts`.

**Files to touch:**
- Edit: `src/data/influence-content.ts` (E1), `src/data/__tests__/influence-content.test.ts`
- Edit: `src/data/ascendant-beat-content.ts` (remove the pool entry; four bucket entries)
- Edit: `src/data/ascendant-milestone-beats.ts` (two milestones, presentations, chronicle lines)
- Edit: `src/data/player-progression.ts` (ids, `WELLSPRING_MILESTONE_TICKS_AFTER_BOND`, `MILESTONE_HELD_GROUND_FLOWERING`)
- Edit: `src/engine/phaseAscendantProgression.ts` (two checks)
- Edit: `src/engine/ascendantBeat.ts` (`allGrantsHeld` in `isBeatEligible`)
- Edit: `src/engine/essenceSources.ts` (`chargeSourceUpkeep`, nurture skip), `src/engine/phaseEssenceSources.ts`, `src/types/essenceSource.ts` (`upkeepCurrent?`)
- Edit: `src/engine/essenceIncome.ts` (source term in the readout)
- Edit: `src/components/Game/ascendant-bar/selectors.ts`, `CovenantsBlock.tsx`, `src/data/ascendant-bar-content.ts`
- Edit: `src/data/game-config.ts` (E6 comment), `src/components/CMS/registry.ts` (constant rows)
- Edit: `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, the matching wiki page
- Create: the ledger test and the milestone/retirement/upkeep unit tests under `src/engine/__tests__/`

## Notes for the executor

- **Do not change `loc.place_of_power`'s effect.** Granting it is this ticket; making it actually create a place of power is the filed follow-up (§ Deferrals). Its technical-effect line is already honest.
- **Do not rename `hex.claim_dominion`** or its display text; THR-1746 owns the word.
- **Do not touch `TIER_PROMOTION_THRESHOLDS` comments** — they are right on the season calendar (§ Decided by delegation, item 5).
- **Do not pin a post-spine pool draw to a seed** in any test; removing the Wellspring shifts every seed's draw sequence.
- The live CLI check in Done-when 2 must quote the "before" number from `main`, not from THR-1745's doc, if the two differ; say so in the PR.
- The Wellspring may land slightly after tick 48 in a live run because the spine or a pending beat holds the slot. That is correct behaviour; Done-when 3's live part says how to report it.
- Import `resolveDoomWokeAtTick` into `phaseAscendantProgression.ts` from `doomClock.ts`; check for a module cycle (`reference_detection_recorder_module_cycle` is the precedent) and, if one appears, pass the resolved bond tick in from the orchestrator instead.

## Deferrals

- [**Place of Power never makes a place of power**](https://linear.app/threadbare/issue/THR-1751) — `loc.place_of_power` raises saturation only, and nothing writes `isPlaceOfPower`, so the +0.5 legacy income term and the card's own success line ("essence flows freely here") have no writer. Filed `Deferral`, same project, coordination block as first comment.

## Intent-judge verdict

- **Pass 1 (opus, cold): Revise.** Three gaps: E3's check sat after `isBeatEligible`'s early return, so investment beats with no eligibility would never retire; E2 read raw `wokeAtTick` instead of `resolveDoomWokeAtTick`, which would have stranded old saves without the source verbs; Done-when had dropped the ticket's two predicates (two tier-3 threads with no ground; Wellspring by tick 60 on three seeds). Plus a miscount (10 → 12 investment beats). All four fixed above.
- **Pass 2 (opus, cold, judged from scratch): Allow.** Two recommended inline fixes, both applied: the fail-soft row for a throwing `allGrantsHeld` now names the check's own `try`; Done-when 3's live predicate is pass/fail, with the remedy in scope.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->
<!-- Auditors ran on the pre-revision draft; the revisions above tightened Engine wiring and Done-when only and changed no NFP, pillar or Vision claim except adding the Vision citations the Vision auditor asked for. -->

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | All new numbers named constants with CMS rows (`TIER_MAINTENANCE`, `WELLSPRING_MILESTONE_TICKS_AFTER_BOND`, `MILESTONE_HELD_GROUND_FLOWERING`); ledger reproducible from them. |
| 2. Inspectability | PASS | `source_upkeep` trace on paid/unpaid flips; `skipped: 'all_grants_held'` on the milestone trace; `upkeepCurrent` column in the Essence Sources tab; wiring table complete. |
| 3. Determinism | PASS-with-note | No PRNG added; threshold/graph-order writers only. Removing the Wellspring from the pool shifts every seed's post-spine draw sequence — acknowledged. |
| 4. Fail-soft | PASS | Table covers missing ascendant/pool, short pool, missing hosts, null `wokeAtTick`, held grants, `allGrantsHeld` throw (fail-open). Unpaid sources stall, never lapse. |
| 5. Narrative over mechanical | PASS | Unpaid ground "will not grow"; milestones narrate, no numbers. |
| 6. Additive over destructive | PASS-with-note | One removal (Wellspring leaves `ASCENDANT_BEAT_POOL`), template kept for old histories; everything else additive. |
| 7. Performance budget | PASS | O(controlled sources) per tick, same shape as `countControlledSources`; no new phase. |

Note: `Docs/plans/wiring-checklist.md` (507 KB) exceeded the read limit; wiring assessed from the plan's own wiring and fail-soft tables.

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | E1–E6 specify systems design, graph changes (one optional field), tick phases, resolution, PRNG callouts with determinism note; constants, tracing, fail-soft, blast radius present. |
| Content | present-and-substantive | No new encounter/attachment content (explicit "None"); two milestone prose entries and two chronicle lines quoted in full; data constants listed. |
| UI | present-and-substantive | Player-facing display change, player-facing text table with complaint classes, playtest predicate, notifications, debug inspection, HexMapV2 "None", screenshot tool (Playwright). |

Missing required sections: none. Wiring: present, every module mapped to phase, component, field, trace and debug surface; prose pipeline and controls addressed. Substrate: present, every row extends or activates; `chargeSourceUpkeep` extends `phaseEssenceSources` rather than rebuilding it; no existing upkeep mechanism found in the essence-sources inventory entry.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` weight of threads — confirmed (upkeep values + Arm C); cadence-not-pacing — extended (Wellspring at a fixed moment); `02-non-negotiables.md` #2, #3, #4, #6, #7 — confirmed; #1 god-not-protagonist — silent (no direct control added); `01-core-loop.md` — not touched; taste profile "numbers in UI" / prose-first — confirmed.

Contradictions: none.

Checks: north star PASS; core loop PASS; non-negotiables PASS; design tensions NOTE — leans to legibility over mystery, tension 4 not named in the Vision section (**since addressed**: the Vision section now cites tension 4 and the Vision files by path); taste profile NOTE — the essence bar still shows numbers (pre-existing, not claimed changed).

VISION AUDIT: PASS-with-notes
