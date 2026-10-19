/**
 * The armed card on screen (THR-1914, Inspector plan § D9 way 3).
 *
 * - `ArmedCardProvider` hands the arming hook's reads down, so the banner, the Inspector's
 *   rows and the drop targets read one armed state (GameView mounts it).
 * - `ArmedBanner` — "Illuminating Whisper: choose a person. You can keep following links."
 *   with the Esc cap; once a target is chosen, the commit line and "Cast on Shutash"; the
 *   answer to the last click (a locked reason, "… cannot touch that."); the cleared line.
 *   It sits at the top of the Inspector when it is open, and over the top of the map when
 *   it is closed (`floating`).
 * - `ArmedRowsProvider` — while armed, every world-ref row in the Inspector is lit
 *   (castable: "Cast here" replaces its count chip), locked (lit dimmer, its reason in
 *   words) or dimmed (not a target). Unarmed, the rows keep their counts and trays.
 * - `refFromDrop` — the drop target's ref: the nearest `data-link-row`.
 */
import { createContext, useContext, useMemo, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import type { WorldRef } from '../../../types/worldRef';
import type { LinkRow } from '../../../types/detailPage';
import type { LinkRowVM } from '../../../engine/views/subjects/subjectTypes';
import { ARMED_WORDS, INSPECTOR_WORDS } from '../../../data/view-content';
import { Z_BAND } from '../../shared/zBands';
import { Button } from '../../shared/Button';
import { LinkRowAccessoryContext, type LinkRowAccessory, type LinkRowArmedState } from '../../shared/Section';
import { CARD_DRAG_MIME } from '../frame/HandPressContext';
import { useGameScreenState } from '../frame/GameScreenState';
import type { CardArming } from './useCardArming';

const ArmedCardContext = createContext<CardArming | null>(null);

export function ArmedCardProvider({ value, children }: { value: CardArming; children: ReactNode }) {
  return <ArmedCardContext.Provider value={value}>{children}</ArmedCardContext.Provider>;
}

/** The arming reads, or null outside a game screen (the lab, the style guide). */
export function useArmedCardState(): CardArming | null {
  return useContext(ArmedCardContext);
}

/** Whether a drag carries a hand card. */
export function isCardDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes(CARD_DRAG_MIME);
}

/** The world ref of the row a drop landed on (`data-link-row="kind:id"`), or null. */
export function refFromDrop(target: EventTarget | null): WorldRef | null {
  const el = target instanceof Element ? target.closest('[data-link-row]') : null;
  const key = el?.getAttribute('data-link-row');
  if (!key) return null;
  const at = key.indexOf(':');
  if (at <= 0) return null;
  return { kind: key.slice(0, at), id: key.slice(at + 1) } as WorldRef;
}

const KEY_CAP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.25rem',
  height: '1.25rem',
  padding: '0 0.25rem',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  lineHeight: 1,
};

/**
 * The banner. `subject` is the Inspector's open subject: when the armed card can land on it,
 * the banner offers "Cast on <subject>" too (the header's treatment).
 */
export function ArmedBanner({ floating = false, subject = null }: { floating?: boolean; subject?: WorldRef | null }) {
  const arming = useArmedCardState();
  const { state: screen } = useGameScreenState();
  const cleared = screen.armedCleared;
  const armed = arming?.armed ?? null;

  const subjectVerdict = useMemo(() => (arming && armed && subject && !armed.target ? arming.evaluate(subject) : null), [arming, armed, subject]);

  if (!arming || (!armed && !cleared)) return null;

  const style: CSSProperties = floating
    ? { position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: Z_BAND.hud, maxWidth: 'min(36rem, calc(100% - 24px))' }
    : { margin: '0 0 8px 0' };

  if (!armed) {
    return (
      <div role="status" data-armed-banner="cleared" style={{ ...style, ...bannerBox }}>
        <span style={{ color: 'var(--text-secondary)' }}>{cleared}</span>
      </div>
    );
  }

  const card = arming.cardName ?? armed.actionId;
  const staged = armed.target;
  const vm = arming.vm;
  const line = staged
    ? arming.commitLine
    : ARMED_WORDS.banner.replace('{card}', card).replace('{target}', vm?.targetWords || 'a target');

  return (
    <div role="region" aria-label={ARMED_WORDS.regionLabel} data-armed-banner={staged ? 'commit' : 'choose'} data-armed-action={armed.actionId} style={{ ...style, ...bannerBox }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
        <p data-armed-line="" style={{ margin: 0, flex: 1, minWidth: 0, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{line}</p>
        <Button variant="ghost" size="sm" onClick={arming.disarm} aria-label={ARMED_WORDS.escHint} title={ARMED_WORDS.escHint} style={{ flexShrink: 0 }}>
          <kbd aria-hidden="true" style={KEY_CAP}>Esc</kbd>
        </Button>
      </div>
      {staged && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="sm" data-armed-cast="" onClick={() => arming.castOn()}>
            {INSPECTOR_WORDS.castOn.replace('{name}', arming.targetName(staged))}
          </Button>
        </div>
      )}
      {!staged && subject && subjectVerdict?.state === 'castable' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" data-armed-cast-subject="" onClick={() => arming.castOn(subject)}>
            {INSPECTOR_WORDS.castOn.replace('{name}', arming.targetName(subject))}
          </Button>
        </div>
      )}
      {!staged && vm?.emptyLine && <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{vm.emptyLine}</p>}
      {armed.note && <p role="status" data-armed-note="" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>{armed.note}</p>}
    </div>
  );
}

const bannerBox: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '8px 10px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-accent)',
  borderRadius: 'var(--radius-control)',
  fontSize: 'var(--text-sm)',
  minWidth: 0,
};

type Row = LinkRow | LinkRowVM;

function ArmedRowTrailing({ row }: { row: Row }) {
  const arming = useArmedCardState();
  if (!arming?.armed) return null;
  const v = arming.evaluate(row.ref);
  if (v.state === 'castable') {
    return (
      <span style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <Button variant="secondary" size="sm" data-armed-cast-here={`${row.ref.kind}:${row.ref.id}`} onClick={() => arming.castOn(row.ref)}>
          {ARMED_WORDS.castHere}
        </Button>
      </span>
    );
  }
  if (v.state === 'locked' && v.reason) {
    return <span data-armed-reason="" style={{ flexShrink: 0, marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{v.reason}</span>;
  }
  return null;
}

/**
 * While a card is armed, the Inspector's rows answer for it; otherwise the accessory above
 * (the counts and trays) stays as it was.
 */
export function ArmedRowsProvider({ children }: { children: ReactNode }) {
  const arming = useArmedCardState();
  const outer = useContext(LinkRowAccessoryContext);
  const armedId = arming?.armed?.actionId ?? null;
  const evaluate = arming?.evaluate;
  // `vm` changes with every world state, so the rows re-read as the world moves.
  const vm = arming?.vm;
  const accessory = useMemo<LinkRowAccessory | null>(() => {
    if (!armedId || !evaluate) return outer;
    return {
      trailing: (row) => <ArmedRowTrailing row={row} />,
      below: () => null,
      rowState: (row): LinkRowArmedState => {
        const v = evaluate(row.ref);
        return v.state === 'castable' ? 'lit' : v.state === 'locked' ? 'locked' : 'dim';
      },
    };
  }, [armedId, evaluate, outer, vm]); // eslint-disable-line react-hooks/exhaustive-deps
  return <LinkRowAccessoryContext.Provider value={accessory}>{children}</LinkRowAccessoryContext.Provider>;
}
