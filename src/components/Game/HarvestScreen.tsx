import type { HarvestResult, HarvestEchoCandidate } from '../../engine/cycleEnd';
import type { HarvestType } from '../../types/worldSoul';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';
import { countWord, magnitudeWord, type MagnitudeBand } from '../../engine/aftermathWords';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { Overlay } from '../shared/Overlay';
import { surfaceHomeProps } from '../shared/surfaceHomes';
import { EntityVisual } from '../shared/EntityVisual';
import { Icon } from '../shared/Icon';
import { ACCOUNT_WORDS, echoDisplayName } from '../../data/account-content';
import { ceremonyHeadingIcon, HARVEST_ECHO_TILE_W } from '../../data/view-content';
import { sphereWord } from '../../data/essence-format';
import { SPHERE_COLORS_BASE } from '../icons/constants';

/** The ceremony answers no implicit close: only "Wake in a new world" leaves it. */
const STAY_OPEN = () => {};

interface HarvestScreenProps {
  harvest: HarvestResult;
  cycle: number;
  /** THR-1813 — this world ends and a new one wakes (Christian, THR-1773). */
  onWakeNewWorld: () => void;
  /** THR-1813 — whether the run's record was kept; `false` shows the save-failure line. */
  accountSaved?: boolean | null;
  /**
   * THR-1813 — false when this run is not carried into the next world (the Advanced
   * path builds its world without the account): the screen then names no echoes it
   * would promise, and says the next world will not remember this one.
   */
  accountCarried?: boolean;
  /**
   * THR-2102 (S6.1) — the god's face, built by `CeremonyHost` (the screen never reads the
   * graph for its pictures). Absent → no face, as before.
   */
  godFace?: EntityVisualDescriptor | null;
  /** THR-2102 decision 3 — each preserved echo's picture, by echo id. */
  echoVisuals?: Readonly<Record<string, EntityVisualDescriptor>>;
  /** THR-2102 decision 3 — each of the god's own echoes' picture, by echo id. */
  leaveVisuals?: Readonly<Record<string, EntityVisualDescriptor>>;
}

/**
 * Echo significance is a 0–1 score; the player reads a banded word, the raw
 * value stays on the trace (Law 13 — no percentages player-facing, THR-1357).
 */
const ECHO_SIGNIFICANCE_BANDS: readonly MagnitudeBand[] = [
  { min: 0.75, word: 'defining' },
  { min: 0.5, word: 'resonant' },
  { min: 0.25, word: 'notable' },
  { min: 0, word: 'faint' },
];

const HARVEST_STYLES: Record<HarvestType, { title: string; color: string; bg: string }> = {
  triumphant: { title: 'A Triumphant Age', color: '#eab308', bg: 'from-yellow-900/30' },
  bittersweet: { title: 'A Bittersweet Age', color: '#a78bfa', bg: 'from-purple-900/30' },
  somber: { title: 'A Somber Age', color: '#6b7280', bg: 'from-gray-900/30' },
};

/** THR-2102 — a picture's tier for the debug read: art, the designed tile, or nothing drawn. */
const tierOf = (v: EntityVisualDescriptor | null | undefined): 'art' | 'fallback' | 'none' => v?.tier ?? 'none';

function EchoCard({ candidate, visual }: { candidate: HarvestEchoCandidate; visual?: EntityVisualDescriptor }) {
  const def = candidate.echoDefinition;
  // THR-2102 decision 4 — one name per echo, the one the line under the cards uses (PC-6).
  const name = echoDisplayName(def);
  return (
    <div
      className="bg-stone-800/60 border border-amber-700/20 rounded-lg overflow-hidden flex-shrink-0"
      style={{ width: HARVEST_ECHO_TILE_W }}
      data-testid="harvest-echo-card"
      data-echo-art={tierOf(visual)}
    >
      {/* Decision 3 — the card opens on what the echo is of (R1, R3). */}
      {visual && <EntityVisual size="hero" descriptor={{ ...visual, alt: name }} style={{ borderRadius: 0, border: 'none' }} />}
      <div className="p-3">
        <span className="block text-xs font-bold text-amber-100/90 truncate mb-1" data-testid="harvest-echo-name">{name}</span>
        <p className="text-xs text-amber-200/70 leading-relaxed mb-2">{def.summary}</p>
        <div className="flex flex-wrap gap-1">
          {/* Decision 4 — the sphere's word and tint, with its tooltip (Law 14). */}
          {def.sphereAffinities.map(s => (
            <Tooltip key={s} id={`sphere.${s}`}>
              <span
                className="text-xs px-1.5 py-0.5 bg-stone-600/50 rounded text-amber-200/80 cursor-help"
                style={{ borderLeft: `2px solid ${SPHERE_COLORS_BASE[s] ?? 'var(--accent-gold)'}` }}
                data-testid="harvest-echo-sphere"
              >
                {sphereWord(s)}
              </span>
            </Tooltip>
          ))}
        </div>
        <div className="mt-1 text-xs text-amber-200/60 italic">
          A {magnitudeWord(candidate.score, ECHO_SIGNIFICANCE_BANDS)} echo of the age
        </div>
      </div>
    </div>
  );
}

export function HarvestScreen({
  harvest,
  cycle,
  onWakeNewWorld,
  accountSaved = null,
  accountCarried = true,
  godFace = null,
  echoVisuals,
  leaveVisuals,
}: HarvestScreenProps) {
  const style = HARVEST_STYLES[harvest.harvestType];
  // THR-1813 — the god's own echoes, named the one way every surface names them (PC-6).
  const divineEchoes = harvest.divineEchoes ?? [];
  const leaves = divineEchoes.map(echoDisplayName);
  const titleIcon = ceremonyHeadingIcon('harvestTitle');
  // THR-2102 decision 3 — one small picture per echo the line names, in the line's order.
  const leaveChips = divineEchoes.flatMap(def => {
    const visual = leaveVisuals?.[def.id];
    return visual ? [{ def, visual }] : [];
  });
  // Whether the next world will remember this one: not on the Advanced path, and not
  // after a failed save (that wake carries an empty record). An age the next world will
  // not remember names no echo as preserved or left behind (review-gate cycle 4).
  const remembered = accountCarried && accountSaved !== false;

  // The end-of-cycle harvest is a full-screen ceremony, not a dialog (Christian,
  // chat 2026-10-14; THR-1884): it mounts on the ceremony home, and Escape and
  // the backdrop do nothing, as before.
  return (
    <Overlay
      open
      onClose={STAY_OPEN}
      label="Cycle harvest"
      {...surfaceHomeProps('cycle-harvest')}
      closeOnEscape={false}
      closeOnBackdrop={false}
      animation="none"
      surfaceClassName="flex items-center justify-center"
    >
      <div
        className={`w-full mx-4 bg-gradient-to-b ${style.bg} to-stone-900 border border-amber-900/30 rounded-xl p-8`}
        style={{ maxWidth: 'var(--ceremony-panel-max-w)' }}
        data-testid="cycle-harvest"
      >
        <div className="text-center mb-6">
          {/* THR-2102 decision 1 — the age was the god's: the harvest opens on its face (R1). */}
          {godFace && (
            <div
              className="mx-auto mb-3"
              style={{ width: 'var(--ceremony-medallion-w)' }}
              data-ceremony-face={tierOf(godFace)}
              data-ceremony-face-role="god"
              data-testid="harvest-god-face"
            >
              <EntityVisual size="portrait" shape="circle" descriptor={godFace} style={{ aspectRatio: '1 / 1' }} />
            </div>
          )}
          <Tooltip id="ui.harvest_cycle">
            <p className="text-xs text-amber-200/70 mb-1 cursor-help">
              Cycle {cycle} complete
            </p>
          </Tooltip>
          <Tooltip id="ui.harvest_type">
            <h2
              className="text-2xl font-bold tracking-wide cursor-help inline-flex items-center justify-center gap-2"
              style={{ color: style.color, fontFamily: 'var(--font-display)' }}
            >
              {titleIcon && (
                <span data-ceremony-heading-icon={titleIcon} style={{ display: 'inline-flex' }}>
                  <Icon name={titleIcon} size="list" decorative />
                </span>
              )}
              {style.title}
            </h2>
          </Tooltip>
        </div>

        <p className="text-sm text-amber-200/80 text-center italic mb-6 leading-relaxed">
          {harvest.chronicleSummary}
        </p>

        {remembered && harvest.cosmicEchoCandidates.length > 0 && (
          <div className="mb-6">
            <Tooltip id="ui.harvest_echo">
              <h3 className="text-xs font-bold text-amber-100/80 mb-3 cursor-help" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
                Echoes preserved — {countWord(harvest.cosmicEchoCandidates.length)} cosmic
              </h3>
            </Tooltip>
            {/* Law 57: the echo row wraps instead of scrolling sideways, so every
                echo is visible at once (THR-1884). */}
            <div className="flex flex-wrap justify-center gap-3 pb-2">
              {harvest.cosmicEchoCandidates.map(c => (
                <EchoCard key={c.echoDefinition.id} candidate={c} visual={echoVisuals?.[c.echoDefinition.id]} />
              ))}
            </div>
          </div>
        )}

        {remembered && leaveChips.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-2" data-testid="harvest-leave-chips">
            {leaveChips.map(({ def, visual }) => (
              <EntityVisual
                key={def.id}
                size="chip"
                descriptor={{ ...visual, alt: echoDisplayName(def) }}
                title={echoDisplayName(def)}
                data-testid="harvest-leave-chip"
              />
            ))}
          </div>
        )}

        {remembered ? (
          <Tooltip id="ui.harvest_leaves">
            <p className="text-sm text-amber-100/85 text-center mb-6 cursor-help" data-testid="harvest-leaves" data-leave-count={leaves.length}>
              {leaves.length > 0 ? ACCOUNT_WORDS.harvestLeavesBehind(leaves) : ACCOUNT_WORDS.harvestLeavesLittle}
            </p>
          </Tooltip>
        ) : !accountCarried ? (
          <p className="text-sm text-amber-100/85 text-center mb-6" role="status" data-testid="harvest-not-carried">
            {ACCOUNT_WORDS.harvestNotCarried}
          </p>
        ) : null}

        <div className="text-center">
          <Tooltip id={remembered ? 'ui.harvest_wake' : 'ui.harvest_wake_unremembered'}>
          <Button
            variant="primary"
            size="lg"
            onClick={onWakeNewWorld}
            style={{
              backgroundColor: style.color,
              color: '#1c1917',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              boxShadow: `0 0 20px ${style.color}40`,
            }}
          >
            {ACCOUNT_WORDS.harvestWakeButton}
          </Button>
          </Tooltip>
          {accountSaved === false && (
            <p className="text-xs text-amber-200/70 mt-3" role="status" data-testid="harvest-save-failed">
              {ACCOUNT_WORDS.harvestSaveFailed}
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
}
