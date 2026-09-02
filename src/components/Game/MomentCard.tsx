/**
 * MomentCard — the interrupt-tier surface of the moment stream (THR-1299 slice 3).
 *
 * Shown when the oldest unacknowledged `interrupt` record in
 * `state.pendingUndertakingMoments` pops into GameView's `pendingMoment` slot and
 * no other interrupt is open (encounter first, never two modals — review M4,
 * Law 49). Wears the encounter family's chrome (Law 37): who it happened to,
 * what work, where the work stands, the band it landed on; then the compressed
 * Law 38 beat order — prose, then the state that moved (chips), then the god's
 * hand (the action slot). Dismiss is acknowledge: a single reversible click, not
 * a Law 48 armed act — the record stays for the badge to count.
 *
 * Everything rendered comes off `MomentCardModel`; the component computes nothing.
 */
import { useState } from 'react';
import { Modal, MODAL_Z_DEFAULT } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Tooltip } from '../shared/Tooltip';
import { EntityVisual } from '../shared/EntityVisual';
import { StepDots } from '../shared/StepDots';
import { bandAccentColor } from './outcomeBandAccent';
import { MOMENT_CARD_PAUSE_NOTE } from '../../data/moment-card-content';
import type { WorldGraph } from '../../engine/graph';
import type { MomentCardChip, MomentCardModel, MomentChipTone } from './momentCardModel';

export interface MomentCardProps {
  open: boolean;
  model: MomentCardModel;
  graph: WorldGraph;
  /** Acknowledge = dismiss. The caller marks the record and releases the slot. */
  onAcknowledge: () => void;
  /** Route an agent chip or the portrait to the agent surface (Law 21). */
  onSelectAgent?: (agentId: string) => void;
  /**
   * Fire one of the two divine verbs at the mortal. Returns the outcome so the
   * card can say inline what happened (Law 48: blocked acts fail fast inline).
   */
  onDivineAct?: (templateId: string, targetAgentId: string) => { success: boolean; message?: string };
}

const TONE_COLOR: Record<MomentChipTone, string> = {
  gain: 'var(--positive)',
  loss: 'var(--negative)',
  neutral: 'var(--text-tertiary)',
  divine: 'var(--accent-gold)',
};

/** Icon-tile edge for a chip — matches `EntityVisual size="chip"`. */
const CHIP_TILE_PX = 28;

function ChipRow({ chip, onSelectAgent }: { chip: MomentCardChip; onSelectAgent?: (id: string) => void }) {
  const color = TONE_COLOR[chip.tone];
  const clickable = !!chip.selectAgentId && !!onSelectAgent;
  const categoryWord = (
    <span
      data-testid={`moment-chip-category-${chip.id}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xs)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {chip.category}
    </span>
  );
  return (
    <div
      data-testid={`moment-chip-${chip.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        borderLeft: `2px solid ${color}`,
        paddingLeft: 'var(--space-2)',
      }}
    >
      {chip.entity ? (
        <EntityVisual
          size="chip"
          entity={chip.entity}
          aria-label={chip.entity.name}
          title={chip.entity.name}
          onClick={clickable ? () => onSelectAgent!(chip.selectAgentId!) : undefined}
          data-testid={`moment-chip-icon-${chip.id}`}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: CHIP_TILE_PX,
            height: CHIP_TILE_PX,
            flexShrink: 0,
            border: `1px solid ${color}`,
            borderRadius: 3,
            color,
            fontSize: 'var(--text-xs)',
            opacity: 0.85,
          }}
        >
          {chip.tone === 'gain' ? '▲' : chip.tone === 'loss' ? '▼' : chip.tone === 'divine' ? '✦' : '·'}
        </span>
      )}
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {chip.tooltipId ? <Tooltip id={chip.tooltipId}>{categoryWord}</Tooltip> : categoryWord}
        <span style={{ color: 'var(--text-tertiary)' }}>·</span>
        {clickable ? (
          <button
            type="button"
            data-testid={`moment-chip-link-${chip.id}`}
            onClick={() => onSelectAgent!(chip.selectAgentId!)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              textDecoration: 'underline',
              textDecorationColor: 'var(--accent-gold-dim)',
              cursor: 'pointer',
            }}
          >
            {chip.noun}
          </button>
        ) : (
          <span data-testid={`moment-chip-noun-${chip.id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {chip.noun}
          </span>
        )}
      </span>
    </div>
  );
}

export function MomentCard({ open, model, graph, onAcknowledge, onSelectAgent, onDivineAct }: MomentCardProps) {
  const accent = bandAccentColor(model.outcomeBand ?? undefined, 'var(--accent-gold)');
  // Law 48 — an essence spend is armed, then fired. `staged` holds the verb the
  // player has armed; a second press on the same verb commits it.
  const [staged, setStaged] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ success: boolean; message?: string } | null>(null);

  const showActions = model.actionable && !!onDivineAct;
  const portraitClickable = model.actorExists && !!onSelectAgent;

  return (
    <Modal
      open={open}
      onClose={onAcknowledge}
      maxWidth={560}
      zIndex={MODAL_Z_DEFAULT}
      aria-label={`${model.title}: ${model.undertakingName}`}
    >
      {/* Identity chrome (Law 37): portrait, undertaking, class word, checkpoint position, band. */}
      <div
        data-testid="moment-card"
        data-moment-class={model.record.momentClass}
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center',
          padding: 'var(--panel-padding)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottom: `2px solid ${accent}`,
          background: 'linear-gradient(160deg, var(--bg-raised), var(--bg-abyss))',
        }}
      >
        <EntityVisual
          size="chip"
          entity={{ id: model.actorId, kind: 'agent', name: model.actorName }}
          graph={graph}
          shape="rounded"
          aria-label={model.actorName}
          title={model.actorName}
          onClick={portraitClickable ? () => onSelectAgent!(model.actorId) : undefined}
          data-testid="moment-card-portrait"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Tooltip id="ui.moment_card">
            <div
              data-testid="moment-card-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              {model.title}
            </div>
          </Tooltip>
          <div
            data-testid="moment-card-undertaking"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
          >
            {model.undertakingName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
            {model.checkpoints && (
              <Tooltip id="ui.moment_checkpoints">
                <span
                  data-testid="moment-card-checkpoints"
                  aria-label={model.progressWord ?? undefined}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <StepDots
                    totalSteps={model.checkpoints.total}
                    currentStepIndex={model.checkpoints.filled}
                    variant="magnitude"
                    size={8}
                  />
                  {model.progressWord && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{model.progressWord}</span>
                  )}
                </span>
              </Tooltip>
            )}
            {model.bandWord && (
              <Tooltip id="ui.moment_band">
                <span
                  data-testid="moment-card-band-word"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: accent,
                  }}
                >
                  {model.bandWord}
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <Modal.Body>
        {/* Prose — narrator mode, two lines. */}
        <p
          data-testid="moment-card-opening"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--space-3)',
            lineHeight: 1.5,
          }}
        >
          {model.opening}
        </p>
        <p
          data-testid="moment-card-consequence"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
            marginBottom: 'var(--space-4)',
            lineHeight: 1.6,
          }}
        >
          {model.consequence}
        </p>

        {/* What moved — state-backed chips only (Law 56). */}
        {model.chips.length > 0 && (
          <div
            data-testid="moment-card-chips"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}
          >
            {model.chips.map(chip => (
              <ChipRow key={chip.id} chip={chip} onSelectAgent={onSelectAgent} />
            ))}
          </div>
        )}

        {/* The god's hand — Inspire / Sabotage, armed then fired (Law 48). */}
        {showActions && (
          <div data-testid="moment-card-actions" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            {model.divineActions.map(action => {
              const isStaged = staged === action.templateId;
              const spent = outcome?.success === true;
              const disabled = spent || !action.affordable;
              const sphereWord = action.sphere ? action.sphere.charAt(0).toUpperCase() + action.sphere.slice(1) : '';
              const blockedReason = !action.affordable && action.sphere ? `Not enough ${sphereWord} essence` : '';
              return (
                <Tooltip key={action.templateId} label={action.label} desc={blockedReason || action.description}>
                  <Button
                    variant={isStaged ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={disabled}
                    data-testid={`moment-act-${action.verb}`}
                    data-staged={isStaged ? 'true' : 'false'}
                    onClick={() => {
                      if (disabled) return;
                      if (!isStaged) { setStaged(action.templateId); return; }
                      const result = onDivineAct!(action.templateId, model.actorId);
                      setOutcome(result);
                      setStaged(null);
                    }}
                  >
                    {isStaged ? action.confirm : action.label}
                  </Button>
                </Tooltip>
              );
            })}
            {outcome && (
              <span
                data-testid="moment-card-act-outcome"
                style={{ fontSize: 'var(--text-xs)', color: outcome.success ? 'var(--accent-gold)' : 'var(--negative)' }}
              >
                {outcome.message ?? (outcome.success ? 'It is done.' : 'Nothing answered.')}
              </span>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Tooltip id="ui.moment_pause">
          <span
            data-testid="moment-card-pause-note"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic', marginRight: 'auto' }}
          >
            {MOMENT_CARD_PAUSE_NOTE}
          </span>
        </Tooltip>
        <Button variant="primary" size="sm" onClick={onAcknowledge} data-testid="moment-card-acknowledge">
          Acknowledge
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
