# Action proposal — Dominion on the map and on every sheet (THR-1750)

Plan doc: `Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md`

## intent_quote

Christian's ticket body (THR-1750, filed 2026-10-05):

> The UI pillar of the Dominion loop (THR-1745, Christian 2026-10-05): dominion is home turf you expand strategically and tactically, so the player must read it.

> **Map (HexMapV2, Claude-in-Chrome for WebGL evidence).** A dominion overlay layer, sphere-tinted, graded by band, toggleable from the existing layer controls; the frontier where Held meets Hostile is the legible edge.

> **Sheets (DOM, Playwright).** The band word on the location page, the mortal sheet, the faction page and the artifact page, with its one-line prose; the ActionDrawer focused card shows the band beside its cost so "cheaper here" is visible before the spend (Law 13: a word, never a number).

> **Essence bar.** Net income per sphere in words (rising / steady / draining)

Christian's coordination note on THR-1750, 2026-10-11:

> **This ticket's Dominion overlay is lens one** and sets the grammar the other lenses follow (dim what is not in focus, never a sphere-colour wash). Please author the overlay so it can be switched as a lens (on/off, keyed, legend) rather than as an always-on layer; the lens-system ticket THR-1830 hosts it and will not build a second Dominion overlay.

Christian's closing comment on the Dominion map (THR-1758), 2026-10-11:

> | 2 | **Dominion on the map and sheets** — THR-1750 | THR-1766 (overlay C, layer control, band box and row, card chip, the five band lines) | After 1 |

## scope (what this plan does)

Specifies the build of the Dominion lens on HexMapV2: overlay C (dim what is not yours, a gold frontier line thicker against Hostile, a Sovereign glow), a per-hex band projection from the nearest town, a one-row lens registry with a switch, key `1` and a legend, a hex-tooltip band line, and a band-drop badge. It adds the band box on the place, faction and artifact pages and the band row on the mortal sheet; the card chip with ghost and red pips, fed by a band field on the action slot; and the cast-bar clause. It flips `DOMINION_PRICES_LIVE` so prices and odds read the band, flips the rulebook tag to IMPL, and adds debug accessors.

## scope (what this plan does NOT do — explicit non-goals)

- No Borders / Threads / Terrain lens tabs. Those belong to THR-1830, which owns how lenses switch and combine. THR-1766's four-tab control is deliberately reduced to one registry row.
- No sphere-colour tint on the turf. The ticket body's "sphere-tinted" was superseded by THR-1766 (a wash fails on the terrain palette), and Christian's coordination note says "never a sphere-colour wash". Hue appears only in the Sovereign glow.
- No new essence-bar surface. The trend words (Rising / Steady / Ebbing) already ship (THR-1766 decision 7); the ticket's "draining" is superseded.
- No "focused card". It was retired by THR-1002; the chip goes on the one card face.
- No engine writer, phase, node, edge or stored per-hex value. Every read goes through THR-1748's `dominionOf`.
- No direction-of-pressure line (no stored datum); a tend line instead.
- No change to the post-bond reveal (THR-1837) or the screen frame (THR-1828).

## impact_class

Reversible. New files, optional fields and one flag flip (`DOMINION_PRICES_LIVE`) that the core plan designed for exactly this PR and that can be flipped back.

## evidence cited

- **Linear issue:** THR-1750 (map THR-1758, closed; also lens one of map THR-1823)
- **Vision premises invoked:** prose carries mechanics / numbers never reach the player; a chapter, not a spreadsheet; sphere-tinted cards stay (`game-design-direction`)
- **UL terms touched:** Dominion, Dominion Band (seated by THR-1746, `Docs/ubiquitous-language/Cosmology.md`). No new term: "lens" and "frontier" are used descriptively. If THR-1830 makes "lens" a term, that ticket proposes it.
- **Canon pages consulted:** `Docs/canon/hex-map.md`, `Docs/design-system/laws.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-11-thr-1748-dominion-core.md`; audits `Docs/audits/2026-10-11-thr-1766-dominion-screens-prototype.md`, `Docs/audits/2026-10-11-thr-1831-map-chrome-decision.md`; THR-1824 resolution comment
- **Rejected approaches considered and dismissed:** sphere wash (THR-1766 A), outlines (THR-1766 B), terrain-only hex band, radius 1 and 3, a distance-weighted match blend, four tabs now, a settings toggle, the target id into CardFace

## load-bearing decisions touched

- **No inventing node types**: hexes stay non-nodes; the projection is a runtime cache (realmProjection pattern).
- **The sublocation tier is `type: 'location'` with `parentLocationId`**: the assignment uses `getPlaceNodes`, never a bare `getNodesByType('location')`.
- **Engine caches are owned per session**: `ensureDominionProjection` lives on `SimulationRuntime`.
- **The world graph is mutated in place**: the assignment invalidates on `structuralCacheVersion`, not graph identity.
- **Rejected: React Three Fiber**: the lens meshes are raw Three.js in the existing scene-build effect.

## high-impact files touched (from Codesight)

None with ≥100 importers. The widest is `src/engine/wheel.ts` (15 importing files by grep). It keeps a Blast Radius section for the shared card face and cast path.

## kill criteria

- A playtest tester describes the lens as tiles to paint rather than ground to tend. The first lever is the dim constants, not a rollback.
- No tester can say why one place cost more pips than another. The chip or cast bar failed and gets refiled here.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- **The one deliberate departure from a decided input** is THR-1766's four-tab layer control, cut to one registry row. Reason: Christian's later note (same day) hands the lens system to THR-1830, and building three more tabs would decide that open ticket. Offered as a veto line.
- **Hex band rule**: the nearest town within 2 is decided here with a measurement (CLI, seeds 42 and 99). This is the main new decision, and the core plan does not cover it (it offers only the terrain read).
- **The second sheet line** departs from THR-1766's mock wording (pressure direction), because nothing stores direction. Stated in the plan.
- **Uncertainty**: whether a mortal standing in a town shares that town's band. She reads her own scores (THR-1764), so she may differ. The Done-when asserts each object against `getDominion` rather than requiring the three to be equal, which corrects the ticket's "agree" predicate.
- THR-1748 is In Dev; the names of its exports are taken from its plan doc, and the Notes for the executor say to follow the merged code if they differ.
