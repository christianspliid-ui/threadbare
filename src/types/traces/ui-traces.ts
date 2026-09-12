/**
 * UI traces — what the player's navigation actually did (THR-1490).
 *
 * The ref router is the one place anything in the game opens anything else, which makes
 * it the one place worth tracing: a link that did nothing, a kind with no sheet, an id
 * that no longer resolves — each used to be invisible, because each of the three routers
 * it replaced failed by quietly returning `undefined`.
 *
 * **Spelling note.** The plan writes these as `ui.ref_opened` / `ui.ref_unroutable`. The
 * category union they join is ~200 members of unbroken snake_case, `TRACE_CATEGORIES`
 * seeds the DebugPanel's filter set off that union, and the vocabulary gate
 * (`types/__tests__/trace-vocabulary.test.ts`) matches emit-site literals against it — so
 * two dotted members would be the only dotted members in the inspector's category list
 * and in every grep anyone runs over it. Registered snake_case, deliberately; the plan's
 * intent (a `ui` namespace, two traces, these fields) is unchanged.
 */

import type { CardKind } from '../../data/surface-registry';
import type { ContentObjectKindId } from '../contentRef';
import type { TraceBase } from '../trace';
import type { WorldRefKind } from '../worldRef';

/**
 * The kind a traced reference carried.
 *
 * Both vocabularies, because the router opens both (THR-1491) and a trace that named only
 * world kinds would report a content open as a world one — or drop it. The two unions are
 * disjoint by construction (`contentRef.test.ts` pins it), so the spelling in a trace line
 * says unambiguously which side of the line the reference came from.
 */
export type TracedRefKind = WorldRefKind | ContentObjectKindId;

/** Which surface asked the router to open something. */
export type RefOpenAdapter = 'notification' | 'thread' | 'veil' | 'entity-link' | 'hex' | 'debug';

/** The three rungs of Law 20's ladder that the router can put on screen. */
export type RefOpenMode = 'hover' | 'card' | 'sheet';

/** Emitted by the router on every open that reached a surface. */
export interface UiRefOpenedTrace extends TraceBase {
  category: 'ui_ref_opened';
  refKind: TracedRefKind;
  refId: string;
  mode: RefOpenMode;
  cardKind: CardKind;
  viaAdapter?: RefOpenAdapter;
  /** Stack depth *after* the push. A hover never stacks, so it reports the depth it floated over. */
  stackDepth: number;
  summary: string;
}

/**
 * Emitted when an open did not reach the surface it was asked for.
 *
 * Never means "unknown kind" — both records are total by type, so a kind always resolves.
 * The two real cases are an id that no longer names anything, and a Tier-3 ask against a
 * kind whose sheet is withheld (which opens the card instead, rather than doing nothing).
 */
export interface UiRefUnroutableTrace extends TraceBase {
  category: 'ui_ref_unroutable';
  refKind: TracedRefKind;
  refId: string;
  reason: 'unknown_id' | 'sheet_null' | 'no_sheet_opener';
  summary: string;
}

export type UiTrace = UiRefOpenedTrace | UiRefUnroutableTrace;

/** The categories this module registers, for the vocabulary gate. */
export const UI_TRACE_CATEGORIES = ['ui_ref_opened', 'ui_ref_unroutable'] as const;
