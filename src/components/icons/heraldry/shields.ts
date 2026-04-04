export const SHIELD_VIEWBOX = { width: 120, height: 150 };

export const SHIELD_PATH = 'M10,8 L110,8 L110,95 Q110,138 60,145 Q10,138 10,95 Z';

/**
 * Renders the shield base: a <defs> clipPath block + filled shield path.
 * The clipPath is referenced by division and charge layers to clip to the shield shape.
 */
export function renderShieldBase(
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  clipId: string,
): string {
  return (
    `<defs><clipPath id="${clipId}"><path d="${SHIELD_PATH}" /></clipPath></defs>` +
    `<path d="${SHIELD_PATH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`
  );
}

/**
 * Renders a shield outline path on top of the division layers, for a crisp border.
 */
export function renderShieldOutline(strokeColor: string, strokeWidth: number): string {
  return `<path d="${SHIELD_PATH}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
}
