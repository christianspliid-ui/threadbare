import type { ReachDomain } from '../../../types/traits';

/**
 * Renders a heraldic charge symbol for the given reach domain.
 * All paths are centered at origin (0,0); translate(cx,cy) positions them on the shield.
 */
export function renderCharge(
  reach: ReachDomain,
  color: string,
  scale: number,
  cx: number = 60,
  cy: number = 75,
): string {
  const inner = CHARGE_SHAPES[reach](color);
  return `<g transform="translate(${cx},${cy}) scale(${scale})">${inner}</g>`;
}

// ─── Charge Shape Renderers ───────────────────────────────────────────────────

type ShapeFn = (color: string) => string;

/** iron: crossed swords — two diagonal lines + crossguard stubs + center circle */
const iron: ShapeFn = (color) =>
  `<line x1="-15" y1="-15" x2="15" y2="15" stroke="${color}" stroke-width="3" stroke-linecap="round" />` +
  `<line x1="15" y1="-15" x2="-15" y2="15" stroke="${color}" stroke-width="3" stroke-linecap="round" />` +
  `<line x1="-8" y1="0" x2="8" y2="0" stroke="${color}" stroke-width="2" />` +
  `<line x1="0" y1="-8" x2="0" y2="8" stroke="${color}" stroke-width="2" />` +
  `<circle cx="0" cy="0" r="3" fill="${color}" />`;

/** stone: anvil — three stacked rects, wider base */
const stone: ShapeFn = (color) =>
  `<rect x="-10" y="-18" width="20" height="8" fill="${color}" />` +
  `<rect x="-6" y="-10" width="12" height="8" fill="${color}" />` +
  `<rect x="-14" y="-2" width="28" height="10" fill="${color}" />`;

/** eye: radiant eye — ellipse + pupil + 5 radiating lines */
const eye: ShapeFn = (color) => {
  const rays = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const x1 = Math.round(Math.cos(angle) * 12 * 10) / 10;
    const y1 = Math.round(Math.sin(angle) * 12 * 10) / 10;
    const x2 = Math.round(Math.cos(angle) * 18 * 10) / 10;
    const y2 = Math.round(Math.sin(angle) * 18 * 10) / 10;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" />`;
  }).join('');
  return (
    `<ellipse cx="0" cy="0" rx="12" ry="7" fill="none" stroke="${color}" stroke-width="2" />` +
    `<circle cx="0" cy="0" r="4" fill="${color}" />` +
    rays
  );
};

/** gold: coin — outer circle + inner ring + base rect */
const gold: ShapeFn = (color) =>
  `<circle cx="0" cy="-4" r="14" fill="none" stroke="${color}" stroke-width="2" />` +
  `<circle cx="0" cy="-4" r="5" fill="${color}" />` +
  `<rect x="-10" y="10" width="20" height="4" fill="${color}" />`;

/** veil: crescent — arc path + two trailing wisps */
const veil: ShapeFn = (color) =>
  `<path d="M-10,-14 A16,16 0 1,1 10,-14 A10,10 0 1,0 -10,-14 Z" fill="${color}" />` +
  `<path d="M12,0 Q18,8 10,14" fill="none" stroke="${color}" stroke-width="1.5" />` +
  `<path d="M8,6 Q16,12 8,18" fill="none" stroke="${color}" stroke-width="1" />`;

/** heart: classic heart shape */
const heart: ShapeFn = (color) =>
  `<path d="M0,14 C-18,-4 -18,-18 0,-8 C18,-18 18,-4 0,14 Z" fill="${color}" />`;

/** star: six-pointed star — 12-point polygon alternating r=18/r=9 */
const star: ShapeFn = (color) => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6 - Math.PI / 2;
    const r = i % 2 === 0 ? 18 : 9;
    const x = Math.round(Math.cos(angle) * r * 10) / 10;
    const y = Math.round(Math.sin(angle) * r * 10) / 10;
    return `${x},${y}`;
  }).join(' ');
  return `<polygon points="${points}" fill="${color}" />`;
};

/** shadow: dagger — polygon blade + horizontal crossguard */
const shadow: ShapeFn = (color) =>
  `<polygon points="0,-18 4,-4 0,2 -4,-4" fill="${color}" />` +
  `<line x1="-10" y1="2" x2="10" y2="2" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />`;

const CHARGE_SHAPES: Record<ReachDomain, ShapeFn> = {
  iron, stone, eye, gold, veil, heart, star, shadow,
};
