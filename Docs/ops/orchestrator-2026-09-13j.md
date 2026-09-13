---
lane: tb-orchestrator
run: 2026-09-13j
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-13 (run j, ~15:30Z)

## Needs Christian

**Nothing needs you.** No decision is blocking a builder, and nothing on your list changed.

What moved, in a sentence: **the in-game codex was found to explain its own vocabulary in only one of its sections, and the fix is now queued.** Every codex entry has a detail panel — rows like *"What they are good for: a commanding edge in Iron"* — and the game's own rule is that every concept word there can be hovered for an explanation. Exactly one section, Undertakings, actually does that; possessions, conditions, agreements, resources, every action kind, and the four categories chartered this morning all render those words as inert text. A player reading a card about a legendary item meets *Iron*, *Void Step*, *rarity* with nothing behind them. It was found half an hour ago by the ticket that was building the codex's newest sections, and queued six minutes after being filed.

## T1 — unblock sweep

Shelf at scan: **10** in `Ready for Dev`, **3** of them non-`Deferral`. Comfortably below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available; **1 was spent**, leaving the shelf at 11.

The shelf shrank from 13 to 10 in the three hours since [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13i.md), and every item is accounted for: [THR-1462](https://linear.app/threadbare/issue/THR-1462) closed 13:33Z, [THR-1455](https://linear.app/threadbare/issue/THR-1455) closed 14:21Z, and [THR-1495](https://linear.app/threadbare/issue/THR-1495) left the shelf for `In Dev` at 10:30Z. Two shipped and one claimed against one promoted — **the executor is currently out-running this lane**, which is the healthy direction for that ratio and the first time this week it has pointed that way.

### The `Todo` slice: 30 candidates, 1 promotion

15 carry a `wayfinder:*` label (skipped unconditionally to T1.5), one is assigned ([THR-791](https://linear.app/threadbare/issue/THR-791)), two are programme epics that are containers rather than work ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789)). Ten are the **same ten destination declines [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13h.md#the-todo-slice-31-candidates-0-promotions) tabulated with the declining sentence quoted from each ticket** — THR-1503, THR-1501, THR-1348, THR-1274, THR-1393, THR-790, THR-1381, THR-1218, THR-175, THR-1220. Each was re-read this run rather than assumed; none has changed, and the table is not reprinted. The `Idea` column holds nothing newer than 2026-09-12 and produced no candidate.

The thirtieth is new, and it was promotable.

**Promoted — 1.**

- **[THR-1507](https://linear.app/threadbare/issue/THR-1507/codex-detail-rows-carry-no-concept-tooltips-law-17-on-every-section)** (Low, `Deferral`/`UI`, *Content Architecture*) — codex detail rows carry no concept tooltips; Law 17 holds on every section except Undertakings. Filed 15:23Z at a sibling's closeout, promoted 15:29Z.

  **Blocked by: nothing** — native `blockedBy` empty, no prose gate, no time gate. Its three `relatedTo` links (THR-688, THR-836, THR-1495) are context, not dependencies. It names no plan doc, so the THR-921 liveness gate passes trivially.

  **Claims re-verified on `origin/main` before the write, not taken on the ticket's word.** The shape exists as quoted at `src/components/Codex/codexRegistry.ts:70`, with the JSDoc at :69 reading exactly the line the ticket quotes. Only **two** files in `src/components/Codex/` write `details:` at all — `codexRegistry.ts`, which holds every other mapper inline, and `undertakingCodex.ts`, which is the sole populator (:145, :146, :150). The reference implementation named for option (a) is real: `EncounterAftermathChange.concepts` at `src/types/unifiedAction.ts:354`. The read side is one branch, `CodexDetailPanel.tsx:195`.

  **Why this is not an eleventh destination decline — the judgement call of the run, and a thinner one than [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13i.md#the-idea-slice--where-the-promotion-came-from)'s.** The ticket carries a heading reading *"The part that makes this a design question, not a fill"*, which is about as close to a self-declared T2 routing as a ticket gets without saying so. It was promoted anyway, because the sentence under that heading does the opposite of the ten standing declines: it names **two concrete implementation shapes**, states a preference with its reason (*"(a) is the better fit and the bigger change"*), points at doctrine that already settles it (**Law 2** — the producer declares the concepts, the surface never parses English), names an existing reference implementation to copy, and asks for the ruling to be recorded **in `CodexDetailPanel`'s doc comment** rather than in a plan doc. A shape choice between two named options with doctrine pointing at one is the *how* of an already-agreed design, which is the executor's under `Docs/canon/process.md` § *User review interface* rule 4. The ten declines each contain a sentence saying their decision is **not** an executor's; this one contains no such sentence and its Done-when is written for a builder.

  Recorded at this length because the call could have gone the other way, and a future run should be able to check the reasoning rather than re-derive it. The escape hatch is written into the coordination block: **if option (a) turns out to ripple past `src/components/Codex/`, bounce it to T2 rather than attempt a heroic PR.**

  Coordination block posted at promotion with the three required lines. **`Mutex with: THR-1495 (both edit `src/components/Codex/codexRegistry.ts`)`** — THR-1495 is `In Dev` and actively editing that file; it is the ticket that filed this one, so the mutex is live rather than theoretical and is not reversible on judgement while it is open. Parallel-safe with the whole shelf by file disjointness — checked the nearest-looking neighbour explicitly, since [THR-1504](https://linear.app/threadbare/issue/THR-1504) is also a detail-panel ticket but edits `src/components/shared/DetailBreadcrumb.tsx`, a different tree. **Evidence shape: UI pillar, so browser evidence is owed** (THR-688 rule C) and the ticket already names its route, `?view=codex` with the detail panel open.

**Rule-0 discipline.** Product work, not process — a player-facing surface renders its own vocabulary as dead text across every section but one — so the materiality bar did not need applying and no process ticket was filed. **Week's product-vs-process ratio: strongly product**; the process-ticket budget (at most one per three runs) remains untouched, as it has all week.

### Held by the ceiling — 0

Fourteenth consecutive run with zero held, from real headroom (shelf 10 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets anywhere — re-proved this run, not inherited.** Both AFK labels were queried workspace-wide rather than inferred from the `Todo` column:

- `label:"wayfinder:research"` → **21 issues, all 21 `Done`.**
- `label:"wayfinder:task"` → **5 issues, all 5 `Done`.**

So `ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the **"AFK work is finished"** cause, not the "found nothing I could do" cause. Re-run rather than carried, because it is the claim the whole tier turns on and three hours is long enough for a map to grow a new research child. It did not.

The twelve open children of [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) and [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) all carry `wayfinder:grilling` or `wayfinder:prototype` — HITL by construction, which this lane must not touch. Unchanged set, every child last touched 2026-08-26 or earlier; not re-enumerated. Runs c and d carry them in full and they are already on Christian's list via the briefing.

## T2 — design authoring

**Not triggered.** The shelf holds **3** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2. The promotion does not change that count — THR-1507 is `Deferral`-labelled, so it deepens the shelf without lifting the programme figure.

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both sit well inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and **not by this lane's hand** — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

The standing tension is unchanged: T2 is barred twice over while ten `Todo` tickets each say they need a design pass. Not re-argued here — it is a weekly-retro input, not an hourly finding.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z with four detectors. The tier is once-daily; **no detector ran this hour and none is reported as clean.** The redundancy judgement pass was likewise **not performed this run** — run c's result stands, and this line exists so the gap is not mistaken for coverage. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless: not run, not reported clean. `newFindings: 0` is a consequence of the tier not running, not of a sweep that found nothing.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

Two checks made outside the tier, because the queue scan surfaced them directly and both cost nothing:

- **Stalled work — none.** `In Dev` holds two issues. [THR-1495](https://linear.app/threadbare/issue/THR-1495) (codex categories) was claimed 10:30Z, is assigned and is demonstrably live — it filed THR-1507 at 15:23Z. [THR-876](https://linear.app/threadbare/issue/THR-876) has one clean `Ready for Dev` → `In Dev` transition. Neither approaches `ORCH_STALLED_PICKUP_THRESHOLD` (3).
- **Hand-created `In Dev` tickets — none.** Both `In Dev` issues have a `Ready for Dev` state in their history, so the THR-1325 class is absent.

One standing shape, reported rather than acted on: **[THR-876](https://linear.app/threadbare/issue/THR-876) has sat `In Dev` and unassigned since 10:03Z** — parked at pickup on a cost gate that the ticket's own promotion comment had already cleared two days earlier. The 14:33Z run wrote that up on the ticket in full; both lanes and the ticket's own history agree nothing is waiting on a human. It is **not** re-surfaced to Christian, because the briefing has carried the verdict since ~13:57Z and the only thing owed him is the image count at closeout. `stale-claim-sweep` auto-releases it around 2026-09-16 if no attended session takes it first. **No state touched** — the THR-1325 ruling (report, never normalise) holds even when the evidence is this clean.

## Escalations

**None.** No question was asked, no item parked, Discord not used. Agreed work was not exhausted — one promotable item existed and was promoted.

One bookkeeping note, so the record reads straight rather than as a lost report. **A run at ~14:33Z signed itself `run 2026-09-13j` in a Linear comment on THR-876 and published nothing to `ops`.** That is the substantive gate behaving as specified, not a failure: its counters were all zero (`promoted: 0, filed: 0, resolved: 0, newFindings: 0`), because a considered comment that resolves another ticket's false park is not a *counted* action under `check:substantive`. This file is therefore the first `orchestrator-2026-09-13j.md` on `ops`, and the duplicate label is cosmetic — the letter was taken by the rule as written (next unused letter by `git ls-tree origin/ops`), which is what keeps two runs in the same hour from overwriting each other.

Offered without a ticket, per the process-work throttle: the gap that run fell into is narrow but real — `resolved:` counts *blockers cleared*, and a run that demonstrates a park was never a blocker has arguably cleared one. A retro input, not an hourly finding, and not worth a probe of its own.
