import { useState, useRef, useEffect } from 'react';
import type { RivalDefinition, RivalState } from '../../types/rival';
import { RivalPanel } from './RivalPanel';

interface RivalsButtonProps {
  definitions: RivalDefinition[];
  states: RivalState[];
}

export function RivalsButton({ definitions, states }: RivalsButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const maxHostility = states.reduce((max, s) => Math.max(max, s.hostilityToPlayer ?? 0), 0);
  const hostilityColor =
    maxHostility > 0.7 ? '#dc2626' :
    maxHostility > 0.4 ? '#ea580c' :
    'var(--text-muted)';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors"
        style={{
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: open ? 'var(--bg-raised)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-subtle)' : 'transparent'}`,
        }}
        title="Rival Gods"
      >
        <span style={{ color: hostilityColor }}>⚔</span>
        <span>{definitions.length > 0 ? `${definitions.length} Rival${definitions.length !== 1 ? 's' : ''}` : 'Rivals'}</span>
        {maxHostility > 0.5 && (
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: hostilityColor }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
          style={{
            width: '260px',
            background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            padding: 'var(--panel-padding)',
          }}
        >
          <RivalPanel definitions={definitions} states={states} />
        </div>
      )}
    </div>
  );
}
