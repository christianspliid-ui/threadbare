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
import { useEffect, useRef, type CSSProperties } from 'react';
import type { GameState } from '../../types/gameState';
import type { SphereName } from '../../types/index';
import type { TwilightBeats } from '../../engine/twilight';
import { TWILIGHT_WORDS } from '../../data/twilight-content';
import { SPHERE_COLORS_BASE } from '../icons/constants';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { Overlay } from '../shared/Overlay';
import { EntityVisual } from '../shared/EntityVisual';
import { resolveEntityVisual } from '../shared/entityVisualResolver';
import { Icon } from '../shared/Icon';
import { ceremonyHeadingIcon } from '../../data/view-content';
import { EntityLink } from '../shared/EntityLink';
import { surfaceHomeProps } from '../shared/surfaceHomes';

/** The ceremony answers no implicit close: only its button leaves it. */
const STAY_OPEN = () => {};

/** A god with no readable sphere tints the panel gold, the ceremony's neutral. */
const NEUTRAL_TINT = 'var(--accent-gold)';

/** The tint at a fraction of its strength — works for a hex and a token alike. */
const faint = (tint: string, pct: number) => `color-mix(in srgb, ${tint} ${pct}%, transparent)`;

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
  // Focus starts on the one button (Law 25), not on the First's name: the Overlay
  // focuses its first control, and a focused name link opens its hover card over the
  // memories. A frame later, so the Overlay's own focus has already run.
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => continueRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  const { ending, first, memories } = beats;
  const sectionStyle: CSSProperties = { borderTop: `1px solid ${faint(tint, 20)}` };
  // THR-2102 (S6.3) — the ending heading draws its idea's shape: a fulfilled mandate, or the
  // doom clock (the doom-kind shapes wait on THR-1908).
  const endingIcon = ceremonyHeadingIcon(ending.kind === 'mandate' ? 'endingMandate' : 'endingDoom');
  const endingTitle = (
    <>
      {endingIcon && (
        <span data-ceremony-heading-icon={endingIcon} style={{ display: 'inline-flex' }}>
          <Icon name={endingIcon} size="list" decorative />
        </span>
      )}
      {ending.title}
    </>
  );
  // THR-2102 decision 2 — the First's face at the ceremony portrait width. The graph read is
  // today's call, moved into a descriptor so the debug read can name its tier.
  const firstFace = first
    ? resolveEntityVisual({ id: first.id, kind: 'agent', name: first.name }, gameState.graph)
    : null;

  // The First's line opens with their name; the name is a link to their sheet (Law 21).
  // A First whose body is gone (a death that removed the node) is named, not linked.
  const firstRest = first && first.present && first.line.startsWith(first.name)
    ? first.line.slice(first.name.length)
    : null;

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
        className="max-w-2xl w-full mx-4 bg-gradient-to-b to-stone-900 border rounded-panel p-8"
        style={{ borderColor: faint(tint, 33), backgroundColor: 'var(--bg-surface)' }}
        data-testid="age-twilight"
        data-ending={ending.kind}
      >
        {/* 1 — how the age ended */}
        <section className="text-center mb-6" data-testid="age-twilight-ending">
          {ending.kind === 'mandate' ? (
            <Tooltip id="ui.mandate_tracker">
              <h2 className="text-2xl font-bold tracking-wide cursor-help mb-3 inline-flex items-center justify-center gap-2" style={{ color: tint, fontFamily: 'var(--font-display)' }}>
                {endingTitle}
              </h2>
            </Tooltip>
          ) : (
            <h2 className="text-2xl font-bold tracking-wide mb-3 flex items-center justify-center gap-2" style={{ color: tint, fontFamily: 'var(--font-display)' }}>
              {endingTitle}
            </h2>
          )}
          {ending.line && <p className="text-base text-amber-100/90 leading-relaxed mb-2">{ending.line}</p>}
          <p className="text-sm text-amber-200/75 italic leading-relaxed">{ending.close}</p>
        </section>

        {/* 2 — your First (hidden when there is none: no empty heading) */}
        {first && (
          <section className="flex items-center gap-4 py-5" style={sectionStyle} data-testid="age-twilight-first" data-fate={first.fate}>
            <div
              style={{ width: 'var(--ceremony-portrait-w)', flexShrink: 0 }}
              data-ceremony-face={firstFace?.tier ?? 'none'}
              data-ceremony-face-role="first"
              data-testid="age-twilight-first-face"
            >
              {firstFace && <EntityVisual size="portrait" descriptor={firstFace} />}
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
              ref={continueRef}
              variant="primary"
              size="lg"
              // Called bare: the click event must never reach a handler that reads an argument.
              onClick={() => onContinue()}
              style={{ backgroundColor: tint, color: 'var(--bg-abyss)', fontFamily: 'var(--font-body)' }}
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
