/**
 * Notables top-bar button (THR-630) — opens the Notables intent panel.
 * Mirrors RivalsButton (icon + count badge + Dropdown).
 */
import { useState, useMemo } from 'react';
import type { GameState } from '../../types/gameState';
import { NotablesPanel } from './NotablesPanel';
import { IconButton } from '../shared/IconButton';
import { Dropdown } from '../shared/Dropdown';

interface NotablesButtonProps {
  gameState: GameState;
}

export function NotablesButton({ gameState }: NotablesButtonProps) {
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(
    () =>
      (gameState.activeCompositions ?? []).filter(
        (c) => c.sponsorNotableId && c.agendaFamily && c.status === 'active',
      ).length,
    [gameState.activeCompositions],
  );

  return (
    <Dropdown
      trigger={
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <IconButton
            icon={<span>♛</span>}
            badge={activeCount > 0 ? activeCount : undefined}
            active={open}
            aria-label={`${activeCount} active notable agenda${activeCount !== 1 ? 's' : ''}`}
            onClick={() => setOpen(o => !o)}
          />
          <span className="topbar-section-label topbar-compact-hide">Notables</span>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
      align="right"
    >
      <NotablesPanel gameState={gameState} />
    </Dropdown>
  );
}
