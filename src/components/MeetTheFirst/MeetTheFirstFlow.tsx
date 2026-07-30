import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  MeetingEncounterResult,
  NarrativeCandidate,
  SparkVision,
  DilemmaChoiceRecord,
  DilemmaInstance,
  FormativeOutcome,
  FormativeTest,
  BondOutcome,
} from '../../types/meetingEncounter';
import type { AscendantIdentity } from '../../types/remembrance';
import type { WorldGraph, SphereName } from '../../types/graph';
import type { CultureIdentity } from '../../types/culture';
import { getActorCultures } from '../../engine/graphQueries';
import { SensingBeat } from './SensingBeat';
import { TestingBeat } from './TestingBeat';
import { FormativeTestBeat, type ConvertedTest } from './FormativeTestBeat';
import { SparkBeat } from './SparkBeat';
import { BondBeat } from './BondBeat';
import { generateNarrativeCandidates, generateSparkVisions, buildNarrativeResult, selectDilemmas, applyMeetingOutcomes } from '../../engine/meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import { clearMeetingDebugState, publishMeetingDebugState } from './meetingDebugState';
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
  /**
   * Ascendant's essence pool, per sphere (THR-868). Priced nudge cards dim with
   * their reason when the pool cannot cover them; an absent pool dims every
   * priced card rather than throwing, leaving the free options playable.
   */
  essencePool?: Readonly<Record<string, number>>;
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
  essencePool,
  onComplete,
  onClose,
}: MeetTheFirstFlowProps) {
  const [beat, setBeat] = useState<MeetBeat>('sensing');

  // Accumulated state
  const [selectedCandidate, setSelectedCandidate] = useState<NarrativeCandidate | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [dilemmaChoices, setDilemmaChoices] = useState<DilemmaChoiceRecord[]>([]);
  const [formativeOutcomes, setFormativeOutcomes] = useState<FormativeOutcome[]>([]);
  const [selectedVision, setSelectedVision] = useState<SparkVision | null>(null);

  const hungerId = ascendantIdentity.hungerId;
  const primarySphere = ascendantIdentity.sphereAlignment.primary;
  const locationNode = graph.getNode(locationId);
  const locationName = locationNode?.name ?? 'the settlement';
  const locationSubtype = (locationNode?.properties.locationSubtype as string) ?? 'village';

  // Resolve culture identity from location's belongs_to edges
  const locationCultures = useMemo(
    () => getActorCultures(graph, locationId),
    [graph, locationId],
  );
  const cultureId = locationCultures.length > 0 ? locationCultures[0].culture.id : 'default';
  const cultureIdentity = locationCultures.length > 0
    ? locationCultures[0].culture.properties.cultureIdentity as CultureIdentity | undefined
    : undefined;
  const foundationBias = cultureIdentity?.foundationBias;
  const primaryCultureSphere = cultureIdentity?.veneratedSpheres[0];

  // Generate candidates (memoized on seed + hunger)
  const candidates = useMemo(
    () => generateNarrativeCandidates(hungerId, cultureId, seed, foundationBias, primaryCultureSphere),
    [hungerId, cultureId, seed, foundationBias, primaryCultureSphere],
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

  const handleFormativeComplete = useCallback((outcomes: FormativeOutcome[]) => {
    setFormativeOutcomes(outcomes);
    setBeat('spark');
  }, []);

  const handleSparkSelect = useCallback((vision: SparkVision, _index: number) => {
    setSelectedVision(vision);
    setBeat('bond');
  }, []);

  const handleBondComplete = useCallback((
    editedName: string | undefined,
    resolvedBond?: BondOutcome,
  ) => {
    if (!selectedCandidate || !selectedVision) return;

    const base = buildNarrativeResult({
      candidate: selectedCandidate,
      vision: selectedVision,
      dilemmaChoices,
      editedName,
      locationId,
      ascendantSphere: primarySphere,
      tick,
    });

    // Formative + bond outcomes fold into the result here rather than inside
    // `buildNarrativeResult`: that function is shared with the legacy path,
    // which has no outcomes to apply. `applyMeetingOutcomes` is a no-op on
    // empty inputs, so an unconverted run produces a byte-identical result.
    const result = applyMeetingOutcomes(base, formativeOutcomes, resolvedBond);

    // Set the candidate index in the record
    result.meetingChoiceRecord.candidateIndex = selectedCandidateIndex;

    onComplete(result);
  }, [
    selectedCandidate,
    selectedVision,
    dilemmaChoices,
    formativeOutcomes,
    locationId,
    primarySphere,
    tick,
    selectedCandidateIndex,
    onComplete,
  ]);

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

  // Converted subset of this run's dilemmas, in draw order. Presence of `test`
  // is the whole branch condition — a partially-converted library yields a
  // partially-converted run, which is the point of per-template rollout.
  const convertedTests = useMemo<ConvertedTest[]>(
    () =>
      dilemmas
        .filter((d): d is DilemmaInstance & { test: FormativeTest } => d.test != null)
        .map((instance) => ({ instance, test: instance.test })),
    [dilemmas],
  );

  // Publish the flow's position for `__DEBUG.getMeetingState()`. Observation
  // only — nothing in the game reads it, and the snapshot is cleared on unmount
  // so a finished run cannot be mistaken for a live one.
  useEffect(() => {
    publishMeetingDebugState({
      beat,
      candidateName: selectedCandidate?.name,
      dilemmaIds: dilemmas.map((d) => d.templateId),
      convertedCount: convertedTests.length,
      usingFormativeTests: convertedTests.length > 0,
      formativeOutcomes: formativeOutcomes.map((o) => ({
        templateId: o.templateId,
        band: o.band,
        writtenPole: o.writtenPole,
        netLean: o.netLean,
        shift: o.shift,
        playedNudgeIds: [...o.playedNudgeIds],
      })),
    });
  }, [beat, selectedCandidate, dilemmas, convertedTests, formativeOutcomes]);

  useEffect(() => clearMeetingDebugState, []);

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

      {/* Data-presence branching (THR-868): a run whose selected dilemmas carry
          formative tests plays the nudge beat; one drawn entirely from
          unconverted templates falls back to the legacy choice scene. The
          fallback stays load-bearing until the library conversion completes —
          it is the fail-soft path, not dead code. */}
      {beat === 'testing' && selectedCandidate && convertedTests.length > 0 && (
        <FormativeTestBeat
          candidate={selectedCandidate}
          tests={convertedTests}
          locationName={locationName}
          essencePool={essencePool}
          seed={seed + 3}
          onComplete={handleFormativeComplete}
        />
      )}

      {beat === 'testing' && selectedCandidate && convertedTests.length === 0 && (
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
          bondTest={MEETING_BOND_TEST}
          essencePool={essencePool}
          seed={seed + 4}
          onComplete={handleBondComplete}
        />
      )}
    </div>
  );
}
