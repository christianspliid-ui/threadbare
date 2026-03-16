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
        className="relative flex items-center justify-center px-2 py-1 rounded transition-colors"
        style={{
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-body)',
          color: open ? 'var(--text-primary)' : hostilityColor,
          background: open ? 'var(--bg-raised)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-subtle)' : 'transparent'}`,
          minWidth: '2rem',
        }}
        title={`${definitions.length} Rival God${definitions.length !== 1 ? 's' : ''}${maxHostility > 0 ? ` (highest hostility: ${Math.round(maxHostility * 100)}%)` : ''}`}
      >
        <span>⚔</span>
        {definitions.length > 0 && (
          <span
            className="absolute font-mono"
            style={{
              fontSize: '0.6rem',
              top: '0.1rem',
              right: '0.15rem',
              color: hostilityColor,
              lineHeight: 1,
            }}
          >
            {definitions.length}
          </span>
        )}
        {maxHostility > 0.5 && (
          <span
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{ backgroundColor: hostilityColor, bottom: '0.1rem', right: '0.1rem' }}
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
