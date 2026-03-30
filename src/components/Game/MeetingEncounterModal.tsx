/**
 * MeetingEncounterModal — 4-step player flow for "Meet The First".
 *
 * Step 1: Seeking Threads — pick primary reach, secondary reach, sphere, select candidate
 * Step 2: Defining Moment — 2-3 dilemma scenes with player choices
 * Step 3: The Spark — reveal, god-given trait, investment
 * Step 4: Confirmation — shape or surprise, finalize
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { Modal } from '../shared/Modal';
import type { WorldGraph } from '../../engine/graph';
import type { SphereName } from '../../types/index';
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';
import type {
  MeetingEncounterState,
  MeetingCandidate,
  DilemmaInstance,
  IntentOption,
} from '../../types/meetingEncounter';
import {
  INTENT_OPTIONS,
  MEETING_STEP_ORDER,
} from '../../types/meetingEncounter';
import {
  generateCandidates,
  selectDilemmas,
  applyDilemmaChoice,
  buildMeetingResult,
  createAgentFromMeeting,
} from '../../engine/meetingEncounter';
import {
  ARCHETYPE_NAME_MAP,
  DILEMMA_TEMPLATES,
  getSparkInvestmentOptions,
  getGodGivenTraitOptions,
} from '../../data/meeting-content';
import type { MeetingEncounterResult } from '../../types/meetingEncounter';

// ─── Reach Display ────────────────────────────────────────────────

const REACH_ICONS: Record<ReachDomain, string> = {
  iron: '⚔', gold: '⚖', shadow: '🗝', veil: '✦',
  heart: '♥', eye: '◉', stone: '⛰', star: '★',
};

const SPHERE_LABELS: Record<string, string> = {
  force: 'Force', matter: 'Matter', energy: 'Energy', life: 'Life',
  mind: 'Mind', spirit: 'Spirit', time: 'Time', entropy: 'Entropy',
  chaos: 'Chaos', darkness: 'Darkness', light: 'Light', shadow: 'Shadow',
};

// ─── Props ────────────────────────────────────────────────────────

interface MeetingEncounterModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: MeetingEncounterResult) => void;
  state: MeetingEncounterState;
  onStateChange: (state: MeetingEncounterState) => void;
  graph: WorldGraph;
  ascendantId: string;
  ascendantSphere: SphereName;
  ascendantSecondSphere: SphereName;
  locationId: string;
  locationCultureId: string;
  locationSubtype: string;
  seed: number;
  tick: number;
}

// ─── Step Indicators ──────────────────────────────────────────────

const STEP_LABELS = ['Seeking Threads', 'The Defining Moment', 'The Spark', 'The Name They\'ll Carry'];

function StepIndicator({ currentStep }: { currentStep: string }) {
  const stepIdx = MEETING_STEP_ORDER.indexOf(currentStep as any);
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', justifyContent: 'center' }}>
      {STEP_LABELS.map((label, i) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
          opacity: i <= stepIdx ? 1 : 0.4,
          color: i === stepIdx ? 'var(--accent-gold)' : 'var(--text-secondary)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-display)',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < stepIdx ? 'var(--accent-gold)' : i === stepIdx ? 'var(--bg-surface)' : 'transparent',
            border: `1px solid ${i <= stepIdx ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            color: i < stepIdx ? 'var(--bg-deep)' : 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
          }}>
            {i < stepIdx ? '✓' : i + 1}
          </span>
          <span style={{ display: i === stepIdx ? 'inline' : 'none' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Seeking Threads ──────────────────────────────────────

function StepSeekingThreads({
  state, onStateChange, ascendantSphere, ascendantSecondSphere,
  locationCultureId, seed,
}: {
  state: MeetingEncounterState;
  onStateChange: (s: MeetingEncounterState) => void;
  ascendantSphere: SphereName;
  ascendantSecondSphere: SphereName;
  locationCultureId: string;
  seed: number;
}) {
  const [primaryReach, setPrimaryReach] = useState<ReachDomain | null>(state.intentPrimaryReach ?? null);
  const [secondaryReach, setSecondaryReach] = useState<ReachDomain | null>(state.intentSecondaryReach ?? null);
  const [sphere, setSphere] = useState<SphereName | null>(state.intentSphere ?? null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(state.selectedCandidateIndex ?? null);

  const candidates = useMemo(() => {
    if (!primaryReach || !secondaryReach || !sphere) return null;
    return generateCandidates(primaryReach, secondaryReach, sphere, locationCultureId, ARCHETYPE_NAME_MAP, seed);
  }, [primaryReach, secondaryReach, sphere, locationCultureId, seed]);

  const handleConfirm = useCallback(() => {
    if (!primaryReach || !secondaryReach || !sphere || selectedCandidate == null || !candidates) return;
    const dilemmas = selectDilemmas(
      DILEMMA_TEMPLATES, primaryReach, secondaryReach, sphere,
      candidates[selectedCandidate].archetypeId, '', seed,
    );
    onStateChange({
      ...state,
      currentStep: 'defining_moment',
      intentPrimaryReach: primaryReach,
      intentSecondaryReach: secondaryReach,
      intentSphere: sphere,
      candidates,
      selectedCandidateIndex: selectedCandidate,
      dilemmas,
      currentDilemmaIndex: 0,
    });
  }, [primaryReach, secondaryReach, sphere, selectedCandidate, candidates, state, onStateChange, seed]);

  const sphereOptions: SphereName[] = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

  return (
    <>
      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-3)' }}>
        You reach into the web of fate, feeling for threads of destiny. What kind of champion do you seek?
      </p>

      {/* Primary Reach */}
      <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
        Primary Path
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
        {INTENT_OPTIONS.map(opt => (
          <button key={opt.reach} onClick={() => { setPrimaryReach(opt.reach); if (opt.reach === secondaryReach) setSecondaryReach(null); setSelectedCandidate(null); }}
            title={opt.text}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              background: primaryReach === opt.reach ? 'var(--accent-gold)' : 'var(--bg-surface)',
              color: primaryReach === opt.reach ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${primaryReach === opt.reach ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              fontSize: 'var(--text-xs)',
              opacity: secondaryReach === opt.reach ? 0.3 : 1,
            }}
            disabled={secondaryReach === opt.reach}
          >
            {REACH_ICONS[opt.reach]} {opt.label}
          </button>
        ))}
      </div>

      {/* Secondary Reach */}
      {primaryReach && (
        <>
          <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Secondary Path
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
            {REACH_DOMAINS.filter(r => r !== primaryReach).map(reach => (
              <button key={reach} onClick={() => { setSecondaryReach(reach); setSelectedCandidate(null); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  background: secondaryReach === reach ? 'var(--accent-gold)' : 'var(--bg-surface)',
                  color: secondaryReach === reach ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: `1px solid ${secondaryReach === reach ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  fontSize: 'var(--text-xs)',
                }}
              >
                {REACH_ICONS[reach]} {reach.charAt(0).toUpperCase() + reach.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Sphere */}
      {primaryReach && secondaryReach && (
        <>
          <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Domain
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
            {sphereOptions.map(s => (
              <button key={s} onClick={() => { setSphere(s); setSelectedCandidate(null); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  background: sphere === s ? 'var(--accent-gold)' : 'var(--bg-surface)',
                  color: sphere === s ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: `1px solid ${sphere === s ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  fontSize: 'var(--text-xs)',
                }}
              >
                {SPHERE_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Candidates */}
      {candidates && (
        <>
          <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-2)' }}>
            Three threads shimmer before you...
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            {candidates.map((c, i) => (
              <button key={c.tempId} onClick={() => setSelectedCandidate(i)}
                style={{
                  textAlign: 'left', padding: 'var(--space-2)', borderRadius: 8, cursor: 'pointer',
                  background: selectedCandidate === i ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedCandidate === i ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>
                  {c.name}
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)' }}>
                    {ARCHETYPE_NAME_MAP[c.archetypeId] ?? c.archetypeId}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                  {c.personalityHints.join(' · ')}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Confirm */}
      {selectedCandidate != null && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleConfirm} style={{
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            background: 'var(--accent-gold)', color: 'var(--bg-deep)',
            border: 'none', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
          }}>
            Weave the Thread
          </button>
        </div>
      )}
    </>
  );
}

// ─── Step 2: Defining Moment ──────────────────────────────────────

function StepDefiningMoment({
  state, onStateChange,
}: {
  state: MeetingEncounterState;
  onStateChange: (s: MeetingEncounterState) => void;
}) {
  const dilemmaIdx = state.currentDilemmaIndex ?? 0;
  const dilemma = state.dilemmas?.[dilemmaIdx];

  if (!dilemma) return null;

  const handleChoice = (choiceId: string) => {
    const record = applyDilemmaChoice(state, dilemmaIdx, choiceId);
    if (!record) return;

    const newRecords = [...(state.dilemmaChoiceRecords ?? []), record];
    const nextIdx = dilemmaIdx + 1;
    const hasMore = state.dilemmas && nextIdx < state.dilemmas.length;

    onStateChange({
      ...state,
      dilemmaChoiceRecords: newRecords,
      currentDilemmaIndex: hasMore ? nextIdx : dilemmaIdx,
      currentStep: hasMore ? 'defining_moment' : 'the_spark',
      accumulatedGateTags: [
        ...(state.accumulatedGateTags ?? []),
        ...record.gateTags,
      ],
      accumulatedTraitSeeds: [
        ...(state.accumulatedTraitSeeds ?? []),
        ...(record.traitSeeds ?? []),
      ],
    });
  };

  return (
    <>
      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>
        Dilemma {dilemmaIdx + 1} of {state.dilemmas?.length ?? 0}
      </div>
      <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 'var(--space-2)' }}>
        {dilemma.setup}
      </p>
      <p style={{ color: 'var(--accent-gold)', fontStyle: 'italic', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
        {dilemma.godVoice}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {dilemma.choices.map(choice => (
          <button key={choice.id} onClick={() => handleChoice(choice.id)}
            style={{
              textAlign: 'left', padding: 'var(--space-2)', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', marginBottom: 2 }}>
              {choice.text}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
              {choice.godAction}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Step 3: The Spark ────────────────────────────────────────────

function StepSpark({
  state, onStateChange,
}: {
  state: MeetingEncounterState;
  onStateChange: (s: MeetingEncounterState) => void;
}) {
  const candidate = state.candidates?.[state.selectedCandidateIndex ?? 0];
  if (!candidate) return null;

  const traitOptions = getGodGivenTraitOptions(candidate.primaryReach, candidate.secondaryReach);
  const investOptions = getSparkInvestmentOptions(
    candidate.primaryReach,
    candidate.secondaryReach,
    REACH_DOMAINS.find(r => r !== candidate.primaryReach && r !== candidate.secondaryReach) ?? 'eye',
  );

  const [selectedTrait, setSelectedTrait] = useState<string | null>(state.sparkTraitId ?? null);
  const [selectedInvest, setSelectedInvest] = useState<string | null>(state.investmentChoiceId ?? null);

  const handleConfirm = () => {
    if (!selectedTrait || !selectedInvest) return;
    onStateChange({
      ...state,
      currentStep: 'confirmation',
      sparkTraitId: selectedTrait,
      investmentChoiceId: selectedInvest,
    });
  };

  // Derive personality description from accumulated choices
  const traits = [...(state.accumulatedTraitSeeds ?? [])];

  return (
    <>
      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 'var(--space-2)' }}>
        The crucible is complete. {candidate.name} has changed — something in them has hardened, or softened, or simply shifted.
      </p>

      {traits.length > 0 && (
        <div style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-2)', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 4 }}>Forged traits</div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
            {traits.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' · ')}
          </div>
        </div>
      )}

      {/* God-given trait */}
      <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
        Bestow a divine gift
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
        {traitOptions.map(t => (
          <button key={t.id} onClick={() => setSelectedTrait(t.id)}
            style={{
              textAlign: 'left', padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              background: selectedTrait === t.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
              border: `1px solid ${selectedTrait === t.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            }}
          >
            <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{t.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: 8 }}>{t.description}</span>
          </button>
        ))}
      </div>

      {/* Investment */}
      <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
        Steer their path
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
        {investOptions.map(opt => (
          <button key={opt.id} onClick={() => setSelectedInvest(opt.id)}
            style={{
              textAlign: 'left', padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              background: selectedInvest === opt.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
              border: `1px solid ${selectedInvest === opt.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            }}
          >
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>{opt.text}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: 8 }}>
              {REACH_ICONS[opt.reach]} {opt.reach.charAt(0).toUpperCase() + opt.reach.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {selectedTrait && selectedInvest && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleConfirm} style={{
            padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
            background: 'var(--accent-gold)', color: 'var(--bg-deep)',
            border: 'none', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
          }}>
            Ignite the Spark
          </button>
        </div>
      )}
    </>
  );
}

// ─── Step 4: Confirmation ─────────────────────────────────────────

function StepConfirmation({
  state, onStateChange, onComplete, ascendantSphere,
}: {
  state: MeetingEncounterState;
  onStateChange: (s: MeetingEncounterState) => void;
  onComplete: (result: MeetingEncounterResult) => void;
  ascendantSphere: SphereName;
}) {
  const candidate = state.candidates?.[state.selectedCandidateIndex ?? 0];
  if (!candidate) return null;

  const [mode, setMode] = useState<'choose' | 'shape' | 'surprise'>(state.shapePath ?? 'choose');
  const [editedName, setEditedName] = useState(state.editedName ?? candidate.name);

  const handleFinish = (path: 'shape' | 'surprise') => {
    const updated: MeetingEncounterState = {
      ...state,
      shapePath: path,
      editedName: path === 'shape' ? editedName : undefined,
    };
    const result = buildMeetingResult(updated, ascendantSphere);
    if (result) {
      onComplete(result);
    }
  };

  const archName = ARCHETYPE_NAME_MAP[candidate.archetypeId] ?? candidate.archetypeId;

  return (
    <>
      {mode === 'choose' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
              {candidate.name}
            </div>
            <div style={{ color: 'var(--accent-gold)', fontSize: 'var(--text-sm)' }}>
              {archName}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
              {candidate.personalityHints.join(' · ')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
            <button onClick={() => setMode('shape')} style={{
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
            }}>
              Shape Them
            </button>
            <button onClick={() => handleFinish('surprise')} style={{
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--accent-gold)', border: 'none',
              color: 'var(--bg-deep)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
            }}>
              Accept Fate
            </button>
          </div>
        </>
      )}

      {mode === 'shape' && (
        <>
          <label style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Name
          </label>
          <input
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-3)', boxSizing: 'border-box',
            }}
          />

          <div style={{ padding: 'var(--space-2)', background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 'var(--space-3)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 4 }}>Archetype</div>
            <div style={{ color: 'var(--text-primary)' }}>{archName}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 8, marginBottom: 4 }}>Personality</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {candidate.personalityHints.join(' · ')}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button onClick={() => setMode('choose')} style={{
              padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
            }}>
              Back
            </button>
            <button onClick={() => handleFinish('shape')} style={{
              padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
              background: 'var(--accent-gold)', border: 'none',
              color: 'var(--bg-deep)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
            }}>
              Weave Their Destiny
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────

export const MeetingEncounterModal = memo(function MeetingEncounterModal({
  open, onClose, onComplete, state, onStateChange,
  graph, ascendantId, ascendantSphere, ascendantSecondSphere,
  locationId, locationCultureId, locationSubtype, seed, tick,
}: MeetingEncounterModalProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      <Modal.Header onClose={onClose}>Meet The First</Modal.Header>
      <Modal.Body>
        <StepIndicator currentStep={state.currentStep} />
        {state.currentStep === 'seeking_threads' && (
          <StepSeekingThreads
            state={state}
            onStateChange={onStateChange}
            ascendantSphere={ascendantSphere}
            ascendantSecondSphere={ascendantSecondSphere}
            locationCultureId={locationCultureId}
            seed={seed}
          />
        )}
        {state.currentStep === 'defining_moment' && (
          <StepDefiningMoment state={state} onStateChange={onStateChange} />
        )}
        {state.currentStep === 'the_spark' && (
          <StepSpark state={state} onStateChange={onStateChange} />
        )}
        {state.currentStep === 'confirmation' && (
          <StepConfirmation
            state={state}
            onStateChange={onStateChange}
            onComplete={onComplete}
            ascendantSphere={ascendantSphere}
          />
        )}
      </Modal.Body>
    </Modal>
  );
});
