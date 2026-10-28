> **title:** Only the god's own hand fills the Mandate — THR-2081
> **linear_issue:** THR-2081
> **author:** Claude Code (design lane, run 2026-10-28b, unattended)
> **created:** 2026-10-28
> **three_pillars:** Engine done (who caused a push, a Mandate ledger, targets in points) · Content done (the Mandate's words stop promising "global strength") · UI done (one line of the Mandate detail drops its world-total numerals; every other reader is unchanged)

# Only the god's own hand fills the Mandate — THR-2081

*The Mandate is the win path essence is spent on, so it counts what the god spent essence to make, and nothing the world grew by itself.*

## Why this is load-bearing

Since [THR-1381](https://linear.app/threadbare/issue/THR-1381), finishing the Mandate ends the age. Today the Mandate compares the world's whole total of the god's two spheres against a baseline. New towns, newborn mortals and trade drift fill it while the god does nothing. In the measurements on [THR-2081](https://linear.app/threadbare/issue/THR-2081), two of four unattended worlds ended their age that way. This plan builds the ticket's decision and fits its targets to what a playing god can actually do. Until now nobody had measured that.

**Measured** on [`proto/thr-2081-mandate-drift`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2081-mandate-drift) (`scripts/_scratch-2081b.ts`, never merged; `main` @ a2e88585, medium). The census turns the world-total rule off (targets 99, no checkpoints), so the age cannot end on drift, and reads two ledgers off the `sphere_pressure` traces. A **scripted god** spends essence every tick it can afford, through the real player-cast path, on the cheapest card of each Mandate sphere that targets a place or sublocation (`godloc`). `full` counts every rival and doom erosion against the god. `held` lets erosion take back only points the god put there. Points are weighted as the world total weighs them (place 1.0, mortal 0.2).

| world (Hunger, spheres) | arm | tick · doom | full P / S | **held P / S** | progress at 80 / 20 |
|---|---|---|---|---|---|
| `?seeded` 42 (Witness, mind / spirit) | idle | t300 · 0.32 | −69 / 0 | **0 / 0** | 0 |
| | idle | t600 · 0.71 | −88.8 / 1.0 | **0.2 / 1.0** | 0.03 |
| | godloc | t150 · 0.16 | 20 / 14 | **58 / 14** | 0.71 |
| | godloc | t300 · 0.32 | 4 / 17.2 | **78 / 17.2** | 0.92 |
| | godloc | t450 · 0.50 | −1.8 / 19.2 | **84.2 / 19.2** | 0.98 |
| | godloc | t600 · 0.70 | 6.2 / 24.2 | **94.2 / 24.2** | 1.00 |
| | godloc, every other tick | t600 · 0.71 | −1.8 / 23.2 | **86.2 / 23.2** | 1.00 |
| seeded 42 (Kindle, energy / life) | idle | t450 · 0.50 | −68.8 / −772 | **1.2 / 0** | 0.01 |
| | godloc + claims | t600 · 0.71 | −88.8 / −781 | **3.2 / 5.2** | 0.15 |
| CLI 42 (chaos / energy) | idle | t600 · 0 (doom asleep) | 0 / 0 | **0 / 0** | 0 |
| CLI 99 (energy / light) | idle | t450 · 0 | 0 / 0 | **0 / 0** | 0 |
| CLI 7 (time / energy) | idle | t450 · 0 | 0 / 0 | **0 / 0** | 0 |
| | godloc | t450 · 0 | 7.2 / 0 | **7.2 / 0** | 0.05 |

The godloc god's cheapest place cards: mind `sub.vision` (1 essence, a sublocation), spirit `action.consecrate` (4, a sustained control), life `loc.bless_harvest` (4). Energy has none (Decision 5). Time falls back to `divine.coincidence` on mortals. Casting only every other tick barely changes it (86.2 against 94.2 by t600), because the binding limit is income, not the cadence. The census weighs a hex at 0, while the world total weighs it 1.0, and the policy never picks a hex card. So hex-targeting cards, which several spheres have (time's `divine.perceive.taste_the_wake`, for one), are uncounted here. The CLI 7 time row understates what a time god can do.

What the numbers say:
- **An unattended god earns almost nothing.** Attunement and the First's carry leave about 1 point; the First's own scenes leveled no Mandate sphere where it stood (0.000 on every arm). The ticket's predicate holds by construction.
- **Full wear puts every god in a hole that depends on its Hunger.** An unattended Witness world is at −69 mind points by tick 300; a Kindle world's life half is at −772 by tick 450. Under `held`, the same worlds sit at 0.
- **The old 18 % / 10 % targets are the wrong unit.** They are 28.7 / 32.3 points on the seeded route, 3.5 on CLI 42's chaos and 144 on CLI 99's energy. The seeded god cleared the mind half by tick 57 on a 1-essence card.
- **The scripted god spends everything and still plateaus** once its opening pool is gone (income about 0.2 essence a tick after tick 150). It holds 84 mind and 19 spirit points at doom 0.5, and crosses 80 / 20 at about doom 0.55.

## Decisions this plan builds on

**From the ticket ([decision comment](https://linear.app/threadbare/issue/THR-2081), design lane 2026-10-27, by delegation; window closed 08:29Z with no veto):** only growth the god causes counts; rivals and doom wearing it down subtract.

**Decided by delegation in this plan (design lane, 2026-10-28; veto in chat):**

1. **A push names who caused it.** `SpherePressureEvent` gains an optional `causedBy`. Measured: the four `source: 'divine_action'` pushes in `unifiedActionResolution.ts` fire for *every* resolved action whose template carries a sphere, mortals' and rivals' included. Two writers the decision listed are not the god's either. `resolveOverchannel` (`magicPower.ts`) pushes on whichever agent overchannels, and a `ControlEffect` has an `ownerId` that may be a rival. So the god's share is decided by who acted, not by the tag. *Veto:* none expected; this is the plumbing.
2. **A threaded mortal's scene counts as the god's.** That was the decision's lean. Measured contribution: 0.000 on every arm, so counting it cannot carry an unattended world. *Veto:* "a mortal acting on their own should never count".
3. **Rivals and doom take back only what the god built.** Wear on a place debits the ledger up to the points the god credited there in that sphere. A raid on the god's ground still makes the Mandate slip back, which is the contest the decision kept. Wear on ground the god never touched no longer counts. Measured reason: full wear leaves the god −69 to −772 points before it acts, depending on the Hunger. That tenfold spread is the same defect the decision used to reject "raise the targets". *Veto:* "rivals wearing my spheres down anywhere should cost me".
4. **The targets are points of the god's own making: 80 for the first sphere, 20 for the second.** The unit is the same in every world. The values are fitted on **one** world, the seeded Witness route (mind / spirit), so that the scripted god spending everything finishes between doom 0.5 and 0.75 (it crosses 80 / 20 at about doom 0.55). Other Hungers are not fitted. A sphere's reach depends on its card supply, which is checked per Hunger in the Done-when, not tuned here. A real player earns more than the scripted god (threads, sources, claims), and also has to spend on doom. *Veto:* "a bigger world should need a bigger Mandate".
5. **This ships before energy cards exist, and the interim is stated.** No card a god can cast carries energy, so Kindle, Wander and Illuminate can move their energy half only through Dominion and attunement (Kindle with claims: 3.2 / 5.2 points held at doom 0.71 and still 3.2 / 5.2 at doom 0.89, t750). Until [THR-2086](https://linear.app/threadbare/issue/THR-2086) lands, those three Mandates cannot be finished by casting, and their age ends by doom. Law 32: both clocks are endings, and a doom ending still harvests. Today every Mandate can fill by drift whatever the Hunger: the world-total rule is the same for all 12 Hungers in `hunger-catalog.ts`. After this ship, the 3 of those 12 that carry energy are hard until energy cards land. That is why the plan does not wait. THR-2086 is raised to High. *Veto:* "hold the Mandate change until energy cards exist".

Rejected, one line each ([brainstorm](2026-10-28-thr-2081-god-caused-mandate-brainstorm.md)): attribution by `PressureSource` alone (counts every mortal's scene); looking the action up by `sourceId` at Mandate time (ties the Mandate to the action store, misses control effects and steps); full wear (above); a ledger floored at zero (a raid elsewhere still erases the god's work); keeping relative targets (above).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Mandate: `phaseMandate.ts` `evaluateSphereGrowthMandate`, settled baseline (THR-2080) | 🟢 ACTIVE | **extends**: progress reads the ledger; targets set at the settle |
| Sphere pressure: `phaseSpherePressure.ts` `resolveSpherePressure` (THR-1768 `sources`) | 🟢 ACTIVE | **extends**: hands the Mandate a credit per score point the god's or the opposition's writers moved |
| Sphere aggregation: `phaseSphereAggregation.ts` `ENTITY_AGGREGATE_WEIGHT` | 🟢 ACTIVE | **extends**: one exported weight helper, which `computeSphereAggregate` also uses |
| Dominion writers (`phaseDominion.ts` claim/seat/carry), attunement (`essenceEarned.ts`), THR-1935 prayer/aid | 🟢 ACTIVE | **reads**: written only for the god; counted by `source` |
| Unified resolution, control effects, encounter step, overchannel pushes | 🟢 ACTIVE | **extends**: set `causedBy` |

## Engine pillar

### Systems design
- `src/types/sphereAffinity.ts`: `SpherePressureEvent.causedBy?: string`, the actor whose act made the push.
- Writers set it: `unifiedActionResolution.ts` (attacker / defender / completing action's `actorId`, all four pushes), `phaseControlEffects.ts` (three pushes, `effect.ownerId`), `orchestrator.ts` encounter-step push (`progress.actorId`), `magicPower.ts` `resolveOverchannel` (`agentId`).
- New pure module `src/engine/mandateLedger.ts`:
  - `GOD_ONLY_SOURCES` = claim, seat, carry, attunement, prayer_answered, unbidden_aid. `OPPOSITION_SOURCES` = rival, doom.
  - `isGodCausedPush(p, graph, ascendantId)`: the source is god-only; or `causedBy === ascendantId`; or the source is `encounter` and the ascendant holds a `thread` edge to `causedBy`.
  - `mandateCreditsFor(entityId, weight, pressures, traces, isGod)`: for each trace whose score moved, if it leveled up, credit `Δscore × weight × godShare`. `godShare` is the god's pushes' magnitude in that sphere over all magnitude in it. If it eroded, emit a debit of `|Δscore| × weight × oppShare`, where `oppShare` is rival and doom magnitude in the opposite sphere over all magnitude there. Returns `MandateCredit[]` (`{ entityId, sphere, points }`).
  - `applyMandateCredits(ledger, held, credits, primary, secondary)`: credits add to the ledger and to `held[entity|sphere]`; debits take `min(held, |debit|)`. Pure.
- `phaseSphereAggregation.ts`: export `entityAggregateWeight(node)` (hex, location, artifact, actor by `actorType`), and have `computeSphereAggregate` call it. This is a pure extraction.
- `phaseSpherePressure.ts`: after each entity resolves, append its credits to `pendingMandateCredits`.
- `phaseMandate.ts` `evaluateSphereGrowthMandate`, behind `MANDATE_GOD_LEDGER_ENABLED`:
  - **At the settle tick:** set `primaryTargetPoints` / `secondaryTargetPoints` on the definition from the constants. Set `primaryTargetDelta = points / max(1, baseline)`, and rescale each checkpoint's required deltas to that delta × threshold. Every reader of the relative fields stays correct.
  - **Every tick:** fold `pendingMandateCredits` into `mandateState.godLedger` / `godHeld`. Set `primaryDelta = godLedger.primary / max(1, primaryBaseline)` (secondary alike). `primaryCurrent` / `secondaryCurrent` stay the world totals, for the debug readout.
  - **Flag off:** today's rule, byte for byte.

### Graph nodes / edges
None. The `thread` edge (ascendant → mortal) is read, not written.

### Tick phases
`sphere_pressure` (orchestrator Phase 6.639) writes `pendingMandateCredits`. The orchestrator clears it after `mandate` (slot `post-narrative`, same tick) reads it, beside the existing `pendingSpherePressures: []` reset. The Mandate's own milestone push (`source: 'mandate'`) is never the god's.

### Resolution logic · PRNG callouts
Shares are magnitude-weighted, deterministic arithmetic. No PRNG draw (NFP 3).

## Content pillar

`src/engine/mandateGenerator.ts` `generateRememberedMandate`: the default direction line and the culmination conditions stop citing "global strength" and percentages. The target now comes from points at the settle, and the tracker already dropped numerals (THR-1424):
- direction default: `Raise ${P} and ${S} in the world by your own hand before the doom clock closes`
- culmination conditions: `Your hand has raised ${P} far enough.` / `Your hand has raised ${S} far enough.`
- the setup and escalation conditions drop their `+N%` and `By N% doom` clauses: `By ${label}: ${P} raised by your hand, on pace.` (the checkpoint's own omen label stays).

A Hunger's authored `mandateDirection` is untouched. Encounter templates, prose tables, attachment content: N/A, nothing else names the Mandate's arithmetic.

## UI pillar

`src/components/Game/MandateDetail.tsx` `MetricTrack`: today the line `Baseline X → Current Y` prints the world totals, which no longer move the bar. **The line drops its numerals.** It becomes the words `Raised by your own hand` (or, for a sphere none of the god's cards carries, `<Sphere> rises only slowly, through your bond with the land; none of your cards carries it yet.`), beside the existing bar and the delta cluster, which already read the god's share through `primaryDelta` / `target`. The ledger stays a number only in the debug readout and the trace. Every other reader is unchanged: the tracker, `MandateBlock`, the god rail's trend word and the summary cards read `progress` / `primaryDelta`, which now mean the god's share.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| `MandateDetail` sphere-rise track | "Raised by your own hand" (was "Baseline 159 → Current 180") | PC-6 (one fact told two ways: the old numbers rose while the bar did not) | The bar, the cluster and the line now say the same thing: how far the god's own work has gone |
| Generated direction, rendered for a Witness god without an authored line | "Raise Mind and Spirit in the world by your own hand before the doom clock closes." | PC-1 (what fills the Mandate) | The sentence names the rule: only the god's doing counts |
| Culmination condition, rendered | "Your hand has raised Mind far enough." | PC-1 | A state, not a quota; the bar shows how far |
| Setup condition, rendered | "By the First Omen: Mind raised by your hand, on pace." | PC-2 (a checkpoint decided by rules unseen) | The omen names what it checks: the god's own rise, at this point in the doom |
| Tracker, a watching god | "NEW" stays (progress 0) | PC-8 (the player acts and nothing answers) | A god that casts sees the bar move the same tick, because credits land in the tick they resolve |
| Sphere-rise track, a sphere none of the god's cards carries (rendered for Kindle) | "Energy rises only slowly, through your bond with the land; none of your cards carries it yet." in place of "Raised by your own hand", beside the existing "unmoved" cluster | PC-1, PC-7, PC-8 | It says what still moves the half and why casting does not. It names only what the census shows moving energy (attunement and carry: the idle Kindle arm reaches 3.2 with no claims, and claims 11 → 13 added nothing). The rule is `sphereHasAscendantCard(sphere)` over `UNIFIED_ACTION_TEMPLATES`, the census's own filter. When THR-2086 lands, the line returns to "Raised by your own hand" with no further edit |

### Laws, verify, playtest signal

UI Laws engaged: 13 / 14 (the line names the god's own doing), 15 (no numeral for a unitless proportion; the line now carries none), 21 (one reading per concept). Vision non-negotiable 3, "all mechanics surface through prose", is kept: the plan removes a numeric line rather than adding one. **Browser-verify:** small visible fix (one line, under 400 UI lines), so one 1920×1080 Playwright screenshot of the open Mandate detail on `?view=game&seeded&size=medium` after `window.__DEBUG.tick(150)`.

### Playtest signal

A god that only watches sees its Mandate sit at New. A god that works its spheres sees the bar move with its casts, and slip back when a rival raids ground the god built.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `mandateLedger.ts` | `sphere_pressure`, `mandate` | `MandateDetail` | `pendingMandateCredits` (new, transient), `mandateState.godLedger` / `godHeld` (new) | `mandate_ledger_credit` (new) | trace viewer; CLI `eval state.mandateState.godLedger` |
| writer `causedBy` | resolution, control effects, overchannel | none | `pendingSpherePressures` (existing) | `sphere_pressure` (unchanged) | trace viewer |
| `scripts/mandate-census.ts` (the proto census, promoted) | none | none | none | none | `npm run census:mandate`, the Done-when |

Wiki: [`public/clocks-reference.html`](https://github.com/christianspliid-ui/threadbare/blob/main/public/clocks-reference.html) sources `phaseMandate.ts`. Its Mandate paragraph gains "counts only what the god's own hand raised, against 80 / 20 points". The systemic wiring guide gains one line: a new pressure writer sets `causedBy`, or its push never counts toward the Mandate.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Sphere pressure → Mandate | **add** | producer `phaseSpherePressure` writes `pendingMandateCredits`, consumer `phaseMandate` (production read site). New `scripts/interface-contracts.ts` entry `sphere-pressure-credits-mandate` + `Docs/canon/interface-map.md` line under Mandate |
| Pressure writers → `SpherePressureEvent` | **extend** | optional `causedBy`; absent reads as not the god's |
| Mandate → UI (`progress`, `primaryDelta`, targets) | preserve | same fields, new meaning (the god's share) |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MANDATE_GOD_LEDGER_ENABLED` | `true` | kill switch; `false` is today's world-total rule |
| `MANDATE_PRIMARY_TARGET_POINTS` | 80 | weighted points the god's hand must raise in its first sphere. Fitted on the seeded Witness route only (scripted all-in god: 84.2 at doom 0.50) |
| `MANDATE_SECONDARY_TARGET_POINTS` | 20 | the same for the second sphere. Seeded Witness only (19.2 at doom 0.50) |

`MANDATE_PRIMARY_TARGET_DELTA` / `MANDATE_SECONDARY_TARGET_DELTA` stay and are the flag-off path. All in `src/data/game-config.ts`, Mandate Pacing block.

## Tracing

```ts
interface MandateLedgerCreditTrace {
  category: 'mandate_ledger_credit';
  tick: number;
  entityId: string;
  sphere: SphereName;
  /** Signed weighted points: + the god's growth, − opposition taking back held points. */
  points: number;
  cause: 'god' | 'opposition';
  /** The writers netted into the trace this credit came from (from SpherePressureTrace.sources). */
  sources: PressureSource[];
  ledgerAfter: number;
}
```
Emitted by `phaseMandate` only for the Mandate's two spheres. The census and the trace viewer answer "why did my Mandate move" from it (NFP 2).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| a push without `causedBy` | not the god's (an unlisted writer can never inflate the Mandate) |
| a credited entity removed from the graph | its `held` entry stays and is never debited; a removed place was already gone from the world total |
| `pendingMandateCredits` absent (old save, flag off) | ledger unchanged; progress reads the ledger it has |
| `godLedger` absent on a pre-build save | starts at 0 at load; the bar reads 0 until the god acts |
| a baseline of 0 | `max(1, baseline)`, as `computeSphereDelta` already does |

## Blast Radius

`src/engine/orchestrator.ts` (162 importers) gains one field on one push and one cleared field after `mandate`: no signature change. `src/types/gameState.ts` (865 importers) gains one optional field: additive, no reader breaks. `src/types/sphereAffinity.ts` (56) gains one optional field.

## Done when

- [ ] `npm run census:mandate` (the proto census promoted to `scripts/mandate-census.ts`, `idle` and `godloc` arms, ledger read from `mandateState.godLedger` instead of re-derived from traces) shows an **unattended** Mandate below `progress` 0.5 at doom 0.75 on `?seeded` medium 42 and on CLI seeds 42 / 99 / 7. On the CLI seeds, where doom sleeps, it holds through tick 900. Prototype: 0.03 / 0 / 0 / 0.
- [ ] The same census's **scripted all-in god** on the seeded route completes both halves between doom 0.5 and 0.75 (prototype: about 0.55). If not, refit the two point constants on that run and record the numbers in the status fragment.
- [ ] A **Hunger sweep**: the census runs the all-in god (place and hex cards, weighted as the world total weighs them) on the seeded route once per Hunger in `hunger-catalog.ts`. It prints each Hunger's progress at doom 0.75 into the status fragment. This is report-only; the kill criterion reads it.
- [ ] `mandateLedger.test.ts`: a mortal's resolved action with a sphere credits nothing, and so do a rival-owned control effect and a mortal's overchannel. The god's cast credits its magnitude-weighted share times the entity's aggregate weight, and a threaded mortal's encounter step credits. A rival erosion on a place the god never touched debits nothing; one on a place it built debits at most what it built.
- [ ] `phaseMandate` test: with the flag off, progress equals today's world-total rule on the same fixture; with it on, the settle tick writes `*TargetPoints` and the rescaled checkpoint deltas.
- [ ] One 1920×1080 screenshot of the open Mandate detail on `?view=game&seeded&size=medium` after `window.__DEBUG.tick(150)`, showing the track line `Raised by your own hand` with a moved bar. The rulebook and quick-reference sentences land. `npm run gate` is green.

## Kill criteria

- A cold or warm playtest round shows a playing god finishing the Mandate before doom 0.3, or never past Stage I by doom 0.75. Refit the point constants on that round's run; the decision stands.
- The census's unattended arm ever credits more than 5 points in either sphere: an attribution leak. Turn `MANDATE_GOD_LEDGER_ENABLED` off and find the writer.
- Per-Hunger reachability (the Done-when's Hunger sweep): a Hunger with no energy sphere whose all-in scripted god, now picking place **and hex** cards, stays below half its target at doom 0.75. A constant cannot fix a missing card, so file that sphere's card gap beside THR-2086 instead of refitting. Energy Hungers are expected to fail until THR-2086.

## Three-pillar check

- [x] Engine pillar present (attribution, ledger, targets)
- [x] Content pillar present (the generated Mandate words)
- [x] UI pillar present (one detail line loses its numerals; browser-verify named)
- [x] Wiring section connects them

## Vision audit

- [x] Law 30 ("one purse pays for both") becomes true of the Mandate: it moves only on essence spent. Law 32 is unchanged (both clocks remain endings). Law 13: the world still lives and grows; it no longer wins for the god. Law 42: no new mechanism, because the ledger reads the pressure pipeline the world total already reads.
- [x] No Vision edit needed.

## Rulebook impact

- [x] One rule of play changes. `Docs/canon/rulebook.md` §8 "The Clocks", after "Pushing the Mandate harder consumes essence…": "The Mandate counts only what your own hand raised in your two spheres, and a rival or doom wearing that ground down takes it back [IMPL — THR-2081, `mandateLedger.ts`]."
- [x] `Docs/canon/rulebook-quick-reference.md`: the Victory Mandate sentence gains "(it counts only what the god's own hand raised)".

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | three named constants; the shares come from the pushes' own magnitudes |
| 2. Inspectability | PASS | `mandate_ledger_credit` names the writers behind every point |
| 3. Determinism | PASS | no PRNG; magnitude arithmetic only |
| 4. Fail-soft | PASS | table above; an unattributed push never counts |
| 5. Narrative over mechanics | PASS | the Mandate reads as the god's own work, which its words always claimed |
| 6. Additive | PASS | optional fields only; flag off is today's rule |
| 7. Performance | PASS | one pass over traces the phase already builds; `godHeld` grows only with places the god touched (about 150 casts a run in the census) |

## Coordination block

**Suggested model:** opus. A cross-system write across six writer sites plus a ledger whose attribution must be exact.
**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) and [the loan's collection](https://linear.app/threadbare/issue/THR-2044). Neither touches the Mandate, sphere pressure or the pressure writers.
**Mutex with:** anything editing `phaseSpherePressure.ts`, `phaseMandate.ts`, `mandateGenerator.ts`, `MandateDetail.tsx`, the four `divine_action` pushes at the end of `unifiedActionResolution.ts`, or the Mandate Pacing block of `src/data/game-config.ts`. [THR-2086](https://linear.app/threadbare/issue/THR-2086) (energy cards) touches only card data. It is parallel-safe and **not** a blocker (Decision 5): until it lands, the three energy Hungers' ages end by doom.

**Files to touch:**
- New `src/engine/mandateLedger.ts` + `src/engine/__tests__/mandateLedger.test.ts`
- Edit `src/types/sphereAffinity.ts`, `src/types/mandate.ts` (`godLedger`, `godHeld`, `*TargetPoints`), `src/types/gameState.ts` (`pendingMandateCredits`)
- Edit `src/engine/phaseSpherePressure.ts`, `phaseMandate.ts`, `phaseSphereAggregation.ts`, `unifiedActionResolution.ts`, `phaseControlEffects.ts`, `magicPower.ts`, `orchestrator.ts`, `mandateGenerator.ts`
- Edit `src/data/game-config.ts`, `src/components/Game/MandateDetail.tsx` (+ a pure `sphereHasAscendantCard` helper beside the Mandate view selectors in `src/engine/views/subjects/godSheet.ts`, with a test)
- New `scripts/mandate-census.ts` + `census:mandate` in `package.json`
- Docs: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `public/clocks-reference.html`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`

## Notes for the executor

- Do not re-derive the ledger from traces in the engine as the census did. Compute credits inside `phaseSpherePressure`, where the pushes and their magnitudes are in hand; the census's count-based shares were an approximation.
- The census credited every `control_effect` push to the god. Use `causedBy === ascendantId` as specified; a rival's control effect must not count.
- `MANDATE_COUNTER_OMEN_MARGIN` (0.02) stays a relative margin on the rescaled deltas. Do not convert it.
- Do not add energy cards here ([THR-2086](https://linear.app/threadbare/issue/THR-2086)).
- The proto census is on [`proto/thr-2081-mandate-drift`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2081-mandate-drift) (`scripts/_scratch-2081b.ts`, raw output `scripts/_scratch-2081b-results.md`).

## Intent-judge verdicts

**Run 1 (2026-10-28, opus, cold): Revise.** The UI pillar had no `### Player-facing text` table. The 80 / 20 fit claimed every world but was measured on one. The kill criterion already fired on two census worlds. The energy interim was unstated, and two census arms were swapped in the table. All five were fixed.

**Run 2: Revise.** The energy-half row was marked "unexplained", so it needed quoted words (PC-1 / 7 / 8). A Kindle figure cited a tick not yet in the pushed results. Both were fixed, and the results were re-pushed through t750.

**Run 3: Allow** (Reversible, confirmed). Every dimension passes. Advisory: the census shows claims never moved energy, so the line must not promise they do. *Taken:* the line now reads "through your bond with the land".

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-28*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 1–5 pass. **6 (note):** `progress` and `primaryDelta` keep their names but change meaning when the flag is on, and the settle tick rewrites the target and checkpoint deltas. The plan states "same fields, new meaning", and the flag restores the old meaning. **7 (note):** per-tick cost is asserted, not profiled. *Lane response:* the census's per-arm wall time is the build's check, and `godHeld` is bounded by the god's own casts (about 150 a run).

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine and Content are present and substantive, and the substrate inventory extends, with no duplication. The UI pillar lacked the template's `### Player-facing text` table and the PC-n check. *Fixed in this revision:* the table now quotes every changed string with rendered samples and answers PC-1, PC-2, PC-6 and PC-8.

### Vision audit

**First pass, VISION AUDIT: REVISE.** The UI line "By your hand X of Y" put a new number on a player surface, against non-negotiable 3 ("all mechanics surface through prose, never numbers") and the taste profile's prose-first UI. *Fixed:* the line now drops its numerals entirely ("Raised by your own hand"). **Re-audit, VISION AUDIT: PASS.** There are no contradictions, and the rendered strings carry no numerals. `[design-brief-stale]`: `Docs/design-brief.md` has no Vision summary section.
