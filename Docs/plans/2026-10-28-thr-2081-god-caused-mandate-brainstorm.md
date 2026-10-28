> **Brainstorm companion** for [`2026-10-28-thr-2081-god-caused-mandate.md`](2026-10-28-thr-2081-god-caused-mandate.md) — THR-2081. Design lane, run 2026-10-28b.

# Only the god's own hand fills the Mandate — brainstorm

## The question

The ticket's decision (design lane, 2026-10-27) settled *what* counts: growth the god caused, minus rivals and doom wearing it down. It left three *how* questions to the plan: how a push is traced to the god, how much the opposition takes back, and what the targets should be once nothing else fills them. Nobody had ever measured whether a playing god can reach 18 % on its own.

## What the census settled

Census `scripts/_scratch-2081b.ts` on [`proto/thr-2081-mandate-drift`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2081-mandate-drift), never merged. The world-total rule is switched off inside the census (targets 99, no checkpoints), so the age does not end on drift and the ledger can be read to tick 900. A **scripted god** spends every point of essence, each tick it can, on the cheapest card of each Mandate sphere through the real player-cast path (`preparePlayerCast` → `commitPlayerCast`). The `godloc` policy prefers cards that target a place or sublocation, because a place weighs 1.0 in the world total and a mortal 0.2. Two ledgers are kept from the `sphere_pressure` traces:

- **full**: a level-up credits the god by its writers' share of the trace; any erosion debits by the rival/doom share, wherever it lands;
- **held**: the same credit, but an erosion takes back only points the god itself put on that entity in that sphere.

The full table is in the [plan doc](2026-10-28-thr-2081-god-caused-mandate.md). The figures that decided things:

- unattended `?seeded` Witness world: full −69 mind by t300, held 0; held 0.2 / 1.0 at doom 0.71;
- unattended Kindle world: full −772 life by t450, held 1.2 / 0;
- unattended CLI 42 / 99 / 7: held 0 / 0 throughout (no First, doom asleep);
- `godloc` Witness god: held 58 / 14 at doom 0.16, 84.2 / 19.2 at doom 0.50, 94.2 / 24.2 at doom 0.70 (86.2 / 23.2 when it casts only every other tick); a 1-essence `sub.vision` cleared the old 18 % mind target by tick 57;
- `godloc` + claims Kindle god: held 3.2 / 5.2 at doom 0.71 (energy has no card);
- threaded mortals' scenes leveling a Mandate sphere where the mortal stood: 0.000 on every arm.

## Options weighed

**Tracing a push to the god.**
- *By `PressureSource` alone.* Rejected: `'divine_action'` is written by `unifiedActionResolution.ts` for **every** resolved action whose template carries a sphere, mortals' and rivals' included (the four pushes at the end of resolution read `template.sphereAffinity`, not the actor). A source-only rule would count every mortal's scene as the god's.
- *Look the action up by `sourceId` at Mandate time.* Rejected: it ties the Mandate to the action store's lifetime, and it covers only one of the three writers that need an actor (control effects and encounter steps carry other ids). The writer already knows who acted.
- **Chosen: an optional `causedBy` on the push**, written where the actor is known. Additive (NFP 6): every writer that does not set it reads exactly as before.

**How much the opposition takes back.**
- *Full wear* (the decision's literal wording). Rejected on measurement: an unattended seeded world sits at −69 mind points by tick 300, and a Kindle god's life half at −419 by tick 200 against an 89-point target. The god would start every run in a hole whose depth swings tenfold with the Hunger, which is the same seed-spread defect the decision used to reject raising the targets.
- *Floor the ledger at zero.* Rejected: rivals wearing down a place the god never touched would still take back the god's own work elsewhere.
- **Chosen: wear takes back what the god built** (per place, per sphere). A contested Mandate still slips back when a rival raids the god's ground, which is the contest the decision kept.

**What the targets are.**
- *Keep 18 % / 10 % of the baseline.* Rejected: the same work is 3.5 points on CLI 42's chaos and 144 on CLI 99's energy, and on the seeded route the mind half falls to a cheap card in about 50 ticks.
- **Chosen: a number of sphere points of the god's own making**, one per half, the same in every world. Stored back as the relative fields the UI already reads, so no reader changes.

**Threaded mortals' scenes.** The decision leaned yes. Counted. The census measured their contribution at 0.000 on every arm (the First's scenes did not level a Mandate sphere where it stood), so counting them cannot carry an unattended world.

## Tensions noted

- **Energy has no card any god can cast** (0 of 141 ascendant cards; light has none at all, and no Hunger carries light). Kindle and Wander lead with energy and Illuminate supports with it. Under this plan their energy half moves only through Dominion (claims, seat, carry) and attunement: about 1 point by tick 300 in the census. That is a content gap the plan exposes rather than creates (today drift fills it with no god), and it is filed as its own ticket.
- **The scripted god is a floor, not a player.** It never threads, never claims for income, never uses a source, so its income (about a quarter essence a tick after the opening pool) is lower than a real player's. The targets are fitted to it, then re-fitted by the build's census, and the kill criterion watches a real playtest.
- **Spirit is slow on the seeded route** because its cheapest place card costs 4 and builds through a sustained control. That is card pricing, not the Mandate, and the secondary target is fitted to it rather than the card being repriced here.
