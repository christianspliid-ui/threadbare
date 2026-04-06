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
      className="text-left transition-all duration-300 cursor-pointer group flex-1 min-w-0"
      style={{
        background: selected
          ? `linear-gradient(180deg, ${accentColor}20, ${accentColor}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? accentColor : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? `0 4px 40px ${accentColor}25` : 'none',
      }}
    >
      {/* Large 16:9 image area — hero of the card */}
      <div
        className="w-full bg-cover bg-center"
        style={{
          aspectRatio: '16/9',
          backgroundImage: `url(${imageAssetPath})`,
          background: `linear-gradient(135deg, ${accentColor}18, rgba(255,255,255,0.04), ${accentColor}10)`,
          borderBottom: `1px solid ${selected ? `${accentColor}40` : 'rgba(255,255,255,0.06)'}`,
        }}
      />
      {/* Prose underneath the image */}
      <div className="p-5">
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: selected ? '#e8e0f0' : '#a09090' }}
        >
          {prose}
        </p>
      </div>
      {selected && (
        <div
          className="h-0.5 rounded-full mx-5 mb-4 transition-all duration-500"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
      )}
    </button>
  );
}
