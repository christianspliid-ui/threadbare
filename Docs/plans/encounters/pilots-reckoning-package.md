# Package critic — The Run the Pilot Refused

templateId: encounter.town.pilots_reckoning
packageVerdict: connected
packageLeaves: A mortal who leads the run carries an intelligence record on the merchant house's night route, gains or loses standing with the factor Idris Vell, and is later found by a caravan master who wants a route read (The Caravan Deal); a mortal who declines only loses a little of Idris Vell's regard.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {target} (lead, three success bands) | The factor's regard for the mortal | `reputation_with`, named; anchor the counterparty `$cast:factor` | Yes: {cast:factor} (Idris Vell) | anchored |
| SCAR · reputation with {target} (lead failure and crit failure; decline base, failure and crit failure) | The same edge, falling | `reputation_with`, anchor `$cast:factor` | Yes | anchored |
| BOON · knowledge (lead, three success bands) | The intelligence record written on `$actor` | An intelligence record on the actor's sheet (AgentIntelligencePanel); same pattern as the-drowned-archive | Yes: "the house's night route" | anchored |
| PATH · seed (lead, three success bands) | `encounter_seed` → `encounter.caravan_deal` planted on `$actor` | Seed chip anchors through its carrier (catalog rule 2) | Yes: {actor} | anchored |

No chip needs `fold` or `bind`. The only declared setting class is `urban`, and both cast members are lazy-materialized there.

## Half B

The encounter writes three things.

- **A standing edge with a named merchant (Idris Vell).** The Standings section reads it, and it can recur.
- **An intelligence record.** The mortal's sheet shows it.
- **A literal sequel.** It fires 30 ticks later as a visible new encounter.

The player sees all three. Before the critic fix, the sequel pointed at rank-gated Consortium errands that would have asserted a membership the mortal does not hold. It now points at an everyday caravan scene that matches the seedLabel.

PACKAGE PASS
