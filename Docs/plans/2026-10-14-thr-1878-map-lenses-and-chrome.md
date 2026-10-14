> **title:** `Map lenses and map chrome — Dominion, Threads, Trouble, Trade, the controls, the minimap, the markers and the carved places — THR-1878`
> **linear_issue:** THR-1878
> **author:** `Claude Code`
> **created:** 2026-10-14
> **three_pillars:** Engine `done — three lens view models, the minimap and realm-ink selectors, and one additive clause on the Dominion hex line, all read-only behind the THR-1822 seam; no node, edge, phase or writer` · Content `done — lens legends, hover lines, control and minimap words, tooltips, and the place-type, marker and key lists as data` · UI `done — the lens bar and legend, four lenses, the control cluster and keys, the minimap, the opening view, marker bands, label weights, border ink, uncharted parchment and carved place icons; Claude-in-Chrome for WebGL paint, Playwright for DOM at 1920×1080 and 2560×1440`

# Map lenses and map chrome — THR-1878

*The map is the table of the new game screen, and today it shouts every overlay at once, has no controls, opens on a 300 px close-up and draws places that look alike: this plan turns the four settled lens and chrome decisions into seven buildable slices that grow by adding entries to lists.*

## Why this is load-bearing

The wayfinder map [THR-1823](https://linear.app/threadbare/issue/THR-1823) closed with the map at the centre of the new screen ("the map is the table"). Four decisions say what that map does: lenses ([THR-1830](https://linear.app/threadbare/issue/THR-1830)), chrome and markers ([THR-1831](https://linear.app/threadbare/issue/THR-1831), with label weights corrected by [THR-1833](https://linear.app/threadbare/issue/THR-1833)), the icon family with carved places ([THR-1834](https://linear.app/threadbare/issue/THR-1834) call 2b), and the data behind each lens ([THR-1824](https://linear.app/threadbare/issue/THR-1824)). Today, measured below, every overlay is always on, trade gold collides with the Dominion frontier gold, the camera has no buttons, keys or minimap, the run opens five hexes wide at 1080p, agents sit on place names, every realm border is doom red, uncharted land is a black void, and the place drawings are "very alike at a glance and a bit too abstract" (Christian, 2026-10-14). The shipped Dominion lens ([THR-1750](https://linear.app/threadbare/issue/THR-1750)) is lens one, but GameView dispatches on the literal `'dominion'`, so a second lens today means a second hand-wired path. Law 58 (ratified 2026-10-14) forbids exactly that: lenses, map markers and place shapes are each one list, a missing entry fails a named test, and an unknown entry draws a plain fallback. This plan specifies all of it on the foundation merged today: the view-model seam ([THR-1822](https://linear.app/threadbare/issue/THR-1822)), the GameView split ([THR-1881](https://linear.app/threadbare/issue/THR-1881)), the primitives ([THR-1821](https://linear.app/threadbare/issue/THR-1821) → [THR-1884](https://linear.app/threadbare/issue/THR-1884), [THR-1885](https://linear.app/threadbare/issue/THR-1885)) and the 1440p layout contract ([THR-1819](https://linear.app/threadbare/issue/THR-1819)).

## Settled input (not re-opened)

**Authoring under a waived veto window.** Christian asked in chat on 2026-10-14 for the five map carve-up plan docs (THR-1875 to THR-1879) to be written now, in parallel, in an attended session. That waives the design lane's one-day veto window on the lane-made decisions they build on (THR-1828, THR-1829, THR-1830, THR-1831, THR-1832, THR-1833). Those decisions are settled input here. Their veto stays open in chat, but it does not block authoring or building.

| Source | What it fixes for this plan |
|---|---|
| [THR-1830 lenses](../audits/2026-10-14-thr-1830-map-lenses-decision.md) (lane, 2026-10-14; mock [`lens-mock.html`](../audits/2026-10-14-thr-1830-map-lenses/lens-mock.html)) | Four lenses, one at a time, none by default: `1` Dominion (as built), `2` Threads, `3` Trouble, `4` Trade; `5` reserved and unbound. One grammar: dim what is not in focus (near-black, one strength, Dominion's Foreign dim), one ink per lens. Fog covers every mark; the minimap shows no lens. The bar stays top-left where THR-1750's switch is, legend under it capped at 180 px, pressed state an underline, never gold, labels only until the icon family lands. The plain map keeps your people's threads, battles and sieges, the band-drop badge, borders, places, agents; **trade routes, unrest pulses and rival scheme marks move into their lenses**. Spheres is not a lens: a pressure clause joins the Dominion hover line. Sieges must draw as sieges. A lit hex opens the same land page as any hex, unfiltered |
| [THR-1831 chrome](../audits/2026-10-11-thr-1831-map-chrome-decision.md) (lane, 2026-10-11) | Bottom-right control cluster, 16 px in, anchored to the canvas: zoom in, zoom out, centre on my First (else the seat), show known land; 40 px buttons with registry tooltips; zoom ×2 around the canvas centre over 500 ms; disabled-with-reason at a limit. `FOCUS_ZOOM = 10` for every "show me" jump. Minimap 240×180 above the cluster, open at 1440p, folded into a fifth button at 1080p, state remembered; whole grid, known land in a flat tone per terrain family, unknown land uncharted, the First as a gold pip, the view as a rectangle; click to centre, drag to pan. Opening view: centred on the First at `clamp(fitKnownLand, 6, 10)`, no animation, opening-frame zoom mismatch fixed. Marker sizes per band (table below); agents become label-collision obstacles; the dead retinue branch goes. Borders in the holder's darkened ink (mixed 40% toward the terrain shadow, 0.45 opacity, 1.0 wide); red and gold kept out of border ink; capitals take the holder's ink. Unknown in-grid land is parchment through a palette token `fogUnexploredFill`; off-grid stays dark with a soft vignette. Label sizes by band; realm names title case at 0.02em |
| [THR-1833 type](../audits/2026-10-13-thr-1833-type-system-decision.md) § 5 (lane, 2026-10-13) | Place names in **Alegreya Sans with a dark halo**, weights **capital 800, city 700, town 500, small 400** (corrects THR-1831's 700/600/500/400 — Alegreya Sans has no 600). Realm names Cinzel 600, title case, 0.02em while ≥ 22 px; below 22 px Alegreya Sans 700, title case |
| [THR-1834 icons](../audits/2026-10-14-thr-1834-icon-family-decision.md) call 2b (Christian, chat 2026-10-14; human gate satisfied via chat review) | Places are carved on the map and in panels: capital `tower-flag`, city `medieval-gate`, town `village`, hamlet `wood-cabin`, castle `white-tower`, temple `greek-temple`, shrine `fire-shrine`, ruins `ancient-ruins`, mine `mine-wagon`, camp `camping-tent`, lair `cave-entrance`. On the map they keep the near-black ink and outline pass of `locationIconTextures.ts`, take the shape as one path `{ d, opacity: 1 }` on a 512 grid, keep the size classes and the lair sphere tints; a missing shape is never an emoji. Lens and control icons come from the same carved family |
| [THR-1824 research](https://linear.app/threadbare/issue/THR-1824) (resolution comment, 2026-10-11) | The data behind each lens is live today: `thread` edges and court position; `movementState.destinationId` (dormant on screen); hex pulse; battles and sieges; rival schemes and drains (`rivalId`, `reason`); lair tier; local `emittedOmens` (dormant on screen); `trades_with` routes with cargo and threat; prosperity tiers and stock tiers. Doom has no geography (legend head only) |
| [THR-1750 Dominion on screen](2026-10-12-thr-1750-dominion-on-screen.md) (shipped) | Lens one is built: `MAP_LENSES`, `MapLensSwitch`, `DominionLensLayer`, `DominionDropBadge`, `dominionLensVM`, `dominionHexLineVM`, key `1`. **This plan hosts it and never forks it** |
| [THR-1822 view-model seam](2026-10-14-thr-1822-view-model-seam.md) (Ready for Dev) | Lens VMs live in `src/engine/views/lenses/` (D11), behind `readView` (D3), filtered by the seen floor's hex rule (D5), with hex contents from one index (D6). The lens build is § D16 step 3: it rides on step 1's map sources and builds into `GameMap` |
| [THR-1881 GameView split](https://linear.app/threadbare/issue/THR-1881) (Todo) | **The host this plan builds into is `src/components/Game/map/GameMap.tsx`** (step d: HexMapV2, the lens switch, map overlays). Shared state read by more than one host lives in one `GameScreenState` context; the active lens is named there |
| [THR-1821](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md) → THR-1884 (Overlay, Panel), THR-1885 (Icon, Chip, Tabs) | The lens bar is `Tabs kind="toggle" allowNone` with key caps; the legend and minimap are `Panel level="panel" material="glass"`; icons come through `Icon` and the one resolver `iconShape()`, which the map's texture builder also reads; the UI-debt ratchet must not go up |
| [THR-1819](2026-10-14-thr-1819-1440p-layout-contract.md) § 5 | The map canvas is 1260 px wide at 1080p with both rails, 984 px with the Inspector docked; 1740 px and 1387 px at 1440p. Map label sizes are screen-px constants by zoom band and do not take the root step |
| [THR-1828 frame](../audits/2026-10-12-thr-1828-screen-frame-decision.md) § 6 (lane, 2026-10-12) | Keeps Space, `+`/`=`, `-`, `.`, `m`; gives `W` to widen, `N` to Needs you, `L` to the Ledger; Ctrl+K and `/` to Find. **This collides with THR-1831's zoom and WASD keys** — resolved in D9 |
| [THR-1827 Inspector](../audits/2026-10-11-thr-1827-inspector-decision.md) call 15 | A map click on open land opens the land page; agents and armies open themselves. `LiveLocationBar` retires; its job moves to the Threads and Trouble lenses and Needs you |
| Laws 57 and 58 (`Docs/design-system/laws.md`, ratified 2026-10-14) | A panel grows to its limit before it scrolls or truncates. The UI grows by adding entries: one list per kind, a missing entry fails a named test, an unknown kind shows a plain fallback, each list gets a row in `Docs/design-system/extending.md` |

**Ownership with the other four carve-up plans** (brief, 2026-10-14): THR-1876 owns the land page, the hex-click route and the arming flow; this plan leaves the hex click untouched, so THR-1876's route reaches every hex, lit or dimmed (D11). THR-1879 owns the icon registry's contents, the concept → shape table (places included), vendoring and the credits line; this plan names the concepts it needs and owns the map's texture path, size classes and lair tints. THR-1877 owns the Stage. THR-1875 owns the frame and its keys. THR-1881 owns the extraction order.

**[THR-1846](https://linear.app/threadbare/issue/THR-1846) (sieges drawn as field battles) has shipped** (Done 2026-10-14 02:05 UTC). Re-measured: `createSiegeIndicatorMesh` no longer exists, `sieges` is not a HexMapV2 prop, and a siege is a `battles` entry with `isSiege: true`. The Trouble lens builds on that fix and owes nothing for it.

## Substrate inventory

Step 0.6 greps: `MapLensBar`, `MapControls`, `Minimap`, `map-markers`, `MAP_MARKERS`, `MAP_KEYS`, `fogUnexploredFill`, `FOCUS_ZOOM` → 0 hits in `src/`. `src/engine/views/`, `src/components/Game/map/`, `src/components/Game/hosts/` → do not exist yet (THR-1822 and THR-1881 create them).

Inventory subsystems (`Docs/canon/systems-inventory.md`) touched, all read-only: **World Generation, Terrain & Places** (the hex map, place icons, labels, borders, fog — every HexMapV2 row below), **Movement & Colocation** (destinations), **Rival Gods & Schemes** (rival marks), **Omens & Atmospheric Pressure** (local omens), **Mortal Economy & Prosperity** (routes, prosperity, stock), **Strategic Projects & Control** (realm holders), **Intelligence, Knowledge & Familiarity** (visibility, the seen floor), **Essence & Divine Economy** via the Dominion lens. The rows name the modules inside them.

| Existing subsystem / module | Status | This plan |
|---|---|---|
| Map lens registry — `src/data/map-lenses.ts` (`MapLensId = 'dominion'`, `MAP_LENSES` one row, `mapLensForKey`) | 🟢 ACTIVE | **extends**: three rows, a `layer` field; the closed union grows |
| Dominion lens — `DominionLensLayer.ts`, `DominionDropBadge.ts`, `dominionViewModels.ts` (`dominionLensVM` :173, `dominionHexLineVM` :214), `dominionProjection.ts` | 🟢 ACTIVE | **reused unchanged** as lens one; `dominionHexLineVM` gains one optional field (the pressure clause) |
| `MapLensSwitch.tsx` (`HexMapV2/chrome/`, top-left, inset 16, maps over `MAP_LENSES`) | 🟢 ACTIVE | **rebuilt in place** on `Tabs kind="toggle"`; export name kept |
| Lens hotkey in `useTopBarHotkeys.ts:29` (`mapLensForKey`) | 🟢 ACTIVE | **preserved**; the inline keys become an exported `TOP_BAR_KEYS` list |
| Thread lines — `ThreadLineMesh.ts` (`THREAD_COLORS` :29) | 🟢 ACTIVE | **preserved** on the plain map; its court colours are the Threads ink |
| Trade routes — `tradeRouteMarkers.ts` (`buildTradeRouteLines` :50, `buildRouteTooltipsByHex` :75), `TradeRouteMesh.ts` | 🟢 ACTIVE | **moved** off the plain map into the Trade lens, mesh and words reused |
| Rival marks — `rivalInfluenceMarkers.ts` (`buildRivalInfluenceMarkers` :97; `rivalId`, `targetId`, `reason`), `RivalInfluenceMesh.ts` | 🟢 ACTIVE | producer **reused** by the Trouble lens; the mesh loses its only caller and is deleted |
| Unrest pulse — `computeLocationPulse` (`deriveLocationActivities.ts:177`), `HexPulseMesh.ts` (tense gold, volatile red) | 🟢 ACTIVE | producer **reused** by the Trouble lens; the mesh loses its only caller and is deleted |
| Battles and sieges — `BattleIndicatorLayer.ts` (`battleIndicatorForNode` :215; `isSiege`) | 🟢 ACTIVE (THR-1846 fixed) | **preserved** on the plain map; its sprites switch to carved shapes in the Trouble slice |
| Local omens — `state.emittedOmens`, `scope.kind: 'local'` (`types/omen.ts:149-152`) | 🟠 DORMANT on screen (read only by agent decision bias) | **activated** on screen by the Trouble lens |
| Thread destinations — `movementState.destinationId` (`phaseMovement.ts:147`) | 🟠 DORMANT on screen (avatar only) | **activated** by the Threads lens |
| Economy per place — `getProsperityTier` (`phaseProsperity.ts:202`), `stockTier` (`phases/resourceStockTiers.ts:120`) | 🟠 DORMANT on the map | **activated** by the Trade lens hover |
| Camera — `camera/D3ZoomCamera.ts` (`CAMERA_CONSTANTS` :10-26, `computeFitZoom` :64), ZOOM-05 opening (`HexMapV2.tsx:1241-1260`), labels' zoom state (`:699-702`, listener `:1184`) | 🟢 ACTIVE | **extends**: `FOCUS_ZOOM`, `zoomBy`, `focusOn`, `fitKnownLand`; ZOOM-05 retired; opening frame fixed |
| Agent sprites — `AgentSpriteMesh.ts` (`updateZoomVisibility` :357, dead retinue branch :377, `SPRITE_SCALE_REFERENCE_ZOOM` 7) | 🟢 ACTIVE | **extends**: screen-fixed sizes per band from one list; dead branch removed |
| Label collision — `overlay/labelCollision.ts` (`removeOverlaps(labels, prePlaced)` :134) | 🟢 ACTIVE | **extends**: marker boxes join `prePlaced` |
| Labels — `LocationLabelOverlay.tsx` (16/13/13/11 px, all 700, `--font-display`), `RegionLabelOverlay.tsx` (20 px, 700, uppercase, 0.08em) | 🟢 ACTIVE | **extends**: band sizes, THR-1833 weights and faces |
| Borders and palette — `BorderMesh.ts` (`REALM_HALF_WIDTH` 0.75, `BORDER_OPACITY` 0.7, one colour), `palette/paletteTheme.ts` (GOLDEN_HOUR and DARK_PARCHMENT; border, capital `0xC83030`) | 🟢 ACTIVE | **extends**: per-realm ink, a remap, the `fogUnexploredFill` token |
| Fog — `FogOverlayMesh.ts`, `fogShader.ts` (parchment texture path, fallback `#3d3025`) | 🟢 ACTIVE (but the player sees `#0a0a0c`, THR-1831) | **activated**: the parchment becomes what the player sees |
| Place icons — `locationIconRegistry.ts` (49-member `LocationType`, `LocationIconDef { paths, viewBox, sizeClass }`, `LOCATION_SIZE_SCALE`), `locationIconTextures.ts` (128 px, fill `#1a1a1a`, outline `#0a0a0a` × 2.5, `LAIR_SPHERE_FILL_COLORS`, `CLEARED_LAIR_FILL_COLOR`), `LocationIconMesh.ts` | 🟢 ACTIVE | **extends**: shapes from `iconShape()`; drawings retire; size classes and tints stay |
| Hex tooltip — `HexTooltip.tsx` (Dominion line; THR-1847 battle/siege words; route lines) | 🟢 ACTIVE | **extends**: one lens line per lens |
| `useRefRouter` (`src/hooks/useRefRouter.ts`; `WorldRefKind` includes `hex`) | 🟢 ACTIVE | **reused**: every name in a hover line routes through it (Law 21) |
| `getPronouns` (`src/data/domain-prose.ts:96`), `DOOM_STAGE_NAMES` / the doom clock's stage `name` (`doomClock.ts:668`), `ui.siege` / `ui.battle` (`ui-content.ts:161-165`) | 🟢 ACTIVE | **reused** for hover and legend words; nothing re-authored |
| `hexLineDraw` (`src/engine/worldgen/passes/pass09-validation.ts:146`, private; cube lerp, interior hexes only) | 🟢 ACTIVE (world-gen validation) | **hoisted** into `src/lib/hexMath.ts` as `hexLine(a, b, { includeEnds })`, and pass09 calls it; no second line function is written |

**Population consumed** (headless CLI, `--seed 42 --map medium`, measured this session): 768 hex tiles; 1,124 location nodes (both tiers); at tick 120, 6 trade routes (0 threatened), 1 siege, 25 lairs, 0 emitted omens; at tick 240, 4 routes (0 threatened), 1 siege, 38 lairs, 2 emitted omens (0 local). The CLI world has no bonded First and no thread edges (known trap), so Threads data is verified in a browser with `?seeded`. THR-1759 measured 6 routes by tick 240. **Consequence:** Trade and the omen ring will often be empty early; both have empty-state words, and their tests run on fixtures that carry a route, a threatened route and a local omen.

## What the map does today (measured, `main` @ `0afcfc2b`)

| Fact | Evidence |
|---|---|
| Lens dispatch is hard-coded on `'dominion'` | `GameView.tsx:1950` `toggleMapLens` returns early for any other id; HexMapV2 takes a dedicated `dominionLens` prop (`:365-370`); no test iterates `MAP_LENSES` (`DominionOnScreen.test.tsx:62-75` uses the literal) |
| Lens state is a boolean in GameView, kept across view changes; HexMapV2 remounts at `viewLevel === 'world'` | `GameView.tsx:1943`, `:5732` |
| Every other overlay is always on | `GameView.tsx:5752-5772` passes `rivalInfluenceMarkers`, `tradeRouteLines`, `battles`, `threadLines`, `locationActivityMap` unconditionally |
| Trade gold `#c9a227` sits beside the frontier gold `#d4a040`; the tense pulse is also `#d4a040` | `TradeRouteMesh.ts`, `DominionLensLayer.ts:42`, `HexPulseMesh.ts` |
| No zoom buttons, no minimap, no map keyboard handler; `+`/`-` change sim speed | survey; `useTopBarHotkeys.ts` |
| The run opens at k = 15 on the First (5 hexes across at 1080p); the labels' zoom state starts at 1.5 until the first zoom event | `HexMapV2.tsx:1241-1260`, `:699-702`, `:1184` |
| The seat button and eye icons fly to k = 20 | `RETINUE_EYE_ZOOM_SCALE` `GameView.tsx:2311`; `handleCenterOnHex` `:2316-2335` |
| Agents are not label obstacles; the retinue-dot branch can never run | `labelCollision.ts:134` (only region boxes, `HexMapV2.tsx:626/2030`); `AgentSpriteMesh.ts:377` |
| Every realm border and capital is `0xC83030` at 0.7 opacity, 1.5 wide | `paletteTheme.ts:91`, `BorderMesh.ts:248` |
| The fog overlay is built to draw parchment, but the player sees near-black | `FogOverlayMesh.ts:97`, `fogShader.ts:17`; THR-1831 screenshots |
| Place labels 16/13/13/11 px, all 700 in Cinzel; realm names uppercase, 0.08em | `LocationLabelOverlay.tsx:45-61`, `RegionLabelOverlay.tsx:67-77` |
| 49 place types, each a hand-drawn multi-path icon on a 100-unit grid; unknown types are skipped (nothing drawn) | `locationIconRegistry.ts:22-76, 683-738`; GameView `:1260` |
| Four zoom-matrix rows have no reader (`dominion_lens`, `siege_ring`, `battle_indicator`, `armies`) | survey |
| A hex click goes agent pick → army pick → hex; GameView sends it to `HexDetailView`; unexplored hexes are not clickable | `HexMapV2.tsx:1915-1935`, `GameView.tsx:735` |

## Decisions

### D1 — One lens list drives everything

`MAP_LENSES` (`src/data/map-lenses.ts`) stays the one list of lenses. Each row grows one field:

```ts
export type MapLensId = 'dominion' | 'threads' | 'trouble' | 'trade';   // grows one member per row
export type MapLensLayerKind = 'dominion' | 'hex';
export interface MapLensDef {
  id: MapLensId;
  label: string;                 // "Dominion", "Threads", "Trouble", "Trade"
  key: string;                   // '1'..'4'; '5' stays reserved and unbound
  tooltipId: string;             // ui.dominion.lens, ui.lens.threads, ui.lens.trouble, ui.lens.trade
  legend: readonly string[];     // the lens's fixed legend lines (Dominion: as built)
  layer: MapLensLayerKind;       // which layer family draws it
}
```

Everything else is **derived from the list or keyed on its union**, so a new lens is one row plus its data:

- **The bar** maps over `MAP_LENSES` (as `MapLensSwitch` already does).
- **The key** is the row's `key`, read by `mapLensForKey` (as built).
- **The view model** comes from `LENS_SELECTORS: Record<MapLensId, LensSelector>` in `src/engine/views/lenses/lensView.ts` — a total record, so a lens without a selector is a compile error naming the record. The Dominion entry calls `ensureDominionProjection` + `dominionLensVM` exactly as GameView does today (THR-1822 E5).
- **The layer** comes from `LENS_LAYER_FACTORIES: Record<MapLensLayerKind, LensLayerFactory>` in HexMapV2. `'dominion'` is `createDominionLensLayer` unchanged; `'hex'` is one generic `createHexLensLayer` (D3) that every new lens uses. A new hex lens writes no layer code.
- **Its marks** are rows in `MAP_MARKERS` with `lens: <id>` (D5), and its legend's mark rows are derived from them.
- **Its icon** comes from THR-1879's `ICON_FOR_LENS: Record<MapLensId, IconName>` once that table exists. Until then the bar shows labels only (THR-1830 § 3).

**The named coverage test** is `src/data/__tests__/mapLenses.coverage.test.ts`. For every `MAP_LENSES` row it asserts: ids unique; keys unique, inside `'1'..'5'`, and absent from `TOP_BAR_KEYS` and `MAP_KEYS` (D9); `tooltipId` registered in `UI_TOOLTIPS`; for a `'hex'` lens, building its selector on the shared lens fixture world emits only mark kinds that have a `MAP_MARKERS` row whose `lens` is this lens (so a mark with no entry fails and names the kind and the list); the Dominion arm of `selectLensView` deep-equals `dominionLensVM`'s output (THR-1822 D17). Failure messages name the list and the missing entry (Law 58).

**Unknown lens, plain fallback.** An id that reaches the host without a row (only possible through the debug bridge or a stale saved value) draws no lens, presses no button, warns once and traces `ui_map_lens_changed` with `to: null`. `__DEBUG.setMapLens('nope')` returns `{ error }` naming the valid ids.

### D2 — Where lens state lives, and the one-at-a-time rule

- `activeLens: MapLensId | null` lives in THR-1881's `GameScreenState` (the frame's key hook writes it; `GameMap` reads it). It is `null` at the start of every run and kept across view changes in the session (as THR-1750 built).
- **Radio, not stack.** Pressing a lens turns it on and any other off; pressing it again turns it off. One reducer action, `toggleLens(id)`, used by the bar, the key and the debug bridge.
- **Two dims never stack.** `GameScreenState.lensSuppressed: boolean` (default `false`) is set by the Stage build (THR-1877) while a moment dims the map and by the arming flow (THR-1876) if card arming lights the map. While it is true the lens layer is not drawn; the bar keeps the lens pressed and shows the reason in the pressed button's tooltip: "Hidden while a moment plays" or "Hidden while a card is armed". When it clears, the lens returns. This plan adds the flag and honours it; the other builds set it (coordination comments on THR-1876 and THR-1877, 2026-10-14).

### D3 — One generic layer for hex lenses

`createHexLensLayer(vm: HexLensVM, markers: typeof MAP_MARKERS): LensLayer` (new, `src/components/HexMapV2/scene/HexLensLayer.ts`) draws every non-Dominion lens:

- **Dim.** One `InstancedMesh` over every land hex **not** in `vm.lit`, colour `DOMINION_DIM_COLOR` (`#0b0907`), alpha `LENS_DIM_ALPHA`. `LENS_DIM_ALPHA` is defined as `DOMINION_DIM_FOREIGN` (0.45) by import, not by copy: THR-1830 fixed "one strength, Dominion's Foreign dim", so the value lives once. Render order `RENDER_ORDER.LENS_DIM = 8.95` (the Dominion dim's slot; only one lens draws at a time).
- **Marks.** Each `LensMark` is drawn by the renderer its `MAP_MARKERS` entry names (`draw: 'badge' | 'omenRing' | 'arrow' | 'road' | 'agentStep'`; `omenRing` is the dotted ring plus its centre badge, `road` is the line plus its mid-road badge), from `LENS_MARK_RENDERERS: Record<MarkDrawKind, …>` (total). A mark kind with no `MAP_MARKERS` row draws the neutral `fallback` badge in the lens ink and warns once (Law 58).
- **Fog covers it.** Every lens object sits below `RENDER_ORDER.FOG` (13), and the VM never emits a mark or hover line on an `unexplored` hex (THR-1822 D5 hex rule). Two guards for one rule.
- **Built on toggle, not hidden by alpha** (the THR-1750 rule): with no lens on, no lens object is in the scene. A VM change (world-keyed, at most once per tick) rebuilds the layer.
- **Not pickable.** No lens object is a raycast target, so a hex click with a lens on reaches the same handler with the same coordinates as with no lens (D11).
- **Zoom.** `ZOOM_VISIBILITY_MATRIX` gains `lens_dim` (every tier), `lens_marks` (regional, hero-local), `lens_arrows` and `lens_rings` (continental and closer). At continental and full-world the dim alone carries the lens. The unread `dominion_lens` row is wired to the Dominion layer (it shows at every tier, as today) or deleted; a matrix row no code reads does not survive the slice that touches its layer.

### D4 — The four lenses

Each lens's VM is THR-1822's `HexLensVM` (D11), built in `src/engine/views/lenses/<id>Lens.ts`, world-keyed, filtered by `knowledgeFilterFor(ctx, 'lensMarks')`. **One refinement to D11:** the hover line becomes structured so names can route (Law 21; THR-1830's UI-laws table makes routing a build obligation):

```ts
export interface LensLine { segments: { text: string; ref: WorldRef | null }[] }   // a name is a segment with its ref
export interface HexLensVM {
  lensId: Exclude<MapLensId, 'dominion'>;
  lit: HexKey[];
  marks: LensMark[];
  hover: Record<HexKey, LensLine[]>;   // one line per thing on the hex, at most LENS_HOVER_MAX_LINES
  legend: { head: string; lines: string[] };
  emptyLine: string | null;
}
export interface LensMark {
  kind: LensMarkKind;                  // a MAP_MARKERS key whose lens is this lens
  hexKey: HexKey;
  toHexKey?: HexKey;                   // arrows and roads
  ref?: WorldRef;                      // what the mark is about (the agent, the rival's target, the route's end)
  tone: 'first' | 'retinue' | 'watched' | 'trouble' | 'caravan' | 'threat';
  weight?: number;                     // roads only: the route's volume, read by TradeRouteMesh for line width; geometry, never rendered as text
}
```

THR-1822 D11 typed `hover` as `Record<HexKey, string>`; THR-1822 slice 1 builds no lens VM (its § D16 step 3 is this plan), so the refinement lands with the first consumer, and THR-1822's kill criterion 4 ("revise the type, never bypass the seam") is honoured by recording it here.

**Dominion (1)** — exactly as built: `DominionLensLayer`, the drop badge, the legend with its five band chips, the hover line *"Held ground, by Hesk Crossing"*. **One addition (THR-1830 § 5): the pressure clause.** `dominionHexLineVM` gains an optional `pressure: string | null` field, computed from the **lending place's own** `sphereAffinity.scores` (the read `getHexSphereInfluence` makes, `hexZoom.ts:70`):

1. For each sphere `g` the god holds (`spherePoints[g] > 0`) that has an opposite (`SPHERE_OPPOSITES[g]` is not `null`), weigh the opposing pole: `w(g) = DOMINION_OPPOSITION_WEIGHT[g] × score[SPHERE_OPPOSITES[g]] / MAX_SPHERE_SCORE` (the existing table at `dominion-content.ts:43`, the pairing at `cosmology.ts:62`, and the score scale at `types/sphereAffinity.ts:59`).
2. Take the `g` with the largest `w(g)` (ties: the god's primary sphere, then sphere order). If `w(g) < DOMINION_PRESSURE_LINE_MIN`, there is no clause.
3. Otherwise the clause is `DOMINION_PRESSURE_LINE.holds` when `score[g] ≥ score[opposite(g)]`, else `DOMINION_PRESSURE_LINE.giving`, with the sphere display names filled in.

No lending place (terrain fallback past the fill radius), no ascendant, or no scores → no clause. `HexTooltip` renders it on a second line under the band line. `DominionLensLayer`, `dominionLensVM` and the projection are not edited.

**Threads (2).**
- *Focus:* each mortal with a `thread` edge from the god at court position `the_first`, `retinue` or `watched` (dormant threads stay dark, matching the legend's three court words), at the hex of its Location (from `hexContents`, THR-1822 D6); plus the hex of its destination when `movementState.destinationId` is set (resolved through `resolveToParentLocation` to a Location, then its hex).
- *Marks:* `medallion` per mortal (draw `agentStep`: the agent layer draws that mortal's marker one step up — × `THREADS_LENS_MEDALLION_SCALE` — with a name tag under it); `destination` per moving mortal (draw `arrow`: a dashed arrow from the mortal's hex to the destination hex, in the mortal's court colour from `THREAD_COLORS`). Thread lines from the avatar stay as on the plain map; with no avatar the lens still lights the hexes.
- *Name tags:* an HTML overlay in the label layer (`LensNameTags`), Alegreya Sans 700 at `THREADS_NAME_TAG_PX`, dark halo, shown at continental and closer. Tags are label-collision obstacles of the highest priority (a place label yields; a tag never moves).
- *Hover:* on a mortal's hex, *"Maren Ashfold, your First, is here."* or *"Maren Ashfold, your First, is here, on her way to Hesk Crossing."*; on a destination hex, *"Maren Ashfold, your First, is on her way here from Millbrook."* Court phrases: the First → "your First", retinue → "of your retinue", watched → "whom you watch". Pronouns from `getPronouns(gender)`; when gender is unknown, "on the way". Names and places are `ref` segments. Past `LENS_HOVER_MAX_LINES`: *"and others of your people"*.
- *Legend* (THR-1830): head "Threads"; lines *"Your people keep their light; the rest is dimmed."* · *"A dashed arrow shows where each is going."*; mark row, derived from `MAP_MARKERS` (D5): "The First", "Retinue", "Watched" (the `medallion` kind's three court entries, each with its court-colour swatch) and "Heading" (the `destination` kind, a dashed-arrow swatch).
- *Empty:* "You have no threaded mortals yet." (before the bond, `?firstunmet`).

**Trouble (3).**
- *Focus:* hexes with unrest (`computeLocationPulse` tense or volatile), a battle, a siege, a rival scheme or drain (`buildRivalInfluenceMarkers`), an undefeated lair (lair tier set, not cleared), or inside a local omen's reach (`emittedOmens` with `scope.kind === 'local'`, hex distance ≤ `radius`, default `TROUBLE_OMEN_DEFAULT_RADIUS` when absent, not yet expired).
- *Marks*, all in the doom ink (`--forecast-doomed-rgb`, 232 64 56), each a `badge` (a dark disc with a red ring and the kind's carved icon) along the hex's lower edge, at most `LENS_BADGES_PER_HEX` per hex (never a number; the hover lists every kind): `unrest`, `scheme`, `drain`, `lair`, and `omen` (draw `omenRing`: the badge at the omen's centre hex plus a dotted red circle of the reach). **Battles and sieges get no lens badge**: the plain map already draws them, and the lens only lights their hexes. So that the legend and the map show one shape, this slice switches `BattleIndicatorLayer`'s sprites to the carved `crossed-swords` and `catapult` (the siege keeps its ring; colours unchanged), through the shared map icon texture (D13); their plain `MAP_MARKERS` rows list Trouble in `legendIn`, so they appear in its legend.
- *Hover:* *"Tense: people here are coming to blows."* / *"Volatile: the fighting here is spreading."*; *"A scheme of The Salt Spire: it is turning Ferris away from you."* (`reason: 'scheme'`); *"A drain of The Salt Spire: it is contesting your source at Ferris."* (`source_contested`) / *"… it has defiled your source at Ferris."* (`source_desecrated`); *"Wolf Hollow: a lair."* / *"a great lair"* / *"a legendary lair"* by lair tier; *"An omen of Entropy hangs over this land."* (no sphere: *"An omen hangs over this land."*). Battles and sieges keep the THR-1847 tooltip words already on the plain hex tooltip; the lens adds no second line for them (PC-5). The rival is a `ref` segment; rivals are not graph nodes, so it routes to the rival surface the top bar's Rivals list already opens. Past `LENS_HOVER_MAX_LINES`: *"and more trouble here"*.
- *Legend:* head *"Trouble · Doom: Signs"*: the doom clock's current stage name, as the doom bar shows it; line *"Lit ground is where something is going wrong."*; mark row derived from `MAP_MARKERS` in list order: Unrest, Battle, Siege, Scheme, Drain, Omen, Lair, each with its carved icon in its ink.
- *Empty:* "Nothing is going wrong that you can see."

**Trade (4).**
- *Focus:* every hex on a known trade road: the hexes of the cube-coordinate line between the route's two ends, ends included, for each `trades_with` route with at least one end nameable under the seen floor (a road you know of). The line comes from `hexLine` in `src/lib/hexMath.ts`, hoisted from world-gen's private `hexLineDraw` (substrate inventory); pass09 switches to it with its output unchanged (interior hexes, `includeEnds: false`), pinned by a test.
- *Marks:* `road` (draw `road`: the existing `TradeRouteMesh` builder, caravan gold `#c9a227`, red `#dc2626` when threatened, width from the route's `weight` exactly as today, plus one badge mid-road with the Trade shape in the road's ink).
- *Hover:* the existing route words from `buildRouteTooltipsByHex` (*"A road to Hesk Crossing, carrying grain and salt."*, plus "blockaded" / "fading" and "Threatened."), then one line per end: *"Millbrook is prosperous; Hesk Crossing is struggling and short of iron."* (`getProsperityTier` lower-cased; scarce goods from `stockTier`). These words leave the plain hex tooltip in the same slice: a fact the plain map no longer draws is told in its lens, once (PC-6). Past `LENS_HOVER_MAX_LINES`: *"and more roads through here"*.
- *Legend:* head "Trade"; lines *"Lit ground lies on a trade road you know of."* · *"A gold road carries goods; a red road is threatened."*; mark row derived from `MAP_MARKERS`: "Trade road" (gold swatch with the Trade shape) and "Threatened road" (red), the `road` kind's two entries.
- *Empty* (THR-1830): "No trade road you know of yet."

### D5 — One list of map markers

`MAP_MARKERS` (new, `src/data/map-markers.ts`) is the one list of every kind of marker the map draws on top of the land, plain or lens:

```ts
export type ZoomBand = 'fullWorld' | 'continental' | 'regional' | 'heroLocal';   // ZOOM_TIER_THRESHOLDS: <1.5, 1.5–5, 5–15, ≥15
export interface MarkerLegendEntry {
  word: string;                                   // "Unrest", "The First", "Threatened road"
  tooltipId: string;                              // ui.* registry id (Laws 1, 17)
  tone?: LensMark['tone'];                        // which variant of the mark this entry shows (court colour, threatened road)
}
export interface MapMarkerDef {
  lens: MapLensId | null;                         // null = the plain map
  draw: 'portrait' | 'dot' | 'pip' | 'medallion' | 'badge' | 'omenRing' | 'arrow' | 'road' | 'agentStep' | 'sprite';
  sizePx: Record<ZoomBand, number | null> | 'mesh'; // screen px per band (null = hidden in that band); 'mesh' = its own mesh sizes it, unchanged by this plan
  icon: IconConcept | null;                       // the concept THR-1879 maps to a shape; null for portraits, dots, rings, roads
  ink: MarkerInk;                                 // a semantic key → token: 'faction' | 'court' | 'trouble' | 'caravan' | 'threat' | 'battle' | 'siege' | 'frontierGold'
  legend: readonly MarkerLegendEntry[];           // what this kind contributes to a legend (one entry, or one per variant)
  legendIn: readonly MapLensId[];                 // the lenses whose legend shows it (a lens kind: its own lens; a plain kind may join a lens's legend)
}
export const MAP_MARKERS: Record<MapMarkerKind, MapMarkerDef>;
```

| Kind | Lens | Size per band (full-world · continental · regional · hero-local) | Legend entries → shown in | Notes |
|---|---|---|---|---|
| `agent` | plain | hidden · 10 dot · 14 dot · 48 portrait | none | THR-1831; faction colour |
| `threadedAgent` | plain | 12 gold pip · 32 medallion · 40 medallion · 64 portrait | none | THR-1831; "you can always find your own" |
| `avatar` | plain | 12 pip · 32 medallion · 40 medallion · 82 portrait | none | the god's avatar keeps its 82 px close-up (today's size) and its sphere ring; it joins the threaded bands elsewhere |
| `army`, `bandDrop` | plain | `'mesh'` (as drawn today) | none | listed so the list is whole; sizes unchanged |
| `battle`, `siege` | plain | `'mesh'` (as drawn today) | "Battle" (`ui.battle`), "Siege" (`ui.siege`) → Trouble | their sprites become the carved shapes (D4) |
| `medallion` | threads | per `threadedAgent` × `THREADS_LENS_MEDALLION_SCALE` | "The First", "Retinue", "Watched" → Threads | one entry per court tone |
| `destination` | threads | arrow at continental and closer | "Heading" → Threads | dashed arrow |
| `unrest`, `scheme`, `drain`, `lair` | trouble | badge `LENS_BADGE_PX` at regional and hero-local | "Unrest", "Scheme", "Drain", "Lair" → Trouble | |
| `omen` | trouble | ring at continental and closer; centre badge at regional and hero-local | "Omen" → Trouble | |
| `road` | trade | line at every band; mid-road badge at regional and hero-local | "Trade road", "Threatened road" → Trade | one entry per tone |

- **Sizes are screen-fixed per band** (THR-1831 § 4): a sprite's world scale is `sizePx / k`, updated on zoom; the world-space growth up to `SPRITE_SCALE_REFERENCE_ZOOM` goes.
- **Legends are derived**: a lens legend's mark row is every `legend` entry of every `MAP_MARKERS` row whose `legendIn` names the lens, in list order. The legend therefore cannot disagree with the map (Laws 12, 58), and the Trouble legend shows battles and sieges because their plain rows say so.
- **Named test** `src/data/__tests__/mapMarkers.coverage.test.ts`: every kind has a `sizePx` entry for all four bands (or `'mesh'`); every lens kind lists its own lens in `legendIn` and has at least one legend entry; every `legendIn` lens exists in `MAP_LENSES`; every legend `tooltipId` is registered; every tone a lens VM emits for a kind with per-tone entries has an entry; every `icon` concept resolves through THR-1879's table to a shape that is not `fallback` (this assertion turns on when the table lands, and is a named `it.todo` until then); a meaning-bearing badge size is at least the Law 11 floor. The derived legends for Threads, Trouble and Trade are pinned word for word against the Player-facing text table.
- **Not in the list (by scope):** activity icons and company clusters. They are not touched by this plan; whichever ticket next changes them adds their rows.

### D6 — The control cluster

`MapControls` (new, `src/components/HexMapV2/chrome/MapControls.tsx`), mounted by `GameMap`:

- A vertical column in the map canvas's bottom-right corner, `MAP_CHROME_INSET_PX` (16) from both canvas edges, anchored to the canvas so it moves with the docked Inspector. Buttons are the shared `IconButton`, `2.5rem` square (40 px at 1080p, 45 px at 1440p), icon at the `alone` size (THR-1834 call 5: a lone icon is 34 px with a tooltip), `aria-label` and a `ui.map.*` tooltip on each; z-band `hud` from `zBands.ts` (THR-1884).
- **The buttons, in order:** Zoom in · Zoom out · Centre on my First · Show known land · (at 1080p, folded) Show the minimap. They come from one list (D9), so the button and its key cannot disagree.
- **Behaviour:** Zoom in and out: × `ZOOM_STEP_FACTOR` (2) around the canvas centre, eased over `JUMP_TO_DURATION_MS` (500). Centre on my First: `focusOn(firstHex)` at `FOCUS_ZOOM`; with no First, the god's seat (`homeSeatLocationId`); with neither, disabled with the reason "No one to centre on yet". Show known land: fit the explored hexes' bounds (`fitKnownLand`, D8) unclamped between the camera's own limits.
- **Limits** (Law 25): at `MAX_ZOOM` Zoom in is disabled with "Closest view"; at the minimum, Zoom out with "Widest view". Never silently inert.
- **Reply** (Law 47, PC-8): the camera starts moving within one frame of the click; a disabled button answers with its reason in the tooltip and the sanctioned rejection shake.

### D7 — One centring zoom

`CAMERA_CONSTANTS.FOCUS_ZOOM = 10` (regional: your threaded mortals as portrait medallions, about 200 px hexes, so the thing and its neighbours are both in view). The map handle gains `focusOn(hex: HexCoord)` (centre at `FOCUS_ZOOM`, eased) and `zoomBy(factor)`. The seat button (`onCenterOnSeat`), the eye icons (today `RETINUE_EYE_ZOOM_SCALE = 20`) and Centre on my First all call `focusOn`. `RETINUE_EYE_ZOOM_SCALE` is removed with its last reader; the Inspector's Law 22 "Show on map" (THR-1876) calls the same method. The `AvatarHUD` centre button is never rendered (`GameView.tsx:5519`); its wiring is deleted, and the component too if nothing else imports it.

### D8 — The opening view

- **ZOOM-05's hero-local open retires.** The run opens centred on the First at `k = clamp(fitKnownLand, OPENING_ZOOM_MIN, OPENING_ZOOM_MAX)` (6, 10), duration 0. `fitKnownLand` is `computeFitZoom` applied to the bounds of every hex whose visibility is not `unexplored`, with `FIT_PADDING` 0.85. Measured by THR-1831, that is about k 8 at 2560×1440 (≈160 px hexes) and about k 6 at 1920×1080 (≈120 px).
- **Fallbacks:** no First → centred on the god's seat; no seat → centred on the known land's centre; fog off (`?nofog`) or no visibility map → the whole-grid fit, as today.
- **The opening-frame mismatch is fixed:** the labels' zoom state is seeded from the transform actually applied (read `d3.zoomTransform(canvas)` when the `zoom.labels` listener registers), never from `DEFAULT_ZOOM`. A test asserts the first rendered tier equals `getZoomTier(appliedK)`.
- The wrong px-per-hex comments in `D3ZoomCamera.ts` and `RegionLabelOverlay.tsx` are corrected (a hex is `HEX_SIZE × 2 × k` px across).

### D9 — Keys: one list of map commands

THR-1828 § 6 (decided after THR-1831) keeps `+`/`=`/`-` for speed and gives `W` to widen. So THR-1831's zoom keys and WASD cannot ship as written. **This plan moves them** (a technical resolution between two lane decisions; veto invited in the handoff):

| Key | Command | Button |
|---|---|---|
| `PageUp` / `PageDown` | Zoom in / out (× 2) | Zoom in / Zoom out |
| Arrow keys | Pan by `PAN_STEP_FRACTION` (1/3) of the canvas, eased over `PAN_DURATION_MS` | — |
| `Home` | Centre on my First | Centre on my First |
| `F` | Show known land | Show known land |
| `1`–`4` | Lenses (from `MAP_LENSES`); `5` reserved | the lens bar |

WASD is dropped, not remapped: `W` is the Inspector's widen key, and a partial A/S/D set teaches a pattern the game does not keep.

- **One list.** `MAP_COMMANDS` (new, `src/data/map-commands.ts`): `{ id, keys: string[], button: { icon: IconConcept; tooltipId; ariaLabel } | null }[]`. `MapControls` renders the rows with a `button`; `useMapHotkeys` (new, in `GameMap`) binds every row's `keys`. Lens keys stay where they are (`useTopBarHotkeys`, from `MAP_LENSES`).
- **Inert** while focus is in a text field or a composite widget that uses arrows or Home (`role` tablist, toolbar, listbox, menu, grid), and while any escape layer above the map is open (`getEscapeLayers()`, THR-1884). Escape is never bound here (Law 23).
- **Named test** `src/data/__tests__/mapKeys.coverage.test.ts`: the keys of `MAP_COMMANDS`, `MAP_LENSES` and `TOP_BAR_KEYS` are pairwise disjoint (case-folded); every command with a button has a registered tooltip. `TOP_BAR_KEYS` is today's inline keys of `useTopBarHotkeys.ts` (Space, `+`, `=`, `-`, `.`, `m`, `M`) lifted into an exported array the hook reads, so the test reads the real list; the frame build (THR-1875) adds `N` and `L` to it (coordination comment, 2026-10-14).

### D10 — The minimap

`Minimap` (new, `src/components/HexMapV2/chrome/Minimap.tsx`), mounted by `GameMap` directly above the cluster:

- **Size and frame:** `MINIMAP_W_PX` × `MINIMAP_H_PX` (240 × 180) on `Panel level="panel" material="glass" floating`. The grid fits inside with its aspect kept; off-grid margin is `--bg-abyss`.
- **Open or folded:** open by default when the map canvas is at least `MINIMAP_AUTO_OPEN_MIN_CANVAS_PX` (1400) wide at first mount: THR-1819's 1740 px at 1440p opens it, 1260 px at 1080p folds it (THR-1831 § 2 and its "would change the call" in one rule). Folded, it is the cluster's fifth button. Once the player toggles it, the choice is kept in `localStorage` (`tb.map.minimapOpen`, read and written inside `try/catch`) and wins over the default. It never auto-folds when the Inspector docks (1387 px at 1440p still holds 240 px easily).
- **What it draws** (a 2D `<canvas>` at device pixel ratio, from the VM below): each known hex in its terrain family's flat tone; each unknown in-grid hex in the uncharted tone (the same `fogUnexploredFill` token as the map, D12, so the two agree); the First as a gold pip (`MINIMAP_FIRST_PIP_PX`); the current view as an outlined rectangle (`--text-primary`, drawn on an SVG overlay updated on every zoom event, so camera moves never redraw the terrain). **No lens** (THR-1831).
- **Moving the view:** click to centre the camera there at the current zoom (eased); drag the rectangle to pan live.
- **VM:** `selectMinimapView(ctx): MinimapVM` in `src/engine/views/map/minimap.ts`, world-keyed: `{ cols, rows, cells: MinimapCell[] /* 'u' unknown or a family key, row-major */, firstHex: HexKey | null }`. Terrain families are `MINIMAP_TERRAIN_FAMILY: Record<TerrainType, MinimapFamily>` (total; a new terrain type is a compile error naming the record); each family's tone is the active palette's colour for `MINIMAP_FAMILY_REPRESENTATIVE[family]`, so the minimap follows the dark palette too and keeps no colour table of its own.

### D11 — A lit hex opens the land page

No lens changes what a click does (THR-1830 § 7, THR-1827 call 15). Lens objects are not pick targets (D3); `GameMap` passes `onHexClick` through unchanged, so a click on any hex, lit or dimmed, reaches the one handler. Today that handler opens `HexDetailView`; when THR-1876's build routes it to the land page, every lens gets the land page with no change here. Lens marks are not click targets either: the names they are about route from the hover line (Law 21). A test asserts that with each lens on, a click on a lit hex and on a dimmed hex produces the same `onHexClick` call as with no lens.

### D12 — Borders in the holder's ink; uncharted land as parchment

- **Border ink.** Each realm's border takes its holder's heraldic colour (`FACTION_HERALDIC_COLORS` by the holder's index) mixed `BORDER_INK_SHADOW_MIX` (0.4) toward the shadow tone of the terrain on the realm's side of the edge (that hex's palette colour × `BORDER_INK_TERRAIN_SHADE`), at `BORDER_INK_OPACITY` (0.45) and full width `BORDER_INK_WIDTH` (1.0 world unit; today 1.5). One merged geometry with vertex colours, one draw call. A realm with no holder uses `BORDER_INK_UNHELD` (the palette's neutral ink). The holder per realm comes from a seam selector, `map/realmInk.ts` (world-keyed, over `ensureRealmProjection`).
- **Red and gold stay out of border ink.** `BORDER_INK_REMAP` maps any heraldic colour whose hue is within `BORDER_INK_MIN_HUE_DISTANCE_DEG` (30°) of the doom red (`--forecast-doomed-rgb`) or the Dominion gold (`#d4a040`) to a distinct colour, unless its saturation is below `BORDER_INK_NEUTRAL_SAT` (0.25). Today that is index 0 (`#e53e3e`) and index 5 (`#dd6b20`). A test computes every possible resolved ink and fails, naming the colour, if one is too close.
- **Capitals** take the holder's ink: `capitalColor` and `capitalRingColor` (and `LocationIconMesh`'s ring) read the realm ink.
- **Uncharted land.** A new palette token, `fogUnexploredFill: { texture: string | null; tint: string }`. GOLDEN_HOUR sets the existing parchment texture and its fallback tint; DARK_PARCHMENT (the THR-1835 dark map) sets its own value. The build first finds why the player sees `#0a0a0c` where `FogOverlayMesh` is built to draw parchment (THR-1831's measurement), then makes the token's fill what an unexplored in-grid hex shows. Off-grid space stays `sceneBackground` (Law 32), with a soft vignette, `UNCHARTED_VIGNETTE_HEXES` (1.5) wide, where parchment meets it.

### D13 — Carved places on the map, and one icon texture path

- **One map icon texture builder.** `buildMapIconTexture(shape: IconShape, opts: { size; fill; outline; outlineWidthFraction })` (in `locationIconTextures.ts`) rasterises any `{ viewBox, paths }` from `iconShape()` (THR-1885): stroke every path with the outline ink, then fill, scaled from the shape's own `viewBox` (carved shapes are `0 0 512 512`; the old drawings were 100). Place icons, Trouble and Trade badges and the battle and siege sprites all use it. No other code rasterises an icon for the map.
- **Places.** `LOCATION_ICON_REGISTRY` keeps one entry per `LocationType` with its `sizeClass` (and the importance map stays); `paths` and `viewBox` are removed. The shape is `iconShape(PLACE_ICON[type])`, where `PLACE_ICON` is THR-1879's total place-type → icon table (coordination comment on THR-1879, 2026-10-14). The near-black ink stays (`#1a1a1a` fill, `#0a0a0a` outline, `LOCATION_OUTLINE_WIDTH_FRACTION` 0.025 of the viewBox, which is today's 2.5 on 100). The size classes stay (`LOCATION_SIZE_SCALE`: full 0.80, medium 0.60, small 0.40, tiny 0.25), so a capital still draws larger than a town; lair tier still sets a lair's class.
- **Lair tints** carry over unchanged: `LAIR_SPHERE_FILL_COLORS` replaces the fill by sphere; a cleared lair keeps `CLEARED_LAIR_FILL_COLOR`.
- **Resolution.** `LOCATION_TEXTURE_SIZE` goes from 128 to 256: the carved silhouettes (village, medieval gate) carry detail that 128 px blurs when a full-class icon is drawn at about 160 px (k = 20). Textures are built once per type and tint, as today.
- **Unknown type, plain fallback** (Law 58): a place type with no registry entry draws the `fallback` shape at `small` and warns once, instead of being skipped.
- **Named test** `src/components/HexMapV2/locations/__tests__/placeIcons.coverage.test.ts`: every `LocationType` has a size class and resolves through `PLACE_ICON` and `iconShape()` to a shape that is not `fallback`; the eleven types Christian named resolve to exactly his shapes (`capital → tower-flag` … `lair → cave-entrance`); the texture builder accepts a 512-grid shape and a 100-grid shape and produces the same pixel bounds for the same size.

### D14 — Markers and labels

- **Marker bands** from `MAP_MARKERS` (D5). `updateZoomVisibility` picks the band from `ZOOM_TIER_THRESHOLDS` and the draw kind and size from the list. The dead retinue-dot branch (`AgentSpriteMesh.ts:377`) is removed; threaded medallions replace it.
- **Agents are label obstacles.** On every label pass the on-screen boxes of threaded medallions, the avatar and (at hero-local) portraits join `removeOverlaps`' `prePlaced` list. A place label that overlaps one moves to the free slot `LABEL_ALT_SLOT_OFFSET_PX` below its anchor; if that is taken too, the smaller place's label hides first; a threaded medallion never moves. Markers are click targets; labels are not.
- **Place names**, screen px, stepped by band, in `var(--font-body)` (Alegreya Sans) with a dark halo (`LABEL_HALO`: `paint-order: stroke` with a `--bg-abyss` stroke):

  | Size | Regional (5–10) | Regional (10–15) | Hero-local (≥ 15) | Weight |
  |---|---|---|---|---|
  | Capital | 16 | 19 | 22 | 800 |
  | City | 14 | 16 | 19 | 700 |
  | Town | 13 | 14 | 16 | 500 |
  | Small | hidden | 12 | 14 | 400 |

  Alegreya Sans 800 ships with THR-1879's font slice. Until then the browser falls back to the nearest cut (700), so the capital label renders and nothing breaks.
- **Realm names:** no uppercase, no 0.08em. Title case at `0.02em`; Cinzel 600 while the rendered size is ≥ `CINZEL_MIN_PX` (22), else Alegreya Sans 700. They keep scaling up to `MAX_SCALED_FONT_SIZE` (60) when zoomed out. Collision priority stays realm > area > river > places.

## Engine pillar

### Systems design

All engine work is read-only selectors behind the THR-1822 seam (`readView`, world- or structure-keyed, typed fallbacks, `view_fallback` trace), plus one additive VM field:

- **E1 — `src/engine/views/lenses/lensView.ts`**: `LENS_SELECTORS: Record<MapLensId, LensSelector>` and `selectLensView(ctx, lensId): MapLensView`. Dominion arm = THR-1822 E5 (unchanged calls).
- **E2 — `threadsLens.ts`, `troubleLens.ts`, `tradeLens.ts`**: D4, each returning `HexLensVM`; built on `hexContents` (THR-1822 D6) and `knowledgeFilterFor(ctx, 'lensMarks')` (built here if THR-1876's slice has not landed `knowledge.ts`; the lens needs only its hex rule).
- **E3 — the Dominion pressure clause**: `dominionHexLineVM` gains `pressure: string | null` (D4). Additive; existing callers ignore it.
- **E4 — `src/engine/views/map/minimap.ts`** (D10) and **`map/realmInk.ts`** (D12): world-keyed selectors.
- **E5 — `fitKnownLand(tiles, visibilityMap, canvas)`**: a pure function beside `computeFitZoom` in `D3ZoomCamera.ts` (camera math, not a view model).

### Graph nodes / edges

None added. Reads only: `thread` (ascendant → mortal, `courtPosition`), `located_at`, `trades_with` (cargo, `threatened`), realm `controls` through `ensureRealmProjection`. Rivals are not graph nodes; their ids come from `buildRivalInfluenceMarkers`.

### Tick phases

None. Selectors run on read, never inside `runTick`.

### Resolution logic

Only presentation rules: lit-set membership (D4), the pressure clause's pick (D4), the border-ink remap (D12), the opening clamp (D8). Each is a pure function with a Node test.

### PRNG callouts

None. Every selector is deterministic (same state + versions → deep-equal VM); ties break by name, then id. No `Math.random`.

## Content pillar

### Encounter templates

N/A — the lenses present existing state; no encounter is added or changed.

### Prose tables

N/A — no narrative prose. The hover lines are short system sentences with named slots (below), not prose tables.

### Attachment content

N/A — no attachment is added or changed.

### Data tables

- **C1 — `src/data/map-lenses.ts`**: three rows (D1).
- **C2 — `src/data/map-markers.ts`**: `MAP_MARKERS` (D5).
- **C3 — `src/data/map-commands.ts`**: `MAP_COMMANDS` (D9).
- **C4 — lens words** in `src/data/view-content.ts` (THR-1822 C1's one home for the seam's words; created by the first family that needs a word): legend heads and lines, hover templates, court phrases, empty lines, lair-tier words, unrest words. **Dominion words stay in `dominion-ui-content.ts`**, which gains `DOMINION_PRESSURE_LINE`.
- **C5 — tooltips** in `src/data/ui-content.ts` (words quoted in the Player-facing text table): `ui.lens.threads`, `ui.lens.trouble`, `ui.lens.trade`; legend entries `ui.lens.mark.first`, `.retinue`, `.watched`, `.destination`, `.unrest`, `.scheme`, `.drain`, `.omen`, `.lair`, `.road`, `.roadThreatened` (Battle and Siege reuse `ui.battle` and `ui.siege`); `ui.map.zoomIn`, `ui.map.zoomOut`, `ui.map.centreFirst`, `ui.map.knownLand`, `ui.map.minimap`. Each desc ≤ 200 characters (`tooltipValidation.test.ts`).
- **C6 — `MINIMAP_TERRAIN_FAMILY`, `MINIMAP_FAMILY_REPRESENTATIVE`** (D10), `BORDER_INK_REMAP` (D12).
- **Concepts for THR-1879's icon table** (it picks the shapes; the THR-1834 sheet already names several): lens icons (Dominion, Threads, Trouble, Trade); map commands (zoom in, zoom out, centre on my First, show known land, minimap); marks (unrest `mailed-fist`, battle `crossed-swords`, siege `catapult`, scheme `spider-web`, drain — no shape yet, omen `crystal-ball`, lair `cave-entrance`, trade `two-coins`); the 49 place types (`PLACE_ICON`).

## UI pillar

*Screenshot tool: both. **Claude-in-Chrome** captures the WebGL map (dim, marks, arrows, roads, borders, parchment, place icons, markers); its viewport cannot be set (THR-796), so every such capture states its measured `innerWidth`/`innerHeight`. **Playwright MCP** (`browser_resize` to 1920×1080 and to 2560×1440, re-asserted right before each capture) captures the DOM chrome (lens bar, legend, cluster, minimap — a 2D canvas, which Playwright does capture) and runs the geometry and `window.__DEBUG` assertions. Where a Playwright capture also shows the map paint, it is kept; it is never the only map evidence.*

### Player-facing display

- **The lens bar** (top-left of the canvas, as built): four toggle buttons, label plus key cap, underline when pressed, never gold. Legend card under it (`LENS_LEGEND_MAX_HEIGHT_PX` 180, `LENS_LEGEND_MAX_WIDTH_PX` 330). With a lens on: the map dims everything out of focus and draws the lens's marks; the hex tooltip gains the lens's lines.
- **The plain map** (no lens): your people's thread lines, battles and sieges, the band-drop badge, realm borders in their holders' ink, carved places, agents at steady sizes per band. No trade roads, no unrest pulse, no rival rings.
- **The control cluster** bottom-right; **the minimap** above it (open at 1440p, a fifth button at 1080p).
- **Opening:** the First in the middle with all known land in view.
- **Uncharted land** reads as parchment; the world's edge fades to dark.

### Player-facing text

Every surface below is new or changed. Quoted words are exact; rendered samples use the names of the THR-1766 / THR-1830 mock world (the Shepherd, Maren Ashfold, Hesk Crossing), filled in as the templates would fill them.

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Lens bar | "Dominion" `1` · "Threads" `2` · "Trouble" `3` · "Trade" `4` | PC-1, PC-8 | Tooltips: "Show your ground: what is yours, where it ends, and what stands against you. Key 1." (as built) · "Show where your people are and where each is going. Key 2." · "Show where something is going wrong: unrest, battles, sieges, rival schemes, lairs and omens. Key 3." · "Show the trade roads you know of, what they carry, and which are threatened. Key 4." Within one frame of the press the map dims and the button shows pressed; pressing again restores the plain map |
| Lens bar, suppressed | pressed button's tooltip adds "Hidden while a moment plays" / "Hidden while a card is armed" | PC-4, PC-8 | The lens did not switch itself off; it waits and returns |
| Threads legend | "Threads" · "Your people keep their light; the rest is dimmed." · "A dashed arrow shows where each is going." · mark row: "The First" · "Retinue" · "Watched" · "Heading" | PC-1 | Each word has a tooltip. `ui.lens.mark.first` "The First" — "The first mortal your thread bound, and the one it holds closest." · `ui.lens.mark.retinue` "Retinue" — "Mortals of your court. Your thread holds them, and their stories reach you." · `ui.lens.mark.watched` "Watched" — "Mortals you keep an eye on. Your thread touches them lightly." · `ui.lens.mark.destination` "Heading" — "Where this mortal is going. The dashed arrow ends at the place." The swatches are the thread colours on the map |
| Threads hover | "Maren Ashfold, your First, is here, on her way to Hesk Crossing." · "Maren Ashfold, your First, is on her way here from Millbrook." · "Oswin Hale, of your retinue, is here." · overflow: "and others of your people" · empty: "You have no threaded mortals yet." | PC-1, PC-3, PC-6 | Names and places are links; the same names the land page lists for that hex, because both read `hexContents`. Unknown gender reads "on the way", never a wrong pronoun |
| Trouble legend | "Trouble · Doom: Signs" · "Lit ground is where something is going wrong." · mark row: "Unrest" · "Battle" · "Siege" · "Scheme" · "Drain" · "Omen" · "Lair" | PC-1, PC-6 | The doom word is the stage name the doom bar shows. Tooltips: `ui.lens.mark.unrest` "Unrest" — "People here are coming to blows. Tense means it has started; volatile means it is spreading." · Battle and Siege reuse `ui.battle` and `ui.siege` as shipped by THR-1847 (Siege: "An army has ringed this town to take it. The siege ends when the town falls, the besiegers break, or both sides are spent.") · `ui.lens.mark.scheme` "Scheme" — "A rival power is working on this place to turn it away from you." · `ui.lens.mark.drain` "Drain" — "A rival power is bleeding one of your sources of essence here." · `ui.lens.mark.omen` "Omen" — "An omen hangs over the land inside the dotted ring. Mortals there act on it." · `ui.lens.mark.lair` "Lair" — "Something dangerous dens here, and it may grow." |
| Trouble hover | "Tense: people here are coming to blows." · "Volatile: the fighting here is spreading." · "A scheme of The Salt Spire: it is turning Ferris away from you." · "A drain of The Salt Spire: it is contesting your source at Ferris." · "Wolf Hollow: a great lair." · "An omen of Entropy hangs over this land." · overflow: "and more trouble here" · empty: "Nothing is going wrong that you can see." | PC-1, PC-2 | The rival is named (THR-1699's gap), and the name opens the rival. Battles and sieges keep the THR-1847 lines already on the tooltip ("Under siege") |
| Trade legend | "Trade" · "Lit ground lies on a trade road you know of." · "A gold road carries goods; a red road is threatened." · mark row: "Trade road" · "Threatened road" | PC-1 | Tooltips: `ui.lens.mark.road` "Trade road" — "Goods travel this road between two places. The badge marks its middle." · `ui.lens.mark.roadThreatened` "Threatened road" — "Something endangers this road: raiders, a blockade or a war nearby. Its goods may stop." |
| Trade hover | "A road to Hesk Crossing, carrying grain and salt." · "Threatened." · "Millbrook is prosperous; Hesk Crossing is struggling and short of iron." · overflow: "and more roads through here" · empty: "No trade road you know of yet." | PC-1, PC-6, PC-7 | Route words are the ones the plain tooltip shows today, moved, not rewritten; prosperity is a word, never a number |
| Dominion hover (added clause) | "Held ground, by Hesk Crossing" then "Pressed by a power of Entropy; your Life holds here." or "… your Life is giving way here." | PC-1 | The clause says why the band may move; sphere names carry their `sphere.*` tooltips |
| Control cluster | Tooltips: "Zoom in" — "Look closer. Key Page Up." · "Zoom out" — "See more of the land. Key Page Down." · "Centre on my First" — "Bring your First to the middle of the map. Key Home." · "Show known land" — "Fit all the land you know into view. Key F." · disabled: "Closest view" · "Widest view" · "No one to centre on yet" | PC-8, PC-1 | Every button answers within a frame: the camera moves, or the reason shows |
| Minimap | Button (1080p): "Show the minimap" / "Hide the minimap". Tooltip: "Minimap" — "The whole world in small: the land you know, the uncharted rest, your First, and the part you are looking at. Click to look there." | PC-1, PC-7 | The outlined rectangle is the view; clicking moves it |
| Map labels | Place and realm names (no new words); realm names in title case | PC-3 | Names no longer hide under portraits |
| Any lens, when its view cannot be built | Legend line: "This lens has nothing to show right now." | PC-8 | The lens answers the press with a line instead of an empty dim |

### Playtest signal

A tester asked "where is your First going?" answers from the Threads lens; a tester asked "what is going wrong near you?" names a rival or a kind of trouble from the Trouble lens; a tester zoomed out says the edge of the known world looks like an unfinished map, not a black void.

### Event notifications

None. Lenses and chrome present state; they emit no toast, alert or chronicle line.

### Debug inspection (DebugPanel and bridge)

All `async`, documented in `src/debug-bridge.d.ts`:

- `setMapLens(id: MapLensId | null)` → `{ active }` or `{ error }`; `getMapLens()` → `{ active, suppressed, lit: number, marks: Record<LensMarkKind, number>, markFallbacks: string[], legendHead, emptyLine }`. `setDominionLens` / `getDominionLens` stay as aliases.
- `getMapChrome()` → `{ k, tier, band, controls: { id, disabled, reason }[], minimap: { open, source: 'default' | 'player', viewRect }, opening: { k, centredOn: 'first' | 'seat' | 'land' | 'grid' }, fog: { unexplored: 'parchment' | 'tint' | 'color', textureLoaded }, placeIcons: { fallbacks: string[] } }`.
- `snapshotScene().layersActive` lists `lens:<id>` while a lens is drawn.
- `getView('lens', id)`, `getView('map.minimap')`, `getView('map.realmInk')` through THR-1822's `getView`.
- DebugPanel: the existing Dominion row generalises to "lens: <id or off>, n lit, n marks".

### Visual presence (HexMapV2)

New: `HexLensLayer` (dim, badges, rings, arrows, roads), name tags, `MapControls`, `Minimap`. Changed: `MapLensSwitch`, `AgentSpriteMesh` (bands), labels, `BorderMesh` (ink), fog (parchment), `LocationIconMesh` and `locationIconTextures.ts` (carved shapes), `BattleIndicatorLayer` sprites (carved). Removed from the plain map: `TradeRouteMesh` (moves into Trade), `HexPulseMesh` and `RivalInfluenceMesh` (deleted with their last caller). New render-order slots: `LENS_DIM` 8.95 (shared with the Dominion dim), `LENS_ARROWS` 9.55, `LENS_MARKS` 10.85.

### UI Laws engaged

**1** (image, tooltip, link on every concept: marks carry tooltips; names in hover lines route), **9** (one icon vocabulary per class: carved places, carved marks, carved battle sprites), **10** (gold = Dominion frontier and your own; caravan gold only inside Trade; red = trouble, threat and doom; border ink kept off both), **11** (named sizes; lone icons 34 px; badges above the floor), **12** (every lens has a legend derived from its marks), **13 / 14** (band, court, prosperity and lair words; no number, no key), **17** (`ui.lens.*`, `ui.map.*`), **21** (hover names route through `useRefRouter`), **22** (one `focusOn` for every "show on map"), **23** (map keys inert under overlays and in text fields; Escape untouched), **25** (disabled-with-reason at limits), **31** (polarity colours), **32** (off-grid stays dark; parchment is map art set by a palette token), **33** (bar, legend, cluster and minimap inside the canvas at 1920×1080 and 2560×1440), **35** (`hud` z-band), **46** (40 px buttons), **47** (reply within one frame), **53** (the minimap folds where the canvas is narrow), **56** (every mark reads written state; empty lenses say so in words), **57** (the legend grows to its 180 px limit and never scrolls or truncates: the longest legend, Trouble, fits; the bar never scrolls sideways), **58** (lenses, markers, commands and place types are each one list with a named coverage test and a plain fallback). Law 37: N/A, no multi-beat flow.

## Law 58 — the lists and their `extending.md` rows

Each slice that lands a list adds or edits its row in `Docs/design-system/extending.md` in the same PR (the page's own rule: keep it true, so no row is written before its list exists).

| List | One place | What catches a missing entry | Where to see it | Owed by |
|---|---|---|---|---|
| A map lens | One `MapLensDef` in `MAP_LENSES` (`src/data/map-lenses.ts`) + its selector in `LENS_SELECTORS` + its marks in `MAP_MARKERS`; a hex lens writes no layer | `MapLensId` and `LENS_SELECTORS` are closed/total (compile); `mapLenses.coverage.test.ts` (keys, tooltip, every emitted mark has a row) | The lens bar; `__DEBUG.setMapLens` | THR-1878 (edits the existing row: four lenses, the selector and marker steps) |
| A map marker kind | One entry in `MAP_MARKERS` (`src/data/map-markers.ts`): lens, draw kind, size per zoom band, icon concept, ink, legend word, tooltip | `Record<MapMarkerKind, …>` (compile); `mapMarkers.coverage.test.ts`; an unknown kind draws the `fallback` badge | The map; the lens legends | whichever of THR-1878 and THR-1899 (markers) lands the file first; the other extends the row |
| A map command (key or control button) | One row in `MAP_COMMANDS` (`src/data/map-commands.ts`) | `mapKeys.coverage.test.ts` (keys disjoint from `TOP_BAR_KEYS` and lens keys; tooltip registered) | The control cluster; the keys | THR-1900 (camera and controls) |
| A place type's map icon | One entry in `LOCATION_ICON_REGISTRY` (size class) + its shape in THR-1879's `PLACE_ICON` | `Record<LocationType, …>` in both (compile); `placeIcons.coverage.test.ts`; an unknown type draws `fallback` | The map at regional zoom | THR-1903 (carved places; cross-references THR-1879's icon row) |
| A terrain type on the minimap | One entry in `MINIMAP_TERRAIN_FAMILY` | `Record<TerrainType, …>` (compile) | The minimap | THR-1901 (minimap) |

## Build slices

Seven tickets (filed 2026-10-14), all in project *UI Visual Overhaul — Design System v1*. THR-1878 itself is the first lens slice (the precedent of THR-1821 and THR-1822: the plan's ticket ships its first slice).

| Slice | Ticket | What it builds | Blocked by |
|---|---|---|---|
| **Lenses I — the system, Threads and the pressure line** | [THR-1878](https://linear.app/threadbare/issue/THR-1878) | D1, D2, D3, D4 (Dominion clause, Threads), D5 (lens rows; creates `map-markers.ts` if absent), D11; `MapLensSwitch` on `Tabs`, `LensLegend` on `Panel`, lens hover lines in `HexTooltip`, name tags, debug lens levers, `ui_map_lens_changed` trace, the `knowledge.ts` hex rule if absent | THR-1881 (GameMap host), THR-1885 (Tabs, Icon), THR-1884 (Panel); transitively THR-1822 |
| **Lenses II — Trouble and Trade** | [THR-1898](https://linear.app/threadbare/issue/THR-1898) | D4 (Trouble, Trade); the plain map sheds trade roads, unrest pulses and rival rings (meshes moved or deleted); route words move into Trade's hover; battle and siege sprites carved through D13's builder | Lenses I; THR-1879's registry slice (the mark shapes) |
| **Map markers and labels** | [THR-1899](https://linear.app/threadbare/issue/THR-1899) | D5 (plain rows), D14: marker bands, agent label obstacles, dead branch removed, label sizes and weights, realm title case | THR-1822 (agent data from `views/map/agents.ts`) |
| **Camera and controls** | [THR-1900](https://linear.app/threadbare/issue/THR-1900) | D6, D7, D8, D9: the cluster, `MAP_COMMANDS`, `useMapHotkeys`, `TOP_BAR_KEYS`, `FOCUS_ZOOM`, `focusOn`, `zoomBy`, the opening view and frame fix, dead `AvatarHUD` wiring, `ui_map_camera_jump` trace | THR-1881, THR-1885, THR-1879's registry slice (control shapes) |
| **Minimap** | [THR-1901](https://linear.app/threadbare/issue/THR-1901) | D10 | Camera and controls |
| **Border ink and uncharted parchment** | [THR-1902](https://linear.app/threadbare/issue/THR-1902) | D12 | THR-1822 (`map/realmInk.ts` on the seam) |
| **Carved places on the map** | [THR-1903](https://linear.app/threadbare/issue/THR-1903) | D13 (the builder, place icons, the unknown-type fallback) | THR-1885 (`iconShape`), THR-1879's registry slice (the place shapes and `PLACE_ICON`) |

**Order.** Markers-and-labels and border-ink can start as soon as THR-1822 merges; everything with chrome waits for THR-1881's `GameMap`. Lenses II needs Lenses I's layer. If Lenses II lands before carved places, it introduces `buildMapIconTexture` and the carved-places slice moves the place icons onto it; whichever lands first creates the builder.

## Interface impact

| Contract | Change | Where |
|---|---|---|
| `dominion-band-projected-to-hex-map` (THR-1750) | **extend**: new consumer field, the pressure clause read from the lending place's sphere scores | `dominionViewModels.ts` → `HexTooltip` |
| Thread destination → the map (Movement & Colocation, audit-on-touch) | **add** `thread-destination-on-threads-lens`: producer `phaseMovement` / `phaseAgentDecision` (`movementState.destinationId`) → consumer `views/lenses/threadsLens.ts` | Lenses I |
| Local omens → the map (Omens & Atmospheric Pressure, audit-on-touch) | **add** `local-omen-on-trouble-lens`: producers `encounterAftermath.ts:3263`, `phaseOmenAgenda.ts:754-774` → consumer `troubleLens.ts` (its first player-facing read) | Lenses II |
| Rival marks → the map (Rival Gods & Schemes) | **preserve** producer `buildRivalInfluenceMarkers`; consumer moves from `RivalInfluenceMesh` to `troubleLens.ts` | Lenses II |
| Trade routes and prosperity → the map and tooltip (Mortal Economy & Prosperity) | **preserve** route producers; consumers move into `tradeLens.ts`; **add** `prosperity-on-trade-lens` (`phaseProsperity` → `tradeLens.ts`) | Lenses II |
| Realm holder → the map (Strategic Projects & Control: realm `controls` through `ensureRealmProjection`) | **add** `realm-holder-inks-border`: `ensureRealmProjection` → `map/realmInk.ts` → `BorderMesh` | Border ink |
| Visibility → the camera and minimap (Intelligence, Knowledge & Familiarity: `visibilityMap`) | **add** `explored-hexes-frame-opening-view`: `visibilityMap` → `fitKnownLand`, `map/minimap.ts` | Camera, Minimap |

Each **add** row is registered in `scripts/interface-contracts.ts` and `Docs/canon/interface-map.md` by the slice that ships its consumer, never before.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `views/lenses/lensView.ts` + `threadsLens` / `troubleLens` / `tradeLens` | none (read on render) | `GameMap` → `HexMapV2` prop `lens`, `HexTooltip`, `LensLegend` | `graph`, `emittedOmens`, `doomClock`, `visibilityMap` (read) | `view_fallback` | `getView('lens', id)`, `getMapLens()` |
| `dominionHexLineVM` (+ `pressure`) | none | `HexTooltip` | `graph` (read) | none | `getView('lens','dominion')` |
| `HexLensLayer` | none | `HexMapV2` scene | — | none | `snapshotScene().layersActive` |
| `LensNameTags` | none | `HexMapV2` label overlay (Threads on) | — | none | `getMapLens().marks.medallion` |
| `MapLensSwitch` + `LensLegend` + `toggleLens` | none | `GameMap` | `GameScreenState.activeLens`, `lensSuppressed` (UI state) | `ui_map_lens_changed` | `getMapLens()` |
| `MAP_MARKERS` + `AgentSpriteMesh` bands | none | `HexMapV2` | — | none | `getMapChrome().band` |
| `MapControls` + `MAP_COMMANDS` + `useMapHotkeys` | none | `GameMap` | — | `ui_map_camera_jump` | `getMapChrome().controls` |
| camera (`focusOn`, `zoomBy`, `fitKnownLand`, opening) | none | `HexMapV2` handle | `visibilityMap` (read) | `ui_map_camera_jump` | `getMapChrome().opening` |
| `views/map/minimap.ts` + `Minimap` | none | `GameMap` | `tiles`, `visibilityMap` (read) | `view_fallback` | `getView('map.minimap')`, `getMapChrome().minimap` |
| `views/map/realmInk.ts` + `BorderMesh` | none | `HexMapV2` | via `ensureRealmProjection` | `view_fallback` | `getView('map.realmInk')` |
| `fogUnexploredFill` + fog | none | `HexMapV2` | — | none | `getMapChrome().fog` |
| `buildMapIconTexture` + places + badges | none | `LocationIconMesh`, `HexLensLayer`, `BattleIndicatorLayer` | — | none | `getMapChrome().placeIcons` |

Prose pipeline: no `enrichProse()` call. Player controls: the lens bar, four buttons and the minimap toggle, the keys in D9.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `LENS_DIM_ALPHA` | `= DOMINION_DIM_FOREIGN` (0.45) | The one "not in focus" dim (THR-1830 § 1) |
| `RENDER_ORDER.LENS_DIM` / `LENS_ARROWS` / `LENS_MARKS` | 8.95 / 9.55 / 10.85 | Lens draw order, all below fog (13) |
| `LENS_LEGEND_MAX_HEIGHT_PX` | `= DOMINION_LEGEND_MAX_HEIGHT_PX` (180) | Legend card limit (THR-1830 § 3, Law 57) |
| `LENS_LEGEND_MAX_WIDTH_PX` | 330 | Legend card width (mock) |
| `LENS_HOVER_MAX_LINES` | 4 | Lines per hex in the hover tier; more read "and others of your people" / "and more trouble here" / "and more roads through here" |
| `LENS_BADGES_PER_HEX` | 2 | Badges drawn per hex along its lower edge (two 34 px badges fit a 100 px hex at k = 5); the hover lists every kind |
| `LENS_BADGE_PX` | 34 | Badge icon size at regional and hero-local (THR-1834: a lone icon is 34 px) |
| `THREADS_LENS_MEDALLION_SCALE` | 1.25 | "Medallions grow one step" (THR-1830 § 6) |
| `THREADS_NAME_TAG_PX` | 14 | Name tag size under a threaded medallion |
| `TROUBLE_OMEN_DEFAULT_RADIUS` | 1 | Reach of a local omen whose scope has no radius |
| `DOMINION_PRESSURE_LINE_MIN` | 0.2 (weighted opposing score, normalised by `MAX_SPHERE_SCORE`) | Below this the hover adds no pressure clause |
| `MAP_CHROME_INSET_PX` | 16 | Bar, legend, cluster and minimap inset from the canvas edges |
| `ZOOM_STEP_FACTOR` | 2 | Zoom buttons and keys |
| `CAMERA_CONSTANTS.FOCUS_ZOOM` | 10 | Every "show me" jump (THR-1831 § 1) |
| `OPENING_ZOOM_MIN` / `OPENING_ZOOM_MAX` | 6 / 10 | Opening clamp (THR-1831 § 3) |
| `PAN_STEP_FRACTION` / `PAN_DURATION_MS` | 1/3 / 200 | Arrow-key pan |
| `MINIMAP_W_PX` × `MINIMAP_H_PX` | 240 × 180 | Minimap size (THR-1831 § 2) |
| `MINIMAP_AUTO_OPEN_MIN_CANVAS_PX` | 1400 | Open by default at this canvas width and wider |
| `MINIMAP_FIRST_PIP_PX` | 6 | The First's gold pip |
| `MAP_MARKERS[*].sizePx` | THR-1831 § 4 table | Marker size per zoom band |
| `LABEL_ALT_SLOT_OFFSET_PX` | 14 | The free slot a label moves to below its anchor |
| `LOCATION_LABEL_SIZES` / `LOCATION_LABEL_WEIGHTS` | D14 table; 800 / 700 / 500 / 400 | Place labels by band (THR-1831 § 6, THR-1833 § 5) |
| `CINZEL_MIN_PX` | 22 | Realm names switch faces below it (THR-1833) |
| `LABEL_HALO` | `paint-order: stroke`, 3 px `--bg-abyss` stroke | The dark halo behind map labels and name tags (THR-1833 § 5) |
| `BORDER_INK_SHADOW_MIX` / `BORDER_INK_TERRAIN_SHADE` | 0.4 / 0.5 | Holder colour → ink (THR-1831 § 5) |
| `BORDER_INK_OPACITY` / `BORDER_INK_WIDTH` | 0.45 / 1.0 | Border look (THR-1831 § 5) |
| `BORDER_INK_MIN_HUE_DISTANCE_DEG` / `BORDER_INK_NEUTRAL_SAT` | 30 / 0.25 | Keep red and gold out of border ink |
| `BORDER_INK_UNHELD` | a palette token (GOLDEN_HOUR: the existing neutral `geoBorder` ink lifted to 0.45 opacity) | Border ink for a realm with no holder |
| `UNCHARTED_VIGNETTE_HEXES` | 1.5 | Fade width where parchment meets off-grid dark |
| `LOCATION_TEXTURE_SIZE` | 256 (was 128) | Carved place texture resolution |
| `LOCATION_OUTLINE_WIDTH_FRACTION` | 0.025 | Outline pass width as a share of the shape's viewBox |

## Tracing

Two UI trace categories, registered with the THR-928 trio (`src/types/traces/ui-traces.ts`, `UI_TRACE_CATEGORIES`, `TraceCategory` + `TRACE_CATEGORIES` in `src/types/trace.ts`), emitted through `emitTrace` as `useRefRouter` does. Zoom and pan by wheel or drag are not traced (noise); only commands and programmatic jumps are.

```ts
// UiMapLensChangedTrace — a lens turned on, off, or switched
interface UiMapLensChangedTrace {
  category: 'ui_map_lens_changed';
  tick: number;
  from: MapLensId | null;
  to: MapLensId | null;
  source: 'key' | 'bar' | 'debug' | 'unknown_id';
  summary: string;                 // "ui_map_lens_changed: null → trouble (key)"
}

// UiMapCameraJumpTrace — a programmatic camera move
interface UiMapCameraJumpTrace {
  category: 'ui_map_camera_jump';
  tick: number;
  reason: 'opening' | 'centre_first' | 'centre_seat' | 'known_land' | 'zoom_step' | 'minimap' | 'focus';
  k: number;                       // the zoom it lands at (debug only; never shown to the player)
  target: string | null;           // "col,row" or null for a zoom step
  summary: string;
}
```

Lens VM failures use THR-1822's `view_fallback`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A lens selector throws | `readView` returns the typed fallback (`lit: []`, no marks, `emptyLine` "This lens has nothing to show right now."), traces `view_fallback` once; the map shows the plain table and the legend shows the line |
| A lens id with no row | No lens drawn, no button pressed, warn once, trace `unknown_id` (D1) |
| A mark kind with no `MAP_MARKERS` row | The neutral `fallback` badge in the lens ink; warn once; the kind is listed in `getMapLens().markFallbacks` |
| An icon concept with no shape yet | `Icon` / `iconShape` return the designed `fallback` shape (THR-1885); the coverage test names the missing concept |
| No ascendant (`?firstunmet`) | Dominion behaves as built (switch hidden); Threads shows its empty line; Centre on my First is disabled with "No one to centre on yet" unless a seat exists |
| No avatar | Threads lights hexes and draws arrows; no thread lines (as today) |
| A destination that resolves to no hex | No arrow, no destination hex lit; the mortal's own hex still lit |
| A local omen past `expiresTick` | Not emitted |
| A trade route end with no hex | The route is skipped (as `hexOf` does today) |
| No visibility map (fog off) | The seen floor fails open; the opening view fits the grid; the minimap treats every hex as known |
| The parchment texture fails to load | `fogUnexploredFill.tint` (today's `#3d3025` fallback), never `#0a0a0c` |
| `localStorage` throws or is empty | The minimap uses the canvas-width default |
| An unknown place type | The `fallback` shape at `small`, warn once (D13) |
| WebGL context lost with a lens on | Lens layers rebuild with the scene; `activeLens` survives in `GameScreenState` |
| The minimap VM is not ready | The panel renders its frame with the uncharted tone; the view rectangle still draws |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 119 importers | Two `TraceCategory` members and two `TRACE_CATEGORIES` entries; no exhaustive `Record<TraceCategory, …>` exists, and the trace-vocabulary test is satisfied by the registration |
| `src/engine/sublocationShape.ts` | 105 importers | **Read only** (`resolveToParentLocation`, `getLocationNodes`) |

`HexMapV2.tsx` (2,099 lines, 5 importers) and `GameView.tsx` (6,882 lines, 1 importer) are large but not high fan-in; their risk is merge conflicts, handled in the coordination block. After THR-1881 this plan edits `GameMap.tsx`, not `GameView.tsx`.

## Three-pillar check

- [x] Engine pillar present — three lens VMs, the minimap and realm-ink selectors, the pressure clause, `fitKnownLand`; all read-only on the seam
- [x] Content pillar present — lens, marker and command lists; legend, hover, control and minimap words; tooltips; the concepts THR-1879 maps. Encounter, prose and attachment content N/A with reasons
- [x] UI pillar present — lens bar and legend, four lenses, cluster, keys, minimap, opening view, markers, labels, border ink, parchment, carved places; Laws engaged; text quoted
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. *All mechanics surface through prose, never numbers* (`TheFantasyWorldSimulator/Vision/02-non-negotiables.md` § 3) holds: every lens mark is a shape with a word, every hover line is a sentence, prosperity is a word, and the only number in a lens VM is a road's geometry weight, which is never rendered as text. *At any given time, there is one story front-of-stage* (`TheFantasyWorldSimulator/Vision/01-core-loop.md`) is served: the plain map stops drawing every overlay at once (THR-1808's recurring complaint), a lens is a question the player asks, one at a time, and a lens steps aside while a moment plays (`lensSuppressed`). *Mechanical legibility vs. narrative mystery* (`TheFantasyWorldSimulator/Vision/03-design-tensions.md` § 4): the lenses add legibility about where things are, not about odds or outcomes; fog covers every lens mark and the seen floor keeps unseen roads, omens and schemes off the map.
- [x] No Vision edit is needed.
- **The pull toward 4X map chrome** (`00-north-star.md`: "Malazan, not a 4X") is held by construction: no lens by default and one at a time, the minimap folds where the canvas is narrow, and the controls are four buttons.
- **Taste-profile soft patterns this plan sits against, each from a settled decision:** map place names off Cinzel and at 12–14 px (THR-1833 § 5 and THR-1831 § 6: map labels are art scaled by zoom band, outside the UI type scale per THR-1819); the 500 ms camera move (the existing `JUMP_TO_DURATION_MS`: camera travel, not UI motion); gold on the map (frontier gold, the First's thread and pip; caravan gold only inside Trade, never beside the frontier). Any taste-profile note on typography belongs to THR-1879, which rewrites `typography.md` from THR-1833.

## Rulebook impact

- [x] This plan does not change a rule of play. It changes what the map shows and how the camera moves, not what the state is or how it changes.
- [x] No `Docs/canon/rulebook.md` edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1878-map-lenses-and-chrome-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every size, alpha, offset, clamp, threshold and inset is a named constant; lenses, markers, commands, place types and terrain families are data lists |
| 2. Inspectability | PASS | `getMapLens`, `getMapChrome`, `getView` for every new VM; two traces for commands and jumps; `view_fallback` for VM failures |
| 3. Determinism | PASS | Pure selectors, no randomness, ties by name then id; the opening view is a pure function of visibility and canvas size |
| 4. Fail-soft | PASS | Typed fallbacks at every list (lens, mark, icon, place type); parchment falls back to a tint, never the void; see the table |
| 5. Narrative over mechanical perfection | PASS | Hover lines name people, rivals and places in sentences; the doom stage is a word |
| 6. Additive over destructive | PASS with note | Lists and fields are added; Dominion is reused unchanged. Two meshes (`HexPulseMesh`, `RivalInfluenceMesh`) and the hand-drawn place paths are deleted once nothing reads them, as decided (THR-1830 § 4, THR-1834 call 2b); dead code is a defect class here (THR-1846) |
| 7. Performance budget | PASS with note | One instanced dim, a few dozen badges, merged arrow and road geometry; lens VMs rebuild at most once per tick and only for the lens that is on. Border ink stays one draw call. Carved textures at 256 px: 49 types plus 9 lair tints ≈ 15 MB of GPU memory, built once. Label collision gains marker obstacles: the markers slice measures one label pass on medium at 2560×1440 and stops (kill criterion 3) if it exceeds 2 ms |

## Done when

**Every slice:** `npm test`, `npm run check:typecheck` (the ratchet), `npx vite build` green; `npm run check:ui-debt` does not go up; the slice's `extending.md` row added or edited; four-part browser evidence on `?view=game&seeded&size=medium`: Claude-in-Chrome capture(s) of the map with measured `innerWidth`/`innerHeight` stated, Playwright captures at **1920×1080 and 2560×1440** of the chrome the slice touches (re-asserting the resize right before each), console output (errors and warnings, or "(no errors or warnings)"), the slice's `window.__DEBUG.*` assertion below, and a UI-Laws line naming at least Laws 1, 13/14, 17, 21, 33, 37, **57 and 58**. Closing commit body carries `Fixes THR-XXX` on its own line for that slice's ticket.

**Lenses I (THR-1878):**
- [ ] `MapLensId` is `'dominion' | 'threads'` (Trouble and Trade join in Lenses II); `MAP_LENSES` carries `layer`; GameView/GameMap no longer branch on the literal `'dominion'`; `LENS_SELECTORS` and `LENS_LAYER_FACTORIES` are total records
- [ ] `mapLenses.coverage.test.ts` passes, and deleting the Threads selector or its `MAP_MARKERS` rows fails the build or the test with a message naming the list
- [ ] With Threads on (`await __DEBUG.setMapLens('threads')`): `getMapLens()` reports `lit ≥ 1` and a `medallion` mark per threaded mortal at court the_first/retinue/watched; a mortal with a destination has a `destination` mark; `snapshotScene().layersActive` contains `lens:threads` and not `lens:dominion`
- [ ] `setMapLens('dominion')` then `'threads'` then `null`: exactly one lens layer at each step; the Dominion arm deep-equals `dominionLensVM`'s output (Node test)
- [ ] The Dominion hover line shows the pressure clause on a fixture where the lending place's opposing score clears `DOMINION_PRESSURE_LINE_MIN`, and none below it (Node test on `dominionHexLineVM`)
- [ ] With each lens on, a click on a lit hex and on a dimmed hex calls `onHexClick` exactly as with no lens (test, D11)
- [ ] Node tests per lens VM (THR-1822 D17 contract: serialisable, deterministic, no raw ids or numbers in display strings, typed fallback) and: Threads lights each threaded mortal's hex and arrows to a set destination; no mark or hover line on an `unexplored` hex
- [ ] Browser: Threads on and Dominion on, Claude-in-Chrome; the bar and legend at 1920×1080 and 2560×1440, Playwright; `lensSuppressed = true` hides the layer and keeps the button pressed (`getMapLens().suppressed`)

**Lenses II — Trouble and Trade (THR-1898):**
- [ ] `MapLensId` gains `'trouble' | 'trade'`; the coverage test passes for all four
- [ ] With no lens on, `snapshotScene()` shows no trade road, no hex pulse and no rival ring; with Trade on, roads draw; with Trouble on, unrest, scheme, drain, lair and omen badges draw where state exists
- [ ] Node tests on fixtures: Trouble draws a siege hex lit with no battle badge and keeps it a siege; a local omen lights its reach and draws a ring; Trade's `emptyLine` with no known road; a threatened route's mark has tone `threat`; the hover names the rival
- [ ] `HexPulseMesh.ts` and `RivalInfluenceMesh.ts` are deleted if no caller remains (grep in the PR); route lines leave the plain hex tooltip and appear in Trade's hover with the same words
- [ ] `hexLine` lives in `src/lib/hexMath.ts`, world-gen's pass09 calls it, and a test pins pass09's interior-hex output unchanged on two coordinate pairs
- [ ] The derived Threads, Trouble and Trade legends equal the Player-facing text table word for word (test)
- [ ] `BattleIndicatorLayer` draws the carved battle and siege shapes; the Trouble legend shows the same shapes

**Map markers and labels (THR-1899):**
- [ ] `MAP_MARKERS` plain rows; `mapMarkers.coverage.test.ts`; sprite sizes are screen-fixed per band (a test reads the computed world scale × k at each band and gets the table's px); the retinue-dot branch is gone
- [ ] Label collision takes marker obstacles: on a fixture, a place label overlapping a threaded medallion moves below its anchor, or hides if that slot is taken; the medallion's position is unchanged
- [ ] Place labels use the D14 sizes, weights and face with a halo; realm names are title case at 0.02em, Cinzel at ≥ 22 px, Alegreya Sans 700 below
- [ ] One label pass with obstacles on medium at 2560×1440 measures ≤ 2 ms, and the per-zoom-event sprite resize for every agent on medium measures ≤ 1 ms (both numbers in the PR)

**Camera and controls (THR-1900):**
- [ ] `MAP_COMMANDS`, `useMapHotkeys`, `TOP_BAR_KEYS`; `mapKeys.coverage.test.ts`; the four buttons with tooltips and aria-labels; disabled-with-reason at both limits
- [ ] The run opens with `getMapChrome().opening.centredOn === 'first'` and `k` within [6, 10]; the first rendered label tier equals the applied tier (test)
- [ ] The seat button, eye icons and Centre on my First all land at `FOCUS_ZOOM` (`ui_map_camera_jump` traces with `k = 10`); `RETINUE_EYE_ZOOM_SCALE` is gone
- [ ] Keys are inert in a text field and under an open dialog (test)

**Minimap (THR-1901):**
- [ ] Open by default at 2560×1440 and folded at 1920×1080 (`getMapChrome().minimap`), with the player's toggle kept across a reload
- [ ] Clicking the minimap centres the camera on that hex; dragging the rectangle pans; no lens tint on it with any lens on
- [ ] `MinimapVM` Node test: unknown hexes are `'u'`, known hexes carry their family; the First's hex is set

**Border ink and uncharted parchment (THR-1902):**
- [ ] Each realm border draws in its holder's ink in one draw call; the hue test passes for every heraldic colour; capitals take the ink
- [ ] Zoomed out at full-world, unexplored in-grid hexes show parchment (Claude-in-Chrome capture) and `getMapChrome().fog.unexplored === 'parchment'`; off-grid stays dark with the vignette
- [ ] The DARK_PARCHMENT palette sets its own `fogUnexploredFill`

**Carved places on the map (THR-1903):**
- [ ] `placeIcons.coverage.test.ts` passes; the eleven named types resolve to Christian's shapes; `LOCATION_ICON_REGISTRY` has no `paths` left
- [ ] Lair tints and the cleared-lair fill unchanged (test); an unknown type draws `fallback` (`getMapChrome().placeIcons.fallbacks`)
- [ ] A Claude-in-Chrome capture at regional zoom shows the carved places in the map's ink, compared beside THR-1834's `places-glance.png`

## Coordination block

**Suggested model:** opus — a multi-file HexMapV2 + seam build where the lens list, the generic layer and the coverage tests must be shaped so the next lens is one entry.

**Parallel-safe with:** THR-1819 and THR-1820 (tokens and `Modal` — no map file); THR-1886 and THR-1874 (action and effect lists — disjoint); THR-1880 (dialogs — disjoint). Within this plan, Map markers and labels and Border ink can run side by side with each other (different meshes; both touch `HexMapV2.tsx` only at their own wiring lines).

**Mutex with:**
- **THR-1881** — this slice builds into its `GameMap.tsx` and `GameScreenState`; it is also *blocked by* it.
- **THR-1876 (the Inspector build)** — both edit hex-click handling around `GameMap` and `HexTooltip`; THR-1876 routes the click, this slice must not touch the route.
- **THR-1875 (the frame build)** — both edit `useTopBarHotkeys.ts` (`TOP_BAR_KEYS`, lens keys).
- **THR-1877 (the Stage build)** — it sets `lensSuppressed`, which this slice adds.
- **The other slices of this plan** (THR-1898 to THR-1903) — all edit `src/components/HexMapV2/HexMapV2.tsx`; Lenses I and Map markers and labels both edit `AgentSpriteMesh.ts`; Border ink and Carved places both edit `LocationIconMesh.ts`. Check `In Dev` before claiming.

**Files to touch:** (Lenses I, this ticket; each slice ticket lists its own)
- Create: `src/engine/views/lenses/{lensView,threadsLens}.ts`, `src/engine/views/lenses/__tests__/*.test.ts`, `src/data/map-markers.ts` (if absent), `src/data/__tests__/mapLenses.coverage.test.ts`, `src/components/HexMapV2/scene/HexLensLayer.ts`, `src/components/HexMapV2/chrome/LensLegend.tsx`, `src/components/HexMapV2/overlay/LensNameTags.tsx`
- Edit: `src/data/map-lenses.ts`, `src/data/dominion-ui-content.ts` (`DOMINION_PRESSURE_LINE`), `src/engine/dominionViewModels.ts` (additive `pressure`), `src/data/view-content.ts` (create if absent), `src/data/ui-content.ts`, `src/components/HexMapV2/chrome/MapLensSwitch.tsx`, `src/components/HexMapV2/HexMapV2.tsx` (`lens` prop, layer dispatch), `src/components/HexMapV2/scene/{RenderLayers,ZoomVisibilityMatrix,AgentSpriteMesh}.ts`, `src/components/HexMapV2/interaction/HexTooltip.tsx`, `src/components/Game/map/GameMap.tsx`, the `GameScreenState` context (THR-1881), `src/types/traces/ui-traces.ts`, `src/types/trace.ts`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, `Docs/design-system/extending.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/hex-map.md` (render layers and lenses)

## Notes for the executor

- **Reuse Dominion, never fork it.** Do not edit `DominionLensLayer.ts`, `dominionLensVM`, `DominionDropBadge.ts` or the projection. The only Dominion edit in this whole plan is the additive `pressure` field.
- **A new hex lens writes no layer code.** If Trouble or Trade seems to need its own layer, add a `draw` kind to `LENS_MARK_RENDERERS` instead, so the next lens can use it.
- **Do not hand-keep a second list.** Legends derive from `MAP_MARKERS`; buttons and keys from `MAP_COMMANDS`; the minimap's tones from the active palette.
- **Keys:** `+`/`=`/`-` are speed and `W` is widen (THR-1828). The map zoom keys are `PageUp`/`PageDown`; there is no WASD. This is a resolution between two lane decisions, recorded with a veto invited.
- **Do not route the land page.** THR-1876 owns it. Keep `onHexClick` passing through unchanged and prove it with the D11 test.
- **Icons:** never vendor a shape; name the concept and read THR-1879's table through `iconShape()`. Never add an emoji or symbol glyph (the ratchet counts them).
- **Fog first:** for the parchment, measure why the player sees `#0a0a0c` before changing the shader. The overlay may be unmounted, covered, or its texture may not load.
- **Evidence:** Claude-in-Chrome's viewport cannot be set; state its real size. Playwright's resize reverts on navigation; re-assert before each capture and pass absolute filenames.
- **Words:** the surface nouns (map lens, the Inspector, the land page) are in the UL proposal THR-1882; use them as the decision records do.

**Kill criteria — stop and report rather than push through:**
1. A new hex lens cannot be added without editing the generic layer or the host → the list design is wrong; revise D1/D3 before building Lenses II.
2. Testers miss a threat to their own things after rival marks leave the plain map (a cold or warm playtest finding) → THR-1830's "would change the call": rival marks on the player's own places return to the plain map, drawn from the Trouble VM's scheme marks.
3. A label pass with marker obstacles costs more than 2 ms on medium at 2560×1440 → limit obstacles to threaded markers and report.
4. The carved place shapes fail the glance test at regional zoom in the map's ink (Christian's reason for the change) → stop and surface it in chat with the capture, before the drawings are deleted.

## Decisions this plan makes (veto invited)

Each is a "how" inside the settled decisions; none changes what the game means. Christian can veto any of them in chat.

- **Map keys** (D9): THR-1831 bound `+`/`−` and WASD; THR-1828, decided a day later, kept `+`/`-` for speed and gave `W` to widen. This plan moves zoom to `PageUp`/`PageDown` and drops WASD. Veto invited.
- **The hover line becomes structured** (D4): THR-1822 typed it as a string; Law 21 routing needs segments. Recorded as a refinement of D11 under THR-1822's kill criterion 4.
- **Battles and sieges get no Trouble badge** (D4). This departs from THR-1830 § 6's "each kind gets one red mark": the plain map already draws battles and sieges, so a badge would be a second mark for one fact on one hex (PC-5). The lens lights their hexes, their sprites become the carved shapes, and they appear in the Trouble legend in their own colours.
- **The avatar keeps its 82 px close-up** (D5): THR-1831's table names the threaded agents; the avatar is not one, so its hero-local size is not changed by this plan.
- **The minimap's default follows the canvas width** (D10): open at ≥ 1400 px, which reproduces THR-1831's 1440p-open / 1080p-folded split and its own "would change the call".
- **One flag for "two dims never stack"** (D2): `lensSuppressed`, set by the Stage and arming builds; the lens waits and returns.
- **The pressure clause's rule** (D4): the god's held sphere whose opposite weighs most at the lending place, with a floor, so the line names what Dominion's own formula counts against the god.
- **Carved place textures at 256 px** (D13), for the finer carved silhouettes at close zoom.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14. Verdicts condensed from the three auditors' reports; author responses follow each.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 30+ named constants; lenses, markers, commands, place types and terrain families are data lists; reused values exist in source (`DOMINION_DIM_FOREIGN` 0.45, `DOMINION_LEGEND_MAX_HEIGHT_PX` 180, `JUMP_TO_DURATION_MS` 500, `FIT_PADDING` 0.85); `LENS_DIM_ALPHA` aliased by import |
| 2. Inspectability | PASS-with-note | The wiring table answers the checklist; `getMapLens`, `getMapChrome`, `getView`, two traces, `view_fallback`; upstream health measured. Note: an unknown mark kind was only "warn once", with no debug count |
| 3. Determinism | PASS | Pure selectors, ties by name then id, no `Math.random`; the pressure clause has a tie rule |
| 4. Fail-soft | PASS | 15 fail-soft rows, each a typed fallback |
| 5. Narrative over mechanical | PASS | Sentences with linked names; prosperity and doom as words; road weight is geometry only |
| 6. Additive over destructive | PASS-with-note | Deletions (two meshes, the hand-drawn paths, `RETINUE_EYE_ZOOM_SCALE`, ZOOM-05, the dead branch, `AvatarHUD` wiring) are each justified by a settled decision; kill criterion 4 gates the drawings |
| 7. Performance budget | PASS-with-note | One instanced dim, merged geometry, one-draw-call borders, VMs once per tick for the lens that is on; the label pass has a 2 ms budget. Note: the per-zoom sprite resize was unmeasured |

NFP AUDIT: PASS-with-notes

*Author response:* an unknown mark kind is now listed in `getMapLens().markFallbacks` (fail-soft table and debug section). The markers slice (THR-1899) now measures the per-zoom-event sprite resize (≤ 1 ms on medium) beside the label pass.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | E1–E5 read-only selectors on the THR-1822 seam, one additive field, `fitKnownLand`; nodes/edges, phases and PRNG each "None" with a reason |
| Content | present-and-substantive | C1–C6 lists, words, tooltips and icon concepts; encounter, prose and attachment content N/A with reasons |
| UI | present-and-substantive | Display, the full text table with PC classes, a playtest predicate, notifications (none, with reason), debug, visual presence, Laws |

**Missing required sections:** none; Blast Radius present and scoped. **Wiring:** every new module has a phase, host, state read, trace or none, and a debug surface. **Substrate:** dispositions throughout; dormant data activated, not rebuilt; `hexLineDraw` hoisted. Notes: rows used module names rather than `systems-inventory.md` subsystem names, and the interface rows named subsystems the inventory does not have.

PILLAR AUDIT: PASS-with-notes

*Author response:* the substrate inventory now opens with the inventory subsystem names it touches, and the interface rows use the inventory's names (Movement & Colocation; Omens & Atmospheric Pressure; Mortal Economy & Prosperity; Strategic Projects & Control; Intelligence, Knowledge & Familiarity).

### Vision audit

**Premises touched:** `00-north-star.md` (mortals known by name; one complex story at a time) confirmed; `01-core-loop.md` (one story front-of-stage, no dashboard) confirmed, with `lensSuppressed` stepping aside for a moment; `02-non-negotiables.md` §1, §3, §4, §5 confirmed, §6 extended (deletions with reasons); `03-design-tensions.md` §4 extended (local omens, schemes, drains and sphere pressure become visible), §5 confirmed; `taste-profile.md` no emoji, title-case names, prose-first UI confirmed.

**Contradictions:** none.

**Notes:** the minimap, four lenses and a control cluster pull toward 4X chrome (north star: "Malazan, not a 4X"), with the counter-pull present (one lens at a time, none by default). Taste-profile soft patterns revised without a note: place names off Cinzel, map labels at 12–14 px under the 16 px minimum, a 500 ms zoom outside the 150/200/400 ms motion set; gold accents at map level and the parchment fill were not audited against the panel rules.

VISION AUDIT: PASS-with-notes [design-brief-stale]

*Author response:* the Vision audit section now names the 4X counter-pull and each taste-profile soft pattern with the settled decision it comes from (THR-1833 § 5 and THR-1831 § 6 for map labels, THR-1819's exemption of map labels from the UI scale, the existing `JUMP_TO_DURATION_MS` for camera travel, THR-1830's gold rule), and leaves the typography note to THR-1879, which rewrites `typography.md`. The parchment is map art behind a palette token, not a UI background (Law 32 governs surfaces).
