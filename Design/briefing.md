---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing, beat-stacking-rule-unfiled
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 10:56 local (08:56 UTC) · by keep-work-flowing-cc

## Needs Christian

Nothing new arrived this hour. Six items carry unchanged, and I am promoting a seventh that has been sitting in the wrong place.

- **The encounter-writing session with Fable is still the largest single blocker on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — sit down with Fable, write one encounter end-to-end, and sign off on how encounters get written from now on. It is the board's only Urgent row and it has not moved since 2026-08-02. **Twelve content tickets are held waiting on it**, plus one finished batch parked eight days.

  The sitting turns on **one question: what does an author write for the *aftermath* of an encounter?** Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Settle the aftermath half first** — otherwise the twelve held tickets unblock into a format that is missing its back half. — *from daily-backlog-grooming*
- **The slice verdict session is still ready and waiting.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is a valid answer to any of them. Playable since 2026-08-02, and the live site is serving the newest work. One link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)
- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause have shipped and been verified against your exact repro, and the ticket was closed on that evidence yesterday morning. Next time you play a pause-tier encounter, watch whether the ending pops by itself. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. — *from daily-backlog-grooming*
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).
- **Your beat-stacking rule still isn't written down anywhere that counts, and I'm promoting it to a proper item because two runs of carrying it as a footnote have not worked.** Your ruling — *beats may stack, provided the stack reads in the order the world produced them, so the player can reconstruct what happened in what order* — belongs in the Law Book. It currently survives only in this brief and the standing-asks file, neither of which anything reads when work gets picked up. I'm a reporting job, so I can't write it in or file the ticket for it. **One word from you and a working session picks it up.**

## Queue

Backed up — **33 items ready for dev, 2 in progress**. Planning is comfortably ahead of execution, and nothing is stuck.

- **No unowned work** — both in-progress items have an owner, for a fourth consecutive run.
- One piece of work is genuinely in flight: the [impediment-log tidy-up](https://linear.app/threadbare/issue/THR-839) that makes the log's Impact column machine-checkable. Its pull request has a failing check as of half an hour ago — ordinary, and the next working session reads it and pushes a fix.
- The other in-progress item is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it waits on the same decision as everything else in that stack.
- Everything in the ready pile is small, low-priority cleanup. **Six items have been waiting more than a week**; none of them blocks anything.

## Freshness

- **The background jobs went quiet overnight again** (00:28–09:06 your time) and resumed on their own. **Logged as normal per your message yesterday, not raised.** The detector still flags this pattern every night — teaching it that overnight quiet is expected is on the agent-side list, not yours.
- All nine scheduled jobs are running on time, and the automated checks are healthy.
- **Nothing needed rebuilding since the last publish** — everything that landed overnight was notes and docs, so the live site is current without a new deploy.
- Two pull requests are open: the failing-check one above, and the encounter batch paused on purpose. **Neither needs you** — the failing check is an ordinary technical fix.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 43 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- The aftermath-popping bug you reported on 2026-08-06 was **closed yesterday morning** on shipped, verified evidence. The only thing left is your confirmation in play (above).
- A new engine bug filed itself cleanly overnight: encounter history was **silently losing entries** because a write was using a placeholder name instead of a real one. It's queued.
- The impediment-log tidy-up is the one piece of work actively moving through the machine right now.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
