# Encounter Pipeline: Standing the Line

> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: draft
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory line)
> templateId: `encounter.border.standing_the_line` | Batch: border-perils (THR-1221)

**Design row this fills:** `Docs/plans/encounters/border-perils-batch-design.md` § *4 · Standing the Line*.
**Authoring contract:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`.
**Reference conversion for the fork:** `src/data/encounters/apotheosis-ascension.ts`.
**Golden exemplar:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.

---

## 0. The mechanical design block (spec step 1 — written before any prose)

**0. The crux, in one plain sentence.**
Someone who cannot fight is behind the agent, and the thing coming up the road does not have to stop.

**0b. Title states the crux.** *Standing the Line.* The player reading only the title knows the objective: something has to be held, and the agent is what is standing in the way.

**0c. Catalogs** (one entry each, from `Docs/canon/encounter-catalogs.md`):

| Axis | Entry |
|---|---|
| Shape | **Personality Fork** + **Seeded Sequel** (parent) |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (all four, one opening each) |
| Pressure | `duty` (undertone `fear`) |
| Form | `rescue` |
| Objective | `protect` |
| Stakes | `relationship` |
| System | `forks` + `carryover` + `traits` (all mature tier) |

**0d. Hook.**
`plotHookRolled: hook.impossible_choice, hook.standing_the_line, hook.market_collapse`
`plotHookTaken: hook.standing_the_line` — *"Someone who cannot fight is behind you and the thing coming does not have to stop."* (`src/data/content-eval/plotHooks.ts`, themes `protection`/`conflict`, reaches `iron`/`heart`, source *vault: Archetypes/Ordeal — Defense of the Innocent*). Verified live; `usedBy` is `[]` and gets stamped at closeout.

**1. Whose problem is this?** The agent's. Their road runs through the narrow place, and the person sitting in it cannot be walked around without leaving them there. The pilgrim is a person the scene puts in front of them, not the subject of the scene — the subject is what the agent does about a road they were already on.

**2. Which reach does each step test, and why is that the theme?**

- **Step 0 — `heart`.** Heart is bonds: Sworn ↔ Renegade. The test is *being believed by a stranger in the time available* — a frightened person on the ground who has no reason to trust the traveler standing over them. The scene grew from that, not the reverse: the pilgrim's refusal to be moved is what makes heart the honest reach.
- **Step 1 — `gold` (mercy pole) / `iron` (ruthless pole).** Gold is influence and the ledger: talking four armed riders into a price is a gold test in the plainest sense. Iron is force. The pole *is* the reach.
- **Step 2 — the pole's own reach again** (`gold` / `iron`). See § 0e for why, and for the one place I read the design row rather than transcribed it.

**3. Why is the agent here?** All four motive routes are honest and none is required: `chance` (the road put a narrow place and a stranger in front of them), `choice` (their own errand runs this way), `mission` (sent through), `divine` (led here). No route is asserted in base prose — the scene claims only that the road goes this way, which is scene-local fact.

**4. Which mechanics and objects play?**

| Fact the prose states | Class | Surface |
|---|---|---|
| The pilgrim exists, has a name, persists | state **write** | `supportBundle` actor spec, key **`survivor`**, `must-persist` |
| The agent and the pilgrim end up bonded | state **write** | `bond_change` on every authored band |
| The pilgrim owes them / does not | state **write** | `favor_creation`, debtor `$cast:survivor` (one reaction arm) |
| A wound | state **write** | `condition_attachment` → `trait.condition.wounded` |
| The count came up short | state **write** | `hidden_mark`, category `secret_knowledge`, `revealFamilies: ['encounter.border']` |
| The scene that comes back | state **write** | `encounter_seed` → `encounter.border.one_body_short` |
| Being the kind of person who does not leave someone behind | state **read** | `traitVariant` on `trait.core.core_warmth.virtue` |
| Which way the mortal goes | state **read** + **write** | `decidedBy: { axis: 'mercy_ruthlessness' }` reads the live axis position, and taking the pole drifts it |
| Travelling in company | state **read** | `requiresGroup` on two Fellowship cards |
| The narrow place, the pack, the leg, the wheel-ruts | scene-local | invented here, no life outside the encounter |

No base sentence asserts agent history the graph does not hold (prose rule 7). The pilgrim is a stranger *by construction* — the spine says so — which is what makes the heart test a real test.

**5. Rewards, and where the tension sits.** No treasure. The reward shape is **penalty-avoidance plus a person**: the baseline win is that the pilgrim is off the road and the agent is still standing, and the durable gain is the bond and (optionally) the favour. Failure costs a wound, days, and — on the worst mercy band — the pilgrim. Tension sits on step 1: the fork has already been taken by then, and the step is where the taken course either lands or does not. Quintessence stakes: moderate; the worst ending is a beating and a loss, never a scripted death, and no `quintessence_shift` is authored here (that is #5's, per the batch design).

**6. Does the mortal make a choice in this scene?** **Yes — this is the batch's fate-branching debut.**

- **Axis: `mercy_ruthlessness`.** **Verified against the live registry** — `src/types/agent.ts` `ValuePair`, Iron's bound pair, Protector (+1) ↔ Conqueror (−1); `src/types/axisRegistry.ts` labels the poles Protector/*Brave* and Conqueror/*Power-Hungry*. It is a real member; nothing invented.
- **Poles, as concrete courses of action:**
  - `positive` — **hold the road and let them past behind you.** Stand in the narrow place, make the passing cost something, and buy the minutes the pilgrim needs. Nobody has to die.
  - `negative` — **break the pursuit before it arrives.** Go up the road, take them strung out, and end their appetite for the rest of the day.
- **Who decides.** The mortal, at step 0's resolution: `readLiveAxisLean` (their `axiologicalProfile.mercy_ruthlessness` baseline plus accumulated drift) plus `sumHandLean` over the cards the god committed on step 0. Net lean past `BRANCH_DECISION_NEUTRAL_EPSILON` (0.05) decides by conviction; inside the band a single seeded coin settles it. **The player never picks.** Taking a pole drifts the mortal `BRANCH_DECISION_DRIFT_MAGNITUDE` (0.08) toward it, so a run's fourth road-block is measurably likelier to go the way the third one did.
- **Downstream:** each pole owns steps 1 and 2 (prose, hand, difficulty, `failBehavior`, carryover lines) and its own five-band aftermath. Both poles plant the sequel, on different bands and for different reasons (§ 9).
- **The god's levers:** four `poleLean` cards in step 0's hand, two per direction (§ 5.1).

**7. Every promise pays off.** The opening promises a narrow place, a person who cannot move, and something coming. All three land inside step 0. The riders' number (four) is paid off in both poles' step 1. The pack the pilgrim will not put down pays off in the mercy pole's step 2 (it is part of what gets handed over) and in the ruthless pole's `success_at_cost` band. Nothing is opened that the bands do not close — with the deliberate exception of the count, which is the seed, and which is *stated* as unfinished rather than hinted.

**8. Personalization + supporting content — systems connected (target ≥3 beyond the core test; hard gate at 3).**

| Connection | Counted as | How |
|---|---|---|
| Cast | `cast` | one bound actor spec, `must-persist`, class-honest at all four classes |
| Persistent aftermath effects | `rewards` | `bond_change`, `favor_creation`, `hidden_mark` (all in `PERSISTENT_EFFECT_KINDS`) |
| Planted future | `seeds` | `encounter_seed` → `encounter.border.one_body_short` |
| Injury | `conditions` | `condition_attachment` → `trait.condition.wounded` |

**Four**, counted from the authored manifest (`systemConnections` in `compositionContract.ts`), against a floor of three. No `reputation` and no `factions` connection: the riders are not a faction body and inventing a `factionDefId` for them would buy a quota point with a lie. The batch allots faction standing to #1 and #6.

Personalization: the pilgrim's name reaches the player through `{cast:survivor}` at the two moments a name earns something — the ending where they say what they owe, and the ending where they are gone. Everywhere else the prose is role-voiced.

**0e. The one place I read the design row rather than transcribed it.**
The design row says *"1 `heart` (the fork's deciding step) → 2 `gold` / `iron` per pole → 3 the pole's resolution"* and does not name step 3's reach. I read **"the pole's resolution" as continuing in the pole's own reach** — gold twice on the mercy pole, iron twice on the ruthless one. Reasons: (a) a resolution step that switched reach mid-pole would make the fork's identity dissolve exactly where it should be strongest; (b) a run walks **one** pole, so a single playthrough touches three reaches — `heart`, then one of `gold`/`iron` twice — which is what the batch's reach budget is counting when it credits this encounter `heart 1 · gold 1 · iron 1`; (c) the alternative — converging both poles on a fifth reach — would spend a reach the batch budget has already allocated elsewhere. Recorded here so a reviewer can overrule it cheaply.

---

## 1. The scene-writer's 14 questions, answered in writing

| # | Question | Answer |
|---|---|---|
| A1 | Where are we? | Four openings, one per declared class, each with ground, structure and light before anything happens: gorse and baked wheel-ruts pinched between two banks (`wayside`); a gap two carts wide in fallen courses (`ruin`); a raised causeway with a ditch either side (`battlefield`); a stair two abreast between walls under a shut gate (`stronghold`). |
| A2 | How does it feel? | Every opening carries at least two senses past sight — dust and hot stone with no shade either way; cold air off walls and wet ash; turned earth and old iron with the wind coming across unobstructed; cold stone and smoke long dead. The spine adds the leg, the pack, and the pace of the riders. |
| A3 | Who is here? | The openings account for emptiness explicitly (nothing has moved all afternoon; whoever holds this place has decided not to know). The spine introduces the pilgrim — the bound cast member — before any card, factor or later sentence refers to them. The riders arrive in the last sentence. Nothing acts unannounced. |
| A4 | What must we know? | That the pilgrim has been walking on a bad leg since morning and cannot go further; that the way narrows here and there is no way round; that the traveler is a stranger to them. All stated before the first test is asked for. |
| A5 | Complication last? | Yes. The openings build the place, the spine builds the person, and the last clause of the spine is the riders and the fact that nothing obliges them to stop. |
| B6 | Nothing unintroduced? | The narrow place, the pack, the leg, the road, the riders and their number all appear in the spine before any card, carryover line or band names them. Both poles' step-1 prose refers only to those. |
| B7 | Visible causes? | The pilgrim cannot move because the leg went wrong on the road this morning. The riders are unhurried because nothing is chasing *them*. The agent is in the narrow place because the narrow place is where the road is. |
| B8 | No contradictions? | One road, one narrow place, four riders, one pilgrim, one pack. The openings leave the hour open except `wayside`, which sets a low sun; nothing downstream contradicts either reading — the mercy pole's `success` and the ruthless pole's `success_at_cost` both lean on failing light without asserting it began that way. |
| C9 | Would a real person do this? | Yes on both poles. Nobody walks up to four riders unarmed for fun: the mercy pole is a person who has calculated that a price is cheaper than a fight, the ruthless pole is a person who has calculated that four strung out on a climb are four fewer than four abreast. The pilgrim's refusal to be moved is the ordinary behaviour of someone in pain being handled by a stranger. |
| C10 | People as people? | The pilgrim will not give up the pack, does not know the traveler, and argues. The riders are unhurried rather than snarling — they are men on a road who have not decided anything yet, which is precisely what makes both poles reachable. |
| C11 | True costs? | Carried in the wound, the days, the handed-over goods, and the pilgrim on the mercy pole's worst band. Nothing is free on either side of the fork. |
| D12 | Stake in one sentence? | *"Does the pilgrim get off this road alive and the traveler stay standing, or do four riders come through the narrow place and go on past what is left?"* Good outcome: the pilgrim is clear, the traveler is upright, and there is a person in the world who owes them a morning. Bad outcome: a wound that will not walk off, and — at worst — an empty place beside the road where somebody was sitting. |
| D13 | Cards grounded? | Every card acts on something the scene established: the pilgrim's nerve, the pilgrim's trust, the riders' appetite, the pace of the horses, the light on what is being offered, the weight behind an arm. Delete the riders and the pilgrim from the prose and none of the twenty-seven cards means anything here. |
| D14 | Mechanism, not mood? | Every `effectLine` states what the god does to the fabric of the scene and why that moves the odds, in plain words, no digits. Pole-leaning cards say which way they argue in the same sentence. |
| D15 | Openings cover the envelope? | `settings: ['stronghold', 'ruin', 'wayside', 'battlefield']`, four openings, enforced by `validateSettingEnvelope`. |

---

## 2. Setting envelope, openings, and the spine

```
settings: ['stronghold', 'ruin', 'wayside', 'battlefield']
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield'])
                → castle, fort, ruins, ruined_tower, ruined_city, ruined_village,
                  unexplored_poi, camp, oasis, wilderness, battleground
```

Excluded batch-wide: `urban`, `rural`, `sacred`, `arcane`.

Multi-class envelope ⇒ **no THR-1044 family default**; the template declares its own `supportBundle` (§ 3).

### Openings (one per declared class, ≤60 words each, `scene` field class)

**`wayside`**
> The road runs down through gorse and does not bend for a mile. Two banks pinch it narrow at the bottom, where old wheel-ruts have baked hard. Nothing else stands between here and the low sun. The wind smells of dust and hot stone, and there is no shade in an hour's walk either way.

**`ruin`**
> The road goes in through what used to be a gate and out the far side of a town nobody has swept in forty years. Fallen courses narrow it to a gap two carts wide. In the shadow of the walls the air is cold and smells of wet ash. Nothing has moved here all afternoon.

**`battlefield`**
> The ground here was fought over and never tidied. Broken shafts stand out of the turf at angles no plough would leave. The road crosses on a raised causeway with a ditch to either side, and the whole flat smells of turned earth and old iron. The wind comes across it without meeting anything.

**`stronghold`**
> The road climbs to a gate that is shut and stays shut. Whoever holds this place has decided not to know. The approach is a stair between two walls, two abreast and no wider, cold, smelling of stone and smoke long dead. There is no way round, and no way back down that is not the way up.

### The setting-neutral spine (step 0 `narrativeTemplate`, 59 words)

> A pilgrim sits where the way goes narrow, one leg straight out and wrong, still wearing the pack. They have walked on it since morning and will not walk further. Four riders are coming up, unhurried. Nothing on this road obliges them to stop, and the pilgrim does not know the traveler standing over them from any other stranger.

Names no class scenery. Introduces the cast binding role-voiced, without a token — no sentence here earns the generated name. Never genders the pilgrim: the only pronoun is *they*.

### `narrativeTemplates`

- **`initiation`** (the stake block):
  > A stranger who cannot run is sitting in the narrow place, and four riders are coming who have no reason to go around. Whatever the traveler does about that, they have to settle it before the riders are close enough to hear it being settled.
- **`success`**:
  > The road behind is quiet. The pilgrim is off it, walking is something that will happen later, and the traveler is still standing where they stood.
- **`failure`**:
  > The riders came through the narrow place and out the other side. What is left on the road behind them is not what was standing there.

**Seam check (opening → spine → initiation).** No opening ends on hooves or horses — the riders belong to the spine alone, so the four openings and the spine share no image. The initiation owns *"no reason to go around"*; the spine owns *"nothing obliges them to stop"* — same fact, different sentence shape, and only one of the two renders above the fold. `narrativeTemplates.failure` owns *"came through"*; no band prose reuses it.

---

## 3. Cast

```ts
supportBundle: [
  {
    kind: 'actor',
    key: 'survivor',
    delivery: 'lazy-materialize-on-trigger',
    persistence: 'must-persist',
    reuseNpcRoles: ['pilgrim'],
    supportRole: 'the_one_who_cannot_fight',
    spawnNpcRole: 'pilgrim',
    spawnName: 'Ilme Fenn',
  },
]
```

**The key is `survivor`, and it is a cross-encounter contract, not a local naming choice.** `encounter.border.one_body_short` binds the crossing person under exactly that key and inherits it through `inheritContext`; a key mismatch strips the token silently on the far side and every sequel callback resolves to nothing. So the key stays `survivor` even though this encounter's own prose calls them the pilgrim — the **role** is `pilgrim` (`reuseNpcRoles`, `spawnNpcRole`), the **key** is `survivor`, and the two are different things. Do not rename either half without renaming it in the sequel in the same PR.

**Class-honesty.** Of this envelope's eleven subtypes, only `wilderness` and `castle` carry a `LOCATION_ROLE_ROSTERS` entry at all (`camp`, `oasis`, `battleground`, `fort` and all five `ruin` subtypes have none), so reuse is only ever available at `wilderness` — where `pilgrim` is on the roster at 0.3. Everywhere else the spec materializes one, which is honest: a pilgrim is a person who is *on a road*, and finding one in a ruin, on a causeway or below a shut gate needs no explanation. The castle roster's roles (`noble`, `marshal`, `guard_captain`, `guard`, `steward`, `herald`, `spy`, `attendant`) are all either armed or household staff who would not be sitting outside the gate, so binding one of those would be the "miller's boy" failure the exemplar names.

`spawnName` is a real name because a declared key always resolves (THR-696) and `{cast:survivor}` renders it when no live NPC was reused. **`must-persist`**, because the sequel inherits this binding and a `favor_creation` whose debtor is collected at scene end is not a favour.

**Never gendered.** Every sentence about the pilgrim is written around pronouns or uses *they*. Reuse binds whoever is standing there.

---

## 4. Steps — test panel data

| Slot | Pole | Reach | Difficulty | Word | `purposeLine` | `failBehavior` |
|---|---|---|---|---|---|---|
| 0 | *(shared — the deciding step)* | `heart` | 0.35 | `fair` | Win their trust | `continue_weakened` |
| 1 | `positive` | `gold` | 0.40 | `fair` | Talk them down | `continue_weakened` |
| 1 | `negative` | `iron` | 0.40 | `fair` | Strike first | `continue_weakened` |
| 2 | `positive` | `gold` | 0.28 | `gentle` | Make it hold | `fail_action` |
| 2 | `negative` | `iron` | 0.44 | `fair` | Finish it | `fail_action` |

**Reachability (THR-821).** `intrinsicTier: 'background'`, `rarityTier: 3` — open-draw ambient content, so every step sits at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). This is the open-draw branch of the rule (the Swollen Ford's branch), not the gated-audience branch.

**Why the tails differ.** The mercy pole's resolution is `gentle` (0.28) and the ruthless pole's is `fair` (0.44), and the difference is legible to the player as a word rather than a number: once four riders have agreed a price, keeping the bargain is easier than finishing a fight you started. That is the pole choice having a mechanical texture the player can *see*, not only a narrative one.

**`continue_weakened` on step 0** is load-bearing for the same reason it is on the apotheosis's threshold: `applyAgentDecidedBranches` runs unconditionally before `advanceStep`, so the mortal is owed their answer even on a bad reading — and a stumble folds the action toward `success_at_cost`, which both poles author. A `critical_failure` at step 0 still ends the action outright (`advanceStep` forces `fail_action` on a crit-fail whatever the step declares) with the pole already in choice history, which is why **both poles author a `critical_failure` band**.

### No static `factorLines` (THR-892)

None authored on any step. "The way is narrow here", "four against one", "the leg is bad" all read identically on every run and are priced into the difficulty and carried by the prose. The two authored surfaces that survive the variance rule are both used:

**`traitVariants[0].factorLine`** — see § 7.

**`carryoverFactorLines`** — keyed on the band the *previous* step rolled. Not authored on step 0 (no predecessor; the checklist rejects it). All deltas within `NUDGE_BIG_DELTA` (0.15), all lines within the 12-word factor budget.

**Step 1, `positive` pole** (keys off step 0's `heart` outcome):

| Prior band | Line | Polarity | Δ |
|---|---|---|---|
| `critical_success` | The pilgrim believed them at once and is already off the road. | for | +0.06 |
| `success` | The pilgrim moved when told, which buys a little quiet. | for | +0.04 |
| `success_at_cost` | The pilgrim moved, and is making noise about the leg. | against | −0.03 |
| `near_miss` | The pilgrim is off the road and still in plain view. | against | −0.04 |
| `failure` | The pilgrim would not be moved, and is sitting in the open. | against | −0.06 |
| `critical_failure` | The pilgrim is shouting, and the riders have heard it. | against | −0.08 |

**Step 1, `negative` pole** (same predecessor, different reading — an ambush cares about a different thing than a negotiation does):

| Prior band | Line | Polarity | Δ |
|---|---|---|---|
| `critical_success` | The pilgrim is hidden and will stay hidden, whatever is heard. | for | +0.06 |
| `success` | The pilgrim knows to keep still, which is most of it. | for | +0.04 |
| `success_at_cost` | The traveler left with the leg still argued over behind them. | against | −0.03 |
| `near_miss` | Nobody told the pilgrim to keep quiet, and nobody had time. | against | −0.05 |
| `failure` | The pilgrim is in the open and the road is watching it. | against | −0.06 |
| `critical_failure` | The pilgrim is shouting after them, which carries a long way. | against | −0.08 |

**Step 2, `positive` pole** (keys off step 1's `gold` outcome):

| Prior band | Line | Polarity | Δ |
|---|---|---|---|
| `critical_success` | They named a price and the riders named it back, agreed. | for | +0.07 |
| `success` | A price stands. It is only a matter of handing it over. | for | +0.05 |
| `success_at_cost` | The price stands, and one of them is still counting it. | against | −0.03 |
| `near_miss` | They agreed to nothing and did not ride on either. | against | −0.05 |
| `failure` | The talking is over and nothing was settled by it. | against | −0.07 |
| `critical_failure` | The offer insulted them, and they have not forgotten it. | against | −0.10 |

**Step 2, `negative` pole** (keys off step 1's `iron` outcome):

| Prior band | Line | Polarity | Δ |
|---|---|---|---|
| `critical_success` | Two went down before anyone drew, and the rest saw it. | for | +0.07 |
| `success` | The first exchange went the traveler's way, and they know it. | for | +0.05 |
| `success_at_cost` | The first blow landed and cost more than it bought. | against | −0.03 |
| `near_miss` | The strike went in late, and they are turned around now. | against | −0.05 |
| `failure` | They saw it coming, and are coming on with their blood up. | against | −0.08 |
| `critical_failure` | The traveler is on the ground and the road is theirs. | against | −0.10 |

---

## 5. The hands

**Card-type budget (from the design row):** `fellowship`, **`compulsion`**, `kindled_ambition`, `undertow`, `boost` (≤2 per hand), `mercy`, **`signature`**. `compulsion` and `signature` are two of the eight zero-use library types; this is their content debut.

**`libraryCardId` discipline.** Every card whose (type, sphere) pair matches a `NUDGE_CARD_LIBRARY` member sets `libraryCardId` **and carries that member's authored `title` and `quote` verbatim** — the library face *is* the card's face, and two faces on one id would defeat the tally the batch brief is trying to feed. `effectLine` stays per-instance (the library has no such field, and magnitude and target differ per hand).

**Finding to report: two of the seven budgeted types have no library member at all.**
- **`fellowship`** — `SPHERE_SIGNATURES` signs no sphere with `fellowship`, it is not in `UNIVERSAL_CORE_TYPES`, and no hunger unique or variation member carries `typeId: 'fellowship'`.
- **`signature`** — the naming `card.<typeId>.signature.<sphere>` refers to a *signature member of another family* (`card.omen.signature.time` is an Omen), so **no member carries `typeId: 'signature'`**. The Signature *type* — "keyed to the god's spheres, discounted in-sphere" — has zero members.

Both are therefore authored as **one-offs, recorded here**, not as a default. Three further one-offs sign spheres the library does not cover for their type (a `matter` Boost, an `order` Fellowship, a `light`/`time`/`force` Signature) and exist so the three hands can answer different questions instead of dealing the same four sphere cards five times.

**Note on `libraryCardId` as a gate.** Setting the field gates the card behind the god's unlocked repertoire (`nudges.ts`). Every member used here is `unlock: { kind: 'starting' }`; the milestone (`card.boost.variation.patient`, `card.insurance.variation.shared`), god-trait (`card.mercy.variation.witnessed`) and attunement members are deliberately avoided, and so are the hunger uniques — a hunger unique is held by exactly one god per run, which would make the hand shrink for everyone else.

---

### 5.1 Step 0 hand — `heart`, "Win their trust"

**The question this hand answers:** *which way does this go, and can a stranger be believed in the next two minutes?*

Seven cards, seven distinct library types. Five spheres plus two ungated common options. One rider. **Four `poleLean` cards, two per direction** — the god has a real lever on direction as well as on cleanliness.

Sum `forecastDelta` = **0.58** (under `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70); difficulty 0.35 + 0.58 = 0.93, inside [0, 1].

---

**1 · `line.s0.a_little_more`** — Type: **Boost** · `libraryCardId: 'card.boost.core'` · common pool, ungated · `imageTag: 'generic.focus'` · essence **1** · Δ **0.06** · no lean

- **name** `A Little More`
- **effectLine** — "You steady the hands and the voice a little, so what gets said comes out level. A small help, and it argues for neither answer."
- **fiction** — *"Most things fail by a margin."*
- **bandProse**
  - `success` — "Level was enough. The pilgrim stopped arguing and started listening."
  - `near_miss` — "The voice held steady all the way through. It ran out of time, not nerve."

**2 · `line.s0.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.08** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' }`

- **name** `An Urge In Sleep`
- **effectLine** — "You put a want under their thinking where they will not find the edge of it, and it is a want to bring everyone out of this. A real help, and it leans them toward mercy."
- **fiction** — *"By morning it feels like their own idea."*
- **bandProse**
  - `success_at_cost` — "The want held all the way through, and cost them the argument they had ready."
  - `failure` — "The urge was there and so was the fear, and the fear was louder."

**3 · `line.s0.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.09** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'positive', weight: 0.2 }`

- **name** `Something To Want`
- **effectLine** — "You give them a thing to want out of this that is larger than getting through it. A real help, and it leans them gently toward mercy."
- **fiction** — *"A life turns on what it reaches for."*
- **bandProse**
  - `critical_success` — "They wanted this to end well, and wanting it made them convincing."
  - `near_miss` — "The wanting was real and arrived a beat after it would have mattered."

**4 · `line.s0.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.14** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'negative', weight: 0.4 }` · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`

- **name** `The Easier Way`
- **effectLine** — "You surface the shorter answer and make it feel obvious: the road is clear if nobody is left on it. A strong help, it leans them hard toward the ruthless answer, and it moves them that way for good."
- **fiction** — *"It works. That is the problem."*
- **bandProse**
  - `success` — "The short answer arrived first and got itself said before the long one could."
  - `critical_failure` — "The short answer was the only one left in them, and it came out at the wrong person."

**5 · `line.s0.full_weight_of_you`** — Type: **Signature** (one-off — no `signature`-typed library member exists) · sphere `force` · `imageTag: 'generic.strength'` · essence **2** · Δ **0.08** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' }`

- **name** `Weight Behind It`
- **effectLine** — "Where you hold force, the ground and the air answer to you first: things feel heavier, closer, more decidable by hand. A real help, and it leans them toward the ruthless answer."
- **fiction** — *"Some gods are felt before they are heard."*
- **bandProse**
  - `success_at_cost` — "Everything felt solvable by hand, and solving it that way cost them something to say."
  - `failure` — "The world went heavy and stayed heavy, and heavy is not the same as simple."

**6 · `line.s0.one_rope_many_hands`** — Type: **Fellowship** (one-off — the type has no library member) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.09** · no lean

- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you tighten what the group already has, so nobody has to be persuaded twice. A real help, and it argues for neither answer."
- **fiction** — *"A company decides faster than a person does."*
- **bandProse**
  - `critical_success` — "The company moved as one thing, and the pilgrim believed the company before the person."
  - `near_miss` — "The company was of one mind and one mind short of enough time."

**7 · `line.s0.not_the_worst`** — Type: **Mercy** · `libraryCardId: 'card.mercy.core'` · common pool, ungated · **rider `no_crit_fail`** · `imageTag: 'generic.mercy'` · essence **3** · Δ **0.04** · no lean

- **name** `Not The Worst`
- **effectLine** — "You lay a floor under the moment so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- **fiction** — *"Failing is survivable. Some failures are not."*
- **bandProse** *(the rider erases `critical_failure` while active, so the reachable failure textures are these two)*
  - `near_miss` — "It went badly and stopped there, which was the whole purchase."
  - `failure` — "It came apart, and something under it kept the pieces the right size."

**Rider justification (one per hand).** `no_crit_fail` on the Mercy card is the hand's only rider. A second rider would answer the same question twice — what shape the outcome takes — and the deciding step is the one place in this encounter where the *shape* of a disaster matters most, because a crit-fail here ends the action with the pole already recorded.

**Hand audit.**

| Rule | Result |
|---|---|
| 4–8 cards | 7 ✓ |
| ≥4 distinct spheres | mind, spirit, darkness, force, order = **5** ✓ |
| ≥1 ungated common option | 2 (`a_little_more`, `not_the_worst`) ✓ |
| ≤1 rider | 1 ✓ |
| ≤2 Boost | 1 ✓ |
| ≥3 distinct types | 7 ✓ |
| All six `StepOutcome`s covered | `critical_success` 3, 6 · `success` 1, 4 · `success_at_cost` 2, 5 · `near_miss` 1, 3, 6, 7 · `failure` 2, 5, 7 · `critical_failure` 4 ✓ |
| Every card pays off in failure | 1 `near_miss` · 2 `failure` · 3 `near_miss` · 4 `critical_failure` · 5 `failure` · 6 `near_miss` · 7 both ✓ |
| Big-delta (≥0.15) both failure bands | none at or above 0.15 ✓ |
| No two cards answer the same question | nerve · a planted want · a larger want · the short answer · the felt weight of a god · the company · the floor ✓ |
| ≥3 `poleLean`, both directions | 4 — positive: 2, 3 · negative: 4, 5 ✓ |
| No digits in any `effectLine` | ✓ |

**On the lean arithmetic.** `POLE_LEAN_DEFAULT_WEIGHT` is 0.35, so a single leaning card outweighs a mortal sitting anywhere inside ±0.35 on the axis. Playing both positive cards (0.35 + 0.20 = 0.55) argues about as hard as the Undertow alone (0.40) plus the Signature (0.35). A god who plays one card from each side has cancelled itself, which is the correct feel: arguing both ways is arguing for nothing, and the mortal answers as themselves.

---

### 5.2 Step 1 hand — `positive` pole, `gold`, "Talk them down"

**The question this hand answers:** *can the offer land, and what does landing it cost the person making it?* — a different question from step 0's (*which way, and can they be believed*) and from step 2's (*will it survive being paid*).

Five cards. Four spheres plus one ungated common. One rider. Sum Δ = **0.46**; 0.40 + 0.46 = 0.86 ✓.

**1 · `line.s1a.not_the_worst`** — Type: **Mercy** · `libraryCardId: 'card.mercy.core'` · common, ungated · rider `no_crit_fail` · `imageTag: 'generic.mercy'` · essence **3** · Δ **0.04**
- **name** `Not The Worst` · **fiction** *"Failing is survivable. Some failures are not."*
- **effectLine** — "You lay a floor under the moment so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- `near_miss` — "Nothing was agreed and nothing was drawn, and the second half of that was bought."
- `failure` — "It went wrong in the ordinary way, which was the ceiling on how wrong it could go."

**2 · `line.s1a.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.11**
- **name** `Something To Want` · **fiction** *"A life turns on what it reaches for."*
- **effectLine** — "You wake an appetite in the ones being talked to for something this road cannot give them, and a road they are done with is a road they will leave. A real help."
- `critical_success` — "They were already thinking about somewhere else, and somewhere else won."
- `near_miss` — "Something further on had their attention. Not enough of it, and not yet."

**3 · `line.s1a.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.15** *(big delta — both failure bands owed)* · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You put a threat behind the offer that nobody has to say out loud. A strong help, and it moves the one making the offer toward the ruthless end for good."
- `success` — "The offer was taken. The thing standing behind it was what got taken seriously."
- `failure` — "The unsaid thing got heard, and being threatened made the price an insult."
- `critical_failure` — "They heard the threat, believed it, and decided to answer it now rather than later."

**4 · `line.s1a.plain_sight`** — Type: **Signature** (one-off) · sphere `light` · `imageTag: 'generic.light'` · essence **2** · Δ **0.09**
- **name** `Made Plain`
- **effectLine** — "Where you hold light, you decide what is easy to see: you put a clean edge on what is being offered so it reads as worth taking. A real help."
- **fiction** — *"Half of worth is what the light does to it."*
- `success_at_cost` — "It all looked better than it was, and they took a little extra for the trouble of looking."
- `near_miss` — "It looked worth having right up until somebody picked it up."

**5 · `line.s1a.a_thing_worth_having`** — Type: **Boost** (one-off — the library signs no `matter` Boost) · sphere `matter` · `imageTag: 'generic.matter'` · essence **1** · Δ **0.07**
- **name** `Sound Goods`
- **effectLine** — "Where you hold matter, you can make a thing be what it looks like — the seams tight, the metal true, the weight right in the hand. A small help."
- **fiction** — *"A good object argues for itself."*
- `success` — "It was exactly what it looked like, and being exactly that closed the argument."
- `failure` — "Nothing was wrong with the goods. Nothing about the goods was the problem."

**Hand audit.** 5 cards ✓ · spheres spirit, darkness, light, matter = 4 ✓ · commons 1 ✓ · riders 1 ✓ · Boost 1 ✓ · types Mercy/Kindled ambition/Undertow/Signature/Boost = 5 ✓ · bands: `critical_success` 2 · `success` 3, 5 · `success_at_cost` 4 · `near_miss` 1, 2, 4 · `failure` 1, 3, 5 · `critical_failure` 3 ✓ · every card has a failure fragment ✓ · big-delta card 3 has both `failure` and `critical_failure` ✓ · no digits ✓.

**Rider justification.** `no_crit_fail` again, and again the hand's only one: the mercy pole's whole premise is that nobody has to die, so a card that removes the worst seam is the pole arguing for itself.

---

### 5.3 Step 1 hand — `negative` pole, `iron`, "Strike first"

**The question this hand answers:** *does the first blow land where it has to?*

Five cards. Four spheres plus one ungated common. **No rider** — a first strike is the one moment in this encounter where buying a floor is the opposite of what the course is for, and the cap is a cap, not a floor. Sum Δ = **0.55**; 0.40 + 0.55 = 0.95 ✓.

**1 · `line.s1b.a_little_more`** — Type: **Boost** · `libraryCardId: 'card.boost.core'` · common, ungated · `imageTag: 'generic.focus'` · essence **1** · Δ **0.07**
- **name** `A Little More` · **fiction** *"Most things fail by a margin."*
- **effectLine** — "You shave a moment off the wrong side of the timing, so the first move goes when it should rather than a breath late. A small help."
- `success` — "It went a half-beat early, which was the half-beat that mattered."
- `near_miss` — "The timing was right. Everything after the timing took too long."

**2 · `line.s1b.a_sudden_surge`** — Type: **Boost** · `libraryCardId: 'card.boost.signature.energy'` · sphere `energy` · `imageTag: 'generic.energy'` · essence **2** · Δ **0.11**
- **name** `A Sudden Surge` · **fiction** *"Bodies hold more than they admit."*
- **effectLine** — "Where you hold energy, a body will spend more than it has: you put everything it was saving into the next few seconds. A real help."
- `critical_success` — "The body gave everything at once and there was nothing left to give afterward, because it was over."
- `failure` — "Everything went into it, and everything was not the problem."

*(Two Boosts is the cap, and they buy different certainties: the first buys **when** it happens, the second buys **how hard**. Same verb, different physics — the exemplar's precedent.)*

**3 · `line.s1b.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.10**
- **name** `An Urge In Sleep` · **fiction** *"By morning it feels like their own idea."*
- **effectLine** — "You put an urge in the ones about to be hit — to check a strap, to look the other way, to be a moment behind. A real help."
- `success_at_cost` — "Two of them were looking at the wrong thing, and the third was not."
- `near_miss` — "Everyone looked away at once, which is the kind of thing people notice."

**4 · `line.s1b.one_rope_many_hands`** — Type: **Fellowship** (one-off) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.12**
- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you set an order under the group so everyone moves on the same count without being told. A real help."
- **fiction** — *"A company decides faster than a person does."*
- `critical_success` — "They went in on one count, and one count is what four scattered riders cannot answer."
- `failure` — "Everyone moved together, into the same wrong place, at the same time."

**5 · `line.s1b.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.15** *(big delta)* · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You take the hesitation out — the half-beat where a person checks whether this is necessary. A strong help, and it moves them toward the ruthless end for good."
- `success` — "Nothing in them asked whether this was necessary, and the not-asking is what made it fast."
- `failure` — "There was no hesitation and no advantage in having none."
- `critical_failure` — "They went in without the pause that would have told them how many there were."

**Hand audit.** 5 cards ✓ · spheres energy, mind, order, darkness = 4 ✓ · commons 1 ✓ · riders 0 ✓ · Boost 2 (at cap) ✓ · types Boost/Compulsion/Fellowship/Undertow = 4 ✓ · bands: `critical_success` 2, 4 · `success` 1, 5 · `success_at_cost` 3 · `near_miss` 1, 3 · `failure` 2, 4, 5 · `critical_failure` 5 ✓ · every card has a failure fragment ✓ · big-delta card 5 has both ✓ · no digits ✓.

**Dealt size.** The Fellowship hides for a lone traveler, so a solo agent is dealt four — the floor, and the dealt-size doctrine.

---

### 5.4 Step 2 hand — `positive` pole, `gold`, "Make it hold"

**The question this hand answers:** *will the bargain survive being paid?* Nothing here buys the offer landing — that already happened — and nothing buys direction; the fork is spent.

Five cards. Four spheres plus one ungated common. No rider. Sum Δ = **0.43**; 0.28 + 0.43 = 0.71 ✓.

**1 · `line.s2a.a_little_more`** — Type: **Boost** · `libraryCardId: 'card.boost.core'` · common, ungated · `imageTag: 'generic.focus'` · essence **1** · Δ **0.06**
- **name** `A Little More` · **fiction** *"Most things fail by a margin."*
- **effectLine** — "You keep the hands from shaking through the part where nothing can be taken back. A small help."
- `success` — "Nothing shook, and nothing shaking is most of what a handover is."
- `near_miss` — "Steady all the way to the end of it, and the end of it was not the end."

**2 · `line.s2a.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.10**
- **name** `An Urge In Sleep` · **fiction** *"By morning it feels like their own idea."*
- **effectLine** — "You leave a wish to be done with this under the thinking of everyone holding a weapon. A real help."
- `critical_success` — "Every one of them wanted to be somewhere else, and wanting it made them quick about leaving."
- `failure` — "One of them was in no hurry at all, and the others waited to see what he would do."

**3 · `line.s2a.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.09**
- **name** `Something To Want` · **fiction** *"A life turns on what it reaches for."*
- **effectLine** — "You give one of them a reason to be the sort of person who keeps a bargain. A real help."
- `success_at_cost` — "One of them held the others to it, and made sure everyone saw who had."
- `near_miss` — "Somebody wanted to be better than this and was outvoted."

**4 · `line.s2a.this_has_happened`** — Type: **Signature** (one-off) · sphere `time` · `imageTag: 'generic.time-slow'` · essence **2** · Δ **0.08**
- **name** `Not The First Time`
- **effectLine** — "Where you hold time, a moment can be made to feel worn: this has happened before, it went the ordinary way, and it will go that way again. A real help."
- **fiction** — *"Nothing happens only once."*
- `success` — "It felt like a thing they had done before, so they did it the way it is done."
- `critical_failure` — "It felt familiar, and what it reminded them of was a time somebody had cheated them."

**5 · `line.s2a.one_rope_many_hands`** — Type: **Fellowship** (one-off) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.10**
- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you hold the group's own order steady while the goods change hands, so nobody moves before the count is done. A real help."
- **fiction** — *"A company decides faster than a person does."*
- `critical_success` — "Nobody on either side moved early, and nobody had to be told not to."
- `failure` — "Somebody at the back of the company moved, and it was read as the start of something."

**Hand audit.** 5 cards ✓ · spheres mind, spirit, time, order = 4 ✓ · commons 1 ✓ · riders 0 ✓ · Boost 1 ✓ · types Boost/Compulsion/Kindled ambition/Signature/Fellowship = 5 ✓ · bands: `critical_success` 2, 5 · `success` 1, 4 · `success_at_cost` 3 · `near_miss` 1, 3 · `failure` 2, 5 · `critical_failure` 4 ✓ · every card has a failure fragment ✓ · no big-delta card ✓ · no digits ✓.

---

### 5.5 Step 2 hand — `negative` pole, `iron`, "Finish it"

**The question this hand answers:** *does it end here, or does it follow them?*

Five cards. Four spheres plus one ungated common. One rider. Sum Δ = **0.47**; 0.44 + 0.47 = 0.91 ✓.

**1 · `line.s2b.not_the_worst`** — Type: **Mercy** · `libraryCardId: 'card.mercy.core'` · common, ungated · rider `no_crit_fail` · `imageTag: 'generic.mercy'` · essence **3** · Δ **0.04**
- **name** `Not The Worst` · **fiction** *"Failing is survivable. Some failures are not."*
- **effectLine** — "You lay a floor under the moment so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- `near_miss` — "It ended badly and stopped ending, which was the purchase."
- `failure` — "It went wrong, and something under it decided how far wrong was allowed."

**2 · `line.s2b.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.13** · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You take away the instinct to stop once someone is down. A strong help, and it moves them toward the ruthless end for good."
- `success` — "Nothing in them said stop, and it was over while the others were still deciding."
- `critical_failure` — "Nothing said stop, and so nothing said look behind you either."

**3 · `line.s2b.a_sudden_surge`** — Type: **Boost** · `libraryCardId: 'card.boost.signature.energy'` · sphere `energy` · `imageTag: 'generic.energy'` · essence **2** · Δ **0.10**
- **name** `A Sudden Surge` · **fiction** *"Bodies hold more than they admit."*
- **effectLine** — "Where you hold energy, a body will spend more than it has: when the arms go dead, there is one more in them. A real help."
- `critical_success` — "There was one more in them, and one more was the whole of it."
- `near_miss` — "There was one more in them. The road wanted three."

**4 · `line.s2b.weight_behind_it`** — Type: **Signature** (one-off) · sphere `force` · `imageTag: 'generic.strength'` · essence **2** · Δ **0.12**
- **name** `Weight Behind It`
- **effectLine** — "Where you hold force, the ground and the air answer to you first: footing holds where it should slip, and a blow lands with more behind it than the arm had. A real help."
- **fiction** — *"Some gods are felt before they are heard."*
- `success_at_cost` — "The ground held under one of them and not the other, and both of them noticed."
- `failure` — "Every step was solid. Solid footing in the wrong place is still the wrong place."

**5 · `line.s2b.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.08**
- **name** `Something To Want` · **fiction** *"A life turns on what it reaches for."*
- **effectLine** — "You wake in the ones still standing a want to be alive somewhere else tomorrow. A real help."
- `success` — "One of them decided he would rather be alive elsewhere, and the rest followed him out."
- `near_miss` — "Two of them wanted to be elsewhere and went, and two of them stayed."

**Hand audit.** 5 cards ✓ · spheres darkness, energy, force, spirit = 4 ✓ · commons 1 ✓ · riders 1 ✓ · Boost 1 ✓ · types Mercy/Undertow/Boost/Signature/Kindled ambition = 5 ✓ · bands: `critical_success` 3 · `success` 2, 5 · `success_at_cost` 4 · `near_miss` 1, 3, 5 · `failure` 1, 4 · `critical_failure` 2 ✓ · every card has a failure fragment ✓ · no big-delta card ✓ · no digits ✓.

**Card-type spend across the encounter:** boost 7 · mercy 3 · compulsion 3 · kindled_ambition 4 · undertow 4 · signature 4 · fellowship 3 = **27 cards, 7 types, none outside the budget.** `libraryCardId` set on **18 of 27**; the nine one-offs are the two typeless types (5 cards) and four sphere gaps, each recorded above.

---

## 6. Band prose — the base text per step

The base band text is **what happens when the god did nothing**. Every card's payoff lives in its fragments, so each of these reads correctly with any subset of the hand active. `near_miss` has no afterimage field — it is paid off through fragments, per the schema.

### Step 0 — `heart`, "Win their trust"

| Band | Afterimage |
|---|---|
| `critical_success` | The pilgrim took the offered arm before the offer was finished, and asked what to do. |
| `success` | The pilgrim let themselves be moved, and stopped asking why. |
| `success_at_cost` | The pilgrim moved, still arguing, and the arguing was loud enough to carry. |
| `failure` | The pilgrim would not be moved by a stranger, and the pack stayed on. |
| `critical_failure` | The pilgrim decided the traveler was the danger, and said so at the top of their voice. |

### Step 1 — `positive`, `gold`, "Talk them down"

| Band | Afterimage |
|---|---|
| `critical_success` | The lead rider heard the price, looked at what was standing in the road, and named it back. |
| `success` | They listened all the way to the end of it, which was more than they had to do. |
| `success_at_cost` | They took the offer and added to it while it was being made. |
| `failure` | They let the talking finish out of politeness and came on anyway. |
| `critical_failure` | The offer told them exactly how much there was to take. |

### Step 1 — `negative`, `iron`, "Strike first"

| Band | Afterimage |
|---|---|
| `critical_success` | Two were down before the third had the reins gathered. |
| `success` | The first exchange went the traveler's way, and the riders came off the road to think about it. |
| `success_at_cost` | It landed, and something came back the other way at the same time. |
| `failure` | They had seen it coming from further off than anyone thought. |
| `critical_failure` | The traveler went in at four men and found out how many four is. |

### Step 2 — `positive`, `gold`, "Make it hold"

| Band | Afterimage |
|---|---|
| `critical_success` | They counted it, said something almost civil, and rode past on the far side. |
| `success` | The goods changed hands and the riders went on through, and nobody touched anybody. |
| `success_at_cost` | They took the price, and then took a little more because nobody stopped them. |
| `failure` | Halfway through the counting somebody decided the whole pile was already theirs. |
| `critical_failure` | The bargain came apart in the counting, and came apart the fast way. |

### Step 2 — `negative`, `iron`, "Finish it"

| Band | Afterimage |
|---|---|
| `critical_success` | It stopped because they stopped it, and the road was empty inside a minute. |
| `success` | The last two turned their horses and did not look back at the ones on the ground. |
| `success_at_cost` | It ended, and the ending was paid for out of the traveler's own skin. |
| `failure` | It did not end so much as run out, with both sides backing off it. |
| `critical_failure` | It ended with the traveler in the ditch and the road belonging to somebody else. |

---

## 7. Trait hooks (all four questions answered)

1. **Gate?** — **No.** A road is a road, and nothing about who the agent is should decide whether they are allowed to meet this. `requiredTraits` / `blockedByTraits` unauthored.
2. **Variant?** — **Yes.** One, on `trait.core.core_warmth.virtue` — the **Warm** pole of the Core warmth continuum (`src/types/coreRegistry.ts`, `governs: 'care for others'`, `reachCouplings` include `heart +1`). Verified live: it is a seeded Core definition, so `validateTraitRefs()` does not report it dead, and the full node id is the least rot-prone ref form.
   ```
   traitId:         'trait.core.core_warmth.virtue'
   forecastDelta:   0.05
   difficultyDelta: -0.03
   factorLine:      'Being Warm, they do not leave someone who cannot run.'
   ```
   The line names its source inside the sentence (canon rule 1) — not `Source: trait` beside it — and is variant by construction, since it renders only for a bearer.
3. **Trait-only nudge?** — **No**, and this is a deliberate budget decision rather than an oversight: the batch's card-type allocation gives `trait_card` to encounters #2 and #5, and this encounter's seven-type budget is already spent. Recorded so a reviewer can price the trade. `addNudgeIds` unauthored.
4. **Trait fragment?** — **No.** The variant's `factorLine` carries the trait's presence, and adding a band fragment on top would say the same thing twice in one panel.

**Note on the fork and the trait.** Being Warm eases the *heart* test; it does not lean the fork. The fork reads `axiologicalProfile.mercy_ruthlessness`, which is a different axis and a different surface, and conflating them would let a warm person be quietly declared merciful by the engine — which is exactly the kind of plausible, invisible, load-bearing wrongness `signedLeanWeight`'s axis check exists to prevent.

---

## 8. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,                       // the DECIDING step, not the fork's own index
  variants: { positive: HOLD_THE_ROAD, negative: BREAK_THE_PURSUIT },
  fallback: { ...HOLD_THE_ROAD },
}
```

**`branchOnStep: 0`, three times over.** The step-1 branch, the step-2 branch, and the aftermath config all key on **step 0** — the step that resolved and against which the pole was recorded. Naming the fork's own index would read a step no choice is ever written to (THR-979). Only the step-1 branch carries `decidedBy`; step 2's branch reads the choice already in history. (`decidedBranchesForStep` explicitly supports several branches off one deciding step and records **one** decision covering the lot, so either arrangement resolves — one `decidedBy` is simply the smaller surface.)

**`variants` key exactly `'positive'` / `'negative'`.** `recordDecidedChoice` writes the bare pole key, so a variant keyed anything else is unreachable forever and silently — the THR-844 shape.

**`fallback` takes the mercy pole**, not the ruthless one. A fork that failed to resolve must not default the mortal into starting a fight. (In practice `decidedBy` always records a pole — the coin settles a genuine tie — so the fallback is belt-and-braces, exactly as it is on the apotheosis.)

### 8.1 Reaction design, and why some bands carry one reaction and some carry two

Every chip on a band must correspond to an effect that fires **on that band** (UI Law 56 / Consequences rule 0), and a reaction is a click — so a chip may only claim what **every** arm of that band writes. The rule this encounter follows:

> **Both arms of a band always write the same chipped effects, and differ in one unchipped effect. A band carries a second reaction only where the fiction gives the god two genuinely different things to weigh.**

The recurring second stance, on the bands where it exists, is the encounter's own follow-up question — having decided *how* to protect someone, what is the protecting worth?

- **Arm A — "Let them owe it."** The pilgrim says what they owe and the traveler lets it stand. → `favor_creation` (debtor `$cast:survivor`) on top of the shared effects. A claim on a person, kept.
- **Arm B — "Tell them they owe nothing."** The traveler says it was nothing, and is believed. → a larger `bond_change` instead. A claim given away, which buys something a favour cannot.

On the worst band of each pole there is only one thing to do, so those bands carry a single reaction rather than a manufactured fork.

**`hidden_mark` is deliberately not chipped.** A concealed anchor is still an anchor, and Law 56 governs what a chip *claims*, not what the world records — a mark the agent is keeping to themselves has no business on a chip that announces it.

### 8.2 `positive` pole — **Hold the Road** (`variants.positive`)

**Base variant** — the `success` ending (no `byOutcome.success` key, so `success` resolves here).

> **overview** — The riders took the price and went through on the far side of the road, and none of them looked at the gorse where the pilgrim was lying. The traveler is lighter by most of what they were carrying. `{cast:survivor}` is asking, from the ground, what happens now.

**changes**
| | |
|---|---|
| **BOND · a bond formed** | `kind: 'growth'`, `direction: 'gain'`, `polarity: 'gain'` · `causeClause`: "They stood in the road until the riders had gone past" · `detail`: "{cast:survivor} will not forget who was standing there, and the two of them are tied by it now." · `stateNoun: { text: 'a bond formed', entityId: '$cast:survivor', visualKind: 'agent' }` · backed by `bond_change` on **both** arms |
| **PATH · a scene still to come** | `kind: 'future_hook'`, `direction: 'opens'`, `polarity: 'info'` · `causeClause`: "Four came up the road and the count of what went back down does not match" · `detail`: "{actor} will go over that ground again, and it will not come out even." · `stateNoun: { text: 'a scene still to come', entityId: '$actor', visualKind: 'agent' }` · backed by `encounter_seed` on **both** arms |

**reactions**
- **A · "Let them owe it"** — *intent:* "The pilgrim says what they owe, out loud, and the traveler lets it stand." → `bond_change` (`withAgentId: '$cast:survivor'`, sentiment +, trust +) · `favor_creation` (debtor `$cast:survivor`, context "carried off the road when they could not walk") · `hidden_mark` · `encounter_seed`
- **B · "Tell them they owe nothing"** — *intent:* "The traveler says it was nothing. Being believed about that lands harder than a debt would have." → `bond_change` (sentiment ++, trust ++) · `hidden_mark` · `encounter_seed`

---

**`byOutcome.critical_success`**

> **overview** — Somebody at the front of the four put a hand up before anyone had to say anything, and the whole line went by on the far side of the road at a walk. Nothing was handed over. Nothing is on the ground. The pilgrim spends a while explaining that the leg is not as bad as it looks, which it is.

**changes** — **BOND · a bond formed** only. No PATH: nobody came off the road, so there is nothing to count. **No seed on this band, by design** — the sequel's premise is an incomplete accounting, and this ending has a complete one.

**reactions** — A and B as above, minus the seed and the mark.

---

**`byOutcome.success_at_cost`**

> **overview** — The price was named and then renamed twice, and by the end of it the traveler had handed over the pack as well and taken a boot to the ribs for arguing about the last of it. The riders went through. One of them went down the bank in the dark and the others did not wait for him.

**changes** — **BOND · a bond formed** · **PATH · a scene still to come** · **SCAR · a wound** (`kind: 'trait'`, `direction: 'loss'`, `stateNoun: { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }`, `causeClause`: "Argued over the last of the price and was answered with a boot", `detail`: "Ribs that will complain about every hill between here and wherever they are going.")

**reactions** — A and B, both carrying `bond_change` · `hidden_mark` · `encounter_seed` · `condition_attachment` (`trait.condition.wounded`, moderate duration); A adds `favor_creation`.

---

**`byOutcome.failure`**

> **overview** — Nothing that was said made any difference to them. They came through, took what was worth taking, put the traveler down on the way past, and rode on together — all four of them, in no more hurry than before. The pilgrim was under a cloak by then, and being not worth the trouble is the whole reason they are still there.

**changes** — **SCAR · a wound** · **BOND · a bond formed** (thinner: the pilgrim watched somebody take a beating for them and is not sure yet what to do with that). **No PATH** — all four rode off together, and there is nothing miscounted.

**reactions** — A and B, both `bond_change` (small) · `condition_attachment` (wounded); A adds `favor_creation`.

---

**`byOutcome.critical_failure`**

> **overview** — The traveler went down early and stayed down, and the four of them were unhurried about the rest of it. When there was light enough to see by, the gorse where the pilgrim had been sitting was empty, and the pack was gone from it, and the road north had a great many hoofprints on it. `{cast:survivor}` is somewhere at the end of them.

**changes** — **SCAR · a wound** (stacked, long duration; `detail`: "A beating that will be measured in days, not hours."). **No BOND** — the bond did not form. **No PATH** — the agent is not counting anything from a ditch.

**reactions** — one only. **"Let them lie until the light"** — *intent:* "There is nothing to get up for yet." → `condition_attachment` (wounded, long, 2 stacks) · `hidden_mark` (`secret_knowledge`, "They know who was sitting in that road and who is not there now"). A second reaction here would be a manufactured stance; there is one thing to do.

### 8.3 `negative` pole — **Break the Pursuit** (`variants.negative`)

**Base variant** — the `success` ending.

> **overview** — The traveler met them where the way is narrowest, and four riders strung out on a climb are not four riders. Two came off. The other two took one look at the arithmetic and went back the way they came, and the road stayed empty for as long as it took to walk back. Everyone who came up that road is accounted for. `{cast:survivor}` heard all of it and has not asked a single question about it.

**changes** — **BOND · a bond formed** (`causeClause`: "Went up the road alone so that nobody had to come down it"). **No PATH** — a clean break accounts for everybody.

**reactions** — A and B, both `bond_change`; A adds `favor_creation`.

---

**`byOutcome.critical_success`**

> **overview** — It was over in one exchange and nobody died in it. Two of them are going to remember the narrow place for a long time, and all four went back down at a pace that had nothing dignified about it. The pilgrim, who had been told to stay still, stayed still.

**changes** — **BOND · a bond formed**. No PATH, no SCAR.

**reactions** — A and B.

---

**`byOutcome.success_at_cost`**

> **overview** — It worked, and it was ugly the whole way through, and somewhere in the middle of it the traveler stopped a blade with an arm. The road is clear. When there was light enough to walk it and count what was on it, the count came out one short of what had come up.

**changes** — **BOND · a bond formed** · **PATH · a scene still to come** · **SCAR · a wound**

**reactions** — A and B, both `bond_change` · `hidden_mark` · `encounter_seed` · `condition_attachment` (wounded); A adds `favor_creation`.

---

**`byOutcome.failure`**

> **overview** — The strike went in late and they came on through it, and the traveler got back to the narrow place a half-step ahead of them and made the rest of it expensive. Somewhere in there the riders decided that whatever was up this road was not worth what it was costing, and pulled off it. Nobody counted anything, then or after.

**changes** — **SCAR · a wound** · **BOND · a bond formed** (small) · **PATH · a scene still to come**

**reactions** — A and B, both `bond_change` (small) · `hidden_mark` · `encounter_seed` · `condition_attachment` (wounded); A adds `favor_creation`.

---

**`byOutcome.critical_failure`**

> **overview** — The traveler went up the road alone to meet four men and found out, in about the time it takes to say so, exactly what four men are. The riders came the rest of the way down at a walk, went past the narrow place without slowing, and did not look at what was sitting in it — which is the only reason there is still somebody sitting in it.

**changes** — **SCAR · a wound** (stacked, long). **No BOND chip** — the bond is written small on both arms but the ending has nothing to boast about; the engine's own delta cluster reports it. **No PATH.**

**reactions** — one only. **"Let them lie until the light"** — *intent:* "Somebody will come down the road eventually. It may as well be with the sun up." → `condition_attachment` (wounded, long, 2 stacks) · `bond_change` (`$cast:survivor`, small — the pilgrim walks back to find them) · `hidden_mark`.

### 8.4 The `byOutcome` floor and reachability

Each pole authors **five** of the seven `UnifiedActionOutcome` values, against a floor of three (one success-side, one failure-side, one extreme). `contested_won` / `contested_lost` are deliberately unauthored: this template is never contested, so authoring them would ship prose no player can arrive at.

Note `byOutcome` keys on `UnifiedActionOutcome` (**no `near_miss` member**) while every `bandProse` above keys on the six-value `StepOutcome` (**which has one**). Both domains type-check as each other and one of them is always wrong.

---

## 9. The sequel contract — written out

**Effect, identical on every arm of every seed-bearing band:**

```ts
{
  kind: 'encounter_seed',
  templateId: 'encounter.border.one_body_short',
  inheritContext: true,
  delayTicks: 12,
  seedLabel: 'The count on the road behind them',
}
```

### Which bands plant it, and why those

| Pole | Band | Seed? | Why |
|---|---|---|---|
| `positive` | `critical_success` | **no** | The riders never closed. Nothing came off the road, so there is nothing to count. |
| `positive` | `success` (base) | **yes** | They were paid off and went through, and in failing light a bought passage is exactly the kind that nobody supervises to the end. |
| `positive` | `success_at_cost` | **yes** | One of them went down the bank and the others did not wait. |
| `positive` | `failure` | **no** | All four rode on together. Nothing is miscounted; the ending's consequence is the wound. |
| `positive` | `critical_failure` | **no** | The agent is face-down in a ditch. There is no counting from there, and the missing person is the pilgrim — a different encounter, and not the one being authored. |
| `negative` | `critical_success` | **no** | One exchange, nobody dead, all four rode back down. Complete. |
| `negative` | `success` (base) | **no** | A clean break accounts for everyone; the prose says so explicitly. |
| `negative` | `success_at_cost` | **yes** | It was ugly and it was dark, and the count came out short. |
| `negative` | `failure` | **yes** | The riders pulled off it on their own terms and nobody counted anything, then or after. |
| `negative` | `critical_failure` | **no** | The agent is in the ditch. |

**Four of ten endings**, and the asymmetry is the design rather than an accident: **mercy loses count by choice** (you let beaten men walk off into the dark, and that is what mercy costs), **ruthlessness loses count by mess** (you hit four men where they were not ready and in the dark you do not get all of them). Two seeded bands per pole, arrived at from opposite directions.

### What state this encounter mints for the sequel to read

1. **The cast member who crosses.** `$cast:survivor`, `persistence: 'must-persist'`. `inheritContext: true` copies this action's `targetId` and `supportBindings` onto the seed, so **One Body Short** stars the same person, with the same node, the same name and the same portrait. This is what makes prose rule 7 structural for the sequel: it may narrate the history because the parent wrote it.
2. **The bond.** `bond_change` with `$cast:survivor` fires on every arm of every seeded band, so the sequel's `eye` test is being performed in front of somebody the agent is measurably tied to — and the sequel may say so.
3. **The fact that a body is unaccounted for.** `hidden_mark` on the **actor**:
   ```ts
   {
     kind: 'hidden_mark',
     category: 'secret_knowledge',
     severity: 0.35,
     label: 'The count on the road came up one short',
     revealFamilies: ['encounter.border'],
   }
   ```
   **Why a mark and not an object.** There is no corpse node, and no node type for "a man who is not where he should be". Minting one would be the river-chip failure exactly — a referent that is landscape fiction wearing a pointer. A hidden mark is a real, resolvable write on a real agent, and `revealFamilies: ['encounter.border']` is the sanctioned channel for a later encounter in the same family to find it. The bearer is the actor, and the actor is the one who draws `encounter.border.*`, so the reveal-family bearer trap does not bite.

### Pole-invariance — the sequel's binding constraint on this encounter

**One Body Short does not know which pole the fork took.** It refers to the inherited person only as *"the other survivor"* and gives them no pronoun anywhere. Everything this encounter mints for it must therefore be **true on both poles**, and the seed is planted only on bands where the pole-invariant facts actually hold.

| Minted fact | Pole-invariant? | Holds on all four seeded bands? |
|---|---|---|
| The `survivor` exists, is bound, persists, and is with the agent | **yes** | ✓ — they are alive and beside the agent on `positive.success`, `positive.success_at_cost`, `negative.success_at_cost`, `negative.failure` |
| A bond edge between agent and `survivor` | **yes** | ✓ — `bond_change` fires on **both** reaction arms of all four |
| The count on the road came up one short (`hidden_mark` on the actor) | **yes** | ✓ — same, both arms of all four |
| A favour owed by the `survivor` | **no** — arm A only | ✗ — the sequel must never assume it |
| A wound on the agent | **no** — absent on `positive.success` | ✗ — the sequel must never assume it |

The three invariant facts are exactly the three the sequel reads (§ "What state this encounter mints"). The two variant ones are listed here so the sequel's author can see, in one table, what is *not* safe to lean on.

**The seed's band set was already pole-symmetric for a fiction reason** — mercy loses count by choice, ruthlessness loses count by mess — and this constraint confirms rather than changes it: on every seeded band the survivor is alive, present, and tied to the agent, and the count is short. The three bands that would break invariance are the three excluded ones. `positive.critical_failure` is the sharpest case: the person is taken up the road there, so "survivor" would be a lie and the sequel's whole premise would not hold — and that band plants nothing.

### Why the `secret` family is `hidden_mark` + `favor_creation` and **not** `secret_discovery`

`secret_discovery` has no `targetAgentId` field: it reads `action.targetId`, and `createSecretEdge` refuses a non-actor endpoint. This encounter's secret is *what the agent knows about the road* — an incomplete count of people who are not cast members and have no nodes — so its natural endpoint is a place and a set of absences, which `secret_discovery` structurally cannot express. Forcing it onto the crossing person would make the sequel read a `knows_secret_of` edge pointing at the wrong subject: the survivor is not the secret, the missing rider is.

So the secret is wired the two ways that can carry it honestly:

- **`hidden_mark` on the actor** — the count, concealed, with `revealFamilies: ['encounter.border']`. It is the fact the sequel's `eye` test is *about*, and it needs no second party.
- **`favor_creation`, debtor `$cast:survivor`** — a debt spoken between two people and known to nobody else, which is a secret in the plain sense and is edge-backed to a cast member who is `must-persist`.

Both are `secret`-family members per the consequence-draw table, so the drawn family is wired in context and `check:encounter` is satisfied without a mis-targeted edge.

**Not reached for, and recorded so nobody reaches for it later:** `thread_*` effects cannot resolve a scene sentinel today (`SCENE_SENTINEL_FIELDS` omits `ascendantId`/`mortalId`, the handlers read ids raw, and an authored sentinel no-ops with `thread_mutation_skipped` while `check:encounter` passes on kind presence alone). This encounter did not draw `thread` and must not take one as a swap.

**Why `delayTicks: 12`.** Twelve ticks is exactly one in-world day (canon: two in-world hours per tick, twelve ticks per day). The count happens the next morning — the first hour there is light on that ground and nothing coming up it, which is the first hour anybody could honestly do it. A shorter delay would have the agent counting in the dark with their hands still shaking; a longer one would have somebody else's crows do the counting first. It is one named constant's worth of time, not a taste number.

**What the sequel must not assume.** Only the three writes above. The parent does not mint a faction, a location condition, an artifact, or a quintessence shift — the batch design allots `quintessence_shift` to the sequel itself, and the sequel is the one that spends it.

---

## 10. Consequence draw

```ts
consequenceDraw: ['relationship', 'secret', 'story_seed'],
// no consequenceSwap
```

Verified by running the draw on the final template id — `npm run draw:consequences -- encounter.border.standing_the_line --reach heart --rarity 3` returns exactly `relationship` (weight 10 in heart), `secret` (4), `story_seed` (7), which matches the batch design's row. `check:encounter` recomputes it from the id, so this is a claim the gate audits.

| Family | Wired with | In context |
|---|---|---|
| `relationship` | `bond_change`, `withAgentId: '$cast:survivor'` | The encounter is *about* someone who cannot fight being behind you. The bond is the thing the whole scene is for, not an ending bolted on — and it forms on nine of the ten endings, at different weights, because standing in a road for a stranger changes what you are to each other however it goes. |
| `secret` | `hidden_mark` (both arms, seeded bands) **and** `favor_creation` (arm A, most bands) | Two different secrets, both earned: a count the agent has told nobody, and a debt spoken between two people and known to no one else. |
| `story_seed` | `encounter_seed` → `encounter.border.one_body_short` | § 9. The draw returned `story_seed` on its own, which is why this encounter is the batch's sequel parent rather than a pair invented after the fact. |

**No swap taken.** All three families fit the fiction without argument, and the one valve stays unspent.

---

## 11. Images

### Card art

Every `imageTag` names a real row in `ENCOUNTER_IMAGE_LIBRARY` (`kind: 'nudge'`) — the gate resolves rather than trusts, because a dead tag falls back to the category generic silently at render and the art an author believed they picked is simply never seen.

| Tag | Sphere | Used by | Genericity test |
|---|---|---|---|
| `generic.focus` | mind | the three core Boosts | Reads in any encounter where steadiness is the variable — a river crossing, a forgery, a negotiation. Well past three unrelated encounters. |
| `generic.energy` | energy | the two energy Boosts | Any encounter where a body has to spend more than it has. |
| `generic.mercy` | — | the three Mercy cards | Any encounter with a floor worth buying. |
| `generic.memory` | mind | the three Compulsions | Any encounter where a thought is placed rather than a thing moved. |
| `generic.blessing` | spirit | the four Kindled ambitions | Any encounter where a want is lit. |
| `generic.dark` | darkness | the four Undertows | Any encounter where the shorter, uglier answer is on offer. |
| `generic.strength` | force | the two force Signatures | Any encounter where weight decides it. |
| `generic.light` | light | `Made Plain` | Any encounter where what is visible is the lever. |
| `generic.time-slow` | time | `Not The First Time` | Any encounter where a moment is stretched or made to feel worn. |
| `generic.oath` | order | the three Fellowships | Any encounter where a group has to move as one. |
| `generic.matter` | matter | `Sound Goods` | Any encounter where an object's soundness is the question. |

Every one clears `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) by a wide margin, because none of them depicts a road, a rider, or a person on the ground.

### Scene art

**Scene tag:** `road.narrow_place.pursuit` (WS4 vocabulary; until a manifest row exists the fallback chain ends at EntityVisual).

**`illustrationUrl` is deliberately unauthored.** The apotheosis declares `/concept-art/encounters/placeholder.jpg`, and that file **does not exist on disk** (`public/concept-art/encounters/` holds nineteen named images and no placeholder). The Composition Contract only checks that a declared `illustrationUrl` is public-absolute, so a dead path passes the gate and renders a broken image. Declaring nothing falls through the documented chain instead. Worth a separate look at the apotheosis's declaration.

---

## 12. Concept art direction (two-question method)

**1. What emotions does this story convey?** The arithmetic of standing between something and someone. Not heroism — *calculation under a deadline*, and the particular loneliness of being the only thing in the way. Afterwards: an accounting that will not come out even.

**2. What image evokes those emotions while staying inside this world?**

> **A narrow place on a road, empty, at the hour after.** The ground where the way pinches — baked ruts, or fallen courses, or a causeway between ditches — shot along the road rather than across it, so the eye is funnelled the way the riders came. Nothing dramatic on it. A pack sitting upright on the verge where somebody set it down and did not pick it up again. Further off, faint in the failing light, four sets of hoofprints going one way — and, if the composition can carry it without narrating, a fifth set that leaves the road and does not come back to it. No figures. No blood. No weapons.

This shows **residue and absence**: the pack is the person who could not walk, the prints are the thing that did not have to stop, and the set that leaves the road is the count that will not come out. It carries the sequel without illustrating either encounter. It depicts no interaction and no second human likeness (image doctrine ruling 10), and it does not paint any mechanic into the frame.

---

## 13. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `survivor` (actor) | `lazy-materialize-on-trigger` | reuse `pilgrim` where a roster seeds one (`wilderness`); otherwise spawn `pilgrim`, name `Ilme Fenn` | **must-persist** | `bond_change` on nine endings · `favor_creation` on arm A · `{cast:survivor}` in three overviews · **inherited by `encounter.border.one_body_short`** | built (spec authored) |
| `trait.condition.wounded` | live catalog | `src/data/condition-trait-content.ts` | duration edge | four endings | live ✓ |
| `trait.core.core_warmth.virtue` | live catalog | `src/types/coreRegistry.ts` → `src/data/core-trait-content.ts` | seeded definition | `traitVariants[0]` | live ✓ |
| `encounter.border.one_body_short` | authored in the same batch | batch design row #5 | — | `encounter_seed.templateId` | **authored in parallel — must land in the same PR** (a seed naming an unbuilt template is the THR-844 rot) |
| Library card members (6 distinct) | `NUDGE_CARD_LIBRARY` | `src/data/nudge-card-library.ts` | starting unlocks | 18 `libraryCardId` refs | live ✓ |
| Image rows (11 distinct) | `ENCOUNTER_IMAGE_LIBRARY` | `src/data/encounter-image-library.ts` | on disk | 27 card `imageTag`s | live ✓ |

---

## 14. Template skeleton (for Pass 3 — no TypeScript authored here)

```
id                encounter.border.standing_the_line
name              Standing the Line
rarityTier        3
intrinsicTier     background
reach             heart
crudType          update
scale             local
apCost            1
actorAffinities   ['individual']
motivations       ['mercy_ruthlessness', 'loyalty_ambition']
settings          ['stronghold', 'ruin', 'wayside', 'battlefield']
openings          one per class (§ 2)
locationSubtypes  expandSettings([...settings])       // derived, never hand-written
steps             [ step0WinTheirTrust,               // plain, heart, hand of 7
                    step1Branch,                      // branchOnStep 0, decidedBy mercy_ruthlessness
                    step2Branch ]                     // branchOnStep 0, reads the recorded pole
traitVariants     [ core_warmth.virtue ]              // § 7
supportBundle     [ survivor ]                         // § 3
aftermathConfig   branchOnStep 0, variants {positive, negative}, fallback = positive
consequenceDraw   ['relationship', 'secret', 'story_seed']
illustrationUrl   (unauthored — see § 11)
```

Wrap with `compileOpeningEnvelope(withEncounterContract({ ... }))` so the openings actually reach the reader: a direct-authored template whose `openings` are validated and then read by nothing is THR-932, and it cost all eight slice encounters their approved opening paragraph.

---

## 15. Self-audit

| Check | Verdict |
|---|---|
| Design block written before prose, terse, one line per row | **PASS** |
| Crux is one plain sentence; title states it | **PASS** |
| One entry per catalog, system pick in the mature tier | **PASS** — `forks` + `carryover` + `traits`, all mature |
| Hook recorded, rolled and taken, verified live | **PASS** |
| 14 scene-writer questions answered in writing before the prose | **PASS** |
| Envelope declared, one opening per class, spine setting-neutral | **PASS** — four classes, four openings, no class scenery below the opening |
| ≥1 cast binding; every `{cast:*}` token names a declared key | **PASS** — one key, `survivor`, used in three overviews |
| Cast class-honest across the whole envelope | **PASS** — see § 3; the castle roster is explicitly rejected with its reason |
| Cast never gendered in prose | **PASS** — *they* or a role noun throughout |
| Something persists | **PASS** — `bond_change`, `favor_creation`, `hidden_mark`, `encounter_seed`, `condition_attachment`, all in `PERSISTENT_EFFECT_KINDS` |
| ≥3 system connections from the authored manifest | **PASS** — 4 (cast, rewards, seeds, conditions) |
| `aftermathConfig` present; `byOutcome` floor ≥3 bands per variant | **PASS** — 5 authored per pole |
| Every variant carries an `overview`; every change declares `concepts`/`stateNoun` | **PASS** |
| Every `changes` entry backed by an effect that fires on that band, on **every** arm | **PASS** — § 8.1 states the rule the chips were authored under |
| No `reputation_tally` chip | **PASS** — none authored |
| Chip referents are anchor-catalog members and are named in the sentence | **PASS** — `$cast:survivor` (individual, linked), `$actor` (individual, linked, the seed's carrier), `trait.condition.wounded` (attachment, linked) |
| 4–8 cards per nudge-bearing step | **PASS** — 7 / 5 / 5 / 5 / 5 |
| ≥4 spheres, ≥1 ungated common option, ≤1 rider per hand | **PASS** — audited per hand |
| ≤2 Boost per hand; ≥3 distinct types per hand | **PASS** |
| Every card pays off in failure; big-delta cards cover both failure bands | **PASS** — audited per hand |
| All six `StepOutcome`s covered on every hand | **PASS** — audited per hand |
| Base band text reads correctly with any subset of the hand | **PASS** — § 6 is what happens when the god did nothing |
| `libraryCardId` set on every card matching a library member | **PASS** — 18 of 27; the nine one-offs are recorded with reasons |
| Every card `imageTag` resolves to a library row | **PASS** — § 11, eleven tags, all `kind: 'nudge'` rows |
| No static `factorLines`; carryover lines authored and within budget | **PASS** — four carryover tables, none on step 0 |
| No digits or `%` in any `effectLine` | **PASS** |
| Trait hooks: all four questions answered explicitly | **PASS** — § 7, two yeses and two written noes |
| Trait ref passes `validateTraitRefs()` | **PASS** — `trait.core.core_warmth.virtue` is a seeded Core definition |
| Open-draw reachability: every step ≤ 0.45 | **PASS** — 0.35 / 0.40 / 0.40 / 0.28 / 0.44 |
| Hand delta sums under 0.70; difficulty + hand inside [0,1] | **PASS** — 0.58 / 0.46 / 0.55 / 0.43 / 0.47 |
| No `authoredChoices` | **PASS** — the fork is `ActionStepBranch.decidedBy`, the mortal's |
| `variants` key exactly `'positive'` / `'negative'` | **PASS** |
| `branchOnStep` names the deciding step | **PASS** — 0 in all three places |
| Both poles fully authored — prose, hands, bands, aftermath | **PASS** — two hands, five afterimage sets, ten endings |
| ≥3 `poleLean` cards, both directions | **PASS** — 4 on the deciding step, 2 per side |
| ≤1 annotation clause across the encounter | **PASS** — one, and it is deliberate: *"not heroism — calculation under a deadline"* in § 12, which is art direction rather than player-facing prose. Zero in player-facing text. |
| Zero divine outcome-authorship | **PASS** — every card says *leans / argues / steadies / holds*; no decision verb takes a clause about the world |
| Vagueness lexicon zero within field class | **PASS** — `someone` appears in the § 7 factor line and one card face, both `interactive`/`scene` class where natural indefinites are ordinary English; outcome prose names the result every time |
| Consequence draw recorded, all families wired in context, ≤1 swap | **PASS** — three wired, zero swaps |
| Seed names a template authored in the same batch | **PASS** — with a hard note in § 13 that it must land in the same PR |
| Cast key matches the sequel's inherited key | **PASS** — `survivor`, per the cross-encounter contract in § 3 |
| Every minted fact the sequel reads is pole-invariant | **PASS** — § 9, with the two variant facts named so the sequel cannot lean on them |
| `secret` family wired without a mis-targeted `secret_discovery` edge | **PASS** — `hidden_mark` + `favor_creation`, reasoned in § 9 |
| Seam / echo check across opening → spine → band → step | **PASS** — see § 2 and the note below |

**Echo check, run by hand.** The four openings share no image with each other or with the spine (no opening mentions horses; the riders belong to the spine alone). *"The count came out one short"* appears once in player-facing prose (the ruthless `success_at_cost` overview) and once as a `hidden_mark` label, which never renders. *"One rope, many hands"* is one card face dealt three times, which is a library card being itself. The two "Let them lie until the light" reactions sit on opposite poles' worst bands and carry different `intent` lines. No two afterimages in § 6 share a sentence shape: the twenty-five lines were read down the column and four were rewritten to break a *"The X did, and the Y did not"* pattern that had accumulated at three.

**Known gate blind spot, recorded rather than relied on.** `nudgeBearingSteps` and `plainSteps` both filter `template.steps` for plain `ActionStep`s, so **`check:encounter` will see only step 0's hand** — the four hands inside the two `ActionStepBranch`es are invisible to the machine checklist, and the Steps block will count one plain step rather than three. Every branch hand above was therefore audited against the checklist by hand, line by line, and the audit tables in § 5 are that audit. Do not read a green gate as coverage of §§ 5.2–5.5. (The one branching template in the corpus, `encounter.apotheosis.ascension`, is on `RETROFIT_PENDING`, so nothing has ever proven this shape against the contract.)

---

## 16. Experience Differentiator Gate

**Scene & Prose**
1. Opening places the player inside a moment already in motion, not a briefing? — **YES.** Each opening is a place with weather and a smell and no exposition; the spine puts a person on the ground and something coming up the road, and never explains why either is there.
2. Prose has its own voice — cadence, rhythm, sentence variety? — **YES.** Long approach sentences in the openings, short flat ones in the endings; the worst bands are the shortest.
3. Scene prose names the elements that later become choices? — **YES.** The narrow place, the leg, the pack, the four riders and the pilgrim's distrust are all in the spine, and every one of the twenty-seven cards acts on one of them.
4. Would a reader feel something from the prose alone? — **YES.** *"Nothing on this road obliges them to stop"* is the whole encounter and needs no mechanics under it.

**Choices & Intervention**
5. Every card states its mechanism in the `effectLine`, generic 2–4 word title, one flavor line, zero scene-bespoke prose on the face? — **YES.** Eighteen faces are the library's own, verbatim; the nine one-offs are written to the same bar and named in § 5.
6. Every card's price real and legible? — **YES.** Essence throughout, plus two non-essence channels carried as *permanent value drift* on the four Undertows — the card's printed promise, priced in who the mortal becomes.
7. Every card pays off in failure; big-delta cards cover both failure bands? — **YES.** Audited per hand.
8. Is the hand grounded — delete the target and the card is senseless? — **YES.** Delete the riders and the pilgrim and none of the twenty-seven cards means anything.
9. Do the cards answer different questions? — **YES.** Audited per hand, and the three step-slots answer three different questions (which way / does it start / does it hold).
9b. Every nudge-bearing step carries a full authored hand, and no step asks the player to pick a branch or an ending? — **YES.** Five full hands. The fork is `decidedBy`; the player leans and the mortal answers.

**Aftermath & Consequence**
10. Does the aftermath have its own prose? — **YES.** Ten overviews, each saying only what it alone can say.
11. Actor-centred consequences with names and faces? — **YES.** `{cast:survivor}` is a real spawned person with a portrait, a click and a persistence contract, and the chips point at them.
12. Reaction choices where the player decides which thread to carry? — **YES.** Eight of ten endings offer two stances; the two that do not are the poles' worst bands, where the fiction gives the god one thing to do and a second option would be theatre.
13. Do the reaction choices represent different philosophical stances? — **YES.** *Hold a claim on the person you saved* against *give the claim away.* Arm A buys a future call-in; arm B buys a deeper tie and nothing to spend. Neither is the generous one.
14. Concept art uses the two-question method — residue, not illustration? — **YES.** § 12: an empty narrow place, a pack nobody picked up, and one set of prints that leaves the road. No figures, no fight, no blood.

**All fourteen YES.**
