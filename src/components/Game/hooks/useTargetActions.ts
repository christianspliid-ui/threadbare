import { useMemo } from 'react';
import type { TargetContext } from '../../../types/targetContext';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { WheelSlot } from '../../../engine/wheel';
import { getTargetActionSlots } from '../../../engine/targetActions';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

interface UseTargetActionsParams {
  target: TargetContext | null;
  gameState: GameState;
  archetype: AscendantArchetype;
  drawerOpen: boolean;
}

/**
 * Hook that computes WheelSlot[] for any target context.
 *
 * Can be used by ANY detail view — agent, location, hex, attachment.
 * Returns null when there is no target or the drawer is closed.
 */
export function useTargetActions({
  target,
  gameState,
  archetype,
  drawerOpen,
}: UseTargetActionsParams): WheelSlot[] | null {
  return useMemo(() => {
    if (!target || !drawerOpen) return null;

    return getTargetActionSlots({
      target,
      templates: UNIFIED_ACTION_TEMPLATES,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
      avatarPos: undefined, // TODO: wire from avatar position
      accessibleSpheres: [
        archetype.sphereAlignment.primary,
        archetype.sphereAlignment.secondary,
      ],
    });
  }, [target, drawerOpen, gameState.essencePool, archetype]);
}
