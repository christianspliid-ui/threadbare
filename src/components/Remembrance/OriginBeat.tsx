import { useState, useCallback, useEffect } from 'react';
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
  const [textVisible, setTextVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  // Staggered entrance: text first, then cards
  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setCardsVisible(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleFragmentSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setTimeout(() => setShowNaming(true), 600);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedFragment) return;
    const name = mortalName.trim() || 'The Unnamed';
    onSelect(selectedFragment, name);
  }, [selectedFragment, mortalName, onSelect]);

  return (
    <div className="h-screen flex flex-col items-center justify-center"
         style={{ background: '#0a0a0f' }}>

      {/* Text emerging from darkness */}
      <p className="mb-14 text-center transition-all duration-1000"
         style={{
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontStyle: 'italic',
           fontSize: '1.4rem',
           color: 'rgba(155,196,169,0.5)',
           letterSpacing: '0.06em',
           opacity: textVisible ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
         }}>
        You remember...
      </p>

      {/* Fragments — horizontal, dissolved edges, no card chrome */}
      <div className="flex gap-8 transition-all duration-1000"
           style={{
             width: 'min(1200px, 92vw)',
             opacity: cardsVisible ? 1 : 0,
             transform: cardsVisible ? 'translateY(0)' : 'translateY(20px)',
           }}>
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

      {/* Mortal naming — materializes from the void */}
      <div
        className="mt-16 text-center transition-all duration-700"
        style={{
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: showNaming ? 'auto' : 'none',
        }}
      >
        <p className="mb-4"
           style={{
             fontFamily: 'Georgia, "Times New Roman", serif',
             fontStyle: 'italic',
             fontSize: '1rem',
             color: 'rgba(155,180,160,0.45)',
             letterSpacing: '0.05em',
           }}>
          You had a name once.
        </p>
        <input
          type="text"
          value={mortalName}
          onChange={e => setMortalName(e.target.value)}
          placeholder="What were you called?"
          data-testid="mortal-name-input"
          className="block mx-auto mb-5 text-center text-lg outline-none"
          style={{
            width: '320px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(155,196,169,0.2)',
            padding: '12px 0',
            color: '#d0e8d8',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            letterSpacing: '0.04em',
          }}
        />
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedFragment}
          data-testid="origin-continue"
          className="transition-all duration-300 cursor-pointer"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '1rem',
            color: selectedFragment ? 'rgba(155,196,169,0.6)' : 'rgba(155,196,169,0.15)',
            letterSpacing: '0.08em',
            cursor: selectedFragment ? 'pointer' : 'default',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
