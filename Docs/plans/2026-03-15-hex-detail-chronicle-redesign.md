# Hex Detail Chronicle Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hex detail view's data-label layout with a narrative chronicle (Land / Soul / People / Ruins layers), a collapsible stats sidebar, and inline location/soul cards — making every hex feel like a living place instead of a game menu.

**Architecture:** The existing three-panel layout (HexFlavorPanel | HexZoomView | HexPoiPanel) becomes a two-panel layout (collapsible sidebar | scrollable chronicle). The chronicle reuses and extends the existing prose resolver system for woven vignettes. New data (region, historical culture) flows through an extended `useHexZoomData` hook. Resources are deferred to a future sprint (backlog item).

**Tech Stack:** React 18 + TypeScript, existing prose resolver system, existing CSS custom properties, vitest for testing.

**Design Reference:** `Design/hex-detail-hybrid.html` — the approved mockup.

---

## Scope Decisions

### In scope (this plan)
1. New `HexChronicle` component replacing HexFlavorPanel + HexPoiPanel
2. Collapsible `HexSidebar` component (hex minimap, sphere bars, region info, quick nav)
3. Extended `useHexZoomData` to query region + historical culture data
4. New `getHexRegionData()` engine function
5. New `historicalCultureResolver` + `regionResolver` prose resolvers
6. Prose content tables for historical culture and region vignettes
7. Inline location cards and soul cards with archetype tags
8. Active encounter display ("Stirrings") inline in People layer
9. Hero banner with hex visualization and region title
10. Layer-by-layer narrative with staggered fade-in animation
11. GameView layout update (three-column → two-column + sidebar)

### Deferred to backlog (not in this plan)
- **Resources system** — Needs full design: resource types, seeding, terrain→resource mapping, economy integration. Too large for this PR. → Add Notion backlog item.
- **Resource icons** — Depends on resources system. → Add Notion backlog item.
- **Prose resolver for resources** — Depends on resources system.
- **`--font-prose` CSS variable** — The mockup uses EB Garamond for prose; the codebase currently only has `--font-display` (Cinzel) and `--font-body` (Alegreya Sans). → Add as part of Task 2 (small addition).

---

## Task 1: Engine — `getHexRegionData()` query function

**Files:**
- Create: `src/engine/hexRegion.ts`
- Create: `src/engine/__tests__/hexRegion.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/engine/__tests__/hexRegion.test.ts
import { describe, it, expect } from 'vitest';
import { getHexRegionData } from '../hexRegion';
import { WorldGraph } from '../../types/graph';
// Use createTestGraph helper from existing test utils

describe('getHexRegionData', () => {
  it('returns null when no regionId is provided', () => {
    const graph = createTestGraph();
    const result = getHexRegionData(graph, undefined);
    expect(result).toBeNull();
  });

  it('returns region name and feature type', () => {
    const graph = createTestGraph();
    // Add region node
    graph.addNode({ id: 'region_0', type: 'region', name: 'The Storm-Born Reach',
      properties: { featureType: 'plains', hexCount: 14, centerCol: 8, centerRow: 6 } });
    const result = getHexRegionData(graph, 'region_0');
    expect(result?.regionName).toBe('The Storm-Born Reach');
    expect(result?.featureType).toBe('plains');
    expect(result?.hexCount).toBe(14);
  });

  it('returns historical culture data when region has historical belongs_to edge', () => {
    const graph = createTestGraph();
    graph.addNode({ id: 'region_0', type: 'region', name: 'The Storm-Born Reach',
      properties: { featureType: 'plains', hexCount: 14 } });
    graph.addNode({ id: 'hist_culture_0', type: 'actor', name: 'The Star-Readers',
      properties: { actorType: 'culture', cultureEra: 'historical',
        ruinDescriptors: ['shattered observatories', 'cracked lenses'],
        legacyFlavor: 'They read the heavens until the heavens read them back.',
        templateName: 'The Star-Readers',
        cultureIdentity: { foundationBias: 'chaos', veneratedSpheres: ['time', 'energy'] } } });
    graph.addEdge({ source: 'region_0', target: 'hist_culture_0', type: 'belongs_to',
      properties: { cultureLayer: 'historical', culturalStrength: 1.0 } });

    const result = getHexRegionData(graph, 'region_0');
    expect(result?.historicalCulture).toBeDefined();
    expect(result?.historicalCulture?.name).toBe('The Star-Readers');
    expect(result?.historicalCulture?.ruinDescriptors).toContain('shattered observatories');
    expect(result?.historicalCulture?.legacyFlavor).toContain('heavens');
  });

  it('returns null historicalCulture when region has no historical edge', () => {
    const graph = createTestGraph();
    graph.addNode({ id: 'region_0', type: 'region', name: 'Wild Reaches',
      properties: { featureType: 'forest', hexCount: 6 } });
    const result = getHexRegionData(graph, 'region_0');
    expect(result?.historicalCulture).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/hexRegion.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/engine/hexRegion.ts
import type { WorldGraph } from '../types/graph';
import type { SphereName } from '../types';

export interface HexRegionData {
  regionId: string;
  regionName: string;
  featureType: string;
  hexCount: number;
  historicalCulture: HistoricalCultureSummary | null;
}

export interface HistoricalCultureSummary {
  id: string;
  name: string;
  templateName: string;
  foundationBias: string;
  veneratedSpheres: SphereName[];
  ruinDescriptors: string[];
  legacyFlavor: string;
}

/**
 * Given a regionId (from HexTile.regionId), fetch the region's display data
 * including any historical culture that once claimed it.
 */
export function getHexRegionData(
  graph: WorldGraph,
  regionId: string | undefined,
): HexRegionData | null {
  if (!regionId) return null;

  const regionNode = graph.getNode(regionId);
  if (!regionNode || regionNode.type !== 'region') return null;

  const props = regionNode.properties ?? {};

  // Find historical culture via belongs_to edge with cultureLayer: 'historical'
  let historicalCulture: HistoricalCultureSummary | null = null;
  const outEdges = graph.getOutgoingEdges(regionId, 'belongs_to');
  const histEdge = outEdges.find(
    e => e.properties?.cultureLayer === 'historical',
  );

  if (histEdge) {
    const histNode = graph.getNode(histEdge.target);
    if (histNode) {
      const hProps = histNode.properties ?? {};
      const identity = hProps.cultureIdentity ?? {};
      historicalCulture = {
        id: histNode.id,
        name: histNode.name,
        templateName: hProps.templateName ?? histNode.name,
        foundationBias: identity.foundationBias ?? 'unknown',
        veneratedSpheres: identity.veneratedSpheres ?? [],
        ruinDescriptors: hProps.ruinDescriptors ?? [],
        legacyFlavor: hProps.legacyFlavor ?? '',
      };
    }
  }

  return {
    regionId,
    regionName: regionNode.name,
    featureType: props.featureType ?? 'unknown',
    hexCount: props.hexCount ?? 0,
    historicalCulture,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/hexRegion.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/hexRegion.ts src/engine/__tests__/hexRegion.test.ts
git commit -m "feat(engine): add getHexRegionData for region + historical culture queries"
```

---

## Task 2: Data layer — Extend `useHexZoomData` with region data

**Files:**
- Modify: `src/components/Game/hooks/useHexZoomData.ts`
- Modify: `src/engine/hexZoom.ts` (add regionId to return types if needed)

**Step 1: Add regionId extraction**

In `useHexZoomData`, after the existing queries, add:

```typescript
// Extract regionId from the focused hex tile
const regionId = useMemo(() => {
  if (!focusedHex) return undefined;
  const tile = tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row);
  return tile?.regionId;
}, [tiles, focusedHex]);

// Fetch region + historical culture data
const hexRegionData = useMemo(() => {
  if (!regionId || !graph) return null;
  return getHexRegionData(graph, regionId);
}, [graph, regionId]);
```

Add `hexRegionData` to the hook's return object.

**Step 2: Add `--font-prose` CSS variable**

In `src/index.css`, add to the `:root` block:

```css
--font-prose: 'EB Garamond', 'Cormorant Garamond', serif;
```

Add the Google Fonts import for EB Garamond in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet">
```

**Step 3: Run existing tests to verify no breakage**

Run: `npx vitest run src/components/Game/hooks/`
Expected: All existing tests PASS

**Step 4: Commit**

```bash
git add src/components/Game/hooks/useHexZoomData.ts src/index.css index.html
git commit -m "feat(data): extend useHexZoomData with region and historical culture data"
```

---

## Task 3: Prose — Historical culture and region resolvers + content

**Files:**
- Modify: `src/data/prose-layer-content.ts` (add HISTORICAL_CULTURE_PROSE, REGION_ETYMOLOGY_PROSE)
- Modify: `src/engine/proseResolvers.ts` (add historicalCultureResolver, regionEtymologyResolver)
- Modify: `src/engine/proseGenerator.ts` (register new resolvers)
- Create: `src/engine/__tests__/proseResolvers-historical.test.ts`

**Step 1: Write prose content tables**

Add to `src/data/prose-layer-content.ts`:

```typescript
/** Historical culture ruin descriptions — keyed by template foundation bias */
export const HISTORICAL_CULTURE_PROSE: Record<string, string[]> = {
  order: [
    'Before the current inhabitants, this land was shaped by {histCulture} — builders of precision and devotion whose {ruinDescriptor} still stand in silent testimony to an age of meticulous craft.',
    'The {histCulture} once held this territory, their ordered ways visible in the {ruinDescriptor} that dot the landscape — remnants too well-made to crumble entirely.',
  ],
  chaos: [
    'Before the current people came, {histCulture} claimed this land — a people of restless ambition whose {ruinDescriptor} remain as monuments to brilliance that could not sustain itself.',
    'This was once the domain of {histCulture}, whose chaotic genius left behind {ruinDescriptor} — structures that even in ruin seem to defy expectation.',
  ],
  light: [
    '{histCulture} once illuminated this region, their open ways preserved in the {ruinDescriptor} that remain — built to be seen, to welcome, to endure as testament.',
    'The land remembers {histCulture}, whose devotion to revelation left behind {ruinDescriptor} — places that still seem to wait for congregations that will never return.',
  ],
  darkness: [
    '{histCulture} once held this territory in secret, their hidden ways preserved in the {ruinDescriptor} that lie half-buried — places designed to conceal as much as they sheltered.',
    'Before the current age, {histCulture} claimed this land. Their {ruinDescriptor} endure in shadowed hollows, built to keep their mysteries even in abandonment.',
  ],
  unknown: [
    'A vanished people once shaped this land. Their {ruinDescriptor} endure — monuments to a civilization that left no name the current inhabitants remember.',
  ],
};

/** Region name etymology — explains why the region has its current name */
export const REGION_ETYMOLOGY_PROSE: string[] = [
  'The locals call this expanse {regionName} — a name that echoes {histCulture} speech, though few remember the original tongue.',
  'This territory is known as {regionName}, a name that has outlived the {histCulture} who first spoke it, worn smooth by generations of mispronunciation.',
  '{regionName} — the name itself is a fossil, a {histCulture} phrase that survived the culture that coined it.',
  'The region\'s name, {regionName}, derives from {histCulture} cartography — their maps outlasted their mapmakers.',
];

/** Legacy flavor (epitaph) — standalone closing lines for the Ruins layer */
// These come directly from the historical culture template's legacyFlavor field.
// No content table needed — use the field directly.
```

**Step 2: Write the failing resolver tests**

```typescript
// src/engine/__tests__/proseResolvers-historical.test.ts
import { describe, it, expect } from 'vitest';
import { historicalCultureResolver, regionEtymologyResolver } from '../proseResolvers';
// Test with graph fixtures that include region → historical culture edges

describe('historicalCultureResolver', () => {
  it('returns empty array when location has no region', () => {
    const graph = createTestGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Test', properties: {} });
    expect(historicalCultureResolver('loc_0', graph, 12345)).toEqual([]);
  });

  it('returns prose layer when location has region with historical culture', () => {
    const graph = createTestGraphWithHistoricalCulture();
    const layers = historicalCultureResolver('loc_0', graph, 12345);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].category).toBe('history');
    expect(layers[0].text).toContain('Star-Readers');
  });
});

describe('regionEtymologyResolver', () => {
  it('returns etymology prose linking region name to historical culture', () => {
    const graph = createTestGraphWithHistoricalCulture();
    const layers = regionEtymologyResolver('loc_0', graph, 12345);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0].text).toContain('Storm-Born Reach');
  });
});
```

**Step 3: Implement the resolvers**

Add to `src/engine/proseResolvers.ts`:

```typescript
export const historicalCultureResolver: ProseResolver = (nodeId, graph, seed) => {
  // Walk: location → hex tile regionId → region node → historical culture
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const regionId = node.properties?.regionId;
  if (!regionId) return [];

  const regionNode = graph.getNode(regionId);
  if (!regionNode) return [];

  const histEdge = graph.getOutgoingEdges(regionId, 'belongs_to')
    .find(e => e.properties?.cultureLayer === 'historical');
  if (!histEdge) return [];

  const histNode = graph.getNode(histEdge.target);
  if (!histNode) return [];

  const hProps = histNode.properties ?? {};
  const identity = hProps.cultureIdentity ?? {};
  const bias = identity.foundationBias ?? 'unknown';
  const ruinDescs = hProps.ruinDescriptors ?? [];

  const templates = HISTORICAL_CULTURE_PROSE[bias] ?? HISTORICAL_CULTURE_PROSE.unknown;
  const rng = mulberry32(hashSeed(seed, nodeId));
  const template = templates[Math.floor(rng() * templates.length)];
  const ruinDesc = ruinDescs.length > 0
    ? ruinDescs[Math.floor(rng() * ruinDescs.length)]
    : 'weathered ruins';

  const text = template
    .replace(/\{histCulture\}/g, histNode.name)
    .replace(/\{ruinDescriptor\}/g, ruinDesc);

  return [{
    text,
    priority: 30,
    category: 'history' as const,
    source: 'historicalCultureResolver',
  }];
};
```

Register in `proseGenerator.ts` by adding to `LOCATION_RESOLVERS`.

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/proseResolvers-historical.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/prose-layer-content.ts src/engine/proseResolvers.ts src/engine/proseGenerator.ts src/engine/__tests__/proseResolvers-historical.test.ts
git commit -m "feat(prose): add historical culture and region etymology resolvers"
```

---

## Task 4: Component — `HexSidebar` (collapsible stats panel)

**Files:**
- Create: `src/components/Game/HexSidebar.tsx`
- Create: `src/components/Game/__tests__/HexSidebar.test.tsx`

**Step 1: Write component test**

```typescript
// src/components/Game/__tests__/HexSidebar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexSidebar } from '../HexSidebar';

describe('HexSidebar', () => {
  const defaultProps = {
    terrain: 'plateau' as const,
    hexCol: 8, hexRow: 6,
    sphereInfluence: { energy: 0.72, time: 0.35, force: 0.15 },
    regionData: { regionId: 'r0', regionName: 'The Storm-Born Reach', featureType: 'plains', hexCount: 14, historicalCulture: null },
    locations: [],
    agentsByLocation: {},
    lineOfSight: 'full' as const,
  };

  it('renders sphere bars', () => {
    render(<HexSidebar {...defaultProps} />);
    expect(screen.getByText('Energy')).toBeTruthy();
    expect(screen.getByText('strong')).toBeTruthy();
  });

  it('renders region name', () => {
    render(<HexSidebar {...defaultProps} />);
    expect(screen.getByText('The Storm-Born Reach')).toBeTruthy();
  });

  it('toggles collapsed state', () => {
    render(<HexSidebar {...defaultProps} />);
    const toggle = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(toggle);
    // After collapse, sidebar content should be hidden
    expect(screen.getByTestId('sidebar-content')).toHaveStyle('opacity: 0');
  });
});
```

**Step 2: Implement HexSidebar**

Build the collapsible sidebar component following `Design/hex-detail-hybrid.html`. Key features:
- Collapsed state shows icon strip (terrain glyph, sphere pips, location/soul count icons)
- Expanded state shows: mini hex SVG, sphere influence bars with labels (strong/faint/trace), region name + hex count + historical culture mention, quick-nav links to locations/souls
- Uses existing CSS variables (`--bg-deep`, `--border-subtle`, `--font-display`, `--text-*`)
- `React.memo` wrapped (per UI patterns doc)
- Toggle button with `aria-label` and `aria-expanded`

Sphere intensity labels: threshold mapping from numeric value:
```typescript
const SPHERE_LABEL: Record<string, string> = {};
function getSphereLabel(value: number): string {
  if (value >= 0.6) return 'strong';
  if (value >= 0.3) return 'faint';
  return 'trace';
}
```

**Step 3: Run tests**

Run: `npx vitest run src/components/Game/__tests__/HexSidebar.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/Game/HexSidebar.tsx src/components/Game/__tests__/HexSidebar.test.tsx
git commit -m "feat(ui): add collapsible HexSidebar with sphere bars and region info"
```

---

## Task 5: Component — `HexChronicle` (main narrative scroll)

**Files:**
- Create: `src/components/Game/HexChronicle.tsx`
- Create: `src/components/Game/__tests__/HexChronicle.test.tsx`

This is the largest task. It replaces both HexFlavorPanel and HexPoiPanel with a single scrollable narrative.

**Step 1: Write component tests**

```typescript
// src/components/Game/__tests__/HexChronicle.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexChronicle } from '../HexChronicle';

describe('HexChronicle', () => {
  it('renders all four layer markers', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Land')).toBeTruthy();
    expect(screen.getByText('The Soul')).toBeTruthy();
    expect(screen.getByText('The People')).toBeTruthy();
    expect(screen.getByText('The Ruins')).toBeTruthy();
  });

  it('renders region name in hero', () => {
    render(<HexChronicle {...makeTestProps({ regionName: 'The Storm-Born Reach' })} />);
    expect(screen.getByText('The Storm-Born Reach')).toBeTruthy();
  });

  it('renders inline location cards', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Forge of Sorrow')).toBeTruthy();
  });

  it('renders inline soul cards with archetype tag', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText('The Hollow King')).toBeTruthy();
    expect(screen.getByText('Reluctant King')).toBeTruthy();
  });

  it('hides Ruins layer when no historical culture exists', () => {
    render(<HexChronicle {...makeTestProps({ historicalCulture: null })} />);
    expect(screen.queryByText('The Ruins')).toBeNull();
  });

  it('renders exploration hooks in Ruins layer', () => {
    render(<HexChronicle {...makeTestProps()} />);
    expect(screen.getByText(/not been fully explored/)).toBeTruthy();
  });

  it('renders active encounters as Stirrings', () => {
    render(<HexChronicle {...makeTestProps({ activeEncounters: [mockEncounter] })} />);
    expect(screen.getByText('Stirring')).toBeTruthy();
  });
});
```

**Step 2: Implement HexChronicle**

Structure follows the hybrid mockup exactly. Sub-components extracted inline:

```
HexChronicle
├── HeroSection (hex SVG banner + region title + subtitle)
├── LandLayer (terrain vignette + resource tags placeholder)
├── SoulLayer (sphere prose + sphere pills)
├── PeopleLayer
│   ├── Culture vignette
│   ├── Faction vignette
│   ├── LocationCard (inline, per location)
│   ├── SoulCard (inline, per agent, with archetype tag)
│   └── EventBlock (per active encounter)
└── RuinsLayer (conditional — only if historical culture exists)
    ├── Historical culture vignette
    ├── Region etymology
    ├── Epitaph (legacyFlavor centered)
    └── ExplorationHook (gold diamond glyph items)
```

**Props shape:**
```typescript
interface HexChronicleProps {
  terrain: TerrainType;
  hexCol: number;
  hexRow: number;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  regionData: HexRegionData | null;
  onLocationClick: (locationId: string) => void;
  onLocationDoubleClick: (locationId: string) => void;
  onAgentClick: (agentId: string) => void;
  // Prose inputs
  graph: WorldGraph;
  seed: number;
  // Encounters
  encountersByLocation: Record<string, EncounterProgress[]>;
}
```

**Key implementation details:**

- **Terrain vignette:** Reuse `TERRAIN_FLAVOR` from HexFlavorPanel (move to shared constant or import)
- **Soul layer:** Use `generateEntityProse()` for sphere description, OR compose manually from `SPHERE_LOCATION_PROSE` content table selecting the dominant + secondary spheres
- **People layer:** Use `generateEntityProse()` for culture/faction description, embed `LocationCard` and `SoulCard` inline between prose paragraphs
- **SoulCard:** Call `getAgentInfoCard()` to get archetype name and cooperation strategy, render as tag + one-line flavor
- **Ruins layer:** Only render if `regionData?.historicalCulture` is non-null. Use the new `HISTORICAL_CULTURE_PROSE` templates + `REGION_ETYMOLOGY_PROSE` + direct `legacyFlavor` for epitaph
- **Exploration hooks:** For now, generate 1-2 hooks from ruin descriptors using simple templates. Future: driven by encounter system.
- **Animation:** CSS `@keyframes fadeInUp` with `animation-delay` per layer (0.05s, 0.15s, 0.25s, 0.35s)
- **Resource tags:** Render a "Coming soon" placeholder OR omit entirely (resources are deferred). Recommend: omit to keep it clean.

**Step 3: Run tests**

Run: `npx vitest run src/components/Game/__tests__/HexChronicle.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/Game/HexChronicle.tsx src/components/Game/__tests__/HexChronicle.test.tsx
git commit -m "feat(ui): add HexChronicle narrative component with four-layer design"
```

---

## Task 6: Component — Inline cards (LocationCard, SoulCard, EventBlock)

**Files:**
- Create: `src/components/Game/chronicle/LocationCard.tsx`
- Create: `src/components/Game/chronicle/SoulCard.tsx`
- Create: `src/components/Game/chronicle/EventBlock.tsx`
- Create: `src/components/Game/chronicle/ExplorationHook.tsx`
- Create: `src/components/Game/chronicle/__tests__/cards.test.tsx`

These are small, focused sub-components used by HexChronicle. Extract them for testability and reuse.

**LocationCard props:**
```typescript
interface LocationCardProps {
  name: string;
  subtype: string;
  glyph: string;
  agentCount: number;
  flavorText: string;
  onClick: () => void;
  onDoubleClick: () => void;
}
```

**SoulCard props:**
```typescript
interface SoulCardProps {
  name: string;
  locationName: string;
  sphereColor: string;
  archetypeName?: string;
  flavorText: string;
  onClick: () => void;
}
```

**EventBlock props:**
```typescript
interface EventBlockProps {
  label: string; // "Stirring" or "Crisis" etc.
  text: string;
}
```

**ExplorationHook props:**
```typescript
interface ExplorationHookProps {
  text: string;
}
```

Styling follows the hybrid mockup:
- LocationCard: `--bg-raised` background, `--border-dim` border, hover → `--accent-gold-dim` border
- SoulCard: Same treatment, sphere-colored pip, archetype tag in `--text-muted` uppercase
- EventBlock: `--bg-surface` background, gold left border accent
- ExplorationHook: gold `⟐` glyph, italic, left border

**Step 1: Write tests for all four sub-components**

**Step 2: Implement all four**

**Step 3: Run tests**

Run: `npx vitest run src/components/Game/chronicle/__tests__/cards.test.tsx`

**Step 4: Commit**

```bash
git add src/components/Game/chronicle/
git commit -m "feat(ui): add inline LocationCard, SoulCard, EventBlock, ExplorationHook components"
```

---

## Task 7: Integration — Update GameView layout

**Files:**
- Modify: `src/components/Game/GameView.tsx` (lines ~397-457: hex-zoom view level)
- Modify: `src/components/Game/HexBreadcrumb.tsx` (add region name as primary title)

**Step 1: Update HexBreadcrumb to show region name**

Change the breadcrumb title from `"Plateau (8, 6)"` to region name with terrain/coords as subtitle:

```tsx
// Before:
<h2>{terrainLabel} ({hexCol}, {hexRow})</h2>

// After:
<h2>{regionName || `${terrainLabel} (${hexCol}, ${hexRow})`}</h2>
<span className="subtitle">
  {regionName ? `${terrainLabel} at ${hexCol}, ${hexRow}` : ''}
  {dominantCulture && ` · ${dominantCulture.cultureName}`}
  {dominantFaction && ` · ${dominantFaction.factionName}`}
</span>
```

Add `regionName?: string` to `HexBreadcrumbProps`.

**Step 2: Replace three-column layout with two-column**

In GameView, the hex-zoom section currently renders:

```tsx
<div className="flex-1 flex overflow-hidden">
  <HexFlavorPanel ... />     {/* 220px left */}
  <HexZoomView ... />        {/* flex-1 center */}
  <HexPoiPanel ... />        {/* 220px right */}
</div>
```

Replace with:

```tsx
<div className="flex-1 flex overflow-hidden">
  <HexSidebar
    terrain={hexTerrain}
    hexCol={focusedHex.col}
    hexRow={focusedHex.row}
    sphereInfluence={hexSphereInfluence}
    regionData={hexRegionData}
    locations={hexLocations}
    agentsByLocation={hexAgentsByLocation}
    lineOfSight={hexLineOfSight}
  />
  <HexChronicle
    terrain={hexTerrain}
    hexCol={focusedHex.col}
    hexRow={focusedHex.row}
    lineOfSight={hexLineOfSight}
    sphereInfluence={hexSphereInfluence}
    cultures={hexCultures}
    factions={hexFactions}
    locations={hexLocations}
    agentsByLocation={hexAgentsByLocation}
    regionData={hexRegionData}
    onLocationClick={handleLocationClick}
    onLocationDoubleClick={handleLocationDoubleClickWithClose}
    onAgentClick={handleAgentSelect}
    graph={gameState.graph}
    seed={gameState.seed}
    encountersByLocation={{}}
  />
</div>
```

**Step 3: Pass hexRegionData from useHexZoomData**

Add `hexRegionData` to the destructured return from `useHexZoomData`.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests PASS. Some HexFlavorPanel/HexPoiPanel tests may need updating if they test integration points.

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx src/components/Game/HexBreadcrumb.tsx
git commit -m "feat(ui): integrate HexChronicle + HexSidebar into GameView layout"
```

---

## Task 8: CSS — Animations and chronicle-specific styles

**Files:**
- Modify: `src/index.css`

**Step 1: Add chronicle animation keyframes and utility classes**

```css
/* Chronicle layer fade-in */
@keyframes chronicle-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.chronicle-layer {
  animation: chronicle-fade-in 0.4s ease both;
}
.chronicle-layer:nth-child(1) { animation-delay: 0.05s; }
.chronicle-layer:nth-child(2) { animation-delay: 0.15s; }
.chronicle-layer:nth-child(3) { animation-delay: 0.25s; }
.chronicle-layer:nth-child(4) { animation-delay: 0.35s; }

/* Exploration hook diamond glyph */
.exploration-hook::before {
  content: '⟐ ';
  color: var(--accent-gold);
  font-style: normal;
}

/* Epitaph centered quote styling */
.epitaph-text {
  text-align: center;
  position: relative;
  padding: 12px 24px;
}
.epitaph-text::before,
.epitaph-text::after {
  content: '';
  display: block;
  width: 40px;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 auto 10px;
}
.epitaph-text::after {
  margin: 10px auto 0;
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat(css): add chronicle animations, exploration hook and epitaph styles"
```

---

## Task 9: Cleanup — Remove old panels, update tests

**Files:**
- Remove import of `HexFlavorPanel` from GameView (keep file for now — mark deprecated)
- Remove import of `HexPoiPanel` from GameView (keep file for now — mark deprecated)
- Update any integration tests that reference the old layout

**Step 1: Remove old imports and verify no other files reference them**

Search for `HexFlavorPanel` and `HexPoiPanel` imports across the codebase. If only GameView imports them, remove the imports. Keep the files with a `@deprecated` JSDoc tag — they can be deleted in a future cleanup.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old HexFlavorPanel/HexPoiPanel from GameView, mark deprecated"
```

---

## Task 10: Backlog items — Add to Notion

**Files:** None (Notion updates only)

Add the following items to the Notion Development Backlog:

1. **Resources System** — Design and implement hex/location resources (stone, water, grazing, fish, timber, ore, etc.). Includes: resource type definitions, terrain→resource seeding, resource node creation in worldSeed, prose resolver for resources, resource tags in HexChronicle Land layer, resource icons. *Prerequisite for completing the Land layer design.*

2. **Resource Icons** — Design small icon set for hex resources. Could use emoji initially (🪨💧🌾🐟🪵⛏️) or custom SVG icons matching Threadbare aesthetic. *Depends on Resources System.*

3. **Exploration Hook Generation** — Currently exploration hooks in the Ruins layer use hardcoded templates from ruin descriptors. Design a proper system that generates hooks from: ruin locations, unexplored POIs, encounter seeds, sphere anomalies, historical artifacts. *Enhances the Ruins layer.*

4. **Soul Layer Prose Enrichment** — The Soul layer could be richer with sphere-specific interaction prose (e.g., how Energy and Time interact in the same hex). Design cross-sphere prose templates. *Enhances the Soul layer.*

---

## Task 11: Documentation — Update docs and changelog

**Files:**
- Modify: `Docs/ui-patterns.md` (add HexChronicle pattern)
- Modify: `Docs/changelog.md`

**Step 1: Add HexChronicle section to UI patterns**

Add a new section documenting:
- The four-layer structure (Land / Soul / People / Ruins)
- Inline card pattern (LocationCard, SoulCard, EventBlock, ExplorationHook)
- Collapsible sidebar pattern
- Chronicle animation convention
- How region data flows through useHexZoomData → HexChronicle

**Step 2: Add changelog entry**

```
| 2026-03-15 | UI, Engine | Hex detail redesigned as narrative chronicle with four layers (Land, Soul, People, Ruins), collapsible sidebar, inline cards, region names, historical culture vignettes | UX overhaul — hex detail should feel like a living place |
```

**Step 3: Commit**

```bash
git add Docs/ui-patterns.md Docs/changelog.md
git commit -m "docs: add HexChronicle patterns and changelog entry"
```

---

## Task 12: Verification — Full build + visual check

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run production build**

Run: `npx vite build`
Expected: Build succeeds

**Step 4: Visual verification**

User runs `npm run dev` on their machine and verifies:
- Clicking a hex shows the Chronicle layout
- Region name appears in breadcrumb and hero
- Four layers render with staggered animation
- Sidebar collapses/expands
- Inline location and soul cards are clickable
- Historical culture vignette appears when region has one
- Exploration hooks display with gold diamond glyph

---

## Dependency Graph

```
Task 1 (engine: getHexRegionData)
  └── Task 2 (data: extend useHexZoomData)
        └── Task 7 (integration: GameView layout)

Task 3 (prose: resolvers + content)
  └── Task 5 (component: HexChronicle) ← uses prose system

Task 4 (component: HexSidebar) ─────┐
Task 5 (component: HexChronicle) ────┤
Task 6 (component: inline cards) ────┤
Task 8 (CSS: animations) ───────────┤
                                     └── Task 7 (integration)
                                           └── Task 9 (cleanup)
                                                 └── Task 10 (backlog)
                                                       └── Task 11 (docs)
                                                             └── Task 12 (verify)
```

**Parallelizable:** Tasks 1, 3, 4, 6, 8 can all run in parallel (no dependencies on each other). Tasks 2 and 5 depend on 1 and 3 respectively. Task 7 depends on 2, 4, 5, 6, 8.
