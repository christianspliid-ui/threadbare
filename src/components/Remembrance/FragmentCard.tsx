import { useCallback, useState } from 'react';
import { CHOICE_ATTR } from './remembranceChoice';

/**
 * THR-1989: the card's words at rest. The picture dims until hover; the words do
 * not, so every choice reads before the pointer finds it (UI Law 45, 4.5:1 on the
 * #0a0a0f ground).
 */
export const FRAGMENT_CAPTION_REST_COLOR = 'rgba(206,196,182,0.86)';

interface FragmentCardProps {
  prose: string;
  imageAssetPath: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: string;
  testId?: string;
}

export function FragmentCard({
  prose,
  imageAssetPath,
  selected,
  onClick,
  accentColor = '#c9b8f0',
  testId,
}: FragmentCardProps) {
  const handleClick = useCallback(() => onClick(), [onClick]);
  const [hovered, setHovered] = useState(false);

  const isActive = selected || hovered;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      data-testid={testId}
      {...{ [CHOICE_ATTR]: '' }}
      className="remembrance-choice text-left cursor-pointer flex-1 min-w-0 relative"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {/* Image with dissolved edges — no borders, no corners */}
      <div
        className="w-full bg-cover bg-center"
        style={{
          aspectRatio: '16/9',
          backgroundImage: `url(${imageAssetPath}), linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.04), ${accentColor}10)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
          // THR-1989: only the picture dims at rest (was the whole card, words too).
          opacity: selected ? 1 : hovered ? 0.9 : 0.55,
          filter: selected ? 'brightness(1.15)' : hovered ? 'brightness(1.05)' : 'brightness(0.75)',
          // THR-1716: narrowed from `transition-all` (Law 41).
          transition: 'opacity 0.5s ease, filter 0.5s ease',
        }}
      />

      {/* Prose floating beneath the dissolved image */}
      <div className="px-2 pt-4 pb-2">
        <p
          className="leading-relaxed transition-colors duration-500"
          style={{
            font: 'var(--type-flavor)',
            color: isActive ? `${accentColor}ee` : FRAGMENT_CAPTION_REST_COLOR,
          }}
        >
          {prose}
        </p>
      </div>

      {/* Selected glow — a faint line of light, not a border */}
      {selected && (
        <div
          className="absolute bottom-0 left-4 right-4 transition-opacity duration-700"
          style={{
            height: '1px',
            background: `linear-gradient(to right, transparent, ${accentColor}60, transparent)`,
          }}
        />
      )}
    </button>
  );
}
