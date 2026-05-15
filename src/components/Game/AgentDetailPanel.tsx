import React, { useMemo } from 'react';
import type { AgentDetail, TraitSummary, LeverageSummary } from '../../engine/agentDetail';
import { INITIATIVE_TEMPLATE_MAP } from '../../data/initiative-templates';
import type { ReachDomain } from '../../types/traits';
import type { CooperationStrategy } from '../../types/disposition';
import type { DigestEntry } from '../../types/attention';
import { ReachIcon } from '../icons';
import { TIER_COLORS, ARCHETYPE_DOT_COLOR, FACTION_TAG_COLOR, FACTION_TAG_BACKGROUND, FACTION_TAG_BORDER, SENTIMENT_GREEN, SENTIMENT_RED } from '../../data/uiColorPalette';
import { AttachmentRow } from './AttachmentRow';
import { IntentSection } from './IntentSection';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';
import { SectionHeading } from '../shared/SectionHeading';
import { Tooltip } from '../shared/Tooltip';
import { quintessenceToWord } from '../../types/quintessence';
import { QUINTESSENCE_TOOLTIPS } from '../../data/quintessence-content';
import { QUINTESSENCE_LEXICON } from '../../data/quintessence-content';
import { RecentActivityLog } from './RecentActivityLog';
import { queryDigest } from '../../engine/digestBuffer';

/** Max attachment rows shown per section before overflow */
const MAX_ATTACHMENT_ROWS = 5;

/** Max trait rows shown before overflow */
const MAX_TRAIT_ROWS = 8;

/** Number of dots in the v7 capability meter (per reach). */
const CAPABILITY_DOTS = 5;

/** Domain capability is scored 0-10; map to 0-5 dots by halving and rounding. */
const CAPABILITY_SCORE_MAX = 10;

/** Trait category display colors (muted, thematic) */
const TRAIT_CATEGORY_COLORS: Record<string, string> = {
  innate: '#a8a29e',   // stone-400
  cultural: '#78716c', // stone-500
  bestowed: '#d97706', // amber-600
  destiny: '#c084fc',  // purple-400
  mastery: '#34d399',  // emerald-400
  reputation: '#60a5fa', // blue-400
  scar: '#f87171',     // red-400
};

/** Trait category display labels */
const TRAIT_CATEGORY_LABELS: Record<string, string> = {
  innate: 'Innate',
  cultural: 'Cultural',
  bestowed: 'Bestowed',
  destiny: 'Destiny',
  mastery: 'Mastery',
  reputation: 'Reputation',
  scar: 'Scar',
};

/** Activity summary for unified action display */
export interface ActivitySummary {
  actionName: string;
  stepLabel: string; // e.g. "Step 2/3" or "3/5 ticks"
  progressFraction: number; // 0-1 for progress bar
  isContested: boolean;
  opponentName?: string;
}

interface AgentDetailPanelProps {
  detail: AgentDetail;
  activity?: ActivitySummary | null;
  onBack: () => void;
  onViewPsyche: () => void;
  onIntervene: () => void;
  onLocationClick: (locationId: string) => void;
  onAttachmentClick?: (attachmentId: string) => void;
  /** Optional digest buffer for the recent activity log. */
  digestBuffer?: DigestEntry[];
  /** Current simulation tick, used to window recent digest entries. */
  currentTick?: number;
  /** The tick at which this agent was last viewed; used to highlight new digest entries. */
  lastViewedTick?: number;
}

// Domain display names — 8 reaches (flesh removed in TB-075)
const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
};

// Strategy display names
const STRATEGY_DISPLAY: Record<CooperationStrategy, string> = {
  'tit-for-tat': 'Tit for Tat',
  'grudger': 'Grudger',
  'pavlov': 'Pavlov',
  'always-cooperate': 'Always Cooperate',
  'always-defect': 'Always Defect',
};

// Display order for capability rows. Reach-to-sphere mapping resolves via
// the `data-reach` cascade in src/index.css (--reach-sphere-bright).
const DOMAINS_ORDER: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
];

export const AgentDetailPanel = React.memo(function AgentDetailPanel({
  detail,
  activity,
  onBack,
  onViewPsyche,
  onIntervene,
  onLocationClick,
  onAttachmentClick,
  digestBuffer,
  currentTick,
  lastViewedTick = 0,
}: AgentDetailPanelProps) {
  const tierColor = TIER_COLORS[detail.tier] || 'var(--text-muted)';
  const archetypeReaches = detail.archetype?.reachAffinities || [];

  const recentEntries = useMemo(() => {
    if (!digestBuffer) return [];
    return queryDigest(digestBuffer, {
      agentId: detail.id,
      fromTick: Math.max(0, (currentTick ?? 0) - 48),
      toTick: currentTick ?? 999,
    });
  }, [digestBuffer, currentTick, detail.id]);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Portrait thumbnail */}
        {detail.portraitUrl && (
          <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0">
            <img
              src={detail.portraitUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Agent name and tier */}
        <div className="flex-1">
          <h2
            className="text-sm font-semibold tracking-wide"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {detail.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tierColor }}
            />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {detail.tierName}
            </span>
          </div>
        </div>

        <IconButton icon={<span>✕</span>} size="sm" aria-label="close" onClick={onBack} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Archetype Banner */}
        {detail.archetype && (
          <div
            className="rounded px-3 py-2.5"
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Tooltip label={detail.archetype.name} desc={detail.archetype.storyShape}>
              <h3
                className="text-sm font-semibold tracking-wide cursor-help"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                }}
              >
                {detail.archetype.name}
              </h3>
            </Tooltip>
            <p
              className="text-xs italic mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {detail.archetype.storyShape}
            </p>

            {/* Reach affinity dots */}
            {detail.archetype.reachAffinities.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {detail.archetype.reachAffinities.map(reach => (
                  <div
                    key={reach}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: ARCHETYPE_DOT_COLOR,
                    }}
                    title={DOMAIN_NAMES[reach]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Faction tag */}
        {detail.factionName && (
          <div className="space-y-2">
            <div className="inline-block">
              <span
                className="inline-block px-2.5 py-1 text-xs font-medium rounded"
                style={{
                  color: detail.factionThemeColor || FACTION_TAG_COLOR,
                  backgroundColor: detail.factionThemeColor
                    ? `${detail.factionThemeColor}26`
                    : FACTION_TAG_BACKGROUND,
                  border: `1px solid ${detail.factionThemeColor
                    ? `${detail.factionThemeColor}66`
                    : FACTION_TAG_BORDER}`,
                }}
              >
                {detail.factionIconGlyph ? `${detail.factionIconGlyph} ` : ''}{detail.factionName}
              </span>
            </div>

            {(detail.factionRank || detail.factionReputation != null) && (
              <div
                className="rounded px-3 py-2"
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  border: `1px solid ${detail.factionThemeColor ? `${detail.factionThemeColor}40` : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Faction Standing
                  </span>
                  {detail.factionRank && (
                    <span
                      className="text-xs font-medium"
                      style={{ color: detail.factionThemeColor || 'var(--accent-gold)' }}
                    >
                      {detail.factionRank}
                    </span>
                  )}
                </div>
                {detail.factionReputation != null && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-raised)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.round(detail.factionReputation * 100)}%`,
                          backgroundColor: detail.factionThemeColor || 'var(--accent-gold)',
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {Math.round(detail.factionReputation * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quintessence IPK — prose-only display, no numeric value (NFP #2: inspectability) */}
        {detail.quintessence != null && (() => {
          const qWord = quintessenceToWord(detail.quintessence);
          const qIdx = QUINTESSENCE_LEXICON.indexOf(qWord);
          const qTooltip = qIdx >= 0 ? QUINTESSENCE_TOOLTIPS[qIdx] : undefined;
          return (
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Their presence is </span>
              <Tooltip label={qWord} desc={qTooltip ?? ''}>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    cursor: 'help',
                  }}
                  role="term"
                  tabIndex={0}
                >
                  {qWord}
                </span>
              </Tooltip>
            </div>
          );
        })()}

        {/* Mentorship — active and historical (THR-75) */}
        {detail.mentorship && detail.mentorship.length > 0 && (
          <div className="space-y-2">
            {detail.mentorship.map((m) => {
              const isActive = m.phase === 'offered' || m.phase === 'training';
              const pct = Math.round(m.progress * 100);
              const roleLine = m.role === 'mentor'
                ? `Mentoring ${m.otherName} in ${m.domain}`
                : `Apprenticed to ${m.otherName} in ${m.domain}`;
              const phaseLabel = m.phase.charAt(0).toUpperCase() + m.phase.slice(1);

              if (!isActive) {
                // Quiet "Past bond" treatment for graduated/estranged history
                return (
                  <div
                    key={`mentorship-${m.role}-${m.otherId}`}
                    className="rounded px-3 py-1.5"
                    style={{
                      backgroundColor: 'var(--bg-raised)',
                      border: '1px solid var(--border-subtle)',
                      opacity: 0.7,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs uppercase tracking-wide"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Past bond · {phaseLabel}
                      </span>
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {roleLine}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`mentorship-${m.role}-${m.otherId}`}
                  className="rounded px-3 py-2"
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  data-testid={`mentorship-block-${m.role}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-xs uppercase tracking-wide"
                      style={{ color: 'var(--sphere-heart-bright, var(--sphere-spirit-bright))' }}
                    >
                      Mentorship · {phaseLabel}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pct}%</span>
                  </div>
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {roleLine}
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-raised)', outline: '1px solid var(--border-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: 'var(--sphere-heart-bright, var(--sphere-spirit-bright))',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  {m.lessonsCompleted > 0 && (
                    <div
                      className="mt-1.5 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {m.lessonsCompleted}/3 lessons reached
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Active Initiative */}
        {detail.activeInitiative && (() => {
          const ini = detail.activeInitiative!;
          const tmpl = INITIATIVE_TEMPLATE_MAP.get(ini.templateId);
          const tick = currentTick ?? 0;
          const elapsed = Math.max(0, tick - ini.startedTick);
          const total = Math.max(1, ini.targetCompletionTick - ini.startedTick);
          const pct = Math.min(100, Math.round((elapsed / total) * 100));
          return (
            <div
              className="rounded px-3 py-2"
              style={{
                backgroundColor: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: 'var(--sphere-spirit-bright)' }}
                >
                  Initiative
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pct}%</span>
              </div>
              <div
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {tmpl?.name ?? ini.templateId}
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-raised)', outline: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${pct}%`, backgroundColor: 'var(--sphere-spirit-bright)', opacity: 0.85 }}
                />
              </div>
              {ini.checkpoints.length > 0 && (
                <div
                  className="mt-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {ini.checkpoints.filter(c => c.passed).length}/{ini.checkpoints.length} checkpoints passed
                </div>
              )}
            </div>
          );
        })()}

        {/* Capability profile — 5-dot meter rows, sphere-coloured per reach */}
        <div>
          <SectionHeading>
            Capability
          </SectionHeading>
          <div className="space-y-1">
            {DOMAINS_ORDER.map(domain => {
              const score = detail.domainCapabilities[domain] || 0;
              const dots = Math.round((Math.min(score, CAPABILITY_SCORE_MAX) / CAPABILITY_SCORE_MAX) * CAPABILITY_DOTS);
              const isAffinity = archetypeReaches.includes(domain);

              // Build trait contribution breakdown for tooltip
              const contributors = (detail.traits ?? [])
                .filter(t => (t.domainContributions[domain] ?? 0) !== 0)
                .map(t => {
                  const v = t.domainContributions[domain]! * t.level;
                  return `${v > 0 ? '+' : ''}${v.toFixed(2)} ${t.name}`;
                });
              const domainTooltip = contributors.length > 0
                ? `${DOMAIN_NAMES[domain]} ${score.toFixed(1)}\n${contributors.join('\n')}`
                : `${DOMAIN_NAMES[domain]} ${score.toFixed(1)}`;

              return (
                <Tooltip key={domain} content={domainTooltip}>
                  <div
                    data-reach={domain}
                    className="flex items-center gap-2 cursor-default"
                    style={{ padding: '4px 0' }}
                  >
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{
                        width: 70,
                        color: isAffinity
                          ? 'var(--reach-sphere-bright)'
                          : 'var(--text-tertiary)',
                      }}
                    >
                      <ReachIcon reach={domain} size={14} />
                      {DOMAIN_NAMES[domain]}
                    </span>
                    <div className="flex" style={{ gap: 3 }}>
                      {Array.from({ length: CAPABILITY_DOTS }, (_, i) => (
                        <span
                          key={i}
                          aria-hidden="true"
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 99,
                            background: i < dots
                              ? 'var(--reach-sphere-bright)'
                              : 'var(--bg-raised)',
                            outline: i < dots ? 'none' : '1px solid var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs tabular-nums ml-auto"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {score.toFixed(1)}
                    </span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Intent Section — always visible in prototype */}
        <IntentSection intents={detail.intents ?? []} variant="panel" />

        {/* Values Section */}
        <div>
          <SectionHeading>
            Character
          </SectionHeading>
          <div className="space-y-1.5">
            {detail.topValues.map(val => {
              const absValue = Math.abs(val.value);
              const percentage = absValue * 100;

              return (
                <div key={val.pair} className="flex items-center gap-2">
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {val.label}
                  </span>
                  <div
                    className="w-16 rounded h-1 overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--bg-raised)' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        background: 'var(--accent-gold)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonds Section */}
        <div>
          <SectionHeading>
            Bonds
          </SectionHeading>

          {detail.topBonds.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              No known bonds
            </p>
          ) : (
            <div className="space-y-1.5">
              {detail.topBonds.map(bond => {
                const sentimentColor =
                  bond.sentiment >= 0
                    ? SENTIMENT_GREEN
                    : SENTIMENT_RED;
                const sentimentWidth = Math.abs(bond.sentiment) * 100;

                return (
                  <div key={bond.targetId} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {bond.targetName}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {bond.basis}
                      </span>
                    </div>
                    <div
                      className="w-full rounded h-1 overflow-hidden"
                      style={{ background: 'var(--bg-raised)' }}
                    >
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${sentimentWidth}%`,
                          backgroundColor: sentimentColor,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Traits Section */}
        {detail.traits && detail.traits.length > 0 && (
          <div>
            <SectionHeading>
              Traits
            </SectionHeading>
            <div className="space-y-1">
              {detail.traits.slice(0, MAX_TRAIT_ROWS).map(trait => (
                <TraitRow key={trait.id} trait={trait} />
              ))}
              {detail.traits.length > MAX_TRAIT_ROWS && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  and {detail.traits.length - MAX_TRAIT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Possessions Section */}
        {detail.possessions && detail.possessions.length > 0 && (
          <div>
            <SectionHeading>
              Possessions
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.possessions.slice(0, MAX_ATTACHMENT_ROWS).map(att => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                />
              ))}
              {detail.possessions.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  and {detail.possessions.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}
        {detail.possessions != null && detail.possessions.length === 0 && (
          <div>
            <SectionHeading>
              Possessions
            </SectionHeading>
            <p
              className="text-xs italic animate-breathe"
              style={{ color: 'var(--text-muted)' }}
            >
              They carry nothing of note.
            </p>
          </div>
        )}

        {/* Conditions Section */}
        {detail.conditions && detail.conditions.length > 0 && (
          <div>
            <SectionHeading>
              Conditions
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.conditions.slice(0, MAX_ATTACHMENT_ROWS).map(att => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                  sourceEncounterId={att.sourceEncounterId}
                />
              ))}
              {detail.conditions.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  and {detail.conditions.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Powers & Agreements Section.
            The first row in this list demonstrates the active-vow treatment
            (panel-gold border + sphere-spirit wash) per v7 §Hero panel. */}
        {detail.powersAndAgreements && detail.powersAndAgreements.length > 0 && (
          <div>
            <SectionHeading>
              Powers & Agreements
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.powersAndAgreements.slice(0, MAX_ATTACHMENT_ROWS).map((att, idx) => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                  activeVow={idx === 0}
                />
              ))}
              {detail.powersAndAgreements.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  and {detail.powersAndAgreements.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Strategy Section */}
        <div>
          <SectionHeading>
            Disposition
          </SectionHeading>

          {detail.cooperationStrategy == null ? (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              No known strategy
            </p>
          ) : (
            <div className="space-y-2.5">
              {/* Strategy name */}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Strategy:
                </span>
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  {STRATEGY_DISPLAY[detail.cooperationStrategy]}
                </span>
              </div>

              {/* Reputation bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Reputation</span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {detail.reputationScore.toFixed(2)}
                  </span>
                </div>
                <div
                  className="w-full rounded h-1.5 overflow-hidden relative"
                  style={{ background: 'var(--bg-raised)' }}
                >
                  {/* Center marker at 0.5 */}
                  <div
                    className="absolute top-0 bottom-0"
                    style={{
                      left: '50%',
                      width: 1,
                      background: 'var(--border-subtle)',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-200 rounded"
                    style={{
                      width: `${detail.reputationScore * 100}%`,
                      backgroundColor: detail.reputationScore >= 0.5 ? SENTIMENT_GREEN : SENTIMENT_RED,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>

              {/* Recent interactions */}
              {detail.recentInteractions.length > 0 && (
                <div className="space-y-1">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Recent
                  </span>
                  {detail.recentInteractions.map((ir, idx) => (
                    <div
                      key={`${ir.tick}-${idx}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className="w-8 text-right flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        t{ir.tick}
                      </span>
                      <span title={`Actor: ${ir.actorMove}`}>
                        {ir.actorMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>vs</span>
                      <span title={`Target: ${ir.targetMove}`}>
                        {ir.targetMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span
                        className="flex-1 truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {ir.stakes === 'high' ? '✦' : ''} {ir.context}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Link */}
        <div className="text-xs">
          <span style={{ color: 'var(--text-tertiary)' }}>Location: </span>
          <button
            onClick={() => onLocationClick(detail.locationId)}
            className="underline transition-colors"
            style={{ color: 'var(--accent-gold)' }}
          >
            {detail.locationName}
          </button>
        </div>
      </div>

      {/* Activity Section */}
      {activity && (
        <div
          className="px-4 py-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Activity
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium truncate flex-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {activity.actionName}
            </span>
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: 'var(--text-muted)' }}
            >
              {activity.stepLabel}
            </span>
          </div>
          <div
            className="mt-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-raised)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(activity.progressFraction * 100)}%`,
                backgroundColor: activity.isContested ? 'var(--negative)' : 'var(--accent-gold)',
              }}
            />
          </div>
          {activity.isContested && activity.opponentName && (
            <div
              className="text-xs mt-0.5"
              style={{ color: 'var(--negative)' }}
            >
              Contested by {activity.opponentName}
            </div>
          )}
        </div>
      )}

      {/* Leverage Section (THR-30): secrets & favors */}
      {detail.leverage && (
        <LeverageSection leverage={detail.leverage} />
      )}

      {/* Recent Activity Log */}
      {recentEntries.length > 0 && (
        <div
          className="px-4 py-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <RecentActivityLog entries={recentEntries} lastViewedTick={lastViewedTick} />
        </div>
      )}

      {/* Action Row Footer */}
      <div
        className="flex gap-2 px-4 py-3 flex-shrink-0"
        style={{
          background: 'var(--bg-raised)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Button variant="secondary" size="sm" fullWidth onClick={onViewPsyche}>
          View Psyche
        </Button>
        <Button variant="primary" size="sm" fullWidth onClick={onIntervene}>
          Intervene
        </Button>
      </div>
    </div>
  );
});

// ─── Trait Row Component ──────────────────────────────────────────

function TraitRow({ trait }: { trait: TraitSummary }) {
  const catColor = TRAIT_CATEGORY_COLORS[trait.category] ?? 'var(--text-muted)';
  const catLabel = TRAIT_CATEGORY_LABELS[trait.category] ?? trait.category;

  // Build domain contribution tooltip content
  const domainEntries = Object.entries(trait.domainContributions).filter(([, v]) => v !== 0);

  const tooltipLines: string[] = [];
  if (trait.flavorText) tooltipLines.push(trait.flavorText);
  if (domainEntries.length > 0) {
    tooltipLines.push(
      domainEntries
        .map(([domain, value]) => {
          const sign = value > 0 ? '+' : '';
          const name = (DOMAIN_NAMES as Record<string, string>)[domain] ?? domain;
          return `${sign}${value} ${name}`;
        })
        .join(' · '),
    );
  }
  if (trait.maxLevel > 1) {
    tooltipLines.push(`Level ${trait.level}/${trait.maxLevel}`);
  }

  const tooltipContent = tooltipLines.join('\n');

  return (
    <Tooltip content={tooltipContent || trait.description}>
      <div
        className="flex items-center gap-2 px-2 py-1 rounded transition-colors cursor-default trait-row"
        style={{ borderLeft: `2px solid ${catColor}` }}
      >
        <span
          className="text-xs flex-1 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {trait.name}
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: catColor }}
        >
          {catLabel}
        </span>
        {trait.maxLevel > 1 && (
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {trait.level}/{trait.maxLevel}
          </span>
        )}
      </div>
    </Tooltip>
  );
}

// ─── Leverage Section Component (THR-30) ─────────────────────────

const SECRET_TYPE_LABELS: Record<string, string> = {
  hidden_allegiance: 'Hidden Allegiance',
  betrayal_planned: 'Betrayal Planned',
  financial_secret: 'Financial Secret',
  past_crime: 'Past Crime',
  secret_ambition: 'Secret Ambition',
  hidden_weakness: 'Hidden Weakness',
  dark_ritual: 'Dark Ritual',
  forbidden_knowledge: 'Forbidden Knowledge',
};

function magnitudeLabel(mag: number): string {
  if (mag >= 0.7) return 'Major';
  if (mag >= 0.4) return 'Moderate';
  return 'Minor';
}

function LeverageSection({ leverage }: { leverage: LeverageSummary }) {
  const totalSecrets = leverage.secretsHeld.length + leverage.secretsAbout.length;
  const totalFavors = leverage.favorsOwed.length + leverage.favorsOwedToMe.length;
  if (totalSecrets === 0 && totalFavors === 0) return null;

  return (
    <div
      className="px-4 py-3"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <SectionHeading>Leverage</SectionHeading>
      <div className="space-y-2 mt-2">

        {leverage.secretsHeld.length > 0 && (
          <div>
            <div
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--accent-gold)' }}
            >
              Secrets held ({leverage.secretsHeld.length})
            </div>
            {leverage.secretsHeld.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--accent-gold)', opacity: 0.7 }}
                />
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {SECRET_TYPE_LABELS[s.secretType] ?? s.secretType}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                    on {s.subjectName}
                  </span>
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {magnitudeLabel(s.magnitude)}
                </span>
              </div>
            ))}
          </div>
        )}

        {leverage.secretsAbout.length > 0 && (
          <div>
            <div
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--negative)' }}
            >
              Exposed ({leverage.secretsAbout.length})
            </div>
            {leverage.secretsAbout.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--negative)', opacity: 0.7 }}
                />
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {SECRET_TYPE_LABELS[s.secretType] ?? s.secretType}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                    known by {s.subjectName}
                  </span>
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {magnitudeLabel(s.magnitude)}
                </span>
              </div>
            ))}
          </div>
        )}

        {leverage.favorsOwedToMe.length > 0 && (
          <div>
            <div
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--positive)' }}
            >
              Favors owed ({leverage.favorsOwedToMe.length})
            </div>
            {leverage.favorsOwedToMe.map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--positive)', opacity: 0.7 }}
                />
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {f.counterpartyName}
                  {f.context && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                      · {f.context}
                    </span>
                  )}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {magnitudeLabel(f.magnitude)}
                </span>
              </div>
            ))}
          </div>
        )}

        {leverage.favorsOwed.length > 0 && (
          <div>
            <div
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Owes favors ({leverage.favorsOwed.length})
            </div>
            {leverage.favorsOwed.map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--text-muted)' }}
                />
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  to {f.counterpartyName}
                  {f.context && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                      · {f.context}
                    </span>
                  )}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {magnitudeLabel(f.magnitude)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
