/**
 * CeremonyHost — the game screen's full-screen ceremonies: the Harvest at the end
 * of a cycle, Meet the First, and the Rite of the Thread.
 *
 * THR-1881 (the GameView split, step b): moved out of `GameView.tsx` verbatim, with
 * Harvest here rather than in `DialogHost` per the THR-1877 note (Christian ruled on
 * 2026-10-14 that the end of a cycle is a full-screen ceremony). The props carry
 * GameView's own names. GameView mounts this host right after `DialogHost`, so the
 * three `z-50` ceremonies still follow StrandView and the warm-start cover in the
 * DOM, the order they had inline.
 *
 * THR-1877 (S1): the host renders by the home list. Each ceremony mounts only while the
 * interrupt resolution names its kind in `rendering`; ceremonies and Stage moments share
 * one foreground, so a ceremony never draws over an open moment, or under one.
 */
import { Component, Fragment, useMemo, type ReactNode } from 'react';
import type { CeremonyHomedKind, HomedSurfaceKind } from '../../../data/homed-surfaces';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { AscendantIdentity } from '../../../types/remembrance';
import type { MeetingEncounterState, MeetingEncounterResult } from '../../../types/meetingEncounter';
import type { StoredHungerId } from '../../../types/hunger';
import type { HarvestResult } from '../../../engine/cycleEnd';
import type { PendingThreadingRite } from '../../../engine/threadingRite';
import type { RiteClose } from '../../../engine/threadingRiteQueue';
import { echoVisuals, godFaceVisual, riteFaceVisual } from '../../../engine/views/ceremonyVisuals';
import { AnimateMount } from '../../shared/AnimateMount';
import { MeetTheFirstFlow } from '../../MeetTheFirst/MeetTheFirstFlow';
import { ThreadingRite } from '../../ThreadingRite/ThreadingRite';
import type { NudgeSpendRequest } from '../encounter-stage/nudgeCommit';
import { unplacedHomedKinds, type InterruptResolution } from '../interruptRegistry';
import { HarvestScreen } from '../HarvestScreen';
import { AgeTwilightScreen } from '../AgeTwilightScreen';
import type { TwilightBeats } from '../../../engine/twilight';
import { HomedSurfaceFallback } from './HomedSurfaceFallback';
import { CEREMONY_HOST_KINDS } from './hostKinds';

export interface CeremonyHostProps {
  gameState: GameState;
  archetype: AscendantArchetype;
  // The end of the age (THR-1381)
  /** The closing beats, built once when the Twilight opens; null outside it. */
  twilightBeats?: TwilightBeats | null;
  /** *See what the age leaves* — completes the Twilight, and the harvest opens. */
  handleCompleteTwilight?: () => void;
  /** False when this world's memory will not be kept (the beats' third subline says so). */
  twilightRemembered?: boolean;
  // Harvest
  harvestResult: HarvestResult | null;
  /** THR-1813 — *Wake in a new world*. */
  handleWakeNewWorld: () => void;
  /** THR-1813 — whether the run's record was kept (null until the harvest has saved). */
  accountSaved: boolean | null;
  /** THR-1813 — false when this world's run is not carried into the next (the Advanced path). */
  accountCarried?: boolean;
  // Meet the First
  meetingState: MeetingEncounterState | null;
  ascendantIdentity: AscendantIdentity | undefined;
  handleMeetingSpendEssence: (testIndex: number, requests: NudgeSpendRequest[]) => void;
  handleMeetingComplete: (result: MeetingEncounterResult) => void;
  handleMeetingClose: () => void;
  // Rite of the Thread
  pendingRite: PendingThreadingRite | null;
  interruptResolution: InterruptResolution;
  handleRiteComplete: (close: Extract<RiteClose, { kind: 'played' }>) => void;
  handleRiteWithoutHand: () => void;
  // THR-1877 — a rendering ceremony kind this host has no case for (only data drift).
  onHomedSurfaceSkip?: (kind: HomedSurfaceKind) => void;
  onHomedSurfaceFallback?: (kind: HomedSurfaceKind) => void;
}

export function CeremonyHost({
  gameState,
  archetype,
  twilightBeats = null,
  handleCompleteTwilight,
  twilightRemembered = true,
  harvestResult,
  handleWakeNewWorld,
  accountSaved,
  accountCarried = true,
  meetingState,
  ascendantIdentity,
  handleMeetingSpendEssence,
  handleMeetingComplete,
  handleMeetingClose,
  pendingRite,
  interruptResolution,
  handleRiteComplete,
  handleRiteWithoutHand,
  onHomedSurfaceSkip,
  onHomedSurfaceFallback,
}: CeremonyHostProps) {
  // THR-2102 (S6.1) — the ceremonies' pictures, built here once, when the harvest or the rite
  // mounts: the screens draw descriptors and never read the graph for them. Keyed on the
  // harvest and the rite, never on the (in-place mutated) graph.
  const harvestVisuals = useMemo(() => {
    if (!harvestResult) return null;
    try {
      return {
        godFace: godFaceVisual(gameState),
        echoVisuals: echoVisuals(gameState, harvestResult.cosmicEchoCandidates.map(c => c.echoDefinition)),
        leaveVisuals: echoVisuals(gameState, harvestResult.divineEchoes ?? []),
      };
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestResult]);
  const riteFace = useMemo(() => (pendingRite
    ? riteFaceVisual(gameState, pendingRite.agentId, 'this mortal')
    : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingRite?.agentId, pendingRite?.tick]);

  // THR-1877 — ceremonies share the foreground with the Stage: each renders only while
  // the resolution names its kind, through this exhaustive switch.
  const renders = new Set<HomedSurfaceKind>(interruptResolution.rendering);
  const renderCeremony = (kind: CeremonyHomedKind): ReactNode => {
    switch (kind) {
    // The end of the age (THR-1381): the closing beats, before the harvest.
    // A render error shows the plain fallback, whose Continue completes the Twilight
    // (GameView maps both callbacks for this kind), so the harvest is always reached.
    case 'age-twilight': return renders.has(kind) && twilightBeats && handleCompleteTwilight && (
        <CeremonyMountBoundary
          fallback={onHomedSurfaceSkip
            ? <HomedSurfaceFallback kind={kind} onContinue={onHomedSurfaceSkip} onFallback={onHomedSurfaceFallback} />
            : null}
        >
          <AgeTwilightScreen
            beats={twilightBeats}
            gameState={gameState}
            primarySphere={archetype.sphereAlignment.primary}
            remembered={twilightRemembered}
            onContinue={handleCompleteTwilight}
          />
        </CeremonyMountBoundary>
      );

    // Harvest overlay. Always mounted: `AnimateMount` plays its own exit.
    case 'cycle-harvest': return (
      <AnimateMount show={harvestResult !== null && renders.has(kind)} animation="anim-fade">
        {harvestResult && (
          <HarvestScreen
            harvest={harvestResult}
            cycle={gameState.cycle}
            onWakeNewWorld={handleWakeNewWorld}
            accountSaved={accountSaved}
            accountCarried={accountCarried}
            godFace={harvestVisuals?.godFace}
            echoVisuals={harvestVisuals?.echoVisuals}
            leaveVisuals={harvestVisuals?.leaveVisuals}
          />
        )}
      </AnimateMount>
    );

    // Meeting encounter — full-screen narrative flow
    case 'meet-the-first': return renders.has(kind) && meetingState && ascendantIdentity && (
        <MeetTheFirstFlow
          ascendantIdentity={ascendantIdentity}
          graph={gameState.graph}
          ascendantId={gameState.ascendantId}
          locationId={meetingState.locationId}
          seed={gameState.seed}
          tick={gameState.tick}
          // THR-868: the meeting's nudge cards are a real essence spend, so the
          // stage needs the live pool to know what the player can afford.
          essencePool={gameState.essencePool}
          onSpendEssence={handleMeetingSpendEssence}
          onComplete={handleMeetingComplete}
          onClose={handleMeetingClose}
        />
      );

    // The Rite of the Thread — every thread the god binds (THR-1754). Keyed on
    // the rite so the next queued rite mounts fresh.
    case 'threading-rite': return renders.has(kind) && pendingRite && (
        <ThreadingRite
          key={`${pendingRite.agentId}_${pendingRite.tick}`}
          graph={gameState.graph}
          rite={pendingRite}
          worldSeed={gameState.seed}
          primarySphere={archetype.sphereAlignment.primary}
          hungerId={(ascendantIdentity?.hungerId ?? '') as StoredHungerId}
          essencePool={gameState.essencePool}
          onSpendEssence={handleMeetingSpendEssence}
          onComplete={handleRiteComplete}
          onBondWithoutHand={handleRiteWithoutHand}
          face={riteFace}
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
      {CEREMONY_HOST_KINDS.map(kind => <Fragment key={kind}>{renderCeremony(kind)}</Fragment>)}
      {onHomedSurfaceSkip && unplacedHomedKinds(interruptResolution.rendering, 'ceremony', CEREMONY_HOST_KINDS).map(kind => (
        <HomedSurfaceFallback key={kind} kind={kind} onContinue={onHomedSurfaceSkip} onFallback={onHomedSurfaceFallback} />
      ))}
    </>
  );
}

/**
 * THR-1381 — a ceremony that throws while rendering shows `fallback` instead of taking
 * the game screen down. Used by the end of the age, whose fallback leads to the harvest.
 */
class CeremonyMountBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.warn('[CeremonyHost] a ceremony failed to render — showing its fallback.', error);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
