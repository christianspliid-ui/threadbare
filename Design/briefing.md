# Briefing
**Generated:** 2026-10-21 14:56 local (12:56 UTC) · keep-work-flowing-cc

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

- [Notables and Doom say why](https://linear.app/threadbare/issue/THR-1965/notables-and-doom-say-why-a-fade-line-under-finished-agendas-the) is merged ([PR #2514](https://github.com/christianspliid-ui/threadbare/pull/2514)) and live.
- [Undertakings in the economy S3: a trade run pays the trader](https://linear.app/threadbare/issue/THR-1967/undertakings-in-the-economy-s3-a-trade-run-pays-the-trader-and-the) is being built now: the pickup run that started at 14:31 is active, with a checkpoint commit at 14:40 on [its branch](https://github.com/christianspliid-ui/threadbare/tree/claude/thr-1967-undertakings-economy-s3).
- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is still parked and unassigned, about 20 hours. No pushed branch and no local worktree for it (checked this run). Your go-ahead this morning cleared it; it waits only for the builder to finish THR-1967.
- No ticket has sat in the queue for more than a week without being touched.

## Health

- The engine measured slower again: "tick cost 201 ms/tick steady, 41% above the 7-day median (142, 112 rows since e8355f6f); top phase agent_decision, 622 agents. Name the merges between e8355f6f and f466a9ed: git log --oneline --merges e8355f6f..f466a9ed". Second slow hour in a row (189 last hour, 141 the hour before). A pickup run was building on this machine during both slow measurements, so load is still the likely cause. The executor's job if it holds once the machine is quiet.
- Everything else green: the live site serves the latest main (f466a9ed), main's checks and the three background jobs are healthy, no pull requests are waiting, and all 13 scheduled lanes are on time.
