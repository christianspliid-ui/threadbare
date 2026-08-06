---
needsChristian: thr-883-format-session, thr-907-verdict-links-ready, thr-998-risk-word-verdict, thr-961-sound-feel, thr-962-nudge-stage-cues
queue: backed-up
freshness: healthy
deploy: deployed
tasks: ok
lanes: active
---
# Briefing

**Generated:** 2026-08-06 19:00 local (2026-08-06 17:00 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Down to five — your Discord message answered item 6 and closed it.** Nothing new arrived this hour. The five below are the same asks, each re-checked against the live board rather than carried on the last run's word.

**If you have one hour, spend it on item 1.**

### 1. The encounter-writing format session — the cork in the bottle

The one you asked for on 30 July: sit with Fable, write **one** encounter end-to-end, iterate until the format is locked. ([THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format))

Still the **only** urgent item on the whole board, and it holds back more than anything else — **eleven content tickets are parked behind it**, plus four finished capital-city encounters that can't merge until the format is settled. No agent can decide it. It hasn't moved since 2 August.

Two things you flagged when you paused the content work, still unanswered: the prose is *too abstract* even when it passes every automated check (your bar: take the space to explain the reasoning behind the nudge), and the "why it's in the balance" strip is a testing tool wearing a player interface.

**Worth playing the five encounters below first** — they give you concrete examples to point at when you say what's wrong with the register.

### 2. The encounter verdict — five encounters, four rulings

*Ready since Sunday; this is day six.* ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game))

You're ruling on **four** things: does the prose read right, does the firing rhythm feel right, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of them — it closes the question and charters the follow-up.

**Play the five encounters:**

1. [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. [Snow on the Pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
3. [Riders Behind the Caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
4. [A Bargain at the Crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
5. [The Swindled Family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)

**For the firing-rhythm question only** — [press play and let it run](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters).

**The build has not moved since the last brief** — the links still serve `979e6fb8`, the same build the previous brief described. Nothing has shifted under you if you were mid-decision.

### 3. The action cards promise a danger that isn't real

([THR-998](https://linear.app/threadbare/issue/THR-998/the-focused-cards-risk-word-is-computed-from-a-difficulty-that-never))

Every action card tells the player what kind of working they're attempting — *steady*, *uncertain*, or *perilous*. For **85% of the cards a player can actually cast, the word is decorative**: the difficulty is flattened before the dice are rolled, so a "perilous" card and a "steady" card land exactly the same way. Same odds, different adjective.

Found by measurement, not guesswork — 400 runs per case, identical success rates across the whole difficulty range at the two scales covering most of the slot list.

**Two honest fixes, and the choice is a design call rather than a number:**

- **(a) Make the word tell the truth** — compute it from the odds the cast will actually roll. Truthful by construction, and stays truthful as your god grows. The cost: the same card reads differently for different gods, since it now depends on who's casting.
- **(b) Stop printing a risk word where the danger doesn't vary**, and say something else — what scale the working reaches, or what it costs you.

*The grooming lane recommends (b): if the danger genuinely doesn't vary, a danger word is the wrong thing on the card.*

### 4 & 5. Two small sound decisions

Both yes/no, both carried from the orchestrator lane:

- **Where the encounter sounds should play.** They're wired to a screen that has since been replaced — should they move to the new encounter screen? ([THR-962](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it))
- **How those sounds should feel.** A tuning pass on their character. ([THR-961](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail))

## From Christian

**You answered the aftermath question, and it was the one thing that could unblock that ticket.** Your message, 16:04Z:

> There were other modals waiting in the screen. The start modals where you get your first action cards came through. The second step came automatically but not the aftermath. I had to click the notification

**What was done with it:** carried onto [THR-1005](https://linear.app/threadbare/issue/THR-1005) verbatim, with a reading of what it settles. That ticket had been parked since 15:24Z on exactly this question — the session that parked it wrote that an answer "would probably collapse this", then it sat 40 minutes on a channel no working session reads. It is now on the ticket where the next session will find it.

**Why it matters, in plain terms.** Two sessions spent this afternoon trying to make your bug happen and couldn't — but both of them **cleared the screen first**, dismissing the stacked cards before driving an encounter. You didn't. That's the difference, and it's the state one of them had already flagged as the likely cause before accidentally destroying it. Your "the second step came automatically but not the aftermath" also confirms the shape they guessed at: a beat that's already finished holds the door open and the aftermath never gets its turn.

**Nothing is being asked of you here** — this is a report that your two sentences probably saved a session. The repro route is now specific enough to work from.

## Queue

**Backed up — 33 items ready to pick up**, planning still outrunning execution. Two new items joined this afternoon, both from the interface-rules work: one high-priority (a panel showing players raw internal numbers) and one medium (older panels adopting the new rules).

**Everything else on the shelf is low-priority housekeeping.** Six items have gone quiet for a week or more, all low-priority engine and content cleanups — unchanged in character from last week.

**Three items in progress, one of them unowned.** The unowned one is the aftermath ticket above — it was deliberately held open for your answer, which has now landed on it, so it is ready for a session rather than stuck. The other two are yours in name only: the content batch parked on purpose behind item 1, and a small formatting fix whose change is queued to merge.

**One thing needs a working session, not you:** the fix branch for that aftermath ticket has been sitting for an hour and a half set to merge automatically, but its test run is failing rather than pending — so it will never merge on its own. That's a mechanical fact, already recorded on the ticket, and it is an agent's to clear.

## Freshness

**Home tree is current** — on `main`, nothing behind, nothing stranded. Two settings files show local edits, as they have all week, and autosync is provably keeping up regardless. The worktree reaper ran 20 minutes ago and is healthy (38 worktrees, 2 awaiting a human call).

**The live site is serving the newest commit.** Scheduled background jobs all firing on time (9 of 9); automated checks healthy; the lane-silence detector reports normal activity with the early-August pause correctly recognised as deliberate.

## What's moving

Quieter hour than the last. The pickup lane ran at 16:01 and the orchestrator swept at 16:27. Three changes are queued and waiting on their checks: the interface-rules document, a small event-naming fix, and the aftermath fix noted above.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
