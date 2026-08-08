---
needsChristian: thr-883-fable-format-lock, demo-readiness-hold, thr-907-slice-verdict, thr-974-consequence-verdict, aftermath-pops-recheck, thr-998-action-card-risk-word, thr-961-sound-feel, thr-962-sound-routing
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
lanes: recovered
ci: healthy
---
# Briefing

**Generated:** 2026-08-08 17:57 local (15:57 UTC) · by keep-work-flowing-cc

## Needs Christian

**One thing changed since the last brief, and it is a "wait a moment" rather than a "go".** Two hours ago this file told you the two play-and-rule sessions were ready. A readiness check run since then played all five endings and found four small blemishes. Nothing is broken, but you would notice them, so the recommendation is now: **give it a few hours, then play.** Everything else carries unchanged; I re-pulled each from the board rather than assuming.

- **The encounter-writing session with Fable is still the largest single blocker on the board.** [Lock the authoring format](https://linear.app/threadbare/issue/THR-883/fable-encounter-writing-prototype-lock-the-exact-authoring-format) — sit down with Fable, write one encounter end-to-end, and sign off on how encounters get written from now on. It is the board's only Urgent row and it has not moved since 2026-08-02. **Twelve content tickets are held waiting on it**, plus one finished batch parked nine days.

  The sitting turns on **one question: what does an author write for the *aftermath* of an encounter?** Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Settle the aftermath half first** — otherwise the twelve held tickets unblock into a format that is missing its back half. — *from daily-backlog-grooming*

- **CHANGED — hold the two play sessions for a few hours.** A readiness check played all five endings this afternoon and the verdict was **good content, unfinished edges**. The prose reads well, nothing is broken, and the endings genuinely differ depending on how the hand went — that part landed. But it found four small blemishes you would notice: some result labels (like "Star grew") look clickable and aren't; one screen flashes a messy decimal where a clean number belongs; one screen prints a raw internal code-word instead of plain English; and an unrelated background encounter leaked a raw text-template glitch into the story log.

  None of these change what you would be ruling *on*, but they would read as unfinished mid-session and pull your attention to the wrong thing. Four small fix tickets are queued for the next working sessions. **Recommendation: let those land, then play — probably later this evening or tomorrow.** If you would rather look now anyway, nothing stops you; the links below all work. — *from tb-orchestrator*

- **The four-verdict slice session, ready and waiting behind that hold.** [Play the 5-encounter slice](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and rule on four things: does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun. "Needs another iteration" is valid on any of them. One link each:
  - [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
  - [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
  - [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
  - [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)
  - [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
  - And for the firing-rhythm verdict, which needs natural play rather than spawn-on-demand: [free play with everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters)

- **The consequence verdict, also ready and behind the same hold.** You split this out on 2026-08-02 so it would not be ruled against an unfinished aftermath; that reasoning is what the hold above is still honouring, one layer down. [The consequence session](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) asks one thing: play a hand to its ending, and say whether **the change to the world is visible, and whether it feels like it happened in the world** rather than being announced at you. Same encounters as above, so both sittings can be one go.

- **A two-minute check, not a decision: does the ending of an encounter now appear on its own when you play?** You reported on 2026-08-06 that it didn't — you had to click the badge on the agent's thread. Both halves of that cause shipped and were verified against your exact repro. **No reply needed if it works.** If it doesn't, say so and it gets a fresh ticket — a recurrence now would be a different bug, not the old one. You will pass through this naturally during either session above. — *from daily-backlog-grooming*

- **Action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number cannot move the odds at all — a "perilous" card and a "steady" card land exactly the same way. Three honest fixes: (a) make the word track the odds the cast will actually roll, which makes the same card read differently for different gods; (b) stop printing a risk word where the odds are flat and say something else instead — what scale the working reaches, or what it costs; (c) lower the floors so the authored danger bites again, which also changes how mortals resolve everything. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing to print. [THR-998](https://linear.app/threadbare/issue/THR-998)

- **Two small yes/no decisions on encounter sound**, unchanged for several runs: [routing the sound cues to the new screen](https://linear.app/threadbare/issue/THR-962/the-encounter-sound-design-is-wired-to-a-superseded-surface-route-it), and [how those cues actually feel](https://linear.app/threadbare/issue/THR-961/encounter-sound-design-feel-calibration-pass-thr-346-tuning-tail).

## Queue

Backed up — **32 items ready for dev, 1 in progress**. Planning is well ahead of execution, and nothing is stuck.

- **No unowned work** — the one in-progress item has an owner, for an eighth consecutive run.
- **Four new fix tickets were filed this afternoon** off the readiness check above (the inert labels, the messy decimal, the raw code-word, and one unverified branch). They are small and they are what the hold is waiting on.
- The only item in progress is the [civic-seats encounter batch](https://linear.app/threadbare/issue/THR-860), deliberately paused behind the Fable format lock. Nothing to do — it waits on the same decision as everything else in that stack.
- Everything left in the ready pile is small cleanup. **Eight items have been waiting more than a week**, unchanged from the last brief. None of them blocks anything.

## Freshness

- **The live site is serving the newest work** (`d41c6779`). Worth knowing before you sit down with the links above: what you would be ruling on is genuinely deployed.
- All nine scheduled jobs are running on time, and the automated checks are healthy.
- **The background jobs went quiet overnight again** (00:28–09:06 your time) and resumed on their own. **Logged as normal per your message on 2026-08-06, not raised.** The detector still flags this shape every night; teaching it that overnight quiet is expected is on the agent-side list, not yours.
- One pull request is open: the encounter batch paused on purpose. **It needs nothing from you** — the pause is recorded on the PR itself, so it no longer gets re-raised here.
- The housekeeping job that cleans up old work folders ran seventeen minutes ago. 44 folders open, 2 still need a human decision eventually; neither is urgent.
- Your working copy is on `main` and fully up to date. The same two settings files still show local edits (`.claude/settings.json`, `.claude/settings.local.json`) — yours, untouched by me.

## What's moving

- The [slice aftermath re-authoring](https://linear.app/threadbare/issue/THR-973) merged at 13:35 UTC — the five slice endings now say how the encounter actually ended and each costs something. That is what unblocked the consequence verdict, and what the readiness check was then able to play against.
- Your two asks from this morning — *"I'd like to test all the different aftermaths"* and *"an assessment of whether the encounter popups follow our UX Laws"* — are both on the board as tickets now, [THR-1030](https://linear.app/threadbare/issue/THR-1030) and [THR-1031](https://linear.app/threadbare/issue/THR-1031).

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
