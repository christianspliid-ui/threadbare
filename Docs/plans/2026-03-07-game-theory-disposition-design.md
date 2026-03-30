# Game Theory Disposition System — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Scope:** Agent cooperation/defection mechanics integrated with axiological motivation

## Problem Statement

Agents currently select actions based solely on axiological profile alignment — their internal values determine what they do, but they have no strategic reasoning about how other agents will respond. Relationships exist as graph edges with sentiment and strength, but these are static properties that don't evolve based on behavioral patterns. There is no mechanism for trust, betrayal, reputation, or reciprocity.

This creates a narrative gap: agents don't form grudges, don't reward loyalty, and don't develop reputations. Two agents can interact repeatedly with no memory of past cooperation or defection.

## Design Decision Summary

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Scope | Tiered: lightweight modifier on all interactions, full dilemma on high-stakes | Balances performance with narrative drama |
| 2 | Strategy representation | Separate trait per agent (Option B) | Inspectable, independently tunable from axiological profile |
| 3 | Strategy set | Core 5: TFT, Grudger, Pavlov, Always-Cooperate, Always-Defect | Covers narratively interesting space without overwhelming |
| 4 | Consequences | Relationship updates + public reputation score | Social pressure without mechanical resource coupling |
| 5 | Player interaction | Observer + nudge via existing divine interventions | No new player mechanics needed |
| 6 | Architecture | Hybrid: Disposition Layer + Dilemma Events | Slow-burn trust dynamics + dramatic climaxes |
| 7 | Implementation phasing | Phase A: Disposition Layer, Phase B: Dilemma Events | Additive, each phase independently useful |

## Rejected Alternatives

- **Strategy derived from profile (Option A):** Too coupled — tuning loyalty for narrative reasons silently changes cooperation strategy.
- **Emergent behavior (Option C):** Conflicts with inspectability priority — can't trace why an agent defected.
- **Full payoff matrix with resource consequences:** Too "spreadsheet" — couples game theory to influence economy with balance implications. Violates "narrative over mechanical perfection."
- **Every-interaction full dilemma:** Too noisy, performance-expensive, dilutes dramatic moments.
- **Relationship-only consequences (no reputation):** Missing social pressure — defectors face no consequences beyond the individual they burned.

## 1. Data Model

### New Agent Fields

```typescript
// Added to agent node properties
cooperationStrategy: CooperationStrategy
reputationScore: number  // [0.0, 1.0], starts at 0.5

type CooperationStrategy =
  | 'tit-for-tat'        // Mirror last move. Forgiving, retaliatory.
  | 'grudger'            // Cooperate until betrayed, then always defect. Unforgiving.
  | 'pavlov'             // Repeat if rewarded, switch if punished. Adaptive.
  | 'always-cooperate'   // Unconditional cooperation. Exploitable.
  | 'always-defect'      // Unconditional defection. Antisocial.
```

### New Relationship Edge Data

```typescript
// Added to relates_to edge properties
interactionLog: InteractionRecord[]  // capped at INTERACTION_LOG_CAP

interface InteractionRecord {
  tick: number
  actorMove: 'cooperate' | 'defect'
  targetMove: 'cooperate' | 'defect'
  context: string       // action template ID that triggered this
  stakes: 'low' | 'high'
}
```

### New Action Template Field

```typescript
// Added to ActionCandidate / action template
socialOrientation: 'cooperative' | 'defective' | 'neutral'
```

Actions that help, share, or honor agreements are `cooperative`. Actions that betray, steal, or break promises are `defective`. Actions with no social component (meditate, travel) are `neutral` and bypass the disposition system entirely.

### Dilemma Event Type

```typescript
interface DilemmaEvent {
  tick: number
  actorId: string
  targetId: string
  actorMove: 'cooperate' | 'defect'
  targetMove: 'cooperate' | 'defect'
  outcome: DilemmaOutcome
  stakes: number
  context: string  // action template ID
}

type DilemmaOutcome =
  | 'mutual_trust'      // Both cooperated
  | 'betrayed'          // Actor cooperated, target defected
  | 'exploitation'      // Actor defected, target cooperated
  | 'mutual_distrust'   // Both defected
```

### Constants (all tunable)

```typescript
const DISPOSITION_COOPERATE_BONUS = 0.3      // max score bonus for cooperative actions
const DISPOSITION_DEFECT_BONUS = 0.3          // max score bonus for defective actions
const REPUTATION_DECAY_PER_TICK = 0.005       // drift toward 0.5 per tick
const INTERACTION_LOG_CAP = 10                // max history entries per relationship
const DILEMMA_STAKES_THRESHOLD = 0.6          // stakes > this → promote to Dilemma Event
const REPUTATION_UPDATE_COOPERATE = 0.05      // reputation gain per cooperation
const REPUTATION_UPDATE_DEFECT = -0.08        // reputation loss per defection (asymmetric)

// Stakes computation weights
const STAKES_DOMAIN_GOLD = 0.3
const STAKES_DOMAIN_IRON = 0.4
const STAKES_EXTREME_SENTIMENT = 0.2          // when |sentiment| > 0.7
const STAKES_FACTION_LEADER = 0.3
const STAKES_TERRITORY_CONTROL = 0.3

// Dilemma outcome effects
const DILEMMA_MUTUAL_TRUST_SENTIMENT = 0.15
const DILEMMA_MUTUAL_TRUST_STRENGTH = 0.1
const DILEMMA_BETRAYAL_SENTIMENT = -0.4
const DILEMMA_MUTUAL_DISTRUST_SENTIMENT = -0.1
```

## 2. Disposition Layer — Engine Logic

### Strategy Evaluation (Game Theory Core)

Pure function. Given a strategy and interaction history, returns a disposition value: +1 (cooperate) to -1 (defect).

```
evaluateStrategy(strategy, history) → number [-1, +1]:
  if history is empty → return initialMove(strategy)

  lastEntry = history[history.length - 1]

  switch strategy:
    'tit-for-tat':      return lastEntry.targetMove === 'cooperate' ? +1 : -1
    'grudger':           return history.some(h => h.targetMove === 'defect') ? -1 : +1
    'pavlov':            return lastEntry.actorMove === lastEntry.targetMove ? +1 : -1
    'always-cooperate':  return +1
    'always-defect':     return -1

initialMove(strategy) → number:
  'tit-for-tat':      +1  (starts cooperative)
  'grudger':           +1  (starts cooperative)
  'pavlov':            +1  (starts cooperative)
  'always-cooperate':  +1
  'always-defect':     -1
```

### Disposition Modifier (Pipeline Stage)

Inserted as stage 2 of the 6-stage pipeline: `scoreByGoalAlignment → applyDispositionModifier → applyPersonalityWeights → selectTopN → assignProbabilities → probabilisticSelect`.

```
applyDispositionModifier(candidates, actor, targetAgent?):
  if no targetAgent → return candidates unchanged (no social context)
  if all candidates are 'neutral' → return candidates unchanged

  history = getInteractionLog(actor, targetAgent)
  strategy = actor.cooperationStrategy
  targetReputation = targetAgent.reputationScore

  // Core game theory disposition
  disposition = evaluateStrategy(strategy, history)

  // Blend with reputation awareness: [-0.2, +0.2]
  reputationFactor = (targetReputation - 0.5) * 0.4
  finalDisposition = clamp(disposition + reputationFactor, -1, 1)

  // Apply to candidates
  for each candidate:
    if candidate.socialOrientation === 'cooperative':
      candidate.score += finalDisposition * DISPOSITION_COOPERATE_BONUS
    if candidate.socialOrientation === 'defective':
      candidate.score -= finalDisposition * DISPOSITION_DEFECT_BONUS
    // 'neutral' candidates: no change

  return candidates
```

### Post-Action Logging

After an action resolves, if it involved a target agent and was cooperative/defective, log the interaction:

```
logInteraction(actor, target, actorOrientation, targetOrientation, tick, actionId):
  edge = getOrCreateRelationship(actor, target)
  edge.interactionLog.push({
    tick,
    actorMove: actorOrientation,
    targetMove: targetOrientation,
    context: actionId,
    stakes: computeStakes(...) > DILEMMA_STAKES_THRESHOLD ? 'high' : 'low'
  })

  // Cap log length
  if edge.interactionLog.length > INTERACTION_LOG_CAP:
    edge.interactionLog.shift()

  // Update reputation
  if actorOrientation === 'cooperate':
    actor.reputationScore = clamp(actor.reputationScore + REPUTATION_UPDATE_COOPERATE, 0, 1)
  else:
    actor.reputationScore = clamp(actor.reputationScore + REPUTATION_UPDATE_DEFECT, 0, 1)
```

## 3. Dilemma Events — Engine Logic

### Stakes Computation

```
computeStakes(action, actor, target, relationship):
  stakes = 0
  if action.domain === 'gold': stakes += STAKES_DOMAIN_GOLD
  if action.domain === 'iron': stakes += STAKES_DOMAIN_IRON
  if |relationship.sentiment| > 0.7: stakes += STAKES_EXTREME_SENTIMENT
  if actor or target has 'leader' role in a faction: stakes += STAKES_FACTION_LEADER
  if action involves territory/location control: stakes += STAKES_TERRITORY_CONTROL
  return clamp(stakes, 0, 1)
```

### Dilemma Detection (Tick Orchestrator)

After action selection, before resolution:

```
detectDilemma(action, actor, target):
  if action.socialOrientation === 'neutral': return null
  if no target agent: return null
  stakes = computeStakes(action, actor, target, getRelationship(actor, target))
  if stakes < DILEMMA_STAKES_THRESHOLD: return null
  return { actor, target, stakes, context: action.templateId }
```

### Dilemma Resolution

Both agents independently decide cooperate/defect:

```
resolveDilemma(dilemmaContext):
  actorHistory = getInteractionLog(actor, target)
  targetHistory = getInteractionLog(target, actor)  // reversed perspective

  actorDisposition = evaluateStrategy(actor.cooperationStrategy, actorHistory)
  targetDisposition = evaluateStrategy(target.cooperationStrategy, targetHistory)

  actorMove = actorDisposition > 0 ? 'cooperate' : 'defect'
  targetMove = targetDisposition > 0 ? 'cooperate' : 'defect'

  outcome = classifyOutcome(actorMove, targetMove)
  applyDilemmaEffects(outcome, actor, target)

  return DilemmaEvent { tick, actorId, targetId, actorMove, targetMove, outcome, stakes, context }
```

### Outcome Effects

```
applyDilemmaEffects(outcome, actor, target):
  relationship = getRelationship(actor, target)

  switch outcome:
    'mutual_trust':
      relationship.sentiment += DILEMMA_MUTUAL_TRUST_SENTIMENT
      relationship.strength += DILEMMA_MUTUAL_TRUST_STRENGTH
      actor.reputationScore += REPUTATION_UPDATE_COOPERATE
      target.reputationScore += REPUTATION_UPDATE_COOPERATE

    'betrayed':  // actor cooperated, target defected
      relationship.sentiment += DILEMMA_BETRAYAL_SENTIMENT
      actor.reputationScore += REPUTATION_UPDATE_COOPERATE * 0.5  // tried
      target.reputationScore += REPUTATION_UPDATE_DEFECT

    'exploitation':  // actor defected, target cooperated
      relationship.sentiment += DILEMMA_BETRAYAL_SENTIMENT
      actor.reputationScore += REPUTATION_UPDATE_DEFECT
      target.reputationScore += REPUTATION_UPDATE_COOPERATE * 0.5

    'mutual_distrust':
      relationship.sentiment += DILEMMA_MUTUAL_DISTRUST_SENTIMENT
      actor.reputationScore += REPUTATION_UPDATE_DEFECT * 0.5
      target.reputationScore += REPUTATION_UPDATE_DEFECT * 0.5

  // Clamp all values
  relationship.sentiment = clamp(relationship.sentiment, -1, 1)
  relationship.strength = clamp(relationship.strength, 0, 1)
  actor.reputationScore = clamp(actor.reputationScore, 0, 1)
  target.reputationScore = clamp(target.reputationScore, 0, 1)
```

## 4. World Seeding

### Strategy Assignment

In `worldSeed.ts`, after assigning `narrativeArchetype`:

```
assignCooperationStrategy(agent, prng):
  archetype = ARCHETYPES[agent.narrativeArchetype]
  weights = { ...archetype.strategyWeights }  // copy base distribution

  // Axiological nudge
  if agent.profile.loyalty_treachery < -0.3:
    weights['always-defect'] *= 1.5
    weights['always-cooperate'] *= 0.5
  if agent.profile.cruelty_compassion < -0.3:
    weights['grudger'] *= 1.3
  if agent.profile.cunning_honesty < -0.3:
    weights['tit-for-tat'] *= 0.7
    weights['always-defect'] *= 1.2

  normalize(weights)
  agent.cooperationStrategy = weightedRandomSelect(weights, prng)
  agent.reputationScore = 0.5
```

### Content Data: Archetype Strategy Weights

Added to `archetype-content.ts` or new `game-theory-content.ts`:

```typescript
// Example distributions (19 archetypes × 5 strategies)
'tragic-hero':   { 'tit-for-tat': 0.40, 'grudger': 0.30, 'pavlov': 0.20, 'always-cooperate': 0.10, 'always-defect': 0.00 }
'trickster':     { 'tit-for-tat': 0.20, 'grudger': 0.10, 'pavlov': 0.30, 'always-cooperate': 0.05, 'always-defect': 0.35 }
'tyrant':        { 'tit-for-tat': 0.10, 'grudger': 0.20, 'pavlov': 0.10, 'always-cooperate': 0.00, 'always-defect': 0.60 }
'caregiver':     { 'tit-for-tat': 0.15, 'grudger': 0.05, 'pavlov': 0.10, 'always-cooperate': 0.65, 'always-defect': 0.05 }
'sage':          { 'tit-for-tat': 0.50, 'grudger': 0.10, 'pavlov': 0.30, 'always-cooperate': 0.10, 'always-defect': 0.00 }
// ... remaining 14 archetypes
```

## 5. Reputation Dynamics

### Decay

Each tick in the orchestrator:

```
for each agent:
  if agent.reputationScore > 0.5:
    agent.reputationScore -= REPUTATION_DECAY_PER_TICK
  else if agent.reputationScore < 0.5:
    agent.reputationScore += REPUTATION_DECAY_PER_TICK
```

### Visibility

An agent can only factor another agent's reputation into their disposition modifier if:
- The target is within fog-of-war visibility range, OR
- They share a faction (internal gossip), OR
- They share a location

If reputation is not visible, the `reputationFactor` in the disposition modifier is 0 (neutral assumption).

## 6. Integration Points

| Existing System | Integration | Changes Required |
|-----------------|------------|-----------------|
| Action Selection Pipeline | New stage 2: disposition modifier | Insert one function call |
| Resolution System | Dilemma Events use existing contested resolution for underlying action | None |
| Relationship Graph | InteractionRecord[] on edges, reputationScore on nodes | Additive fields |
| Narrative Engine | Dilemma outcomes → beat categories → archetype-flavored prose | New beat templates |
| Agent Detail Panel | Show cooperation strategy + reputation in character sheet | New UI section |
| Psyche Strands | Bonds strand could show recent interaction history | Extend existing strand |
| Tick Orchestrator | Dilemma detection after action selection, reputation decay per tick | Two new steps |
| World Seeding | Strategy assignment after archetype | One new step |
| Fog of War | Reputation visibility gated by existing visibility map | Consume existing API |
| Influence Economy | No changes | None |
| Divine Interventions | Player uses existing Heart-reach interventions to nudge trust | None |
| Doom Clock | No changes | None |

## 7. Narrative Integration

Each dilemma outcome maps to a narrative beat category:

- `mutual_trust` → "alliance_forged" / "trust_deepened" beat
- `betrayed` → "betrayal" beat (high narrative priority — this is dramatic)
- `exploitation` → "betrayal" beat (from the other perspective)
- `mutual_distrust` → "cold_standoff" beat

The existing prose engine picks up these beats, consults agent archetypes for tone, and generates event text. A Tragic Hero who gets betrayed gets pathos-heavy prose. A Trickster who defects gets darkly comic prose. Beat templates live in `narrative-content.ts` or a new `game-theory-content.ts`.

## 8. Implementation Phasing

**Phase A — Disposition Layer:**
- Types (CooperationStrategy, InteractionRecord, socialOrientation field)
- Content data (strategy weights per archetype)
- Engine functions (evaluateStrategy, applyDispositionModifier, logInteraction)
- Pipeline integration (insert stage 2)
- World seeding (strategy assignment)
- Tests

**Phase B — Dilemma Events:**
- Dilemma types (DilemmaEvent, DilemmaOutcome)
- Stakes computation
- Dilemma detection and resolution
- Outcome effects (relationship + reputation updates)
- Reputation decay in tick loop
- Reputation visibility gating
- Narrative beat templates
- Agent Detail Panel updates
- Tests
