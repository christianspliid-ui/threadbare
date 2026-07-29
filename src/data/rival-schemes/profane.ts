/**
 * Profane scheme family (THR-621) — the rival who bleeds your holdings.
 *
 * Arc: sound the ground → open the drain → press the wound → profane the source.
 * Where the economic family (THR-619) starves the mortals who worship you, this
 * one goes at the well itself. It is the only scheme family that acts directly on
 * something the player owns, which is what makes it the sharpest one: the loss
 * shows up in the income line before it shows up in the prose.
 *
 * Rides the essence-source substrate (THR-611): the beats set `contestedBy` and
 * then `desecrated` on the source bag, and every downstream consequence — the tier
 * flip, the leaked income, the per-tick sanctity bleed, the ×0 yield — is already
 * shipped and simply follows. The family is **ineligible** until the player
 * actually holds a contestable source (`requiresPlayerSource`), so it never
 * launches into an empty portfolio and no-ops.
 *
 * The middle beat is the counter-play surface. `open-the-drain` sets the flag; the
 * shipped Defend (Ward) leg clears it. Ward the source before the crack lands and
 * `desecrate_source` finds nothing to profane — the arc breaks on the player's
 * response, which is the whole point of giving it four beats instead of one.
 *
 * Prose is the plainspoken-Malazan baseline register (THR-609): the drain is
 * patient and physical, and the prose stays plain about it. The lift is rationed
 * to the crack beat, which is the only one in the divine voice — because that is
 * the beat the player feels as a god, not as a landlord.
 */
import type { RivalSchemeFamily } from './types';
import { RIVAL_SCHEME_PROFANE_MIN_TIER } from '../rival-scheme-config';

export const PROFANE_FAMILY: RivalSchemeFamily = {
  id: 'profane',
  label: 'Profanation',
  // Any temperament will bleed a rival god's well, given the opening.
  eligibleBehaviors: ['aggressive', 'subtle', 'territorial', 'expansionist'],
  sphereLean: ['entropy', 'darkness'],
  minTier: RIVAL_SCHEME_PROFANE_MIN_TIER,
  requiresTarget: true,
  requiresPlayerSource: true,
  beats: [
    {
      phaseId: 'sound-the-ground',
      move: 'rumor',
      voice: 'mortal',
      proseVariants: [
        'Someone has been walking the ground around {location} at odd hours, counting paces and marking stones. {rival} wants to know how deep the thing runs before it starts.',
        'The keepers at {location} report nothing missing and nothing broken, only a sense of having been measured. {rival} has taken the measurement and gone away again.',
        'For a season nothing happens at {location} at all. That is {rival} being careful, and careful is worse than loud.',
      ],
    },
    {
      phaseId: 'open-the-drain',
      move: 'contest_source',
      voice: 'mortal',
      proseVariants: [
        'Whatever {location} was giving, it gives less of it now. {rival} has opened something under the source and left it open, and it will not close on its own.',
        'The offerings at {location} come back thinner than they went in. {rival} is taking its share off the top, and the take grows the longer nobody stops it.',
        'There is a wound in {location} now. {rival} made it small on purpose — small enough to ignore, and it is counting on being ignored.',
      ],
    },
    {
      phaseId: 'press-the-wound',
      move: 'escalate',
      voice: 'mortal',
      proseVariants: [
        'The drain at {location} widens. {rival} is not hurrying; it does not need to hurry, and it can see that nothing has come to stop it.',
        'What was a trickle out of {location} is a steady run now. {rival} spent the season pressing, and the ground gave.',
        'The keepers at {location} have stopped pretending it will pass. {rival} pushes a little harder each week, and each week the source answers a little weaker.',
      ],
    },
    {
      phaseId: 'profane-the-source',
      move: 'desecrate_source',
      voice: 'divine',
      proseVariants: [
        'The source at {location} goes cold in your hands. {rival} bled it to the bottom and then fouled what was left, so that even the memory of it will not serve you. Nothing comes from there now.',
        'You reach for {location} and find nothing reaching back. {rival} did not merely take the flow — it profaned the well, and a profaned well gives to no one until it is cleansed.',
        '{rival} finishes with {location} the way a patient thing finishes: completely. The source is desecrated, its yield is not yours, and it will stay that way until you go and take it back.',
      ],
    },
  ],
};
