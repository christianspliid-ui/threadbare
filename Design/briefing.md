# Briefing

**Generated:** 2026-08-14 00:56 local (2026-08-13 22:56 UTC) · keep-work-flowing-cc

## The one thing

**Nothing needs you right now.** Fifth brief running with that verdict, and the reason keeps getting better rather than quieter.

A second batch of the mad-lib rewrite landed while you were away: **the duel family stops reading as mad-libs** ([THR-1101](https://linear.app/threadbare/issue/THR-1101), [PR #1435](https://github.com/christianspliid-ui/threadbare/pull/1435), merged 00:29). All ten duel templates — the tavern brawl, the arcane duel, the arena, the honour duel, the pirate raid, the bandit ambush, sparring with a stranger and three more — authored out of the `{adj}`/`{verb}`/`{noun}` shape into real prose. 28 steps, 82 lines. The family is now **drained**, and the live site is already serving it.

Two details worth your attention, because they are the difference between a batch and a campaign that will actually finish:

- **The executor changed its own slicing rule between batches.** Batch 1 took a *tier* (the climactic `deadly` beats); its closeout argued the next slice should be taken by **family** instead, so one run's output reads in a single voice rather than as ten unrelated encounters that happen to share a rating. Batch 2 did that. The duel family now reads as one hand wrote it.
- **It verified past the gate on purpose.** The automated check only proves no raw `{token}` leaks — it cannot tell whether a sentence reads. So every added line was rendered through the function the game actually calls and read back. That caught three lines that were clean on the page and broken once resolved: a pronoun that pointed at the wrong party, an ungrammatical substitution, and a `He`/`{actor}` collision. All three rewritten before merge.

**Remaining: 135 templates across 9 families**, `explore` (30) the largest. Stated as a predicate, so the next batch resumes without re-deriving anything.

*Nothing else is queued on you tonight.*

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 10 ready, 2 in flight. Nothing blocked on you.**

- **[THR-1101](https://linear.app/threadbare/issue/THR-1101) is drained twice over and still running.** Two batches in three hours, and it correctly stays In Dev — 135 templates is a campaign, not a ticket. This is the live content pipeline and it is moving on its own.
- **[THR-1082](https://linear.app/threadbare/issue/THR-1082) is the other item in flight**, parked ~29 hours with nobody holding it. The park is deliberate and documented; the WIP slot is correctly free. Its [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) has not moved and now conflicts with `main` in three files, one of which the duel batch touched.
- **Last night I said that if that merge were still stuck "tomorrow" it stops being a merge problem and becomes a supply problem worth your attention. The calendar rolled over an hour ago; I am not calling it.** Triggering on a midnight technicality would be dishonest — the substance has not changed, and the premise behind the warning was *no work flowing*. Work is flowing: two content merges since that line was written. I will hold the warning against the coming working day, and say so plainly if the shelf is still waiting on that one merge by tomorrow evening.
- **Three player-facing items remain on the shelf**: the encounter tone tier that is wired but never fed ([THR-1102](https://linear.app/threadbare/issue/THR-1102) — still not moot, since 135 templates keep consuming the old ladder), and two surfaces still showing raw key:value labels ([THR-1103](https://linear.app/threadbare/issue/THR-1103), [THR-1104](https://linear.app/threadbare/issue/THR-1104)). The rest is process tidying. None of it needs you.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991), untouched 11 days.

## Health

**Deploy, CI, both scheduled workflows and all nine task heartbeats are green**, and the copy of the repo on your machine is current with `main`. Three executor-side items, none of them yours:

- **[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415)'s hold still needs re-judging by an agent, and this lane still has no way to reach one.** The hold cites only the capture route that fails in unattended runs; [CLAUDE.md](https://github.com/christianspliid-ui/threadbare/blob/main/CLAUDE.md) sanctions a second one that works there. That recommendation has now sat in four briefs unread, because the executor lane reads Linear and not this file. **The structural finding stands: this lane can recommend to you and cannot recommend to an agent.** Logged for Friday's retro rather than handed to you.
- **Yesterday's grooming run and tonight's orchestrator run both still label that pixel pass as needing you.** Holding the line: gate calibration is an agent verdict under [rule 4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md), your 2026-08-12 ruling. Flagged so you know the disagreement exists, not to hand it back.
- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own. That job ran healthy at 00:40.
- **Overnight quiet, declined as normal** — the same nightly shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is re-flagged by the probe every run; it was recorded resolved on 12 August and handed to Friday's retro, so it stays declined rather than re-raised.
