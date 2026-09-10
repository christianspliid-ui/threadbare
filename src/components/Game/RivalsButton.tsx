import { useState } from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalPanel } from './RivalPanel';
import { IconButton } from '../shared/IconButton';
import { Dropdown } from '../shared/Dropdown';
import { hostilityLabel } from '../../data/uiColorPalette';

interface RivalsButtonProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

export function RivalsButton({ definitions, states }: RivalsButtonProps) {
  const [open, setOpen] = useState(false);

  const maxHostility = states.reduce((max, s) => Math.max(max, s.hostilityToPlayer ?? 0), 0);

  return (
    <Dropdown
      trigger={
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <IconButton
            icon={<span>⚔</span>}
            badge={definitions.length > 0 ? definitions.length : undefined}
            active={open}
            /* THR-1451: Law 13 binds this string. An `aria-label` is prose spoken to a
               player, so `highest hostility: 73%` put a percentage in one player's ear
               that no sighted player is shown — the visibility-parity clause running the
               wrong way. `hostilityLabel` is the reading `RivalPanel` already speaks, so
               the button now says the same words the panel behind it does.

               Distinct from `RivalPanel`'s `aria-valuenow`, which stays: that is the
               meter's machine value — the bar itself in accessible form — not a numeral
               rendered to anyone. Recorded in laws.md so this is not re-litigated. */
            aria-label={`${definitions.length} Rival God${definitions.length !== 1 ? 's' : ''}${maxHostility > 0 ? ` (highest hostility: ${hostilityLabel(maxHostility)})` : ''}`}
            onClick={() => setOpen(o => !o)}
          />
          <span className="topbar-section-label topbar-compact-hide">Rivals</span>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
      align="right"
    >
      <RivalPanel definitions={definitions} states={states} />
    </Dropdown>
  );
}
