import type { DivisionType } from '../constants';

interface DivisionColors {
  primary: string;
  secondary: string;
}

/**
 * Renders the field division pattern for a coat of arms shield.
 * All shapes are clipped to the shield outline via the provided clipId.
 */
export function renderDivision(
  type: DivisionType,
  colors: DivisionColors,
  clipId: string,
): string {
  const clip = `clip-path="url(#${clipId})"`;

  switch (type) {
    case 'per_pale':
      // Two vertical halves: left = primary, right = secondary
      return (
        `<rect x="10" y="8" width="50" height="140" fill="${colors.primary}" ${clip} />` +
        `<rect x="60" y="8" width="50" height="140" fill="${colors.secondary}" ${clip} />`
      );

    case 'per_fess':
      // Two horizontal halves: top = primary, bottom = secondary
      return (
        `<rect x="10" y="8" width="100" height="68" fill="${colors.primary}" ${clip} />` +
        `<rect x="10" y="76" width="100" height="80" fill="${colors.secondary}" ${clip} />`
      );

    case 'per_chevron': {
      // Top triangle = primary, bottom inverted V = secondary
      const topPoly = '10,8 110,8 60,76';
      const botPoly = '10,8 10,145 60,76 110,145 110,8';
      return (
        `<polygon points="${topPoly}" fill="${colors.primary}" ${clip} />` +
        `<polygon points="${botPoly}" fill="${colors.secondary}" ${clip} />`
      );
    }

    case 'quarterly':
      // Four quadrants: primary in Q1+Q4, secondary in Q2+Q3
      return (
        `<rect x="10" y="8" width="50" height="68" fill="${colors.primary}" ${clip} />` +
        `<rect x="60" y="8" width="50" height="68" fill="${colors.secondary}" ${clip} />` +
        `<rect x="10" y="76" width="50" height="72" fill="${colors.secondary}" ${clip} />` +
        `<rect x="60" y="76" width="50" height="72" fill="${colors.primary}" ${clip} />`
      );

    case 'per_bend_sinister': {
      // Two diagonal halves (sinister = top-right to bottom-left)
      const topPoly2 = '10,8 110,8 110,145';
      const botPoly2 = '10,8 110,145 10,145';
      return (
        `<polygon points="${topPoly2}" fill="${colors.primary}" ${clip} />` +
        `<polygon points="${botPoly2}" fill="${colors.secondary}" ${clip} />`
      );
    }

    case 'plain':
    default:
      return `<rect x="10" y="8" width="100" height="140" fill="${colors.primary}" ${clip} />`;
  }
}
