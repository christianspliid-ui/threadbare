#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// --- Constants (NFP #1: every magic value is named) ---

export const VISION_DIR_RELATIVE = "TheFantasyWorldSimulator/Vision";
export const PREMISE_SOURCE_FILES = ["02-non-negotiables.md", "03-design-tensions.md"] as const;
export const TASTE_PROFILE_FILE = "taste-profile.md";
export const VISION_FILE_REFERENCE_PATTERN = /\bVision\/[\w.-]+\.md\b/;
export const PREMISE_HEADING_PATTERN = /^#{1,3}\s+(\d+)\.\s+(.+?)\s*$/;
export const CITATION_PROXIMITY_LINES = 3;
export const TASTE_CONTRADICTION_TOKENS = [
  "not ",
  "no longer",
  "instead of",
  "replace",
  "drop ",
  "remove ",
  "contradict",
] as const;

// --- Types ---

export type VisionFileRef = { file: string; line: number };
export type UncitedPremise = { premise: string; sourceFile: string; line: number };
export type TasteHit = {
  entry: string;
  category: "strong-opinion" | "soft-pattern" | "anti-pattern";
  classification: "confirms" | "contradicts";
  line: number;
};
export type PremiseDef = { name: string; aliases: string[]; sourceFile: string };
export type TasteEntry = {
  text: string;
  category: "strong-opinion" | "soft-pattern" | "anti-pattern";
};

export type AuditReport = {
  planDoc: string;
  section1: VisionFileRef[];
  section2: UncitedPremise[];
  section3: TasteHit[] | null;
  section4: string[];
  notes: string[];
};

// --- Path resolution ---

function getRepoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function resolveVisionDir(vaultFlag: string | null): string | null {
  if (vaultFlag) {
    const candidate = path.join(vaultFlag, VISION_DIR_RELATIVE);
    if (fs.existsSync(candidate)) return candidate;
    return null;
  }

  const envVault = process.env.OBSIDIAN_VAULT_PATH?.trim();
  if (envVault) {
    const candidate = path.join(envVault, VISION_DIR_RELATIVE);
    if (fs.existsSync(candidate)) return candidate;
  }

  const repoFallback = path.join(getRepoRoot(), VISION_DIR_RELATIVE);
  if (fs.existsSync(repoFallback)) return repoFallback;

  return null;
}

// --- Section 1: Vision file references ---

export function extractVisionFileRefs(planLines: string[]): VisionFileRef[] {
  const refs: VisionFileRef[] = [];
  const pattern = new RegExp(VISION_FILE_REFERENCE_PATTERN.source, "g");
  for (let i = 0; i < planLines.length; i++) {
    const line = planLines[i];
    const re = new RegExp(pattern.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      refs.push({ file: m[0], line: i + 1 });
    }
  }
  return refs;
}

// --- Premise parsing ---

export function parseFrontmatterAliases(content: string): string[] {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return [];
  const lines = match[1].split(/\r?\n/);
  const aliases: string[] = [];
  let inAliases = false;
  for (const line of lines) {
    if (/^aliases\s*:/i.test(line)) {
      inAliases = true;
      const inlineMatch = line.match(/\[([^\]]+)\]/);
      if (inlineMatch) {
        aliases.push(
          ...inlineMatch[1]
            .split(",")
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
            .filter(Boolean),
        );
        inAliases = false;
      }
      continue;
    }
    if (inAliases) {
      if (/^\s*-\s+/.test(line)) {
        const t = line.replace(/^\s*-\s+/, "").trim().replace(/^['"]|['"]$/g, "");
        if (t) aliases.push(t);
      } else if (/^\w/.test(line)) {
        inAliases = false;
      }
    }
  }
  return aliases;
}

export function extractPremises(visionDir: string): PremiseDef[] {
  const premises: PremiseDef[] = [];
  for (const sourceFile of PREMISE_SOURCE_FILES) {
    const filePath = path.join(visionDir, sourceFile);
    if (!fs.existsSync(filePath)) {
      process.stderr.write(`warn: vision-audit: ${sourceFile} not found in Vision dir — skipping.\n`);
      continue;
    }
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      process.stderr.write(`warn: vision-audit: could not read ${sourceFile} — skipping.\n`);
      continue;
    }
    const aliases = parseFrontmatterAliases(content);
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(PREMISE_HEADING_PATTERN);
      if (m) {
        premises.push({ name: m[2].trim(), aliases, sourceFile });
      }
    }
  }
  return premises;
}

// --- Section 2: Uncited premises ---

function hasVisionRefNear(planLines: string[], lineIndex: number): boolean {
  const start = Math.max(0, lineIndex - CITATION_PROXIMITY_LINES);
  const end = Math.min(planLines.length - 1, lineIndex + CITATION_PROXIMITY_LINES);
  for (let j = start; j <= end; j++) {
    if (new RegExp(VISION_FILE_REFERENCE_PATTERN.source).test(planLines[j])) return true;
  }
  return false;
}

export function findUncitedPremises(planLines: string[], premises: PremiseDef[]): UncitedPremise[] {
  const uncited: UncitedPremise[] = [];
  for (const { name, aliases, sourceFile } of premises) {
    const searchTerms = [name, ...aliases].filter((t) => t.length > 3);
    let found = false;
    outer: for (const term of searchTerms) {
      const termLower = term.toLowerCase();
      for (let i = 0; i < planLines.length; i++) {
        if (planLines[i].toLowerCase().includes(termLower) && !hasVisionRefNear(planLines, i)) {
          uncited.push({ premise: name, sourceFile, line: i + 1 });
          found = true;
          break outer;
        }
      }
    }
    void found;
  }
  return uncited;
}

// --- Taste profile ---

export function parseTasteProfile(content: string): TasteEntry[] {
  const entries: TasteEntry[] = [];
  const lines = content.split(/\r?\n/);
  let currentCategory: "strong-opinion" | "soft-pattern" | "anti-pattern" | null = null;
  for (const line of lines) {
    if (/^#{1,3}.*strong.?opinion/i.test(line)) {
      currentCategory = "strong-opinion";
    } else if (/^#{1,3}.*soft.?pattern/i.test(line)) {
      currentCategory = "soft-pattern";
    } else if (/^#{1,3}.*anti.?pattern/i.test(line)) {
      currentCategory = "anti-pattern";
    } else if (currentCategory && /^\s*[-*]\s+/.test(line)) {
      const text = line.replace(/^\s*[-*]\s+/, "").trim();
      if (text.length > 0) entries.push({ text, category: currentCategory });
    }
  }
  return entries;
}

function classifyTasteHit(planLines: string[], lineIndex: number): "confirms" | "contradicts" {
  const window = planLines
    .slice(Math.max(0, lineIndex - 2), Math.min(planLines.length, lineIndex + 3))
    .join(" ")
    .toLowerCase();
  for (const token of TASTE_CONTRADICTION_TOKENS) {
    if (window.includes(token)) return "contradicts";
  }
  return "confirms";
}

export function findTasteHits(planLines: string[], entries: TasteEntry[]): TasteHit[] {
  const hits: TasteHit[] = [];
  for (const { text, category } of entries) {
    // Strip trailing punctuation before slicing so "entry text." matches "entry text — context"
    const searchText = text.toLowerCase().replace(/[.,!?;:]+$/, "").slice(0, 60);
    for (let i = 0; i < planLines.length; i++) {
      if (planLines[i].toLowerCase().includes(searchText)) {
        hits.push({
          entry: text,
          category,
          classification: classifyTasteHit(planLines, i),
          line: i + 1,
        });
        break;
      }
    }
  }
  return hits;
}

// --- Section 4: Untouched Vision files ---

export function findUntouchedVisionFiles(
  allVisionFiles: string[],
  section1Refs: VisionFileRef[],
  section2Items: UncitedPremise[],
  section3Hits: TasteHit[] | null,
): string[] {
  const touched = new Set<string>();

  for (const { file } of section1Refs) {
    touched.add(path.basename(file));
  }
  for (const { sourceFile } of section2Items) {
    touched.add(sourceFile);
  }
  if (section3Hits && section3Hits.length > 0) {
    touched.add(TASTE_PROFILE_FILE);
  }

  return allVisionFiles.filter((f) => !touched.has(f));
}

// --- Report builder ---

export function buildReport(planDocPath: string, visionDir: string | null): AuditReport {
  const planContent = fs.readFileSync(planDocPath, "utf8");
  const planLines = planContent.split(/\r?\n/);
  const notes: string[] = [];

  const section1 = extractVisionFileRefs(planLines);

  if (!visionDir) {
    notes.push("Vision notebook not found — sections 2–4 skipped.");
    return { planDoc: planDocPath, section1, section2: [], section3: null, section4: [], notes };
  }

  const premises = extractPremises(visionDir);
  const section2 = findUncitedPremises(planLines, premises);

  const tasteProfilePath = path.join(visionDir, TASTE_PROFILE_FILE);
  let section3: TasteHit[] | null = null;
  if (!fs.existsSync(tasteProfilePath)) {
    process.stderr.write(`warn: vision-audit: ${TASTE_PROFILE_FILE} not found — section 3 skipped.\n`);
    notes.push(`${TASTE_PROFILE_FILE} not found — section 3 skipped.`);
  } else {
    try {
      const tasteContent = fs.readFileSync(tasteProfilePath, "utf8");
      const entries = parseTasteProfile(tasteContent);
      section3 = findTasteHits(planLines, entries);
    } catch {
      process.stderr.write(
        `warn: vision-audit: could not read ${TASTE_PROFILE_FILE} — section 3 skipped.\n`,
      );
      notes.push(`Could not read ${TASTE_PROFILE_FILE} — section 3 skipped.`);
    }
  }

  let allVisionFiles: string[] = [];
  try {
    allVisionFiles = fs.readdirSync(visionDir).filter((f) => f.endsWith(".md"));
  } catch {
    process.stderr.write("warn: vision-audit: could not enumerate Vision directory.\n");
    notes.push("Could not enumerate Vision directory.");
  }

  const section4 = findUntouchedVisionFiles(allVisionFiles, section1, section2, section3);

  return { planDoc: planDocPath, section1, section2, section3, section4, notes };
}

// --- Rendering ---

export function renderMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  lines.push(`# Vision Audit Report`);
  lines.push(`> Plan doc: \`${report.planDoc}\``);
  if (report.notes.length > 0) {
    lines.push(`\n> **Notes:** ${report.notes.join("; ")}`);
  }
  lines.push("");

  lines.push(`## Section 1 — Vision files referenced by path`);
  if (report.section1.length === 0) {
    lines.push("_No Vision file citations found in plan doc._");
  } else {
    for (const { file, line } of report.section1) {
      lines.push(`- \`${file}\` (line ${line})`);
    }
  }
  lines.push("");

  lines.push(`## Section 2 — Vision premises named without citation`);
  if (report.section2.length === 0) {
    lines.push(
      "_All named premises have a nearby Vision file reference, or no premises were named._",
    );
  } else {
    for (const { premise, sourceFile, line } of report.section2) {
      lines.push(`- **${premise}** (from \`${sourceFile}\`) — plan doc line ${line}`);
    }
  }
  lines.push("");

  lines.push(`## Section 3 — Taste-profile entries the plan would update`);
  if (report.section3 === null) {
    lines.push(`_Skipped: \`${TASTE_PROFILE_FILE}\` not found in Vision directory._`);
    lines.push(`_(mechanical guess — agent confirms)_`);
  } else if (report.section3.length === 0) {
    lines.push("_No taste-profile entries found in plan doc._");
    lines.push(`_(mechanical guess — agent confirms)_`);
  } else {
    lines.push("| Entry | Category | Classification |");
    lines.push("|-------|----------|----------------|");
    for (const { entry, category, classification, line } of report.section3) {
      lines.push(`| ${entry} (line ${line}) | ${category} | ${classification} |`);
    }
    lines.push(`\n_(mechanical guess — agent confirms)_`);
  }
  lines.push("");

  lines.push(`## Section 4 — Vision premises NOT touched`);
  if (report.section4.length === 0) {
    lines.push("_All Vision files were referenced._");
  } else {
    for (const file of report.section4) {
      lines.push(`- \`${file}\``);
    }
  }

  return lines.join("\n");
}

export function renderJson(report: AuditReport): string {
  return JSON.stringify(
    {
      planDoc: report.planDoc,
      notes: report.notes,
      section1: report.section1,
      section2: report.section2,
      section3: report.section3,
      section4: report.section4,
    },
    null,
    2,
  );
}

// --- CLI args ---

export function parseCliArgs(argv: string[]): {
  planDocPath: string;
  vaultFlag: string | null;
  jsonFlag: boolean;
} | null {
  const args = argv.slice(2);
  let planDocPath: string | null = null;
  let vaultFlag: string | null = null;
  let jsonFlag = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vault" && i + 1 < args.length) {
      vaultFlag = args[++i];
    } else if (args[i] === "--json") {
      jsonFlag = true;
    } else if (!args[i].startsWith("--")) {
      planDocPath = args[i];
    }
  }

  if (!planDocPath) return null;
  return { planDocPath, vaultFlag, jsonFlag };
}

// --- Entry point ---

function main(): void {
  const parsed = parseCliArgs(process.argv);
  if (!parsed) {
    process.stderr.write(
      "usage: npm run vision-audit -- <plan-doc-path> [--vault <vault-path>] [--json]\n",
    );
    process.exit(1);
  }

  const { planDocPath, vaultFlag, jsonFlag } = parsed;

  if (!fs.existsSync(planDocPath) || !fs.statSync(planDocPath).isFile()) {
    process.stderr.write(
      `error: vision-audit: plan doc not found or not a file: ${planDocPath}\n` +
        "usage: npm run vision-audit -- <plan-doc-path> [--vault <vault-path>] [--json]\n",
    );
    process.exit(1);
  }

  const visionDir = resolveVisionDir(vaultFlag);
  if (!visionDir) {
    process.stderr.write(
      "warn: vision-audit: Vision notebook not found. " +
        "Pass --vault <path>, set OBSIDIAN_VAULT_PATH, or place Vision/ under " +
        `${VISION_DIR_RELATIVE} in the repo root.\n`,
    );
  }

  const report = buildReport(planDocPath, visionDir);

  if (jsonFlag) {
    process.stdout.write(renderJson(report) + "\n");
  } else {
    process.stdout.write(renderMarkdown(report) + "\n");
  }
  process.exit(0);
}

// Guard: only run main when executed directly (not when imported by tests)
if (process.argv[1] && fileURLToPath(import.meta.url).endsWith(path.basename(process.argv[1]))) {
  main();
}
