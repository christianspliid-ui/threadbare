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
import { incomeSentence, spendingSentence, type PursePart } from '../../engine/factionPurse/purseSentences';
import { readWealth } from '../../engine/wealth';
import { Tooltip } from '../shared/Tooltip';
import { EntityLink } from '../shared/EntityLink';

interface FactionPursePanelProps {
  factionId: string;
  graph: WorldGraph;
}

function Parts({ parts }: { parts: PursePart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string'
          ? <React.Fragment key={i}>{p}</React.Fragment>
          : <EntityLink key={i} id={p.ref.id} name={p.text} entityRef={{ kind: p.ref.kind, id: p.ref.id }} />,
      )}
    </>
  );
}

export function FactionPursePanel({ factionId, graph }: FactionPursePanelProps) {
  const node = graph.getNode(factionId);
  const band = readMeansBand(node);
  if (!node || !band) return null;
  const day = readPurseDay(node);
  const broke = (day?.armiesUnpaid.length ?? 0) > 0;

  return (
    <div data-testid="faction-purse" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-sm)' }}>
      <span data-testid="faction-purse-means" style={{ color: 'var(--text-secondary)' }}>
        <Tooltip id="ui.econ.means.faction">
          <span
            className="cursor-help"
            role="term"
            style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', color: broke ? 'var(--text-danger, #f87171)' : undefined }}
          >
            {band}
          </span>
        </Tooltip>
      </span>
      <span data-testid="faction-purse-income" style={{ color: 'var(--text-secondary)' }}>
        <Parts parts={incomeSentence(graph, day)} />
      </span>
      <span data-testid="faction-purse-spending" style={{ color: broke ? 'var(--text-danger, #f87171)' : 'var(--text-tertiary)' }}>
        {spendingSentence(graph, day, readWealth(node.properties))}
      </span>
      {/* Monopoly chip slot — renders nothing until THR-1933 writes the state (Law 56). */}
    </div>
  );
}
