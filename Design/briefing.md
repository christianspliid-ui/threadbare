---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, thr-961-sound-feel, thr-962-sound-routing, thr-998-action-card-risk-word
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
lanes: active
ci: runner-outage
---
# Briefing

**Generated:** 2026-08-06 21:00 local (19:00 UTC) · by keep-work-flowing-cc

## Needs Christian

- **The encounter-writing session with Fable is still the highest-leverage hour on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — write one encounter end-to-end with Fable and sign off on how encounters get written. It is the board's only Urgent row, it has not moved since 2026-08-02, and it holds a hard block on eleven content tickets (every WS5 batch plus Meeting Batch A). No agent can decide it. Until it happens, roughly a third of the backlog is frozen by construction. *— from daily-backlog-grooming*
- **The slice verdict session is still ready and waiting for you.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on prose, firing, UI and game feel. Both its blockers finished days ago; it has been playable since 2026-08-02. *— from tb-orchestrator*
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land the same way. Two honest fixes: (a) make the word track the odds the cast will actually roll, or (b) stop printing a risk word where the odds are flat and say something else — what scale the working reaches, or what it costs. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing on the card. [THR-998](https://linear.app/threadbare/issue/THR-998) *— from daily-backlog-grooming*
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail). *— from tb-orchestrator*

## Queue

Backed up — 36 items ready for dev, 5 in progress. Planning is comfortably ahead of execution.

- **One job is sitting unowned: [the aftermath that doesn't pop by itself](https://linear.app/threadbare/issue/THR-1005).** It was deliberately parked on a question for you, you answered it on Discord this afternoon, and your answer is now written onto the ticket in full. It is ready for the next session to pick straight up — nothing further is needed from you.
- Six items have been sitting untouched for more than a week; none of them is blocking anything.

## Freshness

- **The automatic check that guards merges has been unable to get a machine from GitHub since about 18:15 your time.** GitHub's own build machines are not picking up jobs — the error is on their side, not ours, and nothing in the project is broken. Five finished pieces of work are queued behind it and will merge on their own once GitHub recovers. Nothing needs you here; the next working session will re-run anything still stuck.
- One consequence worth knowing: the step that ticks a ticket off as finished also failed in that outage, so **the UI Laws ticket still reads as in-progress even though it shipped this afternoon**. That is an agent's to clear, not yours — flagged here only so the board looks wrong for a reason you can see.
- Your working copy is on `main` and fully up to date. Two settings files show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched, but worth a look if you didn't make them.
- Live site is current; nothing since the last publish changed the game itself. Housekeeping, scheduled jobs and lane activity all healthy.

## What's moving

Five pieces of work are finished and waiting on the merge gate: the encounter-toast fix, the threads-panel cleanup, the Law Book amendments, the faction event-id fix, and the aftermath step fix. Four of those are stuck purely on GitHub's outage. The fifth — the aftermath step fix — has a genuine test failure of its own and needs a session to look at it; that is separate from the outage and predates it.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
