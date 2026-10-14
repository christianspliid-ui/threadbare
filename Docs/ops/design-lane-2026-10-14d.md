---
lane: tb-design-lane
run: 2026-10-14d
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run d, ~07:45Z)

## Needs Christian

Nothing needs your decision. This is the **second look the UI review promised you** (the encounter Stage). The five screens are linked below, and you can veto any part in one line.

## Decided for you

- [The encounter Stage](https://linear.app/threadbare/issue/THR-1829/the-encounter-stage-which-beats-play-over-the-dimmed-map-with-their-hex) — **a mortal's moment now plays over the map, with the place where it happens lit beside it.**
  - **Three homes for a moment.**
    - *The Stage* is for a mortal's moment at a place: encounters and their aftermath, story beats, journey moments, undertaking moments, premonitions and ruin emergences.
    - *A dialog* is for the god's own business: gifts, offerings, receipts, popups and the Chapter Ledger.
    - *Full screen* is for who your god is becoming: Meet the First and the Threading Rite.
  - **The Stage.** It is a large panel next to your god rail. Scene art, the people in it and *At stake* sit on the left. The title, the scene, the forecast and your hand (rows of four) sit on the right. A strip of map stays open on the right, with the place lit in a pale ring and named.
  - **The map.** It dims behind the Stage. Before the Stage opens, the camera eases to the place, and it stays there afterwards. A premonition also lights the place you are hovering, so you choose with the land in view.
  - **One at a time.** Only one moment holds the Stage. Others wait, named, in *Needs you*.
  - **Time works as today.** Moments still stop the world, the top bar says why, and Escape sets a moment down.
  - **Links:**
    - Screenshots: [encounter at 1440p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage/encounter-1440p.png), [encounter at 1080p](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage/encounter-1080p.png), [aftermath](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage/aftermath-1080p.png), [premonition](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage/premonition-1080p.png), [story beat](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage/story-beat-1080p.png).
    - [Why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md).
  - *To veto, say:* **"keep the encounter full-screen"**, **"premonitions stay a dialog"**, **"put the prose on the left"**, or **"put the camera back after"**.

## Work

- **Why a map decision.**
  - Ready for Dev holds 10 non-Deferral items, above the floor of 4, so a plan doc did not outrank the map.
  - [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823/wayfinder-map-the-map-is-the-table-a-map-first-game-screen-for-1440p) is the only open map. It had two unblocked frontier tickets with no comments; the Stage comes first in map order.
  - There were no vetoes in the briefing, and nothing of this lane's was waiting to be resumed.
- **Claimed** with marker `design-lane claim 2026-10-14d`, assignment verified.
- **Measured** on `main` @ `b0748460`, with a subagent inventory of all 17 beat surfaces, then spot-checked by hand:
  - The encounter screen already knows its hex (`encounter-stage/types.ts:88-90`).
  - Queued story beats carry a hex the story-beat dialog never receives (`types/attention.ts:123-125`, `GameView.tsx:6705-6709`).
  - Two blocking surfaces can render at the same time today (`interruptRegistry.ts:141-143`). The Stage's one-slot rule closes this.
  - A five-card hand fits at 1080p in rows of four (`NudgePhaseShell.tsx:70`).
- **Prior rulings kept:**
  - [THR-1724](https://linear.app/threadbare/issue/THR-1724): your encounter layout pass. The cast and *At stake* stay together, the pause is named in the top bar, and Escape minimises.
  - [THR-1730](https://linear.app/threadbare/issue/THR-1730): a set-down moment waits.
  - THR-1605: time halts for every moment.
- **Builds on a decision still in its veto window:** [Lenses on the map](https://linear.app/threadbare/issue/THR-1830) (about 01:30Z today). Only its "dims do not stack" rule is used here, and the Stage stands without it.
- **Closed** the ticket (Done verified). Added a line to the map's *Decisions so far* and updated two fog items:
  - *Signature motion:* the camera half is now decided.
  - *GameView split:* every surface is now decided; it still waits on the view-model seam. Nothing new graduated to a ticket.
- **PR:** [docs(audit): encounter Stage decision](https://github.com/christianspliid-ui/threadbare/pull/2371), with auto-merge armed. Docs gates passed locally: impediment ids OK, generated freshness OK (47 match HEAD), plan-doc lint skipped (no plan doc in the PR).
- **Left on the map:** [the icon family](https://linear.app/threadbare/issue/THR-1834/the-icon-family-pick-or-draw-one-set-with-style-rules-and-every-top). Once it is decided, the map can close and carve into plan docs.

## Escalations
