/**
 * Companion template library (THR-1096).
 *
 * A companion is a named person who walks with a mortal and makes them better
 * at something. They are cards, not agents: no decisions, no movement, no
 * encounters of their own. A template is the *profession* — "Expedition Guide";
 * the instance minted from it gets a generated name, so every companion the
 * player meets is a person rather than a stat line.
 *
 * Two tiers, following the Eldritch Horror ally model the design cites:
 *  - profession templates, pool-drawable, name generated per instance
 *  - `unique: true` templates, granted by name from authored content only, and
 *    never twice — one instance in the world blocks a second.
 *
 * Bonuses are small and always on. `COMPANION_CONTRIBUTION_RANGE` is the
 * authoring guardrail and the library test asserts every value against it —
 * companions sit below the agent-scale band so they nudge a roll rather than
 * decide it.
 */

import type { DomainContributions } from '../types/traits';
import type { LossCondition } from '../types/attachments';
import type { RarityTier } from '../types/rarity';

// ─── Tunables ───────────────────────────────────────────────────

/** Per-bearer companion cap. The reward pool stops offering at this size. */
export const COMPANION_MAX = 3;

/**
 * Sizing rule for template `domainContributions`, in raw capability points.
 * Asserted by the library test — the fixtures' 4–16 band is agent-scale;
 * companions stay below it deliberately.
 */
export const COMPANION_CONTRIBUTION_RANGE = { min: 1, max: 3 } as const;

/** Contract length for the migrated `hire-mercenaries` companion. */
export const MERCENARY_COMPANION_DURATION_TICKS = 10;

// ─── Template Shape ─────────────────────────────────────────────

export interface CompanionTemplate {
  readonly id: string;
  /** The profession — what the card is. Instances carry a generated personal name. */
  readonly profession: string;
  /** One line the player reads to know why they'd want this person along. */
  readonly goodFor: string;
  /** Always-on reach contributions, within COMPANION_CONTRIBUTION_RANGE. */
  readonly domainContributions: DomainContributions;
  readonly tier: RarityTier;
  readonly lossCondition: LossCondition;
  /** Setting class — the reward pool's tag filter reads these. */
  readonly tags: readonly string[];
  /**
   * Cause → change sentence pair (THR-1082 rule). `{name}` is substituted with
   * the instance's generated name. Join says why they came; depart says what
   * their leaving costs — never a bare status line.
   */
  readonly joinSentence: string;
  readonly departSentence: string;
  /** Contracted companions expire; absent means they stay until a story removes them. */
  readonly durationTicks?: number;
  /** Named story character — grantable only by id, and only once per world. */
  readonly unique?: boolean;
  /** Fixed name for unique companions; profession templates generate one. */
  readonly fixedName?: string;
}

// ─── The Library ────────────────────────────────────────────────

export const COMPANION_TEMPLATES: readonly CompanionTemplate[] = [
  {
    id: 'companion.wayfarer',
    profession: 'Wayfarer',
    goodFor: 'Knows the fords, the passes, and which of them is lying about being a road.',
    domainContributions: { stone: 2, eye: 1 },
    tier: 1,
    lossCondition: 'permanent',
    tags: ['road', 'wilds'],
    joinSentence: '{name} had been walking the same road the other way, and turned around.',
    departSentence: '{name} takes the fork north, and the passes go back to being guesswork.',
  },
  {
    id: 'companion.guild-scribe',
    profession: 'Guild Scribe',
    goodFor: 'Reads a contract twice and tells you which clause will cost you.',
    domainContributions: { gold: 2 },
    tier: 1,
    lossCondition: 'permanent',
    tags: ['settlement', 'court'],
    joinSentence: '{name} was owed a favour by the wrong people, and settled for travelling company.',
    departSentence: '{name} is recalled to the guild hall; the next contract goes unread.',
  },
  {
    id: 'companion.lantern-bearer',
    profession: 'Lantern-Bearer',
    goodFor: 'Walks ahead in the dark so nothing arrives unannounced.',
    domainContributions: { eye: 2 },
    tier: 1,
    lossCondition: 'permanent',
    tags: ['road', 'wilds'],
    joinSentence: '{name} lit the way once without being asked, and simply kept doing it.',
    departSentence: '{name} sets the lantern down and stays behind; the dark closes up its distance.',
  },
  {
    id: 'companion.sellsword-band',
    profession: 'Sellsword Band',
    goodFor: 'Stands between trouble and everyone else, for exactly as long as the coin lasts.',
    domainContributions: { iron: 3 },
    tier: 1,
    lossCondition: 'permanent',
    tags: ['road', 'settlement', 'hired'],
    durationTicks: MERCENARY_COMPANION_DURATION_TICKS,
    joinSentence: "{name}'s company takes the coin and falls in behind.",
    departSentence: "{name}'s contract runs out at dusk, and the company is gone by morning.",
  },
  {
    id: 'companion.hedge-healer',
    profession: 'Hedge-Healer',
    goodFor: 'Closes a wound with what grows by the roadside, and no questions after.',
    domainContributions: { heart: 2, veil: 1 },
    tier: 2,
    lossCondition: 'permanent',
    tags: ['wilds', 'settlement'],
    joinSentence: '{name} stitched a wound that should have festered, and stayed to see it heal.',
    departSentence: '{name} is needed by a village that can pay in something other than distance.',
  },
  {
    id: 'companion.shadow-broker',
    profession: 'Shadow-Broker',
    goodFor: 'Knows who is worth knowing, and can be persuaded to say so.',
    domainContributions: { shadow: 2, gold: 1 },
    tier: 2,
    lossCondition: 'stealable',
    tags: ['settlement', 'court'],
    joinSentence: '{name} decided the debt ran the other way, and attached themselves to collect it.',
    departSentence: '{name} takes a better offer, and takes the names along with them.',
  },
  {
    id: 'companion.temple-cantor',
    profession: 'Temple Cantor',
    goodFor: 'Sings the old words correctly, which turns out to matter.',
    domainContributions: { star: 2 },
    tier: 2,
    lossCondition: 'permanent',
    tags: ['settlement', 'court'],
    joinSentence: '{name} left the choir mid-verse and has not explained why.',
    departSentence: '{name} is called back to the temple, and the old words go half-remembered.',
  },
  {
    id: 'companion.drover',
    profession: 'Drover',
    goodFor: 'Keeps the animals fed and the load moving when the ground turns against it.',
    domainContributions: { stone: 1, gold: 1 },
    tier: 1,
    lossCondition: 'permanent',
    tags: ['road', 'wilds'],
    joinSentence: '{name} was driving the herd the same way and saw no reason to walk it alone.',
    departSentence: '{name} turns off toward the market road; the load gets heavier by evening.',
  },
  {
    id: 'companion.veiled-cartographer',
    profession: 'Veiled Cartographer',
    goodFor: 'Maps the places that do not hold still, and remembers where they were.',
    domainContributions: { veil: 3, eye: 2 },
    tier: 3,
    lossCondition: 'permanent',
    tags: ['wilds', 'unique'],
    unique: true,
    fixedName: 'Aunel of the Nine Charts',
    joinSentence: 'Aunel of the Nine Charts has been waiting at this crossing for someone going the right way.',
    departSentence: 'Aunel of the Nine Charts folds the last chart away and walks off the map entirely.',
  },
] as const;

// ─── Lookup ─────────────────────────────────────────────────────

const TEMPLATES_BY_ID = new Map<string, CompanionTemplate>(
  COMPANION_TEMPLATES.map(t => [t.id, t]),
);

/** Look up a companion template by id. Returns null for an unknown id (fail-soft). */
export function getCompanionTemplate(id: string): CompanionTemplate | null {
  return TEMPLATES_BY_ID.get(id) ?? null;
}

/**
 * Pool candidates: profession templates only (uniques are authored grants),
 * narrowed by tag filters when the recipe supplies them.
 */
export function filterCompanionTemplates(
  tagFilters?: readonly string[],
): CompanionTemplate[] {
  return COMPANION_TEMPLATES.filter(t => {
    if (t.unique) return false;
    if (!tagFilters || tagFilters.length === 0) return true;
    return tagFilters.every(tag => t.tags.includes(tag));
  });
}
