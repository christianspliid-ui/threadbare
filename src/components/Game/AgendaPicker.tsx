import { useEffect } from 'react';
import type { AgendaTemplate } from '../../data/agenda-content';
import type { SphereName } from '../../types';
import { getSphereColor } from '../../data/sphereIcons';

interface AgendaPickerProps {
  agendas: AgendaTemplate[];
  onSelect: (agenda: AgendaTemplate) => void;
  onCancel: () => void;
  sphere: SphereName;
}

export function AgendaPicker({ agendas, onSelect, onCancel, sphere }: AgendaPickerProps) {
  const sphereColor = getSphereColor(sphere);

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
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      {/* Panel — widened from w-80 to max-w-md for readability */}
      <div
        className="relative border rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          width: 'min(28rem, 90vw)',
        }}
      >
        {/* Header strip */}
        <div
          className="px-6 pt-5 pb-4"
          style={{
            borderBottom: `2px solid ${sphereColor}30`,
          }}
        >
          <h3
            className="font-bold text-center"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xl)',
            }}
          >
            Choose Your Agenda
          </h3>
        </div>

        {/* Agenda list */}
        <div className="px-6 py-4 space-y-3">
          {agendas.map((agenda) => (
            <button
              key={agenda.id}
              onClick={() => onSelect(agenda)}
              className="w-full text-left p-4 rounded-lg border transition-all duration-150 group"
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
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sphereColor }}
                />
                <span
                  className="font-bold"
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                >
                  {agenda.name}
                </span>
              </div>
              <p
                className="italic leading-relaxed pl-5"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {agenda.narrativeHook}
              </p>
              <div className="flex items-center gap-4 mt-2 pl-5">
                <span
                  className="font-semibold"
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {agenda.reachBoost.reach} +{Math.round(agenda.reachBoost.bonus * 100)}%
                </span>
                <span
                  className="font-semibold"
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
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
