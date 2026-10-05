import { useState, useEffect } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';
import {
  useRemembranceChoice,
  handleChoiceRowKeyDown,
  ChooseAgainButton,
  DRIVE_CHOSEN_HOLD_MS,
} from './remembranceChoice';

interface DriveBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment) => void;
}

export function DriveBeat({ fragments, onSelect }: DriveBeatProps) {
  const [textVisible, setTextVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  // THR-1716 U4: one click chooses; the chosen fragment holds with "Choose again"
  // (and Escape) for DRIVE_CHOSEN_HOLD_MS, then the flow moves on.
  const { chosen, holdEnded, choose, chooseAgain } = useRemembranceChoice<RemembranceFragment>({
    holdMs: DRIVE_CHOSEN_HOLD_MS,
    onHoldEnd: onSelect,
    lockOnHoldEnd: true,
  });

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setCardsVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="h-screen relative overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Prompt */}
      <p className="absolute left-0 right-0 text-center"
         style={{
           top: '5vh',
           fontFamily: 'var(--font-prose)',
           fontStyle: 'italic',
           fontSize: '1.5rem',
           color: 'rgba(196,155,171,0.45)',
           letterSpacing: '0.06em',
           opacity: textVisible && !chosen ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           transition: 'opacity 1s ease, transform 1s ease',
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        But there was something you could not release. Even now, it burns.
      </p>

      {/* ── REST STATE: cards in a row ── */}
      {!chosen && (
        <div className="absolute inset-0 flex items-center justify-center gap-8 px-[6vw]"
             onKeyDown={handleChoiceRowKeyDown}
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
              onClick={() => choose(fragment)}
              accentColor="#b88c9a"
              testId={`drive-${fragment.id}`}
            />
          ))}
        </div>
      )}

      {/* ── CHOSEN STATE: full-bleed art, held before the flow moves on ── */}
      {chosen && (
        <>
          <div
            className="absolute inset-0"
            data-testid={`drive-chosen-${chosen.id}`}
            style={{
              backgroundImage: `url(${chosen.imageAssetPath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: holdEnded ? 0.3 : 0.8,
              transition: 'opacity 1s ease',
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
            }}
          />

          {/* Bottom reading zone */}
          {!holdEnded && (
            <div
              className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
              style={{
                padding: '0 8vw 5vh',
                background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
                zIndex: 10,
              }}
            >
              <p style={{
                fontFamily: 'var(--font-prose)',
                fontStyle: 'italic',
                fontSize: '1.5rem',
                lineHeight: '1.85',
                color: 'rgba(212,196,158,0.75)',
                maxWidth: '780px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                {chosen.prose}
              </p>
              <ChooseAgainButton onClick={chooseAgain} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
