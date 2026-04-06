import { useState, useCallback } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = useCallback((image: StirringImage) => {
    setSelectedId(image.id);
    setTimeout(() => onSelect(image), 800);
  }, [onSelect]);

  return (
    <div className="h-screen flex flex-col items-center justify-center"
         style={{ background: '#0a0a0f' }}>

      <p className="text-xl mb-16 text-center transition-opacity duration-700"
         style={{
           color: 'rgba(160,140,180,0.6)',
           fontStyle: 'italic',
           fontFamily: 'Georgia, "Times New Roman", serif',
           letterSpacing: '0.05em',
           opacity: selectedId ? 0 : 1,
         }}>
        Something stirs in the void. What echoes?
      </p>

      <div className="grid grid-cols-2 gap-1"
           style={{
             width: 'min(1200px, 88vw)',
             opacity: selectedId ? 0 : 1,
             transition: 'opacity 0.8s ease',
           }}>
        {images.map(image => {
          const placeholder = STIRRING_PLACEHOLDERS[image.id];
          const isHovered = hoveredId === image.id;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => handleSelect(image)}
              onMouseEnter={() => setHoveredId(image.id)}
              onMouseLeave={() => setHoveredId(null)}
              data-testid={`stirring-${image.id}`}
              className="relative cursor-pointer transition-all duration-700"
              style={{
                aspectRatio: '16/9',
                background: 'transparent',
                border: 'none',
                padding: 0,
                opacity: isHovered ? 1 : 0.65,
                filter: isHovered ? 'brightness(1.2)' : 'brightness(0.8)',
              }}
            >
              {/* Image with dissolved edges */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${image.imageAssetPath})`,
                  background: placeholder?.gradient ?? 'rgba(255,255,255,0.03)',
                  maskImage: 'radial-gradient(ellipse 85% 80% at center, black 40%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at center, black 40%, transparent 100%)',
                }}
              />
              {/* Label — barely visible, emerges on hover */}
              {placeholder && (
                <span
                  className="absolute bottom-6 left-0 right-0 text-center transition-opacity duration-500"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.15)',
                    opacity: isHovered ? 1 : 0,
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
