import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  applyRecord,
  emptyState,
  evaluate,
  hashKeys,
  normalizeKeys,
  parseKeyList,
  readState,
  writeState,
  type PingState,
} from "../check-ping-gate.ts";

function stateWithPinged(keys: string[]): PingState {
  return {
    ...emptyState(),
    pingedKeys: normalizeKeys(keys),
    pingedAt: "2026-08-11T16:58:44.000Z",
    lastKeys: normalizeKeys(keys),
    lastRunAt: "2026-08-11T16:58:44.000Z",
    hash: hashKeys(keys),
  };
}

describe("normalizeKeys", () => {
  it("sorts, lowercases, trims, dedupes and drops empties", () => {
    expect(normalizeKeys([" THR-998 ", "thr-907", "thr-998", "", "  "])).toEqual([
      "thr-907",
      "thr-998",
    ]);
  });

  it("makes re-ordering and re-casing invisible to the hash", () => {
    expect(hashKeys(["b", "A"])).toBe(hashKeys(["a", "B"]));
  });

  it("still distinguishes a genuinely different set", () => {
    expect(hashKeys(["a", "b"])).not.toBe(hashKeys(["a", "b", "c"]));
  });
});

describe("parseKeyList", () => {
  it("splits a comma list", () => {
    expect(parseKeyList("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("treats null and empty as no keys", () => {
    expect(parseKeyList(null)).toEqual([]);
    expect(parseKeyList("")).toEqual([]);
    expect(parseKeyList(" , , ")).toEqual([]);
  });
});

describe("evaluate — the gate", () => {
  it("rings when an ask joins the set", () => {
    const r = evaluate(["a", "b", "c"], stateWithPinged(["a", "b"]));
    expect(r.verdict).toBe("ping");
    expect(r.needsPing).toBe(true);
    expect(r.added).toEqual(["c"]);
    expect(r.removed).toEqual([]);
  });

  it("stays quiet when the set is unchanged", () => {
    const r = evaluate(["a", "b"], stateWithPinged(["b", "a"]));
    expect(r.verdict).toBe("unchanged");
    expect(r.needsPing).toBe(false);
  });

  it("stays quiet on a removal-only diff", () => {
    // The rule the derivation log had to state in English (2026-08-10 13:58Z):
    // a doorbell here carries only asks he has already seen, delivered on the
    // occasion of him having completed the one that left.
    const r = evaluate(["a", "b"], stateWithPinged(["a", "b", "c"]));
    expect(r.verdict).toBe("silent");
    expect(r.needsPing).toBe(false);
    expect(r.removed).toEqual(["c"]);
    expect(r.added).toEqual([]);
  });

  it("rings when an arrival accompanies a departure", () => {
    const r = evaluate(["a", "d"], stateWithPinged(["a", "c"]));
    expect(r.verdict).toBe("ping");
    expect(r.added).toEqual(["d"]);
    expect(r.removed).toEqual(["c"]);
  });

  it("rings on a rotated key, which is how a reworded ask forces a doorbell", () => {
    const r = evaluate(["thr-998-risk-word-v2"], stateWithPinged(["thr-998-risk-word"]));
    expect(r.verdict).toBe("ping");
    expect(r.added).toEqual(["thr-998-risk-word-v2"]);
  });

  it("does not ring when nothing needs Christian", () => {
    const r = evaluate([], stateWithPinged(["a", "b"]));
    expect(r.verdict).toBe("empty");
    expect(r.needsPing).toBe(false);
  });

  it("rings once when no baseline exists, rather than assuming he has seen it", () => {
    const r = evaluate(["a"], null);
    expect(r.verdict).toBe("ping");
    expect(r.added).toEqual(["a"]);
  });

  it("distinguishes a missing baseline from a genuinely empty one", () => {
    // Both have an empty pinged set, but only one has ever rung. After every ask
    // resolves, the next arrival-free run must not re-ring.
    const noBaseline = evaluate([], null);
    expect(noBaseline.needsPing).toBe(false);
    const emptyBaseline = evaluate(["a"], stateWithPinged([]));
    expect(emptyBaseline.verdict).toBe("ping");
  });

  it("reproduces the 2026-08-11 18:00Z decision that was made by hand", () => {
    const pinged = [
      "linear-signed-out",
      "thr-907-slice-verdict",
      "thr-974-consequence-verdict",
      "thr-998-action-card-risk-word",
      "thr-962-sound-routing",
      "thr-961-sound-feel",
      "lane-silence-pause-deliberate",
      "aftermath-pops-recheck",
      "tenacious-trait-parked",
    ];
    const now = pinged.filter((k) => k !== "linear-signed-out");
    const r = evaluate(now, stateWithPinged(pinged));
    expect(r.verdict).toBe("silent");
    expect(r.needsPing).toBe(false);
    expect(r.removed).toEqual(["linear-signed-out"]);
  });

  it("does not ring for the play sitting merely being promoted to lead", () => {
    // Rank is prose, not identity. The 18:00Z run's judgment call, mechanized.
    const keys = ["thr-907-slice-verdict", "thr-974-consequence-verdict"];
    expect(evaluate(keys, stateWithPinged(keys)).needsPing).toBe(false);
  });
});

describe("applyRecord — baseline movement", () => {
  const now = "2026-08-11T18:00:00.000Z";

  it("advances the baseline when a ping sent", () => {
    const next = applyRecord(stateWithPinged(["a"]), ["a", "b"], "pinged", now);
    expect(next.pingedKeys).toEqual(["a", "b"]);
    expect(next.pingedAt).toBe(now);
    expect(next.hash).toBe(hashKeys(["a", "b"]));
  });

  it("leaves the baseline alone on a silent run", () => {
    const next = applyRecord(stateWithPinged(["a", "b", "c"]), ["a", "b"], "silent", now);
    expect(next.pingedKeys).toEqual(["a", "b", "c"]);
    expect(next.lastKeys).toEqual(["a", "b"]);
    expect(next.lastRunAt).toBe(now);
  });

  it("keeps a failed send retryable — the next run still owes the ping", () => {
    // The lane records `pinged` only after the DM is accepted. Simulate a throw
    // by recording nothing, then re-running the gate.
    const before = stateWithPinged(["a"]);
    const owed = evaluate(["a", "b"], before);
    expect(owed.needsPing).toBe(true);
    const stillOwed = evaluate(["a", "b"], before);
    expect(stillOwed.needsPing).toBe(true);
    expect(stillOwed.added).toEqual(["b"]);
  });

  it("does not let a run of removals erode the baseline into a false ping", () => {
    // Three consecutive silent runs shedding one ask each; no run may ring, and
    // the baseline must still describe what he was actually shown.
    let state = stateWithPinged(["a", "b", "c", "d"]);
    for (const keys of [["a", "b", "c"], ["a", "b"], ["a"]]) {
      const r = evaluate(keys, state);
      expect(r.needsPing).toBe(false);
      state = applyRecord(state, keys, "silent", now);
    }
    expect(state.pingedKeys).toEqual(["a", "b", "c", "d"]);
    expect(evaluate(["a"], state).needsPing).toBe(false);

    // A genuine arrival after all that shedding still rings, and only then does
    // the baseline collapse to what he has now been shown.
    const arrival = evaluate(["a", "e"], state);
    expect(arrival.verdict).toBe("ping");
    expect(arrival.added).toEqual(["e"]);
    state = applyRecord(state, ["a", "e"], "pinged", now);
    expect(state.pingedKeys).toEqual(["a", "e"]);
    expect(evaluate(["a", "e"], state).verdict).toBe("unchanged");
  });
});

describe("state file round-trip", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "kwf-ping-"));
    path = join(dir, "nested", "kwf-ping-state.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates parent directories and round-trips", () => {
    const state = stateWithPinged(["a", "b"]);
    writeState(path, state);
    expect(existsSync(path)).toBe(true);
    expect(readState(path)).toEqual(state);
  });

  it("returns null for a missing file so the first run rings", () => {
    expect(readState(join(dir, "absent.json"))).toBeNull();
  });

  it("returns null for corrupt JSON rather than throwing", () => {
    writeFileSync(path.replace("nested", "."), "{not json", "utf8");
    expect(readState(path.replace("nested", "."))).toBeNull();
  });

  it("normalizes keys read back from disk", () => {
    writeFileSync(
      path.replace("nested", "."),
      JSON.stringify({ version: 1, pingedKeys: ["B", "a", "a"] }),
      "utf8",
    );
    expect(readState(path.replace("nested", "."))?.pingedKeys).toEqual(["a", "b"]);
  });

  it("writes valid JSON with a trailing newline", () => {
    writeState(path, emptyState());
    const raw = readFileSync(path, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
