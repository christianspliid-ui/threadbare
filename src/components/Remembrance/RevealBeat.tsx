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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAscend = useCallback(() => {
    const name = divineName.trim() || suggestedDivineName;
    onComplete(name);
  }, [divineName, suggestedDivineName, onComplete]);

  const primaryColor = getSphereColor(hunger.sphereAlignment.primary);

  return (
    <div
      className="flex flex-col items-center h-screen transition-opacity duration-1000 overflow-hidden"
      style={{ background: 'var(--bg-abyss, #0a0a0f)', opacity: visible ? 1 : 0 }}
    >
      {/* Hero image — wide 16:9 cinematic banner */}
      <div
        className="flex-shrink-0 bg-cover bg-center"
        style={{
          width: 'min(1200px, 90vw)',
          aspectRatio: '16/9',
          maxHeight: '35vh',
          backgroundImage: `url(${hunger.imageAssetPath})`,
          background: `radial-gradient(ellipse at center, ${primaryColor}25, ${primaryColor}08, rgba(10,10,15,1))`,
          boxShadow: `inset 0 -40px 60px rgba(10,10,15,0.9), 0 0 80px ${primaryColor}15`,
          borderRadius: '16px',
        }}
      />

      {/* Identity narrative — centered below the image */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-8">
        <div className="max-w-2xl text-center space-y-4 mb-8">
          <p className="text-base italic" style={{ color: '#8a8a8a' }}>
            You were called <strong className="text-lg" style={{ color: '#e8e0f0' }}>{mortalName}</strong>.
          </p>
          <p className="text-sm italic leading-relaxed" style={{ color: '#8a8a8a' }}>
            {originFragment.prose}
          </p>
          <p className="text-sm italic leading-relaxed" style={{ color: '#b88c9a' }}>
            {driveFragment.prose}
          </p>
          <div className="pt-2">
            <p className="text-lg italic" style={{ color: '#d4c48a' }}>
              Now you hunger to <strong>{hunger.name}</strong>.
            </p>
            <p className="text-sm italic mt-1" style={{ color: '#b4a48a' }}>
              {hunger.mandateDirection}.
            </p>
          </div>
          <p className="text-base" style={{ color: primaryColor }}>
            {hunger.sphereAlignment.primary} and {hunger.sphereAlignment.secondary} pour through you.
            Your court is {COURT_LABELS[courtType] ?? courtType}.
          </p>
        </div>

        {/* Divine naming */}
        <p className="text-sm italic mb-3" style={{ color: '#8a7a9a' }}>
          The mortals will need a name for what you are.
        </p>
        <input
          type="text"
          value={divineName}
          onChange={e => setDivineName(e.target.value)}
          placeholder={suggestedDivineName}
          data-testid="divine-name-input"
          className="w-96 bg-transparent border rounded-lg px-4 py-3 text-center text-lg outline-none transition-colors mb-4"
          style={{ borderColor: `${primaryColor}40`, color: '#e8e0f0' }}
        />
        <button
          type="button"
          onClick={handleAscend}
          data-testid="ascend-button"
          className="py-3 px-14 rounded-lg text-base font-medium transition-all duration-300 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
            color: '#1a1a1a',
          }}
        >
          Ascend
        </button>
      </div>
    </div>
  );
}
