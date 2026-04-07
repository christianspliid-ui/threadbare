# Three-Tier Attention Model — Design Spec

**Date:** 2026-04-05
**Status:** Ready for review
**Approach:** Approach A — Tier-at-Source

## Overview

A system to classify encounters into three attention tiers (background, shaping, story beat) that control how events surface to the player. Combined with a divine attention capacity mechanic, dormant thread state, an active "Read the Threads" digest ability, and ambient hex map activity indicators.

The goal: the player is never overwhelmed by notifications, always feels the world is alive, and has meaningful strategic control over what they perceive.

## Load-Bearing Decisions

- **12 ticks per game day** (1 tick = 2 hours). All pacing constants derive from this.
- **Approach A: Tier-at-Source.** Each template carries an `intrinsicTier` field. Effective tier is computed once at encounter initiation and stored on the encounter record. All downstream systems read the stored tier.
- **Attention capacity is a soft-capped ascendant stat**, not a hard UX constant. It grows sublinearly with progression. The curator's shaping budget derives from it.
- **Overload is a trade-off, not a punishment.** Information compresses under strain but nothing breaks. No thread fraying, no garbled text. Just less detail per event.
- **Story beats are strictly sequential.** Never concurrent. Queued with a pacing governor.

## Section 1: The Four Visibility States

### The Player Contract

The player is a newly ascended god. Their perception is limited to what their thread network can see. Within that visible world, events arrive at three urgency levels. Beyond that, the world runs without them.

### State 0: Beyond the Veil (Invisible)

The simulation runs everywhere. All agents make decisions, enter encounters, grow, fight, die. The player perceives nothing outside their line of sight. Events on invisible hexes produce no notifications, no digest entries, no ambient signals. The player discovers aftermath when they extend LOS later.

**LOS sources (existing system, unchanged):**
- Avatar hex + `AVATAR_SIGHT_RANGE` (currently 0)
- Threaded agents (tier >= 1) at their hex + `AGENT_SIGHT_RANGE` (currently 1)
- Scry targets at their hex + `SCRY_SIGHT_RANGE` (currently 0)
- Artifact threads: hex + 0 range, LOS beacon only, no notifications about bearer
- Legendary artifact threads: hex + 1 range, background-level bearer encounter info
- Location threads: hex + 0 range, awareness of encounters at that location by any agent (see below)
- All ranges modifiable via `getModifiedValue()`

**The "unseen story" problem:**
When major events happen beyond perception, the player discovers aftermath through:
- Exploration (moving agents into the area)
- Scry (peeking at distant hexes)
- Faction channels (if threaded to an affected faction)
- Gossip/rumour system (v2 — agents at taverns hear distant events)

### State 1: Background (Visible, Silent, Proactive Access)

Encounters on visible hexes where `effectiveTier` resolves to `background`. The world is in motion — the player can see it (ambient hex map icons) but isn't told about it.

**What the player sees:**
- Per-reach micro-icons on agent dots on the hex map (see Section 5: Ambient Activity Layer)
- No toasts, no alerts, no popups
- Agent detail panel shows current activity when clicked: "Serafina is training at Ironhold Forge (step 2/3)"

**Outcome handling:**
- Outcomes accumulate silently in the digest buffer (`state.digestBuffer[]`)
- Player accesses them via click-to-inspect (per agent) or Read the Threads ability (court-wide)
- Digest buffer retains entries for 48 ticks (4 game days). Older entries decay and vanish.

**Promotion triggers (background -> shaping):**
- Agent wounded or quintessence drops below 30%
- Encounter outcome reveals hidden site, anomaly, or artifact
- Encounter triggers next stage of a multi-stage chain
- Agent achieves tier promotion during the encounter

### State 2: Shaping (Visible, Notified, Optional)

Encounters on visible hexes where `effectiveTier` is `shaping` AND the encounter survives the curator's attention budget.

**What the player sees:**
- A **thread tug** — the thread line to the agent vibrates on the hex map with a reach-coloured pulse. Colour indicates domain, intensity indicates threat. No text, no agent name — just an abstract sensory clue. (See Section 3: Thread Tugs for full mechanic.)
- Tug lingers for `THREAD_TUG_LINGER` ticks (default 3 = 6 in-world hours), slowly fading.

**Player choices:**
- **Attend** (click the vibrating thread or agent dot): Tug resolves into full shaping notification — situation prose, stakes, 1-2 intervention choices (costing essence). Deducts attention from pool.
- **Ignore** (don't click within linger window): Encounter auto-resolves at baseline probability. Outcome goes to agent's Chronicle and to digest buffer. No attention cost.

**Curated overflow (encounters that didn't make the budget):**
- Demoted to background for notification purposes. Encounter still resolves at full fidelity.
- Appears in Read the Threads digest under "Missed Opportunities" section.
- **In-the-moment feedback:** Two ambient signals fire simultaneously:
  - **Thread pulse:** The thread line to that agent briefly flickers on the hex map — a single quick flash. Spatial signal: *where* it happened.
  - **Attention meter tick:** The attention meter briefly flashes to show a shaping event was compressed. Systemic signal: *you're at capacity*.
- No text, no interruption. The player who notices can click the agent to investigate. The player who doesn't loses nothing — it auto-resolved.
- Narrative framing: "A thread vibrates. A mortal's fate brushed against your awareness, but your gaze was elsewhere."

**Promotion triggers (shaping -> story beat):**
- Final step of a multi-stage encounter chain
- 3+ agents converge on the same encounter/location simultaneously
- Doom clock crosses a tier boundary during the encounter
- Faction conflict produces a battle node

### State 3: Story Beat (Visible, Mandatory, Pausing)

Encounters on visible hexes where `effectiveTier` is `story_beat` and the pacing governor permits.

**What the player sees:**
- Simulation pauses. Dramatic modal with rich prose, stakes summary, concept art where available.
- Multi-phase: encounter plays out over several steps with choices at key transitions.
- No shaping thread tugs fire during an active story beat — attention is fully committed.
- Background encounters continue silently and accumulate in digest buffer.

**Pacing governor (strict serialization):**
```
Can a story beat fire this tick?
  -> Is there an active story beat? -> NO: block, queue it.
  -> Is cooldown elapsed since last completed? -> NO: queue it.
  -> Is the queue empty? -> Fire highest-priority queued beat.
  -> Otherwise: fire the new beat.
```

**Queue management:**
- Maximum queue depth: 3 pending story beats
- Priority order: doom-clock-driven > faction-war > promoted-from-shaping > template-intrinsic
- While queued: relevant hex gets a "gathering storm" visual indicator (building glow/swirl). Hover shows: "A crisis brews at [location]. It will demand your attention soon."
- If a 4th story beat would queue: lowest priority demoted to shaping (resolves as rich toast with choices, not full modal)
- Minimum cooldown: `STORY_BEAT_COOLDOWN = 12` ticks (1 game day) between story beat completions

**Resolution consequences:**
- Territory changes, agents die or transform, faction alliances shift, doom clock moves
- These are the moments the player tells stories about

### The Layering Diagram

```
All encounters in simulation
  +-- Beyond the Veil (no LOS) -- world runs, player blind
  +-- Visible (LOS via threads)
       +-- Background -- ambient icons, digest buffer, proactive access
       +-- Shaping -- curated toasts, optional engagement, attention cost
       +-- Story Beat -- modal, pauses sim, mandatory engagement, sequential only
```

### Thread Types and Their Contribution

| Thread target | LOS contribution | Encounter notifications | Attention cost |
|---|---|---|---|
| Actor (the_first) | Agent hex + AGENT_SIGHT_RANGE | Full tier model, minimum shaping | Highest |
| Actor (retinue) | Agent hex + AGENT_SIGHT_RANGE | Full tier model | Standard |
| Actor (watched) | Agent hex + AGENT_SIGHT_RANGE | Background + rare shaping | Low |
| Actor (dormant) | None (hex goes dark unless other source) | Silent, only via Read the Threads | Zero |
| Location | Location hex + 0 | Encounters at that location by any agent (background tier, vague — no agent names unless also threaded) | Low |
| Artifact | Artifact hex + 0 | None (LOS beacon only) | Zero |
| Legendary Artifact | Artifact hex + 1 | Background-level bearer encounter info | Minimal |
| Faction (future) | All faction member hexes? | Faction-level events only | TBD |

### Location Thread Detail

Threading a location is planting a ward — a divine mark that lets the god sense the shape of events there without knowing individuals. Surveillance, not intimacy.

| What happens at the location | What the player perceives |
|---|---|
| Unthreaded agent does background encounter | Ambient hex icon visible. Read the Threads digest shows under "Watched Locations" — vague: "Activity at Stonehearth Market: a merchant traded successfully." No agent names. |
| Threaded agent does encounter there | Normal tier resolution via agent's court position. Location thread adds nothing extra. |
| Something happens to the location (promotion, unrest, raid) | Background digest entry. If significant (destroyed, faction takeover), promoted to shaping. |
| Nobody does anything | Hex visible, no activity icons. Player sees it's quiet. |

## Section 2: Tier Classification System

### The intrinsicTier Field

Every encounter template gets a new required field:

```typescript
intrinsicTier: 'background' | 'shaping' | 'story_beat'
```

This is the template's default tier — what it is when no player relationship modifies it. A foraging run is intrinsically background. A faction leadership challenge is intrinsically shaping. A siege is intrinsically a story beat.

This field is:
- **Authored** — template creators set it explicitly
- **Auditable** — grep the codebase and see every template's classification
- **Stable** — does not change at runtime (effective tier does, intrinsic doesn't)
- **Present on both systems** — EncounterTemplate and UnifiedActionTemplate both carry it

### The Effective Tier Matrix

At encounter initiation, the system computes `effectiveTier` from two inputs: the template's `intrinsicTier` and the agent's `courtPosition`.

| intrinsicTier \ courtPosition | null (no thread) | dormant | watched | retinue | the_first |
|---|---|---|---|---|---|
| **background** | invisible | invisible | background | background | **shaping** |
| **shaping** | invisible | invisible | background | shaping | shaping |
| **story_beat** | invisible | invisible | **shaping** | story_beat | story_beat |

**Rules encoded in this matrix:**
1. No thread (null) or dormant = always invisible. No exceptions.
2. Watched demotes by one tier (shaping -> background, story_beat -> shaping). Watched is for surveillance, not engagement.
3. Retinue preserves the intrinsic tier exactly. This is the "designed experience."
4. The First promotes background to shaping. Everything the protagonist does matters.
5. Story beats are never promoted (nothing above story_beat). They can only be demoted (watched) or preserved (retinue/first).

**The function:**

```typescript
type AttentionTier = 'background' | 'shaping' | 'story_beat';

function resolveEffectiveTier(
  intrinsicTier: AttentionTier,
  courtPosition: CourtPosition | null,
): AttentionTier | 'invisible' {
  if (!courtPosition || courtPosition === 'dormant') return 'invisible';

  const matrix: Record<CourtPosition, Record<AttentionTier, AttentionTier>> = {
    watched:   { background: 'background', shaping: 'background', story_beat: 'shaping' },
    retinue:   { background: 'background', shaping: 'shaping',    story_beat: 'story_beat' },
    the_first: { background: 'shaping',    shaping: 'shaping',    story_beat: 'story_beat' },
  };

  return matrix[courtPosition]?.[intrinsicTier] ?? 'background';
}
```

**Where it's called:**
- At encounter initiation (in `phaseAgentDecision` / `initiateEncounter`)
- Result stored on encounter progress record: `effectiveTier: AttentionTier`
- Downstream systems read the stored value, never recompute

**Special case — multi-agent encounters:**
When an encounter involves agents at different court positions, use the highest court position for tier resolution. The player cares most about their most-invested participant.

### Mid-Encounter Promotion

The stored `effectiveTier` can be upgraded (never downgraded) during the encounter. Checked after each step resolution:

| Trigger | Promotion | Condition |
|---|---|---|
| Wound | background -> shaping | Agent quintessence drops below 30% or acquires wound attachment |
| Discovery | background -> shaping | Step outcome reveals hidden site, anomaly, or artifact |
| Chain advance | background -> shaping | Step completes a chain stage prerequisite |
| Tier promotion | background -> shaping | Agent achieves capability tier promotion |
| Chain culmination | shaping -> story_beat | Final step of a multi-stage chain (3+ stages) |
| Multi-agent convergence | shaping -> story_beat | 3+ threaded agents at same encounter location |
| Doom threshold | shaping -> story_beat | Doom clock crosses tier boundary during encounter |
| Battle escalation | shaping -> story_beat | Faction conflict produces battle node at encounter location |

When promotion occurs:
- `effectiveTier` updated on encounter record
- Next tick, `phaseEncounterVisibility` sees new tier and routes accordingly
- If promoted to story_beat, pacing governor evaluates fire-or-queue
- Trace emitted: `EncounterPromotionTrace { encounterId, previousTier, newTier, trigger }`

### Migration: Classifying Existing Templates

**Bulk classification seed (159 main templates):**

| threatRating | -> intrinsicTier | Count | Rationale |
|---|---|---|---|
| trivial | background | 34 | Guaranteed-pass daily activities |
| easy | background | 37 | High success rate, routine tasks |
| moderate | shaping | 48 | Meaningful challenges, player-interesting |
| hard | shaping | 32 | Serious encounters with real stakes |
| deadly | story_beat | 8 | Climactic, rare, consequential |

**Hand-adjustment pass after bulk:**
- Chain-culminating encounters: promote to shaping or story_beat regardless of threat rating
- Faction encounters: map from `questType`: standard -> background, senior -> shaping, elite -> story_beat
- Social encounters: default to shaping (agent interactions are inherently interesting if threaded)
- Discovery encounters (hidden sites, anomalies): promote to shaping even if threat is easy
- Monster encounters: map by threat rating with bias toward shaping

**Unified action templates (rarityTier mapping):**
- rarityTier 1 (Mundane) -> background
- rarityTier 2 (Uncommon) -> shaping
- rarityTier 3 (Rare) -> story_beat
- rarityTier 4 (Epic) -> story_beat

## Section 3: Attention Capacity & The Curator

### Attention as a Pool (Flow Model)

Attention is a continuously regenerating pool — divine mana for perception. Not a daily budget with hard resets. The pool drains when the player attends to events and refills over time.

```typescript
interface AscendantAttentionState {
  attentionPool: number;        // current available (0 to capacity)
  attentionCapacity: number;    // maximum pool size (base + modifiers)
  attentionRegen: number;       // recovery per tick
}
```

**How it flows:**
- Pool starts full at game start
- Every tick, pool regenerates by `attentionRegen` (capped at `attentionCapacity`)
- Attending to a tug *spends* from the pool immediately
- High pool = clear perception. Low pool = degraded perception.
- No daily reset. Continuous, self-balancing.
- Player can **burst** (attend several tugs quickly) then recover over quiet ticks

**Capacity progression (tied to milestones, not time):**

| Progression milestone | Capacity | Regen/tick | Sustainable events/day | Burst capacity |
|---|---|---|---|---|
| Newly ascended | 6 | 0.4 | ~5 | 6 then depleted |
| Established court | 10 | 0.7 | ~8 | 10 then depleted |
| Major power | 14 | 0.9 | ~11 | 14 then depleted |
| Peak (rare items/abilities) | 18 | 1.1 | ~13 | 18 then depleted |

Growth is sublinear with thread count. Doubling threads doesn't double capacity.

**Capacity modifiers (items, actions, traits):**
- Attachments: "Crown of Far-Seeing" +2 capacity, "Meditation Focus" +0.1 regen
- Sphere alignment: certain combinations grant +1-2 capacity
- Active effects: temporary boosts from divine actions
- Traits: earned through gameplay milestones

### Cost Structure — Tier x Court Position

**Base cost by event tier:**

| Event | Base cost | Rationale |
|---|---|---|
| Attend a shaping tug (moderate threat) | 1.0 | Standard divine focus |
| Attend a shaping tug (hard/deadly threat) | 1.5 | Deeper perception required |
| Story beat opening | 2.0 | Major event, significant focus |
| Story beat choice (per phase) | 0.5 | Sustained attention during multi-phase |
| Notable background event (auto) | 0.5 | Registers on consciousness passively |
| Thread tug ignored | 0 | Attention never spent |

**Court position cost multiplier:**

| Court position | Multiplier | Narrative |
|---|---|---|
| the_first | 0.5x | Protagonist's thread is part of you. Perception flows naturally. |
| retinue | 1.0x | Inner circle. Standard focus. |
| watched | 1.5x | Distant thread. Must strain to perceive. |

**Combined examples:**
- Moderate shaping tug for The First: 1.0 * 0.5 = **0.5 pool cost**
- Hard shaping tug for retinue agent: 1.5 * 1.0 = **1.5 pool cost**
- Moderate shaping tug for watched agent: 1.0 * 1.5 = **1.5 pool cost**
- Story beat for retinue: 2.0 * 1.0 = **2.0 pool cost** (+ 0.5 per phase choice)

This naturally guides the player toward focusing on invested agents. The First is *cheap* to perceive. Watched agents are *expensive*. Both are available — the player chooses based on current pool level and strategic priority.

### Thread Tugs — The Core Mechanic

The attention pool is not a behind-the-scenes filter. It is a **player-facing moment of choice** implemented through thread tugs.

**How a thread tug works:**

When a shaping-eligible encounter begins for a threaded agent, the player's corresponding thread *vibrates* on the hex map. The thread line pulses with an abstract sensory clue:

- **Colour** communicates the reach domain (red for Warfare, blue for Lore, gold for Commerce, etc.)
- **Intensity** communicates threat level (faint pulse for moderate, strong pulse for hard/deadly)
- **No text.** No agent name. No encounter description. Just: *this thread is vibrating, and it feels like [colour/intensity]*.

**The player's choice (per tug):**

Each tug is an implicit question: "Do you want to spend attention to look closer?"

- **Attend** (click the vibrating thread or agent dot): Tug resolves into full shaping notification — situation prose, stakes, intervention choices. Pool cost deducted.
- **Ignore** (don't click within linger window): Encounter auto-resolves at baseline. Outcome goes to digest buffer. Tug fades. No pool cost.

The player chooses based on **incomplete information** — which agent the thread connects to (they know), what domain it feels like (colour), and how serious it feels (intensity). "That's Kael's thread, and it feels dangerous. I should look." vs. "That's Mira's thread, something commercial. She can handle it."

**Tug timing:**
- `THREAD_TUG_LINGER = 3` ticks (6 in-game hours). Pulse slowly fades over this window. After expiry, auto-resolve.
- `ATTEND_COOLDOWN = 1` tick minimum between attending tugs. The god can't instantly perceive two things. Multiple tugs can vibrate simultaneously, but attending one starts a 1-tick cooldown before the next can be attended.
- At most `MAX_CONCURRENT_TUGS = 3` active tugs at once (prevent visual noise). Additional tugs queue.

**Missed tug signals:** When a tug expires unattended:
- Thread pulse (final quick flicker as it fades — spatial: *where* it happened)
- Thread network aesthetic shifts subtly (systemic: *something was missed*)

### FOMO Calibration

The system generates **~30-50% more tugs than the player's sustainable attention rate.** This is the core calibration target.

- Sustainable rate ~8/day -> player feels ~11-12 tugs/day
- Can't attend to everything -> must choose -> choice is meaningful
- Quiet days (few threads, peaceful area) are fine — no fabricated tugs
- Noisy days (many retinue, active world) produce natural overflow

**Pre-filtering for extremely high throughput:**

If raw shaping candidates far exceed target tug count:
```
Raw shaping candidates this tick
  -> Score all by curation factors
  -> Keep top (sustainable_rate * 1.4 / TICKS_PER_DAY) candidates per tick
  -> These produce thread tugs
  -> Bottom candidates: silent auto-resolve to background, no tug
  -> Player clicks some tugs -> full notification (costs pool)
  -> Unclicked tugs fade -> auto-resolve, outcome to digest
```

### Curation Scoring Factors

Used to rank which shaping candidates produce tugs (and in what order):

| Factor | Weight | Source | Rationale |
|---|---|---|---|
| Court position | 0.3 | the_first=1.0, retinue=0.7, watched=0.3 | Player investment |
| Threat severity | 0.15 | threatRating mapped 0-1 | Higher stakes = more interesting |
| Chain progress | 0.2 | Is this a chain stage? Final stage? | Narrative continuity |
| Agent recency | -0.15 | Ticks since this agent last produced a tug | Rotate across agents |
| Reach variety | 0.1 | Same reach as last tug? Penalty | Prevent monotony |
| Faction relevance | 0.1 | Count of threaded agents in this faction | Implicit player interest |
| Ambition alignment | 0.1 | Encounter reach matches agent's active ambition | Agent's own goals |

Weights are tunable constants. Scoring needs reasonable variety, not perfection.

### The Overload Curve — Visual, Not Numeric

No numbers on the HUD. Attention state communicated through the **aesthetic quality of the thread network**:

| State | Pool level | Visual treatment |
|---|---|---|
| **Focused** | > 60% capacity | Threads glow steadily, clear and bright. Tugs crisp and distinct. Colours reliable. |
| **Busy** | 30-60% | Threads slightly buzzy. Tugs still clear. Player is spending actively. |
| **Strained** | 10-30% | Threads blur. Tugs faster, less distinct. Colour clues muddy — harder to tell reach type. |
| **Overwhelmed** | < 10% | Thread network buzzes with agitation. Tugs overlap and compete. Colour clues unreliable. |

**Moment-to-moment dynamics:**
- *Quiet period:* Pool fills. Threads luminous and clear. The god is well-rested.
- *Burst:* Three tugs in two ticks. Player attends all — pool drops from 80% to 50%. Threads dim. Worth it.
- *Story beat:* Costs 2 up front + 0.5 per phase. A 4-phase beat costs 4. Enter at 50%, exit at ~25%. Strained. Needs quiet ticks to recover.
- *Post-crisis:* Threads slowly brighten over 5-6 ticks as pool refills. The god recovers from divine exertion.

**The consequence of overextension:** Not lost information, but degraded information quality. Encounters still resolve. Outcomes still exist. But the player's ability to *choose wisely* erodes. Recoverable: stop attending tugs, prune threads to dormant, and clarity returns.

**Opt-in numeric detail:** Thread management UI panel (not HUD) shows pool level and recent events for players who want the numbers.

## Section 4: Dormant Thread State — "The Slumbering Eye"

### The Fifth Court Position

The court hierarchy becomes:

```
the_first -> retinue -> watched -> dormant -> (no thread)
```

Dormant is the god choosing to close one eye. The thread exists but hangs slack. The mortal senses the divine presence withdraw. The connection is maintained for later reactivation, but contributes nothing passively.

### Dormant Properties

| Property | Watched | Dormant |
|---|---|---|
| Passive LOS | Yes (hex visible) | **No** — hex goes dark unless another source covers it |
| Background encounters | Buffer in digest normally | Buffer in digest, **but only accessible via Read the Threads** |
| Thread tugs | Occasional (low priority, high cost) | **None** — all encounters forced to invisible |
| Attention pool cost | 1.5x multiplier when attended | **Zero** — completely silent |
| Essence upkeep | Standard tier cost | **Reduced** (50% of watched) |
| Connection maintained | Yes | Yes — can reactivate later |
| Divine action targeting | Yes | Yes — can still fire actions on them |
| Agent's `awareness` property | faith/intuition | Shifts toward `intuition` — they sense something but the god isn't listening |

### Entering and Leaving Dormant

**Dormanting a thread** — divine action:
- Essence cost: small (2-3)
- Narrative: *"You release your grip on [agent]'s thread. It slackens but holds. Their voice fades to a whisper at the edge of your consciousness."*
- Immediate: LOS from this agent's hex removed (unless another source covers it). Active encounter notifications cancelled, auto-resolve. Thread visual dims to faint grey.

**Reactivating a dormant thread** — divine action:
- Essence cost: slightly higher (3-5). Waking costs more than sleeping.
- Cooldown: `DORMANT_REACTIVATION_COOLDOWN = 3` ticks (6 hours). No rapid toggling.
- Narrative: *"You tighten the thread. [Agent] stirs, sensing your renewed attention."*
- Immediate: LOS restored. Encounters flow through tier system normally. Thread brightens.

### Dormant in Read the Threads

When the player invokes Read the Threads, dormant agents appear in a separate, vaguer section:

```
=== Dormant Court ===
Faint echoes along slackened threads...

[agent name]: The thread murmurs of [vague reach-flavoured description].
  Outcomes unclear. Reactivate to learn more.

[agent name]: Silence. Nothing stirred.
```

No specific capability deltas, no attachment names, no encounter identities. Just a sense of "something happened in this domain" or "nothing happened."

**Reactivation reveals full record:** The digest buffer records everything regardless of dormancy. Reactivating then using Read the Threads gives full-fidelity retroactive access. The data was always there — the god just wasn't listening.

### Late-Game Court Composition

Dormant solves the scaling problem without severing relationships:

```
Typical late-game court:
  1 the_first   -- full engagement, 0.5x attention cost
  3-5 retinue   -- rich notifications, 1.0x attention cost
  3-5 watched   -- LOS + occasional tugs, 1.5x attention cost
  10-15 dormant -- maintained connections, zero cognitive load
  + artifact/location threads -- LOS beacons
```

The dormant threads are: "I invested in this relationship and I don't want to lose it, but I can't afford to listen right now."

## Section 5: Read the Threads — Active Digest Ability

### The Concept

The player has no passive digest. To learn what their court has been doing in the background, they must actively invoke a divine power — reaching along their threads to read echoes of the past. This costs essence and has a cooldown. Knowledge of the past is an act of divination, not a free report.

### The Ability

| Property | Value |
|---|---|
| Name | Read the Threads |
| Type | Divine action (unified action, scale: personal) |
| Target | Self (ascendant) |
| Duration | Instant (resolves same tick) |
| Cooldown | `READ_THREADS_COOLDOWN = 6` ticks (half a game day) |
| Prerequisite | At least 1 active (non-dormant) thread |
| Attention pool cost | 0 (reviewing the past doesn't consume present attention) |

### Lookback Window and Essence Cost

The player chooses how far back to look. Deeper = more expensive, less detailed.

| Lookback | Essence cost | Fidelity |
|---|---|---|
| 6 ticks (half day) | 2 | **Full** — agent names, encounter names, specific capability deltas, attachment names, outcome prose |
| 12 ticks (full day) | 4 | **High** — same but oldest entries slightly compressed |
| 24 ticks (2 days) | 8 | **Moderate** — encounter types and outcomes but not specific deltas |
| 36+ ticks (3 days) | 12 | **Vague** — grouped summaries only |

Cost doubling per step reflects increasing divine effort. Fidelity degradation is narrative: threads of the past fray with time.

### Digest Buffer

Silently accumulates during play. Every background encounter resolution appends an entry. Exists regardless of whether player ever reads it.

```typescript
interface DigestEntry {
  agentId: string;
  agentName: string;
  encounterId: string;
  encounterName: string;
  encounterType: EncounterType;
  reachPrimary: ReachDomain;
  tick: number;
  success: boolean;
  significantOutcomes: string[];
  capabilityChanges: Record<string, number>;
  attachmentsGained: string[];
  attachmentsLost: string[];
  quintessenceDelta: number;
  isNotable: boolean;
  wasCuratedOut: boolean;
  isDormantAgent: boolean;
  sourceType: 'agent' | 'location';
}
```

**Buffer retention:** `DIGEST_BUFFER_RETENTION = 48` ticks (4 game days). Older entries decay permanently.

**Notable threshold** — entry flagged `isNotable` if any of:
- `quintessenceDelta < -0.3` (significant wound/loss)
- Agent acquires wound or disease attachment
- Agent achieves tier promotion
- `attachmentsLost.length > 0`
- Encounter was a chain stage completion
- Reputation delta > 0.3

### Read the Threads Panel

Framed as divine vision:

*"You close your eyes and reach along the threads. Voices echo back through time..."*

Content grouped by reach domain, then by agent:

```
=== Reading the Threads (last 12 ticks) ===

WARFARE & CONFLICT
  Kael: Trained at Ironhold Forge. Capability grew (+0.4 Warfare).
  Mira: Sparred with a guard. Success.

COMMERCE & TRADE
  Joren: Completed a trade at Stonehearth Market. Acquired Bronze Shield.
  Two others traded successfully.

EXPLORATION
  Tessa: Explored the Northern Marshes. Discovered ruins.

>> NOTABLE
  Serafina was wounded during a sparring accident.
  You could have shaped Mira's guild negotiation.

=== Watched Locations ===
  Stonehearth Market: Commerce activity. A merchant traded.
  Northern Gate: Quiet.

=== Dormant Court ===
  Faint echoes along slackened threads...
  Aldric: The thread murmurs of something learned. Reactivate to know more.
  Bren: Silence.
```

**Panel design rules:**
- Grouped by reach domain, not chronologically
- Notable events get a callout section with individual lines
- Curated-out encounters ("missed opportunities") appear: "You could have shaped X."
- Location thread intel in separate section, vaguer than agent intel
- Dormant thread intel last, vaguest of all
- Older entries (deep lookback) progressively more compressed
- Compact: ~20 lines for half-day, ~40 for full day

### Interaction with Attention Pool

Reading the Threads costs **zero attention pool** — essence is the economic constraint. Attention pool is for present-moment perception; reviewing the past is a separate cognitive act.

Exception: if pool is in overwhelmed state (< 10% capacity), output is degraded — entries vaguer even within their fidelity tier. The overwhelmed god can't even look back clearly.

## Section 6: Ambient Activity Layer (Hex Map)

### Purpose

Background encounters produce no notifications. The hex map itself must communicate "the world is alive and your agents are busy" through ambient visual signals. This is the player's peripheral vision — motion and activity without text or notifications.

### Per-Reach Micro-Icons

Eight reaches (from the canonical cosmology), each with its own icon and colour. The ninth principle (Quintessence) has no reach icon — it transcends the sphere/reach duality.

| Reach | Sphere | Colour (hex) | Axiological axis | Archetype pair | Icon concept | Visual shorthand |
|---|---|---|---|---|---|---|
| Iron | Force | `#ff6b6b` (red) | Mercy / Ruthlessness | Protector / Conqueror | Crossed swords | Combat, training, martial |
| Stone | Matter | `#d4a87a` (copper) | Preservation / Transformation | Guardian / Shaper | Hammer/anvil | Building, crafting, making |
| Eye | Energy | `#ffe44d` (gold-yellow) | Revelation / Discretion | Seeker / Sentinel | Eye/compass | Watching, exploring, seeking |
| Gold | Life | `#33ff77` (green) | Asceticism / Extravagance | Mender / Magnate | Coin/scales | Trading, negotiating, growing |
| Veil | Mind | `#44aaff` (blue) | Tradition / Novelty | Archivist / Heretic | Spiral/rune | Magic, research, the uncanny |
| Heart | Spirit | `#cc66ff` (purple) | Loyalty / Ambition | Sworn / Renegade | Flame/banner | Persuading, bonding, leading |
| Star | Time | `#ffb355` (warm amber) | Sacrifice / Survival | Martyr / Survivor | Star/hourglass | Rituals, divination, enduring |
| Shadow | Entropy | `#8fd4c0` (teal) | Honesty / Cunning | Confessor / Puppeteer | Dagger/mask | Stealing, spying, hiding |

Quintessence (the ninth principle) has no reach icon — it transcends the sphere/reach duality and serves as a phase-transition threshold, not a domain of activity.

Source: `cosmology-symmetry.html` and Obsidian vault `Brainstorms/brainstorm-cosmological-symmetry`.

### Rendering Spec (HexMapV2 Layer)

**Geometry:**
- Size: 6-8px, positioned offset from agent dot (upper-right quadrant to avoid overlap)
- One icon per agent — shows current encounter's `reachPrimary`
- Disappears when agent is idle (no active encounter), moving (in transit), or outside fog

**Opacity and animation:**
- Base opacity: 50% — visible but not attention-grabbing
- Animation: gentle pulse cycle (1.5-2 second period). Slow fade in/out. Ambient, not urgent.
- Colour intensity scales subtly with encounter tier:
  - Background encounters: 40% opacity
  - Shaping-eligible: 60% opacity
  - Story beats: 80% with a faint ring

**Zoom behaviour:**

| Zoom level | Hex size (approx) | Icon treatment |
|---|---|---|
| Close (hex ~100px) | Full | Icons clearly visible with shape detail |
| Medium (hex ~40px) | Reduced | Icons as small coloured dots with shape hints |
| Far (hex ~15px) | Hidden | Icons disappear. Agent dots alone signal presence. |

**Clustering on same hex:**
- Up to 4 icons arranged in cardinal positions (N, E, S, W) around the agent dot cluster
- 5+ agents: collapse to a count badge with dominant reach colour

### Data Flow

Per-agent data needed: "is this agent in an encounter? what's the reachPrimary?"

1. Check `state.unifiedActions` for active action with this `actorId` -> read `reachPrimary`
2. Fallback: check `state.encounterProgress` for active encounter -> read `reachPrimary`
3. Neither -> agent is idle, no icon

Lightweight per-frame data read — one property lookup per visible agent.

### Thread Tug Visuals (Shaping Tier)

Thread tugs (Section 3) coexist with ambient icons but are visually distinct:

| Signal | Visual | Duration | Purpose |
|---|---|---|---|
| Background activity icon | Small, 50% opacity, slow pulse near agent dot | Persistent while encounter active | Ambient: "agent is busy" |
| Thread tug (shaping) | Thread line to agent *vibrates* with reach colour, brighter pulse | 3 ticks, fading | Active: "something interesting, click to attend" |
| Missed tug (expired) | Quick final flicker on thread line | Instant | Fleeting: "you missed something" |
| Story beat gathering storm | Hex glow/swirl, building intensity | Persistent while queued | Anticipation: "something big is coming" |

An agent doing a shaping encounter has both the activity icon (what) and the thread tug (invitation). The icon is static ambient. The tug is dynamic invitation to spend attention.

## Section 7: Agent Character Sheet Integration

### The Problem

Background encounters are silent. The agent's character sheet must be where the player sees the compounding effect of background work. When you click an agent after 20 ticks of background activity, the sheet should feel alive — things changed since you last looked.

### What Changes in the Character Sheet

**1. Activity Section (AgentDetailPanel — already exists)**

Currently shows: action name, step label, progress bar. Continues as-is for all tiers. Enhancement: background-tier encounters get a subtle "ambient" visual treatment — slightly muted compared to shaping or story-beat. Visual hint only, no functional difference.

**2. Recent Activity Log (new subsection in AgentDetailPanel)**

Compact list below Activity section. Populated from digest buffer filtered by `agentId`.

```
Recent Activity (last 12 ticks):
  t42  Iron: Sparred at Ironhold. Success. (+0.3 Iron)
  t38  Gold: Traded at Stonehearth. Acquired Bronze Shield.
  t35  Eye:  Explored Northern Marshes. Discovered ruins.
```

Design rules:
- Last 5-8 entries, compact
- Each entry: tick number, reach colour dot, one-line summary
- New entries (since player last viewed this agent) get a "new" indicator that fades after viewing
- Curated-out shaping encounters get a small marker: "You could have shaped this."
- Tap to expand for brief outcome summary

**3. Capability Growth Indicators (Domains grid — already exists)**

If a capability grew from background activity since player last viewed this agent, the bar shows a small **up-arrow** or **glow segment** on the added portion. Fades after viewing. Data source: digest buffer `capabilityChanges`.

**4. New Attachment Badges (Possessions section — already exists)**

Items acquired during background encounters get a "new" badge. Fades after viewing.

**5. Condition Alerts (Conditions section — already exists)**

Wounds, diseases, or curses from background encounters show with alert indicator. Important because wounds are a notable callout trigger — the player should see the consequence when inspecting.

### "Last Viewed" Tracking

Per-agent timestamp for "new" indicators:

```typescript
// UI state, not game state — Map or localStorage
lastViewedTick: Map<string, number>;  // agentId -> tick when player last opened detail panel
```

"New" indicators show entries where `entry.tick > lastViewedTick`. Opening panel updates timestamp. Simple `Map<agentId, number>` in React state or localStorage.

### Full Profile Modal (AgentProfileModal)

Chronicle tab gets a **"Background Record"** section alongside existing Timeline:
- All digest entries for this agent (not just last 5-8)
- Grouped by reach domain (matching Read the Threads panel structure)
- Filtered by knowledge level — lower knowledge = fewer details
- Timeline shows story-significant events. Background Record shows daily grind. Together: full picture of agent's life.

## Section 8: Pacing Constants & Calibration

All tunable constants in one place. Every magic number is a named export, registered in `src/components/CMS/tunableConstants.ts` for live tweaking via the CMS Configuration Manager (`?view=cms`).

**Source file:** All constants below live in a new `src/data/attention-constants.ts`, imported into the CMS registry alongside existing constant groups.

### Time Base

| Constant | Value | Rationale |
|---|---|---|
| `TICKS_PER_DAY` | 12 | Load-bearing. 1 tick = 2 hours in-world. |

### Attention Pool

| Constant | Value | Rationale |
|---|---|---|
| `ATTENTION_BASE_CAPACITY` | 6 | Starting pool for newly ascended. Grows via milestones. |
| `ATTENTION_BASE_REGEN` | 0.4 | Per-tick recovery at game start. ~5 sustainable events/day. |
| `ATTENTION_POOL_FOCUSED_THRESHOLD` | 0.6 | Above 60% capacity = focused (clear thread visuals) |
| `ATTENTION_POOL_BUSY_THRESHOLD` | 0.3 | 30-60% = busy |
| `ATTENTION_POOL_STRAINED_THRESHOLD` | 0.1 | 10-30% = strained (blurred tugs) |

### Attention Costs

| Constant | Value | Rationale |
|---|---|---|
| `ATTEND_COST_MODERATE` | 1.0 | Base cost for moderate-threat shaping tug |
| `ATTEND_COST_HARD` | 1.5 | Hard/deadly encounters need deeper focus |
| `ATTEND_COST_STORY_BEAT` | 2.0 | Story beat opening |
| `ATTEND_COST_STORY_PHASE` | 0.5 | Per-phase sustained attention during multi-phase beat |
| `ATTEND_COST_NOTABLE` | 0.5 | Notable background event auto-registers |
| `COURT_COST_MULTIPLIER_FIRST` | 0.5 | The First is cheap to perceive |
| `COURT_COST_MULTIPLIER_RETINUE` | 1.0 | Standard |
| `COURT_COST_MULTIPLIER_WATCHED` | 1.5 | Distant thread, must strain |

### Thread Tugs

| Constant | Value | Rationale |
|---|---|---|
| `THREAD_TUG_LINGER` | 3 | Ticks before unattended tug auto-resolves (6 in-world hours) |
| `ATTEND_COOLDOWN` | 1 | Minimum ticks between attending tugs |
| `MAX_CONCURRENT_TUGS` | 3 | Visual noise cap — max active tugs at once |
| `FOMO_OVERFLOW_RATIO` | 1.4 | Generate 40% more tugs than sustainable rate |

### Story Beat Pacing

| Constant | Value | Rationale |
|---|---|---|
| `STORY_BEAT_COOLDOWN` | 12 | Minimum ticks between story beat completions (1 game day) |
| `STORY_BEAT_QUEUE_MAX` | 3 | Max queued story beats |
| `STORY_BEAT_QUEUE_OVERFLOW_DEMOTE` | true | 4th queued beat demotes to shaping |

### Read the Threads

| Constant | Value | Rationale |
|---|---|---|
| `READ_THREADS_COOLDOWN` | 6 | Ticks between uses (half a game day) |
| `READ_THREADS_COST_6` | 2 | Essence cost for 6-tick lookback |
| `READ_THREADS_COST_12` | 4 | 12-tick lookback |
| `READ_THREADS_COST_24` | 8 | 24-tick lookback |
| `READ_THREADS_COST_36` | 12 | 36+-tick lookback |
| `DIGEST_BUFFER_RETENTION` | 48 | Ticks before entries decay (4 game days) |

### Dormant Threads

| Constant | Value | Rationale |
|---|---|---|
| `DORMANT_ESSENCE_MULTIPLIER` | 0.5 | 50% of watched upkeep cost |
| `DORMANT_ACTIVATION_COST` | 2 | Essence to dormant a thread |
| `DORMANT_REACTIVATION_COST` | 4 | Essence to wake (waking costs more) |
| `DORMANT_REACTIVATION_COOLDOWN` | 3 | Ticks before reactivated thread is fully online |

### Notable Thresholds

| Constant | Value | Rationale |
|---|---|---|
| `NOTABLE_QUINTESSENCE_LOSS` | 0.3 | QE drop > 30% flags as notable |
| `NOTABLE_REPUTATION_DELTA` | 0.3 | Rep change > 0.3 flags as notable |
| `NOTABLE_ATTACHMENT_LOSS` | true | Any attachment lost flags as notable |
| `NOTABLE_TIER_PROMOTION` | true | Capability tier promotion flags as notable |
| `NOTABLE_CHAIN_COMPLETION` | true | Chain stage completion flags as notable |

### Ambient Activity Icons

| Constant | Value | Rationale |
|---|---|---|
| `ACTIVITY_ICON_SIZE` | 7 | Pixels, base size |
| `ACTIVITY_ICON_OPACITY_BACKGROUND` | 0.4 | Background encounter opacity |
| `ACTIVITY_ICON_OPACITY_SHAPING` | 0.6 | Shaping-eligible opacity |
| `ACTIVITY_ICON_OPACITY_STORY` | 0.8 | Story beat opacity |
| `ACTIVITY_ICON_PULSE_PERIOD` | 1.75 | Seconds per pulse cycle |
| `ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD` | 15 | Hex pixel size below which icons hide |

### CMS Integration

All constants exported from `src/data/attention-constants.ts` and registered in `src/components/CMS/tunableConstants.ts` as a new group: **"Attention & Notification Tiers"**. Follows existing pattern: `n()` helper for numbers, `b()` helper for booleans, with `description`, `sourceFile`, `range`, and `usedBy` metadata.

## Section 9: Migration Plan (Existing Templates)

### Phase 1: Add intrinsicTier field to type definitions

Add `intrinsicTier: AttentionTier` to both `EncounterTemplate` and `UnifiedActionTemplate` interfaces. Required field.

### Phase 2: Bulk classify by threatRating

| Source | Mapping rule | Count |
|---|---|---|
| encounter-content.ts | trivial/easy -> background, moderate/hard -> shaping, deadly -> story_beat | 159 |
| faction-encounter-content.ts | questType: standard -> background, senior -> shaping, elite -> story_beat | ~58 |
| social-encounter-content.ts | Default shaping (social interactions are inherently interesting) | 14 |
| monster-encounter-content.ts | Map by threatRating, bias toward shaping | 17 |
| army-encounter-content.ts | Map by threatRating, bias toward story_beat | 17 |
| encounter-anomaly-content.ts | Default shaping (anomalies are discoveries) | ~25 |
| borderland-encounter-content.ts | Map by threatRating | 60 |
| unified-action-templates.ts | rarityTier: 1 -> background, 2 -> shaping, 3-4 -> story_beat | ~83 |

### Phase 3: Hand-adjustment pass

- Chain-culminating encounters: promote regardless of threat
- Discovery encounters (hidden sites, Elder sites): promote to shaping minimum
- Encounters with `questPriority > 1.0`: promote to shaping minimum
- CRUD-type unified actions: force to background

### Phase 4: Add effectiveTier to encounter progress records

Add `effectiveTier: AttentionTier | 'invisible'` to `EncounterProgress` and `UnifiedAction` runtime types. Populated at initiation by `resolveEffectiveTier()`.

### Phase 5: Wire into notification pipeline

Modify `phaseEncounterVisibility()` to branch on `effectiveTier`. Background -> digest buffer. Shaping -> curator pipeline. Story beat -> pacing governor.

### Phase 6: Add new systems

Digest buffer, curator, pacing governor, thread tugs, Read the Threads action, dormant court position, attention pool, ambient activity icons, agent character sheet enhancements.

## Section 10: NFP Compliance & Wiring

### NFP Compliance

| Priority | NFP | Status | Notes |
|---|---|---|---|
| 1 | **Tunability** | PASS | Every constant named in `attention-constants.ts`, registered in CMS. Tier matrix is data table. Curation weights tunable. |
| 2 | **Inspectability** | PASS | `effectiveTier` stored on encounter record. `EncounterPromotionTrace` on tier changes. Curator decisions logged. Attention pool inspectable in debug panel. |
| 3 | **Determinism** | PASS | Tier resolution is pure function. Curator scoring uses seeded PRNG for tiebreaking. Attention pool deterministic. |
| 4 | **Fail-soft** | PASS | Tier resolution failure -> default `background`. Curator failure -> surface all as toasts. Pacing governor failure -> fire immediately. Digest buffer append-only. |
| 5 | **Narrative over mechanical** | PASS | Thread tugs are narrative (god feels vibration). Read the Threads is divination. Dormant is "closing one eye." Overload is "perception blurs." |
| 6 | **Additive over destructive** | PASS | New fields added. No existing fields removed. Notification pipeline gains branch point. Existing behaviour preserved for shaping tier. |
| 7 | **Performance budget** | PASS with note | Curator scores ~5-15 candidates/tick. Digest buffer append-only. Activity icons lightweight. Profile thread tug visuals if > 20 concurrent threads. |

### Tick Cycle Wiring (validated against `Design/tick-cycle-reference.html`)

**Phase placement:**

| New system | Phase | Rationale |
|---|---|---|
| Tier resolution (`resolveEffectiveTier`) | **2b** Agent Decision | Encounters initiated here — compute tier at creation |
| Digest buffer accumulation | **2a.5** Encounter Progression | Outcomes produced here — append DigestEntry for background encounters |
| Mid-encounter promotion | **2a.5** Encounter Progression | Promotion triggers checked after each step resolution |
| Attention pool regen | **2a.6** Encounter Visibility (first step) | Regen before consumption avoids order confusion |
| Curator + thread tugs | **2a.6** Encounter Visibility | Extends existing notification generation |
| Pacing governor | **2a.6** Encounter Visibility | Story beat queuing is a notification-level decision |
| Read the Threads | Player action (inter-tick) | Divine action via unified action system |
| Dormant state changes | Player action (inter-tick) | Thread edge property modification |
| Digest buffer cleanup | Lazy (on read) | Prune entries > DIGEST_BUFFER_RETENTION on Read the Threads invocation |

**Data flow validation:**

```
Phase 2a.5 (Encounter Progression):
  reads: encounterProgress, graph, capabilities
  writes: encounterProgress, tickEvents, pendingSpherePressures, graph
  NEW writes: digestBuffer[] (for background encounters), effectiveTier (on promotion)

Phase 2a.6 (Encounter Visibility):
  reads: encounterProgress, graph (thread edges)
  writes: tickEvents, encounterNotifications
  NEW reads: effectiveTier (from encounter record), attentionPool
  NEW writes: activeThreadTugs[], digestBuffer (demoted shaping), attentionPool (regen)

Phase 2b (Agent Decision):
  reads: idle agents, encounterCache, distanceMatrix, cooldowns, familiarity
  writes: tickEvents, movementStates, encounterProgress
  NEW writes: effectiveTier (set on newly created encounter records)
```

**Ordering validated:**
- 2a.5 before 2a.6: promoted encounters surface this tick, not next
- 2a.6 before 2b: existing encounters notified before new ones initiated
- New encounters from 2b surface in next tick's 2a.6 (correct — needs 1 tick of existence)

**New GameState fields:**

| Field | Type | Write phases | Read phases/UI |
|---|---|---|---|
| `digestBuffer` | `DigestEntry[]` | 2a.5, 2a.6 | Read the Threads action, agent detail panel |
| `activeThreadTugs` | `ThreadTug[]` | 2a.6 | Hex map render, player click handler |
| `storyBeatQueue` | `QueuedStoryBeat[]` | 2a.6 | Pacing governor, story beat modal |
| `attentionPool` | ascendant node props | 2a.6, player actions | 2a.6 (curator), hex map (visual state) |

### Wiring Checklist

| Module | Orchestrator phase | UI component | GameState flow | Traces | Debug visibility | Player controls |
|---|---|---|---|---|---|---|
| Tier resolution | 2b | None (engine) | effectiveTier on encounter record | EncounterPromotionTrace | CLI: `encounters` shows tier | None (automatic) |
| Digest buffer | 2a.5 | Read the Threads panel | state.digestBuffer[] | None (accumulation) | CLI: `digest [N]` | Read the Threads action |
| Curator | 2a.6 | Thread tugs on hex map | state.activeThreadTugs[] | CuratorDecisionTrace | CLI: `tugs` | Click to attend |
| Pacing governor | 2a.6 | Story beat modal + storm indicator | state.storyBeatQueue[] | StoryBeatQueueTrace | CLI: `storybeats` | Engage with story beat |
| Attention pool | 2a.6 + player | Thread network aesthetic | attentionPool on ascendant | AttentionPoolTrace | CLI: `attention` | Manage threads, attend tugs |
| Dormant state | Player action | Thread management UI | courtPosition: 'dormant' | AttentionModeChangeTrace | CLI: `threads` | Dormant/reactivate actions |
| Activity icons | Render loop | HexMapV2 activity layer | Reads encounter records | None | Toggle in debug panel | None (ambient) |
| Character sheet | N/A (UI) | AgentDetailPanel, AgentProfileModal | Reads digestBuffer by agentId | None | N/A | Click agent |
