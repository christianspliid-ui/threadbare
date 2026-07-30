/**
 * FormativeTestBeat — THR-868 (WS6 UI).
 *
 * The testing beat, converted to the nudge model. The player no longer picks
 * which way the mortal goes; they lean the odds with a hand of cards and fate
 * settles the band, which writes the pole.
 *
 * Hosts the WS2 `NudgePhaseShell` **whole** inside the meeting's cinematic
 * `ComicPanel` wrapper (plan § UI pillar item 1 — no fork). The shell owns the
 * test panel, the hand, the live forecast word, and the commit; this component
 * owns the cinematic frame, the god-voice line, the fate reveal, and sequencing
 * across the run's formative tests.
 *
 * Per-test flow: setup + hand → commit → fate reveal (the band's authored
 * prose) → next test. The reveal is a beat of its own because the whole point
 * of the model is that committing is not choosing: the player has to see fate
 * answer before the next moment starts.
 *
 * Plan: `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md`
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  DilemmaInstance,
  FormativeOutcome,
  FormativeTest,
  NarrativeCandidate,
} from '../../types/meetingEncounter';
import { ComicPanel } from './ComicPanel';
import { NudgePhaseShell } from '../Game/encounter-stage/shells/NudgePhaseShell';
import { buildMeetingNudgePhaseModel } from './buildMeetingNudgePhaseModel';
import { resolveFormativeTest } from '../../engine/meetingEncounter';
import { selectDilemmaScene } from '../../data/meeting-art-library';
import {
  MEETING_FATE_REVEAL_CONTINUE,
  TESTING_TRANSITION_IN,
} from '../../data/meeting-narrative-prose';

const SCENE_BG = '#0a0a0f';
const GOLD = '#d4af37';
const FONT_PROSE = 'Georgia, "Times New Roman", serif';

/** Milliseconds the opening line holds before the first test appears. */
const TRANSITION_IN_MS = 1500;

/** A converted dilemma — the instance plus the test that made it convertible. */
export interface ConvertedTest {
  instance: DilemmaInstance;
  test: FormativeTest;
}

export interface FormativeTestBeatProps {
  candidate: NarrativeCandidate;
  /** Converted tests, in order. Never empty — the caller branches on that. */
  tests: readonly ConvertedTest[];
  locationName: string;
  /** Ascendant's essence pool. Absent ⇒ priced cards dim with their reason. */
  essencePool?: Readonly<Record<string, number>>;
  /** Base seed; each test derives its own stream from `seed + testIndex`. */
  seed: number;
  godVoiceOverride?: string;
  onComplete: (outcomes: FormativeOutcome[]) => void;
}

/** Replace {agent.name} and {agent.location} placeholders with actual values. */
function fillProse(text: string, name: string, location: string): string {
  return text.replace(/\{agent\.name\}/g, name).replace(/\{agent\.location\}/g, location);
}

export function FormativeTestBeat({
  candidate,
  tests,
  locationName,
  essencePool,
  seed,
  godVoiceOverride,
  onComplete,
}: FormativeTestBeatProps) {
  // -1 is the transition-in line; `revealed` holds the resolved outcome whose
  // prose is on screen, which is what distinguishes "deciding" from "watching".
  const [index, setIndex] = useState(-1);
  const [revealed, setRevealed] = useState<FormativeOutcome | null>(null);
  const [outcomes, setOutcomes] = useState<FormativeOutcome[]>([]);

  // Runs once on mount; the cleanup covers an unmount mid-transition.
  useEffect(() => {
    const timer = setTimeout(() => setIndex(0), TRANSITION_IN_MS);
    return () => clearTimeout(timer);
  }, []);

  const current = index >= 0 ? tests[index] : undefined;

  // Rebuilt per test rather than memoized across them: the essence pool moves
  // as the player spends, and a stale phase model would keep offering cards
  // they can no longer afford.
  const phase = useMemo(
    () =>
      current
        ? buildMeetingNudgePhaseModel({
            test: current.test,
            testId: current.instance.templateId,
            stepIndex: index,
            essencePool,
            agentName: candidate.name,
            locationName,
          })
        : undefined,
    [current, index, essencePool, candidate.name, locationName],
  );

  const handleCommit = useCallback(
    (nudgeIds: string[]) => {
      if (!current) return;
      const outcome = resolveFormativeTest(
        current.test,
        index,
        current.instance.templateId,
        nudgeIds,
        seed + index,
      );
      setRevealed(outcome);
    },
    [current, index, seed],
  );

  const handleAdvance = useCallback(() => {
    if (!revealed) return;
    const next = [...outcomes, revealed];
    setOutcomes(next);
    setRevealed(null);
    if (index < tests.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onComplete(next);
    }
  }, [revealed, outcomes, index, tests.length, onComplete]);

  const sceneAsset = current
    ? selectDilemmaScene(
        (current.instance as { resonance?: { emotionalRegister?: string[] } }).resonance
          ?.emotionalRegister ?? [],
        index,
      )
    : null;

  const characterPosition = index % 2 === 0 ? 'left' : 'right';

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {index === -1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '1.3rem',
              color: 'rgba(200,180,140,0.6)',
              letterSpacing: '0.06em',
            }}
          >
            {TESTING_TRANSITION_IN}
          </p>
        </div>
      )}

      {current && phase && (
        <div className="absolute inset-0" data-testid="formative-test-beat">
          <ComicPanel
            sceneImagePath={sceneAsset?.path ?? ''}
            scenePlaceholder={
              sceneAsset?.placeholderGradient ?? 'linear-gradient(135deg, #0a0a0f, #1a1a1a)'
            }
            characterImagePath={candidate.imageAssetPath}
            characterPlaceholder={candidate.placeholderGradient}
            characterPosition={characterPosition}
          >
            <div
              className="pb-8 overflow-y-auto"
              style={{
                paddingLeft: characterPosition === 'left' ? '38vw' : '8vw',
                paddingRight: characterPosition === 'left' ? '8vw' : '38vw',
                maxHeight: '78vh',
              }}
            >
              {/* God voice — diegetic framing only (verdict 10: no UI tutorials). */}
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
                {fillProse(
                  godVoiceOverride ?? current.instance.godVoice,
                  candidate.name,
                  locationName,
                )}
              </p>

              <p
                style={{
                  fontFamily: FONT_PROSE,
                  fontSize: '1rem',
                  color: 'rgba(200,190,170,0.85)',
                  marginBottom: 8,
                  lineHeight: 1.7,
                }}
              >
                {fillProse(current.instance.setup, candidate.name, locationName)}
              </p>

              {/* ── Deciding: the WS2 shell, consumed whole ── */}
              {!revealed && (
                <NudgePhaseShell
                  phase={phase}
                  portraitUrl={candidate.imageAssetPath}
                  agentName={candidate.name}
                  onCommit={handleCommit}
                />
              )}

              {/* ── Watching: fate's answer ── */}
              {revealed && (
                <div data-testid="formative-fate-reveal" style={{ marginTop: 24 }}>
                  <p
                    data-testid="formative-fate-prose"
                    data-band={revealed.band}
                    data-written-pole={revealed.writtenPole}
                    style={{
                      fontFamily: FONT_PROSE,
                      fontSize: '1.05rem',
                      color: 'rgba(212,196,158,0.92)',
                      lineHeight: 1.75,
                      marginBottom: 22,
                    }}
                  >
                    {fillProse(revealed.prose, candidate.name, locationName)}
                  </p>
                  <button
                    type="button"
                    data-testid="formative-fate-continue"
                    onClick={handleAdvance}
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
                    {MEETING_FATE_REVEAL_CONTINUE}
                  </button>
                </div>
              )}
            </div>
          </ComicPanel>

          <div
            className="absolute top-6 right-8"
            style={{
              fontFamily: FONT_PROSE,
              fontSize: 'var(--text-xs)',
              color: 'rgba(160,140,180,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            {index + 1} of {tests.length}
          </div>
        </div>
      )}
    </div>
  );
}
