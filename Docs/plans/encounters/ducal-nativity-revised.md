# Encounter Pipeline: The Duke's Nativity
> Scale: short (2 steps, opt-in fork) | Slug: ducal-nativity | Pass: revised
> Revisions applied: opening re-split (complication into P2, 76 words); Kindle/Counsel effect lines state mechanism; four fragment fixes (seam echoes, `way`, base-band conflict); five afterimages; all overviews rewritten against the afterimage seam, critical_failure overviews made true on the step-0 route; fallback bands; ambition narrativeHooks true after a step-0 failure
> Date: 2026-10-05 | Pipeline version: 3.0 (batch master-everyday, slot 6, THR-1688)

## 0. Binding row and mechanical design block (designed before the prose)

Brief: `Docs/plans/encounters/master-everyday-brief.md` slot 6 (binding).

- **templateId** `encounter.town.ducal_nativity` · reach **star** · `rarityTier: 2` · `intrinsicTier: 'shaping'` · `scale: 'local'` · settings `urban`.
- **Steps** star 0.74 (step 0, the reading) → star 0.82 (step 1, the telling). Step 1 is an agent-decided fork, so its decline arm carries its own difficulty (star 0.76, see Shape).
- **Consequence hand (binding, recomputed from the id):** `drive` + `place`. No swap.
- **plotHookRolled:** hook.builders_dilemma, hook.death_and_return, hook.civil_unrest
- **plotHookTaken:** hook.civil_unrest — drifted: the "settlement coming apart" is the court's panic of loyalty spilling into the streets as a plague rumour on the failure side. builders_dilemma and death_and_return fought a nativity reading.
- **Seed dice (brief):** p3Shape obstruction · opposition beast (panic), read as people — a court in a panic of loyalty · disposition open · agentRole competitor (an unasked reader against the cathedral's astrologers) · scale personal.

| Row | Answer |
|---|---|
| Crux | The duke's heir is born, the cathedral's nativity promises a lucky life, and the agent has seen a hard star in the same sky. |
| Title states the crux | *The Duke's Nativity* — a reading of the duke's newborn's stars. |
| Whose problem? | The agent's: they saw the star, and only they can choose to carry it to the duke. The reading is scene-local; no prior tie to the duke or the cathedral is asserted (prose rule 7). |
| Reach = theme | Star both steps. Step 0 (star 0.74): read the child's fate truly from the sky. Step 1 positive (star 0.82): make a lord believe a reading of fate over a flattering one. Step 1 negative (star 0.76): give a true but partial reading of fate aloud and keep the hard part out of it. |
| Shape | **Opt-in Complication.** Step 0 is taken by every mortal; then `decidedBy: { axis: 'courage_prudence' }`. Positive (courage) = **Warn the duke** (the engagement). Negative (prudence, also the fallback) = **Keep the star quiet** (the decline: read the court the bright later years, leave the first out). The player never picks; the two step-0 specials carry opposite pole leans. |
| Decline price | The decline arm is the cheaper road (0.76 vs 0.82) but still a master test, inside the 0.72–0.85 band the brief binds. Its prize is smaller (no favour from the duke). Recorded as the slot's one shape note. |
| Carryover | Step 0 `continue_weakened`; both arms carry `carryoverFactorLines` keyed on step 0 (no critical_failure row: a step-0 critical failure ends the action). |
| `drive` (prize) | `assign_ambition` `ambition_fulfill_destiny` on `$actor`, on **both arms' successMetadata**: the reader who read the child's hard year means to see the child through it. PATH chip (`ambition`). |
| `place` (penalty) | `apply_condition` `trait.condition.location.plague_scare` on `$here` (intensity 0.6, 48 ticks), on **both arms' failureMetadata**: the court's panic carries the hard star into the streets as a plague rumour. SCAR chip (`Plague Scare`). |
| Extras | `favor_creation` debtor `$cast:duke` on the positive arm's success (the warned duke owes the reader). `reputation_with $here` +0.08 positive success / +0.05 negative success / −0.08 positive failure / −0.06 negative failure / −0.03 step-0 failure (backs the critical-failure reputation chip on the step-0 critical-failure route). |
| Cool failure | Nobody is hurt, jailed or branded. A lost telling costs the reader's name in the town and puts a plague scare on it; for a master the cost is the name — the duke heard a rival over them in front of the court. |
| Trait hooks | Gate: none (everyday). Variant: True (`trait.core.core_integrity.virtue`) +0.04, "Being True, they will not read the sky kinder than it is." Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast (duke, astrologer) + rewards (assign_ambition, favor_creation persist) + conditions (plague_scare on $here) + reputation — four. |
| Prose rule 7b | The ambition is the only forward state; no prose tells the mortal to be anywhere later. The healers, the feast and the rumour are present-tense scene facts. |
| Cards | Step 0 specials: Kindle Duty (Kindled Ambition, spirit, lean positive), Counsel Caution (Whisper, mind, lean negative) + deal 4 [lore, insight]. Positive arm specials: Trip the Flatterer (Stumble, chaos, opposes astrologer), Light the Sign (Omen, light) + deal 4 [presence, social]. Negative arm: deal-only 4 [lore, presence]. No Heavy Hand, no `card.boost.core` special, no rider special. |

## 1. Inspiration Anchors

- **Hook (taken):** `hook.civil_unrest` — "the grievance is real, and so is the damage being done in its name." Read here as a panic of loyalty: the court would rather boo a true reading than doubt the cathedral, and on the failure side that panic leaks into the town as a plague scare. The damage done in loyalty's name is the penalty family.
- **Archetype pages:** the vault was not read in this pass (subagent context; the brief carries the dice). Anti-pattern consciously avoided: the "prophecy that must be stopped" quest. Here the prophecy is small, true and personal — one child's first winter — and the drama is whether a court will hear it.
- **Not colliding with the star experts:** `comet_disputation` is a public disputation before a council over a doctrine (verb: *argue in public*); `harvest_almanac`, `assize_letter`, `pilots_reckoning` are not court readings. This encounter's verb is *counsel a lord privately against his own court* — and its fork axis is `courage_prudence`, not the comet's `revelation_discretion`.

## 2. Scale Justification

Short: two steps and one fork. One reading, one telling. A master's stakes sit in who listens (a duke and his court), not in length.

## 3. Pressure Knot

The heir is born; the cathedral's chart is already read and celebrated; the court has committed its joy to it. At the hour of the birth, a hard star rose. Every hour the agent waits, the cathedral's chart sets harder in the court's mind.

## 4. Intervention Fantasy

The god leans on a reader's conscience or caution (which way they go), on the sky itself (a star that burns where the duke can see it) and on a flatterer's tongue. The god cannot make the duke believe; it can make the truth louder.

## 5. Cast and World Objects

- `{cast:duke}` — the duke, counterparty. reuse `noble`, spawn `noble`, spawnName **Aldric Varre**, must-persist (favour debtor).
- `{cast:astrologer}` — the cathedral's first astrologer, opposition voice. reuse `sage` / `scholar`, spawn `sage`, spawnName **Mabry Holt**, must-persist.
- Place: `$here` (the town) — Plague Scare target, reputation target.
- Ambition: `ambition_fulfill_destiny` (AMBITION_TEMPLATES member, star-affine, courage virtue pole).

## 6. Beat Structure

1. **Step 0 — Read the sky** (star 0.74). The night reading. Bands decide how much of the child's year the reader learned.
2. **Step 1 — fork on courage_prudence.**
   - positive **Warn the duke** (star 0.82): an audience at the end of the birth feast, the court cheering the cathedral's chart.
   - negative **Keep the star quiet** (star 0.76): the astrologer asks the reader to read for the court too; read the bright later years and leave the first out.

## 7. Branching Profile

- Branch depth: light · Branch count: 2 · Lives in: step-1 spine, band prose, aftermath variants.
- Convergence: none — each arm owns its aftermath variant; fallback = negative.
- Shape: Opt-in Complication (engage/decline gate agent-decided).

## 8. Branching Map

- Step 0 bands → carryover lines on both arms.
- Positive → favour from the duke on success; plague scare + reputation loss on failure.
- Negative → no favour; smaller reputation; same drive on success; same place penalty on failure.

## 9. Outcome Ladder

| Band | Positive (Warn the duke) | Negative (Keep the star quiet) |
|---|---|---|
| critical_success | Duke believes, thanks the reader before the court; ambition, favour, standing | Court asks nothing more; ambition, standing |
| success | Duke believes and sends for healers; ambition, favour, standing | Court satisfied with the later years; ambition, standing |
| success_at_cost | Duke believes; the astrologer tells the cathedral the reader called its chart a lie (prose cost) | Court satisfied; the astrologer asks twice about the first year (prose cost) |
| failure | Duke takes his astrologer's word over the reader's; Plague Scare, standing lost | The first-year question unanswered; Plague Scare, standing lost |
| critical_failure | The town says the star means plague and the reader saw it first; Plague Scare, standing lost | Same (route-agnostic: reachable from a step-0 critical failure) |

## 10. Sample Opening (narrator mode)

**Opening (urban):** {actor} arrives in {location} on the day the duke's heir is born.

**Spine (step 0):**

> The cathedral's astrologers have cast the child's nativity. It promises a long and lucky life, and the court is celebrating it. {actor} was not asked. At the hour of the birth, they saw a hard star rise over {location}.
>
> Tonight {actor} reads the same sky to learn what the star means for the child. The court will hear nothing against the cathedral's chart without proof.

Word count: opening 12 + spine 38 + 26 = 76. P1 arrival · P2 situation and complication (the unasked reader, the hard star) · P3 the test and the obstruction stake.

## 11. The Hand Per Step

### Step 0 — Read the sky (star 0.74) · purposeLine "Read the sky"

`deal: { count: 4, tags: ['lore', 'insight'] }`

**Kindle Duty** (`nativity.kindle_duty`) — Kindled Ambition · spirit · essence 1 · Δ0.06 · poleLean courage_prudence → positive · imageTag `generic.energy`
- effectLine: "Set the child's safety on their conscience. It steadies the reading and makes them readier to tell the duke."
- success: "The child's safety stayed on their mind, and they read the sky to the last star."
- success_at_cost: "The child's safety kept them reading until first light."
- failure: "The child's safety pressed on them, and they hurried the reading."

**Counsel Caution** (`nativity.counsel_caution`) — Whisper · mind · essence 1 · Δ0.06 · poleLean courage_prudence → negative · imageTag `generic.focus`
- effectLine: "Remind them what bad news costs the one who brings it. It makes them read more carefully, and readier to keep quiet."
- critical_success: "They weighed every word they might say, and read the sky just as carefully."
- near_miss: "They weighed what the news might cost, and missed a star."
- failure: "They thought more about the court than the sky, and read half of it."
- critical_failure: "They thought only of what the court would say, and lost their place in the sky."

**Step 0 afterimages**
- critical_success: "They read the whole year in the sky: a fever in the child's first winter, and the month it comes."
- success: "They read a sickness in the child's first winter."
- success_at_cost: "They read a sickness in the child's first winter, and the cathedral's watchmen saw them at it."
- failure: "They read a hard year for the child, but could not say what kind."
- critical_failure: "They read the hard star wrong, as a sign against {location} and not the child."

**Step 0 effects:** failureMetadata `reputation_with $here −0.03`.

### Step 1 positive — Warn the duke (star 0.82) · purposeLine "Warn the duke"

> The duke, {cast:duke}, gives {actor} an audience at the end of the birth feast. The first astrologer stands beside the duke, and the court cheers every line of the cathedral's chart. Anyone who doubts it is booed out of the hall. {actor} must make the duke believe the warning before the court shouts it down.

`deal: { count: 4, tags: ['presence', 'social'] }`

**Trip the Flatterer** (`nativity.trip_the_flatterer`) — Stumble · chaos · essence 2 · Δ0.10 · opposes `astrologer` · imageTag `generic.luck`
- effectLine: "Make the first astrologer misread the cathedral's own chart aloud. The court hears the error."
- success: "The first astrologer read a wrong house from the cathedral's chart, and the duke heard it."
- near_miss: "The first astrologer stumbled once and recovered, and the court laughed it off."
- failure: "The first astrologer stumbled over one line, and the court cheered louder to cover it."
- critical_failure: "The first astrologer read the chart without a slip, and the duke thanked the cathedral for it."

**Light the Sign** (`nativity.light_the_sign`) — Omen · light · essence 2 · Δ0.12 · imageTag `generic.light`
- effectLine: "Make the hard star burn bright over the hall tonight, where the duke can see it."
- critical_success: "The hard star burned over the hall, and the duke went out to look at it."
- success: "The hard star showed bright over the hall when the duke looked up."
- success_at_cost: "The hard star showed bright, and the court called it a lucky sign."
- failure: "The hard star showed for a moment and was lost in cloud."
- critical_failure: "The hard star showed bright, and the court took it as proof against {actor}."

**Afterimages**
- critical_success: "The duke believed the hard star and thanked them before the whole court."
- success: "The duke believed the warning and sent for healers that night."
- success_at_cost: "The duke believed the warning, but the first astrologer would not look at them again."
- failure: "The duke would not hear the warning out, and sent them from the hall."
- critical_failure: "The court called the warning a curse on the heir, and the word reached the streets by morning."

**Carryover factor lines (keyed on step 0)**
- critical_success (for, +0.06): "They can name the month the fever comes."
- success (for, +0.04): "They know the child falls sick in the first winter."
- success_at_cost (against, −0.02): "The cathedral knows they read the sky that night."
- near_miss (for, +0.02): "They know only that the first year is hard."
- failure (against, −0.03): "They cannot say what the hard star means."

**Effects** — successMetadata: `assign_ambition ambition_fulfill_destiny $actor` (narrativeHook "Read a hard first year in the duke's heir's stars, and means to see the child through it."), `favor_creation` debtor `$cast:duke` (magnitude 0.15–0.3, context "Warned the duke of a hard first year for the heir"), `reputation_with $here +0.08`. failureMetadata: `apply_condition trait.condition.location.plague_scare $here` (0.6, 48 ticks), `reputation_with $here −0.08`.

### Step 1 negative / fallback — Keep the star quiet (star 0.76) · purposeLine "Read the later years"

> {actor} keeps the hard star quiet. But word has spread that a second reader watched the same sky. {cast:astrologer}, the cathedral's first astrologer, asks {actor} to read for the court as well. {actor} must give a true reading of the child's later years, and keep the first year out of it.

`deal: { count: 4, tags: ['lore', 'presence'] }` — deal-only.

**Afterimages**
- critical_success: "They read the child's later years so well that the court asked for nothing more."
- success: "They read the child's bright later years, and the court was satisfied."
- success_at_cost: "They read the later years, and the first astrologer noticed what they left out."
- failure: "The court asked about the first year, and they had no answer ready."
- critical_failure: "They let the hard star slip, and the court took it for a curse on the heir."

**Carryover factor lines**
- critical_success (for, +0.05): "They know which years are bright and which is not."
- success (for, +0.03): "They know where the hard year falls."
- success_at_cost (against, −0.02): "The cathedral is watching what they say."
- near_miss (for, +0.01): "They know the later years better than the first."
- failure (against, −0.03): "They are not sure which year to leave out."

**Effects** — successMetadata: `assign_ambition ambition_fulfill_destiny $actor` (narrativeHook "Kept the duke's heir's hard first year to themselves, and means to be there when it comes."), `reputation_with $here +0.05`. failureMetadata: `apply_condition plague_scare $here` (0.6, 48), `reputation_with $here −0.06`.

## 12. Branch-Dependent Later Paragraphs

The two step-1 spines above (positive: the audience; negative: the reading for the court).

## 13. Aftermath Paragraph (overviews per band)

Each overview carries the fact *after* its afterimage, never a restatement of it. Both critical_failure overviews are route-agnostic: they read true when the action ended at a step-0 critical failure (the star misread as a sign against the town) and when the step-1 telling failed.

**Positive variant** (overview: "{actor} took the hard star to the duke.")
- critical_success: "{cast:astrologer} left the feast early. The duke's healers are already watching over the child."
- success: "The court went quiet. No one cheered the cathedral's chart again that night."
- success_at_cost: "The duke has sent for healers. {cast:astrologer} has told the cathedral that {actor} called its chart a lie."
- failure: "The duke took the first astrologer's word over {actor}'s. By morning the streets were saying the stars foretell a plague."
- critical_failure: "{location} is saying the star over the heir's birth means plague, and that {actor} saw it first."

**Negative variant** (overview: "{actor} kept the hard star from the court.")
- critical_success: "Only {actor} knows that the child's first year will be hard."
- success: "No one asked about the child's first year."
- success_at_cost: "The court was satisfied. {cast:astrologer} asked {actor} twice about the child's first year, and got no answer."
- failure: "By morning the streets were saying {actor} had seen a plague in the heir's stars."
- critical_failure: "{location} is saying the star over the heir's birth means plague, and that {actor} saw it first."

**Fallback** (overview "{actor} read the sky and told no one.") — success: "The court kept its feast, and the cathedral's chart still stands." · failure: "The court never heard of the hard star, and the cathedral's chart still stands." · critical_failure: "{location} is saying the star over the heir's birth means plague."

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (local scale; the fork already carried the mortal's choice).

## 15. Aftermath Kit Summary (chips)

- **PATH · ambition** — "{actor} is pursuing Fulfill the Destiny now." (both arms, success bands) — backed by `assign_ambition`.
- **BOND · a favour owed** — "{cast:duke} owes {actor} a favour." (positive success bands) — backed by `favor_creation`. No `$cast:` `stateNoun.entityId`; `tooltipId: 'ui.favour_owed'` (fair-bout / comet-disputation precedent).
- **BOON · reputation with {location}** — "{location} thinks better of {actor}'s star-reading." (success bands).
- **SCAR · Plague Scare** — "Doors stay shut in {location}, and travellers go around it." (failure bands) — backed by `apply_condition`.
- **SCAR · reputation with {location}** — "{location} trusts {actor}'s star-reading less." (failure bands).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| duke (actor) | lazy-materialize-on-trigger | reuse noble / spawn noble | must-persist | favour debtor | built |
| astrologer (actor) | lazy-materialize-on-trigger | reuse sage, scholar / spawn sage | must-persist | — | built |
| plague_scare | condition on `$here` | condition-trait-content | 48 ticks | — | built |
| ambition_fulfill_destiny | assign_ambition | ambition-templates | ambition node | actor sheet | built |

## Concept Art Direction (direction only — the runbook ships no art this batch)

1. *Emotions:* a joy everyone has agreed to; one person holding a truth that spoils it; the loneliness of being right early.
2. *Image:* a cathedral's painted star-chart laid out on a feast table among spilled wine cups and ribbon, one corner of the parchment curled back to show a single star inked over in black. No people. Residue of the celebration, not the audience itself.

## 17. Self-Audit

- Opening skeleton, ≤80 words: PASS (76; complication in P2 after editorial).
- Composed 4–8 hands on all three step surfaces: PASS (2 specials + deal 4; deal-only 4).
- Every special has a failure-band fragment; no Δ ≥ 0.15: PASS.
- No player choice of branch; specials lean, mortal decides: PASS.
- Every chip backed by a write on its band: PASS (see § 15), with the corpus-wide step-0 critical-failure caveat (arm critical_failure page renders on an action ended at step 0; only the reputation chip is backed on that route).
- Hand consequence families wired: drive (assign_ambition), place (apply_condition on $here): PASS.
- FLAG: success_at_cost writes equal success writes (metadata is half-keyed); the cost is prose-only.
- Editorial: overviews no longer restate afterimages; critical_failure overviews and ambition narrativeHooks read true on every step-0 route; `way` removed from Counsel critical_failure; fragment ↔ base and fragment ↔ spine echoes removed.

**Pass 3 carry-forward (systems lane):**
- Step-0 critical-failure route: the Plague Scare chip is unbacked there (Law 56). Either add `plague_scare` on a step-0 critical-failure-only channel if one exists, or confirm which variant renders and drop the chip on that route.
- Step-0 `failureMetadata` reputation −0.03 also fires on a plain (private) step-0 failure. Narrow it to critical_failure if possible.
- Confirm the 48-tick override against `CONDITION_PLAGUE_SCARE_DURATION`.
- Confirm which aftermath variant renders when the action ends at step 0.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (duke, first astrologer, hard star, cathedral chart, court) · 4 YES · 4b YES (after editorial) · 5 YES · 6 YES (essence on all; mechanism stated) · 7 YES · 8 YES · 9 YES (conscience vs caution vs flatterer vs sky) · 9b YES · 10 YES · 11 YES (named duke, astrologer) · 11b YES (after editorial) · 12 N/A (short) · 13 N/A · 14 YES (direction above; residue, no people).
