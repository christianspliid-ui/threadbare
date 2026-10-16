---
lane: tb-design-lane
run: 2026-10-16d
promoted: 0
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-16 (run d, ~13:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The mortal's own mid-game is behind a button nobody presses](https://linear.app/threadbare/issue/THR-1859/the-mortals-own-mid-game-is-behind-a-button-nobody-presses-the-work) — **your mortal's work and what they want most now show in the panel beside the map**, as two lines that open the full profile on the Journey tab. The "A Work Begun" and "A Work Finished" moments get a "See the work" link to the same place. In the last playtest no tester ever pressed "View Full Profile", so none of them saw either. ([its build ticket](https://linear.app/threadbare/issue/THR-1963/the-work-and-the-leading-ambition-beside-the-map-two-lines-in-the)) *Veto:* **"open the profile on the Journey tab instead"**.
- Same ticket — **one work gets one progress word everywhere** (barely begun, under way, halfway, well along, nearly done). A work that has stalled says "faltering" on every surface, not only on the thread row. Today the same work could read "going badly" on the row and "well advanced" in the panel. ([its build ticket](https://linear.app/threadbare/issue/THR-1962/one-word-for-how-far-a-work-has-come-the-thread-row-the-panel-the)) *Veto:* **"keep the four-word scale"**.
- Same ticket — **the camera snapping to full zoom needs nothing more.** It was fixed when the map camera build merged today; every "show me" now lands at the middle zoom.

## Work

- **Claimed** [the mortal's mid-game ticket](https://linear.app/threadbare/issue/THR-1859/the-mortals-own-mid-game-is-behind-a-button-nobody-presses-the-work) (claim `2026-10-16d`).
  - The briefing held no vetoes, and you sent no new messages.
  - No wayfinder maps are open, and the build shelf is full (21 ready).
  - The two economy plans, [the god's stake](https://linear.app/threadbare/issue/THR-1935/plan-doc-the-gods-stake-in-the-economy-hungry-towns-on-your-ground) and [undertakings in the economy](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open), are still waiting out the veto day on the plans they read. Hunger and unrest clears about 01:50Z tomorrow; mortal wealth and war aims clear about 19:20Z and 22:20Z today.
  - This was the highest-priority agreed design ticket left: a playtest finding that already had a recommended direction.
- **Measured** on main `428d2597` before deciding:
  - The two progress word tables read the same number, so this is a wording bug, not two meanings.
  - The [Inspector plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1876-the-inspector.md) keeps the work and the ambitions on the fifth tab. Its builds are several slices away, so the next warm playtest would still see today's panel.
  - `RETINUE_EYE_ZOOM_SCALE` has 0 hits in `src/`. Every focus call uses `FOCUS_ZOOM = 10`.
- **Filed** two build tickets into the [Warm playtest · round 2](https://linear.app/threadbare/project/thematic-pressure-and-living-world-p-thr-3) milestone, both Todo with coordination blocks: [one progress word](https://linear.app/threadbare/issue/THR-1962/one-word-for-how-far-a-work-has-come-the-thread-row-the-panel-the), then [the two panel lines](https://linear.app/threadbare/issue/THR-1963/the-work-and-the-leading-ambition-beside-the-map-two-lines-in-the), which waits for it.
- **Added** the same two lines as Overview rows on the Inspector's person page, through a comment on [Inspector S2a](https://linear.app/threadbare/issue/THR-1909). They survive when the thread panel retires.
- **Decision record** posted on the ticket. The ticket was released to Todo, blocked by the two builds. It stays open until warm round 3 confirms its "Fixed when", so it is not marked Done ([THR-1888](https://linear.app/threadbare/issue/THR-1888) is still open).

## Escalations

None.
