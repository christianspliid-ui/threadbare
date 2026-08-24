# Encounter Pipeline: Standing the Line

> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: revised
> Revisions applied: seed band set corrected so the sequel's scene is reachable from both poles (mercy pole moves from `success`/`success_at_cost` to `success_at_cost`/`failure`, both rewritten) · `positive.critical_success` rewritten to match the steps that produce it · `negative.failure` rewritten so the agent makes the count it is recorded as knowing · `poleLean` weights made symmetric and the lean note rewritten · 32 vagueness-detector hits repaired to zero · 5 setting-envelope leaks repaired · 4 seam echoes repaired · 3 scene-bespoke effect lines rewritten · `{cast:survivor}` added to the ruthless pole's seeded bands · 2 false source citations and 2 wrong numbers corrected, every source claim now carries a `file:line` · `hidden_mark` declares `targetAgentId` · new § 8.0 (aftermath effect plumbing, blocking for Pass 3) · new § 9.5 (parent target contract, requested by the sequel) · self-audit corrected
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory line)
> templateId: `encounter.border.standing_the_line` | Batch: border-perils (THR-1221)

**Design row this fills:** `Docs/plans/encounters/border-perils-batch-design.md` § *4 · Standing the Line*.
**Authoring contract:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`.
**Reference conversion for the fork:** `src/data/encounters/apotheosis-ascension.ts`.
**Golden exemplar:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.
**Sequel (must land in the same PR):** `Docs/plans/encounters/one-body-short-draft.md` → `encounter.border.one_body_short`.

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
`plotHookTaken: hook.standing_the_line` — *"Someone who cannot fight is behind you and the thing coming does not have to stop."* Live at `src/data/content-eval/plotHooks.ts:612-619`: themes `protection`/`conflict`, reaches `iron`/`heart`, source *vault: Archetypes/Ordeal — Defense of the Innocent*, `usedBy: []`. The hook is unclaimed; `usedBy` gets stamped at closeout.

**1. Whose problem is this?** The agent's. Their road runs through the narrow place, and the person sitting in it cannot be walked around without leaving them there. The pilgrim is a person the scene puts in front of them, not the subject of the scene — the subject is what the agent does about a road they were already on.

**2. Which reach does each step test, and why is that the theme?**

- **Step 0 — `heart`.** Heart is bonds: Sworn ↔ Renegade. The test is *being believed by a stranger in the time available* — a frightened person on the ground who has no reason to trust the traveler standing over them. The scene grew from that, not the reverse: the pilgrim's refusal to be moved is what makes heart the honest reach.
- **Step 1 — `gold` (mercy pole) / `iron` (ruthless pole).** Gold is influence and the ledger: talking four armed riders into a price is a gold test in the plainest sense. Iron is force. The pole *is* the reach.
- **Step 2 — the pole's own reach again** (`gold` / `iron`). See § 0e.

**3. Why is the agent here?** All four motive routes are honest and none is required: `chance` (the road put a narrow place and a stranger in front of them), `choice` (their own errand runs this way), `mission` (sent through), `divine` (led here). No route is asserted in base prose — the scene claims only that the road goes this way, which is scene-local fact.

**4. Which mechanics and objects play?**

| Fact the prose states | Class | Surface |
|---|---|---|
| The pilgrim exists, has a name, persists | state **write** | `supportBundle` actor spec, key **`survivor`**, `must-persist` |
| The agent and the pilgrim end up bonded | state **write** | `bond_change` on every authored band |
| The pilgrim owes them / does not | state **write** | `favor_creation`, debtor `$cast:survivor` (one reaction arm) |
| A wound | state **write** | `condition_attachment` → `trait.condition.wounded` |
| The count came up short | state **write** | `hidden_mark`, category `secret_knowledge`, `targetAgentId: '$actor'`, `revealFamilies: ['encounter.border']` |
| The scene that comes back | state **write** | `encounter_seed` → `encounter.border.one_body_short` |
| Being the kind of person who does not leave someone behind | state **read** | `traitVariant` on `trait.core.core_warmth.virtue` |
| Which way the mortal goes | state **read** + **write** | `decidedBy: { axis: 'mercy_ruthlessness' }` reads the live axis position, and taking the pole drifts it |
| Travelling in company | state **read** | `requiresGroup` on three Fellowship cards |
| The narrow place, the pack, the leg, the wheel-ruts | scene-local | invented here, no life outside the encounter |

No base sentence asserts agent history the graph does not hold (prose rule 7). The pilgrim is a stranger *by construction* — the spine says so — which is what makes the heart test a real test.

**5. Rewards, and where the tension sits.** No treasure. The reward shape is **penalty-avoidance plus a person**: the baseline win is that the pilgrim is off the road and the agent is still standing, and the durable gain is the bond and (optionally) the favour. Failure costs a wound, days, and — on the worst mercy band — the pilgrim. Tension sits on step 1: the fork has already been taken by then, and the step is where the taken course either lands or does not. Quintessence stakes: moderate; the worst ending is a beating and a loss, never a scripted death, and no `quintessence_shift` is authored here (that is #5's, per the batch design).

**6. Does the mortal make a choice in this scene?** **Yes — this is the batch's fate-branching debut.**

- **Axis: `mercy_ruthlessness`.** Live at `src/types/agent.ts:10` in the `ValuePair` union; Iron's bound pair at `:39` (`iron: 'mercy_ruthlessness'`); poles Protector (+1) ↔ Conqueror (−1) at `:54` (`ARCHETYPE_NAMES`). **The pole labels live in `agent.ts`, not in `axisRegistry.ts`** — `mercy_ruthlessness` appears nowhere in `src/types/axisRegistry.ts`, which reaches the pair only through `REACH_VALUE_PAIR.iron` at `:89-91` and carries no labels of its own. (An earlier draft of this block cited `axisRegistry.ts` for labels *Brave* / *Power-Hungry*; neither string exists in the source. Corrected here so the next reader can falsify the citation in one command.)
- **Poles, as concrete courses of action:**
  - `positive` — **hold the road and let them past behind you.** Stand in the narrow place, make the passing cost something, and buy the minutes the pilgrim needs. Nobody has to die.
  - `negative` — **break the pursuit before it arrives.** Go up the road, take them strung out, and end their appetite for the rest of the day.
- **Who decides.** The mortal, at step 0's resolution: `readLiveAxisLean` (`src/engine/encounters/branchDecision.ts:128` — their `axiologicalProfile.mercy_ruthlessness` baseline plus accumulated drift) plus `sumHandLean` (`src/engine/encounters/poleLean.ts:118`) over the cards the god committed on step 0. Net lean past `BRANCH_DECISION_NEUTRAL_EPSILON` (0.05, `src/data/nudge-constants.ts:242`) decides by conviction; inside the band a single seeded coin settles it. **The player never picks** — `applyPoleDecision` (`branchDecision.ts:389-410`) derives the pole from those three inputs and nothing else, and the type says so in words at `src/types/unifiedAction.ts:1797`. Taking a pole drifts the mortal `BRANCH_DECISION_DRIFT_MAGNITUDE` (0.08, `nudge-constants.ts:261`) toward it, so a run's fourth road-block is measurably likelier to go the way the third one did.
- **Downstream:** each pole owns steps 1 and 2 (prose, hand, difficulty, `failBehavior`, carryover lines) and its own five-band aftermath. Both poles plant the sequel, on the two bands where the road left bodies (§ 9).
- **The god's levers:** four `poleLean` cards in step 0's hand, two per direction, all at the default weight (§ 5.1).

**7. Every promise pays off.** The opening promises a narrow place, a person who cannot move, and something coming. All three land inside step 0. The riders' number (four) is paid off in both poles' step 1. The pack the pilgrim will not put down pays off in the mercy pole's step 2 (it is part of what gets handed over) and in the mercy pole's `success_at_cost` band. Nothing is opened that the bands do not close — with the deliberate exception of the count, which is the seed, and which is *stated* as unfinished rather than hinted.

**8. Personalization + supporting content — systems connected (target ≥3 beyond the core test; hard gate at 3).**

| Connection | Counted as | How |
|---|---|---|
| Cast | `cast` | one bound actor spec, `must-persist`, class-honest at all four classes |
| Persistent aftermath effects | `rewards` | `bond_change`, `favor_creation`, `hidden_mark` (all in `PERSISTENT_EFFECT_KINDS`, `src/data/content-eval/compositionContract.ts:116-133`) |
| Planted future | `seeds` | `encounter_seed` → `encounter.border.one_body_short` |
| Injury | `conditions` | `condition_attachment` → `trait.condition.wounded` |

**Four**, counted from the authored manifest (`systemConnections`, `compositionContract.ts:263-284`), against `COMPOSITION_SYSTEMS_QUOTA_MIN = 3` (`:77`). No `reputation` and no `factions` connection: the riders are not a faction body and inventing a `factionDefId` for them would buy a quota point with a lie. The batch allots faction standing to #1 and #6.

Personalization: the pilgrim's name reaches the player through `{cast:survivor}` at the moments a name earns something — the ending where they say what they owe, the ending where they are gone, and the three endings where their stillness is the reason the count can be made at all. Everywhere else the prose is role-voiced.

**0e. The one place I read the design row rather than transcribed it.**
The design row says *"1 `heart` (the fork's deciding step) → 2 `gold` / `iron` per pole → 3 the pole's resolution"* and does not name step 3's reach. I read **"the pole's resolution" as continuing in the pole's own reach** — gold twice on the mercy pole, iron twice on the ruthless one. Three reasons:

1. A resolution step that switched reach mid-pole would dissolve the fork's identity exactly where it should be strongest. The mercy pole *is* the gold pole; a different resolution reach makes the pole a costume over a generic three-step encounter.
2. A run walks **one** pole, so a single playthrough touches three reaches — `heart`, then one of `gold`/`iron` twice — which is what the batch's reach budget counts when it credits this encounter `heart 1 · gold 1 · iron 1`. Converging both poles on a fifth reach would spend a reach the budget has allocated elsewhere.
3. Repeating a reach is only a gap when the second step re-asks the first step's question. Neither pole does: the two `gold` steps ask *can the offer land* and then *will the bargain survive being paid*; the two `iron` steps ask *does the first blow land* and then *does it end here or follow them*. Four distinct questions across two reaches.

Recorded here so a reviewer can overrule it cheaply.

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
| B8 | No contradictions? | One road, one narrow place, four riders, one pilgrim, one pack. The openings leave the hour open except `wayside`, which sets a low sun; nothing downstream contradicts either reading, and no band below the opening names scenery belonging to one class (§ 9 of the editorial; all five leaks repaired). |
| C9 | Would a real person do this? | Yes on both poles. Nobody walks up to four riders unarmed for fun: the mercy pole is a person who has calculated that a price is cheaper than a fight, the ruthless pole is a person who has calculated that four strung out in a narrow place are four fewer than four abreast. The pilgrim's refusal to be moved is the ordinary behaviour of someone in pain being handled by a stranger. |
| C10 | People as people? | The pilgrim will not give up the pack, does not know the traveler, and argues. The riders are unhurried rather than snarling — they are men on a road who have not decided anything yet, which is precisely what makes both poles reachable. |
| C11 | True costs? | Carried in the wound, the days, the handed-over goods, the men left on the road, and the pilgrim on the mercy pole's worst band. Nothing is free on either side of the fork. |
| D12 | Stake in one sentence? | *"Does the pilgrim get off this road alive and the traveler stay standing, or do four riders come through the narrow place and go on past what is left?"* Good outcome: the pilgrim is clear, the traveler is upright, and there is a person in the world who owes them a morning. Bad outcome: a wound that will not walk off, and — at worst — an empty place beside the road where somebody was sitting. |
| D13 | Cards grounded? | Every card acts on something the scene established: the pilgrim's nerve, the pilgrim's trust, the riders' appetite, the pace of the horses, the light on what is being offered, the weight behind an arm. Delete the riders and the pilgrim from the prose and none of the twenty-seven cards means anything here. |
| D14 | Mechanism, not mood? | Every `effectLine` states what the god does to the fabric of the scene and why that moves the odds, in plain words, no digits. Pole-leaning cards say which way they argue in the same sentence. |
| D15 | Openings cover the envelope? | `settings: ['stronghold', 'ruin', 'wayside', 'battlefield']`, four openings, enforced by `validateSettingEnvelope` (`src/data/settingClasses.ts:245`). |

---

## 2. Setting envelope, openings, and the spine

```
settings: ['stronghold', 'ruin', 'wayside', 'battlefield']
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield'])
                → castle, fort, ruins, ruined_tower, ruined_city, ruined_village,
                  unexplored_poi, camp, oasis, wilderness, battleground
```

Eleven subtypes, per `SETTING_CLASS_MAP` at `src/data/settingClasses.ts:57-66`. Excluded batch-wide: `urban`, `rural`, `sacred`, `arcane`.

Multi-class envelope ⇒ **no THR-1044 family default**; the template declares its own `supportBundle` (§ 3).

### Openings (one per declared class, ≤60 words each, `scene` field class)

**`wayside`**
> The road runs down through gorse and does not bend for a mile. Two banks pinch it narrow at the bottom, where old wheel-ruts have baked hard. Nothing else stands between here and the low sun. The wind smells of dust and hot stone, and there is no shade in an hour's walk either way.

**`ruin`**
> The road goes in through what used to be a gate and out the far side of a town nobody has swept in forty years. Fallen courses narrow it to a gap two carts wide. In the shadow of the walls the air is cold and smells of wet ash. Nothing has moved here all afternoon.

**`battlefield`**
> The ground here was fought over and never tidied. Broken shafts stand out of the turf at angles no plough would leave. The road crosses on a raised causeway with a ditch to either side, and the whole flat smells of turned earth and old iron. The wind comes across it without meeting anything.

**`stronghold`**
> The road climbs to a gate that is shut and stays shut. Whoever holds this place has decided not to know. The approach is a stair between two walls, two abreast and no wider, cold, smelling of stone and smoke long dead. There is nothing to go round, and the only road back down is the one they came up.

*(The `stronghold` closer was rewritten: it previously ran "no way round, and no way back down that is not the way up", which put four instances of *way* across the seam into a spine that opens "where the way goes narrow".)*

### The setting-neutral spine (step 0 `narrativeTemplate`, 59 words)

> A pilgrim sits where the way goes narrow, one leg straight out and wrong, still wearing the pack. They have walked on it since morning and will not walk further. Four riders are coming up, unhurried. Nothing on this road obliges them to stop, and the pilgrim does not know the traveler standing over them from any other stranger.

Names no class scenery. Introduces the cast binding role-voiced, without a token — no sentence here earns the generated name. Never genders the pilgrim: the only pronoun is *they*.

### `narrativeTemplates`

- **`initiation`** (the stake block):
  > The riders will reach the narrow place in the time it takes to walk a field. Whatever the traveler means to do about a person who cannot be moved, it has to be done before then.
- **`success`**:
  > The road behind is quiet. The pilgrim is off it, walking can wait until morning, and the traveler is still standing where they stood.
- **`failure`**:
  > The riders came through the narrow place and out the other side. What is left on the road behind them is not what was standing there.

**Seam check (opening → spine → initiation).** No opening ends on hooves or horses — the riders belong to the spine alone, so the four openings and the spine share no image. The `initiation` was rewritten: it previously restated the spine's *"nothing obliges them to stop"* as *"no reason to go around"* and reused *stranger*, in the adjacent sentence. It now adds the clock instead, which is information the spine does not carry. `narrativeTemplates.failure` owns *"came through"*; no band prose reuses it. `narrativeTemplates.success` owns *"still standing where they stood"*, and the mercy pole's base overview — the ending it co-renders with — was rewritten off that phrase.

**Known and accepted:** three of the four openings begin with the noun *road*. Only one renders per run, so no player sees the repetition; recorded rather than claimed away.

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

**The key is `survivor`, and it is a cross-encounter contract, not a local naming choice.** `encounter.border.one_body_short` binds the crossing person under exactly that key (`one-body-short-draft.md:640`) and inherits it through `inheritContext`; a key mismatch strips the token silently on the far side and every sequel callback resolves to nothing. So the key stays `survivor` even though this encounter's own prose calls them the pilgrim — the **role** is `pilgrim` (`reuseNpcRoles`, `spawnNpcRole`), the **key** is `survivor`, and the two are different things. The sequel's own spawn spec uses a different role (`mercenary`, `supportRole: 'fellow_survivor'`), which is correct: `inheritContext` copies the *binding*, not the role, so the parent's pilgrim crosses and the sequel's role is only the unbound fallback. Do not rename either half without renaming it in the sequel in the same PR.

**Class-honesty.** Of this envelope's eleven subtypes, only `wilderness` and `castle` carry a `LOCATION_ROLE_ROSTERS` entry (`src/types/npc.ts:214`) — `ruins`, `ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi`, `oasis` and `battleground` have none, and `fort` and `camp` reach a roster only indirectly through `SUBTYPE_TO_ROSTER_KEY` (`src/engine/npcSeeding.ts:49-67`, both → `military_outpost`). So reuse is only ever available at `wilderness`, where `pilgrim` sits on the roster at **0.2** (`npc.ts:324`). Everywhere else the spec materializes one, which is honest: a pilgrim is a person who is *on a road*, and finding one in a ruin, on a causeway or below a shut gate needs no explanation. Note `castle` maps to the `capital` roster rather than the `castle` one at `npcSeeding.ts`, so the roles the `castle` roster carries (`noble`, `marshal`, `guard_captain`, `guard`, `steward`, `herald`, `spy`, `attendant` — `npc.ts:326-335`) are not the ones that would bind there anyway. Either way, binding an armed household role to *the one who cannot fight* would be the "miller's boy" failure the exemplar names.

`spawnName` is a real name because a declared key always resolves (THR-696) and `{cast:survivor}` renders it when no live NPC was reused. **`must-persist`**, because the sequel inherits this binding and a `favor_creation` whose debtor is collected at scene end is not a favour.

**Never gendered.** Every sentence about the pilgrim is written around pronouns or uses *they*. The riders are gendered where the prose needs a pronoun; they do not cross into the sequel. Reuse binds whoever is standing there.

---

## 4. Steps — test panel data

| Slot | Pole | Reach | Difficulty | Word | `purposeLine` | `failBehavior` |
|---|---|---|---|---|---|---|
| 0 | *(shared — the deciding step)* | `heart` | 0.35 | `fair` | Win their trust | `continue_weakened` |
| 1 | `positive` | `gold` | 0.40 | `fair` | Talk them down | `continue_weakened` |
| 1 | `negative` | `iron` | 0.40 | `fair` | Strike first | `continue_weakened` |
| 2 | `positive` | `gold` | 0.28 | `gentle` | Make it hold | `fail_action` |
| 2 | `negative` | `iron` | 0.44 | `fair` | Finish it | `fail_action` |

**Reachability (THR-821).** `intrinsicTier: 'background'`, `rarityTier: 3` — open-draw ambient content, so every step sits at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45, `src/data/content-eval/nudgeAuthoringConstants.ts:150`). This is the open-draw branch of the rule (the Swollen Ford's branch), not the gated-audience branch.

**Why the tails differ.** The mercy pole's resolution is `gentle` (0.28) and the ruthless pole's is `fair` (0.44), and the difference is legible to the player as a word rather than a number: once four riders have agreed a price, keeping the bargain is easier than finishing a fight you started. That is the pole choice having a mechanical texture the player can *see*, not only a narrative one.

**`continue_weakened` on step 0** is load-bearing for the same reason it is on the apotheosis's threshold: `applyAgentDecidedBranches` (`src/engine/encounters/branchDecision.ts:364`) runs unconditionally at `src/engine/unifiedActionResolution.ts:1943`, before `advanceStep` at `:1950`, so the mortal is owed their answer even on a bad reading — and a stumble folds the action toward `success_at_cost`, which both poles author. A `critical_failure` at step 0 still ends the action outright — `advanceStep` forces `fail_action` on a crit-fail whatever the step declares (`src/engine/unifiedActionLifecycle.ts:177-181`) — with the pole already in choice history, which is why **both poles author a `critical_failure` band**.

### No static `factorLines` (THR-892)

None authored on any step. "The way is narrow here", "four against one", "the leg is bad" all read identically on every run and are priced into the difficulty and carried by the prose. The two authored surfaces that survive the variance rule are both used:

**`traitVariants[0].factorLine`** — see § 7.

**`carryoverFactorLines`** — keyed on the band the *previous* step rolled. Not authored on step 0 (no predecessor; the checklist rejects it). All deltas within `NUDGE_BIG_DELTA` (0.15, `nudgeAuthoringConstants.ts:175`); measured maximum |Δ| is 0.10. All 24 lines measured within the 12-word factor budget.

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

*(Factor lines are `interactive` field class, so the natural indefinites in them — `whatever`, `nothing`, `way` — are enforced-clean by `vaguenessTermsFor('interactive')`, which enforces the evasive set only. `src/data/content-eval/nudgeAuditDetectors.ts:185-190`.)*

---

## 5. The hands

**Card-type budget (from the design row):** `fellowship`, **`compulsion`**, `kindled_ambition`, `undertow`, `boost` (≤2 per hand), `mercy`, **`signature`**. `compulsion` and `signature` are two of the eight zero-use library types; this is their content debut.

**`libraryCardId` discipline.** Every card whose (type, sphere) pair matches a `NUDGE_CARD_LIBRARY` member sets `libraryCardId` **and carries that member's authored `title` and `quote` verbatim** — the library face *is* the card's face, and two faces on one id would defeat the tally the batch brief is trying to feed. `effectLine` stays per-instance (the library has no such field, and magnitude and target differ per hand). All six members used, and both fields on each, were checked character-for-character against `src/data/nudge-card-library.ts`:

| Member | Line | `title` | `quote` |
|---|---|---|---|
| `card.boost.core` | `:557` | A Little More | Most things fail by a margin. |
| `card.mercy.core` | `:565` | Not The Worst | Failing is survivable. Some failures are not. |
| `card.undertow.signature.darkness` | `:599` | The Easier Way | It works. That is the problem. |
| `card.boost.signature.energy` | `:611` | A Sudden Surge | Bodies hold more than they admit. |
| `card.compulsion.signature.mind` | `:619` | An Urge In Sleep | By morning it feels like their own idea. |
| `card.kindled_ambition.signature.spirit` | `:623` | Something To Want | A life turns on what it reaches for. |

**Finding to report: two of the seven budgeted types have no library member at all.** `NUDGE_CARD_LIBRARY` is generated (`nudge-card-library.ts:731-740`) from four tables — 4 core + 15 sphere signatures + 12 hunger uniques + 6 hand-written variations = **37 members**.

- **`fellowship`** — `SPHERE_SIGNATURES` signs no sphere with `fellowship`, it is not in `UNIVERSAL_CORE_TYPES` (`:274-279`, which is boost/insurance/mercy/trait_card), and no hunger unique or variation member carries `typeId: 'fellowship'`.
- **`signature`** — the naming `card.<typeId>.signature.<sphere>` refers to a *signature member of another family* (`card.omen.signature.time` is an Omen), so **no member carries `typeId: 'signature'`**. The Signature *type* — "keyed to the god's spheres, discounted in-sphere" — has zero members.

Both types are live `NudgeCardTypeId` members with `NUDGE_CARD_TYPES` entries (`:47`, `:61`; `id:` at `:128`, `:240`); they simply appear in none of the four generating tables. So they are authored as **one-offs, recorded here**, not as a default. Two further one-offs sign spheres the library does not cover for their type (a `matter` Boost, a `time` Signature). **Nine one-off cards, all forced, none discretionary.**

**Note on `libraryCardId` as a gate.** Setting the field gates the card behind the god's unlocked repertoire (`nudges.ts`). Every member used here is `unlock: { kind: 'starting' }` (core via `coreMember`, `:379-381`; signatures via `signatureMember`, `:383-390`); the milestone (`card.boost.variation.patient`, `card.insurance.variation.shared`), god-trait (`card.mercy.variation.witnessed`) and attunement members are deliberately avoided, and so are the twelve hunger uniques — a hunger unique is held by exactly one god per run, which would make the hand shrink for everyone else.

**Open question for Pass 3 — the four Signature one-offs.** Every Signature effect line opens *"Where you hold force / light / time…"*, which is the type's own promise (keyed to the god's spheres, discounted in-sphere). The card carries a `sphere` and a flat essence cost. Confirm the deal path gates a sphere-bearing card on the god actually holding that sphere; if it does not, either the gate is added or the *"Where you hold …"* framing comes off the four faces. A face that promises a condition the data does not check is the live-layer trap.

---

### 5.1 Step 0 hand — `heart`, "Win their trust"

**The question this hand answers:** *which way does this go, and can a stranger be believed in the next two minutes?*

Seven cards, seven distinct library types. Five spheres plus two ungated common options. One rider. **Four `poleLean` cards, two per direction, all at `POLE_LEAN_DEFAULT_WEIGHT`** — the god has a real lever on direction as well as on cleanliness, and the two levers are the same size.

Sum `forecastDelta` = **0.58** (under `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70, `nudgeAuthoringConstants.ts:73`); difficulty 0.35 + 0.58 = 0.93, inside [0, 1].

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

**3 · `line.s0.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.09** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' }`

- **name** `Something To Want`
- **effectLine** — "You give them a thing to want out of this that is larger than getting through it. A real help, and it leans them toward mercy."
- **fiction** — *"A life turns on what it reaches for."*
- **bandProse**
  - `critical_success` — "They wanted this to end well, and wanting it made them convincing."
  - `near_miss` — "The wanting was real and arrived a beat after it would have mattered."

**4 · `line.s0.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.14** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' }` · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`

- **name** `The Easier Way`
- **effectLine** — "You surface the shorter, uglier answer and make it feel obvious, so it arrives before the patient one does. A strong help, it leans them toward the ruthless answer, and it moves them that way for good."
- **fiction** — *"It works. That is the problem."*
- **bandProse**
  - `success` — "The short answer arrived first and got itself said before the long one could."
  - `critical_failure` — "The short answer was the only one left in them, and it came out at the wrong person."

**5 · `line.s0.weight_behind_it`** — Type: **Signature** (one-off — no `signature`-typed library member exists) · sphere `force` · `imageTag: 'generic.strength'` · essence **2** · Δ **0.08** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' }`

- **name** `Weight Behind It`
- **effectLine** — "Where you hold force, the ground and the air answer to you first: things feel heavier, closer, more decidable by hand. A real help, and it leans them toward the ruthless answer."
- **fiction** — *"Some gods are felt before they are heard."*
- **bandProse**
  - `success_at_cost` — "Everything felt solvable by hand, and they said a harder thing than they meant to."
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
- **effectLine** — "You put a floor under it so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- **fiction** — *"Failing is survivable. Some failures are not."*
- **bandProse** *(the rider erases `critical_failure` while active, so the reachable failure textures are these two)*
  - `near_miss` — "It went badly and stopped there, which was the whole purchase."
  - `failure` — "It came apart, and a floor under it kept the pieces small."

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
| Big-delta (≥0.15) both failure bands | none at or above 0.15 (max 0.14) ✓ |
| No two cards answer the same question | nerve · a planted want · a larger want · the short answer · the felt weight of a god · the company · the floor ✓ |
| ≥3 `poleLean`, both directions | 4 — positive: 2, 3 · negative: 4, 5 ✓ |
| Zero-essence non-trait card | none — every card costs 1–3 essence ✓ |
| No digits in any `effectLine` | ✓ |
| Zero evasive-vagueness term on any face | ✓ (card 7's `the moment` removed — a nominalised placeholder, banned in every field class) |
| Zero scene-bespoke prose on any face | ✓ (card 4's *"the road is clear if nobody is left on it"* removed) |

**On the lean arithmetic.** All four leaning cards take `POLE_LEAN_DEFAULT_WEIGHT` (0.35, `nudge-constants.ts:233`), so each side of the argument tops out at **0.70** and the two levers are exactly matched. Two consequences worth stating, because both are the design:

1. **A single leaning card outweighs a mortal sitting anywhere inside ±0.35 on the axis.** The god's hand is a real lever on direction, not a tiebreaker — a committed god can turn a mildly-inclined mortal, and cannot turn a convinced one.
2. **Playing one card from each side cancels exactly, for every pairing.** Arguing both ways is arguing for nothing, and the mortal answers as themselves. That is only true because the weights are equal; an earlier draft carried 0.2 on card 3 and 0.4 on card 4, which made the ruthless lever 36% stronger than the merciful one and made this sentence false for three of the four pairings.

---

<!--REVISED-PART-2-->
