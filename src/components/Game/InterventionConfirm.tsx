import type { InterventionType, DeliveryMode, LocalEncounterMode } from '../../types/dream';
import type { SphereName } from '../../types/index';
import { getSphereColor } from '../../data/sphereIcons';
import { SphereIcon } from '../icons';
import { Button } from '../shared/Button';

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
  const sphereColor = getSphereColor(sphere);

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
        className="absolute inset-0 bg-black/60"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
      />

      {/* Panel — widened from w-72 to max-w-md (28rem/448px) for art + readability */}
      <div
        className="relative border rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-raised)',
          borderColor: 'var(--border-medium)',
          width: 'min(28rem, 90vw)',
        }}
      >
        {/* Art banner placeholder — sphere-colored gradient strip.
            Replace inner div with <img> when generated art is available. */}
        <div
          data-testid="intervention-art-banner"
          className="w-full flex items-center justify-center"
          style={{
            height: '8rem',
            background: `linear-gradient(135deg, ${sphereColor}30 0%, var(--bg-deep) 60%, ${sphereColor}18 100%)`,
            borderBottom: `2px solid ${sphereColor}40`,
          }}
        >
          <span style={{ opacity: 0.35 }} aria-hidden="true">
            {/* Sphere SVG icon as placeholder art — will be replaced by generated image */}
            <SphereIcon sphere={sphere} size={48} />
          </span>
        </div>

        {/* Content area */}
        <div className="px-6 pt-5 pb-5">
          {/* Header */}
          <h3
            className="font-bold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xl)',
              lineHeight: 1.2,
            }}
          >
            {label}
          </h3>
          <p
            className="mb-4 leading-relaxed"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
            }}
          >
            {description}
          </p>

          {/* Agenda display */}
          {props.agendaName && (
            <div
              className="mb-4 p-3 border rounded-lg"
              style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-gold)' }}
            >
              <div
                className="font-bold"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {props.agendaName}
              </div>
              {props.agendaNarrativeHook && (
                <p
                  className="mt-1.5 italic leading-relaxed"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  &ldquo;{props.agendaNarrativeHook}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Stats — bumped to --text-base */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between" style={{ fontSize: 'var(--text-base)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>Cost</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {Math.round(essenceCost)} {sphere} essence
              </span>
            </div>
            <div className="flex justify-between" style={{ fontSize: 'var(--text-base)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>Detection</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{riskPercent}% risk</span>
            </div>
            {rangeText && (
              <div className="flex justify-between" style={{ fontSize: 'var(--text-base)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-tertiary)' }}>Range</span>
                <span
                  className="font-bold"
                  style={{ color: isOutOfRange ? 'var(--negative)' : 'var(--text-primary)' }}
                >
                  {rangeText}
                </span>
              </div>
            )}
          </div>

          {/* Out of range message */}
          {isOutOfRange && (
            <div
              className="mb-4 p-3 border rounded-lg text-center font-semibold"
              style={{
                backgroundColor: 'var(--negative)',
                borderColor: 'var(--negative)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                opacity: 0.85,
              }}
            >
              Out of range — move avatar closer
            </div>
          )}

          {/* Insufficient essence message */}
          {!isOutOfRange && !canAfford && (
            <div
              className="mb-4 p-3 border rounded-lg text-center font-semibold"
              style={{
                backgroundColor: 'var(--negative)',
                borderColor: 'var(--negative)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                opacity: 0.85,
              }}
            >
              Insufficient {sphere} essence (need {Math.round(essenceCost)}, have {Math.round(props.availableEssence ?? 0)})
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isOutOfRange ? (
              <Button variant="secondary" size="lg" fullWidth onClick={onCancel} aria-label="Cancel">
                Cancel
              </Button>
            ) : isLocal ? (
              <>
                <Button variant="primary" size="lg" fullWidth onClick={() => onConfirm('visit')} disabled={!canAfford}>
                  Go to Them (+15%)
                </Button>
                <Button variant="secondary" size="lg" fullWidth onClick={() => onConfirm('summon')} disabled={!canAfford}>
                  Summon (+1 ess)
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="lg" fullWidth onClick={() => onConfirm()} disabled={!canAfford} aria-label="Confirm">
                  Confirm
                </Button>
                <Button variant="secondary" size="lg" fullWidth onClick={onCancel} aria-label="Cancel">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
