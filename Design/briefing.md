---
needsChristian: thr-907-verdict-askable, thr-961-sound-feel, thr-962-nudge-stage-cues, thr-946-settings-visit, thr-947-stuck-closeout, thr-931-stuck-closeout, thr-792-stuck-closeout
queue: backed-up
freshness: dirty
deploy: deployed
tasks: ok
---
# Briefing

**Generated:** 2026-08-02 16:01 local (2026-08-02 14:01 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## From Christian

**You asked, at 10:36Z:** *"What do you mean by ticking? If the work in progress is done and you can validate the output without me please do so. If not what is it I need to evaluate?"*

**"Ticking" means one thing only: flipping a ticket's status to Done.** Not a review, not a sign-off, not an evaluation — just moving the card out of the "in progress" column. That was jargon on my side, and it made three trivial items look like they were asking you for judgement. They weren't.

**On "validate it yourself": you're right, and I did.** All three are genuinely finished — I re-checked two of them directly this run rather than trusting the earlier note, and confirmed the settings change is live. There is nothing there for you to evaluate.

**The reason they still sit there is a standing rule, not a missing verification:** the project instructions forbid any automated agent from marking a ticket Done. Closure is supposed to happen by itself when the code merges, and for these three that automation missed for boring mechanical reasons. So they stall.

**Your instruction changes that rule, and I've routed it rather than acted on it.** This hourly task is deliberately read-only — it writes this briefing and nothing else, so it can't be the thing that starts closing tickets. Changing the rule so agents may close work they have verified is a genuine change to the standing instructions, and it is now queued for the next executor session. **Nothing more is needed from you on it.**

**What actually needs your evaluation is items 1 and 2 below** — the encounter slice and the two sound questions. Those are taste calls no agent can make. Item 4 is the three you just asked about, and it stays on the list only until either you tick them or the rule change lands.

## Needs Christian

### 1. The encounter verdict — play the five-encounter slice and rule on it

*Unchanged, and still the one thing that moves the game forward.* Everything it was waiting on is finished and live. What's left is a sitting, not a decision made cold: play the slice and rule on five things — does the prose read right, does the firing rhythm feel right, can you see the consequences of what you did, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of the five; it closes the question and charters the follow-up.

**What it holds:** all encounter-writing work — eleven content tickets — plus one downstream question about four finished capital-city templates (a council mediation, a noble's court, a house unification, and raising a monument). Those four are written, tested, and sitting on a shelf; once the format is settled they either land as-is and get tidied up alongside the seven earlier ones, or the branch is dropped and they are re-written to the new standard. Both are cheap from here. **Nothing decays while you decide** — say the word in chat whenever you want it prepped.

**One caveat, so a sighting during play is not misread:** there is a known cosmetic defect where a nudge card can print a raw `{they}` instead of a name. It is *not* one of the interface defects you enumerated, it is already ticketed, and it does not affect the five things you would be ruling on.

*— raised again by the orchestrator lane's 13:27Z run, for the eleventh run running.*

### 2. The new encounter sounds — two questions only your ears can answer

Both shipped yesterday morning and neither has been heard by a human yet. Neither is a technical call an agent can make.

- **[Do the new encounter sounds feel right?](https://linear.app/threadbare/issue/THR-961)** Every knob — volume, tone, timing — is already exposed and ready to turn. This just needs you to play through a few encounters, listen, and say what to change. It is the cheapest item on this list. *One specific thing worth listening for:* the spec pinned exact notes for three of the nine reaches — Iron, Eye and Heart. The other six were extrapolated to fit the pattern. Whether those six carry the right **meaning** for their reach is a taste call, not a maths one.
- **[Should the encounter screen carry these sounds at all?](https://linear.app/threadbare/issue/THR-962)** The sound design was built for the *older* encounter screen — the one that got quietly replaced by the nudge-card interface months ago, without anyone updating the sound work to match. Re-pointing it at the screen players actually see is a small change. But the old design was a five-beat held breath over a row of three cards, and the nudge stage has a different rhythm entirely. So: does that cue design suit the screen you have now, does it want re-timing, or does the sound spec want rewriting for the new shape?

**Both are worth answering in the same sitting as the slice playthrough** — you would be listening either way.

### 3. One visit to the GitHub settings screen — two switches *(new this hour)*

The work that needed doing here was finished and merged this morning; what is left is two toggles nobody but you can reach. Both are about the same recurring annoyance: **finished changes queue up behind each other and re-run their ~10-minute checks for no reason**, which is why some small fixes take hours to land rather than minutes.

- **Turn on the merge queue for the main branch.** This became available only when the repo went public yesterday. With it on, changes line up and get tested against what they will actually merge into, once — instead of each one being knocked to the back of the line every time something else lands. I verified this run that it is genuinely not switched on yet.
- **Delete the older of the two protection rules on the main branch.** There are currently two overlapping rulebooks guarding it, and they disagree. The older one is the sole reason a finished change gets pushed to the back of the queue at all. The newer one already covers everything that matters. I read both directly this run to confirm which is which.

**Neither is urgent and nothing is broken** — this is the fix for a persistent tax, not an outage. It is one screen and about two minutes. *The middle ticket in item 4 can be ticked in the same visit.*

### 4. Three finished jobs are stuck in the "in progress" column

**This is the item you asked about above** — see "From Christian". None of them needs work or review: all three are done and verified. They sit because agents are not permitted to mark anything Done, and the automation that normally does it missed. **Either tick them, or leave them and let the rule change you asked for clear them.**

- **[Moving the hourly status files off the main branch](https://linear.app/threadbare/issue/THR-947)** — shipped and measured. Hourly paperwork used to account for 4 of every 10 merges to the main line; it is now 0, with the lanes proven still running. This briefing is the thing it moved.
- **[Turning on the fast documentation check](https://linear.app/threadbare/issue/THR-931)** — you already did this on 2026-08-01. **I re-verified it live this run rather than repeating the earlier claim:** it is switched on and active. *One line of our own instructions still claims otherwise — that correction is an agent's job, already queued, and needs nothing from you.*
- **[Fixing a wrong note in the weekly housekeeping script](https://linear.app/threadbare/issue/THR-792)** — the correction shipped six days ago under a neighbouring ticket's number, which is why nothing ever closed it.

## Queue

**Backed up — 60 items ready for an agent to pick up, roughly flat on last hour.** Planning stays comfortably ahead of execution, which is the safe direction. No action needed from you.

Five items have gone quiet (untouched 7+ days): two action-art tickets, the company action cards, and two group-naming defects. All low priority, none blocking anything — flagged only so they do not rot unseen. A sixth crosses that line tomorrow morning.

**Five jobs are parked mid-flight, and none of them is stalled work.** Three are the finished-but-unticked rows above. The fourth is the merge-queue item now waiting on your settings visit. The fifth is the capital-city template batch, deliberately held behind the encounter verdict — a hold, not a stall, and it is folded into item 1. **The executor lane itself is free and drawing from the queue normally.**

## Freshness

Home tree is on `main` and fully current — nothing behind, nothing stranded, and the hourly sync is demonstrably keeping pace (it fast-forwarded on the hour, most recently at 15:50). Two of our own settings files carry local edits and two retro drafts sit untracked; **I checked rather than assumed, and neither is blocking anything** — they would only matter if an incoming change touched the same files, which has not happened. Housekeeping ran on time at 15:40, with two old work folders still awaiting a human call. Production is serving the latest commit, the merge gate is healthy, no pull requests are stuck, and all nine scheduled lanes are running on schedule.

## What's moving

Since the last brief, aftermath consequence chips and the test-panel/card-iconography pass both landed and closed — the fourth and fifth tickets off your 2026-08-02 encounter review. The merge-queue groundwork shipped this morning and is what produced item 3. The documentation-only drain continues to clear small defects in the background.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
