import { describe, expect, it } from "vitest";
import {
  ARMED_CONFLICT_FILE_LIMIT,
  ARMED_DIRTY_ABANDONED_HOURS,
  ARMED_DIRTY_ESCALATE_MINUTES,
  UNARMED_DIRTY_ABANDONED_HOURS,
  UNARMED_DIRTY_ESCALATE_HOURS,
  classifyArmedPrs,
  classifyMergeState,
  parseConflictFiles,
  parseHoldMarker,
  type ArmedPrInput,
  type ArmedPrRecord,
  type MergeStateStatus,
} from "../check-armed-prs";

const NOW_MS = new Date("2026-07-31T14:00:00Z").getTime();

let nextNumber = 1000;

function pr(overrides: Partial<ArmedPrRecord> = {}): ArmedPrRecord {
  const number = overrides.number ?? nextNumber++;
  return {
    number,
    title: `PR ${number}`,
    mergeStateStatus: "CLEAN",
    armed: true,
    // Clock started one minute ago unless a test says otherwise.
    clockStartMs: NOW_MS - 60 * 1000,
    headRefOid: `oid${number}`,
    holdReason: null,
    ...overrides,
  };
}

/** An unarmed PR — the set THR-930 made visible. */
function unarmedPr(overrides: Partial<ArmedPrRecord> = {}): ArmedPrRecord {
  return pr({ armed: false, ...overrides });
}

/**
 * A PR parked on purpose — unarmed with a declared reason (THR-985). The shape
 * of PR #1114: disarmed deliberately, conflicted, and days old.
 */
function heldPr(overrides: Partial<ArmedPrRecord> = {}): ArmedPrRecord {
  return pr({ armed: false, holdReason: "THR-883 — content migration paused", ...overrides });
}

function minutesAgo(n: number): number {
  return NOW_MS - n * 60 * 1000;
}

function hoursAgo(n: number): number {
  return NOW_MS - n * 60 * 60 * 1000;
}

function input(overrides: Partial<ArmedPrInput> = {}): ArmedPrInput {
  return {
    prs: [],
    nowMs: NOW_MS,
    conflictFilesFor: () => [],
    ...overrides,
  };
}

describe("classifyMergeState", () => {
  const cases: Array<[MergeStateStatus, string]> = [
    ["BEHIND", "drainable"],
    ["DIRTY", "conflicted"],
    ["CLEAN", "waiting"],
    ["BLOCKED", "waiting"],
    ["HAS_HOOKS", "waiting"],
    ["UNSTABLE", "waiting"],
    ["UNKNOWN", "indeterminate"],
    ["DRAFT", "indeterminate"],
  ];

  it.each(cases)("classifies %s as %s", (state, expected) => {
    expect(classifyMergeState(state)).toBe(expected);
  });

  it("treats an unrecognised state as indeterminate, not waiting", () => {
    // Fail-safe direction: `waiting` asserts nobody needs to act, which is the
    // claim a probe must never make about a state it does not understand.
    expect(classifyMergeState("SOME_FUTURE_ENUM_MEMBER")).toBe("indeterminate");
  });
});

describe("classifyArmedPrs — the THR-897 defect", () => {
  it("reports a DIRTY armed PR instead of silently skipping it", () => {
    const result = classifyArmedPrs(input({ prs: [pr({ number: 1132, mergeStateStatus: "DIRTY" })] }));

    expect(result.verdict).toBe("conflicted");
    expect(result.counts.conflicted).toBe(1);
    expect(result.summary).toContain("#1132");
    expect(result.prs[0].klass).toBe("conflicted");
  });

  it("does not offer a DIRTY PR as the update-branch candidate", () => {
    // The whole defect: `update-branch` cannot fix a conflict, so a conflicted
    // PR must never be handed to the drain path.
    const result = classifyArmedPrs(input({ prs: [pr({ mergeStateStatus: "DIRTY" })] }));

    expect(result.updateCandidate).toBeNull();
  });

  it("surfaces the conflict even when a drainable PR is also present", () => {
    // Pre-fix behaviour reported only the BEHIND PR and called the run a success.
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({ number: 1171, mergeStateStatus: "BEHIND" }),
          pr({ number: 1132, mergeStateStatus: "DIRTY" }),
        ],
      }),
    );

    expect(result.verdict).toBe("conflicted");
    expect(result.updateCandidate).toBe(1171);
    expect(result.counts).toMatchObject({ drainable: 1, conflicted: 1 });
  });

  it("names the conflicting files so the next session starts diagnosed", () => {
    const result = classifyArmedPrs(
      input({
        prs: [pr({ number: 1132, mergeStateStatus: "DIRTY" })],
        conflictFilesFor: () => ["Docs/project-status.md", "Design/impediment-dashboard.html"],
      }),
    );

    expect(result.prs[0].conflictFiles).toEqual([
      "Docs/project-status.md",
      "Design/impediment-dashboard.html",
    ]);
    expect(result.summary).toContain("Docs/project-status.md");
  });

  it("caps the reported file list at ARMED_CONFLICT_FILE_LIMIT", () => {
    const many = Array.from({ length: ARMED_CONFLICT_FILE_LIMIT + 5 }, (_, i) => `file${i}.ts`);
    const result = classifyArmedPrs(
      input({
        prs: [pr({ mergeStateStatus: "DIRTY" })],
        conflictFilesFor: () => many,
      }),
    );

    expect(result.prs[0].conflictFiles).toHaveLength(ARMED_CONFLICT_FILE_LIMIT);
  });

  it("tolerates a conflict-file probe that could not run", () => {
    const result = classifyArmedPrs(
      input({
        prs: [pr({ mergeStateStatus: "DIRTY" })],
        conflictFilesFor: () => null,
      }),
    );

    expect(result.verdict).toBe("conflicted");
    expect(result.prs[0].conflictFiles).toEqual([]);
  });
});

describe("classifyArmedPrs — age tiers", () => {
  it("does not escalate a freshly-conflicted PR to a session", () => {
    const result = classifyArmedPrs(
      input({
        prs: [pr({ mergeStateStatus: "DIRTY", clockStartMs: minutesAgo(10) })],
      }),
    );

    expect(result.verdict).toBe("conflicted");
    expect(result.needsSession).toBe(false);
    expect(result.prs[0].escalated).toBe(false);
  });

  it("escalates to a session past ARMED_DIRTY_ESCALATE_MINUTES", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({ mergeStateStatus: "DIRTY", clockStartMs: minutesAgo(ARMED_DIRTY_ESCALATE_MINUTES + 1) }),
        ],
      }),
    );

    expect(result.needsSession).toBe(true);
    expect(result.prs[0].escalated).toBe(true);
    // Still an agent's job, not Christian's (THR-608).
    expect(result.needsChristian).toBe(false);
  });

  it("escalates to Christian past ARMED_DIRTY_ABANDONED_HOURS", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({
            number: 1132,
            mergeStateStatus: "DIRTY",
            clockStartMs: hoursAgo(ARMED_DIRTY_ABANDONED_HOURS + 1),
          }),
        ],
      }),
    );

    expect(result.verdict).toBe("abandoned");
    expect(result.needsChristian).toBe(true);
    expect(result.needsSession).toBe(true);
    expect(result.summary).toContain("#1132");
  });

  it("writes the abandoned summary in plain language, with no git jargon", () => {
    // THR-608: Christian reads this verbatim in the briefing.
    const result = classifyArmedPrs(
      input({
        prs: [pr({ mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(ARMED_DIRTY_ABANDONED_HOURS + 1) })],
      }),
    );

    expect(result.summary).not.toMatch(/mergeStateStatus|DIRTY|update-branch|rebase/);
  });

  it("reports the oldest conflicted PR first", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({ number: 200, mergeStateStatus: "DIRTY", clockStartMs: minutesAgo(30) }),
          pr({ number: 100, mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(ARMED_DIRTY_ABANDONED_HOURS + 2) }),
        ],
      }),
    );

    expect(result.verdict).toBe("abandoned");
    expect(result.summary).toContain("#100");
  });
});

describe("classifyArmedPrs — drain path (THR-702 behaviour preserved)", () => {
  it("picks the oldest BEHIND PR as the single update candidate", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({ number: 300, mergeStateStatus: "BEHIND", clockStartMs: minutesAgo(10) }),
          pr({ number: 100, mergeStateStatus: "BEHIND", clockStartMs: minutesAgo(90) }),
          pr({ number: 200, mergeStateStatus: "BEHIND", clockStartMs: minutesAgo(50) }),
        ],
      }),
    );

    expect(result.verdict).toBe("drainable");
    expect(result.updateCandidate).toBe(100);
    expect(result.needsSession).toBe(false);
  });

  it("reports healthy when everything is merely waiting on checks", () => {
    const result = classifyArmedPrs(
      input({ prs: [pr({ mergeStateStatus: "CLEAN" }), pr({ mergeStateStatus: "BLOCKED" })] }),
    );

    expect(result.verdict).toBe("healthy");
    expect(result.needsChristian).toBe(false);
    expect(result.needsSession).toBe(false);
    expect(result.updateCandidate).toBeNull();
  });

  it("reports healthy with no armed PRs at all", () => {
    const result = classifyArmedPrs(input({ prs: [] }));

    expect(result.verdict).toBe("healthy");
    expect(result.summary).toBe("No PRs are waiting to merge.");
  });
});

describe("classifyArmedPrs — indeterminate handling", () => {
  it("reports unknown rather than healthy when every PR is UNKNOWN", () => {
    // Measured 2026-07-31: #1132 and #1166 each read DIRTY then UNKNOWN minutes
    // apart. Calling an unresolved read healthy is how a conflict stays hidden.
    const result = classifyArmedPrs(
      input({ prs: [pr({ mergeStateStatus: "UNKNOWN" }), pr({ mergeStateStatus: "UNKNOWN" })] }),
    );

    expect(result.verdict).toBe("unknown");
    expect(result.counts.indeterminate).toBe(2);
  });

  it("still surfaces a known conflict alongside unresolved entries", () => {
    const result = classifyArmedPrs(
      input({
        prs: [pr({ mergeStateStatus: "UNKNOWN" }), pr({ number: 1132, mergeStateStatus: "DIRTY" })],
      }),
    );

    expect(result.verdict).toBe("conflicted");
  });
});

describe("classifyArmedPrs — the THR-930 defect (unarmed PRs are in the set)", () => {
  it("reports an unarmed conflicted PR instead of leaving it out of the input", () => {
    // The measured case, 2026-08-02: the repo's only open PR was #1114 —
    // DIRTY, unarmed, 3+ days old — and the probe answered
    // `counts.conflicted: 0` / "No PRs are waiting to merge."
    const result = classifyArmedPrs(
      input({
        prs: [unarmedPr({ number: 1114, mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(76) })],
      }),
    );

    expect(result.verdict).toBe("abandoned");
    expect(result.counts.conflicted).toBe(1);
    expect(result.summary).toContain("#1114");
    expect(result.summary).not.toBe("No PRs are waiting to merge.");
  });

  it("never proposes an unarmed BEHIND PR as the update candidate", () => {
    // Done-when #2: `update-branch` on an unarmed PR refreshes a branch that
    // nothing is waiting to merge, so it must not be dressed up as progress.
    const result = classifyArmedPrs(
      input({ prs: [unarmedPr({ number: 1114, mergeStateStatus: "BEHIND", clockStartMs: hoursAgo(50) })] }),
    );

    expect(result.counts.drainable).toBe(1);
    expect(result.updateCandidate).toBeNull();
    expect(result.summary).toContain("armed");
  });

  it("still prefers the oldest ARMED PR when both kinds are BEHIND", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          unarmedPr({ number: 900, mergeStateStatus: "BEHIND", clockStartMs: hoursAgo(72) }),
          pr({ number: 901, mergeStateStatus: "BEHIND", clockStartMs: minutesAgo(30) }),
        ],
      }),
    );

    // The unarmed one is far older but auto-merge will never act on it.
    expect(result.updateCandidate).toBe(901);
  });

  it("keeps the armed/unarmed split legible in the output", () => {
    const result = classifyArmedPrs(
      input({ prs: [pr({ mergeStateStatus: "CLEAN" }), unarmedPr({ mergeStateStatus: "CLEAN" })] }),
    );

    expect(result.armedCount).toBe(1);
    expect(result.unarmedCount).toBe(1);
    expect(result.prs.map((r) => r.armed)).toEqual([true, false]);
  });

  it("gives an unarmed conflict a slower escalate clock than an armed one", () => {
    // Same age, different arming: past the armed tier, short of the unarmed one.
    const age = { mergeStateStatus: "DIRTY" as const, clockStartMs: hoursAgo(2) };

    expect(classifyArmedPrs(input({ prs: [pr(age)] })).prs[0].escalated).toBe(true);
    expect(classifyArmedPrs(input({ prs: [unarmedPr(age)] })).prs[0].escalated).toBe(false);
  });

  it("escalates an unarmed conflict to a session past UNARMED_DIRTY_ESCALATE_HOURS", () => {
    const result = classifyArmedPrs(
      input({
        prs: [unarmedPr({ mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(UNARMED_DIRTY_ESCALATE_HOURS + 1) })],
      }),
    );

    expect(result.verdict).toBe("conflicted");
    expect(result.needsSession).toBe(true);
    // Not Christian's yet — an agent can still settle this (THR-608).
    expect(result.needsChristian).toBe(false);
  });

  it("escalates an unarmed conflict to Christian past UNARMED_DIRTY_ABANDONED_HOURS", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          unarmedPr({
            number: 1114,
            mergeStateStatus: "DIRTY",
            clockStartMs: hoursAgo(UNARMED_DIRTY_ABANDONED_HOURS + 1),
          }),
        ],
      }),
    );

    expect(result.verdict).toBe("abandoned");
    expect(result.needsChristian).toBe(true);
    expect(result.prs[0].abandoned).toBe(true);
  });

  it("does not escalate an unarmed conflict that is only past the ARMED abandoned tier", () => {
    // The distinction is real, not cosmetic: 13h is abandoned for an armed PR
    // and merely escalated for an unarmed one.
    const clockStartMs = hoursAgo(ARMED_DIRTY_ABANDONED_HOURS + 1);

    expect(classifyArmedPrs(input({ prs: [pr({ mergeStateStatus: "DIRTY", clockStartMs })] })).verdict).toBe(
      "abandoned",
    );

    const unarmed = classifyArmedPrs(input({ prs: [unarmedPr({ mergeStateStatus: "DIRTY", clockStartMs })] }));
    expect(unarmed.verdict).toBe("conflicted");
    expect(unarmed.needsChristian).toBe(false);
  });

  it("marks an unarmed conflict in the summary so the reader knows why it idled", () => {
    const result = classifyArmedPrs(
      input({
        prs: [unarmedPr({ number: 1114, mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(7) })],
      }),
    );

    expect(result.summary).toContain("#1114 (unarmed)");
  });
});

describe("parseHoldMarker — the signal a hold is declared with (THR-985)", () => {
  it("reads the reason off a plain marker line", () => {
    expect(parseHoldMarker("Hold: THR-883 — authoring format not locked yet")).toBe(
      "THR-883 — authoring format not locked yet",
    );
  });

  it("accepts the marker anywhere in a multi-line body", () => {
    const body = ["## Summary", "", "Four templates migrated.", "", "Hold: THR-883 blocks this", ""].join(
      "\n",
    );

    expect(parseHoldMarker(body)).toBe("THR-883 blocks this");
  });

  it.each([
    ["bold-after-colon", "**Hold:** THR-883 blocks this"],
    ["bold-before-colon", "**Hold**: THR-883 blocks this"],
    ["fully-bolded", "**Hold: THR-883 blocks this**"],
    ["blockquote", "> Hold: THR-883 blocks this"],
    ["bullet", "- Hold: THR-883 blocks this"],
    ["lowercase", "hold: THR-883 blocks this"],
    ["Paused synonym", "Paused: THR-883 blocks this"],
    ["indented", "   Hold: THR-883 blocks this"],
  ])("accepts a %s marker", (_label, body) => {
    expect(parseHoldMarker(body)).toBe("THR-883 blocks this");
  });

  it("ignores the keyword mid-sentence, exactly as linear-autoclose does", () => {
    // THR-738's lesson, applied here: an unanchored keyword turns prose that
    // *describes* a hold into a hold — which would silently suppress a real
    // stall, the one direction this probe must never fail in.
    const body = "This does not put anything on hold: the branch merges normally.";

    expect(parseHoldMarker(body)).toBeNull();
  });

  it("rejects a marker with no reason — a hold must say why", () => {
    expect(parseHoldMarker("Hold:")).toBeNull();
    expect(parseHoldMarker("Hold:    ")).toBeNull();
  });

  it("returns null for a missing or empty body rather than assuming a hold", () => {
    expect(parseHoldMarker(null)).toBeNull();
    expect(parseHoldMarker(undefined)).toBeNull();
    expect(parseHoldMarker("")).toBeNull();
  });

  it("returns null for an ordinary PR body", () => {
    expect(parseHoldMarker("## Summary\n\nFixes THR-985\n")).toBeNull();
  });
});

describe("classifyArmedPrs — the THR-985 defect (a parked PR is not a stuck one)", () => {
  /** PR #1114's live shape: unarmed, conflicted, days old, held on purpose. */
  const pr1114 = {
    number: 1114,
    mergeStateStatus: "DIRTY" as const,
    clockStartMs: hoursAgo(78),
  };

  it("classifies a held PR as held and does not escalate it to Christian", () => {
    // The measured case: for 78 hours this reported `abandoned` /
    // `needsChristian: true` onto the briefing, raising a decision Christian
    // had already made.
    const result = classifyArmedPrs(input({ prs: [heldPr(pr1114)] }));

    expect(result.prs[0].klass).toBe("held");
    expect(result.verdict).toBe("held");
    expect(result.needsChristian).toBe(false);
    expect(result.needsSession).toBe(false);
    expect(result.counts).toMatchObject({ held: 1, conflicted: 0 });
  });

  it("carries the hold reason into the report and the summary", () => {
    const result = classifyArmedPrs(input({ prs: [heldPr(pr1114)] }));

    expect(result.prs[0].holdReason).toBe("THR-883 — content migration paused");
    expect(result.summary).toContain("#1114");
    expect(result.summary).toContain("THR-883");
  });

  it("still reports the held PR's conflicting files", () => {
    // Resolving a held PR's conflict is legitimate maintenance; only re-arming
    // it is not. The diagnosis must survive the reclassification.
    const result = classifyArmedPrs(
      input({
        prs: [heldPr(pr1114)],
        conflictFilesFor: () => ["Docs/project-status.md"],
      }),
    );

    expect(result.prs[0].conflictFiles).toEqual(["Docs/project-status.md"]);
  });

  it("never offers a held PR as the update-branch candidate", () => {
    const result = classifyArmedPrs(
      input({ prs: [heldPr({ number: 1114, mergeStateStatus: "BEHIND", armed: true })] }),
    );

    expect(result.prs[0].klass).toBe("held");
    expect(result.updateCandidate).toBeNull();
  });

  it("STILL escalates a genuinely stuck PR — the same age and state, no hold", () => {
    // The falsifying arm. If this ever goes quiet, the fix has become a
    // suppression: a stall silently relabelled as a decision.
    const stuck = classifyArmedPrs(input({ prs: [unarmedPr(pr1114)] }));

    expect(stuck.verdict).toBe("abandoned");
    expect(stuck.needsChristian).toBe(true);
    expect(stuck.prs[0].klass).toBe("conflicted");

    // Same PR, same clock, one marker's difference.
    const held = classifyArmedPrs(input({ prs: [heldPr(pr1114)] }));
    expect(held.needsChristian).toBe(false);
  });

  it("surfaces a real conflict alongside a held one instead of being quieted by it", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          heldPr(pr1114),
          unarmedPr({ number: 1200, mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(30) }),
        ],
      }),
    );

    expect(result.verdict).toBe("abandoned");
    expect(result.summary).toContain("#1200");
    expect(result.counts).toMatchObject({ held: 1, conflicted: 1 });
  });
});

describe("classifyArmedPrs — an unarmed PR is not waiting on checks (THR-985)", () => {
  it("classifies an unarmed CLEAN PR as idle, not waiting", () => {
    // The second-order bug: once #1114's conflict cleared, the probe said it
    // was "waiting on checks and will merge on green". It was unarmed and held,
    // so nothing was waiting on it and it would not merge on anything.
    const result = classifyArmedPrs(input({ prs: [unarmedPr({ number: 1114, mergeStateStatus: "CLEAN" })] }));

    expect(result.prs[0].klass).toBe("idle");
    expect(result.verdict).toBe("idle");
    expect(result.counts).toMatchObject({ idle: 1, waiting: 0 });
  });

  it("never claims an unarmed PR will merge on green", () => {
    const result = classifyArmedPrs(
      input({
        prs: [unarmedPr({ mergeStateStatus: "CLEAN" }), unarmedPr({ mergeStateStatus: "BLOCKED" })],
      }),
    );

    expect(result.summary).not.toContain("will merge on green");
    expect(result.summary).toContain("not armed for auto-merge");
  });

  it("keeps calling an ARMED green PR waiting — the claim is true for those", () => {
    const result = classifyArmedPrs(input({ prs: [pr({ mergeStateStatus: "CLEAN" })] }));

    expect(result.prs[0].klass).toBe("waiting");
    expect(result.verdict).toBe("healthy");
    expect(result.summary).toContain("will merge on green");
  });

  it("describes a mixed board without asserting one story about all of it", () => {
    const result = classifyArmedPrs(
      input({
        prs: [
          pr({ mergeStateStatus: "CLEAN" }),
          unarmedPr({ mergeStateStatus: "CLEAN" }),
          heldPr({ number: 1114, mergeStateStatus: "DIRTY", clockStartMs: hoursAgo(78) }),
        ],
      }),
    );

    expect(result.verdict).toBe("healthy");
    expect(result.counts).toMatchObject({ waiting: 1, idle: 1, held: 1 });
    expect(result.summary).toContain("will merge on green");
    expect(result.summary).toContain("not armed for auto-merge");
    expect(result.summary).toContain("on hold on purpose");
    expect(result.needsChristian).toBe(false);
  });

  it("leaves the no-PRs summary exactly as it was", () => {
    expect(classifyArmedPrs(input({ prs: [] })).summary).toBe("No PRs are waiting to merge.");
  });
});

describe("parseConflictFiles", () => {
  it("extracts conflicting paths from real merge-tree output", () => {
    // Verbatim shape captured from PR #1132 on 2026-07-31.
    const output = [
      "cfd62cb215d3472a4ed8f93404d6adaf7f36fe77",
      "Design/impediment-dashboard.html",
      "Docs/project-status.md",
      "",
      "Auto-merging Design/impediment-dashboard.html",
      "CONFLICT (content): Merge conflict in Design/impediment-dashboard.html",
      "Auto-merging Docs/project-status.md",
      "CONFLICT (content): Merge conflict in Docs/project-status.md",
    ].join("\n");

    expect(parseConflictFiles(output)).toEqual([
      "Design/impediment-dashboard.html",
      "Docs/project-status.md",
    ]);
  });

  it("returns an empty list for a clean merge (tree oid only)", () => {
    expect(parseConflictFiles("cfd62cb215d3472a4ed8f93404d6adaf7f36fe77")).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const output = "abc123\r\nDocs/changelog.md\r\n\r\nCONFLICT (content): ...";
    expect(parseConflictFiles(output)).toEqual(["Docs/changelog.md"]);
  });
});
