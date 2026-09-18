/**
 * The content-model census's fold (THR-1489).
 *
 * Only `censusSites` and `renderCensus` are covered: `runCensus` boots a world and ticks
 * it 200 times, which is a heavy-lane concern and proves nothing this fold does not. The
 * judgement worth pinning is that a site with no traces reads as **silent** rather than
 * vanishing — an absent row is how a census stops reporting the thing it exists to find.
 */
import { describe, it, expect } from "vitest";

import { CONTENT_QUERY_SITES } from "../../src/types/contentQuery";
import { censusSites, renderCensus } from "../content-model-census.js";

describe("the query-site census", () => {
  it("reports a row for every site, including those with no traces", () => {
    const rows = censusSites([]);

    expect(rows.map(row => row.site)).toEqual([...CONTENT_QUERY_SITES]);
    expect(rows.every(row => row.silent)).toBe(true);
    expect(rows.every(row => row.resolved === 0 && row.empty === 0)).toBe(true);
  });

  it("separates a site that resolved from one that only ever came back empty", () => {
    // The distinction the report turns on: `step_reward_pool` is working,
    // `encounter_seed` is being asked and answering nothing, and
    // `undertaking_catalyst` is never asked at all. Three different problems.
    const rows = censusSites([
      { category: "content.query_resolved", site: "step_reward_pool" },
      { category: "content.query_resolved", site: "step_reward_pool" },
      { category: "content.query_empty", site: "encounter_seed" },
    ]);
    const bySite = new Map(rows.map(row => [row.site, row]));

    expect(bySite.get("step_reward_pool")).toMatchObject({ resolved: 2, empty: 0, silent: false });
    expect(bySite.get("encounter_seed")).toMatchObject({ resolved: 0, empty: 1, silent: false });
    expect(bySite.get("undertaking_catalyst")).toMatchObject({ resolved: 0, empty: 0, silent: true });
  });

  it("ignores traces of other categories rather than counting them as hits", () => {
    // Falsification: the fold filters on category, not merely on the presence of a
    // `site` field. Plenty of unrelated traces carry one.
    const rows = censusSites([
      { category: "encounter_seed_planted", site: "encounter_seed" },
      { category: "aftermath_reward_draw", site: "reward_draw" },
    ]);

    expect(rows.every(row => row.silent)).toBe(true);
  });

  it("names the silent sites in the rendered report, and excludes `debug`", () => {
    const report = renderCensus({
      ticks: 200,
      seed: 42,
      deadTags: ["#contraband"],
      liveTags: 106,
      sites: censusSites([{ category: "content.query_resolved", site: "step_reward_pool" }]),
    });

    expect(report).toContain("#contraband");
    expect(report).toContain("`encounter_seed`");
    // `debug` is only ever hit by a human at a console, so listing it as a finding
    // every week would be noise that trains the reader to skip the block.
    expect(report).not.toMatch(/no hits:.*`debug`/);
    expect(report).toContain("2000-entry ring");
  });

  it("decides the two seeding sites off seed consumptions when a ledger is given, and keeps the ring's view beside them (THR-1514)", () => {
    // The ring saw one resolution at `encounter_seed` and nothing at
    // `undertaking_catalyst`; the state saw far more. The state wins, the ring's
    // undercount stays visible, and the non-seeding sites are untouched.
    const rows = censusSites(
      [
        { category: "content.query_resolved", site: "encounter_seed" },
        { category: "content.query_resolved", site: "step_reward_pool" },
      ],
      [
        { site: "encounter_seed", ranQuery: true, consumption: "spawned" },
        { site: "encounter_seed", ranQuery: true, consumption: "spawned" },
        { site: "encounter_seed", ranQuery: true, consumption: "family_ready" },
        // A direct-template spawn ran no query and must not count as a resolution.
        { site: "encounter_seed", ranQuery: false, consumption: "spawned" },
        { site: "undertaking_catalyst", ranQuery: true, consumption: "family_ready" },
        { site: "undertaking_catalyst", ranQuery: true, consumption: undefined },
      ],
    );
    const bySite = new Map(rows.map(row => [row.site, row]));

    expect(bySite.get("encounter_seed")).toMatchObject({
      resolved: 2, empty: 1, silent: false, source: "state", ring: { resolved: 1, empty: 0 },
    });
    expect(bySite.get("undertaking_catalyst")).toMatchObject({
      resolved: 0, empty: 1, silent: false, source: "state", ring: { resolved: 0, empty: 0 },
    });
    expect(bySite.get("step_reward_pool")).toMatchObject({ resolved: 1, empty: 0, source: "ring" });
    expect(bySite.get("step_reward_pool")!.ring).toBeUndefined();
  });

  it("a seeding site is silent only when neither state nor ring saw it", () => {
    const rows = censusSites([], [{ site: "undertaking_catalyst", ranQuery: true, consumption: undefined }]);
    const bySite = new Map(rows.map(row => [row.site, row]));
    expect(bySite.get("undertaking_catalyst")).toMatchObject({ resolved: 0, empty: 0, silent: true, source: "state" });

    const rowsWithRing = censusSites(
      [{ category: "content.query_empty", site: "undertaking_catalyst" }],
      [{ site: "undertaking_catalyst", ranQuery: true, consumption: undefined }],
    );
    expect(rowsWithRing.find(r => r.site === "undertaking_catalyst")).toMatchObject({ silent: false, resolved: 0, empty: 0 });
  });

  it("renders the source per row and reports an unexplained departure as unknown, not as a drop", () => {
    const report = renderCensus({
      ticks: 200,
      seed: 42,
      deadTags: [],
      liveTags: 107,
      sites: censusSites([], [{ site: "undertaking_catalyst", ranQuery: true, consumption: "spawned" }]),
      seeds: { observed: 3, spawned: 1, familyReady: 0, expired: 0, orphaned: 0, pending: 1, leftUnexplained: 1, unregisteredConsumptions: 0 },
      ring: { harvested: 4000, evictedUnseen: 120 },
    });

    expect(report).toContain("| `undertaking_catalyst` | 1 | 0 | state (ring saw 0 / 0) | live |");
    expect(report).toContain("| `step_reward_pool` | 0 | 0 | ring | ⚠️ no hits |");
    expect(report).toContain("120 more were emitted and evicted");
    expect(report).toContain("**unknown**, not a drop");
    expect(report).not.toMatch(/dropped/i);
  });

  it("says so plainly when nothing is dead", () => {
    const report = renderCensus({
      ticks: 10,
      seed: 1,
      deadTags: [],
      liveTags: 106,
      sites: censusSites([]),
    });

    expect(report).toContain("None — every tag in the vocabulary has at least one bearer.");
  });
});
