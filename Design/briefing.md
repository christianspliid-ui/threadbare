# Briefing
**Generated:** 2026-10-21 10:53 local (08:53 UTC) · keep-work-flowing-cc

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

From [the design lane yesterday midday, run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20c.md) (veto day ends about 12:30 today):

- [Reward category shares still fold into item weights](https://linear.app/threadbare/issue/THR-1890/reward-category-shares-still-fold-into-item-weights-decide-whether): a reward draw rolls its **rarity first, exactly as today**. Then it picks **the kind of reward the scene asked for** (a thing, a condition or a power) by the scene's own shares, and only then the item. Rarity and Legendaries do not change. On scenes that offer several kinds, **permanent powers come up about twice as often** (8% → 16% of those prizes). *Veto:* "keep today's mix of rewards".

Say 'veto <title>' to reverse any of these.

## From Christian

- **08:17 UTC:** *"of course you can edit the gate and ci files"*. That answers the THR-1947 ask: the unattended builder may edit the gate, CI and Definition-of-Done files. **For the builder:** un-park [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) (High) and run it, then [Run the review gate only on large changes](https://linear.app/threadbare/issue/THR-1949/run-the-review-gate-and-four-part-browser-evidence-only-on-engine). Record *"human gate satisfied via chat review 2026-10-21"* on both. The earlier refusal came from the harness's permission layer, so the builder may need a permission rule for those paths (a harness change, shipped directly). The [backlog-grooming ask](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-21.md) about the same thing is answered by this and dropped.

## Queue

**Backed up: 28 ready, 2 in progress (both unassigned between runs).**

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is parked, unassigned, about 16 hours. No branch, no pull request, and no local worktree holds work for it (checked this run). Christian's go-ahead above unblocks it.
- [Undertakings in the economy, slice 1](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open) is open as [PR #2510](https://github.com/christianspliid-ui/threadbare/pull/2510), not armed. The review gate's second pass left one finding open after its two-round cap; the builder holds the merge until it is settled. That is builder work. The PR branch is pushed, so nothing is stranded.
- No ticket has sat in the queue for more than a week without being touched.

## Health

- The live site is current (1bd908f0). Main's checks and the three background jobs are green, and all 13 scheduled lanes are on time.
- Engine speed reading: "tick cost 189 ms/tick steady, 33% above the 7-day median (142, 113 rows since aff531dc); top phase agent_decision, 621 agents. Name the merges between aff531dc and 1bd908f0: git log --oneline --merges aff531dc..1bd908f0". The same commit measured 144 an hour ago, and the cold playtest lane started on this machine during the measurement, so this is probably machine load. Next hour's reading will tell.
- Overnight quiet: no lane ran from about 22:20 last night until 08:01 this morning. Overnight gaps are normal by your ruling, so this is not an ask.
