---
needsChristian: thr-883-format-session, thr-907-verdict-links-ready, thr-998-risk-word-verdict, thr-961-sound-feel, thr-962-nudge-stage-cues
queue: backed-up
freshness: healthy
deploy: deployed
tasks: ok
---
# Briefing

**Generated:** 2026-08-06 12:54 local (2026-08-06 10:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing new this hour, and nothing answered.** The same five items, each re-checked against the live board rather than carried on the last run's word. If you read the 10:50 brief, you already know this list.

**If you have one hour, spend it on item 1. If you have ten minutes, spend them on item 2.**

### 1. The encounter-writing format session — the cork in the bottle

The one you asked for on 30 July: sit with Fable, write **one** encounter end-to-end, iterate until the format is locked. ([THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format))

Still the **only** urgent item on the whole board, and it holds back more than anything else — **eleven content tickets are parked behind it**, plus four finished capital-city encounters that can't merge until the format is settled. No agent can decide it. It hasn't moved since 2 August.

Two things you flagged when you paused the content work, still unanswered: the prose is *too abstract* even when it passes every automated check (your bar: take the space to explain the reasoning behind the nudge), and the "why it's in the balance" strip is a testing tool wearing a player interface.

**Worth playing the five encounters below first** — they give you concrete examples to point at when you say what's wrong with the register.

### 2. The encounter verdict — five encounters, four rulings

*Ready since Sunday; this is day six.* ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game))

You're ruling on **four** things: does the prose read right, does the firing rhythm feel right, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of them — it closes the question and charters the follow-up. Ignore how the aftermath *feels*; that's the building site you deliberately split into a later session.

**Play the five encounters:**

1. [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. [Snow on the Pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
3. [Riders Behind the Caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
4. [A Bargain at the Crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
5. [The Swindled Family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)

**For the firing-rhythm question only** — [press play and let it run](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters).

**The links serve build `df8ec2e7`, and nothing you would see has changed since the last brief.** The only thing that landed was a code-comment correction. **The five encounters are untouched**, so if you were mid-decision, nothing has shifted under you.

### 3. The action cards promise a danger that isn't real

([THR-998](https://linear.app/threadbare/issue/THR-998/the-focused-cards-risk-word-is-computed-from-a-difficulty-that-never))

Every action card tells the player what kind of working they're attempting — *steady*, *uncertain*, or *perilous*. For **85% of the cards a player can actually cast, the word is decorative**: the difficulty is flattened before the dice are rolled, so a "perilous" card and a "steady" card land exactly the same way. Same odds, different adjective.

Found by measurement, not guesswork — 400 runs per case, identical success rates across the whole difficulty range at the two scales covering most of the slot list.

**Two honest fixes, and the choice is a design call rather than a number:**

- **(a) Make the word tell the truth** — compute it from the odds the cast will actually roll. Truthful by construction, and stays truthful as your god grows. The cost: the same card reads differently for different gods, since it now depends on who's casting.
- **(b) Stop printing a risk word where the danger doesn't vary**, and say something else — what scale the working reaches, or what it costs you.

*The grooming lane recommends (b): if the danger genuinely doesn't vary, a danger word is the wrong thing on the card.*

### 4 & 5. Two small sound decisions

Both yes/no, both raised by the orchestrator lane this morning:

- **Where the encounter sounds should play.** They're wired to a screen that has since been replaced — should they move to the new encounter screen? ([THR-962](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it))
- **How those sounds should feel.** A tuning pass on their character. ([THR-961](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail))

## Queue

**Backed up — 34 items ready to pick up**, planning still outrunning execution. But the shape improved this morning: **three high-priority tickets joined a queue that was otherwise entirely low-priority housekeeping**, all about the aftermath screen — the moment after a hand resolves. They cover the screen not saying which encounter you just played, its result chips showing raw numbers and internal names instead of words, and the aftermath not appearing on its own. That is the work you split out of the verdict session, now specified.

**Two items in progress, no unowned parks** (eighth consecutive hour at zero). One is the format hold you already decided (THR-860, parked on purpose behind item 1 — no action needed). **Seven items have gone quiet for a week or more**, all low-priority engine and content cleanups; unchanged in character from last week.

## Freshness

**Home tree is current** — on `main`, nothing behind, nothing stranded. Two settings files show local edits, as they have all week, and autosync is provably keeping up regardless. The worktree reaper ran 14 minutes ago and is healthy (38 worktrees, 2 awaiting a human call).

**The live site is serving the newest commit.** Scheduled background jobs all firing on time (9 of 9); automated checks healthy.

**One PR needs an agent session, not you:** the fix for telling a deliberate pause apart from a broken system ([#1317](https://github.com/christianspliid-ui/threadbare/pull/1317)) reports itself as shipped but cannot actually merge — it has both a file collision with `main` and a failing test run. It is queued to merge the moment those clear, and it will not clear itself. Flagged here so it doesn't sit unnoticed; the next executor session picks it up.

*One monitoring note: the fleet-wide silence detector described in that PR is **not live yet**, because the PR hasn't merged. Until it does, a repeat of the 3–5 August pause would still be detected only after the fact.*

## What's moving

Since the last brief: a correction to an engine comment about group cohesion landed, and the three aftermath-screen tickets above were written up and queued. The pickup lane ran on schedule at 10:01; the orchestrator swept at 10:27 and promoted one item.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
