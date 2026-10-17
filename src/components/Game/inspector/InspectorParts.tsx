/**
 * The Inspector page's parts (THR-1876 § D5): the Act row, the Connections block,
 * *In this land* and "More when widened". Each renders a view model; none reads the graph.
 */
import type { CSSProperties } from 'react';
import type { ActOnVM, ConnectionsVM, LandIndexVM } from '../../../engine/views/subjects/subjectTypes';
import type { SphereName } from '../../../types';
import { Chip } from '../../shared/Chip';
import { Button } from '../../shared/Button';
import { LinkRows, SectionLabel } from '../../shared/Section';
import { INSPECTOR_WORDS } from '../../../data/view-content';

const blockStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 };

/**
 * Act on <name> (call 1): the subject's cards, sphere-tinted (the loved tint). S1 shows
 * which cards work here and why a locked one is locked; arming and casting from this row
 * arrive with S3 (THR-1911), so nothing here is a button yet (Law 25: no dead control).
 */
export function ActOnRow({ actOn }: { actOn: ActOnVM }) {
  return (
    <section data-inspector-act="" style={blockStyle} aria-label={actOn.heading}>
      <SectionLabel label={actOn.heading} gold={true} />
      {actOn.cards.length === 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{actOn.emptyLine}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {actOn.cards.map(card => (
            <span key={card.actionId} data-act-card={card.actionId} data-available={card.available ? 'true' : 'false'}
              style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', opacity: card.available ? 1 : 0.6, minWidth: 0 }}>
              <Chip role="state" size="sm" label={card.name} tint={card.sphere ? { sphere: card.sphere as SphereName } : 'neutral'} />
              {card.reason && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{card.reason}</span>}
            </span>
          ))}
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
