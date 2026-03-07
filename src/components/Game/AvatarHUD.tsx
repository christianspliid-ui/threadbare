interface AvatarHUDProps {
  avatarName: string;
  sphereColor: string;
  onCenterOnAvatar: () => void;
  onMoveClick: () => void;
  onWheelClick: () => void;
  onScryClick: () => void;
  moveMode?: boolean;
}

export function AvatarHUD({
  avatarName,
  sphereColor,
  onCenterOnAvatar,
  onMoveClick,
  onWheelClick,
  onScryClick,
  moveMode = false,
}: AvatarHUDProps) {
  const buttonBaseStyle = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'rgba(10, 10, 14, 0.6)',
    color: '#fbbf24',
    borderRadius: '0.25rem',
    transition: 'all 0.2s ease-out',
    fontFamily: 'Cinzel, serif',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const moveButtonStyle = {
    ...buttonBaseStyle,
    opacity: moveMode ? 1 : 0.6,
    backgroundColor: moveMode ? `${sphereColor}40` : 'rgba(10, 10, 14, 0.6)',
    borderLeft: moveMode ? `2px solid ${sphereColor}` : 'none',
  };

  const otherButtonStyle = {
    ...buttonBaseStyle,
    opacity: 0.7,
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        backgroundColor: 'rgba(10, 10, 14, 0.85)',
        border: '1px solid rgba(217, 119, 6, 0.2)',
        borderRadius: '0.375rem',
        padding: '0.75rem',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '160px',
      }}
    >
      {/* Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.25rem',
        }}
      >
        <button onClick={onMoveClick} style={moveButtonStyle} title="Move">
          Move
        </button>
        <button onClick={onWheelClick} style={otherButtonStyle} title="Divine Wheel">
          Wheel
        </button>
        <button onClick={onScryClick} style={otherButtonStyle} title="Scry">
          Scry
        </button>
      </div>

      {/* Avatar Center Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {/* Accent Bar */}
        <div
          data-testid="avatar-accent"
          style={{
            width: '3px',
            height: '24px',
            backgroundColor: sphereColor,
            borderRadius: '0.125rem',
            boxShadow: `0 0 8px ${sphereColor}60`,
          }}
        />
        {/* Center Button */}
        <button
          onClick={onCenterOnAvatar}
          style={{
            flex: 1,
            padding: 0,
            border: 'none',
            backgroundColor: 'transparent',
            color: '#fef3c7',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Cinzel, serif',
            textAlign: 'left',
            transition: 'color 0.2s ease-out',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: '1.2',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.color = sphereColor;
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.color = '#fef3c7';
          }}
        >
          Avatar
        </button>
      </div>
    </div>
  );
}
