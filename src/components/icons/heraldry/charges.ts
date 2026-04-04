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
  `<line x1="-20" y1="-20" x2="20" y2="20" stroke="${color}" stroke-width="5" stroke-linecap="round" />` +
  `<line x1="20" y1="-20" x2="-20" y2="20" stroke="${color}" stroke-width="5" stroke-linecap="round" />` +
  `<line x1="-12" y1="0" x2="12" y2="0" stroke="${color}" stroke-width="3.5" />` +
  `<line x1="0" y1="-12" x2="0" y2="12" stroke="${color}" stroke-width="3.5" />` +
  `<circle cx="0" cy="0" r="5" fill="${color}" />`;

/** stone: anvil — three stacked rects, wider base */
const stone: ShapeFn = (color) =>
  `<rect x="-14" y="-22" width="28" height="12" rx="2" fill="${color}" />` +
  `<rect x="-8" y="-10" width="16" height="12" fill="${color}" />` +
  `<rect x="-20" y="2" width="40" height="12" rx="2" fill="${color}" />`;

/** eye: radiant eye — ellipse + pupil + 5 radiating lines */
const eye: ShapeFn = (color) => {
  const rays = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const x1 = Math.round(Math.cos(angle) * 16 * 10) / 10;
    const y1 = Math.round(Math.sin(angle) * 16 * 10) / 10;
    const x2 = Math.round(Math.cos(angle) * 24 * 10) / 10;
    const y2 = Math.round(Math.sin(angle) * 24 * 10) / 10;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2.5" />`;
  }).join('');
  return (
    `<ellipse cx="0" cy="0" rx="16" ry="10" fill="none" stroke="${color}" stroke-width="3" />` +
    `<circle cx="0" cy="0" r="6" fill="${color}" />` +
    rays
  );
};

/** gold: coin — outer circle + inner ring + base rect */
const gold: ShapeFn = (color) =>
  `<circle cx="0" cy="-2" r="18" fill="none" stroke="${color}" stroke-width="3" />` +
  `<circle cx="0" cy="-2" r="8" fill="${color}" />` +
  `<rect x="-14" y="18" width="28" height="6" rx="2" fill="${color}" />`;

/** veil: crescent — arc path + two trailing wisps */
const veil: ShapeFn = (color) =>
  `<path d="M-12,-18 A20,20 0 1,1 12,-18 A14,14 0 1,0 -12,-18 Z" fill="${color}" />` +
  `<path d="M14,0 Q22,10 12,18" fill="none" stroke="${color}" stroke-width="2.5" />` +
  `<path d="M10,8 Q20,16 10,24" fill="none" stroke="${color}" stroke-width="2" />`;

/** heart: classic heart shape */
const heart: ShapeFn = (color) =>
  `<path d="M0,20 C-24,-2 -24,-24 0,-10 C24,-24 24,-2 0,20 Z" fill="${color}" />`;

/** star: six-pointed star — 12-point polygon alternating r=24/r=12 */
const star: ShapeFn = (color) => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6 - Math.PI / 2;
    const r = i % 2 === 0 ? 24 : 12;
    const x = Math.round(Math.cos(angle) * r * 10) / 10;
    const y = Math.round(Math.sin(angle) * r * 10) / 10;
    return `${x},${y}`;
  }).join(' ');
  return `<polygon points="${points}" fill="${color}" />`;
};

/** shadow: dagger — polygon blade + horizontal crossguard */
const shadow: ShapeFn = (color) =>
  `<polygon points="0,-26 6,-4 2,8 0,12 -2,8 -6,-4" fill="${color}" />` +
  `<line x1="-14" y1="-4" x2="14" y2="-4" stroke="${color}" stroke-width="3.5" stroke-linecap="round" />`;

const CHARGE_SHAPES: Record<ReachDomain, ShapeFn> = {
  iron, stone, eye, gold, veil, heart, star, shadow,
};
