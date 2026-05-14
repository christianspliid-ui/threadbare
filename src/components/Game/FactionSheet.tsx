import React, { useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import type { FactionDefinition, FactionRankTier } from '../../types/faction';
import { REACH_DOMAINS } from '../../types/traits';
import { CoatOfArms, ReachIcon } from '../icons';
import type { WorldGraph } from '../../engine/graph';
import type {
  FactionNetworkLocation,
  FactionNetworkMember,
  FactionNetworkSummary,
} from '../../engine/factionNetwork';
import { getFactionNetworkSummary } from '../../engine/factionNetwork';
import type { FactionActionRecord } from '../../types/factionAction';

interface FactionSheetProps {
  factionId: string;
  name: string;
  graph?: WorldGraph;
  onClose: () => void;
  onOpenTargetActions?: (factionId: string) => void;
}

export const FactionSheet = React.memo(function FactionSheet({
  factionId,
  name,
  graph,
  onClose,
  onOpenTargetActions,
}: FactionSheetProps) {
  const summary = useMemo(
    () => (graph ? getFactionNetworkSummary(graph, factionId) : null),
    [graph, factionId],
  );

  const factionNode = useMemo(() => graph?.getNode(factionId) ?? null, [graph, factionId]);

  const actionHistory = useMemo<FactionActionRecord[]>(
    () => (factionNode?.properties?.factionActionHistory as FactionActionRecord[] | undefined) ?? [],
    [factionNode],
  );

  const activeConclave = useMemo(
    () => factionNode?.properties?.activeConclave as {
      question: string;
      participants: string[];
      ticksRemaining: number;
    } | null ?? null,
    [factionNode],
  );

  const definition = useMemo(() => {
    if (summary?.definition) return summary.definition;
    const match = factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
    if (!match) return undefined;
    return FACTION_DEFINITIONS.get(match[1]);
  }, [factionId, summary]);

  if (!definition && !summary) {
    return (
      <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
        <Modal.Header onClose={onClose}>{name}</Modal.Header>
        <Modal.Body>
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
            Faction data unavailable.
          </p>
        </Modal.Body>
      </Modal>
    );
  }

  const displayName = summary?.name ?? name;
  const factionType = summary?.factionType ?? definition?.factionType ?? 'faction';
  const themeColor = definition?.themeColor ?? summary?.definition?.themeColor ?? '#D4A574';

  // THR-400 — read governance signals from faction properties. No numbers
  // surface to the player; the ambient shadow scales with dissentLevel,
  // and the star glyph appears only when a recovered doctrine is in effect.
  const dissentLevel = (factionNode?.properties?.dissentLevel as number | undefined) ?? 0;
  const recoveredDoctrineId = factionNode?.properties?.recoveredDoctrineId as string | undefined;
  const recoveredDoctrineExpiresTick = factionNode?.properties?.recoveredDoctrineExpiresTick as number | undefined;

  // THR-432 — succession signals.
  // `hasWovenSuccessor`: a `will_succeed` edge exists → woven-thread glyph
  //   next to the Leader stat (tooltip: "A successor has been woven — the
  //   thread waits for the crown to fall.").
  // `leaderByInheritance`: a `leads` edge exists with conferredVia: 'anointment'
  //   → "by inheritance" sublabel under Leader.
  const hasWovenSuccessor = useMemo(() => {
    if (!graph) return false;
    return graph.getIncomingEdges(factionId, 'will_succeed').length > 0;
  }, [graph, factionId]);
  const leaderByInheritance = useMemo(() => {
    if (!graph) return false;
    const leads = graph.getIncomingEdges(factionId, 'leads')[0];
    return !!leads && leads.properties.conferredVia === 'anointment';
  }, [graph, factionId]);
  // Doctrine glyph: present when doctrine is set and not yet expired (engine
  // sweeps expired markers on a future tick — we treat absence-of-tick as
  // present for fail-soft display).
  const hasDoctrineGlyph = !!recoveredDoctrineId && (recoveredDoctrineExpiresTick == null || true);
  // Box-shadow scales linearly with dissent (0..1 → 0..18px alpha).
  const dissentShadow = dissentLevel > 0
    ? `0 0 ${Math.round(8 + dissentLevel * 14)}px rgba(60, 30, 40, ${Math.min(0.85, 0.30 + dissentLevel * 0.5)})`
    : undefined;

  return (
    <Modal open={true} onClose={onClose} aria-label={`${displayName} profile`}>
      <Modal.Header onClose={onClose}>
        <span
          data-testid="faction-icon-shell"
          data-dissent-level={dissentLevel.toFixed(2)}
          style={{
            display: 'inline-block',
            boxShadow: dissentShadow,
            borderRadius: '8px',
            transition: 'box-shadow 240ms ease',
          }}
        >
          {definition && <CoatOfArms definition={definition} size={64} />}
        </span>
        {' '}
        {displayName}
        {hasDoctrineGlyph && (
          <span
            data-testid="faction-doctrine-glyph"
            title="A recovered teaching reshapes this faction's alignment for a time."
            aria-label="recovered doctrine in effect"
            style={{
              marginLeft: '6px',
              color: 'var(--accent-gold, #d4af37)',
              fontSize: '0.75em',
              verticalAlign: 'middle',
            }}
          >
            ✦
          </span>
        )}
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {(definition?.description || definition?.motto) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {definition?.description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {definition.description}
                </p>
              )}
              {definition?.motto && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  &ldquo;{definition.motto}&rdquo;
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: `${themeColor}26`,
                border: `1px solid ${themeColor}66`,
                color: themeColor,
                textTransform: 'capitalize',
              }}
            >
              {factionType}
            </span>
            {summary?.governingSeats.length ? (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: 'var(--accent-gold)',
                }}
              >
                Governs {summary.governingSeats.length} seat{summary.governingSeats.length === 1 ? '' : 's'}
              </span>
            ) : null}
            {onOpenTargetActions && (
              <button
                onClick={() => onOpenTargetActions(factionId)}
                style={actionButtonStyle(themeColor)}
              >
                Ascendant Actions
              </button>
            )}
          </div>

          {summary && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 'var(--space-2)',
                }}
              >
                <StatCard
                  label="Leader"
                  value={summary.leader?.name ?? 'Unsettled'}
                  glyph={hasWovenSuccessor ? '❧' : undefined}
                  glyphTitle={hasWovenSuccessor ? 'A successor has been woven — the thread waits for the crown to fall.' : undefined}
                  sublabel={leaderByInheritance && summary.leader ? 'by inheritance' : undefined}
                />
                <StatCard label="Members" value={String(summary.memberCount)} />
                <StatCard label="Halls" value={String(summary.hallCount)} />
                <StatCard label="Control" value={String(summary.controlledCount)} />
                <StatCard label="Armies" value={String(summary.armyCount)} />
              </div>

              <Section title="Network Graph">
                <FactionNetworkGraph summary={summary} color={themeColor} />
              </Section>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-3)' }}>
                <Section title="Leadership">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {summary.leader ? (
                      <MemberRow member={summary.leader} color={themeColor} emphasis="leader" />
                    ) : (
                      <MutedLine>No established leader yet.</MutedLine>
                    )}
                    {summary.officers.length > 0 ? (
                      summary.officers.map(member => (
                        <MemberRow key={member.id} member={member} color={themeColor} emphasis="officer" />
                      ))
                    ) : (
                      <MutedLine>No officer cadre visible.</MutedLine>
                    )}
                  </div>
                </Section>

                <Section title="Strongest Reaches">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {REACH_DOMAINS
                      .sort((a, b) => (summary.domainCapabilities[b] ?? 0) - (summary.domainCapabilities[a] ?? 0))
                      .filter(domain => (summary.domainCapabilities[domain] ?? 0) > 0)
                      .slice(0, 5)
                      .map(domain => {
                        const score = summary.domainCapabilities[domain] ?? 0;
                        return (
                          <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: '76px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                              <ReachIcon reach={domain} size={14} />
                              {domain}
                            </span>
                            <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', backgroundColor: themeColor, borderRadius: '3px', opacity: 0.8 }} />
                            </div>
                            <span style={{ width: '34px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                              {score}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </Section>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-3)' }}>
                <Section title="Members">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {summary.members.length > 0 ? (
                      summary.members.slice(0, 12).map(member => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          color={themeColor}
                          emphasis={member.isLeader ? 'leader' : member.isOfficer ? 'officer' : 'member'}
                        />
                      ))
                    ) : (
                      <MutedLine>No known members.</MutedLine>
                    )}
                  </div>
                </Section>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <Section title="Halls & Seats">
                    <LocationList
                      entries={summary.halls.length > 0 ? summary.halls : summary.governingSeats}
                      emptyText="No halls on record."
                    />
                  </Section>

                  <Section title="What They Control">
                    <LocationList
                      entries={summary.controlledLocations}
                      emptyText="No controlled settlements yet."
                    />
                  </Section>

                  <Section title="Current Agenda">
                    {summary.activeAmbition ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{summary.activeAmbition.name}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                          priority {(summary.activeAmbition.priority * 100).toFixed(0)}% · {summary.activeAmbition.status}
                        </span>
                      </div>
                    ) : (
                      <MutedLine>No active faction agenda.</MutedLine>
                    )}
                    {activeConclave && (
                      <div style={{ marginTop: 'var(--space-2)', padding: '8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                        <span style={{ color: '#a78bfa', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '2px' }}>
                          Conclave in session ({activeConclave.ticksRemaining} tick{activeConclave.ticksRemaining !== 1 ? 's' : ''} remaining)
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                          {activeConclave.question}
                        </span>
                      </div>
                    )}
                  </Section>

                  <Section title="Relations">
                    {summary.relations.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {summary.relations.slice(0, 6).map(relation => (
                          <div key={relation.factionId} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{relation.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {relation.isRival && (
                                <span style={{ fontSize: 'var(--text-xs)', padding: '1px 5px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                                  Rival
                                </span>
                              )}
                              {relation.isAlliance && (
                                <span style={{ fontSize: 'var(--text-xs)', padding: '1px 5px', borderRadius: '3px', background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80' }}>
                                  Allied
                                </span>
                              )}
                              <span style={{ color: relationColor(relation.sentiment) }}>{relation.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <MutedLine>No faction relations recorded.</MutedLine>
                    )}
                  </Section>

                  {actionHistory.length > 0 && (
                    <Section title="Recent Actions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {actionHistory.slice(-5).reverse().map((record, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', alignItems: 'baseline' }}>
                            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              {record.actionType.replace(/_/g, ' ')}
                              {record.targetName ? ` → ${record.targetName}` : ''}
                            </span>
                            <span style={{ color: record.outcome === 'success' ? '#4ade80' : record.outcome === 'failed' ? '#f87171' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                              {record.outcome}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              </div>
            </>
          )}

          {definition && (
            <Section title="Ranks">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {definition.rankTiers.map((tier: FactionRankTier) => (
                  <div key={tier.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{tier.name}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      rep {(tier.minReputation * 100).toFixed(0)}%+
                      {tier.maxSlots != null ? ` (${tier.maxSlots} slot${tier.maxSlots !== 1 ? 's' : ''})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

FactionSheet.displayName = 'FactionSheet';

function FactionNetworkGraph({
  summary,
  color,
}: {
  summary: FactionNetworkSummary;
  color: string;
}) {
  const memberNodes = summary.members.slice(0, 4);
  const hallNodes = summary.halls.slice(0, 2);
  const controlNodes = summary.controlledLocations.slice(0, 2);
  const armyNodes = summary.armies.slice(0, 2);

  const leftNodes = [...memberNodes];
  const rightNodes = [...hallNodes, ...controlNodes];
  const bottomNodes = [...armyNodes];

  return (
    <svg viewBox="0 0 520 260" style={{ width: '100%', height: '260px', borderRadius: '10px', background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.7), rgba(8, 8, 8, 0.92))' }}>
      <defs>
        <linearGradient id="faction-link" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <NetworkNode x={260} y={128} label={summary.name} sublabel="Faction core" color={color} radius={26} />

      {summary.leader && (
        <>
          <line x1={260} y1={102} x2={260} y2={60} stroke="url(#faction-link)" strokeWidth={2} />
          <NetworkNode x={260} y={40} label={summary.leader.name} sublabel="Leader" color="#f59e0b" radius={18} />
        </>
      )}

      {leftNodes.map((member, index) => {
        const y = 62 + index * 44;
        return (
          <g key={member.id}>
            <line x1={260} y1={128} x2={130} y2={y} stroke="url(#faction-link)" strokeWidth={1.5} />
            <NetworkNode x={110} y={y} label={member.name} sublabel={member.rankLabel} color={member.isOfficer ? '#f59e0b' : '#94a3b8'} radius={15} align="start" />
          </g>
        );
      })}

      {rightNodes.map((location, index) => {
        const y = 72 + index * 44;
        const sublabel = index < hallNodes.length ? 'Hall' : 'Control';
        return (
          <g key={location.id}>
            <line x1={260} y1={128} x2={390} y2={y} stroke="url(#faction-link)" strokeWidth={1.5} />
            <NetworkNode x={410} y={y} label={location.name} sublabel={sublabel} color={index < hallNodes.length ? '#22c55e' : '#60a5fa'} radius={15} align="end" />
          </g>
        );
      })}

      {bottomNodes.map((army, index) => {
        const x = 205 + index * 110;
        return (
          <g key={army.id}>
            <line x1={260} y1={154} x2={x} y2={210} stroke="url(#faction-link)" strokeWidth={1.5} />
            <NetworkNode x={x} y={224} label={army.name} sublabel="Army" color="#ef4444" radius={15} />
          </g>
        );
      })}
    </svg>
  );
}

function NetworkNode({
  x,
  y,
  label,
  sublabel,
  color,
  radius,
  align = 'middle',
}: {
  x: number;
  y: number;
  label: string;
  sublabel: string;
  color: string;
  radius: number;
  align?: 'start' | 'middle' | 'end';
}) {
  const textX = align === 'start' ? x + radius + 10 : align === 'end' ? x - radius - 10 : x;
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill={`${color}22`} stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y} r={radius - 5} fill="rgba(12, 10, 9, 0.85)" />
      <text x={textX} y={y - 4} fill="var(--text-primary)" textAnchor={align} fontSize="12" fontFamily="var(--font-body)">
        {truncate(label, 19)}
      </text>
      <text x={textX} y={y + 12} fill="var(--text-tertiary)" textAnchor={align} fontSize="10" fontFamily="var(--font-body)">
        {truncate(sublabel, 19)}
      </text>
    </g>
  );
}

function MemberRow({
  member,
  color,
  emphasis,
}: {
  member: FactionNetworkMember;
  color: string;
  emphasis: 'leader' | 'officer' | 'member';
}) {
  const accent = emphasis === 'leader' ? '#f59e0b' : emphasis === 'officer' ? color : 'var(--border-subtle)';
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: '8px',
        background: 'rgba(12, 10, 9, 0.45)',
        border: `1px solid ${accent}55`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{member.name}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            {[member.rankLabel, member.locationName].filter(Boolean).join(' · ') || member.role}
          </span>
        </div>
        <span style={{ color: accent, fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
          {emphasis}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <div style={{ flex: 1, height: '5px', borderRadius: '999px', overflow: 'hidden', background: 'var(--bg-raised)' }}>
          <div style={{ width: `${Math.round(member.reputation * 100)}%`, height: '100%', background: color, opacity: 0.85 }} />
        </div>
        <span style={{ width: '40px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
          {Math.round(member.reputation * 100)}%
        </span>
      </div>
    </div>
  );
}

function LocationList({
  entries,
  emptyText,
}: {
  entries: FactionNetworkLocation[];
  emptyText: string;
}) {
  if (entries.length === 0) return <MutedLine>{emptyText}</MutedLine>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {entries.slice(0, 6).map(entry => (
        <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
          <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
            {entry.subtype ?? 'site'}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  glyph,
  sublabel,
  glyphTitle,
}: {
  label: string;
  value: string;
  /** Optional small unicode glyph rendered next to the label (THR-432). */
  glyph?: string;
  /** Optional small italic sublabel beneath value (THR-432). */
  sublabel?: string;
  /** Title (hover tooltip) for the glyph. */
  glyphTitle?: string;
}) {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '8px',
        background: 'rgba(12, 10, 9, 0.45)',
        border: '1px solid rgba(120, 113, 108, 0.25)',
      }}
    >
      <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{label}</span>
        {glyph != null ? (
          <span
            data-testid="statcard-glyph"
            title={glyphTitle}
            style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}
            aria-label={glyphTitle ?? 'glyph'}
          >
            {glyph}
          </span>
        ) : null}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', marginTop: '4px' }}>
        {value}
      </div>
      {sublabel != null ? (
        <div
          data-testid="statcard-sublabel"
          style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '2px', fontStyle: 'italic' }}
        >
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function MutedLine({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{children}</p>;
}

function relationColor(sentiment: number): string {
  if (sentiment >= 0.2) return '#4ade80';
  if (sentiment <= -0.2) return '#f87171';
  return '#fbbf24';
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    fontSize: 'var(--text-xs)',
    padding: '4px 10px',
    borderRadius: '999px',
    border: `1px solid ${color}88`,
    background: `${color}18`,
    color,
    cursor: 'pointer',
  };
}
