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
