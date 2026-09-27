> **companion_of:** `Docs/plans/2026-09-27-thr-1633-written-encounters-land.md`
> **linear_issue:** THR-1633
> **author:** Claude Code (design lane, run 2026-09-27c)
> **created:** 2026-09-27

# Brainstorm companion — let written encounters land

The considered alternatives, tensions and Vision premises behind the plan. The plan is the contract; this is the reasoning.

## A. The re-measure changed the question

The ticket expected to design five fixes from [Reach before volume](https://linear.app/threadbare/issue/THR-1597). Re-running the readers on `3abbba8a` changed two of them:

- **Outgrowth is gone.** The dice refit switched the filter off. Designing a fix for it would be designing against a ghost. The honest move is to record it closed and ask what now stands in its place.
- **What stands in its place is the cap.** Outgrowth used to remove most candidates before the cap; with it gone, more reach the 40-slot cap, and the cap's free-slot fill walks the list from the head. The same positional cut has now been found three times (THR-814 faction offers, THR-1614 social offers, and here the location cache itself). The first two were fixed with reserves for the tail. A third reserve would not work here, because the starved entries are not a distinguishable class — they are just late in insertion order.

## B. Cap fill — options weighed

1. **Another reserve.** Rejected: no flag separates the starved entries; they are ordinary location-cache entries.
2. **Nearest hex first.** Meaningful (nearby things are what a mortal notices), but a city hex alone can carry more than 40 entries, so registration order would still decide within it.
3. **Random shuffle from a PRNG stream.** Fair, but consumes draws and shifts every downstream seeded result — a determinism cost with no gain over a hash.
4. **Distinct-first + rotating start from a pure hash (chosen).** Removes the ordering bias at its root, stops duplicate registrations of one template from hogging free slots, costs nothing in PRNG terms, and leaves every reserve untouched.
5. **Raise the cap.** Rejected: the cap is a performance guard; it does not fix ordering, only delays it.

## C. Deciders and guilds — tensions

- The THR-814 ruling closed two doors (promote members to spotlight; re-seed membership onto spotlight mortals). The map closed a third (new deciders). What is left is the mortal's own choice to join.
- The measurement showed the join *is* offered and does reach the shortlist — the failure is that it scores as worthless (reward 0) and, the three times it was chosen, no membership resulted.
- **Guild fit as the score term** keeps it a choice and makes membership follow character — a shadow-heavy mortal drifts toward the thieves, a star-and-iron one toward the dawn order. The alternative, a flat join bonus, would make every decider join whatever hall it happens to stand beside, which reads as noise rather than character.
- **Open risk:** if joins still do not happen at any sane bonus, the join encounter itself is the problem (what it asks, what it costs). That is a question about what belonging *means*, so it goes to Christian, not to tuning. Recorded as a kill criterion.

## D. The First

- THR-1590's headline (first encounter at t90) is mostly gone after the refit (t18). One seed still shows a 44-tick quiet stretch.
- The code shows a general defect: a queued journey never records the pull that chose it, so the first re-check compares alternatives against zero and the mortal abandons its goal. That fits the "changes destination on arrival" loop THR-1590 logged.
- A First-only rule (e.g. "The First always draws on arrival") was considered and rejected: court position deliberately has no effect on selection or movement, and the mortal-autonomy premise wants The First's life to be its own. Fixing the defect helps every mortal and The First with them.

## E. Bonus tags

- 434 templates untagged; hand-tagging would be a content sweep with its own review burden and would rot as new templates arrive untagged.
- Rekeying the table onto tags templates already carry — reach projections that exist, plus one new `encounterType` projection — makes every row live at once and stays live for new templates automatically. A bearer-floor test stops a row going dead again.
- The loss: some tags are finer-grained than `encounterType` (`#supernatural`, `#fate`). They are dropped from the table rather than faked; `#anomaly` is authored on the 10 templates that genuinely are anomalies.

## F. Vision premises checked

- **Mortal autonomy** — every change widens or repairs what a mortal chooses among; none chooses for it.
- **Variety over repetition** — S1 is a variety fix at root.
- **Failure is plot** — a failed join stays a failed join, traced with a reason.
- **Reach before volume** (the map's own premise) — this plan is that premise, executed.

## G. Things deliberately left for later

- Fix 8 (off-settlement places): the numbers do not call for it yet; re-rank after S1–S4 land.
- The 34 `guild-hall` places with no `factionDefId` (the lifecycle generator cannot use them): they are settlement guilds, which [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632) labels. Out of scope here.
- Retinue formation for The First: needs player clicks, which no headless census simulates.
