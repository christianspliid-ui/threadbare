/**
 * The faction sheet's crown surfaces (THR-1932 § Player-facing display).
 *
 * - `CrownLine` — under Leadership, only on a Crown: the Crown chip and
 *   "<ruler> wears the crown; nine factions owe it fealty."
 * - `FealtySection` — after Relations: a vassal's liege, how its oath was won, and its
 *   standing on the reputation words ("one step from breaking" at Unknown); a liege's
 *   vassals with their words, folded past FEALTY_LIST_FOLD. Not rendered on a faction
 *   with neither (Law 56: no empty chrome).
 *
 * Words only (Laws 13/14); every name routes through the ref router (Law 21); the chip
 * and the standing word carry registry tooltips (Laws 1/17). All of it is read from the
 * `sworn_to` edges through `fealtyView`, so the sheet and the chronicle cannot disagree.
 */

import React, { useState } from 'react';
import type { WorldGraph } from '../../engine/graph';
import { fealtyView, type FealtyPart } from '../../engine/crown/fealtySentences';
import { FEALTY_LIST_FOLD } from '../../data/crown-constants';
import { Tooltip } from '../shared/Tooltip';
import { EntityLink } from '../shared/EntityLink';

/** Renders a sentence's parts; a link followed by punctuation stays glued to it. */
function Parts({ parts }: { parts: FealtyPart[] }) {
  const out: React.ReactNode[] = [];
  let list = parts;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (typeof p === 'string') {
      out.push(<React.Fragment key={i}>{p}</React.Fragment>);
      continue;
    }
    const link = <EntityLink id={p.ref.id} name={p.text} entityRef={{ kind: p.ref.kind, id: p.ref.id }} />;
    const next = list[i + 1];
    const punct = typeof next === 'string' ? /^[.,;:]/.exec(next)?.[0] : undefined;
    if (punct && typeof next === 'string') {
      out.push(<span key={i} style={{ whiteSpace: 'nowrap' }}>{link}{punct}</span>);
      list = [...list.slice(0, i + 1), next.slice(punct.length), ...list.slice(i + 2)];
    } else {
      out.push(<React.Fragment key={i}>{link}</React.Fragment>);
    }
  }
  return <>{out}</>;
}

const TERM_STYLE = { textDecoration: 'underline', textDecorationStyle: 'dotted' } as const;

export function CrownLine({ factionId, graph }: { factionId: string; graph: WorldGraph }) {
  const { crown } = fealtyView(graph, factionId);
  if (!crown) return null;
  return (
    <div data-testid="faction-crown-line" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
      <Tooltip id="ui.crown.title">
        <span
          className="cursor-help"
          role="term"
          data-testid="faction-crown-chip"
          style={{ fontSize: 'var(--text-xs)', padding: '1px 6px', borderRadius: '3px', border: '1px solid var(--accent-gold, #d4af37)', color: 'var(--accent-gold, #d4af37)', whiteSpace: 'nowrap' }}
        >
          Crown
        </span>
      </Tooltip>
      <span>
        {crown.ruler ? (
          <>
            <Parts parts={[crown.ruler]} /> wears the crown; {crown.count}
          </>
        ) : (
          crown.count.charAt(0).toUpperCase() + crown.count.slice(1)
        )}
      </span>
    </div>
  );
}

export function FealtySection({ factionId, graph, renderSection }: {
  factionId: string;
  graph: WorldGraph;
  /** The sheet's own Section wrapper, so the heading matches its neighbours. */
  renderSection: (title: string, body: React.ReactNode) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const { vassal, liege } = fealtyView(graph, factionId);
  if (!vassal && !liege) return null;

  const shown = liege ? (expanded ? liege.vassals : liege.vassals.slice(0, FEALTY_LIST_FOLD)) : [];

  return (
    <>
      {renderSection('Fealty', (
        <div data-testid="faction-fealty" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {vassal && (
            <>
              <span data-testid="faction-fealty-oath"><Parts parts={vassal.oath} /></span>
              <span data-testid="faction-fealty-standing" style={{ color: 'var(--text-tertiary)' }}>
                Its standing with its liege:{' '}
                <Tooltip id="ui.crown.standing">
                  <span className="cursor-help" role="term" style={TERM_STYLE}>{vassal.standing.word}</span>
                </Tooltip>
                {vassal.standing.oneStepFromBreaking ? ', one step from breaking' : ''} — {vassal.standing.rest}
              </span>
            </>
          )}
          {liege && (
            <div data-testid="faction-fealty-vassals" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>Holds the fealty of:</span>
              {shown.map(v => (
                <span key={v.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                  <Parts parts={[v.part]} />
                  <Tooltip id="ui.crown.standing">
                    <span className="cursor-help" role="term" style={{ ...TERM_STYLE, color: 'var(--text-tertiary)' }}>{v.word}</span>
                  </Tooltip>
                </span>
              ))}
              {liege.moreWords && !expanded && (
                <button
                  type="button"
                  data-testid="faction-fealty-more"
                  onClick={() => setExpanded(true)}
                  style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-gold, #d4af37)', font: 'inherit', fontSize: 'var(--text-xs)' }}
                >
                  and {liege.moreWords} more
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
