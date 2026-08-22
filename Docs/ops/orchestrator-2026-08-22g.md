---
lane: tb-orchestrator
run: 2026-08-22g
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-22 (run g, ~14:27Z)

## Needs Christian

**Both things you unblocked at lunch shipped inside two hours — and the shelf is now empty again.** The mandate prose you ruled "wire it, don't delete it" is [merged and live](https://github.com/christianspliid-ui/threadbare/pull/1572); so is [the divine-spark fix](https://github.com/christianspliid-ui/threadbare/pull/1573) that followed it. Four pieces of game work finished today. **Nothing buildable is left on the board.** What remains is two process chores and one screenshot job that needs a browser you have to be sitting at.

That is not a backlog problem. Every route to more game work runs through a decision only you can make, and there are six of them waiting. Shortest first:

1. **One new question, and it is the cheapest thing on this list.** Wiring today's mandate prose exposed the layer above it: [the 48 lines are connected, but no live game ever asks for them](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game). Every run's campaign is generated from what your god *remembers*; the 48 authored lines belong to twelve *named* campaigns the world never offers. So: **does a run's spine come from what the god remembers, or from a named campaign the world hands you?** Either answer is fine and either one is immediately buildable. Today the code says one thing and the writing says the other.

2. **A yes/no that has been open six days.** [Should committing a hand of nudge cards carry about 1.6 seconds of held breath before you find out what happened?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) The sound exists and plays for nobody. Yes wires it; no deletes it.

3. **Two encounters to play, then one verdict.** [Are the Grateful Kin and the Unsafe Bridge worth meeting a second time?](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) The links are in that ticket. A yes releases the next nine encounters; a no tells the line what the bar is still missing. This one also cost a robot its whole turn today — see the last part of the sweep below.

4. **A brief to approve** before [the Grateful Kin's return visit](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) can be written. Short read.

5. **Three design sessions, in the order you set them.** Shared machinery first, then the hunger vocabulary, then [making regions real](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to). None can happen in an unattended lane. **This is the bottleneck** — it was the bottleneck two hours ago and it has not moved.

6. **Two older sittings, still waiting.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) has been queued for a design session for four and a half days. [The encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and [the type prototype sitting](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) are both on your plate.

**If you only do one thing:** answer number 1. It costs a sentence and it puts real content work back on the shelf tonight.

## T1 — unblock sweep

Scanned 18 `Todo` and 3 `Ready for Dev`, state-filtered (`orderBy:"priority"` not passed — it errors at runtime, impediment #49; sorted in memory). **Promoted 0, filed 0.** The promotion ceiling did not apply (shelf 3, well under 15) and did not need to.

**Shelf depth at scan: 3 — [THR-1190](https://linear.app/threadbare/issue/THR-1190) and [THR-1192](https://linear.app/threadbare/issue/THR-1192), both process, plus attended-only Deferral [THR-1133](https://linear.app/threadbare/issue/THR-1133). Zero product items. WIP: zero live claims.**

**What happened between run f and now, and why the shelf is empty rather than stuck.** Run f put two product items on the shelf at ~12:33Z. Both are now `Done`:

- THR-1197 (the mandate prose) — `Done` 13:38:46Z, [PR #1572](https://github.com/christianspliid-ui/threadbare/pull/1572), commit `44182b87`.
- THR-1196 (the divine spark's `occurred_at` tick) — `Done` 14:26:09Z, [PR #1573](https://github.com/christianspliid-ui/threadbare/pull/1573), commit `24e814eb`.

**File-to-merge for THR-1197 was ~85 minutes**, on a ticket that did not exist when the day's first orchestrator run wrote its report. The delivery machine is not the constraint. The shelf is empty because supply is, and supply is attended-only.

### Nothing promoted, and the reason is a rule rather than an absence of candidates

Every `Todo` decline from run f was re-checked against `updatedAt` this run; **none has moved**, so those verdicts carry with their original evidence rather than being re-derived here — read run f's T1 section for the full ten. In summary: five are wrong-destination design calls ([THR-1195](https://linear.app/threadbare/issue/THR-1195), [THR-1189](https://linear.app/threadbare/issue/THR-1189), [THR-1155](https://linear.app/threadbare/issue/THR-1155), [THR-1114](https://linear.app/threadbare/issue/THR-1114), [THR-1148](https://linear.app/threadbare/issue/THR-1148)), two want a plan doc or a charter first ([THR-1134](https://linear.app/threadbare/issue/THR-1134), and [THR-1156](https://linear.app/threadbare/issue/THR-1156) as a programme epic), one is gated on a Christian approval ([THR-1182](https://linear.app/threadbare/issue/THR-1182)), one has an unmet blocker, and one has an unmet trigger.

One decline was **re-verified rather than carried**, because it turns on another issue's state:

```
[orchestrator] T1 skip THR-1024: unmet blocker — prose gate "do not start this before THR-966".
  THR-966 re-read live this run in the Idea scan: status Idea, statusType backlog, never
  started, updatedAt 2026-08-10. Decline stands on fresh evidence, not on a carried line.
```

Wayfinder-labelled and skipped unconditionally, whatever their blockers say:

```
[orchestrator] T1 skip THR-1157, THR-1162, THR-902, THR-907: wayfinder-labelled — decisions,
  never enter Ready for Dev. Routed to T1.5.
```

Skipped without assessment: THR-1043 and THR-791 (assigned to Christian), THR-870 (parked programme), THR-789 (programme epic).

### One new candidate arrived since run f, and it is a decline

```
[orchestrator] T1 skip THR-1198: wrong destination — its first Done-when is "Christian rules
  which of the two paths the spine takes", and the fork it names (does the run's spine come
  from what the god remembers, or from a named campaign the world offers) is a creative
  question with no agreed outcome to test against. Filed into Idea 13:14:51Z by the THR-1197
  executor. Surfaced under Needs Christian.
```

[THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) is the deferral THR-1197 predicted for itself one layer up, and it is worth naming precisely because **it is the reason this run publishes at all.** Run f's report predates it by 41 minutes, and `keep-work-flowing-cc` reads only the newest sibling report — so without this file, a live decision that landed on the board today would reach Christian by no route whatsoever. That is the "routed to an executor nobody reads" defect wearing a different hat.

Its measurement is worth trusting rather than re-doing: the filer ran `npm run cli -- --seed 42 --map medium`, `tick 60`, read `state.mandateDefinition.id` as `mandate.remembrance.chaos_energy`, and confirmed that `generateMandate` — the only route to a template id — has zero production callers. That is a live check, not an inference from grep.

### Why the shelf was not refilled from `Idea`

`Idea` was scanned this run (50 rows, paginated) and holds perhaps a dozen measured, executor-shaped defects — [THR-1026](https://linear.app/threadbare/issue/THR-1026), [THR-1088](https://linear.app/threadbare/issue/THR-1088) and [THR-1187](https://linear.app/threadbare/issue/THR-1187) among them. Promoting one would have made this run's counters look productive.

**It would also have been this lane choosing direction.** `Idea` is the general backlog, not a promotion queue; nothing in it carries a decision that it should be built next. Non-negotiable 3 forbids falling through to un-agreed work to stay busy, and CLAUDE.md's own starved-shelf clause says the fix for an empty shelf is upstream supply, never downstream tidying. The scan was run so that this paragraph is a judgement rather than an assumption — the candidates exist and were declined on principle, not overlooked.

### Board event observed — a park broke and was repaired before this run reached it

Not this lane's finding and not this lane's fix; recorded because it is where an executor turn went. [THR-1130](https://linear.app/threadbare/issue/THR-1130) was released from its park to `Ready for Dev` at 12:51:57Z **while carrying the `Parked` label** — the stale-claim sweep's own documented opt-out, applied by `daily-backlog-grooming` at 07:14Z for exactly this reason. `tb-opus-pickup` caught it at 14:02:51Z, restored the park shape (`In Dev`, `assignee: null`, `Parked`), verified by re-query, and logged it as an impediment. Confirmed independently here: `stateHistory` shows the 71-minute excursion, and `get_issue` now returns no `assignee` key.

Two costs worth stating. A blocked High-priority ticket sat at the top of an otherwise product-empty shelf for 71 minutes, offering itself as the obvious take. And a pickup run spent its turn on repair rather than shipping. **Logged, not filed** — the 2026-08-10 process throttle makes the weekly retro the single promotion point for delivery-machinery defects, and the containment already worked.

**Week's completion mix (product vs process), 2026-08-15 → 2026-08-22:** ~32 product against **2** process-infrastructure (THR-1058, and THR-1191 today at 11:33Z — run f's carried "1" is corrected here), plus 4 wayfinder decision tickets and 2 UL proposals. Today alone: 4 product `Done` (THR-1183, THR-1194, THR-1197, THR-1196), 1 process, 1 wayfinder decision.

**Headline finding, per CLAUDE.md § Prioritization: shelf empty — the feature pipeline needs design/Christian.** The queue holds only process work plus one attended-only Deferral, which is a starved shelf, not a licence to binge: the executor should drain at most one process item next run. This is the fifth consecutive run at zero product at scan, and unlike the previous four the refill route is now known and named — six decisions, all Christian's, listed above.

## T1.5 — wayfinder sweep

Two open maps. **AFK tickets resolved: 0**, and again not through failure — `ORCH_WAYFINDER_AFK_MAX` (2) was never approached, because both maps have burned down every research and agent-doable ticket. What remains on each is exactly the human-in-the-loop half this lane must not touch. **Ninth consecutive run in that state.**

```
[orchestrator] T1.5 map THR-1157 "Typed game-state architecture — machinery + first wave":
  7 children, 6 Done. Frontier 1 — THR-1162 (wayfinder:prototype), unassigned, HITL.
  Surfaced under Needs Christian. Unchanged since run f.
[orchestrator] T1.5 map THR-902 "Encounter experience redesign — vertical slice":
  8 children, 7 Done. Frontier 0 by the rule — sole open child THR-907 (wayfinder:prototype)
  carries an assignee (Christian), which drops it from the frontier set. On his plate,
  not stalled. Unchanged.
```

No map maintenance was needed this run. THR-1157's Decisions-so-far was brought current by run f with the wave-1 ruling, and nothing has been decided since. **Neither map is cleared** — THR-1157 still needs three wave-1 plan docs that do not exist, and THR-902 still needs its verdict sitting.

## T2 — design staging

**Not triggered, on the number.** Non-`Deferral` items in `Ready for Dev`: **2** (THR-1190, THR-1192), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so it does not fire.

**And the number is flattering a shelf with no game work on it.** Both items counted are process tickets. Run f recorded this weakness in the constant; this run is the clean demonstration of it — a shelf holding zero buildable product reads "healthy" to the floor because two Continuous-Improvement tickets sit on it. The constant measures non-Deferral membership, not whether anything on the shelf advances the game. Recorded, not acted on: changing a constant mid-run is not this lane's call, and the finding belongs to the weekly retro alongside run f's identical note.

**The bound would have blocked staging regardless.** `ORCH_MAX_IN_DESIGN` is 1 and the lane-staged slot is occupied by [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), staged 2026-08-19T02:31Z — now **~108 hours**, more than double the 48h re-surface mark. Per the skill it is re-surfaced rather than re-staged; named again under Needs Christian, item 6. (`In Design` reads 2 in raw terms; THR-790 is assigned to Christian and was never staged by this lane, so the bound stands at 1 of 1.)

**The attended-design queue is now six deep against one staging slot**: three wave-1 sessions (shared machinery, hunger vocabulary, region identity), THR-1002, THR-1134, and now THR-1198's ruling. Zero attended design sessions in four and a half days. Staging a seventh item would add to a queue nothing is draining — which is why the correct action this run is to say so loudly rather than to stage.

## T3 — architecture health

**Not due — already run this UTC day.** Run a performed the daily sweep starting 09:18 local (~07:18Z), the first run past `ORCH_HEALTH_SWEEP_HOUR` (6 local), and it spanned a three-day gap. Its full state is in `Docs/ops/orchestrator-2026-08-22.md` on the `ops` branch ([read it here](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-22.md)): 7 LEAKED interface contracts (identical membership to 2026-08-19), 21 canon-staleness warnings with rows enumerated for future diffing, `sweep:rank-reach` PASS, and `check:process` `passed-with-gaps` with three sub-checks structurally unmeasured in this lane for want of a `LINEAR_API_KEY`.

**No detector was run this run, and nothing about architecture health is asserted here. This section's silence is not a clean result.**

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is Saturday. Last pass: `Docs/ops/test-suite-health-2026-08-17.md`. Nothing about suite health is asserted here.

**Stalled-work check:** no issue on the board carries `ORCH_STALLED_PICKUP_THRESHOLD` (3) or more `Ready for Dev → In Dev` transitions without a `Done`. THR-1130 is the closest, at 3 such transitions, but its cycles are deliberate parks and repairs rather than failed pickups, and the most recent is the 14:02Z restoration recorded above. Not surfaced as stalled; surfaced as an ask.

## Escalations

None raised, and the Discord channel was not needed. Every open decision this run identified is already a named Linear ticket surfaced under `## Needs Christian`, which is the routing built for exactly that — asking the same six questions again in a second channel would be noise, not escalation.

Nothing parked, nothing held, no candidate deferred to a later run.

**One note for the next run.** The shelf will very likely be product-empty again at :25, because the only three things on it are two process tickets and an attended-only Deferral, and nothing unattended can refill it. If THR-1198 has picked up a ruling comment by then, that ruling is immediately filable as an execution ticket on the THR-1197 pattern — check its comments before re-deriving this run's decline.
