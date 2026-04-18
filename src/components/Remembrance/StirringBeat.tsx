import { useState, useCallback, useMemo } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const focusedIndex = useMemo(() => {
    if (!focusedId) return -1;
    return images.findIndex(img => img.id === focusedId);
  }, [focusedId, images]);

  const focusedImage = focusedIndex >= 0 ? images[focusedIndex] : null;

  const handleClick = useCallback((image: StirringImage) => {
    if (confirmedId) return;

    if (focusedId === image.id) {
      setConfirmedId(image.id);
      setTimeout(() => onSelect(image), 1200);
    } else {
      setFocusedId(image.id);
    }
  }, [focusedId, confirmedId, onSelect]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedId || focusedIndex < 0) return;
    const next = (focusedIndex + direction + images.length) % images.length;
    setFocusedId(images[next].id);
  }, [confirmedId, focusedIndex, images]);

  const focusedPlaceholder = focusedId ? STIRRING_PLACEHOLDERS[focusedId] : null;
  const isBrowsing = focusedId !== null && !confirmedId;

  return (
    <div className="h-screen relative overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Prompt */}
      <p className="absolute left-0 right-0 text-center transition-all duration-700"
         style={{
           top: '5vh',
           color: 'rgba(160,140,180,0.45)',
           fontStyle: 'italic',
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontSize: '1.5rem',
           letterSpacing: '0.06em',
           opacity: confirmedId ? 0 : focusedId ? 0.35 : 1,
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        {focusedId
          ? 'Click again to choose. Or reach for another.'
          : 'Something stirs in the void. What echoes?'}
      </p>

      {/* ── REST STATE: 2x2 quadrant grid filling viewport ── */}
      {!focusedId && !confirmedId && (
        <div className="absolute inset-0"
             style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          {images.map(image => {
            const placeholder = STIRRING_PLACEHOLDERS[image.id];
            const isHovered = hoveredId === image.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => handleClick(image)}
                onMouseEnter={() => setHoveredId(image.id)}
                onMouseLeave={() => setHoveredId(null)}
                data-testid={`stirring-${image.id}`}
                className="relative overflow-hidden cursor-pointer"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              >
                {/* Art fill */}
                <div
                  className="absolute inset-0 transition-all duration-700"
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
                    className="absolute left-0 right-0 text-center transition-all duration-500"
                    style={{
                      bottom: '12%',
                      fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase' as const,
                      color: 'rgba(255,255,255,0.12)',
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
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

      {/* ── FOCUSED STATE: full-bleed art ── */}
      {focusedImage && (
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            backgroundImage: `url(${focusedImage.imageAssetPath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: confirmedId ? 0 : 0.8,
            transform: 'scale(1)',
            maskImage: 'radial-gradient(ellipse 95% 90% at center, black 30%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 90% at center, black 30%, transparent 90%)',
            filter: confirmedId ? 'brightness(1.4) blur(4px)' : 'none',
          }}
          onClick={() => focusedImage && handleClick(focusedImage)}
          data-testid={`stirring-${focusedImage.id}`}
        />
      )}

      {/* Bottom reading zone with label */}
      {focusedPlaceholder && !confirmedId && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center transition-all duration-700"
          style={{
            padding: '0 8vw 5vh',
            background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 30%, rgba(10,10,15,0.4) 60%, transparent 100%)',
            zIndex: 10,
            opacity: 1,
          }}
        >
          <span style={{
            fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
            fontSize: '1.5rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.2)',
            marginBottom: '16px',
          }}>
            {focusedPlaceholder.label}
          </span>
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

      {/* Navigation arrows */}
      {isBrowsing && (
        <>
          <button
            type="button"
            onClick={() => handleNav(-1)}
            className="absolute cursor-pointer"
            style={{
              left: '2vw', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: '2rem 1.5rem',
              zIndex: 20, color: 'rgba(160,140,180,0.3)',
              fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
              lineHeight: 1, transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Previous image"
          >&#x2039;</button>
          <button
            type="button"
            onClick={() => handleNav(1)}
            className="absolute cursor-pointer"
            style={{
              right: '2vw', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: '2rem 1.5rem',
              zIndex: 20, color: 'rgba(160,140,180,0.3)',
              fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
              lineHeight: 1, transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Next image"
          >&#x203a;</button>
        </>
      )}
    </div>
  );
}
