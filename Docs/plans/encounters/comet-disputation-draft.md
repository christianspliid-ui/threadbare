# Encounter Pipeline: The Comet Disputation
> Scale: short | Slug: comet-disputation | Pass: draft
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-1, slot 4 (THR-1678)

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| **Crux** | The town's college of star-readers has named the agent a false reader over the comet, and the agent must beat the college's champion in a public disputation before the council. |
| **Title** | *The Comet Disputation* — a public argument about a comet. Glance test: the complication (a disputation) and its subject (the comet) are both in the title. |
| **id** | `encounter.town.comet_disputation` (binding, brief row 4) |
| **Reach** | star, both steps (binding). Star is travel, fate, navigation: step 0 is *about* charting a moving body's course truly; step 1 is *about* reading fate aloud and making a town follow the reading. |
| **Steps** | step 0 star 0.58 (`steep`) → step 1 star 0.68 (`severe`, both fork arms). Mean 0.63; window fit 0.77 — expert. **Measurement note:** the fork step carries no top-level difficulty, so `measure:roll-spread` reads step 0 only (0.58, window fit 0.72, still inside the expert band 0.65–0.85). |
| **Shape** | Danger – Confrontation – Aftermath (brief). Step 0 is the danger announced: the college has named the agent a false reader and the disputation is at dawn; the night's charting is the test of whether the agent has an answer. Step 1 is the confrontation, the disputation itself. Aftermath is banded. |
| **System target** | forks: an agent-decided `ActionStepBranch` on step 1, `decidedBy: { axis: 'revelation_discretion' }`. |
| **The fork** | At the disputation the champion's own night chart lies on the table, and it agrees with the agent's reading, not the college's doctrine. **Seeker (`positive`)**: the agent holds it up before the council — a bigger public win (larger standing gain), no favour. **Sentinel (`negative`)**: the agent leaves it where it lies and argues from the sky alone — a smaller public win, and the champion owes the agent for it. Both arms are star 0.68. The two step-0 specials carry opposite pole leans, so the god has a lever on the decision. |
| **Rolled dice** | p3Shape **contest** (P2: the college's champion is present and wants the council's ear, the same thing the agent wants) · opposition **faction (doctrine)** — the college and its orthodoxy that every comet means plague · disposition **neutral** — the champion is courteous and formal, not hostile · agentRole **the target** — the college named the agent a false reader · scale **settlement** — the council's verdict decides whether the town gates shut before the fair. |
| **plotHook** | Rolled: hook.underground_city, hook.haunt_resolution, hook.stronghold_raid. **Taken: hook.underground_city**, drifted: the "older settlement below the known one, with its own politics" is read as the college — an old institution inside the town with its own doctrine and its own reasons, which the agent only sees into through the champion's private chart. Haunt resolution and stronghold raid fought the pleasure register the brief asks of this slot. |
| **Whose problem?** | The agent's: the college named *them*, and their name as a star-reader is what is at stake. |
| **Why here?** | `chance` — the agent is in town while the comet hangs over it, and said openly what it means. |
| **Consequence hand (binding)** | `secret` + `drive`, no swap. **secret** — `favor_creation`, debtor `$cast:champion`, on the Sentinel arm's success half: the agent kept the champion's own chart out of the disputation, and the champion owes them for it. **drive** — `assign_ambition` `ambition_chase_the_wonder` on both arms' success half (a reader who won the argument about the comet wants to see where it leads); `plant_compulsion` `{ explore: 0.5 }`, 96 ticks, on both arms' failure half (a reader who lost it means to prove the course on the road). |
| **Standing** | `reputation_with` `$here`: +0.08 Seeker success, +0.05 Sentinel success, −0.06 failure (both arms). This is the expert penalty: reputation before money. |
| **Cool failure?** | Nobody is hurt, jailed or branded. The council shuts the gates on the college's word, the agent's name as a reader suffers in the town, and they leave wanting to prove the comet's course. |
| **Systems quota** | cast (`champion`) + rewards (`favor_creation`, `assign_ambition` persist) + reputation (`reputation_with`) — three, the floor. |
| **Trait hooks** | Gate: none (everyday by construction, no rule gates). Variant: **Guiding** (`trait.personality.star.virtue`) +0.04; **Proud** (`trait.core.core_humility.vice`) −0.04. Trait-only nudge: none (the two special slots per step are spent on the pole-lean pair and the confrontation's levers). Trait fragment: none. |
| **Mortal choice?** | Yes — reveal the champion's chart or keep it quiet (`revelation_discretion`). `motivations: ['revelation_discretion', 'tradition_novelty']` — the fork's own axis unpinned (both arms' mortals drawn) plus the orthodoxy axis the scene is about. |
| **Promise → payoff** | The spine asks whether the comet means plague. Step 1's base prose answers it (the comet is moving east and away), and the bands pay it off (gates open or shut). |
| **Prose rule 7 / 7b** | The college, the champion's chart and the doctrine are scene-local. The agent's public claim is an event of this scene. No sentence promises later behaviour the engine does not enact: the ambition and the compulsion are the only forward state, and their chips say only what the mortal now wants. |
| **Tier** | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief). |

## 1. Inspiration Anchors

- **hook.underground_city** (taken, drifted): an institution with its own politics under the town's surface — the college's doctrine is public, its champion's private reading is not. That gap is the fork.
- **Seed Dice — contest + faction doctrine + neutral**: a courteous, formal opponent (not a villain) who is bound by an orthodoxy they privately doubt. This is what makes the Sentinel arm tempting: mercy to a rival who is not an enemy.
- **Anti-patterns avoided**: the agent as bystander (they are the one named); a hostile-by-default opposition (the champion is neutral); failure as punishment (failure is a lost argument and a lost name, and it sends the agent after the comet); a hand that chooses the ending (the god leans; the mortal decides whether to reveal).
- **Brief tone target**: the batch's one *pleasure* — a public disputation the whole town turns out for.

## 2. Scale Justification

Short: two beats (the night's charting, the dawn disputation) and one fork. The stakes are a town's gates and one expert's name, which a short encounter carries fully; a third beat would be the aftermath the aftermath bands already write.

## 3. Pressure Knot

A comet has hung over the town for four nights. The college of star-readers has told the council it means plague and wants the gates shut before the spring fair. The agent has said openly that the college is wrong, and the college has answered by naming the agent a false reader. The council will hear both at dawn.

## 4. Intervention Fantasy

The god works the sky and the square: clears the night so the course shows, slows the hours so it can be checked, hushes a crowd, shakes a rival's voice, makes the comet flare at dawn. And the god can lean the mortal toward speaking out or holding their tongue about the rival's own chart, without ever making the choice.

## 5. Cast and World Objects

| Object | What | Binding |
|---|---|---|
| `{cast:champion}` | the college's first reader, the champion in the disputation | `supportBundle` actor, reuse `sage` / `scholar` / `oracle`, spawn `sage` "Maudry Fenn", must-persist (favour debtor) |
| the college of star-readers | the learned body and its doctrine | scene-local; no faction node claimed |
| the council | the town's council, which rules on the gates | scene-local role noun |
| `{location}` | the town | `$here` — reputation anchor |
| the champion's night chart | the private chart that agrees with the agent | scene-local object; drives the fork |
| ambition `ambition_chase_the_wonder` | the winner's new aim | live `AMBITION_TEMPLATES` member |
| compulsion (`explore`) | the loser's urge | `plant_compulsion` |

## 6. Beat Structure

1. **Step 0 — Chart the comet's path** (star 0.58, `continue_weakened`). The night before the disputation, on the town wall. Test: read the comet's course truly. Nudge-bearing: 2 specials (pole-lean pair) + deal 4 (`lore`, `journey`).
2. **Step 1 — Win the disputation** (star 0.68, `fail_action`), forked on `revelation_discretion`:
   - `positive` (Seeker): holds the champion's chart up before the council. Specials: Hush The Crowd, Unsettle The Champion + deal 4 (`social`, `presence`).
   - `negative` (Sentinel, also the fallback): leaves the chart where it lies and argues from the sky alone. Specials: Steady The Voice, Brighten The Tail + deal 4 (`social`, `presence`).

## 7. Branching Profile

- Branch depth: `light` · Branch count: **2**
- Where branching lives: step 1 scene prose, step 1 hand, outcome ladder, aftermath (per-arm `byOutcome`).
- Convergence: both arms end at the council's verdict on the gates; they diverge in how large the standing change is and whether the champion owes a favour.
- Shape: Danger – Confrontation – Aftermath, with the confrontation step as a Personality Fork (agent-decided, THR-894).

## 8. Branching Map

Step 0 resolves → engine reads the agent's `revelation_discretion` position + net pole lean of committed step-0 cards → records `positive` or `negative`.
- `positive` → step 1 prose: the chart held up. Success: larger town standing, ambition. Failure: the champion dismisses the chart as an apprentice's exercise; standing falls, compulsion.
- `negative` → step 1 prose: the chart left lying. Success: smaller town standing, a favour owed by the champion, ambition. Failure: the doctrine's simpler story wins; standing falls, compulsion.

## 9. Outcome Ladder

| Band | Progress | Spent | Opened |
|---|---|---|---|
| critical_success | the council keeps the gates open; the square repeats the agent's reading | nothing | standing up; ambition; (Sentinel) a favour owed |
| success | the council keeps the gates open | the college's goodwill | standing up; ambition; (Sentinel) a favour owed |
| success_at_cost | the gates stay open after a long hour of argument | the champion's courtesy | standing up; ambition; (Sentinel) a favour owed |
| failure | the council shuts the gates on the college's word | the agent's name as a reader in the town | standing down; compulsion to follow the comet |
| critical_failure | the council shuts the gates and thanks the college before the square | the agent's name, in public | standing down; compulsion |

## 10. Sample Opening (narrator mode, ≤80 words — opening 11 + spine 68 = 79)

> {actor} is in {location} on the fourth night of the comet.
>
> The college of star-readers says the comet means plague and wants the gates shut before the fair. It has named {actor} a false reader for saying otherwise. At dawn {actor} must dispute the comet before the council against {cast:champion}, the college's first reader. Tonight {actor} charts its course.
>
> The council will act on the reading that wins, and the loser's name as a star-reader will suffer in {location}.

## 11. The Hand Per Step

### Step 0 — Chart the comet's path (star 0.58) · deal `{ count: 4, tags: ['lore', 'journey'] }`

**Part The Clouds** — `comet.part_the_clouds` · type Boost (lean) · sphere light · essence 2 · Δ 0.10 · `poleLean: revelation_discretion → positive` · image `generic.light`
- effectLine: "Thin the haze across the night sky, so the comet shows plain until dawn. A clear sight argues for speaking out."
- success: "The haze thinned, and the comet's tail showed plain until dawn."
- near_miss: "The haze thinned, but only for the last hour of the night."
- failure: "The haze thinned overhead while cloud rolled in from the west."

**Slow The Hours** — `comet.slow_the_hours` · type Whisper (lean) · sphere time · essence 2 · Δ 0.10 · `poleLean: revelation_discretion → negative` · image `generic.focus`
- effectLine: "Stretch the night for them, so there is time to check each reading twice. Long thought argues for keeping quiet."
- critical_success: "The night ran long for {actor}, and the course checked true every time."
- success_at_cost: "The night ran long, and {actor} spent every hour of it awake."
- failure: "The night ran long, and {actor} spent it checking the same wrong line."
- critical_failure: "The long night made {actor} doubt a sound chart, and they changed it."

Base afterimages (step 0):
- critical: "By midnight they had the comet's course, and it runs east, away from the town."
- success: "They charted the comet's course. It is moving east, away from the town."
- success_at_cost: "They charted the course, and came down off the wall at dawn without sleep."
- failure: "Cloud came in before midnight, and their chart has a gap in it."
- critical_failure: "They charted the comet wrong in the dark, and found the mistake only at dawn."

### Step 1, `positive` (Seeker) — Win the disputation (star 0.68) · deal `{ count: 4, tags: ['social', 'presence'] }`

Narrative: "At dawn the council sits on the steps of the town hall, and half of {location} comes to watch. {cast:champion} reads the college's doctrine: every comet brings plague. The champion's own night chart lies open on the table. It shows the comet moving east and away, as {actor}'s does. {actor} holds it up for the council to see."

**Hush The Crowd** — `comet.hush_the_crowd` · type Boost · sphere order · essence 2 · Δ 0.12 · image `generic.crowd`
- effectLine: "Quiet the onlookers, so every word they speak carries to the council."
- success: "The square went quiet, and the council heard every word {actor} said about the chart."
- near_miss: "The square went quiet, then a heckler shouted over the end of it."
- failure: "The square went quiet for {actor}, and the council heard the doctrine just as clearly."

**Unsettle The Champion** — `comet.unsettle_the_champion` · type Stumble · sphere chaos · essence 1 · Δ 0.09 · image `generic.rumor`
- effectLine: "Put a catch in the rival's voice as they read, so the council hears the doubt in it."
- critical_success: "{cast:champion} lost the thread of the doctrine halfway, and the council saw it."
- success_at_cost: "{cast:champion} stumbled once, then recovered and answered {actor} sharply."
- failure: "{cast:champion} stumbled, and the council put it down to nerves."
- critical_failure: "{cast:champion} stumbled, and the square cheered the champion on through it."

Afterimages: critical "The council saw the college's own chart agree with {actor}, and laughed at the doctrine." · success "The council saw the college's own chart agree with {actor}." · at cost "The council believed the chart, after an hour of the college's objections." · failure "{cast:champion} called the chart an apprentice's exercise, and the council believed it." · critical failure "The council called the chart a forgery, and the square jeered {actor} for bringing it."

### Step 1, `negative` (Sentinel; also the fallback) · deal `{ count: 4, tags: ['social', 'presence'] }`

Narrative: "At dawn the council sits on the steps of the town hall, and half of {location} comes to watch. {cast:champion} reads the college's doctrine: every comet brings plague. The champion's own night chart lies open on the table. It shows the comet moving east and away, as {actor}'s does. {actor} leaves it where it lies and argues from the sky alone."

**Steady The Voice** — `comet.steady_the_voice` · type Boost · sphere mind · essence 2 · Δ 0.12 · image `generic.focus`
- effectLine: "Keep their argument calm and exact under scorn, so the council can follow each step of it."
- success: "{actor} walked the council through the course line by line, and nobody interrupted."
- near_miss: "{actor} kept calm, but lost the council for a moment at the hardest part."
- failure: "{actor} argued calmly and exactly, and the council found the doctrine simpler."

**Brighten The Tail** — `comet.brighten_the_tail` · type Omen · sphere light · essence 2 · Δ 0.10 · image `generic.light`
- effectLine: "Make the comet flare at dawn, so the whole square can see which way it points."
- critical_success: "The comet flared east as the sun came up, and the square went quiet."
- success_at_cost: "The comet flared at dawn, and the college called the flare a warning."
- failure: "The comet flared at dawn, and {cast:champion} read the flare as plague coming."
- critical_failure: "The comet flared, and half the square ran home to bar their doors."

Afterimages: critical "The council followed {actor}'s course across the sky and voted before the champion could answer." · success "The council followed {actor}'s reading of the course." · at cost "The council followed {actor}'s reading after an hour of the college's objections." · failure "The council found the doctrine easier to believe than the course." · critical failure "The council thanked the college and asked {actor} to stop."

## 12. Branch-Dependent Later Paragraphs

- **Seeker:** "{actor} holds the champion's chart up for the council. The square sees the college's first reader agree with the stranger, on paper, in the college's own hand."
- **Sentinel:** "{actor} leaves the champion's chart where it lies. {cast:champion} sees that {actor} has seen it, and says nothing either."

(Folded into the step 1 narratives and bands above; not separate fields.)

## 13. Aftermath (overviews per arm per band)

**Seeker (`positive`)** — fallback overview: "The disputation is over, and the whole square saw how it went."
- critical_success: "The council kept the gates open, and the fair will go ahead. By noon the square was repeating {actor}'s reading, and the college's chart was the joke of the market."
- success: "The council voted to keep the gates open. The college lost in public, on its own chart."
- success_at_cost: "The council kept the gates open after a long hour of argument. {cast:champion} left the steps without a word to {actor}."
- failure: "The council shut the gates on the college's word. {location} sends for its star-readers by name, and today the name it trusted was the college's."
- critical_failure: "The council shut the gates and thanked the college before the whole square. {actor} was left holding a chart nobody would look at."

**Sentinel (`negative`, and the template fallback)** — overview: "The disputation is over, and the whole square saw how it went."
- critical_success: "The council kept the gates open, and the fair will go ahead. {cast:champion} found {actor} after the vote and thanked them for leaving the chart on the table."
- success: "The council voted to keep the gates open. The college's chart was never mentioned, and {cast:champion} knows who kept it that way."
- success_at_cost: "The council kept the gates open after a long hour of argument. {cast:champion} left the steps knowing {actor} had held back."
- failure: "The council shut the gates on the college's word. {location} sends for its star-readers by name, and today the name it trusted was the college's."
- critical_failure: "The council shut the gates and thanked the college before the whole square. The chart that would have won it stayed on the table."

**Chips** (band-keyed; every chip backed by a write on its band):
- success bands, both arms: BOND · `reputation with {location}` (gain) — "{location} thinks better of their star-reading." · PATH · `ambition` — cause "Won the argument over the comet" — "{actor} is pursuing Chase the Wonder now."
- success bands, Sentinel only: BOND · `a favour owed` — "{cast:champion} owes {actor} a favour."
- failure bands, both arms: SCAR · `reputation with {location}` (loss) — "{location} trusts their star-reading less." · SCAR · `compulsion` — cause "Lost the argument over the comet" — "For a while {actor} will wander after its course."

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the fork already carried the mortal's choice).

## 15. Aftermath Kit Summary

Standing with the town up or down; on a win an ambition (Chase the Wonder); on a Sentinel win a favour owed by the college's champion; on a loss a timed compulsion toward exploring.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `champion` (actor) | lazy-materialize-on-trigger | reuse `sage`/`scholar`/`oracle`, else spawn `sage` "Maudry Fenn" | must-persist | `owes_favor` debtor | ready |

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
| Cast: one actor, class-honest for urban (sage in town and city) | PASS |
| No condition on `$actor`, no Heavy Hand, no grants | PASS |
| Prose rule 7b | PASS |
| THR-1685: no `{target}` chip noun on a person | PASS (favour uses `a favour owed`; no bond-change chip) |

## 18. Concept Art Direction

Emotions: vindication, public judgement, a truth held back. Image: an empty town-hall step at dawn, a rolled chart left on a trestle table with its ribbon untied, a pale comet low over the rooftops behind. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES (the fork is agent-decided; the player only leans) · 10 YES · 11 YES · 11b YES · 12 N/A (short) · 13 N/A (short) · 14 YES
