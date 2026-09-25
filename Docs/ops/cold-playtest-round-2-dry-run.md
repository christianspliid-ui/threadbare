---
lane: cold-playtest
round: 2
date: 2026-09-25
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 1a0d803e968c234ffa9b3d60eb637f8fab60ccec
usable: 3/3
filed: 0
needsChristian: false
dryRun: true
---

# Cold playtest — round 2 DRY RUN (2026-09-25)

> **DRY RUN** — no milestone, no tickets; harness verification only. This proves the harness built by [THR-1610](https://linear.app/threadbare/issue/THR-1610) runs end to end. It is **not** round 2: round 1's findings are still open, so this build was expected to show the same problems. The real round 2 runs automatically once milestone *Cold playtest · round 1* (tickets [THR-1600](https://linear.app/threadbare/issue/THR-1600)…[THR-1609](https://linear.app/threadbare/issue/THR-1609)) is closed and deployed.

The first harness run used `scripts/cold-playtest/run-round.ps1 -Round 2 -Label dry-run`: three Opus testers, brief v1, the same personas as round 1, starting on the bare production URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-2-dry-run\`.

## Verdicts (vs round 1)

| Persona | Would keep playing? | R1 | Met The First? | First WOULD QUIT at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|---|
| story | **no** | maybe | no | action 71 (the end screen: lost to a timer it did not know existed) | 14 | 9 | 71 | 9 | $5.01 |
| veteran | maybe (leaning no) | maybe | no | action 76 (Doom ran three stages behind dialogs that blocked pause) | 11 | 9 | 76 | 11 | $5.17 |
| skimmer | no | no | no | ~action 37 (in the debrief; not tagged in-play) | 12 | 7 | 62 | 8 | $3.09 |

**Common message to the designer, again:** show the mortal's story up front, and show each whisper visibly landing on it.

## What the testers hit (not triaged: dry run)

No source verification was run and nothing was filed. Every candidate maps onto an **open** round-1 ticket, so a real round would comment new evidence on the original rather than file a duplicate (skill step 6, *recurred*):

- Never met or followed a mortal (3/3). One tester found the Follow button buried in Full Profile → Journey. → [THR-1605](https://linear.app/threadbare/issue/THR-1605)
- Casting a dream or conviction shows only a toast. "A Vision → Witness" showed no scene (3/3). → [THR-1606](https://linear.app/threadbare/issue/THR-1606)
- Five one-button popups in a row, Doom at full volume, the world ends in Summer Year 1 with "Mandate Failed", real-time vs "turn-based" (3/3). → [THR-1608](https://linear.app/threadbare/issue/THR-1608)
- Unreadable meters: Essence without numbers; fated/doomed/held; star rows; Attention; Reaches states (3/3). → [THR-1607](https://linear.app/threadbare/issue/THR-1607)
- "You were called Maren", then a mortal named Maren; the skimmer's own name "Vorn" reused (3/3). → [THR-1609](https://linear.app/threadbare/issue/THR-1609)
- Enter doesn't submit the name; the Rivals label is unclickable (2/3). → [THR-1604](https://linear.app/threadbare/issue/THR-1604)
- Codex text reads like developer notes (`interventionType dream`, "does not mutate the graph directly", `WIRED-TEMPLATE`) (1/3). This is a new candidate that a real round would verify and file. Nearest open ticket: [THR-1602](https://linear.app/threadbare/issue/THR-1602).

**Best moments named:** the origin sequence (story), Solenne's chapter steps and the observation fog (veteran), and Vorn's Prowess line "flinches at the sound of drawn steel" (skimmer).

## Harness notes

- `run-round.ps1` from the plan appendix died after all three testers finished. PowerShell variables are case-insensitive, so `$round = [ordered]@{…}` wrote into the `[int] $Round` parameter. It is fixed in the THR-1610 PR (`$roundInfo`). A new `-SummarizeOnly` switch recovered this run's `round.json` without re-running the testers.
- Cost: $13.27 notional (subscription), 11 min wall clock, parallel.

## Needs Christian

None.
