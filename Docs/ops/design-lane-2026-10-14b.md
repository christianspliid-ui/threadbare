---
lane: tb-design-lane
run: 2026-10-14b
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run b, ~01:30Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with) — **four map lenses, one at a time, and the plain map gets quieter.**
  - **The four lenses.** Key 1 shows your ground (Dominion, as already built). Key 2 shows your people and where each is heading. Key 3 shows trouble: unrest, battles and sieges, rival schemes, lairs and local omens, with the doom stage in its legend. Key 4 shows trade roads, red when threatened.
  - **How they look.** Every lens dims what it is not about, never washing the map in colour.
  - **Spheres is not a lens.** The land's sphere readings barely move, so a Spheres lens would only redraw the terrain. What presses a place shows as one line when you hover with the Dominion lens on.
  - **The plain map.** It is the default and keeps your people's threads, battles and sieges. Trade roads, unrest pulses and rival marks move into their lenses, so the screen stops showing everything at once and the trade roads' gold no longer sits beside your frontier's gold.
  - **Links:** [the four lenses](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses/threads.png) ([trouble](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses/trouble.png), [trade](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses/trade.png), [no lens](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses/base.png)), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses-decision.md).
  - *To veto, say:* **"keep trade roads on the plain map"**, **"let me stack lenses"**, or **"open with Dominion on"**.

## Work

- **Claimed and decided** [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with), a frontier ticket on [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p). It is closed, its decision record is on the ticket, and the map's *Decisions so far* has a new line.
  - **Evidence.** The Dominion lens has shipped: `src/data/map-lenses.ts` holds one row and `MapLensSwitch.tsx` sits top-left. Every other overlay is always on (`GameView.tsx:5771-5776`). Trade routes draw in `#c9a227` next to the frontier's `#d4a040`.
  - **Mock:** five 1920×1080 screens on the same map as the Dominion mock ([mock](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1830-map-lenses/lens-mock.html)).
  - **PR:** [docs(audit): map lenses decision](https://github.com/christianspliid-ui/threadbare/pull/2362), auto-merge armed. Docs gates passed: impediment ids OK, generated freshness OK (47 match HEAD), plan-doc lint skipped (the PR holds no plan doc).
- **Filed** [Every siege draws as a field battle on the map](https://linear.app/threadbare/issue/THR-1846/every-siege-draws-as-a-field-battle-on-the-map-gameview-passes-battle). It is a bug the Trouble lens depends on: GameView drops `isSiege`, and the siege ring mesh has no caller. Re-measured on `main` @ `1f34f8a2`. It is Todo, unassigned, Low priority.
- **Why a map decision, not a plan doc.** Ready for Dev holds 2 non-Deferral items, below the floor of 4, but no plan-doc candidate could start:
  - [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick-200) builds on a decision whose veto window runs until about 03:45 UTC.
  - [Echoes stand in the new world](https://linear.app/threadbare/issue/THR-1843/echoes-stand-in-the-new-world-a-past-gods-monument-line-and-relic) and [Choices widen across runs](https://linear.app/threadbare/issue/THR-1844/choices-widen-across-runs-four-hungers-on-run-1-one-woken-each-age) build on [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with), decided at about 00:30 UTC today.
  - [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) still waits for a second hunt encounter.
- **Still open on the map:** [the encounter Stage](https://linear.app/threadbare/issue/THR-1829/the-encounter-stage-which-beats-play-over-the-dimmed-map-with-their-hex) and [the icon family](https://linear.app/threadbare/issue/THR-1834/the-icon-family-pick-or-draw-one-set-with-style-rules-and-every-top). Both are unblocked.
- No vetoes in the briefing. Nothing of this lane's needed resuming.

## Escalations

None.
