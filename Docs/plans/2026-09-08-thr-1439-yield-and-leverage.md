> **title:** `Yield and leverage — the active harvest of a held Location, raising a route's volume, stealing a secret, calling in a favour — THR-1439`
> **linear_issue:** THR-1439
> **author:** `Claude Code`
> **created:** 2026-09-08
> **three_pillars:** Engine `done` · Content `done — four grid notes, four lexicon lines; no encounter prose` · UI `done — four codex cards, the roster's doing-line and the sheet's Means word derive; the secrets strand shows a stolen mark and a favour called in; browser-verified on the codex and a sheet`

# Yield and leverage — THR-1439

*The last band on the map: four cells the grid decided on 2026-09-03 and nobody has built — harvesting a held Location, raising a route's volume, stealing a secret, calling in a favour. Each moves a quantity a phase already pays or a system already spends, so every one lands on a reader that exists.*

## Why this is load-bearing

The wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396) set the band order on [THR-1399](https://linear.app/threadbare/issue/THR-1399): readers → dormant kinds → people-things → **yield and leverage**, the band that opens no new subsystem and instead makes the economy the cells already touch *worth touching*. THR-1428 paid the passive half of Christian's yield ruling ([THR-1397](https://linear.app/threadbare/issue/THR-1397): *"both halves — passive trickle from holding; use × location the active harvest"*): a seized route's toll, a held Place's yield and a controlled Location's tithe are paid every `HOLDING_INCOME_INTERVAL_TICKS` by `holdingIncome.ts`, and the **Means** word on the mortal sheet and the faction sheet renders `wealth` as a tier — which was the standing rider *"wealth visible on the sheet before any yield cell ships"*, and it is paid. What is missing is the active half: nothing a mortal *does* moves wealth in a lump, a route's volume rises only through trade, a mark can be pressed or burned but never taken, and the favour class of Agreement is minted by encounters and never by a mortal's work.

Christian's four lines, verbatim on the grid: **use × Location** — *"Yield is a verb: the active harvest of a held Location — holding court, taxing a market, drawing a tithe. Op needed: `draw_yield`, moving a lump of the Location's stock into the holder's wealth at a cost to the Location's prosperity or the holder's standing there; the Location's productive Places are the multiplier"*; **raise × Route** — *"A merchant's expansion work writing a lump of volume onto the lane. Op needed: `raise_route_volume`"*; **seize × Agreement** — *"Stealing a secret — the `knows_secret_of` edge moves from holder to thief (the seize × Item shape), motive-gated against the holder. The holder loses it, never a copy, or theft is free. Op needed: `steal_mark`"*; **use × Standing** — *"Calling in a favour: a work that spends some standing with a person or faction to mint an `owes_favor` edge — the favour class of Agreement … Spending it is use × Agreement, forgiving it destroy × Agreement, both live: the favour class gets its whole life cycle from this one new op. Op needed: `mint_favor`."*

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Mortal Economy & Prosperity — `holdingIncome.ts` (`titheMultiplier`, the `wealth_delta` funnel, THR-1428), `wealth.ts` (`applyWealthDelta`, `readWealth`, `getWealthTier`), `phaseProsperity.ts`, `phaseEconomicTraits.ts` | 🟢 ACTIVE | **extends** — `draw_yield` moves a lump through the same funnel the trickle uses; prosperity's own pulse reads the cost |
| Mortal Economy & Prosperity — `tradeRoute.ts` (`volume`, `TRADE_ROUTE_MAX_VOLUME`, decay), `holdingIncome.ts:111–113` (the toll scales on `volume × taxRate`) | 🟢 ACTIVE | **extends** — `raise_route_volume` writes the quantity the toll and the trade phase read |
| Secrets & Favors — `knows_secret_of` (`mintLeverageMark`, `pressTheMark` at `strategicGraphOps.ts:663, 738`), `owes_favor` (`secretGeneration.ts:471`, `strategicGraphOps.ts:752`), `phaseSecretsFavors.ts`, `secretsFavorsConsequences.ts:267` (redemption), `graphOpExecutor.ts:782` (the encounter-side `redeem_favor`), `socialLeverage.ts`, the sheet's secrets strand (`agentDetail.ts:804–819`) | 🟢 ACTIVE | **connects** — a stolen mark and a called-in favour land on edges every one of these already reads |
| Reputation & Influence — `applyReputationWithDelta` | 🟢 ACTIVE | **connects** — the favour's price and the harvest's resentment are standing deltas |
| Ambitions & Undertakings — the registry, `edgeTypes` (THR-1436), `eligibility` (THR-1438), the one resolver | 🟢 ACTIVE | **extends** — four verbs; the Agreement shape widens to the favour class |
| World Generation, Terrain & Places — `placeClassOf`, `PLACE_CLASSES` | 🟢 ACTIVE | **connects** — the productive Places are the harvest's multiplier |

**Grep evidence (measured 2026-09-08 on `main` 30c578cb).** `LOCATION` declares create · raise · lower · claim · seize · destroy, held through `controls` / `owns`; `ROUTE` declares create · lower · use (`conduct_trade`) · claim · seize, held through `owns`; `AGREEMENT`'s shape is `knows_secret_of` with `isMarkEdge` (unrevealed) and declares create · use (`press_the_mark`) · destroy (`expose_mark`) — **the favour class is not an Agreement object today**; `STANDING` declares raise · lower · destroy. `owes_favor` is written by two sites with `{ magnitude, context, grantedTick, redeemed, broken }` (subject → holder, `validateEdgeEndpoints` enforces actor ends); `redeemed` is read by the sheet, the secrets phase, `secretGeneration` and the encounter-side `redeem_favor` op. `holdingIncome.ts` pays `WEALTH_CONTROLLED_LOCATION_TITHE` × `titheMultiplier(prosperity)` (bands at `HOLDING_TITHE_PROSPERITY_THRESHOLDS`, multipliers `[0.5, 1, 2]`) every 12 ticks; prosperity is a 0–100 number the location actions move by ±6–12. `retargetEdgeSource` (`graph.ts:197`) reindexes an edge's source (THR-1437). The **Means** word renders on `OverviewTab.tsx:603` and `FactionSheet.tsx:335` (THR-1428). Seeded worlds (THR-1437): 6 route identity nodes unowned, 1 · 2 marks, standing objects 72 · 72, controlled Locations 112 · 129 (factions), 0 held by a mortal at tick 0 — a mortal's harvest waits on a `claim × Location`, which the census shows starting 8 · 0 times in 150 ticks.

## Engine pillar

### Systems design

**use × Location — `draw_yield`.** Ownership `own` (the actor `controls` or `owns` the Location, as the registry reads it). Eligibility: the Location was not drawn within `YIELD_DRAW_COOLDOWN_TICKS` (`properties.lastYieldDrawTick`), refused `ineligible:drawn_recently`. Completion: `drawYield(graph, holderId, locationId, tick, projectId)` — the lump is `round(YIELD_DRAW_BASE × titheMultiplier(prosperity) × (1 + YIELD_PLACE_MULTIPLIER × min(productive, YIELD_DRAW_MAX_PLACES)))`, where *productive* counts the Location's Places whose `placeClassOf` is in `YIELD_PRODUCTIVE_PLACE_CLASSES` (commerce); the lump goes to the holder through the same `wealth_delta` funnel `holdingIncome` uses (cause `draw_yield`); the Location pays `YIELD_DRAW_PROSPERITY_COST` off `prosperity` (floor 0) and the holder's standing *with the Location* moves by `-YIELD_DRAW_STANDING_COST` through `applyReputationWithDelta` (a `reputation_with` toward a Location is a Standing object the registry already enumerates) — both costs, small, so a greedy holder is both poorer in the town's eyes and drawing from a thinner well; `lastYieldDrawTick` stamped. Band scales the lump (`YIELD_DRAW_BAND_SCALE`: critical 1.5, success 1, success-at-cost 0.75, else 0 — a failed harvest still pays its costs, which is what makes it a risk). Reader: `phaseEconomicTraits` bands wealth into traits, the sheet's Means word moves, the prosperity pulse reads the drop, the economic chronicle line names it.

**change:raise × Route — `raise_route_volume`.** Ownership `own` (the actor `owns` the route's identity node — a claimed or seized lane). Eligibility: `volume < TRADE_ROUTE_MAX_VOLUME`, refused `ineligible:at_max_volume`. Completion: on the `trades_with` edge the identity node names (`routeEdgeId`): `volume = min(TRADE_ROUTE_MAX_VOLUME, volume + ROUTE_RAISE_VOLUME_DELTA × band scale)`, `lastTraded = tick` (the decay clock restarts — expansion is activity). Reader: `holdingIncome` (the toll scales on volume, so raising it raises the seizer's — or the owner's — income the same interval), the trade phase, the route decay clock, the map's route signifier where volume drives it.

**control:seize × Agreement — `steal_mark`.** Ownership `other`; motive gate against the holder (the edge's source, as `resolveObjectOwners` reads an edge object). Eligibility: the object is a mark (`isMarkEdge`), not a favour; the thief holds no unrevealed mark on the same subject already, refused `ineligible:already_holds`. Completion: `stealMark(graph, thiefId, edgeId, tick)` — `retargetEdgeSource(edgeId, thiefId)` (the id stays; every reader keys on source/target), properties gain `stolenFromId`, `stolenTick`, `source: 'stolen'`. The holder loses it, never a copy. Harm class `HARM_ON_SEIZE` (`holding_seized`) registers with the grievance lane as every seize does — the robbed holder may want it back. Reader: `pressTheMark`, `socialLeverage`, the secrets phase, the sheet's secrets strand, and the god's reading rule (THR-1433: a *followed* thief's mark now reads the subject's mind).

**use × Standing — `mint_favor`.** Ownership `own` (the standing's source is the actor). Eligibility: the target is an actor (`validateEdgeEndpoints('owes_favor')` rejects a Location; a favour from a town is not a thing), the standing reads `reputation_with.score ≥ FAVOR_STANDING_MIN` or, on a seeded `relates_to`, `sentiment ≥ FAVOR_SENTIMENT_MIN`, refused `ineligible:standing_too_thin`; no unredeemed, unbroken `owes_favor` from that target to the actor already, refused `ineligible:favour_outstanding`. Completion: `mintFavor(graph, actorId, targetId, tick, projectId)` — `applyReputationWithDelta(actor, target, -FAVOR_STANDING_COST)` (calling in a favour spends the standing it rests on), then the `owes_favor` edge in the shape `pressTheMark` writes (`owes_favor_${target}_${actor}_${tick}`, source the one who owes, target the one owed, `{ magnitude: FAVOR_MAGNITUDE × band scale, context: 'called_in', grantedTick, redeemed: false, broken: false }`). Reader: the favour-calling encounters and the binder (`remoteAnchor.ts`, `binder.ts`), the secrets phase, the sheet's favours row, and the two Agreement cells below.

**The favour class joins the Agreement kind.** `AGREEMENT.shape` becomes `{ edgeTypes: ['knows_secret_of', 'owes_favor'], edgeDiscriminator: isLiveAgreement }` (THR-1436's multi-edge shape; a mark is live while unrevealed, a favour while neither `redeemed` nor `broken`), one handle per ordered pair, the mark winning when both exist. Ownership: an edge object is held by its source — a mark by its holder, **a favour by the one who owes it**, which is right for `seize` (you steal a mark, never a debt) and wrong for `use`, so `AGREEMENT.ownershipOverride.use = 'any'` with eligibility *"the actor is the edge's target (the one owed)"* for a favour and *"the actor is the source (the holder)"* for a mark. `use × Agreement` on a favour redeems it through the funnel `secretsFavorsConsequences.ts:267` already has (the encounter-side `redeem_favor` op keeps its own path; both mark `redeemed: true`), and the redeemer's work is what the favour bought: `FAVOR_REDEEM_STANDING_GAIN` with the debtor's faction, or with the debtor when they have none — the one lump a called-in favour can pay without inventing a service. `destroy × Agreement` on a favour forgives it: `redeemed: true`, `forgivenTick`, and `applyReputationWithDelta(holder, debtor, +FAVOR_FORGIVE_STANDING_GAIN)` — forgiveness is generosity the debtor notices. `create × Agreement` stays the mark's (`mintLeverageMark`); a favour is created only by `use × Standing`. `tierOf` reads `magnitude` on both classes through the same bands.

**The division rule reaches all four** without a table change: gold → route, location, place (Magnate, Merchant, Steward); shadow → agreement, standing (Fence, Knife, Spider); heart → standing (Steward, Founder); dominion → use; devotion → raise; vengeance → seize; mastery → use.

### Graph nodes / edges

No new node or edge type. `location` gains `lastYieldDrawTick`; `trades_with.volume` and `lastTraded` are written by one more caller; `knows_secret_of` gains `stolenFromId` / `stolenTick` and `source: 'stolen'`; `owes_favor` gains `context: 'called_in'` and `forgivenTick`; `reputation_with` toward a Location is written by `draw_yield`'s resentment (the edge type already allows it).

### Tick phases

None new. Proposal in the candidate walk (2b), completion in the one resolver (2a.55); `holding_income`, the prosperity pulse, the secrets phase and the trade phase read what the cells wrote at their own cadence.

### Resolution logic

- Every completion reads `ctx.outcome` for its band scale and takes the `failure` arm (scale 0, costs still paid) when it is absent.
- The Agreement kind's ownership rule differs per verb through `ownershipOverride` + `eligibility` (THR-1438's hooks); no verb-specific branch in the resolver.
- One handle per ordered pair for Agreements, the mark winning — the same dedupe Standing uses.

### PRNG callouts

None. Bands come from the ladder that already rolled; lumps are arithmetic.

## Content pillar

### Encounter templates

N/A — no encounter or prose is authored. **Four grid notes** move from `wanted` to live in `scripts/undertaking-grid-dispositions.ts`, each with its op and its **Read by** line; the `use × Agreement` and `destroy × Agreement` notes gain a sentence for the favour class; the grid regenerates and the codex gains four cards.

### Prose tables

`src/data/undertaking-verb-prose.ts`: the `use` / `change:raise` / `control:seize` line-sets carry the four slots; the `place`, `route`, `mark` and `network` lexicons each gain one cell line where the generic verb line misreads — *using* a Location is holding court and drawing a tithe, *seizing* an Agreement is theft, *using* a Standing is calling in a favour. At most one line per cell.

### Attachment content

N/A.

### Data tables

- `src/data/undertaking-objects.ts` — four verbs; the Agreement shape and its per-verb ownership.
- `src/data/strategic-action-constants.ts` — the constants below.
- `scripts/undertaking-grid-dispositions.ts` — four notes, two amended.

## UI pillar

### Player-facing display

Four codex cards derive (THR-1434; a live cell without a phrase, glyph, lexicon line or note fails the build by name); the roster's doing-line derives (*holding court at Greycity — going well*, *stealing what Hask knows about Lirik*); the ledger's deed words (`UNDERTAKING_VERB_DEEDS`: *Drew the yield of*, *Raised*, *Stole*, *Called in*). The **Means** word on the sheet and the faction view already renders the wealth tier (THR-1428) and moves when a harvest lands. The secrets strand (`agentDetail.ts:804–819`) already lists marks and favours; a stolen mark reads *taken from Hask* and a called-in favour *called in* through `context`, one phrase each — the strand's renderer (`AttachmentsTab` / the secrets rows) gains the two phrases, no new row. UI Laws engaged: 4 (no numeral for wealth — the tier word), 13/14 (game words), 17 (verb tooltips), 21 (the Location and the mortal linked), 25 (no capability list), 56 (chips read state).

**Browser-verify:** Browser pane, 1920×1080, `?view=codex` with *Use a location* open; `?view=game&seeded&size=medium` with a controlled Location's holder drawn once through `window.__DEBUG.startUndertaking(agent, 'cell.use.location', { target, band: 'success' })` and the sheet's Means word before/after; console clean; `getUndertakingCodexCensus()` → 60 / 60 / no problems (56 after THR-1438; 53 if this lands first).

### Event notifications

The existing moment classes on a followed mortal; the economic chronicle line names a harvest (`economicChronicle.ts` reads `wealth_delta` causes — `draw_yield` joins the cause vocabulary). No new class.

### Debug inspection (DebugPanel)

`census:cells` for the four; the CLI `objects` readout's owned column for Agreement (favours now count) and Route; `window.__DEBUG.getStrategicHistory` shows the deed.

### Visual presence (HexMapV2)

None new — where route volume drives a signifier, a raised route reads as busier through the existing read.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/yieldOps.ts` (`drawYield`, `raiseRouteVolume`) | 2a.55 (completion); `holding_income`, prosperity and trade phases read | sheet Means, chronicle | graph (`wealth`, `prosperity`, `volume`) | `wealth_delta` (cause `draw_yield`), `strategic_world_change` | `census:cells`, CLI `objects` |
| `src/engine/leverageOps.ts` (`stealMark`, `mintFavor`, `redeemFavor`, `forgiveFavor`) | 2a.55; the secrets phase reads | secrets strand, sheet favours row | graph (`knows_secret_of`, `owes_favor`, `reputation_with`) | `strategic_world_change`; the secrets phase's own traces | `census:cells` |
| `src/data/undertaking-objects.ts` (four verbs, the Agreement shape) | 2b, 2a.55 | codex cards | graph | `strategic_candidate_board` (`ineligible:*`) | `getUndertakingCodexCensus` |

Player controls: N/A by design — mortals' work.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `YIELD_DRAW_BASE` | `3` | the lump a harvest draws before the prosperity and Place multipliers (three days of tithe) |
| `YIELD_PLACE_MULTIPLIER` / `YIELD_DRAW_MAX_PLACES` | `0.25` / `4` | each productive Place adds a quarter, at most four count |
| `YIELD_PRODUCTIVE_PLACE_CLASSES` | `['commerce']` | which Place classes multiply a harvest |
| `YIELD_DRAW_PROSPERITY_COST` | `4` | what a harvest costs the Location's prosperity (0–100) |
| `YIELD_DRAW_STANDING_COST` | `0.05` | what a harvest costs the holder's standing with the Location |
| `YIELD_DRAW_COOLDOWN_TICKS` | `12` | a Location is drawn at most once an income interval |
| `YIELD_DRAW_BAND_SCALE` | `{ critical_success: 1.5, success: 1, success_at_cost: 0.75 }` | the band scales the lump; other bands pay the costs for nothing |
| `ROUTE_RAISE_VOLUME_DELTA` | `2` | the volume an expansion work adds to a lane (cap `TRADE_ROUTE_MAX_VOLUME`) |
| `FAVOR_STANDING_MIN` / `FAVOR_SENTIMENT_MIN` | `0.6` / `0.3` | the standing a favour can be called in on (Respected, not merely Accepted) |
| `FAVOR_STANDING_COST` | `0.1` | what calling in a favour spends |
| `FAVOR_MAGNITUDE` | `UNDERTAKING_DEFAULT_MARK_MAGNITUDE` | the favour's weight, the mark's default |
| `FAVOR_REDEEM_STANDING_GAIN` / `FAVOR_FORGIVE_STANDING_GAIN` | `0.1` / `0.05` | what redeeming buys the holder with the debtor's faction; what forgiving earns with the debtor |

## Tracing

No new category. `wealth_delta` (existing) gains the cause `draw_yield`; `strategic_world_change` carries the four op names; the board's refusals gain the `ineligible:*` reasons above.

```ts
// wealth_delta cause vocabulary (existing union) — one more member
type WealthDeltaCause = /* existing */ | 'draw_yield';
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The holder lost the Location before completion | `ownershipOf` reads `other`; the resolver refuses `ownership_changed` |
| Prosperity already at the floor | the lump is the floor multiplier's; prosperity stays 0; the standing cost still applies |
| The route's `trades_with` edge is gone (decayed) | `raise_route_volume` fails `route_gone`; the identity node's GC is the decay phase's business |
| Volume reached the cap mid-work | completes at the cap, no refund |
| The mark was revealed or burned before completion | `steal_mark` fails `mark_gone` |
| The thief and holder are one (a mark on oneself) | eligibility refuses `ineligible:own_mark` |
| The favour target is a Location | eligibility refuses `ineligible:not_a_person` |
| `validateEdgeEndpoints` refuses the favour | `mint_favor` fails with the violation message; the standing cost is not spent |
| `ctx.outcome` absent | the `failure` arm — costs paid, nothing gained |
| A hook throws | `ineligible:error` — fails closed |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `undertaking-object-types` | 🟢 LIVE | **extend** — four verbs; the Agreement shape |
| `freehold-income-pays-mortal-holders` (THR-1428) | 🟢 | **extend** — the active harvest through the same funnel |
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — volume and wealth now written by cells |
| `secrets-favors-*` (whichever rows name `owes_favor` / `knows_secret_of`; audit-on-touch if ⚪) | — | **extend** — two more writers; a mark can move |
| `destroy-candidates-gated-on-motive` | 🟢 LIVE | **preserve** — the theft is gated like every seize |
| `yield-is-a-verb` | — | **add** — producers `drawYield`, `raiseRouteVolume`; consumers `holdingIncome`, the trade phase, `phaseEconomicTraits`, the Means word. Register in `scripts/interface-contracts.ts` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (notes and lexicon lines; encounter prose N/A with rationale)
- [x] UI pillar present (derived surfaces, the two secrets-strand phrases, browser-verify and Laws named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the living world (`00-north-star.md`: a favour called in, a grudge carried) and mortal sovereignty — every quantity here is a mortal's or a faction's, moved by a mortal's work; the god touches none of it directly.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: **a held Location can be harvested, at most once an interval, at a cost to the town and to how the town sees its holder; a claimed route's volume can be raised by work; a secret can be stolen and the holder loses it; a favour can be called in on good standing, spent, and forgiven.**
- [x] `Docs/canon/rulebook.md` § the economy and § secrets gain those sentences, marked `[IMPL]` by the executor in the same PR.

> Brainstorm companion: `Docs/plans/2026-09-08-thr-1439-yield-and-leverage-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | fourteen named constants; the band scale is a table |
| 2. Inspectability | PASS | `wealth_delta` with its cause, `strategic_world_change`, `ineligible:*`, `stolenFromId` on the edge |
| 3. Determinism | PASS | arithmetic on bands the ladder rolled; no draw |
| 4. Fail-soft | PASS | ten rows; hooks fail closed; a failed harvest still pays |
| 5. Narrative over mechanical perfection | PASS with note | a failed harvest costs the town and the holder's standing for nothing gained — greed with a price is the story |
| 6. Additive over destructive | PASS with note | the Agreement shape widens (a mark object is unchanged; favours join); the encounter-side `redeem_favor` keeps its path |
| 7. Performance budget | PASS | one edge walk per eligibility; nothing per tick |

## Done when

- [ ] Unit, on fixtures that falsify: `drawYield` pays the lump through the funnel and stamps the cooldown, costs prosperity and standing, scales by band, pays only costs on failure; a second draw within the cooldown is refused `ineligible:drawn_recently`; `raiseRouteVolume` caps and restarts the decay clock; `stealMark` moves the source and the holder no longer holds it, refused when the thief already holds one; `mintFavor` refuses a thin standing, a Location and an outstanding favour, spends the standing and writes the edge the encounters read; a favour redeems and forgives through the two Agreement cells and a mark still presses and exposes
- [ ] Generated small world on `cells`: a mortal who `controls` a Location (started through the review lever) is offered `cell.use.location` and the Means word tier can move; the Agreement kind enumerates both classes with one handle per pair
- [ ] `census:cells`, both seeds, 150 ticks: each of the four starts at least once across the two seeds **or** its refusal reason is recorded on the ticket (a harvest waits on a mortal's claim; a theft on a motive)
- [ ] The grid regenerates with four live notes; the codex census reads 60 / 60 / no problems (or 53 if this lands before THR-1438); the canon paragraph, the rulebook sentences, the interface row
- [ ] Browser-verify per the UI pillar; 30-tick CLI smoke; `npm run test:heavy`
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass
- [ ] Closing commit body includes `Fixes THR-1439`

## Kill criteria

- A holder harvests a Location every interval and the town's prosperity ratchets to 0 on the census seeds → `YIELD_DRAW_COOLDOWN_TICKS` doubles before the cost moves; the recorded rate goes on the ticket.
- A stolen mark still presses for its old holder → `retargetEdgeSource` did not reindex the outgoing side (THR-1437's finding on `updateEdge`); the fix is in the graph method, never a second edge.
- A favour called in on a Location or on oneself appears in any world → the eligibility hook reads the wrong end.
- Wealth appears as a numeral on any sheet → Law 4; the Means word is the only rendering.

## Coordination block

**Suggested model:** opus — four operations over three economies, one kind's shape widened with per-verb ownership, and band-read arms that must pay costs on failure.
**Parallel-safe with:** nothing on this map that edits the registry.
**Mutex with:** [THR-1438](https://linear.app/threadbare/issue/THR-1438) (both edit `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts`, the dispositions and the contracts; **THR-1438 lands first** — it introduces the `ownershipOverride` and `eligibility` hooks this plan reads; if this ticket is picked first, the executor adds the two hooks per THR-1438's § Systems design verbatim and says so); any ticket editing `src/engine/holdingIncome.ts` or `src/engine/secretsFavorsConsequences.ts`.
**Files to touch:** `src/engine/yieldOps.ts` (new), `src/engine/leverageOps.ts` (new), `src/data/undertaking-objects.ts`, `src/data/strategic-action-constants.ts`, `src/engine/economicChronicle.ts` (the cause word), `src/engine/agentDetail.ts` + the secrets-strand renderer (two phrases), `src/engine/undertakingDeed.ts` (four deed words), `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, tests: `src/engine/__tests__/yieldOps.test.ts`, `leverageOps.test.ts`, `yieldBandCells.test.ts` (generated world), plus `undertaking-objects.test.ts` and `undertakingCellWalk.test.ts` extensions.

## Notes for the executor

- **The wealth rider is paid** (THR-1428: the Means word on `OverviewTab.tsx:603` and `FactionSheet.tsx:335`); do not build a second rendering. **The capability rider** (*a completed work grows capability in the Reach it leaned on*, THR-1397) has no writer on `main` at 2026-09-08 (no `domainCapabilities` write in the lifecycle); it is filed as its own executor ticket by the handoff rather than folded into a band — build the four cells without it.
- **`draw_yield` goes through `holdingIncome`'s funnel**, not a second `wealth` write: grep `wealth_delta` in that file and call the same helper (extract it if it is inline), so the chronicle and the traits phase see one cause vocabulary.
- **The Agreement shape's per-verb ownership** is THR-1438's `ownershipOverride` + `eligibility`; if THR-1438 has not landed, add the two hooks exactly as its plan states and record the mutex was reversed.
- **`retargetEdgeSource`** (`graph.ts:197`) is the theft — the id stays so the edge's readers by id keep working; do not remove and re-add.
- **A favour's `source` is the debtor.** The edge runs subject → holder in `pressTheMark`'s shape; `mintFavor` writes `source: targetId, target: actorId`.
- **Bands must pay costs on failure** — that is what makes a harvest a risk rather than a button; the test asserts prosperity and standing moved on a `failure` band with no wealth gained.
