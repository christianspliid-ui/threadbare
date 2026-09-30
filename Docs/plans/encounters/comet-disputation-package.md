# Package critic — The Comet Disputation (slot 4, slug comet-disputation)

templateId: encounter.town.comet_disputation
packageVerdict: connected
packageLeaves: Winning the dawn disputation raises the mortal's standing with the town where it happened and gives them the Achieve Arcane Enlightenment ambition, and if they kept the champion's chart quiet, the college's champion (a persistent sage NPC) owes them a favour; losing lowers that standing and leaves them restless to explore for a while.

Judged: the content package `comet-disputation.package.json` as authored, including its deliberate swap to `ambition_arcane_enlightenment` (an `AMBITION_TEMPLATES` member, `displayName` "Achieve Arcane Enlightenment", `src/data/ambition-templates.ts:412-413`). `assignAmbitionToActor` checks no reach floors, so the template's veil/eye floors do not block a star expert. The chip's concept text matches `displayName` exactly.

## Half A — anchoring

Arms: `positive` (Seeker, holds the chart up), `negative` (Sentinel, keeps it quiet), `fallback` (a copy of `negative`). The arm-level `overview` fields carry `changes: []`. Every band is authored in `byOutcome`, so no arm-level chip can render.

| Arm · band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| pos · crit / success / cost | BOND · reputation with {location} (gain) | the mortal's `reputation_with` edge to this settlement | `location` via `$here`, 🔗 linked (edge `reputation_with` 📍 named, anchored on its counterparty) | yes. `{location}` enriches to the town's name in both the noun (`buildAftermathConsequences.ts:705` enriches `stateNoun`) and the detail | anchored |
| pos · crit / success / cost | PATH · ambition | the `pursues` edge to Achieve Arcane Enlightenment on `$actor` | `ambition` 📍 named (tooltip `ui.ambition`; same form as drowned-mans-testimony) | yes. "Achieve Arcane Enlightenment" by name | anchored |
| pos · failure | SCAR · reputation with {location} (loss) | same edge, down | location, 🔗 linked | yes | anchored |
| pos · failure | SCAR · compulsion | the `plant_compulsion` explore bias on `$actor` | compulsion, 📍 named (tooltip `ui.compulsion`) | yes. "restless to explore" | anchored |
| pos · crit_fail | SCAR · reputation with {location} (loss) | same edge, down | location, 🔗 linked | yes | anchored |
| neg + fallback · crit / success / cost | BOND · reputation with {location} (gain) | settlement standing | location, 🔗 linked | yes | anchored |
| neg + fallback · crit / success / cost | BOND · a favour owed | `owes_favor` edge, debtor `$cast:champion`, creditor actor | `owes_favor` 📍 named. Debtor end anchored `$cast:champion` / `visualKind: 'agent'` (individual, 🔗 linked); must-persist cast | yes. "{cast:champion} owes {actor} a favour." Mechanic noun first, endpoints named (rule 0c) | anchored |
| neg + fallback · crit / success / cost | PATH · ambition | as above | 📍 named | yes | anchored |
| neg + fallback · failure | SCAR · reputation with {location} (loss) | settlement standing | location, 🔗 linked | yes | anchored |
| neg + fallback · failure | SCAR · compulsion | explore bias | 📍 named | yes | anchored |
| neg + fallback · crit_fail | SCAR · reputation with {location} (loss) | settlement standing | location, 🔗 linked | yes | anchored |

There are 30 chips across 15 bands, and none needs a fold or a bind. The college, the council, the gates and the fair are scene fiction and live only in the overviews and afterimages. No chip claims them. **THR-1685:** no chip interpolates `{target}`, and the only chip about a person (the favour) names `{cast:champion}` and anchors `$cast:champion`.

### Write-backing, path by path

- **Seeker/Sentinel success, critical_success, success_at_cost.** Step-1 `successMetadata` writes standing +0.08 / +0.05 and `assign_ambition`, plus `favor_creation` on Sentinel/fallback. `successMetadata` also fires on step-1 `near_miss`, and near_miss floors to `success_at_cost` (`nudges.ts:424`), so that band's chips are backed on that route too. On the step-0-failure route (`continue_weakened`, −0.03), the net standing is still +0.05 / +0.02, so the "thinks better of" direction is still true.
- **failure.** Step-1 `failureMetadata` writes −0.06 and `plant_compulsion` (explore 0.5, 96 ticks). Both SCAR chips are backed.
- **critical_failure via step 1.** −0.06 (plus the compulsion, which carries no chip here, and that is allowed). The standing chip is backed.
- **critical_failure via step 0.** The action ends, and the recorded arm's crit-fail band renders. Step-0 `failureMetadata` −0.03 backs the one standing SCAR. Correctly, neither crit-fail band carries a compulsion chip, because nothing plants one on this path. Both crit-fail overviews read true without a disputation having run to a verdict.
- **Known limit.** `assign_ambition` refuses on `no_free_slot` or `already_pursued`. This is corpus-wide, engine-side and documented in the package `doc`. It is not a package defect.

### Word budget and page read

- Every chip is title + detail, with no `causeClause`. The longest is "A new ambition — {actor} is pursuing Achieve Arcane Enlightenment now." at 10 words, and all are ≤15.
- No chip shares a four-word run with its overview. The Sentinel overviews tell the scene ("{cast:champion} knows {actor} kept it quiet", "…thanked them for leaving the chart on the table"). The favour chip then states the state that scene produced, which is cause then change, not a retelling.
- The order is scar · bond · boon · path in every band: SCAR standing → SCAR compulsion, and BOND standing → BOND favour → PATH ambition.
- No contradictions. Seeker success says "the college lost in public, on its own chart" and Sentinel success says "the chart was never mentioned". Each fits its arm, and the fallback copies Sentinel verbatim, matching its narrative template.
- One cosmetic nit that does not block: the favour chip is titled "A Favour Owed" in title case, while the others use sentence case ("Believed by the council").

## Half B — what it leaves behind

It leaves four things:

- A settlement `reputation_with` edge. The player sees it on the Location Profile standing row, and location-gated draws read it.
- On the Sentinel arm, an `owes_favor` edge from a persistent named sage to the mortal. The player sees it on both sheets. The secrets/favours phase, social leverage and the thread digest read it, so the champion is a lever a later encounter can pull.
- An ambition the pursuit loop acts on and the sheet shows.
- On a loss, an explore compulsion that visibly bends where the mortal goes next.

A player will recognise every one of these. **connected**.

PACKAGE PASS
