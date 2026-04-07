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

  const activeFragment = selectedFragment ?? focusedFragment;

  const handleFragmentClick = useCallback((fragment: RemembranceFragment) => {
    if (selectedFragment) return;

    if (focusedId === fragment.id) {
      setSelectedFragment(fragment);
      setTimeout(() => setShowNaming(true), 600);
    } else {
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

  return (
    <div className="h-screen relative overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Prompt */}
      <p className="absolute left-0 right-0 text-center transition-all duration-1000"
         style={{
           top: '5vh',
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontStyle: 'italic',
           fontSize: '1.5rem',
           color: focusedId ? 'rgba(160,140,180,0.35)' : 'rgba(155,196,169,0.45)',
           letterSpacing: '0.06em',
           opacity: textVisible && !showNaming ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        {focusedId ? 'Click again to choose. Or reach for another.' : 'You remember...'}
      </p>

      {/* ── REST STATE: cards in a row ── */}
      {!focusedId && !selectedFragment && (
        <div className="absolute inset-0 flex items-center justify-center gap-8 px-[6vw]"
             style={{
               opacity: cardsVisible ? 1 : 0,
               transform: cardsVisible ? 'translateY(0)' : 'translateY(20px)',
               transition: 'opacity 1s ease, transform 1s ease',
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

      {/* ── FOCUSED STATE: full-bleed art ── */}
      {activeFragment && (
        <>
          <div
            className="absolute inset-0 transition-all duration-1000 cursor-pointer"
            style={{
              backgroundImage: `url(${activeFragment.imageAssetPath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: selectedFragment ? 0.5 : 0.8,
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
            }}
            onClick={() => {
              if (focusedFragment && !selectedFragment) handleFragmentClick(focusedFragment);
            }}
          />

          {/* Bottom reading zone */}
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center transition-all duration-700"
            style={{
              padding: '0 8vw 5vh',
              background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
              zIndex: 10,
              opacity: showNaming ? 0 : 1,
              pointerEvents: showNaming ? 'none' : 'auto',
            }}
          >
            <p style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              lineHeight: '1.85',
              color: 'rgba(212,196,158,0.75)',
              maxWidth: '680px',
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              {activeFragment.prose}
            </p>
            {!selectedFragment && (
              <p style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                color: 'rgba(160,140,130,0.25)',
                letterSpacing: '0.06em',
              }}>
                Click the image to choose
              </p>
            )}
          </div>
        </>
      )}

      {/* Navigation arrows */}
      {isBrowsing && (
        <>
          <button type="button" onClick={() => handleNav(-1)} className="absolute cursor-pointer"
            style={{ left: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '3rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Previous fragment">&#x2039;</button>
          <button type="button" onClick={() => handleNav(1)} className="absolute cursor-pointer"
            style={{ right: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '3rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Next fragment">&#x203a;</button>
        </>
      )}

      {/* Mortal naming — over the dimmed art */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center transition-all duration-700"
        style={{
          padding: '0 8vw 6vh',
          background: 'linear-gradient(to top, rgba(10,10,15,0.97) 0%, rgba(10,10,15,0.85) 40%, rgba(10,10,15,0.5) 70%, transparent 100%)',
          zIndex: 15,
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: showNaming ? 'auto' : 'none',
        }}
      >
        <p className="mb-4"
           style={{
             fontFamily: 'Georgia, "Times New Roman", serif',
             fontStyle: 'italic',
             fontSize: '1.1rem',
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
            fontSize: '1.1rem',
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
