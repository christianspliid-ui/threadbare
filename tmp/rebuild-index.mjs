// scripts/rebuild-index.ts
import fs from "fs";
import path from "path";
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  "src",
  "scripts",
  "dist",
  ".git",
  ".claude",
  ".agents",
  ".planning",
  ".superpowers",
  ".ai-codex",
  ".cache",
  ".pytest_cache",
  "Docs",
  "Design",
  "public",
  "coverage"
]);
var INFRASTRUCTURE_FILES = /* @__PURE__ */ new Set([
  "Index.md",
  "CLAUDE.md",
  "Vault Log.md"
]);
var EXCLUDE_FILES = /* @__PURE__ */ new Set([
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md"
]);
var GROUP_ORDER = [
  "Cosmology",
  "Domains",
  "Actions",
  "Actors",
  "Cultures",
  "Magic",
  "Terrain",
  "Locations",
  "Traits",
  "Relationships",
  "World Objects",
  "Brainstorms"
];
function extractSummary(content) {
  let body = content;
  if (body.startsWith("---")) {
    const endIdx = body.indexOf("---", 3);
    if (endIdx !== -1) {
      body = body.slice(endIdx + 3);
    }
  }
  const lines = body.split("\n");
  let pastHeading = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      pastHeading = true;
      continue;
    }
    if (line.startsWith(">")) {
      const text = line.replace(/^>\s*/, "").trim();
      if (text) return truncate(text, 200);
      continue;
    }
    if (pastHeading && !line.startsWith("-") && !line.startsWith("|")) {
      return truncate(line, 200);
    }
  }
  return "";
}
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "\u2026";
}
function collectMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}
function isVaultFolder(name) {
  if (name.startsWith(".")) return false;
  if (SKIP_DIRS.has(name)) return false;
  return true;
}
async function rebuildIndex(options = {}) {
  const { dryRun = false, vaultRoot = process.cwd() } = options;
  console.log(`Scanning vault at: ${vaultRoot}`);
  const topLevelEntries = fs.readdirSync(vaultRoot, { withFileTypes: true });
  const vaultFolders = [];
  for (const entry of topLevelEntries) {
    if (entry.isDirectory() && isVaultFolder(entry.name)) {
      const mdFiles = collectMarkdownFiles(path.join(vaultRoot, entry.name));
      if (mdFiles.length > 0) {
        vaultFolders.push(entry.name);
      }
    }
  }
  console.log(`Found vault folders: ${vaultFolders.join(", ")}`);
  const pages = [];
  for (const folder of vaultFolders) {
    const folderPath = path.join(vaultRoot, folder);
    const mdFiles = collectMarkdownFiles(folderPath);
    for (const filePath of mdFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const filename = path.basename(filePath, ".md");
      const title = extractTitle(content) || filename;
      const summary = extractSummary(content);
      pages.push({
        filePath,
        wikiName: filename,
        title,
        summary,
        group: folder
      });
    }
  }
  const rootMdFiles = topLevelEntries.filter(
    (e) => e.isFile() && e.name.endsWith(".md") && !INFRASTRUCTURE_FILES.has(e.name) && !EXCLUDE_FILES.has(e.name)
  ).map((e) => e.name);
  for (const filename of rootMdFiles) {
    const filePath = path.join(vaultRoot, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    const baseName = path.basename(filename, ".md");
    const title = extractTitle(content) || baseName;
    const summary = extractSummary(content);
    pages.push({
      filePath,
      wikiName: baseName,
      title,
      summary,
      group: "_root"
    });
  }
  console.log(`Found ${pages.length} vault pages across ${vaultFolders.length} folders`);
  const groups = /* @__PURE__ */ new Map();
  for (const page of pages) {
    const existing = groups.get(page.group) || [];
    existing.push(page);
    groups.set(page.group, existing);
  }
  for (const [, groupPages] of groups) {
    groupPages.sort((a, b) => a.title.localeCompare(b.title));
  }
  const orderedGroups = [];
  for (const name of GROUP_ORDER) {
    if (groups.has(name)) {
      orderedGroups.push(name);
    }
  }
  const remaining = [...groups.keys()].filter((k) => k !== "_root" && !orderedGroups.includes(k)).sort();
  orderedGroups.push(...remaining);
  const lines = [];
  lines.push("---");
  lines.push("tags: [index, hub, kb-infrastructure]");
  lines.push("aliases: [Domain Model, Knowledge Base Index]");
  lines.push("---");
  lines.push("");
  lines.push("# The Fantasy World Simulator \u2014 Knowledge Base");
  lines.push("");
  lines.push("> LLM-maintained index of all vault pages. Read this first to navigate the domain model.");
  lines.push("");
  lines.push("## How to Use This Vault");
  lines.push("");
  lines.push("- **LLM agents:** Read this index to find relevant pages, then drill into them via wikilinks");
  lines.push("- **Humans:** Browse via folder structure or Obsidian graph view");
  lines.push("- See [[Vault Log]] for recent changes");
  lines.push("- See [[CLAUDE]] for project context and architectural decisions");
  lines.push("");
  let totalPages = 0;
  for (const groupName of orderedGroups) {
    const groupPages = groups.get(groupName);
    totalPages += groupPages.length;
    lines.push(`## ${groupName} (${groupPages.length} pages)`);
    lines.push("");
    for (const page of groupPages) {
      const summaryPart = page.summary ? ` \u2014 ${page.summary}` : "";
      lines.push(`- [[${page.title}]]${summaryPart}`);
    }
    lines.push("");
  }
  const rootPages = groups.get("_root");
  if (rootPages && rootPages.length > 0) {
    totalPages += rootPages.length;
    lines.push(`## Other (${rootPages.length} pages)`);
    lines.push("");
    for (const page of rootPages) {
      const summaryPart = page.summary ? ` \u2014 ${page.summary}` : "";
      lines.push(`- [[${page.title}]]${summaryPart}`);
    }
    lines.push("");
  }
  lines.push("## Infrastructure");
  lines.push("");
  lines.push("- [[Vault Log]] \u2014 Chronological record of vault changes");
  lines.push("- [[Index]] \u2014 This file");
  lines.push("- [[CLAUDE]] \u2014 Project context and agent instructions");
  lines.push("");
  const output = lines.join("\n");
  const outputPath = path.join(vaultRoot, "Index.md");
  console.log("");
  console.log(`Index generation plan:`);
  console.log(`  Groups: ${orderedGroups.length}`);
  console.log(`  Total pages indexed: ${totalPages}`);
  console.log(`  Output: ${outputPath}`);
  if (dryRun) {
    console.log("");
    console.log("(--dry-run: no files written)");
    console.log("");
    console.log("--- Preview ---");
    console.log(output);
    return;
  }
  fs.writeFileSync(outputPath, output, "utf-8");
  console.log(`
Index.md written (${totalPages} pages indexed)`);
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("rebuild-index.ts") || process.argv[1]?.endsWith("rebuild-index.mjs")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  rebuildIndex({
    dryRun,
    vaultRoot: process.cwd()
  }).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
export {
  rebuildIndex
};
