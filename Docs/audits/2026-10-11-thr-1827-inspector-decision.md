> **Decision record for THR-1827** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Attended design session 2026-10-11. **Christian ruled "yes" in chat to all 18 calls below** (human gate satisfied via chat review 2026-10-11), after three passes on one mock. He also said, mid-session: "we can build the gating functionality later."
>
> Mock (three passes, real content from `?view=game&seeded&size=medium`): <https://claude.ai/artifact/LGQ9NxzMQfG8tXoaNUxphQ>

# THR-1827 — the Inspector

## What he asked for, in his words

1. The first pass covered one docked panel for every place, person and power.
2. Then: "it makes sense on the surface to make one inspector to rule them all, i like that." He also asked three questions:
   - How do links between objects work? "i start in a city, i move to its sublocation the temple, i move to the priest, i move to his faction. i want to be able to navigate all information that is 'unlocked' for the player like that."
   - When should the Inspector "take over the entire screen to allow for better navigation and easier parsing of info"?
   - How do the god's cards integrate, "so i can play cards on different objects in the inspector"?
3. Then: "the hexview should give an overview over the land area and describe it while also pointing out whats in it, so you can continue to navigate to those things (like a city in it or a monster lair)."

## Measured before deciding

### Detail surfaces today

There are four containers:
- the 280 px detail column (`ThreadDetailView` / `HexDetailView`, `GameView.tsx` ~5832-5890, width `clamp(240px, 280px, 30vw)`);
- centred `Modal` sheets (LocationProfileModal 600, FactionSheet / ArmySheet / ArtifactSheet 600, AgentProfileModal 960, AttachmentDetailView 720, AscendantSheet 960);
- the stacked `DetailModal` cards (70 + 2·depth);
- whole-view swaps: the `location` view level (`LocationView`, 1,763 lines) and `hex-zoom` (`HexBreadcrumb` + `HexSidebar` + `HexChronicle`).

`useRefRouter`'s `sheet` arm is not one behaviour:
- **agent:** selects the agent and opens the drawer, not the profile;
- **location:** swaps the whole view to `LocationView`;
- **hex:** moves the camera only;
- **faction / army / artifact:** goes through `setStubModalState`.

LocationProfileModal is unreachable from the router. The `DetailModal` footer's "open her sheet ↗" has no `onClick` (`DetailModal.tsx:193-207`).

### The chain city → temple → priest → faction, walked live

| Step | Entity | Edge |
|---|---|---|
| City | The Bone Coast (`loc_7`) | — |
| Place within | Temple Quarter (`loc_7_sub_temple-quarter_3`) | `contains` from the city |
| People there | Shutash (`npc_98`, `npcRole: priest`), Nutat (`npc_97`, healer) | `located_at` the Temple Quarter |
| Faction | The Stone-Set Hollow of the Pass Congregation of the Spheres (`faction_def_temple_of_spheres_2`) | `member_of` from both |

The faction:
- reveres Entropy and has 15 members;
- has its seat at The Shattered Sanctum (`controls`) and halls at Crag Cathedral and The Bone Coast;
- `relates_to` four factions;
- has no `leads` edge.

Today the chain breaks in four places:
1. `LocationView` prose calls Shutash a "wanderer".
2. Agents inside a place card call `handleAgentSelect`, which opens no page.
3. The actor card lists the faction as plain text with a raw rank, "0.16" (Law 13).
4. At `stranger` tier the profile hides the faction section. FactionSheet's member and location lists and its relations are plain text; only the SVG diagram links.

### Knowledge (gating deferred)

Knowledge is scattered:
- `familiarityMap` covers persons only, and its tiers are read in at least 8 places with local copies;
- `visibilityMap` holds fog;
- `hexRevelation` holds per-hex layers;
- Places carry a `hidden` flag.

No router or sheet path checks knowledge before opening. Separately, `BondsTab` reads `revealedBonds` by name, but `revealBond` writes it by id, so that facet path never matches.

### Cards

- **One target per card.** `UnifiedAction.targetId` is a single field; no two-target card exists.
- **Target categories:** `TargetCategory` = actor | location | sublocation | hex | artifact | artifact_legendary. A faction is an actor with a subtype. There is no army category.
- **Range** is a flat 3 hexes from the avatar.
- **Unreachable cards.** `buildSublocationTargetContext` and `buildArtifactTargetContext` have no callers, so sublocation and artifact cards (including `action.imbue`, granted by spine Beat 2) have no cast surface.
- **No card-first surface.** The AscendantBar Self/Rare rows render without `onFire`.
- **The principle** "Verbs that touch the world appear on the thing they touch" lives only as UI copy (`ActionsBlock.tsx:222`). The canon equivalents are `rulebook.md:113` and the Generalized Action Targeting design (2026-03-17), Decision 3.

### Hexes

A hex has no graph node:
- `HexTile` holds terrain, geo, danger, river and region;
- places sit on it via `hexCol` / `hexRow`;
- worldgen allows one settlement per hex, while lairs and ruins may share a hex.

The two hex surfaces disagree:
- `HexDetailView` scans the graph itself, while hex-zoom uses `useHexZoomData`, so the two count "who is here" by different rules;
- `HexChronicle` already writes The Land / Places / People / Soul / Ruins prose;
- GameView does not pass `hexRevelation` or `onReleaseEffect`, so "Discovered sites" and Release never render.

Other hex findings:
- A hex has no card page (`generateDetailPage` returns `unknownStub`).
- `HexZoomView`, `HexFlavorPanel` and `HexPoiPanel` are unmounted.
- The plateau hero art is green hills (`/concept-art/hills.png`), and the lair card shows `camp.png`.

## The decision (calls 1–18)

### Scope, router, sizes

1. **Actions under the name.** The cards for the subject sit right under its name, before the facts.
2. **Fixed widths, no drag handle.**
   - Docked ≈ 28vw: 560 px at 1920, 717 px at 2560.
   - Wide ≈ 50vw: 960 / 1280 px.
3. **The trail is history** (back/forward, Alt+←/→). Containment lives in a separate "where" line under the name.
4. **Pin** stops map clicks from replacing the subject. While a card is armed, map clicks choose a target instead.
5. **The god's own sheet opens in the Inspector.** Doom, Mandate and Omen stay dialogs; THR-1828 decides their shape.
6. **The Ledger rail folds** while the Inspector is open.
7. **The `location` and `hex-zoom` view levels retire.** Their content becomes place and hex pages.

Also part of the scope decision:
- **What opens in the Inspector:** every `WorldRefKind`, plus content refs as a short card with "Read in the Codex".
- **What keeps its own home:** the live encounter (Stage, THR-1829), the Codex, the Doom/Mandate/Omen dialogs, the Chapter Ledger, Settings, and the Notables list (its names route into the Inspector).
- **Router modes:** `card` opens docked and `sheet` opens wide; `hover` stays HoverCard. The `DetailModal` stack retires into Inspector history (push/pop/popTo plus forward).
- **Nothing open, no panel.**
- **Escape order:** armed card → top dialog → full → wide → docked → closed (escape layer `ESCAPE_LAYER_Z_PANEL`).
- **Focus** moves to the heading on open and returns to the invoker on close (Law 50, non-modal).

### Links

8. **Connections block.** Every page ends in Connections, in one fixed order: where · who · belongs to · friends and foes · holds/knows · story. A row is a link, one plain fact, a card count, and the eye (Law 22).
9. **Sort, then fold.** Big groups are sorted, then folded: people by role, places by occupancy. Wide and full open every group (THR-1820's no-truncation rule).

### Full view

10. **Full view is a third size you ask for.** The widen button or `W` cycles docked → wide → full; Esc steps back. It never opens on its own, and a pause-tier interrupt closes it (the Stage plays over the map).
11. **Time pauses in full view.** The top bar and god rail stay visible.
12. **Factions, cultures and past events open wide.**

Full layout at 2560: a trail column (300 px), the page (two columns), and a Connections column (440 px) with a locator map.

### Cards

13. **Card count on rows.** Rows the god can act on carry a card count that opens an inline tray of those cards (target-first, extended to every row).
14. **The hand lives in the god rail (card-first).**
    - Arming a card lights its valid targets on the map and in the Inspector, and dims the rest.
    - Navigation stays live while a card is armed.
    - The cast is armed → "Cast here" (Law 48).
    - Drag is a shortcut; click always works.
    - Out-of-reach targets are lit-but-locked with the reason in words.
    - The floating ActionDrawer retires.
    - Every kind gets an "Act on …" row, including sublocations and artifacts.

### The land page (hex)

15. **What a click opens.** A map click on open land opens the land page. Agents and armies open themselves. Place-name labels become clickable and open the place.
16. **Page order.** Name plus a one-line lede → **In this land** (an index of the hex's contents, each a link with a card count) → Act on this land → description (the existing HexChronicle prose: The land / Its soul / What came before) → Around it.
17. **What "In this land" always shows.** People and Holder always show, even when empty ("No one lives here"). Lair, ruins, halls, resources and the god's covenants show only when present.
18. **Naming a hex.** A hex is named by its terrain plus its most notable place ("The plateau at Oreblack Deep"), or by its region when nothing stands there.

## Retires

- the 280 px detail column (`ThreadDetailView`, `HexDetailView`)
- `LocationProfileModal`, `AgentProfileModal`, and the `FactionSheet` / `ArmySheet` / `ArtifactSheet` / `AscendantSheet` modals
- the `AttachmentDetailView` modal and its overlay
- `DetailModal` for world refs
- the `location` and `hex-zoom` view levels (`LocationView`, `HexBreadcrumb`, `HexSidebar`, `HexChronicle` as a view)
- the ActionDrawer subject hand
- `LiveLocationBar` (its job moves to the Threads/Trouble lenses and the needs-you queue)
- the unmounted `HexZoomView`, `HexFlavorPanel` and `HexPoiPanel`

## Deferred

- **Knowledge gating** (Christian, 2026-10-11). The seam: Connections, "In this land" and Find anything are built from one view-model source (THR-1822), so a "what does the god know" filter applies there once. Recorded on the map under *Not yet specified*.
- **Codex placement.** Recommended, not decided: Full view hosts the Codex as one book of world pages plus lore and card pages.

## Feeds

| Ticket | What it takes from this decision |
|---|---|
| THR-1832 (Find anything) | Now unblocked; results open in the Inspector |
| THR-1828 (frame) | The hand in the god rail, the Ledger fold, the top-bar dialogs |
| THR-1830 (lenses) | Clicking a lit hex opens the land page |
| THR-1829 (Stage) | A pause-tier interrupt closes Full |
| THR-1819 | `--inspector-w` plus wide and full tokens |
| THR-1820 | The tiers |
| THR-1821 | Tabs, Chip, Panel |
| THR-1822 | Subject view models and one Connections builder |

## Would change the call

- **The hand in the god rail crowds the rail at 1080p.** Then the hand becomes a strip along the bottom of the map canvas, and the arming behaviour stays the same.
- **Pausing in Full annoys in play.** Then it becomes a player setting, default on.
