---
needsChristian: thr-883-fable-format-lock, demo-readiness-hold, demo-fix-tickets-unqueued, thr-1042-consequence-suppression, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 19:59 local (17:59 UTC) · by keep-work-flowing-cc

## Needs Christian

**One new thing this hour, and it sharpens the advice I gave you an hour ago rather than reversing it.** A design pass this afternoon read every content block that builds an encounter, and it found that the ending screen is throwing away half of what the game worked out. That matters specifically for the **consequence session** — one of the two sittings I told you was ready. Details in the third item. Everything else carries unchanged and was re-pulled from the board rather than assumed.

- **The encounter-writing session with Fable is still the largest single blocker on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — sit down with Fable, write one encounter end-to-end, and sign off on how encounters get written from now on. It is the board's only Urgent row and it has not moved since 2026-08-02. **Twelve content tickets are held waiting on it**, plus one finished batch parked nine days.

  The sitting turns on **one question: what does an author write for the *aftermath* of an encounter?** Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Settle the aftermath half first** — otherwise the twelve held tickets unblock into a format that is missing its back half. — *from daily-backlog-grooming*

- **Still your call, unchanged from last hour: play now, or wait for four cosmetic fixes that nothing is scheduled to do.** The four small blemishes found in the readiness check are real, but the tickets for them sit in a holding column the work-picking lane does not read, so **no session will start on them on its own**. Left alone they sit. Either **play now** and mentally discount four surface edges, or **say the word** and they get moved into the work queue on the next pass.

  **Recommendation still: play now.** The four edges, so none surprises you: some result labels (like "Star grew" or "standing rose") look clickable but aren't; one screen flashes a long messy decimal where a clean number belongs; one screen prints a raw internal code-word instead of plain English; and one unrelated background encounter leaks a raw text-template glitch into the story log.

- **NEW — worth knowing *before* the consequence session: the ending screen is currently hiding the mechanical half of what happened.** When the game finishes working out an encounter it builds one list of everything that changed — the written consequences the author wrote, **plus** what the world actually did: skill growth, standing shifts, anything won. The ending screen then keeps only the written half and drops the rest. I checked the five encounters you'd be playing and all five take that path, so this is live for your session, not theoretical.

  **Why it matters to you specifically:** the consequence session asks *"is the change to the world visible, and does it feel like it happened in the world?"* — and right now part of the change is genuinely not on screen. If you play it as-is and it feels thin, **some of that is this defect rather than the design**, and you'd be ruling on the wrong thing.

  So, a real choice rather than a warning:
  - **The slice session ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)) is unaffected — play it now.** Prose, firing rhythm, interface, and whether deciding is fun do not depend on this.
  - **The consequence session ([THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence)) is the one I'd hold**, or play knowing you are seeing only the authored consequences. **Recommendation: play the slice session now, and give the consequence one a beat** — the fix is filed, small, and top of the ready pile.

  One honest limit on what I checked: I confirmed the screen keeps only the authored half and that your five encounters all take that path. I did **not** measure how much the game actually contributes on those five — none of them award a prize, so what's being dropped is growth and standing rather than anything dramatic. It may read as a small thinness rather than an obvious hole. [THR-1042](https://linear.app/threadbare/issue/THR-1042)

- **The four-verdict slice session — ready, and unaffected by the item above.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is valid on any of them. One link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

  **The ending-review links from this morning still work** — add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any of the above to end it that way instead of replaying and hoping. Where nobody has written that ending yet you'll get the normal one, so two links reading the same means a gap in the writing, not a bug.

- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. You'll pass through this naturally during the slice session. — *from daily-backlog-grooming*

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **34 items ready for dev, 2 in progress**. Planning is ahead of execution, and nothing is stuck.

- **This afternoon's design pass turned into three queued repairs, two of them high priority.** A full read of how encounters get built found: the ending screen dropping the mechanical half of what changed (the item above); the encounter screen quietly building a cast list and a stakes preview that **nothing on screen ever shows**; and every mercenary-company encounter crashing the screen outright. All three are filed with fixes described and are the top of the pile.
- **The four demo-readiness fix tickets are still not in the work queue** — unchanged from last hour. They sit in an early holding state that the hourly work-picking lane never reads. Agent-side housekeeping, not a decision for you.
- **No unowned work** — both in-progress items have an owner, for a tenth consecutive run.
- The mercenary-encounter repair picked up an hour ago and already has a pull request open. The other in-progress item is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock — nothing to do, it waits on the same decision as everything else in that stack.
- Everything else in the ready pile is small cleanup. **Eight items have been waiting more than a week**, unchanged. None of them blocks anything.

## Freshness

- All nine scheduled jobs are running on time, and the automated checks are healthy.
- **The live site is up to date.** Nothing has been merged since this morning's ending-review links that changes the game itself, so there was nothing new to publish — what you'd play is current.
- One pull request has a merge clash, opened half an hour ago (the mercenary-encounter repair). **Too young to be a problem** and it's an agent-side fix; noted so it isn't a surprise if it's still there next hour.
- **The background jobs went quiet overnight again** and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- The housekeeping job that cleans up old work folders ran twenty minutes ago. 45 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- **The composition audit finished and closed** ([THR-1039](https://linear.app/threadbare/issue/THR-1039)) — the read-everything pass that produced the three repairs above. Worth knowing it exists: it is the first full account of what actually builds an encounter today.
- **A design ticket opened off it: [The Encounter Factory](https://linear.app/threadbare/issue/THR-1043)** — a way to produce finished encounters at scale with automatic quality gates. It is in design, not built, and it overlaps the Fable format question you're being asked to settle.
- The [UX Laws assessment of the encounter popups](https://linear.app/threadbare/issue/THR-1031), your ask from this morning, is written up and waiting in the ready pile.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
