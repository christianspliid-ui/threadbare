import type { InterventionType, DeliveryMode, LocalEncounterMode } from '../../types/dream';
import type { SphereName } from '../../types/index';

export interface InterventionConfirmProps {
  interventionType: InterventionType;
  label: string;
  deliveryMode: DeliveryMode;
  essenceCost: number;
  sphere: SphereName;
  detectionRisk: number;
  rangeStatus: 'in_range' | 'out_of_range' | 'unlimited' | 'unknown';
  hexDistance: number | null;
  description: string;
  /** Available essence in the relevant sphere — used to disable confirm when can't afford */
  availableEssence?: number;
  /** Name of the selected agenda, if any */
  agendaName?: string;
  /** Narrative hook text from the selected agenda */
  agendaNarrativeHook?: string;
  onConfirm: (encounterMode?: LocalEncounterMode) => void;
  onCancel: () => void;
}

export function InterventionConfirm(props: InterventionConfirmProps) {
  const {
    label,
    deliveryMode,
    essenceCost,
    sphere,
    detectionRisk,
    rangeStatus,
    hexDistance,
    description,
    onConfirm,
    onCancel,
  } = props;

  const isOutOfRange = rangeStatus === 'out_of_range';
  const isLocal = deliveryMode === 'local';
  const riskPercent = Math.round(detectionRisk * 100);
  const canAfford = props.availableEssence == null || props.availableEssence >= essenceCost;

  // Range display text
  const rangeText = (() => {
    if (rangeStatus === 'unlimited') return 'Unlimited range';
    if (rangeStatus === 'out_of_range') return `Out of range (${hexDistance} hexes)`;
    if (rangeStatus === 'in_range' && hexDistance != null) {
      if (deliveryMode === 'local') return 'Same hex';
      return `${hexDistance} hexes (in range)`;
    }
    return '';
  })();

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop — IX-014: stopPropagation prevents bleed-through to elements underneath */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
      />

      {/* Panel */}
      <div
        className="relative border rounded-lg p-4 w-72 shadow-xl"
        style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-medium)' }}
      >
        {/* Header */}
        <h3
          className="text-lg font-bold mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {label}
        </h3>
        <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{description}</p>

        {/* Agenda display */}
        {props.agendaName && (
          <div
            className="mb-3 p-2 border rounded"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{props.agendaName}</div>
            {props.agendaNarrativeHook && (
              <p className="mt-1 italic" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>"{props.agendaNarrativeHook}"</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Cost</span>
            <span style={{ color: 'var(--text-primary)' }}>{essenceCost} {sphere} essence</span>
          </div>
          <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Detection</span>
            <span style={{ color: 'var(--text-primary)' }}>{riskPercent}% risk</span>
          </div>
          {rangeText && (
            <div className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Range</span>
              <span style={{ color: isOutOfRange ? 'var(--negative)' : 'var(--text-primary)' }}>{rangeText}</span>
            </div>
          )}
        </div>

        {/* Out of range message */}
        {isOutOfRange && (
          <div
            className="mb-3 p-2 border rounded text-center"
            style={{
              backgroundColor: 'var(--negative)',
              borderColor: 'var(--negative)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              opacity: 0.8,
            }}
          >
            Out of range — move avatar closer
          </div>
        )}

        {/* Insufficient essence message */}
        {!isOutOfRange && !canAfford && (
          <div
            className="mb-3 p-2 border rounded text-center"
            style={{
              backgroundColor: 'var(--negative)',
              borderColor: 'var(--negative)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              opacity: 0.8,
            }}
          >
            Insufficient {sphere} essence (need {essenceCost}, have {Math.floor(props.availableEssence ?? 0)})
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isOutOfRange ? (
            <button
              className="flex-1 px-3 py-1.5 rounded text-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
              onClick={onCancel}
              aria-label="Cancel"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
            >
              Cancel
            </button>
          ) : isLocal ? (
            <>
              <button
                className="flex-1 px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: canAfford ? 'var(--accent-gold-dim)' : 'var(--bg-surface)',
                  color: canAfford ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                }}
                onClick={() => canAfford && onConfirm('visit')}
                disabled={!canAfford}
                onMouseEnter={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--accent-gold)')}
                onMouseLeave={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--accent-gold-dim)')}
              >
                Go to Them (+15%)
              </button>
              <button
                className="flex-1 px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: canAfford ? 'var(--bg-surface)' : 'var(--bg-deep)',
                  color: canAfford ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                }}
                onClick={() => canAfford && onConfirm('summon')}
                disabled={!canAfford}
                onMouseEnter={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
              >
                Summon (+1 ess)
              </button>
            </>
          ) : (
            <>
              <button
                className="flex-1 px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: canAfford ? 'var(--accent-gold-dim)' : 'var(--bg-surface)',
                  color: canAfford ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                }}
                onClick={() => canAfford && onConfirm()}
                disabled={!canAfford}
                aria-label="Confirm"
                onMouseEnter={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--accent-gold)')}
                onMouseLeave={(e) => canAfford && (e.currentTarget.style.backgroundColor = 'var(--accent-gold-dim)')}
              >
                Confirm
              </button>
              <button
                className="flex-1 px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                }}
                onClick={onCancel}
                aria-label="Cancel"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
