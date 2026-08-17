# Briefing
**Generated:** 2026-08-18 01:56 local (23:56 UTC) · keep-work-flowing-cc

## The one thing

**Sit down and rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under).** Say *"run the wave-1 sitting."*

**Unchanged from an hour ago, and not re-argued here** — the full case is in `Design/user-actions.md`. In one line: an agent ranks five candidate parts of the game for you, you rule on the order in chat, and that closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) into one written plan per part. Roughly one sitting, no code.

**What changed overnight makes it more true, not less.** The builder finished the one cleanup job it had, and again filed its own next one — the third consecutive hour where the only thing entering the queue was written by the builder about the job it had just done. Nothing that adds to the game has entered the pipeline since yesterday. That is a design-supply problem, and this sitting is the fix for it.

## Also waiting (3)

- **Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).** Still the quickest win: [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) — worth meeting a second time? Yes releases the next nine. Re-verified this run that both fixes are live on the deployed build, not a build behind. Every ending link is in `Design/user-actions.md`.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one dev-server session, ~30 min, six surfaces, 13 screenshots.** Still the only ticket a scheduled run structurally cannot discharge.
- **A Tenacious-style trait stays parked** — an open design option, no ticket, nothing downstream waiting. Listed so it is not silently forgotten.

## Queue

**2 ready, 1 in dev — and after tonight's shipping the claimable shelf is one job again.** [THR-1167](https://linear.app/threadbare/issue/THR-1167/residue-of-the-encounter-prototype-tree-after-thr-1049-three-test-only) merged at 23:30 UTC, emptying the shelf; the orchestrator promoted one replacement twenty minutes before that.

- [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (High) — **in dev, unassigned since 20:03 local (~6h).** The park is the ticket waiting on your encounter verdict, not a stall.
- [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) (Low) — the one claimable item: two finished encounter sound moments whose on-screen consumer was deleted, needing wiring or retiring. Its blocker cleared when #1533 merged, so it is takeable now. **One half of it is a feel question** — whether the encounter veil should carry a 1.6-second tension sound on commit. The lane will decide the mechanical half and bring you only that one if it still needs an ear.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (Low) — the attended sweep above; a scheduled run cannot take it.

**The shape to notice, third hour running:** every completed item tonight was cleanup or infrastructure, and every newly-queued item was filed by the builder about its own last job. The board is feeding itself. It keeps moving overnight without you — but it is tidying, not building, and only the sitting above changes that.

One item sitting rather than blocked: [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — letting places and objects carry traits the way people already do — has now waited 51 hours for a design session. Nothing objects to it; it occupies the single design slot. Noted for elapsed time, not re-asked.

## Health

- **All probes green.** The live site serves the newest merge (`3ddcaba0`), automated checks, background jobs, scheduled-task heartbeats and the merge queue are all normal; no PRs are waiting. The git reaper ran at 01:40 local. Home tree is on `main`, current and clean.
- **Lane silence:** the probe reports the same historical overnight gaps (worst 10.8 h, 12–13 Aug), nothing ongoing. Declined per your 2026-08-08 ruling that overnight quiet is normal; visibility only.
