import { useCallback } from 'react';
import type { NavigationTarget } from '../../../types/notification';

interface NotificationNavigationDeps {
  onSelectAgent: (id: string) => void;
  onFocusHex: (col: number, row: number) => void;
  // Encounter, faction, journey, location navigation — stubbed until modals exist
  onOpenEncounter?: (encounterId: string) => void;
  onOpenFaction?: (factionId: string) => void;
  onOpenJourney?: (journeyId: string, agentId: string) => void;
  onOpenLocation?: (nodeId: string) => void;
  /** Divine Receipt toast click-through → open the receipt dialogue (THR-727). */
  onOpenReceipt?: (receiptId: string) => void;
}

/**
 * Centralizes notification click → navigation dispatch.
 * Maps NavigationTarget kinds to the appropriate GameView handlers.
 */
export function useNotificationNavigation(deps: NotificationNavigationDeps) {
  return useCallback((target: NavigationTarget) => {
    switch (target.kind) {
      case 'agent':
        deps.onSelectAgent(target.agentId);
        break;
      case 'encounter':
        if (deps.onOpenEncounter) {
          deps.onOpenEncounter(target.encounterId);
        }
        break;
      case 'hex':
        deps.onFocusHex(target.col, target.row);
        break;
      case 'location':
        if (deps.onOpenLocation) {
          deps.onOpenLocation(target.locationNodeId);
        }
        break;
      case 'faction':
        if (deps.onOpenFaction) {
          deps.onOpenFaction(target.factionId);
        }
        break;
      case 'journey':
        if (deps.onOpenJourney) {
          deps.onOpenJourney(target.journeyId, target.agentId);
        }
        break;
      case 'receipt':
        if (deps.onOpenReceipt) {
          deps.onOpenReceipt(target.receiptId);
        }
        break;
    }
  }, [deps.onSelectAgent, deps.onFocusHex, deps.onOpenEncounter, deps.onOpenFaction, deps.onOpenJourney, deps.onOpenLocation, deps.onOpenReceipt]);
}
