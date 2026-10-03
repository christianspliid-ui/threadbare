---
lane: cold-playtest
round: 2
date: 2026-10-03
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 7ebc640d
usable: 3/3
filed: 13
needsChristian: true
---

# Cold playtest — round 2 (2026-10-03)

Run by hand in an attended session at Christian's request, after all 15 round-1 tickets closed and deployed. The `tb-cold-playtest` lane was registered the same day; it had sat unregistered since 2026-09-25 (impediment #1133). Same brief (v1), same three personas, same start URL as round 1. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-2\`.

## Verdicts (round 1 → round 2)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe → **maybe (leaning no)** | n → **y** (Thessa) | ~55 → ~55 (the Ledger showed Thessa's chapters resolved without her) | 17 → 17 | 11 → 12 | 58 | 8 | $3.74 |
| veteran | maybe → **maybe** | n → **y** (Thessa) | 63 → 63 (soft: toasts and drifting numbers faster than understanding) | 12 → 12 | 10 → 9 | 63 | 12 | $4.40 |
| skimmer | **no → maybe (leaning no)** | n → **y** (Aldric) | 55 → 62 (~minute 9, back on the dashboard after the dilemmas) | 13 → 16 | 13 → 10 | 62 | 10 | $4.37 |

**What changed:**
- **Met The First:** every tester met and bonded their First (round 1: none).
- **Best moment:** all three named the bonding dilemma scenes (round 1: the remembrance recap).
- **The drop moved:** from "never met a mortal" to "the game lives my mortal's life without me".

## Earlier findings

| Round-1 ticket | Status in round 2 | Note |
|---|---|---|
| [THR-1605](https://linear.app/threadbare/issue/THR-1605) never meets The First | **fixed-confirmed** | 3/3 bonded |
| [THR-1606](https://linear.app/threadbare/issue/THR-1606) no visible consequence | **fixed-confirmed** (dilemmas) | Testers named consequences of their whispers; a map cast hitting the wrong target is new ([THR-1705](https://linear.app/threadbare/issue/THR-1705)) |
| [THR-1608](https://linear.app/threadbare/issue/THR-1608) first ten minutes | **fixed-confirmed** (its Fixed-when) | No world ended; the gift chain no longer buries the start. New first-minutes findings filed as [THR-1715](https://linear.app/threadbare/issue/THR-1715) and [THR-1716](https://linear.app/threadbare/issue/THR-1716) |
| [THR-1609](https://linear.app/threadbare/issue/THR-1609) who am I | **fixed-confirmed** (core) | The veteran recognised the avatar as theirs; the profile's leftover "Unaware" text is [THR-1710](https://linear.app/threadbare/issue/THR-1710) |
| [THR-1602](https://linear.app/threadbare/issue/THR-1602) raw ids in chronicle | **fixed-confirmed** | No raw ids in three logs; a new seam is "The The" ([THR-1708](https://linear.app/threadbare/issue/THR-1708)) |
| [THR-1601](https://linear.app/threadbare/issue/THR-1601) dev surfaces on title menu | **fixed-confirmed** (menu) | The Codex itself still shows developer text ([THR-1707](https://linear.app/threadbare/issue/THR-1707)) |
| [THR-1603](https://linear.app/threadbare/issue/THR-1603) cast receipt sentence | **fixed-confirmed** (sentence) | It now names "Observe" instead of "Piercing Gaze" ([THR-1708](https://linear.app/threadbare/issue/THR-1708)) |
| [THR-1604](https://linear.app/threadbare/issue/THR-1604) five small faults | **partly confirmed** | Cast button: a first-click cast worked. Enter-on-name, Rivals label and return-to-title: not exercised |
| [THR-1600](https://linear.app/threadbare/issue/THR-1600) raw `{name}` | **not-exercised** | No tester opened a quiet mortal's Story-so-far |
| [THR-1607](https://linear.app/threadbare/issue/THR-1607) unreadable resources | **recurred** | 0/3 could say what essence or "doomed" means; filed [THR-1713](https://linear.app/threadbare/issue/THR-1713) |

## New findings (milestone *Cold playtest · round 2*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-1715](https://linear.app/threadbare/issue/THR-1715) | design, Urgent | After the bond the game lives The First's life without the player (Auto by default; chores fill the Ledger) | 2/3 (both quit points) |
| [THR-1714](https://linear.app/threadbare/issue/THR-1714) | design | Dilemmas hide the roll: "was Perilous", "Let fate decide", outcome matching an unpicked card | 3/3 |
| [THR-1713](https://linear.app/threadbare/issue/THR-1713) | design (recurs) | Resources and risks still unreadable; no tooltips | 3/3 |
| [THR-1716](https://linear.app/threadbare/issue/THR-1716) | design | The world arrives paused with no direction; setup ~3 min | 2/3 |
| [THR-1704](https://linear.app/threadbare/issue/THR-1704) | bug | Threads panel says "No Threads" after the bond (no `touchWorld`) | 1/3 |
| [THR-1705](https://linear.app/threadbare/issue/THR-1705) | bug | A hex people-list click opens nothing but becomes the cast target | 3/3 |
| [THR-1706](https://linear.app/threadbare/issue/THR-1706) | bug | Essence tells three stories; Meet The First never charges | 3/3 |
| [THR-1712](https://linear.app/threadbare/issue/THR-1712) | bug | Meet The First contradicts itself: name vs portrait, path-card art, scene art by index, "Decay"/"Corrode" as names | 3/3 |
| [THR-1707](https://linear.app/threadbare/issue/THR-1707) | bug | Developer text in the Codex and the mortal panel | 2/3 |
| [THR-1708](https://linear.app/threadbare/issue/THR-1708) | bug | "The The", "completed Observe", "your nudge" on untouched chapters | 2/3 |
| [THR-1709](https://linear.app/threadbare/issue/THR-1709) | bug | Court screen cut off, unclosable, drawn under the top bar | 1/3 |
| [THR-1710](https://linear.app/threadbare/issue/THR-1710) | bug | Own avatar reads "Unaware" / "haven't observed" | 1/3 |
| [THR-1711](https://linear.app/threadbare/issue/THR-1711) | bug | Six small faults (dream lost on Escape, card-title clicks, Attention, label piles, toasts, pause-in-popup) | 1–2/3 each |

## Not filed

- **"Time un-pauses itself" (tester-error for the described sequence).** `useInterruptAutoPause.ts:49-60` restores the pre-popup state, so pause → open ledger → close stays paused. The two real edge holes are item 6 of [THR-1711](https://linear.app/threadbare/issue/THR-1711).
- **"Clicking the cards never selected them" (partly unverified).** No overlay covers the cards. The verified cause is the title link swallowing the click, filed in [THR-1711](https://linear.app/threadbare/issue/THR-1711) item 2.
- **"The intro said matter and mind, but the Reaches are Stone/Gold/Iron" (by design).** Spheres and Reaches are separate axes (load-bearing decision). It is a legibility point, folded into [THR-1713](https://linear.app/threadbare/issue/THR-1713).

## Cost and duration

3 testers in parallel, 12 min wall clock, $12.51 notional on the subscription plan. Synthesis and verification took two Explore investigators (about 6 min each).

## Needs Christian

- **Round 2 found the game's heart and its next wall.** All three new players met and bonded their mortal, and all three called those scenes the best part ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md)). The lunch-break player moved from "no" to "maybe".
- **The new top problem:** after the bond the game plays the mortal's life on autopilot. Two of three quit there ([THR-1715](https://linear.app/threadbare/issue/THR-1715), Urgent, going to design).
- **13 tickets are filed** in the [round-2 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 9 bugs ready to build, 4 for design. Round 3 runs on its own (daily check from 10:48) once they are all closed and live.
