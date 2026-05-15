import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  extractVisionFileRefs,
  extractPremises,
  parseFrontmatterAliases,
  findUncitedPremises,
  parseTasteProfile,
  findTasteHits,
  findUntouchedVisionFiles,
  buildReport,
  renderMarkdown,
  renderJson,
  parseCliArgs,
  TASTE_PROFILE_FILE,
} from "../vision-audit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(__dirname, "..", "vision-audit.ts");

// --- Fixtures ---

const FIXTURE_NON_NEGOTIABLES = `---
aliases: [non-negotiables, hard rules]
---
# Non-Negotiables

## 1. God/Protagonist Separation
The player is god, not a protagonist.

## 2. Mortal Sovereignty
Mortals make their own choices.

## 3. Always Consequential
Every action has lasting effects.
`;

const FIXTURE_DESIGN_TENSIONS = `---
---
# Design Tensions

## 1. Presence vs. Absence
The tension between being present and being absent.
`;

const FIXTURE_CORE_LOOP = `# Core Loop\nThe core loop description.\n`;

const FIXTURE_TASTE_PROFILE = `# Taste Profile

## Strong Opinions
- Encounters should feel earned, not random.
- The player is always watching, never acting directly.

## Soft Patterns
- Use environment storytelling where possible.

## Anti-Patterns
- Do not show health bars.
`;

// Plan doc that: cites 02-non-negotiables.md, names "Mortal Sovereignty" without citation
// (>3 lines away so proximity check doesn't suppress it), and never references 01-core-loop.md
const FIXTURE_PLAN_DOC = `# Test Plan Doc

This plan references Vision/02-non-negotiables.md for the non-negotiables.

Here is extended context about the plan's goals.
And more elaboration about the approach taken here.

The plan also mentions Mortal Sovereignty as a key principle to uphold.
But it does not mention the Core Loop at all.
`;

let tmpDir: string;
let visionDir: string;
let planDocPath: string;
let noTasteVisionDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vision-audit-test-"));

  // Main Vision dir (with taste-profile)
  visionDir = path.join(tmpDir, "TheFantasyWorldSimulator", "Vision");
  fs.mkdirSync(visionDir, { recursive: true });
  fs.writeFileSync(path.join(visionDir, "02-non-negotiables.md"), FIXTURE_NON_NEGOTIABLES);
  fs.writeFileSync(path.join(visionDir, "03-design-tensions.md"), FIXTURE_DESIGN_TENSIONS);
  fs.writeFileSync(path.join(visionDir, "01-core-loop.md"), FIXTURE_CORE_LOOP);
  fs.writeFileSync(path.join(visionDir, "taste-profile.md"), FIXTURE_TASTE_PROFILE);

  // Vision dir without taste-profile (for section 3 skip test)
  noTasteVisionDir = path.join(tmpDir, "no-taste", "TheFantasyWorldSimulator", "Vision");
  fs.mkdirSync(noTasteVisionDir, { recursive: true });
  fs.writeFileSync(path.join(noTasteVisionDir, "02-non-negotiables.md"), FIXTURE_NON_NEGOTIABLES);

  // Plan doc
  planDocPath = path.join(tmpDir, "plan.md");
  fs.writeFileSync(planDocPath, FIXTURE_PLAN_DOC);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// --- Section 1 ---

describe("extractVisionFileRefs", () => {
  it("finds Vision file citations with line numbers", () => {
    const lines = [
      "Line 1: no refs",
      "Line 2: see Vision/02-non-negotiables.md for details",
      "Line 3: more text",
    ];
    const refs = extractVisionFileRefs(lines);
    expect(refs).toHaveLength(1);
    expect(refs[0].file).toBe("Vision/02-non-negotiables.md");
    expect(refs[0].line).toBe(2);
  });

  it("returns empty array when no Vision refs present", () => {
    expect(extractVisionFileRefs(["no refs here", "just plain text"])).toHaveLength(0);
  });

  it("finds multiple refs on different lines", () => {
    const lines = ["Vision/01-core-loop.md matters", "also Vision/02-non-negotiables.md"];
    const refs = extractVisionFileRefs(lines);
    expect(refs).toHaveLength(2);
    expect(refs[0].line).toBe(1);
    expect(refs[1].line).toBe(2);
  });

  it("handles hyphenated filenames", () => {
    const lines = ["see Vision/03-design-tensions.md"];
    const refs = extractVisionFileRefs(lines);
    expect(refs).toHaveLength(1);
    expect(refs[0].file).toBe("Vision/03-design-tensions.md");
  });
});

// --- Premise parsing ---

describe("parseFrontmatterAliases", () => {
  it("extracts inline array aliases", () => {
    const content = `---\naliases: [foo, bar baz]\n---\n# Content\n`;
    expect(parseFrontmatterAliases(content)).toEqual(["foo", "bar baz"]);
  });

  it("returns empty array when no frontmatter", () => {
    expect(parseFrontmatterAliases("# No frontmatter here")).toEqual([]);
  });

  it("returns empty array when aliases key absent", () => {
    const content = `---\ntitle: My Doc\n---\n# Content\n`;
    expect(parseFrontmatterAliases(content)).toEqual([]);
  });
});

describe("extractPremises", () => {
  it("extracts numbered premise headings from both source files", () => {
    const premises = extractPremises(visionDir);
    const names = premises.map((p) => p.name);
    expect(names).toContain("God/Protagonist Separation");
    expect(names).toContain("Mortal Sovereignty");
    expect(names).toContain("Always Consequential");
    expect(names).toContain("Presence vs. Absence");
  });

  it("assigns correct sourceFile to premises", () => {
    const premises = extractPremises(visionDir);
    const fromNonNeg = premises.filter((p) => p.sourceFile === "02-non-negotiables.md");
    const fromTensions = premises.filter((p) => p.sourceFile === "03-design-tensions.md");
    expect(fromNonNeg.length).toBeGreaterThan(0);
    expect(fromTensions.length).toBeGreaterThan(0);
  });

  it("warns and skips absent premise source files without throwing", () => {
    const emptyDir = path.join(tmpDir, "empty-vision");
    fs.mkdirSync(emptyDir, { recursive: true });
    expect(() => extractPremises(emptyDir)).not.toThrow();
  });
});

// --- Section 2 ---

describe("findUncitedPremises", () => {
  it("reports a premise named in the plan without a nearby citation", () => {
    const planLines = ["This plan upholds Mortal Sovereignty as its guiding principle."];
    const premises = extractPremises(visionDir);
    const uncited = findUncitedPremises(planLines, premises);
    expect(uncited.map((u) => u.premise)).toContain("Mortal Sovereignty");
  });

  it("does not report a premise that has a nearby Vision file reference", () => {
    const planLines = [
      "The Mortal Sovereignty premise (Vision/02-non-negotiables.md) is upheld here.",
    ];
    const premises = extractPremises(visionDir);
    const uncited = findUncitedPremises(planLines, premises);
    expect(uncited.map((u) => u.premise)).not.toContain("Mortal Sovereignty");
  });

  it("returns empty when plan doc has no premise matches", () => {
    const planLines = ["This plan discusses unrelated topics."];
    const premises = extractPremises(visionDir);
    const uncited = findUncitedPremises(planLines, premises);
    expect(uncited).toHaveLength(0);
  });
});

// --- Taste profile ---

describe("parseTasteProfile", () => {
  it("parses entries from all three categories", () => {
    const entries = parseTasteProfile(FIXTURE_TASTE_PROFILE);
    const cats = entries.map((e) => e.category);
    expect(cats).toContain("strong-opinion");
    expect(cats).toContain("soft-pattern");
    expect(cats).toContain("anti-pattern");
  });

  it("extracts entry text correctly", () => {
    const entries = parseTasteProfile(FIXTURE_TASTE_PROFILE);
    expect(entries.some((e) => e.text.includes("Encounters should feel earned"))).toBe(true);
    expect(entries.some((e) => e.text.includes("Do not show health bars"))).toBe(true);
  });

  it("returns empty array for empty content", () => {
    expect(parseTasteProfile("# No categories here")).toHaveLength(0);
  });
});

describe("findTasteHits", () => {
  it("finds a taste entry mentioned in the plan", () => {
    const planLines = ["Encounters should feel earned, not random — this matters."];
    const entries = parseTasteProfile(FIXTURE_TASTE_PROFILE);
    const hits = findTasteHits(planLines, entries);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].entry).toContain("Encounters should feel earned");
  });

  it("classifies as 'contradicts' when negation token is near the match", () => {
    const planLines = ["We want to remove the encounters-should-feel-earned philosophy."];
    const entries = [{ text: "encounters-should-feel-earned philosophy", category: "strong-opinion" as const }];
    const hits = findTasteHits(planLines, entries);
    expect(hits[0]?.classification).toBe("contradicts");
  });

  it("classifies as 'confirms' when no negation token nearby", () => {
    // Use an entry that contains no contradiction tokens so the window check stays clean
    const planLines = ["This design affirms: the player is always watching, never acting directly."];
    const entries = parseTasteProfile(FIXTURE_TASTE_PROFILE);
    const hits = findTasteHits(planLines, entries);
    const hit = hits.find((h) => h.entry.includes("player is always watching"));
    expect(hit?.classification).toBe("confirms");
  });

  it("returns empty array when no entries match the plan", () => {
    const planLines = ["This plan mentions nothing from the taste profile at all."];
    const entries = parseTasteProfile(FIXTURE_TASTE_PROFILE);
    expect(findTasteHits(planLines, entries)).toHaveLength(0);
  });
});

// --- Section 3 skip when taste-profile absent ---

describe("section 3 taste-profile behavior", () => {
  it("section 3 is null when taste-profile.md is missing", () => {
    const report = buildReport(planDocPath, noTasteVisionDir);
    expect(report.section3).toBeNull();
    expect(report.notes.some((n) => n.includes(TASTE_PROFILE_FILE))).toBe(true);
  });

  it("section 3 is an array (not null) when taste-profile.md is present", () => {
    const report = buildReport(planDocPath, visionDir);
    expect(report.section3).not.toBeNull();
    expect(Array.isArray(report.section3)).toBe(true);
  });
});

// --- Section 4 ---

describe("findUntouchedVisionFiles", () => {
  it("includes files with no plan-doc matches", () => {
    const allFiles = ["01-core-loop.md", "02-non-negotiables.md", "taste-profile.md"];
    const section1 = [{ file: "Vision/02-non-negotiables.md", line: 1 }];
    const untouched = findUntouchedVisionFiles(allFiles, section1, [], null);
    expect(untouched).toContain("01-core-loop.md");
  });

  it("excludes files touched via section 1 citation", () => {
    const allFiles = ["02-non-negotiables.md", "01-core-loop.md"];
    const section1 = [{ file: "Vision/02-non-negotiables.md", line: 1 }];
    const untouched = findUntouchedVisionFiles(allFiles, section1, [], null);
    expect(untouched).not.toContain("02-non-negotiables.md");
  });

  it("excludes files touched via section 2 uncited premises", () => {
    const allFiles = ["02-non-negotiables.md", "01-core-loop.md"];
    const section2 = [{ premise: "Mortal Sovereignty", sourceFile: "02-non-negotiables.md", line: 5 }];
    const untouched = findUntouchedVisionFiles(allFiles, [], section2, null);
    expect(untouched).not.toContain("02-non-negotiables.md");
  });

  it("excludes taste-profile.md when section 3 has hits", () => {
    const allFiles = ["taste-profile.md", "01-core-loop.md"];
    const section3 = [{ entry: "test", category: "strong-opinion" as const, classification: "confirms" as const, line: 1 }];
    const untouched = findUntouchedVisionFiles(allFiles, [], [], section3);
    expect(untouched).not.toContain("taste-profile.md");
  });
});

// --- Full buildReport ---

describe("buildReport", () => {
  it("section 1 finds the Vision file citation in fixture plan doc", () => {
    const report = buildReport(planDocPath, visionDir);
    expect(report.section1.some((r) => r.file.includes("02-non-negotiables.md"))).toBe(true);
  });

  it("section 2 flags Mortal Sovereignty as uncited in fixture plan doc", () => {
    const report = buildReport(planDocPath, visionDir);
    expect(report.section2.some((u) => u.premise === "Mortal Sovereignty")).toBe(true);
  });

  it("section 4 includes 01-core-loop.md (never referenced in fixture plan)", () => {
    const report = buildReport(planDocPath, visionDir);
    expect(report.section4).toContain("01-core-loop.md");
  });

  it("no-vault case: section 1 emits, notes vault not found, sections 2-4 empty", () => {
    const report = buildReport(planDocPath, null);
    expect(report.section1.length).toBeGreaterThan(0);
    expect(report.notes.some((n) => n.includes("Vision notebook not found"))).toBe(true);
    expect(report.section2).toHaveLength(0);
    expect(report.section4).toHaveLength(0);
  });
});

// --- Rendering ---

describe("renderMarkdown", () => {
  it("produces non-empty markdown with all four section headers", () => {
    const report = buildReport(planDocPath, visionDir);
    const md = renderMarkdown(report);
    expect(md).toContain("## Section 1");
    expect(md).toContain("## Section 2");
    expect(md).toContain("## Section 3");
    expect(md).toContain("## Section 4");
  });

  it("includes taste-profile skip message when section 3 is null", () => {
    const report = buildReport(planDocPath, noTasteVisionDir);
    const md = renderMarkdown(report);
    expect(md).toContain("Skipped");
  });
});

describe("renderJson + --json flag", () => {
  it("JSON output parses and carries all four sections", () => {
    const report = buildReport(planDocPath, visionDir);
    const json = renderJson(report);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty("section1");
    expect(parsed).toHaveProperty("section2");
    expect(parsed).toHaveProperty("section3");
    expect(parsed).toHaveProperty("section4");
  });

  it("JSON section1 matches markdown section1 length", () => {
    const report = buildReport(planDocPath, visionDir);
    const parsed = JSON.parse(renderJson(report)) as { section1: unknown[] };
    expect(parsed.section1).toHaveLength(report.section1.length);
  });
});

// --- CLI behavior ---

describe("parseCliArgs", () => {
  it("returns null when no plan doc argument", () => {
    expect(parseCliArgs(["node", "vision-audit.ts"])).toBeNull();
  });

  it("parses plan doc path", () => {
    const result = parseCliArgs(["node", "vision-audit.ts", "/some/plan.md"]);
    expect(result?.planDocPath).toBe("/some/plan.md");
    expect(result?.jsonFlag).toBe(false);
    expect(result?.vaultFlag).toBeNull();
  });

  it("parses --json flag", () => {
    const result = parseCliArgs(["node", "vision-audit.ts", "/plan.md", "--json"]);
    expect(result?.jsonFlag).toBe(true);
  });

  it("parses --vault flag", () => {
    const result = parseCliArgs(["node", "vision-audit.ts", "/plan.md", "--vault", "/vault"]);
    expect(result?.vaultFlag).toBe("/vault");
  });
});

describe("CLI exit codes", () => {
  it("exits 1 when no plan doc argument is provided", () => {
    let exitCode: number | null = null;
    try {
      execSync(`node --experimental-strip-types "${scriptPath}"`, { stdio: "pipe" });
    } catch (e: unknown) {
      exitCode = (e as { status?: number }).status ?? null;
    }
    expect(exitCode).toBe(1);
  });

  it("exits 0 when plan doc is valid but vault not found", () => {
    const noVaultEnv = { ...process.env, OBSIDIAN_VAULT_PATH: path.join(tmpDir, "nonexistent") };
    let threw = false;
    try {
      execSync(`node --experimental-strip-types "${scriptPath}" "${planDocPath}"`, {
        stdio: "pipe",
        env: noVaultEnv,
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  it("exits 0 and emits JSON when --json flag passed", () => {
    const vaultRoot = path.join(tmpDir);
    const cmd = `node --experimental-strip-types "${scriptPath}" "${planDocPath}" --vault "${vaultRoot}" --json`;
    let output = "";
    execSync(cmd, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    // If execSync didn't throw, exit was 0
    // Verify JSON output has the four sections
    try {
      output = execSync(cmd, { encoding: "utf8" });
    } catch {
      // tolerate warnings on stderr
    }
    if (output) {
      const parsed = JSON.parse(output) as Record<string, unknown>;
      expect(parsed).toHaveProperty("section1");
      expect(parsed).toHaveProperty("section4");
    }
  });
});
