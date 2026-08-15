import { describe, expect, it } from "vitest";
import {
  ALLOW_DROP_FLAG,
  COMPILER_SPECIFIERS,
  SUSPECT_DROP_RATIO,
  classifyRun,
  findCompiler,
  isBlocking,
  type RunFacts,
} from "../check-typecheck-ratchet";

/**
 * The baseline in the tree when THR-1128 was observed. Used as the comparison
 * point throughout so the numbers in these tests are the real ones.
 */
const BASELINE = 3184;

/**
 * What `npx tsc -b --force --pretty false` printed on 2026-08-15 with
 * node_modules wiped out from under the session — quoted in THR-1128. Two
 * properties make it the exact shape that defeated the pre-existing guard:
 * the process exited ZERO (so execSync did not throw), and the text contains
 * no "error" substring (so `looksClean` was true and property 3 stood down).
 */
const NO_COMPILER_OUTPUT =
  "Use `npm install typescript` to first add TypeScript to your project.\n";

function facts(overrides: Partial<RunFacts> = {}): RunFacts {
  return {
    compilerFound: true,
    output: "",
    total: BASELINE,
    baselineTotal: BASELINE,
    allowDrop: false,
    ...overrides,
  };
}

describe("findCompiler — live wiring", () => {
  it("resolves the compiler in this repo, so the specifiers are real", () => {
    // Pins COMPILER_SPECIFIERS against actual module resolution: a typo'd or
    // renamed specifier would make the gate report "not installed" on every
    // healthy run and block every PR, which is the expensive failure direction.
    const resolved = findCompiler();
    expect(resolved).not.toBeNull();
    expect(resolved).toMatch(/typescript/);
  });

  it("declares bin/tsc first — the binary `npx tsc` actually executes", () => {
    expect(COMPILER_SPECIFIERS[0]).toBe("typescript/bin/tsc");
  });
});

describe("classifyRun — the THR-1128 regression", () => {
  it("refuses the exact 2026-08-15 run instead of scoring it a 3184-error improvement", () => {
    // The observed state: no compiler, so nothing ran, so `total` is an artifact.
    const verdict = classifyRun(
      facts({ compilerFound: false, output: NO_COMPILER_OUTPUT, total: 0 }),
    );

    expect(verdict).toEqual({ kind: "no-compiler" });
    expect(isBlocking(verdict)).toBe(true);
    // The bug was specifically that this classified as a decrease and printed
    // the invitation to commit a 0 baseline.
    expect(verdict.kind).not.toBe("decrease");
  });

  it("still refuses a zero-diagnostic run when the compiler resolves but nothing compiled", () => {
    // Defence in depth (property 5): the compiler being installed is not proof
    // it ran over the project. A warm .tsbuildinfo or a quiet early exit lands
    // here, and every guard this script had was on the increase side.
    const verdict = classifyRun(facts({ total: 0, output: "" }));

    expect(verdict).toEqual({ kind: "suspect-drop", total: 0, baselineTotal: BASELINE });
    expect(isBlocking(verdict)).toBe(true);
  });

  it("blocks a suspect drop on the --update path too, so no poisoned baseline is written", () => {
    // main() consults isBlocking() before writeBaseline(), so this verdict is
    // what stops `--update` from committing the 0 floor.
    expect(isBlocking(classifyRun(facts({ total: 0 })))).toBe(true);
  });
});

describe("classifyRun — the suspect-drop boundary", () => {
  const threshold = BASELINE * (1 - SUSPECT_DROP_RATIO); // 1592

  it("treats a drop of exactly the threshold as an ordinary decrease", () => {
    expect(classifyRun(facts({ total: threshold }))).toEqual({
      kind: "decrease",
      total: threshold,
      baselineTotal: BASELINE,
    });
  });

  it("treats one error below the threshold as suspect", () => {
    expect(classifyRun(facts({ total: threshold - 1 }))).toMatchObject({ kind: "suspect-drop" });
  });

  it("accepts a genuinely large drop when --allow-drop is passed", () => {
    expect(classifyRun(facts({ total: 0, allowDrop: true }))).toEqual({
      kind: "decrease",
      total: 0,
      baselineTotal: BASELINE,
    });
    expect(ALLOW_DROP_FLAG).toBe("--allow-drop");
  });

  it("never calls a drop suspect against a zero baseline", () => {
    expect(classifyRun(facts({ total: 0, baselineTotal: 0 }))).toEqual({ kind: "unchanged", total: 0 });
  });
});

describe("classifyRun — healthy toolchain behaviour is unchanged", () => {
  it("passes at the baseline", () => {
    expect(classifyRun(facts({ total: BASELINE }))).toEqual({ kind: "unchanged", total: BASELINE });
  });

  it("fails on an increase", () => {
    expect(classifyRun(facts({ total: BASELINE + 1 }))).toEqual({
      kind: "increase",
      total: BASELINE + 1,
      baselineTotal: BASELINE,
    });
  });

  it("reports a modest legitimate decrease and prompts for --update", () => {
    expect(classifyRun(facts({ total: BASELINE - 3 }))).toEqual({
      kind: "decrease",
      total: BASELINE - 3,
      baselineTotal: BASELINE,
    });
  });

  it("does not block an increase — that path reports and exits on its own", () => {
    expect(isBlocking(classifyRun(facts({ total: BASELINE + 1 })))).toBe(false);
  });

  it("allows a first baseline to be created when none exists", () => {
    expect(classifyRun(facts({ baselineTotal: null, total: 12 }))).toEqual({
      kind: "no-baseline",
      total: 12,
    });
    expect(isBlocking(classifyRun(facts({ baselineTotal: null, total: 12 })))).toBe(false);
  });
});

describe("classifyRun — property 3 is preserved", () => {
  it("still reports a failed run that produced no parseable diagnostics", () => {
    const verdict = classifyRun(
      facts({ total: 0, output: "error TS5083: Cannot read file 'tsconfig.json'." }),
    );

    expect(verdict).toMatchObject({ kind: "unverifiable" });
    expect(isBlocking(verdict)).toBe(true);
  });

  it("accepts tsc's explicit clean marker without calling it a suspect drop", () => {
    expect(classifyRun(facts({ total: 0, baselineTotal: 0, output: "Found 0 errors.\n" }))).toEqual({
      kind: "unchanged",
      total: 0,
    });
  });
});
