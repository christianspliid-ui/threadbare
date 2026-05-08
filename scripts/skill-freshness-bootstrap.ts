#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const SKILL_ROOTS = [path.join(REPO_ROOT, ".claude", "skills"), path.join(REPO_ROOT, ".agents", "skills")];
const TARGET_FIELD = "last_validated_against";

type FrontmatterKeyRange = {
  key: string;
  start: number;
  end: number;
};

function todayDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function collectSkillFiles(): string[] {
  const out: string[] = [];
  const walk = (root: string): void => {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }
      if (entry.isFile() && entry.name === "SKILL.md") {
        out.push(absPath);
      }
    }
  };

  for (const skillRoot of SKILL_ROOTS) {
    if (fs.existsSync(skillRoot)) walk(skillRoot);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function parseFrontmatter(content: string): { lines: string[]; closingIndex: number } | null {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;

  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      return { lines, closingIndex: i };
    }
  }

  return null;
}

function collectFrontmatterKeyRanges(frontmatterLines: string[]): FrontmatterKeyRange[] {
  const keys: FrontmatterKeyRange[] = [];
  let current: FrontmatterKeyRange | null = null;

  for (let i = 0; i < frontmatterLines.length; i += 1) {
    const line = frontmatterLines[i];
    if (/^\s/.test(line)) {
      if (current) current.end = i;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*/);
    if (!keyMatch) {
      if (current) current.end = i;
      continue;
    }

    if (current) keys.push(current);
    current = { key: keyMatch[1], start: i, end: i };
  }

  if (current) keys.push(current);
  return keys;
}

function addFreshnessField(content: string, dateStamp: string): { changed: boolean; next: string; reason?: string } {
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return { changed: false, next: content, reason: "missing-frontmatter" };
  }

  const { lines, closingIndex } = parsed;
  const frontmatterLines = lines.slice(1, closingIndex);
  const keyRanges = collectFrontmatterKeyRanges(frontmatterLines);
  if (keyRanges.some((key) => key.key === TARGET_FIELD)) {
    return { changed: false, next: content };
  }

  const description = keyRanges.find((key) => key.key === "description");
  const model = keyRanges.find((key) => key.key === "model");
  const anchorEnd = Math.max(description?.end ?? -1, model?.end ?? -1);
  const insertIndex = anchorEnd >= 0 ? anchorEnd + 1 : frontmatterLines.length;
  frontmatterLines.splice(insertIndex, 0, `${TARGET_FIELD}: ${dateStamp}`);

  const nextLines = [...lines.slice(0, 1), ...frontmatterLines, ...lines.slice(closingIndex)];
  return { changed: true, next: nextLines.join("\n") };
}

function runSkillSync(): void {
  const result = spawnSync("node", [path.join("scripts", "check-skill-sync.js"), "--sync"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    timeout: 120_000,
  });

  if (result.status !== 0) {
    throw new Error("check-skill-sync --sync failed");
  }
}

function main(): void {
  const dateStamp = todayDateStamp();
  const skillFiles = collectSkillFiles();
  let changed = 0;
  let unchanged = 0;
  const skipped: string[] = [];

  for (const absPath of skillFiles) {
    const current = fs.readFileSync(absPath, "utf8");
    const patched = addFreshnessField(current, dateStamp);
    if (patched.reason === "missing-frontmatter") {
      skipped.push(path.relative(REPO_ROOT, absPath).replaceAll("\\", "/"));
      continue;
    }
    if (!patched.changed) {
      unchanged += 1;
      continue;
    }

    fs.writeFileSync(absPath, patched.next, "utf8");
    changed += 1;
  }

  runSkillSync();

  console.log(
    `skill-freshness-bootstrap complete: ${changed} updated, ${unchanged} already stamped, ${skipped.length} skipped`,
  );
  if (skipped.length > 0) {
    for (const file of skipped) {
      console.log(`- skipped (missing frontmatter): ${file}`);
    }
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`skill-freshness-bootstrap failed: ${message}`);
    process.exit(1);
  }
}
