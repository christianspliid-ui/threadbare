# Tavern Social Hubs — Implementation Plan

> **Date:** 2026-04-14
> **Status:** Implementation Planning
> **Issue:** THR-27
> **Depends on:** Nothing (foundational)
> **Blocks:** THR-28 (Deep Social Scenes), THR-74 (Party Formation)

---

## Problem

Settlements lack social focal points. Agents at the same location generate social encounter candidates, but there's no concept of a *gathering place* that concentrates social interaction. The social encounter multiplier is flat across all sublocations — a barracks and a market district have identical social dynamics.

## Solution

Taverns as a new sublocation type that:
1. Seeds automatically in settlements (count scales with settlement tier)
2. Boosts social encounter generation for agents present
3. Provides tavern-exclusive encounter templates
4. Gives the player a "Sanctify Tavern" divine action

---

## Implementation Phases

### Phase 1: Tavern Sublocation Type (Engine)

**1.1 Define tavern sublocation type**

File: `src/engine/sublocation.ts`

Add to `SUBTYPE_SUBLOCATION_MAP`:

```
hamlet:  +1 tavern  (total: garden + tavern)
town:    +1 tavern  (total: market-district + temple-quarter + gatehouse + tavern)
city:    +2 taverns (total: market-district + temple-quarter + barracks + gatehouse + library + 2× tavern)
capital: +2 taverns (total: market-district + temple-quarter + barracks + throne-room + 2× tavern)
```

Tavern type definition:
```typescript
{
  id: 'sublocation-type.tavern',
  name: 'Tavern',
  motivations: [
    { left: 'cooperation', right: 'self-reliance', weight: 0.7 },  // taverns are social
    { left: 'ambition', right: 'contentment', weight: 0.3 },        // ambitious seek connections
  ],
}
```

Multiple tavern instances at the same location get distinct generated names (see Phase 2).

**1.2 Conditional scaling for promoted/demoted settlements**

File: `src/engine/phaseSublocations.ts`

Add a `TAVERN_SUBLOCATION_SPEC` to the conditional specs:
- Towns and above get at least 1 tavern via SUBTYPE_SUBLOCATION_MAP
- Cities and capitals get a second conditional tavern
- If a city demotes to town, the second tavern dissolves (hysteresis)

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `TAVERN_BASE_COUNT_HAMLET` | 1 | Taverns seeded in hamlet |
| `TAVERN_BASE_COUNT_TOWN` | 1 | Taverns seeded in town |
| `TAVERN_BASE_COUNT_CITY` | 2 | Taverns seeded in city |
| `TAVERN_BASE_COUNT_CAPITAL` | 2 | Taverns seeded in capital |
| `TAVERN_CONDITIONAL_PROSPERITY` | 50 | Prosperity threshold for bonus tavern spawn |

**1.3 Social encounter boost for tavern agents**

File: `src/engine/socialEncounterGeneration.ts`

In `generateSocialCandidates()`, after computing base score:
- Check if the acting agent's current sublocation is a tavern (`sublocationTypeId === 'sublocation-type.tavern'`)
- If yes, apply `TAVERN_SOCIAL_ENCOUNTER_BOOST` to all social encounter candidate scores
- Additionally: agents at a tavern sublocation see ALL agents at the parent location (not just sublocation), increasing the visible agent pool

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `TAVERN_SOCIAL_ENCOUNTER_BOOST` | 0.3 | Score boost for social encounters at taverns |
| `TAVERN_COLOCATION_PARENT` | true | Agents at tavern see all agents at parent location |

**1.4 Social density bonus**

File: `src/engine/socialEncounterGeneration.ts`

Locations with more agents present score higher as movement destinations for social-seeking agents. Add density bonus to social encounter scoring:

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `SOCIAL_DENSITY_BONUS_PER_AGENT` | 0.05 | Per additional agent at location beyond the first |
| `SOCIAL_DENSITY_CAP` | 0.3 | Maximum density bonus (caps at 6+ agents) |

---

### Phase 2: Tavern Content (Content)

**2.1 Tavern name generation**

File: new `src/data/tavern-names.ts`

Culture-aware tavern name generation. Pattern: `{adjective} {noun}` from culture word pools, with fallback to generic fantasy tavern names.

Examples:
- Generic: "The Rusty Anchor", "The Crowned Stag", "The Broken Wheel"
- Culture-specific: draws from culture's vocabulary for flavor

Name is stored as `properties.name` on the sublocation node, generated at creation time using seeded PRNG.

**2.2 Tavern-exclusive encounter templates**

File: `src/data/social-encounter-content.ts` (append) or new `src/data/tavern-encounter-content.ts`

10 new encounter templates with `sublocationTypeFilter: 'sublocation-type.tavern'`:

| Template | Type | Steps | Reach | Threat |
|----------|------|-------|-------|--------|
| Tavern Brawl | duel | 2 | iron | moderate |
| Overheard Rumor | explore | 2 | eye | trivial |
| Drinking Contest | duel | 2 | flesh | easy |
| Bardic Performance | assist | 2 | heart | easy |
| Shady Deal | steal | 3 | shadow+gold | moderate |
| Recruiting Drive | hire | 2 | heart | easy |
| The Challenge | duel | 2 | iron | moderate |
| Confession Over Drinks | assist | 3 | heart | easy |
| Merchant's Pitch | trade | 2 | gold | easy |
| The Warning | assist | 2 | eye | easy |

Each template follows the existing `EncounterTemplate` shape from `social-encounter-content.ts`. The `sublocationTypeFilter` field is new (see 2.3).

**2.3 Extend EncounterTemplate type for sublocation filtering**

File: `src/types/encounter.ts`

Add optional field:
```typescript
sublocationTypeFilter?: string;  // if set, only available when agent is at this sublocation type
```

Update `socialEncounterGeneration.ts` to check this field during template filtering.

---

### Phase 3: Tavern UI (UI)

**3.1 Tavern concept art**

File: `src/data/sublocation-concept-art.ts`

Add tavern entry with warm amber/gold gradient and a tankard glyph. Follow the existing pattern for sublocation concept art entries.

**3.2 LocationView — tavern display**

File: `src/components/Game/LocationView.tsx`

No changes needed — the existing `SublocationCard` loop will pick up taverns automatically via `getVisibleSubLocations()`. The concept art and badge will render from the new entry.

**3.3 HexMapV2 — tavern signifier (stretch)**

File: `src/components/HexMapV2/signifiers/signifierRegistry.ts`

Optional: add a small tavern icon signifier visible at medium zoom when a settlement has a tavern. This is a stretch goal — the tavern is already visible in the location detail panel.

**3.4 Chronicle entries for tavern events**

Tavern encounters already flow through the existing chronicle system via encounter resolution. No special chronicle work needed unless we want a "Tavern opened" event when a new tavern spawns (low priority).

---

### Phase 4: Player Agency — "Sanctify Tavern" (Player)

**4.1 New divine action template**

File: `src/data/unified-action-templates.ts` or `src/data/action-template-content.ts`

New action template:
```typescript
{
  id: 'action.sanctify.tavern',
  name: 'Sanctify Tavern',
  sphere: 'heart',  // or 'life'
  reach: 'star',
  essenceCost: 15,
  targetCategories: ['sublocation'],
  targetFilter: { sublocationTypeId: 'sublocation-type.tavern' },
  steps: [
    {
      id: 'sanctify.blessing',
      name: 'Divine Blessing',
      narrative: 'You breathe a whisper of warmth into {target}. The hearth burns brighter, the ale flows sweeter, and travelers feel an inexplicable pull toward its doors.',
      effects: [
        { type: 'modifier', target: 'sublocation', property: 'socialBoost', value: 0.5, duration: 20 },
        { type: 'attraction', radius: 2, duration: 15 },  // draws agents from nearby hexes
      ],
    },
  ],
}
```

Effects:
- Temporary social encounter boost increase (+0.5 on top of base TAVERN_SOCIAL_ENCOUNTER_BOOST)
- Agent attraction: agents within 2 hex distance have increased movement score toward this location
- Duration: 15-20 ticks
- Essence cost: 15

---

## Wiring Checklist

| Surface | Integration |
|---------|------------|
| **Orchestrator** | No new phase — taverns are sublocations (worldgen + phaseSublocations). Social boost is scoring modifier. |
| **GameState** | No new fields — taverns are graph nodes. |
| **UI: LocationView** | Automatic via existing sublocation loop. |
| **UI: HexMapV2** | Stretch: signifier. Not blocking. |
| **Encounter pipeline** | `sublocationTypeFilter` on templates + score boost in socialEncounterGeneration. |
| **Prose pipeline** | Tavern encounter prose authored in templates. No new resolvers needed. |
| **Traces** | Social encounter trace already includes location context. Add `atTavern: boolean` field. |
| **Debug panel** | No new surfaces — sublocation inspection exists. |
| **Player controls** | "Sanctify Tavern" action template. |

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `TAVERN_SOCIAL_ENCOUNTER_BOOST` | 0.3 | Score boost for social encounters when agent is at tavern |
| `TAVERN_COLOCATION_PARENT` | true | Agents at tavern see all agents at parent location |
| `SOCIAL_DENSITY_BONUS_PER_AGENT` | 0.05 | Per-agent bonus for social encounter scoring at populated locations |
| `SOCIAL_DENSITY_CAP` | 0.3 | Max density bonus |
| `TAVERN_BASE_COUNT_HAMLET` | 1 | Taverns per hamlet |
| `TAVERN_BASE_COUNT_TOWN` | 1 | Taverns per town |
| `TAVERN_BASE_COUNT_CITY` | 2 | Taverns per city |
| `TAVERN_BASE_COUNT_CAPITAL` | 2 | Taverns per capital |
| `TAVERN_CONDITIONAL_PROSPERITY` | 50 | Prosperity for bonus conditional tavern |
| `SANCTIFY_TAVERN_ESSENCE_COST` | 15 | Essence cost for Sanctify Tavern action |
| `SANCTIFY_TAVERN_DURATION` | 20 | Ticks the sanctification lasts |
| `SANCTIFY_TAVERN_ATTRACTION_RADIUS` | 2 | Hex distance for agent attraction effect |

---

## Tracing

Extend `SocialEncounterTrace` with:
```typescript
atTavern: boolean;         // was agent at a tavern sublocation
tavernBoostApplied: number; // score boost applied (0 if not at tavern)
```

New trace type for sanctification:
```typescript
interface TavernSanctificationTrace {
  tick: number;
  category: 'divine_action';
  actionId: string;
  sublocationId: string;
  locationId: string;
  boostAmount: number;
  attractionRadius: number;
  duration: number;
  summary: string;
}
```

---

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Settlement has no sublocation map entry | Skip tavern seeding — social encounters still work at location level |
| Agent at tavern but parent location missing | Fall back to sublocation-only colocation detection |
| Tavern name generation fails | Use "The Tavern" as fallback name |
| sublocationTypeFilter on template but agent has no sublocation | Template excluded from candidates (correct behavior) |
| Sanctify Tavern on non-tavern sublocation | Action template filter prevents targeting |
| Settlement demotes below tavern threshold | Conditional tavern dissolves; static tavern persists |

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — all thresholds named constants |
| 2 | Inspectability | PASS — social encounter traces include tavern context |
| 3 | Determinism | PASS — tavern seeding uses seeded PRNG; name generation deterministic |
| 4 | Fail-soft | PASS — see table above |
| 5 | Narrative > mechanics | PASS — tavern encounters prioritize flavorful prose; culture-aware naming |
| 6 | Additive | PASS — new sublocation type, new templates, new action. No existing systems modified destructively. |
| 7 | Performance | PASS — sublocation check is O(1) per agent; density bonus is O(agents at location) |

---

## Implementation Order for CC

1. Define tavern sublocation type in `SUBTYPE_SUBLOCATION_MAP` (sublocation.ts)
2. Add tavern name generation (new file or extend sublocation.ts)
3. Extend `EncounterTemplate` type with `sublocationTypeFilter` (encounter.ts)
4. Add 10 tavern encounter templates (social-encounter-content.ts or new file)
5. Add tavern social boost + parent colocation + density bonus (socialEncounterGeneration.ts)
6. Add tavern concept art (sublocation-concept-art.ts)
7. Add "Sanctify Tavern" divine action template
8. Add conditional tavern scaling for city/capital (phaseSublocations.ts)
9. Extend social encounter trace with tavern fields
10. Write tests: tavern seeding, social boost, template filtering, name generation
11. Smoke test via CLI: `tick 30`, check `status` for tavern presence, `encounters` for tavern templates
12. Visual verification: `?view=game&seeded` — check LocationView shows taverns

## Estimated Scope

~2-3 CC sessions. Bulk of work is content authoring (10 encounter templates with prose).
