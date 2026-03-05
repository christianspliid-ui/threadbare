# Content Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all domain model content into `src/data/world-model.json`, build a vault generator that produces the Obsidian visualization, and refactor the engine to load from the unified file.

**Architecture:** Single unified graph JSON → TypeScript generator script → Obsidian vault. Engine taxonomy loader refactored to consume the new file. See `Docs/plans/2026-03-05-content-pipeline-design.md` for full design rationale.

**Tech Stack:** TypeScript, Vitest (tests), ts-node (scripts), Obsidian Markdown + YAML frontmatter

---

## Task 1: Create the world-model.json schema and consolidation script

**Files:**
- Create: `src/types/worldModel.ts`
- Create: `scripts/consolidate-taxonomy.ts`
- Create: `src/data/world-model.json`
- Test: `src/engine/__tests__/worldModel.test.ts`

**Step 1: Write the failing test — world model type and loading**

```typescript
// src/engine/__tests__/worldModel.test.ts
import { describe, it, expect } from "vitest";
import worldModel from "../../data/world-model.json";

describe("world-model.json", () => {
  it("has meta with version and category list", () => {
    expect(worldModel.meta).toBeDefined();
    expect(worldModel.meta.version).toBe("1.0.0");
    expect(worldModel.meta.categories).toContain("creation-sphere");
    expect(worldModel.meta.categories).toContain("foundation-sphere");
    expect(worldModel.meta.categories).toContain("magic-tradition");
    expect(worldModel.meta.categories).toContain("terrain");
    expect(worldModel.meta.categories).toContain("relationship-type");
  });

  it("contains all nodes from previous taxonomy files", () => {
    const creationSpheres = worldModel.nodes.filter(
      (n) => n.category === "creation-sphere"
    );
    expect(creationSpheres.length).toBe(8); // Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy

    const foundationSpheres = worldModel.nodes.filter(
      (n) => n.category === "foundation-sphere"
    );
    expect(foundationSpheres.length).toBeGreaterThanOrEqual(4); // Chaos, Order, Light, Darkness (+ Shadow)

    const magicTraditions = worldModel.nodes.filter(
      (n) => n.category === "magic-tradition"
    );
    expect(magicTraditions.length).toBeGreaterThan(0);

    const terrainBiomes = worldModel.nodes.filter(
      (n) => n.category === "terrain"
    );
    expect(terrainBiomes.length).toBeGreaterThan(0);
  });

  it("contains all edges from previous taxonomy", () => {
    expect(worldModel.edges.length).toBeGreaterThan(0);
    // Spot-check a known edge
    const forceToAir = worldModel.edges.find(
      (e) => e.source === "creation.force" && e.target === "magic.air"
    );
    expect(forceToAir).toBeDefined();
    expect(forceToAir!.type).toBe("rel.generates");
  });

  it("has no duplicate node IDs", () => {
    const ids = worldModel.nodes.map((n) => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all edge sources and targets reference existing nodes", () => {
    const nodeIds = new Set(worldModel.nodes.map((n) => n.id));
    for (const edge of worldModel.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it("all edge types reference existing relationship-type nodes", () => {
    const relTypes = new Set(
      worldModel.nodes
        .filter((n) => n.category === "relationship-type")
        .map((n) => n.id)
    );
    for (const edge of worldModel.edges) {
      expect(relTypes.has(edge.type)).toBe(true);
    }
  });

  it("meta.nodeCount matches actual node count", () => {
    expect(worldModel.meta.nodeCount).toBe(worldModel.nodes.length);
  });

  it("meta.edgeCount matches actual edge count", () => {
    expect(worldModel.meta.edgeCount).toBe(worldModel.edges.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: FAIL — `world-model.json` doesn't exist yet

**Step 3: Create the WorldModel types**

```typescript
// src/types/worldModel.ts
import { TaxonomyNode, TaxonomyEdge } from "./taxonomy";

export interface WorldModelMeta {
  version: string;
  generated: string;
  nodeCount: number;
  edgeCount: number;
  categories: string[];
}

export interface WorldModel {
  meta: WorldModelMeta;
  nodes: TaxonomyNode[];
  edges: TaxonomyEdge[];
}
```

**Step 4: Write the consolidation script**

```typescript
// scripts/consolidate-taxonomy.ts
// Reads the existing 6 taxonomy JSON files and combines them into world-model.json
// Run: npx ts-node scripts/consolidate-taxonomy.ts

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "../src/data/taxonomy");
const OUTPUT = path.join(__dirname, "../src/data/world-model.json");

// Load existing files
const creationSpheres = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "creation-spheres.json"), "utf-8")
);
const foundationSpheres = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "foundation-spheres.json"), "utf-8")
);
const magicTraditions = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "magic-traditions.json"), "utf-8")
);
const terrainBiomes = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "terrain-biomes.json"), "utf-8")
);
const relationshipTypes = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "relationship-types.json"), "utf-8")
);
const edges = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "edges.json"), "utf-8")
);

const allNodes = [
  ...foundationSpheres,
  ...creationSpheres,
  ...magicTraditions,
  ...terrainBiomes,
  ...relationshipTypes,
];

const categories = [...new Set(allNodes.map((n: any) => n.category))];

const worldModel = {
  meta: {
    version: "1.0.0",
    generated: new Date().toISOString(),
    nodeCount: allNodes.length,
    edgeCount: edges.length,
    categories,
  },
  nodes: allNodes,
  edges,
};

fs.writeFileSync(OUTPUT, JSON.stringify(worldModel, null, 2));
console.log(
  `✅ world-model.json written: ${allNodes.length} nodes, ${edges.length} edges`
);
```

**Step 5: Run the consolidation script**

Run: `npx ts-node scripts/consolidate-taxonomy.ts`
Expected: `✅ world-model.json written: N nodes, M edges`

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/types/worldModel.ts src/data/world-model.json scripts/consolidate-taxonomy.ts src/engine/__tests__/worldModel.test.ts
git commit -m "feat: create unified world-model.json from existing taxonomy files"
```

---

## Task 2: Refactor taxonomy.ts to load from world-model.json

**Files:**
- Modify: `src/engine/taxonomy.ts`
- Modify: `src/engine/__tests__/taxonomy.test.ts` (if exists, otherwise the existing tests)

**Step 1: Check that existing taxonomy tests pass before refactoring**

Run: `npx vitest run src/engine/__tests__/taxonomy.test.ts`
Expected: ALL PASS (baseline)

**Step 2: Refactor taxonomy.ts**

Replace the 6 imports with a single import of `world-model.json`. The `loadTaxonomy` function returns nodes and edges from the unified file. All query functions remain unchanged.

```typescript
// src/engine/taxonomy.ts — refactored
import worldModel from "../data/world-model.json";
import { TaxonomyNode, TaxonomyEdge, TaxonomyGraph } from "../types/taxonomy";

export async function loadTaxonomy(): Promise<TaxonomyGraph> {
  return {
    nodes: worldModel.nodes as TaxonomyNode[],
    edges: worldModel.edges as TaxonomyEdge[],
  };
}

// All other functions remain exactly the same — they operate on TaxonomyGraph
// getNodesByCategory, getNodeById, getEdgesForNode, etc.
```

**Step 3: Run existing tests to verify nothing broke**

Run: `npx vitest run src/engine/__tests__/taxonomy.test.ts`
Expected: ALL PASS (same as baseline)

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — no other modules should break since the TaxonomyGraph shape is unchanged

**Step 5: Commit**

```bash
git add src/engine/taxonomy.ts
git commit -m "refactor: taxonomy.ts loads from unified world-model.json"
```

---

## Task 3: Extract traits from vault notes into world-model.json

**Files:**
- Create: `scripts/extract-vault-content.ts`
- Modify: `src/data/world-model.json` (add trait nodes + edges)
- Test: `src/engine/__tests__/worldModel.test.ts` (extend)

This task reads the Obsidian vault's trait notes and converts them into nodes + edges in world-model.json. It's a one-time extraction script — after this, JSON is the source of truth.

**Step 1: Write the failing test — trait nodes exist**

Add to `worldModel.test.ts`:
```typescript
it("contains trait nodes for all 6 categories", () => {
  const traitCategories = [
    "trait-innate", "trait-mastery", "trait-reputation",
    "trait-scar", "trait-condition", "trait-destiny",
  ];
  for (const cat of traitCategories) {
    const nodes = worldModel.nodes.filter((n) => n.category === cat);
    expect(nodes.length).toBeGreaterThan(0);
  }
});

it("trait nodes have required properties", () => {
  const dragonborn = worldModel.nodes.find(
    (n) => n.id === "trait.innate.dragonborn"
  );
  expect(dragonborn).toBeDefined();
  expect(dragonborn!.properties.validNodes).toBeDefined();
  expect(dragonborn!.properties.effects).toBeDefined();
});

it("trait-to-reach boost edges exist", () => {
  const boostEdges = worldModel.edges.filter((e) => e.type === "rel.boosts");
  expect(boostEdges.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: FAIL — no trait nodes yet

**Step 3: Write the vault content extraction script**

The script reads each trait note from the vault, parses the structured content (effects, valid nodes, acquisition), and creates nodes + edges. It appends to the existing world-model.json.

```typescript
// scripts/extract-vault-content.ts
// Reads Obsidian vault notes and extracts structured content into world-model.json
// Run: npx ts-node scripts/extract-vault-content.ts

// This script:
// 1. Reads trait notes from TheFantasyWorldSimulator/Traits/**/*.md
// 2. Parses frontmatter + structured sections
// 3. Creates TaxonomyNode objects for each trait
// 4. Creates edges (boosts, valid-for)
// 5. Merges into existing world-model.json
// 6. Also extracts: action templates, reaches, actor types
```

**Implementation note:** The extraction will need to parse each vault note's Markdown. Since vault notes follow a consistent template (## Properties, ## Effects, ## Acquisition, ## Links), we can use simple regex/string parsing rather than a full Markdown AST. The script should be conservative — if it can't parse a note cleanly, it logs a warning and skips it rather than generating bad data.

**Step 4: Run the extraction script and verify**

Run: `npx ts-node scripts/extract-vault-content.ts`
Expected: Console output listing extracted nodes and edges

**Step 5: Run tests**

Run: `npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add scripts/extract-vault-content.ts src/data/world-model.json src/engine/__tests__/worldModel.test.ts
git commit -m "feat: extract traits, actions, reaches from vault into world-model.json"
```

---

## Task 4: Add reaches, action templates, and actor types to world-model.json

**Files:**
- Modify: `scripts/extract-vault-content.ts` (extend extraction)
- Modify: `src/data/world-model.json`
- Modify: `src/engine/__tests__/worldModel.test.ts`

**Step 1: Write failing tests for reaches and actions**

```typescript
it("contains all 9 reaches", () => {
  const reaches = worldModel.nodes.filter((n) => n.category === "reach");
  expect(reaches.length).toBe(9);
  const names = reaches.map((n) => n.name);
  expect(names).toContain("Iron");
  expect(names).toContain("Gold");
  expect(names).toContain("Shadow");
});

it("contains action templates per reach", () => {
  const actions = worldModel.nodes.filter(
    (n) => n.category === "action-template"
  );
  expect(actions.length).toBeGreaterThan(0);
  // Each action has a crudType
  for (const action of actions) {
    expect(["CREATE", "READ", "UPDATE", "DELETE"]).toContain(
      action.properties.crudType
    );
  }
});

it("action templates have belongs-to edges to reaches", () => {
  const belongsTo = worldModel.edges.filter(
    (e) => e.type === "rel.belongs-to"
  );
  expect(belongsTo.length).toBeGreaterThan(0);
});

it("reaches have aligned-with edges to spheres", () => {
  const aligned = worldModel.edges.filter(
    (e) => e.type === "rel.aligned-with"
  );
  expect(aligned.length).toBe(9); // one per reach
});

it("contains actor types", () => {
  const actors = worldModel.nodes.filter((n) => n.category === "actor-type");
  expect(actors.length).toBeGreaterThanOrEqual(4);
  const names = actors.map((n) => n.name);
  expect(names).toContain("Individual");
  expect(names).toContain("God");
});
```

**Step 2: Run tests to verify failure**

Run: `npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: FAIL

**Step 3: Extend extraction script to handle reaches, actions, actors**

Parse `TheFantasyWorldSimulator/Domains/*.md` for reaches, `TheFantasyWorldSimulator/Actions/*.md` for action templates (extracting CRUD type from section headers), and `TheFantasyWorldSimulator/Actors/` (from Index.md actor type list).

Also add the new relationship-type nodes (`rel.boosts`, `rel.valid-for`, `rel.belongs-to`, `rel.aligned-with`, etc.) so edge type validation passes.

**Step 4: Run extraction and tests**

Run: `npx ts-node scripts/extract-vault-content.ts && npx vitest run src/engine/__tests__/worldModel.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add scripts/extract-vault-content.ts src/data/world-model.json src/engine/__tests__/worldModel.test.ts
git commit -m "feat: add reaches, action templates, actor types to world-model.json"
```

---

## Task 5: Add location types and culture placeholders

**Files:**
- Modify: `scripts/extract-vault-content.ts`
- Modify: `src/data/world-model.json`
- Modify: `src/engine/__tests__/worldModel.test.ts`

**Step 1: Write failing tests**

```typescript
it("contains region, location, and sublocation type nodes", () => {
  const regions = worldModel.nodes.filter((n) => n.category === "region-type");
  expect(regions.length).toBeGreaterThan(0);

  const locations = worldModel.nodes.filter(
    (n) => n.category === "location-type"
  );
  expect(locations.length).toBeGreaterThan(0);

  const sublocations = worldModel.nodes.filter(
    (n) => n.category === "sublocation-type"
  );
  expect(sublocations.length).toBeGreaterThan(0);
});

it("location types have terrain-valid edges", () => {
  const terrainValid = worldModel.edges.filter(
    (e) => e.type === "rel.terrain-valid"
  );
  expect(terrainValid.length).toBeGreaterThan(0);
});

it("contains culture nodes", () => {
  const cultures = worldModel.nodes.filter((n) => n.category === "culture");
  expect(cultures.length).toBeGreaterThan(0);
});

it("contains contains-type edges for location hierarchy", () => {
  const containsType = worldModel.edges.filter(
    (e) => e.type === "rel.contains-type"
  );
  expect(containsType.length).toBeGreaterThan(0);
});
```

**Step 2: Run tests to verify failure**

**Step 3: Add location and culture content**

Since location types and cultures don't exist as detailed vault notes yet, this step creates them directly in the JSON based on the design doc's category schemas. These are template/archetype nodes (e.g., "Settlement", "Fortress", "Temple" — not specific generated instances).

Create a set of representative location types, sub-location types, region types, and 2-3 placeholder cultures to establish the pattern.

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add scripts/extract-vault-content.ts src/data/world-model.json src/engine/__tests__/worldModel.test.ts
git commit -m "feat: add location types, region types, sublocation types, culture placeholders"
```

---

## Task 6: Graph validation script

**Files:**
- Create: `scripts/validate-world-model.ts`
- Test: `scripts/__tests__/validate.test.ts`

**Step 1: Write the failing test**

```typescript
// scripts/__tests__/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateWorldModel } from "../validate-world-model";
import worldModel from "../../src/data/world-model.json";

describe("validateWorldModel", () => {
  it("returns no errors for the current world-model.json", () => {
    const result = validateWorldModel(worldModel as any);
    expect(result.errors).toEqual([]);
  });

  it("detects missing edge targets", () => {
    const bad = {
      meta: { version: "1.0.0", generated: "", nodeCount: 1, edgeCount: 1, categories: [] },
      nodes: [{ id: "a", name: "A", category: "test", description: "t", properties: {} }],
      edges: [{ source: "a", target: "nonexistent", type: "rel.underpins", weight: 1 }],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("nonexistent");
  });

  it("detects duplicate node IDs", () => {
    const bad = {
      meta: { version: "1.0.0", generated: "", nodeCount: 2, edgeCount: 0, categories: [] },
      nodes: [
        { id: "a", name: "A", category: "test", description: "t", properties: {} },
        { id: "a", name: "A2", category: "test", description: "t", properties: {} },
      ],
      edges: [],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("warns on orphan nodes", () => {
    const orphaned = {
      meta: { version: "1.0.0", generated: "", nodeCount: 2, edgeCount: 1, categories: [] },
      nodes: [
        { id: "a", name: "A", category: "test", description: "t", properties: {} },
        { id: "b", name: "B", category: "test", description: "t", properties: {} },
        { id: "c", name: "C", category: "test", description: "t", properties: {} },
      ],
      edges: [{ source: "a", target: "b", type: "rel.underpins", weight: 1 }],
    };
    const result = validateWorldModel(orphaned);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("c");
  });
});
```

**Step 2: Run test to verify failure**

**Step 3: Implement validation**

```typescript
// scripts/validate-world-model.ts
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateWorldModel(model: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set<string>();

  // Check for duplicate IDs
  for (const node of model.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Check edge referential integrity
  for (const edge of model.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge source not found: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge target not found: ${edge.target}`);
    }
  }

  // Check for orphan nodes
  const connectedIds = new Set<string>();
  for (const edge of model.edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  for (const node of model.nodes) {
    if (!connectedIds.has(node.id) && node.category !== "relationship-type") {
      warnings.push(`Orphan node (no edges): ${node.id}`);
    }
  }

  // Check meta counts
  if (model.meta.nodeCount !== model.nodes.length) {
    errors.push(
      `meta.nodeCount (${model.meta.nodeCount}) !== actual (${model.nodes.length})`
    );
  }
  if (model.meta.edgeCount !== model.edges.length) {
    errors.push(
      `meta.edgeCount (${model.meta.edgeCount}) !== actual (${model.edges.length})`
    );
  }

  return { errors, warnings };
}
```

**Step 4: Run tests**

**Step 5: Add validation to the consolidation/extraction scripts**

Add a validation pass at the end of `extract-vault-content.ts` that runs `validateWorldModel` and fails if there are errors.

**Step 6: Commit**

```bash
git add scripts/validate-world-model.ts scripts/__tests__/validate.test.ts
git commit -m "feat: world-model.json validation script with referential integrity checks"
```

---

## Task 7: Build the vault generator script

**Files:**
- Create: `scripts/generate-vault.ts`
- Create: `scripts/__tests__/generateVault.test.ts`

**Step 1: Write failing test — note generation from a node**

```typescript
// scripts/__tests__/generateVault.test.ts
import { describe, it, expect } from "vitest";
import { generateNoteContent, getCategoryFolder } from "../generate-vault";

describe("generateNoteContent", () => {
  const sampleNode = {
    id: "creation.force",
    name: "Force",
    category: "creation-sphere",
    description: "Physics, motion, kinetic energy.",
    properties: { color: "#ff6b6b", physicalPhenomena: ["Wind", "Gravity"] },
  };

  const sampleEdges = [
    { source: "creation.force", target: "magic.air", type: "rel.generates", weight: 1.0 },
    { source: "foundation.chaos", target: "creation.force", type: "rel.underpins", weight: 0.8 },
  ];

  const nodeMap = new Map([
    ["creation.force", sampleNode],
    ["magic.air", { id: "magic.air", name: "Air Magic", category: "magic-tradition", description: "", properties: {} }],
    ["foundation.chaos", { id: "foundation.chaos", name: "Chaos", category: "foundation-sphere", description: "", properties: {} }],
  ]);

  const relTypeMap = new Map([
    ["rel.generates", { name: "Generates" }],
    ["rel.underpins", { name: "Underpins" }],
  ]);

  it("generates valid markdown with frontmatter", () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain("---");
    expect(md).toContain("id: creation.force");
    expect(md).toContain("category: creation-sphere");
    expect(md).toContain("tags: [creation-sphere, generated]");
  });

  it("includes wikilinks for outgoing edges", () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain("[[Air Magic]]");
    expect(md).toContain("Generates");
  });

  it("includes wikilinks for incoming edges", () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain("[[Chaos]]");
    expect(md).toContain("Underpins");
  });
});

describe("getCategoryFolder", () => {
  it("maps creation-sphere to Cosmology", () => {
    expect(getCategoryFolder("creation-sphere", {})).toBe("Cosmology");
  });

  it("maps trait-innate to Traits/Innate", () => {
    expect(getCategoryFolder("trait-innate", {})).toBe("Traits/Innate");
  });

  it("maps action-template to Actions/{reach-name}", () => {
    expect(
      getCategoryFolder("action-template", { reach: "reach.iron" })
    ).toBe("Actions/Iron");
  });
});
```

**Step 2: Run test to verify failure**

**Step 3: Implement the generator**

The generator reads `world-model.json`, iterates nodes, generates markdown content per node, and writes files to the vault directory. Key functions:

- `generateNoteContent(node, edges, nodeMap, relTypeMap)` → markdown string
- `getCategoryFolder(category, properties)` → folder path
- `generateIndex(nodes, edges)` → Index.md content
- `main()` → orchestrates: validate → clean owned folders → generate notes → generate index

**Step 4: Run tests**

**Step 5: Run the generator for real**

Run: `npx ts-node scripts/generate-vault.ts --dry-run`
Expected: Lists all files that would be written, no actual writes

Run: `npx ts-node scripts/generate-vault.ts`
Expected: Generated vault files in the Obsidian vault directory

**Step 6: Verify in Obsidian**

Open the vault in Obsidian and check:
- Graph view shows connected nodes
- Wikilinks resolve correctly
- Frontmatter is valid YAML
- Tags are applied

**Step 7: Commit**

```bash
git add scripts/generate-vault.ts scripts/__tests__/generateVault.test.ts
git commit -m "feat: vault generator script — produces Obsidian notes from world-model.json"
```

---

## Task 8: Delete old taxonomy files and final cleanup

**Files:**
- Delete: `src/data/taxonomy/creation-spheres.json`
- Delete: `src/data/taxonomy/foundation-spheres.json`
- Delete: `src/data/taxonomy/magic-traditions.json`
- Delete: `src/data/taxonomy/terrain-biomes.json`
- Delete: `src/data/taxonomy/relationship-types.json`
- Delete: `src/data/taxonomy/edges.json`
- Modify: `src/engine/taxonomy.ts` (remove old imports if any linger)

**Step 1: Run full test suite before deletion**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Delete old files**

```bash
rm -rf src/data/taxonomy/
```

**Step 3: Run full test suite after deletion**

Run: `npx vitest run`
Expected: ALL PASS — taxonomy.ts already loads from world-model.json

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old taxonomy JSON files — world-model.json is now sole source"
```

---

## Task 9: Generate the vault and verify graph integrity

**Step 1: Run the full pipeline**

```bash
npx ts-node scripts/validate-world-model.ts
npx ts-node scripts/generate-vault.ts
```

**Step 2: Check validation output**

Expected: 0 errors. Warnings for orphan nodes should be reviewed — each one is either:
- An intentional placeholder (artifact/enchantment/resource classes) → acceptable
- A gap in the model → file as a TODO for content authoring

**Step 3: Open Obsidian and verify graph view**

Check that the graph shows meaningful clusters:
- Cosmology cluster (spheres → magic traditions)
- Terrain cluster (biomes → location types)
- Domain cluster (reaches → action templates → traits)
- Culture connections (cultures → magic → reaches → terrain)

**Step 4: Update CLAUDE.md changelog**

Add entry documenting the content pipeline completion.

**Step 5: Update Notion backlog**

Mark content pipeline tasks as complete.

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: content pipeline complete — world-model.json + vault generator operational"
```
