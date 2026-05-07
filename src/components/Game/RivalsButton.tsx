import { useState } from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalPanel } from './RivalPanel';
import { IconButton } from '../shared/IconButton';
import { Dropdown } from '../shared/Dropdown';

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
            aria-label={`${definitions.length} Rival God${definitions.length !== 1 ? 's' : ''}${maxHostility > 0 ? ` (highest hostility: ${Math.round(maxHostility * 100)}%)` : ''}`}
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
