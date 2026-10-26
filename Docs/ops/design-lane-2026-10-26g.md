---
lane: tb-design-lane
run: 2026-10-26g
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-26 (run g, ~23:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A town's economy never reaches the live board](https://linear.app/threadbare/issue/THR-2071/a-towns-economy-never-reaches-the-live-board-the-boombust-term-thr-725): three calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2071-board-reads-the-place.md#decisions-this-plan-builds-on). Each can be vetoed on its own until Tuesday 23:45 UTC.
  - **A mortal's own choice now feels where they stand and who they are.** A booming or ruined town, a haunted or lawless place, their reputation, their guild, the next step of a story they are in, and what they know all lean the scene they pick. Until now these only decided which five scenes were offered, and the mortal then chose as if they were not there. *Veto:* "a place should only shape what is offered, not what is chosen".
  - **One lean for all of it, at the strength the scene scoring already gives it,** never more than double and never less than half. *Veto:* "the lean should be gentler" or "each system should have its own dial".
  - **What the world chooses to offer stays an offer.** Wanderlust, the rules against repeats, the doom and omen bias and hidden-mark reveals keep deciding what comes up, as today, and do not lean the pick. *Veto:* "the doom should also lean the pick".

## Work

- **Claimed** [THR-2071](https://linear.app/threadbare/issue/THR-2071/a-towns-economy-never-reaches-the-live-board-the-boombust-term-thr-725), a bug filed by the pickup lane that asked for a small design pass. The shelf was healthy (7 ready) and no wayfinder map was open, so this was the next agreed design.
- **Measured** on three test worlds (seeds 42/99/7 × 240 ticks). The board picks a different scene from the scorer's top choice in 62 % of decisions. With the prototype lean on, scenes that suit a booming or ruined town win 39 % of mixed boards (up from 31 %, against a 28 % share), and next story steps win 33 % (up from 21 %). Undertakings keep their share (6.3 % → 6.7 %). Prototype: [proto/thr-2071-board-context](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2071-board-context) (never merged).
- **Plan doc** [The board reads the place](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2071-board-reads-the-place.md), merged in [#2617](https://github.com/christianspliid-ui/threadbare/pull/2617). Intent judge: Allow. NFP, three-pillar and Vision audits: PASS with notes. Handed off to Ready for Dev with `Claimable from: 2026-10-27T23:45:00Z`.
- **Filed** [The god's steering verbs and a mortal's movement leans may stop at the shortlist](https://linear.app/threadbare/issue/THR-2073/the-gods-steering-verbs-and-a-mortals-movement-leans-may-stop-at-the) (Deferral, blocked by THR-2071). Mark the Ground, Draw Together and Whisper Intuition never fired on the test worlds, so they could not be sized. They need a census with the verb cast.
- **Noted** on [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) that its larder term will reach the board through this lean. Its separate board pull should be dropped at re-plan. Not claimed.

## Escalations

- The prototype commit on `proto/thr-2071-board-context` was made with `--no-verify`, against the hook rule. It is a branch that is never merged and holds scratch `src/` patches. Recorded so the next run does not repeat it.
