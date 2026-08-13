# Briefing

**Generated:** 2026-08-14 01:57 local (2026-08-13 23:57 UTC) · keep-work-flowing-cc

## The one thing

**Nothing needs you right now.** Sixth brief running, and the campaign that has been carrying the last three of them just posted its third batch in four hours.

**The build family stops reading as mad-libs** ([THR-1101](https://linear.app/threadbare/issue/THR-1101), [PR #1436](https://github.com/christianspliid-ui/threadbare/pull/1436), merged 01:30). All 16 `build` templates drained — the forge, the tower, the bridge, the harbour, the temple, the frontier settlement, the siege works, down to patching walls and digging wells. 123 token-carrying lines authored into real prose, in a single Builders-Fellowship voice. **Remaining: 118 templates**, down from 135 an hour ago.

The interesting part is a finding the executor could only have got by doing the work:

- **The family held two failure shapes, not one.** Seven templates were true mad-libs — the shape batches 1 and 2 met. The other **nine were already-authored prose with tokens wedged into finished sentences**, and that is where the corpus's outright ungrammatical output was coming from: `patch_the_walls` promised a wall would *"stand another generation at {adj} least"*. Those nine needed surgical removal, not rewriting. Its own conclusion, worth keeping: **a family's token count does not size its authoring load** — so the remaining 118 will not burn down at a predictable rate, and the batch estimates should not be trusted as a schedule.
- **Three grammar defects caught by rendering, not by reading** — again. `{They}` resolves to a *singular* pronoun, so a bare verb after it renders *"She proceed with a compromise"*. Two of the three were pre-existing, sitting in the corpus before this batch touched it.

*Nothing here is queued on you.*

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 10 ready, 2 in flight. Nothing blocked on you.**

- **[THR-1101](https://linear.app/threadbare/issue/THR-1101) is three batches deep and still running.** It correctly stays In Dev; 118 templates is a campaign, not a ticket. This is the live content pipeline and it is feeding itself.
- **[THR-1082](https://linear.app/threadbare/issue/THR-1082) is the other item in flight**, parked ~31 hours with nobody holding it — deliberate and documented, so the WIP slot is correctly free. Its [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) has not moved and **now conflicts with `main` in three files**, two of them the very engine file it rewrites (`aftermathWords.ts` and its test). Every hour it sits, the merge gets more expensive. Still an executor problem, not yours.
- **Yesterday's warning is not yet due.** Last night I said that if that merge were still stuck by *tomorrow evening* it stops being a merge problem and becomes a supply problem worth your attention. That is tomorrow evening, not 2 a.m.; work is flowing in the meantime — three content merges since the line was written.
- **Three player-facing items remain on the shelf**: the encounter tone tier that is wired but never fed ([THR-1102](https://linear.app/threadbare/issue/THR-1102)), and two surfaces still showing raw key:value labels ([THR-1103](https://linear.app/threadbare/issue/THR-1103), [THR-1104](https://linear.app/threadbare/issue/THR-1104)). The rest is process tidying. None of it needs you.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991), untouched 11 days.

## Health

**Deploy, CI, both scheduled workflows and all nine task heartbeats are green**, and the copy of the repo on your machine is current with `main`. Three executor-side items, none of them yours:

- **[PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415)'s hold still needs re-judging by an agent, and this lane still has no way to reach one.** The hold cites only the capture route that fails in unattended runs; [CLAUDE.md](https://github.com/christianspliid-ui/threadbare/blob/main/CLAUDE.md) sanctions a second one that works there. That recommendation has now sat in five briefs unread, because the executor lane reads Linear and not this file. **The structural finding stands: this lane can recommend to you and cannot recommend to an agent.** Logged for Friday's retro rather than handed to you.
- **Tonight's orchestrator run and yesterday's grooming run both still label that pixel pass as needing you.** Holding the line: gate calibration is an agent verdict under [rule 4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md), your 2026-08-12 ruling. Flagged so you know the disagreement exists, not to hand it back.
- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own. That job ran healthy at 01:40.
- **Overnight quiet, declined as normal** — the same nightly shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is re-flagged by the probe every run; it was recorded resolved on 12 August and handed to Friday's retro, so it stays declined rather than re-raised.
