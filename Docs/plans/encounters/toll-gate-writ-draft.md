# Encounter Pipeline: The Writ at the Toll Gate
> Scale: medium | Slug: toll-gate-writ | Pass: draft
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-2, slot 2 (THR-1679)

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| **Crux** | The toll-master at a town gate asks the agent to judge a travelling family's writ of passage, and the writ is a good forgery. |
| **Title** | *The Writ at the Toll Gate*. Glance test: the object in doubt (a writ) and the place (the toll gate) are both in the title. |
| **id** | `encounter.town.toll_gate_writ` (binding, brief row 2) |
| **Reach** | Eye (binding; primary by `primaryReachOf`: step 0 and the Seeker arm are Eye). Step 0 is *about* reading a document truly. The Seeker arm is *about* tracing a hidden maker. The Sentinel arm is Heart (brief, binding): keeping a trust you have just spent. |
| **Steps** | Step 0 eye 0.60 (`steep`) → fork: `positive` eye 0.64 (`steep`) · `negative` heart 0.62 (`steep`). Mean 0.62 (Seeker path 0.62, Sentinel path 0.61); window fit 0.76, expert. **Measurement note:** the fork step carries no top-level difficulty, so `measure:roll-spread` reads step 0 only (0.60, window fit 0.74, inside the expert band 0.65–0.85). |
| **Shape** | Personality Fork (brief): a test, then an agent-decided branch (THR-894) with pole-specific continuations. |
| **System target** | Cards (packet roll); the fork is the shape. `decidedBy: { axis: 'revelation_discretion' }` on step 1, `branchOnStep: 0`. |
| **Value axis (verified)** | `revelation_discretion` is a live `ValuePair` (`src/types/agent.ts:15`) and Eye's own axis (`REACH_VALUE_PAIR.eye`, `src/types/axisRegistry.ts` → `eye_axis`, Seer/Perceptive ↔ Inquisitor/Judgemental). Legacy pole names: Seeker (+1) / Sentinel (−1). Chosen over `mercy_ruthlessness` (already three shipped forks) because the scene is literally reveal-or-keep-quiet. |
| **The fork** | **Seeker (`positive`)**: the agent names the writ false. The family is held for the town's court, and the agent goes into the town to find who cut the seal (eye 0.64). **Sentinel (`negative`)**: the agent vouches for the family and says nothing of the forgery. The family goes through free of toll, and under the charter the writ is now the agent's to answer for; the toll-master asks why a sound writ took so long to read (heart 0.62). Step 0's two specials carry opposite pole leans, so the god has a lever on the decision. |
| **Rolled dice** | p3Shape **choice** (P2 establishes two courses, both costly: naming it false sends a family to court; passing it puts the agent's name on a forgery) · opposition **faction / institution (territory)**: the town's toll charter and its toll house, with the toll-master as its face · disposition **open**: the toll-master trusts the agent enough to ask · agentRole **trespasser**: the agent is a stranger entering the charter's ground at its gate, and the charter makes whoever passes a writ there answer for it · scale **personal**: one family and one expert's name. |
| **plotHook** | Rolled: hook.followed_on_the_road, hook.mad_artificer, hook.broken_alliance. **Taken: hook.mad_artificer**, drifted. "Someone brilliant has been building things for years, unsupervised, and the results are wandering" becomes an old seal-cutter in the town who has copied the toll seal for years and sells false writs cheap to families who cannot pay the toll. The writs are the results that wander the roads. The vault page's tonal note (a noble goal by illegal means) is the moral knot of the fork. Followed-on-the-road would have made the family's pursuer the story; broken alliance wanted two powers the slot's personal scale cannot carry. |
| **Whose problem?** | The agent's. They are asked to rule, and whatever they rule, their name answers for it under the charter. |
| **Why here?** | `chance`: the agent reaches the gate behind the family. |
| **Consequence hand (binding)** | Rolled with `npm run draw:consequences -- encounter.town.toll_gate_writ --reach eye --rarity 2` → **`knowledge` + `movement`**, no swap. **knowledge**: `intelligence` (`political_secret`, "Who copies the toll seal") on both arms' success half. Seeker finds the seal-cutter; Sentinel is told by the family on the road (lower reliability: hearsay). **movement**: `agent_relocation` (`away`, `travel`) on both arms' success half, branch-keyed in fiction: Seeker is wanted at the county court to swear to the reading; Sentinel walks on with the family. |
| **Standing** | `reputation_with` `$here`: +0.06 Seeker success; −0.06 Seeker failure; −0.08 Sentinel failure (a vouched forgery costs more than a failed search); **−0.03 on step-0 failure**, so a step-0 `critical_failure` (which ends the action) backs its SCAR chip. Reputation before money: the expert penalty. |
| **Favour** | `favor_creation`, debtor `$cast:traveller`, on the Sentinel arm's success half: the family owes the stranger who vouched for them. (Extra wiring beyond the drawn hand; it carries the Rewards block, since neither `intelligence` nor `agent_relocation` is in `PERSISTENT_EFFECT_KINDS`.) |
| **Cool failure?** | Nobody is killed, jailed or branded. The family may be held for the court; the agent is never held. Failure is the town trusting the agent's eye less, said plainly, with the reason it costs more for an expert. |
| **Systems quota** | cast (`tollmaster`, `traveller`) + rewards (`favor_creation`; reaction `favor_creation` / `bond_change`) + reputation (`reputation_with`) = three, the floor. Knowledge and movement are wired but do not count toward the quota. |
| **Trait hooks** | Gate: none (everyday by construction). Variant: **Perceptive** (`trait.personality.eye.virtue`) +0.04; **Judgemental** (`trait.personality.eye.vice`) −0.04. Both ids are generated by `personalityTraitId(reach, pole)` (`src/data/personality-trait-content.ts:111`). Trait-only nudge: none (both special slots per step are spent). Trait fragment: none. |
| **Mortal choice?** | Yes: reveal the forgery or keep quiet and vouch (`revelation_discretion`). `motivations: ['revelation_discretion', 'mercy_ruthlessness']`: the fork's own axis unpinned (both arms' mortals drawn), plus the mercy axis the family's fate is about. No `motivationPoles`. |
| **Promise → payoff** | The spine states the writ is forged and asks which cost the agent will pay. Step 0 pays off *how* it is forged (a copy of the town's own seal). The Seeker arm pays off *who* made it; the Sentinel arm pays off whether the toll house believes the agent. Both success halves pay off the maker's identity as `intelligence`. |
| **Prose rule 7 / 7b** | The charter, the toll house, the seal-cutter and the family's writ are scene-local. "who knows seals" in the spine reads the draw (an expert-band Eye mortal), not history. Forward sentences: "is wanted there to swear to the reading" is backed by `agent_relocation`; "the writ is now {actor}'s to answer for" is a present-tense state of the charter, backed on failure by the reputation debit. No place-and-time promise. |
| **Tier** | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief). |
| **Tags** | None authored. No seated family tag fits (`#watch_errand` names the Civic Guard); the brief mints none. |

## 1. Inspiration Anchors

- **hook.mad_artificer** (taken, drifted): the vault's *Mad Artificer Stronghold* gave the tonal note that decided the fork: the maker may be pursuing a decent goal by illegal means. The seal-cutter sells writs cheap to families who cannot pay the toll. That makes the Seeker arm cost something (a family and a craftsman go before a court) and the Sentinel arm cost something (the agent's name on a crime).
- **Thematic Pillars, Compassion vs Power**: the charter is power used fairly by its own lights. Mercy to the family is the harder, costlier choice for an expert whose name is their living. Neither arm is "right".
- **Anti-Patterns avoided**: the Dark Lord problem (the forger is a craftsman with a reason, the toll-master an honest official); Player as Savior (the god leans the reading and the room; the mortal decides); failure as punishment (failure is a lost name at one gate, and the story goes on).
- **Seed dice (choice + faction territory + open + trespasser)**: an open, trusting official is what makes the Sentinel arm hurt. The agent is spending the trust of someone who was kind to them.
- **Dilemma Library**: not consulted for the choice set, because the choice is agent-decided on a registry axis rather than an authored dilemma card.

## 2. Scale Justification

Medium. There are two beats (the reading, then the pole's continuation) and an aftermath where the player picks which thread to carry forward. The fork gives each arm its own second beat, and the stakes (a family's liberty, an expert's name, the maker of false writs) are larger than a short scene resolves in its ending alone. A third beat would only restage the court or the road, which the aftermath and the relocation already carry.

## 3. Pressure Knot

A family on the road carries a writ of passage that frees them of the town's toll. The writ is a forgery on a copy of the town's own toll seal, cut by an old seal-cutter in the town who has sold such writs for years to families who cannot pay. The toll-master has doubts and no way to prove them. The town's toll charter makes whoever passes a writ at the gate answer for it.

## 4. Intervention Fantasy

The god works the light, the mind, the lanes and the crowd. It throws the sun across a page so the wax shows its seam, cools a stranger's contempt so they read patiently, leads them down the right lane first, puts a tremor in a forger's hand, warms an official, and turns a queue of carters to look the other way. It leans the mortal toward speaking out or keeping quiet, and never makes the choice.

## 5. Cast and World Objects

| Object | What | Binding |
|---|---|---|
| `{cast:tollmaster}` | the gate's toll-master, the charter's face | `supportBundle` actor. Reuse `clerk` / `guard_captain` (town rosters both; city and capital roster `guard_captain`), else spawn `clerk` "Reyne Holloway". **must-persist** (favour debtor on a Seeker reaction; `reputation_with` target on a Sentinel reaction). Never gendered in prose. |
| `{cast:traveller}` | the head of the travelling family | `supportBundle` actor, **spawn-only** (no `reuseNpcRoles`: a local reused as a travelling stranger would be placeless). Spawn `wanderer` "Oswin Farrow". **must-persist** (favour debtor; `bond_change` / `reputation_with` target). Never gendered in prose. |
| the family | the travellers the writ covers | scene-local; held for the court (Seeker), or through the gate (Sentinel) |
| the writ of passage | the forged document | scene-local object; the test's subject |
| the toll seal | the town's seal, copied | scene-local |
| the old seal-cutter | the maker | scene-local; named only in `intelligence` detail and prose |
| the toll charter / toll house | the town's toll law and office | scene-local institution; no faction node claimed |
| `{location}` / `$here` | the town | `reputation_with` anchor; overviews say "the town" (`{location}` may render a Place) |
| intelligence "Who copies the toll seal" | the maker's identity | `intelligence`, `political_secret` |
| relocation | Seeker to the county court; Sentinel on with the family | `agent_relocation` `away`, `travel` |

## 6. Beat Structure

1. **Step 0: Read the writ** (eye 0.60, `continue_weakened`). At the gate, in front of the queue. The test: see how the writ is forged. Nudge-bearing: 2 specials (the pole-lean pair) + deal 4 (`insight`, `craft`). `failureMetadata`: `reputation_with $here −0.03`. A step-0 `critical_failure` ends the action after the pole is recorded, so the recorded arm's `critical_failure` band renders; both are written to be true on that path.
2. **Step 1**, forked on `revelation_discretion` (`branchOnStep: 0`):
   - `positive` (Seeker, and the step `fallback`): **Trace the writ's maker** (eye 0.64, `fail_action`). Specials: Guide Their Steps, Shake A Steady Hand + deal 4 (`insight`, `shadow`).
   - `negative` (Sentinel): **Keep the toll-master's trust** (heart 0.62, `fail_action`). Specials: Kindle Goodwill, Turn Away Eyes + deal 4 (`social`, `presence`).

## 7. Branching Profile

- Branch depth: `light` · Branch count: **2**
- Where branching lives: step 1 scene prose, step 1 hand and reach, the outcome ladder, the aftermath (per-arm `byOutcome`), and the reaction choices.
- Convergence: both arms end with the maker known on a win (by search, or by confidence) and the agent on the road; on a loss, both end with the town trusting the agent's eye less. They diverge in who is held, who owes whom, and which trust the agent spent.
- Shape: Personality Fork (agent-decided, THR-894).
- Optional secondary template: none.

## 8. Branching Map

Step 0 resolves, whatever its band. The engine reads the agent's `revelation_discretion` position plus the net pole lean of the committed step-0 cards, and records `positive` or `negative`. On a step-0 `critical_failure` the action then ends at the recorded arm's `critical_failure` band.

- `positive` (Seeker) → step 1 prose: the writ named false, the family held, the agent searching the town.
  - Success: the seal-cutter found → intelligence (reliability 0.9), town standing up, relocation (county court). Reactions: speak for the family, or swear to the seal alone.
  - Failure: no one names the maker → the court lets the family go for want of proof; town standing down.
- `negative` (Sentinel) → step 1 prose: the agent vouches, the family goes through, the toll-master asks why.
  - Success: the toll-master drops it → the family's leader owes a favour, tells the agent who made the writ (intelligence, reliability 0.75), relocation (on with the family). Reactions: send the maker's name back to the toll house, or keep the family's secret whole.
  - Failure: the toll house finds the forgery → the family brought back and held; the forgery is the agent's to answer for; town standing down (larger).

## 9. Outcome Ladder

| Band | Progress | Spent | Opened |
|---|---|---|---|
| critical_success | Seeker: the maker found fast, the case goes up clean. Sentinel: the family through, written down as paid | nothing | Seeker: standing up, knowledge, the road to the county court. Sentinel: a favour owed, knowledge, the road with the family |
| success | as above | Seeker: the family's liberty. Sentinel: the agent's word, now on a forgery | as above |
| success_at_cost | Seeker: the maker found by nightfall. Sentinel: the family through after the agent is questioned before the carters | Seeker: the family held all day. Sentinel: the carters saw the agent questioned | as above (no band-keyed write exists; the cost is in prose) |
| failure | Seeker: no maker; the family let go. Sentinel: the forgery found; the family brought back and held | the agent's name at the gate | standing down |
| critical_failure | Seeker: the writ called false with no proof. Sentinel: a forged writ passed on the agent's word, and the whole gate knows | the agent's name, in public | standing down |

## 10. Sample Opening (narrator mode, ≤80 words: opening 14 + spine 63 = 77)

> {actor} reaches the toll gate of {location} in the morning, behind a travelling family.
>
> The family's writ of passage lets them through free of toll. The toll-master, {cast:tollmaster}, doubts it and asks {actor}, who knows seals, to judge it. The writ is forged, and forged well. Under the town's toll charter, whoever passes a writ answers for it.
>
> Naming it false sends the family to the town's court. Passing it puts {actor}'s own name on a forgery.

(`openings.urban` = P1. Step 0's `narrativeTemplate` = P2 + P3.)

## 11. The Hand Per Step

### Step 0: Read the writ (eye 0.60) · `purposeLine: 'Read the writ'` · deal `{ count: 4, tags: ['insight', 'craft'] }`

**Light The Page**: `writ.light_the_page` · type Whisper (lean) · sphere light · essence 2 · Δ 0.10 · `poleLean: { axis: 'revelation_discretion', toward: 'positive' }` · image `generic.light`
- effectLine: "Turn the morning sun full across the writ, so every stroke of ink and wax shows. Seeing plainly makes them readier to speak out."
- success: "The sun fell full across the writ, and the wax showed its seam."
- near_miss: "The sun lit the ink, but a cloud crossed before it reached the seal."
- failure: "The sun lit every stroke, and every stroke looked right."

**Temper Their Scorn**: `writ.temper_their_scorn` · type Compulsion (lean) · sphere mind · essence 2 · Δ 0.10 · `poleLean: { axis: 'revelation_discretion', toward: 'negative' }` · image `generic.focus`
- effectLine: "Cool any contempt for the family, so they read the writ slowly and miss no fault. Patience makes them readier to keep a secret."
- critical_success: "{actor} read the writ without haste or scorn, and saw every fault in it."
- success_at_cost: "{actor} read slowly and without scorn, and the carters behind the family began to shout."
- failure: "{actor} read the writ without scorn, and wanted it to be good."
- critical_failure: "{actor} read the writ as a friend would, and saw only what a friend would see."

Base afterimages (step 0):
- critical: "{actor} found the fault at once. The seal is a copy of the town's own toll seal, and a good one."
- success: "{actor} found the fault. The seal is a copy of the town's own toll seal."
- success_at_cost: "{actor} found the fault, but kept the family and the toll-master waiting half the morning."
- failure: "{actor} is sure the writ is wrong, but cannot point to the fault."
- critical_failure: "{actor} misread the seal in front of the whole gate, and {cast:tollmaster} saw it."

### Step 1, `positive` (Seeker; also the step `fallback`): Trace the writ's maker (eye 0.64) · `purposeLine: "Trace the writ's maker"` · deal `{ count: 4, tags: ['insight', 'shadow'] }`

Narrative: "{actor} names the writ false, and the family is held at the gate for the town's court. The court will want the maker as well. {cast:traveller}, who leads the family, will not say where the writ was bought. {actor} goes into the town to find who cut the seal."

**Guide Their Steps**: `writ.guide_their_steps` · type Whisper · sphere spirit · essence 2 · Δ 0.12 · image `generic.blessing`
- effectLine: "Lead them down the right lane first, so they reach the maker's door before word of the held family does."
- success: "{actor} took the right lane first and came straight to the seal-cutter's door."
- near_miss: "{actor} took the right lane, and found the shop shut until evening."
- failure: "{actor} took the right lane first, and walked past the shop without knowing it."

**Shake A Steady Hand**: `writ.shake_a_steady_hand` · type Stumble · sphere chaos · essence 1 · Δ 0.09 · image `generic.luck`
- effectLine: "Put a tremor in the maker's fingers at the bench, so the next seal cut there comes out botched."
- critical_success: "The seal-cutter botched a fresh copy of the seal, and {actor} found it on the bench."
- success_at_cost: "The seal-cutter botched a fresh seal and threw it in the fire before {actor} arrived."
- failure: "The seal-cutter's hand shook, and no one saw it but the seal-cutter."
- critical_failure: "The seal-cutter's hand shook, and the seal-cutter took it as a warning."

Afterimages:
- critical: "{actor} found the maker at the bench: an old seal-cutter who has copied the toll seal for years, and sells the writs cheap to families who cannot pay the toll."
- success: "{actor} found the maker: an old seal-cutter who has copied the toll seal for years."
- success_at_cost: "{actor} found the old seal-cutter by nightfall, after asking at every shop on the market."
- failure: "{actor} searched the town all day, and no one would say who cut the seal."
- critical_failure: "The seal-cutter heard that a writ had been stopped, and was gone before {actor} found the shop."

### Step 1, `negative` (Sentinel): Keep the toll-master's trust (heart 0.62) · `purposeLine: "Keep the toll-master's trust"` · deal `{ count: 4, tags: ['social', 'presence'] }`

Narrative: "{actor} vouches for the family, and they go through the gate without paying the toll. Under the charter, the writ is now {actor}'s to answer for. {cast:tollmaster} saw how long {actor} held the seal to the light, and asks why a sound writ took so long to read."

**Kindle Goodwill**: `writ.kindle_goodwill` · type Boost · sphere life · essence 2 · Δ 0.12 · image `generic.warmth`
- effectLine: "Warm the toll-master toward them, so the hardest questions are asked kindly."
- success: "{cast:tollmaster} warmed to {actor}, and asked the last question kindly."
- near_miss: "{cast:tollmaster} warmed to {actor}, but asked every question anyway."
- failure: "{cast:tollmaster} warmed to {actor}, and still did not believe them."

**Turn Away Eyes**: `writ.turn_away_eyes` · type Veil · sphere darkness · essence 2 · Δ 0.08 · image `generic.dark`
- effectLine: "Draw the waiting carters' attention elsewhere, so the toll-master can let it go without an audience."
- critical_success: "The carters turned to watch a loose cart horse, and no one heard {cast:tollmaster} let it go."
- success_at_cost: "The carters looked away, but a guard at the gate heard every word."
- failure: "The carters looked away, and {cast:tollmaster} asked the questions anyway."
- critical_failure: "The carters looked away, then looked back as {cast:tollmaster} raised the alarm."

Afterimages:
- critical: "{cast:tollmaster} took {actor}'s word without a second question."
- success: "{cast:tollmaster} took {actor}'s word and let the question drop."
- success_at_cost: "{cast:tollmaster} took {actor}'s word, but only after an hour of hard questions."
- failure: "{cast:tollmaster} did not believe {actor}, and sent a guard after the family."
- critical_failure: "{cast:tollmaster} sent a guard after the family before {actor} had finished speaking."

## 12. Branch-Dependent Later Paragraphs

- **Seeker (`positive`):** "{actor} names the writ false, and the family is held at the gate for the town's court. The court will want the maker as well. {cast:traveller}, who leads the family, will not say where the writ was bought. {actor} goes into the town to find who cut the seal."
- **Sentinel (`negative`):** "{actor} vouches for the family, and they go through the gate without paying the toll. Under the charter, the writ is now {actor}'s to answer for. {cast:tollmaster} saw how long {actor} held the seal to the light, and asks why a sound writ took so long to read."

(These are the step-1 narratives above, not separate fields. Each reads true after any step-0 band: neither claims the agent proved the forgery at the gate.)

## 13. Aftermath Paragraphs (overviews per arm per band)

`branchOnStep: 0`. `fallback` = the Seeker copy (matches the step `fallback`).

**Seeker (`positive`, and the template `fallback`).** Base overview: "The toll gate has its answer on the family's writ." Base `changes: []`.
- critical_success: "The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is wanted there to swear to the reading. No one at the toll house has seen a forgery this good caught so quickly."
- success: "The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is wanted there to swear to the reading."
- success_at_cost: "The case goes up to the county court, and {actor} is wanted there to swear to the reading. The family spent the whole day held at the gate while {actor} searched."
- failure: "No one would name the maker, and the town's court let the family go for want of proof. The toll house asked a trained eye so it would not have to guess, and {actor} gave it a guess."
- critical_failure: "{actor} called the writ false and could not prove it. The town's court let the family go, and the toll house calls {actor}'s reading a guess in front of every carter at the gate."

**Sentinel (`negative`).** Base overview: "The toll gate has its answer on the family's writ." Base `changes: []`.
- critical_success: "The family went through the gate free of toll, and the toll house wrote them down as paid. On the road outside, {cast:traveller} told {actor} who made the writ, and why it was sold so cheap."
- success: "The family went through the gate free of toll. On the road outside, {cast:traveller} told {actor} who made the writ."
- success_at_cost: "The family went through, and every carter at the gate watched {actor} being questioned. On the road outside, {cast:traveller} told {actor} who made the writ."
- failure: "The toll house read the writ again and found it false. The family was brought back from the road and held for the town's court. Under the charter the forgery is {actor}'s to answer for. The toll house trusted {actor}'s eye so it would not have to check the writ itself."
- critical_failure: "{actor} let a forged writ through the gate, and the toll house found it out the same day. The family is held for the town's court. Under the charter the forgery is {actor}'s to answer for, and every carter at the gate has heard whose word passed it."

(On a step-0 `critical_failure` step 1 never runs. Seeker's crit-fail overview stays true: the agent misread the seal and could not prove anything. Sentinel's stays true: an agent who misread a forged writ as good let it through. Both are flagged for Pass 2 to test on that path.)

**Chips.** Keyed by band, in `scar · bond · boon · path` order. Every chip is backed by a write that fires on that band on every path that reaches it. No chip carries a `causeClause`: the overview already carries the cause.

- **Seeker success bands (critical_success, success, success_at_cost):**
  - BOON · `reputation with {target}`. Kind `reputation`, gain. `stateNoun: { text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`, concept "trusts" → `ui.standing`. Detail: "The town trusts {actor}'s eye more." ← `reputation_with $here +0.06`. (On a step-0 failure route the net is +0.03, still a gain.)
  - BOON · `knowledge`. Kind `shell_state`, gain. `stateNoun: { text: 'knowledge', tooltipId: 'ui.knowledge' }`, concept "false writs" → `ui.knowledge`. Detail: "{actor} knows where the false writs on this road come from." ← `intelligence`.
  - PATH · `seed` (the shipped relocation shape: `assize-letter`, `the-broken-seal`). Kind `future_hook`, direction `opens`. `stateNoun: { text: 'seed', tooltipId: 'ui.aftermath_seed' }`, concept "travelling away". Detail: "{actor} is travelling away from {location} now." ← `agent_relocation`.
- **Sentinel success bands:**
  - BOND · `a favour owed`. Kind `shell_state`. `stateNoun: { text: 'a favour owed', tooltipId: 'ui.favour_owed' }`, **no** `entityId` (fair-bout / comet shape); `concepts: [{ text: '{cast:traveller}', entityId: '$cast:traveller', visualKind: 'agent' }]`. Detail: "{cast:traveller} owes {actor} a favour." ← `favor_creation`.
  - BOON · `knowledge`, as above. Detail: "{actor} knows a seal-cutter in town copies the toll seal." ← `intelligence`.
  - PATH · `seed`, as above. Detail: "{actor} is travelling away from {location} with the family." ← `agent_relocation`.
- **failure and critical_failure, both arms:**
  - SCAR · `reputation with {target}`, loss, anchor `$here` as above, concept "trusts" → `ui.standing`. Detail: "The town trusts {actor}'s eye less." ← step-1 `failureMetadata` (−0.06 Seeker / −0.08 Sentinel), or on the step-0 crit-fail route step 0's `failureMetadata` (−0.03).

THR-1685: no person-anchored `reputation with {target}` chip. Standing with the toll-master and the family moves only through reactions, which render as reactions, not chips.

## 14. Aftermath Reaction Choices

Offered on the three success-side bands of each arm (medium scale). Each is effect-backed; each is a stance, not a mechanical variant. No reactions on failure bands: the loss is the consequence, and it is clean.

**Seeker.** Prompt: "The case goes before the county court. What does {actor} carry there?"
- **Speak for the family** (id `writ.seek.speak_for_family`). Intent: "Tell the court the family bought the writ in good faith. The family's leader will think better of the mortal." Effect: `reputation_with { targetAgentId: '$cast:traveller', delta: 0.12 }`. *Stance: mercy. The law caught the wrong people; say so where it counts.* Thread preserved: a travelling family who remembers who spoke for them.
- **Swear to the seal alone** (id `writ.seek.swear_to_seal`). Intent: "Give the court the reading and no more. The toll-master owes the mortal for a clean case." Effect: `favor_creation { magnitudeRange: [0.15, 0.3], context: 'Swore to the forged toll seal and kept the case clean', debtorAgentId: '$cast:tollmaster' }`. *Stance: the charter. An expert's job is the reading; judgement belongs to the court.* Thread preserved: a toll house in debt to the agent.

**Sentinel.** Prompt: "{actor} knows who copies the toll seal. Who else hears it?"
- **Send the name to the toll house** (id `writ.sent.send_the_name`). Intent: "Write to the toll-master naming the seal-cutter, and leave the family out of it. The toll-master will think better of the mortal." Effect: `reputation_with { targetAgentId: '$cast:tollmaster', delta: 0.1 }`. *Stance: repair. Spare the family, give the town its forger, and win back the trust spent at the gate.*
- **Keep the family's secret whole** (id `writ.sent.keep_secret`). Intent: "Tell no one what the family said on the road. The family's leader will trust the mortal the more for it." Effect: `bond_change { withAgentId: '$cast:traveller', sentimentDelta: 0.15, trustDelta: 0.1 }`. *Stance: confidence. A secret given on the road is not the agent's to trade, even to a forger's cost.*

## 15. Aftermath Kit Summary

- **Seeker win:** standing with the town up; an intelligence record naming the old seal-cutter (reliable); the agent on the road to the county court; then either the family's leader thinks better of them or the toll-master owes them a favour.
- **Sentinel win:** the family's leader owes a favour; an intelligence record from the family's account (hearsay reliability); the agent on the road with the family; then either the toll-master thinks better of them again or the family's leader trusts them more.
- **Any loss:** standing with the town down (more on the Sentinel arm, where the agent's word passed a forgery).
- **The world remembers:** a named toll-master and a named traveller persist, each carrying a debt or a regard the agent earned.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `tollmaster` (actor) | lazy-materialize-on-trigger | reuse `clerk` / `guard_captain`, else spawn `clerk` "Reyne Holloway"; `supportRole: 'toll_master'` | must-persist | `owes_favor` debtor (Seeker reaction); `reputation_with` target (Sentinel reaction) | ready (roles verified in `LOCATION_ROLE_ROSTERS`) |
| `traveller` (actor) | lazy-materialize-on-trigger | spawn-only `wanderer` "Oswin Farrow"; `supportRole: 'family_head'` | must-persist | `owes_favor` debtor (Sentinel success); `reputation_with` / `bond_change` target (reactions) | ready (spawn role to verify at systems) |
| intelligence "Who copies the toll seal" | effect write on success | `intelligence` `political_secret` | must-persist (GameState record) | later `intel_referenced_prose` / scoring | ready |
| relocation intent | effect write on success | `agent_relocation` `away` | scene-only intent, TTL default | movement scoring | ready |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope `urban`, one opening | PASS |
| Opening ≤80 words (opening + spine) | PASS (77) |
| Narrator skeleton: P1 arrival, P2 events with cost, P3 one stake (choice) | PASS |
| One named person per beat (step 0 toll-master; Seeker traveller; Sentinel toll-master) | PASS |
| Hands: 2 specials + declared deal on every nudge-bearing step | PASS (step 0, positive, negative) |
| Six StepOutcomes covered by the specials per step | PASS (each pair splits success/near_miss/failure and crit/at-cost/failure/crit-fail) |
| Every special has a failure fragment; no Δ ≥ 0.15 | PASS (max 0.12) |
| Card names imperative verb + noun; no name word repeated in its effect line; no digits | PASS |
| Sphere spread across specials | PASS (light, mind, spirit, chaos, life, darkness); per-hand ≥4 relies on the deal |
| Type compositions differ from comet-disputation's | PASS (Whisper+Compulsion · Whisper+Stumble · Boost+Veil) |
| Over-exposed library cards as specials | PASS (none) |
| No Heavy Hand, no grants, no two-channel special, no zero-essence special | PASS |
| Consequence hand wired: knowledge (`intelligence` ×2), movement (`agent_relocation` ×2, branch-keyed) | PASS |
| Composition: steps, hand, setting, cast (2), rewards (`favor_creation`, `bond_change`), aftermath (5 bands × 2 arms + fallback), systems 3, images resolve | PASS (image tags verified in `encounter-image-library.ts`) |
| Law 56: every chip backed on every path that reaches its band | PASS (step-0 debit backs the crit-fail SCAR; success_at_cost carries the success writes because `successMetadata` fires on every `isStepSuccess`) |
| Prose rule 7 / 7b | PASS (see design block) |
| THR-1685 | PASS |
| Vagueness lexicon (outcome class) | PASS by read: no someone/nothing/anything/way/things/something in outcome fields |
| Annotation budget (≤1) | PASS by read: no not-but clause, no em-dash negation |
| Divine outcome-authorship | PASS |
| Nobody killed, jailed or branded; the family may be held, the mortal never | PASS |
| **FLAG: off-reach Sentinel step.** Heart 0.62 on an Eye-primary mortal is above `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) unless heart is their secondary. The brief binds it. Systems should confirm the hand still moves the forecast word for a typical expert on that arm, or record the caveat. | FLAG |
| **FLAG: step-0 crit-fail truth.** Both crit-fail overviews are written to be true when step 1 never ran; Pass 2 should read them on that path. | FLAG |
| **FLAG: relocation chip noun.** PATH · `seed` is the shipped shape for `agent_relocation` but names no seed; systems should confirm or supply a better noun. | FLAG |

## 18. Concept Art Direction

- **What emotions does this story convey?** Suspicion that cannot be proved, pity pulling against duty, and the weight of putting your name to something.
- **What image evokes them?** A toll-house counter at morning. A writ of passage lies open with its red wax seal slightly off true. Beside it are an empty ink-pot and a pen set down mid-word. Through the half-open gate behind, a road runs away into sun. No people.

## Experience Differentiator Gate

**Scene & Prose (Doctrine v2)**
1. YES. The skeleton is arrival · situation & complication · one stake (choice), 77 words, with real graph names.
2. YES. Every sentence is challenge, test or outcome, with no interior sensation.
3. YES. The toll-master, the family and its leader, the writ, the seal and the charter all appear before any card acts on them. The maker is introduced in the Seeker narrative ("find who cut the seal") before its cards.
4. YES. "A stranger must judge a forged writ at a toll gate: expose a family to the court, or put their own name on a forgery."

**Choices & Intervention (the nudge hand)**
5. YES. Every name is verb + noun, and every effect line is one or two direct sentences with no quote.
6. YES. Every special is essence-priced (1–2 pips); the deal brings library pricing.
7. YES. Every special carries a failure fragment.
8. YES. Each card acts on an established target: the writ's wax, the agent's contempt for the family, the lanes to the maker, the maker's hand, the toll-master, the carters in the queue.
9. YES. Step 0 offers light that reveals versus patience that reads. Seeker offers finding the door versus spoiling the forger's work. Sentinel offers warming the questioner versus removing the audience.
9b. YES. Every nudge-bearing step has a full hand, and the branch is agent-decided on `revelation_discretion`. The player only leans.

**Aftermath & Consequence**
10. YES. Every band has an overview landing before the chips.
11. YES. Consequences name the town, `{cast:traveller}` and `{cast:tollmaster}`.
11b. YES. The pages were read as one text. The overview tells the story, the chips name state (standing, knowledge, a favour, the road), and the reactions add a stance. Nothing is told twice.
12. YES. Two reactions are offered per arm on the success bands.
13. YES. Seeker offers mercy against the charter; Sentinel offers repair against confidence.

**Presentation**
14. YES. The art shows residue and absence: the seal off true, the pen set down, the open road.

## Branch Seduction Self-Check

- **Seeker.** *Why would a god want it?* To see a truth dragged into daylight and a trained eye proved right in public. *Fantasy of interference:* lighting the page and leading the search. *What it protects:* the charter, the agent's standing, and the next family the seal-cutter would sell to. *Distinct without labels?* Yes: a hunt through a town.
- **Sentinel.** *Why would a god want it?* To watch a mortal spend their own name on strangers and see if they can hold it. *Fantasy of interference:* warming a hard official and turning a crowd's eyes away. *What it protects:* a family's road, and a confidence kept. *Distinct without labels?* Yes: an interrogation at a gate, in Heart, not Eye.

Both kept.

## 19. Package field notes (for the systems pass)

**Template:** `id: 'encounter.town.toll_gate_writ'`, `name: 'The Writ at the Toll Gate'`, `reach: 'eye'`, `rarityTier: 2`, `intrinsicTier: 'shaping'`, `scale: 'local'`, `apCost: 1`, `crudType: 'update'`, `actorAffinities: ['individual']`, `motivations: ['revelation_discretion', 'mercy_ruthlessness']`, `settings: ['urban']`, `openings.urban` = § 10 P1, `consequenceDraw: ['knowledge', 'movement']` (stamped by the compiler).

**Step effects:**

| Site | `successMetadata.effects` | `failureMetadata.effects` |
|---|---|---|
| step 0 | none | `reputation_with { targetLocationId: '$here', delta: -0.03 }` |
| step 1 `positive` + step `fallback` | `reputation_with $here +0.06`; `intelligence { category: 'political_secret', label: 'Who copies the toll seal', detail: 'An old seal-cutter in the town has copied the toll seal for years and sells false writs cheap to families who cannot pay the toll.', reliability: 0.9, targetAgentId: '$actor' }`; `agent_relocation { targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 4 }, mode: 'travel' }` | `reputation_with $here -0.06` |
| step 1 `negative` | `favor_creation { magnitudeRange: [0.15, 0.3], context: 'Vouched for the family at the toll gate', debtorAgentId: '$cast:traveller' }`; `intelligence { category: 'political_secret', label: 'Who copies the toll seal', detail: 'The family bought the writ from an old seal-cutter in the town, who sells copies of the toll seal to travellers who cannot pay.', reliability: 0.75, targetAgentId: '$actor' }`; `agent_relocation { targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' }` | `reputation_with $here -0.08` |

**Trait variants** (`factorLine` required, ≤12 words):
- `trait.personality.eye.virtue`, `forecastDelta: 0.04`: "Being Perceptive, they see a seal's faults before its words."
- `trait.personality.eye.vice`, `forecastDelta: -0.04`: "Being Judgemental, they had judged the family before reading a line."

**narrativeTemplates:**
- initiation: "A toll-master asks a stranger with a trained eye to judge a travelling family's writ of passage."
- success: "The stranger's reading of a forged writ held at the toll gate."
- failure: "The stranger's reading of a forged writ failed at the toll gate, and their name suffered for it."

**Carryover factor lines:** none authored.
