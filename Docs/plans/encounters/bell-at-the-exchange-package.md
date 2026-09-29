# Package critic — The Last Lot at the Exchange (slot 5)

templateId: encounter.town.bell_at_the_exchange
packageVerdict: connected
packageLeaves: The mortal walks away with a real trade item drawn from the world's #trade goods (a better one on a better ending) or, on a loss, a lean toward trading and buying that steers their next encounters, and either way the named house buyer's opinion of them moves and persists on that merchant.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| critical_success BOND `reputation with {target}` | the buyer's standing with the mortal | agent `$cast:buyer`, linked | yes, `{cast:buyer}` | anchored |
| success BOND | same | agent, linked | yes | anchored |
| success_at_cost BOND | same | agent, linked | yes | anchored |
| failure SCAR `compulsion` | the planted trade/acquire lean on the mortal | tooltip `ui.compulsion` + concept on `$actor` (agent, linked), backed by `plant_compulsion` | yes, "chase trade and buying" | anchored |
| failure BOND (loss) | buyer's standing | agent, linked | yes | anchored |
| critical_failure SCAR `compulsion` | same lean | as above | yes, "chase the next deal" | anchored |
| critical_failure BOND (loss) | buyer's standing | agent, linked | yes | anchored |
| (engine) PRIZE `item` on the three success bands | the drawn `#trade` item | possession, linked (the drawn template) | the engine names it | anchored |
| ~~BOON `trade goods` ×3~~ | an unnamed "lot" | ✗ (no entityId) | category only | **fold, applied**: removed; the engine PRIZE chip carries the prize |

The fallback growth line (`gold reach`, uncategorised, tooltip `reach.gold`) is a concept and is fine.

## Half B

The encounter leaves a possession on the sheet, drawn by tag and scaled by band. It also leaves a pairwise `reputation_with` edge on a persistent merchant NPC, which later reputation gates and social draws read. On a loss it leaves a 72–96-tick compulsion that the encounter scorer reads to tilt the mortal toward `trade`/`acquire` work. The player sees all three: the PRIZE chip, the buyer's portrait chip, and the SCAR · compulsion chip. The mortal's next pick then drifts toward the market. **connected**.

PACKAGE PASS (FIX applied: 3 unanchored item chips folded, prize moved to step `rewardPool`)
