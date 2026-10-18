---
lane: cold-playtest
round: 4
date: 2026-10-18
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 07a83918
usable: 3/3
filed: 7
needsChristian: true
---

# Cold playtest — round 4 (2026-10-18)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open: all 9 round-3 tickets were closed, `main` (07a83918) was live and settled (newest close 2026-10-13), 8 days had passed since round 3, and the tester login was alive. Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-4\`. The warm series was not evaluated: one round per fire, and the warm round-2 milestone is still open.

## Verdicts (round 3 → round 4)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Elara) | 61 → **none tagged** (the debrief names the dead Play button in "The Page Beneath the Saint", [THR-1976](https://linear.app/threadbare/issue/THR-1976)) | 13 → 14 | 8 → 7 | 60 | 9 | $4.44 |
| veteran | maybe (leaning yes) → **maybe (leaning yes)** | y → **y** (Egrunkoegr, bound by a map cast, not Meet The First — see [THR-1978](https://linear.app/threadbare/issue/THR-1978)) | none → **none** (near-quit: a second silent cast, [THR-1977](https://linear.app/threadbare/issue/THR-1977)) | 12 → 14 | 7 → 8 | 68 | 10 | $3.66 |
| skimmer | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Morthane) | none → **47**: two map chapters ended with no visible result ([THR-1976](https://linear.app/threadbare/issue/THR-1976)) | 13 → 11 | 11 → 6 | 47 | 9 | $3.42 |

**What changed:**
- **Verdicts held.** The veteran stays at "leaning yes"; story and skimmer stay at "leaning no".
- **Best moment, again, 3/3:** the bonding scenes and the first chapters ("They straighten up and say yes before you have asked anything" was quoted by two testers). The veteran's best moment was a map-bound mortal's first chapter, so the chapter engine carries even without the meeting.
- **The wall is the same place as round 3, sharper:** on the main map a chapter's Play button takes the choice and nothing answers. Round 3's fix for that chapter made it priceable; round 4 found the commit itself never moves the screen on.
- **The opposite-trait miss now reads.** The skimmer worked out leans on their own: *"That one clicked eventually."*
- **The veteran took "Advanced World Setup"** from the title screen and spent about 40 actions in a world with no First.

## Earlier findings

| Ticket | Status in round 4 | Note |
|---|---|---|
| [THR-1800](https://linear.app/threadbare/issue/THR-1800) chapter with unpriced choices can't be played | **recurred** (new cause) | The cards now price 2/0 and the button is live, but Play on the authored-choice step never answers. Filed [THR-1976](https://linear.app/threadbare/issue/THR-1976), Urgent |
| [THR-1806](https://linear.app/threadbare/issue/THR-1806) main-map chapters end out of sight | **recurred** | Its fix (THR-1812) put the answering card in a commit handler that has no callers. Same ticket, [THR-1976](https://linear.app/threadbare/issue/THR-1976) |
| [THR-1807](https://linear.app/threadbare/issue/THR-1807) can't read spend or risk | **recurred** (fourth round) | Its "Fixed when" bar was missed: 2/3 still list the sphere pour. The opposite-trait miss is fixed-confirmed. Filed [THR-1980](https://linear.app/threadbare/issue/THR-1980); the picker portraits moved to [THR-1981](https://linear.app/threadbare/issue/THR-1981) |
| [THR-1805](https://linear.app/threadbare/issue/THR-1805) opening gifts open over the player's click | **fixed-confirmed** | Story and skimmer passed the opening gifts; neither reported a popup replacing what they clicked |
| [THR-1808](https://linear.app/threadbare/issue/THR-1808) / [THR-1837](https://linear.app/threadbare/issue/THR-1837) ~30 panels arrive at once | **fixed-confirmed** (the wall) | Story now describes "eight numbers and two side panels", not a wall. The words those panels use are in [THR-1980](https://linear.app/threadbare/issue/THR-1980) |
| [THR-1801](https://linear.app/threadbare/issue/THR-1801) step 2 pre-picks step 1's cards | **fixed-confirmed** | Story reached step 2 (snapshot 08:57:28) with nothing pre-picked |
| [THR-1803](https://linear.app/threadbare/issue/THR-1803) footer sums every pool | **fixed-confirmed** | The authored-choice footer reads "◆ 44 Energy essence", one pool |
| [THR-1804](https://linear.app/threadbare/issue/THR-1804) five small faults | **partly confirmed** | Item 3 (bonding hand below the fold): all seven cards fit at 1920×1080 (`story/shots/page-…08-51-53-248Z.png`). Items 1 and 4: not reported. Items 2 and 5: not exercised |
| [THR-1802](https://linear.app/threadbare/issue/THR-1802) God's Will options name no activity | **not-exercised** | |
| [THR-1712](https://linear.app/threadbare/issue/THR-1712) scene art by index | **fixed** (index) / new cause | Art is now chosen by content, but a keyword tie painted a burning village behind a plague scene. Filed as [THR-1979](https://linear.app/threadbare/issue/THR-1979) item 5 |
| [THR-1716](https://linear.app/threadbare/issue/THR-1716) setup takes ~3 minutes of pictures | **recurred** (setup half) | The skimmer nearly quit in setup. Folded into [THR-1981](https://linear.app/threadbare/issue/THR-1981) |
| [THR-1715](https://linear.app/threadbare/issue/THR-1715), [THR-1714](https://linear.app/threadbare/issue/THR-1714), [THR-1704](https://linear.app/threadbare/issue/THR-1704), [THR-1707](https://linear.app/threadbare/issue/THR-1707), [THR-1708](https://linear.app/threadbare/issue/THR-1708), [THR-1710](https://linear.app/threadbare/issue/THR-1710), [THR-1600](https://linear.app/threadbare/issue/THR-1600) | **still fixed** | No autopilot, the HELPS/HINDERS lines read, no developer text or raw `{name}` in any snapshot |
| [THR-1705](https://linear.app/threadbare/issue/THR-1705), [THR-1709](https://linear.app/threadbare/issue/THR-1709) | **not-exercised** | |
| Round-1 tickets ([THR-1601](https://linear.app/threadbare/issue/THR-1601), [THR-1602](https://linear.app/threadbare/issue/THR-1602), [THR-1603](https://linear.app/threadbare/issue/THR-1603), [THR-1605](https://linear.app/threadbare/issue/THR-1605), [THR-1606](https://linear.app/threadbare/issue/THR-1606), [THR-1608](https://linear.app/threadbare/issue/THR-1608), [THR-1609](https://linear.app/threadbare/issue/THR-1609)) | **still fixed** on New World | Both New World testers met The First. The Advanced World Setup link is a second front door with no First ([THR-1978](https://linear.app/threadbare/issue/THR-1978)), in the spirit of THR-1601's dev-surface leak |

## New findings (milestone *Cold playtest · round 4*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-1976](https://linear.app/threadbare/issue/THR-1976) | bug, Urgent (recurs THR-1800 + THR-1806) | A chapter's Play button takes the choice and answers nothing: the veil calls the bare commit handler, the THR-1812 answering card sits in a handler with no callers, and each press of a paid choice charges again | 2/3 (story's worst moment, skimmer's quit point) |
| [THR-1977](https://linear.app/threadbare/issue/THR-1977) | bug, High | Observe and Bind Thread are priced "Energy · 5 / 10 essence" but cast free (no sphere on the template), and nothing says the bind is under way | 1/3 (veteran's near-quit) |
| [THR-1978](https://linear.app/threadbare/issue/THR-1978) | bug, High | "Advanced World Setup" on the title screen starts a run with no First; Meet The First needs an identity that path never creates | 1/3 (veteran) |
| [THR-1979](https://linear.app/threadbare/issue/THR-1979) | bug | Five small faults: rail card names differ from the gift's, a rail card opens the Codex, map icons hide after a rebuild, a restraint choice labelled "lend strength", a plague scene painted as a burning village | 1/3 each |
| [THR-1980](https://linear.app/threadbare/issue/THR-1980) | design, High (recurs three times) | Terms still unreadable: the sphere pour (every pool still 50), the odds legend, grey Fated, Attention / Dominion / Elder powers, Chronicle tier jargon | 3/3 |
| [THR-1981](https://linear.app/threadbare/issue/THR-1981) | design | The opening picks are blind: nameless portraits at rest (deliberate in THR-1807's plan), a path pick never mentioned again, ~3 minutes of unlabelled pictures | 2/3 |
| [THR-1982](https://linear.app/threadbare/issue/THR-1982) | design | Chapters forget who The First is: a herb-healer gets a smithing-guild trial and an archivist's chapter; The First carries no role for chapter scoring | 2/3 |

## Not filed

- **"The canon outcome was the option I didn't want" (story): tester-error, explained.** The tester pressed Play on the free option, then on the paid one to test the button. `upsertChoiceHistory` (`encounterChoiceMemory.ts:99-106`) is last-write-wins, so the paid choice was recorded. The underlying fault is in [THR-1976](https://linear.app/threadbare/issue/THR-1976).
- **"Time was frozen at spring, year 1" (veteran, skimmer): unverified.** The calendar advances every tick (`orchestrator.ts:3069-3070`) and nothing holds it until the bond. Both testers had a chapter or popup open for most of their run, and any open interrupt holds the clock (`interruptRegistry.ts:362,372`).
- **"The bind resolved a season later" (veteran): unverified.** The Agent Thread step lasts one tick (`unified-action-templates.ts:5597`) and the Rite is queued the same tick. The missing pending line is in [THR-1977](https://linear.app/threadbare/issue/THR-1977).
- **"Clicking Cast with no card selected does nothing" (veteran): as built.** The button is disabled with a dim "Choose a card." hint (`ActionDrawer.tsx:253, 399, 410-420`). Same as round 3's tester-error.
- **"Spending 5 essence didn't move Doomed" (skimmer): as built.** Within-tier movement is invisible; folded into [THR-1980](https://linear.app/threadbare/issue/THR-1980).
- **"Black screen before the world loads" (story, skimmer): unverified.** A transition; both waited it out. No snapshot shows a stuck state.
- **"The middle portrait runs off the bottom" (story): not a fault.** The portrait ends at about 1065 px of 1080 (`story/shots/page-…08-51-36-167Z.png`); nothing is cut off.
- **"Store page said turn-based" and "four unlabeled sliders" (veteran, Advanced setup)**: the first is the brief's pitch (frozen at v1); the second is on the Advanced path that [THR-1978](https://linear.app/threadbare/issue/THR-1978) takes out of a new player's way.

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | — | — |
| veteran | — | — | — | reached |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): new evidence for PC-1, PC-2, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 10 min wall clock, $11.52 notional on the subscription plan. Verification used three Explore investigators (about 3–5 min each). Round-2 dry-run screenshots pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **Holding steady.** All three new players again bonded a mortal and again named those first scenes the best part. One still leans toward "yes, I'd keep playing" ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-4.md)).
- **The main-map wall is still there, and now we know why.** When a player picks a choice in a chapter and presses Play, the game records it but the screen never moves on, so it looks broken. One tester quit there ([THR-1976](https://linear.app/threadbare/issue/THR-1976), Urgent, ready to build).
- **Two smaller surprises.** Two map spells cost nothing despite their price tag ([THR-1977](https://linear.app/threadbare/issue/THR-1977)). The "Advanced World Setup" link on the title screen starts a game with no First to meet ([THR-1978](https://linear.app/threadbare/issue/THR-1978)).
- **7 tickets are filed** in the [round-4 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 4 bugs ready to build, 3 for design. Round 5 runs on its own once they are all closed and live. Nothing here needs a decision from you.
