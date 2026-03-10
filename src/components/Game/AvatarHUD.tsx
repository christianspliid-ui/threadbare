import { useMemo, useCallback } from 'react';
import { Tooltip } from '../shared/Tooltip';

interface AvatarHUDProps {
  avatarName: string;
  sphereColor: string;
  onCenterOnAvatar: () => void;
  onMoveClick: () => void;
  onWheelClick: () => void;
  onScryClick: () => void;
  onZoomToLocation?: () => void;
  moveMode?: boolean;
}

// Base style for all buttons
const BUTTON_BASE_STYLE = {
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: 'rgba(var(--bg-abyss-rgb), 0.6)',
  color: 'var(--accent-gold)',
  borderRadius: '0.25rem',
  transition: 'all 0.2s ease-out',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
} as const;

// Container background and border style — using CSS var with fallback
const CONTAINER_STYLE = {
  position: 'absolute' as const,
  top: '1rem',
  left: '1rem',
  backgroundColor: 'rgba(10, 10, 14, 0.85)', // Kept as fallback, CSS vars via JS don't support rgba() conversion
  border: '1px solid var(--border-subtle)',
  borderRadius: '0.375rem',
  padding: 'var(--space-3)',
  zIndex: 20,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  gap: 'var(--space-2)',
  minWidth: '160px',
};

// Row container for action buttons
const BUTTONS_ROW_STYLE = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-1)',
};

// Container for center button with accent bar
const CENTER_BUTTON_CONTAINER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
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
  color: 'var(--text-primary)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
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
  onZoomToLocation,
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
    (e.target as HTMLButtonElement).style.color = 'var(--text-primary)';
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
        <Tooltip id="ui.avatar_actions">
          <button onClick={onWheelClick} style={OTHER_BUTTON_STYLE}>
            Actions
          </button>
        </Tooltip>
        <Tooltip id="ui.avatar_scry">
          <button onClick={onScryClick} style={OTHER_BUTTON_STYLE}>
            Scry
          </button>
        </Tooltip>
      </div>

      {/* Avatar Center Button (simple action, not a toggle) */}
      <div style={CENTER_BUTTON_CONTAINER_STYLE}>
        {/* Accent Bar */}
        <div data-testid="avatar-accent" style={accentBarStyle} />
        {/* Center Button - single click centers map on avatar */}
        <button
          onClick={onCenterOnAvatar}
          style={CENTER_BUTTON_STYLE}
          onMouseEnter={handleCenterButtonMouseEnter}
          onMouseLeave={handleCenterButtonMouseLeave}
        >
          {avatarName}
        </button>
        {onZoomToLocation && (
          <Tooltip label="Zoom to Hex" desc="Navigate to the hex zoom view for your avatar's current location.">
            <button
              onClick={onZoomToLocation}
              aria-label="Zoom to avatar location"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent-gold-dim)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1,
                padding: '0.125rem',
                transition: 'opacity 0.2s',
              }}
            >
              &#x1F441;
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
