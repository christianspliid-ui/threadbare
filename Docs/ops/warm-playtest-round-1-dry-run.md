---
lane: cold-playtest
mode: warm
round: 1
date: 2026-10-08
briefVersion: 1
warmBriefVersion: 1
warmTicks: 300
startUrl: https://threadbearer.co/?view=game&seeded&size=medium&warm=300
deployedCommit: a43dc356ffdaff63c1657c220208a60eab795ad0
usable: 3/3
covered: 1/3
filed: 0
needsChristian: false
dryRun: true
---

# Warm playtest — round 1 DRY RUN (2026-10-08)

> **DRY RUN** — no milestone, no tickets; harness verification only. This proves the warm mode built by [THR-1744](https://linear.app/threadbare/issue/THR-1744) runs end to end on the live site. The real warm round 1 ran straight after it: [warm-playtest-round-1.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-1.md).

`scripts/cold-playtest/run-round.ps1 -Round 1 -Mode warm -Label dry-run`: three Opus testers, warm brief v1, the cold personas, starting at the warm link. Artifacts: `%USERPROFILE%\.threadbare\warm-playtest\round-1-dry-run\`.

## Warm start (all three testers)

| Persona | `[warm-start] done` | advanced | ms | pending at arrival | open at arrival |
|---|---|---|---|---|---|
| story | yes | 300/300 | 107 282 | 0 | JourneyVignetteModal |
| veteran | yes | 300/300 | 108 381 | 0 | JourneyVignetteModal |
| skimmer | yes | 300/300 | 107 350 | 0 | JourneyVignetteModal |

Three warm-ups ran in parallel on one machine (~107 s each). A single warm-up on the live site took 74 s. Both are under the 180 s kill line. Each tester had one decision waiting at arrival, which is within `WARM_START_MAX_ARRIVAL_DECISIONS` (1).

## Verdicts

| Persona | Would keep playing? | Met The First? | First WOULD QUIT at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) | y (bonded at start) | — (debrief: the inert Silent Chamber choice) | 11 | 8 | 60 | 12 | $3.65 |
| veteran | maybe | y | — (debrief: the seat placed for them) | 12 | 8 | 56 | 16 | $3.30 |
| skimmer | maybe (leaning no) | y | — (debrief: a boosted "Favorable" barter failed) | 12 | 9 | 59 | 15 | $4.10 |

## Coverage

| Persona | faction | undertaking | ambition | threadHistory | coverage failure |
|---|---|---|---|---|---|
| story | — | — | — | reached | **yes** |
| veteran | — | reached-empty | reached | reached | no |
| skimmer | — | — | — | reached | **yes** |

One tester in three reached the mid-game. No one opened a faction. All three spent the session on The First's chapters and the panels around them.

## What the testers hit (not triaged: dry run)

No tickets were filed. The real round 1 verifies and files these if its testers hit them again.

- **Mind essence at 0 locks every intervention (3/3).** The tooltip blames thread upkeep. Nothing says how to recover. This is [THR-1747](https://linear.app/threadbare/issue/THR-1747), which is open.
- **The "Hold the knowledge / Bring it forward" choice after the Silent Chamber ignores clicks (3/3).** No reason is shown.
- **Arrival replays the opening (3/3).** "Beat 1 — Call" and "The First Thread / Reach Down" read as a tutorial restart after the catch-up.
- **Template seams (2/3).** "His only kin, , claims…", `{cast:heir}`, `{location}`, `{actor}`, "the Renowned", and "The Quarter of Quarter of Heart of the Barrow".
- **Unreadable costs and outcomes (3/3).** "3 essence" without a pool, six identical "BOND · WORLD STANDING ▲▲▲" rows, and FATED vs FAVORABLE vs UNCERTAIN. This territory belongs to [THR-1713](https://linear.app/threadbare/issue/THR-1713) and [THR-1706](https://linear.app/threadbare/issue/THR-1706), both closed.
- **Notables and Rivals (3/3).** The badge reads 10 → 9 → 2 while the panel shows "Rulers (19)", one ruler is listed twice, and no name opens anything. This territory belongs to [THR-1604](https://linear.app/threadbare/issue/THR-1604), which is closed.
- **The aftermath screen comes back after "Return to the world" (2/3).**
- **Journey tab vs ledger (1/3).** The Journey tab says "Nothing yet worth the telling" next to 61 ledger chapters.

**Best moments named:** the Chapter Ledger's chapters (story), Kael's full profile with ambitions and the conquering Captain (veteran), and the Barter with Travelers card hand (skimmer).

## Harness notes

- All three personas logged the `[warm-start] done` marker, and `warmStartOk` is true.
- The coverage extractor matched "The Work" / "No long work under way" (`reached-empty`) and "Ambitions" for the veteran.
- Cost: $11.05 notional (subscription). Wall clock: 17 min, run in parallel.

## Needs Christian

None.
