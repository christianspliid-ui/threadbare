import type { ReactNode } from 'react';
import type { AgentInfoCardData, AgentFullProfileData, PersonalityContributorDisplay } from '../../../engine/agentDetail';
import type { CohesionState } from '../../../engine/groups/groupQueries';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import {
  OVERVIEW_GOSSIP_THRESHOLD,
  OVERVIEW_BACKSTORY_INTERACTIONS,
} from '../../../types/agentKnowledge';
import { SectionHeading } from '../../shared/SectionHeading';
import { Tooltip } from '../../shared/Tooltip';
import { EntityVisual } from '../../shared/EntityVisual';
import { resolveTooltip } from '../../../engine/tooltipResolver';
import type { WorldGraph } from '../../../engine/graph';
import { getSphereColor } from '../../../data/sphereIcons';
import { getReputationWord } from '../../../data/domain-words';
import { getNotableStandings } from '../../../engine/reputation';
import { CORE_CONTINUA, CORE_NEUTRAL } from '../../../types/coreRegistry';
import { CANONICAL_AXES, signedToCanonical01 } from '../../../types/axisRegistry';

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

/**
 * Signed ±1 threshold below which a moral-axis position reads as neutral. An axis with
 * |position| under this and no contributors shows no "now" bar, so a near-neutral agent
 * isn't padded with eight flat tracks — only the axes their story actually touched.
 */
const AXIS_SIGNAL_EPSILON = 0.1;

// ─── Company cohesion prose (THR-74) ──────────────────────────────

/**
 * Cohesion is shown to the player only as a sentence — never `Cohesion: 0.62`
 * (the raw number lives in the DebugPanel Companies tab). The ladder word is
 * woven into a phrase about the company as a whole.
 */
const COHESION_SENTENCE: Record<CohesionState, string> = {
  bound: 'Their bond holds fast — they move as one.',
  holding: 'They hold together, for now.',
  frayed: 'The bonds between them are beginning to fray.',
  breaking: 'They are on the verge of parting ways.',
};

/**
 * Standing rivalries as one sentence (THR-731). Never "Rivals: 2" and never the
 * `since` tick — a grudge is a thing the company carries, so it reads as prose.
 * Beyond two names the list stops naming and starts counting *in words*, because a
 * company that has fought half the world should sound notorious, not tabulated.
 */
function rivalsSentence(rivals: readonly string[]): string {
  if (rivals.length === 1) return `There is blood between them and ${rivals[0]}.`;
  if (rivals.length === 2) return `There is blood between them and both ${rivals[0]} and ${rivals[1]}.`;
  return `There is blood between them and ${rivals[0]}, ${rivals[1]}, and others besides.`;
}

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

/**
 * One moral axis as a labelled track with a marker at the agent's *live* position
 * (THR-567 "now"), with its permanent contributors ("born as → marked by") listed
 * beneath as `children`. Scale mirrors CoreContinuumRow: virtue pole = 1.0 (left),
 * vice pole = 0.0 (right), 0.5 neutral. The agent value arrives signed ±1 and is
 * converted to that 0–1 scale via the canonical bridge. The leaning pole word +
 * marker take the virtue (gold) / vice (rose) personality palette.
 */
function MoralAxisRow({
  virtue,
  vice,
  signed,
  children,
}: {
  virtue: string;
  vice: string;
  signed: number;
  children?: ReactNode;
}) {
  const v = signedToCanonical01(signed);
  const markerLeftPct = (1 - v) * 100;
  const leansVirtue = v > CORE_NEUTRAL + CORE_LEAN_EPSILON;
  const leansVice = v < CORE_NEUTRAL - CORE_LEAN_EPSILON;
  const markerColor = leansVirtue
    ? PERSONALITY_VIRTUE_COLOR
    : leansVice
      ? PERSONALITY_VICE_COLOR
      : 'var(--text-tertiary)';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: leansVirtue ? PERSONALITY_VIRTUE_COLOR : 'var(--text-tertiary)' }}>
          {virtue}
        </span>
        <span style={{ color: leansVice ? PERSONALITY_VICE_COLOR : 'var(--text-tertiary)' }}>
          {vice}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-subtle)' }}>
        <div
          className="absolute top-0 bottom-0"
          style={{ left: '50%', width: '1px', backgroundColor: 'var(--text-tertiary)', opacity: 0.4 }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: `${markerLeftPct}%`,
            width: '8px',
            height: '8px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: markerColor,
          }}
        />
      </div>
      {children}
    </div>
  );
}

// ─── Faction name (THR-1149) ─────────────────────────────────────

/**
 * The faction line in the sheet's Faction section: heraldry, name, tooltip,
 * and a click through to that faction's own sheet.
 *
 * Until THR-1149 this was a bare `<p>` carrying a glyph prefix — a named entity
 * with a live page (`FactionSheet`) reachable from nowhere (Law 21), and a game
 * concept presented as text alone (Law 1).
 *
 * Each of the three treatments degrades on its own, because each depends on
 * different data and the sheet must stay honest when a piece is missing
 * (NFP #4):
 *
 * - **Heraldry** always renders. `resolveEntityVisual` falls back to a designed
 *   glyph tile when no sigil resolves, so the missing-art state reads as
 *   designed rather than broken (Law 4). It replaces the ad-hoc
 *   `factionIconGlyph` prefix — one resolver per representation class (Law 3).
 * - **The link** needs `factionNodeId` *and* a handler. Without both the name is
 *   plain styled text, never a control that looks live and does nothing.
 * - **The tooltip** needs `factionDefId` to resolve in the registry. The label
 *   is the faction's own name — data the card already carries, not copy — while
 *   the description comes from `resolveTooltip` (Law 17). A faction whose
 *   definition is absent gets no hover affordance rather than an empty popup.
 */
function FactionName({
  card,
  graph,
  onOpenFaction,
}: {
  card: AgentInfoCardData;
  graph?: WorldGraph | null;
  onOpenFaction?: (factionNodeId: string, name: string) => void;
}) {
  const name = card.factionName ?? '';
  const canOpen = !!card.factionNodeId && !!onOpenFaction;
  const hasTooltip = !!card.factionDefId && !!resolveTooltip(`faction.${card.factionDefId}`);

  const label = (
    <span
      className={`text-sm${canOpen || hasTooltip ? ' underline decoration-dotted' : ''}`}
      style={{ color: 'var(--text-secondary)' }}
    >
      {name}
    </span>
  );

  const named = canOpen ? (
    <button
      type="button"
      onClick={() => onOpenFaction!(card.factionNodeId!, name)}
      title={`Open ${name}`}
      className="cursor-pointer p-0 bg-transparent text-left"
      style={{ border: 'none' }}
    >
      {label}
    </button>
  ) : (
    label
  );

  return (
    <div className="flex items-center gap-2 min-w-0">
      <EntityVisual
        size="chip"
        entity={{
          id: card.factionNodeId ?? card.factionDefId ?? name,
          kind: 'faction',
          name,
        }}
        graph={graph ?? null}
        aria-label={name}
        title={name}
        data-testid="faction-heraldry"
      />
      {hasTooltip ? (
        <Tooltip id={`faction.${card.factionDefId}`} label={name}>
          {named}
        </Tooltip>
      ) : (
        named
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────

interface OverviewTabProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  knowledge?: AgentKnowledge;
  /** Open a fellow company member's profile (THR-74 roster click-through). */
  onOpenEntity?: (id: string) => void;
  /** World graph — resolves faction heraldry art (THR-1149). */
  graph?: WorldGraph | null;
  /** Open the faction's own sheet from the Faction section (THR-1149). */
  onOpenFaction?: (factionNodeId: string, name: string) => void;
}

/**
 * How many of an agent's standings the Overview lists (THR-1206).
 *
 * Five, not three: the section is a scan of who this person is known to, and a list
 * cut so short that a fourth relationship is invisible reads as "they have three",
 * which is a different and false statement. Five still fits the section without
 * scrolling. Executor's call per the plan's grey zones; tune here (NFP #1).
 */
const OVERVIEW_MAX_STANDINGS = 5;

export function OverviewTab({ card, profile: _profile, knowledge, onOpenEntity, graph, onOpenFaction }: OverviewTabProps) {
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

  // THR-1206 — the agent's notable standings, strongest departure from neutral first.
  // Read straight off the graph rather than through the card, because the card is
  // built for the info popover and threading a sixth list through it would put a
  // second producer on a store that already has one.
  const standings = graph ? getNotableStandings(graph, card.id, OVERVIEW_MAX_STANDINGS) : [];

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

  // Personality section (intimate+): the layered born→marked→becoming→now story.
  const isIntimate = hasKnowledge(card.knowledgeLevel, 'intimate');
  const emergentTraits = card.personalityTraits ?? [];
  const contributorsByAxis = new Map<string, PersonalityContributorDisplay[]>();
  for (const c of card.personalityContributors ?? []) {
    const arr = contributorsByAxis.get(c.axisId);
    if (arr) arr.push(c);
    else contributorsByAxis.set(c.axisId, [c]);
  }
  // Axes worth showing a live-position bar for: a non-neutral standing position, or
  // at least one permanent contributor. Keeps a near-neutral agent from padding the
  // sheet with eight flat tracks while still surfacing every axis their story touched.
  const axisRows = CANONICAL_AXES.filter((axis) => {
    const signed = card.axiologicalProfile?.[axis.valuePair] ?? 0;
    return Math.abs(signed) >= AXIS_SIGNAL_EPSILON || contributorsByAxis.has(axis.axisId);
  });
  const showPersonality = isIntimate && (emergentTraits.length > 0 || axisRows.length > 0);
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
              <FactionName card={card} graph={graph} onOpenFaction={onOpenFaction} />
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
                    // Named so THR-1138's "the bar survives" assertion can select
                    // it directly. It used to be found as the section's first
                    // element carrying an inline width, which the heraldry tile
                    // added by THR-1149 would silently have become.
                    data-testid="faction-standing-fill"
                    style={{
                      width: `${Math.round(card.factionReputation * 100)}%`,
                      backgroundColor: card.factionThemeColor ?? 'var(--accent-gold)',
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {getReputationWord(card.factionReputation)}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Company (THR-74) — the band this agent travels with. Public (a company
          is visible on the map), so not knowledge-gated. Cohesion is prose only. */}
      {card.company && (
        <section>
          <SectionHeading as="h2">Company</SectionHeading>
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>
              {card.company.name}
              {card.company.role === 'leader' && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}> — they lead it</span>
              )}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {COHESION_SENTENCE[card.company.cohesionState]}
            </p>
            {/* Rivals (THR-731) — only when blood has actually been spilt. */}
            {card.company.rivals && card.company.rivals.length > 0 && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {rivalsSentence(card.company.rivals)}
              </p>
            )}
            {card.company.members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {card.company.members.map((m) => {
                  const isSelf = m.id === card.id;
                  const label = m.role === 'leader' ? `${m.name} · leads` : m.name;
                  return isSelf || !onOpenEntity ? (
                    <span
                      key={m.id}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--border-subtle)',
                        color: isSelf ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      }}
                    >
                      {label}
                    </span>
                  ) : (
                    <button
                      key={m.id}
                      onClick={() => onOpenEntity(m.id)}
                      title={`Open ${m.name}`}
                      className="text-xs px-2 py-0.5 rounded underline decoration-dotted cursor-pointer"
                      style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)', border: 'none' }}
                    >
                      {label}
                    </button>
                  );
                })}
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

      {/* Standings (THR-1206) — who and where this person is known to, in the one
          word vocabulary the Reputation section above and every chip already use.
          Knowledge-gated with its siblings: what a stranger's standing is around
          town is exactly the sort of thing you learn by asking about them.

          Edge leg only. The Faction section above already shows the membership leg
          for this agent, and repeating it here would show one relationship twice
          under two headings. */}
      {reputationRevealed && graph && standings.length > 0 && (
        <section data-testid="overview-standings">
          <SectionHeading as="h2">Standings</SectionHeading>
          <div className="space-y-1">
            {standings.map((standing) => {
              const node = graph.getNode(standing.targetId);
              const label = node?.name ?? standing.targetId;
              const clickable = onOpenEntity != null && node != null;
              return (
                <div
                  key={standing.targetId}
                  className="flex items-center justify-between gap-3"
                >
                  {clickable ? (
                    <button
                      type="button"
                      className="text-sm text-left underline decoration-dotted underline-offset-2"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => onOpenEntity?.(standing.targetId)}
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  )}
                  <Tooltip id="ui.reputation_with">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {standing.band}
                    </span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Personality — the layered moral story, intimate+:
            born as (origin vignettes) → marked by (permanent marks) → becoming
            (emergent traits) → now (live per-axis position). Contributors group
            beneath the axis they pushed on; the emergent chips stay as THR-562
            shipped them. Distinguished from the generic Traits chips. */}
      {showPersonality && (
        <section>
          <SectionHeading as="h2">Personality</SectionHeading>
          <p className="text-xs italic mb-2" style={{ color: 'var(--text-tertiary)' }}>
            How {card.name} came to be — and who they are now.
          </p>

          {/* Where they stand now — each moral axis's live position, grounded in the
              origin vignettes ("born") and permanent marks ("marked") that shaped it. */}
          {axisRows.length > 0 && (
            <div className="space-y-3 mb-3">
              {axisRows.map((axis) => {
                const signed = card.axiologicalProfile?.[axis.valuePair] ?? 0;
                const rows = contributorsByAxis.get(axis.axisId) ?? [];
                return (
                  <MoralAxisRow
                    key={axis.axisId}
                    virtue={axis.virtue.word}
                    vice={axis.vice.word}
                    signed={signed}
                  >
                    {rows.length > 0 && (
                      <div className="space-y-0.5 pl-1 pt-0.5">
                        {rows.map((c) => {
                          const poleColor = c.pole === 'virtue' ? PERSONALITY_VIRTUE_COLOR : PERSONALITY_VICE_COLOR;
                          const poleWord = c.pole === 'virtue' ? axis.virtue.word : axis.vice.word;
                          const label = c.source === 'origin' ? 'Origin' : 'Mark';
                          const tip = c.source === 'mark' && c.detail
                            ? `${label} — leans ${poleWord}: ${c.detail}`
                            : `${label} — leans ${poleWord}`;
                          return (
                            <div
                              key={c.id}
                              data-testid="personality-contributor"
                              title={tip}
                              className="flex items-start gap-1.5 text-xs"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <span aria-hidden="true" style={{ color: poleColor, lineHeight: 1.4 }}>
                                {c.source === 'origin' ? '◦' : '✦'}
                              </span>
                              <span>{c.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </MoralAxisRow>
                );
              })}
            </div>
          )}

          {/* Becoming — emergent moral-axis traits (THR-562), kept as shipped. */}
          {emergentTraits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emergentTraits.map((t) => {
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
          )}
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
