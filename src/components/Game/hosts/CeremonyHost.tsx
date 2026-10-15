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
 * Nothing here changes what the game does.
 */
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { AscendantIdentity } from '../../../types/remembrance';
import type { MeetingEncounterState, MeetingEncounterResult } from '../../../types/meetingEncounter';
import type { StoredHungerId } from '../../../types/hunger';
import type { HarvestResult } from '../../../engine/cycleEnd';
import type { PendingThreadingRite } from '../../../engine/threadingRite';
import type { RiteClose } from '../../../engine/threadingRiteQueue';
import { AnimateMount } from '../../shared/AnimateMount';
import { MeetTheFirstFlow } from '../../MeetTheFirst/MeetTheFirstFlow';
import { ThreadingRite } from '../../ThreadingRite/ThreadingRite';
import type { NudgeSpendRequest } from '../encounter-stage/nudgeCommit';
import type { InterruptResolution } from '../interruptRegistry';
import { HarvestScreen } from '../HarvestScreen';

export interface CeremonyHostProps {
  gameState: GameState;
  archetype: AscendantArchetype;
  // Harvest
  harvestResult: HarvestResult | null;
  handleBeginNextCycle: () => void;
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
}

export function CeremonyHost({
  gameState,
  archetype,
  harvestResult,
  handleBeginNextCycle,
  meetingState,
  ascendantIdentity,
  handleMeetingSpendEssence,
  handleMeetingComplete,
  handleMeetingClose,
  pendingRite,
  interruptResolution,
  handleRiteComplete,
  handleRiteWithoutHand,
}: CeremonyHostProps) {
  return (
    <>
      {/* Harvest overlay */}
      <AnimateMount show={harvestResult !== null} animation="anim-fade">
        {harvestResult && (
          <HarvestScreen
            harvest={harvestResult}
            cycle={gameState.cycle}
            onBeginNextCycle={handleBeginNextCycle}
          />
        )}
      </AnimateMount>

      {/* Meeting encounter — full-screen narrative flow */}
      {meetingState && ascendantIdentity && (
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
      )}

      {/* The Rite of the Thread — every thread the god binds (THR-1754). Keyed on
          the rite so the next queued rite mounts fresh. */}
      {pendingRite && interruptResolution.open.includes('ThreadingRite') && (
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
        />
      )}
    </>
  );
}
