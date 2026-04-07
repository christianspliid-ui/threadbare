import { useState, useCallback, useEffect, useMemo } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface OriginBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment, mortalName: string) => void;
}

export function OriginBeat({ fragments, onSelect }: OriginBeatProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
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

  const focusedIndex = useMemo(() => {
    if (!focusedId) return -1;
    return fragments.findIndex(f => f.id === focusedId);
  }, [focusedId, fragments]);

  const focusedFragment = useMemo(() => {
    if (focusedIndex < 0) return null;
    return fragments[focusedIndex];
  }, [focusedIndex, fragments]);

  const handleFragmentClick = useCallback((fragment: RemembranceFragment) => {
    if (selectedFragment) return;

    if (focusedId === fragment.id) {
      // Second click = confirm selection
      setSelectedFragment(fragment);
      setTimeout(() => setShowNaming(true), 600);
    } else {
      // First click = focus
      setFocusedId(fragment.id);
    }
  }, [focusedId, selectedFragment]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (selectedFragment || focusedIndex < 0) return;
    const next = (focusedIndex + direction + fragments.length) % fragments.length;
    setFocusedId(fragments[next].id);
  }, [selectedFragment, focusedIndex, fragments]);

  const handleContinue = useCallback(() => {
    if (!selectedFragment) return;
    const name = mortalName.trim() || 'The Unnamed';
    onSelect(selectedFragment, name);
  }, [selectedFragment, mortalName, onSelect]);

  const isBrowsing = focusedId !== null && !selectedFragment;
  const promptText = !focusedId
    ? 'You remember...'
    : selectedFragment
      ? 'You remember...'
      : 'Click again to choose. Or reach for another.';

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center"
         style={{ background: '#0a0a0f' }}>

      {/* Prompt text */}
      <p className="mt-[7vh] text-center transition-all duration-1000"
         style={{
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontStyle: 'italic',
           fontSize: '1.4rem',
           color: focusedId ? 'rgba(160,140,180,0.4)' : 'rgba(155,196,169,0.5)',
           letterSpacing: '0.06em',
           opacity: textVisible ? (showNaming ? 0 : 1) : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           zIndex: 20,
         }}>
        {promptText}
      </p>

      {/* Browse mode — all cards in a row */}
      {!focusedId && !selectedFragment && (
        <div className="flex gap-8 mt-14 transition-all duration-1000"
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
              selected={false}
              onClick={() => handleFragmentClick(fragment)}
              accentColor="#8cb89a"
              testId={`origin-${fragment.id}`}
            />
          ))}
        </div>
      )}

      {/* Focus/selected mode — single expanded card centered */}
      {(focusedFragment || selectedFragment) && (
        <div className="flex-1 flex flex-col items-center justify-center"
             style={{ marginTop: '-2vh', width: '100%' }}>
          <div
            className="transition-all duration-700"
            style={{
              width: 'min(900px, 55vw)',
              opacity: selectedFragment ? 0.6 : 1,
            }}
          >
            <FragmentCard
              prose={(selectedFragment ?? focusedFragment)!.prose}
              imageAssetPath={(selectedFragment ?? focusedFragment)!.imageAssetPath}
              selected={true}
              onClick={() => {
                if (focusedFragment && !selectedFragment) {
                  handleFragmentClick(focusedFragment);
                }
              }}
              accentColor="#8cb89a"
              testId="origin-focused"
            />
          </div>
        </div>
      )}

      {/* Navigation arrows — visible when browsing focused */}
      {isBrowsing && (
        <>
          <button
            type="button"
            onClick={() => handleNav(-1)}
            className="absolute cursor-pointer"
            style={{
              left: '4vw',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: '1rem',
              zIndex: 20,
              color: 'rgba(160,140,180,0.35)',
              fontSize: '3.5rem',
              fontFamily: 'Georgia, "Times New Roman", serif',
              lineHeight: 1,
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.35)'; }}
            aria-label="Previous fragment"
          >
            &#x2039;
          </button>
          <button
            type="button"
            onClick={() => handleNav(1)}
            className="absolute cursor-pointer"
            style={{
              right: '4vw',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: '1rem',
              zIndex: 20,
              color: 'rgba(160,140,180,0.35)',
              fontSize: '3.5rem',
              fontFamily: 'Georgia, "Times New Roman", serif',
              lineHeight: 1,
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.35)'; }}
            aria-label="Next fragment"
          >
            &#x203a;
          </button>
        </>
      )}

      {/* Mortal naming — materializes from the void */}
      <div
        className="absolute left-0 right-0 text-center transition-all duration-700"
        style={{
          bottom: '10vh',
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: showNaming ? 'auto' : 'none',
          zIndex: 20,
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
