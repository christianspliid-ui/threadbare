/**
 * The ref router — the one way anything in the game opens anything else (THR-1490).
 *
 * Plan: `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`.
 *
 * Before this, three routers opened things in production — `useNotificationNavigation`
 * (8 `NavigationTarget` arms), `handleThreadNodeSelect` (5 `ThreadCategory` kinds),
 * `EncounterVeil.openEntity` (7 `visualKind`s) — and none of them dispatched on
 * `WorldRefKind`, the vocabulary THR-1212 made canonical. Each hand-curated a partial
 * answer to the same question, which is why an artifact chip and an army chip rendered as
 * plain text on a surface where a faction chip was a link.
 *
 * This hook is the whole dispatch:
 *
 *     row = (content ? SURFACE_BY_CONTENT_KIND : SURFACE_BY_WORLD_REF)[ref.kind]
 *     card / hover → generateDetailPage | generateContentPage → push
 *     sheet        → openSheet(toNavigationTarget(ref)) | openCodexEntry(id)
 *
 * **Two vocabularies, one dispatch (THR-1491).** A `WorldRef` names something the engine
 * minted; a `ContentRef` names something a person wrote. They route to different tiers of
 * the same ladder — a world object to its sheet, a content object to the codex overlay —
 * and never to each other's, which is THR-1315's ruling kept rather than worked around.
 * Both records are total by type, and the two kind unions are disjoint, so `isContentRef`
 * is a decision and not a guess.
 *
 * **Three fail-soft paths, and none of them is a dead click** (NFP #4, Law 21/25):
 * an id that resolves to nothing gets the generator's `unknownStub` page; a `sheet` ask
 * against a `sheet: null` kind opens the *card* rather than doing nothing; a host with no
 * opener wired for that arm likewise falls back to the card. Each traces what happened.
 *
 * **Why a hook and not only a context.** `GameView` needs `open` inside its own handlers,
 * and a component cannot consume a context it renders. So `GameView` builds the router
 * here, uses it directly, and publishes it to its descendants through
 * `RefRouterContext`. That is also why the detail stack's state is owned here rather than
 * by `DetailModalStackProvider` — see `useDetailModalStackState`.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  SURFACE_BY_CONTENT_KIND,
  SURFACE_BY_WORLD_REF,
  type SurfaceRow,
} from '../data/surface-registry';
import { HOVER_CARD_DELAY_MS } from '../types/detailPage';
import type { DetailPage, GraphPageKind } from '../types/detailPage';
import type { NavigationTarget } from '../types/notification';
import type { AnyRef, ContentRef } from '../types/contentRef';
import { isContentRef } from '../types/contentRef';
import type { WorldRef } from '../types/worldRef';
import { toNavigationTarget } from '../types/worldRefAdapters';
import type { RefOpenAdapter, RefOpenMode } from '../types/traces/ui-traces';
import {
  useDetailModalStackState,
  type DetailModalStackState,
} from '../contexts/DetailModalStackContext';
import { generateDetailPage } from '../engine/detailPageGenerator';
import { generateContentPage } from '../engine/contentPageGenerator';
import { emitTrace } from '../engine/traceBuffer';
import type { WorldGraph } from '../engine/graph';
import type { SimulationRuntime } from '../engine/simulationRuntime';

export type { RefOpenMode };

/** A hover card floating beside the thing that summoned it. */
export interface HoverCardState {
  readonly page: DetailPage;
  readonly anchorEl: HTMLElement;
  readonly ref: AnyRef;
}

export interface RefRouterConfig {
  readonly graph: WorldGraph;
  readonly tick: number;
  readonly seed: number;
  readonly runtime?: SimulationRuntime | null;
  /** Drives the card's "to her" / "toward him" framings. */
  readonly protagonistId?: string;
  /**
   * Opens a Tier-3 sheet. Total over `NavigationTarget`; returns false when this host has
   * no opener wired for that arm, which the router turns into a card rather than a
   * swallowed click.
   */
  readonly openSheet: (target: NavigationTarget) => boolean;
  /**
   * Opens the codex overlay straight to one entry — the Tier-3 sheet for content kinds
   * (THR-1491).
   *
   * Separate from `openSheet` because `'codex'` is deliberately **not** a
   * `NavigationTarget` arm: THR-1315 removed `codex` from `WorldRefKind` so that a *world*
   * reference could never route to a reference page, and giving the navigation vocabulary
   * a codex arm would put it back by the side door. Content routes there; world objects
   * cannot reach it.
   *
   * Returns false when the overlay cannot show that id — the router then opens the card,
   * as it does for every other unreachable sheet. Absent entirely (style guide, tests) is
   * the same case.
   */
  readonly openCodexEntry?: (entryId: string) => boolean;
  /**
   * Whether the codex holds an entry for this id.
   *
   * Asked *before* opening so the card's footer CTA is honest: the registry row says the
   * kind reaches the codex, this says the entry does, and four of the six covered kinds
   * are covered only partially. Absent means "assume not", which loses a CTA rather than
   * drawing a dead one.
   */
  readonly codexHasEntry?: (entryId: string) => boolean;
}

export interface OpenRefOptions {
  /** Which surface asked. Trace-only — the router never behaves differently by caller. */
  readonly via?: RefOpenAdapter;
  /** Required for `hover`; the element the card anchors beside. */
  readonly anchorEl?: HTMLElement | null;
  /** A `journey` needs its traveller — `NavigationTarget` carries one and `WorldRef` does not. */
  readonly agentId?: string;
}

export interface RefRouter {
  /** Open a reference at a tier. Default `'card'`. */
  open(ref: AnyRef, mode?: RefOpenMode, options?: OpenRefOptions): void;
  /**
   * Whether this ref reaches that tier *as asked*.
   *
   * False never means "nothing happens" — `open` still shows the card. It is what a
   * caller asks before drawing a Tier-3 affordance (Law 25: a control that does nothing
   * does not render), not a permission check on `open`.
   */
  canOpen(ref: AnyRef, mode: RefOpenMode): boolean;
  /** The surface row for a kind — what the card and the CTA are drawn from. */
  rowFor(ref: AnyRef): SurfaceRow;
  /** The detail stack this router pushes onto. `GameView` publishes it unchanged. */
  readonly stack: DetailModalStackState;
  /** The open hover card, or null. */
  readonly hoverCard: HoverCardState | null;
  /** Dismiss the hover card (pointer leave, Escape, or a real card opening over it). */
  closeHover(): void;
  /** Arm the dwell timer; fires `open(ref, 'hover')` after {@link HOVER_CARD_DELAY_MS}. */
  armHover(ref: AnyRef, anchorEl: HTMLElement): void;
  /** Cancel an armed dwell that never became a hover. */
  disarmHover(): void;
}

export function useRefRouter(config: RefRouterConfig): RefRouter {
  const stack = useDetailModalStackState();
  const [hoverCard, setHoverCard] = useState<HoverCardState | null>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read config through a ref so `open` keeps a stable identity across ticks. Without
  // this every tick would rebuild every handler threaded through GameView's tree, which
  // on a 5,400-line component is a whole-subtree re-render per tick (NFP #7).
  const configRef = useRef(config);
  configRef.current = config;

  /**
   * The card for a content reference — resolved from catalogs, not from the graph.
   *
   * Never null: an id in no catalog gets the *unwritten* stub, which is a true page. The
   * world arm can still return null (a graph node genuinely may not exist and the caller
   * needs to know), so the two are not symmetrical on purpose.
   */
  const buildContentPage = useCallback((ref: ContentRef): DetailPage => {
    const cfg = configRef.current;
    return generateContentPage({
      ref,
      breadcrumbRoot: ['THE LIBRARY'],
      codexHasEntry: cfg.codexHasEntry?.(ref.id) ?? false,
    });
  }, []);

  const buildPage = useCallback((ref: WorldRef, cardKind: GraphPageKind): DetailPage | null => {
    const cfg = configRef.current;
    try {
      return generateDetailPage({
        nodeId: ref.id,
        pageKind: cardKind,
        graph: cfg.graph,
        tick: cfg.tick,
        seed: cfg.seed,
        protagonistId: cfg.protagonistId,
        runtime: cfg.runtime,
        breadcrumbRoot: ['THE WORLD'],
      });
    } catch {
      // A malformed node must never unmount the app (NFP #4). The generator already
      // stubs a missing node; this catches a throw from deeper in a resolver.
      return null;
    }
  }, []);

  const closeHover = useCallback(() => {
    if (dwellTimer.current) {
      clearTimeout(dwellTimer.current);
      dwellTimer.current = null;
    }
    setHoverCard(null);
  }, []);

  const open = useCallback(
    (ref: AnyRef, mode: RefOpenMode = 'card', options: OpenRefOptions = {}) => {
      const cfg = configRef.current;
      // Narrowed inline at every use rather than hoisted into a `content` variable: a
      // predicate's narrowing follows `ref` itself, and a boolean derived from it does not
      // carry the type through — which is why `toNavigationTarget` below sees a `WorldRef`.
      const row = isContentRef(ref)
        ? SURFACE_BY_CONTENT_KIND[ref.kind]
        : SURFACE_BY_WORLD_REF[ref.kind];

      const traceOpened = (actualMode: RefOpenMode, depth: number) => {
        emitTrace({
          tick: cfg.tick,
          category: 'ui_ref_opened',
          refKind: ref.kind,
          refId: ref.id,
          mode: actualMode,
          cardKind: row.card,
          viaAdapter: options.via,
          stackDepth: depth,
          summary: `ui_ref_opened: ${ref.kind} ${ref.id} as ${actualMode}`,
        });
      };
      const traceUnroutable = (reason: 'unknown_id' | 'sheet_null' | 'no_sheet_opener') => {
        emitTrace({
          tick: cfg.tick,
          category: 'ui_ref_unroutable',
          refKind: ref.kind,
          refId: ref.id,
          reason,
          summary: `ui_ref_unroutable: ${ref.kind} ${ref.id} — ${reason}`,
        });
      };

      if (mode === 'sheet') {
        if (row.sheet === null) {
          traceUnroutable('sheet_null');
        } else if (isContentRef(ref)) {
          // The codex overlay is the content sheet (THR-1491). It is reached by entry id
          // rather than through `NavigationTarget`, because `codex` is deliberately not an
          // arm of that vocabulary — see `openCodexEntry` on the config.
          if (cfg.openCodexEntry?.(ref.id)) {
            closeHover();
            traceOpened('sheet', stack.stack.length);
            return;
          }
          traceUnroutable('no_sheet_opener');
        } else {
          const target = toNavigationTarget(ref, { agentId: options.agentId });
          if (target && cfg.openSheet(target)) {
            // A sheet replaces the card rather than sitting under it — the sheets mount at
            // their own z-band and a stale card beneath one is a second answer to the same
            // question.
            closeHover();
            traceOpened('sheet', stack.stack.length);
            return;
          }
          if (target) traceUnroutable('no_sheet_opener');
        }
        // Fall through to the card. Never a no-op click (Law 25).
        mode = 'card';
      }

      // `row.card` is `'content'` exactly when the ref is a `ContentRef` — both records
      // say so by construction — so this fork is total without a default branch.
      const page = isContentRef(ref)
        ? buildContentPage(ref)
        : buildPage(ref, row.card as GraphPageKind);
      if (!page) {
        traceUnroutable('unknown_id');
        return;
      }

      if (mode === 'hover') {
        const anchorEl = options.anchorEl;
        // A hover card never stacks on a modal — two floating answers to one question.
        if (!anchorEl || stack.isOpen) return;
        setHoverCard({ page, anchorEl, ref });
        traceOpened('hover', stack.stack.length);
        return;
      }

      closeHover();
      stack.push(page);
      traceOpened('card', stack.stack.length + 1);
    },
    [buildPage, buildContentPage, closeHover, stack],
  );

  const armHover = useCallback(
    (ref: AnyRef, anchorEl: HTMLElement) => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      dwellTimer.current = setTimeout(() => {
        dwellTimer.current = null;
        open(ref, 'hover', { anchorEl, via: 'entity-link' });
      }, HOVER_CARD_DELAY_MS);
    },
    [open],
  );

  const disarmHover = useCallback(() => {
    if (dwellTimer.current) {
      clearTimeout(dwellTimer.current);
      dwellTimer.current = null;
    }
  }, []);

  const canOpen = useCallback((ref: AnyRef, mode: RefOpenMode): boolean => {
    if (isContentRef(ref)) {
      const row = SURFACE_BY_CONTENT_KIND[ref.kind];
      // Two conditions, not one: the row says the *kind* reaches the codex, and this asks
      // whether the *entry* does. Four of the six covered kinds are covered only
      // partially, so the row alone would answer true for 56 undertaking templates the
      // codex has never heard of (Law 25).
      if (mode === 'sheet') {
        return row.sheet === 'codex' && (configRef.current.codexHasEntry?.(ref.id) ?? false);
      }
      return true;
    }
    const row = SURFACE_BY_WORLD_REF[ref.kind];
    if (mode === 'sheet') return row.sheet !== null;
    // Card and hover are always available: every row has a card, and an unresolvable id
    // still gets the stub, which says the thing is gone instead of saying nothing.
    return true;
  }, []);

  const rowFor = useCallback(
    (ref: AnyRef): SurfaceRow =>
      isContentRef(ref) ? SURFACE_BY_CONTENT_KIND[ref.kind] : SURFACE_BY_WORLD_REF[ref.kind],
    [],
  );

  return useMemo(
    () => ({ open, canOpen, rowFor, stack, hoverCard, closeHover, armHover, disarmHover }),
    [open, canOpen, rowFor, stack, hoverCard, closeHover, armHover, disarmHover],
  );
}
