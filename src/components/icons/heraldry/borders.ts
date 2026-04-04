import type { ProminenceLevel } from '../constants';
import { SHIELD_PATH } from './shields';

/**
 * Renders a border ornamentation overlay for a coat of arms shield.
 * Complexity scales with faction prominence level.
 */
export function renderBorder(level: ProminenceLevel, color: string): string {
  switch (level) {
    case 'base':
      return `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="4" />`;

    case 'established':
      return (
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="5" />` +
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5" />`
      );

    case 'dominant':
      return (
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="5" />` +
        `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5" />` +
        `<circle cx="18" cy="14" r="5" fill="${color}" />` +
        `<circle cx="102" cy="14" r="5" fill="${color}" />` +
        `<circle cx="60" cy="140" r="5" fill="${color}" />`
      );

    default:
      return `<path d="${SHIELD_PATH}" fill="none" stroke="${color}" stroke-width="4" />`;
  }
}
