import { useState, useCallback, useEffect, useMemo } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface DriveBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment) => void;
}

export function DriveBeat({ fragments, onSelect }: DriveBeatProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setCardsVisible(true), 900);
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

  const handleClick = useCallback((fragment: RemembranceFragment) => {
    if (confirmedId) return;

    if (focusedId === fragment.id) {
      // Second click = confirm
      setConfirmedId(fragment.id);
      setTimeout(() => onSelect(fragment), 1000);
    } else {
      setFocusedId(fragment.id);
    }
  }, [focusedId, confirmedId, onSelect]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedId || focusedIndex < 0) return;
    const next = (focusedIndex + direction + fragments.length) % fragments.length;
    setFocusedId(fragments[next].id);
  }, [confirmedId, focusedIndex, fragments]);

  const isBrowsing = focusedId !== null && !confirmedId;
  const promptText = !focusedId
    ? 'But there was something you could not release. Even now, it burns.'
    : 'Click again to choose. Or reach for another.';

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center"
         style={{ background: '#0a0a0f' }}>

      <p className="mt-[7vh] text-center transition-all duration-1000"
         style={{
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontStyle: 'italic',
           fontSize: '1.4rem',
           color: focusedId ? 'rgba(160,140,180,0.4)' : 'rgba(196,155,171,0.5)',
           letterSpacing: '0.06em',
           opacity: textVisible && !confirmedId ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           zIndex: 20,
         }}>
        {promptText}
      </p>

      {/* Browse mode — all cards in a row */}
      {!focusedId && !confirmedId && (
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
              onClick={() => handleClick(fragment)}
              accentColor="#b88c9a"
              testId={`drive-${fragment.id}`}
            />
          ))}
        </div>
      )}

      {/* Focus/confirmed mode — single expanded card centered */}
      {(focusedFragment || confirmedId) && (
        <div className="flex-1 flex flex-col items-center justify-center"
             style={{ marginTop: '-2vh', width: '100%' }}>
          <div
            className="transition-all duration-700"
            style={{
              width: 'min(900px, 55vw)',
              opacity: confirmedId ? 0.3 : 1,
            }}
          >
            <FragmentCard
              prose={(focusedFragment ?? fragments.find(f => f.id === confirmedId))!.prose}
              imageAssetPath={(focusedFragment ?? fragments.find(f => f.id === confirmedId))!.imageAssetPath}
              selected={true}
              onClick={() => {
                if (focusedFragment && !confirmedId) {
                  handleClick(focusedFragment);
                }
              }}
              accentColor="#b88c9a"
              testId="drive-focused"
            />
          </div>
        </div>
      )}

      {/* Navigation arrows */}
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
    </div>
  );
}
