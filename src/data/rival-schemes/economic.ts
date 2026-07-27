/**
 * Economic scheme family (THR-619) — the rival who starves you out.
 *
 * Arc: sour the mines → corner the grain → break the guild → starve the
 * faithful. The rival never draws a sword. It moves stocks and cuts conduits,
 * and the reach goes hungry and quiet on its own.
 *
 * Rides the Mortal Economy P1 substrate (THR-615): the beats read and drain
 * `location.properties.resources[*].quantity` and sever `trades_with` routes.
 * The family is **ineligible** until that substrate exists (`requiresStocks`),
 * so it simply never launches in a world without seeded stocks — fail-soft, per
 * the plan's family-eligibility table.
 *
 * The `break-guild` beat carries the Flow Web nervous-system coupling: severing
 * a route does not only impoverish the region, it **blinds** the player there.
 * Economic attack degrades the intelligence picture (see `sever_route` in
 * `phaseRivalActions`).
 *
 * Prose is the plainspoken-Malazan baseline register (THR-609). Money is dull
 * and patient, and the prose says so; the lift is rationed to the crack beat.
 */
import type { RivalSchemeFamily } from './types';

export const ECONOMIC_FAMILY: RivalSchemeFamily = {
  id: 'economic',
  label: 'Economic Scheme',
  // Any behavior — starvation is a tool every temperament reaches for.
  eligibleBehaviors: ['aggressive', 'subtle', 'territorial', 'expansionist'],
  sphereLean: ['order', 'darkness'],
  minTier: 0,
  requiresTarget: true,
  requiresStocks: true,
  beats: [
    {
      phaseId: 'sour-mines',
      move: 'drain_stock',
      voice: 'mortal',
      proseVariants: [
        'The deep seams under {location} come up poor this season. {rival} has been at the water table, and no one down there knows it yet.',
        'The mines of {location} still run, but the carts come up light. {rival} did that patiently, over weeks, where nobody was counting.',
        'Something has gone wrong in the rock beneath {location}. The diggers blame luck. {rival} is content to let them.',
      ],
    },
    {
      phaseId: 'corner-grain',
      move: 'materialize',
      voice: 'mortal',
      proseVariants: [
        'Every granary within a week of {location} has quietly changed hands. {rival} owns the bread now, and the price of it.',
        "A buyer no one knows has taken the whole harvest around {location}. {rival}'s coin, {rival}'s warehouses, {rival}'s terms.",
        'The grain factors of {location} are all suddenly agreed on a price. {rival} arranged the agreement and left its name off the paper.',
      ],
    },
    {
      phaseId: 'break-guild',
      move: 'sever_route',
      voice: 'mortal',
      proseVariants: [
        'The roads into {location} stop carrying. Caravans find other work, other routes. {rival} broke the guild that held them together, and the reach goes quiet — you hear less from it now.',
        'The trade guild of {location} comes apart in a single ugly season. {rival} bought the half that would sell and ruined the half that would not. What news used to ride with the caravans no longer arrives.',
        'No one runs the road to {location} anymore. {rival} made carrying unprofitable and, by doing it, made the place hard to see.',
      ],
    },
    {
      phaseId: 'starve-faithful',
      move: 'crack',
      voice: 'divine',
      proseVariants: [
        'Your faithful in {location} are praying on empty stomachs, and an empty stomach argues. {rival} never had to say a word against you — it just made sure the food went elsewhere.',
        'They are hungry in {location} tonight, and hunger asks a simple question: what good was the god. {rival} spent a season making that question inevitable.',
        'The offering bowls at {location} hold nothing, because there is nothing to put in them. {rival} did not break your faith. It starved it, which keeps better.',
      ],
    },
  ],
};
