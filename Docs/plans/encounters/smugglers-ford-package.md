# Package critic — The Salt Train at the Ford

templateId: encounter.town.smugglers_ford
packageVerdict: connected
packageLeaves: A mortal who leads the salt train over the ford sets off on the road away from the town with it and gains the trust of the carrier Wenna Tarrow; one who is caught loses her regard and is known by face to the exciseman Oswin Keel; either way the chronicle records an omen that the river favours, or has turned against, night crossings, which tilts what the world offers for a while; a mortal who declines only loses a little of Wenna's regard, plus the turning omen if her crossing then fails.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {target} (lead: crit_success, success, success_at_cost) | The carrier's regard for and trust in the mortal (`bond_change` +0.15 / +0.10) | `agent` via `$cast:carrier`, linked | Yes: {cast:carrier} (Wenna Tarrow) | anchored |
| PATH · seed (lead: crit_success, success, success_at_cost) | The travel intent `agent_relocation` writes on the mortal (away, ≥3 hexes) | `$actor` + `ui.aftermath_seed`, the Assize Letter form; a journey "is summarised on the traveller's sheet; a chip names the traveller" | Yes: {actor}, and "away from {location}" | anchored (noun caveat in systems § 5) |
| SCAR · reputation with {target}, carrier (lead: failure, crit_failure) | The carrier's regard falling (−0.15) | `agent` via `$cast:carrier`, linked | Yes | anchored |
| SCAR · reputation with {target}, exciseman (lead: failure, crit_failure) | The exciseman's regard falling (−0.15 / −0.10) | `agent` via `$cast:exciseman`, linked | Yes: {cast:exciseman} (Oswin Keel), introduced in the lead step's prose | anchored |
| SCAR · reputation with {target} (decline: all bands) | The carrier's regard falling (−0.05 / −0.12) | `agent` via `$cast:carrier`, linked | Yes | anchored |

No fold, no bind. `rural` expands to `hamlet`, `farmland` and `mining`. Both cast members lazy-materialize on every one of them. The ford, the river and the fog appear only in prose surfaces (spine, afterimages, overviews and omen hooks) and never in a chip, so the Unsafe Bridge failure (a chip about terrain that is not in the hex) cannot happen here. "The hamlet" was replaced by `{location}` and "the country round", so no sentence asserts a subtype the spawn cannot guarantee.

The omen carries no chip, by rule (`emit_omen` is not chip-backing). It is stated in the overview of every band where it fires, and it prints to the chronicle.

## Half B

What it leaves behind:
- **A travel intent on the mortal.** They visibly walk off the map square toward somewhere at least three hexes away, and the encounters near that destination score higher on the way.
- **A named standing edge with Wenna Tarrow**, up or down, which the Standings section reads.
- **On a caught crossing, a named standing edge with Oswin Keel.**
- **A global omen.** It lands in the chronicle and biases encounter selection for 15 ticks.

The player sees the chips, the chronicle line and the mortal's movement on the map. `connected`: every write has a reader, and each is observable. The weak point is the decline arm's success bands, which leave only a small regard loss. That is the opt-in precedent (batch 1's pilots-reckoning shipped the same), and the decline's failure bands now carry the omen family as well.

PACKAGE PASS
