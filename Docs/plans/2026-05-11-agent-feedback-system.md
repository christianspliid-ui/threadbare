---
status: proposal
date: 2026-05-11
author: Cowork
project: Social Systems Expansion
linear: TBD
domain: social, prose, ui
ul_shards: [Agents, Cosmology, Prose, Encounters]
---

# Agent Feedback System — Mortals Respond Through the Thread

> The thread is currently one-way. The god reaches down; the mortal receives. This design adds the symmetric return channel — mortals reacting to divine treatment in ways that tell stories, modulate their behavior, and reach the player as the dramatic centerpiece of the threading mechanic.

## 1. Premise

Today, when the player invests in a mortal — burns essence intervening in their encounters, fires divine actions on them, promotes them through the court — the mortal receives the effect but never responds. They cannot pray, curse, doubt, or refuse. They cannot show the player whether the relationship is reverence, fear, or simmering rebellion. The thread has no return channel.

This is the missing half of the loop. The Threadbearer game premise is that the player is a god whose mortals are sovereign and reactive — see `Docs/canon/prose.md` § Player-as-god framing. If the only signal flowing back is "the action resolved," the mortals are no more alive than chess pieces. **Mortal response IS what makes the asymmetry visible.**

The feature treats threaded agents as evaluators of their god. They accumulate a private opinion shaped by:

- **What the player does to them** (divine actions targeting them, essence invested in their encounters)
- **What kind of god the player is being** (sphere/reach character of those interventions vs. the mortal's own identity)
- **What they know** (the existing `awareness` field on the thread edge — `unaware | intuition | faith | communion`)
- **Who they are** (axiological profile from `src/types/agent.ts`)
- **Where they stand** (Divine Court position, faction worship membership, rival Ascendant pressure)

That private opinion expresses itself back through the thread as prayers, curses, contemplations, sacrifices, plea, refusals, and — at the dramatic apex — communion. The player sees these expressions through normal interfaces (character sheet, chronicle) and through proactive between-turn vignette popups that say *"you feel, through the thread, that Kael is praying to you."*

The feature ships in phases because the surface is large. Phase 1 establishes the engine state and minimum-viable visibility (character-sheet panel + chronicle integration). Later phases add the dramatic apex behaviors (refusal, sacrifice, communion-question) and the more ambitious UI (between-turn popups, retinue speech bubbles).

## 2. Goals & Non-Goals

### Goals

- **Make the thread feel two-way.** Mortals visibly respond to how the player treats them.
- **Reward consistency, punish whiplash.** Players who treat a mortal in line with their identity get reverence. Players who push a mortal against their identity get drift, defiance, or breakdown.
- **Surface response through normal interfaces and proactive moments.** Don't make the player dig.
- **Tell stories.** Every visible feedback event reads like a moment, not a label (per `Docs/canon/prose.md` quality bar question 3).
- **Compose with existing systems.** Use thread-edge schema, axiological profile, awareness, court position, factions — not invent parallel structures.
- **Be tunable from the start.** Every threshold, weight, and cadence is a named constant (NFP #1).

### Non-Goals

- **Not a numeric devotion bar.** The state exists internally as numbers; the player only ever sees prose stances ("Reverent," "Defiant") and discrete moments. No `Devotion: 0.73`.
- **Not player-authored mortal dialogue.** All prose is template-driven via `enrichProse()` (per Vision premise — player never speaks for the mortal).
- **Not romance / parasocial affection.** This is divine relationship — reverence, fear, sovereign defiance, sacrificial love. Not "Kael likes you 73%."
- **Not a full rival-thread system.** Rival pressure enters as a static aggregate signal today; upgrades when THR-66 (Rival activation) ships. We must work today and improve later, not block.
- **Not a refusal-on-everything system.** Refusal is the dramatic apex, gated by extreme stance + personality + awareness. Common-case interventions always resolve.
- **No mid-turn interrupt popups.** Game is turn-based (memory `project_turn_based.md`). Feedback popups fire on turn-start, not mid-tick.

## 3. Player Experience — Three Concrete Scenarios

These are written first to ground the design (per `Docs/canon/prose.md` "When in doubt, write the scene first").

### Scenario A — Reverent First (the happy path)

Kael Thornweaver is the player's First. The player has whispered to him before every major encounter, granted him visions of his rivals, and steadied his hand in the duel that earned him the Resolute trait. His awareness has climbed from `intuition` to `faith`. His axiology runs Sworn (loyalty +) and Martyr (sacrifice +). His devotion accrues fast.

**Turn 47 — character sheet.** The player opens Kael's profile. The Bonds tab now has a section titled *"Through the Thread."* It reads:

> Kael's stance: **Reverent.** He has begun praying to you in the long hours before dawn — words you can almost make out. He believes you are watching.
>
> *Recent moments:*
> — Tick 42: A prayer of thanks for the duel ("I should have died. I didn't. I know who held the blade steady.")
> — Tick 38: He carved your sigil into the haft of his spear.
> — Tick 31: When the rival's whisper-witch tried to pull at him, he refused her. Without knowing why.

**Turn 51 — between-turn vignette popup.** As the player ends turn 50 and the new turn opens, a popup arrives — not an encounter, just a moment:

> *Through the thread, you feel a weight settle. Kael has knelt. The river is at his back; the campfire is low. He is not asking for anything. He is just letting you watch.*
>
> *He thinks of his wife, who died last winter. He thinks the thought as an offering.*

The popup dismisses with a click. No choice, no mechanic — pure feedback.

### Scenario B — Brittle Saint (the conflict path)

Lyra Ashwell is a Witness archetype (Eye reach, revelation+/discretion–). She values truth, observation, the slow accretion of evidence. The player has been threading her hard through *Wrath-aligned* interventions — pushing her to confront, to accuse, to act fast. Her devotion has grown but so has her Sovereignty Tension: the interventions don't fit her shape.

**Turn 73 — chronicle entry.** A chronicle entry appears in the Chronicle Panel under her name:

> *Voice: Witness.* Lyra sat with the evidence she had been told to ignore. The Veil-keeper's ledger was clear: the accusation was wrong. The god had pushed her toward the wrong man. She set down her pen. She did not pick it up.

**Turn 74 — between-turn vignette popup.**

> *Through the thread, you feel a question. Not a prayer — a question. Lyra is asking what kind of god you are. The thread goes quiet for a moment. When it returns, she is still threaded — but she has noticed. She is watching you back.*

The popup is the first warning. Her stance has shifted from Reverent to **Brittle**. Continue down this road and she'll move to Defiant.

### Scenario C — Defiant Apex (the failure mode)

A different run. Hara the Renegade (Heart reach, ambition+/loyalty–). The player has tried to make her a saint. She has resisted. Her stance is now **Defiant** at full intensity.

**Turn 102 — the player tries to intervene.** An encounter opens: Hara is about to flee the city ahead of a faction reprisal. The player burns essence to whisper *steady her — make her stand and fight.* The intervention resolves but with a special outcome: **Refusal.**

The encounter vignette renders:

> *Hara hears you. She has heard you for a long time now. She walks faster.*
>
> *"I know what you want," she says to no one — to you. "I am not a saint. I never was. I have walked your path. I will not walk it further."*
>
> *She leaves the city. The thread does not break — gods do not let go so easily — but she has refused. You feel it like a tendon pulling against a binding.*

The intervention's mechanical effect is reversed (her stand-and-fight check fails by design). She gains a transient `Defiant Refusal` attachment that hardens her against the next intervention. The Chronicle records the moment in its highest tier.

This is the apex behavior — rare, costly, dramatic, and unforgettable. Most playthroughs never see it. The ones that do remember it.

## 4. Treatment Inputs — What Drives Feedback

The system reads the following signals every tick or on event. Each contributes to the three internal dimensions (§5). Inputs are deliberately heterogeneous — some are continuous, some are discrete, some are derived from existing graph state.

| Signal | Source | Cadence | Contributes to |
|---|---|---|---|
| **Divine action targeted at agent** | `ascendantFeedback.ts` intervention history + new index on per-agent target | On action | Devotion (helpful), Awe (any), Sovereignty Tension (identity mismatch) |
| **Essence invested in agent's encounter** | EncounterVeil intervention pipeline | On encounter close | Devotion (proportional to outcome benefit), Awe (proportional to essence amount) |
| **Awareness tier** | Existing `ThreadEdgeProperties.awareness` | Steady-state multiplier | Awe (higher awareness → higher amplitude), Devotion (higher awareness → faster gain *and* faster loss) |
| **Personality (axiological profile)** | `src/types/agent.ts` — 9 ValuePair vector | Steady-state weights | All three dimensions (per-pair receptivity table — §6) |
| **Identity-mismatch sphere/reach** | Comparison of intervention sphere/reach to agent's archetype-axis tilt | On action | Sovereignty Tension (gain), Devotion (slight loss) |
| **Court position** | `ThreadEdgeProperties.courtPosition` | Steady-state baseline | Devotion (the_first ≫ retinue > watched > dormant), Awe (the_first > rest) |
| **Faction worship** | Agent `member_of` faction with incoming thread from player Ascendant at tier ≥ `FACTION_WORSHIP_TIER_THRESHOLD` (default 3) | Steady-state baseline | Devotion (gain), Awe (small gain) |
| **Rival Ascendant pressure** | Aggregate of rival presence on agent's location + faction (today: static heuristic from `RivalState.hostilityToPlayer` + rival's `agentsControlled`) | Steady-state pressure | Sovereignty Tension (the agent is pulled), Defiance (when pressure exceeds threshold and agent's loyalty < 0) |
| **Neglect** | Ticks since last divine action or essence invested | Decay timer | Devotion (decay), Awe (decay), Sovereignty Tension (decay — they forget the conflict too) |
| **Outcome valence** | Did the intervention help or hurt the agent? Help others or hurt others? Derived from encounter aftermath effects on the agent and on third parties on their location. | On encounter close | Devotion (help → gain, harm → loss), Awe (harm to others → gain) |
| **Promotion event** | Discrete event when `courtPosition` upgrades (e.g., watched → retinue) | One-shot pulse | Devotion (+pulse), Awe (+pulse) |

**Note on "helpful":** an intervention is helpful if its aftermath improves the agent's encounter outcome category by at least one step, *or* if it directly reduces the agent's suffering attachments (wounds, dread, etc.). Helpfulness is determined by comparing the would-have-been outcome (no intervention) to the actual outcome — and is recorded as a trace.

## 5. Feedback State — Dimensions & Stances

### Three internal dimensions (numeric, hidden from player)

| Dimension | Range | Meaning |
|---|---|---|
| **Devotion** | −1.0 to +1.0 | Net love/loyalty toward the god. Negative = hostile, positive = reverent. |
| **Awe** | 0 to +1.0 | Sense of presence and power. Independent of love — a mortal can dread the god deeply, or feel them near deeply, without loving them. |
| **Sovereignty Tension** | 0 to +1.0 | Pressure between the mortal's own identity and what the god is making them do. High SovTen = brittle, conflicted. |

These three dimensions live on the thread edge as a `feedbackState` property bag (§7.1). They are computed each tick by the feedback drift phase and never shown directly to the player.

### Visible stances (the player-facing layer)

The dimensions project into a discrete `stance` enum, computed each tick. Stance is the *primary* communication channel to the player and the key into the prose content tables (§8).

| Stance | Dominant condition | Texture |
|---|---|---|
| **Untroubled** | Default; low awareness or low engagement | Default narrative voice; baseline behavior. The mortal is barely aware of the god. |
| **Reverent** | Devotion high, SovTen low, Awe moderate+ | Prayers, sigils, gratitude. Will accept hard interventions willingly. |
| **Awed** | Awe high, Devotion neutral | Trembling presence. Behaves cautiously. Prays *at* the god, not *to*. |
| **Brittle** | SovTen high, Devotion still positive | Conflicted, questioning. Begins to articulate doubt in inner monologue. First warning state. |
| **Defiant** | Devotion negative, SovTen high | Resists where they can. Curses. May refuse interventions at extreme. |
| **Hollowed** | Devotion+Awe high, SovTen high, low remaining identity | Broken vessel. Behaves passively. Inner voice is fragmented. Rare end-state. |
| **Communing** | Awareness = `communion` AND any of Reverent/Brittle/Defiant | A two-way channel. The mortal asks questions back. Gates a new event type (communion-question, §6). |

**Why stances, not raw dimensions?** Players read prose, not bars. Stances are the human-recognizable shapes ("Reverent," "Brittle") that drive content selection. Dimensions exist to compute stances reproducibly and to allow narrow-grain tuning.

**Why a 7th stance "Communing" gated on awareness?** Awareness already exists and is meaningful (`unaware | intuition | faith | communion`). The top awareness rung needs special texture — communion is the only stance that lets the *mortal* push prose back at the *player* in the form of a question. This makes the awareness ladder feel like an actual progression with a payoff.

## 6. Behavior Change Layers

Per user verdict — **all three layered**, with phasing.

### Layer 1: Cosmetic (Phase 1 — always on)

The agent's prose adapts to their stance. Same mechanical decision, different texture. Implemented via two new enrichment placeholders and a stance-keyed conditional block family.

New placeholders (additions to `enrichProse()` per Capability 1 of the systemic wiring guide):

| Placeholder | Resolves to | Example |
|---|---|---|
| `{stance}` | Current feedback stance (lowercase) | "reverent" |
| `{stance_descriptor}` | Stance-appropriate adjective | "kneeling" / "trembling" / "questioning" / "defiant" / "hollowed" |
| `{stance_verb}` | Stance-appropriate verb | "prays" / "trembles" / "questions" / "curses" |

New conditional family (mirrors `has_artifact` etc.):

```
{?stance_reverent}{name} kneels before the blow lands.{/stance_reverent}
{?stance_defiant}{name} refuses to look up.{/stance_defiant}
{?stance_brittle}{name}'s grip falters for a heartbeat.{/stance_brittle}
```

Each stance has an inverse (`{?not_stance_reverent}`).

**Why this changes what authors write:** an encounter author who knows the agent's stance can now write moments that *land differently* per state. The duel encounter where the agent is Reverent reads as a holy contest; same encounter at Defiant reads as bitter, lonely defiance. The encounter author writes the scene once with stance-conditional flavor.

### Layer 2: Decision-weight (Phase 1 — always on)

The agent's autonomous decisions tilt by stance. This is *not* the player making the decision — the mortal still chooses. But the mortal's choice weighting shifts based on how they feel about the god.

| Stance | Decision tilts |
|---|---|
| Untroubled | Baseline — no tilt. |
| Reverent | +risk acceptance on encounters tagged with player Ascendant's sphere alignment. +loyalty in faction encounters where player has thread on the faction. Prefer "blessed" locations (those visited frequently by player interventions). |
| Awed | +caution in general (lower risk-acceptance). Prefer locations associated with prior divine interventions (seeking the god's gaze). |
| Brittle | +volatility — choices become noisier. Slight tilt toward encounters that resolve identity tension (e.g., encounters in their archetype's primary reach). |
| Defiant | −cooperation with player's threaded factions. +flight tendency in thread-heavy encounters. +receptivity to rival Ascendant pressure (when rivals are alive). |
| Hollowed | −initiation across the board. Passive participation. Higher likelihood of being a "casualty" rather than a "protagonist" in encounters. |
| Communing | Tilt is whatever the underlying stance is, plus +receptivity to interventions (communion makes the mortal listen). |

Implementation: a `stanceDecisionTilt` multiplier injected into the existing agent-decision scoring pipeline. Per-stance multiplier tables are constants (§11). Stance does not *override* decisions; it weights them. A Defiant Sworn agent still has high loyalty — they just feel it weaker.

### Layer 3: Refusal (Phase 3 — extreme states only)

When the player attempts an intervention on an agent at extreme stance + qualifying personality + extreme awareness, the action may **refuse, twist, or sever**.

| Outcome | Trigger | Effect |
|---|---|---|
| **Refuse** | Defiant stance, Awareness ≥ `intuition`, axiological pair `loyalty_ambition < REFUSAL_LOYALTY_THRESHOLD` (default −0.5 — Renegade-leaning) | Action resolves as failure; agent gains transient `Defiant Refusal` attachment that increases the refusal probability of the next intervention by `REFUSAL_CASCADE_BONUS` (default +0.2). Chronicle entry written. |
| **Twist** | Hollowed stance, Awareness ≥ `faith` | Action resolves with reversed valence (e.g., a steady becomes a stagger, a heal becomes a wound) and emits a `feedback_twist` trace. Rare and disturbing. |
| **Sever** (rare) | Defiant stance at maximum, Awareness = `communion`, and three consecutive refusals in last 10 ticks | Thread edge `tier` drops to 0 and `courtPosition` becomes `null` ("ex-threaded"). The agent leaves the portfolio. Chronicle records this as a major event. |

Refusal is **gated by personality**, not just stance. A Sworn Defiant agent will not refuse — they curse the god in private but obey. A Renegade Defiant agent will refuse openly. This matters: it makes personality consequential not just at character creation but mid-run.

**Determinism:** every refusal roll uses the seeded PRNG with seed `${seed}:agent_feedback:refusal:${actorId}:${tick}`. Same seed, same input, same outcome (NFP #3).

## 7. Engine Pillar

### 7.1 Schema additions

Extend `ThreadEdgeProperties` in `src/types/influence.ts`:

```typescript
export type FeedbackStance =
  | 'untroubled' | 'reverent' | 'awed' | 'brittle'
  | 'defiant' | 'hollowed' | 'communing';

export interface AgentFeedbackState {
  devotion: number;          // -1.0 to +1.0
  awe: number;               // 0 to +1.0
  sovereigntyTension: number;// 0 to +1.0
  stance: FeedbackStance;    // computed cache
  stanceSinceTick: number;   // when current stance began
  lastEventTick: number | null;   // when the last feedback event emitted
  lastEventKind: FeedbackEventKind | null;
  eventBudgetTokens: number; // see §7.3 cadence control
  // Cumulative counters for chronicle / tooltip
  totalPrayers: number;
  totalCurses: number;
  totalRefusals: number;
  totalCommunions: number;
}

export interface ThreadEdgeProperties {
  // ... existing fields ...
  feedbackState?: AgentFeedbackState;  // optional → fail-soft default
}
```

**Why on the thread edge, not the actor node?** Feedback state is a property of the *bond*, not the mortal. If a different Ascendant threads the same agent (future feature), they get their own feedback state. The graph already models the bond as the edge; this is the natural home.

**Why optional?** Old saves don't have it. The drift phase initializes a default state on first encounter.

### 7.2 New trace categories

Add to `TRACE_CATEGORIES`:

```typescript
export type AgentFeedbackTraceKind =
  | 'agent_feedback_drift'           // each tick where dimensions moved
  | 'agent_feedback_stance_change'   // discrete transition
  | 'agent_feedback_event_emitted'   // prayer/curse/contemplation/etc.
  | 'agent_feedback_refusal'         // action refused
  | 'agent_feedback_twist'           // action reversed
  | 'agent_feedback_sever';          // thread severed by mortal
```

Each trace carries `{actorId, ascendantId, tick}` plus event-specific fields (dimension deltas, stance from/to, event kind, refusal cause).

### 7.3 Tick phase — `phaseAgentFeedbackDrift`

Inserted into the tick orchestrator after attention/intervention phases (so the current tick's actions are visible) and before encounter resolution (so stance affects this tick's decisions).

```
for each thread edge with target_kind === 'actor':
  1. Aggregate signals for the tick (Table §4).
  2. Apply dimension deltas with personality weights (Table §6).
  3. Apply decay (untouched dimensions drift toward neutral).
  4. Recompute stance from dimensions; emit `agent_feedback_stance_change` if changed.
  5. Roll event emission:
     - eventBudgetTokens regenerates by EVENT_TOKEN_REGEN_PER_TICK (default 0.1)
     - If tokens ≥ 1.0 and stance.eventEmissionProbability rolls, emit one event,
       consume 1 token, record kind + tick on state, append to chronicle.
  6. Emit `agent_feedback_drift` summary trace.
```

**Why a token budget?** Without it, an extreme-stance agent would emit a prayer/curse every tick and overwhelm the chronicle. The budget caps emission cadence to ~1 event per 10 ticks per agent at full saturation, scaling down for low-engagement stances (§11 constants).

### 7.4 Refusal hook (Phase 3 only)

In the intervention resolution pipeline, after the action's normal cost-and-prerequisite check passes but before its effect resolves, insert `checkFeedbackRefusal(action, agent)`:

```
if agent.feedbackState.stance === 'defiant' AND
   agent.threadEdge.awareness >= 'intuition' AND
   agent.axiology.loyalty_ambition < REFUSAL_LOYALTY_THRESHOLD AND
   prng.roll(refusalProbability(agent)) succeeds:

  → resolve action as refusal:
      - mechanical effect skipped (or reversed for twist)
      - emit `agent_feedback_refusal` trace
      - append transient 'Defiant Refusal' attachment with REFUSAL_ATTACHMENT_TICKS duration
      - emit chronicle entry
      - return refusal outcome to encounter veil for prose rendering
```

The refusal is *part of* the action resolution pipeline, not a separate phase — so it can return a meaningful result to the UI that triggered the action.

### 7.5 Constants table (see §11 for full list)

All numeric weights, thresholds, decay rates, and token regen rates are exported constants in `src/engine/agentFeedbackConstants.ts`. Per NFP #1, no inline magic numbers.

### 7.6 Fail-soft table

| Failure case | Behavior |
|---|---|
| Thread edge missing `feedbackState` | Initialize defaults `{devotion:0, awe:0, sovereigntyTension:0, stance:'untroubled'}` on first drift tick. |
| Agent missing axiological profile | Treat all 9 ValuePairs as 0 (neutral). Personality weighting contributes nothing this tick. Trace logged. |
| Stance computed but no matching prose template for an event | Fall back to neutral-stance prose for the event kind. If that also missing, suppress the event silently and trace. |
| Token budget produces NaN (race condition) | Clamp to 0. Trace logged. |
| Refusal roll requested but PRNG seed missing | Skip refusal check (action resolves normally). Trace logged. |
| Awareness undefined on thread edge | Treat as `'unaware'`. |
| Intervention helpfulness can't be computed (encounter aftermath missing or malformed) | Treat as helpfulness = 0 (neutral). Trace logged. |
| Stance transition table inconsistency (e.g., stale cached stance after dimension recompute) | Recompute stance fresh from dimensions; the cached value is advisory only. |

Tick loop must never crash on feedback errors (NFP #4).

### 7.7 PRNG seeding (determinism)

All stochastic operations use the global seeded PRNG:
- Stance event emission roll: seed `${seed}:agent_feedback:event:${actorId}:${tick}`
- Event kind selection (when multiple are eligible): seed `${seed}:agent_feedback:event_kind:${actorId}:${tick}`
- Refusal roll: seed `${seed}:agent_feedback:refusal:${actorId}:${tick}`
- Prose variant pick: seed `${seed}:agent_feedback:prose:${actorId}:${tick}:${eventKind}`

Same seed + same inputs ⇒ same feedback events (NFP #3).

### 7.8 Cache versioning

The feedback state mutates `gameState.graph` property bags in place. Per CLAUDE.md *load-bearing decisions*, after a stance change or event emission, call `touchWorld()` so UI selectors re-render. After significant dimension drift (configurable), no version bump is needed (UI re-reads on stance transition, not on each tiny dimension shift).

## 8. Content Pillar

### 8.1 Prose tables to author

The minimum viable content set (Phase 1):

| Table | Cardinality | Owner |
|---|---|---|
| **Feedback event prose** — `event_kind × stance × reach` | 7 events × 7 stances × 8 reaches = 392 slots; **target 5 variants per slot** → ~1,960 lines. Phase 1 ships ~30% of this; the rest queues for content sweeps. | `prose-content-systems` skill |
| **Stance descriptors** — for `{stance_descriptor}` placeholder | 7 stances × 5 variants = 35 lines | enrichment placeholder content |
| **Stance verbs** — for `{stance_verb}` placeholder | 7 stances × 5 variants = 35 lines | enrichment placeholder content |
| **Communion-question prose** — special pool for Communing stance (full sentence questions the mortal asks the god) | ~40 lines per archetype-axis | content table |
| **Refusal moment prose** (Phase 3 only) | Per stance × per reach × per intervention type = ~80 lines | encounter aftermath family |
| **Chronicle entry prose** for each feedback event kind, in both Poet and Witness voices | 7 events × 2 voices × ~5 variants = 70 lines | `ChronicleEntry` content |

### 8.2 Feedback event prose family — slot specs

Each event prose is a short paragraph (2-4 sentences) written in Threadbare voice (per `Docs/canon/prose.md` § Threadbare voice rules). The narrative perspective is **the god feeling the moment through the thread** — second person *implied* (you feel that...), third person grammatical (...{name} kneels).

**Example slots (Phase 1 priority):**

- `prayer.reverent.heart` — 5 variants like:
  > *Through the thread, you feel {name} kneel. {They} press {their} forehead to the cold floor and pray for the strength to forgive {ally:strongest}. The prayer is not for {them}self. {?has_artifact}{They} hold{s} {artifact:any} like a relic.{/has_artifact}*
- `curse.defiant.veil` — 5 variants
- `contemplation.brittle.eye` — 5 variants (this is Lyra's case from §3)
- `plea.awed.iron` — 5 variants ("she begs you to spare her")
- `sacrifice.reverent.iron` — 5 variants ("he offers his wound as proof")
- `refusal.defiant.heart` — 5 variants (Phase 3)
- `communion_question.communing.eye` — 5 variants ("what kind of god are you?")

The full prose-table authoring runs through the existing `prose-content-systems` skill. Each entry must pass the 5-question quality bar from `Docs/canon/prose.md`. **The user has set the meeting-encounter prose as the quality benchmark** (memory `feedback_prose_quality_bar`); every feedback prose entry must meet that bar.

### 8.3 Vignette templates (between-turn popup content)

Vignettes for the proactive between-turn popup are slightly longer (3-6 sentences), framed as god-overhears-moment, drawn from the same content tables but with `vignette_amplifier: true` to allow longer development. Vignette templates use the existing `vignetteProse.ts` four-part Scene / Lens / Stakes / Forecast frame, with:

- **Scene:** the mortal's moment (the prayer, the curse, the contemplation)
- **Lens:** what they're thinking / what the god sees through the thread
- **Stakes:** what this means for the relationship (implied, never stated mechanically)
- **Forecast:** unused or replaced with a single closing line of texture

### 8.4 Quality bar (per template)

Every feedback prose entry must pass the 5-question bar (`Docs/canon/prose.md` § Per-template quality bar):

1. Does this create a human condition the player recognizes?
2. Does this make the player want to know what happens next?
3. Does this work as a moment, not a label?
4. Would the player sometimes prefer this outcome over success? (For curse/refusal — yes, refusal is a moment players will remember and sometimes seek.)
5. Does this serve the three-beat loop? (Yes — feedback is the aftermath beat reframed: the encounter's aftermath now includes the mortal's response back to the god.)

### 8.5 Encounter prose enrichment (god-observation framing)

User explicitly said: *"behavior changes in encounters could be one, but it needs to be made explicit that the god actually observes that this behavior changes."*

Solution: encounter aftermath prose gains a **god-observation layer** when the encounter participant is a threaded agent at non-Untroubled stance. The layer is rendered via the new `{?stance_*}` conditional blocks. Encounter authors do not need to learn a new system — they use the same conditional-block vocabulary.

Example encounter aftermath line, rewritten:

> Before: *"{name} crossed the river. The crossing was hard."*
> After: *"{name} crossed the river. The crossing was hard. {?stance_reverent}{They} prayed at the far bank — for the steadiness {they} did not earn alone.{/stance_reverent}{?stance_defiant}{They} did not look back. {They} did not give thanks.{/stance_defiant}"*

The base encounter prose is unchanged; the stance-conditional blocks are additions. Old encounters work without changes. Authors update high-impact encounters opportunistically.

## 9. UI Pillar

### 9.1 BondsTab "Through the Thread" section (Phase 1 — character sheet)

Extend `src/components/Game/tabs/BondsTab.tsx`. Add a new section above existing bonds, **only rendered when the agent has a thread edge from the player Ascendant**.

Section layout (1920×1080 contract; no scroll outside the section's own internal scroll):

```
┌─ Through the Thread ──────────────────────────────────┐
│                                                       │
│  Stance: Reverent                                     │
│                                                       │
│  [Stance prose — 2-3 sentences describing how         │
│   the mortal currently feels about the god.]          │
│                                                       │
│  Recent moments:                                      │
│  · Tick 47 — Prayer of thanks for the duel            │
│  · Tick 42 — Carved your sigil into his spear         │
│  · Tick 38 — Refused the rival's whisper-witch        │
│                                                       │
│  [Optional dev-only: dimension snapshot, hidden       │
│   from production build]                              │
└───────────────────────────────────────────────────────┘
```

- Stance name: prose-styled, no numeric values.
- Stance prose: stance × archetype-axis content table → ~80 entries.
- Recent moments: last 5 feedback events for this thread (from `feedbackHistory` — see §9.6).
- Dev snapshot: only in dev builds; numeric dimensions for tuning.

### 9.2 Between-turn vignette popup (Phase 2)

A new component `AgentFeedbackVignetteModal.tsx` that opens at turn-start when the feedback system has emitted a vignette-worthy event in the previous tick.

Trigger logic:
- Phase queues vignette events with priority score based on event significance (sever > refusal > sacrifice > communion-question > prayer/curse > contemplation).
- At turn-start, if queue is non-empty, the highest-priority event renders as a modal popup using the existing `EventPopup` infrastructure (per UI research).
- One popup per turn maximum (don't drown the player). Remaining queue persists for the next turn-start.
- Player dismisses with click; popup logs to chronicle on dismiss.

The popup uses the vignette prose from §8.3.

### 9.3 ChroniclePanel integration (Phase 1)

Significant feedback events (sacrifice, refusal, communion-question, sever, first-prayer-from-an-agent, first-curse) emit `ChronicleEntry` items into the existing `ChroniclePanel.tsx`. Voice modes work as-is:
- **Poet voice:** flowing prose from the feedback event prose pool.
- **Witness voice:** terse fact line ("Tick 47: Kael prayed.")

Less-significant events (routine prayer, routine contemplation, dimension drift) do NOT chronicle. They land only in the BondsTab feedback history and traces.

### 9.4 EncounterVeil aftermath enrichment (Phase 1)

`EncounterVeil.tsx` aftermath stage prose passes through `enrichProse()` (already does). The new stance-conditional blocks (`{?stance_reverent}` etc.) are automatically resolved. No new component logic — the prose enrichment pipeline carries the change.

### 9.5 Retinue panel speech bubble badge (Phase 2)

`RetinuePanel` (right rail / `ReadTheThreadsPanel`) gains a small speech-bubble icon next to threaded agents whose stance changed last turn or who emitted a vignette-worthy event. Click on the bubble opens the agent's BondsTab → Through the Thread section.

This is a *signal*, not a popup — non-intrusive, but discoverable.

### 9.6 Feedback history storage

A new in-memory ring buffer per thread edge: `feedbackHistory: FeedbackEventRecord[]` with last 20 events. Persisted in save game via the standard graph serialization (since it lives in the thread edge property bag). Used by BondsTab "Recent moments" and by ChroniclePanel.

### 9.7 DebugPanel inspection tab

Add a "Feedback" sub-tab to the existing DebugPanel under the Agent inspector. Shows for the selected agent:
- Current dimensions (devotion / awe / sovereignty tension) as numeric bars
- Current stance and ticks-in-stance
- Event budget tokens
- Last 20 events with timestamps and reasons
- Full trace stream filtered to `agent_feedback_*` types

Dev-only visibility per CLAUDE.md DebugPanel patterns. The `__DEBUG.gotoAgent(name)` helper continues to work; a new `__DEBUG.getFeedbackState(agentId)` is exposed.

### 9.8 Player controls

This feature is **read-only from the player's perspective.** There are no new player actions. The player still uses normal divine actions, normal encounter interventions, normal court-position changes. The feedback system is an *output channel*, not an input.

This matters because it preserves the player-as-god framing: the player does god things and the world responds; the player does not "manage relationships" via a UI.

### 9.9 Viewport contract

All new UI fits the 1920×1080 contract (`Docs/canon/process.md` → CLAUDE.md Viewport Contract). BondsTab section uses internal `overflow-y-auto`; popup uses `max-height: 85vh`; speech-bubble badge sits in existing retinue list layout.

### 9.10 Front-of-stage rule (composes feedback with the scan → encounter → aftermath rhythm)

`Vision/03-design-tensions.md` §5 (one complex story vs. portfolio breadth) is the central pressure this feature must respect. The feedback system runs across *all* threaded agents — every threaded mortal drifts, every threaded mortal accumulates events. Without a discipline, the system risks becoming "lots of small stories everywhere" rather than supporting "one complex story at a time" (`Vision/01-core-loop.md`).

The discipline is a three-tier visibility model that maps each surface to a different role in the core loop:

| Surface | Role in the loop | Rate cap |
|---|---|---|
| **BondsTab "Through the Thread" section** (§9.1) | Ambient state. The player consults it when they choose to. Comparable to looking at a mortal's portrait in the scan. | None — always shows current stance + last 20 events when opened. |
| **ChroniclePanel entries** (§9.3) | Historical record. The player consults it when they want the run's prose log. | Significant events only (sacrifice, refusal, communion-question, sever, first-prayer, first-curse). Routine prayer/curse/contemplation do NOT chronicle. |
| **Between-turn vignette popup** (§9.2, Phase 2) | **Front-of-stage moment.** The game's pick of *whose* feedback matters most this turn. | One popup per turn maximum. |
| **Retinue speech-bubble badge** (§9.5, Phase 2) | Signal that *something has happened* — invites the player to look, but does not pull focus. | All threaded agents with vignette-priority events in last turn. Click to open BondsTab. |

The front-of-stage moment is the popup. The popup's priority queue (§9.2) picks the single highest-priority event from across all threaded agents and renders ONE per turn-start. Remaining queue persists. This is the system's commitment to "one complex story at a time": the popup IS the scan's narrative beat, surfaced as a curated god-overhears-moment rather than a mechanical alert.

**Why this works with the scan:** the scan beat ("portfolio scan → curated encounter → aftermath") gets a sibling beat: ambient feedback texture in the BondsTab and chronicle, with a curated front-of-stage moment at turn-start when the system has something to emphasise. The popup's existence is *itself* a scan signal — it tells the player "this mortal's story moved this turn." The player can dismiss and continue, or open the BondsTab and follow the thread.

**Drift signal monitoring** (per the tension page): if Phase 1 telemetry shows the popup queue regularly carrying >3 queued events per turn-start, the rate is too high; raise the priority threshold. If the popup fires less than once per 10 turns at saturation portfolio size (12+ threaded agents), the rate is too low; lower the threshold or expand the vignette-priority set.

**Phase 1 caveat:** vignette popup ships in Phase 2. Phase 1 ships only the ambient surfaces (BondsTab, chronicle). Phase 1 therefore has *ambient feedback texture but no front-of-stage moment* — the chronicle is the only narrative beat from feedback in Phase 1. This is acceptable as MVP; the full discipline lands in Phase 2.

## 10. Wiring Section

Per `Docs/plans/wiring-checklist.md`. The feature touches:

| Surface | Module | Note |
|---|---|---|
| Orchestrator phase | `phaseAgentFeedbackDrift` inserted after attention/intervention, before encounter resolution | New file `src/engine/phaseAgentFeedbackDrift.ts` |
| Tick loop registration | `src/engine/tickOrchestrator.ts` | Register new phase |
| GameState mutation | `WorldGraph.getEdge` + property mutation on thread edge | Call `touchWorld()` after stance changes |
| Modals | `AgentFeedbackVignetteModal` (Phase 2) | Mounted in `GameView`; rendered from a queue |
| Toasts | None (deliberately — vignettes get popups, not toasts) | — |
| Chronicle | `chronicleEntryBuilder.recordFeedbackEvent()` | New helper |
| Trace categories | Add `agent_feedback_*` to `TRACE_CATEGORIES` | `src/engine/traceBuffer.ts` |
| Debug visibility | DebugPanel Feedback sub-tab + `__DEBUG.getFeedbackState` | `src/debug-bridge.ts` |
| Player controls | None | Read-only feature |
| Prose enrichment | New placeholders + conditional blocks in `enrichProse()` | `src/engine/proseEnrichment.ts` |
| Content tables | New `agent-feedback-content.ts` in `src/data/` | Authored via `prose-content-systems` skill |
| UI selectors | BondsTab consumes `feedbackState` and `feedbackHistory` | `src/components/Game/tabs/BondsTab.tsx` |

Update `Docs/plans/wiring-checklist.md` after Phase 1 lands.

Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` (the IKEA manual for content authors) to add:
- New enrichment placeholders (`{stance}`, `{stance_descriptor}`, `{stance_verb}`) and conditional family (`{?stance_*}`).
- New aftermath effect kind (none — this feature uses graph edge mutation, not aftermath effects).
- Note that stance-aware prose is the new default for any encounter targeting a threaded agent.

## 11. Constants Table (tunability — NFP #1)

All constants live in `src/engine/agentFeedbackConstants.ts`. Defaults below are starting points; expect tuning.

### 11.1 Dimension deltas per signal

| Constant | Default | Purpose |
|---|---|---|
| `DEVOTION_GAIN_PER_HELPFUL_INTERVENTION` | +0.04 | Per action that improved the agent's encounter outcome. |
| `DEVOTION_GAIN_PER_ESSENCE_INVESTED` | +0.002 per essence | Continuous. |
| `DEVOTION_LOSS_PER_HARMFUL_INTERVENTION` | −0.05 | Per action that worsened the agent's outcome. |
| `DEVOTION_LOSS_PER_HARM_TO_OTHERS` | −0.02 | When intervention damages third parties on the agent's location. |
| `DEVOTION_DECAY_PER_TICK_UNATTENDED` | −0.001 | When no intervention targets the agent for `NEGLECT_GRACE_TICKS` (default 20). |
| `AWE_GAIN_PER_INTERVENTION` | +0.02 | Any intervention. Scales with awareness. |
| `AWE_AMPLIFIER_BY_AWARENESS` | `{unaware: 0.5, intuition: 1.0, faith: 1.5, communion: 2.0}` | Multiplier table. |
| `AWE_DECAY_PER_TICK` | −0.001 | Slow decay even with no neglect (it's hard to maintain awe). |
| `SOVTEN_GAIN_PER_IDENTITY_MISMATCH` | +0.05 | When intervention sphere or reach contradicts agent's primary axiological axis. |
| `SOVTEN_GAIN_PER_FORCED_BEHAVIOR` | +0.03 | When intervention pushes agent to act against their dominant axiological pair. |
| `SOVTEN_DECAY_PER_TICK` | −0.002 | Mortals forget the tension over time. |

### 11.2 Personality weighting

A 9 × 3 table maps axiological pair value (−1 to +1) to dimension weight multiplier. Excerpt:

| Pair | Devotion weight | Awe weight | SovTen weight |
|---|---|---|---|
| `loyalty_ambition` (Sworn ↔ Renegade) | virtue side ×1.4, flaw side ×0.6 | unchanged | flaw side ×1.5 (rebels feel pressure harder) |
| `revelation_discretion` (Seeker ↔ Sentinel) | virtue side ×1.2 | virtue side ×1.5 | unchanged |
| `sacrifice_survival` (Martyr ↔ Survivor) | virtue side ×1.3 | unchanged | flaw side ×1.3 (survivors resist forcing) |
| ... (full table in plan implementation) | | | |

### 11.3 Stance thresholds

```
if devotion > 0.7 AND sovTen < 0.3 AND awe ≥ 0.2 → Reverent
elif awe > 0.7 AND devotion ∈ [−0.2, 0.5] → Awed
elif sovTen > 0.6 AND devotion > 0.0 → Brittle
elif devotion < −0.2 AND sovTen > 0.3 → Defiant
elif awe > 0.7 AND sovTen > 0.7 AND devotion ∉ [-0.5, +0.5] → Hollowed
elif awareness === 'communion' AND any of (Reverent, Brittle, Defiant) → Communing (overlay)
else → Untroubled
```

Each threshold is a named constant: `STANCE_REVERENT_DEVOTION_FLOOR` = 0.7, etc.

### 11.4 Event emission

| Constant | Default | Purpose |
|---|---|---|
| `EVENT_TOKEN_REGEN_PER_TICK` | 0.1 | Tokens per tick (1 token = 1 event). At full stance saturation, ~1 event per 10 ticks. |
| `EVENT_PROB_BY_STANCE.untroubled` | 0.0 | No emission for untroubled. |
| `EVENT_PROB_BY_STANCE.reverent` | 0.15 | Per tick when tokens ≥ 1. |
| `EVENT_PROB_BY_STANCE.awed` | 0.15 | |
| `EVENT_PROB_BY_STANCE.brittle` | 0.20 | Slightly higher — conflict drives expression. |
| `EVENT_PROB_BY_STANCE.defiant` | 0.20 | |
| `EVENT_PROB_BY_STANCE.hollowed` | 0.08 | Hollowed mortals say less. |
| `EVENT_PROB_BY_STANCE.communing` | 0.25 | Communion is talkative. |
| `EVENT_TOKEN_CAP` | 2.0 | Maximum stored tokens (prevents long-quiet-then-burst). |

### 11.5 Refusal layer (Phase 3)

| Constant | Default | Purpose |
|---|---|---|
| `REFUSAL_LOYALTY_THRESHOLD` | −0.5 | Agents with `loyalty_ambition < this` are eligible to refuse. |
| `REFUSAL_BASE_PROBABILITY` | 0.15 | When eligible. |
| `REFUSAL_CASCADE_BONUS` | +0.20 | Added per stacked `Defiant Refusal` attachment. |
| `REFUSAL_PROBABILITY_CAP` | 0.7 | Even at extreme conditions, refusal is not certain. |
| `REFUSAL_ATTACHMENT_TICKS` | 5 | Duration of `Defiant Refusal` attachment. |
| `SEVER_CONSECUTIVE_REFUSAL_COUNT` | 3 | Refusals needed within window to sever. |
| `SEVER_WINDOW_TICKS` | 10 | |

### 11.6 Court position baselines

| Position | Devotion baseline | Awe baseline |
|---|---|---|
| `the_first` | +0.15 | +0.10 |
| `retinue` | +0.05 | +0.03 |
| `watched` | 0.0 | 0.0 |
| `dormant` | −0.02 | 0.0 |

Applied as steady-state additive (capped within dimension ranges).

### 11.7 Other

| Constant | Default | Purpose |
|---|---|---|
| `FACTION_WORSHIP_TIER_THRESHOLD` | 3 | Faction must have incoming thread tier ≥ this for member agents to get worship baseline. |
| `FACTION_WORSHIP_DEVOTION_BIAS` | +0.05 | Baseline if agent is `member_of` a worshipping faction. |
| `RIVAL_PRESSURE_SOVTEN_PER_HOSTILITY` | +0.02 per unit hostility | When rival has hostilityToPlayer ≥ 0.5. |
| `NEGLECT_GRACE_TICKS` | 20 | Ticks of inattention before decay kicks in. |
| `STANCE_HYSTERESIS_TICKS` | 3 | Minimum ticks in a stance before transition (prevents flicker). |

## 12. Tracing (NFP #2)

All traces in `src/engine/traceBuffer.ts` under category `agent_feedback`. TypeScript interfaces:

```typescript
interface AgentFeedbackDriftTrace {
  kind: 'agent_feedback_drift';
  tick: number;
  actorId: string;
  ascendantId: string;
  deltas: {devotion: number; awe: number; sovereigntyTension: number};
  values: {devotion: number; awe: number; sovereigntyTension: number};
  sources: Array<{signal: string; contribution: Partial<...>}>;
}

interface AgentFeedbackStanceChangeTrace {
  kind: 'agent_feedback_stance_change';
  tick: number;
  actorId: string;
  ascendantId: string;
  from: FeedbackStance;
  to: FeedbackStance;
  reason: 'threshold_crossed' | 'awareness_reached_communion' | 'recompute_after_hysteresis';
}

interface AgentFeedbackEventEmittedTrace {
  kind: 'agent_feedback_event_emitted';
  tick: number;
  actorId: string;
  ascendantId: string;
  stance: FeedbackStance;
  eventKind: FeedbackEventKind;   // 'prayer' | 'curse' | 'contemplation' | 'sacrifice' | 'plea' | 'communion_question'
  proseId: string;                // which content variant fired
  rngSeed: string;                // for reproduction
}

interface AgentFeedbackRefusalTrace {
  kind: 'agent_feedback_refusal';
  tick: number;
  actorId: string;
  ascendantId: string;
  actionId: string;
  actionTemplateId: string;
  refusalKind: 'refuse' | 'twist' | 'sever';
  cause: 'defiant_stance' | 'hollowed_stance' | 'sever_threshold';
  probability: number;            // what the roll was against
  rolled: number;                 // what the PRNG returned
}
```

The DebugPanel Feedback tab consumes these traces. Replay scripts can reconstruct full feedback evolution from the trace stream.

## 13. Fail-Soft Table

See §7.6. All failure cases produce a trace and continue with a sensible default; the tick loop never throws (NFP #4).

## 14. Blast Radius

Codesight signal: this change touches **two high-impact files**.

| File | Importers | Cascade risk |
|---|---|---|
| `src/types/graph.ts` | 370 | Adding a new edge property is additive; no risk to importers. Adding a new edge type is not done here (we extend `thread`). **Low cascade risk** — schema-additive. |
| `src/types/gameState.ts` | 176 | No GameState top-level field is added. Trace categories live in traceBuffer. **No cascade risk** at this file. |
| `src/types/influence.ts` | (not on high-impact list, but central) | Adding `feedbackState?` to `ThreadEdgeProperties` is additive and optional; old saves work. **Low cascade risk.** |
| `src/types/traits.ts` | 156 | No changes proposed. **Not touched.** |

**Verdict:** all schema changes are additive and backward-compatible. Old saves load with `feedbackState === undefined` and get default-initialized on first feedback drift tick.

## 15. Phasing

### Phase 1 — Engine + character sheet + chronicle integration (Cowork → CC)
- Schema additions (§7.1) + drift phase (§7.3)
- Cosmetic layer (stance-conditional prose; §6 layer 1)
- Decision-weight layer (stance tilts; §6 layer 2)
- Stance enum (all 7)
- Event emission for 5 of 7 event kinds: prayer, curse, contemplation, sacrifice, plea (defer communion-question and refusal-moment to Phase 3)
- BondsTab "Through the Thread" section (§9.1)
- ChroniclePanel integration (§9.3)
- DebugPanel Feedback sub-tab (§9.7)
- Constants + traces + fail-soft
- ~30% of prose content (priority slots — see §8.1)

**Done when:** A run can be played for 100 ticks with at least 2 threaded agents; every threaded agent has visible stance + at least one prose feedback event recorded; chronicle shows at least one significant feedback entry; debug tab shows dimension evolution; existing tests pass.

**Phase 1 emotional-payoff caveat (per Vision audit §18).** `Vision/00-north-star.md` calls out "weight of threads — losing a thread should hurt." Sever (Phase 3) and refusal (Phase 3) are the operational forms of that weight. Phase 1 ships the *texture* of feedback (stance, prayers, curses, contemplation) without yet delivering the *weight* (refusal, sever). This is acceptable as MVP scoping but should be made explicit in any Phase 1 release notes: Phase 1 delivers the slow-accretion half of the North Star moment; Phase 3 delivers the apex. Reviewers and playtesters should be told this so Phase 1 isn't judged against the full North Star bar prematurely.

### Phase 2 — Vignette popups + retinue speech bubble + content sweep
- Between-turn vignette popup (§9.2)
- Retinue speech-bubble badge (§9.5)
- Communion-question event kind (stance: Communing only)
- Remaining ~50% of prose content
- Encounter aftermath stance-conditional retrofit (high-impact encounters first)

**Done when:** Phase 1 deliverables + popup fires on significant events + speech-bubble visible in retinue + Communion stance reaches end-to-end production-quality.

### Phase 3 — Refusal layer + rival pressure (extreme states)
- Refusal hook in intervention pipeline (§7.4)
- Twist outcome (Hollowed stance + faith awareness)
- Sever outcome (terminal — thread breaks)
- Refusal prose content
- Rival pressure signal wired (today: static heuristic; upgrades when THR-66 ships)

**Done when:** Defiant agents at appropriate personality + awareness can refuse interventions; Hollowed agents can twist; sever fires correctly when triple-refusal threshold met; chronicle records all three.

### Phase 4 — Faction worship + Divine Court promotion encounters
- Wire `FactionDefinition.promotionEncounterTemplateId` to actually fire promotion encounters
- Faction-worship Devotion baseline (§11.7) fully wired
- Promotion events emit Devotion+Awe pulse (one-shot)
- Possible: Divine Court rank-tier visible in BondsTab

**Done when:** Promoting an agent into the retinue or to the_first triggers a chronicle event + Devotion/Awe pulse + (if encounter template present) a Promotion encounter for the agent.

## 16. Risks & Open Questions

| Risk | Mitigation |
|---|---|
| Prose volume — 1,960 slots is too much to author by hand | Phase 1 ships 30%; remaining slots queue for content sweeps. Authoring via the `prose-content-systems` skill; quality bar is non-negotiable but cadence is set by content capacity. |
| Stance flicker (rapid transitions) | `STANCE_HYSTERESIS_TICKS` enforces minimum dwell time. Trace logs stance changes for tuning. |
| Popup fatigue (Phase 2) | One popup per turn cap; only vignette-priority events fire; player can dismiss with one click. If still too much, raise priority threshold. |
| Refusal at wrong moments (Phase 3) | Refusal requires extreme stance + Renegade-leaning personality + intuition-or-higher awareness + RNG roll. Total per-action refusal probability stays under 25% in typical runs. Tunable via constants. |
| Faction worship double-counting | Devotion baseline from court position and from faction worship can both apply. Capped via dimension's overall +1.0 ceiling. Document this in the constants comments. |
| "Devotion bar with extra steps" risk | Mitigated by **stances are prose, not numbers, in all player-facing UI.** Dev-only numeric view. Strictly enforced in PR review. |
| Conflicts with THR-389 intent prose | Phase 1 design must read THR-389's plan-doc / commit before drafting to ensure stance-feedback and intent-prose use the same enrichment infrastructure. Filed as a coordination dependency. |

### Open questions for user

1. **Stance count.** I proposed 7 (Untroubled / Reverent / Awed / Brittle / Defiant / Hollowed / Communing). Is Hollowed too dark? Should it merge with Defiant-at-max? Or is the broken-vessel state a distinct end-state worth keeping?
2. **Communion-question event.** When a Communing agent asks the god a question, does the player get an *interactive* moment (pick an answer from a small set), or is it purely observational prose ("she asks; you do not answer, because gods don't")? The latter is purer to Vision; the former is more dramatic. I lean **observational** per player-as-god framing, but worth confirming.
3. **Sever as terminal.** Should a severed thread be permanently lost, or can the player re-thread the same agent at a heavy essence cost (a "reconciliation" arc)? Phase 3 scope question.
4. **Memorability quotation.** Should significant feedback moments (refusal, sacrifice, sever) auto-save a chronicle quote that the player can revisit at any time, or do they just live in the rolling chronicle log? I lean toward a dedicated "Memorable Moments" surface but that's a separate UI feature; not scoped here.

## 17. Considered Alternatives (Brainstorm companion)

A full Brainstorm doc lives at `Docs/plans/2026-05-11-agent-feedback-brainstorm.md`. Summary of paths considered and not taken:

- **Numeric devotion bar.** Rejected — violates prose-first UI (memory `feedback_prose_first_ui`).
- **Agent-side "manage relationship" UI.** Rejected — violates player-as-god framing (`Docs/canon/prose.md`).
- **Single composite "favor" dimension.** Rejected — collapses Devotion / Awe / SovTen into one number, loses the dramatic asymmetry where a mortal can love and fear independently.
- **Reputation tally piggyback.** Considered — using the existing `reputationTallies` infrastructure for feedback signals. Rejected because tallies are for *external* reputation (how the world remembers); feedback is *internal* to the bond and belongs on the thread edge.
- **Refusal as the only behavior change layer.** Considered — skip cosmetic and decision-weight, ship only the dramatic apex. Rejected because most players would never see a refusal in a given run; the everyday texture would still feel one-way.
- **Feedback dimensions on actor node, not thread edge.** Rejected — see §7.1 rationale.
- **Per-action feedback ledger (every intervention logged on the agent).** Considered — exhaustive memory of every action. Rejected as too storage-heavy and not dramatically useful; ring buffer of 20 events is sufficient.
- **Mortal-authored prose via LLM at runtime.** Rejected — violates determinism (NFP #3) and tunability (NFP #1).

## 18. Vision Audit (full, 2026-05-11)

Audit ran against all five Vision pages (`00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `taste-profile.md`). Earlier draft of this section ran against `taste-profile.md` only due to an Obsidian MCP outage; full audit landed 2026-05-11.

### Premises invoked and respected

| Vision page | Premise | How this design lands |
|---|---|---|
| `00-north-star` | The hypothetical seventh-hour moment — mortal exercises sovereignty, intervention shifts odds not outcomes, player chooses what kind of god to be | Refusal (Phase 3) is the operational form. Communion (Phase 2) is the relational form. Reverent accretion (Phase 1) is the slow build that earns the apex. **Strong alignment.** |
| `00-north-star` | "Cadence, not pacing" — long simmer punctuated by set-pieces | Token budget + stance hysteresis enforce sparse emission. Popup-per-turn cap. **Strong alignment.** |
| `00-north-star` | "Weight of threads — losing a thread should hurt" | Sever (Phase 3) delivers this. **Phase 1 alone does not yet hit this North Star bar — see §15 phasing note.** |
| `01-core-loop` | Aftermath is the beat where threads thicken | Feedback IS the aftermath beat reframed (§8.4 Q5). **Strong alignment.** |
| `01-core-loop` | Turn-based is load-bearing | §2 Non-Goals explicitly: no mid-tick popups; vignettes fire on turn-start. **Strong alignment.** |
| `02-non-negotiables` #1 | Player is a god, not a protagonist | §9.8: feature is read-only from player perspective. **Strong alignment.** |
| `02-non-negotiables` #2 | Narrative over mechanical perfection | Stances are prose; dimensions are dev-only. **Strong alignment.** |
| `02-non-negotiables` #3 | All mechanics surface through prose, never numbers | §11 dimensions hidden; §5 stances named. **Strong alignment.** |
| `02-non-negotiables` #4 | Everything is a graph node/edge | Feedback state is properties of the existing thread edge (internal to the bond, the canonical use for properties). **Aligned, with one Phase 3 flag — see §20 rival pressure note.** |
| `02-non-negotiables` #5 | Expansive design, conservative implementation | Brainstorm companion at `2026-05-11-agent-feedback-brainstorm.md`; §17 alternatives. **Strong alignment.** |
| `02-non-negotiables` #6 | Additive over destructive changes | §14 Blast Radius confirms all schema changes additive. **Strong alignment.** |
| `02-non-negotiables` #7 | Three pillars always present | §7 / §8 / §9 / §10. **Strong alignment.** |
| `03-design-tensions` #2 | Systemic emergence vs. authored moments | Signal-driven dimensions (emergent) expressed through authored prose templates (curated). **Strong alignment.** |
| `03-design-tensions` #3 | Divine remove vs. player attachment | Distance preserved (read-only feature; refusal preserves sovereignty). Attachment earned (accreting events build named-mortal recall). **Strong alignment.** |
| `03-design-tensions` #4 | Mechanical legibility vs. narrative mystery | Stances named (legible); dimensions hidden (mystery); refusal gated by intuition+ awareness so legibility is *earned* through investment. **Strong alignment.** |
| `03-design-tensions` #5 | One perfect story vs. portfolio breadth | **See §9.10 front-of-stage rule — added 2026-05-11 to address this tension explicitly.** |
| `taste-profile` | All entries audited prior; no conflicts. Prose-first UI, narrative > mechanical, god-not-protagonist, turn-based, austere voice, meeting-encounter prose bar, graph edges, encounter-specific verbs — all respected. | **Strong alignment.** |

### Premises this design adds where Vision was silent

- **Does the mortal know they're threaded?** Resolved here via the awareness ladder (already exists in code). Awareness is the gate for the dramatic apex (refusal, communion).
- **Is divine attention fungible across the portfolio?** Yes — neglecting one agent to focus on another causes Devotion decay in the neglected agent. This design takes a position; Vision is silent.
- **Whether prayer is one-way.** This design says no — prayer travels back through the thread as a felt experience. **Vision-edit applied 2026-05-11.**

### Vision edit applied (2026-05-11)

Expanded `Vision/02-non-negotiables.md` item #1 ("The player is a god, not a protagonist") with the two-way premise:

> The asymmetry is also two-way. The god intervenes; the mortal responds. The mortal's response — prayer, doubt, gratitude, refusal, communion — travels back through the thread as part of how the player perceives the bond. Without the return channel, sovereignty is something we *say* mortals have; with it, sovereignty is something mortals *exercise*. Both directions of the thread are load-bearing to the texture of play.

Folded into item #1 rather than creating a new item #8 — the two-way premise is doctrinally part of the god-not-protagonist principle, not a separate non-negotiable.

## 19. NFP Compliance Table

| NFP | Status | Notes |
|---|---|---|
| #1 Tunability | PASS | All weights, thresholds, decay rates in `src/engine/agentFeedbackConstants.ts`; no inline magic numbers. Full table §11. |
| #2 Inspectability | PASS | Trace categories defined §7.2, §12. DebugPanel Feedback tab §9.7. |
| #3 Determinism | PASS | All stochastic operations seeded; PRNG seeds enumerated §7.7. |
| #4 Fail-soft | PASS | Fail-soft table §7.6. Tick loop never throws on feedback errors. |
| #5 Narrative > mechanical | PASS | Stances are prose, numbers are dev-only. Quality bar enforced. |
| #6 Additive > destructive | PASS | All schema additions optional; old saves load. No destructive changes. |
| #7 Performance budget | PASS with note | One additional tick phase per threaded agent. Threading is bounded (typically < 20 agents); per-agent work is small (~6 signals, 1 stance recompute, ≤1 event emission). Profile in Phase 1 closeout. |

## 20. Dependencies & Coordination

### Hard dependency
- **THR-389 (Done 2026-05-09)** — encounter foreshadowing with intent prose + intervention attribution. Live precedent. **Phase 1 implementation must read THR-389's plan doc and commit before writing code** to ensure stance-aware feedback reuses the intent-prose enrichment infrastructure rather than parallel structures.

### Soft dependency / coordinate
- **THR-69 (Idea, High)** — Sovereignty vs Consumption audit. Doctrinal frame for what divine favor feels like. Recommend either rolling THR-69's audit into this plan's Phase 1, or running THR-69 before this lands so we have the doctrine. **Bias: run THR-69 first; it's a fast audit and the doctrine is load-bearing.**
- **THR-66 (Idea)** — Rival Ascendant activation. Phase 3 rival pressure uses static rival heuristics today and upgrades automatically when THR-66 ships. No blocking dependency. **Graph-edge coordination flag (per Vision audit, non-negotiable #4).** Today's rival-pressure signal reads aggregate properties (`RivalState.hostilityToPlayer + rival.agentsControlled`). If THR-66 introduces explicit `rival→agent` pressure edges, the Phase 3 implementation must consume those edges instead of the aggregate, per the graph-edges-not-property-bags non-negotiable. If THR-66 decides to keep rival pressure as aggregate (because per-agent pressure isn't load-bearing), that is a deliberate choice and should be flagged in THR-66's plan doc. Either decision is fine; the *unflagged* path drifts.
- **THR-400 (In Design)** — Faction action expansion. Overlap on faction-level feedback (worship boost). Coordinate edge schema if either touches faction `member_of` semantics.
- **THR-399 (In Design)** — self-actions (Meditate, Withdraw, etc.). Touches the same Ascendant tray surface. No direct overlap, but verify no shared state mutation conflicts during simultaneous CC pickup.

### Project assignment
- **Project:** Social Systems Expansion (id `2c1f9440-eeff-4a55-b058-b53f0548892a`, status Now, priority High).
- **Rationale:** This is a social/relational system that informs encounters, not an encounter UI surface. Social Systems Expansion is the natural home and is in Now state.

### Suggested CC handoff coordination block (Phase 1)

```
Suggested model: opus-4-7   (judgment-heavy: prose-first UI, threading invariants, stance threshold tuning)
Parallel-safe with: THR-399, THR-400 (no file overlap if those land first)
Mutex with: any work touching src/types/influence.ts → ThreadEdgeProperties
Codex review: yes (post-Phase 1 PR)
```

Apply `model:opus-4-7` label per Rule 10 (memory `feedback_model_lanes_are_queue_filters`).

---

## Appendix A — File-level change summary (Phase 1)

| Action | File |
|---|---|
| Add | `src/engine/agentFeedbackConstants.ts` |
| Add | `src/engine/phaseAgentFeedbackDrift.ts` |
| Add | `src/engine/agentFeedbackSignals.ts` (treatment input aggregation) |
| Add | `src/engine/agentFeedbackStance.ts` (stance computation + transitions) |
| Add | `src/engine/agentFeedbackEvents.ts` (event emission) |
| Add | `src/data/agent-feedback-content.ts` (prose tables) |
| Modify | `src/types/influence.ts` (add `feedbackState?` to `ThreadEdgeProperties`) |
| Modify | `src/engine/traceBuffer.ts` (add `agent_feedback_*` categories) |
| Modify | `src/engine/proseEnrichment.ts` (new placeholders + conditional blocks) |
| Modify | `src/engine/tickOrchestrator.ts` (register new phase) |
| Modify | `src/components/Game/tabs/BondsTab.tsx` (Through the Thread section) |
| Modify | `src/components/DebugPanel/...` (Feedback sub-tab) |
| Modify | `src/debug-bridge.ts` (`getFeedbackState` helper) |
| Modify | `Docs/plans/wiring-checklist.md` |
| Modify | `Docs/plans/2026-04-16-systemic-wiring-guide.md` |

## Appendix B — Telemetry questions Phase 1 closeout should answer

1. What's the distribution of stances across a full 200-tick run with 5 threaded agents?
2. What's the mean ticks-per-stance? Is hysteresis high enough?
3. How many feedback events per threaded agent per 100 ticks? (Target: 5-15.)
4. What's the prose variant coverage — are we hitting the same 5 variants over and over or rotating through the pool?
5. Does the `worldVersion` bump on stance changes cause selector thrash anywhere?

Run via the headless CLI (`npm run cli -- --seed 42 --map medium`, then `run 200`, then `eval state.graph.edges.filter(...).map(...)` to inspect feedback states).

---

**Last reviewed:** 2026-05-11 by Cowork. Vision audit completed against all five Vision pages 2026-05-11 (initial draft had partial audit against `taste-profile.md` only due to MCP outage; rerun on full vault). Revisions landed: §9.10 front-of-stage rule (Tension #5), §15 Phase 1 emotional-payoff caveat, §20 rival-pressure-as-edge coordination flag, §18 full audit table, Vision/02-non-negotiables.md item #1 expanded with two-way thread premise. Review trigger: at Phase 1 closeout, at any user verdict shift on stance model, or if user changes the player-as-god framing in Vision.
