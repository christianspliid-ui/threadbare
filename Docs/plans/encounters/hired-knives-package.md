# Encounter Pipeline: The Hired Knives
> Scale: short | Slug: hired-knives | Pass: 3b package (THR-1154)
> Date: 2026-10-03 | Input: `hired-knives-final.md` (with `-systems.md`, `-editorial.md`, `-brief.md`)

templateId: encounter.rival.hired_knives
packageVerdict: connected
packageLeaves: The mortal walks away with a changed bond with the named person who warned them (who stays in the world), a lean that bends their next encounters for a few days (away from strangers if they got clear, away from fights and far roads if they were cut), the Wounded condition on a loss, and a region whose rival-god notice went down or up with the card the god played, which decides how soon the next hired knives come.

---

## Half A — anchoring

Every chip in all five bands, read off § 13 of the final packet.

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| critical_success | SCAR · compulsion | the wary lean (`plant_compulsion` hire −0.3 / trade −0.2 / assist −0.2, 72 ticks) planted on `$actor` by step 2 `successMetadata` | compulsion on the bearer `$actor` (agent, 🔗 linked) with `ui.compulsion` tooltip (📍 named concept). Same form as bell-at-the-exchange, drowned-mans-testimony, pawnbrokers-strongroom | yes. "avoid hiring, trading with, or helping" names the three encounter kinds the bias moves; "they" is the bearer | anchored |
| critical_success | BOND · reputation with {target} | the `relates_to` sentiment/trust edge between `$actor` and `$cast:warner`, +0.1/+0.1 | `relates_to` edge, anchored through the counterparty `$cast:warner` (individual, 🔗 linked) | yes, `{cast:warner}` by name | anchored |
| success | SCAR · compulsion | same wary lean | as above | yes | anchored |
| success | BOND · reputation with {target} | same bond, + | as above | yes | anchored |
| success_at_cost | SCAR · compulsion | same wary lean (step 2 held, so `successMetadata` fires) | as above | yes | anchored |
| success_at_cost | BOND · reputation with {target} | the bond, net + (+0.1 from step 2, at worst −0.05 from step 1) | as above | yes | anchored |
| failure | SCAR · Wounded | the `trait.condition.wounded` condition `apply_condition` writes on `$actor` | Attachment · condition, 🔗 linked (`entityId` = template id, `visualKind: 'attachment'`) | yes, "wounded" by its sheet name | anchored |
| failure | SCAR · compulsion | the fear lean (duel −0.4 / explore −0.3 / steal −0.2, 96 ticks) on `$actor` | as the wary lean | yes. "shy from fights and far roads" names duel and explore | anchored |
| failure | BOND · reputation with {target} (loss) | the bond, − | `$cast:warner`, 🔗 linked | yes | anchored |
| critical_failure | BOND · reputation with {target} (loss) | the bond, − (step 1 **or** step 2 `failureMetadata`) | `$cast:warner`, 🔗 linked | yes | anchored |

No chip names the two strangers, the rival, the trail or the road: all of those are scene fiction, and the draft already kept them in the spine, afterimages and overviews where texture belongs. The Seek Revenge ambition is reaction-borne and carries no chip, so it has nothing to anchor (its surface is the reaction label, then the mortal's sheet).

**No `bind` owed.** The only cast referent, `{cast:warner}`, is `lazy-materialize-on-trigger` with a `spawnNpcRole` fallback, so it exists on every spawn regardless of which of the three setting classes the seed lands in. No chip claims a feature of the ground.

**Half A: PASS.** Ten chips, ten anchored, no fold, no bind.

### Backing check (rule 0), per path into each band

I re-ran it because the step-1 critical-failure path is where packages go wrong.

- critical_success / success: clean run, so step 2 `successMetadata` fires: bond + and the wary compulsion. Both chips backed.
- success_at_cost: either step 1 failed and step 2 held (−0.05 then +0.1, net +; wary compulsion from step 2), or a step landed at `success_at_cost`/`near_miss`, which counts as step success (`isStepSuccess`), so `successMetadata` still fires. Backed on every path.
- failure: the only way in is a step-2 failure. `failureMetadata` writes Wounded, bond −, and the fear lean. All three chips backed.
- critical_failure: the step-2 path writes bond −, Wounded and fear; the step-1 path writes only bond −. The band claims only the BOND chip, which is backed on both. That is the accepted D2 under-report, and it is honest.

I also confirmed that negative weights are live. `derivePlantedCompulsionEncounterBias` (`src/engine/plantedCompulsion.ts:60`) sums signed weights and clamps symmetrically to ±`COMPULSION_BIAS_CAP`. So "avoid" and "shy from" really happen, and these chips are not positive-only precedent stretched over a negative write.

### Declaration notes for the `.package.json` author (not fix-list items)

None of these changes a verdict. They make sure the compiled chips render at the tier the table above assumes.

1. **BOND chips:** declare the counterparty concept as `entityId: '$cast:warner'`, `visualKind: 'agent'`. § 13 says "anchor `$cast:warner`" but leaves out `visualKind`. Without it the chip drops to a named-only tier, which is the drift the catalog's `location` note (THR-1221) records.
2. **Compulsion chips:** use the shipped form, with stateNoun `{ text: 'compulsion', tooltipId: 'ui.compulsion' }` and a concept anchored on `$actor` / `visualKind: 'agent'` whose `text` appears verbatim in `detail`. For example, "hiring, trading with, or helping strangers" on the wary chip and "fights and far roads" on the fear chip. Copy the reference from `src/data/encounters/bell-at-the-exchange.ts` or `harvest-almanac`.
3. **Wounded chip:** `entityId: 'trait.condition.wounded'`, `visualKind: 'attachment'`, as the packet already says.

**Consider (not a fix).** The wary chip says the mortal avoids helping "strangers", but the bias is on encounter *kinds* (hire/trade/assist) and does not test whether the other party is a stranger. Read as the narrator's gloss on why the lean exists, it holds, and the chip claims nothing a stranger-check would have to back. I left it alone. If a later pass tightens it, "For a while they avoid hiring, trading, or helping." is the literal form.

---

## Half B — what it leaves behind

> **What does this encounter leave behind that a later encounter or system can pick up, and would the player recognise it happening?**

Four things, and each one is both read downstream and visible to the player:

| Left behind | Who reads it | Would the player see it? |
|---|---|---|
| A persisted warner (`must-persist`) and a moved `relates_to` bond, on every band | both actors' sheets; any later encounter that reaches for the mortal's allies (`{ally:strongest}`); social draw | Yes. The person who warned them is a named face on the sheet, and they trust the mortal more or less |
| A wary or fear compulsion (72 or 96 ticks) | `phaseAgentDecision` → `derivePlantedCompulsionEncounterBias` | Yes. The mortal visibly stops taking hire/trade/assist work, or stops picking fights and long roads, for days afterwards |
| `trait.condition.wounded` on a loss | conditions UI and resolution modifiers, with a term from `CONDITION_DURATIONS` (THR-1697) | Yes. It sits on the Attachments tab until it heals |
| Regional detection pressure moved by the card played (−0.1 *Hide Their Passing*, +0.15 *Shatter The Blades*) | `phaseDetectionPressure` → `recordDetectionCrossings`, the planter of the next `shadow.rival_strike` seed | Partly, but on purpose. The card faces say so before the click ("the notice already on this region fades a little" / "Rival gods can hardly miss the hand that did it"). The player feels the consequence as how soon the next strike comes. This is the loop the encounter exists to close |

The encounter is also a payoff in its own right. It is the first content behind `#rival_strike`, so the detection-pressure system that was built and dormant (`encounterFamilyHasContent('shadow.rival_strike')` false) now has something to fire, and the god's earlier loudness lands on a mortal as a scene. That is the opposite of solitary: here a system that already exists reaches the player.

The optional Seek Revenge ambition on critical_success adds a fifth thread. The grievance pool's counter-play cells read it, and it shows on the mortal's sheet.

**Verdict: `connected`.**

---

## Fix-list

None.

PACKAGE PASS
