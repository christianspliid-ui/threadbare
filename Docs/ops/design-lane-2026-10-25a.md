---
lane: tb-design-lane
run: 2026-10-25a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run a, ~02:25Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030/a-seeded-relic-has-no-place-in-the-graph-its-site-is-only-a-property): a relic left by an earlier god now **lies at its place** through its own link, the way an unclaimed thing lies on the ground. It is not "at" the place the way a person is. Its page says where it lies, the place's page lists it, and it still reads Foreign until someone takes it up. If it shared the people link, about 15 parts of the game would count it as a resident, including crowd size, threat, the camera and the "your mortal is here" checks. *Veto:* "an artifact should simply be at a place like a person".

## Work

- **What was open.** The briefing has no *From Christian* section, so there were no vetoes to apply. Ready for Dev holds 6 items that are not Deferrals, above the floor of 4. Every wayfinder map is Done, and no lane claims were waiting to resume. [Traits wave 3](https://linear.app/threadbare/issue/THR-791) is assigned but has no lane marker, so it was skipped. The plan-doc candidates the last run listed are still blocked or inside a veto day (the debts plan's day ends 2026-10-25 19:45 UTC). The new candidate was [A seeded relic has no place in the graph](https://linear.app/threadbare/issue/THR-2030/a-seeded-relic-has-no-place-in-the-graph-its-site-is-only-a-property), filed 01:20Z by the builder's review gate. It is a consequence of shipped design, so it is agreed work.
- **Claimed, decided, handed off.** I claimed the ticket with the marker and checked the claim stuck. The decision rests on measurements quoted on the ticket:
  - 39 readers of the people link (`located_at`), about 15 of them unfiltered;
  - the path-finder walking the containment link (`contains`), which rules that link out;
  - the repo's precedent for a narrow new edge (`owns` beside `controls`);
  - `Docs/canon/engine.md:148`, which allows a new **edge** after checking the existing ones (the stop-and-ask rule covers node types only);
  - two dead Inspector rows (`src/engine/views/connections.ts:91,123`) that already expect artifacts to have a place.

  The decision record and a six-edit build spec with its coordination block are on the ticket. It is in Ready for Dev, unassigned, with `Claimable from: 2026-10-26T02:25:00Z` in the description, so the builder waits out your veto day.
- **Filed:** [Nothing can take up an unclaimed artifact](https://linear.app/threadbare/issue/THR-2031/nothing-can-take-up-an-unclaimed-artifact-a-seeded-relic-lies-at-its). The world-remembers plan says existing encounters already reach a seeded relic, but nothing in the code picks up an artifact that already exists. Encounters only mint new ones. So today a relic lies unclaimed for the whole run. The ticket is in Todo, unassigned, and blocked by the relic-place ticket. It waits for a later design run.

## Escalations

- **Warm round 3's gate is still circular.** Nothing has changed since run 2026-10-24d: [the mortal's mid-game is behind a button](https://linear.app/threadbare/issue/THR-1859) and [outcome words that mislead](https://linear.app/threadbare/issue/THR-1860) each wait on round 3, and round 3 waits on them. The cold-playtest lane owns that gate.
