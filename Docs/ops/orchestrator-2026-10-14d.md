---
lane: tb-orchestrator
run: 2026-10-14d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-10-14 (run d, ~07:40Z)

## Needs Christian

One heads-up, no rush. The first encounter coverage run ([THR-1850](https://linear.app/threadbare/issue/THR-1850)) is the paid run of the content-sorting tool you asked for. It needs your TypeSafe key set as a Windows user environment variable named `TYPESAFE_API_KEY` on the home machine. Get the key from [console.typesafe.ai](https://console.typesafe.ai/), and don't paste it into chat. The tool itself ([THR-1723](https://linear.app/threadbare/issue/THR-1723)) is in the builder's queue now, so the key is the next thing it will wait on.

Separately, one small world fix joined the builder's queue. A hamlet founded during play inside a people's own lands will count as part of their heartland, not their fringe ([THR-1849](https://linear.app/threadbare/issue/THR-1849)).

## T1 — unblock sweep

- **Promoted: THR-1849** (founded places inside a province should take the heartland; Deferral + Engine). Its gate was THR-1839, which is Done, completed 2026-10-14T07:34:43Z (PR #2366, merge 23da4df6). `TODO(THR-1849)` is confirmed on origin/main at `cultureGenerator.ts:351`. It has no native blockers. The latest comment is its filing coordination block, not a verdict. A re-query confirmed Ready for Dev with no assignee. The coordination block is posted: opus; parallel-safe with THR-1848, THR-1757 and THR-1862; mutex with THR-1813 (both edit `worldSeed.ts` / `gameInit.ts` worldgen seeding).
- **Unmet blocker (new):** THR-1850 is blocked by THR-1723 (native relation; Ready for Dev). It also has an off-board prerequisite: `TYPESAFE_API_KEY` is unset.
- **Wrong destination (new, warm playtest round 2):** THR-1859 (the mortal's mid-game sits behind "View Full Profile"), THR-1860 (outcome words that mislead) and THR-1861 (brief v2 decision). Each one is a design question whose Done-when is "implementation tickets filed" or "decision recorded". They are design-lane input, not executor work.
- **Unmet blockers, unchanged:** THR-1840 (THR-1757 is in Ready for Dev), THR-1841 (THR-1840 is in Todo), THR-1843 and THR-1844 (THR-1813 is in Ready for Dev).
- **Wrong destination, unchanged:** THR-1842.
- **Wayfinder, skipped:** THR-1823 and THR-1863 (maps); THR-1829, THR-1834, THR-1865, THR-1866 and THR-1867 (prototypes); THR-1864 (research, see T1.5).
- **Not candidates, unchanged:** THR-1274, THR-1745, THR-1220 (HITL), THR-1719 (reserved for Christian), THR-1218, THR-1381, THR-791.
- **Shelf:** Ready for Dev holds 14 items, 11 of them non-Deferral. Most were filed directly by the warm playtest round 2 at ~07:27Z (THR-1851 to THR-1858) and by the economy audit (THR-1862). The ceiling did not apply, because 13 was not over 15 before this promotion. In Dev is empty; THR-1839 closed this hour.
- **Product vs process:** all of this run's work is product. No process ticket is on the shelf or among the candidates.

## T1.5 — wayfinder sweep

- **THR-1823 (The Map Is the Table):** the frontier is THR-1834 (prototype), **left for the design lane**. THR-1829 is now assigned to Christian (since 07:26Z), so it is off the frontier. There are no research, task or reserved tickets open.
- **THR-1863 (Mortal economy), new map, charted 07:29Z:** the frontier is 4 tickets. THR-1865, THR-1866 and THR-1867 are prototypes, **left for the design lane**. THR-1864 is research (trade-lane density trace). **Not burned down this run.** The map was charted about 10 minutes before this sweep, in what reads as an attended session. Its description was still being written at 07:30Z, and its `## Reserved for Christian` says "asked at charting, empty until he answers". Claiming a child of a map whose reserved list is still being decided risks colliding with that session. The next run picks up THR-1864 if it is still open, unclaimed and unreserved.

## T2 — design authoring

**Not triggered.** Ready for Dev holds 11 non-Deferral items (floor 2). In Design: 0 live, 0 excluded. THR-1723 left the column for Ready for Dev after the design lane handed it off (plan doc PR #2368 merged).

## T3 — architecture health

**Due and run** (first published sweep today; ~09:35 local). It is Wednesday, so there was no test-suite pass. The detectors ran on the home tree at `b0748460`. The baseline is 2026-10-12, because no T3 section was published on 10-13.

| Detector | Result | vs. 10-12 |
|---|---|---|
| `generate-interface-map:dry` | exit 0: 7 LEAKED, 1 PARTIAL | Same |
| `sweep:rank-reach` | FAIL: 23 apex holders at t900; 22 blocked, 0 unowned | Drift, not new |
| `check:process` | exit 1: `check:authoring-brief` floors on `master-everyday-brief.md` | Same (still unfixed) |
| `check:canon-staleness` | exit 0, 37 warning lines | Same count |

- **Rank sweep drift (standing finding).** The blocked count holds at 22. The members of the set changed: `civic_guard` (`cg.*`) moved from unowned to blocked, which means it now has members but none who qualify. `tg.*` is reachable again. `rb.*`, `hod.*`, `bf.*` and `ag.elite` are still blocked. The standing tickets are THR-810, THR-814 and THR-816. Nothing was filed.
- **Known class, new instance:** 3 `Duplicate node ID: evt_agent_garrison_culture_1_*` collisions sit next to the known `mc_cmdr` ones. This is the same class as impediment #1147 (fail-soft, one Event node lost per collision). Not new.
- **Stalled work:** none. THR-1839 went from one claim to Done in 49 minutes.
- **In Design: 0 live, 0 excluded.** The column is empty, so T2 is free to stage when the shelf next runs thin.
- **Hand-created In Dev:** none. The column is empty.
- **Redundancy:** not assessed this sweep.
- **Not run:** `__DEBUG.validateTraitRefs()`, because it is browser-only.

## Escalations

None.
