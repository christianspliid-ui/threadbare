# Briefing
**Generated:** 2026-09-03 20:55 local (18:55 UTC) · keep-work-flowing-cc

## The one thing

**Four undertakings get deleted. Sixty get absorbed. Say yes and the migration finishes.** — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants)

This is your own thread from this morning, and it moved a long way today. [Slice 4a landed](https://github.com/christianspliid-ui/threadbare/pull/1804) about half an hour ago: the verbs are renamed to the ones you chose (create · change · use · control · destroy · observe), the registry is redrawn on [the world-object catalogue](https://linear.app/threadbare/issue/THR-1394/the-worlds-objects-one-canonical-catalogue-in-game-words-the-drift) you asked for first, and the grid is now generated and kept current by the build — [look at it here](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/undertaking-grid.generated.md). 42 live cells across 14 world-object kinds; 20 of those cells are things no undertaking could ever reach before (found a faction, raise an army, recruit a companion, cast a power, cure a condition, cultivate or break a standing).

**You asked to see the retirement list before anything is deleted.** Here it is, and it is smaller than the version you were shown this morning:

- **60 of the 64 shipped templates are absorbed by a cell** — 54 by the operation they already ran, 6 by intent, where the old template wrote nothing to the world and the new cell actually does the thing its fiction promised (burning the charts, burning the mark, severing a network, the six guard/police/claim stances).
- **4 are deleted outright:** `improve_masterwork`, `train_apprentice`, `commission_quest`, `expose_cache`.
- Named honestly rather than flattered: `buy_influence`, `secure_office`, `negotiate_storage` and `extend_reach` land in *observe × location*, because gathering intelligence is the only thing they ever actually did. Yield and leverage stay open cells on the grid — they are [one of the map questions](https://linear.app/threadbare/issue/THR-1397/which-open-cells-are-wanted-yield-and-leverage-ownership-of-people) waiting on you.

**Say "run 4b"** and the 64 migrate, the four go, and the model flips on. **Say "not those four"** (or name others) and it adjusts first. It is the last slice of a four-slice job that is otherwise done and sitting behind a flag.

## Also waiting (12)

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — say yes to the camp seven.** Still the only ask that puts *content* on the shelf; [brief merged](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). *"batch 2, seven is fine"* starts it.
- **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — do you still want the incident-capture button?** Your own filing, 16 Aug, High, untouched 18 days.
- **[THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) — the undertakings map is charted.** Its frontier carries your three forks: killing a mortal, cursing someone, usurping a leader. Say *"work the undertakings map"*.
- **[THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — are you still planning Traits wave 2?** One word. Smaller than it was billed: three of its four supposed dependents closed on their own.
- **[Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — nine fight questions, all yours.** Every research question on it is finished. Say *"work the fight map"*.
- **Two sketches to react to** — [twenty generated spells](https://linear.app/threadbare/issue/THR-1232), [thirty generated items](https://linear.app/threadbare/issue/THR-1236). Your reaction *is* the design decision.
- **[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — should image spends be gated on you at all?** Your answer settles five plates and every batch after.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — what is a run *about*?** Remembrance, or named campaigns. Nothing downstream waits.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one attended dev-server sitting.** Nineteen owed screenshots a scheduled run structurally cannot take.
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) — should committing a nudge be followed by a held breath?** Two lanes say no; unless you object, an agent retires it and reports after.
- **[THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — chart the hub map?** Advice: wait one cycle, until your slice checkpoint is done. Only you can charter one.
- **A Tenacious-style trait** — parked, no ticket, no urgency. Listed so it is not silently forgotten.

## Queue

**Starved-plus-two, and no live work at all.** 2 `Ready for Dev`, both glossary entries ([THR-1390](https://linear.app/threadbare/issue/THR-1390/ul-proposal-undertaking-contract-batch-brief-undertaking-sense), [THR-1391](https://linear.app/threadbare/issue/THR-1391/ul-proposal-covet-rivalry-a-hostile-to-the-world-writes-from-coveting)) promoted by the orchestrator at 18:32. All 4 `In Dev` items are `Parked` — so the executor's WIP slot is empty and the shelf holds nothing anyone plays.

- **THR-1392's `Parked` label is stale and its assignee is an artifact.** The park (09:00Z) named one resume condition — the world-object catalogue — and that shipped; slice 4a then ran and merged. The assignee reappeared when PR #1804 merged (the known PR-restores-assignee behaviour). An executor should clear the label and re-null the assignee; the real gate is the retirement review above, not the label.
- THR-1130 · THR-1133 · THR-1168 — parked correctly, all three surfaced as asks above. No action.
- Nothing stale: both Ready-for-Dev items were created today.

## Health

**All green, with one piece of history.**

- Deploy `deployed` (live site serving `7f6b1321`) · CI, Heavy tests and Linear Auto-Close all green on main · no PRs waiting to merge · all 9 scheduled tasks within schedule · home tree on `main`, current, clean · reaper ran 20:40, healthy.
- Tick cost 113 ms/tick steady (small map, 200 ticks, 511 agents, top phase `agent_decision`) — **baseline, not drift**: only 2 prior rows in the 7-day window.
- **The lane-silence probe still reports the 30 Aug – 1 Sep outage (58.1h) as unexplained.** Not re-raised as an ask: you were told about the lane stoppage and its cause an hour ago, and the lanes are demonstrably firing again (pickup 18:01, orchestrator 18:26, this run 18:53). The second gap it names (17:57 → 05:41) is overnight-shaped and declined under your 8 August ruling. Nothing here needs a decision from you.
