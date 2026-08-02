---
needsChristian: thr-907-verdict-links-ready, thr-961-sound-feel, thr-962-nudge-stage-cues, thr-946-settings-visit, thr-947-stuck-closeout, thr-931-stuck-closeout, thr-792-stuck-closeout
queue: backed-up
freshness: dirty
deploy: skipped
tasks: ok
---
# Briefing

**Generated:** 2026-08-02 17:01 local (2026-08-02 15:01 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## From Christian

**You asked, at 14:08Z:** *"i need a link to click to be able to give the verdict, to the right evironment please"*

**Done — the links are item 1 below, and I clicked them myself this run rather than handing you untested URLs.** They point at the live public site, not a local dev server, so they work from any device including your phone.

**What I actually checked, so you know what the links are worth:** I loaded the first one, confirmed the encounter opens on its own with the real prose, the actor, the step and the nudge card rendered — not a blank screen or a loading state. I then loaded the free-play link and confirmed the world builds with no errors in the browser console. Both took about a minute.

**One correction to last hour's brief, and it changes what you are being asked to do.** I said you would be ruling on *five* things, including whether consequences are visible after a hand resolves. **That is wrong** — you split the consequence verdict out into its own later session in chat this morning, precisely because the aftermath work was agreed unfinished and ruling on it now would waste the ruling. **You are ruling on four: prose, firing, interface, and fun.** Ignore how the aftermath feels; it is a known building site.

## Needs Christian

### 1. The encounter verdict — here are the links, one click each

*This is the one thing that moves the game forward, and the only thing that was missing is now supplied.* You are ruling on **four** things (see the correction above): does the prose read right, does the firing rhythm feel right, is the interface out of the way, and **is deciding actually fun**. "Needs another iteration" is a perfectly good ruling on any of them — it closes the question and charters the follow-up.

**Play the five encounters — each link drops you straight into that one:**

1. **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)** — a failing bridge, and the family that keeps it swears it will hold.
2. **[Snow on the Pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)** — a test, and then living with how it went.
3. **[Riders Behind the Caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)** — work out what is following you before you decide what to do about it.
4. **[A Bargain at the Crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)** — a promise that comes due about eleven days later, on its own.
5. **[The Swindled Family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)** — you can walk past this one. That is the point of it.

Each link stamps your avatar as evenly capable across the board, so nothing is skewed by the seeded character's strengths and a risky-looking step really is risky.

**Then, for the firing verdict only — [free play, everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&testavatar&forceencounters).** Press play and let it run. **This is the one that cannot be judged from the five links above**, because it is about rhythm: how often things interrupt you, whether that cadence feels alive or naggy, and what your first instinct is to cut. The five direct links show you encounters on demand; only this one shows you the pace.

**What the verdict holds:** all encounter-writing work — eleven content tickets — plus four finished capital-city templates sitting on a shelf (a council mediation, a noble's court, a house unification, and raising a monument). Once the format is settled they either land as-is and get tidied up alongside the earlier seven, or the branch is dropped and they are re-written to the new standard. Both are cheap from here. **Nothing decays while you decide.**

**One caveat, so a sighting during play is not misread:** there is a known cosmetic defect where a nudge card can print a raw `{they}` instead of a name. It is already ticketed, it is not one of the four things you are ruling on, and it is not a regression.

*— raised again by the orchestrator lane's 14:27Z run, for the twelfth run running.*

### 2. The new encounter sounds — two questions only your ears can answer

Both shipped yesterday morning and neither has been heard by a human yet. Neither is a technical call an agent can make. **The links in item 1 work for these too** — put the sound on and play the same encounters.

- **[Do the new encounter sounds feel right?](https://linear.app/threadbare/issue/THR-961)** Every knob — volume, tone, timing — is already exposed and ready to turn. This just needs you to listen and say what to change. It is the cheapest item on this list. *One specific thing worth listening for:* the spec pinned exact notes for three of the nine reaches — Iron, Eye and Heart. The other six were extrapolated to fit the pattern. Whether those six carry the right **meaning** for their reach is a taste call, not a maths one.
- **[Should the encounter screen carry these sounds at all?](https://linear.app/threadbare/issue/THR-962)** The sound design was built for the *older* encounter screen — the one replaced by the nudge-card interface months ago, without the sound work being updated to match. Re-pointing it is a small change. But the old design was a five-beat held breath over a row of three cards, and the current screen has a different rhythm entirely. So: does that cue design suit the screen you have now, does it want re-timing, or does the spec want rewriting for the new shape?

**Both are worth answering in the same sitting as the playthrough** — you would be listening either way.

### 3. One visit to the GitHub settings screen — two switches

*Unchanged from last hour.* The work that needed doing was finished and merged this morning; what is left is two toggles nobody but you can reach. Both are about the same recurring annoyance: **finished changes queue up behind each other and re-run their ~10-minute checks for no reason**, which is why some small fixes take hours to land rather than minutes.

- **Turn on the merge queue for the main branch.** This became available only when the repo went public yesterday. With it on, changes line up and get tested against what they will actually merge into, once — instead of each one being knocked to the back of the line every time something else lands.
- **Delete the older of the two protection rules on the main branch.** There are two overlapping rulebooks guarding it, and they disagree. The older one is the sole reason a finished change gets pushed to the back of the queue at all. The newer one already covers everything that matters.

**Neither is urgent and nothing is broken** — this is the fix for a persistent tax, not an outage. One screen, about two minutes. *The middle ticket in item 4 can be ticked in the same visit.*

### 4. Three finished jobs are stuck in the "in progress" column

None of them needs work or review: all three are done and verified. They sit because agents are not permitted to flip a ticket to Done, and the automation that normally does it missed. **Either flip them yourself, or leave them and let the rule change you asked for yesterday clear them** — that change is queued for an executor session and needs nothing further from you.

- **[Moving the hourly status files off the main branch](https://linear.app/threadbare/issue/THR-947)** — shipped and measured. Hourly paperwork used to account for 4 of every 10 merges to the main line; it is now 0, with the lanes proven still running. This briefing is the thing it moved.
- **[Turning on the fast documentation check](https://linear.app/threadbare/issue/THR-931)** — you already did this on 2026-08-01; verified live and active. *One line of our own instructions still claims otherwise — an agent's job, already queued, needs nothing from you.*
- **[Fixing a wrong note in the weekly housekeeping script](https://linear.app/threadbare/issue/THR-792)** — the correction shipped six days ago under a neighbouring ticket's number, which is why nothing ever closed it.

*Two other lanes reached the same conclusion independently this morning and both recommend closing all three.*

## Queue

**Backed up — 60 items ready for an agent to pick up, flat on last hour.** Planning stays comfortably ahead of execution, which is the safe direction. No action needed from you.

Five items have gone quiet (untouched 7+ days): two action-art tickets, the company action cards, and two group-naming defects. All low priority, none blocking anything — flagged only so they do not rot unseen.

**Five jobs are parked mid-flight, and none is stalled work.** Three are the finished-but-unflipped rows above. The fourth is the merge-queue item waiting on your settings visit. The fifth is the capital-city template batch, deliberately held behind the encounter verdict — a hold, not a stall, folded into item 1. **The executor lane itself is free and drawing from the queue normally.**

## Freshness

Home tree is on `main` and fully current — nothing behind, nothing stranded, and the hourly sync is demonstrably keeping pace (it fast-forwarded 13 commits at 16:50). Two of our own settings files carry local edits; **I checked rather than assumed, and they are not blocking anything.** Housekeeping ran on time at 16:40, with two old work folders still awaiting a human call. The live site is up to date — recent commits touched only notes and docs, so no rebuild was needed. The merge gate is healthy, no pull requests are stuck, and all nine scheduled lanes are running on schedule.

## What's moving

Quiet hour on the board — no tickets closed since the last brief, and the ready queue held flat at 60. The documentation-only drain continues clearing small defects in the background. The encounter work stays where it has been for twelve runs: finished, deployed, and waiting on the verdict in item 1 — which, as of this hour, is no longer waiting on anything from us.

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
