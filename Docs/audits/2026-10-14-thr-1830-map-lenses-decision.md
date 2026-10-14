> **Decision audit for THR-1830** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-14b, unattended; decided by delegation (process.md rule 4) with a veto invited.
>
> Mock: [`lens-mock.html`](2026-10-14-thr-1830-map-lenses/lens-mock.html), five 1920×1080 screens selected by `#base`, `#dominion`, `#threads`, `#trouble`, `#trade`. Its map engine is copied from the [THR-1766 Dominion mock](2026-10-11-thr-1766-dominion-mock/dominion-mock.html), so the god (the Shepherd), towns and bands are the ones Christian already saw. Screenshots:
> [no lens](2026-10-14-thr-1830-map-lenses/base.png) · [Dominion](2026-10-14-thr-1830-map-lenses/dominion.png) · [Threads](2026-10-14-thr-1830-map-lenses/threads.png) · [Trouble](2026-10-14-thr-1830-map-lenses/trouble.png) · [Trade](2026-10-14-thr-1830-map-lenses/trade.png)

# THR-1830 — lenses on the map

## Settled input (not re-opened)

| Source | What it fixes for lenses |
|---|---|
| [THR-1766](https://linear.app/threadbare/issue/THR-1766) (attended, 2026-10-11) | The grammar: dim what is not in focus, never a sphere-colour wash. Hue is taken by the terrain palette. |
| [THR-1750](https://linear.app/threadbare/issue/THR-1750) (shipped) | Lens one is built: `src/data/map-lenses.ts` holds `MAP_LENSES` with one row (Dominion, key `1`); `MapLensSwitch.tsx` sits top-left of the map canvas with a legend card under it; `useTopBarHotkeys.ts:29` toggles by the registry row's key. The plan says THR-1830 "adds its rows and may restyle the switch into its bar." |
| [THR-1824](https://linear.app/threadbare/issue/THR-1824) (research) | Threads, Trouble and Trade have live data and map layers today. Spheres has no per-hex data that moves; recommendation: fold it into Dominion. |
| [THR-1831](https://linear.app/threadbare/issue/THR-1831) (lane, veto window closed) | Keys `1`–`5` are reserved for lenses; the lens bar sits clear of the bottom-right controls; gold is reserved for the Dominion frontier; red is doom ink; the minimap shows no lens. |
| [THR-1827](https://linear.app/threadbare/issue/THR-1827) (Christian, "yes" to all 18 calls) | Clicking a lit hex opens the land page. `LiveLocationBar` retires; "its job moves to the Threads/Trouble lenses and the needs-you queue". |
| [THR-1828](https://linear.app/threadbare/issue/THR-1828) (lane, veto window closed) | Hotkeys `1`–`5` are lenses; the frame budget keeps the map at ≥ 60% of the width with rails open. |

## What the map draws today (measured, `main` @ `1f34f8a2`)

- **Every overlay is always on.** `GameView.tsx:5771-5776` passes `rivalInfluenceMarkers`, `tradeRouteLines`, `battles` and `threadLines` to HexMapV2 unconditionally; the hex pulse mesh is built in the scene effect (`HexMapV2.tsx:994`). Only the Dominion lens can be switched.
- **Two golds collide.** Trade routes draw in caravan gold `#c9a227` (`TradeRouteMesh.ts:20`); the Dominion frontier draws in `--accent-gold` `#d4a040`. With both on, the frontier is no longer "the one gold emphasis on the map" that THR-1750 promised.
- **Thread colours** by court position: the First gold `#d4a040`, retinue `#8b9dc3`, watched `#5a6a7a`, dormant `#3a3a3a` (`ThreadLineMesh.ts:29-33`).
- **The siege defect THR-1824 found is still live.** `GameView.tsx:61` imports `BattleRenderData` (no `isSiege`) and passes it as `battles`; `sieges={siegeRenderData}` (`GameView.tsx:5775`) is not a HexMapV2 prop; `createSiegeIndicatorMesh` has no caller. In the game every siege draws as a field battle.
- **Unshown data a lens can draw:** threaded mortals' `movementState.destinationId` (written at `phaseMovement.ts:147`, drawn only for the avatar); local omens (`types/omen.ts:152`, `kind: 'local'` with hex and radius; read only by agent decision bias); the rival marker's `rivalId` and `reason` (`rivalInfluenceMarkers.ts:41-50`; the marker never says whose it is).

## Decisions

### 1. One grammar for every lens

A lens **dims what is not in focus and draws its own marks on top**. The dim is near-black, never a hue, and uses one strength (Dominion's Foreign dim, `DOMINION_DIM_FOREIGN` 0.45) for "not in focus". Each lens owns **one ink** for its marks:

| Lens | Focus (stays lit) | Ink |
|---|---|---|
| Dominion | your turf (as built) | gold frontier, sphere glow on Sovereign (as built) |
| Threads | each threaded mortal's hex and the place they are heading to | the existing court-position colours |
| Trouble | hexes with something going wrong | red, the doom ink |
| Trade | hexes on a trade road you know of | caravan gold, red when threatened |

Fog covers every lens mark, so a lens never shows unseen ground. Lenses draw nothing on the minimap (THR-1831).

### 2. One lens at a time; none by default

- **Radio, not stack.** Pressing a lens turns it on and any other off; pressing it again turns it off. Two "dim the rest" layers do not compose — stacked, almost nothing stays lit and two legends compete.
- **No lens is the default**, at the start of every run, and the choice is kept across view changes within a session (as THR-1750 built). The plain map is the table; a lens is a question you ask it.
- **Keys:** `1` Dominion, `2` Threads, `3` Trouble, `4` Trade. `5` stays reserved and unbound.

### 3. The lens bar stays where the switch is

THR-1750's switch becomes a four-button segmented bar in the same place, top-left of the map canvas, label plus key cap, pressed state an underline (never gold). The legend card stays under it, capped at 180 px. An icon per lens waits for the icon family ([THR-1834](https://linear.app/threadbare/issue/THR-1834)); until then, labels only.

*Why not bottom-left:* `LiveLocationBar` still holds that corner until the Inspector build retires it, and the switch is already built and found top-left. Moving it buys nothing.

### 4. What the plain map keeps

With no lens on, the map keeps what is about **your people right now**: thread lines from the avatar, battle and siege markers, the band-drop badge (THR-1750), realm borders, places and agents. **Trade routes, unrest pulses and rival scheme marks move into their lenses.** Reasons: the gold collision above; THR-1808 (*recurs after fix*: everything arrives at once with nothing saying what to do); and THR-1827 already sent `LiveLocationBar`'s job (the busiest places) to the Threads and Trouble lenses. A threat to the player's own things still reaches them without a lens through the needs-you queue (THR-1825/THR-1828).

### 5. Spheres is not a lens

THR-1824 measured that a hex's sphere "influence" is mostly the terrain table plus the place-type table, and that 12% of places changed in 240 ticks (THR-1759). A Spheres lens would redraw the terrain, and the hue it would need is already ruled out. Its honest part rides on the Dominion lens: the hex tooltip line THR-1750 built (*"Held ground, by Hesk Crossing"*) gains one clause naming what presses the lending place, read from that place's own sphere scores (the read `getHexSphereInfluence` already makes, `hexZoom.ts:70`): *"Pressed by a power of Entropy; your Life holds here."* This is new wording, not built today — the shipped `DominionBox` carries the band line and a tend line (`DominionBox.tsx:65`), no pressure line. THR-1766 mocked this clause on the place page; the lens hover is its first home.

### 6. Per lens

**Dominion (1).** Exactly as THR-1750 built it, plus the pressure line above. This ticket does not re-design it.

**Threads (2).** Focus: where each threaded mortal stands and where they are heading. Medallions grow one step and carry the name. A dashed arrow runs from each mortal to `destinationId` when it is set. Thread lines from the avatar stay as today; when there is no avatar the lens still lights the hexes. Hover: *"Maren Ashfold, your First, is on her way here from Hesk Crossing."* Legend: *"Your people keep their light; the rest is dimmed."* · *"A dashed arrow shows where each is going."* · court words The First / Retinue / Watched.

**Trouble (3).** Focus: hexes with unrest (pulse tense or volatile), a battle, a siege, a rival scheme or drain, a lair, or inside a local omen's reach. Each kind gets one red mark — never a number — and the legend lists them. Local omens draw their reach as a dotted ring. Doom has no place on the map (THR-1824), so the legend head carries its stage word: *"Trouble · Doom: Signs"*. Hover names the rival from the marker's `rivalId`: *"A scheme of The Salt Spire: it is turning the hamlet's shrine away from you."* **Sieges must draw as sieges**: the build fixes the defect above (route `isSiege` through, wire the siege ring) as part of this lens.

**Trade (4).** Focus: hexes on a known trade road. Roads draw in caravan gold, red when threatened, with a small mark mid-road. Hover: what it carries, whether it is threatened, and each end's prosperity word (`getProsperityTier`) and scarce goods (`stockTier`). Roads are sparse early (6 by tick 240, THR-1759), so the empty state is a legend line: *"No trade road you know of yet."*

### 7. A lit hex opens the same land page

Clicking any hex, lit or not, opens the land page (THR-1827). It is **not** filtered by the lens — one card, one router (THR-1482) means one page per place from every surface. The lens's own fact lives on the hover line; the land page already shows everything that lit the hex.

## Options weighed

- **Stackable lenses** (e.g. Trouble over Dominion). Rejected: two dims leave almost nothing lit; the legends compete for one corner.
- **Dominion on by default.** Rejected: it dims most of the world before the player has turf; a fresh god's map would open mostly dark.
- **Keep every overlay on the plain map** and let lenses only dim. Rejected: keeps the gold collision and the all-at-once noise THR-1808 recurs on.
- **A Spheres lens of one glyph per settlement** (THR-1824's fallback). Rejected for now: the scores barely move, so the glyphs would be static decoration.
- **Recolour trade routes off gold.** Not needed once roads live only in their own lens.

## Would change the call

- Christian: *"keep trade roads on the plain map"*, *"let me stack lenses"*, or *"open with Dominion on"*.
- A cold or warm playtest where testers miss a threat to their own things because rival marks left the plain map — then rival marks on the player's own places return to the plain map.
- A sphere measurement showing per-place scores move meaningfully within a season — then a Spheres lens earns a slot (key `5`).

## UI-Laws judgement (for the plan doc)

| Law | Verdict |
|---|---|
| 1 / 17 (tooltip on every concept, one registry) | Each lens button and each legend mark needs a `ui.lens.*` registry tooltip. Build obligation. |
| 10 / 31 (colour meaning) | Gold = your ground (frontier, the First's thread, caravans only inside Trade); red = trouble and threat. ✓ |
| 12 (legend at first contact) | Every lens has a legend card. ✓ |
| 13 / 14 (no raw numbers or keys) | Band words, court words, kind marks, prosperity words. No number anywhere. ✓ |
| 21 (names route) | Every name in a hover line routes through `useRefRouter`. Build obligation. |
| 33 (fits 1080p) | Bar plus legend fit in the top-left at 1920×1080 (mock). ✓ |
| 56 (marks only for real state) | Every mark reads written state; empty lenses say so in words. ✓ |

## Outputs

- This record; the mock and its five screenshots.
- Feeds the map's **map lenses and map chrome** plan doc (destination bullet 3), with [THR-1831](2026-10-11-thr-1831-map-chrome-decision.md) as its chrome half.
- New engine data: none. Every mark reads data that exists today; the view models follow THR-1824's sketches and live behind the [THR-1822](https://linear.app/threadbare/issue/THR-1822) seam.
