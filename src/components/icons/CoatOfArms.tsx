import { memo, useMemo } from 'react';
import type { FactionDefinition } from '../../types/faction';
import type { ReachDomain } from '../../types/traits';
import type { CreationSphereName, FoundationSphereName } from '../../types/index';
import {
  SPHERE_COLORS,
  REACH_TO_SPHERE,
  SPHERE_TO_FOUNDATION,
  DIVISION_BY_FACTION_TYPE,
  SMALL_SIZE_THRESHOLD,
} from './constants';
import type { ProminenceLevel } from './constants';
import { deriveTinctures } from './heraldry/tinctures';
import { renderShieldBase, renderShieldOutline, SHIELD_VIEWBOX } from './heraldry/shields';
import { renderDivision } from './heraldry/divisions';
import { renderCharge } from './heraldry/charges';
import { renderBorder } from './heraldry/borders';

// ─── Config Type ──────────────────────────────────────────────────────────────

export interface CoatOfArmsConfig {
  factionType: FactionDefinition['factionType'];
  dominantReach: ReachDomain | null;
  secondaryReach?: ReachDomain;
  /**
   * Whether the second domain rivals the first (within
   * `SECONDARY_REACH_THRESHOLD`). Governs how boldly the secondary charge is
   * drawn, not whether it appears — see THR-854 below.
   *
   * Optional, and `undefined` reads as "close", so a hand-built config that
   * sets `secondaryReach` alone renders exactly as it did before THR-854.
   */
  secondaryIsClose?: boolean;
  /**
   * Third-ranked reach, carried on the bordure. Undefined for a faction with
   * fewer than three reaches, in which case the border keeps the dominant
   * charge's colour.
   */
  tertiaryReach?: ReachDomain;
  dominantSphere: CreationSphereName | null;
  foundationSphere: FoundationSphereName | null;
  prominenceLevel: ProminenceLevel;
  fallbackGlyph?: string;
  fallbackColor?: string;
}

// ─── Config Builder ───────────────────────────────────────────────────────────

/**
 * Threshold within which a secondary reach is considered "close enough" to
 * rival the dominant one.
 *
 * THR-854: this used to decide whether the second domain appeared on the shield
 * at all. It now decides only how *boldly* it is drawn. The distinction it
 * encodes — single-minded faction vs dual-natured one — is real and worth
 * keeping; silently dropping a faction's second domain was not, because it
 * collapsed the shield's whole statement to `(dominant, factionType)` and made
 * byte-identical heraldry inevitable for any two factions agreeing on those.
 */
const SECONDARY_REACH_THRESHOLD = 0.2;

/**
 * Build a config from a raw reach-weight map rather than a `FactionDefinition`.
 *
 * Most factions in a live world are **not** definition-backed: a seeded world
 * carries ~49 faction actors of which only ~13 have a `factionDefId`; the rest
 * are procedurally generated (`guild_N`, `faction_N`) and carry their reach
 * profile as `domainCapabilities` instead (THR-638). That map has the same
 * `reach → number` shape as `reachWeights`, so the same heraldry derives from
 * it — which is what lets a generated guild get a real sigil rather than a
 * blank tile.
 */
export function buildCoatOfArmsConfigFromWeights(
  weights: Record<string, number>,
  factionType: FactionDefinition['factionType'],
  fallbackGlyph?: string,
  fallbackColor?: string,
  prominenceLevel: ProminenceLevel = 'base',
): CoatOfArmsConfig {
  // Filter to valid ReachDomain keys only — some definitions (e.g. monster factions)
  // may include sphere names like 'force' in reachWeights which aren't valid reaches
  const validReaches = new Set<string>(Object.keys(REACH_TO_SPHERE));
  const entries = (Object.entries(weights ?? {}) as [string, number][])
    .filter(([key, value]) => validReaches.has(key) && Number.isFinite(value)) as [
    ReachDomain,
    number,
  ][];

  if (entries.length === 0) {
    return {
      factionType,
      dominantReach: null,
      dominantSphere: null,
      foundationSphere: null,
      prominenceLevel,
      fallbackGlyph,
      fallbackColor,
    };
  }

  // Sort descending by weight. Equal weights keep their declaration order —
  // deterministic (JS preserves string-key insertion order), but it does mean
  // reordering the keys of a definition's `reachWeights` can reorder its ranks
  // and therefore change its shield. The distinctness test over
  // `ALL_FACTION_DEFINITIONS` is what catches that if it ever happens.
  entries.sort((a, b) => b[1] - a[1]);
  const [dominantReach, dominantWeight] = entries[0];
  const dominantSphere = REACH_TO_SPHERE[dominantReach];
  const foundationSphere = SPHERE_TO_FOUNDATION[dominantSphere];

  // Rank 2 — always carried, boldly when it rivals rank 1 (THR-854).
  let secondaryReach: ReachDomain | undefined;
  let secondaryIsClose = false;
  if (entries.length >= 2) {
    const [secondReach, secondWeight] = entries[1];
    secondaryReach = secondReach;
    // Fail-soft (NFP #4): an all-zero profile would make relDiff NaN, and
    // `NaN <= x` is false — which would silently read as "distant" rather than
    // as the degenerate case it is. Treat equal weights as rivalling.
    const relDiff = dominantWeight === 0 ? 0 : (dominantWeight - secondWeight) / dominantWeight;
    secondaryIsClose = relDiff <= SECONDARY_REACH_THRESHOLD;
  }

  // Rank 3 — the bordure (THR-854).
  const tertiaryReach: ReachDomain | undefined =
    entries.length >= 3 ? entries[2][0] : undefined;

  return {
    factionType,
    dominantReach,
    secondaryReach,
    secondaryIsClose,
    tertiaryReach,
    dominantSphere,
    foundationSphere,
    prominenceLevel,
    fallbackGlyph,
    fallbackColor,
  };
}

/** Build a config from a full `FactionDefinition`. */
export function buildCoatOfArmsConfig(
  def: FactionDefinition,
  fallbackGlyph?: string,
  prominenceLevel: ProminenceLevel = 'base',
): CoatOfArmsConfig {
  return buildCoatOfArmsConfigFromWeights(
    def.reachWeights as Record<string, number>,
    def.factionType,
    fallbackGlyph ?? def.iconGlyph,
    def.themeColor,
    prominenceLevel,
  );
}

// ─── SVG Generator ────────────────────────────────────────────────────────────

/**
 * Secondary-charge weights (NFP #1 — the whole "how subordinate does a second
 * domain look" question is these three numbers).
 *
 * `CLOSE` is the pre-THR-854 value, so a faction whose second domain rivals its
 * first is drawn exactly as before.
 */
const SECONDARY_CHARGE_SCALE_CLOSE = 0.6;
/** A second domain the dominant clearly outweighs: present, plainly lesser. */
const SECONDARY_CHARGE_SCALE_DISTANT = 0.42;
/** Opacity for that same distant second domain. */
const SECONDARY_CHARGE_OPACITY_DISTANT = 0.55;

/** Wrap a charge group in an opacity layer, or return it untouched at full. */
function wrapSubordinate(charge: string, opacity: number): string {
  return opacity >= 1 ? charge : `<g opacity="${opacity}">${charge}</g>`;
}

let _clipIdCounter = 0;

/**
 * @param clipIdSeed  Optional stable suffix for the internal clip-path id. Omit
 *   (the default) when the SVG is inlined into the live document, where each
 *   instance needs a document-unique id and the counter supplies it. Pass a
 *   stable seed when the SVG becomes a self-contained document — a
 *   `data:image/svg+xml` URI, a canvas rasterisation — because there the id
 *   cannot collide with anything, while a counter makes the output string
 *   differ on every call. THR-638: the entity-visual resolver returns this
 *   string as an `<img src>`, so a per-call id would change the URL on every
 *   render and force the browser to re-decode the image (NFP #3).
 */
export function generateCoatOfArmsSvg(
  config: CoatOfArmsConfig,
  size: number,
  clipIdSeed?: string,
): string {
  const { width: vbW, height: vbH } = SHIELD_VIEWBOX;
  const svgHeight = Math.round((size * vbH) / vbW);
  const clipId = `coa-clip-${config.factionType}-${clipIdSeed ?? _clipIdCounter++}`;

  // Fallback: no dominant reach
  if (!config.dominantReach) {
    const bgColor = config.fallbackColor ?? '#2a2a3a';
    const glyphColor = '#e0ddd4';
    const glyph = config.fallbackGlyph ?? '?';
    const inner =
      renderShieldBase(bgColor, '#444', 1.5, clipId) +
      `<text x="60" y="85" text-anchor="middle" dominant-baseline="middle" ` +
      `fill="${glyphColor}" font-size="48" font-family="serif">${glyph}</text>` +
      renderShieldOutline('#444', 1.5);
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" ` +
      `width="${size}" height="${svgHeight}">${inner}</svg>`
    );
  }

  // Derive tinctures from dominant reach
  const tinctures = deriveTinctures(config.dominantReach);
  const divisionType = DIVISION_BY_FACTION_TYPE[config.factionType];

  // Determine division colors: secondary reach tinctures if available, else darken primary
  const divColors = {
    primary: tinctures.primary,
    secondary: config.secondaryReach
      ? deriveTinctures(config.secondaryReach).primary
      : tinctures.secondary,
  };

  // Border: a luminous charge colour, never the field. Since THR-638 crushed
  // the field into the world's dark value range, a field-coloured border would
  // disappear against any dark surface and the shield would lose its silhouette.
  //
  // THR-854: the bordure carries the faction's *third* domain when it has one.
  // That is where real heraldry puts a difference mark, and it is the axis that
  // separates two factions agreeing on both of their top reaches — the
  // Thieves Guild and the Underking's Court are both shadow-then-gold, and
  // nothing short of rank 3 tells them apart. Every reach's charge colour is an
  // undimmed sphere colour, so the border stays luminous whichever one it takes.
  const borderColor = config.tertiaryReach
    ? deriveTinctures(config.tertiaryReach).charge
    : tinctures.charge;

  // Primary charge: center of shield
  const primaryCharge = renderCharge(config.dominantReach, tinctures.charge, 1, 60, 75);

  // Secondary charge: lower third, only when size >= threshold. A second domain
  // the dominant clearly outweighs is drawn smaller and dimmer rather than
  // dropped, so the shield always names it (THR-854). `undefined` reads as
  // close, preserving pre-THR-854 rendering for hand-built configs.
  const secondaryIsClose = config.secondaryIsClose !== false;
  const secondaryCharge =
    config.secondaryReach && size >= SMALL_SIZE_THRESHOLD
      ? wrapSubordinate(
          renderCharge(
            config.secondaryReach,
            SPHERE_COLORS[REACH_TO_SPHERE[config.secondaryReach]],
            secondaryIsClose ? SECONDARY_CHARGE_SCALE_CLOSE : SECONDARY_CHARGE_SCALE_DISTANT,
            60,
            115,
          ),
          secondaryIsClose ? 1 : SECONDARY_CHARGE_OPACITY_DISTANT,
        )
      : '';

  const inner =
    renderShieldBase(divColors.secondary, '#1a1a2e', 1.5, clipId) +
    renderDivision(divisionType, divColors, clipId) +
    primaryCharge +
    secondaryCharge +
    renderBorder(config.prominenceLevel, borderColor) +
    renderShieldOutline('#1a1a2e', 1);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" ` +
    `width="${size}" height="${svgHeight}">${inner}</svg>`
  );
}

// ─── React Component ──────────────────────────────────────────────────────────

interface CoatOfArmsProps {
  definition: FactionDefinition;
  size: number;
  prominenceLevel?: ProminenceLevel;
  className?: string;
}

export const CoatOfArms = memo(function CoatOfArms({
  definition,
  size,
  prominenceLevel = 'base',
  className,
}: CoatOfArmsProps) {
  const svgString = useMemo(() => {
    const config = buildCoatOfArmsConfig(definition, definition.iconGlyph, prominenceLevel);
    return generateCoatOfArmsSvg(config, size);
  }, [definition, size, prominenceLevel]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block' }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
