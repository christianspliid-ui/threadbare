import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";
import {
  hashContent,
  hashBriefSource,
  extractSection,
  distillCapabilitySection,
  extractCapabilitySection,
  extractPrinciplesSections,
  extractRejectionTriggers,
  buildBrief,
  extractHashesFromBrief,
  AUTHORING_BRIEF_MAX_LINES,
  AUTHORING_BRIEF_OUTPUT_PATH,
  AUTHORING_BRIEF_SOURCES,
  AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES,
  AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES,
  AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH,
  AUTHORING_BRIEF_CAPABILITIES,
  DIRECTION_DOC_RELPATH,
  WIRING_GUIDE_RELPATH,
  ENCOUNTER_PIPELINE_SKILL_RELPATH,
  type BriefSourceContents,
} from "../build-authoring-brief";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// Minimal fake wiring guide carrying every declared capability (THR-1695: not a 1..7 range)
function makeWiringGuide(overrides: Partial<Record<number, string>> = {}): string {
  const caps = AUTHORING_BRIEF_CAPABILITIES.map((n) => {
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

// Minimal fake encounter-pipeline SKILL carrying an N-entry rejection-trigger list, plus a
// section on either side so the extractor's boundaries are actually exercised.
function makeSkill(triggerCount = 3): string {
  return [
    "# encounter-pipeline",
    "",
    "## Pass 2: Editorial",
    "",
    "Some other section.",
    "",
    "**Automatic REVISE triggers** (non-negotiable):",
    ...Array.from(
      { length: triggerCount },
      (_, idx) => `${idx + 1}. **Trigger ${idx + 1}** — the first thing that forces a revise`,
    ),
    "",
    "### Pass 3: Systems Audit",
    "",
    "Trailing content.",
  ].join("\n");
}

const GENERATED_AT = "2026-08-25";

/** A canon page with the seams block Section F compiles from (THR-1300). */
function makeUndertakingsCanon(): string {
  return [
    "# Canon — Undertakings",
    "",
    "## Current spec",
    "",
    "### The template and its authored seams",
    "",
    "- **Identity** — `id`, `displayName`, `verb`.",
    "- **Kind membership** — one row, one column.",
    "",
    "### The kind registry",
    "",
    "Eight rows.",
  ].join("\n");
}

/** Build a brief from the fakes, overriding whichever source the test is about. */
function build(overrides: Partial<BriefSourceContents> = {}): string {
  const sources: BriefSourceContents = {
    wiringGuide: makeWiringGuide(),
    directionDoc: makeDirectionDoc(),
    skill: makeSkill(),
    undertakingsCanon: makeUndertakingsCanon(),
    ...overrides,
  };
  const hashes = AUTHORING_BRIEF_SOURCES.map((relPath, idx) =>
    hashBriefSource(relPath, [sources.wiringGuide, sources.directionDoc, sources.skill, sources.undertakingsCanon][idx]),
  );
  return buildBrief(sources, hashes, GENERATED_AT);
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
  it("produces a non-empty string", () => {
    expect(build().length).toBeGreaterThan(0);
  });

  it("includes the version header with one hash stamp per source", () => {
    const brief = build();
    for (const relPath of AUTHORING_BRIEF_SOURCES) {
      expect(brief).toContain(`>   - ${relPath} (sha1: `);
    }
    expect(brief).toContain(`**Generated:** ${GENERATED_AT}`);
  });

  it("refuses a hash list that does not match the declared sources", () => {
    const sources: BriefSourceContents = {
      wiringGuide: makeWiringGuide(),
      directionDoc: makeDirectionDoc(),
      skill: makeSkill(),
      undertakingsCanon: makeUndertakingsCanon(),
    };
    expect(() => buildBrief(sources, ["a".repeat(40)], GENERATED_AT)).toThrow(
      `expected ${AUTHORING_BRIEF_SOURCES.length} source hashes`,
    );
  });

  it("compiles Section F from the canon page's seams block, and refuses an empty one (THR-1300)", () => {
    const brief = build();
    expect(brief).toContain("## Section F: Undertakings");
    expect(brief).toContain("- **Kind membership** — one row, one column.");
    expect(brief).not.toContain("Eight rows.");
    expect(() => build({ undertakingsCanon: "# Canon — Undertakings\n\n### The template and its authored seams\n\n### The kind registry\n" }))
      .toThrow("Section F would compile empty");
  });

  it("includes every declared capability heading, and only those", () => {
    const brief = build();
    for (const n of AUTHORING_BRIEF_CAPABILITIES) {
      expect(brief).toContain(`### Capability ${n}:`);
    }
    expect(brief.match(/^### Capability \d+:/gm)).toHaveLength(AUTHORING_BRIEF_CAPABILITIES.length);
    expect(brief).toContain(`## Section B: The ${AUTHORING_BRIEF_CAPABILITIES.length} Engine Capabilities`);
  });

  it("includes Sections A, D and E", () => {
    const brief = build();
    expect(brief).toContain("Section A: Register and Narrator Mode");
    expect(brief).toContain("Section D: Player-as-God Framing Constraint");
    expect(brief).toContain("Section E: Editorial Rejection Triggers");
    expect(brief).toContain("REVISE BEFORE CONTINUING");
  });

  it("is deterministic — 5 identical runs produce byte-identical output", () => {
    const results = Array.from({ length: 5 }, () => build());
    for (const r of results) {
      expect(r).toBe(results[0]);
    }
  });

  it("stays within the total line budget", () => {
    const lineCount = build().split("\n").length - 1;
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
    expect(() => build({ wiringGuide: makeWiringGuide({ 1: longCap1 }) })).toThrow(
      "AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES",
    );
  });

  it("throws when source has missing capability anchor", () => {
    const badWiring =
      "# Wiring Guide\n## Part 2\n### Capability 1: Only One\n\nStatement.\n\n**Why this changes what you write:** Reason.\n\n## Part 3";
    expect(() => build({ wiringGuide: badWiring })).toThrow("Expected anchor not found");
  });
});


describe("extractRejectionTriggers", () => {
  it("pulls every numbered entry under the anchor", () => {
    const triggers = extractRejectionTriggers(makeSkill(4).split("\n"));
    expect(triggers).toHaveLength(4);
    expect(triggers[0]).toBe("1. **Trigger 1** — the first thing that forces a revise");
    expect(triggers[3]).toBe("4. **Trigger 4** — the first thing that forces a revise");
  });

  it("stops at the first non-numbered line after the list", () => {
    const triggers = extractRejectionTriggers(makeSkill(2).split("\n"));
    expect(triggers.join("\n")).not.toContain("Pass 3");
  });

  // The whole point of deriving: the count is whatever the SKILL says, never a number
  // frozen in this generator. Section E was six behind the live list for months.
  it("tracks the SKILL's count rather than a fixed one", () => {
    expect(extractRejectionTriggers(makeSkill(9).split("\n"))).toHaveLength(9);
    expect(extractRejectionTriggers(makeSkill(40).split("\n"))).toHaveLength(40);
  });

  it("throws when the anchor is missing", () => {
    expect(() => extractRejectionTriggers(["# Skill", "", "no triggers here"])).toThrow(
      "Expected anchor not found",
    );
  });

  it("throws rather than compiling an empty Section E", () => {
    const skill = ["**Automatic REVISE triggers** (non-negotiable):", "", "### Pass 3"];
    expect(() => extractRejectionTriggers(skill)).toThrow("Section E would compile empty");
  });
});

describe("hashBriefSource", () => {
  it("hashes a prose doc whole-file", () => {
    const doc = makeDirectionDoc();
    expect(hashBriefSource(DIRECTION_DOC_RELPATH, doc)).toBe(hashContent(doc));
  });

  // Precision matters: if the SKILL were hashed whole-file, every unrelated edit to an
  // 800-line skill would restamp the brief and train the lane to regenerate on noise.
  it("hashes the SKILL on its trigger block alone, so unrelated edits do not restamp", () => {
    const before = makeSkill(3);
    const after = before.replace("Some other section.", "Some other section, reworded entirely.");
    expect(after).not.toBe(before);
    expect(hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, after)).toBe(
      hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, before),
    );
  });

  it("changes when a trigger is added, removed, or reworded", () => {
    const three = hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, makeSkill(3));
    const four = hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, makeSkill(4));
    expect(three).not.toBe(four);

    const reworded = makeSkill(3).replace("**Trigger 2**", "**Trigger 2 (revised)**");
    expect(hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, reworded)).not.toBe(three);
  });
});

describe("extractHashesFromBrief", () => {
  function briefWithStamps(...hashes: string[]): string {
    return [
      "# Authoring Brief",
      "> **Generated:** 2026-08-25",
      "> **Sources:**",
      ...hashes.map((h, idx) => `>   - source-${idx} (sha1: ${h})`),
    ].join("\n");
  }

  it("extracts one hash per declared source, positionally", () => {
    const stamps = AUTHORING_BRIEF_SOURCES.map((_, idx) => String(idx).repeat(40).slice(0, 40));
    const result = extractHashesFromBrief(briefWithStamps(...stamps, "f".repeat(40)));
    expect(result).not.toBeNull();
    expect(result!.sourceHashes).toEqual(stamps);
  });

  it("extracts the hardcoded-sections hash as the stamp after the sources", () => {
    const stamps = AUTHORING_BRIEF_SOURCES.map(() => "a".repeat(40));
    expect(extractHashesFromBrief(briefWithStamps(...stamps, "c".repeat(40)))!.sectionsHash).toBe(
      "c".repeat(40),
    );
  });

  it("returns null when hashes are missing", () => {
    expect(extractHashesFromBrief("# Authoring Brief\nNo hashes here.")).toBeNull();
  });

  // A brief written before a source was added carries fewer stamps than there are sources.
  // Reporting the shortfall as null (never undefined) is what makes every caller read it as
  // drifted and regenerate, instead of comparing `undefined === undefined` and passing.
  it("reports a missing stamp as null so callers regenerate", () => {
    const result = extractHashesFromBrief(briefWithStamps("a".repeat(40), "b".repeat(40)));
    expect(result!.sourceHashes[AUTHORING_BRIEF_SOURCES.length - 1]).toBeNull();
    expect(result!.sectionsHash).toBeNull();
    expect(result!.sectionsHash).not.toBe(AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH);
  });
});

// THR-1185. The hardcoded generator sections sat on the pre-THR-772 nudge pivot for months,
// because the freshness check compared only AUTHORING_BRIEF_SOURCES. These pin the post-pivot
// wording with LITERAL strings rather than by re-reading the constants, so the assertions
// cannot go tautological the way a constant-on-both-sides test does — if someone reverts the
// constant, these fail.
describe("Sections A/D/E carry the current model", () => {
  const brief = build();

  it("does not instruct authors to write per-step approach cards", () => {
    // The rejected model. Live SKILL.md trigger 14 rejects exactly what this used to demand.
    expect(brief).not.toContain("Missing per-step approach cards");
    expect(brief).not.toContain("approach cards");
  });

  it("does not present the pre-pivot god-verb menu as the choice vocabulary", () => {
    expect(brief).not.toContain("whisper, send vision, steady, strengthen, withdraw");
    expect(brief).not.toContain("whisper / send vision / steady / strengthen / withdraw");
    expect(brief).not.toContain("reframed as divine intervention");
  });

  it("frames every player-facing option as a nudge", () => {
    expect(brief).toContain("Influence, never authorship");
    expect(brief).toContain("reframed as a nudge hand");
    expect(brief).toContain("a hand is an offer, not a toll gate");
  });

  it("stamps the hardcoded sections into the header so a reword invalidates the brief", () => {
    expect(brief).toContain(`sha1: ${AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH}`);
  });
});

// THR-1250. The compiled preamble opened on April design principles and carried no register
// rule at all, so every draft agent met the pre-pivot aesthetic frame before it met a voice
// constraint — and three consecutive director-level register rulings failed to hold. These pin
// the fix with literal strings: the register section exists, it leads, and it says the rules.
describe("Section A leads the brief and carries the register model", () => {
  const brief = build();

  it("is the first section in the document", () => {
    const sectionOrder = brief
      .split("\n")
      .filter((l) => /^## Section [A-E]/.test(l))
      .map((l) => l.slice("## Section ".length, "## Section ".length + 1));
    expect(sectionOrder).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("declares that it governs the sections after it", () => {
    expect(brief).toContain("This section governs every other section in this brief");
  });

  it("carries narrator mode, the three registers, and the baseline default", () => {
    expect(brief).toContain("Narrate, never inhabit");
    expect(brief).toContain("State facts; never encode them");
    expect(brief).toContain("Absent declaration means baseline");
    expect(brief).toContain("Interactive text is always plain");
    expect(brief).toContain("clarity beats compression");
  });

  it("inlines both register exemplars, right and wrong", () => {
    expect(brief).toContain("The merchant Oren owes money to six people");
    expect(brief).toContain("The merchant's ambit had grown parlous");
    expect(brief).toContain("The bells stopped.");
  });

  it("restates the clamp inside Section C, which is injected on its own", () => {
    const sectionC = brief.slice(brief.indexOf("## Section C"), brief.indexOf("## Section D"));
    expect(sectionC).toContain("Section A governs every principle below");
  });
});

// THR-1250. Section E was a hardcoded copy six triggers behind the live SKILL, with no
// freshness signal, and the missing six included the rule that clarity beats compression.
describe("Section E is derived from the SKILL, not copied", () => {
  it("renders exactly the SKILL's triggers, in order", () => {
    const brief = build({ skill: makeSkill(5) });
    for (let n = 1; n <= 5; n++) {
      expect(brief).toContain(`${n}. **Trigger ${n}**`);
    }
    expect(brief).not.toContain("6. **Trigger 6**");
  });

  it("grows with the SKILL — no count is frozen in the generator", () => {
    expect(build({ skill: makeSkill(31) })).toContain("31. **Trigger 31**");
    expect(build({ skill: makeSkill(32) })).toContain("32. **Trigger 32**");
  });

  it("names the SKILL as a stamped source so divergence is visible", () => {
    const skill = makeSkill(3);
    const brief = build({ skill });
    expect(brief).toContain(ENCOUNTER_PIPELINE_SKILL_RELPATH);
    expect(brief).toContain(`sha1: ${hashBriefSource(ENCOUNTER_PIPELINE_SKILL_RELPATH, skill)}`);
  });

  it("refuses to compile a brief whose SKILL has no trigger list", () => {
    expect(() => build({ skill: "# Skill\n\nNothing here." })).toThrow("Expected anchor not found");
  });
});

// THR-1250. The whole ticket in one assertion: the rejected authored-futures example that
// principle 2 taught for four months must not reach a draft agent by any path.
describe("the rejected player-choice framing does not reach the brief", () => {
  it("is absent from the compiled brief", () => {
    const realDirectionDoc = fs.readFileSync(
      path.join(repoRoot, DIRECTION_DOC_RELPATH),
      "utf8",
    );
    const brief = build({ directionDoc: realDirectionDoc });
    expect(brief).not.toContain("fight or to flee");
    expect(brief).not.toContain("Multiple Meaningful Choices");
  });

  it("is absent from the committed brief on disk", () => {
    const committed = fs.readFileSync(path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH), "utf8");
    expect(committed).not.toContain("fight or to flee");
    expect(committed).toContain("## Section A:");
  });
});

// THR-1695 — the brief compiled a frozen 1..7 slice of the guide, so the Nudge Hand never
// reached it, Cap 7 compiled its retired choice card under the banner retiring it, and Cap 2
// taught the deprecated `encounterFamily` seed. Regenerating from current sources changed nothing.
describe("capabilities are selected by declaration and honour superseding banners (THR-1695)", () => {
  it("stops a capability at the next capability heading whatever its number", () => {
    const lines = [
      "### Capability 4: Four",
      "",
      "Statement four.",
      "",
      "### Capability 22: Twenty-two",
      "",
      "```ts",
      "{ kind: 'belongs_to_22' }",
      "```",
      "",
      "### Capability 5: Five",
    ];
    const joined = extractCapabilitySection(lines, 4).join("\n");
    expect(joined).toContain("Statement four.");
    expect(joined).not.toContain("belongs_to_22");
  });

  it("compiles a superseding banner instead of the retired code block below it", () => {
    const section = [
      "### Capability 7: Choices",
      "",
      "Statement.",
      "",
      "> **⚠️ The old choice set is retired.** Here is what replaced it:",
      ">",
      "> | Case | Result |",
      "> |---|---|",
      "> | nudges | the nudge stage |",
      "",
      "```ts",
      "{ interventionType: 'coercive' }",
      "```",
      "",
      "**Why this changes what you write:** Reason.",
    ];
    const joined = distillCapabilitySection(section, 7).join("\n");
    expect(joined).toContain("> **⚠️ The old choice set is retired.**");
    expect(joined).toContain("> | nudges | the nudge stage |");
    expect(joined).not.toContain("interventionType");
    expect(joined).toContain("**Why this changes what you write:** Reason.");
  });

  it("does not fold a banner into the first paragraph when it follows the heading directly", () => {
    const section = ["### Capability 7: Choices", "", "> **⚠️ Retired.**", "> Use nudges.", ""];
    const result = distillCapabilitySection(section, 7);
    expect(result.filter((l) => l === "> **⚠️ Retired.**")).toHaveLength(1);
  });

  describe("against the real wiring guide", () => {
    const realWiring = fs.readFileSync(path.join(repoRoot, WIRING_GUIDE_RELPATH), "utf8");
    const brief = build({ wiringGuide: realWiring });

    it("compiles the Nudge Hand and the carryover factor lines", () => {
      expect(brief).toContain("### Capability 14: The Nudge Hand");
      expect(brief).toContain("### Capability 17: Carryover Factor Lines");
    });

    it("compiles no retired choice card and no live encounterFamily seed", () => {
      expect(brief).not.toContain("interventionType: 'coercive'");
      expect(brief).not.toMatch(/^\s*encounterFamily:/m);
      expect(brief).toContain("query: { kind: 'encounter_template'");
    });

    it("compiles Cap 7's banner, which says no choice buys odds", () => {
      expect(brief).toContain("The engine no longer generates a generic choice set");
    });
  });

  it("the committed brief carries the Nudge Hand and no retired choice card", () => {
    const committed = fs.readFileSync(path.join(repoRoot, AUTHORING_BRIEF_OUTPUT_PATH), "utf8");
    expect(committed).toContain("### Capability 14: The Nudge Hand");
    expect(committed).not.toContain("interventionType: 'coercive'");
    expect(committed).not.toMatch(/^\s*encounterFamily:/m);
  });
});

describe("the generator stamp covers the capability selection (THR-1695 review gate)", () => {
  it("folds the declared list, banner pattern and extraction version into the stamp", async () => {
    const src = fs.readFileSync(path.join(repoRoot, "scripts", "build-authoring-brief.ts"), "utf8");
    const stampBlock = src.slice(src.indexOf("AUTHORING_BRIEF_HARDCODED_SECTIONS_HASH = hashContent("));
    const body = stampBlock.slice(0, stampBlock.indexOf(");"));
    expect(body).toContain("AUTHORING_BRIEF_CAPABILITIES");
    expect(body).toContain("SUPERSEDING_BANNER_PATTERN");
    expect(body).toContain("AUTHORING_BRIEF_EXTRACTION_VERSION");
  });
});
