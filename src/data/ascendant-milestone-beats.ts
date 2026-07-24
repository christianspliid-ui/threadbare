/**
 * Milestone Beat content — god-side breadth beats (THR-613, plan §4.2, Slice 2b).
 *
 * Where a Deepening beat marks **Axis A** (your reach got *deeper* — a Domain Capability
 * tier crossing, `ascendant-deepening-beats.ts`), a Milestone beat marks **Axis B**: your
 * palette got *wider*. It fires when the god's holdings in the world cross a threshold
 * worth naming, and — unlike a Deepening — it **grants a card**, because breadth is
 * exactly the axis where a new verb is the honest reward.
 *
 * The one milestone in v1 is the essence-source milestone: it hooks THR-611's shipped
 * source model (`essenceSources.ts`) rather than inventing a trigger system, firing at
 * `MILESTONE_SOURCES_FOR_BEAT` controlled sources **or** the first `flowering` source
 * (`MILESTONE_FLOWERING_FOR_BEAT`) — whichever the god reaches first. Detection and
 * enqueue live in `phaseAscendantProgression`, which already owns the Director's
 * `pending` slot and runs immediately before it (so the beat preempts the cadence draw
 * with zero Director change — the mutex-safe seam).
 *
 * GRANT NOTE — why `loc.open_markets`, and why this is not a fake reveal.
 * Slice 2's Deepening beats deliberately grant nothing: the only reach-gated cards are the
 * eight signatures, already handed out by the acquisition beats, so re-offering one would
 * lie about a card the god already holds. The milestone does not have that problem. The
 * five source verbs are all granted together by `beat.pool.invest.the_wellspring`, so they
 * are out — but `loc.open_markets` is a shipped, fully-implemented, ascendant-facing,
 * Gold-reach economy card (prosperity up, unrest down; real prose; real cost) that **no
 * beat grants and no starter floor reveals** (the floor is empty since THR-501). It is
 * therefore unreachable today: a real capability the player can never fire. Granting it
 * here is a genuine widening of the palette, thematically exact (you have made the world
 * yield to you; now you can make it *trade*), and reuses shipped content rather than
 * authoring a new verb. See `ASCENDANT_ACTION_BUCKETS` for its `unlockable-generic`
 * bucket: `reach: 'gold'` is the card's cosmic-energy axis, not a `requiresReach` gate,
 * so it surfaces for every run once unlocked — correct for a breadth card, which by
 * definition reaches *outside* the two permanent domains.
 *
 * VOICE (THR-609 plain register). Second-person, player-as-god, indirect intervention.
 * Deterministic and identical every run, so the prose carries no `enrichProse`
 * placeholders and never counts ("three sources", "+1 card") — the growth is narrated.
 */

import type { BeatDefinition } from '../types/ascendantBeat';
import {
  MILESTONE_SOURCE_BEAT_ID,
  MILESTONE_COMPANY_BEAT_ID,
} from './player-progression';
import type { SpineBeatPresentation } from './ascendant-beat-content';

/**
 * The milestone (breadth) beats. `kind: 'milestone'`; enqueued directly by
 * `phaseAscendantProgression` on a holdings threshold, never drawn from the cadence pool
 * (hence no `weight` and no `BEAT_KIND_WEIGHTS` entry — that map is `Partial`). No
 * `templateId`: the presentation is the authored map below, not an `enrichProse`
 * template. `trigger` is `{ kind: 'turn' }` so a `__DEBUG.fireBeat` force-offer is
 * unconditional. `identity.sphere: 'order'` matches the granted card's `sphereAffinity`.
 */
export const ASCENDANT_MILESTONE_BEATS: readonly BeatDefinition[] = [
  {
    beatId: MILESTONE_SOURCE_BEAT_ID,
    kind: 'milestone',
    trigger: { kind: 'turn' },
    identity: { reach: 'gold', sphere: 'order' },
    // THR-616 P2: the same milestone that hands over `loc.open_markets` also
    // grants the two first divine *economic* verbs — Bless the Harvest and Blight
    // — because this is the moment the world's livelihoods enter the player's
    // hands ("a god who holds ground can lean on the ground"), for good or ill.
    // Both were shipped-but-unreachable (no beat granted them, the THR-501 floor
    // is empty), exactly the orphan case the open_markets grant note describes.
    // NOTE (design): a dedicated economy-onset beat — e.g. keyed to the P1
    // livelihood tug (a threaded agent's home crossing into Famine/Glut) — would
    // frame these more precisely than the order-themed source milestone; folding
    // them in here is the additive reachability fix, re-homing is a later refinement.
    grantsActionIds: [
      'loc.open_markets', 'loc.bless_harvest', 'loc.blight',
      // THR-618 P4: the remaining divine economic verbs ride the same
      // livelihoods-in-hand moment (beat grants, never starter:true).
      'loc.reveal_vein', 'loc.guide_caravan', 'loc.sour_mine',
    ],
  },
  {
    // THR-74: the company milestone. Enqueued by `phaseAscendantProgression` the first
    // time a threaded company exists — the moment loose bonded mortals gather into a
    // band. `identity.sphere: 'spirit'` matches `company.bless`'s sphereAffinity, so the
    // beat and its granted card share a register. `trigger` is `{ kind: 'turn' }` so a
    // `__DEBUG.fireBeat` force-offer is unconditional, like the source milestone.
    beatId: MILESTONE_COMPANY_BEAT_ID,
    kind: 'milestone',
    trigger: { kind: 'turn' },
    identity: { reach: 'heart', sphere: 'spirit' },
    grantsActionIds: ['company.bless'],
  },
];

/** Look a milestone beat up by id. Null when the id is not a milestone beat. */
export function getMilestoneBeatById(beatId: string): BeatDefinition | null {
  return ASCENDANT_MILESTONE_BEATS.find(b => b.beatId === beatId) ?? null;
}

/**
 * Authored presentation per milestone beat, keyed by `beatId`. Slice 3's modal wiring
 * reads this in place of the generic `KIND_PRESENTATION.milestone` copy (the same
 * arrangement `DEEPENING_BEAT_PRESENTATION` has). Plain register: the vignette names what
 * the god's sources have *become* and hands over the market verb as its consequence.
 */
export const MILESTONE_BEAT_PRESENTATION: Readonly<Record<string, SpineBeatPresentation>> = {
  [MILESTONE_SOURCE_BEAT_ID]: {
    eyebrow: 'A Wellspring',
    title: 'What Your Holdings Have Become',
    prose:
      'The places you took have stopped merely belonging to you and started paying you back. Pilgrims wear a path to them; keepers argue over who tends them; the roads between them are busier than the roads around them. A god who holds ground can lean on the ground. A god whose ground is wanted can lean on everyone who wants it — and there is a square, in some town below, that has been waiting for you to notice what it could be.',
    cta: 'Receive',
  },
  [MILESTONE_COMPANY_BEAT_ID]: {
    eyebrow: 'A Company',
    title: 'The Bonds You Followed Have Gathered',
    prose:
      'Somewhere on the road below, mortals you have watched found each other and chose to travel as one. They share a fire now, and a name, and the small quarrels of people who have thrown their lots together. A band is a fragile thing — one bitter league can scatter it — but it is also a thing a god can bless, and a blessing on a company is a blessing on every road they will walk while it holds.',
    cta: 'Receive',
  },
};

/**
 * The chronicle line written when the essence-source milestone fires (plan §4.3).
 * One sentence, plain register. Consumed by `phaseAscendantProgression` at the enqueue
 * point, so chronicle ↔ milestone beat stay 1:1.
 */
export function milestoneChronicleProse(beatId: string): string {
  if (beatId === MILESTONE_SOURCE_BEAT_ID) {
    return 'Your wellsprings came into their own. What you had only held, you now draw upon — and the world began to trade on the strength of it.';
  }
  if (beatId === MILESTONE_COMPANY_BEAT_ID) {
    return 'The mortals you followed gathered into a company and took to the road as one. What binds them is yours to steady now, for as long as the band holds together.';
  }
  // Fail-soft (NFP #4): an un-authored milestone still writes an honest line rather
  // than crashing the phase or printing an id at the player.
  return 'Something you built in the world came into its own.';
}
