// scripts/enhance-frontmatter.ts
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
var SCAN_DIRS = ["Systems", "Brainstorms"];
var STANDALONE_FILES = [
  "CLAUDE.md",
  "Systems Overview.md",
  "Agent Teams Guide.md",
  "Product Strategy.md",
  "Build Status.md",
  "Tiered Backstory Generation.md"
];
var STATUS_STUB_THRESHOLD = 20;
var STATUS_COMPLETE_THRESHOLD = 50;
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function getFileMtime(filePath) {
  const stat = fs.statSync(filePath);
  return formatDate(stat.mtime);
}
function getGitCreatedDate(filePath) {
  try {
    const result = execSync(
      `git log --follow --diff-filter=A --format=%ai -- "${filePath}"`,
      { encoding: "utf-8", timeout: 1e4 }
    ).trim();
    if (result) {
      const datePart = result.split("\n").pop().split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
  } catch {
  }
  return getFileMtime(filePath);
}
function inferStatus(bodyLineCount) {
  if (bodyLineCount < STATUS_STUB_THRESHOLD) return "stub";
  if (bodyLineCount >= STATUS_COMPLETE_THRESHOLD) return "complete";
  return "draft";
}
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") {
    return { fields: {}, body: content, hadFrontmatter: false, orderedKeys: [] };
  }
  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closingIdx = i;
      break;
    }
  }
  if (closingIdx === -1) {
    return { fields: {}, body: content, hadFrontmatter: false, orderedKeys: [] };
  }
  const yamlLines = lines.slice(1, closingIdx);
  const body = lines.slice(closingIdx + 1).join("\n");
  const fields = {};
  const orderedKeys = [];
  let currentKey = "";
  let currentValue = "";
  for (const line of yamlLines) {
    if (/^\s+/.test(line) && currentKey) {
      currentValue += "\n" + line;
      continue;
    }
    if (currentKey) {
      fields[currentKey] = currentValue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      currentKey = line.slice(0, colonIdx).trim();
      currentValue = line.slice(colonIdx + 1).trim();
      orderedKeys.push(currentKey);
    } else {
      currentKey = "";
      currentValue = "";
    }
  }
  if (currentKey) {
    fields[currentKey] = currentValue;
  }
  return { fields, body, hadFrontmatter: true, orderedKeys };
}
function serializeFrontmatter(fields, orderedKeys) {
  const lines = ["---"];
  const written = /* @__PURE__ */ new Set();
  for (const key of orderedKeys) {
    if (key in fields) {
      const value = fields[key];
      if (value.includes("\n")) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
      written.add(key);
    }
  }
  for (const key of Object.keys(fields)) {
    if (!written.has(key)) {
      const value = fields[key];
      if (value.includes("\n")) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }
  lines.push("---");
  return lines.join("\n");
}
function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(content);
  const addedFields = [];
  const fields = { ...parsed.fields };
  const orderedKeys = [...parsed.orderedKeys];
  const bodyLines = parsed.body.replace(/^\n+/, "").split("\n");
  const bodyLineCount = bodyLines.filter((l) => l.trim().length > 0).length;
  if (!("status" in fields)) {
    fields["status"] = inferStatus(bodyLineCount);
    addedFields.push(`status: ${fields["status"]}`);
  }
  if (!("updated" in fields)) {
    fields["updated"] = getFileMtime(filePath);
    addedFields.push(`updated: ${fields["updated"]}`);
  }
  if (!("created" in fields)) {
    fields["created"] = getGitCreatedDate(filePath);
    addedFields.push(`created: ${fields["created"]}`);
  }
  if (addedFields.length === 0) {
    return null;
  }
  const frontmatter = serializeFrontmatter(fields, orderedKeys);
  const newContent = parsed.hadFrontmatter ? frontmatter + "\n" + parsed.body : frontmatter + "\n\n" + content;
  return { filePath, addedFields, newContent };
}
function collectFiles(vaultRoot) {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(vaultRoot, dir);
    if (!fs.existsSync(dirPath)) {
      console.warn(`  Warning: directory not found: ${dir}/`);
      continue;
    }
    walkDir(dirPath, files);
  }
  for (const file of STANDALONE_FILES) {
    const filePath = path.join(vaultRoot, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Warning: file not found: ${file}`);
      continue;
    }
    files.push(filePath);
  }
  return files;
}
function walkDir(dirPath, result) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, result);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(fullPath);
    }
  }
}
async function enhanceFrontmatter(options = {}) {
  const { dryRun = false, vaultRoot = process.cwd() } = options;
  console.log(`
Enhance Frontmatter`);
  console.log(`Vault root: ${vaultRoot}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "WRITE"}
`);
  const files = collectFiles(vaultRoot);
  console.log(`Found ${files.length} files to check
`);
  if (files.length === 0) {
    console.log("No files found. Check that the vault root is correct.");
    return;
  }
  const changes = [];
  let skipped = 0;
  for (const filePath of files) {
    const change = processFile(filePath);
    if (change) {
      changes.push(change);
    } else {
      skipped++;
    }
  }
  if (changes.length === 0) {
    console.log("All files already have complete frontmatter. Nothing to do.");
    return;
  }
  console.log(
    `${changes.length} file(s) need updates, ${skipped} already complete:
`
  );
  for (const change of changes) {
    const relPath = path.relative(vaultRoot, change.filePath);
    console.log(`  ${relPath}`);
    for (const field of change.addedFields) {
      console.log(`    + ${field}`);
    }
  }
  if (dryRun) {
    console.log("\n(--dry-run: no files written)");
    return;
  }
  console.log("\nWriting changes...");
  for (const change of changes) {
    fs.writeFileSync(change.filePath, change.newContent, "utf-8");
  }
  console.log(`
Done: ${changes.length} file(s) updated.`);
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("enhance-frontmatter.mjs") || process.argv[1]?.endsWith("enhance-frontmatter.ts")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  enhanceFrontmatter({
    dryRun,
    vaultRoot: process.cwd()
  }).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
export {
  enhanceFrontmatter
};
