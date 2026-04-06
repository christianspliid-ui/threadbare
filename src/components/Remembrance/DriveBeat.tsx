import { useState, useCallback, useEffect } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface DriveBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment) => void;
}

export function DriveBeat({ fragments, onSelect }: DriveBeatProps) {
  const [selectedFragment, setSelectedFragment] = useState<RemembranceFragment | null>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setCardsVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setFading(true);
    setTimeout(() => onSelect(fragment), 1000);
  }, [onSelect]);

  return (
    <div className="h-screen flex flex-col items-center justify-center"
         style={{ background: '#0a0a0f' }}>

      <p className="mb-14 text-center transition-all duration-1000"
         style={{
           fontFamily: 'Georgia, "Times New Roman", serif',
           fontStyle: 'italic',
           fontSize: '1.4rem',
           color: 'rgba(196,155,171,0.5)',
           letterSpacing: '0.06em',
           opacity: textVisible && !fading ? 1 : 0,
           transform: textVisible ? 'translateY(0)' : 'translateY(12px)',
         }}>
        But there was something you could not release. Even now, it burns.
      </p>

      <div className="flex gap-8 transition-all duration-700"
           style={{
             width: 'min(1200px, 92vw)',
             opacity: cardsVisible && !fading ? 1 : fading ? 0.2 : 0,
             transform: cardsVisible ? 'translateY(0)' : 'translateY(20px)',
           }}>
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
