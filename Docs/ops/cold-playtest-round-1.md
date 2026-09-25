---
lane: cold-playtest
round: 1
date: 2026-09-25
briefVersion: 1
startUrl: https://threadbearer.co/
usable: 3/3
filed: 10
needsChristian: false
---

# Cold playtest — round 1 (2026-09-25)

Run by hand in an attended session, before the harness existed (THR-1610 turns it into a loop). Three Opus testers ran with no repo access, no project rules and no debug tools. They only had a browser, the store-page pitch, and a persona. Each started at the title screen and played about 60 actions. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-1\`.

## Verdicts

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) | no | ~action 55 (after "A Vision → Witness" showed nothing) | 17 | 11 | 62 | 8 | $3.35 |
| veteran | maybe (not today) | no | action 63 (doom past half, no consequence it could name) | 12 | 10 | 63 | 9 | $2.95 |
| skimmer | no | no | action 55 (~minute 8; world ended in Summer Yr 1) | 13 | 13 | 55 | 10 | $3.34 |

**Best moment, all three:** the remembrance recap and god title ("You were called Maren… The Living Balm — Ascend").
**Common message to the designer:** put one named mortal on screen first, and show what they do because of the player's whisper.

## Findings filed (milestone *Cold playtest · round 1*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-1605](https://linear.app/threadbare/issue/THR-1605) | design, Urgent | A new player never meets The First: avatar starts at a shrine, the meeting needs a settlement, nothing points the way | 3/3 |
| [THR-1606](https://linear.app/threadbare/issue/THR-1606) | design | After a cast the player never sees what changed (dreams, "A Vision → Witness", gift beats) | 3/3 |
| [THR-1608](https://linear.app/threadbare/issue/THR-1608) | design | The first ten minutes after Ascend: popup chain, doom/rivals at full volume, world ends in Summer Yr 1, real-time vs "turn-based" | 3/3 |
| [THR-1607](https://linear.app/threadbare/issue/THR-1607) | design | Resources and risks unreadable (essence, card stars, fated/doomed/held, Owing/Sealed, ABSOLUTE) | 3/3 |
| [THR-1609](https://linear.app/threadbare/issue/THR-1609) | design | "Who am I?": the avatar carries the player's past-life name | 3/3 |
| [THR-1600](https://linear.app/threadbare/issue/THR-1600) | bug | "Story so far" shows a raw `{name}` | 1/3 |
| [THR-1601](https://linear.app/threadbare/issue/THR-1601) | bug | "Ubiquitous Language" on the title menu; Codex/glossary "Back to Game" opens the dev world | 3/3 (menu), 1/3 (dev world) |
| [THR-1602](https://linear.app/threadbare/issue/THR-1602) | bug | Internal ids and template seams in the chronicle (`elder_ruin_81`, `RIVAL-SCHEME-…`, `Rule: death_or_transformation`, "a economic") | 3/3 |
| [THR-1603](https://linear.app/threadbare/issue/THR-1603) | bug | Cast receipt "Mind — Action Invoked. reaches into…" | 2/3 |
| [THR-1604](https://linear.app/threadbare/issue/THR-1604) | bug | Cast button jumps; Enter doesn't submit the name; Rivals/Notables labels unclickable; ledger badge vs list; no return to title | 1–2/3 each |

## Not filed

- **"CYCLE 1 COMPLETEA SOMBER AGE" (tester-error).** `HarvestScreen.tsx:60-72` renders two separate blocks; the run-together came from how the tester read the text.
- **"Map hexes drawn on top of pop-up cards" (unverified).** Recorded as an investigate item inside THR-1604 (lead: `HexTooltip` z-index 10 below the label overlays).

## Needs Christian

None. Round 1 was reported in chat on 2026-09-25. Round 2 runs automatically once every ticket above is closed and deployed.
