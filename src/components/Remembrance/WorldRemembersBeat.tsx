/**
 * THR-1844 — *The world remembers*: the first Remembrance step from run 2 on.
 *
 * Plan: `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § UI pillar. Three
 * sections, per the THR-1773 mock: what still stands (one sphere-tinted card per live
 * map echo), gods who may wake (the twelve hunger chips and the choice between the two
 * that stir), and the powers that may now rise (the cards the last run unsealed). A
 * first run never sees it. No number on the step (Law 13): memory and the tilt are words.
 * THR-1971 adds *What the World-Soul remembers* under what still stands: the carried
 * age memories' summaries, shown only when the record holds a live one.
 */
import { useMemo, useState } from 'react';
import type { AccountRecord } from '../../types/account';
import type { EchoDefinition, EchoState } from '../../types/echo';
import type { SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { WORLD_REMEMBERS_WORDS as W, echoDisplayName, joinNames, memoryWord } from '../../data/account-content';
import { awakeHungers, liveEchoes, shownWorldSoulMemories, worldTiltFactors } from '../../engine/accountRecord';
import { SPHERE_OPPOSITIONS } from '../../engine/cosmology';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { sphereBrightToken, sphereTint } from '../shared/sphereTint';
import { ActionCard } from '../Game/ActionCard';
import { templateToPreviewSlot } from '../Game/AscendantBeatModal';

type MapEchoKind = 'monument' | 'legacy' | 'relic';

interface WorldRemembersBeatProps {
  account: AccountRecord;
  /** The hunger the player woke (one of the two that stir), or `null` when none stirred. */
  onContinue: (wokenHungerId: string | null) => void;
}

/** Spheres whose tilt factor reads above even by more than this lean the world (a word, never a number). */
const TILT_WORD_THRESHOLD = 0.01;
/** Most spheres the tilt line names. */
const TILT_MAX_SPHERES = 2;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sphereWords = (spheres: readonly SphereName[]) => joinNames(spheres.map(cap));

function isMapEcho(def: EchoDefinition): def is EchoDefinition & { echoType: MapEchoKind } {
  return def.echoType === 'monument' || def.echoType === 'legacy' || def.echoType === 'relic';
}

/** The spheres this world leans toward, strongest first; empty when it sits even. */
function tiltSpheres(account: AccountRecord): SphereName[] {
  const factors = worldTiltFactors(account.fundament);
  return SPHERE_NAMES
    .filter(s => factors[s] - 1 > TILT_WORD_THRESHOLD)
    .sort((a, b) => factors[b] - factors[a])
    .slice(0, TILT_MAX_SPHERES);
}

function EchoCard({ def, state }: { def: EchoDefinition & { echoType: MapEchoKind }; state: EchoState }) {
  const primary = def.sphereAffinities[0];
  const tint = primary ? sphereBrightToken(primary) : 'var(--border-medium)';
  const word = memoryWord(state.degradation);
  const spheres = def.sphereAffinities.slice(0, 2);
  return (
    <div
      data-testid={`world-remembers-echo-${def.id}`}
      data-echo-kind={def.echoType}
      {...(primary ? { 'data-sphere-tint': primary } : {})}
      style={{
        border: `1px solid ${primary ? sphereTint(tint, 'border') : tint}`,
        background: primary ? sphereTint(tint, 'bg') : 'var(--bg-surface)',
        borderRadius: 'var(--radius-panel)',
        padding: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        minWidth: 0,
      }}
    >
      {/* "Monument · Life and Spirit" on one line: the kind and each sphere carry their own tooltip. */}
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <Tooltip id={`ui.echo.${def.echoType}`}>
          <span className="cursor-help" style={{ fontWeight: 700 }}>{W.kindLabel[def.echoType]}</span>
        </Tooltip>
        {spheres.length > 0 ? ' · ' : ''}
        {spheres.map((s, i) => (
          <span key={s}>
            {i > 0 ? ' and ' : ''}
            <Tooltip id={`sphere.${s}`}><span className="cursor-help" style={{ color: sphereBrightToken(s) }}>{cap(s)}</span></Tooltip>
          </span>
        ))}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
        {cap(echoDisplayName(def))}
      </span>
      <span style={{ fontFamily: 'var(--font-prose)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {W.story[def.echoType]}
        {def.echoType === 'monument' && spheres.length > 0 && (
          <>
            {' '}{W.monumentKin(sphereWords(spheres))}
            {' '}{W.monumentAgainst(cap(SPHERE_OPPOSITIONS[spheres[0]]))}
          </>
        )}
      </span>
      {word && (
        <Tooltip id="ui.memory">
          <span className="cursor-help" data-testid="world-remembers-memory" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {W.memoryLabel(word)}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

export function WorldRemembersBeat({ account, onContinue }: WorldRemembersBeatProps) {
  const echoes = useMemo(
    () => liveEchoes(account).filter((e): e is { def: EchoDefinition & { echoType: MapEchoKind }; state: EchoState } => isMapEcho(e.def)),
    [account],
  );
  const awake = useMemo(() => new Set<string>(awakeHungers(account).map(h => h.id)), [account]);
  // A stirring id the catalog no longer has is dropped (fail-soft row).
  const stirring = useMemo(
    () => account.stirringHungerIds.filter(id => HUNGER_CATALOG.some(h => h.id === id) && !awake.has(id)),
    [account, awake],
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const tilt = useMemo(() => tiltSpheres(account), [account]);
  const memories = useMemo(() => shownWorldSoulMemories(account), [account]);
  const unsealed = useMemo(
    () => (account.lastRun?.unsealedCardIds ?? []).map(id => getUnifiedTemplateById(id)).filter(t => !!t),
    [account],
  );
  // The god sphere the unsealed cards lean to (the draw weights the primary ×3, the
  // secondary ×2), so the line names the sphere the cards on screen actually carry.
  const powersSphere = useMemo((): SphereName | undefined => {
    const last = account.lastRun;
    if (!last) return undefined;
    const count = (s: SphereName) => unsealed.filter(t => (t.progression?.pricedIn ?? t.sphereAffinity) === s).length;
    return count(last.secondary) > count(last.primary) ? last.secondary : last.primary;
  }, [account, unsealed]);

  const needsChoice = stirring.length > 0;
  const canGoOn = !needsChoice || chosen !== null;
  const nameOf = (id: string) => HUNGER_CATALOG.find(h => h.id === id)?.name ?? id;

  const chipState = (id: string): 'awake' | 'stirs' | 'asleep' => {
    if (awake.has(id) || id === chosen) return 'awake';
    if (stirring.includes(id) && chosen === null) return 'stirs';
    return 'asleep';
  };

  const heading: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    color: 'var(--accent-gold)',
    letterSpacing: '0.04em',
    margin: 0,
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      data-testid="world-remembers"
      style={{ background: 'var(--bg-abyss)', color: 'var(--text-primary)', padding: 'var(--space-6) 5vw' }}
    >
      <header style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--accent-gold)', margin: 0 }}>{W.heading}</h1>
        <p style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>{W.lead}</p>
        {tilt.length > 0 && (
          <Tooltip id="ui.world_tilt">
            <p className="cursor-help" data-testid="world-remembers-tilt" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>
              {W.tiltLine(sphereWords(tilt))}
            </p>
          </Tooltip>
        )}
      </header>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 'var(--space-6)' }}>
        <section data-testid="world-remembers-stands" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={heading}>{W.standsHeading}</h2>
          {echoes.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-prose)', color: 'var(--text-secondary)' }}>{W.standsEmpty}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', alignContent: 'start' }}>
              {echoes.map(e => <EchoCard key={e.def.id} def={e.def} state={e.state} />)}
            </div>
          )}
          {memories.length > 0 && (
            <section data-testid="world-remembers-soul" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <h2 style={heading}>{W.soulHeading}</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {memories.map(({ memory, word }) => (
                  <li
                    key={memory.id}
                    data-testid={`world-remembers-soul-${memory.id}`}
                    {...(memory.spheres[0] ? { 'data-sphere-tint': memory.spheres[0] } : {})}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--space-2)',
                      paddingLeft: 'var(--space-2)',
                      borderLeft: `2px solid ${memory.spheres[0] ? sphereBrightToken(memory.spheres[0]) : 'var(--border-medium)'}`,
                    }}
                  >
                    <span data-testid="world-remembers-soul-summary" style={{ fontFamily: 'var(--font-prose)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {memory.summary}
                    </span>
                    <Tooltip id="ui.memory">
                      <span className="cursor-help" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                        {W.memoryLabel(word)}
                      </span>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <section data-testid="world-remembers-hungers" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h2 style={heading}>{W.hungersHeading}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {HUNGER_CATALOG.map(h => {
                const s = chipState(h.id);
                return (
                  <Tooltip key={h.id} id={`ui.hunger.${s}`}>
                    <span
                      className="cursor-help"
                      data-testid={`world-remembers-hunger-${h.id}`}
                      data-hunger-state={s}
                      style={{
                        display: 'inline-flex',
                        gap: 'var(--space-1)',
                        padding: '2px var(--space-2)',
                        borderRadius: 'var(--radius-chip)',
                        border: `1px solid ${s === 'awake' ? 'var(--accent-gold)' : s === 'stirs' ? 'var(--text-secondary)' : 'var(--border-subtle)'}`,
                        color: s === 'asleep' ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {h.name}
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{W.chip[s]}</span>
                    </span>
                  </Tooltip>
                );
              })}
            </div>
            {needsChoice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <p style={{ fontFamily: 'var(--font-prose)', color: 'var(--text-secondary)', margin: 0 }}>{W.stirPrompt}</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{W.favoured(nameOf(stirring[0]))}</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {stirring.map(id => (
                    <Button
                      key={id}
                      variant={chosen === id ? 'primary' : 'secondary'}
                      size="sm"
                      aria-pressed={chosen === id}
                      data-testid={`world-remembers-wake-${id}`}
                      onClick={() => setChosen(id)}
                    >
                      {W.wakeButton(nameOf(id))}
                    </Button>
                  ))}
                </div>
                {chosen && (
                  <p role="status" data-testid="world-remembers-woken" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-gold)', margin: 0 }}>
                    {W.woken(nameOf(chosen))}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                {awake.size >= HUNGER_CATALOG.length ? W.allAwake : W.noneStirs}
              </p>
            )}
          </section>

          {unsealed.length > 0 && (
            <section data-testid="world-remembers-powers" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Tooltip id="ui.powers_unsealed">
                <h2 className="cursor-help" style={heading}>{W.powersHeading}</h2>
              </Tooltip>
              {powersSphere && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{W.powersLine(cap(powersSphere))}</p>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {unsealed.map(t => (
                  <div key={t.id} data-testid={`world-remembers-power-${t.id}`}>
                    <ActionCard slot={templateToPreviewSlot(t)} interactive={false} onClick={() => undefined} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <p style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>{W.closing}</p>
        <Button
          variant="primary"
          size="lg"
          data-testid="world-remembers-go-on"
          disabled={!canGoOn}
          title={canGoOn ? undefined : W.goOnBlocked}
          onClick={() => { if (canGoOn) onContinue(chosen); }}
        >
          {W.goOn}
        </Button>
        {!canGoOn && (
          <span data-testid="world-remembers-go-on-reason" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{W.goOnBlocked}</span>
        )}
      </footer>
    </div>
  );
}
