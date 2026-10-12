---
lane: tb-design-lane
run: 2026-10-12d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-12 (run d, ~19:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf) — **your ground becomes visible.**
  - **Map:** press **1** (or the Dominion button, bottom-left) to dim everything that isn't yours. A gold line traces where your ground ends, and your strongest ground glows in your sphere's colour.
  - **How the land gets its colour:** open land takes its colour from the nearest town within two hexes, so your ground grows as you Claim and Shift towns. On today's maps that covers almost every land hex.
  - **Lost ground:** when a place slips out of your hold, a small broken gold ring marks it for three days.
  - **Pages:** every place, faction and relic page gets a *Dominion* box with the word and its line, e.g. *"Held. Yours, and holding. Cheaper works, richer threads. Left untended, it will slip back."* A mortal's sheet gets one line under *Attuned to*.
  - **Cards:** cards show *"Held · cheaper here"* with a faint pip for what you saved, or *"Hostile · dearer here"* with red pips. From this build on, prices really do change with the ground. The "Casting on" bar says the same in words.
  - **For now, only the Dominion view.** The earlier mock had four map tabs (Terrain / Dominion / Borders / Threads). I built only Dominion and left the other three to [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with), which decides how map views switch.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md), [the mock it builds](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1766-dominion-mock/map-c.png). Building waits for the Dominion core to finish and not before 19:40 UTC tomorrow.
  - *To veto, say:* **"give me all four map tabs now"**, **"show my ground only right around towns"** or **"keep my ground off faction and relic pages"**.

## Work

- **Claimed** [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf) (claim marker `design-lane claim 2026-10-12d`).
  - Why this ticket: the Ready for Dev shelf held 1 non-Deferral item, below the floor of 4. This ticket is plan doc 2 in the closed [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run)'s carve-up, and no input is a lane decision younger than 24 h.
- **Measured** with the headless CLI (`--map medium`): 85–87% of land hexes lie within 1 hex of a top-level place, and 99.4% within 2 (seed 42: 214 / 402 / 91 / 4 at distances 0 / 1 / 2 / 3 of 711; seed 99: 222 / 387 / 104 / 4 of 717). A subagent surveyed the UI substrate (HexMapV2 layers, sheets, card face, cast bar, tooltip registry).
- **Gates:**
  - Intent judge: Revise (four findings: a PC-2 quote, a Hostile sample, an undefined tie constant, a trace failure value), then Allow on round 2.
  - Design audit: NFP and Vision PASS-with-notes, pillar PASS. Acting on the Vision note, the switch's pressed state moved off gold.
  - `lint:plan-doc` clean; `check:generated-freshness` OK.
- **PR:** [docs(plan): 2026-10-12 dominion on screen](https://github.com/christianspliid-ui/threadbare/pull/2350), auto-merge armed. Handoff to Ready for Dev after `check:plan-doc-liveness` says LIVE, with `Claimable from: 2026-10-13T19:40:00Z`. The ticket is also blocked by [Dominion core](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods), which is In Dev now.

## Escalations

None. One note was left for [Lenses on the map](https://linear.app/threadbare/issue/THR-1830/lenses-on-the-map-how-the-five-lenses-look-switch-and-combine-with): the engine already uses "lens" for the god's narrative identity (`ascendantLens.ts`), so if "lens" becomes a glossary word, that clash needs resolving.
