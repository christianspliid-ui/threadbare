/**
 * TieredEncounterModal — TB-055
 *
 * Chronicle-style encounter modal with tiered visibility:
 * - Strongly Threaded: full prose, 3 choices, auto-interrupt, god-voice
 * - Lightly Threaded: medium prose, 2 choices, auto-resolve timer
 * - Watched: peek prose, essence boost only, peek gate
 *
 * Replaces EncounterVignetteModal.
 */

import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { Modal } from '../shared/Modal';
import type { EncounterProgress, EncounterTemplate, ThreatRating } from '../../types/encounter';
import type { EncounterNotification, EncounterInterventionChoice } from '../../types/encounterVisibility';
import {
  RETINUE_VIGNETTE_TIMEOUT,
  ENCOUNTER_PEEK_COST,
  BOOST_TO_PROBABILITY_RATIO,
  ENCOUNTER_BOOST_MAX,
} from '../../types/encounterVisibility';
import type { CourtPosition } from '../../types/influence';
import type { ReachDomain } from '../../types/traits';
import type { WorldGraph } from '../../engine/graph';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import { DOMAIN_COLORS, DEFAULT_AGENT_COLOR } from '../../data/agent-visual-content';
import { enrichProse, gatherNarrativeContext } from '../../engine/proseEnrichment';
import { useNarration } from '../../services/narration/useNarration';

// ── Thread Tier ──────────────────────────────────────────────────

export type ThreadTier = 'strong' | 'light' | 'watched';

/** Map engine CourtPosition to UI thread tier */
export function courtPositionToThreadTier(pos: CourtPosition | null): ThreadTier {
  switch (pos) {
    case 'the_first': return 'strong';
    case 'retinue': return 'light';
    case 'watched': return 'watched';
    default: return 'watched';
  }
}

/** Map thread tier to prose depth key */
function proseDepthForTier(tier: ThreadTier): 'full' | 'medium' | 'peek' {
  switch (tier) {
    case 'strong': return 'full';
    case 'light': return 'medium';
    case 'watched': return 'peek';
  }
}

// ── Constants ────────────────────────────────────────────────────

const REACH_ICONS: Record<ReachDomain, string> = {
  iron: '⚔', gold: '⚖', shadow: '🗝', veil: '✦', heart: '♥',
  eye: '◉', stone: '⛰', star: '★', flesh: '⚕',
};

const TIER_ACCENT: Record<ThreadTier, string> = {
  strong: 'var(--accent-gold)',
  light: '#aa88cc',
  watched: 'var(--text-muted)',
};

const TIER_LABEL: Record<ThreadTier, string> = {
  strong: 'Strongly Threaded',
  light: 'Lightly Threaded',
  watched: 'Watched',
};

const TIER_SUFFIX: Record<ThreadTier, string> = {
  strong: ' · Paused',
  light: ' · Notification',
  watched: ' · Peek',
};

const TYPE_COLORS: Record<string, string> = {
  supportive: '#4ade80',
  coercive: '#f97316',
  withdrawn: 'var(--text-tertiary)',
};

// ── Props ────────────────────────────────────────────────────────

export interface TieredEncounterModalProps {
  open: boolean;
  onClose: () => void;
  /** The encounter notification that triggered this modal */
  notification: EncounterNotification;
  /** Encounter progress from GameState */
  progress: EncounterProgress;
  /** The encounter template */
  template: EncounterTemplate;
  /** Agent name */
  agentName: string;
  /** Agent ID */
  agentId: string;
  /** World graph for prose enrichment */
  graph: WorldGraph;
  /** Thread tier — determines prose depth, choices, and UI treatment */
  threadTier: ThreadTier;
  /** Current essence available */
  essence: number;
  /** Current game tick */
  tick: number;
  /** Called when the player commits an intervention */
  onIntervene: (choiceId: string, essenceSpent: number) => void;
  /** Called when the player boosts (Watched tier) */
  onBoost: (essenceSpent: number) => void;
  /** Called when the player peeks (Watched tier, costs essence) */
  onPeek: () => void;
}

// ── Sub-Components ───────────────────────────────────────────────

/** Drop-cap for first letter of chronicle prose */
function DropCap({ children }: { children: string }) {
  if (children.length === 0) return null;
  const first = children[0];
  const rest = children.slice(1);
  return (
    <>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3.2em',
        float: 'left',
        lineHeight: 0.8,
        marginRight: '0.06em',
        marginTop: '0.05em',
        color: 'var(--text-primary)',
        fontStyle: 'normal',
        fontWeight: 400,
      }}>
        {first}
      </span>
      {rest}
    </>
  );
}

/** Renders prose paragraphs in chronicle narrator style with optional outcome prose */
function ChronicleNarrator({
  paragraphs,
  outcomeProse,
  isResolved,
}: {
  paragraphs: string[];
  outcomeProse: string | null;
  isResolved: boolean;
}) {
  return (
    <div className="chronicle-narrator" style={{ marginBottom: 8 }}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="chronicle-prose"
          style={{
            fontFamily: 'var(--font-prose, Georgia, serif)',
            fontSize: 14.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.85,
            fontStyle: 'italic',
            margin: 0,
            marginBottom: i < paragraphs.length - 1 || outcomeProse ? 14 : 0,
          }}
        >
          {i === 0 && typeof p === 'string' ? <DropCap>{p}</DropCap> : p}
        </p>
      ))}

      {outcomeProse && (
        <p
          className="chronicle-prose"
          style={{
            fontFamily: 'var(--font-prose, Georgia, serif)',
            fontSize: 14.5,
            lineHeight: 1.85,
            fontStyle: 'italic',
            margin: 0,
            color: isResolved ? 'var(--accent-gold)' : 'var(--text-secondary)',
            paddingLeft: 14,
            borderLeft: `2px solid ${isResolved ? 'var(--accent-gold-dim)' : 'var(--border-gold)'}`,
            opacity: isResolved ? 1 : 0.7,
          }}
        >
          {outcomeProse}
        </p>
      )}
    </div>
  );
}

/** Gold divider line */
function GoldDivider() {
  return (
    <div style={{
      height: 1,
      margin: '16px 0',
      background: 'linear-gradient(90deg, transparent, var(--border-gold-strong), transparent)',
    }} />
  );
}

/** Reach badge with icon and label */
function ReachBadge({ reach }: { reach: ReachDomain }) {
  const color = DOMAIN_COLORS[reach] ?? DEFAULT_AGENT_COLOR;
  const icon = REACH_ICONS[reach] ?? '●';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: color + '20',
        border: `1px solid ${color}40`,
      }}
    >
      <span>{icon}</span>
      <span>{reach}</span>
    </span>
  );
}

/** Threat badge */
function ThreatBadge({ rating }: { rating: ThreatRating }) {
  const color = THREAT_RATING_COLORS[rating] ?? '#a78bfa';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: color + '20',
        border: `1px solid ${color}40`,
      }}
    >
      {rating}
    </span>
  );
}

/** Step navigation bar with clickable dots and arrows */
function StepNav({
  totalSteps,
  stepStatuses,
  stepNames,
  viewIndex,
  currentIndex,
  onNavigate,
}: {
  totalSteps: number;
  stepStatuses: ('resolved' | 'current' | 'future')[];
  stepNames: string[];
  viewIndex: number;
  currentIndex: number;
  onNavigate: (idx: number) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg mb-3.5"
      style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-raised)',
        border: '1px solid var(--border-gold)',
      }}
    >
      <button
        onClick={() => viewIndex > 0 && onNavigate(viewIndex - 1)}
        disabled={viewIndex === 0}
        className="flex items-center justify-center"
        style={{
          width: 24, height: 24, borderRadius: 4, border: 'none',
          cursor: viewIndex > 0 ? 'pointer' : 'default',
          backgroundColor: 'transparent',
          color: viewIndex > 0 ? 'var(--text-secondary)' : 'var(--border-subtle)',
          fontSize: 14, outline: 'none',
        }}
      >
        ‹
      </button>

      <div className="flex-1 flex items-center justify-center gap-1.5">
        {stepStatuses.map((status, i) => {
          const isFuture = status === 'future';
          const isResolved = status === 'resolved';
          const isViewed = i === viewIndex;
          const dotSize = isViewed ? 12 : 8;
          return (
            <button
              key={i}
              onClick={() => !isFuture && onNavigate(i)}
              disabled={isFuture}
              title={isFuture ? 'Not yet reached' : stepNames[i]}
              style={{
                width: dotSize, height: dotSize, borderRadius: '50%',
                border: 'none', padding: 0,
                cursor: isFuture ? 'not-allowed' : 'pointer',
                backgroundColor: isFuture
                  ? 'var(--border-subtle)'
                  : isResolved
                    ? (isViewed ? '#4ade80' : '#4ade8088')
                    : 'var(--accent-gold)',
                opacity: isFuture ? 0.35 : 1,
                boxShadow: isViewed
                  ? `0 0 8px ${status === 'current' ? 'var(--accent-gold)' : '#4ade80'}`
                  : 'none',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}
      </div>

      <button
        onClick={() => viewIndex < currentIndex && onNavigate(viewIndex + 1)}
        disabled={viewIndex >= currentIndex}
        className="flex items-center justify-center"
        style={{
          width: 24, height: 24, borderRadius: 4, border: 'none',
          cursor: viewIndex < currentIndex ? 'pointer' : 'default',
          backgroundColor: 'transparent',
          color: viewIndex < currentIndex ? 'var(--text-secondary)' : 'var(--border-subtle)',
          fontSize: 14, outline: 'none',
        }}
      >
        ›
      </button>

      <div style={{ marginLeft: 8, textAlign: 'right', minWidth: 80 }}>
        <div
          style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 140,
          }}
        >
          {stepNames[viewIndex]}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          {viewIndex < currentIndex ? 'Resolved' : viewIndex === currentIndex ? `Step ${viewIndex + 1} of ${totalSteps}` : 'Locked'}
        </div>
      </div>
    </div>
  );
}

/** SVG intervention type icons */
const INTERVENTION_ICONS: Record<string, (c: string) => React.ReactNode> = {
  supportive: (c) => (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M12 4 L5 12 L8 12 L8 19 L16 19 L16 12 L19 12 Z" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="14" y2="14" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="16" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  coercive: (c) => (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M13 3 L8 12 L11 12 L10 21 L17 10 L14 10 Z" fill={c} opacity="0.25" stroke={c} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  withdrawn: (c) => (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <circle cx="12" cy="12" r="7" fill="none" stroke={c} strokeWidth="1.2" opacity="0.5" />
      <line x1="7" y1="7" x2="17" y2="17" stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  ),
};

/** Action icon with type-specific SVG */
function ActionIcon({ type, selected }: { type: string; selected: boolean }) {
  const typeColor = TYPE_COLORS[type] ?? 'var(--text-secondary)';
  const render = INTERVENTION_ICONS[type];
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-md"
      style={{
        width: 36, height: 36, padding: 5,
        backgroundColor: selected ? typeColor + '20' : 'var(--bg-surface)',
        border: `1.5px solid ${selected ? typeColor + '80' : 'var(--border-subtle)'}`,
        boxShadow: selected ? `0 0 8px ${typeColor}30` : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {render ? render(typeColor) : null}
    </div>
  );
}

/** Intervention choice button */
function ChoiceButton({
  choice,
  selected,
  onSelect,
  essence,
}: {
  choice: EncounterInterventionChoice;
  selected: boolean;
  onSelect: (id: string) => void;
  essence: number;
}) {
  const [hovered, setHovered] = useState(false);
  const cantAfford = choice.essenceCost > essence;
  const typeColor = TYPE_COLORS[choice.interventionType] ?? 'var(--text-secondary)';

  return (
    <button
      onClick={() => !cantAfford && onSelect(choice.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={cantAfford}
      className="flex w-full text-left gap-3 items-start rounded-lg"
      style={{
        padding: '10px 12px',
        cursor: cantAfford ? 'not-allowed' : 'pointer',
        backgroundColor: selected ? 'var(--bg-hover)' : hovered && !cantAfford ? 'var(--bg-raised)' : 'var(--bg-deep)',
        border: `1px solid ${selected ? 'var(--border-gold-strong)' : hovered && !cantAfford ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
        opacity: cantAfford ? 0.45 : 1,
        transition: 'all 0.2s ease',
        outline: 'none',
        boxShadow: selected ? '0 0 12px var(--accent-gold-glow)' : 'none',
      }}
    >
      <ActionIcon type={choice.interventionType} selected={selected} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {choice.text}
          </span>
          {choice.essenceCost > 0 && (
            <span
              className="flex items-center gap-1 flex-shrink-0 ml-2 text-xs font-bold"
              style={{ color: cantAfford ? '#f87171' : 'var(--accent-gold)' }}
            >
              <span style={{ fontSize: 13 }}>◆</span> {choice.essenceCost}
            </span>
          )}
        </div>
        {choice.probabilityBoost > 0 && (
          <div className="text-xs font-semibold" style={{ color: typeColor }}>
            +{Math.round(choice.probabilityBoost * 100)}% success · {choice.interventionType}
          </div>
        )}
        {selected && choice.godVoice && (
          <div
            className="mt-2 rounded-md text-xs italic leading-relaxed"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--accent-gold-glow)',
              borderLeft: '2px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              fontFamily: 'var(--font-display)',
            }}
          >
            &ldquo;{choice.godVoice}&rdquo;
          </div>
        )}
      </div>
    </button>
  );
}

/** Essence boost slider for Watched tier */
function BoostSlider({
  essence,
  spent,
  onSpend,
}: {
  essence: number;
  spent: number;
  onSpend: (n: number) => void;
}) {
  const max = Math.min(ENCOUNTER_BOOST_MAX, essence);
  return (
    <div
      className="rounded-lg"
      style={{
        padding: '14px 16px',
        backgroundColor: 'var(--bg-deep)',
        border: '1px solid var(--border-gold)',
      }}
    >
      <div
        className="text-xs font-semibold mb-2.5"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        Commit Essence — Boost Encounter Odds
      </div>
      <div className="flex items-center gap-2 mb-2">
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => n <= max && onSpend(n)}
            className="flex items-center justify-center text-sm font-bold rounded-md"
            style={{
              width: 32, height: 32,
              cursor: n <= max ? 'pointer' : 'not-allowed',
              color: n <= spent ? 'var(--bg-deep)' : n <= max ? 'var(--accent-gold)' : 'var(--text-muted)',
              backgroundColor: n <= spent ? 'var(--accent-gold)' : 'transparent',
              border: `1.5px solid ${n <= max ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              opacity: n > max ? 0.35 : 1,
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {spent > 0
          ? <span>+{Math.round(spent * BOOST_TO_PROBABILITY_RATIO * 100)}% success · <span style={{ color: 'var(--accent-gold)' }}>◆ {spent} essence</span></span>
          : `Each point of essence adds +${Math.round(BOOST_TO_PROBABILITY_RATIO * 100)}% success.`}
      </div>
    </div>
  );
}

/** Auto-resolve countdown bar for Lightly Threaded encounters */
function AutoResolveBar({ ticksRemaining, total }: { ticksRemaining: number; total: number }) {
  const pct = (ticksRemaining / total) * 100;
  const urgent = ticksRemaining <= 2;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold" style={{ color: urgent ? '#fbbf24' : 'var(--text-tertiary)' }}>
          {urgent ? '⚠ ' : ''}Auto-resolves in {ticksRemaining} tick{ticksRemaining !== 1 ? 's' : ''}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {ticksRemaining}/{total}
        </span>
      </div>
      <div
        className="rounded-sm overflow-hidden"
        style={{ height: 3, backgroundColor: 'var(--border-subtle)' }}
      >
        <div
          className="rounded-sm"
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: urgent ? '#fbbf24' : 'var(--accent-gold)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

/** Peek gate for Watched tier — pay essence to view encounter */
function PeekGate({ essence, onPeek }: { essence: number; onPeek: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cantAfford = essence < ENCOUNTER_PEEK_COST;
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '48px 24px' }}>
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 56, height: 56,
          border: '2px solid var(--border-gold)',
          backgroundColor: 'var(--bg-deep)',
          fontSize: 24,
          color: 'var(--text-muted)',
        }}
      >
        ◌
      </div>
      <p
        className="chronicle-prose mb-4"
        style={{
          fontFamily: 'var(--font-prose, Georgia, serif)',
          fontSize: 14.5,
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          maxWidth: 300,
        }}
      >
        A thread stirs at the edge of your perception — something is happening to a mortal you have touched, though only barely.
      </p>
      <button
        onClick={() => !cantAfford && onPeek()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={cantAfford}
        className="rounded-md font-semibold"
        style={{
          padding: '8px 20px',
          cursor: cantAfford ? 'not-allowed' : 'pointer',
          backgroundColor: hovered && !cantAfford ? 'var(--bg-hover)' : 'var(--bg-raised)',
          border: `1px solid ${hovered && !cantAfford ? 'var(--border-gold-strong)' : 'var(--border-gold)'}`,
          color: cantAfford ? 'var(--text-muted)' : 'var(--accent-gold)',
          fontSize: 13,
          fontFamily: 'var(--font-display)',
          opacity: cantAfford ? 0.5 : 1,
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        ◆ {ENCOUNTER_PEEK_COST} — Peer Through the Thread
      </button>
    </div>
  );
}

/** TTS narrate button — reads .chronicle-prose elements */
function NarrateButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { isSpeaking, narrateChronicle, stop, enabled } = useNarration();

  const handleNarrate = useCallback(() => {
    if (isSpeaking) {
      stop();
      return;
    }
    narrateChronicle(containerRef.current);
  }, [isSpeaking, stop, narrateChronicle, containerRef]);

  if (!enabled) return null;

  return (
    <button
      onClick={handleNarrate}
      title={isSpeaking ? 'Stop narration' : 'Narrate this encounter'}
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{
        padding: '4px 10px',
        backgroundColor: isSpeaking ? 'var(--accent-gold-glow)' : 'transparent',
        border: `1px solid ${isSpeaking ? 'var(--accent-gold-dim)' : 'var(--border-subtle)'}`,
        color: isSpeaking ? 'var(--accent-gold)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        fontSize: 11,
      }}
    >
      {isSpeaking ? '■' : '▶'}
      <span>{isSpeaking ? 'Stop' : 'Narrate'}</span>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────

export const TieredEncounterModal = memo(function TieredEncounterModal({
  open,
  onClose,
  notification,
  progress,
  template,
  agentName,
  agentId,
  graph,
  threadTier,
  essence,
  tick,
  onIntervene,
  onBoost,
  onPeek,
}: TieredEncounterModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [boostSpent, setBoostSpent] = useState(0);
  const [peeked, setPeeked] = useState(false);
  const proseContainerRef = useRef<HTMLDivElement>(null);

  // Clamp to valid step range
  const currentIndex = Math.min(progress.currentEncounterIndex, template.steps.length - 1);
  const [viewIndex, setViewIndex] = useState(currentIndex);

  // Step statuses
  const stepStatuses = useMemo((): ('resolved' | 'current' | 'future')[] => {
    return template.steps.map((_, i) => {
      if (i < currentIndex) return 'resolved';
      if (i === currentIndex) return 'current';
      return 'future';
    });
  }, [template.steps, currentIndex]);

  const stepNames = useMemo(() => template.steps.map(s => s.name), [template.steps]);
  const isViewingCurrent = viewIndex === currentIndex;
  const isViewingPast = viewIndex < currentIndex;

  // Gather narrative context for prose enrichment
  const narrativeCtx = useMemo(
    () => gatherNarrativeContext(graph, agentId),
    [graph, agentId],
  );

  // Build prose paragraphs for the viewed step
  const paragraphs = useMemo(() => {
    const step = template.steps[viewIndex];
    if (!step) return [];
    const depth = proseDepthForTier(threadTier);

    // The notification may carry tiered prose, but we use the step narrative
    // enriched through the prose pipeline as the primary source
    const raw = step.narrative;
    const enriched = enrichProse(raw, narrativeCtx);

    // Split into paragraphs. For full depth, provide 3 variants if available;
    // for medium, 1-2 paragraphs; for peek, 1 short sentence.
    // Since encounter steps currently have a single narrative string,
    // we split on double-newlines or return as a single paragraph.
    const parts = enriched.split(/\n\n+/).filter(Boolean);

    switch (depth) {
      case 'full': return parts.length > 0 ? parts : [enriched];
      case 'medium': return parts.length > 1 ? parts.slice(0, 2) : [enriched];
      case 'peek': return [parts[0]?.split('.').slice(0, 2).join('.') + '.' || enriched];
    }
  }, [template.steps, viewIndex, threadTier, narrativeCtx]);

  // Outcome prose for resolved steps
  const outcomeProse = useMemo(() => {
    if (!isViewingPast) return null;
    const step = template.steps[viewIndex];
    if (!step) return null;
    // Check if this step was successful based on history
    const historyEntry = progress.history.find(h => h.encounterId === progress.encounterId);
    const succeeded = historyEntry?.success ?? true;
    const outcome = succeeded ? step.onSuccess : step.onFailure;
    if (!outcome?.narrative) return null;
    return enrichProse(outcome.narrative, narrativeCtx);
  }, [isViewingPast, template.steps, viewIndex, progress, narrativeCtx]);

  // Choices available for this tier
  const choices = notification.choices;

  // Auto-resolve ticks remaining
  const autoResolveTicks = useMemo(() => {
    if (threadTier !== 'light' || !notification.autoResolveTick) return null;
    return Math.max(0, notification.autoResolveTick - tick);
  }, [threadTier, notification.autoResolveTick, tick]);

  const showAutoResolve = threadTier === 'light' && isViewingCurrent && autoResolveTicks !== null;
  const showPeekGate = threadTier === 'watched' && !peeked;

  const positionAccent = TIER_ACCENT[threadTier];
  const positionLabel = TIER_LABEL[threadTier] + TIER_SUFFIX[threadTier];

  // Handlers
  const handlePeek = useCallback(() => {
    setPeeked(true);
    onPeek();
  }, [onPeek]);

  const handleIntervene = useCallback(() => {
    if (threadTier === 'watched') {
      if (boostSpent > 0) onBoost(boostSpent);
    } else if (selectedChoice) {
      const choice = choices.find(c => c.id === selectedChoice);
      onIntervene(selectedChoice, choice?.essenceCost ?? 0);
    }
    onClose();
  }, [threadTier, selectedChoice, boostSpent, choices, onIntervene, onBoost, onClose]);

  const showCommitButton = isViewingCurrent && (
    selectedChoice !== null || (threadTier === 'watched' && boostSpent > 0)
  );

  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-gold)',
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className="rounded-full"
            style={{
              width: 6, height: 6,
              backgroundColor: positionAccent,
              boxShadow: `0 0 6px ${positionAccent}`,
            }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: positionAccent, letterSpacing: '0.15em', fontSize: 10 }}
          >
            {positionLabel}
          </span>
          {threadTier === 'strong' && (
            <span
              className="text-xs font-semibold rounded ml-auto"
              style={{
                padding: '1px 6px',
                backgroundColor: '#f8717120',
                color: '#f87171',
              }}
            >
              ⏸
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="text-xs" style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>
              {agentName} faces
            </div>
            <h2
              className="m-0 font-bold truncate"
              style={{
                fontSize: 17,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              {template.name}
            </h2>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 items-center">
            {!showPeekGate && <NarrateButton containerRef={proseContainerRef} />}
            <ReachBadge reach={template.steps[viewIndex]?.reach ?? template.reachPrimary} />
            <ThreatBadge rating={template.threatRating} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        ref={proseContainerRef}
        style={{
          padding: '16px 20px',
          maxHeight: 440,
          overflowY: 'auto',
        }}
      >
        {showAutoResolve && (
          <AutoResolveBar
            ticksRemaining={autoResolveTicks!}
            total={RETINUE_VIGNETTE_TIMEOUT}
          />
        )}

        {showPeekGate ? (
          <PeekGate essence={essence} onPeek={handlePeek} />
        ) : (
          <>
            <StepNav
              totalSteps={template.steps.length}
              stepStatuses={stepStatuses}
              stepNames={stepNames}
              viewIndex={viewIndex}
              currentIndex={currentIndex}
              onNavigate={setViewIndex}
            />

            {isViewingPast && (
              <div className="flex justify-end mb-2.5">
                <button
                  onClick={() => setViewIndex(currentIndex)}
                  className="text-xs font-semibold underline underline-offset-2"
                  style={{
                    color: 'var(--accent-gold)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  Jump to current step →
                </button>
              </div>
            )}

            <ChronicleNarrator
              paragraphs={paragraphs}
              outcomeProse={outcomeProse}
              isResolved={isViewingPast}
            />

            {/* Intervention choices for current step */}
            {isViewingCurrent && choices.length > 0 && (
              <>
                <GoldDivider />
                <div className="flex flex-col gap-2">
                  {choices.map(c => (
                    <ChoiceButton
                      key={c.id}
                      choice={c}
                      selected={selectedChoice === c.id}
                      onSelect={setSelectedChoice}
                      essence={essence}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Boost slider for Watched tier after peeking */}
            {isViewingCurrent && threadTier === 'watched' && peeked && (
              <>
                <GoldDivider />
                <BoostSlider essence={essence} spent={boostSpent} onSpend={setBoostSpent} />
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-gold)',
          backgroundColor: 'var(--bg-raised)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 13, color: 'var(--accent-gold)' }}>◆</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(essence)}
          </span>
        </div>
        <div className="flex gap-2">
          {showCommitButton && (
            <button
              onClick={handleIntervene}
              className="rounded-md font-bold"
              style={{
                padding: '7px 18px',
                cursor: 'pointer',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-deep)',
                fontSize: 13,
                fontFamily: 'var(--font-display)',
                border: 'none',
                outline: 'none',
                boxShadow: '0 0 12px var(--accent-gold-dim)',
              }}
            >
              {threadTier === 'watched' ? 'Commit' : 'Intervene'}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md font-medium"
            style={{
              padding: '7px 18px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-gold)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
            }}
          >
            {threadTier === 'strong' ? 'Resume' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
});
