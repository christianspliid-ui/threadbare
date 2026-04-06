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
  { x: -24, y: -15, scale: 0.82, rotate: -1.5 },
  { x: 22,  y: -11, scale: 0.72, rotate: 1.2 },
  { x: -20, y: 17,  scale: 0.76, rotate: 0.8 },
  { x: 23,  y: 19,  scale: 0.88, rotate: -0.6 },
];

/** Peripheral positions when another image is focused. */
const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.40, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.42, rotate: 1.8 },
  { x: 40,  y: 16,  scale: 0.48, rotate: -2 },
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
        transform: 'translate(-50%, -50%) scale(1.1)',
        opacity: 1,
        filter: 'brightness(1.1)',
        zIndex: 5,
      };
    }

    if (somethingFocused) {
      const p = PERIPHERAL_POSITIONS[slot] ?? PERIPHERAL_POSITIONS[0];
      return {
        transform: `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) scale(${p.scale}) rotate(${p.rotate}deg)`,
        opacity: 0.3,
        filter: 'brightness(0.4)',
        zIndex: 1,
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
              width: 'min(560px, 42vw)',
              aspectRatio: '16/9',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
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
            {/* Label — only when focused */}
            {placeholder && (
              <span
                className="absolute bottom-4 left-0 right-0 text-center transition-opacity duration-600"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.2)',
                  opacity: isFocused ? 1 : 0,
                  letterSpacing: '0.08em',
                  pointerEvents: 'none',
                }}>
                {placeholder.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
