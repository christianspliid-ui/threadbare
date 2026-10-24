/**
 * AgeTwilightScreen — "The age ends" (THR-1381, plan
 * `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md` § UI pillar).
 *
 * The run's closing ceremony, between the end of the clock and the harvest: how the
 * age ended, what became of the First, and what the World-Soul will remember, then
 * one button to the harvest. The player watches; nothing here takes input but that
 * button. Time is stopped while it is open (its `HOMED_SURFACES` entry), and the
 * beats are built once, when the Twilight opens (`useSimulation`), so this component
 * only renders them.
 *
 * Mounted by `CeremonyHost` for kind `age-twilight`, on the same Overlay home as
 * `HarvestScreen`. Escape and the backdrop do nothing: the age cannot be resumed.
 */
import type { CSSProperties } from 'react';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import type { TwilightBeats } from '../../engine/twilight';
import { TWILIGHT_WORDS } from '../../data/twilight-content';
import { SPHERE_COLORS_BASE } from '../icons/constants';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { Overlay } from '../shared/Overlay';
import { EntityVisual } from '../shared/EntityVisual';
import { EntityLink } from '../shared/EntityLink';
import { surfaceHomeProps } from '../shared/surfaceHomes';

/** The ceremony answers no implicit close: only its button leaves it. */
const STAY_OPEN = () => {};

const NEUTRAL_TINT = '#a78bfa';

interface AgeTwilightScreenProps {
  beats: TwilightBeats;
  gameState: GameState;
  /** The god's primary sphere — the panel's tint. */
  primarySphere?: SphereName;
  /**
   * False when this world's memory will not be kept (the Advanced path, dev routes, or
   * an earlier failed save) — the same paths the harvest says so, so the ceremony never
   * promises a carry the harvest then denies (Law 45).
   */
  remembered: boolean;
  /** *See what the age leaves* — `completeTwilight`, and the harvest opens. */
  onContinue: () => void;
}

function tintOf(sphere: SphereName | undefined): string {
  return (sphere && SPHERE_COLORS_BASE[sphere]) || NEUTRAL_TINT;
}

export function AgeTwilightScreen({ beats, gameState, primarySphere, remembered, onContinue }: AgeTwilightScreenProps) {
  const tint = tintOf(primarySphere);
  const { ending, first, memories } = beats;
  const sectionStyle: CSSProperties = { borderTop: `1px solid ${tint}33` };

  // The First's line opens with their name; the name is a link to their sheet (Law 21).
  const firstRest = first && first.line.startsWith(first.name) ? first.line.slice(first.name.length) : null;

  return (
    <Overlay
      open
      onClose={STAY_OPEN}
      label={TWILIGHT_WORDS.label}
      {...surfaceHomeProps('age-twilight')}
      closeOnEscape={false}
      closeOnBackdrop={false}
      animation="none"
      surfaceClassName="flex items-center justify-center"
    >
      <div
        className="max-w-2xl w-full mx-4 bg-gradient-to-b to-stone-900 border rounded-xl p-8"
        style={{ borderColor: `${tint}55`, backgroundColor: 'rgb(28 25 23 / 0.96)' }}
        data-testid="age-twilight"
        data-ending={ending.kind}
      >
        {/* 1 — how the age ended */}
        <section className="text-center mb-6" data-testid="age-twilight-ending">
          {ending.kind === 'mandate' ? (
            <Tooltip id="ui.mandate_tracker">
              <h2 className="text-2xl font-bold tracking-wide cursor-help mb-3" style={{ color: tint, fontFamily: 'var(--font-display)' }}>
                {ending.title}
              </h2>
            </Tooltip>
          ) : (
            <h2 className="text-2xl font-bold tracking-wide mb-3" style={{ color: tint, fontFamily: 'var(--font-display)' }}>
              {ending.title}
            </h2>
          )}
          {ending.line && <p className="text-base text-amber-100/90 leading-relaxed mb-2">{ending.line}</p>}
          <p className="text-sm text-amber-200/75 italic leading-relaxed">{ending.close}</p>
        </section>

        {/* 2 — your First (hidden when there is none: no empty heading) */}
        {first && (
          <section className="flex items-center gap-4 py-5" style={sectionStyle} data-testid="age-twilight-first" data-fate={first.fate}>
            <div style={{ width: 72, flexShrink: 0 }}>
              <EntityVisual size="portrait" entity={{ id: first.id, kind: 'agent', name: first.name }} graph={gameState.graph} />
            </div>
            {first.fate === 'aspect' ? (
              <Tooltip id="ui.aspect_badge">
                <p className="text-base text-amber-100/90 leading-relaxed cursor-help">
                  {firstRest !== null ? <><EntityLink id={first.id} name={first.name} entityRef={{ kind: 'agent', id: first.id }} />{firstRest}</> : first.line}
                </p>
              </Tooltip>
            ) : (
              <p className="text-base text-amber-100/90 leading-relaxed">
                {firstRest !== null ? <><EntityLink id={first.id} name={first.name} entityRef={{ kind: 'agent', id: first.id }} />{firstRest}</> : first.line}
              </p>
            )}
          </section>
        )}

        {/* 3 — what the world will remember */}
        <section className="py-5 mb-4" style={sectionStyle} data-testid="age-twilight-memories">
          <Tooltip id="ui.twilight_memory">
            <h3 className="text-sm font-bold text-amber-100/85 cursor-help" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
              {TWILIGHT_WORDS.memoryHeading}
            </h3>
          </Tooltip>
          <p className="text-xs text-amber-200/70 mb-3" data-testid="age-twilight-memory-subline">
            {remembered ? TWILIGHT_WORDS.memorySubline : TWILIGHT_WORDS.memoryUnkept}
          </p>
          <ul className="space-y-2">
            {memories.map(m => {
              const sphere = m.spheres[0];
              return (
                <li
                  key={m.id}
                  className="text-sm text-amber-100/85 leading-relaxed pl-3"
                  style={{ borderLeft: `2px solid ${tintOf(sphere)}` }}
                  data-testid="age-twilight-memory"
                  data-memory-type={m.memoryType}
                >
                  {m.memoryType === 'sphere_dominance' && sphere
                    ? <Tooltip id={`sphere.${sphere}`}><span className="cursor-help">{m.summary}</span></Tooltip>
                    : m.summary}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="text-center">
          <Tooltip id="ui.twilight_continue">
            <Button
              variant="primary"
              size="lg"
              // Called bare: the click event must never reach a handler that reads an argument.
              onClick={() => onContinue()}
              style={{ backgroundColor: tint, color: '#1c1917', fontFamily: 'var(--font-body)' }}
              data-testid="age-twilight-continue"
            >
              {TWILIGHT_WORDS.continueButton}
            </Button>
          </Tooltip>
        </div>
      </div>
    </Overlay>
  );
}
