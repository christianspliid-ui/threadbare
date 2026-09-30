# Package critic — Calling the Harvest (slot 5, slug harvest-almanac)

templateId: encounter.town.harvest_almanac
packageVerdict: connected
packageLeaves: Calling the harvest right raises the mortal's standing with the village where it happened, gives them the Build a Great Work ambition and sets them on the road to the nearest settlement; calling it wrong lowers that standing and leaves them helping others before their own work for a while, and the village elder stays in the world as a persistent person a later encounter there can meet again.

> Independent Pass 3b, batch expert-everyday-2 (THR-1679), 2026-10-01. Judged against `harvest-almanac-final.md` § 13, § 15 and § 19 (no `.package.json` exists yet; the implementer transcribes from the final doc). First read: **PACKAGE FIX** (one fold). The fold was applied to the final doc, the package re-judged, and the final verdict is **PACKAGE PASS**.

## Band → write mapping

There is one `fail_action` step. `successMetadata` fires on critical_success, success, success_at_cost and near_miss, and near_miss floors to the success_at_cost action band. `failureMetadata` fires on failure and critical_failure, which map one-to-one. So every success-side page is backed by the success writes and every failure-side page by the failure writes. No band shows a chip whose write fires on the other half, and there is no step-0-crit path that skips a write, because there is only one step.

## Half A — anchoring

| Chip (bands) | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {location} (+; crit, success, success_at_cost) | the mortal's `reputation_with` edge to this settlement | `reputation_with` edge 📍 named, anchored on the counterparty: `location` via `$here`, 🔗 linked | yes. `{location}` enriches to the settlement's name in the noun and in the detail ("{location} trusts {actor}'s reading of the sky.") | anchored |
| SCAR · reputation with {location} (−; failure, crit_fail) | same edge, down | same | yes | anchored |
| PATH · `seed` "Sent for by the nearest settlement" (three success bands) | the acting mortal, carrying a live `relocationIntent` toward `nearest_settlement` | actor/`individual` 🔗 linked. The destination is a bare concept with no `entityId`, the honest form, because `nearest_settlement` resolves at apply time (the-sign-over-the-ruin `sign.carried_onward`, judged anchored in its package pass) | yes. `{actor}` names the mortal. The destination is generic by construction, and the chip does not pretend to know which town it is | anchored |
| PATH · ambition (three success bands) | the `pursues` edge to `ambition_great_work` on `$actor` | `ambition` 📍 named (`ui.ambition`) | yes, by display name "Build a Great Work" (`ambition-templates.ts:881`, exact) | **fold → applied**, see below; anchored after |
| SCAR · compulsion (failure, crit_fail) | the `plant_compulsion` assist bias (0.5, 72 ticks) on `$actor` | compulsion 📍 named (`ui.compulsion`) | yes. "puts helping others before their own work" names what the bias does | anchored |
| growth · star reach (fallback only) | star reach | reach 📍 named (`reach.star`) | yes | anchored (renders only on an unauthored band, and all five are authored) |

**The fold.** The ambition chip's `causeClause` read *"Means to write an almanac"*, and the `assign_ambition` narrativeHook read *"…mean to write an almanac the whole valley can farm by."* There is no almanac in the game: no item, no undertaking and no ambition step writes one. The ambition the player watches, Build a Great Work, is builder-civic: it surveys sites, drafts plans, builds a granary, and founds or grows a settlement. So the chip sentence named an object with no graph object behind it, and the player would then watch the mortal do something else. That is the Bridge failure in miniature. The systems pass flagged the fiction (caveat 4), but only for the batch report, and the chip still made the claim.

**Applied to the final doc:**

- `causeClause` → *"Means to build for the valley"*. The chip sentence is now 14 words, within the 15-word budget.
- narrativeHook → *"They called the harvest right, and mean to build something the whole valley can lean on."*
- `description`, the § 9 ladder, the § 15 page-read lines and the two design-block rows were aligned.
- The almanac survives only in the concept art, which is an evocative surface and claims nothing. The title and id are unchanged.

The granary undertaking inside this ambition fits a harvest scene, so the new caption is true, and it may become visible later.

**Not folded:**

- The elder, the barley, the storm and the stars' reading are scene fiction. They live in the spine and the overviews, and no chip claims them.
- `{cast:elder}` carries no chip, so THR-1685 does not apply here. No chip interpolates `{target}`, and the only reputation chips anchor on `$here`, which is the place the prose means.
- The relocation chip's cause, *"Sent for by the nearest settlement"*, is narrative cause, not a claimed state. P3 establishes the world fact it rests on, and the state the chip reports ("set on the road there") is backed.

**Carried, not blocking:**

- The relocation chip's `seed` noun and `ui.aftermath_seed` tooltip describe an encounter seed, and none is written. This is a corpus-wide gap (no travel tooltip exists), and the-sign-over-the-ruin, the-broken-seal and assize-letter share it. The batch report should list it as a UI gap. It is not a fold.
- `assign_ambition` refuses with `no_free_slot` for about 21% of mature-world actors, so the PATH ambition chip can be unbacked on those runs. This is corpus-wide and engine-side.

### Page read after the fold

- critical_success: the overview gives the thanks and the loaf; the chips give trust, the road and the ambition. Nothing is told twice.
- success and success_at_cost: clean. The success_at_cost overview's lost field is a cost, and the gain chip still agrees with it ("thanked {actor} all the same").
- failure and critical_failure: the overview gives the lost crop and the lost name; the chips give the trust drop and the compulsion to help. The compulsion is the forward beat the overview leaves out, and neither contradicts the other.
- No chip shares a four-word run with its overview. Every chip sentence is ≤15 words.

## Half B — what it leaves behind

| Left behind | Read by | Player sees |
|---|---|---|
| `reputation_with $here` ±0.06 | settlement standing; the reputation-gated draws at that place | Location Profile standing row, via the linked BOND/SCAR chip |
| `relocationIntent` → nearest settlement (success) | `phaseAgentDecision` → `resolveRelocationIntentForAgent`; `encounterScoring.computeRelocationIntentBonus` | the mortal walks off toward a town on the map (a lean that lapses after 36 ticks, and the chip says only "set on the road") |
| `pursues` → Build a Great Work (success) | the ambition pursuit loop and the undertaking picker (including the granary build) | the ambition on the mortal's sheet, and what they build next |
| assist compulsion, 72 ticks (failure) | `derivePlantedCompulsionEncounterBias` in agent decision | the mortal drifts toward assist encounters |
| `elder` must-persist cast | cast re-binding on later runs at that place | the same named elder, if a later scene draws them |

A named system reads every write, and the player can see each one. **connected.**

## Chip-declaration notes for the implementer

Copy the declaration shapes from shipped precedent. Do not invent new ones.

| Chip id | `stateNoun` | Anchor (`entityId` / `visualKind`) | Concepts | Precedent |
|---|---|---|---|---|
| `harvest.<band>.town_trust` (± polarity) | `{ text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` | `$here` / `location` | `[{ text: 'trusts', tooltipId: 'ui.standing' }]`. The word must appear verbatim in the detail, and it does in both polarities | `src/data/encounters/comet-disputation.ts:534-546` |
| `harvest.<band>.sent_for` | `{ text: 'seed', tooltipId: 'ui.aftermath_seed' }` | none on the noun. The referent is `{actor}` in the detail | `[{ text: 'the nearest settlement' }]`. Bare text with no `entityId`. Concepts decorate by a first-occurrence substring match over `causeClause — detail` (`buildAftermathConsequences.ts:677-684`), and the cause clause "Sent for by the nearest settlement" carries the text, so it decorates as written. Keep the cause clause verbatim | `src/data/encounters/the-sign-over-the-ruin.ts:685-694` (`sign.carried_onward`) |
| `harvest.<band>.ambition` | `{ text: 'ambition', tooltipId: 'ui.ambition' }` | none on the noun (ambition has no `visualKind` member) | `[{ text: 'Build a Great Work', tooltipId: 'ui.ambition' }]` | `src/data/encounters/comet-disputation.ts:554-565` |
| `harvest.<band>.compulsion` | `{ text: 'compulsion', tooltipId: 'ui.compulsion' }` | concept anchored `$actor` / `agent` | `[{ text: 'helping others', entityId: '$actor', visualKind: 'agent' }]` | `src/data/encounters/bell-at-the-exchange.ts:393-406` |
| `harvest.a_call_made` (fallback) | growth, no noun entity | none | `[{ text: 'star reach', tooltipId: 'reach.star' }]` | the drowned-mans-testimony fallback |

Keep the chip order in every band as `scar · bond · boon · path`: trust first, then the road, then the ambition on the success side; trust first, then the compulsion on the failure side. The `assign_ambition.narrativeHook` is the new string above.

## Verdict history

1. First read: `PACKAGE FIX`, with one fold (the almanac in the ambition chip's cause clause and the narrativeHook).
2. The fold was applied to `harvest-almanac-final.md`, touching only the chip, anchor and minimal aligned prose fields.
3. Re-judged: every chip is anchored, and the verdict is connected.

PACKAGE PASS
