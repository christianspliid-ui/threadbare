import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUIDANCE_GATE_MODE,
  STAMP_KEY,
  SWEEP_TOKEN,
  classifyStamp,
  computeSweepFindings,
  describeStampRow,
  parseSweepAttestations,
  readStamp,
  resolveDiffBase,
  splitRemoteTrackingBase,
  type GitRunner,
  type GuidanceManifest,
} from "../check-guidance-freshness";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

/**
 * A two-doctrine manifest. Two, deliberately: the whole point of scoping the attestation
 * by doctrine id is that a sweep attested for one doctrine must not waive another, and a
 * single-doctrine fixture cannot distinguish "scoped correctly" from "waives everything".
 */
const MANIFEST: GuidanceManifest = {
  doctrines: {
    prose: {
      version: 2,
      authorities: ["Docs/canon/prose.md"],
      dependents: ["skills/a.md", "skills/b.md", "Docs/exemplars.md"],
      manualDependents: ["vault:Systems/Tonal Bible.md"],
    },
    "ui-laws": {
      version: 1,
      authorities: ["Docs/design-system/laws.md"],
      dependents: ["skills/frontend.md"],
    },
  },
};

// ---------------------------------------------------------------------------
// computeSweepFindings — the gate's whole decision, as a pure function
// ---------------------------------------------------------------------------

describe("computeSweepFindings", () => {
  it("is silent when no authority was touched", () => {
    expect(computeSweepFindings(MANIFEST, new Set(["src/engine/tick.ts", "skills/a.md"]))).toEqual([]);
  });

  it("flags exactly the untouched dependents when an authority changed", () => {
    const findings = computeSweepFindings(MANIFEST, new Set(["Docs/canon/prose.md", "skills/a.md"]));
    expect(findings).toHaveLength(1);
    expect(findings[0].doctrineId).toBe("prose");
    expect(findings[0].touchedAuthorities).toEqual(["Docs/canon/prose.md"]);
    expect(findings[0].untouchedDependents).toEqual(["skills/b.md", "Docs/exemplars.md"]);
  });

  it("is silent when an authority changed and every dependent was swept", () => {
    const changed = new Set(["Docs/canon/prose.md", "skills/a.md", "skills/b.md", "Docs/exemplars.md"]);
    expect(computeSweepFindings(MANIFEST, changed)).toEqual([]);
  });

  it("never gates on manualDependents — they cannot appear in a diff", () => {
    // The out-of-repo vault page is listed and can never be in `changed`. If it were
    // considered, EVERY authority edit would fail forever and the gate would be useless
    // rather than merely noisy — the failure mode worth pinning.
    const changed = new Set(["Docs/canon/prose.md", "skills/a.md", "skills/b.md", "Docs/exemplars.md"]);
    const findings = computeSweepFindings(MANIFEST, changed);
    expect(findings).toEqual([]);
  });

  it("scopes findings per doctrine — one authority edit does not implicate another doctrine", () => {
    const findings = computeSweepFindings(MANIFEST, new Set(["Docs/design-system/laws.md"]));
    expect(findings.map((f) => f.doctrineId)).toEqual(["ui-laws"]);
    expect(findings[0].untouchedDependents).toEqual(["skills/frontend.md"]);
  });

  it("reports both doctrines when both authorities move in one diff", () => {
    const findings = computeSweepFindings(
      MANIFEST,
      new Set(["Docs/canon/prose.md", "Docs/design-system/laws.md"]),
    );
    expect(findings.map((f) => f.doctrineId).sort()).toEqual(["prose", "ui-laws"]);
  });

  it("skips a doctrine that declares no authorities rather than throwing", () => {
    const broken: GuidanceManifest = { doctrines: { x: { version: 1, dependents: ["a.md"] } } };
    expect(computeSweepFindings(broken, new Set(["a.md"]))).toEqual([]);
  });

  it("ignores non-string entries in authorities/dependents instead of crashing", () => {
    const messy: GuidanceManifest = {
      doctrines: { x: { version: 1, authorities: ["auth.md", 7, null], dependents: ["dep.md", {}] } },
    };
    const findings = computeSweepFindings(messy, new Set(["auth.md"]));
    expect(findings[0].untouchedDependents).toEqual(["dep.md"]);
  });
});

// ---------------------------------------------------------------------------
// parseSweepAttestations — the escape hatch, and its scoping
// ---------------------------------------------------------------------------

describe("parseSweepAttestations", () => {
  it("extracts the doctrine id and disposition from an em-dash form", () => {
    const body = ["docs: reword a canon heading", "", `${SWEEP_TOKEN} prose — heading only, no rule changed`].join("\n");
    expect(parseSweepAttestations(body)).toEqual([
      { doctrineId: "prose", disposition: "heading only, no rule changed" },
    ]);
  });

  it("accepts a hyphen or a colon as the separator", () => {
    // Commit bodies are typed by hand. A gate that accepts only one dash shape teaches
    // people it is broken, and they stop using the hatch rather than fixing the dash.
    expect(parseSweepAttestations(`${SWEEP_TOKEN} prose - checked all three`)[0]).toEqual({
      doctrineId: "prose",
      disposition: "checked all three",
    });
    expect(parseSweepAttestations(`${SWEEP_TOKEN} prose: checked all three`)[0]).toEqual({
      doctrineId: "prose",
      disposition: "checked all three",
    });
  });

  it("captures a wrapped disposition across continuation lines", () => {
    const body = [
      `${SWEEP_TOKEN} prose — read every dependent against v2;`,
      "the draft prompt already states the narrator rule verbatim so nothing changed.",
      "",
      "Fixes THR-1253",
    ].join("\n");
    expect(parseSweepAttestations(body)[0].disposition).toBe(
      "read every dependent against v2; the draft prompt already states the narrator rule verbatim so nothing changed.",
    );
  });

  it("stops the capture at a trailer so the close keyword is not swallowed", () => {
    // The wiki gate learned this the expensive way (THR-755 row 2): a truncated or
    // over-long recorded reason guts the audit half of the hatch, which is the only
    // thing that makes it an escape hatch rather than a bypass.
    const body = [`${SWEEP_TOKEN} prose — nothing to sweep`, "Fixes THR-1253"].join("\n");
    expect(parseSweepAttestations(body)[0].disposition).toBe("nothing to sweep");
  });

  it("returns nothing when the token carries an empty value", () => {
    expect(parseSweepAttestations(`${SWEEP_TOKEN}   `)).toEqual([]);
  });

  it("returns nothing when the token is absent", () => {
    expect(parseSweepAttestations("feat: unrelated work\n\nFixes THR-1")).toEqual([]);
  });

  it("does NOT arm when the token appears mid-sentence — the marker is line-anchored", () => {
    // Impediment #787, measured on `check-wiki-freshness` the same day this gate was
    // written: a commit body *describing* the marker armed it, the gate printed
    // `OK (exempt)` with the prose as the reason, and exited 0 over a genuinely stale
    // page. Same class as the `Fixes THR-XX` prose trigger (THR-738), same fix.
    //
    // The danger zone is exactly the documentation this repo asks for — an impediment
    // row about a marker cannot avoid naming it — so this is the test that has to hold.
    const body = [
      "docs(impediments): log the marker's granularity problem",
      "",
      `The gate's ${SWEEP_TOKEN} line covers the whole diff, which is too coarse when a`,
      "change reaches ten subsystems by design.",
    ].join("\n");
    expect(parseSweepAttestations(body)).toEqual([]);
  });

  it("still arms when the line is indented", () => {
    // git indents nothing, but authors do — a leading tab or two spaces is a formatting
    // habit, not an attempt to write prose about the marker.
    expect(parseSweepAttestations(`  ${SWEEP_TOKEN} prose — indented but deliberate`)[0]).toEqual({
      doctrineId: "prose",
      disposition: "indented but deliberate",
    });
  });

  it("does not let a mid-sentence mention inside a real attestation's wrap re-arm it", () => {
    const body = [
      `${SWEEP_TOKEN} prose — read all three;`,
      `a future ${SWEEP_TOKEN} for ui-laws will be its own line.`,
    ].join("\n");
    const parsed = parseSweepAttestations(body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].doctrineId).toBe("prose");
  });

  it("finds every attestation when several commits each carry one", () => {
    const body = [`${SWEEP_TOKEN} prose — a`, "", "other commit", "", `${SWEEP_TOKEN} ui-laws — b`].join("\n");
    expect(parseSweepAttestations(body).map((a) => a.doctrineId)).toEqual(["prose", "ui-laws"]);
  });

  it("records an attestation whose id matches no doctrine, rather than dropping it", () => {
    // The caller compares against the manifest; an unrecognised id must waive NOTHING,
    // but it must still be visible so the verdict can say "you attested for something we
    // do not know about" instead of silently failing the sweep with no explanation.
    const parsed = parseSweepAttestations(`${SWEEP_TOKEN} typo-doctrine — oops`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].doctrineId).toBe("typo-doctrine");
  });
});

// ---------------------------------------------------------------------------
// readStamp / classifyStamp — the advisory half
// ---------------------------------------------------------------------------

describe("readStamp", () => {
  it("reads the key out of a leading frontmatter block", () => {
    const content = ["---", "name: x", `${STAMP_KEY}: prose@2`, "---", "", "body"].join("\n");
    expect(readStamp(content)).toEqual({ hasFrontmatter: true, stamp: "prose@2" });
  });

  it("strips surrounding quotes", () => {
    const content = ["---", `${STAMP_KEY}: "prose@2"`, "---"].join("\n");
    expect(readStamp(content).stamp).toBe("prose@2");
  });

  it("distinguishes no-frontmatter from frontmatter-without-the-key", () => {
    // These are different facts and remediate differently — one is a file shape, the
    // other is a real gap. Collapsing them is how a report starts lying about its debt.
    expect(readStamp("# Just a heading\n\ntext")).toEqual({ hasFrontmatter: false, stamp: null });
    expect(readStamp(["---", "name: x", "---", "body"].join("\n"))).toEqual({
      hasFrontmatter: true,
      stamp: null,
    });
  });

  it("does not mistake a horizontal rule further down the file for frontmatter", () => {
    const content = ["# Title", "", "---", `${STAMP_KEY}: prose@2`, "---"].join("\n");
    expect(readStamp(content)).toEqual({ hasFrontmatter: false, stamp: null });
  });

  it("stops at the closing fence and ignores a matching line in the body", () => {
    const content = ["---", "name: x", "---", `${STAMP_KEY}: prose@99`].join("\n");
    expect(readStamp(content).stamp).toBeNull();
  });
});

describe("classifyStamp", () => {
  const withStamp = (v: string) => ["---", "name: x", `${STAMP_KEY}: ${v}`, "---"].join("\n");

  it("calls a matching stamp current", () => {
    expect(classifyStamp("a.md", withStamp("prose@2"), "prose", "2")).toEqual({
      kind: "current",
      file: "a.md",
      stamp: "prose@2",
    });
  });

  it("calls a trailing stamp stale and names what was expected", () => {
    expect(classifyStamp("a.md", withStamp("prose@1"), "prose", "2")).toEqual({
      kind: "stale",
      file: "a.md",
      stamp: "prose@1",
      expected: "prose@2",
    });
  });

  it("calls an unreadable dependent missing, not stale", () => {
    expect(classifyStamp("gone.md", null, "prose", "2")).toEqual({ kind: "missing", file: "gone.md" });
  });

  it("reports no-frontmatter as its own kind", () => {
    expect(classifyStamp("p.md", "prompt text", "prose", "2")).toEqual({ kind: "no-frontmatter", file: "p.md" });
  });
});

describe("describeStampRow", () => {
  it("says nothing for a current row", () => {
    // Reporting every healthy row buries the two that matter — the report's usefulness
    // is inversely proportional to how much of it is noise.
    expect(describeStampRow({ kind: "current", file: "a.md", stamp: "prose@2" }, "prose")).toBeNull();
  });

  it("frames a missing dependent as a manifest defect, never as the PR's fault", () => {
    const line = describeStampRow({ kind: "missing", file: "gone.md" }, "prose");
    expect(line).toContain("stale manifest entry");
    expect(line).toContain("correct the manifest, not the PR");
  });
});

// ---------------------------------------------------------------------------
// Diff-base helpers — inherited semantics, pinned so they cannot silently regress
// ---------------------------------------------------------------------------

describe("splitRemoteTrackingBase", () => {
  it("splits a remote-tracking base", () => {
    expect(splitRemoteTrackingBase("origin/main", ["origin"])).toEqual({ remote: "origin", branch: "main" });
  });

  it("does not read a local branch containing a slash as a remote", () => {
    expect(splitRemoteTrackingBase("docs/plan-x", ["origin"])).toBeNull();
  });

  it("prefers the longest matching remote", () => {
    expect(splitRemoteTrackingBase("origin/mirror/main", ["origin", "origin/mirror"])).toEqual({
      remote: "origin/mirror",
      branch: "main",
    });
  });
});

describe("resolveDiffBase", () => {
  it("returns the merge base, not the base ref tip", () => {
    // THR-1191: a two-dot diff against an advanced base sweeps every file `main` changed
    // since the branch point into this PR's changed set — which for THIS gate would arm
    // the sweep over a canon edit the PR never made. Sitting behind main is normal since
    // strict mode was dropped, so that is the common case, not a corner one.
    const run: GitRunner = (args) =>
      args[0] === "rev-parse" ? "abc\n" : args[0] === "merge-base" ? "deadbeef\n" : null;
    expect(resolveDiffBase(run, "origin/main")).toBe("deadbeef");
  });

  it("falls back to the base ref when merge-base yields nothing", () => {
    const run: GitRunner = (args) => (args[0] === "rev-parse" ? "abc\n" : args[0] === "merge-base" ? "" : null);
    expect(resolveDiffBase(run, "origin/main")).toBe("origin/main");
  });

  it("returns null when the base ref does not resolve at all", () => {
    expect(resolveDiffBase(() => null, "origin/main")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The real manifest — the gate is worthless if it points at files that do not exist
// ---------------------------------------------------------------------------

describe("Docs/guidance-manifest.json", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "Docs", "guidance-manifest.json"), "utf8"),
  ) as GuidanceManifest;

  it("registers at least one doctrine", () => {
    expect(Object.keys(manifest.doctrines ?? {}).length).toBeGreaterThan(0);
  });

  it("every authority and dependent path resolves in the tree", () => {
    // A manifest entry pointing at a moved file makes the gate lie in both directions:
    // the authority never arms, and the dependent can never be swept. The check script
    // degrades to a report row rather than failing a PR (fail-soft, NFP #4) — which is
    // exactly why the assertion has to live here instead.
    const missing: string[] = [];
    for (const doctrine of Object.values(manifest.doctrines ?? {})) {
      const paths = [
        ...(doctrine.authorities as string[]),
        ...(doctrine.dependents as string[]),
      ];
      for (const rel of paths) {
        if (!fs.existsSync(path.join(REPO_ROOT, rel))) missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });

  it("declares manualDependents with the vault: prefix so they are never diff-gated", () => {
    for (const doctrine of Object.values(manifest.doctrines ?? {})) {
      for (const rel of (doctrine.manualDependents as string[] | undefined) ?? []) {
        expect(rel.startsWith("vault:")).toBe(true);
      }
    }
  });

  it("gives every doctrine an integer version, so the retro trigger can compare them", () => {
    for (const doctrine of Object.values(manifest.doctrines ?? {})) {
      expect(Number.isInteger(doctrine.version)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Burn-in bookkeeping — the one thing that stops "advisory" becoming permanent
// ---------------------------------------------------------------------------

describe("GUIDANCE_GATE_MODE", () => {
  it("ships advisory and names both the review date and the flip ticket", () => {
    expect(GUIDANCE_GATE_MODE.shippedAs).toBe("advisory");
    expect(GUIDANCE_GATE_MODE.flipReviewAfter).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(GUIDANCE_GATE_MODE.flipTicket).toMatch(/^THR-\d+$/);
  });
});
