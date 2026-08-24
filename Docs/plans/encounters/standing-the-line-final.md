# Encounter Pipeline: Standing the Line
> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: final
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory line)
> templateId: `encounter.border.standing_the_line` | Batch: border-perils (THR-1221)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Fate-branching Personality Fork + Seeded Sequel parent — the batch's most complex encounter, and the batch's content debut for `poleLean`, `compulsion`, and `signature`. |
| Editorial | PASS WITH REVISIONS | 8 REVISE triggers repaired inline (26 vagueness hits, 3 scene-bespoke faces, 5 setting-envelope leaks, 21 seam echoes, 2 design-block breaches, symmetric `poleLean` weights, `concepts` on all 21 chip instances, 2 false source citations). Two items handed forward as blocking: § 8.0 (where the pole-invariant writes live) and § 9.5 (the parent's target contract). |
| Systems | READY WITH CAVEATS | Both blockers resolved (see below); Composition Contract passes every block; consequence draw, fork mechanics, all five hands (one machine-checked, four hand-checked), and every id verified against live source, not citation. |

### Caveats

1. **Aftermath-effect wiring ships as authored (reaction-backed, §§ 8.1–8.3 below), unchanged.** It is correct, Law-56-compliant, and reachability-safe as written. It does not yet satisfy the batch's newly-adopted "never reaction-backed" standing rule — the primitive that would let it (a per-`StepOutcome`-band automatic step-effects field) does not exist today. Filed as a **BUILD NOW** Deferral against the batch project (small, additive, ~half a day — full spec in `standing-the-line-systems.md` § 1.6). The `critical_failure` band's own writes have a second, independent complication (reachable via three structurally different truncation paths with three different sets of steps executed) that even the primitive alone will not solve without a further pole-neutral content decision authored redundantly across steps 0–2. **None of this blocks implementing the encounter as authored.**
2. **The parent's target is the location, not the survivor — resolved against § 9.5's own hope, not in its favor.** Traced independently for both the normal-play candidate-targeting path and the `?spawn=` debug path: neither offers any mechanism for a self-triggered `intrinsicTier: 'background'` encounter to target its own `supportBundle`-materialized actor. § 14's "target: the agent bound under cast key `survivor`" line is struck — there is no field to author it into. **Consequence for the sequel** (not this file's to fix): `encounter.border.one_body_short`'s `secret_discovery` will refuse to write on every firing of the seeded route, because `inheritContext` copies a location `targetId`. The sequel must swap its `secret` family to `hidden_mark` (`targetAgentId: '$cast:survivor'`) — flagged here for batch coordination.
3. **`?spawn=encounter.border.standing_the_line` carries no mistargeting exposure of its own** — every chip and write in this packet resolves through `$actor`/`$cast:survivor`, neither of which reads `action.targetId`. The exposure lives entirely on the sequel's side (caveat 2).

### Editorial Notes Summary

Seven automatic REVISE triggers plus one hard `check:encounter` block fired against the draft, all repaired inline in the revised packet below: 26 vagueness-detector hits (re-scanned against the detector *code's* field classes, which invert the spec page's stated classes — `overview` is `scene`, `change.detail` is `outcome`); 3 scene-bespoke card faces; 5 setting-envelope leaks (gorse/bank/ditch/climb bleeding below the four-class opening); 21 seam echoes (19 of them *inside a single ending* — a seam class the trigger's "paragraph boundary" wording does not describe, found only by reading every ending's full render order); 2 design-block breaches (`positive.critical_success` contradicted the two steps that produce it; `negative.failure` denied making a count its own hidden mark claims was made); the mercy pole's seed band set corrected so the sequel's "dead lie where they fell" premise is reachable from both poles (was reachable from neither of the drafted mercy-pole bands); symmetric `poleLean` weights (the draft's explicit weights made the ruthless lever 36% stronger and its own arithmetic note misreported this as balance); `concepts` authored on all 21 chip instances (the draft claimed PASS while authoring it on zero); 2 false source citations and 2 wrong numbers corrected, every remaining source claim carrying a `file:line`. Full detail in `standing-the-line-editorial.md`.

### Implementation File Map

- **`src/data/encounters/standing-the-line.ts`** (new) — the `STANDING_THE_LINE_TEMPLATE`, following `apotheosis-ascension.ts`'s `ActionStepBranch` + `decidedBy` pole-mode shape (the only other live example of this pattern): one plain step (0), two `ActionStepBranch` nodes (steps 1, 2) each with `positive`/`negative` variants and a `fallback`, `aftermathConfig` with `branchOnStep: 0` and `byOutcome` overrides on both variants, `supportBundle`, `consequenceDraw`, eleven `imageTag`s, `locationSubtypes` via `expandSettings(...)`, wrapped in `compileOpeningEnvelope(...)`.
- **`src/data/unified-action-templates.ts`** — one import near line 193, one entry in the array feeding `UNIFIED_ACTION_TEMPLATES` (~5590 region), one entry in `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678 region) — line numbers independently re-verified current in this pass.
- **`src/data/content-eval/plotHooks.ts`** — stamp `usedBy` on `standing_the_line` at closeout.
- **No engine changes required to ship this template.** Every effect kind, sentinel, and mechanism it uses is already live.
- **Separate prerequisite (not blocking, filed independently):** `src/types/unifiedAction.ts` + `src/engine/unifiedActionResolution.ts` for the § 1.6 primitive (per-`StepOutcome`-band automatic step effects), if the batch wants this packet's writes to stop being reaction-backed.
- **Test coverage:** a template-shape test alongside the corpus convention (`src/data/encounters/__tests__/`); the standing 30-tick CLI smoke once registered.
- **Sequel coordination:** `one-body-short-*` swaps `secret_discovery` → `hidden_mark` for its `secret` family — this file's target declaration is what makes that necessary; not a change to this file.

Full audit: `standing-the-line-systems.md`.

---

## Encounter Packet

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
  > Four riders went up that road and four riders went on. What is left behind them is not what was standing there.

**Seam check (opening → spine → initiation).** No opening ends on hooves or horses — the riders belong to the spine alone, so the four openings and the spine share no image. The `initiation` was rewritten: it previously restated the spine's *"nothing obliges them to stop"* as *"no reason to go around"* and reused *stranger*, in the adjacent sentence. It now adds the clock instead, which is information the spine does not carry. `narrativeTemplates.success` owns *"still standing where they stood"*, and the mercy pole's base overview — the ending it co-renders with — was rewritten off that phrase. `narrativeTemplates.failure` was rewritten off *"came through the narrow place"*, which the mercy pole's `failure` overview and the ruthless pole's `critical_failure` overview both land beside.

**The seam audit that matters here is § 6.5, not this one.** Opening→spine is one seam per run. The seams that actually reach a player in this encounter are the ones *inside a single ending*, where a step afterimage, up to seven card fragments, a `narrativeTemplates` line, an `overview` and two or three chips arrive together and in order. With five hands and ten endings this packet's surface for that class is several times any linear encounter's, and every echo found in this pass was found there. Enumerated per pole in § 6.5.

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
| `critical_success` | The price was agreed on both sides, and nobody has moved off it. | for | +0.07 |
| `success` | A price stands. It is only a matter of handing it over. | for | +0.05 |
| `success_at_cost` | The price stands, and one of them is still counting it. | against | −0.03 |
| `near_miss` | They agreed to nothing and did not ride on either. | against | −0.05 |
| `failure` | They heard it all out and agreed to none of it. | against | −0.07 |
| `critical_failure` | They were insulted by it and have not let it go. | against | −0.10 |

*(Three of these six were rewritten. Each rendered on the step-2 panel directly beside the step-1 afterimage it restated — "They named a price and the riders named it back" against "The lead rider heard the price … and named it back"; "The talking is over" against "They let the talking finish"; "The offer insulted them" against "The offer told them exactly how much there was to take". A carryover line and the afterimage it keys off are the tightest seam in the encounter and the one nobody checks, because they are authored in different sections.)*

**Step 2, `negative` pole** (keys off step 1's `iron` outcome):

| Prior band | Line | Polarity | Δ |
|---|---|---|---|
| `critical_success` | The first two are out of it, and the rest know it. | for | +0.07 |
| `success` | The first exchange went the traveler's way, and they know it. | for | +0.05 |
| `success_at_cost` | The opening blow went home and cost more than it bought. | against | −0.03 |
| `near_miss` | The strike went in late, and they are turned around now. | against | −0.05 |
| `failure` | They were ready, and are coming on with their blood up. | against | −0.08 |
| `critical_failure` | The traveler is on the ground and the road is theirs. | against | −0.10 |

*(Same three-seam repair as the mercy pole: "Two went down before anyone drew" restated the step-1 afterimage "Two were down before the third had the reins gathered"; "The first blow landed" restated "It landed"; "They saw it coming" restated "They had seen it coming from further off than anyone thought". All three pairs render on the same panel.)*

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
  - `success` — "Level was enough. The pilgrim listened instead of talking."
  - `near_miss` — "The voice held steady all the way through. It ran out of time, not nerve."

**2 · `line.s0.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.08** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' }`

- **name** `An Urge In Sleep`
- **effectLine** — "You put a want under their thinking where they will not find the edge of it, and it is a want to bring everyone out of this. A real help, and it leans them toward mercy."
- **fiction** — *"By morning it feels like their own idea."*
- **bandProse**
  - `success_at_cost` — "The want held all the way through, and it cost them the answer they had ready."
  - `failure` — "The urge was there and so was the fear, and the fear was louder."

**3 · `line.s0.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.09** · `poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' }`

- **name** `Something To Want`
- **effectLine** — "You give them a thing to want out of this that is larger than getting through it. A real help, and it leans them toward mercy."
- **fiction** — *"A life turns on what it reaches for."*
- **bandProse**
  - `critical_success` — "They wanted this to end well, and wanting it made them convincing."
  - `near_miss` — "The wanting was real, and the leg was realer."

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
  - `success_at_cost` — "Everything felt solvable by hand, and their hand moved before their mouth did."
  - `failure` — "The world went heavy and stayed heavy, and heavy is not the same as simple."

**6 · `line.s0.one_rope_many_hands`** — Type: **Fellowship** (one-off — the type has no library member) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.09** · no lean

- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you tighten what the group already has, so nobody has to be persuaded twice. A real help, and it argues for neither answer."
- **fiction** — *"A company decides faster than a person does."*
- **bandProse**
  - `critical_success` — "The company moved as one, and the pilgrim believed the company before the person."
  - `near_miss` — "The company spoke with one voice, and the pilgrim had already decided not to hear it."

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
| No two fragments converge **within one band** (§ 6.5) | ✓ after repair. `near_miss` is the hazard band here — four cards author it and all four can be active at once, and three of the four originally landed on *running out of time* ("ran out of time" · "arrived a beat after it would have mattered" · "one mind short of enough time"). Cards 3 and 6 rewritten off the clock. |

**On the lean arithmetic.** All four leaning cards take `POLE_LEAN_DEFAULT_WEIGHT` (0.35, `nudge-constants.ts:233`), so each side of the argument tops out at **0.70** and the two levers are exactly matched. Two consequences worth stating, because both are the design:

1. **A single leaning card outweighs a mortal sitting anywhere inside ±0.35 on the axis.** The god's hand is a real lever on direction, not a tiebreaker — a committed god can turn a mildly-inclined mortal, and cannot turn a convinced one.
2. **Playing one card from each side cancels exactly, for every pairing.** Arguing both ways is arguing for nothing, and the mortal answers as themselves. That is only true because the weights are equal; an earlier draft carried 0.2 on card 3 and 0.4 on card 4, which made the ruthless lever 36% stronger than the merciful one and made this sentence false for three of the four pairings.

---

### 5.2 Step 1 hand — `positive` pole, `gold`, "Talk them down"

**The question this hand answers:** *can the offer land, and what does landing it cost the person making it?* — a different question from step 0's (*which way, and can they be believed*) and from step 2's (*will it survive being paid*).

Five cards. Four spheres plus one ungated common. One rider. Sum Δ = **0.46**; 0.40 + 0.46 = 0.86 ✓.

**1 · `line.s1a.not_the_worst`** — Type: **Mercy** · `libraryCardId: 'card.mercy.core'` · common, ungated · rider `no_crit_fail` · `imageTag: 'generic.mercy'` · essence **3** · Δ **0.04**
- **name** `Not The Worst` · **fiction** *"Failing is survivable. Some failures are not."*
- **effectLine** — "You put a floor under it so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- `near_miss` — "No price was agreed and no blade came out, and the second half of that was bought."
- `failure` — "It went wrong and stayed ordinary, which was the ceiling on how wrong it could go."

**2 · `line.s1a.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.11**
- **name** `Something To Want` · **fiction** *"A life turns on what it reaches for."*
- **effectLine** — "You wake an appetite in the ones being talked to for what they cannot get here, so staying stops being worth their while. A real help."
- `critical_success` — "They were already thinking about somewhere else, and somewhere else won."
- `near_miss` — "A road further on had their attention. Not enough of it, and not yet."

**3 · `line.s1a.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.15** *(big delta — both failure bands owed)* · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You put a threat behind the offer that nobody has to say out loud. A strong help, and it moves the one making the offer toward the ruthless end for good."
- `success` — "The offer was taken. What stood behind the offer was what got taken seriously."
- `failure` — "The threat got heard without being said, and being threatened made the price an insult."
- `critical_failure` — "They heard the threat, believed it, and decided to answer it now rather than later."

**4 · `line.s1a.made_plain`** — Type: **Signature** (one-off) · sphere `light` · `imageTag: 'generic.light'` · essence **2** · Δ **0.09**
- **name** `Made Plain`
- **effectLine** — "Where you hold light, you decide what is easy to see: you put a clean edge on what is being offered so it reads as worth taking. A real help."
- **fiction** — *"Half of worth is what the light does to it."*
- `success_at_cost` — "It all looked better than it was, and they took a little extra for the trouble of looking."
- `near_miss` — "It looked worth having right up until somebody picked it up."

**5 · `line.s1a.sound_goods`** — Type: **Boost** (one-off — the library signs no `matter` Boost) · sphere `matter` · `imageTag: 'generic.matter'` · essence **1** · Δ **0.07**
- **name** `Sound Goods`
- **effectLine** — "Where you hold matter, you can make a thing be what it looks like — the seams tight, the metal true, the weight right in the hand. A small help."
- **fiction** — *"A good object argues for itself."*
- `success` — "The goods were exactly what they looked like, and nobody needed a second look at them."
- `failure` — "The goods were sound. The goods were never the argument."

**Hand audit.** 5 cards ✓ · spheres spirit, darkness, light, matter = 4 ✓ · commons 1 ✓ · riders 1 ✓ · Boost 1 ✓ · types Mercy/Kindled ambition/Undertow/Signature/Boost = 5 ✓ · bands: `critical_success` 2 · `success` 3, 5 · `success_at_cost` 4 · `near_miss` 1, 2, 4 · `failure` 1, 3, 5 · `critical_failure` 3 ✓ · every card has a failure fragment ✓ · big-delta card 3 has both `failure` and `critical_failure` ✓ · no digits ✓ · zero evasive terms on any face (card 1's `the moment` and card 2's `something` removed) ✓ · zero scene-bespoke prose (card 2's *"something this road cannot give them, and a road they are done with is a road they will leave"* removed) ✓ · no two fragments converge within one band ✓ (cards 3 and 5 both author `success`; card 5's was rewritten off *"closed the argument"*, which sat beside card 3's *"got taken seriously"*).

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
- `critical_success` — "The body gave everything at once and had nothing left afterward, because there was no afterward."
- `failure` — "Everything went into it, and it went into the wrong man."

*(Two Boosts is the cap, and they buy different certainties: the first buys **when** it happens, the second buys **how hard**. Same verb, different physics — the exemplar's precedent.)*

**3 · `line.s1b.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.10**
- **name** `An Urge In Sleep` · **fiction** *"By morning it feels like their own idea."*
- **effectLine** — "You put an urge in the ones about to be hit — to check a strap, to look the other way, to be a moment behind. A real help."
- `success_at_cost` — "Two of them were looking at the wrong thing, and the third was not."
- `near_miss` — "Everyone looked away at once, which men on a road notice."

**4 · `line.s1b.one_rope_many_hands`** — Type: **Fellowship** (one-off) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.12**
- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you set an order under the group so everyone moves on the same count without being told. A real help."
- **fiction** — *"A company decides faster than a person does."*
- `critical_success` — "They went in on one count, and one count is what four scattered riders cannot answer."
- `failure` — "Everyone moved together, into the same wrong place, at the same time."

**5 · `line.s1b.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.15** *(big delta)* · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You take the hesitation out — the half-beat where a person checks whether this is necessary. A strong help, and it moves them toward the ruthless end for good."
- `success` — "They never asked whether this was necessary, and not asking is what made it fast."
- `failure` — "There was no hesitation and no advantage in having none."
- `critical_failure` — "They went in without the pause that would have told them how many there were."

**Hand audit.** 5 cards ✓ · spheres energy, mind, order, darkness = 4 ✓ · commons 1 ✓ · riders 0 ✓ · Boost 2 (at cap) ✓ · types Boost/Compulsion/Fellowship/Undertow = 4 ✓ · bands: `critical_success` 2, 4 · `success` 1, 5 · `success_at_cost` 3 · `near_miss` 1, 3 · `failure` 2, 4, 5 · `critical_failure` 5 ✓ · every card has a failure fragment ✓ · big-delta card 5 has both ✓ · no digits ✓ · zero evasive terms, zero scene-bespoke prose ✓ · no two fragments converge within one band ✓ (three cards author `failure`; card 2's was rewritten off *"everything was not the problem"*, which sat beside card 5's *"no advantage in having none"* — two negation-shaped closers on one band).

**Dealt size.** The Fellowship hides for a lone traveler, so a solo agent is dealt four — the floor, and the dealt-size doctrine.

---

### 5.4 Step 2 hand — `positive` pole, `gold`, "Make it hold"

**The question this hand answers:** *will the bargain survive being paid?* Nothing here buys the offer landing — that already happened — and nothing buys direction; the fork is spent.

Five cards. Four spheres plus one ungated common. No rider. Sum Δ = **0.43**; 0.28 + 0.43 = 0.71 ✓.

**1 · `line.s2a.a_little_more`** — Type: **Boost** · `libraryCardId: 'card.boost.core'` · common, ungated · `imageTag: 'generic.focus'` · essence **1** · Δ **0.06**
- **name** `A Little More` · **fiction** *"Most things fail by a margin."*
- **effectLine** — "You keep the hands from shaking through the part where nothing can be taken back. A small help."
- `success` — "The hands stayed steady, and steady hands are most of what a handover is."
- `near_miss` — "The hands never shook. The counting did."

**2 · `line.s2a.an_urge_in_sleep`** — Type: **Compulsion** · `libraryCardId: 'card.compulsion.signature.mind'` · sphere `mind` · `imageTag: 'generic.memory'` · essence **2** · Δ **0.10**
- **name** `An Urge In Sleep` · **fiction** *"By morning it feels like their own idea."*
- **effectLine** — "You leave a wish to be done with this under the thinking of everyone holding a weapon. A real help."
- `critical_success` — "Every one of them wanted to be somewhere else, and men who want to leave leave fast."
- `failure` — "One of them was in no hurry at all, and the others waited to see what he would do."

**3 · `line.s2a.something_to_want`** — Type: **Kindled ambition** · `libraryCardId: 'card.kindled_ambition.signature.spirit'` · sphere `spirit` · `imageTag: 'generic.blessing'` · essence **2** · Δ **0.09**
- **name** `Something To Want` · **fiction** *"A life turns on what it reaches for."*
- **effectLine** — "You give one of them a reason to be the sort of person who keeps a bargain. A real help."
- `success_at_cost` — "One of them held the others to it, and made sure everyone saw who had."
- `near_miss` — "Somebody wanted to be better than this and was outvoted."

**4 · `line.s2a.not_the_first_time`** — Type: **Signature** (one-off) · sphere `time` · `imageTag: 'generic.time-slow'` · essence **2** · Δ **0.08**
- **name** `Not The First Time`
- **effectLine** — "Where you hold time, a moment can be made to feel worn: this has happened before, it went the ordinary way, and it will go that way again. A real help."
- **fiction** — *"Nothing happens only once."*
- `success` — "It felt like a job they had done before, and they did it the same as they did it then."
- `critical_failure` — "It felt familiar, and what it reminded them of was a time somebody had cheated them."

**5 · `line.s2a.one_rope_many_hands`** — Type: **Fellowship** (one-off) · sphere `order` · `requiresGroup: true` · `imageTag: 'generic.oath'` · essence **2** · Δ **0.10**
- **name** `One Rope, Many Hands`
- **effectLine** — "Only in company: you hold the group's own order steady so nobody in it moves before they are meant to. A real help."
- **fiction** — *"A company decides faster than a person does."*
- `critical_success` — "Nobody on either side moved early, and nobody had to be told not to."
- `failure` — "Somebody at the back of the company moved, and it was read as the start of a fight."

**Hand audit.** 5 cards ✓ · spheres mind, spirit, time, order = 4 ✓ · commons 1 ✓ · riders 0 ✓ · Boost 1 ✓ · types Boost/Compulsion/Kindled ambition/Signature/Fellowship = 5 ✓ · bands: `critical_success` 2, 5 · `success` 1, 4 · `success_at_cost` 3 · `near_miss` 1, 3 · `failure` 2, 5 · `critical_failure` 4 ✓ · every card has a failure fragment ✓ · no big-delta card ✓ · no digits ✓ · zero evasive terms ✓ · zero scene-bespoke prose (card 5's *"while the goods change hands, so nobody moves before the count is done"* removed — it was this scene's step 2 written onto a library face) ✓ · no two fragments converge within one band ✓.

*(Three fragments in this hand were rewritten for cross-step seams rather than in-band ones: card 2's `critical_success` restated step 0's *"wanting it made them convincing"* — the same library card, two steps apart, both reachable in one run; card 4's `success` carried `thing` and `way` in outcome prose; card 1's `near_miss` restated step 1's afterimage *"all the way to the end of it"*.)*

---

### 5.5 Step 2 hand — `negative` pole, `iron`, "Finish it"

**The question this hand answers:** *does it end here, or does it follow them?*

Five cards. Four spheres plus one ungated common. One rider. Sum Δ = **0.47**; 0.44 + 0.47 = 0.91 ✓.

**1 · `line.s2b.not_the_worst`** — Type: **Mercy** · `libraryCardId: 'card.mercy.core'` · common, ungated · rider `no_crit_fail` · `imageTag: 'generic.mercy'` · essence **3** · Δ **0.04**
- **name** `Not The Worst` · **fiction** *"Failing is survivable. Some failures are not."*
- **effectLine** — "You put a floor under it so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table."
- `near_miss` — "It ended badly and stopped ending, which was the purchase."
- `failure` — "It went wrong, and a floor under it held how far wrong it was allowed to go."

**2 · `line.s2b.the_easier_way`** — Type: **Undertow** · `libraryCardId: 'card.undertow.signature.darkness'` · sphere `darkness` · `imageTag: 'generic.dark'` · essence **2** · Δ **0.13** · `valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' }`
- **name** `The Easier Way` · **fiction** *"It works. That is the problem."*
- **effectLine** — "You take away the instinct to stop once someone is down. A strong help, and it moves them toward the ruthless end for good."
- `success` — "The instinct to stop never arrived, and it was over while the others were still deciding."
- `critical_failure` — "Stopping never occurred to them, and neither did looking behind them."

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

**Hand audit.** 5 cards ✓ · spheres darkness, energy, force, spirit = 4 ✓ · commons 1 ✓ · riders 1 ✓ · Boost 1 ✓ · types Mercy/Undertow/Boost/Signature/Kindled ambition = 5 ✓ · bands: `critical_success` 3 · `success` 2, 5 · `success_at_cost` 4 · `near_miss` 1, 3, 5 · `failure` 1, 4 · `critical_failure` 2 ✓ · every card has a failure fragment ✓ · no big-delta card ✓ · no digits ✓ · zero evasive terms (card 1's `the moment` and `something under it` removed) ✓ · zero scene-bespoke prose ✓ · no two fragments converge within one band ✓.

*(Card 2's two fragments both opened `Nothing in them …` in the draft — the same construction twice on one card, and the `success` one also restated `line.s1b.the_easier_way`'s `success` on the immediately preceding step. Both rewritten.)*

**Card-type spend across the encounter:** boost 7 · mercy 3 · compulsion 3 · kindled_ambition 4 · undertow 4 · signature 4 · fellowship 3 = **27 cards, 7 types, none outside the budget.** `libraryCardId` set on **18 of 27**; the nine one-offs are the two typeless types (7 cards: fellowship ×3, signature ×4) and two sphere gaps (a `matter` Boost, a `time` Signature), each forced and recorded above. Card ids were aligned to card names in four places (`full_weight_of_you` → `weight_behind_it`, `plain_sight` → `made_plain`, `a_thing_worth_having` → `sound_goods`, `this_has_happened` → `not_the_first_time`), because a library retrofit will key on one of the two and a divergence is a trap laid for it.

**Anti-convergence against the sequel (trigger 21).** `encounter.border.one_body_short` budgets `whisper` / `omen` / `long_game` / `boost` / `trait_card`. The two hands share `boost` and nothing else. No two encounters in this family have the same card-type composition.

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
| `success_at_cost` | It landed, and a blade came back the other way at the same time. |
| `failure` | They had seen it coming from further off than anyone thought. |
| `critical_failure` | The traveler went in at four men and found out how many four is. |

### Step 2 — `positive`, `gold`, "Make it hold"

| Band | Afterimage |
|---|---|
| `critical_success` | They counted it once, and one of them said a word that was almost civil. |
| `success` | The goods changed hands. Nobody touched anybody, and nobody said much. |
| `success_at_cost` | They took the price, and then stood there deciding whether it was all of it. |
| `failure` | Halfway through the counting somebody decided the whole pile was already theirs. |
| `critical_failure` | The bargain came apart in the counting, and it came apart fast. |

### Step 2 — `negative`, `iron`, "Finish it"

| Band | Afterimage |
|---|---|
| `critical_success` | It stopped because they stopped it, and the road was empty inside a minute. |
| `success` | Nobody on the ground was going to get up, and the ones still mounted knew it. |
| `success_at_cost` | It ended. What it cost came out of the traveler and not out of anybody else. |
| `failure` | Nobody finished it. It stopped because both sides had had enough of it. |
| `critical_failure` | It ended with the traveler on the ground and the road belonging to somebody else. |

**Seven of these twenty-five were rewritten**, all for the same class of defect: each restated the aftermath `overview` that renders directly beneath it, or the carryover line that renders directly beside it. See § 6.5.

---

## 6.5 The in-ending seam audit

**This is the seam class that matters in a forked encounter, and it is not the one the trigger's wording describes.** REVISE trigger 22 says "across a paragraph boundary", which reads as the opening→spine and spine→band seams every draft in this batch checked. But a single ending in this encounter delivers, in order and seconds apart:

> step-0 afterimage → up to 4 step-0 card fragments → step-1 afterimage → up to 3 step-1 fragments → the step-2 carryover factor line → step-2 afterimage → up to 3 step-2 fragments → `narrativeTemplates.success`/`.failure` → the band `overview` → 1–3 chips (`title` · `causeClause` · `detail`) → 1–2 reaction labels and intents

Twenty-plus authored strings, one screen, one read. **Every echo found in this pass was found there**, and none of them was visible from the seam check the draft ran. Five hands and ten endings put this packet's surface for the class several times above any linear encounter's — and it sits on top of the gate blind spot in § 0, so nothing but this read will catch it.

Seams enumerated, per pole:

| Seam | Checked | Found | Repaired |
|---|---|---|---|
| **card fragment → card fragment**, same band, both active | all 30 multi-card bands across 5 hands | 3 — step-0 `near_miss` (three of four cards on *running out of time*), s1b `failure` (two negation-shaped closers), s1a `success` (two "closed the argument" beats) | ✓ |
| **card fragment → card fragment**, same library card, consecutive steps | 6 repeated faces across pole paths | 2 — `the_easier_way` s1b→s2b (`Nothing in them …` twice), `something_to_want` s0→s2a (*wanting it made them …* twice) | ✓ |
| **step afterimage → carryover line** on the next step's panel | 12 pairs (6 bands × 2 poles) | 6 — three per pole, listed under § 4's tables | ✓ |
| **base band text → card fragment** on the same band | all 25 afterimages against their hands | 2 — step-0 `success` (*stopped asking why* / *stopped arguing*), step-0 `success_at_cost` (*the arguing* / *the argument*) | ✓ |
| **step-2 afterimage → band `overview`** | 10 pairs | 5 — `positive` crit-success / success / success-at-cost, `negative` success / failure | ✓ |
| **`narrativeTemplates` line → `overview`** | 2 lines × the bands each reaches | 2 — `.success` (*still standing where they stood*), `.failure` (*came through the narrow place*) | ✓ |
| **chip → chip** within one band (`title`, `causeClause`, `detail`) | all 21 chip instances | 1 — the base `causeClause` *"They stood in the road until the riders had gone past"* inherited onto `positive.failure`, where the traveler was put down rather than left standing. Per-band `causeClause` authored. | ✓ |
| **pole → pole**, equivalent bands | 5 pairs | 0 echoes. Two deliberate mirrors kept and recorded below. | n/a |
| **opening → spine → initiation** (the one the draft checked) | 4 + 1 | 2 — `stronghold` closer (*way* ×4 across the seam), `initiation` (restated the spine) | ✓ |

**21 echoes, of which 19 sat inside a single ending.** The draft's own echo check found none of them, and it was not a careless check — it was a check of the wrong seams.

**Two pole→pole mirrors kept deliberately.** The poles' `critical_failure` overviews both end on the pilgrim: on the mercy pole the place beside the road is empty, on the ruthless pole there is still somebody sitting in it. Taken versus spared, same sentence position, opposite fact. And both poles' worst bands carry the same single reaction, *"Let them lie until the light"*, with different `intent` lines. Neither pair ever co-renders — a run walks one pole — so these are contrast between playthroughs, which is what a fork is for.

**One accepted repetition.** Three of the four openings begin with the noun *road*. Only one renders per run. Recorded rather than claimed away.

---

## 6.6 Field classes — corrected against the detector code

The spec page and `nudgeAuditDetectors.ts` disagree, and **the code is the contract**. `pushAftermathVariant` (`:377-398`) assigns:

| Field | Class per the code | Enforced |
|---|---|---|
| `overview` | **`scene`** | evasive only |
| `change.detail` | **`outcome`** | evasive **and** natural indefinites |
| `change.title` | `interactive` | evasive only |
| `reactionPrompt`, `reaction.label`, `reaction.intent` | `interactive` | evasive only |
| `causeClause` | *not swept at all* | — |

The doc comment at `:345-375` explains it and the reasoning is sound: `change.detail` **is** the only statement of its consequence, so an indefinite there withholds something the player has no other source for; `overview` sits directly above chips that name every consequence explicitly and typed, so the player has another source and an indefinite is ordinary English. It is measured, not asserted — reading `overview` as `outcome` across 295 templates flags 165 fields on indefinites against 57 genuinely evasive, and in the director-reviewed slice every one of those 165 is prose like *"Nothing was promised. Nothing was taken."*

**Consequence for this packet, stated so the next author does not repeat the draft's error.** The draft self-scanned with `overview` as outcome-class and `detail` as scene-class — the two surfaces reversed — so its "vagueness zero" claim was evidence about the wrong fields. Re-scanned against the code:

- **`overview` (scene, 10 fields):** zero evasive terms. The natural indefinites in them — *somewhere at the end of them*, *Nothing was handed over*, *whatever was up this road* — are legal and several are the better line, so they stay.
- **`change.detail` (outcome, strict, 4 distinct details):** zero hits, before and after. *"wherever they are going"* is not in either term list (`whatever` is; `wherever` is not).
- **Band fragments, afterimages, `narrativeTemplates.success`/`.failure` (outcome, strict):** **22 hits in the draft** — `nothing` ×9, `something` ×5, `thing`/`things` ×3, `way` ×4, `anything` ×1. All repaired to zero.
- **`effectLine`, `name`, factor lines, `fiction`, chip titles, reaction labels and intents (interactive / scene, evasive only):** **4 hits in the draft**, all evasive and therefore banned in every class — `the moment` on all three Mercy faces (a nominalised placeholder in the exact slot the term list exists for) and `something` in `line.s1a.something_to_want`'s effect line. All repaired.

**26 detector hits total, now zero.** For the record: the machine gate is a *density* fail at `VAGUENESS_DENSITY_FAIL = 2.0` per 100 words (`nudgeAuditDetectors.ts:68`), and at roughly 3,500 authored words this packet would have needed ~71 hits to trip it. It would have passed `check:encounter` at 26. **The gate is not the bar.**

**Annotation clauses — the cap is one across the whole encounter, and this is the longest packet in the batch.** Counted by hand against `NOT_X_BUT_Y_PATTERNS` (`:238-244`), every swept field: **zero**. Note two near-misses that do *not* fire and should not be written around: `(is|was|are|were)n'?t` requires the contraction or an attached `not`, so the several *"was not the end"* constructions are clean; and `less\s+[a-z]+\s+than` requires an intervening word, so *"took less than half of it"* is clean. The one annotation clause in the packet is *"Not heroism — calculation under a deadline"* in the § 12 art brief, which is not a template field and is not swept. **One in the document, zero in the shipped fields.**

---

## 7. Trait hooks (all four questions answered)

1. **Gate?** — **No.** A road is a road, and nothing about who the agent is should decide whether they are allowed to meet this. `requiredTraits` / `blockedByTraits` unauthored.
2. **Variant?** — **Yes.** One, on `trait.core.core_warmth.virtue` — the **Warm** pole of the Core warmth continuum (`src/types/coreRegistry.ts:123-124`, virtue word *Warm*, `governs: 'care for others'`, `reachCouplings` include `heart +1`). It is a seeded Core definition, so `validateTraitRefs()` does not report it dead, and the full node id is the least rot-prone ref form.
   ```
   traitId:         'trait.core.core_warmth.virtue'
   forecastDelta:   0.05
   difficultyDelta: -0.03
   factorLine:      'Being Warm, they do not leave someone who cannot run.'
   ```
   The line names its source inside the sentence (canon rule 1) — not `Source: trait` beside it — and is variant by construction, since it renders only for a bearer. Ten words against a 12-word budget.
3. **Trait-only nudge?** — **No**, and this is a deliberate budget decision rather than an oversight: the batch's card-type allocation gives `trait_card` to encounters #2 and #5, and this encounter's seven-type budget is already spent. Recorded so a reviewer can price the trade. `addNudgeIds` unauthored.
4. **Trait fragment?** — **No.** The variant's `factorLine` carries the trait's presence, and adding a band fragment on top would say the same thing twice in one panel — which, given § 6.5, is exactly the defect this pass spent its time on.

**Note on the fork and the trait.** Being Warm eases the *heart* test; it does not lean the fork. The fork reads `axiologicalProfile.mercy_ruthlessness`, which is a different axis and a different surface, and conflating them would let a warm person be quietly declared merciful by the engine — which is exactly the kind of plausible, invisible, load-bearing wrongness `signedLeanWeight`'s axis check (`src/engine/encounters/poleLean.ts:46`) exists to prevent.

---

## 8. Aftermath

```ts
aftermathConfig: {
  branchOnStep: 0,                       // the DECIDING step, not the fork's own index
  variants: { positive: HOLD_THE_ROAD, negative: BREAK_THE_PURSUIT },
  fallback: { ...HOLD_THE_ROAD },
}
```

**`branchOnStep: 0`, three times over.** The step-1 branch, the step-2 branch, and the aftermath config all key on **step 0** — the step that resolved and against which the pole was recorded. `src/types/unifiedAction.ts:1772` states the semantics (*"Step index (0-based) whose choiceId determines the variant"*) and `branchDecision.ts:294` confirms the reader compares it against the step that just resolved, so naming the fork's own index would read a step no choice is ever written to (THR-979). Only the step-1 branch carries `decidedBy`; step 2's branch reads the choice already in history. (`decidedBranchesForStep` at `:289` supports several branches off one deciding step and records **one** decision covering the lot, so either arrangement resolves — one `decidedBy` is simply the smaller surface.)

**`variants` keyed exactly `'positive'` / `'negative'`.** `resolveAftermathVariant` (`unifiedAction.ts:1975-1978`) does `variants[branchChoice.choiceId] ?? fallback`, and `recordDecidedChoice` (`branchDecision.ts:506-522`) writes the bare pole key, so a variant keyed anything else is unreachable forever and silently — the THR-844 shape.

**`fallback` takes the mercy pole**, not the ruthless one. A fork that failed to resolve must not default the mortal into starting a fight. (In practice `decidedBy` always records a pole — the coin settles a genuine tie — so the fallback is belt-and-braces, exactly as it is on the apotheosis, whose fallback takes Survivor for the same reason.)

### 8.0 Where the writes live — the one blocking question for Pass 3

Read the types before authoring against this section. `AftermathVariant` and `AftermathOutcomeOverride` each carry `overview`, `changes`, `reactionPrompt` and `reactions`. **`EncounterAftermathReaction` has `id` / `label` / `intent` / `effects` / `closeAfterSelection` — and no `changes`. Neither the variant nor the band has an `effects` field.** So at aftermath time, `reactions[].effects` is the only effect carrier that exists.

Two things follow, and both are load-bearing.

1. **The chip rule in § 8.1 is compelled by the type, not chosen by the author.** Chips live on the band; effects live on the arms; therefore a chip may only claim what *every* arm of that band writes. It is not a stylistic preference a later editor may relax.
2. **Every state write in this encounter is currently gated on a click, and one of them is the sequel.** `apotheosis-ascension.ts:306` says it in four words — *"a reaction is a click"* — which is why its permanent grant rides `successMetadata.effects` instead (THR-783; and `applyAftermathOutcomeBand` at `unifiedAction.ts:1930-1944` substitutes `reactions` **wholesale**, `band.reactions ?? variant.reactions`, so a band authoring its own would have dropped it by omission). A player who closes the aftermath without picking a stance gets no bond, no wound, no mark, and no `encounter.border.one_body_short`.

`ActionStep` carries both `successMetadata` and `failureMetadata` (`unifiedAction.ts:1711-1712`), so a home exists — but it is per-step, not per-band, and the seed must fire on four endings of ten. **Deciding where the pole-invariant writes live is Pass 3's call and this packet does not pre-empt it.** What it asserts is the requirement:

> The four pole-invariant writes — `bond_change`, `hidden_mark`, `encounter_seed`, `condition_attachment` — must fire on their bands **without a player click**. Only the differentiator may ride a reaction: `favor_creation` on arm A, the larger `bond_change` on arm B.

This is blocking for the pair, not for this encounter alone.

### 8.1 Reaction design, and why some bands carry one reaction and some carry two

Every chip on a band must correspond to an effect that fires **on that band** (UI Law 56 / Consequences rule 0), and — per § 8.0 — a chip may only claim what **every** arm of that band writes. The rule this encounter follows:

> **Both arms of a band always write the same chipped effects, and differ in one unchipped effect. A band carries a second reaction only where the fiction gives the god two genuinely different things to weigh.**

The recurring second stance, on the bands where it exists, is the encounter's own follow-up question — having decided *how* to protect someone, what is the protecting worth?

- **Arm A — "Let them owe it."** The pilgrim says what they owe and the traveler lets it stand. → `favor_creation` (debtor `$cast:survivor`) on top of the shared effects. A claim on a person, kept.
- **Arm B — "Tell them they owe nothing."** The traveler waves it off, and is believed. → a larger `bond_change` instead. A claim given away, which buys something a favour cannot.

On the worst band of each pole there is only one thing to do, so those bands carry a single reaction rather than a manufactured fork.

**Known and accepted: the two arms show the player the same chips.** They differ in `favor_creation` versus a larger `bond_change`, neither of which is chipped, and per § 8.0 a per-reaction chip does not exist in the type. The arms' `intent` lines carry the whole difference. Recorded so nobody later reads the identical chip sets as a copy-paste error and "fixes" it into a Law 56 violation.

**`hidden_mark` is deliberately not chipped.** A concealed anchor is still an anchor, and Law 56 governs what a chip *claims*, not what the world records — a mark the agent is keeping to themselves has no business on a chip that announces it.

### 8.1b The three chip shapes, in full

Reused across ten endings with per-band `causeClause` and `detail`. **Every change declares a non-empty `concepts` list** — `compositionContract.ts:1248-1249` requires it on *every* change, and a `stateNoun` does **not** discharge it (that satisfies the separate anchor clause at `:680`). At least one concept must carry an `entityId` or a `tooltipId`, or `:734-739` fires a second violation. The corpus authors `concepts` nowhere, which is a large share of why the ratchet holds all 191 existing templates; a new encounter does not get to inherit that.

**BOND · a bond formed**
```
kind: 'growth' · direction: 'gain' · polarity: 'gain'
stateNoun: { text: 'a bond formed', entityId: '$cast:survivor', visualKind: 'agent' }
concepts:  [ { text: 'a bond formed', entityId: '$cast:survivor', visualKind: 'agent' } ]
detail:    "{cast:survivor} will not forget who was standing there, and the two of them are tied by it now."
causeClause: per band — see § 8.2 / § 8.3
```
Backed by `bond_change` on **both** arms of every band that carries it.

**PATH · a scene planted**
```
kind: 'future_hook' · direction: 'opens' · polarity: 'info'
stateNoun: { text: 'a scene planted', entityId: '$actor', visualKind: 'agent' }
concepts:  [ { text: 'a scene planted', entityId: '$actor', visualKind: 'agent' } ]
causeClause: "Four came up the road and the count of what went back down does not match"
detail:      "{actor} will go over that ground again, and it will not come out even."
```
Backed by `encounter_seed` on **both** arms. *(`stateNoun` was `'a scene still to come'`; rule 0c asks the noun to name the mechanic and it renders raw into the `CATEGORY · NOUN` tag with no enrichment, so it says *planted*.)*

**SCAR · a wound**
```
kind: 'trait' · direction: 'loss' · polarity: 'loss'
stateNoun: { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }
concepts:  [ { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' } ]
causeClause / detail: per band
```
Backed by `condition_attachment` on **both** arms.

**Anchor legality, checked against the classifier rather than the catalogue.** `anchor-catalog.generated.md` documents `visualKind: 'attachment'` with an attachment-template node id (`:82`), and `trait.condition.wounded` is indexed by `attachmentTemplateIndex.ts:59`, so the SCAR anchor is catalogued and resolvable. The `$actor` and `$cast:` sentinels **do not appear in the catalogue at all** — they are legal by `chipAnchorDeclarations.ts:33`, `:56`, `:90-103`, which also rejects a `$cast:` key absent from `supportBundle`, and `survivor` is declared. The earlier claim that these were "anchor-catalog members" was wrong about the authority, not about the legality.

### 8.2 `positive` pole — **Hold the Road** (`variants.positive`)

**Base variant** — the `success` ending (no `byOutcome.success` key, so `success` resolves here).

> **overview** — The riders took the price and went through, and the traveler did not move until the last of them was out the far side. Nobody reached for anything. The traveler is lighter by most of what they were carrying. `{cast:survivor}` is asking, from the ground, what happens now.

**changes** — **BOND · a bond formed**, `causeClause`: "Stood in the road and paid to keep it that way". **No PATH: this band no longer plants the seed** — the traveler watched all four out the far side, so the count closes. See § 9.

**reactions**
- **A · "Let them owe it"** — *intent:* "The pilgrim says what they owe, out loud, and the traveler lets it stand." → `bond_change` (`withAgentId: '$cast:survivor'`, sentiment +, trust +) · `favor_creation` (debtor `$cast:survivor`, context "carried off the road when they could not walk")
- **B · "Tell them they owe nothing"** — *intent:* "The traveler waves it off. Being believed about that lands harder than a debt would have." → `bond_change` (sentiment ++, trust ++)

---

**`byOutcome.critical_success`**

> **overview** — Somebody at the front of the four looked at the price, looked at what was standing in the road, and took less than half of it. The line went by at a walk with the width of the road between them and the pilgrim. The traveler stayed on their feet until all four were out the other end. `{cast:survivor}` spends a while insisting the leg is fine. It is not.

**changes** — **BOND · a bond formed** only, `causeClause`: "Named a price four armed men decided not to argue with". No PATH: everyone who came up the road went back down it in daylight and was watched doing it. **No seed on this band, by design.**

**reactions** — A and B as above.

*(Rewritten. The draft's version had the riders waive the price entirely and *"Nothing was handed over"* — an ending that contradicts both steps that produce it, since step 1's `critical_success` is the price being named back and step 2 is the bargain being paid. It also carried the packet's one unreadable sentence, *"the leg is not as bad as it looks, which it is"*, now two plain ones.)*

---

**`byOutcome.success_at_cost`**

> **overview** — The price was named and then renamed twice, and the traveler handed over the pack as well and took a boot to the ribs for arguing the last of it. At the end one of them reached for more than had been agreed, and it stopped being a bargain. Two of them are lying where the way goes narrow. The rest rode through and did not look back.

**changes** — **BOND · a bond formed** (`causeClause`: "Stood in the road while a bargain came apart in their hands") · **PATH · a scene planted** · **SCAR · a wound** (`causeClause`: "Argued over the last of the price and was answered with a boot", `detail`: "Ribs that will complain about every hill between here and wherever they are going.")

**reactions** — A and B, both carrying `bond_change` · `hidden_mark` · `encounter_seed` · `condition_attachment` (`trait.condition.wounded`, moderate duration); A adds `favor_creation`.

*(Rewritten. The draft ended on one rider going *"down the bank"* — `bank` is `wayside` scenery, and one man off a road is not the field of dead the sequel opens on. This is now the encounter's strongest band: mercy that fails at the last is the ending where people die, which gives the mercy pole a real cost instead of a bruise.)*

---

**`byOutcome.failure`**

> **overview** — Nothing that was said made any difference to them. They took what was worth taking on the way past and put the traveler down for arguing about it. The traveler did not go down for free — two of theirs are on the road and are not riding anywhere. The rest went on together. `{cast:survivor}` was under a cloak by then, and not being worth the trouble is the whole reason they are still there.

**changes** — **SCAR · a wound** · **BOND · a bond formed** (thinner: the pilgrim watched somebody take a beating for them and is not sure yet what to do with that; `causeClause`: "Took a beating in the road rather than step out of it") · **PATH · a scene planted**.

**reactions** — A and B, both `bond_change` (small) · `hidden_mark` · `encounter_seed` · `condition_attachment` (wounded); A adds `favor_creation`.

*(Rewritten, and this band now seeds. See § 9.)*

---

**`byOutcome.critical_failure`**

> **overview** — The traveler went down early and stayed down, and the four of them were unhurried about the rest of it. When there was light enough to see by, the place beside the road where the pilgrim had been sitting was empty, and the pack was gone from it, and the road north had a great many hoofprints on it. `{cast:survivor}` is somewhere at the end of them.

**changes** — **SCAR · a wound** (stacked, long duration; `causeClause`: "Went down in the first minute and was not worth finishing", `detail`: "A beating that will be measured in days, not hours."). **No BOND** — the bond did not form. **No PATH.**

**reactions** — one only. **"Let them lie until the light"** — *intent:* "There is no reason to get up yet." → `condition_attachment` (wounded, long, 2 stacks) · `hidden_mark` (`secret_knowledge`, `targetAgentId: '$actor'`, "They know who was sitting in that road and who is not there now"). A second reaction here would be a manufactured stance; there is one thing to do.

### 8.3 `negative` pole — **Break the Pursuit** (`variants.negative`)

**Base variant** — the `success` ending.

> **overview** — The traveler met them where the way is narrowest, and four riders strung out in a narrow place are not four riders. Two came off. The other two took one look at the arithmetic and went back the way they came, and the road stayed empty for as long as it took to walk back. Everyone who came up that road is accounted for. `{cast:survivor}` heard all of it and has not asked a single question about it.

**changes** — **BOND · a bond formed** (`causeClause`: "Went up the road alone so that nobody had to come down it"). **No PATH** — a clean break accounts for everybody.

**reactions** — A and B, both `bond_change`; A adds `favor_creation`.

*("strung out on a climb" was changed to "in a narrow place": the `battlefield` opening puts the road on a causeway across "the whole flat", so a climb is scenery from a different class contradicting one quarter of runs.)*

---

**`byOutcome.critical_success`**

> **overview** — It was over in one exchange and nobody died in it. Two of them are going to remember the narrow place for a long time, and all four went back down at a pace that had nothing dignified about it. The pilgrim, who had been told to stay still, stayed still.

**changes** — **BOND · a bond formed** (`causeClause`: "Ended it in one exchange without ending anybody"). No PATH, no SCAR.

**reactions** — A and B.

---

**`byOutcome.success_at_cost`**

> **overview** — It worked, and it was ugly the whole way through, and somewhere in the middle of it the traveler stopped a blade with an arm. The road is clear. Two of them are lying where the way goes narrow and the rest went back down. When there was light enough to walk it and count what was on it, the count came out one short of what had come up. `{cast:survivor}` heard all of it from where they were sitting and has not mentioned it since.

**changes** — **BOND · a bond formed** (`causeClause`: "Went up the road alone and came back down it bleeding") · **PATH · a scene planted** · **SCAR · a wound** (`causeClause`: "Stopped a blade with an arm because there was nothing else to stop it with")

**reactions** — A and B, both `bond_change` · `hidden_mark` · `encounter_seed` · `condition_attachment` (wounded); A adds `favor_creation`.

---

**`byOutcome.failure`**

> **overview** — The strike went in late and they came on through it, and the traveler got back to the narrow place a half-step ahead of them and made the rest of it expensive. The riders decided the road was not worth the price and pulled off it. Two of theirs stayed where they fell. What went back down that road did not match what had come up, and `{cast:survivor}` has not moved from where they were told to sit.

**changes** — **SCAR · a wound** (`causeClause`: "Held the narrow place a half-step ahead of four men") · **BOND · a bond formed** (small; `causeClause`: "Came back to the narrow place instead of past it") · **PATH · a scene planted**

**reactions** — A and B, both `bond_change` (small) · `hidden_mark` · `encounter_seed` · `condition_attachment` (wounded); A adds `favor_creation`.

*(Rewritten. The draft ended this band on **"Nobody counted anything, then or after"** while planting a `hidden_mark` labelled *"The count on the road came up one short"* and a PATH chip claiming the count does not match. A mark the ending's own text denies is worse than an absent one — it is a false claim inside the surface Law 56 exists to make trustworthy. The agent now makes the count, and it does not close, which is also what makes the band worth seeding.)*

---

**`byOutcome.critical_failure`**

> **overview** — The traveler went up the road alone and got about three steps into it. The riders came the rest of the way down at a walk, went past the narrow place without slowing, and did not look at what was sitting in it — which is the only reason there is still somebody sitting in it.

**changes** — **SCAR · a wound** (stacked, long; `causeClause`: "Went up a road alone to meet four men"). **No BOND chip** — the bond is written small on both arms but the ending has nothing to boast about; the engine's own delta cluster reports it. **No PATH.**

**reactions** — one only. **"Let them lie until the light"** — *intent:* "Somebody will come down the road eventually. It may as well be with the sun up." → `condition_attachment` (wounded, long, 2 stacks) · `bond_change` (`$cast:survivor`, small — the pilgrim walks back to find them) · `hidden_mark`.

*(The overview's opening was rewritten: the draft's *"went up the road alone to meet four men and found out, in about the time it takes to say so, exactly what four men are"* is the same joke, in the same shape, as the step-1 afterimage that renders four lines above it — *"The traveler went in at four men and found out how many four is."* The afterimage keeps the better line.)*

### 8.4 The `byOutcome` floor and reachability

Each pole authors **five** of the seven `UnifiedActionOutcome` values, against a floor of three (one success-side, one failure-side, one extreme). `contested_won` / `contested_lost` are deliberately unauthored: this template is never contested, so authoring them would ship prose no player can arrive at.

**The two outcome domains overlap without nesting, and neither is assignable to the other.** `byOutcome` keys on `UnifiedActionOutcome` (`unifiedAction.ts:2456-2463`) — which has `contested_won` / `contested_lost` and **no `near_miss`**. Every `bandProse` above keys on `StepOutcome` (`:2519`) — which has `near_miss` and **neither contested value**. So a key copied from one table to the other is a silent authoring error rather than a type error, in both directions. Author each table against its own union and do not pattern-match across them.

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

Shape verified at `unifiedAction.ts:431-446`: `delayTicks` and `seedLabel` are required, `templateId` and `inheritContext` optional. The effect also accepts `encounterFamily`, `targetAgentId` and `priority`, none of which this seed needs.

### Which bands plant it, and why those

**The rule, stated once:** *the seed fires exactly where the road left bodies and the count of them will not close.*

| Pole | Band | Seed? | Why |
|---|---|---|---|
| `positive` | `critical_success` | **no** | The price cost almost nothing and all four were watched out the far side. Complete. |
| `positive` | `success` (base) | **no** | A bought passage the traveler supervised to the end. Nobody fought; there is nothing to count. |
| `positive` | `success_at_cost` | **yes** | The bargain came apart at the last. Two are down; the rest rode off without them. |
| `positive` | `failure` | **yes** | They came through and put the traveler down, and did not do it for free. Two of theirs stayed on the road. |
| `positive` | `critical_failure` | **no** | The traveler is face-down and the missing person is the pilgrim — a different encounter, and not the one being authored. |
| `negative` | `critical_success` | **no** | One exchange, nobody dead, all four rode back down. Complete. |
| `negative` | `success` (base) | **no** | A clean break accounts for everyone; the prose says so explicitly. |
| `negative` | `success_at_cost` | **yes** | It was ugly and it was dark, and the count came out short. |
| `negative` | `failure` | **yes** | The riders pulled off it on their own terms, two stayed where they fell, and the count does not match. |

**Four of ten endings, two per pole**, and the symmetry is now a rule rather than a coincidence: on both poles the seed rides `success_at_cost` and `failure` — the two bands where the course was taken and went wrong. **Mercy loses count when the bargain breaks; ruthlessness loses count when the ambush is messy.** Same shape, opposite causes.

> **What changed from the draft, and why it had to.** The draft seeded `positive.success` and `positive.success_at_cost`. Neither produces the scene the sequel opens on. `encounter.border.one_body_short`'s spine reads *"The fighting stopped a while ago and nothing has moved since… **The dead lie where they fell**, and the count comes out one short"*, and its own pole-agnostic contract asserts *"Both poles end with dead on the ground"* (`one-body-short-draft.md:162`, `:606`). On the mercy pole as drafted, **nobody fought and nobody died**: `positive.success` is four riders taking a price and riding through. Twelve ticks later the agent would have been standing on a battlefield the parent never produced. The pole-invariance table caught what the sequel *reads* and missed what the sequel *stands in*.
>
> **Owed by the sequel's editorial pass:** restate `:606` as a constraint the parent satisfies rather than an observation about the parent, so a later edit to either draft cannot silently break it again.

### What state this encounter mints for the sequel to read

1. **The cast member who crosses.** `$cast:survivor`, `persistence: 'must-persist'`. `inheritContext: true` copies this action's `targetId` and `supportBindings` onto the seed, so **One Body Short** stars the same person, with the same node, the same name and the same portrait. This is what makes prose rule 7 structural for the sequel: it may narrate the history because the parent wrote it.
2. **The bond.** `bond_change` with `$cast:survivor` fires on every arm of every seeded band, so the sequel's `eye` test is being performed in front of somebody the agent is measurably tied to — and the sequel may say so.
3. **The fact that a body is unaccounted for.** `hidden_mark` on the **actor**:
   ```ts
   {
     kind: 'hidden_mark',
     category: 'secret_knowledge',
     targetAgentId: '$actor',
     severity: 0.35,
     label: 'The count on the road came up one short',
     revealFamilies: ['encounter.border'],
   }
   ```
   `targetAgentId` is now declared rather than left to the default — the field exists (`unifiedAction.ts:484`) and `secret_knowledge` is a legal `HiddenMarkCategory` (`:106-115`). **Why a mark and not an object.** There is no corpse node, and no node type for "a man who is not where he should be". Minting one would be the river-chip failure exactly — a referent that is landscape fiction wearing a pointer. A hidden mark is a real, resolvable write on a real agent, and `revealFamilies: ['encounter.border']` is the sanctioned channel for a later encounter in the same family to find it; `familyMatchesTemplate` prefix-matches, so it reaches the sequel by construction. The bearer is the actor, and the actor is the one who draws `encounter.border.*`, so the reveal-family bearer trap does not bite.
4. **The ground itself.** A fight ended on it and the dead are on it. Not a typed write — it is the fiction of the band — but it is the sequel's *stage*, and it is the fact the draft's invariance table omitted.

### 9.5 The parent's target contract (requested by the sequel, § 8.4(b))

`one-body-short-draft.md:616` asks row 4 a direct question and the draft did not answer it. Answering it here.

The sequel wires its `secret` family with `secret_discovery` on `successMetadata`. That effect has **no `targetAgentId`** (`unifiedAction.ts:995-1005`); `encounterAftermath.ts:4211` reads `action?.targetId`, and `createSecretEdge` (`secretGeneration.ts:392-408`) refuses an endpoint that is not an actor node, tracing the refusal rather than throwing. Under `inheritContext: true` the sequel's `targetId` is **copied from this action**. So:

> **`encounter.border.standing_the_line` targets the crossing person.** Its action `targetId` resolves to the agent bound under cast key `survivor` — not the location, not the hex, not the actor themselves. A location target makes the sequel's entire `secret` family green at the gate and inert at runtime; a self-target (actor === target) is refused by the same endpoint check.

Pass 3 lands this in the template's targeting rather than inferring it. If it turns out the parent must target a place for scoring reasons, the sequel's `secret` family has to move to `hidden_mark` — which does take `targetAgentId` — and the swap recorded on both sides in the same PR. This is the second of the two blocking cross-draft items, alongside § 8.0.

### Pole-invariance — the sequel's binding constraint on this encounter

**One Body Short does not know which pole the fork took.** It refers to the inherited person only as *"the other survivor"* and gives them no pronoun anywhere. Everything this encounter mints for it must therefore be **true on both poles**, and the seed is planted only on bands where the pole-invariant facts actually hold.

| Minted fact | Pole-invariant? | Holds on all four seeded bands? |
|---|---|---|
| The `survivor` exists, is bound, persists, and is with the agent | **yes** | ✓ — alive and beside the agent on `positive.success_at_cost`, `positive.failure`, `negative.success_at_cost`, `negative.failure`, and **named in the prose of each** |
| A bond edge between agent and `survivor` | **yes** | ✓ — `bond_change` fires on **both** reaction arms of all four |
| The count on the road came up one short (`hidden_mark` on the actor) | **yes** | ✓ — same, both arms of all four |
| **A fight ended on this ground and the dead are on it** | **yes** | ✓ — two bodies on every one of the four. *This is the row the draft did not have, and its absence is what let the mercy pole seed a scene it could not produce.* |
| A favour owed by the `survivor` | **no** — arm A only | ✗ — the sequel must never assume it |
| A wound on the agent | **no** — absent on both poles' clean endings | ✗ — the sequel must never assume it |

The four invariant facts are the three the sequel reads plus the one it stands in. The two variant ones are listed so the sequel's author can see, in one table, what is *not* safe to lean on. `positive.critical_failure` remains the sharpest exclusion: the person is taken up the road there, so "survivor" would be a lie and the sequel's whole premise would not hold — and that band plants nothing.

### Why the `secret` family is `hidden_mark` + `favor_creation` and **not** `secret_discovery`

Same reasoning as § 9.5, applied to this encounter's own secret rather than the sequel's. This encounter's secret is *what the agent knows about the road* — an incomplete count of people who are not cast members and have no nodes — so its natural endpoint is a place and a set of absences, which `secret_discovery` structurally cannot express. Forcing it onto the crossing person would make the sequel read a `knows_secret_of` edge pointing at the wrong subject: the survivor is not the secret, the missing rider is.

So the secret is wired the two ways that can carry it honestly:

- **`hidden_mark` on the actor** — the count, concealed, with `revealFamilies: ['encounter.border']`. It is the fact the sequel's `eye` test is *about*, and it needs no second party.
- **`favor_creation`, debtor `$cast:survivor`** — a debt spoken between two people and known to nobody else, which is a secret in the plain sense and is edge-backed to a cast member who is `must-persist`.

Both are `secret`-family members per the consequence-draw table, so the drawn family is wired in context and `check:encounter` is satisfied without a mis-targeted edge.

**Not reached for, and recorded so nobody reaches for it later:** `thread_*` effects cannot resolve a scene sentinel today (`SCENE_SENTINEL_FIELDS` omits `ascendantId`/`mortalId`, the handlers read ids raw, and an authored sentinel no-ops with `thread_mutation_skipped` while `check:encounter` passes on kind presence alone). This encounter did not draw `thread` and must not take one as a swap.

**Why `delayTicks: 12`.** Twelve ticks is exactly one in-world day (canon: two in-world hours per tick, twelve ticks per day). The count happens the next morning — the first hour there is light on that ground and nothing coming up it, which is the first hour anybody could honestly do it. A shorter delay would have the agent counting in the dark with their hands still shaking; a longer one would have somebody else's crows do the counting first. It is one named constant's worth of time, not a taste number.

**What the sequel must not assume.** Only the four writes above. The parent does not mint a faction, a location condition, an artifact, or a quintessence shift — the batch design allots `quintessence_shift` to the sequel itself, and the sequel is the one that spends it.

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
| `generic.focus` | mind | the three core Boosts | Reads in any encounter where steadiness is the variable — a river crossing, a forgery, a negotiation. |
| `generic.energy` | energy | the two energy Boosts | Any encounter where a body has to spend more than it has. |
| `generic.mercy` | **none** | the three Mercy cards | Any encounter with a floor worth buying. |
| `generic.memory` | mind | the three Compulsions | Any encounter where a thought is placed rather than a thing moved. |
| `generic.blessing` | spirit | the four Kindled ambitions | Any encounter where a want is lit. |
| `generic.dark` | darkness | the four Undertows | Any encounter where the shorter, uglier answer is on offer. |
| `generic.strength` | force | the two force Signatures | Any encounter where weight decides it. |
| `generic.light` | light | `Made Plain` | Any encounter where what is visible is the lever. |
| `generic.time-slow` | time | `Not The First Time` | Any encounter where a moment is stretched or made to feel worn. |
| `generic.oath` | order | the three Fellowships | Any encounter where a group has to move as one. |
| `generic.matter` | matter | `Sound Goods` | Any encounter where an object's soundness is the question. |

Ten of the eleven come from `NUDGE_CONCEPT_ART` (`src/data/encounter-image-library.ts:627-645`, mapped to `kind: 'nudge'` at `:650`). **`generic.mercy` comes from a different table** — `SITUATIONAL_NUDGE_ART` (`:681-687`), also `kind: 'nudge'`, `mood: 'tense'`, and deliberately carrying **no sphere** (`:669-675`). It is the right row for a sphere-less common card, and it is recorded as sphere-less here so nobody later "fixes" it by assigning one.

Every one clears `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3, `nudgeAuthoringConstants.ts:322`) by a wide margin, because none of them depicts a road, a rider, or a person on the ground.

### Scene art

**Scene tag:** `road.narrow_place.pursuit` (WS4 vocabulary; until a manifest row exists the fallback chain ends at EntityVisual).

**`illustrationUrl` is deliberately unauthored.** The apotheosis declares `/concept-art/encounters/placeholder.jpg`, and that file **does not exist on disk** (`public/concept-art/encounters/` holds nineteen named images and no placeholder). The Composition Contract only checks that a declared `illustrationUrl` is public-absolute, so a dead path passes the gate and renders a broken image. Declaring nothing falls through the documented chain instead. Worth a separate look at the apotheosis's declaration.

---

## 12. Concept art direction (two-question method)

**1. What emotions does this story convey?** The arithmetic of standing between something and someone. Not heroism — *calculation under a deadline*, and the particular loneliness of being the only thing in the way. Afterwards: an accounting that will not come out even.

**2. What image evokes those emotions while staying inside this world?**

> **A narrow place on a road, empty, at the hour after.** The ground where the way pinches — baked ruts, or fallen courses, or a causeway between ditches — shot along the road rather than across it, so the eye is funnelled the way the riders came. Nothing dramatic on it. A pack sitting upright on the verge where somebody set it down and did not pick it up again. Further off, faint in the failing light, four sets of hoofprints going one way — and, if the composition can carry it without narrating, a fifth set that leaves the road and does not come back to it. No figures. No blood. No weapons.

This shows **residue and absence**: the pack is the person who could not walk, the prints are the thing that did not have to stop, and the set that leaves the road is the count that will not come out. It carries the sequel without illustrating either encounter. It depicts no interaction and no second human likeness (image doctrine ruling 10), and it does not paint any mechanic into the frame.

*(The one annotation clause in this document — "Not heroism — calculation under a deadline" — lives here, in the art brief. It is not a template field and is not swept by the detectors. Shipped fields carry zero. See § 6.6.)*

---

## 13. Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `survivor` (actor) | `lazy-materialize-on-trigger` | reuse `pilgrim` where a roster seeds one (`wilderness`, 0.2); otherwise spawn `pilgrim`, name `Ilme Fenn` | **must-persist** | `bond_change` on nine endings · `favor_creation` on arm A · `{cast:survivor}` in six overviews · the action's `targetId` (§ 9.5) · **inherited by `encounter.border.one_body_short`** | built (spec authored) |
| `trait.condition.wounded` | live catalog | `src/data/condition-trait-content.ts:143` (duration entry `:403`) | duration edge | five endings | live ✓ |
| `trait.core.core_warmth.virtue` | live catalog | `src/types/coreRegistry.ts:123-124` → `src/data/core-trait-content.ts` | seeded definition | `traitVariants[0]` | live ✓ |
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
target            the agent bound under cast key `survivor` (§ 9.5 — load-bearing for the sequel)
steps             [ step0WinTheirTrust,               // PLAIN step, heart, hand of 7 — see note
                    step1Branch,                      // branchOnStep 0, decidedBy mercy_ruthlessness
                    step2Branch ]                     // branchOnStep 0, reads the recorded pole
traitVariants     [ core_warmth.virtue ]              // § 7
supportBundle     [ survivor ]                        // § 3
aftermathConfig   branchOnStep 0, variants {positive, negative}, fallback = positive
consequenceDraw   ['relationship', 'secret', 'story_seed']
illustrationUrl   (unauthored — see § 11)
```

Wrap with `compileOpeningEnvelope(...)` so the openings actually reach the reader: a direct-authored template whose `openings` are validated and then read by nothing is THR-932, and it cost all eight slice encounters their approved opening paragraph. `compileOpeningEnvelope` is at `src/data/settingClasses.ts:173`; `withEncounterContract` (`src/data/encounter-contract-builder.ts:343-349`) is a *different* wrapper that attaches encoded contract metadata to `illustrationAlt` and has nothing to do with openings — an earlier draft of this block credited it with the THR-932 fix.

> **A stated invariant, because this is a forked template.** `compileOpeningEnvelope` returns the template **unchanged** if `steps[0]` is an `ActionStepBranch` (`settingClasses.ts:191-193` — it needs `narrativeTemplate` on the first step and a branch node has none). A branching encounter that forks at step 0 silently loses its opening. This template's step 0 is a plain step by design — it is the deciding step — so the openings compile. **Do not reorder the steps.**

---

## 15. Self-audit

| Check | Verdict |
|---|---|
| Design block written before prose, terse, one line per row | **PASS** |
| Crux is one plain sentence; title states it | **PASS** — the title names a posture rather than an object, which is the batch's least concrete; recorded, not fixed |
| One entry per catalog, system pick in the mature tier | **PASS** — `forks` + `carryover` + `traits`, all mature |
| Hook recorded, rolled and taken, verified live | **PASS** — `plotHooks.ts:612-619`, `usedBy: []` |
| 14 scene-writer questions answered in writing before the prose | **PASS** |
| Envelope declared, one opening per class, spine setting-neutral | **PASS** |
| No class scenery below the opening | **PASS after repair** — the draft claimed PASS with five leaks (`gorse` ×2, `bank`, `ditch`, `a climb` against the battlefield's flat). All five neutralised |
| ≥1 cast binding; every `{cast:*}` token names a declared key | **PASS** — one key, `survivor`, used in six overviews; `chipAnchorDeclarations.ts:93-103` rejects a `$cast:` key absent from `supportBundle`, and it is present |
| Cast class-honest across the whole envelope | **PASS** — § 3; roster weight corrected to 0.2, and the `castle`→`capital` mapping recorded |
| Cast never gendered in prose | **PASS** — *they* or a role noun throughout, checked sentence by sentence on both sides of the pair |
| Something persists | **PASS** — `bond_change`, `favor_creation`, `hidden_mark`, `encounter_seed`, `condition_attachment`, all in `PERSISTENT_EFFECT_KINDS` (`compositionContract.ts:116-133`) |
| ≥3 system connections from the authored manifest | **PASS** — 4 (cast, rewards, seeds, conditions) against `COMPOSITION_SYSTEMS_QUOTA_MIN` 3 |
| `aftermathConfig` present; `byOutcome` floor ≥3 bands per variant | **PASS** — 5 authored per pole |
| Every variant carries an `overview` | **PASS** — 10 |
| **Every change declares a non-empty `concepts` list** | **PASS after repair** — the draft declared `concepts` on **zero** changes and claimed PASS. `compositionContract.ts:1248-1249` requires it on *every* change and a `stateNoun` does not discharge it; `:734-739` additionally requires at least one concept to carry an `entityId` or `tooltipId`. All three chip shapes now declare one (§ 8.1b) |
| Every `changes` entry backed by an effect that fires on that band, on **every** arm | **PASS** — § 8.1 states the rule, and § 8.0 records that the type compels it |
| No `reputation_tally` chip | **PASS** — none authored |
| Chip referents resolve | **PASS** — `$cast:survivor` and `$actor` legal via `chipAnchorDeclarations.ts` (not the catalogue, which does not mention the sentinels); `trait.condition.wounded` catalogued at `anchor-catalog.generated.md:82` and indexed by `attachmentTemplateIndex.ts:59` |
| 4–8 cards per nudge-bearing step | **PASS** — 7 / 5 / 5 / 5 / 5 |
| ≥4 spheres, ≥1 ungated common option, ≤1 rider per hand | **PASS** — audited by hand, all five |
| ≤2 Boost per hand; ≥3 distinct types per hand | **PASS** |
| Every card pays off in failure; big-delta cards cover both failure bands | **PASS** — 27/27 |
| All six `StepOutcome`s covered on every hand | **PASS** — enumerated per hand |
| Base band text reads correctly with any subset of the hand | **PASS** — § 6 is what happens when the god did nothing |
| `libraryCardId` set on every card matching a library member | **PASS** — 18 of 27; the nine one-offs are forced, and the six library faces reproduce `title` and `quote` character-for-character |
| Every card `imageTag` resolves to a library row | **PASS** — eleven tags, all `kind: 'nudge'`; `generic.mercy` correctly recorded as sphere-less |
| No static `factorLines`; carryover lines authored and within budget | **PASS** — four tables, 24 lines, all ≤12 words, max |Δ| 0.10 |
| No digits or `%` in any `effectLine` | **PASS** |
| Trait hooks: all four questions answered explicitly | **PASS** — two yeses and two written noes |
| Trait ref passes `validateTraitRefs()` | **PASS** — seeded Core definition at `coreRegistry.ts:123` |
| Open-draw reachability: every step ≤ 0.45 | **PASS** — 0.35 / 0.40 / 0.40 / 0.28 / 0.44 |
| Hand delta sums under 0.70; difficulty + hand inside [0,1] | **PASS** — 0.58 / 0.46 / 0.55 / 0.43 / 0.47 |
| No `authoredChoices` | **PASS** — the fork is `ActionStepBranch.decidedBy`, the mortal's |
| `variants` key exactly `'positive'` / `'negative'` | **PASS** |
| `branchOnStep` names the deciding step | **PASS** — 0 in all three places, verified against `unifiedAction.ts:1772` and `branchDecision.ts:294` |
| Both poles fully authored — prose, hands, bands, aftermath | **PASS** — two hands, five afterimage sets, ten endings, and `{cast:survivor}` now present on both poles' seeded bands |
| ≥3 `poleLean` cards, both directions, **symmetric weights** | **PASS after repair** — 4 on the deciding step, 2 per side, all at `POLE_LEAN_DEFAULT_WEIGHT`. The draft carried 0.2 / 0.4 explicit weights making the ruthless lever 36% stronger, and its own arithmetic note misreported that as balance |
| ≤1 annotation clause across the encounter | **PASS** — zero in swept fields, one in the art brief (unswept). Counted by hand against `NOT_X_BUT_Y_PATTERNS` |
| Zero divine outcome-authorship | **PASS** — checked against `DIVINE_DECISION_PATTERNS` itself, not its prose description |
| Vagueness zero **within the code's field classes** | **PASS after repair** — the draft self-scanned with `overview` and `change.detail` reversed and claimed zero. Re-scanned per `nudgeAuditDetectors.ts:377-398`: 26 hits found, all repaired. See § 6.6 |
| Consequence draw recorded, all families wired in context, ≤1 swap | **PASS** — three wired, zero swaps |
| Seed names a template authored in the same batch | **PASS** — with a hard note in § 13 that it must land in the same PR |
| Cast key matches the sequel's inherited key | **PASS** — `survivor` on both sides, `one-body-short-draft.md:640` |
| **Parent target is an actor** (the sequel's `secret_discovery` depends on it) | **PASS as authored, blocking for Pass 3** — § 9.5. The draft did not answer the sequel's direct question |
| Every minted fact the sequel reads is pole-invariant | **PASS after repair** — four invariant facts, and the fourth (*a fight ended here and the dead are on it*) is the one whose absence let the mercy pole seed a scene it could not produce |
| `secret` family wired without a mis-targeted `secret_discovery` edge | **PASS** — `hidden_mark` + `favor_creation`, verified against `secretGeneration.ts:392-408` |
| Seam check — **including every in-ending seam** | **PASS after repair** — 21 echoes found, 19 of them inside a single ending, which is the class the draft's opening→spine check could not see. Enumerated in § 6.5 |

**Known gate blind spot, recorded rather than relied on.** `nudgeBearingSteps` (`nudgeHandChecklist.ts:55-58`) and `plainSteps` (`compositionContract.ts:315-319`) both filter `template.steps` for plain `ActionStep`s, so **`check:encounter` will see only step 0's hand** — the four hands inside the two `ActionStepBranch`es are invisible to the machine checklist, and the Steps block will count one plain step rather than three. `allRunnableSteps` (`:390-400`) *does* walk branch arms, but only to answer whether the template writes state. Every branch hand above was audited against the checklist by hand, line by line, and **nine defects were found in those four hands** — three scene-bespoke faces, four evasive terms, and two in-band fragment convergences — every one of which would have shipped green. **Do not read a green gate as coverage of §§ 5.2–5.5.** (The one branching template in the corpus, `encounter.apotheosis.ascension`, is on `RETROFIT_PENDING`, so nothing has ever proven this shape against the contract.)

---

## 16. Experience Differentiator Gate

**Scene & Prose**
1. Opening places the player inside a moment already in motion, not a briefing? — **YES.** Each opening is a place with weather and a smell and no exposition; the spine puts a person on the ground and something coming up the road, and never explains why either is there.
2. Prose has its own voice — cadence, rhythm, sentence variety? — **YES.** Long approach sentences in the openings, short flat ones in the endings; the worst bands are the shortest.
3. Scene prose names the elements that later become choices? — **YES.** The narrow place, the leg, the pack, the four riders and the pilgrim's distrust are all in the spine, and every one of the twenty-seven cards acts on one of them.
4. Would a reader feel something from the prose alone? — **YES.** *"Nothing on this road obliges them to stop"* is the whole encounter and needs no mechanics under it.
4b. No seam echoes? — **YES**, after 21 repairs. The audit that produced them is § 6.5, and it is the in-ending audit, not the paragraph-boundary one.

**Choices & Intervention**
5. Every card states its mechanism in the `effectLine`, generic 2–4 word title, one flavor line, zero scene-bespoke prose on the face? — **YES**, after three repairs. Eighteen faces are the library's own, verbatim; the nine one-offs are written to the same bar and each is forced by an empty library table.
6. Every card's price real and legible? — **YES.** Essence throughout, plus a genuine second channel carried as *permanent value drift* on the four Undertows — the card's printed promise, priced in who the mortal becomes.
7. Every card pays off in failure; big-delta cards cover both failure bands? — **YES.** Audited per hand, 27 of 27.
8. Is the hand grounded — delete the target and the card is senseless? — **YES.** Delete the riders and the pilgrim and none of the twenty-seven cards means anything.
9. Do the cards answer different questions? — **YES**, within each hand and across the three step-slots (which way / does it start / does it hold).
9b. Every nudge-bearing step carries a full authored hand, and no step asks the player to pick a branch or an ending? — **YES.** Five full hands. The fork is `decidedBy`; the player leans and the mortal answers.

**Aftermath & Consequence**
10. Does the aftermath have its own prose? — **YES.** Ten overviews, each saying only what it alone can say — after the two that narrated a different encounter than their own steps were rewritten (§ 8.2, § 8.3).
11. Actor-centred consequences with names and faces? — **YES.** `{cast:survivor}` is a real spawned person with a portrait, a click and a persistence contract, named on six endings including all four seeded ones, and the chips point at them.
12. Reaction choices where the player decides which thread to carry? — **YES.** Eight of ten endings offer two stances; the two that do not are the poles' worst bands, where the fiction gives the god one thing to do and a second option would be theatre.
13. Do the reaction choices represent different philosophical stances? — **YES.** *Hold a claim on the person you saved* against *give the claim away.* Arm A buys a future call-in; arm B buys a deeper tie and nothing to spend. Neither is the generous one.
14. Concept art uses the two-question method — residue, not illustration? — **YES.** § 12: an empty narrow place, a pack nobody picked up, and one set of prints that leaves the road. No figures, no fight, no blood.

**All fourteen YES.** Two were NO in the draft — 4b (seam echoes) and 5 (scene-bespoke faces).
