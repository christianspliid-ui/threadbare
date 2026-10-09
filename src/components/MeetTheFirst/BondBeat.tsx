import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BondOutcome, BondTest, NarrativeCandidate, SparkVision } from '../../types/meetingEncounter';
import { BOND_PROSE, BOND_PROSE_FALLBACK, BOND_RELEASE_TEXT, MEETING_FATE_REVEAL_CONTINUE } from '../../data/meeting-narrative-prose';
import { getSphereColor } from '../../data/sphereIcons';
import type { SphereName } from '../../types/graph';
import { NudgePhaseShell } from '../Game/encounter-stage/shells/NudgePhaseShell';
import { buildMeetingNudgePhaseModel, meetingSpendRequests } from './buildMeetingNudgePhaseModel';
import type { NudgeSpendRequest } from '../Game/encounter-stage/nudgeCommit';
import { resolveBondTest } from '../../engine/meetingEncounter';
import { selectBondFateLine } from '../../engine/meetingFateLine';
import { toHungerId } from '../../types/hunger';
import type { StoredHungerId } from '../../types/hunger';
import { MEETING_FORMATIVE_TEST_COUNT } from '../../data/meeting-nudge-constants';

interface BondBeatProps {
  candidate: NarrativeCandidate;
  /**
   * The spark vision the naming stage shows. Absent in the threading rite's
   * no-vision mode (THR-1754), which ends at the reveal and never reaches naming.
   */
  vision?: SparkVision;
  hungerId: StoredHungerId;
  primarySphere: SphereName;
  /**
   * The bond test. Absent ⇒ the beat plays exactly as it did before THR-868
   * (staggered reveal straight into naming), which is the fail-soft path.
   */
  bondTest?: BondTest;
  essencePool?: Readonly<Record<string, number>>;
  seed?: number;
  /** THR-1706 — charge the bond test's hand; see `FormativeTestBeat.onSpendEssence`. */
  onSpendEssence?: (testIndex: number, requests: NudgeSpendRequest[]) => void;
  onComplete: (editedName: string | undefined, bondOutcome?: BondOutcome) => void;
  /**
   * THR-1754 — the threading rite's mode: the beat ends at fate's answer. The
   * reveal's continue calls `onComplete(undefined, outcome)`; there is no naming
   * stage, because the mortal already has a name and a life.
   */
  skipNaming?: boolean;
  /** Replaces the reception's authored prose on the reveal (the rite's own result line). */
  receptionLineFor?: (outcome: BondOutcome) => string;
  /** Rendered under the reception on the reveal (the rite's First and mark lines). */
  revealFooter?: React.ReactNode;
  /** The reveal's continue label. Default: the meeting's. */
  continueLabel?: string;
  /** Called once the bond has rolled — the rite hides its no-hand exit then (THR-1754). */
  onRevealed?: (outcome: BondOutcome) => void;
}

const SCENE_BG = '#0a0a0f';
const GOLD = '#d4af37';
const FONT_PROSE = 'var(--font-prose)';

/** The bond test is the last test of the run — it follows the formative ones. */
const BOND_STEP_INDEX = MEETING_FORMATIVE_TEST_COUNT;

/**
 * `test` — the god reaches, the player leans, fate decides how it lands.
 * `reveal` — the reception's prose.
 * `bond` — the original naming + release sequence.
 */
type BondStage = 'test' | 'reveal' | 'bond';

export function BondBeat({
  candidate,
  vision,
  hungerId,
  primarySphere,
  bondTest,
  essencePool,
  seed = 0,
  onSpendEssence,
  onComplete,
  skipNaming = false,
  receptionLineFor,
  revealFooter,
  continueLabel,
  onRevealed,
}: BondBeatProps) {
  const [stage, setStage] = useState<BondStage>(bondTest ? 'test' : 'bond');
  const [outcome, setOutcome] = useState<BondOutcome | null>(null);
  const [phase, setPhase] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(candidate.name);

  const sphereColor = getSphereColor(primarySphere);
  const bondProse = BOND_PROSE[hungerId] ?? BOND_PROSE_FALLBACK;

  const testPhase = useMemo(
    () =>
      bondTest
        ? buildMeetingNudgePhaseModel({
            test: bondTest,
            testId: bondTest.id,
            stepIndex: BOND_STEP_INDEX,
            essencePool,
            agentName: candidate.name,
            primarySphere,
          })
        : undefined,
    [bondTest, essencePool, candidate.name, primarySphere],
  );

  const handleCommit = useCallback(
    (nudgeIds: string[]) => {
      if (!bondTest) return;
      const requests = meetingSpendRequests(bondTest, nudgeIds);
      if (requests.length > 0) onSpendEssence?.(BOND_STEP_INDEX, requests);
      const resolved = resolveBondTest(bondTest, nudgeIds, seed);
      setOutcome(resolved);
      setStage('reveal');
      onRevealed?.(resolved);
    },
    [bondTest, seed, onSpendEssence, onRevealed],
  );

  // Staggered reveal — starts only once the naming stage is reached, so the
  // release button cannot appear underneath an unresolved bond test.
  useEffect(() => {
    if (stage !== 'bond') return;
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Image appears
      setTimeout(() => setPhase(2), 1500),  // Bond prose
      setTimeout(() => setPhase(3), 3000),  // Name + epithet
      setTimeout(() => setPhase(4), 4000),  // Release button
    ];
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  // ── The bond test ──────────────────────────────────────────────
  if (stage === 'test' && bondTest && testPhase) {
    // THR-891 — `hungerId` is stored dotted (`hunger.witness`) and `BOND_PROSE`
    // above is keyed that way, but `godVoiceByHunger` is keyed bare. Indexing it
    // with the dotted id missed every time, so the authored per-hunger voice
    // never surfaced and every god got the fallback. Narrow before the lookup.
    const godVoice =
      bondTest.godVoiceByHunger[toHungerId(hungerId) ?? ''] ?? bondTest.godVoiceFallback;
    return (
      <div
        className="h-screen flex flex-col items-center justify-center overflow-y-auto"
        style={{ background: SCENE_BG }}
        data-testid="bond-test-stage"
      >
        <div style={{ maxWidth: 900, padding: '4vh 6vw' }}>
          {/* Persistent candidate portrait — the Sensing likeness, carried
              through every beat (verdict 12a: the only human likeness shown). */}
          <div
            style={{
              width: 'min(200px, 16vw)',
              aspectRatio: '3/4',
              backgroundImage: `url(${candidate.imageAssetPath}), ${candidate.placeholderGradient}`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 92%)',
              marginBottom: '2vh',
            }}
          />
          <p
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
              color: 'rgba(212,168,122,0.7)',
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            {godVoice}
          </p>
          <p
            style={{
              fontFamily: FONT_PROSE,
              fontSize: '1rem',
              color: 'rgba(200,190,170,0.85)',
              lineHeight: 1.7,
            }}
          >
            {bondTest.setup}
          </p>
          {/* THR-1732 — the shell's hand bar is `position: sticky` against this
              beat's scrolling column; no ancestor between here and that column
              may set `overflow`, or the commit falls back below the fold. */}
          <NudgePhaseShell
            phase={testPhase}
            portraitUrl={candidate.imageAssetPath}
            agentName={candidate.name}
            onCommit={handleCommit}
          />
        </div>
      </div>
    );
  }

  // ── Fate's answer ──────────────────────────────────────────────
  if (stage === 'reveal' && outcome) {
    // THR-1714 — what the hand made the odds, and what fate did with it.
    const fateLine = selectBondFateLine(outcome, candidate.name);
    return (
      <div
        className="h-screen flex flex-col items-center justify-center"
        style={{ background: SCENE_BG }}
        data-testid="bond-reveal-stage"
      >
        <div style={{ maxWidth: 640, textAlign: 'center', padding: '0 6vw' }}>
          {fateLine.text && (
            <p
              data-testid="bond-fate-line"
              data-fate-key={fateLine.key}
              style={{
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: '1rem',
                color: 'var(--veil-gold-text)',
                lineHeight: 1.6,
                marginBottom: '2vh',
              }}
            >
              {fateLine.text}
            </p>
          )}
          <p
            data-testid="bond-reception-prose"
            data-reception={outcome.reception}
            data-band={outcome.band}
            style={{
              fontFamily: FONT_PROSE,
              fontSize: '1.15rem',
              color: `${sphereColor}cc`,
              lineHeight: 1.75,
              marginBottom: '4vh',
            }}
          >
            {receptionLineFor ? receptionLineFor(outcome) : outcome.prose}
          </p>
          {revealFooter}
          <button
            type="button"
            data-testid="bond-reveal-continue"
            onClick={() => (skipNaming ? onComplete(undefined, outcome) : setStage('bond'))}
            style={{
              padding: '10px 22px',
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
            {continueLabel ?? MEETING_FATE_REVEAL_CONTINUE}
          </button>
        </div>
      </div>
    );
  }

  // No-vision mode has no naming stage to fall into (fail-soft: a missing vision
  // never renders an empty portrait).
  if (!vision) return null;

  const lineStyle = (minPhase: number): React.CSSProperties => ({
    opacity: phase >= minPhase ? 1 : 0,
    transform: phase >= minPhase ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 1s ease, transform 1s ease',
  });

  return (
    <div
      className="h-screen flex flex-col items-center justify-center"
      style={{ background: SCENE_BG }}
    >
      {/* Vision portrait — fades in */}
      <div
        style={{
          width: 'min(420px, 32vw)',
          aspectRatio: '3/4',
          backgroundImage: `url(${vision.portraitAssetPath}), ${vision.portraitPlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          ...lineStyle(1),
          marginBottom: '3vh',
        }}
      />

      {/* Bond prose */}
      <p
        style={{
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: '1.2rem',
          color: `${sphereColor}99`,
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: '600px',
          lineHeight: 1.7,
          ...lineStyle(2),
          marginBottom: '3vh',
        }}
      >
        {bondProse}
      </p>

      {/* Name + epithet */}
      <div style={{ ...lineStyle(3), textAlign: 'center' }}>
        {editingName ? (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
            autoFocus
            className="focus-ring"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${sphereColor}40`,
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              textAlign: 'center',
              width: '400px',
            }}
          />
        ) : (
          <h2
            onClick={() => setEditingName(true)}
            className="cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
            title="Click to edit name"
          >
            {name}
          </h2>
        )}
        <p
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: 'rgba(200,190,170,0.6)',
            letterSpacing: '0.04em',
          }}
        >
          {candidate.epithet}
        </p>
      </div>

      {/* Release button */}
      <button
        type="button"
        onClick={() => onComplete(name !== candidate.name ? name : undefined, outcome ?? undefined)}
        data-testid="bond-release"
        style={{
          ...lineStyle(4),
          marginTop: '4vh',
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: '1rem',
          color: `${sphereColor}88`,
          background: 'transparent',
          border: `1px solid ${sphereColor}20`,
          padding: '12px 32px',
          borderRadius: '4px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${sphereColor}40`;
          e.currentTarget.style.color = `${sphereColor}cc`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${sphereColor}20`;
          e.currentTarget.style.color = `${sphereColor}88`;
        }}
      >
        {BOND_RELEASE_TEXT}
      </button>
    </div>
  );
}
