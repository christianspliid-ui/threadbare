/**
 * Rulebook lint signals — five functions consumed by scripts/drift-scan/index.ts (S6–S10).
 *
 * Each function is pure (no Linear calls, no file I/O beyond what is passed in or resolved from
 * repoRoot) so it can be unit-tested in isolation.  The caller reads the markdown files and passes
 * the text strings; this module handles parsing and comparison logic only.
 *
 * The `SignalResult` type below is structurally compatible with the same type exported from
 * `scripts/drift-scan/index.ts`.  Kept local to avoid a circular import.
 */

import fs from "node:fs";
import path from "node:path";

export type SignalResult =
  | { status: "green" }
  | { status: "skipped"; reason: string }
  | { status: "red"; summary: string; body: string };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readFile(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// S6 — Rulebook → UL
//
// Parses every `Definitions:` line in the rulebook's authority-boundary footers.
// For each `Docs/ubiquitous-language/<Shard>.md` reference, verifies the shard
// file exists.  If the reference includes a parenthesised term list like
// `(Ascendant, Avatar, Thread)`, also verifies each term appears (case-insensitive)
// inside the shard file.
// ---------------------------------------------------------------------------

interface UlRef {
  filePath: string; // e.g. "Docs/ubiquitous-language/Agents.md"
  terms: string[]; // e.g. ["Ascendant", "Avatar", "Thread"]
}

function parseDefinitionsRefs(text: string): UlRef[] {
  const results: UlRef[] = [];
  const linePattern = /^[ \t]*Definitions:[ \t]*(.+)$/gm;
  let lineMatch: RegExpExecArray | null;
  while ((lineMatch = linePattern.exec(text)) !== null) {
    const lineContent = lineMatch[1];
    const refPattern =
      /(Docs\/ubiquitous-language\/[A-Za-z0-9_.-]+\.md)(?:\s*\(([^)]+)\))?/g;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refPattern.exec(lineContent)) !== null) {
      const filePath = refMatch[1];
      const termsStr = refMatch[2] ?? "";
      const terms = termsStr
        ? termsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      results.push({ filePath, terms });
    }
  }
  return results;
}

/**
 * S6: verify every UL shard file cited in rulebook `Definitions:` lines exists and
 * contains each named term.
 */
export function lintRulebookVsUl(rulebookText: string, repoRoot: string): SignalResult {
  const refs = parseDefinitionsRefs(rulebookText);
  if (refs.length === 0) {
    return { status: "skipped", reason: "no Definitions: lines found in rulebook" };
  }

  const missingFiles: string[] = [];
  const missingTerms: Array<{ file: string; term: string }> = [];

  for (const ref of refs) {
    const absPath = path.join(repoRoot, ref.filePath);
    const fileText = readFile(absPath);
    if (fileText === null) {
      missingFiles.push(ref.filePath);
      continue;
    }
    for (const term of ref.terms) {
      if (!fileText.toLowerCase().includes(term.toLowerCase())) {
        missingTerms.push({ file: ref.filePath, term });
      }
    }
  }

  if (missingFiles.length === 0 && missingTerms.length === 0) {
    return { status: "green" };
  }

  const lines: string[] = ["## Rulebook → UL drift"];

  if (missingFiles.length > 0) {
    lines.push(
      "",
      `${missingFiles.length} UL shard file(s) referenced in Definitions: but missing:`,
      "",
      "| Referenced file |",
      "|---|",
      ...missingFiles.map((f) => `| \`${f}\` |`),
    );
  }

  if (missingTerms.length > 0) {
    lines.push(
      "",
      `${missingTerms.length} term(s) listed in Definitions: parens but not found in the shard:`,
      "",
      "| Shard | Term |",
      "|---|---|",
      ...missingTerms.map((mt) => `| \`${mt.file}\` | ${mt.term} |`),
    );
  }

  lines.push(
    "",
    "Recommendation: update the UL shard file or correct the Definitions: reference in the rulebook canon page.",
  );

  const count = missingFiles.length + missingTerms.length;
  return {
    status: "red",
    summary: `${count} UL reference(s) broken in rulebook Definitions:`,
    body: lines.join("\n"),
  };
}

// ---------------------------------------------------------------------------
// S7 — Rulebook → Canon pages
//
// Parses every `Spec:` line in the rulebook's authority-boundary footers.
// For each `Docs/canon/<page>.md` reference, verifies the file exists.
// ---------------------------------------------------------------------------

function parseSpecRefs(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const linePattern = /^[ \t]*Spec:[ \t]*(.+)$/gm;
  let lineMatch: RegExpExecArray | null;
  while ((lineMatch = linePattern.exec(text)) !== null) {
    const lineContent = lineMatch[1];
    const refPattern = /Docs\/canon\/([A-Za-z0-9_.-]+\.md)/g;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refPattern.exec(lineContent)) !== null) {
      const filePath = `Docs/canon/${refMatch[1]}`;
      if (!seen.has(filePath)) {
        seen.add(filePath);
        results.push(filePath);
      }
    }
  }
  return results;
}

/**
 * S7: verify every canon page cited in rulebook `Spec:` lines exists on disk.
 */
export function lintRulebookVsCanon(rulebookText: string, repoRoot: string): SignalResult {
  const specRefs = parseSpecRefs(rulebookText);
  if (specRefs.length === 0) {
    return { status: "skipped", reason: "no Spec: lines found in rulebook" };
  }

  const missing = specRefs.filter((filePath) => {
    const absPath = path.join(repoRoot, filePath);
    return !fs.existsSync(absPath);
  });

  if (missing.length === 0) {
    return { status: "green" };
  }

  return {
    status: "red",
    summary: `${missing.length} canon page(s) referenced in Spec: but not yet created`,
    body: [
      "## Rulebook → Canon page drift",
      "",
      "The rulebook's authority-boundary footers reference canon pages that do not exist:",
      "",
      "| Missing canon page |",
      "|---|",
      ...missing.map((f) => `| \`${f}\` |`),
      "",
      "Recommendation: create the missing canon pages, or remove the Spec: reference from the rulebook footers if no separate canon page is warranted.",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// S8 — Rulebook IMPL tags → Code
//
// Parses every `[IMPL — \`IDENTIFIER\` … in [text](../../path.ts)]` tag.
// For each tag that links to a TypeScript source file, verifies:
//   1. The linked file exists.
//   2. The identifier (first word/token of the backtick content) appears in the file.
//
// Tags whose URLs do not end in `.ts` or `.tsx` (e.g. links to CLAUDE.md or
// directories) are silently skipped — they are not code-drift targets.
// ---------------------------------------------------------------------------

interface ImplRef {
  identifier: string; // e.g. "TICKS_PER_DAY"
  relPath: string; // e.g. "../../src/data/attention-constants.ts"
}

function parseImplRefs(text: string): ImplRef[] {
  // Match: [IMPL — `CONTENT` [optional prose] in [link-text](../../path.ts[:N])]
  // The em-dash (—) may also be an en-dash or hyphen.
  const pattern =
    /\[IMPL\s*[—–-]\s*`([^`\n]+)`[^\n]*?\bin\b\s*\[[^\]\n]+\]\((\.\.\/\.\.\/[^\s)]+\.(?:ts|tsx))\)/g;
  const results: ImplRef[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const backtickContent = match[1];
    const relPath = match[2];
    // Extract the first valid identifier token (e.g. "TICKS_PER_DAY" from "TICKS_PER_DAY = 12")
    const identMatch = backtickContent.match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (!identMatch) continue;
    results.push({ identifier: identMatch[1], relPath });
  }
  return results;
}

/**
 * S8: verify every IMPL tag in the rulebook points to an existing file that
 * contains the cited identifier.
 */
export function lintRulebookVsCode(rulebookText: string, repoRoot: string): SignalResult {
  const refs = parseImplRefs(rulebookText);
  if (refs.length === 0) {
    return { status: "skipped", reason: "no parseable IMPL tags with TypeScript file links found" };
  }

  // IMPL paths are relative to Docs/canon/ (the rulebook's location)
  const canonDir = path.join(repoRoot, "Docs", "canon");
  const missingFiles: ImplRef[] = [];
  const missingIdentifiers: ImplRef[] = [];

  for (const ref of refs) {
    const absPath = path.resolve(canonDir, ref.relPath);
    const fileText = readFile(absPath);
    if (fileText === null) {
      missingFiles.push(ref);
      continue;
    }
    if (!fileText.includes(ref.identifier)) {
      missingIdentifiers.push(ref);
    }
  }

  if (missingFiles.length === 0 && missingIdentifiers.length === 0) {
    return { status: "green" };
  }

  const lines: string[] = ["## Rulebook IMPL tags — broken code references"];

  if (missingFiles.length > 0) {
    lines.push(
      "",
      `${missingFiles.length} IMPL tag(s) point to files that do not exist:`,
      "",
      "| Identifier | File |",
      "|---|---|",
      ...missingFiles.map((r) => `| \`${r.identifier}\` | \`${r.relPath}\` |`),
    );
  }

  if (missingIdentifiers.length > 0) {
    lines.push(
      "",
      `${missingIdentifiers.length} IMPL tag(s) reference identifiers not found in the linked file:`,
      "",
      "| Identifier | File |",
      "|---|---|",
      ...missingIdentifiers.map((r) => `| \`${r.identifier}\` | \`${r.relPath}\` |`),
    );
  }

  lines.push(
    "",
    "Recommendation: update the IMPL tag to match the current identifier and file, or remove the tag if the implementation no longer exists.",
  );

  const count = missingFiles.length + missingIdentifiers.length;
  return {
    status: "red",
    summary: `${count} IMPL tag(s) with broken code references`,
    body: lines.join("\n"),
  };
}

// ---------------------------------------------------------------------------
// S9 — Rulebook → Vision
//
// Parses every `Why:` line in the rulebook's authority-boundary footers.
// For each `TheFantasyWorldSimulator/Vision/<file>.md` reference, verifies the
// file exists in the Obsidian vault at
// `<obsidianVaultPath>/TheFantasyWorldSimulator/Vision/<file>.md`.
//
// Skips (rather than red) when `obsidianVaultPath` is not provided — Vision files
// live outside the repo; CI must set `OBSIDIAN_VAULT_PATH` to enable this check.
// ---------------------------------------------------------------------------

function parseVisionRefs(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const linePattern = /^[ \t]*Why:[ \t]*(.+)$/gm;
  let lineMatch: RegExpExecArray | null;
  while ((lineMatch = linePattern.exec(text)) !== null) {
    const lineContent = lineMatch[1];
    const refPattern = /TheFantasyWorldSimulator\/Vision\/([A-Za-z0-9_.-]+\.md)/g;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refPattern.exec(lineContent)) !== null) {
      const filename = refMatch[1];
      if (!seen.has(filename)) {
        seen.add(filename);
        results.push(filename);
      }
    }
  }
  return results;
}

/**
 * S9: verify every Vision file cited in rulebook `Why:` lines exists in the Obsidian vault.
 */
export function lintRulebookVsVision(
  rulebookText: string,
  _repoRoot: string,
  obsidianVaultPath?: string,
): SignalResult {
  const filenames = parseVisionRefs(rulebookText);
  if (filenames.length === 0) {
    return { status: "skipped", reason: "no Why: lines with Vision references found in rulebook" };
  }

  if (!obsidianVaultPath) {
    return {
      status: "skipped",
      reason: "OBSIDIAN_VAULT_PATH not set — cannot resolve Vision file paths",
    };
  }

  const visionDir = path.join(obsidianVaultPath, "TheFantasyWorldSimulator", "Vision");
  const missing: string[] = [];

  for (const filename of filenames) {
    const absPath = path.join(visionDir, filename);
    if (!fs.existsSync(absPath)) {
      missing.push(filename);
    }
  }

  if (missing.length === 0) {
    return { status: "green" };
  }

  return {
    status: "red",
    summary: `${missing.length} Vision file(s) referenced in Why: but not found`,
    body: [
      "## Rulebook → Vision drift",
      "",
      `Vision files referenced in Why: lines but missing from \`${visionDir}\`:`,
      "",
      "| Missing Vision file |",
      "|---|",
      ...missing.map((f) => `| \`TheFantasyWorldSimulator/Vision/${f}\` |`),
      "",
      "Recommendation: create the missing Vision file in the Obsidian vault, or update the Why: reference to the correct filename.",
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// S10 — Quick-reference vs Rulebook
//
// Cross-checks a small set of factual claims that the quick-reference asserts
// against the rulebook.  Detects the common failure mode where one file is
// updated and the other is not: e.g. a reach is renamed, or the tick count
// changes, and only one of the two documents is edited.
//
// Checks:
//   1. Ticks per day (numeric).
//   2. Doom stage names (Whispers, Signs, Tremors, Crisis, Culmination or whatever is listed).
//   3. Reach names (each name the quick-ref lists must appear in the rulebook).
//   4. Verb list (Create, Find, Change, Destroy, Control or whatever is listed).
// ---------------------------------------------------------------------------

function extractTicksPerDay(text: string): number | null {
  const m = text.match(/\b(\d+)\s+ticks?\s+per\s+day\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractDoomStageNames(text: string): string[] {
  // Matches "N stages: Name1, Name2, ..." or "stages: Name1, Name2, ..."
  const m = text.match(/\d+\s+stages?:\s*\*?\*?([^\n*]+)\*?\*?/i);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

function extractReachNames(text: string): string[] {
  // Matches "Eight Reaches (what you do): Iron, Gold, ..." or "Eight Reaches: Iron, ..."
  const m = text.match(/(?:Eight\s+)?Reaches[^:\n]*:\s*([^\n]+)/i);
  if (!m) return [];
  return m[1]
    .split(/[,\s]+/)
    .map((s) => s.replace(/[*_[\]()]/g, "").trim())
    .filter((s) => /^[A-Z][a-z]+$/.test(s));
}

function extractVerbList(text: string): string[] {
  // Matches "Five verbs: Create, Find, ..." or "five verbs: **Create, Find, ...**"
  const m = text.match(/(?:five\s+)?verbs?:\s*\*?\*?([^\n*]+)\*?\*?/i);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

/**
 * S10: cross-check factual claims in the quick-reference against the rulebook.
 */
export function lintQuickReferenceVsRulebook(
  quickRefText: string,
  rulebookText: string,
): SignalResult {
  const divergences: string[] = [];

  // 1. Ticks per day
  const qrTicks = extractTicksPerDay(quickRefText);
  const rbTicks = extractTicksPerDay(rulebookText);
  if (qrTicks !== null && rbTicks !== null && qrTicks !== rbTicks) {
    divergences.push(
      `Ticks per day: quick-ref says **${qrTicks}**, rulebook says **${rbTicks}**`,
    );
  }

  // 2. Doom stage names
  const qrStages = extractDoomStageNames(quickRefText);
  if (qrStages.length > 0) {
    const missingStages = qrStages.filter(
      (s) => !rulebookText.toLowerCase().includes(s.toLowerCase()),
    );
    if (missingStages.length > 0) {
      divergences.push(
        `Doom stage name(s) in quick-ref not found in rulebook: ${missingStages.join(", ")}`,
      );
    }
  }

  // 3. Reach names
  const qrReaches = extractReachNames(quickRefText);
  if (qrReaches.length > 0) {
    const missingReaches = qrReaches.filter((r) => !rulebookText.includes(r));
    if (missingReaches.length > 0) {
      divergences.push(
        `Reach name(s) in quick-ref not found in rulebook: ${missingReaches.join(", ")}`,
      );
    }
  }

  // 4. Verb list
  const qrVerbs = extractVerbList(quickRefText);
  if (qrVerbs.length > 0) {
    const missingVerbs = qrVerbs.filter((v) => !rulebookText.includes(v));
    if (missingVerbs.length > 0) {
      divergences.push(
        `Verb(s) in quick-ref not found in rulebook: ${missingVerbs.join(", ")}`,
      );
    }
  }

  if (divergences.length === 0) {
    return { status: "green" };
  }

  return {
    status: "red",
    summary: `${divergences.length} factual divergence(s) between quick-reference and rulebook`,
    body: [
      "## Quick-reference vs rulebook drift",
      "",
      "Factual claims in the quick-reference do not match the rulebook:",
      "",
      ...divergences.map((d) => `- ${d}`),
      "",
      "Recommendation: update the quick-reference or the rulebook so both sources agree on these facts.",
    ].join("\n"),
  };
}
