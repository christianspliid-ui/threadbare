import { useState, useCallback } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface OriginBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment, mortalName: string) => void;
}

export function OriginBeat({ fragments, onSelect }: OriginBeatProps) {
  const [selectedFragment, setSelectedFragment] = useState<RemembranceFragment | null>(null);
  const [mortalName, setMortalName] = useState('');
  const [showNaming, setShowNaming] = useState(false);

  const handleFragmentSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setTimeout(() => setShowNaming(true), 400);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedFragment) return;
    const name = mortalName.trim() || 'The Unnamed';
    onSelect(selectedFragment, name);
  }, [selectedFragment, mortalName, onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-xl italic mb-8" style={{ color: '#9bc4a9' }}>
        You remember...
      </p>

      {/* Horizontal row of large fragment cards */}
      <div className="flex gap-5 mb-8" style={{ width: 'min(1200px, 92vw)' }}>
        {fragments.map(fragment => (
          <FragmentCard
            key={fragment.id}
            prose={fragment.prose}
            imageAssetPath={fragment.imageAssetPath}
            selected={selectedFragment?.id === fragment.id}
            onClick={() => handleFragmentSelect(fragment)}
            accentColor="#8cb89a"
            testId={`origin-${fragment.id}`}
          />
        ))}
      </div>

      {/* Mortal naming */}
      <div
        className="max-w-md w-full transition-all duration-500"
        style={{
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showNaming ? 'auto' : 'none',
        }}
      >
        <p className="text-sm italic mb-3 text-center" style={{ color: '#8a9a8a' }}>
          You had a name once.
        </p>
        <input
          type="text"
          value={mortalName}
          onChange={e => setMortalName(e.target.value)}
          placeholder="What were you called?"
          data-testid="mortal-name-input"
          className="w-full bg-transparent border rounded-lg px-4 py-3 text-center text-lg outline-none transition-colors"
          style={{ borderColor: 'rgba(155,196,169,0.3)', color: '#e0f0e8' }}
        />
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedFragment}
          data-testid="origin-continue"
          className="w-full mt-4 py-3 rounded-lg text-sm font-medium transition-all duration-300"
          style={{
            background: selectedFragment
              ? 'linear-gradient(135deg, #8cb89a, #6a9a7a)'
              : 'rgba(255,255,255,0.05)',
            color: selectedFragment ? '#1a2e1a' : '#666',
            cursor: selectedFragment ? 'pointer' : 'default',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
