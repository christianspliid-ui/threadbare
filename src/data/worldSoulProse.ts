/**
 * World Soul Prose Registry — 32 prose entries (8 spheres × 4 intensities)
 *
 * Used by WorldSoulIndicator to describe the global dominant sphere in narrative prose.
 * Prose strings use **SphereName** markers which the renderProseWithIPK utility parses
 * into ProseKeyword (IPK) components.
 *
 * Intensity thresholds are derived from aggregate.totalBySphere[dominant] / entityCount:
 *   whisper:  avgScore < 2
 *   murmur:   avgScore < 4
 *   pulse:    avgScore < 6
 *   storm:    avgScore >= 6
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types';

export type WorldSoulIntensity = 'whisper' | 'murmur' | 'pulse' | 'storm';

export const WORLD_SOUL_PROSE: Record<SphereName, Record<WorldSoulIntensity, string>> = {
  force: {
    whisper: 'A faint martial tremor runs beneath the earth.',
    murmur: 'The drums of **Force** beat steady across the land.',
    pulse: '**Force** surges across the land, and even the mountains tremble.',
    storm: 'The world shakes with **Force** unleashed — nothing stands unchallenged.',
  },
  matter: {
    whisper: 'The bones of the earth feel unusually solid today.',
    murmur: '**Matter** runs deep through this land — stone endures, and craft holds.',
    pulse: 'The weight of **Matter** presses down across the world. What is built will last.',
    storm: '**Matter** has claimed this age. The land is iron, the sky is stone, and nothing yields.',
  },
  energy: {
    whisper: 'There is a restlessness in the air — something is stirring.',
    murmur: '**Energy** hums through trade roads and hearth fires across the realm.',
    pulse: '**Energy** crackles and races. Nothing is still, nothing is stagnant.',
    storm: 'The world blazes with **Energy** — movement, heat, and change have overwhelmed all stillness.',
  },
  life: {
    whisper: 'Something green and insistent presses up through the cracks.',
    murmur: '**Life** stirs in the soil and wood of the land. The growing things reach.',
    pulse: '**Life** flows strong — fields burst, wounds close, and forest pushes at every border.',
    storm: 'The world overflows with **Life**. Ancient roots drink deep, and nothing that dies stays gone for long.',
  },
  mind: {
    whisper: 'The scholars seem more alert than usual. Something is sharpening.',
    murmur: '**Mind** sharpens across the land — questions are asked, and answers sought.',
    pulse: 'The clarity of **Mind** cuts through fog and superstition. Reason shapes this age.',
    storm: '**Mind** has consumed this world. Every mystery is a problem to be solved, every truth a weapon to be wielded.',
  },
  spirit: {
    whisper: 'Candles burn without wind. Something listens at the threshold.',
    murmur: '**Spirit** moves through the world — prayers echo, and the veil grows thin.',
    pulse: '**Spirit** surges. The unseen answers the seen, and faith holds strange power.',
    storm: 'The **Spirit** of this world roars like a storm. The gods walk closer, and mortals hear voices in the dark.',
  },
  time: {
    whisper: 'Elders speak with unusual certainty. The old patterns reassert.',
    murmur: '**Time** runs deep across this land. Memory is long, and the past still speaks.',
    pulse: 'The weight of **Time** settles over the world — what was foretold presses toward the present.',
    storm: '**Time** has seized this age. The past and future collapse together. Every choice echoes across centuries.',
  },
  entropy: {
    whisper: 'Something at the edges is fraying.',
    murmur: '**Entropy** gnaws at the roots of things. Not ruin yet — but change comes.',
    pulse: '**Entropy** spreads its patient work. The old orders crumble. Something new must grow in their place — or nothing will.',
    storm: '**Entropy** has swept across the world. All that was built is questioned. All that was certain has become uncertain.',
  },
};
