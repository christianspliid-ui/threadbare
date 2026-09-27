/**
 * `drawFromTable` — the Encounter Factory's seeded weighted draw. THR-1145.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § The
 * Consequence Draw.
 *
 * **Moved to `src/lib/drawTable.ts` by THR-1570** — the item generator is its first
 * runtime reader, and `content-eval/`'s convention is that nothing under
 * `src/engine/**` imports it. This module re-exports the lifted helper so the four
 * authoring-time importers (the consequence draw, the plot hooks, the seed and packet
 * dice) keep their import path and their draws, byte for byte.
 */

export { drawFromTable, DRAW_TABLE_MIN_ELIGIBLE_WEIGHT } from '../../lib/drawTable';
