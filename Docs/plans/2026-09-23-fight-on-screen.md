> **title:** The fight on screen — opponent header, clock pips, fight chips and the lair card (Physical Conflict plan doc 4 of 6)
> **linear_issue:** THR-1258 (wayfinder map, closed 2026-09-23; slices filed on handoff)
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `N/A — reads only (see § Engine pillar)` · Content `done` · UI `done`

# The fight on screen — opponent header, clock pips, fight chips and the lair card

*A fight the player watches should show who the mortal is facing and how close the thing is to falling. A fight the player missed should still show on the lair and in the chronicle. This doc puts both on screen with the game's existing grammar, under the UI Laws.*

## Why this is load-bearing

Plan docs 2, 3 and 1 make fights happen, persist and leave marks, but without this doc a fight renders as four unlabelled encounter steps. The player could not see:
- the opponent's card;
- its clock (the persistent "half-broken" that makes several mortals' blows a story);
- the marks it left.

The map's watchability finding (THR-1263) turns on those three things. This doc also fixes two **live defects** found while charting (THR-1268, R2/R5):
- the lair sidebar prints the elite's raw node id instead of its name (`HexSidebar.tsx:533`, Law 14/21);
- the `WorldPulse` population count includes monsters (`WorldPulse.tsx:64`).

Decisions come from the closed map (THR-1258): THR-1272 (the screen), THR-1268 §8, THR-1266 and THR-1270 (the marks to chip). The UI Laws (`Docs/design-system/laws.md`, THR-1007) bind every slice.

## Substrate inventory

| Existing subsystem / surface | Status | This plan |
|---|---|---|
| Encounter veil (`EncounterVeil.tsx`; `ContextStrip`; `StepNavigator`; the consequence-chip block, THR-971/1082) | 🟢 ACTIVE | **extends**: one opponent header block on fight steps; fight chip kinds |
| `StepDots` (`shared/StepDots.tsx`, `variant: 'magnitude'`, THR-718) | 🟢 ACTIVE | **reuses** it as the clock's pip row, with **one additive prop pair**: `shape?: 'round' | 'square'` (default round) and `ariaLabel?: string`. The clock renders square (◼, THR-1272's mock), so it never reads like the step navigator's round dots (Law 10). Law 13's THR-1424 amendment sanctions a pip row for unitless proportions, and Law 15 forbids a third magnitude language |
| `EntityVisual` + `entityVisualResolver.ts` (Law 3, one resolver) | 🟢 ACTIVE | **extends** with a `monster` kind (sphere/family art keys with a fail-open fallback) |
| Ref router (`useRefRouter`, Law 21) | 🟢 ACTIVE | **reuses** it so the monster's name is clickable; the link opens the existing agent sheet |
| Consequence chips (`buildAftermathConsequences`; the four categories SCAR / BOND / BOON / PATH, `EncounterStageConsequenceCategory`, `encounter-stage/types.ts:357`; `CONSEQUENCE_CATEGORY_TOOLTIP_IDS`) | 🟢 ACTIVE | **extends** with the fight chip *kinds* in the chip table (§ UI pillar, item 2), each placed in one of the **existing four categories**. No fifth category (UL SCAR: a fifth is a design decision with a plan-doc note, and none is wanted). **The chip source is the adapter reading the resolved action's `fightState`**, not the engine's derived-chip channel `action.aftermathChanges` (built in `executeStepResult` at `unifiedActionResolution.ts:~2017`, sentences from `engine/aftermathWords.ts`), which emits nothing for a condition applied during a step. So every fight chip has a recorded `fightState` field (see the table) |
| Tooltip registry (`src/engine/tooltipResolver.ts`, Law 17) | 🟢 ACTIVE | **extends** with concept entries: Dread, Might, Temper, the fight clock, each clock-state word, each temper word, each fight chip |
| `HexSidebar` lair block (~426-538) and Cleared Lair Section (`:541`) | 🟢 ACTIVE (raw-id defect) | **fixes** the name and **extends** both with the monster card |
| `WorldPulse` population count | 🟢 ACTIVE (monster leak) | **fixes** it: excludes `isMonster` and the deceased |
| Chronicle panel (`ChroniclePanel`, rendering `gameState.chronicleEntries`) | 🟢 ACTIVE | **unchanged**. It renders plan doc 1's notable fight endings (`fight_ended` tick events at significance ≥ 0.8) as they are |
| Attention pipeline: effective tier = `TIER_MATRIX[courtPosition][intrinsicTier]` (`attentionTier.ts:20-27`); background → digest only; shaping → only through an attended tug (`encounterVisibility.ts:584-593`) | 🟢 ACTIVE | **unchanged, and read correctly.** Plan doc 2's FB7 pins `fight.lair.confront` at `story_beat`, so The First's and a retinue mortal's fights open the veil, and a watched mortal's fight surfaces only through an attended tug (§ Event notifications) |
| Agent death reading (`getAgentInfoCard`, `agentDetail.ts:1380`; its `card.death.by` is gated by the module-private `killerIsKnown`, `:1512-1520`) | 🟢 ACTIVE | **reuses** it: F4's adapter calls `getAgentInfoCard(graph, monsterId, ascendantId, knowledgeLevel, …)` for the slain monster (it returns a card for an unthreaded node, and sets `.death` before any knowledge gate, `:1513-1521`) and reads `.death`, so the lair card names a killer only when the sheet would, with no engine change |

## Engine pillar

Engine: N/A. **This doc writes no engine state.** It reads:
- `action.fightState` and `readOpponentCard` (plan doc 2), including the two record fields FB2 declares for exactly this purpose: `fightState.ending` (written by plan doc 1) and `fightState.lairOutcome` (written by plan doc 3);
- `monsterState`, `listMonsters` and `isMonster` (plan doc 3), including `monsterState.temperShown`, whose writer is plan doc 2's FB4;
- the retained elite's `lairId` (`lairEscalation.ts:229`) for the slain monster's lair card;
- two more records on `fightState` that plan doc 2 declares for these chips: `conditionsApplied` (the band conditions FB3 applies, per fight) and `storiedClimbs` (artifact ids whose Storied level rose during the fight: `recordArtifactEncounterPresence` returns `climbed` at `unifiedActionResolution.ts:1790`, which fight steps record instead of discarding).

**Why the chips read `fightState` and not traces:** traces are off unless tracing is enabled, and a chip must be state-backed (Law 56). Every chip below reads a field on the resolved action, which plan docs 1–3 write.

The one engine-adjacent addition is a pure **view-model** function per surface. Each lives in its component's adapter module and is testable without React:
- `buildOpponentHeaderModel(state, action)` for the veil;
- `buildLairMonsterCardModel(graph, lairId, tick)` for the sidebar.

## Content pillar

### Prose tables: the clock-state words
One word per fill ratio, for the header and the lair card. GAME register; words, never numerals (Law 13/14).

| Filled / size | Word |
|---|---|
| 0 | untouched |
| > 0 and < ½ | bloodied |
| ≥ ½ and < size − 1 | half-broken |
| size − 1, or size while the opponent lives (a ward or an echo) | failing |
| size, and the opponent is deceased | slain |

### Prose tables: Dread and Might as a sentence (Law 16)
The card never renders as a label strip (`dread: fair · might: steep`). It renders as one sentence: the family line, then a Dread phrase and a Might phrase. For example: *"A beast of claw and hunger. Fearsome to face, dangerous to fight."* Each phrase carries its concept tooltip (Dread, Might).

| Word | Dread phrase | Might phrase |
|---|---|---|
| gentle | easy to face | weak in a fight |
| fair | unnerving to face | a fair match |
| steep | fearsome to face | dangerous to fight |
| severe | terrifying to face | deadly to fight |

Once the temper has shown, one clause follows: *"It fights on berserk."* / *"It is stubborn."* / *"It startles easily."* / *"It bargains."* The clause carries the Temper tooltip.

### Tooltip copy
Registered in the one tooltip registry (`src/engine/tooltipResolver.ts`, Law 17), one entry each:
- **concepts:** Dread, Might, Temper, the fight clock. The UL terms behind them are seated elsewhere: Dread and Might by plan doc 2's FB1, Temper by plan doc 3's M1;
- **each clock-state word** (untouched … slain), because the words render outside the pips' own tooltip on the lair card. *Slain* is the sheet's word for a fight death (`DEATH_CAUSE_WORDS.fight`, plan doc 2), so chip, card and sheet agree;
- **each temper word** (stubborn, berserk, skittish, bargains): **not new entries.** The temper traits already get derived `attachment.trait.temper.*` ids (`buildAftermathConsequences.ts:399-405`), so the clause passes those ids and one concept is explained once;
- **each fight chip kind** (below).

**New ids live under one new prefix, `fight.*`** (`fight.dread`, `fight.might`, `fight.clock`, `fight.clock.<word>`, `fight.chip.<kind>`), and F2 adds `fight.*` to Law 17's prefix list (`laws.md:55`) in the same PR, as the law requires of a new prefix, with a changelog line naming Law 17 (`laws.md:135`) and the resolver's routing-table header updated (`tooltipResolver.ts:8-27`). **The ids are declared as literals** (one const table of every `fight.*` id), not built from templates, so the concept-id corpus sweep sees them. A derived id would owe a scanner in `conceptTooltipIds.test.ts` (`laws.md:56`).

**The clock's tooltip is cause-neutral**, so the screen stays ready for spells and items that advance a clock (plan doc 2, FB6): *"Everything that lands against it wears it down (a blow, a spell, a trick), and it heals slowly between fights."*

### Step labels
"Facing it", "First exchange", "Second exchange", "Third exchange". These are the `StepNavigator` / step-title words for `fightRole` steps, in place of generic step names. They are content constants, not prose.

### Encounter templates / attachment content / data tables
None. They come from plan docs 2, 3 and 1.

## UI pillar

*Screenshot tool: **Playwright** (DOM surfaces: the veil, the sidebar, `WorldPulse`), using the sanctioned worktree-Vite + Playwright route (`Docs/canon/verification-gates.md` § Browser-verify). The map's lair icon already exists (`locationIconRegistry`: `lair` / `cleared_lair`); no WebGL work.*

### Player-facing display

**1. The opponent header** (THR-1272). A new block in the veil, rendered **only** on steps with `fightRole`, directly under `ContextStrip`, inside the one chrome (Law 37). **It is not a second header** (THR-1478's ruling, recorded at `EncounterVeil.tsx:2116-2123`: *"we have redundancy in the interface. please merge these two into one"*). `ContextStrip` carries the scene: place, mortal, step. The opponent header carries a different subject, **who the mortal is facing and how close it is to falling**, and repeats no `ContextStrip` field. It appears only on fight steps. The veto invitation names this, since the ruling was his.

The header shows:
- `EntityVisual kind="monster"` (or the mortal opponent's portrait) at `chip` size, the smallest canonical size (Law 5);
- the opponent's **name**, clickable via `useRefRouter` (Law 21). **Who the opponent is** follows plan doc 2 §1: after the nerve step, `fightState.opponentId`; before it, the step's `opponentRef` through `resolveOpposedCastNodeId(step.opponentRef, action.supportBindings)`, else the action's `targetId`. That matters on plan doc 3's `monster.hunt.named_elite`, whose action targets the lair while the fight is against the cast `beast`: the header must name the beast;
- **one sentence** (Law 16): the family line (monsters) or the opponent's role (mortals), the Dread and Might phrases, and the temper clause once it has shown (`monsterState.temperShown`, or a hunt's track step, plan doc 6);
- **clock pips**: `StepDots variant="magnitude"` with `totalSteps = clockSize`, `currentStepIndex = clockNow`, at `FIGHT_CLOCK_PIP_SIZE` (Law 11's ~14px floor for meaning-bearing glyphs; `StepDots` defaults to 5px), followed by the **clock-state word**. There are no digits, and no fraction or percentage anywhere (Law 13).
- **Before `fightState` exists** (the nerve step, "Facing it": plan doc 2 creates `fightState` only after it resolves), the header reads the opponent card and its **recovered** clock through plan doc 2's pre-`fightState` read (`readOpponentCard(graph, opponentId, tick)`, with lazy recovery applied). That is exactly the value FB2 then records as `clockAtStart`, so the word never drops between "Facing it" and the first exchange with no blow landed. A raw `clockFilled` read would skip the recovery; the header never makes one.
- **Agent mode (a duel, plan doc 5):** when `fightState.fighterClockSize` is present (plan doc 5 writes it only in agent mode; `fightMode` lives on the steps), the header shows **both clocks**. There is the opponent's pip row, and the fighter's own pip row from `fightState.fighterClockSize` / `fighterClockNow`. Each gets its own clock-state word, since both can fall. With those fields absent (NPC mode, or before plan doc 5 lands), only the opponent's clock renders. **On an agent-mode nerve step**, before `fightState` exists, the fighter's row reads plan doc 2's `FIGHT_MORTAL_CLOCK` with nothing filled ("untouched"), the value E1 then records.
- Tooltip on the pips: the clock-state word plus the cause-neutral sentence above, from the registry (Law 17).

**One magnitude language on a fight step (Law 10).** The veil's step whisper prints *"{threatLabel} threat"* (`EncounterVeil.tsx:2038`) in its own vocabulary: a steep card would read *"Moderate"* (`buildUnifiedEncounterStageModel.ts:111`) beside *"dangerous to fight"*, two magnitude languages on one quantity (`laws.md:45`). **F2 suppresses the threat whisper on `fightRole` steps, in the model:** `buildUnifiedEncounterStageModel.ts:212` omits `header.threatLabel` on a fight step, and **both** render sites print the line only when the label is present: the full veil's whisper (`EncounterVeil.tsx:2038`) and the watched view's tier line (`:1566`). The opponent header's sentence is the fight's one statement of how hard it is. Plan doc 2's FB7 lands first and derives that label from the resolved difficulty, an accurate interim; F2 (blocked by FB7) then removes it from fight steps. Both edit `:212`, in sequence.

**Two dot rows on one fight step (Law 10).** The clock row and the `StepNavigator`'s step dots can both be four long on a four-step fight against a four-segment clock. They stay distinct three ways:
- **variant:** the clock uses `magnitude` (a filled run, no current-step marker), and the navigator uses progress (an enlarged gold dot on the current step, `EncounterVeil.tsx:3268-3273`);
- **shape:** the clock's pips are square (`StepDots shape="square"`), the navigator's dots round, as in THR-1272's mock;
- **place:** the navigator sits at the top of the content column (`EncounterVeil.tsx:2076`), above the title and `ContextStrip`; the clock sits in the opponent header below `ContextStrip`, so the title and the strip always stand between them;
- **label:** the clock row is always followed by its clock-state word, and its `aria-label` (the new `ariaLabel` prop) reads it ("half-broken").

**In the watched view** (`threadTier === 'watched'`, `EncounterVeil.tsx:1482`). A watched mortal's attended fight opens the peek/boost view, which has no `ContextStrip` and no `StepNavigator`, so the full header cannot sit there. It stays minimal but never blind: on a `fightRole` step, the tier line's threat word is replaced by **one opponent line**, the opponent's name (a link, Law 21) and the clock-state word, e.g. *"Facing the Mire Ox — bloodied"*. There are no pips and no art; the model's compact form (`buildOpponentHeaderModel`'s `line`) feeds it.

**The watched view is built by a different adapter.** The tier routing never sends a watched encounter through the unified adapter: `GameView.tsx:1381` returns `null` for a watched tier, and `:1494` falls back to `buildSimpleEncounterStageModel`, whose header sets `threatLabel` from the template's rarity (`:348`). So F2 adds the fight-step branch **there** too: on a `fightRole` step, `buildSimpleEncounterStageModel` omits `threatLabel` and attaches `buildOpponentHeaderModel(...).line`, reading the unified action the way `GameView.tsx:1516` does (`activeActionSnapshot` / `selectEncounterRuntimeForNotification`). `threatLabel: string` (`encounter-stage/types.ts:46`) becomes optional. **The watched tier builds no aftermath**, so a watched fight's result is carried by the chronicle, the digest and the lair card, not by chips. `spawnFight` opens as The First, so the watched view's tests must build their model through the tier routing (`GameView.tsx:1379-1506`), not a fixture handed to `EncounterVeil`.

**Fit at 1920×1080 (Law 33).** The header fits beside the hand and the step body without scroll. The veil is a fixed-height column, so the executor measures the header's height. If it would push the hand into scroll, the sentence's family clause truncates first (with its tooltip), and then the art tile is omitted, leaving the name, which carries the link. There is no fourth art size (Law 5).

**2. Fight consequence chips** (Law 56). The chip kinds below, each rendered **only** from a field on the resolved action's `fightState`, each **anchored to a real node**, and each placed in one of the four existing categories:

Every noun is the **sheet word for the state the engine wrote**, never a phrase minted for the scene (the chip-noun rule, `nudge-authoring-spec.md:1361-1365`, THR-1472). Sentences are 15 words or fewer; tooltips come from the registry.

| Chip | Category | Noun (the state) | Sentence | Anchor node | Rendered when (the `fightState` field) |
|---|---|---|---|---|---|
| clock | PATH (a changed world object; no magnitude) | `{opponent}'s clock` | *{fighter} wore {opponent} down to {clockWord}.* | the opponent | `fightState.persistent === true` **and** `clockNow − clockAtStart > 0`, **suppressed when the opponent was slain**. A per-fight clock (a mortal's, or both sides of a duel) ends with the action: no world object changed, and no surface could show it afterwards (`laws.md:41`, `:122`), so it gets no chip |
| slain (opponent) | PATH | `{opponent}` | *{opponent} was slain.* | the opponent (deceased) | `lairOutcome.felled` (plan doc 3). A duel's losing mortal's writes are recorded in `fightState.opponentEnding` (plan doc 5's E2; declared by plan doc 2's FB2). **No chip reads it in v1:** the duel-loser chips are a Deferral filed at handoff |
| lair cleared | PATH | `{lair}` | *{lair} is cleared.* | the lair location | `lairOutcome.lairCleared` |
| scarred | SCAR | `Scarred` | *Scarred by {victor}.* | the fighter | `ending.scarWritten` (plan doc 1) |
| slain (fighter) | SCAR | `{fighter}` | *{fighter} was slain by {victor}.* | the fighter (deceased) | `ending.face === 'slain'` (plan doc 1: the fighter's own ending) |
| condition | **by the condition's polarity**: SCAR for a loss (`wounded`, `shaken`, `terrified`), BOON for a gain (`inspired`), the adapter's own rule (`buildAftermathConsequences.ts:233`) | the condition's name | its existing condition sentence | the fighter | each id in `fightState.conditionsApplied` (FB3), deduped |
| Storied | BOON | `{artifact}'s Storied` | *{artifact} grows more storied.* | the artifact | each id in `fightState.storiedClimbs` |
| trophy | BOON | `{item}` | *{fighter} took {item} from the den.* | the new item instance | `ending.reward.instanceId` (plan doc 1) |
| standing | BOND (▲ / ▼) | `{settlement}`, the sheet's own noun: its Standings list names the place, with the tooltip `ui.reputation_with` (`OverviewTab.tsx:729-756`; the `factionStandingSentence` precedent, `aftermathWords.ts:731-736`) | gain: *{settlement} will remember this.* Loss: *{settlement} will hear of it.* | the settlement | `ending.reputation` or `ending.humiliation` (plan doc 1) |
| grudge | BOND (▼) | `{victor}` | *{fighter} holds a grudge against {victor}.* | the victor | `ending.grudgeWritten` (plan doc 1). The grudge is on the sheet's Blood section, and it feeds the hunt reason, the Old-wound advantage and the plot, so the chip names the ending's most connected mark |

**Why these categories** (UL `Encounters.md`): SCAR is what the encounter cost the character; BOON is what they earned or took (growth with its cause, prizes); BOND is who now stands with or against them; PATH is a way that has opened, including a changed world object (`laws.md:122`). A beast worn down, a beast slain and a den cleared change the world rather than the character, so they are PATH, which carries no magnitude: the clock chip's sentence carries the clock word instead of triangles. **There is no driven-off chip.** Driving a beast off writes only the lair's clearing progress (plan doc 3), which no surface shows, and the beast stays in its den; surfacing that quantity would need a surface first (`laws.md:41`). The fight's aftermath line tells that story instead.

**Precedence:** slain (opponent) suppresses clock; slain (fighter) suppresses scarred. A chip with no field never renders (Law 56).

**Whose record each chip reads.** The fighter-anchored chips (scarred, slain (fighter), condition, standing, grudge) read `fightState.ending`, which is **always the fighter's own record**: plan doc 2 declares a separate `opponentEnding` for the other side of a duel, and plan doc 5's E2 writes the loser's scar, grudge and death there. So a fighter who wins a duel and spares the loser shows none of those chips from the fighter's side, and the humiliation half of *standing* renders only when the fighter yielded.

**Chip mechanics.** `{fighter}`, `{opponent}`, `{victor}`, `{clockWord}`, `{lair}`, `{item}`, `{artifact}` and `{settlement}` are the chip synthesizer's own slots, filled from names it already holds. They are not enrichment tokens, and a test asserts that no raw `{` ever renders (Law 43). **PATH chips draw the ◆ marker with their own word.** UL PATH "draws a single scale-less marker" (`Encounters.md:125`), but the marker renders only for `direction: 'opens'` (`DeltaCluster.tsx:106-107`), and that direction is coupled to the "— a way opens" label (`buildAftermathConsequences.ts:256-261`), which reads wrong on a slain beast. So F3 decouples them: an `opens` change may carry an optional `deltaLabel` that replaces the default text. The fight's PATH chips declare `direction: 'opens'` with `deltaLabel` set to the clock word (*half-broken*), *slain* or *cleared*. Every existing PATH chip keeps its label. The **condition** chip's sentence is written into `FIGHT_CHIP_COPY` per condition (no existing builder fits: `traitGrantedSentence` sets `direction: 'gain'`, which would draw a rise on a SCAR), and its direction follows the condition's polarity.

**3. The lair card** (THR-1268 §8). Two places in `HexSidebar`:
- **A lair with a living monster** (the lair block): the monster **by name**, as a link (fixing the raw id at `:533`, a live Law 14/21 defect); the card sentence (the family line, Dread and Might phrases, the temper clause once known); clock pips and the clock-state word.
- **A lair whose monster was slain**, in either place: the Cleared Lair Section (`:541`) for a major lair that `clearLair` cleared, **and the lair block itself for a legendary lair**, which keeps its lair but loses its `namedEliteId` (plan doc 3; THR-1268 found 14 of 22 lairs legendary by tick 100, so this is the common case). When no living elite resolves, the card finds the monster by reverse lookup, as the retained deceased elite whose `lairId` names this lair (the latest `deceasedTick` if several). It shows *"slain"*, and *"slain by {name}"* **only** when the sheet's own reading names the killer (`getAgentInfoCard(...).death.by`, behind `killerIsKnown`). The lair card and the monster's sheet never disagree about who did it.

**Which card facts show:** the temper clause is hidden until the monster has fought anyone (`monsterState.temperShown`, written by plan doc 2's FB4) or a hunt tracked it. Dread and Might always show: they are the lair's reputation. This mirrors the familiarity gate's intent without its machinery.

**4. `WorldPulse`**: the "active agents" count excludes `isMonster` and deceased nodes.

**5. The monster's name link** opens the **existing agent sheet**. Its sections a monster lacks (ambitions, faction, bonds) show their existing empty states. A monster-specific sheet (family, card, temper, wounds across visits) is **deferred to the v2 layer**, recorded next to the moments deferral below. This is THR-1272's "monster-appropriate empty states", scoped down.

### Event notifications
None new. **How a fight reaches the player** follows the attention matrix, which this doc does not change:
- `fight.lair.confront` is pinned at `intrinsicTier: 'story_beat'` by plan doc 2's FB7, the same tier as `monster.hunt.named_elite`;
- **The First and retinue:** `story_beat` → the veil opens;
- **a watched mortal:** demoted to `shaping`, so the fight surfaces only through an attended thread tug, which opens the **watched view** with its one opponent line (UI item 1). Otherwise it resolves into the digest, and a **marked** ending also writes plan doc 1's chronicle line;
- **unthreaded mortals:** invisible while it happens. The lair card and the chronicle carry the result.

**Deviation from THR-1272, recorded (route b):** THR-1272 proposed a `MomentCard` for followed mortals' marked fights. Moments are **undertaking-scoped** (`UndertakingMomentClass`, `strategicAction.ts:991`), and a fight moment class would stretch that system beyond its type. So:
- a followed-but-unattended mortal's marked fight shows **only** as plan doc 1's chronicle line and the lair card, not as a moment;
- **fight moments** and the monster-specific sheet move to the map's v2 layer, with a follow-on ticket filed in the Physical Conflict project at handoff and a note on the closed map (THR-1258);
- the veto invitation to Christian carries this description.

### Debug inspection (DebugPanel)
`window.__DEBUG.getLairMonsterCard(lairIdOrName)` (F1), `getOpponentHeaderModel(actionId)` (F2) and **`getFightChips(actionId)`** (F3: the chip view-models for a resolved fight's aftermath) return the view-models the components render, so a Done-when can assert what the screen shows. Review fights are staged with plan doc 2's `spawnFight(targetIdOrName, { clockFilled?, outcome? })`, which moves `@hero` to the target's location first and returns `{ actionId }`: `clockFilled` presets the opponent's clock through `advanceFightClock`, and `outcome` pins the band through the existing `setOutcomePin` (THR-1030).

**The review route** for every slice: `?view=game&seeded&size=medium`, then `window.__DEBUG.tick(n)`. Elites first exist at tick 50 and worldgen lairs turn legendary from tick 75 (`lairEscalation.ts:39/66/69`), so a **major** lair is reviewed at tick 60 (`listMonsters()` filtered to `lairTier === 'major'`) and a **legendary** one at tick 100 or later.

### Visual presence (HexMapV2)
None new. The lair and cleared-lair icons exist; a slain monster's major lair becomes `cleared_lair` through plan doc 3, and the icon follows.

### UI Laws engaged
- Law 1 (every concept carries image, tooltip and link);
- Law 3 (one resolver);
- Law 5 (three canonical sizes; the header uses `chip` and omits art rather than invent a fourth);
- Law 8 (knowledge gating: monster imagery in the header, sidebar and chips is deliberately not gated; the sheet is v2);
- Law 11 (glyph floor: the clock pips at `FIGHT_CLOCK_PIP_SIZE`);
- Law 10 (distinct meanings, distinct vocabularies: the clock row versus the step dots);
- Law 13/14 (words, never numerals, never raw keys);
- Law 15 (no third magnitude language; `StepDots` reused);
- Law 16 (no key:value strips; the card is a sentence);
- Law 17 (tooltips from the registry, new concepts registered);
- Law 21 (clickable names);
- Law 29 (the monster `EntityVisual` kind gets a styleguide sample);
- Law 33 (1920×1080, no scroll);
- Law 37 (one chrome);
- Law 43 (no raw tokens: the chip synthesizer fills its own slots);
- Law 56 (chips are state-backed and anchored).

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Add rows for the opponent header, the fight chips, the lair monster card, and the `WorldPulse` fix.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `buildOpponentHeaderModel` | — (render) | `EncounterVeil` → new `OpponentHeader` | reads `unifiedActions[].fightState`, the opponent card, `monsterState.temperShown` | — | `getOpponentHeaderModel` |
| Fight chip kinds | — | consequence-chip block | reads the resolved action's `fightState` (`result`, clock, `ending`, `lairOutcome`, `conditionsApplied`, `storiedClimbs`); the `fightState` → changes step happens in the adapter's caller, `buildUnifiedEncounterStageModel.ts:~756`, because `buildAftermathConsequences` takes `changes` (`:645-648`) | — | new `getFightChips(actionId)` |
| `buildLairMonsterCardModel` | — | `HexSidebar` lair block + Cleared Lair Section | reads `monsterState`, lair props, the retained elite's `lairId`, `killerIsKnown` | — | `getLairMonsterCard` |
| `WorldPulse` count | — | `WorldPulse` | reads graph with `isMonster` | — | — |
| `EntityVisual` monster kind | — | `EntityVisual` in the header, the sidebar and chips. **Not the agent sheet in v1:** it calls `resolveEntityVisual({ id, kind: 'agent', … }, null, …)` with no graph (`AgentProfileModal.tsx:131-135`), so no refinement reaches it; a monster's sheet portrait belongs to the v2 monster sheet (the follow-on ticket) | `deriveKind` (`entityVisualResolver.ts:105-113`) returns `monster` for an `isMonster` node, instead of the person kind `agent` that is knowledge-gated to a silhouette (`:220`). **Chips pass `visualKind` explicitly** (`chipCollaborators.ts:34`, `:49`), so `deriveKind` never runs for them: F1 refines an explicit `agent` on an `isMonster` node to `monster` inside `chipCollaborators.buildChipIconResolver`, which holds the graph. Monster imagery is **not knowledge-gated** (Law 8): a beast's look is public, like its lair | — | styleguide sample |
| Concept tooltips | — | every surface above | — | — | the registry's own conformance tests |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIGHT_STEP_LABELS` | `['Facing it', 'First exchange', 'Second exchange', 'Third exchange']` | Step titles for fight steps |
| `CLOCK_STATE_WORDS` | `untouched / bloodied / half-broken / failing / slain` + thresholds above | Clock fill → word |
| `FIGHT_CHIP_COPY` | the chip table above (noun, sentence, tooltip id, precedence) | One registry entry per chip kind |
| `DREAD_PHRASES` / `MIGHT_PHRASES` | the table above | Card words → sentence phrases (Law 16) |
| `TEMPER_CLAUSES` | the four clauses above | Temper → clause, once shown |
| `FIGHT_CHIP_CATEGORY` | the chip table above | Chip kind → SCAR / BOND / BOON / PATH |
| `OPPONENT_HEADER_ART_SIZE` | `'chip'` (the veil's 40 px tile) | Header portrait size; omitted, never shrunk further, when space runs out |
| `FIGHT_CLOCK_PIP_SIZE` | `14` (px) | Clock pip size, at Law 11's floor for meaning-bearing glyphs; the square-versus-round distinction needs it |

## Tracing

N/A — this doc renders and emits no engine traces. Render correctness is asserted through the two debug view-model accessors (`getOpponentHeaderModel`, `getLairMonsterCard`) and component tests; the state it reads is written by plan docs 1–3.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Fight step with no resolvable opponent (a template without a card) | The header renders the default card as "an unknown foe", with no link. Review Done-whens assert a named opponent, so this fallback can never satisfy one |
| Monster family has no art key | `EntityVisual`'s real chain: the kind's art (v1: the existing `monster` portrait, `src/data/portrait-assets.ts:27`, `/portraits/monster.png`), then the designed glyph tile. There is no sphere-art tier |
| `namedEliteId` dangling, and no retained deceased elite names this lair | The card omits the monster row; no raw id ever renders |
| The killer is not known (the sheet names none) | "slain", with no name |
| A chip's `fightState` field is absent (plan doc 1 or 3 not landed, or the writer declined) | The chip does not render (Law 56: no write, no chip) |
| Chip anchor node missing | The chip does not render |
| `fightState` absent (the nerve step) | The header reads the card and its recovered clock through plan doc 2's pre-`fightState` read; in agent mode the fighter's row reads `FIGHT_MORTAL_CLOCK`, untouched |
| A per-fight clock advanced | No clock chip (only `persistent` clocks are world objects) |
| A watched mortal's fight | The watched view shows one opponent line (name and clock word); no threat word |
| Header would push the hand into scroll at 1920×1080 | The family clause truncates with its tooltip, then the art is omitted; the hand never scrolls |

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| fight state → veil | **add** (read) | `OpponentHeader` |
| monster card → sidebar | **add** (read) | `HexSidebar` |
| fight endings (`fightState.ending` / `lairOutcome`) → consequence chips | **extend** (read) | the chip block |

Read-only contracts. The executor records them in `Docs/canon/interface-map.md` with the writers from plan docs 1–3.

## Three-pillar check

- [x] Engine N/A with rationale (reads only; view-models are pure adapters)
- [x] Content present (clock-state words, the card sentence tables, concept tooltips, step labels)
- [x] UI present (header, chips, lair card in both sidebar sections, the `WorldPulse` fix, the name link; laws enumerated)
- [x] Wiring section connects them

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `Vision/02-non-negotiables.md` §3 ("all mechanics surface through prose, never numbers") and `Vision/taste-profile.md` (the player learns "by reading, not by reading a tooltip with a stat block"): the card is a **sentence** ("fearsome to face, dangerous to fight"), the clock is pips and a word, and no label strip renders (Law 16).
  - `Vision/02-non-negotiables.md`: the god is not the protagonist. The header shows the mortal's opponent, while the god's hand stays where it always is.
  - `Vision/01-core-loop.md`: the fight is a chapter of an encounter, in one chrome.
  - `Vision/03-design-tensions.md`, tension #2 ("Systemic emergence vs. authored moments"): the moments deferral is a call on it. A fight moment would stretch the undertaking-scoped Moments system, so a followed mortal's fight reaches the player through the authored chronicle line and the lair card instead.
- [x] No Vision edit needed.

## Rulebook impact

- [x] Rules of play are unchanged (this doc renders what docs 1–3 rule).
- [x] `Docs/canon/rulebook.md` gets no edit from this doc. If a slice finds the rulebook's §7 "Fights" wording diverging from what the screen shows, the fix lands in that slice.

> Brainstorm companion: `Docs/plans/2026-09-23-fight-on-screen-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Words, phrases, thresholds, labels and chip categories are named constants |
| 2. Inspectability | PASS | View-model debug accessors show exactly what renders |
| 3. Determinism | PASS | Rendering only; no randomness |
| 4. Fail-soft | PASS | See the table; no raw id ever renders, and no chip renders without its write |
| 5. Narrative over mechanical perfection | PASS | The card reads as a sentence and the clock as a word ("half-broken"), not meters |
| 6. Additive over destructive | PASS | A new block, chip kinds inside the existing four categories, an entity kind, and two defect fixes |
| 7. Performance budget | PASS | The header and chip view-models are O(1) per render. The lair card's reverse lookup scans one lair's hex, and its `getAgentInfoCard` call is not O(1), so the card model is memoized on `worldVersion` (the load-bearing rule) and computed once per world change, not per render |

## Slices

Each slice is one Linear issue in the Physical Conflict project, **not** a child of the map. **UI-pillar evidence (THR-688 rule C):** each slice's closing commit carries the four-part browser-verify evidence:
- a 1920×1080 Playwright screenshot;
- console output;
- a `window.__DEBUG` assertion;
- a UI-Laws line citing at least Laws 1, 13/14, 17, 21, 33 and 37, plus 5, 10, 15, 16 and 56 where the slice engages them.

| Slice | Scope | Blocked by | Done-when |
|---|---|---|---|
| **F1: Monsters named and counted right** | The lair block shows the monster by name, as a link (fixes `:533`); `WorldPulse` excludes monsters; the `EntityVisual` monster kind (**`deriveKind` returns it for `isMonster` nodes**; v1 art is the existing `monster` portrait; eight pre-baked family portraits are a follow-on art ticket filed at handoff) + styleguide sample; `buildLairMonsterCardModel` (name only) + `getLairMonsterCard`; **chips refine an explicit `agent` on an `isMonster` node to `monster`** | M1 (plan doc 3) | Screenshot of a major lair's sidebar with the monster's name; `getLairMonsterCard` returns the name; no raw `elite_` string in the DOM (a test asserts it); the `WorldPulse` count equals the non-monster, living individuals (a test); **a chip anchored to a monster draws the monster portrait, not an initial-letter tile** (a test) |
| **F2: The opponent header** | `OpponentHeader` + `buildOpponentHeaderModel`; the card sentence; the pips on `StepDots`; clock-state words; step labels; the Law 10 distinction; **the agent-mode both-clocks rule** (renders when the fields exist); concept tooltips for Dread, Might, Temper and the clock; **the watched view's fight branch in `buildSimpleEncounterStageModel`**; the opponent resolution before `fightState` | FB7 (plan doc 2), M1, **F1** (F2 renders `kind="monster"`, which F1 adds to `EntityVisualKind`, `entity-visual-fallbacks.ts:21`) | On the review route at tick 60: `const m = (await window.__DEBUG.listMonsters()).find(x => !x.deceased && x.lairTier === 'major'); const { actionId } = await window.__DEBUG.spawnFight(m.name)`, then a screenshot mid-fight at 1920×1080 with the header visible and the hand not scrolled; **`getOpponentHeaderModel(actionId).name === m.name`** (never "an unknown foe"); **the step's threat whisper is absent on fight steps, in both the full veil and the watched view** (a test each, the watched one built through the tier routing, `GameView.tsx:1379-1506`); **on `monster.hunt.named_elite` (target: the lair) the header names the beast on the nerve step** (a test); **the step titles read "Facing it", "First exchange" …** (a test); **the nerve step's header shows the same clock word the first exchange starts from**, including with a pending recovery (a test); **the watched view on a fight step shows the opponent's name and clock word** (a test); the pips render at `FIGHT_CLOCK_PIP_SIZE`; `fight.*` is in Law 17's prefix list; the clock pips are square and carry an `aria-label` (a test) and its clock word matches `getFightState`; no key:value strip in the DOM (a test); **with an agent-mode fixture `fightState` (both clock fields present), the view-model carries both clocks and both words** (a unit test; the live screenshot follows once plan doc 5's E1 lands); the Law line |
| **F3: Fight chips** | The chip table's kinds and their copy, each in its existing category, each reading `fightState`; per-chip tooltip entries | F2, M3, D1, D2 | On the review route at tick 60, against a major lair's monster: `spawnFight(m.name, { clockFilled: size − 1, outcome: 'critical_success' })`, then a screenshot of the aftermath showing "slain" and "lair cleared" (PATH), and "standing" (BOND) **when `ending.reputation` is present** (it needs a settlement within `FIGHT_GRATITUDE_RADIUS_HEXES`); the chips are asserted from the view-model, not from `getOutcomePinVerdict()` (FB7's aftermath need not author a `critical_success` band); each chip's anchor node resolves (a test); **each chip is absent when its `fightState` field is absent** (a test per chip); the slain-opponent chip suppresses the clock chip (a test); **`inspired` renders as BOON and `wounded` as SCAR** (a test); **the grudge chip renders when `ending.grudgeWritten`** (a test); **a per-fight clock produces no clock chip** (a fixture test); **with an agent-mode fixture where the fighter wins and spares the loser, none of scarred, slain (fighter), grudge or the humiliation half of standing renders** (a test); no raw `{` renders in any chip (a test); **a PATH chip draws the ◆ marker with its own `deltaLabel`, and an existing PATH chip keeps "a way opens"** (a test); the standing chip's noun is the settlement's name; `getFightChips(actionId)` equals what the aftermath renders |
| **F4: The lair card** | The card sentence, pips and the temper reveal rule in the lair block; the slain card in the Cleared Lair Section and, for a legendary lair, the lair block (reverse lookup by `lairId`; "by {name}" behind `killerIsKnown`) | F1, M3, FB7 | Screenshots of the lair card untouched, half-broken, slain at a major lair (in the Cleared Lair Section, tick 60 route) and **slain at a legendary lair (in the lair block, tick 100+ route)**; `getLairMonsterCard` matches `listMonsters`; the temper clause is absent before any fight and present after one (a test); "slain by {name}" renders when the monster's `getAgentInfoCard(...).death.by` is set and not when it is absent (a test each way) |

## Kill criteria

- **Any slice, before merge:** if the header pushes the hand into scroll at 1920×1080 after the fallback (family clause truncated, art omitted), the header design is wrong. Stop and rethink the layout rather than scroll (Law 33).
- **F3, before merge:** if any chip can render without its `fightState` write, that is a Law 56 defect. Block the merge.

## Done when

- [ ] F1–F4 each closed by its own PR with the four-part browser-verify evidence
- [ ] Styleguide entry for the monster `EntityVisual` kind (Law 29); tooltip registry entries for Dread, Might, Temper, the fight clock, every clock-state word, every temper word and every fight chip kind (Law 17)
- [ ] No raw node id renders anywhere in the lair block or the Cleared Lair Section (a component test asserts it for a fixture with an elite)
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; the close keyword for that slice's issue on its own line in the commit and PR body
- [ ] This doc writes no engine state: `temperShown` is FB4's, `fightState.ending` is plan doc 1's, and `fightState.lairOutcome` is plan doc 3's

## Coordination block

**Suggested model:** opus. The veil is the busiest surface in the game, and the laws are strict.

**Parallel-safe with:**
- the engine slices FB1–FB6, D1, D2 and M2–M4: none touches `src/components/`, and none edits this doc's adapter files.

**Mutex with:**
- F2 with plan doc 2's FB7 and plan doc 3's M1: all three edit `src/debug-bridge.ts`/`.d.ts` (FB7 and M1 are F2's blockers, so this holds by construction);
- any slice editing `EncounterVeil.tsx`, `HexSidebar.tsx`, `buildAftermathConsequences.ts` or `src/engine/tooltipResolver.ts`;
- F2 and F3 with each other, since both touch the veil's chip and header area;
- F1 and F4 with each other (both edit `HexSidebar.tsx`; F4 is blocked by F1);
- F1 with plan doc 2's FB7, F2, F3 and plan doc 1's D1: all edit `src/debug-bridge.ts`/`.d.ts` (F2 is blocked by F1; FB7 and D1 run before or after it).

**Files to touch:**
- F1: `src/components/Game/HexSidebar.tsx`, `src/components/Game/WorldPulse.tsx`, `src/components/shared/entityVisualResolver.ts`, `src/data/entity-visual-fallbacks.ts` (where `EntityVisualKind` is declared), the chip collaborator's render-time refinement (`src/components/Game/encounter-stage/adapters/chipCollaborators.ts`, inside `buildChipIconResolver`, as the UI table's `EntityVisual` row says; corrected 2026-09-24 from `worldRefAdapters.ts`), `src/components/StyleGuide/StyleGuide.tsx`, a new lair-card adapter, `src/debug-bridge.ts`/`.d.ts` (`getLairMonsterCard`)
- F2: `src/components/Game/EncounterVeil.tsx` (the header, both whisper render sites, the watched view's opponent line), `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts` (the watched view's fight branch), `src/components/Game/GameView.tsx` (the unified action handed to it), `src/components/Game/encounter-stage/types.ts` (`threatLabel` optional), `src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts` (`header.threatLabel` omitted on fight steps; after FB7), `Docs/design-system/laws.md` (the `fight.*` prefix in Law 17), `src/components/shared/StepDots.tsx` (the `shape` and `ariaLabel` props, plus their styleguide entry, Law 29), new `src/components/Game/encounter-stage/OpponentHeader.tsx`, a new adapter under `encounter-stage/adapters/`, `src/engine/tooltipResolver.ts`, `src/debug-bridge.ts`/`.d.ts` (`getOpponentHeaderModel`)
- F3: `src/components/Game/encounter-stage/adapters/buildAftermathConsequences.ts` (the chip synthesis and the optional `deltaLabel`), `src/components/shared/DeltaCluster.tsx` (render the label), `src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts` (the `fightState` → changes step; plan doc 2's FB7 also edits this file, so F3 follows FB7), `src/engine/tooltipResolver.ts`, `src/debug-bridge.ts`/`.d.ts` (`getFightChips`)
- F4: `src/components/Game/HexSidebar.tsx`, the lair-card adapter (reads `monsterState.temperShown`, and `getAgentInfoCard(...).death` for the slain monster; no engine change here)

## Notes for the executor

- **Never** render a digit for the clock, Dread or Might, and never a `word: value` strip. If a reviewer asks for "3/4", the answer is the pips and the word (Law 13); if they ask for "dread: fair", the answer is the sentence (Law 16).
- Use `StepDots variant="magnitude"`. Do not invent a new pip component (Law 15).
- A chip without a real write behind it is a released defect (Law 56). Read `fightState`, never the trace buffer: traces can be off.
- Do not add a fifth consequence category. Every fight chip fits one of the four existing ones (the chip table).
- The `WorldPulse` fix is one predicate: `!isMonster(node) && node.properties.deceased !== true`.
- Review fights with `spawnFight`, not `?spawn=`: the URL lever stages the template without a named opponent, and the header would show "an unknown foe". Tick first: no monster exists before tick 50.
- Every chip reads `fightState`. If a chip seems to need a trace, the engine is missing a record; add it to the owning plan, not a trace read here.
- `getAgentInfoCard`'s doc comment is stale: it says it returns null when there is no thread edge (`agentDetail.ts:1378`), but it returns a card for any node (`:686-691`). Trust the code.
- **"slain by {name}"** follows the sheet's `killerIsKnown`. Plan doc 2's FB2 makes a fight death read as seen (a fight is a public deed, and the chronicle names the victor), so the lair card names a den-slayer whenever the chronicle does.

## Intent-judge verdict

*intent-judge, run 5 of 5, 2026-09-24. **Allow**, impact class Reversible (judge-confirmed).*

- **Model slip, recorded:** `INTENT_JUDGE_MODEL` is `fable`, but the account's Fable limit was exhausted (HTTP 429), so every run was on Opus 5.5. The judge recorded the anti-correlation slip; treat this as a partial-guarantee verdict (impediment #1060).
- **Run history:** runs 1–3 returned Revise, with 11, 10 and 9 findings. Run 4 returned Revise with 4 blocking GAPs. Run 5 returned Allow, with 1 GAP (the watched view's adapter) and advisories.
- **The GAP and advisories, folded in before commit:**
  - The watched view is wired through `buildSimpleEncounterStageModel`, via the tier routing. No aftermath is built there.
  - The opponent is resolved before `fightState` exists: `opponentRef`, else the target.
  - F2 is blocked by F1.
  - The monster kind reaches the header, sidebar and chips. The agent sheet waits for the v2 monster sheet.
  - PATH chips draw the ◆ marker with their own `deltaLabel`.
  - The standing chip's noun is the settlement's name.
  - The `fight.*` ids are literals, and the Law 17 changelog line and the resolver header are updated.
  - The header is a different subject from `ContextStrip` (THR-1478's ruling), and this is named for the veto.
  - PATH is in the category constant. Line numbers are updated. The step labels are tested.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-24 (three sonnet auditors, in parallel, after the intent-judge Allow).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Explicit Constants table (`FIGHT_STEP_LABELS`, `CLOCK_STATE_WORDS`, `FIGHT_CHIP_COPY`, `DREAD_PHRASES`/`MIGHT_PHRASES`, `TEMPER_CLAUSES`, `FIGHT_CHIP_CATEGORY`, `OPPONENT_HEADER_ART_SIZE`, `FIGHT_CLOCK_PIP_SIZE`) — words, thresholds, sizes all named |
| 2. Inspectability | PASS | Debug bridge trio `getOpponentHeaderModel`/`getLairMonsterCard`/`getFightChips`; Wiring table's Debug-visibility column filled for every row; the no-trace choice is stated with rationale ("Render correctness is asserted through the two debug view-model accessors... and component tests"), matching the checklist's own "stated rather than assumed" precedent |
| 3. Determinism | PASS | Engine pillar declares reads-only, "writes no engine state"; no PRNG anywhere in the doc |
| 4. Fail-soft | PASS | 10-row Fail-soft table: unresolved opponent, missing art key, dangling `namedEliteId`, unknown killer, absent chip field/anchor, pre-`fightState` nerve step, scroll overflow — each with a named fallback |
| 5. Narrative over mechanical | PASS | Card is one sentence, never a label strip (Law 16); clock is pips + word ("half-broken"), never digits/fractions (Law 13/14) |
| 6. Additive over destructive | PASS | Substrate inventory: every row "extends"/"reuses"/"fixes"; explicitly "No fifth category"; `threatLabel` widened to optional (non-breaking); two named defect fixes, not refactors |
| 7. Performance budget | PASS | Header/chip view-models are O(1) per render; lair card's non-O(1) reverse lookup + `getAgentInfoCard` call is memoized on `worldVersion`, citing the codebase's load-bearing versioning invariant |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | N/A-with-rationale | `Engine: N/A. **This doc writes no engine state.**` — explicit stub with a full read-inventory (fields from plan docs 1–3) and two pure view-model functions named; no subsections fabricated |
| Content | present-and-substantive | Real prose tables (clock-state words, Dread/Might phrase tables, temper clauses), tooltip-copy spec with a new `fight.*` prefix, step labels; encounter templates/attachment/data tables explicitly "None" with a cross-reference reason |
| UI | present-and-substantive | Full player-facing spec (header, chips, lair card, WorldPulse fix, name link), event-notification routing, debug accessors (`getOpponentHeaderModel`, `getFightChips`, `getLairMonsterCard`), visual-presence note, screenshot tool stated, 12 UI Laws cited |

**Missing required sections:** No missing required sections. All template sections are present: frontmatter, Why-load-bearing, Substrate inventory, Engine/Content/UI (each done or N/A-with-reason), Wiring, Constants table, Tracing (N/A-with-reason), Fail-soft table, Three-pillar check, Vision audit, Rulebook impact, Brainstorm-companion pointer, NFP table, Done-when, Coordination block, Notes for executor, Forked-audit placeholder. Blast Radius is absent but is template-CONDITIONAL (≥100 importers) and none of the "Files to touch" (`EncounterVeil.tsx`, `HexSidebar.tsx`, `GameView.tsx`, `buildAftermathConsequences.ts`, etc.) are on CLAUDE.md's named high-impact list — correctly omitted, not flagged.

**Wiring check:** Yes — the Wiring table (lines 204-211) connects every active module (`buildOpponentHeaderModel`, fight chip kinds, `buildLairMonsterCardModel`, `WorldPulse` count, `EntityVisual` monster kind) to its UI component, the GameState field it reads, and its debug accessor; Orchestrator phase and Trace columns are correctly "—" throughout, consistent with the doc's Engine-N/A / Tracing-N/A status.

**Substrate check:** N/A (no Engine pillar) — `three_pillars` frontmatter states Engine `N/A`.

PILLAR AUDIT: PASS

### Vision audit

**1. Vision premises touched**

- `Vision/00-north-star.md` → not cited by plan; independently touches "weight of threads... every bond, every favor, every grudge... is load-bearing" (grudge/standing/scarred chips) and "the pleasure is witnessing, not steering" (chips/lair card/chronicle) — [silent, but substantive]
- `Vision/01-core-loop.md` → "the fight is a chapter of an encounter, in one chrome" — [confirmed]; "aftermath exists so consequences compound" via the SCAR/BOND/BOON/PATH chip taxonomy — [extended]
- `Vision/02-non-negotiables.md` → §1 god/protagonist ("the god's hand stays where it always is") — [confirmed]; §3 prose-never-numbers (sentence card, pips+word, "no digits... anywhere") — [confirmed]; §6/§7 addressed via NFP table and three-pillar check — [confirmed]
- `Vision/03-design-tensions.md` → not cited; independently navigates Tension 2 (declines to stretch the undertaking-scoped Moments system onto fight endings, routing instead to chronicle + lair card) — [silent, but a real navigation call]
- `Vision/taste-profile.md` → "by reading, not by reading a tooltip with a stat block" — [confirmed]; prose examples ("A beast of claw and hunger. Fearsome to face...") match the plain-register bar (narrate, state facts, no closing abstraction) — [confirmed, uncited]

**2. Vision contradictions**

No contradictions found.

**3. Five qualitative checks**

- **North star:** Indirect support — a pure witnessing/display layer (no new intervention moment), but strengthens legibility of "weight of threads."
- **Core loop:** Preserves the rhythm — one chrome (Law 37), watched-tier demotes to a compact line respecting the attention-spotlight system, chips make the aftermath beat visible.
- **Non-negotiables:** Clean — zero new player-control surface; reads existing engine state only, no new node types or property-bag relationships.
- **Design tensions:** No hard lean; note — the plan's own Vision-audit section doesn't name Tension 2 despite making a real call on it.
- **Taste profile:** Strong compliance — no numbers/percentages, plain narrator-mode prose, reuses existing pip/marker vocabulary rather than inventing a new magnitude language.

`VISION AUDIT: PASS-with-notes`

**Author's response to the note:** the plan's Vision audit now names tension #2 (the moments deferral is that call).
