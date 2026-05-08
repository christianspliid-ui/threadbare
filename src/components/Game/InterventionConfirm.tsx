import { useEffect, useCallback } from 'react';
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
    if (rangeStatus === 'unlimited') return 'Unlimited';
    if (rangeStatus === 'out_of_range') return `Out of range (${hexDistance} hexes)`;
    if (rangeStatus === 'in_range' && hexDistance != null) {
      if (deliveryMode === 'local') return 'Same hex';
      return `${hexDistance} hexes`;
    }
    return '';
  })();

  // Escape key → cancel (matches Modal primitive behaviour)
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

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

      {/* Panel — v7 sphere-bright ring + glow via boxShadow */}
      <div
        data-testid="intervention-panel"
        className="relative rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--border-medium)',
          boxShadow: `0 0 0 1px ${sphereColor} inset, 0 0 18px -2px ${sphereColor}, 0 20px 40px rgba(0,0,0,0.6)`,
          width: 'min(28rem, 90vw)',
        }}
      >
        {/* Art banner — height reduced from 8rem to 6rem per v7 spec */}
        <div
          data-testid="intervention-art-banner"
          className="w-full flex items-center justify-center"
          style={{
            height: '6rem',
            background: `linear-gradient(135deg, ${sphereColor}30 0%, var(--bg-deep) 60%, ${sphereColor}18 100%)`,
            borderBottom: `1px solid ${sphereColor}40`,
          }}
        >
          <span style={{ opacity: 0.35 }} aria-hidden="true">
            <SphereIcon sphere={sphere} size={48} />
          </span>
        </div>

        {/* Content area */}
        <div className="px-6 pt-4 pb-5">
          {/* Sphere · delivery line — v7 ALLCAPS Cinzel above the title */}
          <p
            data-testid="sphere-delivery-line"
            className="mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: sphereColor,
              fontWeight: 600,
            }}
          >
            {sphere} · {deliveryMode}
          </p>

          {/* Title — italic display Cinzel per v7 */}
          <h3
            className="mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {label}
          </h3>

          {/* Gold bar separator */}
          <div
            style={{
              width: '36px',
              height: '1px',
              backgroundColor: 'var(--accent-gold)',
              marginBottom: '12px',
            }}
          />

          {/* Description prose */}
          <p
            className="mb-3 leading-relaxed"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {description}
          </p>

          {/* Tilts toward — agenda narrative hook in v7 idiom */}
          {(props.agendaName || props.agendaNarrativeHook) && (
            <div className="mb-3">
              {props.agendaName && (
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  {props.agendaName}
                </span>
              )}
              {props.agendaNarrativeHook && (
                <p
                  className="italic leading-relaxed"
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  tilts toward: {props.agendaNarrativeHook}
                </p>
              )}
            </div>
          )}

          {/* Utility lines — cost / detection / range (no pill backgrounds) */}
          <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                }}
              >
                Cost
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {Math.round(essenceCost)} {sphere} essence
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                }}
              >
                Detection
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {riskPercent}% risk
              </span>
            </div>
            {rangeText && (
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    display: 'block',
                  }}
                >
                  Range
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: isOutOfRange ? 'var(--negative)' : 'var(--text-secondary)',
                  }}
                >
                  {rangeText}
                </span>
              </div>
            )}
          </div>

          {/* State warnings — inline, no pill backgrounds */}
          {isOutOfRange && (
            <p
              className="mb-4 italic"
              style={{ color: 'var(--negative)', fontSize: 'var(--text-sm)' }}
            >
              Out of range — move avatar closer
            </p>
          )}
          {!isOutOfRange && !canAfford && (
            <p
              className="mb-4 italic"
              style={{ color: 'var(--negative)', fontSize: 'var(--text-sm)' }}
            >
              Insufficient {sphere} essence (need {Math.round(essenceCost)}, have {Math.round(props.availableEssence ?? 0)})
            </p>
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
