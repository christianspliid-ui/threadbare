import { useState, useCallback, useEffect } from 'react';
import type { NarrativeCandidate } from '../../types/meetingEncounter';
import type { DilemmaInstance, DilemmaChoiceRecord } from '../../types/meetingEncounter';
import { ComicPanel } from './ComicPanel';
import { selectDilemmaScene } from '../../data/meeting-art-library';
import { TESTING_TRANSITION_IN, TESTING_BETWEEN_DILEMMAS } from '../../data/meeting-narrative-prose';

interface TestingBeatProps {
  candidate: NarrativeCandidate;
  dilemmas: DilemmaInstance[];
  locationName: string;
  godVoiceOverride?: string;
  onComplete: (choices: DilemmaChoiceRecord[]) => void;
}

const SCENE_BG = '#0a0a0f';

/** Replace {agent.name} and {agent.location} placeholders with actual values. */
function fillProse(text: string, name: string, location: string): string {
  return text.replace(/\{agent\.name\}/g, name).replace(/\{agent\.location\}/g, location);
}

export function TestingBeat({ candidate, dilemmas, locationName, godVoiceOverride, onComplete }: TestingBeatProps) {
  const [currentDilemmaIdx, setCurrentDilemmaIdx] = useState(-1); // -1 = transition in
  const [choices, setChoices] = useState<DilemmaChoiceRecord[]>([]);
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');

  // Transition in
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentDilemmaIdx(0);
      setFadeState('visible');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleChoice = useCallback((choiceId: string) => {
    const dilemma = dilemmas[currentDilemmaIdx];
    if (!dilemma) return;

    const choice = dilemma.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const record: DilemmaChoiceRecord = {
      dilemmaId: dilemma.templateId,
      category: dilemma.category,
      choiceId,
      gateTags: choice.gateTags,
      axiologicalShifts: choice.axiologicalShifts,
      reachChanges: choice.reachChanges,
      traitSeeds: choice.traitSeeds,
    };

    const newChoices = [...choices, record];
    setChoices(newChoices);

    if (currentDilemmaIdx < dilemmas.length - 1) {
      // Transition to next dilemma
      setFadeState('out');
      setTimeout(() => {
        setCurrentDilemmaIdx(prev => prev + 1);
        setFadeState('visible');
      }, 1200);
    } else {
      // All dilemmas complete
      setFadeState('out');
      setTimeout(() => onComplete(newChoices), 1000);
    }
  }, [currentDilemmaIdx, dilemmas, choices, onComplete]);

  const currentDilemma = currentDilemmaIdx >= 0 ? dilemmas[currentDilemmaIdx] : null;

  // Select scene art based on dilemma emotional tags
  const sceneAsset = currentDilemma
    ? selectDilemmaScene(
        (currentDilemma as any).resonance?.emotionalRegister ?? [],
        currentDilemmaIdx,
      )
    : null;

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Transition-in text */}
      {currentDilemmaIdx === -1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.3rem',
              color: 'rgba(200,180,140,0.6)',
              letterSpacing: '0.06em',
              opacity: 1,
              transition: 'opacity 1s ease',
            }}
          >
            {TESTING_TRANSITION_IN}
          </p>
        </div>
      )}

      {/* Dilemma scene */}
      {currentDilemma && (
        <div
          className="absolute inset-0"
          style={{
            opacity: fadeState === 'visible' ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          <ComicPanel
            sceneImagePath={sceneAsset?.path ?? ''}
            scenePlaceholder={sceneAsset?.placeholderGradient ?? 'linear-gradient(135deg, #0a0a0f, #1a1a1a)'}
            characterImagePath={candidate.imageAssetPath}
            characterPlaceholder={candidate.placeholderGradient}
            characterPosition={currentDilemmaIdx % 2 === 0 ? 'left' : 'right'}
          >
            {/* Prose area */}
            <div className="pb-8" style={{
              paddingLeft: currentDilemmaIdx % 2 === 0 ? '38vw' : '8vw',
              paddingRight: currentDilemmaIdx % 2 === 0 ? '8vw' : '38vw',
            }}>
              {/* God voice */}
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  color: 'rgba(212,168,122,0.7)',
                  marginBottom: '12px',
                  lineHeight: 1.6,
                }}
              >
                {fillProse(godVoiceOverride ?? currentDilemma.godVoice, candidate.name, locationName)}
              </p>

              {/* Setup prose */}
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1rem',
                  color: 'rgba(200,190,170,0.85)',
                  marginBottom: '24px',
                  lineHeight: 1.7,
                }}
              >
                {fillProse(currentDilemma.setup, candidate.name, locationName)}
              </p>

              {/* Choices as prose fragments */}
              <div className="flex flex-col gap-3">
                {currentDilemma.choices.map(choice => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChoice(choice.id)}
                    data-testid={`dilemma-choice-${choice.id}`}
                    className="text-left cursor-pointer transition-all duration-300"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '0.95rem',
                      color: 'rgba(180,170,160,0.7)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      lineHeight: 1.6,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'rgba(212,168,122,0.9)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(212,168,122,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'rgba(180,170,160,0.7)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {fillProse(choice.text, candidate.name, locationName)}
                  </button>
                ))}
              </div>
            </div>
          </ComicPanel>

          {/* Dilemma counter */}
          <div
            className="absolute top-6 right-8"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '0.75rem',
              color: 'rgba(160,140,180,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            {currentDilemmaIdx + 1} of {dilemmas.length}
          </div>
        </div>
      )}

      {/* Between-dilemma transition text */}
      {fadeState === 'out' && currentDilemmaIdx < dilemmas.length - 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.2rem',
              color: 'rgba(200,180,140,0.5)',
              letterSpacing: '0.06em',
            }}
          >
            {TESTING_BETWEEN_DILEMMAS}
          </p>
        </div>
      )}
    </div>
  );
}
