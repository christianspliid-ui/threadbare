/**
 * MeetTheFirstFlow — Full-screen narrative overlay for the "Meet The First" encounter.
 *
 * Replaces the old MeetingEncounterModal with a 4-beat cinematic flow:
 *   1. Sensing — atmospheric arrival, candidate generation
 *   2. Testing — dilemma choices that shape the mortal
 *   3. Spark — reveal and divine investment
 *   4. Bond — confirmation and naming
 *
 * Stub: real implementation follows in a subsequent task.
 */

import type { WorldGraph } from '../../engine/worldGraph';
import type { AscendantIdentity } from '../../types/remembrance';
import type { MeetingEncounterResult } from '../../types/meetingEncounter';

export interface MeetTheFirstFlowProps {
  ascendantIdentity: AscendantIdentity;
  graph: WorldGraph;
  ascendantId: string;
  locationId: string;
  seed: number;
  tick: number;
  onComplete: (result: MeetingEncounterResult) => void;
  onClose: () => void;
}

export function MeetTheFirstFlow({
  onClose,
}: MeetTheFirstFlowProps) {
  // Stub — full implementation in a subsequent task
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-label="Meet The First"
    >
      <div className="text-amber-200 text-center">
        <p className="text-2xl font-serif mb-4">Meet The First</p>
        <p className="text-sm opacity-60 mb-6">Narrative flow coming soon...</p>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-amber-200/30 rounded hover:bg-amber-200/10 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
