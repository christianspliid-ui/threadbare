import type { ReactNode } from 'react';

interface ComicPanelProps {
  sceneImagePath: string;
  scenePlaceholder: string;
  characterImagePath: string;
  characterPlaceholder: string;
  characterPosition?: 'left' | 'right';
  children?: ReactNode;
}

export function ComicPanel({
  sceneImagePath,
  scenePlaceholder,
  characterImagePath,
  characterPlaceholder,
  characterPosition = 'left',
  children,
}: ComicPanelProps) {
  const isLeft = characterPosition === 'left';

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 16:9 Scene backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${sceneImagePath}), ${scenePlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark gradient overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.6) 35%, rgba(10,10,15,0.1) 60%, transparent 100%)',
        }}
      />

      {/* 4:3 Character overlay */}
      <div
        className="absolute bottom-0"
        style={{
          [isLeft ? 'left' : 'right']: '2vw',
          width: 'min(500px, 35vw)',
          aspectRatio: '3/4',
          backgroundImage: `url(${characterImagePath}), ${characterPlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          maskImage: `linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%),
                      linear-gradient(to ${isLeft ? 'right' : 'left'}, black 0%, black 70%, transparent 100%)`,
          maskComposite: 'intersect',
          WebkitMaskImage: `linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%),
                           linear-gradient(to ${isLeft ? 'right' : 'left'}, black 0%, black 70%, transparent 100%)`,
          WebkitMaskComposite: 'source-in',
        }}
      />

      {/* Content overlay (prose, choices) — top spacer keeps content in lower ~55% */}
      <div className="absolute inset-0 flex flex-col">
        <div style={{ flexShrink: 0, minHeight: '30%' }} />
        <div className="flex-1 overflow-y-auto flex flex-col justify-end">
          {children}
        </div>
      </div>
    </div>
  );
}
