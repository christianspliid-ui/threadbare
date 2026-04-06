import { useCallback } from 'react';

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

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={testId}
      className="w-full text-left transition-all duration-300 cursor-pointer group"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? accentColor : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '12px',
        padding: '20px',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? `0 0 24px ${accentColor}20` : 'none',
      }}
    >
      <div className="flex gap-4 items-start">
        <div
          className="w-24 h-16 rounded-lg flex-shrink-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageAssetPath})`,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: selected ? '#e8e0f0' : '#a09090' }}
        >
          {prose}
        </p>
      </div>
      {selected && (
        <div
          className="mt-3 h-0.5 rounded-full transition-all duration-500"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
      )}
    </button>
  );
}
