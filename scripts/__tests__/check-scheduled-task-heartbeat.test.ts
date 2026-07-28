import { describe, expect, it } from "vitest";
import { cadenceOf, evaluate } from "../check-scheduled-task-heartbeat";

/**
 * The snapshot `daily-backlog-grooming` measured at 07:24 UTC on 2026-07-28,
 * reproduced verbatim from THR-837. This is the case the probe exists to catch:
 * `tb-orchestrator` eleven-plus slots behind while both hourly siblings were
 * current, because its 20:27 run hung on a permission prompt for 10h49m and the
 * scheduler will not start a second run of a task whose previous run is alive.
 */
const THR_837_SNAPSHOT = [
  {
    taskId: "tb-orchestrator",
    enabled: true,
    cronExpression: "25 * * * *",
    lastRunAt: "2026-07-27T20:27:02Z",
  },
  {
    taskId: "tb-opus-pickup",
    enabled: true,
    cronExpression: "0 * * * *",
    lastRunAt: "2026-07-28T07:01:42Z",
  },
  {
    taskId: "keep-work-flowing-cc",
    enabled: true,
    cronExpression: "45 * * * *",
    lastRunAt: "2026-07-28T06:54:02Z",
  },
];

const AT_MEASUREMENT = new Date("2026-07-28T07:24:00Z").getTime();

describe("cadenceOf", () => {
  it("classifies the five shapes the registry actually uses", () => {
    expect(cadenceOf("25 * * * *")).toBe("hourly");
    expect(cadenceOf("7 9 * * *")).toBe("daily");
    expect(cadenceOf("0 17 * * 5")).toBe("weekly");
    expect(cadenceOf("0 9 1 * *")).toBe("monthly");
    expect(cadenceOf(undefined)).toBeNull();
  });

  it("returns null for shapes it does not understand rather than guessing", () => {
    expect(cadenceOf("not a cron")).toBeNull();
    expect(cadenceOf("* * * *")).toBeNull();
  });
});

describe("evaluate — the THR-837 stall", () => {
  it("flags tb-orchestrator from the snapshot that motivated the ticket", () => {
    const r = evaluate(THR_837_SNAPSHOT, AT_MEASUREMENT);

    expect(r.verdict).toBe("stalled");
    expect(r.needsChristian).toBe(true);
    expect(r.stalled).toHaveLength(1);

    const finding = r.stalled[0];
    expect(finding.taskId).toBe("tb-orchestrator");
    expect(finding.cadence).toBe("hourly");
    expect(finding.slotsBehind).toBeGreaterThanOrEqual(10);
    // The witness is what makes this a stall rather than a sleeping machine.
    expect(["tb-opus-pickup", "keep-work-flowing-cc"]).toContain(finding.witness);
    expect(r.summary).toContain("stalled, not idle");
  });

  it("reports ok once the lane recovers", () => {
    const recovered = THR_837_SNAPSHOT.map((t) =>
      t.taskId === "tb-orchestrator" ? { ...t, lastRunAt: "2026-07-28T07:40:49Z" } : t,
    );
    const r = evaluate(recovered, new Date("2026-07-28T08:05:00Z").getTime());

    expect(r.verdict).toBe("ok");
    expect(r.needsChristian).toBe(false);
    expect(r.stalled).toEqual([]);
  });
});

describe("evaluate — false-positive guards", () => {
  it("stays silent when the whole machine was off (no sibling witness)", () => {
    // Every task equally behind: that is a powered-down machine, not a broken
    // lane. This is the case a naive "older than N hours" alarm would page on.
    const asleep = THR_837_SNAPSHOT.map((t) => ({
      ...t,
      lastRunAt: "2026-07-27T20:00:00Z",
    }));
    const r = evaluate(asleep, new Date("2026-07-28T09:00:00Z").getTime());

    expect(r.verdict).toBe("ok");
    expect(r.stalled).toEqual([]);
  });

  it("ignores disabled tasks", () => {
    const withDisabled = [
      ...THR_837_SNAPSHOT.map((t) =>
        t.taskId === "tb-orchestrator" ? { ...t, enabled: false } : t,
      ),
    ];
    const r = evaluate(withDisabled, AT_MEASUREMENT);

    expect(r.verdict).toBe("ok");
    expect(r.stalled).toEqual([]);
  });

  it("treats a never-run task as context, not a stall", () => {
    const r = evaluate(
      [
        ...THR_837_SNAPSHOT.slice(1),
        { taskId: "monthly-rulebook-review", enabled: true, cronExpression: "0 9 1 * *" },
      ],
      AT_MEASUREMENT,
    );

    expect(r.verdict).toBe("ok");
    expect(r.neverRun).toContain("monthly-rulebook-review");
  });

  it("does not flag a weekly task that is merely a few days late", () => {
    const r = evaluate(
      [
        { taskId: "weekly-retro", enabled: true, cronExpression: "0 17 * * 5", lastRunAt: "2026-07-24T15:10:02Z" },
        { taskId: "tb-opus-pickup", enabled: true, cronExpression: "0 * * * *", lastRunAt: "2026-07-28T07:01:42Z" },
      ],
      AT_MEASUREMENT,
    );

    expect(r.verdict).toBe("ok");
  });

  it("survives an unreadable timestamp without throwing", () => {
    const r = evaluate(
      [{ taskId: "broken", enabled: true, cronExpression: "0 * * * *", lastRunAt: "not-a-date" }],
      AT_MEASUREMENT,
    );

    expect(r.verdict).toBe("ok");
    expect(r.checked).toBe(0);
  });
});

describe("evaluate — the threshold boundary", () => {
  const witness = {
    taskId: "sibling",
    enabled: true,
    cronExpression: "0 * * * *",
    lastRunAt: "2026-07-28T07:00:00Z",
  };
  const now = new Date("2026-07-28T08:00:00Z").getTime();

  it("does not flag a task exactly two slots behind", () => {
    const r = evaluate(
      [{ taskId: "edge", enabled: true, cronExpression: "0 * * * *", lastRunAt: "2026-07-28T06:00:00Z" }, witness],
      now,
    );
    expect(r.verdict).toBe("ok");
  });

  it("flags a task just past two slots behind", () => {
    const r = evaluate(
      [{ taskId: "edge", enabled: true, cronExpression: "0 * * * *", lastRunAt: "2026-07-28T05:59:00Z" }, witness],
      now,
    );
    expect(r.verdict).toBe("stalled");
    expect(r.stalled[0].taskId).toBe("edge");
  });
});
