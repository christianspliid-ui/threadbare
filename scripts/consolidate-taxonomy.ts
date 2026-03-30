/**
 * Consolidate Taxonomy Script
 *
 * Reads all 6 taxonomy JSON files and produces a unified world-model.json
 * with a meta section containing version, generation timestamp, counts, and categories.
 *
 * Usage: npx ts-node scripts/consolidate-taxonomy.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Node {
  id: string;
  name: string;
  category: string;
  description: string;
  properties: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  weight?: number;
  properties?: Record<string, any>;
}

interface WorldModelMeta {
  version: string;
  generated: string;
  nodeCount: number;
  edgeCount: number;
  categories: string[];
}

interface WorldModel {
  meta: WorldModelMeta;
  nodes: Node[];
  edges: Edge[];
}

// File paths
const dataDir = path.join(__dirname, "../src/data/taxonomy");
const outputFile = path.join(__dirname, "../src/data/world-model.json");

const fileList = [
  "relationship-types.json",
  "foundation-spheres.json",
  "creation-spheres.json",
  "magic-traditions.json",
  "terrain-biomes.json",
];

function main() {
  console.log("Starting taxonomy consolidation...");

  const allNodes: Node[] = [];
  const nodeIds = new Set<string>();
  let duplicateCount = 0;

  // Load all nodes from all files
  for (const file of fileList) {
    const filePath = path.join(dataDir, file);
    console.log(`Reading ${file}...`);

    const content = fs.readFileSync(filePath, "utf-8");
    const data: Node[] = JSON.parse(content);

    for (const node of data) {
      if (nodeIds.has(node.id)) {
        console.warn(`  WARNING: Duplicate node ID "${node.id}" in ${file}`);
        duplicateCount++;
      } else {
        allNodes.push(node);
        nodeIds.add(node.id);
      }
    }

    console.log(`  Loaded ${data.length} nodes from ${file}`);
  }

  // Load edges
  const edgesFile = path.join(dataDir, "edges.json");
  console.log(`Reading edges.json...`);
  const edgesContent = fs.readFileSync(edgesFile, "utf-8");
  const edges: Edge[] = JSON.parse(edgesContent);
  console.log(`  Loaded ${edges.length} edges`);

  // Extract unique categories
  const categories = Array.from(new Set(allNodes.map((n) => n.category))).sort();

  // Create world model
  const worldModel: WorldModel = {
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

  // Write world model
  fs.writeFileSync(outputFile, JSON.stringify(worldModel, null, 2));
  console.log(`\nConsolidation complete!`);
  console.log(`  Total nodes: ${allNodes.length}`);
  console.log(`  Total edges: ${edges.length}`);
  console.log(`  Categories: ${categories.join(", ")}`);
  if (duplicateCount > 0) {
    console.log(`  Duplicates found (and skipped): ${duplicateCount}`);
  }
  console.log(`  Output: ${outputFile}`);
}

main();
