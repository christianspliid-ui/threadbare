# Intervention Delivery Mechanics — Design Document

**Date:** 2026-03-05
**Status:** Approved
**Origin:** Brainstorm session during Layer 2 (Divine Toolkit UI) planning
**Related:** Phase 2B Dream Interface & Divine Toolkit, Turn Economy & Player Influence, Stealth & Detection, Layer 1 Core Interaction
**Builds on:** `src/types/dream.ts` (InterventionType, InterventionDefinition), `src/engine/dream.ts` (executeIntervention), `src/engine/stealth.ts` (detection pipeline)

---

## 1. Problem Statement

The existing intervention system defines *what* each intervention does (sphere affinities, costs, detection risk, pipeline step) but not *how* it reaches the target. All eight intervention types currently execute as instant, range-free function calls — `executeIntervention()` takes an intervention type and returns a result with no spatial constraints.

This creates several gameplay problems:

- **No spatial strategy.** The player never has to think about *where* the avatar is relative to agents they want to influence. The map becomes irrelevant to divine intervention.
- **No travel cost.** Moving the avatar across the map has no mechanical weight. If every intervention works from anywhere, the avatar's position is purely cosmetic.
- **No risk/reward trade-off for proximity.** A hidden god should face a tension between staying safe (distant, indirect influence) and being effective (close, personal, powerful). Without range mechanics, this tension doesn't exist.
- **No narrative grounding.** "A god telekinetically persuades someone across the world" feels hollow. "A god's avatar walks into a tavern and speaks to a troubled warrior" is a story beat.

### 1.1 Design Principles

These follow from the project's non-functional priorities (CLAUDE.md):

- **Grounded avatar.** The godling was once a physical being. The avatar is their anchor to the mortal world. Power flows from proximity. Distance requires indirection.
- **Simple over complex.** No scaling ranges, no tier-dependent radius, no per-sphere modifiers on distance. Four delivery modes with clean rules.
- **Narrative over mechanical perfection.** Each delivery mode should *feel* different in the story. The mechanics serve the fantasy of being a hidden god walking among mortals.
- **Tunability.** Range thresholds, cost modifiers, and impact bonuses are all named constants. Changing the "feel" of proximity should mean changing numbers, not rewriting logic.

---

## 2. The Four Delivery Modes

Every intervention has exactly one delivery mode. The mode determines spatial requirements, narrative framing, and detection profile.

### 2.1 Astral — Mind-to-mind communion

**Range:** Unlimited
**Interventions:** Dream
**Fantasy:** The god enters the target's sleeping mind. Neither party moves physically. A shared dreamscape materializes where the god can speak, show visions, and plant suggestions — but cannot touch the physical world.

The "Teams meeting" of divine intervention. Cheap, safe, available earliest (tier 1), but limited in scope. The god can only *communicate* — reveal truths, plant suggestions, show visions, mislead — but cannot alter the agent's body, environment, or circumstances. The Dream Interface (manipulation types: whisper, inspire, suppress, reshape, implant, command) operates entirely within this mode.

**Key constraint:** The agent must be *asleep* or in a *trance-like state* (meditating, praying, ill/delirious). This creates a timing window — you can't Dream-intervene on an agent in the middle of a battle. This constraint is soft (most agents sleep every tick) but becomes relevant for urgent situations.

**Detection profile:** Low cosmic noise (10% base). The astral plane is the god's natural domain. But the agent *knows something contacted them* — they remember the dream, even if they don't understand it. Repeated Dreams on the same agent build familiarity that could become suspicion.

### 2.2 Regional — Divine aura radiating from the avatar

**Range:** Within a fixed hex radius of the avatar's position (tunable constant, default ~3-5 hexes depending on intervention)
**Interventions:** Deceive, Intimidate, Inspire
**Fantasy:** The avatar's divine nature bleeds into the surrounding area. False signs appear in nature. The ground trembles. A shaft of unexpected light breaks through clouds. These are *environmental* effects — the god acting *through* the world rather than *on* a person directly.

Regional interventions are indirect. The god doesn't touch the agent — instead, the god manipulates the local environment, weather, animals, or ambient conditions to create an effect that the agent then experiences. This is why they don't require being in the same hex: the divine aura extends a few hexes in every direction, and the effects propagate naturally.

**Why these three:**

- **Deceive** (mind/entropy): Planting false signs, manipulating local omens, arranging misleading coincidences in the immediate area. Deception actually *benefits* from some distance — a god whispering lies into your ear is obviously divine; strange birds flying in unusual patterns is ambiguous. Range: ~3 hexes.
- **Intimidate** (force/entropy): Localized tremors, sudden darkness, unnatural cold, the howl of unseen beasts. A show of force that radiates outward from the avatar. Range: ~3 hexes.
- **Inspire** (life/spirit): A burst of vitality, a moment of transcendent clarity, the feeling that *something* is rooting for you. Life/spirit energy propagates further than force — it's lighter, more diffuse. Range: ~5 hexes.

**Detection profile:** Moderate and *physically visible*. Regional effects leave traces in the physical world — scorch marks, unnatural growth, disturbed animals. Mortals in the area may notice something strange happened even if they don't connect it to divine intervention. The avatar's physical position is exposed to anyone tracking unusual phenomena in the region.

### 2.3 Remote — Cosmic manipulation from anywhere

**Range:** Unlimited
**Interventions:** Coincidence, Omen
**Fantasy:** The god reaches into the deep fabric of the world — the threads of fate, the patterns of nature, the cosmic machinery — and tweaks something. The effect manifests far from the avatar because it doesn't travel *from* the avatar; it emerges *from the world itself*.

Remote interventions are the most "godlike" but also the most costly and detectable. You're not channeling power through your avatar's physical presence — you're manipulating reality itself, and that sends shockwaves through the cosmic layer that rival gods can sense.

**Why these two:**

- **Coincidence** (time/entropy): The god bends causality. A bridge collapses at exactly the right moment. A letter arrives just before a critical decision. A storm forces two travelers to shelter together. This operates on *fate*, not on *people*, so physical proximity is irrelevant. But it's expensive (cost 4, the highest base cost) and *very* loud (60% detection risk) because you're deforming the timeline.
- **Omen** (spirit/time): Signs written in the sky, in nature, in the behavior of animals. A blood moon, a flock of ravens circling a particular tower, flowers blooming in winter along a specific path. Omens are inherently environmental and can appear anywhere — but the agent needs to be *able to perceive* them (outdoors, awake, attentive). Quieter than Coincidence (20% detection) because omens are *ambiguous* — maybe it's natural, maybe it's divine.

**Detection profile:** High cosmic noise. Remote interventions are the easiest for rival gods to detect because the divine energy isn't contained by the avatar's physical form. It radiates outward through the cosmic layer. Coincidence at 60% is nearly guaranteed to ping *someone's* awareness. The trade-off is clear: convenience (act from anywhere) vs. stealth (rivals will notice).

### 2.4 Local — The avatar is physically present

**Range:** Same hex as the target agent
**Interventions:** Persuade, Afflict/Bless
**Fantasy:** The avatar stands before the agent. Eyes meet. Hands touch. Words are spoken that resonate with divine power. This is the most intimate, most impactful, and most dangerous form of intervention — the god made flesh, acting directly on another being.

Local interventions require the avatar to be in the same hex as the target agent. This is the costliest delivery mode in terms of *player effort* (travel time, route planning, avatar exposure) but the most effective in terms of *divine impact*.

**Why these two:**

- **Persuade** (spirit/mind): The avatar speaks with divine charisma. The warmth in the air changes. The agent's heart opens. Persuasion is fundamentally a *personal* act — you need to be *there*, to radiate presence, to make the agent *feel* the truth of what you're saying. You can't persuade someone by letter the way a god persuades in person.
- **Afflict/Bless** (life/energy): The avatar reaches out and touches the agent's life force directly — healing wounds, strengthening bones, clearing disease, or conversely, clouding blood, weakening joints, planting the seed of illness. This is the laying on of hands. You're channeling life energy into or out of a physical body. You must be *there*.

**Detection profile:** Mixed. Cosmically *quieter* than Regional or Remote because the divine energy is focused and contained — channeled through physical contact rather than broadcast across the world. But *physically* riskier: the avatar is present, visible, interacting with the agent. People remember strangers. If the avatar lingers, if the agent suddenly changes behavior, if a mysterious healer appears and disappears — mortals connect dots.

---

## 3. Local Encounter Sub-Modes

When a player initiates a Local intervention (Persuade or Afflict/Bless), they choose *how the meeting happens*. This is a meaningful tactical decision that affects cost, detection, narrative, and impact.

### 3.1 "Go to Them" — The avatar travels to the agent

The avatar physically pathfinds across the map to the agent's hex. On arrival, the intervention triggers automatically.

| Property | Value | Rationale |
|---|---|---|
| Extra essence cost | None | The cost is time and exposure, not essence |
| Travel time | Depends on distance | Hexes traversed × movement cost. Multi-tick journeys for distant agents |
| Impact bonus | +15% effectiveness | Face-to-face divine presence amplifies the intervention |
| Avatar detection | High | The avatar is moving through the world, visible to any observer along the route |
| Cosmic detection | Standard (base rate) | No extra cosmic noise beyond the intervention itself |
| Narrative beat | Strong | "The stranger appeared at the edge of the village as the sun set…" |

**When to use:** The agent is nearby (1-3 hexes), the intervention is important enough to invest time, or the player *wants* the story beat. Visiting in person is a commitment — the avatar is out of position for other tasks while traveling and while present.

**Risk:** The avatar's movement path is visible. Rival gods tracking the avatar see it moving toward a specific agent. Mortals along the route may remember the stranger. If the intervention is detected, the avatar's presence makes it much easier to identify *who* did it.

### 3.2 "Summon Them" — The agent is compelled to come to the avatar

The agent feels an inexplicable pull — a compulsion, a nagging feeling, a sudden desire to walk in a particular direction — and travels to the avatar's location.

| Property | Value | Rationale |
|---|---|---|
| Extra essence cost | +1 sphere essence | The summoning itself is a divine act requiring energy |
| Travel time | Depends on distance | The agent must physically walk to the avatar |
| Impact bonus | None (or small, +5%) | The agent arrives confused/disoriented, not in an optimal state for a divine encounter |
| Avatar detection | Low | The avatar stays put. Less visible than traveling across the map |
| Cosmic detection | Elevated (+10% to base) | The summoning thread is detectable — a visible divine pull on the agent |
| Agent-side detection | New risk | The agent's companions/allies may notice them wandering off inexplicably |
| Narrative beat | Eerie, compelling | "She couldn't explain why she left camp. Something pulled her south, through the trees, until she found the clearing where the hooded figure waited…" |

**When to use:** The agent is far away and the player doesn't want to move the avatar. Or the player is strategically keeping the avatar hidden in a safe location and pulling agents toward them like a spider in a web.

**Risk:** The summoning itself is a detectable divine act (extra cosmic noise). The agent walking somewhere unusual is suspicious to NPCs who know them — "Where did she go? She never leaves camp alone." This creates a *different* detection profile: less avatar exposure, but the agent's behavior becomes evidence. Also, the agent arrives knowing *something* pulled them — this isn't a natural meeting, and perceptive agents might realize that.

### 3.3 Design Note: Summoning as Pre-Influence

The summoning compulsion is itself an act of influence — it's the god asserting control over the agent's body before the actual intervention happens. This has narrative implications: the agent might resist the pull (high-willpower agents), might arrive hostile or frightened, or might arrive *willing* because part of them wanted to answer the call. The agent's axiological profile should color the summoning experience, even if mechanically the summoning always succeeds.

This is a narrative-only effect (no separate resolution roll for the summon itself). The extra +1 essence cost already captures the mechanical overhead.

---

## 4. Range Constants and Tuning

All range values are named constants in a single location, making them trivially adjustable during playtesting.

```typescript
/** Intervention delivery range constants (in hexes from avatar position) */
export const DELIVERY_RANGE = {
  /** Deceive: false signs, misleading omens — benefits from indirection */
  deceive: 3,
  /** Intimidate: shows of force — tremors, darkness, unnatural cold */
  intimidate: 3,
  /** Inspire: divine spark — life/spirit energy propagates further */
  inspire: 5,
  /** Astral and Remote interventions have unlimited range (no entry needed) */
} as const;

/** Local encounter modifiers */
export const LOCAL_ENCOUNTER = {
  /** "Go to them" — effectiveness multiplier (1.15 = +15%) */
  visitImpactBonus: 1.15,
  /** "Summon them" — extra essence cost on top of intervention base */
  summonEssenceCost: 1,
  /** "Summon them" — added detection risk (stacks with base) */
  summonDetectionPenalty: 0.10,
  /** "Summon them" — small effectiveness multiplier (1.05 = +5%) */
  summonImpactBonus: 1.05,
} as const;
```

**Why these numbers:**

- **Deceive and Intimidate at 3 hexes:** Close enough that the avatar is "in the area" but far enough that the god isn't standing right next to the target. Three hexes on a hex grid means roughly the same village/town and immediate surroundings.
- **Inspire at 5 hexes:** Life/spirit energy is gentler and more diffuse than force or entropy. A burst of inspiration can travel further than a localized earthquake. Five hexes covers a small region — multiple villages or a stretch of countryside.
- **Visit bonus at +15%:** Significant enough to matter (turns a 50% success into ~57%) but not so large that visiting is always mandatory. The player should *want* to visit for important interventions but not feel punished for using other modes.
- **Summon cost at +1:** Enough to matter for low-cost interventions (Persuade base cost 2 becomes 3 with summon) but not prohibitive. The real cost of summoning is the detection risk and time, not the essence.

---

## 5. Summary: Intervention Reference Table

| Intervention | Mode | Range | Spheres | Base Cost | Detection | Min Tier | Local Sub-Mode |
|---|---|---|---|---|---|---|---|
| Dream | Astral | Unlimited | mind, spirit | 1 | 10% | 1 | — |
| Persuade | Local | Same hex | spirit, mind | 2 | 20% | 1 | Visit (+15%) or Summon (+1 ess, +10% det) |
| Deceive | Regional | ≤3 hexes | mind, entropy | 2 | 30% | 2 | — |
| Intimidate | Regional | ≤3 hexes | force, entropy | 2 | 30% | 2 | — |
| Inspire | Regional | ≤5 hexes | life, spirit | 2 | 10% | 1 | — |
| Coincidence | Remote | Unlimited | time, entropy | 4 | 60% | 3 | — |
| Omen | Remote | Unlimited | spirit, time | 2 | 20% | 2 | — |
| Afflict/Bless | Local | Same hex | life, energy | 3 | 50% | 2 | Visit (+15%) or Summon (+1 ess, +10% det) |

---

## 6. Rejected Alternatives

### 6.1 All interventions at unlimited range

Rejected because it removes spatial strategy entirely. The avatar becomes a camera, not an actor in the world. The map loses relevance to the core gameplay loop.

### 6.2 All interventions require local presence

Rejected because it makes the avatar a bottleneck. With 100+ agents, the player would spend all their time pathfinding the avatar around the map. It also doesn't fit the fantasy — a god should be able to bend fate from afar, not need to personally visit everyone.

### 6.3 Range scales with influence tier

Rejected because it adds complexity without proportional depth. Tier already gates *which* interventions are available and modifies *cost*. Adding range scaling creates a third axis that's hard for players to reason about and creates edge cases ("I'm tier 2.5 — can I Intimidate from 4 hexes?"). Fixed ranges per intervention type are simpler and more memorable.

### 6.4 Summoning as a separate intervention type

Rejected in favor of summoning as a sub-mode of Local encounters. Making it a separate type (9th intervention) adds UI complexity, another slot on the Agent Wheel, and dilutes the clean 8-type taxonomy. As a sub-mode, it's a tactical choice within an existing flow — cleaner both mechanically and in the UI.

### 6.5 Detection modified by distance

Considered: closer interventions are easier to physically detect, distant ones are harder. Rejected because the current system already handles this through the mode distinction. Local interventions have low cosmic noise but high physical exposure (handled by stealth system's mortal detection). Remote interventions have high cosmic noise (detection risk) but no physical trace. The delivery mode *is* the distance-detection relationship — an additional distance modifier would be redundant.

---

## 7. Implications for Layer 2 UI

This design directly shapes the Layer 2 (Divine Toolkit UI) interaction flow:

### 7.1 Agent Wheel slot behavior by mode

- **Dream slot:** Click → confirm popover → opens Dream Interface (astral communion screen with manipulation options)
- **Regional slots** (Deceive, Intimidate, Inspire): Click → confirm popover with range indicator ("Avatar is 2 hexes away — in range" / "Avatar is 6 hexes away — move closer") → disabled if out of range → result in NarrativeFeed
- **Remote slots** (Coincidence, Omen): Click → confirm popover with prominent cost/risk warning (these are expensive and loud) → result in NarrativeFeed
- **Local slots** (Persuade, Afflict/Bless): Click → choice popover with two options ("Go to them" / "Summon them") showing cost/risk comparison → player chooses → if "Go to them," avatar pathfinds and intervention triggers on arrival → if "Summon," essence deducted immediately, agent walks to avatar, intervention triggers on arrival → result in NarrativeFeed

### 7.2 Range check integration

The wheel slot availability check (`getAgentWheelSlots()` in `src/engine/wheel.ts`) needs to incorporate range. A Regional intervention slot should appear *dimmed with range indicator* when the avatar is out of range, not hidden entirely — the player should see what they *could* do if they moved closer.

### 7.3 Travel/summon as multi-tick sequences

"Go to them" and "Summon them" are not instant. They create a pending action that resolves over multiple ticks as the avatar or agent physically moves. The UI needs to show this in-progress state — probably a subtle indicator on the doom bar or narrative feed ("Avatar traveling to Kira — 3 ticks" or "Kira is being drawn to the avatar — 2 ticks").

---

## 8. Implementation Notes

When this design is implemented, the following code changes are expected:

1. **New type:** `DeliveryMode = 'astral' | 'regional' | 'remote' | 'local'` in `src/types/dream.ts`
2. **New type:** `LocalEncounterMode = 'visit' | 'summon'` in `src/types/dream.ts`
3. **Extended:** `InterventionDefinition` gains `deliveryMode: DeliveryMode` and optional `range?: number`
4. **New constants:** `DELIVERY_RANGE` and `LOCAL_ENCOUNTER` in `src/types/dream.ts`
5. **New function:** `isInRange(avatarHex, targetHex, interventionType): boolean` in `src/engine/dream.ts`
6. **Modified:** `getAgentWheelSlots()` to incorporate range checking and return range status per slot
7. **Modified:** `executeIntervention()` to accept delivery parameters and apply visit/summon modifiers
8. **New function:** `createTravelAction(from, to, onArrival)` for multi-tick avatar/agent movement
