---
lane: cold-playtest
round: 5
date: 2026-10-26
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: c9e34136
usable: 3/3
filed: 8
needsChristian: true
---

# Cold playtest — round 5 (2026-10-26)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open:
- all 11 round-4 tickets were closed;
- `main` was live (`check:deploy` said `skipped`: the only commits since the last publish, 3f54d0dd, were docs), and the newest close was 2026-10-21;
- 8 days had passed since round 4;
- the tester login was alive.

Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-5\`. The warm series was not evaluated, because only one round runs per fire.

## Verdicts (round 4 → round 5)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Elara) | none → **66, end of run**: Doom, Mandate, Investiture and Rivals all arrived at once while Elara lay Destitute after a chapter she never saw ([THR-2052](https://linear.app/threadbare/issue/THR-2052), [THR-2058](https://linear.app/threadbare/issue/THR-2058)) | 14 → 15 | 7 → 9 | 66 | 10 | $4.65 |
| veteran | maybe (leaning yes) → **maybe (leaning yes, "if it's patched")** | y → **y** (Thessa) | none → **64, soft**: Thessa's sheet said "No thread connects you" right above "took your thread in devotion", after a bind on her that "faltered" ([THR-2054](https://linear.app/threadbare/issue/THR-2054)) | 14 → 12 | 8 → 9 | 64 | 11 | $4.61 |
| skimmer | maybe (leaning no) → **no** | y → **y** (Morthane) | 47 → **57, about minute 8-9**: the chapter closed with no result after "Cut The Thread", and the map had slid off-screen again ([THR-2052](https://linear.app/threadbare/issue/THR-2052), [THR-2056](https://linear.app/threadbare/issue/THR-2056)) | 11 → 12 | 6 → 9 | 57 | 8 | $4.10 |

**What changed:**
- **The opening holds.** All three testers bonded a mortal for the fourth round running and named the opening as their best moment. The opening is the portraits with names, the close-up vignettes, and the first card play turning the odds. The skimmer: *"Clear, quick, and it made me care."* The story tester: *"I shaped who she is, not just whether she 'won'."* The skimmer also called the time to a mortal ("~4 min in") *"Reasonable."*
- **The skimmer dropped from "maybe" to "no".** The wall moved past the first chapter. On the live map, chapters close before their result shows, chapters of The First play out without the god, popups land on the player's click, and the map drifts to the screen edge.
- **The veteran still leans yes.** He praised the new sphere-pour screen (*"clear and honest"*) and the Codex depth. His trust broke on The First's sheet contradicting itself.
- **A second wall at about minute ten.** Doom, Mandate, Investiture, Rivals and the feed arrive together. That is where the story tester quit.

## Earlier findings

| Ticket | Status in round 5 | Note |
|---|---|---|
| [THR-1976](https://linear.app/threadbare/issue/THR-1976) chapter Play answers nothing | **recurred** (running clock) | THR-1976 fixed the paused path. Every tester ran at 2×, and on a running clock the answering card is switched off (`CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK = false`). Missed its "Fixed when", 3/3. Filed [THR-2052](https://linear.app/threadbare/issue/THR-2052), Urgent |
| [THR-1806](https://linear.app/threadbare/issue/THR-1806) / [THR-1715](https://linear.app/threadbare/issue/THR-1715) chapters end out of sight or play out alone | **recurred** | The First's chapters still resolve alone when their screen is closed without minimising ("Elara faced it alone"). Same ticket: [THR-2052](https://linear.app/threadbare/issue/THR-2052) |
| [THR-1980](https://linear.app/threadbare/issue/THR-1980) can't read spend or risk | **recurred** (fifth round) | Missed its "Fixed when": 3/3 list Attention and 2/3 the pools. The pour screen, Fated's colour and the odds sentence are fixed-confirmed. Filed [THR-2058](https://linear.app/threadbare/issue/THR-2058) |
| [THR-1985](https://linear.app/threadbare/issue/THR-1985) show what the pour does | **fixed-confirmed** (pour screen) | Veteran: *"The sphere-pour screen is clear and honest: opposed pairs, refill rates, which pool pays upkeep."* The top-bar arrows still mislead ([THR-2058](https://linear.app/threadbare/issue/THR-2058)) |
| [THR-1986](https://linear.app/threadbare/issue/THR-1986) words wait for their moment | **partly recurred** | Elder powers and Chronicle jargon were not named. Doom, Mandate, Investiture and Rivals still arrive together ([THR-2058](https://linear.app/threadbare/issue/THR-2058)) |
| [THR-1977](https://linear.app/threadbare/issue/THR-1977) Observe and Bind Thread cast free | **fixed-confirmed** (price) | The veteran's bind took 10 Mind. The new problem is that the bind is offered on an already-bound First ([THR-2054](https://linear.app/threadbare/issue/THR-2054)) |
| [THR-1981](https://linear.app/threadbare/issue/THR-1981) / [THR-1987](https://linear.app/threadbare/issue/THR-1987) / [THR-1989](https://linear.app/threadbare/issue/THR-1989) blind opening picks, long setup | **fixed-confirmed** | Portraits are named at rest (skimmer: *"three oil-painted faces with one-line hooks"*); setup to a mortal is about 4 minutes ("Reasonable"). The skimmer still counted five setup screens; carried forward, not filed |
| [THR-1988](https://linear.app/threadbare/issue/THR-1988) the chosen path comes back | **fixed-confirmed** (the bond) | "Morthane will become the unseen blade" titled the bond. The path does not yet steer later work ([THR-2059](https://linear.app/threadbare/issue/THR-2059)) |
| [THR-1982](https://linear.app/threadbare/issue/THR-1982), [THR-1983](https://linear.app/threadbare/issue/THR-1983), [THR-1984](https://linear.app/threadbare/issue/THR-1984), [THR-1993](https://linear.app/threadbare/issue/THR-1993) chapters recast The First's trade | **fixed-confirmed** | No tester reported a trade The First never had |
| [THR-1853](https://linear.app/threadbare/issue/THR-1853) (warm) popups steal clicks | **recurred** (cold, chapters) | Its arrival holds never covered chapters. Filed [THR-2053](https://linear.app/threadbare/issue/THR-2053) |
| [THR-1792](https://linear.app/threadbare/issue/THR-1792) seat named and findable | **fixed-confirmed** | The story tester saw "Horseford now circled as my seat". The beat's "Bind a place to yourself" copy misleads ([THR-2057](https://linear.app/threadbare/issue/THR-2057) item 6) |
| [THR-1978](https://linear.app/threadbare/issue/THR-1978) Advanced World Setup has no First | **not-exercised** | All three took New World |
| [THR-1979](https://linear.app/threadbare/issue/THR-1979) five small faults | **not reported** | No rail-card, map-icon, restraint-label or scene-art fault was named |
| [THR-1804](https://linear.app/threadbare/issue/THR-1804) item 3, bonding hand below the fold | **still fixed** | The hand fits. A narrower chapter column crushes its footer instead ([THR-2057](https://linear.app/threadbare/issue/THR-2057) item 3) |
| [THR-1805](https://linear.app/threadbare/issue/THR-1805), [THR-1837](https://linear.app/threadbare/issue/THR-1837), [THR-1801](https://linear.app/threadbare/issue/THR-1801), [THR-1803](https://linear.app/threadbare/issue/THR-1803) | **still fixed** | No opening-gift collision, no panel wall at the bond, no pre-picked step 2, one pool in the footer |
| [THR-1715](https://linear.app/threadbare/issue/THR-1715) autopilot, [THR-1714](https://linear.app/threadbare/issue/THR-1714), [THR-1704](https://linear.app/threadbare/issue/THR-1704), [THR-1707](https://linear.app/threadbare/issue/THR-1707), [THR-1708](https://linear.app/threadbare/issue/THR-1708), [THR-1710](https://linear.app/threadbare/issue/THR-1710), [THR-1600](https://linear.app/threadbare/issue/THR-1600) | **still fixed** (Auto is not the default) | No developer text or raw ids. Two prose seams are new ([THR-2057](https://linear.app/threadbare/issue/THR-2057) items 1-2) |
| Round-1 tickets ([THR-1601](https://linear.app/threadbare/issue/THR-1601), [THR-1602](https://linear.app/threadbare/issue/THR-1602), [THR-1603](https://linear.app/threadbare/issue/THR-1603), [THR-1605](https://linear.app/threadbare/issue/THR-1605), [THR-1606](https://linear.app/threadbare/issue/THR-1606), [THR-1608](https://linear.app/threadbare/issue/THR-1608), [THR-1609](https://linear.app/threadbare/issue/THR-1609)) | **still fixed** | 3/3 met The First |
| [THR-1802](https://linear.app/threadbare/issue/THR-1802), [THR-1705](https://linear.app/threadbare/issue/THR-1705), [THR-1709](https://linear.app/threadbare/issue/THR-1709) | **not-exercised** | |

## New findings (milestone *Cold playtest · round 5*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-2052](https://linear.app/threadbare/issue/THR-2052) | bug, Urgent (recurs THR-1976 / THR-1806 / THR-1715) | On a running clock, Play closes the chapter with no answer (the answering card is off when the clock runs). A First's chapter whose screen was closed without minimising plays out alone, because the engine hold is written only on minimise | 3/3 (story's worst moment, skimmer's quit point) |
| [THR-2053](https://linear.app/threadbare/issue/THR-2053) | bug, High (recurs warm THR-1853) | World-opened chapters skip the arrival holds (`encounter` is not `arrival`), so a tab, the Ledger or a "Needs you" row opens a different chapter | 2/3 |
| [THR-2054](https://linear.app/threadbare/issue/THR-2054) | bug, High | The First's Disposition never reads the bond (it checks whether the god took part in her encounters; it never does), and its wording changes each tick. Agent Thread is not filtered for mortals, so it is offered and charged on The First, with no odds, and "faltered" means a success at a cost | 2/3 (veteran's soft quit) |
| [THR-2055](https://linear.app/threadbare/issue/THR-2055) | bug | Chapters played without the god are recorded as "Unknown — Resolved successfully" (hardcoded `success: true`). The sheet's digest says a lost exchange "was fair enough to hold". The dormant court lists names twice | 1/3 |
| [THR-2056](https://linear.app/threadbare/issue/THR-2056) | bug, High | The map drifts to the right edge after every chapter. The chapter camera centres the place beside the panel and, on close, only nudges it 48 px inside the edge | 3/3 |
| [THR-2057](https://linear.app/threadbare/issue/THR-2057) | bug | Six small faults: "drawn toward The way of Veil calls"; the bond scene calls The First "they"; a crushed chapter footer; a leftover tooltip that eats a click; a paid compulsion labelled "Intimidated"; the seat beat offers a choice it never gives | 1-3/3 each |
| [THR-2058](https://linear.app/threadbare/issue/THR-2058) | design, High (recurs THR-1980, fifth round) | Still unreadable: pools and upkeep, the trend arrows, Attention, the map tabs, the hollow pip, the Scar/Bond/Boon/Path and Slight/Clear/Great legend. Doom, Mandate, Investiture and Rivals arrive together at about minute ten | 3/3 |
| [THR-2059](https://linear.app/threadbare/issue/THR-2059) | design | The path you chose does not steer what comes next: God's Will offers an "unseen blade" chores, and compelled work never reports back | 1/3 |

## Not filed

- **"Hovering 'Cosmic' shows no tooltip" (veteran): tester-error.** It is the Codex detail panel's Scale row (`CodexDetailPanel.tsx:251-259`), wired to `ui.card.scale.cosmic` with a 200 ms delay. Shot `veteran/shots/…09-50-22-285Z` shows the tooltip after the click.
- **"DOOMED with no buttons, 'Nothing here answers to you'" (skimmer): as built, misread.** This is the fate-alone screen for a step with no authored hand (`views/stage/types.ts:941-951`). It has one button, "Stay silent, let fate answer" (`nudge-stage-content.ts:268`). Its forecast is that step's own base odds; step 1's spend does not carry over. The missing result afterwards is in [THR-2052](https://linear.app/threadbare/issue/THR-2052).
- **"'Cut The Thread' cut no tie I could see" (skimmer): as built.** The card grants a hidden mark revealed later (`nudge-card-library.ts:651, 1087-1101`). Its band line exists (`:1444-1449`) but was lost with the chapter result ([THR-2052](https://linear.app/threadbare/issue/THR-2052)).
- **"'Needs you' never clears" (skimmer): as built** (`NeedsYou.tsx:6`, Law 40; News rows kept `NEEDS_YOU_NEWS_KEEP_TICKS`). Folded into [THR-2058](https://linear.app/threadbare/issue/THR-2058) as a direction.
- **"Buying Fated cost 7 of 50 Mind, too cheap" (veteran): opinion, not a fault.** Logged here for the tuning pass; no tester was confused by it.
- **"Time stayed at spring, year 1" (veteran): unverified**, as in round 4. Any open chapter or popup holds the clock, and one was open for most of the run.
- **"Black screen before the world loads" (3/3): unverified.** It is a transition; all three waited it out.
- **"The store page named a swordbearer, a scholar and a refugee" (story):** the brief's frozen pitch (v1). Not the game.

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | — | — |
| veteran | — | — | — | — |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): new evidence for PC-1, PC-2, PC-3, PC-4, PC-5, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 11 min wall clock, $13.36 notional on the subscription plan. Verification used four Explore investigators (about 4-9 min each). Round-2 screenshots pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **The opening holds; the first stretch on the map does not.** For the fourth round running, all three new players bonded a mortal and loved those first scenes. One of them now says "no" because of what follows ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md)).
- **The biggest wall: chapters end without showing what happened, and some play out without the player at all.** One player's First lost a whole chapter alone and came back "Destitute" ([THR-2052](https://linear.app/threadbare/issue/THR-2052), Urgent, ready to build).
- **Three more things players hit.** Popups open over what they clicked ([THR-2053](https://linear.app/threadbare/issue/THR-2053)). The First's own page says she isn't bound to you ([THR-2054](https://linear.app/threadbare/issue/THR-2054)). The map slides to the screen edge after every chapter ([THR-2056](https://linear.app/threadbare/issue/THR-2056)).
- **8 tickets are filed** in the [round-5 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 6 bugs ready to build and 2 for design. Round 6 runs on its own once they are all closed and live. Nothing here needs a decision from you.
