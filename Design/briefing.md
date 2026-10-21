# Briefing
**Generated:** 2026-10-21 09:57 local (07:57 UTC) · keep-work-flowing-cc

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

**Backed up: 28 ready, 2 in progress (both unassigned between runs).**

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) is parked, unassigned, about 15 hours. No branch, no pull request, and no named local worktree holds work for it (checked this run). It waits on the ask above.
- [Undertakings in the economy, slice 1](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open) is built and open as [PR #2510](https://github.com/christianspliid-ui/threadbare/pull/2510): founded towns get a ruler and pay their founder, founded trade roads pay a toll, founded guilds get a calling. It is held back from merging on purpose until the builder reviews its last three fixes. Its worktree is clean, so nothing is stranded. The builder is running now (started 07:24 UTC) and is expected to do that review.
- Shipped since the last brief: [the map stops naming hidden elder ruins and undiscovered anomalies](https://linear.app/threadbare/issue/THR-1960/the-map-names-undiscovered-elder-ruins-place-labels-draw-for-every), live.
- No ticket has sat in the queue for more than a week without being touched.

## Health

- All green. The live site is current (1bd908f0). Main's checks and the three background jobs are green, all 13 scheduled lanes are on time, and the one open PR is the THR-1937 hold above.
- Overnight quiet: no lane ran from about 22:20 last night until 08:01 this morning. Overnight gaps are normal by your ruling, so this is not an ask.
- Engine speed is normal: 144 ms per tick, 2% above the week's typical 141.
