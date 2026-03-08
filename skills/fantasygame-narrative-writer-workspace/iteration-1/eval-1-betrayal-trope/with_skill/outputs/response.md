# Designing the Betrayal Narrative Trope

## Summary

To add the classic **betrayal trope** where a trusted advisor turns on their lord (think Wormtongue or Littlefinger), you'll need to touch **five interconnected layers** of the narrative engine:

1. **`src/types/agent.ts`** — Add an optional `isBetrayalTarget` flag and `_betrayedBy` edge tracking to agents
2. **`src/types/narrative.ts`** — Create `betrayal_event` as a new `NarrativeEventType`
3. **`src/data/narrative-content.ts`** — Author betrayal prose templates at routine, notable, and chronicle tiers
4. **`src/engine/agentActions.ts`** — Hook betrayal detection into the action evaluation pipeline (when an advisor's disposition and world state align)
5. **`src/engine/narrativeContext.ts`** (or extend `contextBuilder.ts`) — Score betrayal tension in opposition matrix

The player will feel the **buildup** through disposition mechanics (advisor's reputation slowly drops, bond weakens), and the **shock** through a chronicle-tier narrative event that surfaces context objects (the advisor, the lord, witnesses, artifacts tied to betrayal).

---

## Understanding the Betrayal Lever

The engine has **four narrative levers** you can pull to make betrayal narratively rich:

### Lever 1: Disposition System (Buildup)

The existing **game theory disposition system** (`src/engine/disposition.ts`) already tracks:
- **Cooperation strategy** per agent (e.g., 'opportunist', 'defector', 'grudge-holder')
- **Reputation scores** and interaction history
- **Dilemma events** that shift disposition based on outcomes

**Betrayal uses this lever to create dramatic tension:**

When an advisor (high-tier actor with strong bonds to a lord) rolls certain dilemmas and chooses 'defection' or 'exploitation', their reputation with the lord drops. Each tick, their bond weakens further. The narrative output is whisper-thin: routine entries show the advisor's growing coldness ("*cold courtesy instead of warmth*"). But mechanically, the betrayal is being set up.

### Lever 2: Narrative Event Hierarchy (The Shock)

The prose tiers already exist:
- **Routine** → High frequency, mechanical, short
- **Notable** → Significant events, world-aware, 2–3 context objects
- **Chronicle** → Major narrative moments, LLM-generated, 4–5 context objects, full prose

**Betrayal should trigger at notable/chronicle tier** when:
- An advisor's reputation drops below a threshold (-70 or worse)
- A contested_action or actor_death event involves the lord
- The advisor was bonded to the lord at game start

This ensures the shock lands hard and the player realizes *they've been watching the betrayal unfold in their log*.

### Lever 3: Opposition Tension Scoring (Narrative Context)

The **narrative context builder** (`src/engine/contextBuilder.ts`) ranks world objects by relevance. Betrayal is fundamentally about **tension between two actors**.

The opposition matrix (`src/data/opposition-content.ts`) already scores:
- Foundation sphere opposition (Chaos vs. Order, Light vs. Darkness)
- Creation sphere tensions (e.g., Matter resists Entropy)
- **Archetype friction** (e.g., Tragic Hero vs. Trickster)

**Add betrayal-specific tension scoring:**
- **High tension if advisor has 'opportunist' or 'defector' strategy + lord has 'cooperator' strategy** = mutual incompatibility
- **Higher tension if advisor and lord were bonded but reputation is now negative** = active contradiction
- **Higher tension if advisor was ever in the lord's rival-god pantheon** = theological opposition

When a betrayal event fires, `buildNarrativeContext` will automatically elevate the advisor and lord to the top of the context object list, creating prose like:

> *"[Lord Name] realized too late that [Advisor Name] had been playing a longer game. The [Advisor's Archetype]-turned-betrayer stood at the threshold of power, the very loyalty [Lord] had extended now a knife at their throat."*

### Lever 4: Content Production Manifest (The Consistency)

**Betrayal templates must flavor-match the advisor's archetype**, just like all prose does. Use the **content strategy** (Docs/plans/2026-03-06-content-strategy.md) rule:

> *"Every prose template gets the agent's narrative archetype mixed in via tone keywords and beat pattern promotion."*

So if the betrayer is a `trickster`, betrayal prose uses trickster tone keywords (`clever`, `doubled`, `played`, etc.). If they're a `serpent_tongue`, it uses their keywords (`honeyed`, `whispered`, `poison`, etc.).

This means:
- A trickster's betrayal feels like a con
- A serpent_tongue's betrayal feels like slow seduction into damnation
- A dark_magician's betrayal feels like a ritual binding trap

---

## File Changes: Order Matters

### File 1: `src/types/agent.ts`

**Add to the `Agent` interface:**

```typescript
// Optional field: if this agent is a betrayal target (lord/leader)
isBetrayalTarget?: boolean;

// Track betrayal state
betrayalState?: {
  betrayedBy: string;        // nodeId of the betrayer
  discoveredAt: number;      // tick when betrayal was revealed
  severity: 'minor' | 'critical'; // did they lose a war, a title, their life?
};
```

**Why:** This lets the engine know which agents *can* be betrayed and tracks the betrayal timeline. The orchestrator checks this during `phaseDoomClock` or agent death events.

### File 2: `src/types/narrative.ts`

**Extend the `NarrativeEventType` union:**

```typescript
export type NarrativeEventType =
  | 'action_resolved'
  | 'action_failed'
  | 'action_critical'
  | 'trait_acquired'
  | 'tier_transition'
  | 'divine_intervention'
  | 'contested_action'
  | 'actor_death'
  | 'doom_escalation'
  | 'mandate_stage'
  | 'trait_lost'
  | 'dilemma_mutual_trust'
  | 'dilemma_betrayed'
  | 'dilemma_exploitation'
  | 'dilemma_mutual_distrust'
  | 'betrayal_revealed'  // NEW
  | 'betrayal_undermining'; // NEW (ongoing subversion)
```

**Why:** New event types let the orchestrator route betrayal events through the prose pipeline independently.

### File 3: `src/engine/orchestrator.ts`

**Add a new tick phase: `phaseBetrayal` (after `phaseDoomClock`, before `phaseNarrative`):**

```typescript
// Tick phase: Betrayal Detection
export function phaseBetrayal(state: GameState, random: PRNG): GameState {
  const updated = { ...state };

  // Find all agents with negative reputation toward a lord
  const potentialBetrayals = state.graph.getNodesByType('actor').flatMap(actorId => {
    const actor = state.graph.getNode(actorId) as Actor;
    if (!actor.cooperationStrategy || actor.reputationScores.size === 0) return [];

    // Check if this actor is a 'defector' or 'opportunist' with a high-tier bond target
    if (!['defector', 'opportunist'].includes(actor.cooperationStrategy)) return [];

    const lordCandidates = actor.bonds
      .filter(b => b.bondStrength > 0 && b.targetNodeId !== actor.id)
      .flatMap(b => {
        const target = state.graph.getNode(b.targetNodeId);
        if (!target || target.nodeType !== 'actor') return [];
        const targetActor = target as Actor;
        if (!targetActor.isBetrayalTarget) return [];

        const rep = actor.reputationScores.get(b.targetNodeId) || 0;
        return rep < -70 ? [{ lordId: b.targetNodeId, reputation: rep }] : [];
      });

    return lordCandidates.map(({ lordId, reputation }) => ({
      betrayerId: actorId,
      lordId,
      reputation,
    }));
  });

  // For each viable betrayal, roll for revelation
  for (const betrayal of potentialBetrayals) {
    const betrayer = state.graph.getNode(betrayal.betrayerId) as Actor;
    const lord = state.graph.getNode(betrayal.lordId) as Actor;

    // Betray happens when:
    // 1. Opportunity arises (contested_action involving lord, or actor_death event)
    // 2. Random roll succeeds (scaled by how negative reputation is)
    const chanceToBeray = Math.min(100, Math.abs(betrayal.reputation) * 1.2);
    if (random.next(0, 100) < chanceToBeray) {
      // Add betrayal event to chronicle
      updated.chronicle.push({
        tick: state.tick,
        event: {
          type: 'betrayal_revealed',
          actorId: betrayal.betrayerId,
          targetId: betrayal.lordId,
          tier: 'chronicle',
        },
        prose: '', // Will be filled by phaseNarrative
      });

      // Mark the lord as betrayed
      const updatedLord = { ...lord, betrayalState: {
        betrayedBy: betrayal.betrayerId,
        discoveredAt: state.tick,
        severity: 'critical',
      }};
      updated.graph.updateNode(betrayal.lordId, updatedLord);
    }
  }

  return updated;
}
```

**Why:** This detects when a betrayal should happen based on disposition state and triggers the narrative event.

### File 4: `src/data/narrative-content.ts`

**Add betrayal prose templates at all three tiers:**

```typescript
export const ROUTINE_TEMPLATES: Record<string, string[]> = {
  // ... existing templates ...
  betrayal_revealed: [
    '{actor} turned against {target}. What once was loyalty has become {noun}.',
    'The mask fell. {actor} revealed their true {noun}, and {target} was defenseless.',
    '{target} discovered too late that {actor} had been serving their own {noun} all along.',
  ],
  betrayal_undermining: [
    '{actor} whispered {adj} counsel into {target}\'s ear, guiding them {noun}ward.',
    'In quiet moments, {actor} worked against {target}, their {noun} as invisible as breath.',
    '{actor}\'s loyalty was a performance. Behind closed doors, they cultivated {noun}.',
  ],
};

export const NOTABLE_TEMPLATES: Record<string, string[]> = {
  // ... existing templates ...
  betrayal_revealed: [
    'The truth emerged like {noun} breaking through stone{personality}. {actor} had been {target}\'s closest counselor, their most trusted voice — and all along, {actor} harbored {adj} {noun}.',
    '{target} felt the ground shift beneath them as {actor}\'s betrayal came to light{personality}. Years of {adj} counsel, all of it a knife sharpened in the dark.',
    'A {adj} realization: every word {actor} spoke to {target}, every decision they whispered, had served {noun} instead of {target}\'s true interest{personality}. The intimacy of the betrayal made it all the more {adj}.',
  ],
  betrayal_undermining: [
    '{actor} had grown close to {target} — close enough to know their {noun}, to whisper the right words at the right moments{personality}. Subversion, when done by a trusted friend, is the sharpest blade.',
    'They called it counsel. They called it guidance. But {actor}\'s whispers carried {adj} {noun}, slowly tilting {target} toward ruin{personality}. By the time {target} realized, the poison had taken root.',
    '{actor} never raised a hand against {target}. Instead, {actor} {verb} trust itself into a weapon{personality}, using {target}\'s own {noun} against them.',
  ],
};

export const CHRONICLE_TEMPLATES: Record<string, string[]> = {
  // For chronicle-tier events, the LLM will be seeded with these templates
  // These are shorter prompts that the LLM enriches
  betrayal_revealed: [
    '{actor} was {target}\'s closest advisor, their most trusted voice. Now that trust lay shattered, revealed as {noun}. The sting was all the sharper for how {adj} it had been to believe.',
    'The world shifted on its axis when {actor}\'s treachery was laid bare. Years of {adj} counsel, each word a calculated move toward {noun}. {target} had been played, and everyone would know it now.',
    'There is a particular agony in being betrayed by one you elevated, one you loved like kin. {actor} had been {target}\'s {noun}, and now... now {actor} was {target}\'s undoing.',
  ],
  betrayal_undermining: [
    '{actor} had woven themselves so deeply into {target}\'s confidence that the line between advisor and architect of ruin had blurred beyond recognition. Each {adj} word, each {noun}, had been placed with deadly precision.',
    'The insidiousness of {actor}\'s betrayal lay not in sudden violence but in the slow, patient corruption of {target}\'s judgment. By the time the poison showed, {actor} had won.',
    '{actor} did not need to raise a blade. {actor} had done something far more {adj}: {actor} had made {target} {noun} their own ruin.',
  ],
};
```

### File 5: `src/data/opposition-content.ts`

**Extend the opposition matrix to include betrayal tension:**

```typescript
// Add to opposition-content.ts

export const BETRAYAL_TENSION_WEIGHTS = {
  // Cooperation strategy incompatibility
  defectorVSCooperator: 5,      // Defector + Cooperator = max tension
  opportunistVSReciprocal: 4,   // Opportunist + Reciprocal = high tension
  grudgeHolderVSAlly: 5,        // Grudge-holder + Ally in trust = explosive

  // Bond strength reversal (was strong, now negative)
  bondRegressionScalar: 1.5,    // Multiply opposition tension if bond was once strong

  // Archetype friction specific to betrayal
  tricksterBetrayal: 3,         // Tricksters betray with clever moves
  serpentTongueBetray: 4,       // Serpent tongues betray with seduction/poison
  darkMagicianBetray: 4,        // Dark magicians betray through binding
  loyalistBetray: 5,            // Loyalists betray only under extreme duress (rare, devastating)
};

// In the opposition scoring function, add:
function scoreBetrayalTension(actor: Actor, lord: Actor, graph: WorldGraph): number {
  if (!lord.isBetrayalTarget || !actor.bonds.some(b => b.targetNodeId === lord.id)) {
    return 0;
  }

  let tension = 0;

  // Strategy incompatibility
  if (['defector', 'opportunist'].includes(actor.cooperationStrategy)) {
    if (['cooperator', 'reciprocal'].includes(lord.cooperationStrategy)) {
      tension += BETRAYAL_TENSION_WEIGHTS.defectorVSCooperator;
    }
  }

  // Bond regression (was once strong, now negative)
  const bond = actor.bonds.find(b => b.targetNodeId === lord.id);
  if (bond && bond.bondStrength > 0.7 && (actor.reputationScores.get(lord.id) || 0) < -50) {
    tension *= BETRAYAL_TENSION_WEIGHTS.bondRegressionScalar;
  }

  // Archetype-specific betrayal flavor
  if (actor.narrativeArchetype === 'trickster') {
    tension += BETRAYAL_TENSION_WEIGHTS.tricksterBetray;
  }
  if (actor.narrativeArchetype === 'serpent_tongue') {
    tension += BETRAYAL_TENSION_WEIGHTS.serpentTongueBetray;
  }

  return tension;
}
```

---

## How Betrayal Wires Through the Narrative Engine

### Phase 1: The Buildup (Ticks 1–N)

1. **Orchestrator**: `phaseDoomClock` or `phaseAgent` generates dilemma events where the advisor picks 'defection' or 'exploitation'
2. **Disposition**: `disposition.ts` updates the advisor's reputation with the lord (decreasing)
3. **Narrative**: `phaseNarrative` generates routine entries showing the advisor's coldness
4. **Player sees**: Scattered log entries like "*[Advisor] offered cold counsel to [Lord].*" Barely noticeable at first.

### Phase 2: The Shock (Betrayal Event Tick)

1. **Orchestrator**: `phaseBetrayal` detects reputation threshold + random roll succeeds
2. **Event creation**: `TickEvent` with `type: 'betrayal_revealed'` is queued
3. **Narrative**: `phaseNarrative` intercepts the event:
   - Calls `buildNarrativeContext` to harvest context objects (the advisor, lord, any witnesses, artifacts, cultural tensions)
   - Opposition scoring elevates betrayal tension
   - Selects a `NOTABLE_TEMPLATES['betrayal_revealed']` variant
   - Feeds it to LLM with the harvested context
   - Produces full prose

4. **Output**: Chronicle entry appears with striking prose, and the player reads back through their log to see they *were warned* by all those cold routine entries.

---

## Design Notes: Why This Approach?

### 1. Uses Existing Levers

You're not inventing new mechanics. Betrayal uses:
- Disposition system (already exists)
- Event taxonomy (extensible)
- Prose pipeline (already modular)
- Opposition tension (already scored)

### 2. Supports Multiple Flavors

Because archetype tone keywords and beat patterns are already mixed into prose, different archetypes betray *narratively* different ways:
- **Trickster** betrays through clever misdirection
- **Serpent Tongue** betrays through honeyed lies
- **Dark Magician** betrays through binding rituals
- **Loyal Soldier** (if corrupted) betrays with devastating guilt

### 3. Player Agency

The betrayal is **not** guaranteed. It's a roll that happens when:
- Reputation is low enough
- The right dilemma was chosen
- Random chance favors it

Players who manage disposition well and keep advisors happy simply won't see betrayals.

### 4. Narrative Resonance

Because the buildup is whisper-thin (routine entries) and the shock is loud (chronicle prose), the player *feels* the betrayal even if they didn't consciously track disposition. They go back and re-read their log: *"Wait... this whole time...?"*

---

## Testing Checklist

1. **Type safety**: `npm run build` should pass with new event types and agent fields.

2. **Betrayal detection**:
   - Manually create an agent with `cooperationStrategy: 'defector'` and a bond to a `isBetrayalTarget` agent
   - Drop reputation below -70
   - Advance ticks and check `phaseBetrayal` fires correctly

3. **Prose generation**:
   - Verify routine, notable, and chronicle templates are selected
   - Check that archetype keywords are mixed in (trickster vs. serpent_tongue vs. dark_magician)

4. **Opposition scoring**:
   - When betrayal event fires, verify advisor and lord are top-2 context objects
   - Check betrayal-specific tension modifiers apply

5. **UI**: DoomBar/Chronicle should display betrayal prose correctly.

---

## Optional Enhancements (Pass 2)

- **Betrayal aftermath**: Once a lord is betrayed, their actions suffer penalties, alliances weaken
- **Revenge mandate**: A new mandate template "Bring [Advisor] to justice"
- **Betrayal-triggered rival god**: A rival god aligned with the betrayer
- **Recovery beat pattern**: Loyalist archetype might have a beat pattern about recovering from betrayal

---

## Summary Checklist

To add the **betrayal trope**:

- [ ] Extend `Agent` interface with `isBetrayalTarget` and `betrayalState` fields
- [ ] Add `betrayal_revealed` and `betrayal_undermining` event types to `NarrativeEventType`
- [ ] Create `phaseBetrayal` in orchestrator.ts (detection + triggering)
- [ ] Add routine, notable, and chronicle templates to narrative-content.ts
- [ ] Extend opposition matrix with `scoreBetrayalTension()` function in opposition-content.ts
- [ ] Wire `phaseBetrayal` into tick loop (after `phaseDoomClock`, before `phaseNarrative`)
- [ ] Run `npm run build` and `npm test`
- [ ] Manually test with low-reputation advisor + `isBetrayalTarget` lord

That's all you need to make the betrayal trope feel earned and devastating!
