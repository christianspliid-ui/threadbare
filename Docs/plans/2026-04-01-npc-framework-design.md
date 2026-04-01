# NPC Framework Design — Spotlight Tier Model

> **Date:** 2026-04-01
> **Backlog:** TB-069 (Location Non-Agent Characters)
> **Status:** Design approved, pending implementation plan
> **Depends on:** Location/sublocation variety pass (companion backlog item)

## Summary

A tiered inhabitant system that populates the world with ambient NPCs — innkeepers, guards, merchants, priests — who give locations texture, generate encounters, and serve as social fabric nodes. NPCs share the same `actor` node type as full agents but operate at lower fidelity levels. A graduation path promotes NPCs to full agents through player action, organic importance accumulation, or dramatic story events.

This framework extends the existing Generalized Action Targeting system. NPCs are a new target type in the universal pattern: **navigate to thing → thing becomes target → detail view + ActionDrawer populate**.

---

## Phased Delivery

This design covers the full NPC vision. Implementation is split into two phases to manage structural risk.

### Phase 1 (v1): Core NPC Loop

**Scope:** Seed ambient NPCs at world-gen → player can target them → NPC action templates → graduation to spotlight.

Delivers:
- Spotlight tier model (`ambient` / `notable` / `spotlight`) on actor nodes
- World-gen NPC seeding by location subtype
- NPC action template pool (~20-25 templates)
- All three graduation paths (player-initiated, organic threshold, story-triggered)
- Phase 2.37 NPC Graduation tick phase
- Participation matrix — explicit `spotlightTier` guards in engine code paths
- UI: NPC roster in location detail, NPC targeting, lightweight NPC detail view
- Basic faction seeding (NPCs get `member_of` edges to factions at world-gen)

### Phase 2 (v2): Depth Systems

**Scope:** Retainers, encounter-driven emergence, faction depth. Requires structural changes to encounter participant model (shared prerequisite with TB-095 Party System).

Delivers:
- Retainer mechanic (`retainer_of` edge, co-movement, loyalty, desertion)
- Encounter-driven NPC emergence (`ensureNpcAtLocation` API)
- Faction passive contributions (headcount, role coverage, location presence)
- Tier-aware faction evaluation (ambient exempt, notable evaluated lightly)
- Faction-triggered graduation (leader succession, wartime promotions)
- Encounter multi-participant support (prerequisite: encounter state must support secondary actors beyond `actorId` + `targetAgentId`)
- Notable NPCs fully participate in tick phases (encounter progression, familiarity, trait decay)

**Why this split:** The current encounter state models one `actorId` and an optional `targetAgentId` (`encounter.ts`). Retainers as encounter participants and faction-triggered multi-actor events require extending this to support secondary participants. This is the same structural work TB-095 (Party System) needs. Phase 1 avoids this dependency entirely.

### Phase 3 (v3): Cross-System Integration

**Scope:** NPCs woven into the social expansion systems and broader game economy. Builds on both v2 and the Social Expansion backlog items.

Delivers:
- **TB-095 bridge:** retainers convert to party members when party system lands. Tavern NPCs as party recruitment encounter sources.
- **TB-096 bridge:** notable NPCs as deep social scene participants with personality-driven counter-arguments, leverage from NPC relationships.
- **TB-099 bridge:** ambient NPCs as rumor sources (innkeeper `well-connected` trait → rumor generation), `knows_secret_of` edges on notable NPCs, favor economy with NPC contacts.
- **TB-071 bridge:** NPC roles affect location prosperity (smith → craft bonus, merchant → trade bonus). NPC wealth tied to location economic health.
- **NPC-initiated encounters:** notable NPCs with high importance can generate encounter candidates that target spotlight agents (the innkeeper asks for help, the guard captain reports a threat). Reversal of the current one-way "player targets NPC" flow.
- **NPC lifecycle:** ambient NPCs can age, die of natural causes, be replaced by world-gen-style seeding. Settlements that lose key NPCs (healer dies, smith leaves) suffer location-level consequences.
- **Cultural NPC naming:** NPC names use culture-specific naming conventions per the cultural naming system. Different cultures produce different role titles (Aurelian "Legatus" vs Warrens "Warboss" for guard captain).

---

## 1. The Spotlight Tier Model

Every world inhabitant is an `actor` graph node with `actorType: 'individual'`. The `spotlightTier` property determines fidelity:

| Tier | Role | Tick Participation | Player Interaction |
|------|------|---|---|
| **Ambient** | Background inhabitants | None — invisible to tick loop | Encounter generator/modifier. Targetable with reduced NPC action set. Appears in prose. |
| **Notable** | Plot-relevant NPCs | Encounter participation (v2), relationship updates, familiarity, trait evolution | Same NPC action set with richer prose. Eligible for organic graduation. |
| **Spotlight** | Full agents | All tick phases — decisions, movement, ambitions, knowledge | Full agent action set (119+ templates). Hex map signifier. Full profile modal. |

### Key Principles

- **NPCs are `actorType: 'individual'`, same as agents.** The `spotlightTier` property is the participation discriminator, not `actorType`.
- **Tier determines which properties are populated and which tick phases process the actor.** Lower tiers have sparser property bags — they're not a different thing, just a quieter version of the same thing.
- **Ambient NPCs are encounter generators, not encounter participants.** Their presence unlocks or modifies which encounters are available at a location (a corrupt guard makes "Smuggle Goods" available), but they don't take resolution steps or have outcomes applied to them.
- **Notable NPCs are both generators and participants.** They appear in encounter resolution steps, gain traits from outcomes, and form opinions. (Full encounter participation deferred to Phase 2 pending multi-participant support.)
- **Hex map renders spotlight-tier actors only.** Graduation to spotlight has a visible moment — a new dot appears on the map.

---

## 2. Participation Matrix

The engine currently gates agent behavior on `actorType === 'individual'`. With NPCs sharing this type, explicit `spotlightTier` guards must be added. This section maps every affected code path.

### Engine Phase Guards

Each phase that currently processes all `individual` actors must add a tier check at entry:

| Code Path | Current Gate | Required Change |
|---|---|---|
| `phaseAgentDecision.ts` (Phase 2b) | `actorType === 'individual'` | Add: `&& spotlightTier === 'spotlight'` |
| `phaseMovement.ts` (Phase 2.35) | `actorType === 'individual'` | Add: `&& spotlightTier === 'spotlight'` |
| `socialEncounterGeneration.ts` — candidate targets | any nearby actor | Add: `spotlightTier === 'spotlight'` filter (ambient/notable are not valid social encounter targets for agents) |
| `agentValidation.ts` — axiological profile check | all `individual` actors | Add: skip validation for `spotlightTier !== 'spotlight'` (ambient has no axiological profile) |
| `agentDetail.ts` — capability/profile computation | all actors | Add: return lightweight NPC detail for `spotlightTier !== 'spotlight'` instead of falling back to empty objects |
| `graphQueries.ts` — agent listing | `actorType === 'individual'` | Add optional `spotlightTier` filter parameter; default behavior unchanged |
| `phaseInteractionDepth.ts` (Phase 2.76) | all colocated actors | Add: `spotlightTier !== 'ambient'` (ambient NPCs don't accumulate knowledge) |

### Validation Rules by Tier

| Validation | Ambient | Notable | Spotlight |
|---|---|---|---|
| Must have `name` | Yes | Yes | Yes |
| Must have `located_at` edge | Yes | Yes | Yes |
| Must have axiological profile | No — skip | Yes | Yes |
| Must have capability scores | No — skip | No — skip | Yes |
| Must have ambitions | No — skip | No — skip | Yes |
| Must have knowledge model | No — skip | No — skip | Yes |

### Targeting Contract

NPCs use `targetCategory: 'actor'` in the existing `TargetContext` system — no new target category. The template filtering cascade adds `spotlightTier` awareness:

- When target is `actor` with `spotlightTier === 'ambient'` or `'notable'` → filter to NPC template pool
- When target is `actor` with `spotlightTier === 'spotlight'` → filter to full agent template pool (existing behavior)

The `getTargetActionSlots()` function checks `spotlightTier` on the target node to select the template pool.

---

## 3. Graph Representation by Tier

### Ambient Properties

```typescript
spotlightTier: 'ambient'
name: string
npcRole: string                    // innkeeper, guard, merchant, healer, etc.
culture: string                    // culture node ID
sphereAffinity: SphereType | null  // single dominant sphere, or null
importance: number                 // starts at 0, accumulates toward NOTABLE_THRESHOLD
```

**Edges at ambient tier:**
- `located_at` → location or sublocation node
- `has_trait` → 1-3 trait nodes
- `belongs_to` → culture node (NOT `member_of` — that's for factions/groups)
- `member_of` → faction node (if faction-affiliated)
- `relates_to` → created on demand (player actions, encounter outcomes)

No axiological profile, no capability scores, no ambitions, no knowledge model, no movement queue, no wealth tracking.

**Rarity:** NPCs use the unified rarity model (Mundane / Storied / Mythic / Legendary) for visual treatment and narrative weight. Most world-gen NPCs are Mundane; higher rarity comes from story events, player action, or graduation. Rarity and spotlight tier are orthogonal — an ambient NPC can be Storied, a spotlight agent can be Mundane. See `Docs/plans/2026-04-01-unified-rarity-model-design.md`.

**Importance:** The `importance` property is shared with the unified rarity model. One accumulating score feeds two independent graduation evaluators: spotlight tier graduation (this spec) and rarity graduation (unified rarity model). The importance sources and increments defined in this spec and the rarity spec are additive — any event that bumps importance contributes to both tracks.

### Notable Properties (added at graduation)

Everything from ambient, plus:

```typescript
spotlightTier: 'notable'
axiologicalProfile: AxiologicalProfile   // generated from traits + culture + role
reputationTallies: ReputationTallies     // starts zeroed
wealth: number                          // seeded from role (merchant > guard > hermit)
```

**Additional edges:**
- `relates_to` edges tracked bidirectionally with bond strength
- Can gain `has_trait` edges from encounter outcomes

Still no: ambitions, movement queue, knowledge model, full capability scores.

### Spotlight Properties (added at full graduation)

Everything from notable, plus:

```typescript
spotlightTier: 'spotlight'
ambitions: Ambition[]
capabilityScores: Record<ReachDomain, number>
knowledgeModel: AgentKnowledge
movementQueue: MovementEntry[]
```

At this point they're indistinguishable from any other agent.

**Migration note:** All existing agents in the codebase are spotlight-tier by definition. The migration adds `spotlightTier: 'spotlight'` to all existing actor nodes. No behavioral change — this is purely additive.

### Hydration Function

A single `hydrateToTier(actorId, targetTier, rng)` function handles all promotions. It generates missing properties deterministically from what's already on the node:

- Traits → axiological profile (trait-weighted generation)
- Role + culture → capability score seeds
- Sphere affinity + culture → ambition generation
- All seeded from PRNG so the same NPC hydrates identically given the same seed

---

## 4. NPC Seeding (Phase 1: World-Gen Only)

### World-Gen Seeding

Locations spawn a role-based roster determined by location subtype:

| Location Subtype | Seeded Roles | Count |
|---|---|---|
| Settlement (hamlet) | innkeeper, elder, guard | 2-3 |
| Settlement (town) | innkeeper, merchant, guard captain, smith, healer, priest | 4-6 |
| Settlement (city) | all town roles + scholar, spy, noble, entertainer, faction rep | 6-10 |
| Temple / Shrine | priest, acolyte, pilgrim | 2-3 |
| Military outpost | commander, quartermaster, scout | 2-3 |
| Lair / Ruin | none (monsters, not NPCs) | 0 |
| Wilderness location | hermit, ranger, wanderer (rare, 30% chance each) | 0-2 |

Each NPC gets: a name (from culture naming tables), role, 1-3 traits (weighted by role), sphere affinity (from culture + role), and their location's culture assignment. Sublocation assignment where applicable (innkeeper → tavern, smith → market).

**Population cap scales by settlement tier:**

| Settlement Tier | Max NPCs |
|---|---|
| Hamlet | 4 |
| Town | 8 |
| City | 15 |

**Initial world population:** A medium map (~25 settlements) produces roughly 100-200 ambient NPCs at generation. Dense areas (cities) get more; frontier locations get fewer or none.

### Faction NPC Seeding

At world-gen, factions seed NPC members based on faction type:

| Faction Type | Seeded NPC Roles | Count |
|---|---|---|
| Merchant guild | merchant, trader, clerk, appraiser | 3-6 |
| Military order | soldier, guard, scout, quartermaster | 4-8 |
| Religious order | priest, acolyte, pilgrim, shrine keeper | 3-6 |
| Thieves' guild | fence, informant, lookout | 2-4 |
| Noble house | steward, herald, attendant, guard | 3-5 |
| Scholarly circle | scribe, librarian, researcher | 2-4 |
| Artisan guild | smith, weaver, mason, brewer | 3-5 |

NPCs get `member_of` edges to their faction with appropriate rank. Placed at faction-relevant locations. Faction-seeded NPCs count toward the per-location population cap.

### Phase 2: Encounter-Driven Emergence

Deferred to Phase 2. When implemented, this adds an `ensureNpcAtLocation(locationId, roleKey, rng)` API:

- **Idempotent:** if an NPC with that role already exists at the location, return it.
- **Stable identity:** NPC ID derived from `hash(locationId + roleKey)`, not from tick or encounter order. Two encounters in the same tick referencing the same missing role at the same location get the same NPC.
- **Guard rails:** only crystallizes for roles sensible at the location subtype; capped at per-tier `MAX_NPCS_PER_LOCATION`.
- **Deterministic:** all generation (name, traits, sphere) seeded from the stable ID.

---

## 5. NPC Action Templates

A reduced, purpose-built template pool (~20-25 templates) for interacting with ambient and notable NPCs. Distinct from the 119+ agent templates.

### Template Categories

**Information actions (Eye reach):**
- Ask for Information — roll Eye vs NPC traits
- Eavesdrop — passive observation, NPC unaware
- Read Intentions — gauge NPC sphere affinity and loyalty

**Social actions (Heart/Shadow reach):**
- Befriend — build `relates_to` bond strength
- Intimidate — force compliance, risks negative reputation
- Bribe — Gold reach, wealth cost, high success rate
- Recruit — bind NPC to player's service
- Charm — Heart reach, sphere-colored persuasion

**Utility actions (role-gated):**
- Trade Goods — merchants/innkeepers only
- Commission Craft — smiths/artisans only
- Seek Healing — healers/priests only
- Request Shelter — innkeepers only
- Hire as Guide — rangers/scouts only

**Divine actions (Ascendant-specific):**
- Bless — mark with divine favor trait, large importance bump
- Curse — mark with divine affliction, large importance bump
- **Promote to Agent** — essence cost, sphere alignment check, graduates NPC to spotlight immediately

### Template Filtering

NPC actions filter on:
- `npcRole` — role-gated templates only show for matching roles
- `spotlightTier` — some actions require notable (e.g., actions referencing axiological values)
- Player's reach capability — standard prerequisite check
- Sphere alignment — standard check where applicable

---

## 6. Graduation Mechanics

Three paths to promotion, all calling the same `hydrateToTier()` function.

### Path 1: Player-Initiated (Any → Spotlight)

The **"Promote to Agent"** divine action. Can skip tiers — the player spends essence to force full graduation.

- **Cost:** Essence (tunable, scales with current importance — cheaper if already notable)
- **Prerequisite:** Star reach capability check, sphere alignment with NPC's affinity
- **Result:** Full hydration to spotlight in one step. NPC enters tick loop next tick.

### Path 2: Organic Threshold (Ambient → Notable, Notable → Spotlight)

The `importance` score accumulates from:

| Event | Increment |
|---|---|
| Player targets NPC with any action | +3 |
| Encounter prose references NPC by name | +1 |
| `relates_to` edge created (any source) | +2 |
| NPC gains a trait from encounter outcome | +4 |
| NPC's location becomes contested/threatened | +1 |

**Importance is cumulative — it does not reset on tier change.** An NPC promoted to notable at importance 10 continues accumulating toward the spotlight threshold of 25.

**Ambient → Notable:** when `importance >= NOTABLE_THRESHOLD` (tunable, default 10).

**Notable → Spotlight:** when `importance >= SPOTLIGHT_THRESHOLD` (tunable, default 25) AND:
- At least 3 `relates_to` edges
- At least one ambition-compatible trait

### Path 3: Story-Triggered (Any → Any)

Encounter outcomes can force immediate graduation via `graduationEffect` tags on templates:

- NPC witnesses murder / major crime → notable
- NPC recruited by a faction → notable
- NPC survives a direct threat → notable
- NPC chosen as faction leader → spotlight
- NPC receives a Destiny trait → spotlight

### Graduation Trace

Every promotion emits:

```typescript
{
  type: 'npc_graduated',
  actorId: string,
  fromTier: SpotlightTier,
  toTier: SpotlightTier,
  trigger: 'threshold' | 'player_action' | 'story_event',
  reason: string,
  tick: number
}
```

Feeds narrative engine for a prose beat on notable and spotlight promotions.

---

## 7. Tick-Phase Integration

### Phase Map (Phase 1)

| Phase | Ambient | Notable | Spotlight |
|---|---|---|---|
| 2a.5 Encounter Progression | No | No (v1) / Yes (v2) | Yes |
| 2a.7 Encounter Revelations | No | No (v1) / Yes (v2) | Yes |
| 2b Agent Decision | No | No | Yes |
| 2.35 Movement | No | No | Yes |
| 2.36 Colocation Detection | No | No (v1) / Yes (v2) | Yes |
| **2.37 NPC Graduation (NEW)** | **Scanned** | **Scanned** | No |
| 2.5 Dilemma Detection | No | No | Yes |
| 2.75 Familiarity | No | No (v1) / Yes (v2) | Yes |
| 2.76 Interaction Depth | No | No (v1) / Yes (v2) | Yes |
| 6.55-6.636 Decay & Traits | No | No (v1) / Yes (v2) | Yes |

In Phase 1, notable NPCs are functionally equivalent to ambient except for having richer properties (axiological profile, wealth, reputation). Their tick participation expands in Phase 2 when encounter multi-participant support is added.

### Phase 2.37: NPC Graduation

Runs after movement (2.35), before dilemma detection (2.5). For each non-spotlight actor:

1. Check `importance` against tier threshold
2. Check story-triggered graduation flags (set by encounter outcomes earlier in the tick)
3. If promotion criteria met → `hydrateToTier()`, emit `npc_graduated` trace
4. Newly promoted spotlight agents don't act until next tick (no mid-tick state surprises)

**Performance:** Only iterates actors with `spotlightTier !== 'spotlight'`. Cheap threshold comparison.

### Encounter Scoring Awareness

When agents score encounter candidates:
- Encounters modified by an ambient NPC get a small score bonus
- Encounters generated by an ambient NPC's presence get normal scoring

Agents are subtly drawn toward NPC-populated locations.

---

## 8. UI & Visibility

### Navigation & Targeting

NPCs participate in the universal targeting pattern: **navigate to thing → thing becomes target → detail view + ActionDrawer populate.**

Full targeting hierarchy:

| Target Type | Where You Find It | Detail Shows | ActionDrawer Shows |
|---|---|---|---|
| Hex | Click map tile | Hex Chronicle (Land/Soul/People/Ruins) | Hex actions |
| Location | People tab → location list | Location info, sublocations, NPC roster | Location actions |
| Sublocation | Location detail → sublocation list | Sublocation info, occupants | Sublocation actions |
| NPC (ambient/notable) | Location detail → NPC roster | NPC profile (lightweight) | NPC action templates |
| Agent (spotlight) | People tab, hex map dot, location detail | Full agent profile modal | Full agent action templates |
| Faction | People tab → faction list, agent → faction link | Faction info, members, territory | Faction actions |
| Monster / Lair | People tab → threats, hex map signifier | Monster/lair info, threat level | Monster/lair actions |
| Artifact | Agent → attachments, location detail | Artifact properties, history | Artifact actions |

One pattern, everywhere. NPCs are just another row.

### NPC Navigation Flow

1. Player clicks hex → hex selected, Hex Chronicle visible
2. Player navigates to People tab → location list
3. Player selects a location (e.g., "The Dustwalk Inn") → location becomes target, location actions in ActionDrawer
4. Player clicks through to location detail page
5. NPC roster visible on location detail (name, role, tier indicator, faction)
6. Player clicks an NPC → NPC becomes target, NPC detail view + NPC actions in ActionDrawer
7. Player selects action → resolution → outcome

### Hex Map

Spotlight-tier actors only. Agent dots, movement trails, selection — all gated to `spotlightTier === 'spotlight'`. Graduation to spotlight = new signifier appears.

### Chronicle / Event Feed

- NPC graduation (notable and spotlight) → chronicle entry with narrative prose
- Ambient NPC emergence → silent (no event noise)

---

## 9. Constants Table

| Constant | Default | Purpose |
|---|---|---|
| `NOTABLE_THRESHOLD` | 10 | Importance score for ambient → notable graduation |
| `SPOTLIGHT_THRESHOLD` | 25 | Importance score for notable → spotlight graduation |
| `SPOTLIGHT_MIN_EDGES` | 3 | Minimum `relates_to` edges for notable → spotlight |
| `PROMOTE_ESSENCE_BASE` | 8 | Base essence cost for player "Promote to Agent" action |
| `PROMOTE_IMPORTANCE_DISCOUNT` | 0.5 | Multiplier: higher importance = cheaper promotion |
| `IMPORTANCE_PLAYER_ACTION` | 3 | Importance gained when player targets NPC |
| `IMPORTANCE_ENCOUNTER_REFERENCE` | 1 | Importance gained when encounter prose names NPC |
| `IMPORTANCE_EDGE_CREATED` | 2 | Importance gained when a `relates_to` edge is created |
| `IMPORTANCE_TRAIT_GAINED` | 4 | Importance gained when NPC gets a trait from encounter |
| `IMPORTANCE_LOCATION_CONTESTED` | 1 | Importance gained when NPC's location is contested |
| `MAX_NPCS_HAMLET` | 4 | NPC population cap for hamlets |
| `MAX_NPCS_TOWN` | 8 | NPC population cap for towns |
| `MAX_NPCS_CITY` | 15 | NPC population cap for cities |
| `WILDERNESS_NPC_CHANCE` | 0.3 | Probability of each wilderness NPC role spawning |

---

## 10. Tracing

### Trace Types

```typescript
interface NPCGraduatedTrace {
  type: 'npc_graduated'
  actorId: string
  fromTier: 'ambient' | 'notable'
  toTier: 'notable' | 'spotlight'
  trigger: 'threshold' | 'player_action' | 'story_event'
  reason: string
  importance: number
  tick: number
}

interface NPCSeededTrace {
  type: 'npc_seeded'
  actorId: string
  locationId: string
  role: string
  factionId: string | null
  tick: number  // always 0 for world-gen
}
```

---

## 11. Fail-Soft Table

| Failure Case | Fallback |
|---|---|
| NPC role not in culture naming table | Generate name from default fantasy name pool |
| Location at NPC cap during world-gen | Skip remaining roles for this location |
| Hydration fails (missing trait nodes for axiological generation) | Generate neutral axiological profile (all values at 0.5) |
| Faction has no notable/ambient NPCs for leader succession | Faction enters "leaderless" state (existing mechanic) |
| NPC has no ambition-compatible traits at spotlight threshold | Generate generic ambition from culture + role |
| Graduation phase encounters corrupt importance score | Clamp to 0, log warning, skip graduation this tick |
| `spotlightTier` missing on legacy actor node | Default to `'spotlight'` (backward compatibility) |

---

## 12. PRNG Callouts

| Operation | Seed Derivation |
|---|---|
| World-gen NPC roster | `worldSeed + locationIndex * 97 + roleHash` |
| NPC name generation | `worldSeed + actorIndex * 31 + cultureHash` |
| NPC trait assignment | `worldSeed + actorIndex * 53 + roleHash` |
| Axiological profile hydration | `worldSeed + actorHash * 71` |
| Capability score hydration | `worldSeed + actorHash * 89 + reachIndex` |
| Ambition generation | `worldSeed + actorHash * 67 + culturalHash` |
| Wilderness NPC spawn chance | `worldSeed + locationIndex * 41` |

---

## 13. Phase 2 Design Notes

These sections are approved design but deferred from Phase 1 implementation. They're preserved here as the specification for Phase 2 work.

### 13.1 Retainer Mechanic

**Prerequisite:** Encounter state must support secondary participants beyond `actorId` + `targetAgentId`. This is the same structural work TB-095 (Party System) needs.

New edge type: `retainer_of` from NPC actor → patron agent actor.

```typescript
{
  type: 'retainer_of',
  properties: {
    role: string,        // 'squire', 'bodyguard', 'servant', 'advisor', 'scout'
    since: number,       // tick recruited
    loyalty: number      // 0.0-1.0
  }
}
```

**Recruitment:** Agent-initiated (encounter outcome) or player-initiated (NPC action). Minimum requirement: NPC must be notable.

**Behavior:**
- Movement: retainers inherit patron's movement. Co-move automatically.
- Encounters: retainers participate in patron's encounters as secondary actors. Can take resolution steps, gain traits, get wounded, die.
- Importance: accelerated accumulation — every patron encounter bumps importance.
- Loyalty: rises from shared success and adversity. Falls on axiological value conflicts. Below `DESERTION_THRESHOLD` (0.2) → desertion.

**Outcomes:**
- Graduation: crosses spotlight threshold → becomes full agent. `retainer_of` converts to strong `relates_to` bond.
- Death: killed in encounter → node removed. Patron gains `grief-stricken` or `hardened` trait.
- Desertion: loyalty too low → detaches. Becomes free notable at current location with negative bond.
- Party bridge: when TB-095 lands, `retainer_of` converts to `member_of` party group node.

**Phase 2 constants:** `DESERTION_THRESHOLD` (0.2), `LOYALTY_SHARED_SUCCESS` (0.05), `LOYALTY_ADVERSITY_BOND` (0.08), `LOYALTY_VALUE_CONFLICT` (-0.1), `IMPORTANCE_RETAINER_ENCOUNTER` (2).

### 13.2 Encounter-Driven NPC Emergence

An `ensureNpcAtLocation(locationId, roleKey, rng)` API for on-demand NPC creation:

- **Idempotent:** if an NPC with that role already exists at the location, return it.
- **Stable identity:** NPC ID derived from `hash(locationId + roleKey)`, not from tick or encounter order. Two encounters in the same tick referencing the same missing role at the same location get the same NPC — eliminates the race condition.
- **Guard rails:** only crystallizes for roles sensible at the location subtype; capped at per-tier population cap.
- **Deterministic:** all generation (name, traits, sphere) seeded from the stable ID.

Encounter templates declare `npcRoleReference: 'healer'` etc. When the encounter resolves and no matching NPC exists, `ensureNpcAtLocation` creates one.

**Phase 2 trace:** `NPCCrystallizedTrace` with `trigger: 'encounter_reference'`.

### 13.3 Faction Depth

**Tier-aware evaluation:**
- Ambient members: exempt from activity evaluation. Never demoted.
- Notable members: evaluated lightly. Not penalized for inaction.
- Spotlight members: evaluated fully.

**Passive contributions:**
- Headcount — faction influence calculations factor total membership including ambient.
- Role coverage — faction capability enriched by role diversity.
- Location presence — ambient faction members make a location "faction-controlled" for encounter generation.

**Faction-triggered graduation:**
- Faction leader dies → highest-ranked notable promoted to spotlight
- Faction goes to war → ambient soldiers promoted to notable
- Faction receives commission → ambient NPC with matching role promoted to notable

---

## 14. Dependencies & Companion Work

### Required Companion: Location/Sublocation Variety Pass

The NPC framework will expose a location variety gap. To host the full range of NPC roles, we need sublocations like:

- Taverns, markets, forges, temples, libraries, barracks, docks, courts, guild halls, stables, arenas, prisons, academies, observatories, harbors, warehouses

This is a separate backlog item but should be prioritized alongside or before NPC implementation. Without the right locations, many NPC roles have nowhere to live.

### Phase 1 Integration Points

- **Generalized Action Targeting** — NPC templates added to `TargetContext` filtering with `spotlightTier` awareness. NPCs use `targetCategory: 'actor'`, not a new category.
- **World generation** — NPC seeding added after location generation, before tick loop starts
- **Narrative engine** — NPC name/role/trait data available to prose resolvers
- **HexMapV2** — no changes needed (spotlight-only rendering already correct)

### Phase 2 Integration Points

- **Encounter system** — encounter templates gain `npcRoleReference` hooks and `graduationEffect` outcome tags; encounter state extended for secondary participants
- **Faction system** — tier-aware evaluation, passive contribution calculations
- **Movement system** — retainer co-movement in Phase 2.35

### Future Extensions

- **TB-095 Party System:** retainers convert to party members. Party group nodes subsume the `retainer_of` edge pattern.
- **TB-096 Deep Social Scenes:** notable NPCs as scene participants with personality-driven responses.
- **TB-099 Information Economy:** ambient NPCs as rumor sources (innkeepers hear things).

---

## NFP Compliance

| Priority | Status | Notes |
|---|---|---|
| 1. Tunability | PASS | 14 named constants (Phase 1), 5 additional in Phase 2 |
| 2. Inspectability | PASS | 2 trace types in Phase 1 (graduation, seeding), 1 additional in Phase 2 (crystallization) |
| 3. Determinism | PASS | 7 PRNG seed derivations for all generative operations |
| 4. Fail-soft | PASS | 7 failure cases with graceful fallbacks including legacy node compatibility |
| 5. Narrative over mechanical | PASS | Prose beats on graduation events |
| 6. Additive over destructive | PASS | Same `actor` node type, property hydration not node replacement, legacy nodes default to spotlight |
| 7. Performance budget | PASS | Phase 2.37 only iterates non-spotlight actors; world-gen seeding bounded by population caps |
