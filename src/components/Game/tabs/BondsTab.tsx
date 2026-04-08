import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';

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

// ─── Component ───────────────────────────────────────────────────

interface BondsTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
}

export function BondsTab({ card, knowledge }: BondsTabProps) {
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

      {/* Agreements — placeholder */}
      <section>
        <SectionHeading as="h2">Agreements</SectionHeading>
        <p className="text-stone-400 italic text-sm">No known agreements.</p>
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
