/**
 * Milestone Beat content — god-side Axis-B breadth recognition (THR-613, plan §4.2, Slice 2b).
 *
 * Axis B of the progression spine is *palette breadth* — the god's dominion widening across
 * the world. Where a Deepening beat (`ascendant-deepening-beats.ts`) marks Axis A (a reach
 * growing deeper), a Milestone beat marks a breadth threshold: here, the first time the
 * ascendant's essence-source portfolio (THR-611 Divine Economy) reaches a felt scale —
 * `MILESTONE_SOURCES_FOR_BEAT` controlled sources, or the first source raised to *flowering*.
 *
 * `phaseAscendantProgression` reads the portfolio (`readSourceMilestone`) and, the first tick
 * either threshold trips, enqueues `beat.milestone.sources` into the Director's `pending`
 * slot — one-shot per run (latched by `ascendant.properties.sourceMilestoneFired`). The
 * `ascendantBeat.ts` catalogue lookup (`findBeatDefinition` / `forceOfferBeatById`) consults
 * `ASCENDANT_MILESTONE_BEATS` so the enqueued beat resolves instead of skipping as
 * `missing_template`, and `__DEBUG.fireBeat('beat.milestone.sources')` can force-offer it.
 *
 * GRANT NOTE (plan §4.2 vs. current catalogue). The plan asks a milestone beat to "grant an
 * economy-flavored breadth card." In v1 it grants **no** card — the same honest call the
 * Deepening beats made, for the same reason. The entire source loop (find → claim →
 * consecrate → sanctify → defend) is granted together by `beat.pool.invest.the_wellspring`,
 * and that beat is a hard prerequisite for controlling any source at all — you cannot reach
 * a 3-source / flowering portfolio without already holding every source verb. So any
 * source-verb grant here would be a no-op reveal that lies about a card the god already
 * holds. A genuinely-new *portfolio-tier* economy card (one that acts across the whole
 * portfolio at once — a distinct capability, not a re-grant) needs a new graph op + a
 * balance pass, so it is deferred to TODO(THR-647). The milestone stays prose-first: it
 * surfaces Axis-B breadth on the one dispenser and narrates the god's widening dominion —
 * honest, and never a fake reveal.
 *
 * VOICE (THR-609 plain register). Second-person, player-as-god, indirect (the world tilts
 * toward you; you do not command it). Deterministic and identical every run, so the prose
 * carries no `enrichProse` placeholders and never counts sources — the reach is narrated.
 */

import type { BeatDefinition } from '../types/ascendantBeat';
import { SOURCE_MILESTONE_BEAT_ID } from './player-progression';
import type { SpineBeatPresentation } from './ascendant-beat-content';

/**
 * The single Axis-B essence-source milestone beat. `kind: 'milestone'`; no `identity`
 * (breadth is portfolio-level, orthogonal to the two permanent reaches) and no
 * `grantsActionIds` (see the GRANT NOTE). The `trigger` matters only for a
 * `__DEBUG.fireBeat` force-offer — `{ kind: 'turn' }` so a dev fire is unconditional.
 */
export const ASCENDANT_MILESTONE_BEATS: readonly BeatDefinition[] = [
  {
    beatId: SOURCE_MILESTONE_BEAT_ID,
    kind: 'milestone',
    trigger: { kind: 'turn' },
  },
];

/** Look a milestone beat up by id. Null when the id is not a known milestone beat. */
export function getMilestoneBeatById(beatId: string): BeatDefinition | null {
  return ASCENDANT_MILESTONE_BEATS.find(b => b.beatId === beatId) ?? null;
}

/**
 * Authored presentation for the source milestone, keyed by `beatId`. Slice 3's modal wiring
 * reads this in place of the generic `KIND_PRESENTATION` copy. Plain register (THR-609): it
 * names a *concrete* widening — wells and hallowed ground across the map answering to one
 * hand — without counting sources or promising a card.
 */
export const SOURCE_MILESTONE_PRESENTATION: Readonly<Record<string, SpineBeatPresentation>> = {
  [SOURCE_MILESTONE_BEAT_ID]: {
    eyebrow: 'A Widening',
    title: 'The Springs Answer to You',
    prose:
      'It is no longer one hallowed place but many. Springs and old stones and quiet hollows across the country have turned their faces toward you, and the faith that pools in them runs, now, to a single hand. Mortals who never met and never will find they are praying into the same deep well without knowing its name is yours. This is what it is to hold ground in the world: not one gift, but a tide, gathering.',
    cta: 'Receive',
  },
};

/**
 * The chronicle line written when the source milestone is reached (plan §4.3). One sentence,
 * plain register. Consumed by `phaseAscendantProgression` at the enqueue point (chronicle ↔
 * milestone beat 1:1, exactly as the Deepening chronicle pairs with its beat).
 */
export function sourceMilestoneChronicleProse(): string {
  return 'Your wellsprings became a country. Where once a single place gathered faith for you, now many do, and the tide of it runs to one hand across the map.';
}
