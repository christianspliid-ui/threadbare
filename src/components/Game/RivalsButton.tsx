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
        <IconButton
          icon={<span>⚔</span>}
          badge={definitions.length > 0 ? definitions.length : undefined}
          active={open}
          aria-label={`${definitions.length} Rival God${definitions.length !== 1 ? 's' : ''}${maxHostility > 0 ? ` (highest hostility: ${Math.round(maxHostility * 100)}%)` : ''}`}
          onClick={() => setOpen(o => !o)}
        />
      }
      open={open}
      onOpenChange={setOpen}
      align="right"
    >
      <RivalPanel definitions={definitions} states={states} />
    </Dropdown>
  );
}
