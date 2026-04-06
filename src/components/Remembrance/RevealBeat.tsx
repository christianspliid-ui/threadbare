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
      className="flex flex-col items-center justify-center h-screen px-8 transition-opacity duration-1000"
      style={{ background: 'var(--bg-abyss, #0a0a0f)', opacity: visible ? 1 : 0 }}
    >
      <div
        className="w-64 h-40 rounded-xl mb-10 bg-cover bg-center"
        style={{
          backgroundImage: `url(${hunger.imageAssetPath})`,
          background: `radial-gradient(ellipse at center, ${primaryColor}20, rgba(255,255,255,0.03))`,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `0 0 60px ${primaryColor}20`,
        }}
      />
      <div className="max-w-lg text-center space-y-3 mb-10">
        <p className="text-sm italic" style={{ color: '#8a8a8a' }}>
          You were called <strong style={{ color: '#e8e0f0' }}>{mortalName}</strong>.
        </p>
        <p className="text-sm italic" style={{ color: '#8a8a8a' }}>
          {originFragment.prose}
        </p>
        <p className="text-sm italic" style={{ color: '#b88c9a' }}>
          {driveFragment.prose}
        </p>
        <p className="text-base italic mt-4" style={{ color: '#d4c48a' }}>
          Now you hunger to <strong>{hunger.name}</strong>. {hunger.mandateDirection}.
        </p>
        <p className="text-sm" style={{ color: primaryColor }}>
          {hunger.sphereAlignment.primary} and {hunger.sphereAlignment.secondary} pour through you.
          Your court is {COURT_LABELS[courtType] ?? courtType}.
        </p>
      </div>
      <p className="text-sm italic mb-3" style={{ color: '#8a7a9a' }}>
        The mortals will need a name for what you are.
      </p>
      <input
        type="text"
        value={divineName}
        onChange={e => setDivineName(e.target.value)}
        placeholder={suggestedDivineName}
        data-testid="divine-name-input"
        className="w-80 bg-transparent border rounded-lg px-4 py-3 text-center text-lg outline-none transition-colors mb-4"
        style={{ borderColor: `${primaryColor}40`, color: '#e8e0f0' }}
      />
      <button
        type="button"
        onClick={handleAscend}
        data-testid="ascend-button"
        className="py-3 px-12 rounded-lg text-base font-medium transition-all duration-300 cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`, color: '#1a1a1a' }}
      >
        Ascend
      </button>
    </div>
  );
}
