// scripts/generate-vault.ts
import fs from "fs";
import path from "path";

// scripts/validate-world-model.ts
function validateWorldModel(model) {
  const errors = [];
  const warnings = [];
  const nodeIds = /* @__PURE__ */ new Set();
  if (!model || typeof model !== "object") {
    errors.push("Model is not a valid object");
    return { errors, warnings };
  }
  if (!model.meta || !Array.isArray(model.nodes) || !Array.isArray(model.edges)) {
    errors.push("Model missing required properties: meta, nodes, or edges");
    return { errors, warnings };
  }
  for (const node of model.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }
  for (const node of model.nodes) {
    if (!node.name || !node.category || !node.description) {
      errors.push(
        `Node ${node.id} missing required field (name/category/description)`
      );
    }
  }
  const allowedCategories = new Set(model.meta.categories);
  for (const node of model.nodes) {
    if (!allowedCategories.has(node.category)) {
      errors.push(
        `Node ${node.id} has unknown category: ${node.category}`
      );
    }
  }
  for (const edge of model.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge source not found: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge target not found: ${edge.target}`);
    }
  }
  const relTypeIds = new Set(
    model.nodes.filter((n) => n.category === "relationship-type").map((n) => n.id)
  );
  for (const edge of model.edges) {
    if (!relTypeIds.has(edge.type)) {
      errors.push(`Edge type "${edge.type}" not found in relationship types`);
    }
  }
  const connectedIds = /* @__PURE__ */ new Set();
  for (const edge of model.edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }
  for (const node of model.nodes) {
    if (!connectedIds.has(node.id) && node.category !== "relationship-type") {
      warnings.push(`Orphan node (no edges): ${node.id}`);
    }
  }
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
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("validate-world-model.ts")) {
  const fs2 = await import("fs");
  const path2 = await import("path");
  const modelPath = path2.join(process.cwd(), "src/data/world-model.json");
  const modelData = JSON.parse(fs2.readFileSync(modelPath, "utf-8"));
  const result = validateWorldModel(modelData);
  if (result.errors.length > 0) {
    console.error("ERRORS:");
    result.errors.forEach((e) => console.error("  \u274C", e));
  }
  if (result.warnings.length > 0) {
    console.warn("WARNINGS:");
    result.warnings.forEach((w) => console.warn("  \u26A0\uFE0F", w));
  }
  if (result.errors.length === 0) {
    console.log(
      `\u2705 Validation passed! (${result.warnings.length} warning${result.warnings.length !== 1 ? "s" : ""})`
    );
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

// scripts/generate-vault.ts
var OWNED_FOLDERS = [
  "Cosmology",
  "Traits",
  "Domains",
  "Actions",
  "Magic",
  "Actors",
  "Cultures",
  "Terrain",
  "Locations",
  "World Objects",
  "Relationships"
];
var CATEGORY_FOLDER_MAP = {
  "foundation-sphere": "Cosmology",
  "creation-sphere": "Cosmology",
  "magic-tradition": (props) => {
    const school = props.school || "General";
    return `Magic/${school}`;
  },
  terrain: "Terrain",
  reach: "Domains",
  "action-template": (props) => {
    const reach = props.reach || "";
    if (!reach) return "Actions/Misc";
    const reachName = reach.replace("reach.", "").split(".")[0];
    const capitalized = reachName.charAt(0).toUpperCase() + reachName.slice(1);
    return `Actions/${capitalized}`;
  },
  "trait-innate": "Traits/Innate",
  "trait-mastery": "Traits/Mastery",
  "trait-reputation": "Traits/Reputation",
  "trait-scar": "Traits/Scar",
  "trait-condition": "Traits/Condition",
  "trait-destiny": "Traits/Destiny",
  "actor-type": "Actors",
  culture: "Cultures",
  "region-type": "Locations/Regions",
  "location-type": "Locations/Locations",
  "sublocation-type": "Locations/Sub-locations",
  "artifact-class": "World Objects/Artifacts",
  "enchantment-class": "World Objects/Enchantments",
  "resource-type": "World Objects/Resources",
  "relationship-type": "Relationships"
};
function getCategoryFolder(category, properties = {}) {
  const mapping = CATEGORY_FOLDER_MAP[category];
  if (typeof mapping === "function") {
    return mapping(properties);
  }
  return mapping || "Misc";
}
function formatYamlValue(value) {
  if (value === null || value === void 0) {
    return "null";
  }
  if (typeof value === "string") {
    if (/[:\[\]{}#&*!|>'"@`]/.test(value)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((v) => typeof v === "string" && v.length < 30)) {
      return `[${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    return "\n  " + value.map((v) => `- ${formatYamlValue(v)}`).join("\n  ");
  }
  if (typeof value === "object") {
    return `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
  }
  return String(value);
}
function generateYamlFrontmatter(node, properties = {}) {
  const frontmatter = {
    tags: [node.category, "generated"],
    aliases: [node.name],
    id: node.id,
    category: node.category,
    status: "complete",
    "last-generated": (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  for (const [key, value] of Object.entries(properties)) {
    frontmatter[key] = value;
  }
  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    const formattedValue = formatYamlValue(value);
    if (formattedValue.includes("\n")) {
      lines.push(`${key}:${formattedValue}`);
    } else {
      lines.push(`${key}: ${formattedValue}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}
function formatProperties(properties) {
  if (!properties || Object.keys(properties).length === 0) {
    return "";
  }
  const lines = ["## Properties"];
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "object") {
      lines.push(`- **${key}**: ${JSON.stringify(value)}`);
    } else if (Array.isArray(value)) {
      lines.push(`- **${key}**: ${value.join(", ")}`);
    } else {
      lines.push(`- **${key}**: ${value}`);
    }
  }
  return lines.join("\n");
}
function generateNoteContent(node, edges, nodeMap, relTypeMap = /* @__PURE__ */ new Map()) {
  const outgoing = edges.filter((e) => e.source === node.id);
  const incoming = edges.filter((e) => e.target === node.id);
  const frontmatter = generateYamlFrontmatter(node, node.properties || {});
  const lines = [frontmatter, "", `# ${node.name}`, ""];
  if (node.description) {
    lines.push(`> ${node.description}`, "");
  }
  const properties = formatProperties(node.properties || {});
  if (properties) {
    lines.push(properties, "");
  }
  if (outgoing.length > 0) {
    lines.push("## Outgoing Connections");
    for (const edge of outgoing) {
      const target = nodeMap.get(edge.target);
      const relType = relTypeMap.get(edge.type);
      const relName = relType?.name || edge.type;
      const targetName = target?.name || edge.target;
      lines.push(
        `- **${relName}** \u2192 [[${targetName}]] (w: ${edge.weight})`
      );
    }
    lines.push("");
  }
  if (incoming.length > 0) {
    lines.push("## Incoming Connections");
    for (const edge of incoming) {
      const source = nodeMap.get(edge.source);
      const relType = relTypeMap.get(edge.type);
      const relName = relType?.name || edge.type;
      const sourceName = source?.name || edge.source;
      lines.push(
        `- **${relName}** \u2190 [[${sourceName}]] (w: ${edge.weight})`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}
async function generateVault(options = {}) {
  const {
    dryRun = false,
    validate = true,
    vaultRoot = process.cwd()
  } = options;
  const modelPath = path.join(vaultRoot, "src/data/world-model.json");
  const modelData = JSON.parse(
    fs.readFileSync(modelPath, "utf-8")
  );
  if (validate) {
    const result = validateWorldModel(modelData);
    if (result.errors.length > 0) {
      console.error("Validation failed:");
      result.errors.forEach((e) => console.error(`  \u274C ${e}`));
      process.exit(1);
    }
    if (result.warnings.length > 0) {
      console.warn("Warnings:");
      result.warnings.forEach((w) => console.warn(`  \u26A0\uFE0F ${w}`));
    }
  }
  const nodeMap = /* @__PURE__ */ new Map();
  const relTypeMap = /* @__PURE__ */ new Map();
  const nodesByCategory = {};
  for (const node of modelData.nodes) {
    nodeMap.set(node.id, node);
    if (node.category === "relationship-type") {
      relTypeMap.set(node.id, node);
    }
    if (!nodesByCategory[node.category]) {
      nodesByCategory[node.category] = [];
    }
    nodesByCategory[node.category].push(node);
  }
  const generatedFiles = [];
  let noteCount = 0;
  for (const node of modelData.nodes) {
    const folder = getCategoryFolder(node.category, node.properties);
    const filename = `${node.id}.md`;
    const notePath = path.join(vaultRoot, folder, filename);
    const content = generateNoteContent(
      node,
      modelData.edges,
      nodeMap,
      relTypeMap
    );
    generatedFiles.push({ path: notePath, content });
    noteCount++;
  }
  console.log(`
\u{1F4CB} Vault Generation Plan`);
  console.log(`Validating and generating ${noteCount} notes (Index.md is LLM-maintained)`);
  console.log(`Total files to write: ${generatedFiles.length}`);
  if (dryRun) {
    console.log("\n(--dry-run: no files written)");
    generatedFiles.forEach(({ path: p }) => console.log(`  \u{1F4C4} ${p}`));
    return;
  }
  console.log("\nCleaning owned folders...");
  for (const folder of OWNED_FOLDERS) {
    const folderPath = path.join(vaultRoot, folder);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    fs.mkdirSync(folderPath, { recursive: true });
  }
  console.log("Writing files...");
  for (const { path: filePath, content } of generatedFiles) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  }
  console.log(`\u2705 Vault generated: ${generatedFiles.length} files written`);
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("generate-vault.ts")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const validate = !args.includes("--no-validate");
  generateVault({
    dryRun,
    validate,
    vaultRoot: process.cwd()
  }).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
export {
  generateNoteContent,
  generateVault,
  getCategoryFolder
};
