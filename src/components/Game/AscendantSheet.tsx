/**
 * AscendantSheet — Character sheet modal for the player's god.
 *
 * Mirrors the AgentProfileModal layout so the player sees a consistent
 * "character sheet" UI whether inspecting a mortal or their own ascendant.
 *
 * All stats are shown as narrative prose, never numbers.
 * Opened from IdentityChip in the top-left corner.
 */

import { useMemo } from 'react';
import type { SphereName } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { ReachDomain } from '../../types/traits';
import { NARRATIVE_LEXICON, REACH_DOMAINS } from '../../types/traits';
import type { GameState } from '../../types/gameState';
import { Modal } from '../shared/Modal';
import { SphereIcon } from '../shared/SphereIcon';
import { SectionHeading } from '../shared/SectionHeading';
import { ProseKeyword } from '../ProseKeyword';
import { Tooltip } from '../shared/Tooltip';
import { IconButton } from '../shared/IconButton';
import { getSphereColor } from '../../data/sphereIcons';
import { getThreadsFrom } from '../../engine/graphQueries';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AscendantSheetProps {
  open: boolean;
  onClose: () => void;
  gameState: GameState;
  archetype: AscendantArchetype;
  avatarName: string;
  sphereColor: string;
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

const DIVINE_NATURE_PHRASES: Record<SphereName, { primary: string; secondary: string }> = {
  force: {
    primary: 'war, conquest, dominion, the breaking of resistance',
    secondary: 'strike, overwhelm, compel, force the unwilling hand',
  },
  matter: {
    primary: 'earth, craft, permanence, the weight of creation',
    secondary: 'building, shaping, enduring foundation, crystalline order',
  },
  energy: {
    primary: 'fire, lightning, transformation, radiant brilliance',
    secondary: 'unleashing, burning away, brilliant revelation, kinetic fury',
  },
  life: {
    primary: 'growth, fertility, healing, the bloom of nature',
    secondary: 'abundance, renewal, verdant flourishing, organic connection',
  },
  mind: {
    primary: 'thought, dreams, knowledge, the clarity of perception',
    secondary: 'insight, revelation, understanding, the architecture of reason',
  },
  spirit: {
    primary: 'souls, the veil, ancestors, passage between worlds',
    secondary: 'communion, the ephemeral, ascending consciousness, sacred connection',
  },
  time: {
    primary: 'memory, patience, fate, the cycles of becoming',
    secondary: 'echoes, the weight of history, temporal inevitability, patient turning',
  },
  entropy: {
    primary: 'decay, endings, dissolution, the unmaking of all things',
    secondary: 'change, return to chaos, inevitable dissolution, liberating release',
  },
  chaos: {
    primary: 'storms, freedom, disruption, the wild untaming',
    secondary: 'spontaneity, breaking bonds, turbulent freedom, beautiful destruction',
  },
  order: {
    primary: 'law, structure, hierarchy, absolute governance',
    secondary: 'precision, arrangement, hierarchical necessity, governing principle',
  },
  light: {
    primary: 'truth, revelation, clarity, exposure of all things',
    secondary: 'visibility, unveiling, piercing illumination, burning away shadows',
  },
  darkness: {
    primary: 'secrets, shadows, concealment, hidden depths',
    secondary: 'mystery, protection in obscurity, unknowable interiority, safe shadows',
  },
};

const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil', heart: 'Heart',
  eye: 'Eye', stone: 'Stone', star: 'Star', flesh: 'Flesh',
};

function essenceToProseDescriptor(amount: number): string {
  if (amount < 1) return 'Barren';
  if (amount < 11) return 'A whisper';
  if (amount < 31) return 'A murmur';
  if (amount < 61) return 'A current';
  if (amount < 101) return 'A torrent';
  if (amount < 201) return 'A flood';
  return 'An ocean';
}

function threadsToProseDescriptor(threadCount: number): string {
  if (threadCount === 0) return 'No mortal yet knows your name.';
  if (threadCount <= 2) return 'A precious few have heard your whisper.';
  if (threadCount <= 5) return 'A small gathering turns their eyes skyward.';
  if (threadCount <= 10) return 'Your faithful grow in number.';
  if (threadCount <= 20) return 'A congregation forms in your name.';
  return 'Multitudes cry out to you.';
}

function domainLevelToWord(reach: ReachDomain, level: number | undefined): string {
  const idx = Math.max(0, Math.min(9, Math.floor(level ?? 0)));
  return NARRATIVE_LEXICON[reach][idx] ?? NARRATIVE_LEXICON[reach][0];
}

const ORDINAL_WORDS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
];

function cycleToOrdinal(cycle: number): string {
  if (cycle <= 0) return 'First Cycle';
  if (cycle <= 10) return `${ORDINAL_WORDS[cycle - 1]} Cycle`;
  return `Cycle ${cycle}`;
}

function tickToNarrativeAge(tick: number): string {
  if (tick < 10) return 'The world is newly born.';
  if (tick < 30) return 'The first age stirs.';
  if (tick < 60) return 'Mortal memory begins to take root.';
  if (tick < 120) return 'Generations have passed beneath your gaze.';
  if (tick < 200) return 'Empires have risen and crumbled.';
  return 'The ages blur into legend.';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AscendantSheet({
  open,
  onClose,
  gameState,
  archetype,
  avatarName,
  sphereColor,
}: AscendantSheetProps) {
  const primarySphere = archetype.sphereAlignment.primary;
  const secondarySphere = archetype.sphereAlignment.secondary;
  const secondaryColor = getSphereColor(secondarySphere);

  // Essence pool sorted: primary → secondary → by amount desc; skip zeros
  const sortedEssence = useMemo(() => {
    return Object.entries(gameState.essencePool)
      .filter(([, amount]) => amount > 0)
      .sort(([a], [b]) => {
        if (a === primarySphere) return -1;
        if (b === primarySphere) return 1;
        if (a === secondarySphere) return -1;
        if (b === secondarySphere) return 1;
        return gameState.essencePool[b as SphereName] - gameState.essencePool[a as SphereName];
      });
  }, [gameState.essencePool, primarySphere, secondarySphere]);

  // Thread edges
  const threadEdges = useMemo(
    () => getThreadsFrom(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId],
  );
  const courtFilled = useMemo(
    () => threadEdges.filter(e => (e.properties as any)?.courtPosition).length,
    [threadEdges],
  );

  const naturePhrase = DIVINE_NATURE_PHRASES[primarySphere] ?? DIVINE_NATURE_PHRASES.force;

  return (
    <Modal open={open} onClose={onClose} maxWidth={960} aria-label="Ascendant character sheet">
      {/* ── Header Zone (mirrors AgentProfileModal) ─────────────────── */}
      <div className="border-b p-6 pb-4 relative" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="absolute top-4 right-4">
          <IconButton
            icon={<span>✕</span>}
            variant="close"
            size="sm"
            aria-label="Close ascendant sheet"
            onClick={onClose}
          />
        </div>

        <div className="flex gap-4 mb-3">
          {/* Sphere sigil — occupies the portrait slot */}
          <div
            className="rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              width: '120px',
              minWidth: '120px',
              height: '160px',
              background: `linear-gradient(135deg, ${sphereColor}30 0%, rgba(30,27,46,0.8) 100%)`,
            }}
          >
            <SphereIcon sphereName={primarySphere} size="3rem" />
          </div>

          {/* Header text */}
          <div className="flex-1">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {avatarName}
            </h1>

            {/* Archetype title badge (like knowledge-level badge on agents) */}
            <p className="text-sm italic mb-2" style={{ color: 'var(--accent-gold)' }}>
              {archetype.title}
            </p>

            {/* Metadata */}
            <div className="space-y-1">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {cycleToOrdinal(gameState.cycle)} — {tickToNarrativeAge(gameState.tick)}
              </p>
            </div>
          </div>
        </div>

        {/* Sphere alignment (like "Attuned to" on agents) */}
        <div className="flex gap-4 items-center pt-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs" style={{ color: 'var(--accent-gold)' }}>Primary</span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sphereColor }} />
            <Tooltip id={`sphere.${primarySphere}`}>
              <span className="text-xs capitalize underline decoration-dotted cursor-help" style={{ color: 'var(--text-secondary)' }}>
                {primarySphere}
              </span>
            </Tooltip>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs" style={{ color: 'var(--accent-gold)' }}>Secondary</span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
            <Tooltip id={`sphere.${secondarySphere}`}>
              <span className="text-xs capitalize underline decoration-dotted cursor-help" style={{ color: 'var(--text-secondary)' }}>
                {secondarySphere}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── Body (scrollable, mirrors agent tabs area) ──────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">

          {/* Divine Nature — like agent Overview > Identity */}
          <section className="anim-fade-up-enter" style={{ animationDelay: '0ms' }}>
            <SectionHeading as="h2">Divine Nature</SectionHeading>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You are a god of{' '}
              <ProseKeyword sphere={primarySphere}>{capitalize(primarySphere)}</ProseKeyword>
              , your power shaped by currents of{' '}
              <ProseKeyword sphere={secondarySphere}>{capitalize(secondarySphere)}</ProseKeyword>
              . Where others see {naturePhrase.primary}, you see {naturePhrase.secondary}.
            </p>
          </section>

          {/* Dominion — matches ProwessTab domain grid exactly */}
          <section className="anim-fade-up-enter" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
            <SectionHeading as="h2">Dominion</SectionHeading>
            <div className="grid grid-cols-3 gap-2">
              {REACH_DOMAINS.map((reach) => {
                const level = archetype.startingDomainAffinities[reach] ?? 0;
                const word = domainLevelToWord(reach, level);
                return (
                  <div
                    key={reach}
                    className="p-2 rounded text-center"
                    style={{ backgroundColor: 'var(--bg-raised)' }}
                  >
                    <Tooltip id={`reach.${reach}`}>
                      <p className="text-xs font-medium underline decoration-dotted cursor-help" style={{ color: 'var(--accent-gold)' }}>
                        {DOMAIN_NAMES[reach]}
                      </p>
                    </Tooltip>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {word}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Essence — prose descriptors, no numbers */}
          {sortedEssence.length > 0 && (
            <section className="anim-fade-up-enter" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              <SectionHeading as="h2">Essence</SectionHeading>
              <ul className="space-y-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {sortedEssence.map(([sphere]) => {
                  const sphereName = sphere as SphereName;
                  const amount = gameState.essencePool[sphereName];
                  const descriptor = essenceToProseDescriptor(amount);
                  const color = getSphereColor(sphereName);
                  const isPrimary = sphereName === primarySphere;
                  const isSecondary = sphereName === secondarySphere;

                  return (
                    <li
                      key={sphere}
                      className="flex items-center gap-2 py-1 rounded"
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: isPrimary ? 1 : isSecondary ? 0.9 : 0.7,
                        background: `linear-gradient(90deg, ${color}12 0%, transparent 60%)`,
                        paddingLeft: '0.5rem',
                        paddingRight: '0.5rem',
                      }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <ProseKeyword sphere={sphereName}>{capitalize(sphereName)}</ProseKeyword>
                      <span
                        className="text-sm italic ml-auto"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {descriptor}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Divine Threads — like agent Bonds section */}
          <section className="anim-fade-up-enter" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <SectionHeading as="h2">Divine Threads</SectionHeading>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {threadsToProseDescriptor(threadEdges.length)}
            </p>
            {courtFilled > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {courtFilled === 1
                  ? 'The First holds your court.'
                  : `${courtFilled} divine positions remain filled in your court.`}
              </p>
            )}
          </section>

        </div>
      </div>
    </Modal>
  );
}
