import { useState, useCallback, useMemo } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

/**
 * Spatial positions for each image slot at rest.
 * x/y as % offset from center. Scale simulates depth (smaller = further away).
 */
const REST_POSITIONS = [
  { x: -26, y: -16, scale: 0.88, rotate: -1.5 },
  { x: 24,  y: -12, scale: 0.78, rotate: 1.2 },
  { x: -22, y: 18,  scale: 0.82, rotate: 0.8 },
  { x: 25,  y: 20,  scale: 0.94, rotate: -0.6 },
];

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const slotMap = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((img, i) => map.set(img.id, i));
    return map;
  }, [images]);

  const focusedIndex = useMemo(() => {
    if (!focusedId) return -1;
    return images.findIndex(img => img.id === focusedId);
  }, [focusedId, images]);

  const handleClick = useCallback((image: StirringImage) => {
    if (confirmedId) return;

    if (focusedId === image.id) {
      // Second click = confirm
      setConfirmedId(image.id);
      setTimeout(() => onSelect(image), 1200);
    } else {
      // First click = focus
      setFocusedId(image.id);
    }
  }, [focusedId, confirmedId, onSelect]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedId || focusedIndex < 0) return;
    const next = (focusedIndex + direction + images.length) % images.length;
    setFocusedId(images[next].id);
  }, [confirmedId, focusedIndex, images]);

  const getStyle = (imageId: string, slot: number): React.CSSProperties => {
    const isFocused = focusedId === imageId;
    const isConfirmed = confirmedId === imageId;
    const isHovered = hoveredId === imageId;
    const somethingFocused = focusedId !== null;

    if (isConfirmed) {
      return {
        transform: 'translate(-50%, -50%) scale(1.8)',
        opacity: 0,
        filter: 'brightness(1.4) blur(4px)',
        zIndex: 10,
      };
    }

    if (isFocused) {
      return {
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        filter: 'brightness(1.1)',
        zIndex: 5,
        top: '42%',
        width: 'min(1100px, 58vw)',
      };
    }

    if (somethingFocused) {
      return {
        transform: 'translate(-50%, -50%) scale(0)',
        opacity: 0,
        filter: 'brightness(0)',
        zIndex: 1,
        pointerEvents: 'none' as const,
      };
    }

    // At rest
    const r = REST_POSITIONS[slot] ?? REST_POSITIONS[0];
    const hoverScale = isHovered ? r.scale + 0.06 : r.scale;
    return {
      transform: `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) scale(${hoverScale}) rotate(${r.rotate}deg)`,
      opacity: isHovered ? 0.95 : 0.55,
      filter: isHovered ? 'brightness(1.15)' : 'brightness(0.65)',
      zIndex: isHovered ? 3 : 2,
    };
  };

  const focusedPlaceholder = focusedId ? STIRRING_PLACEHOLDERS[focusedId] : null;

  return (
    <div className="h-screen relative overflow-hidden"
         style={{ background: '#0a0a0f' }}>

      {/* Floating prompt */}
      <p className="absolute left-0 right-0 text-center transition-all duration-700"
         style={{
           top: '7vh',
           color: 'rgba(160,140,180,0.5)',
           fontStyle: 'italic',
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontSize: '1.3rem',
           letterSpacing: '0.06em',
           opacity: confirmedId ? 0 : focusedId ? 0.4 : 1,
           zIndex: 20,
           pointerEvents: 'none',
         }}>
        {focusedId
          ? 'Click again to choose. Or reach for another.'
          : 'Something stirs in the void. What echoes?'}
      </p>

      {/* Floating images — 2D transforms only for reliable click targets */}
      {images.map(image => {
        const slot = slotMap.get(image.id) ?? 0;
        const placeholder = STIRRING_PLACEHOLDERS[image.id];
        const isFocused = focusedId === image.id;
        const style = getStyle(image.id, slot);

        return (
          <button
            key={image.id}
            type="button"
            onClick={() => handleClick(image)}
            onMouseEnter={() => setHoveredId(image.id)}
            onMouseLeave={() => setHoveredId(null)}
            data-testid={`stirring-${image.id}`}
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(850px, 48vw)',
              aspectRatio: '16/9',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease, top 1s cubic-bezier(0.23, 1, 0.32, 1), width 1s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Image with dissolved edges */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${image.imageAssetPath}), ${placeholder?.gradient ?? 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03))'}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
              }}
            />
          </button>
        );
      })}

      {/* Label — below the focused image */}
      <p
        className="absolute left-0 right-0 text-center transition-all duration-700"
        style={{
          bottom: '13vh',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.6rem',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.1em',
          opacity: confirmedId ? 0 : focusedPlaceholder ? 1 : 0,
          zIndex: 20,
          pointerEvents: 'none',
        }}>
        {focusedPlaceholder?.label ?? ''}
      </p>

      {/* Navigation arrows — visible when focused */}
      {focusedId && !confirmedId && (
        <>
          {/* Left arrow */}
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
            aria-label="Previous image"
          >
            &#x2039;
          </button>
          {/* Right arrow */}
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
            aria-label="Next image"
          >
            &#x203a;
          </button>
        </>
      )}
    </div>
  );
}
