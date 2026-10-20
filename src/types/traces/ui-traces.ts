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
export type RefOpenAdapter =
  | 'notification'
  | 'thread'
  | 'veil'
  | 'entity-link'
  | 'hex'
  | 'debug'
  // THR-1851 — a link inside a detail card, and that card's full-sheet button.
  | 'detail-link'
  | 'detail-cta'
  // THR-1851 — an introduction beat's "Attend", which opens the people it names.
  | 'beat'
  // THR-1885 — an identity chip (`Chip role="identity"`).
  | 'chip'
  // THR-1892 — the Stage's lit-hex button.
  | 'stage'
  // THR-1915 — a Find result.
  | 'find';

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

/**
 * Emitted when a view-model selector cannot build its view model and hands the
 * surface its typed fallback instead (THR-1822, `src/engine/views/readView.ts`).
 * Once per (selector, reason, key) per session, so a render loop cannot flood
 * the buffer.
 */
export interface ViewFallbackTrace extends TraceBase {
  category: 'view_fallback';
  /** The selector's registry id: `map.agents`, `hexContents`, `lens`, … */
  selector: string;
  /** The selector's cache key for these args. */
  key: string;
  reason: 'missing_node' | 'kind_mismatch' | 'no_hex' | 'resolver_threw';
  /** The error message, for `resolver_threw`. */
  detail?: string;
  summary: string;
}

/**
 * Emitted when a homed surface takes, leaves or waits for the foreground, or falls back
 * (THR-1877, `src/data/homed-surfaces.ts`). Only on transitions, never per render.
 * S1 emits `held` and `fallback`; the Stage build (THR-1892) adds the rest.
 */
export interface StageTrace extends TraceBase {
  category: 'ui_stage';
  action: 'opened' | 'held' | 'closed' | 'minimised' | 'fallback';
  /** The homed surface's kind (`HomedSurfaceKind`), never the ascendant `BeatKind`. */
  kind: string;
  /** For `held`: the kind it waits behind; null when nothing renders. */
  behind?: string | null;
  litSource?: 'beat' | 'agent_location' | 'ruin_location' | null;
  /** "13,9" */
  litHex?: string | null;
  camera?: 'eased' | 'cut' | 'stayed' | 'timed_out';
  layout?: 'full' | 'compact';
  summary: string;
}

/** Why the map camera made a programmatic move (THR-1900). */
export type MapCameraJumpReason =
  | 'opening'
  | 'centre_first'
  | 'centre_seat'
  | 'known_land'
  | 'zoom_step'
  | 'minimap'
  | 'focus';

/**
 * Emitted on every programmatic map camera move — a control button, a map key, the opening
 * view, or a "show me" jump (THR-1900, plan THR-1878 § Tracing). Wheel zoom and drag pan are
 * not traced (noise). Arrow-key pans are not either: they are a drag by keyboard.
 */
export interface UiMapCameraJumpTrace extends TraceBase {
  category: 'ui_map_camera_jump';
  reason: MapCameraJumpReason;
  /** The zoom it lands at (debug only; never shown to the player). */
  k: number;
  /** "col,row", or null for a zoom step. */
  target: string | null;
  summary: string;
}

/** What turned a map lens on, off or over (THR-1878). */
export type MapLensChangeSource = 'key' | 'bar' | 'debug' | 'unknown_id';

/**
 * Emitted when a map lens turns on, off, or switches (THR-1878, plan § Tracing).
 * `to: null` with source `unknown_id` is an id that reached the host with no
 * `MAP_LENSES` row: nothing is drawn (Law 58's plain fallback).
 */
export interface UiMapLensChangedTrace extends TraceBase {
  category: 'ui_map_lens_changed';
  from: string | null;
  to: string | null;
  source: MapLensChangeSource;
  summary: string;
}

/** What happened to an armed card (THR-1914, Inspector plan § Tracing). */
export type UiCardArmEvent = 'armed' | 'staged' | 'cast' | 'refused' | 'disarmed';

/** Where the card was armed or its target chosen from. */
export type UiCardArmOrigin = 'hand' | 'act_row' | 'tray' | 'find' | 'drag' | 'map' | 'inspector';

/**
 * Emitted when a card is armed from the hand, given a target, cast, refused or disarmed
 * (THR-1914). `reason` is the locked reason, `not_a_target` or `card_left_hand`.
 */
export interface UiCardArmTrace extends TraceBase {
  category: 'ui_card_arm';
  actionId: string;
  event: UiCardArmEvent;
  origin: UiCardArmOrigin;
  targetKind?: string;
  targetId?: string;
  reason?: string;
  summary: string;
}

export type UiTrace = UiRefOpenedTrace | UiRefUnroutableTrace | ViewFallbackTrace | StageTrace | UiMapCameraJumpTrace | UiMapLensChangedTrace | UiCardArmTrace;

/** The categories this module registers, for the vocabulary gate. */
export const UI_TRACE_CATEGORIES = ['ui_ref_opened', 'ui_ref_unroutable', 'view_fallback', 'ui_stage', 'ui_map_camera_jump', 'ui_map_lens_changed', 'ui_card_arm'] as const;
