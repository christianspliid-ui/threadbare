# Brainstorm companion — Dominion on the map and on every sheet (THR-1750)

Companion to [`2026-10-12-thr-1750-dominion-on-screen.md`](2026-10-12-thr-1750-dominion-on-screen.md). Design lane, run 2026-10-12d. The grill-me synthesis (answered against evidence, no person present) is in the vault at `Brainstorms/2026-10-12-thr-1750-dominion-on-screen-grill-me.md`.

## Vision premises engaged

- **Prose carries mechanics; numbers never reach the player.** The band is a word. The lens uses lightness and one gold line. The chip uses pips, which are the accepted cost glyph.
- **A chapter, not a spreadsheet.** The risk is that a territory overlay turns the map into a 4X board. Mitigations: the lens is off by default and a deliberate look; it dims rather than paints; the tend line on the sheet tells the story of the ground (*left untended, it will slip back*), not a score.
- **Sphere-tinted cards are loved.** The chip adds to the card face and removes no tint.

## Alternatives considered

### How a hex gets a band
| Option | For | Against | Verdict |
|---|---|---|---|
| Terrain table only (`dominionBandOfHex`) | Already built by the core; no projection | Never moves; the frontier would not answer Claim or Shift; a stone god's turf would be every mountain forever | Rejected |
| Nearest town within 1 | Tight; turf hugs towns | 13–15% of land stays on the static terrain read (measured) | Rejected |
| **Nearest town within 2** | 99.4% of land follows a town (measured); the frontier moves with play | Two hexes of wilderness take a town's band | **Chosen** |
| Nearest town within 3 (the realm fill) | Matches the realm borders | One town paints a wide area; turf looks larger than it is | Rejected |
| Distance-weighted blend of nearby towns' match | Smooth | Reads the match number outside `dominion.ts` (core § Decided 1 forbids it); hard to explain on hover | Rejected |

### Tie rule
An explicit priority wins: Sovereign, then Hostile, then Held, Touched, Foreign. A Hostile neighbour is never hidden by mild ground, and a Sovereign town is never hidden by anything. The alternative, the friendlier band, would hide threats. The lower place id alone would be arbitrary on screen.

### The switch
| Option | Verdict |
|---|---|
| THR-1766's four tabs (Terrain / Dominion / Borders / Threads) | Deferred to THR-1830, which owns how lenses switch and combine; building tabs here decides that ticket |
| **A registry with one row plus one button and key `1`** | Chosen: it gives THR-1830 something to extend and forks nothing |
| Settings-panel toggle (like fog) | Rejected: the lens is a planning tool used mid-play, not a preference |

### The second sheet line
THR-1766's mock line names the direction and sphere of pressure. Nothing stores that per place, and inventing a store would exceed this UI-pillar ticket. The tend line from `isTended` says the actionable thing: who holds this, or that it will slip.

### Card chip source
| Option | Verdict |
|---|---|
| Pass the target id into `CardFace` and read the graph there | Rejected: components read view data, not the graph (THR-1822 direction), and the price would be computed twice |
| **Band and par cost on the slot, computed beside `essenceCost`** | Chosen: one computation, and the price shown is the price paid |

## Tensions

- **THR-1766 decision 2 vs THR-1830's ownership.** Resolved by deferring three tabs. This is recorded as a deviation in the plan and offered as a veto line.
- **GameView growth.** It is 6,700 lines and the THR-1823 map will split it. The additions are kept in one block so the split can lift them.
- **A badge visible with the lens off.** A band drop is news even when the lens is closed. The badge is small, fog-covered and expires after three days.

## Veto lines offered

- *"Give me all four map tabs now"*: build THR-1766's Terrain / Borders / Threads tabs here instead of waiting for THR-1830.
- *"Show the turf only around towns"*: radius 1.
- *"Don't show my ground on faction and artifact pages"*: only places and mortals.
