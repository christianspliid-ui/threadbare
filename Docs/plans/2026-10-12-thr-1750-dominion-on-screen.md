> **title:** Dominion on the map and on every sheet — THR-1750
> **linear_issue:** THR-1750
> **author:** Claude Code (design lane, run 2026-10-12d)
> **created:** 2026-10-12
> **three_pillars:** Engine `done — one pure hex projection and two pure view-model selectors over THR-1748's band read; one slot field; the prices flag flipped; no new node, edge, phase or writer` · Content `done — lens, legend, tooltip, sheet, chip and cast-bar words as data; the five band lines reused from THR-1748` · UI `done — the Dominion lens (dim, gold frontier, Sovereign glow, drop badge) with a switch and key, a band box on place / faction / artifact pages, a band row on the mortal sheet, the card chip with ghost and red pips, the cast-bar clause; Claude-in-Chrome for WebGL, Playwright for DOM`

# Dominion on the map and on every sheet — THR-1750

*The band is the one read every Dominion consumer uses. This plan is where the player first sees it: on the map as their turf and its edge, on every sheet as a word, and on every card as "cheaper here" before they spend.*

## Why this is load-bearing

[Dominion core](https://linear.app/threadbare/issue/THR-1748) (In Dev) computes how far each place, person and power leans toward the god's bought spheres. It deliberately ships with **nothing on screen** except chronicle lines and a debug row. Its cost and odds consumers are built but held behind `DOMINION_PRICES_LIVE = false` (core plan § Decided 13), so that no price moves before the card explains why. Until this plan ships, Dominion is a system the player cannot see. That is PC-1 (*unexplained resources, terms and odds*) by construction, and the kill criterion the core plan names: *"no tester able to say why one place is cheaper than another."*

This is plan doc 2 of the four in the Dominion map's carve-up ([Christian's closing comment on the Dominion map](https://linear.app/threadbare/issue/THR-1758), 2026-10-11). It builds the screens that [What the player sees](https://linear.app/threadbare/issue/THR-1766) decided ([audit](../audits/2026-10-11-thr-1766-dominion-screens-prototype.md), [mock](../audits/2026-10-11-thr-1766-dominion-mock/dominion-mock.html)). It is also **lens one** of [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823). Christian's coordination note on this ticket (2026-10-11): *"author the overlay so it can be switched as a lens (on/off, keyed, legend) rather than as an always-on layer; the lens-system ticket THR-1830 hosts it and will not build a second Dominion overlay."*

## Settled inputs

| Input | What it fixes here | Who decided |
|---|---|---|
| [What the player sees](https://linear.app/threadbare/issue/THR-1766) | Overlay C (dim what is not yours, a gold frontier line thicker against Hostile, a Sovereign glow in the sphere colour); a place box after Livelihood; a mortal row under *Attuned to*; a card chip after the pips with ghost and red pips and no chip on Foreign ground; the five band lines; no new essence surface | attended, 2026-10-11, by delegation |
| [Dominion core plan](2026-10-11-thr-1748-dominion-core.md) | `dominionOf`, `dominionBandOfHex`, `isTended`, `DominionBand`, the band words and lines in `dominion-content.ts`, `getDominion` on the bridge, `DOMINION_PRICES_LIVE` (flipped here), `dominionScaledEssenceCost` | design lane, 2026-10-11 |
| [The opposing dominion as a force](https://linear.app/threadbare/issue/THR-1763) | *"A band drop = a coalesced chronicle line + a map badge, never an interrupt."* The core ships the line; the badge is this plan's (core plan § Visual presence) | design lane, 2026-10-09 |
| [Dominion of the secondary actors](https://linear.app/threadbare/issue/THR-1764) | A faction reads its own and its members' scores, an artifact reads its bearer, and an unborne artifact is Foreign. The sheets show whatever `dominionOf` answers | design lane, 2026-10-10 |
| [Map chrome and markers](https://linear.app/threadbare/issue/THR-1831) | Keys `1`–`5` are reserved for lenses; the lens bar sits clear of the bottom-right control cluster; gold is reserved for the Dominion frontier | design lane, 2026-10-11T12:28Z (veto window closed) |
| [What can each map lens show today?](https://linear.app/threadbare/issue/THR-1824) | Hexes are not nodes, so a per-hex band needs a projection; `realmProjection.ts` is the model to copy | research, 2026-10-11 |

No input is a lane decision younger than 24 hours. This plan does **not** draw on [The screen frame](https://linear.app/threadbare/issue/THR-1828) or [the post-bond reveal](https://linear.app/threadbare/issue/THR-1837) (both decided today). Every surface it touches exists on today's screen, and the reveal plan leaves the map itself unstaged (*"Surfaces that are not in the table (the map, …) keep their current behaviour"*).

## Decided by delegation (design lane, 2026-10-12 — veto in chat)

1. **A hex shows the band of the nearest town.** Hexes are not graph nodes, and `dominionBandOfHex` reads a terrain table that never changes, so a lens drawn from it would never move as the player Claims and Shifts. Each land hex instead takes the band of the nearest top-level place within `DOMINION_HEX_FILL_RADIUS` (2), following the `realmProjection.ts` pattern (stores nothing, owned by the runtime). The terrain read is the fallback only past that radius. Equidistant places: the higher band in `DOMINION_HEX_TIE_PRIORITY` wins (Sovereign, then Hostile, then Held, Touched, Foreign, so a threat is never hidden by mild ground), then the lower place id. Water carries no band.
   *Measured this run* (headless CLI, `--map medium`, top-level places, land = terrain not matching `ocean|shallows`):

   | Seed | Places | Land hexes | On a place's hex | 1 away | 2 away | 3 away | 4+ |
   |---|---|---|---|---|---|---|---|
   | 42 | 235 | 711 | 214 | 402 | 91 | 4 | 0 |
   | 99 | 238 | 717 | 222 | 387 | 104 | 4 | 0 |

   Radius 1 would leave 13–15% of land on the static terrain read. Radius 2 leaves 0.6%.
   *Rejected:* terrain only (the frontier never moves); a radius of 3 (as the realm fill uses), which lets one town lend its band across three hexes of wilderness.
2. **One lens, in a lens registry, behind one switch.** THR-1766 mocked four tabs: Terrain / Dominion / Borders / Threads. Building them now would decide [Lenses on the map](https://linear.app/threadbare/issue/THR-1830) ahead of it: how lenses look, switch and combine. This plan therefore builds a data registry, `MAP_LENSES`, with **one** row (Dominion), a switch button bottom-left of the map, key `1`, and a legend shown while the lens is on. THR-1830 adds its rows and may restyle the switch into its bar. **This deviates from THR-1766 decision 2 (the four-tab control) by deferring three tabs to the ticket that owns them.** Borders and Threads stay always on, as today.
3. **The card face learns the band from the slot, not from a target id.** No target id reaches `CardFace` (`ActionDrawer` receives only `targetName`, `ActionDrawer.tsx:92-93`). `getTargetActionSlots` already holds the target (`targetActions.ts:464`), so each `WheelSlot` gains an optional `dominion?: { band; parCost }`, computed there next to `essenceCost`. The card and the cast bar read it. The engine does the arithmetic once, and the price shown is the price paid.
4. **The second sheet line names who tends the ground, not the direction of pressure.** THR-1766's mock line reads *"pressed from the east by a power of Entropy; left untended, it will slip back"*. No stored datum carries a direction or the pressing sphere per place (the core stores none; raids are traces). The line is built from `isTended` instead: *"Tended by your seat."* / *"Tended by Elara."* / *"Tended by the Ashen Court."* / *"Left untended, it will slip back."* The last appears only on Touched-or-better ground, because Foreign ground has nothing to lose.
5. **Faction and artifact pages show the box too, on Foreign as well.** The ticket names four sheets; THR-1766 mocked two. The same box shape goes on `FactionSheet` and `ArtifactSheet`. On a **sheet**, Foreign still shows (*"Foreign — Neither yours nor set against you."*), because the sheet is where par is explained. The no-chip-on-Foreign rule is a **card** rule (Law 56: a chip shows only a change).
6. **The band-drop badge is a broken gold ring.** It sits on the place's hex for `DOMINION_DROP_BADGE_TICKS` (36, three days at 12 ticks a day) after a `dominion.band_change` with `to < from`, and is visible whether or not the lens is on (the drop is news). Fog covers it like every other layer. It carries a tooltip that repeats the chronicle line; it is never an interrupt (THR-1763).
7. **No new essence surface.** `ESSENCE_TREND_WORDS` (*Rising / Steady / Ebbing*, `ascendant-bar-content.ts:203-207`) already ship. Once THR-1748 lands, yield and income read the band, so those words move with it. The ticket body's *"rising / steady / draining"* is superseded (THR-1766 decision 7).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Spheres & Quintessence (`dominion.ts` read, THR-1748) | 🟢 once THR-1748 merges | **extends**: a hex projection and two view-model selectors call `dominionOf`; nothing outside `dominion.ts` reads the match number |
| Realm projection (`realmProjection.ts`, `ensureRealmProjection` in `simulationRuntime.ts:632`) | 🟢 ACTIVE | **pattern copied** for `dominionProjection.ts`; the realm code is not edited |
| HexMapV2 overlays (`FogOverlayMesh.ts` per-instance attribute; `HexPulseMesh.ts` additive `setColorAt`; `BorderMesh.ts` edge walk) | 🟢 ACTIVE | **extends**: two new instanced meshes copy the fog and pulse patterns; `BorderMesh`'s `getEdgePoints` / `buildThickEdge` are exported (additive) for a new frontier mesh |
| Action targeting (`getTargetActionSlots`, `WheelSlot`) | 🟢 ACTIVE | **extends**: one optional slot field |
| Card face (`CardFace.tsx`, `CostPips`) | 🟢 ACTIVE | **extends**: one optional model field, one chip, two pip variants |
| Sheets (`LocationView`, `AgentProfileModal`, `FactionSheet`, `ArtifactSheet`) | 🟢 ACTIVE | **extends**: one box or row each |
| Tooltip registry (`tooltipResolver.ts`, `UI_TOOLTIPS`) | 🟢 ACTIVE | **extends**: `ui.dominion.*` entries; no new prefix |
| Hex tooltip (`HexTooltip.tsx`) | 🟢 ACTIVE | **extends**: one band line while the lens is on |

Population consumed, measured: 235 / 238 top-level places and 711 / 717 land hexes on seeds 42 / 99 (table above).

## Engine pillar

### Systems design

**E1 — `src/engine/dominionProjection.ts` (new, pure).**

```ts
export interface DominionHexProjection {
  hexBand: Map<HexKey, DominionBand>;      // land hexes only
  hexPlaceId: Map<HexKey, string | null>;  // the place that lent the band; null = terrain fallback
  builtAtStructure: number;
  placeBandFingerprint: string;
}
export function buildDominionHexAssignment(graph, tiles): Map<HexKey, string | null>; // nearest top-level place ≤ radius
export function buildDominionHexProjection(graph, ascendantId, tiles, assignment): DominionHexProjection;
export function frontierEdges(projection, tiles): { a: HexKey; b: HexKey; meetsHostile: boolean }[];
```

- **Assignment** (hex → place) depends only on structure. It is rebuilt when `structuralCacheVersion` moves, using `getPlaceNodes` from `sublocationShape.ts` (never a bare `getNodesByType('location')`, which returns both tiers) and `hexDistance` from `lib/hexMath.ts`. Ties: the earlier band in `DOMINION_HEX_TIE_PRIORITY` (a new ordered tuple `['sovereign','hostile','held','touched','foreign'] as const satisfies readonly DominionBand[]` in `dominion-ui-content.ts`), then the lower place id. Ties are resolved when bands are applied, not stored.
- **Bands** per hex: `dominionOf(graph, ascendantId, placeId).band` once per assigned place (≤ 238 reads), then fanned out to hexes. A hex with no place in reach reads `dominionBandOfHex`.
- **Turf** = Touched, Held or Sovereign. A **frontier edge** joins a turf hex to a land hex that is not turf; edges to water or the map's rim are not frontier. `meetsHostile` marks the thicker line.

**E2 — runtime ownership.** `ensureDominionProjection(runtime, graph, tiles, ascendantId, tick)` in `simulationRuntime.ts`, beside `ensureRealmProjection`:
- The assignment is rebuilt on a structure bump.
- Bands are recomputed at most every `DOMINION_LENS_REFRESH_TICKS` (6) while the lens is on, and at once when the lens opens or when a `dominion.band_change` trace landed this tick.
- While the lens is off, only the drop badge's input (band changes) is read, and that comes from the trace, not a recompute.
- Engine caches are per session (load-bearing decision).

**E3 — `src/engine/dominionViewModels.ts` (new, pure; the view-model seam, [THR-1822](https://linear.app/threadbare/issue/THR-1822)).** Components read prepared data, never the graph:

```ts
export interface DominionSheetVM { band: DominionBand; word: string; line: string; tendLine: string | null; sphereColorVar: string; tooltipId: string; }
export function dominionSheetVM(graph, ascendantId, objectId, tick): DominionSheetVM | null;
export interface DominionLensVM { on: boolean; hexes: { key: HexKey; band: DominionBand; frontier: boolean; meetsHostile: boolean; placeId: string | null }[]; godSphere: SphereName; drops: { hexKey: HexKey; placeId: string; untilTick: number; line: string }[] }
export function dominionLensVM(projection, ascendant, drops, on): DominionLensVM;
```

The shape matches THR-1824's `DominionLensVM` sketch, plus `placeId` and `drops`.

**E4 — the slot carries the band.** In `getTargetActionSlots` (`targetActions.ts:276`), when the template has an essence cost and the target is a world object, the slot gets `dominion: { band, parCost }`:
- `band` is `dominionOf(target).band`.
- `parCost` is `tierScaledEssenceCost(...)`, the Foreign price.
- `essenceCost` becomes the band price via `dominionScaledEssenceCost`, which the core builds and wires to both the preview and the charge.

`WheelSlot` (`wheel.ts:29`) gains the optional field. A free card, a nudge card and a card with no world target get no `dominion` field.

**E5 — flip `DOMINION_PRICES_LIVE` to `true`** in `dominion-content.ts`, in the same PR as the chip (core plan § Decided 13; its Notes for the executor say *"Flipping it is THR-1750's job, in the PR that ships the card chip"*). From then on, cost and cast odds read the band. The core's tests already run with the flag on.

### Graph nodes / edges

No new node types, no new edge types, no new properties. Reads only: `located_at` (via `dominionOf`), `thread`, `member_of`, `possesses` / `bonded_to` (inside `dominionOf` / `isTended`). Checked against `src/types/graph.ts`: hexes stay non-nodes (load-bearing decision; core plan § Decided 7).

### Tick phases

None. No phase is added or edited. The projection is a runtime cache rebuilt from the React side's tick hook, like the realm projection. The drop list reads the `dominion.band_change` traces that `phaseDominion` (THR-1748) already emits.

### Resolution logic

None new. Card cost and cast odds become live through E5. The band → price and band → odds tables are the core's (`DOMINION_COST_MULTIPLIER`, `DOMINION_SPHERE_FACTOR`, THR-1761).

### PRNG callouts

None. Every new function is pure and deterministic. Tie order is by `DOMINION_HEX_TIE_PRIORITY`, then place id, never iteration order.

## Content pillar

### Data tables

**C1 — `src/data/dominion-ui-content.ts` (new).** Every player word below and every constant in § Constants. The five band words and lines are **imported** from `dominion-content.ts` (THR-1748), never copied, so they are told one way (PC-6).

| Key | Text |
|---|---|
| `DOMINION_LENS_LABEL` | "Dominion" |
| `DOMINION_LENS_KEY_HINT` | "1" |
| `DOMINION_LEGEND_LINES` | "Your ground keeps its colour." · "Dimmed ground is not yours; darker is turned against you." · "The gold line is your frontier." |
| `DOMINION_TEND_LINES` | seat: "Tended by your seat." · mortal: "Tended by {name}." · faction: "Tended by {faction}." · untended (Touched+): "Left untended, it will slip back." |
| `DOMINION_CHIP_WORDS` | sovereign / held / touched: "{Band} · cheaper here" · hostile: "Hostile · dearer here" |
| `DOMINION_CAST_CLAUSE` | sovereign: "Sovereign ground: cheapest, likeliest" · held: "Held ground: a little cheaper, a little likelier" · touched: "Touched ground: a little cheaper" · hostile: "Hostile ground: dearer, and less likely" |
| `DOMINION_HEX_LINE` | "{Band} ground, by {place}" · terrain fallback: "{Band} ground" |
| `DOMINION_DROP_BADGE_LINE` | reuses the core's band-drop chronicle line for that place, word for word |

The cast clauses follow THR-1761's real table: Touched moves odds by only +0.03 (`DOMINION_SPHERE_FACTOR`), so its clause names only the price. That keeps the words true to the effect (PC-6).

**C2 — tooltips** in `UI_TOOLTIPS` (`ui-content.ts:70`), Law 17:
- `ui.dominion`: *"How far a place, person or power leans toward the spheres you hold. Your works cost less and land more often on your own ground."*
- `ui.dominion.sovereign` … `ui.dominion.hostile`: the band's line from `dominion-content.ts`.
- `ui.dominion.lens`: *"Show your ground: what is yours, where it ends, and what stands against you. Key 1."*
- `ui.dominion.chip`: *"The ground you aim at changes the price. The faint pip is what neutral ground would cost."*
- `ui.dominion.drop`: *"Your hold here slipped. Tend it to win it back."*

### Prose tables

N/A: no `enrichProse` slot or vignette stratum. The one name slot (`{name}`, `{faction}`, `{place}`) is filled from the node's display name. An empty name falls back per § Fail-soft and never renders a raw `{…}` (PC-3).

### Encounter templates / attachment content

N/A: nothing here creates or changes an encounter or attachment.

## UI pillar

*Screenshot tools: **Claude-in-Chrome** for the WebGL lens (Playwright snapshots cannot see WebGL; `reference_browser_mcp_from_cc_debug` notes Playwright can screenshot it from the debug path, which is acceptable too). **Playwright** for the DOM sheets, card chip and cast bar.*

### Player-facing display

**U1 — The Dominion lens** (HexMapV2):
- **Dim** (`DominionDimMesh`, new, the `FogOverlayMesh` per-instance attribute pattern): one instanced hex plane with `aDim` and `aHatch`. Alpha by band: Sovereign 0, Held 0, Touched `DOMINION_DIM_TOUCHED` 0.15, Foreign `DOMINION_DIM_FOREIGN` 0.45, Hostile `DOMINION_DIM_HOSTILE` 0.60 with a faint diagonal hatch (`DOMINION_HATCH_ALPHA` 0.12). The colour is near-black, never a hue (THR-1766: "lightness instead of hue"). Render order `DOMINION_DIM` 8.95: above terrain signifiers, below location icons, so towns stay readable as targets.
- **Glow** (`DominionGlowMesh`, new, the `HexPulseMesh` additive pattern): Sovereign hexes only, tinted with `--sphere-<primary>-bright` at `DOMINION_GLOW_ALPHA` 0.22. Render order 8.96. This is the only hue in the lens.
- **Frontier** (`DominionFrontierMesh`, new): edges from E1's `frontierEdges`, built with `getEdgePoints` / `buildThickEdge` exported from `BorderMesh.ts`. Colour `--accent-gold`, width `DOMINION_FRONTIER_WIDTH` 2.0 px, ×`DOMINION_FRONTIER_HOSTILE_WIDTH_MULT` 1.75 where it meets Hostile. Render order 9.2: above locations, below threads and agents.
- **Fog** (order 13) covers all three, so the lens never reveals unseen ground.
- All three are added to `ZoomVisibilityMatrix.LAYER_NAMES` as `'dominion_lens'` and stay visible at every zoom band. With the lens off, the three meshes are not in the scene; the lens is built on toggle, not hidden by alpha (Done-when: toggling changes only the lens).

**U2 — The switch, the key and the legend:**
- `MAP_LENSES` registry (`src/data/map-lenses.ts`, new): `[{ id: 'dominion', label: DOMINION_LENS_LABEL, key: '1', tooltipId: 'ui.dominion.lens', legend: DOMINION_LEGEND_LINES }]`.
- `MapLensSwitch` (new, `src/components/HexMapV2/chrome/MapLensSwitch.tsx`): one button per registry row, bottom-left of the map canvas, 16 px from each edge, clear of THR-1831's bottom-right cluster. It uses the ActionDrawer narrative-tab styling (THR-1766). Pressed state: a `--text-primary` underline and `aria-pressed`. It is not gold, so that with the lens on the frontier line is the one gold emphasis on the map (taste profile: one gold emphasis per panel; Vision audit note). The sheet box border and the mortal-row label reuse the existing Livelihood and *Attuned to* styles; they add no new gold.
- Key `1` (through `useTopBarHotkeys.ts`, ignored while typing in an input) toggles the lens. The key is the registry row's.
- With the lens on, a small legend card above the switch shows the three `DOMINION_LEGEND_LINES` with the band word chips Sovereign / Held / Touched / Foreign / Hostile. Each chip carries its `ui.dominion.<band>` tooltip.
- Lens state is local to the session, off at the start of a run, and kept across view changes.

**U3 — The hex tooltip line.** While the lens is on, `HexTooltip.tsx` adds one line after the terrain name, e.g. *"Held ground, by Hesk Crossing"*. The place name is a link through `useRefRouter` (Law 21). It is shown only for visible hexes (fog rules unchanged).

**U4 — The drop badge.** `DominionDropBadge` sprite (broken gold ring) on the place's hex for `DOMINION_DROP_BADGE_TICKS`, render order 10.95, with the `ui.dominion.drop` tooltip plus the chronicle line. At most one per place; a second drop refreshes it.

**U5 — Sheets** (one shared `DominionBox` component in `src/components/shared/DominionBox.tsx`, props `vm: DominionSheetVM`, `variant: 'box' | 'row'`):
- **Place:** `LocationView.tsx` between `<LivelihoodLine>` (:1435) and `<SourceDrainLine>` (:1436). Box variant, copying the Livelihood markup (`mx-6 mt-3`, `--border-gold`). Header "Dominion" with the `ui.dominion` tooltip, the band word in the sphere's bright colour (Hostile in `--negative`) with its band tooltip, the band line, and the tend line.
- **Mortal:** `AgentProfileModal.tsx` after the *Attuned to* row (:229-243). Row variant: "Dominion" label in `--accent-gold`, then the band word, then the band line in one row; the tend line is omitted for mortals. A mortal's band is read from her own scores (THR-1764).
- **Faction:** `FactionSheet.tsx`, box variant directly before the tag row (:236).
- **Artifact:** `ArtifactSheet.tsx`, box variant after the identity block (:186-206). An unborne artifact shows Foreign.
- `DominionBox` renders nothing when the VM is `null` (no god, or an object kind `dominionOf` does not answer).

**U6 — The card chip** (`CardFace.tsx`):
- `CardFaceModel` gains `dominion?: { band; parCost }`, mapped from the slot in `actionCardModel.ts:182`.
- When the band is not Foreign and `parCost !== cost`, a chip renders after `<CostPips>` (:529-536) with `DOMINION_CHIP_WORDS[band]`. It is coloured in the sphere's bright colour, or `--negative` for Hostile, and carries the `ui.dominion.chip` tooltip.
- `CostPips` gains two optional props:
  - `ghostFrom` draws `parCost − cost` struck, faint pips after the paid ones (cheaper).
  - `dearFrom` draws the extra `cost − parCost` pips in `--negative` (dearer).
- The price stays gold; CardFace never tints it (THR-1766). A Foreign-ground card, or a card whose band changes nothing (a free card at the cost floor), shows no chip.

**U7 — The cast bar** (`ActionDrawer.tsx:348-366`). The "Casting on **{targetName}**" pill gains ` · {DOMINION_CAST_CLAUSE[band]}` when the slots carry a non-Foreign band. The drawer reads the band from its slots (every slot shares the target), so no new prop is needed.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Lens switch | "Dominion" (key hint "1") | PC-1, PC-8 | Tooltip: *"Show your ground: what is yours, where it ends, and what stands against you. Key 1."* Within one frame of the click the map dims and the gold line draws (PC-8 reply), and the button shows pressed. |
| Lens legend | "Your ground keeps its colour." / "Dimmed ground is not yours; darker is turned against you." / "The gold line is your frontier." + five band chips | PC-1 | Each band chip's tooltip is its line, e.g. Held: *"Yours, and holding. Cheaper works, richer threads."* |
| Hex tooltip | "Held ground, by Hesk Crossing" | PC-1, PC-6 | It names the town whose page explains the same band. The band word matches that page word for word. |
| Place page box | "Dominion — **Held**. Yours, and holding. Cheaper works, richer threads. Left untended, it will slip back." | PC-1, PC-4 | The header tooltip explains the term. The tend line says in advance what will happen on its own (PC-4), matching the chronicle line the core writes when it happens: *"Hollowmere has slipped from Held to Touched. No one tends it."* |
| Place page box, tended | "Dominion — **Sovereign**. Wholly yours. Your works come easiest here. Tended by your seat." | PC-4 | Names what is holding it. |
| Mortal sheet row | "Dominion **Touched** · Your mark is on it. A little cheaper." | PC-1 | Tooltip on the word; same line as the place box. |
| Faction page box | "Dominion — **Foreign**. Neither yours nor set against you." | PC-1 | On a sheet par is said out loud; on a card it is silent (Law 56). |
| Artifact page box | "Dominion — **Foreign**. Neither yours nor set against you." (unborne) | PC-1 | Same as the faction page. |
| Card chip | "Held · cheaper here", followed by one struck, faint pip | PC-1, PC-6 | Chip tooltip: *"The ground you aim at changes the price. The faint pip is what neutral ground would cost."* The pips shown are the essence the cast takes (E4: the preview and the charge use one helper). |
| Card chip, Hostile | "Hostile · dearer here", followed by red extra pips | PC-1 | Same tooltip; red is loss (Law 31). |
| Cast bar | "Casting on **Hesk Crossing** · Held ground: a little cheaper, a little likelier" | PC-1 | Said before the spend, with the same band word as the place box. PC-2 is not touched by new text: this plan adds no stakes or result line, and the cast's existing result line is unchanged. The card's existing forecast word moves with the band because the core wires `CARD_READOUT_SPHERE_FACTOR` to the same value the roll uses (core E2.2), so the forecast and the roll cannot disagree. |
| Place page box, Hostile | "Dominion — **Hostile**. Turned against you. Your works cost dearly." | PC-1 | The band word is in `--negative` (Law 31: red is against). Its tooltip repeats the line, and the `ui.dominion` header tooltip says what the band does. No tend line, because Hostile ground has nothing of yours to slip. |
| Drop badge tooltip | "Your hold here slipped. Tend it to win it back." + "Hollowmere has slipped from Held to Touched. No one tends it." | PC-4, PC-5 | The second line is the chronicle line verbatim. One badge per place, refreshed rather than stacked (PC-5). |

### Playtest signal

A tester who opens the Dominion lens can point to where their ground ends. A tester who casts the same card on two towns can say why it cost a different number of pips (from the chip or the cast bar).

### Event notifications

None new. The badge mirrors the core's chronicle lines, which already coalesce one line a day (core § Content). No toast, no interrupt (THR-1763, Law 49).

### Debug inspection (DebugPanel)

Declared in `src/debug-bridge.d.ts`:
- `window.__DEBUG.setDominionLens(on: boolean)` and `getDominionLens()` → `Promise<{ on: boolean; byBand: Record<DominionBand, number>; frontierEdges: number; hostileEdges: number; drops: number }>`.
- `window.__DEBUG.getDominionHex(col, row)` → `Promise<{ band: DominionBand; placeId: string | null; frontier: boolean } | null>`.
- `snapshotScene().layersActive` lists `'dominion_lens'` while on.
- DebugPanel: the core's *Dominion* row gains "lens: on/off, n frontier edges".

### Visual presence (HexMapV2)

U1 and U4. Layer order: `DOMINION_DIM` 8.95, `DOMINION_GLOW` 8.96, `DOMINION_FRONTIER` 9.2, `DOMINION_DROP_BADGE` 10.95, each with a matching `LAYER_Z` value kept monotonic (`RenderLayers.ts` contract).

### UI Laws engaged

Law 1 (image, tooltip and link on every concept), 10 (gold frontier ≠ red doom/realm ink; THR-1831 reserved gold for it), 13 (band words and pip glyphs, never the match number), 14 (no raw keys; place ids never shown), 17 (one registry, `ui.dominion.*`), 21 (place names in the hex line route), 31 (red = Hostile/dearer; gold = the god's ground), 33 (switch, legend and boxes inside 1920×1080; the legend card's height is capped), 37 (N/A: no multi-beat flow; stated for the checklist), 49 (no new notification stream), 56 (no chip on Foreign; the badge only after a written band drop).

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `engine/dominionProjection.ts` | none (runtime cache, after tick) | HexMapV2 lens meshes | none (runtime-owned) | `dominion.lens_rebuilt` | `getDominionLens`, `getDominionHex` |
| `engine/dominionViewModels.ts` | none (render-time selector) | `DominionBox`, `MapLensSwitch` legend, `HexTooltip` | none | none (pure read) | via the VMs above |
| `WheelSlot.dominion` (`targetActions.ts`) | none (player-facing preview) | `ActionCard` → `CardFace`, `ActionDrawer` cast bar | none | the core's `dominion.read` with `consumer: 'cost'` | `getDominion` (core) |
| `DOMINION_PRICES_LIVE` flip | cost + resolution (core) | card pips, forecast words | none | core traces | core debug row |
| `MapLensSwitch` + key `1` | n/a | `GameView` → `HexMapV2` prop `dominionLens` | React state in `GameView` | none | `setDominionLens` |

- **Checklist:** see `Docs/plans/wiring-checklist.md`. The executor checks the four new modules against it at closeout.
- **Prose pipeline:** no `enrichProse`. Name slots only, filled from node names.
- **New-module check:** `dominionProjection.ts` has one production reader (`simulationRuntime.ts` → `GameView`), and `dominionViewModels.ts` has four (the sheets, legend, tooltip and lens). Neither is an orphan.

## Interface impact

| Contract | Change | Where |
|---|---|---|
| Dominion band → hex map | **add** (core said "THR-1750's") | `dominionProjection.ts` → `HexMapV2` |
| Dominion band → card cost preview + cast bar | **add** (`WheelSlot.dominion`) | `targetActions.ts` → `actionCardModel.ts` → `CardFace` / `ActionDrawer` |
| Dominion band → sheets | **add** | `dominionViewModels.ts` → four sheets |
| Card cost / odds read the band | **extend** (flag flip; the core added the contract) | `dominion-content.ts` |
| Realm projection → border mesh | **preserve** (`BorderMesh` exports two helpers; `createBorderMesh` unchanged) | `BorderMesh.ts` |

The executor updates `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` for every **add** row.

## Constants table

All in `src/data/dominion-ui-content.ts` unless noted.

| Constant | Default | Purpose |
|---|---|---|
| `DOMINION_HEX_TIE_PRIORITY` | `['sovereign','hostile','held','touched','foreign']` | Which band a hex shows when two places are equally near: the strongest lean, threats before mild ground |
| `DOMINION_LEGEND_ORDER` | `['sovereign','held','touched','foreign','hostile']` | Legend chip order, best to worst |
| `DOMINION_HEX_FILL_RADIUS` | 2 | How far a town lends its band to open land (measured: 99.4% of land within 2) |
| `DOMINION_LENS_REFRESH_TICKS` | 6 | Band recompute cadence while the lens is on (half a day) |
| `DOMINION_DIM_TOUCHED` | 0.15 | Dim alpha on Touched ground |
| `DOMINION_DIM_FOREIGN` | 0.45 | Dim alpha on Foreign ground |
| `DOMINION_DIM_HOSTILE` | 0.60 | Dim alpha on Hostile ground |
| `DOMINION_HATCH_ALPHA` | 0.12 | Hostile hatch strength |
| `DOMINION_HATCH_SPACING_PX` | 6 | Hostile hatch spacing in screen pixels |
| `DOMINION_GLOW_ALPHA` | 0.22 | Sovereign glow strength |
| `DOMINION_FRONTIER_WIDTH` | 2.0 | Frontier line width in px at the regional zoom |
| `DOMINION_FRONTIER_HOSTILE_WIDTH_MULT` | 1.75 | Thicker line where turf meets Hostile |
| `DOMINION_DROP_BADGE_TICKS` | 36 | How long a band-drop badge stays (three days) |
| `DOMINION_LEGEND_MAX_HEIGHT_PX` | 180 | Cap on the legend card (Law 33) |
| `MAP_LENSES` (`src/data/map-lenses.ts`) | one row | The lens registry THR-1830 extends |
| `RENDER_ORDER.DOMINION_DIM / _GLOW / _FRONTIER / _DROP_BADGE` (`RenderLayers.ts`) | 8.95 / 8.96 / 9.2 / 10.95 | Layer order; matching `LAYER_Z` |
| `DOMINION_PRICES_LIVE` (`dominion-content.ts`, core) | false → **true** | Prices and odds read the band (core § Decided 13) |

The tuning starting points come from the THR-1766 mock (variant C). They are named so the playtest can tune them.

## Tracing

```ts
// DominionLensRebuiltTrace — emitted when the lens projection rebuilds
interface DominionLensRebuiltTrace {
  type: 'dominion.lens_rebuilt';
  reason: 'structure' | 'refresh' | 'band_change' | 'lens_opened' | 'error';  // 'error' = build threw; previous projection kept
  places: number;            // places read
  byBand: Record<DominionBand, number>;  // land hexes per band
  frontierEdges: number;
  terrainFallbackHexes: number;
}
```

No other new trace. The cost path's `dominion.read` (core) already carries `consumer: 'cost'` and the band.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| THR-1748's `dominionOf` missing or throws for an object | Sheet: `DominionBox` renders nothing. Hex: Foreign. Slot: no `dominion` field (no chip, par price). A `console.warn` once per session, never a throw. |
| No ascendant (`ascendantId` null) | The lens switch is hidden, the VMs return `null`, slots carry no band |
| A place with no `hexCol` / `hexRow` | Skipped in the assignment |
| A hex with no place in reach | `dominionBandOfHex`; if that also fails, Foreign |
| An empty name slot in a tend line | "Tended by one of yours." (never a raw `{name}`) |
| A band-drop trace for a place no longer on the map | No badge |
| WebGL context lost while the lens is on | The lens meshes rebuild with the scene like every other layer; the switch keeps its state |
| `parCost` equal to `cost` (cost floor, free card) | No chip (Law 56) |
| The projection build throws | Keep the previous projection; trace `dominion.lens_rebuilt` with `reason: 'error'` and zero counts; the tick loop is untouched (the build runs after the tick) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/engine/wheel.ts` (`WheelSlot`) | 15 files (9 non-test), measured by grep this run | One **optional** field; every reader ignores it |
| `src/components/HexMapV2/HexMapV2.tsx` | 5 | One optional prop (`dominionLens`), three meshes added in the scene-build effect |
| `src/components/shared/CardFace.tsx` | 9 (3 render it) | One optional model field; `NudgePhaseShell` and `StyleGuide` never set it |
| `src/components/shared/OddsPips.tsx` (`CostPips`) | shared | Two optional props; default render unchanged |
| `src/components/Game/GameView.tsx` | 6,700 lines, 1 importer | Lens state, key handling and prop wiring only. This is the file the THR-1823 split will cut, so keep the additions in one block |

None of these files has ≥100 importers, and the wide-blast files on the codesight list (`graph.ts`, `gameState.ts`, `unifiedAction.ts`, `traceBuffer.ts`) are untouched. The section is kept because the card face and the cast path are shared surfaces.

## Deferrals

None. Three tabs (Borders, Threads, Terrain-as-a-lens) are **not** deferred work. They belong to [Lenses on the map](https://linear.app/threadbare/issue/THR-1830), an open decision ticket that already owns them. No `// TODO` is owed.

## Three-pillar check

- [x] Engine pillar present (projection, VMs, slot field, flag flip)
- [x] Content pillar present (words, tooltips, constants)
- [x] UI pillar present (lens, switch, legend, tooltip line, badge, four sheets, chip, cast bar)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. *Prose carries mechanics; numbers never reach the player*: the lens is lightness and one gold line, with band words on hover, and no number anywhere. *A chapter, not a spreadsheet*: the core plan's Vision audit names the 4X-board risk and makes it this ticket's kill signal (§ Kill criteria).
- [x] Sphere-tinted cards are kept; the chip adds to the face and strips nothing.

## Rulebook impact

- [ ] This plan does not change a rule of play: **not ticked**. It makes live a rule the core already wrote as DESIGN (card cost and cast odds read the band).
- [x] The rulebook is updated in the same PR. The core plan's rulebook text tags the cost and odds clause *"DESIGN until THR-1750 turns on `DOMINION_PRICES_LIVE`; that PR flips the tag"*. **This PR flips that tag to IMPL** in `Docs/canon/rulebook.md` (and the quick reference if it carries the tag). No rule text changes.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every alpha, width, radius, cadence and duration is named in § Constants |
| 2. Inspectability | PASS | `dominion.lens_rebuilt` trace; `getDominionLens`, `getDominionHex`, `setDominionLens`; the hex projection records which place lent each band |
| 3. Determinism | PASS | No randomness; ties by `DOMINION_HEX_TIE_PRIORITY`, then place id |
| 4. Fail-soft | PASS | Nine rows; missing data → nothing rendered, Foreign or par, never a throw; the build runs outside the tick loop |
| 5. Narrative over mechanical perfection | PASS | Words and light, not numbers; the tend line tells the story of the ground |
| 6. Additive over destructive | PASS with note | Optional fields and new files only; `BorderMesh` gains exports. One value changes: `DOMINION_PRICES_LIVE` false → true, as the core planned |
| 7. Performance budget | PASS | ≤ 238 band reads every 6 ticks while the lens is on; the assignment (711 hexes × 238 places) is rebuilt on structure only; one instanced draw each for dim and glow, one merged geometry for the frontier |

## Done when

- [ ] For one place that is the only top-level place on its hex (if two share a hex, the tie rule decides), the band in `await window.__DEBUG.getDominion(placeId)`, `await window.__DEBUG.getDominionHex(col,row)` on its own hex, and the place box agree. For a mortal standing there, her sheet row agrees with `getDominion(mortalId)`. She reads her own scores (THR-1764), so she may differ from the town, and the ticket's "agree" is checked per object (browser assertion).
- [ ] `setDominionLens(true)` then `false`: `snapshotScene().layersActive` gains and loses `'dominion_lens'` and no other layer changes (the THR-1750 ticket's "toggling changes only the overlay").
- [ ] The same card read on a Sovereign place and on a Hostile place shows different pips and chips. The slot's `essenceCost` equals the essence the cast charges (unit test on `getTargetActionSlots` + `playerCastDispatch`).
- [ ] On Foreign ground, and on a free card, no chip renders (unit test).
- [ ] `DOMINION_PRICES_LIVE` is `true`, and the rulebook tag is IMPL.
- [ ] Projection unit tests: the assignment on a fixture where the radius and the tie rule decide; water carries no band; frontier edges skip water and the rim; terrain fallback past the radius; determinism (two builds equal).
- [ ] Four-part browser evidence at 1920×1080 on `?view=game&seeded&size=medium`: a Claude-in-Chrome screenshot with the lens on, plus a Playwright screenshot of the place box, card chip and cast bar; console output clean; the `__DEBUG` assertions above; a UI-Laws line (Laws 1, 13/14, 17, 21, 33, 37). Nothing renders below the fold.
- [ ] `npm run gate` green; `npm test`, `npm run check:typecheck`, `npx vite build`; interface-map and interface-contracts rows added; the Design Reference Wiki page whose `sources` match updated.

## Kill criteria

- **The lens reads as a 4X board.** If the first cold or warm playtest after this ships has a tester describe the lens as tiles to paint rather than ground to tend, file it here. The first lever is `DOMINION_DIM_*` (less contrast), not a rollback.
- **The band is invisible in play.** If no tester can say why one place cost more pips than another, the chip or the cast bar failed (core plan § Kill criteria, routed here).

## Coordination block

**Suggested model:** opus. It covers one WebGL lens of three meshes, four DOM sheets, a card-face change and a live-prices flip that touches the cast path.

**Blocked by:** [Dominion core](https://linear.app/threadbare/issue/THR-1748). It provides `dominionOf`, `dominionBandOfHex`, `isTended`, `dominion-content.ts`, `getDominion`, `dominionScaledEssenceCost` and the `DOMINION_PRICES_LIVE` flag. It is In Dev now, and this ticket must not start before it merges.

**Parallel-safe with:** [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811) design; [The god's screen fills one gift at a time](https://linear.app/threadbare/issue/THR-1837). The reveal stages top-bar and rail panels and leaves the map unstaged; this plan touches the map, the sheets and the card face. They share `GameView.tsx`, in different blocks.

**Mutex with:** anything editing `CardFace.tsx` / `CostPips`, `targetActions.ts` `getTargetActionSlots`, `ActionDrawer.tsx`'s cast-bar footer, `HexMapV2.tsx`'s scene-build effect or `RenderLayers.ts`. That includes [Lenses on the map](https://linear.app/threadbare/issue/THR-1830)'s build, which must land after this and extend `MAP_LENSES`.

**Files to touch:**
- Create:
  - engine: `src/engine/dominionProjection.ts`, `src/engine/dominionViewModels.ts`
  - data: `src/data/dominion-ui-content.ts`, `src/data/map-lenses.ts`
  - HexMapV2 scene: `src/components/HexMapV2/scene/DominionDimMesh.ts`, `DominionGlowMesh.ts`, `DominionFrontierMesh.ts`, `DominionDropBadge.ts`
  - components: `src/components/HexMapV2/chrome/MapLensSwitch.tsx`, `src/components/shared/DominionBox.tsx`
  - tests beside each
- Edit:
  - `src/engine/simulationRuntime.ts`: `ensureDominionProjection`
  - `src/engine/wheel.ts`: `WheelSlot.dominion?`
  - `src/engine/targetActions.ts`: the slot field
  - `src/data/dominion-content.ts`: the flag flip
  - `src/data/ui-content.ts`: `ui.dominion.*`
  - `src/components/HexMapV2/HexMapV2.tsx`: prop and meshes
  - `src/components/HexMapV2/scene/RenderLayers.ts`: four orders and their z values
  - `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts`: `'dominion_lens'`
  - `src/components/HexMapV2/scene/BorderMesh.ts`: export two helpers
  - `src/components/HexMapV2/interaction/HexTooltip.tsx`: band line
  - `src/components/Game/GameView.tsx`: lens state, prop, sheet VMs
  - `src/components/Game/hooks/useTopBarHotkeys.ts`: key `1`
  - `src/components/Game/LocationView.tsx`, `AgentProfileModal.tsx`, `FactionSheet.tsx`, `ArtifactSheet.tsx`
  - `src/components/Game/actionCardModel.ts`
  - `src/components/shared/CardFace.tsx`, `src/components/shared/OddsPips.tsx`
  - `src/components/Game/ActionDrawer.tsx`
  - `src/debug-bridge.d.ts` + bridge implementation, DebugPanel row
  - docs: `Docs/canon/rulebook.md` (tag flip), `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- **Do not start before THR-1748 merges.** Every read here is its export. If a name differs from the core plan (e.g. `dominionScaledEssenceCost`), follow the merged code and note it in the PR.
- **Use `getPlaceNodes` for the assignment**, never `getNodesByType('location')`, which returns sublocations too (CLAUDE.md load-bearing decision).
- **Do not build Borders, Threads or Terrain tabs.** They are THR-1830's. One registry row, one button.
- **Do not tint the turf** in the sphere colour. THR-1766 measured why: Life green erases the lowlands. The only hue in the lens is the Sovereign glow.
- **The ticket body's "focused card" is gone** (THR-1002). The chip goes on `CardFace` after `CostPips`.
- **Verify WebGL with Claude-in-Chrome or the Playwright debug path**: plain Playwright snapshots cannot see the lens.
- **The hex projection is not an engine write.** Never store a band on a tile or a node.

## Intent-judge verdict

- **Round 1: Revise** (dimension 12 GAP, dimension 4 GAP). (a) The cast-bar row listed PC-2 but quoted no after-roll line. (b) There was no rendered Hostile sheet sample. (c) `DOMINION_BAND_ORDER` was used but never defined. (d) The trace reason had no failure value.
- **Fixes:**
  - PC-2 dropped from the cast-bar row, with the reason stated (no stakes or result line is added; the forecast word reads the roll's value).
  - Hostile box sample added.
  - The tie rule became an explicit `DOMINION_HEX_TIE_PRIORITY` (the old "distance from Foreign" made Hostile and Touched tie).
  - `reason: 'error'` added; the trace renamed to the core's dotted `dominion.lens_rebuilt`.
- **Round 2: Allow.** All four findings resolved. Two wording nits ("band distance" left in two places; "same words" on the cast bar) were fixed before commit. UL note for [Lenses on the map](https://linear.app/threadbare/issue/THR-1830): `src/engine/ascendantLens.ts` already uses "lens" for the god's narrative identity, so if THR-1830 makes "lens" a UL term it must resolve that clash.

## Forked-audit verdicts

### NFP audit

**NFP AUDIT: PASS-with-notes.** Tunability PASS: every alpha, width, radius, cadence and duration is named, plus `DOMINION_HEX_TIE_PRIORITY`. Inspectability PASS: the `dominion.lens_rebuilt` trace carries a reason and counts, the debug bridge gains three accessors, `hexPlaceId` records which place lent each band, and the price path reuses the core's `dominion.read`. Determinism PASS: no randomness, the priority-tuple and place-id tiebreak, and a two-builds-equal test. Fail-soft PASS: nine rows, and the build runs outside the tick loop and keeps the previous projection on error. Narrative PASS: band words and light only. Additive PASS-with-note: `DOMINION_PRICES_LIVE` false → true changes live prices and odds game-wide, as the core planned, bundled with the chip. Performance PASS-with-note: ≤ 238 reads every 6 ticks, and the assignment is rebuilt only on a structure bump. Note: how often `structuralCacheVersion` bumps in play is not measured.

*Author response:* the structure-bump note is addressed by the realm projection already rebuilding on the same signal on every session. The Done-when's `dominion.lens_rebuilt` trace counts make the real rate visible, so it can be measured at build time.

### Three-pillar audit

**PILLAR AUDIT: PASS.** Engine, Content and UI are all present and substantive. No required section is missing. The Wiring table links each module to its phase, component, GameState field, trace and debug surface. Substrate check: the inventory section is present and labels every row extends or pattern copied, with a population count. Nothing duplicates an inventory subsystem; `ascendantLens.ts` is unrelated.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. Premises confirmed: god/protagonist separation; mechanics through prose, never numbers; prose-first UI. Extended: the north star's "any of them will cost" (the cost is legible before the spend); design tension #4, mechanical legibility. Notes:
- Tension #4's drift signal ("players talking about optimal strategy"): a frontier map plus a "cheaper here" chip leans toward optimisation play. The plan names this in its kill criteria.
- Taste profile "one gold emphasis per panel": gold appeared in several places.

*Author response:* the switch's pressed state moved from gold to `--text-primary`. The sheet border and the mortal label reuse existing styles, so the frontier line is the one new gold emphasis on the map. The optimisation lean is the 4X kill criterion, routed to the first playtest after ship.
