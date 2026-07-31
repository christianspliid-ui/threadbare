import { describe, expect, it } from "vitest";

import {
  SELF_SCOPED_SURFACE_PATTERN,
  classifyCoordinationBlockGap,
} from "../coordination-block-predicate";

// ---------------------------------------------------------------------------
// THR-836 — a ticket missing its coordination block is claimable when the
// description names a concrete surface, and bounced when it does not.
//
// Both directions are asserted deliberately. A predicate that only ever answers
// "self-scoped" would make the gate vacuous — every ticket claimable, including
// the genuinely unscoped handoffs the gate exists to catch — and a test that
// only supplied scoped descriptions would report PASS while proving nothing.
// ---------------------------------------------------------------------------

describe("SELF_SCOPED_SURFACE_PATTERN", () => {
  it.each([
    ["repo-relative src path", "`src/engine/graph.ts` mutates in place"],
    ["repo-relative scripts path", "see scripts/check-process.ts line 42"],
    ["dotted top-level dir", "edit `.claude/skills/pull-work/SKILL.md` Step 3"],
    ["Docs path", "stated in Docs/canon/process.md"],
    ["bare filename with extension", "`world-model.json` is stale"],
    ["filename outside the known dirs", "`Design/user-actions.md` finding 23"],
    ["shell script", "the only copy of threadbare-autosync.ps1"],
  ])("treats a description naming a %s as self-scoped", (_label, description) => {
    expect(SELF_SCOPED_SURFACE_PATTERN.test(description)).toBe(true);
  });

  it.each([
    ["pure prose", "The encounter pacing feels wrong and should be revisited at some point."],
    ["a goal with no surface", "Tune the god's cast power curve now that player casts roll"],
    ["an issue reference only", "Follow-up to THR-728, per the design session."],
    ["empty", ""],
  ])("treats a description that is %s as unscoped", (_label, description) => {
    expect(SELF_SCOPED_SURFACE_PATTERN.test(description)).toBe(false);
  });
});

describe("classifyCoordinationBlockGap", () => {
  it("downgrades a self-scoped ticket to warn — the executor derives the block rather than bouncing", () => {
    const gap = classifyCoordinationBlockGap("`src/engine/hiddenMarks.ts` exports a dead query");
    expect(gap.selfScoped).toBe(true);
    expect(gap.severity).toBe("warn");
    expect(gap.consequence).toContain("derives the block");
  });

  it("keeps an unscoped ticket at error — this is the case the gate was built for", () => {
    const gap = classifyCoordinationBlockGap("Revisit how factions feel once the economy settles.");
    expect(gap.selfScoped).toBe(false);
    expect(gap.severity).toBe("error");
    expect(gap.consequence).toContain("bounces it to Todo");
  });

  it.each([[null], [undefined]])("treats a %s description as unscoped rather than throwing", (description) => {
    const gap = classifyCoordinationBlockGap(description);
    expect(gap.selfScoped).toBe(false);
    expect(gap.severity).toBe("error");
  });

  it("is not a constant — the two branches return different severities", () => {
    const scoped = classifyCoordinationBlockGap("touches src/engine/graph.ts");
    const unscoped = classifyCoordinationBlockGap("touches the graph somewhere");
    expect(scoped.severity).not.toBe(unscoped.severity);
  });
});
