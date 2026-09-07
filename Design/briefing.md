# Briefing
**Generated:** 2026-09-07 13:58 local (11:58 UTC) · keep-work-flowing-cc

## The one thing

**Run the census** — [THR-1402](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings). Same ask as last hour, and the argument for it got sharper in the meantime.

The plan doc off the undertakings map [merged at 12:35](https://github.com/christianspliid-ui/threadbare/pull/1838), and **the machine claimed the work 26 minutes later** — [THR-1428, the owed readers](https://linear.app/threadbare/issue/THR-1428/the-owed-readers-every-live-undertaking-cells-write-gets-its-reader) has been building since 13:01. That is the whole shelf: one item, in flight, and nothing behind it.

Behind the census sits [migrate the 64, retire the four, flip the model to cells](https://linear.app/threadbare/issue/THR-1403) — the last slice of the migration, and the only other task the machine can claim and run without you. The census is its single blocker. When THR-1428 lands the queue is empty again unless this is cleared first.

What it costs you: a session runs two seeds for 150 ticks with the cells model on and shows you one picture — which cells fired, which never fired, which callings sat idle. **Your reaction is the decision:** a cell that never fires is either unreachable or unwanted. Say **"run the census"**.

## Also waiting (15)

- **[Approve the camp six](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)** — *"batch 2, run the six"* puts six encounters of content work on the queue the same hour. Unchanged, still one word.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants)** — 60 templates absorbed, 4 deleted; you asked to see the list first.
- **[The map's other two questions](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map)** — [the untouched-by-design list](https://linear.app/threadbare/issue/THR-1401) and [what the player sees](https://linear.app/threadbare/issue/THR-1404). No build work behind either.
- **[What should a proportion read as?](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct)** — recommendation is to drop both numbers rather than invent a language.
- **[Traits wave 2 — still planning to?](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — 27 days In Design, assigned to you, no plan doc.
- **[The incident-capture button](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** — you filed it 16 August; 22 days idle for want of a design pass.
- **[The fight map's two head questions](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) / [thirty items](https://linear.app/threadbare/issue/THR-1236)** — the single open question left on each map; a session builds the sketch, you react.
- **[Should image spends be gated on you at all?](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — five quarantined plates, and the standing rule behind them.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)** — remembrance, or named campaigns. No urgency; nothing downstream waits.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nineteen owed captures, ~20 minutes, no decision in it. Both reasons it went badly on 4 September are fixed.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — advice is still *wait*; only you can charter one.
- **Should weekend quiet be normal too?** — you have ruled on nights, not weekends; the probe cannot tell a deliberate weekend from a fault.
- **A Tenacious-style trait** — parked option, no ticket, no urgency. Listed so it is not silently forgotten.
- **[Set `LINEAR_API_KEY` in the machine environment](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-09-06.md)** — insurance against Friday's connector drop recurring. Nothing is broken while it waits.

## Queue

**Starved — 0 Ready for Dev**, but for the first time in a week that is not a stall: the one item that landed was claimed within half an hour.

- **1 live in dev** — [THR-1428](https://linear.app/threadbare/issue/THR-1428/the-owed-readers-every-live-undertaking-cells-write-gets-its-reader), claimed 13:01, building now. First build item off the undertakings map.
- **2 parked, both waiting on you** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (the camp six) and [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) (the retirement list). Both are asks above; neither is a fault.
- **Runway: one item.** When THR-1428 merges the shelf is empty unless the census or the camp six clears first.

## Health

- **Everything green** — deploy up to date, CI and all three scheduled workflows passing on main, no PRs waiting to merge, all 9 lanes on schedule, the worktree reaper ran 14 minutes ago.
- **Tick cost 73 ms/tick** — 23% *below* the 7-day median. No drift.
- **The home tree is 24 commits behind `main`.** It is the read-only mirror, so nothing is at risk and no work is stranded — but the autosync that normally keeps it current has not run through those 24. Agent-side to check; not yours.
