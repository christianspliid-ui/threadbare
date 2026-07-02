import type { AgentInfoCardData, AgentFullProfileData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import {
  OVERVIEW_GOSSIP_THRESHOLD,
  OVERVIEW_BACKSTORY_INTERACTIONS,
} from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { getSphereColor } from '../../../data/sphereIcons';
import { CORE_CONTINUA, CORE_NEUTRAL } from '../../../types/coreRegistry';

// ─── Core continuum rendering ─────────────────────────────────────

/**
 * A position within ±CORE_LEAN_EPSILON of neutral reads as "balanced" — neither
 * pole word is emphasized. Purely visual; does not affect engine mechanics.
 */
const CORE_LEAN_EPSILON = 0.05;

// ─── Personality trait rendering (THR-562) ────────────────────────

/**
 * Pole accent colors for the emergent Personality section. Virtue leans on the
 * sheet's gold accent (a positive cast); vice uses a muted rose that reads as
 * cautionary without the alarm of the scar-red used for wounds. The distinction
 * makes "who they've become" legible at a glance.
 */
const PERSONALITY_VIRTUE_COLOR = 'var(--accent-gold)';
const PERSONALITY_VICE_COLOR = '#c77b7b';

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

/**
 * One Core continuum as a labelled track with a marker at the agent's position.
 * Scale: virtue pole = 1.0 (left), vice pole = 0.0 (right), 0.5 neutral (centre).
 * The leaning pole word is brightened; a near-neutral value brightens neither.
 */
function CoreContinuumRow({ virtue, vice, value }: { virtue: string; vice: string; value: number }) {
  const v = Math.max(0, Math.min(1, value));
  // Marker offset from the left edge: virtue (1.0) sits left, vice (0.0) sits right.
  const markerLeftPct = (1 - v) * 100;
  const leansVirtue = v > CORE_NEUTRAL + CORE_LEAN_EPSILON;
  const leansVice = v < CORE_NEUTRAL - CORE_LEAN_EPSILON;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: leansVirtue ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>
          {virtue}
        </span>
        <span style={{ color: leansVice ? 'var(--accent-gold)' : 'var(--text-tertiary)' }}>
          {vice}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-subtle)' }}>
        {/* Neutral centre reference tick */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '50%', width: '1px', backgroundColor: 'var(--text-tertiary)', opacity: 0.4 }}
        />
        {/* Position marker */}
        <div
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: `${markerLeftPct}%`,
            width: '8px',
            height: '8px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--accent-gold)',
          }}
        />
      </div>
    </div>
  );
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
    ? Math.max(
        Math.min(card.quotes?.length ?? 0, Math.floor(knowledge.interactionDepth)),
        card.quotes?.length ?? 0, // knowledgeLevel already gated card.quotes
      )
    : card.quotes?.length ?? 0;

  // Whether reputation is revealed
  const reputationRevealed =
    (knowledge != null && knowledge.interactionDepth >= OVERVIEW_GOSSIP_THRESHOLD)
    || hasKnowledge(card.knowledgeLevel, 'known');

  // Whether origin/backstory is revealed
  const backstoryRevealed =
    (knowledge != null && knowledge.interactionDepth >= OVERVIEW_BACKSTORY_INTERACTIONS)
    || hasKnowledge(card.knowledgeLevel, 'intimate');

  // Values to show: from revealedValues facets if knowledge present, else KnowledgeLevel-gated
  const valuesToShow = (() => {
    const byKnowledge = knowledge != null
      ? (card.topValues ?? []).filter(v => knowledge.revealedValues.has(v.pair))
      : [];
    const byLevel = hasKnowledge(card.knowledgeLevel, 'recognised')
      ? (card.topValues ?? [])
      : [];
    return byLevel.length > byKnowledge.length ? byLevel : byKnowledge;
  })();

  const showNatureSection = knowledge != null || hasKnowledge(card.knowledgeLevel, 'recognised');
  const showTraits = hasKnowledge(card.knowledgeLevel, 'intimate') && (card.allTraits?.length ?? 0) > 0;
  const showPersonality = hasKnowledge(card.knowledgeLevel, 'intimate') && (card.personalityTraits?.length ?? 0) > 0;
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

      {hasKnowledge(card.knowledgeLevel, 'recognised') && card.factionName && (
        <section>
          <SectionHeading as="h2">Faction</SectionHeading>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {card.factionIconGlyph ? `${card.factionIconGlyph} ` : ''}{card.factionName}
              </p>
              {card.factionRank && (
                <p className="text-xs" style={{ color: card.factionThemeColor ?? 'var(--accent-gold)' }}>
                  {card.factionRank}
                </p>
              )}
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

      {/* Core — the 5 foundation continuums (who they fundamentally are).
          Sits above Nature/reach so the layering reads bedrock → expression.
          Gated at intimate+ (card.coreProfile is only populated then). */}
      {card.coreProfile && (
        <section>
          <SectionHeading as="h2">Core</SectionHeading>
          <p className="text-xs italic mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Who {card.name} fundamentally is — beneath how they act.
          </p>
          <div className="space-y-2">
            {CORE_CONTINUA.map((c) => (
              <CoreContinuumRow
                key={c.continuumId}
                virtue={c.virtue.word}
                vice={c.vice.word}
                value={card.coreProfile![c.continuumId] ?? CORE_NEUTRAL}
              />
            ))}
          </div>
        </section>
      )}

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

      {/* Personality — emergent moral-axis traits ("who they've become"), intimate+.
          Distinguished from the generic Traits chips: virtue/vice-tinted, flavor on hover. */}
      {showPersonality && (
        <section>
          <SectionHeading as="h2">Personality</SectionHeading>
          <p className="text-xs italic mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Who {card.name} has become — the mark of their choices.
          </p>
          <div className="flex flex-wrap gap-2">
            {card.personalityTraits!.map((t) => {
              const color = t.pole === 'virtue' ? PERSONALITY_VIRTUE_COLOR : PERSONALITY_VICE_COLOR;
              return (
                <span
                  key={t.id}
                  data-testid="personality-trait"
                  title={t.flavorText || t.description || undefined}
                  className="px-2 py-0.5 rounded text-xs border"
                  style={{ borderColor: color, color }}
                >
                  {t.name}
                </span>
              );
            })}
          </div>
        </section>
      )}

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
