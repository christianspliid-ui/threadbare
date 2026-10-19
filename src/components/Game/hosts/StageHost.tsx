/**
 * StageHost — the game screen's Stage: the encounter veil and the interrupts that
 * take the screen for one moment (a followed mortal's moment card, The First's
 * journey vignette, a story beat, a premonition, a delve's emergence dilemma).
 *
 * THR-1881 (the GameView split, step c): moved out of `GameView.tsx` verbatim. The
 * props carry GameView's own names. GameView mounts this host where EncounterVeil
 * stood, after the agent sheet, the stub sheets and the attachment sheet, which stay
 * inline for now. Every surface here portals (`createPortal` in the veil, `Modal`
 * for the rest), so the mount point does not decide what is on top: each z-band is
 * its own, and between equal bands the one opened last wins, as before.
 *
 * THR-1877 (S1): the host renders by the home list. Each surface mounts only while the
 * interrupt resolution names its kind in `rendering`, through one exhaustive switch
 * over `StageHomedKind`; the resolution holds every other one (one foreground).
 *
 * THR-1892 (S2): a story beat plays on the Stage frame (`stage/Stage.tsx`), compact, over
 * the dimmed map with its hex lit. The other Stage kinds keep their own screens until
 * their slice moves them (`STAGE_FRAME_KINDS`).
 */
import { Fragment, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import type { HomedSurfaceKind, StageHomedKind } from '../../../data/homed-surfaces';
import { unplacedHomedKinds } from '../interruptRegistry';
import { HomedSurfaceFallback } from './HomedSurfaceFallback';
import { STAGE_HOST_KINDS } from './hostKinds';
import type { SphereName } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { UndertakingMomentRecord } from '../../../types/strategicAction';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { WhisperNudge, CompulsionCandidate, PremonitionEvent } from '../../../types/premonition';
import type { PendingVignette } from '../../../types/journeyEngine';
import type { RefRouter } from '../../../hooks/useRefRouter';
import { WORLD_REF_KIND_BY_VISUAL_KIND } from '../../../types/worldRefAdapters';
import { resolveEmergenceDecision } from '../../../engine/ruins/delveVariant';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import { EmergenceDilemmaModal } from '../../ruins/EmergenceDilemmaModal';
import type { courtPositionToThreadTier, EncounterStageModel } from '../encounter-stage/types';
import type { FollowDescriptor } from '../FollowToggle';
import type { MomentCardModel } from '../momentCardModel';
import type { InterruptResolution } from '../interruptRegistry';
import type { ChapterAnswerRunHandle } from '../hooks/useChapterAnswerRun';
import { EncounterVeil } from '../EncounterVeil';
import { MomentCard } from '../MomentCard';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { StoryBeatStageBody } from '../StoryBeatModal';
import { Stage } from '../stage/Stage';
import type { StageVM } from '../../../engine/views/stage/stageView';
import { PremonitionModal } from '../PremonitionModal';

export interface StageHostProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  interruptResolution: InterruptResolution;
  /** Opens a mortal's sheet; `initialTab` picks the tab (THR-1963: the work moments open Journey). */
  openAgentSheetForId: (agentId: string, initialTab?: import('../hooks/useAgentInteraction').ProfileTabId) => void;
  // Emergence dilemma: gated on `gameState.pendingEmergenceDecision` alone.
  // Encounter veil
  tieredEncounterState: {
    agentId: string;
    threadTier: ReturnType<typeof courtPositionToThreadTier>;
    notification: Pick<EncounterNotification, 'autoResolveTick'>;
  } | null;
  encounterVeilModel: EncounterStageModel | null;
  describeFollowFor: (agentId: string) => FollowDescriptor;
  handleToggleFollow: (agentId: string, source: 'arc_panel' | 'encounter_ui') => void;
  encounterPayingEssence: number;
  encounterPayingSphere: SphereName;
  /** THR-1976 — commits, then closes the veil or shows the answering card. */
  handleEncounterCommitAndContinue: (choiceId: string, essenceSpent: number) => void;
  handleEncounterBoost: (essenceSpent: number) => void;
  handleEncounterPeek: () => void;
  handleEncounterDisregard: () => void;
  handleEncounterMinimize: () => void;
  handleEncounterAcknowledgeAftermath: () => void;
  handleEncounterAftermathReaction: (reactionId: string) => void;
  aftermathReactionTakenId: string | null;
  aftermathReactionError: string | null;
  refRouter: RefRouter;
  handleCommitNudges: (nudgeIds: string[], _essenceCost: number) => void;
  chapterAnswer: ChapterAnswerRunHandle;
  handleChapterLetWorldTurn: () => void;
  handleChapterBackToMap: () => void;
  hexMapRef: RefObject<HexMapV2Handle>;
  // Moment card
  pendingMoment: UndertakingMomentRecord | null;
  momentCardModel: MomentCardModel | null;
  handleAcknowledgeMoment: () => void;
  handleMomentDivineAct: (templateId: string, targetAgentId: string) => { success: boolean; message: string };
  // Journey vignette
  activeVignette: PendingVignette | null;
  handleJourneyChoice: (choiceId: string) => void;
  // Story beat
  activeStoryBeatId: string | null;
  activeStoryBeatTemplate: UnifiedActionTemplate | null;
  activeStoryBeatAgentName: string;
  /** THR-1892 — the Stage view model for the open story beat (lit hex, place tag, context line). */
  storyBeatStageVM: StageVM | null;
  handleStoryBeatDismiss: () => void;
  // Premonition
  activePremonition: PremonitionEvent | null;
  handleWhisperChoice: (nudge: WhisperNudge) => void;
  handleCompulsionChoice: (candidate: CompulsionCandidate) => void;
  handlePremonitionDismiss: () => void;
  // THR-1877 — a rendering Stage kind this host has no case for (only data drift).
  onHomedSurfaceSkip?: (kind: HomedSurfaceKind) => void;
  onHomedSurfaceFallback?: (kind: HomedSurfaceKind) => void;
}

export function StageHost({
  gameState,
  setGameState,
  interruptResolution,
  openAgentSheetForId,
  tieredEncounterState,
  encounterVeilModel,
  describeFollowFor,
  handleToggleFollow,
  encounterPayingEssence,
  encounterPayingSphere,
  handleEncounterCommitAndContinue,
  handleEncounterBoost,
  handleEncounterPeek,
  handleEncounterDisregard,
  handleEncounterMinimize,
  handleEncounterAcknowledgeAftermath,
  handleEncounterAftermathReaction,
  aftermathReactionTakenId,
  aftermathReactionError,
  refRouter,
  handleCommitNudges,
  chapterAnswer,
  handleChapterLetWorldTurn,
  handleChapterBackToMap,
  hexMapRef,
  pendingMoment,
  momentCardModel,
  handleAcknowledgeMoment,
  handleMomentDivineAct,
  activeVignette,
  handleJourneyChoice,
  activeStoryBeatId,
  activeStoryBeatTemplate,
  activeStoryBeatAgentName,
  storyBeatStageVM,
  handleStoryBeatDismiss,
  activePremonition,
  handleWhisperChoice,
  handleCompulsionChoice,
  handlePremonitionDismiss,
  onHomedSurfaceSkip,
  onHomedSurfaceFallback,
}: StageHostProps) {
  // THR-1877 — the Stage renders only the kinds the resolution names (one foreground,
  // so at most one of these), each through this exhaustive switch.
  const renders = new Set<HomedSurfaceKind>(interruptResolution.rendering);
  const renderStageSurface = (kind: StageHomedKind): ReactNode => {
    if (!renders.has(kind)) return null;
    switch (kind) {
    // Emergence Dilemma — blocking modal when a delve awaits a divine decision (THR-153)
    case 'emergence-dilemma': return gameState.pendingEmergenceDecision && (
        <EmergenceDilemmaModal
          gameState={gameState}
          onResolve={(choice) => {
            setGameState(prev => ({
              ...prev,
              ...resolveEmergenceDecision(prev, choice, prev.ascendantId),
            }));
          }}
        />
      );

    // EncounterVeil — unified encounter display for all encounter types.
    // Wrapped in `anim-encounter-handoff-fade-up` so the world view → encounter
    // transition lands as a 400ms fade-up (THR-340 / design plan §5.8).
    case 'encounter': return tieredEncounterState && encounterVeilModel && (
        <div className="anim-encounter-handoff-fade-up" data-testid="encounter-handoff-fade-up">
          <EncounterVeil
            open={true}
            model={encounterVeilModel}
            threadTier={tieredEncounterState.threadTier}
            // THR-1299 slice 4 — follow the encounter's subject from the veil.
            followState={describeFollowFor(tieredEncounterState.agentId)}
            onToggleFollow={(agentId) => handleToggleFollow(agentId, 'encounter_ui')}
            essence={encounterPayingEssence}
            essenceSphere={encounterPayingSphere}
            tick={gameState.tick}
            autoResolveTick={tieredEncounterState.notification.autoResolveTick}
            // THR-1976 — the handler that closes the veil or shows the answering
            // card; the bare commit left the step on screen, holding the clock.
            onIntervene={handleEncounterCommitAndContinue}
            onBoost={handleEncounterBoost}
            onPeek={handleEncounterPeek}
            onDisregard={handleEncounterDisregard}
            onMinimize={handleEncounterMinimize}
            onAcknowledgeAftermath={handleEncounterAcknowledgeAftermath}
            onAftermathReaction={handleEncounterAftermathReaction}
            aftermathReactionTakenId={aftermathReactionTakenId}
            aftermathReactionError={aftermathReactionError}
            // THR-1477 — the veil's name opens the *character sheet*, not the
            // action drawer. `handleAgentSelect` opens ActionDrawer, which sits
            // below the veil's z-index 50 and is therefore invisible while the
            // veil holds the screen: a control that looks live and does nothing
            // (Law 21). `AgentProfileModal` mounts at MODAL_Z_ABOVE_INTERRUPT
            // (65) precisely so it can stack above an interrupt (THR-1139), so
            // the sheet opens on top and closing it returns to the encounter —
            // the veil is never unmounted, so its step, hand and essence are
            // untouched.
            //
            // It is `openAgentSheetForId`, not `openAgentProfileForId`: the
            // latter sets only the modal id, while the card the modal renders
            // is memoised on `selectedAgentId`, so on its own it shows nothing
            // (no selection) or the previously selected agent. THR-1461 is the
            // same root cause on the premonition's name control; this ticket
            // builds the primitive, that one repoints its own surfaces.
            onSelectAgent={openAgentSheetForId}
            // THR-1490 — the veil's `visualKind` adapter. Everything the four branches
            // this replaced used to do by hand — attachment to its sheet, faction and
            // artifact to the stub modal, Area to its centre hex — the router now does
            // from one table, and it does it for every kind rather than the five anyone
            // remembered to wire.
            //
            // **Card, not sheet, and that is the point.** The detail stack mounts above
            // the veil's z-index, so a chip now opens the thing's card *over* the
            // encounter and closing it returns you to the scene. The old stub-modal
            // route was a sheet on an unrelated z-band, and the `location` arm's other
            // destination (`handleLocationClick`) changes the whole view level — under a
            // veil that is a click that looks live and does nothing, the same Law 21
            // defect THR-1477 fixed for the agent's name. The card's own footer carries
            // "open its sheet ↗" for the player who wants the whole of it.
            onSelectEntity={(entityId, kind) => {
              // THR-1670 — a spell's shared definition node is a Power, not an item:
              // open its catalog card (and codex sheet) by template id. The `attachment`
              // world card reads artifacts only, so this would render as "Unknown".
              const spellTemplateId = kind === 'attachment'
                ? gameState.graph.getNode(entityId)?.properties.spellTemplateId
                : undefined;
              if (typeof spellTemplateId === 'string') {
                refRouter.open({ kind: 'power_template', id: spellTemplateId }, 'card', { via: 'veil' });
                return;
              }
              refRouter.open(
                { kind: WORLD_REF_KIND_BY_VISUAL_KIND[kind], id: entityId },
                'card',
                { via: 'veil' },
              );
            }}
            onCommitNudges={handleCommitNudges}
            // THR-1812 — after a commit on a paused clock the veil is the answering card.
            answering={chapterAnswer.answering ?? undefined}
            onLetWorldTurn={handleChapterLetWorldTurn}
            onBackToMap={handleChapterBackToMap}
            onShowOnMap={(col, row) => hexMapRef.current?.focusOn({ col, row })}
          />
        </div>
      );

    // Moment card — a followed mortal's undertaking said something (THR-1299 slice 3).
    // Render-gated on the other interrupts so it waits behind an encounter rather
    // than stacking on it; the slot survives, the card returns when the veil closes.
    case 'undertaking-moment': return pendingMoment && momentCardModel && (
        <MomentCard
          open={true}
          model={momentCardModel}
          graph={gameState.graph}
          onAcknowledge={handleAcknowledgeMoment}
          // THR-1500 — a moment arrives for a *followed* mortal, which is exactly
          // the case where the selection is someone else. Same root cause as the
          // premonition's name control (THR-1461), same primitive.
          onSelectAgent={openAgentSheetForId}
          // THR-1963 — "See the work" opens the same sheet on its Journey tab.
          onSeeWork={(agentId) => openAgentSheetForId(agentId, 'journey')}
          onDivineAct={handleMomentDivineAct}
        />
      );

    // Journey vignette modal (auto-interrupt for The First)
    case 'journey-vignette': return activeVignette && (
        <JourneyVignetteModal
          key={activeVignette.id}
          open={true}
          essenceAvailable={encounterPayingEssence}
          onClose={() => {
            // Dismissing = step back choice (withdrawn)
            const fallbackChoice = activeVignette.data.choices.find(c => c.effects.interventionType === 'withdrawn');
            if (fallbackChoice) {
              handleJourneyChoice(fallbackChoice.id);
            } else {
              // No withdrawn choice available — just dismiss
              setGameState(prev => ({
                ...prev,
                pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
              }));
            }
          }}
          onChoice={handleJourneyChoice}
          vignette={activeVignette.data}
        />
      );

    // Story beat (pacing governor) — on the Stage, compact (THR-1892).
    case 'story-beat': return activeStoryBeatId && activeStoryBeatTemplate && storyBeatStageVM && (
        <Stage
          key={activeStoryBeatId}
          kind="story-beat"
          vm={storyBeatStageVM}
          label={`Story beat: ${activeStoryBeatTemplate.name}`}
          onEscape={handleStoryBeatDismiss}
          tick={gameState.tick}
          right={(
            <StoryBeatStageBody
              template={activeStoryBeatTemplate}
              contextLine={storyBeatStageVM.contextLine}
              agentName={activeStoryBeatAgentName}
              onDismiss={handleStoryBeatDismiss}
            />
          )}
        />
      );

    // Divine Premonition modal (Whisper / Compulsion)
    case 'premonition': return activePremonition && (
        <PremonitionModal
          open={true}
          premonition={activePremonition}
          essencePool={gameState.essencePool}
          graph={gameState.graph}
          tooltipContext={{
            graph: gameState.graph,
            familiarityMap: gameState.familiarityMap,
            ascendantId: gameState.ascendantId,
          }}
          onWhisperChoice={handleWhisperChoice}
          onCompulsionChoice={handleCompulsionChoice}
          // Opens the mortal's sheet *over* the premonition (THR-1139). The
          // premonition stays mounted and choosable underneath — this is a
          // context lookup, not a dismissal.
          //
          // THR-1461: `openAgentSheetForId`, the primitive THR-1477 built for the
          // veil, not `openAgentProfileForId`. The latter sets only the modal id
          // while the card it renders is memoised on `selectedAgentId`, so it
          // opened the *previously selected* mortal's sheet under the subject's id
          // — Kael's whisper opening Thorne's profile (Laws 1 and 33). The modal now
          // names its own subject, so the opener is passed by reference and there is
          // no closure here left to name the wrong one.
          //
          // Deliberately not `refRouter.open({ kind: 'actor' }, 'sheet')`: the
          // router's agent arm is `handleAgentSelect`, which opens the ActionDrawer
          // at z 40 — invisible beneath this modal at z 60, a Law 21 dead click.
          // A caller behind a full-screen interrupt wants the sheet on top, which
          // is the distinction `openAgentSheetForId` exists to draw.
          onViewAgent={openAgentSheetForId}
          onDismiss={handlePremonitionDismiss}
        />
      );

    default: {
      const unplaced: never = kind;
      return unplaced;
    }
    }
  };

  return (
    <>
      {STAGE_HOST_KINDS.map(kind => <Fragment key={kind}>{renderStageSurface(kind)}</Fragment>)}
      {onHomedSurfaceSkip && unplacedHomedKinds(interruptResolution.rendering, 'stage', STAGE_HOST_KINDS).map(kind => (
        <HomedSurfaceFallback key={kind} kind={kind} onContinue={onHomedSurfaceSkip} onFallback={onHomedSurfaceFallback} />
      ))}
    </>
  );
}
