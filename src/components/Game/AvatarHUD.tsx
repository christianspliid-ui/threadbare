import { useMemo } from 'react';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';

interface AvatarHUDProps {
  avatarName?: string;
  sphereColor: string;
  onCenterOnAvatar?: () => void;
  onMoveClick: () => void;
  onWheelClick: () => void;
  onScryClick: () => void;
  onZoomToLocation?: () => void;
  moveMode?: boolean;
}

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
};

// Row container for action buttons
const BUTTONS_ROW_STYLE = {
  display: 'flex',
  gap: 'var(--space-2)',
};

// Move button active state: sphere-colored accent when moveMode is on
const MOVE_ACTIVE_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--accent-gold-glow)',
  borderColor: 'var(--accent-gold-dim)',
  color: 'var(--text-primary)',
};

export function AvatarHUD({
  sphereColor,
  onMoveClick,
  onWheelClick,
  onScryClick,
  moveMode = false,
}: AvatarHUDProps) {
  // Sphere-colored active state for Move button — only computed when moveMode or color changes
  const moveActiveStyle = useMemo<React.CSSProperties | undefined>(
    () => moveMode ? {
      backgroundColor: `${sphereColor}40`,
      borderLeft: `2px solid ${sphereColor}`,
      color: 'var(--text-primary)',
    } : undefined,
    [moveMode, sphereColor]
  );

  return (
    <div style={CONTAINER_STYLE}>
      {/* Action Buttons Row */}
      <div style={BUTTONS_ROW_STYLE}>
        <Tooltip id="ui.avatar_move">
          <Button
            variant={moveMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onMoveClick}
            style={moveActiveStyle}
          >
            Move
          </Button>
        </Tooltip>
        <Tooltip id="ui.avatar_actions">
          <Button variant="ghost" size="sm" onClick={onWheelClick}>
            Actions
          </Button>
        </Tooltip>
        <Tooltip id="ui.avatar_scry">
          <Button variant="ghost" size="sm" onClick={onScryClick}>
            Investiture
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
