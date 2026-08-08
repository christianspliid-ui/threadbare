#!/usr/bin/env node

/**
 * Mints the next impediment `#` against every ref, not just this tree (THR-1028).
 *
 * Run before appending a row to `Docs/impediments.md`:
 *
 *     npm run impediment:next-id            # prints the number to use
 *     npm run impediment:next-id -- --json  # structured, for a scripted caller
 *     npm run impediment:next-id -- --no-fetch
 *
 * Why this exists rather than "read the last row and add one": the working tree
 * cannot see a row on `origin/main`'s unmerged future or on another in-flight
 * branch, so the by-eye number is free when chosen and duplicated when the merge
 * lands — a red required check on a PR that authored its row correctly, four times
 * over as impediment #460. See `scripts/impediment-id-allocation.ts` for the full
 * rationale and for the one case a ref scan still cannot cover.
 *
 * Always exits 0. This is an allocator, not a gate: a session logging friction must
 * never be blocked by the tool that helps it log friction (NFP #4). Degraded scans
 * and latent collisions are reported on stderr and in `--json`, where the caller
 * can act on them.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALLOCATION_RESIDUE,
  allocateNextImpedimentId,
} from "./impediment-id-allocation.ts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMPEDIMENTS_PATH = path.join(REPO_ROOT, "Docs", "impediments.md");

function main(): void {
  const json = process.argv.includes("--json");
  const fetch = !process.argv.includes("--no-fetch");

  const markdown = fs.existsSync(IMPEDIMENTS_PATH)
    ? fs.readFileSync(IMPEDIMENTS_PATH, "utf8")
    : "";

  const result = allocateNextImpedimentId(REPO_ROOT, markdown, { fetch });

  if (json) {
    console.log(
      JSON.stringify({
        nextId: result.nextId,
        highest: result.highest,
        highestFrom: result.highestFrom,
        sourceCount: result.sources.length,
        degraded: result.degraded,
        fetched: result.fetched,
        latentCollisions: result.latentCollisions,
        warnings: result.warnings,
        residue: ALLOCATION_RESIDUE,
      }),
    );
    return;
  }

  console.log(String(result.nextId));

  // Everything below is context for a human reader and must not pollute the one
  // line a scripted caller reads off stdout.
  console.error(
    `  highest # seen: ${result.highest} (${result.highestFrom}) across ${result.sources.length} log version(s)` +
      `${result.fetched ? "" : ", without a fetch — remote refs may be stale"}`,
  );

  for (const warning of result.warnings) console.error(`  warning: ${warning}`);

  if (result.latentCollisions.length > 0) {
    console.error(
      `\n  ${result.latentCollisions.length} id(s) in this tree are already claimed elsewhere for a different impediment.`,
    );
    console.error("  These will fail the merge gate whatever number you allocate now:\n");
    for (const collision of result.latentCollisions) {
      console.error(`    #${collision.num} — also on ${collision.ref}`);
      console.error(`      here:  ${collision.localDescription.slice(0, 120)}`);
      console.error(`      there: ${collision.otherDescription.slice(0, 120)}`);
    }
    console.error("\n  Repair: npm run check:impediment-ids -- --fix");
  }
}

main();
