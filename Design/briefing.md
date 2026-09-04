# Briefing
**Generated:** 2026-09-04 07:41 local (05:41 UTC) · keep-work-flowing-cc

## The one thing

**Four undertakings get deleted. Sixty get absorbed. Say yes and the migration finishes.** — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants)

Unchanged from last night, and still the one thing holding the largest finished piece of work behind a flag. Three of the four slices are built and merged; the last one waits on your reading of a deletion list.

**The list, once more, in full:**

- **60 of the 64 shipped templates are absorbed by a cell** — 54 by the operation they already ran, 6 by intent, where the old template wrote nothing to the world and the new cell actually does the thing its fiction promised (burning the charts, burning the mark, severing a network, the six guard/police/claim stances).
- **4 are deleted outright:** `improve_masterwork`, `train_apprentice`, `commission_quest`, `expose_cache`.
- Named honestly rather than flattered: `buy_influence`, `secure_office`, `negotiate_storage` and `extend_reach` land in *observe × location*, because gathering intelligence is the only thing they ever actually did.

The verbs are the ones you chose (create · change · use · control · destroy · observe), the registry is drawn on [the world-object catalogue](https://linear.app/threadbare/issue/THR-1394/the-worlds-objects-one-canonical-catalogue-in-game-words-the-drift) you asked for first, and [the grid](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/undertaking-grid.generated.md) is generated and kept current by the build — 42 live cells across 14 world-object kinds, 20 of them things no undertaking could reach before.

**Say "run 4b"** and the 64 migrate, the four go, and the model flips on. **Say "not those four"** (or name others) and it adjusts first.

## Also waiting (12)

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — say yes to the camp seven.** Still the only ask that puts *content* on the shelf; [brief merged](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). *"batch 2, seven is fine"* starts it.
- **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — do you still want the incident-capture button?** Your own filing, 16 Aug, High, untouched 19 days.
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

**Two `Ready for Dev`, four `In Dev` — all four parked.** The executor's WIP slot is empty and the shelf holds nothing anyone plays. Overnight the machine did what it should: [THR-1390](https://linear.app/threadbare/issue/THR-1390/ul-proposal-undertaking-contract-batch-brief-undertaking-sense) (glossary) was picked up and closed at 19:15Z, and the orchestrator staged [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap) behind it. Nothing stale — both open items were created in the last two days.

- **THR-1392's `Parked` label is still stale, unchanged since last night.** The park named one resume condition — the world-object catalogue — and that shipped; slice 4a then merged. The assignee reappeared when PR #1804 merged (the known PR-restores-assignee behaviour). An executor should clear the label and re-null the assignee; the real gate is the retirement review above, not the label.
- THR-1130 · THR-1133 · THR-1168 — parked correctly; the last two are asks above. No action.

## Health

**All green.**

- Deploy `deployed` (live site serving `d8861ca6`) · CI, Heavy tests and Linear Auto-Close all green on main · no PRs waiting to merge · all 9 scheduled tasks within schedule · home tree on `main`, current, clean · reaper ran 07:40, healthy.
- Tick cost **83 ms/tick steady, 27% *below* the 7-day median** (113 ms, 3 rows). Faster, not slower — no drift.
- **The 10h of lane silence since 19:43 last night is the overnight window**, declined under your 8 August ruling that overnight quiet is normal. The probe also still re-reports the 30 Aug – 1 Sep outage (58.1h) it cannot see an explanation for; you were told that story and its cause on Wednesday. Nothing here needs a decision from you.
- One harness fault, fixed in-run and worth nothing of yours: the tick-cost measurement leaked a `[WorldGen]` log line into its own JSON output, which made the trend check unreadable on first pass. Stripped and re-run against the same measurement; the row published is real. The measuring script should send that line to stderr.
