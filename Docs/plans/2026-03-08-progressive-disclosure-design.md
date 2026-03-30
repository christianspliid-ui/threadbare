# Progressive Disclosure Info System — Design Document

**Date:** 2026-03-08
**Status:** Design
**Scope:** Three-tier progressive disclosure (hover → card → modal) + Knowledge Fog of War

---

## 1. Problem Statement

The current UI has two extremes with no middle ground:

- **Tooltips** show almost nothing (just names via `tooltipResolver.ts`)
- **AgentDetailPanel** shows everything at once (13 fields, no gating)

Players lack the middle-ground information surfaces that create attachment to game objects. Additionally, all agent data is immediately available — there's no sense of discovery, mystery, or earned knowledge.

**Reference:** Endless Legend's tiered info system (hover → selection panel → full dossier) as inspiration for the interaction model.

---

## 2. Design Decisions

### Decision 1: Three-Tier Progressive Disclosure

Three interaction depths, each revealing more:

| Tier | Trigger | Container | Purpose |
|------|---------|-----------|---------|
| **Tier 1 — Tooltip** | Hover/focus | Existing `Tooltip` component | Quick identification — "who is this?" |
| **Tier 2 — Info Card** | Click/select | Right sidebar (replaces `AgentDetailPanel`) | Working knowledge — "what can they do?" |
| **Tier 3 — Profile Modal** | "View Profile" button from Tier 2 | Full-screen modal overlay | Deep dive — "who ARE they?" |

**Rationale:** This matches the established interaction model (hover → click → deep-dive) already used by the wheel/scry/strand overlays. Tier 2 replaces the current AgentDetailPanel in the right sidebar. Tier 3 is new.

### Decision 2: Knowledge Fog of War (Familiarity System)

Every game object has a **familiarity score** (0.0–1.0) relative to the player's Ascendant. Familiarity determines how much data is visible across ALL three tiers. The player never sees the number — they just notice more information appearing as they invest in a character.

Five knowledge levels gate content visibility:

| Level | Range | Analogy | What unlocks |
|-------|-------|---------|-------------|
| **Stranger** | 0.0–0.19 | Passing on the street | Name, location, sphere glow, silhouette portrait |
| **Recognised** | 0.2–0.39 | Been introduced | + Archetype label, faction/culture emblems, 1 value, top 1 domain (vague) |
| **Known** | 0.4–0.59 | Work colleague | + Top 3 domains (precise words), all dominant values, key bonds, 1 quote, cultural traits |
| **Intimate** | 0.6–0.79 | Close friend | + Full 9 domains, all traits, strategy, full bonds, all quotes, backstory (first paragraph) |
| **Transparent** | 0.8–1.0 | You can read their soul | + Full backstory, history timeline, disposition record, hidden traits |

**Rationale:** Creates discovery progression, rewards investment in relationships, supports the "anti-spreadsheet immersion" principle from the Architecture of Fate spec. Mystery makes revelation meaningful.

### Decision 3: Word-Based Stats Only — No Numbers in UI

All numeric values are converted to verbal descriptors before display. This follows the Architecture of Fate spec §3.1 (5-tier word scale) and §1.2 (anti-spreadsheet immersion).

**Domain Capabilities — Nine Reaches word vocabulary:**

| Domain | Tier 1 (0-2) | Tier 2 (2-4) | Tier 3 (4-6) | Tier 4 (6-8) | Tier 5 (8-10) |
|--------|-------------|-------------|-------------|-------------|--------------|
| **Iron** | Meek | Trained | Formidable | Fearsome | Legendary |
| **Gold** | Naive | Bartering | Shrewd | Masterful | Magnate |
| **Shadow** | Exposed | Cautious | Subtle | Unseen | Phantom |
| **Veil** | Blind | Sensitive | Attuned | Channeler | Transcendent |
| **Heart** | Shunned | Tolerated | Liked | Beloved | Revered |
| **Eye** | Oblivious | Observant | Perceptive | Seer | Oracle |
| **Stone** | Clumsy | Handy | Skilled | Masterwork | Monumental |
| **Star** | Lost | Guided | Fated | Destined | Cosmic |
| **Flesh** | Frail | Hardy | Resilient | Enduring | Undying |

**Axiological values** use the existing `intensityPrefix` approach: "Deeply Ambitious", "Somewhat Prudent", "Compassionate". No numeric values shown.

**Reputation** uses verbal tiers: "Distrusted", "Unknown", "Accepted", "Respected", "Revered".

**Bond strength** uses: "Fragile", "Growing", "Strong", "Deep", "Unbreakable".

### Decision 4: Generated Flavor Content

Pre-generated narrative content brings agents to life beyond mechanical data:

| Content | When generated | Stored where | Revealed at |
|---------|---------------|--------------|-------------|
| **Character portrait prompt** | World seeding | Node property `portraitPrompt` | Stranger (silhouette) → Recognised (full) |
| **Faction/culture emblems** | World seeding | Culture/faction node properties | Recognised |
| **2-3 character quotes** | First time agent reaches Known | Node property `generatedQuotes` | Known (1 quote) → Intimate (all) |
| **Background story** | First time agent reaches Intimate | Node property `backstory` | Intimate (paragraph 1) → Transparent (full) |
| **History timeline** | Accumulated from chronicle entries | Derived from event graph | Transparent |

**Architecture for on-demand generation:** The `generateAgentProfile(graph, agentId, prng)` function produces portrait prompts, quotes, and backstory from agent stats + archetype + culture. This same function powers:
1. World seeding (pre-generate for all starting agents)
2. Lazy generation (generate when familiarity threshold crossed)
3. Character generator (player "search for followers" action — generate a new agent matching constraints)

### Decision 5: Familiarity Gain Sources

| Source | Amount | Notes |
|--------|--------|-------|
| Worship tier base | +0.3 / +0.5 / +0.7 | Retinue members start with familiarity from their worship tier |
| Avatar proximity | +0.01/tick | Passive gain when avatar is in same hex |
| Scry action | +0.15 | Direct "learn about them" action |
| Narrative contact | +0.05 | Agent appears in event player witnesses |
| Dilemma involvement | +0.10 | Observing or influencing their dilemma |
| Eye sphere bonus | ×1.5 | Knowledge sphere players gain familiarity faster |
| Shadow sphere bonus | -1 level for hidden traits | Reveals hidden traits one level earlier |
| Heart sphere bonus | -1 level for bonds | Reveals bonds one level earlier |

**Familiarity decay:** None. Once learned, knowledge persists. This prevents frustrating regression.

**Initial state at world seeding:**
- Ascendant's initial worshippers: familiarity = 0.3 (Recognised)
- All other agents: familiarity = 0.0 (Stranger)
- Rival gods: familiarity = 0.0 (and much harder to increase)

### Decision 6: Applies to All Game Objects

The familiarity system is generic — it works on agents, locations, factions, and rival gods. Each object type has its own content mapping per knowledge level:

**Locations:**
- Stranger: Name + terrain type
- Recognised: Sphere influence visible
- Known: Sub-locations revealed, strategic value
- Intimate: Hidden features, ley lines, history
- Transparent: Full history, builders, significant events

**Factions:**
- Stranger: Name + emblem
- Recognised: Leader + general alignment
- Known: Members, territory, goals
- Intimate: Internal politics, rivalries, secret agendas
- Transparent: Full power structure, vulnerabilities

**Rival Gods:**
- Stranger: Vague presence ("A dark power stirs...")
- Recognised: Name + sphere affinity
- Known: General behavior pattern
- Intimate: Specific strategies, sphere weaknesses
- Transparent: Full stat block (MUCH harder to reach — represents major intelligence achievement)

### Decision 7: UI Treatment of Hidden Data

Hidden data should feel like **mystery**, not missing features:

- **Portrait**: Stranger level shows dark silhouette with sphere-colored thread wisps. Recognised reveals the full portrait.
- **Hidden domains**: Show as "???" in muted sphere color — you can see THAT a domain exists but can't read its word yet.
- **Hidden sections**: Simply don't appear in the modal. The modal grows as familiarity increases, creating a tangible sense of discovery.
- **Unlock animation**: When familiarity crosses a threshold, new sections fade in with a subtle thread-weave animation (one-time reveal).
- **Unlock chronicle entry**: "You begin to understand Kael Thornweaver..." — generated from agent's actual stats and archetype prose tone.

---

## 3. Architecture

### 3.1 Data Layer

**Familiarity storage:** Store as a `Map<string, number>` on the GameState (keyed by target object ID). Not a graph edge — familiarity is a player-state concern, not a world-graph relationship.

```typescript
// In GameState
familiarityMap: Map<string, number>;  // objectId → familiarity (0.0-1.0)
```

**Knowledge level derivation:** Pure function `getKnowledgeLevel(familiarity: number): KnowledgeLevel`.

**Generated content storage:** On the graph node's `properties` object:
```typescript
// Agent node properties (populated lazily)
portraitPrompt?: string;
generatedQuotes?: string[];
backstory?: string;
```

### 3.2 Engine Layer

**Familiarity engine** (`familiarity.ts`):
- `getFamiliarity(state, objectId): number`
- `addFamiliarity(state, objectId, amount): GameState` (clamped to 0-1)
- `getKnowledgeLevel(familiarity): KnowledgeLevel`
- `checkThresholdCrossed(oldFam, newFam): KnowledgeLevel | null` — for unlock events

**Gated aggregators:**
- `getAgentInfoCard(graph, agentId, knowledgeLevel): AgentInfoCard` — Tier 2 data, filtered by knowledge
- `getAgentFullProfile(graph, agentId, knowledgeLevel): AgentFullProfile` — Tier 3 data, filtered by knowledge
- `getLocationInfoCard(...)` / `getFactionInfoCard(...)` / `getRivalInfoCard(...)` — same pattern

**Profile generator** (`profileGenerator.ts`):
- `generateAgentProfile(graph, agentId, prng): AgentGeneratedContent`
- `generateQuotes(archetype, values, sphere, prng): string[]`
- `generateBackstory(archetype, culture, traits, bonds, prng): string`
- `generatePortraitPrompt(archetype, culture, sphere): string`

**Domain word resolver** (`domainWords.ts`):
- `DOMAIN_WORD_SCALES: Record<ReachDomain, [string, string, string, string, string]>`
- `getDomainWord(domain, numericValue): string`
- `getValueWord(pair, numericValue): string`
- `getReputationWord(numericValue): string`
- `getBondStrengthWord(numericValue): string`

### 3.3 UI Layer

**Tier 1 — Enhanced Tooltips:** Extend `tooltipResolver.ts` with `agent.*`, `location.*`, `faction.*` prefixes that consult familiarity state.

**Tier 2 — InfoCard component:** Replaces `AgentDetailPanel` in the right sidebar. Compact card showing familiarity-gated summary. "View Profile" button opens Tier 3.

**Tier 3 — ProfileModal component:** Full-screen overlay with all sections from the design (header with portrait, quotes, nature, prowess, bonds, traits, backstory, history, disposition). Each section conditionally rendered based on knowledge level.

### 3.4 Familiarity Integration Points

Familiarity gains are wired into existing tick phases:

| Existing phase | Familiarity hook |
|---------------|-----------------|
| `phaseAgentActions` | +0.05 for narrative contact (agents in events near avatar) |
| `phaseDilemmaDetection` | +0.10 for dilemma involvement |
| Avatar movement | +0.01 for proximity (agents in same hex) |
| Scry action | +0.15 (explicit player action) |
| World seeding | Initialize worship-based familiarity for retinue |

---

## 4. Scope — What This Design Covers

**In scope (this implementation):**
- Familiarity types, constants, engine functions
- Domain word scales (Nine Reaches 5-tier vocabulary)
- Value/reputation/bond verbal descriptors
- Knowledge level gating logic
- Familiarity gain sources (proximity, scry, narrative, dilemma, worship)
- AgentInfoCard component (Tier 2 — replaces AgentDetailPanel)
- AgentProfileModal component (Tier 3 — new full-screen modal)
- Enhanced agent tooltips (Tier 1 — familiarity-aware)
- Familiarity initialization at world seeding
- Familiarity gain wired into orchestrator tick
- Unlock chronicle entries
- Profile generator (quotes, backstory, portrait prompts)
- Trace integration (familiarity_change trace category)

**Deferred (future implementation):**
- Location/faction/rival info cards and profile modals (same pattern, different content)
- Character generator ("search for followers" action)
- Portrait image generation (prompts generated, actual images deferred to art pipeline)
- Faction/culture emblem generation
- Unlock animations (can be added to components later)
- Reveal vignettes (generated prose for threshold crossings)

---

## 5. File Impact Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/familiarity.ts` | CREATE | Types, constants, knowledge levels |
| `src/data/domain-words.ts` | CREATE | 5-tier word scales for all 9 reaches + value/reputation/bond words |
| `src/engine/familiarity.ts` | CREATE | Familiarity engine (get, add, threshold detection) |
| `src/engine/profileGenerator.ts` | CREATE | Quote, backstory, portrait prompt generation |
| `src/engine/agentDetail.ts` | MODIFY | Add gated variants: `getAgentInfoCard`, `getAgentFullProfile` |
| `src/components/Game/AgentInfoCard.tsx` | CREATE | Tier 2 sidebar card (replaces AgentDetailPanel) |
| `src/components/Game/AgentProfileModal.tsx` | CREATE | Tier 3 full-screen modal |
| `src/engine/tooltipResolver.ts` | MODIFY | Add `agent.*` prefix routing with familiarity awareness |
| `src/engine/orchestrator.ts` | MODIFY | Wire familiarity gains into tick phases |
| `src/engine/gameInit.ts` | MODIFY | Initialize familiarityMap, worship-based familiarity |
| `src/types/trace.ts` | MODIFY | Add `familiarity_change` trace category |
| `src/engine/traceBuffer.ts` | MODIFY | Support new trace type |
| `src/components/Game/hooks/useAgentInteraction.ts` | MODIFY | Integrate familiarity into agent selection flow |
| `src/components/Game/GameView.tsx` | MODIFY | Replace AgentDetailPanel with InfoCard, add ProfileModal |

---

## 6. Relationship to Existing Systems

- **Tooltip system** (`Tooltip.tsx`, `tooltipResolver.ts`): Extended, not replaced. Tier 1 uses the existing tooltip component with richer familiarity-aware content.
- **AgentDetailPanel** (`AgentDetailPanel.tsx`): Replaced by `AgentInfoCard` (Tier 2) + `AgentProfileModal` (Tier 3). The existing panel's data aggregation logic in `agentDetail.ts` is refactored into gated variants.
- **Scry system**: Scrying an agent now also increases familiarity (+0.15).
- **Visibility/fog of war** (`visibility.ts`): Complementary but separate. Map fog = spatial visibility. Knowledge fog = information visibility. Both create mystery.
- **Narrative context builder** (`contextBuilder.ts`): Can consume familiarity data to weight context objects (familiar agents rank higher in narrative relevance).
- **Debug trace panel**: New `familiarity_change` trace category shows familiarity gains in the debug feed.
