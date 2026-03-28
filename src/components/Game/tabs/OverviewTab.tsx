import type { AgentInfoCardData, AgentFullProfileData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import {
  OVERVIEW_GOSSIP_THRESHOLD,
  OVERVIEW_BACKSTORY_INTERACTIONS,
} from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { getSphereColor } from '../../../data/sphereIcons';

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

// ─── Component ───────────────────────────────────────────────────

interface OverviewTabProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  knowledge?: AgentKnowledge;
}

export function OverviewTab({ card, profile: _profile, knowledge }: OverviewTabProps) {
  // How many quotes to show: one per interaction depth point (max 5), or all if no knowledge
  const quoteCount = knowledge != null
    ? Math.min(card.quotes?.length ?? 0, Math.floor(knowledge.interactionDepth))
    : card.quotes?.length ?? 0;

  // Whether reputation is revealed
  const reputationRevealed = knowledge != null
    ? knowledge.interactionDepth >= OVERVIEW_GOSSIP_THRESHOLD
    : hasKnowledge(card.knowledgeLevel, 'known');

  // Whether origin/backstory is revealed
  const backstoryRevealed = knowledge != null
    ? knowledge.interactionDepth >= OVERVIEW_BACKSTORY_INTERACTIONS
    : hasKnowledge(card.knowledgeLevel, 'intimate');

  // Values to show: from revealedValues facets if knowledge present, else KnowledgeLevel-gated
  const valuesToShow = knowledge != null
    ? (card.topValues ?? []).filter(v => knowledge.revealedValues.has(v.pair))
    : hasKnowledge(card.knowledgeLevel, 'recognised')
      ? (card.topValues ?? [])
      : [];

  const showNatureSection = knowledge != null || hasKnowledge(card.knowledgeLevel, 'recognised');
  const showTraits = hasKnowledge(card.knowledgeLevel, 'intimate') && (card.allTraits?.length ?? 0) > 0;
  const showQuotes = quoteCount > 0 && (card.quotes?.length ?? 0) > 0;
  const showDisposedRecord = !showNatureSection && false; // unused path

  void showDisposedRecord;

  return (
    <div className="space-y-4">
      {/* Identity — always shown */}
      <section>
        <SectionHeading as="h2">Identity</SectionHeading>
        <div className="space-y-1">
          {card.locationName && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.locationName}</p>
          )}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && card.archetypeLabel && (
            <p className="text-sm italic" style={{ color: 'var(--accent-gold)' }}>
              {card.archetypeId ? (
                <Tooltip id={`archetype.${card.archetypeId}`}>
                  <span className="underline decoration-dotted cursor-help">{card.archetypeLabel}</span>
                </Tooltip>
              ) : card.archetypeLabel}
            </p>
          )}
          {hasKnowledge(card.knowledgeLevel, 'recognised') && (card.factionName || card.cultureName) && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {[card.factionName, card.cultureName].filter(Boolean).join(' · ')}
            </p>
          )}
          {card.primarySphere && (
            <div className="flex gap-2 items-center pt-1">
              <span className="text-xs" style={{ color: 'var(--accent-gold)' }}>Attuned to</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSphereColor(card.primarySphere) }}
              />
              <Tooltip id={`sphere.${card.primarySphere}`}>
                <span className="text-xs capitalize underline decoration-dotted cursor-help" style={{ color: 'var(--text-secondary)' }}>
                  {card.primarySphere}
                </span>
              </Tooltip>
            </div>
          )}
        </div>
      </section>

      {/* Nature — values, gated by revealedValues or KnowledgeLevel */}
      {showNatureSection && (
        <section>
          <SectionHeading as="h2">Nature</SectionHeading>
          {valuesToShow.length > 0 ? (
            <div className="space-y-2">
              {valuesToShow.map((val, idx) => (
                <p key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {val.word}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 italic text-sm">
              You haven&apos;t observed {card.name} closely enough to read their character.
            </p>
          )}
        </section>
      )}

      {/* Reputation */}
      {reputationRevealed && card.reputationWord ? (
        <section>
          <SectionHeading as="h2">Reputation</SectionHeading>
          <p className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
            {card.reputationWord}
          </p>
        </section>
      ) : card.knowledgeLevel !== 'stranger' ? (
        <section>
          <SectionHeading as="h2">Reputation</SectionHeading>
          <p className="text-stone-400 italic text-sm">
            No one has spoken of {card.name}&apos;s reputation to you.
          </p>
        </section>
      ) : null}

      {/* Traits — KnowledgeLevel-gated (intimate+) */}
      {showTraits && (
        <section>
          <SectionHeading as="h2">Traits</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {card.allTraits!.map((trait, idx) => (
              <span
                key={idx}
                className="bg-stone-700 text-stone-200 px-2 py-0.5 rounded text-xs"
              >
                {trait}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Quotes */}
      {showQuotes && (
        <section>
          <SectionHeading as="h2">Words</SectionHeading>
          <div className="space-y-3">
            {card.quotes!.slice(0, quoteCount).map((quote, idx) => (
              <div
                key={idx}
                className="border-l-2 pl-3 italic text-sm"
                style={{ borderColor: 'var(--accent-gold)', color: 'var(--text-secondary)' }}
              >
                {quote}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Origin */}
      {backstoryRevealed && card.backstoryParagraph1 ? (
        <section>
          <SectionHeading as="h2">Origin</SectionHeading>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {card.backstoryParagraph1}
          </p>
        </section>
      ) : hasKnowledge(card.knowledgeLevel, 'recognised') && !backstoryRevealed ? (
        <section>
          <SectionHeading as="h2">Origin</SectionHeading>
          <p className="text-stone-400 italic text-sm">
            The story of {card.name}&apos;s origins remains unknown to you.
          </p>
        </section>
      ) : null}
    </div>
  );
}
