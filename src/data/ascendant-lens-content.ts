/**
 * Ascendant Lens Prose — TB-035 Phase 6.
 *
 * God-voice commentary that colors vignettes based on the Ascendant's
 * primary sphere alignment. These are short, evocative fragments
 * injected into vignette prose when the god "narrates" the scene.
 *
 * Organized by scene context (combat, social, discovery, ritual, crisis,
 * journey, sacrifice) × sphere, producing ~84 unique god-voice lines.
 */

import type { SphereName } from '../types/index';

// ─── Scene Contexts ─────────────────────────────────────────────────

export type SceneContext =
  | 'combat'
  | 'social'
  | 'discovery'
  | 'ritual'
  | 'crisis'
  | 'journey'
  | 'sacrifice';

export const ALL_SCENE_CONTEXTS: SceneContext[] = [
  'combat', 'social', 'discovery', 'ritual', 'crisis', 'journey', 'sacrifice',
];

// ─── Ascendant Lens Lines ───────────────────────────────────────────

/**
 * God-voice lines indexed by sphere × scene context.
 * Each entry is a short evocative fragment (1-2 sentences).
 */
export const ASCENDANT_LENS: Partial<Record<SphereName, Record<SceneContext, string[]>>> = {
  force: {
    combat: [
      'The clash of steel sings a hymn you know by heart.',
      'Every blow struck echoes through the cosmic lattice of Force.',
    ],
    social: [
      'Words are weapons too, though mortals forget it.',
      'The pressure of presence — Force manifest in silence.',
    ],
    discovery: [
      'Knowledge seized is knowledge owned. Take it.',
      'The truth yields only to those who demand it.',
    ],
    ritual: [
      'Power channeled through will. Pure and direct.',
      'The rite bends reality by sheer application of Force.',
    ],
    crisis: [
      'In crisis, Force reveals who truly holds power.',
      'Pressure creates diamonds — or dust.',
    ],
    journey: [
      'Each step forward is an act of will against entropy.',
      'The road does not yield. Neither do you.',
    ],
    sacrifice: [
      'Sacrifice without strength is merely loss.',
      'To give something up requires the power to hold it first.',
    ],
  },
  life: {
    combat: [
      'Blood spilled returns to the earth. Nothing is wasted.',
      'Even in violence, Life finds a way to grow from the wreckage.',
    ],
    social: [
      'Bonds between mortals are the roots of civilization.',
      'Community is the garden where Life thrives.',
    ],
    discovery: [
      'Every new truth is a seed waiting for soil.',
      'Knowledge grows when shared, like any living thing.',
    ],
    ritual: [
      'The green pulse of living magic — warm, insistent, generous.',
      'Life channels through willing vessels, not forced ones.',
    ],
    crisis: [
      'Life clings. Even in the worst moments, it clings.',
      'The deepest roots hold through the worst storms.',
    ],
    journey: [
      'Growth requires movement. Seeds that stay planted never become forests.',
      'The journey is the growth.',
    ],
    sacrifice: [
      'What is given to Life returns sevenfold.',
      'The greatest gift is making room for something new to grow.',
    ],
  },
  entropy: {
    combat: [
      'All things end. You simply hasten the inevitable.',
      'Destruction is not evil — it is the space where new things grow.',
    ],
    social: [
      'Every bond carries the seed of its own dissolution.',
      'Change is the only constant. These mortals will learn.',
    ],
    discovery: [
      'To understand a thing, first you must see how it falls apart.',
      'The truth beneath the surface is always entropy.',
    ],
    ritual: [
      'Unmaking is its own kind of magic — honest and irreversible.',
      'The ritual dissolves what was. What comes next is freedom.',
    ],
    crisis: [
      'Crisis is entropy\'s gift. It strips away everything that wasn\'t load-bearing.',
      'Let it collapse. What survives is what matters.',
    ],
    journey: [
      'Every step leaves the old self behind. This is entropy\'s blessing.',
      'The journey is a process of becoming by unbecoming.',
    ],
    sacrifice: [
      'Sacrifice and entropy are siblings. Both create space.',
      'What is surrendered to entropy is truly given — no take-backs.',
    ],
  },
  mind: {
    combat: [
      'The battle is won or lost before the first blow. In the mind.',
      'Steel is crude. The true weapon is understanding.',
    ],
    social: [
      'Every conversation is a meeting of inner worlds.',
      'To know someone\'s mind is to hold the key to their soul.',
    ],
    discovery: [
      'The joy of understanding — there is no purer pleasure.',
      'Each discovery is a mirror showing the cosmos its own face.',
    ],
    ritual: [
      'Thought shapes reality. The ritual simply makes the mechanism explicit.',
      'Concentration. Focus. Will. The mind is the most powerful channel.',
    ],
    crisis: [
      'Panic is the enemy. Clarity is the weapon.',
      'In crisis, the mind either sharpens or shatters.',
    ],
    journey: [
      'The greatest journey is always inward.',
      'Each mile walked reshapes the mind that walks it.',
    ],
    sacrifice: [
      'To sacrifice a belief is harder than sacrificing a limb.',
      'What the mind gives up, it can never pretend to unknow.',
    ],
  },
  spirit: {
    combat: [
      'The spirit cannot be killed. Remember that, when the body fails.',
      'Fight not with the flesh but with the fire inside.',
    ],
    social: [
      'Souls recognize each other. That is why some meetings feel like homecomings.',
      'The spirit reaches between mortals like roots between trees.',
    ],
    discovery: [
      'To see with spirit-eyes is to see what truly is.',
      'The hidden world reveals itself to those who look with more than eyes.',
    ],
    ritual: [
      'The spirit-world stirs. Something vast turns its attention this way.',
      'When the veil thins, the spirit flows like water through cloth.',
    ],
    crisis: [
      'The spirit endures what the body cannot.',
      'In the darkest hour, the spirit burns brightest.',
    ],
    journey: [
      'Every step on the road is a step deeper into the spirit.',
      'The pilgrimage of the soul requires no map.',
    ],
    sacrifice: [
      'To give of the spirit is to give of the self.',
      'What is offered in spirit returns in ways the material cannot measure.',
    ],
  },
  order: {
    combat: [
      'Discipline wins wars. Passion merely starts them.',
      'Formation. Timing. Precision. Order is the foundation of victory.',
    ],
    social: [
      'Society is Order\'s greatest creation. Fragile, imperfect, essential.',
      'Rules are the scaffolding on which trust is built.',
    ],
    discovery: [
      'The universe has structure. Discovering that structure is sacred work.',
      'Pattern recognition is the first and most profound form of knowledge.',
    ],
    ritual: [
      'The ritual\'s power lies in its precision. Each step must be exact.',
      'Order channels raw power into directed purpose.',
    ],
    crisis: [
      'Hold the line. Structure does not fail — people fail structure.',
      'In chaos, Order is the only thing standing between survival and oblivion.',
    ],
    journey: [
      'A journey without a plan is mere wandering.',
      'Each waypoint reached is Order asserting itself over the formless.',
    ],
    sacrifice: [
      'Sacrifice within Order has meaning. Without it, mere waste.',
      'The system demands its due. Pay it with precision.',
    ],
  },
  chaos: {
    combat: [
      'Unpredictability is the deadliest weapon.',
      'Let them plan. You will improvise — and win.',
    ],
    social: [
      'The most interesting people are the ones who refuse to be predicted.',
      'Convention is a cage. Break it.',
    ],
    discovery: [
      'The best discoveries are accidents. Embrace the unexpected.',
      'Chaos creates more novelty in a heartbeat than Order does in an age.',
    ],
    ritual: [
      'Let the ritual go wrong. What emerges will be more interesting than what was planned.',
      'Raw, unchanneled power — beautiful in its wildness.',
    ],
    crisis: [
      'Chaos thrives in crisis. So can you.',
      'When everything falls apart, those who can dance in the wreckage survive.',
    ],
    journey: [
      'The best journeys are the ones where you throw away the map.',
      'Wander. Wonder. The path reveals itself to those who stop looking for it.',
    ],
    sacrifice: [
      'Sacrifice everything you cling to. Freedom waits on the other side.',
      'Let go. Chaos will catch you — or teach you to fly.',
    ],
  },
};

/**
 * Get a god-voice line for the given sphere and scene context.
 * Returns a random selection, or null if no lines exist.
 */
export function getAscendantLensLine(
  sphere: SphereName,
  context: SceneContext,
  rng: () => number,
): string | null {
  const sphereLines = ASCENDANT_LENS[sphere];
  if (!sphereLines) return null;

  const contextLines = sphereLines[context];
  if (!contextLines || contextLines.length === 0) return null;

  return contextLines[Math.floor(rng() * contextLines.length)];
}
