---
needsChristian: thr-907-verdict-links-ready, thr-883-format-session, thr-961-sound-feel, thr-962-nudge-stage-cues, thr-996-item-advancement
queue: backed-up
freshness: healthy
deploy: deployed
tasks: ok
---
# Briefing

**Generated:** 2026-08-06 04:55 local (2026-08-06 02:55 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Four things carried over, one new.** The new one is a small yes/no about items getting stronger over time. Nothing here is urgent tonight, and three separate fixes shipped without needing you while you were away.

### 1. The encounter verdict — five encounters, four rulings

*Still the one thing that moves the game forward.* Everything on our side has been ready since Sunday; this is now day six.

You're ruling on **four** things: does the prose read right, does the firing rhythm feel right, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of them — it closes the question and charters the follow-up. Ignore how the aftermath *feels*; that's the building site you deliberately split into a later session.

**Play the five encounters:**

1. [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. [Snow on the Pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
3. [Riders Behind the Caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
4. [A Bargain at the Crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
5. [The Swindled Family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)

**For the firing-rhythm question only** — [press play and let it run](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters).

**The site rebuilt three times in the last few hours, and none of it changes what you'd play.** What shipped was interior engine work — how a stat is read, how ids are minted, a check on our own paperwork. **The five encounters are identical to an hour ago.** Said plainly because "new builds went out" and "something changed for you" are different claims, and only the first is true.

### 2. The encounter-writing format session — still the biggest bottleneck

This is the one you asked for on 30 July: sit with Fable, write **one** encounter end-to-end, and iterate until the exact format is locked. It remains the only item on the whole board marked urgent, and it holds back more work than anything else — **eleven content tickets are parked behind it**, plus the four finished capital-city encounters that can't merge until the format is settled.

Two things you flagged when you paused the content work, still unanswered: the prose is *too abstract* even when it passes every automated check (your bar: take the space to explain the reasoning behind the nudge), and the "why it's in the balance" strip is a testing tool wearing a player interface.

**Worth doing after the five encounters above, not before** — playing them gives you the concrete examples to point at when you say what's wrong with the register.

### 3. Should items ever get stronger over time? *(new — from `tb-orchestrator`)*

The engine has a complete, tested "enchant/empower" system for items that **has never once run**, because nothing calls it. Three ways to go: turn it on, turn it on narrowly (only for rare or story items), or delete it. ([THR-996](https://linear.app/threadbare/issue/THR-996/attachmenttieradvancement-has-zero-production-callers-decide-whether))

This is a genuine design question about whether a sword you've carried for fifty turns should mean something mechanically, or whether items stay fixed and the growth lives entirely in the person. One sentence from you settles it.

### 4. Two sound questions — you need to hear the game *(from `tb-orchestrator`)*

- **Should the nudge moment carry cue sounds at all?** ([THR-962](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it)) — the cello-drone sounds exist and work, but they were written for the older encounter screen, which the game no longer shows. Re-pointing them is executor work; the part that's yours is whether that beat wants audio at all, and roughly where.
- **How do the new encounter sounds actually feel?** ([THR-961](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail)) — needs listening, not reading. Three of the nine per-reach tones are written into the spec exactly; the other six were extrapolated to match. Whether they carry the right meaning is a taste call.

Both are stuck until you've heard them. Neither is urgent.

## Queue

**Backed up — 35 items ready for work,** down from 37. Planning stays comfortably ahead of execution; nothing is starving.

- **Still no urgent, high, or medium work anywhere in the ready column** — all 35 items are low or no priority. Unchanged for days, and worth knowing rather than acting on. (The one urgent row on the board is your format session, which sits in design, not in the ready column.)
- **Nothing is parked.** The single ticket in progress has someone on it.
- **THR-860** — the four finished capital-city encounter templates — is still held behind your format decision above, deliberately and with the hold written on the ticket. Not a separate ask, and not waiting on anything you haven't already decided.
- **Thirteen items have gone untouched for a week or more,** down from fourteen. Grooming input, not an alarm.

## Freshness

- **Home tree: current.** On `main`, fully up to date, nothing stranded. Two of your own tool-settings files still show as modified — harmless, and the auto-sync keeps fast-forwarding straight past them.
- **All automated lanes on time** (9 of 9), merge checks healthy, no stuck changes, cleanup job ran 15 minutes ago. Nothing here needs you.
- **One thing to watch, for an agent and not for you:** the weekly drift-scan job has failed 3 of its last 5 scheduled runs, though the two most recent both succeeded. The health check calls it healthy on that basis; it stays on the agent-side list as a gap in how that check grades partial failure.
- **A second agent-side note:** the standing-asks file has grown past 400 lines and 100 KB of carried-forward findings. It's meant to be your short list of switches to flip, and it's drifting into a log. Flagged for an agent to prune; nothing for you to do.

## What's moving

**Three fixes shipped and went live since the last brief, none of which needed you:**

- **THR-723** — item tier advancement was strengthening a stat nobody reads; it now writes to the live one.
- **THR-921** — a gate that catches a design document going stale before work gets promoted off it.
- **THR-817** — group band ids are now derived rather than minted from a counter that reset unpredictably.

The executor's plate is clear, nothing is in progress, and the next hourly pickup draws fresh from the ready column.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
