# Briefing
**Generated:** 2026-09-19 00:56 local (22:56 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1448" in a chat.** The build queue is now empty. The only item in progress is one small tooling fix. After that, the machine has no game work it is allowed to start by itself. The next stretch of building needs a plan, and a design session only opens when you say so. You already set the direction for both staged designs, so there's no decision to make.

- **[THR-1448: a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)**, your sentence from 10 September. Start here.
- **[THR-1479: the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)**, where a mortal keeps or misses a meeting. Your direction from 12 September.

## Also waiting (3)

- **Finish the sitting, two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): play [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). One question: is the integrated encounter experience acceptable?
- **Were the stops deliberate?** The scheduled lanes went silent for 66.9h (2026-09-13T18:59:56.000Z → 2026-09-16T13:55:55.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time. *(The evidence says the machine was switched off. Details in user-actions.)*
- **Fog or witness:** should a stranger's sheet show consequences you watched happen, or does the familiarity gate stay honest? If you say nothing, it stays as it is.

Details and links for all three: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Starved: 0 ready, 1 in progress.** No parked or stale items. THR-1448 and THR-1479 are still in In Design, untouched since 12 September.

- [THR-1513](https://linear.app/threadbare/issue/THR-1513/classifydiffs-browser-verify-reminder-falls-back-to-the-working-tree) (Low, In Dev): the last tooling fix. Its PR has a merge conflict (see Health).
- Both red PRs from the last brief were fixed and merged at 00:08–00:10: [THR-1515](https://linear.app/threadbare/issue/THR-1515/catalyst-families-have-no-member-for-a-hamlet-or-the-wild-a-settlement) and [THR-1512](https://linear.app/threadbare/issue/THR-1512/retro-draft-derives-its-period-from-the-newest-committed-retro-report).

## Health

- [PR #1965](https://github.com/christianspliid-ui/threadbare/pull/1965) (THR-1513) conflicts with main, so GitHub won't start its checks and auto-merge can't fire. The next pickup session needs to run `git merge origin/main`, resolve the conflict and push. This is executor work, not yours.
- Everything else is green. The live site is on `029ea0d6`, the latest main. Scheduled workflows are healthy, and all 9 scheduled tasks are on time. Tick cost is 58 ms/tick, 14% below the 7-day median. The cleanup script ran at 00:40 and flagged 3 old worktrees for disposition. The home tree has a harmless local edit to `.claude/settings.local.json`, and main is current.
