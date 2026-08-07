---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing, lane-quiet-overnight
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
lanes: recovered
ci: stranded-prs
---
# Briefing

**Generated:** 2026-08-07 13:11 local (11:11 UTC) · by keep-work-flowing-cc

## Needs Christian

- **The encounter-writing session with Fable is still the highest-leverage hour on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — write one encounter end-to-end with Fable and sign off on how encounters get written. It is the board's only Urgent row, it has not moved since 2026-08-02, and it holds a hard block on eleven content tickets (every WS5 batch plus Meeting Batch A). No agent can decide it. Until it happens, roughly a third of the backlog is frozen by construction. *— from daily-backlog-grooming*
- **The slice verdict session is still ready and waiting for you.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is a valid answer to any of them. It has been playable since 2026-08-02 and nothing of ours has gated it since. The five encounters, one link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  The live site has not changed since your last look — same build, same five encounters. *— from tb-orchestrator*
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998) *— from daily-backlog-grooming*
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).
- **One small housekeeping question, and it is probably nothing.** All the automatic background jobs went quiet for about 16 hours overnight — roughly 21:00 to 13:00 your time — and started again on their own an hour ago. If that was just your machine being off, nothing is wrong and you can ignore this. The only reason it reaches you is that there is a way to say so in advance: dropping a file called `threadbare-pause.json` into `C:\Users\chris\.claude\` silences the alarm for as long as it sits there, and deleting it turns the alarm back on. The one currently there covers the deliberate pause from 3–5 August and has expired, which is why last night registered as unexplained. **If overnight quiet is normal, tell me and I'll stop raising it.**

## Queue

Backed up — 36 items ready for dev, 7 in progress. Planning is a long way ahead of execution, and this hour that gap is not a planning problem: six of the seven in-progress items are *finished work that cannot ship* (see What's moving).

- **One job is sitting unowned: [the aftermath that doesn't pop by itself](https://linear.app/threadbare/issue/THR-1005).** It was parked on a question for you, you answered it on Discord yesterday afternoon, and your answer is written onto the ticket in full. It is ready for the next session to pick straight up — nothing further is needed from you. This is its second run sitting unclaimed.
- Six items have been waiting more than a week; none of them blocks anything.

## Freshness

- **The build machines are working again, but seven finished pieces of work are still stranded, and no automatic check can see it.** GitHub's shortage yesterday afternoon killed the checks on every open piece of work. The shortage itself is over — a scheduled job got a machine within three seconds at 05:07 your time this morning and passed — but the killed checks do not restart themselves, and two of the newest pieces of work never got a check at all. **This is a working session's job, not yours**, and it is already written up as a ticket. Flagged here because the automated sweep currently reports all seven as "waiting, will merge on their own", which is wrong, so it may need a session pointed at it deliberately.
- **The housekeeping job that cleans up old work folders has not run since 22:40 last night** — about 14 hours, where it should run hourly. Worth knowing but not urgent; 41 folders are open and 2 need a human decision eventually. An agent can restart it.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me, but worth a glance if you didn't make them.
- Live site is current; nothing since the last publish changed the game itself.

## What's moving

**Six finished pieces of work are queued behind the merge gate, the oldest for about 20 hours:** the encounter-toast cleanup, the threads-panel fix, the Law Book amendments, the faction event-id fix, the aftermath step fix, and the fix for the merge-gate problem itself. That last one is the awkward part — the repair is stuck in the same queue as everything it would repair, so a session has to nudge it through by hand.

One consequence worth seeing on the board: **the UI Laws ticket still reads as in-progress even though you ratified it and it shipped yesterday afternoon.** The step that ticks a ticket off failed during the same shortage. That is an agent's to clear, not yours — flagged only so the board looks wrong for a reason you can see.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
