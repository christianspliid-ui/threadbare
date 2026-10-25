---
lane: tb-design-lane
run: 2026-10-25e
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run e, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A sequel seeded by templateId fires wherever the mortal stands](https://linear.app/threadbare/issue/THR-1929/a-sequel-seeded-by-templateid-fires-wherever-the-mortal-stands-no): a follow-up scene that belongs somewhere (a rematch in a tavern, a mill lease in a town) **waits for its place**. It plays the first time the mortal stands somewhere it fits. If that does not happen within 4 days, it withers with the existing "a planted thread withered" line. It never plays on the wrong ground. *Veto:* "a sequel should find the mortal wherever they are".

## Work

- **What was open.**
  - The briefing has no *From Christian* section, so there were no vetoes to apply.
  - Ready for Dev held only 2 items that are not Deferrals, below the floor of 4, so a design unit was owed.
  - Every wayfinder map is Done, and no lane claims were waiting to resume.
  - The plan-doc candidates are still blocked or inside a veto day:
    - [Nothing can take up an unclaimed artifact](https://linear.app/threadbare/issue/THR-2031/nothing-can-take-up-an-unclaimed-artifact-a-seeded-relic-lies-at-its) waits until 2026-10-26 02:25Z.
    - [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) waits on the debts plan's veto day, which ends tonight.
  - So the lane took the oldest agreed bug with no spec, as run b did for the founding gates.
- **Claimed, decided, handed off: [the sequel-place bug](https://linear.app/threadbare/issue/THR-1929/a-sequel-seeded-by-templateid-fires-wherever-the-mortal-stands-no).**
  - Claimed with the marker `design-lane claim 2026-10-25e`, and the claim stuck.
  - **What the census found.** A headless run on a medium map, seeds 42/99/7 for 300 ticks each, counted follow-up scenes for places. **77 of 264 (29%) played somewhere their scene does not belong.**
    - On seed 99, one merchant-guild contract re-seeded itself and played 38 times away from any town.
    - Only 13 of the 77 mortals later stood somewhere the scene fits, mostly within 4–43 ticks. That is why the wait is bounded at 4 days rather than open-ended.
  - **The catalog read.** 153 of the 166 places in the catalog that plant such a sequel point at a place-gated scene.
    - The tavern scenes are gated to the tavern building, but the seeding check only knows the town.
    - So the spec's place test reads the building too, the way the everyday board already does.
  - **The handoff.** The ticket holds the decision record, a seven-step build spec and its coordination block. It is in Ready for Dev, unassigned, with `Claimable from: 2026-10-26T14:29:00Z` in the description, so the builder waits out your veto day.
- **Filed:** [A seed's query can never reach a tavern scene](https://linear.app/threadbare/issue/THR-2039/a-seeds-query-can-never-reach-a-tavern-scene-all-ten-tavern-night).
  - The same tavern blindness affects seeds that ask for "a tavern evening" rather than one named scene. All ten tavern scenes are unreachable that way.
  - An author's note in the Gallows Pardon encounter already records working around it.
  - It is in Todo, unassigned, blocked by the sequel-place ticket (it reuses that ticket's place test), and its coordination block is the first comment.
- **Not this lane's call.** The briefing says warm playtest round 3 waits on [THR-1859](https://linear.app/threadbare/issue/THR-1859) and [THR-1860](https://linear.app/threadbare/issue/THR-1860), and that both wait on round 3. Both tickets' Done-when is "its implementation tickets are filed", and both sets are filed and linked as blockers. The playtest lane owns that gate and its "Fixed when" tracking, so this run left them alone.

## Escalations

None.
