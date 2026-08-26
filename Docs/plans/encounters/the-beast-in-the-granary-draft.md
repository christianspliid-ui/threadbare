# Encounter Pipeline: The Beast in the Granary
> Scale: medium | Slug: the-beast-in-the-granary | Pass: draft
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
| `src/data/encounters/the-unfinished-rite.ts` | The corpus's **first** composed hand (THR-1254) and therefore the only live model for `deal` + specials. Its "both specials are things the dealer structurally cannot produce" rule is the rule I cut my specials against. |
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
| **the keeper** (`supportBundle` key `keeper`) | The person who holds the key and will not open the door. Owed-to relationship runs the other way: the agent's goods are behind their bar. Carries `factionDefId: 'civic_guard'` — they are the settlement's watch, which is what makes the membership consequence a real body rather than a mood. | `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['guard', 'quartermaster', 'elder', 'hunter', 'ranger', 'wanderer']`, `spawnNpcRole: 'guard'`, `supportRole: 'store_keeper'`, `spawnName: 'Hedda Varn'` |
| **the store** (`supportBundle` key `store`) | The barred building itself — the place the whole encounter is inside. A real, persistent sublocation node so the prose's "the store" is a thing on the map and not landscape fiction. | `lazy-materialize-on-trigger`, `must-persist`, `sublocationTypeId: 'sublocation-type.warehouse'`, `fallbackName: 'the stores'` |
| **the bear** | The opposition. **Not cast, not a node, not a bestiary entry** — prose, difficulty, and the conditions it leaves. See Findings #1. | prose only |
| **the settlement** | `$target` — the location the encounter spawned at. Carries the place conditions below. | pre-existing |
| **the watch** (`civic_guard`) | The faction the settlement's keeper belongs to and the body a saved store can swear the agent into. | faction definition, live |
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
The mortal reaches the pack and stops. Their standing position on `sacrifice_survival` plus the net `poleLean` of the cards the god committed on beat 1 decides which of two continuations they take. **The player never picks.**

- **`positive` — Put it out.** `iron`, difficulty `0.44` (`fair`), `failBehavior: 'fail_action'`, `purposeLine: 'Put it out'`. They take their pack and then they stay, and try to drive the animal out of the building through the far door rather than leave a settlement to burn its own winter.
- **`negative` — Get back out.** `shadow`, difficulty `0.36` (`fair`), `failBehavior: 'fail_action'`, `purposeLine: 'Get back out'`. They take what is theirs and nothing else, and go back the way they came. The store is the settlement's problem and will be dealt with in the morning, by fire.

Two beats. Both are nudge-bearing; each carries its own composed hand.

---

## 7. Branching Profile

- **Branch depth:** `light`
- **Branch count:** `2`
- **Branch shape (from the catalog):** **Personality Fork** — *"1 + branch. The mortal makes a choice: a test, then an agent-decided branch on a value axis (THR-894), pole-specific continuations."* Step structure matches the named shape exactly: one plain test, one branch node.
- **Value axis:** `sacrifice_survival` (Star — Martyr `positive` ↔ Survivor `negative`).
- **Where branching lives:** step prose (two fully written continuations), reach (`iron` vs `shadow` — the poles test *different things about the mortal*, not the same test twice), difficulty, the hand (a distinct special per pole), band fragments, aftermath variant, aftermath reactions, and the place condition the settlement ends up carrying.
- **Convergence policy:** **none.** The two poles do not reconverge; they resolve into different aftermath variants and leave the settlement in opposite states. The only thing they share is the possession minted on beat 1 — the agent has their own goods either way, because that was never the question.
- **Optional secondary template:** none. No `encounter_seed` is authored — see Findings #6.

**Why the player is not choosing.** The god's only surface is the hand on beat 1. Two of its cards carry `poleLean`; four are dealt from the Repertoire and abstain. The engine reads the mortal's live axis, adds the committed leans, and records the pole through the existing choice-history path. There is no card, label, or button anywhere that names a branch.

---

## 8. Branching Map

**Beat 1 (no branch) → beat 2.** The recorded pole (`positive` / `negative`) selects the step definition.

| | `positive` (Martyr) | `negative` (Survivor) |
|---|---|---|
| **Beat 2 prose** | The far door, barred from the inside; the cold outside it; the animal between. They are trying to *move* something that outweighs them. | The near door, four steps of floor, and a pack that now has weight. They are trying to *not be noticed* leaving. |
| **Reach / difficulty** | `iron` / 0.44 | `shadow` / 0.36 |
| **Special card** | `granary.lift_the_bar` — the far door, matter-of-the-building | `granary.narrow_their_sight` — everything but the pack goes dim; deepens the survivor mark |
| **`deal` tags** | `['might', 'peril']` | `['shadow', 'finesse']` |
| **Step writes (success)** | `condition_attachment` **Festival** on `$target` | `condition_attachment` **Blighted Harvest** on `$target` |
| **Step writes (failure)** | **Wounded** on `$actor` + **Blighted Harvest** on `$target` | **Wounded** on `$actor` + **Blighted Harvest** on `$target` |
| **Aftermath variant** | `positive` — bands `critical_success`, `success`, `critical_failure` | `negative` — bands `success`, `success_at_cost`, `failure` |
| **Aftermath reactions** | *Let them be sworn to the place* (`membership_change` join `civic_guard`) / *Let them be paid and go* (`spawn_artifact`) | *Let the settlement find it in its own time* (`hidden_mark`) / *Let the keeper hear it from them* (`intelligence` to `$cast:keeper`) |
| **What the world keeps** | A settlement with its winter, a feast, and possibly a new name on the watch roll | A settlement with a blighted season, and either a secret or a warning |

Both poles carry the wound risk and both mint the possession. What differs is who is left holding the cost.

---

## 9. Outcome Ladder

Five bands, read at the *action* level (`UnifiedActionOutcome`).

| Band | Progress made | What was spent | New burden or opening |
|---|---|---|---|
| **critical_success** | On `positive`: the bear goes out the far door on its own feet and the store is untouched — bins, sacks, roof. On `negative`: they are out through the near door with their pack and the animal never stirs. | Nothing but the night. | `positive`: the settlement keeps its winter and holds a feast (**Festival** on the location); the watch asks the agent to stand with them. `negative`: nobody knows they were inside, and nobody knows how bad it is in there. |
| **success** | The pack is out. On `positive`, the bear is out of the building; on `negative`, so is the agent. | Sleep, nerve, and whatever essence the god spent. | `positive`: the store stands, and the keeper knows who moved the thing. `negative`: the store will be burned in the morning and the settlement will be short (**Blighted Harvest**). |
| **success_at_cost** | They got what they came for and got out, and something went wrong on the way — a spilled bin, a shout, a bar that would not seat. | Time, and being seen. Authored on the `negative` variant: they got clear, and the settlement knows a stranger was in the store the night before it burned. | The blight lands anyway, and now there is a name attached to it. |
| **failure** | The pack is in hand and the second thing is not done. On `negative`, they are still inside when it wakes and have to go out badly. | **Wounded**. Days on the road. | The store is lost either way; the agent leaves marked by it. |
| **critical_failure** | Authored on `positive`: they try to move a bear, and a bear that will not be moved moves them. | **Wounded**, everything dropped that was not tied on, and the far door left standing open. | The settlement burns the store at first light with the door open and the bear gone into the fields — the winter gone *and* the animal still out there. Nobody is coming to say thank you. |

Failure is plot: the wound is a real condition with a duration edge and negative `iron`/`stone` contributions, and the blighted season is a real place condition every price and gate downstream reads.

---

## 10. Sample Opening

**Openings (one per declared class — `openings.<class>`, P1 only):**

- `rural`: `{name} reaches the village of {location} after dark.`
- `wayside`: `Travelling late, {name} stops at the waystation of {location}.`
- `stronghold`: `{name} is inside the gate at {location} before dark.`

**Shared spine (step 0 `narrativeTemplate`, setting-neutral — P2 and P3):**

> There the store is barred, and {cast:keeper} will not open it. A bear has denned inside, on the winter grain. Two men who went in were carried out.
>
> {name}'s pack went behind that bar at dusk, by the rule of the place. Rouse the settlement and they burn the store to be rid of it. Go in quiet, and the bear lies between {name} and the door.

**Word count:** spine 68; longest P1 (`wayside`) 9 → **77 words**, inside the 80-word budget at every class.

**Stake shape:** `choice` (Die 1, face 6) — two courses, both costly, exactly as the brief declares. No second shape is compounded.

---

## 11. The Hand Per Step

Every nudge-bearing step composes: authored specials + a declared `deal` fill from the god's Repertoire. `exclude: ['boost', 'undertow']` on all three hands, per the brief's instruction to keep the top three over-exposed cards (`card.boost.core` ×11, `card.boost.signature.energy` ×8, `card.undertow.signature.darkness` ×7) out of the dealt fill. See Findings #4 for the collateral that exclusion costs.

### Beat 1 — Cross the floor (`shadow`, 0.40 `fair`)

**Composed hand: 2 specials + `deal: { count: 4, tags: ['shadow', 'peril'], exclude: ['boost', 'undertow'] }` = 6.**

Both specials carry `poleLean`. That is the whole justification for authoring them: **a dealt card cannot lean**, because the dealer does not know this scene's axis, and a Personality Fork with no leaning cards is a fork the god has no lever on. Neither is a plain odds boost and neither carries a rider — the spec retires both as specials.

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
| `effectLine` | *"Fill them with dread of the sleeping thing. They move carefully, and they will want the door."* |

`bandProse`:
- `success` — "Fear kept every step short, and the floor gave nothing away."
- `near_miss` — "Dread had them counting the boards. It did not have them counting the time."
- `failure` — "Dread made them careful, and careful was not the same as quiet."

*Why it leans survival:* the card is the mechanism, not a label. A mortal the god has filled with dread of the thing in the room wants the door, and the door is the survivor's answer. Grant is live content (`trait.condition.terrified` ships in `condition-trait-content.ts`) and it is the encounter's `grants`-naming-built-content card.

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
| `effectLine` | *"Show them how much grain is in the bins, and how many mouths that is. Rival gods will read the light."* |

`bandProse`:
- `critical_success` — "They had the whole floor mapped before they moved, bin by bin."
- `success` — "The light showed the bins and the gaps between them, and they used both."
- `failure` — "They saw exactly how much was in there, and looked a moment too long."

*This is the encounter's non-essence-channel card* — zero essence, paid in detection, and the fiction and the price are the same fact: the god lit a dark room, and light is what other gods read. The lean is earned rather than asserted: a person who has just counted a village's winter in bins does not walk out of that room the same way.

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
*Library type: **Stumble** (host system: encounter cast / the scene's physics). Genuine one-off — no `libraryCardId`. `card.stumble.signature.chaos` acts on an opponent's footing; this acts on a named object of this scene, the far door, which no generic card knows exists. Sphere honors the chaos → Stumble signature.*

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
*Library type: **Undertow** (host system: pole-shift). Genuine one-off — no `libraryCardId`, and deliberately **not** `card.undertow.signature.darkness`, which the brief bans outright and which is over-exposed at 7 precisely because it is the corpus's only reach-scoped mark. The library Undertow charges the mortal in quintessence; a **reach-scoped** `axiological_mark_apply` needs a `reach` a generic card cannot know, which the spec names as the clearest possible special.*

| field | value |
|---|---|
| `name` | **Narrow Their Sight** |
| `sphere` | `darkness` |
| `essenceCost` | 2 |
| `forecastDelta` | **0.16** (≥ `NUDGE_BIG_DELTA` ⇒ both failure bands owed) |
| `imageTag` | `generic.dark` |
| `grants` | `[{ kind: 'axiological_mark_apply', reach: 'star', signedMagnitude: -0.10, targetAgentId: '$actor' }]` |
| `effectLine` | *"Everything but the pack in their hands goes dim. They will not weigh the bins again."* |

`bandProse`:
- `critical_success` — "There was one thing in that room worth seeing and they went straight out with it."
- `success` — "The bins might as well not have been there. They took theirs and left."
- `failure` — "They saw only the pack, and so they did not see the sack their heel found."
- `critical_failure` — "Nothing existed but the way out, which is why they went at it too fast."

*`reach: 'star'` is deliberate and matches the fork:* Star's axis **is** `sacrifice_survival` (Martyr ↔ Survivor). The card deepens the course the mortal already took. It does not decide it — the fork was recorded at beat 1's resolution.

---

## 12. Branch-Dependent Later Paragraphs

**`positive` — Put it out** (step `narrativeTemplate`):

> {name} has the pack. The bear is asleep across the floor with the bins behind it, and the whole village's winter is in those bins.
>
> There is a second door at the far end, barred from the inside. A bear will go toward cold air if there is cold air to go toward. {They} put the pack down by the near door and go the long way round.

**`negative` — Get back out** (step `narrativeTemplate`):

> {name} has the pack, and it is heavier in the hand than it was on the shoulder.
>
> The bear is asleep across the floor with the bins behind it. The bins are not {name}'s and never were. Four steps of open board lie between here and the near door, and the animal is close enough to both.

Neither paragraph names class scenery. Neither shares a sentence shape with the other or with the spine — the spine's rhythm is *fact · fact · fact*, `positive` runs on a plan, `negative` runs on distance.

---

## 13. Aftermath Paragraph

**`positive` variant overview (base):**

> The bear is out of the store, and the grain is standing.

**`positive` / `critical_success`:**

> The animal went out under its own weight and never looked back at the room. {cast:keeper} counted the bins by lamplight, twice, and found nothing missing but a burst sack. There will be a feast in {location} before the week is out, and {name} will be asked to stay for it.

**`positive` / `success`:**

> The bear is in the fields and the store is standing, and both of those are true because one traveller walked back into a room they had already got out of. {cast:keeper} opened the door in the morning to a floor that could be swept.

**`positive` / `critical_failure`:**

> A bear that will not be moved moves you. They came out of the store on their back with the far door standing open behind them and the animal gone into the dark past it. {cast:keeper} put fire to the building at first light anyway, because nobody was going in there again to check. {location} lost the winter and kept the bear.

**`negative` variant overview (base):**

> The pack is out and the store is still barred.

**`negative` / `success`:**

> Four steps, a door, and nobody the wiser. {name} was on the road before it was properly light. Behind them {cast:keeper} was arguing the same argument for the last time, and losing it, and the smoke went up before noon.

**`negative` / `success_at_cost`:**

> They got out with theirs. They did not get out unheard. {cast:keeper} found the near bar off its seat and a boot-mark in spilled grain, and by the time the store burned, {location} had two things to be angry about instead of one.

**`negative` / `failure`:**

> It came awake between them and the door and there was no quiet left to spend. {name} went out through it rather than past it, and paid for the difference. The store burned that morning as it was always going to, and now there is a traveller on the road who bleeds when they lift the pack.

**`fallback`:**

> The store is open again, one way or the other. What is left inside it is the settlement's to count.

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
| **Let it set the way it wants** (`granary.let_it_set`) | `{ kind: 'axiological_mark_apply', reach: 'iron', signedMagnitude: -0.08, targetAgentId: '$actor' }` | *Some lessons are supposed to be expensive.* The god lets the failure teach: the next time someone else's winter is behind a sleeping animal, this mortal will do the arithmetic first. |

### `negative` variant (base reactions; inherited by `success` and `success_at_cost`)

| Reaction | Effect | The thread |
|---|---|---|
| **Let the settlement find it in its own time** (`granary.their_own_time`) | `{ kind: 'hidden_mark', category: 'concealed_action', severity: 0.4, label: 'Was inside the store the night before it burned', targetAgentId: '$actor', revealFamilies: ['investigation'] }` | *Non-interference, held to the end.* The god does not clean up after the mortal and does not confess for them either. The world will find out or it will not, on its own schedule, and the god will be watching when it does. |
| **Let the keeper hear it from them** (`granary.tell_the_keeper`) | `{ kind: 'intelligence', category: 'cultural_knowledge', label: 'What is actually in the store', detail: 'How large the animal is, where it lies, and how much of the winter is under it.', reliability: 0.9, targetAgentId: '$cast:keeper' }` | *You may owe a place the truth even when you took nothing from it.* The god leans the mortal into saying, out loud, what they saw in there — which does not save the store, but means the people burning it know what they are burning. |

### `negative` / `failure` (band reactions)

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
| `fallback` | *(none — `changes: []`)* | — | — |

**No `reputation_tally` chip anywhere** (Law 13 parity — `check:encounter` fails it). No chip reports a quantity.

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

`consequenceDraw: ['possession', 'membership']` — recorded verbatim from the brief. `possession` is wired by `spawn_artifact` on **step 0** (a plain step, therefore visible to the draw gate) and again by `spawn_artifact` in the `pay_and_part` reaction. `membership` is wired by `membership_change` in the `swear_them_in` reaction. **No swap taken** — neither family fights the fiction.

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
2. **Variant?** **Yes** — `trait.core.core_warmth.virtue` (Warm). `forecastDelta: +0.04`, `difficultyDelta: -0.02`, `factorLine:` *"Being Warm, they do not walk out on a store the whole place eats from."* Chosen because `core_warmth` governs *care for others*, which is the fork's own question; a Warm mortal is the one the axis was written for.
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
| **the keeper** (`keeper`) — the person holding the key | `lazy-materialize-on-trigger` (reuse-first) | `reuseNpcRoles: ['guard','quartermaster','elder','hunter','ranger','wanderer']`; else spawn `guard` named *Hedda Varn*, `factionDefId: 'civic_guard'` | `must-persist` — carries the `intelligence` record on one `negative` reaction and is the face of the watch on the `positive` side | Any later `civic_guard` encounter at this settlement; a return visit; the `intelligence` record | Roster read against `LOCATION_ROLE_ROSTERS` for all four roster keys the envelope reaches | `live` |
| **the store** (`store`) — the barred building | `lazy-materialize-on-trigger` (reuse-first by `sublocationTypeId`) | `sublocationTypeId: 'sublocation-type.warehouse'`, `fallbackName: 'the stores'`; `encounterSupportBundle.ts` reuses an existing warehouse sublocation at the location before minting one | `must-persist` — a settlement's store is not scene furniture | Future `encounter.hunt.*` members; any store/supply encounter; the hex's sublocation list | `encounterSupportBundle.ts` materializes it as `type: 'location'` + `parentLocationId` — the canonical sublocation shape (THR-1183) | `live` |
| **the settlement** (`$target`) | `pre-seeded` | The location the encounter spawned at; `generateUnifiedCandidates` sets `targetId: locationId` for a `locationSubtypes`-gated candidate | `must-persist` | Carries **Festival** or **Blighted Harvest** for the season | The Unfinished Rite's shipped precedent for `targetLocationId: '$target'` | `live` |
| **the watch** (`civic_guard`) | `pre-seeded` | `FACTION_DEFINITIONS` → `civic_guard`; chapters seeded by `factionSeeding` | `must-persist` | The agent's `member_of` edge; faction roster; future watch work | `resolveFactionNodeId` resolves a def id to a chapter node | `live` — **with a locality caveat, Findings #2** |
| **the agent's pack** | `lazy-materialize-on-trigger` | `spawn_artifact` category `mundane`, tier `common`/`uncommon` — no `tagFilters` (an unverified tag is a silently empty pool) | `must-persist` | The agent's possessions | Exemplar precedent (no filters) | `live` |
| **Wounded / Terrified / Festival / Blighted Harvest** | `pre-seeded` | `CONDITION_TRAIT_DEFINITIONS` | `must-persist` (duration edges) | Tier promotion (wound signal); location price and gate readers | Ids read directly from `condition-trait-content.ts` | `live` |
| **the bear** | `blocked-primitive` | Nothing. There is no non-human cast primitive. | `scene-only` (prose + the conditions it leaves) | None — the animal leaves no node behind | `NpcRole` union read in full | `blocked-primitive` — **Findings #1** |

**Support-network audit notes.**
*NPC cast:* every role in `reuseNpcRoles` is seeded by at least one roster key the envelope reaches — `hamlet` (rural: hamlet, farmland) has `guard`, `elder`, `wanderer`; `military_outpost` (stronghold: fort · wayside: camp) has `guard`, `quartermaster`; `capital` (stronghold: castle) has `guard`; `wilderness` (wayside) has `hunter`, `ranger`, `wanderer`. No roster key the envelope reaches is left with zero reuse candidates. `mining` and `oasis` have no roster entry at all (`SUBTYPE_TO_ROSTER_KEY`) and fall through to the spawn path — correct behaviour, recorded.
*Faction:* `civic_guard` is a live definition with real ranks; the keeper belongs to it by construction, which is the reason the settlement's answer to the bear is *organised* rather than a mob.
*Location/geography:* the encounter needs a barred store, which the support bundle supplies rather than assuming. Nothing else is required of the terrain.
*Reward/burden:* every reward and burden is a real object — an artifact node, two person-conditions, two place-conditions, a `member_of` edge, a hidden mark, an intelligence record.
*Follow-on:* two named pressures — a settlement short of food for a season (`harvest_blight` feeds prices and gates), and a bear now in the fields on the `positive/critical_failure` band. Both are world state, not seeds; see Findings #6.

---

## 17. Self-Audit

Checked against the spec's step-8 evidence checklist and `Docs/encounter-support-network.md`'s support-bundle contract.

| # | Item | Verdict |
|---|---|---|
| 1 | Design block written before prose (crux, title, catalogs, hook, reach-per-step, motive, mechanics, rewards, choice, promises, systems count) | **PASS** — §§2–8 are the design block; the fiction was fitted to the fork, the axis, the wound and the two consequence families, all of which were fixed by the brief before a sentence existed. |
| 2 | Crux in one plain sentence | **PASS** — *"What {name} is owed is locked in a store with a bear asleep on top of it, and the settlement is about to burn the building."* |
| 3 | Title states the crux (glance test) | **PASS** — a player reading only *The Beast in the Granary* knows both the complication and where it is. **FLAG:** the corpus already ships `the-granaries-in-the-famine-year.ts`; the two share a noun and nothing else (that one is a regional `gold` merchant-prince fork). Recorded for the batch report so a reader does not conflate them. |
| 4 | Shape named from the catalog and matched by the step structure | **PASS** — Personality Fork, 1 plain step + 1 branch node. |
| 5 | Opening skeleton, ≤80 words, one opening per declared class | **PASS** — 77 words at the longest class; `rural`, `wayside`, `stronghold` all authored; `validateSettingEnvelope` has nothing to report. |
| 6 | Narrator mode — facts stated, never encoded; no interior sensation, no camera work | **PASS** — see the 12-question checklist below. |
| 7 | Every nudge-bearing step carries a full composed hand | **PASS** — 3 hands, 6 / 5 / 5 composed. |
| 8 | ≤2 authored specials per step; specials are things the dealer cannot produce | **PASS** — 2 / 1 / 1. Beat 1's pair carry `poleLean` (the dealer cannot know the axis); beat 2's are a named scene object and a reach-scoped mark (the spec's two named special shapes). |
| 9 | Every card pays off in failure; big-delta cards cover both failure bands | **PASS** — every card has a `failure` fragment; `granary.narrow_their_sight` (0.16) covers `failure` and `critical_failure`. |
| 10 | No digits or `%` in any `effectLine`; names ≤4 words, imperative verb + noun | **PASS** — *Wake Their Fear* / *Weigh The Winter* / *Lift The Bar* / *Narrow Their Sight*. |
| 11 | No effect line repeats a word from its own card name | **PASS** — checked one by one. |
| 12 | ≥1 card priced on a non-essence channel | **PASS** — `granary.weigh_the_winter`: `essenceCost: 0`, `costs: { detectionDelta: 3 }`, and the effect line says where the price lands. |
| 13 | ≥1 card with a real `grants` entry naming built content | **PASS** — `granary.wake_their_fear` grants `trait.condition.terrified`, a shipped `CONDITION_TRAIT_DEFINITIONS` member. (Two further grants: a reach-scoped mark and the aftermath's five effect kinds.) |
| 14 | ≤1 rider per hand | **PASS on the authored half** (0 riders authored). **FLAG** on the composed hand — Findings #3. |
| 15 | ≥4 spheres, ≥1 ungated common | **FLAG** — author-side 2 spheres and 0 commons per hand by construction; the rest is the dealer's, and the dealer *prefers* rather than guarantees. Findings #3. |
| 16 | ≤2 Boosts | **PASS** — `boost` excluded on every step. |
| 17 | ≥3 distinct card types per composed hand | **PASS**. |
| 18 | Open-draw reachability: every step at `fair` or below | **PASS** — 0.40 / 0.44 / 0.36, all under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45), and `intrinsicTier: 'background'`. |
| 19 | No authored `factorLines` (variance rule) | **PASS** — none. The one authored surface used is `TraitVariant.factorLine`, which is variance by construction. |
| 20 | Six `StepOutcome` bands covered across each hand | **PARTIAL / by design** — the specials cover 3–4 bands each; the dealt cards bring `BAND_FRAGMENTS` for the rest, which is the composed-hand contract (`checkNudgeHand` stands the whole-hand band rule down on a `deal`-bearing step). |
| 21 | `aftermathConfig` present, `byOutcome` floor ≥3 bands incl. one extreme | **PASS** — six bands across two variants: `critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure`. Success-side ✅ failure-side ✅ extremes ✅ (two of them). |
| 22 | Every variant carries an `overview` | **PASS** — `positive`, `negative`, `fallback`. |
| 23 | Every `change` declares `concepts` (Law 2) | **PASS** — every chip in §15 carries at least one. |
| 24 | Every chip backed by a write on the face that shows it (Law 56 cl. 1) | **PASS with one flagged exception** — the membership chip is reaction-conditional. Findings #5. |
| 25 | Every chip's referent is a real graph object and the sentence names it (Law 56 cl. 2) | **PASS** — anchors are `$target` (location, linked), `$faction:civic_guard` (faction, linked), `$actor` (agent, linked), attachment template ids (linked). Every one classifies `ok` under `classifyAnchorDeclaration`. |
| 26 | ≥1 chip anchored at the place with `visualKind: 'location'` | **PASS** — two: the feast day and the hungry season, both `entityId: '$target'`. |
| 27 | Membership chip anchored at the group, not a person | **PASS** — `$faction:civic_guard`, `visualKind: 'faction'`. |
| 28 | ≤1 `individual`-anchored chip | **PASS** — exactly one (`their own goods, back` → `$actor`). |
| 29 | No `reputation_tally` chip | **PASS** — no reputation chip of any kind. |
| 30 | Consequence draw recorded and every drawn family wired | **PASS** — `['possession','membership']`; `possession` via `spawn_artifact` on a plain step *and* in a reaction, `membership` via `membership_change` in a reaction. No swap. |
| 31 | Systems quota ≥3 from the authored manifest | **PASS** — 4 (`cast`, `rewards`, `conditions`, `factions`). |
| 32 | Card `imageTag`s resolve to library rows | **PASS** — all four are `NUDGE_CONCEPT_ART` members. |
| 33 | Cast binding mandatory and class-honest across the whole envelope | **PASS** — verified against `LOCATION_ROLE_ROSTERS` for `hamlet`, `capital`, `military_outpost`, `wilderness`. |
| 34 | No `{cast:<key>}` token naming an undeclared key | **PASS** — only `{cast:keeper}` is used; both keys are declared. |
| 35 | Prose never genders a bound cast member | **PASS** — the keeper is referred to by role or token only. |
| 36 | Prose invents no game state (rule 7) | **PASS** — the only relationship asserted is *tonight's*: the agent's goods went behind the bar at dusk by a stated local rule. No prior visit, no standing, no debt-with-history. The Warm trait's factor line is a **read** through a declared gate. |
| 37 | Every promise pays off | **PASS** — the two men carried out set the wound's price and it is paid at every failure band; the settlement's fire threat is delivered on four of six bands; the far door is introduced in `positive` prose and is the card, the test, and the critical-failure image. |
| 38 | Seam-echo check (opening→spine, spine→bands, variant→variant) | **PASS** — audited by hand. The spine's `fact · fact · fact` cadence appears nowhere in the continuations; "the bins" recurs across `weigh_the_winter` and `narrow_their_sight` deliberately (one counts them, one erases them) and never inside one paragraph seam. |
| 39 | Vagueness lexicon at zero; ≤1 annotation clause; zero divine outcome-authorship | **PASS** — no hedges, no `something`/`someone` in any `outcome`-class field; zero "not…but" and zero em-dash-negation clauses across the packet's authored prose; the god is never the grammatical author of a result. |
| 40 | Support bundle contract complete; every `lazy-materialize` object answers the five questions | **PASS** — §16. |
| 41 | Blocked primitives filed | **PASS as a report obligation** — Findings #1 and #2 are `blocked-primitive` / defect class and are handed to the batch report rather than approximated. |

### The 12-question narrator's checklist, answered in writing

1. **P1 says how the agent arrived, with real graph names?** Yes — `{name}`, `{location}`, one arrival sentence per class.
2. **P2 states what is happening and what has gone wrong, as events with costs already paid?** Yes — the store is barred, a bear has denned inside, two men who went in were carried out.
3. **P3 lands exactly one stake shape from the table?** Yes — `choice`: two courses, both costly. No compounding.
4. **Opening ≤80 words?** Yes — 77 at the longest class.
5. **Could a GM read every sentence aloud as a report?** Yes. Nothing is felt; things are the case.
6. **Every fact stated, never encoded?** Yes — "{cast:keeper} will not open it" is the sentence, not a shot of a hand on a lock. "Two men who went in were carried out" states the cost rather than staging it.
7. **Every sentence serves challenge, test, or outcome?** Yes — audited sentence by sentence; the spine has six sentences and each is one of: the obstacle, the reason it cannot be walked around, the price already paid, the agent's claim, course A's cost, course B's cost.
8. **Nothing referred to before it is introduced?** Yes — keeper in P2, the pack and both doors in P3, the far door introduced in the `positive` continuation before the card names it, the bins introduced in the spine before `weigh_the_winter`'s fragments lean on them.
9. **One named person on stage per beat, named over unnamed?** Yes — the keeper in beat 1; nobody else on stage in beat 2 (the agent and an animal).
10. **Can the player restate the stake in one sentence?** Yes — *"Their own goods are locked in a store with a bear on them, and the only two ways to get them out either burn the village's winter or put them in a dark room with the bear."*
11. **Every card verb+noun and described like a spell?** Yes — four names, four one-or-two-sentence effect lines, no odds talk, no mood, no digits.
12. **Every declared setting class has an opening in the skeleton?** Yes — `rural`, `wayside`, `stronghold`.

### Branch seduction self-check

| Question | `positive` — Put it out | `negative` — Get back out |
|---|---|---|
| Why would a god choose this on purpose? | Because a god who wants a mortal *rooted* wants this: it is the one night that turns a traveller into someone a place will send for. | Because a god who wants a mortal *unowned* wants this: no debt, no roll, no address, and the thread stays portable. |
| What fantasy of interference does it offer? | Nudging a person into staying in a room they had already escaped. | Nudging a person into the discipline of taking exactly what is theirs and nothing else, in a room full of things that are not. |
| What value or future does it protect that the other does not? | The settlement's next season, and the mortal's place in it. | The mortal's freedom of movement, and the option of never being anybody's. |
| With the labels removed, still distinct and tempting? | Yes — different reach, different difficulty, different card, different door, different ending state for the location. | Yes — and it is not the "bad" branch: the settlement was always going to burn the store, and the mortal did not cause that. |

Both survive. Neither is cut.

---

## Experience Differentiator Gate

**Scene & Prose (Doctrine v2)**
1. Opening follows the skeleton — arrival · situation & complication · the problem, ≤80 words, real graph names, facts stated plainly? — **YES**
2. Every sentence doing challenge/test/outcome work; no interior sensation, no camera work, no atmosphere without a job? — **YES**
3. Scene prose names and introduces the specific elements the hand later acts on (the keeper, the bar, the grain, the bins, the sleeping animal, both doors)? — **YES**
4. Could a player retell the situation and the stakes accurately after one read? — **YES**

**Choices & Intervention (the nudge hand)**
5. Every card reads like a spell — imperative verb + noun, 1–2 direct effect sentences, no flavor quote? — **YES**
6. Every card's price real and legible — essence, or a named alternate channel? — **YES** (two priced in essence, one in detection at zero essence, one in essence plus a permanent value shift stated on the face).
7. Every card pays off in failure — at least one failure-band fragment; both bands for a big-delta card? — **YES**
8. Hand grounded — delete the target from the prose and the card is senseless here? — **YES** (delete the bins and *Weigh The Winter* is nonsense; delete the far door and *Lift The Bar* is nonsense; delete the sleeping animal and *Wake Their Fear* is nonsense).
9. Do the cards answer different questions? — **YES** — beat 1's two specials buy *opposite directions*, not the same certainty; the fill is context-tagged and type-deduplicated against them.
9b. Every nudge-bearing step carries a full authored hand per the guardrails, and no step asks the player to pick a branch or an ending? — **YES** — three composed hands; the fork is `decidedBy`, and `authoredChoices` appears nowhere.

**Aftermath & Consequence**
10. Aftermath has its own prose — a reflective landing before the mechanics? — **YES** — seven authored ending paragraphs.
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
*Sub-finding, same area:* `membership_change` resolves its `factionId` through `resolveFactionNodeId`, which matches a **definition** id against every faction node in the world and returns `matches.sort()[0]` when several chapters share it. There is no sentinel for *"the chapter that holds the ground this encounter spawned at."* So "the settlement takes them in" can enrol the agent in a `civic_guard` chapter on the other side of the map, and the chip's click will open that chapter's sheet. Nothing in content can fix this.

**3 · Three composed-hand rules have no owner on a dealt step.**
`checkNudgeHand` stands the whole-hand rules down on a `deal`-bearing step (correctly — the hand does not exist until a god is known), and `checkComposedHand` re-checks only size, specials count, tag duplicates and exclude length. That leaves **≤1 rider**, **≤2 Boosts** and **≥4 spheres / ≥1 ungated common** enforced by nobody: the author cannot satisfy them (they are properties of a hand they do not compose) and the dealer's documented guarantees cover only size, delta budget, type-deduplication against specials, and a *preference* for breadth and a common option. A fill of four could legally arrive as Insurance + Mercy + Gambit + Favor — three riders in one hand, which the brief lists as a binding rule. Either the dealer should hold these invariants, or the rules should be restated as dealer obligations rather than authoring ones.

**4 · `deal.exclude` is typed by card *type*, but the over-exposure census is per *member*.**
The brief's table names three members (`card.boost.core`, `card.boost.signature.energy`, `card.undertow.signature.darkness`), and `libraryCardId` — the field the census counts — is per member. But `StepDealDeclaration.exclude` is `readonly NudgeCardTypeId[]`. Honouring the instruction therefore costs the whole family: excluding `boost` also removes `card.boost.variation.patient` (a milestone reward, not over-exposed at all), and excluding `undertow` removes `card.undertow.hunger.consume`. This encounter deals no Boost at any step as a direct result. A member-level exclude, or a member-level damping weight in the dealer's scorer, would let the census's actual finding be acted on.

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

**8 · The corpus's only positive location condition is deprecated with no replacement.**
`trait.condition.location.standing_welcome` — "A Standing Welcome", the natural write for *"the settlement takes the agent in"* — is marked **DEPRECATED (THR-1206), zero writers, do not author new writers against it**, superseded by `reputation_with`. That leaves `festival` as the only live positive location condition, and a festival is an event, not a standing. This encounter uses `festival` for what it actually says (a settlement that kept its winter throws a feast) rather than stretching it into a standing, and routes the standing meaning through membership instead. But an author who wants *"this place is warm to you now"* as a place fact has no member to say it with.

**9 · The brief's premise that `membership` is a zero-user family is stale.**
The brief states this would be "the first membership consequence in the game" (`groups` counted 0 in the portfolio census). Two shipped templates already wire `membership_change`: `src/data/encounters/toll-of-blades.ts` (step 2 `successMetadata`, `factionId: 'mercenary_company'`, chipped) and `src/data/mercenary-encounter-content.ts` (two sites). The consequence is still rare and still worth wiring, and nothing about the design changes — but the portfolio census's `groups` count should be re-taken before the next batch quotes it.
