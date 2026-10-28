# Action proposal — 2026-10-28-thr-2087-hex-sphere-pressure

## intent_quote

> **Done when:** a sphere-tagged hex card's successful cast moves a sphere score on at least one graph node on that hex (test), and the four flows cards carry `sphereAffinity: 'energy'` with a test that their cast pushes energy.

> **Direction (for the design pass, not decided):** resolve a hex target to the place tier on that hex (e.g. the hex's place-tier location nodes, split or the first), or to every location on it, at the push site.

(THR-2087, filed by the design lane run 2026-10-28c. Standing delegation, Christian 2026-09-25: "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations".)

## scope (what this plan does)

Adds a pure resolver at the head of the sphere-pressure phase that rewrites any pressure aimed at a `hex_COL_ROW` id onto one place-tier location: the lowest-id place on that hex, else the nearest within `HEX_PRESSURE_FALLBACK_RADIUS` (2), else drops it with a trace. Tags the four energy-priced flows hex cards with `sphereAffinity: 'energy'` and adds technical-effect lines. Tests for both halves of the Done-when.

## scope (what this plan does NOT do — explicit non-goals)

- No new graph node type for hexes.
- No change to card prices, card tiers or the market.
- No change to sustained hex controls' per-tick pressure (their `targetNodeId` is unset; noted, not solved).
- No sphere tags for the 23 other untagged ascendant hex cards.
- No UI change.
- No change to the Mandate rules (THR-2081) or the energy cards (THR-2086).

Deviation from the ticket's Done-when wording: "a graph node **on** that hex" becomes "on that hex, or the nearest place within two hexes" for hexes holding no place (70% of land hexes). The on-hex case satisfies the original predicate exactly; the fallback is additive and stated as a decision with a veto.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2087
- **Vision premises invoked:** north star (every cast leaves a mark the world can read)
- **UL terms touched:** HexTile, Location (place tier), Three-tier Position Model — no new terms
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/game-design/laws.md` (30, 38), `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-28-thr-2086-energy-cards.md` (Decision 1 declined the flows re-tag pending this bug), `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md` (mutex on the phase file)
- **Rejected approaches considered and dismissed:** hex graph nodes, split push, every-place push, mortals on the hex, drop-empty (see brainstorm)

## load-bearing decisions touched

- "Everything is a graph node/edge" / "No inventing node types" — respected: no hex node.
- "Agent position is three-tier… `getLocationNodes`" — the resolver uses the place tier via `getLocationNodes`.

## high-impact files touched (from Codesight)

`src/data/unified-action-templates.ts` (259 importers, one field on four templates), `src/types/trace.ts` (148, two union members). Blast Radius section present.

## kill criteria

More than half of `divine_action` sphere levels in a 600-tick seeded run arriving via `hex_resolved` → radius too generous, drop to 1. `hex_unanchored` above 5% of hex pushes → too tight.
