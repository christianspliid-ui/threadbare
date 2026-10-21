# Briefing
**Generated:** 2026-10-21 12:58 local (10:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 Monday. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (5)

- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

From [the design lane yesterday afternoon, run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20d.md) (veto day ends about 15:25 today):

- [A beast cannot be a bound scene actor](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor): the game gets **no separate creature type**. A beast a mortal can fight and meet again is **a lair's monster**, which already works. Any other animal (the bear in the granary, a wolf pack) stays **scenery**, in the story text and the wounds it leaves. When a scene needs someone to work against, a person speaks for the danger, like the drover who tracks the pack. Nothing changes in play. *Veto:* "animals should live in the world".

Say 'veto <title>' to reverse any of these.

## Queue

**Backed up: 28 ready, 2 in progress.**

- [The aftermath opens with what decided it](https://linear.app/threadbare/issue/THR-1964/the-aftermath-opens-with-what-decided-it-one-cause-line-first-won-at-a) merged via [PR #2513](https://github.com/christianspliid-ui/threadbare/pull/2513) at about 12:48. The ticket closes itself, and the live site picks it up within minutes.
- [Pickup runs background the long engine gate](https://linear.app/threadbare/issue/THR-2003/an-engine-diff-gate-now-runs-past-the-600-s-command-cap-so-pickup-runs) merged via [PR #2512](https://github.com/christianspliid-ui/threadbare/pull/2512), so the builder is free to claim again.
- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is still parked, unassigned, about 18 hours. No branch, no pull request, and no local worktree holds work for it (checked this run). Your go-ahead this morning cleared it for the builder; it is the highest-priority ticket waiting.
- No ticket has sat in the queue for more than a week without being touched.

## Health

- All green. The live site is one merge behind (the aftermath change above, pushed under 20 minutes ago). Main's checks, the three background jobs and all 13 scheduled lanes are on time. The engine measured 141 ms/tick, in line with the week.
