/**
 * Notification click-through → the one ref router (THR-1490).
 *
 * This file used to *be* one of the three routers: a switch over `NavigationTarget`'s
 * eight arms calling eight `GameView` handlers. It is now two halves of one seam:
 *
 * - {@link useSheetOpeners} is the router's Tier-3 internals — the same switch, total
 *   over the union, now returning whether the host actually had an opener wired so the
 *   router can fall back to the card instead of swallowing the click (Law 25).
 * - {@link useNotificationNavigation} is the adapter — it maps a `NavigationTarget` to a
 *   `WorldRef` and asks the router for the sheet. Its signature is unchanged
 *   (`(target: NavigationTarget) => void`), so every notification call site is untouched.
 *
 * The split exists because a sheet opener that returned `void` could not tell a router
 * "I did nothing", and a router that cannot tell is a router that produces dead clicks.
 */

import { useCallback } from 'react';
import type { NavigationTarget } from '../../../types/notification';
import { fromNavigationTarget } from '../../../types/worldRefAdapters';
import type { RefRouter } from '../../../hooks/useRefRouter';

interface NotificationNavigationDeps {
  onSelectAgent: (id: string) => void;
  onFocusHex: (col: number, row: number) => void;
  onOpenEncounter?: (encounterId: string) => void;
  onOpenFaction?: (factionId: string) => void;
  onOpenJourney?: (journeyId: string, agentId: string) => void;
  onOpenLocation?: (nodeId: string) => void;
  /** An Area reference (THR-1155) — focus its centre hex, where the chronicle names it. */
  onFocusArea?: (areaId: string) => void;
  /** Divine Receipt toast click-through → open the receipt dialogue (THR-727). */
  onOpenReceipt?: (receiptId: string) => void;
  /** THR-1490 — three sheets that shipped without an address. */
  onOpenArtifact?: (artifactId: string) => void;
  onOpenAttachment?: (templateNodeId: string) => void;
  onOpenArmy?: (armyId: string) => void;
}

/** Opens a Tier-3 sheet. `false` = this host has no opener for that arm. */
export type SheetOpener = (target: NavigationTarget) => boolean;

/**
 * The Tier-3 dispatch, total over `NavigationTarget`.
 *
 * Every arm is a `Boolean(...)` of its handler call rather than an `if (handler)` block,
 * so an arm whose opener is absent reports it instead of returning silently. The union's
 * exhaustiveness is the coverage guarantee — a new arm without a case here fails to
 * compile, which is what `useNotificationNavigation.coverage.test.ts` pins at runtime for
 * the arms a type cannot check (an opener wired to the wrong kind).
 */
export function useSheetOpeners(deps: NotificationNavigationDeps): SheetOpener {
  return useCallback(
    (target: NavigationTarget): boolean => {
      switch (target.kind) {
        case 'agent':
          deps.onSelectAgent(target.agentId);
          return true;
        case 'hex':
          deps.onFocusHex(target.col, target.row);
          return true;
        case 'encounter':
          if (!deps.onOpenEncounter) return false;
          deps.onOpenEncounter(target.encounterId);
          return true;
        case 'location':
          if (!deps.onOpenLocation) return false;
          deps.onOpenLocation(target.locationNodeId);
          return true;
        case 'area':
          if (!deps.onFocusArea) return false;
          deps.onFocusArea(target.areaId);
          return true;
        case 'faction':
          if (!deps.onOpenFaction) return false;
          deps.onOpenFaction(target.factionId);
          return true;
        case 'journey':
          if (!deps.onOpenJourney) return false;
          deps.onOpenJourney(target.journeyId, target.agentId);
          return true;
        case 'receipt':
          if (!deps.onOpenReceipt) return false;
          deps.onOpenReceipt(target.receiptId);
          return true;
        case 'artifact':
          if (!deps.onOpenArtifact) return false;
          deps.onOpenArtifact(target.artifactId);
          return true;
        case 'attachment':
          if (!deps.onOpenAttachment) return false;
          deps.onOpenAttachment(target.templateNodeId);
          return true;
        case 'army':
          if (!deps.onOpenArmy) return false;
          deps.onOpenArmy(target.armyId);
          return true;
      }
    },
    [
      deps.onSelectAgent, deps.onFocusHex, deps.onOpenEncounter, deps.onOpenFaction,
      deps.onOpenJourney, deps.onOpenLocation, deps.onFocusArea, deps.onOpenReceipt,
      deps.onOpenArtifact, deps.onOpenAttachment, deps.onOpenArmy,
    ],
  );
}

/**
 * The notification adapter: a click on a toast, alert or thread badge opens that thing's
 * sheet through the router.
 *
 * `journey` is the one arm carrying routing context the reference itself does not hold —
 * the traveller — so it is threaded back through the router's options rather than lost in
 * the round trip.
 */
export function useNotificationNavigation(router: RefRouter) {
  return useCallback(
    (target: NavigationTarget) => {
      const ref = fromNavigationTarget(target);
      const agentId = target.kind === 'journey' ? target.agentId : undefined;
      router.open(ref, 'sheet', { via: 'notification', agentId });
    },
    [router],
  );
}
