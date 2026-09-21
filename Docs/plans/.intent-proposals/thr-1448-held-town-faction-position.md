# Action proposal — A held town is a faction position (THR-1448)

**Plan doc:** `Docs/plans/2026-09-21-thr-1448-held-town-faction-position.md`
**Issue:** THR-1448

## intent_quote

> it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized.

(Christian, attended chat 2026-09-10, answering the THR-1287 escalation *is a claimed town a commitment or a possession?*. The first clause shipped as THR-1287; this plan is the second.)

## scope (what this plan does)

Reads a mortal's active hold on a town against the realm projection to name the Realm whose ground it is; mints a `member_of` edge with that Realm through `joinFaction` (seeding `reputation`, never `rank`) so the Realm's court encounters reach the keeper through the existing supply path; adds a `requiresHold` template field read where the other standing gates live, failing open; adds one temperament term on the decision board keyed on the candidate's object; authors two town-keeper encounters through the factory; puts a hold line with the grip in words on the sheet's Faction strand; two trace members, one board field, a debug reading, a chronicle line, the UL hold entry corrected, one rulebook sentence.

## scope (what this plan does NOT do — explicit non-goals)

- No new node, edge type, class, or field on `StrategicControlState`; no property on the `controls` edge.
- Does not write `rank`; does not touch `getLocationHolder`, the realm projection, or the political border.
- Does not change `divisionRule`, `desireMultiplier`, or add a bridge constant.
- Does not retire the membership on collapse or seize.
- Does not build the tier pull (THR-1348) or appoint keepers by divine action.

## impact_class

External (judge-corrected from Reversible, run 1): the plan edits `.claude/skills/encounter-pipeline/agents/systems-prompt.md` (the "Live primitives" list gains `requiresHold`), which changes what the factory's content agents author, and the board term changes every keeper's live behaviour. The engine change itself is additive: one reading module, one term with a named weight, one optional template field, one membership write through the existing helper; the sheet gains one line.

## evidence cited

- **Linear issue:** THR-1448 (+ THR-1287 Done, THR-1155 Done through slice 3, THR-1454, THR-1301, THR-1211, THR-805/810, THR-1298, THR-1449)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/02-non-negotiables.md` #1, #3
- **UL terms touched:** hold (Agents.md, canonical, corrected), Realm, Reputation / Standing, Freehold (distinguished), Court Position (avoided); no new headword — *subject* is the realm ladder's existing rung
- **Canon pages consulted:** `systems-inventory.md`, `design-governance.md`, `rulebook-quick-reference.md`, `undertakings.md`, `interface-map.md`, `world-objects.md`
- **Prior plan docs this builds on:** `2026-09-09-thr-1287-control-upkeep.md`, `2026-09-10-thr-1155-realms-and-areas.md`
- **Rejected approaches considered and dismissed:** brainstorm companion (ten)

## load-bearing decisions touched

- *Relationships are graph edges, not property fields* — the standing's one write is a `member_of` edge; the reading is derived, not stored.
- *No inventing node types* — none.
- *The world graph is mutated in place* — `joinFaction` and the existing lifecycle `touchWorld` idiom.
- *Everything is a graph node/edge* — respected.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (105) additive; `src/types/unifiedAction.ts` (494) one optional field. `strategicAction.ts` (108) not edited. Blast Radius present.

## kill criteria

Affinity term vacuous (p25 = p75 for keepers); keepers do nothing but hold-work; a stance moves the border; a `rank` write appears. Each names what moves first.

## explicit user sign-off

Not required (External — no user gate; affected systems named under impact_class). The ruling is quoted verbatim; the ticket's questions are answered in the plan, not left open.

## author notes for the judge

- The ticket says "which faction" has four candidates; the plan picks the ground's Realm with the holder's existing Realm standing as the prior leg, and rejects a minted faction. If the judge reads *"within that factions"* as the holder's own guild rather than the landed Realm, that is the one reading the plan would need to revisit — the plan's argument is that a town's business is the crown's, and the Realm substrate that shipped since the ticket was filed is what makes that answer available.
- *Position* is deliberately kept off every player surface because the UL already binds the word to the divine court.
- The membership outliving the hold is a design choice stated with its reason, not an omission.
