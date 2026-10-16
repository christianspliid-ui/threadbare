---
lane: tb-design-lane
run: 2026-10-16c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-16 (run c, ~10:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The encounter firing plan](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once): **your "prune later" is answered by measurement, and nothing gets a count cap.** I watched The First live 50 days in three worlds with no spawn links ([what I measured](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-16-thr-1218-natural-firing-baseline.md)). The pruning has mostly already happened: two-thirds of her encounters are chores that never ask, and she rests two days after every story. What you would notice instead is the same story coming back (one tale five times in 50 days) and stretches of up to twelve days with no story at all. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-16-thr-1218-encounter-firing-rhythm.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-16-thr-1218-encounter-firing-rhythm-brainstorm.md)) *Veto:* **"the world should stop less often"**.
- Same plan — **a mortal you follow tells one story at most twice per run** while another story is within reach; after twelve days with no story, a retelling is allowed again. *Veto:* **"retold stories are fine"**.
- Same plan — **a mortal you follow who has had no story for six days, and has none nearby, takes to the road** toward the nearest place that has one. The Chronicle says "Thessa grows restless and takes the road to Greywater." ([its build ticket](https://linear.app/threadbare/issue/THR-1959/firing-rhythm-s2-the-restless-road-a-followed-mortal-with-no-story)) *Veto:* **"my mortals should stay home"**.
- Same plan — **no cap on chapters, no shared limit across the mortals you follow, no limit on similar kinds of story.** Your density ruling says the game never rations chapters, and similar kinds of story measured as no problem (1 repeat in 43). *Veto:* **"cap how often the world stops"**. That would change the law, so it is your call.

## Work

- **Claimed** [the encounter firing pruning pass](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once) (claim `2026-10-16c`). No vetoes in the briefing, no open maps, and the shelf is full. The two economy plans ([the god's stake](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground), [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open)) are still inside their veto day. This was the next agreed plan: your 2026-08-10 "prune later", with a design request on it since 2 October, and both of its preconditions done.
- **Measured** before deciding. The natural-firing census ran on main `617802fb`, seeds 42 / 7 / 1234, 600 ticks each. The First gets about one encounter a day; 67% are chores. Story chapters: 18 / 10 / 13. The tightest gap between them is 23–26 ticks, which is the story breath. One template repeated five times. The longest droughts were 90 / 142 / 82 ticks. **Open question for the build:** half of her story chapters produced only an aftermath notice in the headless run, probably a harness artifact. Slice 1 must explain it before anything builds on it.
- **Gates:**
  - Intent judge: **Allow** on the first pass. Its four advisory notes are folded in: kill criteria, a fixed gap bound, the rulebook split per slice, and a file list.
  - Audits: NFP **PASS-with-notes**, pillars **PASS**, Vision **PASS-with-notes**. The Vision audit notes that the plan answers its own drift signal, "same encounter fires twice in a run".
  - Plan-doc lint, generated freshness and impediment ids are green.
- **PR** [#2446](https://github.com/christianspliid-ui/threadbare/pull/2446), auto-merge armed.
- **Handed off** to Ready for Dev with `Claimable from: 2026-10-17T11:00:00Z`, so you get the veto day.
- **Filed** [Firing rhythm part 2: the restless road](https://linear.app/threadbare/issue/THR-1959/firing-rhythm-s2-the-restless-road-a-followed-mortal-with-no-story) (Todo; blocked by part 1).

## Escalations

None.
