> **Decision audit for THR-1831** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-11c, unattended; decided by delegation (process.md rule 4) with a veto invited. The ticket says "decidable by delegation from measurement; record numbers", so every number below was measured in this run.
>
> Screens, from the deployed build at `?view=game&seeded&size=medium`:
> - [opening view, 2560×1440](2026-10-11-thr-1831-map-chrome/opening-view-1440p.jpg)
> - [opening view, 1920×1080](2026-10-11-thr-1831-map-chrome/opening-view-1080p.jpg)
> - [zoomed out, 2560×1440](2026-10-11-thr-1831-map-chrome/zoomed-out-1440p.jpg)

# THR-1831 — map chrome and markers

## What the player gets today (measured)

### Camera

- **The run opens at the closest zoom the map has.** Setup fits the whole grid. On the deployed medium map at 2560×1440 that fit is `k = 2.74`, read from the canvas's d3 transform. Then `HexMapV2.tsx:1236-1254` ("ZOOM-05: Default camera on retinue agent") jumps to `ZOOM_TIER_THRESHOLDS.HERO_LOCAL = 15` on the First. The same transform read `k: 15` about a second later.
- **At k = 15 a hex is about 300 px across** (`HEX_SIZE 10` × 2 × k; `scene/HexFillMesh.ts:14`).
  - At 2560×1440 the map canvas is 1800×1341, so it shows about 7 hexes across.
  - At 1920×1080 the canvas is 1200×983, so it shows about 5 hexes across.
  - Place names are 11–16 px on 300 px hexes.
- **Zooming out to see the land shows a black square.** The known land on the seeded map is about 30 hexes. Around it, the screen is near-black (`fogUnexploredColor '#0a0a0c'`, `palette/paletteTheme.ts:104`; `sceneBackground 0x0a0a0c`, :95). The per-hex parchment fog in `scene/FogOverlayMesh.ts` uses `public/textures/parchment-512.png`, which exists, but it is not what the player sees.
- **Camera constants** (`camera/D3ZoomCamera.ts:10-26`):

  | Constant | Value |
  |---|---|
  | `MIN_ZOOM_FLOOR` | 2 |
  | `ABSOLUTE_MIN_ZOOM` | 0.5 |
  | `MAX_ZOOM` | 20 |
  | `DEFAULT_ZOOM` | 1.5 |
  | `FIT_PADDING` | 0.85 |
  | `JUMP_TO_DURATION_MS` | 500 |

  - `DEFAULT_ZOOM` is used only when there is no grid.
  - The tiers are hero-local ≥ 15, regional ≥ 5, continental ≥ 1.5, and full-world below that (`scene/ZoomVisibilityMatrix.ts:34-43`).
- **Opening-frame mismatch.** The labels' zoom state starts at `DEFAULT_ZOOM 1.5` (`HexMapV2.tsx:675-678`). Its listener attaches after the first transform is set (:1179), so the first frame's tier can disagree with the camera.

### Controls and keys

- **The map has no zoom buttons, no minimap, no fit or recentre control, and no keyboard bindings.**
  - The only map keydown handler is in a lab canvas (`lab/TerrainTextureLabCanvas.tsx:643`).
  - Escape cancels move mode (`Game/hooks/useViewNavigation.ts:134-139`).
- **Centring does exist, but it is buried:**
  - `AscendantBar`'s seat button (`onCenterOnSeat`) and the eye icons both fly to `RETINUE_EYE_ZOOM_SCALE = 20` (`GameView.tsx:2278`).
  - The old avatar-centre button lives in `AvatarHUD`, which is no longer rendered (`GameView.tsx:5519`).

### Agent markers

- **What shows at each tier:** portrait at hero-local, faction-coloured dot at regional and continental, nothing at full-world (`AgentSpriteMesh.ts:357-389`).
- **Size changes with zoom.** Sprites are world-space up to `SPRITE_SCALE_REFERENCE_ZOOM = 7`.
  - The dot is 4.5 px at k = 1.5, 15 px at k = 5, then a fixed 21 px.
  - A portrait is a fixed 63 px, or 82 px for the avatar.
- **The retinue-dot branch (:377) can never run**, because the dot path is on at continental.
- **Agents are not in label collision** (`overlay/labelCollision.ts`). That is why the First's portrait sits on its hex's place name in the opening screenshot.

### Borders

- **Every realm border is the same red**, `0xC83030` (`palette/paletteTheme.ts:98`; `BorderMesh.ts:248`).
  - The line is 1.5 world units wide at 0.7 opacity, in every tier.
  - Capitals use the same red (`capitalColor`, `capitalRingColor`, :99-100).
- **That red clashes with other meanings:**
  - Law 31 says red means against or loss.
  - Doom uses `--forecast-doomed-rgb 232 64 56` (`index.css:163`).

### Labels

- **Place names** (`overlay/LocationLabelOverlay.tsx:45-61`):
  - Sizes are fixed in px: capital 16, city 13, town 13, small 11.
  - Every weight is 700.
  - They are hidden below k = 5. Small places are hidden below k = 10.
- **Realm names** (`overlay/RegionLabelOverlay.tsx:67-77`):
  - 20 px, weight 700, uppercase, `letter-spacing 0.08em`, display face.
  - Below k = 5 they scale up to `MAX_SCALED_FONT_SIZE 60`.

## Decisions

### 1. Controls: a corner cluster, four buttons, keys to match

- **Where it sits.** A vertical cluster in the map canvas's bottom-right corner, 16 px in from both edges.
  - It is anchored to the canvas edge, not the window, so it moves with the docked Inspector (THR-1827).
  - Bottom-left is already taken by the Active Locations bar.
- **The four buttons**, each 40 px with an icon, a tooltip from the registry (Laws 11, 12 and 17) and an `aria-label`:
  - **Zoom in**
  - **Zoom out**
  - **Centre on my First** (falls back to the god's seat)
  - **Show known land**
- **How zoom moves.** Each click zooms ×2 around the canvas centre, eased over `JUMP_TO_DURATION_MS` (500 ms).
- **Limits.** At a zoom limit the button renders disabled with a reason ("Closest view"), never silently inert (Law 25).
- **Keys** — inert while a text field has focus or any modal is open (Law 23 keeps Escape):

  | Key | Does |
  |---|---|
  | `+` / `=`, `−` | Zoom in / out, ×2 |
  | `Home` | Centre on my First |
  | `F` | Show known land |
  | Arrows and `WASD` | Pan by one third of the canvas |
  | `1`–`5` | Reserved for the lenses (THR-1830) |

- **One centring zoom.** The seat button, the eye icons and **Centre on my First** all land at the same named constant, `FOCUS_ZOOM = 10`: regional, with portraits on and a 200 px hex.
  - Eye icons land at 10, not 20. At 20 a hex is 400 px and the canvas shows three hexes, which loses where the thing is.
  - Law 22's "Show on map" keeps its meaning: you see the thing and its neighbours.

### 2. Minimap: on at 1440p, folded at 1080p

- **Size.** 240×180 px at 2560×1440, set directly above the control cluster.
  - At 1920×1080 the canvas is only 1200 px wide, so the minimap starts folded into a fifth 40 px button. Its open/closed state is remembered per player.
- **What it shows:**
  - the whole grid;
  - known land in a flat tone per terrain family;
  - unknown land in the uncharted fill (decision 5);
  - the First as a gold pip;
  - the current view as an outlined rectangle.
- **Lenses.** The minimap shows no lens tint. Lenses live on the main map (THR-1830).
- **Moving the view.** Click to centre there; drag the rectangle to pan.
- **Why it earns its space.** Known land starts at about 30 of 768 hexes (32×24). The minimap is how a player sees how much world is left, and that number grows every run.

### 3. Opening view: the First and the known land, at regional zoom

- **Retire ZOOM-05's hero-local open.** The run opens centred on the First at `k = clamp(fitKnownLand, 6, 10)`. `fitKnownLand` is `computeFitZoom` (`D3ZoomCamera.ts:64-77`) applied to the explored hexes' bounds with `FIT_PADDING 0.85`.
- **What that gives today.** The seeded known land is about 7 hex columns × 8 rows, so about 110 k × 140 k px. That makes:
  - about `k = 8` at 2560×1440 (≈ 160 px hexes);
  - about `k = 6` at 1920×1080 (≈ 120 px hexes, the floor).
  - Either way the player sees all of their land at once, with the First at its centre.
- **No animation on the opening frame.** Duration 0, as ZOOM-05 already does.
- **Fix the opening-frame mismatch** in the same change. The zoom and tier state is seeded from the transform actually applied, not from `DEFAULT_ZOOM`.

### 4. Agent markers: one steady size per zoom band

Sizes become screen-fixed per band rather than growing with zoom. The world-space growth up to k = 7 goes.

| Band | Other agents | The player's threaded agents (the First and others) |
|---|---|---|
| Full-world (< 1.5) | hidden | 12 px gold pip — you can always find your own |
| Continental (1.5–5) | 10 px faction dot | 32 px portrait medallion |
| Regional (5–15) | 14 px faction dot (the Law 11 floor) | 40 px portrait medallion |
| Hero-local (≥ 15) | 48 px portrait | 64 px portrait |

- **Agents become obstacles in label collision.**
  - When a label overlaps a marker, the label moves to the free slot below its anchor.
  - If no slot is free, a smaller place's label hides first, and a threaded agent's medallion never moves.
  - Markers are click targets; labels are not.
- **The dead retinue branch** (`AgentSpriteMesh.ts:377`) is removed. Threaded medallions replace it.

### 5. Borders in the holder's ink; uncharted land as parchment

- **A realm border takes its holder's heraldic colour** as a darkened ink.
  - The holder's colour is mixed 40% toward the terrain's own shadow tone, at 0.45 opacity and 1.0 world unit wide (down from 0.7 and 1.5).
  - Realms read as different from each other without shouting.
- **Two colours are kept out of border ink:**
  - **red** is kept for danger and doom (Law 31, `--forecast-doomed-rgb`);
  - **gold** is kept for the Dominion frontier line, which THR-1750 owns.
  - Heraldic index 0 (`#e53e3e`, `agentSpriteTypes.ts:68`) and any gold slot get a border-ink remap in the palette, so no realm border can read as doom or as your frontier.
  - Capital markers take the holder's ink too.
- **Unknown land inside the world is parchment**, using the existing `parchment-512.png` at the existing fog overlay, so the edge of the known world looks like an unfinished map rather than a void.
  - Off-grid space stays dark (Law 32), with a soft vignette where the parchment meets it.
- **Parchment is a palette-theme token** (`fogUnexploredFill`), not a constant. The dark-map prototype (THR-1835) sets its own value and decides how uncharted land reads on dark ground. This ticket does not pre-empt that verdict.

### 6. Labels: grow with zoom, weigh by importance, realms in title case

- **Place names step up by band** — screen px, stepped, not continuous:

  | Size | Regional (5–10) | Regional (10–15) | Hero-local (≥ 15) |
  |---|---|---|---|
  | Capital | 16 | 19 | 22 |
  | City | 14 | 16 | 19 |
  | Town | 13 | 14 | 16 |
  | Small | hidden | 12 | 14 |

- **Weights:** capital 700, city 600, town 500, small 400.
- **Realm names** drop uppercase and the 0.08em tracking. They are set in title case at `letter-spacing 0.02em`.
  - Under the direction-C type rule (THR-1823 notes), the display face is used only at 22 px and up. Realm names keep scaling up to 60 px when zoomed out.
  - Below 22 px they take the label face that THR-1833 picks.
  - **This ticket fixes sizes and weights; THR-1833 picks the faces.**
- **Collision priority** stays realm > area > river > locations.

## Options weighed and not taken

- **Keep the hero-local open.** Rejected: the first screen shows 5–7 hexes and hides the player's own land.
- **Open fit-to-grid.** Rejected: on medium and larger maps that is mostly parchment, and the First becomes a 4 px dot.
- **Always-on minimap at 1080p.** Rejected: 240 px is a fifth of a 1200 px canvas.
- **Zoom slider instead of buttons.** Rejected: a slider puts a raw magnitude in chrome (Law 13), and four buttons cover the jobs.
- **Faction-colour borders at full strength.** Rejected: on the Golden Hour palette they compete with terrain and with the Dominion overlay's gold line.
- **Keep red borders and add a separate danger red.** Rejected: two reds with two meanings break Law 10.

## Would change the call

- **Christian says the game should open close on the First** ("I want to start face to face with my mortal"). Then the opening reverts to hero-local and **Show known land** becomes the first-run hint.
- **The dark-map verdict (THR-1835) adopts a dark palette where parchment clashes.** Then the `fogUnexploredFill` token changes. The structure here holds.
- **A 1080p measurement after THR-1819's layout contract widens the canvas past about 1400 px.** Then the minimap starts open at 1080p too.

## Feeds

- The **map lenses and map chrome** plan doc this map owes (destination bullet 3) takes these decisions as its chrome half.
- The lens bar (THR-1830) must sit clear of the bottom-right cluster.
- Keys `1`–`5` are reserved for it.
