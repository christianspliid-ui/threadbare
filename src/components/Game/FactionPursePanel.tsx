/**
 * The faction sheet's Purse panel (THR-1931; THR-1870 § 4).
 *
 * Four lines, words only (Laws 13/14 — no amount, price or id):
 *   1. the Means chip — the faction's written `meansBand` on the shared five-word ladder,
 *   2. the income sentence — the two largest sources by name, and who takes a share,
 *   3. the spending sentence — its armies and how long the purse keeps them, or the
 *      broke line when any army went unpaid today,
 *   4. the monopoly chip slot — empty until economic war aims (THR-1933) writes the
 *      state that fills it (Law 56: no chip without state).
 *
 * Every line is composed from the `purseLastDay` the `faction_purse` phase wrote, so
 * the chip, the sentences and the chronicle cannot disagree (Law 56). Names route
 * through the ref router (Law 21).
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import { readPurseDay, readMeansBand } from '../../engine/factionPurse';
import { factionPurseView, type PursePart } from '../../engine/factionPurse/purseSentences';
import { fealtyPurseSentence } from '../../engine/crown/fealtySentences';
import { Tooltip } from '../shared/Tooltip';
import { EntityLink } from '../shared/EntityLink';

interface FactionPursePanelProps {
  factionId: string;
  graph: WorldGraph;
}

/**
 * Renders a sentence's parts. A link followed by punctuation is glued to it in a
 * no-wrap span, so a full stop never wraps onto a line of its own.
 */
function Parts({ parts }: { parts: PursePart[] }) {
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

export function FactionPursePanel({ factionId, graph }: FactionPursePanelProps) {
  const view = factionPurseView(graph, factionId, { band: readMeansBand, day: readPurseDay });
  if (!view) return null;
  const { band, broke } = view;
  // THR-1932 — one sentence when this faction paid fealty today (words only, no amount).
  const fealty = fealtyPurseSentence(graph, readPurseDay(graph.getNode(factionId)));

  return (
    <div data-testid="faction-purse" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-sm)' }}>
      <span data-testid="faction-purse-means" style={{ color: 'var(--text-secondary)' }}>
        <Tooltip id="ui.econ.means.faction">
          <span
            className="cursor-help"
            role="term"
            style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', color: broke ? 'var(--negative)' : undefined }}
          >
            {band}
          </span>
        </Tooltip>
      </span>
      {view.income.length > 0 && (
        <span data-testid="faction-purse-income" style={{ color: 'var(--text-secondary)' }}>
          <Parts parts={view.income} />
        </span>
      )}
      {fealty && (
        <span data-testid="faction-purse-fealty" style={{ color: 'var(--text-secondary)' }}>
          <Parts parts={fealty} />
        </span>
      )}
      <span data-testid="faction-purse-spending" style={{ color: broke ? 'var(--negative)' : 'var(--text-tertiary)' }}>
        {view.spending}
      </span>
      {/* Monopoly chip slot — renders nothing until THR-1933 writes the state (Law 56). */}
    </div>
  );
}
