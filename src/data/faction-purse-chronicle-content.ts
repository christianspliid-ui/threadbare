/**
 * The faction purse — Great Chronicle lines (THR-1931 § Prose tables).
 *
 * Game register (prose doctrine v2: GM narration). Resolved through the economic
 * chronicle resolver; `{actor}` is the faction's name, `{target}` the army's or the
 * town's. Emitted only for factions inside the player's attention, at most once per
 * `PURSE_CHRONICLE_COOLDOWN_DAYS` per faction, so equilibrium stays silent.
 *
 * Every line states a crossing that really happened today — never a debt, never a
 * length of arrears (Law 45): `purse_broke` fires only on a day an army went unpaid,
 * `purse_broke_bare` only when a faction with no army runs out of coin.
 */

export const FACTION_PURSE_CHRONICLE_TEMPLATES = {
  purse_broke: [
    '{actor} could not pay its soldiers today.',
    '{actor} could not find the silver to pay its spears.',
    'The pay chests of {actor} came up short, and its soldiers were sent away with nothing.',
  ],
  purse_broke_bare: [
    'The strongbox of {actor} is bare.',
    '{actor} has spent the last of its coin.',
    'There is nothing left in the coffers of {actor}.',
  ],
  army_unpaid_desertion: [
    'Unpaid, {target} melted away on the road; men went home by night.',
    '{target} broke up for want of pay; its banners were sold in the market.',
    '{target} scattered when the pay stopped coming.',
  ],
  purse_recovered: [
    'Coin is flowing into {actor} again.',
    '{actor} can pay its way again.',
    'The coffers of {actor} are filling once more.',
  ],
} as const;

export const FACTION_PURSE_CHRONICLE_SIGNIFICANCE = {
  purse_broke: 0.6,
  purse_broke_bare: 0.5,
  army_unpaid_desertion: 0.7,
  purse_recovered: 0.5,
} as const;
