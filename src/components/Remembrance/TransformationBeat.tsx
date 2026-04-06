import { useState, useCallback, useEffect } from 'react';
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
  const [hoveredHunger, setHoveredHunger] = useState<string | null>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    setTextVisible(false);
    setContentVisible(false);
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setContentVisible(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step]);

  const handleHungerSelect = useCallback((hunger: HungerDefinition) => {
    setSelectedHunger(hunger);
    setSelectedCourt(hunger.courtOptions.find(c => c.isDefault)!.courtType);
    setTimeout(() => setStep('court'), 700);
  }, []);

  const handleCourtConfirm = useCallback(() => {
    setStep('sphere-reveal');
    setRevealing(true);
    setTimeout(() => {
      if (selectedHunger && selectedCourt) {
        onSelect(selectedHunger, selectedCourt);
      }
    }, 2500);
  }, [selectedHunger, selectedCourt, onSelect]);

  const primaryColor = selectedHunger
    ? getSphereColor(selectedHunger.sphereAlignment.primary)
    : '#c9b8f0';

  return (
    <div className="h-screen flex flex-col items-center justify-center"
         style={{ background: '#0a0a0f' }}>

      {/* ── Hunger selection ── */}
      {step === 'hunger' && (
        <>
          <div className="text-center mb-14 transition-all duration-1000"
               style={{
                 opacity: textVisible ? 1 : 0,
                 transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
               }}>
            <p style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.5rem',
              color: 'rgba(196,180,155,0.5)',
              letterSpacing: '0.06em',
            }}>
              And then the power found you. Or you found it.
            </p>
            <p className="mt-3" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '0.95rem',
              color: 'rgba(154,138,106,0.4)',
              letterSpacing: '0.05em',
            }}>
              It does not matter which. It was hungry. So were you.
            </p>
          </div>

          <div className="flex gap-8 transition-all duration-1000"
               style={{
                 width: 'min(1100px, 90vw)',
                 opacity: contentVisible ? 1 : 0,
                 transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
               }}>
            {hungers.map(hunger => {
              const prose = selectHungerProse(hunger, driveFragment);
              const isHovered = hoveredHunger === hunger.id;
              const isSelected = selectedHunger?.id === hunger.id;
              const isActive = isSelected || isHovered;
              return (
                <button
                  key={hunger.id}
                  type="button"
                  onClick={() => handleHungerSelect(hunger)}
                  onMouseEnter={() => setHoveredHunger(hunger.id)}
                  onMouseLeave={() => setHoveredHunger(null)}
                  data-testid={`hunger-${hunger.id}`}
                  className="flex-1 text-left cursor-pointer relative transition-all duration-500"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    opacity: isActive ? 1 : 0.5,
                    filter: isActive ? 'brightness(1.1)' : 'brightness(0.7)',
                  }}
                >
                  {/* Dissolved image */}
                  <div
                    className="w-full bg-cover bg-center"
                    style={{
                      aspectRatio: '16/9',
                      backgroundImage: `url(${hunger.imageAssetPath}), linear-gradient(135deg, rgba(180,160,100,0.12), rgba(60,50,30,0.08), rgba(120,100,60,0.10))`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maskImage: 'radial-gradient(ellipse 90% 85% at center, black 35%, transparent 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 35%, transparent 100%)',
                    }}
                  />
                  {/* Prose beneath */}
                  <div className="px-2 pt-5 pb-2">
                    <p style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      lineHeight: '1.7',
                      color: isActive ? 'rgba(212,196,138,0.8)' : 'rgba(180,170,140,0.35)',
                      transition: 'color 0.5s ease',
                    }}>
                      {prose}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Court geometry ── */}
      {step === 'court' && selectedHunger && (
        <>
          <p className="mb-14 transition-all duration-1000"
             style={{
               fontFamily: 'Georgia, "Times New Roman", serif',
               fontStyle: 'italic',
               fontSize: '1.4rem',
               color: 'rgba(180,180,138,0.45)',
               letterSpacing: '0.06em',
               opacity: textVisible ? 1 : 0,
               transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
             }}>
            The power settles into a pattern...
          </p>

          <div className="flex gap-12 transition-all duration-1000"
               style={{
                 width: 'min(900px, 80vw)',
                 opacity: contentVisible ? 1 : 0,
                 transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
               }}>
            {selectedHunger.courtOptions.map(option => {
              const isChosen = selectedCourt === option.courtType;
              return (
                <button
                  key={option.courtType}
                  type="button"
                  onClick={() => setSelectedCourt(option.courtType)}
                  data-testid={`court-${option.courtType}`}
                  className="flex-1 text-left cursor-pointer transition-all duration-500"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '24px 4px',
                    opacity: isChosen ? 1 : 0.4,
                  }}
                >
                  <p style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontSize: '1.05rem',
                    lineHeight: '1.8',
                    color: isChosen ? 'rgba(180,164,138,0.7)' : 'rgba(180,164,138,0.3)',
                    transition: 'color 0.5s ease',
                  }}>
                    {option.prose}
                  </p>
                  {option.isDefault && isChosen && (
                    <span style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '0.75rem',
                      color: 'rgba(120,110,90,0.4)',
                      display: 'block',
                      marginTop: '12px',
                    }}>
                      (this feels natural)
                    </span>
                  )}
                  {/* Faint underline for chosen */}
                  {isChosen && (
                    <div style={{
                      height: '1px',
                      marginTop: '16px',
                      background: 'linear-gradient(to right, transparent, rgba(138,122,74,0.3), transparent)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCourtConfirm}
            data-testid="court-confirm"
            className="mt-14 cursor-pointer transition-all duration-500"
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1rem',
              color: 'rgba(180,164,138,0.5)',
              letterSpacing: '0.08em',
              opacity: contentVisible ? 1 : 0,
            }}
          >
            Continue
          </button>
        </>
      )}

      {/* ── Sphere reveal ── */}
      {step === 'sphere-reveal' && selectedHunger && (
        <div className="flex flex-col items-center justify-center transition-opacity duration-1500"
             style={{ opacity: revealing ? 1 : 0 }}>

          <p className="mb-10"
             style={{
               fontFamily: 'Georgia, "Times New Roman", serif',
               fontStyle: 'italic',
               fontSize: '1.1rem',
               color: 'rgba(154,154,122,0.4)',
               letterSpacing: '0.06em',
             }}>
            The spheres align. This was always going to happen.
          </p>

          {/* Orb of pure energy — no border, no shape, just light */}
          <div
            className="mb-12"
            style={{
              width: 'min(300px, 30vw)',
              height: 'min(300px, 30vw)',
              background: `radial-gradient(circle, ${primaryColor}45, ${primaryColor}15, transparent 70%)`,
              boxShadow: `0 0 160px ${primaryColor}25, 0 0 320px ${primaryColor}10`,
              borderRadius: '50%',
            }}
          />

          <p style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '1.6rem',
            color: primaryColor,
            opacity: 0.7,
            letterSpacing: '0.04em',
          }}>
            {selectedHunger.sphereAlignment.primary} and {selectedHunger.sphereAlignment.secondary} pour through you.
          </p>
          <p className="mt-4"
             style={{
               fontFamily: 'Georgia, "Times New Roman", serif',
               fontStyle: 'italic',
               fontSize: '0.9rem',
               color: 'rgba(120,120,120,0.5)',
               letterSpacing: '0.05em',
             }}>
            The universe recognizes what you are.
          </p>
        </div>
      )}
    </div>
  );
}
