# Encounter Pipeline: The Forged Charter
> Scale: short | Slug: forged-charter-inquest | Pass: revised
> Revisions applied: P3 states the council's ask and P2 loses three "count's"; step-1 spine grounds the steward's papers and drops the "has brought" echo; Wake Old Guilt relabelled Signature (mind); five band fragments and two afterimages rewritten (no `nothing`, no seam echoes, step-0 critical_success outranks success); success_at_cost / failure / critical_failure overviews and the critical_failure SCAR made true on every path; kept sequel echo cut; missed sequel's purse motive made plain.
> Date: 2026-10-05 | Pipeline version: 2.0
> Batch: master-everyday (THR-1688), slot 1 — the batch's appointment slot
> Template id: `encounter.town.forged_charter_inquest`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The count says the town's charter of liberties is forged, and the town council has sent for {actor} to read it against the count's rival copy and name whoever made the false one. |
| Title | *The Forged Charter* — the complication at a glance: a charter, and a forgery. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)** on a two-step **Puzzle – Investigation – Resolution**. Step 0 reads both copies (hands, inks, seals); step 1 names the forger among the steward's clerks. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.charter_inquest_heard`, missed → `town.charter_inquest_defaulted`, both seed-only (`drawable: false`). |
| Reach per step | Step 0 **eye 0.74** — telling new ink from old and a moulded seal from a true one is Eye's craft at its hardest. Step 1 **eye 0.80** — reading a forger out of three clerks the steward stands behind. Mean 0.77, window fit 0.91 (master band). Words the player reads: *severe*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief, binding). |
| Settings | `urban` only (brief row; the rolled `wayside` is overridden to the settlement board). One P1 opening. The spine names a council, a market, a town hall and a charter — every town, city and capital carries them. |
| Whose problem? | The agent's: their reading, their named forger, their findings, their name as the master the council sent for. The town and the count are where the problem lives. |
| Why here? | `mission` — sent for by the town council, because the count has called the charter a forgery. |
| Plot hook | Packet rolled `hook.haunt_resolution, hook.desperate_escort, hook.meeting_to_keep`. **Taken: `hook.meeting_to_keep`** — the findings must be read out at the inquest on court day, and the master has to be in the town hall to read them. `hook.haunt_resolution` set aside (nothing restless in a dispute over parchment). `hook.desperate_escort` set aside (nobody needs taking anywhere; the movement is the master's own, to the inquest). |
| Seed dice | p3 **mystery** — "Both copies carry the old king's seal, and nobody in {location} can say which one is false." · opposition **faction (territory)** — the count's claim on the town's tolls, carried by his steward and lawyers · disposition **hostile** — the steward does not want an outsider reading his copy · agentRole **trespasser** — an outsider in a hall the count's people hold · scale **settlement** (the whole market's tolls; the template field stays `local`, per the brief). |
| Master stakes | Who sits across the table: the count's steward and lawyers, with a town's liberties on the table. Failure is the name before the purse: {location} thinks less of the master, and a master's mistake is something the count's lawyers can use. No death, jail or brand. |
| Consequence hand (binding) | `knowledge` + `story_seed`. No swap. **knowledge** — `intelligence` (`political_secret`) on step 1 success: who wrote the count's copy (one of the steward's own clerks). **story_seed** — the appointment itself (below). |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.charter_inquest_heard'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to court day), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.charter_inquest_defaulted', seedLabel } }`. The step-1 spine names the place and the time (the town hall on court day, in three days) — prose rule 7b's one lawful exception, and only on the success path. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, −0.03 on step 0 failure (a step-0 critical_failure ends the action, so the critical_failure SCAR needs its own backing write — the boundary-survey / mill-lease lesson). |
| Mortal choice | None — this is a test. `motivations: ['revelation_discretion', 'tradition_novelty']` — Eye's own axis (to bring the truth out or keep it) and the old charter against the new claim. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait reads a forged hand better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast (steward, forger) · seeds (the appointment) · reputation — three, plus the intelligence record. |
| Heavy Hand | none authored (the batch's one belongs to slot 5). |
| Tags | `['#territorial']` — "of ground held, claimed, or argued over" (family axis, seated): a town's market claimed by a count. |
| Promise → payoff | "Nobody in {location} can say which one is false" (step 0) → paid in step 0's success afterimages (the count's copy is new ink on a scraped page, sealed from a mould). "Any of them could have made it" (step 1) → paid in step 1's success afterimages (`{cast:forger}` writes in the same hand) and the knowledge record. "The findings are read out at the inquest in the town hall on court day, in three days" (step 1, conditional) → the appointment and both sequels. |
| Not colliding | The Eye experts: *The Boundary Survey* (read moved stones against a charter's marks) and *The Writ at the Toll Gate* (read one traveller's writ, trace its seal-cutter). Here two rival documents are weighed against each other, the forger is found among the opposition's own household, and the findings go before a court. Card types and spheres avoid both (below). |

## 1. Inspiration Anchors

- **`hook.meeting_to_keep`** — someone has given their word to be at a place by a time. Changed the encounter: the master's findings are worth nothing unless they are read at the inquest, so the win plants a meeting rather than ending the job.
- **The Mill Lease (expert-everyday-3 appointment)** — the worked example for the appointment wiring, the step-0 backing write, the sequel file and the missed sequel's regard write aimed off `$here`. Not copied: its Gold craft, its Cache / Signature (time) / Signature (order) / Kindled Ambition hand.
- **The Writ at the Toll Gate** — the nearest Eye scene. Avoided: its Light card ("Light The Page"), its single-document read, and its hunt for a seal-cutter on the road.
- Anti-patterns avoided: the Dark Lord problem (the count wants money, not ruin; the steward is doing his master's business); the helpful passerby (the master is sent for); failure as punishment (nobody is hurt; the cost is the master's name).

## 2. Scale Justification

Short: two beats. One charter, one forger, one master's name. The long tail lives in the appointment, which carries the story three days forward to court day without a third beat.

## 3. Pressure Knot

The count wants the market tolls the town's charter took from his grandfather's house. His lawyers call the charter a forgery and his steward has brought a rival copy that gives the tolls back. Both carry the same old seal. The inquest sits on court day.

## 4. Intervention Fantasy

The god works on the parchment, the wax, the clerks' sleep and the steward's desk: damp air that makes new ink run, a hearth that shows a moulded seal's seams, a night of bad dreams for the guilty clerk, and spilled ink that sends for fresh copies in the forger's hand.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `steward` | The count's steward. Brought the rival copy and keeps three clerks to write his papers; hostile to an outsider reading his copy; the appointment's counterparty. Named on step 0 and step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `steward` / `noble`; spawn `steward` "Aldric Vane". |
| `forger` | The steward's clerk who wrote the count's copy. Revealed in step 1's success afterimages and fragments. | actor spec, lazy-materialize-on-trigger, must-persist; spawn-only (`clerk` "Wat Penrose") — a reused town clerk would be the town's man, not the count's. |
| The town (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Intelligence record | `political_secret` — who wrote the count's copy. | step 1 `intelligence` |
| Appointment | The findings read out at the inquest in the town hall on court day, in three days, with the steward there to answer them. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Weigh the two charters** (eye 0.74, `continue_weakened`) — read hands, inks and seals on both copies. Success: the count's copy is new ink on a scraped page, sealed from a mould. Failure: the copies cannot be told apart (continues weakened, on the council's word). Critical failure: the master says aloud the town's copy looks newer — ends it.
2. **Name the forger** (eye 0.80, `fail_action`) — find which of the steward's three clerks wrote the false copy. Success: `{cast:forger}` writes in the same hand; knowledge, reputation, appointment planted. Failure: no clerk can be named; reputation lost. Critical failure: the wrong clerk named.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | Both copies read; the forger writes in the false hand and says who ordered it | the day | appointment; knowledge; regard |
| success | The forger named by the hand | the day | appointment; knowledge; regard |
| success_at_cost | Forger named, but the steward sent the clerk away, so the findings rest on the master's word | the council's witness | appointment; knowledge; regard |
| failure | No forger named | the council's case | the town thinks less of them |
| critical_failure | A master's word against the town's own copy, or the wrong clerk named | the council's case | the town thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (urban):** {actor} arrives in {location}, sent for by the town council.

**Spine (step 0), P2:** The town's charter frees its market from the count's tolls. The count's lawyers now call it a forgery. His steward, {cast:steward}, has brought a rival copy that gives the tolls back to him.

**Spine (step 0), P3:** Both copies carry the old king's seal, and nobody in {location} can say which one is false. The council asks {actor} to find out. The steward does not want an outsider reading his copy.

Word count, P1 + P2 + P3: 10 + 33 + 34 = **77**.

## 11. The Hand Per Step

### Step 0 — Weigh the two charters (eye 0.74, purpose "Weigh the two charters")

`deal: { count: 3, tags: ['insight', 'lore'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `charter.test_the_ink` | Test The Ink | Signature (entropy) — one-off, no `libraryCardId` | entropy | 2 | 0.12 | generic.decay | Let a breath of damp air reach both copies, so fresh writing blurs and old writing holds. |
| `charter.warm_the_wax` | Warm The Wax | Signature (energy) — one-off; never `card.boost.signature.energy` (brief: not at all) | energy | 1 | 0.09 | generic.energy | Raise the heat of the hearth beside the reading table, so a seal cast from a mould shows its seams. |

Band fragments:

- **Test The Ink** — critical_success: "The damp blurred the count's copy all over, and the town's copy did not run at all." · success: "The damp made the ink on the count's copy run at the edges, and the town's held." · near_miss: "The damp made a few letters on the count's copy run, too few to show the council." · failure: "The damp reached both copies, and the old ink ran as badly as the new."
- **Warm The Wax** — success_at_cost: "The hearth warmed the count's seal until its seams showed, and the steward moved both copies away from the fire." · failure: "The hearth warmed both seals, and neither showed a seam." · critical_failure: "The hearth grew so hot that the town's seal softened, and the steward's lawyers called it a cheap casting."

### Step 1 — Name the forger (eye 0.80, purpose "Name the forger")

`deal: { count: 3, tags: ['insight', 'social'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `charter.wake_old_guilt` | Wake Old Guilt | Signature (mind) — one-off, no `libraryCardId` (relabelled from Whisper: there is no next step to reveal) | mind | 2 | 0.12 | generic.memory | Send the count's clerks a night of bad dreams, so the one who made the copy comes to the table shaking. |
| `charter.crack_the_inkwell` | Crack The Inkwell | Stumble | chaos | 1 | 0.10 | generic.luck | Spill ink across the steward's papers, so fresh copies must be fetched from the clerks who wrote them. |

Band fragments:

- **Wake Old Guilt** — critical_success: "{cast:forger} came to the table grey from a night without sleep, and could not hold the pen still." · success: "One clerk came to the table without sleep, and it was {cast:forger}." · near_miss: "One clerk came to the table shaking, but the steward said the clerk was only ill." · failure: "The bad dreams found all three clerks, and every one of them came to the table shaking."
- **Crack The Inkwell** — success_at_cost: "Ink ran across the steward's papers, and the fresh copies came back in the same hand as the count's charter." · failure: "Ink ran across the steward's papers, but the steward had the fresh copies written by a town scribe." · critical_failure: "Ink ran across the steward's papers, and the steward blamed {actor} for it in front of the council."

Spheres across specials: entropy, energy, mind, chaos (4 distinct before the deal; entropy and energy are the corpus's least-used). Common option supplied by the deal. No rider authored. No card grants content. No special binds a `libraryCardId`. Card-type composition: step 0 Signature (entropy) + Signature (energy); step 1 Signature (mind) + Stumble (chaos). Mill lease: Cache + Signature (time) / Signature (order) + Kindled Ambition; boundary survey: Whisper + Stumble / Signature + Compulsion — no sibling repeats this composition.

## 12. Linear continuation (step 1 spine)

A false charter needs a scribe who can copy an old hand. {cast:steward} keeps three of the count's clerks at his side to write his papers, and any of them could have made it. If {actor} names the one who did, the findings are read out at the inquest in the town hall on court day, in three days, with the steward there to answer them. If not, {location} will think less of {actor}.

### Afterimages

Step 0:
- critical_success: Before noon they could show the council where the count's copy had been scraped and written over, and the mould marks on its seal.
- success: The count's copy was written in new ink on a scraped page, and its seal was cast from a mould.
- success_at_cost: They found the new ink on the count's copy, but only after the steward had kept it overnight.
- failure: They could not tell the two copies apart, and had only the council's word that the town's is the old one.
- critical_failure: They said aloud that the town's copy looked newer, and the steward's lawyers wrote it down.

Step 1:
- critical_success: {cast:forger} wrote out the charter's first line in the same hand as the count's copy, then said the steward had ordered it.
- success: Asked to write out the charter's first line, {cast:forger} wrote it in the same hand as the count's copy.
- success_at_cost: {cast:forger} wrote in the same hand as the count's copy, but the steward sent the clerk out of {location} before the council could hold anyone.
- failure: Each clerk wrote the line in a plain, careful hand, and {actor} could not say which of them made the copy.
- critical_failure: {actor} named the wrong clerk, and the steward had that clerk's own letters read out to prove it.

## 13. Aftermath Paragraph (per band)

- **critical_success:** The council locked both copies in the town chest under its own seal, with the steward watching.
- **success:** The council has the findings in writing, signed by {actor}.
- **success_at_cost:** The council has the findings, but with the clerk gone they rest on {actor}'s word alone.
- **failure:** The council has no answer for the count's lawyers, and it sent for a master to give it one.
- **critical_failure:** The count's lawyers now have a master's mistake to use against the town's charter.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the forward thread is the appointment, which the mortal keeps or misses by their own movement).

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| critical_success | — | reputation with {location} (gain) | knowledge | appointment |
| success | — | reputation with {location} (gain) | knowledge | appointment |
| success_at_cost | — | reputation with {location} (gain) | knowledge | appointment |
| failure | reputation with {location} (loss) | — | — | — |
| critical_failure | reputation with {location} (loss) | — | — | — |

Chip text (cause — detail; word count):
- bond (all success bands): title "A charter defended" · cause "The council's word on it" · detail "{location} thinks well of their work." (5 + 6 = 11).
- boon (all success bands): title "Who forged it" · cause "Made in the steward's household" · detail "{actor} knows who wrote the count's copy of the charter." (5 + 10 = 15). `stateNoun` `knowledge`; concept "who wrote the count's copy".
- path (all success bands): title "The inquest" · cause "Court day in the town hall" · detail "{cast:steward} answers the findings in {location} in three days." (6 + 9 = 15). `stateNoun` `appointment`, `entityId: '$appointment'`, concept "answers the findings".
- scar (failure): title "A charter left undefended" · cause "No forger named" · detail "{location} thinks less of their work." (3 + 6 = 9).
- scar (critical_failure): title "A wrong word" · cause "Said before the council" · detail "{location} thinks less of their work." (4 + 6 = 10). True on both paths: the step-0 word against the town's copy and the step-1 wrong clerk were both said before the council.

Page read (assembled, scar · bond · boon · path):
- **critical_success / success:** the overview names what the council now holds; BOND carries the regard and who spreads it; BOON who wrote the false copy; PATH the place and day. Nothing told twice.
- **success_at_cost:** the overview names the cost (the clerk gone, the findings on {actor}'s word alone), true on every path into the band; chips as success.
- **failure:** the overview says what the council lacks and why a master's failure costs more; the SCAR carries the regard.
- **critical_failure:** the overview says what the lawyers gained and why the extreme costs a master more; the SCAR names how it was lost and carries the regard. True on both paths.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `steward` | lazy-materialize-on-trigger | reuse steward/noble, else spawn steward "Aldric Vane" | must-persist | appointment counterparty; both sequels (`inheritContext`); PATH chip | ready |
| `forger` | lazy-materialize-on-trigger | spawn clerk "Wat Penrose" | must-persist | step 1 afterimages and fragments; knowledge record | ready |

## 17. Concept Art Direction

1. *Emotions:* an old freedom on trial, the weight of a single hand on a page, the cold of a hall full of the other side's people.
2. *Evocative image:* two parchments side by side on a bare table under a high window, one with a cracked wax seal, a quill laid across both, a tipped inkwell's stain spreading toward the edge. No people.

## 18. Self-Audit

| Item | Verdict |
|---|---|
| Opening ≤80 words | PASS (77) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS (entropy, energy, mind, chaos; deal supplies a common) |
| Every nudge has a failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step | PASS — step 0: CS/S/NM/F (Test) + SAC/F/CF (Warm); step 1: CS/S/NM/F (Wake) + SAC/F/CF (Crack) |
| Card types match mechanism | PASS — Wake Old Guilt relabelled Signature (mind); no special binds a `libraryCardId` (and never `card.boost.signature.energy`) |
| Consequence hand wired | PASS — knowledge (`intelligence` `political_secret`), story_seed (the appointment seed) |
| Appointment has missed branch; both sequels authored | PASS (§ 20) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Prose rule 7b | PASS — the later-tense promise (findings read out on court day) rides the appointment and its kept sequel; no overview promises the inquest's result |
| Steps within 0.72–0.85 | PASS (0.74, 0.80) |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` arrives in `{location}`, sent for by the town council.
2. P2 events with costs paid — the charter is called a forgery; the steward has brought a rival copy giving the tolls back.
3. P3 one stake — mystery: nobody can say which copy is false; the council asks {actor} to find out.
4. ≤80 words — 77.
5. Read aloud as a report — yes.
6. Stated, never encoded — "call it a forgery", "nobody can say which one is false", "does not want an outsider reading his copy".
7. Every sentence works — the stake (tolls), the accusation, the opposition, the mystery, the ask, the hostility.
8. Nothing unintroduced — the charter, the tolls, the steward, the rival copy and the seal precede step 0's cards; the clerks and the steward's papers precede step 1's cards.
9. One named person per beat — `{cast:steward}` on both spines; the forger is named only after the roll.
10. Stake in a sentence — "Can the council's master tell the true charter from the false one and name who forged it, and keep their name?"
11. Cards verb+noun, spell-style — Test The Ink, Warm The Wax, Wake Old Guilt, Crack The Inkwell (test, warm, wake, crack in `IMPERATIVE_VERB_LEXICON`); no effect line repeats a word of its name.
12. Opening per class — `urban`, written.

## 20. Sequels (seed-only, `drawable: false`, THR-1526) — `src/data/encounters/charter-inquest-sequels.ts`

Modelled on `mill-lease-sequels.ts`: one step each, `intrinsicTier: 'background'`, no `locationSubtypes`, outside the factory catalog (`town.` prefix), `inheritContext` carries `{cast:steward}`.

### `town.charter_inquest_heard` — The Inquest Heard (kept)

- Reach **eye 0.40** (`CHARTER_INQUEST_HEARD_DIFFICULTY`). The findings are already made; this step holds them against the steward's lawyers. One step, `fail_action`, purpose **"Read out the findings"**, `crudType: 'read'`, `motivations: ['revelation_discretion']`.
- `narrativeTemplate`: "{name} is in the town hall in {location} on court day. The bench sits for the inquest, and {cast:steward} stands for the count. If {name}'s findings hold against the steward's lawyers, the bench lets the town's charter stand."
- successAfterimage: "The steward's lawyers found no fault in the findings. The bench let the town's charter stand, and the market stays free of the count's tolls."
- failureAfterimage: "The steward's lawyers picked at the findings until the bench put off its ruling to the next court."
- successMetadata: `reputation_with $here +0.05` · `bond_change withAgentId '$cast:steward' sentimentDelta −0.06 trustDelta 0.02` (the steward lost, and knows who beat him).
- failureMetadata: `reputation_with $here −0.03`.
- narrativeTemplates: initiation "{name} is in the town hall on court day, where the inquest hears the findings." · success "The bench let the town's charter stand." · failure "The bench put off its ruling."
- aftermathConfig fallback overview: "{name} kept court day in the town hall, with the count's steward there to answer." (no chips, per the sequel precedent).

### `town.charter_inquest_defaulted` — The Inquest Defaulted (missed)

- Reach **heart 0.45** (`CHARTER_INQUEST_DEFAULTED_DIFFICULTY`), one step, `fail_action`, purpose **"Answer the steward"**, `crudType: 'read'`, `motivations: ['loyalty_ambition']`.
- `narrativeTemplate`: "{name} was not in the town hall on court day, and the findings were never read. The bench let the count's copy stand. {cast:steward} has come looking for {name} with a purse, to buy the written findings and burn them." The template places the mortal nowhere: the town hall is where they were not, because the missed branch fires wherever the mortal stands.
- successAfterimage: "{name} swore to the findings before witnesses, and {cast:steward} left with his purse still full."
- failureAfterimage: "{cast:steward} thinks less of the master who stayed away, and says so at the count's table."
- successMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.04 trustDelta 0.03`.
- failureMetadata: `bond_change withAgentId '$cast:steward' sentimentDelta −0.08 trustDelta −0.1` · `reputation_with targetAgentId '$cast:steward' −0.04`. Never `$here`.
- narrativeTemplates: initiation "The findings were not read on court day, and the count's steward has come looking." · success "{name} swore to the findings before witnesses." · failure "The steward thinks less of the master who stayed away."
- aftermathConfig fallback overview: "Nobody read the findings on court day, and the count's copy of the charter stands." (no chips).

*Rule 7b note:* neither sequel binds the mortal to a later place or time. The kept sequel reports a finished act (the charter upheld, or the ruling put off). The missed sequel's "to buy the written findings and burn them" is the steward's motive, not a later act the engine owes; its success reports a finished act, and its failure reports the steward's standing, which the writes back.

## Experience Differentiator Gate

1. YES · 2. YES · 3. YES · 4. YES — "The council's master must tell the true charter from the false one and name the forger, or lose their name." · 4b. YES after fixes (editorial § 1, § 6b) · 5. YES · 6. YES after relabel (Wake Old Guilt → Signature) · 7. YES · 8. YES — the copies / the seal / the clerks' sleep / the steward's papers · 9. YES — ink, seal, the guilty clerk, the hand on fresh copies · 9b. YES · 10. YES · 11. YES · 11b. YES after fixes (editorial § 6b) · 12. N/A (short) · 13. N/A (short) · 14. YES.
