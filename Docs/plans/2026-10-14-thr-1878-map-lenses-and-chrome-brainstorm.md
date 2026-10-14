# Brainstorm companion — map lenses and map chrome (THR-1878)

Companion to [`2026-10-14-thr-1878-map-lenses-and-chrome.md`](2026-10-14-thr-1878-map-lenses-and-chrome.md). Design session, 2026-10-14, run as one of five parallel sub-sessions of an attended session (Christian asked in chat for the five map carve-up plan docs to be written now; the decisions they build on are settled input). No grill-me pass: every creative question had already been answered by the THR-1823 map's decision records (THR-1830, THR-1831, THR-1833, THR-1834), and the open questions were technical *how* under agreed outcomes (process.md rule 4).

## Vision premises engaged

- **One story front-of-stage** (`TheFantasyWorldSimulator/Vision/01-core-loop.md`). The plain map today draws every overlay at once; THR-1808 recurs on "everything arrives at once". Lenses make the extra layers a question the player asks, one at a time, and step aside while a moment plays.
- **All mechanics surface through prose, never numbers** (`02-non-negotiables.md` § 3). Every lens mark is a shape with a legend word; every hover line is a sentence; prosperity, lair tier, unrest and the doom stage are words.
- **Mechanical legibility vs. narrative mystery** (`03-design-tensions.md` § 4). The lenses add legibility about *where* things are, never about odds. Fog and the seen floor keep the unseen unseen.

## Alternatives considered

### How a new lens gets onto the map

| Option | For | Against | Verdict |
|---|---|---|---|
| One layer component per lens (Dominion's pattern, repeated) | Each lens free to look different | Every lens is new code; Law 58 forbids "writing screens"; the THR-1830 grammar (one dim, one ink) would drift per lens | Rejected |
| **`MAP_LENSES` row + selector + `MAP_MARKERS` rows; one generic hex layer with a renderer per draw kind** | A new lens is data plus its selector; the grammar is enforced by construction; the coverage test catches a missing mark row | The generic layer must anticipate draw kinds (badge, ring, arrow, road, agent step) | **Chosen**; kill criterion 1 if a lens needs layer code |
| Rebuild Dominion on the generic layer too | One layer for all four | Forks a shipped, tested lens; THR-1750 and THR-1824 both say reuse, never fork | Rejected; `layer: 'dominion'` keeps it as built |

### Where trouble marks get their shape

| Option | Verdict |
|---|---|
| The mock's symbol glyphs (⬡ ✕ ◌ ◉ ▼ ✶ ☗) | Rejected — THR-1834 retires glyphs; the UI-debt ratchet counts them |
| **Carved icons from THR-1879's registry, rasterised by one map icon texture builder** | **Chosen** — the same builder draws the carved places, so the map has one icon path; the legend shows the same shape as the map |
| Coloured dots per kind | Rejected — colour alone fails Law 10 and the accessibility rule "shape first, colour second" |

### Battles and sieges in the Trouble lens

| Option | Verdict |
|---|---|
| A red badge on battle and siege hexes as well as the plain map's sprites | Rejected — two marks for one fact on one hex (PC-5) |
| Hide the plain sprites while Trouble is on and draw badges instead | Rejected — a lens never removes plain-map content; the player would lose the news view's look |
| **Light the hexes, add no badge, and switch the plain sprites to the carved shapes** | **Chosen** — one shape, and the legend matches the map |

### The map keys

THR-1831 (2026-10-11) bound `+`/`−` to zoom and WASD to pan. THR-1828 (2026-10-12) kept `+`/`=`/`-` for speed and gave `W` to widen.

| Option | Verdict |
|---|---|
| Rebind speed to other keys | Rejected — THR-1828 is the later decision and speed on `+`/`-` is shipped muscle memory |
| Zoom on numpad `+`/`-` only (by `event.code`) | Rejected — the speed hook reads `event.key`, so both would fire; laptops often lack a numpad |
| **Zoom on `PageUp`/`PageDown`, pan on arrows, no WASD** | **Chosen** — common in strategy games, collides with nothing; WASD without `W` would teach a broken pattern |
| `Q`/`E` zoom | Rejected — arbitrary next to arrow-key panning |

### Minimap default

| Option | Verdict |
|---|---|
| By screen tier (open at ≥ 2560, folded below) | Rejected — encodes the decision's "would change the call" (a wider 1080p canvas) as a later edit |
| **By the canvas width at first mount (≥ 1400 px opens it), then the player's choice** | **Chosen** — gives exactly THR-1831's two cases today (1740 px opens, 1260 px folds) and follows the canvas if the frame changes |
| Auto-fold when the Inspector docks | Rejected — a moving chrome element the player did not ask for (PC-4); 240 px still fits the 1387 px canvas |

### The minimap's renderer

| Option | Verdict |
|---|---|
| A second Three.js renderer | Rejected — a second WebGL context for a 240 px picture; Playwright cannot capture it |
| **A 2D canvas from a view model, the view rectangle in an SVG overlay** | **Chosen** — cheap, testable, capturable; camera moves redraw only the rectangle |

### The hover line's shape

| Option | Verdict |
|---|---|
| Keep THR-1822's `Record<HexKey, string>` | Rejected — names inside a string cannot route (Law 21) without parsing English |
| **Segments with optional refs** | **Chosen** — the producer declares its concepts (the frontend-ui rule); recorded as a refinement of THR-1822 D11 |

### The pressure clause

| Option | Verdict |
|---|---|
| Name the strongest non-god sphere at the place | Rejected — a sphere that is not opposed to the god is not pressing |
| **The god's held sphere whose opposite weighs most there (the Dominion match formula's opposition term), with a floor** | **Chosen** — the clause names what Dominion's own formula counts against the god, so the line and the band agree |

### Carved place texture size

128 px (today) blurs the finer carved silhouettes (village, medieval gate) at k = 20, where a full-class icon is about 160 px. 256 px costs about 15 MB of GPU memory for 49 types plus 9 lair tints, built once. Chosen 256, as a named constant.

## Tensions held

- **Dead code vs. additive changes.** NFP 6 prefers additive changes, but THR-1846 was filed precisely because a mesh had no caller. The plan deletes `HexPulseMesh` and `RivalInfluenceMesh` when their last caller moves, and keeps their producers.
- **Lens dims vs. the Stage and arming dims.** THR-1830 says two dims do not compose. The lens host owns one flag; the Stage and arming builds set it. This keeps each plan inside its own files.
- **Avatar size.** THR-1831's table names the threaded agents; the god's avatar is not one. The plan keeps the avatar's 82 px close-up rather than shrinking it to 64 without a decision.

## What would change these calls

- Christian vetoes the key move ("I want `+` and `-` to zoom") → speed moves to other keys in the frame build, and `MAP_COMMANDS` takes `+`/`-`.
- A playtest where testers miss a threat to their own things after rival marks leave the plain map → those marks return to the plain map (THR-1830's own trigger).
- The carved places fail the glance test at regional zoom in the map's ink → stop before the drawings are deleted and show Christian the capture.
