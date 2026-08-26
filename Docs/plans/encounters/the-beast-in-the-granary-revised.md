# Encounter Pipeline: The Beast in the Granary
> Scale: medium | Slug: the-beast-in-the-granary | Pass: revised
> Revisions applied: authored the 15 missing step afterimages + action-level `narrativeTemplates`; cleared 7 vagueness-lexicon hits from `outcome`-class fields; removed second person from `positive`/`critical_failure`; grounded "the bins" and "the watch" in the spine (79 words); rewrote both branch paragraphs so they assert position rather than a possession step 0 may not have minted, closing a verbatim shared sentence; authored `negative`/`critical_failure`; corrected `let_it_set` → `let_it_teach` (reach `iron` → `star`, plain label); rewrote `weigh_the_winter`'s effect line to state its odds mechanism; made all four card faces imperative-led; trimmed the trait factor line to 11 words; corrected the self-audit.
> Date: 2026-08-26 | Pipeline version: 2.0

**Template id:** `encounter.hunt.the_beast_in_the_granary`
**Rolled constraints (from the approved brief — non-negotiable):** `plotHookTaken: hook.impossible_heist` · reach `shadow` (lead) · setting rolled `rural` · scale `settlement` · shape `personality_fork` · p3Shape `choice` · opposition `beast` (motive: hunger) · activity `sleeping` · disposition `wary` · agentRole `the client who is owed` · `consequenceDraw: possession, membership`
**Setting envelope:** `rural`, `wayside`, `stronghold`

---

## 1. Inspiration Anchors

| Source | What it contributed | Read at |
|---|---|---|
| `Systems/Thematic Pillars.md` (vault) | **Compassion vs. Power**, read through the canonical Sovereignty-vs-Consumption reframe, is the fork. The mortal stands over their own property inside a room holding a settlement's whole winter. The positive pole is not heroism, it is *refusing to treat a place as a thing you take from*; the negative pole is not villainy, it is a person who has been owed and collects. Both are legible; neither is scored. This is what stopped the fork from becoming good-vs-evil. | vault |
| `Systems/Anti-Patterns.md` (vault) | **#1 The Dark Lord Problem** and **#6 Grimdark for Shock Value** together set the beast's treatment: an animal with a motive (hunger), asleep, *wary* rather than hostile, that came in for food and cannot be reasoned with because it is not a villain. It kills nobody on stage. **#10 Player as Savior** killed an earlier draft where the settlement could not act without the agent — the settlement has a plan (burn the store), and that plan is exactly what makes the quiet route worth anything. **#8 Helpful Exposition NPCs** kept the keeper to one job: they will not open the door, and they say why. | vault |
| `Systems/Content Creator Cheat Sheet.md` (vault) | Confirmed every id in the wiring table below is content-layer, not engine-layer. Its own Style Guide section is **deleted** (THR-1252) and points at `Docs/canon/prose.md` + Doctrine v2, which is what I wrote to. | vault |
| `Archetypes/Ordeal Archetypes.md` (vault) | **Three entries, and one of them changed the draft.** (a) **Impossible Heist** is the rolled hook's own archetype: its *"Security: multiple layers of protection; each layer requires a different solution"* is why this is two tests rather than one, and why the second test is a **different reach** on each pole rather than a second `shadow` roll. Its stated consequence — *"Theft is noticed; the owner will hunt you"* — is the one I **did not** take, and the reason is recorded in §5: the agent is not stealing, they are recovering their own goods behind a bar that will not open, which is what makes `agentRole: the client who is owed` do real work instead of being a coat of paint on a burglary. The hunted-thief consequence survives in reduced form as the `negative` variant's `hidden_mark` (`revealFamilies: ['investigation']`). (b) **Defense of the Innocent (Standing the Line)** states my fork's axis in the vault's own words — *"Core Concept: Courage vs. Survival. Can you keep fighting when retreat would save you?"* and *"Consequence: Defending them costs resources, health, or sanity."* That is `sacrifice_survival` plus the wound, and finding it there after the brief rolled the shape is what made me stop looking for a cleverer axis. (c) **Impossible Choice (The Dilemma)** — *"Two or three paths, all costs high … Time Pressure: must decide quickly; indecision is also a choice"* — is the p3 `choice` shape, and its *"Moral Weight: the choice reveals who you are"* is precisely what `decidedBy` mechanises: the fork does not test the mortal, it **reads** them. | vault |
| `Archetypes/Monster Archetypes.md` (vault) | Present, **deliberately not opened.** The brief puts a bestiary out of scope and CLAUDE.md forbids minting node types; a monster-archetype page could only have tempted a creature entity this encounter is not allowed to build. The bear is cast-less by construction — see Findings #1. Recorded rather than cited (the prompt's "inspiration honesty" rule). |
| `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` | The worked format: derived `locationSubtypes`, role-voiced cast with the token spent only where the name earns it, per-step failure fragments, no authored `factorLines`. |
| `src/data/encounters/the-unfinished-rite.ts` | The corpus's **first** composed hand (THR-1254) and therefore the only live model for `deal` + specials. Its "both specials are things the dealer structurally cannot produce" rule is the rule I cut my specials against, and its five-afterimage step is the model for §10b. |
| `Docs/exemplars.md` | Top row only (`swollen-ford`). The two May rows are wiring exemplars whose prose is explicitly do-not-copy; I read their *structure* for aftermath shape and nothing else. |
| Dilemma Library (`src/data/meeting-dilemma-library.ts`) | **Not consulted.** The fork here is not a moral dilemma put to a player — it is an `ActionStepBranch.decidedBy` read of the mortal's own axis. Consulting a player-facing dilemma library would have pulled toward the retired authored-futures model. |

**Anti-patterns actively avoided:** the Dark Lord (a hungry animal, not a monster with a plan) · Player as Savior (the settlement's own answer — burn the store — is on the table from the opening and is what makes both courses cost) · Grimdark (nobody dies on stage; the two men who went in were *carried out*, not killed) · Generic Fantasy Aesthetics (a bear on winter grain in a barred store, not a "beast" in a "lair").

---

## 2. Scale Justification

Medium is the honest size. The encounter has exactly two beats — a crossing and a decision that becomes a second test — and neither is padding: the crossing is where the god spends, the second beat is where the mortal's character decides what the spending bought. A single beat would collapse the fork into an outcome band and destroy the thing this slot exists to prove (`personality_fork` with a real `decidedBy`); a third beat would have to be invented, because after the mortal is out of the store the encounter is over and the consequences belong to the aftermath. The reward weight matches: a recovered possession, a settlement that opens or closes, and a real wound risk — settlement-scale stakes, but one night and one building, which is medium.

---

## 3. Pressure Knot

Already in motion before the god looks:

A bear came down for food and found a building with three months of it inside. It has been in the store three days. It is not hunting; it is eating and sleeping on top of what it found, and it will not be moved off it. Two men went in on the first morning and were carried out. Since then the door has stayed barred and the settlement has been arguing about fire — burn the store, kill the bear, lose the winter, survive on what the neighbours can spare. That argument is nearly over. Whoever holds the key has stopped opening the door for anyone, for any reason, including the ordinary reason that the goods behind the bar belong to travellers.

The agent walks into the last night of that argument holding a claim on something inside.

---

## 4. Intervention Fantasy

The god is looking down at a dark room with a sleeping animal in it and one person moving across the floor, and every card is a lean on the *quality of that quiet* — the nerve, the light, the footing, the door. Then the person reaches what they came for and stops, and the god finds out what they are: someone who takes their own and goes, or someone who stays in a room with a bear because there is a village's winter behind it.

The fantasy is the second half. The god does not choose. The god has spent the whole crossing arguing — a dread that makes the door look like the only sane object in the world, a light that shows exactly how many bins there are — and then watches the mortal's own axis add up against those arguments and answer. It is the difference between playing a character and *knowing* one.

---

## 5. Cast and World Objects

| Object | What it is | How it is delivered |
|---|---|---|
| **the keeper** (`supportBundle` key `keeper`) | The person who holds the key and will not open the door. Owed-to relationship runs the other way: the agent's goods are behind their bar. Carries `factionDefId: 'civic_guard'` — they are the settlement's watch, which is what makes the membership consequence a real body rather than a mood, and the spine now says so in as many words. | `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['guard', 'quartermaster', 'elder', 'hunter', 'ranger', 'wanderer']`, `spawnNpcRole: 'guard'`, `supportRole: 'store_keeper'`, `spawnName: 'Hedda Varn'` |
| **the store** (`supportBundle` key `store`) | The barred building itself — the place the whole encounter is inside. A real, persistent sublocation node so the prose's "the store" is a thing on the map and not landscape fiction. | `lazy-materialize-on-trigger`, `must-persist`, `sublocationTypeId: 'sublocation-type.warehouse'`, `fallbackName: 'the stores'` |
| **the bear** | The opposition. **Not cast, not a node, not a bestiary entry** — prose, difficulty, and the conditions it leaves. See Findings #1. | prose only |
| **the settlement** | `$target` — the location the encounter spawned at. Carries the place conditions below. | pre-existing |
| **the watch** (`civic_guard`) | The faction the settlement's keeper belongs to and the body a saved store can swear the agent into. Named in the spine so the membership ending has a promise behind it. | faction definition, live |
| **the agent's pack** | What they are owed: their own goods, put behind the bar at dusk by the local rule. Minted as a real possession on step-0 success. | `spawn_artifact` |
| **Wounded** (`trait.condition.wounded`) | The hunt's price. Fires the wound signal, so tier promotion runs automatically. | `condition_attachment` |
| **Terrified** (`trait.condition.terrified`) | Granted by a card, not by the bear. The god's own dread, and the mechanism of the survival lean. | card `grants` |
| **Festival** (`trait.condition.location.festival`) | The place condition of a settlement that kept its winter. | `condition_attachment` with `targetLocationId` |
| **Blighted Harvest** (`trait.condition.location.harvest_blight`) | The place condition of a settlement that lost its store — "Food is short, prices climb, and the hunger outlasts the season." | `condition_attachment` with `targetLocationId` |
| **Reputation channel** | None authored. Deliberate: the brief bans defaulting to the reputation stack, and this encounter's social consequence is *membership*, which is a stronger claim than standing. |

---

## 6. Beat Structure

**Beat 1 — Cross the floor.** `shadow`, difficulty `0.40` (`fair`), `failBehavior: 'continue_weakened'`, `purposeLine: 'Cross the floor'`.
The bar is off the near door, the room is dark, the animal is asleep between the door and the bins, and the agent's own goods are somewhere behind it. The god's hand is here. This is where every card is spent and where both pole-leaning specials argue.

**Beat 2 — the fork.** `ActionStepBranch`, `branchOnStep: 0`, `decidedBy: { axis: 'sacrifice_survival' }`, `variants: { positive, negative }`, plus `fallback`.
The mortal is at the pack and stops. Their standing position on `sacrifice_survival` plus the net `poleLean` of the cards the god committed on beat 1 decides which of two continuations they take. **The player never picks.**

- **`positive` — Put it out.** `iron`, difficulty `0.44` (`fair`), `failBehavior: 'fail_action'`, `purposeLine: 'Put it out'`. They take their pack and then they stay, and try to drive the animal out of the building through the far door rather than leave a settlement to burn its own winter.
- **`negative` — Get back out.** `shadow`, difficulty `0.36` (`fair`), `failBehavior: 'fail_action'`, `purposeLine: 'Get back out'`. They take what is theirs and nothing else, and go back the way they came. The store is the settlement's problem and will be dealt with in the morning, by fire.

Two beats. Both are nudge-bearing; each carries its own composed hand.

**Note on beat-2 prose and step 0's `failBehavior` (editorial correction).** Step 0 is `continue_weakened` and mints the pack on `successMetadata` only, so a failed-but-continuing crossing reaches beat 2 with no artifact spawned. Both continuations are therefore written to state **position**, never possession — they are true under every step-0 outcome. The possession is reported by the aftermath, where the write has actually happened.

---

## 7. Branching Profile

- **Branch depth:** `light`
- **Branch count:** `2`
- **Branch shape (from the catalog):** **Personality Fork** — *"1 + branch. The mortal makes a choice: a test, then an agent-decided branch on a value axis (THR-894), pole-specific continuations."* Step structure matches the named shape exactly: one plain test, one branch node.
- **Value axis:** `sacrifice_survival` (Star — Martyr `positive` ↔ Survivor `negative`).
- **Where branching lives:** step prose (two fully written continuations), reach (`iron` vs `shadow` — the poles test *different things about the mortal*, not the same test twice), difficulty, the hand (a distinct special per pole), band fragments, afterimages, aftermath variant, aftermath reactions, and the place condition the settlement ends up carrying.
- **Convergence policy:** **none.** The two poles do not reconverge; they resolve into different aftermath variants and leave the settlement in opposite states. The only thing they share is the possession minted on beat 1 — the agent has their own goods either way, because that was never the question.
- **Optional secondary template:** none. No `encounter_seed` is authored — see Findings #6.

**Why the player is not choosing.** The god's only surface is the hand on beat 1. Two of its cards carry `poleLean`; four are dealt from the Repertoire and abstain. The engine reads the mortal's live axis, adds the committed leans, and records the pole through the existing choice-history path. There is no card, label, or button anywhere that names a branch.

---

## 8. Branching Map

**Beat 1 (no branch) → beat 2.** The recorded pole (`positive` / `negative`) selects the step definition.

| | `positive` (Martyr) | `negative` (Survivor) |
|---|---|---|
| **Beat 2 prose** | The far door, barred from the inside; the cold outside it; the animal between. They are trying to *move* something that outweighs them. | Four steps of open board, a near door, and bins that were never theirs. They are trying to *not be noticed* leaving. |
| **Reach / difficulty** | `iron` / 0.44 | `shadow` / 0.36 |
| **Special card** | `granary.lift_the_bar` — the far door, matter-of-the-building | `granary.narrow_their_sight` — everything but the pack goes dim; deepens the survivor mark |
| **`deal` tags** | `['might', 'peril']` | `['shadow', 'finesse']` |
| **Step writes (success)** | `condition_attachment` **Festival** on `$target` | `condition_attachment` **Blighted Harvest** on `$target` |
| **Step writes (failure)** | **Wounded** on `$actor` + **Blighted Harvest** on `$target` | **Wounded** on `$actor` + **Blighted Harvest** on `$target` |
| **Aftermath variant** | `positive` — bands `critical_success`, `success`, `critical_failure` | `negative` — bands `success`, `success_at_cost`, `failure`, `critical_failure` |
| **Aftermath reactions** | *Let them be sworn to the place* (`membership_change` join `civic_guard`) / *Let them be paid and go* (`spawn_artifact`) | *Let the settlement find it in its own time* (`hidden_mark`) / *Let the keeper hear it from them* (`intelligence` to `$cast:keeper`) |
| **What the world keeps** | A settlement with its winter, a feast, and possibly a new name on the watch roll | A settlement with a blighted season, and either a secret or a warning |

Both poles carry the wound risk and both mint the possession. What differs is who is left holding the cost.

**Bands authored per variant.** `positive` — `critical_success`, `success`, `critical_failure`. `negative` — `success`, `success_at_cost`, `failure`, `critical_failure`. An unauthored band on either pole falls to that variant's `overview`, which is written to read on its own. The `negative` extreme was added editorially: the pole previously carried three middling bands and no peak or floor, which read as the lesser branch whatever the design said, and `granary.narrow_their_sight`'s obligatory big-delta `critical_failure` fragment had no aftermath to land in.

---

## 9. Outcome Ladder

Five bands, read at the *action* level (`UnifiedActionOutcome`). Every row has a prose surface: the step afterimages in §10b and the aftermath bands in §13.

| Band | Progress made | What was spent | New burden or opening |
|---|---|---|---|
| **critical_success** | On `positive`: the bear goes out the far door on its own feet and the store is untouched — bins, sacks, roof. On `negative`: they are out through the near door with their pack and the animal never lifts its head (read at the step, in the `negative` critical-success afterimage; the pole's aftermath resolves through its `overview`). | The night, and no more than that. | `positive`: the settlement keeps its winter and holds a feast (**Festival** on the location); the watch asks the agent to stand with them. `negative`: nobody knows they were inside, and nobody knows how bad it is in there. |
| **success** | The pack is out. On `positive`, the bear is out of the building; on `negative`, so is the agent. | Sleep, nerve, and whatever essence the god spent. | `positive`: the store stands, and the keeper knows who moved the animal. `negative`: the store will be burned in the morning and the settlement will be short (**Blighted Harvest**). |
| **success_at_cost** | They got what they came for and got out, and it went wrong on the way — a spilled bin, a shout, a bar that would not seat. | Time, and being seen. Authored on the `negative` variant: they got clear, and the settlement knows a stranger was in the store the night before it burned. | The blight lands anyway, and now there is a name attached to it. |
| **failure** | The pack is in hand and the second half is not done. On `negative`, they are still inside when it wakes and have to go out badly. | **Wounded**. Days on the road. | The store is lost either way; the agent leaves marked by it. |
| **critical_failure** | On `positive`: they try to move a bear, and a bear that will not be moved moves them. On `negative`: they go at the near door too fast and the animal catches them at it. | **Wounded**, everything dropped that was not tied on, and — on `positive` — the far door left standing open. | `positive`: the settlement burns the store at first light with the door open and the bear gone into the fields — the winter gone *and* the animal still out there. `negative`: the store burns at noon and the settlement spends the season deciding who to blame. Nobody is coming to say thank you on either pole. |

Failure is plot: the wound is a real condition with a duration edge and negative `iron`/`stone` contributions, and the blighted season is a real place condition every price and gate downstream reads.

---

## 10. Sample Opening

**Openings (one per declared class — `openings.<class>`, P1 only):**

- `rural`: `{name} reaches the village of {location} after dark.`
- `wayside`: `Travelling late, {name} stops at the waystation of {location}.`
- `stronghold`: `{name} is inside the gate at {location} before dark.`

**Shared spine (step 0 `narrativeTemplate`, setting-neutral — P2 and P3):**

> There the store is barred, and {cast:keeper} of the watch will not open it. A bear has denned inside, asleep on the bins of winter grain. Two men who went in were carried out.
>
> {name}'s pack went behind that bar at dusk, by local rule. Rouse the settlement and they burn the store to be rid of it. Go in quiet, and the bear lies between {name} and the door.

**Word count:** spine 70; longest P1 (`wayside`) 9 → **79 words**, inside the 80-word budget at every class.

**Stake shape:** `choice` (Die 1, face 6) — two courses, both costly, exactly as the brief declares. No second shape is compounded.

**What the three editorial words buy.** *of the watch* gives the drawn `membership` family its only promise — without it, "the watch has asked {actor} to stand with them" arrives in the aftermath naming a body the player has never met — and it reads the keeper's declared `factionDefId` rather than inventing a relationship. *asleep on the bins of winter grain* introduces the bins before `granary.weigh_the_winter` counts them on the very same beat, and states the rolled `activity: sleeping` plainly instead of leaving it inside "denned". *by local rule* pays for both out of the budget.

---

## 10b. Afterimages

Five per step, the surface the outcome ladder actually lives on. `ActionStep` carries five, not six — near-miss is paid off through band fragments.

**Step 0 — Cross the floor** (`continue_weakened`, so every band below continues into the fork):

- `criticalSuccessAfterimage` — "They crossed without a board speaking and had a hand on the pack before the animal shifted."
- `successAfterimage` — "They got across the dark floor and reached the pack."
- `successAtCostAfterimage` — "They reached the pack, and the crossing took twice the time it should have."
- `failureAfterimage` — "The crossing went badly. They reached the pack carrying claw-marks they did not walk in with."
- `criticalFailureAfterimage` — "The animal came up off the grain and put them into the boards before they were across."

**Step 1 · `positive` — Put it out** (`fail_action`):

- `criticalSuccessAfterimage` — "They opened the far door and walked the animal out of the building without laying a hand on it."
- `successAfterimage` — "They got the far door open, and the bear went out through it."
- `successAtCostAfterimage` — "The bear went out the far door, and took a rack of the store's fittings with it."
- `failureAfterimage` — "The far door came open and the bear stayed where it was, on the grain."
- `criticalFailureAfterimage` — "They put themselves between a bear and its food, and the bear settled it."

**Step 1 · `negative` — Get back out** (`fail_action`):

- `criticalSuccessAfterimage` — "They went out the near door with the pack, and the animal never lifted its head."
- `successAfterimage` — "They took what was theirs and got back out the near door."
- `successAtCostAfterimage` — "They got out with the pack, and a bin went over in the dark behind them."
- `failureAfterimage` — "The bear woke between them and the near door, and they went out through it hurt."
- `criticalFailureAfterimage` — "They went at the near door too fast, and the animal caught them at it."

**Action-level `narrativeTemplates`:**

- `initiation` — "The store will be opened tonight or burned in the morning. {name} is the only one with a reason to go in first."
- `success` — "{name} came out of the store with what was theirs. What is left in there is {location}'s to settle."
- `failure` — "{name} did not get clear of the store cleanly. The bear and the winter are still {location}'s to answer for, and now there is blood on the boards."

---

## 11. The Hand Per Step

Every nudge-bearing step composes: authored specials + a declared `deal` fill from the god's Repertoire. `exclude: ['boost', 'undertow']` on all three hands, per the brief's instruction to keep the top three over-exposed cards (`card.boost.core` ×11, `card.boost.signature.energy` ×8, `card.undertow.signature.darkness` ×7) out of the dealt fill. See Findings #4 for the collateral that exclusion costs.

All four card faces are imperative-led — **Fill · Show · Open · Dim** — so the row reads as one set.

### Beat 1 — Cross the floor (`shadow`, 0.40 `fair`)

**Composed hand: 2 specials + `deal: { count: 4, tags: ['shadow', 'peril'], exclude: ['boost', 'undertow'] }` = 6.**

Both specials carry `poleLean`. That is the whole justification for authoring them: **a dealt card cannot lean**, because the dealer does not know this scene's axis, and a Personality Fork with no leaning cards is a fork the god has no lever on. Neither is a plain odds boost and neither carries a rider — the spec retires both as specials. They argue opposite sides of the branch the god does not get to pick, which is the dilemma this encounter is built around.

---

**Special 1 — `granary.wake_their_fear`**
*Library type: **Compulsion**. Genuine one-off — no `libraryCardId`. The library's compulsion members (`card.compulsion.signature.mind`, `card.compulsion.hunger.haunt`) plant an encounter bias; none grants a condition, and none can carry a pole lean. `card.compulsion.signature.mind` is on the brief's not-as-specials list and is deliberately not named here — it remains dealable.*

| field | value |
|---|---|
| `name` | **Wake Their Fear** |
| `sphere` | `mind` |
| `essenceCost` | 2 |
| `forecastDelta` | 0.08 |
| `imageTag` | `generic.dark` |
| `poleLean` | `{ axis: 'sacrifice_survival', toward: 'negative' }` |
| `grants` | `[{ kind: 'condition_attachment', templateId: 'trait.condition.terrified', targetAgentId: '$actor' }]` |
| `effectLine` | *"Fill them with dread of the sleeping animal. They move carefully, and they will want the door."* |

`bandProse`:
- `success` — "Fear kept every step short, and the floor stayed quiet under them."
- `near_miss` — "Dread had them counting the boards. It did not have them counting the time."
- `failure` — "Dread made them careful, and careful was not the same as quiet."

*Why it leans survival:* the card is the mechanism, not a label. A mortal the god has filled with dread of the animal in the room wants the door, and the door is the survivor's answer. Grant is live content (`trait.condition.terrified` ships in `condition-trait-content.ts`) and it is the encounter's `grants`-naming-built-content card.

*Editorial:* effect line was *"dread of the sleeping thing"* — coy about the bear on a surface whose job is to be unmistakable. The `success` fragment read *"the floor gave nothing away"*; `nothing` is a natural indefinite and band fragments are `outcome` class, where the lexicon is enforced at zero.

---

**Special 2 — `granary.weigh_the_winter`**
*Library type: **Whisper**. Genuine one-off — no `libraryCardId`. `card.whisper.signature.light` costs essence, grants an intelligence record, and abstains from every axis; this one is free of essence, priced on detection, and argues a pole. Different card.*

| field | value |
|---|---|
| `name` | **Weigh The Winter** |
| `sphere` | `light` |
| `essenceCost` | **0** |
| `costs` | `{ detectionDelta: 3 }` |
| `forecastDelta` | 0.06 |
| `imageTag` | `generic.light` |
| `poleLean` | `{ axis: 'sacrifice_survival', toward: 'positive' }` |
| `effectLine` | *"Show them the floor and every bin on it — the grain, and how many mouths it feeds. Rival gods will read the light."* |

`bandProse`:
- `critical_success` — "They had the whole floor mapped before they moved, bin by bin."
- `success` — "The light showed the bins and the gaps between them, and they used both."
- `failure` — "They saw exactly how much was in there, and looked a moment too long."

*This is the encounter's non-essence-channel card* — zero essence, paid in detection, and the fiction and the price are the same fact: the god lit a dark room, and light is what other gods read. The lean is earned rather than asserted: a person who has just counted a village's winter in bins does not walk out of that room the same way.

*Editorial:* the effect line previously read *"Show them how much grain is in the bins, and how many mouths that is"* — which states the moral lean and no odds mechanism at all. Nothing on the face explained why counting a village's winter helps a mortal cross a dark floor quietly; only the fragments did, and the fragments are not what the player buys from. The line now names the floor as well as the count, so it earns its `forecastDelta` and keeps its lean.

---

**The dealt fill (4).** `tags: ['shadow', 'peril']` — this step is a `shadow` test and the trouble is peril. `exclude: ['boost', 'undertow']`. The dealer never deals a type a special already covers, so no second Compulsion and no second Whisper arrive.

**Composed-hand accounting (the rules that bind the *whole* hand):**

| Rule | Status |
|---|---|
| Size 4–8 | 2 + 4 = **6** ✅ |
| ≤ 2 authored specials (`DEAL_MAX_AUTHORED_SPECIALS`) | **2** ✅ |
| ≥ 4 distinct spheres | specials give `mind` + `light`; the dealer's stated preference is breadth. **Author-side: 2 of 4.** Not guaranteeable — Findings #3 |
| ≥ 1 ungated common option | commons after the exclude: `card.insurance.core`, `card.mercy.core`, `card.trait_card.core`. The dealer prefers ≥1. **Not guaranteeable** — Findings #3 |
| ≤ 1 rider | specials carry **0**. Fill could deal Insurance + Mercy + Gambit. **Not guaranteeable** — Findings #3 |
| ≤ 2 Boosts | `boost` excluded ⇒ **0** ✅ |
| ≥ 3 distinct card types | 2 specials + 4 dealt of types neither special covers ⇒ **≥ 3** ✅ |
| Delta budget ≤ 0.70 | specials 0.14; dealer clamps the composed total ✅ |

---

### Beat 2 · `positive` — Put it out (`iron`, 0.44 `fair`)

**Composed hand: 1 special + `deal: { count: 4, tags: ['might', 'peril'], exclude: ['boost', 'undertow'] }` = 5.**

**Special — `granary.lift_the_bar`**
*Library type: **Stumble** (host system: encounter cast / the scene's physics). Genuine one-off — no `libraryCardId`. `card.stumble.signature.chaos` acts on an opponent's footing through `opposes`, which needs a cast key this scene structurally cannot have (Findings #1); this acts on a named object of this scene, the far door, which no generic card knows exists. Sphere honors the chaos → Stumble signature. **Stage 3 should rule** on whether the shipped precedent — `the-unfinished-rite.ts`'s `Loosen Their Nerve`, the same re-skin shape, which does set `libraryCardId` — binds here.*

| field | value |
|---|---|
| `name` | **Lift The Bar** |
| `sphere` | `chaos` |
| `essenceCost` | 2 |
| `forecastDelta` | 0.10 |
| `imageTag` | `generic.matter` |
| `effectLine` | *"Open the far door from the inside and let the night in — the bear will go toward the cold."* |

`bandProse`:
- `critical_success` — "The night came in the far end of the building and the animal followed it out."
- `success` — "The far end of the store went cold, and the bear went to find out why."
- `near_miss` — "The cold reached the bear. It looked, and then it went back to the grain."
- `failure` — "The far door stood open on a night the bear had no interest in."

*Name / effect-line check:* name words `Lift`, `Bar` appear nowhere in the effect line.

### Beat 2 · `negative` — Get back out (`shadow`, 0.36 `fair`)

**Composed hand: 1 special + `deal: { count: 4, tags: ['shadow', 'finesse'], exclude: ['boost', 'undertow'] }` = 5.**

**Special — `granary.narrow_their_sight`**
*Library type: **Undertow** (host system: pole-shift). Genuine one-off — no `libraryCardId`, and deliberately **not** `card.undertow.signature.darkness`, which the brief bans outright and which is over-exposed at 7 precisely because it is the corpus's only reach-scoped mark. The library Undertow charges the mortal in quintessence; a **reach-scoped** `axiological_mark_apply` needs a `reach` a generic card cannot know, which the spec names as the clearest possible special. Note for the report: the census counts `libraryCardId`, so the only legal move here also removes the over-exposed member from the count — see Findings #4.*

| field | value |
|---|---|
| `name` | **Narrow Their Sight** |
| `sphere` | `darkness` |
| `essenceCost` | 2 |
| `forecastDelta` | **0.16** (≥ `NUDGE_BIG_DELTA` ⇒ both failure bands owed) |
| `imageTag` | `generic.dark` |
| `grants` | `[{ kind: 'axiological_mark_apply', reach: 'star', signedMagnitude: -0.10, targetAgentId: '$actor' }]` |
| `effectLine` | *"Dim the whole room except the pack they are holding. They will not weigh the bins again."* |

`bandProse`:
- `critical_success` — "The pack was all they saw, and they were out the near door with it."
- `success` — "The bins might as well not have been there. They took theirs and left."
- `failure` — "They saw only the pack, and so they did not see the sack their heel found."
- `critical_failure` — "The near door was all they could see, and they went at it too fast."

*`reach: 'star'` is deliberate and matches the fork:* Star's axis **is** `sacrifice_survival` (Martyr ↔ Survivor). The card deepens the course the mortal already took. It does not decide it — the fork was recorded at beat 1's resolution.

*Editorial:* the effect line was the one declarative face in a set of imperatives, and the `critical_success` and `critical_failure` fragments carried three lexicon hits between them (`thing`, `Nothing`, `way`) plus a `not … but` clause that would have spent the encounter's single annotation budget on a card fragment. The `critical_failure` fragment now also has an aftermath band to land in — see §13.

---

## 12. Branch-Dependent Later Paragraphs

**`positive` — Put it out** (step `narrativeTemplate`):

> {name} reaches the pack and stops. The bear is asleep across the floor, and every bin of the settlement's winter sits behind it.
>
> There is a second door at the far end, barred from the inside. A bear will go toward cold air if there is cold air to go toward. {They} leave the pack by the near door and go the long way round.

**`negative` — Get back out** (step `narrativeTemplate`):

> {name} has a hand on the pack, and the near door is four steps of open board away.
>
> The bins behind the sleeping bear are not {name}'s and never were. The animal is close enough to both the pack and the door.

Neither paragraph names class scenery. Neither shares a sentence with the other or with the spine, and each opens on its own new fact before re-establishing the room: `positive` runs on a plan, `negative` on distance.

*Editorial:* both paragraphs opened **"{name} has the pack"** — false on a failed-but-continuing step 0, which mints no artifact, and the encounter would have carried a fork whose prose asserts a possession the engine did not spawn. They also shared a verbatim twelve-word sentence (*"The bear is asleep across the floor with the bins behind it."*) that the draft's seam audit reported clear. Both are gone.

---

## 13. Aftermath Paragraph

**`positive` variant overview (base):**

> The bear is out of the store, and the grain is standing.

**`positive` / `critical_success`:**

> The animal went out under its own weight and never looked back at the room. {cast:keeper} counted the bins by lamplight, twice, and lost only a burst sack. There will be a feast in {location} before the week is out, and {name} will be asked to stay for it.

**`positive` / `success`:**

> The bear is in the fields and the store is standing, and both are true because one traveller walked back into a room they had already got out of. {cast:keeper} opened the door in the morning to a floor that could be swept.

**`positive` / `critical_failure`:**

> A bear that will not be moved moves the one who tries. {name} came out of the store on their back, the far door standing open and the animal gone into the dark past it. {cast:keeper} put fire to the building at first light anyway, because nobody would go in again to check. {location} lost the winter and kept the bear.

**`negative` variant overview (base):**

> The pack is out and the store is still barred.

**`negative` / `success`:**

> Four steps, a door, and nobody the wiser. {name} was on the road before it was properly light. Behind them {cast:keeper} was arguing the same argument for the last time, and losing it, and the smoke went up before noon.

**`negative` / `success_at_cost`:**

> They got out with theirs. They did not get out unheard. {cast:keeper} found the near bar off its seat and a boot-mark in spilled grain, and by the time the store burned, {location} had two grievances instead of one.

**`negative` / `failure`:**

> It came awake between them and the door and there was no quiet left to spend. {name} went out through it rather than past it, and paid for the difference. The store burned that morning as it was always going to, and now there is a traveller on the road who bleeds when they lift the pack.

**`negative` / `critical_failure`:**

> The animal woke to a shape in the dark and went at it. {name} got the door open and got through it, and left blood on the boards for {cast:keeper} to find. The store burned at noon with the near bar hanging off its seat, and {location} spent the season deciding who to blame for a winter it had already lost.

**`fallback`:**

> The store is open again, however it went. What is left inside it is the settlement's to count.

*Editorial:* three lexicon hits cleared (`nothing missing but` → `lost only`, which also removed a `not … but` shape; `two things` → `two grievances`; `one way or the other` → `however it went`), one second-person sentence removed, and `negative` / `critical_failure` authored so the survivor pole has a floor as deep as the martyr pole's peak. It is fully backed by the `negative` step's existing `failureMetadata` (wound + blight) and pays off `granary.narrow_their_sight`'s obligatory big-delta fragment.

---

## 14. Aftermath Reaction Choices

Required at medium+ scale. Each pair is a **stance about consequence**, not a mechanical variant.

### `positive` variant (base reactions; inherited by `critical_success` and `success`)

| Reaction | Effect | The thread the god preserves |
|---|---|---|
| **Let them be sworn to the place** (`granary.swear_them_in`) | `{ kind: 'membership_change', factionId: 'civic_guard', op: 'join', targetAgentId: '$actor', chronicle: true }` | *Significance is belonging.* The god lets the mortal put down a root — a name on a roll, a body they answer to, a place that will now call on them. It costs the god a wanderer and buys a thread with an address. |
| **Let them be paid and go** (`granary.pay_and_part`) | `{ kind: 'spawn_artifact', category: 'mundane', tier: 'uncommon', targetAgentId: '$actor' }` | *Significance is motion.* The god keeps the mortal unowned — settled with, thanked, and gone by noon. What they carry out is worth more than what they would have been given to guard, and nobody in {location} will ever have a claim on them. |

### `positive` / `critical_failure` (band reactions)

| Reaction | Effect | The thread |
|---|---|---|
| **Let the wound close clean** (`granary.close_it_clean`) | `{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor' }` | *Mercy is allowed to be simple.* The god spends nothing on meaning and just takes the hurt off them. |
| **Let them learn caution** (`granary.let_it_teach`) | `{ kind: 'axiological_mark_apply', reach: 'star', signedMagnitude: -0.08, targetAgentId: '$actor' }` | *Some lessons are supposed to be expensive.* The god lets the failure teach: the next time someone else's winter is behind a sleeping animal, this mortal weighs the odds before they walk in. |

*Editorial:* this reaction was **Let it set the way it wants** at `reach: 'iron'`. Two defects in one row. The label left "it" genuinely ambiguous between the wound and the character, which is the one thing an interactive label may not do. And the reach contradicted the reaction's own stated meaning: "do the arithmetic first" is a lean toward **survival**, and `sacrifice_survival` is Star's axis — the same reason `granary.narrow_their_sight` uses `reach: 'star'` two sections earlier. Both corrected; the effect is unchanged in kind and magnitude.

### `negative` variant (base reactions; inherited by `success` and `success_at_cost`)

| Reaction | Effect | The thread |
|---|---|---|
| **Let the settlement find it in its own time** (`granary.their_own_time`) | `{ kind: 'hidden_mark', category: 'concealed_action', severity: 0.4, label: 'Was inside the store the night before it burned', targetAgentId: '$actor', revealFamilies: ['investigation'] }` | *Non-interference, held to the end.* The god does not clean up after the mortal and does not confess for them either. The world will find out or it will not, on its own schedule, and the god will be watching when it does. |
| **Let the keeper hear it from them** (`granary.tell_the_keeper`) | `{ kind: 'intelligence', category: 'cultural_knowledge', label: 'What is actually in the store', detail: 'How large the animal is, where it lies, and how much of the winter is under it.', reliability: 0.9, targetAgentId: '$cast:keeper' }` | *You may owe a place the truth even when you took nothing from it.* The god leans the mortal into saying, out loud, what they saw in there — which does not save the store, but means the people burning it know what they are burning. |

### `negative` / `failure` and `negative` / `critical_failure` (band reactions)

Same pair as the `negative` base, and deliberately so: the stance is unchanged by whether they got out clean, which is the point of a stance.

### `fallback`

| Reaction | Effect |
|---|---|
| **Let them rest before the road** | `{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor' }` |
| **Let them go straight on** | `{ kind: 'spawn_artifact', category: 'mundane', tier: 'common', targetAgentId: '$actor' }` |

---

## 15. Aftermath Kit Summary

### Chips (`changes`), by face

Every chip is anchored, categorised, and backed. Anchor kinds used: **location ×2**, **faction ×1**, **individual ×1** (the cap), **attachment** as concepts.

| Face | Chip | `stateNoun` anchor | Backed by |
|---|---|---|---|
| `positive` base | *(none — `changes: []`)* | — | — |
| `positive` / `critical_success` | `BOON · a feast day` — "{location} kept its winter, and will spend three days saying so." | `{ text: 'a feast day', entityId: '$target', visualKind: 'location' }` · concept `{ text: 'Festival', entityId: 'trait.condition.location.festival', visualKind: 'attachment' }` | `positive` step `successMetadata.condition_attachment` (unconditional on the band) |
| `positive` / `critical_success` | `PATH · a place in the watch` — "The watch at {location} has asked {actor} to stand with them." | `{ text: 'a place in the watch', entityId: '$faction:civic_guard', visualKind: 'faction' }` | reaction `granary.swear_them_in` → `membership_change` — **reaction-conditional, see Findings #5** |
| `positive` / `success` | `BOON · a feast day` (distinct id, shorter detail) | as above | as above |
| `positive` / `critical_failure` | `SCAR · a wound` — "{actor} came out of the store torn open." | `{ text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }` | `positive` step `failureMetadata.condition_attachment` |
| `positive` / `critical_failure` | `SCAR · a hungry season` — "{location} burned its own store and will be short until spring." | `{ text: 'a hungry season', entityId: '$target', visualKind: 'location' }` · concept `{ text: 'Blighted Harvest', entityId: 'trait.condition.location.harvest_blight', visualKind: 'attachment' }` | `positive` step `failureMetadata.condition_attachment` |
| `negative` / `success` | `BOON · their own goods, back` — "What {actor} was owed came out of the store in {their} own hands." | `{ text: 'their own goods, back', entityId: '$actor', visualKind: 'agent' }` — **the one `individual` anchor** | step 0 `successMetadata.spawn_artifact` |
| `negative` / `success` | `SCAR · a hungry season` | as above | `negative` step `successMetadata.condition_attachment` |
| `negative` / `success_at_cost` | `SCAR · a hungry season` | as above | as above |
| `negative` / `failure` | `SCAR · a wound` | as above | `negative` step `failureMetadata.condition_attachment` |
| `negative` / `failure` | `SCAR · a hungry season` | as above | as above |
| `negative` / `critical_failure` | `SCAR · a wound` (distinct id) | as above | `negative` step `failureMetadata.condition_attachment` |
| `negative` / `critical_failure` | `SCAR · a hungry season` (distinct id) | as above | as above |
| `fallback` | *(none — `changes: []`)* | — | — |

**No `reputation_tally` chip anywhere** (Law 13 parity — `check:encounter` fails it). No chip reports a quantity.

**Open for Stage 3:** the `positive` faces carry no chip for the recovered pack, though step 0 mints it on **both** poles and `negative` / `success` does chip it. Legal — Law 56 cl. 1 governs backing, not completeness — but the martyr pole's most concrete gain goes unreported while the survivor pole's is chipped. Adding it would take the `individual` anchor count to two, which the brief caps at one, so the honest options are to leave it or to move the `negative` chip's anchor; flagged rather than decided.

### Step writes

| Step | half | effects |
|---|---|---|
| 0 (plain) | success | `spawn_artifact` (mundane / common → `$actor`) — the pack |
| 0 (plain) | failure | `condition_attachment` `trait.condition.wounded` → `$actor` — **the brief's wound risk** |
| 1 · `positive` | success | `condition_attachment` `trait.condition.location.festival` → `targetLocationId: '$target'` |
| 1 · `positive` | failure | `condition_attachment` **wounded** → `$actor`; `condition_attachment` **harvest_blight** → `$target` |
| 1 · `negative` | success | `condition_attachment` **harvest_blight** → `$target` |
| 1 · `negative` | failure | `condition_attachment` **wounded** → `$actor`; `condition_attachment` **harvest_blight** → `$target` |

### Consequence draw

`consequenceDraw: ['possession', 'membership']` — recorded verbatim from the brief. `possession` is wired by `spawn_artifact` on **step 0** (a plain step, therefore visible to the draw gate) and again by `spawn_artifact` in the `pay_and_part` reaction. `membership` is wired by `membership_change` in the `swear_them_in` reaction, and is promised in the spine's *"{cast:keeper} of the watch"* rather than arriving unannounced. **No swap taken** — neither family fights the fiction.

### Systems quota (counted from the authored manifest, target 4+)

| System | Authored by |
|---|---|
| `cast` | two `supportBundle` specs (`keeper`, `store`) |
| `rewards` | `spawn_artifact` + `condition_attachment` (both `PERSISTENT_EFFECT_KINDS`) |
| `conditions` | `condition_attachment` **wounded** on step 0's `failureMetadata` (a plain step) |
| `factions` | `keeper` spec carries `factionDefId: 'civic_guard'`, and `membership_change` joins that body |

**4 of 4** against the contract floor of 3. Note the `factions` count is earned by the cast spec, **not** by `membership_change` — see Findings #2.

### Trait hooks (mandatory four questions)

1. **Gate?** No. Open-draw ambient content gates on nothing; a barred store is a barred store to everyone.
2. **Variant?** **Yes** — `trait.core.core_warmth.virtue` (Warm). `forecastDelta: +0.04`, `difficultyDelta: -0.02`, `factorLine:` *"Being Warm, they will not walk out on a settlement's winter."* (11 words, inside the 12-word budget — the drafted line ran 15.) Chosen because `core_warmth` governs *care for others*, which is the fork's own question; a Warm mortal is the one the axis was written for.
3. **Trait-only nudge?** No. The specials budget is spent on the two cards the dealer structurally cannot produce, and the Repertoire deals `card.trait_card.core` itself.
4. **Trait fragment?** No — the variant's factor line carries it.

All refs are live: `trait.core.core_warmth.virtue` is a `CORE_CONTINUA` member (`core_warmth`, virtue pole "Warm"), so `validateTraitRefs()` does not report it dead.

### Images

| Surface | Tag | Resolves? |
|---|---|---|
| `granary.wake_their_fear` | `generic.dark` | ✅ `NUDGE_CONCEPT_ART` |
| `granary.weigh_the_winter` | `generic.light` | ✅ `NUDGE_CONCEPT_ART` |
| `granary.lift_the_bar` | `generic.matter` | ✅ `NUDGE_CONCEPT_ART` |
| `granary.narrow_their_sight` | `generic.dark` | ✅ `NUDGE_CONCEPT_ART` |
| scene tag | `scene.settlement` | ✅ `BUILT_SCENE_GENERICS` |

`illustrationUrl`: none declared.

---

## 15b. Concept Art Direction

**Question 1 — what emotions does this story carry?** Held breath. The specific dread of a room you must cross without waking it. And underneath that, a quieter thing: the moral weight of a store — a building whose entire meaning is *there will be food in three months*, standing between a settlement and a hungry season, with something asleep on top of it.

**Question 2 — what image evokes those without illustrating the scene?**

> **Interior, night. A grain store from the inside, empty of people.** Foreground: one dark bin standing open, spilled barley fanned across the boards in a long tongue, and pressed flat into that spill a single enormous paw-print — the only sign of the animal in the frame. Middle ground: the boards run away into black. Far end: a second door, shut, with the thin cold blue of outside showing along its bottom edge — the only cool light in an otherwise warm-dark, lamp-coloured room. A dropped lantern lies on its side, unlit. No figure. No animal.

The art shows **residue, not event**: the print instead of the bear, the spill instead of the raid, the far door's cold line instead of the escape. It states the encounter's two facts before the reader has a word of prose — *something very large is in here*, and *there is another way out* — and it makes the second fact feel like the thin edge of a hope rather than a plan.

**Not** a bear rearing in a doorway. **Not** a figure creeping past. Both would illustrate the scene the prose is about to state plainly, which is the failure this method exists to stop.

---

## 16. Support Bundle Contract

| Support object | Delivery mode | Where it comes from | Persistence contract | Future references | Verified by | Status |
|---|---|---|---|---|---|---|
| **the keeper** (`keeper`) — the person holding the key | `lazy-materialize-on-trigger` (reuse-first) | `reuseNpcRoles: ['guard','quartermaster','elder','hunter','ranger','wanderer']`; else spawn `guard` named *Hedda Varn*, `factionDefId: 'civic_guard'` | `must-persist` — carries the `intelligence` record on one `negative` reaction, is the face of the watch on the `positive` side, and is named as the watch in the spine | Any later `civic_guard` encounter at this settlement; a return visit; the `intelligence` record | Roster read against `LOCATION_ROLE_ROSTERS` for all four roster keys the envelope reaches | `live` |
| **the store** (`store`) — the barred building | `lazy-materialize-on-trigger` (reuse-first by `sublocationTypeId`) | `sublocationTypeId: 'sublocation-type.warehouse'`, `fallbackName: 'the stores'`; `encounterSupportBundle.ts` reuses an existing warehouse sublocation at the location before minting one | `must-persist` — a settlement's store is not scene furniture | Future `encounter.hunt.*` members; any store/supply encounter; the hex's sublocation list | `encounterSupportBundle.ts` materializes it as `type: 'location'` + `parentLocationId` — the canonical sublocation shape (THR-1183) | `live` |
| **the settlement** (`$target`) | `pre-seeded` | The location the encounter spawned at; `generateUnifiedCandidates` sets `targetId: locationId` for a `locationSubtypes`-gated candidate | `must-persist` | Carries **Festival** or **Blighted Harvest** for the season | The Unfinished Rite's shipped precedent for `targetLocationId: '$target'` | `live` |
| **the watch** (`civic_guard`) | `pre-seeded` | `FACTION_DEFINITIONS` → `civic_guard`; chapters seeded by `factionSeeding` | `must-persist` | The agent's `member_of` edge; faction roster; future watch work | `resolveFactionNodeId` resolves a def id to a chapter node | `live` — **with a locality caveat, Findings #2** |
| **the agent's pack** | `lazy-materialize-on-trigger` | `spawn_artifact` category `mundane`, tier `common`/`uncommon` — no `tagFilters` (an unverified tag is a silently empty pool) | `must-persist` | The agent's possessions | Exemplar precedent (no filters) | `live` |
| **Wounded / Terrified / Festival / Blighted Harvest** | `pre-seeded` | `CONDITION_TRAIT_DEFINITIONS` | `must-persist` (duration edges) | Tier promotion (wound signal); location price and gate readers | Ids read directly from `condition-trait-content.ts` | `live` |
| **the bear** | `blocked-primitive` | Nothing. There is no non-human cast primitive. | `scene-only` (prose + the conditions it leaves) | None — the animal leaves no node behind | `NpcRole` union read in full | `blocked-primitive` — **Findings #1** |

**Support-network audit notes.**
*NPC cast:* every role in `reuseNpcRoles` is seeded by at least one roster key the envelope reaches — `hamlet` (rural: hamlet, farmland) has `guard`, `elder`, `wanderer`; `military_outpost` (stronghold: fort · wayside: camp) has `guard`, `quartermaster`; `capital` (stronghold: castle) has `guard`; `wilderness` (wayside) has `hunter`, `ranger`, `wanderer`. No roster key the envelope reaches is left with zero reuse candidates. `mining` and `oasis` have no roster entry at all (`SUBTYPE_TO_ROSTER_KEY`) and fall through to the spawn path — correct behaviour, recorded.
*Faction:* `civic_guard` is a live definition with real ranks; the keeper belongs to it by construction, which is the reason the settlement's answer to the bear is *organised* rather than a mob. "The watch" reads at all three envelope classes — a village, a waystation and a fort each keep one — so naming it in the setting-neutral spine does not break class honesty.
*Location/geography:* the encounter needs a barred store, which the support bundle supplies rather than assuming. Nothing else is required of the terrain.
*Reward/burden:* every reward and burden is a real object — an artifact node, two person-conditions, two place-conditions, a `member_of` edge, a hidden mark, an intelligence record.
*Follow-on:* two named pressures — a settlement short of food for a season (`harvest_blight` feeds prices and gates), and a bear now in the fields on the `positive/critical_failure` band. Both are world state, not seeds; see Findings #6.

---

## 17. Self-Audit

Checked against the spec's step-8 evidence checklist and `Docs/encounter-support-network.md`'s support-bundle contract. **Rows marked *(corrected at editorial)* recorded a PASS the text did not support; the finding and the repair are both stated.**

| # | Item | Verdict |
|---|---|---|
| 1 | Design block written before prose (crux, title, catalogs, hook, reach-per-step, motive, mechanics, rewards, choice, promises, systems count) | **PASS** — §§2–8 are the design block; the fiction was fitted to the fork, the axis, the wound and the two consequence families, all of which were fixed by the brief before a sentence existed. |
| 2 | Crux in one plain sentence | **PASS** — *"What {name} is owed is locked in a store with a bear asleep on top of it, and the settlement is about to burn the building."* |
| 3 | Title states the crux (glance test) | **PASS with a flag** *(corrected at editorial)* — a player reading only *The Beast in the Granary* knows both the complication and where it is. But neither noun appears in the encounter's prose, which says *bear* and *the store* — "granary" because the wayside and stronghold classes would make it wrong. The template id was rolled by the brief and renaming is not the editorial pass's to do; recorded for the report alongside the corpus's existing `the-granaries-in-the-famine-year.ts`, which shares a noun and nothing else. |
| 4 | Shape named from the catalog and matched by the step structure | **PASS** — Personality Fork, 1 plain step + 1 branch node. |
| 5 | Opening skeleton, ≤80 words, one opening per declared class | **PASS** — **79** at the longest class after the editorial additions (was 77); `rural`, `wayside`, `stronghold` all authored; `validateSettingEnvelope` has nothing to report. |
| 6 | Narrator mode — facts stated, never encoded; no interior sensation, no camera work | **PASS** — see the 12-question checklist below. |
| 7 | Every nudge-bearing step carries a full composed hand | **PASS** — 3 hands, 6 / 5 / 5 composed. |
| 8 | Every card's target established in prose before the hand is dealt | **FIXED** *(corrected at editorial)* — the draft asserted the bins were introduced in the spine. They were not: the spine read "on the winter grain" and `granary.weigh_the_winter` is a **beat-1** card acting on "the bins". Separately, `civic_guard` appeared in no prose at all while carrying a reaction, a chip and the drawn `membership` family. Both are now in the spine, inside budget. |
| 9 | ≤2 authored specials per step; specials are things the dealer cannot produce | **PASS** — 2 / 1 / 1. Beat 1's pair carry `poleLean` (the dealer cannot know the axis); beat 2's are a named scene object and a reach-scoped mark (the spec's two named special shapes). |
| 10 | Every card pays off in failure; big-delta cards cover both failure bands | **PASS** — every card has a `failure` fragment; `granary.narrow_their_sight` (0.16) covers `failure` and `critical_failure`, and that `critical_failure` now has an aftermath band to land in. |
| 11 | No digits or `%` in any `effectLine`; names ≤4 words, imperative verb + noun | **PASS** — *Wake Their Fear* / *Weigh The Winter* / *Lift The Bar* / *Narrow Their Sight*. |
| 12 | No effect line repeats a content word from its own card name | **PASS** *(corrected at editorial)* — the draft claimed a card-by-card check; it had not caught that *Narrow Their Sight*'s line was the only declarative face in a set of imperatives. All four are now imperative-led (Fill · Show · Open · Dim) and no content word repeats. |
| 13 | ≥1 card priced on a non-essence channel | **PASS** — `granary.weigh_the_winter`: `essenceCost: 0`, `costs: { detectionDelta: 3 }`, and the effect line says where the price lands. |
| 14 | Every effect line states mechanism, not mood | **FIXED** *(corrected at editorial)* — `granary.weigh_the_winter` stated only its moral lean; nothing on the face said why counting a village's winter helps a mortal cross a dark floor. The line now names the floor as well as the count. |
| 15 | ≥1 card with a real `grants` entry naming built content | **PASS** — `granary.wake_their_fear` grants `trait.condition.terrified`, a shipped `CONDITION_TRAIT_DEFINITIONS` member. (Two further grants: a reach-scoped mark and the aftermath's five effect kinds.) |
| 16 | ≤1 rider per hand | **PASS on the authored half** (0 riders authored). **FLAG** on the composed hand — Findings #3. |
| 17 | ≥4 spheres, ≥1 ungated common | **FLAG** — author-side 2 spheres and 0 commons per hand by construction; the rest is the dealer's, and the dealer *prefers* rather than guarantees. Findings #3. |
| 18 | ≤2 Boosts | **PASS** — `boost` excluded on every step. |
| 19 | ≥3 distinct card types per composed hand | **PASS**. |
| 20 | Open-draw reachability: every step at `fair` or below | **PASS** — 0.40 / 0.44 / 0.36, all under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45), and `intrinsicTier: 'background'`. |
| 21 | No authored `factorLines` (variance rule) | **PASS** — none. The one authored surface used is `TraitVariant.factorLine`, which is variance by construction, and it now runs 11 words against the 12-word budget. |
| 22 | Six `StepOutcome` bands covered across each hand | **PARTIAL / by design** — the specials cover 3–4 bands each; the dealt cards bring `BAND_FRAGMENTS` for the rest, which is the composed-hand contract (`checkNudgeHand` stands the whole-hand band rule down on a `deal`-bearing step). |
| 23 | Five afterimages authored per step; action-level `narrativeTemplates` present | **FIXED** *(added at editorial)* — the draft authored **none**. `ActionStep` carries five afterimage fields, the shipped composed-hand precedent authors all five, the detector spec names them as an authored `outcome`-class surface, and SKILL trigger 25 says the outcome ladder lives in afterimages and band prose. §9's ladder had no field to live on and Stage 4 would have had nothing to transcribe. All fifteen are in §10b, written from that ladder, with `initiation` / `success` / `failure`. |
| 24 | Beat-2 prose true under every step-0 outcome | **FIXED** *(corrected at editorial)* — both continuations opened "{name} has the pack", but step 0 is `continue_weakened` and mints the artifact on `successMetadata` only, so a failed-but-continuing crossing reached a fork asserting a possession the engine had not spawned. Both now state position. |
| 25 | `aftermathConfig` present, `byOutcome` floor ≥3 bands incl. one extreme | **PASS** — seven bands across two variants: `critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure` ×2. Success-side ✅ failure-side ✅ extremes ✅. |
| 26 | Both poles carry an extreme band | **FIXED** *(added at editorial)* — `positive` authored both extremes and `negative` neither, which reads as the lesser branch whatever the design commentary says. `negative` / `critical_failure` authored, backed by that step's existing `failureMetadata`. |
| 27 | Every variant carries an `overview` | **PASS** — `positive`, `negative`, `fallback`. |
| 28 | Every `change` declares `concepts` (Law 2) | **PASS** — every chip in §15 carries at least one. |
| 29 | Every chip backed by a write on the face that shows it (Law 56 cl. 1) | **PASS with one flagged exception** — the membership chip is reaction-conditional. Findings #5. |
| 30 | Every chip's referent is a real graph object and the sentence names it (Law 56 cl. 2) | **PASS with one flagged caveat** — anchors are `$target` (location, linked), `$faction:civic_guard` (faction, linked), `$actor` (agent, linked), attachment template ids (linked). Every one classifies `ok` under `classifyAnchorDeclaration`. The caveat is that a def id does not identify a *chapter*; no content-side fix exists. Findings #2. |
| 31 | ≥1 chip anchored at the place with `visualKind: 'location'` | **PASS** — two: the feast day and the hungry season, both `entityId: '$target'`. |
| 32 | Membership chip anchored at the group, not a person | **PASS** — `$faction:civic_guard`, `visualKind: 'faction'`. |
| 33 | ≤1 `individual`-anchored chip | **PASS** — exactly one (`their own goods, back` → `$actor`). |
| 34 | No `reputation_tally` chip | **PASS** — no reputation chip of any kind. |
| 35 | Consequence draw recorded and every drawn family wired | **PASS** — `['possession','membership']`; `possession` via `spawn_artifact` on a plain step *and* in a reaction, `membership` via `membership_change` in a reaction and promised in the spine. No swap. |
| 36 | Systems quota ≥3 from the authored manifest | **PASS** — 4 (`cast`, `rewards`, `conditions`, `factions`). |
| 37 | Card `imageTag`s resolve to library rows | **PASS** — all four are `NUDGE_CONCEPT_ART` members. |
| 38 | Cast binding mandatory and class-honest across the whole envelope | **PASS** — verified against `LOCATION_ROLE_ROSTERS` for `hamlet`, `capital`, `military_outpost`, `wilderness`. |
| 39 | No `{cast:<key>}` token naming an undeclared key | **PASS** — only `{cast:keeper}` is used; both keys are declared. |
| 40 | Prose never genders a bound cast member | **PASS** — the keeper is referred to by role or token only. |
| 41 | Prose invents no game state (rule 7) | **PASS** — the only relationships asserted are *tonight's* (the agent's goods went behind the bar at dusk by a stated local rule) and one **read** of a declared cast property (the keeper's `factionDefId` → "of the watch"). No prior visit, no standing, no debt-with-history. The Warm trait's factor line is a read through a declared gate. |
| 42 | Every promise pays off | **PASS** — the two men carried out set the wound's price and it is paid at every failure band; the settlement's fire threat is delivered on five of seven bands; the far door is introduced in `positive` prose and is the card, the test, and the critical-failure image; the watch is named in the spine and is the `positive` pole's membership ending. |
| 43 | Seam-echo check (opening→spine, spine→variants, variant→variant, afterimage→aftermath) | **FIXED** *(corrected at editorial)* — the draft reported this clear. The two variants shared a **verbatim twelve-word sentence** (*"The bear is asleep across the floor with the bins behind it."*) and both opened by restating the spine's closing image. Rewritten so the paragraphs share no sentence and each opens on its own new fact. One further echo was caught while authoring §10b and removed: the `negative` `successAtCost` afterimage and the `negative` / `success_at_cost` aftermath both wanted "a boot-mark in spilled grain"; the afterimage now reports a bin going over, the aftermath what the keeper found. |
| 44 | Vagueness lexicon at zero; ≤1 annotation clause; zero divine outcome-authorship | **FIXED** *(corrected at editorial)* — the draft checked `something` / `someone` only. The `outcome` field class also enforces the **natural indefinites** at zero, and there were seven hits: `nothing` ×3, `thing`, `things`, `way` ×2, across two card fragment sets, two aftermath bands and the fallback. One of them (*"Nothing existed but the way out"*) also carried a `not … but` shape that would have spent the encounter's single annotation budget on a card fragment. All cleared. Zero evasive terms throughout; the god is never the grammatical author of a result. (`rather` inside "rather than" in the `negative` / `failure` band is an intensifier **warning**, not a failure — the spec says so by name.) |
| 45 | No second person on any mortal-facing surface | **FIXED** *(corrected at editorial)* — *"A bear that will not be moved moves you"* on `positive` / `critical_failure`. Now "…moves the one who tries." |
| 46 | Support bundle contract complete; every `lazy-materialize` object answers the five questions | **PASS** — §16. |
| 47 | Blocked primitives filed | **PASS as a report obligation** — Findings #1 and #2 are `blocked-primitive` / defect class and are handed to the batch report rather than approximated. |

### The 12-question narrator's checklist, answered in writing

1. **P1 says how the agent arrived, with real graph names?** Yes — `{name}`, `{location}`, one arrival sentence per class.
2. **P2 states what is happening and what has gone wrong, as events with costs already paid?** Yes — the store is barred, the keeper of the watch will not open it, a bear has denned inside asleep on the bins, two men who went in were carried out.
3. **P3 lands exactly one stake shape from the table?** Yes — `choice`: two courses, both costly. No compounding.
4. **Opening ≤80 words?** Yes — 79 at the longest class.
5. **Could a GM read every sentence aloud as a report?** Yes. Nothing is felt; things are the case.
6. **Every fact stated, never encoded?** Yes — "{cast:keeper} of the watch will not open it" is the sentence, not a shot of a hand on a lock. "Two men who went in were carried out" states the cost rather than staging it.
7. **Every sentence serves challenge, test, or outcome?** Yes — audited sentence by sentence; the spine has six sentences and each is one of: the obstacle and who holds it, the animal and where it lies, the price already paid, the agent's claim, course A's cost, course B's cost.
8. **Nothing referred to before it is introduced?** Yes — the keeper and the watch, the bins, the bear and the grain all in P2; the pack and both doors in P3; the far door introduced in the `positive` continuation before the card names it.
9. **One named person on stage per beat, named over unnamed?** Yes — the keeper in beat 1; nobody else on stage in beat 2 (the agent and an animal).
10. **Can the player restate the stake in one sentence?** Yes — *"Their own goods are locked in a store with a bear on them, and the only two ways to get them out either burn the village's winter or put them in a dark room with the bear."*
11. **Every card verb+noun and described like a spell?** Yes — four names, four imperative-led one-or-two-sentence effect lines, no odds talk, no mood, no digits, no flavor quote.
12. **Every declared setting class has an opening in the skeleton?** Yes — `rural`, `wayside`, `stronghold`.

### Branch seduction self-check

| Question | `positive` — Put it out | `negative` — Get back out |
|---|---|---|
| Why would a god choose this on purpose? | Because a god who wants a mortal *rooted* wants this: it is the one night that turns a traveller into someone a place will send for. | Because a god who wants a mortal *unowned* wants this: no debt, no roll, no address, and the thread stays portable. |
| What fantasy of interference does it offer? | Nudging a person into staying in a room they had already escaped. | Nudging a person into the discipline of taking exactly what is theirs and nothing else, in a room full of things that are not. |
| What value or future does it protect that the other does not? | The settlement's next season, and the mortal's place in it. | The mortal's freedom of movement, and the option of never being anybody's. |
| With the labels removed, still distinct and tempting? | Yes — different reach, different difficulty, different card, different door, different ending state for the location. | Yes — and it is not the "bad" branch: the settlement was always going to burn the store, and the mortal did not cause that. Both poles now carry an extreme band, so neither reads as the lesser one. |

Both survive. Neither is cut.

---

## Experience Differentiator Gate

**Scene & Prose (Doctrine v2)**
1. Opening follows the skeleton — arrival · situation & complication · the problem, ≤80 words, real graph names, facts stated plainly? — **YES**
2. Every sentence doing challenge/test/outcome work; no interior sensation, no camera work, no atmosphere without a job? — **YES**
3. Scene prose names and introduces the specific elements the hand later acts on (the keeper, the watch, the bar, the bins, the winter grain, the sleeping animal, both doors)? — **YES**
4. Could a player retell the situation and the stakes accurately after one read? — **YES**
4b. No seam echoes across any paragraph boundary — opening→spine, spine→variants, variant→variant, afterimage→aftermath? — **YES**

**Choices & Intervention (the nudge hand)**
5. Every card reads like a spell — imperative verb + noun, 1–2 direct effect sentences, no flavor quote? — **YES**
6. Every card's price real and legible, and every effect line stating mechanism rather than mood? — **YES** (two priced in essence, one in detection at zero essence, one in essence plus a permanent value shift stated on the face; all four faces now name what the god does and why it moves the odds).
7. Every card pays off in failure — at least one failure-band fragment; both bands for a big-delta card? — **YES**
8. Hand grounded — delete the target from the prose and the card is senseless here? — **YES** (delete the bins and *Weigh The Winter* is nonsense; delete the far door and *Lift The Bar* is nonsense; delete the sleeping animal and *Wake Their Fear* is nonsense).
9. Do the cards answer different questions? — **YES** — beat 1's two specials buy *opposite directions*, not the same certainty; the fill is context-tagged and type-deduplicated against them.
9b. Every nudge-bearing step carries a full authored hand per the guardrails, and no step asks the player to pick a branch or an ending? — **YES** — three composed hands; the fork is `decidedBy`, and `authoredChoices` appears nowhere.

**Aftermath & Consequence**
10. Aftermath has its own prose — a reflective landing before the mechanics? — **YES** — eight authored ending paragraphs, plus fifteen afterimages carrying the step-level ladder.
11. Consequence outcomes actor-centred with names and faces, not anonymous stat deltas? — **YES** — the keeper counts the bins by lamplight; the watch asks the agent to stand with them; a traveller on the road bleeds when they lift the pack.
12. Medium+ scale: aftermath offers reaction choices where the player decides which thread to carry? — **YES** — four pairs, one per face-group.
13. Do the reaction choices represent different philosophical stances about consequence? — **YES** — belonging vs. motion; simple mercy vs. an expensive lesson; non-interference vs. owing a place the truth.

**Presentation**
14. Concept Art Direction uses the two-question method (emotions → evocative image) rather than illustrating the scene? — **YES** — §15b shows a paw-print in spilled barley and a cold line under a far door, with no animal and no figure in frame.

**All 14 YES.**

---

## Findings for the batch report

Per the brief: *"a wanted-but-missing capability is a FINDING to report, never something you approximate or mint."* None of these was worked around in content.

**1 · There is no non-human cast primitive — the beast cannot be a bound scene actor.**
`EncounterSupportActorSpec.spawnNpcRole` is typed `NpcRole`, whose 56 members are all human occupations (`innkeeper` … `oracle`). So the opposition of the game's first hunt cannot have a portrait, a cast-strip tile, a click, or persistence, and — the sharper consequence — **`StepNudge.opposes` is unavailable against it**. `opposes` is what makes a Stumble read as *"the bear puts a foot wrong"* instead of a nameless tilt in the god's favour, and it needs a cast key. Every card in this encounter that acts on the animal therefore attributes to the card rather than to the creature. The brief forbids a bestiary and I did not build one; this is the concrete cost of that, and it will recur in every `encounter.hunt.*` member.

**2 · Three sets in `compositionContract.ts` still disagree about `membership_change`.**
THR-1221 widened `CHIP_BACKING_EFFECT_KINDS` to include it, with a comment explaining that `membership_change` is the *sole* satisfier of the `membership` consequence family. But `FACTION_EFFECT_KINDS` (which decides the `factions` **systems-quota** connection) does not list it, and neither does `PERSISTENT_EFFECT_KINDS` (which decides the `rewards` block). So an encounter that draws `membership`, wires it correctly, and reports it honestly earns **zero** system connections for doing so. This encounter reaches its `factions` count through the keeper's `factionDefId` instead — which is real, but it means the quota is not measuring what the author actually built. Same defect class as THR-1221, one set further along.
*Sub-finding, same area:* `membership_change` resolves its `factionId` through `resolveFactionNodeId`, which matches a **definition** id against every faction node in the world and returns `matches.sort()[0]` when several chapters share it. There is no sentinel for *"the chapter that holds the ground this encounter spawned at."* So "the settlement takes them in" can enrol the agent in a `civic_guard` chapter on the other side of the map, and the chip's click will open that chapter's sheet. Nothing in content can fix this. The anchor catalog states the same rule from the other direction — *"anchor to the faction node id, not its `factionDefId`"* — which is advice this encounter is structurally unable to follow.

**3 · Three composed-hand rules have no owner on a dealt step.**
`checkNudgeHand` stands the whole-hand rules down on a `deal`-bearing step (correctly — the hand does not exist until a god is known), and `checkComposedHand` re-checks only size, specials count, tag duplicates and exclude length. That leaves **≤1 rider**, **≤2 Boosts** and **≥4 spheres / ≥1 ungated common** enforced by nobody: the author cannot satisfy them (they are properties of a hand they do not compose) and the dealer's documented guarantees cover only size, delta budget, type-deduplication against specials, and a *preference* for breadth and a common option. A fill of four could legally arrive as Insurance + Mercy + Gambit + Favor — three riders in one hand, which the brief lists as a binding rule. Either the dealer should hold these invariants, or the rules should be restated as dealer obligations rather than authoring ones.

**4 · `deal.exclude` is typed by card *type*, but the over-exposure census is per *member* — and the census counts the field the fix removes.**
The brief's table names three members (`card.boost.core`, `card.boost.signature.energy`, `card.undertow.signature.darkness`), and `libraryCardId` — the field the census counts — is per member. But `StepDealDeclaration.exclude` is `readonly NudgeCardTypeId[]`. Honouring the instruction therefore costs the whole family: excluding `boost` also removes `card.boost.variation.patient` (a milestone reward, not over-exposed at all), and excluding `undertow` removes `card.undertow.hunger.consume`. This encounter deals no Boost at any step as a direct result.
*Added at editorial — the second half of the same defect.* The brief also requires that **every card matching a library member sets `libraryCardId`**. `granary.narrow_their_sight` matches `card.undertow.signature.darkness`, which the same brief bans as a special at 7 uses. The only legal move is to declare a genuine one-off with no `libraryCardId` — which is what this draft did, with a stated reason — but since the census is *computed from* `libraryCardId`, the sanctioned response to over-exposure is also the thing that stops the over-exposed member being counted. The census will read this card as a non-event. A member-level exclude, or a member-level damping weight in the dealer's scorer, would let the census's actual finding be acted on without the author having to launder the field it measures.

**5 · Law 56 clause 1 and the reaction-pick model are in unresolved tension.**
Chips render in the aftermath *before* the player picks a reaction, but `chipBackingForFace` accepts a reaction's effects as backing. So a chip can legally report state that the player is about to decline. This encounter's `PATH · a place in the watch` chip is exactly that shape, and it is not an outlier — the shipped `the-unfinished-rite.ts` does the same with `rite.crit.telling` (a `path` chip backed only by the optional `rite.let_it_be_told` reaction). The alternative available to an author is to move the write onto a step, which is honest but **structurally unavailable to a `decidedBy` fork's pole-specific writes** — see #7. Worth a ruling: either chips should render after the pick, or reaction-backed chips should be a distinct, conditional chip tier.

**6 · No `encounter_seed` authored, deliberately — and the reason is a coverage fact, not a preference.**
A hunt's obvious sequel ("the bear is in the fields now") has nowhere to land: `encounter.hunt.*` is a new family whose only member is this template, so a `templateId` seed would seed *itself* (a loop on the same agent), and a `encounterFamily` seed would draw the same single member. Family seeding is additionally documented as emitting narrative events only in v1. The consequence is carried as world state instead (the `positive/critical_failure` band leaves the animal loose and the store burned), which is honest but does not schedule anything. **The first `encounter.hunt.*` batch that ships two or more members should author the seed link between them.**

**7 · The Composition Contract does not descend into branch variants — a Personality Fork's continuations are largely ungated.**
`plainSteps()` and `nudgeBearingSteps()` both read `template.steps` at the top level and filter out `ActionStepBranch` nodes entirely. Consequences, all of which this encounter runs into:
- The two pole-specific steps are **not checked** for reach, difficulty, or `narrativeTemplate` (Steps block), and their `purposeLine` is unchecked.
- Their **hands are not checked at all** — `checkNudgeHand`, `checkComposedHand` and the `imageTag` resolution check all skip them. Two of this encounter's three composed hands are invisible to `check:encounter`.
- `allAftermathEffects()` reads `plainSteps()` for step metadata (while `stepBackingForFace()` correctly uses `allRunnableSteps()`), so **a branch variant's step writes are invisible to the systems quota, to `hasReward`, and — most consequentially — to the consequence-draw gate.** That last one is what forced this encounter's `membership_change` into a reaction rather than onto the `positive` variant's `successMetadata`, where it would have been unconditional and would have made finding #5 moot.
This is the gate reporting green over the exact half of a fork that the fork exists to create. `allRunnableSteps()` already exists in the same module and is used by one caller; the fix looks like extending it to the others, but the Steps-block count semantics (1–3 *plain* steps) need a decision first, which is why this is a finding and not a patch.
*Editorial note:* this finding is also why the draft's own errors in the branch variants — a card face repeating a scene object the beat never introduced, a `reach` that contradicted its reaction's stated meaning, seven lexicon hits, and fifteen missing afterimages — would have shipped green. Nothing downstream of Pass 2 inspects that half.

**8 · The corpus's only positive location condition is deprecated with no replacement.**
`trait.condition.location.standing_welcome` — "A Standing Welcome", the natural write for *"the settlement takes the agent in"* — is marked **DEPRECATED (THR-1206), zero writers, do not author new writers against it**, superseded by `reputation_with`. That leaves `festival` as the only live positive location condition, and a festival is an event, not a standing. This encounter uses `festival` for what it actually says (a settlement that kept its winter throws a feast) rather than stretching it into a standing, and routes the standing meaning through membership instead. But an author who wants *"this place is warm to you now"* as a place fact has no member to say it with.

**9 · The brief's premise that `membership` is a zero-user family is stale.**
The brief states this would be "the first membership consequence in the game" (`groups` counted 0 in the portfolio census). Two shipped templates already wire `membership_change`: `src/data/encounters/toll-of-blades.ts` (step 2 `successMetadata`, `factionId: 'mercenary_company'`, chipped) and `src/data/mercenary-encounter-content.ts` (two sites). The consequence is still rare and still worth wiring, and nothing about the design changes — but the portfolio census's `groups` count should be re-taken before the next batch quotes it.

**10 · The draft's self-audit passed itself on four checks that failed.** *(Added at editorial.)*
Rows asserting the bins were introduced in the spine, that no effect line repeated a name word, that the seam audit was clear, and that vagueness was at zero each recorded a PASS the text did not support — and two of them named a specific sentence that does not exist in the draft. The design work behind the audit was sound; the audit was written from intention rather than from the text. This matters beyond one encounter because a 41-row self-audit is a surface the pipeline is otherwise inclined to trust, and — per finding #7 — the machine gates cannot cross-check the half of a fork where three of the four errors lived. Worth considering whether the draft prompt should require quoting the sentence that satisfies each prose-grounding row, rather than asserting it.
