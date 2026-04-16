# Secrets & Favors — Implementation Plan

> **Date:** 2026-04-14
> **Status:** Implementation Planning
> **Issue:** THR-30
> **Depends on:** THR-28 (Deep Social Scenes — leverage mechanic), THR-27 (Tavern Hubs — social encounter boost)
> **Blocks:** Nothing (terminal in the Social Systems Expansion chain)

---

## Problem

Social encounters are symmetric — agents negotiate from positions defined only by capability tiers and random dice. There's no asymmetric leverage. An agent who once saved another's life has no advantage in a later negotiation. An agent who discovered a rival's embezzlement can't use that information. The social layer lacks the feeling of *accumulated social capital* — the sense that relationships have history and that history has mechanical weight.

The Deep Social Scenes leverage mechanic (THR-28) creates *within-encounter* leverage. What's missing is *between-encounter* leverage — persistent social resources that carry forward from one interaction to the next.

## Solution

Two new social resource types, both modeled as graph edges:

1. **Secrets** (`knows_secret_of` edge) — asymmetric information that grants leverage in social encounters with the secret's subject. Discovered via encounters, consumed when revealed.
2. **Favors** (`owes_favor` edge) — social debts created by assistance. Redeemable in social encounters to reduce difficulty. Breaking favors damages trust.

Both feed into THR-28's leverage score as initial leverage modifiers, giving agents who enter a social scene with secrets or favors a meaningful advantage.

Rumor propagation is **explicitly deferred** — it adds engine complexity for mechanics that are largely invisible to the player. Secrets and favors are personal, visible, and narratively compelling. Rumors can be layered on later when the player has tools to interact with them.

---

## Architecture Decision: Modeling Secrets

**Option A: New `knows_secret_of` edge type.**
- Edge from discovering agent → secret subject agent
- Properties: `secretType`, `magnitude`, `discoveredTick`, `source`
- Pro: clean graph traversal, natural for reputation walks. Con: new edge type.

**Option B: IntelligenceRecord on GameState (existing system).**
- The codebase already has `IntelligenceRecord` with categories including `'political_secret'`
- Stored on `GameState.intelligenceRecords[]`, queried via `getAgentIntelligence()`
- Pro: existing system, no new edge type. Con: not graph-traversable; disconnected from the "everything is a graph" principle.

**Option C: Hybrid — edge for graph traversal + IntelligenceRecord for detail.**
- `knows_secret_of` edge with `intelligenceRecordId` property linking to the detailed record
- Graph query finds secrets; record provides prose detail
- Pro: both principles satisfied. Con: two storage locations.

**Chosen: Option A (pure edge).** Secrets are relationships between agents — they belong in the graph. The load-bearing architectural decision says "everything is a graph node/edge" and "meaningful relationships must be graph edges, never property bag fields." The `knows_secret_of` edge carries all needed properties inline. IntelligenceRecord is designed for strategic/location intelligence, not interpersonal secrets. Keeping secrets as edges also means they participate in reputation walks naturally — an agent's secrets are discoverable by walking their incoming `knows_secret_of` edges.

---

## Architecture Decision: Modeling Favors

**Option A: New `owes_favor` edge type.**
- Directional: debtor → creditor (agent who owes → agent who is owed)
- Properties: `magnitude`, `context`, `grantedTick`
- Pro: clean, directional, graph-native. Con: new edge type.

**Option B: Agreement attachment (existing system).**
- The attachment system already has `agreement` category with `type: 'favour'`
- Stored as attachment on the debtor agent
- Pro: existing system. Con: attachments are on a single node, not a relationship between two nodes. Can't walk "who owes me?" without scanning all agents' attachments.

**Chosen: Option A.** Same reasoning — favors are relationships between two agents. The graph edge makes "who owes me favors?" a simple `getIncomingEdges(agentId, 'owes_favor')` query. The existing agreement attachment `type: 'favour'` can be used for *formalized* pacts (treaties, oaths) but interpersonal favors are lighter-weight and more numerous.

---

## Implementation Phases

### Phase 1: Secret & Favor Edge Types (Engine)

**1.1 Define edge types**

File: `src/types/graph.ts` or `src/types/disposition.ts` (wherever edge types are defined)

```typescript
// Secret edge: discoverer → subject
export interface KnowsSecretOfEdgeProperties {
  secretType: SecretType;
  magnitude: number;            // 0.0–1.0 (gossip → life-ruining)
  discoveredTick: number;
  source: SecretSource;         // How it was discovered
  revealed: boolean;            // Once revealed, no longer leverage (but still known)
  revealedTick?: number;
  revealedTo?: string;          // Agent the secret was revealed to (if used in encounter)
}

export type SecretType =
  | 'hidden_allegiance'       // Secret faction membership or loyalty
  | 'past_crime'              // Theft, murder, betrayal
  | 'forbidden_relationship'  // Secret romance, alliance with enemy
  | 'hidden_weakness'         // Fear, vulnerability, addiction
  | 'secret_ambition'         // Concealed goal that conflicts with public persona
  | 'financial_secret'        // Hidden wealth, debt, embezzlement
  | 'divine_mark'             // Knowledge of divine intervention (player actions)
  | 'betrayal_planned';       // Knowledge of upcoming betrayal

export type SecretSource =
  | 'confession'              // Target confided willingly
  | 'observation'             // Discoverer noticed something (Eye encounter)
  | 'spy_debrief'             // From spy network (THR-51 initiative)
  | 'tavern_gossip'           // Overheard at tavern (THR-27)
  | 'encounter_outcome'       // Discovered during encounter resolution
  | 'divine_revelation';      // Player revealed via divine action

// Favor edge: debtor → creditor (who owes → who is owed)
export interface OwesFavorEdgeProperties {
  magnitude: number;            // 0.0–1.0 (small kindness → life debt)
  context: string;              // "Saved from bandits", "Covered a debt"
  grantedTick: number;
  redeemed: boolean;            // Once called in, favor is spent
  redeemedTick?: number;
  broken: boolean;              // If debtor refused when called
  brokenTick?: number;
}
```

**1.2 Register edge types**

Ensure `knows_secret_of` and `owes_favor` are registered in the graph schema so they're traversable by standard graph queries.

**1.3 Secret decay / favor pressure**

File: new `src/engine/phaseSecretsFavors.ts`

Lightweight phase (runs every `SECRET_FAVOR_CHECK_INTERVAL` ticks):
- **Secret decay:** Secrets with `magnitude < SECRET_DECAY_THRESHOLD` and age > `SECRET_MAX_AGE_TICKS` are removed (minor secrets fade)
- **Favor pressure:** Unpaid favors older than `FAVOR_TENSION_THRESHOLD_TICKS` apply negative sentiment drift to the `relates_to` edge between debtor and creditor (`FAVOR_TENSION_SENTIMENT_DELTA` per check)
- **Favor expiry:** Favors older than `FAVOR_MAX_AGE_TICKS` expire (forgiven debts)

Wire into orchestrator after `phaseFactionActions` (Phase 6.653).

---

### Phase 2: Leverage Integration (Engine)

**2.1 Secrets as initial leverage in social scenes**

File: `src/engine/socialLeverage.ts` (from THR-28)

In `computeInitialLeverage()`, after bond/wealth/power bonuses:

```typescript
// Secret leverage: if actor knows a secret about the encounter target
const secretEdges = graph.getOutgoingEdges(actorId, 'knows_secret_of')
  .filter(e => e.target === targetId && !e.properties.revealed);
if (secretEdges.length > 0) {
  const bestSecret = secretEdges.reduce((best, e) =>
    (e.properties.magnitude > best.properties.magnitude) ? e : best
  );
  initialLeverage += bestSecret.properties.magnitude * SECRET_LEVERAGE_MULTIPLIER;
  leverageHistory.push({
    stepIndex: -1,
    delta: bestSecret.properties.magnitude * SECRET_LEVERAGE_MULTIPLIER,
    source: 'secret_bonus',
  });
}
```

**2.2 Favors as leverage in social scenes**

```typescript
// Favor leverage: if target owes actor a favor
const favorEdges = graph.getOutgoingEdges(targetId, 'owes_favor')
  .filter(e => e.target === actorId && !e.properties.redeemed && !e.properties.broken);
if (favorEdges.length > 0) {
  const bestFavor = favorEdges.reduce((best, e) =>
    (e.properties.magnitude > best.properties.magnitude) ? e : best
  );
  initialLeverage += bestFavor.properties.magnitude * FAVOR_LEVERAGE_MULTIPLIER;
  leverageHistory.push({
    stepIndex: -1,
    delta: bestFavor.properties.magnitude * FAVOR_LEVERAGE_MULTIPLIER,
    source: 'favor_bonus',  // Note: extend LeverageSource type in THR-28
  });
}
```

**2.3 Secret revelation as encounter step effect**

In social scene encounter templates, add steps that allow secret revelation:
- If actor holds an unrevealed secret about target, a "Reveal Secret" step becomes available
- On success: massive leverage gain (`SECRET_REVELATION_LEVERAGE_BONUS`), but secret is consumed (marked `revealed: true`)
- On failure: target learns the actor *tried* to use leverage, creating hostility
- Trust consequence: revelation damages trust on `relates_to` edge between actor and subject

**2.4 Favor redemption as encounter step effect**

- If target owes actor a favor, a "Call in Favor" step becomes available
- Automatically succeeds (no roll) — the favor is a social obligation
- Grants leverage bonus equal to `magnitude * FAVOR_REDEMPTION_LEVERAGE_BONUS`
- Favor marked `redeemed: true`
- If target refuses (rare — AI never refuses, but possible via encounter branching): favor marked `broken: true`, massive trust penalty

---

### Phase 3: Secret Discovery Encounters (Content)

**3.1 Secret discovery encounter templates**

File: new `src/data/secret-encounter-content.ts`

Secrets are discovered through existing encounter outcomes + new dedicated templates:

| Template | Discovery Method | Secret Types | Reach | Steps |
|----------|-----------------|-------------|-------|-------|
| Confession Over Drinks | Tavern social (from THR-27) | Any (voluntary) | Heart | 3 |
| Quiet Observation | Eye check at location | hidden_allegiance, forbidden_relationship | Eye | 2 |
| Spy Debrief | Spy network output (THR-51) | Any (intelligence-gathered) | Shadow + Eye | 2 |
| Overheard Argument | Tavern/social hub passive | past_crime, betrayal_planned | Eye | 2 |
| Drunken Confession | Tavern social scene | hidden_weakness, financial_secret | Heart | 2 |
| Intercepted Message | Shadow encounter at location | secret_ambition, hidden_allegiance | Shadow | 3 |

6 new encounter templates. Each produces a `knows_secret_of` edge on success, with `magnitude` scaled by the encounter's difficulty and the discoverer's Eye capability.

**3.2 Secret type generation**

File: new `src/engine/secretGeneration.ts`

When a secret is discovered, the type is generated based on the target agent's properties:
- Agent with faction membership + membership in rival faction → `hidden_allegiance`
- Agent with high wealth but no visible income source → `financial_secret`
- Agent with ambition that conflicts with faction goals → `secret_ambition`
- Agent with negative `relates_to` edge to an ally → `betrayal_planned`
- Fallback: `hidden_weakness` (always applicable)

```typescript
export function generateSecretType(
  targetAgent: GraphNode,
  graph: WorldGraph,
  rng: SeededRNG,
): { secretType: SecretType; magnitude: number; detail: string }
```

The secret is generated *at discovery time* based on the target's actual graph state — this means secrets are grounded in reality, not fabricated. An agent can only have a `hidden_allegiance` secret if they actually have conflicting memberships.

---

### Phase 4: Favor Creation (Content + Engine)

**4.1 Favor creation from encounter outcomes**

Favors are created as side effects of existing encounters that involve assistance:

| Encounter Type | Favor Trigger | Magnitude | Context |
|---------------|--------------|-----------|---------|
| Rescue / assist | Actor saves target from danger | 0.6–0.8 | "life_debt" |
| Heal / cure | Actor heals target's condition | 0.3–0.5 | "healing" |
| Lend wealth | Actor gives target gold | 0.2–0.4 | "financial_aid" |
| Vouch for | Actor sponsors target's faction entry | 0.3–0.5 | "endorsement" |
| Cover retreat | Actor protects target in combat | 0.5–0.7 | "battle_debt" |
| Mentor | Actor teaches target a skill | 0.2–0.3 | "mentorship" |

**Implementation:** In `resolveEncounter()`, after computing outcome, check if the encounter template has `favorGeneration` metadata:

```typescript
// On EncounterTemplate (extend type)
favorGeneration?: {
  onSuccess: boolean;           // Create favor on success
  magnitudeRange: [number, number]; // Min-max magnitude
  context: string;
};
```

When triggered, create `owes_favor` edge from the encounter target → actor.

**4.2 Tag existing encounter templates**

Review the existing 14 social encounter templates + 10 tavern templates (THR-27) and tag appropriate ones with `favorGeneration` metadata. Estimate: 5–8 existing templates naturally produce favors (rescue, assist, heal, vouch types).

---

### Phase 5: Player Agency — Divine Actions (Player)

**5.1 "Reveal Secret" divine action**

```typescript
{
  id: 'action.reveal-secret',
  name: 'Reveal Secret',
  sphere: 'mind',
  reach: 'eye',
  essenceCost: 10,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent', hasKnownSecrets: true },
  steps: [{
    id: 'reveal.whisper',
    name: 'Divine Whisper',
    narrative: 'You breathe knowledge into {target}\'s ear — the truth about {secretSubject}, laid bare.',
    effects: [
      { type: 'reveal_secret', selectHighestMagnitude: true, revealTo: 'nearest_agent' },
      // Secret is revealed to the nearest agent at the same location
      // Trust between secret subject and reveal target is damaged
      // Secret subject gains hostile_to disposition toward revealer (if discovered)
    ],
  }],
}
```

This is the player's information warfare tool. They pick an agent who holds a secret, and the secret is revealed to someone nearby — creating cascading social consequences.

**5.2 "Call in Favor" divine action**

```typescript
{
  id: 'action.call-in-favor',
  name: 'Call in Favor',
  sphere: 'force',
  reach: 'heart',
  essenceCost: 8,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent', hasFavorsOwedToHero: true },
  steps: [{
    id: 'callin.reminder',
    name: 'Burden of Obligation',
    narrative: 'You stir the memory of debt in {target}\'s mind. They remember what they owe.',
    effects: [
      { type: 'force_favor_redemption' },
      // Target agent's next social encounter with the creditor has massive leverage bonus
      // Favor edge marked redeemed after use
    ],
  }],
}
```

**5.3 "Plant Secret" divine action**

```typescript
{
  id: 'action.plant-secret',
  name: 'Plant Secret',
  sphere: 'entropy',
  reach: 'shadow',
  essenceCost: 14,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent' },
  steps: [{
    id: 'plant.fabricate',
    name: 'Whispered Lie',
    narrative: 'You plant a seed of false knowledge. {target} now believes they know something dangerous about {nearestRival}.',
    effects: [
      { type: 'create_secret', secretType: 'generated', magnitude: 0.5, source: 'divine_revelation' },
      // Creates a knows_secret_of edge — but the secret is fabricated
      // If the "secret" is ever investigated, it may be discovered as false
      // Adds hidden_mark on the target: 'planted_false_secret'
    ],
  }],
}
```

This is the most interesting divine action — it creates *false* leverage. The player can seed misinformation into the social graph, which works until someone checks.

---

### Phase 6: Social Consequence Chain (Engine)

**6.1 Secret revelation consequences**

When a secret is revealed (whether via encounter step, divine action, or faction action):

```typescript
function applySecretRevelationConsequences(
  secret: KnowsSecretOfEdgeProperties,
  subjectId: string,
  revealedToId: string,
  graph: WorldGraph,
  state: GameState,
): void
```

- **Subject → revealer:** Trust drops by `SECRET_REVELATION_TRUST_PENALTY` (betrayal if source was `confession`)
- **Subject → revealed-to:** Sentiment shift based on secret type (embarrassment, fear, anger)
- **Revealed-to → subject:** Disposition shift based on secret severity and type
- **Chronicle entry:** "The truth about X's [secret] has come to light. Y learned it from Z."
- **Faction consequences:** If secret is `hidden_allegiance` and revealed to faction leadership, triggers excommunication candidate (links to THR-29)

**6.2 Favor breaking consequences**

When a favor is broken (debtor refuses when called):

```typescript
function applyFavorBreakingConsequences(
  favor: OwesFavorEdgeProperties,
  debtorId: string,
  creditorId: string,
  graph: WorldGraph,
): void
```

- **Trust:** Massive trust penalty (`FAVOR_BREAKING_TRUST_PENALTY = -0.3`)
- **Sentiment:** Creditor sentiment toward debtor shifts by `FAVOR_BREAKING_SENTIMENT_PENALTY`
- **Reputation walk:** Trust damage propagates via reputation walk — agents who trust the creditor learn the debtor broke a promise
- **Chronicle entry:** "X refused to honor their debt to Y. Trust between them has shattered."

---

### Phase 7: UI (UI)

**7.1 Secrets display on agent panel**

File: `src/components/Game/AgentPanel.tsx`

New "Leverage" section on agent detail panel:
- **Secrets held:** List of agents the selected agent knows secrets about (gated by player's awareness — only visible if the player's bonded agent also knows or was present at discovery)
- **Secrets known about them:** If the player's bonded agent knows a secret about the selected agent, show it
- Secret magnitude shown as prose descriptor: "whispered gossip" (0.1–0.3), "damaging knowledge" (0.3–0.6), "devastating secret" (0.6–1.0)

**7.2 Favors display on agent panel**

- **Favors owed:** Who does this agent owe? Magnitude as prose: "small kindness" → "life debt"
- **Favors held:** Who owes this agent?
- Redeemed/broken favors shown in history

**7.3 Leverage indicators in encounter UI**

When viewing an active social encounter (THR-28), show leverage sources:
- "Holds secret about target (+0.15 leverage)"
- "Target owes a favor (+0.12 leverage)"
- These appear in the encounter detail alongside other leverage sources

**7.4 Chronicle entries**

- Secret discovered: toast — "X has learned something about Y"
- Secret revealed: alert — "The truth about Y's [secret] has been exposed"
- Favor created: silent — natural encounter outcome
- Favor redeemed: toast — "X called in a favor from Y"
- Favor broken: alert — "Y has refused to honor their debt to X"

**7.5 Debug panel**

Add secret/favor edge inspection to agent detail in DebugPanel:
- List all `knows_secret_of` and `owes_favor` edges with full properties
- Aggregate stats: total secrets in graph, total active favors, average magnitude

---

## Wiring Checklist

| Surface | Integration |
|---------|------------|
| **Orchestrator** | New `phaseSecretsFavors` at Phase 6.653 (decay, tension, expiry) |
| **GameState** | No new fields — secrets and favors are graph edges |
| **UI: AgentPanel** | Leverage section (secrets held, favors owed/held) |
| **UI: Encounter** | Leverage source indicators in social encounter display |
| **UI: Chronicle** | 5 event types (secret discovered, revealed, favor created, redeemed, broken) |
| **Encounter pipeline** | Secret/favor leverage in `computeInitialLeverage()`. Secret revelation & favor redemption as encounter step effects. |
| **Prose pipeline** | Secret/favor enrichment in encounter prose. New resolver for leverage description. |
| **Traces** | 5 trace types (secret discovered/revealed, favor created/redeemed/broken) |
| **Debug panel** | Edge inspection for knows_secret_of and owes_favor |
| **Player controls** | 3 divine actions: Reveal Secret, Call in Favor, Plant Secret |
| **THR-28 integration** | `secret_bonus` and `favor_bonus` as LeverageSource types |
| **THR-27 integration** | Tavern encounters as secret discovery venues |
| **THR-29 integration** | Faction excommunication from revealed hidden_allegiance secrets |
| **THR-51 integration** | Spy network initiative produces secret discoveries |

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SECRET_LEVERAGE_MULTIPLIER` | 0.3 | How much secret magnitude translates to initial leverage |
| `FAVOR_LEVERAGE_MULTIPLIER` | 0.25 | How much favor magnitude translates to initial leverage |
| `SECRET_REVELATION_LEVERAGE_BONUS` | 0.25 | Leverage gained from revealing a secret mid-encounter |
| `FAVOR_REDEMPTION_LEVERAGE_BONUS` | 0.20 | Leverage gained from calling in a favor mid-encounter |
| `SECRET_REVELATION_TRUST_PENALTY` | -0.2 | Trust damage when a secret is revealed |
| `SECRET_CONFESSION_BETRAYAL_PENALTY` | -0.4 | Extra trust penalty if secret source was confession |
| `FAVOR_BREAKING_TRUST_PENALTY` | -0.3 | Trust damage when a favor is broken |
| `FAVOR_BREAKING_SENTIMENT_PENALTY` | -0.4 | Sentiment shift when favor is broken |
| `SECRET_DECAY_THRESHOLD` | 0.2 | Secrets below this magnitude can decay |
| `SECRET_MAX_AGE_TICKS` | 100 | Maximum age before minor secrets fade |
| `FAVOR_TENSION_THRESHOLD_TICKS` | 30 | Ticks before unpaid favors cause tension |
| `FAVOR_TENSION_SENTIMENT_DELTA` | -0.02 | Sentiment drift per check from unpaid favor |
| `FAVOR_MAX_AGE_TICKS` | 80 | Maximum age before favors expire (forgiven) |
| `SECRET_FAVOR_CHECK_INTERVAL` | 10 | Ticks between decay/tension checks |
| `REVEAL_SECRET_ESSENCE_COST` | 10 | Essence for Reveal Secret divine action |
| `CALL_IN_FAVOR_ESSENCE_COST` | 8 | Essence for Call in Favor divine action |
| `PLANT_SECRET_ESSENCE_COST` | 14 | Essence for Plant Secret divine action |

---

## Tracing

```typescript
interface SecretDiscoveredTrace {
  tick: number;
  category: 'secrets_favors';
  event: 'secret_discovered';
  discovererId: string;
  subjectId: string;
  secretType: SecretType;
  magnitude: number;
  source: SecretSource;
  encounterContext?: string;
  summary: string;
}

interface SecretRevealedTrace {
  tick: number;
  category: 'secrets_favors';
  event: 'secret_revealed';
  revealerId: string;
  subjectId: string;
  revealedToId: string;
  secretType: SecretType;
  magnitude: number;
  trustConsequence: number;
  sentimentConsequence: number;
  summary: string;
}

interface FavorCreatedTrace {
  tick: number;
  category: 'secrets_favors';
  event: 'favor_created';
  debtorId: string;
  creditorId: string;
  magnitude: number;
  context: string;
  encounterContext?: string;
  summary: string;
}

interface FavorRedeemedTrace {
  tick: number;
  category: 'secrets_favors';
  event: 'favor_redeemed';
  debtorId: string;
  creditorId: string;
  magnitude: number;
  leverageGained: number;
  encounterContext?: string;
  summary: string;
}

interface FavorBrokenTrace {
  tick: number;
  category: 'secrets_favors';
  event: 'favor_broken';
  debtorId: string;
  creditorId: string;
  magnitude: number;
  trustPenalty: number;
  sentimentPenalty: number;
  summary: string;
}
```

---

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Secret discovery encounter but target has no applicable secret type | Generate `hidden_weakness` (always applicable). Magnitude = 0.1 (trivial). |
| `knows_secret_of` edge references deleted agent | Edge orphaned — cleaned up in `phaseSecretsFavors` decay sweep. |
| Favor creation but `relates_to` edge doesn't exist between agents | Create `relates_to` edge first with neutral sentiment, then add favor edge. |
| Leverage computation references missing secret/favor edges | Default to 0 bonus. No crash. |
| Secret revelation in encounter but secret already revealed | Skip revelation step. Encounter continues without leverage bonus. |
| Favor redemption but favor already redeemed/expired | Skip redemption. No leverage bonus. |
| Plant Secret divine action but no valid target for fabricated secret | Create generic `hidden_weakness` secret. Magnitude scaled down. |
| Secret/favor edge count grows unbounded | Cap at `MAX_SECRETS_PER_AGENT` (10) and `MAX_FAVORS_PER_AGENT` (8). Lowest magnitude dropped first. |

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — 17 named constants covering leverage multipliers, decay, tension, costs |
| 2 | Inspectability | PASS — 5 trace types covering full secret/favor lifecycle. Debug panel shows edge details. |
| 3 | Determinism | PASS — Secret type generation deterministic from graph state + seeded PRNG. Favor creation from encounter outcomes (already deterministic). |
| 4 | Fail-soft | PASS — see table above. Missing edges → zero bonus. Orphaned edges cleaned up. No crashes. |
| 5 | Narrative > mechanics | PASS — secrets have prose-rich types ("hidden allegiance", "past crime"). Favors have context strings. Chronicle entries tell stories. Revelation is dramatic. |
| 6 | Additive | PASS — two new edge types, new phase, new encounter templates. No existing systems modified destructively. Leverage integration extends THR-28's existing computation. |
| 7 | Performance | PASS — Secret/favor checks are O(agents × avg_edges). Leverage computation adds O(1) per encounter start (edge lookups). Decay phase is O(total_secret_favor_edges). All negligible. |

---

## Implementation Order for CC

1. Define `KnowsSecretOfEdgeProperties`, `OwesFavorEdgeProperties`, `SecretType`, `SecretSource` types (new `src/types/secretsFavors.ts`)
2. Register `knows_secret_of` and `owes_favor` edge types in graph schema
3. Create `secretGeneration.ts` — secret type generation from agent graph state
4. Wire secrets into `computeInitialLeverage()` (extend THR-28)
5. Wire favors into `computeInitialLeverage()` (extend THR-28)
6. Create `phaseSecretsFavors` — decay, tension, expiry (new `src/engine/phaseSecretsFavors.ts`)
7. Wire into orchestrator at Phase 6.653
8. Create 6 secret discovery encounter templates (new `src/data/secret-encounter-content.ts`)
9. Add `favorGeneration` metadata to ~8 existing encounter templates
10. Implement secret revelation as encounter step effect
11. Implement favor redemption as encounter step effect
12. Implement consequence chains (revelation trust/sentiment, favor breaking)
13. Add 3 divine action templates: Reveal Secret, Call in Favor, Plant Secret
14. Add Leverage section to AgentPanel (secrets held, favors owed)
15. Add leverage source indicators to encounter UI
16. Add chronicle entries for secret/favor events
17. Extend debug panel for secret/favor edge inspection
18. Write tests: secret generation, leverage computation, decay/tension, revelation consequences, favor breaking
19. Smoke test via CLI: `tick 60`, check `graph` for new edge types, `traces` for secret/favor events
20. Visual verification: `?view=game&seeded` — check AgentPanel shows leverage section

## Estimated Scope

~2-3 CC sessions. Lighter than THR-28 and THR-29 because secrets and favors piggyback on the leverage mechanic (THR-28) and encounter pipeline (existing). The bulk is Phase 3–4 content (encounter templates + tagging existing templates) and Phase 6 consequence chains.
