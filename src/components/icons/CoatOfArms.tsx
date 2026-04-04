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
  dominantSphere: CreationSphereName | null;
  foundationSphere: FoundationSphereName | null;
  prominenceLevel: ProminenceLevel;
  fallbackGlyph?: string;
  fallbackColor?: string;
}

// ─── Config Builder ───────────────────────────────────────────────────────────

/** Threshold within which a secondary reach is considered "close enough" */
const SECONDARY_REACH_THRESHOLD = 0.2;

export function buildCoatOfArmsConfig(
  def: FactionDefinition,
  fallbackGlyph?: string,
  prominenceLevel: ProminenceLevel = 'base',
): CoatOfArmsConfig {
  const weights = def.reachWeights;
  // Filter to valid ReachDomain keys only — some definitions (e.g. monster factions)
  // may include sphere names like 'force' in reachWeights which aren't valid reaches
  const validReaches = new Set<string>(Object.keys(REACH_TO_SPHERE));
  const entries = (Object.entries(weights) as [string, number][])
    .filter(([key]) => validReaches.has(key)) as [ReachDomain, number][];

  if (entries.length === 0) {
    return {
      factionType: def.factionType,
      dominantReach: null,
      dominantSphere: null,
      foundationSphere: null,
      prominenceLevel,
      fallbackGlyph: fallbackGlyph ?? def.iconGlyph,
      fallbackColor: def.themeColor,
    };
  }

  // Sort descending by weight
  entries.sort((a, b) => b[1] - a[1]);
  const [dominantReach, dominantWeight] = entries[0];
  const dominantSphere = REACH_TO_SPHERE[dominantReach];
  const foundationSphere = SPHERE_TO_FOUNDATION[dominantSphere];

  let secondaryReach: ReachDomain | undefined;
  if (entries.length >= 2) {
    const [secondReach, secondWeight] = entries[1];
    const relDiff = (dominantWeight - secondWeight) / dominantWeight;
    if (relDiff <= SECONDARY_REACH_THRESHOLD) {
      secondaryReach = secondReach;
    }
  }

  return {
    factionType: def.factionType,
    dominantReach,
    secondaryReach,
    dominantSphere,
    foundationSphere,
    prominenceLevel,
    fallbackGlyph: fallbackGlyph ?? def.iconGlyph,
    fallbackColor: def.themeColor,
  };
}

// ─── SVG Generator ────────────────────────────────────────────────────────────

let _clipIdCounter = 0;

export function generateCoatOfArmsSvg(config: CoatOfArmsConfig, size: number): string {
  const { width: vbW, height: vbH } = SHIELD_VIEWBOX;
  const svgHeight = Math.round((size * vbH) / vbW);
  const clipId = `coa-clip-${config.factionType}-${_clipIdCounter++}`;

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

  // Border color: use sphere color
  const borderColor = tinctures.primary;

  // Primary charge: center of shield
  const primaryCharge = renderCharge(config.dominantReach, tinctures.charge, 1, 60, 75);

  // Secondary charge: lower third, only when size >= threshold
  const secondaryCharge =
    config.secondaryReach && size >= SMALL_SIZE_THRESHOLD
      ? renderCharge(config.secondaryReach, SPHERE_COLORS[REACH_TO_SPHERE[config.secondaryReach]], 0.6, 60, 115)
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
