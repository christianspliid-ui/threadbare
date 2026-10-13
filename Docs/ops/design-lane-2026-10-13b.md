---
lane: tb-design-lane
run: 2026-10-13b
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-13 (run b, ~01:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793/216-of-509-seed-42-mortals-have-no-culture-edge-so-their-sphere-bag-is) — **every town now belongs to a people.**
  - **The NPCs were never the problem.** Townsfolk already take their town's culture. But 24 towns on the test world, including a capital and four cities, belong to no people at all, because they sit more than 4 hexes from any culture's heartland.
  - **A culture's fringe now reaches every town** on the map, not just towns within 4 hexes. A far town reads *"Varn fringe"*, exactly like a near one. It is still never territory: borders, Realm holdings and town promotion do not change.
  - **Result:** mortals with no people fall from 216 to 13 at the start of the test world, and from 368 to 74 after 240 ticks. Babies born to no people go from 47 to 0. The ones left are lair monsters, wanderers at ruins and waypoints, your own starting shrine, and the 1 in 10 heroes who are rootless by design.
  - **Cost:** about 6 % slower per tick (210 → 222 ms), under the 10 % limit the earlier faith-and-politics design set.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1793-every-town-has-a-people.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1793-every-town-has-a-people-brainstorm.md). Building waits until 01:45 UTC tomorrow (14 Oct).
  - *To veto, say:* **"keep the far towns without a people"** or **"far towns should read differently from near ones"**.

## Work

- **Claimed** [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793/216-of-509-seed-42-mortals-have-no-culture-edge-so-their-sphere-bag-is) (marker `design-lane claim 2026-10-13b`).
  - Why this ticket: Ready for Dev held 3 non-Deferral items, below the floor of 4. It is a bug that asks the design lane a direct question. [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) was skipped because it builds on [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each), which is still inside its 24 h veto window.
  - No vetoes were found in the briefing.
- **Measured** with the headless CLI on seeds 42 and 99, at tick 0 and tick 240. 0 NPCs at a cultured town lack a culture; every cultureless NPC stands in a cultureless town. Speed: three alternating pairs of 200-tick runs on seed 99, 210.6 → 222.4 ms steady. A 24-hex reach and an unlimited reach give identical worlds.
- **Gates:**
  - Intent judge: **Allow**. Its one gap was an untraced leftover shrine; I traced it to the god's starting shrine and fixed it before commit.
  - Audits: NFP PASS-with-notes, three-pillar PASS, Vision PASS-with-notes.
  - `lint:plan-doc` clean, `check:generated-freshness` OK, liveness LIVE.
- **PR:** [docs(plan): 2026-10-13 every town has a people](https://github.com/christianspliid-ui/threadbare/pull/2354), merged. The first attempt, [PR #2353](https://github.com/christianspliid-ui/threadbare/pull/2353), was closed unmerged because its branch name carried the ticket id.
- **Handed off** to Ready for Dev, unassigned, with the coordination block and `Claimable from: 2026-10-14T01:45:00Z` in the description.
- **Filed** [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick) (Todo, blocked by the above). It covers new hamlets founded mid-run and mining sites.

## Escalations

None.
