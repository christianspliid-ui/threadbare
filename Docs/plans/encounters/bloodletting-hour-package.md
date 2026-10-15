# Package critic — The Bloodletting Hour (slot 6, slug bloodletting-hour)

templateId: encounter.town.bloodletting_hour
packageVerdict: connected
packageLeaves: A mortal who holds the physicians to the figure's hour gains standing with the town, learns that the bishop hides a canker from his chapter, and has the bishop owe them a favour, then either softens or sours the senior physician; a mortal who loses the bedside loses standing with the town instead.

Judged: `Docs/plans/encounters/bloodletting-hour.package.json` (authoritative), with `bloodletting-hour-final.md` and slot 6 of `master-everyday-3-brief.md` (consequence hand `knowledge` + `secret`) for context, against `reference/anchor-catalog.generated.md`. One fallback arm (`branchOnStep: 0`, no variants); every band is authored, and the base fallback carries `changes: []`, so no arm-level chip renders.

## Half A — anchoring

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| crit / success / cost | BOND · reputation with {location} (gain) | the mortal's `reputation_with` edge to this town, +0.06 (net +0.03 on the step-0-failure route, still a gain) | `reputation_with` edge 📍 named, anchored on its counterparty `location` 🔗 linked (`entityId: $here`) | yes. "{location} thinks well of {actor}." It uses `{location}`, not `{target}`, so THR-1685 cannot misread it | anchored |
| crit / success / cost | BOND · a favour owed | `owes_favor` edge, debtor `$cast:bishop`, creditor the mortal (`favor_creation`, step 1 success) | `owes_favor` 📍 named; the debtor end is `$cast:bishop`, `visualKind: 'agent'` (individual 🔗 linked), a must-persist spawned priest | yes. "{cast:bishop} owes {actor} a favour." Both ends are named | anchored |
| crit / success / cost | BOON · knowledge | the `political_secret` intelligence record "The bishop's hidden illness" on `$actor` (reliability 0.8) — an object the encounter creates (clarification 1) | the shipped knowledge shape (`tooltipId: 'ui.knowledge'`, no `entityId`: toll-gate-writ, debt-arbitration, bell-tower-shoring, assize-letter). The record shows in the bearer's intelligence panel | yes. "The swelling is a canker his chapter has not been told of" names this record's content, under the concept "the bishop's hidden illness", not a category of secret | anchored |
| failure | SCAR · reputation with {location} (loss) | the town edge, −0.06 (step 1 failure) | as above | yes. "{location} thinks less of {actor}." | anchored |
| critical_failure | SCAR · reputation with {location} (loss) | the town edge, −0.06 (step-1 crit fail) or −0.03 (step-0 crit fail ends the action) | as above | yes | anchored |

There are 11 chips across 5 bands. None needs a fold or a bind. The cathedral chapter, the physicians' college, the almanac, the basin and the blade are scene fiction and live only in overviews, spines and afterimages. No chip claims any of them. The chapter is mentioned in the knowledge chip's detail as part of the secret's content; the chip's referent is the record, not the chapter.

The physician's `hidden_mark` (step 1 failure) is correctly unchipped: a concealed anchor on a declared cast actor (catalog § "A concealed anchor is still an anchor").

### Write-backing, path by path

- **critical_success, success, success_at_cost.** Step-1 `successMetadata` fires on every step success, including a near_miss floored to success_at_cost. It backs standing, the favour and the intelligence record on all three bands.
- **Step-0 failure, then step-1 success.** Step 0's −0.03 fires with no chip. The BOND standing chip stays a net gain (+0.03).
- **failure.** Reached only via step 1 (step 0 is `continue_weakened`). −0.06 backs the SCAR.
- **critical_failure.** Either route writes a standing loss (−0.06 or −0.03), which backs the only chip. No favour or knowledge chip sits on this band, so nothing claims a write that did not fire. This is the "Known gap" in the design block, and it is handled correctly.

### Word budget and page read

- Every causeClause + detail is ≤15 words (the knowledge chip is the longest, at 15). No chip shares a four-word run with its band overview.
- Order is bond · bond · boon on the win bands and scar alone on the loss bands.
- No chip retells its overview. The success overviews speak of the household's trust and the college's grudge; the chips state the resulting standing, debt and knowledge.

## Half B — what it leaves behind

Every write is one a downstream system reads:

- **Standing with the town** (`reputation_with` `$here`, both directions). The Location Profile standing row shows it, and location-gated draws read it.
- **An intelligence record**, `political_secret` "The bishop's hidden illness", on every win. The intelligence panel shows it. The `political_secret` matcher in `encounterScoring` lifts intrigue, court and blackmail draws for this mortal. A bishop hiding a mortal illness from his chapter is exactly that leverage.
- **A favour** (`owes_favor`, read by `phaseSecretsFavors`). The bishop, a named, must-persist person the player can find again, owes the mortal on every win.
- **Regard** (reactions). `bond_change` with the senior physician (warmer or colder), and with the bishop on "Stand by the art". This shows on both agents' sheets.

The player sees all of it through the chips, the reaction choice, the town's standing row, the intelligence panel and two named NPCs. The secret and the favour are the same fact from two sides: the mortal knows what the bishop hides, and the bishop owes them for keeping it. That pairing is good material for a later intrigue draw.

Thin spots, on record and not blocking:

1. **The physician's hidden mark is inert.** The `hidden_mark` declares no `revealFamilies`, so `hiddenMarks.ts` (`m.revealFamilies?.some(...)`) can never surface it. It is visible only in the debug Hidden Marks tab. The loss side therefore leaves only the standing scar. A later pass could add a reveal family (for example a physicians' or court-intrigue family) so that the blame Anselm Crewe laid on the astrologer can come out.
2. **No authored sequel names the bishop's canker.** Follow-up rides on the generic intelligence matcher and the favour system, as in toll-gate-writ and debt-arbitration.

PACKAGE PASS
