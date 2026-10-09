/**
 * ThreadingRite — the Rite of the Thread on screen (THR-1754, threading rite S2).
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md` § UI pillar.
 * Every mortal the god threads with the Agent Thread card plays a rite, shaped
 * by how many it has threaded before (D2):
 *
 * - `full_no_sensing` — a card-route First: tests → spark → bond.
 * - `short` — the 2nd–3rd thread: the opening, one test, the bond.
 * - `bond_only` — the 4th onward: a ceremonial `RevealCard` with a two-card hand.
 *
 * The beats are the meeting's own (`FormativeTestBeat`, `SparkBeat`, `BondBeat`),
 * fed the mortal the god actually threaded through `candidateFromAgent` — their
 * real name and portrait, never an invented soul (PC-6). Every rite carries
 * *Bond without a hand* (D6): the bond still forms, fate alone decides how.
 *
 * Opened through the interrupt registry (`ThreadingRite`), so the world stops
 * behind it. The surface only gathers the player's hand; the engine's
 * `closeThreadingRite` lands every outcome through the one writer (D1).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { SphereName } from '../../types/index';
import type { StoredHungerId } from '../../types/hunger';
import type { BondOutcome, FormativeOutcome, SparkVision } from '../../types/meetingEncounter';
import type { PendingThreadingRite } from '../../engine/threadingRite';
import { candidateFromAgent } from '../../engine/threadingRite';
import {
  planThreadingRite,
  RITE_BOND_ONLY_TEST,
  RITE_BOND_TEST,
  RITE_BOND_SEED_OFFSET,
  type RiteClose,
  type RiteTestPick,
} from '../../engine/threadingRiteQueue';
import { resolveBondTest, generateSparkVisions, bindSparkVisionsToCandidate } from '../../engine/meetingEncounter';
import { selectBondFateLine } from '../../engine/meetingFateLine';
import { GOD_GIVEN_TRAITS } from '../../data/meeting-content';
import {
  RITE_BEGIN_LABEL,
  RITE_BOND_WITHOUT_HAND_LABEL,
  RITE_BOND_WITHOUT_HAND_TOOLTIP,
  RITE_HEADER,
  RITE_RETURN_LABEL,
  riteFirstLine,
  riteOpeningLine,
  ritePlaceName,
  riteReceptionLine,
  riteSubtitle,
} from '../../data/threading-rite-prose';
import { FormativeTestBeat } from '../MeetTheFirst/FormativeTestBeat';
import { SparkBeat } from '../MeetTheFirst/SparkBeat';
import { BondBeat } from '../MeetTheFirst/BondBeat';
import { buildMeetingNudgePhaseModel, meetingSpendRequests } from '../MeetTheFirst/buildMeetingNudgePhaseModel';
import { NudgePhaseShell } from '../Game/encounter-stage/shells/NudgePhaseShell';
import type { NudgeSpendRequest } from '../Game/encounter-stage/nudgeCommit';
import { RevealCard } from '../shared/RevealCard';
import { Button } from '../shared/Button';
import { Tooltip } from '../shared/Tooltip';

const SCENE_BG = '#0a0a0f';
const GOLD = '#d4af37';
const FONT_PROSE = 'var(--font-prose)';

/** Width of the bond-only card: wide enough for the two-card hand and its stakes. */
const BOND_ONLY_CARD_MAX_WIDTH = 760;

/** The bond-only rite's one test is its bond: step index 0 for the spend record. */
const BOND_ONLY_STEP_INDEX = 0;

type RiteStage = 'opening' | 'tests' | 'spark' | 'bond';

export interface ThreadingRiteProps {
  graph: WorldGraph;
  rite: PendingThreadingRite;
  worldSeed: number;
  primarySphere: SphereName;
  hungerId: StoredHungerId;
  essencePool?: Readonly<Record<string, number>>;
  /** Charge a committed hand against the live pool (the meeting's own handler). */
  onSpendEssence?: (testIndex: number, requests: NudgeSpendRequest[]) => void;
  /** The rite was played through — land its outcomes. */
  onComplete: (close: Extract<RiteClose, { kind: 'played' }>) => void;
  /** *Bond without a hand*, Escape, or the card's close. */
  onBondWithoutHand: () => void;
}

export function ThreadingRite({
  graph,
  rite,
  worldSeed,
  primarySphere,
  hungerId,
  essencePool,
  onSpendEssence,
  onComplete,
  onBondWithoutHand,
}: ThreadingRiteProps) {
  // The rite's plan and its mortal are fixed for the rite's life: keyed on the
  // rite itself, never on the (in-place mutated) graph.
  const plan = useMemo(() => planThreadingRite(graph, rite, worldSeed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rite.agentId, rite.tick, rite.shape, worldSeed]);
  const candidate = useMemo(() => candidateFromAgent(graph, rite.agentId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rite.agentId]);
  const node = graph.getNode(rite.agentId);
  const name = candidate?.name ?? node?.name ?? 'this mortal';
  const gender = node?.properties.gender;
  const locationId = graph.getOutgoingEdges(rite.agentId, 'located_at')[0]?.target;
  const locationName = (locationId ? graph.getNode(locationId)?.name : undefined) ?? '';
  const opening = riteOpeningLine(name, gender, candidate?.primaryReach, locationName);
  const becomesFirst = plan.shape === 'full_no_sensing';

  // Rite-only line variants (`riteText`) replace a meeting line that assumes a
  // stranger who does not know the god is there.
  const tests = useMemo<RiteTestPick[]>(() => plan.tests.map(t => ({
    test: t.test,
    instance: {
      ...t.instance,
      godVoice: t.instance.riteText?.godVoice ?? t.instance.godVoice,
      setup: t.instance.riteText?.setup ?? t.instance.setup,
    },
  })), [plan]);

  const [stage, setStage] = useState<RiteStage>('opening');
  const [outcomes, setOutcomes] = useState<FormativeOutcome[]>([]);
  const [vision, setVision] = useState<SparkVision | null>(null);
  // Once the bond has rolled, the played result stands: the no-hand exit goes.
  const [bondRolled, setBondRolled] = useState(false);

  // Escape is *Bond without a hand* (plan § Player-facing text: "dismissed by
  // Escape"). The bond-only card's Modal handles its own Escape.
  useEffect(() => {
    if (plan.shape === 'bond_only' || bondRolled) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBondWithoutHand(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plan.shape, bondRolled, onBondWithoutHand]);

  const sparkVisions = useMemo(() => (candidate && becomesFirst
    ? bindSparkVisionsToCandidate(generateSparkVisions(candidate.primaryReach, primarySphere, plan.seed + 2), candidate)
    : []), [candidate, becomesFirst, primarySphere, plan.seed]);

  const afterTests = useCallback((done: FormativeOutcome[]) => {
    setOutcomes(done);
    setStage(becomesFirst && sparkVisions.length > 0 ? 'spark' : 'bond');
  }, [becomesFirst, sparkVisions.length]);

  const begin = useCallback(() => {
    if (tests.length > 0) setStage('tests');
    else afterTests([]);
  }, [tests.length, afterTests]);

  const finish = useCallback((bondOutcome: BondOutcome | undefined) => {
    if (!bondOutcome) { onBondWithoutHand(); return; }
    onComplete({
      kind: 'played',
      formativeOutcomes: outcomes,
      bondOutcome,
      shape: plan.shape,
      ...(vision ? { spark: { reach: vision.reachInvestment, amount: vision.investmentAmount } } : {}),
    });
  }, [outcomes, plan.shape, vision, onComplete, onBondWithoutHand]);

  if (plan.shape === 'bond_only' || !candidate) {
    return (
      <BondOnlyRite
        name={name}
        gender={gender}
        portraitUrl={candidate?.imageAssetPath ?? ''}
        opening={opening}
        ordinal={rite.ordinal}
        seed={plan.seed + RITE_BOND_SEED_OFFSET}
        primarySphere={primarySphere}
        essencePool={essencePool}
        onSpendEssence={onSpendEssence}
        onComplete={(bondOutcome) => onComplete({ kind: 'played', formativeOutcomes: [], bondOutcome, shape: 'bond_only' })}
        onBondWithoutHand={onBondWithoutHand}
      />
    );
  }

  // The mark a new First will carry (D5): the spark's reach, else their own.
  const markReach = vision?.reachInvestment ?? candidate.primaryReach;
  const mark = becomesFirst ? GOD_GIVEN_TRAITS.find(t => t.reach === markReach) : undefined;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: SCENE_BG }}
      data-testid="threading-rite"
      data-rite-shape={plan.shape}
      data-rite-stage={stage}
    >
      {stage === 'opening' && (
        <div className="h-screen flex flex-col items-center justify-center" data-testid="threading-rite-opening">
          <div style={{ maxWidth: 720, padding: '0 6vw', textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                letterSpacing: '0.18em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {RITE_HEADER.toUpperCase()}
            </h2>
            <p style={{ fontFamily: FONT_PROSE, fontSize: 'var(--text-xs)', color: 'rgba(200,190,170,0.6)', letterSpacing: '0.08em', marginTop: 6 }}>
              {riteSubtitle(rite.ordinal)}
            </p>
            <div
              data-testid="threading-rite-portrait"
              role="img"
              aria-label={name}
              style={{
                width: 'min(220px, 18vw)',
                aspectRatio: '3/4',
                margin: '3vh auto',
                backgroundImage: `url(${candidate.imageAssetPath}), ${candidate.placeholderGradient}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 92%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 92%)',
              }}
            />
            <h3 data-testid="threading-rite-name" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#e8e0d0', letterSpacing: '0.08em', margin: '0 0 2vh' }}>
              {name}
            </h3>
            <p data-testid="threading-rite-opening-line" style={{ fontFamily: FONT_PROSE, fontSize: '1.1rem', color: 'rgba(212,196,158,0.92)', lineHeight: 1.75 }}>
              {opening}
            </p>
            {becomesFirst && (
              <p data-testid="threading-rite-first-line" style={{ fontFamily: FONT_PROSE, fontStyle: 'italic', fontSize: '1rem', color: 'var(--veil-gold-text)', lineHeight: 1.6, marginTop: 12 }}>
                {riteFirstLine(name)}
              </p>
            )}
            <button
              type="button"
              className="focus-ring"
              data-testid="threading-rite-begin"
              onClick={begin}
              style={{
                marginTop: '4vh',
                padding: '10px 26px',
                borderRadius: 8,
                border: `1px solid ${GOLD}`,
                background: 'rgba(212, 175, 55, 0.1)',
                color: GOLD,
                fontFamily: FONT_PROSE,
                fontSize: 'var(--text-base)',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {RITE_BEGIN_LABEL}
            </button>
          </div>
        </div>
      )}

      {stage === 'tests' && tests.length > 0 && (
        <FormativeTestBeat
          candidate={candidate}
          tests={tests}
          locationName={ritePlaceName(locationName)}
          essencePool={essencePool}
          primarySphere={primarySphere}
          onSpendEssence={onSpendEssence}
          seed={plan.seed}
          onComplete={afterTests}
        />
      )}

      {stage === 'spark' && (
        <SparkBeat
          visions={sparkVisions}
          primarySphere={primarySphere}
          onSelect={(v) => { setVision(v); setStage('bond'); }}
        />
      )}

      {stage === 'bond' && (
        <BondBeat
          candidate={candidate}
          {...(vision ? { vision } : {})}
          hungerId={hungerId}
          primarySphere={primarySphere}
          bondTest={RITE_BOND_TEST}
          essencePool={essencePool}
          onSpendEssence={onSpendEssence}
          seed={plan.seed + RITE_BOND_SEED_OFFSET}
          skipNaming
          receptionLineFor={(o) => riteReceptionLine(name, gender, o.reception)}
          revealFooter={mark ? (
            <p data-testid="threading-rite-mark-line" style={{ fontFamily: FONT_PROSE, fontSize: '1rem', color: 'var(--veil-gold-text)', lineHeight: 1.6, marginTop: '-2vh', marginBottom: '4vh' }}>
              {mark.name} — the god&rsquo;s mark. {mark.markLine}
            </p>
          ) : undefined}
          continueLabel={RITE_RETURN_LABEL}
          onRevealed={() => setBondRolled(true)}
          onComplete={(_name, bondOutcome) => finish(bondOutcome)}
        />
      )}

      {/* D6 — every stage can be waved through. Secondary: the stage's own
          action stays the one primary (Law 1). */}
      {!bondRolled && (
        <div className="absolute bottom-6 left-8" style={{ zIndex: 2 }}>
          <BondWithoutHandButton onClick={onBondWithoutHand} />
        </div>
      )}
    </div>
  );
}

function BondWithoutHandButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip label={RITE_BOND_WITHOUT_HAND_LABEL} desc={RITE_BOND_WITHOUT_HAND_TOOLTIP}>
      <Button variant="secondary" size="md" onClick={onClick} data-testid="threading-rite-without-hand">
        {RITE_BOND_WITHOUT_HAND_LABEL}
      </Button>
    </Tooltip>
  );
}

// ─── The bond-only rite (4th thread onward) ───────────────────────

interface BondOnlyRiteProps {
  name: string;
  gender: unknown;
  portraitUrl: string;
  opening: string;
  ordinal: number;
  seed: number;
  primarySphere: SphereName;
  essencePool?: Readonly<Record<string, number>>;
  onSpendEssence?: (testIndex: number, requests: NudgeSpendRequest[]) => void;
  onComplete: (bondOutcome: BondOutcome) => void;
  onBondWithoutHand: () => void;
}

function BondOnlyRite({
  name,
  gender,
  portraitUrl,
  opening,
  ordinal,
  seed,
  primarySphere,
  essencePool,
  onSpendEssence,
  onComplete,
  onBondWithoutHand,
}: BondOnlyRiteProps) {
  const [outcome, setOutcome] = useState<BondOutcome | null>(null);
  const phase = useMemo(() => buildMeetingNudgePhaseModel({
    test: RITE_BOND_ONLY_TEST,
    testId: RITE_BOND_ONLY_TEST.id,
    stepIndex: BOND_ONLY_STEP_INDEX,
    essencePool,
    agentName: name,
    primarySphere,
  }), [essencePool, name, primarySphere]);

  const handleCommit = useCallback((nudgeIds: string[]) => {
    const requests = meetingSpendRequests(RITE_BOND_ONLY_TEST, nudgeIds);
    if (requests.length > 0) onSpendEssence?.(BOND_ONLY_STEP_INDEX, requests);
    setOutcome(resolveBondTest(RITE_BOND_ONLY_TEST, nudgeIds, seed));
  }, [seed, onSpendEssence]);

  const fateLine = outcome ? selectBondFateLine(outcome, name) : null;

  return (
    <RevealCard
      open
      onClose={outcome ? () => onComplete(outcome) : onBondWithoutHand}
      maxWidth={BOND_ONLY_CARD_MAX_WIDTH}
      aria-label={RITE_HEADER}
    >
      <RevealCard.Title>{RITE_HEADER.toUpperCase()}</RevealCard.Title>
      <RevealCard.Medallion title={name}>
        {portraitUrl ? (
          <img src={portraitUrl} alt={name} data-testid="threading-rite-portrait" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : undefined}
      </RevealCard.Medallion>
      <RevealCard.Banner>
        <span data-testid="threading-rite-name">{name}</span>
      </RevealCard.Banner>
      <RevealCard.Body>
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', marginBottom: 6 }}>{riteSubtitle(ordinal)}</span>
        <span data-testid="threading-rite-opening-line">{opening}</span>
      </RevealCard.Body>
      {!outcome && (
        <div style={{ width: '100%' }} data-testid="threading-rite-bond-only-hand">
          {/* Above the hand, not below it: the card's zones scroll, and the exit
              must never sit under the fold (Law 33). */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
            <BondWithoutHandButton onClick={onBondWithoutHand} />
          </div>
          <NudgePhaseShell phase={phase} portraitUrl={portraitUrl} agentName={name} onCommit={handleCommit} />
        </div>
      )}
      {outcome && (
        <RevealCard.Body>
          {fateLine?.text && (
            <span data-testid="bond-fate-line" style={{ display: 'block', fontStyle: 'italic', color: 'var(--veil-gold-text)', marginBottom: 8 }}>
              {fateLine.text}
            </span>
          )}
          <span data-testid="bond-reception-prose" data-reception={outcome.reception} style={{ color: 'var(--text-primary)' }}>
            {riteReceptionLine(name, gender, outcome.reception)}
          </span>
        </RevealCard.Body>
      )}
      {outcome && <RevealCard.Dismiss label={RITE_RETURN_LABEL} onClick={() => onComplete(outcome)} />}
    </RevealCard>
  );
}
