/**
 * Economic Chronicle Content — templates for permanent chronicle entries
 * triggered by significant economic state changes.
 *
 * Each trigger type has multiple template variants for PRNG selection.
 * Placeholders: {settlement}, {oldType}, {newType}, {actor}, {target},
 * {goodsType}, {guildName}, {resource}, {tierLabel}, {flavor}, {ticksAgo}
 *
 * Fail-soft: resolvers substitute generic descriptors when names are missing.
 */

// ─── Trigger Types ──────────────────────────────────────────────────────────

export type EconomicChronicleTrigger =
  | 'settlement_promotion'
  | 'settlement_demotion'
  | 'trade_route_established'
  | 'trade_route_died'
  | 'guild_founded'
  | 'monopoly_established'
  | 'monopoly_broken'
  | 'mercenary_hire'
  | 'assassination_commissioned'
  | 'agreement_broken'
  | 'wealth_tier_up'
  | 'wealth_tier_down';

// ─── Significance defaults per trigger ──────────────────────────────────────

export const ECONOMIC_CHRONICLE_SIGNIFICANCE: Record<EconomicChronicleTrigger, number> = {
  settlement_promotion: 0.9,
  settlement_demotion: 0.8,
  trade_route_established: 0.5,
  trade_route_died: 0.6,
  guild_founded: 0.7,
  monopoly_established: 0.9,
  monopoly_broken: 0.8,
  mercenary_hire: 0.6,
  assassination_commissioned: 0.8,
  agreement_broken: 0.7,
  wealth_tier_up: 0.5,
  wealth_tier_down: 0.6,
};

// ─── Chronicle Templates ────────────────────────────────────────────────────

/**
 * Multiple template variants per trigger. The resolver picks one via PRNG.
 * Templates use {placeholder} syntax resolved from EconomicChronicleContext.
 */
export const ECONOMIC_CHRONICLE_TEMPLATES: Record<EconomicChronicleTrigger, string[]> = {

  settlement_promotion: [
    '{settlement} has grown from a {oldType} into a {newType}, its prosperity drawing settlers from across the region.',
    'Where once stood the {oldType} of {settlement}, a {newType} now rises — its streets widening, its markets swelling with commerce.',
    'The {oldType} of {settlement} has outgrown its name. It is a {newType} now, and the world has taken notice.',
    'Prosperity begets growth, and {settlement} has answered the call. The {oldType} is no more; a {newType} stands in its place.',
  ],

  settlement_demotion: [
    '{settlement} has withered. What was once a {oldType} is now barely a {newType}.',
    'The decline of {settlement} is complete. Where a {oldType} once thrived, only the bones of a {newType} remain.',
    'Hard times have stripped {settlement} of its standing. The {oldType} shrinks, and those who remain call it a {newType} now.',
    'Famine, neglect, or ill fortune — whatever the cause, {settlement} has fallen from {oldType} to {newType}, and its people grow fewer by the day.',
  ],

  trade_route_established: [
    'A new trade route opens between {actor} and {target}, carrying {goodsType}.',
    'Merchants have blazed a path between {actor} and {target}. Wagons heavy with {goodsType} now roll where none did before.',
    'The road between {actor} and {target} comes alive with commerce — {goodsType} flowing like a river of coin.',
    '{actor} and {target} are linked now by trade. The first caravans of {goodsType} have already set out.',
  ],

  trade_route_died: [
    'The road between {actor} and {target} falls silent. The last caravan passed {ticksAgo} ticks ago.',
    'No wagons move between {actor} and {target} any longer. The route has withered from disuse, and the road grows over.',
    'Trade between {actor} and {target} has ceased. What was once a lifeline of commerce is now an empty trail.',
    'The merchants who once traveled between {actor} and {target} have found other roads. This one belongs to the dust now.',
  ],

  guild_founded: [
    'The {guildName} establishes itself in {settlement}, raising their hall where {flavor}.',
    'A new power takes root in {settlement}: the {guildName} opens its doors, and {flavor}.',
    'The {guildName} of {settlement} is born. {flavor} — and the balance of power shifts accordingly.',
    'In {settlement}, the {guildName} hangs their charter. {flavor}, and a new order begins.',
  ],

  monopoly_established: [
    '{actor} seizes control of the {resource} supply in {settlement}. Prices climb; murmurs of resistance begin.',
    'The {resource} trade in {settlement} now answers to {actor} alone. Competitors have been bought, broken, or driven out.',
    '{actor} has cornered the {resource} market in {settlement}. Those who need it must now pay whatever {actor} demands.',
    'A stranglehold tightens: {actor} controls all {resource} in {settlement}. The free market is a memory.',
  ],

  monopoly_broken: [
    'The {resource} monopoly in {settlement} collapses. Markets breathe again.',
    'Competition returns to {settlement}. The grip on {resource} has been broken, and prices begin their slow descent.',
    'The {resource} stranglehold in {settlement} is no more. Traders flood back, and the old order crumbles.',
    'Freedom, of a kind: the {resource} monopoly that choked {settlement} has shattered. New merchants fill the void.',
  ],

  mercenary_hire: [
    '{actor} hires a band of sellswords. The reason, they say, is protection. The reason, others say, is ambition.',
    'Armed strangers arrive in {settlement} at {actor}\'s invitation. They call themselves guards. The locals call them something else.',
    '{actor} has coin, and coin buys steel. A mercenary band now marches under their banner.',
    'The sound of hired boots echoes through {settlement}. {actor} has purchased loyalty — or at least its convincing imitation.',
  ],

  assassination_commissioned: [
    'Someone in {settlement} has paid for blood. The target is {target}.',
    'A contract has been drawn in {settlement}. {target}\'s days are numbered, though they may not yet know it.',
    'Gold changes hands in shadow. In {settlement}, {actor} has set events in motion that cannot be undone.',
    'The price of a life has been agreed upon. In {settlement}, someone wants {target} dead — and has the means to arrange it.',
  ],

  agreement_broken: [
    '{actor} breaks their pact with {target}. Trust, once spent, is not easily earned back.',
    'The agreement between {actor} and {target} lies in ruins. Words spoken in good faith have been revealed as hollow.',
    '{actor} has betrayed the terms of their accord with {target}. The consequences ripple outward like cracks in ice.',
    'What was sworn between {actor} and {target} has been forsaken. The world remembers who broke faith first.',
  ],

  wealth_tier_up: [
    '{actor} has risen to {tierLabel}. {flavor}',
    'Fortune favors {actor} — they have ascended to {tierLabel}. {flavor}',
    'The ledgers tell the story: {actor} has climbed to {tierLabel}. {flavor}',
    '{actor}\'s wealth grows. They stand now among the {tierLabel}. {flavor}',
  ],

  wealth_tier_down: [
    '{actor} has fallen to {tierLabel}. {flavor}',
    'Misfortune dogs {actor} — they have sunk to {tierLabel}. {flavor}',
    'The ledgers do not lie: {actor} has fallen to {tierLabel}. {flavor}',
    '{actor}\'s fortunes crumble. They count themselves among the {tierLabel} now. {flavor}',
  ],
};

// ─── Wealth Tier Flavor ─────────────────────────────────────────────────────

/**
 * Tier-appropriate flavor text appended to wealth change chronicles.
 * Multiple variants per tier for PRNG selection.
 */
export const WEALTH_TIER_FLAVOR: Record<string, string[]> = {
  Magnate: [
    'Their vaults overflow, and the powerful come calling.',
    'Kings and merchants alike seek their counsel — and their coin.',
    'Wealth beyond measure, and the influence to match.',
  ],
  Wealthy: [
    'Comfort surrounds them, and opportunity beckons at every turn.',
    'They eat well, dress well, and sleep without worry.',
    'The good life has found them, though keeping it is another matter.',
  ],
  Comfortable: [
    'Enough to plan ahead. Enough to breathe easy, most days.',
    'Not rich, but secure — a rarer thing than most realize.',
    'The ledger balances. For now, that is enough.',
  ],
  'Getting by': [
    'Every coin is counted twice before it is spent.',
    'They make do. They always have. But the margin grows thinner.',
    'Survival, not prosperity, is the measure of each day.',
  ],
  Destitute: [
    'The cupboard is bare, and the future holds nothing certain.',
    'They own nothing but what they carry and what they owe.',
    'Rock bottom — or close enough to feel the stone beneath their knees.',
  ],
};

// ─── Guild Founding Flavor ──────────────────────────────────────────────────

/**
 * Flavor fragments for guild founding chronicles, keyed by guild type.
 */
export const GUILD_FOUNDING_FLAVOR: Record<string, string[]> = {
  miners: [
    'the sound of picks echoes beneath the stone',
    'dust and determination fill their ranks',
    'they know every vein and every shadow below',
  ],
  artisans: [
    'every surface bears the mark of careful hands',
    'the smell of lacquer and sawdust hangs in the air',
    'they shape raw material into something greater',
  ],
  traders: [
    'the hall buzzes with negotiation and rumor',
    'coin changes hands faster than conversation',
    'they know the price of everything and the value of most',
  ],
  bankers: [
    'the counting house keeps its own quiet counsel',
    'ledgers outnumber people behind these walls',
    'trust is measured in interest rates and collateral',
  ],
  merchants: [
    'the guild sits at the crossroads of commerce',
    'their networks stretch further than any road',
    'they traffic in goods, gossip, and goodwill alike',
  ],
};
