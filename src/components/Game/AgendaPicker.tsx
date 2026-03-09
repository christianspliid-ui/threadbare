import { useEffect } from 'react';
import type { AgendaTemplate } from '../../data/agenda-content';
import type { SphereName } from '../../types';

const SPHERE_COLORS: Record<string, string> = {
  force: '#cc3333',
  matter: '#8b7355',
  energy: '#ff6600',
  life: '#33aa33',
  mind: '#6699cc',
  spirit: '#cc99ff',
  time: '#ff9933',
  entropy: '#666666',
};

interface AgendaPickerProps {
  agendas: AgendaTemplate[];
  onSelect: (agenda: AgendaTemplate) => void;
  onCancel: () => void;
  sphere: SphereName;
}

export function AgendaPicker({ agendas, onSelect, onCancel, sphere }: AgendaPickerProps) {
  const sphereColor = SPHERE_COLORS[sphere] ?? '#d4a574';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div
        data-testid="agenda-picker-backdrop"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Panel */}
      <div
        className="relative border rounded-lg p-4 w-80 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <h3
          className="text-sm font-bold mb-3 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Choose Your Agenda
        </h3>

        <div className="space-y-2">
          {agendas.map((agenda) => (
            <button
              key={agenda.id}
              onClick={() => onSelect(agenda)}
              className="w-full text-left p-3 rounded border transition-all duration-150 group"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderColor: 'var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sphereColor }}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {agenda.name}
                </span>
              </div>
              <p className="italic leading-relaxed pl-4" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                {agenda.narrativeHook}
              </p>
              <div className="flex items-center gap-3 mt-1.5 pl-4">
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  {agenda.reachBoost.reach} +{Math.round(agenda.reachBoost.bonus * 100)}%
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  {agenda.behaviorTag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
