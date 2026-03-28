import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import {
  AMBITION_PRIMARY_INTERACTIONS,
  AMBITION_SECONDARY_INTERACTIONS,
} from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { IntentSection } from '../IntentSection';

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

interface JourneyTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
}

export function JourneyTab({ card, knowledge }: JourneyTabProps) {
  // Whether to show ambitions
  const showAmbitions = knowledge != null
    ? knowledge.interactionDepth >= AMBITION_PRIMARY_INTERACTIONS
    : hasKnowledge(card.knowledgeLevel, 'known');

  // Whether to show secondary ambitions
  const showSecondaryAmbitions = knowledge != null
    ? knowledge.interactionDepth >= AMBITION_SECONDARY_INTERACTIONS
    : hasKnowledge(card.knowledgeLevel, 'intimate');

  const visibleIntents = (() => {
    if (!card.intents || card.intents.length === 0) return [];
    if (!showAmbitions) return [];
    if (showSecondaryAmbitions) return card.intents;
    return card.intents.filter(i => i.priority === 'primary');
  })();

  return (
    <div className="space-y-4">
      {/* Current Activity */}
      <section>
        <SectionHeading as="h2">Current Activity</SectionHeading>
        {card.locationName && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Last seen in <span style={{ color: 'var(--accent-gold)' }}>{card.locationName}</span>.
          </p>
        )}
        <p className="text-stone-400 italic text-sm mt-1">
          Activity details will be available in a future update.
        </p>
      </section>

      {/* Ambitions / Intents */}
      <section>
        <SectionHeading as="h2">Ambitions</SectionHeading>
        {showAmbitions && visibleIntents.length > 0 ? (
          <IntentSection intents={visibleIntents} variant="modal" />
        ) : (
          <p className="text-stone-400 italic text-sm">
            You don&apos;t yet know what drives {card.name}.
          </p>
        )}
      </section>

      {/* Environmental context — placeholder */}
      <section>
        <SectionHeading as="h2">Environment</SectionHeading>
        <p className="text-stone-400 italic text-sm">
          Environmental context coming soon.
        </p>
      </section>
    </div>
  );
}
