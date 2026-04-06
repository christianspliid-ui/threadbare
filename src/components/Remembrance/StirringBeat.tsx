import { useState, useCallback, useMemo } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

/**
 * Spatial positions for each image slot when no image is selected.
 * x/y as % offset from center, z as depth (0 = front, negative = back).
 * Each image floats at a different depth to create parallax.
 */
const REST_POSITIONS = [
  { x: -22, y: -16, z: -40,  rotate: -1.5 },  // top-left, slightly back
  { x: 24,  y: -12, z: -80,  rotate: 1.2 },   // top-right, further back
  { x: -18, y: 18,  z: -60,  rotate: 0.8 },   // bottom-left, mid-depth
  { x: 20,  y: 20,  z: -20,  rotate: -0.6 },   // bottom-right, closest
];

/** Peripheral positions when another image is selected (pushed to edges). */
const PERIPHERAL_POSITIONS = [
  { x: -42, y: -8,  z: -120, rotate: -3 },
  { x: 44,  y: -14, z: -140, rotate: 2.5 },
  { x: -40, y: 16,  z: -130, rotate: 1.8 },
  { x: 42,  y: 18,  z: -110, rotate: -2 },
];

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Assign each image a stable slot index for positioning
  const slotMap = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((img, i) => map.set(img.id, i));
    return map;
  }, [images]);

  const handleClick = useCallback((image: StirringImage) => {
    if (confirmedId) return; // already confirmed, wait for transition

    if (focusedId === image.id) {
      // Second click on focused image = confirm selection
      setConfirmedId(image.id);
      setTimeout(() => onSelect(image), 1200);
    } else {
      // First click = bring to focus
      setFocusedId(image.id);
    }
  }, [focusedId, confirmedId, onSelect]);

  const getTransform = (imageId: string, slot: number) => {
    const isFocused = focusedId === imageId;
    const isConfirmed = confirmedId === imageId;
    const isHovered = hoveredId === imageId;
    const somethingFocused = focusedId !== null;

    if (isConfirmed) {
      // Confirmed: zoom to fill, fade out edges
      return {
        transform: 'translate(-50%, -50%) translateZ(100px) scale(1.6)',
        opacity: 0,
        filter: 'brightness(1.3)',
      };
    }

    if (isFocused) {
      // Focused: center, foreground, large
      return {
        transform: 'translate(-50%, -50%) translateZ(0px) scale(1.15)',
        opacity: 1,
        filter: 'brightness(1.1)',
      };
    }

    if (somethingFocused) {
      // Another image is focused: drift to periphery
      const p = PERIPHERAL_POSITIONS[slot] ?? PERIPHERAL_POSITIONS[0];
      return {
        transform: `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) translateZ(${p.z}px) rotate(${p.rotate}deg) scale(0.55)`,
        opacity: 0.35,
        filter: 'brightness(0.5)',
      };
    }

    // Default: floating at rest positions
    const r = REST_POSITIONS[slot] ?? REST_POSITIONS[0];
    const hoverLift = isHovered ? 30 : 0;
    return {
      transform: `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) translateZ(${r.z + hoverLift}px) rotate(${r.rotate}deg) scale(${isHovered ? 0.92 : 0.85})`,
      opacity: isHovered ? 0.95 : 0.6,
      filter: isHovered ? 'brightness(1.15)' : 'brightness(0.7)',
    };
  };

  return (
    <div className="h-screen relative overflow-hidden"
         style={{
           background: '#0a0a0f',
           perspective: '1200px',
           perspectiveOrigin: '50% 50%',
         }}>

      {/* Floating prompt text */}
      <p className="absolute left-0 right-0 text-center transition-all duration-700"
         style={{
           top: '8vh',
           color: 'rgba(160,140,180,0.5)',
           fontStyle: 'italic',
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontSize: '1.3rem',
           letterSpacing: '0.06em',
           opacity: confirmedId ? 0 : focusedId ? 0.3 : 1,
           transform: confirmedId ? 'translateY(-20px)' : 'translateY(0)',
           zIndex: 10,
         }}>
        {focusedId
          ? 'Click again to choose. Or reach for another.'
          : 'Something stirs in the void. What echoes?'}
      </p>

      {/* 3D space for floating images */}
      <div className="absolute inset-0"
           style={{ transformStyle: 'preserve-3d' }}>
        {images.map(image => {
          const slot = slotMap.get(image.id) ?? 0;
          const placeholder = STIRRING_PLACEHOLDERS[image.id];
          const isFocused = focusedId === image.id;
          const { transform, opacity, filter } = getTransform(image.id, slot);

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
                transform,
                opacity,
                filter,
                transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
                zIndex: isFocused ? 5 : 1,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Image with dissolved edges */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${image.imageAssetPath})`,
                  background: placeholder?.gradient ?? 'rgba(255,255,255,0.03)',
                  maskImage: 'radial-gradient(ellipse 90% 85% at center, black 35%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 35%, transparent 95%)',
                }}
              />
              {/* Label — whispered, only when focused */}
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
                  }}>
                  {placeholder.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
