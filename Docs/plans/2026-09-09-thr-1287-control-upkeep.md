> **title:** `A hold is kept by working it — control upkeep through the cells that already exist — THR-1287`
> **linear_issue:** THR-1287
> **author:** `Claude Code`
> **created:** 2026-09-09
> **three_pillars:** Engine `done` · Content `done — one chronicle line, one rulebook sentence, one canon paragraph, one wiki paragraph; no encounter prose` · UI `done — no component edit; the surfaces that already render a mortal's hold (the hex strategic presentation, the roster's doing-line, the narrative log) show a hold that now survives when worked; evidence by adapter test and CLI, not capture`

# A hold is kept by working it — THR-1287

*A mortal who claims a town holds it for exactly thirty ticks and then loses it, whatever they do in the meantime — because nothing in the engine ever resets the neglect clock. The wiki says "a grip you stop renewing slowly opens", the strategic prose says "monopoly is an activity", and the grid's harvest cell lets the holder hold court in the very town they are about to lose. This plan makes working the hold what keeps it.*

## Why this is load-bearing

The predicate the ticket states is true on `main` `a87e8f24` (re-verified 2026-09-09): every write to `StrategicControlState.neglectTicks` in `src/` is either the initial `0` at claim (`strategicActionLifecycle.ts:558`) or `control.neglectTicks + 1` in the per-tick loop (`:1130-1141`), and `degradation` only ever rises (`Math.min(1, control.degradation + STRATEGIC_CONTROL_DEGRADATION_RATE)`, `:1133`). With `STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS = 10` and `STRATEGIC_CONTROL_DEGRADATION_RATE = 0.05` (`strategic-action-constants.ts:155-158`), every stance collapses at tick 30 after it was made. THR-1442 measured 102 collapses across three seeds in 300 ticks.

Two things changed since the ticket was filed, and both make it more load-bearing, not less. **THR-1303 deleted the control *family* and kept the *machine*** (`43b8dfb0`, 2026-09-08; impediment #990): the six ambition-driven control templates, `computeControlPressure`, the claim gate and the `control_obligation` reason are gone, but `StrategicControlState`, the neglect loop and `retireControl` stayed — because between the plan and its pickup the undertaking grid made `control:claim` one of its six verbs and routed it through that same loop (`undertaking-objects.ts:1196`, the only `{ mode: 'claim_control' }` in the codebase). THR-1292 §6's line *"THR-1287 is superseded by this deletion"* is therefore void; this plan corrects it in place. **THR-1392 ruled `hold` out as a verb** (`2026-09-03-thr-1392-verb-object-undertakings.md:349`, blocking critic finding 1: *"`hold` is not a completion verb … control stays its own mode"*) and preserved the loop as *"the existing sustained `claim_control` mode with its upkeep, degradation and collapse, unchanged"*. So the design had twice affirmed the loop and twice declined a verb for it — but one earlier verdict pointed the other way, and the first intent-judge run caught its omission: **THR-1280** (2026-08-26) chose *"control upkeep removed — ownership becomes a worldly-belongings attachment category acquired and lost through projects and events, never tick maintenance"*, which shipped as the UL's **Freehold** (`owns`, seize-transferable, no clock). That made the fork *whether* a claimed town is a commitment or a possession, not *how* to renew it, and it went to Christian. **His ruling (chat, 2026-09-10), verbatim:** *"it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized."* So: a Freehold is what a mortal founds, buys or seizes as property; a *claimed* town is the one kind of holding that must be kept, and it decays unless worked. The second half of his answer — a held town as a faction position — is a design expansion filed as [THR-1448](https://linear.app/threadbare/issue/THR-1448); this plan leaves the stance record as the seam it reads and builds none of it. The route this plan declines, named so no one re-derives it: **finish THR-1292 §6 by minting `control:claim × Location` as a Freehold and deleting the clock** — declined because Christian ruled the claimed town a commitment, and because the grid's only sustained mode would otherwise become a possession with no way to lose it but seizure. With that settled, the shape that fits is **upkeep as a property of the work the holder already does on the thing they hold.** THR-1439 shipped that work: `use × Location` is `drawYield` (`undertaking-objects.ts:1188-1193`), ownership `own`, `LOCATION.ownedVia` includes `controls`; `change:raise × Location` raises its prosperity, ownership `own`. A holder harvesting their town is a live, reachable, once-per-`YIELD_DRAW_COOLDOWN_TICKS` act today — and it does not touch `neglectTicks`.

What attending costs and what it buys, which is the question THR-1286 scoped out: it costs the work (a harvest already costs the town prosperity and the holder standing there, on every band, THR-1439; a raise costs the checkpoint's difficulty and duration); it buys the clock back and a quarter of the grip. A hold nobody works still collapses on the same schedule — the THR-1286 invariants (collapse retires the record and its `controls` edge; a self-decayed target cools down before re-claim) are untouched.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Strategic Projects & Control** — `StrategicControlState` (`strategicAction.ts:951-968`), the neglect loop (`strategicActionLifecycle.ts:1104-1143`), `retireControl` (`:1223`), the `claim_control` arm (`:540-574`), `claimControl` / `releaseControl` (`strategicGraphOps.ts`), `STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS`, `STRATEGIC_CONTROL_DEGRADATION_RATE` | 🟢 ACTIVE | **extends** — one renewal function beside the loop; the loop, the constants and the collapse are unchanged |
| **Ambitions & Undertakings** — the verb × object registry (`undertaking-objects.ts`), `OWNERSHIP_BY_VERB` (`strategic-action-constants.ts:982`: `use: 'own'`, `'change:raise': 'own'`), `undertakingResolver.ts` (dispatches the completion semantic with `input.outcome`), the completion arm in the lifecycle | 🟢 ACTIVE | **connects** — a completed renewing cell on a held Location renews the stance; no new verb, no new cell |
| **Mortal Economy & Prosperity** — `drawYield` (THR-1439, `yieldOps.ts`), `modifyLocationProperty` | 🟢 ACTIVE | **preserves** — the harvest and the raise keep their own costs and effects; renewal is a side effect of their completion, not a change to them |
| `transferHolding` (`control:seize × Location`, `undertaking-objects.ts:1197`) | 🟢 ACTIVE | **verifies and, if absent, adds** the loser's stance retirement on seize (the THR-1286 invariant *live `controls` edges equal active stances*) |
| Chronicle & narrative log — the `agent_action` tick event `retireControl` emits (`:1248-1255`) | 🟢 ACTIVE | **extends** — one sibling event on a recovery |

**Grep evidence (2026-09-09).** `neglectTicks` writers: `strategicActionLifecycle.ts:558` (initial 0), `:1130`, `:1136`, `:1138`, `:1141` (all `newNeglect`); reader `strategicTelemetry.ts:97`. `degradation` writers: `:1133` (monotone up). `{ mode: 'claim_control' }` once, `undertaking-objects.ts:1196`. `UNDERTAKING_VERB_VARIANTS` = `create · change:raise · change:lower · use · control:claim · control:seize · destroy · observe` — no `hold`, `renew`, `keep`. `already_held` is unreachable from the grid (THR-1442: 3425 live-stance ownership readings, every one `own`, so `control:claim`'s `unowned` rule excludes a held target before any gate). `strategicPresentation.ts:211` and `:398` read `strategicState.controls` into the hex presentation consumed by `AgentInfoCard`, `ThreadDetailView`, `ThreadsPanel` and `GameView`. Census (THR-1439 handoff): `claim × Location` started 8 · 0 times in 150 ticks on seeds 42 · 99 — a renewed hold is organically rare on 99, which the Done-when accounts for.

## Engine pillar

### Systems design

**The rule.** When a mortal completes an undertaking cell whose variant is in `CONTROL_RENEWING_VARIANTS` on a Location they hold through an active `StrategicControlState`, and the outcome band ranks at or above `STRATEGIC_CONTROL_RENEWAL_MIN_BAND` on the six-value `StepOutcome` ladder (critical success, success, success-at-cost renew; **near-miss, failure and critical failure do not**), the stance is renewed: `neglectTicks` returns to `0` and `degradation` falls by `STRATEGIC_CONTROL_RENEWAL_RECOVERY`, floored at `0`. The comparison is a **rank test against the constant** — `bandRank(outcome) >= bandRank(STRATEGIC_CONTROL_RENEWAL_MIN_BAND)` over the ladder's declared order — and deliberately **not** `isStepSuccess`, which admits `near_miss` (`unifiedAction.ts:2623`) and would leave the constant decorative. A failed harvest — a court held for nothing, a tithe refused — pays its costs (THR-1439) and renews nothing; the clock keeps running.

**One function, one site.** `renewControlStance(controls, actorId, targetNodeId, variant, outcome, tick): { controls: StrategicControlState[]; renewed?: { before: StrategicControlState; after: StrategicControlState } }` in `strategicActionLifecycle.ts`, pure over the controls array. The ladder order it ranks against is `STEP_OUTCOMES` (`unifiedAction.ts:2687-2694`, exported best-first from `critical_success` to `critical_failure`): rank is `STEP_OUTCOMES.indexOf(band)` with a lower index being better, so *renews* is `indexOf(outcome) <= indexOf(STRATEGIC_CONTROL_RENEWAL_MIN_BAND)`. No hand-written rank table, so nothing to drift; an unknown band ranks `-1` and is treated as no renewal (fail-soft), and the test asserts `near_miss` sits below the constant. It is called from the lifecycle's cell-completion arm — the site that already holds `candidate.actorId`, `candidate.targetNodeId`, the template's `cellVariant` and the outcome the resolver was handed (`undertakingResolver.ts:199`, `outcome: input.outcome`) — immediately after the completion semantic's ops are folded, so a renewal never runs for a cell that refused. The active-stance test is `control.active && control.actorId === actorId && control.targetNodeId === targetNodeId`; a holder can have at most one such stance per target (the claim arm's `already_controls` refusal and the grid's `unowned` rule guarantee it), so the first match is the match.

**Seize retires the loser.** `control:seize × Location` runs `transferHolding`, which moves the `controls` edge. If the previous holder's `StrategicControlState` stays `active` after that, the record is a live stance with no edge — the exact shape THR-1286's retirement work exists to prevent, and one the neglect loop would carry for up to thirty ticks before `releaseControl` found nothing to release. The executor writes the test first (claim, seize by another, assert no active stance for the loser); if it fails, the seize completion retires the loser's stance through `retireControl` with `event: 'seized'` and a `seizedById`. If it passes, the test stays as the pin.

**What does not change.** The neglect loop's arithmetic, the grace and degradation constants, `retireControl`, the collapse event and trace, the re-claim cooldown (`STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS`, THR-1442), `drawYield`'s costs and cooldown, `claimControl`, the `controls` edge, the ownership rules. No verb is added — THR-1392's ruling stands, and this plan is why it can.

### Graph nodes / edges

None. Renewal writes two numbers on a `StrategicControlState` in `strategicState.controls`; the `controls` edge is untouched. Seize retirement (if added) releases an edge that `transferHolding` already re-pointed — it removes a dead record, not a relationship.

### Tick phases

None new. Renewal runs inside the existing cell-completion arm (phase `2a.55`); the neglect loop keeps its slot.

### Resolution logic

The band the resolver already rolled decides renewal, by rank against `STRATEGIC_CONTROL_RENEWAL_MIN_BAND` on the ladder `STEP_OUTCOMES` already exports in order (`unifiedAction.ts:2687-2694`) — never `isStepSuccess`, which admits `near_miss`. No new scoring, no new candidate, no change to the board.

### PRNG callouts

None. No draw; renewal is a deterministic consequence of a resolved band.

## Content pillar

### Encounter templates

N/A — no encounter is authored or edited.

### Prose tables

One chronicle line, emitted only when a renewal recovers degradation that had already begun (a routine reset on a healthy hold is noise the player does not need): `${actorName} keeps their grip on ${targetName}` — plain register, significance `CONTROL_RENEWAL_EVENT_SIGNIFICANCE`, the same `agent_action` event shape `retireControl` uses for *loses control*. Authored in `src/data/strategic-action-constants.ts` beside the collapse message so the two read as a pair.

### Attachment content

N/A.

### Data tables

Four constants (table below). **The word.** The UL moved the ownership sense of "holding" to **Freehold** (THR-1314), and no glossary term names a Location kept by commitment; this plan uses **hold** for it throughout and files the term as [THR-1449](https://linear.app/threadbare/issue/THR-1449) — a *hold* is claimed and kept by working it; a *Freehold* is owned and kept until seized; player-facing prose never uses one for the other. **Rulebook** (`Docs/canon/rulebook.md`, in the undertakings rules under the `control` verb — not the Freehold/possessions rules): one sentence tagged `[IMPL]` on ship — *A hold — a town a mortal has claimed rather than founded, bought or seized — is kept by working it: harvesting or improving what they hold resets the neglect that would otherwise open the grip within a few days; a hold nobody works collapses on a fixed clock. A Freehold is owned, not held, and has no clock.* **Canon** (`Docs/canon/undertakings.md`): the control paragraph gains the same fact and the same distinction. **Wiki** (`Essence, Control & Sustained Power` — its `sources` include `strategicActionLifecycle.ts` and `strategic-action-constants.ts`, so the freshness gate fires): the mortal-hold paragraph that already says *a grip you stop renewing slowly opens* becomes true and says how one renews it. **Plan-doc correction** (docs-only, this PR): `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md:393-394` gains a dated note that the supersession it promised did not happen, pointing here.

## UI pillar

*Screenshot tool: none owed — no file under `src/components/`, `src/hooks/`, `src/contexts/` or `src/index.css` is edited. Evidence is the adapter test on `strategicPresentation` and the CLI run. If the executor finds a component edit necessary after all, the Playwright route on `?view=game&seeded&size=medium` applies and the four-part evidence is owed.*

### Player-facing display

No new surface. The surfaces that show a mortal's hold today keep showing it — the hex strategic presentation (`strategicPresentation.ts:398-406` → `AgentInfoCard`, `ThreadDetailView`, `ThreadsPanel`), the roster's doing-line and the codex ledger (THR-1434) — and what changes is what they show over time: a worked hold persists, an unworked one opens. Whether the hold's *health* (degradation) is rendered anywhere in words is the executor's first check; if it is not, renewal stays a system-visible quantity by the visibility-parity rule (Law 13's THR-1136 clause — a quantity with no player surface is not reported in the aftermath either), and the recovery chronicle line is the one place the player hears it. If it is rendered, the existing word bands keep rendering it and the test asserts the word moves back.

### Event notifications

The recovery line in the narrative log (chronicle-eligible at its significance). No toast — a mortal's work is followed through the moment stream (THR-1299), and a finish already opens a moment card; renewal is a property of that finish, not a second interrupt.

### Debug inspection (DebugPanel)

- The strategic debug tab already lists `strategicState.controls` with `neglectTicks` and `degradation` (`strategicTelemetry.ts`); a renewed stance shows the reset there.
- `renewed` traces in the trace viewer.

### Visual presence (HexMapV2)

N/A — the hex presentation's `controls` entries are unchanged in shape.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/strategicActionLifecycle.ts` (`renewControlStance`, called from the cell-completion arm; seize retirement if added) | `2a.55` (completion) | — | `strategicState.controls` (two numbers on an existing record) | `strategic_control_lifecycle` (`renewed`, `seized`) | strategic debug tab; `__DEBUG.getStrategicHistory()` |
| `data/strategic-action-constants.ts` (four constants, one line) | — | — | — | — | — |
| `Docs/canon/rulebook.md`, `Docs/canon/undertakings.md`, the wiki page | — | — | — | — | — |

Prose pipeline: none. Player controls: none — mortals' work.

## Constants table

In `src/data/strategic-action-constants.ts` beside the grace and rate (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONTROL_RENEWING_VARIANTS` | `['use', 'change:raise']` | the cells whose completion on a held Location renews the hold |
| `STRATEGIC_CONTROL_RENEWAL_MIN_BAND` | `'success_at_cost'` | lowest band that renews, compared by ladder rank — `near_miss` and below never renew (not `isStepSuccess`, which admits `near_miss`) |
| `STRATEGIC_CONTROL_RENEWAL_RECOVERY` | `0.25` | degradation recovered per renewal (five degrading ticks' worth) |
| `CONTROL_RENEWAL_EVENT_SIGNIFICANCE` | `0.4` | the recovery chronicle line's significance |

## Tracing

Extend the registered `StrategicControlLifecycleTrace` (`src/types/trace.ts:2506`) — register the members, do not duck-type (`emitTrace`'s `Omit` collapses unions):

```ts
// StrategicControlLifecycleTrace (extended)
interface StrategicControlLifecycleTrace extends TraceBase {
  category: 'strategic_control_lifecycle';
  actorId: string;
  targetNodeId: string;
  event: 'collapsed' | 'reclaim_refused' | 'already_held' | 'renewed' | 'seized';
  variant?: UndertakingVerbVariant; // renewed: the cell that did it
  degradationBefore?: number;       // renewed
  degradationAfter?: number;        // renewed
  seizedById?: string;              // seized
  cooldownRemaining?: number;
  edgeReleased?: boolean;
}
```

One trace per renewal — a handful per hundred ticks on the census seeds; no batching needed.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Completion arm has no `targetNodeId` or no `cellVariant` | no renewal attempted; nothing traced |
| No active stance matches actor + target | no-op (the common case — most harvests are on Locations held through `owns`, not a stance) |
| `outcome` absent on the completion input | treated as failure: no renewal (the semantic's own `failure` arm convention, THR-1439) |
| `degradation` already `0` | `neglectTicks` resets; no recovery event (nothing to recover) |
| `transferHolding` moved the edge but the loser's stance lookup finds none | nothing to retire; trace nothing |
| Two active stances match (should be impossible) | renew the first; `console.warn` once; the invariant test catches it |

## Interface impact

Rows in `Docs/canon/interface-map.generated.md` for **Strategic Projects & Control** are 🟠/⚪ for the stance lifecycle; per Step 0.7 this plan writes what it touches and the executor registers the row.

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| Cell completion → stance renewal | **add** | `undertakingResolver` outcome + cell variant → `renewControlStance` → `strategicState.controls` (read by the neglect loop, `strategicPresentation`, the debug tab) |
| `control:seize` → loser's stance retired | **add** (pin or repair) | `transferHolding` → `retireControl(event: 'seized')` |
| Neglect loop → collapse | **preserve** | unchanged |
| `controls` edge ↔ active stance (THR-1286 invariant) | **preserve** | the seize pin is its second guard |

## Blast Radius

No file with ≥ 100 importers is edited. `src/types/trace.ts` (120) gains members on an existing interface's union; the ratchet covers it. `strategicActionLifecycle.ts` and `strategic-action-constants.ts` are both below the cutoff.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (no edit; surfaces and evidence named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It makes a mortal's hold something the mortal *exercises* — sovereignty as an activity, not a timer (`02-non-negotiables.md` #1's two-way premise: mortals exercise what they have). The god touches none of it. Failure is plot (`Vision/00-north-star.md`): a hold that opens because its holder stopped working it is a story, and one they can now tell.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan **changes a rule of play** for mortals' holds. The sentence in § Data tables is added to `Docs/canon/rulebook.md` in the same PR, tagged `[IMPL]` on ship, and the canon and wiki paragraphs move with it.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code — the executor re-verdicts the holdings section when the tag flips to `[IMPL]`.

> Brainstorm companion: `Docs/plans/2026-09-09-thr-1287-control-upkeep-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | four named constants; the renewing set is a table |
| 2. Inspectability | PASS | `renewed` / `seized` traces with before/after; the debug tab; the recovery line |
| 3. Determinism | PASS | no draw; a consequence of a rolled band |
| 4. Fail-soft | PASS | six rows; every absent input is a no-op |
| 5. Narrative over mechanical perfection | PASS | a failed harvest renews nothing — the court held for nothing is the story |
| 6. Additive over destructive | PASS | one function, four constants, two trace members; no verb, no cell, no edit to the loop |
| 7. Performance budget | PASS | one scan of a short array per cell completion |

## Done when

- [ ] Unit, on fixtures that falsify: a `success_at_cost` `use` on a held Location resets `neglectTicks` and lowers `degradation` by the constant, floored at 0; a `near_miss` and a `failure` renew nothing (the `near_miss` case is the one `isStepSuccess` would get wrong); `change:lower`, `observe` and `destroy` renew nothing; a `use` by a non-holder renews nothing; a renewal emits the `renewed` trace with before/after; recovery from `degradation > 0` emits the chronicle line and a reset from `0` does not; the rank table's keys equal `StepOutcome`'s member list
- [ ] The ticket's second Done-when clause — *`strategic_control` decisions that fire produce a state change rather than a refusal* — is already true on `main` (THR-1442 measured `already_held` unreachable from the grid; the `control:claim` cell is offered only on `unowned` targets) and is carried here as the existing `strategicControlChurn.test.ts` pin, which this ticket keeps green rather than re-proves
- [ ] Generated small world on `cells`: claim (through the review lever) → advance past the grace → a renewing cell completes → advance to 40 ticks after `establishedTick` → the stance is still `active` (the ticket's own Done-when: alive past the fixed grace-plus-degradation window); the control-less twin collapses at tick 30
- [ ] The seize pin: claim by A, `control:seize` by B → no active stance for A, one `controls` edge, and the invariant assertion *live `controls` edges equal active stances* holds
- [ ] `census:cells`, seeds 42 + 99, 150 ticks: the count of renewals and the count of stances alive past tick 30 reported on the ticket (organically rare on 99 — the generated-world test is the acceptance; the census is the measurement)
- [ ] Rulebook sentence, canon paragraph, wiki paragraph landed; the THR-1292 §6 note landed; `check:wiki-freshness:blocking` green
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-1287`

## Kill criteria

- Holds never collapse on the census seeds once renewal lands (a holder harvests every cooldown and the grip never opens) → `STRATEGIC_CONTROL_RENEWAL_RECOVERY` halves before the grace moves; the rate goes on the ticket.
- A renewal fires on a Location the actor holds through `owns` rather than a stance → the lookup is on the wrong record; only `StrategicControlState` renews.
- Two active stances for one actor on one target ever appear → the claim path's guard regressed; fix there, never in the renewal.

## Coordination block

**Suggested model:** sonnet — one pure function at one call site, four constants, two trace members, three doc paragraphs; the seize pin is the only investigation.
**Parallel-safe with:** [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar; disjoint), [THR-1134](https://linear.app/threadbare/issue/THR-1134) (incident snapshot; disjoint), [THR-1222](https://linear.app/threadbare/issue/THR-1222) (content; disjoint).
**Mutex with:** any ticket editing `src/engine/strategicActionLifecycle.ts` or `src/data/undertaking-objects.ts` — none queued at handoff; [THR-1348](https://linear.app/threadbare/issue/THR-1348) if it is designed to widen the decision loop (it would change how often a holder works a hold, not the renewal rule — sequence either order, re-run the census after both).
**Files to touch:** `src/engine/strategicActionLifecycle.ts` (`renewControlStance`; the completion-arm call; seize retirement if the pin fails), `src/data/strategic-action-constants.ts` (four constants, one line), `src/types/trace.ts` (union members + three fields), `src/data/undertaking-objects.ts` (only if the seize repair lives in the `control:seize` semantic), `Docs/canon/rulebook.md`, `Docs/canon/undertakings.md`, `public/wiki/essence-control-reference.html` (or whichever file the manifest names for *Essence, Control & Sustained Power*), `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` (the dated note at §6), `scripts/interface-contracts.ts`, tests: `src/engine/__tests__/controlRenewal.test.ts` (new), `strategicControlChurn.test.ts` (the seize pin joins it), a generated-world test beside `yieldBandCells.test.ts`.

## Notes for the executor

- **No new verb.** THR-1392 ruled `hold` out and THR-1303 kept the loop for the grid; this plan is the shape that respects both. If it seems easier to add `control:renew`, read the survey's list of thirteen total verb tables first — that is the cost the design declined.
- **Renewal is a side effect of completion, not of the semantic.** Do not put it inside `drawYield`; the harvest must not know about stances. The lifecycle's completion arm sees the variant, the outcome and the target, and that is where the rule lives.
- **Write the seize test before touching seize.** It may already pass (`transferHolding` may retire the record); if it does, keep the test as the pin and change nothing there.
- **Most harvests renew nothing.** A mortal holding a Location through `owns` (a founded settlement, a seized freehold) has no `StrategicControlState`; only a stance from `control:claim` renews. The no-op is the common path — keep it O(1) in the common case (early return when `controls` is empty).
- **The recovery line is the only player-facing word,** and it fires only when degradation was already above zero. A healthy hold being worked is silent.
- **The wiki gate will fire** (`strategicActionLifecycle.ts` and `strategic-action-constants.ts` are in the *Essence, Control & Sustained Power* page's sources). Update the mortal-hold paragraph; do not exempt.
- **Do not build the faction position.** Christian's answer had a second half — a held town is *"probably also a faction position … could open up specific encounters within that faction and influence what undertakings are prioritized"* — and it is [THR-1448](https://linear.app/threadbare/issue/THR-1448), a design ticket sequenced after this one. The stance record (`actorId`, `targetNodeId`, `establishedTick`, `neglectTicks`, `degradation`) is the seam it will read; add nothing to it here.
- **The word is *hold*, never *holding* and never *Freehold*.** [THR-1449](https://linear.app/threadbare/issue/THR-1449) is the glossary proposal; use the term in the rulebook sentence, the chronicle line and any test name, and keep the Freehold strand on the sheet untouched.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-09): Escalate** — impact class Reversible confirmed; eight dimensions PASS, three GAPs. The escalating GAP (dimension 1): the plan called the clock-based shape forced while the ticket's own comment record carried a prior director verdict the other way (THR-1280, *"never tick maintenance"*, shipped as Freehold), so the fork was *whether* (commitment vs possession), not *how*. Escalation question put to Christian in chat; **answered 2026-09-10: commitment** (verbatim in § Why this is load-bearing; recorded on the ticket as *human gate satisfied via chat review 2026-09-10*). The two author-fixable GAPs — `isStepSuccess` admits `near_miss` against the constant (dimension 4); *holding* collides with the UL's Freehold ruling and the clock-based hold has no term (dimension 6) — are resolved in this revision: rank comparison against the constant with a `near_miss` falsifier; the word *hold* with [THR-1449](https://linear.app/threadbare/issue/THR-1449) filed. The judge's two further asks are also in: the Freehold route is named and declined in § Why, and the ticket's second Done-when clause is carried as the existing THR-1442 pin. The faction-position half of Christian's answer is filed as [THR-1448](https://linear.app/threadbare/issue/THR-1448) and excluded here.

**Run 2 (fable, cold, 2026-09-10): Allow** — Reversible confirmed with the sign-off present; ten dimensions PASS, one GAP (dimension 4: § Resolution logic still named `isStepSuccess` from the run-1 draft, contradicting § Systems design and the constants row) — fixed in this revision, and the judge's note that `STEP_OUTCOMES` already exports the ordered ladder replaced the hand-written rank table with an `indexOf` rank. Two non-scoring notes: *holding* survives in the generic sense in agent-facing prose (the player-facing sentence is clean); the ticket's second Done-when clause is carried as the THR-1442 pin.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-10 (sonnet, three auditors spawned in one message, on the post-escalation revision).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 4 named constants (`CONTROL_RENEWING_VARIANTS`, `STRATEGIC_CONTROL_RENEWAL_MIN_BAND`, `STRATEGIC_CONTROL_RENEWAL_RECOVERY`, `CONTROL_RENEWAL_EVENT_SIGNIFICANCE`) beside the existing grace/rate; no magic numbers in the rule text |
| 2. Inspectability | PASS | Wiring table matches the checklist; `renewed`/`seized` registered (not duck-typed) with before/after fields; debug tab + `__DEBUG.getStrategicHistory()`; the recovery chronicle line |
| 3. Determinism | PASS | "No draw; renewal is a deterministic consequence of a resolved band" — a pure function over existing state |
| 4. Fail-soft | PASS | 6-row table: missing target/variant, no matching stance, absent outcome, zero-degradation edge, orphaned edge after seize, the impossible double-stance (warn + first match, never a throw) |
| 5. Narrative over mechanical | PASS | near-miss/failure/crit-failure deliberately excluded so a lost hold stays a story |
| 6. Additive over destructive | PASS | one function, four constants, two trace members; loop, constants, `retireControl`, collapse unchanged; seize retirement is pin-or-repair, tested before touched |
| 7. Performance budget | PASS | one scan of a short array per cell completion; `trace.ts` gains union members only |

**NFP AUDIT: PASS.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | all five subsections with concrete module/line references (`renewControlStance`, phase `2a.55`) |
| Content | present-and-substantive | Encounter templates and Attachment content N/A with reasons; Prose tables and Data tables substantive |
| UI | present-and-substantive | no component edit, with the visibility-parity rationale and the existing surfaces named |

No missing required sections. Wiring present per module (the consuming components are named in the UI prose rather than the table — a table/prose split, not a gap). Substrate check: PASS — Strategic Projects & Control, Ambitions & Undertakings and Mortal Economy & Prosperity appear in the inventory exactly as cited; extends/connects, no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → witnessing, not steering; failure is plot — confirmed. `01-core-loop.md` → silent (simmer-layer state, no loop beat altered). `02-non-negotiables.md` → #1 forks are the mortal's (renewal is mortal-authored work, zero god input) — confirmed; #3 prose never numbers (degradation stays debug-only unless a word band exists; only the chronicle line reaches the player) — confirmed. `03-design-tensions.md` → mild lean to systemic emergence (Tension 2), narrow scope, not drift. `taste-profile.md` → narrative over mechanical; *Numbers in UI* avoided — confirmed. No contradictions. **VISION AUDIT: PASS.**
