# Package critic — The Granary Riot (slot 3, slug granary-riot)

templateId: encounter.town.granary_riot
packageVerdict: connected
packageLeaves: Settling the granary raises the mortal's standing with the town, leaves the crowd's speaker (Wynn Halloway, or a reused smith or innkeeper) and the abbey's cellarer (Osric Vane, or a reused priest) trusting them, and plants a town-watch errand that finds them about two days later; failing lowers the town's opinion and leaves both of those people trusting the mortal less, and the aftermath reaction lets the player choose which of the two to side with.

> Pass 3b, batch master-everyday (THR-1688), 2026-10-05. Judged cold against `granary-riot-final.md` (editorial loop 2 + systems fixes S1–S5 applied inline), the anchor catalog, nudge-authoring-spec § Consequences rules 0–0d and 1, and brief slot 3. No gate was run in this pass (no `npm run` per instructions); backing is taken from the final's § 15 route check, re-derived below.

## Half A — anchoring

Routing: step 1 `successMetadata` fires on every route into critical_success, success and success_at_cost (a step-0 failure or near-miss followed by a step-1 success resolves success_at_cost). failure has one route (step 1 failure). critical_failure has two (step 0 critical failure ends the action; step 1 critical failure).

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| crit / success / s@c | The Town's Thanks: "{location} thinks better of {actor} now." | the mortal's `reputation_with` edge to the town (`$here`, +0.06; net +0.04 after a step-0 failure) | `reputation_with` edge, named; anchors the counterparty location (linked, `entityId: '$here'`, `visualKind: 'location'`) | yes: {location} resolves to the town's name | anchored |
| crit / success / s@c | The Crowd's Trust: "{cast:speaker} trusts {actor} now." | bond with the crowd's speaker (`bond_change $cast:speaker` +0.12 / +0.1 trust) | agent, linked (`entityId: '$cast:speaker'`, `visualKind: 'agent'`) | yes: {cast:speaker} resolves to the person's name | anchored |
| crit / success / s@c | The Abbey's Trust: "{cast:cellarer} trusts {actor}'s judgment now." | bond with the cellarer (+0.12 / +0.1; net +0.06 / +0.04 after a step-0 failure) | agent, linked (`$cast:cellarer`) | yes | anchored |
| crit / success / s@c | Work From the Watch: "Word of {actor}'s ruling reaches a town watch." | the pending `encounter_seed` (query `#watch_errand`, 48 ticks) on the mortal | seed-via-carrier: agent `$actor`, linked (concept `{actor}` → `$actor`) | yes: names the carrier; claims only that word travels, not that the job arrives (systems S1), which survives a withered seed | anchored |
| failure | Ruling Refused: "{location} thinks less of {actor} now." | standing edge (−0.06) | as above | yes | anchored |
| failure | The Crowd's Doubt: "{cast:speaker} trusts {actor} less now." | bond with speaker (−0.12 / −0.1) | agent, linked | yes | anchored |
| failure | The Abbey's Doubt: "{cast:cellarer} doubts {actor}'s judgment now." | bond with cellarer (−0.1 / −0.1) | agent, linked | yes | anchored |
| critical_failure | Blamed for the Granary: "{location} thinks less of {actor} now." | standing edge (−0.02 via step 0, −0.06 via step 1) | as above | yes | anchored |
| critical_failure | The Abbey's Blame: "{cast:cellarer} trusts {actor} less now." | bond with cellarer (−0.06 via step 0, −0.1 via step 1) | agent, linked | yes | anchored |

Nothing to fold or bind. The abbey granary, its gate, bar, hinges and key, the abbot, the sacks, bread prices and the old weaver are scene fiction and live only in spines, afterimages, special fragments and overviews; no chip claims any of them (§ 5 marks the granary "never chipped", and that holds). Every chip's referent is the town (`$here`, always resolvable on an `urban`-only envelope), one of two must-persist cast, or the mortal as seed carrier — none depend on a setting feature the spawn might lack, so there is no bind case. No chip uses `{target}` (THR-1685 not exposed).

**Reactions vs chips.** Failure-side reactions move bonds by ±0.04; the worst case leaves the cellarer at −0.02 net on critical_failure via step 0 + "Side with the abbey" — still a loss, so "trusts {actor} less now" holds. The speaker carries no critical_failure chip, so "Side with the crowd" (+0.04 speaker) on a step-0 critical failure contradicts nothing. Success-side reactions only add in the chip's direction.

**Non-blocking note (legibility, rule 0c).** The four person chips carry `stateNoun: 'reputation'` while their write is a `bond_change` (sentiment + trust), so the tag reads `BOND · reputation` above a "trusts" sentence. The choice is deliberate (systems S5, avoiding `{target}` per THR-1685) and the detail line names the mechanic ("trusts") and both endpoints, so the chip is legible and true. Not a fold/bind; flagged only in case the batch later standardises a `trust` / `bond` stateNoun.

**Page read (rule 1c), every band:**
- critical_success / success / success_at_cost: overview (who got bread, what seed the abbey kept) → standing → speaker trust → cellarer trust → watch seed → reactions (stay for the last sack / sup at the abbey). The overviews never restate the standing or the trust; no contradictions. success_at_cost's overview ("less seed left than it wanted") is consistent with the s@c afterimages (cracked bar, argued sacks).
- failure: overview (bread still dear, the master's word failed) → standing → both doubts → reactions (side with crowd / abbey). Coherent.
- critical_failure: overview (seed lost, both sides lost by it) → standing → cellarer blame → reactions. The overview no longer claims a future harvest (systems S2).

## Half B — what it leaves behind

- **Town standing** — a `reputation_with` edge on the settlement, read by settlement standing and reputation-gated draws there; visible on the place-anchored chip and the Location Profile standing row.
- **Two people who remember** — the crowd's speaker and the cellarer are must-persist and stay in the world carrying the bond this encounter (and its reaction) wrote; they open from the chips to their agent sheets and are available to later cast reuse.
- **The watch sequel** — a seed that fires one of the five Civic Guard `#watch_errand` scenes 48 ticks later if the mortal is in a town, city or capital; elsewhere it withers into its narrative line. The chip promises only the word travelling, which is true on both outcomes.

Every write has a reader and a surface the player sees; the seed's arrival is itself an encounter the player plays. **connected.**

## Changes applied

None in this pass.

PACKAGE PASS
