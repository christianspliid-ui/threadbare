import { describe, expect, it } from "vitest";

import {
  ACTIVITY_PRUNE_DIRS,
  DONOR_REPAIR_MIN_IDLE_MINUTES,
  assessIdleness,
  repairDonorIfSafe,
  type LockHandle,
  type TreeActivity,
} from "../repair-donor-node-modules";
import { CRITICAL_BIN_SHIMS, type HealthFs } from "../node-modules-health";

const MINUTE = 60_000;
const NOW = 1_800_000_000_000;

/**
 * Mutable fake tree, so a test can model `npm install` actually fixing the donor —
 * a fixture whose state never changes could not tell a real repair from a no-op.
 */
function makeMutableFs(initial: { packages: string[] | null; bin: string[] | null }) {
  const state = { ...initial };
  const norm = (p: string) => p.replace(/\\/g, "/");

  const listingFor = (p: string): string[] | undefined => {
    const n = norm(p);
    if (n === "/home/node_modules") return state.packages ?? undefined;
    if (n === "/home/node_modules/.bin") return state.bin ?? undefined;
    return undefined;
  };

  const fsLike: HealthFs = {
    existsSync: (p) => {
      const n = norm(p);
      if (listingFor(n)) return true;
      const parent = n.slice(0, n.lastIndexOf("/"));
      const leaf = n.slice(n.lastIndexOf("/") + 1);
      return (listingFor(parent) ?? []).includes(leaf);
    },
    readdirSync: (p) => {
      const found = listingFor(p);
      if (!found) throw new Error(`ENOENT: ${p}`);
      return found;
    },
    statMtimeMs: () => NOW - 120 * MINUTE,
    isLink: () => false,
  };

  return { fsLike, state };
}

const HEALTHY_PACKAGES = Array.from({ length: 289 }, (_, i) => `pkg-${i}`);
const HEALTHY_BIN = [...CRITICAL_BIN_SHIMS, ...Array.from({ length: 97 }, (_, i) => `shim-${i}`)];

/** The shape the 2026-08-14 forensics found: packages survive, `.bin` is empty. */
const SHIM_STRIPPED = { packages: HEALTHY_PACKAGES, bin: [] as string[] };

function idleActivity(ageMinutes = 90): TreeActivity[] {
  return [
    { label: "donor node_modules (install in flight?)", path: "/home/node_modules", newestMtimeMs: NOW - ageMinutes * MINUTE },
    { label: "worktree wt-a (git)", path: "/home/wt-a", newestMtimeMs: NOW - ageMinutes * MINUTE },
  ];
}

function freeLock(): LockHandle {
  return { path: "/tmp/lock", acquired: true, detail: "lock acquired" };
}

describe("assessIdleness", () => {
  it("is idle when every tree has been quiet past the floor", () => {
    const verdict = assessIdleness(idleActivity(90), NOW);

    expect(verdict.idle).toBe(true);
    expect(verdict.ageMinutes).toBe(90);
  });

  /**
   * The guard THR-1115 exists for. A worktree touched a minute ago is a live session
   * junctioned into the donor we would be mutating.
   */
  it("is NOT idle when any single tree is active, however quiet the rest are", () => {
    const activities: TreeActivity[] = [
      ...idleActivity(600),
      { label: "worktree wt-live (files)", path: "/home/wt-live", newestMtimeMs: NOW - 1 * MINUTE },
    ];
    const verdict = assessIdleness(activities, NOW);

    expect(verdict.idle).toBe(false);
    expect(verdict.busiest?.label).toBe("worktree wt-live (files)");
    expect(verdict.detail).toContain("1m ago");
  });

  /**
   * The donor's own `node_modules` mtime is the freshest evidence that somebody is
   * already installing by hand — the exact race that is the leading hypothesis for the
   * damage. It must veto on its own.
   */
  it("is NOT idle when the donor node_modules is being written right now", () => {
    const activities: TreeActivity[] = [
      { label: "donor node_modules (install in flight?)", path: "/home/node_modules", newestMtimeMs: NOW - 30_000 },
      { label: "worktree wt-a (git)", path: "/home/wt-a", newestMtimeMs: NOW - 600 * MINUTE },
    ];

    expect(assessIdleness(activities, NOW).idle).toBe(false);
  });

  it("treats a future mtime as busy rather than as hugely idle", () => {
    const activities: TreeActivity[] = [
      { label: "skewed clock", path: "/home", newestMtimeMs: NOW + 45 * MINUTE },
    ];
    const verdict = assessIdleness(activities, NOW);

    expect(verdict.idle).toBe(false);
    expect(verdict.ageMinutes).toBeLessThan(0);
  });

  it("treats an all-unreadable set as idle rather than deadlocking the lane", () => {
    const activities: TreeActivity[] = [{ label: "gone", path: "/home/gone", newestMtimeMs: null }];

    expect(assessIdleness(activities, NOW).idle).toBe(true);
  });

  it("prunes the churn directories that would otherwise make every tree look busy", () => {
    expect(ACTIVITY_PRUNE_DIRS.has("node_modules")).toBe(true);
    expect(ACTIVITY_PRUNE_DIRS.has(".git")).toBe(true);
    expect(ACTIVITY_PRUNE_DIRS.has("dist")).toBe(true);
  });
});

describe("repairDonorIfSafe", () => {
  it("takes no action and no lock when the donor is healthy", () => {
    const { fsLike } = makeMutableFs({ packages: HEALTHY_PACKAGES, bin: HEALTHY_BIN });
    let installs = 0;
    let locks = 0;

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => {
        locks += 1;
        return freeLock();
      },
      release: () => {},
      install: () => {
        installs += 1;
        return { ok: true, durationMs: 0, detail: "" };
      },
    });

    expect(outcome.decision).toBe("healthy");
    expect(installs).toBe(0);
    expect(locks).toBe(0);
  });

  /** THR-1115 Done-when: "auto-repair fires against a genuinely damaged donor with no live session". */
  it("repairs a shim-stripped donor when nothing is live, and records before/after", () => {
    const { fsLike, state } = makeMutableFs(SHIM_STRIPPED);

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => freeLock(),
      release: () => {},
      install: () => {
        state.bin = HEALTHY_BIN;
        return { ok: true, durationMs: 240_000, detail: "npm install succeeded" };
      },
    });

    expect(outcome.decision).toBe("repaired");
    expect(outcome.before.verdict).toBe("shim-stripped");
    expect(outcome.after?.verdict).toBe("healthy");
    expect(outcome.summary).toContain("shim-stripped -> healthy");
  });

  it("repairs an absent donor too, not only a shim-stripped one", () => {
    const { fsLike, state } = makeMutableFs({ packages: null, bin: null });

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => freeLock(),
      release: () => {},
      install: () => {
        state.packages = HEALTHY_PACKAGES;
        state.bin = HEALTHY_BIN;
        return { ok: true, durationMs: 250_000, detail: "npm install succeeded" };
      },
    });

    expect(outcome.before.verdict).toBe("absent");
    expect(outcome.decision).toBe("repaired");
  });

  /**
   * THR-1115 Done-when: "a live-session tree is provably NOT repaired while in use
   * (assert the guard, do not just add it)". This is that assertion — the install
   * function counts its own calls, so a guard that silently stopped working fails here
   * rather than in production.
   */
  it("does NOT install while a session is live, and does not even take the lock", () => {
    const { fsLike } = makeMutableFs(SHIM_STRIPPED);
    let installs = 0;
    let locks = 0;

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => [
        { label: "worktree wt-live (files)", path: "/home/wt-live", newestMtimeMs: NOW - 2 * MINUTE },
      ],
      acquire: () => {
        locks += 1;
        return freeLock();
      },
      release: () => {},
      install: () => {
        installs += 1;
        return { ok: true, durationMs: 0, detail: "" };
      },
    });

    expect(outcome.decision).toBe("skipped-live");
    expect(installs).toBe(0);
    expect(locks).toBe(0);
    expect(outcome.summary).toContain("NOT repairing");
    expect(outcome.summary).toContain("wt-live");
  });

  /** Single-flight: a second lane must never install into a target a first one holds. */
  it("does NOT install when another run holds the lock", () => {
    const { fsLike } = makeMutableFs(SHIM_STRIPPED);
    let installs = 0;

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => ({ path: "/tmp/lock", acquired: false, detail: "lock held by another run (3m)" }),
      release: () => {},
      install: () => {
        installs += 1;
        return { ok: true, durationMs: 0, detail: "" };
      },
    });

    expect(outcome.decision).toBe("skipped-locked");
    expect(installs).toBe(0);
  });

  /**
   * The loser of a race must find the donor already fixed and install nothing. Without
   * the under-lock re-probe this is where a second `npm install` would land on a tree the
   * first one had just finished — the very concurrency the ticket names as the leading
   * hypothesis for the damage.
   */
  it("installs nothing when the donor recovered between the first probe and the lock", () => {
    const { fsLike, state } = makeMutableFs(SHIM_STRIPPED);
    let installs = 0;

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => {
        state.bin = HEALTHY_BIN; // the run we were racing finished while we waited
        return freeLock();
      },
      release: () => {},
      install: () => {
        installs += 1;
        return { ok: true, durationMs: 0, detail: "" };
      },
    });

    expect(outcome.decision).toBe("healthy");
    expect(installs).toBe(0);
    expect(outcome.summary).toContain("recovered before repair started");
  });

  it("always releases the lock, including when the install throws", () => {
    const { fsLike } = makeMutableFs(SHIM_STRIPPED);
    let released = 0;

    expect(() =>
      repairDonorIfSafe("/home", {
        fsLike,
        now: () => NOW,
        collect: () => idleActivity(),
        acquire: () => freeLock(),
        release: () => {
          released += 1;
        },
        install: () => {
          throw new Error("npm exploded");
        },
      }),
    ).toThrow("npm exploded");

    expect(released).toBe(1);
  });

  it("reports repair-failed rather than success when the install leaves the tree damaged", () => {
    const { fsLike } = makeMutableFs(SHIM_STRIPPED);

    const outcome = repairDonorIfSafe("/home", {
      fsLike,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => freeLock(),
      release: () => {},
      install: () => ({ ok: true, durationMs: 1_000, detail: "npm install succeeded" }),
    });

    expect(outcome.decision).toBe("repair-failed");
    expect(outcome.after?.verdict).toBe("shim-stripped");
  });

  it("takes no action on an unreadable probe rather than installing blind", () => {
    const hostileFs: HealthFs = {
      existsSync: () => {
        throw new Error("EPERM");
      },
      readdirSync: () => [],
      statMtimeMs: () => null,
      isLink: () => false,
    };
    let installs = 0;

    const outcome = repairDonorIfSafe("/home", {
      fsLike: hostileFs,
      now: () => NOW,
      collect: () => idleActivity(),
      acquire: () => freeLock(),
      release: () => {},
      install: () => {
        installs += 1;
        return { ok: true, durationMs: 0, detail: "" };
      },
    });

    expect(outcome.decision).toBe("unknown");
    expect(installs).toBe(0);
  });

  /**
   * The idle floor must sit below the reaper's 180m deletion threshold, or the repair
   * would need whole-machine quiet it will essentially never see — and a repair that
   * never fires is the 18-hour outage it was written to end.
   */
  it("keeps the idle floor reachable relative to the reaper's deletion threshold", () => {
    expect(DONOR_REPAIR_MIN_IDLE_MINUTES).toBeGreaterThan(0);
    expect(DONOR_REPAIR_MIN_IDLE_MINUTES).toBeLessThan(180);
  });
});
