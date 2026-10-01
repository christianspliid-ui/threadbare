# Package critic — The Failing Dyke (slot 3, slug flood-dyke-mending)

templateId: encounter.town.flood_dyke_mending
packageVerdict: connected
packageLeaves: Closing the dyke before the crest pays the mortal an #ancient possession from under the culvert's old keystone, raises their standing with the village, and plants a Builders' Fellowship errand that finds them later; failing leaves the village under Blighted Harvest and thinking less of them, and the rival crew's leader (Tam Hesketh, or a reused wanderer) stays in the world with whatever bond the mortal's reaction wrote.

> Pass 3b, batch expert-everyday-3 (THR-1680), 2026-10-01. Judged against `flood-dyke-mending-final.md` and `flood-dyke-mending.package.json` (the package carries the implementation-stage renames recorded in the final). Gate evidence: `check:encounter` run against the dry-run compile through a scratch registry shim — clean, 0 warnings, systems `cast · rewards · seeds · conditions · reputation · content_query`.

## Half A — anchoring

Routing (systems § 3): step 2 `successMetadata` fires on every route into critical_success, success and success_at_cost; failure has one route (a plain step 2 failure); critical_failure has three (a critical failure at step 0, 1 or 2 ends the action).

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| crit / success / s@c | BOND · reputation with {location} — "The Dyke Held" | the mortal's standing edge with the village (`reputation_with $here` +0.06) | location `WorldRef`, linked (`entityId: '$here'`, `visualKind: 'location'`) | yes: "{location} thinks well of {actor} now" | anchored |
| crit / success / s@c | PATH · seed — "Work From the Fellowship" | the pending `encounter_seed` (query `#fellowship_errand`) on the mortal | seed-via-carrier: agent `$actor`, linked | yes: names the carrier and the Builders' Fellowship; promises no delivery (systems S1) | anchored |
| crit / success / s@c | PRIZE (engine) | the `#ancient` possession drawn by step 2 `rewardPool` | possession, linked | the engine names the item; the overviews say only "what the first builders left under the culvert's old keystone", right for a tag draw | anchored |
| failure | SCAR · Blighted Harvest — "A Short Year" | `trait.condition.location.harvest_blight` written onto `$here` | condition (`attachment`), created by this band | yes: the tag is the condition's own `name`; "Food in {location} will run short" restates its description, names the village | anchored |
| failure | BOND · reputation with {location} — "Found Wanting" | standing edge (−0.06) | as above | yes | anchored |
| critical_failure | BOND · reputation with {location} — "Blamed for the Breach" | standing edge (−0.02 / −0.02 / −0.06 by route) | as above | yes | anchored |

Nothing to fold or bind. The culvert, the keystone, the sacks, the reeve, the crest and the winter wheat are scene fiction living in spines, afterimages and overviews; no chip claims any of them. `{cast:ganger}` carries no chip — the bond writes are reaction effects, chosen by the player, and the reaction label/intent says what they do. No chip uses `{target}` (THR-1685 not exposed).

**Unchipped writes (lawful, recorded):** −0.02 on a step 0 or 1 failure that goes on to win (net standing still positive); Blighted Harvest on a critical failure reached at step 2. Neither makes a chip lie; the critical_failure overview claims only the breach and the blame.

**Page read (rule 1c), every band:**
- critical_success / success / success_at_cost: overview (fields, the keystone gift) → BOND (standing, cause "mend stood through the crest") → PATH (the Fellowship) → reactions (credit the crew / name the sack wall). Four blocks, four facts. The overviews never mention the crest or the standing.
- failure: overview (drowned wheat, the reeve's silence) → SCAR (food short) → BOND (found wanting) → reactions (dig drains / blame the sacks). The SCAR states the consequence of the drowned wheat, not the drowning again.
- critical_failure: overview (blamed for breaking what they were sent to save) → BOND (standing, no cause clause) → reactions.
- No contradictions. The gate's `[page]` channel is empty after the reaction rewrite.

## Half B — what it leaves behind

- **The prize** — a possession on the mortal's sheet; read by item contributions and every later possession query.
- **Village standing** — `reputation_with` edge on the settlement, read by settlement standing and reputation-gated draws there; visible on the place-named BOND chip.
- **The Fellowship sequel** — a seed the scheduler fires as one of five `#fellowship_errand` scenes (wall, foundation, tools…) when the mortal stands in a town or hamlet; withers into a narrative line elsewhere.
- **Blighted Harvest** — a location condition the whole village carries for its duration: travellers avoid it (`LOCATION_AVOIDED_MULTIPLIER`), and every later visitor sees it on the place. This is the most visible thing the encounter writes, and it outlives the mortal's visit.
- **The rival** — must-persist, and the reactions write a ±0.12 bond onto them.

Every write has a reader and a surface the player sees. **connected.**

**Reported to the orchestrator (not a package defect):** `encounter.town.levee_breach` (THR-1677) also floods rural fields and writes the same `harvest_blight` on `$here` on failure. The decision, reach, tier and payoff differ, and the near-twin card name was renamed in Pass 3, but two encounters now share the flood-to-Blighted-Harvest consequence.

## Changes applied

None in this pass (the Pass 3 and implementation-stage fixes were already in the final and package).

PACKAGE PASS
