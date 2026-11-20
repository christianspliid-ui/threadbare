---
lane: cold-playtest
round: 8
date: 2026-11-20
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 6d8e94fc
usable: 3/3
filed: 7
needsChristian: true
---

# Cold playtest — round 8 (2026-11-20)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open:
- every round-7 issue was closed (milestone 100%), the newest on 2026-11-15;
- `check:deploy` said `deployed`: the live site serves `main` (6d8e94fc);
- 8 days had passed since round 7 (2026-11-12T19:49Z to 2026-11-20T09:50Z);
- the tester login was alive.

Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-8\`. The warm series was not evaluated, because only one round runs per fire.

## Verdicts (round 7 → round 8)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe → **maybe (leaning no)** | y → **y** (Seren) | end of run → **after "Take the Seat"**: a burst of new systems, and the harvest result hidden behind the Seat popup ([THR-2259](https://linear.app/threadbare/issue/THR-2259)) | 11 → 12 | 6 → 8 | 62 | 8 | $4.28 |
| veteran | maybe (leaning yes) → **maybe** | y → **y** (Seren) | none → **soft, action 58**: "the fifth chapter in a row with the same four cards", and Doom and Mandate show no number ([THR-2263](https://linear.app/threadbare/issue/THR-2263), [THR-2262](https://linear.app/threadbare/issue/THR-2262)) | 13 → 15 | 9 → 9 | 58 | 10 | $4.53 |
| skimmer | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Morthane) | none → **about minute 6-7**, after the Jury: an off-centre map and "clearing a notification inbox" ([THR-2260](https://linear.app/threadbare/issue/THR-2260), [THR-2263](https://linear.app/threadbare/issue/THR-2263)) | 15 → 13 | 8 → 8 | 57 | 8 | $4.01 |

**What changed:**
- **The opening holds for the seventh round.** All three bonded a mortal. All three called the bond and the first chapter their best moment ("the store page's promise came true", story; "input, odds, roll and consequence all legible in one screen", veteran; "short, I understood it, and I'd caused it", skimmer).
- **The Mandate now moves.** The story tester saw "Mandate Goal · Rising", and the veteran could say that the mortal's deeds build it. Round 7's wall ([THR-2199](https://linear.app/threadbare/issue/THR-2199)) is down. The next layer: two of three never found the Mandate row, because it arrives in a queue several chapters after the Aftermath first says "raised your Mandate" ([THR-2262](https://linear.app/threadbare/issue/THR-2262)).
- **The verdicts slipped back a notch.** Nobody says no, but two lean no again (round 7 had one leaning yes). The new wall is pace: after the opening, chapters arrive back to back and players stop feeling like a god (3/3, [THR-2263](https://linear.app/threadbare/issue/THR-2263)).
- **Lost chapters still read as wins** (3/3): "Seren lost" next to "reputation rose" ([THR-2257](https://linear.app/threadbare/issue/THR-2257)).

## Earlier findings

| Ticket | Status in round 8 | Note |
|---|---|---|
| [THR-2199](https://linear.app/threadbare/issue/THR-2199) / [THR-2236](https://linear.app/threadbare/issue/THR-2236) the Mandate never moves | **fixed-confirmed** | "Fixed when" met: the story tester saw "Mandate Goal · Rising", and deed rows ("Seren's deed raised your Mandate in Time") showed for 2/3. Its row arriving late is new: [THR-2262](https://linear.app/threadbare/issue/THR-2262) |
| [THR-2195](https://linear.app/threadbare/issue/THR-2195) the bond scene opens clipped | **fixed-confirmed** | 3/3 read the bond scene from its first line; no one reported a cut-off opening |
| [THR-2196](https://linear.app/threadbare/issue/THR-2196) The First's first chapter contradicts itself | **fixed-confirmed** for the handless chapter and the Fellowship template; **recurred in a wider form** for reputation on a loss (3/3) | The same fault runs through 49 two-step templates. Filed [THR-2257](https://linear.app/threadbare/issue/THR-2257) |
| [THR-2197](https://linear.app/threadbare/issue/THR-2197) / [THR-2151](https://linear.app/threadbare/issue/THR-2151) popups open under the player's hand; the answer opens first | **recurred** (2/3) | The Seat lands on top of a chapter's answer, and an armed card does not hold arrivals. Filed [THR-2259](https://linear.app/threadbare/issue/THR-2259) |
| [THR-2198](https://linear.app/threadbare/issue/THR-2198) four small faults | **fixed-confirmed** for item 4 (no one asked about a pink ring); items 1-3 **not-exercised** | No tester opened a sheet section that would show them |
| [THR-2200](https://linear.app/threadbare/issue/THR-2200) / [THR-2214](https://linear.app/threadbare/issue/THR-2214) the path doesn't steer | **inconclusive, carried** | No tester named a chapter that clashed with the path. The skimmer said Morthane's errands on the map ("foraging, setting an arm, counting coins") felt nothing like an assassin, but those are idle errands, not drawn chapters. The story tester asked whether "Healer of the Many" applied |
| [THR-2056](https://linear.app/threadbare/issue/THR-2056) the map drifts to the screen edge after a chapter | **recurred** (3/3) | It came back when [THR-2221](https://linear.app/threadbare/issue/THR-2221) stopped the Stage moving the camera back. Filed [THR-2260](https://linear.app/threadbare/issue/THR-2260) |
| [THR-2142](https://linear.app/threadbare/issue/THR-2142) item 1, setup screens with no cue to go on | **recurred on one screen** (1/3) | The hunger screen still shows only "Choose again": [THR-2261](https://linear.app/threadbare/issue/THR-2261) item 3 |
| [THR-2146](https://linear.app/threadbare/issue/THR-2146) card tags | **carried** | The skimmer again lists "Bargain / Long game / Insurance / Compulsion / Mercy" under never-understood (1/3, no hover in the log). Stays in PC-1 |
| [THR-2060](https://linear.app/threadbare/issue/THR-2060) one arrival per chapter | **works for rows; chapters themselves are not paced** | Filed [THR-2263](https://linear.app/threadbare/issue/THR-2263) (design) |
| [THR-2137](https://linear.app/threadbare/issue/THR-2137) Agent Thread finds no one | **not-exercised** | The veteran was told to bind more mortals with Agent Thread but did not cast it |
| [THR-1978](https://linear.app/threadbare/issue/THR-1978) Advanced World Setup | **not-exercised** | All three took New World |
| Round 1-6 tickets | **still fixed** | 3/3 met The First; no raw ids; no autopilot; chapters answer on screen |

## New findings (milestone *Cold playtest · round 8*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-2257](https://linear.app/threadbare/issue/THR-2257) | bug, High | A lost two-step chapter nets a step-1 reputation gain against a smaller step-2 loss, so "lost" sits over "reputation rose", against the "At Stake" line (`reputationAftermathFold.ts`; 49 templates) | 3/3 |
| [THR-2258](https://linear.app/threadbare/issue/THR-2258) | bug, High | Aftermath rows say the wrong thing: a gift won on a lost step reads as a SCAR and links to "Unknown" (`aftermathWords.ts:914`, `:920`); a strong Mandate deed says "far" beside one ▲; one item's help is listed twice | 1-2/3 (the veteran's worst moment) |
| [THR-2259](https://linear.app/threadbare/issue/THR-2259) | bug, High (recurs THR-2197) | "Take the Seat" lands on top of a chapter's answer and hides its Aftermath; an armed card does not hold arrivals | 2/3 (the story tester's quit point) |
| [THR-2260](https://linear.app/threadbare/issue/THR-2260) | bug (recurs THR-2056) | After a chapter closes, the map sits off to one side: the Stage's pan is never undone and nothing clamps the pan (`useStageCamera.ts:142`, `:154-173`) | 3/3 |
| [THR-2261](https://linear.app/threadbare/issue/THR-2261) | bug | Five small faults: a "✦✦✦✦✦✦⋯" price with no number, meeting cards labelled by the wrong axis words, a hunger screen with only "Choose again", the carousel's left arrow, and "toward the open road" on every Plant an Urge | 1/3 each |
| [THR-2262](https://linear.app/threadbare/issue/THR-2262) | design, High | The Mandate is named in Aftermaths and on cards long before its row is revealed (an opening-reveal queue behind Doom), so 2/3 never found it | 3/3 |
| [THR-2263](https://linear.app/threadbare/issue/THR-2263) | design | Chapters open 2.5 s after the last click, so the player never gets a turn on the map between them | 3/3 (two quit points) |

## Not filed

- **"Hovering the Doom meter gave nothing" (veteran): unverified.** `DoomBar` has a hover tooltip (`DoomBar.tsx:101-105`). While a chapter is open the click is locked (`aria-disabled`, THR-1814) and the tooltip says "Opens when this chapter closes." It most likely missed the hover delay. Its missing number is deliberate (THR-1424, Law 13).
- **"Centre on my First didn't do anything; Home did" (skimmer): unverified.** Both run the same `centre_first` command (`GameMap.tsx:198-225`). It is carried on [THR-2260](https://linear.app/threadbare/issue/THR-2260) as a check to run.
- **"Clicking Seren in the Threads list opened an event" (veteran): tester error.** The row opens her Inspector page (`ThreadsPanel.tsx:583`); its Encounter/Moment/Notice badges open their own events, so the tester most likely clicked a badge. That the full sheet is reachable only through the champion chip is a discoverability note for PC-1.
- **"Pool max went from 35 to 40 after binding Seren" (veteran): as built** (the limit's parts are named on hover, THR-2148).
- **"Piercing Gaze cost 5 Life and showed me a single sentence" (story): as built** (THR-2142: its reply is a Chronicle line).
- **"Repertoire cards show no odds dots" / "Read the Pattern said not this roll" (veteran, skimmer): as built.** Those cards change later draws or soften failure, and their text says so.
- **"Two-step chapters ran a step without me" (skimmer): as built.** "Step 1 held" marks a step that played on a running clock (THR-2174's "theirs alone" words).
- **"Seren got Eye ▲▲, but Eye isn't in her Prowess list" (veteran): unverified.** It could not be checked without the sheet snapshot. Carried.
- **"Your court is a High House / an abyss" (veteran, skimmer): as built** (the court form comes from the origin). It joins PC-1's vocabulary list.
- **"The Commune with the Stars Aftermath gave me a receipt, not a story" (story's worst moment): carried for design.** It is the same complaint as THR-1860 (the Aftermath leads with the ledger). The reputation part is [THR-2257](https://linear.app/threadbare/issue/THR-2257).

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | reached | — |
| veteran | — | — | — | — |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): round-8 evidence for PC-1, PC-2, PC-3, PC-4, PC-5, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 10 min wall clock, $12.82 notional on the subscription plan. Verification used four Explore investigators, about 3-5 min each. Round-5 screenshots were pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **The opening holds for the seventh round.** All three new players bonded a mortal and called it their best moment. Nobody said no, but two now lean no ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-8.md)).
- **Round 7's goal wall is down:** the Mandate bar now rises when your mortal acts. But two of three players never saw the bar, because it appears several chapters after the game first says "raised your Mandate" ([THR-2262](https://linear.app/threadbare/issue/THR-2262), for design).
- **The new wall is pace.** After the opening, chapters arrive one after another with no moment on the map in between: "I started feeling like I was clearing a notification inbox" ([THR-2263](https://linear.app/threadbare/issue/THR-2263), for design).
- **Losing still reads as winning:** a lost chapter shows reputation rising ([THR-2257](https://linear.app/threadbare/issue/THR-2257)). A popup also hides a chapter's result, and the map slides off to one side after each chapter ([THR-2259](https://linear.app/threadbare/issue/THR-2259), [THR-2260](https://linear.app/threadbare/issue/THR-2260)).
- **7 tickets are filed** in the [round-8 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 5 bugs ready to build and 2 for design. Round 9 runs on its own once they are closed and live. Nothing here needs a decision from you.
