> **Brainstorm companion** to [Consecrate a pilgrim way](2026-10-01-thr-1660-consecrate-a-pilgrim-way.md) — THR-1660
> **author:** Claude Code (design lane, run 2026-10-01c) · **created:** 2026-10-01

# Consecrate a pilgrim way — brainstorm companion

These are the alternatives weighed and the tensions found. The plan doc carries the decisions; this file records why the other roads were not taken.

## Is it wanted?

The ticket's Done-when lets the lane close this as *not wanted*. Three readings argue against that:

- **Christian's faith direction** (Discord 2026-09-26, quoted in THR-1632) asks for a world "that allows us to test and see balance and interaction". A faith frozen at tick 0 has nothing to interact with.
- **The Vision premise** that the world is alive and changes under the player's eye. Before this plan, faith was the one social force whose geography could never change after worldgen. Trade lanes open and close, holdings change hands, and armies move, but pilgrims never went anywhere new.
- **The ambition is idle.** `ambition_spread_faith` has 23–39 holders a world and drove 2 finished works across three 300-tick worlds. An ambition with that many holders and nothing to do is dead content in the decision board.

**Against it:** a faith that spreads mid-game could crowd out the seeded landscape Christian is testing. The census answers that: candidate sites per holder are local (8 nearest towns), and each way changes one town's encounter pool by one encounter. If it ever floods, `PILGRIM_WAY_SITE_SUBTYPES` and the cell's place in the profile are the dials.

## Shape: three roads

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. A class object type `pilgrim_way` (`classOf: 'route'`)** | Own site rule; own eligibility; own words; the world-objects catalogue already names the class; MONSTER is the precedent | Touches the type union and four total tables | **Taken** (D1) |
| B. A branch inside `ROUTE.verbs.create` ("if the actor spreads the faith and the far end is holy, write `sacred_route`") | No new type | The site rule is the type's, so the far end would still be a trade-lane site; every merchant walking `cell.create.route` could consecrate; one cell doing two unrelated things is the THR-1438 smell | Rejected |
| C. A new verb variant (`create:consecrate`) | Reads naturally | Verb tables (difficulty, payoff, duration, prose) are global per variant; a variant for one object is a registry-wide change for a local need | Rejected |
| D. Revive the legacy template under `cells` (add it back as a walked template) | No new code | Runs the dead model for one template, the same reasoning THR-1497 used to reject reviving pack arms; the template also targets shrines, which gain nothing | Rejected |

## Whose way: the mortal's or the faith's

- **The mortal's (edge source = the zealot).** This is the legacy template's shape. It is simple and needs no lookup. But the way then dies with the mortal in every reading but the graph's, the sheet line would read *"a way of Brother Aldric"*, and seeded and consecrated ways would have two different shapes for one thing.
- **The mortal's congregation.** Measured dead: 0 of 86 faith holders across three seeds is a member of any congregation. This would be a cell nobody can take.
- **The site's congregation.** **Taken** (D2). The ground decides whose faith it is, and the zealot spreads pilgrimage to it. This matches the seeded shape, so one read path covers both. The cost is a lookup through the culture.

**A tension left open, deliberately:** should a zealot of culture A be able to consecrate a town of culture B for B's Temple? The plan says yes, because the ambition is about spreading faith, not one people's faith, and there is no faith-identity on mortals to read. If Christian wants faiths to compete (a zealot only ever spreads their *own* people's Temple, or converts a town to it), that is a different and larger design: conversion, rival congregations, and cultural tension. It needs a meaning call, and it is not this ticket. This plan's choice is the narrower one and does not foreclose it.

## Where: which towns

- Shrines and temples **excluded**. Every pilgrimage encounter is already gated to them, so a way there adds nothing; THR-1184 found the legacy template doing exactly this.
- Hamlets **excluded** from the default. A hamlet as a pilgrimage destination stretches the fiction, and the encounter's own location gating was written for settlements of some size. This is a constant, so it is easy to widen.
- **Require a congregation hall in the town?** It was considered: "the Temple keeps a hall here". Measured candidates with a hall and no route: 1 / 6 / 3 per world at tick 300. That is too few, and they sit behind the 8-nearest cut, so the cell would starve. Culture ground is the wider and truer test of whose faith a town keeps.

## No unmaking

A *desecrate* verb (destroy × pilgrim_way) would be the counter-play, and it would have a harm class and a grievance. It raises a real meaning question: is unmaking a way an act against the faith, or against the town? It is not needed for faith to move, and nothing decays a way today. If it is wanted, it is its own ticket with its own fork for Christian.

## Not proposed here

- **A map signifier for pilgrimage destinations.** The way has no hex path. Marking destinations on the map is a UI decision for the map's own lane.
- **The god consecrating.** A divine *consecrate* card exists (THR-511, faith-spread on a location). Whether the god's card should also write a pilgrim way is a question about divine verbs, not mortal undertakings.
- **Tuning why the faith ambition rarely acts.** The board's choice is THR-1689's measurement. The kill criterion in Done-when 5 reports, and does not tune.

## Vision premises invoked

- *The world is alive* — faith geography now moves.
- *The god nudges mortals; mortals act* — the consecration is a mortal's long work, and so can be inspired or doubted through the existing moment card.
- *Narrative over mechanical perfection* — the way belongs to the people's Temple because that is what a pilgrim would say.
