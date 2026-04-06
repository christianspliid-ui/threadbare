import { useState, useCallback } from 'react';
import type { HungerDefinition, RemembranceFragment } from '../../types/remembrance';
import { selectHungerProse } from '../../engine/remembrance';
import { getSphereColor } from '../../data/sphereIcons';

interface TransformationBeatProps {
  hungers: HungerDefinition[];
  driveFragment: RemembranceFragment;
  onSelect: (hunger: HungerDefinition, courtType: string) => void;
}

type TransformationStep = 'hunger' | 'court' | 'sphere-reveal';

export function TransformationBeat({ hungers, driveFragment, onSelect }: TransformationBeatProps) {
  const [step, setStep] = useState<TransformationStep>('hunger');
  const [selectedHunger, setSelectedHunger] = useState<HungerDefinition | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const handleHungerSelect = useCallback((hunger: HungerDefinition) => {
    setSelectedHunger(hunger);
    setSelectedCourt(hunger.courtOptions.find(c => c.isDefault)!.courtType);
    setTimeout(() => setStep('court'), 600);
  }, []);

  const handleCourtConfirm = useCallback(() => {
    setStep('sphere-reveal');
    setRevealing(true);
    setTimeout(() => {
      if (selectedHunger && selectedCourt) {
        onSelect(selectedHunger, selectedCourt);
      }
    }, 2000);
  }, [selectedHunger, selectedCourt, onSelect]);

  const primaryColor = selectedHunger
    ? getSphereColor(selectedHunger.sphereAlignment.primary)
    : '#c9b8f0';

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>

      {step === 'hunger' && (
        <>
          <p className="text-lg italic mb-4" style={{ color: '#c4b49b' }}>
            And then the power found you. Or you found it.
          </p>
          <p className="text-sm italic mb-10" style={{ color: '#9a8a6a' }}>
            It does not matter which. It was hungry. So were you.
          </p>
          <div className="flex flex-col gap-4 max-w-2xl w-full">
            {hungers.map(hunger => {
              const prose = selectHungerProse(hunger, driveFragment);
              return (
                <button
                  key={hunger.id}
                  type="button"
                  onClick={() => handleHungerSelect(hunger)}
                  data-testid={`hunger-${hunger.id}`}
                  className="w-full text-left rounded-xl p-6 transition-all duration-300 cursor-pointer"
                  style={{
                    background: selectedHunger?.id === hunger.id
                      ? `linear-gradient(135deg, ${primaryColor}18, transparent)`
                      : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selectedHunger?.id === hunger.id ? '#8a7a4a' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex gap-4 items-start">
                    <div
                      className="w-20 h-20 rounded-lg flex-shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${hunger.imageAssetPath})`,
                        background: 'linear-gradient(135deg, rgba(180,160,100,0.15), rgba(100,80,50,0.1))',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    />
                    <p className="text-sm leading-relaxed italic" style={{ color: '#d4c48a' }}>
                      {prose}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 'court' && selectedHunger && (
        <>
          <p className="text-lg italic mb-10" style={{ color: '#b4b48a' }}>
            The power settles into a pattern...
          </p>
          <div className="flex flex-col gap-4 max-w-lg w-full mb-8">
            {selectedHunger.courtOptions.map(option => (
              <button
                key={option.courtType}
                type="button"
                onClick={() => setSelectedCourt(option.courtType)}
                data-testid={`court-${option.courtType}`}
                className="w-full text-left rounded-xl p-5 transition-all duration-300 cursor-pointer"
                style={{
                  background: selectedCourt === option.courtType
                    ? 'rgba(180,164,138,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCourt === option.courtType ? '#8a7a4a' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <p className="text-sm italic" style={{ color: '#b4a48a' }}>
                  {option.prose}
                </p>
                {option.isDefault && selectedCourt === option.courtType && (
                  <span className="text-xs mt-2 block" style={{ color: '#666' }}>
                    (this feels natural)
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCourtConfirm}
            data-testid="court-confirm"
            className="py-3 px-8 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #8a7a4a, #6a5a3a)', color: '#f0e0b8' }}
          >
            Continue
          </button>
        </>
      )}

      {step === 'sphere-reveal' && selectedHunger && (
        <div
          className="flex flex-col items-center justify-center transition-opacity duration-1000"
          style={{ opacity: revealing ? 1 : 0 }}
        >
          <p className="text-sm italic mb-6" style={{ color: '#9a9a7a' }}>
            The spheres align. This was always going to happen.
          </p>
          <div
            className="w-48 h-48 rounded-full mb-8 transition-all duration-1500"
            style={{
              background: `radial-gradient(circle, ${primaryColor}40, transparent)`,
              boxShadow: `0 0 80px ${primaryColor}30`,
            }}
          />
          <p className="text-xl italic" style={{ color: primaryColor }}>
            {selectedHunger.sphereAlignment.primary} and {selectedHunger.sphereAlignment.secondary} pour through you.
          </p>
          <p className="text-sm italic mt-2" style={{ color: '#777' }}>
            The universe recognizes what you are.
          </p>
        </div>
      )}
    </div>
  );
}
