# Briefing
**Generated:** 2026-08-18 02:57 local (00:57 UTC) · keep-work-flowing-cc

## The one thing

**Play two encounters and say whether they are worth meeting a second time — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).**

**The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
**The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

**Promoted above the wave-1 sitting this hour for one reason: overnight the shelf emptied.** Every open ticket on the board now waits on an answer from you — this one, the sound question below, and the attended screenshot session. There is nothing left a scheduled run can pick up on its own.

This is the cheapest of the three and it releases the most: yes releases the next nine encounters into the queue as real writing work, no tells the writer what the bar still misses. Roughly ten minutes. The build serving those links is the current one, checked this run.

## Also waiting (4)

- **Rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under).** Still the deeper fix and unchanged in substance: one sitting, no code, and it turns [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) into written plans. Say *"run the wave-1 sitting."* Demoted by cost this hour, not by importance.
- **New: should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or).** About 1.6 seconds of sound drawing tight, then releasing, before the outcome lands — or does the outcome land immediately? Pure pacing, your call. Detail and the other half of this ticket, already decided and shipped, are in `Design/user-actions.md`.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one dev-server session, ~30 min, six surfaces, 13 screenshots.** Still the only ticket a scheduled run structurally cannot discharge.
- **A Tenacious-style trait stays parked** — an open design option, no ticket, nothing downstream waiting. Listed so it is not silently forgotten.

## Queue

**1 ready, 2 in dev — and the claimable shelf is empty.** An hour ago [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) was the one job a lane could take. It was taken, half of it shipped, and the half that remains is the question above. Nothing replaced it.

- [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (High) — in dev, parked on your encounter verdict. Its blocking spec ticket finished on 2026-08-16, so your answer is the only thing in front of it.
- [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) (Low) — in dev, parked on the sound question. The registration cue half was **retired** and merged ([PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534)) on a technical finding, not a taste one: the sound map and the on-screen chips turned out to share no vocabulary at all, so wiring it would have played one note forever behind a test that passed. That verdict was the lane's to make and it made it.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (Low) — the attended sweep above; a scheduled run cannot take it.

**The shape, fourth hour running:** everything completed overnight was cleanup, and nothing that adds to the game entered the pipeline. The board has now finished tidying itself and stopped. Either answer above restarts it — the encounter verdict within minutes, the sitting more durably.

One item sitting rather than blocked: [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — letting places and objects carry traits the way people already do — has waited 51 hours for a design session. Noted for elapsed time, not re-asked.

## Health

- **All probes green.** The live site serves the newest merge (`b0f7c7f7`); automated checks, background jobs, scheduled-task heartbeats and the merge queue are all normal, and no PRs are waiting. The git reaper ran at 02:40 local. Home tree is on `main`, current and clean.
- **Lane silence:** the probe reports the same historical overnight gaps (worst 10.8 h, 12–13 Aug), nothing ongoing. Declined per your 2026-08-08 ruling that overnight quiet is normal; visibility only.
- One cosmetic note, no action: merging [PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534) put an owner back on THR-1168 even though the lane had parked it. Known Linear behaviour, logged before; the ticket is parked in fact and this brief is what surfaces it.
