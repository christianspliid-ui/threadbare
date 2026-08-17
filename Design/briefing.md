# Briefing
**Generated:** 2026-08-18 00:58 local (22:58 UTC) · keep-work-flowing-cc

## The one thing

**Sit down and rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under).** Say *"run the wave-1 sitting."*

**This is a change of lead, and here is the reason.** For the last several hours this brief led with the encounter verdict because it was quick and unparked work already in flight. Two things moved since: the last of three background investigations finished this afternoon, so the sitting is no longer waiting on homework nobody had done — and tonight the build queue ran dry, which makes designed work, not effort, the thing in short supply. Your own words yesterday about this architecture work: *"lets get it sorted. higest priority. new features can wait as they will just be implemented badly due to these issues."* Everything else on the board is the work you said could wait.

**What the sitting actually is:** an agent puts five candidate parts of the game in front of you — the hunger vocabulary, the consequence chips (already done once, as the proof), region identity, mandate prose, and follow-on tags — ranked against stated criteria, and you rule on the order in chat. Roughly one sitting, no code.

**What it releases:** it closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) and turns it into one written plan per part plus one for the shared machinery — days of build work, versus the roughly one hour the queue currently holds.

## Also waiting (3)

- **Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).** Unchanged and still the quickest win on the list: [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) — are they worth meeting a second time? A yes releases the next nine. Every ending link is in `Design/user-actions.md`.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one dev-server session, ~30 min, six surfaces, 13 screenshots.** Still the only ticket a scheduled run structurally cannot discharge.
- **A Tenacious-style trait stays parked** — an open design option, no ticket, nothing downstream waiting. Listed so it is not silently forgotten.

## Queue

**2 ready, 1 in dev — and the claimable shelf is one short cleanup job.** The executor shipped [THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard) at 22:25 UTC, emptying the shelf; the orchestrator promoted one replacement six minutes later.

- [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (High) — **in dev, unassigned since 20:03 local (~5h).** The park is the ticket waiting on your encounter verdict, not a stall.
- [THR-1167](https://linear.app/threadbare/issue/THR-1167/residue-of-the-encounter-prototype-tree-after-thr-1049-three-test-only) (Low) — the one claimable item: deleting six encounter-screen components nothing on screen uses any more. Buys roughly an hour.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (Low) — the attended sweep above; a scheduled run cannot take it.

**The shape to notice:** of the last four things finished, all four were cleanup or infrastructure. Zero game-facing items completed and zero are queued. That is not the builder going slowly — it is the design shelf being empty for the fifteenth hour running, which is exactly what the sitting above fixes.

One item sitting rather than blocked: [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — letting places and objects carry traits the way people already do — has now waited 50 hours for a design session. Nothing objects to it; it occupies the single design slot. Noted for elapsed time, not re-asked.

## Health

- **All probes green.** The live site serves the newest merge (`759dae13`), automated checks, background jobs, scheduled-task heartbeats and the merge queue are all normal; no PRs are waiting. The git reaper ran at 00:40 local. Home tree is on `main`, current and clean.
- **Lane silence:** the probe reports the same historical overnight gaps (worst 10.8 h, 12–13 Aug), nothing ongoing. Declined per your 2026-08-08 ruling that overnight quiet is normal; visibility only.
