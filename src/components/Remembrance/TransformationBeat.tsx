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
          <p className="text-xl italic mb-3" style={{ color: '#c4b49b' }}>
            And then the power found you. Or you found it.
          </p>
          <p className="text-sm italic mb-10" style={{ color: '#9a8a6a' }}>
            It does not matter which. It was hungry. So were you.
          </p>

          {/* Large horizontal hunger cards */}
          <div className="flex gap-5" style={{ width: 'min(1100px, 90vw)' }}>
            {hungers.map(hunger => {
              const prose = selectHungerProse(hunger, driveFragment);
              const isSelected = selectedHunger?.id === hunger.id;
              return (
                <button
                  key={hunger.id}
                  type="button"
                  onClick={() => handleHungerSelect(hunger)}
                  data-testid={`hunger-${hunger.id}`}
                  className="flex-1 text-left rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                  style={{
                    background: isSelected
                      ? `linear-gradient(180deg, ${primaryColor}18, transparent)`
                      : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${isSelected ? '#8a7a4a' : 'rgba(255,255,255,0.08)'}`,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? `0 4px 40px ${primaryColor}20` : 'none',
                  }}
                >
                  {/* Large 16:9 image area */}
                  <div
                    className="w-full bg-cover bg-center"
                    style={{
                      aspectRatio: '16/9',
                      backgroundImage: `url(${hunger.imageAssetPath})`,
                      background: 'linear-gradient(135deg, rgba(180,160,100,0.15), rgba(60,50,30,0.1), rgba(120,100,60,0.12))',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                  {/* Prose */}
                  <div className="p-6">
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
          <p className="text-xl italic mb-10" style={{ color: '#b4b48a' }}>
            The power settles into a pattern...
          </p>
          <div className="flex gap-5 mb-8" style={{ width: 'min(900px, 80vw)' }}>
            {selectedHunger.courtOptions.map(option => (
              <button
                key={option.courtType}
                type="button"
                onClick={() => setSelectedCourt(option.courtType)}
                data-testid={`court-${option.courtType}`}
                className="flex-1 text-left rounded-2xl p-8 transition-all duration-300 cursor-pointer"
                style={{
                  background: selectedCourt === option.courtType
                    ? 'rgba(180,164,138,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCourt === option.courtType ? '#8a7a4a' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: selectedCourt === option.courtType ? '0 4px 30px rgba(138,122,74,0.15)' : 'none',
                }}
              >
                <p className="text-base italic leading-relaxed" style={{ color: '#b4a48a' }}>
                  {option.prose}
                </p>
                {option.isDefault && selectedCourt === option.courtType && (
                  <span className="text-xs mt-3 block" style={{ color: '#666' }}>
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
            className="py-3 px-10 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer"
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
          <p className="text-base italic mb-8" style={{ color: '#9a9a7a' }}>
            The spheres align. This was always going to happen.
          </p>
          <div
            className="rounded-full mb-10 transition-all duration-1500"
            style={{
              width: 'min(280px, 30vw)',
              height: 'min(280px, 30vw)',
              background: `radial-gradient(circle, ${primaryColor}50, ${primaryColor}20, transparent)`,
              boxShadow: `0 0 120px ${primaryColor}30, 0 0 240px ${primaryColor}15`,
            }}
          />
          <p className="text-2xl italic" style={{ color: primaryColor }}>
            {selectedHunger.sphereAlignment.primary} and {selectedHunger.sphereAlignment.secondary} pour through you.
          </p>
          <p className="text-sm italic mt-3" style={{ color: '#777' }}>
            The universe recognizes what you are.
          </p>
        </div>
      )}
    </div>
  );
}
