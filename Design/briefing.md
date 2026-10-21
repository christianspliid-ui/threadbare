# Briefing
**Generated:** 2026-10-21 08:00 local (06:00 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** No lane ran from 20:26 Sunday until about 19:42 Monday. That is all of Monday, with 25 jobs ready for the builder. Every recent silence has the same shape: the computer starts or wakes, and the app does not reopen. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (6)

- **The builder is not allowed to edit the checks it was asked to loosen.** [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) (High) has been parked since 16:55 UTC yesterday. **Either run it with me in a session you are watching, or let the unattended builder edit the gate and CI files.** [Run the review gate only on large changes](https://linear.app/threadbare/issue/THR-1949/run-the-review-gate-and-four-part-browser-evidence-only-on-engine) will hit the same wall.
- **Sunday evening to Monday evening (18–19 Oct):** "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

From [the design lane yesterday afternoon, run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20d.md) (veto day ends about 15:25 today):

- [A beast cannot be a bound scene actor](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor): the game gets **no separate creature type**. A beast a mortal can fight and meet again is **a lair's monster**, which already works. Any other animal (the bear in the granary, a wolf pack) stays **scenery**, in the story text and the wounds it leaves. When a scene needs someone to work against, a person speaks for the danger, like the drover who tracks the pack. Nothing changes in play. The canon note is [PR #2504](https://github.com/christianspliid-ui/threadbare/pull/2504), merged. *Veto:* "animals should live in the world".

From [the design lane yesterday midday, run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-20c.md) (veto day ends about 12:30 today):

- [Reward category shares still fold into item weights](https://linear.app/threadbare/issue/THR-1890/reward-category-shares-still-fold-into-item-weights-decide-whether): a reward draw rolls its **rarity first, exactly as today**. Then it picks **the kind of reward the scene asked for** (a thing, a condition or a power) by the scene's own shares, and only then the item. Rarity and Legendaries do not change. On scenes that offer several kinds, **permanent powers come up about twice as often** (8% → 16% of those prizes), because that is what the scenes were written to give. *Veto:* "keep today's mix of rewards".

Say 'veto <title>' to reverse any of these.

## Queue

**Backed up: 29 ready, 1 in progress (parked).**

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is parked, unassigned, about 13 hours. No branch, no pull request, and no named local worktree holds work for it (checked this run). It waits on the ask above.
- [War aims S2: regional monopolies pay rent and can embargo an enemy's towns](https://linear.app/threadbare/issue/THR-1955/war-aims-s2-regional-monopolies-pay-rent-and-can-embargo-an-enemys) merged last night ([PR #2508](https://github.com/christianspliid-ui/threadbare/pull/2508)) and is live.
- The builder started a fresh run at 05:53 UTC. No ticket has sat in the queue for more than a week without being touched.

## Health

- The live site is current (2a755058). Main's checks and the three background jobs are green, no PRs are waiting to merge, and all 13 scheduled lanes are on time.
- Overnight quiet: no lane ran from about 22:20 last night until 07:53 this morning. Overnight gaps are normal by your ruling, so this is not an ask.
- Engine speed: "tick cost 181 ms/tick steady, 28% above the 7-day median (141, 113 rows since 667869d2); top phase agent_decision, 621 agents. Name the merges between 667869d2 and 2a755058: git log --oneline --merges 667869d2..2a755058". Measured again while a builder run was starting on this machine. It is the builder's to chase, not yours.
