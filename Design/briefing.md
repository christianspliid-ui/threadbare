---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, thr-1005-close-only, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing, lane-quiet-overnight
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: silent
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 09:01 local (07:01 UTC) · by keep-work-flowing-cc

## Needs Christian

Your message came through and it settled one of yesterday's questions. Nothing new has broken overnight — the machine simply stopped for the night and started again this morning.

- **THR-1005 is now yours to close, with no question attached.** You answered the stacking question: stacking is fine. So the check I was asking for is done — [the aftermath ticket](https://linear.app/threadbare/issue/THR-1005) is finished and approved, and it just needs the actual close. No agent is allowed to mark a ticket finished, which is the only reason it is still on your list.
- **The encounter-writing session with Fable is still the highest-leverage hour on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — write one encounter end-to-end with Fable and sign off on how encounters get written. It is the board's only Urgent row, it has not moved since 2026-08-02, and it holds a hard block on eleven content tickets (every WS5 batch plus Meeting Batch A). No agent can decide it. Until it happens, roughly a third of the backlog is frozen by construction.
- **The slice verdict session is still ready and waiting for you.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is a valid answer to any of them. It has been playable since 2026-08-02 and nothing of ours has gated it since. The five encounters, one link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  **The live site is current** — it is serving last night's work. Nothing that landed touches the five slice encounters themselves, so what you would be ruling on reads the same as it did yesterday.
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).
- **The overnight-quiet question, third night running.** The background jobs went quiet again last night — 00:28 to 08:58 your time, about eight and a half hours — and started again on their own this morning. The pattern now looks exactly like your machine being off overnight, which is not a fault. I keep raising it only because I have no way to tell that apart from a real stoppage, and there is a way for you to tell me: dropping a file called `threadbare-pause.json` into `C:\Users\chris\.claude\` silences it, deleting it turns it back on. The one sitting there now covers the deliberate 3–5 August pause and has expired. **One line from you — "overnight quiet is normal" — and I'll stop asking.**

## From Christian

You wrote at 08:57 your time:

> stacking is fine and should be part of our ux law library. as long as the stacking is chronological to the game state, so the player can induce the sequence of happenings.

Two things came out of that, and I've done one of them:

- **Done here:** the stacking verdict is recorded, and THR-1005 has dropped from "please look at this and decide" to "please close this" (top of the list above).
- **Routed onward, not done:** turning that into an actual entry in the Law Book — the rule being *beats may stack, provided the stack reads in the order the world produced them, so the player can reconstruct what happened in what order*. I'm a reporting job, not a building one, so I can't write the law or file the ticket for it. **It is not tracked anywhere yet.** The next working session should file it against the Law Book; if you'd rather it happen sooner, say so and it can be picked up directly. Worth noting the timing is good: the three pieces of work that landed last night were all Law Book adoption work, so the book is actively being applied right now.

## Queue

Backed up — 34 items ready for dev, 1 in progress. Planning is well ahead of execution, but nothing is stuck: everything in that pile is small, low-priority cleanup.

- **No unowned work.** Every in-progress item has an owner for the first time in several days.
- The one thing in progress is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it waits on the same decision as everything else in that stack.
- Eight items have been waiting more than a week; none of them blocks anything.

## Freshness

- **The live site is current** — serving the newest commit.
- All nine scheduled jobs are running on time, and the automated checks are healthy. There is one open pull request and it is the encounter batch paused on purpose.
- The housekeeping job that cleans up old work folders ran on time. 40 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

Three pieces of work reached the live site since yesterday evening, all of them Law Book work: the encounter screen and several older panels were brought into line with the laws you ratified, and one of the laws became something the build can check automatically instead of by eye. That is the same shelf your stacking rule belongs on.

Nothing is in flight this morning. The board is between jobs — which is what makes the Fable format-lock hour the most valuable thing you could spend time on.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
