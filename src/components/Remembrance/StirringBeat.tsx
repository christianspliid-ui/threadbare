import { useState } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';
import {
  useRemembranceChoice,
  handleChoiceRowKeyDown,
  ChooseAgainButton,
  CHOICE_ATTR,
  STIRRING_CHOSEN_HOLD_MS,
} from './remembranceChoice';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // THR-1716 U4: one click chooses; the chosen picture holds with "Choose again"
  // (and Escape) for STIRRING_CHOSEN_HOLD_MS, then the flow moves on.
  const { chosen, holdEnded, choose, chooseAgain } = useRemembranceChoice<StirringImage>({
    holdMs: STIRRING_CHOSEN_HOLD_MS,
    onHoldEnd: onSelect,
    lockOnHoldEnd: true,
  });

  const chosenPlaceholder = chosen ? STIRRING_PLACEHOLDERS[chosen.id] : null;

  return (
    <div className="h-screen relative overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Prompt */}
      <p className="absolute left-0 right-0 text-center"
         style={{
           top: '5vh',
           color: 'rgba(160,140,180,0.45)',
           fontStyle: 'italic',
           fontFamily: 'var(--font-prose)',
           fontSize: '1.5rem',
           letterSpacing: '0.06em',
           opacity: chosen ? 0 : 1,
           transition: 'opacity 0.7s ease',
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        Something stirs in the void. What echoes?
      </p>

      {/* ── REST STATE: 2x2 quadrant grid filling viewport ── */}
      {!chosen && (
        <div className="absolute inset-0"
             onKeyDown={handleChoiceRowKeyDown}
             style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          {images.map(image => {
            const placeholder = STIRRING_PLACEHOLDERS[image.id];
            const isHovered = hoveredId === image.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => choose(image)}
                onMouseEnter={() => setHoveredId(image.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(image.id)}
                onBlur={() => setHoveredId(null)}
                data-testid={`stirring-${image.id}`}
                {...{ [CHOICE_ATTR]: '' }}
                className="remembrance-choice relative overflow-hidden cursor-pointer"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              >
                {/* Art fill */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${image.imageAssetPath}), ${placeholder?.gradient ?? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03))'}`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isHovered ? 0.7 : 0.35,
                    filter: isHovered ? 'brightness(0.85)' : 'brightness(0.6)',
                    transform: isHovered ? 'scale(1)' : 'scale(1.02)',
                    transition: 'opacity 0.6s ease, filter 0.6s ease, transform 4s ease-out',
                  }}
                />
                {/* Inner vignette — dissolved edges between cells */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse 100% 100% at center, transparent 40%, #0a0a0f 85%)',
                  }}
                />
                {/* Label */}
                {placeholder && (
                  <span
                    className="absolute left-0 right-0 text-center"
                    style={{
                      bottom: '12%',
                      fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase' as const,
                      color: 'rgba(255,255,255,0.12)',
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      zIndex: 2,
                    }}>
                    {placeholder.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── CHOSEN STATE: full-bleed art, held before the flow moves on ── */}
      {chosen && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${chosen.imageAssetPath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: holdEnded ? 0 : 0.8,
            maskImage: 'radial-gradient(ellipse 95% 90% at center, black 30%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at center, black 30%, transparent 90%)',
            filter: holdEnded ? 'brightness(1.4) blur(4px)' : 'none',
            transition: 'opacity 1s ease, filter 1s ease',
          }}
          data-testid={`stirring-chosen-${chosen.id}`}
        />
      )}

      {/* Bottom reading zone: the chosen label and the undo */}
      {chosen && !holdEnded && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
          style={{
            padding: '0 8vw 5vh',
            background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
            zIndex: 10,
          }}
        >
          {chosenPlaceholder && (
            <span style={{
              fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
              fontSize: '1.5rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '16px',
            }}>
              {chosenPlaceholder.label}
            </span>
          )}
          <ChooseAgainButton onClick={chooseAgain} />
        </div>
      )}
    </div>
  );
}
