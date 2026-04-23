#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const claudeSkillsDir = path.join(repoRoot, ".claude", "skills");
const agentsSkillsDir = path.join(repoRoot, ".agents", "skills");
const shouldSync = process.argv.includes("--sync");

function listDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function walkFiles(rootDir) {
  const out = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        const rel = path.relative(rootDir, fullPath).replaceAll("\\", "/");
        out.push(rel);
      }
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function bytesEqual(aPath, bPath) {
  const a = fs.readFileSync(aPath);
  const b = fs.readFileSync(bPath);
  return a.length === b.length && Buffer.compare(a, b) === 0;
}

function compareSharedSkill(skillName) {
  const claudePath = path.join(claudeSkillsDir, skillName);
  const agentsPath = path.join(agentsSkillsDir, skillName);
  const claudeFiles = walkFiles(claudePath);
  const agentsFiles = walkFiles(agentsPath);
  const union = new Set([...claudeFiles, ...agentsFiles]);
  const issues = [];

  for (const relPath of [...union].sort((a, b) => a.localeCompare(b))) {
    const claudeFile = path.join(claudePath, relPath);
    const agentsFile = path.join(agentsPath, relPath);
    const inClaude = fs.existsSync(claudeFile);
    const inAgents = fs.existsSync(agentsFile);

    if (inClaude && !inAgents) {
      issues.push({
        type: "missing_in_agents",
        relPath,
        canonical: `.claude/skills/${skillName}/${relPath}`,
        mirror: `.agents/skills/${skillName}/${relPath}`,
      });
      continue;
    }

    if (!inClaude && inAgents) {
      issues.push({
        type: "extra_in_agents",
        relPath,
        canonical: `.claude/skills/${skillName}/${relPath}`,
        mirror: `.agents/skills/${skillName}/${relPath}`,
      });
      continue;
    }

    if (!bytesEqual(claudeFile, agentsFile)) {
      issues.push({
        type: "content_mismatch",
        relPath,
        canonical: `.claude/skills/${skillName}/${relPath}`,
        mirror: `.agents/skills/${skillName}/${relPath}`,
      });
    }
  }

  return issues;
}

function syncSharedSkill(skillName) {
  const claudePath = path.join(claudeSkillsDir, skillName);
  const agentsPath = path.join(agentsSkillsDir, skillName);
  fs.rmSync(agentsPath, { recursive: true, force: true });
  fs.cpSync(claudePath, agentsPath, { recursive: true, force: true });
}

function main() {
  const startedAt = Date.now();

  if (!fs.existsSync(claudeSkillsDir) || !fs.existsSync(agentsSkillsDir)) {
    console.error("Skill directories are missing; expected both .claude/skills and .agents/skills.");
    process.exit(1);
  }

  const sharedSkills = listDirs(claudeSkillsDir).filter((name) =>
    fs.existsSync(path.join(agentsSkillsDir, name)),
  );

  if (shouldSync) {
    for (const skillName of sharedSkills) {
      syncSharedSkill(skillName);
    }
  }

  const drift = [];
  for (const skillName of sharedSkills) {
    const issues = compareSharedSkill(skillName);
    if (issues.length > 0) {
      drift.push({ skillName, issues });
    }
  }

  const durationMs = Date.now() - startedAt;
  if (drift.length === 0) {
    if (shouldSync) {
      console.log(
        `Synced ${sharedSkills.length} shared skills from .claude to .agents (${durationMs}ms).`,
      );
    } else {
      console.log(`Shared skills are in sync (${sharedSkills.length} shared, ${durationMs}ms).`);
    }
    return;
  }

  console.error("Shared skill drift detected. `.claude/skills` is canonical.");
  for (const { skillName, issues } of drift) {
    console.error(`- ${skillName}`);
    for (const issue of issues) {
      if (issue.type === "missing_in_agents") {
        console.error(`  * Missing in mirror: ${issue.mirror} (copy from ${issue.canonical})`);
      } else if (issue.type === "extra_in_agents") {
        console.error(`  * Extra in mirror: ${issue.mirror} (remove or stage canonical counterpart)`);
      } else {
        console.error(`  * Content mismatch: ${issue.mirror} (canonical: ${issue.canonical})`);
      }
    }
  }
  console.error("Run `npm run check:skill-sync:sync` to normalize shared skills.");
  process.exit(1);
}

main();
