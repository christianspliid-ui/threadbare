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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-stone-800 border border-amber-700/60 rounded-lg p-4 w-72 shadow-xl">
        {/* Header */}
        <h3
          className="text-amber-100 text-lg font-bold mb-1"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {label}
        </h3>
        <p className="text-amber-400/70 text-xs mb-3">{description}</p>

        {/* Agenda display */}
        {props.agendaName && (
          <div className="mb-3 p-2 bg-stone-700/40 border border-amber-900/30 rounded">
            <div className="text-amber-100 text-sm font-semibold">{props.agendaName}</div>
            {props.agendaNarrativeHook && (
              <p className="text-amber-300/60 text-xs mt-1 italic">"{props.agendaNarrativeHook}"</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="space-y-1 mb-3 text-sm">
          <div className="flex justify-between text-amber-200/80">
            <span>Cost</span>
            <span>{essenceCost} {sphere} essence</span>
          </div>
          <div className="flex justify-between text-amber-200/80">
            <span>Detection</span>
            <span>{riskPercent}% risk</span>
          </div>
          {rangeText && (
            <div className="flex justify-between text-amber-200/80">
              <span>Range</span>
              <span className={isOutOfRange ? 'text-red-400' : ''}>{rangeText}</span>
            </div>
          )}
        </div>

        {/* Out of range message */}
        {isOutOfRange && (
          <div className="mb-3 p-2 bg-red-900/30 border border-red-700/40 rounded text-red-300 text-xs text-center">
            Out of range — move avatar closer
          </div>
        )}

        {/* Insufficient essence message */}
        {!isOutOfRange && !canAfford && (
          <div className="mb-3 p-2 bg-red-900/30 border border-red-700/40 rounded text-red-300 text-xs text-center">
            Insufficient {sphere} essence (need {essenceCost}, have {Math.floor(props.availableEssence ?? 0)})
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isOutOfRange ? (
            <button
              className="flex-1 px-3 py-1.5 bg-stone-800 text-amber-200/70 rounded text-sm hover:bg-stone-700"
              onClick={onCancel}
              aria-label="Cancel"
            >
              Cancel
            </button>
          ) : isLocal ? (
            <>
              <button
                className={`flex-1 px-3 py-1.5 rounded text-sm ${canAfford ? 'bg-amber-800/60 text-amber-100 hover:bg-amber-700/60' : 'bg-stone-700/40 text-amber-200/30 cursor-not-allowed'}`}
                onClick={() => canAfford && onConfirm('visit')}
                disabled={!canAfford}
              >
                Go to Them (+15%)
              </button>
              <button
                className={`flex-1 px-3 py-1.5 rounded text-sm ${canAfford ? 'bg-stone-800 text-amber-200 hover:bg-stone-700' : 'bg-stone-700/40 text-amber-200/30 cursor-not-allowed'}`}
                onClick={() => canAfford && onConfirm('summon')}
                disabled={!canAfford}
              >
                Summon (+1 ess)
              </button>
            </>
          ) : (
            <>
              <button
                className={`flex-1 px-3 py-1.5 rounded text-sm ${canAfford ? 'bg-amber-800/60 text-amber-100 hover:bg-amber-700/60' : 'bg-stone-700/40 text-amber-200/30 cursor-not-allowed'}`}
                onClick={() => canAfford && onConfirm()}
                disabled={!canAfford}
                aria-label="Confirm"
              >
                Confirm
              </button>
              <button
                className="flex-1 px-3 py-1.5 bg-stone-800 text-amber-200/70 rounded text-sm hover:bg-stone-700"
                onClick={onCancel}
                aria-label="Cancel"
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
