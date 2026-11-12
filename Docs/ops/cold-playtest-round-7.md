---
lane: cold-playtest
round: 7
date: 2026-11-12
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 0a999d5b
usable: 3/3
filed: 6
needsChristian: true
---

# Cold playtest — round 7 (2026-11-12)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open:
- every round-6 issue was closed (milestone 100%), the newest on 2026-11-04;
- `check:deploy` said `deployed`: the live site serves `main` (0a999d5b);
- 10 days had passed since round 6 (2026-11-02T09:50Z to 2026-11-12T19:49Z);
- the tester login was alive.

Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-7\`. The warm series was not evaluated, because only one round runs per fire.

## Verdicts (round 6 → round 7)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) → **maybe** | y → **y** (Seren) | end of run → **end of run (LOST)**: the Mandate bar is empty after five chapters, and nothing says what fills it ([THR-2199](https://linear.app/threadbare/issue/THR-2199)) | 14 → 11 | 7 → 6 | 61 | 8 | $4.17 |
| veteran | maybe → **maybe (leaning yes)** | y → **y** (Seren) | none → **none**; closest was the setup run before the sphere screen ("show me a number") | 11 → 13 | 8 → 9 | 50 | 7 | $3.43 |
| skimmer | no → **maybe (leaning no)** | y → **y** (Morthane) | ~minute 7 → **none written; soft at the Jury Aftermath** plus a burst of feud toasts: "I still couldn't tell whether anything I did moved my actual goal" ([THR-2199](https://linear.app/threadbare/issue/THR-2199)) | 12 → 15 | 9 → 8 | 75 | 8 | $4.76 |

**What changed:**
- **The best verdict yet: no tester says no.** It is three "maybe"s, one leaning yes. The skimmer moved up from "no" for the first time in six rounds.
- **The opening holds for the sixth round.** All three bonded a mortal. Best moments: story, *"Seren will not be famous. Seren will be here."*; skimmer, choosing Morthane (*"you will not meet them again"*); veteran, the Aftermath ledger, *"the first time I could see cause → effect → stat change."*
- **Round 6's walls are gone.** No tester said a chapter ended with nothing on screen ("The world turns. The answer comes here." worked as built). Nobody hit "Agent Thread can't touch anyone", the Aftermath/sheet disagreement, a below-the-fold Play, or the armed card walking away.
- **The new wall is the goal.** The Mandate row now says "Filled by what you and the one mortal bound to you raise in Life and Spirit", but the mortal's deeds never feed it, so it reads "Holding —" at zero (3/3).
- **The bond scene, everyone's favourite, opens cut off at the top** with no way to scroll up (3/3, a layout bug).

## Earlier findings

| Ticket | Status in round 7 | Note |
|---|---|---|
| [THR-2136](https://linear.app/threadbare/issue/THR-2136) / [THR-2151](https://linear.app/threadbare/issue/THR-2151) a chapter step answers nothing on a running clock | **fixed-confirmed** | The skimmer saw "Stayed silent. The world turns. The answer comes here." and then step 2 in place. The veteran: "the world has to tick forward before the answer comes", read correctly |
| [THR-2137](https://linear.app/threadbare/issue/THR-2137) Agent Thread finds no one | **not-exercised** | Agent Thread sat in the hand; no tester cast it |
| [THR-2138](https://linear.app/threadbare/issue/THR-2138) / [THR-2154](https://linear.app/threadbare/issue/THR-2154) / [THR-2155](https://linear.app/threadbare/issue/THR-2155) no way forward after the first follower | **recurred in a new form** (3/3) | The row now counts "the one mortal bound to you", which is fixed. But it promises the mortal's deeds fill the bar, and the ledger never credits them. Filed [THR-2199](https://linear.app/threadbare/issue/THR-2199) (design) |
| [THR-2139](https://linear.app/threadbare/issue/THR-2139) the Aftermath and the sheet disagree | **fixed-confirmed** for its five items | A new contradiction inside one Aftermath ("lost" next to "Seren is a Fellow") is a content bug in one template: [THR-2196](https://linear.app/threadbare/issue/THR-2196) |
| [THR-2140](https://linear.app/threadbare/issue/THR-2140) Play below the fold, a second click clears the choice, a handless step stops the world | **fixed-confirmed** | No tester hit any of the three on the chapter screen. The bond scene has its own clipping bug: [THR-2195](https://linear.app/threadbare/issue/THR-2195) |
| [THR-2141](https://linear.app/threadbare/issue/THR-2141) the armed card does not hold the clock | **fixed-confirmed** | No targets walked out from under an armed card. "The map moved under my mouse" (skimmer) is unverified, see Not filed |
| [THR-2142](https://linear.app/threadbare/issue/THR-2142) six small faults | **fixed-confirmed** | The setup screens show "Moving on" with a filling bar (story: "nice"). The bond row reads "What Seren is to you". A sibling label, "Disposition toward her", was missed: [THR-2198](https://linear.app/threadbare/issue/THR-2198) item 1 |
| [THR-2143](https://linear.app/threadbare/issue/THR-2143) / [THR-2148](https://linear.app/threadbare/issue/THR-2148) / [THR-2149](https://linear.app/threadbare/issue/THR-2149) can't read spend or growth | **fixed-confirmed** on the cap; rates stay words as decided | Pools now read "40 / 55". The veteran still asked for an upkeep number. The THR-2143 design pass (with Christian's 2026-11-02 answer) kept rates as words, so this is not re-filed |
| [THR-2144](https://linear.app/threadbare/issue/THR-2144) / [THR-2156](https://linear.app/threadbare/issue/THR-2156) the path steers by skill, not story | **recurred** (2/3, third round) | A Uniter weighs thief jobs; an Unseen Blade is put into a jury. Filed [THR-2200](https://linear.app/threadbare/issue/THR-2200) (design) |
| [THR-2146](https://linear.app/threadbare/issue/THR-2146) / [THR-2147](https://linear.app/threadbare/issue/THR-2147) card tags and price circles | **fixed-confirmed** for price circles | The skimmer still lists "Bargain / Long game / Compulsion / Boost" under never-understood. That is 1/3, with no tooltip check in the log, so it is carried forward |
| [THR-2060](https://linear.app/threadbare/issue/THR-2060) one arrival per chapter | **partly exercised** | The story tester felt "five new systems arrived at once (Doom, Trouble, News, Seat, Mandate)". The arrival timing is part of [THR-2197](https://linear.app/threadbare/issue/THR-2197) |
| [THR-1978](https://linear.app/threadbare/issue/THR-1978) Advanced World Setup | **not-exercised** | All three took New World |
| Round 1-5 tickets ([THR-1601](https://linear.app/threadbare/issue/THR-1601) … [THR-2068](https://linear.app/threadbare/issue/THR-2068)) | **still fixed** | 3/3 met The First; no raw ids; no autopilot |

## New findings (milestone *Cold playtest · round 7*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-2195](https://linear.app/threadbare/issue/THR-2195) | bug, High | The bond scene's opening prose is clipped above the viewport and cannot be scrolled to (`BondBeat.tsx:147`, centred flex column overflowing upward) | 3/3 |
| [THR-2196](https://linear.app/threadbare/issue/THR-2196) | bug, High | The First's first chapter contradicts itself: a failed Fellowship test ends on "Seren is a Fellow" and grants reputation, the chapter has no hand so it plays out alone, and the meeting's smith's apprentice is bonded as a Shrine-keeper | 1/3 (story) |
| [THR-2197](https://linear.app/threadbare/issue/THR-2197) | bug | Popups still open under the player's hand: six world-pushed kinds lack an arrival hold, and the quiet window counts only clicks and keys, not hover or scroll | 2/3 |
| [THR-2198](https://linear.app/threadbare/issue/THR-2198) | bug | Four small faults: "Disposition toward her", "said to be waiting on because", "The Call" saying "The First … they" after four chapters, a pink ring with no hover line | 1-2/3 each |
| [THR-2199](https://linear.app/threadbare/issue/THR-2199) | design, High | The Mandate bar promises the mortal's deeds fill it, but the ledger never credits them, so it stays "Holding —" at zero | 3/3 (story's quit point) |
| [THR-2200](https://linear.app/threadbare/issue/THR-2200) | design (recurs THR-2144) | The chosen path still doesn't steer: it is a ×1.5 lean on encounters only, and the role lean outranks it | 2/3 |

## Not filed

- **"Step 2 of the Jury resolved by itself and failed without my seeing its cards" (skimmer): tester error.** Snapshots `19-53-52` to `19-54-01` show step 2 on screen ("2 of 2", "Step 1 held. You: …"). The tester picked an option and pressed Continue (log action ~147-148). The Aftermath's "your cards were on another step" is accurate.
- **"Three of the Emergence Dilemma's four options were greyed out" (skimmer): as built.** Each disabled option shows its reason ("This outcome cannot be claimed — the ruin was only marked"). The dilemma opening uninvited is in [THR-2197](https://linear.app/threadbare/issue/THR-2197).
- **"Pool max went from 50 to 55 after Seren was bound, I don't know why" (veteran): as built, not hovered.** The row reads "50 / 55", and its hover names the parts of the limit (THR-2148).
- **"Leans: where can I see them?" (story, veteran): as built.** The sheet's Nature row shows "leaning Loyal · leaning Guiding · leaning Perceptive" (story snapshot `19-55-58`). It is a discoverability question for PC-1 and has no fault to fix.
- **"The map shifted and the tokens moved under my mouse" (skimmer): unverified.** No armed card was held. The clock was running, so mortals moved, and map follow mode has no caller. No re-centre could be located.
- **"Piercing Gaze from the sheet did nothing visible" (skimmer): unverified.** Since THR-2142 its reply is a Chronicle line, or the card locks when nothing is left to reveal. The log does not show which applied.
- **The setup choices show no numbers (veteran's worst moment): carried forward.** The picks are deliberately prose (THR-1981). This is logged for the design lane, not filed.
- **"The robbery mystery was never answered" (story): content opinion.** Logged.
- **"Your court is a Circle / an abyss" (story, skimmer): as built** (the court form is picked from the origin). It joins PC-1's vocabulary list.

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | — | — |
| veteran | — | — | — | — |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): round-7 evidence for PC-3, PC-4, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 9 min wall clock, $12.36 notional on the subscription plan. Verification used three Explore investigators, about 3-7 min each. Round-4 screenshots were pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **Best round so far: nobody said no.** All three new players bonded a mortal for the sixth round running. For the first time the lunch-break player moved from "no" to "maybe" ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-7.md)).
- **Round 6's walls are gone.** Chapters now answer on screen, and the results screen and the mortal's page agree.
- **The new wall is the god's goal.** Its bar says your mortal's deeds fill it, but they never do, so after five chapters it still shows nothing. All three players were stuck on "am I winning?" ([THR-2199](https://linear.app/threadbare/issue/THR-2199), for design).
- **The bonding scene, everyone's favourite, opens cut off at the top** and cannot be scrolled up ([THR-2195](https://linear.app/threadbare/issue/THR-2195), ready to build).
- **6 tickets are filed** in the [round-7 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 4 bugs ready to build and 2 for design. Round 8 runs on its own once they are closed and live. Nothing here needs a decision from you.
