import type { HungerDefinition } from '../types/remembrance';

export const HUNGER_CATALOG: HungerDefinition[] = [
  {
    id: 'hunger.gather',
    name: 'Gather',
    imageAssetPath: '/assets/remembrance/hunger/gather.webp',
    proseVariants: [
      {
        driveTag: 'love',
        prose: 'Your love became a hunger. You would gather every soul under your wings — shelter them, hold them, keep them. Whether they wish it or not.',
      },
      {
        driveTag: 'preservation',
        prose: 'Your grief became a hunger. What died was alone. Unprotected. You would never let that happen again. You would gather them all.',
      },
      {
        driveTag: 'compassion',
        prose: 'Your compassion became a hunger. The broken, the lost, the abandoned — you would find them all. Your flock would have no edge, no limit.',
      },
    ],
    mandateDirection: 'Build a devoted community of followers bound to your court',
    courtOptions: [
      {
        courtType: 'circle',
        prose: 'Your court is a circle. All are seen. All are held. Every voice reaches the center, and the center holds them all.',
        isDefault: true,
      },
      {
        courtType: 'web',
        prose: 'Your court is a web. Every thread connects. Every soul you gather strengthens the whole. Pull one, and all feel it.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'life', secondary: 'spirit' },
    domainAffinities: { heart: 4, stone: 3, star: 2 },
    ascendantLens: {
      perceptionStyle: 'You see vulnerability first — who needs shelter, who is alone, who is about to break.',
      emotionalTone: 'Protective warmth edged with possessiveness. The flock must grow.',
    },
  },
  {
    id: 'hunger.witness',
    name: 'Witness',
    imageAssetPath: '/assets/remembrance/hunger/witness.webp',
    proseVariants: [
      {
        driveTag: 'obsession',
        prose: 'Your question became a hunger. You would know everything. Every secret whispered in darkness. Every truth buried under lies. Nothing — nothing — would be hidden from you.',
      },
      {
        driveTag: 'seeking',
        prose: 'Your seeking became a hunger. Not for answers — for seeing. You would witness every moment, every choice, every hidden thing. The world would be transparent to your gaze.',
      },
    ],
    mandateDirection: 'Establish an information network that sees across the world',
    courtOptions: [
      {
        courtType: 'web',
        prose: 'Your court is a web. Every thread leads to you. Every secret finds its way home along the silk.',
        isDefault: true,
      },
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Knowledge flows upward. You sit at the apex, and nothing reaches you unfiltered.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'mind', secondary: 'spirit' },
    domainAffinities: { eye: 4, veil: 3, gold: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what others hide — the thought behind the smile, the fear behind the bravado, the secret behind the silence.',
      emotionalTone: 'Detached fascination edged with voyeuristic hunger. Everything must be known.',
    },
  },
  {
    id: 'hunger.reclaim',
    name: 'Reclaim',
    imageAssetPath: '/assets/remembrance/hunger/reclaim.webp',
    proseVariants: [
      {
        driveTag: 'vengeance',
        prose: 'Your rage became a hunger. What was taken will be taken back. What was destroyed will be rebuilt. And those who took it will understand what they stole.',
      },
      {
        driveTag: 'justice',
        prose: 'Your sense of justice became a hunger. The scales are broken. The world is crooked. You would right every wrong, recover every loss, even if it means breaking what stands in the way.',
      },
    ],
    mandateDirection: 'Recover what was lost — reclaim ruins, right ancient wrongs, restore forgotten power',
    courtOptions: [
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Rebuilt from the ruins of what was. Every stone reclaimed. Every position earned through the work of restoration.',
        isDefault: true,
      },
      {
        courtType: 'abyss',
        prose: 'Your court is an abyss. You reach down into what was lost and pull it back from darkness. Your power flows upward from forgotten depths.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'force', secondary: 'time' },
    domainAffinities: { iron: 4, gold: 3, stone: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what was taken — the scars, the absences, the places where something used to be. Every ruin speaks to you.',
      emotionalTone: 'Cold determination edged with old grief. What was lost will be found.',
    },
  },
  {
    id: 'hunger.reshape',
    name: 'Reshape',
    imageAssetPath: '/assets/remembrance/hunger/reshape.webp',
    proseVariants: [
      {
        driveTag: 'perfectionism',
        prose: 'Your vision became a hunger. The world as it is — imperfect, chaotic, wrong — cannot be tolerated. You would reshape it. All of it. Until it matches what you saw.',
      },
      {
        driveTag: 'vision',
        prose: 'Your certainty became a hunger. You saw the truth that others could not. Now you would make them see it too — by changing everything around them until the truth is all that remains.',
      },
    ],
    mandateDirection: 'Transform cultures and reshape the world according to your vision',
    courtOptions: [
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Vision flows downward from the apex. Every position exists to execute the design, to make the world conform.',
        isDefault: true,
      },
      {
        courtType: 'circle',
        prose: 'Your court is a circle. Every member carries the vision. The transformation spreads from the center outward, a ripple that never stops.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'force', secondary: 'mind' },
    domainAffinities: { gold: 4, iron: 3, eye: 2 },
    ascendantLens: {
      perceptionStyle: 'You see potential — what someone could become, what a place could be, the gap between what is and what should be.',
      emotionalTone: 'Visionary intensity edged with impatience. The world is not yet right.',
    },
  },
];
