import { useEffect, useRef, useState } from 'react';
import type { AgentInfoCardData, AgentFullProfileData } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import { BACKSTORY_CONSTANTS } from '../../../types/prose';
import { SectionHeading } from '../../shared/SectionHeading';
import { getSphereColor } from '../../../data/sphereIcons';

// ─── Stratum locked-tier placeholder text ────────────────────────

const LOCKED_TEXT: Record<2 | 3 | 4, string> = {
  2: 'There are stories {name} shares only with those who have proven their devotion.',
  3: 'The fears and contradictions within {name} are visible only to a true champion of the divine.',
  4: 'Only when {name} becomes an aspect of the divine can the full truth be read in their threads.',
};

// ─── Component ───────────────────────────────────────────────────

interface ChronicleTabProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  knowledge?: AgentKnowledge;
  scrollToNewStrata?: boolean;
}

export function ChronicleTab({ card, profile, knowledge, scrollToNewStrata }: ChronicleTabProps) {
  const backstorySectionRef = useRef<HTMLDivElement>(null);
  const [fadedStrata, setFadedStrata] = useState<Set<number>>(new Set());

  // Auto-scroll to backstory section when flagged
  useEffect(() => {
    if (scrollToNewStrata && backstorySectionRef.current) {
      backstorySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToNewStrata]);

  // Fade New badges after NEW_BADGE_FADE_MS
  useEffect(() => {
    const newStrata = card.backstory?.strata.filter(s => s.isNew).map(s => s.tier) ?? [];
    if (newStrata.length === 0) return;
    const timer = setTimeout(() => {
      setFadedStrata(new Set(newStrata));
    }, BACKSTORY_CONSTANTS.NEW_BADGE_FADE_MS);
    return () => clearTimeout(timer);
  }, [card.backstory]);

  // Timeline events filtered by knownEvents if knowledge present
  const timelineEvents = (() => {
    if (!profile?.historyTimeline || profile.historyTimeline.length === 0) return [];
    if (knowledge != null) {
      return profile.historyTimeline.filter(e => knowledge.knownEvents.has(String(e.tick)));
    }
    // No knowledge: show all (transparent fallback)
    return profile.historyTimeline;
  })();

  const showBackstory = card.backstory && card.backstory.strata.length > 0;
  const showTier0Placeholder =
    (!card.backstory || card.backstory.strata.length === 0) && card.influenceTier === 0;

  return (
    <div className="space-y-4">
      {/* Backstory Strata */}
      {(showBackstory || showTier0Placeholder) && (
        <section ref={backstorySectionRef} data-testid="their-story-section">
          <h2
            className="font-bold mb-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Their Story
            <span
              className="ml-2 text-xs font-normal opacity-30"
              style={{ color: 'var(--text-tertiary)' }}
            >
              ✦ ─ ✦
            </span>
          </h2>

          {showTier0Placeholder && (
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              You sense there is more to {card.name}&apos;s story, but the threads between you are too thin to read it.
            </p>
          )}

          {showBackstory && (
            <div className="space-y-5 mt-3">
              {card.backstory!.strata.map((stratum) => {
                const sphereColor = card.primarySphere ? getSphereColor(card.primarySphere) : 'var(--accent-gold)';
                const isFaded = fadedStrata.has(stratum.tier);
                return (
                  <div key={stratum.tier}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1" style={{ backgroundColor: sphereColor, opacity: 0.25 }} />
                      <span
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: sphereColor, opacity: 0.8 }}
                      >
                        {stratum.title}
                      </span>
                      {stratum.isNew && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-semibold transition-opacity duration-1000"
                          style={{
                            backgroundColor: sphereColor + '33',
                            color: sphereColor,
                            opacity: isFaded ? 0 : 1,
                          }}
                        >
                          ✦ New
                        </span>
                      )}
                      <div className="h-px flex-1" style={{ backgroundColor: sphereColor, opacity: 0.25 }} />
                    </div>
                    <p className="text-xs italic mb-1" style={{ color: sphereColor, opacity: 0.5 }}>
                      {stratum.subtitle}
                    </p>
                    <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--text-secondary)' }}>
                      {stratum.text.split('\n\n').map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                );
              })}

              {([2, 3, 4] as const).filter(tier => tier > card.backstory!.maxStratum).map(tier => (
                <div key={`locked-${tier}`} className="opacity-40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      ◈ Locked
                    </span>
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                  </div>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {LOCKED_TEXT[tier].replace('{name}', card.name)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Timeline */}
      <section>
        <SectionHeading as="h2">Timeline</SectionHeading>
        {timelineEvents.length > 0 ? (
          <div className="space-y-2">
            {[...timelineEvents].reverse().map((entry, idx) => (
              <div key={idx} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-gold)' }}>t{entry.tick}</span>
                {' — '}
                <span style={{ color: 'var(--text-tertiary)' }}>{entry.event}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 italic text-sm">No events recorded.</p>
        )}
      </section>

      {/* Full backstory at transparent level */}
      {card.knowledgeLevel === 'transparent' && profile?.fullBackstory && (
        <section>
          <SectionHeading as="h2">Full Account</SectionHeading>
          <div className="text-sm space-y-3" style={{ color: 'var(--text-secondary)' }}>
            {profile.fullBackstory.split('\n\n').map((para, idx) => (
              <p key={idx} className="leading-relaxed">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Interaction Record at transparent level */}
      {card.knowledgeLevel === 'transparent' && profile?.dispositionRecord && profile.dispositionRecord.length > 0 && (
        <section>
          <SectionHeading as="h2">Interaction Record</SectionHeading>
          <div className="space-y-2">
            {profile.dispositionRecord.map((record, idx) => (
              <div key={idx} className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: 'var(--accent-gold)' }}>t{record.tick}</span>
                  <span className="capitalize" style={{ color: 'var(--accent-gold)' }}>{record.context}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {record.actorMove} → {record.targetMove}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{record.stakes}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Ambitions — placeholder */}
      <section>
        <SectionHeading as="h2">Completed Ambitions</SectionHeading>
        <p className="text-stone-400 italic text-sm">
          Completed ambitions will appear here.
        </p>
      </section>
    </div>
  );
}
