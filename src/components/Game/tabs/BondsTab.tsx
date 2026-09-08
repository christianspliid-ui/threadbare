import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { EntityLink } from '../../shared/EntityLink';

// ─── Knowledge level helpers ──────────────────────────────────────

const KNOWLEDGE_RANK: Record<string, number> = {
  stranger: 0,
  recognised: 1,
  known: 2,
  intimate: 3,
  transparent: 4,
};

function hasKnowledge(level: string, minimum: string): boolean {
  return (KNOWLEDGE_RANK[level] ?? 0) >= (KNOWLEDGE_RANK[minimum] ?? 0);
}

// ─── Trust descriptor ─────────────────────────────────────────────

function getTrustDescriptor(strength: number, sentiment: string): string {
  if (sentiment === 'positive') {
    if (strength >= 0.8) return 'Sworn ally';
    if (strength >= 0.5) return 'Trusted companion';
    if (strength >= 0.2) return 'Cautious acquaintance';
    return 'Unknown quantity';
  } else {
    if (strength >= 0.8) return 'Sworn enemy';
    if (strength >= 0.5) return 'Hostile toward';
    if (strength >= 0.2) return 'Wary of';
    return 'Unknown quantity';
  }
}

// ─── Disposition labels ───────────────────────────────────────────

const DISPOSITION_LABEL_MAP: Record<string, string> = {
  'tit-for-tat': 'Repays in kind',
  'grudger': 'Forgives slowly',
  'pavlov': 'Learns from pain',
  'always-cooperate': 'Trusting soul',
  'always-defect': 'Looks out for themselves',
};

// ─── Revelation source badge ──────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  witnessed: 'Witnessed',
  gossip: 'Hearsay',
  divine: 'Divine sight',
  faction: 'Faction record',
};

// ─── Agreements (THR-1439) ────────────────────────────────────────

/**
 * One Agreements row: a sentence in three pieces so the other party can be a link
 * (Law 21 — the two ends of a bond are both reachable).
 */
interface AgreementRow {
  key: string;
  lead: string;
  partyId: string;
  partyName: string;
  tail: string;
}

/**
 * The live marks and favours on this sheet, in words.
 *
 * Both classes of Agreement, in the order they matter to a reader: what this mortal
 * holds over other people, what other people hold over them, what they are owed and
 * what they owe. Provenance is part of the sentence — a stolen secret says *taken
 * from*, a called-in favour says the asking was deliberate — because those are exactly
 * the facts the two new cells produce, and a row that flattened them would leave the
 * cells writing what nothing reads.
 *
 * No numbers of any kind (Law 4): `magnitude` decides nothing here, and a count of
 * secrets is not a thing anyone would say out loud.
 */
function buildAgreementRows(card: AgentInfoCardData): AgreementRow[] {
  if (!hasKnowledge(card.knowledgeLevel, 'known')) return [];
  const leverage = card.leverage;
  if (!leverage) return [];
  const rows: AgreementRow[] = [];

  for (const secret of leverage.secretsHeld) {
    rows.push({
      key: `held-${secret.subjectId}`,
      lead: 'They know something about ',
      partyId: secret.subjectId,
      partyName: secret.subjectName,
      tail: secret.source === 'stolen'
        ? `, taken from ${secret.stolenFromName ?? 'whoever held it before'}.`
        : '.',
    });
  }
  for (const secret of leverage.secretsAbout) {
    rows.push({
      key: `about-${secret.subjectId}`,
      lead: 'Something of theirs is known to ',
      partyId: secret.subjectId,
      partyName: secret.subjectName,
      tail: '.',
    });
  }
  for (const favor of leverage.favorsOwedToMe) {
    rows.push({
      key: `owed-${favor.counterpartyId}`,
      lead: '',
      partyId: favor.counterpartyId,
      partyName: favor.counterpartyName,
      tail: favor.context === 'called_in'
        ? ' owes them a favour, called in and not yet repaid.'
        : ' owes them a favour.',
    });
  }
  for (const favor of leverage.favorsOwed) {
    rows.push({
      key: `owes-${favor.counterpartyId}`,
      lead: 'They owe ',
      partyId: favor.counterpartyId,
      partyName: favor.counterpartyName,
      tail: favor.context === 'called_in' ? ' a favour that was asked for.' : ' a favour.',
    });
  }
  return rows;
}

// ─── Component ───────────────────────────────────────────────────

interface BondsTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
  /** Opens the other party's sheet from a grudge line (THR-1298). */
  onOpenEntity?: (id: string) => void;
}

export function BondsTab({ card, knowledge, onOpenEntity }: BondsTabProps) {
  const showFaction = hasKnowledge(card.knowledgeLevel, 'recognised') && card.factionName && card.factionRank;

  // Bonds to show — revealed bonds augmented by knowledgeLevel fallback
  const bondsToShow = (() => {
    const byKnowledge = knowledge != null
      ? (card.topBonds ?? []).map(bond => {
          const source = knowledge.revealedBonds.get(bond.name);
          if (source === undefined) return null;
          return { ...bond, source };
        }).filter((b): b is NonNullable<typeof b> => b !== null)
      : [];
    const byLevel = hasKnowledge(card.knowledgeLevel, 'known')
      ? (card.topBonds ?? []).map(b => ({ ...b, source: undefined as string | undefined }))
      : [];
    return byLevel.length > byKnowledge.length ? byLevel : byKnowledge;
  })();

  const showDisposition =
    (knowledge != null && knowledge.dispositionRevealed)
    || hasKnowledge(card.knowledgeLevel, 'intimate');

  const dispositionLabel = card.cooperationStrategy
    ? (DISPOSITION_LABEL_MAP[card.cooperationStrategy] ?? card.cooperationStrategy)
    : null;

  const agreementRows = buildAgreementRows(card);

  return (
    <div className="space-y-4">
      {/* Faction */}
      {showFaction && (
        <section data-testid="modal-faction">
          <SectionHeading as="h2">Faction</SectionHeading>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {card.factionIconGlyph ? `${card.factionIconGlyph} ` : ''}{card.factionName}
              </span>
              <span className="text-sm" style={{ color: card.factionThemeColor ?? 'var(--accent-gold)' }}>{card.factionRank}</span>
            </div>
            {hasKnowledge(card.knowledgeLevel, 'known') && card.factionReputation != null && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(card.factionReputation * 100)}%`,
                      backgroundColor: card.factionThemeColor ?? 'var(--accent-gold)',
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                  {Math.round(card.factionReputation * 100)}%
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Relationships */}
      <section>
        <SectionHeading as="h2">Relationships</SectionHeading>
        {bondsToShow.length > 0 ? (
          <div className="space-y-2">
            {bondsToShow.map((bond, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-gold)' }}>{bond.name}</span>
                  {' — '}
                  <span>{getTrustDescriptor(0.5, bond.sentiment)}</span>
                </p>
                {bond.source && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
                  >
                    {SOURCE_LABELS[bond.source] ?? bond.source}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic text-sm">
            You know nothing of {card.name}&apos;s relationships.
          </p>
        )}
      </section>

      {/* Standing grudges (THR-1298). Rendered only when blood exists — an agent who
          has wronged nobody gets no heading, so the section's presence is itself the
          signal. Separate from Relationships because a soured bond can sweeten and a
          grudge is a fact about what happened. */}
      {(card.grudges?.length ?? 0) > 0 && (
        <section data-testid="modal-grudges">
          <SectionHeading as="h2">Blood</SectionHeading>
          <div className="space-y-2">
            {card.grudges!.map(grudge => (
              <p key={grudge.targetId} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {'There is blood between them and '}
                <EntityLink id={grudge.targetId} name={grudge.targetName} onOpenEntity={onOpenEntity} />
                {` — ${grudge.causeClause}.`}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Agreements (THR-1439). The leverage strand has been computed on the card
          since THR-30 and rendered nowhere the player could reach — its only
          renderers were the unmounted AgentDetailPanel (impediment #981) and the
          debug tab, so a stolen secret and a called-in favour were invisible on the
          surface the god actually opens. These rows are that strand, in words: no
          magnitudes, no keys, no counts (Law 4). Gated at `known`, the same bar the
          Relationships rows above use — a stranger's agreements are nobody's
          business, and their sheet keeps the placeholder. */}
      <section data-testid="modal-agreements">
        <SectionHeading as="h2">Agreements</SectionHeading>
        {agreementRows.length > 0 ? (
          <div className="space-y-2">
            {agreementRows.map(row => (
              <p key={row.key} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {row.lead}
                <EntityLink id={row.partyId} name={row.partyName} onOpenEntity={onOpenEntity} />
                {row.tail}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic text-sm">No known agreements.</p>
        )}
      </section>

      {/* Disposition */}
      {showDisposition && dispositionLabel && (
        <section>
          <SectionHeading as="h2">Disposition</SectionHeading>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Strategy</span>
              <Tooltip label="Cooperation Strategy" desc="How this agent behaves in prisoner's dilemma situations. Affects trust, betrayal, and reputation.">
                <span className="text-sm underline decoration-dotted cursor-help" style={{ color: 'var(--accent-gold)' }}>
                  {dispositionLabel}
                </span>
              </Tooltip>
            </div>
            {card.reputationWord && (
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reputation</span>
                <span className="text-sm capitalize" style={{ color: 'var(--accent-gold)' }}>{card.reputationWord}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
