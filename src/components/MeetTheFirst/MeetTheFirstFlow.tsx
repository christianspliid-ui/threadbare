import { useState, useCallback, useMemo } from 'react';
import type { MeetingEncounterResult, NarrativeCandidate, SparkVision, DilemmaChoiceRecord } from '../../types/meetingEncounter';
import type { AscendantIdentity } from '../../types/remembrance';
import type { WorldGraph, SphereName } from '../../types/graph';
import { SensingBeat } from './SensingBeat';
import { TestingBeat } from './TestingBeat';
import { SparkBeat } from './SparkBeat';
import { BondBeat } from './BondBeat';
import { generateNarrativeCandidates, generateSparkVisions, buildNarrativeResult, selectDilemmas } from '../../engine/meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { DILEMMA_TEMPLATES } from '../../data/meeting-content';
import { SENSING_OPENING_PROSE, SENSING_OPENING_FALLBACK } from '../../data/meeting-narrative-prose';

type MeetBeat = 'sensing' | 'testing' | 'spark' | 'bond';

interface MeetTheFirstFlowProps {
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
  ascendantIdentity,
  graph,
  ascendantId,
  locationId,
  seed,
  tick,
  onComplete,
  onClose,
}: MeetTheFirstFlowProps) {
  const [beat, setBeat] = useState<MeetBeat>('sensing');

  // Accumulated state
  const [selectedCandidate, setSelectedCandidate] = useState<NarrativeCandidate | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [dilemmaChoices, setDilemmaChoices] = useState<DilemmaChoiceRecord[]>([]);
  const [selectedVision, setSelectedVision] = useState<SparkVision | null>(null);

  const hungerId = ascendantIdentity.hungerId;
  const primarySphere = ascendantIdentity.sphereAlignment.primary;
  const locationNode = graph.getNode(locationId);
  const locationName = locationNode?.name ?? 'the settlement';
  const cultureId = (locationNode?.properties.cultureId as string) ?? 'default';
  const locationSubtype = (locationNode?.properties.locationSubtype as string) ?? 'village';

  // Generate candidates (memoized on seed + hunger)
  const candidates = useMemo(
    () => generateNarrativeCandidates(hungerId, cultureId, seed),
    [hungerId, cultureId, seed],
  );

  // Opening prose
  const openingProse = SENSING_OPENING_PROSE[hungerId] ?? SENSING_OPENING_FALLBACK;

  // ─── Beat handlers ───

  const handleSensingSelect = useCallback((candidate: NarrativeCandidate, index: number) => {
    setSelectedCandidate(candidate);
    setSelectedCandidateIndex(index);
    setBeat('testing');
  }, []);

  const handleTestingComplete = useCallback((choices: DilemmaChoiceRecord[]) => {
    setDilemmaChoices(choices);
    setBeat('spark');
  }, []);

  const handleSparkSelect = useCallback((vision: SparkVision, _index: number) => {
    setSelectedVision(vision);
    setBeat('bond');
  }, []);

  const handleBondComplete = useCallback((editedName: string | undefined) => {
    if (!selectedCandidate || !selectedVision) return;

    const result = buildNarrativeResult({
      candidate: selectedCandidate,
      vision: selectedVision,
      dilemmaChoices,
      editedName,
      locationId,
      ascendantSphere: primarySphere,
      tick,
    });

    // Set the candidate index in the record
    result.meetingChoiceRecord.candidateIndex = selectedCandidateIndex;

    onComplete(result);
  }, [selectedCandidate, selectedVision, dilemmaChoices, locationId, primarySphere, tick, selectedCandidateIndex, onComplete]);

  // Generate dilemmas for the selected candidate
  const dilemmas = useMemo(() => {
    if (!selectedCandidate) return [];
    const templates = ENRICHED_DILEMMA_LIBRARY.length > 0 ? [...ENRICHED_DILEMMA_LIBRARY] : DILEMMA_TEMPLATES;
    return selectDilemmas(
      templates,
      selectedCandidate.primaryReach,
      selectedCandidate.secondaryReach,
      selectedCandidate.sphere,
      selectedCandidate.archetypeId,
      locationSubtype,
      seed + 1,
    );
  }, [selectedCandidate, locationSubtype, seed]);

  // Generate spark visions for the selected candidate
  const sparkVisions = useMemo(() => {
    if (!selectedCandidate) return [];
    return generateSparkVisions(selectedCandidate.primaryReach, primarySphere, seed + 2);
  }, [selectedCandidate, primarySphere, seed]);

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#0a0a0f' }}>
      {beat === 'sensing' && (
        <SensingBeat
          candidates={candidates}
          openingProse={openingProse}
          onSelect={handleSensingSelect}
        />
      )}

      {beat === 'testing' && selectedCandidate && (
        <TestingBeat
          candidate={selectedCandidate}
          dilemmas={dilemmas}
          locationName={locationName}
          onComplete={handleTestingComplete}
        />
      )}

      {beat === 'spark' && (
        <SparkBeat
          visions={sparkVisions}
          primarySphere={primarySphere}
          onSelect={handleSparkSelect}
        />
      )}

      {beat === 'bond' && selectedCandidate && selectedVision && (
        <BondBeat
          candidate={selectedCandidate}
          vision={selectedVision}
          hungerId={hungerId}
          primarySphere={primarySphere}
          onComplete={handleBondComplete}
        />
      )}
    </div>
  );
}
