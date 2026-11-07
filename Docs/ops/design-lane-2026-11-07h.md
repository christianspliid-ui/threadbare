---
lane: tb-design-lane
run: 2026-11-07h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run h, ~23:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- ["A Work Finished" says every undertaking left something standing](https://linear.app/threadbare/issue/THR-2075) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done.md)). **When a mortal finishes a work that made nothing, the card now says what they actually did.** Taking up a relic reads "Kael takes up The Hollow Bell, left by a god of the last age…" instead of "It stands in the world now". The card uses the same line the Chronicle already shows. Works that build something keep today's line. One small call: works that improve a mortal's own thing ("raise") also get their own line ("The Hollow Bell is more than it was"), so the rule stays simple: only building keeps the old sentence. Technical fix, nothing held for a veto. Say "veto finished work line" to reverse it.

## Work

- **Unit chosen:** the plan-doc rule (shelf thin). The build shelf had no non-Deferral ticket; the only one ready, [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189), is a Deferral held until 09:00 UTC. The [UI legibility map](https://linear.app/threadbare/issue/THR-2114) is closed and all four of its plan docs have shipped. The only UI-period candidate left, [A sheet's Story list never says whether the mortal did the deed](https://linear.app/threadbare/issue/THR-2191), is still in Idea, so it is not agreed yet. The orchestrator-staged bug was the agreed unit.
- **Claimed** ["A Work Finished" says every undertaking left something standing](https://linear.app/threadbare/issue/THR-2075) (marker `design-lane claim dl-20261107T2318Z`), and wrote [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done.md) and [its brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done-brainstorm.md). Measured first: the game already stores each work's completion line on its moment, and the card never reads it.
- **Gates:** the intent judge said Allow (one gap, fixed: a work with no object type stores a log-style line, which the card now never shows). The three audits passed: Vision PASS, NFP and pillars PASS-with-notes, notes fixed. `npm run gate -- --final` passed on the docs track.
- **Merged** in [PR #2790](https://github.com/christianspliid-ui/threadbare/pull/2790). Handed off to Ready for Dev with the coordination block, and not held.

## Escalations

None.
