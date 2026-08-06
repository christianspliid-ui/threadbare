---
needsChristian: thr-883-format-session, thr-907-verdict-links-ready, thr-998-risk-word-verdict, thr-961-sound-feel, thr-962-nudge-stage-cues
queue: backed-up
freshness: healthy
deploy: deployed
tasks: ok
---
# Briefing

**Generated:** 2026-08-06 10:02 local (2026-08-06 08:02 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One new question arrived this hour** — about what the action cards promise the player. Four items carried, unchanged. Your enchantment answer from this morning has been acted on and is off the list.

**If you have one hour, spend it on item 1. If you have ten minutes, spend them on item 2.** That ordering is a change from earlier briefs, and it's deliberate: the daily backlog review this morning called the format session "the highest-leverage hour available on the board," and the reason is arithmetic — a third of the backlog is frozen behind it.

### 1. The encounter-writing format session — the cork in the bottle

This is the one you asked for on 30 July: sit with Fable, write **one** encounter end-to-end, and iterate until the exact format is locked. ([THR-883](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format))

It is still the **only** item on the whole board marked urgent, and it holds back more work than anything else — **eleven content tickets are parked behind it**, plus four finished capital-city encounters that can't merge until the format is settled. Nothing else unblocks it; no agent can decide it. It hasn't moved since 2 August.

Two things you flagged when you paused the content work, still unanswered: the prose is *too abstract* even when it passes every automated check (your bar: take the space to explain the reasoning behind the nudge), and the "why it's in the balance" strip is a testing tool wearing a player interface.

**Worth playing the five encounters below first** — they give you the concrete examples to point at when you say what's wrong with the register.

### 2. The encounter verdict — five encounters, four rulings

*Ready since Sunday; this is now day six.* ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game))

You're ruling on **four** things: does the prose read right, does the firing rhythm feel right, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of them — it closes the question and charters the follow-up. Ignore how the aftermath *feels*; that's the building site you deliberately split into a later session.

**Play the five encounters:**

1. [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. [Snow on the Pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
3. [Riders Behind the Caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
4. [A Bargain at the Crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
5. [The Swindled Family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)

**For the firing-rhythm question only** — [press play and let it run](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters).

**The site rebuilt again and again it changes nothing you'd play.** The links now serve build `ee694387`. What landed was interior: a sphere-flavour fix on Draw Together and a documentation note. **No encounter, card, or map asset moved**, so these five are identical to the ones you were offered at 07:55.

### 3. The action cards are promising a danger that isn't real *(new — from `daily-backlog-grooming`)*

([THR-998](https://linear.app/threadbare/issue/THR-998/the-focused-cards-risk-word-is-computed-from-a-difficulty-that-never))

Every action card tells the player what kind of working they're about to attempt — *steady*, *uncertain*, or *perilous*. It turns out that for **85% of the cards a player can actually cast, the word is decorative**: the underlying difficulty gets flattened before the dice are rolled, so a "perilous" card and a "steady" card land exactly the same way. Same odds, different adjective.

This was found by measurement, not by guesswork — 400 runs per case, and the success rate comes out identical across the whole difficulty range at the two scales that cover most of the slot list.

**Two honest fixes, and the choice is a design call rather than a number:**

- **(a) Make the word tell the truth** — compute it from the odds the cast will actually roll. Truthful by construction and it stays truthful as your god grows. The cost: the same card would read differently for different gods, since it now depends on who's casting.
- **(b) Stop printing a risk word where the danger doesn't vary**, and say something else instead — what scale the working reaches, or what it costs you.

**The recommendation is (b).** If the danger genuinely doesn't vary at the scale most cards operate at, a danger word is the wrong thing to print there — and (a) buys truthfulness at the price of the card meaning something different in every playthrough.

There's a third option — lower the odds floors so authored difficulty matters again — but that governs how *mortals* resolve actions too, so it's a much wider change. It's listed to be ruled out on purpose, not pursued casually.

### 4. Two sound questions — you need to hear the game *(from `tb-orchestrator`)*

- **Should the nudge moment carry cue sounds at all?** ([THR-962](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it)) — the cello-drone sounds exist and work, but they were written for the older encounter screen, which the game no longer shows. Re-pointing them is executor work; the part that's yours is whether that beat wants audio at all, and roughly where.
- **How do the new encounter sounds actually feel?** ([THR-961](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail)) — needs listening, not reading. Three of the nine per-reach tones are written into the spec exactly; the other six were extrapolated to match. Whether they carry the right meaning is a taste call.

Both are stuck until you've heard them. Neither is urgent.

## Queue

**Backed up — 33 items ready for work,** up one from 32. Planning stays ahead of execution; nothing is starving.

- **Your enchantment answer moved.** [THR-996](https://linear.app/threadbare/issue/THR-996/attachmenttieradvancement-has-zero-production-callers-decide-whether) — the "turn the enchantment system on" verdict you gave on Discord this morning — has been promoted into the ready queue and is now claimable by the next working session. That's the loop closing: asked 02:32, answered 05:07, queued for building by 07:29.
- **One urgent item is now waiting for a session**, which is a change from the last few hours. A test that measures the casting curve runs 13% over its time limit, so it fails intermittently and turns unrelated work red ([THR-1000](https://linear.app/threadbare/issue/THR-1000/playercastbalances-8-call-distribution-test-sits-at-113-of-the-5s)). It's already blocking the company-card artwork from merging. Ours to fix, not yours — flagged only because it's the first non-housekeeping item to reach the front of the queue in a while.
- **Nothing is parked.** Two items are being worked and both have owners. Seventh consecutive hour with no abandoned work.
- **Eight items have gone quiet** (untouched for over a week), down from nine — a fifth consecutive fall, matching the explanation offered when the count spiked: it was the content pause showing up in date arithmetic, not fresh neglect.

## Freshness

**Home tree is current** — on `main`, nothing behind, nothing stranded. Two settings files show local edits (yours, from tool permissions); they've been there for days and haven't blocked anything.

**Everything automated is running.** The site serves the latest build, the merge checks work, all nine scheduled jobs are on time, and the cleanup job ran 22 minutes ago. Two old work folders are flagged for a human to decide on eventually — not urgent, and deliberately never auto-deleted.

**Two agent-side notes, explicitly not yours.** One finished piece of work can't merge because of a file collision in the status doc — that's a session's job to resolve, not a decision. And our background-job monitor still reports the weekly drift scan as "running normally" in the same breath as saying 3 of its last 5 runs failed; it has no setting between "fine" and "completely dead", so a job that half-works reads as healthy. Both are ours.

## What's moving

Since the last brief: a sphere-flavour fix on the Draw Together action and the note recording that contract. The company action-card artwork is finished and waiting on the urgent test fix above before it can land.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
