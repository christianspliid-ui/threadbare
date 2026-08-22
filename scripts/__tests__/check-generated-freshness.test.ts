import { describe, expect, it } from "vitest";
import {
  classifyContent,
  compareArtifact,
  stripVolatileKeys,
  type ArtifactComparison,
} from "../check-generated-freshness";

/**
 * THR-1192 — the gate byte-compared the working tree against the committed blob
 * while `.gitattributes` (`eol=lf`) normalized CRLF away at `git add`. A Windows
 * text-mode write therefore produced a tree git called clean and this gate called
 * stale, forever, prescribing the one repair that cannot work (re-run the generator).
 *
 * The three Done-whens are the three describe blocks: a CRLF-only difference no
 * longer fails, a genuine content difference still fails exactly as before, and the
 * volatile-key path is unchanged.
 */

/** Rewrite every LF as CRLF — what a Windows text-mode write does to an LF artifact. */
function toCrlf(content: string): string {
  return content.replaceAll("\n", "\r\n");
}

const ARTIFACT = ["{", '  "cards": 3,', '  "tier": "attended"', "}", ""].join("\n");

describe("classifyContent — a CRLF working copy is not staleness", () => {
  it("classifies a wholly CRLF-converted artifact as eol-only", () => {
    expect(classifyContent(toCrlf(ARTIFACT), ARTIFACT)).toBe<ArtifactComparison>("eol-only");
  });

  it("classifies it eol-only in either direction", () => {
    expect(classifyContent(ARTIFACT, toCrlf(ARTIFACT))).toBe<ArtifactComparison>("eol-only");
  });

  it("classifies a partially-converted copy as eol-only", () => {
    // Mixed endings are what a partial rewrite leaves behind; still not staleness.
    const mixed = ARTIFACT.replace('  "cards": 3,\n', '  "cards": 3,\r\n');
    expect(classifyContent(mixed, ARTIFACT)).toBe<ArtifactComparison>("eol-only");
  });

  it("leaves byte-identical content classified identical, not eol-only", () => {
    expect(classifyContent(ARTIFACT, ARTIFACT)).toBe<ArtifactComparison>("identical");
  });
});

describe("classifyContent — genuine staleness still fails", () => {
  it("classifies a content difference as stale", () => {
    const regenerated = ARTIFACT.replace('"cards": 3', '"cards": 4');
    expect(classifyContent(regenerated, ARTIFACT)).toBe<ArtifactComparison>("stale");
  });

  /**
   * The falsification arm for the new branch. A CRLF copy that ALSO changed content
   * must stay stale — if `eol-only` were reached by testing for the presence of CRLF
   * rather than by comparing normalized content, this is the case that would leak a
   * genuinely stale artifact past the gate, and every assertion above would still pass.
   */
  it("classifies a CRLF copy whose content also changed as stale, not eol-only", () => {
    const staleAndCrlf = toCrlf(ARTIFACT.replace('"cards": 3', '"cards": 4'));
    expect(classifyContent(staleAndCrlf, ARTIFACT)).toBe<ArtifactComparison>("stale");
  });

  it("classifies a missing trailing newline as stale, not eol-only", () => {
    expect(classifyContent(ARTIFACT.trimEnd(), ARTIFACT)).toBe<ArtifactComparison>("stale");
  });
});

describe("stripVolatileKeys — the volatile path is unaffected", () => {
  const VOLATILE = ["generatedAt"] as const;
  const withStamp = JSON.stringify({ generatedAt: "2026-08-22T07:00:00Z", cards: 3 }, null, 2);
  const withOtherStamp = JSON.stringify({ generatedAt: "2026-08-22T16:00:00Z", cards: 3 }, null, 2);

  it("returns content verbatim when no keys are registered", () => {
    expect(stripVolatileKeys(ARTIFACT, undefined)).toBe(ARTIFACT);
    expect(stripVolatileKeys(ARTIFACT, [])).toBe(ARTIFACT);
  });

  it("strips the registered key and keeps the rest", () => {
    const stripped = stripVolatileKeys(withStamp, VOLATILE);
    expect(JSON.parse(stripped)).toEqual({ cards: 3 });
  });

  it("falls back to verbatim comparison on unparseable JSON", () => {
    expect(stripVolatileKeys("not json {", VOLATILE)).toBe("not json {");
  });

  it("still reports a volatile-only difference as volatile-only, not identical", () => {
    expect(classifyContent(withStamp, withOtherStamp, VOLATILE)).toBe<ArtifactComparison>(
      "volatile-only",
    );
  });

  it("still reports a real difference as stale even when a volatile key is registered", () => {
    const realChange = JSON.stringify(
      { generatedAt: "2026-08-22T16:00:00Z", cards: 4 },
      null,
      2,
    );
    expect(classifyContent(withStamp, realChange, VOLATILE)).toBe<ArtifactComparison>("stale");
  });

  /**
   * The docblock's claim that volatile paths are already EOL-agnostic: the JSON
   * round-trip re-emits LF, so a CRLF copy never reaches the `eol-only` branch there.
   */
  it("absorbs CRLF through the JSON round-trip on a volatile path", () => {
    expect(classifyContent(toCrlf(withStamp), withStamp, VOLATILE)).toBe<ArtifactComparison>(
      "volatile-only",
    );
  });
});

describe("compareArtifact — resolves volatile keys by path", () => {
  it("compares an unregistered path verbatim", () => {
    expect(compareArtifact(ARTIFACT, ARTIFACT, "public/action-catalog.generated.json")).toBe(
      "identical",
    );
    expect(
      compareArtifact(toCrlf(ARTIFACT), ARTIFACT, "public/action-catalog.generated.json"),
    ).toBe<ArtifactComparison>("eol-only");
  });
});
