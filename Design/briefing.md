---
needsChristian: thr-883-format-session, thr-907-verdict-links-ready, thr-998-risk-word-verdict, thr-961-sound-feel, thr-962-nudge-stage-cues, thr-1005-repro-question
queue: backed-up
freshness: healthy
deploy: deployed
tasks: ok
lanes: active
---
# Briefing

**Generated:** 2026-08-06 16:55 local (2026-08-06 14:55 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One new question this hour, and it's a short one — item 6.** The other five are the same asks, each re-checked against the live board rather than carried on the last run's word.

**If you have one hour, spend it on item 1. If you have two minutes, answer item 6** — it unblocks a fix that's currently half-finished for want of one detail only you have.

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

**The build moved this afternoon, and one of your instructions is now out of date.** The links serve `979e6fb8`. **The five encounters themselves are untouched** — not one word of their prose changed, so if you were mid-decision, nothing has shifted under you. What *did* change is the aftermath — the screen after a hand resolves, the one you were told to ignore because it was a building site. Three fixes landed there in the last two hours: it now says which encounter you just played, its result chips read as words with pictures instead of raw numbers and internal names, and it tries to appear on its own. **You can look at it now if you want to. You still don't have to** — it isn't part of this verdict, and item 6 says it may still not appear reliably.

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

### 6. NEW — what were you doing when the aftermath didn't appear?

You reported that the aftermath screen doesn't pop up on its own — you have to click the badge to get to it. Someone spent this afternoon on it ([THR-1005](https://linear.app/threadbare/issue/THR-1005)) and found **a** real bug on that path: one stale leftover could block every beat queued behind it, forever. That's fixed and shipped.

**But they could not make your symptom happen.** Four different setups on the same world — one-step encounter, three-step encounter, veil closed mid-way, everything forced to pause — and in all four the aftermath appeared by itself, both with and without the fix. So the fix is hardening, not a confirmed cure, and the ticket is deliberately still open rather than being called done.

One question would probably settle it:

> **When the aftermath failed to appear — was it an encounter you had been clicking through step by step, or one that finished while you were looking somewhere else on the map? And were there other cards or beats stacked up on screen at the time, waiting to be dismissed?**

The reason it matters: another session hit the same failure this morning and their world looked *different* from every reconstruction — the aftermath had been made and parked with nothing pointing at it, and they had beat cards stacked up unread. If that's your situation too, the bug is in a different place entirely and the search moves upstream. If it isn't, it's somewhere else again. Either answer saves a session.

## Queue

**Backed up — 32 items ready to pick up**, planning still outrunning execution. Two items came *off* the shelf this afternoon rather than joining it, which is the right direction.

**The queue is back to being entirely low-priority housekeeping.** All three of this morning's high-priority aftermath tickets are now built and merged — that's the work you split out of the verdict session, specified this morning and shipped by this afternoon.

**Two items in progress, no unowned parks** (ninth consecutive hour at zero). One is the format hold you already decided (THR-860, parked on purpose behind item 1 — no action needed); the other is the aftermath ticket in item 6, deliberately held open for your answer. **Seven items have gone quiet for a week or more**, all low-priority engine and content cleanups; unchanged in character from last week.

## Freshness

**Home tree is current** — on `main`, nothing behind, nothing stranded. Two settings files show local edits, as they have all week, and autosync is provably keeping up regardless. The worktree reaper ran 15 minutes ago and is healthy (37 worktrees, 2 awaiting a human call).

**The live site is serving the newest commit.** Scheduled background jobs all firing on time (9 of 9); automated checks healthy; nothing is stuck waiting to merge.

**The pause detector from the 3–5 August silence is now live.** It merged this afternoon, so a repeat of that window would be caught within hours instead of at the next weekly review — and because you have a way to mark a pause as deliberate, a planned one won't set off any alarms.

## What's moving

Busy two hours. Three aftermath fixes shipped (the screen now names its encounter, reads its results as words rather than raw numbers, and attempts to appear unprompted), plus the pause-versus-outage detector. The pickup lane ran at 14:01 and the orchestrator swept at 14:27, promoting one small formatting defect.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
