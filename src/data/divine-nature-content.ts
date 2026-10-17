/**
 * The god's own words for their nature and their essence (THR-1876 § D7.9).
 *
 * Moved here from `AscendantSheet.tsx` so the god's sheet and the god's page (the `god`
 * rows of the page-layout table) read one copy. Text unchanged.
 */
import type { SphereName } from '../types';

export const DIVINE_NATURE_PHRASES: Record<SphereName, { primary: string; secondary: string }> = {
  force: {
    primary: 'war, conquest, dominion, the breaking of resistance',
    secondary: 'strike, overwhelm, compel, force the unwilling hand',
  },
  matter: {
    primary: 'earth, craft, permanence, the weight of creation',
    secondary: 'building, shaping, enduring foundation, crystalline order',
  },
  energy: {
    primary: 'fire, lightning, transformation, radiant brilliance',
    secondary: 'unleashing, burning away, brilliant revelation, kinetic fury',
  },
  life: {
    primary: 'growth, fertility, healing, the bloom of nature',
    secondary: 'abundance, renewal, verdant flourishing, organic connection',
  },
  mind: {
    primary: 'thought, dreams, knowledge, the clarity of perception',
    secondary: 'insight, revelation, understanding, the architecture of reason',
  },
  spirit: {
    primary: 'souls, the veil, ancestors, passage between worlds',
    secondary: 'communion, the ephemeral, ascending consciousness, sacred connection',
  },
  time: {
    primary: 'memory, patience, fate, the cycles of becoming',
    secondary: 'echoes, the weight of history, temporal inevitability, patient turning',
  },
  entropy: {
    primary: 'decay, endings, dissolution, the unmaking of all things',
    secondary: 'change, return to chaos, inevitable dissolution, liberating release',
  },
  chaos: {
    primary: 'storms, freedom, disruption, the wild untaming',
    secondary: 'spontaneity, breaking bonds, turbulent freedom, beautiful destruction',
  },
  order: {
    primary: 'law, structure, hierarchy, absolute governance',
    secondary: 'precision, arrangement, hierarchical necessity, governing principle',
  },
  light: {
    primary: 'truth, revelation, clarity, exposure of all things',
    secondary: 'visibility, unveiling, piercing illumination, burning away shadows',
  },
  darkness: {
    primary: 'secrets, shadows, concealment, hidden depths',
    secondary: 'mystery, protection in obscurity, unknowable interiority, safe shadows',
  },
};


export function essenceToProseDescriptor(amount: number): string {
  if (amount < 1) return 'Barren';
  if (amount < 11) return 'A whisper';
  if (amount < 31) return 'A murmur';
  if (amount < 61) return 'A current';
  if (amount < 101) return 'A torrent';
  if (amount < 201) return 'A flood';
  return 'An ocean';
}
