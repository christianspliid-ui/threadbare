> **title:** The Crossroads — read a threaded mortal's next three choices and lean on one — THR-1926
> **linear_issue:** THR-1926 (slice A: engine + content) · slice B (UI) filed at handoff, blocked by THR-1911
> **author:** Claude Code (attended design session, 2026-10-14)
> **created:** 2026-10-14
> **three_pillars:** Engine `done — a decision-time snapshot of the one board, a held lean folded into the board as one more multiplier, the forced God's Will pick switched off behind a flag; no new node type, edge or phase` · Content `done — one content module of words (settledness, forecast, outcome toasts, the mortal's answer by bond reception) and six tooltip ids` · UI `done — one Inspector row on a threaded person's page with arm-then-fire lean controls, one thread-row badge, debug bridge accessors`

# The Crossroads — read a threaded mortal's next three choices and lean on one — THR-1926

*The god already sees what a threaded mortal weighed and can already pay to steer them, but the steer only covers encounters, commands rather than leans, arrives on a timer, and shows a ranking that is not the one that decides. This plan rebuilds that power on the one decision board so the god reads what the mortal really weighs next, encounters and undertakings alike, and leans on it.*

## Why this is load-bearing

Christian, chat 2026-10-14: *"a generic god action that allows the player to see the top 3 things that a threaded agent is considering doing (encounters and undertakings). and then allowing the player to nudge the choice in a certain direction."*

The parts exist. The **Compulsion premonition** (the "God's Will" modal, `premonitionCompulsion.ts`, design `Docs/plans/2026-04-04-divine-premonition-design.md`) builds a list from a threaded mortal's scored encounters and lets the player pay 3–5 essence to steer their next choice. It falls short of the ask in four ways, each verified in source:

1. **Encounters only.** It reads `decision.topCandidates` (`phaseAgentDecision.ts:1576-1580`). Undertakings rank on the same board (`scoreUnifiedBoard`, `decisionBoard.ts:534`) but are never offered.
2. **It commands.** `COMPULSION_SCORE_BOOST = 5.0`, documented "guaranteeing it wins" (`premonition-constants.ts:68-70`). At resolution the override sets `decision.selected` and forces `decisionFamily = 'encounter'` (`phaseAgentDecision.ts:1623-1627`), overriding an undertaking or an idle board. This breaks [Law 9](../game-design/laws.md): *"The god influences; it never commands."*
3. **The game asks, not the player.** It is emitted on a 24-tick cooldown (`COMPULSION_COOLDOWN_TICKS`), never on request.
4. **The list is not the deciding ranking.** It is cut from the legacy `finalScore` top five. The board decides from a different score (`valuePerTick × desire × forecastFit × …`), so the shown order can disagree with what decides. Law 18: *"A forecast that differs from the roll is a bug."*

Meanwhile, normal play's "On their mind" list (`ThreadDetailView.tsx:631`, "What they are weighing") reads `BalanceEvent.rankedEncounterPool`. That is also legacy-ordered, encounter-only, and only written while balance telemetry runs. So the player has two surfaces describing the mortal's options, and neither shows the ranking that decides. That is PC-6 waiting to happen.

What this unblocks: one honest read of a threaded mortal's mind across both families; a god verb that leans instead of commanding; and the retirement of the last forced-choice power on the god's side of the thread.

## Settled inputs

| Input | What it fixes here | Who decided |
|---|---|---|
| Christian's ask, chat 2026-10-14 (quoted above) | Top three, encounters *and* undertakings, then a nudge in a direction | Christian |
| [Law 9](../game-design/laws.md) — the god influences, never commands | The nudge is a weight on the board, never a set pick | Ratified [E] |
| [Law 18](../game-design/laws.md) — the forecast is the roll | The shown ranking and the shown forecast word come from the same board numbers and the same multiplier function the decision uses | Ratified [E] |
| [THR-1433](https://linear.app/threadbare/issue/THR-1433) — one rule for reading a mortal's mind | `canReadIntention` gates the reading; a secret cell is never shown through familiarity alone | Christian via wayfinder THR-1404 |
| [THR-1349](https://linear.app/threadbare/issue/THR-1349) — the one decision board | Encounters and undertakings already compete in one list; the reading reads that list | Shipped |
| [THR-1781](https://linear.app/threadbare/issue/THR-1781) — a paid steer is held until the mortal's next full decision and always answers | The lean's hold, lapse and toast reuse that shape | Shipped |
| [THR-1876](https://linear.app/threadbare/issue/THR-1876) — the Inspector replaces the thread detail column | The UI lands as one Inspector row, not on `ThreadDetailView` | Christian, THR-1827 |

## Decided by this session (veto invited in chat, 2026-10-14)

1. **The lean replaces the forced pick.** God's Will stops being offered (`COMPULSION_PREMONITION_ENABLED = false`) **in slice B, the same change that ships the Crossroads row**, so there is never a build with neither surface. Slice A adds the flag at `true`. A compulsion already held in a save still resolves through the existing path. *Why:* Law 9. The forced pick is the only god power left that sets a mortal's choice. *Veto path:* flip the flag back on to keep God's Will beside the Crossroads (one constant; no code reverts). Christian was asked in chat *"Replace the forced God's Will pick with the lean?"*; this plan builds the recommended answer and the flag keeps the other answer one number away.
2. **The reading is free; the lean costs essence.** The thread page already shows what a threaded mortal weighs at no cost (rulebook §9, *Threads are your intelligence*). The Crossroads makes that list honest rather than selling it. Law 36 binds the *intervention*, the lean.
3. **A snapshot of the real board, not a dry-run preview.** The reading is the board the mortal last decided with, stored on the mortal at that decision. A forward preview would re-run ~400 lines of candidate gathering with five known side effects (funnel counters, trace emission, `anchorHeldWhispers`, arrival-goal consumption, the appointment memo; see Brainstorm §A). The snapshot *is* the deciding ranking (Law 18), costs nothing on the tick path, and survives save and load.
4. **"Next" excludes what the mortal just took.** The snapshot's top three skip the entry the board just chose, because the mortal is already doing it and the lean applies to the *next* free choice. This is the same reasoning as THR-1781's exclusion of the selected encounter (`phaseAgentDecision.ts:1569-1575`), now applied to both families.
5. **No refunds.** The lean is paid before the mortal chooses (Law 19), and the confirm line says so. Rulebook §4 already states *"There are no refunds; the floor is the compensation."*
6. **No pop-up.** A thread-row badge says a mortal is torn. The player opens their page to lean. Nothing interrupts (Law 15, PC-5).

## Substrate inventory

`Docs/canon/systems-inventory.md` greps: `Divine Premonition` (row `2a.9`, orchestrator phase), `planted_compulsion_decay` (a different system: `plant_compulsion` aftermath weights, untouched). `src/engine/` greps for `crossroads`: 0 hits for the system (one prose hit, *"be at the crossroads by the full moon"* in an appointment seed — unrelated). The decision board, premonition steer and intention reading all exist; this plan **extends** them and builds no parallel ranking.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Unified decision board — `scoreUnifiedBoard` (`decisionBoard.ts`) | 🟢 ACTIVE (live since THR-1349) | **extends** — one optional input (`crossroadsLean`) and one optional entry field (`crossroadsLean` multiplier), applied to both families, the `whisperPull` pattern |
| Agent decision phase (`phaseAgentDecision.ts`) | 🟢 ACTIVE | **extends** — writes the snapshot after the board for threaded mortals; reads, applies and clears a held lean; one flag gates the compulsion emitter |
| Divine Premonition — Whisper (`phaseDivinePremonition.ts`, `premonitionSteer.ts`) | 🟢 ACTIVE | **preserved** — the Whisper lean is untouched and stacks with a Crossroads lean (independent multipliers) |
| Divine Premonition — Compulsion (`premonitionCompulsion.ts`, `premonitionActions.applyCompulsionChoice`) | 🟢 ACTIVE | **retired behind a flag** — emission off by default; the resolver stays for held saves and for the veto path. Deletion is not this plan's (additive over destructive) |
| Intention reading (`intentionReading.ts`, THR-1433) | 🟢 ACTIVE | **extends** — new consumer: the reading skips secret cells (`isSecretCellId`) and renders only when `canReadIntention` is readable |
| Premonition essence spend (`spendPremonitionEssence`, THR-1783) and `recordEssenceMovement` | 🟢 ACTIVE | **reused** — the lean's spend lands inside the caller's state update exactly as the compulsion's does |
| Dominion pricing (`dominionScaledCost`, `castTargetBand`, THR-1748) | 🟢 ACTIVE (prices flag-gated) | **reused** — the lean is priced at the mortal's band (Law 37) |
| Thread tug badge (`threadTugBadgeModel.ts`, `ThreadTugBadge`, THR-665) | 🟢 ACTIVE | **pattern reused** — the torn badge is a sibling model, same primitive |
| Encounter foreshadowing (`getEncounterForeshadowing`, THR-389) and undertaking work words (`summarizeActiveUndertakings`) | 🟢 ACTIVE | **reused** — each option's one line in the mortal's voice |
| Bond reception (`thread` edge `bondReception`: awe · devotion · bargain · doubt · defiance) | 🟢 ACTIVE | **read** — keys the mortal's answer line (Law 12) |

Population consumed: threaded mortals only. A run holds The First plus the retinue and later threads (single digits). The snapshot is written for each of them at each full decision.

## Engine pillar

### Systems design

New pure module **`src/engine/crossroads.ts`**: no graph writes and no randomness. It holds everything that turns board entries into a reading and a lean into a multiplier:

```ts
export type CrossroadsFamily = 'encounter' | 'strategic_action';
export type LeanDirection = 'toward' | 'away';

/** One option the mortal weighs. Identity = family + templateId + targetId. */
export interface CrossroadsOption {
  family: CrossroadsFamily;
  templateId: string;
  /** encounter: the cache entry's locationId · undertaking: the candidate's targetNodeId */
  targetId: string | null;
  /** The board score as the board computed it (already including whisper, window, …). */
  score: number;
  reach: ReachDomain;   // prices and tints the lean (REACH_TO_SPHERE)
}

/** Written on the mortal at each full decision (node property `crossroads`). */
export interface CrossroadsSnapshot {
  tick: number;
  /** Top CROSSROADS_OPTION_COUNT after excluding the entry just taken and secret cells. */
  options: CrossroadsOption[];
}

/** Held on the mortal from the click until the next full decision (node property `crossroadsLean`). */
export interface CrossroadsLean {
  family: CrossroadsFamily;
  templateId: string;
  targetId: string | null;
  direction: LeanDirection;
  tick: number;          // when placed — the hold clock
  sphere: CreationSphereName;
  essencePaid: number;
  /** Rank in the snapshot when placed (0-based) — for the trace and the receipt. */
  rankWhenPlaced: number;
}

export function buildCrossroadsSnapshot(
  entries: readonly BoardEntry[], encounterCandidates: readonly ScoredCandidate[],
  strategicCandidates: readonly ScoredStrategicCandidate[], taken: BoardEntry | null,
  isSecret: (templateId: string) => boolean, tick: number,
): CrossroadsSnapshot;
export function crossroadsLeanMultiplier(option: Pick<CrossroadsOption,'family'|'templateId'|'targetId'>, lean: CrossroadsLean | null): number;
export type SettlednessWord = 'set' | 'leaning' | 'torn';
export function settledness(snapshot: CrossroadsSnapshot): SettlednessWord | null;   // null under two options
export type LeanForecast = 'likely' | 'may' | 'not_enough';
export function forecastLean(snapshot: CrossroadsSnapshot, lean: Omit<CrossroadsLean,'tick'|'essencePaid'|'sphere'>): LeanForecast;
export function leanBaseCost(rank: number, direction: LeanDirection): number;
export type LeanOutcome = 'followed' | 'resisted' | 'lapsed_expired' | 'lapsed_unavailable';
export function resolveLeanOutcome(lean: CrossroadsLean, winner: BoardEntry | null, targetOnBoard: boolean, tick: number): LeanOutcome;
```

**One multiplier function, two callers (Law 18).** `crossroadsLeanMultiplier` is called by `scoreUnifiedBoard` on every entry at decision time and by `forecastLean` on every snapshot option at click time. The forecast word is therefore the decision's arithmetic applied to the decision's own numbers. The only difference is time: the world may move before the mortal next chooses. The words say so ("may", and the tooltip line).

New action module **`src/engine/crossroadsActions.ts`** (sibling of `premonitionActions.ts`). It is called by the UI and never by the tick:
- `placeCrossroadsLean(state, agentId, option, direction) → { success, lean, essenceCost, sphere, message }`. It checks eligibility (a `thread` edge from `state.ascendantId`; `canReadIntention` readable; option present in the current snapshot; no lean already held). It prices the lean (`leanBaseCost` → `dominionScaledCost(base, castTargetBand(graph, ascendantId, agentId))`), checks affordability against `essencePool[sphere]`, and writes `crossroadsLean` onto the node (direct property write, then `touchWorld()`). It emits `crossroads_lean_placed`. **It never touches the pool**: the caller spends through `spendPremonitionEssence` inside its `setGameState(prev => …)`, as THR-1783 requires.
- `liftCrossroadsLean(state, agentId)` clears a held lean. No refund; the trace says `lifted`.

### Graph nodes / edges

No new node or edge type (checked `src/types/graph.ts`). Two **actor node properties**, the established shape for decision-carried state (`motiveReceipt`, `compulsionTargetTemplateId`):

| Property | Type | Writer | Readers |
|---|---|---|---|
| `crossroads` | `CrossroadsSnapshot` | `phaseAgentDecision` (threaded mortals, every full decision) | the Inspector row, the torn badge, `placeCrossroadsLean`, debug bridge |
| `crossroadsLean` | `CrossroadsLean \| undefined` | `placeCrossroadsLean` / `liftCrossroadsLean`; cleared by `phaseAgentDecision` at resolution | `phaseAgentDecision` → `scoreUnifiedBoard`; the Inspector row; debug bridge |

Both are plain data and serialize with the graph. A save without them reads "no reading yet / no lean". Property edits call `touchWorld()` per the load-bearing rule: no change detection on graph identity.

### Tick phases

No new phase. Everything runs inside the existing agent decision phase (`phaseAgentDecision.ts`), at three points. In order:

1. **Before the board.** If the actor holds `crossroadsLean`:
   - **Expired.** If `tick - lean.tick > CROSSROADS_HOLD_MAX_TICKS`, resolve it `lapsed_expired`.
   - **Encounter lean.** Make sure its target can reach the board. This is the `resolveCompulsion` pull, extracted as `findHeldEncounter(decision, templateId, locationId)` in `premonitionSteer.ts` so both callers share it. The exact instance on `topCandidates` comes first; then pulled up from `rankedCandidates`; then the same template elsewhere. Without this, a lean toward the third option dies whenever the scorer's top five shifts by one.
   - **Undertaking lean.** No pull is needed: every scored strategic candidate reaches the board.
2. **At the board.** Pass `crossroadsLean` into `scoreUnifiedBoard`. Matching entries multiply by `CROSSROADS_LEAN_TOWARD_MULT` or `CROSSROADS_LEAN_AWAY_MULT`, and the multiplier is recorded on the entry (`BoardEntry.crossroadsLean`). Tie-break and floor are unchanged.
3. **After the live branch, before the Compulsion Override:**
   - **Resolve the lean.** `resolveLeanOutcome(lean, boardWinner, targetOnBoard, tick)`; then emit `crossroads_lean_outcome` and push the outcome toast plus the mortal's answer as one `divine_premonition` event (`isInterventionBeat: true`, the THR-1781 event shape). Clear the property (both handles, the THR-1781 stale-snapshot note).
   - **Engagement gauge (THR-1578).** If the lean changed the winner, set `leanTurned = true` beside `compulsionOverrode`. The gauge then keeps that decision out of the per-band success invariant: a god's lean is not the mortal's free choice (Law 20).
   - **Write the snapshot.** For mortals with a `thread` edge from the ascendant, `buildCrossroadsSnapshot(board.entries, …, taken = boardWinner)` → `crossroads`. An idle board (no winner) still writes a snapshot of what lay below the floor, so a torn idle mortal is readable.
4. **Compulsion emitter.** The block at `phaseAgentDecision.ts:1553` gains `COMPULSION_PREMONITION_ENABLED &&` in front of eligibility. The debug force (`FORCE_COMPULSION_FLAG`) still bypasses it, so the old surface stays reachable for review while it exists.

### Resolution logic

**Settledness** on the snapshot's first two options, `r = s₂ / s₁`:

| `r` | Word | Meaning |
|---|---|---|
| `≥ CROSSROADS_TORN_RATIO` (0.85) | `torn` | one lean, toward the second road or away from the first, turns them with room to spare |
| `> CROSSROADS_LEANING_RATIO` (0.5) | `leaning` | one lean, in either direction, turns them |
| `≤ 0.5` | `set` | no single lean, in either direction, turns them |

The ratios are chosen against both multipliers. Toward: `0.5 × 2 = 1`. Away: the leader times 0.5 falls below the second road exactly when `r > 0.5`. So *set* means set for both directions, and *leaning* is exactly the band where one lean decides it. At `r = 0.5` exactly, the tie keeps snapshot order, so the leader holds; the strict `>` makes that boundary read *set*. The words and the forecast are one arithmetic in both directions. Retuning a multiplier means retuning the ratios in the same commit. Unit tests pin `CROSSROADS_LEANING_RATIO × CROSSROADS_LEAN_TOWARD_MULT === 1` and `CROSSROADS_LEAN_AWAY_MULT === CROSSROADS_LEANING_RATIO`. A third pin checks that `forecastLean` reads `not_enough` in both directions for every `set` snapshot.

**Forecast** (`forecastLean`): apply `crossroadsLeanMultiplier` to every snapshot option and re-sort. Ties break by snapshot order, the board's own rule.
- **toward**: the target leads by `≥ CROSSROADS_LIKELY_MARGIN` (×1.25) → `likely`; leads by less → `may`; still behind → `not_enough`.
- **away** on the leader: the old second option now leads by the same margin → `likely`; leads by less → `may`; the leader holds → `not_enough`.
- **away** on a non-leader is always `likely`, because the leader still leads. The UI only offers *away* on the leader (UI Law 25: no control that cannot matter).

**Outcome** (`resolveLeanOutcome`):

| Condition | Outcome |
|---|---|
| held longer than `CROSSROADS_HOLD_MAX_TICKS` | `lapsed_expired` |
| the target is not on the board (gone, on cooldown, filtered) | `lapsed_unavailable` |
| toward, and the winner is the target | `followed` |
| away, and the winner is not the target | `followed` |
| otherwise | `resisted` |

The identity match is `family + templateId + targetId`. For an encounter, the match falls back to the same template at another place (the `resolveCompulsion` order). The receipt then names the place the mortal actually went.

**Price** (`leanBaseCost`), before Dominion:

| Direction | Rank 0 | Rank 1 | Rank 2 |
|---|---|---|---|
| toward | `CROSSROADS_LEAN_COST_BASE` = 2 | 3 | 4 |
| away (leader only) | `CROSSROADS_LEAN_AWAY_COST` = 2 | — | — |

The rank step is `CROSSROADS_LEAN_COST_PER_RANK` = 1. This stays in today's God's Will band (3–5) at par. Leaning toward the first option affirms the mortal's own choice and is the cheapest. The final price is `dominionScaledCost(base, band)`, inert while `DOMINION_PRICES_LIVE` is false and Law 37 once it flips. The lean is paid in the option's sphere (`REACH_TO_SPHERE[option.reach]`), as the compulsion was.

### PRNG callouts

None. The snapshot, the multiplier, the words, the price and the outcome are all deterministic functions of board numbers and constants. The module must not import `rng` and must not take the shared `decisionRng`: an ordering change there would shift every later agent's draws (the THR-1349 note).

## Content pillar

### Encounter templates

N/A — no template changes. Option lines reuse each encounter's existing foreshadowing (`getEncounterForeshadowing`, with its generic fallback) and the THR-1852 name resolver `resolveCompulsionEncounterName`. The resolver is exported as `resolveEncounterDisplayName`, with the old name kept as an alias (additive).

### Prose tables

New **`src/data/crossroads-content.ts`**. Every string resolves the mortal by name (never a guessed pronoun) and passes `enrichProse`. Representative rendered samples use the seeded First, Kael:

| Key | Rendered sample |
|---|---|
| `CROSSROADS_HEADING` | "Next, Kael weighs" |
| `SETTLEDNESS_LINE.torn` | "Kael is torn." |
| `SETTLEDNESS_LINE.leaning` | "Kael leans one way, but not by much." |
| `SETTLEDNESS_LINE.set` | "Kael's mind is set." |
| `LEAN_FORECAST.toward.likely` | "Kael will likely turn to it." |
| `LEAN_FORECAST.toward.may` | "It may tip Kael." |
| `LEAN_FORECAST.toward.not_enough` | "Not enough to turn Kael." |
| `LEAN_FORECAST.away.likely` | "Kael will likely set it aside." |
| `LEAN_FORECAST.away.may` | "Kael may set it aside." |
| `LEAN_FORECAST.away.not_enough` | "Kael will hold to it anyway." |
| `LEAN_CONFIRM` | "Lean Kael toward The Oath-Breaker's Rite, paid now in Life essence, whatever Kael chooses." |
| `LEAN_HELD` | "Your hand rests on Kael, toward The Oath-Breaker's Rite. It holds until Kael next chooses." |
| `OUTCOME_TOAST.followed` (toward) | "Kael turns to The Oath-Breaker's Rite, as you leaned." |
| `OUTCOME_TOAST.followed` (away) | "Kael sets The Oath-Breaker's Rite aside, as you leaned." |
| `OUTCOME_TOAST.resisted` | "Kael feels your hand and chooses the Tavern Dispute at Greyford anyway." |
| `OUTCOME_TOAST.lapsed_expired` | "Your lean fades: Kael never came free to choose." |
| `OUTCOME_TOAST.lapsed_unavailable` | "Your lean finds nothing to hold: The Oath-Breaker's Rite is gone from Kael's road." |
| `LIFT_TOAST` | "You lift your hand from Kael." |

**The mortal's answer** (`CROSSROADS_ANSWER`, Law 12) is keyed by the thread edge's `bondReception` × outcome class (`followed` / `resisted`). That is 5 × 2 = 10 lines, plus a two-line default for a thread with no reception (THR-1643's no-position threads). Lapses carry no answer, because the mortal never felt the hand. The line is appended to the outcome toast as a second sentence. Samples:
- devotion · followed: "Kael calls it faith."
- defiance · resisted: "Kael pushes the hand away and does not look back."
- doubt · followed: "Kael goes, and wonders whose wish it was."
- bargain · resisted: "Kael weighs your price and finds it short."

The answer is **words only**. It writes no devotion delta: no system reads one, and Law 45 forbids implying one. This is a scope line, not a deferral.

### Attachment content

N/A — no attachments are granted or read.

### Data tables

Tooltip ids in `src/data/tooltip-content*.ts` (≤200 chars, plain register, UI Law 18):

| Id | Text |
|---|---|
| `ui.crossroads` | "What a mortal you thread will weigh at their next free choice, read from how they choose. You can lean on one road." |
| `ui.crossroads.settledness` | "How far ahead their first choice is. A torn mortal can be turned by a light hand; a settled one cannot." |
| `ui.crossroads.lean` | "Your weight on one road at their next free choice. They still choose. Paid now; it holds a few days, then fades." |
| `ui.crossroads.forecast` | "Read from how they weigh things now. The world may change before they choose." |
| `ui.crossroads.torn_badge` | "Torn between roads. Open their page to lean." |
| `ui.crossroads.lifted` | "Lifting your hand frees them from your lean. The essence is not returned." |

## UI pillar

*Screenshot tool: Playwright (DOM) for the Inspector row and the thread-row badge. No WebGL is involved.*

**Slice B, blocked by [THR-1911](https://linear.app/threadbare/issue/THR-1911) (Inspector S3, the Inspector in the game).** It lands as an Inspector row, not on `ThreadDetailView`, which [THR-1912](https://linear.app/threadbare/issue/THR-1912) deletes. UI Law 58: the UI grows by adding entries.

### Player-facing display

**The Inspector row `crossroads`** (D7.1 Person, order 36, right after `intention`; tab overview; visible D·W·F). It renders only when the person has a `thread` edge from the god, `canReadIntention` is readable, and a `crossroads` snapshot exists. Otherwise nothing renders (UI Law 25).

- The heading "Next, Kael weighs", with a `ui.crossroads` tooltip.
- The settledness line, with a `ui.crossroads.settledness` tooltip on the settledness word.
- Up to three option rows, in snapshot order. Each row is an `EntityVisual` chip at the option's kind band: the encounter's scene class, or the undertaking's verb icon (UI Law 1). Then the option name as an identity link: an encounter routes to its place, an undertaking to its target (UI Law 21). Then one line in the mortal's voice (foreshadowing for encounters; the `summarizeActiveUndertakings` work line for undertakings). Then the controls.
- Controls, arm-then-fire (UI Law 48):
  - **"Lean toward"** on every row, and **"Lean away"** on the first row only.
  - Clicking arms the row and shows the confirm strip: the forecast line (`ui.crossroads.forecast` tooltip), the price as cost pips in the sphere's tint (UI Law 15), and the confirm sentence. It offers **"Lean"** and **"Not now"**.
  - If the pool cannot cover the price, the armed strip reads "Not enough Life essence" and "Lean" is dimmed with that reason (UI Law 25: disabled-with-reason).
- **Held state.** While a lean is held, the rows show the held line and the leaned row is marked; the other rows' controls do not render. One control, **"Lift your hand"**, has a `ui.crossroads.lifted` tooltip.

The row shape is the Inspector's `cards` shape plus an act strip. If the THR-1876 shape table has no act affordance by the time slice B is claimed, slice B adds the act strip as an **additive** row-shape option (`act?: ActStripModel`); it does not build a parallel component.

**The torn badge** on the thread row (`ThreadsPanel`). It is a sibling model `crossroadsBadgeModel.ts` beside `threadTugBadgeModel.ts`, rendered with the same `ThreadTugBadge` primitive in its "torn" variant. It shows when the snapshot reads `torn`, no lean is held, and the reading is readable. Its glyph is a forked path from the carved icon registry. Clicking opens the person in the Inspector at the overview tab, scrolled to the `crossroads` row. It is a badge, never an interrupt, and is not registered in `interruptRegistry` (Law 15).

**The retired "What they are weighing" list.** Normal play's list in `EncounterDecisionPanel` (legacy-ordered, encounter-only, telemetry-gated) does not move into the Inspector. **Slice B also removes it from `ThreadDetailView` in normal play**, whichever order slice B and [THR-1912](https://linear.app/threadbare/issue/THR-1912) land in. So two rankings of the same mortal's options never show at once, and the `crossroads` row is the one surface for this fact (PC-6). The designer view keeps its ranked pool.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Inspector row heading | "Next, Kael weighs" | PC-1 | Tooltip `ui.crossroads`: "What a mortal you thread will weigh at their next free choice, read from how they choose. You can lean on one road." |
| Settledness line | "Kael is torn." / "Kael leans one way, but not by much." / "Kael's mind is set." | PC-1, PC-6 | Tooltip `ui.crossroads.settledness`. The badge says the same "torn" from the same snapshot field, word for word |
| Option row (encounter) | "The Oath-Breaker's Rite · Greyford" + "Kael has heard the oath-breaker will be named at dusk, and wants to see it done." | PC-3 | Names come from the THR-1852 resolver and never print a template id. An empty foreshadowing slot falls back to the generic line, never `{name}` |
| Option row (undertaking) | "Survey the ruin · the Sunken Chapel" + "Working toward Recover what was lost." | PC-3, PC-6 | The same words the Journey tab's `the_work` row prints for that undertaking |
| Lean buttons | "Lean toward" / "Lean away" | PC-8 | Tooltip `ui.crossroads.lean`. Clicking arms the row within `--anim-fast` (UI Law 47) |
| Confirm strip | "It may tip Kael." · cost pips · "Lean Kael toward The Oath-Breaker's Rite, paid now in Life essence, whatever Kael chooses." · "Lean" / "Not now" | PC-1, PC-2 | The forecast word *before* paying (Law 17), with tooltip `ui.crossroads.forecast`. The price is shown as cost pips in the sphere tint, never as a numeral in the sentence (UI Laws 13, 15). The sentence names the pool (THR-1783 item 1) |
| Held line | "Your hand rests on Kael, toward The Oath-Breaker's Rite. It holds until Kael next chooses." · "Lift your hand" | PC-4, PC-8 | The paid lean is visible on the page until it resolves. Lifting says "The essence is not returned" in its tooltip |
| Outcome toast | "Kael turns to The Oath-Breaker's Rite, as you leaned. Kael calls it faith." / "Kael feels your hand and chooses the Tavern Dispute at Greyford anyway. Kael pushes the hand away and does not look back." / "Your lean fades: Kael never came free to choose." | PC-2, PC-8 | The after line answers the before line: "may tip" then "turns to" or "chooses … anyway". Every paid lean ends in exactly one toast |
| Thread-row badge | glyph + "Torn" | PC-1, PC-5 | Tooltip `ui.crossroads.torn_badge`. At most one per thread row; it clears when a lean is placed or the mortal chooses |

### Playtest signal

A tester who opens a threaded mortal's page can name the three roads that mortal is weighing. A tester who pays a lean can say, after the next toast, whether the mortal followed it, and why the forecast word said what it did.

### Event notifications

- **One toast per resolved lean** (the four outcomes above), on the THR-1781 `divine_premonition` event channel with `isInterventionBeat: true`. A lean resolves once, so it can never pile (PC-5).
- **No chronicle line of its own.** The encounter or undertaking the mortal starts already writes its line.
- **A placement acknowledgement** inside `--anim-fast`: the row switches to its held state (UI Law 47). The placement does not toast.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getCrossroads(agentId)` (async) returns `{ snapshot, settledness, lean, forecasts: { [optionIndex]: { toward, away? } } }`.
- `window.__DEBUG.leanCrossroads(agentId, optionIndex, direction)` (async) calls `placeCrossroadsLean` and applies the spend through the same state update the row uses. It is for browser-verify only.
- The designer-view board trace row gains a `crossroadsLean` column next to `whisperPull`.
- Typings go in `src/debug-bridge.d.ts`, with contract tests in `src/__tests__/debug-bridge.test.ts`.

### Visual presence (HexMapV2)

N/A — the reading is a page row. Lighting option places on the map belongs to THR-1878's lens work. This plan does not promise it.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `engine/crossroads.ts` (pure) | read by `phaseAgentDecision` | read by the Inspector row view model and `crossroadsBadgeModel` | — (graph node properties) | — | `getCrossroads` |
| `decisionBoard.ts` (`crossroadsLean` input and entry field) | `phaseAgentDecision` (agent decision) | — | — | carried on `decision_board_comparison` and `engagement_decision` entries | designer board row |
| `phaseAgentDecision.ts` (snapshot write, lean apply / resolve, emitter flag) | agent decision | — | `newEvents` (toast) | `crossroads_lean_outcome`, `crossroads_snapshot` (tracing on only) | `getCrossroads` |
| `engine/crossroadsActions.ts` | — (player action) | the Inspector row's act strip | `essencePool` via `spendPremonitionEssence`; `essenceMovement` kind `'crossroads'` | `crossroads_lean_placed`, `crossroads_lean_lifted` | `leanCrossroads` |
| `data/crossroads-content.ts` | — | the row, the toasts | — | — | — |
| `crossroadsBadgeModel.ts` | — | `ThreadsPanel` → `ThreadTugBadge` (torn variant) | — | — | — |

Prose pipeline: every content string passes `enrichProse` at the producer. Option names arrive as declared concept references (UI Law 2), not parsed English. Player controls: the four buttons above, all keyboard reachable. Escape disarms an armed row (UI Law 23).

## Interface impact

| Contract | Action | Detail |
|---|---|---|
| `god-reads-mortal-intention` (THR-1433) | **extend** | New consumer: the `crossroads` row and badge gate on `canReadIntention`; the snapshot drops `isSecretCellId` cells at the producer, so a plot never reaches any reader |
| Decision board inputs (`BoardInput` → `BoardEntry`) | **extend** | New optional input `crossroadsLean` and entry field `crossroadsLean`, the `whisperPull` pattern. Absent means 1; nothing else changes |
| Premonition compulsion → decision (`compulsionTargetTemplateId` …) | **retire producer** (flag, flipped in slice B) | The emitter goes off when the Crossroads row ships; the consumer (`resolveCompulsion` override) stays for held saves and the veto path. A player-facing retirement, so it carries the user-verdict line: the veto was invited in chat on 2026-10-14 |
| **new** `god-leans-mortal-crossroads` | **add** | Producer `placeCrossroadsLean` (the Inspector act strip). Consumer `phaseAgentDecision` → `scoreUnifiedBoard`. Register in `scripts/interface-contracts.ts`, then `npm run generate-interface-map` |
| **new** `decision-board-crossroads-snapshot` | **add** | Producer `phaseAgentDecision`. Consumers: the `crossroads` Inspector row (slice B), `crossroadsBadgeModel` (slice B), `placeCrossroadsLean` (slice A, validates the option is current) and the debug bridge (slice A). Slice A's production read site is `placeCrossroadsLean`, so the contract is live before any UI |
| Engagement gauge (THR-1578 per-band invariant) | **extend** | `leanTurned` joins `compulsionOverrode` as an exclusion |

## Constants table

All constants live in `src/data/premonition-constants.ts` (§ CROSSROADS), beside the premonition tunables they replace and stack with.

| Constant | Default | Purpose |
|---|---|---|
| `CROSSROADS_ENABLED` | `true` | One-flag revert: no snapshot write, no lean apply, no row, no badge |
| `COMPULSION_PREMONITION_ENABLED` | `true` in slice A → `false` in slice B | God's Will emitter. Flipped off only when the Crossroads row ships; `true` afterwards restores the forced pick beside the Crossroads (the veto path) |
| `CROSSROADS_OPTION_COUNT` | `3` | How many next roads the reading shows |
| `CROSSROADS_LEAN_TOWARD_MULT` | `2.0` | Board multiplier on the leaned-toward entry (Whisper is ×1.6, the retired Compulsion ×5) |
| `CROSSROADS_LEAN_AWAY_MULT` | `0.5` | Board multiplier on the leaned-away leader; pinned equal to `CROSSROADS_LEANING_RATIO` by test, so *set* means set for both directions |
| `CROSSROADS_TORN_RATIO` | `0.85` | Second ÷ first score at or above which a mortal reads *torn* (and the badge shows) |
| `CROSSROADS_LEANING_RATIO` | `0.5` | Above which a mortal reads *leaning* (strict); pinned to `1 / CROSSROADS_LEAN_TOWARD_MULT` by test |
| `CROSSROADS_LIKELY_MARGIN` | `1.25` | Lead the leaned target must hold to read *likely* rather than *may* |
| `CROSSROADS_LEAN_COST_BASE` | `2` | Essence for leaning toward the first road, before Dominion |
| `CROSSROADS_LEAN_COST_PER_RANK` | `1` | Extra essence per rank below the first |
| `CROSSROADS_LEAN_AWAY_COST` | `2` | Essence for leaning away from the first road |
| `CROSSROADS_HOLD_MAX_TICKS` | `72` | How long a lean waits for the next full decision (matches the THR-1781 holds) |

## Tracing

Each trace is added to `TraceEntry` (the THR-1065 rule: no orphaned payloads).

```ts
// Emitted when the player places a lean (crossroadsActions.placeCrossroadsLean).
interface CrossroadsLeanPlacedTrace {
  category: 'crossroads_lean_placed';
  tick: number; agentId: string;
  family: 'encounter' | 'strategic_action'; templateId: string; targetId: string | null;
  direction: 'toward' | 'away'; rankWhenPlaced: number;
  forecast: 'likely' | 'may' | 'not_enough';
  essenceCost: number; baseCost: number; dominionBand: DominionBand; sphere: CreationSphereName;
  summary: string;
}
// Emitted when the player lifts a held lean.
interface CrossroadsLeanLiftedTrace {
  category: 'crossroads_lean_lifted';
  tick: number; agentId: string; templateId: string; heldTicks: number; summary: string;
}
// Emitted at the full decision that resolves a held lean.
interface CrossroadsLeanOutcomeTrace {
  category: 'crossroads_lean_outcome';
  tick: number; agentId: string;
  family: 'encounter' | 'strategic_action'; templateId: string; targetId: string | null;
  direction: 'toward' | 'away';
  outcome: 'followed' | 'resisted' | 'lapsed_expired' | 'lapsed_unavailable';
  heldTicks: number;
  winnerFamily: 'encounter' | 'strategic_action' | 'idle'; winnerId: string | null;
  leanTurned: boolean;            // the lean changed the board winner
  forecastAtPlacement: 'likely' | 'may' | 'not_enough';
  summary: string;
}
// Emitted when a threaded mortal's snapshot is written — only while tracing is on (NFP #7).
interface CrossroadsSnapshotTrace {
  category: 'crossroads_snapshot';
  tick: number; agentId: string;
  options: Array<{ family: string; templateId: string; targetId: string | null; score: number }>;
  excludedTaken: string | null; excludedSecret: number;
  settledness: 'set' | 'leaning' | 'torn' | null;
  summary: string;
}
```

`forecastAtPlacement` beside `outcome` is how calibration is measured: the share of `likely` leans that end `followed` is the Law 18 health check. The census reads it, and the [Kill criteria](#kill-criteria) cite it.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| The board throws | The existing `decision_board_error` path. No snapshot is written this decision; a held lean stays held (resolves next decision or lapses on time) |
| A snapshot entry has no matching candidate (index drift) | The entry is skipped; fewer than three options render. Zero options → the row does not render |
| A lean names a template no longer registered | Resolves `lapsed_unavailable` with the generic name noun (`COMPULSION_UNNAMED_ENCOUNTER_NOUN` / "a work nearby") |
| `crossroads` or `crossroadsLean` is malformed in a save | Read as absent (type-guard at read); a malformed held lean is cleared with a `lapsed_unavailable` trace and no toast |
| The thread edge is removed while a lean is held | The lean still resolves at the next decision (paid is paid) and toasts. The snapshot is no longer written |
| The pool cannot cover the lean at click time | `placeCrossroadsLean` refuses and returns the reason; nothing is written or spent (Law 19) |
| `bondReception` is absent | The default answer line |
| Any throw inside the lean resolve | Caught. The decision proceeds unleaned, and the lean is cleared with a trace, so it never resolves twice |

## Deferrals

None. Things the plan deliberately does not do (a devotion delta from the answer, map lighting of option places, deleting the compulsion code) are scope lines with reasons, not TODOs. Deleting the compulsion code belongs to whoever retires the veto flag once Christian's answer is final.

## Blast Radius

Not required: no file in scope has 100 or more importers. Counted by import-specifier grep over `src/` and `scripts/`: `decisionBoard` 8, `phaseAgentDecision` 9, `premonitionSteer` 3, `premonition-constants` 12, `ThreadDetailView` 4, `ThreadsPanel` 7, `GameView` 7, `dominion` 23.

## Three-pillar check

- [x] Engine pillar present — snapshot, lean multiplier, resolution, emitter flag, actions module
- [x] Content pillar present — `crossroads-content.ts` (words, toasts, answers) and six tooltip ids
- [x] UI pillar present — the Inspector row, the torn badge, debug accessors (slice B blocked by THR-1911)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It removes a contradiction: the forced pick against Vision §1, *the god influences, never commands*. The lean keeps the choice with the mortal's own board (Law 11's spirit: the god's weight leans on a choice the mortal makes from its own values).
- [x] No Vision edit is needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**: it adds a god action.
- [x] `Docs/canon/rulebook.md` is updated in the same PR. This plan adds a god action, a rule of play. `Docs/canon/rulebook.md` §4 gains the paragraph **"You can stand at a threaded mortal's crossroads"** in this PR, tagged `[DESIGN — this plan]`. Slice A's executor flips it to `[IMPL]` when the engine ships, and slice B adds the surface reference.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1926-the-crossroads-brainstorm.md`.

## Game Design Laws check

| Law | How the plan keeps it |
|---|---|
| 9 — influence, never command | The lean is a board multiplier; the mortal can resist, and the toast says so. The forced pick is switched off |
| 10 — the player never picks an ending | The lean picks which road the mortal is weighted toward, not how anything on that road resolves; the encounter's own dice are untouched |
| 11 — forks belong to the mortal | The board's desire term is the mortal's values. The lean multiplies it and never replaces it, and a settled mortal reads *not enough* |
| 12 — the thread runs both ways | Every followed or resisted lean carries the mortal's answer, keyed by their bond reception |
| 13 — the world does not wait | Nothing pauses. The reading is a page row; the lean waits on the mortal, not the mortal on the god |
| 15 — interrupts only when asked | The badge is not an interrupt; only threaded mortals carry a snapshot |
| 17 — stakes in words before paying | Forecast word, price and the confirm sentence come before "Lean" |
| 18 — the forecast is the roll | The reading *is* the deciding board; the forecast uses the decision's own multiplier function; `forecastAtPlacement` vs `outcome` is traced for calibration |
| 19 — paid before the dice | The spend lands at the click; no refunds, and the confirm says so |
| 20 — the window | The board score already carries `forecastFit`; a lean can lift an out-of-window road, which is the god imposing odds (allowed), and `leanTurned` keeps it out of the per-band invariant |
| 21 — the same hand every time | No randomness anywhere in the reading or the lean |
| 36 — the purse is small | Every lean costs 2–4 essence at par; the reading is the existing free intelligence of a thread |
| 37 — home ground is cheaper | `dominionScaledCost` at the mortal's band |
| 44 — knowledge never hides content | The reading hides nothing from the world; it only declines to show the god a secret plot, which THR-1433 already rules |
| 45 — never promise what the world will not do | "may", "likely", "not enough" are computed from the deciding numbers; every lean ends in a toast that tells what happened |

No [E] law is broken.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Twelve named constants; two flags (`CROSSROADS_ENABLED`, `COMPULSION_PREMONITION_ENABLED`); the ratio↔multiplier coupling pinned by test |
| 2. Inspectability | PASS | Four trace types including `forecastAtPlacement`; the multiplier rides on `BoardEntry`; `getCrossroads` shows snapshot, lean and forecasts |
| 3. Determinism | PASS | No PRNG, and the shared `decisionRng` is not touched; ties break by board order |
| 4. Fail-soft | PASS | See the fail-soft table; the lean resolve is wrapped and clears itself on any throw |
| 5. Narrative over mechanical perfection | PASS with note | The snapshot can be up to one chapter stale. The words say "may", and the toast tells the truth afterwards; staleness is accepted over a side-effecting dry run (Brainstorm §A) |
| 6. Additive over destructive | PASS | New optional fields and modules. The compulsion is switched off by flag, not deleted. The name resolver gains an alias |
| 7. Performance budget | PASS | One `buildCrossroadsSnapshot` per threaded mortal per full decision over an already-sorted board (≤ tens of entries); the trace is built only while tracing |

## Done when

**Slice A — THR-1926 (engine + content):**
- [ ] `crossroads.ts` exists with the functions above. Unit tests falsify each at its own layer:
  - snapshot excludes the taken entry and secret cells;
  - the toward and away multipliers hit only the matching identity;
  - settledness boundaries at 0.5 (exactly 0.5 reads *set*) and 0.85;
  - every `forecastLean` branch, and `not_enough` in both directions on every `set` snapshot;
  - every `resolveLeanOutcome` row;
  - `CROSSROADS_LEANING_RATIO × CROSSROADS_LEAN_TOWARD_MULT === 1` and `CROSSROADS_LEAN_AWAY_MULT === CROSSROADS_LEANING_RATIO`.
- [ ] `scoreUnifiedBoard` applies `crossroadsLean` to both families, recorded on the entry. A golden test shows an unleaned board's output byte-identical to today's.
- [ ] A seeded integration test with a held toward-lean on the snapshot's second road, on a `leaning` mortal, resolves `followed`. Held on a `set` mortal's third road, it resolves `resisted`. Past `CROSSROADS_HOLD_MAX_TICKS` it resolves `lapsed_expired`. Each emits exactly one outcome trace and one toast event, and clears the property.
- [ ] A lean toward an encounter ranked just outside the scorer's top five still reaches the board (`findHeldEncounter`, shared with `resolveCompulsion`).
- [ ] `COMPULSION_PREMONITION_ENABLED` exists at `true`, so God's Will is unchanged in slice A. A test with the flag forced `false` shows that a 30-tick run queues no `compulsion` premonition, and that a save holding `compulsionTargetTemplateId` still resolves it.
- [ ] `placeCrossroadsLean` refuses for each of: unthreaded, unreadable, held, unaffordable, stale option. On success it writes and does not spend; the spend is the caller's.
- [ ] `crossroads-content.ts` and the six tooltip ids exist; `tooltipValidation.test.ts` passes; no string carries a pronoun guess or a raw id.
- [ ] `window.__DEBUG.getCrossroads` and `leanCrossroads` exist, are typed and are contract-tested.
- [ ] `scripts/interface-contracts.ts` registers the two new contracts; `npm run generate-interface-map`; rulebook §4's paragraph is flipped to `[IMPL]`.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy`, the 30-tick CLI smoke, and the matching wiki pages updated or exempt with a reason.
- [ ] Closing commit body has `Fixes THR-1926` on its own line.

**Slice B — the UI issue (blocked by THR-1911):**
- [ ] `COMPULSION_PREMONITION_ENABLED` flips to `false` in this change; a 30-tick CLI smoke on `--seed 42` queues no `compulsion` premonition.
- [ ] The `crossroads` Inspector row renders per § UI pillar, gated as stated; the torn badge renders from the same snapshot field; normal play's "What they are weighing" list is not carried into the Inspector.
- [ ] Four-part browser evidence at 1920×1080, plus 2560×1440 for the row (Playwright):
  - a screenshot of a torn First's row with the confirm strip armed;
  - the console clean;
  - `await window.__DEBUG.getCrossroads(firstId)` agreeing with the rendered words;
  - after `window.__DEBUG.tick(n)`, the outcome toast on screen;
  - a UI-Laws line covering Laws 1, 13/14, 15, 17, 21, 25, 33, 47, 48, 56, 58.

## Kill criteria

- If, over a 600-tick census on two seeds, fewer than 60% of `likely` leans end `followed` or more than 40% of `not_enough` leans end `followed`, the forecast is not honest. Retune `CROSSROADS_LIKELY_MARGIN` and the ratios before slice B ships.
- If threaded mortals read `torn` on more than half of their decisions, the badge is noise (PC-5). Raise `CROSSROADS_TORN_RATIO`.
- If playtesters report feeling cheated by `resisted`, the lever is the multipliers and the forecast margin, never a return to a forced pick.

## Coordination block

**Suggested model:** opus — the engine slice threads a multiplier through the live board and the decision phase's override ordering (THR-1781's stale-handle traps), where a subtle ordering error silently kills the lean.

**Parallel-safe with:** [THR-1923](https://linear.app/threadbare/issue/THR-1923) settlement economy (economy modules, no decision-phase overlap); [THR-1879](https://linear.app/threadbare/issue/THR-1879) type and icons (UI tokens only).

**Mutex with:**
- Any issue editing `phaseAgentDecision.ts`'s board block (lines ~1355–1680) or `decisionBoard.ts`'s `BoardEntry` / `BoardInput`: two writers on the board's multiplier list collide textually and semantically.
- [THR-1877](https://linear.app/threadbare/issue/THR-1877) (the Stage) touches `PremonitionModal`'s compulsion branch, which this plan makes unreachable in normal play. Whichever lands second drops or keeps the compulsion branch to match `COMPULSION_PREMONITION_ENABLED`.

**Blocked by (slice B only):** [THR-1911](https://linear.app/threadbare/issue/THR-1911) (Inspector S3), which itself follows [THR-1909](https://linear.app/threadbare/issue/THR-1909) (S2a, the person rows the `crossroads` row sits among).

**Files to touch:**

*Slice A:*
- Create: `src/engine/crossroads.ts`, `src/engine/crossroadsActions.ts`, `src/data/crossroads-content.ts`, tests beside each.
- Edit: `src/engine/decisionBoard.ts` (input and entry field, two multiply sites); `src/engine/phaseAgentDecision.ts` (pull, apply, resolve, snapshot write, emitter flag, `leanTurned`); `src/engine/premonitionSteer.ts` (extract `findHeldEncounter`); `src/data/premonition-constants.ts` (§ CROSSROADS); `src/engine/premonitionCompulsion.ts` (export the name resolver alias); `src/types/trace.ts` (four traces); `src/data/tooltip-content*.ts`; `src/debug-bridge.ts`, `src/debug-bridge.d.ts`; `scripts/interface-contracts.ts`; `Docs/canon/rulebook.md` (flip the tag); the essence-movement kind union (add `'crossroads'`).

*Slice B:*
- Edit/create: the Inspector row registry and its view model (per THR-1876's D7 layout), `src/components/Game/crossroadsBadgeModel.ts` (new), `src/components/Game/ThreadsPanel.tsx` (badge), the act-strip row-shape option if absent, `GameView.tsx` (the spend handler, the `handleCompulsionChoice` pattern).

## Notes for the executor

- **Do not read `finalScore` for anything.** The board never reads it. That is how `arrivalCommitment` and `appointmentDiscount` went dead (`decisionBoard.ts:213-232`). The lean lives on `BoardEntry.score` only.
- **Resolve the lean before the Compulsion Override,** and write the snapshot *after* both. A held legacy compulsion (save-only) still wins over a lean; that ordering is deliberate and only reachable from old saves or the veto flag.
- **Clear both handles** (`graph.getNode(agentId)` and the loop's `actor`) when clearing `crossroadsLean`. THR-1781's note at `phaseAgentDecision.ts:1663-1667` documents the double-resolve this prevents.
- **The snapshot's targetId for an undertaking** is `ScoredStrategicCandidate.targetNodeId`. Do not identify an undertaking by `templateId` alone: the board routinely holds the same verb against two targets.
- **Grey zone — undertaking option names.** Use whatever `summarizeActiveUndertakings` prints for a running undertaking of that template and target, so the Journey tab and the reading say the same words (PC-6). If it has no form for a not-yet-started candidate, add one beside it rather than writing a second phrasing.
- **Do not register the badge or the row in `interruptRegistry`.** Nothing about the Crossroads interrupts.

## Intent-judge verdict

**Escalate** (opus, cold context, 2026-10-14). Dimension 1 GAP: retiring God's Will goes beyond the verbatim ask, and the yes/no put to Christian in chat was unanswered. Dimension 12 GAP: (a) *set* contradicted the away-lean forecast for `0.4 ≤ r < 0.5`; (b) the legacy "What they are weighing" list could coexist with the new row. Kill criteria differed between plan and proposal. All other dimensions PASS.

*Author response:*
- (a) fixed: away multiplier 0.5, pinned to the leaning ratio, with a strict boundary and a third test pin.
- (b) fixed: slice B removes the legacy list in normal play, whatever its order against THR-1912.
- Kill criterion added to the plan.
- Escalation question put to Christian in chat: replace God's Will, or keep it beside the Crossroads. The answer sets only slice B's flag default and one rulebook sentence; see § Christian's answer.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14 (sonnet, three cold auditors in parallel, run after the intent-judge fixes)*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 12 named constants covering the multipliers, ratios, margin, costs, hold ticks and two flags. The ratio-to-multiplier coupling is pinned by test |
| 2. Inspectability | PASS | Four typed trace payloads registered in `TraceEntry`, including `forecastAtPlacement` and `leanTurned`. The multiplier is recorded on `BoardEntry.crossroadsLean`. `getCrossroads` and `leanCrossroads` exist. The wiring table fills every column |
| 3. Determinism | PASS | No PRNG and no use of the shared `decisionRng`. Ties break by board order. All functions are pure in board numbers and constants |
| 4. Fail-soft | PASS | 8-row fail-soft table. Properties are type-guarded at read; the lean clears itself on any throw |
| 5. Narrative over mechanical perfection | PASS-with-note | The snapshot can be up to one decision stale. The "may" / "likely" words and the outcome toast disclose this |
| 6. Additive over destructive | PASS-with-note | Changes are additive, and God's Will is flag-disabled, not deleted. Slice B removes the legacy "What they are weighing" list in normal play without a flag |
| 7. Performance budget | PASS | One snapshot build per threaded mortal per full decision. Threaded mortals are single digits. The trace is built only while tracing is on |

NFP AUDIT: PASS-with-notes (see rows above)

*Author response:* row 6 is accepted. The legacy list is replaced by the `crossroads` row in the same change, and keeping both is the PC-6 defect the change exists to prevent. The designer view keeps the raw pool.

### Three-pillar audit

Engine, Content and UI are all present-and-substantive. No required sections are missing. The Wiring table connects each module to its phase, UI component, GameState field (`newEvents`, `essencePool`, the `'crossroads'` essence-movement kind), traces and debug accessor. Substrate inventory is present: it extends the board, decision phase and intention reading, retires Compulsion behind a flag, preserves Whisper, and duplicates no existing subsystem.

PILLAR AUDIT: PASS-with-notes. The notes: Blast Radius undeclared; "Christian's answer" section dangling.

*Author response:*
- A Blast Radius section now states it is not required, with the importer counts.
- § Christian's answer is filled from chat before handoff.

### Vision audit

**Premises:**
- `02-non-negotiables.md` #1, *influence, never command*: extended. The forced pick is replaced by a resistible weight, and the mortal answers.
- #2: confirmed.
- #3, mechanics through prose: touched. Words throughout; the price is in pips.
- #4, graph edges: touched. Option identity is stored as properties, on the `compulsionTargetTemplateId` precedent.
- `00-north-star.md`, witnessing over steering: confirmed.
- `01-core-loop.md`: extended.
- `03-design-tensions.md` #4, legibility vs mystery: extended.
- `taste-profile.md`: confirmed.

No contradictions found.

**Checks:**
- North star: PASS.
- Core loop: PASS-with-note. The lean is placed from a page, outside the attended-moment nudge-card frame.
- Non-negotiables: PASS.
- Design tensions: PASS. Watch dashboard drift if badges multiply.
- Taste profile: PASS.

VISION AUDIT: PASS-with-notes.

*Author response:*
- The lean is deliberately not a nudge card, which belongs to an attended step (UL *Nudge*). It is the premonition family's successor, and premonitions already lived outside encounter steps. The torn badge is bounded at one per thread row, and the kill criterion caps its frequency.
- The price numeral was removed from the confirm sentence in this revision; it is pips only.
- A lean names an option (a template at a place), not a relationship between two entities, so a property is correct under #4.
