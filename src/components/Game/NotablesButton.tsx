/**
 * Notables top-bar button (THR-630) — opens the Notables intent panel.
 * Mirrors RivalsButton (icon + count badge + Dropdown).
 */
import { useState, useMemo } from 'react';
import type { GameState } from '../../types/gameState';
import { NotablesPanel, countShownNotables } from './NotablesPanel';
import { IconButton } from '../shared/IconButton';
import { Dropdown } from '../shared/Dropdown';

interface NotablesButtonProps {
  gameState: GameState;
}

export function NotablesButton({ gameState }: NotablesButtonProps) {
  const [open, setOpen] = useState(false);

  // THR-1780: the badge counts the notables the panel lists — it used to count active
  // agendas only, so it read 2 over a list of 19. Keyed on `tick` because the graph and
  // the compositions array are mutated in place; their identity never changes.
  const notableCount = useMemo(
    () => countShownNotables(gameState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.activeCompositions, gameState.tick],
  );

  return (
    <Dropdown
      trigger={
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <IconButton
            icon={<span>♛</span>}
            badge={notableCount > 0 ? notableCount : undefined}
            active={open}
            aria-label={`${notableCount} notable${notableCount !== 1 ? 's' : ''}`}
            onClick={() => setOpen(o => !o)}
          />
          {/* THR-1604: the word is part of the chip. Players click the label, not the
              icon; a dead label reads as a broken panel. Mouse-only — the icon
              button already carries the accessible name and keyboard focus. */}
          <span
            className="topbar-section-label topbar-compact-hide"
            data-testid="notables-chip-label"
            aria-hidden="true"
            style={{ cursor: 'pointer' }}
            onClick={() => setOpen(o => !o)}
          >
            Notables
          </span>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
      align="right"
    >
      {/* THR-1780: a name opens its card in a modal; the portalled dropdown sits above the
          modal layer, so it closes rather than stay lit over the card's backdrop. Every
          button inside a row is a name link. */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[role="listitem"] button')) setOpen(false);
        }}
      >
        <NotablesPanel gameState={gameState} />
      </div>
    </Dropdown>
  );
}
