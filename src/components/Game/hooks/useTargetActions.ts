import { useMemo } from 'react';
import type { TargetContext } from '../../../types/targetContext';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { WheelSlot } from '../../../engine/wheel';
import { getTargetActionSlots } from '../../../engine/targetActions';
import { getAvatarHexPosition } from '../../../engine/visibility';
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

    // Check if the ascendant already holds a thread to this target.
    const threadEdges = gameState.graph.getOutgoingEdges(gameState.ascendantId, 'thread');
    const existingThread = threadEdges.find(e => e.target === target.nodeId);
    const existingThreadTier = existingThread
      ? ((existingThread.properties.tier as number) ?? 1)
      : null;

    return getTargetActionSlots({
      target,
      templates: UNIFIED_ACTION_TEMPLATES,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
      avatarPos: getAvatarHexPosition(gameState.graph, gameState.ascendantId) ?? undefined,
      accessibleSpheres: [
        archetype.sphereAlignment.primary,
        archetype.sphereAlignment.secondary,
      ],
      hexRevelation: gameState.hexRevelation,
      existingThreadTier,
    });
  }, [target, drawerOpen, gameState.essencePool, archetype, gameState.hexRevelation, gameState.graph, gameState.ascendantId]);
}
