import { describe, expect, it } from "vitest";

import {
  CRITICAL_BIN_SHIMS,
  HEALTHY_MIN_BIN_ENTRIES,
  STUB_MAX_PACKAGE_ENTRIES,
  buildHealthReport,
  formatHealthFingerprint,
  probeTreeHealth,
  type HealthFs,
} from "../node-modules-health";

/**
 * Build a fake tree. `packages` is the top-level `node_modules` listing and `bin` the
 * `.bin` listing; passing `bin: null` models a `node_modules` with no `.bin` at all.
 *
 * Paths are normalised to forward slashes so the fixture matches on both platforms —
 * `path.join` emits backslashes on Windows, and a fixture keyed on POSIX separators
 * would silently return "absent" for every lookup there, making every assertion below
 * pass for the wrong reason.
 */
function makeFs(trees: Record<string, { packages: string[] | null; bin: string[] | null; linked?: boolean }>): HealthFs {
  const norm = (p: string) => p.replace(/\\/g, "/");
  const listing = new Map<string, string[]>();
  const links = new Set<string>();

  for (const [root, spec] of Object.entries(trees)) {
    const nm = `${norm(root)}/node_modules`;
    if (spec.packages !== null) listing.set(nm, spec.packages);
    if (spec.bin !== null) listing.set(`${nm}/.bin`, spec.bin);
    if (spec.linked) links.add(nm);
  }

  return {
    existsSync: (p) => {
      const n = norm(p);
      if (listing.has(n)) return true;
      // A bin shim exists iff its parent listing names it.
      const parent = n.slice(0, n.lastIndexOf("/"));
      const leaf = n.slice(n.lastIndexOf("/") + 1);
      return (listing.get(parent) ?? []).includes(leaf);
    },
    readdirSync: (p) => {
      const found = listing.get(norm(p));
      if (!found) throw new Error(`ENOENT: ${p}`);
      return found;
    },
    statMtimeMs: () => 1_700_000_000_000,
    isLink: (p) => links.has(norm(p)),
  };
}

const HEALTHY_PACKAGES = Array.from({ length: 289 }, (_, i) => `pkg-${i}`);
const HEALTHY_BIN = [...CRITICAL_BIN_SHIMS, ...Array.from({ length: 97 }, (_, i) => `shim-${i}`)];

describe("probeTreeHealth", () => {
  it("reports a full install as healthy", () => {
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("healthy");
    expect(result.packageCount).toBe(289);
    expect(result.missingShims).toEqual([]);
  });

  it("reports an absent node_modules", () => {
    const fsLike = makeFs({ "/repo": { packages: null, bin: null } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("absent");
    expect(result.detail).toContain("npm install");
  });

  /**
   * Impediment #520 ×2: a reused pool worktree carries a stub holding only the hidden
   * `.vite` cache. The documented pre-flight (`[ -d node_modules ]`) passes against it,
   * which is precisely why the probe must count rather than test for existence.
   */
  it("classifies a cache-only stub as a stub, not as healthy", () => {
    const fsLike = makeFs({ "/repo": { packages: [".vite", ".cache"], bin: null } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("stub");
    expect(result.packageCount).toBeLessThanOrEqual(STUB_MAX_PACKAGE_ENTRIES);
  });

  /**
   * The signature the 2026-08-14 forensics actually found in the reaper log: packages
   * survive, `.bin` is empty. A deletion would have taken the packages too, so a probe
   * that only asked "does node_modules exist?" would call this tree healthy — and that
   * is the tree that produces `'esbuild' is not recognized` 20 minutes later.
   */
  it("classifies packages-present-but-bin-empty as shim-stripped", () => {
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin: [] } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("shim-stripped");
    expect(result.packageCount).toBe(289);
    expect(result.binCount).toBe(0);
    expect(result.missingShims).toEqual([...CRITICAL_BIN_SHIMS]);
  });

  it("classifies a populated .bin that is missing a critical shim as shim-stripped", () => {
    const bin = Array.from({ length: HEALTHY_MIN_BIN_ENTRIES + 20 }, (_, i) => `shim-${i}`);
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("shim-stripped");
    expect(result.missingShims).toEqual([...CRITICAL_BIN_SHIMS]);
  });

  it("accepts a .exe-suffixed shim as present", () => {
    const bin = [...CRITICAL_BIN_SHIMS.map((s) => `${s}.exe`), ...Array.from({ length: 97 }, (_, i) => `shim-${i}`)];
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin } });

    expect(probeTreeHealth("/repo", "session", fsLike).verdict).toBe("healthy");
  });

  it("records a junctioned node_modules as linked without penalising the verdict", () => {
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN, linked: true } });
    const result = probeTreeHealth("/repo", "session", fsLike);

    expect(result.verdict).toBe("healthy");
    expect(result.linked).toBe(true);
  });

  it("degrades to unknown rather than throwing when the filesystem errors", () => {
    const hostileFs: HealthFs = {
      existsSync: () => {
        throw new Error("EPERM");
      },
      readdirSync: () => [],
      statMtimeMs: () => null,
      isLink: () => false,
    };

    expect(probeTreeHealth("/repo", "session", hostileFs).verdict).toBe("unknown");
  });
});

describe("buildHealthReport", () => {
  it("probes the donor tree and reports the worst verdict of the two", () => {
    const fsLike = makeFs({
      "/repo/.claude/worktrees/wt": { packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN },
      "/repo": { packages: HEALTHY_PACKAGES, bin: [] },
    });
    const report = buildHealthReport("/repo/.claude/worktrees/wt", fsLike, () => "/repo");

    expect(report.session.verdict).toBe("healthy");
    expect(report.donor?.verdict).toBe("shim-stripped");
    expect(report.verdict).toBe("shim-stripped");
    expect(report.degraded).toBe(true);
    expect(report.summary).toContain("donor");
  });

  /**
   * The 2026-08-09 shape (#501/#502/#503/#506): both trees dead at once, so the
   * documented junction repair has no donor and `npm install` is the only path. The
   * report must say so rather than naming a donor that cannot help.
   */
  it("reports both trees degraded when the donor is dead too", () => {
    const fsLike = makeFs({
      "/repo/.claude/worktrees/wt": { packages: [".vite"], bin: null },
      "/repo": { packages: null, bin: null },
    });
    const report = buildHealthReport("/repo/.claude/worktrees/wt", fsLike, () => "/repo");

    expect(report.session.verdict).toBe("stub");
    expect(report.donor?.verdict).toBe("absent");
    expect(report.verdict).toBe("absent");
  });

  it("omits the donor when the session IS the home tree", () => {
    const fsLike = makeFs({ "/repo": { packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN } });
    const report = buildHealthReport("/repo", fsLike, () => null);

    expect(report.donor).toBeNull();
    expect(report.degraded).toBe(false);
    expect(formatHealthFingerprint(report)).toBe("session:healthy");
  });

  it("does not mark the run degraded when a probe merely could not read", () => {
    const hostileFs: HealthFs = {
      existsSync: () => {
        throw new Error("EPERM");
      },
      readdirSync: () => [],
      statMtimeMs: () => null,
      isLink: () => false,
    };
    const report = buildHealthReport("/repo", hostileFs, () => null);

    expect(report.verdict).toBe("unknown");
    expect(report.degraded).toBe(false);
  });
});

describe("formatHealthFingerprint", () => {
  it("names both trees so a lane log records which one was damaged", () => {
    const fsLike = makeFs({
      "/repo/.claude/worktrees/wt": { packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN },
      "/repo": { packages: HEALTHY_PACKAGES, bin: [] },
    });
    const report = buildHealthReport("/repo/.claude/worktrees/wt", fsLike, () => "/repo");

    expect(formatHealthFingerprint(report)).toBe("session:healthy/donor:shim-stripped");
  });
});
