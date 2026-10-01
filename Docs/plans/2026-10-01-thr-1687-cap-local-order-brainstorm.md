# Brainstorm companion — the shortlist's own-hex pass (THR-1687)

Companion to `Docs/plans/2026-10-01-thr-1687-cap-local-order.md`. The thinking that did not belong in the spec.

## What it feels like from inside the world

A seasoned smith in a market town has work around her suited to a master hand: a commission for the guild's hall, a disputed assay. She never weighs any of it. Every morning she considers the same thirty jobs, and they are the first thirty ever written for a town like hers: mending a gate, settling a stall quarrel. Not because she prefers them, and not because the world lacks better work, but because of the order the scribes filed the work in. A world that runs without the player should not have its mortals' horizons set by the order of a filing cabinet.

## Why "fair" rather than "suited"

The tempting fix is to hand the expert expert work: a reserve that keeps a few slots for content in her window. It was rejected because it moves a *preference* into a place that is meant to be a *limit*. The forecast window already prefers suited work, at scoring, where it can be traced and tuned. If the shortlist also prefers it, two knobs push the same way and nobody can tell which one made a mortal choose. A fair draw keeps the shortlist dumb, which is what makes the scoring stage's choices legible.

There is also a story reason. An expert who sometimes considers a novice chore and takes it (because it pays, because it is close, because she is tired) is more alive than one who only ever sees her own band. The fair draw keeps that texture; a band reserve would sand it off.

## Why the in-window share is not this ticket's to chase

The prototype showed in-window share dipping slightly once experts see their work. That looked alarming for a minute. It is not: with the board fixed, more experts choose expert work, and their success rate rises above the window's top edge (expert success 0.68–0.72 in the prototype). So the remaining distance from 0.50 sits in how the window scores and how the dice land for experts, not in what reaches the board. Chasing it with the cap would be exactly the tuning-to-a-KPI the ticket forbids. It gets its own measurement ticket.

## Masters

Masters dropped below experts in the prototype. That is the system telling the truth: there is no master everyday content, so masters draw on expert and journeyman work, and their attempted difficulty is capped by what exists. The eight master encounters THR-1681 deferred are now worth writing. The rise clause is split so the expert rung can be held true now and the master rung re-armed when that batch lands.

## Things considered and parked

- **Per-location shuffle at cache build.** Static per location: a stationary mortal would see the same thirty forever.
- **More local slots.** The median own hex holds 87–117 templates against 40 total slots. No count clears it.
- **Weighting the hash by recency** ("newest content first for a while"). Rejected: it would just invert the bias and make old content starve the moment a batch lands.
- **Fixing the general fill too.** Its start is uniform over the whole list, so it has per-block lumps but no catalogue cliff. Left alone so the change's effect is attributable.
