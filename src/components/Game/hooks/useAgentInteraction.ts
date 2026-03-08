import { useState, useCallback, useMemo } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { LocalEncounterMode, InterventionType } from '../../../types/dream';
import { INTERVENTION_DEFINITIONS } from '../../../types/dream';
import { getRetinueAgents } from '../../../engine/retinue';
import { getAgentDetail, getAgentInfoCard, getAgentFullProfile } from '../../../engine/agentDetail';
import { getAgentWheelSlots } from '../../../engine/wheel';
import { executeIntervention } from '../../../engine/dream';
import { applyInterventionEffects } from '../../../engine/interventionEffects';
import { getFamiliarity, getKnowledgeLevel } from '../../../engine/familiarity';
import { DIVINE_INFLUENCE_CONSTANTS } from '../../../data/intervention-feedback-content';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
  const [profileModalAgentId, setProfileModalAgentId] = useState<string | null>(null);
  const [pendingIntervention, setPendingIntervention] = useState<{
    slotId: string;
    interventionType: InterventionType;
  } | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

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
    if (!selectedAgentId || !drawerOpen) return null;
    const agent = retinueAgents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return getAgentWheelSlots({
      tier: agent.tier,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
    });
  }, [selectedAgentId, drawerOpen, gameState.essencePool, retinueAgents, archetype]);

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

  const agentInfoCard = useMemo(() => {
    if (!selectedAgentId) return null;
    const familiarity = getFamiliarity(gameState.familiarityMap, selectedAgentId);
    const knowledgeLevel = getKnowledgeLevel(familiarity);
    return getAgentInfoCard(gameState.graph, selectedAgentId, gameState.ascendantId, knowledgeLevel);
  }, [selectedAgentId, gameState.graph, gameState.ascendantId, gameState.familiarityMap]);

  const agentFullProfile = useMemo(() => {
    if (!profileModalAgentId) return undefined;
    const familiarity = getFamiliarity(gameState.familiarityMap, profileModalAgentId);
    const knowledgeLevel = getKnowledgeLevel(familiarity);
    return getAgentFullProfile(gameState.graph, profileModalAgentId, gameState.ascendantId, knowledgeLevel);
  }, [profileModalAgentId, gameState.graph, gameState.ascendantId, gameState.familiarityMap]);

  // ── Handlers ──
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setDrawerOpen(true);
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
        // Apply real world effects
        const effectsResult = applyInterventionEffects({
          graph: gameState.graph,
          interventionType: pendingIntervention.interventionType,
          targetAgentId: selectedAgentId,
          sphere: slot.sphere,
          tick: gameState.tick,
          seed: gameState.seed,
        });

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
                message: `${effectsResult.consequenceMessage} (${result.detected ? 'detected!' : 'undetected'})`,
                significance: result.detected ? 0.8 : 0.5,
                sphere: slot.sphere!,
              },
            ],
          };
        });

        // Set playing card and delayed close
        setPlayingCardId(pendingIntervention.slotId);
        setTimeout(() => {
          setPlayingCardId(null);
          setDrawerOpen(false);
        }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);
      }

      setPendingIntervention(null);
    },
    [pendingIntervention, selectedAgentId, wheelSlots, gameState.essencePool, gameState.graph, gameState.tick, gameState.seed, setGameState]
  );

  const handleInterventionCancel = useCallback(() => {
    setPendingIntervention(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleStrandClose = useCallback(() => {
    setStrandViewAgent(null);
    setDrawerOpen(true);
  }, []);

  const handleBackFromAgentDetail = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const handleViewPsyche = useCallback(() => {
    setStrandViewAgent(selectedAgentId);
  }, [selectedAgentId]);

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleAvatarActionClick = useCallback(() => {
    if (retinueAgents.length === 0) {
      return;
    }

    if (selectedAgentId) {
      setDrawerOpen(true);
    } else {
      handleAgentSelect(retinueAgents[0].id);
    }
  }, [selectedAgentId, retinueAgents, handleAgentSelect]);

  const handleViewProfile = useCallback(() => {
    if (selectedAgentId) setProfileModalAgentId(selectedAgentId);
  }, [selectedAgentId]);

  const handleCloseProfile = useCallback(() => {
    setProfileModalAgentId(null);
  }, []);

  return {
    selectedAgentId,
    drawerOpen,
    strandViewAgent,
    pendingIntervention,
    profileModalAgentId,
    playingCardId,
    retinueAgents,
    agentDetail,
    agentInfoCard,
    agentFullProfile,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleDrawerClose,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenDrawer,
    handleAvatarActionClick,
    handleViewProfile,
    handleCloseProfile,
  };
}
