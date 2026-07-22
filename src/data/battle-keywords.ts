/**
 * Battle IPK vocabulary (THR-628) — the war-state keywords prose can carry in
 * `**bold**` markers, rendered as tooltip'd terms by `renderProseWithIPK`
 * (same pattern as the THR-615 economy keywords in `resource-classes.ts`).
 *
 * These are the situational-modifier states made legible: a settlement that
 * reads **Fortified** is mechanically harder to take (fortificationMultiplier),
 * and the breach beat flips it to **Breached** — the modifier-stripping
 * headline moment. Interactive-text rule holds: tooltips are mechanical-plain.
 */

export const BATTLE_KEYWORD_TOOLTIPS: Record<string, string> = {
  fortified: 'Walls multiply the defenders’ effective strength. Taking this place means a siege — and sieges grind.',
  breached: 'The walls are broken. Most of the fortification advantage is gone, and the fight accelerates.',
  prepared: 'A defending army that stood its ground fights from a prepared position — its effective strength is multiplied.',
  routed: 'The army’s cohesion has collapsed. What remains is a crowd running, not a force fighting.',
};

export const BATTLE_KEYWORD_SET: ReadonlySet<string> = new Set(Object.keys(BATTLE_KEYWORD_TOOLTIPS));
