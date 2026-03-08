import { useMemo, useCallback } from 'react';
import { Tooltip } from '../shared/Tooltip';

interface AvatarHUDProps {
  avatarName: string;
  sphereColor: string;
  onCenterOnAvatar: () => void;
  onMoveClick: () => void;
  onWheelClick: () => void;
  onScryClick: () => void;
  moveMode?: boolean;
}

// Base style for all buttons
const BUTTON_BASE_STYLE = {
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
} as const;

// Container background and border style
const CONTAINER_STYLE = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  backgroundColor: 'rgba(10, 10, 14, 0.85)',
  border: '1px solid rgba(217, 119, 6, 0.2)',
  borderRadius: '0.375rem',
  padding: '0.75rem',
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.5rem',
  minWidth: '160px',
};

// Row container for action buttons
const BUTTONS_ROW_STYLE = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '0.25rem',
};

// Container for center button with accent bar
const CENTER_BUTTON_CONTAINER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

// Other button style (Wheel, Scry)
const OTHER_BUTTON_STYLE = {
  ...BUTTON_BASE_STYLE,
  opacity: 0.7,
};

// Center button style
const CENTER_BUTTON_STYLE = {
  flex: 1,
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: '#fef3c7',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontFamily: 'Cinzel, serif',
  textAlign: 'left' as const,
  transition: 'color 0.2s ease-out',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.03em',
  lineHeight: '1.2',
};

export function AvatarHUD({
  avatarName,
  sphereColor,
  onCenterOnAvatar,
  onMoveClick,
  onWheelClick,
  onScryClick,
  moveMode = false,
}: AvatarHUDProps) {
  // Memoize computed styles that depend on runtime props
  const moveButtonStyle = useMemo(
    () => ({
      ...BUTTON_BASE_STYLE,
      opacity: moveMode ? 1 : 0.6,
      backgroundColor: moveMode ? `${sphereColor}40` : 'rgba(10, 10, 14, 0.6)',
      borderLeft: moveMode ? `2px solid ${sphereColor}` : 'none',
    }),
    [moveMode, sphereColor]
  );

  const accentBarStyle = useMemo(
    () => ({
      width: '3px',
      height: '24px',
      backgroundColor: sphereColor,
      borderRadius: '0.125rem',
      boxShadow: `0 0 8px ${sphereColor}60`,
    }),
    [sphereColor]
  );

  // Memoize hover handlers for center button
  const handleCenterButtonMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.color = sphereColor;
  }, [sphereColor]);

  const handleCenterButtonMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.color = '#fef3c7';
  }, []);

  return (
    <div style={CONTAINER_STYLE}>
      {/* Action Buttons Row */}
      <div style={BUTTONS_ROW_STYLE}>
        <Tooltip id="ui.avatar_move">
          <button onClick={onMoveClick} style={moveButtonStyle}>
            Move
          </button>
        </Tooltip>
        <Tooltip id="ui.avatar_wheel">
          <button onClick={onWheelClick} style={OTHER_BUTTON_STYLE}>
            Wheel
          </button>
        </Tooltip>
        <Tooltip id="ui.avatar_scry">
          <button onClick={onScryClick} style={OTHER_BUTTON_STYLE}>
            Scry
          </button>
        </Tooltip>
      </div>

      {/* Avatar Center Button */}
      <div style={CENTER_BUTTON_CONTAINER_STYLE}>
        {/* Accent Bar */}
        <div data-testid="avatar-accent" style={accentBarStyle} />
        {/* Center Button */}
        <button
          onClick={onCenterOnAvatar}
          style={CENTER_BUTTON_STYLE}
          onMouseEnter={handleCenterButtonMouseEnter}
          onMouseLeave={handleCenterButtonMouseLeave}
        >
          Avatar
        </button>
      </div>
    </div>
  );
}
