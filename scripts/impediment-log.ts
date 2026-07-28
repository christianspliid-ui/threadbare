/**
 * Shared parser for `Docs/impediments.md`.
 *
 * The log has grown **two** entry formats in practice, and until THR-764 both of
 * its consumers — `generate-impediment-dashboard.ts` and `retro-draft.ts` —
 * parsed only the first:
 *
 * 1. **Numbered table rows** — `| 209 | 1 | 2026-07-25 | process | … |`, the
 *    format the log's own "Log Format" header documents as canonical.
 * 2. **Trailing paragraphs** — `**New <date> (<session>) — <category> (<impact>):
 *    <headline>.** body | consequence | S | Yes | workaround | context.`
 *    Pipe-separated fields, but no leading `|`.
 *
 * Both consumers gated on `line.startsWith("|")`, so every paragraph-form entry
 * was invisible to the dashboard *and* to the weekly retrospective draft — the
 * project's only mechanism for noticing recurring friction had been running on
 * pre-2026-07-02 data while July's entries accumulated unseen.
 *
 * This module is the single parse surface for both. It recognises both forms and
 * normalises them into one {@link ImpedimentEntry} shape, so a consumer never has
 * to know which form an entry was authored in.
 *
 * **Table form remains canonical.** {@link parseImpedimentLog} reports the
 * paragraph-form count so callers can warn; the goal is convergence on rows, not
 * blessing of a second format.
 */

/** Which of the log's two formats an entry was authored in. */
export type ImpedimentForm = "table" | "paragraph";

/** Impact bucket. `Unknown` covers entries that declare none (prose-only paragraphs). */
export type ImpedimentImpact = "S" | "M" | "L" | "Blocked" | "Unknown";

export type ImpedimentEntry = {
  /** Display reference: the `#` column for table rows, `P<n>` for paragraph entries. */
  num: string;
  /** Numeric id, unique across both forms. Paragraph entries are offset by {@link PARAGRAPH_ID_BASE}. */
  id: number;
  count: number;
  date: string;
  category: string;
  description: string;
  consequence: string;
  /** Normalised bucket, for time-cost maths and typed aggregation. */
  impact: ImpedimentImpact;
  /**
   * The Impact column exactly as authored. Dozens of older rows carry prose here
   * (an unescaped `|` in the description shifted every column right) or a
   * qualified value like `Blocked (workaround available)`; the dashboard has
   * always rendered that text verbatim, so normalising it in place would rewrite
   * 30 existing entries for no gain.
   */
  impactRaw: string;
  workaroundFound: boolean;
  /** The un-coerced `Workaround Found?` text, for consumers that render it verbatim. */
  workaroundFoundRaw: string;
  workaround: string;
  session: string;
  form: ImpedimentForm;
  /** 1-indexed source line, for warning messages. */
  line: number;
};

export type ParseResult = {
  entries: ImpedimentEntry[];
  tableCount: number;
  paragraphCount: number;
  /** Non-fatal parse notes (malformed rows). Never thrown — the log must stay readable. */
  warnings: string[];
};

/**
 * Paragraph entries carry no `#`, so they need synthetic ids. A high band keeps
 * them collision-free against the numbered rows (currently <300) no matter how
 * many rows are appended later, and makes a synthetic id obvious on sight.
 */
export const PARAGRAPH_ID_BASE = 9000;

/** Paragraph entries have no Count column; each is a single observation. */
export const PARAGRAPH_DEFAULT_COUNT = 1;

/** A complete table row: the 10 columns the log's own header documents. */
export const TABLE_FULL_CELLS = 10;

/**
 * Parse floor for a table row: `#`, Count, Date, Category, Description. Rows that
 * stop short of the full 10 columns still carry an entry's identity, and three in
 * the log do (one truncated mid-sentence, two missing their trailing columns).
 * Dropping them would reproduce the very defect THR-764 fixes, so the short rows
 * parse with their absent fields left empty rather than being skipped.
 */
export const TABLE_MIN_CELLS = 5;

/** Category recorded for the pre-2026-07-04 paragraph entries, which declare none. */
export const UNCATEGORIZED = "uncategorized";

/** Segment values that mark the Impact field inside a paragraph entry's pipe tail. */
const IMPACT_TOKENS = /^(S|M|L|Blocked)$/i;

/**
 * `**New <date> (<session>) — <category> (<impact>): ` — the convention adopted
 * 2026-07-04 and used by 90 of the 97 paragraph entries as of THR-764.
 */
const PARAGRAPH_HEADER =
  /^\*\*New\s+(\d{4}-\d{2}-\d{2})\s*\(([^)]*)\)\s*[—–-]\s*([A-Za-z][\w-]*)\s*\((S|M|L|Blocked)\):\s*/i;

/**
 * `**New <date> (<session>) — ` — the earlier form (2026-07-02/03), which runs
 * straight into a headline with no category or impact declared.
 */
const PARAGRAPH_HEADER_LEGACY = /^\*\*New\s+(\d{4}-\d{2}-\d{2})\s*\(([^)]*)\)\s*[—–-]\s*/i;

/** Any line that opens a paragraph-form entry, whichever header convention it uses. */
const PARAGRAPH_LINE_START = /^\*\*New\s+\d{4}-\d{2}-\d{2}\s*\(/;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeText(value: string): string {
  return value.replaceAll("\u00A0", " ").replace(/\s+/g, " ").trim();
}

export function normalizeImpact(raw: string): ImpedimentImpact {
  const value = normalizeText(raw).toLowerCase();
  if (value === "s") return "S";
  if (value === "m") return "M";
  if (value === "l") return "L";
  if (value === "blocked") return "Blocked";
  return "Unknown";
}

export function parseWorkaroundFound(raw: string): boolean {
  const value = normalizeText(raw).toLowerCase();
  return value === "yes" || value === "true";
}

/**
 * Splits a `| a | b | c |` row into trimmed cells, honouring `\|` escapes.
 *
 * A missing trailing `|` is tolerated: entry #142 is truncated mid-sentence, and
 * requiring the closing pipe silently discarded it. The date and count checks in
 * {@link parseTableRow} are what actually gate a line from becoming an entry, so
 * accepting an unterminated row costs nothing in precision.
 */
export function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  const body = trimmed.endsWith("|") ? trimmed.slice(1, -1) : trimmed.slice(1);
  const cells: string[] = [];
  let current = "";

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    const prev = i > 0 ? body[i - 1] : "";
    if (char === "|" && prev !== "\\") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCount(raw: string): number | null {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTableRow(
  cells: string[],
  lineNumber: number,
  warnings: string[],
): ImpedimentEntry | null {
  if (cells.length < TABLE_MIN_CELLS) {
    warnings.push(`line ${lineNumber}: expected ${TABLE_MIN_CELLS}+ cells, got ${cells.length}`);
    return null;
  }

  if (cells.length < TABLE_FULL_CELLS) {
    warnings.push(
      `line ${lineNumber}: short row (${cells.length} of ${TABLE_FULL_CELLS} columns) — parsed with empty trailing fields`,
    );
  }

  const num = normalizeText(cells[0]);
  const countRaw = normalizeText(cells[1]);
  const date = normalizeText(cells[2]);
  const category = normalizeText(cells[3]);
  const description = normalizeText(cells[4]);

  if (!num || !countRaw || !date || !category || !description) {
    warnings.push(`line ${lineNumber}: missing required cells`);
    return null;
  }

  const count = parseCount(countRaw);
  if (count === null) {
    warnings.push(`line ${lineNumber}: invalid count "${countRaw}"`);
    return null;
  }

  if (!ISO_DATE.test(date)) {
    warnings.push(`line ${lineNumber}: invalid date "${date}"`);
    return null;
  }

  // Short rows leave these undefined; treat an absent column as empty, not as a
  // reason to discard an entry whose identity columns are all present.
  const workaroundFoundRaw = normalizeText(cells[7] ?? "");

  return {
    num,
    id: parseCount(num) ?? lineNumber,
    count,
    date,
    category,
    description,
    consequence: normalizeText(cells[5] ?? ""),
    impact: normalizeImpact(cells[6] ?? ""),
    impactRaw: normalizeText(cells[6] ?? ""),
    workaroundFound: parseWorkaroundFound(workaroundFoundRaw),
    workaroundFoundRaw,
    workaround: normalizeText(cells[8] ?? ""),
    session: normalizeText(cells.slice(9).join(" | ")),
    form: "table",
    line: lineNumber,
  };
}

/**
 * Splits a paragraph entry's pipe tail into the table's field order:
 * `body | consequence | impact | workaroundFound | workaround | context`.
 *
 * The tail is authored prose, so it is not reliably 6 segments — an unescaped `|`
 * inside the body shifts everything right, and 15 of 97 entries carry no field
 * tail at all. Rather than assume a fixed arity, anchor on the one segment with a
 * closed vocabulary (the impact token) and read the other fields off its position.
 * Extra leading segments fold back into the body, which is where the stray pipe
 * came from; a tail with no impact token degrades to body-only.
 */
export function splitParagraphTail(tail: string): {
  description: string;
  consequence: string;
  impact: ImpedimentImpact;
  workaroundFoundRaw: string;
  workaround: string;
  session: string;
} {
  const segments = tail.split("|").map((segment) => normalizeText(segment));
  const impactIndex = segments.findIndex((segment) => IMPACT_TOKENS.test(segment));

  if (impactIndex < 1) {
    return {
      description: normalizeText(tail),
      consequence: "",
      impact: "Unknown",
      workaroundFoundRaw: "",
      workaround: "",
      session: "",
    };
  }

  return {
    description: segments.slice(0, impactIndex - 1).join(" | "),
    consequence: segments[impactIndex - 1] ?? "",
    impact: normalizeImpact(segments[impactIndex]),
    workaroundFoundRaw: segments[impactIndex + 1] ?? "",
    workaround: segments[impactIndex + 2] ?? "",
    session: segments.slice(impactIndex + 3).join(" | "),
  };
}

function parseParagraphEntry(
  line: string,
  lineNumber: number,
  ordinal: number,
): ImpedimentEntry | null {
  const full = PARAGRAPH_HEADER.exec(line);
  const legacy = full ? null : PARAGRAPH_HEADER_LEGACY.exec(line);
  const header = full ?? legacy;
  if (!header) return null;

  const date = header[1];
  const headerSession = normalizeText(header[2] ?? "");
  const category = full ? normalizeText(full[3]).toLowerCase() : UNCATEGORIZED;
  const headerImpact = full ? normalizeImpact(full[4]) : "Unknown";

  // The headline is the remainder of the bold run; the fields follow it.
  const afterHeader = line.slice(header[0].length);
  const boldClose = afterHeader.indexOf("**");
  const headline = normalizeText(boldClose === -1 ? afterHeader : afterHeader.slice(0, boldClose));
  const tail = boldClose === -1 ? "" : afterHeader.slice(boldClose + 2);

  const fields = splitParagraphTail(tail);
  // The header's declared impact wins; the tail's copy is a restatement of it.
  const impact = headerImpact !== "Unknown" ? headerImpact : fields.impact;

  // The headline is the entry's identity — it is what the dashboard and the
  // duplicate-hash clustering key on — so it leads the description, with the
  // body appended rather than replacing it.
  const description = [headline, fields.description].filter(Boolean).join(" ");

  return {
    num: `P${ordinal}`,
    id: PARAGRAPH_ID_BASE + ordinal,
    count: PARAGRAPH_DEFAULT_COUNT,
    date,
    category: category || UNCATEGORIZED,
    description,
    consequence: fields.consequence,
    impact,
    impactRaw: impact === "Unknown" ? "" : impact,
    workaroundFound: parseWorkaroundFound(fields.workaroundFoundRaw),
    workaroundFoundRaw: fields.workaroundFoundRaw,
    workaround: fields.workaround,
    session: [headerSession, fields.session].filter(Boolean).join(" | "),
    form: "paragraph",
    line: lineNumber,
  };
}

/** True for a line that opens a paragraph-form entry. Exported for the count oracle in tests. */
export function isParagraphEntryLine(line: string): boolean {
  return PARAGRAPH_LINE_START.test(line.trim());
}

/** True for a table line that carries an entry (not the header or the `|---|` rule). */
export function isTableEntryLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && !trimmed.startsWith("| # |") && !trimmed.startsWith("|---");
}

/**
 * Parses every entry in the impediment log, in both formats.
 *
 * Fail-soft by construction (NFP #4): a malformed line is recorded in
 * `warnings` and skipped, never thrown — a single bad row must not blank the
 * dashboard or the retro draft.
 */
export function parseImpedimentLog(markdown: string): ParseResult {
  const lines = markdown.split(/\r?\n/);
  const entries: ImpedimentEntry[] = [];
  const warnings: string[] = [];
  let tableCount = 0;
  let paragraphCount = 0;
  let paragraphOrdinal = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (isTableEntryLine(trimmed)) {
      const entry = parseTableRow(splitMarkdownRow(trimmed), lineNumber, warnings);
      if (entry) {
        entries.push(entry);
        tableCount += 1;
      }
      continue;
    }

    if (isParagraphEntryLine(trimmed)) {
      paragraphOrdinal += 1;
      const entry = parseParagraphEntry(trimmed, lineNumber, paragraphOrdinal);
      if (entry) {
        entries.push(entry);
        paragraphCount += 1;
      } else {
        warnings.push(`line ${lineNumber}: paragraph entry header did not parse`);
      }
    }
  }

  entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.id - b.id || a.num.localeCompare(b.num),
  );

  return { entries, tableCount, paragraphCount, warnings };
}
