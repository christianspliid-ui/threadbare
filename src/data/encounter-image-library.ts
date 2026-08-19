/**
 * Encounter image library — THR-777 (Nudge Model WS4).
 *
 * The manifest the nudge encounters draw their art from. WS0 put `imageTag` on
 * every `StepNudge`; WS1's authoring spec tells authors to pick tags from "the
 * manifest vocabulary"; WS2's shell left the lookup as a TODO and fell straight
 * through to the EntityVisual gradient+glyph. This module is that vocabulary and
 * that lookup's data.
 *
 * ## Two tables, on purpose
 *
 * `ENCOUNTER_IMAGE_LIBRARY` holds only rows whose art **exists on disk**. A row
 * here is a promise that `path` renders. `scripts/check-image-library.ts` fails
 * the build if one lies.
 *
 * `ENCOUNTER_IMAGE_PLAN` holds the slots that art has **not** been generated for
 * yet. Plan slots are the generation worklist — a batch is finished when its
 * slots have graduated into the library. Keeping them apart is what makes the
 * ticket's "batched and resumable, no orphan files" property mechanical rather
 * than a promise: a planned slot cannot resolve to a broken `<img>`, because it
 * carries no path at all, and an unplanned image cannot sit unregistered,
 * because the checker sweeps both directions.
 *
 * ## The genericity bar (WS1 spec § 7)
 *
 * An image is generic iff it reads correctly in at least
 * `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) *unrelated* encounters, names no
 * entity, and shows no agent-identifying detail. Every generic row states where
 * it clears that bar in `genericity`. Encounter-specific art declares
 * `genericity: null` and is only ever reachable by its exact tag.
 *
 * ## Fate art is keyed by the outcome ladder, not the forecast
 *
 * The ticket said "8 Reaches × 5 bands". The engine's resolved outcome ladder
 * (`StepOutcome`) has **six** bands; the five-valued axis is the *forecast*
 * (doomed…fated), which is shown before the roll. The user verdict this set
 * exists to serve — "a failed Iron encounter must not look like a failed Gold
 * one" — is about what the player sees *after* fate picks, so the key is
 * `ReachDomain × StepOutcome`. `bands` is a list rather than a single value, so
 * a taste pass may point one image at several bands (collapsing, say,
 * `success_at_cost` and `near_miss`) without a schema change. That keeps the
 * final count a tuning decision instead of a structural one.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` § WS4
 * Generation worklist: `Docs/plans/2026-07-28-thr-777-image-generation-plan.md`
 */

import type { SphereName } from '../types';
import type { ReachDomain } from '../types/traits';
import type { StepOutcome } from '../types/unifiedAction';

// ── Tunable constants (NFP #1) ──────────────────────────────────────

/**
 * Genericity bar from the WS1 authoring spec: an image earns a `generic.*` tag
 * only if it reads correctly in at least this many *unrelated* encounters.
 */
export const GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN = 3;

/**
 * Tag-query scoring weights. A query names concepts and optionally a
 * sphere/reach/place; the resolver sums these per candidate row and takes the
 * best. Concept agreement dominates deliberately — sphere and place are
 * *refinements* on an already-apt image, never the reason to pick one.
 */
export const IMAGE_MATCH_WEIGHT_CONCEPT = 10;
export const IMAGE_MATCH_WEIGHT_SPHERE = 4;
export const IMAGE_MATCH_WEIGHT_REACH = 3;
export const IMAGE_MATCH_WEIGHT_PLACE = 2;
export const IMAGE_MATCH_WEIGHT_MOOD = 1;

/**
 * A tag query must clear this score to beat the category generic. One concept
 * agreement (10) clears it; a bare sphere+place coincidence (6) does not — that
 * is the difference between "an image about this" and "an image that happens to
 * share a label".
 */
export const IMAGE_MATCH_MIN_SCORE = 10;

// ── Types ───────────────────────────────────────────────────────────

/**
 * What surface an image is cut for. Aspect ratio follows from the kind:
 * `portrait` is 3:4, everything else is 16:9 (see `EntityVisual`).
 */
export type EncounterImageKind =
  | 'scene'
  | 'nudge'
  | 'fate'
  | 'portrait'
  | 'object';

/** Place archetypes the scene library is organised by. */
export type EncounterImagePlace =
  | 'guild_hall'
  | 'tavern'
  | 'road'
  | 'wilderness'
  | 'siege'
  | 'court'
  | 'market'
  | 'shrine'
  | 'ruin'
  | 'river'
  | 'settlement'
  | 'underground'
  | 'wilds_camp'
  | 'sea';

/** Emotional register, used as a weak refinement signal in tag queries. */
export type EncounterImageMood =
  | 'ominous'
  | 'tense'
  | 'solemn'
  | 'warm'
  | 'triumphal'
  | 'desolate'
  | 'wondrous'
  | 'neutral';

export interface EncounterImageEntry {
  /**
   * The tag. This is the string authors write into `StepNudge.imageTag`, so it
   * is the row's identity — namespaced `generic.*`, `scene.*`, `fate.*`,
   * `portrait.*`, or `<encounter>.*` for specific art.
   */
  readonly id: string;
  /** Public path. Must exist on disk — `check:image-library` enforces it. */
  readonly path: string;
  readonly kind: EncounterImageKind;
  /** Concept vocabulary — the primary match axis. */
  readonly concepts: readonly string[];
  readonly sphere?: SphereName;
  readonly reach?: ReachDomain;
  readonly places?: readonly EncounterImagePlace[];
  readonly mood?: EncounterImageMood;
  /** Outcome bands this image serves. Fate rows only. */
  readonly bands?: readonly StepOutcome[];
  /**
   * Where this image clears the genericity bar, in prose. `null` marks
   * encounter-specific art, which the tag query never returns — only an exact
   * `id` hit reaches it.
   */
  readonly genericity: string | null;
}

/**
 * An un-generated slot. Carries everything the manifest row will carry except
 * `path`, plus the art brief the generation run works from.
 */
export interface EncounterImagePlanSlot {
  readonly id: string;
  readonly kind: EncounterImageKind;
  readonly concepts: readonly string[];
  readonly sphere?: SphereName;
  readonly reach?: ReachDomain;
  readonly places?: readonly EncounterImagePlace[];
  readonly mood?: EncounterImageMood;
  readonly bands?: readonly StepOutcome[];
  readonly genericity: string | null;
  /**
   * The subject, in one line. Fed to the generator on top of the STYLE.md
   * formula (Simonetti oil, chiaroscuro, deep twilight). Image doctrine
   * (settled): agents mostly absent; when present, generic or silhouetted.
   */
  readonly brief: string;
  /** Generation batch. Batches ship in ascending order, one PR each. */
  readonly batch: number;
}

// ── Per-Reach fate metaphor language ────────────────────────────────

/**
 * The metaphor set each Reach's fate images are built from — the thing that
 * makes a failed Iron encounter not look like a failed Gold one. Taste pass
 * pending; the resolver does not read this table, the generation briefs do.
 */
export const FATE_REACH_METAPHORS: Record<ReachDomain, string> = {
  iron: 'steel and shield — an edge, a guard, a braced stance',
  gold: 'coin and scales — weight, balance, the ledger',
  shadow: 'candle and dark — what the light does and does not reach',
  veil: 'mist and mask — a face half-shown, a shape resolving or dissolving',
  heart: 'hearth and hands — warmth held, offered, or withdrawn',
  eye: 'lens and light — focus gathering or scattering',
  stone: 'wall and foundation — courses laid true, or a crack running',
  star: 'sky and omen — a sign read off the dark',
};

// ── The library (art that exists) ───────────────────────────────────

/**
 * Encounter hero art, `public/concept-art/encounters/`. These 19 shipped with
 * the branching encounters and are registered here so the resolver can serve
 * them by tag as well as by each encounter's literal `illustrationUrl`.
 *
 * All are encounter-specific (`genericity: null`) — they name a situation the
 * player recognises, which is exactly what disqualifies them from the generic
 * pool. They are reachable only by exact tag.
 */
const BRANCHING_HERO_ART: readonly EncounterImageEntry[] = [
  {
    id: 'encounter.flawed-steel',
    path: '/concept-art/encounters/flawed-steel.jpg',
    kind: 'scene',
    concepts: ['forge', 'flaw', 'craft', 'blade'],
    reach: 'iron',
    places: ['settlement'],
    mood: 'tense',
    genericity: null,
  },
  {
    id: 'encounter.gate-duty',
    path: '/concept-art/encounters/gate-duty.jpg',
    kind: 'scene',
    concepts: ['gate', 'watch', 'duty', 'threshold'],
    reach: 'iron',
    places: ['settlement'],
    mood: 'tense',
    genericity: null,
  },
  {
    id: 'encounter.pilgrims-offering',
    path: '/concept-art/encounters/pilgrims-offering.jpg',
    kind: 'scene',
    concepts: ['offering', 'pilgrim', 'devotion', 'altar'],
    reach: 'heart',
    places: ['shrine'],
    mood: 'solemn',
    genericity: null,
  },
  {
    id: 'encounter.road-ambush',
    path: '/concept-art/encounters/road-ambush.jpg',
    kind: 'scene',
    concepts: ['ambush', 'road', 'violence', 'surprise'],
    reach: 'iron',
    places: ['road', 'wilderness'],
    mood: 'ominous',
    genericity: null,
  },
  {
    id: 'encounter.shadow-court-audience',
    path: '/concept-art/encounters/shadow-court-audience.jpg',
    kind: 'scene',
    concepts: ['court', 'audience', 'intrigue', 'petition'],
    reach: 'shadow',
    places: ['court'],
    mood: 'ominous',
    genericity: null,
  },
  {
    id: 'encounter.soul-ferryman',
    path: '/concept-art/encounters/soul-ferryman.jpg',
    kind: 'scene',
    concepts: ['crossing', 'death', 'ferry', 'passage'],
    reach: 'veil',
    places: ['river'],
    mood: 'solemn',
    genericity: null,
  },
  {
    id: 'encounter.the-blinded-oracle',
    path: '/concept-art/encounters/the-blinded-oracle.png',
    kind: 'scene',
    concepts: ['oracle', 'prophecy', 'blindness', 'sight'],
    reach: 'star',
    places: ['shrine'],
    mood: 'wondrous',
    genericity: null,
  },
  {
    id: 'encounter.the-executioners-commission',
    path: '/concept-art/encounters/the-executioners-commission.png',
    kind: 'scene',
    concepts: ['execution', 'commission', 'judgement', 'sentence'],
    reach: 'iron',
    places: ['settlement'],
    mood: 'ominous',
    genericity: null,
  },
  {
    id: 'encounter.the-infiltrators-approach',
    path: '/concept-art/encounters/the-infiltrators-approach.webp',
    kind: 'scene',
    concepts: ['infiltration', 'stealth', 'approach', 'trespass'],
    reach: 'shadow',
    places: ['settlement'],
    mood: 'tense',
    genericity: null,
  },
  {
    id: 'encounter.the-jury-of-the-ruined',
    path: '/concept-art/encounters/the-jury-of-the-ruined.png',
    kind: 'scene',
    concepts: ['judgement', 'ruin', 'jury', 'reckoning'],
    reach: 'stone',
    places: ['ruin'],
    mood: 'desolate',
    genericity: null,
  },
  {
    id: 'encounter.the-merchants-favor',
    path: '/concept-art/encounters/the-merchants-favor.webp',
    kind: 'scene',
    concepts: ['bargain', 'favor', 'trade', 'debt'],
    reach: 'gold',
    places: ['market'],
    mood: 'neutral',
    genericity: null,
  },
  {
    id: 'encounter.the-oracle-consulted',
    path: '/concept-art/encounters/the-oracle-consulted.webp',
    kind: 'scene',
    concepts: ['oracle', 'consultation', 'prophecy', 'question'],
    reach: 'star',
    places: ['shrine'],
    mood: 'wondrous',
    genericity: null,
  },
  {
    id: 'encounter.the-renowned-duel',
    path: '/concept-art/encounters/the-renowned-duel.webp',
    kind: 'scene',
    concepts: ['duel', 'renown', 'combat', 'audience'],
    reach: 'iron',
    places: ['settlement'],
    mood: 'tense',
    genericity: null,
  },
  {
    id: 'encounter.the-silent-chamber',
    path: '/concept-art/encounters/the-silent-chamber.png',
    kind: 'scene',
    concepts: ['silence', 'chamber', 'secret', 'vault'],
    reach: 'shadow',
    places: ['underground'],
    mood: 'ominous',
    genericity: null,
  },
  {
    id: 'encounter.the-star-pilgrim',
    path: '/concept-art/encounters/the-star-pilgrim.webp',
    kind: 'scene',
    concepts: ['pilgrimage', 'star', 'omen', 'journey'],
    reach: 'star',
    places: ['wilderness'],
    mood: 'wondrous',
    genericity: null,
  },
  {
    id: 'encounter.the-stones-judgement',
    path: '/concept-art/encounters/the-stones-judgement.jpg',
    kind: 'scene',
    concepts: ['judgement', 'stone', 'endurance', 'verdict'],
    reach: 'stone',
    places: ['ruin'],
    mood: 'solemn',
    genericity: null,
  },
  {
    id: 'encounter.the-unmarked-crossing',
    path: '/concept-art/encounters/the-unmarked-crossing.png',
    kind: 'scene',
    concepts: ['crossing', 'border', 'unmarked', 'passage'],
    reach: 'veil',
    places: ['road', 'river'],
    mood: 'tense',
    genericity: null,
  },
  {
    id: 'encounter.the-veiled-consultation',
    path: '/concept-art/encounters/the-veiled-consultation.jpg',
    kind: 'scene',
    concepts: ['consultation', 'veil', 'secrecy', 'counsel'],
    reach: 'veil',
    places: ['court'],
    mood: 'ominous',
    genericity: null,
  },
  {
    id: 'encounter.warlords-tribute',
    path: '/concept-art/encounters/warlords-tribute.jpg',
    kind: 'scene',
    concepts: ['tribute', 'warlord', 'submission', 'levy'],
    reach: 'iron',
    places: ['court', 'siege'],
    mood: 'ominous',
    genericity: null,
  },
];

/**
 * Terrain plates from `public/concept-art/`, promoted into the library as the
 * wilderness scene generics. These already ship, already read as place-not-event
 * (no agent, no named entity), and cover the outdoor half of the scene library
 * that WS5's road/wilderness families need — so the generation plan does not
 * need to re-make them.
 */
const TERRAIN_SCENE_GENERICS: readonly EncounterImageEntry[] = [
  {
    id: 'scene.wilderness.forest',
    path: '/concept-art/temperate-forest.png',
    kind: 'scene',
    concepts: ['forest', 'wilderness', 'travel', 'cover'],
    places: ['wilderness', 'road'],
    mood: 'neutral',
    genericity:
      'Any wooded-country encounter: a road-side halt, a forage, a tracking scene.',
  },
  {
    id: 'scene.wilderness.deep-forest',
    path: '/concept-art/dense-forest.png',
    kind: 'scene',
    concepts: ['forest', 'depth', 'wilderness', 'lost'],
    places: ['wilderness'],
    mood: 'ominous',
    genericity:
      'Any encounter where the woods themselves are the pressure: losing a trail, a hunt, an ambush.',
  },
  {
    id: 'scene.wilderness.mountains',
    path: '/concept-art/mountains.png',
    kind: 'scene',
    concepts: ['mountain', 'height', 'passage', 'hardship'],
    places: ['wilderness', 'road'],
    mood: 'desolate',
    genericity:
      'Any high-country encounter: a pass crossing, a mine approach, a hermitage.',
  },
  {
    id: 'scene.wilderness.hills',
    path: '/concept-art/hills.png',
    kind: 'scene',
    concepts: ['hills', 'open_country', 'travel', 'vantage'],
    places: ['wilderness', 'road'],
    mood: 'neutral',
    genericity:
      'Any open-country encounter: a herding scene, a march, a watch from a rise.',
  },
  {
    id: 'scene.wilderness.grassland',
    path: '/concept-art/grassland.png',
    kind: 'scene',
    concepts: ['plain', 'open_country', 'travel', 'exposure'],
    places: ['wilderness', 'road'],
    mood: 'neutral',
    genericity:
      'Any lowland-open encounter: a caravan, a muster ground, a chase with nowhere to hide.',
  },
  {
    id: 'scene.wilderness.swamp',
    path: '/concept-art/swamp.png',
    kind: 'scene',
    concepts: ['swamp', 'mire', 'decay', 'concealment'],
    places: ['wilderness', 'river'],
    mood: 'ominous',
    genericity:
      'Any wetland encounter: a bog crossing, a smuggler hide, a plague source.',
  },
  {
    id: 'scene.wilderness.desert',
    path: '/concept-art/desert.png',
    kind: 'scene',
    concepts: ['desert', 'thirst', 'exposure', 'emptiness'],
    places: ['wilderness', 'road'],
    mood: 'desolate',
    genericity:
      'Any arid encounter: a water dispute, a long crossing, a ruin half-buried.',
  },
  {
    id: 'scene.wilderness.tundra',
    path: '/concept-art/tundra.png',
    kind: 'scene',
    concepts: ['cold', 'exposure', 'endurance', 'emptiness'],
    places: ['wilderness', 'road'],
    mood: 'desolate',
    genericity:
      'Any cold-country encounter: a winter march, a shelter sought, a frozen crossing.',
  },
  {
    id: 'scene.wilderness.badlands',
    path: '/concept-art/badlands.png',
    kind: 'scene',
    concepts: ['badlands', 'broken_ground', 'hardship', 'refuge'],
    places: ['wilderness', 'ruin'],
    mood: 'desolate',
    genericity:
      'Any broken-country encounter: a bandit hold, a hard passage, an outcast camp.',
  },
  {
    id: 'scene.wilderness.jungle',
    path: '/concept-art/jungle.png',
    kind: 'scene',
    concepts: ['jungle', 'overgrowth', 'concealment', 'fever'],
    places: ['wilderness'],
    mood: 'ominous',
    genericity:
      'Any deep-growth encounter: an overgrown ruin, a fever camp, a path cut by hand.',
  },
  {
    id: 'scene.wilderness.boreal',
    path: '/concept-art/boreal-forest.png',
    kind: 'scene',
    concepts: ['forest', 'cold', 'timber', 'isolation'],
    places: ['wilderness'],
    mood: 'solemn',
    genericity:
      'Any northern-wood encounter: a logging camp, a trapper line, a shrine in the pines.',
  },
  {
    id: 'scene.sea.open',
    path: '/concept-art/ocean.png',
    kind: 'scene',
    concepts: ['sea', 'voyage', 'storm', 'horizon'],
    places: ['sea'],
    mood: 'wondrous',
    genericity:
      'Any water-voyage encounter: a crossing, a wreck, a sighting from a deck.',
  },
];

// ── Fate art (batch 1, shipped) ─────────────────────────────────────
//
// `ENCOUNTER_IMAGE_LIBRARY` and `ENCOUNTER_IMAGE_CATEGORY_GENERIC` are declared
// below the fate and portrait rows rather than here, because their initializers
// spread `FATE_ART`, which cannot be referenced before `FATE_BANDS` leaves its
// temporal dead zone. Declaration order is never load-bearing for resolution
// (the resolver sorts by score then `id`, NFP #3) — only for module evaluation.

/** Outcome bands, in ladder order. Keys the fate set and generation alike. */
const FATE_BANDS: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

/**
 * Short per-band direction, composed with the Reach metaphor into the brief each
 * shipped fate image was generated from. Retained (and exported) after batch 1
 * because it is the record of *why* each image looks as it does — a taste pass or
 * a regeneration needs the original direction, not a guess at it. The resolver
 * never reads this table.
 */
export const FATE_BAND_DIRECTION: Record<StepOutcome, string> = {
  critical_success: 'the metaphor at its fullest — whole, lit, decisive',
  success: 'the metaphor holding true, unspectacular and sound',
  success_at_cost: 'the metaphor intact but visibly paid for — chipped, scorched, short',
  near_miss: 'the metaphor a hair from true — the gap is the subject',
  failure: 'the metaphor failed plainly — dropped, guttered, unbalanced',
  critical_failure: 'the metaphor broken past repair — shattered, extinguished, scattered',
};

/**
 * The full fate set — 8 Reaches × 6 outcome bands, all generated in batch 1.
 *
 * Keyed on `ReachDomain × StepOutcome` (the resolved ladder), not on the
 * five-valued pre-roll forecast: the verdict this set serves — *a failed Iron
 * encounter must not look like a failed Gold one* — is about what the player sees
 * **after** fate picks.
 *
 * `bands` is a list rather than a single value, so a later taste pass can point
 * one image at several bands (collapsing, say, `success_at_cost` and `near_miss`
 * within a Reach) by editing this table and deleting files — no schema change.
 *
 * Every row is generic by construction: a fate image names no entity and shows no
 * agent at all, so it reads correctly in any encounter that resolves that band in
 * that Reach.
 */
function fateArt(): readonly EncounterImageEntry[] {
  const rows: EncounterImageEntry[] = [];
  for (const reach of Object.keys(FATE_REACH_METAPHORS) as ReachDomain[]) {
    for (const band of FATE_BANDS) {
      rows.push({
        id: `fate.${reach}.${band}`,
        path: `/concept-art/fate/${reach}-${band.replace(/_/g, '-')}.jpg`,
        kind: 'fate',
        concepts: ['fate', 'outcome', reach],
        reach,
        bands: [band],
        genericity: `Every ${reach}-Reach step that resolves ${band}, across all encounters.`,
      });
    }
  }
  return rows;
}

const FATE_ART: readonly EncounterImageEntry[] = fateArt();

/**
 * The approved plain-hooded-traveler baseline (batch 1). Deliberately unspecific
 * — the face is fully shadowed — so it can stand in for any unportrayed agent
 * without ever contradicting a named identity. That is also what makes it the
 * right `portrait` category generic below.
 */
const PORTRAIT_TRAVELER: EncounterImageEntry = {
  id: 'portrait.traveler',
  path: '/concept-art/portraits/traveler.jpg',
  kind: 'portrait',
  concepts: ['traveler', 'portrait', 'archetype'],
  mood: 'neutral',
  genericity:
    'Any unportrayed agent reading as a traveler; deliberately unspecific so it never contradicts a named identity.',
};

/**
 * Nudge-card concept generics — the full set, generated in batch 2 (2026-07-28).
 *
 * These are the tags the exemplar fixture already writes (`generic.focus`,
 * `generic.light`, …) plus the rest of the concept set the WS1 spec's
 * hand-authoring guidance leans on. Every one clears the genericity bar by
 * construction — they name a *kind of divine help*, which is
 * encounter-independent.
 *
 * Every plate is object- or effect-centred per the settled image doctrine. The
 * only figures anywhere in the set are two flat silhouettes — `oath`'s clasped
 * forearms and `vigor`'s hooded traveller — and no face appears in any of them,
 * which is what keeps a nudge card from ever contradicting the agent it is
 * shown beside.
 *
 * The trailing comment on each row is the subject that was generated, kept for
 * a later regeneration or taste pass; the resolver never reads it.
 */
const NUDGE_CONCEPT_ART: readonly EncounterImageEntry[] = [
  ['generic.focus', 'mind', 'focus'], // a hand holding a needle still, the tremor going out of it
  ['generic.light', 'light', 'illumination'], // a guttering lamp waking in a black passage
  ['generic.dark', 'darkness', 'concealment'], // dark closing over an abandoned satchel like water
  ['generic.luck', 'chaos', 'luck'], // a coin on edge, caught before it tips
  ['generic.oath', 'order', 'oath'], // clasped forearms, a tightening knot, a plain wax seal
  ['generic.strength', 'force', 'strength'], // a roof-beam bowing under fallen stone and holding
  ['generic.blessing', 'spirit', 'blessing'], // wisps settling over a plain clay bowl
  ['generic.time-slow', 'time', 'time'], // a water drop hanging, not yet fallen
  ['generic.memory', 'mind', 'memory'], // an old worn notch in a doorpost, surfacing again
  ['generic.ward', 'order', 'ward'], // a poured salt line the dark presses against and does not cross
  ['generic.rumor', 'mind', 'rumor'], // word passing shutter to shutter down an empty street
  ['generic.warmth', 'life', 'warmth'], // hearth-warmth creeping across cold flagstones
  ['generic.vigor', 'life', 'vigor'], // a hooded silhouette straightening, breath rising
  ['generic.decay', 'entropy', 'decay'], // an iron lock corroding through exactly at the shackle
  ['generic.matter', 'matter', 'substance'], // quarried stone opening cleanly under a chisel
  ['generic.energy', 'energy', 'energy'], // a charge gathering at a weathervane's spike
].map(([id, sphere, concept]) => ({
  id: id as string,
  path: `/concept-art/nudge/${(id as string).slice('generic.'.length)}.jpg`,
  kind: 'nudge' as const,
  concepts: [concept as string, 'nudge', 'divine_help'],
  sphere: sphere as SphereName,
  mood: 'wondrous' as const,
  genericity: `Any encounter whose step turns on ${concept}; ${GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN}+ unrelated families use it.`,
}));

/**
 * Situational nudge generics, generated in batch 5 (2026-08-19, THR-1170).
 *
 * `NUDGE_CONCEPT_ART` above names *kinds of divine help* — what the god does.
 * These three name the *situation the nudge reaches into* — what the card is
 * about. The Meet-The-First library authored exactly this trio across all 424 of
 * its nudges (`crowd` ×198, `mercy` ×120, `blade` ×106) before any of them
 * existed, so every card in the game's opening beat fell through to the `nudge`
 * category generic and showed the same plate. That is the defect this batch
 * closes; the vocabulary itself was sound and is kept.
 *
 * **Deliberately no `sphere`, and deliberately no baked magic.** Each of the
 * three spans most of the sphere set — `crowd` alone is authored across time,
 * mind, spirit, matter, order, life and light, and 128 of the 424 nudges carry
 * no sphere at all. Colouring one of these plates with a sphere's thread would
 * assert an intervention the step may not have made, which is the same failure
 * the `nudge` category-generic note below reasons about. Their light is ordinary
 * flame instead, which no card's sphere can contradict.
 *
 * The trailing comment on each row is the subject that was generated, kept for a
 * later regeneration or taste pass; the resolver never reads it.
 */
const SITUATIONAL_NUDGE_ART: readonly EncounterImageEntry[] = [
  [
    'generic.crowd',
    'witness',
    'Any step whose pressure is other people knowing — a council, a testimony, a reading of the record, a room that has to be faced.',
  ], // a ring of hooded backs at the edge of a lamplit yard, the lit ground between them empty
  [
    'generic.mercy',
    'appeal',
    'Any step turning on what could be given to someone in need — water, bread, a bandage, a season of grain.',
  ], // a clay bowl of water, folded linen, a torn loaf and a loosed waterskin on a wet stone step
  [
    'generic.blade',
    'hard_fact',
    'Any step where the unarguable thing itself is the pressure — the tool, the tally, the object under the hand.',
  ], // a plain blade at rest across a scarred oak block, whetstone and rag beside it
].map(([id, concept, genericity]) => ({
  id: id as string,
  path: `/concept-art/nudge/${(id as string).slice('generic.'.length)}.jpg`,
  kind: 'nudge' as const,
  concepts: [concept as string, 'nudge', 'situation'],
  mood: 'tense' as const,
  genericity: genericity as string,
}));

/**
 * Scene generics the terrain plates do not already cover — the built and social
 * places, generated in batch 3 (2026-07-28). The outdoor half is served by
 * `TERRAIN_SCENE_GENERICS` above, which is why this list is 14 rather than the
 * ticket's ~60: promoting shipped terrain art removed most of the wilderness
 * half of that estimate.
 *
 * Every plate is an **unoccupied** place. That is stronger than the library's
 * usual "agents absent or silhouetted" doctrine and it is deliberate: a scene
 * generic is reused across 3+ unrelated encounters, so any figure in it asserts
 * a cast the encounter may contradict. The trade is evidenced by its objects —
 * the market by its scales and stacked goods, the court by its dais and long
 * approach — never by the people who would be using them.
 *
 * The three `settlement`-placed rows (`settlement` / `rebuild` / `aftermath`)
 * were generated as one unit against a shared architecture vocabulary — steep
 * shingled roofs, timber-and-daub, a palisade gate — so they read as the same
 * kind of place in three states rather than three unrelated villages.
 *
 * The trailing comment on each row is the subject that was generated, kept for a
 * later regeneration or taste pass; the resolver never reads it.
 */
const BUILT_SCENE_GENERICS: readonly EncounterImageEntry[] = [
  ['scene.guild_hall', 'guild_hall', 'solemn'], // benches, a peg-and-cord tally board, one trade's tools, a single lamp
  ['scene.tavern', 'tavern', 'warm'], // hearth fire, chairs pushed back, tankards left, barrels along the wall
  ['scene.market', 'market', 'neutral'], // stalls under sagging awnings, brass balance, goods stacked, two lanterns
  ['scene.court', 'court', 'tense'], // a long flagged approach to a small distant dais, one hard clerestory shaft
  ['scene.shrine', 'shrine', 'solemn'], // a hollowed offering shelf, votive flames, incense column, dulled coins
  ['scene.ruin', 'ruin', 'desolate'], // fallen courses, ivy split through the joints, one arch still standing
  ['scene.siege', 'siege', 'ominous'], // engines under canvas, approach trench, watch-fires, the wall unbreached
  ['scene.road', 'road', 'neutral'], // water standing in the ruts, an uninscribed marker stone, weather coming
  ['scene.river', 'river', 'tense'], // a roped-off ferry raft, guide rope sagging, water breaking white over the ford
  ['scene.settlement', 'settlement', 'neutral'], // palisade gate open, smoke straight from the chimneys, two lit windows
  ['scene.underground', 'underground', 'ominous'], // hand-cut passage, square-set props, one lamp, the dark closing past it
  ['scene.wilds_camp', 'wilds_camp', 'tense'], // banked embers, packs and bedroll, open country going black around it
  ['scene.rebuild', 'settlement', 'warm'], // fresh pale scaffold raised against a burnt shell, a work-fire still going
  ['scene.aftermath', 'settlement', 'desolate'], // trampled square, a tipped basket, open dark doors, torches left guttering
].map(([id, place, mood]) => ({
  id: id as string,
  path: `/concept-art/scene/${(id as string).slice('scene.'.length)}.jpg`,
  kind: 'scene' as const,
  concepts: [(id as string).split('.')[1], 'place'],
  places: [place as EncounterImagePlace],
  mood: mood as EncounterImageMood,
  genericity: `Any encounter staged at a ${(place as string).replace('_', ' ')}; the linear template families reuse it across ${GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN}+ unrelated situations.`,
}));

/**
 * Generic archetype portraits, generated in batch 4 (2026-07-28). These extend
 * the plain-hooded-traveler baseline (`PORTRAIT_TRAVELER` above) across the role
 * vocabulary the cast lists draw on; the baseline remains the `portrait` category
 * generic, so an unlisted role still resolves to a real image.
 *
 * **Every archetype's face is a void, and that is the design, not a limitation.**
 * A portrait row is reused for *any* unportrayed agent reading as that role, so a
 * legible face would sooner or later contradict a named agent it is shown beside
 * — the wrong age, the wrong build, a beard the prose says is absent. Each figure
 * is therefore identified entirely by garment and gear, with the head covered
 * (hood, coif, brimmed hat, cowl, shawl) so the shadow is motivated rather than
 * uncanny. This matches the shipped traveler baseline exactly.
 *
 * Deliberately carrying no sphere-coloured thread, though STYLE.md's actor
 * default allows a signature one: a thread would assert a sphere the depicted
 * agent may not hold, which is the same genericity failure as a legible face.
 */
const PORTRAIT_ARCHETYPE_ROLES = [
  'soldier',
  'merchant',
  'priest',
  'scholar',
  'labourer',
  'noble',
  'outlaw',
  'healer',
  'crafter',
  'sailor',
  'farmer',
  'guard',
  'beggar',
  'elder',
  'child',
] as const;

const PORTRAIT_ARCHETYPES: readonly EncounterImageEntry[] =
  PORTRAIT_ARCHETYPE_ROLES.map((role) => ({
    id: `portrait.${role}`,
    path: `/concept-art/portraits/${role}.jpg`,
    kind: 'portrait' as const,
    concepts: [role, 'portrait', 'archetype'],
    mood: 'neutral' as const,
    genericity: `Any unportrayed agent reading as a ${role}; deliberately unspecific so it never contradicts a named identity.`,
  }));

/**
 * The full generation worklist — **empty as of batch 4 (2026-07-28)**: every
 * planned slot has graduated into `ENCOUNTER_IMAGE_LIBRARY`.
 *
 * It stays declared rather than being deleted, because the two-table split is the
 * mechanism that makes future art batches safe: a new slot added here cannot
 * resolve to a broken `<img>` (it carries no path at all), and
 * `check:image-library` sweeps both directions so an unregistered image cannot
 * sit orphaned either. Add slots here to open a new batch; move them across when
 * the art lands.
 */
export const ENCOUNTER_IMAGE_PLAN: readonly EncounterImagePlanSlot[] = [];

// ── The library (declared last; see the note above `FATE_BANDS`) ─────

/**
 * The full library. Ordered by category for readability; the resolver sorts by
 * score and then by `id`, so declaration order is never load-bearing (NFP #3).
 */
export const ENCOUNTER_IMAGE_LIBRARY: readonly EncounterImageEntry[] = [
  ...BRANCHING_HERO_ART,
  ...TERRAIN_SCENE_GENERICS,
  ...BUILT_SCENE_GENERICS,
  ...FATE_ART,
  ...NUDGE_CONCEPT_ART,
  ...SITUATIONAL_NUDGE_ART,
  PORTRAIT_TRAVELER,
  ...PORTRAIT_ARCHETYPES,
];

/**
 * Category fallbacks — the "category generic" rung of the resolve chain. When a
 * tag query finds nothing above `IMAGE_MATCH_MIN_SCORE`, the resolver serves the
 * kind's generic rather than dropping straight to the gradient tile.
 *
 * `fate` has none by design and never will: fate art is keyed on
 * `ReachDomain × StepOutcome` and the set is complete, so the exact-tag rung
 * always hits. A category generic there could only ever serve the *wrong* band —
 * showing a player a shattered blade for a success — which is worse than the
 * honest gradient tile.
 *
 * `nudge` is `generic.blessing` as of batch 2. Of the sixteen concepts it is the
 * only one whose subject is divine help *as such* — something settling over an
 * object, unmistakably given — rather than a particular kind of it. An unknown
 * nudge tag therefore lands on "a god helped here", which is the one thing every
 * nudge card has in common; pointing it at `generic.strength` or `generic.luck`
 * would assert a specific intervention the step may not have made.
 */
export const ENCOUNTER_IMAGE_CATEGORY_GENERIC: Partial<
  Record<EncounterImageKind, string>
> = {
  scene: 'scene.wilderness.hills',
  nudge: 'generic.blessing',
  portrait: 'portrait.traveler',
};
