import { useState, useCallback, useMemo } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { LocalEncounterMode, InterventionType } from '../../../types/dream';
import type { AgendaTemplate } from '../../../data/agenda-content';
import { INTERVENTION_DEFINITIONS } from '../../../types/dream';
import { getRetinueAgents, getThreadedNodes } from '../../../engine/retinue';
import type { ThreadCategory, ThreadedNode } from '../../../engine/retinue';
import { enrichRetinueWithActivity } from '../../../engine/agentActivity';
import { getAgentActivityLabel } from '../../../engine/agentActivity';
import { getAgentDetail, getAgentInfoCard, getAgentFullProfile } from '../../../engine/agentDetail';
import { getAgentWheelSlots } from '../../../engine/wheel';
import { executeIntervention } from '../../../engine/dream';
import { applyInterventionEffects } from '../../../engine/interventionEffects';
import { applyAscendantFeedback } from '../../../engine/ascendantFeedback';
import { createUnifiedAction } from '../../../engine/unifiedActionLifecycle';
import { getUnifiedTemplateById, THREAD_CREATION_TEMPLATES } from '../../../data/unified-action-templates';
import { templateIdFromSlotId, getTargetActionSlots } from '../../../engine/targetActions';
import { buildActorTargetContext } from '../../../engine/targetContextBuilders';
import { getAvatarHexPosition } from '../../../engine/visibility';
import { appendEvent } from '../../../engine/encounterTimeline';
import { mulberry32 } from '../../../lib/prng';
import type { ToastItem } from '../../../types/notification';
import type { HexCoord } from '../../../types';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import { touchWorld } from '../../../engine/simulationRuntime';
import { getFamiliarity, getKnowledgeLevel } from '../../../engine/familiarity';
import { generateAgendas } from '../../../engine/agendaGenerator';
import { DIVINE_INFLUENCE_CONSTANTS } from '../../../data/intervention-feedback-content';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../../../engine/strands';
import { useInterventionAudio } from './useInterventionAudio';
import { getSphereColor } from '../../../data/sphereIcons';

interface UseAgentInteractionParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  archetype: AscendantArchetype;
  onOpenScry: () => void;
  scryState?: import('../../../types/scry').ScryState;
  /** Optional callback to push a toast notification immediately on action dispatch */
  onPushToast?: (toast: ToastItem) => void;
  /**
   * Optional callback to trigger a sphere-colored particle burst at a hex.
   * Called after target_action dispatch (after the glow delay) at the target agent's hex.
   */
  onParticleBurst?: (hexCol: number, hexRow: number, sphereColor: string) => void;
  /** TB-086: Per-session runtime for mutation observability */
  runtime?: SimulationRuntime;
}

export function useAgentInteraction({
  gameState,
  setGameState,
  archetype,
  onOpenScry,
  scryState,
  onPushToast,
  onParticleBurst,
  runtime,
}: UseAgentInteractionParams) {
  // ── Hooks ──
  const { playCastSound } = useInterventionAudio();

  // ── State ──
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedThreadNode, setSelectedThreadNode] = useState<{
    nodeId: string;
    category: ThreadCategory;
  } | null>(null);
  const [selectedHexCoord, setSelectedHexCoord] = useState<HexCoord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
  const [profileModalAgentId, setProfileModalAgentId] = useState<string | null>(null);
  const [pendingIntervention, setPendingIntervention] = useState<{
    slotId: string;
    interventionType: InterventionType;
  } | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaTemplate | null>(null);
  const [agendaPickerOpen, setAgendaPickerOpen] = useState(false);
  const [pendingAgendas, setPendingAgendas] = useState<AgendaTemplate[] | null>(null);

  // ── Computed values ──
  const retinueAgents = useMemo(
    () => enrichRetinueWithActivity(
      getRetinueAgents(gameState.graph, gameState.ascendantId),
      gameState.graph,
      gameState.unifiedActions,
      gameState.encounterProgress,
    ),
    [gameState.graph, gameState.ascendantId, gameState.unifiedActions, gameState.encounterProgress]
  );

  // All threaded nodes (all 5 categories) with agent activity labels enriched
  const threadedNodes = useMemo<ThreadedNode[]>(() => {
    if (!gameState.ascendantId) return [];
    const raw = getThreadedNodes(gameState.graph, gameState.ascendantId);
    // Enrich agent activity labels
    return raw.map((node) => {
      if (node.category !== 'agent') return node;
      const activityLabel = getAgentActivityLabel(
        node.id,
        gameState.graph,
        gameState.unifiedActions,
        gameState.encounterProgress,
      );
      return { ...node, activityLabel };
    });
  }, [gameState.graph, gameState.ascendantId, gameState.unifiedActions, gameState.encounterProgress]);

  const agentDetail = useMemo(() => {
    if (!selectedAgentId) return null;
    return getAgentDetail(gameState.graph, selectedAgentId, gameState.ascendantId);
  }, [selectedAgentId, gameState.graph, gameState.ascendantId]);

  const wheelSlots = useMemo(() => {
    if (!selectedAgentId || !drawerOpen) return null;
    const agent = retinueAgents.find(a => a.id === selectedAgentId);
    if (!agent) return null;

    const interventionSlots = getAgentWheelSlots({
      tier: agent.tier,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
    });

    // Also run generalized action targeting so templates like bind_thread_agent
    // surface alongside the legacy divine interventions.
    const actorCtx = buildActorTargetContext(selectedAgentId, gameState.graph, agent.tier);
    const targetSlots = actorCtx
      ? getTargetActionSlots({
          target: actorCtx,
          templates: THREAD_CREATION_TEMPLATES,
          pool: gameState.essencePool,
          primarySphere: archetype.sphereAlignment.primary,
          avatarPos: getAvatarHexPosition(gameState.graph, gameState.ascendantId) ?? undefined,
          accessibleSpheres: [
            archetype.sphereAlignment.primary,
            archetype.sphereAlignment.secondary,
          ],
          hexRevelation: gameState.hexRevelation,
        })
      : [];

    return [...interventionSlots, ...targetSlots];
  }, [selectedAgentId, drawerOpen, gameState.essencePool, gameState.graph, gameState.ascendantId, gameState.hexRevelation, retinueAgents, archetype]);

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
    const card = getAgentInfoCard(gameState.graph, selectedAgentId, gameState.ascendantId, knowledgeLevel, gameState.seed, gameState.tick);

    // Add scry court position as an active effect if agent holds one
    if (card && scryState?.initialized) {
      const position = scryState.positions.find(p => p.assignedAgentId === selectedAgentId);
      if (position?.activeTitle) {
        const courtEffect = {
          type: 'scry_court' as const,
          label: position.activeTitle.name,
          sphere: position.activeTitle.sphereAffinity,
        };
        card.activeEffects = [...(card.activeEffects ?? []), courtEffect];
      }
    }

    return card;
  }, [selectedAgentId, gameState.graph, gameState.ascendantId, gameState.familiarityMap, gameState.seed, gameState.tick, scryState]);

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
        // IX-019: Close drawer and deselect agent when opening scry
        setDrawerOpen(false);
        setSelectedAgentId(null);
        onOpenScry();
        return;
      }

      // Guard: prevent rapid clicks from queuing multiple interventions
      if (pendingIntervention || playingCardId) return;

      const slot = wheelSlots?.find(s => s.id === slotId);
      if (!slot?.available) return;

      // ── target_action feedback path ───────────────────────────────────
      if (slot.type === 'target_action') {
        if (!selectedAgentId) return;

        // Step 1: Play sphere audio immediately (must be in click handler for Web Audio API)
        if (slot.sphere) {
          playCastSound(slot.sphere, false);
        }

        // Step 2: Trigger glow burst immediately
        setPlayingCardId(slotId);

        // Step 3: After animation completes (600ms), dispatch action + feedback + close
        const capturedTick = gameState.tick;
        const capturedSeed = gameState.seed;
        const capturedAgentId = selectedAgentId;
        const capturedSphere = slot.sphere;

        // Capture target hex position for particle burst (resolve via agent props then located_at edge)
        let capturedHexCol: number | undefined;
        let capturedHexRow: number | undefined;
        {
          const agentNode = gameState.graph.getNode(selectedAgentId);
          if (agentNode) {
            let col = agentNode.properties.hexCol as number | undefined;
            let row = agentNode.properties.hexRow as number | undefined;
            if (col == null || row == null) {
              const locEdges = gameState.graph.getOutgoingEdges(agentNode.id, 'located_at');
              const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
              if (locationId) {
                const loc = gameState.graph.getNode(locationId);
                if (loc) {
                  col = loc.properties.hexCol as number | undefined;
                  row = loc.properties.hexRow as number | undefined;
                }
              }
            }
            capturedHexCol = col;
            capturedHexRow = row;
          }
        }

        setTimeout(() => {
          const templateId = templateIdFromSlotId(slotId);
          if (!templateId) {
            setPlayingCardId(null);
            setDrawerOpen(false);
            return;
          }
          const template = getUnifiedTemplateById(templateId);
          if (!template) {
            setPlayingCardId(null);
            setDrawerOpen(false);
            return;
          }

          const rng = mulberry32(capturedSeed + capturedTick * 43);
          const action = createUnifiedAction({
            actorId: gameState.ascendantId,
            templateId,
            targetId: capturedAgentId,
            scale: template.scale,
            source: 'player',
            tick: capturedTick,
            template,
            rng,
            essencePaid: template.essenceCost ?? 0,
          });

          // Timeline: ACTION_START for player-sourced action
          const targetNode = gameState.graph.getNode(capturedAgentId);
          appendEvent(gameState.ascendantId, {
            phase: 'ACTION_START',
            tick: capturedTick,
            template: template.name,
            target: targetNode?.name ?? capturedAgentId,
            reach: template.reach ?? 'unknown',
            scale: template.scale,
            steps: template.steps.length,
            source: 'player',
          });

          // Build consequence message (optimistic on dispatch)
          const consequenceBody = template.consequenceMessage?.success
            ?? template.narrativeTemplates?.success
            ?? 'The action ripples outward.';

          const sphereName = capturedSphere
            ? capturedSphere.charAt(0).toUpperCase() + capturedSphere.slice(1)
            : 'Action';
          const toastTitle = `${sphereName} — Action Invoked`;
          const toastMessage = `${toastTitle}. ${consequenceBody}`;

          // Push toast (optimistic, dispatch-time feedback)
          if (onPushToast) {
            const newToast: ToastItem = {
              id: `toast_action_${Date.now()}`,
              message: toastMessage,
              sphere: capturedSphere ?? undefined,
              count: 1,
              createdTick: capturedTick,
              expiresAt: Date.now() + 4000,
            };
            onPushToast(newToast);
          }

          // Spawn sphere-colored particle burst at target hex (visual feedback on map)
          if (onParticleBurst && capturedHexCol != null && capturedHexRow != null && capturedSphere) {
            onParticleBurst(capturedHexCol, capturedHexRow, getSphereColor(capturedSphere));
          }

          setGameState(prev => {
            const newPool = { ...prev.essencePool };
            const cost = template.essenceCost ?? 0;
            if (cost > 0 && capturedSphere) {
              newPool[capturedSphere] = Math.max(0, (newPool[capturedSphere] ?? 0) - cost);
            }
            return {
              ...prev,
              essencePool: newPool,
              unifiedActions: [...(prev.unifiedActions ?? []), action],
              recentEvents: [
                ...prev.recentEvents.slice(-99),
                {
                  id: `evt_action_${prev.tick}_${Date.now()}`,
                  tick: prev.tick,
                  type: 'narrative' as const,
                  message: toastMessage,
                  significance: 0.5,
                  sphere: capturedSphere ?? undefined,
                  isInterventionBeat: true,
                },
              ],
            };
          });

          setPlayingCardId(null);
          setDrawerOpen(false);
        }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);

        return;
      }

      // ── Intervention path ─────────────────────────────────────────────────
      if (!slot.interventionType) return;

      // Generate agendas for this intervention
      const targetNode = gameState.graph.getNode(selectedAgentId!);
      const profile = targetNode?.properties?.axiologicalProfile as any;
      const archetypeId = (targetNode?.properties?.narrativeArchetype as string) ?? 'unknown';

      if (profile) {
        const agendas = generateAgendas({
          interventionType: slot.interventionType,
          targetArchetypeId: archetypeId,
          targetProfile: profile,
          playerPrimarySphere: archetype.sphereAlignment.primary,
          seed: gameState.seed + gameState.tick,
        });
        setPendingAgendas(agendas);
        setAgendaPickerOpen(true);
        // Store the slot info for later
        setPendingIntervention({ slotId, interventionType: slot.interventionType });
      }
    },
    [selectedAgentId, wheelSlots, onOpenScry, gameState.graph, gameState.ascendantId, gameState.seed, gameState.tick, archetype, pendingIntervention, playingCardId, playCastSound, onPushToast, onParticleBurst, setGameState]
  );

  const handleAgendaSelect = useCallback((agenda: AgendaTemplate) => {
    setSelectedAgenda(agenda);
    setAgendaPickerOpen(false);
    // pendingIntervention is already set from handleWheelSlotClick
  }, []);

  const handleAgendaCancel = useCallback(() => {
    setAgendaPickerOpen(false);
    setPendingAgendas(null);
    setPendingIntervention(null);
  }, []);

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
        // Look up the divine unified action template
        // Map intervention type → template ID (inspire_intervention → inspire)
        const templateSuffix = pendingIntervention.interventionType === 'inspire_intervention'
          ? 'inspire'
          : pendingIntervention.interventionType;
        const divineTemplateId = `divine.${templateSuffix}`;
        const divineTemplate = getUnifiedTemplateById(divineTemplateId);

        if (divineTemplate) {
          // Create a UnifiedAction — the pipeline resolves it on the next tick
          const rng = mulberry32(gameState.seed + gameState.tick * 43);
          const divineAction = createUnifiedAction({
            actorId: gameState.ascendantId,
            templateId: divineTemplateId,
            targetId: selectedAgentId,
            scale: 'cosmic',
            source: 'player',
            tick: gameState.tick,
            template: divineTemplate,
            rng,
            essencePaid: result.essenceSpent[slot.sphere!] ?? 0,
          });

          // Timeline: ACTION_START for divine intervention
          const divineTargetNode = gameState.graph.getNode(selectedAgentId);
          appendEvent(gameState.ascendantId, {
            phase: 'ACTION_START',
            tick: gameState.tick,
            template: divineTemplate.name,
            target: divineTargetNode?.name ?? selectedAgentId,
            reach: divineTemplate.reach ?? 'unknown',
            scale: 'cosmic',
            steps: divineTemplate.steps.length,
            source: 'player',
          });

          // Apply ascendant feedback (intervention history)
          applyAscendantFeedback(
            gameState.graph,
            gameState.ascendantId,
            pendingIntervention.interventionType,
            slot.sphere,
            gameState.tick
          );

          // Play audio feedback
          playCastSound(slot.sphere, result.detected);

          setGameState(prev => {
            const newPool = { ...prev.essencePool };
            newPool[slot.sphere!] = Math.max(
              0,
              newPool[slot.sphere!] - result.essenceSpent[slot.sphere!]
            );
            return {
              ...prev,
              essencePool: newPool,
              unifiedActions: [...(prev.unifiedActions ?? []), divineAction],
              recentEvents: [
                ...prev.recentEvents.slice(-99),
                {
                  id: `evt_intervention_${prev.tick}_${Date.now()}`,
                  tick: prev.tick,
                  type: 'narrative' as const,
                  message: `The Ascendant ${divineTemplate.narrativeTemplates.initiation}. (${result.detected ? 'detected!' : 'undetected'})`,
                  significance: result.detected ? 0.8 : 0.5,
                  sphere: slot.sphere!,
                  isInterventionBeat: true,
                },
              ],
            };
          });
        } else {
          // Fallback: use legacy path if divine template not found
          const effectsResult = applyInterventionEffects({
            graph: gameState.graph,
            interventionType: pendingIntervention.interventionType,
            targetAgentId: selectedAgentId,
            sphere: slot.sphere,
            tick: gameState.tick,
            seed: gameState.seed,
            agenda: selectedAgenda ?? undefined,
          });

          applyAscendantFeedback(
            gameState.graph,
            gameState.ascendantId,
            pendingIntervention.interventionType,
            slot.sphere,
            gameState.tick
          );

          playCastSound(slot.sphere, result.detected);

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
                  isInterventionBeat: true,
                },
              ],
            };
          });
        }

        // Set playing card and delayed close
        setPlayingCardId(pendingIntervention.slotId);
        setTimeout(() => {
          setPlayingCardId(null);
          setDrawerOpen(false);
        }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);
      }

      setSelectedAgenda(null);
      setPendingAgendas(null);
      setPendingIntervention(null);
    },
    [pendingIntervention, selectedAgentId, wheelSlots, gameState.essencePool, gameState.graph, gameState.tick, gameState.seed, selectedAgenda, setGameState, playCastSound]
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
    setDrawerOpen(false); // IX-007: auto-close drawer when deselecting agent
  }, []);

  const handleViewPsyche = useCallback(() => {
    // IX-002: mutual exclusion — close profile modal when opening strand view
    setProfileModalAgentId(null);
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
    if (selectedAgentId) {
      // IX-002: mutual exclusion — close strand view when opening profile modal
      // IX-008: close drawer when opening full-screen profile modal
      setStrandViewAgent(null);
      setDrawerOpen(false);
      setProfileModalAgentId(selectedAgentId);

      // Update readBackstoryTier on the thread edge to clear New badges
      const threadEdges = gameState.graph.getIncomingEdges(selectedAgentId, 'thread');
      const threadEdge = threadEdges.find(e => e.source === gameState.ascendantId);
      if (threadEdge) {
        const tier = (threadEdge.properties as Record<string, unknown>).tier as number ?? 0;
        const currentRead = (threadEdge.properties as Record<string, unknown>).readBackstoryTier as number ?? 0;
        if (tier > currentRead) {
          gameState.graph.updateEdge(threadEdge.id, {
            properties: { ...threadEdge.properties, readBackstoryTier: tier },
          });
          // TB-086: Non-tick graph mutation — must participate in version system
          if (runtime) touchWorld(runtime);
          // Trigger re-render so isNew badges clear on next agentInfoCard recompute
          setGameState(s => ({ ...s }));
        }
      }
    }
  }, [selectedAgentId, gameState, setGameState]);

  const handleCloseProfile = useCallback(() => {
    setProfileModalAgentId(null);
  }, []);

  const handleThreadNodeSelect = useCallback((nodeId: string, category: ThreadCategory) => {
    if (category === 'agent') {
      // Use existing agent selection flow for agents
      handleAgentSelect(nodeId);
    }
    setSelectedThreadNode({ nodeId, category });
    setSelectedHexCoord(null);
  }, [handleAgentSelect]);

  const handleThreadDetailClose = useCallback(() => {
    setSelectedThreadNode(null);
    setSelectedAgentId(null);
  }, []);

  const handleHexSelect = useCallback((coord: HexCoord) => {
    setSelectedHexCoord(coord);
    setSelectedThreadNode(null);
    setSelectedAgentId(null);
  }, []);

  const handleHexDetailClose = useCallback(() => {
    setSelectedHexCoord(null);
  }, []);

  // IX-002: Close all agent-related overlays (used by cross-hook coordination)
  const closeAllAgentOverlays = useCallback(() => {
    setDrawerOpen(false);
    setStrandViewAgent(null);
    setProfileModalAgentId(null);
    setPendingIntervention(null);
    setAgendaPickerOpen(false);
    setPendingAgendas(null);
    setSelectedAgenda(null);
  }, []);

  return {
    selectedAgentId,
    selectedThreadNode,
    selectedHexCoord,
    handleHexSelect,
    handleHexDetailClose,
    drawerOpen,
    strandViewAgent,
    pendingIntervention,
    profileModalAgentId,
    playingCardId,
    selectedAgenda,
    agendaPickerOpen,
    pendingAgendas,
    retinueAgents,
    threadedNodes,
    agentDetail,
    agentInfoCard,
    agentFullProfile,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleThreadNodeSelect,
    handleThreadDetailClose,
    handleWheelSlotClick,
    handleAgendaSelect,
    handleAgendaCancel,
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
    closeAllAgentOverlays,
  };
}
