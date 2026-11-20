import type { DoomClockDefinition, DoomClockState } from '../../types/doomClock';
import { Modal } from '../shared/Modal';
import { Tooltip } from '../shared/Tooltip';
import { Icon } from '../shared/Icon';
import { Button } from '../shared/Button';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';
import { DOOM_CLIMAX_START } from '../../data/game-config';
import { durationLabel } from '../../engine/aftermathWords';
// THR-2103 (decision 8, Law 58): the doom marks live in one list; this file kept a second copy.
import { DOOM_ARCHETYPE_FALLBACK_GLYPH, DOOM_ARCHETYPE_GLYPHS } from '../../data/doom-archetype-presentation';
import type { RaceLeverView, RaceView } from '../../engine/views/subjects/godSheet';
import { RaceForecastLine, RaceLeverLine } from './RaceForecast';
import { useCallback, useState, type ReactNode } from 'react';
import { ListRow } from '../shared/ListRow';
import { useRefRouterContext } from '../../contexts/RefRouterContext';
import { EntityLink } from '../shared/EntityLink';
import { DOOM_FEED_WORDS, type DoomFeedingsView } from '../../engine/views/doomFeedings';

interface DoomClockDetailProps {
  open: boolean;
  onClose: () => void;
  definition: DoomClockDefinition;
  state: DoomClockState;
  journeyLabel?: string;
  /**
   * THR-2240 — the answer line in the Act slot, from
   * `doomStayNotice(state, { includeNotHeld: true })`: what slows the Doom, if anything.
   */
  stayLine?: string;
  /** THR-2240 — the "Stay it" button's label, present only while the card is held and not active. */
  stayButton?: string;
  /** THR-2240 — the button's handler: the same one the stage notice's "Stay it" uses. */
  onStay?: () => void;
  /**
   * THR-2252 — which clock lands first at this pace; absent/null while the race is hidden.
   * While shown it sits above the Stay answer and replaces the rate-blind Remaining row.
   */
  race?: RaceView | null;
  /** THR-2252 — the race lever; only a chapter lever renders here (Stay is THR-2240's answer). */
  lever?: RaceLeverView | null;
  /**
   * THR-2256 — where the Doom fed (`selectDoomFeedings`): a Where it feeds section under the
   * Stay line. Absent = the section is not shown (an old caller).
   */
  feedings?: DoomFeedingsView;
  /**
   * THR-2256 — open a fed place. Default: close the panel and open the place page through
   * the ref router (the page leads with Rebuke while it is offered there).
   */
  onOpenPlace?: (placeId: string) => void;
}

const DOOM_ARCHETYPE_FLAVOR: Record<string, string> = {
  breach: 'An outside force tears at the fabric of reality. Each stage weakens the veil further.',
  convergence: 'All forces are drawn inexorably toward a single cataclysmic point.',
  changing: 'A new cosmic order rises to replace the old. The world transforms irreversibly.',
  sundering: 'The world itself fractures. Land, sea, and sky tear apart at the seams.',
  failing: 'A core force of creation weakens. The foundations of existence erode.',
  ascension: 'Something approaches godhood — and the world may not survive its arrival.',
  reckoning: 'Past debts come due. The sins of former cycles demand payment.',
};

const RING = { cx: 80, cy: 80, r: 64, stroke: 7 } as const;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING.r;

function getNextBeatLabel(definition: DoomClockDefinition, state: DoomClockState): string {
  if (state.expired) return 'The doom has landed';
  if (state.progress >= DOOM_CLIMAX_START) return 'Climax window underway';

  const nextStage = definition.stages.find((stage) => stage.stage > state.currentStage);
  if (!nextStage) return 'Final omen';

  // THR-1424 (Law 15 ruling, 2026-09-10): the threshold is a unitless proportion, and this
  // surface already renders where each stage sits — the stage list below orders them and
  // styles past/current/future. The numeral is dropped, not banded.
  return nextStage.name;
}

function formatEffectType(effectType: string | undefined): string {
  switch (effectType) {
    case 'hex_corruption': return 'Hex corruption';
    case 'hex_divine_drain': return 'Divine drain';
    case 'location_unrest': return 'Settlement unrest';
    case 'prosperity_shock': return 'Prosperity shock';
    case 'location_pressure': return 'Location pressure';
    case 'agent_pressure': return 'Thread pressure';
    default: return 'World pressure';
  }
}

/**
 * THR-2269 — which passed stages the player has opened. View state that survives the
 * dialog closing and reopening within the session (sessionStorage), keyed by archetype
 * and stage. Fail-soft (NFP 4): a storage that throws reads as "all folded".
 */
export const DOOM_STAGE_FOLD_STORE_KEY = 'threadbare.doom.openStages';

function readOpenStages(): string[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(DOOM_STAGE_FOLD_STORE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

function writeOpenStages(keys: string[]): void {
  try {
    sessionStorage.setItem(DOOM_STAGE_FOLD_STORE_KEY, JSON.stringify(keys));
  } catch {
    // Fail-soft: the fold still works for this mount; it just won't survive a reopen.
  }
}

function useOpenStages(): [ReadonlySet<string>, (key: string) => void] {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(readOpenStages()));
  const toggle = useCallback((key: string) => {
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key); else next.add(key);
      writeOpenStages([...next]);
      return next;
    });
  }, []);
  return [open, toggle];
}

export function DoomClockDetail({
  open,
  onClose,
  definition,
  state,
  journeyLabel,
  stayLine,
  stayButton,
  onStay,
  race,
  lever,
  feedings,
  onOpenPlace,
}: DoomClockDetailProps) {
  const router = useRefRouterContext();
  const openPlaceViaRouter = useCallback((placeId: string) => {
    onClose();
    router?.open({ kind: 'location', id: placeId }, 'sheet', { via: 'entity-link' });
  }, [onClose, router]);
  const openPlace = onOpenPlace ?? (router ? openPlaceViaRouter : undefined);
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  const glyph = (DOOM_ARCHETYPE_GLYPHS as Readonly<Record<string, string>>)[definition.archetype] ?? DOOM_ARCHETYPE_FALLBACK_GLYPH;
  const flavor = DOOM_ARCHETYPE_FLAVOR[definition.archetype] ?? '';
  const ticksRemaining = Math.max(0, state.totalTicks - state.currentTick);
  const nextBeatLabel = getNextBeatLabel(definition, state);
  // THR-2269 — each card shows once, inside the stage that dealt it; passed stages fold.
  const [openStages, toggleStage] = useOpenStages();
  // THR-2240 — the answer sits under the current stage (Who → Now → Act); before the
  // first stage, or once the doom has landed, it sits under the list (or not at all).
  const hasCurrentStage = definition.stages.some((_, idx) => idx === state.currentStage - 1);
  const stayAnswer = !state.expired && stayLine
    ? <DoomStayAnswer line={stayLine} button={stayButton} onStay={onStay} color={color} />
    : null;
  // THR-2252 — the forecast above the Stay answer, with the chapter or place lever only
  // (THR-2254); the Stay lever is the answer below, never twice.
  const raceBlock = !state.expired && race
    ? (
      <div data-testid="doom-detail-race" style={{ marginTop: '8px', marginLeft: '26px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <RaceForecastLine race={race} />
        {(lever?.kind === 'chapter' || lever?.kind === 'place') && <RaceLeverLine lever={lever} />}
      </div>
    )
    : null;
  // THR-2256 — where the Doom fed, under the Stay line (the Act slot).
  const feedBlock = !state.expired && feedings
    ? <DoomFeedList view={feedings} color={color} onOpenPlace={openPlace} />
    : null;
  const answer = raceBlock || stayAnswer || feedBlock ? <>{raceBlock}{stayAnswer}{feedBlock}</> : null;

  return (
    <Modal open={open} onClose={onClose} size="m" aria-label="Doom clock">
      <Modal.Header onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', color, filter: `drop-shadow(0 0 6px ${color}80)` }}>{glyph}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
          }}>
            THE {definition.archetype.toUpperCase()}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          fontStyle: 'italic',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {flavor}
        </p>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            flex: '0 0 220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '16px' }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke={`${color}15`} strokeWidth={RING.stroke + 8}
                />
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke="#2a2a2e" strokeWidth={RING.stroke}
                />
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke={color} strokeWidth={RING.stroke}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - state.progress)}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease',
                    filter: `drop-shadow(0 0 4px ${color}80)`,
                  }}
                />
                {definition.stages.map((stage, i) => {
                  const angle = stage.tickThreshold * 2 * Math.PI - Math.PI / 2;
                  const inner = RING.r - 12;
                  const outer = RING.r + 12;
                  const x1 = RING.cx + inner * Math.cos(angle);
                  const y1 = RING.cy + inner * Math.sin(angle);
                  const x2 = RING.cx + outer * Math.cos(angle);
                  const y2 = RING.cy + outer * Math.sin(angle);
                  const isPast = i < state.currentStage - 1;
                  return (
                    <line
                      key={stage.stage}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isPast ? `${color}60` : '#3a3a3e'}
                      strokeWidth={1.5}
                    />
                  );
                })}
              </svg>
              {/* THR-1424 (Law 15 ruling, 2026-09-10): the ring center used to read
                  `${pct}% / elapsed`, a third rendering of a quantity this surface already
                  states twice — the ring arc itself, and `Current Chapter N of 5` below.
                  A unitless proportion is DROPPED where the surface already renders it
                  non-numerically (the row is `Current stage` since THR-2269); it is not translated into a word ladder, because the Law 13
                  amendment of 2026-08-12 rules an adverb the wrong answer to "how much?".
                  The center now carries only the terminal state, which is not a proportion. */}
              {state.expired && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* THR-1906 — the word only; the ∞ ornament is gone. */}
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: '#dc2626',
                    lineHeight: 1,
                    textShadow: `0 0 12px ${color}40`,
                  }}>
                    Unmade
                  </span>
                </div>
              )}
            </div>

            <div style={{ width: '100%' }}>
              <StatRow
                label="Current stage"
                value={state.progress >= DOOM_CLIMAX_START ? `${state.currentStage} of 5 (Climax)` : `${state.currentStage} of 5`}
                color={color}
              />
              {/* THR-1423: both rows were raw tick counts — `24 / 96` and a bare `72` — a
                  magnitude (Law 13) in an engine unit named nowhere player-facing (Law 14),
                  with the unit spelled into the row LABEL as well as the value. Both are
                  durations, so `durationLabel` reads each without inventing a language.
                  The `pct` percentage above (line ~169) is the other Law 13 violation on this
                  surface and is NOT banded here — it needs a Law 15 ruling, split to THR-1424. */}
              <StatRow
                label="Elapsed"
                value={`${durationLabel(state.currentTick)} of ${durationLabel(state.totalTicks)}`}
              />
              {/* THR-2252 — rate-blind; the forecast replaces it while the race is shown (PC-6). */}
              {!race && <StatRow label="Remaining" value={durationLabel(ticksRemaining)} />}
              <StatRow label="Next beat" value={nextBeatLabel} />
              {journeyLabel && (
                <StatRow label="The First" value={journeyLabel} color={color} />
              )}
              {/* THR-2183 — a zero modifier is not news: both rows hide at 0, as Speed modifier does at ×1.00. */}
              {state.counterOmens > 0 && (
                <StatRow
                  label="Counter-omens"
                  tooltipId="ui.counter_omens"
                  value={`${state.counterOmens}`}
                  color="#22c55e"
                />
              )}
              {state.nextEscalationSeverityModifier > 0 && (
                <StatRow
                  label="Doom debt"
                  tooltipId="ui.doom_debt"
                  value={`+${state.nextEscalationSeverityModifier.toFixed(1)}`}
                  color="#f97316"
                />
              )}
              {state.tickModifier !== 1.0 && (
                <StatRow
                  label="Speed modifier"
                  value={`×${state.tickModifier.toFixed(2)}`}
                  color={state.tickModifier > 1 ? '#dc2626' : '#22c55e'}
                />
              )}
            </div>
          </div>

          <div style={{
            width: '1px',
            alignSelf: 'stretch',
            background: `linear-gradient(to bottom, transparent, ${color}40, transparent)`,
          }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              marginBottom: '12px',
            }}>
              Escalation & climax
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {definition.stages.map((stage, idx) => {
                const isPast = idx < state.currentStage - 1;
                const isCurrent = idx === state.currentStage - 1;
                const isFuture = idx > state.currentStage - 1;
                // THR-2269 — the cards come from `resolvedEvents` only: a stage deals its
                // authored events 1:1 on entry (phaseDoom), so the authored title list was a copy.
                const resolvedStageEvents = isFuture
                  ? []
                  : (state.resolvedEvents ?? []).filter((event) => event.stage === stage.stage);
                const foldKey = `${definition.archetype}:${stage.stage}`;
                const foldable = isPast && resolvedStageEvents.length > 0;
                const showCards = resolvedStageEvents.length > 0 && (isCurrent || (foldable && openStages.has(foldKey)));
                const cardsId = `doom-stage-cards-${stage.stage}`;

                const nameRowContent = (
                  <>
                    {foldable && (
                      <span
                        data-testid="doom-stage-disclosure"
                        data-open={showCards ? 'true' : 'false'}
                        style={{ color: 'var(--text-tertiary)', display: 'inline-flex', flexShrink: 0 }}
                      >
                        <Icon name="disclosure" size="floor" decorative style={{ transform: showCards ? 'rotate(180deg)' : 'rotate(90deg)' }} />
                      </span>
                    )}
                  </>
                );

                return (
                  <div key={stage.stage} data-testid="doom-stage" data-stage={stage.stage} style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? `${color}10` : 'transparent',
                    border: isCurrent ? `1px solid ${color}30` : '1px solid transparent',
                  }}>
                    <StageNameRow
                      foldable={foldable}
                      expanded={showCards}
                      controls={cardsId}
                      onToggle={() => toggleStage(foldKey)}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        backgroundColor: isPast ? `${color}30` : isCurrent ? color : '#2a2a2e',
                        border: isFuture ? '1.5px solid #3a3a3e' : 'none',
                        boxShadow: isCurrent ? `0 0 8px ${color}60` : 'none',
                        fontSize: 'var(--text-xs)',
                        color: isPast ? color : isCurrent ? '#0a0a0e' : '#4a4a4e',
                        fontWeight: 700,
                      }}>
                        {isPast ? <Icon name="done" size="floor" label="Passed" /> : stage.stage}
                      </div>

                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        color: isCurrent ? color : isPast ? 'var(--text-secondary)' : 'var(--text-muted)',
                        flex: 1,
                      }}>
                        {stage.name}
                      </span>

                      {nameRowContent}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {stage.stage === 5 && (
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            color: '#fbbf24',
                          }}>
                            Climax
                          </span>
                        )}
                        {/* THR-1424: the stage's threshold was a unitless proportion numeral.
                            The list's own order plus its past/current/future styling is the
                            surface's existing non-numeric rendering of where each stage sits,
                            so the numeral is dropped rather than banded (Law 15 ruling). */}
                      </div>
                    </StageNameRow>

                    {showCards && (
                      <div id={cardsId} data-testid="doom-stage-cards" style={{ marginTop: '8px', marginLeft: '26px' }}>
                        {resolvedStageEvents.map((event) => (
                          <div key={`${event.id}-${event.resolvedTick}`} data-testid="doom-stage-card" style={{
                            fontSize: 'var(--text-xs)',
                            color: isCurrent ? color : 'var(--text-secondary)',
                            lineHeight: 1.5,
                            marginBottom: '4px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${color}10`,
                            border: `1px solid ${color}25`,
                          }}>
                            {/* THR-2269 — title, then what it did; the `1.23x` severity is gone (Law 13). */}
                            <div style={{ fontWeight: 600 }}>
                              {event.title}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                              {event.effectSummary || formatEffectType(event.effectType)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isCurrent && answer}
                  </div>
                );
              })}
            </div>

            {!hasCurrentStage && answer}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.7,
        }}>
          Stages 1–4 tighten the omen. Stage 5 is the climax, where the world-scale fallout lands.
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * THR-2256 — Where it feeds: at most `DOOM_FEED_LIST_MAX` rows, newest first, each a place
 * link (Law 21) and its word. A Rebuke button only while the card is held and a Rebuke
 * there answers the Doom (Law 25); the row otherwise reads the place only.
 */
function DoomFeedList({ view, color, onOpenPlace }: { view: DoomFeedingsView; color: string; onOpenPlace?: (placeId: string) => void }) {
  return (
    <div data-testid="doom-feed-list" style={{ marginTop: '8px', marginLeft: '26px' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
        {DOOM_FEED_WORDS.sectionLabel}
      </div>
      {view.rows.length === 0
        ? <div data-testid="doom-feed-empty" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{DOOM_FEED_WORDS.empty}</div>
        : view.rows.map((row) => (
          <div key={row.placeId} data-testid="doom-feed-row" data-place-id={row.placeId} data-feed-status={row.status}>
            <ListRow
              accentColor={`${color}60`}
              trailing={row.rebukable && onOpenPlace
                ? (
                  <Button variant="secondary" size="sm" data-testid="doom-feed-rebuke" onClick={() => onOpenPlace(row.placeId)} style={{ borderColor: `${color}60` }}>
                    {DOOM_FEED_WORDS.rebukeButton}
                  </Button>
                )
                : undefined}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <EntityLink id={row.placeId} name={row.placeName} entityRef={onOpenPlace ? undefined : { kind: 'location', id: row.placeId, name: row.placeName }} onOpenEntity={onOpenPlace} />
                {` · ${row.word}`}
              </span>
            </ListRow>
          </div>
        ))}
    </div>
  );
}

/**
 * THR-2269 — a stage's name row. A passed stage with cards is a disclosure button
 * (the Chronicle/Rival chevron pattern: right when shut, down when open); every other
 * row is plain.
 */
function StageNameRow({ foldable, expanded, controls, onToggle, children }: {
  foldable: boolean;
  expanded: boolean;
  controls: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const rowStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%' } as const;
  if (!foldable) return <div style={rowStyle}>{children}</div>;
  return (
    <button
      type="button"
      data-testid="doom-stage-toggle"
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      onClick={onToggle}
      style={{ ...rowStyle, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
    >
      {children}
    </button>
  );
}

/** THR-2240 — the Doom panel's Act line: what slows it, and the button while it can be held. */
function DoomStayAnswer({ line, button, onStay, color }: { line: string; button?: string; onStay?: () => void; color: string }) {
  return (
    <div
      data-testid="doom-stay-answer"
      style={{
        marginTop: '8px',
        marginLeft: '26px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.5, flex: '1 1 12rem' }}>
        {line}
      </span>
      {button && onStay && (
        <Button
          variant="secondary"
          size="sm"
          data-testid="doom-stay-button"
          onClick={onStay}
          style={{ borderColor: `${color}60`, flexShrink: 0 }}
        >
          {button}
        </Button>
      )}
    </div>
  );
}

function StatRow({ label, value, color, tooltipId }: { label: string; value: string; color?: string; tooltipId?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '12px',
      padding: '5px 0',
      borderBottom: '1px solid #1a1a1e',
      fontSize: 'var(--text-xs)',
    }}>
      <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
        {tooltipId ? <Tooltip id={tooltipId}>{label}</Tooltip> : label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)', fontVariantNumeric: 'var(--figures-tabular)',
        color: color ?? 'var(--text-secondary)',
        fontWeight: 600,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
