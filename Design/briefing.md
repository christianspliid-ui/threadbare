---
needsChristian: thr-883-fable-format-lock, thr-907-slice-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 12:55 local (10:55 UTC) · by keep-work-flowing-cc

## Needs Christian

**One item cleared this hour — you answered it.** The beat-stacking law is off this list and routed onward; see *From Christian* below. Six items carry, and I re-checked each is still genuinely open rather than assuming it.

- **The encounter-writing session with Fable is still the largest single blocker on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — sit down with Fable, write one encounter end-to-end, and sign off on how encounters get written from now on. It is the board's only Urgent row and it has not moved since 2026-08-02. **Twelve content tickets are held waiting on it**, plus one finished batch parked eight days.

  The sitting turns on **one question: what does an author write for the *aftermath* of an encounter?** Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Settle the aftermath half first** — otherwise the twelve held tickets unblock into a format that is missing its back half. — *from daily-backlog-grooming*
- **The slice verdict session is still ready and waiting.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is a valid answer to any of them. Playable since 2026-08-02, and the live site is serving today's newest work. One link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)
- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause have shipped and been verified against your exact repro, and the ticket was closed on that evidence. Next time you play a pause-tier encounter, watch whether the ending pops by itself. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. — *from daily-backlog-grooming*
- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)
- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## From Christian

You wrote, at 12:46 local: **"go ahead and write the law"**.

Taken as your go-ahead on the beat-stacking rule — the ruling that *beats may stack, provided the stack reads in the order the world produced them, so the player can reconstruct what happened in what order*. It has been sitting unwritten because it lived only in this brief and the standing-asks file.

**What I did:** dropped it from the list above, and recorded your go-ahead in `Design/user-actions.md` so it survives past this hour.

**What I did not do:** write it. Putting a law into the Law Book is a repo edit and needs a ticket, and I am a reporting job — I only write these two files. So it is **routed to the next working session**, which reads this section. Nothing else is waiting on it, and it does not need you again.

## Queue

Backed up — **35 items ready for dev, 1 in progress**. Planning is well ahead of execution, and nothing is stuck.

- **No unowned work** — the one in-progress item has an owner, for a sixth consecutive run.
- The [Livelihood clause fix](https://linear.app/threadbare/issue/THR-840) **shipped and merged** since the last brief — that was the failing check reported an hour ago, and it was fixed and landed rather than lingering.
- The only item still in progress is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it waits on the same decision as everything else in that stack.
- **Three new items were filed this morning**, two of them the highest-priority things now on the board: the aftermath screen printing bare labels instead of the authored wording, a fix to how impediment-log numbers are handed out, and a note that there is no way to review an encounter's *other* endings without replaying and hoping. The first and third are both aftermath-shaped — the machine is filing against the same half of the format you are about to rule on.
- Everything else in the ready pile is small, low-priority cleanup. **Seven items have been waiting more than a week**, unchanged from yesterday; none of them blocks anything.

## Freshness

- **The background jobs went quiet overnight again** (00:28–09:06 your time) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- All nine scheduled jobs are running on time, both weekly background workflows are healthy, and the automated checks are healthy.
- **The live site is serving the newest work** (`f79cdc4b`, including the Livelihood fix that landed this hour) — worth knowing before you sit down with the slice links above.
- One pull request is open: the encounter batch paused on purpose. **It needs nothing from you** — the pause is recorded on the PR itself, so it no longer gets re-raised here.
- The housekeeping job that cleans up old work folders ran fifteen minutes ago. 43 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- With the Livelihood fix merged, **nothing is actively being built right now** — the executor lane has a clear runway and 35 ready items to pull from.
- The impediment-log tidy-up landed yesterday; its follow-up (repairing the 126 log rows the new check flags) and a fix to how log numbers are allocated are both queued.
- The encounter-history bug filed overnight — history silently losing entries — is queued and waiting its turn.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
