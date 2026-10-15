/**
 * DialogHost — the game screen's dialogs: StrandView, Scry, the warm-start cover,
 * the Chapter Ledger, delve progress, Read the Threads, divine receipts, the gift
 * beat (offer pill + AscendantBeatModal), Codex, Doom and Mandate details, and the
 * event popup. `MapAnchoredDialogs` (below) holds the three dialogs that render
 * inside the map area's `relative` box: the agenda picker, the intervention
 * confirm and the effect choice set.
 *
 * THR-1881 (the GameView split, step b): moved out of `GameView.tsx` verbatim. The
 * props carry GameView's own names so each mount reads exactly as it did inline.
 * The mount order inside this host is the order the mounts had in GameView, and
 * GameView mounts this host where StrandView stood, ahead of `CeremonyHost`: the
 * non-portal `z-50` overlays (StrandView, warm start, then the ceremonies) keep
 * their DOM order, so equal-z stacking is unchanged. Everything else here either
 * portals (`Modal`, the Scry court) or carries its own z-index.
 *
 * Nothing here changes what the game does.
 */
import { lazy, Suspense } from 'react';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { SPHERE_NAMES } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import type { ScryState } from '../../../types/scry';
import type { GameState } from '../../../types/gameState';
import type { PopupItem, NotificationState } from '../../../types/notification';
import type { PendingBeat } from '../../../types/ascendantBeat';
import type { WorldRef } from '../../../types/worldRef';
import type { RetinueAgent } from '../../../engine/retinue';
import type { PlayerActionReceipt } from '../../../engine/playerReceipts';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import type { WheelSlot } from '../../../engine/wheel';
import type { AgendaTemplate } from '../../../data/agenda-content';
import type { InterventionType, LocalEncounterMode } from '../../../types/dream';
import type { PendingChoiceData, ExecutionContext } from '../../../engine/effectExecutors';
import { INTERVENTION_DEFINITIONS } from '../../../types/dream';
import { executeEffect } from '../../../engine/effectExecutors';
import { emitTrace } from '../../../engine/traceBuffer';
import { touchWorld } from '../../../engine/simulationRuntime';
import { withEssenceSpend } from '../../../engine/essenceMovement';
import { previewReachSignatureGrant } from '../../../engine/ascendantBeat';
import { describeOffering, isRungOpeningOffer } from '../../../engine/godProgression';
import { isSpineBeatId } from '../../../data/ascendant-beat-content';
import { buildCodexRunContext, type CodexRunStateFilter } from '../../Codex/codexRunState';
import { AnimateMount } from '../../shared/AnimateMount';
import { DelveProgressPanel } from '../../ruins/DelveProgressPanel';
import type { UseWarmStartResult } from '../hooks/useWarmStart';
import type { InterruptResolution } from '../interruptRegistry';
import { StrandView } from '../StrandView';
import { ScryOverlay } from '../ScryOverlay';
import { ScryProvider } from '../contexts/ScryContext';
import { WarmStartOverlay } from '../WarmStartOverlay';
import { ChapterLedger, countThreadedChapters } from '../ChapterLedger';
import { ReadTheThreadsPanel } from '../ReadTheThreadsPanel';
import { DivineReceiptModal } from '../DivineReceiptModal';
import { AscendantBeatModal, AscendantBeatOfferBanner } from '../AscendantBeatModal';
import { DoomClockDetail } from '../DoomClockDetail';
import { MandateDetail } from '../MandateDetail';
import { EventPopup } from '../EventPopup';
import { AgendaPicker } from '../AgendaPicker';
import { InterventionConfirm } from '../InterventionConfirm';
import { ChoiceSetModal } from '../ChoiceSetModal';
import { useGameScreenState } from '../frame/GameScreenState';

const Codex = lazy(() => import('../../Codex/Codex'));

export interface DialogHostProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  runtime: SimulationRuntime;
  archetype: AscendantArchetype;
  // StrandView
  strandData: { agentName: string; strands: ComponentProps<typeof StrandView>['strands'] } | null;
  handleStrandClose: () => void;
  // Scry
  scryVisible: boolean;
  scryState: ScryState;
  retinueAgents: RetinueAgent[];
  handleScryAssign: ComponentProps<typeof ScryProvider>['value']['onAssign'];
  handleScryDemote: (positionId: string) => void;
  handleCloseScry: () => void;
  handleAgentSelect: (agentId: string) => void;
  // Warm start
  warmStart: UseWarmStartResult;
  warmFirstName: string | null;
  // Chapter Ledger (its open flag and seen-count are GameScreenState)
  openAgentSheetForId: (agentId: string) => void;
  // Read the Threads
  lastReadThreadsTick: number;
  setLastReadThreadsTick: Dispatch<SetStateAction<number>>;
  attentionPool: number;
  attentionCapacity: number;
  // Divine receipt
  activeReceipt: PlayerActionReceipt | null;
  handleAcknowledgeReceipt: () => void;
  handleReceiptReaction: (reactionId: string) => void;
  // Gift beat
  pendingBeat: PendingBeat | null;
  beatEntered: boolean;
  setBeatEntered: Dispatch<SetStateAction<boolean>>;
  interruptsSuppressed: boolean;
  giftOtherInterrupts: string[];
  giftPillRaised: boolean;
  handleWitnessBeat: (chosenActionId?: string) => void;
  beatProseOverride: { title: string; prose: string } | undefined;
  avatarName: string;
  beatSubjectRef: WorldRef | undefined;
  // Codex
  codexInitialFilter: CodexRunStateFilter;
  codexInitialEntryId: string | null;
  // Doom and Mandate
  doomJourneyLabel: string | undefined;
  // Event popup
  interruptResolution: InterruptResolution;
  currentPopup: PopupItem | null;
  notificationState: NotificationState;
  handleDismissPopup: () => void;
  handlePopupChoice: (effect: string) => void;
}

export function DialogHost({
  gameState,
  setGameState,
  runtime,
  archetype,
  strandData,
  handleStrandClose,
  scryVisible,
  scryState,
  retinueAgents,
  handleScryAssign,
  handleScryDemote,
  handleCloseScry,
  handleAgentSelect,
  warmStart,
  warmFirstName,
  openAgentSheetForId,
  lastReadThreadsTick,
  setLastReadThreadsTick,
  attentionPool,
  attentionCapacity,
  activeReceipt,
  handleAcknowledgeReceipt,
  handleReceiptReaction,
  pendingBeat,
  beatEntered,
  setBeatEntered,
  interruptsSuppressed,
  giftOtherInterrupts,
  giftPillRaised,
  handleWitnessBeat,
  beatProseOverride,
  avatarName,
  beatSubjectRef,
  codexInitialFilter,
  codexInitialEntryId,
  doomJourneyLabel,
  interruptResolution,
  currentPopup,
  notificationState,
  handleDismissPopup,
  handlePopupChoice,
}: DialogHostProps) {
  // THR-1881 step e: flags the rails and top bar also write live in GameScreenState.
  const {
    state: { chapterLedgerOpen, readThreadsOpen, codexOpen, doomDetailOpen, mandateDetailOpen },
    setChapterLedgerOpen,
    setChapterLedgerSeenCount,
    setReadThreadsOpen,
    setCodexOpen,
    setDoomDetailOpen,
    setMandateDetailOpen,
  } = useGameScreenState();
  return (
    <>
      {/* StrandView overlay */}
      <AnimateMount show={strandData !== null} animation="anim-fade">
        {strandData && (
          <StrandView
            agentName={strandData.agentName}
            strands={strandData.strands}
            onClose={handleStrandClose}
          />
        )}
      </AnimateMount>

      {/* Scry overlay */}
      {/* THR-1709: no AnimateMount — its animated wrapper is a stacking context
          that trapped the court under the top bar. The overlay portals itself to
          <body> and carries its own fade-in. */}
      {scryVisible && (
        <ScryProvider
          value={{
            scryState,
            retinueAgents,
            essencePool: gameState.essencePool,
            primarySphere: archetype.sphereAlignment.primary,
            secondarySphere: archetype.sphereAlignment.secondary,
            tick: gameState.tick,
            seed: gameState.seed + gameState.tick,
            onAssign: handleScryAssign,
            onDemote: handleScryDemote,
            onClose: handleCloseScry,
            // THR-1709: choosing a courtier leaves the court, so the action drawer
            // it opens is never hidden behind the (now body-level) overlay.
            onAgentSelect: (agentId: string) => {
              handleCloseScry();
              handleAgentSelect(agentId);
            },
          }}
        >
          <ScryOverlay />
        </ScryProvider>
      )}

      {/* Warm start overlay (THR-1744) — covers the game while the warm-up runs */}
      {warmStart.running && warmStart.progress && (
        <WarmStartOverlay
          progress={warmStart.progress}
          ticksPerSeason={gameState.clock?.ticksPerSeason}
          firstName={warmFirstName}
        />
      )}

      {/* Chapter Ledger — always-readable archive of every encounter (THR-603) */}
      {chapterLedgerOpen && (
        <ChapterLedger
          gameState={gameState}
          runtime={runtime}
          onClose={() => {
            setChapterLedgerSeenCount(countThreadedChapters(gameState));
            setChapterLedgerOpen(false);
          }}
          // THR-1500 — the ledger is an archive of *other* people's chapters, so
          // the entity link almost never names the selected mortal. With the bare
          // opener it showed whoever happened to be selected, under the named
          // mortal's id.
          onOpenEntity={openAgentSheetForId}
        />
      )}

      {/* Delve progress overlay — active delves for bonded agents (THR-152) */}
      {(gameState.activeDelves?.some(d => !d.aborted && d.beatIndex <= d.totalBeats) || gameState.pendingEmergenceDecision) && (
        <DelveProgressPanel
          gameState={gameState}
          graph={gameState.graph}
          ascendantId={gameState.ascendantId}
          // THR-1713 — an abort refunds essence; file it under ruins.
          onStateUpdate={(patch) => setGameState(prev => ({
            ...prev,
            ...patch,
            ...(patch.essencePool ? withEssenceSpend(prev, patch.essencePool, 'ruins') : {}),
          }))}
        />
      )}

      {/* Read the Threads panel — divine digest review */}
      <ReadTheThreadsPanel
        open={readThreadsOpen}
        onClose={() => setReadThreadsOpen(false)}
        digestBuffer={gameState.digestBuffer ?? []}
        currentTick={gameState.tick}
        essenceAvailable={SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0)}
        lastReadTick={lastReadThreadsTick}
        attentionPool={attentionPool}
        attentionCapacity={attentionCapacity}
        onSpendEssence={(cost) => {
          setLastReadThreadsTick(gameState.tick);
          setGameState(prev => {
            const newPool = { ...prev.essencePool };
            let remaining = cost;
            const sphereOrder = [
              archetype.sphereAlignment.primary,
              archetype.sphereAlignment.secondary,
              ...SPHERE_NAMES.filter(s => s !== archetype.sphereAlignment.primary && s !== archetype.sphereAlignment.secondary),
            ];
            for (const s of sphereOrder) {
              if (remaining <= 0) break;
              const deduct = Math.min(remaining, newPool[s] ?? 0);
              newPool[s] = (newPool[s] ?? 0) - deduct;
              remaining -= deduct;
            }
            return { ...prev, ...withEssenceSpend(prev, newPool, 'other') };
          });
        }}
      />

      {/* Divine Receipt — resolution-time outcome feedback for player action cards (THR-727) */}
      {activeReceipt && (
        <DivineReceiptModal
          open={true}
          receipt={activeReceipt}
          onAcknowledge={handleAcknowledgeReceipt}
          onReaction={handleReceiptReaction}
        />
      )}

      {/* Ascendant beat: thread-tug offer affordance + entered-beat modal (THR-517) */}
      {pendingBeat && !beatEntered && !interruptsSuppressed && (
        <AscendantBeatOfferBanner
          pending={pendingBeat}
          // THR-1853: never enter a gift beside another blocking interrupt (a chapter
          // step opening in the same moment). The player's own ledger and court do not block.
          onEnter={() => {
            if (giftOtherInterrupts.length > 0) return;
            setBeatEntered(true);
          }}
          raised={giftPillRaised}
        />
      )}
      {pendingBeat && beatEntered && (
        <AscendantBeatModal
          open={true}
          pending={pendingBeat}
          // THR-1650: Witness on a delivery beat opens its encounter on The First.
          onResolve={handleWitnessBeat}
          // Enriched, run-specific prose for template-backed pool beats (THR-514).
          proseOverride={beatProseOverride}
          // THR-1609: Beat 0 names the avatar as the player's own shape.
          avatarName={avatarName}
          // THR-1811: the offering's cards with what each costs now.
          offering={pendingBeat.kind === 'offering'
            ? describeOffering(gameState, pendingBeat.offeredActionIds ?? [])
            : undefined}
          rungOpening={pendingBeat.kind === 'rung_gift' ? isRungOpeningOffer(gameState, pendingBeat.beatId) : undefined}
          // THR-1855: the reach-signature card this gift grants, resolved for this god.
          signatureGrantId={previewReachSignatureGrant(gameState, pendingBeat.beatId)}
          // THR-1851: an introduction beat's bound people, so "Attend" can open them.
          subjectRef={beatSubjectRef}
          // Spine beats are not dismissable (onboarding); pool beats can be deferred.
          onClose={isSpineBeatId(pendingBeat.beatId) ? undefined : () => setBeatEntered(false)}
        />
      )}

      {/* Codex overlay — full three-state path catalog for this incarnation (THR-613 Slice 3b-tail) */}
      {codexOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 60 }}
          role="dialog"
          aria-label="Path codex"
        >
          <Suspense
            fallback={
              <div
                className="h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-muted)' }}
              >
                Loading Codex…
              </div>
            }
          >
            <Codex
              embedded
              onClose={() => setCodexOpen(false)}
              runContext={buildCodexRunContext(gameState)}
              initialStateFilter={codexInitialFilter}
              initialEntryId={codexInitialEntryId}
            />
          </Suspense>
        </div>
      )}

      {/* Doom clock detail modal */}
      <DoomClockDetail
        open={doomDetailOpen}
        onClose={() => setDoomDetailOpen(false)}
        definition={gameState.doomDefinition}
        state={gameState.doomClock}
        journeyLabel={doomJourneyLabel}
      />

      {/* Mandate detail modal */}
      {gameState.mandateDefinition && gameState.mandateState && (
        <MandateDetail
          open={mandateDetailOpen}
          onClose={() => setMandateDetailOpen(false)}
          definition={gameState.mandateDefinition}
          state={gameState.mandateState}
          currentTick={gameState.tick}
        />
      )}

      {/* Event popup overlay */}
      <EventPopup
        popup={interruptResolution.popupMayRender ? currentPopup : null}
        queueLength={notificationState.popupQueue.length}
        onDismiss={handleDismissPopup}
        onChoice={handlePopupChoice}
      />
    </>
  );
}

export interface MapAnchoredDialogsProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  runtime: SimulationRuntime;
  // Agenda picker
  agendaPickerOpen: boolean;
  pendingAgendas: AgendaTemplate[] | null;
  wheelSlots: WheelSlot[] | null;
  pendingIntervention: { slotId: string; interventionType: InterventionType } | null;
  handleAgendaSelect: (agenda: AgendaTemplate) => void;
  handleAgendaCancel: () => void;
  // Intervention confirm
  selectedAgenda: AgendaTemplate | null;
  handleInterventionConfirm: (encounterMode?: LocalEncounterMode) => void;
  handleInterventionCancel: () => void;
  // Effect choice set
  pendingChoice: PendingChoiceData | null;
  setPendingChoice: Dispatch<SetStateAction<PendingChoiceData | null>>;
}

/**
 * The three dialogs that render inside the map area's `relative` box (absolute
 * positioning). GameView mounts this where they stood, so their position at
 * 1920×1080 is unchanged; the map host (split step d) takes the mount with it.
 */
export function MapAnchoredDialogs({
  gameState,
  setGameState,
  runtime,
  agendaPickerOpen,
  pendingAgendas,
  wheelSlots,
  pendingIntervention,
  handleAgendaSelect,
  handleAgendaCancel,
  selectedAgenda,
  handleInterventionConfirm,
  handleInterventionCancel,
  pendingChoice,
  setPendingChoice,
}: MapAnchoredDialogsProps) {
  return (
    <>
      {/* Agenda picker overlay */}
      <AnimateMount show={agendaPickerOpen && !!pendingAgendas} animation="anim-fade">
        {pendingAgendas && (() => {
          const slot = wheelSlots?.find(s => s.id === pendingIntervention?.slotId);
          return (
            <AgendaPicker
              agendas={pendingAgendas}
              onSelect={handleAgendaSelect}
              onCancel={handleAgendaCancel}
              sphere={slot?.sphere ?? 'mind'}
            />
          );
        })()}
      </AnimateMount>

      {/* Intervention confirmation popover */}
      {pendingIntervention && wheelSlots && !agendaPickerOpen && (() => {
        const slot = wheelSlots.find(s => s.id === pendingIntervention.slotId);
        if (!slot) return null;
        return (
          <InterventionConfirm
            interventionType={pendingIntervention.interventionType}
            label={slot.label}
            deliveryMode={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].deliveryMode}
            essenceCost={slot.essenceCost}
            sphere={slot.sphere ?? 'mind'}
            // THR-1002: detection is read from its own authority rather
            // than from a slot field. `WheelSlot.detectionRisk` was
            // hardcoded 0 by every live builder, so this popover has been
            // quoting "0% risk" on interventions whose authored risk runs
            // 0.1–0.6 — and `computeDetection` (reached in production via
            // useAgentInteraction → executeIntervention) rolls against the
            // authored value, not the zero. The concept is alive here; it
            // was only ever dead on the action card, which is why the field
            // retired and this read moved instead of going with it.
            detectionRisk={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].detectionRisk}
            rangeStatus={slot.rangeStatus}
            hexDistance={slot.hexDistance}
            description={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].description}
            agendaName={selectedAgenda?.name}
            agendaNarrativeHook={selectedAgenda?.narrativeHook}
            onConfirm={handleInterventionConfirm}
            onCancel={handleInterventionCancel}
          />
        );
      })()}

      {/* Player choice modal — fires when a choice_set effect resolves in 'player' mode */}
      <AnimateMount show={!!pendingChoice} animation="anim-fade">
        {pendingChoice && (
          <ChoiceSetModal
            pending={pendingChoice}
            onResolve={(choiceId, selectedOptionId) => {
              if (!pendingChoice) return; // guard: race between timeout and click

              const selectedOption = pendingChoice.options.find(o => o.id === selectedOptionId);
              let nestedPending = null as typeof pendingChoice | null;

              if (selectedOption && selectedOption.consequences.length > 0) {
                const ctx: ExecutionContext = {
                  casterId: pendingChoice.actorId,
                  tick: gameState.tick,
                  graph: gameState.graph,
                };

                // Execute each consequence — effects mutate the graph in place
                for (const consequence of selectedOption.consequences) {
                  try {
                    const result = executeEffect(consequence, ctx);
                    if (result.pendingChoice) nestedPending = result.pendingChoice;
                  } catch (err) {
                    console.error('[THR-73] Consequence effect failed:', consequence.type, err);
                  }
                }

                // Emit resolution trace for debug panel visibility
                emitTrace({
                  category: 'choice_set_player_resolved',
                  tick: gameState.tick,
                  actorId: pendingChoice.actorId,
                  choiceId,
                  selectedOptionId,
                  consequenceCount: selectedOption.consequences.length,
                  agentId: pendingChoice.actorId,
                  summary: `Player resolved choice '${choiceId}' → '${selectedOptionId}' (${selectedOption.consequences.length} consequences)`,
                });

                // Bump world version — graph was mutated in place
                touchWorld(runtime);

                // Add player-visible event to the narrative log
                setGameState(prev => ({
                  ...prev,
                  recentEvents: [
                    ...prev.recentEvents.slice(-99),
                    {
                      id: `evt_choice_resolved_${prev.tick}_${Date.now()}`,
                      tick: prev.tick,
                      type: 'choice_set_resolved' as const,
                      message: selectedOption.label
                        ? `Choice made: ${selectedOption.label}`
                        : 'Your choice has been made.',
                      significance: 0.7,
                    },
                  ],
                }));
              }

              // Queue nested choice (if a consequence produced one) or clear.
              // The central auto-pause restores the clock (THR-1608).
              setPendingChoice(nestedPending);
            }}
            onDismiss={() => {
              if (pendingChoice) {
                emitTrace({
                  category: 'choice_set_player_dismissed',
                  tick: gameState.tick,
                  actorId: pendingChoice.actorId,
                  choiceId: pendingChoice.choiceId,
                  agentId: pendingChoice.actorId,
                  summary: `Player dismissed choice '${pendingChoice.choiceId}' — no consequences fired`,
                });
              }
              setPendingChoice(null);
            }}
          />
        )}
      </AnimateMount>
    </>
  );
}
