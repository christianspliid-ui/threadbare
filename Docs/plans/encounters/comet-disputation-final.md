# Encounter Pipeline: The Comet Disputation
> Scale: short | Slug: comet-disputation | Pass: final
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-1, slot 4 (THR-1678)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | A public disputation over a comet. The fork is agent-decided on `revelation_discretion`: hold the champion's chart up (Seeker) or leave it lying (Sentinel). The consequence hand is `secret` + `drive`. |
| Editorial | PASS WITH REVISIONS | Step 1 is now true after a failed step 0. The opening establishes the haze. 11 seam echoes were fixed. Overviews rewritten as present-tense rulings. Chip cause clauses dropped. |
| Systems | READY WITH CAVEATS | The ambition id was switched so the grant-liveness gate passes. A step-0 failure debit was added so the step-0 critical_failure path writes something. The unbackable crit-fail compulsion chip was removed. The favour chip shape was confirmed. |

### Caveats / Blockers

1. **Regenerate the package from this file.** The existing `comet-disputation.package.json` is a stale draft stub, with pre-editorial prose and `narrativeTemplates: "x"`. Run the dry-run `compile:encounter` and then `check:encounter`; the dry run alone misses gates (#1114).
2. **Two `TraitVariant.factorLine`s are required** by the type. The lines in § 19 are systems proposals, and the editor or orchestrator must confirm the wording. `narrativeTemplates` (initiation / success / failure) must also be authored at packaging.
3. **Ambition `no_free_slot`.** This is corpus-wide and engine-side. `assignAmbitionToActor` refuses an actor who already holds 2 active ambitions (about 21% of actors in a mature world). On that path the PATH · ambition chip claims a write that did not land. The same limitation applies to `the-broken-seal` and `the-drowned-archive`.
4. **Batch variance.** Slot 6 (`drowned-mans-testimony`) lands the same `ambition_uncover_secrets` and an `explore` compulsion. The batch report should note it, or re-pick one slot. The only other gate-passing fit is `ambition_arcane_enlightenment`.
5. **Live-proof evidence.** At expert difficulty the proof ascendant loses most runs (#1111/#1113). Use a seed sweep plus pinned bands, and observe the step-0 critical_failure debit.

### Orchestrator decision after systems (2026-09-30) — supersedes the ambition id below

Caveat 4 is taken: the package ships **`ambition_arcane_enlightenment`** ("Achieve Arcane Enlightenment", `AMBITION_TEMPLATES`, `src/data/ambition-templates.ts:412`), not `ambition_uncover_secrets`, so the batch does not land the same ambition as slot 6. Both pass the grant-liveness gate. Wherever this file says `ambition_uncover_secrets` / "Uncover Ancient Secrets", read `ambition_arcane_enlightenment` / "Achieve Arcane Enlightenment"; the PATH chip detail is "{actor} is pursuing Achieve Arcane Enlightenment now." `narrativeTemplates` and the two trait factor lines were authored at packaging (see the package's `doc` block). Package critic: PACKAGE PASS (`comet-disputation-package.md`).

### Editorial Notes Summary

Editorial passed the design with local prose fixes only:

- Step 1 narratives no longer claim that the agent's own chart is sound, since that is false after a failed step 0.
- The opening now says "argue the comet's meaning" and establishes the haze that Part The Clouds acts on (79 words).
- Eleven seam echoes were removed. "at dawn" no longer appears in step-0 outcome lines.
- All ten overviews now lead with the gates and state the fair as a present-tense ruling (rule 7b).
- `way` was cut from the Sentinel success overview.
- Chip cause clauses were dropped as retelling.
- The compulsion detail became "restless to explore for a while".

### Systems corrections applied in this file

- **(a)** `ambition_chase_the_wonder` → **`ambition_uncover_secrets`**. The old id lives in `EVENT_MINTED_AMBITION_TEMPLATES`, and `check:encounter`'s `validateNudgeGrantRefs` checks `assign_ambition` in step metadata against `AMBITION_TEMPLATES` only. The PATH chip detail changed to match (§ 0, § 5, § 13, § 15, § 19).
- **(b)** The favour chip uses the fair-bout shape. There is no `stateNoun.entityId`; the champion goes in `concepts`.
- **(c)** On a step-0 critical_failure the fork key **is** recorded before the action ends, so the **recorded arm's** critical_failure band renders, not necessarily the fallback. Both crit-fail overviews are true on that path. The § 13 parenthetical is corrected.
- **(c′) New write.** Step 0 carries `failureMetadata: [reputation_with $here −0.03]`, following the well-sinking and crowns-reckoning precedent, so the step-0 crit-fail path backs its SCAR reputation chip. The SCAR compulsion chip is removed from both `critical_failure` bands, because nothing plants a compulsion on that path.
- **(d)** success_at_cost is left without a band-keyed write, because none exists: metadata is half-keyed and `EffectPredicate` has no band predicate. On the step-0-failure route the new debit makes that band's standing gain smaller; on the near_miss route the cost is carried in prose.
- **(e)** Every tooltip id, image tag, trait, NPC role, bias key, sphere and deal tag was verified live (see the systems file § 4e).
- **(f)** THR-1685: no person-anchored reputation chip.

### Implementation File Map

- `Docs/plans/encounters/comet-disputation.package.json` is regenerated from this file. `compile:encounter` produces the module, its test and both registrations; do not hand-edit those.
- At closeout, stamp `hook.underground_city` `usedBy` in `src/data/content-eval/plotHooks.ts`.
- No engine, type, UI or art changes.

---

## Encounter Packet

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| **Crux** | The town's college of star-readers has named the agent a false reader over the comet, and the agent must beat the college's champion in a public disputation before the council. |
| **Title** | *The Comet Disputation* — a public argument about a comet. Glance test: the complication (a disputation) and its subject (the comet) are both in the title. |
| **id** | `encounter.town.comet_disputation` (binding, brief row 4) |
| **Reach** | Star on both steps (binding). Star is travel, fate and navigation. Step 0 is *about* charting a moving body's course truly. Step 1 is *about* reading fate aloud and making a town follow the reading. |
| **Steps** | Step 0 is star 0.58 (`steep`); step 1 is star 0.68 (`severe`) on both fork arms. The mean is 0.63 and the window fit 0.77, which is expert. **Measurement note:** the fork step carries no top-level difficulty, so `measure:roll-spread` reads step 0 only (0.58, window fit 0.72, still inside the expert band 0.65–0.85). |
| **Shape** | Danger – Confrontation – Aftermath (brief). Step 0 is the danger announced: the college has named the agent a false reader, the disputation is at dawn, and the night's charting tests whether the agent has an answer. Step 1 is the confrontation, the disputation itself. The aftermath is banded. |
| **System target** | Forks: an agent-decided `ActionStepBranch` on step 1, `decidedBy: { axis: 'revelation_discretion' }`. |
| **The fork** | At the disputation the champion's own night chart lies on the table, and it shows the comet leaving, against the college's doctrine. **Seeker (`positive`)**: the agent holds it up before the council. This is a bigger public win (larger standing gain) with no favour. **Sentinel (`negative`)**: the agent leaves it where it lies and argues from their own reading of the sky. This is a smaller public win, and the champion owes the agent for it. Both arms are star 0.68. The two step-0 specials carry opposite pole leans, so the god has a lever on the decision. |
| **Rolled dice** | p3Shape **contest** (P2: the college's champion is present and wants the council's ear, the same thing the agent wants) · opposition **faction (doctrine)**: the college and its orthodoxy that every comet means plague · disposition **neutral**: the champion is courteous and formal, not hostile · agentRole **the target**: the college named the agent a false reader · scale **settlement**: the council's verdict decides whether the town gates shut before the fair. |
| **plotHook** | Rolled: hook.underground_city, hook.haunt_resolution, hook.stronghold_raid. **Taken: hook.underground_city**, drifted. The "older settlement below the known one, with its own politics" is read as the college: an old institution inside the town with its own doctrine and its own reasons, which the agent only sees into through the champion's private chart. Haunt resolution and stronghold raid fought the pleasure register the brief asks of this slot. |
| **Whose problem?** | The agent's. The college named *them*, and their name as a star-reader is what is at stake. |
| **Why here?** | `chance`. The agent is in town while the comet hangs over it, and said openly what it means. |
| **Consequence hand (binding)** | `secret` + `drive`, no swap. **secret**: `favor_creation`, debtor `$cast:champion`, on the Sentinel arm's success half. The agent kept the champion's own chart out of the disputation, and the champion owes them for it. **drive**: `assign_ambition` `ambition_uncover_secrets` on both arms' success half. A reader who has seen the college's own chart contradict its doctrine wants to know what else the learned keep to themselves. `plant_compulsion` `{ explore: 0.5 }`, 96 ticks, on both arms' failure half: a reader who lost the argument is restless to go and look. *(Systems: the id was switched from `ambition_chase_the_wonder`, which fails the grant-liveness gate.)* |
| **Standing** | `reputation_with` `$here`: +0.08 on Seeker success, +0.05 on Sentinel success, −0.06 on step-1 failure (both arms), and **−0.03 on step-0 failure** (systems addition, so the step-0 critical_failure path is backed). This is the expert penalty: reputation before money. |
| **Cool failure?** | Nobody is hurt, jailed or branded. The council shuts the gates on the college's word, the agent's name as a reader suffers in the town, and on a lost disputation they leave restless to explore. |
| **Systems quota** | Three, the floor: cast (`champion`), rewards (`favor_creation` and `assign_ambition` persist), and reputation (`reputation_with`). |
| **Trait hooks** | Gate: none (everyday by construction, no rule gates). Variant: **Guiding** (`trait.personality.star.virtue`) +0.04; **Proud** (`trait.core.core_humility.vice`) −0.04. The factor lines are proposed in § 19. Trait-only nudge: none (the two special slots per step are spent on the pole-lean pair and the confrontation's levers). Trait fragment: none. |
| **Mortal choice?** | Yes: reveal the champion's chart or keep it quiet (`revelation_discretion`). `motivations: ['revelation_discretion', 'tradition_novelty']`: the fork's own axis, unpinned so mortals on both arms are drawn, plus the orthodoxy axis the scene is about. |
| **Promise → payoff** | The spine asks whether the comet means plague. Step 1's base prose answers it (the champion's own chart shows the comet leaving), and the bands pay it off (gates open or shut). |
| **Prose rule 7 / 7b** | The college, the champion's chart and the doctrine are scene-local. The agent's public claim is an event of this scene. No sentence promises later behaviour the engine does not enact. The ambition and the compulsion are the only forward state, and their chips say only what the mortal now wants. The fair is stated as the council's ruling now (open / called off), never as a future event. |
| **Tier** | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief). |

## 1. Inspiration Anchors

- **hook.underground_city** (taken, drifted): an institution with its own politics under the town's surface. The college's doctrine is public; its champion's private reading is not. That gap is the fork.
- **Seed dice (contest + faction doctrine + neutral)**: a courteous, formal opponent, not a villain, who is bound by an orthodoxy they privately doubt. This is what makes the Sentinel arm tempting: mercy to a rival who is not an enemy.
- **Anti-patterns avoided**:
  - the agent as bystander (they are the one named);
  - a hostile-by-default opposition (the champion is neutral);
  - failure as punishment (failure is a lost argument and a lost name, and it leaves the agent restless);
  - a hand that chooses the ending (the god leans; the mortal decides whether to reveal).
- **Brief tone target**: the batch's one *pleasure*, a public disputation the whole town turns out for.

## 2. Scale Justification

Short: two beats (the night's charting, the dawn disputation) and one fork. The stakes are a town's gates and one expert's name, which a short encounter carries fully. A third beat would only repeat what the aftermath bands already write.

## 3. Pressure Knot

A comet has hung over the town for four nights. The college of star-readers has told the council it means plague and wants the gates shut before the spring fair. The agent has said openly that the college is wrong, and the college has answered by naming the agent a false reader. The council will hear both at dawn, in the market square.

## 4. Intervention Fantasy

The god works the sky and the square: it clears the haze so the course shows, slows the hours so the course can be checked, hushes a crowd, shakes a rival's voice, and makes the comet flare at dawn. The god can also lean the mortal toward speaking out or holding their tongue about the rival's own chart, without ever making the choice.

## 5. Cast and World Objects

| Object | What | Binding |
|---|---|---|
| `{cast:champion}` | the college's first reader, the champion in the disputation | `supportBundle` actor. Reuses `sage` / `scholar` / `oracle`, else spawns a `sage` named "Maudry Fenn". Must persist (favour debtor). Towns roster only `sage` (0.4); cities and capitals roster all three |
| the college of star-readers | the learned body and its doctrine | scene-local; no faction node claimed |
| the council | the town's council, which rules on the gates | scene-local role noun |
| `{location}` | the town | `$here`, the reputation anchor |
| the champion's night chart | the private chart that shows the comet leaving | scene-local object; drives the fork |
| ambition `ambition_uncover_secrets` | the winner's new aim ("Uncover Ancient Secrets") | member of `AMBITION_TEMPLATES` (`ambition-templates.ts:678`). Passes `validateNudgeGrantRefs` (systems correction) |
| compulsion (`explore`) | the loser's urge | `plant_compulsion` |

## 6. Beat Structure

1. **Step 0: Chart the comet's path** (star 0.58, `continue_weakened`). The night before the disputation. The test is reading the comet's course truly through haze. The step is nudge-bearing: 2 specials (the pole-lean pair) plus a deal of 4 (`lore`, `journey`). **`failureMetadata`: `reputation_with $here −0.03`** (systems addition). A step-0 `critical_failure` ends the action (engine rule, `unifiedActionLifecycle.ts:205`). The fork key has already been recorded by then, so the recorded arm's critical_failure band renders, and its afterimage leads straight into the aftermath.
2. **Step 1: Win the disputation** (star 0.68, `fail_action`), forked on `revelation_discretion`:
   - `positive` (Seeker): the agent holds the champion's chart up before the council. Specials: Hush The Crowd and Unsettle The Champion, plus a deal of 4 (`social`, `presence`).
   - `negative` (Sentinel, also the fallback): the agent leaves the chart where it lies and argues from their own reading of the sky. Specials: Steady The Voice and Brighten The Tail, plus a deal of 4 (`social`, `presence`).

## 7. Branching Profile

- Branch depth: `light` · Branch count: **2**
- Where branching lives: step 1 scene prose, step 1 hand, the outcome ladder, and the aftermath (per-arm `byOutcome`).
- Convergence: both arms end at the council's verdict on the gates. They differ in how large the standing change is and whether the champion owes a favour.
- Shape: Danger – Confrontation – Aftermath, with the confrontation step as a Personality Fork (agent-decided, THR-894).

## 8. Branching Map

Step 0 resolves, whatever its band. The engine reads the agent's `revelation_discretion` position plus the net pole lean of the committed step-0 cards, and records `positive` or `negative`. If step 0 critically failed, the action then ends at the recorded arm's critical_failure band.

- `positive` → step 1 prose: the chart held up.
  - Success: larger town standing, ambition.
  - Failure: the champion dismisses the chart as an apprentice's exercise; standing falls, compulsion.
- `negative` → step 1 prose: the chart left lying.
  - Success: smaller town standing, a favour owed by the champion, ambition.
  - Failure: the doctrine's simpler story wins; standing falls, compulsion.

## 9. Outcome Ladder

| Band | Progress | Spent | Opened |
|---|---|---|---|
| critical_success | the gates stay open for the fair; the doctrine becomes the joke of the market | nothing | standing up; ambition; (Sentinel) a favour owed |
| success | the gates stay open | the college's goodwill | standing up; ambition; (Sentinel) a favour owed |
| success_at_cost | the gates stay open after a long argument | the champion's courtesy (and, after a failed night's chart, part of the standing gain) | standing up; ambition; (Sentinel) a favour owed |
| failure | the gates are shut on the college's word and the fair called off | the agent's name as a reader in the town | standing down; compulsion to explore |
| critical_failure | the gates are shut and the council thanks the college before the square | the agent's name, in public | standing down (compulsion only if step 1 ran; not chipped) |

## 10. Sample Opening (narrator mode, ≤80 words: opening 11 + spine 68 = 79)

> {actor} is in {location} on the fourth night of the comet.
>
> The college of star-readers says the comet means plague and wants the gates shut before the fair. It has named {actor} a false reader for saying otherwise. At dawn {actor} must argue the comet's meaning before the council, against {cast:champion}, the college's first reader. Tonight, through haze, {actor} charts the comet's course.
>
> The council will follow the winner, and the loser's name as a star-reader will suffer.

## 11. The Hand Per Step

### Step 0: Chart the comet's path (star 0.58) · deal `{ count: 4, tags: ['lore', 'journey'] }`

**Part The Clouds**: `comet.part_the_clouds` · type Boost (lean) · sphere light · essence 2 · Δ 0.10 · `poleLean: revelation_discretion → positive` · image `generic.light`
- effectLine: "Thin the haze across the night sky, so the comet shows plain until dawn. Clear sight makes them readier to speak out."
- success: "The haze thinned, and the comet's tail showed plain all night."
- near_miss: "The haze thinned, but only for the last hour of the night."
- failure: "The haze thinned overhead, but the western sky stayed thick."

**Slow The Hours**: `comet.slow_the_hours` · type Whisper (lean) · sphere time · essence 2 · Δ 0.10 · `poleLean: revelation_discretion → negative` · image `generic.focus`
- effectLine: "Stretch the night for them, so there is time to check each reading twice. Long thought makes them readier to hold their tongue."
- critical_success: "The night ran long for {actor}, and the course checked true every time."
- success_at_cost: "The night ran long, and {actor} spent every hour of it awake."
- failure: "The night ran long, and {actor} spent it checking the same wrong line."
- critical_failure: "The long night made {actor} doubt a sound chart, and they changed it."

Base afterimages (step 0):
- critical: "By midnight the chart was done: the comet runs east, away from {location}."
- success: "The chart was done before morning. The comet is moving east, away from {location}."
- success_at_cost: "The chart was done, but {actor} had no sleep before the disputation."
- failure: "Cloud came in before midnight, and the chart has a gap in it."
- critical_failure: "In the dark {actor} got the comet's path wrong, and found the mistake too late to fix."

### Step 1, `positive` (Seeker): Win the disputation (star 0.68) · deal `{ count: 4, tags: ['social', 'presence'] }`

Narrative: "At dawn the council sits in the market square, and half of {location} comes to watch. {cast:champion} reads the college's doctrine: every comet brings plague. But the champion's own night chart lies open on the table, and it shows the comet leaving. {actor} holds the chart up for the council to see."

**Hush The Crowd**: `comet.hush_the_crowd` · type Boost · sphere order · essence 2 · Δ 0.12 · image `generic.crowd`
- effectLine: "Silence the onlookers' chatter, so the council hears every word of the argument."
- success: "The square went quiet, and the council heard every word {actor} said about the chart."
- near_miss: "The square went quiet, then a heckler shouted over the end of it."
- failure: "The square went quiet for {actor}, and the council heard the doctrine just as clearly."

**Unsettle The Champion**: `comet.unsettle_the_champion` · type Stumble · sphere chaos · essence 1 · Δ 0.09 · image `generic.rumor`
- effectLine: "Put a catch in the rival's voice, so the council hears doubt in the doctrine."
- critical_success: "{cast:champion} lost the thread of the doctrine halfway, and the council saw it."
- success_at_cost: "{cast:champion} stumbled once, then recovered and answered {actor} sharply."
- failure: "{cast:champion} stumbled, and the council put it down to nerves."
- critical_failure: "{cast:champion} stumbled, and the square cheered the champion on through it."

Afterimages:
- critical: "The council saw the college's own chart show the comet leaving, and voted before the college could object."
- success: "The council read the champion's chart and took {actor}'s side."
- at cost: "The council believed the chart, after an hour of the college's objections."
- failure: "{cast:champion} called the chart an apprentice's exercise, and the council believed it."
- critical failure: "The council called the chart a forgery, and the square jeered {actor} for bringing it."

### Step 1, `negative` (Sentinel; also the fallback) · deal `{ count: 4, tags: ['social', 'presence'] }`

Narrative: "At dawn the council sits in the market square, and half of {location} comes to watch. {cast:champion} reads the college's doctrine: every comet brings plague. But the champion's own night chart lies open on the table, and it shows the comet leaving. {actor} leaves the chart where it lies and argues from their own reading of the sky."

**Steady The Voice**: `comet.steady_the_voice` · type Boost · sphere mind · essence 2 · Δ 0.12 · image `generic.focus`
- effectLine: "Keep their argument calm and exact, so the council can follow each step of it."
- success: "{actor} walked the council through the course line by line, and was heard to the end."
- near_miss: "{actor} kept calm, but lost the council for a moment at the hardest part."
- failure: "{actor} stayed calm and exact to the end, but the council stopped listening halfway."

**Brighten The Tail**: `comet.brighten_the_tail` · type Omen · sphere light · essence 2 · Δ 0.10 · image `generic.light`
- effectLine: "Make the comet flare at dawn, so the whole square can see which way it points."
- critical_success: "The comet flared east as the sun came up, and the square went quiet."
- success_at_cost: "The comet flared, and the college called the flare a warning."
- failure: "The comet flared, and {cast:champion} read the flare as plague coming."
- critical_failure: "The comet flared, and half the square ran home to bar their doors."

Afterimages:
- critical: "The council followed {actor}'s course across the sky and voted before the champion could answer."
- success: "The council followed {actor}'s reading of the course."
- at cost: "The council followed {actor}'s reading after an hour of the college's objections."
- failure: "The council found the doctrine easier to believe than the course."
- critical failure: "The council asked {actor} to stop before the argument was done."

## 12. Branch-Dependent Later Paragraphs

- **Seeker:** "But the champion's own night chart lies open on the table, and it shows the comet leaving. {actor} holds the chart up for the council to see."
- **Sentinel:** "But the champion's own night chart lies open on the table, and it shows the comet leaving. {actor} leaves the chart where it lies and argues from their own reading of the sky."

(These are folded into the step 1 narratives and bands above, not separate fields.)

## 13. Aftermath (overviews per arm per band)

**Seeker (`positive`)**. Base overview: "The council has ruled on the gates before the whole square." Base `changes: []`.
- critical_success: "The gates stay open for the fair. By noon the college's doctrine was the joke of the market."
- success: "The gates stay open. The college lost in public, on its own chart."
- success_at_cost: "The gates stay open for the fair. {cast:champion} left the square without a word to {actor}."
- failure: "The gates are shut on the college's word, and the spring fair is called off."
- critical_failure: "The gates are shut, the spring fair is called off, and the council thanked the college before the whole square."

**Sentinel (`negative`, and the template `fallback`)**. Base overview: "The council has ruled on the gates before the whole square." Base `changes: []`.
- critical_success: "The gates stay open for the fair. {cast:champion} found {actor} after the vote and thanked them for leaving the chart on the table."
- success: "The gates stay open. The college's chart was never mentioned, and {cast:champion} knows {actor} kept it quiet."
- success_at_cost: "The gates stay open for the fair. {cast:champion} left the square knowing {actor} had held back."
- failure: "The gates are shut on the college's word, and the spring fair is called off. {cast:champion} took the win and never mentioned the chart."
- critical_failure: "The gates are shut, and the council thanked the college before the whole square. {cast:champion}'s own chart showed the comet leaving, and it went back to the college unread."

(Systems correction: on a step-0 critical_failure the fork key is recorded *before* the action ends, so **the recorded arm's** critical_failure band renders there, not necessarily the fallback. Both critical_failure overviews are true on that path, where step 1 never ran and the chart was never shown.)

**Chips.** Chips are keyed by band. Every chip is backed by a write that fires on that band on every path that reaches it. No chip carries a `causeClause`, because the overview already carries the cause.

- **Success bands (critical_success, success, success_at_cost), both arms:**
  - BOND · `reputation with {location}`. Kind `reputation`, gain. `stateNoun: { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`, concept "thinks better of" → `ui.standing`. Detail: "{location} thinks better of {actor}'s star-reading."
  - PATH · `ambition`. Kind `growth`, direction `opens`. `stateNoun: { text: 'ambition', tooltipId: 'ui.ambition' }`, concept "Uncover Ancient Secrets" → `ui.ambition`. Detail: "{actor} is pursuing Uncover Ancient Secrets now."
- **Success bands, Sentinel and fallback only:**
  - BOND · `a favour owed`. Kind `shell_state`. `stateNoun: { text: 'a favour owed', tooltipId: 'ui.favour_owed' }`, with **no** `entityId`. `concepts: [{ text: '{cast:champion}', entityId: '$cast:champion', visualKind: 'agent' }]`, as in `fair-bout`. Detail: "{cast:champion} owes {actor} a favour."
- **failure, both arms:**
  - SCAR · `reputation with {location}`. Kind `reputation`, loss, anchor `$here` as above, concept "trusts" → `ui.standing`. Detail: "{location} trusts {actor}'s star-reading less."
  - SCAR · `compulsion`. `stateNoun: { text: 'compulsion', tooltipId: 'ui.compulsion' }`, concept "restless to explore" → `ui.compulsion`. Detail: "{actor} is restless to explore for a while."
- **critical_failure, both arms:**
  - SCAR · `reputation with {location}`, identical to the failure chip.
  - **No compulsion chip** (systems correction). On the step-0 critical_failure path nothing plants a compulsion. On the step-1 critical_failure path the compulsion is still written, but not chipped.

## 14. Aftermath Reaction Choices

None. The consequence is clean: the encounter is short, and the fork already carried the mortal's choice.

## 15. Aftermath Kit Summary

- Standing with the town goes up or down.
- On a win, an ambition: Uncover Ancient Secrets.
- On a Sentinel win, a favour owed by the college's champion.
- On a lost disputation, a timed compulsion toward exploring.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `champion` (actor) | lazy-materialize-on-trigger | reuse `sage` / `scholar` / `oracle`, else spawn `sage` "Maudry Fenn" | must-persist | `owes_favor` debtor | ready (verified) |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope `urban`, one opening | PASS |
| Opening ≤80 words | PASS (79) |
| Hands: 2 specials + deal on every nudge-bearing step | PASS |
| Six StepOutcomes covered by specials per step | PASS (step 0, positive, negative) |
| Every special has a failure fragment; no Δ ≥ 0.15 | PASS |
| No digits in effect lines; no name word repeated in effect line | PASS |
| Consequence hand wired (secret: favor_creation; drive: assign_ambition + plant_compulsion) | PASS |
| Systems ≥3 (cast, rewards, reputation) | PASS |
| Cast: one actor, class-honest for urban | PASS (towns roster only sage, so the spawn fallback covers them) |
| No condition on `$actor`, no Heavy Hand, no grants | PASS |
| Prose rule 7b | PASS (systems sweep: every forward sentence is backed; no placed promise) |
| THR-1685: no `{target}` chip noun on a person | PASS |
| Step 1 reads correctly whatever step 0's band | PASS |
| Seam echoes | PASS (11 fixed) |
| Page read, every band, both arms | PASS (editorial § 6b; crit_failure now shows one SCAR chip) |
| **Systems: grant liveness** | PASS after the id switch |
| **Systems: Law 56 on every path** | PASS after the step-0 debit and the crit-fail compulsion chip removal |

**Carry-forwards, resolved by Pass 3:**
1. Ambition id switched.
2. Favour chip shape confirmed.
3. The step-0 crit-fail path renders the recorded arm, and the prose is true on it. A backing write was added.
4. success_at_cost: no band-keyed write exists. The step-0 debit shrinks the gain on one route; the prose carries the cost on the other.
5. Factor lines: no static step `factorLines` are authored. The `TraitVariant.factorLine`s are required and are proposed in § 19.

## 18. Concept Art Direction

- Emotions: vindication, public judgement, a truth held back.
- Image: an empty town-hall step at dawn, a rolled chart left on a trestle table with its ribbon untied, and a pale comet low over the rooftops behind. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES (the fork is agent-decided; the player only leans) · 10 YES · 11 YES · 11b YES · 12 N/A (short) · 13 N/A (short) · 14 YES

## 19. Package field spec (systems)

These are the fields the compiler needs that are not stated above.

**Template:**
- `id: 'encounter.town.comet_disputation'`, `name: 'The Comet Disputation'`, `reach: 'star'`
- `rarityTier: 2`, `intrinsicTier: 'shaping'`, `scale: 'local'`, `apCost: 1`, `crudType: 'update'`
- `actorAffinities: ['individual']`, `motivations: ['revelation_discretion', 'tradition_novelty']`, `settings: ['urban']`
- `openings.urban` as in § 10, line 1. The spine (§ 10, P2 + P3) is step 0's `narrativeTemplate`.

**Step effects:**

| Site | `successMetadata.effects` | `failureMetadata.effects` |
|---|---|---|
| step 0 (`purposeLine: "Chart the comet's path"`) | none | `reputation_with { targetLocationId: '$here', delta: -0.03 }` |
| step 1 `positive` (`purposeLine: "Win the disputation"`) | `reputation_with $here +0.08`; `assign_ambition { templateId: 'ambition_uncover_secrets', targetAgentId: '$actor' }` | `reputation_with $here -0.06`; `plant_compulsion { targetAgentId: '$actor', encounterBias: { explore: 0.5 }, durationTicks: 96 }` |
| step 1 `negative` and `fallback` (identical) | `reputation_with $here +0.05`; `favor_creation { magnitudeRange: [0.15, 0.3], context: 'Kept the champion's own chart out of the disputation', debtorAgentId: '$cast:champion' }`; `assign_ambition` as above | as `positive` |

**Other fields:**
- `aftermathConfig`: `branchOnStep: 0`; `variants.positive` / `variants.negative`; `fallback` = the Sentinel copy. Each has base `changes: []` and all five bands in `byOutcome`, as in § 13.
- `supportBundle`: as in § 16, with `supportRole: 'college_champion'`.
- `traitVariants` (`factorLine` is required, ≤12 words). **[Systems proposal; editor or orchestrator to confirm wording]**:
  - `trait.personality.star.virtue`, `forecastDelta: 0.04`: "Being Guiding, they read the sky aloud and a crowd follows."
  - `trait.core.core_humility.vice`, `forecastDelta: -0.04`: "Being Proud, they bristle at being named a false reader."
- `narrativeTemplates.initiation / success / failure` are **still to author at packaging**, in the fair-bout shape (one plain sentence each: the college accuses a stranger over the comet / the disputation ended well / ended badly).
