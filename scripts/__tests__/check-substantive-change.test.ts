import { describe, expect, it } from "vitest";
import {
  evaluateBriefing,
  evaluateReport,
  parseBriefingDigest,
  parseReportOutcome,
  projectBriefing,
  renderDigest,
  scrubVolatile,
  splitSections,
} from "../check-substantive-change";

/**
 * Fixtures are cut from the real `Design/briefing.md` of 2026-07-31 17:54 UTC and
 * the real `Docs/ops/orchestrator-*.md` shape, not invented — THR-920's whole
 * argument rests on what these files actually look like hour to hour.
 */

const BRIEFING_1754 = `# Briefing

**Generated:** 2026-07-31 19:54 local (17:54 UTC) · by \`keep-work-flowing-cc\`

## Needs Christian

**Nothing needs you right now — second hour running.** The branch carrying the eight
new encounters is running its checks right now and is set to merge itself.

## Queue

**Fifty-three jobs ready, one being worked, one parked.** Bands: one urgent, five high.
The urgent one is THR-920 and is still ours, not yours.

## Freshness

**Your working copy is healthy and fully current.** The live site is current.

## What's moving

**Five other pull requests are open** — this briefing, the sweep fix #1175, two write-ups.
`;

/**
 * The next hour. Every number moved, the prose was rewritten from scratch, PR
 * numbers changed — and nothing happened that Christian would act on.
 */
const BRIEFING_1854_NO_NEWS = `# Briefing

**Generated:** 2026-07-31 20:54 local (18:54 UTC) · by \`keep-work-flowing-cc\`

## Needs Christian

**You are clear this hour too.** The encounter branch is still mid-checks; it will
merge itself the moment they come back green.

## Queue

**Fifty-five jobs ready, one being worked, one parked.** Bands: one urgent, six high.
The urgent one is THR-920 and remains ours.

## Freshness

**Working copy healthy, fully current.** Live site current; 47th consecutive clean hour.

## What's moving

**Six pull requests are open** — this briefing, the sweep fix #1188, three write-ups.
`;

describe("scrubVolatile", () => {
  it("removes timestamps, dates, clock times, durations and SHAs", () => {
    const out = scrubVolatile(
      "at 2026-07-31T17:54:02Z (19:54 local) commit a1b2c3d stuck for 19 hours, 45m idle",
    );
    expect(out).not.toMatch(/2026-07-31/);
    expect(out).not.toMatch(/17:54/);
    expect(out).not.toMatch(/a1b2c3d/);
    expect(out).not.toMatch(/19 hours/);
    expect(out).not.toMatch(/45m/);
  });

  it("protects issue and PR identity — those are news, not noise", () => {
    // Output is lowercased; identity must survive the markdown strip that would
    // otherwise eat the `-` and the `#`.
    const out = scrubVolatile("THR-920 blocks PR #1175 as of 2026-07-31");
    expect(out).toContain("thr-920");
    expect(out).toContain("#1175");
  });

  it("does not mistake an all-hex word for a git SHA", () => {
    // "facade" and "added" are [a-f]-only; the SHA pattern requires a digit.
    expect(scrubVolatile("facade added")).toContain("facade");
    expect(scrubVolatile("facade added")).toContain("added");
  });

  it("strips bare integers only when asked", () => {
    expect(scrubVolatile("53 jobs ready")).toContain("53");
    expect(scrubVolatile("53 jobs ready", true)).not.toContain("53");
  });
});

describe("splitSections", () => {
  it("keys sections by lowercased heading and ignores h3", () => {
    const sections = splitSections("## Alpha\nbody a\n\n### Sub\nsub body\n\n## Beta\nbody b");
    expect([...sections.keys()]).toEqual(["alpha", "beta"]);
    expect(sections.get("alpha")).toContain("sub body");
  });
});

describe("projectBriefing", () => {
  it("drops the What's-moving section and the generated timestamp", () => {
    const projection = projectBriefing(BRIEFING_1754);
    expect(projection).not.toContain("what's moving");
    expect(projection).not.toContain("17:54");
  });

  it("scrubs the ready count out of Queue but keeps the verdict and issue id", () => {
    const projection = projectBriefing(BRIEFING_1754);
    expect(projection).not.toContain("fifty-three jobs ready".slice(0, 0) + "53");
    expect(projection).toContain("thr-920");
    expect(projection).toContain("urgent");
  });

  it("includes an unrecognised section rather than silently dropping it", () => {
    const projection = projectBriefing("## Needs Christian\nnone\n\n## Brand New\nsomething real");
    expect(projection).toContain("brand new");
    expect(projection).toContain("something real");
  });
});

describe("parseBriefingDigest", () => {
  it("reads item keys and verdicts, sorting keys so order is not a change", () => {
    const digest = parseBriefingDigest(
      `---\nneedsChristian: thr-860-parked, thr-920-traffic\nqueue: backed-up\nfreshness: healthy\n---\n# Briefing`,
    );
    expect(digest).not.toBeNull();
    expect(digest!.needsChristian).toEqual(["thr-860-parked", "thr-920-traffic"]);
    expect(digest!.verdicts).toEqual({ queue: "backed-up", freshness: "healthy" });
  });

  it("treats the literal 'none' as an empty item list", () => {
    const digest = parseBriefingDigest(`---\nneedsChristian: none\nqueue: healthy\n---\n`);
    expect(digest!.needsChristian).toEqual([]);
  });

  it("returns null when there is no frontmatter, so the caller uses the backstop", () => {
    expect(parseBriefingDigest(BRIEFING_1754)).toBeNull();
  });

  it("renders order-independently", () => {
    const a = parseBriefingDigest(`---\nneedsChristian: b-item, a-item\nqueue: healthy\n---\n`)!;
    const b = parseBriefingDigest(`---\nneedsChristian: a-item, b-item\nqueue: healthy\n---\n`)!;
    expect(renderDigest(a)).toBe(renderDigest(b));
  });
});

describe("evaluateBriefing — digest path (primary)", () => {
  const withDigest = (items: string, queue: string) =>
    `---\nneedsChristian: ${items}\nqueue: ${queue}\nfreshness: healthy\n---\n# Briefing\n\n**Generated:** 2026-07-31 19:54 local\n\n## Needs Christian\n\nprose that gets rewritten every single hour\n`;

  it("skips when the declared items and verdicts are unchanged, however the prose moved", () => {
    const current = withDigest("none", "backed-up").replace(
      "prose that gets rewritten every single hour",
      "completely different wording, new numbers 55, new PR #1188",
    );
    const result = evaluateBriefing(current, withDigest("none", "backed-up"));
    expect(result.verdict).toBe("skip");
    expect(result.reason).toBe("digest-unchanged");
  });

  it("commits when a new Needs-Christian item appears", () => {
    const result = evaluateBriefing(
      withDigest("thr-883-verdict", "backed-up"),
      withDigest("none", "backed-up"),
    );
    expect(result.verdict).toBe("commit");
    expect(result.reason).toBe("digest-changed");
  });

  it("commits when the last Needs-Christian item clears", () => {
    const result = evaluateBriefing(
      withDigest("none", "backed-up"),
      withDigest("thr-883-verdict", "backed-up"),
    );
    expect(result.verdict).toBe("commit");
  });

  it("commits when a verdict flips even with the same items", () => {
    const result = evaluateBriefing(
      withDigest("none", "starved"),
      withDigest("none", "backed-up"),
    );
    expect(result.verdict).toBe("commit");
  });

  it("falls back to the projection when only one side declares a digest", () => {
    const result = evaluateBriefing(withDigest("none", "healthy"), BRIEFING_1754);
    expect(result.reason).toMatch(/projection/);
  });
});

describe("evaluateBriefing — projection backstop", () => {
  it("skips an identical brief whose only change is the timestamp", () => {
    const later = BRIEFING_1754.replace("19:54 local (17:54 UTC)", "20:54 local (18:54 UTC)");
    const result = evaluateBriefing(later, BRIEFING_1754);
    expect(result.verdict).toBe("skip");
    expect(result.reason).toBe("projection-unchanged");
  });

  it("skips when only the ready count and PR numbers moved", () => {
    const drifted = BRIEFING_1754.replace("Fifty-three jobs ready", "Fifty-three jobs ready")
      .replace("#1175", "#1188")
      .replace("19:54 local (17:54 UTC)", "21:12 local (19:12 UTC)");
    const result = evaluateBriefing(drifted, BRIEFING_1754);
    expect(result.verdict).toBe("skip");
  });

  it("commits when a genuinely new item lands in Needs Christian", () => {
    const withItem = BRIEFING_1754.replace(
      "**Nothing needs you right now — second hour running.**",
      "**The five prototype encounters are playable and need your verdict.**",
    );
    const result = evaluateBriefing(withItem, BRIEFING_1754);
    expect(result.verdict).toBe("commit");
  });

  it("commits when there is no committed baseline at all", () => {
    const result = evaluateBriefing(BRIEFING_1754, null);
    expect(result.verdict).toBe("commit");
    expect(result.baselineFound).toBe(false);
  });

  it("is honest that rewritten prose defeats the backstop — which is why the digest leads", () => {
    // Same news, different wording: the backstop commits anyway. Documented rather
    // than asserted away, because it is the reason parseBriefingDigest exists.
    const result = evaluateBriefing(BRIEFING_1854_NO_NEWS, BRIEFING_1754);
    expect(result.verdict).toBe("commit");
  });
});

describe("parseReportOutcome", () => {
  it("reads counters and the needsChristian flag", () => {
    const outcome = parseReportOutcome(
      `---\nlane: tb-orchestrator\nrun: 2026-07-31k\npromoted: 2\nfiled: 0\nresolved: 1\nnewFindings: 0\nneedsChristian: false\n---\n# Orchestrator`,
    );
    expect(outcome).toEqual({
      promoted: 2,
      filed: 0,
      resolved: 1,
      newFindings: 0,
      needsChristian: false,
    });
  });

  it("returns null with no frontmatter, so the caller fails soft to commit", () => {
    expect(parseReportOutcome("# Orchestrator\n\n## T1\nnothing")).toBeNull();
  });

  it("returns null on an unparseable counter rather than reading it as zero", () => {
    expect(parseReportOutcome(`---\npromoted: lots\n---\n`)).toBeNull();
  });
});

describe("evaluateReport", () => {
  const report = (fm: string) => `---\nlane: tb-orchestrator\nrun: 2026-07-31k\n${fm}\n---\n# Orchestrator`;

  it("skips the no-op run that is the whole reason this ticket exists", () => {
    const result = evaluateReport(
      report("promoted: 0\nfiled: 0\nresolved: 0\nnewFindings: 0\nneedsChristian: false"),
    );
    expect(result.verdict).toBe("skip");
    expect(result.reason).toBe("no-op-run");
  });

  it("commits when the run promoted something", () => {
    const result = evaluateReport(
      report("promoted: 1\nfiled: 0\nresolved: 0\nnewFindings: 0\nneedsChristian: false"),
    );
    expect(result.verdict).toBe("commit");
    expect(result.summary).toContain("promoted=1");
  });

  it("commits on a Needs-Christian item even when every counter is zero", () => {
    const result = evaluateReport(
      report("promoted: 0\nfiled: 0\nresolved: 0\nnewFindings: 0\nneedsChristian: true"),
    );
    expect(result.verdict).toBe("commit");
    expect(result.reason).toBe("needs-christian");
  });

  it("commits on a new architecture-health finding alone", () => {
    const result = evaluateReport(
      report("promoted: 0\nfiled: 0\nresolved: 0\nnewFindings: 3\nneedsChristian: false"),
    );
    expect(result.verdict).toBe("commit");
  });

  it("commits when the frontmatter is missing — never silently drops a report", () => {
    const result = evaluateReport("# Orchestrator\n\n## T1 — unblock sweep\npromoted THR-920");
    expect(result.verdict).toBe("commit");
    expect(result.reason).toBe("no-outcome-frontmatter");
  });

  it("does not treat declines as substantive — a decline is 'we looked and it stayed blocked'", () => {
    const result = evaluateReport(
      report("promoted: 0\nfiled: 0\nresolved: 0\nnewFindings: 0\ndeclined: 7\nneedsChristian: false"),
    );
    expect(result.verdict).toBe("skip");
  });
});
