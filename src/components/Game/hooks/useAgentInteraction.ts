import { useState, useCallback, useMemo } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { LocalEncounterMode, InterventionType } from '../../../types/dream';
import { INTERVENTION_DEFINITIONS } from '../../../types/dream';
import { getRetinueAgents } from '../../../engine/retinue';
import { getAgentDetail } from '../../../engine/agentDetail';
import { getAgentWheelSlots } from '../../../engine/wheel';
import { executeIntervention } from '../../../engine/dream';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../../../engine/strands';

interface UseAgentInteractionParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  archetype: AscendantArchetype;
  onOpenScry: () => void;
}

export function useAgentInteraction({
  gameState,
  setGameState,
  archetype,
  onOpenScry,
}: UseAgentInteractionParams) {
  // ── State ──
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelFeedback, setWheelFeedback] = useState<string | null>(null);
  const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
  const [pendingIntervention, setPendingIntervention] = useState<{
    slotId: string;
    interventionType: InterventionType;
  } | null>(null);

  // ── Computed values ──
  const retinueAgents = useMemo(
    () => getRetinueAgents(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId]
  );

  const agentDetail = useMemo(() => {
    if (!selectedAgentId) return null;
    return getAgentDetail(gameState.graph, selectedAgentId, gameState.ascendantId);
  }, [selectedAgentId, gameState.graph, gameState.ascendantId]);

  const wheelSlots = useMemo(() => {
    if (!selectedAgentId || !wheelVisible) return null;
    const agent = retinueAgents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return getAgentWheelSlots({
      tier: agent.tier,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
    });
  }, [selectedAgentId, wheelVisible, gameState.essencePool, retinueAgents, archetype]);

  const strandData = useMemo(() => {
    if (!strandViewAgent) return null;
    const agentName = gameState.graph.getNode(strandViewAgent)?.name ?? 'Unknown';
    return {
      agentName,
      strands: {
        presence: getPresenceStrand(gameState.graph, strandViewAgent),
        desires: getDesiresStrand(gameState.graph, strandViewAgent),
        bonds: getBondsStrand(gameState.graph, strandViewAgent),
        ambitions: getAmbitionsStrand(gameState.graph, strandViewAgent),
        beliefs: getBeliefsStrand(gameState.graph, strandViewAgent),
        fears: getFearsStrand(gameState.graph, strandViewAgent),
      },
    };
  }, [strandViewAgent, gameState.graph]);

  // ── Handlers ──
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setWheelVisible(true);
    setStrandViewAgent(null);
  }, []);

  const handleWheelSlotClick = useCallback(
    (slotId: string) => {
      if (slotId === 'scry') {
        onOpenScry();
        return;
      }

      const slot = wheelSlots?.find(s => s.id === slotId);
      if (!slot?.interventionType || !slot.available) return;

      if (slot.interventionType === 'dream') {
        return;
      }

      setPendingIntervention({
        slotId,
        interventionType: slot.interventionType,
      });
    },
    [selectedAgentId, wheelSlots, onOpenScry]
  );

  const handleInterventionConfirm = useCallback(
    (encounterMode?: LocalEncounterMode) => {
      if (!pendingIntervention || !selectedAgentId) return;

      const def = INTERVENTION_DEFINITIONS[pendingIntervention.interventionType];
      const slot = wheelSlots?.find(s => s.id === pendingIntervention.slotId);
      if (!slot?.sphere) return;

      const result = executeIntervention({
        interventionType: pendingIntervention.interventionType,
        sphere: slot.sphere,
        baseCost: slot.essenceCost,
        alignmentFactor: 1.0,
        actorType: 'individual',
        pool: gameState.essencePool,
      });

      if (result.success) {
        setGameState(prev => {
          const newPool = { ...prev.essencePool };
          newPool[slot.sphere!] = Math.max(
            0,
            newPool[slot.sphere!] - result.essenceSpent[slot.sphere!]
          );
          return {
            ...prev,
            essencePool: newPool,
            recentEvents: [
              ...prev.recentEvents.slice(-99),
              {
                id: `evt_intervention_${prev.tick}_${Date.now()}`,
                tick: prev.tick,
                type: 'narrative' as const,
                message: `${def.description} (${result.detected ? 'detected!' : 'undetected'})`,
                significance: result.detected ? 0.8 : 0.5,
                sphere: slot.sphere!,
              },
            ],
          };
        });
      }

      setPendingIntervention(null);
      setWheelVisible(false);
    },
    [pendingIntervention, selectedAgentId, wheelSlots, gameState.essencePool, setGameState]
  );

  const handleInterventionCancel = useCallback(() => {
    setPendingIntervention(null);
  }, []);

  const handleWheelDismiss = useCallback(() => {
    setWheelVisible(false);
  }, []);

  const handleStrandClose = useCallback(() => {
    setStrandViewAgent(null);
    setWheelVisible(true);
  }, []);

  const handleBackFromAgentDetail = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const handleViewPsyche = useCallback(() => {
    setStrandViewAgent(selectedAgentId);
  }, [selectedAgentId]);

  const handleOpenWheel = useCallback(() => {
    setWheelVisible(true);
  }, []);

  const handleAvatarWheelClick = useCallback(() => {
    if (retinueAgents.length === 0) {
      setWheelFeedback(
        'You have no agents under your influence yet. Use interventions to recruit agents.'
      );
      setTimeout(() => setWheelFeedback(null), 4000);
      return;
    }

    if (selectedAgentId) {
      setWheelVisible(true);
    } else {
      handleAgentSelect(retinueAgents[0].id);
    }
  }, [selectedAgentId, retinueAgents, handleAgentSelect]);

  return {
    selectedAgentId,
    wheelVisible,
    wheelFeedback,
    strandViewAgent,
    pendingIntervention,
    retinueAgents,
    agentDetail,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleWheelDismiss,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenWheel,
    handleAvatarWheelClick,
  };
}
