/**
 * CardActStrip — the arm-then-fire strip a `cards` section may carry (THR-1928; plan
 * `Docs/plans/2026-10-14-thr-1926-the-crossroads.md` § UI pillar). The Crossroads row is
 * its first writer.
 *
 * - Over the tiles: the intro sentence (the settledness line), or — while an act is held —
 *   the held line and its one control, "Lift your hand".
 * - On each tile: its offers ("Lean toward", "Lean away"). Pressing one arms that tile
 *   within `--anim-fast` (Law 47) and shows the confirm strip: the forecast line, the price
 *   as cost pips (Law 15, never a numeral) and the confirm sentence, then "Lean" / "Not now"
 *   (Law 48). An unpayable price dims "Lean" and says why (Law 25). Escape disarms (Law 23).
 *
 * The handlers come from `CardActContext` (the Inspector in the game provides them). With
 * no provider — the lab, a hover card — the strip draws its words and no controls, so no
 * button is ever a dead click (Law 25).
 */
import { createContext, useCallback, useContext, useState } from 'react';
import type { CardActOffer, CardsActStrip, CardTile, SentencePart } from '../../types/detailPage';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { CostPips } from './OddsPips';
import { useEscapeLayer, ESCAPE_LAYER_Z_PANEL } from './useEscapeLayer';

/** What firing returns: whether it took, and the words to show when it did not. */
export interface CardActResult {
  ok: boolean;
  message?: string;
}

export interface CardActHandlers {
  /** Fire one offer of a strip. */
  fire: (strip: CardsActStrip, offer: CardActOffer) => CardActResult;
  /** Lift the strip's held act. */
  lift: (strip: CardsActStrip) => CardActResult;
}

export const CardActContext = createContext<CardActHandlers | null>(null);

/** The armed offer of one strip: which tile, which direction. */
export interface ArmedOffer {
  optionIndex: number;
  direction: CardActOffer['direction'];
}

/** One strip's arm state, shared by its intro and its tiles. */
export function useCardActArming() {
  const [armed, setArmed] = useState<ArmedOffer | null>(null);
  const disarm = useCallback(() => setArmed(null), []);
  useEscapeLayer(armed !== null, disarm, ESCAPE_LAYER_Z_PANEL, 'Inspector act strip');
  return { armed, setArmed, disarm };
}

function Sentence({ parts }: { parts: readonly SentencePart[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        return part.tooltipId
          ? <Tooltip key={i} id={part.tooltipId}><span data-act-intro-term="">{part.text}</span></Tooltip>
          : <span key={i}>{part.text}</span>;
      })}
    </>
  );
}

/** Over the tiles: the intro, or the held line and "Lift your hand". */
export function CardActStripHead({ strip }: { strip: CardsActStrip }) {
  const handlers = useContext(CardActContext);
  if (strip.held) {
    return (
      <div data-act-held="" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
        <span style={{ fontStyle: 'italic', minWidth: 0, overflowWrap: 'anywhere' }}>{strip.held.line}</span>
        {handlers && (() => {
          const lift = (
            <Button variant="secondary" size="sm" data-act-lift="" onClick={() => handlers.lift(strip)}>
              {strip.held.liftLabel}
            </Button>
          );
          return strip.held.liftTooltipId ? <Tooltip id={strip.held.liftTooltipId}>{lift}</Tooltip> : lift;
        })()}
      </div>
    );
  }
  if (!strip.intro || strip.intro.length === 0) return null;
  return (
    <div data-act-intro="" style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
      <Sentence parts={strip.intro} />
    </div>
  );
}

/** On one tile: its offers, and the confirm strip when one is armed. */
export function CardActTileControls({ strip, tile, armed, onArm, onDisarm }: {
  strip: CardsActStrip;
  tile: CardTile;
  armed: ArmedOffer | null;
  onArm: (offer: ArmedOffer) => void;
  onDisarm: () => void;
}) {
  const handlers = useContext(CardActContext);
  const [refusal, setRefusal] = useState<string | null>(null);
  const offers = tile.offers ?? [];
  if (!handlers || strip.held || offers.length === 0) return null;
  const armedOffer = armed ? offers.find(o => o.optionIndex === armed.optionIndex && o.direction === armed.direction) ?? null : null;

  const fire = (offer: CardActOffer) => {
    if (offer.blockedReason) return;
    const result = handlers.fire(strip, offer);
    if (result.ok) {
      setRefusal(null);
      onDisarm();
    } else {
      setRefusal(result.message ?? null);
    }
  };

  return (
    <div data-act-tile="" style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
        {offers.map(offer => {
          const isArmed = armedOffer === offer;
          const button = (
            <Button
              key={offer.direction}
              variant={isArmed ? 'primary' : 'ghost'}
              size="sm"
              aria-pressed={isArmed}
              data-act-offer={`${offer.optionIndex}:${offer.direction}`}
              onClick={() => {
                setRefusal(null);
                if (isArmed) onDisarm();
                else onArm({ optionIndex: offer.optionIndex, direction: offer.direction });
              }}
            >
              {offer.label}
            </Button>
          );
          return offer.labelTooltipId
            ? <Tooltip key={offer.direction} id={offer.labelTooltipId}>{button}</Tooltip>
            : button;
        })}
      </div>
      {armedOffer && (
        <div
          data-act-armed={`${armedOffer.optionIndex}:${armedOffer.direction}`}
          style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
            padding: 'var(--space-2)', borderRadius: 'var(--radius-control)',
            borderLeft: `2px solid var(--sphere-${armedOffer.sphere}, var(--border-gold))`,
            background: 'var(--bg-deep)', fontSize: 'var(--text-sm)',
            transition: 'opacity var(--anim-fast)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {armedOffer.forecastTooltipId
              ? <Tooltip id={armedOffer.forecastTooltipId}><span data-act-forecast="" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{armedOffer.forecast}</span></Tooltip>
              : <span data-act-forecast="" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{armedOffer.forecast}</span>}
            <CostPips cost={armedOffer.cost} framed emphasised={armedOffer.blockedReason !== null} data-testid="act-cost" />
          </div>
          <div data-act-confirm="" style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{armedOffer.confirm}</div>
          {(armedOffer.blockedReason || refusal) && (
            <div data-act-blocked="" style={{ color: 'var(--negative)', fontSize: 'var(--text-xs)' }}>{armedOffer.blockedReason ?? refusal}</div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              data-act-fire=""
              disabled={armedOffer.blockedReason !== null}
              aria-disabled={armedOffer.blockedReason !== null}
              onClick={() => fire(armedOffer)}
            >
              {strip.fireLabel}
            </Button>
            <Button variant="ghost" size="sm" data-act-cancel="" onClick={() => { setRefusal(null); onDisarm(); }}>
              {strip.cancelLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
