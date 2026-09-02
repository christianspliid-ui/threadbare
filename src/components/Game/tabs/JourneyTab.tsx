/**
 * JourneyTab — the arc panel (THR-1299 slice 4, THR-1279 verdict 1).
 *
 * The "future update" stub is gone. The tab now answers, top to bottom: are you
 * watching this mortal (the follow toggle — one state, two surfaces), what long
 * work are they running and how is it going, what drives them (`AMBITION: name`
 * + flavor + provenance), and what their arc has been so far — a strip built
 * from persisted state only, never from the day's digest.
 *
 * Every magnitude is a word (Law 13): progress via `getUndertakingProgressWord`,
 * checkpoint bands via `stepOutcomeWord`, halts as a sentence, time as
 * `ticksAgoWord`. The follow toggle, the undertaking cards and the arc strip are
 * what THR-1293 called the "second reader" of the moment stream.
 */
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import { summarizeActiveUndertakings, type ActiveUndertakingSummary } from '../../../engine/agentDetail';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import type { GameState } from '../../../types/gameState';
import {
  AMBITION_PRIMARY_INTERACTIONS,
  AMBITION_PRIMARY_KNOWLEDGE,
  AMBITION_SECONDARY_INTERACTIONS,
} from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { StepDots } from '../../shared/StepDots';
import { Tooltip } from '../../shared/Tooltip';
import { IntentSection } from '../IntentSection';
import { FollowToggle, type FollowDescriptor } from '../FollowToggle';
import { getAgentArc, type AgentArcEntry } from '../../../engine/agentArc';
import { getUndertakingProgressWord } from '../../../data/domain-words';
import { stepOutcomeWord } from '../../../data/outcome-band-content';
import { UNDERTAKING_HALT_RATCHET_N } from '../../../data/strategic-action-constants';

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

// ─── Words for the work ──────────────────────────────────────────

/** The halts sentence: how close the work is to its fork, in words. */
export function haltsSentence(u: ActiveUndertakingSummary): string {
  if (u.escalated) return 'Doubled down once already; another run of halts ends it.';
  if (u.halts <= 0) return 'Going as planned.';
  if (u.halts >= UNDERTAKING_HALT_RATCHET_N - 1) return 'Halted again and again — one more and they must choose.';
  return 'Halted once; pressing on.';
}

function UndertakingCard({ u }: { u: ActiveUndertakingSummary }) {
  const total = 5;
  const filled = Math.max(0, Math.min(total, Math.round((u.percentComplete / 100) * total)));
  return (
    <div
      data-testid={`arc-undertaking-${u.projectId}`}
      style={{
        borderLeft: '3px solid var(--accent-gold-dim)',
        paddingLeft: '10px',
        paddingTop: '6px',
        paddingBottom: '6px',
        backgroundColor: 'var(--bg-raised)',
        borderRadius: '0 4px 4px 0',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{u.displayName}</span>
        {u.lastBand && (
          <span
            data-testid="arc-undertaking-band"
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {stepOutcomeWord(u.lastBand)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StepDots totalSteps={total} currentStepIndex={filled} variant="magnitude" size={7} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{getUndertakingProgressWord(u.percentComplete)}</span>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)', margin: 0 }}>{haltsSentence(u)}</p>
    </div>
  );
}

const ARC_KIND_GLYPH: Record<AgentArcEntry['kind'], string> = {
  undertaking_completed: '▲',
  undertaking_failed: '▼',
  ambition_completed: '✦',
  moment: '◆',
};

// ─── Component ───────────────────────────────────────────────────

interface JourneyTabProps {
  card: AgentInfoCardData;
  knowledge?: AgentKnowledge;
  /** Opens another agent's sheet — used by a vendetta's culprit link (THR-1298). */
  onOpenEntity?: (id: string) => void;
  /** Live game state — the undertaking cards and the arc strip read it. */
  gameState?: GameState;
  /** The follow toggle's state and handler (THR-1299 slice 4). */
  followState?: FollowDescriptor;
  onToggleFollow?: (agentId: string) => void;
}

export function JourneyTab({ card, knowledge, onOpenEntity, gameState, followState, onToggleFollow }: JourneyTabProps) {
  // Whether to show ambitions — either via interaction depth OR knowledge level
  const showAmbitions =
    (knowledge != null && knowledge.interactionDepth >= AMBITION_PRIMARY_INTERACTIONS)
    || hasKnowledge(card.knowledgeLevel, AMBITION_PRIMARY_KNOWLEDGE);

  // Whether to show secondary ambitions
  const showSecondaryAmbitions =
    (knowledge != null && knowledge.interactionDepth >= AMBITION_SECONDARY_INTERACTIONS)
    || hasKnowledge(card.knowledgeLevel, 'intimate');

  const visibleIntents = (() => {
    if (!card.intents || card.intents.length === 0) return [];
    if (!showAmbitions) return [];
    if (showSecondaryAmbitions) return card.intents;
    return card.intents.filter(i => i.priority === 'primary');
  })();

  const undertakings = gameState ? (summarizeActiveUndertakings(gameState.strategicState, card.id) ?? []) : [];
  const arc = gameState ? getAgentArc(gameState, gameState.graph, card.id) : [];

  return (
    <div className="space-y-4">
      {/* Follow — the arc panel's header affordance (one state, two surfaces). */}
      {followState && onToggleFollow && (
        <section data-testid="arc-follow-row" className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {card.locationName ? (
              <>Last seen in <span style={{ color: 'var(--accent-gold)' }}>{card.locationName}</span>.</>
            ) : null}
          </span>
          <FollowToggle descriptor={followState} onToggle={() => onToggleFollow(card.id)} surface="arc_panel" />
        </section>
      )}

      {/* The work — what they are running now. */}
      <section>
        <SectionHeading as="h2">The Work</SectionHeading>
        {undertakings.length > 0 ? (
          <div className="space-y-2" data-testid="arc-undertakings">
            {undertakings.map(u => <UndertakingCard key={u.projectId} u={u} />)}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
            No long work under way.
          </p>
        )}
      </section>

      {/* Ambitions / Intents */}
      <section>
        <SectionHeading as="h2">Ambitions</SectionHeading>
        {showAmbitions && visibleIntents.length > 0 ? (
          <IntentSection intents={visibleIntents} variant="modal" onOpenEntity={onOpenEntity} />
        ) : (
          <p className="text-stone-400 italic text-sm">
            You don&apos;t yet know what drives {card.name}.
          </p>
        )}
      </section>

      {/* The arc so far — persisted state only, oldest first. */}
      <section>
        <Tooltip id="ui.arc_strip">
          <SectionHeading as="h2">The Arc So Far</SectionHeading>
        </Tooltip>
        {arc.length > 0 ? (
          <ol data-testid="arc-strip" className="space-y-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {arc.map(entry => (
              <li
                key={entry.id}
                data-testid={`arc-entry-${entry.kind}`}
                className="flex items-baseline gap-2 text-sm"
              >
                <span aria-hidden="true" style={{ color: 'var(--accent-gold-dim)', flexShrink: 0 }}>{ARC_KIND_GLYPH[entry.kind]}</span>
                <span style={{ color: 'var(--text-primary)' }}>{entry.line}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{entry.when}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
            Nothing yet worth the telling.
          </p>
        )}
      </section>
    </div>
  );
}
