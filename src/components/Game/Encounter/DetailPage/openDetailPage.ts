/**
 * Detail page openers — typed wrappers around `generateDetailPage` + `openDetail`.
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §8
 *
 * Five typed instances per the THR-338 spec — Actor, Item, Faction, Place, Event.
 * Each is a thin convenience over the engine's `generateDetailPage()` plus the
 * `useDetailStack().push(page)` from the modal stack context.
 *
 * Components that already have `gameState` in scope (e.g., CastTile, ProseKeyword,
 * faction chips, place captions) call `useOpenDetailPage(gameState)` and use
 * `openActor(actorId)` etc. as click handlers.
 */

import { useCallback } from 'react';
import { useDetailStack } from '../../../../contexts/DetailModalStackContext';
import {
  generateDetailPage,
  type GenerateDetailPageInput,
} from '../../../../engine/detailPageGenerator';
import type { DetailPage, DetailPageKind, NodeRef } from '../../../../types/detailPage';
import type { GameState } from '../../../../types/gameState';

interface OpenInputs {
  /** Optional encounter context override (drives "tilts this scene" / callbacks). */
  encounterContext?: GenerateDetailPageInput['encounterContext'];
  /** Optional protagonist override. Default = `gameState.ascendantId`. */
  protagonistId?: string;
  /** Optional breadcrumb root override. Default = `['ENCOUNTER']`. */
  breadcrumbRoot?: string[];
}

interface OpenDetailHooks {
  /** Open an Actor detail page. */
  openActor: (nodeId: string, opts?: OpenInputs) => void;
  /** Open an Item detail page (artifact / artifact_legendary). */
  openItem: (nodeId: string, opts?: OpenInputs) => void;
  /** Open a Faction detail page. */
  openFaction: (nodeId: string, opts?: OpenInputs) => void;
  /** Open a Place detail page (location / region). */
  openPlace: (nodeId: string, opts?: OpenInputs) => void;
  /** Open an Event detail page. */
  openEvent: (nodeId: string, opts?: OpenInputs) => void;
  /** Open by NodeRef — picks the right kind from the ref. */
  openRef: (ref: NodeRef, opts?: OpenInputs) => void;
}

/**
 * Hook returning typed open-functions for each of the 5 detail page kinds.
 *
 * Pulls graph / tick / seed / protagonistId from the supplied `GameState`.
 * Pushes the resolved `DetailPage` onto the active modal stack.
 */
export function useOpenDetailPage(gameState: GameState): OpenDetailHooks {
  const { push } = useDetailStack();

  const openByKind = useCallback(
    (pageKind: DetailPageKind, nodeId: string, opts?: OpenInputs) => {
      const page: DetailPage = generateDetailPage({
        nodeId,
        pageKind,
        graph: gameState.graph,
        tick: gameState.tick,
        seed: gameState.seed,
        protagonistId: opts?.protagonistId ?? gameState.ascendantId,
        encounterContext: opts?.encounterContext,
        breadcrumbRoot: opts?.breadcrumbRoot,
      });
      push(page);
    },
    [gameState.graph, gameState.tick, gameState.seed, gameState.ascendantId, push],
  );

  return {
    openActor: (nodeId, opts) => openByKind('actor', nodeId, opts),
    openItem: (nodeId, opts) => openByKind('item', nodeId, opts),
    openFaction: (nodeId, opts) => openByKind('faction', nodeId, opts),
    openPlace: (nodeId, opts) => openByKind('place', nodeId, opts),
    openEvent: (nodeId, opts) => openByKind('event', nodeId, opts),
    openRef: (ref, opts) => openByKind(ref.pageKind, ref.nodeId, opts),
  };
}

/**
 * Pure helper for tests / debug bridge — builds a `DetailPage` without React.
 * Re-exports `generateDetailPage` under a more discoverable name.
 */
export const buildDetailPage = generateDetailPage;
