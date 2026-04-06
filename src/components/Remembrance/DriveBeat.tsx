import { useState, useCallback } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface DriveBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment) => void;
}

export function DriveBeat({ fragments, onSelect }: DriveBeatProps) {
  const [selectedFragment, setSelectedFragment] = useState<RemembranceFragment | null>(null);
  const [fading, setFading] = useState(false);

  const handleSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setFading(true);
    setTimeout(() => onSelect(fragment), 800);
  }, [onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-lg italic mb-10 transition-opacity duration-500"
         style={{ color: '#c49bab', opacity: fading ? 0 : 1 }}>
        But there was something you could not release. Even now, it burns.
      </p>
      <div className="flex flex-col gap-4 max-w-2xl w-full transition-opacity duration-500"
           style={{ opacity: fading ? 0.3 : 1 }}>
        {fragments.map(fragment => (
          <FragmentCard
            key={fragment.id}
            prose={fragment.prose}
            imageAssetPath={fragment.imageAssetPath}
            selected={selectedFragment?.id === fragment.id}
            onClick={() => handleSelect(fragment)}
            accentColor="#b88c9a"
            testId={`drive-${fragment.id}`}
          />
        ))}
      </div>
    </div>
  );
}
