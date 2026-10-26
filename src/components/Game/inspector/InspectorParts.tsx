/**
 * The Inspector page's parts (THR-1876 § D5): the Act row, the Connections block,
 * *In this land* and "More when widened". Each renders a view model; none reads the graph.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import type { ActOnVM, ConnectionsVM, LandIndexVM } from '../../../engine/views/subjects/subjectTypes';
import type { SphereName } from '../../../types';
import { Chip } from '../../shared/Chip';
import { Button } from '../../shared/Button';
import { LinkRows, SectionLabel } from '../../shared/Section';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import { bandAccentColor } from '../outcomeBandAccent';

const blockStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 };

/** What a press on an armed card reports back (the host's one cast path). */
export interface ActCastResult {
  cast: boolean;
  reason: string | null;
}

/**
 * Act on <name> (call 1): the subject's cards, sphere-tinted (the loved tint).
 *
 * With `onCast` (the game, THR-1911) each card is a button and casting takes two beats
 * (Law 48): the first press arms the card and offers "Cast on <name>", the second press
 * (or Cast) casts it. A locked card arms nothing: it shakes and names its reason (Law 47).
 * Without `onCast` (the lab) the cards are plain chips — no dead buttons (Law 25).
 */
export function ActOnRow({ actOn, targetName, onCast, compact = false }: {
  actOn: ActOnVM;
  targetName?: string;
  onCast?: (actionId: string) => ActCastResult;
  /** THR-1913 — the row tray: no heading drawn (the row above names the target); the section keeps its name. */
  compact?: boolean;
}) {
  const [armed, setArmed] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [said, setSaid] = useState<{ id: string; reason: string } | null>(null);
  const name = targetName ?? '';
  // A card that left the row (cast, spent, gone locked) disarms itself.
  useEffect(() => {
    if (armed && !actOn.cards.some(c => c.actionId === armed && c.available)) setArmed(null);
  }, [actOn.cards, armed]);

  const press = (actionId: string, available: boolean, reason: string | null) => {
    if (!onCast) return;
    if (!available) {
      setArmed(null);
      setShaking(actionId);
      setSaid(reason ? { id: actionId, reason } : null);
      setTimeout(() => setShaking(s => (s === actionId ? null : s)), 400);
      return;
    }
    if (armed !== actionId) {
      setArmed(actionId);
      setSaid(null);
      return;
    }
    const result = onCast(actionId);
    setArmed(null);
    if (!result.cast && result.reason) setSaid({ id: actionId, reason: result.reason });
  };

  return (
    <section data-inspector-act="" style={blockStyle} aria-label={actOn.heading}>
      {!compact && <SectionLabel label={actOn.heading} gold={true} />}
      {actOn.cards.length === 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{actOn.emptyLine}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {actOn.cards.map(card => {
            const tint = card.sphere ? { sphere: card.sphere as SphereName } : ('neutral' as const);
            const isArmed = armed === card.actionId;
            const reason = said?.id === card.actionId ? said.reason : card.reason;
            return (
              <span key={card.actionId} data-act-card={card.actionId} data-available={card.available ? 'true' : 'false'} data-armed={isArmed ? 'true' : 'false'}
                className={shaking === card.actionId ? 'anim-shake-no' : undefined}
                style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', opacity: card.available ? 1 : 0.6, minWidth: 0 }}>
                <Chip
                  role="state"
                  size="sm"
                  label={card.name}
                  tint={tint}
                  onOpen={onCast ? () => press(card.actionId, card.available, card.reason) : undefined}
                  style={isArmed ? { outline: '2px solid var(--border-gold)', outlineOffset: '2px' } : undefined}
                />
                {card.fate && (
                  <span data-act-fate={card.fate.word} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: bandAccentColor(card.fate.band, 'var(--accent-gold)') }}>
                    {card.fate.word}
                  </span>
                )}
                {isArmed && card.odds && (
                  <span data-act-odds={card.odds} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {INSPECTOR_WORDS.castOdds.replace('{word}', card.odds)}
                  </span>
                )}
                {isArmed && (
                  <Button variant="primary" size="sm" onClick={() => press(card.actionId, true, null)} data-act-cast={card.actionId}>
                    {INSPECTOR_WORDS.castOn.replace('{name}', name)}
                  </Button>
                )}
                {reason && <span role={said?.id === card.actionId ? 'status' : undefined} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{reason}</span>}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Connections (call 8), always last: six groups in one order, each counted, sorted, and
 * — docked, only when the page must fold to fit — folded to its first rows plus "Show all N".
 */
export function ConnectionsBlock({
  connections,
  folded,
  onShowAll,
}: {
  connections: ConnectionsVM;
  folded: ReadonlySet<string>;
  onShowAll: (groupId: string) => void;
}) {
  if (connections.groups.length === 0) return null; // Law 25
  return (
    <section data-inspector-connections="" style={blockStyle} aria-label={connections.title}>
      <SectionLabel label={connections.title} gold={false} />
      {connections.groups.map(group => {
        const isFolded = folded.has(group.id) && group.rows.length > group.foldAfter;
        const rows = isFolded ? group.rows.slice(0, group.foldAfter) : group.rows;
        return (
          <div key={group.id} data-connections-group={group.id} data-folded={isFolded ? 'true' : 'false'} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {group.total > 1 ? `${group.label} · ${group.total}` : group.label}
            </div>
            <LinkRows rows={rows} />
            {isFolded && (
              <Button variant="ghost" size="sm" onClick={() => onShowAll(group.id)} style={{ marginTop: '4px' }}>
                {INSPECTOR_WORDS.showAll.replace('{n}', String(group.total))}
              </Button>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** *In this land* (call 17): People and Holder always, the rest when present; never folded. */
export function InThisLand({ index }: { index: LandIndexVM }) {
  return (
    <section data-inspector-in-this-land="" style={blockStyle} aria-label={index.title}>
      <SectionLabel label={index.title} gold={true} />
      {index.rows.map(row => (
        <div key={row.id} data-land-row={row.id} style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>{row.label}</div>
          {row.rows.length > 0 ? (
            <LinkRows rows={row.rows} />
          ) : (
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{row.emptyLine}</p>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * "More when widened: Chronicle · Chapters" — what this size hides that a wider one shows.
 * A button that widens when the host can widen; otherwise the same words as a plain line
 * (the lab, where every size is already drawn). Never shown when nothing is hidden.
 */
export function MoreWhenWidened({ hidden, onWiden }: { hidden: readonly string[]; onWiden?: () => void }) {
  if (hidden.length === 0) return null;
  const text = `${INSPECTOR_WORDS.moreWhenWidened}: ${hidden.join(' · ')}`;
  return onWiden ? (
    <Button variant="ghost" size="sm" onClick={onWiden} data-inspector-more="">{text}</Button>
  ) : (
    <p data-inspector-more="" style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{text}</p>
  );
}
