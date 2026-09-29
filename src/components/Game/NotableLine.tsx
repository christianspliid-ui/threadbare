/**
 * NotableLine — the settlement's notable, lifted to the top of Inhabitants (THR-1655).
 *
 * A **notable** chip (`agent.notable`, Law 17), the name, and one sentence built from the
 * selector's clauses — *Holds* the Tanner's Yard. *At odds with* Kael. *Knows something
 * about* Ysolde. The producer (`engine/settlementNotable.ts`) declares every noun; this
 * component only picks the lead words. Every noun is a link through the one router (Law 21).
 * No numerals, no keys (Laws 13/14), sentences rather than key:value (Law 16).
 */

import { Fragment, type ReactNode } from 'react';
import type {
  SettlementNotable,
  SettlementNotableClause,
  SettlementNotableClauseKind,
} from '../../engine/settlementNotable';
import { EntityLink } from '../shared/EntityLink';
import { Tooltip } from '../shared/Tooltip';

/** The lead words of each clause, in the plain register (Law 42). */
export const NOTABLE_CLAUSE_LEADS: Record<SettlementNotableClauseKind, string> = {
  holds: 'Holds',
  at_odds_with: 'At odds with',
  knows_secret_of: 'Knows something about',
  is_owed_by: 'Is owed a favour by',
};

const CLAUSE_ORDER: SettlementNotableClauseKind[] = ['holds', 'at_odds_with', 'knows_secret_of', 'is_owed_by'];

interface NotableLineProps {
  notable: SettlementNotable;
  onAgentClick?: (agentId: string) => void;
}

function targetLink(clause: SettlementNotableClause, onAgentClick?: (id: string) => void): ReactNode {
  return (
    <EntityLink
      id={clause.targetId}
      name={clause.targetName}
      entityRef={{ kind: clause.targetKind, id: clause.targetId }}
      onOpenEntity={clause.targetKind === 'agent' ? onAgentClick : undefined}
    />
  );
}

/** "A", "A and B", "A, B and C" — each name a link. */
function joinLinks(nodes: ReactNode[]): ReactNode[] {
  return nodes.map((node, i) => (
    <Fragment key={i}>
      {i > 0 && (i === nodes.length - 1 ? ' and ' : ', ')}
      {node}
    </Fragment>
  ));
}

export function NotableLine({ notable, onAgentClick }: NotableLineProps) {
  const groups = CLAUSE_ORDER
    .map(kind => ({ kind, clauses: notable.clauses.filter(c => c.kind === kind) }))
    .filter(g => g.clauses.length > 0);

  return (
    <div
      data-testid="settlement-notable"
      data-notable-id={notable.notableId}
      className="px-2 py-1.5 mb-1 rounded"
      style={{ borderLeft: '3px solid var(--accent-gold)', backgroundColor: 'var(--bg-deep)' }}
    >
      <div className="flex items-center gap-2">
        <Tooltip id="agent.notable">
          <span
            data-testid="notable-chip"
            className="text-xs px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ backgroundColor: 'var(--border-gold)', color: 'var(--accent-gold)', cursor: 'help' }}
          >
            notable
          </span>
        </Tooltip>
        <span className="text-sm">
          <EntityLink
            id={notable.notableId}
            name={notable.notableName}
            entityRef={{ kind: 'agent', id: notable.notableId }}
            onOpenEntity={onAgentClick}
          />
        </span>
      </div>
      {groups.length > 0 && (
        <p
          data-testid="settlement-notable-sentence"
          className="text-sm mt-1"
          style={{ color: 'var(--text-secondary)', margin: 0 }}
        >
          {groups.map((g, i) => (
            <Fragment key={g.kind}>
              {i > 0 && ' '}
              <em>{NOTABLE_CLAUSE_LEADS[g.kind]}</em>{' '}
              {joinLinks(g.clauses.map(c => <Fragment key={c.targetId}>{targetLink(c, onAgentClick)}</Fragment>))}
              .
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}
