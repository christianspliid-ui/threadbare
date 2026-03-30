# Tiered Backstory Generation — Design Doc

**Date:** 2026-03-17
**Status:** Design complete, pending implementation

## Problem

The current backstory system (`profileGenerator.ts`) generates a flat 3-paragraph backstory (origin → middle → closing) using simple template selection. It's gated by knowledge level: paragraph 1 at Intimate, full backstory at Transparent. This has two problems:

1. **No narrative depth curve.** The backstory reads the same at every level — you just see more of it. There's no qualitative shift from "surface impression" to "deep psychological insight."
2. **Wrong gating axis.** Backstory is gated by Knowledge Level (passive familiarity accumulation), not by Influence Tier (active divine investment). The player should earn deeper character insight by deepening their *relationship* with the agent, not just by standing near them long enough.

We need a **tiered backstory generator** where each Influence Tier unlocks a qualitatively different stratum of the character's story — from public reputation to buried psychological truth — using the existing graph-walking resolver pattern. The system must be fully deterministic (seeded PRNG), template-based (no LLM), and integrated with notifications so the player knows when new content is available.

## Design Decisions

### Decision 1: Gate by Influence Tier, Not Knowledge Level

**Chosen:** Backstory strata are gated by Influence Tier (0-4 on the `worships` edge). Knowledge Level still gates the *existence* of the backstory section in the UI (Recognised+ to see the section header), but the *content depth* tracks Influence Tier.

**Why:** Influence Tier represents intentional player investment — spending essence, maintaining a connection, choosing this agent over others. That makes the reward of deeper backstory feel *earned*. A player can observe an agent for 100 ticks and know their archetype and faction, but knowing what haunts them at night requires actively deepening the divine bond. This creates a pull loop: curiosity about the character → invest essence → unlock backstory → deepen attachment → invest more.

**Implication:** An agent at Knowledge Level "Transparent" but Influence Tier 1 would show only the Surface Story. An agent at Knowledge Level "Recognised" but Influence Tier 3 would show nothing (Knowledge Level too low to display the section). The two axes are complementary: Knowledge Level = permission to see the UI section; Influence Tier = depth of what's inside.

### Decision 2: Cumulative Strata (Not Rewritten)

**Chosen:** Each tier adds new paragraphs below the previous strata. Tier 3 shows strata 1 + 2 + 3 concatenated with section breaks.

**Why:** Rewriting (where Tier 3 replaces Tier 1 with a richer integrated version) is more narratively elegant but creates two problems: (a) the player loses the version they already read, which feels like a retcon, and (b) it doubles the content authoring burden since every stratum needs multiple versions. Cumulative strata are additive — a core project principle — and they create a satisfying "scroll to the new section" experience.

**Visual treatment:** Each stratum has a subtle section divider (thin horizontal rule in the sphere's accent color). The most recently unlocked stratum gets a "New" badge that fades after the player reads it (see UI Integration section).

### Decision 3: Stratum Resolvers Following Prose Resolver Pattern

**Chosen:** Each stratum is produced by a dedicated resolver function following the established `(nodeId, graph, seed) → ProseLayer[]` pattern from `proseResolvers.ts`. This reuses the existing fail-soft, deterministic, graph-walking infrastructure.

**Why not extend the existing `generateBackstory`?** The current function is a single pick-and-replace operation. The tiered system needs to walk different graph edges at different tiers (bonds, traits, axiological profile, story shape, worships edge properties). That's exactly what the resolver pattern was built for. We get debug tracing, fail-soft returns, and category-based composition for free.

**Difference from location/agent prose resolvers:** These resolvers compose by *stratum tier* rather than by *category*. Instead of capping at 2 per category, we compose all layers for a given tier into that tier's stratum block. The public API filters by the agent's current Influence Tier.

### Decision 4: Graph Data as Narrative Fuel (Not New Properties)

**Chosen:** Every stratum draws exclusively from data that already exists on the graph — no new node properties needed.

| Stratum | Graph data source |
|---------|-------------------|
| Surface Story | `narrativeArchetype` property, `belongs_to` culture edge, `primarySphere` property |
| Personal History | `relates_to` bond edges (sentiment, strength, basis), `has_trait` edges, `axiologicalProfile` top values |
| Inner Life | Full `axiologicalProfile` (contradictions, shadows), fear derivation (from Psyche Strands logic), `cooperationStrategy` |
| Unmasked Self | Archetype story shape (from `archetype-content.ts`), `worships` edge properties (`totalEssenceSpent`, `ticksAtCurrentTier`), all the above composed into arc projection |

### Decision 5: New AlertIcon Type for Backstory Unlocks

**Chosen:** Add `'revelation'` to the `AlertIcon` union type. When an agent crosses an Influence Tier threshold, emit a TickEvent with a `notification` directive using the `alert` channel, `'revelation'` icon, and the agent's ID in `actorId`. Clicking the alert selects the agent and opens the profile modal.

**Why alert, not toast?** Toasts expire in 4 seconds. A backstory unlock is a significant, persistent piece of new content — the player might not want to read it immediately but shouldn't lose the notification. Alerts persist (up to 12) and carry `actorId` for navigation.

## Architecture

### The Five Strata

```
┌─────────────────────────────────────────────────────────────────┐
│ STRATUM 0 — (Tier 0: Unaware)                                  │
│ Nothing. No backstory section visible.                          │
├─────────────────────────────────────────────────────────────────┤
│ STRATUM 1 — Surface Story (Tier 1: Touched)                    │
│ The public narrative. What you'd hear about this person in a    │
│ tavern or marketplace. Archetype + culture + sphere.            │
│                                                                 │
│ Resolvers: surfaceOriginResolver, surfaceSphereResolver         │
│ Tone: Observational, external. "They say..." / "Known as..."   │
│ Length: 1-2 paragraphs                                          │
│ Graph data: narrativeArchetype, belongs_to (culture),           │
│             primarySphere                                       │
├─────────────────────────────────────────────────────────────────┤
│ STRATUM 2 — Personal History (Tier 2: Devoted)                  │
│ The turning points. Specific people, specific choices. This is  │
│ the story the agent would tell a trusted friend.                │
│                                                                 │
│ Resolvers: bondHistoryResolver, traitOriginResolver,            │
│            turningPointResolver                                 │
│ Tone: Specific, named. "{name} and {bond} once..." / "The      │
│       {trait} in {name} first showed when..."                   │
│ Length: 2-3 paragraphs                                          │
│ Graph data: relates_to edges (bonds), has_trait edges,          │
│             top 3 axiological values                            │
├─────────────────────────────────────────────────────────────────┤
│ STRATUM 3 — Inner Life (Tier 3: Champion)                       │
│ Motivations, contradictions, fears. The gap between who they    │
│ appear to be and who they are. Where the dark secrets begin.    │
│                                                                 │
│ Resolvers: contradictionResolver, fearResolver,                 │
│            hiddenMotiveResolver                                 │
│ Tone: Introspective, penetrating. "Beneath the {trait}          │
│       exterior..." / "What {name} will never admit..."          │
│ Length: 2-3 paragraphs                                          │
│ Graph data: full axiologicalProfile (contradictions = pairs     │
│             where both poles > 0.3), fear derivation (shadow    │
│             of strongest values), cooperationStrategy           │
├─────────────────────────────────────────────────────────────────┤
│ STRATUM 4 — The Unmasked Self (Tier 4: Aspect)                  │
│ Full psychological portrait. The cost of their story playing    │
│ out. How the divine bond has changed them. What breaks them.    │
│                                                                 │
│ Resolvers: storyArcResolver, divineTransformationResolver       │
│ Tone: Intimate, fatalistic. "The thread of {name}'s story       │
│       bends toward..." / "Since the Ascendant's touch..."      │
│ Length: 2-4 paragraphs                                          │
│ Graph data: archetype storyShape (from archetype-content.ts),   │
│             worships edge (totalEssenceSpent,                   │
│             ticksAtCurrentTier), all previous data composed     │
│             into arc projection                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Resolver Specification

Each resolver follows the standard pattern from `proseResolvers.ts`. The key difference is that these return `BackstoryLayer` (extends `ProseLayer` with a `stratum` field) instead of plain `ProseLayer`.

#### New Type: BackstoryLayer

```typescript
interface BackstoryLayer extends ProseLayer {
  /** Which stratum this layer belongs to (1-4). */
  stratum: 1 | 2 | 3 | 4;
}
```

#### Stratum 1 Resolvers

**`surfaceOriginResolver`**
- Priority: 100
- Category: `'origin'`
- Graph path: Node → `narrativeArchetype` property → ARCHETYPE lookup → `belongs_to` edge → culture node
- Content table: `SURFACE_ORIGIN_PROSE` keyed by archetype ID (19 keys × 3-4 templates each)
- Placeholders: `{name}`, `{culture}`, `{archetype}`
- Tone: Third-person hearsay. "They say {name} came from the {culture} lands, a {archetype} who..."

**`surfaceSphereResolver`**
- Priority: 80
- Category: `'atmosphere'`
- Graph path: Node → `primarySphere` property
- Content table: `SURFACE_SPHERE_PROSE` keyed by sphere name (8 keys × 3-4 templates each)
- Placeholders: `{name}`, `{sphere}`
- Tone: Observable manifestation. "The {sphere} clings to {name} like..."

#### Stratum 2 Resolvers

**`bondHistoryResolver`**
- Priority: 100
- Category: `'character'`
- Graph path: Node → `relates_to` edges → target nodes (top bond by strength)
- Content table: `BOND_HISTORY_PROSE` keyed by bond basis (8 basis types × 3-4 templates each)
- Placeholders: `{name}`, `{bond}`, `{basis}`
- Tone: Specific, narrative. Names the bond partner. "The first time {name} met {bond}, it was through {basis}..."
- Selection: Picks the strongest bond. If bond sentiment < 0, uses a separate `BOND_HISTORY_NEGATIVE_PROSE` table.

**`traitOriginResolver`**
- Priority: 80
- Category: `'history'`
- Graph path: Node → `has_trait` edges → trait nodes (first trait)
- Content table: `TRAIT_ORIGIN_PROSE` keyed by trait category (6 categories × 3-4 templates each): innate, mastery, reputation, scar, condition, destiny
- Placeholders: `{name}`, `{trait}`
- Tone: Causal. "The {trait} in {name} was not born — it was forged..."

**`turningPointResolver`**
- Priority: 60
- Category: `'tension'`
- Graph path: Node → `axiologicalProfile` property → top value pair by absolute magnitude
- Content table: `TURNING_POINT_PROSE` keyed by value pair name (10 pairs × 3-4 templates each)
- Placeholders: `{name}`, `{value}` (the dominant pole label)
- Tone: Pivotal moment. "Something shifted in {name} the day they chose {value} over its opposite..."

#### Stratum 3 Resolvers

**`contradictionResolver`**
- Priority: 100
- Category: `'tension'`
- Graph path: Node → `axiologicalProfile` → find pairs where BOTH poles are strong (|left_pole| > 0.3 AND |right_pole| > 0.3 — meaning the pair value is near 0 but with high engagement on both sides)
- **Detection logic:** A contradiction is when the absolute value of a pair is < 0.3 but the agent has traits or bonds that pull in both directions. Alternatively, simpler: pairs where |value| < 0.2 (agent is genuinely torn).
- Content table: `CONTRADICTION_PROSE` keyed by value pair name (10 pairs × 3-4 templates each)
- Placeholders: `{name}`, `{left_pole}`, `{right_pole}`
- Tone: Psychological exposure. "{name} is both {left_pole} and {right_pole} — not in balance, but in war..."
- Fallback: If no contradiction found (all values are decisive), use `DECISIVE_NATURE_PROSE` — "There is no war inside {name}. That certainty is itself a kind of wound."

**`fearResolver`**
- Priority: 80
- Category: `'character'`
- Graph path: Node → `axiologicalProfile` → strongest value pair → derive shadow fear (same logic as Psyche Strands `getFearsStrand`)
- Content table: `FEAR_PROSE` keyed by value pair name + pole (20 entries: 10 pairs × 2 poles × 2-3 templates each)
- Placeholders: `{name}`, `{fear}`, `{value}`
- Tone: Vulnerability exposed. "What {name} will never admit — even to the {sphere} — is the {fear} that..."
- Example: ambition_contentment where value > 0.3 (ambitious) → fear = "irrelevance", template = "{name} drives forward with a hunger that frightens even those closest to them — but in the quiet hours, the fear of {fear} gnaws like rust on iron."

**`hiddenMotiveResolver`**
- Priority: 60
- Category: `'history'`
- Graph path: Node → `cooperationStrategy` property + `axiologicalProfile`
- Content table: `HIDDEN_MOTIVE_PROSE` keyed by cooperation strategy (5 strategies × 3-4 templates each)
- Placeholders: `{name}`, `{strategy_description}`
- Tone: Behavioral insight. "Watch {name} long enough and a pattern emerges..."
- Cross-reference: The strategy is colored by the dominant axiological value. A "tit-for-tat" agent with high loyalty reads differently from one with high cunning.

#### Stratum 4 Resolvers

**`storyArcResolver`**
- Priority: 100
- Category: `'tension'`
- Graph path: Node → `narrativeArchetype` → archetype `storyShape` (from `archetype-content.ts`) → project current state onto arc
- Content table: `STORY_ARC_PROSE` keyed by archetype ID (19 archetypes × 3-4 templates each)
- Placeholders: `{name}`, `{arc_phase}` (beginning/middle/climax, derived from agent age or tick count)
- Tone: Fatalistic, oracular. "The thread of {name}'s story bends toward {arc_climax}. Whether they know it yet is irrelevant — the pattern is already set."
- Arc phase derivation: Use `ticksAtCurrentTier` on the worships edge as a proxy for "how far along the story is." Early = beginning language, middle = rising tension, late = approaching climax.

**`divineTransformationResolver`**
- Priority: 80
- Category: `'character'`
- Graph path: Node → `worships` edge → `totalEssenceSpent`, `ticksAtCurrentTier`, `establishedTick`
- Content table: `DIVINE_TRANSFORMATION_PROSE` keyed by essence bracket (low/medium/high/massive × 3-4 templates each)
- Placeholders: `{name}`, `{ascendant_sphere}` (from Ascendant's primary sphere)
- Tone: Transformation narrative. "Since the Ascendant's touch first reached {name}, something has shifted in the weave around them..."
- Essence brackets: `totalEssenceSpent` < 20 = low, < 50 = medium, < 100 = high, 100+ = massive. Higher essence = more dramatic transformation language.

### Public API

```typescript
/**
 * Generate tiered backstory for an agent, filtered by influence tier.
 * Returns only the strata the player has unlocked, composed into
 * a flowing narrative with stratum section breaks.
 *
 * @param agentId - The agent's node ID
 * @param graph - The world graph
 * @param seed - World seed for deterministic PRNG
 * @param influenceTier - Current influence tier (0-4)
 * @returns BackstoryResult with composed text and metadata
 */
function generateTieredBackstory(
  agentId: string,
  graph: WorldGraph,
  seed: number,
  influenceTier: InfluenceTier,
): BackstoryResult

interface BackstoryResult {
  /** Full composed backstory text (all unlocked strata joined). */
  text: string;
  /** Individual strata for UI rendering with section breaks. */
  strata: BackstoryStratum[];
  /** Highest unlocked stratum number (1-4), or 0 if none. */
  maxStratum: number;
}

interface BackstoryStratum {
  /** Stratum number (1-4). */
  tier: 1 | 2 | 3 | 4;
  /** Stratum title for UI display. */
  title: string;
  /** Composed prose text for this stratum. */
  text: string;
  /** Whether this is the most recently unlocked stratum (for "New" badge). */
  isNew: boolean;
}
```

### Stratum Titles

| Stratum | Title | Subtitle (tooltip) |
|---------|-------|---------------------|
| 1 | "What They Say" | The story as others tell it |
| 2 | "What They Lived" | The history that shaped them |
| 3 | "What They Hide" | The truth beneath the surface |
| 4 | "What They Are" | The unmasked self |

### Content Tables Summary

New content tables to add to a new file `src/data/backstory-content.ts`:

| Table | Key type | Keys | Templates per key | Total templates |
|-------|----------|------|-------------------|-----------------|
| `SURFACE_ORIGIN_PROSE` | archetype ID | 19 | 3-4 | ~65 |
| `SURFACE_SPHERE_PROSE` | sphere name | 8 | 3-4 | ~28 |
| `BOND_HISTORY_PROSE` | bond basis | 8 | 3-4 | ~28 |
| `BOND_HISTORY_NEGATIVE_PROSE` | bond basis | 8 | 2-3 | ~20 |
| `TRAIT_ORIGIN_PROSE` | trait category | 6 | 3-4 | ~21 |
| `TURNING_POINT_PROSE` | value pair | 10 | 3-4 | ~35 |
| `CONTRADICTION_PROSE` | value pair | 10 | 3-4 | ~35 |
| `DECISIVE_NATURE_PROSE` | (flat array) | — | 4-5 | ~5 |
| `FEAR_PROSE` | value pair + pole | 20 | 2-3 | ~50 |
| `HIDDEN_MOTIVE_PROSE` | cooperation strategy | 5 | 3-4 | ~17 |
| `STORY_ARC_PROSE` | archetype ID | 19 | 3-4 | ~65 |
| `DIVINE_TRANSFORMATION_PROSE` | essence bracket | 4 | 3-4 | ~14 |
| **Total** | | | | **~383 templates** |

All templates follow the Threadbare Tone Rules from the prose-resolver skill. Content authoring should use the Tonal Bible and Character Archetypes wiki page from Notion as creative fuel.

## Notification Integration

### Trigger

When the influence system promotes an agent to a new tier (in the tick loop's influence phase), and the new tier is >= 1, emit a TickEvent:

```typescript
{
  type: 'backstory_unlock',
  message: `${agentName}'s story deepens`,
  actorId: agentId,
  sphere: ascendantPrimarySphere,
  notification: {
    channel: 'alert',
    icon: 'revelation',
  },
}
```

### AlertIcon Addition

Add `'revelation'` to the `AlertIcon` union in `src/types/notification.ts`. The icon visual should be an open book or unfurling scroll — consistent with the Threadbare aesthetic of threads revealing hidden knowledge.

### Read Tracking

Add a `readBackstoryTier` field to the `InfluenceRelationshipProperties` on the `worships` edge:

```typescript
interface InfluenceRelationshipProperties {
  // ... existing fields ...
  /** Highest backstory stratum the player has viewed. Used for "New" badge. */
  readBackstoryTier: 0 | 1 | 2 | 3 | 4;
}
```

When the player opens the agent profile modal and the backstory section is visible, update `readBackstoryTier` to match the current `tier`. The `isNew` field on `BackstoryStratum` is computed as `stratum.tier > readBackstoryTier`.

## UI Integration — Play Experience

### Where Backstory Appears

The backstory lives in the **AgentProfileModal** (`src/components/Game/AgentProfileModal.tsx`), which is the Tier 3 full-screen modal opened by "View Profile" from the AgentDetailPanel. This is the right home: backstory is deep content that deserves full-screen reading space, not sidebar compression.

### Visibility Gating (Two-Key Lock)

Both conditions must be met for the backstory section to render:

| Condition | Source | Minimum |
|-----------|--------|---------|
| Knowledge Level | FamiliarityMap | `'recognised'` (0.2+) |
| Influence Tier | `worships` edge `.tier` | `1` (Touched) |

If Knowledge Level is Recognised+ but Influence Tier is 0 (Unaware), show a locked placeholder: *"You sense there is more to {name}'s story, but the threads between you are too thin to read it."* This teaser tells the player backstory content exists and incentivizes investing influence.

If Influence Tier is 1+ but Knowledge Level is Stranger, the backstory section is simply absent (no tease) — the player hasn't even identified this agent yet.

### Layout Within the Modal

```
┌─────────────────────────────────────────────────────────────┐
│ [Portrait]  NAME               Knowledge: Known             │
│             Archetype · Faction · Culture                   │
│             Sphere: ●                                       │
├─────────────────────────────────────────────────────────────┤
│ ── Traits ──────────────────────────────────────────────── │
│ ── Bonds ───────────────────────────────────────────────── │
│ ── Quotes ──────────────────────────────────────────────── │
│ ── Attachments ─────────────────────────────────────────── │
├─────────────────────────────────────────────────────────────┤
│ ── Their Story ─────────────────────────────────────────── │
│                                                             │
│   ┌─ What They Say ─────────────────────────────────────┐  │
│   │ Surface story prose...                              │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─ What They Lived ──────────────────── ✦ New ────────┐  │
│   │ Personal history prose...                           │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─ What They Hide ──────────────── 🔒 Champion ───────┐  │
│   │ (locked placeholder text)                           │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─ What They Are ───────────────── 🔒 Aspect ─────────┐  │
│   │ (locked placeholder text)                           │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The "Their Story" Section

- **Section header:** "Their Story" with a small thread-weave decorative element
- **Unlocked strata:** Rendered as prose blocks with stratum title as a subtle header (smaller than section headers, using the agent's sphere accent color)
- **Most recently unlocked stratum:** Shows a `✦ New` badge (sphere-colored) next to the stratum title. Badge fades to transparent after 3 seconds of the section being in viewport, and `readBackstoryTier` is updated on the worships edge.
- **Locked strata (future tiers):** Shown as dimmed placeholders with the required tier name. The locked text should be evocative, not mechanical:
  - Tier 2 locked: *"There are stories {name} shares only with those who have proven their devotion."*
  - Tier 3 locked: *"The fears and contradictions within {name} are visible only to a true champion of the divine."*
  - Tier 4 locked: *"Only when {name} becomes an aspect of the divine can the full truth be read in their threads."*
- **Scroll behavior:** When opened from a `'revelation'` alert notification, the modal auto-scrolls to the newly unlocked stratum.

### AgentDetailPanel Teaser (Sidebar)

The sidebar `AgentDetailPanel` (not the modal) should show a compact backstory teaser when Influence Tier >= 1 and Knowledge Level >= Recognised:

- **One line** from the Surface Story (stratum 1, first sentence only)
- **"Read more →"** link that opens the AgentProfileModal scrolled to the backstory section
- If a new stratum was unlocked since last read, show the `✦` indicator next to "Their Story" in the sidebar

### Notification Flow (Player Journey)

```
1. Player invests essence → Agent promoted to Tier 2 (Devoted)
2. Tick loop emits 'backstory_unlock' TickEvent
3. Notification router creates Alert:
   icon: 'revelation'
   message: "Kaela's story deepens"
   actorId: kaela_id
4. Alert appears in the alert tray (persistent)
5. Player clicks alert → agent selected → AgentDetailPanel opens
6. Player sees "Their Story" section with ✦ indicator
7. Player clicks "Read more →" → AgentProfileModal opens
8. Modal auto-scrolls to "What They Lived" (stratum 2) with ✦ New badge
9. Player reads → badge fades → readBackstoryTier updated to 2
10. Locked strata 3-4 visible below as teaser placeholders
```

### Portrait Integration

At Tier 4 (Aspect), the portrait prompt from `generatePortraitPrompt()` could be enriched with backstory elements — but this is a stretch goal, not part of the core implementation.

## Implementation Tasks

### Phase 1: Types and Content Infrastructure

1. **Add `BackstoryLayer`, `BackstoryResult`, `BackstoryStratum` types** to `src/types/prose.ts`
2. **Add `'revelation'` to `AlertIcon` union** in `src/types/notification.ts`
3. **Add `readBackstoryTier` field** to `InfluenceRelationshipProperties` in `src/types/influence.ts`
4. **Create `src/data/backstory-content.ts`** with all 12 content tables (start with 2 templates per key, expand later)
5. **Write data tests** validating content table structure, placeholder consistency, and key coverage

### Phase 2: Resolver Implementation

6. **Implement Stratum 1 resolvers** (`surfaceOriginResolver`, `surfaceSphereResolver`) in a new file `src/engine/backstoryResolvers.ts`
7. **Implement Stratum 2 resolvers** (`bondHistoryResolver`, `traitOriginResolver`, `turningPointResolver`)
8. **Implement Stratum 3 resolvers** (`contradictionResolver`, `fearResolver`, `hiddenMotiveResolver`)
9. **Implement Stratum 4 resolvers** (`storyArcResolver`, `divineTransformationResolver`)
10. **Write resolver unit tests** — TDD, test each resolver returns correct layers for known graph shapes, test fail-soft on missing data

### Phase 3: Generator and Composition

11. **Implement `generateTieredBackstory()`** public API in `src/engine/backstoryGenerator.ts` — runs resolvers, filters by tier, composes strata
12. **Write composition tests** — verify tier filtering, stratum ordering, determinism (same seed = same output)

### Phase 4: Notification Integration

13. **Add backstory_unlock event emission** to the influence tier promotion logic in the tick loop (likely in `orchestrator.ts` or the influence phase)
14. **Add 'revelation' icon handling** to notification router (if needed — may work automatically via the existing alert routing)
15. **Wire up readBackstoryTier tracking** — update on profile modal view

### Phase 5: UI Integration

16. **Add "Their Story" section to AgentProfileModal** with stratum rendering, locked placeholders, and New badges
17. **Add backstory teaser to AgentDetailPanel** (sidebar) with one-line preview and "Read more →"
18. **Add auto-scroll behavior** when opened from revelation alert
19. **Add revelation icon visual** to the alert tray icon set

### Phase 6: Content Enrichment

20. **Expand content tables** to target density (3-4 templates per key), following the Threadbare Tone Rules and using the Notion wiki Character Archetypes page as creative fuel
21. **Playtest and tune** — verify backstory feels qualitatively different at each tier, not just "more text"

## Content Authoring Guidance

All backstory templates must follow the Threadbare Tone Rules (see prose-resolver skill). Additionally, each stratum has its own **narrative voice** that must be maintained:

| Stratum | Voice | Point of view | Temporal frame |
|---------|-------|--------------|----------------|
| 1 — Surface | Tavern gossip, hearsay | Third person, external observer | Past/present ("They say...") |
| 2 — Personal | Intimate narrator, biographer | Third person, close | Past definite ("The day they met...") |
| 3 — Inner Life | Psychologist, confessor | Third person, penetrating | Present continuous ("Beneath the surface...") |
| 4 — Unmasked | Oracular, thread-reader | Second person divine ("You see...") or cosmic third | Future/eternal ("The pattern bends toward...") |

The shift from "They say" (Stratum 1) to "You see" (Stratum 4) mirrors the deepening of the divine bond — at Tier 4, the player is reading the agent's threads directly, not hearing about them secondhand.

### Contradiction Detection (Stratum 3 — Key Algorithm)

The contradiction resolver needs a clear definition of what constitutes a "psychological contradiction":

1. **Near-zero pairs with high engagement:** `|value| < 0.15` on a pair where the agent has traits or bonds that would pull in both directions. This is the "genuinely torn" case.
2. **Cross-pair tension:** Two different pairs that imply conflicting behavior. Example: high `loyalty` (positive loyalty_treachery) + high `cunning` (positive cunning_honesty) = someone who is deeply loyal but also deeply strategic/deceptive. The template would narrativize this specific tension.
3. **Archetype-value mismatch:** The archetype implies one thing but the axiological profile says another. Example: "True Believer" archetype with high `cunning` — faith wielded as a weapon.

For implementation simplicity, start with approach #1 (near-zero pairs). Approaches #2 and #3 are richer but require cross-referencing content tables and can be added as a content enrichment pass.

## Tunables

All magic numbers are named constants in a new `BACKSTORY_CONSTANTS` block:

| Constant | Default | Purpose |
|----------|---------|---------|
| `CONTRADICTION_THRESHOLD` | 0.15 | |value| below this = "torn" on that pair |
| `FEAR_THRESHOLD` | 0.3 | |value| above this = strong enough to derive a shadow fear |
| `ESSENCE_BRACKET_LOW` | 20 | totalEssenceSpent threshold |
| `ESSENCE_BRACKET_MEDIUM` | 50 | totalEssenceSpent threshold |
| `ESSENCE_BRACKET_HIGH` | 100 | totalEssenceSpent threshold |
| `NEW_BADGE_FADE_MS` | 3000 | How long the "New" badge shows before fading |
| `BACKSTORY_SECTION_MIN_KNOWLEDGE` | `'recognised'` | Minimum knowledge level to see backstory section |

## File Plan

| File | Purpose | New/Modified |
|------|---------|-------------|
| `src/types/prose.ts` | BackstoryLayer, BackstoryResult, BackstoryStratum types | Modified |
| `src/types/notification.ts` | Add 'revelation' to AlertIcon | Modified |
| `src/types/influence.ts` | Add readBackstoryTier to InfluenceRelationshipProperties | Modified |
| `src/data/backstory-content.ts` | All 12 content tables (~383 templates) | **New** |
| `src/engine/backstoryResolvers.ts` | 9 resolver functions | **New** |
| `src/engine/backstoryGenerator.ts` | Public API: generateTieredBackstory() | **New** |
| `src/engine/agentDetail.ts` | Wire backstory into AgentInfoCardData and AgentFullProfileData | Modified |
| `src/engine/notificationRouter.ts` | Handle 'revelation' icon (if needed) | Modified (minor) |
| `src/components/Game/AgentProfileModal.tsx` | "Their Story" section with strata rendering | Modified |
| `src/components/Game/AgentDetailPanel.tsx` | Backstory teaser line | Modified |
| `src/data/backstory-content.test.ts` | Content table structure tests | **New** |
| `src/engine/backstoryResolvers.test.ts` | Resolver unit tests | **New** |
| `src/engine/backstoryGenerator.test.ts` | Composition and tier-filtering tests | **New** |

## Connections

- [[Prose Generator Framework]] — Backstory resolvers follow the same pattern
- [[Influence Tiers]] — Gating axis for backstory depth
- [[Knowledge Fog of War]] — Secondary gating axis (section visibility)
- [[Progressive Disclosure]] — Backstory is the deepest layer of progressive disclosure
- [[Psyche Strands]] — Fear derivation logic reused for Stratum 3
- [[Narrative Archetypes]] — Story shapes drive Stratum 4 arc projection
- [[Axiological Motivation Engine]] — Contradiction and value data for Strata 2-4
- [[Disposition System]] — Cooperation strategy informs Stratum 3 hidden motives
- [[Notification System]] — 'revelation' alerts for unlock events
- [[Agent Detail Panel]] — Sidebar teaser
- [[Agent Profile Modal]] — Full backstory display (home for "Their Story" section)
