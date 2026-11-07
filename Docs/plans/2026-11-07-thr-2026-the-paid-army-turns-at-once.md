> **title:** The paid army turns at once — an army fighting for its liege never ends a tick aimed at its liege's side — THR-2026
> **linear_issue:** THR-2026
> **author:** Claude Code (tb-design-lane, run 2026-11-07f)
> **created:** 2026-11-07
> **three_pillars:** Engine done (one per-army re-aim body shared by the daily re-aim and a new end-of-tick guard) · Content N/A, no player text · UI N/A, nothing a player sees changes except an army's route

# The paid army turns at once — THR-2026

*A company that takes its liege's pay fights for its liege from that tick on. Today it can keep marching on its
liege's own town for most of a day.*

## Why this is load-bearing

THR-1974's rule is that while a liege's wage is fresh, `commanderFactionOf` answers the liege "for every
army-level enemy question (objective, re-aim, defence, siege and battle start)" (interface contract
`crown-liege-pays-vassal-wages`). The objective breaks that rule. An army keeps the conquer target it chose under
its own banner until the next daily re-aim. If the target belongs to the liege, or to a fellow vassal at peace
with it, the army marches on its paymaster. Siege and battle start already read the commander, so it never
attacks. It only walks the wrong way and is drawn on the map heading for a friend. THR-2020 found it
("no march on the paymaster: 10 violations", seed 42, The Scarlet Company's host, ticks 170–179). THR-2020's
liege raise makes the path more common. It is a bug, so it is agreed work (D2). The orchestrator staged it on
2026-11-07 at about 15:30Z.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| `reaimArmies` (`warAims.ts:246`): daily, `WAR_AIM_REAIM_INTERVAL_TICKS` = 12, first in `phaseArmyMovement` (`armyMovement.ts:90-95`) | 🟢 ACTIVE | **extends**: its per-army body becomes `reaimOne`, shared with the guard |
| `skipsReaim` (`warAims.ts:239`): battle/siege `participates_in`, `agenda` objective, campaign army | 🟢 ACTIVE | **unchanged**, and it is the guard's gate too |
| `commanderFactionOf` / `payingLiegeOf` (`warAims/enemy.ts:34`, `crown/wages.ts:55`): liege while `liegePaidTick` is within `LIEGE_COMMAND_WINDOW_TICKS` (12) | 🟢 ACTIVE | unchanged; read by the guard |
| `payWages` (`crown.ts:502`): stamps `liegePaidTick` in the daily `crown` phase | 🟢 ACTIVE | **unchanged**: no re-aim in the pay step (see below) |
| `measure:crown-wages` paymaster check (`scripts/measure-crown-wages.ts:92-108`): end-of-tick, every tick | 🟢 ACTIVE | unchanged; it is the Done-when |

### Measured: why the objective outlived the take-up

The ticket asks this first. Two facts settle it.

1. **Phase order.** The re-aim runs first in `army_movement` (`orchestrator.ts:3711`). The wage is paid in `crown`
   (`orchestrator.ts:4026`), later in the same tick. So on a pay day the day's re-aim has already run under the
   vassal's banner when the commander flips. The next one is 12 ticks away.
2. **The town changed sides after the take-up.** The measure checks at the end of every tick. Its log shows the
   host liege-paid at 168, with the first violation at **170** and the last at **179**. At 168 and 169 the commander
   was already the liege, so the target was not on the liege's side yet. It came over at 170, mid-day: a
   capture in `battle_tick` (`orchestrator.ts:3722`), an oath in `crown`, or a defection in `unrest`
   (`orchestrator.ts:4172`, contract `town-defection-moves-controls`). That is why the dropped pay-step re-aim did
   not clear it. It checked at 168, when the target was still a fair enemy.

So the check belongs at the end of the tick, against that tick's commander and that tick's holders. It does not
belong in the pay step.

### Measured: today's main

`npm run measure:crown-wages -- --seeds <s> --debug-companies` on `origin/main` @ `3601e1d8`, 600 ticks, medium:

| Seed | Wage pay days | Army-days paid by a liege (`paidByLiege army` debug lines) | "no march on the paymaster" |
|---|---|---|---|
| 42 | 18 | 29 | 0 violations |
| 99 | 2 | 2 | 0 violations |
| 7 | 5 | 5 | 0 violations |

**The bug does not reproduce on today's main.** The world has drifted since THR-2020's branch. On seed 42 the
Scarlet Company's host is now raised at tick 16 and is not liege-paid by tick 200 (a throwaway per-tick probe, not
committed). The path is still in the code: facts 1 and 2 are structural. So the measure stays as the regression
guard, and the fixtures in Done-when 2 carry the proof by building the case directly.

## Engine pillar

### Systems design

1. **`reaimOne(state, army, ctxRef, getProjection, whyOverride?)`** in `warAims.ts`. This is today's loop body of
   `reaimArmies` from the `skipsReaim` check down to `writeAmbitionTarget`, moved without change. `ctxRef` holds
   the lazily built `WarAimContext` (`ctx ??= contextFor(...)` today). `reaimArmies` calls it per army, in id order,
   and behaves exactly as before. A `whyOverride` replaces the computed `why` on the trace only.
2. **`onPaymasterSide(graph, armyId, tick): boolean`** in `warAims/enemy.ts`. It is the measure's predicate, in
   engine code. Own faction ≠ commander, and the conquer target's `controls` holder is the commander, or is sworn
   to the commander and not `isEnemyFaction(commander, holder)`. It reads two edges and no context.
3. **`guardPaymasterTargets(state, getProjection)`** in `warAims.ts`, run **every tick**. For each army in id order
   that is liege-paid (`payingLiegeOf` defined, checked first) and has `onPaymasterSide` true, it calls `reaimOne` with `whyOverride: 'target_on_paymaster_side'`. `skipsReaim`
   inside `reaimOne` keeps a sieging, `agenda` or campaign army's objective, as the Done-when asks. When the
   guard re-aims and changes the target, `writeAim` already clears `movementState`, so the next `army_movement`
   paths to the new target. The guard is off when `WAR_AIMS_ENABLED` or crown wages are off.
4. **Placement.** One new inline phase, `paymaster_guard`, in `runTick` right after the `unrest` block
   (`orchestrator.ts:4172-4180`). That is after every phase that writes `controls` or `sworn_to` today (battle
   captures, crown oaths and wages, unrest defections). Before placing it, the executor greps
   `orchestrator.ts` for any phase after `unrest` that writes either edge. If one exists, the guard goes below it.

Rejected (full table in the [brainstorm](2026-11-07-thr-2026-the-paid-army-turns-at-once-brainstorm.md)): a re-aim
in `payWages` (unsafe, and it misses fact 2), the full re-aim every tick (cost, and it widens the cadence), voiding the
target (the army idles for up to a day), and re-aiming on a commander change (misses fact 2).

### Graph nodes / edges

None new. Reads `member_of`, `sworn_to`, `controls`, `participates_in`. Writes only what `writeAim` already writes
(`armyState.objective`, `holdReason`, `warAimCandidates`, `movementState`) and `writeAmbitionTarget`'s
`targetNodeId`.

### Tick phases

`paymaster_guard`: every tick, after `unrest`, through `runInlinePhase` so it gets a `phaseEventCounts['paymaster_guard']`
entry like its neighbours. For each army, `payingLiegeOf` is checked first (one property read and, if the stamp is fresh,
one `sworn_to` edge). `onPaymasterSide` runs only for paid armies, and there are 2–29 paid army-days in 50 days on the
three seeds (§ Measured). The war-aim context is built only when an army is both on the paymaster's side and not
skipped. A sieging or `agenda` army on the paymaster's side passes the predicate and is skipped by `skipsReaim` every
tick. That costs two edge reads a tick, and it is rare. The executor confirms that tick cost does not move: the
30-tick CLI smoke's ms/tick sits within the usual run-to-run spread of `origin/main`.

### Resolution logic / PRNG callouts

No rolls. Id order everywhere, so it is deterministic (NFP #3).

## Content pillar

N/A. The fix writes no text. The army's route changes. Its Chronicle and sheet lines already come from the
objective (`war.aim.*` traces, the army sheet words in THR-1933).

## UI pillar

N/A. Nothing renders differently except where the army walks, which the map already draws from `movementState`.
`Browser-verify exempt: engine-only bug fix; no component, hook or style changes.`

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, no UI component, no prose pipeline, no player control.

| Module | Phase | GameState flow | Traces | Debug |
|---|---|---|---|---|
| `warAims.ts` `reaimOne` / `guardPaymasterTargets` | `army_movement` (daily) / `paymaster_guard` (every tick) | `armyState` on the army node | `war.aim.reaim` with `why: 'target_on_paymaster_side'`, then `war.aim.picked` | `readWarAims(state, armyId)` unchanged |
| `warAims/enemy.ts` `onPaymasterSide` | read only | — | — | — |

## Interface impact

| Contract | Action |
|---|---|
| `crown-liege-pays-vassal-wages` (`scripts/interface-contracts.ts:7433`) | **extend** the description by one sentence: an army whose conquer target is on its paying liege's side re-aims before the tick ends (`guardPaymasterTargets`). Add the symbol. Update `Docs/canon/interface-map.md` with it. |

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| — | — | No new tunable. | — |

The guard uses `WAR_AIMS_ENABLED`, `CROWN_WAGES_ENABLED` / `crownWagesActive()` and
`LIEGE_COMMAND_WINDOW_TICKS` as they are.

## Tracing

`ReaimWhy` gains one member (additive, NFP #6):

```ts
export type ReaimWhy = 'threat' | 'target_no_longer_enemy' | 'target_out_of_reach' | 'target_taken' | 'no_objective'
  | 'target_on_paymaster_side'; // THR-2026: the end-of-tick guard re-aimed a liege-paid army
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| `reaimOne` throws for one army | Same `try/catch` as today: that army keeps its objective, the rest go on, one `console.warn` |
| No projection or context | `contextFor` already falls back. The pick uses the strongest controller |
| The pick finds nothing | `writeAim(null)`, so the army holds with `no_enemy_in_reach`, as the daily re-aim does |
| A sieging or `agenda` army is on the paymaster's side | Kept by `skipsReaim`. It counts in the measure if it occurs. The executor reports it, and it is not hidden |

## Blast Radius

`orchestrator.ts` has 153 importers (`grep -rln` over `src` and `scripts`). The change adds one inline phase call,
in a `try/catch` like its neighbours, and touches no export. `warAims.ts` is a refactor of one loop body. The
daily path must stay byte-identical in output: the existing `warAims.test.ts` § "the daily re-aim" suite must pass
unchanged.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale (no text written)
- [x] UI pillar N/A with rationale (no surface changes; browser-verify exempt)
- [x] Wiring table and interface impact filled for the active pillar

## Vision audit

- [x] This plan does not contradict any Vision premise. It makes THR-1974's command rule true for the objective too.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. A paid army already fights for its liege; now it also walks for it.
- [x] No `Docs/canon/rulebook.md` edit is needed.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | N/A | no new number; existing constants reused |
| 2. Inspectability | PASS | every guard re-aim traces `war.aim.reaim` with its own `why` |
| 3. Determinism | PASS | no PRNG; armies in id order |
| 4. Fail-soft | PASS | per-army `try/catch`; the tick never throws |
| 5. Narrative over mechanics | PASS | a paid company marches for its paymaster on the map, as the Chronicle says it does |
| 6. Additive | PASS | new function, new phase, one new union member; the re-aim body is moved, not rewritten |
| 7. Performance | PASS | two edge reads per liege-paid army per tick; context built only when the guard fires |

## Done when

- [ ] Done-whens 1–3 below hold.

1. `npm run measure:crown-wages -- --seeds 42`, `--seeds 99` and `--seeds 7` (one command each, 600 ticks, liege
   raise on, `LIEGE_RAISE_ENABLED = true` today) each still read **"no march on the paymaster: 0 violations"**, as
   they do before the change (§ Measured: today's main). This guards against the change breaking it. It does not
   prove the fix, which Done-when 2 does. The evidence is the three verdict lines pasted into the status file.
2. Fixtures in `src/engine/warAims/__tests__/warAims.test.ts` (new `describe('the paid army turns at once')`):
   (a) an army newly liege-paid on a pay day, aimed at its liege's town, has a new objective and a
   `target_on_paymaster_side` trace when the tick ends; (b) the same with the target coming over to the liege's
   side on a non-pay tick (a `controls` edge moved); (c) an army in a siege keeps its objective; (d) an army with an
   `agenda` objective keeps it; (e) an unpaid army aimed at a town that made peace is **not** re-aimed off-cadence.
3. The existing daily re-aim suite passes unchanged. A 30-tick CLI smoke runs clean.

## Coordination block

**Suggested model:** `opus` — engine refactor of a live per-army loop plus a new tick phase in a wide-blast file.

**Parallel-safe with:** [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145) — UI and
content files only, no shared engine surface.

**Mutex with:** any ticket editing `src/engine/warAims.ts`, `src/engine/warAims/enemy.ts` or the phase list in
`src/engine/orchestrator.ts` (the new `paymaster_guard` slot after `unrest`), because the edits would collide in
the re-aim loop or the phase order.

**Files to touch:** `src/engine/warAims.ts`, `src/engine/warAims/enemy.ts`, `src/engine/orchestrator.ts`,
`src/engine/warAims/__tests__/warAims.test.ts`, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`,
the war-aims wiki page whose `sources` include `warAims.ts`.

## Kill criteria

If the guard leaves violations in `measure:crown-wages` on 42/99/7, or the daily re-aim suite changes output, the
shape is wrong. Revert the phase. Call the guard at the start of `phaseArmyMovement` and at the end of
`runCrownPhase` instead, and report which phase moved the target.

## Notes for the executor

- **Scope versus the orchestrator's note.** The design request said to keep the fix on the take-up path and not
  widen the re-aim cadence. This plan keeps the cadence as it is for every army except one fighting for a paying
  liege whose target is on that liege's side. It still has to run every tick, because fact 2 shows the target can
  change sides after the take-up. Fixture (e) checks that it goes no wider.

- Move the loop body. Do not rewrite it. Diff `reaimArmies` before and after: the only change is the call.
- `onPaymasterSide` must match the measure's `friendly` predicate exactly (`measure-crown-wages.ts:100-101`), or
  the Done-when measures something the engine does not guard.

## Forked-audit verdicts

**Intent judge (2026-11-07): Allow**, impact Reversible. One GAP was found: kill criteria appeared only in the
proposal. It is fixed: § Kill criteria was added, and the reconciliation with the orchestrator's scope note is now in
§ Notes for the executor.

### NFP audit

PASS-with-notes. The notes: (1) the guard has no kill switch of its own, beyond the war-aims and wage switches.
That is accepted, since it is a correctness guard. (2) The new phase needed a `phaseEventCounts` entry. That is
fixed: it goes through `runInlinePhase`. (3) The cost claim had to match the loop. That is fixed: `payingLiegeOf` is
checked first, the paid army-days are counted from the measure, and the tick cost is checked in the CLI smoke.

### Three-pillar audit

PASS-with-notes. Engine is present and substantive. Content and UI are N/A, each with a reason. The note was on
form: the pillar check, Vision and Rulebook sections were folded into one heading. That is fixed: they are now
separate sections with checkboxes.

### Vision audit

PASS. No Vision premise is touched and none is contradicted. The north star is neutral to slightly positive: the map
stops showing a paid company marching on its paymaster.
