import { useState, useCallback } from 'react';
import type { StirringImage } from '../../types/remembrance';
import { STIRRING_PLACEHOLDERS } from '../../data/stirring-images';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  const handleSelect = useCallback((image: StirringImage) => {
    setSelectedId(image.id);
    setFading(true);
    setTimeout(() => onSelect(image), 600);
  }, [onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-lg italic mb-12 transition-opacity duration-500"
         style={{ color: '#8a7a9a', opacity: fading ? 0 : 1 }}>
        Something stirs in the void. What echoes?
      </p>
      <div className="grid grid-cols-2 gap-6 max-w-2xl transition-opacity duration-500"
           style={{ opacity: fading && !selectedId ? 0 : 1 }}>
        {images.map(image => {
          const placeholder = STIRRING_PLACEHOLDERS[image.id];
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => handleSelect(image)}
              data-testid={`stirring-${image.id}`}
              className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-500"
              style={{
                aspectRatio: '16/10',
                opacity: selectedId && selectedId !== image.id ? 0 : 1,
                transform: selectedId === image.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedId === image.id ? '0 0 40px rgba(200,180,240,0.2)' : 'none',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-full h-full bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundImage: `url(${image.imageAssetPath})`,
                  background: placeholder?.gradient ?? 'rgba(255,255,255,0.05)',
                }}
              >
                {placeholder && (
                  <span className="text-sm italic" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {placeholder.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
