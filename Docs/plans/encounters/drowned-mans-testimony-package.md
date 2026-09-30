# Package critic — The Drowned Man's Will (slot 6, slug drowned-mans-testimony)

templateId: encounter.town.drowned_mans_testimony
packageVerdict: connected
packageLeaves: A true reading gives the mortal a relic drawn from the world's #relic items (paid from the drowned man's river finds), raises their standing in the town or village where the court sat, strengthens the god's thread to them and sets them on the Uncover Ancient Secrets ambition; a wrong reading lowers that standing, thins the thread and sends them off searching for the missing will for six days, while the dead man's heir stays in the world as a persistent claimant a later run in that place can meet again.

> Independent Pass 3b, batch expert-everyday-1 (THR-1678), 2026-09-30. Judged against the exact strings and effects in `drowned-mans-testimony.package.json` (authoritative). The final doc's Exact strings agree with the package on every band string I spot-checked.

## Half A — anchoring

Band → write mapping: one `fail_action` step. `successMetadata` fires on critical_success / success / success_at_cost / near_miss (`isStepSuccess`), and near_miss aggregates to the success_at_cost action band (`debugOutcomePin.ts:375`). `failureMetadata` fires on failure / critical_failure, which map one-to-one to the action bands. So every success-side page is backed by the success writes and every failure-side page by the failure writes, with no band showing a chip whose write fires on the other half.

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {location} (+; crit, success, success_at_cost) | the mortal's standing with the settlement the court sits in | `reputation_with` edge, anchored on the counterparty: `location` via `entityId: '$here'`, `visualKind: 'location'`, linked | yes: the noun and detail enrich `{location}` to the settlement's name; the P3 stake names the same place ("their good name in {location}") | anchored |
| BOND · reputation with {location} (−; failure, critical_failure) | same edge, down | same, linked | yes | anchored |
| BOND · thread (+; three success bands) | the ascendant ↔ mortal thread, strengthened by `thread_strengthen $ascendant/$actor` | `thread` edge, named (`ui.thread`) | yes: "The thread to {actor}" | anchored |
| SCAR · thread (−; two failure bands) | same thread, weakened by `thread_weaken` | thread, named | yes | anchored |
| PATH · ambition (three success bands) | `ambition_uncover_secrets`, assigned to `$actor` | `ambition`, named (`ui.ambition`) | yes: names the ambition by its display name "Uncover Ancient Secrets", which matches `ambition-templates.ts:679` exactly | anchored |
| SCAR · compulsion (two failure bands) | the planted compulsion (explore bias 0.5, 72 ticks) on `$actor` | compulsion, named (`ui.compulsion`, bell-at-the-exchange precedent) | yes: "the search for the will", the object the failure overview just said is "still missing" | anchored |
| PRIZE (engine; three success bands) | the `#relic` item drawn by the step `rewardPool` | possession, linked (the drawn template) | the engine names the drawn item; the overviews set it up as "the fee from the dead man's river finds" without naming a specific object, which is correct for a tag draw | anchored |
| growth · veil reach (fallback only) | veil reach | reach, named (`reach.veil`) | yes | anchored (renders only on an unauthored band; all five are authored) |

No fold, no bind. The drowned man, the almshouse, the magistrate and the will are scene fiction and live only in the overviews and afterimages; no chip claims any of them, which is right. `{cast:heir}` appears in overviews but carries no chip: nothing is written onto the heir, and THR-1685 therefore does not bite (the only reputation chips anchor on `$here`, and the town is what the prose means).

**Page read (rule 1c).** All five pages read as one text. The fee is told once per page (overview) and the PRIZE chip carries the object; the ambition's cause clause ("Curious about old finds") does not retell the fee. The failure overview's "the will is still missing" hands off cleanly to the SCAR · compulsion caption. No chip shares a four-word run with its overview, and every chip is within 15 words.

**Consider (not a fix).** On critical_failure the step afterimage has the reader tell the court "the dead man had never made a will at all", while the band's SCAR · compulsion says they then put the search for the will first. Read as guilt after the almshouse calls the reading a lie, it holds; and the afterimage is not on the band page, so the page itself does not contradict. I left it.

## Half B — what it leaves behind

- **Settlement standing** (`reputation_with $here` ±0.06): read by settlement standing and the reputation-gated draws in that place; the player sees it as the place-named BOND chip that clicks through to the town's sheet.
- **Thread** change: shown in the Threads panel.
- **A relic** (success half): a possession on the mortal's sheet, shown as the PRIZE chip.
- **An ambition** (success half): `ambition_uncover_secrets` joins the mortal's active ambitions and steers their pursuits; visible on their sheet.
- **A compulsion** (failure half): explore bias 0.5 for 72 ticks, consumed by `derivePlantedCompulsionEncounterBias` in agent decision — the player sees the mortal drift toward exploring, and the chronicle line "The court has stopped looking for the drowned man's will. They have not."
- **The heir** persists (`must-persist`, `supportRole: claimant_heir`), so a later run at that location re-binds the same claimant.

Every one of these is read by a named system and visible to the player. **connected.**

Carried caveats from the systems pass (engine-wide, not package defects): `assign_ambition` refuses on `no_free_slot` for roughly a fifth of mature-world actors, leaving the PATH chip unbacked on those runs; the 5% bad-outcome swap makes the overview's fee sentence wrong on those runs while the PRIZE chip stays honest.

## Changes applied

None.

PACKAGE PASS
