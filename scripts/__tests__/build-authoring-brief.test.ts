import { describe, it, expect } from "vitest";
import {
  hashContent,
  extractSection,
  distillCapabilitySection,
  extractPrinciplesSections,
  buildBrief,
  extractHashesFromBrief,
  AUTHORING_BRIEF_MAX_LINES,
  AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES,
  AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES,
} from "../build-authoring-brief";

// Minimal fake wiring guide with Capabilities 1-7
function makeWiringGuide(overrides: Partial<Record<number, string>> = {}): string {
  const caps = Array.from({ length: 7 }, (_, idx) => {
    const n = idx + 1;
    const override = overrides[n];
    if (override !== undefined) return override;
    return [
      `### Capability ${n}: Test Cap ${n} — A Short Title`,
      "",
      `This is the one-sentence statement for capability ${n}.`,
      "",
      `\`\`\`typescript`,
      `{ kind: 'test_effect_${n}', value: ${n} }`,
      `\`\`\``,
      "",
      `**Why this changes what you write:** Because capability ${n} matters for storytelling.`,
      "",
    ].join("\n");
  });

  return [
    "# Wiring Guide",
    "",
    "## Part 2: The Seven Capabilities — What You Can Do",
    "",
    ...caps,
    "## Part 3: The Wiring Checklist",
  ].join("\n");
}

// Minimal fake direction doc with 7 principles
function makeDirectionDoc(): string {
  const principles = Array.from({ length: 7 }, (_, idx) => {
    const n = idx + 1;
    return [
      `### ${n}. Principle ${n} Title`,
      "",
      `This is the content for principle ${n}. It explains what the principle means.`,
      "",
    ].join("\n");
  });

  return [
    "# Game Design Direction",
    "",
    "## Encounter Design Principles",
    "",
    "Every encounter design must satisfy these principles:",
    "",
    ...principles,
    "---",
    "",
    "## The Emotional Read",
  ].join("\n");
}

describe("hashContent", () => {
  it("produces a hex string", () => {
    const h = hashContent("hello");
    expect(h).toMatch(/^[0-9a-f]{40}$/);
  });

  it("is deterministic — same input same hash", () => {
    const input = "some content here";
    expect(hashContent(input)).toBe(hashContent(input));
  });

  it("differs for different inputs", () => {
    expect(hashContent("aaa")).not.toBe(hashContent("bbb"));
  });
});

describe("extractSection", () => {
  const lines = [
    "# Header",
    "## Section A",
    "content a",
    "## Section B",
    "content b",
    "## Section C",
  ];

  it("extracts from start pattern to stop pattern", () => {
    const result = extractSection(lines, /^## Section A$/, /^## Section B$/);
    expect(result).toEqual(["## Section A", "content a"]);
  });

  it("throws when start anchor not found", () => {
    expect(() => extractSection(lines, /^## Missing$/, /^## Section B$/)).toThrow(
      "Expected anchor not found",
    );
  });

  it("extracts to end of array if stop never matches", () => {
    const result = extractSection(lines, /^## Section C$/, /^## NONEXISTENT$/);
    expect(result).toEqual(["## Section C"]);
  });
});

describe("distillCapabilitySection", () => {
  const section = [
    "### Capability 1: Test — Short Title",
    "",
    "One-sentence capability statement.",
    "",
    "```typescript",
    "{ kind: 'example', value: 42 }",
    "```",
    "",
    "**Why this changes what you write:** This is why it matters. Second sentence.",
    "",
  ];

  it("includes the heading", () => {
    const result = distillCapabilitySection(section, 1);
    expect(result[0]).toBe("### Capability 1: Test — Short Title");
  });

  it("includes the first paragraph", () => {
    const result = distillCapabilitySection(section, 1);
    expect(result.join("\n")).toContain("One-sentence capability statement.");
  });

  it("includes the code block", () => {
    const result = distillCapabilitySection(section, 1);
    const joined = result.join("\n");
    expect(joined).toContain("```typescript");
    expect(joined).toContain("{ kind: 'example', value: 42 }");
    expect(joined).toContain("```");
  });

  it("includes the Why paragraph", () => {
    const result = distillCapabilitySection(section, 1);
    expect(result.join("\n")).toContain("**Why this changes what you write:**");
    expect(result.join("\n")).toContain("Second sentence.");
  });

  it("is deterministic — same output over multiple calls", () => {
    const a = distillCapabilitySection(section, 1);
    const b = distillCapabilitySection(section, 1);
    expect(a).toEqual(b);
  });

  it("throws when section exceeds per-capability budget", () => {
    const longSection = [
      "### Capability 99: Long Cap",
      "",
      ...Array(AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES + 5).fill("long line content"),
      "",
    ];
    expect(() => distillCapabilitySection(longSection, 99)).toThrow(
      "AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES",
    );
  });

  it("handles a markdown table instead of a code block", () => {
    const sectionWithTable = [
      "### Capability 2: Table Cap",
      "",
      "Statement.",
      "",
      "| Col A | Col B |",
      "|---|---|",
      "| val1 | val2 |",
      "",
      "**Why this changes what you write:** Table reason.",
    ];
    const result = distillCapabilitySection(sectionWithTable, 2);
    const joined = result.join("\n");
    expect(joined).toContain("| Col A | Col B |");
    expect(joined).toContain("| val1 | val2 |");
  });
});

describe("extractPrinciplesSections", () => {
  const lines = makeDirectionDoc().split("\n");

  it("includes the intro paragraph", () => {
    const result = extractPrinciplesSections(lines);
    expect(result.join("\n")).toContain("Every encounter design must satisfy these principles:");
  });

  it("includes all 7 principle headings", () => {
    const result = extractPrinciplesSections(lines);
    const joined = result.join("\n");
    for (let n = 1; n <= 7; n++) {
      expect(joined).toContain(`### ${n}. Principle ${n} Title`);
    }
  });

  it("throws when a principle exceeds its budget", () => {
    const longPrinciple = Array(AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES + 2)
      .fill("content line")
      .join("\n");
    const doc = [
      "## Encounter Design Principles",
      "",
      "Intro.",
      "",
      "### 1. Long Principle",
      "",
      longPrinciple,
      "",
      "---",
    ].join("\n");
    expect(() => extractPrinciplesSections(doc.split("\n"))).toThrow(
      "AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES",
    );
  });
});

describe("buildBrief", () => {
  const wiringContent = makeWiringGuide();
  const directionContent = makeDirectionDoc();
  const wiringHash = hashContent(wiringContent);
  const directionHash = hashContent(directionContent);
  const generatedAt = "2026-04-23";

  it("produces a non-empty string", () => {
    const brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
    expect(brief.length).toBeGreaterThan(0);
  });

  it("includes the version header with hashes", () => {
    const brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
    expect(brief).toContain(`sha1: ${wiringHash}`);
    expect(brief).toContain(`sha1: ${directionHash}`);
    expect(brief).toContain("**Generated:** 2026-04-23");
  });

  it("includes all 7 capability headings", () => {
    const brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
    for (let n = 1; n <= 7; n++) {
      expect(brief).toContain(`### Capability ${n}:`);
    }
  });

  it("includes Section D and E", () => {
    const brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
    expect(brief).toContain("Section D: Player-as-God Framing Constraint");
    expect(brief).toContain("Section E: Editorial Rejection Triggers");
    expect(brief).toContain("REVISE BEFORE CONTINUING");
  });

  it("is deterministic — 5 identical runs produce byte-identical output", () => {
    const results = Array.from({ length: 5 }, () =>
      buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt),
    );
    for (const r of results) {
      expect(r).toBe(results[0]);
    }
  });

  it("stays within the total line budget", () => {
    const brief = buildBrief(wiringContent, directionContent, wiringHash, directionHash, generatedAt);
    const lineCount = brief.split("\n").length - 1;
    expect(lineCount).toBeLessThanOrEqual(AUTHORING_BRIEF_MAX_LINES);
  });

  it("throws when a capability section exceeds per-section budget", () => {
    // Code block with many lines pushes section over the 40-line budget
    const longCap1 = [
      "### Capability 1: Long Cap",
      "",
      "Statement.",
      "",
      "```typescript",
      ...Array(AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES).fill("// line"),
      "```",
      "",
      "**Why this changes what you write:** Reason.",
    ].join("\n");
    const overcrowdedWiring = makeWiringGuide({ 1: longCap1 });
    expect(() =>
      buildBrief(overcrowdedWiring, directionContent, wiringHash, directionHash, generatedAt),
    ).toThrow("AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES");
  });

  it("throws when source has missing capability anchor", () => {
    const badWiring = "# Wiring Guide\n## Part 2\n### Capability 1: Only One\n\nStatement.\n\n**Why this changes what you write:** Reason.\n\n## Part 3";
    expect(() =>
      buildBrief(badWiring, directionContent, wiringHash, directionHash, generatedAt),
    ).toThrow("Expected anchor not found");
  });
});

describe("extractHashesFromBrief", () => {
  it("extracts both hashes from a well-formed header", () => {
    const brief = [
      "# Authoring Brief",
      "> **Generated:** 2026-04-23",
      "> **Sources:**",
      `>   - Docs/plans/2026-04-16-systemic-wiring-guide.md (sha1: ${"a".repeat(40)})`,
      `>   - Docs/plans/2026-04-16-game-design-direction.md (sha1: ${"b".repeat(40)})`,
    ].join("\n");
    const result = extractHashesFromBrief(brief);
    expect(result).not.toBeNull();
    expect(result!.wiringHash).toBe("a".repeat(40));
    expect(result!.directionHash).toBe("b".repeat(40));
  });

  it("returns null when hashes are missing", () => {
    expect(extractHashesFromBrief("# Authoring Brief\nNo hashes here.")).toBeNull();
  });
});
