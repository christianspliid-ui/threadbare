/**
 * Shared view-model primitives (THR-1822 § D1, § D2).
 *
 * A view model is plain and serialisable: strings, finite numbers, booleans,
 * null, arrays and plain objects — never a Map, Set, class, function or graph
 * object. Named things travel as a `WorldRef` with their display name, so a
 * surface can give them an image, a tooltip and a link without parsing English.
 *
 * The later families' types (subject pages, Connections, *In this land*, Find,
 * lenses, the Stage, Needs you) join this file with the slice that builds their
 * surface (plan § D16).
 */
import type { WorldRef } from '../../types/worldRef';

/** One named thing a surface lists. */
export interface RefRow {
  ref: WorldRef;
  name: string;
}
