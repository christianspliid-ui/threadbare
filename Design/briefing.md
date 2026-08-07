---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, thr-1005-close-check, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing, lane-quiet-overnight
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-07 21:54 local (19:54 UTC) · by keep-work-flowing-cc

## Needs Christian

One new item since this morning's brief, and it is a small one. Everything else is unchanged — and the delivery machinery that dominated the last three briefs is now fully clear: nothing is stuck, nothing is waiting on a runner, and the live site is current.

- **NEW — one ticket is finished and needs your glance to close it.** [The aftermath that wasn't popping up by itself](https://linear.app/threadbare/issue/THR-1005) — the thing you reported on Wednesday, where the ending of an encounter sat behind a button on the agent's row instead of appearing on its own. **Both halves have now shipped.** No agent is allowed to mark a ticket finished, so it is sitting waiting on a human. The one thing worth your eye before you close it: the fix's own evidence shows the aftermath opening unprompted *with other windows still stacked behind it*. If that matches what you originally saw, it's done. If the stacking is itself wrong to you, say so and it becomes a new ticket. *— from tb-orchestrator*
- **The encounter-writing session with Fable is still the highest-leverage hour on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — write one encounter end-to-end with Fable and sign off on how encounters get written. It is the board's only Urgent row, it has not moved since 2026-08-02, and it holds a hard block on eleven content tickets (every WS5 batch plus Meeting Batch A). No agent can decide it. Until it happens, roughly a third of the backlog is frozen by construction.
- **The slice verdict session is still ready and waiting for you.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is a valid answer to any of them. It has been playable since 2026-08-02 and nothing of ours has gated it since. The five encounters, one link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  **The live site is current** — it is serving tonight's work. Nothing that landed today touches the five slice encounters themselves, so the thing you would be ruling on reads the same as it did this morning.
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).
- **The overnight-quiet question, still open from this morning.** All the automatic background jobs went quiet for about 14 hours last night — roughly 22:50 to 13:15 your time — and started again on their own. If that was just your machine being off, nothing is wrong. The only reason it keeps reaching you is that there is a way to say so in advance: dropping a file called `threadbare-pause.json` into `C:\Users\chris\.claude\` silences the alarm for as long as it sits there, and deleting it turns the alarm back on. The one currently there covers the deliberate pause from 3–5 August and has expired, which is why last night registered as unexplained. **One line from you — "overnight quiet is normal" — and I'll stop raising it.**

## Queue

Backed up — 35 items ready for dev, 1 in progress. Planning is well ahead of execution, and with the delivery jam gone that gap is now purely a throughput matter, not a fault.

- **The unowned job from this morning has resolved itself into the close-check above.** [THR-1005](https://linear.app/threadbare/issue/THR-1005) sat unclaimed for three consecutive runs; a session picked it up during the day, shipped both halves, and moved it to the waiting-to-close column. It is now your one-line decision rather than nobody's job.
- The one thing in progress is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it is waiting on the same decision as everything else in that stack.
- Six items have been waiting more than a week; none of them blocks anything.

## Freshness

- **Everything that was stuck this morning has merged.** The four finished pieces of work that were sitting on merge conflicts all landed during the afternoon. There is exactly one open pull request now, and it is the encounter batch that is paused on purpose. Nothing needs a session.
- **The live site is current** — serving the newest commit.
- All nine scheduled jobs are running on time, and the automated checks are healthy.
- The housekeeping job that cleans up old work folders ran 14 minutes ago, on time. 42 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me, but worth a glance if you didn't make them.

## What's moving

Thirteen pieces of work reached the live site since this morning's brief — including all four that were stuck on merge conflicts when it was written. In plain terms: the aftermath screen now opens on its own instead of waiting behind a click (that's the ticket above); the threads panel and the encounter toast were brought up to the Law Book you ratified; agents got a sanctioned way to clear story pop-ups when a test needs to see the screen behind them; the tool that watches for stuck pull requests learned to notice a *failed* check and not just a conflict; and several smaller repairs to the bookkeeping and test machinery.

Nothing is in flight. The board is between jobs — which is what makes the Fable format-lock hour the most valuable thing you could spend time on.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
