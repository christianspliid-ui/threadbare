import { useState, useCallback, useEffect } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';
import {
  useRemembranceChoice,
  handleChoiceRowKeyDown,
  ChooseAgainButton,
  ORIGIN_NAMING_REVEAL_MS,
} from './remembranceChoice';

interface OriginBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment, mortalName: string) => void;
}

export function OriginBeat({ fragments, onSelect }: OriginBeatProps) {
  const [mortalName, setMortalName] = useState('');
  const [textVisible, setTextVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  // THR-1716 U4: one click chooses; the naming step appears after
  // ORIGIN_NAMING_REVEAL_MS. Until Continue, "Choose again" (or Escape) returns
  // to the row and a different origin can be chosen; a typed name is kept.
  const { chosen: selectedFragment, holdEnded: showNaming, choose, chooseAgain } =
    useRemembranceChoice<RemembranceFragment>({
      holdMs: ORIGIN_NAMING_REVEAL_MS,
      onHoldEnd: () => {},
      lockOnHoldEnd: false,
    });

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setCardsVisible(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedFragment) return;
    const name = mortalName.trim() || 'The Unnamed';
    onSelect(selectedFragment, name);
  }, [selectedFragment, mortalName, onSelect]);

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
           color: 'rgba(155,196,169,0.58)',
           textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
           letterSpacing: '0.06em',
           opacity: textVisible && !selectedFragment ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
           transition: 'opacity 1s ease, transform 1s ease',
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        You remember...
      </p>

      {/* ── REST STATE: cards in a row ── */}
      {!selectedFragment && (
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
              accentColor="#8cb89a"
              testId={`origin-${fragment.id}`}
            />
          ))}
        </div>
      )}

      {/* ── CHOSEN STATE: full-bleed art ── */}
      {selectedFragment && (
        <>
          <div
            className="absolute inset-0"
            data-testid={`origin-chosen-${selectedFragment.id}`}
            style={{
              backgroundImage: `url(${selectedFragment.imageAssetPath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: showNaming ? 0.5 : 0.8,
              transition: 'opacity 1s ease',
              maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 25%, transparent 80%)',
            }}
          />

          {/* Bottom reading zone */}
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
            style={{
              padding: '0 8vw 5vh',
              background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
              zIndex: 10,
              opacity: showNaming ? 0 : 1,
              transition: 'opacity 0.7s ease',
              pointerEvents: showNaming ? 'none' : 'auto',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-prose)',
              fontStyle: 'italic',
              fontSize: '1.5rem',
              lineHeight: '1.85',
              color: 'rgba(212,196,158,0.88)',
              textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
              maxWidth: '780px',
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              {selectedFragment.prose}
            </p>
          </div>
        </>
      )}

      {/* Mortal naming — over the dimmed art */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center"
        style={{
          padding: '0 8vw 6vh',
          background: 'linear-gradient(to top, rgba(10,10,15,0.97) 0%, rgba(10,10,15,0.85) 40%, rgba(10,10,15,0.5) 70%, transparent 100%)',
          zIndex: 15,
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          pointerEvents: showNaming ? 'auto' : 'none',
        }}
      >
        <p className="mb-4"
           style={{
             fontFamily: 'var(--font-prose)',
             fontStyle: 'italic',
             fontSize: '1.1rem',
             color: 'rgba(155,180,160,0.58)',
             textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
             letterSpacing: '0.05em',
           }}>
          You had a name once.
        </p>
        <input
          type="text"
          value={mortalName}
          onChange={e => setMortalName(e.target.value)}
          onKeyDown={e => {
            // Enter submits the name, as it does in every other text field (THR-1604).
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleContinue();
          }}
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
            fontFamily: 'var(--font-prose)',
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
          className="remembrance-choice cursor-pointer"
          style={{
            transition: 'color 0.3s ease',
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
            fontFamily: 'var(--font-prose)',
            fontStyle: 'italic',
            fontSize: '1rem',
            color: selectedFragment ? 'rgba(155,196,169,0.6)' : 'rgba(155,196,169,0.15)',
            letterSpacing: '0.08em',
            cursor: selectedFragment ? 'pointer' : 'default',
          }}
        >
          Continue
        </button>
        {/* THR-1716: a different origin can still be chosen until Continue. */}
        <ChooseAgainButton onClick={chooseAgain} color="rgba(155,196,169,0.4)" />
      </div>
    </div>
  );
}
