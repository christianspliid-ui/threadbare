# Encounter Pipeline: The Run the Pilot Refused
> Scale: short | Slug: pilots-reckoning | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.pilots_reckoning` · Batch: journeyman-everyday-1, slot 1 (THR-1676)
> Package: `Docs/plans/encounters/pilots-reckoning.package.json` (dry-run clean)

## 1. Inspiration Anchors

- **Hook taken: `hook.mentors_test`** ("a teacher has set a test ... and is watching without helping"). Rolled with `hook.apotheosis` and `hook.haunted_relic`; both pull toward the uncanny, which the everyday journeyman register rules out. The mentor survives as the house's own pilot. The pilot refused the run, then rides on the last wagon and watches the stranger's reckoning without helping. The pilot is not claimed as the agent's teacher (prose rule 7), so the test is watched, never assigned.
- **Structural model: The Swindled Family** (`vertical-slice.ts`), the corpus's one Opt-in Complication. A plain step is followed by an agent-decided fork, one pole engaging and one declining cheaply. **The Beast in the Granary** package was the JSON model for a `decidedBy` fork with pole-leaning specials.
- **Anti-patterns avoided:** the helpful passerby (the agent is a trespasser on another pilot's run); a personal condition as the failure penalty (failure costs money and the factor's regard); lyric night-sky prose (the stars are a table to check).

## 2. Scale Justification

The template is a short encounter with two beats at `scale: 'local'` and `rarityTier: 2`. The stakes are one merchant house's season and one factor's trust. That is journeyman weight: real money, stated plainly, with no rule gate. The rolled `region` scale sits in the fiction. The route crosses open country, and the crit-success ending has the factor tell every house in the town.

## 3. Pressure Knot

A merchant house steers its wagons across open country by the stars. Its last two night runs came in two days late, and the drivers swear they held the course. The house's own pilot has refused the next run until the fault is found. A season's goods are loaded and a buyer is waiting. **Hidden cause (the payoff):** one star in the house's tables was copied wrong years ago, and it bends every night run off course.

## 4. Intervention Fantasy

The god works on a navigator at their desk and on the road. The god can sharpen the memory of the two late runs so the pattern shows, or clear tonight's sky so every star can be checked. Each of those cards also leans the mortal: the memory toward caution, the bright sky toward going. On the road the god can keep the lead wagon on its heading, or tempt the silent watching pilot to speak once at the turn. The mortal decides whether to put their own name to the run.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:factor}` Idris Vell | actor, merchant/trader, must-persist | Friendly disposition. Asks for the reading; the `bond_change` counterparty on every band |
| `{cast:pilot}` Maren Holt | actor, lookout/trader, must-persist | The mentor's-test watcher; on stage in beat 2 of the lead path |
| Intelligence record | `intelligence` (trade_route) | "The house's night road" — written on the lead path's success |
| Sequel | `encounter_seed` query `#consortium_errand` | Merchant work comes looking again; delay 30 |
| Reputation channel | `bond_change` ↔ `$cast:factor` | Up on the lead path's success; down on its failure; slightly down on any decline |

## 6. Beat Structure

1. **Check the star tables** — star 0.40, `continue_weakened`. Every mortal makes the reckoning.
2. **Fork on `courage_prudence`** (agent-decided, THR-894):
   - `positive` (Vanguard): **Lead the night run**, star **0.45**, `fail_action`. This is the test engaged. It was amended from 0.48 to the 0.45 open-draw cap per the coordinator.
   - `negative` (Watcher): **Hand the tables back**, star 0.20, `fail_action`. This is the cheap exit: a small loss of face with the factor.

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: step 1 (prose, test, hand), the aftermath variant, and the consequence hand. The lead path alone writes knowledge and the seed.
- Convergence policy: none. The poles resolve to different aftermath variants.
- Shape: **Opt-in Complication** (the engage/decline gate is agent-decided personality).

## 8. Branching Map

The step-0 cards carry pole leans (`Recall The Late Runs` leans toward negative, `Clear The Sky` toward positive). The mortal's axis plus the net lean picks the pole, and fate rolls the result.
- **Positive:** step 1 prose puts the pilot on the last wagon. Success writes intelligence, the seed and a trust gain. Failure writes a regard loss.
- **Negative:** step 1 prose is the handover. Success writes a small regard loss (-0.05) and failure a larger one (-0.12). No knowledge and no seed: declining forfeits the drawn prize by design.

## 9. Outcome Ladder

| Band | Lead path | Decline path |
|---|---|---|
| critical_success | A day early; the fault named down to its copy; the pilot asks to see the reckoning; the town's houses hear. Knowledge + seed + trust | The factor sends the marked tables to the house's pilot; small regard loss |
| success | On the due morning; goods sold at the agreed price. Knowledge + seed + trust | Polite handover; small regard loss |
| success_at_cost | Date made, cracked wheel, spoiled crate. Knowledge + seed + trust | Paid less than offered; small regard loss |
| failure | Two days late; the buyer gone; goods sold at a loss. Regard falls | Notes distrusted, reading counted wasted money. Regard falls |
| critical_failure | Two nights lost, half the load spoiled; the pilot says burn the tables. Regard falls | Called a guesser before the yard. Regard falls hard |

## 10. Sample Opening (urban, the only declared class) — 77 words

> {actor} is in {location} when a merchant house's factor comes looking for a star-reader.
>
> The house sends its wagons across open country by night, steering by the stars. Its last two runs came in two days late, and the drivers swear they held the course. The house's own pilot has refused the next run until the fault is found.
>
> {cast:factor} has a season's goods loaded and a buyer waiting. The factor asks {actor} to check the house's star tables.

## 11. The Hand Per Step

Each nudge-bearing step authors specials and declares a `deal`. No `libraryCardId` is used, so the batch's over-exposed-card list is untouched.

**Step 0** — deal 4 `['lore','insight']`
- **Recall The Late Runs** (Boost + pole lean, time, 2 essence, +0.10, toward Watcher): "Bring both delayed trips back to mind at once, so the pattern in the lost days stands out. It argues for caution." Fragments: crit_success, success, near_miss, failure.
- **Clear The Sky** (Boost + pole lean, light, 2 essence, +0.08, toward Vanguard): "Thin the cloud over the town tonight, so every star in the tables can be checked overhead. A bright night argues for going." Fragments: success_at_cost, failure, critical_failure.

**Step 1, positive** — deal 4 `['journey','lore','peril']`
- **Hold The Bearing** (Boost, order, 2, +0.12): "Keep the lead wagon true to its heading through the dark stretch where the last runs went astray." Fragments: success, failure, critical_failure.
- **Loosen The Pilot's Tongue** (Whisper, mind, 1, +0.07): "Tempt the watching guide to speak once, at the turn the house's tables miss." Fragments: crit_success, success_at_cost, near_miss, failure.

**Step 1, negative / fallback** — deal 4 `['social','presence']`, no specials.

No rider, no delta ≥ 0.15, no grants, no cost channels. All six StepOutcomes are covered on every special-bearing step.

## 12. Branch-Dependent Later Paragraphs

- **Positive:** "{actor} takes the run the house's pilot refused. The wagons leave {location} at dusk on {actor}'s reckoning. {cast:pilot} rides on the last wagon to watch, and offers no help. The stretch where the last two runs went wrong comes after midnight."
- **Negative:** "{actor} will not lead the run. {actor} hands the star tables back to {cast:factor} with the reckoning written in the margin. The factor needs a pilot by dusk, and has only the margin notes to go on."

## 13. Aftermath Paragraph (lead path, success)

"The wagons reached the buyer on the morning they were due. The fault was one star copied wrong in the house's tables, and {actor} steered around it. The season's goods sold at the agreed price."

## 14. Aftermath Reaction Choices

No reaction choices; the consequence is clean. Every write rides step metadata, so each chip is true on its band without a click.

## 15. Aftermath Kit Summary

- BOON · knowledge: an intelligence record on the house's route (lead path, success side).
- PATH · seed: merchant work comes looking again (`#consortium_errand`, lead path, success side).
- BOND · reputation with the factor: a gain on lead success; a SCAR loss on lead failure and on any decline (larger on decline failure).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| factor | lazy-materialize-on-trigger | reuse merchant/trader, spawn merchant "Idris Vell" | must-persist | `bond_change` target on every band | built |
| pilot | lazy-materialize-on-trigger | reuse lookout/trader, spawn trader "Maren Holt" | must-persist | named in lead-path prose and crit endings | built |
| sequel | seed query | `#consortium_errand` (5 bearers, town/city/capital subtypes) | seed | fires after 30 ticks | live tag |

## 17. Self-Audit

- PASS: brief row. The id, reach star, settings `urban`, rarityTier 2 and scale local match. Step 0 is 0.40 and the lead path 0.45 (amended cap). **Flag:** the fork step carries no top-level `difficulty`, so `measure:roll-spread` reads the mean as 0.40 (window fit 0.54). That is still journeyman.
- PASS: consequence hand `knowledge` (`intelligence`) + `story_seed` (`encounter_seed` query), both on the success side, as the brief's wiring says.
- PASS: no rule gate, no new tag, no new condition, and no `apply_condition` on `$actor`.
- PASS: every chip is backed by a write that fires on that band (step metadata keyed by the final step). Chip nouns are `knowledge`, `seed` and `reputation with {target}`. Each chip is ≤15 words and shares no 4-word run with its overview (self-checked).
- PASS: the specials cap of 2 per step is held, and each special carries a failure-band fragment.
- PASS: prose rule 7b. "Merchant work will come looking" is backed by the seed; no place or time is promised.
- PASS: no card's effect line repeats a content word from its name (`Loosen The Pilot's Tongue` says "guide", not "pilot").
- FLAG for Pass 2: the knowledge chip claims the record on the positive success side only; the negative pole forfeits it by design.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (memory vs sky vs heading vs the watcher's voice) · 9b YES · 10 YES · 11 YES (factor and pilot named) · 11b YES · 12 N/A (short scale) · 13 N/A · 14: Concept art shows a star table on a counting-house desk with one line scored through in fresh ink and a wagon lantern cold beside it. The feeling is doubt about an old certainty.
