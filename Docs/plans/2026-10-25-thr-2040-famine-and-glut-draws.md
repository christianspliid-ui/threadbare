> **title:** Famine and glut draws — a hungry town tells hunger's stories, a town with grain to spare tells plenty's — THR-2040
> **linear_issue:** THR-2040
> **author:** Claude Code (design lane, run 2026-10-25f, unattended)
> **created:** 2026-10-25
> **three_pillars:** Engine done · Content done · UI done (debug readout only; no new player surface — § UI pillar)

# Famine and glut draws — THR-2040

*The world already knows which towns are starving and which have grain with nowhere to go; this makes the stories it tells there know it too.*

## Why this is load-bearing

[Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) lists six primitives the [mortal wealth plan](2026-10-15-thr-1936-mortal-wealth.md) left out. This is its **famine and glut draws** row: the *likelier when* column of the [money-encounter outcome table](https://linear.app/threadbare/issue/THR-1872), whose research found that *"nothing reads famine or glut — no scoring/filter reads `stockTier` or `scarcityArc`"*. That is still true on main @ e67e0517. The economic scoring term reads one number, prosperity (`economicContext.ts:122-131`).

Prosperity misses most famines. A headless census (seeds 42 / 99 / 7, medium map, 360 ticks each, `scripts/larder-census.ts` on the unmerged branch `proto/thr-2040-larder-census`) counted settlement-days:

| seed | hungry town-days | of those, prosperity *bust* | of those, not bust | town-days with a surplus day | surplus days at `foodBalance ≥ 0.75` |
|---|---|---|---|---|---|
| 42 | 45 (3.9 %) | 1 | 44 | 763 (66.5 %) | 56 % |
| 99 | 74 (4.6 %) | 31 | 43 | 814 (50.7 %) | 51 % |
| 7 | 60 (3.9 %) | 11 | 49 | 649 (42.1 %) | 32 % |

**136 of 179 hungry town-days (76 %) sit outside the bust band**, so the bust weights never fire there. In those towns the scenes that did fire were stargazing, flawed steel and scripture copying. The baseline for this plan's 18 rows, as their share of the firings in settlements:

| seed | famine rows in hungry towns | famine rows in all towns | plenty rows in glutted towns | plenty rows in all towns |
|---|---|---|---|---|
| 42 | 5 / 46 (10.9 %) | 80 / 1603 (5.0 %) | 54 / 1052 (5.1 %) | 79 / 1603 (4.9 %) |
| 99 | 1 / 75 (1.3 %) | 73 / 1766 (4.1 %) | 23 / 698 (3.3 %) | 65 / 1766 (3.7 %) |
| 7 | 2 / 76 (2.6 %) | 88 / 2017 (4.4 %) | 8 / 126 (6.3 %) | 69 / 2017 (3.4 %) |

On two seeds of three, a hunger scene is **rarer** in a hungry town than elsewhere. The surplus counter alone is a mature town's normal state (42–67 % of town-days), so *glut* needs a stronger test than "a surplus day" (§ Engine 1).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Mortal Economy & Prosperity — economic scene affinity (`economic-scene-affinity.ts`, `economicContext.ts`, THR-725) | 🟢 ACTIVE | **extends** — the affinity row gains two optional weights; a second pure term beside `computeEconomicContextBonus` |
| Encounter scoring (`encounterScoring.ts:1478-1494`) | 🟢 ACTIVE | **extends** — one additive term `larderContextBonus` in `baseScore`, on the same resolved `locationNode` |
| Unrest as pressure — hunger reading (`unrestPressure/hunger.ts` `isHungryToday`, settlement `hungerDays`, THR-1934) | 🟢 ACTIVE | **reads** — famine is exactly this reading; no second hunger test |
| Settlement economy — food meters (`settlementEconomy/growth.ts` `foodSurplusDays`; `phases/settlementEconomy.ts:720-751` `foodBalance`, THR-1923) | 🟢 ACTIVE (`SETTLEMENT_ECONOMY_ENABLED = true`) | **reads** — glut is a surplus run at a high food balance |
| Resource stock tiers (`phases/resourceStockTiers.ts`, THR-615) | 🟢 ACTIVE | **reads** as the fallback when a settlement carries no `foodStore` |

Population consumed: every hamlet/town/city/capital — 40, 56 and 55 settlements on the three census seeds, all carrying `foodStore` on every sampled day.

## Engine pillar

### Systems design

**1. `readLarder(graph, locationId)` → `LarderReading`** (new, `economicContext.ts`). Pure, no PRNG. Resolves a sublocation to its settlement by the same one-hop `parentLocationId` walk `resolveGoverningProsperity` uses.

- **Famine.** `isHungryToday(settlement)` returns `{ hungry, source }`. When `hungry` and `source === 'settlement_economy'` → `{ state: 'famine', deviation: min(1, max(1, hungerDays) / FAMINE_FULL_DAYS) }`. The first hungry day reads 0.2, the fifth and later 1.0: a famine deepens. When `hungry` and `source === 'stock_tier'` → the fallback depth below.
- **Glut.** Not hungry, `foodSurplusDays ≥ PLENTY_MIN_SURPLUS_DAYS` **and** `foodBalance ≥ PLENTY_BALANCE_FLOOR` → `{ state: 'glut', deviation: (foodBalance − floor) / (1 − floor) }`. At the floor the term is 0, so it grades in rather than switching on.
- **Fallback** (no numeric `foodStore`, i.e. settlement economy off or an old save): `isHungryToday`'s own `stock_tier` source (a scarce staple) → famine at `STOCK_TIER_FAMINE_DEVIATION`; a surplus staple → glut at `STOCK_TIER_GLUT_DEVIATION`. No second hunger test is written.
- Otherwise, and on every missing-data path → `{ state: null, deviation: 0 }`.

**2. `computeLarderContextBonus(reading, templateId)`** (new, `economicContext.ts`). `LARDER_SCORING_WEIGHT × deviation × weight`, where `weight` is the row's `famineWeight` or `glutWeight` (absent → 0), clamped to ±`LARDER_SCORING_CAP`. It mirrors `computeEconomicContextBonus` line for line. It is a **separate term** rather than folded into the prosperity one, so the trace can say which of the two moved a pick.

**3. Scoring.** `encounterScoring.ts` step 20b computes `larderContextBonus` right after `economicContextBonus`, from the `locationNode` it already holds, and adds it to `baseScore`. It also carries the value on the scored candidate (`:681`, `:1624`) and on the selection trace (`:1715`).

### Graph nodes / edges

None. Reads existing settlement properties (`hungerDays`, `foodStore`, `foodBalance`, `foodSurplusDays`, `resources`).

### Tick phases

None new. Scoring runs where it runs today. The readings it uses are written by `settlement_economy` and `unrest` earlier in the day.

### Resolution logic

Additive score term, the same shape and scale as THR-725's prosperity term (weight 0.15, cap 0.5). A starving, busting town can lift *Aid the Refugees* by up to 0.15 + 0.15. That is two named dials, both editable.

### PRNG callouts

None. Every new read is deterministic.

## Content pillar

### Data tables — `ECONOMIC_SCENE_AFFINITY` (`src/data/economic-scene-affinity.ts`)

`EconomicSceneAffinity` gains `famineWeight?: number` and `glutWeight?: number` (optional, signed). Existing rows keep their boom/bust weights. New rows set `boomWeight: 0, bustWeight: 0`. The executor may tune the numbers; the **signs** are the design.

| Row (id prefix) | famine | glut | Why (quotes are the THR-1872 table's *likelier when* column) |
|---|---|---|---|
| `encounter.aid_refugees` | **+1.0** | 0 | "add famine nearby" |
| `encounter.barter_survival` | +0.9 | −0.5 | people trade what they have left |
| `gold.famine.merchant_granaries` | **+1.0** | −0.5 | "none, despite the id" |
| `encounter.mend_fishing_nets` | +0.6 | 0 | "famine pulls poor to work" |
| `encounter.town.bell_at_the_exchange` | +0.6 | 0 | "famine/bust" (its hook was only a comment) |
| `encounter.forage_provisions` | +0.6 | −0.4 | going without the market |
| `encounter.black_market_deal` | +0.5 | 0 | bread at a price |
| `encounter.pickpocket` | +0.4 | 0 | hungry hands |
| `encounter.harvest_bounty` | **−1.0** | **+1.0** | "add glut" |
| `encounter.market_day_festival` | −1.0 | +0.8 | no fair in a famine |
| `encounter.festival_of_spheres` | −0.8 | +0.5 | the same |
| `encounter.grand_tournament` | −0.6 | +0.4 | the same |
| `tavern.drinking_contest` | −0.6 | +0.5 | the same |
| `encounter.town.mill_lease_auction` | −0.3 | +0.6 | "grain glut/boom" |
| `encounter.town.tithe_barn_raid` | +0.3 | +0.6 | "glut/bust": a full barn is worth robbing, and hungry people rob it |
| `encounter.realm.crowns_reckoning` | 0 | +0.5 | "add surplus grain" (still `requiresHold`) |
| `encounter.caravan_deal` | 0 | +0.4 | spare grain wants a buyer |
| `encounter.foreign_trader` | −0.2 | +0.4 | the same |

**Left out on purpose:** `encounter.town.granary_riot`. [Hunger and unrest](2026-10-16-thr-1934-hunger-and-unrest.md) owns its famine draw: the scarcity arc and Lawless-while-hungry seed it (`economicPower.ts` § 3). A board pull on top would double one story.

### Encounter templates · Prose tables · Attachment content

N/A. No template, step or line changes. A draw weight needs no new line, because the THR-1872 table's *prose?* column judges economic **writes**, not where a scene fires. Fourteen rows come from that table. The other four are existing boom/bust rows whose scenes are already about plenty or going without.

## UI pillar

**No new player surface; debug readout only.** Which scenes a hungry town tells *is* the player-facing change. It is read in the scenes themselves, beside the place page's existing Fortunes sentence ("restless with hunger", `fortunes-prose.ts:26`) and the Livelihood line ("you read hunger or glut", rulebook quick reference § The World at Work). No new text, chip or tooltip is added. UI Laws engaged: none by a new surface. Law 56 (chips are state-backed) is untouched, because no chip is added.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| none new | — | none | The scenes that fire in a starving town are about hunger. |

### Playtest signal

A tester whose followed mortal lives in a hungry town meets a hunger scene there (refugees, barter, the granaries, the exchange bell) before that town is fed again.

### Debug inspection

`DecisionBreakdown.tsx:200-203` prints `econ: ±x` today. It gains `| larder: ±x (famine|glut)` under the same non-zero guard. The executor checks it with **Playwright DOM** at 1920×1080 as one screenshot (a small visible-to-debug fix, ≤400 UI lines).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `readLarder` / `computeLarderContextBonus` (`economicContext.ts`) | encounter scoring (per candidate) | — | reads settlement props | carried on the scoring trace | `DecisionBreakdown` |
| affinity rows (`economic-scene-affinity.ts`) | — | — | — | — | contract test |
| scoring term (`encounterScoring.ts`) | agent decision | — | `ScoredCandidate.larderContextBonus` | `larderContextBonus`, `larderState` on the candidate entry (`trace.ts:2917`) | `DecisionBreakdown` |

Wiki: `public/agents-reference.html` sources `encounterScoring.ts`, so add one sentence under its scoring section.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Mortal Economy & Prosperity → Encounters (THR-725 boom/bust affinity term) | preserve | the prosperity term is unchanged |
| Economy → Encounter scoring: `hungerDays`, `foodBalance`, `foodSurplusDays`, `foodStore` | **add** (read) | production read site: `encounterScoring.ts` step 20b. Record it in `Docs/canon/interface-map.md` beside `unrest-pressure-inputs` and in `scripts/interface-contracts.ts` |
| Encounter scoring → selection trace (`trace.ts:2917`) | extend | two optional fields |

## Constants table

New, in `src/data/economic-scene-affinity.ts`:

| Constant | Default | Purpose |
|---|---|---|
| `LARDER_SCORING_WEIGHT` | 0.15 | how loudly hunger and plenty speak (matches `ECON_SCORING_WEIGHT`) |
| `LARDER_SCORING_CAP` | 0.5 | ceiling on the term's absolute size |
| `FAMINE_FULL_DAYS` | 5 | hungry days until a famine reads at full depth |
| `PLENTY_MIN_SURPLUS_DAYS` | 3 | surplus days in a row before a town reads as glutted |
| `PLENTY_BALANCE_FLOOR` | 0.75 | food balance (yield over need, −1…1) where glut starts to count |
| `STOCK_TIER_FAMINE_DEVIATION` | 1.0 | fallback depth for a scarce staple |
| `STOCK_TIER_GLUT_DEVIATION` | 0.5 | fallback depth for a surplus staple |

## Tracing

The selection trace's per-candidate entry gains two optional fields (`src/types/trace.ts:2917`, beside `economicContextBonus?`):

```ts
larderContextBonus?: number;          // the famine/glut term, 0 when neutral
larderState?: 'famine' | 'glut';      // absent when the town is neither
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| no location / unresolvable parent | neutral reading, term 0 |
| `hungerDays` missing on a hungry town | depth from `max(1, 0)` = 1 day (0.2) |
| `foodBalance` / `foodSurplusDays` non-numeric | not glut |
| no `foodStore` and no `resources` bag | neutral |
| a row with neither weight | term 0, as for unlisted families |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 133 importers (grep, main @ e67e0517) | two optional fields on one existing interface; no consumer must change |

`encounterScoring.ts` has 38 importers (measured), below the threshold.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (18 affinity rows)
- [x] UI pillar present (debug readout; no new player surface, with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. A hungry world telling hunger's stories is the "world at work" premise in the rulebook quick reference § The World at Work; Law 42 is honoured (the existing affinity seam, no bespoke case).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play: no verb, resource, clock or encounter rule. Which stories fire is weighting inside existing scoring.
- [x] No `Docs/canon/rulebook.md` edit is owed.

> Brainstorm companion: `Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws-brainstorm.md`.

## Decided by delegation (design lane, 2026-10-25 — veto in chat)

1. **Famine is the town's existing hunger** (`isHungryToday` + `hungerDays`), not a new stock test. *Veto:* "famine should mean a staple at the scarce tier".
2. **Glut means grain with nowhere to go**: three surplus days in a row at a food balance of at least 0.75. A surplus day alone is not enough. *Veto:* "any town with spare food is in glut".
3. **The granary riot keeps one owner**, the hunger-and-unrest seeding, and gets no board weight. *Veto:* "famine should also make the riot likelier on the board".

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | seven named constants; every row a data edit |
| 2. Inspectability | PASS | separate term + state on the selection trace and `DecisionBreakdown` |
| 3. Determinism | PASS | no PRNG; pure reads |
| 4. Fail-soft | PASS | every missing read is neutral (table above) |
| 5. Narrative over mechanics | PASS | the point is narrative fit; signs over magnitudes |
| 6. Additive | PASS | optional fields, a new term; nothing removed |
| 7. Performance | PASS with note | one node read and at most one parent hop per candidate, the same cost as the prosperity term; the census shows the tick-cost trend at closeout |

## Done when

- [ ] `readLarder` unit tests: famine depth grades 0.2 → 1.0 over `FAMINE_FULL_DAYS`; a glut needs both the surplus run and the balance floor; a sublocation reads its settlement; the stock-tier fallback; every missing-data path is neutral.
- [ ] A scoring test: the same town, hungry vs fed, scores `encounter.aid_refugees` higher and `encounter.market_day_festival` lower when hungry; the term never exceeds `LARDER_SCORING_CAP`.
- [ ] `economicSceneAffinity.contract.test.ts` passes with the new rows (every key a live prefix).
- [ ] `npm run census:larder` (the proto script, landed under `scripts/`) on seeds 42/99/7 × 360 ticks: on each seed, the famine rows' share of firings in hungry settlements is higher than their share of all settlement firings, and higher than the same census run on main **before** the change (record both in the closeout). The plenty rows do the same in glutted settlements.
- [ ] `npm run gate` green; interface map + contracts + `agents-reference.html` updated; one 1920×1080 `DecisionBreakdown` screenshot.

## Kill criteria

- The census predicate fails at the default weight: raise `LARDER_SCORING_WEIGHT` once (to 0.3) and re-run. If it is still flat, the term cannot move picks at this scale. Ship nothing, set the ticket back to Todo, and record the census on it.
- A tick-cost or heavy-test regression above the alarm line is traced to the term: set the weight to 0 (today's behaviour exactly) and file it.

## Coordination block

**Suggested model:** sonnet — two pure functions, one scoring line, a data table and tests; no open design.

**Parallel-safe with:** [the debts plan](https://linear.app/threadbare/issue/THR-2023) (authors outcome tables in `encounter-content.ts` / encounter files; this touches neither) and [the sequel-place bug](https://linear.app/threadbare/issue/THR-1929) (seeding, not scoring).

**Mutex with:** anything editing `encounterScoring.ts` steps 20b–20c or `economic-scene-affinity.ts` — both are shared with the THR-725 economy term.

**Files to touch:**
- Edit: `src/engine/economicContext.ts` (`readLarder`, `computeLarderContextBonus`)
- Edit: `src/data/economic-scene-affinity.ts` (constants, two optional weights, 18 rows)
- Edit: `src/engine/encounterScoring.ts` (term, candidate field, trace field)
- Edit: `src/types/trace.ts` (two optional fields)
- Edit: `src/components/Game/debug/DecisionBreakdown.tsx` (one readout)
- Create: `scripts/larder-census.ts` + `census:larder` in `package.json` (from `proto/thr-2040-larder-census`)
- Edit: `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `public/agents-reference.html`
- Tests: `src/engine/__tests__/larderContext.test.ts` (new); extend the affinity contract test

## Notes for the executor

- Do not fold the term into `computeEconomicContextBonus`. Two terms keep "was it the poverty or the hunger?" answerable.
- Do not add famine/glut mood vocabulary. The `{econ_*}` prose tokens have **no authoring template** (a grep of `src/data` finds them only in the affinity file), so new vocabulary would never render.

## Intent-judge verdicts

**Run 1 (2026-10-25, opus, cold): Allow** (Reversible, confirmed). Dimensions 1–3, 5–9 and 11 PASS; 12 N/A (debug-only UI). There were two minor GAPs, both fixed in this revision:
- **D4:** `isHungryToday` already falls back to the stock tier, so the famine branch now keys on its `source`. That makes `STOCK_TIER_FAMINE_DEVIATION` reachable.
- **D10:** the kill criteria were only in the action proposal. They are now a § Kill criteria in this doc.

## Forked-audit verdicts

### NFP audit

**NFP AUDIT: PASS-with-notes.**
- NFPs 1–6 pass.
- NFP 7 passes with a note: the cost matches the prosperity term (one node read, at most one parent hop). It is verified by the census and the tick-cost trend at closeout, and the kill criterion sets the weight to 0 if it regresses.

### Three-pillar audit

**PILLAR AUDIT: PASS.**
- Engine and Content are present and substantive. UI is N/A with a rationale: a debug readout only, with no new player surface.
- No required section is missing, and the Wiring section connects every module.
- The substrate inventory extends existing systems (THR-725's scoring term; the readings from THR-1934, THR-1923 and THR-615) and duplicates none of them.

### Vision audit

**VISION AUDIT: PASS-with-notes. No contradictions.**
- It extends the north star's "watch what the world does next".
- It confirms the non-negotiables (narrative over mechanics, mechanics surface through prose and never numbers, graph-only, additive, three pillars).
- It leans mildly toward systemic emergence over authored moments, bounded by the cap.
- Note: this doc's Vision section cites the rulebook and the Game Design Laws, not the Vision files by path. The touched files are `00-north-star.md` and `02-non-negotiables.md`.
