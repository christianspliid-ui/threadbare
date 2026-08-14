# Briefing

**Generated:** 2026-08-14 02:56 local (2026-08-14 00:56 UTC) · keep-work-flowing-cc

## The one thing

**Nothing needs you right now.** Seventh brief running. The campaign carrying the last four of them landed batch 4 half an hour ago.

**The trade family stops reading as mad-libs** ([THR-1101](https://linear.app/threadbare/issue/THR-1101), [PR #1437](https://github.com/christianspliid-ui/threadbare/pull/1437), merged 02:30). All 15 token-carrying `trade` templates authored out of the `{adj}`/`{verb}`/`{noun}` shape — 109 token lines, in a Merchant-Consortium voice: the caravan deal, the guild negotiation, the smuggler's pact, the haggle, market day, the dead drop. **Remaining: 103 templates**, down from 118 an hour ago.

Two findings worth keeping, both of which only appear by doing the work:

- **Last hour's "two failure shapes" finding replicated, and is now a rule.** `trade` split **7 true mad-libs to 8 already-authored sentences with tokens wedged in** — near-identical to `build`'s 7/9. The wedged half again produced the worse readings, because a parasite on a good sentence is more conspicuous than uniform noise: a merchant leaving a stall *"{adj}-handed"* where the sentence plainly wanted *empty*-handed; a failure opening *"Something {verb}s in translation"*. The scoping consequence is now written down — **grep the lines, then read a sample before committing to a slice**, because 109 lines here cost what 82 did two batches ago and 123 did last batch.
- **Third batch running that rendering caught grammar reading could not.** `{They}` resolves to a *singular* pronoun, so a bare verb after it renders *"Knowing what she hold matters less than knowing what she need"*. One of the three was introduced by this batch; the rest were already sitting in the corpus.

*Nothing here is queued on you.*

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 10 ready, 2 in flight. Nothing blocked on you.**

- **[THR-1101](https://linear.app/threadbare/issue/THR-1101) is four batches deep and still running**, correctly staying In Dev. Four families drained in about six hours (story beats, duel, build, trade); 103 templates left. This is the live content pipeline and it is feeding itself without a single handoff.
- **[THR-1082](https://linear.app/threadbare/issue/THR-1082) is the other item in flight**, parked ~32 hours with nobody holding it — deliberate and documented, so the WIP slot is correctly free. Its [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) still has not moved and still conflicts with `main` in three files, two of them the engine file it rewrites (`aftermathWords.ts` and its test). Every hour it sits, the merge gets more expensive. Still an executor problem, not yours.
- **Yesterday's warning comes due tonight.** I said that if that merge were still stuck by *this evening* it stops being a merge problem and becomes a supply problem worth your attention. It is 3 a.m., not evening — so this is a note that the clock is running, not the ask itself. Work is flowing in the meantime: four content merges since the line was written.
- **Three player-facing items remain on the shelf**: the encounter tone tier that is wired but never fed ([THR-1102](https://linear.app/threadbare/issue/THR-1102)), and two surfaces still showing raw key:value labels ([THR-1103](https://linear.app/threadbare/issue/THR-1103), [THR-1104](https://linear.app/threadbare/issue/THR-1104)). The other seven are process tidying. None of it needs you.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991), untouched 11 days.

## Health

**Deploy, CI, both scheduled workflows and all nine task heartbeats are green**, and the copy of the repo on your machine is current with `main`. Three executor-side items, none of them yours:

- **[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415)'s hold still needs re-judging by an agent, and this lane still has no way to reach one.** The hold cites only the capture route that fails in unattended runs; [CLAUDE.md](https://github.com/christianspliid-ui/threadbare/blob/main/CLAUDE.md) sanctions a second one that works there. That recommendation has now sat in six briefs unread, because the executor lane reads Linear and not this file. **The structural finding stands: this lane can recommend to you and cannot recommend to an agent.** Logged for Friday's retro rather than handed to you.
- **Last night's orchestrator run and yesterday's grooming run both still label that pixel pass as needing you** — grooming's words: *"in your next attended session, open the seeded build, look at two encounters across two outcome bands, and if it reads right, arm auto-merge."* Holding the line: gate calibration is an agent verdict under [rule 4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md), your 2026-08-12 ruling, and [rule 5](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) independently disqualifies the look while [THR-1097](https://linear.app/threadbare/issue/THR-1097)'s content pass is still `Todo`. Flagged so you know the disagreement exists, not to hand it back.
- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own. That job ran healthy at 02:40.
- **Overnight quiet, declined as normal** — the same nightly shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is re-flagged by the probe every run; it was recorded resolved on 12 August and handed to Friday's retro, so it stays declined rather than re-raised.
