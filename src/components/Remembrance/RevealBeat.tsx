import { useState, useCallback, useEffect } from 'react';
import type { RemembranceFragment, HungerDefinition } from '../../types/remembrance';
import { getSphereColor } from '../../data/sphereIcons';

interface RevealBeatProps {
  originFragment: RemembranceFragment;
  driveFragment: RemembranceFragment;
  hunger: HungerDefinition;
  mortalName: string;
  courtType: string;
  suggestedDivineName: string;
  onComplete: (divineName: string) => void;
}

const COURT_LABELS: Record<string, string> = {
  high_house: 'a High House',
  circle: 'a Circle',
  web: 'a Web',
  abyss: 'an Abyss',
};

export function RevealBeat({
  originFragment,
  driveFragment,
  hunger,
  mortalName,
  courtType,
  suggestedDivineName,
  onComplete,
}: RevealBeatProps) {
  const [divineName, setDivineName] = useState('');
  const [phase, setPhase] = useState(0); // 0=hidden, 1=image, 2=mortal, 3=origin, 4=drive, 5=hunger, 6=spheres, 7=naming

  // Staggered reveal — each line materializes from darkness
  useEffect(() => {
    const delays = [300, 1200, 2200, 3200, 4200, 5200, 6200];
    const timers = delays.map((d, i) => setTimeout(() => setPhase(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleAscend = useCallback(() => {
    const name = divineName.trim() || suggestedDivineName;
    onComplete(name);
  }, [divineName, suggestedDivineName, onComplete]);

  const primaryColor = getSphereColor(hunger.sphereAlignment.primary);

  const lineStyle = (idx: number, color: string) => ({
    fontFamily: 'Georgia, "Times New Roman", serif' as const,
    fontStyle: 'italic' as const,
    color,
    opacity: phase >= idx ? 1 : 0,
    transform: phase >= idx ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 1s ease, transform 1s ease',
  });

  return (
    <div className="h-screen flex flex-col items-center justify-center overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Hero image — dissolved edges, no container */}
      <div
        className="bg-cover bg-center mb-6"
        style={{
          width: 'min(1000px, 80vw)',
          aspectRatio: '16/7',
          maxHeight: '30vh',
          backgroundImage: `url(${hunger.imageAssetPath})`,
          background: `radial-gradient(ellipse at center, ${primaryColor}20, ${primaryColor}06, transparent)`,
          maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}
      />

      {/* Identity lines — each materializes separately */}
      <div className="max-w-2xl text-center" style={{ lineHeight: '2.2' }}>

        <p className="mb-3" style={{ ...lineStyle(2, 'rgba(138,138,138,0.5)'), fontSize: '1.05rem' }}>
          You were called <strong style={{ color: '#e8e0f0', fontWeight: 'normal', fontSize: '1.2rem' }}>{mortalName}</strong>.
        </p>

        <p className="mb-3" style={{ ...lineStyle(3, 'rgba(138,138,138,0.4)'), fontSize: '0.9rem', lineHeight: '1.8' }}>
          {originFragment.prose}
        </p>

        <p className="mb-5" style={{ ...lineStyle(4, 'rgba(184,140,154,0.45)'), fontSize: '0.9rem', lineHeight: '1.8' }}>
          {driveFragment.prose}
        </p>

        <p className="mb-1" style={{ ...lineStyle(5, 'rgba(212,196,138,0.6)'), fontSize: '1.15rem' }}>
          Now you hunger to <strong style={{ fontWeight: 'normal' }}>{hunger.name}</strong>.
        </p>
        <p className="mb-5" style={{ ...lineStyle(5, 'rgba(180,164,138,0.35)'), fontSize: '0.85rem' }}>
          {hunger.mandateDirection}.
        </p>

        <p style={{ ...lineStyle(6, primaryColor), fontSize: '1rem', opacity: phase >= 6 ? 0.6 : 0 }}>
          {hunger.sphereAlignment.primary} and {hunger.sphereAlignment.secondary} pour through you.
          Your court is {COURT_LABELS[courtType] ?? courtType}.
        </p>
      </div>

      {/* Divine naming — appears last, floating in the void */}
      <div className="mt-10 text-center transition-all duration-1000"
           style={{
             opacity: phase >= 7 ? 1 : 0,
             transform: phase >= 7 ? 'translateY(0)' : 'translateY(12px)',
             pointerEvents: phase >= 7 ? 'auto' : 'none',
           }}>
        <p className="mb-4"
           style={{
             fontFamily: 'Georgia, "Times New Roman", serif',
             fontStyle: 'italic',
             fontSize: '0.95rem',
             color: 'rgba(138,122,154,0.4)',
             letterSpacing: '0.06em',
           }}>
          The mortals will need a name for what you are.
        </p>
        <input
          type="text"
          value={divineName}
          onChange={e => setDivineName(e.target.value)}
          placeholder={suggestedDivineName}
          data-testid="divine-name-input"
          className="block mx-auto mb-6 text-center text-lg outline-none"
          style={{
            width: '380px',
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${primaryColor}30`,
            padding: '12px 0',
            color: '#e8e0f0',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            letterSpacing: '0.04em',
          }}
        />
        <button
          type="button"
          onClick={handleAscend}
          data-testid="ascend-button"
          className="cursor-pointer transition-all duration-500"
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: primaryColor,
            opacity: 0.6,
            letterSpacing: '0.1em',
          }}
        >
          Ascend
        </button>
      </div>
    </div>
  );
}
