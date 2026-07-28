/**
 * check:image-library — THR-777 (Nudge Model WS4).
 *
 * Guards the two invariants that make the manifest trustworthy:
 *
 *   1. **No lying rows.** Every `ENCOUNTER_IMAGE_LIBRARY.path` exists on disk
 *      under `public/`. A row is a promise that the path renders; this is what
 *      stops a rename from silently turning the resolver into a broken-image
 *      factory.
 *   2. **No orphan slots.** A plan slot and a library row may not share an id —
 *      that means a batch shipped art but left its worklist entry behind, and
 *      the next generation run would redo it.
 *
 * It also reports batch progress, so a resumed generation run can see where it
 * is without reading the diff.
 *
 * Advisory by default (exit 0 on progress reporting); exits 1 on a real
 * violation of either invariant.
 *
 * Run: `npm run check:image-library`
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENCOUNTER_IMAGE_LIBRARY,
  ENCOUNTER_IMAGE_PLAN,
  ENCOUNTER_IMAGE_CATEGORY_GENERIC,
} from '../src/data/encounter-image-library.ts';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(REPO_ROOT, 'public');

let failures = 0;

function fail(message: string): void {
  console.error(`[check:image-library] FAIL — ${message}`);
  failures += 1;
}

// ── 1. Every library path exists on disk ────────────────────────────

for (const entry of ENCOUNTER_IMAGE_LIBRARY) {
  if (!entry.path.startsWith('/')) {
    fail(`${entry.id}: path must be public-absolute (start with "/"), got "${entry.path}"`);
    continue;
  }
  const onDisk = join(PUBLIC_DIR, entry.path.slice(1));
  if (!existsSync(onDisk)) {
    fail(`${entry.id}: path "${entry.path}" does not exist at ${onDisk}`);
  }
}

// ── 2. Ids are unique, and library/plan do not overlap ──────────────

const libraryIds = new Set<string>();
for (const entry of ENCOUNTER_IMAGE_LIBRARY) {
  if (libraryIds.has(entry.id)) fail(`duplicate library id "${entry.id}"`);
  libraryIds.add(entry.id);
}

const planIds = new Set<string>();
for (const slot of ENCOUNTER_IMAGE_PLAN) {
  if (planIds.has(slot.id)) fail(`duplicate plan slot id "${slot.id}"`);
  planIds.add(slot.id);
  if (libraryIds.has(slot.id)) {
    fail(
      `"${slot.id}" is in BOTH the library and the plan — art shipped but the ` +
        `worklist entry was not deleted, so the next batch would regenerate it`,
    );
  }
}

// ── 3. Category generics must point at real library rows ────────────

for (const [kind, id] of Object.entries(ENCOUNTER_IMAGE_CATEGORY_GENERIC)) {
  if (id && !libraryIds.has(id)) {
    fail(`category generic for "${kind}" names "${id}", which is not a library row`);
  }
}

// ── 4. Genericity note is mandatory (WS1 spec § 7) ──────────────────

for (const entry of ENCOUNTER_IMAGE_LIBRARY) {
  if (entry.genericity !== null && entry.genericity.trim() === '') {
    fail(`${entry.id}: genericity must be a real note or explicitly null`);
  }
}

// ── Progress report ─────────────────────────────────────────────────

const byBatch = new Map<number, number>();
for (const slot of ENCOUNTER_IMAGE_PLAN) {
  byBatch.set(slot.batch, (byBatch.get(slot.batch) ?? 0) + 1);
}
const batches = [...byBatch.entries()].sort((a, b) => a[0] - b[0]);

console.log(
  `[check:image-library] library ${ENCOUNTER_IMAGE_LIBRARY.length} rows on disk, ` +
    `${ENCOUNTER_IMAGE_PLAN.length} slots still to generate.`,
);
for (const [batch, count] of batches) {
  console.log(`  batch ${batch}: ${count} remaining`);
}

if (failures > 0) {
  console.error(`[check:image-library] ${failures} failure(s).`);
  process.exit(1);
}
console.log('[check:image-library] OK');
