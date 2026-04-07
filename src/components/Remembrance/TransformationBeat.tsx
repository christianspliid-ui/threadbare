import { useState, useCallback, useEffect, useMemo } from 'react';
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
  const [focusedHungerId, setFocusedHungerId] = useState<string | null>(null);
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

  const focusedHungerIndex = useMemo(() => {
    if (!focusedHungerId) return -1;
    return hungers.findIndex(h => h.id === focusedHungerId);
  }, [focusedHungerId, hungers]);

  const focusedHunger = useMemo(() => {
    if (focusedHungerIndex < 0) return null;
    return hungers[focusedHungerIndex];
  }, [focusedHungerIndex, hungers]);

  const handleHungerClick = useCallback((hunger: HungerDefinition) => {
    if (selectedHunger) return;

    if (focusedHungerId === hunger.id) {
      // Second click = confirm
      setSelectedHunger(hunger);
      setSelectedCourt(hunger.courtOptions.find(c => c.isDefault)!.courtType);
      setTimeout(() => setStep('court'), 700);
    } else {
      setFocusedHungerId(hunger.id);
    }
  }, [focusedHungerId, selectedHunger]);

  const handleHungerNav = useCallback((direction: -1 | 1) => {
    if (selectedHunger || focusedHungerIndex < 0) return;
    const next = (focusedHungerIndex + direction + hungers.length) % hungers.length;
    setFocusedHungerId(hungers[next].id);
  }, [selectedHunger, focusedHungerIndex, hungers]);

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

  const isBrowsingHunger = step === 'hunger' && focusedHungerId !== null && !selectedHunger;

  const courtOptions = selectedHunger?.courtOptions ?? [];
  const selectedCourtIndex = courtOptions.findIndex(c => c.courtType === selectedCourt);

  const handleCourtNav = useCallback((direction: -1 | 1) => {
    if (!courtOptions.length) return;
    const next = (selectedCourtIndex + direction + courtOptions.length) % courtOptions.length;
    setSelectedCourt(courtOptions[next].courtType);
  }, [selectedCourtIndex, courtOptions]);

  const currentCourtOption = courtOptions[selectedCourtIndex] ?? null;
  const currentCourtImagePath = currentCourtOption
    ? `/assets/remembrance/court/${currentCourtOption.courtType === 'high_house' ? 'high-house' : currentCourtOption.courtType}.png`
    : '';

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center"
         style={{ background: '#0a0a0f' }}>

      {/* ── Hunger selection ── */}
      {step === 'hunger' && (
        <>
          {/* Prompt */}
          <p className="absolute left-0 right-0 text-center transition-all duration-1000"
             style={{
               top: '5vh',
               fontFamily: 'Georgia, "Times New Roman", serif',
               fontStyle: 'italic',
               fontSize: '1.5rem',
               color: focusedHungerId ? 'rgba(160,140,180,0.35)' : 'rgba(196,180,155,0.45)',
               letterSpacing: '0.06em',
               opacity: textVisible ? 1 : 0,
               transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
               zIndex: 20,
               pointerEvents: 'none',
             }}>
            {focusedHungerId
              ? 'Click again to choose. Or reach for another.'
              : 'And then the power found you. Or you found it.'}
          </p>
          {!focusedHungerId && (
            <p className="absolute left-0 right-0 text-center transition-all duration-1000"
               style={{
                 top: 'calc(5vh + 2.2rem)',
                 fontFamily: 'Georgia, "Times New Roman", serif',
                 fontStyle: 'italic',
                 fontSize: '0.95rem',
                 color: 'rgba(154,138,106,0.4)',
                 letterSpacing: '0.05em',
                 opacity: textVisible ? 1 : 0,
                 zIndex: 20,
                 pointerEvents: 'none',
               }}>
              It does not matter which. It was hungry. So were you.
            </p>
          )}

          {/* Browse mode — all cards in a row */}
          {!focusedHungerId && (
            <div className="absolute inset-0 flex items-center justify-center gap-8 px-[6vw]"
                 style={{
                   opacity: contentVisible ? 1 : 0,
                   transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
                   transition: 'opacity 1s ease, transform 1s ease',
                 }}>
              {hungers.map(hunger => {
                const prose = selectHungerProse(hunger, driveFragment);
                const isHovered = hoveredHunger === hunger.id;
                return (
                  <button
                    key={hunger.id}
                    type="button"
                    onClick={() => handleHungerClick(hunger)}
                    onMouseEnter={() => setHoveredHunger(hunger.id)}
                    onMouseLeave={() => setHoveredHunger(null)}
                    data-testid={`hunger-${hunger.id}`}
                    className="flex-1 text-left cursor-pointer relative transition-all duration-500"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      opacity: isHovered ? 1 : 0.5,
                      filter: isHovered ? 'brightness(1.1)' : 'brightness(0.7)',
                    }}
                  >
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
                    <div className="px-2 pt-5 pb-2">
                      <p style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                        lineHeight: '1.7',
                        color: isHovered ? 'rgba(212,196,138,0.8)' : 'rgba(180,170,140,0.35)',
                        transition: 'color 0.5s ease',
                      }}>
                        {prose}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Focused mode — full-bleed art */}
          {focusedHunger && !selectedHunger && (
            <>
              <div
                className="absolute inset-0 transition-all duration-1000 cursor-pointer"
                style={{
                  backgroundImage: `url(${focusedHunger.imageAssetPath})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.8,
                  maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
                }}
                onClick={() => handleHungerClick(focusedHunger)}
                data-testid="hunger-focused"
              />

              {/* Bottom reading zone */}
              <div
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
                style={{
                  padding: '0 8vw 5vh',
                  background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
                  zIndex: 10,
                }}
              >
                <p style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '1.5rem',
                  lineHeight: '1.85',
                  color: 'rgba(212,196,158,0.75)',
                  maxWidth: '780px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}>
                  {selectHungerProse(focusedHunger, driveFragment)}
                </p>
                <p style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '1.1rem',
                  color: 'rgba(160,140,130,0.25)',
                  letterSpacing: '0.06em',
                }}>
                  Click the image to choose
                </p>
              </div>
            </>
          )}

          {/* Navigation arrows for hunger browsing */}
          {isBrowsingHunger && (
            <>
              <button type="button" onClick={() => handleHungerNav(-1)} className="absolute cursor-pointer"
                style={{ left: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
                aria-label="Previous hunger">&#x2039;</button>
              <button type="button" onClick={() => handleHungerNav(1)} className="absolute cursor-pointer"
                style={{ right: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
                aria-label="Next hunger">&#x203a;</button>
            </>
          )}
        </>
      )}

      {/* ── Court geometry — full-bleed ── */}
      {step === 'court' && selectedHunger && currentCourtOption && (
        <>
          {/* Prompt */}
          <p className="absolute left-0 right-0 text-center transition-all duration-1000"
             style={{
               top: '5vh',
               fontFamily: 'Georgia, "Times New Roman", serif',
               fontStyle: 'italic',
               fontSize: '1.5rem',
               color: 'rgba(180,180,138,0.35)',
               letterSpacing: '0.06em',
               opacity: textVisible ? 1 : 0,
               transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
               zIndex: 20,
               pointerEvents: 'none',
             }}>
            The power settles into a pattern...
          </p>

          {/* Full-bleed court art */}
          <div
            className="absolute inset-0 transition-all duration-1000"
            style={{
              backgroundImage: `url(${currentCourtImagePath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: contentVisible ? 0.8 : 0,
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
            }}
          />

          {/* Bottom reading zone */}
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
            style={{
              padding: '0 8vw 5vh',
              background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
              zIndex: 10,
            }}
          >
            <p style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.5rem',
              lineHeight: '1.85',
              color: 'rgba(212,196,158,0.75)',
              maxWidth: '780px',
              textAlign: 'center',
              marginBottom: '12px',
            }}>
              {currentCourtOption.prose}
            </p>
            {currentCourtOption.isDefault && (
              <p style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '1rem',
                color: 'rgba(120,110,90,0.35)',
                marginBottom: '12px',
              }}>
                (this feels natural)
              </p>
            )}
            <button
              type="button"
              onClick={handleCourtConfirm}
              data-testid="court-confirm"
              className="cursor-pointer transition-all duration-500"
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '1.1rem',
                color: 'rgba(180,164,138,0.5)',
                letterSpacing: '0.08em',
              }}
            >
              Continue
            </button>
          </div>

          {/* Navigation arrows */}
          {courtOptions.length > 1 && (
            <>
              <button type="button" onClick={() => handleCourtNav(-1)} className="absolute cursor-pointer"
                style={{ left: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
                aria-label="Previous court">&#x2039;</button>
              <button type="button" onClick={() => handleCourtNav(1)} className="absolute cursor-pointer"
                style={{ right: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
                aria-label="Next court">&#x203a;</button>
            </>
          )}
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
