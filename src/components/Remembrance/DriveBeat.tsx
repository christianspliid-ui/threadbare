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

  const activeFragment = focusedFragment ?? (confirmedId ? fragments.find(f => f.id === confirmedId) ?? null : null);

  const handleClick = useCallback((fragment: RemembranceFragment) => {
    if (confirmedId) return;

    if (focusedId === fragment.id) {
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
           color: focusedId ? 'rgba(160,140,180,0.35)' : 'rgba(196,155,171,0.45)',
           letterSpacing: '0.06em',
           opacity: textVisible && !confirmedId ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        {focusedId
          ? 'Click again to choose. Or reach for another.'
          : 'But there was something you could not release. Even now, it burns.'}
      </p>

      {/* ── REST STATE: cards in a row ── */}
      {!focusedId && !confirmedId && (
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
              onClick={() => handleClick(fragment)}
              accentColor="#b88c9a"
              testId={`drive-${fragment.id}`}
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
              opacity: confirmedId ? 0.3 : 0.8,
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
            }}
            onClick={() => {
              if (focusedFragment && !confirmedId) handleClick(focusedFragment);
            }}
          />

          {/* Bottom reading zone */}
          {!confirmedId && (
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
                {activeFragment.prose}
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
          )}
        </>
      )}

      {/* Navigation arrows */}
      {isBrowsing && (
        <>
          <button type="button" onClick={() => handleNav(-1)} className="absolute cursor-pointer"
            style={{ left: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Previous fragment">&#x2039;</button>
          <button type="button" onClick={() => handleNav(1)} className="absolute cursor-pointer"
            style={{ right: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '2rem 1.5rem', zIndex: 20, color: 'rgba(160,140,180,0.3)', fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif', lineHeight: 1, transition: 'color 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Next fragment">&#x203a;</button>
        </>
      )}
    </div>
  );
}
