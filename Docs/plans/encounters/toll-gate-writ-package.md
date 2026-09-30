# Package critic — The Writ at the Toll Gate (slot 2, slug toll-gate-writ)

templateId: encounter.town.toll_gate_writ
packageVerdict: connected
packageLeaves: A mortal who names the forged writ false finds the old seal-cutter, gains standing with the town, knows who copies the toll seal, and sets off down the road, then either earns the family's leader's regard or has the toll-master owe them a favour; a mortal who vouches for the family instead has the family's leader owe them a favour and learns the same name secondhand, then either wins back the toll-master's regard or deepens the family's trust; a loss on either path costs standing with the town.

Judged: `Docs/plans/encounters/toll-gate-writ-final.md` (§ 13 chips, § 14 reactions, § 19 step effects) against `reference/anchor-catalog.generated.md` and the batch brief's § Anchors and THR-1685 note. The fork arms are `positive` (Seeker, and `fallback`) and `negative` (Sentinel). Base overviews carry `changes: []`. Every band is authored per arm, so no arm-level chip can render.

## Half A — anchoring

| Arm · band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| pos + fallback · crit / success / cost | BOON · reputation with {target} (gain) | the mortal's `reputation_with` edge to this town, +0.06 (net +0.03 on the step-0-failure route, still a gain) | `reputation_with` edge 📍 named, anchored on its counterparty `location` 🔗 linked (`$here`) | yes. `{target}` is the settlement on a board draw, which is `$here` (THR-1685 allows this case). The detail says "The town trusts…" | anchored |
| pos + fallback · crit / success / cost | BOON · knowledge | the `political_secret` intelligence record "Who copies the toll seal" on `$actor` (reliability 0.9) | shipped knowledge shape (`tooltipId: 'ui.knowledge'`, no `entityId`: debt-arbitration, bell-tower-shoring, assize-letter). The bearer is the actor, and the record shows in their intelligence panel | yes. "where the false writs on this road come from" names this record's content (the maker of these writs), not a category of secret | anchored |
| pos + fallback · crit / success / cost | PATH · seed | `agent_relocation` `away` (min 4 hexes) on `$actor` | seed anchors through its carrier (catalog clarification 2). The carrier is the actor. `{location}` names the place they leave. Shipped shape: assize-letter:297, the-broken-seal:752 | yes. "{actor} is travelling away from {location} now." The place is named, and there is no claim of a destination | anchored |
| pos + fallback · failure / crit_fail | SCAR · reputation with {target} (loss) | same edge, −0.06 (step 1), or −0.03 (step-0 crit-fail route) | as above | yes. "The town trusts {actor}'s eye less." | anchored |
| neg · crit / success / cost | BOND · a favour owed | `owes_favor` edge, debtor `$cast:traveller`, creditor the actor (`favor_creation`) | `owes_favor` 📍 named. The debtor end is `$cast:traveller`, `visualKind: 'agent'` (individual 🔗 linked), a must-persist spawn-only `wanderer` | yes. "{cast:traveller} owes {actor} a favour." The mechanic noun comes first and both ends are named | anchored |
| neg · crit / success / cost | BOON · knowledge | the same record, from the family's account (reliability 0.75) | as the Seeker row | yes | anchored |
| neg · crit / success / cost | PATH · seed | `agent_relocation` `away` (min 3 hexes) | as the Seeker row | yes | anchored |
| neg · failure / crit_fail | SCAR · reputation with {target} (loss) | the town edge, −0.08 (step 1), or −0.03 (step-0 crit-fail route) | as above | yes | anchored |

There are 24 chips across 10 bands (the fallback copies Seeker). None needs a fold or a bind. The charter, the toll house, the toll book, the seal, the family, the carters and the county court are scene fiction and live only in overviews and afterimages. No chip claims any of them.

**THR-1685.** Every `reputation with {target}` chip anchors `$here` and means the town. The three person-regard writes (`reputation_with $cast:traveller`, `reputation_with $cast:tollmaster`, `bond_change $cast:traveller`) are all on reactions and carry no chip. The one person-anchored chip, the favour, uses the `a favour owed` noun and names `{cast:traveller}` by concept. It never interpolates `{target}`.

### Write-backing, path by path

- **Success, critical_success and success_at_cost (both arms).** Step-1 `successMetadata` fires on every `isStepSuccess`, including a near_miss floored to success_at_cost. It backs standing (Seeker), favour (Sentinel), intelligence and relocation on both arms.
- **Step-0 failure then step-1 success.** Step 0's −0.03 fires with no chip. That is legal, and the Seeker BOON stays a net gain.
- **Failure via step 1.** −0.06 / −0.08 backs the SCAR.
- **Critical_failure via step 0.** The action ends at the recorded arm's crit-fail band. Step-0 `failureMetadata` −0.03 backs its only chip (the SCAR). Neither crit-fail band carries a knowledge, favour or seed chip, so nothing claims a write that did not fire. (That is the defect debt-arbitration had to carry; this package is authored around it.)

### Word budget and page read

- Every chip is detail-only with no `causeClause`, and every detail is ≤12 words.
- No chip retells its overview. Sentinel overviews say "{cast:traveller} told {actor} who made the writ", and the knowledge chip states the resulting state (the trade's source), not the scene. Seeker overviews name "the seal-cutter for making it", and the knowledge chip adds that the mortal *holds* it.
- The order is scar · bond · boon · path in every band.
- No chip contradicts a fragment. After Pass 2 the Sentinel success_at_cost overview no longer says "every carter watched", so Turn Away Eyes' "The carters looked away" stands.

## Chip-declaration notes for the implementer

Titles are not given in § 13. Supply sentence-case titles, as comet-disputation and debt-arbitration do: *The town's trust* / *The town's doubt*, *Who copies the seal*, *A favour owed*, *On the road*.

| Chip | `kind` / `category` / `direction` | `stateNoun` | `concepts` | Precedent |
|---|---|---|---|---|
| Town standing (gain / loss) | `reputation` / `boon` gain · `scar` loss | `{ text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` | `[{ text: 'trusts', tooltipId: 'ui.standing' }]` | `debt-arbitration.ts:500-511` |
| Knowledge | `shell_state` / `boon` / gain | `{ text: 'knowledge', tooltipId: 'ui.knowledge' }` (no `entityId`) | `[{ text: 'false writs', tooltipId: 'ui.knowledge' }]` | `debt-arbitration.ts:520-530` |
| Favour (Sentinel only) | `shell_state` / `bond` / gain | `{ text: 'a favour owed', tooltipId: 'ui.favour_owed' }` (no `entityId`) | `[{ text: '{cast:traveller}', entityId: '$cast:traveller', visualKind: 'agent' }]` | `comet-disputation.ts:763-780` |
| Seed / relocation | `future_hook` / `path` / `opens` | `{ text: 'seed', tooltipId: 'ui.aftermath_seed' }` (no `entityId`) | `[{ text: 'travelling away' }]` | `assize-letter.ts:297-305`, `the-broken-seal.ts:752-753` |

Do not put a chip on any reaction write. Do not add a `reputation with {target}` chip anchored on `$cast:tollmaster` or `$cast:traveller`: on a board draw it would read as the town (THR-1685).

## Half B — what it leaves behind

Every write is one the consumption ledger marks acted-on:

- **Standing with the town** (`reputation_with` `$here`, both arms, both directions). The Location Profile standing row shows it, and location-gated draws read it.
- **An intelligence record**, `political_secret` "Who copies the toll seal", on either arm's win. The intelligence panel shows it. `encounterScoring`'s `political_secret` matcher lifts intrigue, court and blackmail draws for this mortal, and a hidden forger of the town's own seal is exactly that leverage.
- **Favours** (`owes_favor`, read by `phaseSecretsFavors`). The family's leader owes on the Sentinel win. The toll-master owes if the Seeker picks "Swear to the seal alone". Both debtors are named, must-persist people the player can find again.
- **Regard** (reactions): the traveller's or the toll-master's `reputation_with`, or a `bond_change` with the traveller. It shows in the agent Standings section.
- **Movement.** A relocation intent sends the mortal visibly off down the road after a win, which the map shows.

The player sees all of it through the chips, the reaction choice, the town's standing row, the intelligence panel and two named NPCs. The fork is what makes it good. Revealing or keeping quiet decides *who* ends up in the mortal's debt (the toll house or the family), while both arms hand the same forger's name forward for later intrigue.

One thin spot, on record and not blocking: no authored sequel names this seal-cutter. Follow-up rides on the generic intelligence matcher and the favour system, as in debt-arbitration.

PACKAGE PASS
