#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonDir = path.join(repoRoot, "Docs", "canon");
const skippedCanonFiles = new Set(["README.md"]);
const planPathPattern = /Docs\/plans\/[A-Za-z0-9._/-]+\.md/g;
const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(frontmatterPattern);
  if (!match) {
    return {};
  }

  const lines = match[1].split(/\r?\n/);
  const result: Record<string, string> = {};
  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

function normalizeLinkTarget(target: string): string {
  const withoutFragment = target.split("#")[0];
  return withoutFragment.split("?")[0].trim();
}

function toRepoRelative(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replaceAll("\\", "/");
}

function resolvePlanReferences(canonFilePath: string, content: string): string[] {
  const discovered = new Set<string>();
  const canonDirPath = path.dirname(canonFilePath);

  const addCandidate = (rawTarget: string): void => {
    const normalized = normalizeLinkTarget(rawTarget);
    if (!normalized || normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return;
    }

    let absolutePath = path.resolve(canonDirPath, normalized);
    if (normalized.startsWith("Docs/")) {
      absolutePath = path.join(repoRoot, normalized);
    }

    const repoRelative = toRepoRelative(absolutePath);
    if (repoRelative.startsWith("Docs/plans/") && repoRelative.endsWith(".md")) {
      discovered.add(repoRelative);
    }
  };

  let linkMatch: RegExpExecArray | null = markdownLinkPattern.exec(content);
  while (linkMatch) {
    addCandidate(linkMatch[1]);
    linkMatch = markdownLinkPattern.exec(content);
  }

  let inlinePlanMatch: RegExpExecArray | null = planPathPattern.exec(content);
  while (inlinePlanMatch) {
    discovered.add(inlinePlanMatch[0]);
    inlinePlanMatch = planPathPattern.exec(content);
  }

  return [...discovered].sort();
}

function parseLastReviewedDate(rawValue: string | undefined): Date | null {
  if (!rawValue) {
    return null;
  }
  const trimmed = rawValue.replace(/^["']|["']$/g, "").trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(`${trimmed}T23:59:59.999`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getPlanModifiedAt(planAbsolutePath: string): Date {
  const fallback = fs.statSync(planAbsolutePath).mtime;
  const planRepoPath = toRepoRelative(planAbsolutePath);

  try {
    const isoTimestamp = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", planRepoPath],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (!isoTimestamp) {
      return fallback;
    }
    const fromGit = new Date(isoTimestamp);
    if (Number.isNaN(fromGit.getTime())) {
      return fallback;
    }
    return fromGit;
  } catch {
    return fallback;
  }
}

function main(): void {
  if (!fs.existsSync(canonDir)) {
    console.warn("warn: Docs/canon directory is missing; skipping canon staleness check.");
    process.exit(0);
  }

  const warnings: string[] = [];
  const canonFiles = fs
    .readdirSync(canonDir)
    .filter((entry) => entry.endsWith(".md") && !skippedCanonFiles.has(entry))
    .sort();

  if (canonFiles.length === 0) {
    console.info("info: no canon pages found to check.");
    process.exit(0);
  }

  for (const canonFileName of canonFiles) {
    const canonFilePath = path.join(canonDir, canonFileName);
    const canonRelativePath = toRepoRelative(canonFilePath);
    const canonContent = fs.readFileSync(canonFilePath, "utf8");
    const frontmatter = parseFrontmatter(canonContent);
    const lastReviewed = parseLastReviewedDate(frontmatter.last_reviewed);

    if (!lastReviewed) {
      warnings.push(`${canonRelativePath} missing or invalid frontmatter field: last_reviewed`);
      continue;
    }

    const planReferences = resolvePlanReferences(canonFilePath, canonContent);
    for (const planRelativePath of planReferences) {
      const planAbsolutePath = path.join(repoRoot, planRelativePath);
      if (!fs.existsSync(planAbsolutePath)) {
        warnings.push(`${canonRelativePath} references missing plan file ${planRelativePath}`);
        continue;
      }

      const planModifiedAt = getPlanModifiedAt(planAbsolutePath);
      if (planModifiedAt.getTime() > lastReviewed.getTime()) {
        warnings.push(
          `${canonRelativePath} stale vs ${planRelativePath} (plan mtime ${planModifiedAt.toISOString()} > last_reviewed ${lastReviewed.toISOString()})`,
        );
      }
    }
  }

  if (warnings.length === 0) {
    console.info("all canon pages fresh");
    process.exit(0);
  }

  console.warn("canon staleness warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
  process.exit(0);
}

main();
