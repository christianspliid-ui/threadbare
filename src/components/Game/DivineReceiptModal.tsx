/**
 * DivineReceiptModal — the receipt-dialogue tier of the Divine Receipt (THR-727).
 *
 * Shown when the oldest unacknowledged `presentation: 'modal'` player receipt exists, or
 * on demand when a toast-tier receipt is clicked through. Leads with the story the engine
 * already computed (band-keyed framing line + enriched overview), then the itemized world
 * changes, then a woven technical sentence, and — when the template authored them — the
 * aftermath reaction buttons. Design-system conformant: shared Modal primitive, tokens
 * only, band colour via BAND_ACCENT.
 */
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Tooltip } from '../shared/Tooltip';
import { getActionArt } from './actionArt';
import { bandAccentColor } from './outcomeBandAccent';
import { outcomeBandWord } from '../../data/outcome-band-content';
import { selectReceiptFrameLine } from '../../data/receipt-content';
import type { PlayerActionReceipt } from '../../engine/playerReceipts';
import type { EncounterAftermathChangePolarity } from '../../types/unifiedAction';
import { formatEssence } from '../shared/formatEssence';
import { elapsedLabel } from '../../engine/aftermathWords';
import { Icon } from '../shared/Icon';
import { Medallion } from '../shared/Medallion';
import { EntityVisual } from '../shared/EntityVisual';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';
import { ICON_FOR_CONSEQUENCE } from '../../data/icons/conceptIcons';
import { dialogHeadingIcon } from '../../data/view-content';

/** THR-2101 (S5.3) — a relic's painting before the change that names it, in px. */
export const RECEIPT_RELIC_TILE_PX = 40;

interface DivineReceiptModalProps {
  open: boolean;
  receipt: PlayerActionReceipt;
  onAcknowledge: () => void;
  /** Apply an authored aftermath reaction, then acknowledge+close (handled by the caller). */
  onReaction?: (reactionId: string) => void;
  /**
   * THR-2101 (decision 2) — who the act touched (a mortal's face, a place, a faction's arms),
   * resolved by the dialog host. Drawn as a medallion before the sentence that names them.
   */
  targetVisual?: EntityVisualDescriptor | null;
  /** THR-2101 (S5.3) — change id → the painting of the relic it names; resolved by the host. */
  changeArt?: Readonly<Record<string, string>>;
}

const POLARITY_COLOR: Record<EncounterAftermathChangePolarity, string> = {
  gain: 'var(--positive)',
  loss: 'var(--negative)',
  mixed: 'var(--warning)',
  info: 'var(--text-tertiary)',
};

function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Woven technical sentence — essence, target, elapsed term. No key:value chips (taste profile). */
function technicalSentence(receipt: PlayerActionReceipt): string {
  const sphereLabel = receipt.sphere ? `${capitalize(receipt.sphere)} ` : '';
  const essenceClause =
    receipt.essencePaid > 0
      ? `You spent ${formatEssence(receipt.essencePaid)} ${sphereLabel}essence`
      : 'You spent no essence';
  const targetClause =
    receipt.targetName === 'yourself'
      ? ' on yourself'
      : receipt.targetName
        ? ` on ${receipt.targetName}`
        : '';
  const ticks = Math.max(0, receipt.resolvedTick - receipt.startTick);
  // THR-1425: the elapsed count was a raw magnitude in an engine unit (Laws 13 + 14). It sits
  // mid-sentence in authored prose, so the replacement has to read as prose rather than as a
  // stat value — which is exactly what `elapsedLabel` composes into: `took less than a day to
  // resolve` and `took four days to resolve` are both English. The instantaneous case keeps its
  // own clause: a working that resolved on the tick it was cast did not take `less than a day`,
  // it took no time at all, and collapsing the two would lose a distinction the player can feel.
  const elapsedClause =
    ticks > 0 ? `, and the working took ${elapsedLabel(ticks)} to resolve` : ', resolving at once';
  return `${essenceClause}${targetClause}${elapsedClause}.`;
}

export function DivineReceiptModal({ open, receipt, onAcknowledge, onReaction, targetVisual, changeArt }: DivineReceiptModalProps) {
  const headingIcon = dialogHeadingIcon('receipt');
  const accent = bandAccentColor(receipt.outcomeBand, 'var(--accent-gold)');
  const art = getActionArt(receipt.templateId);
  const framing = selectReceiptFrameLine(receipt.outcomeBand, receipt.actionId);
  const word = outcomeBandWord(receipt.outcomeBand);
  const reactions = receipt.reactions ?? [];

  return (
    <Modal open={open} onClose={onAcknowledge} size="s" context="gain" aria-label={`Divine receipt: ${receipt.templateName}`}>
      {/* Art header — band-accented, with graceful fallback when art is missing. */}
      <div
        data-testid="divine-receipt-header"
        style={{
          position: 'relative',
          height: '150px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottom: `2px solid ${accent}`,
          overflow: 'hidden',
          background: art
            ? `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.75)), url(${art}) center/cover`
            : `var(--dlg-bg, linear-gradient(160deg, var(--bg-raised), var(--bg-abyss)))`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 'var(--panel-padding)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {headingIcon && (
            <span data-dialog-heading-icon={headingIcon} style={{ display: 'inline-flex' }}>
              <Icon name={headingIcon} size="chip" decorative />
            </span>
          )}
          {receipt.templateName}
        </div>
        <div
          data-testid="divine-receipt-band-word"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            color: accent,
            marginTop: 'var(--space-1)',
          }}
        >
          {word}
        </div>
      </div>

      <Modal.Body>
        {/* Story block — framing line then enriched overview. */}
        <p
          data-testid="divine-receipt-framing"
          style={{
            fontFamily: 'var(--font-prose)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--space-3)',
            lineHeight: 1.5,
          }}
        >
          {framing}
        </p>
        {receipt.overview && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
              marginBottom: 'var(--space-4)',
              lineHeight: 1.6,
            }}
          >
            {receipt.overview}
          </p>
        )}

        {/* What changed — polarity-coloured, verbatim from the engine. */}
        {receipt.changes.length > 0 && (
          <div data-testid="divine-receipt-changes" style={{ marginBottom: 'var(--space-4)' }}>
            {receipt.changes.map((change) => {
              // THR-2101 (S5.3): the shape says what kind of change; the border and words say
              // which way (Law 31). A change naming a relic shows its painting first.
              const relicArt = changeArt?.[change.id];
              const shape = change.category ? ICON_FOR_CONSEQUENCE[change.category] : undefined;
              return (
              <div
                key={change.id}
                data-testid="divine-receipt-change"
                style={{
                  borderLeft: `3px solid ${POLARITY_COLOR[change.polarity]}`,
                  paddingLeft: 'var(--space-2)',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'flex-start',
                }}
              >
                {relicArt && (
                  <img
                    src={relicArt}
                    alt=""
                    data-testid="divine-receipt-relic-tile"
                    style={{ width: RECEIPT_RELIC_TILE_PX, height: RECEIPT_RELIC_TILE_PX, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    {shape && (
                      <span data-consequence-icon={shape} style={{ display: 'inline-flex' }}>
                        <Icon name={shape} size="floor" decorative />
                      </span>
                    )}
                    {change.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {change.detail}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Technical footer — woven sentence, not key:value chips; the target's medallion
            sits before the sentence that names them (THR-2101, decision 2). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {targetVisual && (
            <span data-dialog-face={targetVisual.tier} data-testid="divine-receipt-target" style={{ display: 'inline-flex' }}>
              <Medallion size="sm" title={targetVisual.alt}>
                <EntityVisual size="chip" descriptor={targetVisual} />
              </Medallion>
            </span>
          )}
          <p
            data-testid="divine-receipt-technical"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {technicalSentence(receipt)}
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        {/*
          THR-1029 — this was `title={reaction.intent}`, the raw-`title` hover
          pattern Law 17 explicitly retired; hover explanations route through the
          shared `Tooltip` primitive (Law 27). Kept as a tooltip rather than
          promoted inline because this footer is a button row, not the aftermath
          screen — surfacing the intent as visible prose here is a layout decision
          for whoever redesigns the receipt body, not a rename.
        */}
        {reactions.map((reaction) => (
          <Tooltip key={reaction.id} label={reaction.label} desc={reaction.intent ?? ''}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReaction?.(reaction.id)}
            >
              {reaction.label}
            </Button>
          </Tooltip>
        ))}
        <Button variant="primary" size="sm" onClick={onAcknowledge} data-testid="divine-receipt-acknowledge">
          Acknowledge
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
