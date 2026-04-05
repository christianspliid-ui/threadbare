# Unified Rarity Model — Design Document

> **Date:** 2026-04-01
> **Backlog:** TB-100 (Action Rarity & Unlock System) + cross-cutting concern
> **Status:** Design — pending implementation plan
> **Depends on:** Attachment System (✅), Generalized Action Targeting (✅)
> **Related:** NPC Framework (TB-069), Social Expansion (TB-095–099)

---

## Summary

A unified 4-tier rarity model that applies consistently across all player-facing graph nodes — attachments, actors/NPCs, locations, sublocations, and action templates. Rarity is the game's primary visual signal for "pay attention to this" and its primary source of variable ratio reinforcement (most things are Mundane; discovering a Legendary anything is a dopamine hit).

The system extracts the existing attachment tier model into a shared foundation, then extends it to all targetable node types. Every future system that introduces player-facing entities hooks into the same rarity vocabulary, colors, and graduation mechanics.

**Key outcomes:**
1. **Outlier attention** — rarity cuts through noise. In a list of 30 NPCs, the copper border says "look at me."
2. **Variable ratio reinforcement** — scarcity makes discovery rewarding. Most things are Mundane. Legendary is once-per-playthrough rare.

---

## 1. The Four Tiers

Unchanged from the existing attachment system. One vocabulary across the entire game.

| Tier | Name | Color | Hex Code | Psychology |
|------|------|-------|----------|-----------|
| 1 | **Mundane** | Pale silver/grey | `#b0b0b0` | Baseline. Expected. Safe to skim. |
| 2 | **Storied** | Copper/warm bronze | `#c87533` | "This has a story." Worth a second look. |
| 3 | **Mythic** | Deep violet/indigo | `#4b0082` | Rare. Player should engage. |
| 4 | **Legendary** | Gold with ember glow | `#d4a017` | Once per playthrough. Memorable. |

**TB-100 reconciliation:** The TB-100 backlog text uses `common/uncommon/rare/legendary`. This design unifies on `Mundane/Storied/Mythic/Legendary` — the names already shipped with attachments, are more evocative, and match the game's tone. TB-100's action unlock system becomes a *consumer* of this model, not a parallel one.

---

## 2. What Gets Rarity

Five node categories — every player-facing targetable entity type:

| Node Category | Property | Seeded By | Can Graduate? |
|---|---|---|---|
| **Attachments** | `tier` on artifact node + edge (existing) | Reward pool, world-gen | Yes — Enchant/Empower actions (existing) |
| **Actors (NPCs + agents)** | `rarityTier` on actor node properties | World-gen based on role, traits, location | Yes — importance accumulation, player action, story events |
| **Locations** | `rarityTier` on location node properties | World-gen based on subtype, encounter hooks, sphere saturation | Yes — events, player investment, prosperity milestones |
| **Sublocations** | `rarityTier` on sublocation node properties | Seeded independently or inherited from parent location context | Yes — same triggers as locations |
| **Action templates** | `rarityTier` on template definition | Authored (static per template) | No — intrinsic to the template. TB-100 unlock system controls *access*; rarity is *identity*. |

### What Does NOT Get Rarity

- **Hexes** — terrain, not entities. Hex visual treatment is driven by the rarity of what's *on* the hex.
- **Traits** — internal mechanics, not player-facing targets.
- **Edges** — relationships, not targets.
- **Factions / Cultures** — too abstract as standalone targets. Their *members* and *locations* carry rarity instead. A Legendary faction is expressed through Legendary agents and Mythic guild halls, not a number on the faction node.

### Rarity vs Spotlight Tier (NPCs)

The NPC framework (TB-069) introduces `spotlightTier` (ambient / notable / spotlight) — this determines **engine participation fidelity**. Rarity (`rarityTier`) determines **narrative significance**. They are orthogonal:

- An ambient NPC can be Storied (the innkeeper everyone talks about but who never takes tick actions)
- A spotlight agent can be Mundane (a fully simulated guard with no narrative hook)
- Rarity graduation and spotlight graduation are independent — neither triggers the other automatically, though high rarity biases importance accumulation which *can* trigger spotlight graduation via the NPC graduation system

### Extensibility Contract

Any future node type that becomes a player-facing target (encounters as targetable nodes, quest objects, world events) gains rarity by:
1. Adding `rarityTier: RarityTier` to its node properties
2. Providing a seeding function that assigns tier at creation
3. Optionally registering graduation triggers in the graduation evaluator

No changes to the core rarity types, colors, or shared utilities are needed. The system is open for extension, closed for modification.

---

## 3. What Rarity Means Per Type

Rarity expresses **narrative significance**, not power level. A Legendary NPC isn't necessarily strong — they're *important to the story*. A Mythic location isn't high-level — it's *dripping with encounter potential*.

### Actors / NPCs

| Tier | Meaning | World-Gen Example |
|------|---------|-------------------|
| Mundane | Background inhabitant | The unnamed guard, a typical farmer |
| Storied | Has a story hook or notable trait | Mira the shrewd innkeeper who knows everyone's secrets |
| Mythic | Plot-significant, unusual origin | A blind oracle exiled to a frontier town, a disguised noble |
| Legendary | World-defining, prophecy-level | A fallen Ascendant's mortal vessel, a creature of prophecy |

### Locations

| Tier | Meaning | World-Gen Example |
|------|---------|-------------------|
| Mundane | Standard function for its type | A crossroads inn, a small market |
| Storied | Notable history, active story hook | The Dustwalk Tavern where a famous duel happened |
| Mythic | Supernatural significance, rich encounter density | A temple built over a sealed rift, a library of forbidden lore |
| Legendary | World-shaping, pilgrimage-worthy | The Throne of Echoes, a lair of an ancient creature |

### Sublocations

| Tier | Meaning | World-Gen Example |
|------|---------|-------------------|
| Mundane | Functional space | The common room, the market stalls |
| Storied | Character or history | The back room where the resistance meets |
| Mythic | Magically or narratively charged | A crypt beneath the temple with sealed doors |
| Legendary | Singular | The Whispering Forge where a god's weapon was made |

### Action Templates

| Tier | Meaning | Example |
|------|---------|---------|
| Mundane | Always available, bread-and-butter interventions | Charm, Observe, Bless |
| Storied | Unlocked through basic play milestones | Forge Alliance, Summon Guardian |
| Mythic | Requires significant achievement to unlock | Raise Dead Legion, Open Rift |
| Legendary | Once-per-run discovery moments | Unmake, Ascend Mortal, Reshape Reality |

---

## 4. Distribution Curves

Scarcity is the mechanism. These are target percentages at world-gen seeding — tunable named constants.

| Tier | Actors | Locations | Sublocations | Action Templates |
|------|--------|-----------|--------------|-----------------|
| Mundane | ~70% | ~60% | ~65% | ~40% |
| Storied | ~22% | ~28% | ~25% | ~35% |
| Mythic | ~7% | ~10% | ~8% | ~20% |
| Legendary | ~1% | ~2% | ~2% | ~5% |

**Why actors skew Mundane:** Most NPCs are ambient background. The player discovers the interesting ones through exploration.

**Why action templates skew less:** Even "common" divine actions should feel meaningful. Scarcity for actions comes from the unlock system (TB-100), not raw template count. The rarity tier on a template is about its *identity* and *narrative weight*, not about how many exist.

**Map size scaling:** On larger maps, absolute counts of higher tiers increase naturally (2% of 500 locations > 2% of 100), but the *ratio* stays constant. A Legendary discovery is equally rare per-hex regardless of map size.

---

## 5. Constants Table

All tunable numbers as named constants. Changing game feel = changing a number here.

| Constant | Default | Purpose |
|----------|---------|---------|
| `MAX_RARITY_TIER` | `4` | Hard cap — Legendary |
| `RARITY_TIER_NAMES` | `{1:'Mundane', 2:'Storied', 3:'Mythic', 4:'Legendary'}` | Display names |
| `RARITY_TIER_COLORS` | `{1:'#b0b0b0', 2:'#c87533', 3:'#4b0082', 4:'#d4a017'}` | Visual treatment colors |
| `RARITY_DISTRIBUTION_ACTORS` | `{1:0.70, 2:0.22, 3:0.07, 4:0.01}` | World-gen actor rarity weights |
| `RARITY_DISTRIBUTION_LOCATIONS` | `{1:0.60, 2:0.28, 3:0.10, 4:0.02}` | World-gen location rarity weights |
| `RARITY_DISTRIBUTION_SUBLOCATIONS` | `{1:0.65, 2:0.25, 3:0.08, 4:0.02}` | World-gen sublocation rarity weights |
| `RARITY_ENCOUNTER_SCORE_MULTIPLIER` | `{1:1.0, 2:1.3, 3:1.7, 4:2.5}` | Encounter scoring weight by target rarity |
| `RARITY_GRADUATION_THRESHOLDS` | `{2:50, 3:150, 4:null}` | Importance score thresholds for organic graduation. `null` = no organic path to Legendary. |
| `RARITY_GRADUATION_IMPORTANCE_RATE` | `{1:1.0, 2:1.5, 3:2.0, 4:0}` | How fast importance accumulates per rarity tier (higher tiers accumulate faster toward the *next* threshold) |
| `RARITY_NOTIFICATION_THRESHOLD` | `3` | Minimum tier that triggers a discovery toast/chronicle entry |
| `RARITY_LEGENDARY_PULSE_ANIMATION` | `'pulse-gold'` | CSS animation class for Legendary items |

---

## 6. Graduation (Hybrid Mutability)

Rarity is seeded at creation and can increase through gameplay. **Never demotes.** Three graduation paths, mirroring the NPC spotlight graduation model:

### Path 1: Player-Initiated

The player spends essence to elevate an entity's rarity via targeted actions. These are action templates in the existing Generalized Action Targeting system.

- **Attachments:** Enchant / Empower (already implemented)
- **Actors:** "Elevate" / "Empower" / "Consecrate" action templates (new)
- **Locations:** "Invest" / "Consecrate" / "Fortify" action templates (new)

Cost and difficulty scale with target tier, following the same pattern as attachment advancement.

| From → To | Essence Cost | Difficulty |
|-----------|-------------|------------|
| Mundane → Storied | `RARITY_PLAYER_UPGRADE_COST[1]` = 4 | `RARITY_PLAYER_UPGRADE_DIFFICULTY[1]` = 0.20 |
| Storied → Mythic | `RARITY_PLAYER_UPGRADE_COST[2]` = 8 | `RARITY_PLAYER_UPGRADE_DIFFICULTY[2]` = 0.35 |
| Mythic → Legendary | `RARITY_PLAYER_UPGRADE_COST[3]` = 14 | `RARITY_PLAYER_UPGRADE_DIFFICULTY[3]` = 0.50 |

### Path 2: Organic Threshold

Entities accumulate `importance` through gameplay events — being involved in encounters, being targeted by player actions, participating in notable world events. When importance crosses a threshold, rarity graduates.

- Importance is a numeric property on the node (default 0, monotonically increasing).
- Thresholds are defined in `RARITY_GRADUATION_THRESHOLDS`.
- **Legendary has no organic threshold** (`null`) — it's always seeded or player-initiated.
- Importance accumulation rate is itself rarity-biased (`RARITY_GRADUATION_IMPORTANCE_RATE`) — a Storied NPC accumulates importance faster than a Mundane one, creating a natural snowball toward narrative significance.

**Importance sources** (each with a named constant weight):

| Event | Importance Delta | Constant |
|-------|-----------------|----------|
| Involved in a player-targeted action | +`IMPORTANCE_PLAYER_ACTION` = 10 | Per action |
| Involved in a resolved encounter | +`IMPORTANCE_ENCOUNTER` = 3 | Per encounter |
| Referenced in a chronicle entry | +`IMPORTANCE_CHRONICLE` = 5 | Per entry |
| Located at a hex with high divine influence | +`IMPORTANCE_DIVINE_PROXIMITY` = 1 | Per tick while divineInfluence > 0.5 |
| Sphere saturation event on location | +`IMPORTANCE_SPHERE_EVENT` = 8 | Per event |

### Path 3: Story-Triggered

Specific game events directly set rarity, bypassing thresholds:

- A Mundane inn where a Legendary encounter resolves → graduates to Storied
- An NPC who defeats a monster in a Mythic encounter → graduates to at least Storied
- A location where a cataclysm occurs → graduates to Mythic
- Player explicitly performs a "Consecrate" action on a location → graduates per action tier

Story-triggered graduation is implemented as a `graduateRarity()` utility that takes `(node, minTier)` — sets rarity to `max(current, minTier)`. Called from encounter resolution, action effects, and event handlers.

### Graduation Trace

Every graduation emits a trace for inspectability:

```typescript
interface RarityGraduationTrace {
  type: 'rarity_graduation';
  tick: number;
  nodeId: string;
  nodeCategory: 'actor' | 'location' | 'sublocation' | 'attachment';
  previousTier: RarityTier;
  newTier: RarityTier;
  trigger: 'player_action' | 'organic_threshold' | 'story_event';
  cause: string; // e.g., "importance reached 50", "encounter legendary_duel resolved here"
}
```

---

## 7. What Rarity Drives

Rarity is a **read-only signal** for downstream systems. Each consumer queries the node's `rarityTier` and adjusts behavior. Adding a new consumer = reading an existing property, never modifying the rarity system itself.

| Consumer System | How It Uses Rarity | Hook Point |
|----------------|-------------------|------------|
| **Visual treatment** | Tier-colored left border on cards, rows, detail views. Legendary gets `pulse-gold` CSS animation. | UI components read `rarityTier` from node properties |
| **Encounter scoring** | Higher-rarity locations and actors boost encounter candidate scores via `RARITY_ENCOUNTER_SCORE_MULTIPLIER`. | `encounterScoring.ts` — multiply base score by rarity weight |
| **Prose tier selection** | Rarity correlates with narrative engine tier: Mundane → Tier 1, Storied → Tier 1-2, Mythic → Tier 2, Legendary → Tier 3. | Prose resolver reads `rarityTier` when selecting generation tier |
| **Hex map signifiers** | Legendary locations get a distinct hex overlay/signifier. | HexMapV2 composition layer checks `rarityTier` on location nodes |
| **NPC graduation pressure** | Rarity biases importance accumulation speed via `RARITY_GRADUATION_IMPORTANCE_RATE`. | `phaseNpcGraduation.ts` reads rarity when computing importance delta |
| **Action unlock (TB-100)** | Template `rarityTier` determines unlock difficulty curve and visibility rules. | Unlock evaluator reads template rarity |
| **Notifications** | Discovering/graduating an entity at or above `RARITY_NOTIFICATION_THRESHOLD` fires a toast + chronicle entry. | Graduation utility emits notification event |
| **Detail view header** | Rarity tier name + color displayed in entity detail views (agent profile, location detail, sublocation detail). | Detail view components read `rarityTier` |
| **List sorting** | Optional sort-by-rarity in entity lists (NPC roster, location list, attachment list). | UI list components use `rarityTier` as sort key |

### Future Consumer Hooks (not implemented now, designed to be trivial)

- **Trade value** — rarity multiplier on attachment economic value when trade system lands (M3)
- **Faction evaluation** — faction prestige from high-rarity members/locations (TB-098)
- **Rumor generation** — higher-rarity entities generate more rumors (TB-099)
- **World-Soul resonance** — Legendary entities bias echo selection at cycle end

---

## 8. Seeding at World-Gen

Rarity assignment at world-gen uses weighted random selection from `RARITY_DISTRIBUTION_*` tables, biased by contextual factors.

### Actor Seeding

Base distribution: `RARITY_DISTRIBUTION_ACTORS`. Biases:

| Factor | Effect |
|--------|--------|
| NPC role rarity | Some roles are inherently rarer (oracle > guard). Configured in role definitions. |
| Trait count | Actors seeded with 3+ traits get a +1 tier bias |
| Location rarity | An actor placed at a Mythic location gets a +1 tier bias |
| Sphere affinity | Actors with rare sphere affinities (Entropy, Time) get a +1 tier bias |

Bias caps at tier 3 — Legendary is never assigned by bias alone, only by explicit world-gen intention (configurable per map preset).

### Location Seeding

Base distribution: `RARITY_DISTRIBUTION_LOCATIONS`. Biases:

| Factor | Effect |
|--------|--------|
| Subtype | Temples, ruins, and lairs have inherently higher rarity floors |
| Sphere saturation | Locations on hexes with high magicalSaturation get +1 tier bias |
| Encounter hook density | Locations with 3+ applicable encounter templates get +1 tier bias |
| Historical culture | Locations with historical culture layer present get +1 tier bias |

### Sublocation Seeding

Base distribution: `RARITY_DISTRIBUTION_SUBLOCATIONS`. Biases mirror location biases at smaller scale. A sublocation's rarity is independent of its parent location's rarity — a Mundane inn can contain a Mythic hidden cellar.

### Determinism

All seeding uses the game's seeded PRNG. Same seed → same rarity assignments. Bias calculations are pure functions of node properties that are already deterministically assigned upstream.

---

## 9. Graph Representation

### Property

```typescript
// On actor, location, sublocation node properties:
rarityTier: RarityTier  // 1 | 2 | 3 | 4, default 1

// On actor nodes (for graduation):
importance: number       // monotonically increasing, default 0
```

### Attachment Exception

Attachments already use `tier` on the artifact node and modifier edges. For attachments, `tier` IS the rarity tier — no new property needed. The shared `RarityTier` type is an alias, and the shared color/name lookups work for both.

### Action Template Property

```typescript
// On UnifiedActionTemplate:
rarityTier: RarityTier  // static, authored per template
```

---

## 10. Fail-Soft Table

| Failure Case | Fallback Behavior |
|---|---|
| Node missing `rarityTier` property | Default to `1` (Mundane). Never crash. |
| Node missing `importance` property | Default to `0`. Graduation check simply hasn't started. |
| Rarity tier out of range (< 1 or > 4) | Clamp to `[1, 4]`. Log warning trace. |
| Distribution weights don't sum to 1.0 | Normalize at load time. |
| Graduation threshold crossed but node already at or above target tier | No-op. Graduation is `max(current, target)`. |
| Story event tries to set tier below current | No-op. Never demotes. |
| Consumer system encounters unknown rarity tier | Treat as Mundane (tier 1). |

---

## 11. Tracing

### Trace Types

```typescript
interface RarityGraduationTrace {
  type: 'rarity_graduation';
  tick: number;
  nodeId: string;
  nodeCategory: 'actor' | 'location' | 'sublocation' | 'attachment';
  previousTier: RarityTier;
  newTier: RarityTier;
  trigger: 'player_action' | 'organic_threshold' | 'story_event';
  cause: string;
}

interface RarityImportanceTrace {
  type: 'rarity_importance';
  tick: number;
  nodeId: string;
  source: string;          // e.g., 'encounter_resolved', 'player_action', 'divine_proximity'
  delta: number;
  newTotal: number;
  thresholdForNext: number | null;  // null if already Legendary
}

interface RaritySeedingTrace {
  type: 'rarity_seeding';
  tick: 0;                 // always at world-gen
  nodeId: string;
  nodeCategory: string;
  assignedTier: RarityTier;
  baseProbabilities: Record<RarityTier, number>;
  biasesApplied: string[];
}
```

---

## 12. PRNG Callouts

| Location | PRNG Usage |
|----------|-----------|
| World-gen rarity seeding | Weighted random from distribution tables — seeded PRNG |
| Importance accumulation | Deterministic (pure function of events) — no randomness |
| Organic graduation check | Deterministic threshold comparison — no randomness |
| Player-initiated graduation | Resolution system (sigmoid → d100) — seeded PRNG |
| Story-triggered graduation | Deterministic (`max(current, target)`) — no randomness |
| Rarity bias calculations | Deterministic (pure function of node properties) — no randomness |

---

## 13. UI / Visibility

### Visual Treatment

Rarity is expressed identically across all entity types — same colors, same border pattern, same animation:

- **Left border accent** — 3px left border in tier color on all card/row components. Already implemented for attachments.
- **Tier badge** — Small label (`Mundane` / `Storied` / `Mythic` / `Legendary`) in tier color, positioned consistently across detail views.
- **Legendary pulse** — `pulse-gold` CSS animation on Legendary entities. Already implemented for attachments.
- **List priority** — Rarity is a secondary sort key in all entity lists (within primary grouping). Higher rarity → top of group.

### Hex Map

- Legendary locations get a distinct hex composition signifier (golden glow marker or similar — exact visual TBD with art direction).
- Mythic locations optionally get a subtle signifier (desaturated version of Legendary treatment).
- Mundane and Storied locations use standard location signifiers — no hex-level visual change.

### Notifications

- **Discovery toast:** When the player first views (clicks/hovers) an entity at `RARITY_NOTIFICATION_THRESHOLD` (3 = Mythic) or above, fire a notification toast with tier color accent.
- **Graduation chronicle:** When any entity graduates in rarity, append a chronicle entry: "The Dustwalk Tavern has become a place of legend." Tier 4 graduation gets a dramatic prose variant.

### Debug Panel

- Rarity tier visible in entity debug info.
- Importance score visible for actors/locations with graduation enabled.
- "Force Graduate" debug action available.

---

## 14. Wiring

| Module | Wiring Point |
|--------|-------------|
| **Shared type** | `src/types/rarity.ts` — `RarityTier`, names, colors, shared utilities |
| **Constants** | `src/data/rarity-constants.ts` — all tunable numbers |
| **Attachments** | `AttachmentTier` becomes alias for `RarityTier`. Existing code unchanged. |
| **Graph properties** | `rarityTier` on actor/location/sublocation node properties in world-gen |
| **Action templates** | `rarityTier` field on `UnifiedActionTemplate` type |
| **World-gen seeding** | `seedRarityTier()` utility called during node creation |
| **Graduation evaluator** | `evaluateRarityGraduation()` — called from tick phase or event handlers |
| **Graduation utility** | `graduateRarity(node, minTier)` — called from encounter resolution, action effects |
| **Importance accumulation** | `accumulateImportance(node, source, delta)` — called from encounter resolution, action execution, tick phases |
| **Encounter scoring** | `encounterScoring.ts` reads `rarityTier` and applies multiplier |
| **Prose resolver** | Reads `rarityTier` when selecting narrative tier |
| **UI components** | All entity card/row/detail components read `rarityTier` for visual treatment |
| **Hex map** | Composition layer reads location `rarityTier` for Legendary/Mythic signifiers |
| **Notifications** | Graduation utility emits notification event; toast/chronicle consume it |
| **Debug bridge** | Expose `getRarityInfo(nodeId)` and `forceGraduate(nodeId, tier)` |

---

## 15. Implementation Phases

### Phase A: Shared Foundation

Extract rarity types from attachments into shared module. All existing attachment code continues to work unchanged.

- Create `src/types/rarity.ts` with `RarityTier`, names, colors
- Create `src/data/rarity-constants.ts` with distribution tables, thresholds, multipliers
- Alias `AttachmentTier` → `RarityTier` in `src/types/attachments.ts`
- Create `src/engine/rarity.ts` with `seedRarityTier()`, `graduateRarity()`, `accumulateImportance()`
- Add `rarityTier` to `UnifiedActionTemplate` type
- Tests: shared utilities, seeding distribution validation, graduation logic

### Phase B: World-Gen Integration

Seed rarity on actors, locations, and sublocations at world creation.

- Add `rarityTier` and `importance` properties to actor/location/sublocation nodes in world-gen
- Implement bias calculations per node type
- Add rarity seeding traces
- Verify determinism: same seed → same rarity assignments
- Tests: seeding distribution matches target curves within tolerance, bias logic

### Phase C: UI Wiring

Rarity visible across all entity detail views and lists.

- Refactor attachment tier border/badge components into shared `RarityBadge` / `RarityBorder` components
- Wire `rarityTier` display into: agent profile, location detail, sublocation detail, NPC roster, action cards
- Add list sort-by-rarity option
- Legendary pulse animation on all Legendary entities
- Tests: component rendering for each tier, visual regression

### Phase D: Gameplay Wiring

Rarity influences game systems.

- Wire encounter scoring multiplier
- Wire prose tier selection bias
- Implement importance accumulation (encounter resolution, player action, divine proximity)
- Implement organic graduation (threshold check in tick phase or event handler)
- Wire graduation notifications (toast + chronicle)
- Add graduation traces
- Wire hex map signifiers for Legendary/Mythic locations
- Debug bridge: `getRarityInfo()`, `forceGraduate()`
- Tests: encounter scoring with rarity, graduation threshold behavior, notification emission

### Phase E: Action Template Rarity (TB-100 Foundation)

Tag existing action templates with rarity tiers. Does NOT implement unlock system — that's TB-100's scope.

- Add `rarityTier` to all 119+ existing templates (most will be tier 1-2)
- Author rarity assignments based on narrative weight and intended unlock difficulty
- Wire rarity display into action cards in ActionDrawer
- Tests: all templates have valid rarity, action card displays tier

---

## 16. NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | **PASS** | Every number is a named constant in `rarity-constants.ts`. Distribution curves, thresholds, multipliers, costs — all tunable without code changes. |
| 2 | Inspectability | **PASS** | Three trace types (seeding, importance, graduation) make "why is this Mythic?" answerable from traces alone. |
| 3 | Determinism | **PASS** | Seeding uses seeded PRNG. Importance is deterministic. Graduation is threshold comparison. No Math.random anywhere. |
| 4 | Fail-soft | **PASS** | Missing properties default to Mundane/0. Out-of-range values clamped. No rarity operation can crash the tick loop. |
| 5 | Narrative > mechanical | **PASS** | Rarity expresses narrative significance, not power level. A Legendary NPC is important to the story, not necessarily strong. |
| 6 | Additive | **PASS** | New property (`rarityTier`) on existing nodes. Existing `tier` on attachments unchanged (aliased). No removals. |
| 7 | Performance | **PASS** | Rarity is a static property read — O(1) lookup. Importance accumulation is incremental. No batch recomputation. |
