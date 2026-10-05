> **title:** Readable on hover — what you spend and what you risk — THR-1713
> **linear_issue:** THR-1713
> **author:** Claude Code (design lane, run 2026-10-05a — decided under delegation, process.md rule 4)
> **created:** 2026-10-05
> **three_pillars:** Engine done · Content done · UI done

# Readable on hover — what you spend and what you risk — THR-1713

*Round 2's three new players all asked for the same thing: a hover answer on every number and mark. Most of those answers already exist in the tooltip registry. They were attached to the wrong element, switched off on the dilemma's cards, or missing their cause.*

## Why this is load-bearing

The cold playtest's round 2 (2026-10-03, [report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md), deployed commit `7ebc640d`) found THR-1607 had **recurred**: 0 of 3 testers could say what their essence is for or what "doomed" means. The veteran's single message to the designer was *"put a hover tooltip on every number, because your depth is invisible until I can read it"*. They had hovered *"sphere bars, Reaches, stars, dice"* and got nothing. THR-1607 (slice B4 of `Docs/plans/2026-09-27-thr-1606-what-your-hand-did.md`, PR #2122, merged 2026-09-28) shipped before that build. Its tooltips were therefore live, and the testers still could not find them. The measurement below shows why: the copy exists, but it is attached to the wrong elements.

The fix is not more copy. It is (a) putting the existing registry tooltips on the element a player actually points at, (b) switching them on for the dilemma's nudge cards, where the testers spent their time, (c) recording *why* a sphere pool moved so its row can say so, and (d) hiding the one readout that never moves. UI Laws 1, 12, 17 and 31 already require all of this. The plan enforces existing law; it chooses no new direction.

## Measured, not assumed (origin/main `e99db0b0`, 2026-10-05)

| What the testers hovered | What is there today | Evidence |
|---|---|---|
| **Sphere bars** | The registry tooltip `ui.essence.row` sits **on the balance numeral only**. The label, the bar and the trend arrow have none. | `src/components/Game/ascendant-bar/EssenceBlock.tsx:141` |
| **Why a bar drifts** ("Matter 50 → 42, Mind 50 → 55 with no explanation") | **Nothing records a cause.** The trend arrow is hard-coded: `trend: 'steady' as const, // income delta not yet surfaced in EssencePool; placeholder`. So every row shows "—". | `src/components/Game/ascendant-bar/selectors.ts:147` |
| **Card stars (cost ✦, odds ★)** | On nudge cards the cost badge and odds pips carry a raw `title=` only (`OddsPips.tsx:79`, `:185`). Registry tooltips for cost, sphere and reach render only when `model.markTooltips` is set. The **only** producer that sets it is the cast-card model. | `grep -rn markTooltips src` → `actionCardModel.ts:181` (production) and `StyleGuide.tsx:341`; consumer `shared/CardFace.tsx:513-524` |
| **Card keyword icons** (the "heart / scales / dice": ⚖ Bargain, ⚄ Gambit, ⚂ Side-bet, ❦ Balm, ☙ Mercy, …) | `CardKeywordChip` gets no `tooltipId`. No `ui.card.keyword.*` registry family exists. There are 22 card types. | `src/data/nudge-card-display.ts:46-68`; `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx:171` |
| **"Doomed" on a card** | Cast cards wrap the word in `ui.forecast.cast.{tier}`, but print **the raw lowercase key** `{model.odds.tier}`. This is a Law 14 defect. | `src/components/shared/CardFace.tsx:696-709` |
| **"Fated" vs "doomed"** in the dilemma header | `ForecastPill` carries `ui.nudge_forecast`. It lists all five words in one sentence and says what none of them means on its own. | `NudgeStageHeader.tsx:171`; copy `src/data/ui-content.ts:332-335` |
| **Red vs green factor lines** ("'The intelligence could stop a war' was red") | Polarity is carried **by text colour alone** (`FACTOR_POLARITY_COLORS`). That breaks Law 31 ("polarity is never carried by hue alone"). The colour key lives only on the dismissible first-contact legend (THR-1478 item 5). | `NudgeStageHeader.tsx:345-374`, disposition comment `:296-307` |
| **The Reaches row** ("Unnamed / Unmourned / Unblooded", "Unhewn / Owing") | The ascendant bar's tier word has `reachTierTooltipId`. **The ascendant sheet's tier word has no tooltip.** Nothing on either surface says how Reaches differ from Spheres; one tester read them as the same axis. | `ReachesBlock.tsx:84`; `AscendantSheet.tsx:404-410` |
| **Quintessence "Absolute / whole and present"** | Always shown on the identity strip. The god's quintessence regenerates 0.002 per tick, and its producers are mortal-facing, so on a fresh run it sits at Absolute. | `IdentityStrip.tsx:182-213`; word `selectors.ts:77-96` |
| **"was Perilous"** | Already decided and shipped by THR-1714 (D2): it now reads `your hand: Perilous → Uncertain`. | `NUDGE_FORECAST_SHIFT_LINE`, `nudge-stage-content.ts`; PR #2229 |
| **Dice / scales header marks** | Removed by THR-1724 (the ForecastDie and DifficultyScales are gone; the forecast is a coloured word pill). | PR #2215 |

**What changed since round 2 and is out of scope here:**

- THR-1706 (PR #2191): the essence header, dilemma budget and bar now tell one story, and the paying sphere is named on the cost row.
- THR-1714: show the roll.
- THR-1724: the layout pass.

This plan builds on all three and re-decides none of them.

### The cause seam exists

Every tick phase's change to the pools passes one point. `runInlinePhase(phaseId, s, run)` calls `applyEssenceEarned(s, next)` at `src/engine/orchestrator.ts:2801`. It already diffs `prev.essencePool` against `next.essencePool` there, and it knows the `phaseId`. The 53 inline phase ids include:

- `essence`: income, `influence.ts`
- `essence_sources`: places of power
- `influence_maintenance`: thread upkeep, charged to the primary sphere
- `control_effects`: sustained effects
- `divine_premonition`
- `unified_action_progress`

Player spends happen outside the tick: nudge commits (`nudgeCommit.ts:73-88`), authored-choice spends (`GameView.tsx:3768-3788`) and cast dispatch (`playerCastDispatch.ts:213`). Those are the only non-phase writers this plan must tag.

## The decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Hover the whole thing, not the numeral.** Each essence row, card mark and Reach row is one tooltip target, with the existing registry copy. | Testers pointed at bars and icons, not 13px digits. Laws 1 and 17. |
| D2 | **An essence row says what it is for and why it moved lately, in words.** The tooltip gives the sphere's role (from `SPHERE_COPY`), a direction word (*rising · steady · ebbing*), and up to two things that fed it and two that drew on it. Example: *"Rising. Fed by the cosmos's flow. Drawn by your threads' upkeep."* The trend arrow reads the same record, so it stops being a placeholder. | The ticket's "essence bars incl. drift cause". Law 13 allows the balance as a numeral but not rates, so the cause is told in words and never as "−3/tick". |
| D3 | **A small engine record of recent essence movement, per sphere and per cause.** It is written at the existing phase-merge seam and at the three out-of-tick spend sites. It is a rolling window, bounded, and it changes no balance. | Inspectability (NFP #2). Without it, D2 would have to guess. `computeEssenceIncome` (`essenceIncome.ts:49`, computed at `GameView.tsx:1831` and never read) predicts income but cannot see spends or upkeep, so it was weighed and rejected (see companion). |
| D4 | **Switch on the card-mark tooltips for nudge cards, and give every card keyword one.** The nudge card model sets `markTooltips`. The raw `title=` on `CostPips`/`OddsPips` becomes registry tooltips (`ui.card.cost`; a new `ui.card.odds.<tier>` per pip tier). A new derived family `ui.card.keyword.<typeId>` covers all 22 types. | Law 17 retired raw `title`. Law 12 says a new icon is explained at first contact. The ★ the veteran asked about is the *Fated odds* pip, not a cost, and today nothing says so. |
| D5 | **Each forecast word explains itself.** The dilemma pill's tooltip becomes per-tier (`ui.forecast.<tier>`, chaining `{{ui.nudge_forecast}}`). Example: *"Doomed: as things stand, this attempt will almost surely fail. Your cards can lift it; fate still rolls."* Cast cards print the display word (`FORECAST_TIER_WORDS`) instead of the raw key. | The Fixed-when names "doomed". Law 14 (raw key). The per-tier copy follows the UL *Forecast tier* entry: pre-roll and never a promise. |
| D6 | **A factor line carries its reading as a word as well as a colour.** A small kind tag, **helps** / **hinders**, comes before each non-neutral line, in the line's polarity colour. Only the tag carries a tooltip (`ui.nudge_factor.for` / `.against`), and it says this is about the *attempt*, not about the player or the world. Neutral lines get no tag. | Law 31 requires a word with every polarity colour; Law 16's chip anatomy is a kind tag plus a sentence. The tester read "could stop a war" as good news. The tag says which way it pushes *this attempt*. The per-line rulebook hover that THR-1478 removed stays removed: one hover on a two-word tag is not that hover. |
| D7 | **The Reaches row explains itself on both surfaces, and says how Reaches differ from Spheres.** `AscendantSheet` gets the same `reachTierTooltipId` as `ReachesBlock`. The Reaches heading on both surfaces carries `ui.reaches`: *"What you do (eight Reaches). Your Spheres are what fuels it."* | Laws 1 and 17. Round 2's "the intro said matter and mind, but the Reaches are Stone/Gold/Iron" was folded into this ticket. Reaches ⟂ Spheres is a load-bearing decision; the copy states it and does not blur it. |
| D8 | **Quintessence leaves the identity strip until it moves.** The strip shows the god's quintessence only once it has fallen below its top word (`ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW` = 0.9, the Absolute floor). The ascendant sheet keeps it at all times. | The ticket's direction. Law 53 makes persistent HUD a budget. Law 13's visibility-parity clause is still met, because the sheet shows it. |
| D9 | **The meeting gains no teaching.** No coachmark, callout or tooltip is *added to Meet The First's prose*. The card and header marks the meeting shares with the dilemma screen carry the D4/D5 hovers wherever they render. | THR-868 verdict 10: the meeting teaches *"in-fiction only … no UI callouts, no tooltips"*. A hover on a card's price is a report about the card, not a lesson. This is the same reading THR-1714 recorded for its lean tag. **Recorded for veto** (see below). |

**Recorded for veto (lane interpretation).** D9 reads verdict 10 as forbidding *teaching* in the meeting, not on-demand hovers on shared card marks. THR-1607's cast-card tooltips have rendered wherever `CardFace` is used since 2026-09-28, so this keeps the status quo. If Christian wants the meeting fully hover-free, the switch is one prop: the meeting's `NudgePhaseShell` mount passes `markTooltips={false}`, and nothing else changes.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Tooltip registry (`resolveTooltip`, `src/engine/tooltipResolver.ts`; copy in `src/data/ui-content.ts`) | 🟢 ACTIVE | **extends**: `ui.card.odds.<tier>` (4 + penalty), `ui.card.keyword.<typeId>` (22, derived), `ui.forecast.<tier>` (5), `ui.nudge_factor.for/against`, `ui.reaches` (if absent; reuse if present) |
| `Tooltip` primitive (`src/components/shared/Tooltip.tsx`) | 🟢 ACTIVE | **reused** unchanged; `label`/`desc` form for the dynamic essence-row tooltip (the `ActiveEffectChips` precedent) |
| Essence-earned accrual seam (`applyEssenceEarned`, `src/engine/essenceEarned.ts`, called at `orchestrator.ts:2801`) | 🟢 ACTIVE | **extends**: a sibling pure call at the same seam records movement by cause |
| Essence block selectors (`selectEssenceRows`, `ascendant-bar/selectors.ts:123`) | 🟢 ACTIVE | **extends**: the `trend` placeholder is replaced by a reading of the movement record, and a `hover` description is built |
| Card face (`shared/CardFace.tsx`, `markTooltips`) | 🟢 ACTIVE | **activates** for nudge cards (one producer flag) |
| `OddsPips` / `CostPips` (`shared/OddsPips.tsx`) | 🟢 ACTIVE | **extends**: optional `tooltipId`, which replaces the raw `title` when given (the `aria-label` stays) |
| Ascendant reach register (`buildReachTierTooltips`, `data/ascendant-reach-register.ts`) | 🟢 ACTIVE | **reused** on the sheet |
| Ascendant quintessence view (`selectQuintessenceView`) | 🟢 ACTIVE | **extends** with a `showOnStrip` flag |

## Engine pillar

### Systems design

New pure module `src/engine/essenceMovement.ts`:

```ts
export type EssenceMovementCause =
  | 'income'          // phase `essence` — the cosmos's flow (worship, portfolio, places)
  | 'places'          // phase `essence_sources` — places of power and their streams
  | 'upkeep'          // phase `influence_maintenance` — thread upkeep
  | 'sustained'       // phase `control_effects` — sustained effects' cost and income
  | 'premonition'     // phase `divine_premonition`
  | 'acts'            // phase `unified_action_progress` and other god-acts resolving in-tick
  | 'spend_nudge'     // out-of-tick: a played hand (nudgeCommit, authored-choice spend)
  | 'spend_cast'      // out-of-tick: a cast (playerCastDispatch)
  | 'other';          // any phase not in the table — still counted, never dropped

export interface EssenceMovementWindow {
  readonly fromTick: number;
  /** Net change per cause inside the window. Positive = fed, negative = drawn. */
  readonly byCause: Readonly<Partial<Record<EssenceMovementCause, number>>>;
}

export interface EssenceMovementRecord {
  readonly current: EssenceMovementWindow;
  /** The last closed window, so a row just after a roll still has a story. */
  readonly previous?: EssenceMovementWindow;
}

export type EssenceMovementBySphere = Readonly<Partial<Record<SphereName, EssenceMovementRecord>>>;

/** Pure: fold one phase's pool diff into the record. Reference-returns `record` when nothing moved. */
export function recordEssenceMovement(
  record: EssenceMovementBySphere | undefined,
  prevPool: EssencePool, nextPool: EssencePool,
  cause: EssenceMovementCause, tick: number,
): EssenceMovementBySphere | undefined;

/** Pure: the cause for a phase id, from ESSENCE_MOVEMENT_CAUSE_BY_PHASE; 'other' when absent. */
export function causeForPhase(phaseId: string): EssenceMovementCause;

/** Pure: the reading the UI shows — direction plus the top feeds and draws, ordered by magnitude. */
export function readEssenceMovement(rec: EssenceMovementRecord | undefined): {
  trend: 'rising' | 'steady' | 'ebbing';
  feeds: readonly EssenceMovementCause[];   // ≤ ESSENCE_MOVEMENT_TOP_CAUSES
  draws: readonly EssenceMovementCause[];   // ≤ ESSENCE_MOVEMENT_TOP_CAUSES
};
```

`ESSENCE_MOVEMENT_CAUSE_BY_PHASE` (in `essenceMovement.ts`):

| Phase id (`runInlinePhase`) | Cause |
|---|---|
| `essence` | `income` |
| `essence_sources` | `places` |
| `influence_maintenance` | `upkeep` |
| `control_effects` | `sustained` |
| `divine_premonition` | `premonition` |
| `unified_action_progress` | `acts` |
| *any other* | `other` |

The executor verifies the six against a 150-tick `?seeded` run (`__DEBUG.getEssenceMovement()`). Any phase that moves a pool and lands in `other` with a share above a third of a sphere's movement gets its own row, plus a phrase in `ESSENCE_CAUSE_PHRASES`, in the same PR.

Rolling rule: when `tick - current.fromTick >= ESSENCE_MOVEMENT_WINDOW_TICKS`, `current` becomes `previous` and a fresh window opens at `tick`. The reading sums `previous` and `current`. Trend is the sign of that net against `ESSENCE_TREND_STEADY_EPSILON`. The record is bounded by construction: at most two windows per sphere and at most nine causes per window.

### Graph nodes / edges

None. This is a GameState field, not graph data: it is a run-level ledger of the god's own resource, the same kind of thing as `essenceEarnedBySphere`, not a relationship between entities.

### GameState

`GameState.essenceMovement?: EssenceMovementBySphere`, optional and additive (NFP #6), placed beside `essenceEarnedBySphere` (`src/types/gameState.ts:248`). An absent field reads as "no movement yet". An old save loads with the field missing and starts recording at the next tick. No migration is needed.

### Tick phases

No new phase. `runInlinePhase` (`orchestrator.ts:2788`) gets one more call after `applyEssenceEarned`: when `prev.essencePool !== next.essencePool`, `next.essenceMovement = recordEssenceMovement(…, causeForPhase(phaseId), next.tick)`. It reference-compares out on the phases that leave the pool alone, as the existing seam does.

Out-of-tick: the three spend sites call `recordEssenceMovement` with `spend_nudge` / `spend_cast` in the same state update that writes the new pool. A spend site that is missed shows up as an unexplained drop, and is still counted as `other` at the next phase diff only if it lands inside a phase. Done-when 2 therefore pins all three sites.

### Resolution logic

N/A. Nothing is scored or rolled, and no balance changes. The record observes; it never writes `essencePool`.

### PRNG callouts

None. The record is a deterministic fold of pool diffs (NFP #3). Same seed and same inputs give the same record.

## Content pillar

All copy lives in `src/data/ui-content.ts` (registry) or `src/data/ascendant-bar-content.ts` (cause phrases). Every entry is ≤200 characters (`tooltipValidation.test.ts`), plain register, and has no numbers (Laws 18, 42).

1. **`ESSENCE_CAUSE_PHRASES: Record<EssenceMovementCause, { fed: string; drawn: string }>`**, for example:
   - `upkeep`: drawn "your threads' upkeep"
   - `income`: fed "the cosmos's flow"
   - `spend_nudge`: drawn "the hands you played"
   - `other`: fed "other currents", drawn "other costs"
2. **`ESSENCE_TREND_WORDS`**: *Rising · Steady · Ebbing*.
3. **`ui.card.odds.<tier>`** for faint / strong / potent / fated / penalty. Each says how far the card moves the odds, in words that match `nudge-pip-vocabulary.ts`. Example: *"Fated pips: this card moves the odds as far as any card can."* (penalty: *"a setback that worsens the odds"*).
4. **`ui.card.keyword.<typeId>`** for all 22 `NudgeCardTypeId` values. Each is one sentence on what the keyword does, drawn from the existing type descriptions in the card library, not invented. It is a derived id, so it rides the Law 17 derived-id scanner (`tooltipCorpus` sweep).
5. **`ui.forecast.<tier>`** × 5 for the dilemma pill. Each states the word's meaning on its own, ends by chaining `{{ui.nudge_forecast}}`, and never says "will" about the outcome without "as things stand".
6. **`ui.nudge_factor.for` / `ui.nudge_factor.against`**. Example: *"Hinders: this works against the attempt succeeding — not against you, and not a judgement of whether it is good."*
7. **`ui.reaches`**: *"What you do — eight Reaches, from Iron to Star. Your {{ui.essence_panel}} Spheres are what fuels it; the two are separate."* Reuse it if an equivalent entry exists, rather than adding a near-duplicate.
8. **Kind-tag words** `NUDGE_FACTOR_KIND_TAGS = { for: 'helps', against: 'hinders' }` in `nudge-stage-content.ts`.

Encounter templates, prose tables, attachment content: N/A, because no scene, card or template text changes.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only; nothing here is WebGL).*

### Player-facing display

- **Essence block** (`EssenceBlock.tsx`): the whole row (icon, label, bar, numeral, arrow) is one `Tooltip` target, built with `focusable`, with a ≥24px hit area (Law 46). It uses the `label`/`desc` form: label = sphere name, desc = `SPHERE_COPY.role` + trend word + feeds/drawn phrases. The selector builds the description from the D2 tables; the component inlines no copy. The arrow shows the real trend. The click-to-expand role row stays.
- **Nudge cards** (`NudgePhaseShell.tsx` card model): `markTooltips: true`. `CostPips`/`OddsPips` take `tooltipId` and drop the raw `title`. `CardKeywordChip` takes `tooltipId={`ui.card.keyword.${typeId}`}`.
- **Cast cards** (`CardFace.tsx:709`): render `FORECAST_TIER_WORDS[tier]`, not the key.
- **Forecast pill** (`NudgeStageHeader.tsx:171`): `id={`ui.forecast.${tier}`}`.
- **Factor lines** (`NudgeBalance`): a kind tag before each `for`/`against` line, in the line's colour (Law 31), with the D6 tooltip on the tag only. Neutral lines are unchanged. Update the legend copy so it names the tags.
- **Reaches**: the `AscendantSheet` tier word wraps in `reachTierTooltipId`; the Reaches heading on both the bar and the sheet carries `ui.reaches`.
- **Identity strip**: the quintessence row renders only when `showOnStrip` is true.

### UI Laws engaged

**1** (every concept gets its tooltip), **10** (the odds-pip tooltip names the odds, the cost tooltip names the price: two vocabularies, two hovers), **11** (glyph rows keep their `aria-label`), **12** (keyword icons are explained at first contact), **13** (no rate numerals; the balance numeral is the ratified exception; quintessence stays on the sheet for parity), **14** (cast forecast word from the vocabulary, not the key), **16** (the kind tag plus sentence is chip anatomy, not a key:value strip), **17** (registry ids, raw `title` retired on these primitives), **18** (≤200 characters), **19** (forecast and Reaches tooltips chain), **20** (essence row tooltip, then click to expand the role, as today), **27** (tooltips through `Tooltip` only), **31** (polarity word on every coloured line), **33** (no layout growth: the kind tag sits inline, the quintessence row is removed, nothing pushes below the fold), **46** (row-sized hit areas), **53** (the strip loses a datum that never moves). No exception is needed.

### Event notifications

None.

### Debug inspection (DebugPanel)

`window.__DEBUG.getEssenceMovement(): Promise<EssenceMovementBySphere>` (add to `src/debug-bridge.d.ts`) returns the record as-is. The Done-when assertion reads it next to the row's rendered trend.

### Visual presence (HexMapV2)

N/A. There are no map signifiers.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `essenceMovement.ts` (record) | every inline phase, at the `runInlinePhase` seam | `EssenceBlock` via `selectEssenceRows` | `essenceMovement` | `essence_movement_roll` (window roll only) | `__DEBUG.getEssenceMovement()` |
| spend tagging | out-of-tick (`nudgeCommit`, authored-choice spend, `playerCastDispatch`) | — | `essenceMovement` | none (the spend already traces) | same |
| card-mark tooltips | — | `NudgePhaseShell` → `CardFace`, `OddsPips`, `CardKeywordChip` | — | — | DOM `[data-tooltip-link]` |
| forecast / factor / reaches / quintessence | — | `NudgeStageHeader`, `NudgeBalance`, `AscendantSheet`, `ReachesBlock`, `IdentityStrip` | — | — | DOM testids |

Prose pipeline: the essence-row description is static phrase concatenation, so no `enrichProse` is needed. It has no `{token}` (Law 43 test pins it). `Docs/plans/wiring-checklist.md` is satisfied: there is a production reader (`selectEssenceRows`) for the new write.

## Interface impact

| Contract | Disposition |
|---|---|
| Tick phases → `GameState.essencePool` (divine economy) | **preserve**: unchanged, read-only here |
| Orchestrator phase merge → `GameState.essenceMovement` | **add**: written at the seam, read by `selectEssenceRows` (named production read site) |
| Out-of-tick spends → `GameState.essenceMovement` | **add**: three writers, same reader |
| Tooltip registry ← UI | **extend**: new id families, read through `resolveTooltip` only |

Update `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` for the new write/read pair (the two-file edit).

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `ESSENCE_MOVEMENT_WINDOW_TICKS` | `100` | Length of one movement window; the reading spans this window and the one before |
| `ESSENCE_TREND_STEADY_EPSILON` | `0.5` | Net movement (essence) inside the reading below which a row reads *Steady* |
| `ESSENCE_MOVEMENT_TOP_CAUSES` | `2` | Most feeds and most draws one row's tooltip names |
| `ESSENCE_MOVEMENT_CAUSE_BY_PHASE` | table (see Systems design) | Phase id → cause; unknown ids read `other` |
| `ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW` | `0.9` | Ratio below which the identity strip shows the god's quintessence |
| `NUDGE_FACTOR_KIND_TAGS` | `{ for: 'helps', against: 'hinders' }` | Kind-tag words on factor lines |

## Tracing

```ts
// EssenceMovementRollTrace — emitted once per sphere when its window rolls.
// It does not fire per phase, which would be a trace storm on the hottest seam.
interface EssenceMovementRollTrace {
  category: 'essence_movement_roll';
  tick: number;
  sphere: SphereName;
  fromTick: number;                                   // the closed window's start
  byCause: Partial<Record<EssenceMovementCause, number>>;
  summary: string;                                    // "mind: +6.0 income, -1.5 upkeep over 100 ticks"
}
```

Register the category in `src/types/trace.ts`: the `TraceCategory` union (line 78) and the `TRACE_CATEGORIES` array (line 604), which `src/types/__tests__/trace-vocabulary.test.ts` parses. Add an `EssenceMovementRollTrace` interface beside the others. `traceBuffer.ts` is not touched; its array is encounter-only.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `essenceMovement` absent (old save, first tick) | Reads as no movement: trend *Steady*, the tooltip gives the role only |
| A sphere in the pool has no record | Same as above, for that row |
| Phase id not in the cause table | `other`; still counted, so the record never under-reports |
| A pool value is `NaN`/non-finite | That sphere's diff is skipped for this phase; the record keeps its last good state |
| A spend site was missed | The drop is unexplained, but nothing crashes; Done-when 2's unit test catches it |
| Tooltip id missing from the registry | `resolveTooltip`'s plain fallback with one warning (Law 14); the registry test fails the build first |
| Quintessence view unavailable | The strip hides it (absence is the D8 default); the sheet shows its existing fallback |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/gameState.ts` | ~669 files import from `types/gameState` (`grep -rln "from '.*types/gameState'" src \| wc -l`) | One optional field, additive; no existing reader changes |
| `src/engine/orchestrator.ts` | wide-blast (codesight hot file) | One reference-compared call at an existing seam; the 30-tick CLI smoke and `test:heavy` cover it |
| `src/types/trace.ts` | trace vocabulary (wide-blast) | One category added to the union and the array; additive |

## Three-pillar check

- [x] Engine pillar present: the movement record, the seam call, three spend taggings, one trace
- [x] Content pillar present: cause phrases, trend words, 33 registry entries, kind tags
- [x] UI pillar present: seven surfaces, Laws listed, Playwright named
- [x] Wiring section connects them: one write seam to one read site; tooltips through the one resolver

## Vision audit

- [x] This plan does not contradict any Vision premise. *You spend sphere-typed essence* is the rulebook's first verb; this makes the spend and its drift readable without turning it into a rate table. Reaches ⟂ Spheres is stated, not blurred. Forecast words stay pre-roll and never a promise.
- [x] No Vision edit needed

## Rulebook impact

- [x] This plan does not change a rule of play. No resource, cost, clock or resolution changes; the record observes only.
- [ ] N/A: `Docs/canon/rulebook.md` untouched

> Brainstorm companion: `Docs/plans/2026-10-05-thr-1713-readable-on-hover-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Window, epsilon, cause count, show-below threshold and kind-tag words are named constants; the phase→cause map is a table |
| 2. Inspectability | PASS | The point of D3: why a pool moved becomes state, traced on window roll, readable through `__DEBUG.getEssenceMovement()` |
| 3. Determinism | PASS | Pure fold of pool diffs; no PRNG; no wall clock |
| 4. Fail-soft | PASS | See the fail-soft table; an absent record is the designed empty state |
| 5. Narrative over mechanical perfection | PASS | Causes are told as phrases ("your threads' upkeep"), not rates |
| 6. Additive over destructive | PASS | New optional field, new registry ids, new optional props; the raw `title` is replaced only where a registry id now exists |
| 7. Performance budget | PASS with note | One reference compare per phase (as the existing seam does), plus a twelve-key diff on the few phases that move the pool; within noise of the 99 ms/tick median. Verify with `npm run test:heavy` and the tick-cost trend |

## Done when

- [ ] 1. **Essence rows explain themselves.** On `?view=game&seeded&size=medium`, after `window.__DEBUG.tick(150)`, hovering any part of a sphere row (label, bar, numeral or arrow) shows a tooltip naming its role and its trend word. For at least one sphere whose `await __DEBUG.getEssenceMovement()` record has a non-zero net, the trend word and arrow match the sign of that net, and the tooltip names at least one cause phrase. No numeral other than the balance appears in the row or its tooltip.
- [ ] 2. **The record is complete.** Unit tests: (a) `recordEssenceMovement` attributes a phase diff to `causeForPhase(phaseId)`, rolls at `ESSENCE_MOVEMENT_WINDOW_TICKS` and keeps `previous`; (b) each of the three out-of-tick spend sites leaves a negative `spend_nudge` / `spend_cast` entry equal to the amount spent; (c) a fixture whose pools never change leaves the record reference-equal (`toBe`).
- [ ] 3. **Nudge-card marks hover.** On a dilemma (`?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`), each card's cost badge, odds pips, sphere mark and keyword chip has a `[data-tooltip-link]` resolving to a registry id. No `title=` attribute remains on `CostPips`/`OddsPips` in the DOM where a `tooltipId` was passed. A registry test asserts every `NudgeCardTypeId` and every pip tier resolves.
- [ ] 4. **Forecast words explain themselves.** The forecast pill's tooltip id is `ui.forecast.<current tier>` and changes when the hand moves the tier. No cast card renders a lowercase tier key (unit test on `CardFace` with each tier).
- [ ] 5. **Factor polarity is a word.** Every `nudge-factor-*` element with `data-factor-polarity` of `for`/`against` contains its kind tag; neutral lines contain none.
- [ ] 6. **Reaches explain themselves on the sheet.** `sheet-reach-tier-*` elements carry a tooltip link; the Reaches heading on bar and sheet resolves `ui.reaches`.
- [ ] 7. **Quintessence leaves the strip.** On a fresh `?seeded` run, `identity-quintessence-*` is absent from the strip and present on the ascendant sheet. A unit test on `selectQuintessenceView` shows `showOnStrip` flips below `ASCENDANT_QUINTESSENCE_STRIP_SHOW_BELOW`.
- [ ] 8. **Four-part browser evidence** at 1920×1080 (screenshot with an essence tooltip open, console, the Done-when 1 `__DEBUG` assertion, a UI-Laws line citing 1, 12, 13/14, 17, 21, 31, 33, 37), plus one screenshot of a nudge card with a keyword tooltip open.
- [ ] 9. `npm run gate` green, plus the engine track (30-tick CLI smoke, `npm run test:heavy`); `tooltipValidation.test.ts` passes for all new entries; interface map and contracts updated.

The round-3 Fixed-when (*a tester can say, unprompted, what one essence bar is for and what a "doomed" card means*) is judged by the next cold playtest round, not by this ticket's closeout.

## Kill criteria

- If round 3 testers still cannot say what an essence bar is for or what "doomed" means, *with these hovers present and confirmed in the deployed DOM*, then hovering is the wrong channel. The next move is an always-visible plain label or a first-contact moment, and that fork goes to Christian.
- If `test:heavy` or the tick-cost trend shows the seam call costs more than noise (over ~2% of the tick median), move the record to sample only the mapped phases.

## Coordination block

**Suggested model:** opus. Seven surfaces and one engine seam, with UI-Laws judgement on each.

**Parallel-safe with:** THR-1687 (engine draw order; disjoint files); THR-1716 (arrival beat: `GameView` time start and onboarding, not the encounter header or ascendant bar).

**Mutex with:**
- THR-1732: both edit `NudgePhaseShell.tsx`, the card row and its pinned bar.
- THR-1730: both may edit `NudgeStageHeader.tsx` and the veil's encounter chrome.

Land after whichever is in flight and rebase; the edits do not overlap in intent.

**Files to touch:**
- Create: `src/engine/essenceMovement.ts` (+ `__tests__/essenceMovement.test.ts`)
- Edit:
  - `src/types/gameState.ts`: optional `essenceMovement`
  - `src/engine/orchestrator.ts`: seam call in `runInlinePhase`
  - `src/components/Game/encounter-stage/nudgeCommit.ts`, `GameView.tsx` (authored-choice spend), `src/engine/playerCastDispatch.ts`: spend tagging
  - `src/types/trace.ts`: trace category + interface
  - `src/components/Game/ascendant-bar/selectors.ts`: trend, hover description, `showOnStrip`
  - `EssenceBlock.tsx`, `IdentityStrip.tsx`, `ReachesBlock.tsx`, `AscendantSheet.tsx`
  - `encounter-stage/shells/NudgePhaseShell.tsx`, `NudgeStageHeader.tsx`
  - `shared/CardFace.tsx`, `shared/OddsPips.tsx`
  - `src/data/ui-content.ts`, `src/data/ascendant-bar-content.ts`, `src/data/nudge-stage-content.ts`
  - `src/debug-bridge.d.ts` + bridge impl
  - `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- **Do not add a percentage, a per-tick number or a "+N" anywhere in the essence tooltip.** Law 13: the balance numeral is the only sanctioned essence number. Causes are phrases.
- **Do not bring back the per-line `ui.nudge_factors` hover** (THR-1478). The tooltip goes on the two-word tag only.
- **Do not re-decide "was Perilous"** (THR-1714 D2, shipped) or the layout (THR-1724, shipped).
- `computeEssenceIncome` at `GameView.tsx:1831` is computed and never read. Leave it alone: removing it is out of scope, and this plan does not use it.
- The keyword copy comes from the card library's existing per-type descriptions. If a type has none, write one plain sentence and flag it in the PR body.
- D9's one-prop meeting switch is documented here so a veto costs one line. Do not pre-emptively suppress hovers in the meeting.

## Intent-judge verdict

**Allow** (2026-10-05, cold `fable` judge, Reversible confirmed). Two GAPs, both fixed in this revision: (dim 3) the trace category registers in `src/types/trace.ts` (`TraceCategory` + `TRACE_CATEGORIES`), not `traceBuffer.ts`; (dim 10) a `## Kill criteria` section now carries the proposal's two criteria. No VIOLATIONs. Substrate claims (`selectors.ts:147` placeholder, `markTooltips` producers, `applyEssenceEarned` seam) verified against source by the judge.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-05 (three independent sonnet auditors, parallel). Condensed; the lane's responses are in brackets.*

### NFP audit

**PASS-with-notes.**

- **Tunability: PASS-with-note.** `ESSENCE_MOVEMENT_CAUSE_BY_PHASE` was referenced but not tabulated. [Fixed: the table is now in Systems design.]
- **Inspectability: PASS.** "D3 makes 'why a pool moved' state", with a trace, a debug accessor and a named production reader.
- **Determinism: PASS.**
- **Fail-soft: PASS.**
- **Narrative: PASS.** Causes are phrases.
- **Additive: PASS.** The quintessence row moves off the strip but stays on the sheet.
- **Performance: PASS-with-note.** There is a 2% kill criterion but no measured baseline. [Accepted: the executor measures with `test:heavy` and the tick-cost trend, per Done-when 9.]
- **Caveat (NFP 2/4).** A spend outside any phase and outside the three tagged sites would go unattributed. [Accepted as stated in the fail-soft table. Done-when 2 pins the three known sites; the executor greps `essencePool:` writes outside `src/engine/phase*` and tags any fourth.]

### Three-pillar audit

**PASS.**

- **Engine, Content and UI:** all three "present-and-substantive".
- **Required sections:** none missing.
- **Wiring:** connects each pillar to a phase, a GameState field, a trace and debug visibility.
- **Substrate:** every row extends, activates or reuses; none replaces. No existing per-cause essence ledger exists in `systems-inventory.md`, so the module is not a duplicate.

### Vision audit

**PASS-with-notes. No contradictions.**

Non-negotiables #1 (player is a god), #2, #3 and #7 are confirmed. The core loop is preserved. Reaches ⟂ Spheres is stated, not blurred.

Soft notes:

- **(a)** The essence balance numeral stays visible under the Law 13 ratified exception; the plan adds no numerals.
- **(b)** The taste profile prefers learning "by reading, not by reading a tooltip". [Accepted with reason: the ticket's own direction chose hover tooltips, after testers asked for them in both rounds. The plan adds no tutorial copy, and the kill criteria name exactly this risk: if hovers do not teach, the next fork, labels or a first-contact moment, goes to Christian.]
