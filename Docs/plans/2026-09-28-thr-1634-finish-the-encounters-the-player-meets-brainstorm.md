# Brainstorm companion — Finish the encounters the player actually meets (THR-1634)

Companion to `Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md`. It records what was weighed and not taken, so the next reader does not reopen it without new evidence.

## Vision premises in play

- **Every band pays off.** The five-band ladder (THR-772) exists because failure and cost are plot. A success-at-cost that renders as a clean win flattens the ladder in play, whatever the dice did. That premise is the whole plan.
- **Influence, never authorship.** The god acts through a hand. A dealt hand is the god's own repertoire showing up in an everyday scene. Without one, an everyday encounter at The First's tier gives the player nothing to do.
- **Nomadic variety.** The same encounter twice should be rare. That is why the plan refuses to change the draw, and why the kill check watches the share ceiling after each slice.

## Tensions

1. **Coverage against depth.** The world is flat now: the top 10 carry 23.5% of firings, not 47%. Completing ten templates buys half the share it would have bought on 25 September. Deepening a few templates (full aftermaths, factory-grade rewrites) would raise quality where it lands, but on a small slice of what fires. Taken: breadth first, at the bulk-path floor THR-1598 set. Depth stays with the factory for new templates.
2. **What the player reads live against what they can read.** The First's 45 firings are the live read, but a small sample. The world's ranking is what a mortal's Chapters tab shows. Taken: the world ranking for S1 and S3, The First's draws for S2, and The First weighted first wherever the two agree. Four of S1's ten are First draws already.
3. **Endings for templates with no aftermath.** 34 of the top 40 have none. Options: (a) write a minimal aftermath with `byOutcome` on each; (b) let the last step's afterimages be the ending. (a) looks like completion but triggers the full Composition Contract: an aftermath with no persistent reward or system connection fails it, and the chips need state writes (Law 56). That is factory work, not bulk work. Taken: (b).

## Alternatives considered and dropped

- **Keep THR-1598's lists.** Rejected. Six of its ten slice-1 templates now rank 43rd to 86th, and its slice 2 (`reputation.*`) is no longer drawn by The First at all. THR-1633's closeout said to re-rank from a fresh run.
- **A damper for the top five.** Rejected. The world-wide novelty damper (`NOVELTY_GLOBAL_SHARE_TARGET = 0.04`) already holds the top template at 3.0%. A second one would fight it, and the gain is already banked.
- **Author `nearMissAfterimage` on every step.** Rejected. Near-miss resolved 0 times in 1,503 attended resolutions, and the linear spec pays it through dealt band fragments. Dealing is the near-miss payoff.
- **Full authored hands (4–6 bespoke cards per step).** Rejected for bulk. That is the most expensive part of authoring an encounter (THR-1247's motivation), and a pure fill reads as *this god's* hand. Authors may still add 0–2 specials where a scene has a card only it could offer.
- **Pull the fired templates off `RETROFIT_PENDING` by bringing each to the full contract.** Rejected as scope. Setting envelopes, cast bindings, persistent rewards and three system connections for 30 legacy templates is several factory batches. The ratchet stays two-way, so any template completion happens to bring up to contract comes off the list.
- **A completion census script in `scripts/`.** Deferred. The readers already produce it, and E3's ratchet is the durable gate. Promote `completion.ts` only if a later lane needs it on a schedule.

## Defect found while designing

`encounter-content.ts`'s `toUnifiedTemplate` is a field allowlist, and `deal` is not on it. This is the THR-838 trap again: nine of S1's ten templates live in that file, and a declared `deal` would ship as data nothing reads, with no type error. Folded into S1 as E1, with a test on the shipped object rather than the literal.

## Would change the plan

- The spike (E2) shows a dealt hand does not render on a converter-built template. The hand half then waits on a rendering fix, and the prose ships alone.
- A fresh run shows the draw concentrating again (any template above 4%). A weighting question then returns, and it goes to the design lane with numbers.
- Christian samples a completed template and finds the bulk-path register below his bar. The floor then becomes the factory's 2-of-6 sample for later slices. That is his call, invited as a veto on THR-1598 and still open to him.
