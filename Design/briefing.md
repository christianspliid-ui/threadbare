# Briefing

**Generated:** 2026-08-14 03:55 local (2026-08-14 01:55 UTC) · keep-work-flowing-cc

## The one thing

**Open one attended session and finish the aftermath work — and I owe you a correction, because six briefs running told you this was not yours. It is.**

[THR-1082](https://linear.app/threadbare/issue/THR-1082) is built. [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) has been sitting **31 hours**, and its last remaining requirement is a screenshot of the new aftermath at full size. Every brief since yesterday morning has said an agent could take that screenshot unattended and should stop handing it to you. **That was wrong**, and reading the impediment log properly is what settled it: the automated runs cannot start the game at all — not "cannot photograph it", cannot *start* it. Nobody is present to approve the command that launches it, so there is nothing to point a camera at. The route I kept recommending assumed a running game and there never was one.

So this genuinely needs you present, and it is not a design question — nobody is asking you to judge whether the new consequence chips read well. It is the mechanical check that the new layout does not overflow or land off-screen, which is the one thing the automated substitute cannot see.

**What it unblocks:** two High-priority tickets are stuck behind that merge — [THR-1096](https://linear.app/threadbare/issue/THR-1096) (companion attachments) and [THR-1097](https://linear.app/threadbare/issue/THR-1097), the content pass that rewrites the endings themselves. THR-1097 is the reason the aftermath looked half-done when you opened it on the 13th: new chips over old writing. It cannot start until this merges.

**What to do:** open a Claude Code session on the repo and say *"finish THR-1082"*. The session can do the rest itself — the branch has also drifted into conflict with `main` in three files, and an attended session can resolve that, run the capture, and merge in one pass. Expect it to take one look, not a review.

## Also waiting (1)

- **A Tenacious-style trait** — parked design option, no ticket, no urgency; stays parked unless you say otherwise. Detail: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 10 ready, 2 in flight.**

- **[THR-1101](https://linear.app/threadbare/issue/THR-1101) is now five families deep and still running.** The `assist` family drained since the last brief ([PR #1438](https://github.com/christianspliid-ui/threadbare/pull/1438), merged 03:36) — 15 templates, 107 token lines, in a duty-and-mundane-care register. **88 templates left**, down from 103 an hour ago. Five families in about seven hours, no handoff needed.
  - The half-and-half split held a third time (6 true mad-libs to 9 authored-sentences-with-tokens-wedged-in). Three families clustering near the same ratio makes it predictive, so the next batch can scope from it instead of re-sampling.
  - Two more grammar defects fixed, **both pre-existing** — *"before she are prepared"*, *"and she carry none of the three"*. They only exist after the words get substituted in, so they are invisible in the source. The batch found them because removing a token puts your eye on a line whose other half may have been broken all along.
- **[THR-1082](https://linear.app/threadbare/issue/THR-1082) is the other item in flight** and is the ask above. Parked ~33 hours with nobody holding it, which is correct — the WIP slot stays free while it waits for you.
- **Three player-facing items on the shelf**: the encounter tone tier that is wired but never fed ([THR-1102](https://linear.app/threadbare/issue/THR-1102)), and two surfaces still showing raw key:value labels ([THR-1103](https://linear.app/threadbare/issue/THR-1103), [THR-1104](https://linear.app/threadbare/issue/THR-1104)). The other seven are process tidying.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991), untouched 11 days.

## Health

**All green.** Deploy is serving the latest commit, CI is running normally, both scheduled workflows are healthy, all nine task heartbeats are on schedule, the housekeeping job ran clean at 03:40, and the copy of the repo on your machine is current with `main`.

Two notes, neither needing you:

- **Two stale worktrees still need disposition**, both holding unmerged work the housekeeping job will not delete on its own.
- **Overnight quiet, declined as normal** — the same nightly shape as every night this week, per your 2026-08-08 ruling. The older 20.6-hour stoppage of 10→11 August is re-flagged by the probe every run; it was recorded resolved on 12 August and handed to Friday's retro, so it stays declined rather than re-raised.
